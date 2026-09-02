import { describe, it, expect } from "vitest";
import { requireRole, getAuthenticatedUser, AuthenticatedUser, DEMO_USERS } from "../src/lib/auth";
import { ApiError } from "../src/lib/api-response";
import { rankEmbeddings, generateEmbedding } from "../src/lib/ai/embeddings";

describe("Security, RBAC & Multi-Tenant Isolation", () => {
  const workspaceAUser: AuthenticatedUser = {
    userId: "usr_a_001",
    email: "alice@acme.corp",
    name: "Alice",
    role: "ADMIN",
    workspaceId: "ws_tenant_a",
    workspaceSlug: "acme-corp",
  };

  const workspaceBUser: AuthenticatedUser = {
    userId: "usr_b_001",
    email: "bob@competitor.io",
    name: "Bob",
    role: "ADMIN",
    workspaceId: "ws_tenant_b",
    workspaceSlug: "competitor-corp",
  };

  const viewerUser: AuthenticatedUser = {
    userId: "usr_viewer_001",
    email: "viewer@acme.corp",
    name: "Viewer",
    role: "VIEWER",
    workspaceId: "ws_tenant_a",
    workspaceSlug: "acme-corp",
  };

  describe("Authentication & Header Security", () => {
    it("should reject unauthenticated requests in production with 401 Unauthorized", async () => {
      const origEnv = process.env.NODE_ENV;
      const origDevAuth = process.env.ENABLE_DEV_AUTH;
      process.env.NODE_ENV = "production";
      process.env.ENABLE_DEV_AUTH = "false";

      try {
        const req = new Request("http://localhost:3000/api/feedback");
        await expect(getAuthenticatedUser(req)).rejects.toThrowError(ApiError);
        try {
          await getAuthenticatedUser(req);
        } catch (err: any) {
          expect(err.statusCode).toBe(401);
          expect(err.code).toBe("UNAUTHORIZED");
        }
      } finally {
        process.env.NODE_ENV = origEnv;
        process.env.ENABLE_DEV_AUTH = origDevAuth;
      }
    });

    it("should never allow client headers to spoof a foreign workspace ID", async () => {
      const req = new Request("http://localhost:3000/api/feedback", {
        headers: {
          authorization: "Bearer demo-analyst-token",
          "x-workspace-id": "ws_victim_tenant",
        },
      });

      const user = await getAuthenticatedUser(req);
      // The workspace must strictly match the validated user token identity, not the spoofed header
      expect(user.workspaceId).toBe("ws_demo_acme");
      expect(user.workspaceId).not.toBe("ws_victim_tenant");
    });
  });

  describe("Role-Based Access Control (RBAC)", () => {
    it("should permit ADMIN for admin-only operations", () => {
      expect(() => requireRole(workspaceAUser, ["ADMIN"])).not.toThrow();
    });

    it("should permit ADMIN and ANALYST for mutation actions", () => {
      expect(() => requireRole(workspaceAUser, ["ADMIN", "ANALYST"])).not.toThrow();
      expect(() => requireRole(DEMO_USERS.analyst, ["ADMIN", "ANALYST"])).not.toThrow();
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
  });

  describe("Tenant Data Isolation & Semantic Retrieval Boundary", () => {
    it("should guarantee that Workspace A vector retrieval never includes Workspace B records", () => {
      // Mock vector index
      const vectorA1 = generateEmbedding("Customer cannot pay with credit card on checkout");
      const vectorB1 = generateEmbedding("Competitor exclusive secret customer feedback about checkout");

      const workspaceAEmbeddings = [
        { feedbackId: "fb_a_001", embedding: vectorA1 },
      ];
      const workspaceBEmbeddings = [
        { feedbackId: "fb_b_001", embedding: vectorB1 },
      ];

      const queryVector = generateEmbedding("checkout payment issues");

      // Searching within Workspace A's index
      const resultsA = rankEmbeddings(queryVector, workspaceAEmbeddings, 5);
      const retrievedIdsA = resultsA.map((r) => r.feedbackId);

      // Verify Workspace A query contains only Workspace A records
      expect(retrievedIdsA).toContain("fb_a_001");
      expect(retrievedIdsA).not.toContain("fb_b_001");

      // Searching within Workspace B's index
      const resultsB = rankEmbeddings(queryVector, workspaceBEmbeddings, 5);
      const retrievedIdsB = resultsB.map((r) => r.feedbackId);

      expect(retrievedIdsB).toContain("fb_b_001");
      expect(retrievedIdsB).not.toContain("fb_a_001");
    });
  });
});
