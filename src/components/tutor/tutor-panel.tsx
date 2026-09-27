"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bookmark,
  Brain,
  Check,
  Clock,
  Copy,
  Lightbulb,
  List,
  Loader2,
  Repeat,
  RotateCcw,
  Search,
  Send,
  Sparkles,
  Square,
  X,
} from "lucide-react";

import { TutorMarkdown } from "@/components/tutor/tutor-markdown";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useTutorStream, type TutorTurn } from "@/hooks/use-tutor-stream";
import type {
  TutorAnchor,
  TutorCodeState,
  TutorContextLabel,
  TutorQuickAction,
} from "@/lib/tutor/types";
import { cn } from "@/lib/utils";

/**
 * The tutor conversation surface.
 *
 * One component for all three entry points. The panel does not know whether
 * it is in a sheet on a problem page, a sheet on a chapter, or filling the
 * `/ai-tutor` route — it is handed an anchor, a context label and a set of
 * quick actions, and it behaves the same way in each. That is what keeps
 * the tutor feeling like one integrated tool rather than three chatbots
 * that happen to share a colour scheme.
 */

const ICONS = {
  lightbulb: Lightbulb,
  search: Search,
  brain: Brain,
  x: X,
  clock: Clock,
  repeat: Repeat,
  list: List,
  bookmark: Bookmark,
} as const;

