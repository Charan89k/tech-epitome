"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Play } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  availableDifficultiesAction,
  createInterviewAction,
} from "@/app/(shell)/interviews/actions";
import type { Difficulty, Language } from "@/generated/prisma/enums";
import { LANGUAGE_LABEL, SUPPORTED_LANGUAGES } from "@/lib/code-execution/signature";
import {
  INTERVIEW_TYPES,
  MACHINES,
  type InterviewKind,
} from "@/lib/interview/types";

/**
 * Starting an interview.
 *
 * Note what the learner does not choose: the problem. Letting them pick
 * would let them shop for one they have already solved, which makes the
 * practice worthless — so the server chooses at random from published
 * problems at the requested difficulty.
 *
 * All four interviews are real and conducted by their own state machine,
 * so all four are offered. The two inputs that do not apply to a given
 * type disappear rather than sitting there disabled: a behavioural
 * interview has no difficulty and no editor, and showing greyed-out
 * controls for them implies they exist somewhere.
 *
 * Difficulty is offered from what the catalogue actually holds. The
 * published set is uneven — there is currently no hard system design or
 * hard low-level design brief — and offering a level that cannot be served
 * turned "Start interview" into a button that produced an error and no
 * interview. Now the unavailable level is not offered, and the form says
 * why rather than leaving a gap the learner has to infer.
 */
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

const DIFFICULTY_LABEL: Record<Difficulty, string> = {
  EASY: "Easy",
  MEDIUM: "Medium",
  HARD: "Hard",
};
export function NewInterviewForm() {
  const router = useRouter();
  const [type, setType] = useState<InterviewKind>("DSA");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [language, setLanguage] = useState<Language>("PYTHON");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  /**
   * The difficulties this type can actually start at, tagged with the type
   * they were fetched for.
   *
   * Tagged rather than cleared on every type change: clearing would mean a
   * setState in the effect body, which cascades a render. Comparing the tag
   * during render answers the same question — "is this list about the type
   * currently selected?" — for free.
   */
  const [availability, setAvailability] = useState<{
    type: InterviewKind;
    levels: Difficulty[];
  } | null>(null);

  useEffect(() => {
    let current = true;
    void availableDifficultiesAction(type).then((result) => {
      if (current && result.ok) {
        setAvailability({ type, levels: result.data.difficulties });
      }
    });
    return () => {
      current = false;
    };
  }, [type]);

  // Stale or not-yet-loaded falls back to the full set, so a slow round trip
  // never renders an empty dropdown. The server re-derives availability when
  // the interview is created, so an optimistic list here cannot start an
  // interview the catalogue is unable to serve.
  const levels = availability?.type === type ? availability.levels : null;
  const offered = levels ?? DIFFICULTIES;

  /**
   * The difficulty actually in force.
   *
   * Derived during render rather than corrected in an effect. Switching to a
   * type whose catalogue lacks the selected level would otherwise leave a
   * stale value selected for one render — and the fix for that, a
   * setState-in-effect, is a cascading render for a value that was always a
   * function of what is offered.
   */
  const effectiveDifficulty: Difficulty = offered.includes(difficulty)
    ? difficulty
    : offered.includes("MEDIUM")
      ? "MEDIUM"
      : offered[0]!;

  function begin() {
    setError(null);
    start(async () => {
      const result = await createInterviewAction({
        type,
        difficulty: effectiveDifficulty,
        language,
      });
      if (result.ok) router.push(`/interviews/${result.data.id}`);
      else setError(result.error);
    });
  }

  // Behavioural questions are not graded by difficulty: "tell me about a
  // conflict" is not harder at senior level, the follow-ups are.
  const usesDifficulty = type !== "BEHAVIORAL";
  const missing = DIFFICULTIES.filter((level) => !offered.includes(level));
  const usesEditor = MACHINES[type].codeStages.length > 0;

  return (
    <div>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs">
          <span className="text-muted-foreground">Type</span>
          <Select value={type} onValueChange={(v) => setType(v as InterviewKind)}>
            <SelectTrigger className="mt-1 w-full" aria-label="Interview type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_TYPES.map((item) => (
                <SelectItem key={item} value={item}>
                  {MACHINES[item].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </label>

        {usesDifficulty && (
          <label className="text-xs">
            <span className="text-muted-foreground">Difficulty</span>
            <Select
              value={effectiveDifficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
            >
              <SelectTrigger className="mt-1 w-full" aria-label="Difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {offered.map((level) => (
                  <SelectItem key={level} value={level}>
                    {DIFFICULTY_LABEL[level]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}

        {usesEditor && (
          <label className="text-xs">
            <span className="text-muted-foreground">Language</span>
            <Select value={language} onValueChange={(v) => setLanguage(v as Language)}>
              <SelectTrigger className="mt-1 w-full" aria-label="Language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SUPPORTED_LANGUAGES.map((item) => (
                  <SelectItem key={item} value={item}>
                    {LANGUAGE_LABEL[item]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </label>
        )}
      </div>

      <p className="text-muted-foreground mt-3 text-xs leading-relaxed">
        {MACHINES[type].blurb}
      </p>
      <p className="text-muted-foreground/70 mt-1.5 text-xs">
        The brief is chosen for you, as it would be in a real interview.
      </p>

      {usesDifficulty && missing.length > 0 && (
        <p className="text-muted-foreground/70 mt-1.5 text-xs">
          No{" "}
          {missing.map((level) => DIFFICULTY_LABEL[level].toLowerCase()).join(" or ")}{" "}
          {MACHINES[type].label.toLowerCase()} brief has been published yet, so
          that level is not offered.
        </p>
      )}

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button className="mt-4" onClick={begin} disabled={pending}>
        {pending ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : (
          <Play className="size-3.5" />
        )}
        Start interview
      </Button>
    </div>
  );
}
