"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Pause,
  Play,
  Radio,
  XCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import type { Language } from "@/generated/prisma/enums";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { normaliseOutput } from "@/lib/code-execution/types";
import { LANGUAGE_LABEL, type Signature } from "@/lib/code-execution/signature";
import { isTraceRuntimeLoaded, traceRun, warmTraceRuntime } from "@/lib/trace/runner";
import { isTraceable, type TraceOutcome } from "@/lib/trace/types";
import { inputStep, parseWireInput } from "@/lib/trace/wire";
import { cn } from "@/lib/utils";
import { StateView } from "./state-view";

/**
 * The live visualizer: the learner's code, run on a sample, drawn step by
 * step.
 *
 * Two ways in:
 *   - `runToken` changes (the learner pressed Run or Visualize): trace, then
 *     play from the first step.
 *   - Live mode: every pause in typing re-traces quietly and jumps to the
 *     final state, so the picture follows the code as it is written. A
 *     half-typed line that does not parse shows its error but keeps the last
 *     good picture, because flashing to empty on every keystroke is noise.
 *
 * Before anything runs, the selected sample's input is drawn on its own —
 * the picture the problem is about.
 */

const SPEEDS = [
  { label: "0.5×", ms: 1100 },
  { label: "1×", ms: 600 },
  { label: "2×", ms: 300 },
  { label: "4×", ms: 120 },
];

const LIVE_DEBOUNCE_MS = 650;
const CUSTOM = "custom";

export type VisualSample = { input: string; expected: string };

type Props = {
  signature: Signature;
  samples: VisualSample[];
  language: Language;
  code: string;
  /** Incremented by the workspace to request a traced, auto-playing run. */
  runToken: number;
  /** Reports the line to highlight in the editor, or null to clear it. */
  onLine?: (line: number | null, kind: "step" | "error") => void;
  className?: string;
};

