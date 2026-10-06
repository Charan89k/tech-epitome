"use client";

import { useEffect, useRef } from "react";
import Editor, { type OnMount } from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

import type { Language } from "@/generated/prisma/enums";
import { MONACO_LANGUAGE } from "@/lib/code-execution/signature";

/**
 * Monaco, configured for solving a problem rather than editing a project.
 *
 * Accessibility: Monaco traps Tab by default so the key can indent, which
 * makes the editor a keyboard trap. `tabFocusMode` is enabled on mount and
 * the shortcut to toggle it is documented beneath the editor, so a keyboard
 * user can always get out. That is the single most important thing to get
 * right when embedding a code editor in a page.
 */
export function CodeEditor({
  language,
  value,
  onChange,
  readOnly = false,
  highlight = null,
}: {
  language: Language;
  value: string;
  onChange: (value: string) => void;
  readOnly?: boolean;
  /**
   * A line to mark: the one the live trace is on, or the one an error came
   * from. Drawn as a whole-line tint plus a gutter marker, and scrolled into
   * view only when it is off screen, so stepping does not yank the editor.
   */
  highlight?: { line: number; kind: "step" | "error" } | null;
}) {
  const editorRef = useRef<Parameters<OnMount>[0] | null>(null);
  const decorationsRef = useRef<ReturnType<
    Parameters<OnMount>[0]["createDecorationsCollection"]
  > | null>(null);

  const highlightLine = highlight?.line ?? null;
  const highlightKind = highlight?.kind ?? "step";

  useEffect(() => {
    const editor = editorRef.current;
    const decorations = decorationsRef.current;
    if (!editor || !decorations) return;
    const lineCount = editor.getModel()?.getLineCount() ?? 0;
    if (highlightLine === null || highlightLine < 1 || highlightLine > lineCount) {
      decorations.clear();
      return;
    }
    decorations.set([
      {
        range: {
          startLineNumber: highlightLine,
          startColumn: 1,
          endLineNumber: highlightLine,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: highlightKind === "error" ? "trace-line-error" : "trace-line",
          linesDecorationsClassName:
            highlightKind === "error" ? "trace-gutter-error" : "trace-gutter",
        },
      },
    ]);
    editor.revealLineInCenterIfOutsideViewport(highlightLine);
  }, [highlightLine, highlightKind]);

  const onMount: OnMount = (editor, monaco) => {
    editorRef.current = editor;
    decorationsRef.current = editor.createDecorationsCollection();

    monaco.editor.defineTheme("tech-epitome", {
      base: "vs-dark",
      inherit: true,
      rules: [],
      colors: {
        // Matches --card so the editor sits flush with the panel around it.
        "editor.background": "#25272c",
        "editorGutter.background": "#25272c",
        "editorLineNumber.foreground": "#6b6f78",
        "editorLineNumber.activeForeground": "#f2a35a",
        "editor.lineHighlightBackground": "#2c2f35",
        "editorCursor.foreground": "#f29b3f",
        "editor.selectionBackground": "#f29b3f33",
      },
    });
    monaco.editor.setTheme("tech-epitome");

    // Tab moves focus instead of indenting, so the editor is not a trap.
    // Ctrl+M toggles it back for anyone who wants Tab to indent.
    editor.updateOptions({ tabFocusMode: true });
  };

  return (
    <div className="h-full w-full">
      <Editor
        height="100%"
        language={MONACO_LANGUAGE[language]}
        value={value}
        onChange={(next) => onChange(next ?? "")}
        onMount={onMount}
        loading={
          <div className="text-muted-foreground flex h-full items-center justify-center gap-2 text-sm">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading editor…
          </div>
        }
        options={{
          readOnly,
          fontSize: 13,
          fontFamily: "var(--font-geist-mono), ui-monospace, monospace",
          fontLigatures: false,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          padding: { top: 12, bottom: 12 },
          lineNumbersMinChars: 3,
          renderLineHighlight: "line",
          tabSize: 4,
          insertSpaces: true,
          automaticLayout: true,
          bracketPairColorization: { enabled: true },
          scrollbar: { verticalScrollbarSize: 10, horizontalScrollbarSize: 10 },
          // The editor is a text field, not an IDE: suggestions from a
          // language service that has no project context are mostly noise.
          quickSuggestions: false,
          wordBasedSuggestions: "currentDocument",
          accessibilitySupport: "auto",
        }}
      />
    </div>
  );
}
