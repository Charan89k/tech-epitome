"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, ChevronRight, Circle, CircleDot, Lock } from "lucide-react";

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
 * doubles as a progress view.
 */
export function ChapterNav({
  courseSlug,
  courseTitle,
  sections,
  currentChapterSlug,
  onNavigate,
}: {
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

  return (
    <nav aria-label="Course contents" className="flex h-full flex-col">
      <div className="border-border border-b px-4 py-3">
        <Link
          href={route(`/learn/dsa/${courseSlug}`)}
          className="text-muted-foreground hover:text-foreground text-[0.68rem] tracking-wider uppercase transition-colors"
        >
          Course
        </Link>
        <p className="mt-0.5 truncate text-sm font-medium">{courseTitle}</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="space-y-0.5 p-2">
          {sections.map((section, sectionIndex) => {
            const isOpen = open[section.slug] ?? false;
            const complete =
              section.totalChapters > 0 &&
              section.completedChapters === section.totalChapters;

            return (
              <Collapsible
                key={section.slug}
                open={isOpen}
                onOpenChange={(next) =>
                  setOpen((previous) => ({ ...previous, [section.slug]: next }))
                }
              >
                <CollapsibleTrigger className="hover:bg-accent/50 group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left transition-colors">
                  <ChevronRight
                    className={cn(
                      "text-muted-foreground size-3.5 shrink-0 transition-transform",
                      isOpen && "rotate-90"
                    )}
                    aria-hidden="true"
                  />
                  <span className="text-muted-foreground shrink-0 font-mono text-[0.65rem] tabular-nums">
                    {String(sectionIndex + 1).padStart(2, "0")}
                  </span>
                  <span
                    className={cn(
                      "min-w-0 flex-1 truncate text-xs",
                      complete ? "text-muted-foreground" : "text-foreground font-medium"
                    )}
                  >
                    {section.title}
                  </span>
                  <span className="text-muted-foreground/70 shrink-0 font-mono text-[0.62rem] tabular-nums">
                    {section.completedChapters}/{section.totalChapters}
                  </span>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <ul className="border-border mt-0.5 mb-1 ml-[1.1rem] space-y-0.5 border-l pl-2">
                    {section.chapters.map((chapter) => {
                      const active = chapter.slug === currentChapterSlug;

                      return (
                        <li key={chapter.slug}>
                          <Link
                            href={route(
                              `/learn/dsa/${courseSlug}/${section.slug}/${chapter.slug}`
                            )}
                            onClick={onNavigate}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center gap-2 rounded-md px-2 py-1.5 text-xs transition-colors",
                              active
                                ? "bg-ember-500/10 text-ember-200 font-medium"
                                : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                            )}
                          >
                            <ChapterStatusIcon status={chapter.status} active={active} />
                            <span className="min-w-0 flex-1 truncate">
                              {chapter.title}
                            </span>
                            {chapter.access === "PRO" && (
                              <Lock
                                className="text-muted-foreground/60 size-3 shrink-0"
                                aria-label="Pro"
                              />
                            )}
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
    return <CheckCircle2 className="text-success size-3 shrink-0" aria-label="Completed" />;
  }
  if (status === "IN_PROGRESS" || active) {
    return (
      <CircleDot className="text-ember-500 size-3 shrink-0" aria-label="In progress" />
    );
  }
  return (
    <Circle className="text-muted-foreground/30 size-3 shrink-0" aria-label="Not started" />
  );
}
