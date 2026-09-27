"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Hero visualization: a variable-size sliding window finding the longest
 * run of distinct values.
 *
 * This is a real trace, not a decorative loop - the frames below are produced
 * by actually running the algorithm over the array, so what the hero shows is
 * what the product teaches. Same engine idea as the /visualize pages: compute
 * a frame list up front, then step through it.
 *
 * It pauses when scrolled out of view and freezes on the best answer when the
 * user prefers reduced motion.
 */

const DATA = [4, 8, 2, 9, 1, 7, 2, 5, 8, 3];
const STEP_MS = 620;

type Frame = {
  left: number;
  right: number;
  /** Indices currently inside the window. */
  window: number[];
  bestLeft: number;
  bestRight: number;
  note: string;
  /** Set when this frame shrank the window after hitting a duplicate. */
  shrinking: boolean;
};

/** Runs the algorithm, recording one frame per meaningful step. */
function buildFrames(values: number[]): Frame[] {
  const frames: Frame[] = [];
  const seen = new Set<number>();
  let left = 0;
  let bestLeft = 0;
  let bestRight = 0;

  for (let right = 0; right < values.length; right += 1) {
    while (seen.has(values[right]!)) {
      seen.delete(values[left]!);
      left += 1;
      frames.push({
        left,
        right,
        window: range(left, right - 1),
        bestLeft,
        bestRight,
        note: `Duplicate ${values[right]} — shrink from the left`,
        shrinking: true,
      });
    }

    seen.add(values[right]!);

    if (right - left > bestRight - bestLeft) {
      bestLeft = left;
      bestRight = right;
    }

    frames.push({
      left,
      right,
      window: range(left, right),
      bestLeft,
      bestRight,
      note: `Window ${right - left + 1} — all distinct`,
      shrinking: false,
    });
  }

  frames.push({
    left: bestLeft,
    right: bestRight,
    window: range(bestLeft, bestRight),
    bestLeft,
    bestRight,
    note: `Longest distinct run: ${bestRight - bestLeft + 1}`,
    shrinking: false,
  });

  return frames;
}

function range(from: number, to: number): number[] {
  const out: number[] = [];
  for (let i = from; i <= to; i += 1) out.push(i);
  return out;
}

export function HeroVisual() {
  const frames = useMemo(() => buildFrames(DATA), []);
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Respect the OS motion setting: show the solved state and never animate.
  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    function apply() {
      if (query.matches) {
        setRunning(false);
        setIndex(frames.length - 1);
      }
    }
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [frames.length]);

  // Do not burn a timer on a hero that has scrolled away.
  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
        setRunning(entry.isIntersecting);
      },
      { threshold: 0.2 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => {
      setIndex((current) => (current + 1) % frames.length);
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [running, frames.length]);

  const frame = frames[index]!;
  const inWindow = new Set(frame.window);

  return (
    <div
      ref={containerRef}
      className="border-border bg-card/70 surface-edge rounded-xl border p-5 backdrop-blur-sm sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-muted-foreground font-mono text-[0.7rem] tracking-wider uppercase">
          Sliding window
        </p>
        <p className="text-muted-foreground font-mono text-[0.7rem] tabular-nums">
          step {index + 1}/{frames.length}
        </p>
      </div>

      {/* The array */}
      <div
        className="mt-5 flex items-end gap-1.5 sm:gap-2"
        role="img"
        aria-label={`Sliding window over the array. ${frame.note}.`}
      >
        {DATA.map((value, i) => {
          const active = inWindow.has(i);
          const isBest =
            !active && i >= frame.bestLeft && i <= frame.bestRight;

          return (
            <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
              <div
                className={cn(
                  "flex h-11 w-full items-center justify-center rounded-md border font-mono text-sm transition-all duration-300 sm:h-12",
                  active
                    ? frame.shrinking
                      ? "border-difficulty-hard/50 bg-difficulty-hard/12 text-difficulty-hard"
                      : "border-ember-500/55 bg-ember-500/12 text-ember-300 -translate-y-0.5"
                    : isBest
                      ? "border-success/35 bg-success/8 text-success/90"
                      : "border-border bg-muted/30 text-muted-foreground"
                )}
              >
                {value}
              </div>

              {/* Pointer rail — fixed height so nothing reflows as it moves. */}
              <div className="mt-1.5 flex h-4 items-start justify-center gap-0.5 text-[0.6rem] leading-none">
                {i === frame.left && (
                  <span className="text-ember-400 font-mono">L</span>
                )}
                {i === frame.right && (
                  <span className="text-ember-400 font-mono">R</span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Commentary. Fixed height to keep the card from jumping. */}
      <p className="text-muted-foreground mt-3 flex h-5 items-center font-mono text-xs">
        <span
          className={cn(
            "mr-2 inline-block size-1.5 shrink-0 rounded-full",
            frame.shrinking ? "bg-difficulty-hard" : "bg-ember-500"
          )}
        />
        {frame.note}
      </p>
    </div>
  );
}
