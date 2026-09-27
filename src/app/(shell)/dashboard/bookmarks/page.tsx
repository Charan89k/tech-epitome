import type { Metadata } from "next";
import Link from "next/link";
import { Bookmark } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { route } from "@/lib/utils";
import { listBookmarks } from "@/services/library";

export const metadata: Metadata = {
  title: "Bookmarks",
  robots: { index: false, follow: false },
};

const TYPE_LABEL: Record<string, string> = {
  PROBLEM: "Problem",
  CHAPTER: "Chapter",
  PATTERN: "Pattern",
};

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
            description="Save a problem or a chapter and it will appear here."
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
            <li key={item.id}>
              <Link
                href={route(item.href)}
                className="hover:bg-accent/40 flex items-center gap-3 px-4 py-3 transition-colors"
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
