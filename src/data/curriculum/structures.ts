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
  table,
  tip,
  ul,
  visual,
  warn,
  worked,
  type SectionSeed,
} from "./types";

/** 08 — Linked Lists. */
export const LINKED_LISTS_SECTION: SectionSeed = {
  slug: "linked-lists",
  title: "Linked Lists",
  summary:
    "Nodes joined by references, what that makes cheap, and the pointer discipline it demands.",
  chapters: [
    {
      slug: "nodes-and-traversal",
      title: "Nodes and Traversal",
      summary:
        "What you give up by abandoning contiguity, and what you get back.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Explain why a linked list has no O(1) indexing.",
        "Traverse a list safely without dereferencing null.",
        "Choose between an array and a linked list for a given access pattern.",
      ],
      keyTakeaways: [
        "Nodes are scattered in memory and joined by references, so position must be walked to.",
        "Insertion and deletion are O(1) once you hold the preceding node.",
        "Finding that preceding node is usually the O(n) part.",
      ],
      content: [
        h2("The trade"),
        p(
          "An array's elements are adjacent, which is what makes indexing arithmetic. A linked list gives that up: each node holds a value and a reference to the next one, and they can be anywhere in memory."
        ),
        table(
          ["Operation", "Array", "Linked list"],
          [
            ["Read by index", "O(1)", "O(n)"],
            ["Insert at front", "O(n)", "O(1)"],
            ["Insert after a known node", "O(n)", "O(1)"],
            ["Delete a known node", "O(n)", "O(1) with the previous node"],
            ["Memory per element", "value only", "value plus a reference"],
          ],
          "What contiguity buys and costs."
        ),
        warn(
          "\"Insertion is O(1)\" is only true once you already hold the right node. Getting there is O(n), so inserting at position k in a linked list is O(k) overall — no better than an array.",
          "The claim people over-state"
        ),

        h2("Traversal"),
        code(
          "python",
          `def length(head):
    count = 0
    node = head
    while node is not None:    # the null check IS the loop condition
        count += 1
        node = node.next
    return count`,
          "The basic walk"
        ),
        tip(
          "Never advance and dereference in the same expression without checking. `node.next.next` is two dereferences and needs two guards.",
          "Guard every dereference"
        ),
        visual("linked-list-reversal", "Watch pointers being reassigned"),
      ],
    },

    {
      slug: "insertion-deletion-reversal",
      title: "Insertion, Deletion and Reversal",
      summary:
        "The pointer discipline: save before you overwrite, and use a dummy head.",
      difficulty: "EASY",
      readingMinutes: 7,
      objectives: [
        "Reverse a list iteratively in O(1) space.",
        "Use a dummy head to remove special cases.",
        "Unlink a node safely.",
      ],
      keyTakeaways: [
        "Overwriting `next` destroys your only route to the rest of the list — save it first.",
        "A dummy node in front of the head makes operations on the first node ordinary.",
        "Reversal needs exactly three references: previous, current, next.",
      ],
      content: [
        h2("Reversal"),
        worked(
          "1 → 2 → 3 → null",
          "3 → 2 → 1 → null",
          [
            { state: "prev=null cur=1", note: "save 2, point 1 at null" },
            { state: "prev=1 cur=2", note: "save 3, point 2 at 1" },
            { state: "prev=2 cur=3", note: "save null, point 3 at 2" },
            { state: "cur=null", note: "prev is the new head" },
          ],
          "Three references, one pass"
        ),
        code(
          "python",
          `def reverse(head):
    prev = None
    node = head
    while node is not None:
        nxt = node.next     # save BEFORE overwriting
        node.next = prev
        prev = node
        node = nxt
    return prev             # not head: head is now the tail`,
          "Iterative reversal",
          [5, 9]
        ),
        warn(
          "Returning `head` after reversing returns the last node of the reversed list, which prints as a single element. The new head is `prev`.",
          "Return prev, not head"
        ),

        h2("The dummy head"),
        p(
          "Operations that might affect the first node otherwise need a branch for it. A throwaway node in front removes that asymmetry entirely."
        ),
        code(
          "python",
          `def remove_value(head, target):
    dummy = ListNode(0, head)   # now nothing is special about the first node
    prev = dummy
    while prev.next is not None:
        if prev.next.val == target:
            prev.next = prev.next.next   # unlink
        else:
            prev = prev.next
    return dummy.next`,
          "No special case for the head",
          [2]
        ),
        insight(
          "Whenever a linked-list operation makes you write \"but what if it is the head?\", reach for a dummy node. It converts the special case into the general one.",
          "When to use it"
        ),

        practice(["reverse-chain", "merge-two-chains", "drop-nth-from-end"], "Practise"),
        quizBlock("linked-lists"),
      ],
      patterns: ["two-pointers", "fast-slow-pointers"],
      problems: ["reverse-chain", "merge-two-chains", "drop-nth-from-end"],
      quiz: "linked-lists",
    },
  ],
};

