"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Highlighter, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

import {
  createHighlightAction,
  deleteHighlightAction,
} from "@/app/(shell)/highlight-actions";
import {
  anchorFromSelection,
  anchorStillMatches,
  findBlock,
  HIGHLIGHT_ATTRIBUTE,
  paintHighlight,
  unpaintHighlight,
} from "@/lib/highlights/dom";
import {
  DEFAULT_HIGHLIGHT_COLOR,
  HIGHLIGHT_COLORS,
  HIGHLIGHT_COLOR_LABELS,
  type HighlightColor,
  type Highlightable as HighlightableType,
} from "@/lib/highlights/types";
import { cn } from "@/lib/utils";

/**
 * Makes rendered content highlightable.
 *
 * Wraps the server-rendered blocks rather than replacing them: the
 * content is still a server component tree, and this only adds a
 * selection listener, a floating toolbar and some `<mark>` elements on
 * top of the DOM that is already there. No content is re-rendered on the
 * client, so nothing about the reader changes for somebody who never
 * selects anything.
 *
 * **Anchoring is by offset into a block's text**, which means a highlight
 * can go stale when the content behind it is edited. `quote` is checked
 * against the text at those offsets before painting, and a mismatch is
 * skipped and reported rather than painted over the wrong words.
 *
 * Signed out, the toolbar says so instead of not appearing. A control
 * that silently does nothing is harder to understand than one that
 * explains itself.
 */

export type ClientHighlight = {
  id: string;
  blockIndex: number;
  startOffset: number;
  endOffset: number;
  quote: string;
  color: HighlightColor;
};

/** Tailwind classes per colour. A closed set, so these all exist in the build. */
const COLOR_CLASS: Record<HighlightColor, string> = {
  ember: "bg-ember-500/25 text-foreground rounded-[2px]",
  sky: "bg-sky-500/25 text-foreground rounded-[2px]",
  mint: "bg-emerald-500/25 text-foreground rounded-[2px]",
  violet: "bg-violet-500/25 text-foreground rounded-[2px]",
};

const SWATCH_CLASS: Record<HighlightColor, string> = {
  ember: "bg-ember-500",
  sky: "bg-sky-500",
  mint: "bg-emerald-500",
  violet: "bg-violet-500",
};

type Toolbar =
  | { mode: "create"; x: number; y: number }
  | { mode: "remove"; x: number; y: number; id: string }
  | null;

