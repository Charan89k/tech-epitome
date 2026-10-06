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
    <li className="px-4 py-4 transition-colors hover:bg-accent/20 sm:px-5">
      <div className="flex items-start gap-3">
        <Link
          href={route(href)}
          className="min-w-0 flex-1 truncate text-xs font-medium text-info transition-colors hover:text-ember-300"
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
          className={`h-7 shrink-0 gap-1.5 text-xs ${arming ? "text-destructive hover:text-destructive" : "text-muted-foreground hover:text-destructive"}`}
        >
          {pending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Trash2 className="size-3" aria-hidden="true" />
          )}
          {arming ? "Confirm" : "Delete"}
        </Button>
      </div>

      <p className="mt-1.5 max-w-3xl text-sm leading-relaxed whitespace-pre-wrap text-foreground/90">
        {body}
      </p>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <time dateTime={updatedAt} className="text-[0.68rem] text-muted-foreground/70">
          {new Date(updatedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <Link
          href={route(href)}
          className="text-[0.68rem] text-muted-foreground underline underline-offset-2 hover:text-ember-300"
        >
          Edit where you wrote it
        </Link>
      </div>
    </li>
  );
}
