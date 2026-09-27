import type { Metadata } from "next";
import Link from "next/link";
import { FileText } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Notes"
        description="Your own notes, attached to the chapter or problem they came from."
      />

      {/* A plain GET form: the search is shareable and works without JS. */}
      <form className="mt-6" role="search">
        <label htmlFor="note-search" className="sr-only">
          Search your notes
        </label>
        <input
          id="note-search"
          type="search"
          name="q"
          defaultValue={query ?? ""}
          placeholder="Search your notes…"
          className="border-border bg-muted/40 placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border px-3 text-sm focus-visible:ring-2 focus-visible:outline-none"
        />
      </form>

      {notes.length === 0 ? (
        <div className="border-border mt-6 rounded-lg border border-dashed">
          <EmptyState
            icon={FileText}
            title={query ? "No notes match that search" : "No notes yet"}
            description={
              query
                ? "Try a shorter phrase, or clear the search."
                : "Notes you write while reading a chapter or solving a problem will collect here."
            }
            action={
              !query ? (
                <Button asChild size="sm" variant="outline">
                  <Link href="/learn/dsa">Start a chapter</Link>
                </Button>
              ) : undefined
            }
          />
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {notes.map((note) => (
            <li
              key={note.id}
              className="border-border bg-card rounded-lg border p-4"
            >
              <Link
                href={route(note.href)}
                className="text-muted-foreground hover:text-ember-300 text-xs transition-colors"
              >
                {note.title}
                {note.subtitle ? ` · ${note.subtitle}` : ""}
              </Link>
              <p className="text-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
                {note.body}
              </p>
              <time
                dateTime={note.updatedAt.toISOString()}
                className="text-muted-foreground/70 mt-2 block text-[0.68rem]"
              >
                {note.updatedAt.toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
