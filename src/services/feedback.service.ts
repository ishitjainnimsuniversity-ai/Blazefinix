import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import {
  CreateFeedbackInput,
  FeedbackDto,
  FeedbackListQuery,
  FeedbackStatus,
  PaginatedResponse,
  Sentiment,
} from "@/types/api";
import { classifyFeedback } from "@/lib/ai/classifier";
import { generateEmbedding } from "@/lib/ai/embeddings";

export class FeedbackService {
  /**
   * Creates a new customer feedback record with automatic AI classification and vector embedding.
   */
  static async createFeedback(
    workspaceId: string,
    input: CreateFeedbackInput
  ): Promise<FeedbackDto> {
    // 1. Create base feedback record
    const feedback = await prisma.feedback.create({
      data: {
        workspaceId,
        source: input.source || "Manual",
        customerName: input.customerName || null,
        customerEmail: input.customerEmail || null,
        rawText: input.rawText,
        status: input.status || "NEW",
        aiStatus: input.skipAi ? "COMPLETED" : "PENDING",
      },
    });

    // 2. Generate vector embedding for semantic search
    const embeddingVector = generateEmbedding(input.rawText);
    await prisma.feedbackEmbedding.create({
      data: {
        feedbackId: feedback.id,
        workspaceId,
        embedding: embeddingVector,
      },
    });

    // 3. Perform AI classification if not skipped
    if (!input.skipAi) {
      try {
        const { result, model } = await classifyFeedback(input.rawText, feedback.source);

        // Update feedback with AI findings
        const updated = await prisma.feedback.update({
          where: { id: feedback.id },
          data: {
            sentiment: result.sentiment,
            sentimentScore: result.sentimentScore,
            featureArea: result.featureArea,
            aiRationale: result.rationale,
            aiStatus: "COMPLETED",
          },
        });

        // Store separate AI analysis record
        await prisma.aiAnalysis.create({
          data: {
            feedbackId: feedback.id,
            sentiment: result.sentiment,
            sentimentScore: result.sentimentScore,
            themes: result.themes,
            featureArea: result.featureArea,
            rationale: result.rationale,
            model,
            processingStatus: "COMPLETED",
          },
        });

        // Upsert themes and link to feedback
        for (const themeName of result.themes) {
          const trimmedName = themeName.trim();
          if (!trimmedName) continue;

          const theme = await prisma.theme.upsert({
            where: {
              workspaceId_name: {
                workspaceId,
                name: trimmedName,
              },
            },
            update: {
              count: { increment: 1 },
            },
            create: {
              workspaceId,
              name: trimmedName,
              count: 1,
            },
          });

          await prisma.feedbackTheme.upsert({
            where: {
              feedbackId_themeId: {
                feedbackId: feedback.id,
                themeId: theme.id,
              },
            },
            update: {},
            create: {
              feedbackId: feedback.id,
              themeId: theme.id,
            },
          });
        }

        return this.formatFeedbackDto(updated);
      } catch (err) {
        console.error(`[AI Classification Error] Feedback ID ${feedback.id}:`, err);
        await prisma.feedback.update({
          where: { id: feedback.id },
          data: { aiStatus: "FAILED" },
        });
      }
    }

    return this.formatFeedbackDto(feedback);
  }

