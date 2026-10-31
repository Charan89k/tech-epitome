import { describe, expect, it } from "vitest";

import { describeWireFormat, validateCustomInput } from "./custom-input";
import { CUSTOM_INPUT_LIMITS } from "./limits";
import type { Signature } from "./signature";

/**
 * Custom Run input against a problem's signature.
 *
 * The validator is the only thing standing between a learner's text box and
 * the harness, so it must accept exactly what the harness readers parse and
 * refuse everything else with a message that names the line and parameter.
 */

const sig = (params: Signature["params"], names?: string[]): Signature => ({
  params,
  paramNames: names ?? params.map((_, i) => `p${i}`),
  returns: "int",
  functionName: "solve",
});

describe("validateCustomInput", () => {
  it("accepts a well-formed case and normalises the trailing newline", () => {
    const check = validateCustomInput(sig(["int[]", "int"], ["nums", "k"]), "1 2 3\r\n4\n");
    expect(check).toEqual({ ok: true, input: "1 2 3\n4\n" });
  });

  it("accepts the same whitespace the harness readers tolerate", () => {
    expect(validateCustomInput(sig(["int[]"]), "  1   -2\t3  ").ok).toBe(true);
    expect(validateCustomInput(sig(["int"]), " 7 ").ok).toBe(true);
  });

  it("treats an empty line as an empty list", () => {
    expect(validateCustomInput(sig(["int[]", "int"]), "\n5").ok).toBe(true);
  });

  it("takes string lines verbatim, including empty ones", () => {
    expect(validateCustomInput(sig(["string"]), "").ok).toBe(true);
    expect(validateCustomInput(sig(["string"]), "a b; rm -rf /").ok).toBe(true);
  });

  it("reads counted blocks for string[] and int[][]", () => {
    expect(validateCustomInput(sig(["string[]"]), "2\nab\ncd").ok).toBe(true);
    expect(validateCustomInput(sig(["int[][]"]), "2\n1 2\n3 4").ok).toBe(true);
    expect(validateCustomInput(sig(["int[][]"]), "0").ok).toBe(true);
  });

  it("names the line and the parameter when a value is malformed", () => {
    const check = validateCustomInput(sig(["int[]", "int"], ["nums", "k"]), "1 2\nseven");
    expect(check).toEqual({
      ok: false,
      error: expect.stringMatching(/^Line 2 \(k\): expected one integer/),
    });
    expect(validateCustomInput(sig(["int[]"], ["nums"]), "1 two 3")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Line 1 \(nums\)/),
    });
  });

  it("refuses integers outside Java's int range", () => {
    expect(validateCustomInput(sig(["int"]), "2147483647").ok).toBe(true);
    expect(validateCustomInput(sig(["int"]), "2147483648").ok).toBe(false);
    expect(validateCustomInput(sig(["int[]"]), "1 -2147483649").ok).toBe(false);
  });

  it("refuses missing and extra input", () => {
    expect(validateCustomInput(sig(["int[]", "int"], ["nums", "k"]), "1 2")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/ended before k/),
    });
    expect(validateCustomInput(sig(["int"]), "1\n2")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/Line 2: unexpected extra input/),
    });
    expect(validateCustomInput(sig(["string[]"], ["words"]), "3\na\nb")).toMatchObject({
      ok: false,
      error: expect.stringMatching(/count says 3 lines, but the input ends after 2/),
    });
  });

  it("refuses an oversized count or input before parsing it", () => {
    expect(
      validateCustomInput(sig(["string[]"]), String(CUSTOM_INPUT_LIMITS.maxCount + 1)).ok
    ).toBe(false);
    expect(
      validateCustomInput(sig(["string"]), "x".repeat(CUSTOM_INPUT_LIMITS.maxChars + 1))
    ).toMatchObject({ ok: false, error: expect.stringMatching(/limited to/) });
    expect(
      validateCustomInput(
        sig(["string[]"]),
        `1000\n${"a\n".repeat(CUSTOM_INPUT_LIMITS.maxLines)}`
      )
    ).toMatchObject({ ok: false, error: expect.stringMatching(/lines/) });
  });
});

describe("describeWireFormat", () => {
  it("describes each parameter in order", () => {
    expect(describeWireFormat(sig(["int[]", "int"], ["nums", "k"]))).toEqual([
      "nums — one line of space-separated integers",
      "k — one integer",
    ]);
  });
});