function ContextHeader({ label }: { label: TutorContextLabel }) {
  const hasContext = Boolean(label.primary || label.secondary);

  return (
    <header className="border-border border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <Sparkles className="text-ember-400 size-4 shrink-0" aria-hidden="true" />
        <h2 className="text-sm font-semibold">AI Tutor</h2>
      </div>

      {hasContext ? (
        <div className="mt-2">
          <p className="text-muted-foreground text-[0.65rem] font-medium tracking-wider uppercase">
            Currently studying
          </p>
          {label.primary && (
            <p className="text-ember-300 mt-0.5 text-sm font-medium">
              {label.primary}
            </p>
          )}
          {label.secondary && (
            <p className="mt-0.5 text-sm leading-snug font-medium text-balance">
              {label.secondary}
            </p>
          )}
          {label.chips.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {label.chips.map((chip) => (
                <Badge key={chip} variant="secondary" className="text-[0.65rem]">
                  {chip}
                </Badge>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
          Ask about anything in the curriculum. Open the tutor from a chapter or
          a problem and it will know what you are working on.
        </p>
      )}
    </header>
  );
}

function QuickActions({
  actions,
  onPick,
  disabled,
  hasCode,
}: {
  actions: TutorQuickAction[];
  onPick: (action: TutorQuickAction) => void;
  disabled: boolean;
  hasCode: boolean;
}) {
  // An action that reasons about code is hidden until there is code, rather
  // than shown disabled: "Find the bug" on an empty editor is noise.
  const usable = actions.filter((action) => !action.requiresCode || hasCode);
  if (usable.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {usable.map((action) => {
        const Icon = ICONS[action.icon as keyof typeof ICONS] ?? Sparkles;
        return (
          <button
            key={action.id}
            type="button"
            disabled={disabled}
            onClick={() => onPick(action)}
            className={cn(
              "border-border text-muted-foreground inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
              "hover:border-ember-500/40 hover:text-ember-300",
              "disabled:pointer-events-none disabled:opacity-50"
            )}
          >
            <Icon className="size-3" aria-hidden="true" />
            {action.label}
          </button>
        );
      })}
    </div>
  );
}

function Turn({ turn }: { turn: TutorTurn }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(turn.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard unavailable; the text is still selectable.
    }
  }

  if (turn.role === "USER") {
    return (
      <div className="flex justify-end">
        <div className="bg-muted max-w-[85%] rounded-lg rounded-br-sm px-3 py-2">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">
            {turn.content}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="group/turn">
      <div className="flex items-center gap-1.5">
        <Sparkles className="text-ember-400 size-3" aria-hidden="true" />
        <span className="text-muted-foreground text-[0.65rem] font-medium tracking-wider uppercase">
          Tutor
        </span>
        {turn.hintLevel > 0 && (
          <span className="text-warning text-[0.65rem]">
            hint {turn.hintLevel}
          </span>
        )}
        {!turn.streaming && turn.content && (
          <button
            type="button"
            onClick={copy}
            className="text-muted-foreground hover:text-foreground ml-auto flex items-center gap-1 rounded px-1 text-[0.65rem] opacity-0 transition-opacity group-hover/turn:opacity-100 focus-visible:opacity-100"
            aria-label={copied ? "Copied" : "Copy response"}
          >
            {copied ? (
              <Check className="text-success size-3" aria-hidden="true" />
            ) : (
              <Copy className="size-3" aria-hidden="true" />
            )}
          </button>
        )}
      </div>

      <div className="mt-1.5">
        <TutorMarkdown content={turn.content} />
        {turn.streaming && (
          <span
            className="bg-ember-400 ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-text-bottom"
            aria-hidden="true"
          />
        )}
      </div>
    </div>
  );
}

export function TutorPanel({
  anchor,
  label,
  quickActions,
  getCode,
  onClose,
  className,
}: {
  anchor: TutorAnchor;
  label: TutorContextLabel;
  quickActions: TutorQuickAction[];
  /** Supplied by the problem workspace so the tutor sees live editor state. */
  getCode?: () => TutorCodeState | undefined;
  onClose?: () => void;
  className?: string;
}) {
  const tutor = useTutorStream({ anchor, getCode });
  const [draft, setDraft] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const endRef = useRef<HTMLDivElement>(null);

  const hasCode = Boolean(getCode?.()?.code?.trim());

  // Follow the stream, but only when the learner is already at the bottom —
  // yanking the view down while they are re-reading an earlier hint is the
  // single most irritating thing a chat panel can do.
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const distance =
      container.scrollHeight - container.scrollTop - container.clientHeight;
    if (distance < 120) {
      endRef.current?.scrollIntoView({ block: "end" });
    }
  }, [tutor.turns]);

  function submit() {
    const text = draft.trim();
    if (!text || tutor.streaming) return;
    setDraft("");
    tutor.send({ requestType: "GENERAL_QUESTION", utterance: text });
  }

  return (
    <div className={cn("flex h-full min-h-0 flex-col", className)}>
      <div className="flex items-start">
        <div className="min-w-0 flex-1">
          <ContextHeader label={label} />
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            className="mt-2 mr-2 size-7 shrink-0"
            onClick={onClose}
            aria-label="Close tutor"
          >
            <X className="size-4" />
          </Button>
        )}
      </div>

      {/* Transcript */}
      <div
        ref={scrollRef}
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
        data-testid="tutor-transcript"
      >
        {tutor.turns.length === 0 ? (
          <div className="py-6">
            <p className="text-sm font-medium">
              What are you stuck on?
            </p>
            <p className="text-muted-foreground mt-1.5 text-xs leading-relaxed">
              I will not hand you the answer. I will ask the question that gets
              you to it — and if you are properly stuck, the hints get more
              direct one step at a time.
            </p>
            <div className="mt-4">
              <QuickActions
                actions={quickActions}
                onPick={(action) =>
                  tutor.send({
                    requestType: action.requestType,
                    utterance: action.utterance,
                  })
                }
                disabled={tutor.streaming}
                hasCode={hasCode}
              />
            </div>
          </div>
        ) : (
          tutor.turns.map((turn) => <Turn key={turn.id} turn={turn} />)
        )}

        {tutor.error && (
          <div
            role="alert"
            className="border-destructive/30 bg-destructive/5 rounded-md border p-3"
          >
            <p className="text-destructive text-xs leading-relaxed">
              {tutor.error}
            </p>
            {tutor.retryable && (
              <Button
                variant="outline"
                size="sm"
                className="mt-2 h-7 text-xs"
                onClick={tutor.retry}
                disabled={tutor.streaming}
              >
                <RotateCcw className="size-3" />
                Try again
              </Button>
            )}
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="border-border space-y-2 border-t px-4 py-3">
        {tutor.turns.length > 0 && (
          <QuickActions
            actions={quickActions}
            onPick={(action) =>
              tutor.send({
                requestType: action.requestType,
                utterance: action.utterance,
              })
            }
            disabled={tutor.streaming}
            hasCode={hasCode}
          />
        )}

        <div className="flex items-end gap-2">
          <Textarea
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              // Enter sends; Shift+Enter is a newline. On a phone the key is
              // a newline either way — the on-screen keyboard has no shift,
              // and the send button is right there.
              if (event.key === "Enter" && !event.shiftKey && !isCoarsePointer()) {
                event.preventDefault();
                submit();
              }
            }}
            placeholder="Ask the tutor…"
            rows={1}
            aria-label="Message the tutor"
            className="max-h-32 min-h-[2.25rem] resize-none py-2 text-sm"
          />

          {tutor.streaming ? (
            <Button
              size="icon"
              variant="outline"
              className="size-9 shrink-0"
              onClick={tutor.cancel}
              aria-label="Stop generating"
            >
              <Square className="size-3.5" />
            </Button>
          ) : (
            <Button
              size="icon"
              className="size-9 shrink-0"
              onClick={submit}
              disabled={!draft.trim()}
              aria-label="Send message"
            >
              <Send className="size-3.5" />
            </Button>
          )}
        </div>

        <div className="flex items-center justify-between gap-2">
          <p className="text-muted-foreground/70 text-[0.65rem]">
            {tutor.streaming ? (
              <span className="flex items-center gap-1">
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                Thinking…
              </span>
            ) : (
              "The tutor guides; it does not hand over answers."
            )}
          </p>

          {tutor.turns.length > 0 && (
            <button
              type="button"
              onClick={() => {
                tutor.reset();
                setDraft("");
              }}
              className="text-muted-foreground hover:text-foreground text-[0.65rem] transition-colors"
            >
              New chat
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/** Touch devices get a newline on Enter; there is no shift key to hold. */
function isCoarsePointer(): boolean {
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}
