import type { Metadata } from "next";
import Link from "next/link";

import { gradeAnswerAction } from "@/app/(shell)/campus/learning-actions";
import { CampusNotice } from "@/components/campus/notice";
import { ExamRunner } from "@/components/campus/exam-runner";
import { QuestionPrompt } from "@/components/campus/question-prompt";
import { When } from "@/components/campus/when";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orRefuse } from "@/lib/campus/guard";
import { requireMember, type MemberContext } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import {
  getAttemptPaper,
  getAttemptReview,
  type AttemptReview,
} from "@/services/campus-attempts";

export const metadata: Metadata = { title: "Attempt" };

const FINISH_LABEL: Record<string, string> = {
  SUBMITTED: "Submitted by the student",
  TIME_EXPIRED: "Closed when the time limit ran out",
  DEADLINE: "Closed at the deadline",
  CLOSED_BY_STAFF: "Closed when staff closed the assessment",
};

/**
 * One attempt. Its student, while it is open, gets the exam itself; after
 * that, their submission (and, once results are released, answers and
 * feedback). The class's instructors get the submission with the key and
 * a grading form per answer. Anyone else gets a 404.
 */
export default async function AttemptPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]/attempts/[attemptId]">) {
  const { slug, attemptId } = await params;
  const { msg } = await searchParams;
  const ctx = await requireMember(slug);
  const review = await orRefuse(getAttemptReview(ctx, attemptId));
  // The review names the student only for the class's teachers.
  const teacher = review.student !== null;

  if (!teacher && review.status === "IN_PROGRESS") {
    const paper = await orRefuse(getAttemptPaper(ctx, attemptId));
    if (paper.status === "IN_PROGRESS") {
      return (
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
          <PageHeader title={paper.title} description={`Attempt ${review.number}`} />
          {paper.instructions && (
            <p className="mb-4 text-sm whitespace-pre-wrap">{paper.instructions}</p>
          )}
          <ExamRunner
            slug={ctx.institution.slug}
            attemptId={paper.attemptId}
            deadlineAt={paper.deadlineAt.toISOString()}
            serverNow={paper.serverNow.toISOString()}
            saved={paper.answers}
            questions={paper.questions.map((q) => ({
              key: q.key,
              kind: q.kind,
              type: q.type,
              points: q.points,
              options: q.options,
              starterCode: q.problem?.starterCode ?? {},
              prompt: <QuestionPrompt question={q} />,
            }))}
          />
        </div>
      );
    }
    // Time ran out between the two reads: show the closed attempt.
    const closed = await getAttemptReview(ctx, attemptId);
    return <Review ctx={ctx} r={closed} msg={msg} teacher={false} />;
  }

  return <Review ctx={ctx} r={review} msg={msg} teacher={teacher} />;
}

function Review({
  ctx,
  r,
  msg,
  teacher,
}: {
  ctx: MemberContext;
  r: AttemptReview;
  msg: string | string[] | undefined;
  teacher: boolean;
}) {
  const back = `/campus/${ctx.institution.slug}/assessments/${r.assessmentId}`;
  const who = r.student ? `${r.student.name ?? r.student.email}, attempt` : "Attempt";
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={r.title}
        description={`${who} ${r.number}`}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={route(back)}>Back</Link>
          </Button>
        }
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      <div className="flex flex-wrap items-center gap-2 text-sm">
        {r.status === "IN_PROGRESS" ? (
          <Badge variant="outline">In progress</Badge>
        ) : (
          <>
            <span>
              {FINISH_LABEL[r.finish ?? ""] ?? "Submitted"},{" "}
              <When date={r.submittedAt} />
            </span>
            {r.late && <Badge variant="warning">Late</Badge>}
          </>
        )}
        {r.score !== null && (
          <span className="ml-auto font-semibold">
            {r.score} / {r.maxScore}
            {r.needsGrading && " (provisional: coding answers await grading)"}
          </span>
        )}
      </div>
      {!r.showKey && r.status === "SUBMITTED" && (
        <p className="mt-2 text-xs text-muted-foreground">
          Answers and feedback appear once your instructor releases results.
        </p>
      )}

      <ol className="mt-6 space-y-6">
        {r.questions.map((q, i) => (
          <ReviewQuestion
            key={q.key}
            index={i}
            q={q}
            showKey={r.showKey}
            gradeAction={
              teacher && r.status === "SUBMITTED" && q.value !== null
                ? gradeAnswerAction.bind(null, ctx.institution.slug, r.attemptId, q.key)
                : null
            }
          />
        ))}
      </ol>
    </div>
  );
}

