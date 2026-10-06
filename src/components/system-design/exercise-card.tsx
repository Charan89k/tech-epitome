import Link from "next/link";
import { ArrowUpRight, CheckCircle2, PenLine } from "lucide-react";

import { DifficultyBadge } from "@/components/common/difficulty-badge";
import {
  DesignThumb,
  type DesignThumbKind,
} from "@/components/system-design/design-thumb";
import type { Difficulty } from "@/generated/prisma/enums";
import { route } from "@/lib/utils";

/**
 * One design exercise as a card: thumbnail on top, then title, difficulty,
 * the one-line brief and the learner's own status. Shared by the system
 * design and low-level design catalogues.
 */
export function ExerciseCard({
  href,
  title,
  tagline,
  difficulty,
  status,
  thumb,
  tags = [],
}: {
  href: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  status?: "NOT_STARTED" | "IN_PROGRESS" | "COMPLETED";
  thumb: DesignThumbKind;
  tags?: string[];
}) {
  return (
    <Link
      href={route(href)}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-ember-500/40 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
    >
      <div className="relative">
        <DesignThumb kind={thumb} className="h-32 w-full border-b border-border" />
        {status === "COMPLETED" && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-border bg-background/85 px-2 py-0.5 text-[0.65rem] font-medium text-success backdrop-blur">
            <CheckCircle2 className="size-3" aria-hidden="true" />
            Submitted
          </span>
        )}
        {status === "IN_PROGRESS" && (
          <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 rounded-full border border-border bg-background/85 px-2 py-0.5 text-[0.65rem] font-medium text-ember-300 backdrop-blur">
            <PenLine className="size-3" aria-hidden="true" />
            Draft
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="flex items-start gap-2">
          <h2 className="min-w-0 flex-1 text-base font-semibold transition-colors group-hover:text-ember-200">
            {title}
          </h2>
          <ArrowUpRight
            className="mt-0.5 size-4 shrink-0 text-muted-foreground transition-colors group-hover:text-ember-400"
            aria-hidden="true"
          />
        </div>
        <p className="mt-1 text-sm leading-snug text-muted-foreground">{tagline}</p>

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-4">
          <DifficultyBadge difficulty={difficulty} />
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full bg-muted/50 px-2 py-0.5 text-[0.65rem] text-muted-foreground"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
