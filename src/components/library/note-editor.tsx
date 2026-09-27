"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { Check, Loader2, NotebookPen } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { saveNoteAction } from "@/app/(shell)/library-actions";
import type { Annotatable } from "@/services/library";

/**
 * The learner's note on one chapter, problem or pattern.
 *
 * One note per thing, not a thread — a margin note is what people
 * actually write while reading, and a comment list invites an audience
 * that does not exist here. Nothing written here is visible to anyone
 * else; there is no sharing and no moderation surface, deliberately.
 *
 * Clearing the box and saving deletes the note. That is the delete
 * gesture, so there is no second destructive button to mis-click.
 *
 * Collapsed by default: a reader is for reading, and an always-open
 * textarea under every chapter is visual noise for the majority who are
 * not writing one.
 */
export function NoteEditor({
  entityType,
  entityId,
  initialBody,
  signedIn,
}: {
  entityType: Annotatable;
  entityId: string;
  initialBody: string;
  signedIn: boolean;
}) {
  const [open, setOpen] = useState(initialBody.length > 0);
  const [body, setBody] = useState(initialBody);
  const [saved, setSaved] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const areaRef = useRef<HTMLTextAreaElement>(null);

  const dirty = body.trim() !== initialBody.trim();

  // The confirmation is transient; a permanent "Saved" is indistinguishable
  // from a stale one.
  useEffect(() => {
    if (!saved) return;
    const timer = setTimeout(() => setSaved(null), 4_000);
    return () => clearTimeout(timer);
  }, [saved]);

  if (!signedIn) {
    return (
      <div className="border-border bg-card rounded-lg border border-dashed p-4 text-center">
        <NotebookPen
          className="text-muted-foreground mx-auto size-4"
          aria-hidden="true"
        />
        <p className="text-muted-foreground mt-2 text-sm">
          Sign in to keep a note here. It is free, and nobody else can see it.
        </p>
        <Button asChild size="sm" variant="outline" className="mt-3">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="h-8 gap-1.5"
        onClick={() => {
          setOpen(true);
          // Focus after the textarea exists.
          requestAnimationFrame(() => areaRef.current?.focus());
        }}
      >
        <NotebookPen className="size-3.5" aria-hidden="true" />
        Add a note
      </Button>
    );
  }

  function save() {
    setError(null);
    start(async () => {
      const result = await saveNoteAction({ entityType, entityId, body });
      if (result.ok) {
        setSaved(result.data.saved ? "Note saved" : "Note deleted");
        if (!result.data.saved) setOpen(false);
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <div className="border-border bg-card rounded-lg border p-3">
      <label htmlFor="note-body" className="text-sm font-medium">
        Your note
      </label>
      <p className="text-muted-foreground mt-0.5 text-xs">
        Private to you. Clear it and save to delete it.
      </p>

      <Textarea
        id="note-body"
        ref={areaRef}
        value={body}
        onChange={(event) => setBody(event.target.value)}
        rows={4}
        maxLength={10_000}
        placeholder="What clicked, what did not, and what you want to remember next time…"
        className="mt-2 resize-y text-sm"
      />

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <Button
          type="button"
          size="sm"
          onClick={save}
          disabled={pending || !dirty}
          className="h-8"
        >
          {pending && <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />}
          Save note
        </Button>

        {initialBody.length === 0 && !dirty && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="h-8"
            onClick={() => setOpen(false)}
          >
            Cancel
          </Button>
        )}

        {/* Announced, because the visible tick is easy to miss. */}
        <p role="status" aria-live="polite" className="text-muted-foreground text-xs">
          {saved && (
            <span className="text-success inline-flex items-center gap-1">
              <Check className="size-3" aria-hidden="true" />
              {saved}
            </span>
          )}
        </p>
      </div>

      {error && (
        <p role="alert" className="text-destructive mt-2 text-xs">
          {error}
        </p>
      )}
    </div>
  );
}
