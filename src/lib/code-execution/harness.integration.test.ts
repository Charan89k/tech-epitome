import { execFileSync } from "node:child_process";
import { describe, expect, it } from "vitest";

import type { Language } from "@/generated/prisma/enums";
import { LocalExecutionAdapter } from "./local-adapter";
import { buildHarness, spliceUserCode, type Signature } from "./signature";

/**
 * Executes real code in real language runtimes.
 *
 * The harness generator is the single most load-bearing piece of Phase 3:
 * every problem in the catalogue, in every language, is run through it. A
 * bug in one reader silently breaks a quarter of the platform, and no unit
 * test of string output would catch a Java parsing mistake. So these tests
 * compile and run genuine programs.
 *
 * Each language is skipped rather than failed when its toolchain is absent,
 * so the suite still passes on a machine without a JDK.
 */

function hasToolchain(...commands: string[]): boolean {
  return commands.every((command) => {
    try {
      execFileSync("sh", ["-c", `command -v ${command}`], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  });
}

const AVAILABLE: Record<string, boolean> = {
  PYTHON: hasToolchain("python3"),
  JAVASCRIPT: hasToolchain("node"),
  JAVA: hasToolchain("javac", "java"),
  CPP: hasToolchain("g++"),
};

const adapter = new LocalExecutionAdapter();

async function runProgram(
  language: Language,
  signature: Signature,
  userCode: string,
  tests: { id: string; input: string; expected: string; isSample: boolean }[]
) {
  const program = spliceUserCode(buildHarness(language, signature), userCode);
  return adapter.execute({
    language,
    program,
    tests,
    timeLimitMs: 10_000,
    memoryLimitMb: 512,
  });
}

// ---------------------------------------------------------------------------
// int[] + int -> int[]
// ---------------------------------------------------------------------------

const pairSignature: Signature = {
  params: ["int[]", "int"],
  paramNames: ["nums", "target"],
  returns: "int[]",
  functionName: "pairIndices",
};

const PAIR_SOLUTIONS: Record<string, string> = {
  PYTHON: `def pairIndices(nums: List[int], target: int) -> List[int]:
    seen = {}
    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
    return []`,
  JAVASCRIPT: `function pairIndices(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    if (seen.has(target - nums[i])) return [seen.get(target - nums[i]), i];
    seen.set(nums[i], i);
  }
  return [];
}`,
  JAVA: `class Solution {
    public int[] pairIndices(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int i = 0; i < nums.length; i++) {
            if (seen.containsKey(target - nums[i]))
                return new int[] { seen.get(target - nums[i]), i };
            seen.put(nums[i], i);
        }
        return new int[0];
    }
}`,
  CPP: `class Solution {
public:
    vector<int> pairIndices(const vector<int>& nums, int target) {
        unordered_map<int, int> seen;
        for (int i = 0; i < (int)nums.size(); i++) {
            auto it = seen.find(target - nums[i]);
            if (it != seen.end()) return { it->second, i };
            seen[nums[i]] = i;
        }
        return {};
    }
};`,
};

describe.each(["PYTHON", "JAVASCRIPT", "JAVA", "CPP"] as const)(
  "harness: %s",
  (language) => {
    const skip = !AVAILABLE[language];

    it.skipIf(skip)("reads int[] and int, writes int[]", async () => {
      const result = await runProgram(
        language,
        pairSignature,
        PAIR_SOLUTIONS[language]!,
        [
          { id: "a", input: "2 7 11 15\n9", expected: "0 1", isSample: true },
          { id: "b", input: "3 2 4\n6", expected: "1 2", isSample: false },
          // An empty array must round-trip as an empty line, not crash the
          // reader - this is the case a hand-written parser usually gets wrong.
          { id: "c", input: "\n5", expected: "", isSample: false },
        ]
      );

      expect(result.compileError ?? "").toBe("");
      expect(result.status).toBe("ACCEPTED");
      expect(result.passed).toBe(3);
    }, 90_000);

    it.skipIf(skip)("reports a wrong answer rather than passing it", async () => {
      const wrong = {
        PYTHON: `def pairIndices(nums: List[int], target: int) -> List[int]:\n    return [9, 9]`,
        JAVASCRIPT: `function pairIndices(nums, target) { return [9, 9]; }`,
        JAVA: `class Solution { public int[] pairIndices(int[] nums, int target) { return new int[]{9,9}; } }`,
        CPP: `class Solution { public: vector<int> pairIndices(const vector<int>& nums, int target) { return {9,9}; } };`,
      }[language];

      const result = await runProgram(language, pairSignature, wrong, [
        { id: "a", input: "2 7 11 15\n9", expected: "0 1", isSample: true },
      ]);

      expect(result.status).toBe("WRONG_ANSWER");
      expect(result.passed).toBe(0);
      expect(result.results[0]?.actual?.trim()).toBe("9 9");
    }, 90_000);
  }
);

// ---------------------------------------------------------------------------
// string -> int, exercising a different reader and writer pair
// ---------------------------------------------------------------------------

const stringSignature: Signature = {
  params: ["string"],
  paramNames: ["text"],
  returns: "int",
  functionName: "countVowels",
};

describe("harness: string input and int output", () => {
  it.skipIf(!AVAILABLE.PYTHON)("handles an empty string", async () => {
    const result = await runProgram(
      "PYTHON",
      stringSignature,
      `def countVowels(text: str) -> int:\n    return sum(1 for c in text if c in "aeiou")`,
      [
        { id: "a", input: "forge", expected: "2", isSample: true },
        // An empty line is a valid string, not a missing argument.
        { id: "b", input: "", expected: "0", isSample: false },
      ]
    );
    expect(result.status).toBe("ACCEPTED");
    expect(result.passed).toBe(2);
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Resource limits
// ---------------------------------------------------------------------------

describe("local adapter limits", () => {
  it.skipIf(!AVAILABLE.PYTHON)("kills a program that exceeds the time limit", async () => {
    const result = await runProgram(
      "PYTHON",
      { params: [], paramNames: [], returns: "int", functionName: "spin" },
      `def spin() -> int:\n    while True:\n        pass`,
      [{ id: "a", input: "", expected: "1", isSample: true }]
    );

    expect(result.status).toBe("TIME_LIMIT_EXCEEDED");
  }, 60_000);

  it.skipIf(!AVAILABLE.PYTHON)("reports a runtime error with stderr", async () => {
    const result = await runProgram(
      "PYTHON",
      { params: [], paramNames: [], returns: "int", functionName: "boom" },
      `def boom() -> int:\n    raise ValueError("deliberate")`,
      [{ id: "a", input: "", expected: "1", isSample: true }]
    );

    expect(result.status).toBe("RUNTIME_ERROR");
    expect(result.results[0]?.stderr).toContain("deliberate");
  }, 60_000);

  it.skipIf(!AVAILABLE.CPP)("surfaces a compile error instead of a wrong answer", async () => {
    const result = await runProgram(
      "CPP",
      stringSignature,
      `class Solution { public: int countVowels(const string& text) { this is not c++ } };`,
      [{ id: "a", input: "forge", expected: "1", isSample: true }]
    );

    expect(result.status).toBe("COMPILE_ERROR");
    expect(result.compileError).toBeTruthy();
  }, 90_000);
});

// ---------------------------------------------------------------------------
// Information leakage
// ---------------------------------------------------------------------------

describe("hidden test cases", () => {
  it.skipIf(!AVAILABLE.PYTHON)("never echo their input or expected value", async () => {
    const result = await runProgram(
      "PYTHON",
      stringSignature,
      `def countVowels(text: str) -> int:\n    return 0`,
      [
        { id: "visible", input: "forge", expected: "2", isSample: true },
        { id: "secret", input: "SECRET-INPUT", expected: "SECRET-EXPECTED", isSample: false },
      ]
    );

    const hidden = result.results.find((r) => r.testCaseId === "secret");
    expect(hidden).toBeDefined();
    // Leaking these would turn the results panel into a way to read the
    // whole hidden suite.
    expect(hidden?.input).toBeUndefined();
    expect(hidden?.expected).toBeUndefined();
    expect(hidden?.actual).toBeUndefined();
    expect(JSON.stringify(result)).not.toContain("SECRET-INPUT");
    expect(JSON.stringify(result)).not.toContain("SECRET-EXPECTED");
  }, 60_000);
});

// ---------------------------------------------------------------------------
// Linked lists
// ---------------------------------------------------------------------------

const listSignature: Signature = {
  params: ["list"],
  paramNames: ["head"],
  returns: "list",
  functionName: "reverseList",
};

const REVERSE_SOLUTIONS: Record<string, string> = {
  PYTHON: `def reverseList(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    while head is not None:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev`,
  JAVASCRIPT: `function reverseList(head) {
  let prev = null;
  while (head !== null) {
    const nxt = head.next;
    head.next = prev;
    prev = head;
    head = nxt;
  }
  return prev;
}`,
  JAVA: `class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode prev = null;
        while (head != null) {
            ListNode nxt = head.next;
            head.next = prev;
            prev = head;
            head = nxt;
        }
        return prev;
    }
}`,
  CPP: `class Solution {
public:
    ListNode* reverseList(ListNode* head) {
        ListNode* prev = nullptr;
        while (head) {
            ListNode* nxt = head->next;
            head->next = prev;
            prev = head;
            head = nxt;
        }
        return prev;
    }
};`,
};

describe.each(["PYTHON", "JAVASCRIPT", "JAVA", "CPP"] as const)(
  "linked list harness: %s",
  (language) => {
    it.skipIf(!AVAILABLE[language])(
      "materialises real nodes and serialises them back",
      async () => {
        const result = await runProgram(
          language,
          listSignature,
          REVERSE_SOLUTIONS[language]!,
          [
            { id: "a", input: "1 2 3 4 5", expected: "5 4 3 2 1", isSample: true },
            { id: "b", input: "7", expected: "7", isSample: false },
            // An empty list is a null head, not an error.
            { id: "c", input: "", expected: "", isSample: false },
          ]
        );

        expect(result.compileError ?? "").toBe("");
        expect(result.status).toBe("ACCEPTED");
        expect(result.passed).toBe(3);
      },
      90_000
    );
  }
);
