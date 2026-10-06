/**
 * Publishes course content and design exercises without running the seed.
 *
 *   npm run content:publish:prod:dry   what production is missing
 *   npm run content:publish:prod       create it
 *   ... -- --all                       also rewrite existing rows from source
 *
 * Covers the three courses (DSA, System Design, LLD) and both exercise
 * catalogues. The full seed is not an option against production: it also
 * upserts the seed admin with a development-default password.
 *
 * Safety properties:
 *   1. Default is additive. Missing sections, chapters and exercises are
 *      created; every existing row is left exactly as it is, including its
 *      status — an admin's unpublish is never undone by a deploy.
 *   2. Ordering comes from position in the source, and new content is
 *      appended, so nothing existing is renumbered.
 *   3. Writes go through prisma/content-writer.ts, the same code the seed
 *      uses, so a published chapter is identical to a seeded one.
 *   4. Each course and each catalogue is written in its own transaction.
 *   5. --dry-run reads only.
 *
 * Connection: the pooled DATABASE_URL (IPv4); override with CONTENT_SYNC_URL.
 */
import { PrismaPg } from "@prisma/adapter-pg";

import {
  upsertCourse,
  upsertLLDExercises,
  upsertSystemDesignExercises,
} from "../prisma/content-writer";
import { loadEnv } from "../prisma/load-env";
import { DSA_COURSE } from "../src/data/curriculum";
import type { CourseSeed } from "../src/data/curriculum/types";
import { LLD_COURSE } from "../src/data/lld";
import { LLD_EXERCISES } from "../src/data/lld/exercises";
import { SYSTEM_DESIGN_COURSE } from "../src/data/system-design";
import { SYSTEM_DESIGN_EXERCISES } from "../src/data/system-design/exercises";
import { PrismaClient } from "../src/generated/prisma/client";
import type { Track } from "../src/generated/prisma/enums";
import { databaseConnection } from "../src/lib/db/ssl";

loadEnv();

const dryRun = process.argv.includes("--dry-run");
const all = process.argv.includes("--all");

/** Same course order values the seed uses. */
const COURSES: { seed: CourseSeed; track: Track; order: number }[] = [
  { seed: DSA_COURSE, track: "DSA", order: 0 },
  { seed: SYSTEM_DESIGN_COURSE, track: "SYSTEM_DESIGN", order: 10 },
  { seed: LLD_COURSE, track: "LLD", order: 20 },
];

async function main() {
  const url = process.env.CONTENT_SYNC_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");
  const db = new PrismaClient({
    adapter: new PrismaPg({ ...databaseConnection(url), max: 1 }),
  });

  try {
    console.log(`database host: ${new URL(url).host}`);
    console.log(
      `mode: ${dryRun ? "DRY RUN (no writes)" : all ? "WRITE (new + rewrite existing)" : "WRITE (new only)"}`
    );

    // ---- What is missing ---------------------------------------------------
    const missing: string[] = [];
    for (const { seed } of COURSES) {
      const course = await db.course.findUnique({
        where: { slug: seed.slug },
        select: {
          sections: { select: { slug: true, chapters: { select: { slug: true } } } },
        },
      });
      const sections = new Map(
        (course?.sections ?? []).map((s) => [
          s.slug,
          new Set(s.chapters.map((c) => c.slug)),
        ])
      );
      if (!course) missing.push(`course ${seed.slug}`);
      for (const section of seed.sections) {
        const chapters = sections.get(section.slug);
        if (!chapters)
          missing.push(
            `section ${seed.slug}/${section.slug} (${section.chapters.length} chapters)`
          );
        for (const chapter of section.chapters) {
          if (!chapters?.has(chapter.slug))
            missing.push(`  chapter ${section.slug}/${chapter.slug}`);
        }
      }
    }
    const sdExisting = new Set(
      (await db.systemDesignProblem.findMany({ select: { slug: true } })).map(
        (r) => r.slug
      )
    );
    for (const e of SYSTEM_DESIGN_EXERCISES)
      if (!sdExisting.has(e.slug)) missing.push(`system-design exercise ${e.slug}`);
    const lldExisting = new Set(
      (await db.lLDProblem.findMany({ select: { slug: true } })).map((r) => r.slug)
    );
    for (const e of LLD_EXERCISES)
      if (!lldExisting.has(e.slug)) missing.push(`lld exercise ${e.slug}`);

    console.log(
      `\nmissing from the database: ${missing.filter((m) => !m.startsWith("  ")).length} top-level items`
    );
    for (const line of missing) console.log(`  + ${line}`);

    if (dryRun) {
      console.log("\nDry run: nothing written.");
      return;
    }
    if (missing.length === 0 && !all) {
      console.log("\nNothing to do.");
      return;
    }

    // ---- Links the chapters need -----------------------------------------
    const patternIds = new Map(
      (await db.pattern.findMany({ select: { id: true, slug: true } })).map((p) => [
        p.slug,
        p.id,
      ])
    );
    const problemIds = new Map(
      (await db.problem.findMany({ select: { id: true, slug: true } })).map((p) => [
        p.slug,
        p.id,
      ])
    );

    const created: string[] = [];
    const options = { onlyNew: !all, created };
    const tx = { timeout: 300_000, maxWait: 60_000 };

    for (const { seed, track, order } of COURSES) {
      await db.$transaction(
        (t) =>
          upsertCourse(
            t as unknown as PrismaClient,
            seed,
            track,
            order,
            patternIds,
            problemIds,
            options
          ),
        tx
      );
    }
    await db.$transaction(
      (t) =>
        upsertSystemDesignExercises(
          t as unknown as PrismaClient,
          SYSTEM_DESIGN_EXERCISES,
          options
        ),
      tx
    );
    await db.$transaction(
      (t) => upsertLLDExercises(t as unknown as PrismaClient, LLD_EXERCISES, options),
      tx
    );

    console.log(`\nDone. Created ${created.length}:`);
    for (const line of created) console.log(`  ${line}`);
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error(
    `content-sync failed: ${error instanceof Error ? error.message : error}`
  );
  process.exit(1);
});
