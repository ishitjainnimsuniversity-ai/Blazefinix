import prisma from "@/lib/prisma";
import { ApiError } from "@/lib/api-response";
import {
  DashboardKpis,
  SpikeDetectionItem,
  ThemeStatItem,
  TrendDataPoint,
  TrendResponse,
} from "@/types/api";
import { FeedbackService } from "./feedback.service";

export class AnalyticsService {
  /**
   * Aggregates high-level KPIs for executive dashboards.
   */
  static async getDashboardKpis(workspaceId: string): Promise<DashboardKpis> {
    const [
      totalFeedback,
      positiveCount,
      neutralCount,
      negativeCount,
      newStatus,
      reviewedStatus,
      resolvedStatus,
      archivedStatus,
      activeThemesCount,
      sentimentScoreAgg,
    ] = await Promise.all([
      prisma.feedback.count({ where: { workspaceId } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: "POSITIVE" } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: "NEUTRAL" } }),
      prisma.feedback.count({ where: { workspaceId, sentiment: "NEGATIVE" } }),
      prisma.feedback.count({ where: { workspaceId, status: "NEW" } }),
      prisma.feedback.count({ where: { workspaceId, status: "REVIEWED" } }),
      prisma.feedback.count({ where: { workspaceId, status: "RESOLVED" } }),
      prisma.feedback.count({ where: { workspaceId, status: "ARCHIVED" } }),
      prisma.theme.count({ where: { workspaceId } }),
      prisma.feedback.aggregate({
        where: { workspaceId, sentimentScore: { not: null } },
        _avg: { sentimentScore: true },
      }),
    ]);

    const posPct = totalFeedback > 0 ? Number(((positiveCount / totalFeedback) * 100).toFixed(1)) : 0;
    const neuPct = totalFeedback > 0 ? Number(((neutralCount / totalFeedback) * 100).toFixed(1)) : 0;
    const negPct = totalFeedback > 0 ? Number(((negativeCount / totalFeedback) * 100).toFixed(1)) : 0;

    const spikes = await this.detectSpikes(workspaceId);
    const activeSpikesCount = spikes.filter((s) => s.isSpike).length;

    return {
      totalFeedback,
      sentimentCounts: {
        positive: positiveCount,
        neutral: neutralCount,
        negative: negativeCount,
      },
      sentimentPercentages: {
        positive: posPct,
        neutral: neuPct,
        negative: negPct,
      },
      averageSentimentScore: Number((sentimentScoreAgg._avg.sentimentScore || 0).toFixed(2)),
      activeThemesCount,
      activeSpikesCount,
      statusCounts: {
        new: newStatus,
        reviewed: reviewedStatus,
        resolved: resolvedStatus,
        archived: archivedStatus,
      },
    };
  }

  /**
   * Retrieves theme rankings, counts, and sentiment distribution for all workspace themes.
   */
  static async getThemeStats(workspaceId: string): Promise<ThemeStatItem[]> {
    const totalFeedback = await prisma.feedback.count({ where: { workspaceId } });

    const themes = await prisma.theme.findMany({
      where: { workspaceId },
      orderBy: { count: "desc" },
      include: {
        feedbackThemes: {
          include: {
            feedback: {
              select: {
                sentiment: true,
                createdAt: true,
              },
            },
          },
        },
      },
    });

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    return themes.map((t) => {
      let positive = 0;
      let neutral = 0;
      let negative = 0;
      let recent7d = 0;
      let prior7d = 0;

      for (const ft of t.feedbackThemes) {
        if (!ft.feedback) continue;
        if (ft.feedback.sentiment === "POSITIVE") positive++;
        else if (ft.feedback.sentiment === "NEUTRAL") neutral++;
        else if (ft.feedback.sentiment === "NEGATIVE") negative++;

        const created = new Date(ft.feedback.createdAt);
        if (created >= sevenDaysAgo) {
          recent7d++;
        } else if (created >= fourteenDaysAgo) {
          prior7d++;
        }
      }

      const percentage =
        totalFeedback > 0 ? Number(((t.count / totalFeedback) * 100).toFixed(1)) : 0;

      let recentTrend: "UP" | "DOWN" | "STABLE" = "STABLE";
      if (recent7d > prior7d + 1) recentTrend = "UP";
      else if (recent7d < prior7d - 1) recentTrend = "DOWN";

      return {
        id: t.id,
        name: t.name,
        description: t.description,
        count: t.count,
        percentage,
        sentimentBreakdown: { positive, neutral, negative },
        recentTrend,
      };
    });
  }

  /**
   * Computes time-series trendlines grouped by daily buckets for 7d, 30d, or 90d periods.
   */
  static async getTrends(
    workspaceId: string,
    period: "7d" | "30d" | "90d" = "30d"
  ): Promise<TrendResponse> {
    const days = period === "7d" ? 7 : period === "90d" ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    startDate.setHours(0, 0, 0, 0);

    const feedbackItems = await prisma.feedback.findMany({
      where: {
        workspaceId,
        createdAt: { gte: startDate },
      },
      select: {
        createdAt: true,
        sentiment: true,
      },
      orderBy: { createdAt: "asc" },
    });

    // Initialize daily map
    const dayMap = new Map<string, { total: number; positive: number; neutral: number; negative: number }>();
    for (let i = 0; i < days; i++) {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      const dateKey = d.toISOString().split("T")[0];
      dayMap.set(dateKey, { total: 0, positive: 0, neutral: 0, negative: 0 });
    }

    // Populate counts
    for (const item of feedbackItems) {
      const dateKey = new Date(item.createdAt).toISOString().split("T")[0];
      const entry = dayMap.get(dateKey);
      if (entry) {
        entry.total += 1;
        if (item.sentiment === "POSITIVE") entry.positive += 1;
        else if (item.sentiment === "NEUTRAL") entry.neutral += 1;
        else if (item.sentiment === "NEGATIVE") entry.negative += 1;
      }
    }

    const dataPoints: TrendDataPoint[] = Array.from(dayMap.entries()).map(([date, counts]) => ({
      date,
      total: counts.total,
      positive: counts.positive,
      neutral: counts.neutral,
      negative: counts.negative,
    }));

    return {
      period,
      dataPoints,
    };
  }

  /**
   * Explainable statistical anomaly detection.
   * Compares rolling period volume against historical baseline average.
   * Flags surges with >= 100% volume increase and minimum sample threshold.
   */
  static async detectSpikes(workspaceId: string): Promise<SpikeDetectionItem[]> {
    const now = new Date();
    const currentWindowStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const baselineWindowStart = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);

    const themes = await prisma.theme.findMany({
      where: { workspaceId },
      include: {
        feedbackThemes: {
          include: {
            feedback: {
              select: { createdAt: true },
            },
          },
        },
      },
    });

    const spikes: SpikeDetectionItem[] = [];

    for (const theme of themes) {
      let currentCount = 0;
      let baselineRawCount = 0;

      for (const ft of theme.feedbackThemes) {
        if (!ft.feedback) continue;
        const created = new Date(ft.feedback.createdAt);
        if (created >= currentWindowStart) {
          currentCount++;
        } else if (created >= baselineWindowStart && created < currentWindowStart) {
          baselineRawCount++;
        }
      }

      // Baseline average is 21 days divided into 7-day equivalents (3 rolling periods)
      const baselineAverage = Number((baselineRawCount / 3).toFixed(1));

      let changePercent = 0;
      if (baselineAverage > 0) {
        changePercent = Number((((currentCount - baselineAverage) / baselineAverage) * 100).toFixed(1));
      } else if (currentCount > 0) {
        changePercent = currentCount * 100;
      }

      // Spike Condition: >= 100% surge AND current volume >= 3 items
      const isSpike = changePercent >= 100 && currentCount >= 3;

      const explanation = isSpike
        ? `Surged +${changePercent}% in the last 7 days (${currentCount} mentions vs ${baselineAverage} baseline avg).`
        : `Normal volume: ${currentCount} mentions in the last 7 days compared to ${baselineAverage} baseline.`;

      spikes.push({
        theme: theme.name,
        currentCount,
        baselineAverage,
        changePercent,
        isSpike,
        explanation,
      });
    }

    return spikes.sort((a, b) => (b.isSpike ? 1 : 0) - (a.isSpike ? 1 : 0) || b.changePercent - a.changePercent);
  }

  /**
   * Retrieves theme details and its recent feedback records.
   */
  static async getThemeDrilldown(workspaceId: string, themeId: string) {
    const theme = await prisma.theme.findFirst({
      where: { id: themeId, workspaceId },
      include: {
        feedbackThemes: {
          take: 50,
          orderBy: { feedback: { createdAt: "desc" } },
          include: {
            feedback: {
              include: {
                analysis: true,
              },
            },
          },
        },
      },
    });

    if (!theme) {
      throw new ApiError(404, "NOT_FOUND", `Theme '${themeId}' not found in this workspace.`);
    }

    return {
      theme: {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        count: theme.count,
        createdAt: theme.createdAt.toISOString(),
      },
      feedback: theme.feedbackThemes.map((ft) => FeedbackService.formatFeedbackDto(ft.feedback)),
    };
  }
}
