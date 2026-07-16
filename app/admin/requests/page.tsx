"use client";

import { Check, CheckCircle2, FileClock, SearchCheck } from "lucide-react";
import { useState } from "react";
import { useDemo } from "@/components/demo-provider";
import { PageHeader } from "@/components/page-header";
import { StatusPill } from "@/components/status-pill";

export default function AdminPrivacyRequestsPage() {
  const { dataRequests, candidate, setDataRequestStatus } = useDemo();
  const [message, setMessage] = useState<string | null>(null);
  const update = (requestId: string, status: "in_review" | "completed") => { setDataRequestStatus(requestId, status); setMessage(`${requestId} moved to ${status.replaceAll("_", " ")}.`); };

  return <>
    <PageHeader title="Privacy requests" description="Review consent withdrawal, correction, export, and deletion requests through an auditable admin process." />
    {message ? <div className="toast"><Check size={17} />{message}</div> : null}
    <section className="panel table-panel"><div className="table-wrap"><table><thead><tr><th>Request</th><th>Candidate</th><th>Type</th><th>Submitted</th><th>Status</th><th>Action</th></tr></thead><tbody>{dataRequests.map((request) => <tr key={request.id}><td className="mono">{request.id}</td><td><strong>{candidate.name}</strong><small>Admin-only identity</small></td><td>{request.type.replaceAll("_", " ")}</td><td>{new Date(request.createdAt).toLocaleDateString("en-IN")}</td><td><StatusPill status={request.status} /></td><td><div className="table-actions">{request.status === "submitted" ? <button className="button button-secondary" onClick={() => update(request.id, "in_review")}><SearchCheck size={15} /> Start review</button> : null}{request.status !== "completed" ? <button className="button button-primary" onClick={() => update(request.id, "completed")}><CheckCircle2 size={15} /> Complete</button> : <span className="verified-label"><CheckCircle2 size={14} /> Closed</span>}</div></td></tr>)}</tbody></table>{dataRequests.length === 0 ? <div className="empty-state"><FileClock size={30} /><h3>No privacy requests</h3><p>Candidate requests for export, correction, deletion, or consent withdrawal will appear here.</p></div> : null}</div></section>
  </>;
}
