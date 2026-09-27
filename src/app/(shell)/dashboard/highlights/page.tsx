import type { Metadata } from "next";
import Link from "next/link";
import { Highlighter } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { HighlightCard } from "@/components/library/highlight-card";
import { PageHeader } from "@/components/common/page-header";
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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Highlights"
        description="Everything you marked while reading, with a link back to where you marked it."
      />

      {/* A plain GET form: the search is shareable and works without JS. */}
      <form className="mt-6" role="search">
        <label htmlFor="highlight-search" className="sr-only">
          Search your highlights
        </label>
        <input
          id="highlight-search"
          type="search"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search the text you highlighted…"
          className="border-border bg-muted/40 placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </form>

      {highlights.length === 0 ? (
        <div className="border-border mt-6 rounded-lg border border-dashed">
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
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
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
