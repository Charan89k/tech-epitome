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
/** One session per non-DSA type, so each brief path is exercised. */
const otherSessions: Record<string, string | undefined> = {};

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `iv-alice-${SUFFIX}@techepitome.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `iv-bob-${SUFFIX}@techepitome.test`, name: "Bob" },
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

  it("creates a session for every interview type, each with its own brief", async () => {
    // All four interviewers are real. Each type reads its brief from a
    // different table, so each is exercised rather than assumed.
    for (const type of ["SYSTEM_DESIGN", "LLD", "BEHAVIORAL"] as const) {
      const result = await createInterview({
        userId: alice,
        type,
        difficulty: "MEDIUM",
        language: "PYTHON",
      });
      expect(result.ok, type).toBe(true);
      if (!result.ok) continue;

      const session = await getInterview(result.id, alice);
      expect(session!.type, type).toBe(type);
      expect(session!.stage, type).toBe("INTRO");
      // A session whose brief did not load would render an empty room.
      expect(session!.problemTitle.length, type).toBeGreaterThan(0);
      expect(session!.problemStatement.length, type).toBeGreaterThan(20);

      otherSessions[type] = result.id;
    }
  });

  it("refuses rather than opening a session it cannot brief", async () => {
    // No published system design brief is HARD in the seed, and an
    // unconducted session is worse than a refusal that says why.
    const result = await createInterview({
      userId: alice,
      type: "SYSTEM_DESIGN",
      difficulty: "HARD",
      language: "PYTHON",
    });
    if (!result.ok) {
      expect(result.reason).toMatch(/published/i);
    } else {
      // If a HARD brief is ever seeded this stops being a refusal case;
      // assert the session is still conductable rather than silently
      // passing.
      const session = await getInterview(result.id, alice);
      expect(session!.problemStatement.length).toBeGreaterThan(20);
    }
  });
});

describe("per-type reference boundaries", () => {
  /**
   * The rule that makes each of these an interview rather than a
   * tutorial: the interviewer must not hold the answer. Each type has a
   * different answer to withhold, so each is checked against the actual
   * serialized context rather than against a type.
   */
  const FORBIDDEN: Record<string, RegExp> = {
    // Note the absence of a bare `code`: the context legitimately carries
    // the CANDIDATE's editor buffer under that key. What must not be here
    // is the exercise's own reference implementation, which is checked by
    // content below rather than by key name.
    SYSTEM_DESIGN:
      /"(architecture|tradeoffs|bottlenecks|scalingNotes|dataModel|apiDesign)"/,
    LLD: /"(classDiagram|tradeoffs|designPatterns)"/,
    BEHAVIORAL: /"lookingFor"/,
  };

  it("withholds each type's reference material during the interview", async () => {
    for (const [type, forbidden] of Object.entries(FORBIDDEN)) {
      const id = otherSessions[type];
      expect(id, `${type} session was not created`).toBeTruthy();

      const context = await loadInterviewContext(id!, alice);
      expect(context, type).not.toBeNull();
      expect(JSON.stringify(context), type).not.toMatch(forbidden);
      expect(Object.keys(context!), type).not.toContain("reference");
      // The only `code` in there is the candidate's, which is empty.
      expect(context!.code, type).toBe("");
    }
  });

  it("leaks no line of an LLD reference implementation into the interview", async () => {
    // Stronger than a key check: the reference could arrive flattened into
    // the statement, and a key-name assertion would not notice.
    const id = otherSessions.LLD!;
    const session = await prisma.interviewSession.findUniqueOrThrow({
      where: { id },
      select: { lldProblem: { select: { code: true } } },
    });

    const reference = Object.values(
      (session.lldProblem?.code ?? {}) as Record<string, string>
    );
    expect(reference.length).toBeGreaterThan(0);

    const serialized = JSON.stringify(await loadInterviewContext(id, alice));
    for (const body of reference) {
      for (const line of body.split("\n")) {
        const trimmed = line.trim();
        // Short lines like "}" are not evidence of a leak.
        if (trimmed.length < 25) continue;
        expect(serialized, trimmed.slice(0, 40)).not.toContain(trimmed);
      }
    }
  });

  it("releases each type's reference only after the interview ends", async () => {
    for (const type of Object.keys(FORBIDDEN)) {
      const id = otherSessions[type]!;
      expect(await loadFeedbackContext(id, alice), type).toBeNull();

      await setStage({ sessionId: id, userId: alice, stage: "ENDED" });

      const context = await loadFeedbackContext(id, alice);
      expect(context, type).not.toBeNull();
      expect(context!.reference.length, type).toBeGreaterThan(20);
      expect(context!.reference, type).not.toMatch(/^No reference/);
    }
  });

  it("still refuses a non-owner after every one of them has ended", async () => {
    for (const type of Object.keys(FORBIDDEN)) {
      expect(await loadFeedbackContext(otherSessions[type]!, bob), type).toBeNull();
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
      userId: alice,
      role: "ASSISTANT",
      content: "Tell me how you would approach this.",
    });
    await appendTranscript({
      sessionId,
      userId: alice,
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
      data: { email: `iv-temp-${SUFFIX}@techepitome.test` },
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
      userId: throwaway.id,
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
