import prisma from "@/lib/prisma";
import memoryStore from "@/lib/memory-store";
import { AskLoopInput, AskLoopResponse, EvidenceItem, Sentiment } from "@/types/api";
import { generateEmbedding, rankEmbeddings } from "@/lib/ai/embeddings";
import { generateGroundedAnswer } from "@/lib/ai/ask-loop";

export class AskLoopService {
  static async ask(
    workspaceId: string,
    input: AskLoopInput
  ): Promise<AskLoopResponse> {
    return this.query(workspaceId, input);
  }

  /**
   * Executes a grounded semantic search & Q&A synthesis against workspace customer feedback.
   * Strict Tenant Isolation: Scoped strictly to the authenticated workspace.
   */
  static async query(
    workspaceId: string,
    input: AskLoopInput
  ): Promise<AskLoopResponse> {
    try {
      const question = input.question.trim();
      const topK = Math.min(20, Math.max(1, input.topK || 5));

      // 1. Generate query vector
      const queryVector = generateEmbedding(question);

      // 2. Fetch all stored embeddings for the authenticated workspace
      const storedEmbeddings = await prisma.feedbackEmbedding.findMany({
        where: { workspaceId },
        select: {
          feedbackId: true,
          embedding: true,
        },
      });

      if (storedEmbeddings.length === 0) {
        return memoryStore.askLoop(workspaceId, input);
      }

      // 3. Rank stored embeddings using cosine similarity (fetch larger batch to allow deduplication)
      const ranked = rankEmbeddings(queryVector, storedEmbeddings, topK * 3);
      const topFeedbackIds = ranked.map((r) => r.feedbackId);

      // 4. Retrieve full feedback records for top matches
      const feedbackRecords = await prisma.feedback.findMany({
        where: {
          id: { in: topFeedbackIds },
          workspaceId,
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
      const seenTexts = new Set<string>();
      let similaritySum = 0;

      for (const item of ranked) {
        const record = recordMap.get(item.feedbackId);
        if (record) {
          const norm = record.rawText.trim().toLowerCase();
          if (!seenTexts.has(norm)) {
            seenTexts.add(norm);
            evidence.push({
              feedbackId: record.id,
              text: record.rawText,
              similarity: Number(item.similarity.toFixed(4)),
              source: record.source,
              sentiment: record.sentiment as Sentiment | null,
              featureArea: record.featureArea,
              createdAt: record.createdAt.toISOString(),
            });
            similaritySum += item.similarity;
            if (evidence.length >= topK) break;
          }
        }
      }

      const averageSimilarity = evidence.length > 0 ? Number((similaritySum / evidence.length).toFixed(4)) : 0;
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
    } catch {
      return memoryStore.askLoop(workspaceId, input);
    }
  }
}
