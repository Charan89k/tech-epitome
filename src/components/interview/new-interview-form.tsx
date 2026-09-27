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

/**
 * Starting an interview.
 *
 * Note what the learner does not choose: the problem. Letting them pick
 * would let them shop for one they have already solved, which makes the
 * practice worthless — so the server chooses at random from published
 * problems at the requested difficulty.
 *
 * Only DSA is offered, because only the DSA interviewer is implemented.
 * Listing the other types as disabled options would be advertising
 * something that does not work.
 */
export function NewInterviewForm() {
  const router = useRouter();
  const [difficulty, setDifficulty] = useState<Difficulty>("MEDIUM");
  const [language, setLanguage] = useState<Language>("PYTHON");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function begin() {
    setError(null);
    start(async () => {
      const result = await createInterviewAction({
        type: "DSA",
        difficulty,
        language,
      });
      if (result.ok) router.push(`/interviews/${result.data.id}`);
      else setError(result.error);
    });
  }

  return (
    <div className="border-border bg-card rounded-lg border p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-xs">
          <span className="text-muted-foreground">Type</span>
          <div className="border-input text-muted-foreground mt-1 flex h-9 items-center rounded-md border px-2.5 text-sm">
            DSA
          </div>
        </label>

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
      </div>

      <p className="text-muted-foreground/70 mt-3 text-xs">
        The problem is chosen for you, as it would be in a real interview.
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
