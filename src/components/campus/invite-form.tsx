"use client";

import { useActionState, useState, type ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { Copy, Loader2 } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type OneTimeLinkState = { link?: string; label?: string };

function Submit({ children, className }: { children: ReactNode; className?: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className={className}>
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </Button>
  );
}

/** A link shown once, because no email could carry it. */
export function OneTimeLink({ link, label }: { link: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <Alert variant="warning" role="status">
      <AlertTitle>Email was not sent. Share this link yourself</AlertTitle>
      <AlertDescription>
        <span className="block">
          {label} It is shown only now and is not stored, so copy it before leaving this
          page.
        </span>
        <span className="mt-2 flex gap-2">
          <Input
            readOnly
            value={link}
            aria-label="One-time link"
            data-testid="one-time-link"
          />
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label={copied ? "Copied" : "Copy link"}
            onClick={() => {
              void navigator.clipboard?.writeText(link).then(() => setCopied(true));
            }}
          >
            <Copy className="size-4" aria-hidden="true" />
          </Button>
        </span>
      </AlertDescription>
    </Alert>
  );
}

/**
 * A form whose action either redirects (the email went out) or returns a
 * one-time link for the person who asked (it did not).
 */
export function InviteForm({
  action,
  children,
  submitLabel,
  className,
  submitClassName,
}: {
  action: (state: OneTimeLinkState, form: FormData) => Promise<OneTimeLinkState>;
  children: ReactNode;
  submitLabel: string;
  className?: string;
  submitClassName?: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <div className="space-y-3">
      {state.link && <OneTimeLink link={state.link} label={state.label ?? ""} />}
      <form action={formAction} className={className}>
        {children}
        <Submit className={submitClassName}>{submitLabel}</Submit>
      </form>
    </div>
  );
}

/** A single button that asks for a one-time link. */
export function OneTimeLinkButton({
  action,
  label,
}: {
  action: (state: OneTimeLinkState) => Promise<OneTimeLinkState>;
  label: string;
}) {
  const [state, formAction] = useActionState(action, {});
  return (
    <div className="space-y-2">
      <form action={formAction}>
        <Button type="submit" variant="ghost" size="xs">
          {label}
        </Button>
      </form>
      {state.link && <OneTimeLink link={state.link} label={state.label ?? ""} />}
    </div>
  );
}
