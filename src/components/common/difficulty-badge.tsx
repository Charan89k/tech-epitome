import type { Difficulty } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/**
 * Difficulty is coloured text in its own colour family, deliberately
 * separate from the ember brand accent and never a filled pill, so a
 * "Medium" can never read as a button or a call to action. Colour is never
 * the only signal - the label is always present.
 */
const STYLES: Record<Difficulty, string> = {
  EASY: "text-difficulty-easy",
  MEDIUM: "text-difficulty-medium",
  HARD: "text-difficulty-hard",
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
        "inline-flex items-center text-xs leading-none font-semibold",
        STYLES[difficulty],
        className
      )}
    >
      {LABELS[difficulty]}
    </span>
  );
}
