import type { Metadata } from "next";
import Link from "next/link";
import { Building2 } from "lucide-react";

import { CampusNotice } from "@/components/campus/notice";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { requireUser } from "@/lib/auth/session";
import { prisma } from "@/lib/db";
import { route } from "@/lib/utils";
import { listMyMemberships } from "@/services/institutions";

import { joinByDomainAction, requestVerificationAction } from "./actions";

export const metadata: Metadata = { title: "Campus" };

const ROLE_LABEL = {
  STUDENT: "Student",
  FACULTY: "Faculty",
  INSTITUTION_ADMIN: "Admin",
} as const;

/**
 * Your colleges. Individual learning is unaffected by any of this: a
 * membership adds a college workspace, it never moves or exposes your own
 * progress, notes or submissions.
 */
export default async function CampusPage({ searchParams }: PageProps<"/campus">) {
  const user = await requireUser("/campus");
  const { msg } = await searchParams;
  const [memberships, account] = await Promise.all([
    listMyMemberships(user),
    prisma.user.findUnique({ where: { id: user.id }, select: { emailVerified: true } }),
  ]);
  const verified = Boolean(account?.emailVerified);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:px-6 sm:py-8">
      <PageHeader
        title="Campus"
        description="Colleges you belong to. Your own learning stays yours: a college sees its roster, never your notes, submissions or conversations."
      />
      <div className="mt-6">
        <CampusNotice code={msg} />
      </div>

      {memberships.length === 0 ? (
        <EmptyState
          icon={Building2}
          title="You are not part of a college yet"
          description="Join with an invitation from your college, or with a verified college email address."
          className="rounded-lg border border-border"
        />
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border">
          {memberships.map((m) => (
            <li key={m.institution.slug}>
              <Link
                href={route(`/campus/${m.institution.slug}`)}
                className="flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="font-medium">{m.institution.name}</span>
                <Badge variant="outline">{ROLE_LABEL[m.role]}</Badge>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <section
        aria-labelledby="join-heading"
        className="mt-10 border-t border-border pt-8"
      >
        <h2 id="join-heading" className="text-lg font-semibold">
          Join with your college email
        </h2>
        <p className="mt-1.5 max-w-2xl text-sm text-muted-foreground">
          If your college has verified its email domain, a verified address at that
          domain lets you join as a student. Staff roles are only ever granted by
          invitation.
        </p>
        <p className="mt-4 text-sm">
          {user.email}{" "}
          <Badge variant={verified ? "success" : "warning"} className="ml-1">
            {verified ? "Verified" : "Not verified"}
          </Badge>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          {verified ? (
            <form action={joinByDomainAction}>
              <Button type="submit">Join my college</Button>
            </form>
          ) : (
            <form action={requestVerificationAction}>
              <Button type="submit" variant="outline">
                Send verification email
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
