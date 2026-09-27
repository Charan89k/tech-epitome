import { example, para, rich, type ProblemSeed } from "./types";

/** String fundamentals: traversal, normalisation, frequency, palindromes. */
export const STRING_PROBLEMS: ProblemSeed[] = [
  {
    slug: "normalise-and-compare",
    title: "Normalise and Compare",
    difficulty: "EASY",
    learningObjective:
      "Normalise input before comparing it, rather than special-casing every variation.",
    topics: ["strings"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A registration form should treat two display names as the same if they match once you ignore case and every character that is not a letter or a digit."
      ),
      rich("Return ", { code: "true" }, " when the two names collide under that rule."),
      example(
        'a = "Ada_Lovelace 01", b = "adalovelace01"',
        "true",
        [
          { state: '"Ada_Lovelace 01"', note: "strip non-alphanumerics" },
          { state: '"AdaLovelace01"', note: "lowercase" },
          { state: '"adalovelace01"', note: "matches b" },
        ],
        "Normalising both sides before comparing"
      ),
    ],
    constraints: [
      "0 ≤ a.length, b.length ≤ 100000",
      "Both strings contain printable ASCII characters only.",
      "Two empty results after normalisation count as a match.",
    ],
    signature: {
      params: ["string", "string"],
      paramNames: ["a", "b"],
      returns: "bool",
      functionName: "sameDisplayName",
    },
    tests: [
      { input: "Ada_Lovelace 01\nadalovelace01", expected: "true", isSample: true, explanation: "Both normalise to adalovelace01." },
      { input: "grace\nG r a c e !", expected: "true", isSample: true, explanation: "Spaces and punctuation are ignored." },
      { input: "alan\nturing", expected: "false", isSample: true },
      { input: "\n", expected: "true" },
      { input: "!!!\n___", expected: "true" },
      { input: "a1\n1a", expected: "false" },
      { input: "ABC\nabc", expected: "true" },
      { input: "ab\nabc", expected: "false" },
    ],
    hints: [
      "Writing a comparison that handles every punctuation case inline gets complicated fast. Is there a step you can do first that removes the problem?",
      "If both strings were already stripped and lowercased, the comparison would be a single equality check.",
      "You can either build the two normalised strings, or walk both with an index that skips characters you do not care about.",
      "Skipping in place uses no extra memory: advance each pointer past anything that is not a letter or digit before comparing.",
    ],
    solutions: [
      {
        title: "Two pointers, skipping in place",
        order: 1,
        intuition:
          "Building normalised copies is clear and fine, but it allocates two new strings. Because normalisation is a per-character decision that never depends on neighbours, you can do it lazily: advance each pointer to the next character that matters, then compare exactly those.",
        approach: [
          "Put one index at the start of each string.",
          "Advance each past any character that is not alphanumeric.",
          "If both ran out, the strings match.",
          "If only one ran out, they do not.",
          "Compare the two characters case-insensitively; on a mismatch return false, otherwise advance both.",
        ],
        code: {
          PYTHON: `def sameDisplayName(a: str, b: str) -> bool:
    i, j = 0, 0

    while i < len(a) and j < len(b):
        if not a[i].isalnum():
            i += 1
            continue
        if not b[j].isalnum():
            j += 1
            continue
        if a[i].lower() != b[j].lower():
            return False
        i += 1
        j += 1

    # Whatever is left on either side must also be ignorable.
    while i < len(a) and not a[i].isalnum():
        i += 1
    while j < len(b) and not b[j].isalnum():
        j += 1

    return i == len(a) and j == len(b)`,
          JAVA: `class Solution {
    public boolean sameDisplayName(String a, String b) {
        int i = 0, j = 0;

        while (i < a.length() && j < b.length()) {
            if (!Character.isLetterOrDigit(a.charAt(i))) { i++; continue; }
            if (!Character.isLetterOrDigit(b.charAt(j))) { j++; continue; }
            if (Character.toLowerCase(a.charAt(i)) != Character.toLowerCase(b.charAt(j))) {
                return false;
            }
            i++;
            j++;
        }

        while (i < a.length() && !Character.isLetterOrDigit(a.charAt(i))) i++;
        while (j < b.length() && !Character.isLetterOrDigit(b.charAt(j))) j++;

        return i == a.length() && j == b.length();
    }
}`,
        },
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Both strings normalise to empty.",
          "One string is entirely punctuation.",
          "Trailing punctuation after the last real character.",
        ],
        commonMistakes: [
          "Forgetting the trailing-skip loops, so \"abc\" and \"abc!!\" are reported as different.",
          "Comparing lengths before normalising.",
          "Lowercasing only one side.",
        ],
      },
    ],
    expectedTime: "O(n + m)",
    expectedSpace: "O(1)",
  },

  {
    slug: "longest-mirrored-core",
    title: "Longest Mirrored Core",
    difficulty: "MEDIUM",
    learningObjective:
      "Expand outward from every centre instead of testing every substring for symmetry.",
    topics: ["strings"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A sequence of DNA bases sometimes contains a mirrored core — a stretch that reads the same forwards and backwards."
      ),
      para(
        "Return the longest mirrored stretch in the input. If several are tied for longest, return the one that starts earliest."
      ),
      example(
        'bases = "ACGTGCA"',
        '"ACGTGCA"',
        [
          { state: "centre at index 3 (T)", note: "expand: G…G matches" },
          { state: "expand again", note: "C…C matches" },
          { state: "expand again", note: "A…A matches — whole string" },
        ],
        "Growing outward from one centre"
      ),
    ],
    constraints: [
      "1 ≤ bases.length ≤ 2000",
      "The string contains uppercase letters only.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["bases"],
      returns: "string",
      functionName: "longestMirrored",
    },
    tests: [
      { input: "ACGTGCA", expected: "ACGTGCA", isSample: true, explanation: "The whole string is mirrored." },
      { input: "ABBAC", expected: "ABBA", isSample: true, explanation: "An even-length core." },
      { input: "ABCDE", expected: "A", isSample: true, explanation: "No stretch longer than one character is mirrored, so the earliest single character wins." },
      { input: "A", expected: "A" },
      { input: "AA", expected: "AA" },
      { input: "AAAA", expected: "AAAA" },
      { input: "ABACABA", expected: "ABACABA" },
      { input: "XABBAY", expected: "ABBA" },
      { input: "ABCBAXYZ", expected: "ABCBA" },
    ],
    hints: [
      "Checking every substring for symmetry is O(n³). Where is the waste?",
      "A mirrored stretch is defined by its centre. How many centres are there?",
      "There are 2n - 1: one at each character, and one between each neighbouring pair.",
      "From each centre, push two pointers outward while the characters match, and remember the longest you achieve.",
    ],
    solutions: [
      {
        title: "Expand around every centre",
        order: 1,
        intuition:
          "Symmetry is a property of a centre, not of a substring. Rather than generating substrings and testing them, generate centres and grow. Each expansion step either extends the current best or stops, so no work is repeated.",
        approach: [
          "For each index, treat it as an odd-length centre and expand while the flanking characters match.",
          "For each adjacent pair, treat the gap as an even-length centre and do the same.",
          "Track the longest span found, keeping the earliest on a tie.",
          "Return that slice.",
        ],
        code: {
          PYTHON: `def longestMirrored(bases: str) -> str:
    if not bases:
        return ""

    best_start, best_len = 0, 1

    def expand(left: int, right: int) -> None:
        nonlocal best_start, best_len
        while left >= 0 and right < len(bases) and bases[left] == bases[right]:
            left -= 1
            right += 1
        # The loop overshoots by one on each side.
        length = right - left - 1
        if length > best_len:
            best_len = length
            best_start = left + 1

    for i in range(len(bases)):
        expand(i, i)       # odd-length centre
        expand(i, i + 1)   # even-length centre

    return bases[best_start:best_start + best_len]`,
          JAVA: `class Solution {
    private int bestStart = 0;
    private int bestLen = 1;
    private String s;

    public String longestMirrored(String bases) {
        if (bases.isEmpty()) return "";
        this.s = bases;

        for (int i = 0; i < bases.length(); i++) {
            expand(i, i);
            expand(i, i + 1);
        }

        return bases.substring(bestStart, bestStart + bestLen);
    }

    private void expand(int left, int right) {
        while (left >= 0 && right < s.length() && s.charAt(left) == s.charAt(right)) {
            left--;
            right++;
        }
        int length = right - left - 1;
        if (length > bestLen) {
            bestLen = length;
            bestStart = left + 1;
        }
    }
}`,
        },
        timeComplexity: "O(n²) — 2n centres, each expanding at most n",
        spaceComplexity: "O(1) beyond the output",
        edgeCases: [
          "A single character.",
          "No mirrored stretch longer than one.",
          "The entire string mirrored.",
          "Ties, where the earliest must win — use strict > when updating.",
        ],
        commonMistakes: [
          "Only checking odd centres, which misses every even-length core such as \"ABBA\".",
          "Computing the length as right - left instead of right - left - 1 after the loop overshoots.",
          "Using >= when updating the best, which returns a later tie instead of the earliest.",
        ],
      },
    ],
    expectedTime: "O(n²)",
    expectedSpace: "O(1)",
  },

  {
    slug: "compress-run-lengths",
    title: "Compress Run Lengths",
    difficulty: "EASY",
    learningObjective:
      "Group consecutive equal elements with a single pass and a run counter.",
    topics: ["strings"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A telemetry stream encodes status codes as a string of letters. Consecutive repeats waste space."
      ),
      rich(
        "Compress the string by replacing each run of the same character with that character followed by the run length, but only when the run is longer than one. Return the compressed string, or the original if compressing would not make it shorter."
      ),
      example(
        'codes = "aaabccddd"',
        '"a3bc2d3"',
        [
          { state: '"aaa"', note: "run of 3 → a3" },
          { state: '"b"', note: "run of 1 → b" },
          { state: '"cc"', note: "run of 2 → c2" },
          { state: '"ddd"', note: "run of 3 → d3" },
        ],
        "Runs of one keep no count"
      ),
    ],
    constraints: [
      "0 ≤ codes.length ≤ 100000",
      "The string contains lowercase letters only.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["codes"],
      returns: "string",
      functionName: "compressRuns",
    },
    tests: [
      { input: "aaabccddd", expected: "a3bc2d3", isSample: true, explanation: "Runs of length one keep no digit." },
      { input: "abc", expected: "abc", isSample: true, explanation: "Compressing would make it longer, so the original is returned." },
      { input: "", expected: "" },
      { input: "a", expected: "a" },
      { input: "aa", expected: "aa", explanation: "a2 is not shorter than aa, so the original is kept." },
      { input: "aabb", expected: "aabb", explanation: "a2b2 is the same length as aabb, so the original is kept." },
      { input: "aaaaaaaaaaaa", expected: "a12" },
      { input: "abbbbbbc", expected: "ab6c" },
    ],
    hints: [
      "You need to know how long the current run is before you can write it out. When do you know that?",
      "When the character changes, or when you reach the end of the string.",
      "Keep a counter that resets each time the character changes.",
      "Do not forget the final run — the loop ends without a character change to trigger it.",
    ],
    solutions: [
      {
        title: "Single pass with a run counter",
        order: 1,
        intuition:
          "A run is only complete when something different arrives, or the string ends. So the write happens on the boundary, not on every character. The final run needs explicit handling because there is no boundary after it.",
        approach: [
          "Walk the string keeping the current character and how many times it has repeated.",
          "When the next character differs, append the current character and, if the count exceeded one, the count.",
          "Reset the counter.",
          "After the loop, flush the last run.",
          "Return the compressed form only if it is shorter.",
        ],
        code: {
          PYTHON: `def compressRuns(codes: str) -> str:
    if not codes:
        return ""

    pieces = []
    run_char = codes[0]
    run_len = 1

    for char in codes[1:]:
        if char == run_char:
            run_len += 1
            continue
        pieces.append(run_char if run_len == 1 else f"{run_char}{run_len}")
        run_char = char
        run_len = 1

    # The final run has no following character to close it.
    pieces.append(run_char if run_len == 1 else f"{run_char}{run_len}")

    compressed = "".join(pieces)
    return compressed if len(compressed) < len(codes) else codes`,
          JAVA: `class Solution {
    public String compressRuns(String codes) {
        if (codes.isEmpty()) return "";

        StringBuilder sb = new StringBuilder();
        char runChar = codes.charAt(0);
        int runLen = 1;

        for (int i = 1; i < codes.length(); i++) {
            char c = codes.charAt(i);
            if (c == runChar) { runLen++; continue; }
            sb.append(runChar);
            if (runLen > 1) sb.append(runLen);
            runChar = c;
            runLen = 1;
        }

        sb.append(runChar);
        if (runLen > 1) sb.append(runLen);

        return sb.length() < codes.length() ? sb.toString() : codes;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) for the output",
        edgeCases: [
          "The empty string.",
          "A single character.",
          "No repeats at all, where the original is returned.",
          "A run of ten or more, whose count is multiple digits.",
        ],
        commonMistakes: [
          "Forgetting to flush the final run, silently dropping the last group.",
          "Appending a count of 1, which makes the output longer than the input.",
          "Building the result with repeated string concatenation, which is quadratic in some languages.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "reverse-words-in-log",
    title: "Reverse Words in a Log Line",
    difficulty: "EASY",
    learningObjective:
      "Tokenise deliberately rather than trusting a naive split on whitespace.",
    topics: ["strings"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A legacy log line stores its fields in reverse order, separated by one or more spaces, sometimes with leading or trailing padding."
      ),
      para(
        "Return the fields in the correct order, separated by exactly one space, with no leading or trailing space."
      ),
      example(
        '"  disk   full  errno=28 "',
        '"errno=28 full disk"',
        [
          { state: '["disk", "full", "errno=28"]', note: "tokenise, dropping padding" },
          { state: '["errno=28", "full", "disk"]', note: "reverse" },
          { state: '"errno=28 full disk"', note: "join with single spaces" },
        ],
        "Tokenise, reverse, rejoin"
      ),
    ],
    constraints: [
      "1 ≤ line.length ≤ 100000",
      "The line contains printable ASCII characters.",
      "There is at least one non-space character.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["line"],
      returns: "string",
      functionName: "reverseFields",
    },
    tests: [
      { input: "  disk   full  errno=28 ", expected: "errno=28 full disk", isSample: true, explanation: "Padding and repeated spaces collapse." },
      { input: "single", expected: "single", isSample: true },
      { input: "a b", expected: "b a" },
      { input: "   leading", expected: "leading" },
      { input: "trailing   ", expected: "trailing" },
      { input: "a  b   c    d", expected: "d c b a" },
      { input: " x ", expected: "x" },
    ],
    hints: [
      "Splitting on a single space character produces empty tokens when spaces repeat. What should happen to those?",
      "Filter out empty tokens, or split on runs of whitespace rather than on one space.",
      "Once you have a clean token list, the rest is reversing and joining.",
      "If you want O(1) extra space, reverse the whole string and then reverse each word in place.",
    ],
    solutions: [
      {
        title: "Tokenise, reverse, join",
        order: 1,
        intuition:
          "Almost all the difficulty here is in tokenising, not reversing. Once the fields are a clean list with the padding gone, the answer is two library calls. The bug that catches people is splitting on a single space and keeping the empty strings that produces.",
        approach: [
          "Split the line on runs of whitespace, discarding empty tokens.",
          "Reverse the resulting list.",
          "Join with a single space.",
        ],
        code: {
          PYTHON: `def reverseFields(line: str) -> str:
    # split() with no argument splits on runs of whitespace AND drops the
    # empty tokens that leading or repeated spaces would otherwise create.
    fields = line.split()
    fields.reverse()
    return " ".join(fields)`,
          JAVA: `class Solution {
    public String reverseFields(String line) {
        String[] fields = line.trim().split("\\\\s+");
        StringBuilder sb = new StringBuilder();
        for (int i = fields.length - 1; i >= 0; i--) {
            if (sb.length() > 0) sb.append(' ');
            sb.append(fields[i]);
        }
        return sb.toString();
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Leading and trailing padding.",
          "Runs of several spaces between fields.",
          "A single field with no spaces.",
        ],
        commonMistakes: [
          "Splitting on \" \" and producing empty tokens, which become stray spaces in the output.",
          "Forgetting to trim before splitting in languages whose regex split keeps a leading empty token.",
          "Reversing the characters instead of the fields.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "first-unrepeated-symbol",
    title: "First Unrepeated Symbol",
    difficulty: "EASY",
    learningObjective:
      "Separate counting from scanning: two passes beat one pass with a nested search.",
    topics: ["strings", "hashing"],
    patterns: ["hashing"],
    statement: [
      para(
        "A parser reads a stream of symbols and must report the first symbol that appears exactly once in the whole stream."
      ),
      rich("Return the index of that symbol, or ", { code: "-1" }, " if every symbol repeats."),
      example(
        'symbols = "ccdbea"',
        "3",
        [
          { state: "counts", note: "c:2 d:1 b:1 e:1 a:1" },
          { state: "scan index 0 (c)", note: "count 2 — skip" },
          { state: "scan index 2 (d)", note: "count 1 — answer is 2" },
        ],
        "Count first, then scan in order"
      ),
    ],
    constraints: [
      "1 ≤ symbols.length ≤ 100000",
      "The string contains lowercase letters only.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["symbols"],
      returns: "int",
      functionName: "firstUnrepeated",
    },
    tests: [
      { input: "ccdbea", expected: "2", isSample: true, explanation: "d at index 2 is the first symbol appearing once." },
      { input: "aabb", expected: "-1", isSample: true, explanation: "Every symbol repeats." },
      { input: "a", expected: "0" },
      { input: "abcabd", expected: "2" },
      { input: "zz", expected: "-1" },
      { input: "aabbccddeeffg", expected: "12" },
      { input: "loveleetcode", expected: "2" },
    ],
    hints: [
      "For each symbol you need to know how many times it appears in the entire string. When is that knowable?",
      "Only after you have seen the whole string — so a single pass that also answers as it goes will not work.",
      "Count everything first. Then scan again in order and return the first symbol whose count is one.",
      "Order matters in the second pass: walk the original string, not the map.",
    ],
    solutions: [
      {
        title: "Count, then scan in order",
        order: 1,
        intuition:
          "The question mixes two things: how often a symbol occurs, and where it first occurs. Counting needs the whole string; ordering needs the original sequence. Trying to do both in one pass leads to a nested search. Two clean passes are linear and much easier to read.",
        approach: [
          "Pass one: build a frequency map of every symbol.",
          "Pass two: walk the string in order and return the index of the first symbol with a count of 1.",
          "Return -1 if the second pass finds nothing.",
        ],
        code: {
          PYTHON: `def firstUnrepeated(symbols: str) -> int:
    counts = {}
    for char in symbols:
        counts[char] = counts.get(char, 0) + 1

    # The second pass must follow the original order, not the map's.
    for index, char in enumerate(symbols):
        if counts[char] == 1:
            return index

    return -1`,
          JAVA: `class Solution {
    public int firstUnrepeated(String symbols) {
        int[] counts = new int[26];
        for (int i = 0; i < symbols.length(); i++) {
            counts[symbols.charAt(i) - 'a']++;
        }

        for (int i = 0; i < symbols.length(); i++) {
            if (counts[symbols.charAt(i) - 'a'] == 1) return i;
        }

        return -1;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) — at most 26 counters",
        edgeCases: [
          "A single character, which is trivially unrepeated.",
          "Every symbol repeating.",
          "The answer at the very last index.",
        ],
        commonMistakes: [
          "Iterating the map in the second pass, which loses the original ordering in languages that do not preserve insertion order.",
          "Using a nested loop to count occurrences of each character, which is quadratic.",
          "Returning the character rather than its index.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "rearrangement-check",
    title: "Rearrangement Check",
    difficulty: "EASY",
    learningObjective:
      "Compare two multisets by counting once and decrementing, instead of sorting both.",
    topics: ["strings", "hashing"],
    patterns: ["hashing"],
    statement: [
      para(
        "Two inventory labels are considered equivalent if one is a rearrangement of the other — the same characters, the same number of times, in any order."
      ),
      para("Return whether the two labels are rearrangements of each other."),
      example(
        'a = "listen", b = "silent"',
        "true",
        [
          { state: "count a", note: "l:1 i:1 s:1 t:1 e:1 n:1" },
          { state: "subtract b", note: "every counter returns to zero" },
          { state: "all zero", note: "rearrangement confirmed" },
        ],
        "One map, incremented then decremented"
      ),
    ],
    constraints: [
      "0 ≤ a.length, b.length ≤ 100000",
      "Both strings contain lowercase letters only.",
    ],
    signature: {
      params: ["string", "string"],
      paramNames: ["a", "b"],
      returns: "bool",
      functionName: "isRearrangement",
    },
    tests: [
      { input: "listen\nsilent", expected: "true", isSample: true },
      { input: "rat\ncar", expected: "false", isSample: true, explanation: "Different letters entirely." },
      { input: "aab\nabb", expected: "false", isSample: true, explanation: "Same letters, different counts." },
      { input: "\n", expected: "true" },
      { input: "a\n", expected: "false" },
      { input: "ab\nabc", expected: "false" },
      { input: "aaa\naaa", expected: "true" },
      { input: "abcdefghij\njihgfedcba", expected: "true" },
    ],
    hints: [
      "Sorting both strings and comparing works. What does it cost, and can you do better?",
      "You do not need the order, only the multiset of characters.",
      "Count the characters of the first string, then walk the second subtracting.",
      "If a counter would go negative, or any counter is left over, they are not rearrangements. Checking the lengths first is a cheap early exit.",
    ],
    solutions: [
      {
        title: "One counter map, incremented then decremented",
        order: 1,
        intuition:
          "Sorting imposes an order you do not need, and costs O(n log n) to do it. The property being tested is really \"the same bag of characters\", and a bag is exactly what a frequency map represents. One map suffices: add from one side, subtract from the other, and check nothing is left.",
        approach: [
          "If the lengths differ, return false immediately.",
          "Increment a counter per character of the first string.",
          "Decrement per character of the second; if any counter goes below zero, return false.",
          "Return true — equal lengths plus no negative means every counter is zero.",
        ],
        code: {
          PYTHON: `def isRearrangement(a: str, b: str) -> bool:
    if len(a) != len(b):
        return False

    counts = {}
    for char in a:
        counts[char] = counts.get(char, 0) + 1

    for char in b:
        remaining = counts.get(char, 0)
        if remaining == 0:
            return False          # b has a character a ran out of
        counts[char] = remaining - 1

    # Equal lengths and nothing overdrawn means every counter hit zero.
    return True`,
          JAVA: `class Solution {
    public boolean isRearrangement(String a, String b) {
        if (a.length() != b.length()) return false;

        int[] counts = new int[26];
        for (int i = 0; i < a.length(); i++) counts[a.charAt(i) - 'a']++;

        for (int i = 0; i < b.length(); i++) {
            int index = b.charAt(i) - 'a';
            if (counts[index] == 0) return false;
            counts[index]--;
        }

        return true;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) — at most 26 counters",
        edgeCases: [
          "Both strings empty.",
          "Different lengths, caught by the early exit.",
          "The same letters with different multiplicities.",
        ],
        commonMistakes: [
          "Skipping the length check and concluding true when one string is a prefix multiset of the other.",
          "Using two separate maps and comparing them, which works but doubles the memory.",
          "Sorting when O(n) is available.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "valid-nesting",
    title: "Valid Nesting",
    difficulty: "EASY",
    learningObjective:
      "Recognise that matching nested pairs is exactly what a stack is for.",
    topics: ["strings", "stacks"],
    patterns: ["monotonic-stack"],
    statement: [
      para(
        "A configuration language uses three kinds of bracket: round, square and curly. A document is well formed when every opening bracket is closed by the matching kind, in the correct order, and nothing is left unclosed."
      ),
      para("Return whether the given bracket string is well formed."),
      example(
        'text = "{[()]}"',
        "true",
        [
          { state: "stack: {", note: "open curly" },
          { state: "stack: { [", note: "open square" },
          { state: "stack: { [ (", note: "open round" },
          { state: "stack: { [", note: ") closes ( — match" },
          { state: "empty", note: "all closed in order" },
        ],
        "The stack holds what is still open"
      ),
    ],
    constraints: [
      "0 ≤ text.length ≤ 100000",
      "The string contains only the characters ( ) [ ] { }",
    ],
    signature: {
      params: ["string"],
      paramNames: ["text"],
      returns: "bool",
      functionName: "isWellFormed",
    },
    tests: [
      { input: "{[()]}", expected: "true", isSample: true },
      { input: "([)]", expected: "false", isSample: true, explanation: "Correctly counted but incorrectly nested." },
      { input: "(", expected: "false", isSample: true, explanation: "Left open." },
      { input: "", expected: "true" },
      { input: ")(", expected: "false" },
      { input: "()[]{}", expected: "true" },
      { input: "(((((())))))", expected: "true" },
      { input: "{[}]", expected: "false" },
      { input: "]", expected: "false" },
    ],
    hints: [
      "Counting brackets is not enough — \"([)]\" has the right counts and is still wrong.",
      "When you meet a closing bracket, which opening bracket must it match?",
      "The most recently opened one that is still unclosed. That is a last-in, first-out rule.",
      "Push openers; on a closer, pop and check the kinds agree. At the end the stack must be empty.",
    ],
    solutions: [
      {
        title: "Stack of unclosed openers",
        order: 1,
        intuition:
          "Nesting is inherently last-in-first-out: the bracket you must close next is always the one you opened most recently. That is the definition of a stack, so the data structure does the reasoning for you — all the code has to do is check that the kinds agree.",
        approach: [
          "Keep a map from each closing bracket to its opener.",
          "Push every opening bracket.",
          "On a closing bracket, fail if the stack is empty or the top is not the matching opener; otherwise pop.",
          "At the end, the string is well formed only if the stack is empty.",
        ],
        code: {
          PYTHON: `def isWellFormed(text: str) -> bool:
    partner = {")": "(", "]": "[", "}": "{"}
    open_brackets = []

    for char in text:
        if char in partner:
            # A closer with nothing open, or the wrong kind on top, fails.
            if not open_brackets or open_brackets.pop() != partner[char]:
                return False
        else:
            open_brackets.append(char)

    # Anything still open was never closed.
    return not open_brackets`,
          JAVA: `class Solution {
    public boolean isWellFormed(String text) {
        Map<Character, Character> partner = Map.of(')', '(', ']', '[', '}', '{');
        Deque<Character> open = new ArrayDeque<>();

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            if (partner.containsKey(c)) {
                if (open.isEmpty() || open.pop() != partner.get(c)) return false;
            } else {
                open.push(c);
            }
        }

        return open.isEmpty();
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) in the worst case, when every bracket opens",
        edgeCases: [
          "The empty string, which is well formed.",
          "A closing bracket arriving first.",
          "Correct counts in the wrong nesting order.",
          "Everything opened and nothing closed.",
        ],
        commonMistakes: [
          "Only counting brackets rather than tracking order.",
          "Forgetting the final emptiness check, so \"(((\" passes.",
          "Popping from an empty stack without guarding, which throws instead of returning false.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },
];
