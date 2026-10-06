"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { Check, Loader2, Plus, Send, Trash2, Unlink } from "lucide-react";

import { ArchitectureDiagram } from "@/components/diagram/architecture-diagram";
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
import { Textarea } from "@/components/ui/textarea";
import {
  saveDesignAction,
  submitDesignAction,
} from "@/app/(shell)/system-design/actions";
import { diagramObservations } from "@/lib/diagram/layout";
import {
  NODE_KIND_LABELS,
  PALETTE,
  type Diagram,
  type EdgeKind,
  type NodeKind,
} from "@/lib/diagram/types";

/**
 * Where the learner draws their architecture.
 *
 * Structural editing rather than a canvas: you add a component from a
 * closed palette and connect two of them, and the layout decides where the
 * boxes go. Three reasons this is better here than free-form dragging —
 * it works on a phone, it produces a diagram the reviewer can reason about
 * rather than a picture, and it keeps the learner's attention on what
 * talks to what instead of on alignment.
 *
 * Drafts autosave. Submitting is the separate, deliberate act that unlocks
 * the reference architecture, and the server refuses to do it for a design
 * that is basically empty.
 */

type SaveState = "idle" | "saving" | "saved" | "error";

/** Stable, readable ids: `cache-1`, `cache-2`. Kept to the safe alphabet. */
function nextId(diagram: Diagram, kind: NodeKind): string {
  const prefix = kind.replace(/_/g, "-");
  let n = 1;
  while (diagram.nodes.some((node) => node.id === `${prefix}-${n}`)) n += 1;
  return `${prefix}-${n}`;
}

