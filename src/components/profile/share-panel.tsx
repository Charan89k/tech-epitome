"use client";

import { useState, useTransition } from "react";

import {
  createShareLinkAction,
  revokeShareLinkAction,
} from "@/app/(shell)/profile/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * Create or revoke the public achievement summary. The link is shown once,
 * right after it is made; afterwards only "a link is active" is known,
 * because the server keeps a hash, not the link.
 */
export function SharePanel({
  active,
}: {
  active: { createdAt: string; displayName: string | null } | null;
}) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  const create = () =>
    start(async () => {
      setError(null);
      const result = await createShareLinkAction(name);
      if (result.ok) setUrl(`${window.location.origin}/share/${result.token}`);
      else setError(result.error);
    });

  return (
    <div className="space-y-3 text-sm">
      <p className="text-muted-foreground">
        A public page with your unlocked achievements and three counts: problems solved,
        lessons completed and mock interviews done. It never shows your email, scores,
        interview feedback, transcripts, notes or college.
      </p>
      {url ? (
        <div className="space-y-2" role="status">
          <p className="font-medium">Your link (shown once, so copy it now):</p>
          <Input
            readOnly
            value={url}
            aria-label="Share link"
            onFocus={(e) => e.currentTarget.select()}
          />
          <Button
            size="sm"
            variant="outline"
            onClick={() => void navigator.clipboard?.writeText(url)}
          >
            Copy
          </Button>
        </div>
      ) : active ? (
        <p>
          A link is active
          {active.displayName ? `, showing the name "${active.displayName}"` : ""}.
          Making a new one replaces it.
        </p>
      ) : (
        <p>Nothing is shared.</p>
      )}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="share-name" className="text-xs font-medium">
            Name to show (optional)
          </label>
          <Input
            id="share-name"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
            placeholder="A Tech Epitome learner"
            className="mt-1"
          />
        </div>
        <Button size="sm" onClick={create} disabled={pending}>
          {active || url ? "Make a new link" : "Create link"}
        </Button>
        {(active || url) && (
          <Button
            size="sm"
            variant="destructive"
            disabled={pending}
            onClick={() =>
              start(async () => {
                await revokeShareLinkAction();
                setUrl(null);
              })
            }
          >
            Stop sharing
          </Button>
        )}
      </div>
      {error && (
        <p className="text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