function ReviewQuestion({
  index,
  q,
  showKey,
  gradeAction,
}: {
  index: number;
  q: AttemptReview["questions"][number];
  showKey: boolean;
  gradeAction: ((form: FormData) => Promise<never>) | null;
}) {
  const correct = new Set(
    Array.isArray(q.answer) ? q.answer : q.answer ? [q.answer] : []
  );
  const given = new Set(
    Array.isArray(q.value)
      ? (q.value as string[])
      : typeof q.value === "string"
        ? [q.value]
        : []
  );
  const coding = q.value as { language?: string; code?: string } | null;
  const effective = q.awarded ?? q.autoPoints;
  const result = q.autoResult as {
    status?: string;
    passed?: number;
    total?: number;
  } | null;

  return (
    <li className="rounded-lg border border-border p-4">
      <p className="mb-2 flex items-baseline justify-between text-sm font-semibold">
        <span>Question {index + 1}</span>
        <span className="text-xs font-normal text-muted-foreground">
          {showKey && effective !== null ? `${effective} / ` : ""}
          {q.points} pts
        </span>
      </p>
      <QuestionPrompt question={q} />

      {q.kind === "CHOICE" ? (
        <ul className="mt-3 space-y-1 text-sm">
          {q.options.map((o) => (
            <li
              key={o.id}
              className={
                showKey && correct.has(o.id) ? "font-medium text-success" : undefined
              }
            >
              {given.has(o.id) ? "● " : "○ "}
              {o.text}
              {showKey && correct.has(o.id) && " (correct)"}
            </li>
          ))}
          {given.size === 0 && <li className="text-muted-foreground">Not answered.</li>}
        </ul>
      ) : coding?.code ? (
        <div className="mt-3">
          <p className="text-xs text-muted-foreground">{coding.language}</p>
          <pre className="mt-1 max-h-96 overflow-auto rounded-md bg-muted p-3 text-xs">
            {coding.code}
          </pre>
          {showKey && result && (
            <p className="mt-2 text-xs text-muted-foreground">
              Automatic check: {result.passed ?? 0} of {result.total ?? 0} tests passed
              ({result.status}).
            </p>
          )}
        </div>
      ) : (
        <p className="mt-3 text-sm text-muted-foreground">Not answered.</p>
      )}

      {showKey && q.explanation && (
        <p className="mt-3 text-xs text-muted-foreground">
          Explanation: {q.explanation}
        </p>
      )}
      {showKey && q.feedback && (
        <p className="mt-2 rounded-md bg-muted p-2 text-sm">
          <span className="font-medium">Feedback: </span>
          {q.feedback}
        </p>
      )}

      {gradeAction && (
        <form
          action={gradeAction}
          className="mt-4 grid gap-2 border-t border-border pt-3 sm:grid-cols-[8rem_1fr_auto] sm:items-end"
        >
          <div>
            <label htmlFor={`pts-${q.key}`} className="text-xs font-medium">
              Points (max {q.points})
            </label>
            <Input
              id={`pts-${q.key}`}
              name="points"
              type="number"
              step="0.5"
              min={0}
              max={q.points}
              required
              defaultValue={effective ?? ""}
              className="mt-1"
            />
          </div>
          <div>
            <label htmlFor={`fb-${q.key}`} className="text-xs font-medium">
              Feedback
            </label>
            <Textarea
              id={`fb-${q.key}`}
              name="feedback"
              rows={1}
              maxLength={4000}
              defaultValue={q.feedback ?? ""}
              className="mt-1"
            />
          </div>
          <Button type="submit" size="sm">
            Save grade
          </Button>
        </form>
      )}
    </li>
  );
}
