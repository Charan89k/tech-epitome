import { NextRequest } from "next/server";
import { describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ fail: false }));
vi.mock("@/lib/db", () => ({
  prisma: {
    $queryRaw: () => (db.fail ? Promise.reject(new Error("ECONNREFUSED 10.0.0.5")) : Promise.resolve([1])),
  },
}));

import { GET } from "./route";

const get = (q = "") => GET(new NextRequest(`http://localhost/api/health${q}`));

describe("health", () => {
  it("answers liveness without touching the database", async () => {
    db.fail = true;
    const res = await get();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ status: "ok" });
  });

  it("reports readiness from the database and leaks no error text", async () => {
    db.fail = false;
    expect((await get("?ready=1")).status).toBe(200);
    db.fail = true;
    const res = await get("?ready=1");
    expect(res.status).toBe(503);
    expect(JSON.stringify(await res.json())).not.toMatch(/ECONNREFUSED|10\.0/);
    expect(res.headers.get("cache-control")).toBe("no-store");
  });
});
