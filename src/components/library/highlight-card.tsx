"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { deleteHighlightAction } from "@/app/(shell)/highlight-actions";
import { HIGHLIGHT_COLOR_LABELS, type HighlightColor } from "@/lib/highlights/types";
import { cn, route } from "@/lib/utils";

/**
 * One highlight in the library.
 *
 * The quote is rendered as a blockquote in the colour it was marked in,
 * so the list reads as what the learner actually saw on the page. The
 * link goes back to the source; an unresolved one (content unpublished
 * since) says so and does not pretend to navigate anywhere useful.
 *
 * Deletion is two-step for the same reason as notes: a modal is heavier
 * than the action deserves and one click is a mis-tap away from losing
 * something.
 */

const BAR_CLASS: Record<HighlightColor, string> = {
  ember: "border-l-ember-500",
  sky: "border-l-sky-500",
  mint: "border-l-emerald-500",
  violet: "border-l-violet-500",
};

export function HighlightCard({
  id,
  href,
  title,
  subtitle,
  quote,
  color,
  resolved,
  createdAt,
}: {
  id: string;
  href: string;
  title: string;
  subtitle: string | null;
  quote: string;
  color: HighlightColor;
  resolved: boolean;
  createdAt: string;
}) {
  const router = useRouter();
  const [arming, setArming] = useState(false);
  const [pending, start] = useTransition();
  const [gone, setGone] = useState(false);

  if (gone) return null;

  function remove() {
    if (!arming) {
      setArming(true);
      setTimeout(() => setArming(false), 5_000);
      return;
    }

    start(async () => {
      const result = await deleteHighlightAction(id);
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
        <div className="min-w-0 flex-1">
          {resolved ? (
            <Link
              href={route(href)}
              className="text-xs font-medium text-info transition-colors hover:text-ember-300"
            >
              {title}
              {subtitle ? ` · ${subtitle}` : ""}
            </Link>
          ) : (
            <p className="text-xs text-muted-foreground/70">
              {title}
              {subtitle ? ` · ${subtitle}` : ""}
            </p>
          )}
        </div>

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

      <blockquote
        className={cn(
          "mt-2 max-w-3xl border-l-2 pl-3 text-sm leading-relaxed text-foreground/90",
          BAR_CLASS[color]
        )}
      >
        {quote}
      </blockquote>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
        <time dateTime={createdAt} className="text-[0.68rem] text-muted-foreground/70">
          {new Date(createdAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
        </time>
        <span className="text-[0.68rem] text-muted-foreground/60">
          {HIGHLIGHT_COLOR_LABELS[color]}
        </span>
      </div>
    </li>
  );
}
