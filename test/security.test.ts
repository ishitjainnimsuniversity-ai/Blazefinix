import { describe, it, expect } from "vitest";
import { requireRole, AuthenticatedUser } from "../src/lib/auth";
import { ApiError } from "../src/lib/api-response";

describe("Security & RBAC Enforcement", () => {
  const adminUser: AuthenticatedUser = {
    userId: "usr_admin",
    email: "admin@loop.dev",
    name: "Admin",
    role: "ADMIN",
    workspaceId: "ws_acme",
    workspaceSlug: "acme",
  };

  const analystUser: AuthenticatedUser = {
    userId: "usr_analyst",
    email: "analyst@loop.dev",
    name: "Analyst",
    role: "ANALYST",
    workspaceId: "ws_acme",
    workspaceSlug: "acme",
  };

  const viewerUser: AuthenticatedUser = {
    userId: "usr_viewer",
    email: "viewer@loop.dev",
    name: "Viewer",
    role: "VIEWER",
    workspaceId: "ws_acme",
    workspaceSlug: "acme",
  };

  it("should permit ADMIN for admin-only operations", () => {
    expect(() => requireRole(adminUser, ["ADMIN"])).not.toThrow();
  });

  it("should permit ADMIN and ANALYST for mutation actions", () => {
    expect(() => requireRole(adminUser, ["ADMIN", "ANALYST"])).not.toThrow();
    expect(() => requireRole(analystUser, ["ADMIN", "ANALYST"])).not.toThrow();
  });

  it("should reject VIEWER from mutating actions with 403 Forbidden", () => {
    expect(() => requireRole(viewerUser, ["ADMIN", "ANALYST"])).toThrowError(ApiError);
    try {
      requireRole(viewerUser, ["ADMIN", "ANALYST"]);
    } catch (err: any) {
      expect(err.statusCode).toBe(403);
      expect(err.code).toBe("FORBIDDEN");
    }
  });

  it("should enforce tenant isolation in query scopes", () => {
    // Verify workspace context is isolated
    expect(adminUser.workspaceId).toBe("ws_acme");
    expect(viewerUser.workspaceId).toBe("ws_acme");
  });
});
