import { describe, expect, it } from "vitest";

import { toPrefixQuery } from "./query";

/**
 * This function interpolates its result into a raw SQL call, so its job is
 * as much sanitisation as it is parsing. The tests below are written from
 * that angle: what can a user put in, and can any of it escape?
 */
describe("toPrefixQuery", () => {
  it("adds a prefix marker to each term", () => {
    expect(toPrefixQuery("sliding window")).toBe("sliding:* & window:*");
  });

  it("is case insensitive", () => {
    expect(toPrefixQuery("Binary SEARCH")).toBe("binary:* & search:*");
  });

  it("returns null when there is nothing searchable", () => {
    expect(toPrefixQuery("")).toBeNull();
    expect(toPrefixQuery("   ")).toBeNull();
    expect(toPrefixQuery("!!! ??? ***")).toBeNull();
  });

  it("strips tsquery operators rather than passing them through", () => {
    // Every one of these is meaningful to to_tsquery. None may survive.
    const result = toPrefixQuery("two & pointers | !sliding");
    expect(result).toBe("two:* & pointers:* & sliding:*");
    expect(result).not.toContain("|");
    expect(result).not.toContain("!");
  });

  it("strips quotes and parentheses", () => {
    const result = toPrefixQuery(`'drop' "table" (x)`);
    expect(result).toBe("drop:* & table:* & x:*");
    expect(result).not.toMatch(/['"()]/);
  });

  it("neutralises an attempted SQL escape", () => {
    // Not a realistic exploit — the value is parameterised — but the
    // tokenizer is the first line, and it should leave nothing dangerous.
    const result = toPrefixQuery("'; DROP TABLE users; --");
    expect(result).toBe("drop:* & table:* & users:*");
    expect(result).not.toContain(";");
    expect(result).not.toContain("-");
  });

  it("keeps digits, which appear in real queries", () => {
    expect(toPrefixQuery("o(n log n) 2 pointers")).toBe(
      "o:* & n:* & log:* & n:* & 2:* & pointers:*"
    );
  });

  it("caps the number of terms so a paste cannot build a huge query", () => {
    const many = Array.from({ length: 40 }, (_, i) => `term${i}`).join(" ");
    const result = toPrefixQuery(many);
    expect(result!.split(" & ")).toHaveLength(8);
  });

  it("handles a single character", () => {
    expect(toPrefixQuery("a")).toBe("a:*");
  });
});
