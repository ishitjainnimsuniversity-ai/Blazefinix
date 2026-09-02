import prisma from "@/lib/prisma";
import memoryStore from "@/lib/memory-store";
import { ApiError } from "@/lib/api-response";
import {
  DashboardKpis,
  SpikeDetectionItem,
  ThemeStatItem,
  TrendResponse,
} from "@/types/api";

export class AnalyticsService {
  /**
   * Aggregates high-level KPIs for executive dashboards.
   */
  static async getDashboardKpis(workspaceId: string): Promise<DashboardKpis> {
    try {
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
    } catch {
      return memoryStore.getDashboardKpis(workspaceId);
    }
  }

  /**
   * Retrieves theme rankings, counts, and sentiment distribution for all workspace themes.
   */
  static async getThemeStats(workspaceId: string): Promise<ThemeStatItem[]> {
    try {
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

        const accurateCount = t.feedbackThemes.length > 0 ? t.feedbackThemes.length : t.count;
        const percentage =
          totalFeedback > 0 ? Number(((accurateCount / totalFeedback) * 100).toFixed(1)) : 0;

        let recentTrend: "UP" | "DOWN" | "STABLE" = "STABLE";
        if (recent7d > prior7d + 1) recentTrend = "UP";
        else if (recent7d < prior7d - 1) recentTrend = "DOWN";

        return {
          id: t.id,
          name: t.name,
          description: t.description,
          count: accurateCount,
          percentage,
          sentimentBreakdown: { positive, neutral, negative },
          recentTrend,
        };
      });
    } catch {
      return memoryStore.getThemeStats(workspaceId);
    }
  }

  /**
   * Computes time-series trendlines grouped by daily buckets for 7d, 30d, or 90d periods.
   */
  static async getTrends(
    workspaceId: string,
    period: "7d" | "30d" | "90d" = "30d"
  ): Promise<TrendResponse> {
    try {
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

      const dayMap = new Map<string, { total: number; positive: number; neutral: number; negative: number }>();
      for (let i = 0; i < days; i++) {
        const d = new Date(startDate);
        d.setDate(d.getDate() + i);
        const dateKey = d.toISOString().split("T")[0];
        dayMap.set(dateKey, { total: 0, positive: 0, neutral: 0, negative: 0 });
      }

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

      return {
        period,
        dataPoints: Array.from(dayMap.entries()).map(([date, counts]) => ({
          date,
          ...counts,
        })),
      };
    } catch {
      return memoryStore.getTrends(workspaceId, period);
    }
  }

  /**
   * Statistical Anomaly Spike Detection Engine.
   */
  static async detectSpikes(workspaceId: string): Promise<SpikeDetectionItem[]> {
    try {
      const now = new Date();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [recentFeedback, baselineFeedback] = await Promise.all([
        prisma.feedback.findMany({
          where: { workspaceId, createdAt: { gte: sevenDaysAgo } },
          include: { feedbackThemes: { include: { theme: true } } },
        }),
        prisma.feedback.findMany({
          where: { workspaceId, createdAt: { gte: thirtyDaysAgo, lt: sevenDaysAgo } },
          include: { feedbackThemes: { include: { theme: true } } },
        }),
      ]);

      const recentThemeCounts = new Map<string, number>();
      for (const f of recentFeedback) {
        for (const ft of f.feedbackThemes) {
          const name = ft.theme.name;
          recentThemeCounts.set(name, (recentThemeCounts.get(name) || 0) + 1);
        }
      }

      const baselineThemeCounts = new Map<string, number>();
      for (const f of baselineFeedback) {
        for (const ft of f.feedbackThemes) {
          const name = ft.theme.name;
          baselineThemeCounts.set(name, (baselineThemeCounts.get(name) || 0) + 1);
        }
      }

      const spikes: SpikeDetectionItem[] = [];
      const allThemeNames = new Set([
        ...Array.from(recentThemeCounts.keys()),
        ...Array.from(baselineThemeCounts.keys()),
      ]);

      for (const themeName of Array.from(allThemeNames)) {
        const currentCount = recentThemeCounts.get(themeName) || 0;
        const historicalCount = baselineThemeCounts.get(themeName) || 0;
        const baselineAverage = Number((historicalCount / (23 / 7)).toFixed(1)) || 1.0;

        const changePercent = Number(
          (((currentCount - baselineAverage) / Math.max(1, baselineAverage)) * 100).toFixed(1)
        );

        const isSpike = currentCount >= 4 && changePercent >= 100.0;

        let explanation = `Mentions are nominal (${currentCount} in 7d vs ${baselineAverage} baseline avg).`;
        if (isSpike) {
          explanation = `Surged +${changePercent}% in the last 7 days (${currentCount} mentions vs ${baselineAverage} baseline avg).`;
        }

        spikes.push({
          theme: themeName,
          currentCount,
          baselineAverage,
          changePercent,
          isSpike,
          explanation,
        });
      }

      return spikes.sort((a, b) => b.changePercent - a.changePercent);
    } catch {
      return memoryStore.detectSpikes(workspaceId);
    }
  }

  /**
   * Retrieves single theme drill-down information.
   */
  static async getThemeDrilldown(workspaceId: string, themeId: string) {
    return this.getThemeDetails(workspaceId, themeId);
  }

  static async getThemeDetails(workspaceId: string, themeId: string) {
    try {
      const theme = await prisma.theme.findFirst({
        where: { id: themeId, workspaceId },
        include: {
          feedbackThemes: {
            include: {
              feedback: {
                include: { analysis: true },
              },
            },
            take: 20,
          },
        },
      });

      if (!theme) {
        throw new ApiError(404, "NOT_FOUND", `Theme '${themeId}' not found.`);
      }

      return {
        id: theme.id,
        name: theme.name,
        description: theme.description,
        count: theme.count,
        recentFeedback: theme.feedbackThemes
          .filter((ft) => ft.feedback)
          .map((ft) => ({
            id: ft.feedback.id,
            rawText: ft.feedback.rawText,
            sentiment: ft.feedback.sentiment,
            sentimentScore: ft.feedback.sentimentScore,
            status: ft.feedback.status,
            createdAt: ft.feedback.createdAt,
          })),
      };
    } catch (err: any) {
      if (err instanceof ApiError) throw err;
      const stats = memoryStore.getThemeStats(workspaceId);
      const found = stats.find((s) => s.id === themeId || s.name.toLowerCase() === themeId.toLowerCase());
      if (!found) {
        throw new ApiError(404, "NOT_FOUND", `Theme '${themeId}' not found.`);
      }
      return {
        id: found.id,
        name: found.name,
        description: found.description,
        count: found.count,
        recentFeedback: memoryStore.listFeedback(workspaceId, { theme: found.name, pageSize: 20 }).items,
      };
    }
  }
}
