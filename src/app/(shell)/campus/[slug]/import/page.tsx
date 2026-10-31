import type { Metadata } from "next";

import { RosterImport } from "@/components/campus/roster-import";
import { CampusTrail } from "@/components/campus/campus-trail";
import { PageHeader } from "@/components/common/page-header";
import { requireMember } from "@/lib/tenancy/context";

export const metadata: Metadata = { title: "Import roster" };

/** Roster import for those who may invite (faculty: students only). */
export default async function ImportPage({
  params,
}: PageProps<"/campus/[slug]/import">) {
  const { slug } = await params;
  const ctx = await requireMember(slug, "members.invite");

  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Import roster"
        description={`Invite many people to ${ctx.institution.name} from a CSV.`}
        eyebrow={<CampusTrail items={[{ label: ctx.institution.name, href: `/campus/${ctx.institution.slug}` }, { label: "Import roster" }]} />}
      />
      <div className="mt-6 space-y-2 text-sm text-muted-foreground">
        <p>
          Columns: <code>email</code> (required), <code>role</code> (STUDENT, FACULTY or
          INSTITUTION_ADMIN; empty means STUDENT) and <code>class</code> (an existing
          class name you manage). Up to 200 rows, 100 KB.
        </p>
        <p>
          New addresses get an emailed invitation. Existing members with a class are
          added to it. Anyone already a member or already invited is skipped, so
          importing the same file again sends nothing new. Suspended or revoked members
          are not brought back by an import.
        </p>
      </div>
      <div className="mt-6">
        <RosterImport slug={ctx.institution.slug} />
      </div>
    </div>
  );
}
