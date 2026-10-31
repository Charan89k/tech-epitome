import type { Metadata } from "next";
import Link from "next/link";
import { z } from "zod";

import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { orRefuse } from "@/lib/campus/guard";
import { show } from "@/lib/campus/metrics";
import { requireMember } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import { getAnalytics } from "@/services/campus-analytics";

export const metadata: Metadata = { title: "Analytics" };

const DAY = 86_400_000;
const MAX_RANGE_DAYS = 730;
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

/** Filters from the URL, validated; anything malformed falls back to defaults. */
function readFilter(params: Record<string, string | string[] | undefined>) {
  const one = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : "";
  const toDay = dateSchema.safeParse(one("to")).success ? one("to") : "";
  let to = toDay ? new Date(`${toDay}T23:59:59.999Z`) : new Date();
  if (Number.isNaN(to.getTime())) to = new Date();
  const fromDay = dateSchema.safeParse(one("from")).success ? one("from") : "";
  let from = fromDay
    ? new Date(`${fromDay}T00:00:00Z`)
    : new Date(to.getTime() - 90 * DAY);
  if (Number.isNaN(from.getTime()) || from > to)
    from = new Date(to.getTime() - 90 * DAY);
  if (to.getTime() - from.getTime() > MAX_RANGE_DAYS * DAY) {
    from = new Date(to.getTime() - MAX_RANGE_DAYS * DAY);
  }
  const classId = z.string().min(1).max(64).safeParse(one("class"));
  const page = z.coerce
    .number()
    .int()
    .min(1)
    .max(1000)
    .safeParse(one("page") || "1");
  return {
    from,
    to,
    classId: classId.success ? classId.data : undefined,
    page: page.success ? page.data : 1,
  };
}

const day = (d: Date) => d.toISOString().slice(0, 10);

/**
 * Learning analytics. Every figure is computed from stored records; a dash
 * means there is no data to compute from, which is not the same as zero.
 * Aggregates only; student-level detail is in the class pages and the
 * audited per-class export.
 */
