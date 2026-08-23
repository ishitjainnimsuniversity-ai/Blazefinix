import { NextRequest } from "next/server";
import { getAuthSession } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { AnalyticsService } from "@/services/analytics.service";

export const dynamic = "force-dynamic";

/**
 * GET /api/analytics/spikes
 * Retrieves explainable statistical anomaly volume spikes across themes.
 */
export async function GET(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    const spikes = await AnalyticsService.detectSpikes(session.workspaceId);
    return apiSuccess(spikes);
  } catch (error) {
    return handleApiError(error);
  }
}
