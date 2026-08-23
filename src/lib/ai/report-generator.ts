import { anthropic, DEFAULT_CLAUDE_MODEL, isClaudeAvailable } from "./claude";
import { SpikeDetectionItem } from "@/types/api";

export interface VocReportInputStats {
  period: string;
  totalFeedback: number;
  positivePercent: number;
  neutralPercent: number;
  negativePercent: number;
  topThemes: Array<{ name: string; count: number; percentage: number }>;
  spikes: SpikeDetectionItem[];
}

/**
 * Generates an executive Voice-of-Customer narrative using Anthropic Claude or deterministic fallback.
 * Strictly relies on precomputed statistics so LLM never hallucinates numbers.
 */
export async function generateVocNarrative(stats: VocReportInputStats): Promise<string> {
  const topThemesStr = stats.topThemes
    .slice(0, 5)
    .map((t) => `- ${t.name}: ${t.count} mentions (${t.percentage}%)`)
    .join("\n");

  const spikesStr =
    stats.spikes.length > 0
      ? stats.spikes
          .map(
            (s) =>
              `- [SPIKE DETECTED] "${s.theme}": ${s.currentCount} mentions vs ${s.baselineAverage} baseline (+${s.changePercent}%)`
          )
          .join("\n")
      : "No critical anomalous volume spikes detected in this reporting window.";

  if (!isClaudeAvailable() || !anthropic) {
    // Structured, high-quality template narrative
    return `### 1. Executive Summary
During the **${stats.period}** reporting window, LOOP ingested and processed a total of **${stats.totalFeedback} customer feedback records**. Overall customer sentiment stands at **${stats.positivePercent}% Positive**, **${stats.neutralPercent}% Neutral**, and **${stats.negativePercent}% Negative**.

### 2. Primary Drivers & Theme Analysis
Customer feedback was concentrated primarily across the following core themes:
${topThemesStr}

### 3. Anomaly & Volume Spike Alerts
${spikesStr}

### 4. Strategic Recommendations
1. **Address Top Negative Themes**: Prioritize engineering and product sprints on identified friction areas (${stats.topThemes[0]?.name || "Core Product"}).
2. **Investigate Volume Surges**: Review recent feature rollouts and infrastructure alerts corresponding to any active spikes.
3. **Double Down on Positive Delighters**: Reinforce features receiving consistent positive commendations across customer support and app channels.`;
  }

  const prompt = `You are an elite Product Strategy Executive generating a Voice-of-Customer (VOC) Report for leadership.
The following real analytics have been computed directly from the company's feedback database:

Reporting Period: ${stats.period}
Total Ingested Feedback: ${stats.totalFeedback}
Sentiment Breakdown:
- Positive: ${stats.positivePercent}%
- Neutral: ${stats.neutralPercent}%
- Negative: ${stats.negativePercent}%

Top Themes:
${topThemesStr}

Spike Anomalies:
${spikesStr}

INSTRUCTIONS:
Write a comprehensive, professional Voice-of-Customer Executive Report with markdown headings:
1. Executive Summary
2. Sentiment Trajectory & Key Drivers
3. Deep Dive into Top Friction Points & Delighters
4. Spike Analysis & Root Cause Assessment
5. Prioritized Action Plan for Engineering & Product Teams

STRICT RULE: Only use the exact statistics provided above. Do NOT invent conflicting numerical percentages.`;

  try {
    const response = await anthropic.messages.create({
      model: DEFAULT_CLAUDE_MODEL,
      max_tokens: 1200,
      temperature: 0.2,
      messages: [{ role: "user", content: prompt }],
    });

    const contentBlock = response.content[0];
    if (!contentBlock || contentBlock.type !== "text") {
      throw new Error("No text response from Claude");
    }

    return contentBlock.text.trim();
  } catch (error) {
    console.warn("[VOC Report Generator Warning] Claude invocation failed, using formatted report template:", error);
    return `### 1. Executive Summary
During **${stats.period}**, the platform recorded **${stats.totalFeedback} feedback submissions** with ${stats.positivePercent}% positive and ${stats.negativePercent}% negative sentiment.

### 2. Key Themes
${topThemesStr}

### 3. Anomaly Tracking
${spikesStr}

### 4. Strategic Next Steps
- Implement immediate stabilization fixes for recurring complaints in top categories.
- Monitor spike trends over the next 14-day cycle.`;
  }
}
