import { z } from "zod";

import { InstitutionError, memberForRoute } from "@/lib/tenancy/context";
import { exportClassCsv } from "@/services/campus-analytics";

/**
 * One class's student results as CSV, for someone who teaches that class.
 * Same rules as members.csv: the institution comes from the session, a
 * cross-site request is refused, and the export is audited where it is read.
 */
const DAY = 86_400_000;
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export async function GET(
  request: Request,
  { params }: RouteContext<"/campus/[slug]/analytics/export">
) {
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return new Response("Forbidden", { status: 403 });
  }
  const { slug } = await params;
  const ctx = await memberForRoute(slug, "analytics.view");
  if (ctx instanceof Response) return ctx;

  const url = new URL(request.url);
  const classId = z.string().min(1).max(64).safeParse(url.searchParams.get("class"));
  if (!classId.success) return new Response("Bad request", { status: 400 });
  const fromParam = dateSchema.safeParse(url.searchParams.get("from"));
  const toParam = dateSchema.safeParse(url.searchParams.get("to"));
  const to = toParam.success ? new Date(`${toParam.data}T23:59:59.999Z`) : new Date();
  const from = fromParam.success
    ? new Date(`${fromParam.data}T00:00:00Z`)
    : new Date(to.getTime() - 90 * DAY);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) {
    return new Response("Bad request", { status: 400 });
  }

  try {
    const { filename, csv } = await exportClassCsv(ctx, classId.data, { from, to });
    return new Response(csv, {
      headers: {
        "content-type": "text/csv; charset=utf-8",
        "content-disposition": `attachment; filename="${filename}"`,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    if (!(error instanceof InstitutionError)) throw error;
    const status =
      error.code === "forbidden" ? 403 : error.code === "invalid" ? 400 : 404;
    return new Response(error.code === "invalid" ? error.message : "Not available", {
      status,
    });
  }
}
