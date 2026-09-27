import "server-only";

import { cache } from "react";
import { forbidden, redirect, unauthorized } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { route } from "@/lib/utils";
import type { PlanTier, Role, SubscriptionStatus } from "@/generated/prisma/enums";

/**
 * The single definition of "who is asking" for the whole application.
 *
 * Everything server-side goes through here rather than calling `auth()`
 * directly, so swapping the auth provider later touches this file and not the
 * hundreds of call sites. It is also the only place that resolves the
 * subscription tier, which must never be read from the JWT - a token minted
 * before an upgrade or a cancellation would be wrong for up to 30 days.
 */

export type CurrentUser = {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  role: Role;
  plan: PlanTier;
  subscriptionStatus: SubscriptionStatus | null;
  /** True when the plan is a paid tier AND the subscription is in good standing. */
  isPro: boolean;
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
      subscription: {
        select: { plan: true, status: true, currentPeriodEnd: true },
      },
    },
  });

  // The session referenced a user that no longer exists - treat as signed out
  // rather than crashing the render.
  if (!user) return null;

  const sub = user.subscription;
  const paidPlan = sub?.plan === "PRO_MONTHLY" || sub?.plan === "PRO_YEARLY";
  const goodStanding = sub?.status === "ACTIVE" || sub?.status === "TRIALING";
  const notExpired = !sub?.currentPeriodEnd || sub.currentPeriodEnd > new Date();

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    image: user.image,
    role: user.role,
    plan: sub?.plan ?? "FREE",
    subscriptionStatus: sub?.status ?? null,
    isPro: Boolean(paidPlan && goodStanding && notExpired),
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
