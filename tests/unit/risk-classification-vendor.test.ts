import { describe, expect, it } from "vitest";
import { classifyRisk } from "@/lib/risk-classification";

describe("classifyRisk vendor-tier rules (raise-only)", () => {
  it("leaves existing behavior unchanged when no vendor tier is given", () => {
    expect(
      classifyRisk({ aiOutputImpact: "INTERNAL_NOTES", dataSensitivity: false }).riskLevel
    ).toBe("LOW");
    expect(
      classifyRisk({ aiOutputImpact: "INTERNAL_NOTES", dataSensitivity: true }).riskLevel
    ).toBe("MODERATE");
    expect(
      classifyRisk({ aiOutputImpact: "CLIENT_COMMUNICATION", dataSensitivity: false }).riskLevel
    ).toBe("HIGH");
  });

  it("vendor HIGH alone raises LOW to MODERATE and names the vendor", () => {
    const result = classifyRisk({
      aiOutputImpact: "INTERNAL_NOTES",
      dataSensitivity: false,
      vendorTier: "HIGH",
      vendorNames: ["OpenAI"],
    });
    expect(result.riskLevel).toBe("MODERATE");
    expect(result.justification).toContain("OpenAI");
  });

  it("vendor HIGH + sensitive data raises MODERATE to HIGH", () => {
    const result = classifyRisk({
      aiOutputImpact: "INTERNAL_NOTES",
      dataSensitivity: true,
      vendorTier: "HIGH",
      vendorNames: ["Perplexity"],
    });
    expect(result.riskLevel).toBe("HIGH");
    expect(result.justification).toContain("Perplexity");
  });

  it("vendor HIGH keeps an already-HIGH assessment HIGH", () => {
    const result = classifyRisk({
      aiOutputImpact: "EXTERNAL_REPORTS",
      dataSensitivity: false,
      vendorTier: "HIGH",
      vendorNames: ["Google"],
    });
    expect(result.riskLevel).toBe("HIGH");
  });

  it("vendor MODERATE or LOW never lowers the computed risk", () => {
    expect(
      classifyRisk({
        aiOutputImpact: "CLIENT_COMMUNICATION",
        dataSensitivity: false,
        vendorTier: "LOW",
        vendorNames: ["Internal"],
      }).riskLevel
    ).toBe("HIGH");
    expect(
      classifyRisk({
        aiOutputImpact: "INTERNAL_NOTES",
        dataSensitivity: true,
        vendorTier: "MODERATE",
      }).riskLevel
    ).toBe("MODERATE");
    expect(
      classifyRisk({
        aiOutputImpact: "INTERNAL_NOTES",
        dataSensitivity: false,
        vendorTier: null,
      }).riskLevel
    ).toBe("LOW");
  });
});
