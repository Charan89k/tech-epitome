import { BookOpen, Clock, Target } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import { ProgressRing } from "@/components/common/progress-ring";
import type { Difficulty } from "@/generated/prisma/enums";

export function ChapterHeader({
  sectionTitle,
  title,
  summary,
  difficulty,
  readingMinutes,
  percent,
  objectives,
  actions,
}: {
  sectionTitle: string;
  title: string;
  summary: string | null;
  difficulty: Difficulty;
  readingMinutes: number;
  percent: number;
  objectives: string[];
  /** Chapter-level controls (save, ask the tutor), right of the meta chips. */
  actions?: React.ReactNode;
}) {
  return (
    <header className="not-prose">
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <p className="text-ember-400 text-[0.68rem] font-medium tracking-wider uppercase">
            {sectionTitle}
          </p>
          <h1 className="tracking-headline mt-2 text-3xl font-bold text-balance sm:text-4xl">
            {title}
          </h1>
        </div>

        <ProgressRing
          value={percent}
          size={52}
          strokeWidth={4}
          className="mt-1 hidden shrink-0 sm:inline-flex"
          label={`${percent}% through this chapter`}
        />
      </div>

      {summary && (
        <p className="text-muted-foreground mt-3 text-base leading-relaxed text-pretty sm:text-lg">
          {summary}
        </p>
      )}

      <div className="border-border mt-5 flex flex-wrap items-center gap-2 border-t pt-4">
        <DifficultyBadge difficulty={difficulty} className="mr-1" />
        <span className="bg-muted/50 border-border text-muted-foreground inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs">
          <Clock className="size-3.5" aria-hidden="true" />
          {readingMinutes} min read
        </span>
        <span className="bg-muted/50 border-border text-muted-foreground hidden h-7 max-w-[14rem] items-center gap-1.5 rounded-md border px-2.5 text-xs sm:inline-flex">
          <BookOpen className="size-3.5 shrink-0" aria-hidden="true" />
          <span className="truncate">{sectionTitle}</span>
        </span>
        {actions && <div className="ml-auto flex items-center gap-1.5">{actions}</div>}
      </div>

      {objectives.length > 0 && (
        <div className="border-border bg-card mt-6 rounded-xl border p-5">
          <p className="text-ember-400 flex items-center gap-1.5 text-[0.68rem] font-medium tracking-wider uppercase">
            <Target className="size-3.5" aria-hidden="true" />
            By the end of this chapter
          </p>
          <ul className="mt-3 space-y-2">
            {objectives.map((objective) => (
              <li
                key={objective}
                className="text-foreground/85 flex gap-3 text-[0.95rem] leading-relaxed"
              >
                <span className="bg-ember-500 mt-[0.6rem] size-1.5 shrink-0 rounded-full" />
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