/** 09 — Stacks & Queues. */
export const STACKS_QUEUES_SECTION: SectionSeed = {
  slug: "stacks-and-queues",
  title: "Stacks & Queues",
  summary:
    "Two ordering disciplines, and the monotonic stack that follows from one of them.",
  chapters: [
    {
      slug: "stacks",
      title: "Stacks",
      summary:
        "Last in, first out — and why that is the right shape for nesting.",
      difficulty: "EASY",
      readingMinutes: 5,
      objectives: [
        "Recognise problems whose structure is last-in-first-out.",
        "Use a stack for matching and nesting.",
        "Explain why the call stack is a stack.",
      ],
      keyTakeaways: [
        "A stack answers \"what was the most recent unfinished thing?\"",
        "Nesting is inherently last-in-first-out, which is why bracket matching is a stack walk.",
        "All operations are O(1).",
      ],
      content: [
        h2("The discipline"),
        p(
          "Push adds to the top, pop removes from the top. Nothing else is reachable. That restriction is the point: it exactly matches problems where the most recent unfinished item is the one that must be resolved next."
        ),
        complexity(
          [
            { operation: "Push", time: "O(1)", space: "O(1)" },
            { operation: "Pop", time: "O(1)", space: "O(1)" },
            { operation: "Peek", time: "O(1)", space: "O(1)" },
            { operation: "Search", time: "O(n)", space: "O(1)", note: "which is why you should not" },
          ],
          "Stack operations."
        ),

        h2("Nesting"),
        code(
          "python",
          `def is_balanced(text):
    partner = {")": "(", "]": "[", "}": "{"}
    open_brackets = []
    for char in text:
        if char in partner:
            if not open_brackets or open_brackets.pop() != partner[char]:
                return False
        else:
            open_brackets.append(char)
    return not open_brackets   # anything left was never closed`,
          "Bracket matching",
          [10]
        ),
        note(
          "Counting brackets is not enough: \"([)]\" has the right counts and the wrong order. The stack is what captures order."
        ),

        practice(["valid-nesting", "evaluate-postfix", "remove-adjacent-duplicates"], "Practise"),
      ],
      problems: ["valid-nesting", "evaluate-postfix", "remove-adjacent-duplicates"],
    },

    {
      slug: "queues-and-deques",
      title: "Queues and Deques",
      summary:
        "First in, first out — and the double-ended version that a window needs.",
      difficulty: "EASY",
      readingMinutes: 5,
      objectives: [
        "Recognise first-in-first-out structure.",
        "Use a deque to expire items from both ends.",
        "Avoid the accidental O(n) removal.",
      ],
      keyTakeaways: [
        "A queue processes items in arrival order, which suits level-by-level and expiry problems.",
        "A deque allows O(1) work at both ends, which a sliding window needs.",
        "Removing from the front of a plain list is O(n) — use a real deque.",
      ],
      content: [
        h2("Queues"),
        p(
          "Enqueue at the back, dequeue from the front. This is the shape of anything processed in arrival order: breadth-first search levels, request expiry, task scheduling."
        ),
        warn(
          "In Python, `list.pop(0)` is O(n) because every remaining element shifts. Use `collections.deque`. In Java use `ArrayDeque`, not `LinkedList`.",
          "The accidental quadratic"
        ),

        h2("Deques"),
        p(
          "A double-ended queue allows push and pop at both ends in constant time. That is what lets a sliding window discard stale items from the front while still pushing new candidates at the back."
        ),
        code(
          "python",
          `from collections import deque

live = deque()
live.append(x)      # push right
live.appendleft(x)  # push left
live.pop()          # pop right
live.popleft()      # pop left — O(1), unlike list.pop(0)`,
          "The four operations"
        ),

        practice(["queue-from-two-stacks", "recent-request-counter"], "Practise"),
      ],
      problems: ["queue-from-two-stacks", "recent-request-counter"],
    },

    {
      slug: "monotonic-stack",
      title: "The Monotonic Stack",
      summary:
        "Keep only the elements that can still matter, and popping becomes the answer.",
      difficulty: "MEDIUM",
      readingMinutes: 8,
      objectives: [
        "Use a stack kept in sorted order to answer next-greater questions in one pass.",
        "Explain the amortised argument for linearity.",
        "Extend the idea to a monotonic deque for windowed maxima.",
      ],
      keyTakeaways: [
        "Popping is the discovery event: when x is popped because y arrived, y is x's next greater element.",
        "Each index is pushed once and popped once, so the nested loop is amortised linear.",
        "Store indices, not values, whenever a distance or width is needed.",
      ],
      content: [
        h2("The idea"),
        p(
          "Push elements onto a stack, but before each push remove everything the newcomer makes irrelevant. What remains is sorted, and each removal tells you something."
        ),
        code(
          "python",
          `def next_greater(nums):
    result = [-1] * len(nums)
    stack = []                      # indices, values strictly decreasing

    for index, value in enumerate(nums):
        while stack and nums[stack[-1]] < value:
            result[stack.pop()] = value   # THIS is the discovery
        stack.append(index)

    return result`,
          "Next greater element",
          [7]
        ),
        concept(
          "Popping is the answer, not cleanup",
          "It is tempting to read the while loop as tidying up before the push. It is not: the moment an element is popped, you have just learned its next greater element. Write the answer there."
        ),
        concept(
          "Why the nested loop is linear",
          "Each index is pushed exactly once and popped at most once. The inner while loop can run many times in one iteration, but across the whole scan it cannot run more than n times in total. That is an amortised argument, and it is why O(n) is correct despite the nesting."
        ),

        h2("The deque variant"),
        p(
          "A sliding-window maximum needs the same idea plus expiry from the front, because an element can leave the window without ever being beaten. That makes it a deque rather than a stack."
        ),
        worked(
          "rates = [1, 3, -1, -3, 5], k = 3",
          "[3, 3, 5]",
          [
            { state: "deque [1]", note: "push" },
            { state: "deque [3]", note: "3 beats 1, so 1 can never matter again" },
            { state: "deque [3, -1]", note: "-1 might matter once 3 expires" },
            { state: "deque [5]", note: "5 beats everything present" },
          ],
          "Only useful candidates survive"
        ),

        recognise(
          "Each element needs to know about the nearest larger or smaller element in some direction.",
          [
            "Next or previous greater / smaller element",
            "Spans, histogram areas, trapped water",
            "An element stops mattering once a bigger one appears after it",
            "Comparing each element against an unknown number of neighbours",
          ],
          "monotonic-stack",
          "Elements that are dominated by a later arrival can never be an answer again, so discarding them keeps the stack sorted and every pop resolves exactly one query."
        ),

        quizBlock("monotonic-stack"),
        practice(["warmest-day-ahead", "sliding-window-maximum", "stack-with-minimum"], "Practise"),
      ],
      patterns: ["monotonic-stack"],
      problems: ["warmest-day-ahead", "sliding-window-maximum", "stack-with-minimum"],
      quiz: "monotonic-stack",
    },
  ],
};

