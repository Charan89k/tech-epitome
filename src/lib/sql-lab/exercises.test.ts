import { readFileSync } from "node:fs";

import { PGlite } from "@electric-sql/pglite";
import { beforeAll, describe, expect, it } from "vitest";

import { compareRows, type SqlRows } from "./compare";
import { LIBRARY_SCHEMA } from "./dataset";
import { SQL_EXERCISES } from "./exercises";

const toRows = (result: { fields: { name: string }[]; rows: unknown[] }): SqlRows =>
  (result.rows as Record<string, unknown>[]).map((row) =>
    result.fields.map(({ name }) => (row[name] === null ? null : String(row[name])))
  );

let db: PGlite;
const query = async (sql: string) => toRows(await db.query(sql));

beforeAll(async () => {
  db = await PGlite.create();
  await db.exec(LIBRARY_SCHEMA);
}, 60_000);

describe("SQL exercises", () => {
  it.each(SQL_EXERCISES.map((e) => [e.id, e] as const))(
    "%s has a solution that runs and returns rows",
    async (_id, exercise) => {
      const rows = await query(exercise.solution);
      expect(rows.length).toBeGreaterThan(0);
      expect(compareRows(rows, rows, exercise.ordered)).toEqual({ correct: true });
    }
  );

  it("has the answers a reader can check by hand", async () => {
    const solution = (id: string) => SQL_EXERCISES.find((e) => e.id === id)!.solution;

    expect((await query(solution("never-borrowed"))).flat().sort()).toEqual([
      "A Short Walk North",
      "Paper Bridges",
    ]);
    expect(await query(solution("still-out"))).toEqual([
      ["Harbour Lights", "Arjun"],
      ["The Monsoon Ledger", "Nila"],
      ["Quiet Engines", "Kiran"],
    ]);
  });

  it("rejects a plausible wrong answer", async () => {
    const exercise = SQL_EXERCISES.find((e) => e.id === "longest-books")!;
    const expected = await query(exercise.solution);
    const ascending = await query(
      "SELECT title, pages FROM books ORDER BY pages ASC LIMIT 3"
    );
    expect(compareRows(ascending, expected, true).correct).toBe(false);
  });

  it("keeps the worker's CDN version equal to the tested package", () => {
    const worker = readFileSync("public/trace/sql-worker.js", "utf8");
    const pkg = JSON.parse(readFileSync("package.json", "utf8")) as {
      devDependencies: Record<string, string>;
    };
    expect(worker).toContain(
      `PGLITE_VERSION = "${pkg.devDependencies["@electric-sql/pglite"]}"`
    );
  });
});

describe("compareRows", () => {
  const a = [["1"], ["2"]];
  const b = [["2"], ["1"]];

  it("ignores order only when order is not part of the answer", () => {
    expect(compareRows(a, b, false).correct).toBe(true);
    expect(compareRows(a, b, true)).toEqual({
      correct: false,
      reason: "The rows are right, but the order is not.",
    });
  });

  it("explains a wrong shape", () => {
    expect(compareRows([["1", "x"]], [["1"]], false)).toEqual({
      correct: false,
      reason: "Expected 1 columns, got 2.",
    });
    expect(compareRows([["1"]], a, false)).toEqual({
      correct: false,
      reason: "Expected 2 rows, got 1.",
    });
    expect(compareRows([], a, false).correct).toBe(false);
  });

  it("distinguishes NULL from the text null", () => {
    expect(compareRows([[null]], [["null"]], false).correct).toBe(false);
  });
});
