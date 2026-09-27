import { example, para, rich, type ProblemSeed } from "./types";

/** Boundary hunting, on sorted input and on the answer space. */
export const BINARY_SEARCH_PROBLEMS: ProblemSeed[] = [
  {
    slug: "first-failing-build",
    title: "First Failing Build",
    difficulty: "EASY",
    learningObjective:
      "Search for a boundary in a false-then-true predicate rather than for a value.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A build pipeline produced a sequence of builds. Every build after some point is broken, and every build before it is fine — once it breaks, it stays broken."
      ),
      rich(
        "Given an array of build statuses where ",
        { code: "0" },
        " is passing and ",
        { code: "1" },
        " is failing, return the index of the first failing build, or the array length if none fail."
      ),
      example(
        "builds = [0, 0, 0, 1, 1]",
        "3",
        [
          { state: "lo=0 hi=4, mid=2 → 0", note: "still passing, discard the left half" },
          { state: "lo=3 hi=4, mid=3 → 1", note: "failing, keep it as a candidate" },
          { state: "lo=3 hi=3", note: "boundary found" },
        ],
        "Halving toward the boundary"
      ),
    ],
    constraints: [
      "1 ≤ builds.length ≤ 1000000",
      "Each entry is 0 or 1.",
      "Once a 1 appears, every later entry is 1.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["builds"],
      returns: "int",
      functionName: "firstFailing",
    },
    tests: [
      { input: "0 0 0 1 1", expected: "3", isSample: true },
      { input: "1 1 1", expected: "0", isSample: true, explanation: "The very first build fails." },
      { input: "0 0 0", expected: "3", isSample: true, explanation: "Nothing fails, so the answer is the array length." },
      { input: "0", expected: "1" },
      { input: "1", expected: "0" },
      { input: "0 1", expected: "1" },
      { input: "0 0 0 0 0 0 0 1", expected: "7" },
    ],
    hints: [
      "The array reads 0 0 0 … 1 1 1. You are looking for the single place where it flips.",
      "A linear scan is O(n). The sorted structure allows better.",
      "Check the middle. If it is passing, the flip must be to its right; if failing, the flip is at it or to its left.",
      "Keep the failing midpoint as a candidate rather than discarding it — that is what makes the search find the FIRST one.",
    ],
    solutions: [
      {
        title: "Boundary search with a half-open invariant",
        order: 1,
        intuition:
          "This is the base case of every binary search: a predicate that is false for a while and then true forever. The loop's job is to shrink a range that always contains the boundary. A failing midpoint might itself be the answer, so it is kept; a passing one definitely is not, so it is discarded.",
        approach: [
          "Set lo = 0 and hi = length (one past the end, representing 'none failed').",
          "While lo < hi, take the midpoint.",
          "If that build fails, set hi = mid, keeping it as a candidate.",
          "Otherwise set lo = mid + 1.",
          "Return lo.",
        ],
        code: {
          PYTHON: `def firstFailing(builds: List[int]) -> int:
    # hi starts one past the end: that index means "nothing failed".
    lo, hi = 0, len(builds)

    while lo < hi:
        # Biasing toward lo is what guarantees termination when hi == lo + 1.
        mid = lo + (hi - lo) // 2
        if builds[mid] == 1:
            hi = mid          # mid might be the first failure — keep it
        else:
            lo = mid + 1      # mid passes, so it definitely is not

    return lo`,
          JAVA: `class Solution {
    public int firstFailing(int[] builds) {
        int lo = 0, hi = builds.length;

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (builds[mid] == 1) hi = mid;
            else lo = mid + 1;
        }

        return lo;
    }
}`,
        },
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Every build failing, answer 0.",
          "No build failing, answer equals the length.",
          "A single element.",
        ],
        commonMistakes: [
          "Setting hi = mid - 1 when the midpoint fails, which can skip the boundary.",
          "Mixing an inclusive hi with hi = mid, producing an infinite loop.",
          "Returning mid on the first failure found, which is not necessarily the earliest.",
        ],
      },
    ],
    expectedTime: "O(log n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "insert-position-sorted",
    title: "Insertion Slot",
    difficulty: "EASY",
    learningObjective:
      "Return a lower bound, which answers both 'where is it' and 'where would it go'.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A sorted list of distinct sensor thresholds must stay sorted when a new threshold is added."
      ),
      para(
        "Return the index at which the new value should be inserted. If it already exists, return its index."
      ),
      example(
        "thresholds = [1, 3, 5, 6], value = 5",
        "2",
        [
          { state: "lo=0 hi=4 mid=2 → 5", note: "5 is not less than 5, keep as candidate" },
          { state: "lo=0 hi=2 mid=1 → 3", note: "3 < 5, discard" },
          { state: "lo=2 hi=2", note: "answer 2" },
        ],
        "Lower bound: the first index not less than the value"
      ),
    ],
    constraints: [
      "1 ≤ thresholds.length ≤ 1000000",
      "thresholds is sorted strictly ascending.",
      "-1000000000 ≤ values ≤ 1000000000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["thresholds", "value"],
      returns: "int",
      functionName: "insertionSlot",
    },
    tests: [
      { input: "1 3 5 6\n5", expected: "2", isSample: true },
      { input: "1 3 5 6\n2", expected: "1", isSample: true, explanation: "2 belongs between 1 and 3." },
      { input: "1 3 5 6\n7", expected: "4", isSample: true, explanation: "Larger than everything, so it goes at the end." },
      { input: "1\n0", expected: "0" },
      { input: "1\n1", expected: "0" },
      { input: "1\n2", expected: "1" },
      { input: "-5 -3 -1\n-4", expected: "1" },
      { input: "10 20 30\n30", expected: "2" },
    ],
    hints: [
      "Both cases — found and not found — have the same answer shape: the first index whose value is not smaller than the target.",
      "That is called the lower bound. Searching for it directly removes the need for a special case.",
      "Use the predicate 'thresholds[i] >= value', which is false then true.",
      "When the predicate holds at the midpoint, keep the midpoint; otherwise discard it.",
    ],
    solutions: [
      {
        title: "Lower bound",
        order: 1,
        intuition:
          "It is tempting to search for the value and then handle 'not found' separately. Framing it as a lower bound collapses both cases into one: the first position whose value is at least the target is exactly where the value is, or exactly where it belongs.",
        approach: [
          "Set lo = 0 and hi = length.",
          "While lo < hi, take the midpoint.",
          "If thresholds[mid] is at least the value, set hi = mid.",
          "Otherwise set lo = mid + 1.",
          "Return lo.",
        ],
        code: {
          PYTHON: `def insertionSlot(thresholds: List[int], value: int) -> int:
    lo, hi = 0, len(thresholds)

    while lo < hi:
        mid = lo + (hi - lo) // 2
        if thresholds[mid] >= value:
            hi = mid
        else:
            lo = mid + 1

    return lo`,
          JAVA: `class Solution {
    public int insertionSlot(int[] thresholds, int value) {
        int lo = 0, hi = thresholds.length;

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (thresholds[mid] >= value) hi = mid;
            else lo = mid + 1;
        }

        return lo;
    }
}`,
        },
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A value smaller than everything, answer 0.",
          "A value larger than everything, answer equals the length.",
          "An exact match.",
        ],
        commonMistakes: [
          "Using > instead of >=, which returns the upper bound and is off by one on an exact match.",
          "Setting hi = length - 1, which cannot express 'insert at the end'.",
        ],
      },
    ],
    expectedTime: "O(log n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "rotated-catalogue-search",
    title: "Rotated Catalogue Search",
    difficulty: "MEDIUM",
    learningObjective:
      "Recover the halving property by identifying which half is still sorted.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A sorted catalogue of distinct product codes was rotated by an unknown amount during a migration, so it now reads like the tail followed by the head."
      ),
      rich("Find the index of a target code, or ", { code: "-1" }, " if it is absent. The search must be logarithmic."),
      example(
        "codes = [4, 5, 6, 7, 0, 1, 2], target = 0",
        "4",
        [
          { state: "mid=3 (7)", note: "left half [4..7] is sorted; 0 is not in it" },
          { state: "search right", note: "mid=5 (1); left half [0,1] sorted, 0 is in it" },
          { state: "found", note: "index 4" },
        ],
        "One half is always properly sorted"
      ),
    ],
    constraints: [
      "1 ≤ codes.length ≤ 100000",
      "All codes are distinct.",
      "The array is a rotation of a strictly ascending array.",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["codes", "target"],
      returns: "int",
      functionName: "searchRotated",
    },
    tests: [
      { input: "4 5 6 7 0 1 2\n0", expected: "4", isSample: true },
      { input: "4 5 6 7 0 1 2\n3", expected: "-1", isSample: true },
      { input: "1\n1", expected: "0", isSample: true },
      { input: "1\n0", expected: "-1" },
      { input: "3 1\n1", expected: "1" },
      { input: "5 1 2 3 4\n5", expected: "0" },
      { input: "1 2 3 4 5\n4", expected: "3" },
      { input: "6 7 8 1 2 3 4 5\n8", expected: "2" },
    ],
    hints: [
      "The array is not sorted overall, so the usual comparison against the midpoint does not tell you which way to go.",
      "Split at the midpoint. Look at the two halves — can they both be unsorted?",
      "No. A single rotation means at least one half is still properly ascending.",
      "Identify the sorted half, check whether the target lies inside its range, and search that half if so, the other otherwise.",
    ],
    solutions: [
      {
        title: "Halve, then decide which side is trustworthy",
        order: 1,
        intuition:
          "Binary search needs to discard half the space with confidence. Rotation breaks the global ordering but not the local one: with a single rotation point, at most one half can straddle it, so the other half is genuinely sorted. Once you identify that half you can test membership by range, and whichever way that test goes, half the array is eliminated.",
        approach: [
          "Maintain inclusive lo and hi.",
          "Compare the midpoint with the target and return on a match.",
          "If codes[lo] ≤ codes[mid] the left half is sorted; otherwise the right half is.",
          "Check whether the target lies within the sorted half's range and move the bounds accordingly.",
        ],
        code: {
          PYTHON: `def searchRotated(codes: List[int], target: int) -> int:
    lo, hi = 0, len(codes) - 1

    while lo <= hi:
        mid = lo + (hi - lo) // 2
        if codes[mid] == target:
            return mid

        if codes[lo] <= codes[mid]:
            # The left half is properly sorted, so a range check is valid.
            if codes[lo] <= target < codes[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            # Then the right half must be the sorted one.
            if codes[mid] < target <= codes[hi]:
                lo = mid + 1
            else:
                hi = mid - 1

    return -1`,
          JAVA: `class Solution {
    public int searchRotated(int[] codes, int target) {
        int lo = 0, hi = codes.length - 1;

        while (lo <= hi) {
            int mid = lo + (hi - lo) / 2;
            if (codes[mid] == target) return mid;

            if (codes[lo] <= codes[mid]) {
                if (codes[lo] <= target && target < codes[mid]) hi = mid - 1;
                else lo = mid + 1;
            } else {
                if (codes[mid] < target && target <= codes[hi]) lo = mid + 1;
                else hi = mid - 1;
            }
        }

        return -1;
    }
}`,
        },
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A rotation of zero, where the array is simply sorted.",
          "A single element.",
          "The target at the rotation point.",
          "The target absent entirely.",
        ],
        commonMistakes: [
          "Using < instead of ≤ when testing `codes[lo] <= codes[mid]`, which misclassifies a two-element window.",
          "Getting the range test's inclusivity wrong and skipping the target at a boundary.",
          "Finding the rotation point first and then searching — correct, but two passes where one suffices.",
        ],
      },
    ],
    expectedTime: "O(log n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "minimum-throughput",
    title: "Minimum Throughput",
    difficulty: "MEDIUM",
    learningObjective:
      "Binary search the answer space when feasibility is monotonic and cheap to check.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A batch processor must clear a list of job sizes within a fixed number of hours. In each hour it can process up to a chosen throughput, and it works on only one job per hour — a job smaller than the throughput still occupies the whole hour."
      ),
      para("Return the smallest throughput that clears every job within the deadline."),
      example(
        "jobs = [3, 6, 7, 11], hours = 8",
        "4",
        [
          { state: "throughput 4", note: "1 + 2 + 2 + 3 = 8 hours — fits" },
          { state: "throughput 3", note: "1 + 2 + 3 + 4 = 10 hours — too slow" },
        ],
        "Feasibility is monotonic in the throughput"
      ),
    ],
    constraints: [
      "1 ≤ jobs.length ≤ 100000",
      "jobs.length ≤ hours ≤ 1000000000",
      "1 ≤ jobs[i] ≤ 1000000000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["jobs", "hours"],
      returns: "int",
      functionName: "minimumThroughput",
    },
    tests: [
      { input: "3 6 7 11\n8", expected: "4", isSample: true },
      { input: "30 11 23 4 20\n5", expected: "30", isSample: true, explanation: "One job per hour, so the throughput must cover the largest." },
      { input: "30 11 23 4 20\n6", expected: "23", isSample: true },
      { input: "1\n1", expected: "1" },
      { input: "1000000000\n1", expected: "1000000000" },
      { input: "1 1 1 1\n4", expected: "1" },
      { input: "2 2\n3", expected: "2" },
    ],
    hints: [
      "You are not searching the array — you are searching the possible answers.",
      "What is the range of plausible throughputs? The smallest is 1; the largest never needs to exceed the biggest job.",
      "For a candidate throughput, how long does the whole batch take? That is a cheap linear check.",
      "Feasibility is monotonic: if a throughput works, every larger one does too. That is the false-then-true predicate binary search needs.",
    ],
    solutions: [
      {
        title: "Binary search over the throughput",
        order: 1,
        intuition:
          "There is no sorted array here, which is why the pattern is easy to miss. The sorted thing is the space of candidate answers: throughput 1 is too slow, throughput equal to the largest job is certainly fast enough, and somewhere in between is a single flip from infeasible to feasible. Binary search finds that flip, and each probe costs one linear pass.",
        approach: [
          "Set lo = 1 and hi = the largest job.",
          "For a candidate, compute the hours needed as the sum of ceil(job / candidate).",
          "If it fits within the deadline, the candidate is feasible; look for something smaller.",
          "Otherwise look higher.",
          "Return lo.",
        ],
        code: {
          PYTHON: `def minimumThroughput(jobs: List[int], hours: int) -> int:
    def hours_needed(rate: int) -> int:
        # Ceiling division without floats: each job occupies whole hours.
        return sum((job + rate - 1) // rate for job in jobs)

    lo, hi = 1, max(jobs)

    while lo < hi:
        mid = lo + (hi - lo) // 2
        if hours_needed(mid) <= hours:
            hi = mid          # feasible; maybe something slower also works
        else:
            lo = mid + 1      # too slow

    return lo`,
          JAVA: `class Solution {
    public int minimumThroughput(int[] jobs, int hours) {
        int lo = 1, hi = 0;
        for (int job : jobs) hi = Math.max(hi, job);

        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (hoursNeeded(jobs, mid) <= hours) hi = mid;
            else lo = mid + 1;
        }

        return lo;
    }

    private long hoursNeeded(int[] jobs, int rate) {
        long total = 0;
        for (int job : jobs) total += (job + rate - 1L) / rate;
        return total;
    }
}`,
        },
        timeComplexity: "O(n log M), where M is the largest job",
        spaceComplexity: "O(1)",
        edgeCases: [
          "hours equal to the job count, forcing the throughput up to the largest job.",
          "A single job.",
          "Very large jobs, where the hour total must not overflow a 32-bit accumulator.",
        ],
        commonMistakes: [
          "Using floating-point division for the ceiling, which loses precision at large values.",
          "Starting hi at the sum of all jobs, which still works but wastes iterations.",
          "Summing hours into a 32-bit int, which can overflow before the comparison.",
        ],
      },
    ],
    expectedTime: "O(n log M)",
    expectedSpace: "O(1)",
  },

  {
    slug: "range-of-value",
    title: "First and Last Occurrence",
    difficulty: "MEDIUM",
    learningObjective:
      "Compose two boundary searches to find a range, instead of scanning outward from a hit.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A sorted log of event codes may contain a value many times. A dashboard needs the span of positions covering a particular code."
      ),
      rich(
        "Return the first and last index of the target as a two-element array, or ",
        { code: "[-1, -1]" },
        " if it is absent."
      ),
      example(
        "codes = [5, 7, 7, 8, 8, 10], target = 8",
        "[3, 4]",
        [
          { state: "lower bound of 8", note: "first index not less than 8 → 3" },
          { state: "lower bound of 9", note: "first index not less than 9 → 5" },
          { state: "range", note: "[3, 5 - 1] = [3, 4]" },
        ],
        "Two boundary searches, one subtraction"
      ),
    ],
    constraints: [
      "0 ≤ codes.length ≤ 100000",
      "codes is sorted in non-decreasing order.",
      "-1000000000 ≤ values ≤ 1000000000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["codes", "target"],
      returns: "int[]",
      functionName: "occurrenceRange",
    },
    tests: [
      { input: "5 7 7 8 8 10\n8", expected: "3 4", isSample: true },
      { input: "5 7 7 8 8 10\n6", expected: "-1 -1", isSample: true },
      { input: "\n0", expected: "-1 -1", isSample: true },
      { input: "1\n1", expected: "0 0" },
      { input: "2 2 2 2\n2", expected: "0 3" },
      { input: "1 2 3\n3", expected: "2 2" },
      { input: "1 1 2 2 3 3\n2", expected: "2 3" },
    ],
    hints: [
      "Finding one occurrence then scanning outward is O(n) when the value repeats many times.",
      "The first occurrence is the first index whose value is at least the target.",
      "The last occurrence is one before the first index whose value is strictly greater than the target.",
      "Both are boundary searches. Write one helper and call it twice with different predicates.",
    ],
    solutions: [
      {
        title: "Lower bound twice",
        order: 1,
        intuition:
          "Once you can find a boundary, a range is two boundaries. The first occurrence is the lower bound of the target; one past the last occurrence is the lower bound of target + 1. Subtracting gives the end, and if the two bounds coincide the value is absent — no separate existence check needed.",
        approach: [
          "Write a lower-bound helper: the first index whose value is at least a given bound.",
          "Call it with the target to get the start.",
          "Call it with target + 1 to get one past the end.",
          "If the two are equal the target is absent; otherwise return [start, end - 1].",
        ],
        code: {
          PYTHON: `def occurrenceRange(codes: List[int], target: int) -> List[int]:
    def lower_bound(bound: int) -> int:
        lo, hi = 0, len(codes)
        while lo < hi:
            mid = lo + (hi - lo) // 2
            if codes[mid] >= bound:
                hi = mid
            else:
                lo = mid + 1
        return lo

    start = lower_bound(target)
    end = lower_bound(target + 1)   # one past the last occurrence

    # Equal bounds means the value never appears; no separate check needed.
    if start == end:
        return [-1, -1]
    return [start, end - 1]`,
          JAVA: `class Solution {
    public int[] occurrenceRange(int[] codes, int target) {
        int start = lowerBound(codes, target);
        int end = lowerBound(codes, target + 1);

        if (start == end) return new int[] { -1, -1 };
        return new int[] { start, end - 1 };
    }

    private int lowerBound(int[] codes, long bound) {
        int lo = 0, hi = codes.length;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (codes[mid] >= bound) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }
}`,
        },
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "An empty array.",
          "The target absent but within the value range.",
          "Every element equal to the target.",
          "A target equal to the maximum integer, where target + 1 would overflow — widen the bound's type.",
        ],
        commonMistakes: [
          "Finding one occurrence and expanding outward, which is linear when the value repeats.",
          "Writing two subtly different searches instead of reusing one helper, and getting the second's inclusivity wrong.",
          "Overflowing on target + 1 in a fixed-width type.",
        ],
      },
    ],
    expectedTime: "O(log n)",
    expectedSpace: "O(1)",
  },
];
