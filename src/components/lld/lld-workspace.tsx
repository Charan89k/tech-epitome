"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import dynamic from "next/dynamic";
import {
  Check,
  Code2,
  Lightbulb,
  Loader2,
  Plus,
  Send,
  Shapes,
  SlidersHorizontal,
  Trash2,
  Unlink,
} from "lucide-react";

import { ClassDiagramView } from "@/components/class-diagram/class-diagram-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { UnderlineTab, UNDERLINE_TABS_LIST } from "@/components/system-design/pane";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  revealLLDHintAction,
  saveLLDAction,
  submitLLDAction,
} from "@/app/(shell)/lld/actions";
import { useIsMobile } from "@/hooks/use-mobile";
import { classDiagramDiagnostics } from "@/lib/class-diagram/layout";
import {
  RELATION_KINDS,
  RELATION_LABELS,
  TYPE_KIND_LABELS,
  TYPE_PALETTE,
  VISIBILITIES,
  type ClassDiagram,
  type RelationKind,
  type TypeKind,
  type Visibility,
} from "@/lib/class-diagram/types";
import type { Language } from "@/generated/prisma/enums";
import { LANGUAGE_LABEL, SUPPORTED_LANGUAGES } from "@/lib/code-execution/signature";
import { cn } from "@/lib/utils";

/**
 * Where the learner designs classes and writes the implementation.
 *
 * Structural editing, not a canvas — same argument as the architecture
 * workspace: it works on a phone, it produces a design the reviewer can
 * reason about rather than a picture, and it keeps attention on
 * responsibilities rather than on alignment.
 *
 * Monaco is loaded dynamically and mounted once. On mobile the whole
 * workspace becomes tabs rather than a squeezed three-column layout,
 * because a diagram, an inspector and an editor side by side at 375px is
 * three unusable columns.
 */

const CodeEditor = dynamic(
  () => import("@/components/editor/code-editor").then((m) => m.CodeEditor),
  { ssr: false, loading: () => <Skeleton className="h-full w-full rounded-none" /> }
);

type SaveState = "idle" | "saving" | "saved" | "error";

/** Stable readable ids: `class-1`. Kept to the schema's safe alphabet. */
function nextTypeId(diagram: ClassDiagram, kind: TypeKind): string {
  let n = 1;
  while (diagram.types.some((t) => t.id === `${kind}-${n}`)) n += 1;
  return `${kind}-${n}`;
}

