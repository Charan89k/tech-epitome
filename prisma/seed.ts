import "dotenv/config";

import { hash } from "@node-rs/argon2";
import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { ACHIEVEMENTS } from "../src/data/achievements";
import { DSA_COURSE } from "../src/data/curriculum";
import { PATTERNS } from "../src/data/patterns";
import { PROBLEMS } from "../src/data/problems";
import { QUIZZES } from "../src/data/quizzes";
import { buildAllStarters } from "../src/lib/code-execution/signature";

/**
 * Database seed.
 *
 * Idempotent by construction: every write is an upsert keyed on a natural
 * unique column (slug, email), so running it repeatedly converges on the
 * same state rather than accumulating duplicates. That matters because it
 * runs on every fresh checkout and after every `migrate reset`.
 *
 * Content lives in src/data/*, not inline here, so the same definitions can
 * be reused by tests and, later, by an admin importer.
 *
 * Ordering is deliberate: patterns and topics first, because chapters and
 * problems reference them by slug; problems before chapters, because a
 * chapter links to its practice problems.
 */

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set. Copy .env.example to .env first.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString,
    // The local `prisma dev` stand-in is PGlite-backed and cannot service
    // concurrent connections; the seed is sequential anyway.
    max: Number.parseInt(process.env.DATABASE_POOL_MAX ?? "5", 10) || 5,
  }),
});

/** Same parameters as the application's password hasher. */
const ARGON2 = { memoryCost: 19456, timeCost: 2, parallelism: 1 } as const;

/** Turns a slug into a display name: "two-pointers" -> "Two Pointers". */
function titleise(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

async function seedUsers() {
  const accounts = [
    {
      email: (process.env.SEED_ADMIN_EMAIL ?? "admin@codeforge.local").toLowerCase(),
      password: process.env.SEED_ADMIN_PASSWORD ?? "forge-admin-dev",
      name: "CodeForge Admin",
      role: "ADMIN" as const,
      plan: "PRO_YEARLY" as const,
    },
    {
      email: (process.env.SEED_DEMO_EMAIL ?? "demo@codeforge.local").toLowerCase(),
      password: process.env.SEED_DEMO_PASSWORD ?? "forge-demo-dev",
      name: "Demo Learner",
      role: "USER" as const,
      plan: "FREE" as const,
    },
  ];

  for (const account of accounts) {
    const passwordHash = await hash(account.password, ARGON2);

    const user = await prisma.user.upsert({
      where: { email: account.email },
      create: {
        email: account.email,
        name: account.name,
        role: account.role,
        passwordHash,
        emailVerified: new Date(),
      },
      // Re-running must not reset a password that has since been rotated,
      // so only the identifying fields are refreshed.
      update: { name: account.name, role: account.role },
      select: { id: true, email: true },
    });

    await prisma.profile.upsert({
      where: { userId: user.id },
      create: { userId: user.id },
      update: {},
    });

    await prisma.subscription.upsert({
      where: { userId: user.id },
      create: { userId: user.id, plan: account.plan, status: "ACTIVE" },
      update: { plan: account.plan, status: "ACTIVE" },
    });
  }

  console.log(`  users          ${accounts.length}`);
}

async function seedAchievements() {
  for (const achievement of ACHIEVEMENTS) {
    await prisma.achievement.upsert({
      where: { slug: achievement.slug },
      create: achievement,
      update: achievement,
    });
  }
  console.log(`  achievements   ${ACHIEVEMENTS.length}`);
}

async function seedPatterns(): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();

  for (const pattern of PATTERNS) {
    const row = await prisma.pattern.upsert({
      where: { slug: pattern.slug },
      create: { ...pattern, status: "PUBLISHED", access: "FREE" },
      update: { ...pattern, status: "PUBLISHED", access: "FREE" },
      select: { id: true },
    });
    bySlug.set(pattern.slug, row.id);
  }

  console.log(`  patterns       ${PATTERNS.length}`);
  return bySlug;
}

/** Topics are created on demand from whatever the problems reference. */
async function seedTopics(): Promise<Map<string, string>> {
  const slugs = [...new Set(PROBLEMS.flatMap((problem) => problem.topics))].sort();
  const bySlug = new Map<string, string>();

  for (const [index, slug] of slugs.entries()) {
    const row = await prisma.topic.upsert({
      where: { slug },
      create: { slug, name: titleise(slug), order: index * 10 },
      update: { name: titleise(slug), order: index * 10 },
      select: { id: true },
    });
    bySlug.set(slug, row.id);
  }

  console.log(`  topics         ${slugs.length}`);
  return bySlug;
}

