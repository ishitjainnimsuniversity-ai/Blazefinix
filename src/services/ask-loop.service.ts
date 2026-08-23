import prisma from "@/lib/prisma";
import { generateEmbedding, rankEmbeddings } from "@/lib/ai/embeddings";
import { generateGroundedAnswer } from "@/lib/ai/ask-loop";
import { AskLoopRequest, AskLoopResponse, EvidenceItem } from "@/types/api";

export class AskLoopService {
  /**
   * Grounded Question & Answering over workspace customer feedback.
   * Enforces strict tenant isolation during semantic vector retrieval.
   */
  static async ask(
    workspaceId: string,
    input: AskLoopRequest
  ): Promise<AskLoopResponse> {
    const question = input.question.trim();
    const topK = Math.min(20, Math.max(1, input.topK || 5));

    // 1. Generate query embedding
    const queryVector = generateEmbedding(question);

    // 2. Fetch workspace embeddings (strictly scoped to tenant)
    const storedEmbeddings = await prisma.feedbackEmbedding.findMany({
      where: { workspaceId },
      select: {
        feedbackId: true,
        embedding: true,
      },
    });

    if (storedEmbeddings.length === 0) {
      return {
        question,
        answer: "There is currently no customer feedback ingested in this workspace to answer your question. Please import or add feedback to enable Ask LOOP.",
        grounded: false,
        evidence: [],
        metadata: {
          retrievedCount: 0,
          averageSimilarity: 0,
          model: "no-data",
        },
      };
    }

    // 3. Rank stored embeddings using cosine similarity
    const ranked = rankEmbeddings(queryVector, storedEmbeddings, topK);

    // Filter items with non-zero similarity or take top matches
    const topFeedbackIds = ranked.map((r) => r.feedbackId);

    // 4. Retrieve full feedback records for top matches
    const feedbackRecords = await prisma.feedback.findMany({
      where: {
        id: { in: topFeedbackIds },
        workspaceId, // Tenant isolation guard
      },
      select: {
        id: true,
        rawText: true,
        source: true,
        sentiment: true,
        featureArea: true,
        createdAt: true,
      },
    });

    const recordMap = new Map(feedbackRecords.map((r) => [r.id, r]));

    const evidence: EvidenceItem[] = [];
    let similaritySum = 0;

    for (const item of ranked) {
      const record = recordMap.get(item.feedbackId);
      if (record) {
        evidence.push({
          feedbackId: record.id,
          text: record.rawText,
          similarity: Number(item.similarity.toFixed(4)),
          source: record.source,
          sentiment: record.sentiment,
          featureArea: record.featureArea,
          createdAt: record.createdAt.toISOString(),
        });
        similaritySum += item.similarity;
      }
    }

    const averageSimilarity = evidence.length > 0 ? Number((similaritySum / evidence.length).toFixed(4)) : 0;

    // 5. Generate grounded AI response
    const { answer, grounded, model } = await generateGroundedAnswer(question, evidence);

    return {
      question,
      answer,
      grounded,
      evidence,
      metadata: {
        retrievedCount: evidence.length,
        averageSimilarity,
        model,
      },
    };
  }
}
