import { describe, expect, it } from "vitest";

import { FEATURES, canAccess, isAdmin, type Feature } from "./access";

/**
 * Authorization is the one place where a wrong answer is either a lockout or
 * an admin surface handed to a learner, so each boundary is asserted
 * explicitly rather than inferred from a loop over the same data the
 * implementation uses.
 *
 * Tech Epitome is free, so there is exactly one boundary left that matters to a
 * learner ("do you have an account?") and one that matters to staff ("are you
 * an admin?"). Any future test that starts talking about plans or tiers means
 * the product decision changed.
 */

const anonymous = null;
const learner = { role: "USER" as const };
const admin = { role: "ADMIN" as const };

const ALL_FEATURES = Object.values(FEATURES) as Feature[];

describe("canAccess", () => {
  it("lets an anonymous visitor browse the curriculum", () => {
    expect(canAccess(anonymous, FEATURES.DSA)).toBe(true);
    expect(canAccess(anonymous, FEATURES.PATTERNS)).toBe(true);
    expect(canAccess(anonymous, FEATURES.PROBLEMS)).toBe(true);
    expect(canAccess(anonymous, FEATURES.VISUALIZE)).toBe(true);
    expect(canAccess(anonymous, FEATURES.SYSTEM_DESIGN)).toBe(true);
    expect(canAccess(anonymous, FEATURES.LLD)).toBe(true);
  });

  it("withholds per-user and AI features from an anonymous visitor", () => {
    // Not a price: these either write rows that need an owner, or cost money
    // per call and need an identity to rate-limit against.
    expect(canAccess(anonymous, FEATURES.PROGRESS)).toBe(false);
    expect(canAccess(anonymous, FEATURES.NOTES)).toBe(false);
    expect(canAccess(anonymous, FEATURES.BOOKMARKS)).toBe(false);
    expect(canAccess(anonymous, FEATURES.ANALYTICS)).toBe(false);
    expect(canAccess(anonymous, FEATURES.REVIEW)).toBe(false);
    expect(canAccess(anonymous, FEATURES.AI_TUTOR)).toBe(false);
    expect(canAccess(anonymous, FEATURES.AI_MOCK_INTERVIEW)).toBe(false);
  });

  it("gives a signed-in learner every feature except admin", () => {
    // The whole point of the free refactor: there is no second learner tier
    // for anything to fall into.
    for (const feature of ALL_FEATURES) {
      expect(canAccess(learner, feature), feature).toBe(
        feature !== FEATURES.ADMIN
      );
    }
  });

  it("never grants the admin feature to a non-admin", () => {
    expect(canAccess(anonymous, FEATURES.ADMIN)).toBe(false);
    expect(canAccess(learner, FEATURES.ADMIN)).toBe(false);
  });

  it("grants an admin everything", () => {
    for (const feature of ALL_FEATURES) {
      expect(canAccess(admin, feature), feature).toBe(true);
    }
  });
});

describe("isAdmin", () => {
  it("is true only for the ADMIN role", () => {
    expect(isAdmin(admin)).toBe(true);
    expect(isAdmin(learner)).toBe(false);
    expect(isAdmin(anonymous)).toBe(false);
  });
});
