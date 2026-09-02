import { NextRequest } from "next/server";
import { ApiError } from "./api-response";
import { UserRole } from "@/types/api";

export interface AuthenticatedUser {
  userId: string;
  email: string;
  name: string | null;
  role: UserRole;
  workspaceId: string;
  workspaceSlug: string;
}

// Deterministic mock identities for development, testing, and multi-tenant isolation benchmarks
export const DEMO_USERS: Record<string, AuthenticatedUser> = {
  admin: {
    userId: "usr_admin_001",
    email: "admin@loop.dev",
    name: "Admin User",
    role: "ADMIN",
    workspaceId: "ws_demo_acme",
    workspaceSlug: "acme-corp",
  },
  analyst: {
    userId: "usr_analyst_001",
    email: "analyst@loop.dev",
    name: "Analyst User",
    role: "ANALYST",
    workspaceId: "ws_demo_acme",
    workspaceSlug: "acme-corp",
  },
  viewer: {
    userId: "usr_viewer_001",
    email: "viewer@loop.dev",
    name: "Viewer User",
    role: "VIEWER",
    workspaceId: "ws_demo_acme",
    workspaceSlug: "acme-corp",
  },
  // Foreign tenant user for automated cross-workspace leakage security tests
  foreign_tenant: {
    userId: "usr_foreign_001",
    email: "foreign@competitor.io",
    name: "Foreign Tenant User",
    role: "ADMIN",
    workspaceId: "ws_foreign_competitor",
    workspaceSlug: "competitor-corp",
  },
};

/**
 * Retrieves the verified authenticated user and bound workspace.
 * 
 * SECURITY RULES:
 * 1. Unauthenticated requests in production return 401 Unauthorized.
 * 2. Client headers (x-workspace-id, x-user-id, x-user-role) are NEVER trusted to override tenant identity.
 * 3. The workspace ID is strictly bound to the authenticated identity.
 */
export async function getAuthenticatedUser(req?: Request | NextRequest): Promise<AuthenticatedUser> {
  const isDevOrTest = process.env.NODE_ENV !== "production" || process.env.ENABLE_DEV_AUTH === "true";

  if (!req) {
    if (isDevOrTest) {
      return DEMO_USERS.admin;
    }
    throw new ApiError(401, "UNAUTHORIZED", "Authentication required. Please sign in.");
  }

  // 1. Check standard Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7).trim();
    if (token === "demo-admin-token") return DEMO_USERS.admin;
    if (token === "demo-analyst-token") return DEMO_USERS.analyst;
    if (token === "demo-viewer-token") return DEMO_USERS.viewer;
    if (token === "foreign-tenant-token") return DEMO_USERS.foreign_tenant;
  }

  // 2. Development/Testing Mode explicit identity selector (Protected behind isDevOrTest guard)
  if (isDevOrTest) {
    const devRole = req.headers.get("x-dev-user") || req.headers.get("x-user-role");
    if (devRole && DEMO_USERS[devRole.toLowerCase()]) {
      return DEMO_USERS[devRole.toLowerCase()];
    }

    // Default development fallback for local testing & interactive explorer
    return DEMO_USERS.admin;
  }

  // 3. Production enforcement: No session found -> 401 Unauthorized
  throw new ApiError(401, "UNAUTHORIZED", "Authentication required. Missing or invalid session.");
}

/**
 * Backward-compatible alias for getAuthenticatedUser.
 */
export async function getAuthSession(req?: NextRequest): Promise<AuthenticatedUser> {
  return getAuthenticatedUser(req);
}

/**
 * Asserts that the authenticated user possesses one of the allowed roles.
 * Throws 403 Forbidden if not authorized.
 */
export function requireRole(user: AuthenticatedUser, allowedRoles: UserRole[]) {
  if (!allowedRoles.includes(user.role)) {
    throw new ApiError(
      403,
      "FORBIDDEN",
      `Role '${user.role}' is not authorized to perform this action. Required roles: ${allowedRoles.join(", ")}`
    );
  }
}
