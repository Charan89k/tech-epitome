import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { getPrepTrack, listPrepTrackSlugs, listPrepTracks } from "./prep";

/**
 * Preparation tracks.
 *
 * Two things are worth asserting here and nothing else is. First, the
 * provenance rule: a track may not recommend anything without saying who
 * decided it and why, because that rule is the only reason this feature
 * is honest rather than an invented claim about employers. Second,
 * progress is per-user and absent when there is no user — a fabricated
 * zero is still a fabrication.
 */

const SUFFIX = `${Date.now()}-${Math.floor(Math.random() * 100_000)}`;

let alice = "";
let bob = "";

beforeAll(async () => {
  const [a, b] = await Promise.all([
    prisma.user.create({
      data: { email: `prep-alice-${SUFFIX}@codeforge.test`, name: "Alice" },
      select: { id: true },
    }),
    prisma.user.create({
      data: { email: `prep-bob-${SUFFIX}@codeforge.test`, name: "Bob" },
      select: { id: true },
    }),
  ]);
  alice = a.id;
  bob = b.id;
});

afterAll(async () => {
  await prisma.user.deleteMany({ where: { id: { in: [alice, bob] } } });
});

describe("listing tracks", () => {
  it("returns the published tracks in order", async () => {
    const tracks = await listPrepTracks();
    expect(tracks.length).toBeGreaterThan(0);
    expect(tracks.every((t) => t.name.length > 0)).toBe(true);
  });

  it("reports no progress at all for a signed-out visitor", async () => {
    // Not zero — absent. "0 solved" implies we looked, and we did not.
    for (const track of await listPrepTracks()) {
      expect(track.solved, track.slug).toBeNull();
    }
  });

  it("reports a real count for a signed-in learner", async () => {
    for (const track of await listPrepTracks(alice)) {
      expect(track.solved, track.slug).toBe(0);
    }
  });
});

describe("the provenance rule", () => {
  it("attributes every single recommendation", async () => {
    // The feature is defensible only because nothing here is asserted
    // without saying who decided it and how sure they are.
    for (const slug of await listPrepTrackSlugs()) {
      const track = await getPrepTrack(slug);
      expect(track, slug).not.toBeNull();

      const recommendations = [...track!.problems, ...track!.systemDesign];
      expect(recommendations.length, slug).toBeGreaterThan(0);

      for (const item of recommendations) {
        expect(item.provenance.source.length, `${slug}/${item.slug}`).toBeGreaterThan(0);
        expect(item.provenance.rationale.length, `${slug}/${item.slug}`).toBeGreaterThan(
          20
        );
        expect(item.provenance.confidence).toBeGreaterThan(0);
        expect(item.provenance.confidence).toBeLessThanOrEqual(100);
        expect(item.provenance.reportedAt).toBeInstanceOf(Date);
      }
    }
  });

  it("names no employer anywhere in the published content", async () => {
    // The entire reason the tables were renamed. A track that named a
    // company would be asserting something CodeForge cannot support.
    const named = /\b(Google|Amazon|Meta|Facebook|Apple|Microsoft|Netflix|Uber|Stripe|Airbnb|OpenAI|Anthropic)\b/i;

    for (const slug of await listPrepTrackSlugs()) {
      const track = await getPrepTrack(slug);
      const text = JSON.stringify(track);
      expect(text.match(named)?.[0], `${slug} names an employer`).toBeUndefined();
    }
  });
});

describe("a track's detail", () => {
  it("carries a loop, a plan and something to do", async () => {
    const slug = (await listPrepTrackSlugs())[0]!;
    const track = await getPrepTrack(slug);

    expect(track!.interviewStages.length).toBeGreaterThan(0);
    expect(track!.roadmap.length).toBeGreaterThan(0);
    expect(track!.problems.length).toBeGreaterThan(0);
  });

  it("never ships a reading list containing solutions or statements", async () => {
    // A track is a list of links. Pulling the statement in would be a
    // silent widening of what this query returns.
    const slug = (await listPrepTrackSlugs())[0]!;
    const serialized = JSON.stringify(await getPrepTrack(slug));
    expect(serialized).not.toMatch(/"(statement|solutions|testCases|hints)"/);
  });

  it("hides progress from a learner who is not the one asking", async () => {
    const slug = (await listPrepTrackSlugs())[0]!;
    const track = await getPrepTrack(slug, alice);
    const problem = track!.problems[0]!;

    const row = await prisma.problem.findUniqueOrThrow({
      where: { slug: problem.slug },
      select: { id: true },
    });
    await prisma.userProblemProgress.create({
      data: { userId: alice, problemId: row.id, status: "SOLVED" },
    });

    const mine = await getPrepTrack(slug, alice);
    const theirs = await getPrepTrack(slug, bob);

    expect(mine!.progress!.solved).toBe(1);
    expect(theirs!.progress!.solved).toBe(0);
  });

  it("returns null for an unknown track rather than an empty one", async () => {
    expect(await getPrepTrack("no-such-track")).toBeNull();
  });

  it("does not expose an unpublished track", async () => {
    const slug = `draft-track-${SUFFIX}`;
    await prisma.prepTrack.create({
      data: { slug, name: "Draft", blurb: "Not ready", status: "DRAFT" },
    });

    expect(await getPrepTrack(slug)).toBeNull();
    expect(await listPrepTrackSlugs()).not.toContain(slug);

    await prisma.prepTrack.delete({ where: { slug } });
  });
});
