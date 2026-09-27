import { expect, test, type Page } from "@playwright/test";

import { closeDb } from "./db";
import { finishSignup } from "./helpers";

/**
 * Journey 5: Mock interview.
 *
 * Create → problem presented → respond → stage advances → finish →
 * feedback → history.
 *
 * The assertions that matter most are about the state machine: the
 * client never sends the stage, so the interview must advance only
 * because the server said it did, and there must be no request the
 * browser can make that skips to the end.
 */

const PASSWORD = "forge-e2e-password";

function uniqueEmail(tag: string): string {
  return `e2e-iv-${tag}-${Date.now()}-${Math.floor(Math.random() * 10_000)}@codeforge.test`;
}

async function signUpAsLearner(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);
  await page.reload();
  return email;
}

function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

/** Starts an interview of the given type and lands in the room. */
async function startInterview(
  page: Page,
  type: "Coding (DSA)" | "Behavioural" | "System design" | "Low-level design" =
    "Coding (DSA)"
) {
  await page.goto("/interviews");
  if (type !== "Coding (DSA)") {
    await page.getByLabel("Interview type").click();
    await page.getByRole("option", { name: type }).click();
  }
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });
  await expect(page.getByTestId("interview-room")).toBeVisible({ timeout: 30_000 });
}

/** Opens the interview and waits for the interviewer's first turn. */
async function begin(page: Page) {
  const room = page.getByTestId("interview-room");
  await room.getByRole("button", { name: "Begin interview" }).click();
  await expect(
    page.getByTestId("interview-transcript").getByText("Interviewer").first()
  ).toBeVisible({ timeout: 30_000 });
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("an ordinary account can start an interview, with nothing to buy", async ({
  page,
}) => {
  // CodeForge is free: a plain account reaches the interviewer directly.
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Plain");
  await page.getByLabel("Email").fill(uniqueEmail("plain"));
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await finishSignup(page);

  await page.goto("/interviews");
  await expect(
    page.getByRole("heading", { name: "Start an interview" })
  ).toBeVisible();

  const body = (await page.locator("body").innerText()).toLowerCase();
  for (const word of ["upgrade", "see plans", "part of pro"]) {
    expect(body, `interviews page still says "${word}"`).not.toContain(word);
  }
});

test("the dashboard shows real counts, starting at zero", async ({ page }) => {
  await signUpAsLearner(page, "counts");
  await page.goto("/interviews");

  // Every tile is an aggregate over this user's own rows. Scoped to
  // `main` because the dev server streams a hidden prerender copy of
  // the page alongside the live one.
  await expect(
    page.getByRole("main").getByText("No interviews yet")
  ).toBeVisible();
  await expect(page.getByTestId("interview-history")).toHaveCount(0);
});

test("full journey: start, respond, advance, finish, feedback, history", async ({
  page,
}) => {
  test.slow();
  await signUpAsLearner(page, "journey");
  await startInterview(page);

  const room = page.getByTestId("interview-room");
  const transcript = page.getByTestId("interview-transcript");

  // --- the interviewer opens ----------------------------------------------
  await room.getByRole("button", { name: "Begin interview" }).click();
  await expect(transcript.getByText("Interviewer").first()).toBeVisible({
    timeout: 30_000,
  });

  // The stage advanced because the SERVER said so — the client never
  // sent a stage.
  await expect(room.getByText("Clarifying the problem").first()).toBeVisible({
    timeout: 20_000,
  });

  // --- candidate responds --------------------------------------------------
  await page
    .getByLabel("Your response")
    .fill("Can the input list be empty, and can the values be negative?");
  await page.getByRole("button", { name: "Send response" }).click();

  await expect(transcript.getByText(/empty, and can the values be negative/)).toBeVisible();
  await expect(transcript.getByText("Interviewer").nth(1)).toBeVisible({
    timeout: 30_000,
  });

  // --- finish --------------------------------------------------------------
  await page.getByRole("button", { name: "End interview" }).click();
  await expect(page.getByText("This interview is finished.")).toBeVisible({
    timeout: 30_000,
  });

  // --- feedback ------------------------------------------------------------
  await page.getByRole("button", { name: "Generate feedback" }).click();
  await expect(page.getByRole("heading", { name: "Feedback" })).toBeVisible({
    timeout: 45_000,
  });

  // Labelled as AI-generated, with evidence and no composite score.
  await expect(page.getByText("AI-generated feedback.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "By dimension" })).toBeVisible();
  await expect(page.getByText("Not demonstrated").first()).toBeVisible();

  // No composite score anywhere. Checked as shapes rather than as the
  // phrase "overall score", which appears in the disclaimer explaining
  // that there isn't one.
  const feedback = await page
    .locator("section", { has: page.getByRole("heading", { name: "Feedback" }) })
    .innerText();
  expect(feedback).not.toMatch(/\b\d+\s*\/\s*10\b/);
  expect(feedback).not.toMatch(/\b\d+\s*%/);
  expect(feedback).not.toMatch(/^\s*Overall\s*:/im);
  expect(feedback).not.toMatch(/\b(hire|no hire|strong hire)\b/i);

  // --- history -------------------------------------------------------------
  await page.goto("/interviews");
  const history = page.getByTestId("interview-history");
  await expect(history).toBeVisible();
  await expect(history.getByText("Feedback").first()).toBeVisible();
});

/**
 * The three interviews added after DSA.
 *
 * Each one is a genuinely different machine — different stages,
 * different first question, different feedback dimensions — so each is
 * walked rather than assumed to work because DSA does. The assertions
 * are on the stage the SERVER reports, which is the only thing that
 * proves the machine and not the client decided.
 */
const JOURNEYS = [
  {
    type: "Behavioural" as const,
    tag: "behavioral",
    /** The stage the interview must be in after the opening turn. */
    opensInto: "The question",
    /** A stage from another machine that must never appear here. */
    foreign: "Complexity",
    answer:
      "Two of us disagreed about rewriting the importer. I owned the decision to ship the smaller fix first.",
    reaches: "Digging into the story",
  },
  {
    type: "System design" as const,
    tag: "sysdesign",
    opensInto: "Clarifying the problem",
    foreign: "Domain model",
    answer:
      "Is this read-heavy, and roughly how many writes per second should I design for?",
    reaches: "Scale and estimates",
  },
  {
    type: "Low-level design" as const,
    tag: "lld",
    opensInto: "Clarifying the problem",
    foreign: "Scaling and reliability",
    answer:
      "Can I assume a single machine and one transaction at a time, with no concurrency?",
    reaches: "Domain model",
  },
];

for (const journey of JOURNEYS) {
  test(`${journey.type.toLowerCase()} interview: opens, advances and produces its own feedback`, async ({
    page,
  }) => {
    test.slow();
    await signUpAsLearner(page, journey.tag);
    await startInterview(page, journey.type);

    const room = page.getByTestId("interview-room");

    // The stepper shows this machine's stages and only this machine's.
    await expect(room.getByText(journey.foreign)).toHaveCount(0);

    await begin(page);
    await expect(room.getByText(journey.opensInto).first()).toBeVisible({
      timeout: 20_000,
    });

    // The brief is on screen once the interviewer has presented it — an
    // interviewer asking about a constraint the candidate cannot see is
    // testing memory, not design.
    await expect(page.getByTestId("interview-brief")).toBeVisible();

    await page.getByLabel("Your response").fill(journey.answer);
    await page.getByRole("button", { name: "Send response" }).click();
    await expect(room.getByText(journey.reaches).first()).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "End interview" }).click();
    await expect(page.getByText("This interview is finished.")).toBeVisible({
      timeout: 30_000,
    });

    await page.getByRole("button", { name: "Generate feedback" }).click();
    await expect(page.getByRole("heading", { name: "Feedback" })).toBeVisible({
      timeout: 45_000,
    });

    const feedback = await page
      .locator("section", { has: page.getByRole("heading", { name: "Feedback" }) })
      .innerText();

    // Feedback is written against THIS interview's dimensions. "Code
    // quality: not demonstrated" on a behavioural interview is noise, and
    // was the failure mode before dimensions became per-type.
    if (journey.type === "Behavioural") {
      expect(feedback).toContain("Ownership");
      expect(feedback).not.toContain("Complexity reasoning");
      expect(feedback).not.toContain("Code quality");
    }
    if (journey.type === "System design") {
      expect(feedback).toContain("Scalability");
      expect(feedback).not.toContain("Code quality");
    }
    if (journey.type === "Low-level design") {
      expect(feedback).toContain("Design principles");
      expect(feedback).not.toContain("Estimation");
    }

    // The same no-score rule as everywhere else.
    expect(feedback).not.toMatch(/\b\d+\s*\/\s*10\b/);
    expect(feedback).not.toMatch(/\b\d+\s*%/);
    expect(feedback).not.toMatch(/\b(hire|no hire|strong hire)\b/i);
  });
}

test("a behavioural interview never leaks its rubric to the candidate", async ({
  page,
}) => {
  // `lookingFor` is what a strong answer demonstrates. Showing it during
  // the interview turns the question into a checklist to read off.
  await signUpAsLearner(page, "rubric");
  await startInterview(page, "Behavioural");
  await begin(page);

  const served = await page.content();
  for (const phrase of [
    "lookingFor",
    "Describes the difference concretely",
    "Something they changed about their own behaviour",
    "Owns the decision rather than attributing it upwards",
    "A real failure with real consequences",
  ]) {
    expect(served, phrase).not.toContain(phrase);
  }
});

test("a design interview never leaks its reference while it is running", async ({
  page,
}) => {
  await signUpAsLearner(page, "sdleak");
  await startInterview(page, "System design");
  await begin(page);

  const served = await page.content();
  for (const phrase of ["architecture", "scalingNotes", "bottlenecks", "tradeoffs"]) {
    expect(served.toLowerCase(), phrase).not.toContain(`"${phrase}"`);
  }
});

test("the client cannot skip the interview to the end", async ({ page }) => {
  await signUpAsLearner(page, "skip");
  await startInterview(page);

  const sessionId = page.url().split("/").pop()!;

  // Post directly to the endpoint claiming a later stage and request
  // type. The server owns both and must ignore whatever is sent.
  const result = await page.evaluate(async (id) => {
    const response = await fetch("/api/interview/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sessionId: id,
        message: "skip ahead",
        stage: "COMPLEXITY",
        requestType: "END_INTERVIEW",
      }),
    });
    const text = await response.text();
    return { status: response.status, text };
  }, sessionId);

  expect(result.status).toBe(200);
  // The meta event reports the stage the SERVER had stored — INTRO —
  // not the one the client asserted.
  expect(result.text).toContain('"stage":"INTRO"');
  expect(result.text).toContain('"requestType":"PRESENT_PROBLEM"');
  expect(result.text).not.toContain('"requestType":"END_INTERVIEW"');
});

