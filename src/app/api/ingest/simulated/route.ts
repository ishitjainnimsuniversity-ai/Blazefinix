import { NextRequest } from "next/server";
import { getAuthSession, requireRole } from "@/lib/auth";
import { apiSuccess, handleApiError } from "@/lib/api-response";
import { SimulatedIngestSchema } from "@/lib/validation/simulated.schema";
import { IngestionService } from "@/services/ingestion.service";

export const dynamic = "force-dynamic";

/**
 * POST /api/ingest/simulated
 * Ingests a single feedback payload from simulated channels (Website, App, Support, Survey, Social).
 * RBAC: ADMIN, ANALYST
 */
export async function POST(req: NextRequest) {
  try {
    const session = await getAuthSession(req);
    requireRole(session, ["ADMIN", "ANALYST"]);

    const body = await req.json();
    const input = SimulatedIngestSchema.parse(body);

    const result = await IngestionService.ingestSimulated(session.workspaceId, input);
    return apiSuccess(result, 201);
  } catch (error) {
    return handleApiError(error);
  }
}
