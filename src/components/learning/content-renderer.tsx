import { ArchitectureDiagram } from "@/components/diagram/architecture-diagram";
import { Callout } from "@/components/learning/callout";
import { CodeBlock } from "@/components/learning/code-block";
import { ComplexityCard } from "@/components/learning/complexity-card";
import { ConceptCard } from "@/components/learning/concept-card";
import { InlineContent } from "@/components/learning/inline-content";
import {
  ProblemListBlock,
  type LinkedProblem,
} from "@/components/learning/problem-list-block";
import { Quiz } from "@/components/learning/quiz";
import { RecognitionDrill } from "@/components/learning/recognition-drill";
import { VisualizationBlock } from "@/components/learning/visualization-block";
import { WorkedExample } from "@/components/learning/worked-example";
import { Separator } from "@/components/ui/separator";
import { parseDiagram } from "@/lib/diagram/schema";
import { cn } from "@/lib/utils";
import type { QuizView } from "@/services/quiz";
import type { ContentBlock } from "@/types/content";

/**
 * Renders a content document.
 *
 * Blocks that need data the renderer cannot fetch — quizzes, linked
 * problems, pattern names for a recognition drill — receive it through
 * `resources`, resolved once by the page. That keeps this component
 * synchronous and free of per-block round trips, and means a chapter with
 * twelve problem references still issues one query.
 *
 * A block referencing something missing renders a visible note rather than
 * throwing: bad content should degrade one block, not the page.
 */

export type ContentResources = {
  quizzes: Map<string, QuizView>;
  problems: Map<string, LinkedProblem>;
  patternNames: Map<string, string>;
  signedIn: boolean;
};

export function ContentRenderer({
  blocks,
  resources,
}: {
  blocks: ContentBlock[];
  resources: ContentResources;
}) {
  return (
    <>
      {blocks.map((block, index) => (
        // The wrapper carries the block index, which is the anchor a
        // highlight is stored against — see src/lib/highlights. It is a
        // plain div so the parent's `space-y` still separates blocks
        // exactly as it did when they were the direct children.
        <div key={index} data-block-index={index}>
          <Block block={block} resources={resources} index={index} />
        </div>
      ))}
    </>
  );
}

function Block({
  block,
  resources,
  index,
}: {
  block: ContentBlock;
  resources: ContentResources;
  index: number;
}) {
  switch (block.type) {
    case "heading": {
      const id = block.id ?? slugify(block.text);
      if (block.level === 2) {
        return (
          <h2
            id={id}
            // `first:pt-0` would now always match — every block sits in
            // its own wrapper — so the leading heading is identified by
            // its index instead.
            className={cn(
              "text-foreground scroll-mt-20 text-lg font-semibold tracking-tight",
              index === 0 ? "pt-0" : "pt-6"
            )}
          >
            {block.text}
          </h2>
        );
      }
      return (
        <h3
          id={id}
          className="text-foreground scroll-mt-20 pt-4 text-base font-semibold tracking-tight"
        >
          {block.text}
        </h3>
      );
    }

    case "paragraph":
      return (
        <p className="text-muted-foreground leading-relaxed">
          <InlineContent nodes={block.content} />
        </p>
      );

    case "list": {
      const items = block.items.map((item, i) => (
        <li key={i} className="text-muted-foreground leading-relaxed">
          <InlineContent nodes={item} />
        </li>
      ));
      return block.ordered ? (
        <ol className="marker:text-ember-500/60 list-decimal space-y-1.5 pl-5">
          {items}
        </ol>
      ) : (
        <ul className="marker:text-ember-500/60 list-disc space-y-1.5 pl-5">{items}</ul>
      );
    }

    case "code":
      return (
        <CodeBlock
          code={block.code}
          language={block.language}
          caption={block.caption}
          highlightLines={block.highlightLines}
        />
      );

    case "callout":
      return (
        <Callout tone={block.tone} title={block.title} content={block.content} />
      );

    case "table":
      return (
        <figure className="not-prose border-border bg-card my-5 overflow-hidden rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-border bg-muted/40 border-b">
                  {block.headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="px-4 py-2 text-left text-xs font-medium whitespace-nowrap"
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-border divide-y">
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="text-muted-foreground px-4 py-2 align-top text-sm"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {block.caption && (
            <figcaption className="border-border text-muted-foreground border-t px-4 py-2 text-xs">
              {block.caption}
            </figcaption>
          )}
        </figure>
      );

    case "complexity":
      return <ComplexityCard rows={block.rows} caption={block.caption} />;

    case "concept":
      return <ConceptCard title={block.title} body={block.body} />;

    case "example":
      return (
        <WorkedExample
          title={block.title}
          input={block.input}
          steps={block.steps}
          output={block.output}
        />
      );

    case "architecture":
      return (
        <ArchitectureDiagram
          diagram={parseDiagram(block.diagram, "chapter content")}
          caption={block.caption}
        />
      );

    case "visualization":
      return (
        <VisualizationBlock
          visualizationKey={block.visualizationKey}
          title={block.title}
          input={block.input}
        />
      );

    case "quiz": {
      const quiz = resources.quizzes.get(block.quizSlug);
      if (!quiz) return <MissingBlock label={`quiz "${block.quizSlug}"`} />;
      return <Quiz quiz={quiz} signedIn={resources.signedIn} />;
    }

    case "problems": {
      const problems = block.slugs
        .map((slug) => resources.problems.get(slug))
        .filter((problem): problem is LinkedProblem => Boolean(problem));

      if (problems.length === 0) {
        return <MissingBlock label="the referenced practice problems" />;
      }
      return <ProblemListBlock problems={problems} title={block.title} />;
    }

    case "recognition": {
      const name =
        resources.patternNames.get(block.answerPatternSlug) ??
        block.answerPatternSlug;
      return (
        <RecognitionDrill
          key={index}
          prompt={block.prompt}
          clues={block.clues}
          answerPatternSlug={block.answerPatternSlug}
          answerPatternName={name}
          explanation={block.explanation}
        />
      );
    }

    case "divider":
      return <Separator className="my-8" />;
  }
}

function MissingBlock({ label }: { label: string }) {
  return (
    <div className="not-prose border-border text-muted-foreground my-5 rounded-lg border border-dashed p-4 text-sm">
      This lesson references {label}, which is not published.
    </div>
  );
}

/** Stable heading ids so the table of contents can link to them. */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}
