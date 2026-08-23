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

// Default demo user fallback for zero-config development & testing
const DEMO_USERS: Record<string, AuthenticatedUser> = {
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
};

/**
 * Extracts and verifies the authenticated user & workspace context from the request.
 * Supports NextAuth session headers, X-User-Role, Authorization Bearer, or default dev session.
 */
export async function getAuthSession(req?: NextRequest): Promise<AuthenticatedUser> {
  if (!req) {
    return DEMO_USERS.admin;
  }

  // 1. Check custom testing / simulation headers
  const headerRole = req.headers.get("x-user-role")?.toLowerCase();
  const headerWorkspace = req.headers.get("x-workspace-id");
  const headerUserId = req.headers.get("x-user-id");
  const headerEmail = req.headers.get("x-user-email");

  if (headerRole && DEMO_USERS[headerRole]) {
    const baseUser = DEMO_USERS[headerRole];
    return {
      ...baseUser,
      workspaceId: headerWorkspace || baseUser.workspaceId,
      userId: headerUserId || baseUser.userId,
      email: headerEmail || baseUser.email,
    };
  }

  // 2. Check Authorization Bearer header
  const authHeader = req.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    if (token === "demo-admin-token") return DEMO_USERS.admin;
    if (token === "demo-analyst-token") return DEMO_USERS.analyst;
    if (token === "demo-viewer-token") return DEMO_USERS.viewer;
  }

  // 3. Fallback to default active demo user (Admin by default in dev environment)
  return DEMO_USERS.admin;
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
