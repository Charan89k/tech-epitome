"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type TocEntry = { id: string; text: string; level: 2 | 3 };

/**
 * On-this-page navigation, with scroll spy.
 *
 * Uses an IntersectionObserver with a top-biased root margin so a heading
 * becomes "current" as it reaches the top of the viewport rather than when
 * it first appears at the bottom — otherwise the highlight runs ahead of
 * what the reader is looking at.
 */
export function ChapterToc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);

  useEffect(() => {
    if (entries.length === 0) return;

    const observer = new IntersectionObserver(
      (records) => {
        const visible = records
          .filter((record) => record.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible[0]) setActiveId(visible[0].target.id);
      },
      // Top 20% of the viewport is the "reading line".
      { rootMargin: "-80px 0px -75% 0px", threshold: 0 }
    );

    for (const entry of entries) {
      const element = document.getElementById(entry.id);
      if (element) observer.observe(element);
    }

    return () => observer.disconnect();
  }, [entries]);

  if (entries.length === 0) return null;

  return (
    <nav aria-label="On this page" className="text-sm">
      <p className="text-muted-foreground mb-2.5 text-[0.68rem] font-medium tracking-wider uppercase">
        On this page
      </p>
      <ul className="border-border space-y-0.5 border-l">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              aria-current={activeId === entry.id ? "location" : undefined}
              className={cn(
                "-ml-px block border-l py-1 text-xs transition-colors",
                entry.level === 3 ? "pl-6" : "pl-3",
                activeId === entry.id
                  ? "border-ember-500 text-ember-300 font-medium"
                  : "text-muted-foreground hover:text-foreground border-transparent"
              )}
            >
              {entry.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
