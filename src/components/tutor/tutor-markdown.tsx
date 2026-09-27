"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Markdown for tutor answers.
 *
 * A deliberately small renderer rather than a markdown library. The tutor
 * is instructed to produce a narrow subset — paragraphs, lists, fenced
 * code, inline code, bold — and that subset is what this handles. Pulling
 * in a parser plus a sanitiser to cover the rest would add more attack
 * surface than it removes, because every one of these strings came from a
 * model that was fed untrusted input.
 *
 * Nothing here ever produces raw HTML. Text is rendered as text, so a
 * response containing `<img onerror=...>` renders those characters and
 * does nothing else. That property is the reason this file exists at all,
 * and it is the one thing not to "improve" later.
 *
 * It must also tolerate half a document: while a response is streaming, an
 * unterminated fence is the normal case, not an error.
 */

type Segment =
  | { kind: "code"; language: string; code: string; complete: boolean }
  | { kind: "prose"; text: string };

/** Splits on fenced code blocks, keeping a trailing unterminated fence. */
function segment(markdown: string): Segment[] {
  const segments: Segment[] = [];
  const fence = /```([\w+#-]*)\n?([\s\S]*?)(?:```|$)/g;

  let cursor = 0;
  let match: RegExpExecArray | null;

  while ((match = fence.exec(markdown)) !== null) {
    if (match.index > cursor) {
      segments.push({ kind: "prose", text: markdown.slice(cursor, match.index) });
    }
    segments.push({
      kind: "code",
      language: match[1] || "text",
      code: match[2] ?? "",
      complete: match[0].endsWith("```"),
    });
    cursor = match.index + match[0].length;
  }

  if (cursor < markdown.length) {
    segments.push({ kind: "prose", text: markdown.slice(cursor) });
  }

  return segments;
}

/** Inline marks: `code`, **bold**, *italic*. Everything else stays literal. */
function renderInline(text: string, keyPrefix: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = [];
  const pattern = /(`[^`\n]+`|\*\*[^*\n]+\*\*|(?<![*\w])\*[^*\n]+\*(?!\w))/g;

  let last = 0;
  let match: RegExpExecArray | null;
  let index = 0;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];

    if (token.startsWith("`")) {
      nodes.push(
        <code
          key={`${keyPrefix}-c${index}`}
          className="bg-muted text-ember-300 rounded px-1 py-0.5 font-mono text-[0.85em]"
        >
          {token.slice(1, -1)}
        </code>
      );
    } else if (token.startsWith("**")) {
      nodes.push(
        <strong key={`${keyPrefix}-b${index}`} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      nodes.push(<em key={`${keyPrefix}-i${index}`}>{token.slice(1, -1)}</em>);
    }

    last = match.index + token.length;
    index += 1;
  }

  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

function Prose({ text, keyPrefix }: { text: string; keyPrefix: string }) {
  const lines = text.split("\n");
  const out: React.ReactNode[] = [];

  let paragraph: string[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  function flushParagraph() {
    if (paragraph.length === 0) return;
    const joined = paragraph.join(" ").trim();
    paragraph = [];
    if (!joined) return;
    out.push(
      <p key={`${keyPrefix}-p${out.length}`} className="text-sm leading-relaxed">
        {renderInline(joined, `${keyPrefix}-p${out.length}`)}
      </p>
    );
  }

  function flushList() {
    if (!list) return;
    const current = list;
    list = null;
    const Tag = current.ordered ? "ol" : "ul";
    out.push(
      <Tag
        key={`${keyPrefix}-l${out.length}`}
        className={cn(
          "marker:text-muted-foreground/50 space-y-1 pl-5 text-sm leading-relaxed",
          current.ordered ? "list-decimal" : "list-disc"
        )}
      >
        {current.items.map((item, i) => (
          <li key={i}>{renderInline(item, `${keyPrefix}-l${out.length}-${i}`)}</li>
        ))}
      </Tag>
    );
  }

  for (const line of lines) {
    const bullet = /^\s*[-*]\s+(.*)$/.exec(line);
    const numbered = /^\s*\d+[.)]\s+(.*)$/.exec(line);
    const heading = /^#{1,6}\s+(.*)$/.exec(line);

    if (heading) {
      flushParagraph();
      flushList();
      out.push(
        <p
          key={`${keyPrefix}-h${out.length}`}
          className="mt-1 text-sm font-semibold"
        >
          {renderInline(heading[1]!, `${keyPrefix}-h${out.length}`)}
        </p>
      );
      continue;
    }

    if (bullet || numbered) {
      flushParagraph();
      const ordered = Boolean(numbered);
      const item = (bullet?.[1] ?? numbered?.[1] ?? "").trim();
      if (!list || list.ordered !== ordered) {
        flushList();
        list = { ordered, items: [] };
      }
      list.items.push(item);
      continue;
    }

    if (!line.trim()) {
      flushParagraph();
      flushList();
      continue;
    }

    flushList();
    paragraph.push(line.trim());
  }

  flushParagraph();
  flushList();

  return <>{out}</>;
}

function CodeSegment({
  language,
  code,
  complete,
}: {
  language: string;
  code: string;
  complete: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // Insecure origin or a denied permission. The code is still
      // selectable by hand; leave the button alone.
    }
  }

  return (
    <div className="border-border bg-card my-2 overflow-hidden rounded-md border">
      <div className="border-border bg-muted/40 flex items-center justify-between border-b px-2.5 py-1">
        <span className="text-muted-foreground font-mono text-[0.65rem] tracking-wide uppercase">
          {language}
        </span>
        {complete && (
          <button
            type="button"
            onClick={copy}
            className="text-muted-foreground hover:text-foreground flex items-center gap-1 rounded px-1 text-[0.65rem] transition-colors"
            aria-label={copied ? "Copied" : "Copy code"}
          >
            {copied ? (
              <Check className="text-success size-3" aria-hidden="true" />
            ) : (
              <Copy className="size-3" aria-hidden="true" />
            )}
            {copied ? "Copied" : "Copy"}
          </button>
        )}
      </div>
      <pre className="overflow-x-auto px-3 py-2">
        <code className="font-mono text-xs leading-relaxed whitespace-pre">
          {code.replace(/\n$/, "")}
        </code>
      </pre>
    </div>
  );
}

export function TutorMarkdown({ content }: { content: string }) {
  const segments = segment(content);

  return (
    <div className="space-y-2">
      {segments.map((seg, index) =>
        seg.kind === "code" ? (
          <CodeSegment
            key={index}
            language={seg.language}
            code={seg.code}
            complete={seg.complete}
          />
        ) : (
          <Prose key={index} text={seg.text} keyPrefix={`s${index}`} />
        )
      )}
    </div>
  );
}
