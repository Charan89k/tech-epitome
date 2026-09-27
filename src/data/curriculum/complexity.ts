import {
  code,
  complexity,
  concept,
  h2,
  insight,
  note,
  ol,
  p,
  practice,
  quizBlock,
  rp,
  table,
  tip,
  ul,
  warn,
  worked,
  type SectionSeed,
} from "./types";

/** 01 — Complexity Analysis. The vocabulary every later section assumes. */
export const COMPLEXITY_SECTION: SectionSeed = {
  slug: "complexity-analysis",
  title: "Complexity Analysis",
  summary:
    "How to reason about cost before you write code, and why the answer is never measured in seconds.",
  chapters: [
    {
      slug: "why-complexity-matters",
      title: "Why Complexity Matters",
      summary:
        "Why we count operations instead of timing code, and what that buys you in an interview.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Explain why running time in seconds is a poor way to compare algorithms.",
        "Predict how an algorithm's cost changes when the input grows.",
        "Decide whether an approach is fast enough before implementing it.",
      ],
      keyTakeaways: [
        "Complexity describes how cost grows with input size, not how long something takes.",
        "The growth rate dominates every constant factor once the input is large enough.",
        "Estimating complexity first saves you from implementing an approach that cannot work.",
      ],
      content: [
        h2("What is this?"),
        p(
          "Complexity analysis is a way of describing how much work an algorithm does as a function of how much input it is given. It deliberately ignores the speed of your machine, the language you wrote it in, and how good the compiler is."
        ),
        rp(
          "That sounds like throwing away useful information. It is the opposite: those details change constantly, and the ",
          { strong: "shape" },
          " of the growth does not."
        ),

        h2("Why does it matter?"),
        p(
          "Suppose two functions solve the same problem. On a thousand items, one takes 2 milliseconds and the other takes 1. The second looks twice as good. Now run both on a million items."
        ),
        table(
          ["Input size", "Linear approach", "Quadratic approach"],
          [
            ["1,000", "2 ms", "1 ms"],
            ["10,000", "20 ms", "100 ms"],
            ["100,000", "200 ms", "10 seconds"],
            ["1,000,000", "2 seconds", "~17 minutes"],
          ],
          "The same two functions, measured at four input sizes."
        ),
        p(
          "The slower-looking function wins at every size that matters. Its advantage at a thousand items was a constant factor; the other's disadvantage was structural. Constant factors stop mattering; growth rates never do."
        ),

        h2("The mental model"),
        concept(
          "Count the work, not the clock",
          "Ask how many times the innermost operation runs, expressed in terms of the input size n. That count is the algorithm's cost. Everything else — CPU speed, language, memory layout — scales that count by some constant, and constants are exactly what this analysis discards."
        ),
        p(
          "In practice this becomes a habit: read a loop and ask how many times it runs; read a nested loop and multiply; read a recursive call and ask how the problem shrinks."
        ),

        h2("A worked example"),
        worked(
          "An array of n numbers, searching for a target",
          "n comparisons in the worst case",
          [
            { state: "compare element 0", note: "1 operation" },
            { state: "compare element 1", note: "2 operations" },
            { state: "…", note: "the loop may run all the way" },
            { state: "compare element n-1", note: "n operations total" },
          ],
          "Scanning an unsorted array"
        ),
        p(
          "The target might be first, in which case one comparison suffices. It might be absent, in which case every element is checked. Complexity analysis reports the worst case by default, because that is the guarantee you can rely on."
        ),

        h2("Reading code for cost"),
        code(
          "python",
          `def has_duplicate(nums):
    for i in range(len(nums)):          # runs n times
        for j in range(i + 1, len(nums)):  # runs up to n times
            if nums[i] == nums[j]:      # the innermost operation
                return True
    return False`,
          "Two nested loops over the same array",
          [2, 3]
        ),
        p(
          "The inner comparison runs roughly n²/2 times. We drop the ½ — it is a constant — and call this quadratic."
        ),

        h2("Estimating whether something will finish"),
        p(
          "Interviewers give constraints for a reason. They are telling you which complexities are acceptable."
        ),
        table(
          ["Constraint on n", "What usually fits"],
          [
            ["n ≤ 20", "Exponential — 2ⁿ or n! search"],
            ["n ≤ 3,000", "Quadratic — O(n²)"],
            ["n ≤ 200,000", "O(n log n) — sorting, heaps, binary search per element"],
            ["n ≤ 10,000,000", "Linear or better"],
          ],
          "A rough guide for a one-second budget."
        ),
        tip(
          "Read the constraints before you design. If n can be 100,000, you have just ruled out every quadratic idea without writing a line of code.",
          "Use the constraints"
        ),

        h2("Common mistakes"),
        ul(
          "Timing code on one input and concluding one approach is faster in general.",
          "Optimising a constant factor when the growth rate is the actual problem.",
          "Forgetting that a library call inside a loop has its own cost — sorting inside a loop is not free.",
          "Assuming fewer lines of code means less work."
        ),
        warn(
          "A one-line list comprehension that scans the whole array is still a linear scan. Brevity is not speed.",
          "Short is not the same as fast"
        ),

        quizBlock("complexity-basics"),
        practice(["running-altitude"], "Try it on a real problem"),
      ],
      quiz: "complexity-basics",
      problems: ["running-altitude"],
    },

    {
      slug: "big-o-notation",
      title: "Big O Notation",
      summary:
        "The notation itself: what it means, what it discards, and how to read it correctly.",
      difficulty: "EASY",
      readingMinutes: 8,
      objectives: [
        "State what O(f(n)) formally claims about an algorithm.",
        "Simplify an expression by dropping constants and lower-order terms.",
        "Distinguish best, average and worst case.",
      ],
      keyTakeaways: [
        "Big O is an upper bound on growth, ignoring constant factors.",
        "Drop constants and keep only the fastest-growing term.",
        "Unqualified complexity means worst case unless stated otherwise.",
      ],
      content: [
        h2("What is this?"),
        rp(
          "Writing ",
          { code: "O(n²)" },
          " says: beyond some input size, this algorithm's cost is at most a constant multiple of n². It is an upper bound on the growth rate, nothing more."
        ),

        h2("What it deliberately discards"),
        p(
          "Two things are thrown away, and knowing which two makes the notation easy to apply."
        ),
        ol(
          "Constant factors. 3n and 100n are both O(n). The 100 matters in practice but it is a property of your implementation, not of the algorithm.",
          "Lower-order terms. n² + n + 500 is O(n²), because once n is large the n² term dwarfs the rest."
        ),
        worked(
          "T(n) = 4n² + 30n + 900",
          "O(n²)",
          [
            { state: "4n² + 30n + 900", note: "the raw operation count" },
            { state: "n² + n + 1", note: "drop the constant multipliers" },
            { state: "n²", note: "keep only the fastest-growing term" },
          ],
          "Simplifying an operation count"
        ),
        note(
          "At n = 10 the discarded terms are most of the cost. At n = 10,000 they are a rounding error. Big O describes the second situation, which is the one that decides whether your solution passes."
        ),

        h2("The family of growth rates"),
        table(
          ["Notation", "Name", "n = 1,000 costs roughly"],
          [
            ["O(1)", "Constant", "1"],
            ["O(log n)", "Logarithmic", "10"],
            ["O(n)", "Linear", "1,000"],
            ["O(n log n)", "Linearithmic", "10,000"],
            ["O(n²)", "Quadratic", "1,000,000"],
            ["O(2ⁿ)", "Exponential", "more than atoms in the observable universe"],
          ],
          "Relative cost at a thousand items."
        ),
        insight(
          "The gap between O(n log n) and O(n²) is the single most common difference between a solution that passes and one that times out. Most of this curriculum is about closing that gap.",
          "Where interviews are won"
        ),

        h2("Best, average and worst"),
        p(
          "The same algorithm can have three different answers depending on which input you consider."
        ),
        code(
          "python",
          `def find(nums, target):
    for i, value in enumerate(nums):
        if value == target:
            return i
    return -1`,
          "Linear search"
        ),
        ul(
          "Best case: the target is first. One comparison, O(1).",
          "Worst case: the target is absent. n comparisons, O(n).",
          "Average case: with the target equally likely anywhere, about n/2 comparisons — still O(n)."
        ),
        rp(
          "When someone says this is ",
          { code: "O(n)" },
          " without qualification, they mean the worst case. That is the convention, because the worst case is the only one you can promise."
        ),

        h2("Common mistakes"),
        ul(
          "Saying an algorithm is O(n²) when you mean it is exactly n² — Big O is an upper bound, so O(n²) is technically true of a linear algorithm too, just useless.",
          "Dropping a term that is not actually lower-order: n · m does not simplify to n when m is a separate input.",
          "Reporting the best case because it sounds better.",
          "Ignoring the cost of a built-in: a slice, a sort or a string concatenation inside a loop all carry their own complexity."
        ),
        warn(
          "In several languages, building a string with += inside a loop is quadratic, because each concatenation copies the whole string. The loop looks linear. It is not.",
          "Hidden costs in built-ins"
        ),

        quizBlock("big-o-notation"),
      ],
      quiz: "big-o-notation",
    },

    {
      slug: "common-growth-rates",
      title: "Constant, Linear and Logarithmic Time",
      summary:
        "The three growth rates you will meet most often, and what kind of code produces each.",
      difficulty: "EASY",
      readingMinutes: 7,
      objectives: [
        "Recognise the code shapes that produce constant, linear and logarithmic time.",
        "Explain why halving a search space gives a logarithm.",
        "Identify when a loop is not actually linear.",
      ],
      keyTakeaways: [
        "Constant time means the work does not depend on the input size at all.",
        "Linear time means you touch each element a bounded number of times.",
        "Logarithmic time comes from repeatedly discarding a fixed fraction of the remaining work.",
      ],
      content: [
        h2("Constant time — O(1)"),
        p(
          "The work does not grow with the input. Reading an array element by index, pushing onto a stack, looking up a hash key: all constant."
        ),
        code(
          "python",
          `def first_and_last(nums):
    # Two reads, regardless of how long nums is.
    return nums[0], nums[-1]`,
          "Constant time"
        ),
        warn(
          "Constant does not mean fast, it means unchanging. A constant-time operation that takes a millisecond is slower than a linear scan over ten items.",
          "Constant is not a synonym for cheap"
        ),

        h2("Linear time — O(n)"),
        p(
          "You touch each element a bounded number of times. One pass is linear; three passes are also linear, because 3n is O(n)."
        ),
        code(
          "python",
          `def total(nums):
    running = 0
    for value in nums:      # exactly n iterations
        running += value
    return running`,
          "Linear time"
        ),
        insight(
          "Two sequential loops are linear. Two nested loops are quadratic. The difference is whether the second loop runs once per element of the first, or once in total.",
          "Sequential versus nested"
        ),

        h2("Logarithmic time — O(log n)"),
        p(
          "Each step discards a fixed fraction of what remains. Halving is the usual case, and how many times you can halve n before reaching one is, by definition, log₂ n."
        ),
        worked(
          "n = 1,000,000",
          "20 steps",
          [
            { state: "1,000,000", note: "step 0" },
            { state: "500,000", note: "step 1" },
            { state: "250,000", note: "step 2" },
            { state: "…", note: "each step halves the remainder" },
            { state: "1", note: "step 20" },
          ],
          "Halving a million down to one"
        ),
        p(
          "Twenty steps for a million items. Forty for a trillion. This is why binary search feels almost free, and why doubling your data barely changes the cost."
        ),
        code(
          "python",
          `def count_halvings(n):
    steps = 0
    while n > 1:
        n //= 2       # discard half of what remains
        steps += 1
    return steps      # approximately log2(n)`,
          "Where the logarithm comes from"
        ),
        note(
          "The base of the logarithm does not appear in the notation. Changing base multiplies by a constant, and Big O discards constants — so O(log₂ n) and O(log₁₀ n) are the same thing."
        ),

        h2("Linearithmic time — O(n log n)"),
        rp(
          "A logarithmic amount of work done once per element, or a linear amount done at each of log n levels. Comparison sorts land here, and so does anything that sorts first and then scans. Practically speaking, ",
          { code: "O(n log n)" },
          " is close enough to linear that it is rarely the bottleneck."
        ),

        h2("When a loop is not linear"),
        code(
          "python",
          `def suspicious(nums):
    for value in nums:          # n iterations
        if value in nums:       # each 'in' scans the whole list: O(n)
            pass`,
          "A single loop that is quadratic",
          [3]
        ),
        p(
          "One visible loop, quadratic cost. The membership test hides a second traversal. This is why complexity has to be read in terms of operations performed, not loops written."
        ),

        quizBlock("growth-rates"),
      ],
      quiz: "growth-rates",
    },

    {
      slug: "quadratic-and-beyond",
      title: "Quadratic Time and Worse",
      summary:
        "Where nested work comes from, and how to tell whether it can be removed.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Recognise the shapes that produce quadratic and exponential cost.",
        "Judge whether a nested loop is removable.",
        "Know which growth rates are acceptable at which input sizes.",
      ],
      keyTakeaways: [
        "Quadratic cost comes from pairing every element with every other element.",
        "Most quadratic solutions become linear by remembering something instead of re-deriving it.",
        "Exponential cost is fine when n is tiny and hopeless otherwise.",
      ],
      content: [
        h2("Quadratic time — O(n²)"),
        p(
          "Every element is compared against every other element. The count is n(n-1)/2, which simplifies to n²."
        ),
        code(
          "python",
          `def closest_pair(nums):
    best = None
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            gap = abs(nums[i] - nums[j])
            if best is None or gap < best:
                best = gap
    return best`,
          "Comparing every pair"
        ),

        h2("Is the nesting removable?"),
        p(
          "Ask what the inner loop is actually computing. There are two common answers, and they have different fixes."
        ),
        table(
          ["What the inner loop does", "Usual fix"],
          [
            ["Checks whether something exists", "A hash set or map"],
            ["Searches earlier elements for a complement", "A hash map of what you have seen"],
            ["Finds the next larger or smaller element", "A monotonic stack"],
            ["Recomputes a total over a range", "A prefix sum"],
            ["Compares against a sorted neighbour", "Two pointers"],
          ],
          "Nested loops and what usually replaces them."
        ),
        insight(
          "Almost every quadratic-to-linear improvement is the same move: stop re-deriving information you already had, and store it instead. The rest of this curriculum is variations on that one idea.",
          "The single most useful realisation"
        ),
        p(
          "Sometimes the nesting is not removable. Comparing every pair to report all of them is inherently quadratic, because there are that many pairs to report."
        ),

        h2("Exponential time — O(2ⁿ) and O(n!)"),
        p(
          "Each element doubles the work, or each position multiplies the arrangements. This is the cost of exploring every subset or every ordering."
        ),
        table(
          ["n", "2ⁿ", "n!"],
          [
            ["10", "1,024", "3.6 million"],
            ["20", "1 million", "2.4 × 10¹⁸"],
            ["30", "1 billion", "unimaginable"],
          ],
          "Why exponential algorithms have small input limits."
        ),
        note(
          "When a problem states n ≤ 20, it is usually telling you that an exponential search is expected. Constraints are a hint about the intended solution."
        ),

        h2("Common mistakes"),
        ul(
          "Adding a hash map to a quadratic algorithm without removing the inner loop — the memory is spent and nothing is saved.",
          "Assuming a nested loop that breaks early is not quadratic; the worst case is what counts.",
          "Treating a sort inside a loop as free — that is O(n² log n).",
          "Concluding a problem is exponential because the obvious solution is."
        ),

        complexity(
          [
            { operation: "Scan once", time: "O(n)", space: "O(1)" },
            { operation: "Scan with a set", time: "O(n)", space: "O(n)", note: "the usual trade" },
            { operation: "Compare every pair", time: "O(n²)", space: "O(1)" },
            { operation: "Sort, then scan", time: "O(n log n)", space: "O(n)" },
            { operation: "Every subset", time: "O(2ⁿ)", space: "O(n)" },
          ],
          "The shapes you will keep meeting."
        ),

        practice(["matching-pair-sum", "warmest-day-ahead"], "See the fix in action"),
      ],
      patterns: ["hashing"],
      problems: ["matching-pair-sum", "warmest-day-ahead"],
    },

    {
      slug: "space-complexity",
      title: "Space Complexity",
      summary:
        "Counting memory, what conventionally does not count, and the trade against time.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Distinguish auxiliary space from total space.",
        "Account for the memory a recursive call stack consumes.",
        "Reason explicitly about trading memory for time.",
      ],
      keyTakeaways: [
        "Space complexity normally means auxiliary space — extra memory beyond the input and the output.",
        "Recursion costs memory proportional to its depth, even with no explicit data structure.",
        "Spending O(n) memory to turn O(n²) time into O(n) is almost always the right trade.",
      ],
      content: [
        h2("What counts"),
        p(
          "Space complexity measures the extra memory an algorithm needs as the input grows. By convention the input itself does not count, and neither does the output — you were given one and are obliged to produce the other."
        ),
        concept(
          "Auxiliary space",
          "Everything you allocate that is neither the input nor the output. A few loop counters are O(1). A hash map holding every element is O(n). A new array the size of the input is O(n), even if you are about to return it — in which case most people call it O(1) auxiliary and say so."
        ),
        code(
          "python",
          `def running_max(nums):
    best = nums[0]          # O(1): one variable
    for value in nums:
        best = max(best, value)
    return best


def all_prefix_maxima(nums):
    result = []             # O(n): grows with the input
    best = nums[0]
    for value in nums:
        best = max(best, value)
        result.append(best)
    return result`,
          "Constant versus linear auxiliary space"
        ),

        h2("Recursion is not free"),
        p(
          "Every pending call keeps a frame on the call stack, holding its parameters and local variables. A recursion n levels deep costs O(n) memory even if it allocates nothing."
        ),
        code(
          "python",
          `def sum_to(n):
    if n == 0:
        return 0
    return n + sum_to(n - 1)   # n frames alive at the deepest point`,
          "O(n) space with no data structure in sight"
        ),
        warn(
          "This is why a recursive solution can crash on a large input while an identical iterative one is fine. The stack has a hard limit, and exceeding it is a crash rather than a slowdown.",
          "Stack depth is a real constraint"
        ),

        h2("The trade"),
        p(
          "Time and space pull against each other, and the exchange rate is usually very favourable in one direction."
        ),
        table(
          ["Approach", "Time", "Space"],
          [
            ["Compare every pair", "O(n²)", "O(1)"],
            ["Sort, then scan", "O(n log n)", "O(log n) to O(n)"],
            ["Hash set of what you have seen", "O(n)", "O(n)"],
          ],
          "Three ways to find a duplicate."
        ),
        insight(
          "Spending O(n) memory to remove an O(n) factor from the running time is nearly always worth it. Spending O(n²) memory to save a constant factor almost never is.",
          "Which way to trade"
        ),
        note(
          "Interviewers sometimes constrain space deliberately — \"solve it in O(1) extra space\" — precisely to block the hash map and force a different idea, usually two pointers or in-place manipulation."
        ),

        h2("Common mistakes"),
        ul(
          "Counting the output array against the space budget, when the convention excludes it.",
          "Forgetting the recursion stack and claiming O(1).",
          "Ignoring the memory a language's slicing creates — slicing copies in many languages.",
          "Claiming O(1) for a hash map whose keys are bounded, without saying so; it is fair, but only if you state the bound."
        ),

        quizBlock("space-complexity"),
        practice(["compact-the-queue"], "Practise in-place work"),
      ],
      quiz: "space-complexity",
      problems: ["compact-the-queue"],
    },
  ],
};
