/**
 * Imports problems you have the right to use.
 *
 *   npm run problems:import -- ./licensed-set.json [--dry-run]
 *
 * The file is { "provenance": {...}, "problems": [ProblemSeed, ...] }. The whole
 * file is refused unless its source, licence and attribution are declared; see
 * src/lib/problem-provenance.ts. Existing slugs are left alone, so a re-run can
 * never overwrite an original problem.
 */
import { readFileSync } from "node:fs";

import { PrismaPg } from "@prisma/adapter-pg";

import { loadEnv } from "../prisma/load-env";
import { upsertProblem, upsertTopics } from "../prisma/problem-writer";
import type { ProblemSeed } from "../src/data/problems";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseConnection } from "../src/lib/db/ssl";
import { provenanceSchema } from "../src/lib/problem-provenance";

loadEnv();

async function main(): Promise<void> {
  const [file, flag] = process.argv.slice(2);
  if (!file)
    throw new Error("Usage: npm run problems:import -- <file.json> [--dry-run]");
  const data = JSON.parse(readFileSync(file, "utf8")) as {
    provenance?: unknown;
    problems?: ProblemSeed[];
  };
  const provenance = provenanceSchema.parse(data.provenance);
  const problems = data.problems ?? [];

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ ...databaseConnection(process.env.DATABASE_URL!), max: 2 }),
  });
  try {
    const existing = new Set(
      (await prisma.problem.findMany({ select: { slug: true } })).map((p) => p.slug)
    );
    const fresh = problems.filter((p) => !existing.has(p.slug));
    console.log(
      `${provenance.sourceName}: ${fresh.length} new, ${problems.length - fresh.length} skipped`
    );
    if (flag === "--dry-run") return;

    const patterns = await prisma.pattern.findMany({
      select: { id: true, slug: true },
    });
    const patternIds = new Map(patterns.map((p) => [p.slug, p.id]));
    const topicIds = await upsertTopics(prisma, fresh);
    const top = await prisma.problem.aggregate({ _max: { number: true } });
    let number = top._max.number ?? 0;
    for (const problem of fresh) {
      number += 1;
      const id = await upsertProblem(prisma, problem, number, patternIds, topicIds);
      await prisma.problem.update({ where: { id }, data: provenance });
    }
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});
