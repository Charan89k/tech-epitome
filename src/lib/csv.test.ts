import { describe, expect, it } from "vitest";

import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("reads plain rows with CRLF, LF and a BOM", () => {
    expect(parseCsv("﻿email,role\r\na@x.test,STUDENT\nb@x.test,FACULTY")).toEqual([
      ["email", "role"],
      ["a@x.test", "STUDENT"],
      ["b@x.test", "FACULTY"],
    ]);
  });

  it("handles quotes, doubled quotes, commas and newlines inside quotes", () => {
    expect(parseCsv('"a, b","say ""hi""","line\nbreak"\n')).toEqual([
      ["a, b", 'say "hi"', "line\nbreak"],
    ]);
  });

  it("keeps empty cells and drops blank lines", () => {
    expect(parseCsv("a,,c\n\n,,\nd,e,")).toEqual([
      ["a", "", "c"],
      ["d", "e", ""],
    ]);
  });

  it("rejects an unterminated quote", () => {
    expect(() => parseCsv('a,"b\nc')).toThrow(/never closed/);
  });
});
