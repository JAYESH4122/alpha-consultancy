import clsx from "clsx";

export function StatusPill({ status }: { status: string }) {
  const normalized = status.replaceAll("_", " ");
  const tone = ["approved", "verified", "selected", "completed", "interview completed"].includes(normalized) ? "success" : ["rejected", "withdrawn", "closed", "cancelled"].includes(normalized) ? "danger" : ["submitted", "in review", "under review", "admin screening", "interest submitted", "shortlisted", "interview ready"].includes(normalized) ? "warning" : "neutral";
  return <span className={clsx("status-pill", `status-${tone}`)}>{normalized}</span>;
}
