import OpenAI from "openai";

interface SummaryInput {
  aiToolUsed: string;
  aiOutputImpact: string;
  aiUsageType: string[];
  humanReviewPlan: string[];
  dataSensitivity: boolean;
  riskLevel: string;
  riskJustification: string;
}

const FALLBACK = "AI summary could not be generated. Please refer to the risk classification and record details for context.";

export async function generateAiSummary(input: SummaryInput): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("OPENAI_API_KEY not set — skipping AI summary");
    return FALLBACK;
  }

  try {
    const openai = new OpenAI({ apiKey });

    const prompt = `You are a compliance assistant for an AI governance platform. Given the following AI usage record, write a 2-4 sentence summary explaining why this record received its risk classification and what a reviewer should pay attention to. Be factual, concise, and professional.

Record details:
- AI Tool: ${input.aiToolUsed}
- AI Output Impact: ${input.aiOutputImpact}
- AI Usage Types: ${input.aiUsageType.join(", ")}
- Human Review Plan: ${input.humanReviewPlan.join(", ")}
- Involves Sensitive Data: ${input.dataSensitivity ? "Yes" : "No"}
- Risk Level: ${input.riskLevel}
- Risk Justification: ${input.riskJustification}

Write the summary now:`;

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 200,
      temperature: 0.3,
    });

    const summary = response.choices[0]?.message?.content?.trim();
    return summary || FALLBACK;
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return FALLBACK;
  }
}
