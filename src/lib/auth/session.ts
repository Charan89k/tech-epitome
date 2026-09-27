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
 * CodeForge is free, so there is no plan to resolve here. The role is
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
