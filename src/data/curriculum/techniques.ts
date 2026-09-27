import {
  code,
  complexity,
  concept,
  h2,
  insight,
  note,
  p,
  practice,
  quizBlock,
  recognise,
  rp,
  table,
  tip,
  ul,
  visual,
  warn,
  worked,
  type SectionSeed,
} from "./types";

/** 04 — Hash Tables. */
export const HASH_TABLES_SECTION: SectionSeed = {
  slug: "hash-tables",
  title: "Hash Tables",
  summary:
    "The structure behind most quadratic-to-linear improvements, and when it is the wrong tool.",
  chapters: [
    {
      slug: "maps-and-sets",
      title: "Maps and Sets",
      summary: "What a hash table gives you, and what it charges for it.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Explain how a hash table achieves expected constant-time lookup.",
        "Choose between a set and a map.",
        "State honestly when lookups degrade.",
      ],
      keyTakeaways: [
        "A hash function turns a key into a bucket index, so lookup does not search.",
        "A set answers membership; a map associates a value with each key.",
        "Constant time is expected, not guaranteed — collisions can degrade it.",
      ],
      content: [
        h2("How it works"),
        p(
          "A hash function converts a key into an integer, which is reduced to a bucket index. Storing and retrieving both compute that index directly, so neither searches."
        ),
        concept(
          "Expected, not guaranteed",
          "If several keys hash to the same bucket, they must be distinguished by scanning that bucket. With a good hash function and a reasonable load factor, buckets stay short and lookups are effectively constant. In the pathological case where everything collides, lookup degrades to O(n)."
        ),
        complexity(
          [
            { operation: "Insert", time: "O(1) expected", space: "O(1)" },
            { operation: "Lookup", time: "O(1) expected", space: "O(1)" },
            { operation: "Delete", time: "O(1) expected", space: "O(1)" },
            { operation: "Iterate all", time: "O(n)", space: "O(1)" },
            { operation: "Any of the above, worst case", time: "O(n)", space: "O(1)" },
          ],
          "The trade is memory for time: O(n) space for O(1) access."
        ),

        h2("Set or map?"),
        table(
          ["Question", "Structure"],
          [
            ["Have I seen this?", "Set"],
            ["How many times have I seen this?", "Map to a count"],
            ["Where did I see this?", "Map to an index"],
            ["What goes with this?", "Map to any value"],
          ],
          "Pick the one that answers the question you actually have."
        ),
        note(
          "A common mistake is reaching for a set when the problem needs a position. If you later want to know how far apart two occurrences were, the set has already thrown that away."
        ),

        h2("When a hash table is wrong"),
        ul(
          "Order or adjacency matters — a hash table discards position.",
          "You need range queries or the nearest key — that is a sorted structure.",
          "The key space is tiny and dense, where an array of counters is faster and smaller.",
          "Memory is the binding constraint."
        ),

        quizBlock("hash-tables"),
      ],
      quiz: "hash-tables",
    },

    {
      slug: "complement-lookups",
      title: "Complement Lookups",
      summary:
        "The move that turns almost every backwards search into a single pass.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Rewrite a backwards search as a lookup of what has already been seen.",
        "Order the check and the insert correctly.",
        "Apply the same rearrangement to sums, differences and running totals.",
      ],
      keyTakeaways: [
        "For each element, compute the one partner that would complete it and ask whether it has already gone past.",
        "Check before inserting, or an element pairs with itself.",
        "The same rearrangement solves pair sums, running-total counts and distance questions.",
      ],
      content: [
        h2("The move"),
        rp(
          "A nested loop that searches earlier elements is asking a membership question. Rearrange the condition so the thing you are looking for is computable, then look it up. For a pair summing to ",
          { code: "target" },
          ", the partner of ",
          { code: "v" },
          " is exactly ",
          { code: "target - v" },
          "."
        ),
        code(
          "python",
          `def pair_indices(nums, target):
    seen = {}
    for index, value in enumerate(nums):
        complement = target - value
        if complement in seen:        # check BEFORE inserting
            return [seen[complement], index]
        seen[value] = index
    return []`,
          "One pass",
          [5, 6, 7]
        ),
        warn(
          "Inserting before checking lets an element pair with itself, so a target of 8 and a single 4 returns [0, 0]. The ordering of those two lines is the whole correctness argument.",
          "Check first, then insert"
        ),
        visual("two-pointers", "Compare with the sorted-input alternative"),

        h2("The same idea, three shapes"),
        table(
          ["Question", "Rearranged into"],
          [
            ["Two values summing to t", "Has t - v been seen?"],
            ["Two values differing by d", "Has v - d been seen?"],
            ["A range summing to t", "Has running - t been seen?"],
            ["A repeat within k positions", "Was v seen at an index within k?"],
          ],
          "One technique, several disguises."
        ),
        insight(
          "Notice what all four have in common: the inner loop was searching for something the algorithm could have computed directly. Once you can name the thing you are looking for, you can look it up instead of searching for it.",
          "The general form"
        ),

        recognise(
          "A nested loop where the inner one searches earlier elements for something specific.",
          [
            "\"Find two elements such that…\"",
            "The inner loop breaks as soon as it finds a match",
            "The thing being searched for is computable from the current element",
            "Order of the result does not require the original positions to be scanned",
          ],
          "hashing",
          "If you can compute what you are looking for, you can store what you have seen and look it up in constant time."
        ),

        practice(["matching-pair-sum", "duplicate-within-distance", "longest-consecutive-run"], "Practise"),
      ],
      patterns: ["hashing"],
      problems: ["matching-pair-sum", "duplicate-within-distance", "longest-consecutive-run"],
    },

    {
      slug: "grouping-by-key",
      title: "Grouping by a Derived Key",
      summary:
        "Designing a canonical key so that things belonging together collide deliberately.",
      difficulty: "MEDIUM",
      readingMinutes: 6,
      objectives: [
        "Design a key that is identical for equivalent items and different otherwise.",
        "Avoid keys that are unhashable or compare by identity.",
        "Recognise grouping problems from their wording.",
      ],
      keyTakeaways: [
        "A grouping rule that is awkward to test pairwise is often easy to normalise into a key.",
        "A good key discards exactly the information the rule ignores.",
        "Arrays and lists hash by identity in several languages — convert to a tuple or string first.",
      ],
      content: [
        h2("The idea"),
        p(
          "Comparing every item with every other to decide who belongs together is quadratic. If instead each item can be reduced to a key that is identical for everything in its group, the hash table does the grouping for free."
        ),
        worked(
          '["eat", "tea", "tan", "ate"]',
          "2 groups",
          [
            { state: '"eat" → "aet"', note: "sorted characters" },
            { state: '"tea" → "aet"', note: "same key, same group" },
            { state: '"tan" → "ant"', note: "different key" },
            { state: '"ate" → "aet"', note: "joins the first group" },
          ],
          "Sorting the characters is the canonical key"
        ),
        code(
          "python",
          `def group_by_signature(words):
    groups = {}
    for word in words:
        key = "".join(sorted(word))   # discards order, keeps multiset
        groups.setdefault(key, []).append(word)
    return list(groups.values())`,
          "Grouping in one pass"
        ),

        h2("Picking a key"),
        table(
          ["Equivalence rule", "Key"],
          [
            ["Same characters, any order", "Sorted characters, or a count tuple"],
            ["Same shape of differences", "Tuple of consecutive differences"],
            ["Same remainder", "value modulo k"],
            ["Same normalised text", "lowercased, punctuation stripped"],
          ],
          "The key is the rule, made concrete."
        ),
        warn(
          "In Python a list cannot be a dictionary key, and in Java an int[] hashes by identity so two equal arrays are different keys. Convert to a tuple or a string first.",
          "Not everything is hashable"
        ),

        practice(["group-by-signature"], "Practise"),
      ],
      patterns: ["hashing"],
      problems: ["group-by-signature"],
    },
  ],
};

