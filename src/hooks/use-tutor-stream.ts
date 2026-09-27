"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type {
  TutorAnchor,
  TutorCodeState,
  TutorMessageView,
  TutorRequestType,
  TutorStreamEvent,
} from "@/lib/tutor/types";

/**
 * Client state for one tutor thread.
 *
 * The three things this exists to get right, all of which are easy to get
 * wrong inline in a component:
 *
 *  1. **No double sends.** A second request while one is in flight is
 *     dropped rather than queued. Double-clicking "Give me a hint" must not
 *     burn two rungs of the escalation ladder.
 *  2. **One conversation.** The id arrives in the first `meta` event and is
 *     held in a ref as well as state, because the next send can happen
 *     before React has re-rendered — and reading a stale id would silently
 *     start a second thread.
 *  3. **Cancellation actually cancels.** The abort controller is wired to
 *     the fetch, which aborts the request, which aborts the provider call
 *     server-side. Stopping is not just hiding the output.
 */

export type TutorTurn = TutorMessageView & { streaming?: boolean };

type SendInput = {
  requestType: TutorRequestType;
  /** Shown as the learner's turn. */
  utterance: string;
  /** Sent to the model. Defaults to `utterance`. */
  message?: string;
};

export type UseTutorStream = {
  turns: TutorTurn[];
  streaming: boolean;
  error: string | null;
  /** True when the last failure is worth offering a retry for. */
  retryable: boolean;
  conversationId: string | null;
  send: (input: SendInput) => void;
  retry: () => void;
  cancel: () => void;
  reset: () => void;
};

export function useTutorStream(options: {
  anchor: TutorAnchor;
  /** Read at send time, so the tutor sees the editor as it is right now. */
  getCode?: () => TutorCodeState | undefined;
  initialConversationId?: string | null;
  initialTurns?: TutorMessageView[];
}): UseTutorStream {
  const { anchor, getCode } = options;

  const [turns, setTurns] = useState<TutorTurn[]>(options.initialTurns ?? []);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryable, setRetryable] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(
    options.initialConversationId ?? null
  );

  const conversationRef = useRef<string | null>(options.initialConversationId ?? null);
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const lastInputRef = useRef<SendInput | null>(null);

  // A navigation mid-stream must not leave the request running.
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  const run = useCallback(
    async (input: SendInput) => {
      if (inFlightRef.current) return;
      inFlightRef.current = true;
      lastInputRef.current = input;

      setError(null);
      setRetryable(false);
      setStreaming(true);

      const localId = `local-${Date.now()}`;
      setTurns((previous) => [
        ...previous,
        {
          id: localId,
          role: "USER",
          content: input.utterance,
          requestType: input.requestType,
          hintLevel: 0,
          createdAt: new Date().toISOString(),
        },
      ]);

      const controller = new AbortController();
      abortRef.current = controller;

      const assistantId = `${localId}-a`;
      let opened = false;

      /** Appends the assistant turn lazily, so a failure leaves no empty bubble. */
      function ensureAssistantTurn() {
        if (opened) return;
        opened = true;
        setTurns((previous) => [
          ...previous,
          {
            id: assistantId,
            role: "ASSISTANT",
            content: "",
            requestType: input.requestType,
            hintLevel: 0,
            createdAt: new Date().toISOString(),
            streaming: true,
          },
        ]);
      }

      try {
        const response = await fetch("/api/tutor/stream", {
          method: "POST",
          headers: { "content-type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            conversationId: conversationRef.current ?? undefined,
            requestType: input.requestType,
            anchor,
            message: input.message ?? input.utterance,
            code: getCode?.(),
          }),
        });

        if (!response.ok || !response.body) {
          const detail = (await response.json().catch(() => null)) as {
            error?: string;
          } | null;
          setError(detail?.error ?? "The tutor could not be reached.");
          // 429 and 5xx are worth another go; 401/403 are not.
          setRetryable(response.status === 429 || response.status >= 500);
          setTurns((previous) => previous.filter((turn) => turn.id !== localId));
          return;
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });

          // Server-sent events: one record per blank line. A chunk can
          // split a record, so the tail is kept for the next read.
          const records = buffer.split("\n\n");
          buffer = records.pop() ?? "";

          for (const record of records) {
            const line = record.split("\n").find((l) => l.startsWith("data:"));
            if (!line) continue;

            let event: TutorStreamEvent;
            try {
              event = JSON.parse(line.slice(5).trim()) as TutorStreamEvent;
            } catch {
              continue;
            }

            if (event.type === "meta") {
              conversationRef.current = event.conversationId;
              setConversationId(event.conversationId);
            } else if (event.type === "text") {
              ensureAssistantTurn();
              setTurns((previous) =>
                previous.map((turn) =>
                  turn.id === assistantId
                    ? { ...turn, content: turn.content + event.text }
                    : turn
                )
              );
            } else if (event.type === "done") {
              setTurns((previous) =>
                previous.map((turn) =>
                  turn.id === assistantId
                    ? { ...turn, streaming: false, hintLevel: event.hintLevel }
                    : turn
                )
              );
            } else if (event.type === "error") {
              setError(event.message);
              setRetryable(event.retryable);
            }
          }
        }
      } catch (caught) {
        // An abort is a deliberate stop, not a failure to report.
        if (!(caught instanceof DOMException && caught.name === "AbortError")) {
          setError("The connection to the tutor dropped.");
          setRetryable(true);
        }
      } finally {
        setTurns((previous) =>
          previous.map((turn) =>
            turn.id === assistantId ? { ...turn, streaming: false } : turn
          )
        );
        // Drop an assistant bubble that never received a token.
        setTurns((previous) =>
          previous.filter(
            (turn) => !(turn.id === assistantId && turn.content.trim() === "")
          )
        );
        setStreaming(false);
        inFlightRef.current = false;
        abortRef.current = null;
      }
    },
    [anchor, getCode]
  );

  const send = useCallback((input: SendInput) => void run(input), [run]);

  const retry = useCallback(() => {
    const last = lastInputRef.current;
    if (!last || inFlightRef.current) return;
    // The failed turn is removed first so a retry does not stack two
    // identical questions in the transcript.
    setTurns((previous) => {
      const lastUser = [...previous]
        .reverse()
        .find((turn) => turn.role === "USER");
      return lastUser ? previous.filter((turn) => turn.id !== lastUser.id) : previous;
    });
    void run(last);
  }, [run]);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    abortRef.current?.abort();
    conversationRef.current = null;
    setConversationId(null);
    setTurns([]);
    setError(null);
    setRetryable(false);
  }, []);

  return {
    turns,
    streaming,
    error,
    retryable,
    conversationId,
    send,
    retry,
    cancel,
    reset,
  };
}
