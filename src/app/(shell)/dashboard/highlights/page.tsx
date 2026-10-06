import type { Metadata } from "next";
import Link from "next/link";
import { Highlighter, Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { HighlightCard } from "@/components/library/highlight-card";
import { PageHeader } from "@/components/common/page-header";
import { LibraryTabs } from "@/components/dashboard/library-tabs";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { listHighlights } from "@/services/highlights";

export const metadata: Metadata = {
  title: "Highlights",
  robots: { index: false, follow: false },
};

export default async function HighlightsPage({
  searchParams,
}: PageProps<"/dashboard/highlights">) {
  const user = await requireUser("/dashboard/highlights");
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  const highlights = await listHighlights(user.id, query);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Highlights"
        description="Everything you marked while reading, with a link back to where you marked it."
        className="mb-5"
      />
      <LibraryTabs active="/dashboard/highlights" />

      {/* A plain GET form: the search is shareable and works without JS. */}
      <form
        className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2"
        role="search"
      >
        <label htmlFor="highlight-search" className="sr-only">
          Search your highlights
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="highlight-search"
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search the text you highlighted…"
            className="h-9 w-full rounded-md border border-border bg-muted/40 pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>
        {query && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/highlights">Clear</Link>
          </Button>
        )}
      </form>

      {highlights.length === 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <EmptyState
            icon={Highlighter}
            title={query ? "No highlights match that search" : "No highlights yet"}
            description={
              query
                ? "Try a shorter phrase, or clear the search."
                : "Select any text in a chapter or a problem statement and pick a colour. Whatever you mark collects here."
            }
            action={
              !query ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/learn/dsa">Open a chapter</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/highlights">Clear search</Link>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {highlights.map((highlight) => (
            <HighlightCard
              key={highlight.id}
              id={highlight.id}
              href={highlight.href}
              title={highlight.title}
              subtitle={highlight.subtitle}
              quote={highlight.quote}
              color={highlight.color}
              resolved={highlight.resolved}
              // Serialized: a Date cannot cross the server/client
              // boundary as a prop without being rebuilt anyway.
              createdAt={highlight.createdAt.toISOString()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