/** 05 — Two Pointers. */
export const TWO_POINTERS_SECTION: SectionSeed = {
  slug: "two-pointers",
  title: "Two Pointers",
  summary:
    "Two indices moving under a rule that never lets either of them backtrack.",
  chapters: [
    {
      slug: "two-pointer-fundamentals",
      title: "Two Pointer Fundamentals",
      summary:
        "The elimination argument that makes the technique correct, not just fast.",
      difficulty: "EASY",
      readingMinutes: 7,
      objectives: [
        "State the elimination argument that justifies moving a pointer.",
        "Distinguish opposite-direction from same-direction pointers.",
        "Decide whether a problem admits the technique at all.",
      ],
      keyTakeaways: [
        "Each step must permanently rule out a candidate; without that, the technique is unjustified.",
        "Opposite-direction pointers need sorted or otherwise monotonic input.",
        "Same-direction pointers filter, compact or maintain a range.",
      ],
      content: [
        h2("The core argument"),
        p(
          "Two pointers is fast because each iteration discards a candidate forever. If you cannot say which candidate a step eliminates and why it can never be part of the answer, the technique does not apply — it will just be a loop that happens to have two indices."
        ),
        concept(
          "The question to answer before you write the loop",
          "Given what I just observed, which side can I rule out entirely? For a sorted pair sum that is: the sum is too small, so the smallest value — already paired with the largest available partner — can never reach the target. It is eliminated."
        ),

        h2("Two shapes"),
        table(
          ["Shape", "Start", "Typical use"],
          [
            ["Opposite direction", "Both ends, closing in", "Pair sums, symmetry, container problems"],
            ["Same direction", "Both at the front, different speeds", "Filtering, compacting, windows"],
          ],
          "The two arrangements and what they are for."
        ),
        code(
          "python",
          `def opposite_ends(nums, target):
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            left += 1     # nums[left] can never work: eliminated
        else:
            right -= 1
    return []`,
          "Opposite direction",
          [8]
        ),
        visual("two-pointers", "Step through both pointers"),

        h2("When it does not apply"),
        ul(
          "The condition is not monotonic — if moving a pointer can help or hurt unpredictably, you cannot decide which to move.",
          "Original indices are needed but sorting destroyed them.",
          "Every pair must be reported, which is inherently quadratic.",
        ),
        warn(
          "Using `while left <= right` when the two pointers must reference distinct elements allows an element to pair with itself. This passes the samples and fails a hidden test.",
          "The most common off-by-one"
        ),

        recognise(
          "A sorted array, and a question about a pair or a span that satisfies a numeric condition.",
          [
            "Input is sorted, or sorting would not destroy the answer",
            "Looking for a pair, triplet or span meeting a condition",
            "Brute force compares every element with every other",
            "Moving one boundary changes the tracked quantity in one direction only",
          ],
          "two-pointers",
          "Sortedness turns each comparison into an elimination, which is what licenses discarding a whole side in constant time."
        ),

        practice(["sorted-pair-target", "widest-water-span"], "Practise"),
        quizBlock("two-pointers"),
      ],
      patterns: ["two-pointers"],
      problems: ["sorted-pair-target", "widest-water-span"],
      quiz: "two-pointers",
    },

    {
      slug: "fast-and-slow",
      title: "Fast and Slow Pointers",
      summary:
        "Different speeds turn distance questions into termination questions.",
      difficulty: "MEDIUM",
      readingMinutes: 6,
      objectives: [
        "Detect a cycle without extra memory.",
        "Find a midpoint or a k-from-the-end position in one pass.",
        "Explain why the pointers must meet inside a cycle.",
      ],
      keyTakeaways: [
        "The gap between the pointers changes by exactly one per iteration.",
        "In a cycle of length L, they must meet within L iterations.",
        "A fixed gap converts \"position from the end\" into \"position from here\".",
      ],
      content: [
        h2("Why they must meet"),
        p(
          "Move one pointer one step and the other two. Their relative speed is one step per iteration. Once both are inside a cycle, the distance between them shrinks by one each time, so it must reach zero."
        ),
        code(
          "python",
          `def has_cycle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:      # identity, not value
            return True
    return False`,
          "Floyd's cycle detection",
          [6]
        ),
        warn(
          "Check `fast` before `fast.next`, or an even-length list dereferences null. And compare node identity, not value — two nodes can hold the same number without being the same node.",
          "Two bugs that look the same"
        ),

        h2("Fixed gaps"),
        p(
          "A singly linked list cannot be walked backwards, which makes \"the k-th node from the end\" awkward. Starting one pointer k steps ahead converts it into a forward question."
        ),
        worked(
          "1 → 2 → 3 → 4 → 5, remove the 2nd from the end",
          "1 → 2 → 3 → 5",
          [
            { state: "lead 3 steps ahead", note: "gap of k + 1 so trail lands before the target" },
            { state: "advance both", note: "until lead falls off the end" },
            { state: "trail at 3", note: "unlink trail.next" },
          ],
          "A fixed gap locates a position relative to the end"
        ),
        tip(
          "Use a dummy node in front of the head whenever a removal might target the first node. It turns a special case into an ordinary one.",
          "The dummy head trick"
        ),

        practice(["middle-of-chain", "drop-nth-from-end", "chain-has-loop"], "Practise"),
      ],
      patterns: ["fast-slow-pointers"],
      problems: ["middle-of-chain", "drop-nth-from-end", "chain-has-loop"],
    },
  ],
};

