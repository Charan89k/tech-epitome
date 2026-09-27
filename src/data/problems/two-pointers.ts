import { example, para, type ProblemSeed } from "./types";

/** Opposite-direction and same-direction pointer techniques. */
export const TWO_POINTER_PROBLEMS: ProblemSeed[] = [
  {
    slug: "sorted-pair-target",
    title: "Sorted Pair Target",
    difficulty: "EASY",
    learningObjective:
      "Exploit sortedness so each comparison eliminates a whole region of candidates.",
    topics: ["two-pointers", "arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A sorted price list is scanned for two items whose prices add up to a budget exactly."
      ),
      para(
        "Return the two positions, smaller first. Exactly one such pair exists. Because the list is sorted, no extra memory is needed."
      ),
      example(
        "prices = [2, 4, 7, 11, 15], budget = 18",
        "[2, 4]",
        [
          { state: "left=0 (2), right=4 (15)", note: "17 < 18 → raise the floor" },
          { state: "left=1 (4), right=4 (15)", note: "19 > 18 → lower the ceiling" },
          { state: "left=1 (4), right=3 (11)", note: "15 < 18 → raise the floor" },
          { state: "left=2 (7), right=4? no — left=2, right=3", note: "continue until 7 + 11 = 18" },
        ],
        "Each step rules out one endpoint permanently"
      ),
    ],
    constraints: [
      "2 ≤ prices.length ≤ 100000",
      "prices is sorted in non-decreasing order.",
      "-1000000 ≤ prices[i] ≤ 1000000",
      "Exactly one valid pair exists.",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["prices", "budget"],
      returns: "int[]",
      functionName: "sortedPair",
    },
    tests: [
      { input: "2 4 7 11 15\n18", expected: "2 3", isSample: true, explanation: "7 + 11 = 18." },
      { input: "1 2\n3", expected: "0 1", isSample: true },
      { input: "-4 -1 0 3\n-5", expected: "0 1" },
      { input: "0 0\n0", expected: "0 1" },
      { input: "1 3 5 7 9\n16", expected: "3 4" },
      { input: "2 3 4\n6", expected: "0 2" },
      { input: "-10 -5 0 5 10\n0", expected: "0 4" },
    ],
    hints: [
      "The list is sorted. What does that tell you about the sum when you pick the two ends?",
      "If the sum of the smallest and largest is too small, which element can never be part of the answer?",
      "The smallest one — no partner could push it high enough. Discard it.",
      "Symmetrically, if the sum is too large, the largest element is impossible. Move whichever end the comparison condemns.",
    ],
    solutions: [
      {
        title: "Close in from both ends",
        order: 1,
        intuition:
          "Sortedness turns a comparison into an elimination. When the two ends sum below the budget, the smaller end is hopeless: it is already paired with the largest value available and still falls short. The same reasoning condemns the larger end when the sum overshoots. Every iteration therefore discards one candidate for good, and the scan is linear.",
        approach: [
          "Put one pointer at each end.",
          "Compute the sum of the two.",
          "Return the pair if it matches the budget.",
          "Advance the left pointer if the sum is too small, or retreat the right pointer if it is too large.",
        ],
        code: {
          PYTHON: `def sortedPair(prices: List[int], budget: int) -> List[int]:
    left, right = 0, len(prices) - 1

    while left < right:
        total = prices[left] + prices[right]
        if total == budget:
            return [left, right]
        if total < budget:
            # prices[left] is already paired with the largest remaining
            # value and still falls short, so it can never work.
            left += 1
        else:
            right -= 1

    return []`,
          JAVA: `class Solution {
    public int[] sortedPair(int[] prices, int budget) {
        int left = 0, right = prices.length - 1;

        while (left < right) {
            int total = prices[left] + prices[right];
            if (total == budget) return new int[] { left, right };
            if (total < budget) left++;
            else right--;
        }

        return new int[0];
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Exactly two elements.",
          "Negative prices.",
          "The pair sitting at the two ends.",
        ],
        commonMistakes: [
          "Using `left <= right`, which allows an element to pair with itself.",
          "Moving both pointers in one iteration, stepping over the answer.",
          "Applying this to an unsorted array, where the elimination argument does not hold.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "dedupe-sorted-log",
    title: "Dedupe a Sorted Log",
    difficulty: "EASY",
    learningObjective:
      "Use a slow write pointer to collapse duplicates in place without a second array.",
    topics: ["two-pointers", "arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A sorted log of event ids contains consecutive duplicates. Remove them in place so each id appears once, preserving order."
      ),
      para("Return the number of unique ids. Values beyond that count do not matter."),
      example(
        "ids = [1, 1, 2, 3, 3, 3]",
        "3",
        [
          { state: "[1, ...]", note: "write=1, first id always kept" },
          { state: "[1, 2, ...]", note: "2 differs from 1 → keep" },
          { state: "[1, 2, 3, ...]", note: "3 differs from 2 → keep" },
        ],
        "Compare each value with the last one kept"
      ),
    ],
    constraints: [
      "0 ≤ ids.length ≤ 100000",
      "ids is sorted in non-decreasing order.",
      "No extra array may be allocated.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["ids"],
      returns: "int",
      functionName: "dedupeSorted",
    },
    tests: [
      { input: "1 1 2 3 3 3", expected: "3", isSample: true, explanation: "Unique ids are 1, 2, 3." },
      { input: "", expected: "0", isSample: true },
      { input: "5", expected: "1" },
      { input: "2 2 2 2", expected: "1" },
      { input: "1 2 3", expected: "3" },
      { input: "-1 -1 0 0 1", expected: "3" },
      { input: "7 7 8", expected: "2" },
    ],
    hints: [
      "The array is sorted, so duplicates are always adjacent. What does that let you compare against?",
      "Each value only has to be compared with the last value you decided to keep.",
      "Keep a write index marking where the next unique value belongs.",
      "The first element is always unique, so start the write index at 1.",
    ],
    solutions: [
      {
        title: "Write pointer trailing a read pointer",
        order: 1,
        intuition:
          "Because the input is sorted, a duplicate can only ever sit next to its twin. So the test for uniqueness is purely local: is this value different from the last one I kept? The write pointer marks the end of the deduplicated prefix and only advances when something new is found, so it can never overtake the reader.",
        approach: [
          "Return 0 for an empty array.",
          "Set write = 1; the first element is always kept.",
          "Scan from index 1. When the value differs from ids[write - 1], copy it to ids[write] and advance write.",
          "Return write.",
        ],
        code: {
          PYTHON: `def dedupeSorted(ids: List[int]) -> int:
    if not ids:
        return 0

    write = 1   # the first element is always unique

    for read in range(1, len(ids)):
        # Sorted input means duplicates are adjacent, so comparing against
        # the last kept value is enough.
        if ids[read] != ids[write - 1]:
            ids[write] = ids[read]
            write += 1

    return write`,
          JAVA: `class Solution {
    public int dedupeSorted(int[] ids) {
        if (ids.length == 0) return 0;

        int write = 1;
        for (int read = 1; read < ids.length; read++) {
            if (ids[read] != ids[write - 1]) {
                ids[write] = ids[read];
                write++;
            }
        }

        return write;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "An empty array.",
          "A single element.",
          "Every element identical, returning 1.",
        ],
        commonMistakes: [
          "Starting write at 0, which discards the first element.",
          "Comparing against ids[read - 1] instead of ids[write - 1] — equivalent here, but it breaks as soon as the rule allows more than one copy.",
          "Using a set, which loses the in-place requirement and the ordering guarantee.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "widest-water-span",
    title: "Widest Water Span",
    difficulty: "MEDIUM",
    learningObjective:
      "Prove which pointer to move by arguing about which candidate can be safely discarded.",
    topics: ["two-pointers", "arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A row of vertical posts stands on flat ground, each with a given height. Choosing two posts and stretching a sheet between them forms a container; the water it holds is limited by the shorter post and by the distance between them."
      ),
      para("Return the largest volume any pair of posts can hold."),
      example(
        "heights = [1, 8, 6, 2, 5, 4, 8, 3, 7]",
        "49",
        [
          { state: "left=0 (1), right=8 (7)", note: "min 1 × width 8 = 8; move the shorter" },
          { state: "left=1 (8), right=8 (7)", note: "min 7 × width 7 = 49" },
          { state: "…", note: "no wider pair beats it" },
        ],
        "Always move the shorter post"
      ),
    ],
    constraints: [
      "2 ≤ heights.length ≤ 100000",
      "0 ≤ heights[i] ≤ 100000",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["heights"],
      returns: "int",
      functionName: "widestSpan",
    },
    tests: [
      { input: "1 8 6 2 5 4 8 3 7", expected: "49", isSample: true, explanation: "Posts at indices 1 and 8: min(8,7) × 7 = 49." },
      { input: "1 1", expected: "1", isSample: true },
      { input: "0 0", expected: "0" },
      { input: "4 3 2 1 4", expected: "16" },
      { input: "1 2 1", expected: "2" },
      { input: "2 3 4 5 18 17 6", expected: "17" },
      { input: "100000 1 100000", expected: "200000" },
    ],
    hints: [
      "Checking every pair is O(n²). Start instead with the widest possible pair — the two ends.",
      "Any other pair is narrower. For a narrower pair to hold more, its limiting height must be greater.",
      "So look at the shorter of your two posts. Can keeping it ever help?",
      "No: any pair still involving it is narrower and still capped by it. Discard it and move that pointer inward.",
    ],
    solutions: [
      {
        title: "Close in, always discarding the shorter post",
        order: 1,
        intuition:
          "Start at maximum width, then trade width for height. The key argument is about the shorter post: every remaining pair that includes it is narrower than the current one and still limited by the same height, so none of them can beat what you have already measured. That makes discarding it provably safe, which is what licenses the linear scan.",
        approach: [
          "Put pointers at both ends and track the best volume.",
          "Compute the volume as the smaller height times the distance.",
          "Move whichever pointer has the shorter post inward.",
          "Stop when the pointers meet.",
        ],
        code: {
          PYTHON: `def widestSpan(heights: List[int]) -> int:
    left, right = 0, len(heights) - 1
    best = 0

    while left < right:
        height = min(heights[left], heights[right])
        best = max(best, height * (right - left))

        # Every remaining pair using the shorter post is narrower AND still
        # capped by it, so none can beat what we just measured.
        if heights[left] < heights[right]:
            left += 1
        else:
            right -= 1

    return best`,
          JAVA: `class Solution {
    public int widestSpan(int[] heights) {
        int left = 0, right = heights.length - 1;
        int best = 0;

        while (left < right) {
            int height = Math.min(heights[left], heights[right]);
            best = Math.max(best, height * (right - left));

            if (heights[left] < heights[right]) left++;
            else right--;
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Exactly two posts.",
          "All heights zero.",
          "Equal heights, where either pointer may move.",
        ],
        commonMistakes: [
          "Moving the taller post, which can discard the optimal pair.",
          "Using the taller height in the volume calculation.",
          "Assuming the answer always involves the tallest post.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "sort-signed-squares",
    title: "Sorted Squares of a Signed Series",
    difficulty: "EASY",
    learningObjective:
      "Fill an output array from the back when the largest values are at the extremes.",
    topics: ["two-pointers", "arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A sorted series of temperature deviations can include negative values. Squaring each deviation destroys the ordering, because a large negative squares to a large positive."
      ),
      para("Return the squares in non-decreasing order, without sorting."),
      example(
        "deviations = [-4, -1, 0, 3, 10]",
        "[0, 1, 9, 16, 100]",
        [
          { state: "left=-4, right=10", note: "100 is larger → place at the end" },
          { state: "left=-4, right=3", note: "16 is larger → place next from the end" },
          { state: "left=-1, right=3", note: "9 is larger" },
        ],
        "The largest square is always at one end"
      ),
    ],
    constraints: [
      "1 ≤ deviations.length ≤ 100000",
      "deviations is sorted in non-decreasing order.",
      "-10000 ≤ deviations[i] ≤ 10000",
      "Sorting the result is not allowed.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["deviations"],
      returns: "int[]",
      functionName: "sortedSquares",
    },
    tests: [
      { input: "-4 -1 0 3 10", expected: "0 1 9 16 100", isSample: true },
      { input: "-7 -3 2 3 11", expected: "4 9 9 49 121", isSample: true },
      { input: "5", expected: "25" },
      { input: "-5", expected: "25" },
      { input: "-3 -2 -1", expected: "1 4 9" },
      { input: "1 2 3", expected: "1 4 9" },
      { input: "0 0", expected: "0 0" },
      { input: "-10000 10000", expected: "100000000 100000000" },
    ],
    hints: [
      "Squaring makes the smallest values appear in the middle and the largest at the ends.",
      "Where is the largest square guaranteed to be?",
      "At one of the two ends — whichever has the larger magnitude.",
      "So build the output backwards: take the bigger end each time and place it at the current last free slot.",
    ],
    solutions: [
      {
        title: "Fill from the back, taking the larger end",
        order: 1,
        intuition:
          "Squaring turns a monotone series into a valley: values fall to a minimum near zero and rise again. That means the *largest* square is always at one of the two ends, never in the middle — and that is the value whose position in the output you know for certain. So write the output back to front.",
        approach: [
          "Put pointers at both ends and a write index at the last output slot.",
          "Compare the two squares and take the larger.",
          "Write it at the write index and move that pointer and the write index inward.",
          "Continue until the pointers cross.",
        ],
        code: {
          PYTHON: `def sortedSquares(deviations: List[int]) -> List[int]:
    n = len(deviations)
    result = [0] * n
    left, right = 0, n - 1

    # Fill back to front: the largest square is always at one of the ends.
    for write in range(n - 1, -1, -1):
        left_sq = deviations[left] * deviations[left]
        right_sq = deviations[right] * deviations[right]

        if left_sq > right_sq:
            result[write] = left_sq
            left += 1
        else:
            result[write] = right_sq
            right -= 1

    return result`,
          JAVA: `class Solution {
    public int[] sortedSquares(int[] deviations) {
        int n = deviations.length;
        int[] result = new int[n];
        int left = 0, right = n - 1;

        for (int write = n - 1; write >= 0; write--) {
            int leftSq = deviations[left] * deviations[left];
            int rightSq = deviations[right] * deviations[right];

            if (leftSq > rightSq) {
                result[write] = leftSq;
                left++;
            } else {
                result[write] = rightSq;
                right--;
            }
        }

        return result;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n) for the output",
        edgeCases: [
          "All values negative, so the output reverses the input's squares.",
          "All values non-negative, so the order is preserved.",
          "A single element.",
          "Equal magnitudes at both ends.",
        ],
        commonMistakes: [
          "Filling from the front, which requires knowing the smallest square first — much harder to locate.",
          "Squaring then calling sort, which is O(n log n) and against the constraint.",
          "Overflowing a 16-bit type; 10000 squared needs 32 bits.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "three-sum-zero-count",
    title: "Balanced Triples",
    difficulty: "HARD",
    learningObjective:
      "Fix one element and reduce the remaining problem to a two-pointer scan, handling duplicates carefully.",
    topics: ["two-pointers", "arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A ledger holds signed adjustments. An auditor wants the number of distinct triples of values that cancel out exactly — that is, sum to zero."
      ),
      para(
        "Two triples are the same if they consist of the same three values, regardless of which positions they came from. Return the count of distinct value-triples."
      ),
      example(
        "adjustments = [-1, 0, 1, 2, -1, -4]",
        "2",
        [
          { state: "sorted", note: "[-4, -1, -1, 0, 1, 2]" },
          { state: "fix -1", note: "find 0 and 1 → (-1, 0, 1)" },
          { state: "fix -1 again", note: "same values, skipped as duplicate" },
          { state: "fix -1, pair", note: "(-1, -1, 2)" },
        ],
        "Sorting makes duplicate triples adjacent"
      ),
    ],
    constraints: [
      "0 ≤ adjustments.length ≤ 3000",
      "-100000 ≤ adjustments[i] ≤ 100000",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["adjustments"],
      returns: "int",
      functionName: "countBalancedTriples",
    },
    tests: [
      { input: "-1 0 1 2 -1 -4", expected: "2", isSample: true, explanation: "(-1,0,1) and (-1,-1,2)." },
      { input: "0 0 0 0", expected: "1", isSample: true, explanation: "Only the triple (0,0,0), counted once." },
      { input: "1 2 3", expected: "0", isSample: true },
      { input: "", expected: "0" },
      { input: "0 0 0", expected: "1" },
      { input: "-2 0 1 1 2", expected: "2" },
      { input: "-4 -2 -2 -2 0 1 2 2 2 3 3 4 4 6 6", expected: "6" },
      { input: "5 -5 0 5 -5", expected: "1" },
    ],
    hints: [
      "Three nested loops is O(n³). If you fix the first value, what is left to solve?",
      "Finding two values summing to a known target — which two pointers solves in linear time, if the data is sorted.",
      "Sort first. That also makes duplicate values adjacent, which is how you avoid counting the same triple twice.",
      "Skip a fixed value identical to the previous one, and after recording a match skip past duplicates on both pointers.",
    ],
    solutions: [
      {
        title: "Sort, fix one, two-pointer the rest",
        order: 1,
        intuition:
          "Three unknowns is one too many for two pointers, so remove one by brute force: fix the first value and ask the remaining array for a pair summing to its negation. Sorting is what makes the inner scan linear, and it does double duty — identical values become adjacent, so duplicate triples can be skipped with a simple neighbour comparison instead of a set.",
        approach: [
          "Sort the array.",
          "For each index i, skip it if it repeats the previous value.",
          "Run two pointers over the rest looking for a pair summing to -adjustments[i].",
          "On a match, count it and advance both pointers past their duplicates.",
          "Move whichever pointer the comparison condemns otherwise.",
        ],
        code: {
          PYTHON: `def countBalancedTriples(adjustments: List[int]) -> int:
    values = sorted(adjustments)
    n = len(values)
    count = 0

    for i in range(n - 2):
        # A repeated anchor would regenerate triples already counted.
        if i > 0 and values[i] == values[i - 1]:
            continue

        # Everything from here on is non-negative, so no triple can reach 0.
        if values[i] > 0:
            break

        left, right = i + 1, n - 1
        target = -values[i]

        while left < right:
            total = values[left] + values[right]
            if total == target:
                count += 1
                # Step past duplicates on both sides, or the same triple is
                # counted once per duplicated pair.
                left_value, right_value = values[left], values[right]
                while left < right and values[left] == left_value:
                    left += 1
                while left < right and values[right] == right_value:
                    right -= 1
            elif total < target:
                left += 1
            else:
                right -= 1

    return count`,
          JAVA: `class Solution {
    public int countBalancedTriples(int[] adjustments) {
        int[] values = adjustments.clone();
        Arrays.sort(values);
        int n = values.length;
        int count = 0;

        for (int i = 0; i + 2 < n; i++) {
            if (i > 0 && values[i] == values[i - 1]) continue;
            if (values[i] > 0) break;

            int left = i + 1, right = n - 1;
            int target = -values[i];

            while (left < right) {
                int total = values[left] + values[right];
                if (total == target) {
                    count++;
                    int leftValue = values[left], rightValue = values[right];
                    while (left < right && values[left] == leftValue) left++;
                    while (left < right && values[right] == rightValue) right--;
                } else if (total < target) {
                    left++;
                } else {
                    right--;
                }
            }
        }

        return count;
    }
}`,
        },
        timeComplexity: "O(n²) — n anchors, each with a linear scan",
        spaceComplexity: "O(n) for the sorted copy, or O(1) if sorting in place",
        edgeCases: [
          "Fewer than three elements.",
          "All zeroes, which must count exactly one triple.",
          "Many duplicates, where both skip loops matter.",
          "All values positive, where the early break applies.",
        ],
        commonMistakes: [
          "Skipping duplicates only on the anchor, which still double-counts through the inner pointers.",
          "Collecting triples into a set to deduplicate, which works but is slower and hides the real insight.",
          "Advancing only one pointer after a match, which finds the same pair again.",
        ],
      },
    ],
    expectedTime: "O(n²)",
    expectedSpace: "O(n)",
  },
];
