import { expect, test, type Browser, type Page } from "@playwright/test";

import { closeDb, execSql, userIdFor } from "./db";
import { signUp } from "./helpers";

/**
 * The campus learning lifecycle through the running app: a faculty member
 * builds a class, a question bank and an exam; a student takes it with
 * autosave and a reload in the middle; the faculty member closes it and
 * releases results; the student sees them. Then the boundaries: a student
 * outside the class and a student from another college get nothing.
 *
 * The service suite (src/services/campus.integration.test.ts) proves the
 * rules and the database policies; this proves the pages and actions do
 * not weaken them. Memberships are seeded in SQL, exactly as an accepted
 * invitation leaves them.
 */

test.describe.configure({ mode: "serial" });
test.afterAll(async () => closeDb());

const tag = `${Date.now()}-${Math.floor(Math.random() * 1e6)}`;
const slug = `e2e-learn-${tag}`;
const otherSlug = `e2e-other-${tag}`;
const email = (who: string) => `${who}-${tag}@techepitome.test`;

async function institution(id: string, s: string, name: string) {
  await execSql(
    `INSERT INTO institutions (id, slug, name, "updatedAt") VALUES ($1, $2, $3, now())`,
    [id, s, name]
  );
}

async function member(institutionId: string, who: string, role: string) {
  await execSql(
    `INSERT INTO institution_memberships (id, "institutionId", "userId", role, source, "updatedAt")
     VALUES ($1, $2, $3, $4::"InstitutionRole", 'PLATFORM', now())`,
    [`mem_${who}_${tag}`, institutionId, await userIdFor(email(who)), role]
  );
}

async function personPage(browser: Browser, who: string): Promise<Page> {
  const page = await (await browser.newContext()).newPage();
  await signUp(page, email(who), who);
  return page;
}

/** A datetime-local value N minutes from now, in the browser's zone. */
const localIn = (minutes: number) => {
  const d = new Date(Date.now() + minutes * 60_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000)
    .toISOString()
    .slice(0, 16);
};

let faculty: Page;
let student: Page;
let assessmentUrl = "";

test("faculty builds a class, a bank and an exam; a student takes it", async ({
  browser,
}) => {
  test.setTimeout(240_000);
  await institution(`inst_learn_${tag}`, slug, `Learn College ${tag}`);
  await institution(`inst_other_${tag}`, otherSlug, `Other College ${tag}`);

  faculty = await personPage(browser, "faculty");
  student = await personPage(browser, "student");
  await member(`inst_learn_${tag}`, "faculty", "FACULTY");
  await member(`inst_learn_${tag}`, "student", "STUDENT");

  // Class and roster.
  await faculty.goto(`/campus/${slug}`);
  await faculty.getByLabel("New class name").fill("CS101");
  await faculty.getByRole("button", { name: "Create class" }).click();
  await expect(faculty.getByRole("heading", { name: "CS101" })).toBeVisible();
  const classUrl = faculty.url().split("?")[0]!;
  await faculty.getByLabel("Add a member by email").fill(email("student"));
  await faculty.getByRole("button", { name: "Add", exact: true }).click();
  await expect(faculty.getByText(/student \(student\)/)).toBeVisible();

  // Question bank with one multiple-choice question.
  await faculty.goto(`/campus/${slug}/banks`);
  await faculty.getByLabel("New bank name").fill("Midterm bank");
  await faculty.getByRole("button", { name: "Create bank" }).click();
  await expect(faculty.getByRole("heading", { name: "Midterm bank" })).toBeVisible();
  await faculty.getByLabel("Question", { exact: true }).fill("What is 2 + 2?");
  await faculty.getByLabel("Options").fill("3\n*4\n5");
  await faculty.getByLabel("Points", { exact: true }).first().fill("2");
  await faculty.getByRole("button", { name: "Add question" }).first().click();
  await expect(faculty.getByText("What is 2 + 2?")).toBeVisible();

  // Draft, add the question, publish.
  await faculty.goto(classUrl);
  await faculty.getByText("New assessment").click();
  await faculty.getByLabel("Title").fill("Quiz 1");
  await faculty.getByLabel("Deadline").fill(localIn(120));
  await faculty.getByRole("button", { name: "Create draft" }).click();
  await expect(faculty.getByRole("heading", { name: "Quiz 1" })).toBeVisible();
  assessmentUrl = faculty.url().split("?")[0]!;
  await faculty.getByRole("button", { name: "Add", exact: true }).click();
  await expect(
    faculty.getByRole("heading", { name: /Questions \(1, 2 points\)/ })
  ).toBeVisible();
  await faculty.getByRole("button", { name: "Publish" }).click();
  await expect(
    faculty.getByText("Published. The questions are now frozen.")
  ).toBeVisible();

  // The student finds it from the class, starts, answers, reloads mid-exam.
  await student.goto(`/campus/${slug}`);
  await student.getByRole("link", { name: "CS101" }).click();
  await student.getByRole("link", { name: "Quiz 1" }).click();
  await student.getByRole("button", { name: "Start" }).click();
  // The first visit compiles the exam route (Monaco included) in dev.
  await expect(student.getByRole("region", { name: "Exam status" })).toBeVisible({
    timeout: 60_000,
  });
  await student.getByLabel("4").check();
  await expect(student.getByText("Saved", { exact: true })).toBeVisible();
  await student.reload();
  await expect(student.getByLabel("4")).toBeChecked();

  await student.getByRole("button", { name: "Submit answers" }).click();
  await student.getByRole("button", { name: "Yes, submit" }).click();
  await expect(student.getByText("Submitted. Your answers are final.")).toBeVisible();
  // No answers or score before release.
  await expect(student.getByText(/releases results/i)).toBeVisible();
});

