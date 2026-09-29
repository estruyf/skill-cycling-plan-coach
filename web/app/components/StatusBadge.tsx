import { STATUS_ROLE, STATUS_ROLE_LABELS, type SessionStatus } from "@/lib/types";
import { IconCheck } from "./icons";

const SHORT_LABELS: Record<SessionStatus, string> = {
  completed_as_planned: "Completed as planned",
  completed_easier_than_planned: "Completed — easier than planned",
  completed_harder_than_planned: "Harder than planned",
  failed_too_hard: "Failed — too hard",
  skipped: "Skipped",
};

export function StatusBadge({ status }: { status: SessionStatus }) {
  const role = STATUS_ROLE[status];
  return (
    <span className={`badge badge-${role}`} title={STATUS_ROLE_LABELS[role]}>
      {role === "good" && <IconCheck />}
      {SHORT_LABELS[status]}
    </span>
  );
}
