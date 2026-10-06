import Link from "next/link";

/**
 * Right-rail progress card for a design catalogue: how many exercises the
 * learner has submitted, with drafts called out separately. Signed out, it
 * says what an account would add instead of showing a fabricated zero.
 */
export function DesignProgress({
  statuses,
  signedIn,
  signedOutText,
}: {
  statuses: ("NOT_STARTED" | "IN_PROGRESS" | "COMPLETED")[];
  signedIn: boolean;
  signedOutText: string;
}) {
  const total = statuses.length;
  const submitted = statuses.filter((s) => s === "COMPLETED").length;
  const drafts = statuses.filter((s) => s === "IN_PROGRESS").length;
  const percent = total ? Math.round((submitted / total) * 100) : 0;

  return (
    <aside
      aria-label="Progress"
      className="h-fit rounded-xl border border-border bg-card p-4"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold">Progress</h2>
        {signedIn && (
          <span className="text-xs text-muted-foreground tabular-nums">
            {submitted} / {total} submitted
          </span>
        )}
      </div>

      {signedIn ? (
        <>
          <div
            className="mt-4 h-1.5 overflow-hidden rounded-full bg-muted"
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Exercises submitted"
          >
            <div
              className="h-full rounded-full bg-ember-500"
              style={{ width: `${percent}%` }}
            />
          </div>
          <dl className="mt-4 grid grid-cols-3 gap-2 text-center">
            {[
              { label: "Submitted", value: submitted },
              { label: "Drafts", value: drafts },
              { label: "To do", value: total - submitted - drafts },
            ].map((row) => (
              <div
                key={row.label}
                className="flex flex-col-reverse rounded-lg bg-muted/40 px-2 py-2"
              >
                <dt className="text-[0.65rem] text-muted-foreground">{row.label}</dt>
                <dd className="font-mono text-base font-semibold tabular-nums">
                  {row.value}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="mt-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            {signedOutText}
          </p>
          <Link
            href="/signup"
            className="mt-3 inline-block text-xs font-medium text-ember-300 hover:underline"
          >
            Create a free account
          </Link>
        </div>
      )}
    </aside>
  );
}