/** 06 — Sliding Window. */
export const SLIDING_WINDOW_SECTION: SectionSeed = {
  slug: "sliding-window",
  title: "Sliding Window",
  summary:
    "A contiguous range that grows and shrinks instead of being rebuilt.",
  chapters: [
    {
      slug: "fixed-windows",
      title: "Fixed-Size Windows",
      summary:
        "Add one, drop one: the cheapest possible slide.",
      difficulty: "EASY",
      readingMinutes: 5,
      objectives: [
        "Maintain a window summary incrementally as the window slides.",
        "Get the leaving index right.",
        "Recognise when a summary cannot be maintained this way.",
      ],
      keyTakeaways: [
        "Neighbouring windows share all but two elements, so a slide is one add and one remove.",
        "The element leaving a window of width k at right is at index right - k.",
        "Summaries you can undo — sums, counts — work; maximums do not.",
      ],
      content: [
        h2("The slide"),
        code(
          "python",
          `def best_window(nums, k):
    total = sum(nums[:k])
    best = total
    for right in range(k, len(nums)):
        total += nums[right] - nums[right - k]   # in on the right, out on the left
        best = max(best, total)
    return best`,
          "One addition and one subtraction per step",
          [5]
        ),
        worked(
          "nums = [2, 1, 5, 1], k = 3",
          "best = 8",
          [
            { state: "[2,1,5]1", note: "total 8" },
            { state: "2[1,5,1]", note: "+1 -2 → total 7" },
          ],
          "Only the two edge elements change"
        ),
        warn(
          "The element leaving is at index `right - k`, not `right - k + 1`. That off-by-one keeps one element too many in the window and is almost invisible in small test cases.",
          "The leaving index"
        ),

        h2("When a fixed window is not enough"),
        p(
          "A sum can be undone by subtracting. A maximum cannot — once the largest element leaves, you have no idea what the next largest was. That needs a monotonic deque, covered in the queues section."
        ),
        practice(["strongest-window-average", "max-vowels-in-window"], "Practise"),
      ],
      patterns: ["sliding-window"],
      problems: ["strongest-window-average", "max-vowels-in-window"],
    },

    {
      slug: "variable-windows",
      title: "Variable-Size Windows",
      summary:
        "Grow on the right, shrink from the left, and never move an edge backwards.",
      difficulty: "MEDIUM",
      readingMinutes: 8,
      objectives: [
        "Write the grow/shrink loop correctly.",
        "Keep the validity test constant-time.",
        "Explain why the scan is linear despite the nested loop.",
      ],
      keyTakeaways: [
        "Shrinking uses `while`, not `if` — one new element can force several removals.",
        "Both edges only move forward, so each element is added once and removed at most once.",
        "Track a scalar summary of validity rather than comparing whole maps.",
      ],
      content: [
        h2("The template"),
        code(
          "python",
          `def longest_valid(items):
    left = 0
    best = 0
    state = {}

    for right, value in enumerate(items):
        add(state, value)

        # 'while', not 'if': one arrival can force several departures.
        while not is_valid(state):
            remove(state, items[left])
            left += 1

        best = max(best, right - left + 1)

    return best`,
          "Grow, then restore validity",
          [9, 10, 11]
        ),
        concept(
          "Why this is linear",
          "The nested loop looks quadratic, but the left edge only ever moves forward and can never pass the right edge. Across the whole run it advances at most n times in total, so the two loops together do O(n) work."
        ),

        h2("Keeping validity cheap"),
        p(
          "The window is only as fast as its validity test. Comparing two frequency maps every iteration is O(alphabet) per step and quietly ruins the complexity. Maintain a scalar instead."
        ),
        code(
          "python",
          `# Instead of comparing maps, count how many requirements are fully met.
if window[char] == need[char]:
    satisfied += 1        # only at the exact crossing point
...
if window[char] < need[char]:
    satisfied -= 1        # only when it drops below`,
          "A single integer replaces the comparison"
        ),
        insight(
          "Update the counter only at the boundary where a count crosses its requirement. Incrementing on every match double-counts surplus characters and the window never reports itself valid.",
          "Cross the boundary, not every step"
        ),

        h2("Common mistakes"),
        ul(
          "Using `if` instead of `while` to shrink.",
          "Measuring the width as right - left, losing one element.",
          "Recording the best while the window is still invalid.",
          "Leaving zero counts in a frequency map, so a size check reports characters that are no longer present.",
        ),

        recognise(
          "A question about the longest, shortest, or number of contiguous ranges meeting a condition.",
          [
            "The words contiguous, consecutive, substring or subarray",
            "Longest / shortest / count of ranges",
            "A candidate can be extended or trimmed one element at a time",
            "The tracked quantity updates incrementally",
          ],
          "sliding-window",
          "When both the grow and the shrink rules are one-directional, neither edge ever moves backwards, and the whole sweep is linear."
        ),

        visual("sliding-window", "Watch a variable window grow and shrink"),
        quizBlock("sliding-window"),
        practice(["longest-distinct-stretch", "longest-uniform-after-swaps", "shortest-covering-run"], "Practise"),
      ],
      patterns: ["sliding-window"],
      problems: ["longest-distinct-stretch", "longest-uniform-after-swaps", "shortest-covering-run"],
      quiz: "sliding-window",
    },
  ],
};

