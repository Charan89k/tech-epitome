"use client";

import { useActionState } from "react";
import Link from "next/link";
import { useFormStatus } from "react-dom";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";

import {
  requestResetAction,
  resetPasswordAction,
  type RecoveryState,
} from "@/app/(auth)/recovery-actions";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const EMPTY: RecoveryState = {};

function Submit({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}

function Failure({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle className="size-4" />
      <AlertDescription>{message}</AlertDescription>
    </Alert>
  );
}

export function ForgotPasswordForm({ emailAvailable }: { emailAvailable: boolean }) {
  const [state, action] = useActionState(requestResetAction, EMPTY);

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 text-center">
        <h1 className="tracking-headline text-2xl font-bold">Reset your password</h1>
        <p className="text-sm text-muted-foreground">
          We will email you a link that works once and lasts an hour.
        </p>
      </header>
      {!emailAvailable && (
        <Alert variant="warning">
          <AlertCircle className="size-4" />
          <AlertDescription>
            This site cannot send email yet, so no link will arrive. Ask a Tech Epitome
            administrator or your college to issue one.
          </AlertDescription>
        </Alert>
      )}
      {state.sent ? (
        <Alert variant="success" role="status">
          <CheckCircle2 className="size-4" />
          <AlertDescription>
            If that address has an account, a reset link is on its way.
          </AlertDescription>
        </Alert>
      ) : (
        <form action={action} className="space-y-4" noValidate>
          <Failure message={state.error} />
          <div className="space-y-1.5">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <Submit>Send reset link</Submit>
        </form>
      )}
      <p className="text-center text-sm text-muted-foreground">
        <Link href="/login" className="font-medium text-brand-300 hover:text-brand-200">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction.bind(null, token), EMPTY);

  return (
    <div className="space-y-6">
      <header className="space-y-1.5 text-center">
        <h1 className="tracking-headline text-2xl font-bold">Choose a new password</h1>
        <p className="text-sm text-muted-foreground">
          Every device signed in to this account will be signed out.
        </p>
      </header>
      <form action={action} className="space-y-4" noValidate>
        <Failure message={state.error} />
        <div className="space-y-1.5">
          <Label htmlFor="password">New password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
          />
          <p className="text-xs text-subtle-foreground">At least 10 characters.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="confirm">Repeat it</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
          />
        </div>
        <Submit>Set new password</Submit>
      </form>
    </div>
  );
}
