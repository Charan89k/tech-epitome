"use client";

import { useId, useState } from "react";

import { Input } from "@/components/ui/input";

/**
 * A datetime-local input in the browser's zone that submits an ISO
 * instant, so the server never guesses what zone the author meant.
 */
function toLocalInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const offset = d.getTimezoneOffset() * 60_000;
  return new Date(d.getTime() - offset).toISOString().slice(0, 16);
}

export function DateTimeField({
  name,
  label,
  defaultValue,
  required,
  hint,
}: {
  name: string;
  label: string;
  defaultValue?: string | null;
  required?: boolean;
  hint?: string;
}) {
  const id = useId();
  const [local, setLocal] = useState(() => toLocalInput(defaultValue));
  const iso = local ? new Date(local).toISOString() : "";
  return (
    <div>
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <Input
        id={id}
        type="datetime-local"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        required={required}
        className="mt-1"
        aria-describedby={hint ? `${id}-hint` : undefined}
      />
      <input type="hidden" name={name} value={iso} />
      {hint && (
        <p id={`${id}-hint`} className="mt-1 text-xs text-muted-foreground">
          {hint}
        </p>
      )}
    </div>
  );
}
