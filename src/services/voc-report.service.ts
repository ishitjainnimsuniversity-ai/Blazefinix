import prisma from "@/lib/prisma";
import memoryStore from "@/lib/memory-store";
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
    try {
      const period = input.period || "Last 30 Days";
      const isAllTime = period.toLowerCase() === "all time" || input.days === 0;
      const days = isAllTime
        ? null
        : input.days || (period === "Last 7 Days" ? 7 : period === "Last 90 Days" ? 90 : 30);

      const feedbackWhere: any = { workspaceId };
      if (days !== null) {
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);
        feedbackWhere.createdAt = { gte: startDate };
      }

      const [totalFeedback, positiveCount, neutralCount, negativeCount, themeStats, spikes] =
        await Promise.all([
          prisma.feedback.count({ where: feedbackWhere }),
          prisma.feedback.count({
            where: { ...feedbackWhere, sentiment: "POSITIVE" },
          }),
          prisma.feedback.count({
            where: { ...feedbackWhere, sentiment: "NEUTRAL" },
          }),
          prisma.feedback.count({
            where: { ...feedbackWhere, sentiment: "NEGATIVE" },
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

      // Save report to PostgreSQL with native Json types
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
    } catch {
      return memoryStore.generateVocReport(workspaceId, input);
    }
  }

  /**
   * Lists all past VOC reports for the workspace.
   */
  static async listReports(workspaceId: string): Promise<VocReportDto[]> {
    try {
      const reports = await prisma.voiceOfCustomerReport.findMany({
        where: { workspaceId },
        orderBy: { generatedAt: "desc" },
      });

      return reports.map((r) => this.formatReportDto(r));
    } catch {
      return memoryStore.listVocReports(workspaceId);
    }
  }

  /**
   * Retrieves a single VOC report by ID with strict workspace isolation.
   */
  static async getReportById(workspaceId: string, reportId: string): Promise<VocReportDto> {
    try {
      const report = await prisma.voiceOfCustomerReport.findFirst({
        where: { id: reportId, workspaceId },
      });

      if (!report) {
        throw new ApiError(404, "NOT_FOUND", `Voice-of-Customer report '${reportId}' not found.`);
      }

      return this.formatReportDto(report);
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      const rep = memoryStore.getVocReportById(workspaceId, reportId);
      if (!rep) {
        throw new ApiError(404, "NOT_FOUND", `Voice-of-Customer report '${reportId}' not found.`);
      }
      return rep;
    }
  }

  private static formatReportDto(report: any): VocReportDto {
    let topThemes = [];
    if (Array.isArray(report.topThemes)) {
      topThemes = report.topThemes;
    } else if (typeof report.topThemes === "string") {
      try {
        topThemes = JSON.parse(report.topThemes);
      } catch {
        topThemes = [];
      }
    }

    let spikes = [];
    if (Array.isArray(report.spikes)) {
      spikes = report.spikes;
    } else if (typeof report.spikes === "string") {
      try {
        spikes = JSON.parse(report.spikes);
      } catch {
        spikes = [];
      }
    }

    return {
      id: report.id,
      workspaceId: report.workspaceId,
      period: report.period,
      totalFeedback: report.totalFeedback,
      positivePercent: report.positivePercent,
      neutralPercent: report.neutralPercent,
      negativePercent: report.negativePercent,
      topThemes,
      spikes,
      aiNarrative: report.aiNarrative,
      generatedAt: report.generatedAt instanceof Date ? report.generatedAt.toISOString() : report.generatedAt,
    };
  }
}
