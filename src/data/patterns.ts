import type { Difficulty } from "@/generated/prisma/enums";

/**
 * The pattern library.
 *
 * All content here is original, written for CodeForge.
 *
 * The field that matters most is `recognitionClues`. Anyone can look up how
 * a sliding window works; the skill an interview actually tests is reading an
 * unfamiliar problem statement and knowing which tool it is asking for.
 * `antiPatterns` exists for the same reason from the other direction - it
 * lists the look-alikes, because "everything is a sliding window" is the most
 * common failure mode once someone learns the pattern.
 *
 * `templateCode` is Python only. A pattern template communicates *shape*, and
 * maintaining the same twenty skeletons in four languages would quadruple the
 * surface without teaching anything extra. Problems carry all four languages,
 * which is where syntax actually matters. The column is a map, so adding a
 * language later needs no migration.
 */
export type PatternSeed = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  recognitionClues: string[];
  antiPatterns: string[];
  coreIdea: string;
  templateCode: Record<string, string>;
  commonMistakes: string[];
  timeComplexity: string;
  spaceComplexity: string;
  difficulty: Difficulty;
  order: number;
};

export const PATTERNS: PatternSeed[] = [
  {
    slug: "two-pointers",
    name: "Two Pointers",
    tagline: "Two indices moving under a rule that never lets them backtrack.",
    description:
      "Keep two positions in a sequence and advance them according to what you observe, so that each element is visited a bounded number of times. The pointers may start at opposite ends and close in, or start together and move in the same direction. Either way the win is the same: a decision that would need a nested scan becomes a single pass, because every move permanently rules out a region you will never need to revisit.",
    recognitionClues: [
      "The input is sorted, or sorting it would not destroy the answer.",
      "You are looking for a pair, triplet, or span that satisfies a numeric condition.",
      "A brute-force solution compares every element with every other element.",
      "Moving one boundary makes the quantity you track monotonically larger or smaller.",
      "The problem asks you to compact, partition, or deduplicate a sequence in place.",
    ],
    antiPatterns: [
      "Order matters and you cannot sort — sorting for a pair sum is fine, but not when the answer must reference original positions and you did not keep them.",
      "The condition is not monotonic: if moving a pointer can make things better *or* worse unpredictably, you cannot decide which pointer to move.",
      "You need every pair, not one qualifying pair. Enumerating all pairs is inherently quadratic.",
    ],
    coreIdea:
      "Each step must eliminate at least one candidate permanently. When the pointers close in, ask: given what I just observed, which side can I rule out entirely? If you cannot answer that, two pointers is the wrong tool.",
    templateCode: {
      PYTHON: `def opposite_ends(nums, target):
    """Pointers start apart and close in. Requires sorted input."""
    left, right = 0, len(nums) - 1
    while left < right:
        total = nums[left] + nums[right]
        if total == target:
            return [left, right]
        if total < target:
            # Everything left of 'left' is even smaller, so it can never
            # reach the target with any partner. Discard it.
            left += 1
        else:
            right -= 1
    return []


def same_direction(nums):
    """Slow marks where the next kept item goes; fast scans ahead."""
    slow = 0
    for fast in range(len(nums)):
        if keep(nums[fast]):
            nums[slow] = nums[fast]
            slow += 1
    return slow  # length of the compacted prefix`,
    },
    commonMistakes: [
      "Using `while left <= right` when the two pointers must reference distinct elements — this lets an element pair with itself.",
      "Forgetting to skip duplicates after recording a match, which produces the same answer several times.",
      "Sorting when the problem requires original indices, then returning positions from the sorted copy.",
      "Moving both pointers on every iteration, which can step straight over the answer.",
    ],
    timeComplexity: "O(n), or O(n log n) when the input must be sorted first",
    spaceComplexity: "O(1) beyond the input",
    difficulty: "EASY",
    order: 10,
  },
  {
    slug: "sliding-window",
    name: "Sliding Window",
    tagline: "A contiguous range that grows and shrinks instead of restarting.",
    description:
      "Maintain a window over a contiguous run of elements together with a summary of what it contains — a sum, a count, a frequency map. Extend the right edge to take in new elements; pull the left edge in when the window violates its condition. Because each edge only ever moves forward, every element is added once and removed at most once, turning a quadratic re-scan into a linear sweep.",
    recognitionClues: [
      "The problem says contiguous, consecutive, substring, or subarray.",
      "It asks for the longest, shortest, or a count of ranges meeting a condition.",
      "A candidate range can be extended or trimmed by one element at a time.",
      "The quantity you track can be updated incrementally rather than recomputed.",
      "Brute force would examine every start paired with every end.",
    ],
    antiPatterns: [
      "Subsequences, not substrings. If elements need not be adjacent, a window cannot represent the candidate.",
      "The summary cannot be undone when the left edge moves. A maximum, for example, is not removable in O(1) — that needs a monotonic deque, not a plain window.",
      "Shrinking is not monotonic: if a shorter window can satisfy a condition that a longer one violated *and* vice versa, the left edge would have to move backwards.",
    ],
    coreIdea:
      "Ask two questions. When do I grow the window, and when must I shrink it? If both answers are one-directional, the two edges never move backwards and the sweep is linear.",
    templateCode: {
      PYTHON: `def variable_window(items):
    """Grow on the right; shrink from the left while the window is invalid."""
    left = 0
    best = 0
    state = {}  # whatever summary the condition needs

    for right, value in enumerate(items):
        add(state, value)

        # 'while', not 'if': one new element can force several removals.
        while not is_valid(state):
            remove(state, items[left])
            left += 1

        best = max(best, right - left + 1)

    return best


def fixed_window(items, k):
    """Window of constant width: add one, drop one."""
    if len(items) < k:
        return None

    total = sum(items[:k])
    best = total
    for right in range(k, len(items)):
        total += items[right] - items[right - k]
        best = max(best, total)
    return best`,
    },
    commonMistakes: [
      "Using `if` instead of `while` when shrinking — a single new element can require removing several from the left.",
      "Measuring the window as `right - left` and losing one element; the width of an inclusive range is `right - left + 1`.",
      "Recording the best answer while the window is still invalid, before the shrink loop has run.",
      "Leaving zero counts in a frequency map, so a size check reports characters the window no longer contains.",
    ],
    timeComplexity: "O(n) — each edge advances at most n times",
    spaceComplexity: "O(k) for the window summary, where k is the alphabet or window size",
    difficulty: "MEDIUM",
    order: 20,
  },
  {
    slug: "prefix-sum",
    name: "Prefix Sum",
    tagline: "Precompute cumulative totals so any range answers in constant time.",
    description:
      "Build an array where each entry holds the total of everything before it. The sum of any range then becomes a single subtraction. Paired with a hash map of previously seen totals, the same idea answers questions about ranges with a particular sum without ever enumerating the ranges themselves.",
    recognitionClues: [
      "Repeated queries about the sum or count over arbitrary ranges.",
      "The problem counts subarrays whose sum equals, exceeds, or divides by some value.",
      "You find yourself recomputing overlapping totals in a nested loop.",
      "The phrase \"number of subarrays such that…\" appears.",
      "A running balance would let you treat two different states as equivalent.",
    ],
    antiPatterns: [
      "The array changes between queries. A static prefix array is invalidated by every update; that needs a Fenwick or segment tree.",
      "The operation has no inverse. Sums and XORs subtract cleanly; maximums do not.",
      "The range must be contiguous in a transformed order you have not actually established.",
    ],
    coreIdea:
      "`sum(i..j) = prefix[j + 1] - prefix[i]`. To count ranges with a target sum, rearrange it: for each endpoint j, the number of valid starts is how many times `prefix[j+1] - target` has already been seen.",
    templateCode: {
      PYTHON: `def build_prefix(nums):
    """prefix[i] is the sum of nums[0:i], so prefix[0] == 0."""
    prefix = [0] * (len(nums) + 1)
    for i, value in enumerate(nums):
        prefix[i + 1] = prefix[i] + value
    return prefix


def range_sum(prefix, i, j):
    """Inclusive sum of nums[i..j]."""
    return prefix[j + 1] - prefix[i]


def count_subarrays_with_sum(nums, target):
    """Count ranges summing to target, in one pass."""
    # The empty prefix has sum 0 and has been "seen" once. Without this,
    # subarrays starting at index 0 are never counted.
    seen = {0: 1}
    running = 0
    count = 0

    for value in nums:
        running += value
        count += seen.get(running - target, 0)
        seen[running] = seen.get(running, 0) + 1

    return count`,
    },
    commonMistakes: [
      "Omitting the `{0: 1}` seed, which silently drops every subarray that starts at index 0.",
      "Off-by-one in the range formula: with a leading zero, the sum of `i..j` is `prefix[j+1] - prefix[i]`, not `prefix[j] - prefix[i]`.",
      "Recording the running total in the map before counting, so a zero-length range matches.",
      "Using a prefix array for maximums, where subtraction is meaningless.",
    ],
    timeComplexity: "O(n) to build, O(1) per range query",
    spaceComplexity: "O(n)",
    difficulty: "EASY",
    order: 30,
  },
  {
    slug: "binary-search",
    name: "Binary Search",
    tagline: "Halve the search space using a yes/no question that flips exactly once.",
    description:
      "Any space that can be divided by a predicate which is false up to some point and true from then on can be searched in logarithmic time. This is much broader than looking up a value in a sorted array: the search space is often the range of possible answers, and the predicate is \"is this answer feasible?\".",
    recognitionClues: [
      "The input is sorted, or rotated-sorted.",
      "You are asked for the first or last position satisfying a condition.",
      "The answer is a number in a known range and checking a candidate is cheap.",
      "Wording like \"minimise the maximum\" or \"maximise the minimum\".",
      "The feasibility of a candidate answer is monotonic: if x works, everything above (or below) x works too.",
    ],
    antiPatterns: [
      "The predicate is not monotonic. If feasible answers are scattered rather than forming one contiguous run, halving discards valid candidates.",
      "Checking a candidate costs more than scanning linearly would.",
      "The data is unsorted and sorting it costs more than the linear scan you are trying to avoid.",
    ],
    coreIdea:
      "Do not think about values; think about a predicate over positions that reads F F F T T T. Binary search finds the boundary. Every problem below is that same boundary hunt in disguise.",
    templateCode: {
      PYTHON: `def first_true(lo, hi, predicate):
    """
    Smallest x in [lo, hi] with predicate(x) true, assuming the pattern
    F F F T T T. Returns hi + 1 when nothing satisfies it.

    The half-open invariant is what keeps this correct: the answer is always
    inside [lo, hi], and the loop shrinks that interval without ever
    excluding it.
    """
    while lo < hi:
        # Floor division biases toward lo, which is what keeps the loop
        # terminating when hi == lo + 1.
        mid = lo + (hi - lo) // 2
        if predicate(mid):
            hi = mid        # mid might be the answer: keep it
        else:
            lo = mid + 1    # mid is definitely not: discard it
    return lo


def search_on_answer(low, high, feasible):
    """Binary search the answer space rather than the input."""
    best = -1
    while low <= high:
        mid = low + (high - low) // 2
        if feasible(mid):
            best = mid
            high = mid - 1  # look for something smaller
        else:
            low = mid + 1
    return best`,
    },
    commonMistakes: [
      "Writing `mid = (lo + hi) // 2` in a language with fixed-width integers, where the addition can overflow. `lo + (hi - lo) // 2` cannot.",
      "Mixing an inclusive `hi` with `hi = mid`, producing an infinite loop when `hi == lo + 1`.",
      "Returning `mid` on a match when the problem wants the *first* match — you must keep searching left.",
      "Assuming the array is sorted when the problem only said the values are distinct.",
    ],
    timeComplexity: "O(log n) comparisons, times the cost of the predicate",
    spaceComplexity: "O(1)",
    difficulty: "MEDIUM",
    order: 40,
  },
  {
    slug: "fast-slow-pointers",
    name: "Fast & Slow Pointers",
    tagline: "Two walkers at different speeds reveal cycles and midpoints.",
    description:
      "Advance one pointer one step at a time and another two steps at a time. If the structure contains a cycle the fast pointer eventually laps the slow one and they meet; if it does not, the fast pointer runs off the end. The same trick locates the midpoint in a single pass, without first measuring the length.",
    recognitionClues: [
      "A linked list, or any structure where you can only move forward.",
      "The question is whether a cycle exists, or where it begins.",
      "You need the middle element but cannot index into the structure.",
      "You need the k-th element from the end in one pass.",
      "A sequence is defined by repeatedly applying a function, and you must detect repetition.",
    ],
    antiPatterns: [
      "Random access is available and cheap — with an array, computing the midpoint arithmetically is simpler and clearer.",
      "You must identify *which* elements form the cycle rather than just detecting one; that usually wants a visited set.",
      "The structure can branch. Two pointers assume a single successor per node.",
    ],
    coreIdea:
      "Relative speed is one step per iteration, so the gap closes by exactly one each time. Inside a cycle of length L, the pointers must therefore meet within L iterations.",
    templateCode: {
      PYTHON: `def has_cycle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False


def cycle_start(head):
    """Floyd's algorithm: detect, then walk to the entry point."""
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            # Distance from head to the cycle entry equals the distance
            # from the meeting point to the entry. Walking both at the same
            # speed therefore lands them together exactly at the entry.
            walker = head
            while walker is not slow:
                walker = walker.next
                slow = slow.next
            return walker
    return None


def middle(head):
    """When fast reaches the end, slow is at the midpoint."""
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow`,
    },
    commonMistakes: [
      "Checking `fast.next` before `fast`, which dereferences null on an even-length list.",
      "Comparing node values instead of node identity, so two equal values look like a cycle.",
      "Starting the pointers at different nodes, which breaks the distance argument behind the cycle-entry step.",
      "Assuming `slow` lands on the first of two middle nodes — which half you get depends on the loop condition.",
    ],
    timeComplexity: "O(n)",
    spaceComplexity: "O(1)",
    difficulty: "MEDIUM",
    order: 50,
  },
  {
    slug: "hashing",
    name: "Hashing",
    tagline: "Trade memory for time by remembering what you have already seen.",
    description:
      "A hash map or set answers \"have I seen this?\" and \"how many times?\" in expected constant time. Most quadratic scans exist because the algorithm keeps re-deriving information it already computed; storing that information once collapses the inner loop entirely.",
    recognitionClues: [
      "You are searching backwards through elements you have already visited.",
      "The problem involves counting occurrences, or comparing two multisets.",
      "Membership, duplicates, or complements are central to the question.",
      "Grouping items by a derived key — a sorted signature, a remainder, a normalised form.",
      "A nested loop where the inner one only asks whether something exists.",
    ],
    antiPatterns: [
      "Order or adjacency matters. A hash map discards position unless you store it explicitly.",
      "You need range queries or the nearest key — that is a sorted structure or a tree.",
      "The key space is tiny and dense, where a plain array is faster and simpler.",
      "Memory is the binding constraint and the input is large.",
    ],
    coreIdea:
      "Before writing a nested loop, ask what the inner loop is actually computing. If the answer is \"does X exist among what I have seen\" or \"how many of X\", a map removes the loop.",
    templateCode: {
      PYTHON: `def find_complement_pair(nums, target):
    """The canonical swap: a backwards search becomes a lookup."""
    seen = {}
    for index, value in enumerate(nums):
        if target - value in seen:
            return [seen[target - value], index]
        seen[value] = index
    return []


def frequency(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1
    return counts


def group_by_signature(words):
    """Group items sharing a derived key."""
    groups = {}
    for word in words:
        key = "".join(sorted(word))
        groups.setdefault(key, []).append(word)
    return list(groups.values())`,
    },
    commonMistakes: [
      "Inserting the current element before checking for its complement, which lets an element pair with itself.",
      "Using a mutable value as a key in languages that forbid it, or relying on object identity when value equality was intended.",
      "Assuming iteration order. Only some languages guarantee insertion order.",
      "Counting distinct keys when the question asked for total occurrences.",
    ],
    timeComplexity: "O(n) expected; O(n²) worst case under adversarial collisions",
    spaceComplexity: "O(n)",
    difficulty: "EASY",
    order: 60,
  },
  {
    slug: "monotonic-stack",
    name: "Monotonic Stack",
    tagline: "A stack kept in sorted order answers \"next greater\" in one pass.",
    description:
      "Push indices onto a stack, but before each push pop everything that the new element makes irrelevant. The stack therefore stays sorted, and the moment an element is popped you have discovered its next greater — or smaller — neighbour. Each element is pushed once and popped once, so the whole sweep is linear despite the inner loop.",
    recognitionClues: [
      "Next or previous greater/smaller element, in either direction.",
      "Largest rectangle, trapped water, or spans over a histogram-like array.",
      "An element stops mattering once a bigger one appears after it.",
      "You are comparing each element against an unknown number of neighbours.",
      "Stock-span style questions: how far back does this value dominate?",
    ],
    antiPatterns: [
      "You need the k-th greater element rather than the immediate next one; that is a different structure.",
      "Comparisons are not transitive, so \"made irrelevant\" is not well defined.",
      "The array is queried repeatedly with updates in between — a stack is built for one sweep.",
    ],
    coreIdea:
      "Popping is the discovery event, not a cleanup step. When you pop element x because y arrived, you have just learned that y is x's next greater element. Write the answer at that moment.",
    templateCode: {
      PYTHON: `def next_greater(nums):
    """For each index, the value of the next strictly greater element."""
    result = [-1] * len(nums)
    stack = []  # holds indices; their values are strictly decreasing

    for index, value in enumerate(nums):
        # Everything smaller than the new value has just found its answer.
        while stack and nums[stack[-1]] < value:
            result[stack.pop()] = value
        stack.append(index)

    # Whatever remains never found a greater element; it keeps -1.
    return result


def previous_smaller(nums):
    """Mirror image: scan the same way, keep the stack increasing."""
    result = [-1] * len(nums)
    stack = []
    for index, value in enumerate(nums):
        while stack and nums[stack[-1]] >= value:
            stack.pop()
        result[index] = nums[stack[-1]] if stack else -1
        stack.append(index)
    return result`,
    },
    commonMistakes: [
      "Storing values instead of indices, then being unable to compute a distance or width.",
      "Confusing `<` with `<=`, which changes the behaviour on duplicates — and usually only shows up in one hidden test.",
      "Forgetting the elements left on the stack at the end, which have no answer.",
      "Believing the nested while loop makes it quadratic; the amortised argument is that each index is popped at most once.",
    ],
    timeComplexity: "O(n) amortised",
    spaceComplexity: "O(n)",
    difficulty: "MEDIUM",
    order: 70,
  },
  {
    slug: "top-k",
    name: "Top K Elements",
    tagline: "A heap of size k beats sorting everything you do not need.",
    description:
      "When only the k best items matter, keep a heap holding exactly k candidates. Counter-intuitively you keep a min-heap to find the k largest: the smallest of your current winners sits at the top, ready to be evicted the moment something better arrives. The full input is never sorted.",
    recognitionClues: [
      "The words \"top k\", \"k largest\", \"k closest\", or \"k most frequent\".",
      "Only a small ranked subset of a large input is required.",
      "Items arrive as a stream and cannot all be held in memory.",
      "You need a running median or a repeatedly-queried extreme.",
      "Sorting would be the obvious approach but k is far smaller than n.",
    ],
    antiPatterns: [
      "k is close to n, where a straight sort is simpler and about as fast.",
      "The full ordering is required, not just the top slice.",
      "The comparison key changes after insertion; a heap will not re-order itself.",
    ],
    coreIdea:
      "For the k largest, keep a min-heap of size k. The root is the weakest survivor, so deciding whether to admit a newcomer is one comparison. For the k smallest, invert the comparator.",
    templateCode: {
      PYTHON: `import heapq


def k_largest(nums, k):
    """A MIN-heap of size k: its root is the weakest element still in the set."""
    heap = []
    for value in nums:
        heapq.heappush(heap, value)
        if len(heap) > k:
            heapq.heappop(heap)   # evicts the smallest, keeping the k largest
    return sorted(heap, reverse=True)


def k_most_frequent(items, k):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1

    heap = []
    for item, count in counts.items():
        heapq.heappush(heap, (count, item))
        if len(heap) > k:
            heapq.heappop(heap)

    return [item for _count, item in sorted(heap, reverse=True)]`,
    },
    commonMistakes: [
      "Reaching for a max-heap to find the k largest — that requires holding all n elements instead of k.",
      "Pushing then popping in the wrong order, so the heap briefly holds k+1 items and evicts the wrong one.",
      "Assuming the heap iterates in sorted order; only the root is guaranteed.",
      "Ignoring ties when the problem specifies a tie-breaking rule.",
    ],
    timeComplexity: "O(n log k)",
    spaceComplexity: "O(k)",
    difficulty: "MEDIUM",
    order: 80,
  },
  {
    slug: "merge-intervals",
    name: "Merge Intervals",
    tagline: "Sort by start, then decide overlap against one running interval.",
    description:
      "Once intervals are ordered by start point, any interval that overlaps the one you are building must begin before that one ends. This reduces a pairwise comparison to a single sweep in which you either extend the current interval or close it and begin a new one.",
    recognitionClues: [
      "The input is a list of ranges, bookings, or start/end pairs.",
      "The task is to merge, insert, or count overlaps.",
      "Meeting-room, calendar, or resource-scheduling wording.",
      "You need the maximum number of things active at once.",
      "Free gaps between busy ranges are requested.",
    ],
    antiPatterns: [
      "Intervals are on a circular domain, where the wrap-around has no natural sort order.",
      "Ranges arrive as a stream requiring answers before the whole set is known — that wants an interval tree.",
      "Intervals carry weights and the question is an optimisation, which is usually dynamic programming.",
    ],
    coreIdea:
      "Sorting by start converts a two-dimensional comparison into a one-dimensional sweep. After sorting, the only question per interval is whether it begins before the current one ends.",
    templateCode: {
      PYTHON: `def merge(intervals):
    if not intervals:
        return []

    intervals.sort(key=lambda pair: pair[0])
    merged = [list(intervals[0])]

    for start, end in intervals[1:]:
        last = merged[-1]
        if start <= last[1]:
            # Overlap. Extend, but never shrink: the current interval may
            # already reach further than this one does.
            last[1] = max(last[1], end)
        else:
            merged.append([start, end])

    return merged


def max_concurrent(intervals):
    """Sweep line: +1 at each start, -1 at each end."""
    events = []
    for start, end in intervals:
        events.append((start, 1))
        events.append((end, -1))

    # Ends sort before starts at the same instant, so a meeting ending as
    # another begins does not count as an overlap.
    events.sort(key=lambda e: (e[0], e[1]))

    active = best = 0
    for _time, delta in events:
        active += delta
        best = max(best, active)
    return best`,
    },
    commonMistakes: [
      "Assigning `last[1] = end` instead of taking the maximum, which truncates an interval that already extended further.",
      "Sorting by end when the algorithm needs start order — that is a different problem (activity selection).",
      "Getting the touching case wrong: whether `[1,2]` and `[2,3]` overlap is a decision the problem statement must settle.",
      "Mutating the caller's list by sorting it in place when that was not expected.",
    ],
    timeComplexity: "O(n log n), dominated by the sort",
    spaceComplexity: "O(n) for the output",
    difficulty: "MEDIUM",
    order: 90,
  },
  {
    slug: "cyclic-placement",
    name: "Cyclic Placement",
    tagline: "When values are a permutation of indices, the array is its own map.",
    description:
      "If an array of length n holds values drawn from 1..n, then each value has a natural home: value v belongs at index v-1. Repeatedly swapping each value to its home sorts the array in linear time with no extra memory, and whatever ends up in the wrong place identifies the missing or duplicated values.",
    recognitionClues: [
      "Values are constrained to a range tied to the array's length.",
      "The problem asks for a missing, duplicated, or misplaced number.",
      "Constant extra space is required, ruling out a hash set.",
      "The array is described as containing each number \"exactly once\" with exceptions.",
      "Sorting is allowed but O(n log n) is explicitly too slow.",
    ],
    antiPatterns: [
      "Values are unbounded or unrelated to the indices — there is no home to swap to.",
      "The input must not be modified.",
      "Duplicates are arbitrary rather than a bounded, structured deviation.",
    ],
    coreIdea:
      "The array doubles as a hash table with a perfect hash function: index = value - 1. Each swap places at least one value correctly, so the total number of swaps is bounded by n even though the loop looks nested.",
    templateCode: {
      PYTHON: `def cyclic_sort(nums):
    """Place every value v at index v - 1. Values must be in 1..n."""
    i = 0
    while i < len(nums):
        home = nums[i] - 1
        if 0 <= home < len(nums) and nums[i] != nums[home]:
            # Compare against nums[home], not against i: duplicates would
            # otherwise swap forever.
            nums[i], nums[home] = nums[home], nums[i]
        else:
            # Either already home, or a duplicate. Either way, move on.
            i += 1
    return nums


def find_missing(nums):
    cyclic_sort(nums)
    for index, value in enumerate(nums):
        if value != index + 1:
            return index + 1
    return len(nums) + 1`,
    },
    commonMistakes: [
      "Advancing `i` after a swap. The value just swapped in also needs a home, so `i` must stay put.",
      "Comparing `i != home` rather than `nums[i] != nums[home]`, which loops forever on duplicates.",
      "Forgetting that values may be 0-based in some statements and 1-based in others.",
      "Not bounds-checking `home` when the input can contain out-of-range values.",
    ],
    timeComplexity: "O(n) — each swap fixes at least one position",
    spaceComplexity: "O(1)",
    difficulty: "MEDIUM",
    order: 100,
  },
  {
    slug: "backtracking",
    name: "Backtracking",
    tagline: "Build a candidate incrementally, and undo the moment it cannot work.",
    description:
      "Explore a decision tree depth-first, extending a partial solution one choice at a time. When a partial solution cannot possibly be completed, abandon it and undo the last choice rather than continuing. The undo step is what makes this different from plain recursion, and pruning is what makes it tractable.",
    recognitionClues: [
      "The problem asks for all permutations, combinations, subsets, or arrangements.",
      "You must find every solution, not merely count or optimise.",
      "Choices are made in sequence and each constrains the next.",
      "The input is small — often n ≤ 20 — because the answer space is exponential.",
      "Puzzle framing: placing pieces, filling a grid, partitioning a string.",
    ],
    antiPatterns: [
      "Only the count or the optimum is needed and subproblems repeat — that is dynamic programming.",
      "There is a direct constructive rule, making the search unnecessary.",
      "The input is large. Backtracking over n = 1000 will not finish regardless of pruning.",
    ],
    coreIdea:
      "Choose, explore, un-choose. The un-choose is not optional bookkeeping — it is what lets one mutable buffer serve the entire tree instead of copying state at every node.",
    templateCode: {
      PYTHON: `def subsets(nums):
    results = []
    current = []

    def explore(start):
        # Every node of the tree is a valid subset, so record on entry.
        results.append(current[:])   # copy: 'current' keeps mutating

        for i in range(start, len(nums)):
            current.append(nums[i])   # choose
            explore(i + 1)            # explore
            current.pop()             # un-choose

    explore(0)
    return results


def permutations(nums):
    results = []
    used = [False] * len(nums)
    current = []

    def explore():
        if len(current) == len(nums):
            results.append(current[:])
            return

        for i in range(len(nums)):
            if used[i]:
                continue
            used[i] = True
            current.append(nums[i])
            explore()
            current.pop()
            used[i] = False   # both pieces of state must be undone

    explore()
    return results`,
    },
    commonMistakes: [
      "Appending `current` rather than a copy, so every result aliases the same list and ends up empty.",
      "Undoing only part of the state — popping the value but forgetting to clear the `used` flag.",
      "Passing `i + 1` versus `start` incorrectly, which is the difference between combinations and permutations.",
      "Skipping pruning entirely, turning a feasible search into one that never terminates.",
    ],
    timeComplexity: "Exponential — O(2ⁿ) for subsets, O(n!) for permutations",
    spaceComplexity: "O(n) recursion depth, plus the output",
    difficulty: "HARD",
    order: 110,
  },
  {
    slug: "breadth-first-search",
    name: "Breadth First Search",
    tagline: "Expand level by level, so the first time you arrive is the shortest way.",
    description:
      "Visit a start node, then all its neighbours, then all of theirs, using a queue. Because nodes are reached in order of distance, the first time BFS touches a node it has arrived by a shortest path. On an unweighted graph this is the shortest-path algorithm, and the level structure answers \"how many steps\" directly.",
    recognitionClues: [
      "Shortest path, minimum steps, or fewest moves on an unweighted graph.",
      "A grid where you move between adjacent cells.",
      "\"Levels\", \"rounds\", or \"minutes until everything is reached\".",
      "Spreading processes: infection, flooding, rotting, signal propagation.",
      "The nearest node satisfying some property.",
    ],
    antiPatterns: [
      "Edges have differing weights — BFS's distance guarantee only holds when every edge costs the same. Use Dijkstra.",
      "You must enumerate all paths rather than find the shortest; that is DFS with backtracking.",
      "The graph is enormous and the target is deep, where BFS's frontier consumes too much memory.",
    ],
    coreIdea:
      "Mark a node as visited when you enqueue it, not when you dequeue it. Marking on dequeue lets the same node enter the queue several times, which quietly degrades the complexity.",
    templateCode: {
      PYTHON: `from collections import deque


def shortest_steps(start, is_goal, neighbours):
    queue = deque([start])
    visited = {start}
    steps = 0

    while queue:
        # Draining exactly one level per iteration is what makes 'steps'
        # meaningful; without it you cannot tell levels apart.
        for _ in range(len(queue)):
            node = queue.popleft()
            if is_goal(node):
                return steps

            for nxt in neighbours(node):
                if nxt not in visited:
                    visited.add(nxt)   # mark on ENQUEUE, not on dequeue
                    queue.append(nxt)

        steps += 1

    return -1


def grid_bfs(grid, start):
    rows, cols = len(grid), len(grid[0])
    queue = deque([start])
    seen = {start}

    while queue:
        r, c = queue.popleft()
        for dr, dc in ((1, 0), (-1, 0), (0, 1), (0, -1)):
            nr, nc = r + dr, c + dc
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                seen.add((nr, nc))
                queue.append((nr, nc))`,
    },
    commonMistakes: [
      "Marking visited on dequeue, which allows duplicates in the queue and can blow up the running time.",
      "Using a list with `pop(0)` instead of a deque, making each removal O(n).",
      "Forgetting the level-size loop when the answer is a distance rather than reachability.",
      "Applying BFS to a weighted graph and trusting the result.",
    ],
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V) for the queue and visited set",
    difficulty: "MEDIUM",
    order: 120,
  },
  {
    slug: "depth-first-search",
    name: "Depth First Search",
    tagline: "Follow one path to exhaustion, then retreat and try the next.",
    description:
      "Go as deep as possible along each branch before backtracking, using recursion or an explicit stack. DFS is the natural fit for questions about connectivity, structure, and whole-path properties — anything where you must fully explore a region before drawing a conclusion about it.",
    recognitionClues: [
      "Counting connected components, islands, or regions.",
      "Detecting a cycle in a graph.",
      "Tree traversals and whole-subtree properties.",
      "Topological ordering of dependencies.",
      "Any question about a complete path from root to leaf.",
    ],
    antiPatterns: [
      "You need the shortest path on an unweighted graph — DFS finds *a* path, not the shortest.",
      "The graph is very deep and the language has a modest recursion limit; convert to an explicit stack.",
      "The answer depends on processing nodes in distance order.",
    ],
    coreIdea:
      "Decide whether your work happens on the way down (pre-order) or on the way back up (post-order). Subtree aggregates and topological order require post-order; that choice is most of the algorithm.",
    templateCode: {
      PYTHON: `def count_components(graph):
    visited = set()
    components = 0

    def explore(node):
        visited.add(node)
        for nxt in graph[node]:
            if nxt not in visited:
                explore(nxt)

    for node in graph:
        if node not in visited:
            components += 1
            explore(node)

    return components


def has_cycle_directed(graph):
    """Three colours: unvisited, in the current path, fully done."""
    UNVISITED, IN_PATH, DONE = 0, 1, 2
    state = {node: UNVISITED for node in graph}

    def explore(node):
        state[node] = IN_PATH
        for nxt in graph[node]:
            # A back-edge to something still on the stack is a cycle.
            # An edge to a DONE node is merely a re-convergence.
            if state[nxt] == IN_PATH:
                return True
            if state[nxt] == UNVISITED and explore(nxt):
                return True
        state[node] = DONE
        return False

    return any(explore(n) for n in graph if state[n] == UNVISITED)`,
    },
    commonMistakes: [
      "Using a two-state visited set for cycle detection in a directed graph, which reports a cycle for any re-convergent path.",
      "Recursing without a visited check, looping forever on a cyclic graph.",
      "Doing aggregate work pre-order when the children's results are needed.",
      "Hitting the recursion limit on a long path and mistaking the stack overflow for a logic bug.",
    ],
    timeComplexity: "O(V + E)",
    spaceComplexity: "O(V) for the recursion stack",
    difficulty: "MEDIUM",
    order: 130,
  },
  {
    slug: "union-find",
    name: "Union Find",
    tagline: "Track which things are connected, with near-constant merges.",
    description:
      "A disjoint-set structure maintains a collection of groups under two operations: find which group an element belongs to, and merge two groups. With path compression and union by rank both run in near-constant amortised time, which makes it the right tool when connectivity changes as you go.",
    recognitionClues: [
      "Connections are added incrementally and you must answer connectivity as they arrive.",
      "Counting connected components after a series of merges.",
      "Detecting whether an edge would close a cycle in an undirected graph.",
      "Kruskal's minimum spanning tree.",
      "Equivalence relations: accounts to merge, equations to check for consistency.",
    ],
    antiPatterns: [
      "Connections are removed as well as added — union-find cannot split a set.",
      "You need the actual path between two nodes, not just whether one exists.",
      "The graph is static and fully known; a single DFS pass is simpler.",
    ],
    coreIdea:
      "Each set is a tree identified by its root. Path compression flattens the tree during lookups, so the structure gets faster the more it is queried.",
    templateCode: {
      PYTHON: `class UnionFind:
    def __init__(self, n):
        self.parent = list(range(n))
        self.rank = [0] * n
        self.count = n   # number of disjoint sets

    def find(self, x):
        # Path compression: re-point every node on the way to the root.
        while self.parent[x] != x:
            self.parent[x] = self.parent[self.parent[x]]
            x = self.parent[x]
        return x

    def union(self, a, b):
        root_a, root_b = self.find(a), self.find(b)
        if root_a == root_b:
            return False   # already together; this edge closes a cycle

        # Union by rank keeps the trees shallow.
        if self.rank[root_a] < self.rank[root_b]:
            root_a, root_b = root_b, root_a
        self.parent[root_b] = root_a
        if self.rank[root_a] == self.rank[root_b]:
            self.rank[root_a] += 1

        self.count -= 1
        return True`,
    },
    commonMistakes: [
      "Comparing `a == b` instead of `find(a) == find(b)`, which tests element identity rather than group membership.",
      "Skipping path compression or union by rank, degrading to O(n) per operation on a degenerate chain.",
      "Assigning `parent[b] = a` rather than linking the roots, which silently corrupts the structure.",
      "Forgetting to decrement the component count only when a merge actually happened.",
    ],
    timeComplexity: "O(α(n)) amortised per operation — effectively constant",
    spaceComplexity: "O(n)",
    difficulty: "MEDIUM",
    order: 140,
  },
  {
    slug: "greedy",
    name: "Greedy",
    tagline: "Take the locally best option, when you can prove it stays best.",
    description:
      "Make the choice that looks best right now and never reconsider it. This is only correct when the problem has an exchange property: any optimal solution can be transformed into one containing your greedy choice without getting worse. Without that argument, a greedy algorithm is a guess that passes the samples.",
    recognitionClues: [
      "Maximise or minimise, where a natural ordering of the input suggests itself.",
      "Scheduling by earliest finishing time, or making change with well-formed denominations.",
      "Each choice is independent of the ones that follow once made.",
      "An obvious sort makes the answer fall out in a single pass.",
      "Interval selection, or assigning limited resources.",
    ],
    antiPatterns: [
      "A locally worse choice can enable a much better outcome later — the coin-change counterexample with denominations 1, 3, 4 and a target of 6.",
      "Subproblems overlap and must be combined; that is dynamic programming.",
      "You cannot articulate why the greedy choice is safe. If you cannot state the exchange argument, do not trust it.",
    ],
    coreIdea:
      "The algorithm is usually two lines. The work is the proof: show that swapping the greedy choice into any optimal solution keeps it optimal. Without that, you have a heuristic.",
    templateCode: {
      PYTHON: `def max_non_overlapping(intervals):
    """
    Select the most intervals that do not overlap.

    Sort by END time, not start. Exchange argument: the interval that ends
    soonest leaves the most room for everything after it, so some optimal
    solution contains it.
    """
    intervals.sort(key=lambda pair: pair[1])

    count = 0
    last_end = float("-inf")
    for start, end in intervals:
        if start >= last_end:
            count += 1
            last_end = end
    return count


def min_removals_to_fit(items, capacity):
    """Sort so the cheapest concession comes first, then take while it fits."""
    items.sort()
    used = 0
    taken = 0
    for item in items:
        if used + item > capacity:
            break
        used += item
        taken += 1
    return taken`,
    },
    commonMistakes: [
      "Sorting by the wrong key — interval scheduling by start time instead of end time is the classic wrong answer.",
      "Assuming greedy works because it passed the examples; the counterexample is usually a case with three items.",
      "Reconsidering an earlier choice, which turns it into an incorrect dynamic program.",
      "Mutating the input order when the caller depends on it.",
    ],
    timeComplexity: "Usually O(n log n), dominated by the sort",
    spaceComplexity: "O(1) beyond the sort",
    difficulty: "MEDIUM",
    order: 150,
  },
  {
    slug: "dynamic-programming",
    name: "Dynamic Programming",
    tagline: "Solve each overlapping subproblem once and remember the answer.",
    description:
      "When a problem decomposes into subproblems that recur, compute each one once and store it. The two ingredients are optimal substructure — the answer is built from answers to smaller instances — and overlapping subproblems, which is what makes memoising worthwhile. Without the overlap, plain recursion is already fine.",
    recognitionClues: [
      "Count the number of ways, or find the minimum/maximum over a sequence of choices.",
      "A recursive formulation visibly recomputes the same arguments.",
      "Choices at each step are constrained by earlier choices.",
      "Classic framings: knapsack, edit distance, longest increasing subsequence, coin change.",
      "The naive solution is exponential but the distinct state count is polynomial.",
    ],
    antiPatterns: [
      "Subproblems never repeat — memoising then costs memory and buys nothing.",
      "A greedy choice is provably safe, which is simpler and faster.",
      "The state needed to make a decision is unbounded, so there is no finite table to fill.",
    ],
    coreIdea:
      "Name the state first. Write down exactly what `dp[i][j]` means as an English sentence before writing any code. Almost every dynamic programming bug is a state whose meaning drifted halfway through the implementation.",
    templateCode: {
      PYTHON: `def top_down(n):
    """Memoised recursion: closest to how you reason about the problem."""
    memo = {}

    def solve(state):
        if state in memo:
            return memo[state]
        if is_base_case(state):
            return base_value(state)

        best = min(solve(nxt) + cost(state, nxt) for nxt in choices(state))
        memo[state] = best
        return best

    return solve(n)


def bottom_up(nums):
    """
    Tabulation. dp[i] = the best answer considering the first i elements.
    Writing that sentence down before the loop is the whole discipline.
    """
    dp = [0] * (len(nums) + 1)
    dp[0] = base_value()

    for i in range(1, len(nums) + 1):
        dp[i] = combine(dp[i - 1], nums[i - 1])

    return dp[len(nums)]


def rolling_array(nums):
    """When dp[i] depends only on dp[i-1], two variables replace the table."""
    previous, current = 0, 0
    for value in nums:
        previous, current = current, combine(previous, current, value)
    return current`,
    },
    commonMistakes: [
      "Never writing down what the state means, then conflating \"using the first i items\" with \"ending at item i\".",
      "Getting the base case wrong — `dp[0]` usually represents the empty prefix, not the first element.",
      "Iterating the dimensions in an order where a dependency has not been computed yet.",
      "Optimising to a rolling array before the straightforward table is correct.",
    ],
    timeComplexity: "O(number of states × transitions per state)",
    spaceComplexity: "O(number of states), often reducible to one dimension",
    difficulty: "HARD",
    order: 160,
  },
  {
    slug: "divide-and-conquer",
    name: "Divide and Conquer",
    tagline: "Split into independent halves, solve each, combine the results.",
    description:
      "Break the input into parts that can be solved independently, recurse on each, then merge the answers. Unlike dynamic programming the parts do not overlap, so nothing needs to be memoised. The interesting work is usually in the combine step.",
    recognitionClues: [
      "The input splits naturally into halves that do not interact.",
      "Merge sort, quicksort, or binary-search-like structure.",
      "A target complexity of O(n log n) is hinted at.",
      "Counting pairs across a split — inversions, for example.",
      "Tree problems where the answer combines results from both subtrees.",
    ],
    antiPatterns: [
      "Subproblems overlap, in which case memoisation is needed and this becomes dynamic programming.",
      "The combine step costs more than solving directly.",
      "The split does not reduce the problem — recursing on n-1 is just recursion.",
    ],
    coreIdea:
      "The recurrence T(n) = 2·T(n/2) + O(n) resolves to O(n log n). If your combine step is worse than linear, check whether the split is actually buying anything.",
    templateCode: {
      PYTHON: `def merge_sort(nums):
    if len(nums) <= 1:
        return nums

    mid = len(nums) // 2
    left = merge_sort(nums[:mid])
    right = merge_sort(nums[mid:])
    return merge(left, right)


def merge(left, right):
    """The combine step — where the real work of divide and conquer lives."""
    result = []
    i = j = 0

    while i < len(left) and j < len(right):
        # '<=' rather than '<' keeps equal elements in their original
        # relative order, which is what makes the sort stable.
        if left[i] <= right[j]:
            result.append(left[i])
            i += 1
        else:
            result.append(right[j])
            j += 1

    result.extend(left[i:])
    result.extend(right[j:])
    return result`,
    },
    commonMistakes: [
      "A base case that does not shrink, producing infinite recursion on inputs of length 1.",
      "Forgetting to append the remainder of whichever side was not exhausted.",
      "Using `<` in the merge comparison and silently losing stability.",
      "Slicing on every call in a language where slicing copies, adding a hidden O(n) per level.",
    ],
    timeComplexity: "Typically O(n log n)",
    spaceComplexity: "O(n) for merging, plus O(log n) recursion depth",
    difficulty: "MEDIUM",
    order: 170,
  },
  {
    slug: "bit-manipulation",
    name: "Bit Manipulation",
    tagline: "Treat an integer as a set of flags and use the hardware directly.",
    description:
      "Integers are fixed-width bit vectors, and the bitwise operators manipulate them in a single instruction. XOR cancels duplicates, AND masks, shifts scale by powers of two, and a small integer can stand in for a subset of up to 64 elements.",
    recognitionClues: [
      "Finding the element that appears an odd number of times.",
      "Constant space is demanded where a hash set is the obvious solution.",
      "Subsets of a small set need to be enumerated or stored compactly.",
      "The problem mentions parity, toggling, or powers of two.",
      "Counting set bits, or the distance between two bit patterns.",
    ],
    antiPatterns: [
      "Clever bit tricks that obscure straightforward logic — readability usually matters more than one saved instruction.",
      "The set is larger than the integer width.",
      "Values are not integers, or are negative in a language whose shift semantics you have not checked.",
    ],
    coreIdea:
      "XOR is its own inverse: `a ^ a == 0` and `a ^ 0 == a`. That single fact solves a surprising number of problems that otherwise need extra memory.",
    templateCode: {
      PYTHON: `def single_number(nums):
    """Pairs cancel under XOR; whatever is left appeared an odd number of times."""
    result = 0
    for value in nums:
        result ^= value
    return result


def count_set_bits(n):
    """Brian Kernighan: n & (n - 1) clears the lowest set bit."""
    count = 0
    while n:
        n &= n - 1
        count += 1
    return count


# The vocabulary, in one place:
#   get bit i      (n >> i) & 1
#   set bit i      n | (1 << i)
#   clear bit i    n & ~(1 << i)
#   toggle bit i   n ^ (1 << i)
#   lowest set bit n & -n
#   power of two   n > 0 and (n & (n - 1)) == 0


def all_subsets(items):
    """Each integer from 0 to 2^n - 1 is a subset mask."""
    results = []
    for mask in range(1 << len(items)):
        results.append([items[i] for i in range(len(items)) if mask >> i & 1])
    return results`,
    },
    commonMistakes: [
      "Operator precedence: `&` binds looser than `==` in C-family languages, so `a & 1 == 0` does not mean what it looks like.",
      "Assuming a fixed integer width in Python, where integers grow without bound and have no sign bit to shift into.",
      "Right-shifting a negative number and expecting zero fill.",
      "Using XOR to find a single non-duplicate when elements can repeat three times, where it does not apply.",
    ],
    timeComplexity: "O(n), or O(1) for single-word operations",
    spaceComplexity: "O(1)",
    difficulty: "MEDIUM",
    order: 180,
  },
  {
    slug: "heap",
    name: "Heap",
    tagline: "Constant-time access to the extreme, logarithmic to change it.",
    description:
      "A binary heap keeps the smallest (or largest) element at the root while only partially ordering everything else. That weaker guarantee is exactly why insertion and removal cost O(log n) rather than O(n), and it is all you need when the question only ever asks for the current extreme.",
    recognitionClues: [
      "Repeatedly needing the smallest or largest remaining item.",
      "Merging several sorted sequences.",
      "Scheduling by priority, or simulating events in time order.",
      "A running median, using two heaps facing each other.",
      "Dijkstra's algorithm, or any best-first search.",
    ],
    antiPatterns: [
      "You need the k-th element once — quickselect averages O(n) and beats building a heap.",
      "Full sorted order is required.",
      "Arbitrary elements must be searched or removed; a heap only exposes its root.",
    ],
    coreIdea:
      "A heap is a partially ordered tree, not a sorted list. Only the root is guaranteed. Iterating the backing array will not give you sorted output, and that surprises people.",
    templateCode: {
      PYTHON: `import heapq


def merge_sorted_lists(lists):
    """A heap of one candidate per list: always pop the global smallest."""
    heap = []
    for list_index, values in enumerate(lists):
        if values:
            # Carrying the indices lets us refill from the list we drained.
            heapq.heappush(heap, (values[0], list_index, 0))

    result = []
    while heap:
        value, list_index, value_index = heapq.heappop(heap)
        result.append(value)

        nxt = value_index + 1
        if nxt < len(lists[list_index]):
            heapq.heappush(heap, (lists[list_index][nxt], list_index, nxt))

    return result


class RunningMedian:
    """Two heaps facing each other: a max-heap below, a min-heap above."""

    def __init__(self):
        self.low = []    # max-heap, stored negated
        self.high = []   # min-heap

    def add(self, value):
        heapq.heappush(self.low, -value)
        # Keep every element in 'low' no greater than every element in 'high'.
        heapq.heappush(self.high, -heapq.heappop(self.low))
        if len(self.high) > len(self.low):
            heapq.heappush(self.low, -heapq.heappop(self.high))

    def median(self):
        if len(self.low) > len(self.high):
            return -self.low[0]
        return (-self.low[0] + self.high[0]) / 2`,
    },
    commonMistakes: [
      "Expecting the heap's underlying array to be sorted.",
      "Forgetting to negate on both push and pop when simulating a max-heap with a min-heap.",
      "Pushing tuples whose later fields are not comparable, which throws when the first fields tie.",
      "Mutating an element's priority after insertion and expecting the heap to reorder.",
    ],
    timeComplexity: "O(log n) push and pop, O(1) peek, O(n) to heapify",
    spaceComplexity: "O(n)",
    difficulty: "MEDIUM",
    order: 190,
  },
  {
    slug: "trie",
    name: "Trie",
    tagline: "A tree keyed by character, so shared prefixes are stored once.",
    description:
      "Each edge carries a character and each path from the root spells a prefix. Lookup costs time proportional to the length of the word rather than the number of words stored, and every prefix query becomes a simple walk down from the root.",
    recognitionClues: [
      "Autocomplete, or \"words starting with\" queries.",
      "Many strings share long common prefixes.",
      "Repeated prefix membership tests against a fixed dictionary.",
      "Word-search puzzles where a partial path should be abandoned early.",
      "Finding the longest common prefix across a set.",
    ],
    antiPatterns: [
      "Only exact-match lookups are needed — a hash set is simpler and uses less memory.",
      "Suffix rather than prefix queries; build the trie on reversed words, or use a suffix structure.",
      "Few strings, or an alphabet so large that the per-node overhead dominates.",
    ],
    coreIdea:
      "The structure pays for itself when prefixes are shared. Its real advantage in search problems is early termination: the moment a path is not a prefix of any word, the entire branch can be abandoned.",
    templateCode: {
      PYTHON: `class TrieNode:
    def __init__(self):
        self.children = {}
        # A node can be both the end of one word and an interior node of a
        # longer one, so this flag is not the same as "is a leaf".
        self.is_word = False


class Trie:
    def __init__(self):
        self.root = TrieNode()

    def insert(self, word):
        node = self.root
        for char in word:
            if char not in node.children:
                node.children[char] = TrieNode()
            node = node.children[char]
        node.is_word = True

    def search(self, word):
        node = self._walk(word)
        return node is not None and node.is_word

    def starts_with(self, prefix):
        return self._walk(prefix) is not None

    def _walk(self, text):
        node = self.root
        for char in text:
            if char not in node.children:
                return None
            node = node.children[char]
        return node`,
    },
    commonMistakes: [
      "Treating a node with no children as the only kind of word end, which breaks whenever one word is a prefix of another.",
      "Sharing a mutable default children map across nodes.",
      "Allocating a fixed 26-slot array per node for a sparse alphabet, wasting most of the memory.",
      "Deleting a word by removing nodes without checking whether another word still needs them.",
    ],
    timeComplexity: "O(L) per insert or lookup, where L is the word length",
    spaceComplexity: "O(total characters), less whatever prefixes are shared",
    difficulty: "MEDIUM",
    order: 200,
  },
];
