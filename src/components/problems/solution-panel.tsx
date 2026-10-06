"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, BookOpen, Eye, Loader2 } from "lucide-react";

import { revealSolutionAction } from "@/app/(shell)/problems/actions";
import { CodeBlock } from "@/components/learning/code-block";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LANGUAGE_LABEL } from "@/lib/code-execution/signature";
import type { Language } from "@/generated/prisma/enums";

export type SolutionView = {
  title: string;
  intuition: string;
  approach: string[];
  code: Record<string, string>;
  timeComplexity: string;
  spaceComplexity: string;
  edgeCases: string[];
  commonMistakes: string[];
};

/**
 * Multi-approach solutions, behind a deliberate reveal.
 *
 * Solutions are ordered worst-to-best so the reader walks the same path they
 * would in an interview: the brute force, the observation that improves it,
 * then the optimal approach. Jumping straight to the optimal code teaches
 * the code and not the reasoning, which is why the intuition comes first and
 * the listing comes last.
 */
export function SolutionPanel({
  slug,
  solutions,
  alreadyViewed,
  signedIn,
  withheldApproaches = 0,
}: {
  slug: string;
  solutions: SolutionView[];
  alreadyViewed: boolean;
  signedIn: boolean;
  /** Earlier approaches held back by the plan gate. */
  withheldApproaches?: number;
}) {
  const [revealed, setRevealed] = useState(alreadyViewed);
  const [pending, startTransition] = useTransition();

  if (solutions.length === 0) return null;

  function reveal() {
    startTransition(async () => {
      if (signedIn) await revealSolutionAction(slug);
      setRevealed(true);
    });
  }

  if (!revealed) {
    return (
      <section
        aria-labelledby="solution"
        className="border-border bg-card rounded-lg border p-5 text-center"
      >
        <BookOpen className="text-muted-foreground mx-auto size-5" aria-hidden="true" />
        <h2 id="solution" className="mt-2.5 text-sm font-semibold">
          {solutions.length === 1
            ? "Solution"
            : `${solutions.length} approaches, worst to best`}
        </h2>
        <p className="text-muted-foreground mx-auto mt-1.5 max-w-sm text-xs leading-relaxed">
          Struggling is where the learning happens. Open this once you have
          genuinely tried, or once the hints have run out.
        </p>
        <Button variant="outline" size="sm" className="mt-4" onClick={reveal} disabled={pending}>
          {pending ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Eye className="size-4" />
          )}
          Reveal solution
        </Button>
      </section>
    );
  }

  return (
    <section aria-labelledby="solution" className="space-y-4">
      <h2 id="solution" className="text-sm font-semibold">
        {solutions.length === 1 ? "Solution" : "Approaches"}
      </h2>

      {withheldApproaches > 0 && (
        <p className="border-border text-muted-foreground rounded-lg border border-dashed p-3 text-xs leading-relaxed">
          {withheldApproaches} earlier approach
          {withheldApproaches === 1 ? "" : "es"} — the brute force and the
          observation that improves on it — {withheldApproaches === 1 ? "is" : "are"}{" "}
          shown once you sign in. It is free, and the optimal solution is below
          either way.
        </p>
      )}

      {solutions.map((solution, index) => (
        <article
          key={solution.title}
          className="border-border bg-card overflow-hidden rounded-lg border"
        >
          <header className="border-border bg-muted/40 flex items-center justify-between gap-3 border-b px-4 py-2.5">
            <h3 className="text-sm font-medium">
              <span className="text-muted-foreground mr-2 font-mono text-xs">
                {index + 1}
              </span>
              {solution.title}
            </h3>
            <span className="text-ember-300 shrink-0 font-mono text-[0.68rem]">
              {solution.timeComplexity} · {solution.spaceComplexity}
            </span>
          </header>

          <div className="space-y-4 p-4">
            <div>
              <h4 className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
                Intuition
              </h4>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {solution.intuition}
              </p>
            </div>

            {solution.approach.length > 0 && (
              <div>
                <h4 className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
                  Algorithm
                </h4>
                <ol className="marker:text-ember-500/60 mt-1.5 list-decimal space-y-1 pl-5">
                  {solution.approach.map((step) => (
                    <li key={step} className="text-muted-foreground text-sm leading-relaxed">
                      {step}
                    </li>
                  ))}
                </ol>
              </div>
            )}

            <SolutionCode code={solution.code} />

            {solution.edgeCases.length > 0 && (
              <div>
                <h4 className="text-muted-foreground text-[0.68rem] font-medium tracking-wider uppercase">
                  Edge cases
                </h4>
                <ul className="marker:text-muted-foreground/40 mt-1.5 list-disc space-y-1 pl-5">
                  {solution.edgeCases.map((item) => (
                    <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {solution.commonMistakes.length > 0 && (
              <div className="border-warning/25 bg-warning/5 rounded-md border p-3">
                <h4 className="text-warning flex items-center gap-1.5 text-[0.68rem] font-medium tracking-wider uppercase">
                  <AlertTriangle className="size-3" aria-hidden="true" />
                  Common mistakes
                </h4>
                <ul className="marker:text-warning/40 mt-1.5 list-disc space-y-1 pl-5">
                  {solution.commonMistakes.map((item) => (
                    <li key={item} className="text-muted-foreground text-sm leading-relaxed">
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </article>
      ))}
    </section>
  );
}

function SolutionCode({ code }: { code: Record<string, string> }) {
  const languages = Object.keys(code) as Language[];
  if (languages.length === 0) return null;

  if (languages.length === 1) {
    return (
      <CodeBlock
        code={code[languages[0]!]!}
        language={LANGUAGE_LABEL[languages[0]!] ?? languages[0]!}
      />
    );
  }

  return (
    <Tabs defaultValue={languages[0]}>
      <TabsList className="h-8">
        {languages.map((language) => (
          <TabsTrigger key={language} value={language} className="h-6 text-xs">
            {LANGUAGE_LABEL[language] ?? language}
          </TabsTrigger>
        ))}
      </TabsList>
      {languages.map((language) => (
        <TabsContent key={language} value={language}>
          <CodeBlock code={code[language]!} language={LANGUAGE_LABEL[language] ?? language} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
