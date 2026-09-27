import { describe, expect, it } from "vitest";

import { prisma } from "@/lib/db";
import { getSearchService } from "./index";

/**
 * Search, against the real index.
 *
 * Two things worth asserting. First that the design-exercise catalogues
 * are actually reachable — they carry `tsvector` columns and GIN indexes
 * but were not queried until Phase 8's audit, so they existed and were
 * unfindable. Second, and more important, that **no reference material
 * is searchable or returned**: the triggers feed those vectors from
 * title, tagline and requirements only, so a learner cannot locate an
 * exercise by searching for a phrase that appears solely in its
 * reference solution.
 */

const search = getSearchService();

describe("what search covers", () => {
  it("finds chapters", async () => {
    const results = await search.search("complexity");
    expect(results.some((r) => r.type === "chapter")).toBe(true);
  });

  it("finds problems", async () => {
    const results = await search.search("altitude");
    expect(results.some((r) => r.type === "problem")).toBe(true);
  });

  it("finds system-design exercises", async () => {
    const results = await search.search("short link");
    const hit = results.find((r) => r.type === "system-design");
    expect(hit, "system-design exercises should be searchable").toBeTruthy();
    expect(hit!.href).toMatch(/^\/system-design\//);
  });

  it("finds LLD exercises", async () => {
    const results = await search.search("parking garage");
    const hit = results.find((r) => r.type === "lld");
    expect(hit, "LLD exercises should be searchable").toBeTruthy();
    expect(hit!.href).toMatch(/^\/lld\//);
  });

  it("finds LLD chapters, which are ordinary chapters", async () => {
    const results = await search.search("cohesion");
    expect(results.some((r) => r.type === "chapter")).toBe(true);
  });

  it("returns nothing for an empty or meaningless query", async () => {
    expect(await search.search("")).toEqual([]);
    expect(await search.search("   ")).toEqual([]);
  });
});

describe("what search must NOT expose", () => {
  it("cannot locate an LLD exercise by text unique to its reference solution", async () => {
    // Pull a phrase that exists only in the reference trade-offs — never
    // in the title, tagline or requirements that feed the tsvector.
    const problem = await prisma.lLDProblem.findFirst({
      where: { status: "PUBLISHED", slug: "event-logger" },
      select: { tradeoffs: true, slug: true },
    });
    expect(problem, "seed the database before running these").toBeTruthy();

    const tradeoffs = (problem!.tradeoffs ?? []) as { chose?: string }[];
    const referenceOnly = tradeoffs
      .map((t) => t.chose)
      .find((c): c is string => Boolean(c && c.includes("Formatter")));
    expect(referenceOnly, "fixture should have reference-only text").toBeTruthy();

    const results = await search.search("Formatter");
    // The exercise must not surface from a term that appears only in its
    // withheld reference material.
    expect(results.some((r) => r.href === `/lld/${problem!.slug}`)).toBe(false);
  });

  it("never returns reference fields in a result payload", async () => {
    const results = await search.search("parking");
    const serialised = JSON.stringify(results);

    for (const field of ["classDiagram", "architecture", "tradeoffs", "hints", "code"]) {
      expect(serialised).not.toContain(`"${field}"`);
    }
    // Results carry only what a listing needs.
    for (const result of results) {
      expect(Object.keys(result).sort()).toEqual(
        ["description", "href", "id", "rank", "title", "type"].sort()
      );
    }
  });

  it("does not return unpublished content", async () => {
    const draft = await prisma.lLDProblem.findFirst({
      where: { status: { not: "PUBLISHED" } },
      select: { slug: true },
    });
    if (!draft) return; // nothing unpublished in the seed; nothing to prove

    const results = await search.search(draft.slug.replace(/-/g, " "));
    expect(results.some((r) => r.href.includes(draft.slug))).toBe(false);
  });
});
