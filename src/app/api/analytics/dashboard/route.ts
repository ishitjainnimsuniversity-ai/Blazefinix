import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/dashboard
 * Retrieves top-level KPI metrics, sentiment distributions, and status summaries.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const kpis = await AnalyticsService.getDashboardKpis(session.workspaceId);
    return apiSuccess(kpis);
  } catch (error) {
    return handleApiError(error);
  }
}
