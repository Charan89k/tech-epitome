"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import {
  Check,
  Code2,
  FileText,
  Loader2,
  MessagesSquare,
  Send,
  Square,
  UserRound,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Pane, UnderlineTab, UNDERLINE_TABS_LIST } from "@/components/system-design/pane";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  endInterviewAction,
  generateFeedbackAction,
  saveInterviewCodeAction,
} from "@/app/(shell)/interviews/actions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  codeIsRelevant,
  progressStages,
  STAGE_GUIDANCE,
  STAGE_LABELS,
  stageIndex,
  type InterviewKind,
  type InterviewStage,
} from "@/lib/interview/types";
import type { Language } from "@/generated/prisma/enums";
import { cn } from "@/lib/utils";

/**
 * The interview room.
 *
 * Deliberately not a chat UI with a send button and nothing else. An
 * interview has a shape, so the shape is visible: a stepper showing
 * where you are, guidance for what this stage expects of you, and an
 * editor that appears when there is something to write.
 *
 * The client never decides what happens next. It posts what the
 * candidate said; the server reads the stored stage, derives the turn,
 * and returns the stage the interview is now in. Everything below
 * treats the server's answer as authoritative.
 */

const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> }
);

type Turn = { id: string; role: "USER" | "ASSISTANT"; content: string; streaming?: boolean };

