"use server";

import OpenAI from "openai";
import type { RiskLevel } from "@/types";

interface RiskClassification {
  riskLevel: RiskLevel;
  justification: string;
}

const SYSTEM_PROMPT = `You are a risk assessment AI for regulated workflows. Given a description of intended AI usage and a data classification level, determine the risk level.

Respond ONLY with a JSON object in this exact format:
{"riskLevel": "LOW" | "MODERATE" | "HIGH", "justification": "brief explanation"}

Risk Level Guidelines:
- LOW: Public data, non-critical tasks, no regulatory implications (e.g., summarizing public documentation)
- MODERATE: Internal data, business-impacting decisions, some regulatory exposure (e.g., drafting internal policies with AI)
- HIGH: Confidential/Restricted data, regulated decisions, direct customer/patient impact (e.g., AI-assisted medical diagnosis)

Data Classification impact:
- PUBLIC → likely LOW unless task is critical
- INTERNAL → likely MODERATE
- CONFIDENTIAL → likely HIGH
- RESTRICTED → always HIGH`;

export async function classifyRisk(
  intendedUse: string,
  dataClassification: string
): Promise<RiskClassification> {
  // Fail-safe: if no API key, default to HIGH
  if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === "your-openai-api-key") {
    return {
      riskLevel: "HIGH",
      justification: "AI risk classification unavailable — defaulting to HIGH risk for safety. Manual review required.",
    };
  }

  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Intended Use: ${intendedUse}\nData Classification: ${dataClassification}`,
        },
      ],
      temperature: 0.1,
      max_tokens: 200,
    });

    const content = response.choices[0]?.message?.content?.trim();
    if (!content) throw new Error("Empty AI response");

    const parsed = JSON.parse(content) as {
      riskLevel: string;
      justification: string;
    };

    // Validate the response
    const validLevels: RiskLevel[] = ["LOW", "MODERATE", "HIGH"];
    if (!validLevels.includes(parsed.riskLevel as RiskLevel)) {
      throw new Error(`Invalid risk level: ${parsed.riskLevel}`);
    }

    return {
      riskLevel: parsed.riskLevel as RiskLevel,
      justification: parsed.justification || "No justification provided",
    };
  } catch (error) {
    // Fail-safe: never fail open
    console.error("AI risk classification failed:", error);
    return {
      riskLevel: "HIGH",
      justification: "AI risk classification failed — defaulting to HIGH risk for safety. Manual review required.",
    };
  }
}
