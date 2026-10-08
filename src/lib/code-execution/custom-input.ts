import { CUSTOM_INPUT_LIMITS } from "./limits";
import type { ParamType, Signature } from "./signature";

/**
 * Validation for a learner's custom Run input.
 *
 * A custom input is one test case in the harness wire format (see the
 * WIRE FORMAT notes in signature.ts): one block per parameter, in order.
 * It is checked here, on the server, against the problem's own signature
 * before anything executes — so a malformed case is a sentence the learner
 * can act on rather than a stack trace from a harness reader, and nothing
 * the harness cannot parse is ever sent to the executor.
 *
 * The rules mirror the readers exactly: integer lines are whitespace
 * tolerant (every reader trims and splits on whitespace), string lines are
 * taken verbatim, and counted blocks must contain exactly their count.
 */

export type CustomInputCheck =
  | { ok: true; input: string }
  | { ok: false; error: string };

/** Java's int range: the narrowest of the four harnesses. */
const INT_MIN = -2_147_483_648;
const INT_MAX = 2_147_483_647;

export function validateCustomInput(
  signature: Signature,
  raw: string
): CustomInputCheck {
  if (raw.length > CUSTOM_INPUT_LIMITS.maxChars) {
    return {
      ok: false,
      error: `Custom input is limited to ${CUSTOM_INPUT_LIMITS.maxChars.toLocaleString("en-US")} characters.`,
    };
  }

  // One trailing newline is what an editor leaves behind; it is not a line.
  const text = raw.replace(/\r\n?/g, "\n").replace(/\n$/, "");
  const lines = text === "" && signature.params.length === 0 ? [] : text.split("\n");

  if (lines.length > CUSTOM_INPUT_LIMITS.maxLines) {
    return {
      ok: false,
      error: `Custom input is limited to ${CUSTOM_INPUT_LIMITS.maxLines.toLocaleString("en-US")} lines.`,
    };
  }

  let cursor = 0;
  const take = (): string | undefined => lines[cursor++];

  for (const [index, type] of signature.params.entries()) {
    const name = signature.paramNames[index] ?? `argument ${index + 1}`;
    const problem = readParam(type, name, take, () => cursor);
    if (problem) return { ok: false, error: problem };
  }

  if (cursor < lines.length) {
    return {
      ok: false,
      error: `Line ${cursor + 1}: unexpected extra input. This problem takes ${describe(signature)}.`,
    };
  }

  return { ok: true, input: `${lines.join("\n")}\n` };
}

function readParam(
  type: ParamType,
  name: string,
  take: () => string | undefined,
  position: () => number
): string | null {
  switch (type) {
    case "int": {
      const line = take();
      if (line === undefined) return missing(name, "an integer");
      return isInt(line.trim())
        ? null
        : `Line ${position()} (${name}): expected one integer between ${INT_MIN} and ${INT_MAX}.`;
    }

    case "string": {
      const line = take();
      return line === undefined ? missing(name, "a line of text") : null;
    }

    case "int[]":
    case "list": {
      const line = take();
      if (line === undefined) return missing(name, "a line of space-separated integers");
      return intRow(line)
        ? null
        : `Line ${position()} (${name}): expected space-separated integers (an empty line is an empty list).`;
    }

    case "string[]":
    case "int[][]": {
      const countLine = take();
      if (countLine === undefined) return missing(name, "a count line");
      const count = countLine.trim();
      if (!/^\d+$/.test(count) || Number(count) > CUSTOM_INPUT_LIMITS.maxCount) {
        return `Line ${position()} (${name}): expected a count between 0 and ${CUSTOM_INPUT_LIMITS.maxCount}, then that many lines.`;
      }
      for (let i = 0; i < Number(count); i++) {
        const line = take();
        if (line === undefined) {
          return `${name}: the count says ${count} lines, but the input ends after ${i}.`;
        }
        if (type === "int[][]" && !intRow(line)) {
          return `Line ${position()} (${name}, row ${i + 1}): expected space-separated integers.`;
        }
      }
      return null;
    }
  }
}

function isInt(token: string): boolean {
  if (!/^-?\d{1,10}$/.test(token)) return false;
  const value = Number(token);
  return value >= INT_MIN && value <= INT_MAX;
}

function intRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed === "" || trimmed.split(/\s+/).every(isInt);
}

function missing(name: string, what: string): string {
  return `The input ended before ${name}: expected ${what}.`;
}

/** "nums (int[]) then k (int)", for the extra-input message. */
function describe(signature: Signature): string {
  if (signature.params.length === 0) return "no input";
  return signature.params
    .map((type, i) => `${signature.paramNames[i] ?? `argument ${i + 1}`} (${type})`)
    .join(" then ");
}

const FORMAT_HINT: Record<ParamType, string> = {
  int: "one integer",
  string: "one line of text",
  "int[]": "one line of space-separated integers",
  list: "one line of space-separated values",
  "string[]": "a count, then that many lines",
  "int[][]": "a row count, then one line of integers per row",
};

/**
 * The input format for this problem, one entry per parameter, for the hint
 * beside the custom-input box: `nums — one line of space-separated integers`.
 * Pure, so the client renders exactly the rules the server enforces.
 */
export function describeWireFormat(signature: Signature): string[] {
  return signature.params.map(
    (type, i) => `${signature.paramNames[i] ?? `argument ${i + 1}`} — ${FORMAT_HINT[type]}`
  );
}
