"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ChevronDown, Circle, CircleDot } from "lucide-react";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn, route } from "@/lib/utils";
import type { SectionSummary } from "@/services/curriculum";

/**
 * Curriculum navigation for the chapter reader.
 *
 * Sections start collapsed except the one containing the current chapter,
 * because a 29-chapter course rendered flat is a wall the reader has to
 * scroll past on every page. Completion state is on every row so the list
 * doubles as a progress view, and the course total sits at the top.
 */
export function ChapterNav({
  trackSegment,
  courseSlug,
  courseTitle,
  sections,
  currentChapterSlug,
  onNavigate,
}: {
  /** URL segment for the track this course belongs to. */
  trackSegment: string;
  courseSlug: string;
  courseTitle: string;
  sections: SectionSummary[];
  currentChapterSlug: string;
  /** Called after a link is followed, so a mobile drawer can close itself. */
  onNavigate?: () => void;
}) {
  const activeSection = sections.find((section) =>
    section.chapters.some((chapter) => chapter.slug === currentChapterSlug)
  );

  const [open, setOpen] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(
      sections.map((section) => [section.slug, section.slug === activeSection?.slug])
    )
  );

  const total = sections.reduce((sum, section) => sum + section.totalChapters, 0);
  const done = sections.reduce((sum, section) => sum + section.completedChapters, 0);
  const percent = total ? Math.round((done / total) * 100) : 0;

  return (
    <nav aria-label="Course contents" className="flex h-full flex-col">
      <div className="border-border border-b px-4 pt-3.5 pb-4">
        <Link
          href={route(`/learn/${trackSegment}/${courseSlug}`)}
          className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 text-xs transition-colors"
        >
          <ArrowLeft className="size-3.5" aria-hidden="true" />
          Course overview
        </Link>
        <p className="tracking-headline mt-2 truncate text-base font-semibold">{courseTitle}</p>

        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-xl font-bold tabular-nums">
            {percent}
            <span className="text-muted-foreground text-sm font-medium">%</span>
          </span>
          <span className="text-muted-foreground font-mono text-xs tabular-nums">
            {done}/{total}
          </span>
        </div>
        <div
          className="bg-muted mt-1.5 h-1.5 overflow-hidden rounded-full"
          role="progressbar"
          aria-valuenow={percent}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${courseTitle} progress`}
        >
          <div className="bg-ember-500 h-full rounded-full" style={{ width: `${percent}%` }} />
        </div>
      </div>

      {/* Radix wraps the content in a `display: table` div, which lets long
          titles push the row wider than the panel instead of truncating. */}
      <ScrollArea className="min-h-0 flex-1 [&_[data-slot=scroll-area-viewport]>div]:!block">
        <div className="space-y-0.5 p-2">
          {sections.map((section, sectionIndex) => {
            const isOpen = open[section.slug] ?? false;
            const complete =
              section.totalChapters > 0 &&
              section.completedChapters === section.totalChapters;
            const isActive = section.slug === activeSection?.slug;

            return (
              <Collapsible
                key={section.slug}
                open={isOpen}
                onOpenChange={(next) =>
                  setOpen((previous) => ({ ...previous, [section.slug]: next }))
                }
              >
                <CollapsibleTrigger className="hover:bg-accent/50 group flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors">
                  <span
                    className={cn(
                      "flex size-6 shrink-0 items-center justify-center rounded-md font-mono text-[0.65rem] tabular-nums",
                      isActive
                        ? "bg-ember-500/15 text-ember-300"
                        : complete
                          ? "bg-success/12 text-success"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-[0.8rem] font-medium",
                      complete ? "text-muted-foreground" : "text-foreground"
                    )}
                  >
                    {section.title}
                  </span>
                  <span className="text-muted-foreground/80 shrink-0 font-mono text-[0.65rem] tabular-nums">
                    {section.completedChapters}/{section.totalChapters}
                  </span>
                  <ChevronDown
                    className={cn(
                      "text-muted-foreground size-3.5 shrink-0 transition-transform",
                      !isOpen && "-rotate-90"
                    )}
                    aria-hidden="true"
                  />
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <ul className="mt-0.5 mb-1.5 space-y-px">
                    {section.chapters.map((chapter) => {
                      const active = chapter.slug === currentChapterSlug;

                      return (
                        <li key={chapter.slug} className="relative">
                          {active && (
                            <span
                              className="bg-ember-500 absolute top-1 bottom-1 left-0 w-[3px] rounded-full"
                              aria-hidden="true"
                            />
                          )}
                          <Link
                            href={route(
                              `/learn/${trackSegment}/${courseSlug}/${section.slug}/${chapter.slug}`
                            )}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "ml-1.5 flex items-center gap-2.5 rounded-md py-1.5 pr-2 pl-[1.6rem] text-[0.8rem] transition-colors",
                              active
                                ? "bg-ember-500/10 text-foreground font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <ChapterStatusIcon status={chapter.status} active={active} />
                            <span className="min-w-0 flex-1 truncate">
                              {chapter.title}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </div>
      </ScrollArea>
    </nav>
  );
}

function ChapterStatusIcon({
  status,
  active,
}: {
  status: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  active: boolean;
}) {
  if (status === "COMPLETED") {
    return <CheckCircle2 className="text-success size-3.5 shrink-0" aria-label="Completed" />;
  }
  if (status === "IN_PROGRESS" || active) {
    return (
      <CircleDot className="text-ember-500 size-3.5 shrink-0" aria-label="In progress" />
    );
  }
  return (
    <Circle className="text-muted-foreground/30 size-3.5 shrink-0" aria-label="Not started" />
  );
}
