import type { QuestionType } from "@/generated/prisma/enums";

/**
 * Quiz content.
 *
 * Every question is written to catch a specific misunderstanding rather than
 * to test recall. The explanation is shown whether the answer was right or
 * wrong, because a correct guess and correct understanding look identical
 * from the outside.
 *
 * `answer` never reaches the client before submission — the quiz service
 * strips it, and scoring happens on the server.
 */

export type QuizOptionSeed = { id: string; text: string };

export type QuizQuestionSeed = {
  type: QuestionType;
  prompt: string;
  /** Snippet shown above the options, for CODE_OUTPUT questions. */
  code?: string;
  options: QuizOptionSeed[];
  /** Option id, or array of ids for MULTI_SELECT. */
  answer: string | string[];
  explanation: string;
  points?: number;
};

export type QuizSeed = {
  slug: string;
  title: string;
  description?: string;
  /** Chapter slug this quiz belongs to. */
  chapterSlug: string;
  passScore?: number;
  questions: QuizQuestionSeed[];
};

const TF = (yes: string, no: string): QuizOptionSeed[] => [
  { id: "a", text: yes },
  { id: "b", text: no },
];

export const QUIZZES: QuizSeed[] = [
  {
    slug: "complexity-basics",
    title: "Why complexity matters",
    chapterSlug: "why-complexity-matters",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "Function A takes 2 ms on 1,000 items and grows linearly. Function B takes 1 ms on 1,000 items and grows quadratically. Which should you prefer for an input of one million items?",
        options: [
          { id: "a", text: "A, because linear growth wins at scale" },
          { id: "b", text: "B, because it is faster on the measured input" },
          { id: "c", text: "Neither — you cannot tell without measuring" },
          { id: "d", text: "They will perform the same" },
        ],
        answer: "a",
        explanation:
          "B's advantage at 1,000 items is a constant factor. A's advantage is structural: at a million items A takes about 2 seconds while B takes about 17 minutes. Constant factors stop mattering; growth rates never do.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "A problem states that n can be up to 200,000. Which complexity is the slowest that will comfortably fit a one-second budget?",
        options: [
          { id: "a", text: "O(n²)" },
          { id: "b", text: "O(n log n)" },
          { id: "c", text: "O(2ⁿ)" },
          { id: "d", text: "O(n³)" },
        ],
        answer: "b",
        explanation:
          "At n = 200,000, O(n²) is 4 × 10¹⁰ operations — far too slow. O(n log n) is around 3.5 million, which is comfortable. Constraints are the interviewer telling you which complexities are acceptable.",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "A solution written in fewer lines of code necessarily does less work.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "A one-line comprehension that scans the whole array is still a linear scan, and a one-line sort is still O(n log n). Brevity describes the source, not the operation count.",
      },
    ],
  },

  {
    slug: "big-o-notation",
    title: "Reading Big O",
    chapterSlug: "big-o-notation",
    questions: [
      {
        type: "COMPLEXITY",
        prompt: "Simplify T(n) = 4n² + 30n + 900 to Big O notation.",
        options: [
          { id: "a", text: "O(4n²)" },
          { id: "b", text: "O(n² + n)" },
          { id: "c", text: "O(n²)" },
          { id: "d", text: "O(n² + 900)" },
        ],
        answer: "c",
        explanation:
          "Drop the constant multipliers and every term except the fastest-growing one. 4n² + 30n + 900 becomes O(n²). Keeping the 4 or the 900 is not wrong mathematically, but it is not simplified.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "An algorithm is described simply as O(n). Which case does that describe by convention?",
        options: [
          { id: "a", text: "Best case" },
          { id: "b", text: "Average case" },
          { id: "c", text: "Worst case" },
          { id: "d", text: "Whichever the author measured" },
        ],
        answer: "c",
        explanation:
          "Unqualified complexity means the worst case, because that is the only figure you can promise. Best-case figures are usually meaningless — every search is O(1) if the answer happens to be first.",
      },
      {
        type: "CODE_OUTPUT",
        prompt: "What is the time complexity of this function?",
        code: `def build(chars):
    out = ""
    for char in chars:
        out += char
    return out`,
        options: [
          { id: "a", text: "O(n)" },
          { id: "b", text: "O(n²)" },
          { id: "c", text: "O(n log n)" },
          { id: "d", text: "O(1)" },
        ],
        answer: "b",
        explanation:
          "Strings are immutable, so each += allocates a new string and copies everything accumulated so far. The loop runs n times and the i-th iteration copies i characters, which totals n²/2. One visible loop, quadratic cost.",
      },
    ],
  },

  {
    slug: "growth-rates",
    title: "Recognising growth rates",
    chapterSlug: "common-growth-rates",
    questions: [
      {
        type: "COMPLEXITY",
        prompt: "What is the complexity of this function?",
        code: `def suspicious(nums):
    for value in nums:
        if value in nums:
            pass`,
        options: [
          { id: "a", text: "O(n)" },
          { id: "b", text: "O(n²)" },
          { id: "c", text: "O(log n)" },
          { id: "d", text: "O(n log n)" },
        ],
        answer: "b",
        explanation:
          "There is one visible loop, but `value in nums` scans the whole list on every iteration, so the real count is n × n. Complexity must be read in terms of operations performed, not loops written.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "Roughly how many times can you halve 1,000,000 before reaching 1?",
        options: [
          { id: "a", text: "About 20" },
          { id: "b", text: "About 1,000" },
          { id: "c", text: "About 500,000" },
          { id: "d", text: "About 100" },
        ],
        answer: "a",
        explanation:
          "log₂(1,000,000) ≈ 20. This is why binary search feels almost free: doubling the data adds a single step.",
      },
      {
        type: "TRUE_FALSE",
        prompt: "Two loops one after another make an algorithm quadratic.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "Sequential loops add: n + n = 2n, which is O(n). Nesting multiplies: n × n = O(n²). The difference is whether the second loop runs once per element of the first, or once in total.",
      },
    ],
  },

  {
    slug: "space-complexity",
    title: "Counting memory",
    chapterSlug: "space-complexity",
    questions: [
      {
        type: "COMPLEXITY",
        prompt: "What is the space complexity of this function?",
        code: `def sum_to(n):
    if n == 0:
        return 0
    return n + sum_to(n - 1)`,
        options: [
          { id: "a", text: "O(1) — it allocates nothing" },
          { id: "b", text: "O(n) — the call stack" },
          { id: "c", text: "O(log n)" },
          { id: "d", text: "O(n²)" },
        ],
        answer: "b",
        explanation:
          "No data structure is allocated, but n call frames are alive at the deepest point, each holding its parameter and return address. Recursion depth is memory, and it is why this crashes on a large n while an identical loop would not.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "A function returns a new array of the same length as its input and uses two loop counters. What is its auxiliary space complexity?",
        options: [
          { id: "a", text: "O(n), because of the returned array" },
          { id: "b", text: "O(1), because the output is not counted" },
          { id: "c", text: "O(n²)" },
          { id: "d", text: "O(log n)" },
        ],
        answer: "b",
        explanation:
          "By convention, auxiliary space excludes both the input you were given and the output you were obliged to produce. Only the two counters count, which is O(1).",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "Spending O(n) memory to turn an O(n²) algorithm into an O(n) one is usually a good trade.",
        options: TF("True", "False"),
        answer: "a",
        explanation:
          "Almost always. Removing a factor of n from the running time for a linear amount of memory is the single most common improvement in this curriculum. The reverse trade — lots of memory to save a constant factor — rarely is.",
      },
    ],
  },

  {
    slug: "array-basics",
    title: "How arrays behave",
    chapterSlug: "what-is-an-array",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Why is reading arr[500000] as fast as reading arr[0]?",
        options: [
          { id: "a", text: "The array is cached in memory" },
          { id: "b", text: "The address is computed arithmetically from the index" },
          { id: "c", text: "Arrays are sorted internally" },
          { id: "d", text: "It is not — later indices are slower" },
        ],
        answer: "b",
        explanation:
          "Elements are equally sized and contiguous, so the address is start + i × size: one multiplication and one addition. Nothing is searched, which is why the index does not matter.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Why is appending to a dynamic array O(1) amortised rather than O(1)?",
        options: [
          { id: "a", text: "Because appending occasionally triggers a resize and copy" },
          { id: "b", text: "Because the array must be re-sorted" },
          { id: "c", text: "Because memory allocation is always slow" },
          { id: "d", text: "It is genuinely O(1) with no caveat" },
        ],
        answer: "a",
        explanation:
          "When the capacity fills, a larger block is allocated and everything copied — an O(n) step. Because capacity doubles, that happens rarely enough that the average cost per append stays constant.",
      },
      {
        type: "TRUE_FALSE",
        prompt: "Removing items from a list while iterating forward over it is safe.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "Each removal shifts the remaining elements left, so the loop index skips the element that moved into the vacated slot. Iterate backwards, build a new list, or use a write pointer.",
      },
    ],
  },

  {
    slug: "prefix-sums",
    title: "Prefix sums",
    chapterSlug: "prefix-sums",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "With prefix[0] = 0 and prefix[i] holding the sum of the first i elements, what is the inclusive sum of nums[i..j]?",
        options: [
          { id: "a", text: "prefix[j] - prefix[i]" },
          { id: "b", text: "prefix[j + 1] - prefix[i]" },
          { id: "c", text: "prefix[j] - prefix[i - 1]" },
          { id: "d", text: "prefix[j + 1] - prefix[i + 1]" },
        ],
        answer: "b",
        explanation:
          "prefix[j + 1] covers elements 0..j and prefix[i] covers 0..i-1, so the difference is exactly i..j. The leading zero is what makes this work without a special case for i = 0.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "When counting subarrays with a target sum using a running total and a frequency map, why must the map start as {0: 1}?",
        options: [
          { id: "a", text: "To avoid a division by zero" },
          { id: "b", text: "To represent the empty prefix, so subarrays starting at index 0 are counted" },
          { id: "c", text: "To handle negative numbers" },
          { id: "d", text: "It is an optimisation and can be omitted" },
        ],
        answer: "b",
        explanation:
          "A subarray starting at index 0 needs a prior running total of 0 to subtract against. Without the seed that total has never been recorded, and every such subarray is silently missed.",
      },
      {
        type: "TRUE_FALSE",
        prompt: "A prefix array can answer range maximum queries the same way it answers range sums.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "The technique relies on the operation having an inverse: subtraction undoes addition. There is no way to 'subtract' a maximum out of a running maximum, so range maxima need a different structure such as a sparse table or segment tree.",
      },
    ],
  },

  {
    slug: "string-basics",
    title: "Strings and immutability",
    chapterSlug: "string-traversal",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What is the right way to build a long string in a loop?",
        options: [
          { id: "a", text: "Repeated += concatenation" },
          { id: "b", text: "Collect the pieces and join once at the end" },
          { id: "c", text: "Use recursion" },
          { id: "d", text: "Preallocate with spaces and overwrite" },
        ],
        answer: "b",
        explanation:
          "Concatenation allocates and copies each time, making the loop quadratic. Collecting pieces in a list or StringBuilder and joining once is linear.",
      },
      {
        type: "TRUE_FALSE",
        prompt: "Taking a substring is always an O(1) operation.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "In most languages a slice copies the characters, so it is O(k) in the length of the slice. Slicing inside a loop is a common accidental quadratic; use indices instead when you only need to compare a range.",
      },
    ],
  },

  {
    slug: "strings-and-symmetry",
    title: "Substrings, subsequences and symmetry",
    chapterSlug: "palindromes-and-substrings",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "A problem asks for the longest subsequence with a property. Why is a sliding window the wrong tool?",
        options: [
          { id: "a", text: "Windows only work on numbers" },
          { id: "b", text: "A subsequence need not be contiguous, so a window cannot represent it" },
          { id: "c", text: "Subsequences are always shorter" },
          { id: "d", text: "It is the right tool" },
        ],
        answer: "b",
        explanation:
          "A window is a contiguous range by definition. Subsequences allow gaps, so a window cannot express a candidate — those problems are usually dynamic programming.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "How many centres must you consider to find every palindromic substring by expansion?",
        options: [
          { id: "a", text: "n" },
          { id: "b", text: "2n − 1" },
          { id: "c", text: "n²" },
          { id: "d", text: "log n" },
        ],
        answer: "b",
        explanation:
          "There are n single-character centres for odd-length palindromes and n − 1 gaps between characters for even-length ones. Checking only the n character centres misses every even-length palindrome, including \"ABBA\".",
      },
    ],
  },

  {
    slug: "hash-tables",
    title: "Hash tables",
    chapterSlug: "maps-and-sets",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Hash table lookup is described as O(1) expected. What does 'expected' guard against?",
        options: [
          { id: "a", text: "Running out of memory" },
          { id: "b", text: "Collisions, which can degrade a lookup to O(n)" },
          { id: "c", text: "Keys being unsorted" },
          { id: "d", text: "The table being empty" },
        ],
        answer: "b",
        explanation:
          "When several keys land in the same bucket, that bucket must be scanned. With a good hash and a sensible load factor this is rare, but in the pathological case every key collides and lookup becomes linear.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "You need to know whether a value repeated within the last k positions. Which structure is appropriate?",
        options: [
          { id: "a", text: "A set of seen values" },
          { id: "b", text: "A map from value to its most recent index" },
          { id: "c", text: "A sorted array" },
          { id: "d", text: "A stack" },
        ],
        answer: "b",
        explanation:
          "A set answers 'have I seen this' but discards position, and the question is about distance. Storing the most recent index answers both at once.",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "When the keys are the 26 lowercase letters, a fixed array of counters is usually better than a hash map.",
        options: TF("True", "False"),
        answer: "a",
        explanation:
          "A dense, small key space needs no hashing at all: index directly by value. It is faster, uses less memory, and is what lets many string solutions claim O(1) space.",
      },
    ],
  },

  {
    slug: "two-pointers",
    title: "Two pointers",
    chapterSlug: "two-pointer-fundamentals",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "In a sorted array you look for a pair summing to a target. The two ends sum to less than the target. Which element is now provably useless?",
        options: [
          { id: "a", text: "The larger one, at the right pointer" },
          { id: "b", text: "The smaller one, at the left pointer" },
          { id: "c", text: "The middle element" },
          { id: "d", text: "None — you must check both" },
        ],
        answer: "b",
        explanation:
          "The smallest remaining value is already paired with the largest available partner and still falls short. No other partner can do better, so it can be discarded permanently. That elimination is what makes the scan linear.",
      },
      {
        type: "CODE_OUTPUT",
        prompt: "What bug does this loop condition introduce?",
        code: `left, right = 0, len(nums) - 1
while left <= right:
    ...`,
        options: [
          { id: "a", text: "It skips the last element" },
          { id: "b", text: "It allows an element to pair with itself" },
          { id: "c", text: "It never terminates" },
          { id: "d", text: "No bug" },
        ],
        answer: "b",
        explanation:
          "When left == right both pointers reference the same element, so a target of twice that value produces a false match. Use `while left < right` when the two must be distinct.",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "Two pointers can be applied to any array, sorted or not, as long as you use two indices.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "The technique is only correct when each step eliminates a candidate for good, which requires the condition to change monotonically as a pointer moves. On unsorted input there is no basis for deciding which pointer to move.",
      },
    ],
  },

  {
    slug: "sliding-window",
    title: "Sliding window",
    chapterSlug: "variable-windows",
    questions: [
      {
        type: "CODE_OUTPUT",
        prompt: "What goes wrong if the shrink step uses `if` instead of `while`?",
        code: `for right, value in enumerate(items):
    add(state, value)
    if not is_valid(state):     # should be 'while'
        remove(state, items[left])
        left += 1`,
        options: [
          { id: "a", text: "Nothing — one removal is always enough" },
          { id: "b", text: "The window can stay invalid when one arrival requires several removals" },
          { id: "c", text: "The loop never terminates" },
          { id: "d", text: "The window shrinks too far" },
        ],
        answer: "b",
        explanation:
          "A single new element can push the window out of validity by more than one. `if` removes exactly one element and then records a width for a window that is still invalid.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "Why is the variable window linear despite having a loop inside a loop?",
        options: [
          { id: "a", text: "The inner loop runs at most a constant number of times" },
          { id: "b", text: "The left edge only moves forward, so it advances at most n times in total" },
          { id: "c", text: "The window size is bounded" },
          { id: "d", text: "It is actually quadratic" },
        ],
        answer: "b",
        explanation:
          "This is an amortised argument. The inner loop may run many times in one iteration, but across the whole scan the left edge cannot advance more than n times, so both loops together do O(n) work.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "In a covering-window problem, when should the 'satisfied requirements' counter be incremented?",
        options: [
          { id: "a", text: "Every time a required character is added" },
          { id: "b", text: "Only when a character's count exactly reaches its requirement" },
          { id: "c", text: "Once, when the window first becomes valid" },
          { id: "d", text: "When the window shrinks" },
        ],
        answer: "b",
        explanation:
          "Incrementing on every match counts surplus copies, so the counter overshoots and the window never compares equal to the number of distinct requirements. Only the exact crossing point represents a newly satisfied requirement.",
      },
    ],
  },

  {
    slug: "binary-search",
    title: "Binary search",
    chapterSlug: "binary-search-fundamentals",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "Why is the midpoint written as lo + (hi - lo) / 2 rather than (lo + hi) / 2?",
        options: [
          { id: "a", text: "It is faster" },
          { id: "b", text: "lo + hi can overflow a fixed-width integer" },
          { id: "c", text: "It rounds differently" },
          { id: "d", text: "It avoids division by zero" },
        ],
        answer: "b",
        explanation:
          "In Java, C++ or Go, lo + hi can exceed the integer range when both are large, producing a negative midpoint. lo + (hi - lo) / 2 is mathematically identical and cannot overflow.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt:
          "Searching for the FIRST index satisfying a predicate, the midpoint satisfies it. What should happen?",
        options: [
          { id: "a", text: "Return mid immediately" },
          { id: "b", text: "Set hi = mid, keeping mid as a candidate" },
          { id: "c", text: "Set hi = mid - 1" },
          { id: "d", text: "Set lo = mid + 1" },
        ],
        answer: "b",
        explanation:
          "Mid satisfies the predicate but something earlier might too, so it must stay in the range. Returning immediately finds some match, not the first; `hi = mid - 1` discards a possible answer.",
      },
      {
        type: "TRUE_FALSE",
        prompt: "Binary search requires a sorted array.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "It requires a monotonic predicate, which a sorted array is only one source of. Searching the space of candidate answers — 'what is the smallest capacity that works?' — needs no array at all.",
      },
    ],
  },

  {
    slug: "linked-lists",
    title: "Linked lists",
    chapterSlug: "insertion-deletion-reversal",
    questions: [
      {
        type: "CODE_OUTPUT",
        prompt: "What does this reversal return?",
        code: `def reverse(head):
    prev = None
    node = head
    while node is not None:
        nxt = node.next
        node.next = prev
        prev = node
        node = nxt
    return head`,
        options: [
          { id: "a", text: "The correctly reversed list" },
          { id: "b", text: "A single node — the original head, now the tail" },
          { id: "c", text: "None" },
          { id: "d", text: "The original list, unchanged" },
        ],
        answer: "b",
        explanation:
          "The reversal itself is correct, but `head` now points at the last node of the reversed list, whose next is null. The new head is `prev`.",
      },
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What problem does a dummy head node solve?",
        options: [
          { id: "a", text: "It makes the list circular" },
          { id: "b", text: "It removes the special case for operations affecting the first node" },
          { id: "c", text: "It speeds up traversal" },
          { id: "d", text: "It stores the list length" },
        ],
        answer: "b",
        explanation:
          "Without it, removing or inserting at the head needs its own branch because there is no preceding node. A dummy gives every node a predecessor, so the general code covers the first node too.",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "In Floyd's cycle detection you should compare the two pointers by value.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "Compare node identity. Two distinct nodes can hold the same value, and comparing values would report a cycle in a perfectly linear list containing duplicates.",
      },
    ],
  },

  {
    slug: "monotonic-stack",
    title: "The monotonic stack",
    chapterSlug: "monotonic-stack",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "In a next-greater-element scan, at which moment is an element's answer discovered?",
        options: [
          { id: "a", text: "When it is pushed onto the stack" },
          { id: "b", text: "When it is popped, because the element causing the pop is its answer" },
          { id: "c", text: "At the end of the scan" },
          { id: "d", text: "When the stack becomes empty" },
        ],
        answer: "b",
        explanation:
          "Popping is the discovery event, not cleanup. An element is popped precisely because something greater arrived, and that arrival is its next greater element.",
      },
      {
        type: "COMPLEXITY",
        prompt:
          "A monotonic stack scan has a while loop inside a for loop. What is its complexity?",
        options: [
          { id: "a", text: "O(n²)" },
          { id: "b", text: "O(n) amortised" },
          { id: "c", text: "O(n log n)" },
          { id: "d", text: "O(log n)" },
        ],
        answer: "b",
        explanation:
          "Each index is pushed exactly once and popped at most once, so the inner loop cannot run more than n times in total across the whole scan, regardless of how many times it runs in any single iteration.",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "It is usually better to store values on a monotonic stack than indices.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "Store indices. The value is one lookup away, but the index carries positional information you cannot recover — and most of these problems ask for a distance, a width or an area.",
      },
    ],
  },

  {
    slug: "recursion",
    title: "Recursion",
    chapterSlug: "base-and-recursive-cases",
    questions: [
      {
        type: "MULTIPLE_CHOICE",
        prompt: "What makes a recursion terminate?",
        options: [
          { id: "a", text: "Having a base case" },
          { id: "b", text: "Having a base case AND a recursive case that strictly shrinks the problem" },
          { id: "c", text: "Returning a value" },
          { id: "d", text: "Limiting the stack depth" },
        ],
        answer: "b",
        explanation:
          "A base case alone is not enough — if the recursive call does not move toward it, it is never reached. Both halves are required: somewhere to stop, and progress toward it.",
      },
      {
        type: "CODE_OUTPUT",
        prompt: "What is wrong with the result of this backtracking search?",
        code: `def subsets(nums):
    results, current = [], []
    def explore(start):
        results.append(current)      # note: not current[:]
        for i in range(start, len(nums)):
            current.append(nums[i])
            explore(i + 1)
            current.pop()
    explore(0)
    return results`,
        options: [
          { id: "a", text: "It returns too few subsets" },
          { id: "b", text: "Every result aliases the same list and ends up empty" },
          { id: "c", text: "It never terminates" },
          { id: "d", text: "Nothing is wrong" },
        ],
        answer: "b",
        explanation:
          "Appending `current` stores a reference, not a snapshot. As the search unwinds, every pop mutates the same list that every result points at, so they all finish empty.",
      },
      {
        type: "TRUE_FALSE",
        prompt:
          "A recursive function that allocates no data structures uses O(1) space.",
        options: TF("True", "False"),
        answer: "b",
        explanation:
          "Each pending call keeps a stack frame holding its parameters and return address. A recursion n levels deep costs O(n) memory, which is why deep recursion crashes where an equivalent loop would not.",
      },
    ],
  },
];
