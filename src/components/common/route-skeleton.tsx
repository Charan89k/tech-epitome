import { Skeleton } from "@/components/ui/skeleton";

/**
 * Segment-level loading skeletons.
 *
 * The root `loading.tsx` is a centred pulsing logo, which is right for a
 * cold first paint and wrong for a navigation inside the shell: it throws
 * away the sidebar and top bar the browser already has, so moving between
 * two pages flashes the whole layout away and back.
 *
 * These render the shape of the page that is coming. They are deliberately
 * rough — a skeleton that tries to match the final layout exactly is a
 * second copy of it to keep in sync, and it looks worse when it is wrong
 * than when it is obviously a placeholder.
 *
 * Marked `aria-hidden` with one polite status message, because a screen
 * reader announcing thirty grey boxes is worse than silence.
 */
function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <p role="status" className="sr-only">
        Loading
      </p>
      <div aria-hidden="true">{children}</div>
    </div>
  );
}

/** A title, a line of description, and a list of rows. */
export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Frame>
      <Skeleton className="h-7 w-52" />
      <Skeleton className="mt-2 h-4 w-full max-w-lg" />
      <div className="mt-8 space-y-3">
        {Array.from({ length: rows }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full rounded-lg" />
        ))}
      </div>
    </Frame>
  );
}

/** A title and a body of prose, for a reader. */
export function ArticleSkeleton() {
  return (
    <Frame>
      <Skeleton className="h-4 w-32" />
      <Skeleton className="mt-3 h-8 w-3/4" />
      <div className="mt-8 space-y-3">
        {[100, 96, 88, 94, 70, 92, 84].map((width, index) => (
          <Skeleton key={index} className="h-4" style={{ width: `${width}%` }} />
        ))}
      </div>
      <Skeleton className="mt-8 h-40 w-full rounded-lg" />
    </Frame>
  );
}

/** Stat tiles above cards, for the dashboard and the admin overview. */
export function PanelSkeleton() {
  return (
    <Frame>
      <Skeleton className="h-7 w-56" />
      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 rounded-lg" />
        ))}
      </div>
      <div className="mt-5 grid gap-5 lg:grid-cols-3">
        <div className="space-y-5 lg:col-span-2">
          <Skeleton className="h-40 w-full rounded-lg" />
          <Skeleton className="h-52 w-full rounded-lg" />
        </div>
        <div className="space-y-5">
          <Skeleton className="h-36 w-full rounded-lg" />
          <Skeleton className="h-36 w-full rounded-lg" />
        </div>
      </div>
    </Frame>
  );
}

/** An editor beside a description, for a problem or a workspace. */
export function WorkspaceSkeleton() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <p role="status" className="sr-only">
        Loading
      </p>
      <div aria-hidden="true" className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-3">
          <Skeleton className="h-7 w-2/3" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-11/12" />
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="mt-4 h-32 w-full rounded-lg" />
        </div>
        <Skeleton className="h-[60vh] w-full rounded-lg" />
      </div>
    </div>
  );
}
