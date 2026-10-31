import type { Metadata } from "next";
import Link from "next/link";

import { CampusNotice } from "@/components/campus/notice";
import { DateTimeField } from "@/components/campus/datetime-field";
import { When } from "@/components/campus/when";
import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { orRefuse } from "@/lib/campus/guard";
import { PHASE_LABEL } from "@/lib/campus/rules";
import {
  InstitutionError,
  requireMember,
  type MemberContext,
} from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import {
  getStaffAssessment,
  listSubmissions,
  type StaffAssessment,
} from "@/services/campus-assessments";
import {
  getStudentAssessment,
  type StudentAssessment,
} from "@/services/campus-attempts";
import { listPickableQuestions } from "@/services/campus-banks";

import {
  addItemAction,
  archiveAssessmentAction,
  lifecycleAction,
  removeItemAction,
  startAttemptAction,
  updateAssessmentAction,
} from "@/app/(shell)/campus/learning-actions";

export const metadata: Metadata = { title: "Assessment" };

const selectClass =
  "mt-1 w-full";

/**
 * One assessment. The class's instructors get the authoring and grading
 * view; everyone else who can see it (its students) gets the student view.
 * Which one is decided by the services, not by this page.
 */
export default async function AssessmentPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]/assessments/[assessmentId]">) {
  const { slug, assessmentId } = await params;
  const { msg } = await searchParams;
  const ctx = await requireMember(slug);

  let staff: StaffAssessment | null = null;
  try {
    staff = await getStaffAssessment(ctx, assessmentId);
  } catch (error) {
    if (!(error instanceof InstitutionError)) throw error;
  }

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      {staff ? (
        <StaffView ctx={ctx} a={staff} msg={msg} />
      ) : (
        <StudentView
          ctx={ctx}
          a={await orRefuse(getStudentAssessment(ctx, assessmentId))}
          msg={msg}
        />
      )}
    </div>
  );
}

type RuleFields = {
  opensAt?: Date | null;
  closesAt: Date;
  lateUntil?: Date | null;
  latePenaltyPercent: number;
  durationMinutes?: number | null;
  maxAttempts: number;
  scorePolicy: "BEST" | "LATEST";
};

function Rules({ a }: { a: RuleFields }) {
  return (
    <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-xs text-muted-foreground">Opens</dt>
        <dd>{a.opensAt ? <When date={a.opensAt} /> : "When published"}</dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Deadline</dt>
        <dd>
          <When date={a.closesAt} />
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Late submissions</dt>
        <dd>
          {a.lateUntil ? (
            <>
              Until <When date={a.lateUntil} />
              {a.latePenaltyPercent > 0 && `, minus ${a.latePenaltyPercent}%`}
            </>
          ) : (
            "Not accepted"
          )}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Time limit</dt>
        <dd>
          {a.durationMinutes
            ? `${a.durationMinutes} minutes per attempt`
            : "Until the deadline"}
        </dd>
      </div>
      <div>
        <dt className="text-xs text-muted-foreground">Attempts</dt>
        <dd>
          {a.maxAttempts}
          {a.maxAttempts > 1 &&
            `, ${a.scorePolicy === "BEST" ? "best" : "latest"} counts`}
        </dd>
      </div>
    </dl>
  );
}

// ---------------------------------------------------------------------------
// Student
// ---------------------------------------------------------------------------

