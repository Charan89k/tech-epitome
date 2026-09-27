import { InlineContent } from "@/components/learning/inline-content";
import type { InlineNode } from "@/types/content";

/** A named idea, pulled out of the prose so it can be scanned and recalled. */
export function ConceptCard({
  title,
  body,
}: {
  title: string;
  body: InlineNode[];
}) {
  return (
    <div className="not-prose border-border bg-card surface-edge my-5 rounded-lg border p-4">
      <p className="text-ember-400 font-mono text-[0.7rem] tracking-wider uppercase">
        Concept
      </p>
      <h4 className="text-foreground mt-1.5 text-sm font-semibold">{title}</h4>
      <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
        <InlineContent nodes={body} />
      </p>
    </div>
  );
}
