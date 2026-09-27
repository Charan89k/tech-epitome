"use client";

import { useCallback, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Loader2, Play, RotateCcw, Send } from "lucide-react";
// react-resizable-panels v4 renamed PanelGroup -> Group and
// PanelResizeHandle -> Separator, and `direction` -> `orientation`.
import { Group, Panel, Separator } from "react-resizable-panels";

import { useIsMobile } from "@/hooks/use-mobile";

import { runCodeAction, submitCodeAction } from "@/app/(shell)/problems/actions";
import { TestResults } from "@/components/problems/test-results";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Language } from "@/generated/prisma/enums";
import { LANGUAGE_LABEL, SUPPORTED_LANGUAGES } from "@/lib/code-execution/signature";
import { cn } from "@/lib/utils";
import type { RunOutcome } from "@/services/submissions";

/**
 * The coding workspace: editor, controls, and results.
 *
 * Monaco is loaded dynamically because it is by far the largest dependency
 * in the app, and nothing else in the product needs it.
 *
 * Draft code is kept in localStorage per problem and language, so a refresh
 * or an accidental navigation does not lose work. It is explicitly a
 * convenience, not storage: it is per-browser, never synced, and every
 * access is guarded because a private window can refuse it.
 */
const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> }
);

type Props = {
  slug: string;
  starterCode: Record<string, string>;
  defaultLanguage: Language;
  signedIn: boolean;
  /** Rendered in the left pane on desktop, and in a tab on mobile. */
  description: React.ReactNode;
};

function draftKey(slug: string, language: Language) {
  return `codeforge:draft:${slug}:${language}`;
}

/**
 * Reads a saved draft, falling back to the starter code.
 *
 * Every access is guarded: a private window, cleared site data or a blocked
 * storage policy all throw here, and none of them should stop the editor
 * from opening.
 */
function loadDraft(
  slug: string,
  language: Language,
  starterCode: Record<string, string>
): string {
  try {
    const saved = window.localStorage.getItem(draftKey(slug, language));
    if (saved !== null) return saved;
  } catch {
    // Fall through to the starter code.
  }
  return starterCode[language] ?? "";
}

