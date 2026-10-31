import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { route } from "@/lib/utils";

type PaginationProps = {
  page: number;
  totalPages: number;
  total: number;
  /** Current query string without the page parameter. */
  baseQuery: string;
  pathname: string;
  /** What the list holds, singular. */
  noun?: string;
};

/**
 * Link-based pagination.
 *
 * Real anchors rather than buttons, so pages are crawlable, middle-clickable
 * and work before hydration.
 */
export function Pagination({
  page,
  totalPages,
  total,
  baseQuery,
  pathname,
  noun = "problem",
}: PaginationProps) {
  if (totalPages <= 1) return null;

  const href = (target: number) => {
    const params = new URLSearchParams(baseQuery);
    if (target > 1) params.set("page", String(target));
    const query = params.toString();
    return route(query ? `${pathname}?${query}` : pathname);
  };

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-3 border-t border-border px-4 py-3"
    >
      <p className="text-xs text-muted-foreground">
        Page <span className="tabular">{page}</span> of{" "}
        <span className="tabular">{totalPages}</span>
        <span className="hidden sm:inline">
          {" "}
          · <span className="tabular">{total}</span> {noun}
          {total === 1 ? "" : "s"}
        </span>
      </p>

      <div className="flex items-center gap-2">
        <Button
          asChild={page > 1}
          variant="outline"
          size="sm"
          disabled={page <= 1}
          className="h-8"
        >
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev">
              <ChevronLeft className="size-4" />
              Previous
            </Link>
          ) : (
            <span className="contents">
              <ChevronLeft className="size-4" />
              Previous
            </span>
          )}
        </Button>

        <Button
          asChild={page < totalPages}
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          className="h-8"
        >
          {page < totalPages ? (
            <Link href={href(page + 1)} rel="next">
              Next
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="contents">
              Next
              <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </nav>
  );
}
