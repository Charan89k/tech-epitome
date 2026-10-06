/**
 * Publishes the problem catalogue to a database without running the seed.
 *
 *   npm run problems:sync:prod:dry    what would change in production
 *   npm run problems:sync:prod        create problems production lacks
 *   ... -- --all                      also rewrite existing problems
 *
 * Why not the seed: the full seed also upserts the seed admin and demo
 * accounts, and with SEED_ADMIN_PASSWORD unset it falls back to a development
 * default — running it against production would create an admin with a known
 * password. This touches problems, their tests/hints/solutions, and the
 * topics and pattern links they reference. No users, no progress, no other
 * content, and it deletes nothing but a synced problem's own child rows,
 * which it immediately rewrites.
 *
 * Safety properties:
 *   1. Default is additive: only problems missing from the database are
 *      written. Rewriting existing ones needs --all.
 *   2. Problems are identified by slug and numbered by catalogue position,
 *      exactly as the seed numbers them, so the two never disagree.
 *   3. Every referenced pattern must already exist; the run stops before
 *      writing anything if one does not.
 *   4. Each problem is written in its own transaction, so a failure leaves
 *      every problem either fully old or fully new.
 *   5. --dry-run reads only.
 *
 * Connection: the pooled DATABASE_URL, which is reachable over IPv4 — the
 * direct host is IPv6-only and unreachable from many networks. Override
 * with PROBLEM_SYNC_URL if needed.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import { loadEnv } from "../prisma/load-env";
import { upsertProblem, upsertTopics } from "../prisma/problem-writer";
import { PROBLEMS } from "../src/data/problems";
import { PrismaClient } from "../src/generated/prisma/client";
import { databaseConnection } from "../src/lib/db/ssl";

loadEnv();

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

async function main() {
  const url = process.env.PROBLEM_SYNC_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  const prisma = new PrismaClient({
    adapter: new PrismaPg({ ...databaseConnection(url), max: 1 }),
  });

  try {
    const host = new URL(url).host;
    console.log(`database host: ${host}`);
    console.log(
      `mode: ${dryRun ? "DRY RUN (no writes)" : all ? "WRITE (new + existing)" : "WRITE (new only)"}`
    );

    const existing = new Set(
      (await prisma.problem.findMany({ select: { slug: true } })).map((p) => p.slug)
    );
    const patterns = await prisma.pattern.findMany({
      select: { id: true, slug: true },
    });
    const patternIds = new Map(patterns.map((p) => [p.slug, p.id]));

    const missingPatterns = [
      ...new Set(
        PROBLEMS.flatMap((p) => p.patterns).filter((slug) => !patternIds.has(slug))
      ),
    ];
    if (missingPatterns.length) {
      throw new Error(
        `The database lacks pattern(s) ${missingPatterns.join(", ")}. Publish patterns first; nothing was written.`
      );
    }

    const targets = PROBLEMS.map((problem, index) => ({
      problem,
      number: index + 1,
    })).filter(({ problem }) => all || !existing.has(problem.slug));
    const creating = targets.filter(({ problem }) => !existing.has(problem.slug));
    const updating = targets.filter(({ problem }) => existing.has(problem.slug));

    console.log(`catalogue ${PROBLEMS.length} · in database ${existing.size}`);
    console.log(
      `would create ${creating.length}${all ? ` · would rewrite ${updating.length}` : ""}`
    );
    for (const { problem, number } of creating) {
      console.log(`  + #${number} ${problem.slug} (${problem.difficulty})`);
    }

    if (dryRun || targets.length === 0) {
      console.log(dryRun ? "\nDry run: nothing written." : "\nNothing to do.");
      return;
    }

    // Topics are upserted for the whole catalogue: cheap, idempotent, and
    // keeps their display order identical to a freshly seeded database.
    const topicIds = await upsertTopics(prisma, PROBLEMS);

    let done = 0;
    for (const { problem, number } of targets) {
      await prisma.$transaction(
        async (tx) => {
          await upsertProblem(
            tx as unknown as PrismaClient,
            problem,
            number,
            patternIds,
            topicIds
          );
        },
        { timeout: 60_000, maxWait: 30_000 }
      );
      done++;
      if (done % 10 === 0 || done === targets.length)
        console.log(`  written ${done}/${targets.length}`);
    }
    console.log(
      `\nDone: ${creating.length} created${all ? `, ${updating.length} rewritten` : ""}.`
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    `problem-sync failed: ${error instanceof Error ? error.message : error}`
  );
  process.exit(1);
});
