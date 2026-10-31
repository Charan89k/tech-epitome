import type { Metadata } from "next";
import Link from "next/link";

import { CampusNotice } from "@/components/campus/notice";
import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requireMember } from "@/lib/tenancy/context";
import { route } from "@/lib/utils";
import { listBanks } from "@/services/campus-banks";

import { createBankAction } from "@/app/(shell)/campus/learning-actions";

export const metadata: Metadata = { title: "Question banks" };

/** Staff only: banks hold answers, so students never reach this page. */
export default async function BanksPage({
  params,
  searchParams,
}: PageProps<"/campus/[slug]/banks">) {
  const { slug } = await params;
  const { msg } = await searchParams;
  const ctx = await requireMember(slug, "banks.manage");
  const banks = await listBanks(ctx);
  const base = `/campus/${ctx.institution.slug}`;

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Question banks"
        description={`Reusable questions for ${ctx.institution.name}'s assessments. Shared with all staff; students never see them.`}
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: "Question banks" }]} />}
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>
      {banks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No banks yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {banks.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between gap-3 px-4 py-3"
            >
              <Link
                href={route(`${base}/banks/${b.id}`)}
                className="font-medium hover:underline"
              >
                {b.name}
              </Link>
              <span className="text-xs text-muted-foreground">
                {b._count.questions}{" "}
                {b._count.questions === 1 ? "question" : "questions"}
              </span>
            </li>
          ))}
        </ul>
      )}
      <form
        action={createBankAction.bind(null, ctx.institution.slug)}
        className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label htmlFor="bank-name" className="text-sm font-medium">
            New bank name
          </label>
          <Input id="bank-name" name="name" required maxLength={120} className="mt-1" />
        </div>
        <Button type="submit">Create bank</Button>
      </form>
    </div>
  );
}
