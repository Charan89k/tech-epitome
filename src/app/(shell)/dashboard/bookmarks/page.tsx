import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { BookmarkButton } from "@/components/library/bookmark-button";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import {
  ANNOTATABLE,
  listBookmarks,
  type Annotatable,
} from "@/services/library";
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
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Bookmarks"
        description="Everything you saved, across problems, chapters and patterns."
      />

      {bookmarks.length === 0 ? (
        <div className="border-border mt-8 rounded-lg border border-dashed">
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
        <ul className="border-border mt-8 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
          {bookmarks.map((item) => (
            <li key={item.id} className="flex items-center gap-2 pr-3">
              <Link
                href={route(item.href)}
                className="hover:bg-accent/40 flex min-w-0 flex-1 items-center gap-3 px-4 py-3 transition-colors"
              >
                <Bookmark
                  className="text-ember-500 size-4 shrink-0 fill-current"
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {item.title}
                  </span>
                  {item.subtitle && (
                    <span className="text-muted-foreground block truncate text-xs">
                      {item.subtitle}
                    </span>
                  )}
                </span>
                <Badge variant="outline" className="shrink-0 text-[0.65rem]">
                  {TYPE_LABEL[item.entityType] ?? item.entityType}
                </Badge>
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
      )}
    </div>
  );
}
