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
 *
 * With `showProgress`, a reading-progress bar sits above the list. It is
 * how far down the page the reader has scrolled — a position, not a record
 * of anything learned, so it is never stored.
 */
export function ChapterToc({
  entries,
  showProgress = false,
}: {
  entries: TocEntry[];
  showProgress?: boolean;
}) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const [progress, setProgress] = useState(0);

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

  useEffect(() => {
    if (!showProgress) return;

    let frame = 0;
    const measure = () => {
      frame = 0;
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      setProgress(
        scrollable > 0 ? Math.min(100, Math.round((window.scrollY / scrollable) * 100)) : 100
      );
    };
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [showProgress]);

  if (entries.length === 0) return null;

  return (
    <div className="text-sm">
      {showProgress && (
        <div className="mb-6">
          <div className="text-muted-foreground flex items-baseline justify-between text-xs">
            <span>Reading progress</span>
            <span className="font-mono tabular-nums">{progress}%</span>
          </div>
          <div
            className="bg-muted mt-2 h-1.5 overflow-hidden rounded-full"
            role="progressbar"
            aria-valuenow={progress}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Reading progress"
          >
            <div
              className="bg-ember-500 h-full rounded-full transition-[width] duration-150"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <nav aria-label="On this page">
        <p className="text-foreground mb-3 text-sm font-semibold">On this page</p>
        <ul className="space-y-0.5">
          {entries.map((entry) => {
            const active = activeId === entry.id;
            return (
              <li key={entry.id} className="relative">
                {active && (
                  <span
                    className="bg-ember-500 absolute top-1 bottom-1 left-0 w-[3px] rounded-full"
                    aria-hidden="true"
                  />
                )}
                <a
                  href={`#${entry.id}`}
                  aria-current={active ? "location" : undefined}
                  className={cn(
                    "block rounded-sm py-1.5 text-[0.8rem] leading-snug transition-colors",
                    entry.level === 3 ? "pl-7" : "pl-3.5",
                    active
                      ? "text-ember-300 font-medium"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {entry.text}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </div>
  );
}
