import type { AccessTier } from "@/generated/prisma/enums";
import type { CurrentUser } from "@/lib/auth/session";

/**
 * Feature authorization.
 *
 * Every gate in the product resolves through `canAccess`. Components never
 * test `user.plan === "PRO_MONTHLY"` inline - that pattern is how a pricing
 * change turns into a week of grepping, and how one forgotten check turns
 * into a free lunch.
 *
 * This is a pure function of (user, feature) so it is trivially testable and
 * usable on both sides of the network boundary. The server still re-checks
 * before returning gated content; a client-side check only decides what to
 * *show*, never what to *send*.
 */

export const FEATURES = {
  // Free tier
  DSA_FOUNDATIONS: "dsa.foundations",
  PROBLEMS_FREE: "problems.free",
  VISUALIZE_CORE: "visualize.core",
  PROGRESS_BASIC: "progress.basic",
  PATTERNS_BROWSE: "patterns.browse",
  NOTES: "notes",
  BOOKMARKS: "bookmarks",

  // Pro tier
  DSA_ADVANCED: "dsa.advanced",
  PROBLEMS_ALL: "problems.all",
  VISUALIZE_ALL: "visualize.all",
  AI_TUTOR: "ai.tutor",
  AI_MOCK_INTERVIEW: "ai.mockInterview",
  SYSTEM_DESIGN: "track.systemDesign",
  LLD: "track.lld",
  BEHAVIORAL_AI: "behavioral.ai",
  COMPANY_ROADMAPS: "companies.roadmaps",
  ANALYTICS_ADVANCED: "analytics.advanced",
  SOLUTIONS_ALL: "solutions.all",

  // Staff
  ADMIN: "admin",
} as const;

export type Feature = (typeof FEATURES)[keyof typeof FEATURES];

/** Features available without an account at all. */
const ANONYMOUS_FEATURES = new Set<Feature>([
  FEATURES.PATTERNS_BROWSE,
  FEATURES.VISUALIZE_CORE,
]);

/** Features any signed-in user gets. */
const FREE_FEATURES = new Set<Feature>([
  ...ANONYMOUS_FEATURES,
  FEATURES.DSA_FOUNDATIONS,
  FEATURES.PROBLEMS_FREE,
  FEATURES.PROGRESS_BASIC,
  FEATURES.NOTES,
  FEATURES.BOOKMARKS,
]);

/** Everything a paying user gets, on top of the free set. */
const PRO_FEATURES = new Set<Feature>([
  ...FREE_FEATURES,
  FEATURES.DSA_ADVANCED,
  FEATURES.PROBLEMS_ALL,
  FEATURES.VISUALIZE_ALL,
  FEATURES.AI_TUTOR,
  FEATURES.AI_MOCK_INTERVIEW,
  FEATURES.SYSTEM_DESIGN,
  FEATURES.LLD,
  FEATURES.BEHAVIORAL_AI,
  FEATURES.COMPANY_ROADMAPS,
  FEATURES.ANALYTICS_ADVANCED,
  FEATURES.SOLUTIONS_ALL,
]);

export function canAccess(
  user: Pick<CurrentUser, "role" | "isPro"> | null,
  feature: Feature
): boolean {
  // Admins can reach everything, including the admin panel.
  if (user?.role === "ADMIN") return true;

  if (feature === FEATURES.ADMIN) return false;

  if (!user) return ANONYMOUS_FEATURES.has(feature);

  return user.isPro ? PRO_FEATURES.has(feature) : FREE_FEATURES.has(feature);
}

/**
 * Whether a piece of content marked FREE/PRO is readable by this user.
 * Content rows carry an `access` column; this maps that column onto the
 * same decision as `canAccess` so there is one notion of "locked".
 */
export function canAccessTier(
  user: Pick<CurrentUser, "role" | "isPro"> | null,
  tier: AccessTier
): boolean {
  if (user?.role === "ADMIN") return true;
  if (tier === "FREE") return true;
  return Boolean(user?.isPro);
}

/**
 * Locked content is still listed - the learner should see the shape of the
 * curriculum they have not bought. This returns what to render instead of
 * the body.
 */
export type LockState = { locked: false } | { locked: true; reason: "signin" | "upgrade" };

export function lockStateFor(
  user: Pick<CurrentUser, "role" | "isPro"> | null,
  tier: AccessTier
): LockState {
  if (canAccessTier(user, tier)) return { locked: false };
  return { locked: true, reason: user ? "upgrade" : "signin" };
}
