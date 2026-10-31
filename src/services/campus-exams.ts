import "server-only";

import type { CurrentUser } from "@/lib/auth/session";
import { setScope, withTenantScope } from "@/lib/tenancy/scope";

import { listMyMemberships } from "./institutions";

export type MyExam = {
  id: string;
  title: string;
  status: string;
  closesAt: Date;
  className: string;
  collegeSlug: string;
  collegeName: string;
  attempts: number;
};

/**
 * Published and closed exams in classes the user is on, across colleges. Each
 * college is read in its own tenant scope, so RLS still bounds every query.
 */
export async function listMyExams(user: Pick<CurrentUser, "id">): Promise<MyExam[]> {
  const memberships = await listMyMemberships(user);
  const perCollege = await Promise.all(
    memberships.map(async ({ institution }) => {
      return withTenantScope({ institutionId: null, userId: user.id }, async (tx) => {
        const college = await tx.institution.findUnique({
          where: { slug: institution.slug },
          select: { id: true },
        });
        if (!college) return [];
        await setScope(tx, { institutionId: college.id, userId: user.id });
        const rows = await tx.assessment.findMany({
          where: {
            institutionId: college.id,
            status: { in: ["PUBLISHED", "CLOSED"] },
            cohort: { members: { some: { userId: user.id, removedAt: null } } },
          },
          orderBy: { closesAt: "asc" },
          take: 200,
          select: {
            id: true,
            title: true,
            status: true,
            closesAt: true,
            cohort: { select: { name: true } },
            attempts: { where: { userId: user.id }, select: { id: true } },
          },
        });
        return rows.map((row) => ({
          id: row.id,
          title: row.title,
          status: row.status,
          closesAt: row.closesAt,
          className: row.cohort.name,
          collegeSlug: institution.slug,
          collegeName: institution.name,
          attempts: row.attempts.length,
        }));
      });
    })
  );
  return perCollege.flat().sort((a, b) => a.closesAt.getTime() - b.closesAt.getTime());
}
