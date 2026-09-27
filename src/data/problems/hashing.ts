import { example, para, rich, type ProblemSeed } from "./types";

/** Hash maps and sets: membership, frequency, complements, grouping. */
export const HASHING_PROBLEMS: ProblemSeed[] = [
  {
    slug: "matching-pair-sum",
    title: "Matching Pair Sum",
    difficulty: "EASY",
    learningObjective:
      "Replace a backwards search with a lookup of what you have already seen.",
    topics: ["hashing", "arrays"],
    patterns: ["hashing"],
    statement: [
      para(
        "A payment reconciler holds a list of transaction amounts and needs to find two of them that sum to a target total."
      ),
      para(
        "Return the two positions, smaller index first. Exactly one such pair exists, and a transaction cannot pair with itself."
      ),
      example(
        "amounts = [4, 11, 9, 2], target = 13",
        "[0, 2]",
        [
          { state: "index 0 (4)", note: "need 9 — not seen; remember 4" },
          { state: "index 1 (11)", note: "need 2 — not seen; remember 11" },
          { state: "index 2 (9)", note: "need 4 — seen at index 0" },
        ],
        "Each element asks for its complement"
      ),
    ],
    constraints: [
      "2 ≤ amounts.length ≤ 100000",
      "-1000000000 ≤ amounts[i] ≤ 1000000000",
      "Exactly one valid pair exists.",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["amounts", "target"],
      returns: "int[]",
      functionName: "matchingPair",
    },
    tests: [
      { input: "4 11 9 2\n13", expected: "0 2", isSample: true, explanation: "4 + 9 = 13." },
      { input: "3 3\n6", expected: "0 1", isSample: true, explanation: "Two equal values at different positions are a valid pair." },
      { input: "-5 5\n0", expected: "0 1" },
      { input: "1 2 3 4 5\n9", expected: "3 4" },
      { input: "0 0\n0", expected: "0 1" },
      { input: "1000000000 1000000000\n2000000000", expected: "0 1" },
      { input: "7 1 2 3\n4", expected: "1 3" },
    ],
    hints: [
      "The nested-loop solution asks, for each element, whether a matching partner appears later. What is that inner loop really doing?",
      "It is a membership test. Those can be constant time.",
      "Walk once, and for each value ask whether the value it needs has already gone past.",
      "Store value → index as you go. Check before you insert, or an element will pair with itself.",
    ],
    solutions: [
      {
        title: "Brute force: every pair",
        order: 1,
        intuition:
          "Try all pairs. It is the definition turned into code and it is correct, but it re-scans the prefix for every element.",
        approach: [
          "For each i, loop j from i+1 to the end.",
          "Return the pair whose values sum to the target.",
        ],
        code: {
          PYTHON: `def matchingPair(amounts: List[int], target: int) -> List[int]:
    for i in range(len(amounts)):
        for j in range(i + 1, len(amounts)):
            if amounts[i] + amounts[j] == target:
                return [i, j]
    return []`,
          JAVA: `class Solution {
    public int[] matchingPair(int[] amounts, int target) {
        for (int i = 0; i < amounts.length; i++) {
            for (int j = i + 1; j < amounts.length; j++) {
                if (amounts[i] + amounts[j] == target) return new int[]{i, j};
            }
        }
        return new int[0];
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["The pair being the last two elements, the worst case."],
        commonMistakes: ["Starting the inner loop at i, which lets an element pair with itself."],
      },
      {
        title: "Optimal: remember what you have seen",
        order: 2,
        intuition:
          "For each value there is exactly one partner that would complete it: target minus the value. Instead of searching forward for that partner, check whether it has already gone past. A map of value to index turns that check into one lookup, and the inner loop disappears.",
        approach: [
          "Walk the array once with a map from value to index.",
          "For each value compute the complement it needs.",
          "If the complement is already in the map, return that index and the current one.",
          "Otherwise record the current value and index.",
        ],
        code: {
          PYTHON: `def matchingPair(amounts: List[int], target: int) -> List[int]:
    seen = {}   # value -> the index it was first seen at

    for index, value in enumerate(amounts):
        complement = target - value
        # Check BEFORE inserting, or a value worth half the target pairs
        # with itself.
        if complement in seen:
            return [seen[complement], index]
        seen[value] = index

    return []`,
          JAVA: `class Solution {
    public int[] matchingPair(int[] amounts, int target) {
        Map<Integer, Integer> seen = new HashMap<>();

        for (int index = 0; index < amounts.length; index++) {
            int complement = target - amounts[index];
            if (seen.containsKey(complement)) {
                return new int[] { seen.get(complement), index };
            }
            seen.put(amounts[index], index);
        }

        return new int[0];
    }
}`,
        },
        timeComplexity: "O(n) expected",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Two equal values forming the pair, which works because the check precedes the insert.",
          "Negative amounts.",
          "Large values whose sum would overflow a 32-bit int in some languages — subtract rather than add.",
        ],
        commonMistakes: [
          "Inserting before checking, which reports index i paired with itself.",
          "Storing the index as the key and the value as the value, then being unable to look up by value.",
          "Returning the values instead of the indices.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "group-by-signature",
    title: "Group by Signature",
    difficulty: "MEDIUM",
    learningObjective:
      "Design a canonical key so that items belonging together hash to the same bucket.",
    topics: ["hashing", "strings"],
    patterns: ["hashing"],
    statement: [
      para(
        "A chemistry database stores compound codes. Two codes describe the same compound when one is a rearrangement of the other."
      ),
      para(
        "Group the codes so that each group contains exactly the codes describing one compound. Return the number of distinct compounds."
      ),
      example(
        'codes = ["eat", "tea", "tan", "ate", "nat"]',
        "2",
        [
          { state: '"eat" → "aet"', note: "new group" },
          { state: '"tea" → "aet"', note: "joins the first group" },
          { state: '"tan" → "ant"', note: "new group" },
          { state: '"ate" → "aet"', note: "joins the first group" },
        ],
        "Sorting each code gives a canonical key"
      ),
    ],
    constraints: [
      "1 ≤ codes.length ≤ 10000",
      "1 ≤ codes[i].length ≤ 100",
      "Codes contain lowercase letters only.",
    ],
    signature: {
      params: ["string[]"],
      paramNames: ["codes"],
      returns: "int",
      functionName: "countCompounds",
    },
    tests: [
      { input: "5\neat\ntea\ntan\nate\nnat", expected: "2", isSample: true, explanation: "{eat, tea, ate} and {tan, nat}." },
      { input: "1\nx", expected: "1", isSample: true },
      { input: "3\nabc\nbca\ncab", expected: "1" },
      { input: "3\na\nb\nc", expected: "3" },
      { input: "2\naab\naba", expected: "1" },
      { input: "2\naab\nabb", expected: "2" },
      { input: "4\n\n\na\na", expected: "2" },
    ],
    hints: [
      "Comparing every code with every other one is quadratic. What single value could stand for a whole group?",
      "You need a key that is identical for rearrangements and different otherwise.",
      "Sorting a code's characters produces exactly that.",
      "Put the sorted form in a set, and the answer is the set's size.",
    ],
    solutions: [
      {
        title: "Canonical key from sorted characters",
        order: 1,
        intuition:
          "The grouping rule — same characters, any order — is awkward to test pairwise but trivial to normalise. Sorting a code's characters throws away exactly the information the rule says to ignore, so every member of a group collapses to the same string. Hashing does the grouping from there.",
        approach: [
          "For each code, sort its characters to build a canonical key.",
          "Insert each key into a set.",
          "Return the set's size.",
        ],
        code: {
          PYTHON: `def countCompounds(codes: List[str]) -> int:
    signatures = set()

    for code in codes:
        # Sorting discards exactly the information the rule ignores: order.
        signatures.add("".join(sorted(code)))

    return len(signatures)`,
          JAVA: `class Solution {
    public int countCompounds(String[] codes) {
        Set<String> signatures = new HashSet<>();

        for (String code : codes) {
            char[] chars = code.toCharArray();
            Arrays.sort(chars);
            signatures.add(new String(chars));
        }

        return signatures.size();
    }
}`,
        },
        timeComplexity: "O(n · k log k), where k is the longest code",
        spaceComplexity: "O(n · k)",
        edgeCases: [
          "Empty code strings, which all share the empty key.",
          "Every code distinct.",
          "Every code a rearrangement of one another.",
        ],
        commonMistakes: [
          "Using a character-count array as a key without converting it to something hashable — arrays hash by identity in several languages.",
          "Comparing codes pairwise, which is O(n²·k).",
          "Sorting the list of codes rather than the characters within each code.",
        ],
      },
    ],
    expectedTime: "O(n · k log k)",
    expectedSpace: "O(n · k)",
  },

  {
    slug: "longest-consecutive-run",
    title: "Longest Consecutive Run",
    difficulty: "MEDIUM",
    learningObjective:
      "Start work only at the points where it cannot be repeated, keeping a nested loop linear.",
    topics: ["hashing", "arrays"],
    patterns: ["hashing"],
    statement: [
      para(
        "A build system records the version numbers it has cached, in no particular order and possibly with duplicates."
      ),
      para(
        "Find the length of the longest run of consecutive version numbers present in the cache."
      ),
      example(
        "versions = [100, 4, 200, 1, 3, 2]",
        "4",
        [
          { state: "set", note: "{100, 4, 200, 1, 3, 2}" },
          { state: "1 has no 0 before it", note: "run start — count 1,2,3,4" },
          { state: "100 has no 99", note: "run of length 1" },
          { state: "longest", note: "4" },
        ],
        "Only run starts trigger a walk"
      ),
    ],
    constraints: [
      "0 ≤ versions.length ≤ 100000",
      "-1000000000 ≤ versions[i] ≤ 1000000000",
      "Duplicates may appear.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["versions"],
      returns: "int",
      functionName: "longestRun",
    },
    tests: [
      { input: "100 4 200 1 3 2", expected: "4", isSample: true, explanation: "1, 2, 3, 4." },
      { input: "", expected: "0", isSample: true },
      { input: "5", expected: "1" },
      { input: "1 1 1 1", expected: "1" },
      { input: "1 2 0 1", expected: "3" },
      { input: "-3 -2 -1 0 1", expected: "5" },
      { input: "10 30 20", expected: "1" },
      { input: "9 1 4 7 3 2 6 5", expected: "7" },
    ],
    hints: [
      "Sorting solves this in O(n log n). The target is linear, so sorting is out.",
      "Put everything in a set so membership is constant time. Now, for any number, you can walk upward one at a time.",
      "Walking upward from every number is still quadratic on a long run. Which numbers are worth starting from?",
      "Only a number with no predecessor in the set. Every run then gets walked exactly once.",
    ],
    solutions: [
      {
        title: "Set membership, walking only from run starts",
        order: 1,
        intuition:
          "With a set, extending a run is cheap. The trap is starting a walk from every element, which re-walks the same run from each of its members. The fix is a guard: only begin walking at a number whose predecessor is absent. Each run then has exactly one starting point, so the total work across all walks is bounded by the number of elements.",
        approach: [
          "Put every version into a set, which also removes duplicates.",
          "For each value in the set, skip it unless value - 1 is absent.",
          "From a genuine start, walk upward while the next value is present.",
          "Track the longest walk.",
        ],
        code: {
          PYTHON: `def longestRun(versions: List[int]) -> int:
    present = set(versions)
    best = 0

    for value in present:
        # Only start walking where a run actually begins. Without this
        # guard the inner loop re-walks each run once per member.
        if value - 1 in present:
            continue

        length = 1
        current = value
        while current + 1 in present:
            current += 1
            length += 1

        best = max(best, length)

    return best`,
          JAVA: `class Solution {
    public int longestRun(int[] versions) {
        Set<Integer> present = new HashSet<>();
        for (int v : versions) present.add(v);

        int best = 0;
        for (int value : present) {
            if (present.contains(value - 1)) continue;

            int length = 1;
            int current = value;
            while (present.contains(current + 1)) {
                current++;
                length++;
            }

            best = Math.max(best, length);
        }

        return best;
    }
}`,
        },
        timeComplexity: "O(n) — each value is visited at most twice",
        spaceComplexity: "O(n)",
        edgeCases: [
          "An empty input, returning 0.",
          "All duplicates, returning 1.",
          "Negative values spanning zero.",
        ],
        commonMistakes: [
          "Omitting the predecessor guard, which makes the solution quadratic on a single long run.",
          "Iterating the original array instead of the set, re-walking for each duplicate.",
          "Returning 1 for an empty input.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "subarray-sum-count",
    title: "Budget Windows",
    difficulty: "MEDIUM",
    learningObjective:
      "Turn a range-sum question into a lookup by storing the running totals you have already passed.",
    topics: ["hashing", "arrays"],
    patterns: ["prefix-sum"],
    statement: [
      para(
        "A finance team reviews daily net cash movements and wants to know how many contiguous stretches of days net exactly to a target amount."
      ),
      para("Return the number of such stretches. Stretches may overlap."),
      example(
        "movements = [1, 2, 3], target = 3",
        "2",
        [
          { state: "[1, 2]", note: "sums to 3" },
          { state: "[3]", note: "sums to 3" },
        ],
        "Both qualifying stretches"
      ),
    ],
    constraints: [
      "1 ≤ movements.length ≤ 20000",
      "-1000 ≤ movements[i] ≤ 1000",
      "-10000000 ≤ target ≤ 10000000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["movements", "target"],
      returns: "int",
      functionName: "countBudgetWindows",
    },
    tests: [
      { input: "1 2 3\n3", expected: "2", isSample: true, explanation: "[1,2] and [3]." },
      { input: "1 1 1\n2", expected: "2", isSample: true, explanation: "The two overlapping adjacent pairs." },
      { input: "1\n1", expected: "1" },
      { input: "1\n2", expected: "0" },
      { input: "0 0 0\n0", expected: "6" },
      { input: "-1 1 -1 1\n0", expected: "4" },
      { input: "3 -1 -1 3\n3", expected: "2" },
      { input: "1000 1000\n2000", expected: "1" },
    ],
    hints: [
      "Checking every start and end pair is O(n²). What identity connects a range sum to two running totals?",
      "sum(i..j) equals runningTotal(j) minus runningTotal(i-1).",
      "Rearrange it: for a fixed end j, you need runningTotal(j) - target to have occurred earlier.",
      "Count how many times each running total has been seen. Seed the count of 0 with one, for the empty prefix.",
    ],
    solutions: [
      {
        title: "Running total plus a frequency map",
        order: 1,
        intuition:
          "A stretch ending at day j nets to the target exactly when some earlier running total equals the current total minus the target. So instead of enumerating stretches, count how often each running total has occurred. The seed entry for total 0 represents the empty prefix, and without it every stretch that starts on day one is missed.",
        approach: [
          "Keep a running total and a map from total to how many times it has been seen.",
          "Seed the map with {0: 1} for the empty prefix.",
          "For each movement, update the running total.",
          "Add to the answer however many times (total - target) has already been seen.",
          "Record the current total.",
        ],
        code: {
          PYTHON: `def countBudgetWindows(movements: List[int], target: int) -> int:
    # The empty prefix has total 0 and has occurred once. Omitting this
    # silently drops every stretch that begins on the first day.
    seen = {0: 1}
    running = 0
    count = 0

    for value in movements:
        running += value
        count += seen.get(running - target, 0)
        seen[running] = seen.get(running, 0) + 1

    return count`,
          JAVA: `class Solution {
    public int countBudgetWindows(int[] movements, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        seen.put(0, 1);

        int running = 0;
        int count = 0;

        for (int value : movements) {
            running += value;
            count += seen.getOrDefault(running - target, 0);
            seen.merge(running, 1, Integer::sum);
        }

        return count;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A target of zero with zero-valued movements, which produces many overlapping stretches.",
          "Negative movements, where running totals can repeat.",
          "A single element.",
        ],
        commonMistakes: [
          "Omitting the {0: 1} seed.",
          "Recording the running total before counting, which lets a zero-length stretch match.",
          "Trying to use a sliding window — it does not work with negative values, because growing the window no longer grows the sum.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "duplicate-within-distance",
    title: "Duplicate Within Distance",
    difficulty: "EASY",
    learningObjective:
      "Store position alongside value so a membership test can also answer a distance question.",
    topics: ["hashing", "arrays"],
    patterns: ["hashing"],
    statement: [
      para(
        "A log deduplicator flags an event as a repeat only if the same event id appeared within the last k entries."
      ),
      rich("Return ", { code: "true" }, " if any value appears twice at positions no more than ", { code: "k" }, " apart."),
      example(
        "ids = [1, 2, 3, 1], k = 3",
        "true",
        [
          { state: "1 at index 0", note: "remember 1 → 0" },
          { state: "1 at index 3", note: "3 - 0 = 3 ≤ k → repeat" },
        ],
        "The map stores the most recent position"
      ),
    ],
    constraints: [
      "1 ≤ ids.length ≤ 100000",
      "-1000000000 ≤ ids[i] ≤ 1000000000",
      "0 ≤ k ≤ 100000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["ids", "k"],
      returns: "bool",
      functionName: "hasNearbyDuplicate",
    },
    tests: [
      { input: "1 2 3 1\n3", expected: "true", isSample: true, explanation: "The two 1s are exactly 3 apart." },
      { input: "1 2 3 1\n2", expected: "false", isSample: true, explanation: "The only duplicate is 3 apart, which exceeds k." },
      { input: "1 1\n0", expected: "false" },
      { input: "1 2 3\n2", expected: "false" },
      { input: "1 0 1 1\n1", expected: "true" },
      { input: "5\n100", expected: "false" },
      { input: "9 9\n1", expected: "true" },
    ],
    hints: [
      "A plain set tells you whether a value has appeared, but not where.",
      "Store the position along with the value.",
      "When you meet a value again, compare the current index with the stored one.",
      "Always overwrite with the newer index — the closest previous occurrence is the only one that can satisfy the bound.",
    ],
    solutions: [
      {
        title: "Map from value to its most recent index",
        order: 1,
        intuition:
          "The question is really two questions at once: has this value occurred, and how long ago. A set answers the first; adding the index as the map's value answers the second. Keeping only the most recent index is enough, because an older occurrence is strictly further away and can never satisfy a bound the newer one fails.",
        approach: [
          "Walk the array with a map from value to its latest index.",
          "If the value is present and the index gap is at most k, return true.",
          "Otherwise store the current index, overwriting any older one.",
          "Return false after the loop.",
        ],
        code: {
          PYTHON: `def hasNearbyDuplicate(ids: List[int], k: int) -> bool:
    last_seen = {}   # value -> the most recent index it appeared at

    for index, value in enumerate(ids):
        previous = last_seen.get(value)
        if previous is not None and index - previous <= k:
            return True
        # Overwrite: an older occurrence is strictly further away.
        last_seen[value] = index

    return False`,
          JAVA: `class Solution {
    public boolean hasNearbyDuplicate(int[] ids, int k) {
        Map<Integer, Integer> lastSeen = new HashMap<>();

        for (int index = 0; index < ids.length; index++) {
            Integer previous = lastSeen.get(ids[index]);
            if (previous != null && index - previous <= k) return true;
            lastSeen.put(ids[index], index);
        }

        return false;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "k = 0, where no two distinct positions can qualify.",
          "No duplicates at all.",
          "Duplicates further apart than k.",
        ],
        commonMistakes: [
          "Keeping the first index rather than the most recent, which misses closer pairs.",
          "Using a plain set and losing the distance information.",
          "Using < instead of ≤ when comparing against k.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "top-frequency-codes",
    title: "Top Frequency Codes",
    difficulty: "MEDIUM",
    learningObjective:
      "Combine counting with a bounded heap to rank without sorting everything.",
    topics: ["hashing", "arrays"],
    patterns: ["top-k", "hashing"],
    statement: [
      para(
        "An error dashboard needs the k error codes that occurred most often."
      ),
      para(
        "Return those codes sorted by frequency, highest first. When two codes tie, the smaller code comes first."
      ),
      example(
        "codes = [1, 1, 1, 2, 2, 3], k = 2",
        "[1, 2]",
        [
          { state: "counts", note: "1 → 3, 2 → 2, 3 → 1" },
          { state: "top 2", note: "1 (3 times), 2 (2 times)" },
        ],
        "Count first, then rank"
      ),
    ],
    constraints: [
      "1 ≤ codes.length ≤ 100000",
      "1 ≤ k ≤ number of distinct codes",
      "1 ≤ codes[i] ≤ 1000000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["codes", "k"],
      returns: "int[]",
      functionName: "topCodes",
    },
    tests: [
      { input: "1 1 1 2 2 3\n2", expected: "1 2", isSample: true, explanation: "1 occurs three times, 2 twice." },
      { input: "7\n1", expected: "7", isSample: true },
      { input: "1 2\n2", expected: "1 2", isSample: true, explanation: "Tied at one occurrence each, so the smaller code leads." },
      { input: "5 5 4 4 3\n2", expected: "4 5" },
      { input: "1 1 2 2 3 3\n3", expected: "1 2 3" },
      { input: "9 9 9 9\n1", expected: "9" },
      { input: "3 1 2\n3", expected: "1 2 3" },
    ],
    hints: [
      "Two separate questions: how many times does each code occur, and which counts are the largest?",
      "The first is a frequency map.",
      "For the second, sorting every distinct code costs O(m log m). If k is small, you can do better.",
      "Keep a heap of size k. For the k largest, the heap holds the weakest survivor at its root.",
    ],
    solutions: [
      {
        title: "Frequency map, then a bounded heap",
        order: 1,
        intuition:
          "Sorting every distinct code puts the whole list in order when only the top k is wanted. A heap of size k keeps just the current winners: the root is the weakest one still in, so admitting a newcomer costs a single comparison. The tie-break has to be part of the comparison, not applied afterwards, or two codes with equal counts can be evicted in the wrong order.",
        approach: [
          "Count occurrences into a map.",
          "Push each (count, code) pair onto a min-heap ordered by count ascending, then by code descending so that on a tie the larger code is evicted first.",
          "Pop whenever the heap exceeds k.",
          "Drain and sort the survivors by count descending, then code ascending.",
        ],
        code: {
          PYTHON: `import heapq


def topCodes(codes: List[int], k: int) -> List[int]:
    counts = {}
    for code in codes:
        counts[code] = counts.get(code, 0) + 1

    # Min-heap of size k. Ordering by (count, -code) means the element the
    # heap considers "smallest" - and so evicts first - is the one with the
    # lowest count, and on a tie the LARGEST code. That is exactly the one
    # the tie-break says to drop.
    heap = []
    for code, count in counts.items():
        heapq.heappush(heap, (count, -code))
        if len(heap) > k:
            heapq.heappop(heap)

    survivors = [(count, -negated) for count, negated in heap]
    survivors.sort(key=lambda pair: (-pair[0], pair[1]))
    return [code for _count, code in survivors]`,
          JAVA: `class Solution {
    public int[] topCodes(int[] codes, int k) {
        Map<Integer, Integer> counts = new HashMap<>();
        for (int code : codes) counts.merge(code, 1, Integer::sum);

        // Evict lowest count first; on a tie evict the larger code.
        PriorityQueue<int[]> heap = new PriorityQueue<>(
            (a, b) -> a[1] != b[1] ? a[1] - b[1] : b[0] - a[0]
        );

        for (Map.Entry<Integer, Integer> entry : counts.entrySet()) {
            heap.offer(new int[] { entry.getKey(), entry.getValue() });
            if (heap.size() > k) heap.poll();
        }

        List<int[]> survivors = new ArrayList<>(heap);
        survivors.sort((a, b) -> a[1] != b[1] ? b[1] - a[1] : a[0] - b[0]);

        int[] result = new int[survivors.size()];
        for (int i = 0; i < result.length; i++) result[i] = survivors.get(i)[0];
        return result;
    }
}`,
        },
        timeComplexity: "O(n + m log k), where m is the number of distinct codes",
        spaceComplexity: "O(m)",
        edgeCases: [
          "k equal to the number of distinct codes.",
          "All codes identical.",
          "Ties across the k boundary, which the comparator must resolve.",
        ],
        commonMistakes: [
          "Using a max-heap of all elements, which is O(m log m) and holds everything.",
          "Applying the tie-break only when sorting the survivors, after the heap has already evicted the wrong one.",
          "Assuming the heap iterates in sorted order.",
        ],
      },
    ],
    expectedTime: "O(n + m log k)",
    expectedSpace: "O(m)",
  },
];
