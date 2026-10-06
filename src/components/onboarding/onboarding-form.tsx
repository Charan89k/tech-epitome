"use client";

import { useActionState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  saveOnboardingAction,
  skipOnboardingAction,
  type OnboardingState,
} from "@/app/(shell)/onboarding/actions";
import { LANGUAGE_LABEL, SUPPORTED_LANGUAGES } from "@/lib/code-execution/signature";
import { MACHINES, INTERVIEW_TYPES } from "@/lib/interview/types";
import type {
  ExperienceLevel,
  InterviewType,
  Language,
  LearningGoal,
} from "@/generated/prisma/enums";

const EXPERIENCE: { value: ExperienceLevel; label: string }[] = [
  { value: "BEGINNER", label: "New to data structures and algorithms" },
  { value: "SOME_EXPERIENCE", label: "Some experience, rusty" },
  { value: "PROFESSIONAL", label: "Working engineer" },
];

const GOALS: { value: LearningGoal; label: string }[] = [
  { value: "INTERVIEW_PREP", label: "Preparing for interviews" },
  { value: "FUNDAMENTALS", label: "Filling gaps in the fundamentals" },
  { value: "SYSTEM_DESIGN", label: "Getting better at design" },
  { value: "KEEP_SHARP", label: "Keeping sharp" },
];

const TARGETS = [1, 2, 3, 5, 7, 10, 14] as const;

/**
 * The onboarding questions.
 *
 * Each select has a genuine "prefer not to say" option rather than a
 * pre-filled default, because a default is an answer nobody gave. Skip
 * writes only the timestamp, so everything stays null and every screen
 * that reads a preference falls back to showing nothing.
 */
export function OnboardingForm({
  defaults,
}: {
  defaults: {
    experienceLevel: ExperienceLevel | null;
    primaryGoal: LearningGoal | null;
    targetInterview: InterviewType | null;
    preferredLanguage: Language | null;
    weeklyTarget: number | null;
  };
}) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState<OnboardingState, FormData>(
    saveOnboardingAction,
    { status: "idle" }
  );
  const [skipping, startSkip] = useTransition();

  // A saved form is done; there is nothing to stay for. In an effect
  // rather than during render — navigating while rendering is a side
  // effect in the wrong phase, and React says so in development.
  useEffect(() => {
    if (state.status === "saved") router.push("/dashboard");
  }, [state.status, router]);

  return (
    <form
      action={formAction}
      className="overflow-hidden rounded-xl border border-border bg-card"
    >
      <ol className="divide-y divide-border">
        <Field step={1} id="experienceLevel" label="How much have you done before?">
          <Select name="experienceLevel" defaultValue={defaults.experienceLevel ?? ""}>
            <SelectTrigger id="experienceLevel" className="w-full">
              <SelectValue placeholder="Prefer not to say" />
            </SelectTrigger>
            <SelectContent>
              {EXPERIENCE.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field step={2} id="primaryGoal" label="What are you here for?">
          <Select name="primaryGoal" defaultValue={defaults.primaryGoal ?? ""}>
            <SelectTrigger id="primaryGoal" className="w-full">
              <SelectValue placeholder="Prefer not to say" />
            </SelectTrigger>
            <SelectContent>
              {GOALS.map((item) => (
                <SelectItem key={item.value} value={item.value}>
                  {item.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          step={3}
          id="targetInterview"
          label="Which interview are you most worried about?"
        >
          <Select name="targetInterview" defaultValue={defaults.targetInterview ?? ""}>
            <SelectTrigger id="targetInterview" className="w-full">
              <SelectValue placeholder="Prefer not to say" />
            </SelectTrigger>
            <SelectContent>
              {INTERVIEW_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {MACHINES[type].label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field step={4} id="preferredLanguage" label="Which language do you write in?">
          <Select
            name="preferredLanguage"
            defaultValue={defaults.preferredLanguage ?? ""}
          >
            <SelectTrigger id="preferredLanguage" className="w-full">
              <SelectValue placeholder="Prefer not to say" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_LANGUAGES.map((language) => (
                <SelectItem key={language} value={language}>
                  {LANGUAGE_LABEL[language]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Field
          step={5}
          id="weeklyTarget"
          label="How much do you want to get through in a week?"
          hint="Chapters and problems together. The dashboard shows progress against it; nothing happens if you miss it."
        >
          <Select
            name="weeklyTarget"
            defaultValue={defaults.weeklyTarget ? String(defaults.weeklyTarget) : ""}
          >
            <SelectTrigger id="weeklyTarget" className="w-full">
              <SelectValue placeholder="No target" />
            </SelectTrigger>
            <SelectContent>
              {TARGETS.map((target) => (
                <SelectItem key={target} value={String(target)}>
                  {target} a week
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
      </ol>

      {state.status === "error" && state.message && (
        <p
          role="alert"
          className="border-t border-border px-4 py-3 text-sm text-destructive sm:px-5"
        >
          {state.message}
        </p>
      )}

      <div className="flex flex-wrap items-center gap-2 border-t border-border bg-muted/20 px-4 py-3 sm:px-5">
        <Button type="submit" disabled={pending || skipping}>
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Save and continue
        </Button>

        <Button
          type="button"
          variant="ghost"
          disabled={pending || skipping}
          onClick={() =>
            startSkip(async () => {
              await skipOnboardingAction();
              router.push("/dashboard");
            })
          }
        >
          {skipping && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Skip
        </Button>
        <p className="w-full text-xs text-muted-foreground/70 sm:ml-auto sm:w-auto">
          You can change any of this later in settings.
        </p>
      </div>
    </form>
  );
}

function Field({
  step,
  id,
  label,
  hint,
  children,
}: {
  step: number;
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <li className="flex gap-3 px-4 py-4 sm:px-5">
      <span
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-ember-500/12 font-mono text-xs font-semibold text-ember-300"
        aria-hidden="true"
      >
        {step}
      </span>
      <div className="min-w-0 flex-1 space-y-2">
        <Label htmlFor={id}>{label}</Label>
        {children}
        {hint && (
          <p className="text-xs leading-relaxed text-muted-foreground">{hint}</p>
        )}
      </div>
    </li>
  );
}
