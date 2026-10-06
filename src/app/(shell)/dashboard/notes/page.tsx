import type { Metadata } from "next";
import Link from "next/link";
import { FileText, Search } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { NoteCard } from "@/components/library/note-card";
import { PageHeader } from "@/components/common/page-header";
import { LibraryTabs } from "@/components/dashboard/library-tabs";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";

import { listNotes } from "@/services/library";

export const metadata: Metadata = {
  title: "Notes",
  robots: { index: false, follow: false },
};

export default async function NotesPage({
  searchParams,
}: PageProps<"/dashboard/notes">) {
  const user = await requireUser("/dashboard/notes");
  const params = await searchParams;
  const query = Array.isArray(params.q) ? params.q[0] : params.q;

  const notes = await listNotes(user.id, query);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Notes"
        description="Your own notes, attached to the chapter or problem they came from."
        className="mb-5"
      />
      <LibraryTabs active="/dashboard/notes" />

      {/* A plain GET form: the search is shareable and works without JS. */}
      <form
        className="mt-6 flex items-center gap-2 rounded-xl border border-border bg-card p-2"
        role="search"
      >
        <label htmlFor="note-search" className="sr-only">
          Search your notes
        </label>
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            id="note-search"
            type="search"
            name="q"
            defaultValue={query ?? ""}
            placeholder="Search your notes…"
            className="h-9 w-full rounded-md border border-border bg-muted/40 pr-3 pl-9 text-sm placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          />
        </div>
        {query && (
          <Button asChild variant="ghost" size="sm">
            <Link href="/dashboard/notes">Clear</Link>
          </Button>
        )}
      </form>

      {notes.length === 0 ? (
        <div className="mt-4 rounded-xl border border-border bg-card">
          <EmptyState
            icon={FileText}
            title={query ? "No notes match that search" : "No notes yet"}
            description={
              query
                ? "Try a shorter phrase, or clear the search."
                : "Open a chapter, a problem or a pattern and use \u201cAdd a note\u201d. Whatever you write there collects here."
            }
            action={
              !query ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/learn/dsa">Start a chapter</Link>
                </Button>
              ) : (
                <Button asChild size="sm" variant="outline">
                  <Link href="/dashboard/notes">Clear search</Link>
                </Button>
              )
            }
          />
        </div>
      ) : (
        <ul className="mt-4 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {notes.map((note) => (
            <NoteCard
              key={note.id}
              id={note.id}
              href={note.href}
              title={note.title}
              subtitle={note.subtitle}
              body={note.body}
              // Serialized: a Date cannot cross the server/client boundary
              // as a prop without being turned back into one anyway.
              updatedAt={note.updatedAt.toISOString()}
            />
          ))}
        </ul>
      )}
    </div>
  );
}
