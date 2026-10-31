import { memberForRoute } from "@/lib/tenancy/context";
import { exportMembersCsv } from "@/services/institutions";

/**
 * The roster as CSV, for institution admins only. Resolved from the
 * session like every campus action: a valid slug for an institution you do
 * not administer returns 404 or 403, never someone else's roster. The
 * export is audited inside the same transaction that reads it.
 */
export async function GET(
  request: Request,
  { params }: RouteContext<"/campus/[slug]/members.csv">
) {
  // A cross-site page could otherwise make an admin's browser run (and
  // audit) an export it cannot read. Browsers send this header; a missing
  // one (curl, old browsers) is allowed because the cookie is still needed.
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") {
    return new Response("Forbidden", { status: 403 });
  }
  const { slug } = await params;
  const ctx = await memberForRoute(slug, "members.export");
  if (ctx instanceof Response) return ctx;
  const csv = await exportMembersCsv(ctx);
  const date = new Date().toISOString().slice(0, 10);

  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="${ctx.institution.slug}-members-${date}.csv"`,
      "cache-control": "private, no-store",
      "x-content-type-options": "nosniff",
    },
  });
}
