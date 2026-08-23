import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/trends
 * Retrieves time-series volume and sentiment trajectory (7d, 30d, 90d).
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const periodParam = req.nextUrl.searchParams.get("period");
    const period = periodParam === "7d" || periodParam === "90d" ? periodParam : "30d";

    const trends = await AnalyticsService.getTrends(session.workspaceId, period);
    return apiSuccess(trends);
  } catch (error) {
    return handleApiError(error);
  }
}