test("one candidate cannot reach another's interview", async ({ page, browser }) => {
  test.slow();

  await signUpAsLearner(page, "alice");
  await startInterview(page);
  const aliceSession = page.url().split("/").pop()!;

  const context = await browser.newContext();
  const bobPage = await context.newPage();
  await signUpAsLearner(bobPage, "bob");

  // Bob gets the not-found page, not Alice's interview.
  //
  // The HTTP status is 200 rather than 404 because Next commits the
  // status when it starts streaming the shell, before the page's
  // `notFound()` runs. That is a framework behaviour, not a leak — what
  // matters, and what is asserted here, is that none of Alice's session
  // reaches Bob's browser.
  await bobPage.goto(`/interviews/${aliceSession}`);
  await expect(bobPage.getByTestId("interview-room")).toHaveCount(0);
  await expect(
    bobPage.getByRole("button", { name: "Begin interview" })
  ).toHaveCount(0);
  const bobSees = await bobPage.locator("body").innerText();
  expect(bobSees).not.toContain("Mock interview");

  // And the endpoint refuses too.
  const status = await bobPage.evaluate(async (id) => {
    const r = await fetch("/api/interview/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: id, message: "let me in" }),
    });
    return r.status;
  }, aliceSession);
  expect(status).toBe(404);

  await context.close();
});

