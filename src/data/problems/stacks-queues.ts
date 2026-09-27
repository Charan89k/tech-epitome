import { example, para, rich, type ProblemSeed } from "./types";

/** Stacks, queues, deques, and the monotonic stack. */
export const STACK_QUEUE_PROBLEMS: ProblemSeed[] = [
  {
    slug: "evaluate-postfix",
    title: "Evaluate a Postfix Formula",
    difficulty: "MEDIUM",
    learningObjective:
      "Recognise that postfix evaluation is a stack walk with no parsing required.",
    topics: ["stacks"],
    patterns: ["monotonic-stack"],
    statement: [
      para(
        "A spreadsheet stores formulas in postfix form: operands come first, and an operator applies to the two most recent values."
      ),
      rich(
        "Evaluate the formula. Tokens are integers or one of ",
        { code: "+ - * /" },
        ". Division truncates toward zero."
      ),
      example(
        'tokens = ["4", "13", "5", "/", "+"]',
        "6",
        [
          { state: "[4]", note: "push 4" },
          { state: "[4, 13]", note: "push 13" },
          { state: "[4, 13, 5]", note: "push 5" },
          { state: "[4, 2]", note: "13 / 5 = 2" },
          { state: "[6]", note: "4 + 2 = 6" },
        ],
        "Operators consume the top two values"
      ),
    ],
    constraints: [
      "1 ≤ number of tokens ≤ 10000",
      "The formula is always valid.",
      "Intermediate values fit in a 32-bit signed integer.",
    ],
    signature: {
      params: ["string[]"],
      paramNames: ["tokens"],
      returns: "int",
      functionName: "evaluatePostfix",
    },
    tests: [
      { input: "5\n4\n13\n5\n/\n+", expected: "6", isSample: true, explanation: "4 + (13 / 5) = 4 + 2 = 6." },
      { input: "5\n2\n1\n+\n3\n*", expected: "9", isSample: true, explanation: "(2 + 1) * 3 = 9." },
      { input: "1\n42", expected: "42", isSample: true },
      { input: "3\n7\n2\n/", expected: "3" },
      { input: "3\n-7\n2\n/", expected: "-3" },
      { input: "3\n3\n5\n-", expected: "-2" },
      { input: "8\n10\n6\n9\n3\n+\n-11\n*\n/", expected: "0" },
    ],
    hints: [
      "When you meet an operator, which two numbers does it apply to?",
      "The two most recently produced values — a last-in, first-out rule.",
      "Push numbers; on an operator, pop two, combine, push the result.",
      "Order matters for subtraction and division: the first value popped is the right-hand operand.",
    ],
    solutions: [
      {
        title: "Operand stack",
        order: 1,
        intuition:
          "Postfix exists precisely because it needs no precedence rules and no parentheses — the order of the tokens already encodes the order of operations. That makes evaluation a single pass over a stack, and the only thing to be careful about is operand order for the non-commutative operators.",
        approach: [
          "Push each numeric token.",
          "On an operator, pop the right operand then the left operand.",
          "Apply the operator and push the result.",
          "The final remaining value is the answer.",
        ],
        code: {
          PYTHON: `def evaluatePostfix(tokens: List[str]) -> int:
    stack = []

    for token in tokens:
        if token not in ("+", "-", "*", "/"):
            stack.append(int(token))
            continue

        # The FIRST pop is the right-hand operand.
        right = stack.pop()
        left = stack.pop()

        if token == "+":
            stack.append(left + right)
        elif token == "-":
            stack.append(left - right)
        elif token == "*":
            stack.append(left * right)
        else:
            # Python's // floors; the spec wants truncation toward zero.
            stack.append(int(left / right))

    return stack[-1]`,
          JAVA: `class Solution {
    public int evaluatePostfix(String[] tokens) {
        Deque<Integer> stack = new ArrayDeque<>();

        for (String token : tokens) {
            switch (token) {
                case "+": case "-": case "*": case "/": {
                    int right = stack.pop();
                    int left = stack.pop();
                    stack.push(switch (token) {
                        case "+" -> left + right;
                        case "-" -> left - right;
                        case "*" -> left * right;
                        default  -> left / right;   // Java truncates toward zero
                    });
                    break;
                }
                default:
                    stack.push(Integer.parseInt(token));
            }
        }

        return stack.pop();
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A single number with no operators.",
          "Negative operands, where token \"-5\" is a number and \"-\" is an operator.",
          "Negative division, which must truncate toward zero rather than floor.",
        ],
        commonMistakes: [
          "Popping the operands in the wrong order, which breaks subtraction and division.",
          "Using floor division in Python, giving -4 instead of -3 for -7 / 2.",
          "Treating \"-5\" as the subtraction operator when checking whether a token is numeric.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "stack-with-minimum",
    title: "Stack With Instant Minimum",
    difficulty: "MEDIUM",
    learningObjective:
      "Store extra state alongside each entry so a query that looks global becomes local.",
    topics: ["stacks"],
    patterns: ["monotonic-stack"],
    statement: [
      para(
        "A monitoring stack must report the smallest value it currently holds, in constant time, alongside the usual push and pop."
      ),
      rich(
        "The input is a list of operations encoded as integers: a value ",
        { code: "≥ 0" },
        " means push that value, ",
        { code: "-1" },
        " means pop, and ",
        { code: "-2" },
        " means record the current minimum."
      ),
      para("Return the recorded minimums in order."),
      example(
        "ops = [5, 3, -2, -1, -2]",
        "[3, 5]",
        [
          { state: "push 5", note: "stack [5], min 5" },
          { state: "push 3", note: "stack [5,3], min 3" },
          { state: "query", note: "record 3" },
          { state: "pop", note: "stack [5], min back to 5" },
          { state: "query", note: "record 5" },
        ],
        "The minimum must survive a pop"
      ),
    ],
    constraints: [
      "1 ≤ number of operations ≤ 100000",
      "0 ≤ pushed value ≤ 1000000",
      "A pop or query is never issued on an empty stack.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["ops"],
      returns: "int[]",
      functionName: "runMinStack",
    },
    tests: [
      { input: "5 3 -2 -1 -2", expected: "3 5", isSample: true },
      { input: "1 -2", expected: "1", isSample: true },
      { input: "3 2 1 -2 -1 -2 -1 -2", expected: "1 2 3" },
      { input: "7 7 -2 -1 -2", expected: "7 7" },
      { input: "5 1 5 -2 -1 -2", expected: "1 1" },
      { input: "0 -2", expected: "0" },
      { input: "9 8 7 6 -2", expected: "6" },
    ],
    hints: [
      "Scanning the stack for its minimum on every query is O(n). You need O(1).",
      "A single 'current minimum' variable breaks as soon as you pop the element that was the minimum.",
      "What was the minimum before that element was pushed? If you knew that, popping would be easy.",
      "Store, with each element, the minimum of the stack at the moment it was pushed.",
    ],
    solutions: [
      {
        title: "Store the running minimum with each entry",
        order: 1,
        intuition:
          "The difficulty is not finding the minimum, it is restoring it after a pop. A single variable cannot do that because the information about what came before has been thrown away. Pairing each element with the minimum as of its own push keeps exactly that history, so popping restores the previous minimum for free.",
        approach: [
          "Keep a stack of (value, minimumAtThatPoint) pairs.",
          "On push, the stored minimum is the smaller of the new value and the current top's minimum.",
          "On pop, remove the pair; the new top already carries the correct minimum.",
          "On query, read the top's stored minimum.",
        ],
        code: {
          PYTHON: `def runMinStack(ops: List[int]) -> List[int]:
    # Each entry is (value, minimum of the whole stack when it was pushed).
    stack: List[tuple] = []
    recorded = []

    for op in ops:
        if op == -1:
            stack.pop()
        elif op == -2:
            recorded.append(stack[-1][1])
        else:
            current_min = op if not stack else min(op, stack[-1][1])
            stack.append((op, current_min))

    return recorded`,
          JAVA: `class Solution {
    public int[] runMinStack(int[] ops) {
        Deque<int[]> stack = new ArrayDeque<>();
        List<Integer> recorded = new ArrayList<>();

        for (int op : ops) {
            if (op == -1) {
                stack.pop();
            } else if (op == -2) {
                recorded.add(stack.peek()[1]);
            } else {
                int currentMin = stack.isEmpty() ? op : Math.min(op, stack.peek()[1]);
                stack.push(new int[] { op, currentMin });
            }
        }

        int[] result = new int[recorded.size()];
        for (int i = 0; i < result.length; i++) result[i] = recorded.get(i);
        return result;
    }
}`,
        },
        timeComplexity: "O(1) per operation",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Duplicate minimums, where popping one must not lose the other.",
          "A single element.",
          "A strictly decreasing sequence, where every push sets a new minimum.",
        ],
        commonMistakes: [
          "Keeping one minimum variable, which becomes wrong after popping the minimum.",
          "Using a second stack that only pushes on a strict improvement, then mishandling duplicates on pop.",
          "Recomputing the minimum on query, which is O(n).",
        ],
      },
    ],
    expectedTime: "O(1) per operation",
    expectedSpace: "O(n)",
  },

  {
    slug: "queue-from-two-stacks",
    title: "Queue From Two Stacks",
    difficulty: "MEDIUM",
    learningObjective:
      "See how amortised analysis justifies an operation that is occasionally expensive.",
    topics: ["queues", "stacks"],
    patterns: ["monotonic-stack"],
    statement: [
      para(
        "A system exposes only stack primitives, but the application needs first-in-first-out behaviour."
      ),
      rich(
        "Simulate a queue using two stacks. The input encodes operations: a value ",
        { code: "≥ 0" },
        " enqueues it, and ",
        { code: "-1" },
        " dequeues and records the value."
      ),
      para("Return the dequeued values in order."),
      example(
        "ops = [1, 2, -1, 3, -1, -1]",
        "[1, 2, 3]",
        [
          { state: "in [1,2], out []", note: "two enqueues" },
          { state: "in [], out [2,1]", note: "first dequeue pours across" },
          { state: "out [2]", note: "1 comes off first" },
          { state: "in [3], out [2]", note: "enqueue 3 goes to the in-stack" },
        ],
        "Pour across only when the out-stack is empty"
      ),
    ],
    constraints: [
      "1 ≤ number of operations ≤ 100000",
      "0 ≤ enqueued value ≤ 1000000",
      "A dequeue is never issued on an empty queue.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["ops"],
      returns: "int[]",
      functionName: "runQueue",
    },
    tests: [
      { input: "1 2 -1 3 -1 -1", expected: "1 2 3", isSample: true },
      { input: "5 -1", expected: "5", isSample: true },
      { input: "1 2 3 -1 -1 -1", expected: "1 2 3" },
      { input: "1 -1 2 -1 3 -1", expected: "1 2 3" },
      { input: "0 -1", expected: "0" },
      { input: "1 2 -1 -1 3 4 -1 -1", expected: "1 2 3 4" },
      { input: "9 8 7 -1", expected: "9" },
    ],
    hints: [
      "A stack reverses order. What happens if you reverse twice?",
      "Pouring one stack into another reverses it, so the oldest element ends up on top.",
      "Use one stack for arrivals and another for departures.",
      "Only pour across when the departure stack is empty — pouring every time would be quadratic.",
    ],
    solutions: [
      {
        title: "In-stack and out-stack, poured lazily",
        order: 1,
        intuition:
          "A stack reverses; two stacks reverse twice, restoring the original order. The subtlety is when to pour. Pouring on every dequeue would move every element repeatedly. Pouring only when the out-stack is empty means each element moves across exactly once in its lifetime, so although one dequeue can cost O(n), the average over any sequence is O(1).",
        approach: [
          "Push arrivals onto the in-stack.",
          "To dequeue, first check the out-stack.",
          "If it is empty, pour the entire in-stack into it, reversing the order.",
          "Pop from the out-stack.",
        ],
        code: {
          PYTHON: `def runQueue(ops: List[int]) -> List[int]:
    incoming = []   # newest arrivals, newest on top
    outgoing = []   # reversed, so the oldest is on top
    recorded = []

    for op in ops:
        if op >= 0:
            incoming.append(op)
            continue

        if not outgoing:
            # Pour across ONLY when empty. Each element moves once, which
            # is what makes the amortised cost constant.
            while incoming:
                outgoing.append(incoming.pop())

        recorded.append(outgoing.pop())

    return recorded`,
          JAVA: `class Solution {
    public int[] runQueue(int[] ops) {
        Deque<Integer> incoming = new ArrayDeque<>();
        Deque<Integer> outgoing = new ArrayDeque<>();
        List<Integer> recorded = new ArrayList<>();

        for (int op : ops) {
            if (op >= 0) {
                incoming.push(op);
                continue;
            }

            if (outgoing.isEmpty()) {
                while (!incoming.isEmpty()) outgoing.push(incoming.pop());
            }

            recorded.add(outgoing.pop());
        }

        int[] result = new int[recorded.size()];
        for (int i = 0; i < result.length; i++) result[i] = recorded.get(i);
        return result;
    }
}`,
        },
        timeComplexity: "O(1) amortised per operation",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Alternating enqueue and dequeue, where the pour happens every time but moves one element.",
          "All enqueues then all dequeues, a single pour.",
          "A single element.",
        ],
        commonMistakes: [
          "Pouring on every dequeue regardless, making the whole thing quadratic.",
          "Pouring while the out-stack still has elements, which scrambles the order.",
          "Concluding the worst-case O(n) dequeue makes the structure slow; the amortised bound is what matters.",
        ],
      },
    ],
    expectedTime: "O(1) amortised",
    expectedSpace: "O(n)",
  },

  {
    slug: "remove-adjacent-duplicates",
    title: "Collapse Adjacent Duplicates",
    difficulty: "EASY",
    learningObjective:
      "Use a stack when removing an element can expose a new match behind it.",
    topics: ["stacks", "strings"],
    patterns: ["monotonic-stack"],
    statement: [
      para(
        "A text buffer collapses any two adjacent identical characters, repeatedly, until no such pair remains. Removing a pair can bring two new neighbours together, which may then collapse as well."
      ),
      para("Return the fully collapsed string."),
      example(
        'text = "abbaca"',
        '"ca"',
        [
          { state: '"abbaca"', note: "bb collapses" },
          { state: '"aaca"', note: "the new aa collapses" },
          { state: '"ca"', note: "nothing adjacent matches" },
        ],
        "Each removal can expose another"
      ),
    ],
    constraints: [
      "0 ≤ text.length ≤ 100000",
      "The string contains lowercase letters only.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["text"],
      returns: "string",
      functionName: "collapseDuplicates",
    },
    tests: [
      { input: "abbaca", expected: "ca", isSample: true },
      { input: "azxxzy", expected: "ay", isSample: true, explanation: "xx collapses, then the new zz collapses." },
      { input: "", expected: "", isSample: true },
      { input: "aa", expected: "" },
      { input: "abc", expected: "abc" },
      { input: "aaa", expected: "a" },
      { input: "aabbcc", expected: "" },
      { input: "abccba", expected: "" },
    ],
    hints: [
      "Repeatedly rescanning the string after each removal is quadratic.",
      "After removing a pair, which characters could newly become adjacent?",
      "The one just before the removed pair, and the one just after.",
      "Build the result as you go. Each new character only ever needs comparing with the last one kept — a stack does exactly that.",
    ],
    solutions: [
      {
        title: "Build the answer on a stack",
        order: 1,
        intuition:
          "Rescanning is wasteful because a removal only ever affects its immediate neighbourhood. If you build the output incrementally, the character to compare against is always the last one you kept. That is a stack, and cascading collapses happen naturally: popping exposes the previous survivor, which the next character will be compared against.",
        approach: [
          "Keep a stack of surviving characters.",
          "For each character, pop if it equals the top; otherwise push.",
          "Join the stack into the result.",
        ],
        code: {
          PYTHON: `def collapseDuplicates(text: str) -> str:
    survivors = []

    for char in text:
        # The only possible partner is the last survivor; popping it
        # automatically exposes the one before for the next comparison.
        if survivors and survivors[-1] == char:
            survivors.pop()
        else:
            survivors.append(char)

    return "".join(survivors)`,
          JAVA: `class Solution {
    public String collapseDuplicates(String text) {
        StringBuilder survivors = new StringBuilder();

        for (int i = 0; i < text.length(); i++) {
            char c = text.charAt(i);
            int last = survivors.length() - 1;
            if (last >= 0 && survivors.charAt(last) == c) {
                survivors.deleteCharAt(last);
            } else {
                survivors.append(c);
            }
        }

        return survivors.toString();
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "The empty string.",
          "Everything collapsing to nothing.",
          "A cascade, as in \"azxxzy\".",
          "An odd-length run such as \"aaa\", leaving one character.",
        ],
        commonMistakes: [
          "Rescanning the whole string after each removal.",
          "Checking whether the stack is empty after popping rather than before peeking.",
          "Using string concatenation to build the result, which is quadratic in some languages.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "sliding-window-maximum",
    title: "Rolling Peak",
    difficulty: "HARD",
    learningObjective:
      "Use a monotonic deque when a window summary cannot be undone in constant time.",
    topics: ["queues", "arrays"],
    patterns: ["monotonic-stack", "sliding-window"],
    statement: [
      para(
        "A load balancer reports the peak request rate over every window of a fixed width."
      ),
      rich("Return the maximum of every window of exactly ", { code: "k" }, " consecutive readings, in order."),
      example(
        "rates = [1, 3, -1, -3, 5, 3], k = 3",
        "[3, 3, 5, 5]",
        [
          { state: "[1,3,-1]", note: "max 3" },
          { state: "[3,-1,-3]", note: "max 3" },
          { state: "[-1,-3,5]", note: "max 5" },
          { state: "[-3,5,3]", note: "max 5" },
        ],
        "The maximum cannot simply be subtracted out"
      ),
    ],
    constraints: [
      "1 ≤ k ≤ rates.length ≤ 100000",
      "-10000 ≤ rates[i] ≤ 10000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["rates", "k"],
      returns: "int[]",
      functionName: "rollingPeak",
    },
    tests: [
      { input: "1 3 -1 -3 5 3\n3", expected: "3 3 5 5", isSample: true },
      { input: "1\n1", expected: "1", isSample: true },
      { input: "9 8 7 6\n2", expected: "9 8 7", isSample: true },
      { input: "1 2 3 4\n4", expected: "4" },
      { input: "4 3 2 1\n1", expected: "4 3 2 1" },
      { input: "-1 -2 -3\n2", expected: "-1 -2" },
      { input: "1 1 1 1\n2", expected: "1 1 1" },
      { input: "7 2 4\n2", expected: "7 4" },
    ],
    hints: [
      "A sum slides easily because subtraction undoes an addition. Can you undo a maximum the same way?",
      "No — once the maximum leaves the window you have no idea what the next largest was.",
      "Which elements in the window could ever become the maximum later?",
      "Only those with nothing larger after them. Keep exactly those, in decreasing order, in a deque.",
    ],
    solutions: [
      {
        title: "Monotonic deque of useful candidates",
        order: 1,
        intuition:
          "A plain sliding window fails because a maximum is not removable in constant time. The fix is to stop tracking the whole window and track only the elements that could still matter. If a later reading is larger, every earlier smaller reading is permanently irrelevant — it will leave the window no later than the bigger one. What remains is a decreasing sequence whose front is always the current maximum.",
        approach: [
          "Keep a deque of indices whose values are strictly decreasing.",
          "Before pushing a new index, pop from the back every index with a smaller or equal value.",
          "Pop from the front any index that has fallen out of the window.",
          "Once the first full window is formed, the front index holds that window's maximum.",
        ],
        code: {
          PYTHON: `from collections import deque


def rollingPeak(rates: List[int], k: int) -> List[int]:
    candidates = deque()   # indices; their values strictly decrease
    result = []

    for right, value in enumerate(rates):
        # Anything smaller than the newcomer can never be a maximum again:
        # it leaves the window no later than the newcomer does.
        while candidates and rates[candidates[-1]] <= value:
            candidates.pop()
        candidates.append(right)

        # Drop the front if it has slid out of the window.
        if candidates[0] <= right - k:
            candidates.popleft()

        if right >= k - 1:
            result.append(rates[candidates[0]])

    return result`,
          JAVA: `class Solution {
    public int[] rollingPeak(int[] rates, int k) {
        Deque<Integer> candidates = new ArrayDeque<>();
        int[] result = new int[rates.length - k + 1];
        int write = 0;

        for (int right = 0; right < rates.length; right++) {
            while (!candidates.isEmpty() && rates[candidates.peekLast()] <= rates[right]) {
                candidates.pollLast();
            }
            candidates.addLast(right);

            if (candidates.peekFirst() <= right - k) candidates.pollFirst();

            if (right >= k - 1) result[write++] = rates[candidates.peekFirst()];
        }

        return result;
    }
}`,
        },
        timeComplexity: "O(n) amortised — each index enters and leaves once",
        spaceComplexity: "O(k)",
        edgeCases: [
          "k = 1, where every reading is its own maximum.",
          "k equal to the array length, one window.",
          "A strictly decreasing array, where the deque grows to k.",
          "Duplicate values, which the ≤ comparison handles.",
        ],
        commonMistakes: [
          "Storing values instead of indices, making it impossible to tell when something leaves the window.",
          "Removing the out-of-window index from the back rather than the front.",
          "Recomputing the maximum per window, which is O(n·k).",
          "Emitting a result before the first full window has formed.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(k)",
  },

  {
    slug: "recent-request-counter",
    title: "Recent Request Counter",
    difficulty: "EASY",
    learningObjective:
      "Use a queue to expire entries that have aged out of a moving time range.",
    topics: ["queues"],
    patterns: ["sliding-window"],
    statement: [
      para(
        "A rate monitor receives request timestamps in strictly increasing order. After each one it reports how many requests arrived within the preceding 3000 milliseconds, inclusive of both endpoints."
      ),
      para("Return the count reported after each timestamp."),
      example(
        "timestamps = [1, 100, 3001, 3002]",
        "[1, 2, 3, 3]",
        [
          { state: "t=1", note: "window [-2999, 1] → 1" },
          { state: "t=100", note: "window [-2900, 100] → 2" },
          { state: "t=3001", note: "window [1, 3001] → 3" },
          { state: "t=3002", note: "window [2, 3002] → 1 expires → 3" },
        ],
        "Old timestamps leave from the front"
      ),
    ],
    constraints: [
      "1 ≤ number of timestamps ≤ 100000",
      "1 ≤ timestamp ≤ 1000000000",
      "Timestamps are strictly increasing.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["timestamps"],
      returns: "int[]",
      functionName: "recentCounts",
    },
    tests: [
      { input: "1 100 3001 3002", expected: "1 2 3 3", isSample: true },
      { input: "1", expected: "1", isSample: true },
      { input: "1 3002", expected: "1 1", isSample: true, explanation: "3002 - 1 = 3001 milliseconds, just outside the window, so timestamp 1 has expired." },
      { input: "1 2 3", expected: "1 2 3" },
      { input: "1 3001", expected: "1 2" },
      { input: "1 3002 6003", expected: "1 1 1" },
      { input: "1000000000", expected: "1" },
    ],
    hints: [
      "Which timestamps can still count when a new one arrives?",
      "Those no older than 3000 milliseconds before it.",
      "Since arrivals are increasing, expired timestamps are always the oldest ones.",
      "That is first-in-first-out: push each arrival, pop from the front while it is too old, and report the size.",
    ],
    solutions: [
      {
        title: "Queue of live timestamps",
        order: 1,
        intuition:
          "The window moves forward and never back, and because arrivals are increasing, anything that expires is always at the front. That is exactly a queue's discipline, so the entire problem is push, expire from the front, report the size. No scanning and no searching.",
        approach: [
          "Keep a queue of timestamps currently inside the window.",
          "Push each arrival.",
          "Pop from the front while the front is older than arrival - 3000.",
          "Record the queue's size.",
        ],
        code: {
          PYTHON: `from collections import deque


def recentCounts(timestamps: List[int]) -> List[int]:
    WINDOW = 3000
    live = deque()
    result = []

    for now in timestamps:
        live.append(now)

        # Arrivals increase, so anything expired is always at the front.
        while live[0] < now - WINDOW:
            live.popleft()

        result.append(len(live))

    return result`,
          JAVA: `class Solution {
    public int[] recentCounts(int[] timestamps) {
        final int WINDOW = 3000;
        Deque<Integer> live = new ArrayDeque<>();
        int[] result = new int[timestamps.length];

        for (int i = 0; i < timestamps.length; i++) {
            int now = timestamps[i];
            live.addLast(now);
            while (live.peekFirst() < now - WINDOW) live.pollFirst();
            result[i] = live.size();
        }

        return result;
    }
}`,
        },
        timeComplexity: "O(n) amortised — each timestamp is pushed and popped once",
        spaceComplexity: "O(w), where w is the most requests inside one window",
        edgeCases: [
          "A gap larger than the window, expiring everything but the newest.",
          "A single timestamp.",
          "A boundary exactly 3000 apart, which must still count.",
        ],
        commonMistakes: [
          "Using `<=` when expiring, which wrongly drops a timestamp exactly on the boundary.",
          "Using a list with pop-from-front, making each removal O(n).",
          "Rescanning the whole history per arrival.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(w)",
  },
];
