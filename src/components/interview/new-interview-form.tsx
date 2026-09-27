"use client";

import { useState, useTransition } from "react";
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
import { createInterviewAction } from "@/app/(shell)/interviews/actions";
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
 */
export function NewInterviewForm() {
  const router = useRouter();
  const [type, setType] = useState<InterviewKind>("DSA");
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [language, setLanguage] = useState<Language>("PYTHON");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function begin() {
    setError(null);
    start(async () => {
      const result = await createInterviewAction({ type, difficulty, language });
      if (result.ok) router.push(`/interviews/${result.data.id}`);
      else setError(result.error);
    });
  }

  // Behavioural questions are not graded by difficulty: "tell me about a
  // conflict" is not harder at senior level, the follow-ups are.
  const usesDifficulty = type !== "BEHAVIORAL";
  const usesEditor = MACHINES[type].codeStages.length > 0;

  return (
    <div className="border-border bg-card rounded-lg border p-4">
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
              value={difficulty}
              onValueChange={(v) => setDifficulty(v as Difficulty)}
            >
              <SelectTrigger className="mt-1 w-full" aria-label="Difficulty">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="EASY">Easy</SelectItem>
                <SelectItem value="MEDIUM">Medium</SelectItem>
                <SelectItem value="HARD">Hard</SelectItem>
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

      {error && (
        <Alert variant="destructive" className="mt-3">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Button size="sm" className="mt-3" onClick={begin} disabled={pending}>
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
