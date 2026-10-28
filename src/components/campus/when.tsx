"use client";

/**
 * A server time shown in the reader's own zone. The server render uses
 * UTC, then the browser re-renders in local time; the warning is
 * suppressed because that difference is the point.
 */
export function When({ date }: { date: Date | string | null }) {
  if (!date) return <span>—</span>;
  const d = new Date(date);
  const local =
    typeof window === "undefined"
      ? `${d.toISOString().slice(0, 16).replace("T", " ")} UTC`
      : // dateStyle/timeStyle cannot be combined with timeZoneName.
        new Intl.DateTimeFormat(undefined, {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "numeric",
          minute: "2-digit",
          timeZoneName: "short",
        }).format(d);
  return (
    <time dateTime={d.toISOString()} suppressHydrationWarning>
      {local}
    </time>
  );
}
