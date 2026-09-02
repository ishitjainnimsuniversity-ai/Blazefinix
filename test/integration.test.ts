import { describe, it, expect } from "vitest";
import { generateGroundedAnswer } from "../src/lib/ai/ask-loop";
import { generateVocNarrative } from "../src/lib/ai/report-generator";
import { EvidenceItem } from "../src/types/api";

describe("Integration & Grounded Synthesis Workflows", () => {
  it("should synthesize grounded answers citing verbatim evidence cards", async () => {
    const evidence: EvidenceItem[] = [
      {
        feedbackId: "fb_001",
        text: "The checkout button is unresponsive when using Amex cards on Chrome.",
        similarity: 0.895,
        source: "App",
        sentiment: "NEGATIVE",
        featureArea: "Billing & Pricing",
        createdAt: new Date().toISOString(),
      },
      {
        feedbackId: "fb_002",
        text: "Payment timeout occurs intermittently on high load.",
        similarity: 0.842,
        source: "Website",
        sentiment: "NEGATIVE",
        featureArea: "Billing & Pricing",
        createdAt: new Date().toISOString(),
      },
    ];

    const result = await generateGroundedAnswer(
      "Why are users failing to complete checkout?",
      evidence
    );

    expect(result.grounded).toBe(true);
    expect(result.answer).toBeDefined();
    expect(result.answer.length).toBeGreaterThan(20);
  });

  it("should generate grounded VOC executive narrative based on computed statistics", async () => {
    const narrative = await generateVocNarrative({
      period: "Last 30 Days",
      totalFeedback: 150,
      positivePercent: 46.5,
      neutralPercent: 21.0,
      negativePercent: 32.5,
      topThemes: [
        { name: "Payment Gateway Failures", count: 18, percentage: 14.2 },
        { name: "Fast Support Resolution", count: 12, percentage: 9.4 },
      ],
      spikes: [
        {
          theme: "Payment Gateway Failures",
          currentCount: 14,
          baselineAverage: 4.0,
          changePercent: 250.0,
          isSpike: true,
          explanation: "Surged +250.0% in the last 7 days.",
        },
      ],
    });

    expect(narrative).toContain("Executive Summary");
    expect(narrative).toContain("150");
    expect(narrative).toContain("Payment Gateway Failures");
  });
});
