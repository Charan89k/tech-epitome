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
          <table className="mt-3 w-full">
            <caption className="sr-only">Latest run of each job</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  Job
                </th>
                <th scope="col" className="py-2 font-medium">
                  Last run
                </th>
                <th scope="col" className="py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="py-2 font-medium">
                  Result
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ops.jobs.map((r) => (
                <tr key={r.id}>
                  <td className="py-2">{r.job}</td>
                  <td className="py-2">{when(r.startedAt)}</td>
                  <td
                    className={`py-2 ${r.status === "FAILED" || r.status === "STALE" ? "text-destructive" : ""}`}
                  >
                    {r.status.toLowerCase()}
                  </td>
                  <td className="py-2 font-mono text-xs">
                    {r.error ?? (r.summary ? JSON.stringify(r.summary) : "")}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          <table className="mt-3 w-full">
            <caption className="sr-only">Recent failed sends</caption>
            <thead>
              <tr className="border-b border-border text-left text-xs text-muted-foreground">
                <th scope="col" className="py-2 font-medium">
                  When
                </th>
                <th scope="col" className="py-2 font-medium">
                  Kind
                </th>
                <th scope="col" className="py-2 font-medium">
                  Status
                </th>
                <th scope="col" className="py-2 font-medium">
                  Attempts
                </th>
                <th scope="col" className="py-2 font-medium">
                  Reason
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {ops.recentFailures.map((f) => (
                <tr key={f.id}>
                  <td className="py-2">{when(f.createdAt)}</td>
                  <td className="py-2">{f.kind}</td>
                  <td className="py-2">{f.status}</td>
                  <td className="py-2 tabular-nums">{f.attempts}</td>
                  <td className="py-2 text-xs">{f.reason}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </div>
  );
}