/** 10 — Recursion. */
export const RECURSION_SECTION: SectionSeed = {
  slug: "recursion",
  title: "Recursion",
  summary:
    "Solving a problem in terms of a smaller version of itself, and knowing when to stop.",
  chapters: [
    {
      slug: "base-and-recursive-cases",
      title: "Base Cases and Recursive Cases",
      summary:
        "The two halves of every recursive function, and why trusting the recursion is the skill.",
      difficulty: "EASY",
      readingMinutes: 7,
      objectives: [
        "Identify the base case and the recursive case of a problem.",
        "Write a recursion that provably terminates.",
        "Trust a recursive call instead of tracing it.",
      ],
      keyTakeaways: [
        "Every recursion needs a base case that returns without recursing, and a recursive case that makes the problem strictly smaller.",
        "If the problem does not shrink, the recursion does not terminate.",
        "Assume the recursive call works, and only verify that combining its result is correct.",
      ],
      content: [
        h2("The two halves"),
        code(
          "python",
          `def total(nums, index=0):
    if index == len(nums):   # base case: returns without recursing
        return 0
    # recursive case: strictly smaller problem, plus the combining step
    return nums[index] + total(nums, index + 1)`,
          "Both halves, labelled",
          [2, 3, 5]
        ),
        concept(
          "The leap of faith",
          "Do not trace the call stack. Assume total(nums, index + 1) correctly returns the sum of the rest, then ask only whether adding nums[index] to it gives the right answer. If the base case is right and the combining step is right, the whole thing is right by induction."
        ),
        tip(
          "Tracing recursion by hand is how people convince themselves it is hard. Checking the base case and the combining step is how people write it quickly.",
          "Stop tracing"
        ),

        h2("The call stack"),
        p(
          "Each pending call holds a frame: parameters, locals, and where to return to. A recursion n levels deep therefore uses O(n) memory even if it allocates nothing."
        ),
        warn(
          "A recursion over 100,000 elements will exhaust the stack in most languages. That is a crash, not a slowdown. Convert to iteration when the depth is proportional to a large input.",
          "Depth is a hard limit"
        ),

        h2("When the same subproblem recurs"),
        p(
          "If the recursion tree contains the same arguments many times, the work is exponential for no reason. Storing each answer the first time it is computed collapses it."
        ),
        worked(
          "routes(5) computed naively",
          "routes(2) is recomputed 3 times",
          [
            { state: "routes(5)", note: "calls routes(4) and routes(3)" },
            { state: "routes(4)", note: "calls routes(3) and routes(2)" },
            { state: "routes(3)", note: "computed twice already" },
            { state: "routes(2)", note: "and this one three times" },
          ],
          "Overlapping subproblems"
        ),
        insight(
          "Overlapping subproblems plus optimal substructure is the definition of dynamic programming. Memoising a recursion is the easiest way to get there, and usually the clearest.",
          "Where this leads"
        ),

        practice(["count-climb-routes"], "Practise"),
        quizBlock("recursion"),
      ],
      patterns: ["dynamic-programming"],
      problems: ["count-climb-routes"],
      quiz: "recursion",
    },

    {
      slug: "backtracking-introduction",
      title: "Introducing Backtracking",
      summary:
        "Choose, explore, un-choose — and prune before you build something impossible.",
      difficulty: "MEDIUM",
      readingMinutes: 8,
      objectives: [
        "Write the choose / explore / un-choose loop correctly.",
        "Prune a branch the moment it cannot lead to a solution.",
        "Explain why the result must be copied rather than appended by reference.",
      ],
      keyTakeaways: [
        "The un-choose step is what lets one mutable buffer serve the whole search tree.",
        "Enforcing validity during construction beats generating everything and filtering.",
        "Append a copy of the working buffer, not the buffer itself.",
      ],
      content: [
        h2("The shape"),
        code(
          "python",
          `def subsets(nums):
    results = []
    current = []

    def explore(start):
        results.append(current[:])      # a COPY — current keeps mutating

        for i in range(start, len(nums)):
            current.append(nums[i])     # choose
            explore(i + 1)              # explore
            current.pop()               # un-choose

    explore(0)
    return results`,
          "Choose, explore, un-choose",
          [6, 9, 10, 11]
        ),
        warn(
          "Appending `current` instead of `current[:]` stores a reference to the buffer. Every result then aliases the same list, and they all end up empty once the search unwinds.",
          "Copy, do not alias"
        ),
        concept(
          "Why un-choose exists",
          "Without it you would have to copy the state at every node of the tree. Undoing the last decision lets a single buffer represent the current path, so the memory is O(depth) rather than O(nodes)."
        ),

        h2("Pruning"),
        p(
          "Generating every candidate and filtering at the end explores branches that were doomed from their second decision. If validity can be tested on a partial candidate, enforce it during construction."
        ),
        code(
          "python",
          `def balanced_brackets(n):
    results = []

    def build(current, opened, closed):
        if len(current) == 2 * n:
            results.append(current)
            return
        if opened < n:                 # legal to open
            build(current + "(", opened + 1, closed)
        if closed < opened:            # legal to close ONLY while something is open
            build(current + ")", opened, closed + 1)

    build("", 0, 0)
    return results`,
          "Invalid candidates are never built",
          [9, 10]
        ),
        insight(
          "That one condition — closed < opened — is the difference between exploring 2^(2n) arrangements and exploring only the valid ones. Pruning is not an optimisation here; it is what makes the search finish.",
          "Pruning is the algorithm"
        ),

        h2("Common mistakes"),
        ul(
          "Undoing only part of the state — popping the value but forgetting to clear a used flag.",
          "Passing `start` where `i + 1` was needed, turning combinations into permutations or vice versa.",
          "Generating then filtering, when the constraint could have been enforced during construction.",
          "Forgetting to return after recording a complete solution, so the search continues past a leaf.",
        ),

        practice(["generate-balanced-groupings", "count-subsets-with-sum"], "Practise"),
      ],
      patterns: ["backtracking"],
      problems: ["generate-balanced-groupings", "count-subsets-with-sum"],
    },
  ],
};
