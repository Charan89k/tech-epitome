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

/** 02 — Arrays. */
export const ARRAYS_SECTION: SectionSeed = {
  slug: "arrays",
  title: "Arrays",
  summary:
    "Contiguous storage, the operations it makes cheap, and the ones it makes expensive.",
  chapters: [
    {
      slug: "what-is-an-array",
      title: "What Is an Array?",
      summary:
        "Why indexing is instant and inserting in the middle is not.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Explain why array indexing is constant time.",
        "Predict which array operations are cheap and which shift elements.",
        "Choose between an array and a linked structure for a given access pattern.",
      ],
      keyTakeaways: [
        "Elements sit in one contiguous block, so the address of any index is one multiplication away.",
        "Reading and writing by index are O(1); inserting or deleting in the middle is O(n).",
        "Appending is O(1) amortised because the capacity doubles rather than growing by one.",
      ],
      content: [
        h2("What is this?"),
        p(
          "An array stores its elements in one unbroken run of memory. Every element occupies the same number of bytes, which is the property everything else follows from."
        ),
        concept(
          "Why indexing is instant",
          "Because the elements are equally sized and adjacent, the machine computes the address of element i as start + i × size. That is one multiplication and one addition, regardless of whether i is 0 or 10,000,000. Nothing is searched."
        ),

        h2("What that costs elsewhere"),
        p(
          "Contiguity is also the reason inserting into the middle is expensive: there is no gap, so room has to be made by shifting everything after the insertion point."
        ),
        worked(
          "insert 9 at index 1 of [4, 7, 2, 8]",
          "[4, 9, 7, 2, 8]",
          [
            { state: "[4, 7, 2, 8, _]", note: "make room at the end" },
            { state: "[4, 7, 2, 8, 8]", note: "shift 8 right" },
            { state: "[4, 7, 2, 2, 8]", note: "shift 2 right" },
            { state: "[4, 7, 7, 2, 8]", note: "shift 7 right" },
            { state: "[4, 9, 7, 2, 8]", note: "write 9 into the gap" },
          ],
          "Every element after the insertion point moves"
        ),

        h2("Complexity summary"),
        complexity(
          [
            { operation: "Read or write by index", time: "O(1)", space: "O(1)" },
            { operation: "Append", time: "O(1) amortised", space: "O(1)", note: "capacity doubles" },
            { operation: "Insert or delete at the end", time: "O(1) amortised", space: "O(1)" },
            { operation: "Insert or delete in the middle", time: "O(n)", space: "O(1)" },
            { operation: "Search, unsorted", time: "O(n)", space: "O(1)" },
            { operation: "Search, sorted", time: "O(log n)", space: "O(1)" },
          ],
          "The operations, and what contiguity does to each."
        ),
        note(
          "Appending is amortised O(1), not strictly O(1). When the capacity fills, a bigger block is allocated and everything copied — an O(n) step. Because the capacity doubles, that copy happens rarely enough that the average cost per append stays constant."
        ),

        h2("Common mistakes"),
        ul(
          "Deleting elements while iterating forward, which shifts positions under the loop and silently skips items.",
          "Building a list by inserting at the front in a loop, which is quadratic.",
          "Assuming an array lookup by value is fast — only lookup by index is.",
          "Forgetting that slicing copies in most languages, adding a hidden O(n)."
        ),
        warn(
          "Removing items from a list while looping over it is the most common array bug there is. Either iterate backwards, or build a new list, or use the write-pointer technique from the next chapter.",
          "Do not mutate while iterating"
        ),

        quizBlock("array-basics"),
      ],
      quiz: "array-basics",
    },

    {
      slug: "traversal-and-in-place-work",
      title: "Traversal and In-Place Work",
      summary:
        "Carrying state through a single pass, and filtering with a write pointer.",
      difficulty: "EASY",
      readingMinutes: 7,
      objectives: [
        "Carry a running value through one pass instead of recomputing.",
        "Filter or compact an array in place with a write pointer.",
        "Explain why writing into the array you are reading is safe here.",
      ],
      keyTakeaways: [
        "A running accumulator turns a nested recomputation into one pass.",
        "A write pointer that lags a read pointer filters in place with no extra array.",
        "The write pointer can never overtake the read pointer, which is what makes it safe.",
      ],
      content: [
        h2("Carrying state through a pass"),
        p(
          "Many array questions look like they need a nested loop because each position depends on everything before it. Usually that dependency can be carried forward in a variable instead."
        ),
        code(
          "python",
          `# Recomputes the prefix every time: O(n^2)
def prefix_maxima_slow(nums):
    return [max(nums[:i + 1]) for i in range(len(nums))]


# Carries the answer forward: O(n)
def prefix_maxima(nums):
    result = []
    best = float("-inf")
    for value in nums:
        best = max(best, value)
        result.append(best)
    return result`,
          "The same output, one loop apart"
        ),
        insight(
          "Ask what the inner loop recomputes. If the answer for position i can be built from the answer for position i-1, the inner loop is a variable in disguise.",
          "The question to ask"
        ),

        h2("The write pointer"),
        p(
          "Filtering in place uses two indices over the same array: one reads every element, the other marks where the next kept element belongs."
        ),
        code(
          "python",
          `def keep_positive(nums):
    write = 0
    for value in nums:          # read every element
        if value > 0:
            nums[write] = value  # place the kept ones from the front
            write += 1
    return write                 # length of the filtered prefix`,
          "Compacting in place",
          [4, 5]
        ),
        concept(
          "Why this is safe",
          "The write index advances only when something is kept, and the read index advances every iteration. So write ≤ read at all times, which means every position written to has already been read. You can never clobber a value you still need."
        ),
        visual("write-pointer", "Watch a write pointer lag behind a read pointer"),

        h2("Recognising it"),
        recognise(
          "An array must be filtered, deduplicated or partitioned, and the problem says to do it in place with no extra array.",
          [
            "The phrase \"in place\" or \"O(1) extra space\"",
            "Elements are removed or reordered, not transformed",
            "The return value is a count rather than a new array",
            "Relative order must be preserved",
          ],
          "two-pointers",
          "Two indices over one array — one reading, one writing — is the standard shape. The write pointer defines the boundary of the finished prefix."
        ),

        h2("Common mistakes"),
        ul(
          "Advancing the write pointer on every iteration instead of only on a keep.",
          "Returning the array rather than the count, when the problem asked for the count.",
          "Clearing the tail of the array, which costs another pass and is usually not required.",
          "Using a second array, which works but abandons the constraint."
        ),

        practice(["compact-the-queue", "dedupe-sorted-log"], "Practise"),
      ],
      patterns: ["two-pointers"],
      problems: ["compact-the-queue", "dedupe-sorted-log"],
    },

    {
      slug: "prefix-sums",
      title: "Prefix Sums",
      summary:
        "Precompute cumulative totals so any range answers in constant time.",
      difficulty: "MEDIUM",
      readingMinutes: 8,
      objectives: [
        "Build a prefix array and use it to answer range sums in O(1).",
        "Get the index arithmetic right by using a leading zero.",
        "Combine prefix sums with a hash map to count ranges with a target sum.",
      ],
      keyTakeaways: [
        "With a leading zero, the sum of i..j is prefix[j+1] - prefix[i].",
        "Counting ranges with a target sum becomes a lookup of running totals already seen.",
        "The map must be seeded with {0: 1} for the empty prefix.",
      ],
      content: [
        h2("The idea"),
        p(
          "Store, for each position, the total of everything before it. Any range sum is then the difference of two entries."
        ),
        worked(
          "nums = [3, 1, 4, 1, 5]",
          "prefix = [0, 3, 4, 8, 9, 14]",
          [
            { state: "prefix[0] = 0", note: "the empty prefix" },
            { state: "prefix[1] = 3", note: "sum of the first 1 element" },
            { state: "prefix[3] = 8", note: "sum of the first 3 elements" },
            { state: "sum(1..3) = prefix[4] - prefix[1] = 9 - 3 = 6", note: "1 + 4 + 1" },
          ],
          "The leading zero is what keeps the arithmetic clean"
        ),
        code(
          "python",
          `def build_prefix(nums):
    prefix = [0] * (len(nums) + 1)
    for i, value in enumerate(nums):
        prefix[i + 1] = prefix[i] + value
    return prefix


def range_sum(prefix, i, j):
    """Inclusive sum of nums[i..j]."""
    return prefix[j + 1] - prefix[i]`,
          "Building and querying"
        ),
        tip(
          "Always include the leading zero. Without it, a range that starts at index 0 becomes a special case, and special cases are where off-by-one bugs live.",
          "Use the leading zero"
        ),

        h2("Counting ranges with a target sum"),
        p(
          "Rearranging the identity turns a search into a lookup. A range ending at j sums to the target exactly when some earlier running total equals runningTotal(j) - target."
        ),
        code(
          "python",
          `def count_ranges(nums, target):
    seen = {0: 1}     # the empty prefix has occurred once
    running = 0
    count = 0

    for value in nums:
        running += value
        count += seen.get(running - target, 0)
        seen[running] = seen.get(running, 0) + 1

    return count`,
          "Counting without enumerating",
          [2]
        ),
        warn(
          "Omitting the {0: 1} seed silently drops every range that starts at index 0. The code runs, the answer is close, and the bug only shows up in one hidden test.",
          "The seed is not optional"
        ),

        h2("When it does not apply"),
        ul(
          "The array changes between queries — a static prefix array is invalidated by every update.",
          "The operation has no inverse: sums and XORs subtract cleanly, maximums do not.",
          "You need the range itself rather than its total."
        ),

        recognise(
          "A problem asks how many contiguous stretches have a particular sum, or repeatedly asks for the total over arbitrary ranges.",
          [
            "Repeated range-sum queries over a fixed array",
            "\"Number of subarrays such that…\"",
            "A nested loop recomputing overlapping totals",
            "A running balance that makes two different positions equivalent",
          ],
          "prefix-sum",
          "Prefix sums convert a range question into a difference of two precomputed values, and with a frequency map they convert a counting question into a lookup."
        ),

        quizBlock("prefix-sums"),
        practice(["shelf-rebalance", "subarray-sum-count", "product-without-self"], "Practise"),
      ],
      patterns: ["prefix-sum"],
      problems: ["shelf-rebalance", "subarray-sum-count", "product-without-self"],
      quiz: "prefix-sums",
    },

    {
      slug: "array-frequency-patterns",
      title: "Frequency Patterns",
      summary:
        "Counting occurrences to collapse a nested search into a single pass.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Recognise when an inner loop is really a membership or counting question.",
        "Choose between an array of counters and a hash map.",
        "Separate counting from scanning when order matters.",
      ],
      keyTakeaways: [
        "If the inner loop only asks \"does this exist\" or \"how many\", a map removes it.",
        "A fixed, small key space is better served by an array of counters than a hash map.",
        "When order matters, count in one pass and scan in a second.",
      ],
      content: [
        h2("The move"),
        p(
          "A great many quadratic solutions exist because the algorithm keeps re-deriving something it already computed. Counting once removes the inner loop."
        ),
        code(
          "python",
          `# Quadratic: counts each value by rescanning
def most_common_slow(nums):
    best, best_count = None, 0
    for value in nums:
        count = sum(1 for other in nums if other == value)
        if count > best_count:
            best, best_count = value, count
    return best


# Linear: count once, then read the counts
def most_common(nums):
    counts = {}
    for value in nums:
        counts[value] = counts.get(value, 0) + 1
    return max(counts, key=counts.get)`,
          "The same answer, one loop apart"
        ),

        h2("Array of counters versus hash map"),
        table(
          ["Situation", "Use"],
          [
            ["Keys are letters a–z", "An array of 26 counters"],
            ["Keys are small bounded integers", "An array indexed by the value"],
            ["Keys are arbitrary or sparse", "A hash map"],
            ["Keys are tuples or strings", "A hash map"],
          ],
          "Picking the counting structure."
        ),
        note(
          "An array of counters is faster and uses less memory when the key space is small and dense. It is also why many string problems can claim O(1) space: 26 counters do not grow with the input."
        ),

        h2("When order matters"),
        p(
          "Counting needs the whole input; ordering needs the original sequence. Trying to do both in one pass leads back to a nested loop. Two clean passes stay linear."
        ),
        code(
          "python",
          `def first_unique(items):
    counts = {}
    for item in items:
        counts[item] = counts.get(item, 0) + 1

    # Second pass follows the ORIGINAL order, not the map's.
    for index, item in enumerate(items):
        if counts[item] == 1:
            return index
    return -1`,
          "Count, then scan in order",
          [8]
        ),

        recognise(
          "A nested loop where the inner loop only checks existence, counts occurrences, or looks for a complement.",
          [
            "Searching backwards through elements already visited",
            "Comparing two collections for the same contents",
            "Grouping items by a derived key",
            "\"Find the value that appears once / most often / twice\"",
          ],
          "hashing",
          "A hash map answers membership and counting in expected constant time, which is exactly what those inner loops are computing the slow way."
        ),

        practice(["first-unrepeated-symbol", "rearrangement-check", "top-frequency-codes"], "Practise"),
      ],
      patterns: ["hashing"],
      problems: ["first-unrepeated-symbol", "rearrangement-check", "top-frequency-codes"],
    },
  ],
};

