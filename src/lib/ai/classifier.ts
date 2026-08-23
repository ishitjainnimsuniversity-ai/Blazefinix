import { z } from "zod";
import { anthropic, DEFAULT_CLAUDE_MODEL, isClaudeAvailable } from "./claude";
import { Sentiment } from "@/types/api";

export const AiClassificationResultSchema = z.object({
  sentiment: z.enum(["POSITIVE", "NEUTRAL", "NEGATIVE"]),
  sentimentScore: z.number().min(-1.0).max(1.0),
  themes: z.array(z.string().min(1)).min(1),
  featureArea: z.string().min(1),
  rationale: z.string().min(1),
});

export type AiClassificationResult = z.infer<typeof AiClassificationResultSchema>;

/**
 * Intelligent deterministic heuristic classification fallback
 * Used when Claude API key is not configured or in offline/test environments.
 */
export function heuristicClassifyFeedback(text: string): AiClassificationResult {
  const lower = text.toLowerCase();

  // Sentiment detection keywords
  const positiveWords = [
    "love", "great", "amazing", "fast", "helpful", "smooth", "excellent", "awesome",
    "perfect", "good", "easy", "satisfied", "thank", "happy", "quick", "super",
    "resolved", "solved", "delight", "fantastic", "wonderful", "impressed", "flawless"
  ];
  const negativeWords = [
    "broken", "error", "fail", "slow", "terrible", "worst", "bug", "crash",
    "stuck", "frustrat", "hate", "charge", "refund", "horrible", "difficult",
    "confusing", "down", "problem"
  ];

  let positiveScore = 0;
  let negativeScore = 0;

  // Handle common positive resolution idioms
  if (lower.includes("resolved my issue") || lower.includes("resolved our issue") || lower.includes("solved the issue") || lower.includes("solved the problem")) {
    positiveScore += 2;
  } else if (lower.includes("issue")) {
    negativeScore += 1;
  }

  for (const word of positiveWords) {
    if (lower.includes(word)) positiveScore += 1;
  }
  for (const word of negativeWords) {
    if (lower.includes(word)) negativeScore += 1;
  }

  let sentiment: Sentiment = "NEUTRAL";
  let sentimentScore = 0.0;

  if (positiveScore > negativeScore) {
    sentiment = "POSITIVE";
    sentimentScore = Math.min(1.0, 0.4 + positiveScore * 0.2);
  } else if (negativeScore > positiveScore) {
    sentiment = "NEGATIVE";
    sentimentScore = Math.max(-1.0, -0.4 - negativeScore * 0.2);
  } else {
    sentiment = "NEUTRAL";
    sentimentScore = 0.0;
  }

  // Feature Area and Theme detection
  const themes: string[] = [];
  let featureArea = "General";

  if (/\b(pay|charge|credit card|refund|billing|invoice|price|pricing|subscription)\b/i.test(lower)) {
    featureArea = "Billing & Pricing";
    themes.push(lower.includes("refund") ? "Refund Delays" : lower.includes("price") ? "Pricing & Plans" : "Payment Failures");
  } else if (/\b(login|password|2fa|auth|sign in|account|sso|saml)\b/i.test(lower)) {
    featureArea = "Authentication";
    themes.push(lower.includes("2fa") ? "2FA Verification" : lower.includes("password") ? "Password Reset" : "Login & SSO");
  } else if (/\b(support|agent|help|ticket|representative|customer service)\b/i.test(lower)) {
    featureArea = "Customer Support";
    themes.push("Support Response Time");
  } else if (/\b(slow|lag|latency|loading|speed|performance|timeout)\b/i.test(lower)) {
    featureArea = "Performance";
    themes.push("Page Load Latency");
  } else if (/\b(mobile|ios|android|app|iphone|ipad|phone)\b/i.test(lower)) {
    featureArea = "Mobile App";
    themes.push(lower.includes("crash") ? "Mobile App Crashes" : "Mobile UX");
  } else if (/\b(onboard|setup|getting started|tutorial|guide)\b/i.test(lower)) {
    featureArea = "Onboarding";
    themes.push("Onboarding Flow");
  } else if (/\b(search|filter|find)\b/i.test(lower)) {
    featureArea = "Search & Discovery";
    themes.push("Search Accuracy");
  } else if (/\b(dark mode|ui|design|button|layout|ux)\b/i.test(lower)) {
    featureArea = "UI / UX";
    themes.push("User Interface Design");
  } else if (/\b(export|csv|report|download|pdf)\b/i.test(lower)) {
    featureArea = "Reporting & Export";
    themes.push("Data Export");
  } else {
    featureArea = "General Feedback";
    themes.push("Product Experience");
  }

  const rationale = `Feedback demonstrates ${sentiment.toLowerCase()} customer sentiment concerning ${featureArea.toLowerCase()} (${themes.join(", ")}).`;

  return {
    sentiment,
    sentimentScore,
    themes,
    featureArea,
    rationale,
  };
}

/**
 * Classifies raw customer feedback using Anthropic Claude API with automatic fallback.
 */
export async function classifyFeedback(
  text: string,
  source?: string
): Promise<{ result: AiClassificationResult; model: string }> {
  if (!isClaudeAvailable() || !anthropic) {
    return {
      result: heuristicClassifyFeedback(text),
      model: "heuristic-classifier-v1",
    };
  }

  const prompt = `You are an enterprise AI Customer-Feedback Intelligence Classifier.
Analyze the following customer feedback received via "${source || "Customer Channel"}":

"${text}"

Extract:
1. "sentiment": strictly "POSITIVE" | "NEUTRAL" | "NEGATIVE"
2. "sentimentScore": float between -1.0 (extremely negative) and 1.0 (extremely positive), with 0.0 being neutral.
3. "themes": array of 1 to 3 specific theme labels (e.g. ["Payment Failure", "Checkout Lag"]).
4. "featureArea": high-level feature module (e.g. "Billing & Pricing", "Authentication", "Performance", "Mobile App", "Customer Support", "Onboarding", "UI / UX", "Search & Discovery").
5. "rationale": concise 1-2 sentence explanation grounding why this classification was assigned.

Respond ONLY with a valid, raw JSON object matching this schema:
{
  "sentiment": "POSITIVE" | "NEUTRAL" | "NEGATIVE",
  "sentimentScore": 0.0,
  "themes": ["Theme Name"],
  "featureArea": "Feature Area Name",
  "rationale": "Explanation"
}`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 500,
      temperature: 0.1,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    if (!contentBlock || contentBlock.type !== "text") {
      throw new Error("No text response received from Claude API");
    }

    let rawJson = contentBlock.text.trim();
    // Strip markdown code fences if model enclosed them
    if (rawJson.startsWith("```json")) {
      rawJson = rawJson.replace(/^```json/, "").replace(/```$/, "").trim();
    } else if (rawJson.startsWith("```")) {
      rawJson = rawJson.replace(/^```/, "").replace(/```$/, "").trim();
    }

    const parsed = JSON.parse(rawJson);
    const validated = AiClassificationResultSchema.parse(parsed);

    return {
      result: validated,
      model: DEFAULT_CLAUDE_MODEL,
    };
  } catch (error) {
    console.warn("[Claude Classifier Warning] LLM call failed or returned malformed JSON, falling back to heuristic engine:", error);
    return {
      result: heuristicClassifyFeedback(text),
      model: "heuristic-classifier-fallback",
    };
  }
}
