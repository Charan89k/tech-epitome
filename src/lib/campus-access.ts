import "server-only";

import { forbidden, redirect } from "next/navigation";

import { requireUser, requireUserOrThrow, type CurrentUser } from "@/lib/auth/session";
import { listMyMemberships } from "@/services/institutions";

/**
 * Mock interviews, interview insights, preparation tracks and roadmaps are
 * part of Campus, the college offering: a learner reaches them through an
 * active membership of an active institution. Individual learning (courses,
 * patterns, problems, design exercises, the tutor) stays open to everyone.
 * Platform admins pass so they can support colleges.
 */
export async function hasCampusAccess(
  user: Pick<CurrentUser, "id" | "role">
): Promise<boolean> {
  if (user.role === "ADMIN") return true;
  return (await listMyMemberships(user)).length > 0;
}

/** For pages: sign in first, then send a non-member to /campus to join. */
export async function requireCampusUser(returnTo: string): Promise<CurrentUser> {
  const user = await requireUser(returnTo);
  if (!(await hasCampusAccess(user))) redirect("/campus?need=membership");
  return user;
}

/** For server actions: 401 without a session, 403 without a membership. */
export async function requireCampusUserOrThrow(): Promise<CurrentUser> {
  const user = await requireUserOrThrow();
  if (!(await hasCampusAccess(user))) forbidden();
  return user;
}