function StudentView({
  ctx,
  a,
  msg,
}: {
  ctx: MemberContext;
  a: StudentAssessment;
  msg: string | string[] | undefined;
}) {
  const base = `/campus/${ctx.institution.slug}`;
  return (
    <>
      <PageHeader
        title={a.title}
        description={PHASE_LABEL[a.phase]}
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: "Class", href: `${base}/classes/${a.cohortId}` }, { label: a.title }]} />}
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>
      {a.instructions && (
        <p className="mb-6 text-sm whitespace-pre-wrap">{a.instructions}</p>
      )}
      <Rules a={a} />
      <p className="mt-4 text-xs text-muted-foreground">
        Answers save as you go. If your connection drops, everything already saved still
        counts, and the attempt closes by itself at its time limit or the deadline. Work
        saved after the deadline, inside the late window, is marked late.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-3">
        {a.openAttemptId ? (
          <Button asChild>
            <Link href={route(`${base}/attempts/${a.openAttemptId}`)}>
              Resume attempt
            </Link>
          </Button>
        ) : a.canStart ? (
          <form action={startAttemptAction.bind(null, ctx.institution.slug, a.id)}>
            <Button type="submit">
              {a.attempts.length === 0 ? "Start" : "Start another attempt"}
            </Button>
          </form>
        ) : (
          <p className="text-sm text-muted-foreground">
            {a.phase === "scheduled"
              ? "Not open yet."
              : a.phase === "closed" || a.phase === "archived"
                ? "Closed."
                : "No attempts left."}
          </p>
        )}
        <span className="text-xs text-muted-foreground">
          {a.attempts.length} of {a.maxAttempts} attempts used
        </span>
      </div>

      {a.attempts.length > 0 && (
        <section aria-labelledby="attempts-heading" className="mt-8">
          <h2 id="attempts-heading" className="text-base font-semibold">
            Your attempts
          </h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">
            {a.attempts.map((t) => (
              <li
                key={t.id}
                className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
              >
                <Link
                  href={route(`${base}/attempts/${t.id}`)}
                  className="font-medium hover:underline"
                >
                  Attempt {t.number}
                </Link>
                <span className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {t.status === "IN_PROGRESS" ? (
                    <>
                      In progress, closes <When date={t.deadlineAt} />
                    </>
                  ) : (
                    <>
                      Submitted <When date={t.submittedAt} />
                    </>
                  )}
                  {t.late && <Badge variant="warning">Late</Badge>}
                  {t.score !== null && (
                    <span className="font-medium text-foreground">
                      {t.score}
                      {a.maxScore ? ` / ${a.maxScore}` : ""}
                      {t.pendingGrading && " (provisional)"}
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-xs text-muted-foreground">
            {a.resultsReleased
              ? "Results are released: open an attempt to see answers and feedback."
              : "Answers and feedback appear once your instructor releases results."}
          </p>
          {a.finalScore !== null && (
            <p className="mt-2 text-sm">
              Counted score: <span className="font-semibold">{a.finalScore}</span>
            </p>
          )}
        </section>
      )}
    </>
  );
}

// ---------------------------------------------------------------------------
// Staff
// ---------------------------------------------------------------------------

async function StaffView({
  ctx,
  a,
  msg,
}: {
  ctx: MemberContext;
  a: StaffAssessment;
  msg: string | string[] | undefined;
}) {
  const base = `/campus/${ctx.institution.slug}`;
  const draft = a.status === "DRAFT";
  const pickable = draft ? await listPickableQuestions(ctx) : [];
  const submissions = draft ? [] : await listSubmissions(ctx, a.id);
  const step = (s: "publish" | "unpublish" | "close" | "release") =>
    lifecycleAction.bind(null, ctx.institution.slug, a.id, s);
  const s = a.settings;
  const iso = (d: Date | null | undefined) => d?.toISOString() ?? null;

  return (
    <>
      <PageHeader
        title={a.title}
        description={`${PHASE_LABEL[a.phase]}${a.publishedAt && !draft ? " · questions frozen" : ""}`}
        eyebrow={
          <CampusTrail
            items={[
              { label: ctx.institution.name, href: base },
              { label: "Class", href: `${base}/classes/${a.cohortId}` },
              { label: a.title },
            ]}
          />
        }
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={route(`${base}/assessments/${a.id}/preview`)}>Preview</Link>
          </Button>
        }
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      <section aria-label="Lifecycle" className="flex flex-wrap items-center gap-2">
        {draft && (
          <form action={step("publish")}>
            <Button type="submit" disabled={a.items.length === 0}>
              Publish
            </Button>
          </form>
        )}
        {a.status === "PUBLISHED" && (
          <>
            {a.attemptCount === 0 && (
              <form action={step("unpublish")}>
                <Button type="submit" variant="outline">
                  Unpublish
                </Button>
              </form>
            )}
            <form action={step("close")}>
              <Button type="submit" variant="outline">
                Close now
              </Button>
            </form>
          </>
        )}
        {a.phase === "closed" && !a.resultsReleasedAt && (
          <form action={step("release")}>
            <Button type="submit">Release results</Button>
          </form>
        )}
        {(a.status === "CLOSED" || draft) && (
          <form action={archiveAssessmentAction.bind(null, ctx.institution.slug, a.id)}>
            <Button type="submit" variant="ghost">
              Archive
            </Button>
          </form>
        )}
        <p className="w-full text-xs text-muted-foreground">
          Publishing freezes the questions. After that only the deadline can move, and
          unpublishing works only until the first student starts. Closing ends every
          open attempt with its saved answers. All of these are written to the audit
          log.
        </p>
      </section>

      <section aria-labelledby="settings-heading" className="mt-8">
        <h2 id="settings-heading" className="text-base font-semibold">
          Settings
        </h2>
        <form
          action={updateAssessmentAction.bind(null, ctx.institution.slug, a.id)}
          className="mt-3 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
        >
          {draft ? (
            <>
              <div className="sm:col-span-2">
                <label htmlFor="s-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="s-title"
                  name="title"
                  defaultValue={s.title}
                  required
                  maxLength={160}
                  className="mt-1"
                />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="s-instructions" className="text-sm font-medium">
                  Instructions for students
                </label>
                <Textarea
                  id="s-instructions"
                  name="instructions"
                  defaultValue={s.instructions}
                  maxLength={8000}
                  rows={3}
                  className="mt-1"
                />
              </div>
              <DateTimeField
                name="opensAt"
                label="Opens (optional)"
                defaultValue={iso(s.opensAt)}
              />
            </>
          ) : (
            <>
              {/* Locked after publishing; sent unchanged so only the window moves. */}
              <input type="hidden" name="title" value={s.title} />
              <input type="hidden" name="instructions" value={s.instructions} />
              <input type="hidden" name="opensAt" value={iso(s.opensAt) ?? ""} />
              <input
                type="hidden"
                name="latePenaltyPercent"
                value={s.latePenaltyPercent}
              />
              <input
                type="hidden"
                name="durationMinutes"
                value={s.durationMinutes ?? ""}
              />
              <input type="hidden" name="maxAttempts" value={s.maxAttempts} />
              <input type="hidden" name="scorePolicy" value={s.scorePolicy} />
              {s.showScoreOnSubmit && (
                <input type="hidden" name="showScoreOnSubmit" value="on" />
              )}
            </>
          )}
          <DateTimeField
            name="closesAt"
            label="Deadline"
            defaultValue={iso(s.closesAt)}
            required
          />
          <DateTimeField
            name="lateUntil"
            label="Accept late work until (optional)"
            defaultValue={iso(s.lateUntil)}
          />
          {draft ? (
            <>
              <div>
                <label htmlFor="s-penalty" className="text-sm font-medium">
                  Late penalty (%)
                </label>
                <Input
                  id="s-penalty"
                  name="latePenaltyPercent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={s.latePenaltyPercent}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="s-duration" className="text-sm font-medium">
                  Time limit in minutes (optional)
                </label>
                <Input
                  id="s-duration"
                  name="durationMinutes"
                  type="number"
                  min={1}
                  max={600}
                  defaultValue={s.durationMinutes ?? ""}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="s-attempts" className="text-sm font-medium">
                  Attempts allowed
                </label>
                <Input
                  id="s-attempts"
                  name="maxAttempts"
                  type="number"
                  min={1}
                  max={10}
                  defaultValue={s.maxAttempts}
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="s-policy" className="text-sm font-medium">
                  Which attempt counts
                </label>
                <NativeSelect
                  id="s-policy"
                  name="scorePolicy"
                  defaultValue={s.scorePolicy}
                  className={selectClass}
                >
                  <option value="BEST">Best</option>
                  <option value="LATEST">Latest</option>
                </NativeSelect>
              </div>
              <label className="flex items-start gap-2 text-sm sm:col-span-2">
                <input
                  type="checkbox"
                  name="showScoreOnSubmit"
                  defaultChecked={s.showScoreOnSubmit}
                  className="mt-1"
                />
                Show students their score as soon as they submit. Answers stay hidden
                until you release results.
              </label>
            </>
          ) : (
            <div className="sm:col-span-2">
              <Rules a={s} />
            </div>
          )}
          <div className="sm:col-span-2">
            <Button
              type="submit"
              disabled={a.status === "CLOSED" || a.status === "ARCHIVED"}
            >
              {draft ? "Save settings" : "Move deadline"}
            </Button>
          </div>
        </form>
      </section>

      <section aria-labelledby="questions-heading" className="mt-8">
        <h2 id="questions-heading" className="text-base font-semibold">
          Questions ({a.items.length}, {a.items.reduce((sum, i) => sum + i.points, 0)}{" "}
          points)
        </h2>
        {a.items.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No questions yet.</p>
        ) : (
          <ol className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">
            {a.items.map((item) => (
              <li
                key={item.index}
                className="flex items-start justify-between gap-3 px-4 py-3"
              >
                <div className="min-w-0">
                  <span className="mr-2 text-xs text-muted-foreground">
                    {item.index + 1}.{" "}
                    {item.kind === "CODING" ? "Coding" : item.category} · {item.points}{" "}
                    pts
                  </span>
                  <p className="line-clamp-2">{item.prompt}</p>
                </div>
                {draft && (
                  <form
                    action={removeItemAction.bind(
                      null,
                      ctx.institution.slug,
                      a.id,
                      item.index
                    )}
                  >
                    <Button type="submit" variant="ghost" size="xs">
                      Remove
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ol>
        )}
        {draft && pickable.length > 0 && (
          <form
            action={addItemAction.bind(null, ctx.institution.slug, a.id)}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="min-w-0 flex-1">
              <label htmlFor="add-question" className="text-sm font-medium">
                Add from a question bank
              </label>
              <NativeSelect
                id="add-question"
                name="questionId"
                required
                className={selectClass}
              >
                {pickable.map((q) => (
                  <option key={q.id} value={q.id}>
                    {q.bank.name} · {q.kind === "CODING" ? "Coding" : q.category} ·{" "}
                    {q.prompt.slice(0, 80)}
                  </option>
                ))}
              </NativeSelect>
            </div>
            <div className="sm:w-28">
              <label htmlFor="add-points" className="text-sm font-medium">
                Points
              </label>
              <Input
                id="add-points"
                name="points"
                type="number"
                min={1}
                max={100}
                placeholder="Default"
                className="mt-1"
              />
            </div>
            <Button type="submit">Add</Button>
          </form>
        )}
        {draft && pickable.length === 0 && (
          <p className="mt-2 text-xs text-muted-foreground">
            No questions to add yet.{" "}
            <Link href={route(`${base}/banks`)} className="underline">
              Create a question bank
            </Link>{" "}
            first.
          </p>
        )}
      </section>

      {!draft && (
        <section aria-labelledby="submissions-heading" className="mt-8">
          <h2 id="submissions-heading" className="text-base font-semibold">
            Submissions
          </h2>
          {submissions.length === 0 ? (
            <p className="mt-2 text-sm text-muted-foreground">No attempts yet.</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-lg border border-border">
              <table className="w-full min-w-[40rem] text-sm">
                <caption className="sr-only">Attempts for {a.title}</caption>
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      Student
                    </th>
                    <th scope="col" className="px-2 py-2.5 font-medium">
                      Attempt
                    </th>
                    <th scope="col" className="px-2 py-2.5 font-medium">
                      Status
                    </th>
                    <th scope="col" className="px-2 py-2.5 font-medium">
                      Score
                    </th>
                    <th scope="col" className="px-4 py-2.5 font-medium">
                      <span className="sr-only">Open</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {submissions.map((r) => (
                    <tr key={r.attemptId}>
                      <td className="px-4 py-2">{r.student.name ?? r.student.email}</td>
                      <td className="px-2 py-2">{r.number}</td>
                      <td className="px-2 py-2">
                        <span className="flex flex-wrap items-center gap-1">
                          {r.status === "IN_PROGRESS" ? "In progress" : "Submitted"}
                          {r.late && <Badge variant="warning">Late</Badge>}
                          {r.needsGrading && (
                            <Badge variant="outline">Needs grading</Badge>
                          )}
                        </span>
                      </td>
                      <td className="px-2 py-2 tabular-nums">
                        {r.score === null ? "—" : `${r.score} / ${r.maxScore}`}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <Link
                          href={route(`${base}/attempts/${r.attemptId}`)}
                          className="underline"
                        >
                          {r.status === "SUBMITTED" ? "Grade" : "View"}
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}
    </>
  );
}