async function seedProblems(
  patternIds: Map<string, string>,
  topicIds: Map<string, string>
): Promise<Map<string, string>> {
  const bySlug = new Map<string, string>();

  for (const [index, problem] of PROBLEMS.entries()) {
    // Problem numbers follow catalogue order, which is why appending to a
    // topic file is safe but reordering one is not.
    const number = index + 1;

    const starterCode = buildAllStarters(problem.signature);

    const row = await prisma.problem.upsert({
      where: { slug: problem.slug },
      create: {
        number,
        slug: problem.slug,
        title: problem.title,
        statement: problem.statement as object,
        learningObjective: problem.learningObjective,
        constraints: problem.constraints,
        difficulty: problem.difficulty,
        access: problem.access ?? "FREE",
        status: "PUBLISHED",
        starterCode,
        // The harness is regenerated from the signature at execution time,
        // so it is stored only for reference and debugging.
        harnessCode: { signature: problem.signature } as object,
        expectedTime: problem.expectedTime,
        expectedSpace: problem.expectedSpace,
      },
      update: {
        number,
        title: problem.title,
        statement: problem.statement as object,
        learningObjective: problem.learningObjective,
        constraints: problem.constraints,
        difficulty: problem.difficulty,
        access: problem.access ?? "FREE",
        status: "PUBLISHED",
        starterCode,
        harnessCode: { signature: problem.signature } as object,
        expectedTime: problem.expectedTime,
        expectedSpace: problem.expectedSpace,
      },
      select: { id: true },
    });

    bySlug.set(problem.slug, row.id);

    // Children are replaced wholesale rather than diffed. They have no
    // natural key beyond their ordinal, and nothing references them, so
    // delete-then-create is simpler and cannot drift.
    await prisma.testCase.deleteMany({ where: { problemId: row.id } });
    await prisma.testCase.createMany({
      data: problem.tests.map((test, order) => ({
        problemId: row.id,
        input: test.input,
        expected: test.expected,
        isSample: test.isSample ?? false,
        explanation: test.explanation ?? null,
        order,
      })),
    });

    await prisma.hint.deleteMany({ where: { problemId: row.id } });
    await prisma.hint.createMany({
      data: problem.hints.map((body, index) => ({
        problemId: row.id,
        order: index + 1,
        body,
      })),
    });

    await prisma.solution.deleteMany({ where: { problemId: row.id } });
    for (const solution of problem.solutions) {
      await prisma.solution.create({
        data: {
          problemId: row.id,
          title: solution.title,
          order: solution.order,
          intuition: solution.intuition,
          approach: solution.approach as object,
          code: solution.code as object,
          timeComplexity: solution.timeComplexity,
          spaceComplexity: solution.spaceComplexity,
          edgeCases: solution.edgeCases,
          commonMistakes: solution.commonMistakes,
        },
      });
    }

    await prisma.problemPattern.deleteMany({ where: { problemId: row.id } });
    for (const [position, slug] of problem.patterns.entries()) {
      const patternId = patternIds.get(slug);
      if (!patternId) {
        throw new Error(`Problem ${problem.slug} references unknown pattern ${slug}`);
      }
      await prisma.problemPattern.create({
        data: { problemId: row.id, patternId, isPrimary: position === 0 },
      });
    }

    await prisma.problemTopic.deleteMany({ where: { problemId: row.id } });
    for (const slug of problem.topics) {
      const topicId = topicIds.get(slug);
      if (!topicId) {
        throw new Error(`Problem ${problem.slug} references unknown topic ${slug}`);
      }
      await prisma.problemTopic.create({ data: { problemId: row.id, topicId } });
    }
  }

  console.log(`  problems       ${PROBLEMS.length}`);
  return bySlug;
}

