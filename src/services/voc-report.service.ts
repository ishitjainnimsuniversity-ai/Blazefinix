import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import { GenerateVocReportInput, VocReportDto } from "@/types/api";
import { AnalyticsService } from "./analytics.service";
import { generateVocNarrative } from "@/lib/ai/report-generator";

export class VocReportService {
  /**
   * Generates and stores a new Voice-of-Customer report based on computed metrics.
   */
  static async generateReport(
    workspaceId: string,
    input: GenerateVocReportInput = {}
  ): Promise<VocReportDto> {
    const period = input.period || "Last 30 Days";
    const days = input.days || (period === "Last 7 Days" ? 7 : period === "Last 90 Days" ? 90 : 30);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const [totalFeedback, positiveCount, neutralCount, negativeCount, themeStats, spikes] =
      await Promise.all([
        prisma.feedback.count({
          where: { workspaceId, createdAt: { gte: startDate } },
        }),
        prisma.feedback.count({
          where: { workspaceId, sentiment: "POSITIVE", createdAt: { gte: startDate } },
        }),
        prisma.feedback.count({
          where: { workspaceId, sentiment: "NEUTRAL", createdAt: { gte: startDate } },
        }),
        prisma.feedback.count({
          where: { workspaceId, sentiment: "NEGATIVE", createdAt: { gte: startDate } },
        }),
        AnalyticsService.getThemeStats(workspaceId),
        AnalyticsService.detectSpikes(workspaceId),
      ]);

    const posPct = totalFeedback > 0 ? Number(((positiveCount / totalFeedback) * 100).toFixed(1)) : 0;
    const neuPct = totalFeedback > 0 ? Number(((neutralCount / totalFeedback) * 100).toFixed(1)) : 0;
    const negPct = totalFeedback > 0 ? Number(((negativeCount / totalFeedback) * 100).toFixed(1)) : 0;

    const topThemes = themeStats.slice(0, 8).map((t) => ({
      name: t.name,
      count: t.count,
      percentage: t.percentage,
    }));

    // Generate grounded narrative from computed metrics
    const aiNarrative = await generateVocNarrative({
      period,
      totalFeedback,
      positivePercent: posPct,
      neutralPercent: neuPct,
      negativePercent: negPct,
      topThemes,
      spikes,
    });

    // Save report to database
    const saved = await prisma.voiceOfCustomerReport.create({
      data: {
        workspaceId,
        period,
        totalFeedback,
        positivePercent: posPct,
        neutralPercent: neuPct,
        negativePercent: negPct,
        topThemes: topThemes as any,
        spikes: spikes as any,
        aiNarrative,
      },
    });

    return this.formatReportDto(saved);
  }

  /**
   * Lists all past VOC reports for the workspace.
   */
  static async listReports(workspaceId: string): Promise<VocReportDto[]> {
    const reports = await prisma.voiceOfCustomerReport.findMany({
      where: { workspaceId },
      orderBy: { generatedAt: "desc" },
    });

    return reports.map((r) => this.formatReportDto(r));
  }

  /**
   * Retrieves a single VOC report by ID.
   */
  static async getReportById(workspaceId: string, reportId: string): Promise<VocReportDto> {
    const report = await prisma.voiceOfCustomerReport.findFirst({
      where: { id: reportId, workspaceId },
    });

    if (!report) {
      throw new ApiError(404, "NOT_FOUND", `Voice-of-Customer report '${reportId}' not found.`);
    }

    return this.formatReportDto(report);
  }

  private static formatReportDto(report: any): VocReportDto {
    return {
      id: report.id,
      workspaceId: report.workspaceId,
      period: report.period,
      totalFeedback: report.totalFeedback,
      positivePercent: report.positivePercent,
      neutralPercent: report.neutralPercent,
      negativePercent: report.negativePercent,
      topThemes: Array.isArray(report.topThemes) ? report.topThemes : [],
      spikes: Array.isArray(report.spikes) ? report.spikes : [],
      aiNarrative: report.aiNarrative,
      generatedAt: report.generatedAt instanceof Date ? report.generatedAt.toISOString() : report.generatedAt,
    };
  }
}
