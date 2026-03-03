import type { DistributionContext, RiskLevel } from "@/generated/prisma";

interface RiskInput {
  distributionContext: DistributionContext;
  dataSensitivity: boolean;
  highStakesDecision: boolean;
}

interface RiskResult {
  riskLevel: RiskLevel;
  justification: string;
}

export function classifyRisk(input: RiskInput): RiskResult {
  const { distributionContext, dataSensitivity, highStakesDecision } = input;

  // HIGH: External distribution OR high-stakes decision
  if (distributionContext === "EXTERNAL" || highStakesDecision) {
    const reasons: string[] = [];
    if (distributionContext === "EXTERNAL") reasons.push("external distribution");
    if (highStakesDecision) reasons.push("high-stakes decision");
    return {
      riskLevel: "HIGH",
      justification: `High risk: ${reasons.join(" and ")}. Mandatory reviewer approval required.`,
    };
  }

  // MODERATE: Internal + sensitive data + no high-stakes
  if (dataSensitivity) {
    return {
      riskLevel: "MODERATE",
      justification: "Moderate risk: internal use with sensitive data. Reviewer approval required.",
    };
  }

  // LOW: Internal + no sensitive data + no high-stakes
  return {
    riskLevel: "LOW",
    justification: "Low risk: internal use, no sensitive data, no high-stakes decision. Auto-authorized.",
  };
}