async function seedCourse(
  patternIds: Map<string, string>,
  problemIds: Map<string, string>
): Promise<Map<string, string>> {
  const chapterIds = new Map<string, string>();

  const course = await prisma.course.upsert({
    where: { slug: DSA_COURSE.slug },
    create: {
      slug: DSA_COURSE.slug,
      title: DSA_COURSE.title,
      subtitle: DSA_COURSE.subtitle,
      description: DSA_COURSE.description,
      track: "DSA",
      icon: DSA_COURSE.icon,
      status: "PUBLISHED",
      access: "FREE",
      order: 0,
      estimatedHours: DSA_COURSE.estimatedHours,
    },
    update: {
      title: DSA_COURSE.title,
      subtitle: DSA_COURSE.subtitle,
      description: DSA_COURSE.description,
      icon: DSA_COURSE.icon,
      status: "PUBLISHED",
      estimatedHours: DSA_COURSE.estimatedHours,
    },
    select: { id: true },
  });

  let chapterCount = 0;

  for (const [sectionIndex, section] of DSA_COURSE.sections.entries()) {
    const sectionRow = await prisma.courseSection.upsert({
      where: { courseId_slug: { courseId: course.id, slug: section.slug } },
      create: {
        courseId: course.id,
        slug: section.slug,
        title: section.title,
        summary: section.summary,
        order: sectionIndex * 10,
        status: "PUBLISHED",
      },
      update: {
        title: section.title,
        summary: section.summary,
        order: sectionIndex * 10,
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    for (const [chapterIndex, chapter] of section.chapters.entries()) {
      const chapterRow = await prisma.chapter.upsert({
        where: {
          sectionId_slug: { sectionId: sectionRow.id, slug: chapter.slug },
        },
        create: {
          sectionId: sectionRow.id,
          slug: chapter.slug,
          title: chapter.title,
          summary: chapter.summary,
          content: chapter.content as object,
          objectives: chapter.objectives,
          keyTakeaways: chapter.keyTakeaways,
          readingMinutes: chapter.readingMinutes,
          difficulty: chapter.difficulty,
          order: chapterIndex * 10,
          status: "PUBLISHED",
          access: chapter.access ?? "FREE",
        },
        update: {
          title: chapter.title,
          summary: chapter.summary,
          content: chapter.content as object,
          objectives: chapter.objectives,
          keyTakeaways: chapter.keyTakeaways,
          readingMinutes: chapter.readingMinutes,
          difficulty: chapter.difficulty,
          order: chapterIndex * 10,
          status: "PUBLISHED",
          access: chapter.access ?? "FREE",
        },
        select: { id: true },
      });

      chapterIds.set(chapter.slug, chapterRow.id);
      chapterCount += 1;

      await prisma.chapterPattern.deleteMany({
        where: { chapterId: chapterRow.id },
      });
      for (const slug of chapter.patterns ?? []) {
        const patternId = patternIds.get(slug);
        if (!patternId) {
          throw new Error(`Chapter ${chapter.slug} references unknown pattern ${slug}`);
        }
        await prisma.chapterPattern.create({
          data: { chapterId: chapterRow.id, patternId },
        });
      }

      await prisma.chapterProblem.deleteMany({
        where: { chapterId: chapterRow.id },
      });
      for (const [order, slug] of (chapter.problems ?? []).entries()) {
        const problemId = problemIds.get(slug);
        if (!problemId) {
          throw new Error(`Chapter ${chapter.slug} references unknown problem ${slug}`);
        }
        await prisma.chapterProblem.create({
          data: { chapterId: chapterRow.id, problemId, order },
        });
      }
    }
  }

  console.log(
    `  curriculum     1 course, ${DSA_COURSE.sections.length} sections, ${chapterCount} chapters`
  );
  return chapterIds;
}

async function seedQuizzes(chapterIds: Map<string, string>) {
  for (const quiz of QUIZZES) {
    const chapterId = chapterIds.get(quiz.chapterSlug);
    if (!chapterId) {
      throw new Error(`Quiz ${quiz.slug} references unknown chapter ${quiz.chapterSlug}`);
    }

    const row = await prisma.quiz.upsert({
      where: { slug: quiz.slug },
      create: {
        slug: quiz.slug,
        title: quiz.title,
        description: quiz.description ?? null,
        chapterId,
        passScore: quiz.passScore ?? 70,
        status: "PUBLISHED",
        access: "FREE",
      },
      update: {
        title: quiz.title,
        description: quiz.description ?? null,
        chapterId,
        passScore: quiz.passScore ?? 70,
        status: "PUBLISHED",
      },
      select: { id: true },
    });

    // Questions are replaced wholesale. Attempts store the submitted answers
    // as a snapshot rather than by foreign key, so this cannot orphan them.
    await prisma.quizQuestion.deleteMany({ where: { quizId: row.id } });
    await prisma.quizQuestion.createMany({
      data: quiz.questions.map((question, order) => ({
        quizId: row.id,
        type: question.type,
        order,
        prompt: question.prompt,
        code: question.code ?? null,
        options: question.options as object,
        answer: question.answer as object,
        explanation: question.explanation,
        points: question.points ?? 1,
      })),
    });
  }

  const questionCount = QUIZZES.reduce((n, q) => n + q.questions.length, 0);
  console.log(`  quizzes        ${QUIZZES.length} (${questionCount} questions)`);
}

async function main() {
  console.log("Seeding CodeForge…");

  await seedUsers();
  await seedAchievements();

  const patternIds = await seedPatterns();
  const topicIds = await seedTopics();
  const problemIds = await seedProblems(patternIds, topicIds);
  const chapterIds = await seedCourse(patternIds, problemIds);
  await seedQuizzes(chapterIds);

  console.log("Seed complete.");
}

main()
  .catch((error) => {
    console.error("Seed failed:");
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
