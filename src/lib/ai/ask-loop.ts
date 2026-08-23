import { anthropic, DEFAULT_CLAUDE_MODEL, isClaudeAvailable } from "./claude";
import { EvidenceItem } from "@/types/api";

export interface GroundedAnswerResult {
  answer: string;
  grounded: boolean;
  model: string;
}

/**
 * Synthesizes a grounded answer to a customer feedback question using retrieved evidence.
 */
export async function generateGroundedAnswer(
  question: string,
  evidence: EvidenceItem[]
): Promise<GroundedAnswerResult> {
  if (evidence.length === 0) {
    return {
      answer: "No relevant customer feedback was found in your workspace matching this inquiry. Try refining your question or ingesting more feedback data.",
      grounded: false,
      model: "system-no-evidence",
    };
  }

  // Format context for LLM grounding
  const contextSnippet = evidence
    .map(
      (item, idx) =>
        `[Evidence Item #${idx + 1} | ID: ${item.feedbackId} | Channel: ${item.source} | Sentiment: ${item.sentiment || "Unknown"}]\n"${item.text}"`
    )
    .join("\n\n");

  if (!isClaudeAvailable() || !anthropic) {
    // Intelligent heuristic answer synthesis when Claude key is not provided
    const topItems = evidence.slice(0, 3);
    const themesMentioned = topItems.map((e) => `"${e.text.substring(0, 80)}..."`);
    const answer = `Based on ${evidence.length} retrieved customer feedback records: Customers frequently highlight concerns including: ${themesMentioned.join("; ")}. Direct evidence from customer channels indicates specific friction points around these issues.`;

    return {
      answer,
      grounded: true,
      model: "heuristic-grounding-engine",
    };
  }

  const prompt = `You are "Ask LOOP", an enterprise Customer-Feedback Intelligence AI Assistant.
A user asked the following question about their organization's customer feedback:

Question: "${question}"

Below are the most relevant customer feedback records retrieved from their workspace database:
------------------------------------
${contextSnippet}
------------------------------------

CRITICAL GROUNDING RULES:
1. ONLY answer using facts, sentiments, and experiences directly contained in the retrieved feedback items above.
2. DO NOT make assumptions or hallucinate trends not present in the evidence.
3. Reference specific customer sentiments (e.g. "Customers reported that...", "One user noted...") and cite evidence clearly.
4. Keep the answer professional, concise (2-4 paragraphs max), and directly actionable for product managers.
5. If the evidence is insufficient to fully answer the question, state what is known and mention that additional data is needed.`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 800,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    if (!contentBlock || contentBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return {
      answer: contentBlock.text.trim(),
      grounded: true,
      model: DEFAULT_CLAUDE_MODEL,
    };
  } catch (error) {
    console.warn("[Ask LOOP Warning] Claude generation failed, using structured evidence synthesis:", error);
    const sampleSnippets = evidence.slice(0, 3).map((e) => `• "${e.text}" (via ${e.source})`).join("\n");
    return {
      answer: `Based on analysis of ${evidence.length} customer feedback records for "${question}":\n\nKey customer observations include:\n${sampleSnippets}\n\nReview the attached evidence cards below for the full verbatim context.`,
      grounded: true,
      model: "fallback-grounding-engine",
    };
  }
}
