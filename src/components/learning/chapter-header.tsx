import { Clock, Target } from "lucide-react";

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
}: {
  sectionTitle: string;
  title: string;
  summary: string | null;
  difficulty: Difficulty;
  readingMinutes: number;
  percent: number;
  objectives: string[];
}) {
  return (
    <header className="not-prose">
      <p className="text-muted-foreground text-xs font-medium tracking-wider uppercase">
        {sectionTitle}
      </p>

      <div className="mt-2 flex items-start justify-between gap-6">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-balance sm:text-3xl">
            {title}
          </h1>
          {summary && (
            <p className="text-muted-foreground mt-2 max-w-2xl leading-relaxed text-pretty">
              {summary}
            </p>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <DifficultyBadge difficulty={difficulty} />
            <span className="text-muted-foreground flex items-center gap-1.5 text-xs">
              <Clock className="size-3.5" aria-hidden="true" />
              {readingMinutes} min
            </span>
          </div>
        </div>

        <ProgressRing
          value={percent}
          size={56}
          strokeWidth={4}
          className="hidden shrink-0 sm:inline-flex"
          label={`${percent}% through this chapter`}
        />
      </div>

      {objectives.length > 0 && (
        <div className="border-ember-500/25 bg-ember-500/5 mt-6 rounded-lg border p-4">
          <p className="text-ember-400 flex items-center gap-1.5 font-mono text-[0.68rem] tracking-wider uppercase">
            <Target className="size-3.5" aria-hidden="true" />
            By the end of this chapter
          </p>
          <ul className="mt-2.5 space-y-1.5">
            {objectives.map((objective) => (
              <li
                key={objective}
                className="text-muted-foreground flex gap-2.5 text-sm leading-relaxed"
              >
                <span className="text-ember-500/60 mt-1.5 size-1 shrink-0 rounded-full bg-current" />
                {objective}
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
