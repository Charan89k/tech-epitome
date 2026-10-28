import type { Metadata } from "next";
import Link from "next/link";

import { QuestionPrompt } from "@/components/campus/question-prompt";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { orRefuse } from "@/lib/campus/guard";
import { requireMember } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import { previewAssessment } from "@/services/campus-assessments";

export const metadata: Metadata = { title: "Preview" };

/**
 * The paper as students get it, with the key beside each question. Staff
 * who teach the class only. Once published, this shows the frozen version.
 */
export default async function PreviewPage({
  params,
}: PageProps<"/campus/[slug]/assessments/[assessmentId]/preview">) {
  const { slug, assessmentId } = await params;
  const ctx = await requireMember(slug);
  const paper = await orRefuse(previewAssessment(ctx, assessmentId));
  const back = `/campus/${ctx.institution.slug}/assessments/${assessmentId}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Preview"
        description={`${paper.questions.length} questions, ${paper.maxScore} points. ${
          paper.frozen
            ? "This is the published, frozen version."
            : "Draft: this changes until you publish."
        }`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={route(back)}>Back</Link>
          </Button>
        }
      />
      <ol className="mt-6 space-y-6">
        {paper.questions.map((q, i) => {
          const key = paper.key[q.key];
          const correct = new Set(
            Array.isArray(key?.answer) ? key.answer : key?.answer ? [key.answer] : []
          );
          return (
            <li key={q.key} className="rounded-lg border border-border p-4">
              <p className="mb-2 text-sm font-semibold">
                Question {i + 1}{" "}
                <span className="font-normal text-muted-foreground">
                  · {q.points} pts
                </span>
              </p>
              <QuestionPrompt question={q} />
              {q.options.length > 0 && (
                <ul className="mt-3 space-y-1 text-sm">
                  {q.options.map((o) => (
                    <li
                      key={o.id}
                      className={
                        correct.has(o.id) ? "font-medium text-success" : undefined
                      }
                    >
                      {correct.has(o.id) ? "✓ " : "· "}
                      {o.text}
                    </li>
                  ))}
                </ul>
              )}
              {key?.explanation && (
                <p className="mt-3 text-xs text-muted-foreground">
                  Explanation: {key.explanation}
                </p>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
