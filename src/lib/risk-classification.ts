import type { AiOutputImpact, RiskLevel } from "@/generated/prisma";
import { AI_OUTPUT_IMPACT_LABELS } from "@/types";

interface RiskInput {
  aiOutputImpact: AiOutputImpact;
  dataSensitivity: boolean;
  /**
   * Highest matched vendor tier, looked up by the caller from the record's
   * aiToolUsed values. Optional so existing callers are unaffected.
   * A vendor tier can only RAISE the computed risk, never lower it.
   */
  vendorTier?: RiskLevel | null;
  /** Names of the vendors at the highest matched tier (for the justification). */
  vendorNames?: string[];
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
  const { aiOutputImpact, dataSensitivity, vendorTier, vendorNames } = input;

  let result: RiskResult;
  // HIGH: External-facing or consequential impact categories
  if (HIGH_IMPACT.includes(aiOutputImpact)) {
    const label = AI_OUTPUT_IMPACT_LABELS[aiOutputImpact];
    result = {
      riskLevel: "HIGH",
      justification: `High risk: The AI output directly impacts ${label}, which is external-facing or consequential. Because the output will be relied upon in a high-impact context, mandatory reviewer authorization is required before use.`,
    };
  } else if (dataSensitivity) {
    // MODERATE: Internal use with sensitive data
    result = {
      riskLevel: "MODERATE",
      justification: "Moderate risk: Although the AI output is for internal use, it involves sensitive or regulated data. Reviewer authorization is required to ensure appropriate oversight before reliance.",
    };
  } else {
    // LOW: Internal notes/research/documents, no sensitive data
    result = {
      riskLevel: "LOW",
      justification: "Low risk: The AI output is for internal use only and does not involve sensitive or regulated data. Auto-authorized — no reviewer approval required.",
    };
  }

  // Vendor tier only ever RAISES risk, never lowers it.
  if (vendorTier === "HIGH") {
    const names = vendorNames && vendorNames.length > 0 ? vendorNames.join(", ") : "a HIGH-tier vendor";
    if (result.riskLevel === "LOW") {
      // HIGH-tier vendor alone: at least MODERATE
      result = {
        riskLevel: "MODERATE",
        justification: `${result.justification} Vendor risk: ${names} is rated HIGH tier, raising this slip from LOW to MODERATE risk.`,
      };
    } else if (result.riskLevel === "MODERATE") {
      // MODERATE implies sensitive data: HIGH-tier vendor + sensitive data = HIGH
      result = {
        riskLevel: "HIGH",
        justification: `${result.justification} Vendor risk: ${names} is rated HIGH tier and sensitive or regulated data is involved, raising this slip from MODERATE to HIGH risk.`,
      };
    } else {
      result = {
        ...result,
        justification: `${result.justification} Vendor risk: ${names} is rated HIGH tier, consistent with this HIGH assessment.`,
      };
    }
  }

  return result;
}
