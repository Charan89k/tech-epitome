"use client";

import { useCallback, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import { Activity, FileText, Loader2, Play, RotateCcw, Send } from "lucide-react";
// react-resizable-panels v4 renamed PanelGroup -> Group and
// PanelResizeHandle -> Separator, and `direction` -> `orientation`.
import { Group, Panel, Separator } from "react-resizable-panels";

import { useIsMobile } from "@/hooks/use-mobile";

import { runCodeAction, submitCodeAction } from "@/app/(shell)/problems/actions";
import {
  LiveVisualizer,
  type VisualSample,
} from "@/components/live-visual/live-visualizer";
import { TestResults } from "@/components/problems/test-results";
import { TutorLauncher } from "@/components/tutor/tutor-launcher";
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
import {
  LANGUAGE_LABEL,
  SUPPORTED_LANGUAGES,
  type Signature,
} from "@/lib/code-execution/signature";
import { isTraceable } from "@/lib/trace/types";
import { cn } from "@/lib/utils";
import type { TutorContextLabel, TutorQuickAction, TutorCodeState } from "@/lib/tutor/types";
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
  /** Drives the live visualizer; null when the problem has none stored. */
  signature: Signature | null;
  samples: VisualSample[];
  /**
   * Tutor wiring.
   *
   * The tutor lives inside the workspace rather than beside it because
   * this component owns the two things that make it code-aware: the
   * editor buffer and the outcome of the last run. Lifting either of
   * those out to a sibling would mean duplicating editor state, and two
   * sources of truth for "what is in the editor" is exactly the bug that
   * makes a code tutor answer about code the learner is not looking at.
   */
  tutor: {
    label: TutorContextLabel;
    quickActions: TutorQuickAction[];
    enabled: boolean;
  };
};

