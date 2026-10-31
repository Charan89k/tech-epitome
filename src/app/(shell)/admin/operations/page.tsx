import type { Metadata } from "next";

import { getOperationsOverview } from "@/services/operations";

export const metadata: Metadata = { title: "Operations" };

const when = (d: Date | null) =>
  d ? `${d.toISOString().slice(0, 16).replace("T", " ")} UTC` : "—";

/**
 * Scheduled jobs and email delivery, for platform admins (the /admin layout
 * enforces that). Counts and statuses only: no addresses or message text.
 */
export default async function OperationsPage() {
  const ops = await getOperationsOverview();

  return (
    <div className="space-y-8 text-sm">
      <section aria-labelledby="jobs">
        <h2 id="jobs" className="text-base font-semibold">
          Scheduled jobs
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          POST /api/cron/notifications (review reminders) and /api/cron/retention
          (transcript retention). A job with no runs here has never been called by a
          scheduler. Only one run of a job can be in progress at a time; a second call
          gets 409.
        </p>
        {ops.jobs.length === 0 ? (
          <p className="mt-2 text-muted-foreground">No runs recorded.</p>
        ) : (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[48rem]">
              <caption className="sr-only">Latest run of each job</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Job
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Last run
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ops.jobs.map((r) => (
                  <tr key={r.id}>
                    <td className="px-4 py-2.5 align-top">{r.job}</td>
                    <td className="px-4 py-2.5 align-top">{when(r.startedAt)}</td>
                    <td
                      className={`px-4 py-2.5 align-top ${r.status === "FAILED" || r.status === "STALE" ? "text-destructive" : ""}`}
                    >
                      {r.status.toLowerCase()}
                    </td>
                    <td className="px-4 py-2.5 align-top font-mono text-xs break-all">
                      {r.error ?? (r.summary ? JSON.stringify(r.summary) : "")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section aria-labelledby="email">
        <h2 id="email" className="text-base font-semibold">
          Email, last 7 days
        </h2>
        <ul className="mt-2 space-y-1">
          {ops.deliveries.length === 0 && ops.invitations.length === 0 && (
            <li className="text-muted-foreground">No sends.</li>
          )}
          {ops.deliveries.map((d) => (
            <li key={`${d.kind}:${d.status}`}>
              {d.kind}: {d.status} <span className="tabular-nums">{d.count}</span>
            </li>
          ))}
          {ops.invitations.map((i) => (
            <li key={i.status}>
              institution invitations: {i.status}{" "}
              <span className="tabular-nums">{i.count}</span>
            </li>
          ))}
        </ul>
        <p className="mt-2">
          Waiting for a retry: <span className="tabular-nums">{ops.retryable}</span>.
          Outcome unknown (a send started and never finished):{" "}
          <span className="tabular-nums">{ops.unknown}</span>. In-app notifications in
          the last day: <span className="tabular-nums">{ops.notificationsLastDay}</span>
          .
        </p>
        {ops.recentFailures.length > 0 && (
          <div className="mt-3 overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full min-w-[48rem]">
              <caption className="sr-only">Recent failed sends</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    When
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Kind
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Status
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Attempts
                  </th>
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Reason
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {ops.recentFailures.map((f) => (
                  <tr key={f.id}>
                    <td className="px-4 py-2.5 align-top">{when(f.createdAt)}</td>
                    <td className="px-4 py-2.5 align-top">{f.kind}</td>
                    <td className="px-4 py-2.5 align-top">{f.status}</td>
                    <td className="px-4 py-2.5 align-top tabular-nums">{f.attempts}</td>
                    <td className="px-4 py-2.5 align-top text-xs">{f.reason}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