export default async function AnalyticsPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]/analytics">) {
  const { slug } = await params;
  const ctx = await requireMember(slug, "analytics.view");
  const filter = readFilter(await searchParams);
  const data = await orRefuse(getAnalytics(ctx, filter));
  const base = `/campus/${ctx.institution.slug}`;
  const query = (extra: Record<string, string>) =>
    new URLSearchParams({
      from: day(filter.from),
      to: day(filter.to),
      ...extra,
    }).toString();

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Analytics"
        description={
          data.enrolment
            ? `${ctx.institution.name}: every class.`
            : `${ctx.institution.name}: the classes you teach.`
        }
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: "Analytics" }]} />}
      />

      <form method="get" className="mt-6 flex flex-wrap items-end gap-3">
        <div>
          <label htmlFor="from" className="text-xs font-medium">
            From
          </label>
          <Input
            id="from"
            name="from"
            type="date"
            defaultValue={day(filter.from)}
            className="mt-1"
          />
        </div>
        <div>
          <label htmlFor="to" className="text-xs font-medium">
            To
          </label>
          <Input
            id="to"
            name="to"
            type="date"
            defaultValue={day(filter.to)}
            className="mt-1"
          />
        </div>
        {filter.classId && <input type="hidden" name="class" value={filter.classId} />}
        <Button type="submit" size="sm">
          Apply
        </Button>
        {filter.classId && (
          <Link
            href={route(`${base}/analytics?${query({})}`)}
            className="text-sm underline"
          >
            All classes
          </Link>
        )}
      </form>
      <p className="mt-2 text-xs text-muted-foreground">
        Dates (UTC) select assessments by deadline and members by join date.
        Assigned-content progress is current, not limited to the range. A dash means no
        data, not zero.
      </p>

      {data.enrolment && (
        <section aria-labelledby="enrolment" className="mt-8">
          <h2 id="enrolment" className="text-base font-semibold">
            Enrolment
          </h2>
          <table className="mt-3 w-full max-w-xl text-sm">
            <caption className="sr-only">Members by role and status</caption>
            <thead>
              <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                <th scope="col" className="py-2 font-medium">
                  Role
                </th>
                <th scope="col" className="py-2 font-medium">
                  Active
                </th>
                <th scope="col" className="py-2 font-medium">
                  Suspended
                </th>
                <th scope="col" className="py-2 font-medium">
                  Revoked
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {data.enrolment.byRole.map((r) => (
                <tr key={r.role}>
                  <th scope="row" className="py-2 text-left font-normal">
                    {r.role.replace("_", " ").toLowerCase()}
                  </th>
                  <td className="py-2 tabular-nums">{r.active}</td>
                  <td className="py-2 tabular-nums">{r.suspended}</td>
                  <td className="py-2 tabular-nums">{r.revoked}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 text-sm">
            Joined in this range:{" "}
            <span className="tabular-nums">{data.enrolment.joinedInRange}</span>
          </p>
        </section>
      )}

      <section aria-labelledby="classes" className="mt-8 space-y-6">
        <h2 id="classes" className="text-base font-semibold">
          Classes
        </h2>
        {data.classes.length === 0 && (
          <p className="text-sm text-muted-foreground">No classes to report on.</p>
        )}
        {data.classes.map((c) => (
          <article key={c.id} className="rounded-lg border border-border p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">
                <Link
                  href={route(`${base}/classes/${c.id}`)}
                  className="hover:underline"
                >
                  {c.name}
                </Link>{" "}
                <span className="text-xs font-normal text-muted-foreground">
                  {c.students} active {c.students === 1 ? "student" : "students"}
                </span>
              </h3>
              <div className="flex gap-3 text-xs">
                {!filter.classId && (
                  <Link
                    href={route(`${base}/analytics?${query({ class: c.id })}`)}
                    className="underline"
                  >
                    Only this class
                  </Link>
                )}
                <a
                  href={`${base}/analytics/export?${query({ class: c.id })}`}
                  className="underline"
                >
                  Export student results (CSV, audited)
                </a>
              </div>
            </div>

            <h4 className="mt-4 text-sm font-medium">Assigned learning completed</h4>
            {c.assignments.length === 0 ? (
              <p className="text-xs text-muted-foreground">Nothing assigned.</p>
            ) : (
              <ul className="mt-1 space-y-1 text-sm">
                {c.assignments.map((a) => (
                  <li key={a.id} className="flex justify-between gap-3">
                    <span>{a.title}</span>
                    <span className="text-muted-foreground tabular-nums">
                      {show(a.completion, "%")} ({a.completed} of {c.students})
                    </span>
                  </li>
                ))}
              </ul>
            )}

            <h4 className="mt-4 text-sm font-medium">Assessments due in this range</h4>
            {c.assessments.length === 0 ? (
              <p className="text-xs text-muted-foreground">None.</p>
            ) : (
              <div className="mt-1 overflow-x-auto">
                <table className="w-full min-w-[34rem] text-sm">
                  <caption className="sr-only">
                    Assessment outcomes for {c.name}
                  </caption>
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                      <th scope="col" className="py-2 font-medium">
                        Assessment
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Participation
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Median score
                      </th>
                      <th scope="col" className="py-2 font-medium">
                        Awaiting grading
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {c.assessments.map((a) => (
                      <tr key={a.id}>
                        <th scope="row" className="py-2 text-left font-normal">
                          <Link
                            href={route(`${base}/assessments/${a.id}`)}
                            className="hover:underline"
                          >
                            {a.title}
                          </Link>
                        </th>
                        <td className="py-2 tabular-nums">
                          {show(a.participation, "%")} ({a.participated} of {a.students}
                          )
                        </td>
                        <td className="py-2 tabular-nums">
                          {show(a.medianScore, "%")} (n={a.graded})
                        </td>
                        <td className="py-2 tabular-nums">{a.pendingGrading}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </article>
        ))}
      </section>

      {data.pages > 1 && (
        <nav aria-label="Pages" className="mt-6 flex items-center gap-3 text-sm">
          {data.page > 1 && (
            <Link
              href={route(
                `${base}/analytics?${query({ page: String(data.page - 1) })}`
              )}
              className="underline"
            >
              Previous
            </Link>
          )}
          <span>
            Page {data.page} of {data.pages}
          </span>
          {data.page < data.pages && (
            <Link
              href={route(
                `${base}/analytics?${query({ page: String(data.page + 1) })}`
              )}
              className="underline"
            >
              Next
            </Link>
          )}
        </nav>
      )}
    </div>
  );
}
