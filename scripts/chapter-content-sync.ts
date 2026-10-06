/**
 * Targeted curriculum content sync.
 *
 * Narrow alternative to `prisma/seed.ts` for the case where only chapter
 * *content* has changed and the full seed must not run.
 *
 * The full seed is idempotent and safe for content, but it also upserts the
 * seed admin and demo accounts — and when SEED_ADMIN_PASSWORD is unset it
 * falls back to a development default, which would create a production admin
 * with a known password. That is not a risk worth taking to publish one
 * chapter, so this script exists instead.
 *
 * What it touches: the `content` JSON, and the small set of presentational
 * columns that travel with it, on chapters identified by their natural key
 * (course slug -> section slug -> chapter slug). Nothing else. It contains no
 * reference to any user-owned table, creates no rows, and deletes nothing.
 *
 * Safety properties, in order of importance:
 *
 *   1. Identification is by stable natural key, never by positional id.
 *   2. A chapter that does not already exist is an error, not a create. This
 *      script publishes edits; creating content is the seed's job.
 *   3. Everything happens in one transaction, so a mid-run failure leaves the
 *      curriculum exactly as it was.
 *   4. `--dry-run` reports precisely what would change and writes nothing.
 *   5. Idempotent: running it twice makes no second change, and the second
 *      run reports zero updates.
 *
 * Usage:
 *   npx tsx scripts/chapter-content-sync.ts --dry-run
 *   npx tsx scripts/chapter-content-sync.ts
 */
import { createHash } from "node:crypto";

import { PrismaPg } from "@prisma/adapter-pg";

import { PrismaClient } from "../src/generated/prisma/client";
import { DSA_COURSE } from "../src/data/curriculum";
import { loadEnv } from "../prisma/load-env";
import { databaseConnection } from "../src/lib/db/ssl";

loadEnv();

/**
 * The chapters this run is allowed to touch.
 *
 * An explicit allowlist rather than "every chapter in the source". Syncing
 * everything would make this a second seed by another name, and the blast
 * radius of a mistake is the whole curriculum rather than one page.
 */
const TARGETS = [
  {
    courseSlug: "dsa-foundations",
    sectionSlug: "arrays",
    chapterSlug: "traversal-and-in-place-work",
  },
] as const;

const dryRun = process.argv.includes("--dry-run");

/**
 * A stable form for comparing a content document against what Postgres
 * stored.
 *
 * Needed because a JSONB round trip is not byte-preserving: Postgres
 * reorders object keys, and `JSON.stringify` silently drops keys whose value
 * is `undefined` (which the content helpers produce for every optional field
 * the author left out). Hashing the raw objects therefore reports a
 * difference on every run, and the script rewrites an already-current
 * chapter forever. Sorting keys and dropping undefined makes the two sides
 * comparable.
 */
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value === null || typeof value !== "object") return value;

  const entries = Object.entries(value as Record<string, unknown>)
    .filter(([, v]) => v !== undefined)
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));

  return Object.fromEntries(entries.map(([k, v]) => [k, canonical(v)]));
}

function digest(value: unknown): string {
  return createHash("sha256")
    .update(JSON.stringify(canonical(value)))
    .digest("hex")
    .slice(0, 12);
}

/** Every visualization key referenced by a content document, in order. */
function visualizationKeys(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  return content
    .filter(
      (block): block is { type: string; visualizationKey: string } =>
        typeof block === "object" &&
        block !== null &&
        (block as { type?: unknown }).type === "visualization"
    )
    .map((block) => block.visualizationKey);
}

function blockTypes(content: unknown): string[] {
  if (!Array.isArray(content)) return [];
  return content.map((block) =>
    typeof block === "object" && block !== null
      ? String((block as { type?: unknown }).type)
      : "?"
  );
}

