"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { Loader2, Send, Square, UserRound } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  endInterviewAction,
  generateFeedbackAction,
  saveInterviewCodeAction,
} from "@/app/(shell)/interviews/actions";
import { useIsMobile } from "@/hooks/use-mobile";
import {
  codeIsRelevant,
  PROGRESS_STAGES,
  STAGE_GUIDANCE,
  STAGE_LABELS,
  stageIndex,
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
  initialStage,
  initialTranscript,
  initialCode,
  language,
  problemTitle,
  hasFeedback,
}: {
  sessionId: string;
  initialStage: InterviewStage;
  initialTranscript: { id: string; role: "USER" | "ASSISTANT"; content: string }[];
  initialCode: string;
  language: Language;
  problemTitle: string;
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
            code: codeIsRelevant(stage) ? code : undefined,
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
    [sessionId, stage, code, router]
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
  const current = stageIndex(stage);

  // -------------------------------------------------------------------------

  const stepper = (
    <ol className="flex flex-wrap items-center gap-1" aria-label="Interview progress">
      {PROGRESS_STAGES.map((s, i) => {
        const state = i < current ? "done" : i === current ? "current" : "todo";
        return (
          <li key={s} className="flex items-center gap-1">
            <span
              aria-current={state === "current" ? "step" : undefined}
              className={cn(
                "rounded-full border px-2 py-0.5 text-[0.65rem] transition-colors",
                state === "done" && "border-success/35 bg-success/10 text-success",
                state === "current" && "border-ember-500/50 bg-ember-500/12 text-ember-300",
                state === "todo" && "border-border text-muted-foreground/60"
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
      className="min-h-0 flex-1 space-y-4 overflow-y-auto px-1 py-2"
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
            <div className="bg-muted max-w-[85%] rounded-lg rounded-br-sm px-3 py-2">
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
    <div className="border-border space-y-2 border-t px-1 py-3">
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
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <span className="text-muted-foreground text-[0.65rem]">
          Saved with the interview. The interviewer can see this.
        </span>
      </div>
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

  const header = (
    <div className="border-border border-b pb-3">
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-sm font-semibold">{problemTitle}</h2>
        <Badge variant="secondary" className="text-[0.65rem]">
          {STAGE_LABELS[stage]}
        </Badge>
      </div>
      <div className="mt-2">{stepper}</div>
    </div>
  );

  if (isMobile) {
    return (
      <div className="space-y-3" data-testid="interview-room">
        {header}
        <Tabs defaultValue="talk">
          <TabsList className="w-full">
            <TabsTrigger value="talk" className="flex-1">
              Interview
            </TabsTrigger>
            <TabsTrigger value="code" className="flex-1" disabled={!codeIsRelevant(stage)}>
              Code
            </TabsTrigger>
          </TabsList>
          <TabsContent value="talk" className="mt-3">
            <div className="flex h-[55dvh] flex-col">{transcriptPane}</div>
            {composer}
          </TabsContent>
          <TabsContent value="code" className="mt-3">
            <div className="border-border h-[60dvh] overflow-hidden rounded-lg border">
              {codePane}
            </div>
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
          "grid gap-5",
          codeIsRelevant(stage) ? "lg:grid-cols-2" : "lg:grid-cols-1"
        )}
      >
        <div className="flex h-[60vh] min-w-0 flex-col">
          {transcriptPane}
          {composer}
        </div>
        {codeIsRelevant(stage) && (
          <div className="border-border h-[60vh] min-w-0 overflow-hidden rounded-lg border">
            {codePane}
          </div>
        )}
      </div>
    </div>
  );
}
