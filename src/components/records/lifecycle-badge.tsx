import { Badge } from "@/components/ui/badge";
import { Lock } from "@phosphor-icons/react/ssr";
import type { RecordStatus } from "@/types";
import { STATUS_LABELS } from "@/types";

const statusVariant: Record<RecordStatus, "gray" | "amber" | "blue" | "red" | "green"> = {
  DRAFT: "gray",
  SUBMITTED: "amber",
  APPROVED: "blue",
  REJECTED: "red",
  RECORDED: "green",
};

export function LifecycleBadge({ status }: { status: RecordStatus }) {
  const isRecorded = status === "RECORDED";
  return (
    <Badge variant={statusVariant[status]}>
      {isRecorded && <Lock className="h-3 w-3" />}
      {STATUS_LABELS[status]}
    </Badge>
  );
}
