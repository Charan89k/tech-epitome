import { describe, expect, it } from "vitest";

import { computeStandings, contestPhase } from "./contest-scoring";

const startsAt = new Date("2026-11-01T10:00:00Z");
const contest = {
  startsAt,
  penaltyMinutes: 5,
  problems: [
    { problemId: "a", points: 100 },
    { problemId: "b", points: 200 },
  ],
};
const at = (minutes: number) => new Date(startsAt.getTime() + minutes * 60_000);
const sub = (userId: string, problemId: string, status: string, minutes: number) => ({
  userId,
  problemId,
  status,
  createdAt: at(minutes),
});

describe("computeStandings", () => {
  it("ranks by points, then by time plus penalties", () => {
    const rows = computeStandings(
      contest,
      ["u1", "u2", "u3"],
      [
        sub("u1", "a", "ACCEPTED", 10),
        sub("u2", "b", "ACCEPTED", 30),
        sub("u3", "a", "WRONG_ANSWER", 5),
        sub("u3", "a", "ACCEPTED", 8),
      ]
    );
    expect(rows.map((r) => r.userId)).toEqual(["u2", "u1", "u3"]);
    expect(rows.find((r) => r.userId === "u3")?.penalty).toBe(13);
    expect(rows.find((r) => r.userId === "u1")?.penalty).toBe(10);
  });

  it("charges nothing for failures on a problem never solved", () => {
    const [row] = computeStandings(
      contest,
      ["u1"],
      [sub("u1", "a", "WRONG_ANSWER", 1), sub("u1", "a", "RUNTIME_ERROR", 2)]
    );
    expect(row).toMatchObject({ score: 0, solved: 0, penalty: 0 });
  });

  it("counts a problem once, however many times it is accepted", () => {
    const [row] = computeStandings(
      contest,
      ["u1"],
      [sub("u1", "a", "ACCEPTED", 1), sub("u1", "a", "ACCEPTED", 2)]
    );
    expect(row).toMatchObject({ score: 100, solved: 1, penalty: 1 });
  });

  it("does not penalise our own failures", () => {
    const [row] = computeStandings(
      contest,
      ["u1"],
      [sub("u1", "a", "INTERNAL_ERROR", 1), sub("u1", "a", "ACCEPTED", 2)]
    );
    expect(row?.penalty).toBe(2);
  });

  it("ignores people who did not enter and problems outside the contest", () => {
    const rows = computeStandings(
      contest,
      ["u1"],
      [sub("stranger", "a", "ACCEPTED", 1), sub("u1", "other", "ACCEPTED", 1)]
    );
    expect(rows).toHaveLength(1);
    expect(rows[0]?.score).toBe(0);
  });

  it("gives equal entrants the same rank and skips the next", () => {
    const rows = computeStandings(
      contest,
      ["u1", "u2", "u3"],
      [sub("u1", "a", "ACCEPTED", 5), sub("u2", "a", "ACCEPTED", 5)]
    );
    expect(rows.map((r) => r.rank)).toEqual([1, 1, 3]);
  });
});

describe("contestPhase", () => {
  const window = { startsAt, endsAt: at(60) };
  it("follows the clock", () => {
    expect(contestPhase(window, at(-1))).toBe("upcoming");
    expect(contestPhase(window, at(30))).toBe("live");
    expect(contestPhase(window, at(61))).toBe("ended");
  });
});
