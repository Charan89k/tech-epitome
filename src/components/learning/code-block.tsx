"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

type CodeBlockProps = {
  code: string;
  language: string;
  caption?: string;
  /** 1-based line numbers to emphasise. */
  highlightLines?: number[];
  className?: string;
};

/**
 * Static code display.
 *
 * Deliberately not syntax-highlighted client-side: pulling a highlighter
 * bundle into every lesson page costs more than it returns on a dark theme
 * where the real signal is structure and the highlighted lines. Monaco is
 * loaded only on the problem page, where code is actually edited.
 */
export function CodeBlock({
  code,
  language,
  caption,
  highlightLines = [],
  className,
}: CodeBlockProps) {
  const [copied, setCopied] = useState(false);
  const lines = code.replace(/\n$/, "").split("\n");
  const highlighted = new Set(highlightLines);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard can be unavailable (insecure origin, denied permission).
      // Silently leave the button in its default state; the code is still
      // selectable by hand.
    }
  }

  return (
    <figure className={cn("group not-prose my-5", className)}>
      <div className="border-border bg-card overflow-hidden rounded-xl border">
        <div className="border-border bg-muted/40 flex items-center justify-between border-b px-3 py-1.5">
          <span className="text-muted-foreground font-mono text-[0.7rem] tracking-wide uppercase">
            {language}
          </span>
          <button
            type="button"
            onClick={copy}
            className="text-muted-foreground hover:text-foreground focus-visible:text-foreground flex items-center gap-1 rounded px-1.5 py-0.5 text-[0.7rem] transition-colors"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <>
                <Check className="text-success size-3" aria-hidden="true" />
                Copied
              </>
            ) : (
              <>
                <Copy className="size-3" aria-hidden="true" />
                Copy
              </>
            )}
          </button>
        </div>

        <pre className="overflow-x-auto p-0 text-[0.8rem] leading-relaxed">
          {/* w-max lets the rows size to their longest line so the <pre>
              scrolls, instead of the lines escaping it and widening the
              page; min-w-full keeps short snippets full width so the line
              highlight still spans the block. */}
          <code className="block w-max min-w-full font-mono">
            {lines.map((line, index) => {
              const lineNumber = index + 1;
              const isHighlighted = highlighted.has(lineNumber);
              return (
                <span
                  key={index}
                  className={cn(
                    "grid grid-cols-[2.5rem_1fr] hover:bg-white/[0.02]",
                    isHighlighted && "bg-ember-500/8 border-ember-500/60 border-l-2"
                  )}
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "text-muted-foreground/40 shrink-0 pr-3 text-right select-none",
                      isHighlighted && "text-ember-500/70 -ml-0.5"
                    )}
                  >
                    {lineNumber}
                  </span>
                  <span className="text-foreground/90 pr-4 whitespace-pre">
                    {line || " "}
                  </span>
                </span>
              );
            })}
          </code>
        </pre>
      </div>

      {caption && (
        <figcaption className="text-muted-foreground mt-2 text-xs">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
