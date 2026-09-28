import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Difficulty } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { INTERVIEW_TYPES, type InterviewKind } from "@/lib/interview/types";
import { availableDifficulties, createInterview } from "./interview";

/**
 * Regression for "Start Mock Interview does nothing".
 *
 * The cause was not the button. `chooseBrief` filtered published briefs on
 * an exact difficulty match, and the seeded catalogue has no hard system
 * design brief and no hard low-level design brief — so choosing Hard for
 * either type found an empty pool, returned `ok: false`, and the form
 * showed an error instead of starting an interview. The default is Medium,
 * which is why the existing end-to-end test never saw it.
 *
 * The fix makes difficulty a preference rather than a filter that can
 * dead-end the feature, and makes the form stop offering a level the
 * catalogue cannot serve. These tests pin both halves, and deliberately
 * cover **every type at every difficulty** rather than the default — the
 * gap in coverage is what let the bug ship.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;
const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

let userId = "";
const created: string[] = [];

beforeAll(async () => {
  const user = await prisma.user.create({
    data: { email: `iv-briefs-${SUFFIX}@techepitome.test`, name: "Briefs" },
    select: { id: true },
  });
  userId = user.id;
});

afterAll(async () => {
  await prisma.interviewSession.deleteMany({ where: { userId } });
  await prisma.user.deleteMany({ where: { id: userId } });
});

describe("starting an interview at every difficulty", () => {
  // The matrix the bug lived in. Every cell must produce a session.
  for (const type of INTERVIEW_TYPES) {
    for (const difficulty of DIFFICULTIES) {
      it(`starts a ${type} interview at ${difficulty}`, async () => {
        const result = await createInterview({
          userId,
          type,
          difficulty,
          language: "PYTHON",
        });

        expect(
          result.ok,
          result.ok ? "" : `${type}/${difficulty} failed: ${result.reason}`
        ).toBe(true);
        if (!result.ok) return;

        created.push(result.id);

        const session = await prisma.interviewSession.findUnique({
          where: { id: result.id },
          select: {
            type: true,
            stage: true,
            status: true,
            difficulty: true,
            problemId: true,
            systemDesignProblemId: true,
            lldProblemId: true,
            behavioralQuestionId: true,
          },
        });

        // The stored type is the requested type, and the opening stage is
        // INTRO for every machine - the interview has somewhere to start.
        expect(session?.type).toBe(type);
        expect(session?.stage).toBe("INTRO");
        expect(session?.status).toBe("IN_PROGRESS");

        // Exactly one brief is linked, and it is the one belonging to this
        // type. A session with no brief would render an empty interview.
        const links = [
          session?.problemId,
          session?.systemDesignProblemId,
          session?.lldProblemId,
          session?.behavioralQuestionId,
        ].filter(Boolean);
        expect(links).toHaveLength(1);

        const expectedLink = {
          DSA: session?.problemId,
          SYSTEM_DESIGN: session?.systemDesignProblemId,
          LLD: session?.lldProblemId,
          BEHAVIORAL: session?.behavioralQuestionId,
        }[type];
        expect(expectedLink).toBeTruthy();

        // The row records the difficulty actually used, so a substituted
        // interview does not misreport itself in history or feedback.
        expect(session?.difficulty).toBe(result.difficulty);
      });
    }
  }
});

describe("difficulty is a preference, not a dead end", () => {
  it("reports substitution when the requested difficulty has no brief", async () => {
    // Drives the exact cell that used to fail. Whether it substitutes
    // depends on the catalogue, so the assertion is the invariant rather
    // than a hardcoded expectation: either it got what it asked for, or it
    // said plainly that it did not.
    const result = await createInterview({
      userId,
      type: "SYSTEM_DESIGN",
      difficulty: "HARD",
      language: "PYTHON",
    });

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    created.push(result.id);

    if (result.difficulty !== "HARD") {
      expect(result.substituted).toBe(true);
    } else {
      expect(result.substituted).toBe(false);
    }
  });

  it("never claims a difficulty it did not use", async () => {
    for (const type of INTERVIEW_TYPES) {
      for (const difficulty of DIFFICULTIES) {
        const result = await createInterview({
          userId,
          type,
          difficulty,
          language: "PYTHON",
        });
        expect(result.ok).toBe(true);
        if (!result.ok) continue;
        created.push(result.id);

        expect(result.substituted).toBe(result.difficulty !== difficulty);
      }
    }
  });
});

describe("availableDifficulties", () => {
  it("only reports levels that can actually start an interview", async () => {
    for (const type of INTERVIEW_TYPES) {
      const levels = await availableDifficulties(type as InterviewKind);
      expect(levels.length).toBeGreaterThan(0);

      for (const difficulty of levels) {
        const result = await createInterview({
          userId,
          type,
          difficulty,
          language: "PYTHON",
        });
        expect(
          result.ok,
          `${type} advertised ${difficulty} but could not start it`
        ).toBe(true);
        if (result.ok) {
          created.push(result.id);
          // An advertised level is served exactly, never substituted.
          expect(result.difficulty).toBe(difficulty);
          expect(result.substituted).toBe(false);
        }
      }
    }
  });

  it("is ordered easiest to hardest", async () => {
    const order: Difficulty[] = ["EASY", "MEDIUM", "HARD"];
    for (const type of INTERVIEW_TYPES) {
      const levels = await availableDifficulties(type as InterviewKind);
      const indexes = levels.map((level) => order.indexOf(level));
      expect(indexes).toEqual([...indexes].sort((a, b) => a - b));
    }
  });
});
