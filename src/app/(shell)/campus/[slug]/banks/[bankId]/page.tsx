import type { Metadata } from "next";

import { CampusNotice } from "@/components/campus/notice";
import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { NativeSelect } from "@/components/ui/native-select";
import { orRefuse } from "@/lib/campus/guard";
import { requireMember } from "@/lib/tenancy/context";
import { getBank, type BankQuestionRow } from "@/services/campus-banks";

import {
  addQuestionAction,
  archiveQuestionAction,
} from "@/app/(shell)/campus/learning-actions";

export const metadata: Metadata = { title: "Question bank" };

const TYPE_LABEL: Record<string, string> = {
  MULTIPLE_CHOICE: "Multiple choice",
  MULTI_SELECT: "Select all",
  TRUE_FALSE: "True/false",
  CODE_OUTPUT: "Code output",
  COMPLEXITY: "Complexity",
};

const selectClass =
  "mt-1 w-full";

export default async function BankPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]/banks/[bankId]">) {
  const { slug, bankId } = await params;
  const { msg } = await searchParams;
  const ctx = await requireMember(slug, "banks.manage");
  const bank = await orRefuse(getBank(ctx, bankId));
  const add = addQuestionAction.bind(null, ctx.institution.slug, bank.id);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title={bank.name}
        description="Editing a question here never changes an assessment that is already published."
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: "Question banks", href: `/campus/${ctx.institution.slug}/banks` }, { label: bank.name }]} />}
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      {bank.questions.length === 0 ? (
        <p className="text-sm text-muted-foreground">No questions yet.</p>
      ) : (
        <ol className="space-y-3">
          {bank.questions.map((q, i) => (
            <QuestionCard
              key={q.id}
              index={i}
              question={q}
              slug={ctx.institution.slug}
              editable={bank.editable}
            />
          ))}
        </ol>
      )}

      {bank.editable ? (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <form action={add} className="space-y-3 rounded-lg border border-border p-4">
            <h2 className="text-base font-semibold">Add a choice question</h2>
            <input type="hidden" name="kind" value="CHOICE" />
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <label htmlFor="c-type" className="text-sm font-medium">
                  Type
                </label>
                <NativeSelect id="c-type" name="type" className={selectClass}>
                  {Object.entries(TYPE_LABEL).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </NativeSelect>
              </div>
              <div>
                <label htmlFor="c-category" className="text-sm font-medium">
                  Category
                </label>
                <Input
                  id="c-category"
                  name="category"
                  required
                  maxLength={40}
                  defaultValue="Aptitude"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="c-points" className="text-sm font-medium">
                  Points
                </label>
                <Input
                  id="c-points"
                  name="points"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={1}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label htmlFor="c-prompt" className="text-sm font-medium">
                Question
              </label>
              <Textarea
                id="c-prompt"
                name="prompt"
                required
                maxLength={8000}
                rows={3}
                className="mt-1"
              />
            </div>
            <div>
              <label htmlFor="c-code" className="text-sm font-medium">
                Code snippet (optional)
              </label>
              <Textarea
                id="c-code"
                name="code"
                maxLength={8000}
                rows={2}
                className="mt-1 font-mono"
              />
            </div>
            <div>
              <label htmlFor="c-options" className="text-sm font-medium">
                Options
              </label>
              <Textarea
                id="c-options"
                name="optionLines"
                required
                rows={4}
                maxLength={8000}
                className="mt-1"
                aria-describedby="c-options-hint"
              />
              <p id="c-options-hint" className="mt-1 text-xs text-muted-foreground">
                One per line, 2 to 8. Start correct options with *.
              </p>
            </div>
            <div>
              <label htmlFor="c-explanation" className="text-sm font-medium">
                Explanation (shown after results are released)
              </label>
              <Textarea
                id="c-explanation"
                name="explanation"
                maxLength={4000}
                rows={2}
                className="mt-1"
              />
            </div>
            <Button type="submit">Add question</Button>
          </form>

          <form
            action={add}
            className="space-y-3 self-start rounded-lg border border-border p-4"
          >
            <h2 className="text-base font-semibold">Add a coding question</h2>
            <input type="hidden" name="kind" value="CODING" />
            <div>
              <label htmlFor="p-slug" className="text-sm font-medium">
                Problem slug
              </label>
              <Input
                id="p-slug"
                name="problemSlug"
                required
                pattern="[a-z0-9-]+"
                maxLength={120}
                className="mt-1"
                aria-describedby="p-slug-hint"
              />
              <p id="p-slug-hint" className="mt-1 text-xs text-muted-foreground">
                A published problem, as in /problems/<em>two-sum</em>. Its hidden tests
                grade the answer when code execution is enabled.
              </p>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label htmlFor="p-category" className="text-sm font-medium">
                  Category
                </label>
                <Input
                  id="p-category"
                  name="category"
                  required
                  maxLength={40}
                  defaultValue="Coding"
                  className="mt-1"
                />
              </div>
              <div>
                <label htmlFor="p-points" className="text-sm font-medium">
                  Points
                </label>
                <Input
                  id="p-points"
                  name="points"
                  type="number"
                  min={1}
                  max={100}
                  defaultValue={10}
                  className="mt-1"
                />
              </div>
            </div>
            <div>
              <label htmlFor="p-prompt" className="text-sm font-medium">
                Instructions for students
              </label>
              <Textarea
                id="p-prompt"
                name="prompt"
                required
                maxLength={8000}
                rows={3}
                className="mt-1"
              />
            </div>
            <Button type="submit">Add question</Button>
          </form>
        </div>
      ) : (
        <p className="mt-6 text-sm text-muted-foreground">
          Only the bank&apos;s creator or an institution admin can change it. You can
          still use its questions in your assessments.
        </p>
      )}
    </div>
  );
}

function QuestionCard({
  index,
  question: q,
  slug,
  editable,
}: {
  index: number;
  question: BankQuestionRow;
  slug: string;
  editable: boolean;
}) {
  const correct = new Set(
    Array.isArray(q.answer) ? q.answer : q.answer ? [q.answer] : []
  );
  return (
    <li className="rounded-lg border border-border p-4 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold">{index + 1}.</span>
        <Badge variant="outline">{q.category}</Badge>
        <span className="text-xs text-muted-foreground">
          {q.kind === "CODING" ? "Coding" : TYPE_LABEL[q.type ?? ""]} · {q.points} pts
        </span>
        {editable && (
          <form
            action={archiveQuestionAction.bind(null, slug, q.id)}
            className="ml-auto"
          >
            <Button type="submit" variant="ghost" size="xs">
              Remove
            </Button>
          </form>
        )}
      </div>
      <p className="mt-2 whitespace-pre-wrap">{q.prompt}</p>
      {q.code && (
        <pre className="mt-2 overflow-x-auto rounded-md bg-muted p-2 text-xs">
          {q.code}
        </pre>
      )}
      {q.kind === "CHOICE" ? (
        <ul className="mt-2 space-y-1">
          {q.options.map((o) => (
            <li
              key={o.id}
              className={correct.has(o.id) ? "font-medium text-success" : undefined}
            >
              {correct.has(o.id) ? "✓ " : "· "}
              {o.text}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-muted-foreground">
          Problem:{" "}
          {q.problem ? `${q.problem.title} (${q.problem.slug})` : "unavailable"}
        </p>
      )}
    </li>
  );
}
