import type { Metadata } from "next";
import Link from "next/link";

import { CampusNotice } from "@/components/campus/notice";
import { DateTimeField } from "@/components/campus/datetime-field";
import { When } from "@/components/campus/when";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { orRefuse } from "@/lib/campus/guard";
import { PHASE_LABEL, phaseOf } from "@/lib/campus/rules";
import { requireMember } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import {
  classProgress,
  getClass,
  listAssignableContent,
  myAssignmentProgress,
} from "@/services/campus-classes";

import {
  addClassMemberAction,
  archiveAssignmentAction,
  archiveClassAction,
  assignContentAction,
  createAssessmentAction,
  removeClassMemberAction,
} from "@/app/(shell)/campus/learning-actions";

export const metadata: Metadata = { title: "Class" };

const KIND_LABEL = { COURSE: "Course", CHAPTER: "Lesson", PROBLEM: "Problem" } as const;

/**
 * One class. Students see what is assigned to them, when it is due and
 * their own progress. Instructors also manage the roster, assign content,
 * create assessments and see each student's progress on assigned items.
 * The services decide who sees what; this page only lays it out.
 */
export default async function ClassPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]/classes/[classId]">) {
  const { slug, classId } = await params;
  const { msg } = await searchParams;
  const ctx = await requireMember(slug);
  const detail = await orRefuse(getClass(ctx, classId));
  const base = `/campus/${ctx.institution.slug}`;
  const now = new Date();

  const [progress, content, mine] = detail.teaching
    ? [await classProgress(ctx, classId), await listAssignableContent(), null]
    : [null, null, await myAssignmentProgress(ctx, classId, detail.assignments)];

  const assessments = detail.assessments
    .filter((a) => detail.teaching || a.status !== "DRAFT")
    .map((a) => ({ ...a, phase: phaseOf(a, now) }));

  return (
    <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={detail.name}
        description={detail.description ?? ctx.institution.name}
        actions={
          <Button asChild variant="outline" size="sm">
            <Link href={route(base)}>{ctx.institution.name}</Link>
          </Button>
        }
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      <section aria-labelledby="assessments-heading">
        <h2 id="assessments-heading" className="text-base font-semibold">
          Assessments
        </h2>
        {assessments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">No assessments yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {assessments.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-1 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <Link
                  href={route(`${base}/assessments/${a.id}`)}
                  className="font-medium hover:underline"
                >
                  {a.title}
                </Link>
                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant={a.phase === "open" ? "success" : "outline"}>
                    {PHASE_LABEL[a.phase]}
                  </Badge>
                  {a.phase === "scheduled" && (
                    <span>
                      Opens <When date={a.opensAt} />
                    </span>
                  )}
                  <span>
                    Due <When date={a.closesAt} />
                  </span>
                  {a.durationMinutes && <span>{a.durationMinutes} min</span>}
                </div>
              </li>
            ))}
          </ul>
        )}
        {detail.teaching && (
          <details className="mt-3 rounded-lg border border-border p-4">
            <summary className="cursor-pointer text-sm font-medium">
              New assessment
            </summary>
            <form
              action={createAssessmentAction.bind(null, ctx.institution.slug, classId)}
              className="mt-3 grid gap-3 sm:grid-cols-2"
            >
              <div className="sm:col-span-2">
                <label htmlFor="a-title" className="text-sm font-medium">
                  Title
                </label>
                <Input
                  id="a-title"
                  name="title"
                  required
                  maxLength={160}
                  className="mt-1"
                />
              </div>
              <DateTimeField name="closesAt" label="Deadline" required />
              <DateTimeField
                name="opensAt"
                label="Opens (optional)"
                hint="Empty: opens when published."
              />
              <p className="text-xs text-muted-foreground sm:col-span-2">
                Time limit, attempts, late window and questions are set on the next
                page, before publishing.
              </p>
              <div className="sm:col-span-2">
                <Button type="submit">Create draft</Button>
              </div>
            </form>
          </details>
        )}
      </section>

      <section aria-labelledby="assignments-heading" className="mt-8">
        <h2 id="assignments-heading" className="text-base font-semibold">
          Assigned learning
        </h2>
        {detail.assignments.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">Nothing assigned yet.</p>
        ) : (
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border">
            {detail.assignments.map((a) => {
              const own = mine?.[a.id];
              const done = own ? own.done >= own.total && own.total > 0 : false;
              const overdue = Boolean(a.dueAt && a.dueAt < now && own && !done);
              return (
                <li key={a.id} className="px-4 py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="mr-2 text-xs text-muted-foreground">
                        {KIND_LABEL[a.kind]}
                      </span>
                      {a.href ? (
                        <Link
                          href={route(a.href)}
                          className="font-medium hover:underline"
                        >
                          {a.title}
                        </Link>
                      ) : (
                        <span className="font-medium">{a.title}</span>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                      {a.dueAt && (
                        <span className={overdue ? "text-destructive" : undefined}>
                          {overdue ? "Overdue, was due " : "Due "}
                          <When date={a.dueAt} />
                        </span>
                      )}
                      {own && (
                        <Badge variant={done ? "success" : "outline"}>
                          {done ? "Done" : `${own.done}/${own.total}`}
                        </Badge>
                      )}
                      {detail.teaching && (
                        <form
                          action={archiveAssignmentAction.bind(
                            null,
                            ctx.institution.slug,
                            a.id
                          )}
                        >
                          <Button type="submit" variant="ghost" size="xs">
                            Remove
                          </Button>
                        </form>
                      )}
                    </div>
                  </div>
                  {a.instructions && (
                    <p className="mt-1 text-sm whitespace-pre-wrap text-muted-foreground">
                      {a.instructions}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}

        {content && (
          <form
            action={assignContentAction.bind(null, ctx.institution.slug, classId)}
            className="mt-3 grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-2"
          >
            <div className="sm:col-span-2">
              <label htmlFor="assign-target" className="text-sm font-medium">
                Assign published content
              </label>
              <select
                id="assign-target"
                name="target"
                required
                className="mt-1 block h-8 w-full rounded-lg border border-input bg-background px-2 text-sm"
              >
                {content.courses.map((c) => (
                  <optgroup key={c.id} label={c.title}>
                    <option value={`course:${c.id}`}>Whole course: {c.title}</option>
                    {c.chapters.map((ch) => (
                      <option key={ch.id} value={`chapter:${ch.id}`}>
                        Lesson: {ch.title}
                      </option>
                    ))}
                  </optgroup>
                ))}
                <optgroup label="Problems">
                  {content.problems.map((p) => (
                    <option key={p.id} value={`problem:${p.id}`}>
                      #{p.number} {p.title}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
            <DateTimeField name="dueAt" label="Due (optional)" />
            <div>
              <label htmlFor="assign-instructions" className="text-sm font-medium">
                Instructions (optional)
              </label>
              <Textarea
                id="assign-instructions"
                name="instructions"
                maxLength={4000}
                rows={2}
                className="mt-1"
              />
            </div>
            <div className="sm:col-span-2">
              <Button type="submit">Assign</Button>
            </div>
          </form>
        )}
      </section>

      {progress && detail.assignments.length > 0 && (
        <section aria-labelledby="progress-heading" className="mt-8">
          <h2 id="progress-heading" className="text-base font-semibold">
            Progress on assigned items
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Only what this class was assigned. The rest of each student&apos;s learning
            stays private.
          </p>
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-sm">
              <caption className="sr-only">Student progress on assigned items</caption>
              <thead>
                <tr className="border-b border-border text-left text-xs text-muted-foreground">
                  <th scope="col" className="px-4 py-2.5 font-medium">
                    Student
                  </th>
                  {detail.assignments.map((a) => (
                    <th key={a.id} scope="col" className="px-2 py-2.5 font-medium">
                      {a.title}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {progress.students.map((s) => (
                  <tr key={s.id}>
                    <th scope="row" className="px-4 py-2 text-left font-normal">
                      {s.name ?? s.email}
                    </th>
                    {detail.assignments.map((a) => {
                      const cell = progress.cells[s.id]?.[a.id];
                      return (
                        <td key={a.id} className="px-2 py-2 tabular-nums">
                          {cell ? `${cell.done}/${cell.total}` : "—"}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {detail.members && (
        <section aria-labelledby="roster-heading" className="mt-8">
          <h2 id="roster-heading" className="text-base font-semibold">
            Roster
          </h2>
          <ul className="mt-3 divide-y divide-border rounded-lg border border-border text-sm">
            {detail.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 px-4 py-2"
              >
                <span className="min-w-0 truncate">
                  {m.user.name ?? m.user.email}{" "}
                  <span className="text-muted-foreground">
                    ({m.role === "INSTRUCTOR" ? "instructor" : "student"})
                  </span>
                </span>
                {m.user.id !== ctx.user.id && (
                  <form
                    action={removeClassMemberAction.bind(
                      null,
                      ctx.institution.slug,
                      classId,
                      m.id
                    )}
                  >
                    <Button type="submit" variant="ghost" size="xs">
                      Remove
                    </Button>
                  </form>
                )}
              </li>
            ))}
          </ul>
          <form
            action={addClassMemberAction.bind(null, ctx.institution.slug, classId)}
            className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end"
          >
            <div className="flex-1">
              <label htmlFor="member-email" className="text-sm font-medium">
                Add a member by email
              </label>
              <Input
                id="member-email"
                name="email"
                type="email"
                required
                maxLength={254}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="member-role" className="text-sm font-medium">
                As
              </label>
              <select
                id="member-role"
                name="role"
                className="mt-1 block h-8 rounded-lg border border-input bg-background px-2 text-sm"
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </select>
            </div>
            <Button type="submit">Add</Button>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            They must already be a member of {ctx.institution.name}.
          </p>

          <form
            action={archiveClassAction.bind(null, ctx.institution.slug, classId)}
            className="mt-8 border-t border-border pt-6"
          >
            <Button type="submit" variant="destructive" size="sm">
              Archive class
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
