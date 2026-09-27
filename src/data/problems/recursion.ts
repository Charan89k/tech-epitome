import { example, para, rich, type ProblemSeed } from "./types";

/** Base cases, recursive cases, the call stack, and the first steps of backtracking. */
export const RECURSION_PROBLEMS: ProblemSeed[] = [
  {
    slug: "count-climb-routes",
    title: "Count the Climbing Routes",
    difficulty: "EASY",
    learningObjective:
      "Spot that a naive recursion recomputes the same subproblem, and fix it with memoisation.",
    topics: ["recursion"],
    patterns: ["dynamic-programming"],
    statement: [
      para(
        "A maintenance ladder has a number of rungs. On each move a technician climbs either one rung or two."
      ),
      rich("Return how many distinct sequences of moves reach rung ", { code: "n" }, " exactly."),
      example(
        "n = 4",
        "5",
        [
          { state: "1+1+1+1", note: "route 1" },
          { state: "1+1+2", note: "route 2" },
          { state: "1+2+1", note: "route 3" },
          { state: "2+1+1", note: "route 4" },
          { state: "2+2", note: "route 5" },
        ],
        "Routes to rung 4"
      ),
    ],
    constraints: ["0 ≤ n ≤ 45", "The answer fits in a 32-bit signed integer."],
    signature: {
      params: ["int"],
      paramNames: ["n"],
      returns: "int",
      functionName: "countRoutes",
    },
    tests: [
      { input: "4", expected: "5", isSample: true },
      { input: "2", expected: "2", isSample: true, explanation: "1+1 and 2." },
      { input: "0", expected: "1", isSample: true, explanation: "Exactly one way to stand still: take no moves." },
      { input: "1", expected: "1" },
      { input: "3", expected: "3" },
      { input: "10", expected: "89" },
      { input: "30", expected: "1346269" },
      { input: "45", expected: "1836311903" },
    ],
    hints: [
      "Think about the very last move. What could it have been?",
      "Either a single rung from n-1, or a double from n-2. Those two groups do not overlap and cover everything.",
      "So routes(n) = routes(n-1) + routes(n-2). What are the base cases?",
      "Plain recursion recomputes the same rungs exponentially often. Store each answer the first time you compute it.",
    ],
    solutions: [
      {
        title: "Naive recursion",
        order: 1,
        intuition:
          "The recurrence follows directly from the last move. The implementation is a one-liner and is a good way to see why memoisation matters: routes(40) recomputes routes(35) millions of times.",
        approach: [
          "Return 1 for n of 0 or 1.",
          "Otherwise return countRoutes(n-1) + countRoutes(n-2).",
        ],
        code: {
          PYTHON: `def countRoutes(n: int) -> int:
    if n <= 1:
        return 1
    return countRoutes(n - 1) + countRoutes(n - 2)`,
          JAVA: `class Solution {
    public int countRoutes(int n) {
        if (n <= 1) return 1;
        return countRoutes(n - 1) + countRoutes(n - 2);
    }
}`,
        },
        timeComplexity: "O(φⁿ) — exponential",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["n = 0, which has exactly one route: take no moves."],
        commonMistakes: [
          "Returning 0 for n = 0, which shifts the whole sequence.",
          "Submitting this for n = 45 and timing out.",
        ],
      },
      {
        title: "Optimal: two rolling values",
        order: 2,
        intuition:
          "Each answer depends only on the previous two, so the whole table is unnecessary — two variables carry everything the recurrence needs. This is the memoised version with the memory stripped down to exactly what is still in use.",
        approach: [
          "Handle n ≤ 1 directly.",
          "Keep the answers for the previous two rungs.",
          "Step upward, shifting the pair each time.",
          "Return the newer of the two.",
        ],
        code: {
          PYTHON: `def countRoutes(n: int) -> int:
    if n <= 1:
        return 1

    # two_back = routes(i - 2), one_back = routes(i - 1)
    two_back, one_back = 1, 1

    for _ in range(2, n + 1):
        two_back, one_back = one_back, one_back + two_back

    return one_back`,
          JAVA: `class Solution {
    public int countRoutes(int n) {
        if (n <= 1) return 1;

        int twoBack = 1, oneBack = 1;
        for (int i = 2; i <= n; i++) {
            int current = oneBack + twoBack;
            twoBack = oneBack;
            oneBack = current;
        }

        return oneBack;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: ["n = 0 and n = 1, handled before the loop.", "n = 45, the largest allowed."],
        commonMistakes: [
          "Updating the two variables in the wrong order and losing one of them.",
          "Starting the loop at 1 rather than 2, producing an off-by-one.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "generate-balanced-groupings",
    title: "Generate Balanced Groupings",
    difficulty: "MEDIUM",
    learningObjective:
      "Prune a search at the point a partial candidate becomes impossible, rather than filtering at the end.",
    topics: ["recursion"],
    patterns: ["backtracking"],
    statement: [
      para(
        "A query builder composes groupings from round brackets. A grouping is balanced when every opening bracket is closed in the correct order."
      ),
      rich("Return how many distinct balanced groupings use exactly ", { code: "n" }, " pairs of brackets."),
      example(
        "n = 3",
        "5",
        [
          { state: "((()))", note: "1" },
          { state: "(()())", note: "2" },
          { state: "(())()", note: "3" },
          { state: "()(())", note: "4" },
          { state: "()()()", note: "5" },
        ],
        "All balanced groupings of three pairs"
      ),
    ],
    constraints: ["1 ≤ n ≤ 12"],
    signature: {
      params: ["int"],
      paramNames: ["n"],
      returns: "int",
      functionName: "countGroupings",
    },
    tests: [
      { input: "3", expected: "5", isSample: true },
      { input: "1", expected: "1", isSample: true },
      { input: "2", expected: "2", isSample: true },
      { input: "4", expected: "14" },
      { input: "5", expected: "42" },
      { input: "8", expected: "1430" },
      { input: "12", expected: "208012" },
    ],
    hints: [
      "Generating every arrangement of n opening and n closing brackets and filtering is 2n-choose-n candidates. Most are invalid.",
      "At any point while building, when is adding an opening bracket legal?",
      "Whenever you have not used all n. And a closing bracket is legal only while more are open than closed.",
      "Enforce those two rules as you build, and no invalid candidate is ever created.",
    ],
    solutions: [
      {
        title: "Backtracking with validity enforced during construction",
        order: 1,
        intuition:
          "Generate-then-filter explores an enormous space of arrangements that were doomed from their third character. The two legality rules are checkable on a partial candidate, so enforcing them at each step prunes whole subtrees before they are built. Every leaf the search reaches is then a valid answer.",
        approach: [
          "Track how many opening and closing brackets have been placed.",
          "When both equal n, a complete grouping has been formed.",
          "Place an opening bracket while fewer than n have been used.",
          "Place a closing bracket only while closed is strictly less than open.",
        ],
        code: {
          PYTHON: `def countGroupings(n: int) -> int:
    total = 0

    def build(opened: int, closed: int) -> None:
        nonlocal total

        if closed == n:
            total += 1
            return

        # Legal to open while any remain.
        if opened < n:
            build(opened + 1, closed)

        # Legal to close only while something is still open; this single
        # condition is what prevents ever constructing ")(" .
        if closed < opened:
            build(opened, closed + 1)

    build(0, 0)
    return total`,
          JAVA: `class Solution {
    private int total = 0;
    private int n;

    public int countGroupings(int n) {
        this.n = n;
        this.total = 0;
        build(0, 0);
        return total;
    }

    private void build(int opened, int closed) {
        if (closed == n) {
            total++;
            return;
        }
        if (opened < n) build(opened + 1, closed);
        if (closed < opened) build(opened, closed + 1);
    }
}`,
        },
        timeComplexity: "O(Catalan(n)) — proportional to the number of answers",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["n = 1, the single grouping ().", "n = 12, the largest allowed."],
        commonMistakes: [
          "Allowing a closing bracket when closed equals opened, which generates \")(\".",
          "Generating all arrangements and validating afterwards, which is exponentially wasteful.",
          "Forgetting to return after recording a complete grouping.",
        ],
      },
    ],
    expectedTime: "O(Catalan(n))",
    expectedSpace: "O(n)",
  },

  {
    slug: "count-subsets-with-sum",
    title: "Count Subsets With a Target Sum",
    difficulty: "MEDIUM",
    learningObjective:
      "Model a choose-or-skip decision as two recursive branches, and see the state that defines a subproblem.",
    topics: ["recursion"],
    patterns: ["backtracking", "dynamic-programming"],
    statement: [
      para(
        "A procurement team has a list of item costs and a budget. Each item may be taken at most once."
      ),
      para(
        "Return how many distinct selections of items sum to exactly the budget. Two selections differ if they use different positions, even when the costs are equal. The empty selection counts when the budget is zero."
      ),
      example(
        "costs = [2, 3, 5], budget = 5",
        "2",
        [
          { state: "{2, 3}", note: "sums to 5" },
          { state: "{5}", note: "sums to 5" },
        ],
        "Two qualifying selections"
      ),
    ],
    constraints: [
      "1 ≤ costs.length ≤ 20",
      "1 ≤ costs[i] ≤ 1000",
      "0 ≤ budget ≤ 20000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["costs", "budget"],
      returns: "int",
      functionName: "countSelections",
    },
    tests: [
      { input: "2 3 5\n5", expected: "2", isSample: true, explanation: "{2,3} and {5}." },
      { input: "1 1\n1", expected: "2", isSample: true, explanation: "The two 1s are at different positions, so they are different selections." },
      { input: "1 2 3\n0", expected: "1", isSample: true, explanation: "The empty selection." },
      { input: "5\n5", expected: "1" },
      { input: "5\n4", expected: "0" },
      { input: "1 1 1 1\n2", expected: "6" },
      { input: "2 4 6 10\n16", expected: "2" },
      { input: "1 2 3 4 5\n5", expected: "3" },
    ],
    hints: [
      "Consider the first item. What are the only two things you can do with it?",
      "Take it, or leave it. The total count is the sum of the counts from those two branches.",
      "What defines a subproblem? Which items remain, and how much budget is left.",
      "Base cases: budget exactly zero is one valid selection; running out of items with budget remaining is zero.",
    ],
    solutions: [
      {
        title: "Choose or skip, recursively",
        order: 1,
        intuition:
          "Every subset corresponds to a sequence of independent yes/no decisions, one per item. That maps directly onto a binary recursion tree: at each level, branch on taking or skipping the current item. The subproblem is fully described by how far along you are and how much budget remains, which is the state you would memoise if the input were larger.",
        approach: [
          "Recurse with an index and the remaining budget.",
          "Return 1 when the budget reaches exactly zero and 0 when the items run out with budget left.",
          "Skip the current item: recurse with index + 1 and the same budget.",
          "Take it when it fits: recurse with index + 1 and the reduced budget.",
          "Return the sum of the branches.",
        ],
        code: {
          PYTHON: `def countSelections(costs: List[int], budget: int) -> int:
    def explore(index: int, remaining: int) -> int:
        # An exactly-spent budget is one complete selection.
        if remaining == 0:
            return 1
        if index == len(costs) or remaining < 0:
            return 0

        # Skip this item, then take it if it fits. The branches are
        # disjoint, so the counts simply add.
        skip = explore(index + 1, remaining)
        take = explore(index + 1, remaining - costs[index])
        return skip + take

    return explore(0, budget)`,
          JAVA: `class Solution {
    private int[] costs;

    public int countSelections(int[] costs, int budget) {
        this.costs = costs;
        return explore(0, budget);
    }

    private int explore(int index, int remaining) {
        if (remaining == 0) return 1;
        if (index == costs.length || remaining < 0) return 0;

        int skip = explore(index + 1, remaining);
        int take = explore(index + 1, remaining - costs[index]);
        return skip + take;
    }
}`,
        },
        timeComplexity: "O(2ⁿ), acceptable because n ≤ 20",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: [
          "A budget of zero, where the empty selection is the single answer.",
          "Duplicate costs, which count as distinct selections by position.",
          "No selection reaching the budget.",
        ],
        commonMistakes: [
          "Checking the index before the budget, which misses a selection that completes on the last item.",
          "Deduplicating by value, when the problem distinguishes by position.",
          "Recursing with index + 1 in one branch and index in the other, which allows reusing an item.",
        ],
      },
    ],
    expectedTime: "O(2ⁿ)",
    expectedSpace: "O(n)",
  },
];
