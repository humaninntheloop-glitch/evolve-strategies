import { Badge } from "@/components/ui/badge";
import type { RiskLevel } from "@/types";

const riskVariant: Record<RiskLevel, "green" | "amber" | "red"> = {
  LOW: "green",
  MODERATE: "amber",
  HIGH: "red",
};

const riskLabel: Record<RiskLevel, string> = {
  LOW: "Low Risk",
  MODERATE: "Moderate Risk",
  HIGH: "High Risk",
};

export function RiskBadge({ level }: { level: RiskLevel }) {
  return (
    <Badge variant={riskVariant[level]}>
      {riskLabel[level]}
    </Badge>
  );
}