test("faculty closes and releases; the student then sees the answers", async () => {
  await faculty.goto(assessmentUrl);
  const row = faculty.getByRole("row", { name: /student/ });
  await expect(row).toContainText("Submitted");
  await expect(row).toContainText("2 / 2");
  await faculty.getByRole("button", { name: "Close now" }).click();
  await faculty.getByRole("button", { name: "Release results" }).click();
  await expect(faculty.getByRole("button", { name: "Release results" })).toHaveCount(0);

  await student.goto(assessmentUrl);
  await student.getByRole("link", { name: "Attempt 1" }).click();
  await expect(student.getByText("(correct)")).toBeVisible();
  await expect(student.getByText("2 / 2", { exact: true })).toBeVisible();
});

test("nobody outside the class or the college reaches the exam", async ({
  browser,
}) => {
  const outsider = await personPage(browser, "outsider");
  await member(`inst_learn_${tag}`, "outsider", "STUDENT");
  const stranger = await personPage(browser, "stranger");
  await member(`inst_other_${tag}`, "stranger", "STUDENT");

  // The root loading boundary streams every page, so a refusal renders the
  // not-found or forbidden page under a 200; assert what is on screen.
  const notFound = "That page does not exist";
  for (const page of [outsider, stranger]) {
    await page.goto(assessmentUrl);
    await expect(page.getByRole("heading", { name: notFound })).toBeVisible();
    await expect(page.getByText("Quiz 1")).toHaveCount(0);
    await expect(page.getByText("What is 2 + 2?")).toHaveCount(0);
  }
  // In the class but not staff: it may know the exam exists, but gets no
  // preview (which carries the key) and no banks.
  const forbidden = "You do not have access to this";
  await student.goto(`${assessmentUrl}/preview`);
  await expect(student.getByRole("heading", { name: forbidden })).toBeVisible();
  await expect(student.getByText("Explanation")).toHaveCount(0);
  await student.goto(`/campus/${slug}/banks`);
  await expect(student.getByRole("heading", { name: forbidden })).toBeVisible();
  await expect(student.getByText("Midterm bank")).toHaveCount(0);
});
