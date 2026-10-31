import type { Metadata } from "next";
import Link from "next/link";

import { CampusNotice } from "@/components/campus/notice";
import { DateTimeField } from "@/components/campus/datetime-field";
import { When } from "@/components/campus/when";
import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { SectionHeading } from "@/components/common/section-heading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { orRefuse } from "@/lib/campus/guard";
import { PHASE_LABEL, phaseOf } from "@/lib/campus/rules";
import { requireMember } from "@/lib/tenancy/context";
import { cn, route } from "@/lib/utils";
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

  // The overview strip: a student's own standing, or an instructor's view
  // of the class. Every figure comes from what the page already loaded.
  const isDone = (id: string) => {
    const own = mine?.[id];
    return Boolean(own && own.total > 0 && own.done >= own.total);
  };
  const doneCount = detail.assignments.filter((a) => isDone(a.id)).length;
  const overdueCount = detail.assignments.filter(
    (a) => a.dueAt && a.dueAt < now && mine?.[a.id] && !isDone(a.id)
  ).length;
  const openCount = assessments.filter((a) => a.phase === "open").length;
  const overview: { label: string; value: number; alert?: boolean }[] = detail.teaching
    ? [
        { label: "Students", value: progress?.students.length ?? 0 },
        { label: "Assigned items", value: detail.assignments.length },
        { label: "Assessments", value: assessments.length },
        { label: "Open now", value: openCount },
      ]
    : [
        { label: "Assigned items", value: detail.assignments.length },
        { label: "Completed", value: doneCount },
        { label: "Overdue", value: overdueCount, alert: overdueCount > 0 },
        { label: "Assessments open", value: openCount },
      ];
  const completion =
    !detail.teaching && detail.assignments.length > 0
      ? Math.round((doneCount / detail.assignments.length) * 100)
      : null;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={detail.name}
        description={detail.description ?? ctx.institution.name}
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: detail.name }]} />}
      />
      <section aria-label={detail.teaching ? "Class overview" : "Your progress"} className="mt-6">
        <dl className="grid grid-cols-2 border-y border-border sm:grid-cols-4">
          {overview.map((item, index) => (
            <div
              key={item.label}
              className={cn(
                "flex flex-col-reverse gap-0.5 py-3 pr-4",
                index % 2 === 1 && "pl-4 max-sm:border-l max-sm:border-border",
                index > 0 && "sm:border-l sm:border-border sm:pl-4",
                index > 1 && "max-sm:border-t max-sm:border-border"
              )}
            >
              <dt className="label-mono">{item.label}</dt>
              <dd
                className={cn(
                  "font-mono text-xl font-medium tabular-nums",
                  item.alert && "text-destructive"
                )}
              >
                {item.value}
              </dd>
            </div>
          ))}
        </dl>
        {completion !== null && (
          <div className="mt-3 flex items-center gap-3">
            <div
              role="progressbar"
              aria-label="Assigned items completed"
              aria-valuenow={completion}
              aria-valuemin={0}
              aria-valuemax={100}
              className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted"
            >
              <div className="h-full bg-primary" style={{ width: `${completion}%` }} />
            </div>
            <span className="font-mono text-xs text-muted-foreground tabular-nums">
              {completion}%
            </span>
          </div>
        )}
      </section>

      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      <section aria-labelledby="assessments-heading">
        <SectionHeading
          id="assessments-heading"
          title="Assessments"
          count={assessments.length}
          description="Timed exams set by your faculty. Windows are enforced on the server."
        />
        {assessments.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">No assessments yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {assessments.map((a) => (
              <li
                key={a.id}
                className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"
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

      <section aria-labelledby="assignments-heading" className="mt-10">
        <SectionHeading
          id="assignments-heading"
          title="Assigned learning"
          count={detail.assignments.length}
          description="Courses, lessons and problems from Learn. Progress comes from the work itself."
        />
        {detail.assignments.length === 0 ? (
          <p className="py-6 text-sm text-muted-foreground">Nothing assigned yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {detail.assignments.map((a) => {
              const own = mine?.[a.id];
              const done = own ? own.done >= own.total && own.total > 0 : false;
              const overdue = Boolean(a.dueAt && a.dueAt < now && own && !done);
              return (
                <li key={a.id} className="py-3">
                  <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <span className="label-mono mr-2 uppercase">
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
              <NativeSelect
                id="assign-target"
                name="target"
                required
                className="mt-1 w-full"
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
              </NativeSelect>
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
        <section aria-labelledby="progress-heading" className="mt-10">
          <SectionHeading
            id="progress-heading"
            title="Progress on assigned items"
            description="Only what this class was assigned. The rest of each student's learning stays private."
          />
          <div className="mt-3 overflow-x-auto rounded-lg border border-border">
            <table className="w-full min-w-[32rem] text-sm">
              <caption className="sr-only">Student progress on assigned items</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
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
        <section aria-labelledby="roster-heading" className="mt-10">
          <SectionHeading id="roster-heading" title="Roster" count={detail.members.length} />
          <ul className="divide-y divide-border text-sm">
            {detail.members.map((m) => (
              <li
                key={m.id}
                className="flex items-center justify-between gap-3 py-2"
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
              <NativeSelect
                id="member-role"
                name="role"
                className="mt-1"
              >
                <option value="STUDENT">Student</option>
                <option value="INSTRUCTOR">Instructor</option>
              </NativeSelect>
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