export function ProblemWorkspace({
  slug,
  starterCode,
  defaultLanguage,
  signedIn,
  description,
}: Props) {
  // Only one layout is rendered at a time. Showing both and hiding one
  // with CSS would put two live Monaco instances on the page: double the
  // memory, and an ambiguous `getModels()[0]`. The cost is that a phone
  // renders the desktop layout for the first frame before hydration
  // corrects it, which is by far the cheaper of the two problems.
  const isMobile = useIsMobile();

  const available = SUPPORTED_LANGUAGES.filter((language) => starterCode[language]);
  const initialLanguage = available.includes(defaultLanguage)
    ? defaultLanguage
    : (available[0] ?? "PYTHON");

  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [code, setCode] = useState(() => loadDraft(slug, initialLanguage, starterCode));
  const [loadedFor, setLoadedFor] = useState(initialLanguage);
  const [outcome, setOutcome] = useState<RunOutcome | null>(null);
  const [mode, setMode] = useState<"run" | "submit" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Switching language loads that language's draft, or its starter code.
  // Adjusting state during render is React's documented way to respond to a
  // changed value; doing it in an effect renders the previous language's
  // code once first, which is a visible flash of the wrong source.
  if (language !== loadedFor) {
    setLoadedFor(language);
    setCode(loadDraft(slug, language, starterCode));
  }

  const persist = useCallback(
    (next: string) => {
      setCode(next);
      try {
        window.localStorage.setItem(draftKey(slug, language), next);
      } catch {
        // Losing the draft is a minor inconvenience; breaking typing is not.
      }
    },
    [slug, language]
  );

  function reset() {
    const starter = starterCode[language] ?? "";
    setCode(starter);
    setOutcome(null);
    setError(null);
    try {
      window.localStorage.removeItem(draftKey(slug, language));
    } catch {
      // Ignored for the same reason as above.
    }
  }

  function execute(which: "run" | "submit") {
    setError(null);
    setMode(which);
    startTransition(async () => {
      const action = which === "run" ? runCodeAction : submitCodeAction;
      const response = await action({ slug, language, code });
      if (response.ok) {
        setOutcome(response.data);
      } else {
        setOutcome(null);
        setError(response.error);
      }
    });
  }

  const controls = (
    <div className="border-border flex flex-wrap items-center gap-2 border-b px-3 py-2">
      <Select
        value={language}
        onValueChange={(value) => setLanguage(value as Language)}
      >
        <SelectTrigger size="sm" className="h-8 w-36" aria-label="Language">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {available.map((item) => (
            <SelectItem key={item} value={item}>
              {LANGUAGE_LABEL[item]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button
        variant="ghost"
        size="sm"
        className="h-8"
        onClick={reset}
        aria-label="Reset to starter code"
      >
        <RotateCcw className="size-3.5" />
        Reset
      </Button>

      <div className="ml-auto flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          className="h-8"
          onClick={() => execute("run")}
          disabled={pending}
        >
          {pending && mode === "run" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Play className="size-3.5" />
          )}
          Run
        </Button>

        <Button
          size="sm"
          className="h-8"
          onClick={() => execute("submit")}
          disabled={pending || !signedIn}
          title={signedIn ? undefined : "Sign in to submit"}
        >
          {pending && mode === "submit" ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Send className="size-3.5" />
          )}
          Submit
        </Button>
      </div>
    </div>
  );

  const editorPane = (
    <div className="flex h-full flex-col">
      {controls}
      <div className="min-h-0 flex-1">
        <CodeEditor language={language} value={code} onChange={persist} />
      </div>
      <p className="border-border text-muted-foreground/70 border-t px-3 py-1.5 text-[0.65rem]">
        Tab moves focus out of the editor. Press Ctrl+M to let Tab indent instead.
      </p>
    </div>
  );

  const resultsPane = (
    <div className="flex h-full flex-col">
      <div className="border-border flex items-center gap-2 border-b px-3 py-2">
        <h2 className="text-xs font-medium">Test results</h2>
        {!signedIn && (
          <span className="text-muted-foreground ml-auto text-[0.68rem]">
            Sign in to submit and record progress
          </span>
        )}
      </div>
      <div className="min-h-0 flex-1">
        {error ? (
          <div className="p-4">
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        ) : (
          <TestResults outcome={outcome} pending={pending} mode={mode} />
        )}
      </div>
    </div>
  );

  if (isMobile) {
    // Stacked tabs: a three-way split at 390px is unusable.
    return (
      <Tabs defaultValue="problem">
        <TabsList className="w-full rounded-none">
          <TabsTrigger value="problem" className="flex-1">
            Problem
          </TabsTrigger>
          <TabsTrigger value="code" className="flex-1">
            Code
          </TabsTrigger>
          <TabsTrigger value="results" className="flex-1">
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="problem" className="mt-0 px-4 py-5">
          {description}
        </TabsContent>

        <TabsContent value="code" className="mt-0">
          <div className="h-[70dvh]">{editorPane}</div>
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <div className="min-h-[50dvh]">{resultsPane}</div>
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)]">
      <Group orientation="horizontal" id="codeforge-problem-h" className="h-full">
        <Panel defaultSize="42%" minSize="25%">
          <div className="h-full overflow-y-auto px-6 py-6">{description}</div>
        </Panel>

        <ResizeHandle orientation="horizontal" />

        <Panel defaultSize="58%" minSize="30%">
          <Group orientation="vertical" id="codeforge-problem-v" className="h-full">
            <Panel defaultSize="62%" minSize="25%">
              {editorPane}
            </Panel>
            <ResizeHandle orientation="vertical" />
            <Panel defaultSize="38%" minSize="15%">
              {resultsPane}
            </Panel>
          </Group>
        </Panel>
      </Group>
    </div>
  );
}

function ResizeHandle({
  orientation,
}: {
  orientation: "horizontal" | "vertical";
}) {
  return (
    <Separator
      className={cn(
        "bg-border hover:bg-ember-500/40 data-[state=dragging]:bg-ember-500/60 transition-colors",
        orientation === "horizontal" ? "w-px cursor-col-resize" : "h-px cursor-row-resize"
      )}
      aria-label={`Resize ${orientation === "horizontal" ? "panels" : "editor"}`}
    />
  );
}
