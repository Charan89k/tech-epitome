import type { Metadata } from "next";

import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { requireMember } from "@/lib/tenancy/context";
import { listInstitutionAudit } from "@/services/institutions";

export const metadata: Metadata = { title: "Audit log" };

/** Append-only record of every administrative change in this college. */
export default async function InstitutionAuditPage({
  params,
}: PageProps<"/campus/[slug]/audit">) {
  const { slug } = await params;
  const ctx = await requireMember(slug, "audit.view");
  const rows = await listInstitutionAudit(ctx);

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: "Audit log" }]} />}
        title="Audit log"
        description={`Administrative changes in ${ctx.institution.name}, newest first. Entries cannot be edited or deleted.`}
      />
      <div className="mt-6 overflow-x-auto rounded-lg border border-border">
        <table className="w-full min-w-[40rem] text-sm">
          <caption className="sr-only">Audit log for {ctx.institution.name}</caption>
          <thead>
            <tr className="border-b border-border bg-muted/40 text-left [&>th]:label-mono [&>th]:font-normal">
              <th scope="col" className="px-4 py-2.5 font-medium">
                When (UTC)
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                Who
              </th>
              <th scope="col" className="px-2 py-2.5 font-medium">
                What
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3 text-xs whitespace-nowrap text-muted-foreground tabular-nums">
                  {row.createdAt.toISOString().replace("T", " ").slice(0, 16)}
                </td>
                <td className="px-2 py-3 text-xs">{row.actorEmail}</td>
                <td className="px-2 py-3">
                  <span className="block">{row.summary}</span>
                  <span className="block font-mono text-xs text-muted-foreground">
                    {row.action}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