/** 03 — Strings. */
export const STRINGS_SECTION: SectionSeed = {
  slug: "strings",
  title: "Strings",
  summary:
    "Text as a sequence, the cost of immutability, and the patterns that recur in string problems.",
  chapters: [
    {
      slug: "string-traversal",
      title: "String Traversal and Immutability",
      summary:
        "Why building a string in a loop can be quadratic, and what to do instead.",
      difficulty: "EASY",
      readingMinutes: 6,
      objectives: [
        "Explain why repeated string concatenation can be quadratic.",
        "Build strings efficiently using a buffer.",
        "Reason about character indexing and its cost.",
      ],
      keyTakeaways: [
        "Strings are immutable in most languages, so every concatenation allocates and copies.",
        "Collect pieces in a list and join once.",
        "Indexing a string is O(1); searching it is O(n).",
      ],
      content: [
        h2("Immutability and its cost"),
        p(
          "In most languages a string cannot be modified after it is created. Concatenation therefore allocates a new string and copies both operands into it."
        ),
        code(
          "python",
          `# Quadratic: each += copies everything accumulated so far
def build_slow(chars):
    out = ""
    for char in chars:
        out += char        # allocates a new string every iteration
    return out


# Linear: collect the pieces, join once
def build(chars):
    pieces = []
    for char in chars:
        pieces.append(char)
    return "".join(pieces)`,
          "The same result, very different cost",
          [5]
        ),
        warn(
          "The slow version has one visible loop and looks linear. The copy is hidden inside the += operator. This is the single most common hidden-cost bug in string code.",
          "One loop, quadratic cost"
        ),
        table(
          ["Language", "Buffer to use"],
          [
            ["Python", "a list plus \"\".join(...)"],
            ["Java", "StringBuilder"],
            ["C++", "std::string with += (already amortised)"],
            ["JavaScript", "an array plus .join(\"\")"],
          ],
          "Building strings without the copy."
        ),

        h2("Indexing and searching"),
        complexity(
          [
            { operation: "Read character at index", time: "O(1)", space: "O(1)" },
            { operation: "Length", time: "O(1)", space: "O(1)" },
            { operation: "Concatenate", time: "O(n + m)", space: "O(n + m)" },
            { operation: "Substring / slice", time: "O(k)", space: "O(k)", note: "copies in most languages" },
            { operation: "Search for a substring", time: "O(n · m) naive", space: "O(1)" },
          ],
          "String operations and their real costs."
        ),
        note(
          "Slicing inside a loop is a common accidental quadratic. If you only need to compare or scan a range, use indices rather than creating the slice."
        ),

        quizBlock("string-basics"),
      ],
      quiz: "string-basics",
    },

    {
      slug: "character-frequency",
      title: "Character Frequency",
      summary:
        "Counting characters, and why a bounded alphabet means constant space.",
      difficulty: "EASY",
      readingMinutes: 5,
      objectives: [
        "Count characters using a fixed array rather than a hash map.",
        "Compare two strings as multisets with one counter array.",
        "Justify an O(1) space claim when the alphabet is bounded.",
      ],
      keyTakeaways: [
        "A bounded alphabet means the counter array does not grow with the input — that is O(1) space.",
        "One counter array is enough: increment from one string, decrement from the other.",
        "Check lengths first; it is a free early exit.",
      ],
      content: [
        h2("Counting with a fixed array"),
        code(
          "python",
          `def counts_of(text):
    counts = [0] * 26
    for char in text:
        counts[ord(char) - ord("a")] += 1
    return counts`,
          "26 counters, regardless of input length"
        ),
        concept(
          "Why this is O(1) space",
          "The array has 26 slots whether the string is ten characters or ten million. Space complexity measures growth with respect to the input, and this does not grow at all. State the alphabet bound when you make the claim — it is only true because the alphabet is fixed."
        ),

        h2("Comparing two strings as multisets"),
        code(
          "python",
          `def same_letters(a, b):
    if len(a) != len(b):
        return False        # free early exit

    counts = [0] * 26
    for char in a:
        counts[ord(char) - ord("a")] += 1
    for char in b:
        index = ord(char) - ord("a")
        counts[index] -= 1
        if counts[index] < 0:
            return False    # b needs a letter a ran out of

    return True`,
          "One array, incremented then decremented",
          [3]
        ),
        insight(
          "Sorting both strings also works and is easier to write, but it imposes an order the question never asked about and costs O(n log n) to do it. Counting is the direct expression of \"same bag of characters\".",
          "Why not just sort?"
        ),

        practice(["rearrangement-check", "first-unrepeated-symbol"], "Practise"),
      ],
      patterns: ["hashing"],
      problems: ["rearrangement-check", "first-unrepeated-symbol"],
    },

    {
      slug: "normalisation",
      title: "Normalisation",
      summary:
        "Transform input into a canonical form so the comparison becomes trivial.",
      difficulty: "EASY",
      readingMinutes: 5,
      objectives: [
        "Recognise when a messy comparison is really a normalisation problem.",
        "Choose a canonical form that discards exactly the ignorable information.",
        "Normalise lazily with pointers when memory is constrained.",
      ],
      keyTakeaways: [
        "If a comparison has many special cases, normalise first and the special cases disappear.",
        "A good canonical form discards exactly what the rule says to ignore, and nothing else.",
        "Normalising lazily with two pointers avoids allocating transformed copies.",
      ],
      content: [
        h2("The idea"),
        p(
          "When a rule says two things are equivalent under some transformation — ignoring case, ignoring punctuation, ignoring order — apply the transformation first. What remains is an equality check."
        ),
        worked(
          '"Ada_Lovelace 01" vs "adalovelace01"',
          "equal",
          [
            { state: '"Ada_Lovelace 01"', note: "drop non-alphanumerics" },
            { state: '"AdaLovelace01"', note: "lowercase" },
            { state: '"adalovelace01"', note: "now a plain equality" },
          ],
          "Normalise both sides, then compare"
        ),

        h2("Choosing the canonical form"),
        table(
          ["Rule", "Canonical form"],
          [
            ["Ignore case", "lowercase everything"],
            ["Ignore order of characters", "sort the characters"],
            ["Ignore punctuation and spacing", "keep only alphanumerics"],
            ["Ignore leading zeros", "parse to a number"],
          ],
          "Discarding exactly what the rule ignores."
        ),
        warn(
          "A canonical form that discards too much creates false matches. Sorting the characters makes \"listen\" and \"silent\" equal, which is right for a rearrangement check and wrong for a case-insensitive comparison.",
          "Discard exactly the right information"
        ),

        h2("Normalising lazily"),
        p(
          "Building transformed copies costs O(n) memory. When the transformation is a per-character decision that does not depend on neighbours, you can skip characters in place instead."
        ),
        code(
          "python",
          `def same_ignoring_noise(a, b):
    i = j = 0
    while i < len(a) and j < len(b):
        if not a[i].isalnum():
            i += 1
            continue
        if not b[j].isalnum():
            j += 1
            continue
        if a[i].lower() != b[j].lower():
            return False
        i += 1
        j += 1

    # Trailing noise on either side must also be skipped.
    while i < len(a) and not a[i].isalnum():
        i += 1
    while j < len(b) and not b[j].isalnum():
        j += 1
    return i == len(a) and j == len(b)`,
          "No allocations",
          [14, 15, 16, 17]
        ),
        note(
          "Forgetting the trailing-skip loops is the classic bug here: \"abc\" and \"abc!!\" are reported as different because one pointer stops short of its end."
        ),

        practice(["normalise-and-compare", "group-by-signature"], "Practise"),
      ],
      problems: ["normalise-and-compare", "group-by-signature"],
    },

    {
      slug: "palindromes-and-substrings",
      title: "Palindromes, Substrings and Subsequences",
      summary:
        "Symmetry as a property of a centre, and a distinction that changes which pattern applies.",
      difficulty: "MEDIUM",
      readingMinutes: 7,
      objectives: [
        "Distinguish a substring from a subsequence and explain why it matters.",
        "Check symmetry with two pointers converging.",
        "Find the longest symmetric stretch by expanding around centres.",
      ],
      keyTakeaways: [
        "A substring is contiguous; a subsequence is not. A window can represent one and not the other.",
        "Symmetry is a property of a centre, and there are 2n-1 centres.",
        "Expanding from every centre is O(n²) and beats generating every substring, which is O(n³).",
      ],
      content: [
        h2("Substring versus subsequence"),
        p(
          "This distinction decides which techniques are even available, so it is worth being precise about."
        ),
        table(
          ["Term", "Meaning", "Count in a string of length n"],
          [
            ["Substring", "Contiguous run of characters", "n(n+1)/2"],
            ["Subsequence", "Characters in order, gaps allowed", "2ⁿ"],
          ],
          "Two words that are easy to confuse and very different."
        ),
        insight(
          "If the problem says substring, a sliding window can represent a candidate and the answer is usually linear or quadratic. If it says subsequence, a window cannot, and the answer is usually dynamic programming.",
          "The word tells you the pattern"
        ),

        h2("Checking symmetry"),
        code(
          "python",
          `def is_symmetric(text):
    left, right = 0, len(text) - 1
    while left < right:
        if text[left] != text[right]:
            return False
        left += 1
        right -= 1
    return True`,
          "Two pointers closing in"
        ),

        h2("The longest symmetric stretch"),
        p(
          "Generating every substring and testing each is O(n³). But symmetry is a property of a centre, not of a substring — so generate centres instead and grow outward."
        ),
        worked(
          '"ABCBA"',
          "the whole string",
          [
            { state: "centre at C", note: "B…B matches" },
            { state: "expand", note: "A…A matches" },
            { state: "expand", note: "out of bounds — stop, length 5" },
          ],
          "Growing from one centre"
        ),
        code(
          "python",
          `def longest_symmetric(text):
    best_start, best_len = 0, 1

    def expand(left, right):
        nonlocal best_start, best_len
        while left >= 0 and right < len(text) and text[left] == text[right]:
            left -= 1
            right += 1
        length = right - left - 1   # the loop overshoots by one each side
        if length > best_len:
            best_len, best_start = length, left + 1

    for i in range(len(text)):
        expand(i, i)       # odd-length centre
        expand(i, i + 1)   # even-length centre

    return text[best_start:best_start + best_len]`,
          "Expand around 2n-1 centres",
          [16, 17]
        ),
        warn(
          "Checking only the n single-character centres misses every even-length palindrome, including \"ABBA\". There are 2n-1 centres, not n.",
          "Do not forget the even centres"
        ),

        practice(["longest-mirrored-core", "valid-nesting"], "Practise"),
        quizBlock("strings-and-symmetry"),
      ],
      patterns: ["two-pointers"],
      problems: ["longest-mirrored-core", "valid-nesting"],
      quiz: "strings-and-symmetry",
    },
  ],
};
