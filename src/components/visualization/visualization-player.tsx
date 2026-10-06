"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  RotateCcw,
  SlidersHorizontal,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { usePrefersReducedMotion } from "@/hooks/use-reduced-motion";
import { cn } from "@/lib/utils";
import type { ErasedVisualization } from "./types";

/**
 * Drives any visualization.
 *
 * Frames are computed once from the input, so stepping is an array index.
 * That makes reverse, scrubbing and pausing trivial, and means the
 * algorithm runs exactly once no matter how many times the reader replays
 * it.
 *
 * Accessibility: every control is a real button with a label, the whole
 * player is reachable by keyboard (arrow keys step, space toggles play when
 * the player has focus), the current step is announced through an aria-live
 * region, and autoplay is disabled when the OS asks for reduced motion.
 */

const SPEEDS = [
  { label: "0.5×", ms: 1400 },
  { label: "1×", ms: 750 },
  { label: "2×", ms: 380 },
  { label: "4×", ms: 180 },
];

type Props = {
  visualization: ErasedVisualization;
  /** Overrides the visualization's own default input. */
  initialInput?: unknown;
  /** Hides the input editor, for embeds inside a lesson. */
  allowEditing?: boolean;
  className?: string;
};

export function VisualizationPlayer({
  visualization,
  initialInput,
  allowEditing = true,
  className,
}: Props) {
  const reducedMotion = usePrefersReducedMotion();

  const [input, setInput] = useState<unknown>(
    initialInput ?? visualization.defaultInput
  );
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [speedIndex, setSpeedIndex] = useState(1);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [inputError, setInputError] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Recomputed only when the input changes: the algorithm runs once, not
  // once per frame.
  const frames = useMemo(() => {
    try {
      return visualization.buildFrames(input);
    } catch (error) {
      console.error(`Visualization "${visualization.key}" failed to build frames`, error);
      return [];
    }
  }, [visualization, input]);

  const total = frames.length;
  const current = frames[Math.min(index, Math.max(0, total - 1))];

  const stop = useCallback(() => setPlaying(false), []);

  const step = useCallback(
    (delta: number) => {
      stop();
      setIndex((previous) => Math.max(0, Math.min(total - 1, previous + delta)));
    },
    [stop, total]
  );

  const reset = useCallback(() => {
    stop();
    setIndex(0);
  }, [stop]);

  // Autoplay. Stops at the last frame rather than looping, so the reader is
  // left looking at the result instead of the beginning.
  useEffect(() => {
    if (!playing || total === 0) return;

    const timer = window.setInterval(() => {
      setIndex((previous) => {
        if (previous >= total - 1) {
          setPlaying(false);
          return previous;
        }
        return previous + 1;
      });
    }, SPEEDS[speedIndex]!.ms);

    return () => window.clearInterval(timer);
  }, [playing, speedIndex, total]);

  function applyDraft() {
    if (!visualization.parseInput) return;
    const parsed = visualization.parseInput(draft);
    if (!parsed.ok) {
      setInputError(parsed.error);
      return;
    }
    setInputError(null);
    setInput(parsed.value);
    setIndex(0);
    setPlaying(false);
    setEditing(false);
  }

  function openEditor() {
    setDraft(visualization.formatInput?.(input) ?? "");
    setInputError(null);
    setEditing((open) => !open);
  }

  function onKeyDown(event: React.KeyboardEvent) {
    if (event.key === "ArrowRight") {
      event.preventDefault();
      step(1);
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      step(-1);
    } else if (event.key === " " || event.key === "Spacebar") {
      // Do not hijack space from the input editor.
      if ((event.target as HTMLElement)?.tagName === "INPUT") return;
      event.preventDefault();
      setPlaying((value) => !value);
    }
  }

  if (total === 0 || !current) {
    return (
      <div className="border-border text-muted-foreground rounded-xl border border-dashed p-6 text-center text-sm">
        This visualization could not be built from its input.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      onKeyDown={onKeyDown}
      tabIndex={-1}
      className={cn(
        "border-border bg-card overflow-hidden rounded-xl border",
        className
      )}
    >
      <header className="border-border flex flex-wrap items-center justify-between gap-2 border-b px-4 py-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold">{visualization.title}</h3>
          <p className="text-muted-foreground mt-0.5 font-mono text-[0.68rem]">
            {visualization.complexity.time} time · {visualization.complexity.space} space
          </p>
        </div>

        {allowEditing && visualization.parseInput && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs"
            onClick={openEditor}
            aria-expanded={editing}
          >
            <SlidersHorizontal className="size-3.5" />
            Input
          </Button>
        )}
      </header>

      {editing && (
        <div className="border-border bg-muted/30 space-y-2 border-b px-4 py-3">
          <Label htmlFor={`${visualization.key}-input`} className="text-xs">
            {visualization.inputHint ?? "Input"}
          </Label>
          <div className="flex gap-2">
            <Input
              id={`${visualization.key}-input`}
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") applyDraft();
              }}
              className="h-8 font-mono text-xs"
              aria-invalid={inputError ? true : undefined}
              aria-describedby={inputError ? `${visualization.key}-error` : undefined}
            />
            <Button size="sm" className="h-8" onClick={applyDraft}>
              Run
            </Button>
          </div>
          {inputError && (
            <p
              id={`${visualization.key}-error`}
              role="alert"
              className="text-destructive text-xs"
            >
              {inputError}
            </p>
          )}
        </div>
      )}

      <div className="grid gap-4 p-3 sm:p-4 lg:grid-cols-[1fr_15rem]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="viz-canvas border-border flex min-h-[11rem] flex-1 flex-col justify-center overflow-x-auto rounded-lg border px-3 py-5 sm:px-5">
            {visualization.render(current)}
          </div>

          {/* The narration. aria-live so a screen reader follows along. */}
          <div className="bg-muted/40 border-border flex items-start gap-2.5 rounded-lg border px-3 py-2.5">
            <span className="bg-ember-500/15 text-ember-300 mt-px shrink-0 rounded px-1.5 py-0.5 font-mono text-[0.62rem] tabular-nums">
              Step {index + 1}
            </span>
            <p
              aria-live="polite"
              className="text-foreground/85 min-h-[2.5rem] text-sm leading-relaxed"
            >
              {current.operation}
            </p>
          </div>
        </div>

        {/* min-w-0 lets this column shrink inside the grid; without it a
            long pseudocode line forces the whole page wider. */}
        <aside className="min-w-0 space-y-3">
          <div className="border-border rounded-lg border p-3">
            <p className="text-muted-foreground mb-1.5 text-[0.68rem] font-medium tracking-wider uppercase">
              Variables
            </p>
            <dl className="space-y-1">
              {Object.entries(current.variables).map(([name, value]) => (
                <div key={name} className="flex items-baseline justify-between gap-2">
                  <dt className="text-muted-foreground font-mono text-[0.7rem]">
                    {name}
                  </dt>
                  <dd className="text-foreground truncate font-mono text-[0.7rem] tabular-nums">
                    {String(value)}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="border-border rounded-lg border p-3">
            <p className="text-muted-foreground mb-1.5 text-[0.68rem] font-medium tracking-wider uppercase">
              Pseudocode
            </p>
            {/* Scrolls horizontally rather than widening the page:
                pseudocode must keep its indentation, so the lines cannot
                wrap. */}
            <ol className="max-w-full space-y-0.5 overflow-x-auto">
              {visualization.pseudocode.map((line, lineIndex) => (
                <li
                  key={lineIndex}
                  className={cn(
                    "w-max min-w-full rounded px-1.5 py-0.5 font-mono text-[0.68rem] leading-snug whitespace-pre",
                    lineIndex === current.line
                      ? "bg-ember-500/15 text-ember-200"
                      : "text-muted-foreground/70"
                  )}
                >
                  {line}
                </li>
              ))}
            </ol>
          </div>
        </aside>
      </div>

      <footer className="border-border bg-muted/20 flex flex-wrap items-center gap-2 border-t px-3 py-2.5 sm:px-4">
        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => step(-1)}
          disabled={index === 0}
          aria-label="Previous step"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <Button
          size="sm"
          className="h-8 min-w-[5.5rem] rounded-full"
          onClick={() => {
            if (index >= total - 1) setIndex(0);
            setPlaying((value) => !value);
          }}
          aria-label={playing ? "Pause" : "Play"}
        >
          {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
          {playing ? "Pause" : "Play"}
        </Button>

        <Button
          size="sm"
          variant="outline"
          className="h-8 w-8 p-0"
          onClick={() => step(1)}
          disabled={index >= total - 1}
          aria-label="Next step"
        >
          <ChevronRight className="size-4" />
        </Button>

        <Button
          size="sm"
          variant="ghost"
          className="h-8 w-8 p-0"
          onClick={reset}
          aria-label="Reset"
        >
          <RotateCcw className="size-4" />
        </Button>

        <div className="mx-1 min-w-24 flex-1">
          <Slider
            value={[index]}
            min={0}
            max={Math.max(0, total - 1)}
            step={1}
            onValueChange={([value]) => {
              stop();
              setIndex(value ?? 0);
            }}
            aria-label="Step"
          />
        </div>

        <span className="text-muted-foreground shrink-0 font-mono text-[0.68rem] tabular-nums">
          {index + 1}/{total}
        </span>

        <div
          className="bg-muted/60 flex shrink-0 gap-0.5 rounded-md p-0.5"
          role="group"
          aria-label="Playback speed"
        >
          {SPEEDS.map((speed, speedIdx) => (
            <button
              key={speed.label}
              type="button"
              onClick={() => setSpeedIndex(speedIdx)}
              aria-pressed={speedIdx === speedIndex}
              className={cn(
                "rounded px-1.5 py-1 font-mono text-[0.65rem] transition-colors",
                speedIdx === speedIndex
                  ? "bg-card text-ember-300 shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {speed.label}
            </button>
          ))}
        </div>
      </footer>

      {reducedMotion && (
        <p className="text-muted-foreground/70 border-border border-t px-4 py-2 text-[0.68rem]">
          Reduced motion is on, so playback does not start automatically. Step
          through with the arrows or the slider.
        </p>
      )}
    </div>
  );
}
