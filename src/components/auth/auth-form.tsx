"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, Loader2 } from "lucide-react";

import {
  signInAction,
  signInWithGitHubAction,
  signInWithGoogleAction,
  signUpAction,
  type AuthFormState,
} from "@/app/(auth)/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

type Mode = "signin" | "signup";

type AuthFormProps = {
  mode: Mode;
  /** Absolute same-origin path to return to after success. */
  next: string;
  googleEnabled: boolean;
  githubEnabled: boolean;
  /**
   * A message from a failed provider sign-in, already mapped from Auth.js'
   * `?error=` code by the page. Never the raw parameter.
   */
  notice?: string | null;
};

const EMPTY: AuthFormState = {};

export function AuthForm({
  mode,
  next,
  googleEnabled,
  githubEnabled,
  notice = null,
}: AuthFormProps) {
  const action = mode === "signin" ? signInAction : signUpAction;
  const [state, formAction] = useActionState(action, EMPTY);

  const fieldErrors = state.fieldErrors ?? {};

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 text-center">
        <h1 className="tracking-headline text-2xl font-bold">
          {mode === "signin" ? "Sign in to Tech Epitome" : "Create your account"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {mode === "signin"
            ? "Pick up where you left off."
            : "Free, every track and feature. No card."}
        </p>
      </header>

      {/* The form's own error wins: once the learner has tried again, the
          message about the earlier provider attempt is stale. */}
      {!state.error && notice && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" />
          <AlertDescription>{notice}</AlertDescription>
        </Alert>
      )}

      {state.error && (
        <Alert variant="destructive" role="alert">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      {/*
        Each provider gets its own form so `useFormStatus` reports the
        pending state of the button that was actually pressed, rather than
        spinning every provider at once. The separator renders only when at
        least one provider is configured - with none, the email fields are
        the whole form and an "or" above them would separate nothing.
      */}
      {(googleEnabled || githubEnabled) && (
        <>
          <div className="space-y-3">
            {googleEnabled && (
              <form action={signInWithGoogleAction}>
                <input type="hidden" name="next" value={next} />
                <ProviderButton provider="google" />
              </form>
            )}

            {githubEnabled && (
              <form action={signInWithGitHubAction}>
                <input type="hidden" name="next" value={next} />
                <ProviderButton provider="github" />
              </form>
            )}
          </div>

          <div className="relative">
            <Separator />
            <span className="bg-card text-muted-foreground absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 px-3 text-xs">
              or
            </span>
          </div>
        </>
      )}

      <form action={formAction} className="space-y-4" noValidate>
        <input type="hidden" name="next" value={next} />

        {mode === "signup" && (
          <Field
            id="name"
            name="name"
            label="Name"
            type="text"
            autoComplete="name"
            placeholder="Ada Lovelace"
            error={fieldErrors.name}
            required
          />
        )}

        <Field
          id="email"
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          error={fieldErrors.email}
          required
        />

        <Field
          id="password"
          name="password"
          label="Password"
          type="password"
          autoComplete={mode === "signin" ? "current-password" : "new-password"}
          placeholder={mode === "signup" ? "At least 10 characters" : undefined}
          hint={
            mode === "signup"
              ? "At least 10 characters. Length beats symbols."
              : undefined
          }
          error={fieldErrors.password}
          required
        />

        <SubmitButton mode={mode} />
      </form>

      <p className="text-muted-foreground text-center text-sm">
        {mode === "signin" ? (
          <>
            New here?{" "}
            <Link
              href={{ pathname: "/signup", query: { next } }}
              className="text-ember-300 hover:text-ember-200 font-medium underline-offset-4 hover:underline"
            >
              Create an account
            </Link>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <Link
              href={{ pathname: "/login", query: { next } }}
              className="text-ember-300 hover:text-ember-200 font-medium underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </>
        )}
      </p>
    </div>
  );
}

function SubmitButton({ mode }: { mode: Mode }) {
  const { pending } = useFormStatus();

  return (
    <Button type="submit" className="h-10 w-full" disabled={pending}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending
        ? mode === "signin"
          ? "Signing in…"
          : "Creating account…"
        : mode === "signin"
          ? "Sign in"
          : "Create account"}
    </Button>
  );
}

const PROVIDERS = {
  google: { label: "Continue with Google", Glyph: GoogleGlyph },
  github: { label: "Continue with GitHub", Glyph: GitHubGlyph },
} as const;

function ProviderButton({ provider }: { provider: keyof typeof PROVIDERS }) {
  const { pending } = useFormStatus();
  const { label, Glyph } = PROVIDERS[provider];

  return (
    <Button
      type="submit"
      variant="outline"
      className="h-10 w-full"
      disabled={pending}
    >
      {pending ? (
        <Loader2 className="size-4 animate-spin" aria-hidden="true" />
      ) : (
        <Glyph />
      )}
      {label}
    </Button>
  );
}

type FieldProps = {
  id: string;
  name: string;
  label: string;
  type: string;
  autoComplete?: string;
  placeholder?: string;
  hint?: string;
  error?: string;
  required?: boolean;
};

function Field({
  id,
  name,
  label,
  type,
  autoComplete,
  placeholder,
  hint,
  error,
  required,
}: FieldProps) {
  const describedBy =
    [error ? `${id}-error` : null, hint ? `${id}-hint` : null]
      .filter(Boolean)
      .join(" ") || undefined;

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        name={name}
        type={type}
        autoComplete={autoComplete}
        placeholder={placeholder}
        required={required}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={cn("h-10", error && "border-destructive focus-visible:ring-destructive/40")}
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="text-muted-foreground text-xs">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="text-destructive text-xs" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

function GoogleGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.52 12.27c0-.85-.08-1.67-.22-2.45H12v4.64h6.46a5.52 5.52 0 0 1-2.4 3.62v3.01h3.88c2.27-2.09 3.58-5.17 3.58-8.82Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.96-1.08 7.94-2.91l-3.88-3.01c-1.08.72-2.45 1.15-4.06 1.15-3.12 0-5.77-2.11-6.71-4.94H1.28v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.29 14.29a7.2 7.2 0 0 1 0-4.58v-3.1H1.28a12 12 0 0 0 0 10.78l4.01-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.59 1.8l3.44-3.44C17.95 1.18 15.24 0 12 0A12 12 0 0 0 1.28 6.61l4.01 3.1C6.23 6.86 8.88 4.75 12 4.75Z"
      />
    </svg>
  );
}

/**
 * The GitHub mark, inline for the same reason the Google one is: the icon
 * set this project already depends on (lucide) dropped its brand icons, and
 * two brand glyphs are not worth a second icon package. `currentColor` so it
 * stays legible in both themes - the mark is monochrome by design, unlike
 * Google's, which has fixed brand colours.
 */
function GitHubGlyph() {
  return (
    <svg viewBox="0 0 24 24" className="size-4" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 .3a12 12 0 0 0-3.79 23.4c.6.11.82-.26.82-.58v-2.23c-3.34.72-4.04-1.42-4.04-1.42-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.84 2.81 1.31 3.5 1 .1-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6.003 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.77.84 1.23 1.91 1.23 3.22 0 4.61-2.8 5.63-5.48 5.92.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.83.58A12 12 0 0 0 12 .3Z"
      />
    </svg>
  );
}
