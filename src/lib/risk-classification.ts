import type { AiOutputImpact, RiskLevel } from "@/generated/prisma";

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
    return {
      riskLevel: "HIGH",
      justification: `High risk: AI output impacts ${aiOutputImpact.toLowerCase().replace(/_/g, " ")}. Mandatory reviewer authorization required.`,
    };
  }

  // MODERATE: Internal use with sensitive data
  if (dataSensitivity) {
    return {
      riskLevel: "MODERATE",
      justification: "Moderate risk: internal use with sensitive data. Reviewer authorization required.",
    };
  }

  // LOW: Internal notes/research/documents, no sensitive data
  return {
    riskLevel: "LOW",
    justification: "Low risk: internal use, no sensitive data. Auto-authorized.",
  };
}
