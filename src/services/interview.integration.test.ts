import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import {
  appendTranscript,
  createInterview,
  getInterview,
  getInterviewStats,
  listInterviews,
  loadFeedbackContext,
  loadInterviewContext,
  saveFeedback,
  saveInterviewCode,
  setStage,
} from "./interview";

/**
 * Interview sessions: ownership, server-owned state, and the reference
 * boundary.
 *
 * The rule that distinguishes an interview from a tutoring session is
 * that the interviewer must not know the answer while the interview is
 * running. `loadInterviewContext` does not select it;
 * `loadFeedbackContext` does, and refuses until the interview has
 * ended. Both halves are asserted here, because "enforced by which
 * function you call" is exactly the guarantee that erodes.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";
let sessionId = "";

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `iv-alice-${SUFFIX}@codeforge.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `iv-bob-${SUFFIX}@codeforge.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

// ---------------------------------------------------------------------------

describe("creating a session", () => {
  it("creates one and picks a problem server-side", async () => {
    const result = await createInterview({
      userId: alice,
      type: "DSA",
      difficulty: "EASY",
      language: "PYTHON",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    sessionId = result.id;

    const session = await getInterview(sessionId, alice);
    expect(session).not.toBeNull();
    // The candidate never named the problem — shopping for one they have
    // already solved would make the practice worthless.
    expect(session!.problemTitle).toBeTruthy();
    expect(session!.stage).toBe("INTRO");
    expect(session!.status).toBe("IN_PROGRESS");
  });

  it("refuses an interview type that is not implemented", async () => {
    // Better an explicit refusal than a session that cannot be conducted.
    for (const type of ["SYSTEM_DESIGN", "LLD", "BEHAVIORAL"] as const) {
      const result = await createInterview({
        userId: alice,
        type,
        difficulty: "EASY",
        language: "PYTHON",
      });
      expect(result.ok, type).toBe(false);
    }
  });
});

describe("ownership", () => {
  it("lets the owner read their session", async () => {
    expect(await getInterview(sessionId, alice)).not.toBeNull();
  });

  it("hides another learner's session", async () => {
    // Null rather than a throw: a probe for somebody else's id is
    // answered exactly like a probe for one that never existed.
    expect(await getInterview(sessionId, bob)).toBeNull();
  });

  it("hides another learner's interview context", async () => {
    expect(await loadInterviewContext(sessionId, bob)).toBeNull();
  });

  it("does not list another learner's sessions", async () => {
    const forBob = await listInterviews(bob);
    expect(forBob.every((s) => s.id !== sessionId)).toBe(true);
  });

  it("refuses to advance another learner's session", async () => {
    await setStage({ sessionId, userId: bob, stage: "ENDED" });
    const session = await getInterview(sessionId, alice);
    // Bob's write matched no row; Alice's session is untouched.
    expect(session!.stage).toBe("INTRO");
    expect(session!.status).toBe("IN_PROGRESS");
  });

  it("refuses to write code into another learner's session", async () => {
    const saved = await saveInterviewCode({
      sessionId,
      userId: bob,
      code: "bob was here",
      language: "PYTHON",
    });
    expect(saved).toBe(false);

    const session = await getInterview(sessionId, alice);
    expect(session!.code).not.toContain("bob was here");
  });

  it("refuses to attach feedback to another learner's session", async () => {
    const saved = await saveFeedback({
      sessionId,
      userId: bob,
      dimensions: [{ dimension: "communication", band: "strong", evidence: "x" }],
      strengths: [],
      improvements: [],
      summary: "forged",
    });
    expect(saved).toBe(false);
  });
});

describe("the reference boundary", () => {
  it("does not give the interviewer the solution while the interview runs", async () => {
    const context = await loadInterviewContext(sessionId, alice);
    expect(context).not.toBeNull();

    // It knows the problem it set…
    expect(context!.problemStatement.length).toBeGreaterThan(10);
    // …and has no field that could carry the answer.
    expect(Object.keys(context!)).not.toContain("reference");
    expect(JSON.stringify(context)).not.toMatch(/"(solutions|reference|testCases)"/);
  });

  it("refuses to load feedback context while the interview is live", async () => {
    // The interview being over is what makes the reference safe to read.
    expect(await loadFeedbackContext(sessionId, alice)).toBeNull();
  });

  it("supplies the reference once the interview has ended", async () => {
    await appendTranscript({
      sessionId,
      role: "ASSISTANT",
      content: "Tell me how you would approach this.",
    });
    await appendTranscript({
      sessionId,
      role: "USER",
      content: "I would scan once and track a running maximum.",
    });
    await setStage({ sessionId, userId: alice, stage: "ENDED" });

    const context = await loadFeedbackContext(sessionId, alice);
    expect(context).not.toBeNull();
    expect(context!.reference.length).toBeGreaterThan(0);
  });

  it("still refuses feedback context to a non-owner after it has ended", async () => {
    expect(await loadFeedbackContext(sessionId, bob)).toBeNull();
  });
});

describe("state and transcript", () => {
  it("marks the session completed when it ends", async () => {
    const session = await getInterview(sessionId, alice);
    expect(session!.stage).toBe("ENDED");
    expect(session!.status).toBe("COMPLETED");
    expect(session!.endedAt).not.toBeNull();
  });

  it("persists the transcript in order", async () => {
    const session = await getInterview(sessionId, alice);
    expect(session!.transcript).toHaveLength(2);
    expect(session!.transcript[0]!.role).toBe("ASSISTANT");
    expect(session!.transcript[1]!.content).toContain("running maximum");
  });

  it("does not let a finished session's code be rewritten", async () => {
    // saveInterviewCode filters on IN_PROGRESS, so a closed interview is
    // an immutable record.
    const saved = await saveInterviewCode({
      sessionId,
      userId: alice,
      code: "after the fact",
      language: "PYTHON",
    });
    expect(saved).toBe(false);
  });
});

describe("feedback", () => {
  it("stores banded assessments with evidence", async () => {
    const saved = await saveFeedback({
      sessionId,
      userId: alice,
      dimensions: [
        {
          dimension: "communication",
          band: "strong",
          evidence: "Narrated the approach before writing.",
        },
        {
          dimension: "complexityReasoning",
          band: "not_demonstrated",
          evidence: "The interview ended first.",
        },
      ],
      strengths: ["Clarified the input range."],
      improvements: ["State complexity unprompted."],
      summary: "A steady interview.",
    });
    expect(saved).toBe(true);

    const session = await getInterview(sessionId, alice);
    expect(session!.feedback).not.toBeNull();
    expect(session!.feedback!.dimensions).toHaveLength(2);
    expect(session!.feedback!.dimensions[0]!.evidence).toContain("Narrated");
  });

  it("carries no composite score", async () => {
    // A number would read as a measurement and invite ranking one
    // candidate against another.
    const session = await getInterview(sessionId, alice);
    const serialised = JSON.stringify(session!.feedback);
    expect(serialised).not.toMatch(/"(overall|score|rating|grade)"/i);
  });

  it("replaces rather than duplicating on a regenerate", async () => {
    await saveFeedback({
      sessionId,
      userId: alice,
      dimensions: [{ dimension: "approach", band: "solid", evidence: "Second pass." }],
      strengths: [],
      improvements: [],
      summary: "Regenerated.",
    });

    const rows = await prisma.interviewEvaluation.count({ where: { sessionId } });
    expect(rows).toBe(1);

    const session = await getInterview(sessionId, alice);
    expect(session!.feedback!.summary).toBe("Regenerated.");
  });
});

describe("stats", () => {
  it("counts only this learner's sessions", async () => {
    const forAlice = await getInterviewStats(alice);
    expect(forAlice.total).toBeGreaterThanOrEqual(1);
    expect(forAlice.completed).toBeGreaterThanOrEqual(1);
    expect(forAlice.withFeedback).toBe(1);

    const forBob = await getInterviewStats(bob);
    expect(forBob.total).toBe(0);
    expect(forBob.withFeedback).toBe(0);
  });
});

describe("cascade behaviour", () => {
  it("removes sessions, transcript and evaluation when a user is deleted", async () => {
    const throwaway = await prisma.user.create({
      data: { email: `iv-temp-${SUFFIX}@codeforge.test` },
      select: { id: true },
    });
    const created = await createInterview({
      userId: throwaway.id,
      type: "DSA",
      difficulty: "EASY",
      language: "PYTHON",
    });
    if (!created.ok) throw new Error("setup failed");

    await appendTranscript({
      sessionId: created.id,
      role: "USER",
      content: "hello",
    });
    await saveFeedback({
      sessionId: created.id,
      userId: throwaway.id,
      dimensions: [{ dimension: "testing", band: "solid", evidence: "x" }],
      strengths: [],
      improvements: [],
      summary: "s",
    });

    await prisma.user.delete({ where: { id: throwaway.id } });

    expect(
      await prisma.interviewSession.count({ where: { id: created.id } })
    ).toBe(0);
    expect(
      await prisma.interviewMessage.count({ where: { sessionId: created.id } })
    ).toBe(0);
    expect(
      await prisma.interviewEvaluation.count({ where: { sessionId: created.id } })
    ).toBe(0);
  });
});