export function Highlightable({
  entityType,
  entityId,
  initialHighlights,
  signedIn,
  children,
}: {
  entityType: HighlightableType;
  entityId: string;
  initialHighlights: ClientHighlight[];
  signedIn: boolean;
  children: React.ReactNode;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [highlights, setHighlights] = useState(initialHighlights);
  const [toolbar, setToolbar] = useState<Toolbar>(null);
  const [pending, setPending] = useState(false);
  const [staleCount, setStaleCount] = useState(0);

  /** The selection captured when the toolbar opened, since clicking clears it. */
  const draft = useRef<ClientHighlight | null>(null);

  // --- painting -----------------------------------------------------------

  const repaint = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    // Clear first, so a re-run after a state change does not stack marks.
    for (const highlight of highlights) {
      unpaintHighlight(container, highlight.id);
    }

    let stale = 0;
    for (const highlight of highlights) {
      const block = findBlock(container, highlight.blockIndex);
      if (!block) {
        stale += 1;
        continue;
      }
      // The quote check is the whole reason `quote` is stored. An edit to
      // the block moves every offset after it; painting anyway would mark
      // a sentence the learner never chose.
      if (!anchorStillMatches(block, highlight)) {
        stale += 1;
        continue;
      }
      paintHighlight(block, highlight, {
        id: highlight.id,
        color: highlight.color,
        className: cn(
          COLOR_CLASS[highlight.color],
          "cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-ring"
        ),
      });
    }
    setStaleCount(stale);
  }, [highlights]);

  useEffect(() => {
    repaint();
    const container = containerRef.current;
    return () => {
      if (!container) return;
      for (const highlight of highlights) unpaintHighlight(container, highlight.id);
    };
  }, [repaint, highlights]);

  // --- selection ----------------------------------------------------------

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    /**
     * Fires on pointer release and on keyboard selection alike.
     *
     * `selectionchange` on its own fires continuously mid-drag, which
     * would flicker the toolbar; these two fire when a selection has
     * settled.
     */
    function onSelectionSettled(event: Event) {
      const target = event.target as Node | null;
      if (target && container && !container.contains(target)) return;

      const selection = window.getSelection();
      const anchor = anchorFromSelection(container!, selection);

      if (!anchor) {
        // Keep an open remove-toolbar; only clear a create-toolbar.
        setToolbar((current) => (current?.mode === "create" ? null : current));
        draft.current = null;
        return;
      }

      draft.current = {
        id: "pending",
        blockIndex: anchor.blockIndex,
        startOffset: anchor.startOffset,
        endOffset: anchor.endOffset,
        quote: anchor.quote,
        color: DEFAULT_HIGHLIGHT_COLOR,
      };

      const rect = selection!.getRangeAt(0).getBoundingClientRect();
      const bounds = container!.getBoundingClientRect();
      setToolbar({
        mode: "create",
        x: rect.left - bounds.left + rect.width / 2,
        y: rect.top - bounds.top,
      });
    }

    /** Activating an existing mark offers to remove it. */
    function onActivate(event: Event) {
      const target = event.target as HTMLElement | null;
      const mark = target?.closest?.(`mark[${HIGHLIGHT_ATTRIBUTE}]`);
      if (!mark) return;

      const id = mark.getAttribute(HIGHLIGHT_ATTRIBUTE);
      if (!id) return;

      const rect = mark.getBoundingClientRect();
      const bounds = container!.getBoundingClientRect();
      setToolbar({
        mode: "remove",
        id,
        x: rect.left - bounds.left + rect.width / 2,
        y: rect.top - bounds.top,
      });
      event.preventDefault();
    }

    function onKeyActivate(event: KeyboardEvent) {
      if (event.key !== "Enter" && event.key !== " ") return;
      onActivate(event);
    }

    function onDismiss(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest("[data-highlight-toolbar]")) return;
      if (target?.closest(`mark[${HIGHLIGHT_ATTRIBUTE}]`)) return;
      setToolbar(null);
    }

    // `pointerup` rather than `mouseup`: touch devices report the former.
    container.addEventListener("pointerup", onSelectionSettled);
    container.addEventListener("keyup", onSelectionSettled);
    container.addEventListener("click", onActivate);
    container.addEventListener("keydown", onKeyActivate);
    document.addEventListener("pointerdown", onDismiss);

    return () => {
      container.removeEventListener("pointerup", onSelectionSettled);
      container.removeEventListener("keyup", onSelectionSettled);
      container.removeEventListener("click", onActivate);
      container.removeEventListener("keydown", onKeyActivate);
      document.removeEventListener("pointerdown", onDismiss);
    };
  }, []);

  // --- mutations ----------------------------------------------------------

  async function create(color: HighlightColor) {
    const anchor = draft.current;
    if (!anchor) return;

    if (!signedIn) {
      toast("Sign in to highlight", {
        description: "Highlights are saved to your account. It is free.",
      });
      setToolbar(null);
      return;
    }

    setPending(true);
    try {
      const result = await createHighlightAction({
        entityType,
        entityId,
        blockIndex: anchor.blockIndex,
        startOffset: anchor.startOffset,
        endOffset: anchor.endOffset,
        quote: anchor.quote,
        color,
      });

      if (!result.ok) {
        toast.error(result.error);
        return;
      }

      const saved = result.data.highlight;
      setHighlights((current) =>
        current.some((row) => row.id === saved.id)
          ? current
          : [
              ...current,
              {
                id: saved.id,
                blockIndex: saved.blockIndex,
                startOffset: saved.startOffset,
                endOffset: saved.endOffset,
                quote: saved.quote,
                color: saved.color,
              },
            ]
      );
      window.getSelection()?.removeAllRanges();
    } finally {
      setPending(false);
      setToolbar(null);
      draft.current = null;
    }
  }

  async function remove(id: string) {
    setPending(true);
    const previous = highlights;
    setHighlights((current) => current.filter((row) => row.id !== id));
    setToolbar(null);

    try {
      const result = await deleteHighlightAction(id);
      if (!result.ok) {
        setHighlights(previous);
        toast.error(result.error);
      }
    } finally {
      setPending(false);
    }
  }

  // --- render -------------------------------------------------------------

  return (
    <div ref={containerRef} className="relative" data-testid="highlightable">
      {children}

      {toolbar && (
        <div
          data-highlight-toolbar
          // Positioned over the selection, clamped into the container so
          // it never hangs off the left edge on a narrow screen.
          style={{
            left: `clamp(5rem, ${toolbar.x}px, calc(100% - 5rem))`,
            top: Math.max(0, toolbar.y),
          }}
          className="border-border bg-popover absolute z-30 flex -translate-x-1/2 -translate-y-[calc(100%+0.5rem)] items-center gap-1 rounded-lg border p-1 shadow-md"
          role="toolbar"
          aria-label={
            toolbar.mode === "create" ? "Highlight selection" : "Highlight options"
          }
        >
          {pending && (
            <Loader2
              className="text-muted-foreground mx-2 size-3.5 animate-spin"
              aria-hidden="true"
            />
          )}

          {!pending && toolbar.mode === "create" && (
            <>
              <Highlighter
                className="text-muted-foreground ml-1 size-3.5"
                aria-hidden="true"
              />
              {HIGHLIGHT_COLORS.map((color) => (
                <button
                  key={color}
                  type="button"
                  onClick={() => void create(color)}
                  // 36px square: a colour swatch has to be tappable, and
                  // the visible dot inside it is smaller than the target.
                  className="focus-visible:ring-ring flex size-9 items-center justify-center rounded-md focus-visible:ring-2 focus-visible:outline-none"
                  aria-label={`Highlight in ${HIGHLIGHT_COLOR_LABELS[color]}`}
                >
                  <span
                    className={cn("size-4 rounded-full", SWATCH_CLASS[color])}
                    aria-hidden="true"
                  />
                </button>
              ))}
            </>
          )}

          {!pending && toolbar.mode === "remove" && (
            <button
              type="button"
              onClick={() => void remove(toolbar.id)}
              className="hover:bg-accent focus-visible:ring-ring flex h-9 items-center gap-1.5 rounded-md px-3 text-xs focus-visible:ring-2 focus-visible:outline-none"
            >
              <Trash2 className="size-3.5" aria-hidden="true" />
              Remove highlight
            </button>
          )}
        </div>
      )}

      {/* Stale anchors are reported, never painted over the wrong text. */}
      {staleCount > 0 && (
        <p className="text-muted-foreground/70 mt-4 text-xs">
          {staleCount === 1
            ? "1 highlight could not be shown because this page changed since you made it."
            : `${staleCount} highlights could not be shown because this page changed since you made them.`}{" "}
          They are still listed in your library.
        </p>
      )}
    </div>
  );
}
