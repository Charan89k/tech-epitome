import "server-only";

import { cache } from "react";
import { forbidden, redirect, unauthorized } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { route } from "@/lib/utils";
import type { Role } from "@/generated/prisma/enums";

/**
 * The single definition of "who is asking" for the whole application.
 *
 * Everything server-side goes through here rather than calling `auth()`
 * directly, so swapping the auth provider later touches this file and not the
 * hundreds of call sites.
 *
 * Tech Epitome is free, so there is no plan to resolve here. The role is
 * read from the database rather than the JWT for the same reason a plan
 * would have been: a token minted before a role change would be stale,
 * and role is the one thing that actually gates anything.
 */

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
};

/**
 * `cache` dedupes this across a single server render pass, so a layout, a
 * page and three server components asking "who is the user" cost one query.
 */
export const getCurrentUser = cache(async (): Promise<CurrentUser | null> => {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      image: true,
      role: true,
    },
  });

  // The session referenced a user that no longer exists - treat as signed out
  // rather than crashing the render.
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
  };
});

/** Convenience for layouts that only need to know whether to show the app shell. */
export async function isSignedIn(): Promise<boolean> {
  return (await getCurrentUser()) !== null;
}

/**
 * Requires a signed-in user, redirecting to login with a return path.
 * Use in pages and layouts, where a redirect is the right UX.
 */
export async function requireUser(returnTo?: string): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = returnTo
      ? `/login?next=${encodeURIComponent(returnTo)}`
      : "/login";
    redirect(route(target));
  }
  return user;
}

/**
 * Requires a signed-in user, throwing a 401 instead of redirecting.
 * Use in server actions and route handlers, where a redirect would be
 * swallowed by the caller's fetch.
 */
export async function requireUserOrThrow(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) unauthorized();
  return user;
}

export async function requireAdmin(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=%2Fadmin");
  if (user.role !== "ADMIN") forbidden();
  return user;
}

/**
 * The same boundary, for a server action.
 *
 * `requireAdmin` redirects, which is right for a page and wrong for an
 * action: a redirect from an action is a 200 the client reads as success.
 * This throws the interrupt instead, so an action invoked directly — by
 * anyone who knows its id, with no page render in front of it — returns a
 * real 401 or 403.
 *
 * Every admin action calls this. A layout check is not an action check.
 */
export async function requireAdminOrThrow(): Promise<CurrentUser> {
  const user = await getCurrentUser();
  if (!user) unauthorized();
  if (user.role !== "ADMIN") forbidden();
  return user;
}

/**
 * The signed-in learner's reduced-motion preference.
 *
 * Its own function, and cached, because the root layout needs it on every
 * request and must not pull the whole user row to get one boolean. False
 * for a signed-out visitor — the OS media query still applies to them,
 * and it applies to everyone.
 */
export const getMotionPreference = cache(async function getMotionPreference(): Promise<boolean> {
  const session = await auth();
  const id = session?.user?.id;
  if (!id) return false;

  const profile = await prisma.profile.findUnique({
    where: { userId: id },
    select: { reducedMotion: true },
  });
  return profile?.reducedMotion ?? false;
});