function draftKey(slug: string, language: Language) {
  return `tech-epitome:draft:${slug}:${language}`;
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
  signature,
  samples,
  tutor,
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

  // Live visualizer wiring: a token to request an auto-playing trace, the
  // line it is on (mirrored into the editor), and which pane is showing.
  const [runToken, setRunToken] = useState(0);
  const [highlight, setHighlight] = useState<{ line: number; kind: "step" | "error" } | null>(null);
  const [leftPane, setLeftPane] = useState<"description" | "visualize">("description");
  const [mobilePane, setMobilePane] = useState("problem");
  const traceable = isTraceable(language);

  const onTraceLine = useCallback((line: number | null, kind: "step" | "error") => {
    setHighlight(line === null ? null : { line, kind });
  }, []);

  function visualize() {
    setRunToken((token) => token + 1);
    setLeftPane("visualize");
    setMobilePane("visual");
  }

  // Switching language loads that language's draft, or its starter code.
  // Adjusting state during render is React's documented way to respond to a
  // changed value; doing it in an effect renders the previous language's
  // code once first, which is a visible flash of the wrong source.
  if (language !== loadedFor) {
    setLoadedFor(language);
    setCode(loadDraft(slug, language, starterCode));
  }

  /**
   * Live editor state for the tutor.
   *
   * Recreated whenever the editor changes, which is the point: the tutor
   * must reason about the buffer as it is when the learner presses send,
   * not as it was when the panel mounted. The identity churn is harmless —
   * nothing subscribes to this function, it is only invoked.
   */
  const getTutorCode = useCallback((): TutorCodeState => {
    const result = outcome?.result;

    return {
      language,
      code,
      lastRun: result
        ? {
            mode: mode ?? "run",
            status: result.status,
            passed: result.passed,
            total: result.total,
            // Compile error first, then the first failing case's stderr.
            // Only sample cases carry stderr, so a hidden test's output
            // cannot reach the tutor through here.
            errorMessage:
              result.compileError ??
              result.results.find((test) => test.stderr)?.stderr ??
              null,
          }
        : undefined,
    };
  }, [code, language, outcome, mode]);

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
    // A run is also a trace: the picture should follow the code the
    // learner just ran, without a second click.
    if (which === "run" && traceable && signature) {
      setRunToken((token) => token + 1);
      setLeftPane("visualize");
    }
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

  const tutorLauncher = (
    <TutorLauncher
      anchor={{ kind: "PROBLEM", problemSlug: slug }}
      label={tutor.label}
      quickActions={tutor.quickActions}
      getCode={getTutorCode}
      enabled={tutor.enabled}
      variant="ghost"
    />
  );

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
        {/* Desktop only. On a phone the editor lives behind a tab, and a
            tutor you can only reach from the Code tab is a tutor you
            cannot reach while reading the problem — so the mobile layout
            renders it in the persistent header below instead. Exactly one
            of the two is ever mounted, because only one layout is. */}
        {!isMobile && tutorLauncher}

        {signature && (
          <Button
            variant="ghost"
            size="sm"
            className="text-ember-300 hover:text-ember-200 h-8"
            onClick={visualize}
            disabled={!traceable}
            title={
              traceable
                ? "Run on an example and watch each line execute"
                : "Step-by-step tracing is available for Python and JavaScript"
            }
          >
            <Activity className="size-3.5" />
            Visualize
          </Button>
        )}

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
        <CodeEditor
          language={language}
          value={code}
          onChange={persist}
          highlight={highlight}
        />
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

  const visualPane = signature ? (
    <LiveVisualizer
      signature={signature}
      samples={samples}
      language={language}
      code={code}
      runToken={runToken}
      onLine={onTraceLine}
    />
  ) : (
    <p className="text-muted-foreground p-6 text-sm">
      This problem has no visual yet.
    </p>
  );

  if (isMobile) {
    // Stacked tabs: a three-way split at 390px is unusable.
    return (
      <Tabs value={mobilePane} onValueChange={setMobilePane}>
        <div className="border-border flex items-center justify-end border-b px-2 py-1.5">
          {tutorLauncher}
        </div>

        <TabsList className="w-full rounded-none">
          <TabsTrigger value="problem" className="flex-1">
            Problem
          </TabsTrigger>
          <TabsTrigger value="code" className="flex-1">
            Code
          </TabsTrigger>
          <TabsTrigger value="visual" className="flex-1">
            Visual
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

        <TabsContent value="visual" className="mt-0">
          <div className="h-[75dvh]">{visualPane}</div>
        </TabsContent>

        <TabsContent value="results" className="mt-0">
          <div className="min-h-[50dvh]">{resultsPane}</div>
        </TabsContent>
      </Tabs>
    );
  }

  return (
    <div className="h-[calc(100dvh-3.5rem)]">
      <Group orientation="horizontal" id="tech-epitome-problem-h" className="h-full">
        <Panel defaultSize="42%" minSize="25%">
          <Tabs
            value={leftPane}
            onValueChange={(value) => setLeftPane(value as typeof leftPane)}
            className="flex h-full flex-col gap-0"
          >
            <div className="border-border bg-card/40 flex items-center border-b px-2">
              <TabsList className="h-10 bg-transparent p-0">
                <PaneTab value="description" icon={FileText} label="Description" />
                <PaneTab value="visualize" icon={Activity} label="Visualizer" live={traceable} />
              </TabsList>
            </div>
            {/* forceMount keeps both mounted: the description holds draft
                notes and highlights, and the visualizer holds its trace. */}
            <TabsContent
              value="description"
              forceMount
              className="mt-0 min-h-0 flex-1 overflow-y-auto px-6 py-6 data-[state=inactive]:hidden"
            >
              {description}
            </TabsContent>
            <TabsContent
              value="visualize"
              forceMount
              className="mt-0 min-h-0 flex-1 data-[state=inactive]:hidden"
            >
              {visualPane}
            </TabsContent>
          </Tabs>
        </Panel>

        <ResizeHandle orientation="horizontal" />

        <Panel defaultSize="58%" minSize="30%">
          <Group orientation="vertical" id="tech-epitome-problem-v" className="h-full">
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

function PaneTab({
  value,
  icon: Icon,
  label,
  live = false,
}: {
  value: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  live?: boolean;
}) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:text-foreground data-[state=active]:after:bg-ember-500 relative h-10 rounded-none border-0 bg-transparent px-3 text-xs shadow-none after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full data-[state=active]:bg-transparent data-[state=active]:shadow-none"
    >
      <Icon className="size-3.5" />
      {label}
      {live && <span className="bg-ember-500 size-1.5 rounded-full" aria-hidden="true" />}
    </TabsTrigger>
  );
}
