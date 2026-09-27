import { FEATURES, type Feature } from "@/lib/auth/access";
import type { PlanTier } from "@/generated/prisma/enums";

/**
 * Plan definitions.
 *
 * Prices live here rather than only in Stripe so the page can render without
 * a network call, but Stripe remains the source of truth for what is actually
 * charged - the price id is what a checkout session uses. Entitlements are
 * expressed as Features so the pricing page and `canAccess` can never
 * disagree about what a plan includes.
 */

export type Plan = {
  tier: PlanTier;
  name: string;
  /** Price in whole currency units per month, billed as described. */
  monthlyPrice: number;
  billingNote: string;
  description: string;
  /** Features this plan unlocks, in the order they should be listed. */
  includes: Feature[];
  /** Copy for anything worth naming that the plan does NOT include. */
  excludes?: string[];
  highlighted?: boolean;
  /** Environment variable holding the Stripe price id. */
  priceIdEnvKey?: "STRIPE_PRO_MONTHLY_PRICE_ID" | "STRIPE_PRO_YEARLY_PRICE_ID";
};

export const FEATURE_LABELS: Record<Feature, string> = {
  [FEATURES.DSA_FOUNDATIONS]: "Foundational DSA curriculum",
  [FEATURES.PROBLEMS_FREE]: "Free problem set",
  [FEATURES.VISUALIZE_CORE]: "Core algorithm visualizations",
  [FEATURES.PROGRESS_BASIC]: "Progress tracking and streaks",
  [FEATURES.PATTERNS_BROWSE]: "Pattern library",
  [FEATURES.NOTES]: "Notes and highlights",
  [FEATURES.BOOKMARKS]: "Bookmarks",
  [FEATURES.DSA_ADVANCED]: "Complete curriculum, including advanced topics",
  [FEATURES.PROBLEMS_ALL]: "Every problem",
  [FEATURES.VISUALIZE_ALL]: "Every visualization",
  [FEATURES.AI_TUTOR]: "AI tutor",
  [FEATURES.AI_MOCK_INTERVIEW]: "AI mock interviews with written feedback",
  [FEATURES.SYSTEM_DESIGN]: "System design track",
  [FEATURES.LLD]: "Low-level design track",
  [FEATURES.BEHAVIORAL_AI]: "Behavioral story coaching",
  [FEATURES.COMPANY_ROADMAPS]: "Company preparation roadmaps",
  [FEATURES.ANALYTICS_ADVANCED]: "Detailed mastery analytics",
  [FEATURES.SOLUTIONS_ALL]: "Full multi-approach solutions",
  [FEATURES.ADMIN]: "Administration",
};

export const PLANS: Plan[] = [
  {
    tier: "FREE",
    name: "Free",
    monthlyPrice: 0,
    billingNote: "free forever",
    description:
      "Enough to learn the fundamentals properly and decide whether the method works for you.",
    includes: [
      FEATURES.DSA_FOUNDATIONS,
      FEATURES.PATTERNS_BROWSE,
      FEATURES.PROBLEMS_FREE,
      FEATURES.VISUALIZE_CORE,
      FEATURES.PROGRESS_BASIC,
      FEATURES.NOTES,
      FEATURES.BOOKMARKS,
    ],
    excludes: [
      "AI tutor and mock interviews",
      "System design and low-level design tracks",
    ],
  },
  {
    tier: "PRO_MONTHLY",
    name: "Pro",
    monthlyPrice: 19,
    billingNote: "per month, billed monthly",
    description:
      "The whole platform: every track, every problem, and an AI tutor that refuses to just hand you the answer.",
    includes: [
      FEATURES.DSA_ADVANCED,
      FEATURES.PROBLEMS_ALL,
      FEATURES.SOLUTIONS_ALL,
      FEATURES.VISUALIZE_ALL,
      FEATURES.AI_TUTOR,
      FEATURES.AI_MOCK_INTERVIEW,
      FEATURES.SYSTEM_DESIGN,
      FEATURES.LLD,
      FEATURES.BEHAVIORAL_AI,
      FEATURES.COMPANY_ROADMAPS,
      FEATURES.ANALYTICS_ADVANCED,
    ],
    highlighted: true,
    priceIdEnvKey: "STRIPE_PRO_MONTHLY_PRICE_ID",
  },
  {
    tier: "PRO_YEARLY",
    name: "Pro, yearly",
    monthlyPrice: 15,
    billingNote: "per month, billed yearly",
    description:
      "The same as Pro, at a lower monthly rate for committing to a year.",
    includes: [
      FEATURES.DSA_ADVANCED,
      FEATURES.PROBLEMS_ALL,
      FEATURES.SOLUTIONS_ALL,
      FEATURES.VISUALIZE_ALL,
      FEATURES.AI_TUTOR,
      FEATURES.AI_MOCK_INTERVIEW,
      FEATURES.SYSTEM_DESIGN,
      FEATURES.LLD,
      FEATURES.BEHAVIORAL_AI,
      FEATURES.COMPANY_ROADMAPS,
      FEATURES.ANALYTICS_ADVANCED,
    ],
    priceIdEnvKey: "STRIPE_PRO_YEARLY_PRICE_ID",
  },
];
