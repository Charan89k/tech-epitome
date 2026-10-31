import { NextResponse, type NextRequest } from "next/server";

import { prisma } from "@/lib/db";

/**
 * Health for the container runtime, the reverse proxy and uptime monitors.
 *
 *   GET /api/health          liveness: the process answers. No database.
 *   GET /api/health?ready=1  readiness: the database answers within 2 s.
 *
 * Deliberately says nothing else: no version, host, driver or error text,
 * so a public probe learns only "up" or "down".
 */
export const dynamic = "force-dynamic";

const READY_TIMEOUT_MS = 2_000;
const headers = { "cache-control": "no-store" };

export async function GET(request: NextRequest) {
  if (request.nextUrl.searchParams.get("ready") !== "1") {
    return NextResponse.json({ status: "ok" }, { headers });
  }
  try {
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), READY_TIMEOUT_MS)
      ),
    ]);
    return NextResponse.json({ status: "ok", database: "ok" }, { headers });
  } catch {
    return NextResponse.json(
      { status: "unavailable", database: "down" },
      { status: 503, headers }
    );
  }
}
