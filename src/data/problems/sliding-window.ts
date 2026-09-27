import { example, para, rich, type ProblemSeed } from "./types";

/** Fixed and variable windows over contiguous ranges. */
export const SLIDING_WINDOW_PROBLEMS: ProblemSeed[] = [
  {
    slug: "longest-distinct-stretch",
    title: "Longest Distinct Stretch",
    difficulty: "MEDIUM",
    learningObjective:
      "Shrink a window until it is valid again, rather than restarting it from scratch.",
    topics: ["sliding-window", "strings", "hashing"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A session recorder stores the sequence of pages a visitor opened. Analysts want the longest unbroken stretch in which no page was opened twice."
      ),
      para("Return the length of that stretch."),
      example(
        'pages = "abcabcbb"',
        "3",
        [
          { state: "[a]bcabcbb", note: "window a — length 1" },
          { state: "[abc]abcbb", note: "window abc — length 3" },
          { state: "a[bca]bcbb", note: "second a forces the left edge past the first" },
          { state: "…", note: "no window ever exceeds 3" },
        ],
        "The left edge only ever moves forward"
      ),
    ],
    constraints: [
      "0 ≤ pages.length ≤ 100000",
      "The string contains printable ASCII characters.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["pages"],
      returns: "int",
      functionName: "longestDistinct",
    },
    tests: [
      { input: "abcabcbb", expected: "3", isSample: true, explanation: "\"abc\" is the longest distinct stretch." },
      { input: "bbbbb", expected: "1", isSample: true },
      { input: "pwwkew", expected: "3", isSample: true, explanation: "\"wke\" — note that \"pwke\" is not contiguous." },
      { input: "", expected: "0" },
      { input: "a", expected: "1" },
      { input: "au", expected: "2" },
      { input: "dvdf", expected: "3" },
      { input: "abba", expected: "2" },
    ],
    hints: [
      "Every candidate answer is a contiguous stretch, so a window can represent it.",
      "Extend the window to the right one page at a time. When does it stop being valid?",
      "When the incoming page is already inside the window. What is the cheapest way to make it valid again?",
      "Pull the left edge forward, removing pages, until the duplicate is gone. Each edge only ever moves right, so the scan is linear.",
    ],
    solutions: [
      {
        title: "Brute force: test every stretch",
        order: 1,
        intuition:
          "Try every start and every end, checking each candidate for duplicates. Correct and easy to trust, but it re-examines overlapping stretches constantly.",
        approach: [
          "For each start index, extend an end index while the characters stay distinct.",
          "Track the longest stretch found.",
        ],
        code: {
          PYTHON: `def longestDistinct(pages: str) -> int:
    best = 0
    for start in range(len(pages)):
        seen = set()
        for end in range(start, len(pages)):
            if pages[end] in seen:
                break
            seen.add(pages[end])
            best = max(best, end - start + 1)
    return best`,
          JAVA: `class Solution {
    public int longestDistinct(String pages) {
        int best = 0;
        for (int start = 0; start < pages.length(); start++) {
            Set<Character> seen = new HashSet<>();
            for (int end = start; end < pages.length(); end++) {
                if (!seen.add(pages.charAt(end))) break;
                best = Math.max(best, end - start + 1);
            }
        }
        return best;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(min(n, alphabet))",
        edgeCases: ["The empty string."],
        commonMistakes: ["Rebuilding the set for every start, which is where the waste is."],
      },
      {
        title: "Optimal: window with a last-seen map",
        order: 2,
        intuition:
          "When a duplicate arrives, the answer is not to start over — every stretch beginning before the previous occurrence is already dead. So jump the left edge to just past that occurrence. Storing each page's most recent index makes that jump a single assignment instead of a loop.",
        approach: [
          "Keep a map from page to the last index it was seen at.",
          "Extend the right edge one page at a time.",
          "If the page was seen at or after the current left edge, move left to just past it.",
          "Record the page's index and update the best length.",
        ],
        code: {
          PYTHON: `def longestDistinct(pages: str) -> int:
    last_seen = {}
    left = 0
    best = 0

    for right, page in enumerate(pages):
        previous = last_seen.get(page)
        # Only jump if the duplicate is INSIDE the current window; an older
        # occurrence has already been left behind.
        if previous is not None and previous >= left:
            left = previous + 1

        last_seen[page] = right
        best = max(best, right - left + 1)

    return best`,
          JAVA: `class Solution {
    public int longestDistinct(String pages) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int left = 0;
        int best = 0;

        for (int right = 0; right < pages.length(); right++) {
            char page = pages.charAt(right);
            Integer previous = lastSeen.get(page);
            if (previous != null && previous >= left) {
                left = previous + 1;
            }
            lastSeen.put(page, right);
            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(min(n, alphabet))",
        edgeCases: [
          "The empty string.",
          "All characters identical.",
          "A duplicate outside the current window, such as \"abba\", where the left edge must not move backwards.",
        ],
        commonMistakes: [
          "Omitting the `previous >= left` guard, which drags the left edge backwards on input like \"abba\" and reports a window containing duplicates.",
          "Measuring the window as right - left.",
          "Clearing the whole map on a duplicate instead of moving the edge.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(min(n, alphabet))",
  },

  {
    slug: "longest-uniform-after-swaps",
    title: "Longest Uniform Run After Swaps",
    difficulty: "MEDIUM",
    learningObjective:
      "Make a window valid by bounding what it would cost to fix, not by what it contains.",
    topics: ["sliding-window", "strings"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A tiling machine lays coloured tiles in a row. You may lift and repaint at most k tiles."
      ),
      para(
        "Return the length of the longest run of a single colour achievable after repainting at most k tiles."
      ),
      example(
        'tiles = "AABABBA", k = 1',
        "4",
        [
          { state: "[AABA]BBA", note: "3 A's, 1 B → repaint 1 → length 4" },
          { state: "AAB[ABBA]", note: "3 B's, 1 A → repaint 1 → length 4" },
        ],
        "Cost equals window size minus its most common colour"
      ),
    ],
    constraints: [
      "1 ≤ tiles.length ≤ 100000",
      "0 ≤ k ≤ tiles.length",
      "The string contains uppercase letters only.",
    ],
    signature: {
      params: ["string", "int"],
      paramNames: ["tiles", "k"],
      returns: "int",
      functionName: "longestUniform",
    },
    tests: [
      { input: "AABABBA\n1", expected: "4", isSample: true, explanation: "Repaint one tile to get four in a row." },
      { input: "ABAB\n2", expected: "4", isSample: true, explanation: "Repaint both of one colour." },
      { input: "AAAA\n0", expected: "4", isSample: true },
      { input: "AB\n0", expected: "1" },
      { input: "A\n0", expected: "1" },
      { input: "ABCDE\n1", expected: "2" },
      { input: "AABBBCCC\n2", expected: "5" },
      { input: "AAAABBBB\n8", expected: "8" },
    ],
    hints: [
      "For a given window, how many tiles would you have to repaint to make it uniform?",
      "All of them except the most common colour inside it — so cost = width minus the highest count.",
      "A window is allowed when that cost is at most k. Grow while allowed, shrink when not.",
      "Track the colour counts in the window and the largest count seen, so the cost is O(1) to evaluate.",
    ],
    solutions: [
      {
        title: "Window bounded by repaint cost",
        order: 1,
        intuition:
          "The validity test is not about what the window contains but about what it would cost to fix. Keeping the most common colour and repainting the rest is always optimal, so the cost of a window is its width minus its highest colour count. Grow while that stays within budget; shrink the moment it does not.",
        approach: [
          "Keep a count per colour for the window and the highest count seen.",
          "Extend the right edge, incrementing that colour's count.",
          "While width minus the highest count exceeds k, advance the left edge and decrement.",
          "Record the largest valid width.",
        ],
        code: {
          PYTHON: `def longestUniform(tiles: str, k: int) -> int:
    counts = {}
    left = 0
    best = 0
    most_common = 0

    for right, colour in enumerate(tiles):
        counts[colour] = counts.get(colour, 0) + 1
        most_common = max(most_common, counts[colour])

        # Cost of making this window uniform: repaint everything that is
        # not the most common colour in it.
        while (right - left + 1) - most_common > k:
            counts[tiles[left]] -= 1
            left += 1

        best = max(best, right - left + 1)

    return best`,
          JAVA: `class Solution {
    public int longestUniform(String tiles, int k) {
        int[] counts = new int[26];
        int left = 0, best = 0, mostCommon = 0;

        for (int right = 0; right < tiles.length(); right++) {
            int colour = tiles.charAt(right) - 'A';
            counts[colour]++;
            mostCommon = Math.max(mostCommon, counts[colour]);

            while ((right - left + 1) - mostCommon > k) {
                counts[tiles.charAt(left) - 'A']--;
                left++;
            }

            best = Math.max(best, right - left + 1);
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(alphabet)",
        edgeCases: [
          "k = 0, which reduces to the longest naturally uniform run.",
          "k large enough to repaint everything.",
          "A single tile.",
        ],
        commonMistakes: [
          "Recomputing the maximum count after every shrink. It is not needed: the answer can only grow, so a stale maximum never produces a window larger than one that was genuinely valid.",
          "Using `if` instead of `while` for the shrink step.",
          "Forgetting to decrement the count when the left edge moves.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(alphabet)",
  },

  {
    slug: "shortest-covering-run",
    title: "Shortest Covering Run",
    difficulty: "HARD",
    learningObjective:
      "Track how many requirements are satisfied, not how many characters match, so validity is O(1).",
    topics: ["sliding-window", "strings", "hashing"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A warehouse conveyor carries parts past a picker. A build requires a specific multiset of parts."
      ),
      para(
        "Return the length of the shortest contiguous run of the conveyor that contains every required part, counting multiplicity. Return 0 if no such run exists."
      ),
      example(
        'conveyor = "ADOBECODEBANC", required = "ABC"',
        "4",
        [
          { state: "[ADOBEC]ODEBANC", note: "first valid window — length 6" },
          { state: "ADOBEC[ODEBA]NC", note: "still valid at length 5? shrink further" },
          { state: "ADOBECODEB[ANC]", note: "length 3? needs B — final answer 4 via BANC" },
        ],
        "Grow to become valid, then shrink while staying valid"
      ),
    ],
    constraints: [
      "1 ≤ conveyor.length ≤ 100000",
      "1 ≤ required.length ≤ 100",
      "Both strings contain uppercase and lowercase letters.",
    ],
    signature: {
      params: ["string", "string"],
      paramNames: ["conveyor", "required"],
      returns: "int",
      functionName: "shortestCovering",
    },
    tests: [
      { input: "ADOBECODEBANC\nABC", expected: "4", isSample: true, explanation: "\"BANC\" is the shortest run holding A, B and C." },
      { input: "a\na", expected: "1", isSample: true },
      { input: "a\naa", expected: "0", isSample: true, explanation: "Two a's are required but only one is available." },
      { input: "ab\nb", expected: "1" },
      { input: "aa\naa", expected: "2" },
      { input: "abc\nd", expected: "0" },
      { input: "cabwefgewcwaefgcf\ncae", expected: "4" },
      { input: "aaflslflsldkalskaaa\naaa", expected: "3" },
    ],
    hints: [
      "Two phases alternate: grow until the window is valid, then shrink while it stays valid.",
      "Checking validity by comparing two whole frequency maps costs O(alphabet) per step. Can you make it O(1)?",
      "Count how many distinct required parts are currently satisfied in full.",
      "Increment that counter only at the exact moment a part's count reaches its requirement, and decrement only when it drops below.",
    ],
    solutions: [
      {
        title: "Window with a satisfied-requirements counter",
        order: 1,
        intuition:
          "The expensive part of this problem is not the window, it is testing whether the window is valid. Comparing maps each step is too slow. Instead keep one integer: how many distinct required parts are currently present in sufficient quantity. That integer changes only at the exact boundary where a count crosses its requirement, so maintaining it is constant time and the validity test is a single comparison.",
        approach: [
          "Build the requirement counts and note how many distinct parts are needed.",
          "Extend the right edge; when a part's window count exactly reaches its requirement, increment the satisfied counter.",
          "While every requirement is satisfied, record the width and shrink from the left.",
          "When shrinking drops a count below its requirement, decrement the satisfied counter.",
        ],
        code: {
          PYTHON: `def shortestCovering(conveyor: str, required: str) -> int:
    if not required or len(required) > len(conveyor):
        return 0

    need = {}
    for part in required:
        need[part] = need.get(part, 0) + 1

    distinct_needed = len(need)
    satisfied = 0
    window = {}
    left = 0
    best = len(conveyor) + 1

    for right, part in enumerate(conveyor):
        if part in need:
            window[part] = window.get(part, 0) + 1
            # Only the exact crossing point counts, so a surplus does not
            # inflate the counter.
            if window[part] == need[part]:
                satisfied += 1

        while satisfied == distinct_needed:
            best = min(best, right - left + 1)

            leaving = conveyor[left]
            if leaving in need:
                window[leaving] -= 1
                if window[leaving] < need[leaving]:
                    satisfied -= 1
            left += 1

    return 0 if best > len(conveyor) else best`,
          JAVA: `class Solution {
    public int shortestCovering(String conveyor, String required) {
        if (required.isEmpty() || required.length() > conveyor.length()) return 0;

        Map<Character, Integer> need = new HashMap<>();
        for (char c : required.toCharArray()) need.merge(c, 1, Integer::sum);

        int distinctNeeded = need.size();
        int satisfied = 0;
        Map<Character, Integer> window = new HashMap<>();
        int left = 0;
        int best = conveyor.length() + 1;

        for (int right = 0; right < conveyor.length(); right++) {
            char part = conveyor.charAt(right);
            if (need.containsKey(part)) {
                int count = window.merge(part, 1, Integer::sum);
                if (count == need.get(part)) satisfied++;
            }

            while (satisfied == distinctNeeded) {
                best = Math.min(best, right - left + 1);

                char leaving = conveyor.charAt(left);
                if (need.containsKey(leaving)) {
                    int count = window.merge(leaving, -1, Integer::sum);
                    if (count < need.get(leaving)) satisfied--;
                }
                left++;
            }
        }

        return best > conveyor.length() ? 0 : best;
    }
}`,
        },
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(alphabet)",
        edgeCases: [
          "The requirement longer than the conveyor.",
          "Repeated required parts, where multiplicity matters.",
          "No valid window at all.",
          "The whole conveyor being the answer.",
        ],
        commonMistakes: [
          "Incrementing the satisfied counter on every matching part rather than only at the crossing point, which makes surplus parts count twice.",
          "Comparing whole maps each iteration, turning the solution into O(n · alphabet).",
          "Recording the best width after shrinking rather than before.",
        ],
      },
    ],
    expectedTime: "O(n + m)",
    expectedSpace: "O(alphabet)",
  },

  {
    slug: "count-low-product-windows",
    title: "Count Low-Product Windows",
    difficulty: "MEDIUM",
    learningObjective:
      "Count all valid windows ending at each position, instead of enumerating them.",
    topics: ["sliding-window", "arrays"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A risk model multiplies the factors in a contiguous run of readings. A run is considered safe when its product is strictly below a threshold."
      ),
      para("Return how many contiguous runs are safe. All readings are positive."),
      example(
        "factors = [10, 5, 2, 6], limit = 100",
        "8",
        [
          { state: "[10]", note: "product 10 — safe" },
          { state: "[10,5]", note: "50 — safe" },
          { state: "[10,5,2]", note: "100 — not below the limit" },
          { state: "window shrinks to [5,2]", note: "10 — safe, contributing 2 runs" },
        ],
        "Each right edge contributes its window's width"
      ),
    ],
    constraints: [
      "1 ≤ factors.length ≤ 100000",
      "1 ≤ factors[i] ≤ 1000",
      "0 ≤ limit ≤ 1000000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["factors", "limit"],
      returns: "int",
      functionName: "countSafeRuns",
    },
    tests: [
      { input: "10 5 2 6\n100", expected: "8", isSample: true, explanation: "Eight contiguous runs have a product below 100." },
      { input: "1 2 3\n0", expected: "0", isSample: true, explanation: "No product is below zero." },
      { input: "1\n2", expected: "1" },
      { input: "1 1 1\n2", expected: "6" },
      { input: "10 9 10 4 3 8 5\n19", expected: "8" },
      { input: "1000\n1000", expected: "0" },
      { input: "1000\n1001", expected: "1" },
    ],
    hints: [
      "Enumerating every run is O(n²). Can you count them in groups?",
      "Fix the right edge. How many safe runs end exactly there?",
      "Exactly as many as the current window is wide — every suffix of a safe window is also safe, because the factors are positive.",
      "So maintain the widest safe window ending at each position, and add its width to the total.",
    ],
    solutions: [
      {
        title: "Window whose width is the count",
        order: 1,
        intuition:
          "Because every factor is at least 1, shrinking a run can only reduce its product. So if a window is safe, every suffix of it is safe too. That turns counting into arithmetic: for each right edge, the number of safe runs ending there is simply the width of the widest safe window ending there.",
        approach: [
          "Maintain a running product and a left edge.",
          "Multiply in each new factor.",
          "While the product is at or above the limit, divide out the left factor and advance the left edge.",
          "Add the window's width to the total.",
        ],
        code: {
          PYTHON: `def countSafeRuns(factors: List[int], limit: int) -> int:
    if limit <= 1:
        return 0   # every product is at least 1, so nothing can qualify

    product = 1
    left = 0
    total = 0

    for right, factor in enumerate(factors):
        product *= factor

        while product >= limit:
            product //= factors[left]
            left += 1

        # Every suffix of a safe window is itself safe, and there are
        # exactly (right - left + 1) of them ending here.
        total += right - left + 1

    return total`,
          JAVA: `class Solution {
    public int countSafeRuns(int[] factors, int limit) {
        if (limit <= 1) return 0;

        long product = 1;
        int left = 0;
        int total = 0;

        for (int right = 0; right < factors.length; right++) {
            product *= factors[right];

            while (product >= limit) {
                product /= factors[left];
                left++;
            }

            total += right - left + 1;
        }

        return total;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A limit of 0 or 1, where no run qualifies.",
          "A single factor at or above the limit.",
          "All factors equal to 1, where every run is safe.",
        ],
        commonMistakes: [
          "Omitting the `limit <= 1` guard, which lets the shrink loop run past the right edge.",
          "Adding 1 per window instead of its width, which counts only the widest run per position.",
          "Overflowing the product in a fixed-width type — use a wider accumulator.",
          "Applying this to arrays containing zero or negative values, where shrinking no longer reduces the product monotonically.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "max-vowels-in-window",
    title: "Densest Signal Window",
    difficulty: "EASY",
    learningObjective:
      "Maintain a count incrementally as a fixed window slides, rather than recounting.",
    topics: ["sliding-window", "strings"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A transmission is a string of letters. Certain letters — a, e, i, o and u — carry the signal; the rest are filler."
      ),
      rich(
        "Return the maximum number of signal letters in any window of exactly ",
        { code: "k" },
        " consecutive characters."
      ),
      example(
        'transmission = "abciiidef", k = 3',
        "3",
        [
          { state: "[abc]iiidef", note: "1 signal letter" },
          { state: "a[bci]idef", note: "1" },
          { state: "abc[iii]def", note: "3 — the maximum" },
        ],
        "One character enters, one leaves"
      ),
    ],
    constraints: [
      "1 ≤ k ≤ transmission.length ≤ 100000",
      "The string contains lowercase letters only.",
    ],
    signature: {
      params: ["string", "int"],
      paramNames: ["transmission", "k"],
      returns: "int",
      functionName: "densestWindow",
    },
    tests: [
      { input: "abciiidef\n3", expected: "3", isSample: true, explanation: "The window \"iii\" holds three signal letters." },
      { input: "leetcode\n3", expected: "2", isSample: true, explanation: "\"lee\" and \"eet\" both hold two." },
      { input: "rhythms\n4", expected: "0", isSample: true, explanation: "No signal letters at all." },
      { input: "a\n1", expected: "1" },
      { input: "aeiou\n5", expected: "5" },
      { input: "bcdfg\n2", expected: "0" },
      { input: "aeiouaeiou\n3", expected: "3" },
    ],
    hints: [
      "Counting the signal letters in each window from scratch costs O(n·k).",
      "Neighbouring windows differ by exactly two characters.",
      "One enters on the right and one leaves on the left — adjust the count by at most one in each direction.",
      "Build the first window's count directly, then slide.",
    ],
    solutions: [
      {
        title: "Fixed window with an incremental count",
        order: 1,
        intuition:
          "The windows overlap almost entirely, so recounting throws away work you already did. Compute the first window once, then maintain it: the character leaving the left edge may decrement the count, and the one entering the right may increment it.",
        approach: [
          "Count the signal letters in the first k characters.",
          "Record that as the best so far.",
          "Slide: add the entering character's contribution and subtract the leaving one's.",
          "Track the maximum.",
        ],
        code: {
          PYTHON: `def densestWindow(transmission: str, k: int) -> int:
    signal = set("aeiou")

    count = sum(1 for char in transmission[:k] if char in signal)
    best = count

    for right in range(k, len(transmission)):
        if transmission[right] in signal:
            count += 1
        if transmission[right - k] in signal:
            count -= 1
        if count > best:
            best = count

    return best`,
          JAVA: `class Solution {
    public int densestWindow(String transmission, int k) {
        int count = 0;
        for (int i = 0; i < k; i++) {
            if (isSignal(transmission.charAt(i))) count++;
        }

        int best = count;
        for (int right = k; right < transmission.length(); right++) {
            if (isSignal(transmission.charAt(right))) count++;
            if (isSignal(transmission.charAt(right - k))) count--;
            if (count > best) best = count;
        }

        return best;
    }

    private boolean isSignal(char c) {
        return c == 'a' || c == 'e' || c == 'i' || c == 'o' || c == 'u';
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "k equal to the string length, so there is one window.",
          "No signal letters anywhere.",
          "Every character a signal letter.",
        ],
        commonMistakes: [
          "Subtracting the character at index right - k + 1, which drops the wrong one.",
          "Rebuilding the count inside the loop.",
          "Returning early on finding a full window, when k might exceed the number of signal letters available.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },
];
