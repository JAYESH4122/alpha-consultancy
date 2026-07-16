"use client";

import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { initialDemoState } from "@/lib/demo-data";
import { calculateMatches } from "@/lib/matching";
import type { ApplicationStatus, CandidateProfile, DataRequest, DemoState, EmployerVerification, Job, LegalDocument, Role } from "@/lib/types";
import { canReleaseIdentity, canTransitionApplication, canTransitionJob } from "@/lib/workflow";

type DemoContextValue = DemoState & {
  resetDemo: () => void;
  addJob: (job: Job) => void;
  setJobStatus: (jobId: string, status: Job["status"]) => void;
  submitInterest: (jobId: string, screeningAnswers?: string[], consentAccepted?: boolean) => { ok: boolean; message: string };
  setApplicationStatus: (applicationId: string, status: ApplicationStatus) => void;
  grantHandoffConsent: (applicationId: string) => void;
  scheduleInterview: (applicationId: string, date: string, venue: string) => { ok: boolean; message: string };
  updateCandidate: (updates: Partial<CandidateProfile>) => void;
  uploadResume: (file: { name: string; type: string; size: number }) => { ok: boolean; message: string };
  markNotificationRead: (notificationId: string) => void;
  markAllNotificationsRead: (role: Role) => void;
  addScreeningNote: (applicationId: string, note: string) => void;
  setScreeningCheck: (applicationId: string, check: "identity" | "resume" | "eligibility", status: "pending" | "passed" | "failed") => void;
  assignApplication: (applicationId: string, adminName: string) => void;
  updateInterview: (applicationId: string, action: "reschedule" | "complete" | "cancel", date?: string, venue?: string) => { ok: boolean; message: string };
  publishLegalDocument: (document: Omit<LegalDocument, "id" | "status" | "publishedAt">) => void;
  submitDataRequest: (type: DataRequest["type"]) => void;
  setDataRequestStatus: (requestId: string, status: DataRequest["status"]) => void;
  setEmployerVerification: (status: EmployerVerification["status"], notes: string) => void;
};

const STORAGE_KEY = "bridgehire-demo-v4";
const DemoContext = createContext<DemoContextValue | null>(null);

const now = () => new Date().toISOString();

