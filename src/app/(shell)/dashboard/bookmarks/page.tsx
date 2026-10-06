import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { PageHeader } from "@/components/common/page-header";
import { LibraryTabs } from "@/components/dashboard/library-tabs";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import { ANNOTATABLE, listBookmarks, type Annotatable } from "@/services/library";
import type { EntityType } from "@/generated/prisma/enums";

export const metadata: Metadata = {
  title: "Bookmarks",
  robots: { index: false, follow: false },
};

const TYPE_LABEL: Record<string, string> = {
  PROBLEM: "Problem",
  CHAPTER: "Chapter",
  PATTERN: "Pattern",
};

/**
 * Whether this row can be unsaved from here.
 *
 * `EntityType` is wider than what the library can resolve, so a row of an
 * unsupported type renders without the control rather than with one that
 * would be refused server-side.
 */
function isAnnotatable(type: EntityType): type is Annotatable {
  return (ANNOTATABLE as readonly string[]).includes(type);
}

export default async function BookmarksPage() {
  const user = await requireUser("/dashboard/bookmarks");
  const bookmarks = await listBookmarks(user.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Bookmarks"
        description="Everything you saved, across problems, chapters and patterns."
        className="mb-5"
      />
      <LibraryTabs active="/dashboard/bookmarks" />

      {bookmarks.length === 0 ? (
        <div className="mt-6 rounded-xl border border-border bg-card">
          <EmptyState
            icon={Bookmark}
            title="Nothing bookmarked yet"
            description="Use “Save” on a problem, chapter or pattern and it will appear here."
            action={
              <Button asChild size="sm" variant="outline">
                <Link href="/problems">Browse problems</Link>
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-2.5 text-xs text-muted-foreground sm:px-5">
            <span className="font-medium">Saved item</span>
            <span className="tabular-nums">{bookmarks.length} saved</span>
          </div>
          <ul className="divide-y divide-border">
            {bookmarks.map((item) => (
              <li
                key={item.id}
                className="flex items-center gap-2 pr-2 transition-colors hover:bg-accent/25 sm:pr-3"
              >
                <Link
                  href={route(item.href)}
                  className="group flex min-w-0 flex-1 items-center gap-3 py-3 pl-4 sm:pl-5"
                >
                  <Bookmark
                    className="size-4 shrink-0 fill-current text-ember-500"
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-info transition-colors group-hover:text-ember-300">
                      {item.title}
                    </span>
                    {item.subtitle && (
                      <span className="block truncate text-xs text-muted-foreground">
                        {item.subtitle}
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 rounded-full border border-border px-2 py-0.5 text-[0.65rem] font-medium text-muted-foreground">
                    {TYPE_LABEL[item.entityType] ?? item.entityType}
                  </span>
                </Link>

                {/* Unsaving from the list itself. Outside the Link, because a
                  button inside an anchor is invalid and unreachable by
                  keyboard in the order people expect. */}
                {isAnnotatable(item.entityType) && (
                  <BookmarkButton
                    entityType={item.entityType}
                    entityId={item.entityId}
                    initiallyBookmarked
                    signedIn
                  />
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
