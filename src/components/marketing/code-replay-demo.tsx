"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * A miniature of the live visualizer for the landing page: a short Python
 * function on the left, its array on the right, replayed one line at a time.
 *
 * The frames are produced by actually stepping the function below over the
 * input, so the highlighted line, the pointer positions and the flashed cells
 * always agree. Same rules as the hero visual: pauses off screen, and shows
 * the finished state without motion when the user prefers reduced motion.
 */

const CODE = [
  "def reverse(nums):",
  "    left, right = 0, len(nums) - 1",
  "    while left < right:",
  "        nums[left], nums[right] = nums[right], nums[left]",
  "        left += 1",
  "        right -= 1",
  "    return nums",
];

const INPUT = [3, 8, 1, 6, 4, 9];
const STEP_MS = 900;

type Frame = {
  /** 1-based line just executed. */
  line: number;
  nums: number[];
  left: number | null;
  right: number | null;
  /** Indices written on this line — these flash. */
  changed: number[];
};

function buildFrames(input: number[]): Frame[] {
  const frames: Frame[] = [];
  const nums = [...input];
  const snap = (
    line: number,
    left: number | null,
    right: number | null,
    changed: number[] = []
  ) => frames.push({ line, nums: [...nums], left, right, changed });

  snap(1, null, null);
  let left = 0;
  let right = nums.length - 1;
  snap(2, left, right);
  while (true) {
    snap(3, left, right);
    if (!(left < right)) break;
    [nums[left], nums[right]] = [nums[right]!, nums[left]!];
    snap(4, left, right, [left, right]);
    left += 1;
    snap(5, left, right);
    right -= 1;
    snap(6, left, right);
  }
  snap(7, left, right);
  return frames;
}

export function CodeReplayDemo({ className }: { className?: string }) {
  const frames = useMemo(() => buildFrames(INPUT), []);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    function apply() {
      if (query.matches) {
        setPlaying(false);
        setIndex(frames.length - 1);
      }
    }
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [frames.length]);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setVisible(Boolean(entry?.isIntersecting)),
      { threshold: 0.25 }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!playing || !visible) return;
    const timer = window.setInterval(() => {
      // Hold on the last frame for one extra beat before starting over.
      setIndex((current) => (current + 1) % (frames.length + 1));
    }, STEP_MS);
    return () => window.clearInterval(timer);
  }, [playing, visible, frames.length]);

  const frame = frames[Math.min(index, frames.length - 1)]!;
  const step = Math.min(index, frames.length - 1) + 1;

  return (
    <div
      ref={ref}
      className={cn(
        "overflow-hidden rounded-2xl border border-border bg-card shadow-sm",
        className
      )}
    >
      {/* Window chrome */}
      <div className="flex items-center gap-3 border-b border-border px-4 py-2.5">
        <span className="rounded-full bg-ember-500/12 px-2 py-0.5 font-mono text-[0.65rem] font-medium text-ember-300">
          Python
        </span>
        <span className="truncate font-mono text-xs text-muted-foreground">
          reverse.py
        </span>
        <span className="ml-auto font-mono text-[0.7rem] text-muted-foreground tabular-nums">
          step {step}/{frames.length}
        </span>
        <button
          type="button"
          onClick={() => setPlaying((p) => !p)}
          aria-label={playing ? "Pause the replay" : "Play the replay"}
          className="-mr-1.5 flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors outline-none hover:bg-accent/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
        >
          {playing ? (
            <Pause className="size-3.5" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="grid md:grid-cols-[1.15fr_1fr]">
        {/* Code */}
        <div className="overflow-x-auto border-b border-border py-3 font-mono text-[0.72rem] leading-6 md:border-r md:border-b-0">
          {CODE.map((text, i) => {
            const current = i + 1 === frame.line;
            return (
              <div
                key={i}
                className={cn(
                  "flex border-l-2 pr-4 transition-colors duration-200",
                  current ? "border-ember-500 bg-ember-500/10" : "border-transparent"
                )}
              >
                <span className="w-8 shrink-0 pr-3 text-right text-muted-foreground/60 tabular-nums select-none">
                  {i + 1}
                </span>
                <code
                  className={cn(
                    "whitespace-pre",
                    current ? "text-foreground" : "text-muted-foreground"
                  )}
                >
                  {text}
                </code>
              </div>
            );
          })}
        </div>

        {/* State */}
        <div className="viz-canvas flex flex-col justify-center gap-5 p-5">
          <div
            role="img"
            aria-label={`Array ${frame.nums.join(", ")}; left ${frame.left ?? "unset"}, right ${frame.right ?? "unset"}.`}
          >
            <p className="mb-2 font-mono text-[0.65rem] tracking-wider text-muted-foreground uppercase">
              nums
            </p>
            <div className="flex gap-1.5">
              {frame.nums.map((value, i) => {
                const changed = frame.changed.includes(i);
                const pointed = i === frame.left || i === frame.right;
                return (
                  <div key={i} className="flex min-w-0 flex-1 flex-col items-center">
                    <div
                      className={cn(
                        "flex h-10 w-full items-center justify-center rounded-md border font-mono text-sm transition-all duration-500",
                        changed
                          ? "scale-105 border-ember-400 bg-ember-500/35 text-foreground"
                          : pointed
                            ? "border-ember-500/60 bg-ember-500/10 text-ember-200"
                            : "border-viz-idle bg-transparent text-foreground/80"
                      )}
                    >
                      {value}
                    </div>
                    <span className="mt-1 font-mono text-[0.6rem] text-muted-foreground/60 tabular-nums">
                      {i}
                    </span>
                    <div className="flex h-4 items-start gap-1 font-mono text-[0.6rem] leading-none">
                      {i === frame.left && <span className="text-ember-400">L</span>}
                      {i === frame.right && <span className="text-viz-compare">R</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <dl className="flex gap-2 font-mono text-xs">
            {(
              [
                ["left", frame.left],
                ["right", frame.right],
              ] as const
            ).map(([name, value]) => (
              <div
                key={name}
                className="flex items-center gap-1.5 rounded-md border border-border bg-background/50 px-2 py-1"
              >
                <dt className="text-muted-foreground">{name}</dt>
                <dd className="text-foreground tabular-nums">{value ?? "–"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </div>
  );
}
