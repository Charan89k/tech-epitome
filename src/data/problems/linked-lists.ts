import { example, para, rich, type ProblemSeed } from "./types";

/**
 * Linked list problems.
 *
 * These use the `list` signature type, so the harness builds genuine nodes
 * and the learner reassigns real pointers. Handing over an array and calling
 * it a linked list would teach the wrong lesson entirely.
 */
export const LINKED_LIST_PROBLEMS: ProblemSeed[] = [
  {
    slug: "reverse-chain",
    title: "Reverse the Chain",
    difficulty: "EASY",
    learningObjective:
      "Reassign pointers one node at a time while keeping hold of the rest of the list.",
    topics: ["linked-lists"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A processing chain is stored as a singly linked list, each node pointing to the next stage."
      ),
      para("Reverse the chain and return the new head."),
      example(
        "1 → 2 → 3 → null",
        "3 → 2 → 1 → null",
        [
          { state: "prev=null, node=1", note: "save 2, point 1 back at null" },
          { state: "prev=1, node=2", note: "save 3, point 2 back at 1" },
          { state: "prev=2, node=3", note: "save null, point 3 back at 2" },
          { state: "node=null", note: "prev is the new head" },
        ],
        "Save the next pointer before overwriting it"
      ),
    ],
    constraints: [
      "0 ≤ number of nodes ≤ 100000",
      "-10000 ≤ node value ≤ 10000",
      "The reversal must use O(1) extra space.",
    ],
    signature: {
      params: ["list"],
      paramNames: ["head"],
      returns: "list",
      functionName: "reverseChain",
    },
    tests: [
      { input: "1 2 3 4 5", expected: "5 4 3 2 1", isSample: true },
      { input: "1 2", expected: "2 1", isSample: true },
      { input: "", expected: "", isSample: true, explanation: "An empty chain reverses to an empty chain." },
      { input: "7", expected: "7" },
      { input: "-1 0 1", expected: "1 0 -1" },
      { input: "3 3 3", expected: "3 3 3" },
      { input: "1 2 3 4 5 6 7 8 9 10", expected: "10 9 8 7 6 5 4 3 2 1" },
    ],
    hints: [
      "To reverse a link you overwrite a node's next pointer. What do you lose the moment you do that?",
      "Access to the rest of the list. So save it first.",
      "Three references are enough: the node before, the node now, and the node after.",
      "Advance all three each iteration. When the current node is null, the previous one is the new head.",
    ],
    solutions: [
      {
        title: "Iterative pointer reversal",
        order: 1,
        intuition:
          "Reversing a linked list is a bookkeeping problem, not an algorithmic one. The single hazard is that overwriting `node.next` destroys your only route to the remainder of the list, so the very first thing each iteration must do is save it.",
        approach: [
          "Start with prev = null and node = head.",
          "Save node.next before touching it.",
          "Point node.next back at prev.",
          "Advance prev to node and node to the saved next.",
          "Return prev when node becomes null.",
        ],
        code: {
          PYTHON: `def reverseChain(head: Optional[ListNode]) -> Optional[ListNode]:
    prev = None
    node = head

    while node is not None:
        # Save the rest of the list BEFORE overwriting the pointer to it.
        nxt = node.next
        node.next = prev
        prev = node
        node = nxt

    # node is None, so prev is the last node visited: the new head.
    return prev`,
          JAVA: `class Solution {
    public ListNode reverseChain(ListNode head) {
        ListNode prev = null;
        ListNode node = head;

        while (node != null) {
            ListNode next = node.next;
            node.next = prev;
            prev = node;
            node = next;
        }

        return prev;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "An empty list, where the loop never runs and null is returned.",
          "A single node, which reverses to itself.",
          "Duplicate values, which do not affect pointer logic.",
        ],
        commonMistakes: [
          "Overwriting node.next before saving it, which severs the rest of the list.",
          "Returning head, which after the loop points at the last node of the reversed list.",
          "Recursing on a long list and overflowing the call stack.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "middle-of-chain",
    title: "Middle of the Chain",
    difficulty: "EASY",
    learningObjective:
      "Find a positional landmark in one pass using two pointers at different speeds.",
    topics: ["linked-lists"],
    patterns: ["fast-slow-pointers"],
    statement: [
      para(
        "A diagnostic tool needs the middle node of a processing chain without first measuring its length."
      ),
      para(
        "Return the chain starting from the middle node. When the chain has an even number of nodes, return the second of the two middle nodes."
      ),
      example(
        "1 → 2 → 3 → 4 → 5",
        "3 → 4 → 5",
        [
          { state: "slow=1, fast=1", note: "start together" },
          { state: "slow=2, fast=3", note: "slow one step, fast two" },
          { state: "slow=3, fast=5", note: "fast at the end, slow at the middle" },
        ],
        "Fast moves twice as far, so slow lands halfway"
      ),
    ],
    constraints: [
      "1 ≤ number of nodes ≤ 100000",
      "-10000 ≤ node value ≤ 10000",
      "One pass only.",
    ],
    signature: {
      params: ["list"],
      paramNames: ["head"],
      returns: "list",
      functionName: "middleOfChain",
    },
    tests: [
      { input: "1 2 3 4 5", expected: "3 4 5", isSample: true },
      { input: "1 2 3 4 5 6", expected: "4 5 6", isSample: true, explanation: "Even length, so the second middle node is returned." },
      { input: "1", expected: "1", isSample: true },
      { input: "1 2", expected: "2" },
      { input: "1 2 3", expected: "2 3" },
      { input: "5 4 3 2 1", expected: "3 2 1" },
      { input: "1 2 3 4 5 6 7 8", expected: "5 6 7 8" },
    ],
    hints: [
      "Counting the nodes and then walking half way works, but takes two passes.",
      "If one pointer moves twice as fast as another, what is true when the fast one reaches the end?",
      "The slow one has covered exactly half the distance.",
      "Watch the loop condition: check the fast pointer AND its next before stepping twice.",
    ],
    solutions: [
      {
        title: "Fast and slow pointers",
        order: 1,
        intuition:
          "Relative speed converts a distance question into a termination question. You never need to know the length: when the fast pointer runs out of list having covered twice the ground, the slow pointer is by definition at the halfway mark.",
        approach: [
          "Start both pointers at the head.",
          "While fast and fast.next both exist, advance slow one step and fast two.",
          "Return slow.",
        ],
        code: {
          PYTHON: `def middleOfChain(head: Optional[ListNode]) -> Optional[ListNode]:
    slow = head
    fast = head

    # Checking fast BEFORE fast.next matters: on an even-length list the
    # second test would otherwise dereference None.
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next

    return slow`,
          JAVA: `class Solution {
    public ListNode middleOfChain(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }

        return slow;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A single node, returned as-is.",
          "An even number of nodes, where the loop condition decides which middle you get.",
          "Two nodes, returning the second.",
        ],
        commonMistakes: [
          "Testing fast.next before fast, which dereferences null.",
          "Starting fast at head.next, which returns the first middle node instead of the second.",
          "Measuring the length first, which is correct but not one pass.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "merge-two-chains",
    title: "Merge Two Sorted Chains",
    difficulty: "EASY",
    learningObjective:
      "Use a dummy head so the first node needs no special case.",
    topics: ["linked-lists"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "Two sorted processing chains must be combined into a single sorted chain, reusing the existing nodes."
      ),
      para("Return the head of the merged chain."),
      example(
        "a = 1 → 3 → 5, b = 2 → 4",
        "1 → 2 → 3 → 4 → 5",
        [
          { state: "compare 1 and 2", note: "take 1" },
          { state: "compare 3 and 2", note: "take 2" },
          { state: "compare 3 and 4", note: "take 3" },
          { state: "b exhausted", note: "append the rest of a" },
        ],
        "Always take the smaller head"
      ),
    ],
    constraints: [
      "0 ≤ nodes in each chain ≤ 100000",
      "Both chains are sorted in non-decreasing order.",
      "-10000 ≤ node value ≤ 10000",
    ],
    signature: {
      params: ["list", "list"],
      paramNames: ["a", "b"],
      returns: "list",
      functionName: "mergeChains",
    },
    tests: [
      { input: "1 3 5\n2 4", expected: "1 2 3 4 5", isSample: true },
      { input: "\n1 2", expected: "1 2", isSample: true, explanation: "One chain empty." },
      { input: "\n", expected: "", isSample: true },
      { input: "1\n1", expected: "1 1" },
      { input: "1 2 3\n4 5 6", expected: "1 2 3 4 5 6" },
      { input: "4 5 6\n1 2 3", expected: "1 2 3 4 5 6" },
      { input: "-5 0\n-3 2", expected: "-5 -3 0 2" },
      { input: "2 2 2\n2 2", expected: "2 2 2 2 2" },
    ],
    hints: [
      "At each step, which node must come next in the output?",
      "The smaller of the two current heads.",
      "Handling the very first node separately makes the code messy. Is there a way to avoid that?",
      "Start with a throwaway node in front. Build after it, then return its next.",
    ],
    solutions: [
      {
        title: "Dummy head, then splice the remainder",
        order: 1,
        intuition:
          "The merge itself is obvious; what makes the code ugly is the first node, because there is nothing to attach it to yet. A dummy node removes that asymmetry — every append, including the first, is identical. At the end one chain still has nodes left, and because both were sorted the whole remainder can be attached in one move.",
        approach: [
          "Create a dummy node and a tail pointer at it.",
          "While both chains have nodes, append the smaller head and advance that chain.",
          "Attach whichever chain still has nodes.",
          "Return dummy.next.",
        ],
        code: {
          PYTHON: `def mergeChains(a: Optional[ListNode], b: Optional[ListNode]) -> Optional[ListNode]:
    # The dummy removes the "is this the first node?" special case.
    dummy = ListNode(0)
    tail = dummy

    while a is not None and b is not None:
        if a.val <= b.val:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next

    # One chain is exhausted; the other is already sorted, so splice it whole.
    tail.next = a if a is not None else b

    return dummy.next`,
          JAVA: `class Solution {
    public ListNode mergeChains(ListNode a, ListNode b) {
        ListNode dummy = new ListNode(0);
        ListNode tail = dummy;

        while (a != null && b != null) {
            if (a.val <= b.val) {
                tail.next = a;
                a = a.next;
            } else {
                tail.next = b;
                b = b.next;
            }
            tail = tail.next;
        }

        tail.next = (a != null) ? a : b;

        return dummy.next;
    }
}`,
        },
        timeComplexity: "O(n + m)",
        spaceComplexity: "O(1) — nodes are relinked, not copied",
        edgeCases: [
          "Either chain empty.",
          "Both chains empty.",
          "Equal values, where using ≤ keeps the merge stable.",
          "One chain entirely smaller than the other.",
        ],
        commonMistakes: [
          "Forgetting to attach the leftover chain, truncating the result.",
          "Returning dummy instead of dummy.next, prefixing a spurious node.",
          "Allocating new nodes, which the problem does not need.",
        ],
      },
    ],
    expectedTime: "O(n + m)",
    expectedSpace: "O(1)",
  },

  {
    slug: "drop-nth-from-end",
    title: "Drop the Nth Stage from the End",
    difficulty: "MEDIUM",
    learningObjective:
      "Maintain a fixed gap between two pointers to locate a position relative to the end in one pass.",
    topics: ["linked-lists"],
    patterns: ["fast-slow-pointers"],
    statement: [
      para(
        "A stage must be removed from a processing chain, identified by its distance from the end rather than from the start."
      ),
      rich("Remove the ", { code: "n" }, "-th stage counting from the end and return the head of the resulting chain."),
      example(
        "1 → 2 → 3 → 4 → 5, n = 2",
        "1 → 2 → 3 → 5",
        [
          { state: "advance lead 2 steps", note: "lead at 3" },
          { state: "move both to the end", note: "trail lands just before 4" },
          { state: "unlink", note: "trail.next = trail.next.next" },
        ],
        "A fixed gap converts 'from the end' into 'from here'"
      ),
    ],
    constraints: [
      "1 ≤ number of nodes ≤ 100000",
      "1 ≤ n ≤ number of nodes",
      "One pass only.",
    ],
    signature: {
      params: ["list", "int"],
      paramNames: ["head", "n"],
      returns: "list",
      functionName: "dropFromEnd",
    },
    tests: [
      { input: "1 2 3 4 5\n2", expected: "1 2 3 5", isSample: true },
      { input: "1\n1", expected: "", isSample: true, explanation: "Removing the only node leaves an empty chain." },
      { input: "1 2\n1", expected: "1", isSample: true },
      { input: "1 2\n2", expected: "2" },
      { input: "1 2 3\n3", expected: "2 3" },
      { input: "1 2 3 4 5\n5", expected: "2 3 4 5" },
      { input: "9 8 7 6\n2", expected: "9 8 6" },
    ],
    hints: [
      "Counting the length first and then walking works, but is two passes.",
      "If one pointer starts n steps ahead of another, what happens when the leader reaches the end?",
      "The trailing pointer is exactly n from the end.",
      "To unlink a node you need the node BEFORE it, so offset the gap by one — and consider using a dummy head so removing the first node is not a special case.",
    ],
    solutions: [
      {
        title: "Two pointers with a fixed gap",
        order: 1,
        intuition:
          "Position from the end is awkward because a singly linked list has no way to look backwards. A fixed gap between two pointers converts it into a position relative to the leader, which you can reach going forward. A dummy head handles the case where the node to remove is the first one, which otherwise needs its own branch.",
        approach: [
          "Create a dummy node in front of the head.",
          "Advance a lead pointer n + 1 steps from the dummy.",
          "Move lead and trail together until lead is null.",
          "Trail is now just before the node to remove; unlink it.",
          "Return dummy.next.",
        ],
        code: {
          PYTHON: `def dropFromEnd(head: Optional[ListNode], n: int) -> Optional[ListNode]:
    dummy = ListNode(0, head)   # makes removing the first node ordinary
    lead = dummy
    trail = dummy

    # n + 1, not n: trail must land on the node BEFORE the target.
    for _ in range(n + 1):
        if lead is None:
            return head
        lead = lead.next

    while lead is not None:
        lead = lead.next
        trail = trail.next

    trail.next = trail.next.next
    return dummy.next`,
          JAVA: `class Solution {
    public ListNode dropFromEnd(ListNode head, int n) {
        ListNode dummy = new ListNode(0, head);
        ListNode lead = dummy;
        ListNode trail = dummy;

        for (int i = 0; i <= n; i++) {
            if (lead == null) return head;
            lead = lead.next;
        }

        while (lead != null) {
            lead = lead.next;
            trail = trail.next;
        }

        trail.next = trail.next.next;
        return dummy.next;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Removing the only node, leaving an empty chain.",
          "Removing the head, which the dummy makes ordinary.",
          "Removing the tail.",
        ],
        commonMistakes: [
          "Advancing the lead n steps instead of n + 1, so the trail lands on the target rather than before it.",
          "Skipping the dummy and needing a special branch for removing the head.",
          "Two passes, when the gap trick does it in one.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "chain-has-loop",
    title: "Does the Chain Loop?",
    difficulty: "MEDIUM",
    learningObjective:
      "Detect a cycle in constant space by reasoning about relative speed.",
    topics: ["linked-lists"],
    patterns: ["fast-slow-pointers"],
    statement: [
      para(
        "A malformed configuration can make a processing chain point back into itself, so following it never terminates."
      ),
      rich(
        "The input describes the node values plus a ",
        { code: "loopIndex" },
        ": the position the last node links back to, or ",
        { code: "-1" },
        " for no loop. Return ",
        { code: "true" },
        " if the chain loops."
      ),
      para(
        "Note that the input arrives as a plain value list and a loop index, so your function receives the values and the index rather than a pre-built cyclic list."
      ),
      example(
        "values = [3, 2, 0, -4], loopIndex = 1",
        "true",
        [
          { state: "slow=3, fast=3", note: "start together" },
          { state: "slow=2, fast=0", note: "one step vs two" },
          { state: "slow=0, fast=2", note: "fast has wrapped around" },
          { state: "slow=-4, fast=-4", note: "they meet — a loop exists" },
        ],
        "The gap closes by one each step, so inside a loop they must meet"
      ),
    ],
    constraints: [
      "0 ≤ number of nodes ≤ 100000",
      "-100000 ≤ node value ≤ 100000",
      "-1 ≤ loopIndex < number of nodes",
      "O(1) extra space.",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["values", "loopIndex"],
      returns: "bool",
      functionName: "chainLoops",
      // The learner builds the chain themselves here, so the node type must
      // still be declared even though no parameter is a list.
      needsListNode: true,
    },
    tests: [
      { input: "3 2 0 -4\n1", expected: "true", isSample: true, explanation: "The tail links back to index 1." },
      { input: "1 2\n0", expected: "true", isSample: true },
      { input: "1 2 3\n-1", expected: "false", isSample: true },
      { input: "\n-1", expected: "false" },
      { input: "1\n-1", expected: "false" },
      { input: "1\n0", expected: "true" },
      { input: "1 2 3 4 5\n4", expected: "true" },
      { input: "1 2 3 4 5\n-1", expected: "false" },
    ],
    hints: [
      "A visited set would work but costs O(n) memory. The constraint rules it out.",
      "Imagine two runners on a circular track at different speeds. What eventually happens?",
      "The faster one laps the slower one. On a straight track it simply reaches the end.",
      "Move one pointer one step and the other two. If they ever coincide, there is a loop; if the fast one hits the end, there is not.",
    ],
    solutions: [
      {
        title: "Floyd's cycle detection",
        order: 1,
        intuition:
          "The fast pointer gains exactly one position on the slow pointer per iteration. If the structure is a straight line, the fast one runs off the end. If it is a loop, both pointers end up inside it and the gap shrinks by one each step, so it must eventually reach zero — they meet. No memory of visited nodes is required.",
        approach: [
          "Build the chain from the values and link the tail back if loopIndex is not -1.",
          "Start both pointers at the head.",
          "Advance slow by one and fast by two while fast and fast.next exist.",
          "Return true if they ever reference the same node.",
          "Return false if fast reaches the end.",
        ],
        code: {
          PYTHON: `def chainLoops(values: List[int], loopIndex: int) -> bool:
    if not values:
        return False

    # Build the chain, then close the loop if asked.
    nodes = [ListNode(v) for v in values]
    for i in range(len(nodes) - 1):
        nodes[i].next = nodes[i + 1]
    if loopIndex >= 0:
        nodes[-1].next = nodes[loopIndex]

    slow = fast = nodes[0]
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        # Identity, not value: two nodes can hold the same number.
        if slow is fast:
            return True

    return False`,
          JAVA: `class Solution {
    public boolean chainLoops(int[] values, int loopIndex) {
        if (values.length == 0) return false;

        ListNode[] nodes = new ListNode[values.length];
        for (int i = 0; i < values.length; i++) nodes[i] = new ListNode(values[i]);
        for (int i = 0; i + 1 < values.length; i++) nodes[i].next = nodes[i + 1];
        if (loopIndex >= 0) nodes[values.length - 1].next = nodes[loopIndex];

        ListNode slow = nodes[0];
        ListNode fast = nodes[0];

        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }

        return false;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1) for the detection itself",
        edgeCases: [
          "An empty chain.",
          "A single node looping to itself.",
          "A single node with no loop.",
          "A loop covering the whole chain.",
        ],
        commonMistakes: [
          "Comparing node values rather than node identity, which reports a false loop on duplicates.",
          "Checking fast.next before fast.",
          "Using a visited set, which works but violates the space constraint.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },
];