export function DemoProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DemoState>(initialDemoState);
  const hydrated = useRef(false);

  useEffect(() => {
    const hydrationTask = window.setTimeout(() => {
      const stored = window.localStorage.getItem(STORAGE_KEY);
      if (stored) {
        try {
          setState(JSON.parse(stored) as DemoState);
        } catch {
          window.localStorage.removeItem(STORAGE_KEY);
        }
      }
      hydrated.current = true;
    }, 0);
    return () => window.clearTimeout(hydrationTask);
  }, []);

  useLayoutEffect(() => {
    if (!hydrated.current) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  const resetDemo = useCallback(() => setState(initialDemoState), []);

  const updateCandidate = useCallback((updates: Partial<CandidateProfile>) => {
    setState((current) => {
      const candidate = { ...current.candidate, ...updates };
      return {
        ...current,
        candidate,
        matches: calculateMatches(current.jobs, candidate),
        auditEvents: [{ id: crypto.randomUUID(), action: "Candidate profile updated", target: candidate.id, actor: candidate.name, createdAt: now() }, ...current.auditEvents],
      };
    });
  }, []);

  const uploadResume = useCallback((file: { name: string; type: string; size: number }) => {
    const allowed = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!allowed.includes(file.type)) return { ok: false, message: "Upload a PDF or DOCX resume." };
    if (file.size > 10 * 1024 * 1024) return { ok: false, message: "Resume must be 10 MB or smaller." };
    updateCandidate({ resumeName: file.name, profileCompletion: Math.max(state.candidate.profileCompletion, 92) });
    return { ok: true, message: `${file.name} is ready for private admin screening.` };
  }, [state.candidate.profileCompletion, updateCandidate]);

  const markNotificationRead = useCallback((notificationId: string) => {
    setState((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.id === notificationId ? { ...notification, read: true } : notification) }));
  }, []);

  const markAllNotificationsRead = useCallback((role: Role) => {
    setState((current) => ({ ...current, notifications: current.notifications.map((notification) => notification.role === role ? { ...notification, read: true } : notification) }));
  }, []);

  const addJob = useCallback((job: Job) => {
    setState((current) => ({
      ...current,
      jobs: [job, ...current.jobs],
      notifications: [
        {
          id: `notification-${crypto.randomUUID()}`,
          role: "admin",
          title: "New job needs review",
          body: `${job.reference} was submitted by an employer.`,
          createdAt: now(),
          read: false,
        },
        ...current.notifications,
      ],
      auditEvents: [
        { id: crypto.randomUUID(), action: "Job submitted", target: job.reference, actor: "Demo Employer", createdAt: now() },
        ...current.auditEvents,
      ],
    }));
  }, []);

  const setJobStatus = useCallback((jobId: string, status: Job["status"]) => {
    setState((current) => {
      const previousJob = current.jobs.find((item) => item.id === jobId);
      if (!previousJob || previousJob.status === status || !canTransitionJob(previousJob.status, status)) return current;
      const jobs = current.jobs.map((job) => (job.id === jobId ? { ...job, status } : job));
      const job = jobs.find((item) => item.id === jobId);
      const matches = calculateMatches(jobs, current.candidate);
      const newlyMatched = status === "approved" && previousJob?.status !== "approved" ? matches.find((match) => match.jobId === jobId) : undefined;
      return {
        ...current,
        jobs,
        matches,
        notifications: newlyMatched && job
          ? [{ id: crypto.randomUUID(), role: "candidate", title: "A new job matches your profile", body: `${job.title} in ${job.workArea} is now available.`, createdAt: now(), read: false }, ...current.notifications]
          : current.notifications,
        auditEvents: job
          ? [{ id: crypto.randomUUID(), action: `Job ${status.replaceAll("_", " ")}`, target: job.reference, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents]
          : current.auditEvents,
      };
    });
  }, []);

  const submitInterest = useCallback((jobId: string, screeningAnswers: string[] = [], consentAccepted = false) => {
    if (!state.candidate.resumeName) return { ok: false, message: "Upload a resume before showing interest." };
    if (!state.candidate.termsAccepted) return { ok: false, message: "Accept the current Candidate Terms and Privacy Notice before showing interest." };
    if (state.applications.some((application) => application.jobId === jobId && application.status !== "withdrawn")) {
      return { ok: false, message: "You already showed interest in this job." };
    }
    const job = state.jobs.find((item) => item.id === jobId);
    if (!job || job.status !== "approved") return { ok: false, message: "This job is no longer available." };
    if (!consentAccepted) return { ok: false, message: "Application Consent v1.0 must be accepted." };
    if (job.screeningQuestions.length && (screeningAnswers.length !== job.screeningQuestions.length || screeningAnswers.some((answer) => !answer.trim()))) return { ok: false, message: "Answer every required screening question." };

    const applicationId = `application-${crypto.randomUUID()}`;
    setState((current) => ({
      ...current,
      applications: [{
        id: applicationId,
        reference: `APP-${String(current.applications.length + 1042)}`,
        jobId,
        candidateId: current.candidate.id,
        status: "interest_submitted",
        submittedAt: now(),
        consentVersion: "application-consent-v1.0",
        handoffConsent: false,
        employerDataUseAccepted: true,
        identityReleased: false,
        adminNotes: [],
        screeningAnswers,
        assignedTo: "Unassigned",
        screeningChecks: { identity: "pending", resume: "pending", eligibility: "pending" },
      }, ...current.applications],
      notifications: [{ id: crypto.randomUUID(), role: "admin", title: "Candidate interest needs screening", body: `A candidate showed interest in ${job.reference}.`, createdAt: now(), read: false }, ...current.notifications],
      auditEvents: [{ id: crypto.randomUUID(), action: "Interest submitted", target: job.reference, actor: "Candidate · identity protected", createdAt: now() }, ...current.auditEvents],
    }));
    return { ok: true, message: "Interest submitted. Our recruitment team will review your profile." };
  }, [state.applications, state.candidate.resumeName, state.candidate.termsAccepted, state.jobs]);

  const setApplicationStatus = useCallback((applicationId: string, status: ApplicationStatus) => {
    setState((current) => {
      const application = current.applications.find((item) => item.id === applicationId);
      if (!application || application.status === status || !canTransitionApplication(application.status, status)) return current;
      const job = application ? current.jobs.find((item) => item.id === application.jobId) : undefined;
      const candidateNotice = application && job ? {
        id: crypto.randomUUID(), role: "candidate" as const,
        title: status === "needs_information" ? "More information required" : "Application status updated",
        body: `${job.title} moved to ${status.replaceAll("_", " ")}.`, createdAt: now(), read: false,
      } : null;
      return {
        ...current,
        applications: current.applications.map((item) => item.id === applicationId ? { ...item, status } : item),
        notifications: candidateNotice ? [candidateNotice, ...current.notifications] : current.notifications,
        auditEvents: [{ id: crypto.randomUUID(), action: `Application moved to ${status.replaceAll("_", " ")}`, target: applicationId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
      };
    });
  }, []);

  const addScreeningNote = useCallback((applicationId: string, note: string) => {
    const cleanNote = note.trim();
    if (!cleanNote) return;
    setState((current) => ({
      ...current,
      applications: current.applications.map((application) => application.id === applicationId ? { ...application, adminNotes: [...application.adminNotes, cleanNote] } : application),
      auditEvents: [{ id: crypto.randomUUID(), action: "Private screening note added", target: applicationId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const setScreeningCheck = useCallback((applicationId: string, check: "identity" | "resume" | "eligibility", status: "pending" | "passed" | "failed") => {
    setState((current) => ({
      ...current,
      applications: current.applications.map((application) => application.id === applicationId ? { ...application, screeningChecks: { ...application.screeningChecks, [check]: status } } : application),
      auditEvents: [{ id: crypto.randomUUID(), action: `${check} check ${status}`, target: applicationId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const assignApplication = useCallback((applicationId: string, adminName: string) => {
    setState((current) => ({
      ...current,
      applications: current.applications.map((application) => application.id === applicationId ? { ...application, assignedTo: adminName } : application),
      auditEvents: [{ id: crypto.randomUUID(), action: `Case assigned to ${adminName}`, target: applicationId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const grantHandoffConsent = useCallback((applicationId: string) => {
    setState((current) => ({
      ...current,
      applications: current.applications.map((application) => application.id === applicationId && application.status === "interview_ready" ? { ...application, handoffConsent: true } : application),
      auditEvents: [{ id: crypto.randomUUID(), action: "Candidate granted handoff consent", target: applicationId, actor: current.candidate.name, createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const scheduleInterview = useCallback((applicationId: string, date: string, venue: string) => {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application || !canReleaseIdentity(application)) {
      return { ok: false, message: "Interview-ready status, passed screening checks, candidate consent, and employer data-use acceptance are required." };
    }
    setState((current) => ({
      ...current,
      applications: current.applications.map((item) => item.id === applicationId ? { ...item, status: "interview_scheduled", identityReleased: true, interviewAt: date, interviewVenue: venue, interviewStatus: "scheduled" } : item),
      notifications: [
        { id: crypto.randomUUID(), role: "candidate", title: "Interview scheduled", body: `Your interview is confirmed for ${new Date(date).toLocaleString("en-IN")}.`, createdAt: now(), read: false },
        { id: crypto.randomUUID(), role: "employer", title: "Candidate interview scheduled", body: "Candidate details are now available in the controlled handoff record.", createdAt: now(), read: false },
        ...current.notifications,
      ],
      auditEvents: [{ id: crypto.randomUUID(), action: "Interview handoff released", target: applicationId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
    return { ok: true, message: "Interview scheduled and identities released to both parties." };
  }, [state.applications]);

  const updateInterview = useCallback((applicationId: string, action: "reschedule" | "complete" | "cancel", date?: string, venue?: string) => {
    const application = state.applications.find((item) => item.id === applicationId);
    if (!application?.identityReleased) return { ok: false, message: "The interview handoff has not been released." };
    if (action === "reschedule" && (!date || !venue)) return { ok: false, message: "A new date and venue are required." };
    setState((current) => ({
      ...current,
      applications: current.applications.map((item) => item.id === applicationId ? {
        ...item,
        status: action === "complete" ? "interview_completed" : action === "cancel" ? "interview_ready" : "interview_scheduled",
        interviewStatus: action === "complete" ? "completed" : action === "cancel" ? "cancelled" : "rescheduled",
        interviewAt: action === "reschedule" ? date : item.interviewAt,
        interviewVenue: action === "reschedule" ? venue : item.interviewVenue,
      } : item),
      notifications: [
        { id: crypto.randomUUID(), role: "candidate", title: `Interview ${action === "reschedule" ? "rescheduled" : action === "complete" ? "completed" : "cancelled"}`, body: action === "reschedule" ? `New interview time: ${new Date(date!).toLocaleString("en-IN")}.` : "Your official application timeline has been updated.", createdAt: now(), read: false },
        { id: crypto.randomUUID(), role: "employer", title: `Interview ${action}`, body: "The controlled interview record has been updated.", createdAt: now(), read: false },
        ...current.notifications,
      ],
      auditEvents: [{ id: crypto.randomUUID(), action: `Interview ${action}`, target: applicationId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
    return { ok: true, message: `Interview ${action === "reschedule" ? "rescheduled" : action === "complete" ? "completed" : "cancelled"}.` };
  }, [state.applications]);

  const publishLegalDocument = useCallback((document: Omit<LegalDocument, "id" | "status" | "publishedAt">) => {
    setState((current) => ({
      ...current,
      legalDocuments: [{ ...document, id: crypto.randomUUID(), status: "published", publishedAt: now() }, ...current.legalDocuments],
      auditEvents: [{ id: crypto.randomUUID(), action: "Legal document version published", target: `${document.name} ${document.version}`, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const submitDataRequest = useCallback((type: DataRequest["type"]) => {
    setState((current) => ({
      ...current,
      dataRequests: [{ id: `REQ-${String(current.dataRequests.length + 1001)}`, type, status: "submitted", createdAt: now() }, ...current.dataRequests],
      notifications: [{ id: crypto.randomUUID(), role: "admin", title: "New privacy request", body: `A candidate submitted a ${type.replaceAll("_", " ")} request.`, createdAt: now(), read: false }, ...current.notifications],
      auditEvents: [{ id: crypto.randomUUID(), action: "Privacy request submitted", target: type, actor: current.candidate.name, createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const setDataRequestStatus = useCallback((requestId: string, status: DataRequest["status"]) => {
    setState((current) => ({
      ...current,
      dataRequests: current.dataRequests.map((request) => request.id === requestId ? { ...request, status } : request),
      notifications: [{ id: crypto.randomUUID(), role: "candidate", title: "Privacy request updated", body: `${requestId} moved to ${status.replaceAll("_", " ")}.`, createdAt: now(), read: false }, ...current.notifications],
      auditEvents: [{ id: crypto.randomUUID(), action: `Privacy request ${status.replaceAll("_", " ")}`, target: requestId, actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const setEmployerVerification = useCallback((status: EmployerVerification["status"], notes: string) => {
    setState((current) => ({
      ...current,
      employerVerification: { status, notes, updatedAt: now() },
      notifications: [{ id: crypto.randomUUID(), role: "employer", title: "Employer verification updated", body: `Organization verification is ${status.replaceAll("_", " ")}.`, createdAt: now(), read: false }, ...current.notifications],
      auditEvents: [{ id: crypto.randomUUID(), action: `Employer verification ${status}`, target: "ORG-1092", actor: "Priya · Admin", createdAt: now() }, ...current.auditEvents],
    }));
  }, []);

  const value = useMemo(() => ({ ...state, resetDemo, addJob, setJobStatus, submitInterest, setApplicationStatus, grantHandoffConsent, scheduleInterview, updateCandidate, uploadResume, markNotificationRead, markAllNotificationsRead, addScreeningNote, setScreeningCheck, assignApplication, updateInterview, publishLegalDocument, submitDataRequest, setDataRequestStatus, setEmployerVerification }), [state, resetDemo, addJob, setJobStatus, submitInterest, setApplicationStatus, grantHandoffConsent, scheduleInterview, updateCandidate, uploadResume, markNotificationRead, markAllNotificationsRead, addScreeningNote, setScreeningCheck, assignApplication, updateInterview, publishLegalDocument, submitDataRequest, setDataRequestStatus, setEmployerVerification]);
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside DemoProvider");
  return value;
}
