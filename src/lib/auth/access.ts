import type { CurrentUser } from "@/lib/auth/session";

/**
 * Feature authorization.
 *
 * CodeForge is free. There is no paid tier, no plan, and no feature that
 * costs money to reach — so this file answers exactly two questions:
 *
 *   1. Is this readable without an account? (a small public browse set)
 *   2. Is this an administrative capability? (staff only)
 *
 * Everything else is available to every signed-in user. An earlier
 * version split features across FREE and PRO sets and took an `isPro`
 * flag; that split is gone, along with the subscription it read from,
 * the per-row `AccessTier` on content, and the lock states that
 * rendered an upgrade prompt. If a third tier ever appears here, the
 * product decision has changed and this comment is where to argue
 * about it.
 *
 * Authorization is not monetization. Roles still exist — a learner
 * cannot reach the admin surface — but a role is a permission boundary,
 * never a price.
 *
 * Still a pure function of (user, feature), so it is trivially testable
 * and usable on both sides of the network boundary. The server always
 * re-checks before returning anything gated; a client-side check only
 * decides what to *show*.
 */

export const FEATURES = {
  // Learning. Every one of these is free to any signed-in user.
  DSA: "dsa",
  PROBLEMS: "problems",
  PATTERNS: "patterns",
  VISUALIZE: "visualize",
  SYSTEM_DESIGN: "systemDesign",
  LLD: "lld",
  AI_TUTOR: "ai.tutor",
  AI_MOCK_INTERVIEW: "ai.mockInterview",
  REVIEW: "review",
  PROGRESS: "progress",
  ANALYTICS: "analytics",
  NOTES: "notes",
  BOOKMARKS: "bookmarks",
  SOLUTIONS: "solutions",

  // Staff.
  ADMIN: "admin",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/**
 * Readable without an account.
 *
 * Deliberately generous: a visitor should be able to walk the
 * curriculum, read a chapter and look at a problem before deciding to
 * sign up. What needs an account is anything that *writes* — progress,
 * notes, submissions — plus the AI features, which cost real money per
 * call and therefore need an identity to rate-limit against. That is a
 * resource control, not a price.
 */
const ANONYMOUS_FEATURES = new Set<Feature>([
  FEATURES.DSA,
  FEATURES.PROBLEMS,
  FEATURES.PATTERNS,
  FEATURES.VISUALIZE,
  FEATURES.SYSTEM_DESIGN,
  FEATURES.LLD,
  FEATURES.SOLUTIONS,
]);

/** Everything a signed-in learner gets, which is everything but admin. */
const AUTHENTICATED_FEATURES = new Set<Feature>(
  Object.values(FEATURES).filter((feature) => feature !== FEATURES.ADMIN)
);

export function canAccess(
  user: Pick<CurrentUser, "role"> | null,
  feature: Feature
): boolean {
  // Admins can reach everything, including the admin surface.
  if (user?.role === "ADMIN") return true;

  // The one feature a non-admin can never have.
  if (feature === FEATURES.ADMIN) return false;

  if (!user) return ANONYMOUS_FEATURES.has(feature);

  return AUTHENTICATED_FEATURES.has(feature);
}

/** Whether the user may reach administrative functionality. */
export function isAdmin(user: Pick<CurrentUser, "role"> | null): boolean {
  return user?.role === "ADMIN";
}