export function InterviewRoom({
  sessionId,
  kind,
  initialStage,
  initialTranscript,
  initialCode,
  language,
  problemTitle,
  problemStatement,
  hasFeedback,
}: {
  sessionId: string;
  /** Which interview this is. Decides the stepper, the editor and the copy. */
  kind: InterviewKind;
  initialStage: InterviewStage;
  initialTranscript: { id: string; role: "USER" | "ASSISTANT"; content: string }[];
  initialCode: string;
  language: Language;
  problemTitle: string;
  /**
   * The brief, exactly as the interviewer received it. Shown once the
   * interview has begun so the candidate can re-read it — an interviewer
   * who asks about a constraint the candidate cannot see is testing
   * memory, not design.
   */
  problemStatement: string;
  hasFeedback: boolean;
}) {
  const router = useRouter();
  const isMobile = useIsMobile();

  const [stage, setStage] = useState<InterviewStage>(initialStage);
  const [turns, setTurns] = useState<Turn[]>(initialTranscript);
  const [draft, setDraft] = useState("");
  const [code, setCode] = useState(initialCode);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generating, startGenerate] = useTransition();

  const abortRef = useRef<AbortController | null>(null);
  const inFlight = useRef(false);
  const codeDirty = useRef(false);
  const codeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  // Debounced code autosave, so the interviewer can be asked about what
  // is actually in the editor.
  useEffect(() => {
    if (!codeDirty.current) return;
    if (codeTimer.current) clearTimeout(codeTimer.current);
    codeTimer.current = setTimeout(() => {
      void saveInterviewCodeAction({ sessionId, code, language });
    }, 1_200);
    return () => {
      if (codeTimer.current) clearTimeout(codeTimer.current);
    };
  }, [code, language, sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: "end" });
  }, [turns]);

  const turn = useCallback(
    async (opts: { message?: string; end?: boolean }) => {
      if (inFlight.current) return;
      inFlight.current = true;
      setError(null);
      setStreaming(true);

      if (opts.message?.trim()) {
        setTurns((prev) => [
          ...prev,
          { id: `local-${Date.now()}`, role: "USER", content: opts.message!.trim() },
        ]);
      }

      const controller = new AbortController();
      abortRef.current = controller;
      const assistantId = `a-${Date.now()}`;
      let opened = false;

      try {
        const response = await fetch("/api/interview/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          // Note what is not sent: the stage, and the request type. The
          // server owns both.
          body: JSON.stringify({
            sessionId,
            message: opts.message,
            code: codeIsRelevant(kind, stage) ? code : undefined,
            end: opts.end,
          }),
        });

        if (!response.ok || !response.body) {
          const detail = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(detail?.error ?? "The interviewer could not be reached.");
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          const records = buffer.split("\n\n");
          buffer = records.pop() ?? "";

          for (const record of records) {
            const line = record.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;

            let event: {
              type: string;
              text?: string;
              stage?: string;
              ended?: boolean;
              message?: string;
            };
            try {
              event = JSON.parse(line.slice(5).trim());
            } catch {
              continue;
            }

            if (event.type === "text") {
              if (!opened) {
                opened = true;
                setTurns((prev) => [
                  ...prev,
                  { id: assistantId, role: "ASSISTANT", content: "", streaming: true },
                ]);
              }
              setTurns((prev) =>
                prev.map((t) =>
                  t.id === assistantId ? { ...t, content: t.content + event.text } : t
                )
              );
            } else if (event.type === "done") {
              if (event.stage) setStage(event.stage as InterviewStage);
              setTurns((prev) =>
                prev.map((t) => (t.id === assistantId ? { ...t, streaming: false } : t))
              );
              // The reference and the feedback panel are server-rendered,
              // so a finished interview needs a real refresh.
              if (event.ended) router.refresh();
            } else if (event.type === "error") {
              setError(event.message ?? "Something went wrong.");
            }
          }
        }
      } catch (caught) {
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setError("The connection to the interviewer dropped.");
        }
      } finally {
        setTurns((prev) =>
          prev
            .map((t) => (t.id === assistantId ? { ...t, streaming: false } : t))
            .filter((t) => !(t.id === assistantId && t.content.trim() === ""))
        );
        setStreaming(false);
        inFlight.current = false;
        abortRef.current = null;
      }
    },
    [sessionId, kind, stage, code, router]
  );

  function send() {
    const text = draft.trim();
    if (!text || streaming) return;
    setDraft("");
    void turn({ message: text });
  }

  function finish() {
    if (streaming) return;
    void turn({ end: true }).then(async () => {
      await endInterviewAction(sessionId);
      router.refresh();
    });
  }

  function requestFeedback() {
    setError(null);
    startGenerate(async () => {
      const result = await generateFeedbackAction(sessionId);
      if (result.ok) router.refresh();
      else setError(result.error);
    });
  }

  const ended = stage === "ENDED";
  const current = stageIndex(kind, stage);
  const stages = progressStages(kind);

  // -------------------------------------------------------------------------

  const stepper = (
    <ol
      className="relative -mx-1 flex items-start overflow-x-auto px-1 pb-1"
      aria-label="Interview progress"
    >
      {stages.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s} className="flex min-w-[5.5rem] flex-1 flex-col items-center gap-1.5">
            <div className="flex w-full items-center">
              <span
                className={cn(
                  "h-px flex-1",
                  i === 0 ? "bg-transparent" : i <= current ? "bg-ember-500/60" : "bg-border"
                )}
                aria-hidden="true"
              />
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-full border font-mono text-[0.65rem] font-semibold transition-colors",
                  state === "done" && "border-ember-500 bg-ember-500 text-primary-foreground",
                  state === "current" &&
                    "border-ember-500 bg-ember-500/15 text-ember-300 ring-ember-500/20 ring-4",
                  state === "todo" && "border-border text-muted-foreground/60"
                )}
                aria-hidden="true"
              >
                {state === "done" ? <Check className="size-3.5" /> : i + 1}
              </span>
              <span
                className={cn(
                  "h-px flex-1",
                  i === stages.length - 1
                    ? "bg-transparent"
                    : i < current
                      ? "bg-ember-500/60"
                      : "bg-border"
                )}
                aria-hidden="true"
              />
            </div>
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "px-1 text-center text-[0.68rem] leading-tight",
                state === "done" && "text-muted-foreground",
                state === "current" && "text-foreground font-medium",
                state === "todo" && "text-muted-foreground/60"
              )}
            >
              {/* State is in the text, not only in the colour. */}
              <span className="sr-only">
                {state === "done" ? "Completed: " : state === "current" ? "Current: " : "Upcoming: "}
              </span>
              {STAGE_LABELS[s]}
            </span>
          </li>
        );
      })}
    </ol>
  );

  const transcriptPane = (
    <div
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-4"
      data-testid="interview-transcript"
    >
      {turns.length === 0 && (
        <p className="text-muted-foreground py-6 text-sm">
          The interviewer will open shortly. Press “Begin interview” when you
          are ready.
        </p>
      )}

      {turns.map((t) =>
        t.role === "USER" ? (
          <div key={t.id} className="flex justify-end">
            <div className="bg-ember-500/10 border-ember-500/20 max-w-[85%] rounded-xl rounded-br-sm border px-3 py-2">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{t.content}</p>
            </div>
          </div>
        ) : (
          <div key={t.id}>
            <div className="flex items-center gap-1.5">
              <UserRound className="text-ember-400 size-3" aria-hidden="true" />
              <span className="text-muted-foreground text-[0.65rem] font-medium tracking-wider uppercase">
                Interviewer
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-relaxed whitespace-pre-wrap">
              {t.content}
              {t.streaming && (
                <span
                  className="bg-ember-400 ml-0.5 inline-block h-3.5 w-1.5 animate-pulse align-text-bottom"
                  aria-hidden="true"
                />
              )}
            </p>
          </div>
        )
      )}
      <div ref={endRef} />
    </div>
  );

  const composer = (
    <div className="border-border bg-card/40 space-y-2 border-t px-4 py-3">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {ended ? (
        <div className="space-y-2">
          <p className="text-muted-foreground text-sm">
            This interview is finished.
          </p>
          {!hasFeedback && (
            <Button size="sm" onClick={requestFeedback} disabled={generating}>
              {generating ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : null}
              Generate feedback
            </Button>
          )}
        </div>
      ) : turns.length === 0 ? (
        <Button onClick={() => void turn({})} disabled={streaming} size="sm">
          {streaming ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : null}
          Begin interview
        </Button>
      ) : (
        <>
          <div className="flex items-end gap-2">
            <Textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              aria-label="Your response"
              placeholder="Think out loud — the reasoning is what is being assessed…"
              className="max-h-40 resize-none text-sm"
            />
            {streaming ? (
              <Button
                size="icon"
                variant="outline"
                className="size-9 shrink-0"
                onClick={() => abortRef.current?.abort()}
                aria-label="Stop"
              >
                <Square className="size-3.5" />
              </Button>
            ) : (
              <Button
                size="icon"
                className="size-9 shrink-0"
                onClick={send}
                disabled={!draft.trim()}
                aria-label="Send response"
              >
                <Send className="size-3.5" />
              </Button>
            )}
          </div>

          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground/70 text-[0.65rem]">
              {STAGE_GUIDANCE[stage]}
            </p>
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-xs"
              onClick={finish}
              disabled={streaming}
            >
              End interview
            </Button>
          </div>
        </>
      )}
    </div>
  );

  const codePane = (
    <div className="flex h-full flex-col">
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={language}
          value={code}
          onChange={(next) => {
            codeDirty.current = true;
            setCode(next);
          }}
        />
      </div>
    </div>
  );

  /**
   * The brief, on screen rather than only in the transcript.
   *
   * Hidden until the interview has begun: the interviewer presents the
   * problem in their own words on the first turn, and pre-reading it
   * would make that turn pointless.
   */
  const brief = problemStatement.trim() && turns.length > 0 && (
    <details
      className="border-border bg-muted/20 group mt-4 rounded-lg border"
      data-testid="interview-brief"
      open
    >
      <summary className="flex cursor-pointer list-none items-center gap-1.5 px-3 py-2 text-xs font-medium">
        <FileText className="text-muted-foreground size-3.5" aria-hidden="true" />
        The brief
        <span className="text-muted-foreground/60 ml-auto text-[0.65rem] group-open:hidden">
          Show
        </span>
        <span className="text-muted-foreground/60 ml-auto hidden text-[0.65rem] group-open:inline">
          Hide
        </span>
      </summary>
      <p className="text-muted-foreground border-border border-t px-3 py-2.5 text-xs leading-relaxed whitespace-pre-wrap">
        {problemStatement}
      </p>
    </details>
  );

  const header = (
    <div className="bg-card border-border rounded-xl border p-4 sm:p-5">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{problemTitle}</h2>
        <Badge className="bg-ember-500/12 text-ember-300 border-ember-500/30 border text-[0.65rem]">
          {STAGE_LABELS[stage]}
        </Badge>
      </div>
      <div className="mt-4">{stepper}</div>
      {brief}
    </div>
  );

  const codeNote = (
    <span className="text-muted-foreground hidden truncate text-[0.68rem] sm:inline">
      Saved with the interview. The interviewer can see this.
    </span>
  );

  if (isMobile) {
    return (
      <div className="space-y-4" data-testid="interview-room">
        {header}
        <Tabs defaultValue="talk" className="bg-card border-border gap-0 overflow-hidden rounded-xl border">
          <TabsList className={UNDERLINE_TABS_LIST}>
            <UnderlineTab value="talk" icon={MessagesSquare}>
              Interview
            </UnderlineTab>
            <UnderlineTab value="code" icon={Code2} disabled={!codeIsRelevant(kind, stage)}>
              Code
            </UnderlineTab>
          </TabsList>
          <TabsContent value="talk" className="mt-0">
            <div className="flex h-[55dvh] flex-col">{transcriptPane}</div>
            {composer}
          </TabsContent>
          <TabsContent value="code" className="mt-0">
            <p className="text-muted-foreground border-border border-b px-4 py-2 text-[0.68rem]">
              Saved with the interview. The interviewer can see this.
            </p>
            <div className="h-[60dvh] overflow-hidden">{codePane}</div>
          </TabsContent>
        </Tabs>
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="interview-room">
      {header}
      <div
        className={cn(
          "grid gap-4",
          codeIsRelevant(kind, stage) ? "lg:grid-cols-2" : "lg:grid-cols-1"
        )}
      >
        <Pane label="Interview" icon={MessagesSquare} className="h-[62vh]" bodyClassName="flex flex-col">
          {transcriptPane}
          {composer}
        </Pane>
        {codeIsRelevant(kind, stage) && (
          <Pane label="Code" icon={Code2} actions={codeNote} className="h-[62vh]">
            {codePane}
          </Pane>
        )}
      </div>
    </div>
  );
}
