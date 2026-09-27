import type { Difficulty } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/**
 * Difficulty is shown in its own colour family, deliberately separate from
 * the ember brand accent, so a "Medium" chip can never read as a call to
 * action. Colour is never the only signal - the label is always present.
 */
const STYLES: Record<Difficulty, string> = {
  EASY: "text-difficulty-easy border-difficulty-easy/25 bg-difficulty-easy/10",
  MEDIUM:
    "text-difficulty-medium border-difficulty-medium/25 bg-difficulty-medium/10",
  HARD: "text-difficulty-hard border-difficulty-hard/25 bg-difficulty-hard/10",
};

const LABELS: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};

export function DifficultyBadge({
  difficulty,
  className,
}: {
  difficulty: Difficulty;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md border px-1.5 py-0.5 text-[0.7rem] leading-none font-medium",
        STYLES[difficulty],
        className
      )}
    >
      {LABELS[difficulty]}
    </span>
  );
}
