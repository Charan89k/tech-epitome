import {
  ContentRenderer,
  type ContentResources,
} from "@/components/learning/content-renderer";
import { parseContent } from "@/lib/validation/content";
import type { PaperQuestion } from "@/services/campus-assessments";

const NO_RESOURCES: ContentResources = {
  quizzes: new Map(),
  problems: new Map(),
  patternNames: new Map(),
  signedIn: true,
};

/**
 * The read-only part of a question: prompt, snippet and, for coding, the
 * problem statement with its sample tests. Rendered on the server from the
 * frozen paper, so it never carries an answer and never links out to the
 * practice page (which has hints and solutions).
 */
export function QuestionPrompt({ question: q }: { question: PaperQuestion }) {
  return (
    <div className="space-y-3 text-sm">
      <p className="whitespace-pre-wrap">{q.prompt}</p>
      {q.code && (
        <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs">{q.code}</pre>
      )}
      {q.problem && (
        <div className="rounded-md border border-border p-3">
          <p className="font-medium">{q.problem.title}</p>
          <div className="prose-sm mt-2">
            <ContentRenderer
              blocks={parseContent(q.problem.statement, `exam:${q.problem.slug}`)}
              resources={NO_RESOURCES}
            />
          </div>
          {q.problem.samples.length > 0 && (
            <div className="mt-3 space-y-2">
              {q.problem.samples.map((s, i) => (
                <div key={i} className="grid gap-2 text-xs sm:grid-cols-2">
                  <div>
                    <p className="text-muted-foreground">Sample input {i + 1}</p>
                    <pre className="overflow-x-auto rounded bg-muted p-2">
                      {s.input}
                    </pre>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expected output</p>
                    <pre className="overflow-x-auto rounded bg-muted p-2">
                      {s.expected}
                    </pre>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
