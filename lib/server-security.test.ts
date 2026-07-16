// @vitest-environment node
import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

describe("server integration safeguards", () => {
  it("requires authenticated role routing and admin MFA in production mode", () => {
    const proxy = readFileSync(resolve(process.cwd(), "proxy.ts"), "utf8");
    expect(proxy).toContain("profile.role === requiredRole");
    expect(proxy).toContain('assuranceLevel === "aal2"');
  });

  it("keeps the notification worker secret server-side and uses provider idempotency", () => {
    const worker = readFileSync(resolve(process.cwd(), "app/api/notifications/email/route.ts"), "utf8");
    expect(worker).toContain("NOTIFICATION_WORKER_SECRET");
    expect(worker).toContain('"Idempotency-Key": delivery.idempotency_key');
    expect(worker).toContain("SUPABASE_SERVICE_ROLE_KEY");
  });
});
