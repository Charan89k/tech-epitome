"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteNoteAction } from "@/app/(shell)/library-actions";
import { route } from "@/lib/utils";

/**
 * One note in the library list.
 *
 * Editing happens where the note was written — beside the chapter or the
 * problem it is about — so this card links there rather than duplicating
 * the editor. What it does own is deletion, which is the one thing you
 * come to a list of notes to do in bulk.
 *
 * The delete is a two-step: the first click arms it, the second confirms.
 * A modal for a note is heavier than the action deserves, and a single
 * click is one mis-tap away from losing something.
 */
export function NoteCard({
  id,
  href,
  title,
  subtitle,
  body,
  updatedAt,
}: {
  id: string;
  href: string;
  title: string;
  subtitle: string | null;
  body: string;
  updatedAt: string;
}) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);

  if (gone) return null;

  function remove() {
    if (!arming) {
      setArming(true);
      // Disarm on its own, so an armed button never sits there waiting.
      setTimeout(() => setArming(false), 5_000);
      return;
    }

    start(async () => {
      const result = await deleteNoteAction(id);
      if (result.ok) {
        setGone(true);
        router.refresh();
      } else {
        setArming(false);
        toast.error(result.error);
      }
    });
  }

  return (
    <li className="border-border bg-card rounded-lg border p-4">
      <div className="flex items-start gap-3">
        <Link
          href={route(href)}
          className="text-muted-foreground hover:text-ember-300 min-w-0 flex-1 text-xs transition-colors"
        >
          {title}
          {subtitle ? ` · ${subtitle}` : ""}
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={remove}
          disabled={pending}
          className="text-muted-foreground hover:text-destructive h-7 shrink-0 gap-1.5 text-xs"
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3" aria-hidden="true" />
          )}
          {arming ? "Confirm" : "Delete"}
        </Button>
      </div>

      <p className="text-foreground mt-2 text-sm leading-relaxed whitespace-pre-wrap">
        {body}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <time
          dateTime={updatedAt}
          className="text-muted-foreground/70 text-[0.68rem]"
        >
          {new Date(updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <Link
          href={route(href)}
          className="text-muted-foreground hover:text-ember-300 text-[0.68rem] underline underline-offset-2"
        >
          Edit where you wrote it
        </Link>
      </div>
    </li>
  );
}