test("an anonymous visitor cannot reach the interview endpoint", async ({ page }) => {
  await page.goto("/");
  const status = await page.evaluate(async () => {
    const r = await fetch("/api/interview/stream", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sessionId: "anything", message: "hello" }),
    });
    return r.status;
  });
  expect(status).toBe(401);
});

test("the interview room works on a phone", async ({ page }) => {
  test.skip(!isNarrow(page), "This assertion is about the mobile layout.");
  test.slow();

  await signUpAsLearner(page, "mobile");
  await startInterview(page);

  // Mobile gets tabs rather than a side-by-side editor.
  await expect(page.getByRole("tab", { name: "Interview" })).toBeVisible();

  await page.getByRole("button", { name: "Begin interview" }).click();
  await expect(
    page.getByTestId("interview-transcript").getByText("Interviewer").first()
  ).toBeVisible({ timeout: 30_000 });

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(2);
});

test("existing surfaces still work alongside interviews", async ({ page }) => {
  await page.goto("/learn/dsa");
  await expect(
    page.getByRole("heading", { level: 1, name: "Data Structures & Algorithms" })
  ).toBeVisible();

  await page.goto("/lld");
  await expect(
    page.getByRole("heading", { level: 1, name: "Low-Level Design Exercises" })
  ).toBeVisible();
});

// ---------------------------------------------------------------------------
// Preparation tracks
// ---------------------------------------------------------------------------

test("preparation tracks describe loop shapes, never an employer", async ({
  page,
}) => {
  // The whole feature rests on not claiming what any company asks. A
  // named employer on this page would be an unsupported assertion about
  // a real organisation.
  await page.goto("/prepare");
  await expect(
    page.getByRole("heading", { name: "Interview Preparation" })
  ).toBeVisible();
  await expect(page.getByText("These are shapes, not employers.")).toBeVisible();

  const first = page.getByRole("main").getByRole("link").filter({
    hasText: "Generalist engineering loop",
  });
  await first.click();
  await page.waitForURL(/\/prepare\/[a-z-]+$/);

  const body = await page.getByRole("main").innerText();
  for (const employer of [
    "Google",
    "Amazon",
    "Meta",
    "Microsoft",
    "Netflix",
    "Apple",
  ]) {
    expect(body, employer).not.toContain(employer);
  }

  // Every recommendation says who judged it and how sure they are.
  await expect(page.getByText(/CodeForge editorial/).first()).toBeVisible();
  await expect(page.getByText(/confidence/).first()).toBeVisible();
});

test("a track shows real progress for the learner, and none when signed out", async ({
  page,
}) => {
  await page.goto("/prepare");
  // Signed out: no progress claim at all, rather than a fabricated zero.
  await expect(page.getByText(/\d+ solved/)).toHaveCount(0);
  await expect(page.getByText("Sign in to track which of these")).toBeVisible();

  await signUpAsLearner(page, "prep");
  await page.goto("/prepare");
  await expect(page.getByText(/0 solved/).first()).toBeVisible();
});