  /**
   * Retrieves a paginated list of feedback records with multi-criteria filtering and server-side search.
   */
  static async listFeedback(
    workspaceId: string,
    query: FeedbackListQuery
  ): Promise<PaginatedResponse<FeedbackDto>> {
    const page = Math.max(1, Number(query.page) || 1);
    const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 20));
    const skip = (page - 1) * pageSize;

    // Build Prisma where clause with strict workspace isolation
    const where: any = {
      workspaceId,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.sentiment) {
      where.sentiment = query.sentiment;
    }

    if (query.source) {
      where.source = { equals: query.source, mode: "insensitive" };
    }

    if (query.featureArea) {
      where.featureArea = { equals: query.featureArea, mode: "insensitive" };
    }

    if (query.search && query.search.trim()) {
      const searchTerm = query.search.trim();
      where.OR = [
        { rawText: { contains: searchTerm, mode: "insensitive" } },
        { customerName: { contains: searchTerm, mode: "insensitive" } },
        { customerEmail: { contains: searchTerm, mode: "insensitive" } },
        { featureArea: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    if (query.theme && query.theme.trim()) {
      where.feedbackThemes = {
        some: {
          theme: {
            name: { equals: query.theme.trim(), mode: "insensitive" },
          },
        },
      };
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) where.createdAt.gte = new Date(query.startDate);
      if (query.endDate) where.createdAt.lte = new Date(query.endDate);
    }

    // Build orderBy
    const sortBy = query.sortBy || "createdAt";
    const sortOrder = query.sortOrder || "desc";
    const orderBy = { [sortBy]: sortOrder };

    const [items, total] = await Promise.all([
      prisma.feedback.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          analysis: true,
          feedbackThemes: {
            include: {
              theme: true,
            },
          },
        },
      }),
      prisma.feedback.count({ where }),
    ]);

    const totalPages = Math.ceil(total / pageSize);

    return {
      items: items.map((f) => this.formatFeedbackDto(f)),
      total,
      page,
      pageSize,
      totalPages,
      hasMore: page < totalPages,
    };
  }

  /**
   * Retrieves a single feedback record with full AI analysis and associated themes.
   */
  static async getFeedbackById(
    workspaceId: string,
    feedbackId: string
  ): Promise<FeedbackDto> {
    const feedback = await prisma.feedback.findFirst({
      where: {
        id: feedbackId,
        workspaceId, // Tenant isolation
      },
      include: {
        analysis: true,
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },
    });

    if (!feedback) {
      throw new ApiError(404, "NOT_FOUND", `Feedback record '${feedbackId}' not found.`);
    }

    return this.formatFeedbackDto(feedback);
  }

  /**
   * Updates feedback status (e.g. NEW -> REVIEWED -> RESOLVED -> ARCHIVED).
   */
  static async updateStatus(
    workspaceId: string,
    feedbackId: string,
    status: FeedbackStatus
  ): Promise<FeedbackDto> {
    // Check existence & tenant isolation
    const existing = await prisma.feedback.findFirst({
      where: { id: feedbackId, workspaceId },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", `Feedback record '${feedbackId}' not found.`);
    }

    const updated = await prisma.feedback.update({
      where: { id: feedbackId },
      data: { status },
      include: {
        analysis: true,
        feedbackThemes: {
          include: {
            theme: true,
          },
        },
      },
    });

    return this.formatFeedbackDto(updated);
  }

  /**
   * Bulk updates statuses for multiple feedback items within the workspace.
   */
  static async batchUpdateStatus(
    workspaceId: string,
    feedbackIds: string[],
    status: FeedbackStatus
  ): Promise<{ updatedCount: number }> {
    const result = await prisma.feedback.updateMany({
      where: {
        id: { in: feedbackIds },
        workspaceId, // Tenant isolation
      },
      data: { status },
    });

    return { updatedCount: result.count };
  }

  /**
   * Deletes a feedback item.
   */
  static async deleteFeedback(
    workspaceId: string,
    feedbackId: string
  ): Promise<{ success: true }> {
    const existing = await prisma.feedback.findFirst({
      where: { id: feedbackId, workspaceId },
    });

    if (!existing) {
      throw new ApiError(404, "NOT_FOUND", `Feedback record '${feedbackId}' not found.`);
    }

    await prisma.feedback.delete({
      where: { id: feedbackId },
    });

    return { success: true };
  }

  /**
   * Helper to format Prisma feedback model into standard FeedbackDto.
   */
  public static formatFeedbackDto(feedback: any): FeedbackDto {
    return {
      id: feedback.id,
      workspaceId: feedback.workspaceId,
      source: feedback.source,
      customerName: feedback.customerName,
      customerEmail: feedback.customerEmail,
      rawText: feedback.rawText,
      status: feedback.status,
      sentiment: feedback.sentiment as Sentiment | null,
      sentimentScore: feedback.sentimentScore,
      featureArea: feedback.featureArea,
      aiRationale: feedback.aiRationale,
      aiStatus: feedback.aiStatus,
      createdAt: feedback.createdAt instanceof Date ? feedback.createdAt.toISOString() : feedback.createdAt,
      updatedAt: feedback.updatedAt instanceof Date ? feedback.updatedAt.toISOString() : feedback.updatedAt,
      analysis: feedback.analysis
        ? {
            id: feedback.analysis.id,
            feedbackId: feedback.analysis.feedbackId,
            sentiment: feedback.analysis.sentiment as Sentiment,
            sentimentScore: feedback.analysis.sentimentScore,
            themes: feedback.analysis.themes,
            featureArea: feedback.analysis.featureArea,
            rationale: feedback.analysis.rationale,
            model: feedback.analysis.model,
            processingStatus: feedback.analysis.processingStatus,
            createdAt:
              feedback.analysis.createdAt instanceof Date
                ? feedback.analysis.createdAt.toISOString()
                : feedback.analysis.createdAt,
          }
        : null,
      themes: feedback.feedbackThemes
        ? feedback.feedbackThemes.map((ft: any) => ({
            id: ft.theme.id,
            name: ft.theme.name,
            description: ft.theme.description,
          }))
        : [],
    };
  }
}
