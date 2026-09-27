import { describe, expect, it } from "vitest";

import { FEATURES, canAccess, canAccessTier, lockStateFor } from "./access";

/**
 * Authorization is the one place where a wrong answer is a paywall bypass or
 * a lockout, so every tier boundary is asserted explicitly rather than
 * inferred from a loop.
 */

const anonymous = null;
const freeUser = { role: "USER" as const, isPro: false };
const proUser = { role: "USER" as const, isPro: true };
const admin = { role: "ADMIN" as const, isPro: false };

describe("canAccess", () => {
  it("lets an anonymous visitor browse patterns and core visualizations", () => {
    expect(canAccess(anonymous, FEATURES.PATTERNS_BROWSE)).toBe(true);
    expect(canAccess(anonymous, FEATURES.VISUALIZE_CORE)).toBe(true);
  });

  it("does not give an anonymous visitor signed-in features", () => {
    expect(canAccess(anonymous, FEATURES.PROGRESS_BASIC)).toBe(false);
    expect(canAccess(anonymous, FEATURES.NOTES)).toBe(false);
    expect(canAccess(anonymous, FEATURES.BOOKMARKS)).toBe(false);
  });

  it("gives a free user the foundational curriculum but not the advanced one", () => {
    expect(canAccess(freeUser, FEATURES.DSA_FOUNDATIONS)).toBe(true);
    expect(canAccess(freeUser, FEATURES.DSA_ADVANCED)).toBe(false);
  });

  it("withholds every paid feature from a free user", () => {
    const paidOnly = [
      FEATURES.AI_TUTOR,
      FEATURES.AI_MOCK_INTERVIEW,
      FEATURES.SYSTEM_DESIGN,
      FEATURES.LLD,
      FEATURES.PROBLEMS_ALL,
      FEATURES.SOLUTIONS_ALL,
      FEATURES.VISUALIZE_ALL,
      FEATURES.BEHAVIORAL_AI,
      FEATURES.COMPANY_ROADMAPS,
      FEATURES.ANALYTICS_ADVANCED,
    ];
    for (const feature of paidOnly) {
      expect(canAccess(freeUser, feature), feature).toBe(false);
    }
  });

  it("gives a pro user the paid features and keeps the free ones", () => {
    expect(canAccess(proUser, FEATURES.AI_TUTOR)).toBe(true);
    expect(canAccess(proUser, FEATURES.SYSTEM_DESIGN)).toBe(true);
    expect(canAccess(proUser, FEATURES.NOTES)).toBe(true);
  });

  it("never grants the admin feature to a non-admin, however paid", () => {
    expect(canAccess(freeUser, FEATURES.ADMIN)).toBe(false);
    expect(canAccess(proUser, FEATURES.ADMIN)).toBe(false);
    expect(canAccess(anonymous, FEATURES.ADMIN)).toBe(false);
  });

  it("grants an admin everything, including features their plan excludes", () => {
    expect(canAccess(admin, FEATURES.ADMIN)).toBe(true);
    expect(canAccess(admin, FEATURES.AI_MOCK_INTERVIEW)).toBe(true);
    expect(canAccess(admin, FEATURES.DSA_ADVANCED)).toBe(true);
  });
});

describe("canAccessTier", () => {
  it("treats FREE content as readable by anyone, including signed out", () => {
    expect(canAccessTier(anonymous, "FREE")).toBe(true);
    expect(canAccessTier(freeUser, "FREE")).toBe(true);
  });

  it("gates PRO content behind an active paid plan", () => {
    expect(canAccessTier(anonymous, "PRO")).toBe(false);
    expect(canAccessTier(freeUser, "PRO")).toBe(false);
    expect(canAccessTier(proUser, "PRO")).toBe(true);
    expect(canAccessTier(admin, "PRO")).toBe(true);
  });
});

describe("lockStateFor", () => {
  it("is unlocked when the tier is reachable", () => {
    expect(lockStateFor(proUser, "PRO")).toEqual({ locked: false });
    expect(lockStateFor(anonymous, "FREE")).toEqual({ locked: false });
  });

  it("asks an anonymous visitor to sign in, not to upgrade", () => {
    // Telling a signed-out visitor to "upgrade" is the wrong next step -
    // they may already have a Pro account.
    expect(lockStateFor(anonymous, "PRO")).toEqual({
      locked: true,
      reason: "signin",
    });
  });

  it("asks a signed-in free user to upgrade", () => {
    expect(lockStateFor(freeUser, "PRO")).toEqual({
      locked: true,
      reason: "upgrade",
    });
  });
});
