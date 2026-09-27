import { LogoMark } from "@/components/brand/logo";

/**
 * The cold-start fallback.
 *
 * Every route segment under `(shell)` defines its own skeleton, shaped
 * like the page that is coming, so a navigation inside the app keeps the
 * sidebar and top bar. This one covers the first paint before any of that
 * exists — there is nothing to preserve yet, so a centred mark is
 * honest rather than lazy.
 */
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center" role="status">
      <LogoMark
        gradient
        idSuffix="loading"
        className="size-7 animate-pulse opacity-70"
      />
      <span className="sr-only">Loading</span>
    </div>
  );
}