export function LLDWorkspace({
  slug,
  initialDiagram,
  initialCode,
  initialLanguage,
  initialRationale,
  alreadySubmitted,
  totalHints,
  initialHints,
}: {
  slug: string;
  initialDiagram: ClassDiagram;
  initialCode: string;
  initialLanguage: Language;
  initialRationale: string;
  alreadySubmitted: boolean;
  totalHints: number;
  /** Hints already opened in a previous session, in order. */
  initialHints: string[];
}) {
  const isMobile = useIsMobile();

  const [diagram, setDiagram] = useState<ClassDiagram>(initialDiagram);
  const [code, setCode] = useState(initialCode);
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const [rationale, setRationale] = useState(initialRationale);

  const [selected, setSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [relationKind, setRelationKind] = useState<RelationKind>("association");

  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  const [hints, setHints] = useState<string[]>(initialHints);
  const [hintPending, startHint] = useTransition();

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const persist = useCallback(
    async (next: {
      diagram: ClassDiagram;
      code: string;
      language: Language;
      rationale: string;
    }) => {
      setSaveState("saving");
      const result = await saveLLDAction({
        slug,
        classDiagram: next.diagram,
        code: next.code,
        language: next.language,
        rationale: next.rationale,
      });
      if (result.ok) {
        setSaveState("saved");
        setError(null);
      } else {
        setSaveState("error");
        setError(result.error);
      }
    },
    [slug]
  );

  // Debounced, and skipped on first render so opening an exercise does
  // not immediately write back what was just read.
  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(
      () => void persist({ diagram, code, language, rationale }),
      900
    );
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [diagram, code, language, rationale, persist]);

  function mutate(next: ClassDiagram) {
    dirty.current = true;
    setDiagram(next);
  }

  function addType(kind: TypeKind) {
    const id = nextTypeId(diagram, kind);
    mutate({
      ...diagram,
      types: [
        ...diagram.types,
        { id, kind, name: TYPE_KIND_LABELS[kind], attributes: [], methods: [] },
      ],
    });
    setSelected(id);
  }

  function removeSelected() {
    if (!selected) return;
    mutate({
      types: diagram.types.filter((t) => t.id !== selected),
      // Relationships touching a removed type go with it, otherwise the
      // stored diagram fails validation on the next save.
      relationships: diagram.relationships.filter(
        (r) => r.from !== selected && r.to !== selected
      ),
    });
    setSelected(null);
    setConnectFrom(null);
  }

  function handleTypeClick(id: string) {
    if (connectFrom === null) {
      setSelected(id);
      return;
    }
    if (connectFrom === id) {
      // Self-relationships are rejected by the schema, so refuse here
      // rather than saving something that will bounce.
      setConnectFrom(null);
      return;
    }

    const exists = diagram.relationships.some(
      (r) => r.from === connectFrom && r.to === id && r.kind === relationKind
    );
    if (!exists) {
      let n = 1;
      while (diagram.relationships.some((r) => r.id === `rel-${n}`)) n += 1;
      mutate({
        ...diagram,
        relationships: [
          ...diagram.relationships,
          { id: `rel-${n}`, from: connectFrom, to: id, kind: relationKind },
        ],
      });
    }
    setConnectFrom(null);
  }

  function patchSelected(patch: Partial<{ name: string; kind: TypeKind }>) {
    if (!selected) return;
    mutate({
      ...diagram,
      types: diagram.types.map((t) => (t.id === selected ? { ...t, ...patch } : t)),
    });
  }

  function addMember(what: "attribute" | "method") {
    if (!selectedType) return;
    mutate({
      ...diagram,
      types: diagram.types.map((t) =>
        t.id !== selected
          ? t
          : what === "attribute"
            ? {
                ...t,
                attributes: [
                  ...t.attributes,
                  { name: "field", type: "String", visibility: "private" as Visibility },
                ],
              }
            : {
                ...t,
                methods: [
                  ...t.methods,
                  {
                    name: "doSomething",
                    params: "",
                    returns: "void",
                    visibility: "public" as Visibility,
                  },
                ],
              }
      ),
    });
  }

  function patchMember(
    what: "attribute" | "method",
    index: number,
    patch: Record<string, unknown>
  ) {
    if (!selected) return;
    mutate({
      ...diagram,
      types: diagram.types.map((t) => {
        if (t.id !== selected) return t;
        if (what === "attribute") {
          const attributes = [...t.attributes];
          attributes[index] = { ...attributes[index]!, ...patch };
          return { ...t, attributes };
        }
        const methods = [...t.methods];
        methods[index] = { ...methods[index]!, ...patch };
        return { ...t, methods };
      }),
    });
  }

  function removeMember(what: "attribute" | "method", index: number) {
    if (!selected) return;
    mutate({
      ...diagram,
      types: diagram.types.map((t) => {
        if (t.id !== selected) return t;
        return what === "attribute"
          ? { ...t, attributes: t.attributes.filter((_, i) => i !== index) }
          : { ...t, methods: t.methods.filter((_, i) => i !== index) };
      }),
    });
  }

  function removeRelationship(id: string) {
    mutate({
      ...diagram,
      relationships: diagram.relationships.filter((r) => r.id !== id),
    });
  }

  function openHint() {
    setError(null);
    startHint(async () => {
      const result = await revealLLDHintAction(slug);
      if (result.ok) setHints((prev) => [...prev, result.data.body]);
      else setError(result.error);
    });
  }

  function submit() {
    setError(null);
    startSubmit(async () => {
      // Flush any pending autosave: submitting validates what is in the
      // database, not what is on screen.
      await persist({ diagram, code, language, rationale });
      const result = await submitLLDAction(slug);
      if (result.ok) setSubmitted(true);
      else setError(result.error);
    });
  }

  const selectedType = diagram.types.find((t) => t.id === selected) ?? null;
  const diagnostics = classDiagramDiagnostics(diagram);
  const nameOf = (id: string) =>
    diagram.types.find((t) => t.id === id)?.name ?? id;

  // -------------------------------------------------------------------------
  // Panels
  // -------------------------------------------------------------------------

  const palette = (
    <div>
      <h3 className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
        Add a type
      </h3>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {TYPE_PALETTE.map((entry) => (
          <button
            key={entry.kind}
            type="button"
            onClick={() => addType(entry.kind)}
            title={entry.hint}
            className="border-border bg-background/60 text-muted-foreground hover:border-ember-500/40 hover:text-ember-300 focus-visible:ring-ring/50 inline-flex h-7 items-center gap-1 rounded-md border px-2.5 text-xs transition-colors focus-visible:ring-3 focus-visible:outline-none"
          >
            <Plus className="size-3" aria-hidden="true" />
            {entry.label}
          </button>
        ))}
      </div>
    </div>
  );

  const connectBar = (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        size="sm"
        variant={connectFrom ? "default" : "outline"}
        className="h-8"
        disabled={diagram.types.length < 2}
        onClick={() =>
          setConnectFrom(connectFrom ? null : (selected ?? diagram.types[0]!.id))
        }
      >
        {connectFrom
          ? `Connecting from ${nameOf(connectFrom)} — pick a target`
          : "Connect two types"}
      </Button>

      <Select
        value={relationKind}
        onValueChange={(v) => setRelationKind(v as RelationKind)}
      >
        <SelectTrigger size="sm" className="h-8 w-44 text-xs" aria-label="Relationship type">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {RELATION_KINDS.map((kind) => (
            <SelectItem key={kind} value={kind}>
              {RELATION_LABELS[kind]}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      {selected && (
        <Button
          size="sm"
          variant="ghost"
          className="text-destructive h-8"
          onClick={removeSelected}
        >
          <Trash2 className="size-3.5" />
          Remove {nameOf(selected)}
        </Button>
      )}
    </div>
  );

  const inspector = selectedType ? (
    <div className="border-ember-500/30 bg-ember-500/5 rounded-lg border p-3" data-testid="lld-inspector">
      <div className="flex items-center gap-2">
        <Select
          value={selectedType.kind}
          onValueChange={(v) => patchSelected({ kind: v as TypeKind })}
        >
          <SelectTrigger size="sm" className="h-7 w-36" aria-label="Type kind">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_PALETTE.map((e) => (
              <SelectItem key={e.kind} value={e.kind}>
                {e.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="mt-2 block text-xs">
        <span className="text-muted-foreground">Name</span>
        <input
          value={selectedType.name}
          onChange={(e) => patchSelected({ name: e.target.value })}
          maxLength={60}
          aria-label="Type name"
          className="border-input focus-visible:border-ring focus-visible:ring-ring/50 mt-1 w-full rounded-md border bg-transparent px-2 py-1 text-sm outline-none focus-visible:ring-3"
        />
      </label>

      {/* Attributes */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium">Attributes</h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => addMember("attribute")}
          >
            <Plus className="size-3" />
            Add
          </Button>
        </div>
        <ul className="mt-1 space-y-1">
          {selectedType.attributes.map((attribute, i) => (
            <li key={i} className="flex items-center gap-1">
              <select
                value={attribute.visibility}
                onChange={(e) =>
                  patchMember("attribute", i, { visibility: e.target.value })
                }
                aria-label={`Visibility of ${attribute.name}`}
                className="border-input rounded border bg-transparent px-1 py-0.5 text-xs"
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                value={attribute.name}
                onChange={(e) => patchMember("attribute", i, { name: e.target.value })}
                aria-label="Attribute name"
                className="border-input min-w-0 flex-1 rounded border bg-transparent px-1.5 py-0.5 text-xs"
              />
              <input
                value={attribute.type}
                onChange={(e) => patchMember("attribute", i, { type: e.target.value })}
                aria-label="Attribute type"
                className="border-input w-20 rounded border bg-transparent px-1.5 py-0.5 text-xs"
              />
              <button
                type="button"
                onClick={() => removeMember("attribute", i)}
                aria-label={`Remove attribute ${attribute.name}`}
                className="hover:text-destructive rounded p-0.5"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Methods */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-medium">Methods</h4>
          <Button
            size="sm"
            variant="ghost"
            className="h-6 text-xs"
            onClick={() => addMember("method")}
          >
            <Plus className="size-3" />
            Add
          </Button>
        </div>
        <ul className="mt-1 space-y-1">
          {selectedType.methods.map((method, i) => (
            <li key={i} className="flex items-center gap-1">
              <select
                value={method.visibility}
                onChange={(e) =>
                  patchMember("method", i, { visibility: e.target.value })
                }
                aria-label={`Visibility of ${method.name}`}
                className="border-input rounded border bg-transparent px-1 py-0.5 text-xs"
              >
                {VISIBILITIES.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
              <input
                value={method.name}
                onChange={(e) => patchMember("method", i, { name: e.target.value })}
                aria-label="Method name"
                className="border-input min-w-0 flex-1 rounded border bg-transparent px-1.5 py-0.5 text-xs"
              />
              <input
                value={method.params}
                onChange={(e) => patchMember("method", i, { params: e.target.value })}
                placeholder="params"
                aria-label="Method parameters"
                className="border-input w-20 rounded border bg-transparent px-1.5 py-0.5 text-xs"
              />
              <input
                value={method.returns}
                onChange={(e) => patchMember("method", i, { returns: e.target.value })}
                aria-label="Return type"
                className="border-input w-16 rounded border bg-transparent px-1.5 py-0.5 text-xs"
              />
              <button
                type="button"
                onClick={() => removeMember("method", i)}
                aria-label={`Remove method ${method.name}`}
                className="hover:text-destructive rounded p-0.5"
              >
                <Trash2 className="size-3" />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  ) : (
    <p className="text-muted-foreground border-border bg-muted/20 rounded-lg border border-dashed p-5 text-center text-xs">
      Select a type in the diagram to edit its name, attributes and methods.
    </p>
  );

  const relationshipList = diagram.relationships.length > 0 && (
    <div>
      <h3 className="text-xs font-medium">Relationships</h3>
      <ul className="border-border mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border">
        {diagram.relationships.map((rel) => (
          <li
            key={rel.id}
            className="text-muted-foreground flex items-center gap-2 px-3 py-1.5 text-xs"
          >
            <span className="min-w-0 flex-1 truncate">
              {nameOf(rel.from)} {RELATION_LABELS[rel.kind]} {nameOf(rel.to)}
            </span>
            <button
              type="button"
              onClick={() => removeRelationship(rel.id)}
              aria-label={`Remove relationship ${nameOf(rel.from)} ${RELATION_LABELS[rel.kind]} ${nameOf(rel.to)}`}
              className="hover:text-destructive rounded p-0.5"
            >
              <Unlink className="size-3" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );

  const diagnosticsPanel = diagnostics.length > 0 && (
    <div data-testid="lld-diagnostics">
      <h3 className="text-xs font-medium">What the structure says</h3>
      <p className="text-muted-foreground/70 mt-0.5 text-[0.65rem]">
        Facts about the shape of your design, not a grade. A design with no
        findings is not thereby correct.
      </p>
      <ul className="mt-2 space-y-1">
        {diagnostics.map((d, i) => (
          <li
            key={i}
            className={cn(
              "rounded-md border p-2 text-xs leading-relaxed",
              d.level === "error" && "border-destructive/30 bg-destructive/5 text-destructive",
              d.level === "warning" && "border-warning/25 bg-warning/5 text-muted-foreground",
              d.level === "ok" && "border-success/25 bg-success/5 text-muted-foreground"
            )}
          >
            {/* The level is stated in words as well as colour. */}
            <span className="font-medium">
              {d.level === "error" ? "Problem" : d.level === "warning" ? "Consider" : "Good"}
              {": "}
            </span>
            {d.message}
          </li>
        ))}
      </ul>
    </div>
  );

  const codePane = (
    <div className="flex h-full flex-col">
      <div className="border-border bg-card/40 flex items-center gap-2 border-b px-3 py-2">
        <Select value={language} onValueChange={(v) => {
          dirty.current = true;
          setLanguage(v as Language);
        }}>
          <SelectTrigger size="sm" className="h-8 w-36 text-xs" aria-label="Language">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SUPPORTED_LANGUAGES.map((item) => (
              <SelectItem key={item} value={item}>
                {LANGUAGE_LABEL[item]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground text-[0.65rem]">
          Sketch the classes you designed. Saved with your design.
        </span>
      </div>
      <div className="min-h-0 flex-1">
        <CodeEditor
          language={language}
          value={code}
          onChange={(next) => {
            dirty.current = true;
            setCode(next);
          }}
        />
      </div>
    </div>
  );

  const hintsPanel = totalHints > 0 && (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-1.5 text-xs font-medium">
          <Lightbulb className="text-warning size-3.5" aria-hidden="true" />
          Hints
        </h3>
        <span className="text-muted-foreground text-xs tabular-nums">
          {hints.length}/{totalHints}
        </span>
      </div>

      {hints.map((hint, i) => (
        <div
          key={i}
          className="border-warning/25 bg-warning/5 mt-2 rounded-md border p-2.5"
        >
          <p className="text-warning text-[0.65rem] font-medium tracking-wider uppercase">
            Hint {i + 1}
          </p>
          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">{hint}</p>
        </div>
      ))}

      {hints.length < totalHints && (
        <Button
          size="sm"
          variant="outline"
          className="mt-2 h-7 text-xs"
          onClick={openHint}
          disabled={hintPending}
        >
          {hintPending && <Loader2 className="size-3 animate-spin" aria-hidden="true" />}
          {hints.length === 0 ? "Show a hint" : "Next hint"}
          <span className="text-muted-foreground ml-1">
            ({totalHints - hints.length} left)
          </span>
        </Button>
      )}
    </div>
  );

  const rationalePanel = (
    <div>
      <label htmlFor="lld-rationale" className="text-xs font-medium">
        Why this design?
      </label>
      <p className="text-muted-foreground mt-0.5 text-xs">
        What is each class the only thing that knows, and what did you trade away?
      </p>
      <Textarea
        id="lld-rationale"
        value={rationale}
        onChange={(e) => {
          dirty.current = true;
          setRationale(e.target.value);
        }}
        rows={4}
        maxLength={10_000}
        placeholder="I put pricing behind an interface because it is the requirement most likely to change…"
        className="mt-2 text-sm"
      />
    </div>
  );

  const footer = (
    <div className="space-y-2">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="border-border flex flex-wrap items-center justify-between gap-2 border-t pt-4">
        <p className="text-muted-foreground text-[0.68rem]" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Draft saved"}
          {saveState === "error" && "Could not save"}
          {saveState === "idle" && "Changes save automatically"}
        </p>

        {submitted ? (
          <Badge className="border-success/35 bg-success/12 text-success gap-1 border">
            <Check className="size-3" aria-hidden="true" />
            Submitted
          </Badge>
        ) : (
          <Button size="sm" onClick={submit} disabled={submitting}>
            {submitting ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Send className="size-3.5" />
            )}
            Submit design
          </Button>
        )}
      </div>

      {!submitted && (
        <p className="text-muted-foreground/70 text-[0.65rem]">
          Submitting unlocks a reference design and its trade-offs. Draw yours
          first — comparing is where the learning is.
        </p>
      )}
    </div>
  );

  // -------------------------------------------------------------------------
  // Layout
  // -------------------------------------------------------------------------

  const diagramPane = (
    <>
      <div className="border-border bg-muted/20 space-y-3 rounded-lg border p-3">
        {palette}
        {connectBar}
      </div>
      <ClassDiagramView
        diagram={diagram}
        selectedTypeId={selected}
        onSelectType={handleTypeClick}
        compact
      />
      {relationshipList}
    </>
  );

  if (isMobile) {
    // Tabs, not a squeezed three-column grid. Each pane gets the full
    // width, which is the only way the inspector's member rows fit.
    return (
      <div className="space-y-3" data-testid="lld-workspace">
        <Tabs defaultValue="design" className="gap-0">
          <TabsList className={cn(UNDERLINE_TABS_LIST, "-mx-4 -mt-4 w-auto")}>
            <UnderlineTab value="design" icon={Shapes}>
              Design
            </UnderlineTab>
            <UnderlineTab value="edit" icon={SlidersHorizontal}>
              Edit
            </UnderlineTab>
            <UnderlineTab value="code" icon={Code2}>
              Code
            </UnderlineTab>
          </TabsList>

          <TabsContent value="design" className="mt-3 space-y-3">
            {diagramPane}
            {diagnosticsPanel}
          </TabsContent>

          <TabsContent value="edit" className="mt-3 space-y-3">
            {inspector}
            {rationalePanel}
            {hintsPanel}
          </TabsContent>

          <TabsContent value="code" className="mt-3">
            <div className="border-border h-[60dvh] overflow-hidden rounded-lg border">
              {codePane}
            </div>
          </TabsContent>
        </Tabs>

        {footer}
      </div>
    );
  }

  return (
    <div className="space-y-4" data-testid="lld-workspace">
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">{diagramPane}</div>
        <div className="min-w-0 space-y-3">
          {inspector}
          {diagnosticsPanel}
        </div>
      </div>

      <div className="border-border h-[45vh] overflow-hidden rounded-lg border">
        {codePane}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        {rationalePanel}
        <div>{hintsPanel}</div>
      </div>

      {footer}
    </div>
  );
}
