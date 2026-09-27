import { expect, test, type Page } from "@playwright/test";

import { closeDb, makePro } from "./db";

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

async function signUpAsPro(page: Page, tag: string): Promise<string> {
  const email = uniqueEmail(tag);
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Candidate");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });
  await makePro(email);
  await page.reload();
  return email;
}

function isNarrow(page: Page): boolean {
  return (page.viewportSize()?.width ?? 1280) < 1024;
}

/** Starts an interview and lands in the room. */
async function startInterview(page: Page) {
  await page.goto("/interviews");
  await page.getByRole("button", { name: "Start interview" }).click();
  await page.waitForURL(/\/interviews\/[a-z0-9]+$/, { timeout: 30_000 });
  await expect(page.getByTestId("interview-room")).toBeVisible({ timeout: 30_000 });
}

test.afterAll(async () => {
  await closeDb();
});

// ---------------------------------------------------------------------------

test("a free learner is offered the plan rather than the interviewer", async ({
  page,
}) => {
  const email = uniqueEmail("free");
  await page.goto("/signup");
  await page.getByLabel("Name").fill("Free");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(PASSWORD);
  await page.getByRole("button", { name: "Create account" }).click();
  await page.waitForURL("**/dashboard", { timeout: 30_000 });

  await page.goto("/interviews");
  await expect(
    page.getByRole("heading", { name: /Mock interviews are part of Pro/i })
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "Start interview" })).toHaveCount(0);
});

test("the dashboard shows real counts, starting at zero", async ({ page }) => {
  await signUpAsPro(page, "counts");
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
  await signUpAsPro(page, "journey");
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

test("the client cannot skip the interview to the end", async ({ page }) => {
  await signUpAsPro(page, "skip");
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

  await signUpAsPro(page, "alice");
  await startInterview(page);
  const aliceSession = page.url().split("/").pop()!;

  const context = await browser.newContext();
  const bobPage = await context.newPage();
  await signUpAsPro(bobPage, "bob");

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

  await signUpAsPro(page, "mobile");
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