/** 07 — Binary Search. */
export const BINARY_SEARCH_SECTION: SectionSeed = {
  slug: "binary-search",
  title: "Binary Search",
  summary:
    "Halving a space using a yes/no question that flips exactly once.",
  chapters: [
    {
      slug: "binary-search-fundamentals",
      title: "Binary Search Fundamentals",
      summary:
        "Stop thinking about values and start thinking about a predicate.",
      difficulty: "MEDIUM",
      readingMinutes: 8,
      objectives: [
        "Write a boundary search that terminates and is off-by-one free.",
        "Express a problem as a monotonic predicate.",
        "Explain why the midpoint is computed the way it is.",
      ],
      keyTakeaways: [
        "Reframe the problem as a predicate that reads F F F T T T and find the flip.",
        "Half-open bounds with `hi = mid` and `lo = mid + 1` terminate reliably.",
        "Use lo + (hi - lo) / 2 so the midpoint cannot overflow.",
      ],
      content: [
        h2("The reframe"),
        p(
          "Searching for a value is the least interesting thing binary search does. The general form is: there is a predicate over a range which is false up to some point and true from then on, and you want the boundary."
        ),
        worked(
          "predicate over indices 0..7",
          "boundary at index 4",
          [
            { state: "F F F F T T T T", note: "the predicate flips exactly once" },
            { state: "mid = 3 → F", note: "the flip is to the right; discard 0..3" },
            { state: "mid = 5 → T", note: "keep 5 as a candidate; discard 6..7" },
            { state: "lo = hi = 4", note: "boundary found" },
          ],
          "Halving toward the flip"
        ),
        code(
          "python",
          `def first_true(lo, hi, predicate):
    """Smallest x in [lo, hi] with predicate(x) true; hi + 1 if none."""
    while lo < hi:
        mid = lo + (hi - lo) // 2   # cannot overflow
        if predicate(mid):
            hi = mid                # mid might be the answer: keep it
        else:
            lo = mid + 1            # mid definitely is not: discard it
    return lo`,
          "The one template worth memorising",
          [4, 6, 8]
        ),
        concept(
          "Why this terminates",
          "When hi == lo + 1, floor division makes mid == lo. If the predicate holds, hi becomes lo and the loop ends. If it does not, lo becomes lo + 1 == hi and the loop ends. Either branch shrinks the interval, which is exactly what an inclusive hi with `hi = mid` fails to guarantee."
        ),
        warn(
          "Writing `mid = (lo + hi) // 2` overflows in languages with fixed-width integers once lo and hi are large. Python is immune; Java, C++ and Go are not.",
          "The overflow that bit everyone"
        ),

        visual("binary-search", "Step through a search"),
        quizBlock("binary-search"),
      ],
      patterns: ["binary-search"],
      quiz: "binary-search",
    },

    {
      slug: "bounds-and-answers",
      title: "Bounds, and Searching the Answer",
      summary:
        "Lower and upper bounds, and the trick of binary searching a space that is not the input.",
      difficulty: "MEDIUM",
      readingMinutes: 7,
      objectives: [
        "Use lower and upper bounds to find a range of equal values.",
        "Recognise a 'minimise the maximum' problem as a search over answers.",
        "Check that feasibility is monotonic before applying the technique.",
      ],
      keyTakeaways: [
        "A range of equal values is two boundary searches, not one search plus a scan.",
        "When the answer is a number in a known range and feasibility is cheap to test, search the answers.",
        "Feasibility must be monotonic, or halving discards valid candidates.",
      ],
      content: [
        h2("Lower and upper bounds"),
        table(
          ["Bound", "Predicate", "Returns"],
          [
            ["Lower bound", "value ≥ target", "First index not less than the target"],
            ["Upper bound", "value > target", "First index strictly greater"],
          ],
          "Two predicates, one template."
        ),
        p(
          "The count of a value is upper bound minus lower bound, and the last occurrence is upper bound minus one. If the two bounds are equal, the value is absent — so no separate existence check is needed."
        ),

        h2("Searching the answer space"),
        p(
          "Sometimes there is no sorted array at all. What is sorted is the set of candidate answers: some are infeasible, the rest are feasible, and there is one flip between them."
        ),
        code(
          "python",
          `def minimum_feasible(low, high, feasible):
    while low < high:
        mid = low + (high - low) // 2
        if feasible(mid):
            high = mid
        else:
            low = mid + 1
    return low`,
          "Identical template, different space"
        ),
        insight(
          "The tell is wording like \"minimise the maximum\" or \"the smallest capacity such that…\". Those phrases describe a threshold, and a threshold is a boundary.",
          "How to spot it"
        ),
        warn(
          "Check monotonicity before committing. If a larger candidate can be infeasible when a smaller one was feasible, the predicate does not read F F F T T T and halving is invalid.",
          "Monotonicity is the precondition"
        ),

        recognise(
          "A problem asking for the smallest or largest value that satisfies some condition, where testing one candidate is cheap.",
          [
            "\"Minimise the maximum\" or \"maximise the minimum\"",
            "The answer is a number in a known range",
            "Checking a candidate is a straightforward linear pass",
            "If x works, everything above x also works",
          ],
          "binary-search",
          "Binary search does not need a sorted array, only a monotonic predicate. The answer space is often the thing that is sorted."
        ),

        practice(["insert-position-sorted", "range-of-value", "minimum-throughput", "rotated-catalogue-search"], "Practise"),
      ],
      patterns: ["binary-search"],
      problems: ["insert-position-sorted", "range-of-value", "minimum-throughput", "rotated-catalogue-search"],
    },
  ],
};