export function LiveVisualizer({
  signature,
  samples,
  language,
  code,
  runToken,
  onLine,
  className,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();
  const traceable = isTraceable(language);

  const [sample, setSample] = useState<string>(samples.length ? "0" : CUSTOM);
  const [custom, setCustom] = useState(samples[0]?.input ?? "");
  const [live, setLive] = useState(true);
  const [outcome, setOutcome] = useState<TraceOutcome | null>(null);
  const [staleError, setStaleError] = useState<{ error: string; line?: number } | null>(
    null
  );
  const [running, setRunning] = useState(false);
  const [booting, setBooting] = useState(false);
  const [index, setIndex] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);

  const requestSeq = useRef(0);
  const lastTraced = useRef<string | null>(null);

  const rawInput = sample === CUSTOM ? custom : (samples[Number(sample)]?.input ?? "");
  const expected =
    sample === CUSTOM ? null : (samples[Number(sample)]?.expected ?? null);
  const parsed = useMemo(
    () => parseWireInput(signature, rawInput),
    [signature, rawInput]
  );

  const initial = useMemo(
    () => (parsed.ok ? inputStep(signature, parsed.args) : null),
    [parsed, signature]
  );

  const steps = outcome?.steps ?? [];
  const current = index >= 0 ? steps[index] : null;

  // Start downloading Python as soon as it is the selected language.
  useEffect(() => {
    if (traceable) warmTraceRuntime(language);
  }, [language, traceable]);

  const execute = useCallback(
    async (mode: "play" | "live") => {
      if (!traceable || !parsed.ok) return;
      // A live re-trace of code and input that were just traced adds
      // nothing, and would replace an explicit run that is mid-playback.
      const key = JSON.stringify([language, code, rawInput]);
      if (mode === "live" && key === lastTraced.current) return;
      lastTraced.current = key;
      const seq = ++requestSeq.current;
      setRunning(true);
      if (language === "PYTHON" && !isTraceRuntimeLoaded("PYTHON")) setBooting(true);
      const result = await traceRun({ language, code, signature, args: parsed.args });
      if (seq !== requestSeq.current) return;
      setRunning(false);
      setBooting(false);

      if (mode === "live" && !result.ok && result.steps.length === 0) {
        // Keep the last good picture while the learner is mid-edit.
        setStaleError({ error: result.error, line: result.line });
        onLine?.(result.line ?? null, "error");
        return;
      }
      setStaleError(null);
      setOutcome(result);
      if (result.steps.length === 0) {
        setIndex(-1);
        setPlaying(false);
        onLine?.(!result.ok ? (result.line ?? null) : null, "error");
        return;
      }
      if (mode === "play" && !reducedMotion) {
        setIndex(0);
        setPlaying(true);
      } else {
        setIndex(result.steps.length - 1);
        setPlaying(false);
      }
    },
    [traceable, parsed, language, code, rawInput, signature, onLine, reducedMotion]
  );

  // Explicit runs.
  const lastToken = useRef(runToken);
  useEffect(() => {
    if (runToken === lastToken.current) return;
    lastToken.current = runToken;
    void execute("play");
  }, [runToken, execute]);

  // Live re-trace after a pause in typing, or when the input changes.
  //
  // Keyed on the things a learner actually changes, not on `execute`
  // itself: that callback's identity also moves with incidental state, and
  // re-tracing on it would quietly replace an auto-playing run with a
  // jump-to-the-end one.
  const executeRef = useRef(execute);
  useEffect(() => {
    executeRef.current = execute;
  });
  useEffect(() => {
    if (!live || !traceable) return;
    const timer = setTimeout(() => void executeRef.current("live"), LIVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [live, traceable, code, rawInput, language]);

  // A different language invalidates the trace entirely.
  const [tracedLanguage, setTracedLanguage] = useState(language);
  if (tracedLanguage !== language) {
    setTracedLanguage(language);
    setOutcome(null);
    setStaleError(null);
    setIndex(-1);
    setPlaying(false);
  }

  // Playback.
  // Playing past the last step is simply "not playing", derived rather than
  // stored, so reaching the end needs no state update from an effect.
  const atEnd = index >= steps.length - 1;
  const isPlaying = playing && !atEnd;
  useEffect(() => {
    if (!isPlaying) return;
    const timer = setTimeout(() => setIndex((i) => i + 1), SPEEDS[speed]!.ms);
    return () => clearTimeout(timer);
  }, [isPlaying, index, speed]);

  // Mirror the current line into the editor.
  useEffect(() => {
    if (staleError) return;
    if (current) onLine?.(current.line, "step");
    else if (outcome && !outcome.ok) onLine?.(outcome.line ?? null, "error");
    else onLine?.(null, "step");
  }, [current, outcome, staleError, onLine]);

  const go = (next: number) => {
    setPlaying(false);
    setIndex(Math.max(0, Math.min(steps.length - 1, next)));
  };

  function onKeyDown(event: React.KeyboardEvent) {
    if (steps.length === 0) return;
    if (event.target instanceof HTMLTextAreaElement) return;
    if (event.key === "ArrowRight") {
      event.preventDefault();
      go(index + 1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      go(index - 1);
    } else if (event.key === " " && event.target === event.currentTarget) {
      event.preventDefault();
      if (isPlaying) setPlaying(false);
      else {
        if (atEnd) setIndex(0);
        setPlaying(true);
      }
    }
  }

  const output = outcome?.ok ? outcome.output : null;
  const verdict =
    output !== null && expected !== null
      ? normaliseOutput(output) === normaliseOutput(expected)
      : null;

  return (
    <div
      className={cn("flex h-full min-h-0 flex-col", className)}
      onKeyDown={onKeyDown}
      tabIndex={-1}
    >
      {/* Input selection */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2">
        <Select value={sample} onValueChange={setSample}>
          <SelectTrigger size="sm" className="h-8 w-40" aria-label="Input to visualize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {samples.map((_, i) => (
              <SelectItem key={i} value={String(i)}>
                Example {i + 1}
              </SelectItem>
            ))}
            <SelectItem value={CUSTOM}>Custom input</SelectItem>
          </SelectContent>
        </Select>

        {traceable && (
          <div className="ml-auto flex items-center gap-2">
            <Switch id="live-trace" checked={live} onCheckedChange={setLive} />
            <Label
              htmlFor="live-trace"
              className="flex items-center gap-1 text-xs font-normal"
            >
              <Radio
                className={cn(
                  "size-3",
                  live ? "text-ember-400" : "text-muted-foreground"
                )}
                aria-hidden="true"
              />
              Live
            </Label>
          </div>
        )}
      </div>

      {sample === CUSTOM && (
        <div className="space-y-1 border-b border-border px-3 py-2">
          <Textarea
            value={custom}
            onChange={(event) => setCustom(event.target.value)}
            rows={Math.min(6, Math.max(2, custom.split("\n").length))}
            className="font-mono text-xs"
            aria-label="Custom input"
            spellCheck={false}
          />
          <p className="text-[0.65rem] text-muted-foreground">
            One line per argument:{" "}
            {signature.paramNames
              .map((n, i) => `${n} (${signature.params[i]})`)
              .join(", ")}
            . Lists are space-separated.
          </p>
          {!parsed.ok && (
            <p className="text-[0.7rem] text-destructive">{parsed.error}</p>
          )}
        </div>
      )}

      {/* Canvas */}
      <div
        className="viz-canvas min-h-0 flex-1 overflow-y-auto px-4 py-4"
        aria-live="polite"
      >
        {!traceable && (
          <p className="mb-4 rounded-lg border border-border bg-muted/20 px-3 py-2 text-xs leading-relaxed text-muted-foreground">
            Step-by-step tracing runs Python and JavaScript right in your browser.
            Switch from {LANGUAGE_LABEL[language]} to one of them to watch your code
            move through this input.
          </p>
        )}

        {booting && (
          <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            Loading Python in your browser — the first run downloads the runtime once.
          </p>
        )}

        {staleError && (
          <ErrorBanner error={staleError.error} line={staleError.line} subtle />
        )}
        {outcome && !outcome.ok && !staleError && (
          <ErrorBanner error={outcome.error} line={outcome.line} />
        )}

        {current ? (
          <>
            <StepCaption step={current} index={index} total={steps.length} />
            <StateView
              step={current}
              previous={index > 0 ? steps[index - 1] : initial}
              paramNames={signature.paramNames}
              className={cn(staleError && "opacity-60")}
            />
          </>
        ) : initial ? (
          <>
            <p className="mb-3 text-xs text-muted-foreground">
              <span className="font-medium text-foreground">Input.</span>{" "}
              {traceable
                ? running
                  ? "Running your code…"
                  : "Run your code to watch it work on this input, one line at a time."
                : "This is the input your function receives."}
            </p>
            <StateView step={initial} paramNames={signature.paramNames} />
          </>
        ) : (
          <p className="text-xs text-muted-foreground">
            Enter a valid input to see it drawn.
          </p>
        )}
      </div>

      {/* Output */}
      {outcome && (output !== null || outcome.truncated || outcome.stdout) && (
        <div className="space-y-1 border-t border-border px-3 py-2 text-xs">
          {output !== null && (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono">
              <span>
                <span className="font-sans text-muted-foreground">Output </span>
                {output.split("\n").join(" ⏎ ") || "(empty)"}
              </span>
              {expected !== null && (
                <span>
                  <span className="font-sans text-muted-foreground">Expected </span>
                  {expected.split("\n").join(" ⏎ ")}
                </span>
              )}
              {verdict !== null && (
                <span
                  className={cn(
                    "ml-auto flex items-center gap-1 font-sans font-medium",
                    verdict ? "text-success" : "text-difficulty-hard"
                  )}
                >
                  {verdict ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    <XCircle className="size-3.5" />
                  )}
                  {verdict ? "Matches" : "Differs"}
                </span>
              )}
            </div>
          )}
          {outcome.truncated && (
            <p className="text-muted-foreground">
              Showing the first {steps.length.toLocaleString()} steps; the run continued
              past them.
            </p>
          )}
          {outcome.stdout && (
            <details>
              <summary className="cursor-pointer text-muted-foreground">
                Printed output
              </summary>
              <pre className="mt-1 max-h-24 overflow-auto rounded bg-muted/30 p-2 font-mono text-[0.68rem] whitespace-pre-wrap">
                {outcome.stdout}
              </pre>
            </details>
          )}
        </div>
      )}

      {/* Transport */}
      <div className="flex items-center gap-1 border-t border-border px-2 py-1.5">
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => go(0)}
          disabled={steps.length === 0}
          aria-label="First step"
        >
          <ChevronFirst className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => go(index - 1)}
          disabled={index <= 0}
          aria-label="Previous step"
        >
          <ChevronLeft className="size-4" />
        </Button>
        <Button
          size="icon"
          className="size-8"
          onClick={() => {
            if (steps.length === 0) {
              void execute("play");
              return;
            }
            if (isPlaying) {
              setPlaying(false);
              return;
            }
            if (atEnd) setIndex(0);
            setPlaying(true);
          }}
          disabled={!traceable || running || !parsed.ok}
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {running ? (
            <Loader2 className="size-4 animate-spin" />
          ) : isPlaying ? (
            <Pause className="size-4" />
          ) : (
            <Play className="size-4" />
          )}
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => go(index + 1)}
          disabled={index >= steps.length - 1}
          aria-label="Next step"
        >
          <ChevronRight className="size-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="size-8"
          onClick={() => go(steps.length - 1)}
          disabled={steps.length === 0}
          aria-label="Last step"
        >
          <ChevronLast className="size-4" />
        </Button>

        <Slider
          className="mx-2 flex-1"
          min={0}
          max={Math.max(0, steps.length - 1)}
          step={1}
          value={[Math.max(0, index)]}
          onValueChange={([value]) => go(value ?? 0)}
          disabled={steps.length < 2}
          aria-label="Scrub through steps"
        />

        <span
          data-testid="trace-counter"
          className="w-16 text-right font-mono text-[0.65rem] text-muted-foreground tabular-nums"
        >
          {steps.length ? `${index + 1}/${steps.length}` : "—"}
        </span>

        <Select
          value={String(speed)}
          onValueChange={(value) => setSpeed(Number(value))}
        >
          <SelectTrigger
            size="sm"
            className="h-8 w-[4.5rem]"
            aria-label="Playback speed"
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SPEEDS.map((s, i) => (
              <SelectItem key={s.label} value={String(i)}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}

function StepCaption({
  step,
  index,
  total,
}: {
  step: NonNullable<TraceOutcome["steps"][number]>;
  index: number;
  total: number;
}) {
  return (
    <p className="mb-3 flex items-center gap-2 text-xs text-muted-foreground">
      <span className="rounded bg-ember-500/15 px-1.5 py-0.5 font-mono text-[0.68rem] text-ember-200">
        line {step.line}
      </span>
      <span>
        {step.event === "return" ? "Returning" : `Step ${index + 1} of ${total}`}
        {step.stack.length > 0 && (
          <>
            {" "}
            in{" "}
            <span className="font-mono text-foreground">{step.stack.at(-1)!.func}</span>
          </>
        )}
      </span>
    </p>
  );
}

function ErrorBanner({
  error,
  line,
  subtle = false,
}: {
  error: string;
  line?: number;
  subtle?: boolean;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "mb-3 flex items-start gap-2 rounded-lg border px-3 py-2 text-xs",
        subtle
          ? "border-warning/30 bg-warning/8 text-warning"
          : "border-destructive/40 bg-destructive/10 text-destructive"
      )}
    >
      <AlertTriangle className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
      <div className="min-w-0">
        <p className="font-mono break-words">{error}</p>
        {line ? (
          <p className="mt-0.5 opacity-80">
            Line {line}
            {subtle ? " · showing the last run that worked" : ""}
          </p>
        ) : null}
      </div>
    </div>
  );
}
