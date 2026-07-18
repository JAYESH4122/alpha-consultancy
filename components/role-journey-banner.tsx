import Link from "next/link";
import { ArrowRight, Building2, Route, ShieldCheck, UserRound } from "lucide-react";
import type { Role } from "@/lib/types";

const roleGuidance = {
  employer: {
    icon: Building2,
    step: "Starts the journey",
    title: "You define the role. Alpha Consultancy manages the connection.",
    description: "Submit a complete job, follow approval, and see employee details only after an approved interview connection.",
  },
  admin: {
    icon: ShieldCheck,
    step: "Controls every gate",
    title: "You verify, screen, consent, and release.",
    description: "Only the admin team can see both sides before an interview is approved.",
  },
  candidate: {
    icon: UserRound,
    step: "Chooses and consents",
    title: "You explore private matches and control identity sharing.",
    description: "Review jobs with company details hidden, show interest, complete screening, and approve sharing for the interview.",
  },
} as const;

export function RoleJourneyBanner({ role }: { role: Role }) {
  const guidance = roleGuidance[role];
  const Icon = guidance.icon;
  return (
    <section className="role-journey-banner" aria-label="Your role in the recruitment journey">
      <span className="role-journey-icon"><Icon size={21} /></span>
      <div>
        <span className="role-journey-step">{guidance.step}</span>
        <strong>{guidance.title}</strong>
        <p>{guidance.description}</p>
      </div>
      <Link href="/tour"><Route size={17} /> See the full journey <ArrowRight size={15} /></Link>
    </section>
  );
}
