import { example, para, rich, type ProblemSeed } from "./types";

/** Array fundamentals: traversal, in-place work, prefix sums, scanning invariants. */
export const ARRAY_PROBLEMS: ProblemSeed[] = [
  {
    slug: "running-altitude",
    title: "Running Altitude",
    difficulty: "EASY",
    learningObjective:
      "Carry a running value through a single pass instead of recomputing a total at every index.",
    topics: ["arrays"],
    patterns: ["prefix-sum"],
    statement: [
      para(
        "A drone logs its altitude change after each leg of a flight. A positive value means it climbed that many metres; a negative value means it descended."
      ),
      rich(
        "The drone starts at altitude ",
        { code: "0" },
        ". Return the highest altitude it ever reaches during the flight, including the starting altitude."
      ),
      example(
        "changes = [-5, 1, 5, 0, -7]",
        "1",
        [
          { state: "0", note: "start" },
          { state: "-5", note: "after leg 1" },
          { state: "-4", note: "after leg 2" },
          { state: "1", note: "after leg 3 — highest so far" },
          { state: "1", note: "after leg 4" },
          { state: "-6", note: "after leg 5" },
        ],
        "Tracking altitude leg by leg"
      ),
    ],
    constraints: [
      "1 ≤ changes.length ≤ 100000",
      "-10000 ≤ changes[i] ≤ 10000",
      "The starting altitude of 0 counts as a candidate answer.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["changes"],
      returns: "int",
      functionName: "highestAltitude",
    },
    tests: [
      {
        input: "-5 1 5 0 -7",
        expected: "1",
        isSample: true,
        explanation: "Altitudes are 0, -5, -4, 1, 1, -6. The highest is 1.",
      },
      {
        input: "-4 -3 -2 -1 4 3 2",
        expected: "0",
        isSample: true,
        explanation:
          "The drone only descends before climbing back, so the starting altitude of 0 is never beaten.",
      },
      { input: "1 2 3", expected: "6" },
      { input: "-1", expected: "0" },
      { input: "0 0 0 0", expected: "0" },
      { input: "10000 10000 10000", expected: "30000" },
      { input: "5 -5 5 -5 5", expected: "5" },
      { input: "-10000 10000", expected: "0" },
    ],
    hints: [
      "The answer is one of the altitudes the drone actually visits. How many distinct altitudes are there?",
      "You do not need to store every altitude. What is the minimum you must remember as you walk the list?",
      "Two numbers are enough: where you are now, and the best you have seen.",
      "Initialise the best to 0, not to the first change — the starting altitude counts.",
    ],
    solutions: [
      {
        title: "Single pass with a running total",
        order: 1,
        intuition:
          "Altitude after leg i is just the sum of the first i changes. Rather than recomputing that sum for each i, carry it forward: each step adds one number. The maximum can be tracked in the same pass, so one traversal answers the question.",
        approach: [
          "Set current altitude to 0 and the best seen to 0, because the starting altitude is a valid answer.",
          "For each change, add it to the current altitude.",
          "If the new altitude beats the best, record it.",
          "Return the best after the loop.",
        ],
        code: {
          PYTHON: `def highestAltitude(changes: List[int]) -> int:
    altitude = 0
    highest = 0  # the starting altitude is itself a candidate

    for change in changes:
        altitude += change
        if altitude > highest:
            highest = altitude

    return highest`,
          JAVA: `class Solution {
    public int highestAltitude(int[] changes) {
        int altitude = 0;
        int highest = 0; // the starting altitude is itself a candidate

        for (int change : changes) {
            altitude += change;
            if (altitude > highest) {
                highest = altitude;
            }
        }

        return highest;
    }
}`,
        },
        timeComplexity: "O(n) — one pass",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Every change is negative, so the answer is the starting altitude of 0.",
          "A single leg.",
          "All zeroes.",
        ],
        commonMistakes: [
          "Initialising the best to the first altitude instead of 0, which misses flights that only ever descend.",
          "Building the full list of altitudes first — correct, but it uses O(n) memory for nothing.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "shelf-rebalance",
    title: "Shelf Rebalance",
    difficulty: "EASY",
    learningObjective:
      "Use prefix and suffix totals to answer a question about every split point in linear time.",
    topics: ["arrays"],
    patterns: ["prefix-sum"],
    statement: [
      para(
        "A librarian lines up shelves in a row, each holding some number of books. She wants to find a shelf she can stand at such that the total number of books strictly to her left equals the total strictly to her right."
      ),
      para(
        "Return the leftmost index of such a shelf, or -1 if no shelf works. The shelf she stands at is counted on neither side."
      ),
      example(
        "books = [1, 7, 3, 6, 5, 6]",
        "3",
        [
          { state: "index 0", note: "left = 0, right = 27 — no" },
          { state: "index 1", note: "left = 1, right = 20 — no" },
          { state: "index 2", note: "left = 8, right = 17 — no" },
          { state: "index 3", note: "left = 11, right = 11 — balanced" },
        ],
        "Comparing the two sides at each shelf"
      ),
    ],
    constraints: [
      "1 ≤ books.length ≤ 100000",
      "0 ≤ books[i] ≤ 1000",
      "An empty side sums to 0.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["books"],
      returns: "int",
      functionName: "balancePoint",
    },
    tests: [
      {
        input: "1 7 3 6 5 6",
        expected: "3",
        isSample: true,
        explanation: "Left of index 3 sums to 11, right of index 3 sums to 11.",
      },
      {
        input: "1 2 3",
        expected: "-1",
        isSample: true,
        explanation: "No shelf splits the rest into two equal halves.",
      },
      {
        input: "2 1 -1",
        expected: "0",
        isSample: true,
        explanation:
          "At index 0 the left side is empty (0) and the right side is 1 + (-1) = 0.",
      },
      { input: "0", expected: "0" },
      { input: "0 0 0 0", expected: "0" },
      { input: "1 0 1", expected: "1" },
      { input: "5 5", expected: "-1" },
      { input: "1 1 1 1 1 1 1", expected: "3" },
    ],
    hints: [
      "For a given shelf, what two quantities do you need to compare?",
      "Recomputing the left and right sums for every shelf is quadratic. What do the sums for shelf i and shelf i+1 have in common?",
      "If you know the total of all shelves, the right side can be derived from the left side without a second loop.",
      "right = total - left - books[i]. Now one pass is enough.",
    ],
    solutions: [
      {
        title: "Brute force: sum both sides at every index",
        order: 1,
        intuition:
          "The definition translates directly into code: for each shelf, add up everything to its left and everything to its right and compare. It is obviously correct, and just as obviously does the same additions over and over.",
        approach: [
          "For each index i, loop over 0..i-1 to compute the left sum.",
          "Loop over i+1..n-1 to compute the right sum.",
          "Return i if the two match.",
          "Return -1 after the outer loop.",
        ],
        code: {
          PYTHON: `def balancePoint(books: List[int]) -> int:
    n = len(books)
    for i in range(n):
        left = sum(books[:i])
        right = sum(books[i + 1:])
        if left == right:
            return i
    return -1`,
          JAVA: `class Solution {
    public int balancePoint(int[] books) {
        for (int i = 0; i < books.length; i++) {
            int left = 0, right = 0;
            for (int j = 0; j < i; j++) left += books[j];
            for (int j = i + 1; j < books.length; j++) right += books[j];
            if (left == right) return i;
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["A single shelf: both sides are empty, so index 0 balances."],
        commonMistakes: [
          "Including books[i] in one of the sides.",
          "Returning the last balanced index rather than the first.",
        ],
      },
      {
        title: "Optimal: one total, one pass",
        order: 2,
        intuition:
          "The two sides are not independent. Once the grand total is known, the right side is whatever the left side and the current shelf are not. That removes the inner loops entirely: carry the left sum forward as you walk.",
        approach: [
          "Compute the total of all shelves.",
          "Start with left = 0.",
          "At each index i, the right side is total - left - books[i].",
          "If left equals that value, return i.",
          "Otherwise add books[i] to left and continue.",
        ],
        code: {
          PYTHON: `def balancePoint(books: List[int]) -> int:
    total = sum(books)
    left = 0

    for i, value in enumerate(books):
        # Everything that is neither on the left nor underfoot.
        right = total - left - value
        if left == right:
            return i
        left += value

    return -1`,
          JAVA: `class Solution {
    public int balancePoint(int[] books) {
        int total = 0;
        for (int value : books) total += value;

        int left = 0;
        for (int i = 0; i < books.length; i++) {
            int right = total - left - books[i];
            if (left == right) return i;
            left += books[i];
        }

        return -1;
    }
}`,
        },
        timeComplexity: "O(n) — two passes, no nesting",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Index 0, where the left side is empty.",
          "The last index, where the right side is empty.",
          "Negative values, which the formula handles without special cases.",
        ],
        commonMistakes: [
          "Adding books[i] to left before the comparison, which shifts every check by one.",
          "Recomputing the total inside the loop, reintroducing the quadratic cost.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "compact-the-queue",
    title: "Compact the Queue",
    difficulty: "EASY",
    learningObjective:
      "Separate a read cursor from a write cursor to filter an array in place.",
    topics: ["arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A ticketing system stores queue positions in an array. Cancelled tickets are recorded as the value 0."
      ),
      rich(
        "Remove every cancelled ticket by shifting the remaining values toward the front, keeping their original relative order. Return the number of tickets that remain. Values beyond that count do not matter."
      ),
      example(
        "tickets = [3, 0, 7, 0, 0, 12]",
        "3",
        [
          { state: "[3, 0, 7, 0, 0, 12]", note: "write = 0, read 3 → keep" },
          { state: "[3, 0, 7, 0, 0, 12]", note: "write = 1, read 0 → skip" },
          { state: "[3, 7, 7, 0, 0, 12]", note: "write = 1, read 7 → keep" },
          { state: "[3, 7, 12, ...]", note: "write = 2, read 12 → keep" },
        ],
        "The write cursor only advances when a value is kept"
      ),
    ],
    constraints: [
      "0 ≤ tickets.length ≤ 100000",
      "0 ≤ tickets[i] ≤ 1000000",
      "You must not allocate a second array.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["tickets"],
      returns: "int",
      functionName: "compactQueue",
    },
    tests: [
      {
        input: "3 0 7 0 0 12",
        expected: "3",
        isSample: true,
        explanation: "The surviving tickets are 3, 7 and 12.",
      },
      {
        input: "0 0 0",
        expected: "0",
        isSample: true,
        explanation: "Every ticket was cancelled.",
      },
      { input: "", expected: "0" },
      { input: "1 2 3", expected: "3" },
      { input: "0 1", expected: "1" },
      { input: "1 0", expected: "1" },
      { input: "0 0 0 0 0 0 0 0 1", expected: "1" },
    ],
    hints: [
      "You are reading the array and writing to the array at the same time. Do those two things have to happen at the same index?",
      "Let one index scan every element. Let a second index mark where the next kept element belongs.",
      "The write index only moves when you actually keep something, so it never overtakes the read index.",
      "Because write ≤ read at all times, writing to the array can never clobber a value you have not read yet.",
    ],
    solutions: [
      {
        title: "Two cursors moving at different rates",
        order: 1,
        intuition:
          "Filtering in place looks dangerous because you are writing into the array you are reading. It is safe here because the write cursor can only fall behind the read cursor, never get ahead of it — every position written has already been consumed.",
        approach: [
          "Set write = 0.",
          "Scan the array with read.",
          "When tickets[read] is not 0, copy it to tickets[write] and advance write.",
          "Return write, which counts the kept values.",
        ],
        code: {
          PYTHON: `def compactQueue(tickets: List[int]) -> int:
    write = 0

    for value in tickets:
        if value != 0:
            tickets[write] = value
            write += 1

    # Everything from 'write' onwards is leftover and ignored by the caller.
    return write`,
          JAVA: `class Solution {
    public int compactQueue(int[] tickets) {
        int write = 0;

        for (int value : tickets) {
            if (value != 0) {
                tickets[write] = value;
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
          "No cancellations, where every write is a self-assignment.",
          "Every ticket cancelled, returning 0.",
        ],
        commonMistakes: [
          "Advancing the write cursor on every iteration rather than only on a keep.",
          "Trying to delete elements while iterating, which shifts positions underneath the loop.",
          "Zeroing the tail, which the problem does not ask for and costs another pass.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "rotate-the-roster",
    title: "Rotate the Roster",
    difficulty: "MEDIUM",
    learningObjective:
      "Compose three reversals to rotate an array in place, and see why the naive shift is quadratic.",
    topics: ["arrays"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A shift roster lists staff in rotation order. Each week the roster rotates: everyone moves k positions later, and whoever falls off the end wraps around to the front."
      ),
      rich(
        "Rotate the roster right by ",
        { code: "k" },
        " positions, in place. Return the rotated roster."
      ),
      example(
        "roster = [1, 2, 3, 4, 5, 6, 7], k = 3",
        "[5, 6, 7, 1, 2, 3, 4]",
        [
          { state: "[1,2,3,4,5,6,7]", note: "original" },
          { state: "[7,6,5,4,3,2,1]", note: "reverse everything" },
          { state: "[5,6,7,4,3,2,1]", note: "reverse the first k" },
          { state: "[5,6,7,1,2,3,4]", note: "reverse the rest" },
        ],
        "Three reversals rotate without extra memory"
      ),
    ],
    constraints: [
      "1 ≤ roster.length ≤ 100000",
      "0 ≤ k ≤ 1000000000",
      "k may be far larger than the roster length.",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["roster", "k"],
      returns: "int[]",
      functionName: "rotateRoster",
    },
    tests: [
      {
        input: "1 2 3 4 5 6 7\n3",
        expected: "5 6 7 1 2 3 4",
        isSample: true,
        explanation: "The last three move to the front.",
      },
      {
        input: "1 2\n5",
        expected: "2 1",
        isSample: true,
        explanation: "Rotating by 5 is the same as rotating by 5 mod 2 = 1.",
      },
      { input: "1\n0", expected: "1" },
      { input: "1 2 3\n3", expected: "1 2 3" },
      { input: "1 2 3 4\n1000000000", expected: "1 2 3 4" },
      { input: "1 2 3 4 5\n2", expected: "4 5 1 2 3" },
      { input: "9 8 7\n1", expected: "7 9 8" },
    ],
    hints: [
      "Rotating by the length of the array changes nothing. What does that tell you about very large k?",
      "Shifting one position at a time, k times, is O(n·k). Can you get every element to its destination in one go?",
      "Look at the answer: the last k elements appear first, in their original order, followed by the rest in their original order.",
      "Reversing the whole array puts both blocks in the right place but internally backwards. Reverse each block to fix it.",
    ],
    solutions: [
      {
        title: "Brute force: shift one position at a time",
        order: 1,
        intuition:
          "Rotating by one is easy: take the last element off and put it at the front. Doing that k times obviously works. It is also the reason this approach is too slow — each single rotation shifts every element.",
        approach: [
          "Repeat k times: remove the last element and insert it at the front.",
          "Each single rotation is O(n), so the total is O(n·k).",
        ],
        code: {
          PYTHON: `def rotateRoster(roster: List[int], k: int) -> List[int]:
    n = len(roster)
    k %= n
    for _ in range(k):
        last = roster.pop()
        roster.insert(0, last)   # O(n): every element shifts
    return roster`,
          JAVA: `class Solution {
    public int[] rotateRoster(int[] roster, int k) {
        int n = roster.length;
        k %= n;
        for (int step = 0; step < k; step++) {
            int last = roster[n - 1];
            for (int i = n - 1; i > 0; i--) roster[i] = roster[i - 1];
            roster[0] = last;
        }
        return roster;
    }
}`,
        },
        timeComplexity: "O(n·k) — too slow when k is large",
        spaceComplexity: "O(1)",
        edgeCases: ["k larger than n, which the modulo handles."],
        commonMistakes: [
          "Forgetting the modulo, so k = 1000000000 performs a billion shifts.",
        ],
      },
      {
        title: "Optimal: reverse three times",
        order: 2,
        intuition:
          "The rotated array is two blocks that have swapped places: the last k elements, then the first n-k. Reversing the entire array swaps the blocks — but also reverses the contents of each. Reversing each block afterwards undoes exactly that damage, leaving the blocks swapped and internally correct.",
        approach: [
          "Reduce k modulo n, since rotating by n is a no-op.",
          "Reverse the whole array.",
          "Reverse the first k elements.",
          "Reverse the remaining n - k elements.",
        ],
        code: {
          PYTHON: `def rotateRoster(roster: List[int], k: int) -> List[int]:
    n = len(roster)
    k %= n                      # rotating by n changes nothing
    if k == 0:
        return roster

    def reverse(lo: int, hi: int) -> None:
        while lo < hi:
            roster[lo], roster[hi] = roster[hi], roster[lo]
            lo += 1
            hi -= 1

    reverse(0, n - 1)           # blocks swap, both now backwards
    reverse(0, k - 1)           # fix the first block
    reverse(k, n - 1)           # fix the second block
    return roster`,
          JAVA: `class Solution {
    public int[] rotateRoster(int[] roster, int k) {
        int n = roster.length;
        k %= n;
        if (k == 0) return roster;

        reverse(roster, 0, n - 1);
        reverse(roster, 0, k - 1);
        reverse(roster, k, n - 1);
        return roster;
    }

    private void reverse(int[] a, int lo, int hi) {
        while (lo < hi) {
            int tmp = a[lo];
            a[lo++] = a[hi];
            a[hi--] = tmp;
        }
    }
}`,
        },
        timeComplexity: "O(n) — each element is touched exactly twice",
        spaceComplexity: "O(1)",
        edgeCases: [
          "k = 0 or k a multiple of n, where the array is unchanged.",
          "A single-element roster.",
          "k much larger than n.",
        ],
        commonMistakes: [
          "Omitting the modulo, causing out-of-range reversal boundaries.",
          "Reversing the second block from index k-1 instead of k.",
          "Rotating left instead of right — the reversal order differs.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "product-without-self",
    title: "Yield Without Self",
    difficulty: "MEDIUM",
    learningObjective:
      "Combine a prefix pass with a suffix pass to avoid both division and nested loops.",
    topics: ["arrays"],
    patterns: ["prefix-sum"],
    statement: [
      para(
        "A crop scientist measures the yield multiplier of each field in a chain of greenhouses. For each greenhouse she needs the combined multiplier of every OTHER greenhouse — the product of all values except the one at that position."
      ),
      para(
        "Return an array where position i holds the product of every value except yields[i]. Division is not allowed: a single zero multiplier would make it undefined."
      ),
      example(
        "yields = [1, 2, 3, 4]",
        "[24, 12, 8, 6]",
        [
          { state: "index 0", note: "2 × 3 × 4 = 24" },
          { state: "index 1", note: "1 × 3 × 4 = 12" },
          { state: "index 2", note: "1 × 2 × 4 = 8" },
          { state: "index 3", note: "1 × 2 × 3 = 6" },
        ],
        "Each position excludes only itself"
      ),
    ],
    constraints: [
      "2 ≤ yields.length ≤ 100000",
      "-30 ≤ yields[i] ≤ 30",
      "The answer for every position fits in a 32-bit signed integer.",
      "Division may not be used.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["yields"],
      returns: "int[]",
      functionName: "yieldWithoutSelf",
    },
    tests: [
      {
        input: "1 2 3 4",
        expected: "24 12 8 6",
        isSample: true,
        explanation: "Each entry is the product of the other three.",
      },
      {
        input: "-1 1 0 -3 3",
        expected: "0 0 9 0 0",
        isSample: true,
        explanation:
          "Only the position holding the zero escapes it; everywhere else the product includes that zero.",
      },
      { input: "2 3", expected: "3 2" },
      { input: "0 0", expected: "0 0" },
      { input: "5 0", expected: "0 5" },
      { input: "1 1 1 1", expected: "1 1 1 1" },
      { input: "-1 -1", expected: "-1 -1" },
      { input: "2 2 2 2 2", expected: "16 16 16 16 16" },
    ],
    hints: [
      "The product of everything except position i splits neatly into two halves. What are they?",
      "Everything before i, multiplied by everything after i.",
      "You can compute all the 'everything before' values in one left-to-right pass.",
      "Do a second pass right-to-left, multiplying in the suffix product as you go — the output array can hold the prefix products in the meantime.",
    ],
    solutions: [
      {
        title: "Prefix pass, then suffix pass",
        order: 1,
        intuition:
          "Excluding one element means multiplying everything on its left by everything on its right. Both of those are running products, so each can be built in a single sweep. Storing the prefix products directly in the output array means the second sweep needs only one extra variable.",
        approach: [
          "Allocate the result array.",
          "Sweep left to right, writing into result[i] the product of everything strictly before i.",
          "Sweep right to left with a running suffix product, multiplying it into result[i] and then folding yields[i] into the suffix.",
          "Return the result.",
        ],
        code: {
          PYTHON: `def yieldWithoutSelf(yields: List[int]) -> List[int]:
    n = len(yields)
    result = [1] * n

    # Pass 1: result[i] = product of everything strictly left of i.
    prefix = 1
    for i in range(n):
        result[i] = prefix
        prefix *= yields[i]

    # Pass 2: fold in the product of everything strictly right of i.
    suffix = 1
    for i in range(n - 1, -1, -1):
        result[i] *= suffix
        suffix *= yields[i]

    return result`,
          JAVA: `class Solution {
    public int[] yieldWithoutSelf(int[] yields) {
        int n = yields.length;
        int[] result = new int[n];

        int prefix = 1;
        for (int i = 0; i < n; i++) {
            result[i] = prefix;
            prefix *= yields[i];
        }

        int suffix = 1;
        for (int i = n - 1; i >= 0; i--) {
            result[i] *= suffix;
            suffix *= yields[i];
        }

        return result;
    }
}`,
        },
        timeComplexity: "O(n) — two passes",
        spaceComplexity: "O(1) extra, not counting the output array",
        edgeCases: [
          "Exactly one zero: only that position gets a non-zero answer.",
          "Two or more zeroes: every answer is zero, which falls out naturally.",
          "Negative values, where the sign must be preserved.",
        ],
        commonMistakes: [
          "Computing the total product and dividing, which breaks on any zero.",
          "Writing result[i] after updating the running product, shifting everything by one position.",
          "Counting the output array against the space budget; by convention it does not count.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1) excluding output",
  },

  {
    slug: "warmest-day-ahead",
    title: "Warmest Day Ahead",
    difficulty: "MEDIUM",
    learningObjective:
      "Recognise that a stack can answer 'next greater element' for every position in one pass.",
    topics: ["arrays", "stacks"],
    patterns: ["monotonic-stack"],
    statement: [
      para(
        "A weather service publishes a list of daily temperatures. For each day, readers want to know how many days they must wait until it gets warmer than that day."
      ),
      para(
        "Return an array where position i holds the number of days to wait after day i for a strictly warmer temperature. If no later day is warmer, put 0."
      ),
      example(
        "temps = [30, 38, 36, 35, 37, 40]",
        "[1, 4, 2, 1, 1, 0]",
        [
          { state: "day 0 (30)", note: "day 1 is warmer → wait 1" },
          { state: "day 1 (38)", note: "next warmer is day 5 → wait 4" },
          { state: "day 2 (36)", note: "day 4 is warmer → wait 2" },
          { state: "day 5 (40)", note: "nothing warmer follows → 0" },
        ],
        "Each day looks forward to the first warmer one"
      ),
    ],
    constraints: [
      "1 ≤ temps.length ≤ 100000",
      "-50 ≤ temps[i] ≤ 60",
      "Warmer means strictly greater.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["temps"],
      returns: "int[]",
      functionName: "daysUntilWarmer",
    },
    tests: [
      {
        input: "30 38 36 35 37 40",
        expected: "1 4 2 1 1 0",
        isSample: true,
        explanation: "Day 1 waits four days for day 5's 40 degrees.",
      },
      {
        input: "40 39 38",
        expected: "0 0 0",
        isSample: true,
        explanation: "Temperatures only fall, so no day ever gets warmer.",
      },
      { input: "20", expected: "0" },
      { input: "20 20 20", expected: "0 0 0" },
      { input: "20 21", expected: "1 0" },
      { input: "-50 60", expected: "1 0" },
      { input: "10 9 8 7 11", expected: "4 3 2 1 0" },
      { input: "5 5 6", expected: "2 1 0" },
    ],
    hints: [
      "Comparing every day with every later day is O(n²). What information are you re-deriving each time?",
      "When you read a new temperature, which earlier days does it answer for?",
      "Keep the days that are still waiting. A new warmer day resolves all of the waiting days colder than it.",
      "Hold the waiting days on a stack. Their temperatures stay in decreasing order, so the ones a new day resolves are all on top.",
    ],
    solutions: [
      {
        title: "Brute force: scan forward from every day",
        order: 1,
        intuition:
          "Straight from the definition: for each day, walk forward until a warmer day appears. Correct, and quadratic on a long descending run followed by a spike.",
        approach: [
          "For each index i, scan j from i+1 forward.",
          "Stop at the first j with a greater temperature and record j - i.",
          "Record 0 if the scan reaches the end.",
        ],
        code: {
          PYTHON: `def daysUntilWarmer(temps: List[int]) -> List[int]:
    n = len(temps)
    answer = [0] * n
    for i in range(n):
        for j in range(i + 1, n):
            if temps[j] > temps[i]:
                answer[i] = j - i
                break
    return answer`,
          JAVA: `class Solution {
    public int[] daysUntilWarmer(int[] temps) {
        int n = temps.length;
        int[] answer = new int[n];
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (temps[j] > temps[i]) {
                    answer[i] = j - i;
                    break;
                }
            }
        }
        return answer;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1) extra",
        edgeCases: ["A strictly decreasing list, which is the worst case."],
        commonMistakes: ["Using >= and treating an equal temperature as warmer."],
      },
      {
        title: "Optimal: a decreasing stack of unresolved days",
        order: 2,
        intuition:
          "A day is only interesting while it is still waiting for an answer. Keep those days on a stack. Because any day warmer than the one below it would already have resolved that day, the temperatures on the stack are always decreasing. When a new warmer day arrives, every day it resolves is sitting on top, ready to be popped.",
        approach: [
          "Keep a stack of indices whose answers are still unknown.",
          "For each new day, pop every index whose temperature is lower and write the gap into its answer.",
          "Push the new index.",
          "Indices left on the stack at the end never get warmer, so they keep 0.",
        ],
        code: {
          PYTHON: `def daysUntilWarmer(temps: List[int]) -> List[int]:
    answer = [0] * len(temps)
    waiting = []   # indices; their temperatures are strictly decreasing

    for day, temp in enumerate(temps):
        # This day resolves every cooler day still waiting.
        while waiting and temps[waiting[-1]] < temp:
            earlier = waiting.pop()
            answer[earlier] = day - earlier
        waiting.append(day)

    # Anything still waiting never warms up, and keeps its 0.
    return answer`,
          JAVA: `class Solution {
    public int[] daysUntilWarmer(int[] temps) {
        int[] answer = new int[temps.length];
        Deque<Integer> waiting = new ArrayDeque<>();

        for (int day = 0; day < temps.length; day++) {
            while (!waiting.isEmpty() && temps[waiting.peek()] < temps[day]) {
                int earlier = waiting.pop();
                answer[earlier] = day - earlier;
            }
            waiting.push(day);
        }

        return answer;
    }
}`,
        },
        timeComplexity: "O(n) amortised — each index is pushed and popped once",
        spaceComplexity: "O(n) for the stack",
        edgeCases: [
          "Equal temperatures, which must not resolve each other.",
          "A strictly increasing list, where the stack never holds more than one index.",
          "A strictly decreasing list, where nothing is ever popped.",
        ],
        commonMistakes: [
          "Storing temperatures instead of indices, making the day gap impossible to compute.",
          "Using <= in the pop condition, which wrongly treats an equal day as warmer.",
          "Assuming the inner while loop makes this quadratic; each index leaves the stack at most once.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "best-single-trade",
    title: "Best Single Trade",
    difficulty: "EASY",
    learningObjective:
      "Track the best option seen so far so that a pairwise search collapses into one pass.",
    topics: ["arrays"],
    patterns: ["greedy"],
    statement: [
      para(
        "A commodity's price is recorded once per day. You may buy on one day and sell on a strictly later day, at most once."
      ),
      para(
        "Return the largest profit achievable. If no pair of days yields a profit, return 0."
      ),
      example(
        "prices = [7, 1, 5, 3, 6, 4]",
        "5",
        [
          { state: "day 0 (7)", note: "cheapest so far = 7, profit 0" },
          { state: "day 1 (1)", note: "cheapest so far = 1" },
          { state: "day 2 (5)", note: "sell at 5 → profit 4" },
          { state: "day 4 (6)", note: "sell at 6 → profit 5, the best" },
        ],
        "Only the cheapest day so far can matter"
      ),
    ],
    constraints: [
      "1 ≤ prices.length ≤ 100000",
      "0 ≤ prices[i] ≤ 100000",
      "The sell day must come strictly after the buy day.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["prices"],
      returns: "int",
      functionName: "bestTrade",
    },
    tests: [
      {
        input: "7 1 5 3 6 4",
        expected: "5",
        isSample: true,
        explanation: "Buy at 1 on day 1, sell at 6 on day 4.",
      },
      {
        input: "7 6 4 3 1",
        expected: "0",
        isSample: true,
        explanation: "Prices only fall, so no trade is profitable.",
      },
      { input: "5", expected: "0" },
      { input: "1 2", expected: "1" },
      { input: "2 1", expected: "0" },
      { input: "3 3 3", expected: "0" },
      { input: "0 100000", expected: "100000" },
      { input: "2 4 1 7", expected: "6" },
    ],
    hints: [
      "For a fixed sell day, which buy day gives the most profit?",
      "The cheapest day anywhere before it — nothing else can beat it.",
      "So as you walk forward you only need one number from the past.",
      "Keep the minimum price seen so far, and at each day compute today's price minus that minimum.",
    ],
    solutions: [
      {
        title: "One pass, remembering the cheapest day",
        order: 1,
        intuition:
          "Checking every buy/sell pair is quadratic, but most of those pairs are pointless: for any sell day, the only buy day worth considering is the cheapest one before it. That single number is all the history you need to carry.",
        approach: [
          "Track the minimum price seen so far, starting at the first day's price.",
          "For each subsequent day, the best profit selling today is price - minimum.",
          "Keep the largest such profit.",
          "Update the minimum if today is cheaper.",
        ],
        code: {
          PYTHON: `def bestTrade(prices: List[int]) -> int:
    if not prices:
        return 0

    cheapest = prices[0]
    best = 0

    for price in prices[1:]:
        # Selling today is only worth what today beats the cheapest past day by.
        best = max(best, price - cheapest)
        cheapest = min(cheapest, price)

    return best`,
          JAVA: `class Solution {
    public int bestTrade(int[] prices) {
        if (prices.length == 0) return 0;

        int cheapest = prices[0];
        int best = 0;

        for (int i = 1; i < prices.length; i++) {
            best = Math.max(best, prices[i] - cheapest);
            cheapest = Math.min(cheapest, prices[i]);
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A single day, where no trade is possible.",
          "Monotonically falling prices, returning 0.",
          "All equal prices.",
        ],
        commonMistakes: [
          "Updating the minimum before computing the profit, which allows buying and selling on the same day.",
          "Initialising the best profit to a negative number and returning it, when the problem requires 0.",
          "Tracking the maximum price instead and subtracting the global minimum, which can put the sell before the buy.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "strongest-window-average",
    title: "Strongest Signal Window",
    difficulty: "EASY",
    learningObjective:
      "Slide a fixed-width window by adding one element and dropping another, instead of re-summing.",
    topics: ["arrays"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A sensor records a signal strength reading every second. Analysts want the strongest sustained burst: the highest total across any run of exactly k consecutive readings."
      ),
      rich("Return that maximum total. You may assume ", { code: "k" }, " is no larger than the number of readings."),
      example(
        "readings = [2, 1, 5, 1, 3, 2], k = 3",
        "9",
        [
          { state: "[2,1,5] 1 3 2", note: "sum = 8" },
          { state: "2 [1,5,1] 3 2", note: "sum = 7" },
          { state: "2 1 [5,1,3] 2", note: "sum = 9 — best" },
          { state: "2 1 5 [1,3,2]", note: "sum = 6" },
        ],
        "Each slide costs one addition and one subtraction"
      ),
    ],
    constraints: [
      "1 ≤ k ≤ readings.length ≤ 100000",
      "-10000 ≤ readings[i] ≤ 10000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["readings", "k"],
      returns: "int",
      functionName: "strongestWindow",
    },
    tests: [
      {
        input: "2 1 5 1 3 2\n3",
        expected: "9",
        isSample: true,
        explanation: "The window [5, 1, 3] totals 9.",
      },
      {
        input: "-1 -2 -3\n2",
        expected: "-3",
        isSample: true,
        explanation:
          "Every window is negative; the least negative pair is [-1, -2].",
      },
      { input: "4\n1", expected: "4" },
      { input: "1 2 3 4 5\n5", expected: "15" },
      { input: "5 4 3 2 1\n1", expected: "5" },
      { input: "0 0 0 0\n2", expected: "0" },
      { input: "10000 -10000 10000\n2", expected: "0" },
    ],
    hints: [
      "Summing each window from scratch costs O(n·k). How much do two neighbouring windows have in common?",
      "They share all but two elements: one leaves on the left, one joins on the right.",
      "So a slide is one subtraction and one addition, regardless of k.",
      "Build the first window's sum directly, then slide.",
    ],
    solutions: [
      {
        title: "Fixed-width sliding window",
        order: 1,
        intuition:
          "Neighbouring windows overlap in k-1 positions. Recomputing that shared part is pure waste. Compute the first window once, then maintain it: whatever leaves the left edge is subtracted, whatever enters the right edge is added.",
        approach: [
          "Sum the first k readings to seed the window.",
          "Record that as the best so far.",
          "For each subsequent position, add the entering element and subtract the leaving one.",
          "Track the maximum.",
        ],
        code: {
          PYTHON: `def strongestWindow(readings: List[int], k: int) -> int:
    total = sum(readings[:k])
    best = total

    for right in range(k, len(readings)):
        # One element joins on the right, one leaves on the left.
        total += readings[right] - readings[right - k]
        if total > best:
            best = total

    return best`,
          JAVA: `class Solution {
    public int strongestWindow(int[] readings, int k) {
        int total = 0;
        for (int i = 0; i < k; i++) total += readings[i];

        int best = total;
        for (int right = k; right < readings.length; right++) {
            total += readings[right] - readings[right - k];
            if (total > best) best = total;
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "k equal to the array length, so there is exactly one window.",
          "All negative readings, where the answer is negative.",
          "k = 1, which reduces to finding the maximum element.",
        ],
        commonMistakes: [
          "Initialising the best to 0, which is wrong when every window is negative.",
          "Subtracting readings[right - k + 1], an off-by-one that drops the wrong element.",
          "Rebuilding the sum inside the loop, keeping the cost at O(n·k).",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },
];