export function DesignWorkspace({
  slug,
  initialDiagram,
  initialNotes,
  alreadySubmitted,
}: {
  slug: string;
  initialDiagram: Diagram;
  initialNotes: string;
  alreadySubmitted: boolean;
}) {
  const [diagram, setDiagram] = useState<Diagram>(initialDiagram);
  const [notes, setNotes] = useState(initialNotes);
  const [selected, setSelected] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [edgeKind, setEdgeKind] = useState<EdgeKind>("sync");
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const [submitting, startSubmit] = useTransition();
  const [submitted, setSubmitted] = useState(alreadySubmitted);

  // Autosave is debounced and skips the first render, so opening an
  // exercise does not immediately write back what was just read.
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dirty = useRef(false);

  const persist = useCallback(
    async (nextDiagram: Diagram, nextNotes: string) => {
      setSaveState("saving");
      const result = await saveDesignAction({
        slug,
        diagram: nextDiagram,
        notes: nextNotes,
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

  useEffect(() => {
    if (!dirty.current) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void persist(diagram, notes), 900);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [diagram, notes, persist]);

  function mutate(next: Diagram) {
    dirty.current = true;
    setDiagram(next);
  }

  function addNode(kind: NodeKind) {
    const id = nextId(diagram, kind);
    mutate({
      ...diagram,
      nodes: [...diagram.nodes, { id, kind, label: NODE_KIND_LABELS[kind] }],
    });
    setSelected(id);
  }

  function removeSelected() {
    if (!selected) return;
    mutate({
      nodes: diagram.nodes.filter((n) => n.id !== selected),
      // Edges touching a removed node go with it, otherwise the stored
      // diagram fails validation on the next save.
      edges: diagram.edges.filter((e) => e.from !== selected && e.to !== selected),
    });
    setSelected(null);
    setConnectFrom(null);
  }

  function handleNodeClick(id: string) {
    if (connectFrom === null) {
      setSelected(id);
      return;
    }
    if (connectFrom === id) {
      setConnectFrom(null);
      return;
    }

    const exists = diagram.edges.some((e) => e.from === connectFrom && e.to === id);
    if (!exists) {
      let n = 1;
      while (diagram.edges.some((e) => e.id === `edge-${n}`)) n += 1;
      mutate({
        ...diagram,
        edges: [
          ...diagram.edges,
          { id: `edge-${n}`, from: connectFrom, to: id, kind: edgeKind },
        ],
      });
    }
    setConnectFrom(null);
  }

  function updateSelected(patch: Partial<{ label: string; note: string }>) {
    if (!selected) return;
    mutate({
      ...diagram,
      nodes: diagram.nodes.map((n) => (n.id === selected ? { ...n, ...patch } : n)),
    });
  }

  function removeEdge(id: string) {
    mutate({ ...diagram, edges: diagram.edges.filter((e) => e.id !== id) });
  }

  function submit() {
    setError(null);
    startSubmit(async () => {
      // Flush any pending autosave first: submitting validates what is in
      // the database, not what is on screen.
      await persist(diagram, notes);
      const result = await submitDesignAction(slug);
      if (result.ok) {
        setSubmitted(true);
      } else {
        setError(result.error);
      }
    });
  }

  const selectedNode = diagram.nodes.find((n) => n.id === selected) ?? null;
  const observations = diagramObservations(diagram);
  const label = (id: string) => diagram.nodes.find((n) => n.id === id)?.label ?? id;

  return (
    <div className="space-y-4" data-testid="design-workspace">
      {/* Toolbar: palette and connect mode */}
      <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-3">
        <div>
          <h3 className="text-[0.68rem] font-medium tracking-wider text-muted-foreground uppercase">
            Add a component
          </h3>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {PALETTE.map((entry) => (
              <button
                key={entry.kind}
                type="button"
                onClick={() => addNode(entry.kind)}
                title={entry.hint}
                className="inline-flex h-7 items-center gap-1 rounded-md border border-border bg-background/60 px-2.5 text-xs text-muted-foreground transition-colors hover:border-ember-500/40 hover:text-ember-300 focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
              >
                <Plus className="size-3" aria-hidden="true" />
                {entry.label}
              </button>
            ))}
          </div>
        </div>

        {/* Connect mode */}
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant={connectFrom ? "default" : "outline"}
            className="h-8"
            disabled={diagram.nodes.length < 2}
            onClick={() =>
              setConnectFrom(connectFrom ? null : (selected ?? diagram.nodes[0]!.id))
            }
          >
            {connectFrom
              ? `Connecting from ${label(connectFrom)} — pick a target`
              : "Connect two components"}
          </Button>

          <Select value={edgeKind} onValueChange={(v) => setEdgeKind(v as EdgeKind)}>
            <SelectTrigger size="sm" className="h-8 w-36 text-xs" aria-label="Connection type">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sync">Synchronous</SelectItem>
              <SelectItem value="async">Asynchronous</SelectItem>
              <SelectItem value="replication">Replication</SelectItem>
            </SelectContent>
          </Select>

          {selected && (
            <Button
              size="sm"
              variant="ghost"
              className="h-8 text-destructive"
              onClick={removeSelected}
            >
              <Trash2 className="size-3.5" />
              Remove {label(selected)}
            </Button>
          )}
        </div>
      </div>

      <ArchitectureDiagram
        diagram={diagram}
        selectedNodeId={selected}
        onSelectNode={handleNodeClick}
        compact
      />

      {/* Selected component editor */}
      {selectedNode && (
        <div className="rounded-lg border border-ember-500/30 bg-ember-500/5 p-3">
          <p className="text-[0.65rem] font-medium tracking-wider text-ember-300 uppercase">
            {NODE_KIND_LABELS[selectedNode.kind]}
          </p>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <label className="text-xs">
              <span className="text-muted-foreground">Label</span>
              <input
                value={selectedNode.label}
                onChange={(e) => updateSelected({ label: e.target.value })}
                maxLength={60}
                className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
            <label className="text-xs">
              <span className="text-muted-foreground">Note — why is it here?</span>
              <input
                value={selectedNode.note ?? ""}
                onChange={(e) => updateSelected({ note: e.target.value })}
                maxLength={120}
                placeholder="write-through, 8 shards…"
                className="mt-1 w-full rounded-md border border-input bg-transparent px-2 py-1 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
            </label>
          </div>
        </div>
      )}

      {/* Connections */}
      {diagram.edges.length > 0 && (
        <div>
          <h3 className="text-xs font-medium">Connections</h3>
          <ul className="mt-2 divide-y divide-[var(--border)] overflow-hidden rounded-lg border border-border">
            {diagram.edges.map((edge) => (
              <li
                key={edge.id}
                className="flex items-center gap-2 px-3 py-1.5 text-xs text-muted-foreground"
              >
                <span className="min-w-0 flex-1 truncate">
                  {label(edge.from)} → {label(edge.to)}
                  <Badge variant="secondary" className="ml-2 text-[0.6rem]">
                    {edge.kind}
                  </Badge>
                </span>
                <button
                  type="button"
                  onClick={() => removeEdge(edge.id)}
                  aria-label={`Remove connection from ${label(edge.from)} to ${label(edge.to)}`}
                  className="rounded p-1 hover:text-destructive focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none"
                >
                  <Unlink className="size-3" />
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Structural observations — facts, never a score. */}
      {observations.length > 0 && (
        <div className="rounded-lg border border-warning/25 bg-warning/5 p-3">
          <p className="text-[0.65rem] font-medium tracking-wider text-warning uppercase">
            Worth a second look
          </p>
          <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground">
            {observations.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Rationale */}
      <div>
        <label htmlFor="design-notes" className="text-xs font-medium">
          Why this design?
        </label>
        <p className="mt-0.5 text-xs text-muted-foreground">
          What did you optimise for, and what did you trade away? An architecture
          without its reasoning is not a design.
        </p>
        <Textarea
          id="design-notes"
          value={notes}
          onChange={(e) => {
            dirty.current = true;
            setNotes(e.target.value);
          }}
          rows={5}
          maxLength={10_000}
          placeholder="I put a cache in front of the database because reads outnumber writes 20:1…"
          className="mt-2 text-sm"
        />
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border pt-4">
        <p className="text-[0.68rem] text-muted-foreground" aria-live="polite">
          {saveState === "saving" && "Saving…"}
          {saveState === "saved" && "Draft saved"}
          {saveState === "error" && "Could not save"}
          {saveState === "idle" && "Changes save automatically"}
        </p>

        {submitted ? (
          <Badge className="gap-1 border border-success/35 bg-success/12 text-success">
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
        <p className="text-[0.65rem] text-muted-foreground/70">
          Submitting unlocks the reference architecture and its trade-offs. Draw your
          own first — comparing is where the learning is.
        </p>
      )}
    </div>
  );
}
