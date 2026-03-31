import type { AiOutputImpact, RiskLevel } from "@/generated/prisma";
import { AI_OUTPUT_IMPACT_LABELS } from "@/types";

interface RiskInput {
  aiOutputImpact: AiOutputImpact;
  dataSensitivity: boolean;
}

interface RiskResult {
  riskLevel: RiskLevel;
  justification: string;
}

const HIGH_IMPACT: AiOutputImpact[] = [
  "CLIENT_COMMUNICATION",
  "EXTERNAL_REPORTS",
  "FINANCIAL_LEGAL",
  "REGULATORY_COMPLIANCE",
];

export function classifyRisk(input: RiskInput): RiskResult {
  const { aiOutputImpact, dataSensitivity } = input;

  // HIGH: External-facing or consequential impact categories
  if (HIGH_IMPACT.includes(aiOutputImpact)) {
    const label = AI_OUTPUT_IMPACT_LABELS[aiOutputImpact];
    return {
      riskLevel: "HIGH",
      justification: `High risk: The AI output directly impacts ${label}, which is external-facing or consequential. Because the output will be relied upon in a high-impact context, mandatory reviewer authorization is required before use.`,
    };
  }

  // MODERATE: Internal use with sensitive data
  if (dataSensitivity) {
    return {
      riskLevel: "MODERATE",
      justification: "Moderate risk: Although the AI output is for internal use, it involves sensitive or regulated data. Reviewer authorization is required to ensure appropriate oversight before reliance.",
    };
  }

  // LOW: Internal notes/research/documents, no sensitive data
  return {
    riskLevel: "LOW",
    justification: "Low risk: The AI output is for internal use only and does not involve sensitive or regulated data. Auto-authorized — no reviewer approval required.",
  };
}