async function main() {
  // The pooled DATABASE_URL, not DIRECT_URL: Supabase's direct host is
  // IPv6-only and unreachable from many networks, while the pooler answers
  // on IPv4. Plain reads and short transactions work through it fine.
  const url = process.env.CONTENT_SYNC_URL ?? process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set.");

  // Reuses the application's own connection helper, which pins Supabase's
  // root CA. Supabase does not use a publicly-trusted CA for Postgres, and
  // the usual workaround (sslmode=no-verify) would drop verification of who
  // is on the other end of a connection that is about to write production
  // content. Pinning keeps full verification.
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ ...databaseConnection(url), max: 1 }),
  });

  // Redacted host, so the log proves which database was touched without
  // carrying the credentials that reached it.
  const host = new URL(url).host;
  console.log(`database host: ${host}`);
  console.log(dryRun ? "mode: DRY RUN (no writes)\n" : "mode: WRITE\n");

  let changed = 0;
  let unchanged = 0;

  try {
    for (const target of TARGETS) {
      const source = DSA_COURSE.sections
        .find((section) => section.slug === target.sectionSlug)
        ?.chapters.find((chapter) => chapter.slug === target.chapterSlug);

      if (!source) {
        throw new Error(
          `Source curriculum has no ${target.sectionSlug}/${target.chapterSlug}`
        );
      }

      // Resolve by natural key, one level at a time, so a wrong match is
      // impossible and a missing level names itself.
      const course = await prisma.course.findUnique({
        where: { slug: target.courseSlug },
        select: { id: true, title: true },
      });
      if (!course) throw new Error(`No course "${target.courseSlug}" in this database.`);

      const section = await prisma.courseSection.findUnique({
        where: { courseId_slug: { courseId: course.id, slug: target.sectionSlug } },
        select: { id: true },
      });
      if (!section) {
        throw new Error(`No section "${target.sectionSlug}" in ${target.courseSlug}.`);
      }

      const existing = await prisma.chapter.findUnique({
        where: { sectionId_slug: { sectionId: section.id, slug: target.chapterSlug } },
        select: {
          id: true,
          title: true,
          content: true,
          summary: true,
          objectives: true,
          keyTakeaways: true,
          readingMinutes: true,
          status: true,
        },
      });

      // Precondition: this script edits, it does not create.
      if (!existing) {
        throw new Error(
          `Chapter "${target.chapterSlug}" does not exist. This script updates ` +
            `existing chapters only - creating content is the seed's job.`
        );
      }

      const before = {
        blocks: blockTypes(existing.content),
        keys: visualizationKeys(existing.content),
        digest: digest(existing.content),
      };
      const after = {
        blocks: blockTypes(source.content),
        keys: visualizationKeys(source.content),
        digest: digest(source.content),
      };

      console.log(`chapter: ${existing.title}`);
      console.log(`  id                 ${existing.id}`);
      console.log(`  status             ${existing.status}`);
      console.log(`  blocks   before=${before.blocks.length}  after=${after.blocks.length}`);
      console.log(`  vizKeys  before=[${before.keys}]  after=[${after.keys}]`);
      console.log(`  digest   before=${before.digest}  after=${after.digest}`);

      const identical =
        before.digest === after.digest &&
        existing.title === source.title &&
        existing.summary === source.summary &&
        existing.readingMinutes === source.readingMinutes;

      if (identical) {
        console.log("  -> already up to date, no write\n");
        unchanged += 1;
        continue;
      }

      if (dryRun) {
        console.log("  -> WOULD UPDATE (dry run)\n");
        changed += 1;
        continue;
      }

      await prisma.$transaction(async (tx) => {
        await tx.chapter.update({
          where: { id: existing.id },
          data: {
            title: source.title,
            summary: source.summary,
            content: source.content as object,
            objectives: source.objectives,
            keyTakeaways: source.keyTakeaways,
            readingMinutes: source.readingMinutes,
          },
        });
      });

      console.log("  -> UPDATED\n");
      changed += 1;
    }

    console.log(`done. changed=${changed} unchanged=${unchanged}`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("chapter-content-sync failed:", error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
