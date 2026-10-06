import type { PrismaClient } from "../src/generated/prisma/client";
import type { ProblemSeed } from "../src/data/problems";
import { buildAllStarters } from "../src/lib/code-execution/signature";

/**
 * Writes problems and their topics.
 *
 * Shared by the seed and by scripts/problem-sync.ts, so a problem published
 * to production is written exactly as a fresh database would write it —
 * there is one definition of "a problem in the database", not two that can
 * drift.
 *
 * Idempotent: the problem upserts on its slug, and its children are replaced
 * wholesale (they have no natural key beyond their ordinal, and nothing
 * references them), so running it twice converges on the same rows.
 */

export function titleise(slug: string): string {
  return slug
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Topics are created on demand from whatever the problems reference. */
export async function upsertTopics(
  prisma: PrismaClient,
  problems: ProblemSeed[]
): Promise<Map<string, string>> {
  const slugs = [...new Set(problems.flatMap((problem) => problem.topics))].sort();
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
  return bySlug;
}

/** Upserts one problem and replaces its children. Returns its id. */
export async function upsertProblem(
  prisma: PrismaClient,
  problem: ProblemSeed,
  number: number,
  patternIds: Map<string, string>,
  topicIds: Map<string, string>
): Promise<string> {
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
      status: "PUBLISHED",
      starterCode,
      harnessCode: { signature: problem.signature } as object,
      expectedTime: problem.expectedTime,
      expectedSpace: problem.expectedSpace,
    },
    select: { id: true },
  });

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

  return row.id;
}
