import Link from "next/link";
import { Bookmark, FileText, Highlighter } from "lucide-react";

import { cn } from "@/lib/utils";

const TABS = [
  { href: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  { href: "/dashboard/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/highlights", label: "Highlights", icon: Highlighter },
] as const;

/**
 * Underline tabs across the three library pages, ember bar under the
 * active one — the same pattern as the pane tabs in the problem workspace.
 * Plain links, so each tab is its own URL and works without JS.
 */
export function LibraryTabs({ active }: { active: (typeof TABS)[number]["href"] }) {
  return (
    <nav
      aria-label="Library"
      className="-mx-4 overflow-x-auto border-b border-border px-4 sm:mx-0 sm:px-0"
    >
      <ul className="flex gap-1">
        {TABS.map((tab) => {
          const current = tab.href === active;
          const Icon = tab.icon;
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "relative flex h-10 items-center gap-1.5 rounded-t-md px-3 text-sm transition-colors",
                  current
                    ? "font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon
                  className={cn("size-3.5", current ? "text-ember-400" : "")}
                  aria-hidden="true"
                />
                {tab.label}
                {current && (
                  <span
                    className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-ember-500"
                    aria-hidden="true"
                  />
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
