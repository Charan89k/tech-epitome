import { bullets, example, para, rich, type ProblemSeed } from "./types";

/**
 * Searching a space of choices: backtracking, binary search on the answer,
 * prefix trees, cyclic placement and prefix sums.
 */
export const SEARCH_BACKTRACKING_PROBLEMS: ProblemSeed[] = [
  // ---------------------------------------------------------------------------
  // Backtracking
  // ---------------------------------------------------------------------------
  {
    slug: "keypad-spellings",
    title: "Keypad Spellings",
    difficulty: "MEDIUM",
    learningObjective:
      "Build every combination by fixing one position at a time, extending a shared buffer and undoing the choice on the way back.",
    topics: ["backtracking"],
    patterns: ["backtracking"],
    statement: [
      para(
        "A shop wants a memorable vanity number. On an old phone keypad each digit from 2 to 9 stands for a few letters, and the marketing team wants to see every word a short run of digits could spell."
      ),
      bullets(
        "2 → a b c",
        "3 → d e f",
        "4 → g h i",
        "5 → j k l",
        "6 → m n o",
        "7 → p q r s",
        "8 → t u v",
        "9 → w x y z"
      ),
      rich(
        "Given ",
        { code: "digits" },
        ", return every spelling that picks one letter for each digit, in order. List the spellings in ",
        { strong: "alphabetical order" },
        "."
      ),
      example(
        'digits = "23"',
        '["ad", "ae", "af", "bd", "be", "bf", "cd", "ce", "cf"]',
        [
          { state: "a_", note: "fix the first letter as a, then try d, e, f" },
          { state: "b_", note: "undo a, fix b, try d, e, f again" },
          { state: "c_", note: "undo b, fix c, last three spellings" },
        ],
        "Fixing one letter per digit, left to right"
      ),
    ],
    constraints: [
      "1 ≤ digits.length ≤ 4",
      "Every character of digits is between '2' and '9'.",
      "Output: the number of spellings on one line, then one spelling per line, alphabetically.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["digits"],
      returns: "string[]",
      functionName: "keypadSpellings",
    },
    tests: [
      {
        input: "23",
        expected: "9\nad\nae\naf\nbd\nbe\nbf\ncd\nce\ncf",
        isSample: true,
        explanation:
          "Digit 2 offers a, b, c and digit 3 offers d, e, f: nine pairings, listed alphabetically.",
      },
      {
        input: "7",
        expected: "4\np\nq\nr\ns",
        isSample: true,
        explanation: "A single key yields its own letters.",
      },
      { input: "9", expected: "4\nw\nx\ny\nz" },
      {
        input: "79",
        expected: "16\npw\npx\npy\npz\nqw\nqx\nqy\nqz\nrw\nrx\nry\nrz\nsw\nsx\nsy\nsz",
      },
      {
        input: "222",
        expected:
          "27\naaa\naab\naac\naba\nabb\nabc\naca\nacb\nacc\nbaa\nbab\nbac\nbba\nbbb\nbbc\nbca\nbcb\nbcc\ncaa\ncab\ncac\ncba\ncbb\ncbc\ncca\nccb\nccc",
      },
      { input: "8", expected: "3\nt\nu\nv" },
      {
        input: "9797",
        expected:
          "256\nwpwp\nwpwq\nwpwr\nwpws\nwpxp\nwpxq\nwpxr\nwpxs\nwpyp\nwpyq\nwpyr\nwpys\nwpzp\nwpzq\nwpzr\nwpzs\nwqwp\nwqwq\nwqwr\nwqws\nwqxp\nwqxq\nwqxr\nwqxs\nwqyp\nwqyq\nwqyr\nwqys\nwqzp\nwqzq\nwqzr\nwqzs\nwrwp\nwrwq\nwrwr\nwrws\nwrxp\nwrxq\nwrxr\nwrxs\nwryp\nwryq\nwryr\nwrys\nwrzp\nwrzq\nwrzr\nwrzs\nwswp\nwswq\nwswr\nwsws\nwsxp\nwsxq\nwsxr\nwsxs\nwsyp\nwsyq\nwsyr\nwsys\nwszp\nwszq\nwszr\nwszs\nxpwp\nxpwq\nxpwr\nxpws\nxpxp\nxpxq\nxpxr\nxpxs\nxpyp\nxpyq\nxpyr\nxpys\nxpzp\nxpzq\nxpzr\nxpzs\nxqwp\nxqwq\nxqwr\nxqws\nxqxp\nxqxq\nxqxr\nxqxs\nxqyp\nxqyq\nxqyr\nxqys\nxqzp\nxqzq\nxqzr\nxqzs\nxrwp\nxrwq\nxrwr\nxrws\nxrxp\nxrxq\nxrxr\nxrxs\nxryp\nxryq\nxryr\nxrys\nxrzp\nxrzq\nxrzr\nxrzs\nxswp\nxswq\nxswr\nxsws\nxsxp\nxsxq\nxsxr\nxsxs\nxsyp\nxsyq\nxsyr\nxsys\nxszp\nxszq\nxszr\nxszs\nypwp\nypwq\nypwr\nypws\nypxp\nypxq\nypxr\nypxs\nypyp\nypyq\nypyr\nypys\nypzp\nypzq\nypzr\nypzs\nyqwp\nyqwq\nyqwr\nyqws\nyqxp\nyqxq\nyqxr\nyqxs\nyqyp\nyqyq\nyqyr\nyqys\nyqzp\nyqzq\nyqzr\nyqzs\nyrwp\nyrwq\nyrwr\nyrws\nyrxp\nyrxq\nyrxr\nyrxs\nyryp\nyryq\nyryr\nyrys\nyrzp\nyrzq\nyrzr\nyrzs\nyswp\nyswq\nyswr\nysws\nysxp\nysxq\nysxr\nysxs\nysyp\nysyq\nysyr\nysys\nyszp\nyszq\nyszr\nyszs\nzpwp\nzpwq\nzpwr\nzpws\nzpxp\nzpxq\nzpxr\nzpxs\nzpyp\nzpyq\nzpyr\nzpys\nzpzp\nzpzq\nzpzr\nzpzs\nzqwp\nzqwq\nzqwr\nzqws\nzqxp\nzqxq\nzqxr\nzqxs\nzqyp\nzqyq\nzqyr\nzqys\nzqzp\nzqzq\nzqzr\nzqzs\nzrwp\nzrwq\nzrwr\nzrws\nzrxp\nzrxq\nzrxr\nzrxs\nzryp\nzryq\nzryr\nzrys\nzrzp\nzrzq\nzrzr\nzrzs\nzswp\nzswq\nzswr\nzsws\nzsxp\nzsxq\nzsxr\nzsxs\nzsyp\nzsyq\nzsyr\nzsys\nzszp\nzszq\nzszr\nzszs",
      },
      {
        input: "2345",
        expected:
          "81\nadgj\nadgk\nadgl\nadhj\nadhk\nadhl\nadij\nadik\nadil\naegj\naegk\naegl\naehj\naehk\naehl\naeij\naeik\naeil\nafgj\nafgk\nafgl\nafhj\nafhk\nafhl\nafij\nafik\nafil\nbdgj\nbdgk\nbdgl\nbdhj\nbdhk\nbdhl\nbdij\nbdik\nbdil\nbegj\nbegk\nbegl\nbehj\nbehk\nbehl\nbeij\nbeik\nbeil\nbfgj\nbfgk\nbfgl\nbfhj\nbfhk\nbfhl\nbfij\nbfik\nbfil\ncdgj\ncdgk\ncdgl\ncdhj\ncdhk\ncdhl\ncdij\ncdik\ncdil\ncegj\ncegk\ncegl\ncehj\ncehk\ncehl\nceij\nceik\nceil\ncfgj\ncfgk\ncfgl\ncfhj\ncfhk\ncfhl\ncfij\ncfik\ncfil",
      },
      {
        input: "77",
        expected: "16\npp\npq\npr\nps\nqp\nqq\nqr\nqs\nrp\nrq\nrr\nrs\nsp\nsq\nsr\nss",
      },
    ],
    hints: [
      "How many spellings are there? Multiply the number of letters on each key.",
      "Choose the letter for the first digit, then solve the same problem for the remaining digits.",
      "Keep one buffer. Append a letter, recurse, then remove it before trying the next letter.",
      "Trying each key's letters in a-to-z order produces the spellings already in alphabetical order, so no sort is needed.",
    ],
    solutions: [
      {
        title: "Grow every spelling one key at a time",
        order: 1,
        intuition:
          "Start from a single empty spelling. Each digit multiplies the list: every spelling so far is copied once per letter on the next key. After the last digit, the list holds every answer. It works, but every intermediate layer is a complete list of fresh strings.",
        approach: [
          "Start with a list holding the empty string.",
          "For each digit, build a new list: each existing spelling followed by each of the key's letters.",
          "Replace the old list with the new one.",
          "Return the list after the final digit.",
        ],
        code: {
          PYTHON: `def keypadSpellings(digits: str) -> List[str]:
    letters = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
               "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    spellings = [""]
    for digit in digits:
        spellings = [prefix + ch for prefix in spellings for ch in letters[digit]]
    return spellings`,
          JAVA: `class Solution {
    private static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};

    public String[] keypadSpellings(String digits) {
        List<String> spellings = new ArrayList<>();
        spellings.add("");
        for (char digit : digits.toCharArray()) {
            List<String> next = new ArrayList<>();
            for (String prefix : spellings) {
                for (char ch : KEYS[digit - '0'].toCharArray()) next.add(prefix + ch);
            }
            spellings = next;
        }
        return spellings.toArray(new String[0]);
    }
}`,
        },
        timeComplexity: "O(4ⁿ · n)",
        spaceComplexity: "O(4ⁿ · n) — every layer is a full list of strings",
        edgeCases: [
          "A single digit.",
          "Keys 7 and 9, which carry four letters instead of three.",
        ],
        commonMistakes: [
          "Assuming every key has three letters.",
          "Iterating letters in the outer loop, which produces the right set in the wrong order.",
        ],
      },
      {
        title: "Optimal: backtracking with one shared buffer",
        order: 2,
        intuition:
          "Think of the answers as leaves of a tree whose depth is the number of digits. A depth-first walk only ever needs the path from the root to the current node — one letter per digit chosen so far. Append a letter on the way down, pop it on the way up, and record the path whenever it reaches full length. Visiting letters in alphabetical order makes the leaves come out alphabetically.",
        approach: [
          "Keep a list of chosen letters and a list of results.",
          "extend(index): if index equals the number of digits, join the chosen letters and record them.",
          "Otherwise, for each letter on the key for digits[index], append it, call extend(index + 1), and pop it.",
          "Call extend(0) and return the results.",
        ],
        code: {
          PYTHON: `def keypadSpellings(digits: str) -> List[str]:
    letters = {"2": "abc", "3": "def", "4": "ghi", "5": "jkl",
               "6": "mno", "7": "pqrs", "8": "tuv", "9": "wxyz"}
    results = []
    chosen = []

    def extend(index: int) -> None:
        if index == len(digits):
            results.append("".join(chosen))
            return
        for ch in letters[digits[index]]:
            chosen.append(ch)      # choose
            extend(index + 1)      # explore
            chosen.pop()           # undo

    extend(0)
    return results`,
          JAVA: `class Solution {
    private static final String[] KEYS = {"", "", "abc", "def", "ghi", "jkl", "mno", "pqrs", "tuv", "wxyz"};
    private final List<String> results = new ArrayList<>();
    private final StringBuilder chosen = new StringBuilder();
    private String digits;

    public String[] keypadSpellings(String digits) {
        this.digits = digits;
        extend(0);
        return results.toArray(new String[0]);
    }

    private void extend(int index) {
        if (index == digits.length()) {
            results.add(chosen.toString());
            return;
        }
        for (char ch : KEYS[digits.charAt(index) - '0'].toCharArray()) {
            chosen.append(ch);
            extend(index + 1);
            chosen.deleteCharAt(chosen.length() - 1);
        }
    }
}`,
        },
        timeComplexity: "O(4ⁿ · n) — 4ⁿ leaves, each joined in O(n)",
        spaceComplexity: "O(n) beyond the output",
        edgeCases: [
          "A single digit, where every leaf is one letter.",
          "Repeated digits such as 77, which are still independent choices.",
        ],
        commonMistakes: [
          "Forgetting to pop after the recursive call, so later spellings grow too long.",
          "Recording the buffer object itself instead of a copy, so every result later reads the same.",
        ],
      },
    ],
    expectedTime: "O(4ⁿ · n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "feature-bundles",
    title: "Feature Bundles",
    difficulty: "MEDIUM",
    learningObjective:
      "Enumerate every subset with a start-index recursion, and see why recording each node in preorder yields a sorted listing for free.",
    topics: ["backtracking"],
    patterns: ["backtracking"],
    statement: [
      para(
        "A product team ships optional features, each identified by a distinct integer id. Before launch they want to review every bundle a customer could switch on — including switching nothing on."
      ),
      rich(
        "Return every subset of ",
        { code: "ids" },
        ". Write each bundle as its ids in increasing order, comma-separated inside square brackets with no spaces (the empty bundle is ",
        { code: "[]" },
        "). List the bundles in ",
        { strong: "lexicographic order as number sequences" },
        ": compare the first ids, then the second, and so on, with a bundle that is a prefix of another coming first."
      ),
      example(
        "ids = [3, 1, 2]",
        '["[]", "[1]", "[1,2]", "[1,2,3]", "[1,3]", "[2]", "[2,3]", "[3]"]',
        [
          { state: "[]", note: "the empty bundle is recorded first" },
          { state: "[1] → [1,2] → [1,2,3]", note: "keep extending with larger ids" },
          { state: "[1,3]", note: "back out of 2, try 3 after 1" },
          { state: "[2] → [2,3], then [3]", note: "start over from the next id" },
        ],
        "Preorder walk over sorted ids"
      ),
    ],
    constraints: [
      "1 ≤ ids.length ≤ 10",
      "-100 ≤ ids[i] ≤ 100, all distinct",
      "Output: the number of bundles, then one bundle per line in the order described.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["ids"],
      returns: "string[]",
      functionName: "listBundles",
    },
    tests: [
      {
        input: "3 1 2",
        expected: "8\n[]\n[1]\n[1,2]\n[1,2,3]\n[1,3]\n[2]\n[2,3]\n[3]",
        isSample: true,
        explanation:
          "Eight bundles. Each lists its ids in increasing order, and the bundles are ordered as number sequences, so [1,2,3] comes before [1,3].",
      },
      {
        input: "5",
        expected: "2\n[]\n[5]",
        isSample: true,
        explanation: "The empty bundle and the bundle holding only 5.",
      },
      { input: "-4 7", expected: "4\n[]\n[-4]\n[-4,7]\n[7]" },
      {
        input: "10 -10 0 5",
        expected:
          "16\n[]\n[-10]\n[-10,0]\n[-10,0,5]\n[-10,0,5,10]\n[-10,0,10]\n[-10,5]\n[-10,5,10]\n[-10,10]\n[0]\n[0,5]\n[0,5,10]\n[0,10]\n[5]\n[5,10]\n[10]",
      },
      {
        input: "9 8 7 6 5",
        expected:
          "32\n[]\n[5]\n[5,6]\n[5,6,7]\n[5,6,7,8]\n[5,6,7,8,9]\n[5,6,7,9]\n[5,6,8]\n[5,6,8,9]\n[5,6,9]\n[5,7]\n[5,7,8]\n[5,7,8,9]\n[5,7,9]\n[5,8]\n[5,8,9]\n[5,9]\n[6]\n[6,7]\n[6,7,8]\n[6,7,8,9]\n[6,7,9]\n[6,8]\n[6,8,9]\n[6,9]\n[7]\n[7,8]\n[7,8,9]\n[7,9]\n[8]\n[8,9]\n[9]",
      },
      {
        input: "42 -1 3 17 -8 0 100 2 55 -30",
        expected:
          "1024\n[]\n[-30]\n[-30,-8]\n[-30,-8,-1]\n[-30,-8,-1,0]\n[-30,-8,-1,0,2]\n[-30,-8,-1,0,2,3]\n[-30,-8,-1,0,2,3,17]\n[-30,-8,-1,0,2,3,17,42]\n[-30,-8,-1,0,2,3,17,42,55]\n[-30,-8,-1,0,2,3,17,42,55,100]\n[-30,-8,-1,0,2,3,17,42,100]\n[-30,-8,-1,0,2,3,17,55]\n[-30,-8,-1,0,2,3,17,55,100]\n[-30,-8,-1,0,2,3,17,100]\n[-30,-8,-1,0,2,3,42]\n[-30,-8,-1,0,2,3,42,55]\n[-30,-8,-1,0,2,3,42,55,100]\n[-30,-8,-1,0,2,3,42,100]\n[-30,-8,-1,0,2,3,55]\n[-30,-8,-1,0,2,3,55,100]\n[-30,-8,-1,0,2,3,100]\n[-30,-8,-1,0,2,17]\n[-30,-8,-1,0,2,17,42]\n[-30,-8,-1,0,2,17,42,55]\n[-30,-8,-1,0,2,17,42,55,100]\n[-30,-8,-1,0,2,17,42,100]\n[-30,-8,-1,0,2,17,55]\n[-30,-8,-1,0,2,17,55,100]\n[-30,-8,-1,0,2,17,100]\n[-30,-8,-1,0,2,42]\n[-30,-8,-1,0,2,42,55]\n[-30,-8,-1,0,2,42,55,100]\n[-30,-8,-1,0,2,42,100]\n[-30,-8,-1,0,2,55]\n[-30,-8,-1,0,2,55,100]\n[-30,-8,-1,0,2,100]\n[-30,-8,-1,0,3]\n[-30,-8,-1,0,3,17]\n[-30,-8,-1,0,3,17,42]\n[-30,-8,-1,0,3,17,42,55]\n[-30,-8,-1,0,3,17,42,55,100]\n[-30,-8,-1,0,3,17,42,100]\n[-30,-8,-1,0,3,17,55]\n[-30,-8,-1,0,3,17,55,100]\n[-30,-8,-1,0,3,17,100]\n[-30,-8,-1,0,3,42]\n[-30,-8,-1,0,3,42,55]\n[-30,-8,-1,0,3,42,55,100]\n[-30,-8,-1,0,3,42,100]\n[-30,-8,-1,0,3,55]\n[-30,-8,-1,0,3,55,100]\n[-30,-8,-1,0,3,100]\n[-30,-8,-1,0,17]\n[-30,-8,-1,0,17,42]\n[-30,-8,-1,0,17,42,55]\n[-30,-8,-1,0,17,42,55,100]\n[-30,-8,-1,0,17,42,100]\n[-30,-8,-1,0,17,55]\n[-30,-8,-1,0,17,55,100]\n[-30,-8,-1,0,17,100]\n[-30,-8,-1,0,42]\n[-30,-8,-1,0,42,55]\n[-30,-8,-1,0,42,55,100]\n[-30,-8,-1,0,42,100]\n[-30,-8,-1,0,55]\n[-30,-8,-1,0,55,100]\n[-30,-8,-1,0,100]\n[-30,-8,-1,2]\n[-30,-8,-1,2,3]\n[-30,-8,-1,2,3,17]\n[-30,-8,-1,2,3,17,42]\n[-30,-8,-1,2,3,17,42,55]\n[-30,-8,-1,2,3,17,42,55,100]\n[-30,-8,-1,2,3,17,42,100]\n[-30,-8,-1,2,3,17,55]\n[-30,-8,-1,2,3,17,55,100]\n[-30,-8,-1,2,3,17,100]\n[-30,-8,-1,2,3,42]\n[-30,-8,-1,2,3,42,55]\n[-30,-8,-1,2,3,42,55,100]\n[-30,-8,-1,2,3,42,100]\n[-30,-8,-1,2,3,55]\n[-30,-8,-1,2,3,55,100]\n[-30,-8,-1,2,3,100]\n[-30,-8,-1,2,17]\n[-30,-8,-1,2,17,42]\n[-30,-8,-1,2,17,42,55]\n[-30,-8,-1,2,17,42,55,100]\n[-30,-8,-1,2,17,42,100]\n[-30,-8,-1,2,17,55]\n[-30,-8,-1,2,17,55,100]\n[-30,-8,-1,2,17,100]\n[-30,-8,-1,2,42]\n[-30,-8,-1,2,42,55]\n[-30,-8,-1,2,42,55,100]\n[-30,-8,-1,2,42,100]\n[-30,-8,-1,2,55]\n[-30,-8,-1,2,55,100]\n[-30,-8,-1,2,100]\n[-30,-8,-1,3]\n[-30,-8,-1,3,17]\n[-30,-8,-1,3,17,42]\n[-30,-8,-1,3,17,42,55]\n[-30,-8,-1,3,17,42,55,100]\n[-30,-8,-1,3,17,42,100]\n[-30,-8,-1,3,17,55]\n[-30,-8,-1,3,17,55,100]\n[-30,-8,-1,3,17,100]\n[-30,-8,-1,3,42]\n[-30,-8,-1,3,42,55]\n[-30,-8,-1,3,42,55,100]\n[-30,-8,-1,3,42,100]\n[-30,-8,-1,3,55]\n[-30,-8,-1,3,55,100]\n[-30,-8,-1,3,100]\n[-30,-8,-1,17]\n[-30,-8,-1,17,42]\n[-30,-8,-1,17,42,55]\n[-30,-8,-1,17,42,55,100]\n[-30,-8,-1,17,42,100]\n[-30,-8,-1,17,55]\n[-30,-8,-1,17,55,100]\n[-30,-8,-1,17,100]\n[-30,-8,-1,42]\n[-30,-8,-1,42,55]\n[-30,-8,-1,42,55,100]\n[-30,-8,-1,42,100]\n[-30,-8,-1,55]\n[-30,-8,-1,55,100]\n[-30,-8,-1,100]\n[-30,-8,0]\n[-30,-8,0,2]\n[-30,-8,0,2,3]\n[-30,-8,0,2,3,17]\n[-30,-8,0,2,3,17,42]\n[-30,-8,0,2,3,17,42,55]\n[-30,-8,0,2,3,17,42,55,100]\n[-30,-8,0,2,3,17,42,100]\n[-30,-8,0,2,3,17,55]\n[-30,-8,0,2,3,17,55,100]\n[-30,-8,0,2,3,17,100]\n[-30,-8,0,2,3,42]\n[-30,-8,0,2,3,42,55]\n[-30,-8,0,2,3,42,55,100]\n[-30,-8,0,2,3,42,100]\n[-30,-8,0,2,3,55]\n[-30,-8,0,2,3,55,100]\n[-30,-8,0,2,3,100]\n[-30,-8,0,2,17]\n[-30,-8,0,2,17,42]\n[-30,-8,0,2,17,42,55]\n[-30,-8,0,2,17,42,55,100]\n[-30,-8,0,2,17,42,100]\n[-30,-8,0,2,17,55]\n[-30,-8,0,2,17,55,100]\n[-30,-8,0,2,17,100]\n[-30,-8,0,2,42]\n[-30,-8,0,2,42,55]\n[-30,-8,0,2,42,55,100]\n[-30,-8,0,2,42,100]\n[-30,-8,0,2,55]\n[-30,-8,0,2,55,100]\n[-30,-8,0,2,100]\n[-30,-8,0,3]\n[-30,-8,0,3,17]\n[-30,-8,0,3,17,42]\n[-30,-8,0,3,17,42,55]\n[-30,-8,0,3,17,42,55,100]\n[-30,-8,0,3,17,42,100]\n[-30,-8,0,3,17,55]\n[-30,-8,0,3,17,55,100]\n[-30,-8,0,3,17,100]\n[-30,-8,0,3,42]\n[-30,-8,0,3,42,55]\n[-30,-8,0,3,42,55,100]\n[-30,-8,0,3,42,100]\n[-30,-8,0,3,55]\n[-30,-8,0,3,55,100]\n[-30,-8,0,3,100]\n[-30,-8,0,17]\n[-30,-8,0,17,42]\n[-30,-8,0,17,42,55]\n[-30,-8,0,17,42,55,100]\n[-30,-8,0,17,42,100]\n[-30,-8,0,17,55]\n[-30,-8,0,17,55,100]\n[-30,-8,0,17,100]\n[-30,-8,0,42]\n[-30,-8,0,42,55]\n[-30,-8,0,42,55,100]\n[-30,-8,0,42,100]\n[-30,-8,0,55]\n[-30,-8,0,55,100]\n[-30,-8,0,100]\n[-30,-8,2]\n[-30,-8,2,3]\n[-30,-8,2,3,17]\n[-30,-8,2,3,17,42]\n[-30,-8,2,3,17,42,55]\n[-30,-8,2,3,17,42,55,100]\n[-30,-8,2,3,17,42,100]\n[-30,-8,2,3,17,55]\n[-30,-8,2,3,17,55,100]\n[-30,-8,2,3,17,100]\n[-30,-8,2,3,42]\n[-30,-8,2,3,42,55]\n[-30,-8,2,3,42,55,100]\n[-30,-8,2,3,42,100]\n[-30,-8,2,3,55]\n[-30,-8,2,3,55,100]\n[-30,-8,2,3,100]\n[-30,-8,2,17]\n[-30,-8,2,17,42]\n[-30,-8,2,17,42,55]\n[-30,-8,2,17,42,55,100]\n[-30,-8,2,17,42,100]\n[-30,-8,2,17,55]\n[-30,-8,2,17,55,100]\n[-30,-8,2,17,100]\n[-30,-8,2,42]\n[-30,-8,2,42,55]\n[-30,-8,2,42,55,100]\n[-30,-8,2,42,100]\n[-30,-8,2,55]\n[-30,-8,2,55,100]\n[-30,-8,2,100]\n[-30,-8,3]\n[-30,-8,3,17]\n[-30,-8,3,17,42]\n[-30,-8,3,17,42,55]\n[-30,-8,3,17,42,55,100]\n[-30,-8,3,17,42,100]\n[-30,-8,3,17,55]\n[-30,-8,3,17,55,100]\n[-30,-8,3,17,100]\n[-30,-8,3,42]\n[-30,-8,3,42,55]\n[-30,-8,3,42,55,100]\n[-30,-8,3,42,100]\n[-30,-8,3,55]\n[-30,-8,3,55,100]\n[-30,-8,3,100]\n[-30,-8,17]\n[-30,-8,17,42]\n[-30,-8,17,42,55]\n[-30,-8,17,42,55,100]\n[-30,-8,17,42,100]\n[-30,-8,17,55]\n[-30,-8,17,55,100]\n[-30,-8,17,100]\n[-30,-8,42]\n[-30,-8,42,55]\n[-30,-8,42,55,100]\n[-30,-8,42,100]\n[-30,-8,55]\n[-30,-8,55,100]\n[-30,-8,100]\n[-30,-1]\n[-30,-1,0]\n[-30,-1,0,2]\n[-30,-1,0,2,3]\n[-30,-1,0,2,3,17]\n[-30,-1,0,2,3,17,42]\n[-30,-1,0,2,3,17,42,55]\n[-30,-1,0,2,3,17,42,55,100]\n[-30,-1,0,2,3,17,42,100]\n[-30,-1,0,2,3,17,55]\n[-30,-1,0,2,3,17,55,100]\n[-30,-1,0,2,3,17,100]\n[-30,-1,0,2,3,42]\n[-30,-1,0,2,3,42,55]\n[-30,-1,0,2,3,42,55,100]\n[-30,-1,0,2,3,42,100]\n[-30,-1,0,2,3,55]\n[-30,-1,0,2,3,55,100]\n[-30,-1,0,2,3,100]\n[-30,-1,0,2,17]\n[-30,-1,0,2,17,42]\n[-30,-1,0,2,17,42,55]\n[-30,-1,0,2,17,42,55,100]\n[-30,-1,0,2,17,42,100]\n[-30,-1,0,2,17,55]\n[-30,-1,0,2,17,55,100]\n[-30,-1,0,2,17,100]\n[-30,-1,0,2,42]\n[-30,-1,0,2,42,55]\n[-30,-1,0,2,42,55,100]\n[-30,-1,0,2,42,100]\n[-30,-1,0,2,55]\n[-30,-1,0,2,55,100]\n[-30,-1,0,2,100]\n[-30,-1,0,3]\n[-30,-1,0,3,17]\n[-30,-1,0,3,17,42]\n[-30,-1,0,3,17,42,55]\n[-30,-1,0,3,17,42,55,100]\n[-30,-1,0,3,17,42,100]\n[-30,-1,0,3,17,55]\n[-30,-1,0,3,17,55,100]\n[-30,-1,0,3,17,100]\n[-30,-1,0,3,42]\n[-30,-1,0,3,42,55]\n[-30,-1,0,3,42,55,100]\n[-30,-1,0,3,42,100]\n[-30,-1,0,3,55]\n[-30,-1,0,3,55,100]\n[-30,-1,0,3,100]\n[-30,-1,0,17]\n[-30,-1,0,17,42]\n[-30,-1,0,17,42,55]\n[-30,-1,0,17,42,55,100]\n[-30,-1,0,17,42,100]\n[-30,-1,0,17,55]\n[-30,-1,0,17,55,100]\n[-30,-1,0,17,100]\n[-30,-1,0,42]\n[-30,-1,0,42,55]\n[-30,-1,0,42,55,100]\n[-30,-1,0,42,100]\n[-30,-1,0,55]\n[-30,-1,0,55,100]\n[-30,-1,0,100]\n[-30,-1,2]\n[-30,-1,2,3]\n[-30,-1,2,3,17]\n[-30,-1,2,3,17,42]\n[-30,-1,2,3,17,42,55]\n[-30,-1,2,3,17,42,55,100]\n[-30,-1,2,3,17,42,100]\n[-30,-1,2,3,17,55]\n[-30,-1,2,3,17,55,100]\n[-30,-1,2,3,17,100]\n[-30,-1,2,3,42]\n[-30,-1,2,3,42,55]\n[-30,-1,2,3,42,55,100]\n[-30,-1,2,3,42,100]\n[-30,-1,2,3,55]\n[-30,-1,2,3,55,100]\n[-30,-1,2,3,100]\n[-30,-1,2,17]\n[-30,-1,2,17,42]\n[-30,-1,2,17,42,55]\n[-30,-1,2,17,42,55,100]\n[-30,-1,2,17,42,100]\n[-30,-1,2,17,55]\n[-30,-1,2,17,55,100]\n[-30,-1,2,17,100]\n[-30,-1,2,42]\n[-30,-1,2,42,55]\n[-30,-1,2,42,55,100]\n[-30,-1,2,42,100]\n[-30,-1,2,55]\n[-30,-1,2,55,100]\n[-30,-1,2,100]\n[-30,-1,3]\n[-30,-1,3,17]\n[-30,-1,3,17,42]\n[-30,-1,3,17,42,55]\n[-30,-1,3,17,42,55,100]\n[-30,-1,3,17,42,100]\n[-30,-1,3,17,55]\n[-30,-1,3,17,55,100]\n[-30,-1,3,17,100]\n[-30,-1,3,42]\n[-30,-1,3,42,55]\n[-30,-1,3,42,55,100]\n[-30,-1,3,42,100]\n[-30,-1,3,55]\n[-30,-1,3,55,100]\n[-30,-1,3,100]\n[-30,-1,17]\n[-30,-1,17,42]\n[-30,-1,17,42,55]\n[-30,-1,17,42,55,100]\n[-30,-1,17,42,100]\n[-30,-1,17,55]\n[-30,-1,17,55,100]\n[-30,-1,17,100]\n[-30,-1,42]\n[-30,-1,42,55]\n[-30,-1,42,55,100]\n[-30,-1,42,100]\n[-30,-1,55]\n[-30,-1,55,100]\n[-30,-1,100]\n[-30,0]\n[-30,0,2]\n[-30,0,2,3]\n[-30,0,2,3,17]\n[-30,0,2,3,17,42]\n[-30,0,2,3,17,42,55]\n[-30,0,2,3,17,42,55,100]\n[-30,0,2,3,17,42,100]\n[-30,0,2,3,17,55]\n[-30,0,2,3,17,55,100]\n[-30,0,2,3,17,100]\n[-30,0,2,3,42]\n[-30,0,2,3,42,55]\n[-30,0,2,3,42,55,100]\n[-30,0,2,3,42,100]\n[-30,0,2,3,55]\n[-30,0,2,3,55,100]\n[-30,0,2,3,100]\n[-30,0,2,17]\n[-30,0,2,17,42]\n[-30,0,2,17,42,55]\n[-30,0,2,17,42,55,100]\n[-30,0,2,17,42,100]\n[-30,0,2,17,55]\n[-30,0,2,17,55,100]\n[-30,0,2,17,100]\n[-30,0,2,42]\n[-30,0,2,42,55]\n[-30,0,2,42,55,100]\n[-30,0,2,42,100]\n[-30,0,2,55]\n[-30,0,2,55,100]\n[-30,0,2,100]\n[-30,0,3]\n[-30,0,3,17]\n[-30,0,3,17,42]\n[-30,0,3,17,42,55]\n[-30,0,3,17,42,55,100]\n[-30,0,3,17,42,100]\n[-30,0,3,17,55]\n[-30,0,3,17,55,100]\n[-30,0,3,17,100]\n[-30,0,3,42]\n[-30,0,3,42,55]\n[-30,0,3,42,55,100]\n[-30,0,3,42,100]\n[-30,0,3,55]\n[-30,0,3,55,100]\n[-30,0,3,100]\n[-30,0,17]\n[-30,0,17,42]\n[-30,0,17,42,55]\n[-30,0,17,42,55,100]\n[-30,0,17,42,100]\n[-30,0,17,55]\n[-30,0,17,55,100]\n[-30,0,17,100]\n[-30,0,42]\n[-30,0,42,55]\n[-30,0,42,55,100]\n[-30,0,42,100]\n[-30,0,55]\n[-30,0,55,100]\n[-30,0,100]\n[-30,2]\n[-30,2,3]\n[-30,2,3,17]\n[-30,2,3,17,42]\n[-30,2,3,17,42,55]\n[-30,2,3,17,42,55,100]\n[-30,2,3,17,42,100]\n[-30,2,3,17,55]\n[-30,2,3,17,55,100]\n[-30,2,3,17,100]\n[-30,2,3,42]\n[-30,2,3,42,55]\n[-30,2,3,42,55,100]\n[-30,2,3,42,100]\n[-30,2,3,55]\n[-30,2,3,55,100]\n[-30,2,3,100]\n[-30,2,17]\n[-30,2,17,42]\n[-30,2,17,42,55]\n[-30,2,17,42,55,100]\n[-30,2,17,42,100]\n[-30,2,17,55]\n[-30,2,17,55,100]\n[-30,2,17,100]\n[-30,2,42]\n[-30,2,42,55]\n[-30,2,42,55,100]\n[-30,2,42,100]\n[-30,2,55]\n[-30,2,55,100]\n[-30,2,100]\n[-30,3]\n[-30,3,17]\n[-30,3,17,42]\n[-30,3,17,42,55]\n[-30,3,17,42,55,100]\n[-30,3,17,42,100]\n[-30,3,17,55]\n[-30,3,17,55,100]\n[-30,3,17,100]\n[-30,3,42]\n[-30,3,42,55]\n[-30,3,42,55,100]\n[-30,3,42,100]\n[-30,3,55]\n[-30,3,55,100]\n[-30,3,100]\n[-30,17]\n[-30,17,42]\n[-30,17,42,55]\n[-30,17,42,55,100]\n[-30,17,42,100]\n[-30,17,55]\n[-30,17,55,100]\n[-30,17,100]\n[-30,42]\n[-30,42,55]\n[-30,42,55,100]\n[-30,42,100]\n[-30,55]\n[-30,55,100]\n[-30,100]\n[-8]\n[-8,-1]\n[-8,-1,0]\n[-8,-1,0,2]\n[-8,-1,0,2,3]\n[-8,-1,0,2,3,17]\n[-8,-1,0,2,3,17,42]\n[-8,-1,0,2,3,17,42,55]\n[-8,-1,0,2,3,17,42,55,100]\n[-8,-1,0,2,3,17,42,100]\n[-8,-1,0,2,3,17,55]\n[-8,-1,0,2,3,17,55,100]\n[-8,-1,0,2,3,17,100]\n[-8,-1,0,2,3,42]\n[-8,-1,0,2,3,42,55]\n[-8,-1,0,2,3,42,55,100]\n[-8,-1,0,2,3,42,100]\n[-8,-1,0,2,3,55]\n[-8,-1,0,2,3,55,100]\n[-8,-1,0,2,3,100]\n[-8,-1,0,2,17]\n[-8,-1,0,2,17,42]\n[-8,-1,0,2,17,42,55]\n[-8,-1,0,2,17,42,55,100]\n[-8,-1,0,2,17,42,100]\n[-8,-1,0,2,17,55]\n[-8,-1,0,2,17,55,100]\n[-8,-1,0,2,17,100]\n[-8,-1,0,2,42]\n[-8,-1,0,2,42,55]\n[-8,-1,0,2,42,55,100]\n[-8,-1,0,2,42,100]\n[-8,-1,0,2,55]\n[-8,-1,0,2,55,100]\n[-8,-1,0,2,100]\n[-8,-1,0,3]\n[-8,-1,0,3,17]\n[-8,-1,0,3,17,42]\n[-8,-1,0,3,17,42,55]\n[-8,-1,0,3,17,42,55,100]\n[-8,-1,0,3,17,42,100]\n[-8,-1,0,3,17,55]\n[-8,-1,0,3,17,55,100]\n[-8,-1,0,3,17,100]\n[-8,-1,0,3,42]\n[-8,-1,0,3,42,55]\n[-8,-1,0,3,42,55,100]\n[-8,-1,0,3,42,100]\n[-8,-1,0,3,55]\n[-8,-1,0,3,55,100]\n[-8,-1,0,3,100]\n[-8,-1,0,17]\n[-8,-1,0,17,42]\n[-8,-1,0,17,42,55]\n[-8,-1,0,17,42,55,100]\n[-8,-1,0,17,42,100]\n[-8,-1,0,17,55]\n[-8,-1,0,17,55,100]\n[-8,-1,0,17,100]\n[-8,-1,0,42]\n[-8,-1,0,42,55]\n[-8,-1,0,42,55,100]\n[-8,-1,0,42,100]\n[-8,-1,0,55]\n[-8,-1,0,55,100]\n[-8,-1,0,100]\n[-8,-1,2]\n[-8,-1,2,3]\n[-8,-1,2,3,17]\n[-8,-1,2,3,17,42]\n[-8,-1,2,3,17,42,55]\n[-8,-1,2,3,17,42,55,100]\n[-8,-1,2,3,17,42,100]\n[-8,-1,2,3,17,55]\n[-8,-1,2,3,17,55,100]\n[-8,-1,2,3,17,100]\n[-8,-1,2,3,42]\n[-8,-1,2,3,42,55]\n[-8,-1,2,3,42,55,100]\n[-8,-1,2,3,42,100]\n[-8,-1,2,3,55]\n[-8,-1,2,3,55,100]\n[-8,-1,2,3,100]\n[-8,-1,2,17]\n[-8,-1,2,17,42]\n[-8,-1,2,17,42,55]\n[-8,-1,2,17,42,55,100]\n[-8,-1,2,17,42,100]\n[-8,-1,2,17,55]\n[-8,-1,2,17,55,100]\n[-8,-1,2,17,100]\n[-8,-1,2,42]\n[-8,-1,2,42,55]\n[-8,-1,2,42,55,100]\n[-8,-1,2,42,100]\n[-8,-1,2,55]\n[-8,-1,2,55,100]\n[-8,-1,2,100]\n[-8,-1,3]\n[-8,-1,3,17]\n[-8,-1,3,17,42]\n[-8,-1,3,17,42,55]\n[-8,-1,3,17,42,55,100]\n[-8,-1,3,17,42,100]\n[-8,-1,3,17,55]\n[-8,-1,3,17,55,100]\n[-8,-1,3,17,100]\n[-8,-1,3,42]\n[-8,-1,3,42,55]\n[-8,-1,3,42,55,100]\n[-8,-1,3,42,100]\n[-8,-1,3,55]\n[-8,-1,3,55,100]\n[-8,-1,3,100]\n[-8,-1,17]\n[-8,-1,17,42]\n[-8,-1,17,42,55]\n[-8,-1,17,42,55,100]\n[-8,-1,17,42,100]\n[-8,-1,17,55]\n[-8,-1,17,55,100]\n[-8,-1,17,100]\n[-8,-1,42]\n[-8,-1,42,55]\n[-8,-1,42,55,100]\n[-8,-1,42,100]\n[-8,-1,55]\n[-8,-1,55,100]\n[-8,-1,100]\n[-8,0]\n[-8,0,2]\n[-8,0,2,3]\n[-8,0,2,3,17]\n[-8,0,2,3,17,42]\n[-8,0,2,3,17,42,55]\n[-8,0,2,3,17,42,55,100]\n[-8,0,2,3,17,42,100]\n[-8,0,2,3,17,55]\n[-8,0,2,3,17,55,100]\n[-8,0,2,3,17,100]\n[-8,0,2,3,42]\n[-8,0,2,3,42,55]\n[-8,0,2,3,42,55,100]\n[-8,0,2,3,42,100]\n[-8,0,2,3,55]\n[-8,0,2,3,55,100]\n[-8,0,2,3,100]\n[-8,0,2,17]\n[-8,0,2,17,42]\n[-8,0,2,17,42,55]\n[-8,0,2,17,42,55,100]\n[-8,0,2,17,42,100]\n[-8,0,2,17,55]\n[-8,0,2,17,55,100]\n[-8,0,2,17,100]\n[-8,0,2,42]\n[-8,0,2,42,55]\n[-8,0,2,42,55,100]\n[-8,0,2,42,100]\n[-8,0,2,55]\n[-8,0,2,55,100]\n[-8,0,2,100]\n[-8,0,3]\n[-8,0,3,17]\n[-8,0,3,17,42]\n[-8,0,3,17,42,55]\n[-8,0,3,17,42,55,100]\n[-8,0,3,17,42,100]\n[-8,0,3,17,55]\n[-8,0,3,17,55,100]\n[-8,0,3,17,100]\n[-8,0,3,42]\n[-8,0,3,42,55]\n[-8,0,3,42,55,100]\n[-8,0,3,42,100]\n[-8,0,3,55]\n[-8,0,3,55,100]\n[-8,0,3,100]\n[-8,0,17]\n[-8,0,17,42]\n[-8,0,17,42,55]\n[-8,0,17,42,55,100]\n[-8,0,17,42,100]\n[-8,0,17,55]\n[-8,0,17,55,100]\n[-8,0,17,100]\n[-8,0,42]\n[-8,0,42,55]\n[-8,0,42,55,100]\n[-8,0,42,100]\n[-8,0,55]\n[-8,0,55,100]\n[-8,0,100]\n[-8,2]\n[-8,2,3]\n[-8,2,3,17]\n[-8,2,3,17,42]\n[-8,2,3,17,42,55]\n[-8,2,3,17,42,55,100]\n[-8,2,3,17,42,100]\n[-8,2,3,17,55]\n[-8,2,3,17,55,100]\n[-8,2,3,17,100]\n[-8,2,3,42]\n[-8,2,3,42,55]\n[-8,2,3,42,55,100]\n[-8,2,3,42,100]\n[-8,2,3,55]\n[-8,2,3,55,100]\n[-8,2,3,100]\n[-8,2,17]\n[-8,2,17,42]\n[-8,2,17,42,55]\n[-8,2,17,42,55,100]\n[-8,2,17,42,100]\n[-8,2,17,55]\n[-8,2,17,55,100]\n[-8,2,17,100]\n[-8,2,42]\n[-8,2,42,55]\n[-8,2,42,55,100]\n[-8,2,42,100]\n[-8,2,55]\n[-8,2,55,100]\n[-8,2,100]\n[-8,3]\n[-8,3,17]\n[-8,3,17,42]\n[-8,3,17,42,55]\n[-8,3,17,42,55,100]\n[-8,3,17,42,100]\n[-8,3,17,55]\n[-8,3,17,55,100]\n[-8,3,17,100]\n[-8,3,42]\n[-8,3,42,55]\n[-8,3,42,55,100]\n[-8,3,42,100]\n[-8,3,55]\n[-8,3,55,100]\n[-8,3,100]\n[-8,17]\n[-8,17,42]\n[-8,17,42,55]\n[-8,17,42,55,100]\n[-8,17,42,100]\n[-8,17,55]\n[-8,17,55,100]\n[-8,17,100]\n[-8,42]\n[-8,42,55]\n[-8,42,55,100]\n[-8,42,100]\n[-8,55]\n[-8,55,100]\n[-8,100]\n[-1]\n[-1,0]\n[-1,0,2]\n[-1,0,2,3]\n[-1,0,2,3,17]\n[-1,0,2,3,17,42]\n[-1,0,2,3,17,42,55]\n[-1,0,2,3,17,42,55,100]\n[-1,0,2,3,17,42,100]\n[-1,0,2,3,17,55]\n[-1,0,2,3,17,55,100]\n[-1,0,2,3,17,100]\n[-1,0,2,3,42]\n[-1,0,2,3,42,55]\n[-1,0,2,3,42,55,100]\n[-1,0,2,3,42,100]\n[-1,0,2,3,55]\n[-1,0,2,3,55,100]\n[-1,0,2,3,100]\n[-1,0,2,17]\n[-1,0,2,17,42]\n[-1,0,2,17,42,55]\n[-1,0,2,17,42,55,100]\n[-1,0,2,17,42,100]\n[-1,0,2,17,55]\n[-1,0,2,17,55,100]\n[-1,0,2,17,100]\n[-1,0,2,42]\n[-1,0,2,42,55]\n[-1,0,2,42,55,100]\n[-1,0,2,42,100]\n[-1,0,2,55]\n[-1,0,2,55,100]\n[-1,0,2,100]\n[-1,0,3]\n[-1,0,3,17]\n[-1,0,3,17,42]\n[-1,0,3,17,42,55]\n[-1,0,3,17,42,55,100]\n[-1,0,3,17,42,100]\n[-1,0,3,17,55]\n[-1,0,3,17,55,100]\n[-1,0,3,17,100]\n[-1,0,3,42]\n[-1,0,3,42,55]\n[-1,0,3,42,55,100]\n[-1,0,3,42,100]\n[-1,0,3,55]\n[-1,0,3,55,100]\n[-1,0,3,100]\n[-1,0,17]\n[-1,0,17,42]\n[-1,0,17,42,55]\n[-1,0,17,42,55,100]\n[-1,0,17,42,100]\n[-1,0,17,55]\n[-1,0,17,55,100]\n[-1,0,17,100]\n[-1,0,42]\n[-1,0,42,55]\n[-1,0,42,55,100]\n[-1,0,42,100]\n[-1,0,55]\n[-1,0,55,100]\n[-1,0,100]\n[-1,2]\n[-1,2,3]\n[-1,2,3,17]\n[-1,2,3,17,42]\n[-1,2,3,17,42,55]\n[-1,2,3,17,42,55,100]\n[-1,2,3,17,42,100]\n[-1,2,3,17,55]\n[-1,2,3,17,55,100]\n[-1,2,3,17,100]\n[-1,2,3,42]\n[-1,2,3,42,55]\n[-1,2,3,42,55,100]\n[-1,2,3,42,100]\n[-1,2,3,55]\n[-1,2,3,55,100]\n[-1,2,3,100]\n[-1,2,17]\n[-1,2,17,42]\n[-1,2,17,42,55]\n[-1,2,17,42,55,100]\n[-1,2,17,42,100]\n[-1,2,17,55]\n[-1,2,17,55,100]\n[-1,2,17,100]\n[-1,2,42]\n[-1,2,42,55]\n[-1,2,42,55,100]\n[-1,2,42,100]\n[-1,2,55]\n[-1,2,55,100]\n[-1,2,100]\n[-1,3]\n[-1,3,17]\n[-1,3,17,42]\n[-1,3,17,42,55]\n[-1,3,17,42,55,100]\n[-1,3,17,42,100]\n[-1,3,17,55]\n[-1,3,17,55,100]\n[-1,3,17,100]\n[-1,3,42]\n[-1,3,42,55]\n[-1,3,42,55,100]\n[-1,3,42,100]\n[-1,3,55]\n[-1,3,55,100]\n[-1,3,100]\n[-1,17]\n[-1,17,42]\n[-1,17,42,55]\n[-1,17,42,55,100]\n[-1,17,42,100]\n[-1,17,55]\n[-1,17,55,100]\n[-1,17,100]\n[-1,42]\n[-1,42,55]\n[-1,42,55,100]\n[-1,42,100]\n[-1,55]\n[-1,55,100]\n[-1,100]\n[0]\n[0,2]\n[0,2,3]\n[0,2,3,17]\n[0,2,3,17,42]\n[0,2,3,17,42,55]\n[0,2,3,17,42,55,100]\n[0,2,3,17,42,100]\n[0,2,3,17,55]\n[0,2,3,17,55,100]\n[0,2,3,17,100]\n[0,2,3,42]\n[0,2,3,42,55]\n[0,2,3,42,55,100]\n[0,2,3,42,100]\n[0,2,3,55]\n[0,2,3,55,100]\n[0,2,3,100]\n[0,2,17]\n[0,2,17,42]\n[0,2,17,42,55]\n[0,2,17,42,55,100]\n[0,2,17,42,100]\n[0,2,17,55]\n[0,2,17,55,100]\n[0,2,17,100]\n[0,2,42]\n[0,2,42,55]\n[0,2,42,55,100]\n[0,2,42,100]\n[0,2,55]\n[0,2,55,100]\n[0,2,100]\n[0,3]\n[0,3,17]\n[0,3,17,42]\n[0,3,17,42,55]\n[0,3,17,42,55,100]\n[0,3,17,42,100]\n[0,3,17,55]\n[0,3,17,55,100]\n[0,3,17,100]\n[0,3,42]\n[0,3,42,55]\n[0,3,42,55,100]\n[0,3,42,100]\n[0,3,55]\n[0,3,55,100]\n[0,3,100]\n[0,17]\n[0,17,42]\n[0,17,42,55]\n[0,17,42,55,100]\n[0,17,42,100]\n[0,17,55]\n[0,17,55,100]\n[0,17,100]\n[0,42]\n[0,42,55]\n[0,42,55,100]\n[0,42,100]\n[0,55]\n[0,55,100]\n[0,100]\n[2]\n[2,3]\n[2,3,17]\n[2,3,17,42]\n[2,3,17,42,55]\n[2,3,17,42,55,100]\n[2,3,17,42,100]\n[2,3,17,55]\n[2,3,17,55,100]\n[2,3,17,100]\n[2,3,42]\n[2,3,42,55]\n[2,3,42,55,100]\n[2,3,42,100]\n[2,3,55]\n[2,3,55,100]\n[2,3,100]\n[2,17]\n[2,17,42]\n[2,17,42,55]\n[2,17,42,55,100]\n[2,17,42,100]\n[2,17,55]\n[2,17,55,100]\n[2,17,100]\n[2,42]\n[2,42,55]\n[2,42,55,100]\n[2,42,100]\n[2,55]\n[2,55,100]\n[2,100]\n[3]\n[3,17]\n[3,17,42]\n[3,17,42,55]\n[3,17,42,55,100]\n[3,17,42,100]\n[3,17,55]\n[3,17,55,100]\n[3,17,100]\n[3,42]\n[3,42,55]\n[3,42,55,100]\n[3,42,100]\n[3,55]\n[3,55,100]\n[3,100]\n[17]\n[17,42]\n[17,42,55]\n[17,42,55,100]\n[17,42,100]\n[17,55]\n[17,55,100]\n[17,100]\n[42]\n[42,55]\n[42,55,100]\n[42,100]\n[55]\n[55,100]\n[100]",
      },
    ],
    hints: [
      "There are 2ⁿ bundles: each id is either in or out.",
      "Sort the ids first. What does a bundle that starts with the smallest id look like?",
      "Recurse with a start index: the next id you add must come after the last one you added. Record the current bundle every time you enter the function, not only at the bottom.",
      "Recording on entry, then extending with ids in increasing order, visits bundles in exactly the required lexicographic order.",
    ],
    solutions: [
      {
        title: "Bitmasks, then sort",
        order: 1,
        intuition:
          "Every integer from 0 to 2ⁿ − 1 is a yes/no pattern over the ids, so counting through them produces every bundle exactly once. The order they come out in is unrelated to the one required, so each bundle has to be sorted internally and the whole list sorted afterwards.",
        approach: [
          "For each mask from 0 to 2ⁿ − 1, collect the ids whose bit is set.",
          "Sort that bundle.",
          "Sort the list of bundles as number sequences.",
          "Format each bundle.",
        ],
        code: {
          PYTHON: `def listBundles(ids: List[int]) -> List[str]:
    n = len(ids)
    bundles = []
    for mask in range(1 << n):
        bundles.append(sorted(ids[i] for i in range(n) if mask >> i & 1))
    bundles.sort()  # Python compares lists element by element
    return ["[" + ",".join(map(str, b)) + "]" for b in bundles]`,
          JAVA: `class Solution {
    public String[] listBundles(int[] ids) {
        int n = ids.length;
        List<List<Integer>> bundles = new ArrayList<>();
        for (int mask = 0; mask < (1 << n); mask++) {
            List<Integer> bundle = new ArrayList<>();
            for (int i = 0; i < n; i++) if ((mask >> i & 1) == 1) bundle.add(ids[i]);
            Collections.sort(bundle);
            bundles.add(bundle);
        }
        bundles.sort((a, b) -> {
            for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
                if (!a.get(i).equals(b.get(i))) return Integer.compare(a.get(i), b.get(i));
            }
            return Integer.compare(a.size(), b.size());
        });
        String[] out = new String[bundles.size()];
        for (int i = 0; i < out.length; i++) {
            StringBuilder sb = new StringBuilder("[");
            for (int j = 0; j < bundles.get(i).size(); j++) {
                if (j > 0) sb.append(',');
                sb.append(bundles.get(i).get(j));
            }
            out[i] = sb.append(']').toString();
        }
        return out;
    }
}`,
        },
        timeComplexity:
          "O(2ⁿ · n²) — the final sort compares bundles of length up to n",
        spaceComplexity: "O(2ⁿ · n)",
        edgeCases: [
          "One id, giving [] and the id alone.",
          "Negative ids, which must sort numerically.",
        ],
        commonMistakes: [
          'Sorting the formatted strings instead of the numbers: "[10]" sorts before "[2]" as text.',
          "Forgetting the empty bundle.",
        ],
      },
      {
        title: "Optimal: start-index backtracking in preorder",
        order: 2,
        intuition:
          "Sort the ids, then grow a bundle by only ever appending an id that comes after the last one added. Each call represents one bundle, so record it on entry. Because a bundle is recorded before any of its extensions, and extensions are tried smallest id first, the walk emits bundles in lexicographic order — the sort disappears.",
        approach: [
          "Sort the ids.",
          "grow(start): record the current bundle.",
          "For each i from start to the end, append ids[i], call grow(i + 1), then pop.",
          "Call grow(0) and return the recorded bundles.",
        ],
        code: {
          PYTHON: `def listBundles(ids: List[int]) -> List[str]:
    ordered = sorted(ids)
    bundles = []
    chosen = []

    def grow(start: int) -> None:
        # Every node of the search tree is itself a bundle.
        bundles.append("[" + ",".join(map(str, chosen)) + "]")
        for i in range(start, len(ordered)):
            chosen.append(ordered[i])
            grow(i + 1)
            chosen.pop()

    grow(0)
    return bundles`,
          JAVA: `class Solution {
    private int[] ordered;
    private final List<String> bundles = new ArrayList<>();
    private final List<Integer> chosen = new ArrayList<>();

    public String[] listBundles(int[] ids) {
        ordered = ids.clone();
        Arrays.sort(ordered);
        grow(0);
        return bundles.toArray(new String[0]);
    }

    private void grow(int start) {
        StringBuilder sb = new StringBuilder("[");
        for (int j = 0; j < chosen.size(); j++) {
            if (j > 0) sb.append(',');
            sb.append(chosen.get(j));
        }
        bundles.add(sb.append(']').toString());

        for (int i = start; i < ordered.length; i++) {
            chosen.add(ordered[i]);
            grow(i + 1);
            chosen.remove(chosen.size() - 1);
        }
    }
}`,
        },
        timeComplexity: "O(2ⁿ · n)",
        spaceComplexity: "O(n) beyond the output",
        edgeCases: [
          "Unsorted input — sorting first is what makes the order come out right.",
          "Ten ids, giving 1024 bundles.",
        ],
        commonMistakes: [
          "Recording only at the leaves, which lists only the full bundle.",
          "Recursing with start + 1 instead of i + 1, which repeats ids and produces duplicate bundles.",
        ],
      },
    ],
    expectedTime: "O(2ⁿ · n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "seating-orders",
    title: "Seating Orders",
    difficulty: "MEDIUM",
    learningObjective:
      "Generate permutations with a used-marker array, and order the choices so the output is sorted without a final sort.",
    topics: ["backtracking"],
    patterns: ["backtracking"],
    statement: [
      para(
        "A small dinner has a single row of chairs and a guest list of distinct member numbers. The host wants to see every possible seating order before picking one."
      ),
      rich(
        "Return every ordering of ",
        { code: "guests" },
        ". Write each as the numbers comma-separated inside square brackets with no spaces, and list the orderings in ",
        { strong: "lexicographic order as number sequences" },
        "."
      ),
      example(
        "guests = [2, 1, 3]",
        '["[1,2,3]", "[1,3,2]", "[2,1,3]", "[2,3,1]", "[3,1,2]", "[3,2,1]"]',
        [
          { state: "1 _ _", note: "seat the smallest guest first" },
          { state: "1 2 3, 1 3 2", note: "fill the remaining chairs smallest first" },
          { state: "2 _ _", note: "free chair one, seat the next guest there" },
        ],
        "Filling chairs left to right"
      ),
    ],
    constraints: [
      "1 ≤ guests.length ≤ 6",
      "-100 ≤ guests[i] ≤ 100, all distinct",
      "Output: the number of orderings, then one ordering per line.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["guests"],
      returns: "string[]",
      functionName: "seatingOrders",
    },
    tests: [
      {
        input: "2 1 3",
        expected: "6\n[1,2,3]\n[1,3,2]\n[2,1,3]\n[2,3,1]\n[3,1,2]\n[3,2,1]",
        isSample: true,
        explanation: "Six orders, listed from the smallest sequence to the largest.",
      },
      {
        input: "7",
        expected: "1\n[7]",
        isSample: true,
        explanation: "One guest can only sit one way.",
      },
      { input: "5 -5", expected: "2\n[-5,5]\n[5,-5]" },
      {
        input: "0 10 -10 3",
        expected:
          "24\n[-10,0,3,10]\n[-10,0,10,3]\n[-10,3,0,10]\n[-10,3,10,0]\n[-10,10,0,3]\n[-10,10,3,0]\n[0,-10,3,10]\n[0,-10,10,3]\n[0,3,-10,10]\n[0,3,10,-10]\n[0,10,-10,3]\n[0,10,3,-10]\n[3,-10,0,10]\n[3,-10,10,0]\n[3,0,-10,10]\n[3,0,10,-10]\n[3,10,-10,0]\n[3,10,0,-10]\n[10,-10,0,3]\n[10,-10,3,0]\n[10,0,-10,3]\n[10,0,3,-10]\n[10,3,-10,0]\n[10,3,0,-10]",
      },
      {
        input: "6 5 4 3 2 1",
        expected:
          "720\n[1,2,3,4,5,6]\n[1,2,3,4,6,5]\n[1,2,3,5,4,6]\n[1,2,3,5,6,4]\n[1,2,3,6,4,5]\n[1,2,3,6,5,4]\n[1,2,4,3,5,6]\n[1,2,4,3,6,5]\n[1,2,4,5,3,6]\n[1,2,4,5,6,3]\n[1,2,4,6,3,5]\n[1,2,4,6,5,3]\n[1,2,5,3,4,6]\n[1,2,5,3,6,4]\n[1,2,5,4,3,6]\n[1,2,5,4,6,3]\n[1,2,5,6,3,4]\n[1,2,5,6,4,3]\n[1,2,6,3,4,5]\n[1,2,6,3,5,4]\n[1,2,6,4,3,5]\n[1,2,6,4,5,3]\n[1,2,6,5,3,4]\n[1,2,6,5,4,3]\n[1,3,2,4,5,6]\n[1,3,2,4,6,5]\n[1,3,2,5,4,6]\n[1,3,2,5,6,4]\n[1,3,2,6,4,5]\n[1,3,2,6,5,4]\n[1,3,4,2,5,6]\n[1,3,4,2,6,5]\n[1,3,4,5,2,6]\n[1,3,4,5,6,2]\n[1,3,4,6,2,5]\n[1,3,4,6,5,2]\n[1,3,5,2,4,6]\n[1,3,5,2,6,4]\n[1,3,5,4,2,6]\n[1,3,5,4,6,2]\n[1,3,5,6,2,4]\n[1,3,5,6,4,2]\n[1,3,6,2,4,5]\n[1,3,6,2,5,4]\n[1,3,6,4,2,5]\n[1,3,6,4,5,2]\n[1,3,6,5,2,4]\n[1,3,6,5,4,2]\n[1,4,2,3,5,6]\n[1,4,2,3,6,5]\n[1,4,2,5,3,6]\n[1,4,2,5,6,3]\n[1,4,2,6,3,5]\n[1,4,2,6,5,3]\n[1,4,3,2,5,6]\n[1,4,3,2,6,5]\n[1,4,3,5,2,6]\n[1,4,3,5,6,2]\n[1,4,3,6,2,5]\n[1,4,3,6,5,2]\n[1,4,5,2,3,6]\n[1,4,5,2,6,3]\n[1,4,5,3,2,6]\n[1,4,5,3,6,2]\n[1,4,5,6,2,3]\n[1,4,5,6,3,2]\n[1,4,6,2,3,5]\n[1,4,6,2,5,3]\n[1,4,6,3,2,5]\n[1,4,6,3,5,2]\n[1,4,6,5,2,3]\n[1,4,6,5,3,2]\n[1,5,2,3,4,6]\n[1,5,2,3,6,4]\n[1,5,2,4,3,6]\n[1,5,2,4,6,3]\n[1,5,2,6,3,4]\n[1,5,2,6,4,3]\n[1,5,3,2,4,6]\n[1,5,3,2,6,4]\n[1,5,3,4,2,6]\n[1,5,3,4,6,2]\n[1,5,3,6,2,4]\n[1,5,3,6,4,2]\n[1,5,4,2,3,6]\n[1,5,4,2,6,3]\n[1,5,4,3,2,6]\n[1,5,4,3,6,2]\n[1,5,4,6,2,3]\n[1,5,4,6,3,2]\n[1,5,6,2,3,4]\n[1,5,6,2,4,3]\n[1,5,6,3,2,4]\n[1,5,6,3,4,2]\n[1,5,6,4,2,3]\n[1,5,6,4,3,2]\n[1,6,2,3,4,5]\n[1,6,2,3,5,4]\n[1,6,2,4,3,5]\n[1,6,2,4,5,3]\n[1,6,2,5,3,4]\n[1,6,2,5,4,3]\n[1,6,3,2,4,5]\n[1,6,3,2,5,4]\n[1,6,3,4,2,5]\n[1,6,3,4,5,2]\n[1,6,3,5,2,4]\n[1,6,3,5,4,2]\n[1,6,4,2,3,5]\n[1,6,4,2,5,3]\n[1,6,4,3,2,5]\n[1,6,4,3,5,2]\n[1,6,4,5,2,3]\n[1,6,4,5,3,2]\n[1,6,5,2,3,4]\n[1,6,5,2,4,3]\n[1,6,5,3,2,4]\n[1,6,5,3,4,2]\n[1,6,5,4,2,3]\n[1,6,5,4,3,2]\n[2,1,3,4,5,6]\n[2,1,3,4,6,5]\n[2,1,3,5,4,6]\n[2,1,3,5,6,4]\n[2,1,3,6,4,5]\n[2,1,3,6,5,4]\n[2,1,4,3,5,6]\n[2,1,4,3,6,5]\n[2,1,4,5,3,6]\n[2,1,4,5,6,3]\n[2,1,4,6,3,5]\n[2,1,4,6,5,3]\n[2,1,5,3,4,6]\n[2,1,5,3,6,4]\n[2,1,5,4,3,6]\n[2,1,5,4,6,3]\n[2,1,5,6,3,4]\n[2,1,5,6,4,3]\n[2,1,6,3,4,5]\n[2,1,6,3,5,4]\n[2,1,6,4,3,5]\n[2,1,6,4,5,3]\n[2,1,6,5,3,4]\n[2,1,6,5,4,3]\n[2,3,1,4,5,6]\n[2,3,1,4,6,5]\n[2,3,1,5,4,6]\n[2,3,1,5,6,4]\n[2,3,1,6,4,5]\n[2,3,1,6,5,4]\n[2,3,4,1,5,6]\n[2,3,4,1,6,5]\n[2,3,4,5,1,6]\n[2,3,4,5,6,1]\n[2,3,4,6,1,5]\n[2,3,4,6,5,1]\n[2,3,5,1,4,6]\n[2,3,5,1,6,4]\n[2,3,5,4,1,6]\n[2,3,5,4,6,1]\n[2,3,5,6,1,4]\n[2,3,5,6,4,1]\n[2,3,6,1,4,5]\n[2,3,6,1,5,4]\n[2,3,6,4,1,5]\n[2,3,6,4,5,1]\n[2,3,6,5,1,4]\n[2,3,6,5,4,1]\n[2,4,1,3,5,6]\n[2,4,1,3,6,5]\n[2,4,1,5,3,6]\n[2,4,1,5,6,3]\n[2,4,1,6,3,5]\n[2,4,1,6,5,3]\n[2,4,3,1,5,6]\n[2,4,3,1,6,5]\n[2,4,3,5,1,6]\n[2,4,3,5,6,1]\n[2,4,3,6,1,5]\n[2,4,3,6,5,1]\n[2,4,5,1,3,6]\n[2,4,5,1,6,3]\n[2,4,5,3,1,6]\n[2,4,5,3,6,1]\n[2,4,5,6,1,3]\n[2,4,5,6,3,1]\n[2,4,6,1,3,5]\n[2,4,6,1,5,3]\n[2,4,6,3,1,5]\n[2,4,6,3,5,1]\n[2,4,6,5,1,3]\n[2,4,6,5,3,1]\n[2,5,1,3,4,6]\n[2,5,1,3,6,4]\n[2,5,1,4,3,6]\n[2,5,1,4,6,3]\n[2,5,1,6,3,4]\n[2,5,1,6,4,3]\n[2,5,3,1,4,6]\n[2,5,3,1,6,4]\n[2,5,3,4,1,6]\n[2,5,3,4,6,1]\n[2,5,3,6,1,4]\n[2,5,3,6,4,1]\n[2,5,4,1,3,6]\n[2,5,4,1,6,3]\n[2,5,4,3,1,6]\n[2,5,4,3,6,1]\n[2,5,4,6,1,3]\n[2,5,4,6,3,1]\n[2,5,6,1,3,4]\n[2,5,6,1,4,3]\n[2,5,6,3,1,4]\n[2,5,6,3,4,1]\n[2,5,6,4,1,3]\n[2,5,6,4,3,1]\n[2,6,1,3,4,5]\n[2,6,1,3,5,4]\n[2,6,1,4,3,5]\n[2,6,1,4,5,3]\n[2,6,1,5,3,4]\n[2,6,1,5,4,3]\n[2,6,3,1,4,5]\n[2,6,3,1,5,4]\n[2,6,3,4,1,5]\n[2,6,3,4,5,1]\n[2,6,3,5,1,4]\n[2,6,3,5,4,1]\n[2,6,4,1,3,5]\n[2,6,4,1,5,3]\n[2,6,4,3,1,5]\n[2,6,4,3,5,1]\n[2,6,4,5,1,3]\n[2,6,4,5,3,1]\n[2,6,5,1,3,4]\n[2,6,5,1,4,3]\n[2,6,5,3,1,4]\n[2,6,5,3,4,1]\n[2,6,5,4,1,3]\n[2,6,5,4,3,1]\n[3,1,2,4,5,6]\n[3,1,2,4,6,5]\n[3,1,2,5,4,6]\n[3,1,2,5,6,4]\n[3,1,2,6,4,5]\n[3,1,2,6,5,4]\n[3,1,4,2,5,6]\n[3,1,4,2,6,5]\n[3,1,4,5,2,6]\n[3,1,4,5,6,2]\n[3,1,4,6,2,5]\n[3,1,4,6,5,2]\n[3,1,5,2,4,6]\n[3,1,5,2,6,4]\n[3,1,5,4,2,6]\n[3,1,5,4,6,2]\n[3,1,5,6,2,4]\n[3,1,5,6,4,2]\n[3,1,6,2,4,5]\n[3,1,6,2,5,4]\n[3,1,6,4,2,5]\n[3,1,6,4,5,2]\n[3,1,6,5,2,4]\n[3,1,6,5,4,2]\n[3,2,1,4,5,6]\n[3,2,1,4,6,5]\n[3,2,1,5,4,6]\n[3,2,1,5,6,4]\n[3,2,1,6,4,5]\n[3,2,1,6,5,4]\n[3,2,4,1,5,6]\n[3,2,4,1,6,5]\n[3,2,4,5,1,6]\n[3,2,4,5,6,1]\n[3,2,4,6,1,5]\n[3,2,4,6,5,1]\n[3,2,5,1,4,6]\n[3,2,5,1,6,4]\n[3,2,5,4,1,6]\n[3,2,5,4,6,1]\n[3,2,5,6,1,4]\n[3,2,5,6,4,1]\n[3,2,6,1,4,5]\n[3,2,6,1,5,4]\n[3,2,6,4,1,5]\n[3,2,6,4,5,1]\n[3,2,6,5,1,4]\n[3,2,6,5,4,1]\n[3,4,1,2,5,6]\n[3,4,1,2,6,5]\n[3,4,1,5,2,6]\n[3,4,1,5,6,2]\n[3,4,1,6,2,5]\n[3,4,1,6,5,2]\n[3,4,2,1,5,6]\n[3,4,2,1,6,5]\n[3,4,2,5,1,6]\n[3,4,2,5,6,1]\n[3,4,2,6,1,5]\n[3,4,2,6,5,1]\n[3,4,5,1,2,6]\n[3,4,5,1,6,2]\n[3,4,5,2,1,6]\n[3,4,5,2,6,1]\n[3,4,5,6,1,2]\n[3,4,5,6,2,1]\n[3,4,6,1,2,5]\n[3,4,6,1,5,2]\n[3,4,6,2,1,5]\n[3,4,6,2,5,1]\n[3,4,6,5,1,2]\n[3,4,6,5,2,1]\n[3,5,1,2,4,6]\n[3,5,1,2,6,4]\n[3,5,1,4,2,6]\n[3,5,1,4,6,2]\n[3,5,1,6,2,4]\n[3,5,1,6,4,2]\n[3,5,2,1,4,6]\n[3,5,2,1,6,4]\n[3,5,2,4,1,6]\n[3,5,2,4,6,1]\n[3,5,2,6,1,4]\n[3,5,2,6,4,1]\n[3,5,4,1,2,6]\n[3,5,4,1,6,2]\n[3,5,4,2,1,6]\n[3,5,4,2,6,1]\n[3,5,4,6,1,2]\n[3,5,4,6,2,1]\n[3,5,6,1,2,4]\n[3,5,6,1,4,2]\n[3,5,6,2,1,4]\n[3,5,6,2,4,1]\n[3,5,6,4,1,2]\n[3,5,6,4,2,1]\n[3,6,1,2,4,5]\n[3,6,1,2,5,4]\n[3,6,1,4,2,5]\n[3,6,1,4,5,2]\n[3,6,1,5,2,4]\n[3,6,1,5,4,2]\n[3,6,2,1,4,5]\n[3,6,2,1,5,4]\n[3,6,2,4,1,5]\n[3,6,2,4,5,1]\n[3,6,2,5,1,4]\n[3,6,2,5,4,1]\n[3,6,4,1,2,5]\n[3,6,4,1,5,2]\n[3,6,4,2,1,5]\n[3,6,4,2,5,1]\n[3,6,4,5,1,2]\n[3,6,4,5,2,1]\n[3,6,5,1,2,4]\n[3,6,5,1,4,2]\n[3,6,5,2,1,4]\n[3,6,5,2,4,1]\n[3,6,5,4,1,2]\n[3,6,5,4,2,1]\n[4,1,2,3,5,6]\n[4,1,2,3,6,5]\n[4,1,2,5,3,6]\n[4,1,2,5,6,3]\n[4,1,2,6,3,5]\n[4,1,2,6,5,3]\n[4,1,3,2,5,6]\n[4,1,3,2,6,5]\n[4,1,3,5,2,6]\n[4,1,3,5,6,2]\n[4,1,3,6,2,5]\n[4,1,3,6,5,2]\n[4,1,5,2,3,6]\n[4,1,5,2,6,3]\n[4,1,5,3,2,6]\n[4,1,5,3,6,2]\n[4,1,5,6,2,3]\n[4,1,5,6,3,2]\n[4,1,6,2,3,5]\n[4,1,6,2,5,3]\n[4,1,6,3,2,5]\n[4,1,6,3,5,2]\n[4,1,6,5,2,3]\n[4,1,6,5,3,2]\n[4,2,1,3,5,6]\n[4,2,1,3,6,5]\n[4,2,1,5,3,6]\n[4,2,1,5,6,3]\n[4,2,1,6,3,5]\n[4,2,1,6,5,3]\n[4,2,3,1,5,6]\n[4,2,3,1,6,5]\n[4,2,3,5,1,6]\n[4,2,3,5,6,1]\n[4,2,3,6,1,5]\n[4,2,3,6,5,1]\n[4,2,5,1,3,6]\n[4,2,5,1,6,3]\n[4,2,5,3,1,6]\n[4,2,5,3,6,1]\n[4,2,5,6,1,3]\n[4,2,5,6,3,1]\n[4,2,6,1,3,5]\n[4,2,6,1,5,3]\n[4,2,6,3,1,5]\n[4,2,6,3,5,1]\n[4,2,6,5,1,3]\n[4,2,6,5,3,1]\n[4,3,1,2,5,6]\n[4,3,1,2,6,5]\n[4,3,1,5,2,6]\n[4,3,1,5,6,2]\n[4,3,1,6,2,5]\n[4,3,1,6,5,2]\n[4,3,2,1,5,6]\n[4,3,2,1,6,5]\n[4,3,2,5,1,6]\n[4,3,2,5,6,1]\n[4,3,2,6,1,5]\n[4,3,2,6,5,1]\n[4,3,5,1,2,6]\n[4,3,5,1,6,2]\n[4,3,5,2,1,6]\n[4,3,5,2,6,1]\n[4,3,5,6,1,2]\n[4,3,5,6,2,1]\n[4,3,6,1,2,5]\n[4,3,6,1,5,2]\n[4,3,6,2,1,5]\n[4,3,6,2,5,1]\n[4,3,6,5,1,2]\n[4,3,6,5,2,1]\n[4,5,1,2,3,6]\n[4,5,1,2,6,3]\n[4,5,1,3,2,6]\n[4,5,1,3,6,2]\n[4,5,1,6,2,3]\n[4,5,1,6,3,2]\n[4,5,2,1,3,6]\n[4,5,2,1,6,3]\n[4,5,2,3,1,6]\n[4,5,2,3,6,1]\n[4,5,2,6,1,3]\n[4,5,2,6,3,1]\n[4,5,3,1,2,6]\n[4,5,3,1,6,2]\n[4,5,3,2,1,6]\n[4,5,3,2,6,1]\n[4,5,3,6,1,2]\n[4,5,3,6,2,1]\n[4,5,6,1,2,3]\n[4,5,6,1,3,2]\n[4,5,6,2,1,3]\n[4,5,6,2,3,1]\n[4,5,6,3,1,2]\n[4,5,6,3,2,1]\n[4,6,1,2,3,5]\n[4,6,1,2,5,3]\n[4,6,1,3,2,5]\n[4,6,1,3,5,2]\n[4,6,1,5,2,3]\n[4,6,1,5,3,2]\n[4,6,2,1,3,5]\n[4,6,2,1,5,3]\n[4,6,2,3,1,5]\n[4,6,2,3,5,1]\n[4,6,2,5,1,3]\n[4,6,2,5,3,1]\n[4,6,3,1,2,5]\n[4,6,3,1,5,2]\n[4,6,3,2,1,5]\n[4,6,3,2,5,1]\n[4,6,3,5,1,2]\n[4,6,3,5,2,1]\n[4,6,5,1,2,3]\n[4,6,5,1,3,2]\n[4,6,5,2,1,3]\n[4,6,5,2,3,1]\n[4,6,5,3,1,2]\n[4,6,5,3,2,1]\n[5,1,2,3,4,6]\n[5,1,2,3,6,4]\n[5,1,2,4,3,6]\n[5,1,2,4,6,3]\n[5,1,2,6,3,4]\n[5,1,2,6,4,3]\n[5,1,3,2,4,6]\n[5,1,3,2,6,4]\n[5,1,3,4,2,6]\n[5,1,3,4,6,2]\n[5,1,3,6,2,4]\n[5,1,3,6,4,2]\n[5,1,4,2,3,6]\n[5,1,4,2,6,3]\n[5,1,4,3,2,6]\n[5,1,4,3,6,2]\n[5,1,4,6,2,3]\n[5,1,4,6,3,2]\n[5,1,6,2,3,4]\n[5,1,6,2,4,3]\n[5,1,6,3,2,4]\n[5,1,6,3,4,2]\n[5,1,6,4,2,3]\n[5,1,6,4,3,2]\n[5,2,1,3,4,6]\n[5,2,1,3,6,4]\n[5,2,1,4,3,6]\n[5,2,1,4,6,3]\n[5,2,1,6,3,4]\n[5,2,1,6,4,3]\n[5,2,3,1,4,6]\n[5,2,3,1,6,4]\n[5,2,3,4,1,6]\n[5,2,3,4,6,1]\n[5,2,3,6,1,4]\n[5,2,3,6,4,1]\n[5,2,4,1,3,6]\n[5,2,4,1,6,3]\n[5,2,4,3,1,6]\n[5,2,4,3,6,1]\n[5,2,4,6,1,3]\n[5,2,4,6,3,1]\n[5,2,6,1,3,4]\n[5,2,6,1,4,3]\n[5,2,6,3,1,4]\n[5,2,6,3,4,1]\n[5,2,6,4,1,3]\n[5,2,6,4,3,1]\n[5,3,1,2,4,6]\n[5,3,1,2,6,4]\n[5,3,1,4,2,6]\n[5,3,1,4,6,2]\n[5,3,1,6,2,4]\n[5,3,1,6,4,2]\n[5,3,2,1,4,6]\n[5,3,2,1,6,4]\n[5,3,2,4,1,6]\n[5,3,2,4,6,1]\n[5,3,2,6,1,4]\n[5,3,2,6,4,1]\n[5,3,4,1,2,6]\n[5,3,4,1,6,2]\n[5,3,4,2,1,6]\n[5,3,4,2,6,1]\n[5,3,4,6,1,2]\n[5,3,4,6,2,1]\n[5,3,6,1,2,4]\n[5,3,6,1,4,2]\n[5,3,6,2,1,4]\n[5,3,6,2,4,1]\n[5,3,6,4,1,2]\n[5,3,6,4,2,1]\n[5,4,1,2,3,6]\n[5,4,1,2,6,3]\n[5,4,1,3,2,6]\n[5,4,1,3,6,2]\n[5,4,1,6,2,3]\n[5,4,1,6,3,2]\n[5,4,2,1,3,6]\n[5,4,2,1,6,3]\n[5,4,2,3,1,6]\n[5,4,2,3,6,1]\n[5,4,2,6,1,3]\n[5,4,2,6,3,1]\n[5,4,3,1,2,6]\n[5,4,3,1,6,2]\n[5,4,3,2,1,6]\n[5,4,3,2,6,1]\n[5,4,3,6,1,2]\n[5,4,3,6,2,1]\n[5,4,6,1,2,3]\n[5,4,6,1,3,2]\n[5,4,6,2,1,3]\n[5,4,6,2,3,1]\n[5,4,6,3,1,2]\n[5,4,6,3,2,1]\n[5,6,1,2,3,4]\n[5,6,1,2,4,3]\n[5,6,1,3,2,4]\n[5,6,1,3,4,2]\n[5,6,1,4,2,3]\n[5,6,1,4,3,2]\n[5,6,2,1,3,4]\n[5,6,2,1,4,3]\n[5,6,2,3,1,4]\n[5,6,2,3,4,1]\n[5,6,2,4,1,3]\n[5,6,2,4,3,1]\n[5,6,3,1,2,4]\n[5,6,3,1,4,2]\n[5,6,3,2,1,4]\n[5,6,3,2,4,1]\n[5,6,3,4,1,2]\n[5,6,3,4,2,1]\n[5,6,4,1,2,3]\n[5,6,4,1,3,2]\n[5,6,4,2,1,3]\n[5,6,4,2,3,1]\n[5,6,4,3,1,2]\n[5,6,4,3,2,1]\n[6,1,2,3,4,5]\n[6,1,2,3,5,4]\n[6,1,2,4,3,5]\n[6,1,2,4,5,3]\n[6,1,2,5,3,4]\n[6,1,2,5,4,3]\n[6,1,3,2,4,5]\n[6,1,3,2,5,4]\n[6,1,3,4,2,5]\n[6,1,3,4,5,2]\n[6,1,3,5,2,4]\n[6,1,3,5,4,2]\n[6,1,4,2,3,5]\n[6,1,4,2,5,3]\n[6,1,4,3,2,5]\n[6,1,4,3,5,2]\n[6,1,4,5,2,3]\n[6,1,4,5,3,2]\n[6,1,5,2,3,4]\n[6,1,5,2,4,3]\n[6,1,5,3,2,4]\n[6,1,5,3,4,2]\n[6,1,5,4,2,3]\n[6,1,5,4,3,2]\n[6,2,1,3,4,5]\n[6,2,1,3,5,4]\n[6,2,1,4,3,5]\n[6,2,1,4,5,3]\n[6,2,1,5,3,4]\n[6,2,1,5,4,3]\n[6,2,3,1,4,5]\n[6,2,3,1,5,4]\n[6,2,3,4,1,5]\n[6,2,3,4,5,1]\n[6,2,3,5,1,4]\n[6,2,3,5,4,1]\n[6,2,4,1,3,5]\n[6,2,4,1,5,3]\n[6,2,4,3,1,5]\n[6,2,4,3,5,1]\n[6,2,4,5,1,3]\n[6,2,4,5,3,1]\n[6,2,5,1,3,4]\n[6,2,5,1,4,3]\n[6,2,5,3,1,4]\n[6,2,5,3,4,1]\n[6,2,5,4,1,3]\n[6,2,5,4,3,1]\n[6,3,1,2,4,5]\n[6,3,1,2,5,4]\n[6,3,1,4,2,5]\n[6,3,1,4,5,2]\n[6,3,1,5,2,4]\n[6,3,1,5,4,2]\n[6,3,2,1,4,5]\n[6,3,2,1,5,4]\n[6,3,2,4,1,5]\n[6,3,2,4,5,1]\n[6,3,2,5,1,4]\n[6,3,2,5,4,1]\n[6,3,4,1,2,5]\n[6,3,4,1,5,2]\n[6,3,4,2,1,5]\n[6,3,4,2,5,1]\n[6,3,4,5,1,2]\n[6,3,4,5,2,1]\n[6,3,5,1,2,4]\n[6,3,5,1,4,2]\n[6,3,5,2,1,4]\n[6,3,5,2,4,1]\n[6,3,5,4,1,2]\n[6,3,5,4,2,1]\n[6,4,1,2,3,5]\n[6,4,1,2,5,3]\n[6,4,1,3,2,5]\n[6,4,1,3,5,2]\n[6,4,1,5,2,3]\n[6,4,1,5,3,2]\n[6,4,2,1,3,5]\n[6,4,2,1,5,3]\n[6,4,2,3,1,5]\n[6,4,2,3,5,1]\n[6,4,2,5,1,3]\n[6,4,2,5,3,1]\n[6,4,3,1,2,5]\n[6,4,3,1,5,2]\n[6,4,3,2,1,5]\n[6,4,3,2,5,1]\n[6,4,3,5,1,2]\n[6,4,3,5,2,1]\n[6,4,5,1,2,3]\n[6,4,5,1,3,2]\n[6,4,5,2,1,3]\n[6,4,5,2,3,1]\n[6,4,5,3,1,2]\n[6,4,5,3,2,1]\n[6,5,1,2,3,4]\n[6,5,1,2,4,3]\n[6,5,1,3,2,4]\n[6,5,1,3,4,2]\n[6,5,1,4,2,3]\n[6,5,1,4,3,2]\n[6,5,2,1,3,4]\n[6,5,2,1,4,3]\n[6,5,2,3,1,4]\n[6,5,2,3,4,1]\n[6,5,2,4,1,3]\n[6,5,2,4,3,1]\n[6,5,3,1,2,4]\n[6,5,3,1,4,2]\n[6,5,3,2,1,4]\n[6,5,3,2,4,1]\n[6,5,3,4,1,2]\n[6,5,3,4,2,1]\n[6,5,4,1,2,3]\n[6,5,4,1,3,2]\n[6,5,4,2,1,3]\n[6,5,4,2,3,1]\n[6,5,4,3,1,2]\n[6,5,4,3,2,1]",
      },
      { input: "100 -100", expected: "2\n[-100,100]\n[100,-100]" },
    ],
    hints: [
      "n distinct guests have n! orderings.",
      "Fill chair 1 with any guest, then fill the remaining chairs with the remaining guests — the same problem, one size smaller.",
      "Track which guests are already seated with a boolean array, and free the guest again after exploring.",
      "If the guests are sorted and you always try them in order, the orderings are produced already sorted.",
    ],
    solutions: [
      {
        title: "Swap in place, then sort",
        order: 1,
        intuition:
          "Choose who sits in chair k by swapping each remaining guest into position k, recursing on the rest, and swapping back. It produces every ordering once, but the swaps scramble the order, so the results need a sort at the end.",
        approach: [
          "place(k): if k equals n, record a copy of the array.",
          "For each i from k to n − 1, swap positions k and i, call place(k + 1), and swap back.",
          "Sort the recorded orderings and format them.",
        ],
        code: {
          PYTHON: `def seatingOrders(guests: List[int]) -> List[str]:
    row = list(guests)
    found = []

    def place(k: int) -> None:
        if k == len(row):
            found.append(list(row))
            return
        for i in range(k, len(row)):
            row[k], row[i] = row[i], row[k]
            place(k + 1)
            row[k], row[i] = row[i], row[k]

    place(0)
    found.sort()
    return ["[" + ",".join(map(str, order)) + "]" for order in found]`,
          JAVA: `class Solution {
    private int[] row;
    private final List<int[]> found = new ArrayList<>();

    public String[] seatingOrders(int[] guests) {
        row = guests.clone();
        place(0);
        found.sort((a, b) -> {
            for (int i = 0; i < a.length; i++) {
                if (a[i] != b[i]) return Integer.compare(a[i], b[i]);
            }
            return 0;
        });
        String[] out = new String[found.size()];
        for (int i = 0; i < out.length; i++) {
            StringBuilder sb = new StringBuilder("[");
            for (int j = 0; j < found.get(i).length; j++) {
                if (j > 0) sb.append(',');
                sb.append(found.get(i)[j]);
            }
            out[i] = sb.append(']').toString();
        }
        return out;
    }

    private void place(int k) {
        if (k == row.length) {
            found.add(row.clone());
            return;
        }
        for (int i = k; i < row.length; i++) {
            swap(k, i);
            place(k + 1);
            swap(k, i);
        }
    }

    private void swap(int a, int b) {
        int tmp = row[a];
        row[a] = row[b];
        row[b] = tmp;
    }
}`,
        },
        timeComplexity: "O(n! · n log n!) including the sort",
        spaceComplexity: "O(n! · n)",
        edgeCases: [
          "A single guest.",
          "Negative numbers, which must be compared numerically.",
        ],
        commonMistakes: [
          "Recording the shared array instead of a copy.",
          'Sorting formatted strings, which puts "[-1" and "[10" in text order rather than numeric order.',
        ],
      },
      {
        title: "Optimal: used-marker backtracking over sorted guests",
        order: 2,
        intuition:
          "Sort the guests and fill chairs left to right. For each chair, try the unseated guests from smallest to largest. Every ordering that starts with a smaller guest is finished before any ordering that starts with a larger one, which is exactly lexicographic order.",
        approach: [
          "Sort the guests and keep a used flag per guest.",
          "fill(): if every chair is taken, record the ordering.",
          "Otherwise, for each guest not yet used, mark it, append it, call fill(), then pop and unmark.",
          "Return the recorded orderings.",
        ],
        code: {
          PYTHON: `def seatingOrders(guests: List[int]) -> List[str]:
    ordered = sorted(guests)
    used = [False] * len(ordered)
    seated = []
    orders = []

    def fill() -> None:
        if len(seated) == len(ordered):
            orders.append("[" + ",".join(map(str, seated)) + "]")
            return
        for i in range(len(ordered)):
            if used[i]:
                continue
            used[i] = True
            seated.append(ordered[i])
            fill()
            seated.pop()
            used[i] = False

    fill()
    return orders`,
          JAVA: `class Solution {
    private int[] ordered;
    private boolean[] used;
    private final List<Integer> seated = new ArrayList<>();
    private final List<String> orders = new ArrayList<>();

    public String[] seatingOrders(int[] guests) {
        ordered = guests.clone();
        Arrays.sort(ordered);
        used = new boolean[ordered.length];
        fill();
        return orders.toArray(new String[0]);
    }

    private void fill() {
        if (seated.size() == ordered.length) {
            StringBuilder sb = new StringBuilder("[");
            for (int j = 0; j < seated.size(); j++) {
                if (j > 0) sb.append(',');
                sb.append(seated.get(j));
            }
            orders.add(sb.append(']').toString());
            return;
        }
        for (int i = 0; i < ordered.length; i++) {
            if (used[i]) continue;
            used[i] = true;
            seated.add(ordered[i]);
            fill();
            seated.remove(seated.size() - 1);
            used[i] = false;
        }
    }
}`,
        },
        timeComplexity: "O(n! · n)",
        spaceComplexity: "O(n) beyond the output",
        edgeCases: ["One guest, one ordering.", "Six guests, giving 720 orderings."],
        commonMistakes: [
          "Forgetting to unmark a guest, so later branches think they are still seated.",
          "Skipping the initial sort, which produces every ordering but in the wrong order.",
        ],
      },
    ],
    expectedTime: "O(n! · n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "voucher-bundles",
    title: "Voucher Bundles",
    difficulty: "MEDIUM",
    learningObjective:
      "Avoid generating the same combination in different orders by never choosing a smaller option after a larger one, and prune once options exceed what is left.",
    topics: ["backtracking"],
    patterns: ["backtracking"],
    statement: [
      para(
        "A vending machine dispenses voucher codes in a few fixed denominations, and any denomination may be dispensed as many times as needed. Support wants a list of every distinct way to make an exact total."
      ),
      rich(
        "Given distinct positive ",
        { code: "values" },
        " and a ",
        { code: "total" },
        ", return every multiset of values summing to exactly ",
        { code: "total" },
        ". Two bundles that differ only in order are the same bundle. Write each bundle smallest value first, comma-separated inside square brackets with no spaces, and list the bundles in ",
        { strong: "lexicographic order as number sequences" },
        "."
      ),
      example(
        "values = [3, 2, 5], total = 8",
        '["[2,2,2,2]", "[2,3,3]", "[3,5]"]',
        [
          { state: "[2,2,2,2]", note: "keep taking 2 until the total is met" },
          {
            state: "[2,2,2] + 3?",
            note: "9 overshoots — and 5 would too, so stop trying",
          },
          { state: "[2,3,3]", note: "after a 3, only 3 or larger may follow" },
          { state: "[3,5]", note: "starting from 3 never revisits 2" },
        ],
        "Non-decreasing bundles, so each multiset is built once"
      ),
    ],
    constraints: [
      "1 ≤ values.length ≤ 10",
      "1 ≤ values[i] ≤ 50, all distinct",
      "1 ≤ total ≤ 60",
      "The answer has at most 1000 bundles.",
      "Output: the number of bundles (0 if none), then one bundle per line.",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["values", "total"],
      returns: "string[]",
      functionName: "exactBundles",
    },
    tests: [
      {
        input: "3 2 5\n8",
        expected: "3\n[2,2,2,2]\n[2,3,3]\n[3,5]",
        isSample: true,
        explanation:
          "2+2+2+2, 2+3+3 and 3+5. Each bundle is written smallest value first.",
      },
      {
        input: "4\n6",
        expected: "0",
        isSample: true,
        explanation: "No number of 4s makes 6, so the list is empty.",
      },
      { input: "1\n1", expected: "1\n[1]" },
      { input: "7 3\n7", expected: "1\n[7]" },
      { input: "2 3 6 7\n7", expected: "2\n[2,2,3]\n[7]" },
      {
        input: "2 3 5 7 11\n18",
        expected:
          "17\n[2,2,2,2,2,2,2,2,2]\n[2,2,2,2,2,2,3,3]\n[2,2,2,2,2,3,5]\n[2,2,2,2,3,7]\n[2,2,2,2,5,5]\n[2,2,2,3,3,3,3]\n[2,2,2,5,7]\n[2,2,3,3,3,5]\n[2,2,3,11]\n[2,2,7,7]\n[2,3,3,3,7]\n[2,3,3,5,5]\n[2,5,11]\n[3,3,3,3,3,3]\n[3,3,5,7]\n[3,5,5,5]\n[7,11]",
      },
      {
        input: "5 10 25\n50",
        expected:
          "10\n[5,5,5,5,5,5,5,5,5,5]\n[5,5,5,5,5,5,5,5,10]\n[5,5,5,5,5,5,10,10]\n[5,5,5,5,5,25]\n[5,5,5,5,10,10,10]\n[5,5,5,10,25]\n[5,5,10,10,10,10]\n[5,10,10,25]\n[10,10,10,10,10]\n[25,25]",
      },
      {
        input: "3 4 5 6 7 8 9\n20",
        expected:
          "29\n[3,3,3,3,3,5]\n[3,3,3,3,4,4]\n[3,3,3,3,8]\n[3,3,3,4,7]\n[3,3,3,5,6]\n[3,3,4,4,6]\n[3,3,4,5,5]\n[3,3,5,9]\n[3,3,6,8]\n[3,3,7,7]\n[3,4,4,4,5]\n[3,4,4,9]\n[3,4,5,8]\n[3,4,6,7]\n[3,5,5,7]\n[3,5,6,6]\n[3,8,9]\n[4,4,4,4,4]\n[4,4,4,8]\n[4,4,5,7]\n[4,4,6,6]\n[4,5,5,6]\n[4,7,9]\n[4,8,8]\n[5,5,5,5]\n[5,6,9]\n[5,7,8]\n[6,6,8]\n[6,7,7]",
      },
      {
        input: "1 2 3 4 5\n20",
        expected:
          "192\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,3]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,4]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,3]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,5]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,2]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,2,4]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,1,3,3]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,2,2,3]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,2,5]\n[1,1,1,1,1,1,1,1,1,1,1,1,1,3,4]\n[1,1,1,1,1,1,1,1,1,1,1,1,2,2,2,2]\n[1,1,1,1,1,1,1,1,1,1,1,1,2,2,4]\n[1,1,1,1,1,1,1,1,1,1,1,1,2,3,3]\n[1,1,1,1,1,1,1,1,1,1,1,1,3,5]\n[1,1,1,1,1,1,1,1,1,1,1,1,4,4]\n[1,1,1,1,1,1,1,1,1,1,1,2,2,2,3]\n[1,1,1,1,1,1,1,1,1,1,1,2,2,5]\n[1,1,1,1,1,1,1,1,1,1,1,2,3,4]\n[1,1,1,1,1,1,1,1,1,1,1,3,3,3]\n[1,1,1,1,1,1,1,1,1,1,1,4,5]\n[1,1,1,1,1,1,1,1,1,1,2,2,2,2,2]\n[1,1,1,1,1,1,1,1,1,1,2,2,2,4]\n[1,1,1,1,1,1,1,1,1,1,2,2,3,3]\n[1,1,1,1,1,1,1,1,1,1,2,3,5]\n[1,1,1,1,1,1,1,1,1,1,2,4,4]\n[1,1,1,1,1,1,1,1,1,1,3,3,4]\n[1,1,1,1,1,1,1,1,1,1,5,5]\n[1,1,1,1,1,1,1,1,1,2,2,2,2,3]\n[1,1,1,1,1,1,1,1,1,2,2,2,5]\n[1,1,1,1,1,1,1,1,1,2,2,3,4]\n[1,1,1,1,1,1,1,1,1,2,3,3,3]\n[1,1,1,1,1,1,1,1,1,2,4,5]\n[1,1,1,1,1,1,1,1,1,3,3,5]\n[1,1,1,1,1,1,1,1,1,3,4,4]\n[1,1,1,1,1,1,1,1,2,2,2,2,2,2]\n[1,1,1,1,1,1,1,1,2,2,2,2,4]\n[1,1,1,1,1,1,1,1,2,2,2,3,3]\n[1,1,1,1,1,1,1,1,2,2,3,5]\n[1,1,1,1,1,1,1,1,2,2,4,4]\n[1,1,1,1,1,1,1,1,2,3,3,4]\n[1,1,1,1,1,1,1,1,2,5,5]\n[1,1,1,1,1,1,1,1,3,3,3,3]\n[1,1,1,1,1,1,1,1,3,4,5]\n[1,1,1,1,1,1,1,1,4,4,4]\n[1,1,1,1,1,1,1,2,2,2,2,2,3]\n[1,1,1,1,1,1,1,2,2,2,2,5]\n[1,1,1,1,1,1,1,2,2,2,3,4]\n[1,1,1,1,1,1,1,2,2,3,3,3]\n[1,1,1,1,1,1,1,2,2,4,5]\n[1,1,1,1,1,1,1,2,3,3,5]\n[1,1,1,1,1,1,1,2,3,4,4]\n[1,1,1,1,1,1,1,3,3,3,4]\n[1,1,1,1,1,1,1,3,5,5]\n[1,1,1,1,1,1,1,4,4,5]\n[1,1,1,1,1,1,2,2,2,2,2,2,2]\n[1,1,1,1,1,1,2,2,2,2,2,4]\n[1,1,1,1,1,1,2,2,2,2,3,3]\n[1,1,1,1,1,1,2,2,2,3,5]\n[1,1,1,1,1,1,2,2,2,4,4]\n[1,1,1,1,1,1,2,2,3,3,4]\n[1,1,1,1,1,1,2,2,5,5]\n[1,1,1,1,1,1,2,3,3,3,3]\n[1,1,1,1,1,1,2,3,4,5]\n[1,1,1,1,1,1,2,4,4,4]\n[1,1,1,1,1,1,3,3,3,5]\n[1,1,1,1,1,1,3,3,4,4]\n[1,1,1,1,1,1,4,5,5]\n[1,1,1,1,1,2,2,2,2,2,2,3]\n[1,1,1,1,1,2,2,2,2,2,5]\n[1,1,1,1,1,2,2,2,2,3,4]\n[1,1,1,1,1,2,2,2,3,3,3]\n[1,1,1,1,1,2,2,2,4,5]\n[1,1,1,1,1,2,2,3,3,5]\n[1,1,1,1,1,2,2,3,4,4]\n[1,1,1,1,1,2,3,3,3,4]\n[1,1,1,1,1,2,3,5,5]\n[1,1,1,1,1,2,4,4,5]\n[1,1,1,1,1,3,3,3,3,3]\n[1,1,1,1,1,3,3,4,5]\n[1,1,1,1,1,3,4,4,4]\n[1,1,1,1,1,5,5,5]\n[1,1,1,1,2,2,2,2,2,2,2,2]\n[1,1,1,1,2,2,2,2,2,2,4]\n[1,1,1,1,2,2,2,2,2,3,3]\n[1,1,1,1,2,2,2,2,3,5]\n[1,1,1,1,2,2,2,2,4,4]\n[1,1,1,1,2,2,2,3,3,4]\n[1,1,1,1,2,2,2,5,5]\n[1,1,1,1,2,2,3,3,3,3]\n[1,1,1,1,2,2,3,4,5]\n[1,1,1,1,2,2,4,4,4]\n[1,1,1,1,2,3,3,3,5]\n[1,1,1,1,2,3,3,4,4]\n[1,1,1,1,2,4,5,5]\n[1,1,1,1,3,3,3,3,4]\n[1,1,1,1,3,3,5,5]\n[1,1,1,1,3,4,4,5]\n[1,1,1,1,4,4,4,4]\n[1,1,1,2,2,2,2,2,2,2,3]\n[1,1,1,2,2,2,2,2,2,5]\n[1,1,1,2,2,2,2,2,3,4]\n[1,1,1,2,2,2,2,3,3,3]\n[1,1,1,2,2,2,2,4,5]\n[1,1,1,2,2,2,3,3,5]\n[1,1,1,2,2,2,3,4,4]\n[1,1,1,2,2,3,3,3,4]\n[1,1,1,2,2,3,5,5]\n[1,1,1,2,2,4,4,5]\n[1,1,1,2,3,3,3,3,3]\n[1,1,1,2,3,3,4,5]\n[1,1,1,2,3,4,4,4]\n[1,1,1,2,5,5,5]\n[1,1,1,3,3,3,3,5]\n[1,1,1,3,3,3,4,4]\n[1,1,1,3,4,5,5]\n[1,1,1,4,4,4,5]\n[1,1,2,2,2,2,2,2,2,2,2]\n[1,1,2,2,2,2,2,2,2,4]\n[1,1,2,2,2,2,2,2,3,3]\n[1,1,2,2,2,2,2,3,5]\n[1,1,2,2,2,2,2,4,4]\n[1,1,2,2,2,2,3,3,4]\n[1,1,2,2,2,2,5,5]\n[1,1,2,2,2,3,3,3,3]\n[1,1,2,2,2,3,4,5]\n[1,1,2,2,2,4,4,4]\n[1,1,2,2,3,3,3,5]\n[1,1,2,2,3,3,4,4]\n[1,1,2,2,4,5,5]\n[1,1,2,3,3,3,3,4]\n[1,1,2,3,3,5,5]\n[1,1,2,3,4,4,5]\n[1,1,2,4,4,4,4]\n[1,1,3,3,3,3,3,3]\n[1,1,3,3,3,4,5]\n[1,1,3,3,4,4,4]\n[1,1,3,5,5,5]\n[1,1,4,4,5,5]\n[1,2,2,2,2,2,2,2,2,3]\n[1,2,2,2,2,2,2,2,5]\n[1,2,2,2,2,2,2,3,4]\n[1,2,2,2,2,2,3,3,3]\n[1,2,2,2,2,2,4,5]\n[1,2,2,2,2,3,3,5]\n[1,2,2,2,2,3,4,4]\n[1,2,2,2,3,3,3,4]\n[1,2,2,2,3,5,5]\n[1,2,2,2,4,4,5]\n[1,2,2,3,3,3,3,3]\n[1,2,2,3,3,4,5]\n[1,2,2,3,4,4,4]\n[1,2,2,5,5,5]\n[1,2,3,3,3,3,5]\n[1,2,3,3,3,4,4]\n[1,2,3,4,5,5]\n[1,2,4,4,4,5]\n[1,3,3,3,3,3,4]\n[1,3,3,3,5,5]\n[1,3,3,4,4,5]\n[1,3,4,4,4,4]\n[1,4,5,5,5]\n[2,2,2,2,2,2,2,2,2,2]\n[2,2,2,2,2,2,2,2,4]\n[2,2,2,2,2,2,2,3,3]\n[2,2,2,2,2,2,3,5]\n[2,2,2,2,2,2,4,4]\n[2,2,2,2,2,3,3,4]\n[2,2,2,2,2,5,5]\n[2,2,2,2,3,3,3,3]\n[2,2,2,2,3,4,5]\n[2,2,2,2,4,4,4]\n[2,2,2,3,3,3,5]\n[2,2,2,3,3,4,4]\n[2,2,2,4,5,5]\n[2,2,3,3,3,3,4]\n[2,2,3,3,5,5]\n[2,2,3,4,4,5]\n[2,2,4,4,4,4]\n[2,3,3,3,3,3,3]\n[2,3,3,3,4,5]\n[2,3,3,4,4,4]\n[2,3,5,5,5]\n[2,4,4,5,5]\n[3,3,3,3,3,5]\n[3,3,3,3,4,4]\n[3,3,4,5,5]\n[3,4,4,4,5]\n[4,4,4,4,4]\n[5,5,5,5]",
      },
      {
        input: "6 9 20\n60",
        expected:
          "5\n[6,6,6,6,6,6,6,6,6,6]\n[6,6,6,6,6,6,6,9,9]\n[6,6,6,6,9,9,9,9]\n[6,9,9,9,9,9,9]\n[20,20,20]",
      },
    ],
    hints: [
      "If you try every value at every step, 2+3 and 3+2 are both found. How could you stop that?",
      "Insist that the values in a bundle never decrease. Then each multiset has exactly one way to be built.",
      "Recurse with a start index. You may reuse the current value, so recurse with the same index, not the next one.",
      "Sort the values: once one is larger than what remains, every value after it is too, so the loop can stop.",
    ],
    solutions: [
      {
        title: "Try every order, then deduplicate",
        order: 1,
        intuition:
          "The simplest search tries every value at every step and records whatever reaches the total exactly. Orderings of the same multiset are all found, so each result is sorted and dropped into a set. The amount of repeated work grows explosively with the number of pieces.",
        approach: [
          "explore(remaining, picked): if remaining is 0, add the sorted picked values to a set.",
          "Otherwise, for each value that fits, recurse with that value appended.",
          "Sort the distinct bundles and format them.",
        ],
        code: {
          PYTHON: `def exactBundles(values: List[int], total: int) -> List[str]:
    found = set()

    def explore(remaining: int, picked: List[int]) -> None:
        if remaining == 0:
            found.add(tuple(sorted(picked)))
            return
        for value in values:
            if value <= remaining:
                explore(remaining - value, picked + [value])

    explore(total, [])
    return ["[" + ",".join(map(str, b)) + "]" for b in sorted(found)]`,
          JAVA: `class Solution {
    private int[] values;
    private final Set<List<Integer>> found = new HashSet<>();

    public String[] exactBundles(int[] values, int total) {
        this.values = values;
        explore(total, new ArrayList<>());
        List<List<Integer>> bundles = new ArrayList<>(found);
        bundles.sort((a, b) -> {
            for (int i = 0; i < Math.min(a.size(), b.size()); i++) {
                if (!a.get(i).equals(b.get(i))) return Integer.compare(a.get(i), b.get(i));
            }
            return Integer.compare(a.size(), b.size());
        });
        String[] out = new String[bundles.size()];
        for (int i = 0; i < out.length; i++) {
            StringBuilder sb = new StringBuilder("[");
            for (int j = 0; j < bundles.get(i).size(); j++) {
                if (j > 0) sb.append(',');
                sb.append(bundles.get(i).get(j));
            }
            out[i] = sb.append(']').toString();
        }
        return out;
    }

    private void explore(int remaining, List<Integer> picked) {
        if (remaining == 0) {
            List<Integer> bundle = new ArrayList<>(picked);
            Collections.sort(bundle);
            found.add(bundle);
            return;
        }
        for (int value : values) {
            if (value <= remaining) {
                picked.add(value);
                explore(remaining - value, picked);
                picked.remove(picked.size() - 1);
            }
        }
    }
}`,
        },
        timeComplexity:
          "Exponential in the number of orderings, far above the number of answers",
        spaceComplexity: "O(answers · total)",
        edgeCases: ["No bundle exists, so the set stays empty."],
        commonMistakes: ["Counting 2+3 and 3+2 as different bundles."],
      },
      {
        title: "Optimal: non-decreasing backtracking with pruning",
        order: 2,
        intuition:
          "Build each bundle in non-decreasing order. That gives every multiset exactly one construction path, so there is nothing to deduplicate. With the values sorted, the loop can stop at the first value that overshoots what remains, and because smaller values are tried first, bundles emerge in lexicographic order.",
        approach: [
          "Sort the values.",
          "build(start, remaining): if remaining is 0, record the current bundle.",
          "For i from start onward: if values[i] exceeds remaining, stop the loop.",
          "Otherwise append values[i], call build(i, remaining − values[i]) — the same i, because reuse is allowed — then pop.",
        ],
        code: {
          PYTHON: `def exactBundles(values: List[int], total: int) -> List[str]:
    ordered = sorted(values)
    bundles = []
    picked = []

    def build(start: int, remaining: int) -> None:
        if remaining == 0:
            bundles.append("[" + ",".join(map(str, picked)) + "]")
            return
        for i in range(start, len(ordered)):
            if ordered[i] > remaining:
                break  # sorted: every later value overshoots too
            picked.append(ordered[i])
            build(i, remaining - ordered[i])  # i, not i + 1: reuse allowed
            picked.pop()

    build(0, total)
    return bundles`,
          JAVA: `class Solution {
    private int[] ordered;
    private final List<Integer> picked = new ArrayList<>();
    private final List<String> bundles = new ArrayList<>();

    public String[] exactBundles(int[] values, int total) {
        ordered = values.clone();
        Arrays.sort(ordered);
        build(0, total);
        return bundles.toArray(new String[0]);
    }

    private void build(int start, int remaining) {
        if (remaining == 0) {
            StringBuilder sb = new StringBuilder("[");
            for (int j = 0; j < picked.size(); j++) {
                if (j > 0) sb.append(',');
                sb.append(picked.get(j));
            }
            bundles.add(sb.append(']').toString());
            return;
        }
        for (int i = start; i < ordered.length; i++) {
            if (ordered[i] > remaining) break;
            picked.add(ordered[i]);
            build(i, remaining - ordered[i]);
            picked.remove(picked.size() - 1);
        }
    }
}`,
        },
        timeComplexity:
          "Proportional to the size of the pruned search tree, roughly answers · total / min(values)",
        spaceComplexity: "O(total / min(values)) recursion depth",
        edgeCases: [
          "No bundle reaches the total, so the output is just 0.",
          "A single value that divides the total.",
        ],
        commonMistakes: [
          "Recursing with i + 1, which forbids reusing a denomination.",
          "Using continue instead of break after an overshoot — correct, but it throws away the pruning.",
          "Forgetting to sort, so the break stops too early and misses bundles.",
        ],
      },
    ],
    expectedTime: "O(answers · total)",
    expectedSpace: "O(total)",
  },

  {
    slug: "rooftop-beacons",
    title: "Rooftop Beacons",
    difficulty: "HARD",
    learningObjective:
      "Prune a placement search with constant-time conflict checks by indexing columns and both diagonal directions.",
    topics: ["backtracking"],
    patterns: ["backtracking"],
    statement: [
      rich(
        "A city block is laid out as an ",
        { code: "n × n" },
        " grid of rooftops. Engineers must mount exactly ",
        { code: "n" },
        " laser beacons, one per rooftop at most, so that no two beacons can see each other. A beacon sees along its row, its column and both diagonals, any distance away."
      ),
      para("Return how many different layouts satisfy the rule."),
      example(
        "n = 4",
        "2",
        [
          {
            state: "row 0 → col 0",
            note: "row 1 can use col 2 or 3; both dead-end later",
          },
          {
            state: "row 0 → col 1",
            note: "forces col 3, then col 0, then col 2: a layout",
          },
          { state: "row 0 → col 2", note: "the mirror image: cols 2, 0, 3, 1" },
          { state: "row 0 → col 3", note: "dead-ends, like col 0" },
        ],
        "Placing row by row"
      ),
    ],
    constraints: ["1 ≤ n ≤ 10"],
    signature: {
      params: ["int"],
      paramNames: ["n"],
      returns: "int",
      functionName: "countBeaconLayouts",
    },
    tests: [
      {
        input: "4",
        expected: "2",
        isSample: true,
        explanation: "Two layouts work: columns 1,3,0,2 and 2,0,3,1 by row.",
      },
      {
        input: "1",
        expected: "1",
        isSample: true,
        explanation: "A single rooftop holds the single beacon.",
      },
      { input: "2", expected: "0" },
      { input: "3", expected: "0" },
      { input: "5", expected: "10" },
      { input: "6", expected: "4" },
      { input: "7", expected: "40" },
      { input: "8", expected: "92" },
      { input: "9", expected: "352" },
      { input: "10", expected: "724" },
    ],
    hints: [
      "Two beacons in one row would see each other, so every row holds exactly one beacon.",
      "Place them row by row. For each row you only choose a column.",
      "A square's diagonals are identified by row − col and row + col. Two squares share a diagonal exactly when one of those values matches.",
      "Keep three sets of occupied lines — columns, row − col and row + col — so checking a square is O(1), and undo the marks when you backtrack.",
    ],
    solutions: [
      {
        title: "Try every column order, then check diagonals",
        order: 1,
        intuition:
          "One beacon per row and per column means a layout is a permutation: row r uses column p[r]. Generate all n! permutations and keep those where no two beacons share a diagonal. Correct, but it builds complete layouts that were doomed by their second row.",
        approach: [
          "For every permutation p of the columns 0..n − 1, compute r − p[r] and r + p[r] for each row.",
          "The layout is safe when both collections contain n distinct values.",
          "Count the safe layouts.",
        ],
        code: {
          PYTHON: `from itertools import permutations


def countBeaconLayouts(n: int) -> int:
    count = 0
    for cols in permutations(range(n)):
        down = {r - cols[r] for r in range(n)}
        up = {r + cols[r] for r in range(n)}
        if len(down) == n and len(up) == n:
            count += 1
    return count`,
          JAVA: `class Solution {
    private int n, count;
    private int[] cols;
    private boolean[] used;

    public int countBeaconLayouts(int n) {
        this.n = n;
        cols = new int[n];
        used = new boolean[n];
        count = 0;
        permute(0);
        return count;
    }

    // Build every column order, and check the diagonals only once it is complete.
    private void permute(int row) {
        if (row == n) {
            Set<Integer> down = new HashSet<>(), up = new HashSet<>();
            for (int r = 0; r < n; r++) {
                down.add(r - cols[r]);
                up.add(r + cols[r]);
            }
            if (down.size() == n && up.size() == n) count++;
            return;
        }
        for (int c = 0; c < n; c++) {
            if (used[c]) continue;
            used[c] = true;
            cols[row] = c;
            permute(row + 1);
            used[c] = false;
        }
    }
}`,
        },
        timeComplexity: "O(n! · n)",
        spaceComplexity: "O(n)",
        edgeCases: ["n = 1 has one layout; n = 2 and n = 3 have none."],
        commonMistakes: ["Checking only one diagonal direction."],
      },
      {
        title: "Optimal: row-by-row backtracking with occupied lines",
        order: 2,
        intuition:
          "Place one beacon per row, and refuse any square on a column or diagonal already in use. Columns are indexed by col, one diagonal direction by row − col (constant along it) and the other by row + col. Three boolean arrays answer the conflict question in O(1), and a conflict cuts off the entire subtree beneath it.",
        approach: [
          "Keep boolean arrays for columns, row − col + n, and row + col.",
          "place(row): if row equals n, one complete layout has been found — return 1.",
          "For each column, skip it if any of its three lines is taken.",
          "Otherwise mark the three lines, add place(row + 1) to the count, and unmark them.",
        ],
        code: {
          PYTHON: `def countBeaconLayouts(n: int) -> int:
    col_taken = [False] * n
    down_taken = [False] * (2 * n)  # indexed by row - col + n
    up_taken = [False] * (2 * n)    # indexed by row + col

    def place(row: int) -> int:
        if row == n:
            return 1
        layouts = 0
        for col in range(n):
            down, up = row - col + n, row + col
            if col_taken[col] or down_taken[down] or up_taken[up]:
                continue
            col_taken[col] = down_taken[down] = up_taken[up] = True
            layouts += place(row + 1)
            col_taken[col] = down_taken[down] = up_taken[up] = False
        return layouts

    return place(0)`,
          JAVA: `class Solution {
    private int n;
    private boolean[] colTaken, downTaken, upTaken;

    public int countBeaconLayouts(int n) {
        this.n = n;
        colTaken = new boolean[n];
        downTaken = new boolean[2 * n];
        upTaken = new boolean[2 * n];
        return place(0);
    }

    private int place(int row) {
        if (row == n) return 1;
        int layouts = 0;
        for (int col = 0; col < n; col++) {
            int down = row - col + n, up = row + col;
            if (colTaken[col] || downTaken[down] || upTaken[up]) continue;
            colTaken[col] = downTaken[down] = upTaken[up] = true;
            layouts += place(row + 1);
            colTaken[col] = downTaken[down] = upTaken[up] = false;
        }
        return layouts;
    }
}`,
        },
        timeComplexity:
          "O(n!) in the worst case, far less in practice because of pruning",
        spaceComplexity: "O(n)",
        edgeCases: [
          "n = 1: one layout.",
          "n = 2 and n = 3: no layout exists, so the answer is 0.",
          "n = 10: 724 layouts, still fast with pruning.",
        ],
        commonMistakes: [
          "Indexing row − col directly, which goes negative; offset it by n.",
          "Forgetting to clear the marks after the recursive call.",
          "Counting rotations or reflections as the same layout — they are different layouts here.",
        ],
      },
    ],
    expectedTime: "O(n!)",
    expectedSpace: "O(n)",
  },

  {
    slug: "letter-grid-trail",
    title: "Letter Grid Trail",
    difficulty: "MEDIUM",
    learningObjective:
      "Search a grid depth-first while marking the current path in place, and prune impossible searches before they start.",
    topics: ["backtracking"],
    patterns: ["backtracking", "depth-first-search"],
    statement: [
      para(
        "A puzzle magazine prints a rectangular grid of capital letters. A word is hidden in the grid if you can trace it by moving from a letter to a horizontally or vertically adjacent letter, one step per character, never using the same cell twice."
      ),
      rich(
        "Each row of the grid is given as a string in ",
        { code: "grid" },
        ". Return ",
        { code: "true" },
        " if ",
        { code: "word" },
        " can be traced, otherwise ",
        { code: "false" },
        "."
      ),
      example(
        'grid = ["CAT", "ORE"], word = "CORE"',
        "true",
        [
          { state: "(0,0) C", note: "the only C — start here" },
          { state: "(1,0) O", note: "down" },
          { state: "(1,1) R", note: "right" },
          { state: "(1,2) E", note: "right — the whole word is traced" },
        ],
        "Tracing CORE"
      ),
    ],
    constraints: [
      "1 ≤ rows, columns ≤ 6; every row has the same length",
      "1 ≤ word.length ≤ 36",
      "grid and word contain only uppercase English letters.",
    ],
    signature: {
      params: ["string[]", "string"],
      paramNames: ["grid", "word"],
      returns: "bool",
      functionName: "canTraceWord",
    },
    tests: [
      {
        input: "2\nCAT\nORE\nCORE",
        expected: "true",
        isSample: true,
        explanation:
          "C (0,0) → O (1,0) → R (1,1) → E (1,2), each move to a side neighbour.",
      },
      {
        input: "1\nABA\nABAB",
        expected: "false",
        isSample: true,
        explanation:
          "The word needs a second B, but the grid has only one and a cell cannot be reused.",
      },
      { input: "1\nA\nA", expected: "true" },
      { input: "1\nA\nB", expected: "false" },
      { input: "2\nAB\nCD\nABDC", expected: "true" },
      { input: "2\nAB\nCD\nACDB", expected: "true" },
      { input: "2\nAB\nCD\nAD", expected: "false" },
      { input: "3\nSEAS\nTEAT\nSEAS\nSEATS", expected: "false" },
      { input: "3\nABCE\nSFCS\nADEE\nSEEDFS", expected: "true" },
      { input: "3\nABCE\nSFCS\nADEE\nABCCF", expected: "true" },
      {
        input: "6\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAAAAAAAB",
        expected: "false",
      },
      {
        input: "6\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAB\nBAAAAAAAAAAAAAA",
        expected: "true",
      },
      {
        input:
          "6\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAA\nAAAAAB\nAAAAAAAAAAAAAAAAAAAAC",
        expected: "false",
      },
      { input: "4\nXYZW\nWZYX\nXYZW\nWZYX\nXYZWXYZWXYZWXYZW", expected: "true" },
    ],
    hints: [
      "Any cell matching the first letter could be the start. Try each.",
      "From a cell matching word[i], try each neighbour as word[i + 1]. That is a depth-first search.",
      "A cell on the current path must not be reused. Overwrite it with a marker while you are exploring from it, and restore it before returning.",
      "If the grid simply does not contain enough of some letter, no search can succeed — check counts first.",
    ],
    solutions: [
      {
        title: "Depth-first search with a visited set",
        order: 1,
        intuition:
          "From every starting cell, walk outward letter by letter, carrying the set of cells already on the path. It is correct, but each step copies the set, and nothing stops a hopeless search from exploring every winding path of repeated letters.",
        approach: [
          "For each cell, call trace(r, c, 0, empty set).",
          "trace fails if the cell's letter is not word[i]; it succeeds if i is the last index.",
          "Otherwise add the cell to a copy of the set and try each unvisited in-bounds neighbour with i + 1.",
        ],
        code: {
          PYTHON: `def canTraceWord(grid: List[str], word: str) -> bool:
    rows, cols = len(grid), len(grid[0])

    def trace(r: int, c: int, i: int, seen: frozenset) -> bool:
        if grid[r][c] != word[i]:
            return False
        if i == len(word) - 1:
            return True
        seen = seen | {(r, c)}
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen:
                if trace(nr, nc, i + 1, seen):
                    return True
        return False

    return any(trace(r, c, 0, frozenset()) for r in range(rows) for c in range(cols))`,
          JAVA: `class Solution {
    private String[] grid;
    private String word;
    private int rows, cols;

    public boolean canTraceWord(String[] grid, String word) {
        this.grid = grid;
        this.word = word;
        rows = grid.length;
        cols = grid[0].length();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (trace(r, c, 0, new HashSet<>())) return true;
            }
        }
        return false;
    }

    private boolean trace(int r, int c, int i, Set<Integer> seen) {
        if (grid[r].charAt(c) != word.charAt(i)) return false;
        if (i == word.length() - 1) return true;
        Set<Integer> path = new HashSet<>(seen); // copy, as the Python version does
        path.add(r * cols + c);
        int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int[] m : moves) {
            int nr = r + m[0], nc = c + m[1];
            if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !path.contains(nr * cols + nc)) {
                if (trace(nr, nc, i + 1, path)) return true;
            }
        }
        return false;
    }
}`,
        },
        timeComplexity: "O(cells · 3ᴸ · L) — each step copies the path set",
        spaceComplexity: "O(L²)",
        edgeCases: ["A one-letter word."],
        commonMistakes: ["Allowing diagonal moves."],
      },
      {
        title: "Optimal: in-place marking with letter-count pruning",
        order: 2,
        intuition:
          "The current path can live in the grid itself: overwrite a cell with '#' while exploring from it, and restore it afterwards. Before searching at all, compare letter counts — if the word needs three Bs and the grid has two, answer immediately. And if the word's first letter is far more common than its last, search for the reversed word instead so fewer starts survive.",
        approach: [
          "If the word is longer than the grid has cells, or any letter is needed more often than the grid holds it, return false.",
          "If the first letter is more common in the grid than the last, reverse the word.",
          "trace(r, c, i): fail on a mismatch, succeed at the last index.",
          "Mark the cell, try the four neighbours with i + 1, restore the cell, and report whether any neighbour succeeded.",
          "Return true if a trace from any cell succeeds.",
        ],
        code: {
          PYTHON: `from collections import Counter


def canTraceWord(grid: List[str], word: str) -> bool:
    rows, cols = len(grid), len(grid[0])
    if len(word) > rows * cols:
        return False

    have = Counter("".join(grid))
    for letter, needed in Counter(word).items():
        if have[letter] < needed:
            return False  # not enough of this letter anywhere
    if have[word[0]] > have[word[-1]]:
        word = word[::-1]  # start from the rarer end

    board = [list(row) for row in grid]

    def trace(r: int, c: int, i: int) -> bool:
        if board[r][c] != word[i]:
            return False
        if i == len(word) - 1:
            return True
        letter = board[r][c]
        board[r][c] = "#"  # on the current path
        found = False
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and trace(nr, nc, i + 1):
                found = True
                break
        board[r][c] = letter  # leave the path
        return found

    for r in range(rows):
        for c in range(cols):
            if trace(r, c, 0):
                return True
    return False`,
          JAVA: `class Solution {
    private char[][] board;
    private String word;
    private int rows, cols;

    public boolean canTraceWord(String[] grid, String word) {
        rows = grid.length;
        cols = grid[0].length();
        if (word.length() > rows * cols) return false;

        int[] have = new int[128];
        int[] need = new int[128];
        for (String row : grid) for (char ch : row.toCharArray()) have[ch]++;
        for (char ch : word.toCharArray()) need[ch]++;
        for (int ch = 0; ch < 128; ch++) if (need[ch] > have[ch]) return false;
        if (have[word.charAt(0)] > have[word.charAt(word.length() - 1)]) {
            word = new StringBuilder(word).reverse().toString();
        }

        this.word = word;
        board = new char[rows][];
        for (int r = 0; r < rows; r++) board[r] = grid[r].toCharArray();

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (trace(r, c, 0)) return true;
            }
        }
        return false;
    }

    private boolean trace(int r, int c, int i) {
        if (r < 0 || r >= rows || c < 0 || c >= cols || board[r][c] != word.charAt(i)) return false;
        if (i == word.length() - 1) return true;
        char letter = board[r][c];
        board[r][c] = '#';
        boolean found = trace(r + 1, c, i + 1) || trace(r - 1, c, i + 1)
            || trace(r, c + 1, i + 1) || trace(r, c - 1, i + 1);
        board[r][c] = letter;
        return found;
    }
}`,
        },
        timeComplexity:
          "O(cells · 3ᴸ) worst case; the count check removes the classic blow-ups",
        spaceComplexity: "O(L) recursion depth plus a copy of the grid",
        edgeCases: [
          "A word longer than the number of cells.",
          "A grid of nearly identical letters with one missing letter at the end of the word.",
          "A word that would need the same cell twice, such as ABAB in a grid with one B.",
        ],
        commonMistakes: [
          "Returning from inside the loop before restoring the cell, which corrupts later searches.",
          "Marking the cell before checking that it matches.",
          "Allowing a cell to be revisited because the visited marker is never set.",
        ],
      },
    ],
    expectedTime: "O(cells · 3ᴸ)",
    expectedSpace: "O(L)",
  },

  {
    slug: "mirror-cuts",
    title: "Mirror Cuts",
    difficulty: "MEDIUM",
    learningObjective:
      "Recognise when a backtracking count revisits the same suffix repeatedly, and collapse it into a table indexed by start position.",
    topics: ["backtracking", "dynamic-programming"],
    patterns: ["backtracking", "dynamic-programming"],
    statement: [
      para(
        "A sign maker cuts a strip of letters into pieces. Every piece must read the same forwards and backwards — a palindrome — so it can be mounted on a glass door and read from either side."
      ),
      rich(
        "Return how many different ways the string ",
        { code: "s" },
        " can be cut so that every piece is a palindrome. Two ways differ if they cut at different positions. Not cutting at all counts as one way when the whole string is a palindrome."
      ),
      example(
        's = "noon"',
        "3",
        [
          { state: "n | o | o | n", note: "single letters are always palindromes" },
          { state: "n | oo | n", note: "the middle pair mirrors" },
          { state: "noon", note: "the whole strip mirrors" },
        ],
        "Every palindromic cutting of noon"
      ),
    ],
    constraints: [
      "1 ≤ s.length ≤ 30",
      "s contains only lowercase English letters.",
      "The answer fits in a 32-bit signed integer.",
    ],
    signature: {
      params: ["string"],
      paramNames: ["s"],
      returns: "int",
      functionName: "countMirrorCuts",
    },
    tests: [
      { input: "aab", expected: "2", isSample: true, explanation: "a|a|b and aa|b." },
      {
        input: "noon",
        expected: "3",
        isSample: true,
        explanation: "n|o|o|n, n|oo|n and noon.",
      },
      { input: "z", expected: "1" },
      { input: "ab", expected: "1" },
      { input: "aaa", expected: "4" },
      { input: "abcba", expected: "3" },
      { input: "racecar", expected: "4" },
      { input: "abababab", expected: "21" },
      { input: "aabbaabbaa", expected: "59" },
      { input: "aaaaaaaaaaaaaaaaaaaaaaaaaaaaaa", expected: "536870912" },
      { input: "abaabaabaabaabaabaabaabaabaaba", expected: "332802" },
      { input: "babbaaaaaaaabbbbaaaabaaaabaaab", expected: "2320041" },
      { input: "aabaabaabbaabaabbabaab", expected: "6346" },
    ],
    hints: [
      "Decide the first piece: it is s[0..j] for some j, and it must be a palindrome. Then the rest is the same problem on a shorter string.",
      "That recursion is correct but slow on strings like aaaa…a, where the count doubles with every letter.",
      "The rest of the problem is fully described by where it starts. How many distinct starting positions are there?",
      "Let ways[i] be the count for the suffix starting at i, with ways[n] = 1. Precompute which ranges are palindromes so each check is O(1).",
    ],
    solutions: [
      {
        title: "Backtracking over the first piece",
        order: 1,
        intuition:
          "Choose a palindromic first piece, then count cuttings of what remains. Every cutting corresponds to one root-to-leaf path, so the running time is proportional to the answer — which can be 2²⁹ for a string of thirty identical letters.",
        approach: [
          "count(start): if start reaches the end, one complete cutting has been formed.",
          "For each end from start onward, if s[start..end] is a palindrome, add count(end + 1).",
          "Return count(0).",
        ],
        code: {
          PYTHON: `def countMirrorCuts(s: str) -> int:
    def count(start: int) -> int:
        if start == len(s):
            return 1
        total = 0
        for end in range(start, len(s)):
            piece = s[start:end + 1]
            if piece == piece[::-1]:
                total += count(end + 1)
        return total

    return count(0)`,
          JAVA: `class Solution {
    private String s;

    public int countMirrorCuts(String s) {
        this.s = s;
        return count(0);
    }

    private int count(int start) {
        if (start == s.length()) return 1;
        int total = 0;
        for (int end = start; end < s.length(); end++) {
            if (isMirror(start, end)) total += count(end + 1);
        }
        return total;
    }

    private boolean isMirror(int i, int j) {
        while (i < j) if (s.charAt(i++) != s.charAt(j--)) return false;
        return true;
    }
}`,
        },
        timeComplexity: "O(answer · n) — exponential for repetitive strings",
        spaceComplexity: "O(n) recursion depth",
        edgeCases: ["A single letter: one way."],
        commonMistakes: ["Returning 0 instead of 1 when start reaches the end."],
      },
      {
        title: "Optimal: count suffixes with a palindrome table",
        order: 2,
        intuition:
          "The backtracking calls count(start) again and again for the same start. There are only n + 1 distinct starts, so compute each once from the right: ways[i] sums ways[j + 1] over every j where s[i..j] is a palindrome. A second table, built from the inside out, answers is-palindrome in O(1): s[i..j] mirrors when its end letters match and s[i+1..j−1] mirrors.",
        approach: [
          "Build mirror[i][j] for i from n − 1 down to 0 and j from i up: true when s[i] == s[j] and (j − i < 2 or mirror[i + 1][j − 1]).",
          "Set ways[n] = 1.",
          "For i from n − 1 down to 0, ways[i] is the sum of ways[j + 1] over every j with mirror[i][j].",
          "Return ways[0].",
        ],
        code: {
          PYTHON: `def countMirrorCuts(s: str) -> int:
    n = len(s)
    mirror = [[False] * n for _ in range(n)]
    for i in range(n - 1, -1, -1):
        for j in range(i, n):
            # Ends match, and the inside (if any) already mirrors.
            mirror[i][j] = s[i] == s[j] and (j - i < 2 or mirror[i + 1][j - 1])

    ways = [0] * (n + 1)
    ways[n] = 1  # the empty suffix has exactly one cutting
    for i in range(n - 1, -1, -1):
        for j in range(i, n):
            if mirror[i][j]:
                ways[i] += ways[j + 1]

    return ways[0]`,
          JAVA: `class Solution {
    public int countMirrorCuts(String s) {
        int n = s.length();
        boolean[][] mirror = new boolean[n][n];
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                mirror[i][j] = s.charAt(i) == s.charAt(j) && (j - i < 2 || mirror[i + 1][j - 1]);
            }
        }

        int[] ways = new int[n + 1];
        ways[n] = 1;
        for (int i = n - 1; i >= 0; i--) {
            for (int j = i; j < n; j++) {
                if (mirror[i][j]) ways[i] += ways[j + 1];
            }
        }
        return ways[0];
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n²)",
        edgeCases: [
          "Thirty identical letters, where every cut position is free: 2²⁹ ways.",
          "A string with no repeated neighbours, where only the all-single-letters cutting works.",
        ],
        commonMistakes: [
          "Filling the palindrome table with i increasing, so mirror[i + 1][j − 1] is read before it is computed.",
          "Forgetting ways[n] = 1, which makes every count zero.",
        ],
      },
    ],
    expectedTime: "O(n²)",
    expectedSpace: "O(n²)",
  },

  // ---------------------------------------------------------------------------
  // Binary search on the answer, and peaks
  // ---------------------------------------------------------------------------
  {
    slug: "summit-marker",
    title: "Summit Marker",
    difficulty: "EASY",
    learningObjective:
      "Binary search on the direction of the slope rather than on a target value.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A hiking trail has elevation markers at regular intervals. The trail is strictly unimodal: it climbs strictly to a single highest marker and then descends strictly to the end. Either the climb or the descent may be empty."
      ),
      rich("Return the index of the highest marker in ", { code: "heights" }, "."),
      example(
        "heights = [2, 5, 9, 7, 1]",
        "2",
        [
          {
            state: "lo = 0, hi = 4, mid = 2",
            note: "9 > 7: descending at mid, summit is at mid or left",
          },
          {
            state: "lo = 0, hi = 2, mid = 1",
            note: "5 < 9: climbing at mid, summit is right of mid",
          },
          { state: "lo = 2, hi = 2", note: "one candidate left: index 2" },
        ],
        "Following the slope"
      ),
    ],
    constraints: [
      "1 ≤ heights.length ≤ 100000",
      "-1000000 ≤ heights[i] ≤ 1000000",
      "heights strictly increases up to the summit and strictly decreases after it.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["heights"],
      returns: "int",
      functionName: "summitIndex",
    },
    tests: [
      {
        input: "2 5 9 7 1",
        expected: "2",
        isSample: true,
        explanation: "The trail climbs to 9 at index 2, then falls.",
      },
      {
        input: "8 6 3",
        expected: "0",
        isSample: true,
        explanation: "The trail only descends, so the very first marker is the summit.",
      },
      { input: "4", expected: "0" },
      { input: "1 2", expected: "1" },
      { input: "2 1", expected: "0" },
      { input: "1 3 5 7 9", expected: "4" },
      { input: "-5 0 3 2 -1 -8", expected: "2" },
      { input: "0 10 20 30 40 50 60 59", expected: "6" },
      {
        input:
          "-997885 -995604 -993300 -988203 -985118 -983693 -981145 -977069 -976922 -974072 -971959 -971815 -967359 -962983 -962570 -960110 -958706 -957240 -954731 -954594 -954580 -953908 -953418 -952873 -952789 -951073 -950785 -950068 -949980 -949082 -948444 -948429 -948396 -947897 -947259 -945619 -945606 -945071 -943140 -938570 -938237 -938124 -933844 -931360 -930882 -930345 -929444 -927864 -927853 -927476 -926270 -923457 -920643 -919859 -919722 -918904 -918797 -917787 -917218 -916086 -915425 -914849 -910059 -909042 -907300 -907201 -903412 -902381 -900844 -900666 -898233 -896858 -895965 -891807 -891763 -889589 -889587 -888544 -888410 -888342 -884687 -880467 -878182 -875442 -873249 -870546 -869147 -867004 -866546 -865761 -864164 -862270 -860736 -851398 -849857 -848497 -841506 -841215 -840323 -836815 -835066 -834567 -832151 -831000 -827275 -826700 -822893 -822622 -822448 -820972 -819776 -818745 -814320 -813887 -810724 -810034 -809245 -808935 -804977 -803388 -801607 -798947 -798899 -798795 -795555 -794106 -793291 -786149 -784626 -779801 -779661 -779205 -777279 -776123 -774705 -774270 -771201 -769736 -768024 -767443 -767039 -766526 -765923 -764998 -764562 -761788 -760569 -756007 -755954 -753287 -753200 -752753 -752746 -751940 -751176 -750222 -748963 -743461 -741937 -741052 -740024 -739048 -733998 -733250 -730525 -728303 -726316 -725777 -725329 -724580 -724251 -724057 -723751 -723507 -723500 -722548 -721374 -720426 -719450 -713847 -712571 -712563 -712521 -712142 -711966 -711157 -709320 -709305 -708192 -705696 -704271 -702530 -691736 -690032 -689356 -686998 -685144 -683449 -683114 -682228 -679984 -678766 -674082 -670389 -667504 -661509 -661182 -657586 -652418 -643015 -638470 -638330 -633745 -633350 -632246 -630630 -630451 -628723 -628347 -626679 -626027 -625568 -625344 -620350 -619154 -617565 -612753 -612489 -607914 -607697 -607468 -604110 -599730 -599214 -596238 -594978 -593884 -593628 -593530 -592234 -591321 -586494 -584535 -581601 -578455 -577667 -576334 -574259 -573725 -573349 -571868 -569716 -565871 -562347 -557825 -557600 -554902 -553546 -551815 -550835 -550242 -548882 -547619 -547327 -546953 -546024 -545747 -545375 -544786 -542630 -542095 -540986 -540287 -538356 -537369 -535570 -535011 -532359 -531687 -527606 -527365 -523901 -511015 -508899 -507501 -506857 -506722 -503456 -503008 -502541 -502336 -500157 -498706 -498415 -497468 -497184 -496965 -492291 -490735 -489736 -488999 -482559 -482116 -481865 -480111 -479938 -479385 -479031 -476728 -476443 -475500 -474730 -473803 -472753 -472100 -471893 -466277 -463476 -459968 -459326 -459205 -454327 -454261 -454254 -452880 -451601 -451289 -450395 -450087 -448734 -444638 -443301 -440163 -439237 -438633 -432226 -429554 -429247 -425221 -421031 -418090 -415931 -409927 -409179 -406240 -405366 -402063 -398857 -397285 -396754 -396145 -394146 -393941 -393386 -390956 -383906 -380187 -379528 -376227 -375998 -375077 -373089 -372141 -368276 -366325 -364378 -362800 -361885 -360877 -356534 -355095 -353887 -353370 -349830 -342911 -341311 -336105 -336044 -335153 -332944 -332386 -331082 -330807 -330729 -329010 -328269 -327965 -327059 -322287 -321882 -318724 -318436 -315954 -313224 -308629 -307771 -302665 -294714 -292324 -284653 -283247 -281018 -278701 -278452 -278063 -276565 -275801 -275601 -274358 -272164 -272064 -272009 -271654 -271484 -269986 -268612 -268346 -266782 -266039 -265293 -263586 -261103 -259713 -256955 -253427 -251066 -250903 -243515 -242349 -241864 -240596 -240049 -236294 -235488 -234707 -234393 -233728 -233004 -232502 -232445 -230036 -229555 -229224 -226170 -221479 -221400 -217535 -216331 -214789 -214222 -213706 -213301 -212917 -210617 -210135 -206168 -206066 -205759 -205042 -204170 -203076 -198734 -197228 -195750 -189008 -188782 -187848 -187812 -186821 -185841 -184583 -184505 -182386 -181133 -179443 -179323 -179208 -178886 -178004 -177187 -176921 -174466 -171307 -168899 -168181 -167294 -163641 -163278 -162570 -159275 -157901 -156861 -151781 -150011 -149676 -147923 -147636 -147172 -146529 -144678 -143675 -142579 -140905 -140778 -139922 -139405 -138631 -135814 -133701 -130547 -130053 -125297 -119325 -118679 -117233 -117168 -114158 -113930 -112689 -111584 -110220 -108041 -107588 -105920 -104885 -104060 -102950 -101451 -98586 -97897 -95174 -95054 -94288 -94208 -92375 -91842 -91324 -90389 -88866 -88347 -87790 -86243 -84853 -79560 -79256 -78659 -78421 -74520 -74184 -72701 -69046 -68413 -63459 -62582 -61410 -59877 -58625 -57459 -56572 -53874 -53169 -50970 -50934 -50665 -50190 -44689 -44248 -41867 -39914 -38847 -38494 -33466 -30447 -27196 -26600 -26565 -26281 -25442 -24755 -24260 -23956 -23170 -22708 -22349 -21978 -18908 -15728 -13769 -12348 -12191 -12105 -10481 -7604 -6387 -4203 -2882 -1609 -378 2344 3737 4527 5080 10380 11251 12749 13036 13471 15411 17233 17910 18578 19086 20062 20767 21589 22928 23235 27959 29608 29975 29991 32742 32887 32903 35631 37913 38177 40683 42857 42914 44539 45671 46170 46747 47321 48826 49265 51652 52269 53867 55258 55426 55430 56915 58156 59447 59775 60064 60637 61613 61863 64451 70242 70448 71258 75092 75893 77225 77691 77972 80703 80749 80754 81951 82807 83611 87337 89505 90033 91955 93989 95897 96351 97309 100607 101876 103675 104685 105523 109080 110774 111293 111662 112939 115351 116999 117926 118100 118285 119192 124249 125308 126048 128175 128368 128551 128621 131322 131532 135344 135485 137993 138546 140946 143356 144305 146006 147399 148243 152717 152868 153295 154369 159769 162533 165452 166195 167638 168782 169491 169615 170195 170771 171016 171734 174303 174803 174967 176016 177021 177771 178611 179422 179434 180634 183940 184295 185283 186265 188156 189138 190089 193489 195210 195371 195966 198093 202362 206941 208029 210473 211010 212183 212323 213607 213924 214948 217714 223703 224708 226482 228883 230095 230097 230617 232422 236411 237305 237350 238245 238518 241436 242036 243538 246232 246778 246787 249473 250473 257075 257258 257536 259491 261856 262543 264164 265285 267395 274492 280685 282978 283699 284087 284838 286372 287175 288384 289609 298203 303377 305386 305651 307645 307873 315642 315795 320759 321911 322448 322597 323293 324459 328560 331143 331469 332675 334317 335144 336691 338521 339033 339980 340690 341537 342789 343288 343972 347509 348314 348446 349095 349140 350091 350647 352455 353446 357843 358824 358960 359166 370591 373789 375548 376230 377036 377231 377745 378293 379217 380218 382104 382868 384120 387524 391093 391777 391918 392521 394248 395167 395247 395267 396414 398816 403581 405057 407281 407956 409262 409946 410428 414581 416019 416968 420299 424788 431634 432356 436154 437312 438978 445522 449238 449377 449486 450238 450495 452047 452208 452866 457074 458530 461752 464891 465328 465934 466734 467542 469869 470358 470483 471641 472212 478451 480182 481255 486053 487551 488553 489840 489860 490696 491023 492967 494663 494683 497519 500772 500815 501564 502646 504636 506537 507993 508521 510595 511757 512353 514390 514524 514880 516349 519212 519303 519418 519619 520262 521133 528051 528209 528320 528802 530490 530634 533972 536186 542323 542523 545116 546679 546724 547574 549223 553391 555381 563390 563700 565168 565302 565613 567593 570056 570090 570163 570308 570935 571981 575258 576843 577746 579423 580279 580889 580892 580897 582044 584789 584945 592143 592214 592422 592979 596618 596889 597389 599171 600764 602301 604298 607183 611358 612077 613367 615581 617320 619028 620363 621054 621249 623681 625624 626196 626387 626703 627084 627162 628102 628623 629343 629851 630935 634129 635753 636294 640795 642990 645422 646613 646987 647081 653166 656236 658519 659702 660215 660594 660694 661851 666325 666681 667732 675301 676584 677399 678575 679600 680580 683922 686851 691594 692376 692732 694967 697026 697769 701241 701813 702025 702680 703048 704973 707233 708512 708956 713607 713625 714804 716780 718057 719270 720032 722861 724462 725663 727367 727585 728262 735398 736080 736292 736408 739305 739376 740618 740825 741766 745177 749335 756241 757501 759160 759890 760593 764480 765387 769332 769478 770461 772053 772291 773003 775055 775121 778388 778535 781304 781776 781973 782661 783421 785644 786482 788411 788854 789490 790325 790354 791623 791935 793733 795697 797950 806195 807223 813831 813966 814866 816699 820369 821211 824389 826002 826816 827524 828072 828426 831154 833833 834200 837392 838290 839682 840559 842331 842875 845530 845912 847275 848804 850648 850881 853836 854377 856342 857007 857008 857435 858967 862422 862750 863406 864316 864820 866271 867130 868987 869440 869704 870919 872755 874010 875066 876899 879658 880057 884379 885459 890564 891541 892161 894824 896385 899137 900749 900808 902009 905818 905831 906017 910054 912242 912433 912659 924816 925131 926456 926790 927283 928020 930023 932006 933310 933930 934333 934421 935700 936383 936512 936672 936923 941723 943158 943316 943336 945489 946485 951444 952453 953627 954272 956411 956781 959431 961877 962725 964579 967146 969710 971485 972400 973212 973413 976009 976384 984273 984290 986499 987484 988065 988345 988394 994156 995342 998878 999777 999769 994626 994489 993262 991665 987580 984330 981297 978274 977495 975887 975345 974284 971268 965052 962787 962498 956722 954032 953079 952899 951227 949664 944675 943080 937856 932904 931830 931713 929110 927484 926245 921429 919364 917402 917010 916328 914077 913713 912377 910943 910815 910413 905203 904656 899465 897035 896520 887408 883112 880307 878972 877633 872507 872248 870868 870635 870336 870038 869457 867085 866207 863289 859765 857587 857132 855236 851462 849838 846761 843060 828708 827477 826307 821403 819622 816264 815205 809870 806172 801857 801819 799523 794778 794640 787868 784784 775087 774608 769264 768782 766846 757499 757144 755047 754064 751228 750456 748354 747734 747368 746390 745574 739363 739222 738763 738484 737106 735862 735507 720929 713749 712504 705171 705005 699925 690562 688429 681074 679283 676267 675080 672046 669810 666214 663196 655102 654381 651496 650409 645180 644969 640162 638076 638042 637818 632237 630141 629613 627844 623183 622234 621427 615392 614610 612503 606337 598789 590002 588565 588408 584935 581699 581014 577029 576198 575534 574208 573377 572883 572269 571299 566944 565212 560372 556586 554694 551038 550062 546978 546228 545134 544791 544065 534819 530854 522910 519303 512981 509382 501955 496397 495848 495016 491271 488513 488312 487130 485348 482611 480815 480150 479457 477734 476561 471429 470785 468830 467130 466451 464063 462602 461028 460843 460234 459862 459133 458383 456667 449541 448692 447978 445687 444730 444270 443387 431156 428763 425650 423782 421282 419442 418136 417929 412313 410747 402407 401529 399742 396580 388673 386804 386127 383036 381405 374666 371627 367167 366893 364197 361827 357812 353165 349850 349561 340015 337776 334541 332542 331695 325732 325515 321223 318767 316416 312133 311988 310819 308279 295321 294278 293496 293061 288332 281145 278168 267299 259845 250525 250364 244242 236986 233768 232860 231427 229673 225894 225146 224826 222545 220252 213372 213187 211354 210168 210087 209751 207299 204170 204092 202325 198616 197505 196467 195788 194470 189355 188109 187508 184450 183400 180329 179834 176829 172246 171033 168597 166990 166148 161047 157648 155074 154015 153805 151912 147624 146769 144617 143822 142955 142496 141247 129394 127519 126622 120157 116809 115561 115049 112599 112322 110750 110232 104614 104557 101238 95594 93457 87142 86752 85280 82162 81513 80990 80987 80822 78330 74381 66638 61943 60927 58689 54563 53094 49433 47835 47342 41114 41001 38069 37790 34880 33915 32425 28183 27240 23981 17102 14538 12408 11200 10310 9946 6717 2253 -5457 -6056 -6727 -20196 -23726 -24656 -26444 -29444 -29901 -30278 -37300 -38833 -41987 -47510 -48230 -50942 -56549 -56788 -65635 -66518 -69869 -71315 -75335 -81028 -81805 -82127 -87010 -91877 -92349 -95420 -96105 -101848 -108651 -112588 -113931 -119804 -121075 -123293 -124304 -125508 -131825 -134905 -139595 -139985 -145534 -145578 -160064 -165596 -170907 -171011 -171060 -173996 -184004 -187329 -189630 -195088 -196872 -199382 -203378 -209876 -211011 -220430 -221493 -223218 -223478 -229410 -235988 -236437 -238903 -241828 -242443 -242941 -249748 -250807 -253347 -260965 -262062 -264952 -269297 -270484 -271416 -272759 -281553 -283208 -283860 -284166 -289665 -293685 -294120 -295302 -296406 -296929 -300963 -303724 -305991 -307833 -309475 -311773 -312183 -315627 -316150 -320613 -320661 -320731 -321250 -323728 -325233 -325800 -326732 -329356 -330072 -332453 -336548 -338229 -338562 -338587 -339219 -339760 -339876 -348063 -354709 -355926 -358191 -359015 -360059 -360265 -361788 -365203 -368431 -368438 -370608 -380521 -380727 -380978 -381196 -382098 -383410 -384204 -386665 -387433 -387742 -388495 -389474 -394589 -397600 -404894 -406371 -407573 -410060 -412405 -413822 -416904 -418426 -420723 -421122 -425654 -426401 -428178 -429749 -432076 -435812 -442464 -446783 -447364 -448115 -448693 -453381 -460155 -461406 -463493 -466688 -467065 -469665 -470201 -473054 -475132 -482812 -483246 -484542 -484815 -485950 -488514 -490265 -498948 -502308 -503029 -507199 -511292 -511876 -513138 -513490 -515205 -515661 -522141 -526407 -526454 -527219 -528310 -529163 -530594 -536859 -537110 -539829 -543836 -549707 -550280 -550617 -552703 -553697 -554120 -557711 -564793 -566557 -568184 -571603 -572459 -575708 -576926 -578199 -580474 -583321 -587152 -589060 -593561 -595208 -596465 -596662 -598234 -599754 -600656 -600917 -602787 -605133 -608648 -613540 -616276 -617894 -618676 -623824 -623894 -624389 -635575 -637048 -637982 -639750 -647974 -648438 -652359 -657948 -658626 -659066 -664659 -667653 -668427 -679955 -683011 -687349 -689088 -690570 -694818 -695011 -696547 -697613 -700173 -705302 -716042 -717405 -717728 -717970 -722465 -722790 -724352 -726756 -727730 -727943 -735400 -736596 -736770 -741816 -742284 -744414 -747895 -749527 -755566 -755736 -759204 -766584 -768150 -768351 -771316 -771493 -776592 -779370 -781321 -783830 -784795 -786890 -796161 -796432 -797079 -797262 -802921 -804519 -811788 -814764 -827706 -828454 -830727 -832440 -834456 -837992 -839301 -840257 -841115 -841825 -842699 -843594 -845331 -845663 -845866 -852388 -852428 -855227 -855540 -865376 -869577 -870975 -877564 -877822 -879934 -881281 -881612 -888646 -888684 -891213 -891486 -892258 -892949 -895189 -899245 -900432 -903974 -905591 -907997 -908047 -911671 -919167 -919887 -920323 -923946 -926358 -928037 -929447 -931989 -934536 -934568 -936242 -937219 -941939 -942636 -942751 -945550 -947353 -947979 -951210 -953745 -954574 -955326 -959032 -960030 -961100 -965291 -966305 -967633 -968251 -969465 -972146 -975240 -975488 -976205 -977633 -980925 -981599 -981675 -982858 -985741 -995655 -997958 -998171 -999965",
        expected: "1234",
      },
    ],
    hints: [
      "The summit is the maximum. A linear scan finds it — can you avoid looking at every marker?",
      "Compare heights[mid] with heights[mid + 1]. What does it tell you about where the summit is?",
      "If the next marker is higher, you are still climbing: the summit is strictly to the right. Otherwise it is at mid or to its left.",
      "Shrink [lo, hi] using that rule until lo == hi.",
    ],
    solutions: [
      {
        title: "Linear scan for the first descent",
        order: 1,
        intuition:
          "Walk the trail until the next marker is lower. The first time that happens, you are standing on the summit. If it never happens, the summit is the last marker.",
        approach: [
          "For i from 0 to n − 2, if heights[i] > heights[i + 1], return i.",
          "Return n − 1.",
        ],
        code: {
          PYTHON: `def summitIndex(heights: List[int]) -> int:
    for i in range(len(heights) - 1):
        if heights[i] > heights[i + 1]:
            return i
    return len(heights) - 1`,
          JAVA: `class Solution {
    public int summitIndex(int[] heights) {
        for (int i = 0; i < heights.length - 1; i++) {
            if (heights[i] > heights[i + 1]) return i;
        }
        return heights.length - 1;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: ["A trail that only climbs: the summit is the last marker."],
        commonMistakes: ["Reading heights[i + 1] on the final index."],
      },
      {
        title: "Optimal: binary search on the slope",
        order: 2,
        intuition:
          "Every marker before the summit sits on an upward slope (its neighbour to the right is higher), and every marker from the summit onward does not. That is a sorted true/false pattern, so binary search finds the boundary — the first marker whose right neighbour is lower.",
        approach: [
          "Set lo = 0 and hi = n − 1.",
          "While lo < hi, let mid = (lo + hi) / 2.",
          "If heights[mid] < heights[mid + 1], the summit is right of mid: lo = mid + 1.",
          "Otherwise the summit is mid or left of it: hi = mid.",
          "Return lo.",
        ],
        code: {
          PYTHON: `def summitIndex(heights: List[int]) -> int:
    lo, hi = 0, len(heights) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if heights[mid] < heights[mid + 1]:
            lo = mid + 1   # still climbing
        else:
            hi = mid       # descending: mid may be the summit
    return lo`,
          JAVA: `class Solution {
    public int summitIndex(int[] heights) {
        int lo = 0, hi = heights.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (heights[mid] < heights[mid + 1]) lo = mid + 1;
            else hi = mid;
        }
        return lo;
    }
}`,
        },
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        edgeCases: ["One marker.", "The summit at index 0 or at the last index."],
        commonMistakes: [
          "Setting hi = mid − 1 in the descending case, which can skip the summit itself.",
          "Looping while lo <= hi with hi = mid, which never terminates.",
        ],
      },
    ],
    expectedTime: "O(log n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "missing-heartbeat",
    title: "Missing Heartbeat",
    difficulty: "EASY",
    learningObjective:
      "Binary search on whether each index still matches a formula, finding the first place an evenly spaced sequence breaks.",
    topics: ["binary-search"],
    patterns: ["binary-search"],
    statement: [
      para(
        "A monitoring agent sends a heartbeat timestamp at a fixed interval. The collector stored them in order, but exactly one heartbeat was lost somewhere in the middle — never the first or the last."
      ),
      rich(
        "Given the received timestamps in ",
        { code: "beats" },
        " (strictly increasing), return the timestamp of the missing heartbeat. With n received beats there were n + 1 sent, so the interval is (last − first) / n."
      ),
      example(
        "beats = [10, 20, 40, 50, 60]",
        "30",
        [
          {
            state: "interval = (60 − 10) / 5 = 10",
            note: "index i should hold 10 + 10·i",
          },
          {
            state: "mid = 2: 40 vs 30",
            note: "already shifted — the gap is at or before index 2",
          },
          {
            state: "mid = 1: 20 vs 20",
            note: "still on schedule — the gap is after index 1",
          },
          {
            state: "first shifted index = 2",
            note: "the missing beat is 10 + 10·2 = 30",
          },
        ],
        "Finding the first index that is off schedule"
      ),
    ],
    constraints: [
      "3 ≤ beats.length ≤ 100000",
      "-1000000000 ≤ beats[i] ≤ 1000000000, strictly increasing",
      "Exactly one beat is missing, and it is neither the first nor the last.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["beats"],
      returns: "int",
      functionName: "missingHeartbeat",
    },
    tests: [
      {
        input: "10 20 40 50 60",
        expected: "30",
        isSample: true,
        explanation: "Readings are 10 apart; 30 should sit between 20 and 40.",
      },
      {
        input: "-6 -3 3",
        expected: "0",
        isSample: true,
        explanation:
          "The step is (3 − (−6)) / 3 = 3, so −6, −3, 0, 3 — the 0 is missing.",
      },
      { input: "1 3 7", expected: "5" },
      { input: "0 5 10 15 25", expected: "20" },
      { input: "100 101 102 103 105", expected: "104" },
      { input: "-1000000 0 2000000", expected: "1000000" },
      {
        input:
          "17 25 29 33 37 41 45 49 53 57 61 65 69 73 77 81 85 89 93 97 101 105 109 113 117 121 125 129 133 137 141 145 149 153 157 161 165 169 173 177 181 185 189 193 197 201 205 209 213 217 221 225 229 233 237 241 245 249 253 257 261 265 269 273 277 281 285 289 293 297 301 305 309 313 317 321 325 329 333 337 341 345 349 353 357 361 365 369 373 377 381 385 389 393 397 401 405 409 413 417 421 425 429 433 437 441 445 449 453 457 461 465 469 473 477 481 485 489 493 497 501 505 509 513 517 521 525 529 533 537 541 545 549 553 557 561 565 569 573 577 581 585 589 593 597 601 605 609 613 617 621 625 629 633 637 641 645 649 653 657 661 665 669 673 677 681 685 689 693 697 701 705 709 713 717 721 725 729 733 737 741 745 749 753 757 761 765 769 773 777 781 785 789 793 797 801 805 809 813 817 821 825 829 833 837 841 845 849 853 857 861 865 869 873 877 881 885 889 893 897 901 905 909 913 917 921 925 929 933 937 941 945 949 953 957 961 965 969 973 977 981 985 989 993 997 1001 1005 1009 1013 1017 1021 1025 1029 1033 1037 1041 1045 1049 1053 1057 1061 1065 1069 1073 1077 1081 1085 1089 1093 1097 1101 1105 1109 1113 1117 1121 1125 1129 1133 1137 1141 1145 1149 1153 1157 1161 1165 1169 1173 1177 1181 1185 1189 1193 1197 1201 1205 1209 1213 1217 1221 1225 1229 1233 1237 1241 1245 1249 1253 1257 1261 1265 1269 1273 1277 1281 1285 1289 1293 1297 1301 1305 1309 1313 1317 1321 1325 1329 1333 1337 1341 1345 1349 1353 1357 1361 1365 1369 1373 1377 1381 1385 1389 1393 1397 1401 1405 1409 1413 1417 1421 1425 1429 1433 1437 1441 1445 1449 1453 1457 1461 1465 1469 1473 1477 1481 1485 1489 1493 1497 1501 1505 1509 1513 1517 1521 1525 1529 1533 1537 1541 1545 1549 1553 1557 1561 1565 1569 1573 1577 1581 1585 1589 1593 1597 1601 1605 1609 1613 1617 1621 1625 1629 1633 1637 1641 1645 1649 1653 1657 1661 1665 1669 1673 1677 1681 1685 1689 1693 1697 1701 1705 1709 1713 1717 1721 1725 1729 1733 1737 1741 1745 1749 1753 1757 1761 1765 1769 1773 1777 1781 1785 1789 1793 1797 1801 1805 1809 1813 1817 1821 1825 1829 1833 1837 1841 1845 1849 1853 1857 1861 1865 1869 1873 1877 1881 1885 1889 1893 1897 1901 1905 1909 1913 1917 1921 1925 1929 1933 1937 1941 1945 1949 1953 1957 1961 1965 1969 1973 1977 1981 1985 1989 1993 1997 2001 2005 2009 2013 2017 2021 2025 2029 2033 2037 2041 2045 2049 2053 2057 2061 2065 2069 2073 2077 2081 2085 2089 2093 2097 2101 2105 2109 2113 2117 2121 2125 2129 2133 2137 2141 2145 2149 2153 2157 2161 2165 2169 2173 2177 2181 2185 2189 2193 2197 2201 2205 2209 2213 2217 2221 2225 2229 2233 2237 2241 2245 2249 2253 2257 2261 2265 2269 2273 2277 2281 2285 2289 2293 2297 2301 2305 2309 2313 2317 2321 2325 2329 2333 2337 2341 2345 2349 2353 2357 2361 2365 2369 2373 2377 2381 2385 2389 2393 2397 2401 2405 2409 2413 2417 2421 2425 2429 2433 2437 2441 2445 2449 2453 2457 2461 2465 2469 2473 2477 2481 2485 2489 2493 2497 2501 2505 2509 2513 2517 2521 2525 2529 2533 2537 2541 2545 2549 2553 2557 2561 2565 2569 2573 2577 2581 2585 2589 2593 2597 2601 2605 2609 2613 2617 2621 2625 2629 2633 2637 2641 2645 2649 2653 2657 2661 2665 2669 2673 2677 2681 2685 2689 2693 2697 2701 2705 2709 2713 2717 2721 2725 2729 2733 2737 2741 2745 2749 2753 2757 2761 2765 2769 2773 2777 2781 2785 2789 2793 2797 2801 2805 2809 2813 2817 2821 2825 2829 2833 2837 2841 2845 2849 2853 2857 2861 2865 2869 2873 2877 2881 2885 2889 2893 2897 2901 2905 2909 2913 2917 2921 2925 2929 2933 2937 2941 2945 2949 2953 2957 2961 2965 2969 2973 2977 2981 2985 2989 2993 2997 3001 3005 3009 3013 3017 3021 3025 3029 3033 3037 3041 3045 3049 3053 3057 3061 3065 3069 3073 3077 3081 3085 3089 3093 3097 3101 3105 3109 3113 3117 3121 3125 3129 3133 3137 3141 3145 3149 3153 3157 3161 3165 3169 3173 3177 3181 3185 3189 3193 3197 3201 3205 3209 3213 3217 3221 3225 3229 3233 3237 3241 3245 3249 3253 3257 3261 3265 3269 3273 3277 3281 3285 3289 3293 3297 3301 3305 3309 3313 3317 3321 3325 3329 3333 3337 3341 3345 3349 3353 3357 3361 3365 3369 3373 3377 3381 3385 3389 3393 3397 3401 3405 3409 3413 3417 3421 3425 3429 3433 3437 3441 3445 3449 3453 3457 3461 3465 3469 3473 3477 3481 3485 3489 3493 3497 3501 3505 3509 3513 3517 3521 3525 3529 3533 3537 3541 3545 3549 3553 3557 3561 3565 3569 3573 3577 3581 3585 3589 3593 3597 3601 3605 3609 3613 3617 3621 3625 3629 3633 3637 3641 3645 3649 3653 3657 3661 3665 3669 3673 3677 3681 3685 3689 3693 3697 3701 3705 3709 3713 3717 3721 3725 3729 3733 3737 3741 3745 3749 3753 3757 3761 3765 3769 3773 3777 3781 3785 3789 3793 3797 3801 3805 3809 3813 3817 3821 3825 3829 3833 3837 3841 3845 3849 3853 3857 3861 3865 3869 3873 3877 3881 3885 3889 3893 3897 3901 3905 3909 3913 3917 3921 3925 3929 3933 3937 3941 3945 3949 3953 3957 3961 3965 3969 3973 3977 3981 3985 3989 3993 3997 4001 4005 4009 4013 4017 4021 4025 4029 4033 4037 4041 4045 4049 4053 4057 4061 4065 4069 4073 4077 4081 4085 4089 4093 4097 4101 4105 4109 4113 4117 4121 4125 4129 4133 4137 4141 4145 4149 4153 4157 4161 4165 4169 4173 4177 4181 4185 4189 4193 4197 4201 4205 4209 4213 4217 4221 4225 4229 4233 4237 4241 4245 4249 4253 4257 4261 4265 4269 4273 4277 4281 4285 4289 4293 4297 4301 4305 4309 4313 4317 4321 4325 4329 4333 4337 4341 4345 4349 4353 4357 4361 4365 4369 4373 4377 4381 4385 4389 4393 4397 4401 4405 4409 4413 4417 4421 4425 4429 4433 4437 4441 4445 4449 4453 4457 4461 4465 4469 4473 4477 4481 4485 4489 4493 4497 4501 4505 4509 4513 4517 4521 4525 4529 4533 4537 4541 4545 4549 4553 4557 4561 4565 4569 4573 4577 4581 4585 4589 4593 4597 4601 4605 4609 4613 4617 4621 4625 4629 4633 4637 4641 4645 4649 4653 4657 4661 4665 4669 4673 4677 4681 4685 4689 4693 4697 4701 4705 4709 4713 4717 4721 4725 4729 4733 4737 4741 4745 4749 4753 4757 4761 4765 4769 4773 4777 4781 4785 4789 4793 4797 4801 4805 4809 4813 4817 4821 4825 4829 4833 4837 4841 4845 4849 4853 4857 4861 4865 4869 4873 4877 4881 4885 4889 4893 4897 4901 4905 4909 4913 4917 4921 4925 4929 4933 4937 4941 4945 4949 4953 4957 4961 4965 4969 4973 4977 4981 4985 4989 4993 4997 5001 5005 5009 5013 5017 5021 5025 5029 5033 5037 5041 5045 5049 5053 5057 5061 5065 5069 5073 5077 5081 5085 5089 5093 5097 5101 5105 5109 5113 5117 5121 5125 5129 5133 5137 5141 5145 5149 5153 5157 5161 5165 5169 5173 5177 5181 5185 5189 5193 5197 5201 5205 5209 5213 5217 5221 5225 5229 5233 5237 5241 5245 5249 5253 5257 5261 5265 5269 5273 5277 5281 5285 5289 5293 5297 5301 5305 5309 5313 5317 5321 5325 5329 5333 5337 5341 5345 5349 5353 5357 5361 5365 5369 5373 5377 5381 5385 5389 5393 5397 5401 5405 5409 5413 5417 5421 5425 5429 5433 5437 5441 5445 5449 5453 5457 5461 5465 5469 5473 5477 5481 5485 5489 5493 5497 5501 5505 5509 5513 5517 5521 5525 5529 5533 5537 5541 5545 5549 5553 5557 5561 5565 5569 5573 5577 5581 5585 5589 5593 5597 5601 5605 5609 5613 5617 5621 5625 5629 5633 5637 5641 5645 5649 5653 5657 5661 5665 5669 5673 5677 5681 5685 5689 5693 5697 5701 5705 5709 5713 5717 5721 5725 5729 5733 5737 5741 5745 5749 5753 5757 5761 5765 5769 5773 5777 5781 5785 5789 5793 5797 5801 5805 5809 5813 5817 5821 5825 5829 5833 5837 5841 5845 5849 5853 5857 5861 5865 5869 5873 5877 5881 5885 5889 5893 5897 5901 5905 5909 5913 5917 5921 5925 5929 5933 5937 5941 5945 5949 5953 5957 5961 5965 5969 5973 5977 5981 5985 5989 5993 5997 6001 6005 6009 6013 6017 6021 6025 6029 6033 6037 6041 6045 6049 6053 6057 6061 6065 6069 6073 6077 6081 6085 6089 6093 6097 6101 6105 6109 6113 6117 6121 6125 6129 6133 6137 6141 6145 6149 6153 6157 6161 6165 6169 6173 6177 6181 6185 6189 6193 6197 6201 6205 6209 6213 6217 6221 6225 6229 6233 6237 6241 6245 6249 6253 6257 6261 6265 6269 6273 6277 6281 6285 6289 6293 6297 6301 6305 6309 6313 6317 6321 6325 6329 6333 6337 6341 6345 6349 6353 6357 6361 6365 6369 6373 6377 6381 6385 6389 6393 6397 6401 6405 6409 6413 6417 6421 6425 6429 6433 6437 6441 6445 6449 6453 6457 6461 6465 6469 6473 6477 6481 6485 6489 6493 6497 6501 6505 6509 6513 6517 6521 6525 6529 6533 6537 6541 6545 6549 6553 6557 6561 6565 6569 6573 6577 6581 6585 6589 6593 6597 6601 6605 6609 6613 6617 6621 6625 6629 6633 6637 6641 6645 6649 6653 6657 6661 6665 6669 6673 6677 6681 6685 6689 6693 6697 6701 6705 6709 6713 6717 6721 6725 6729 6733 6737 6741 6745 6749 6753 6757 6761 6765 6769 6773 6777 6781 6785 6789 6793 6797 6801 6805 6809 6813 6817 6821 6825 6829 6833 6837 6841 6845 6849 6853 6857 6861 6865 6869 6873 6877 6881 6885 6889 6893 6897 6901 6905 6909 6913 6917 6921 6925 6929 6933 6937 6941 6945 6949 6953 6957 6961 6965 6969 6973 6977 6981 6985 6989 6993 6997 7001 7005 7009 7013 7017 7021 7025 7029 7033 7037 7041 7045 7049 7053 7057 7061 7065 7069 7073 7077 7081 7085 7089 7093 7097 7101 7105 7109 7113 7117 7121 7125 7129 7133 7137 7141 7145 7149 7153 7157 7161 7165 7169 7173 7177 7181 7185 7189 7193 7197 7201 7205 7209 7213 7217 7221 7225 7229 7233 7237 7241 7245 7249 7253 7257 7261 7265 7269 7273 7277 7281 7285 7289 7293 7297 7301 7305 7309 7313 7317 7321 7325 7329 7333 7337 7341 7345 7349 7353 7357 7361 7365 7369 7373 7377 7381 7385 7389 7393 7397 7401 7405 7409 7413 7417 7421 7425 7429 7433 7437 7441 7445 7449 7453 7457 7461 7465 7469 7473 7477 7481 7485 7489 7493 7497 7501 7505 7509 7513 7517 7521 7525 7529 7533 7537 7541 7545 7549 7553 7557 7561 7565 7569 7573 7577 7581 7585 7589 7593 7597 7601 7605 7609 7613 7617 7621 7625 7629 7633 7637 7641 7645 7649 7653 7657 7661 7665 7669 7673 7677 7681 7685 7689 7693 7697 7701 7705 7709 7713 7717 7721 7725 7729 7733 7737 7741 7745 7749 7753 7757 7761 7765 7769 7773 7777 7781 7785 7789 7793 7797 7801 7805 7809 7813 7817 7821 7825 7829 7833 7837 7841 7845 7849 7853 7857 7861 7865 7869 7873 7877 7881 7885 7889 7893 7897 7901 7905 7909 7913 7917 7921 7925 7929 7933 7937 7941 7945 7949 7953 7957 7961 7965 7969 7973 7977 7981 7985 7989 7993 7997 8001 8005 8009 8013",
        expected: "21",
      },
      {
        input:
          "-500000 -499501 -499002 -498503 -498004 -497505 -497006 -496507 -496008 -495509 -495010 -494511 -494012 -493513 -493014 -492515 -492016 -491517 -491018 -490519 -490020 -489521 -489022 -488523 -488024 -487525 -487026 -486527 -486028 -485529 -485030 -484531 -484032 -483533 -483034 -482535 -482036 -481537 -481038 -480539 -480040 -479541 -479042 -478543 -478044 -477545 -477046 -476547 -476048 -475549 -475050 -474551 -474052 -473553 -473054 -472555 -472056 -471557 -471058 -470559 -470060 -469561 -469062 -468563 -468064 -467565 -467066 -466567 -466068 -465569 -465070 -464571 -464072 -463573 -463074 -462575 -462076 -461577 -461078 -460579 -460080 -459581 -459082 -458583 -458084 -457585 -457086 -456587 -456088 -455589 -455090 -454591 -454092 -453593 -453094 -452595 -452096 -451597 -451098 -450599 -450100 -449601 -449102 -448603 -448104 -447605 -447106 -446607 -446108 -445609 -445110 -444611 -444112 -443613 -443114 -442615 -442116 -441617 -441118 -440619 -440120 -439621 -439122 -438623 -438124 -437625 -437126 -436627 -436128 -435629 -435130 -434631 -434132 -433633 -433134 -432635 -432136 -431637 -431138 -430639 -430140 -429641 -429142 -428643 -428144 -427645 -427146 -426647 -426148 -425649 -425150 -424651 -424152 -423653 -423154 -422655 -422156 -421657 -421158 -420659 -420160 -419661 -419162 -418663 -418164 -417665 -417166 -416667 -416168 -415669 -415170 -414671 -414172 -413673 -413174 -412675 -412176 -411677 -411178 -410679 -410180 -409681 -409182 -408683 -408184 -407685 -407186 -406687 -406188 -405689 -405190 -404691 -404192 -403693 -403194 -402695 -402196 -401697 -401198 -400699 -400200 -399701 -399202 -398703 -398204 -397705 -397206 -396707 -396208 -395709 -395210 -394711 -394212 -393713 -393214 -392715 -392216 -391717 -391218 -390719 -390220 -389721 -389222 -388723 -388224 -387725 -387226 -386727 -386228 -385729 -385230 -384731 -384232 -383733 -383234 -382735 -382236 -381737 -381238 -380739 -380240 -379741 -379242 -378743 -378244 -377745 -377246 -376747 -376248 -375749 -375250 -374751 -374252 -373753 -373254 -372755 -372256 -371757 -371258 -370759 -370260 -369761 -369262 -368763 -368264 -367765 -367266 -366767 -366268 -365769 -365270 -364771 -364272 -363773 -363274 -362775 -362276 -361777 -361278 -360779 -360280 -359781 -359282 -358783 -358284 -357785 -357286 -356787 -356288 -355789 -355290 -354791 -354292 -353793 -353294 -352795 -352296 -351797 -351298 -350799 -350300 -349801 -349302 -348803 -348304 -347805 -347306 -346807 -346308 -345809 -345310 -344811 -344312 -343813 -343314 -342815 -342316 -341817 -341318 -340819 -340320 -339821 -339322 -338823 -338324 -337825 -337326 -336827 -336328 -335829 -335330 -334831 -334332 -333833 -333334 -332835 -332336 -331837 -331338 -330839 -330340 -329841 -329342 -328843 -328344 -327845 -327346 -326847 -326348 -325849 -325350 -324851 -324352 -323853 -323354 -322855 -322356 -321857 -321358 -320859 -320360 -319861 -319362 -318863 -318364 -317865 -317366 -316867 -316368 -315869 -315370 -314871 -314372 -313873 -313374 -312875 -312376 -311877 -311378 -310879 -310380 -309881 -309382 -308883 -308384 -307885 -307386 -306887 -306388 -305889 -305390 -304891 -304392 -303893 -303394 -302895 -302396 -301897 -301398 -300899 -300400 -299901 -299402 -298903 -298404 -297905 -297406 -296907 -296408 -295909 -295410 -294911 -294412 -293913 -293414 -292915 -292416 -291917 -291418 -290919 -290420 -289921 -289422 -288923 -288424 -287925 -287426 -286927 -286428 -285929 -285430 -284931 -284432 -283933 -283434 -282935 -282436 -281937 -281438 -280939 -280440 -279941 -279442 -278943 -278444 -277945 -277446 -276947 -276448 -275949 -275450 -274951 -274452 -273953 -273454 -272955 -272456 -271957 -271458 -270959 -270460 -269961 -269462 -268963 -268464 -267965 -267466 -266967 -266468 -265969 -265470 -264971 -264472 -263973 -263474 -262975 -262476 -261977 -261478 -260979 -260480 -259981 -259482 -258983 -258484 -257985 -257486 -256987 -256488 -255989 -255490 -254991 -254492 -253993 -253494 -252995 -252496 -251997 -251498 -250999 -250500 -250001 -249502 -249003 -248504 -248005 -247506 -247007 -246508 -246009 -245510 -245011 -244512 -244013 -243514 -243015 -242516 -242017 -241518 -241019 -240520 -240021 -239522 -239023 -238524 -238025 -237526 -237027 -236528 -236029 -235530 -235031 -234532 -234033 -233534 -233035 -232536 -232037 -231538 -231039 -230540 -230041 -229542 -229043 -228544 -228045 -227546 -227047 -226548 -226049 -225550 -225051 -224552 -224053 -223554 -223055 -222556 -222057 -221558 -221059 -220560 -220061 -219562 -219063 -218564 -218065 -217566 -217067 -216568 -216069 -215570 -215071 -214572 -214073 -213574 -213075 -212576 -212077 -211578 -211079 -210580 -210081 -209582 -209083 -208584 -208085 -207586 -207087 -206588 -206089 -205590 -205091 -204592 -204093 -203594 -203095 -202596 -202097 -201598 -201099 -200600 -200101 -199602 -199103 -198604 -198105 -197606 -197107 -196608 -196109 -195610 -195111 -194612 -194113 -193614 -193115 -192616 -192117 -191618 -191119 -190620 -190121 -189622 -189123 -188624 -188125 -187626 -187127 -186628 -186129 -185630 -185131 -184632 -184133 -183634 -183135 -182636 -182137 -181638 -181139 -180640 -180141 -179642 -179143 -178644 -178145 -177646 -177147 -176648 -176149 -175650 -175151 -174652 -174153 -173654 -173155 -172656 -172157 -171658 -171159 -170660 -170161 -169662 -169163 -168664 -168165 -167666 -167167 -166668 -166169 -165670 -165171 -164672 -164173 -163674 -163175 -162676 -162177 -161678 -161179 -160680 -160181 -159682 -159183 -158684 -158185 -157686 -157187 -156688 -156189 -155690 -155191 -154692 -154193 -153694 -153195 -152696 -152197 -151698 -151199 -150700 -150201 -149702 -149203 -148704 -148205 -147706 -147207 -146708 -146209 -145710 -145211 -144712 -144213 -143714 -143215 -142716 -142217 -141718 -141219 -140720 -140221 -139722 -139223 -138724 -138225 -137726 -137227 -136728 -136229 -135730 -135231 -134732 -134233 -133734 -133235 -132736 -132237 -131738 -131239 -130740 -130241 -129742 -129243 -128744 -128245 -127746 -127247 -126748 -126249 -125750 -125251 -124752 -124253 -123754 -123255 -122756 -122257 -121758 -121259 -120760 -120261 -119762 -119263 -118764 -118265 -117766 -117267 -116768 -116269 -115770 -115271 -114772 -114273 -113774 -113275 -112776 -112277 -111778 -111279 -110780 -110281 -109782 -109283 -108784 -108285 -107786 -107287 -106788 -106289 -105790 -105291 -104792 -104293 -103794 -103295 -102796 -102297 -101798 -101299 -100800 -100301 -99802 -99303 -98804 -98305 -97806 -97307 -96808 -96309 -95810 -95311 -94812 -94313 -93814 -93315 -92816 -92317 -91818 -91319 -90820 -90321 -89822 -89323 -88824 -88325 -87826 -87327 -86828 -86329 -85830 -85331 -84832 -84333 -83834 -83335 -82836 -82337 -81838 -81339 -80840 -80341 -79842 -79343 -78844 -78345 -77846 -77347 -76848 -76349 -75850 -75351 -74852 -74353 -73854 -73355 -72856 -72357 -71858 -71359 -70860 -70361 -69862 -69363 -68864 -68365 -67866 -67367 -66868 -66369 -65870 -65371 -64872 -64373 -63874 -63375 -62876 -62377 -61878 -61379 -60880 -60381 -59882 -59383 -58884 -58385 -57886 -57387 -56888 -56389 -55890 -55391 -54892 -54393 -53894 -53395 -52896 -52397 -51898 -51399 -50900 -50401 -49902 -49403 -48904 -48405 -47906 -47407 -46908 -46409 -45910 -45411 -44912 -44413 -43914 -43415 -42916 -42417 -41918 -41419 -40920 -40421 -39922 -39423 -38924 -38425 -37926 -37427 -36928 -36429 -35930 -35431 -34932 -34433 -33934 -33435 -32936 -32437 -31938 -31439 -30940 -30441 -29942 -29443 -28944 -28445 -27946 -27447 -26948 -26449 -25950 -25451 -24952 -24453 -23954 -23455 -22956 -22457 -21958 -21459 -20960 -20461 -19962 -19463 -18964 -18465 -17966 -17467 -16968 -16469 -15970 -15471 -14972 -14473 -13974 -13475 -12976 -12477 -11978 -11479 -10980 -10481 -9982 -9483 -8984 -8485 -7986 -7487 -6988 -6489 -5990 -5491 -4992 -4493 -3994 -3495 -2996 -2497 -1998 -1499 -1000 -501 -2 497 996 1495 1994 2493 2992 3491 3990 4489 4988 5487 5986 6485 6984 7483 7982 8481 8980 9479 9978 10477 10976 11475 11974 12473 12972 13471 13970 14469 14968 15467 15966 16465 16964 17463 17962 18461 18960 19459 19958 20457 20956 21455 21954 22453 22952 23451 23950 24449 24948 25447 25946 26445 26944 27443 27942 28441 28940 29439 29938 30437 30936 31435 31934 32433 32932 33431 33930 34429 34928 35427 35926 36425 36924 37423 37922 38421 38920 39419 39918 40417 40916 41415 41914 42413 42912 43411 43910 44409 44908 45407 45906 46405 46904 47403 47902 48401 48900 49399 49898 50397 50896 51395 51894 52393 52892 53391 53890 54389 54888 55387 55886 56385 56884 57383 57882 58381 58880 59379 59878 60377 60876 61375 61874 62373 62872 63371 63870 64369 64868 65367 65866 66365 66864 67363 67862 68361 68860 69359 69858 70357 70856 71355 71854 72353 72852 73351 73850 74349 74848 75347 75846 76345 76844 77343 77842 78341 78840 79339 79838 80337 80836 81335 81834 82333 82832 83331 83830 84329 84828 85327 85826 86325 86824 87323 87822 88321 88820 89319 89818 90317 90816 91315 91814 92313 92812 93311 93810 94309 94808 95307 95806 96305 96804 97303 97802 98301 98800 99299 99798 100297 100796 101295 101794 102293 102792 103291 103790 104289 104788 105287 105786 106285 106784 107283 107782 108281 108780 109279 109778 110277 110776 111275 111774 112273 112772 113271 113770 114269 114768 115267 115766 116265 116764 117263 117762 118261 118760 119259 119758 120257 120756 121255 121754 122253 122752 123251 123750 124249 124748 125247 125746 126245 126744 127243 127742 128241 128740 129239 129738 130237 130736 131235 131734 132233 132732 133231 133730 134229 134728 135227 135726 136225 136724 137223 137722 138221 138720 139219 139718 140217 140716 141215 141714 142213 142712 143211 143710 144209 144708 145207 145706 146205 146704 147203 147702 148201 148700 149199 149698 150197 150696 151195 151694 152193 152692 153191 153690 154189 154688 155187 155686 156185 156684 157183 157682 158181 158680 159179 159678 160177 160676 161175 161674 162173 162672 163171 163670 164169 164668 165167 165666 166165 166664 167163 167662 168161 168660 169159 169658 170157 170656 171155 171654 172153 172652 173151 173650 174149 174648 175147 175646 176145 176644 177143 177642 178141 178640 179139 179638 180137 180636 181135 181634 182133 182632 183131 183630 184129 184628 185127 185626 186125 186624 187123 187622 188121 188620 189119 189618 190117 190616 191115 191614 192113 192612 193111 193610 194109 194608 195107 195606 196105 196604 197103 197602 198101 198600 199099 199598 200097 200596 201095 201594 202093 202592 203091 203590 204089 204588 205087 205586 206085 206584 207083 207582 208081 208580 209079 209578 210077 210576 211075 211574 212073 212572 213071 213570 214069 214568 215067 215566 216065 216564 217063 217562 218061 218560 219059 219558 220057 220556 221055 221554 222053 222552 223051 223550 224049 224548 225047 225546 226045 226544 227043 227542 228041 228540 229039 229538 230037 230536 231035 231534 232033 232532 233031 233530 234029 234528 235027 235526 236025 236524 237023 237522 238021 238520 239019 239518 240017 240516 241015 241514 242013 242512 243011 243510 244009 244508 245007 245506 246005 246504 247003 247502 248001 248500 248999 249498 249997 250496 250995 251494 251993 252492 252991 253490 253989 254488 254987 255486 255985 256484 256983 257482 257981 258480 258979 259478 259977 260476 260975 261474 261973 262472 262971 263470 263969 264468 264967 265466 265965 266464 266963 267462 267961 268460 268959 269458 269957 270456 270955 271454 271953 272452 272951 273450 273949 274448 274947 275446 275945 276444 276943 277442 277941 278440 278939 279438 279937 280436 280935 281434 281933 282432 282931 283430 283929 284428 284927 285426 285925 286424 286923 287422 287921 288420 288919 289418 289917 290416 290915 291414 291913 292412 292911 293410 293909 294408 294907 295406 295905 296404 296903 297402 297901 298400 298899 299398 299897 300396 300895 301394 301893 302392 302891 303390 303889 304388 304887 305386 305885 306384 306883 307382 307881 308380 308879 309378 309877 310376 310875 311374 311873 312372 312871 313370 313869 314368 314867 315366 315865 316364 316863 317362 317861 318360 318859 319358 319857 320356 320855 321354 321853 322352 322851 323350 323849 324348 324847 325346 325845 326344 326843 327342 327841 328340 328839 329338 329837 330336 330835 331334 331833 332332 332831 333330 333829 334328 334827 335326 335825 336324 336823 337322 337821 338320 338819 339318 339817 340316 340815 341314 341813 342312 342811 343310 343809 344308 344807 345306 345805 346304 346803 347302 347801 348300 348799 349298 349797 350296 350795 351294 351793 352292 352791 353290 353789 354288 354787 355286 355785 356284 356783 357282 357781 358280 358779 359278 359777 360276 360775 361274 361773 362272 362771 363270 363769 364268 364767 365266 365765 366264 366763 367262 367761 368260 368759 369258 369757 370256 370755 371254 371753 372252 372751 373250 373749 374248 374747 375246 375745 376244 376743 377242 377741 378240 378739 379238 379737 380236 380735 381234 381733 382232 382731 383230 383729 384228 384727 385226 385725 386224 386723 387222 387721 388220 388719 389218 389717 390216 390715 391214 391713 392212 392711 393210 393709 394208 394707 395206 395705 396204 396703 397202 397701 398200 398699 399198 399697 400196 400695 401194 401693 402192 402691 403190 403689 404188 404687 405186 405685 406184 406683 407182 407681 408180 408679 409178 409677 410176 410675 411174 411673 412172 412671 413170 413669 414168 414667 415166 415665 416164 416663 417162 417661 418160 418659 419158 419657 420156 420655 421154 421653 422152 422651 423150 423649 424148 424647 425146 425645 426144 426643 427142 427641 428140 428639 429138 429637 430136 430635 431134 431633 432132 432631 433130 433629 434128 434627 435126 435625 436124 436623 437122 437621 438120 438619 439118 439617 440116 440615 441114 441613 442112 442611 443110 443609 444108 444607 445106 445605 446104 446603 447102 447601 448100 448599 449098 449597 450096 450595 451094 451593 452092 452591 453090 453589 454088 454587 455086 455585 456084 456583 457082 457581 458080 458579 459078 459577 460076 460575 461074 461573 462072 462571 463070 463569 464068 464567 465066 465565 466064 466563 467062 467561 468060 468559 469058 469557 470056 470555 471054 471553 472052 472551 473050 473549 474048 474547 475046 475545 476044 476543 477042 477541 478040 478539 479038 479537 480036 480535 481034 481533 482032 482531 483030 483529 484028 484527 485026 485525 486024 486523 487022 487521 488020 488519 489018 489517 490016 490515 491014 491513 492012 492511 493010 493509 494008 494507 495006 495505 496004 496503 497501",
        expected: "497002",
      },
      {
        input:
          "0 1 2 3 4 5 6 7 8 9 10 11 12 13 14 15 16 17 18 19 20 21 22 23 24 25 26 27 28 29 30 31 32 33 34 35 36 37 38 39 40 41 42 43 44 45 46 47 48 49 50 51 52 53 54 55 56 57 58 59 60 61 62 63 64 65 66 67 68 69 70 71 72 73 74 75 76 77 78 79 80 81 82 83 84 85 86 87 88 89 90 91 92 93 94 95 96 97 98 99 100 101 102 103 104 105 106 107 108 109 110 111 112 113 114 115 116 117 118 119 120 121 122 123 124 125 126 127 128 129 130 131 132 133 134 135 136 137 138 139 140 141 142 143 144 145 146 147 148 149 150 151 152 153 154 155 156 157 158 159 160 161 162 163 164 165 166 167 168 169 170 171 172 173 174 175 176 177 178 179 180 181 182 183 184 185 186 187 188 189 190 191 192 193 194 195 196 197 198 199 200 201 202 203 204 205 206 207 208 209 210 211 212 213 214 215 216 217 218 219 220 221 222 223 224 225 226 227 228 229 230 231 232 233 234 235 236 237 238 239 240 241 242 243 244 245 246 247 248 249 250 251 252 253 254 255 256 257 258 259 260 261 262 263 264 265 266 267 268 269 270 271 272 273 274 275 276 277 278 279 280 281 282 283 284 285 286 287 288 289 290 291 292 293 294 295 296 297 298 299 300 301 302 303 304 305 306 307 308 309 310 311 312 313 314 315 316 317 318 319 320 321 322 323 324 325 326 327 328 329 330 331 332 333 334 335 336 337 338 339 340 341 342 343 344 345 346 347 348 349 350 351 352 353 354 355 356 357 358 359 360 361 362 363 364 365 366 367 368 369 370 371 372 373 374 375 376 377 378 379 380 381 382 383 384 385 386 387 388 389 390 391 392 393 394 395 396 397 398 399 400 401 402 403 404 405 406 407 408 409 410 411 412 413 414 415 416 417 418 419 420 421 422 423 424 425 426 427 428 429 430 431 432 433 434 435 436 437 438 439 440 441 442 443 444 445 446 447 448 449 450 451 452 453 454 455 456 457 458 459 460 461 462 463 464 465 466 467 468 469 470 471 472 473 474 475 476 477 478 479 480 481 482 483 484 485 486 487 488 489 490 491 492 493 494 495 496 497 498 499 500 501 502 503 504 505 506 507 508 509 510 511 512 513 514 515 516 517 518 519 520 521 522 523 524 525 526 527 528 529 530 531 532 533 534 535 536 537 538 539 540 541 542 543 544 545 546 547 548 549 550 551 552 553 554 555 556 557 558 559 560 561 562 563 564 565 566 567 568 569 570 571 572 573 574 575 576 577 578 579 580 581 582 583 584 585 586 587 588 589 590 591 592 593 594 595 596 597 598 599 600 601 602 603 604 605 606 607 608 609 610 611 612 613 614 615 616 617 618 619 620 621 622 623 624 625 626 627 628 629 630 631 632 633 634 635 636 637 638 639 640 641 642 643 644 645 646 647 648 649 650 651 652 653 654 655 656 657 658 659 660 661 662 663 664 665 666 667 668 669 670 671 672 673 674 675 676 677 678 679 680 681 682 683 684 685 686 687 688 689 690 691 692 693 694 695 696 697 698 699 700 701 702 703 704 705 706 707 708 709 710 711 712 713 714 715 716 717 718 719 720 721 722 723 724 725 726 727 728 729 730 731 732 733 734 735 736 737 738 739 740 741 742 743 744 745 746 747 748 749 750 751 752 753 754 755 756 757 758 759 760 761 762 763 764 765 766 767 768 769 770 771 772 773 774 775 776 778 779 780 781 782 783 784 785 786 787 788 789 790 791 792 793 794 795 796 797 798 799 800 801 802 803 804 805 806 807 808 809 810 811 812 813 814 815 816 817 818 819 820 821 822 823 824 825 826 827 828 829 830 831 832 833 834 835 836 837 838 839 840 841 842 843 844 845 846 847 848 849 850 851 852 853 854 855 856 857 858 859 860 861 862 863 864 865 866 867 868 869 870 871 872 873 874 875 876 877 878 879 880 881 882 883 884 885 886 887 888 889 890 891 892 893 894 895 896 897 898 899 900 901 902 903 904 905 906 907 908 909 910 911 912 913 914 915 916 917 918 919 920 921 922 923 924 925 926 927 928 929 930 931 932 933 934 935 936 937 938 939 940 941 942 943 944 945 946 947 948 949 950 951 952 953 954 955 956 957 958 959 960 961 962 963 964 965 966 967 968 969 970 971 972 973 974 975 976 977 978 979 980 981 982 983 984 985 986 987 988 989 990 991 992 993 994 995 996 997 998 999 1000 1001 1002 1003 1004 1005 1006 1007 1008 1009 1010 1011 1012 1013 1014 1015 1016 1017 1018 1019 1020 1021 1022 1023 1024 1025 1026 1027 1028 1029 1030 1031 1032 1033 1034 1035 1036 1037 1038 1039 1040 1041 1042 1043 1044 1045 1046 1047 1048 1049 1050 1051 1052 1053 1054 1055 1056 1057 1058 1059 1060 1061 1062 1063 1064 1065 1066 1067 1068 1069 1070 1071 1072 1073 1074 1075 1076 1077 1078 1079 1080 1081 1082 1083 1084 1085 1086 1087 1088 1089 1090 1091 1092 1093 1094 1095 1096 1097 1098 1099 1100 1101 1102 1103 1104 1105 1106 1107 1108 1109 1110 1111 1112 1113 1114 1115 1116 1117 1118 1119 1120 1121 1122 1123 1124 1125 1126 1127 1128 1129 1130 1131 1132 1133 1134 1135 1136 1137 1138 1139 1140 1141 1142 1143 1144 1145 1146 1147 1148 1149 1150 1151 1152 1153 1154 1155 1156 1157 1158 1159 1160 1161 1162 1163 1164 1165 1166 1167 1168 1169 1170 1171 1172 1173 1174 1175 1176 1177 1178 1179 1180 1181 1182 1183 1184 1185 1186 1187 1188 1189 1190 1191 1192 1193 1194 1195 1196 1197 1198 1199 1200 1201 1202 1203 1204 1205 1206 1207 1208 1209 1210 1211 1212 1213 1214 1215 1216 1217 1218 1219 1220 1221 1222 1223 1224 1225 1226 1227 1228 1229 1230 1231 1232 1233 1234 1235 1236 1237 1238 1239 1240 1241 1242 1243 1244 1245 1246 1247 1248 1249 1250 1251 1252 1253 1254 1255 1256 1257 1258 1259 1260 1261 1262 1263 1264 1265 1266 1267 1268 1269 1270 1271 1272 1273 1274 1275 1276 1277 1278 1279 1280 1281 1282 1283 1284 1285 1286 1287 1288 1289 1290 1291 1292 1293 1294 1295 1296 1297 1298 1299 1300 1301 1302 1303 1304 1305 1306 1307 1308 1309 1310 1311 1312 1313 1314 1315 1316 1317 1318 1319 1320 1321 1322 1323 1324 1325 1326 1327 1328 1329 1330 1331 1332 1333 1334 1335 1336 1337 1338 1339 1340 1341 1342 1343 1344 1345 1346 1347 1348 1349 1350 1351 1352 1353 1354 1355 1356 1357 1358 1359 1360 1361 1362 1363 1364 1365 1366 1367 1368 1369 1370 1371 1372 1373 1374 1375 1376 1377 1378 1379 1380 1381 1382 1383 1384 1385 1386 1387 1388 1389 1390 1391 1392 1393 1394 1395 1396 1397 1398 1399 1400 1401 1402 1403 1404 1405 1406 1407 1408 1409 1410 1411 1412 1413 1414 1415 1416 1417 1418 1419 1420 1421 1422 1423 1424 1425 1426 1427 1428 1429 1430 1431 1432 1433 1434 1435 1436 1437 1438 1439 1440 1441 1442 1443 1444 1445 1446 1447 1448 1449 1450 1451 1452 1453 1454 1455 1456 1457 1458 1459 1460 1461 1462 1463 1464 1465 1466 1467 1468 1469 1470 1471 1472 1473 1474 1475 1476 1477 1478 1479 1480 1481 1482 1483 1484 1485 1486 1487 1488 1489 1490 1491 1492 1493 1494 1495 1496 1497 1498 1499 1500",
        expected: "777",
      },
      {
        input:
          "123456 124456 125456 126456 127456 128456 129456 130456 131456 132456 133456 134456 135456 136456 137456 138456 139456 140456 141456 142456 143456 144456 145456 146456 147456 148456 149456 150456 151456 152456 153456 154456 155456 156456 157456 158456 159456 160456 161456 162456 163456 164456 165456 166456 167456 168456 169456 170456 171456 172456 173456 174456 175456 176456 177456 178456 179456 180456 181456 182456 183456 184456 185456 186456 187456 188456 189456 190456 191456 192456 193456 194456 195456 196456 197456 198456 199456 200456 201456 202456 203456 204456 205456 206456 207456 208456 209456 210456 211456 212456 213456 214456 215456 216456 217456 218456 219456 220456 221456 222456 223456 224456 225456 226456 227456 228456 229456 230456 231456 232456 233456 234456 235456 236456 237456 238456 239456 240456 241456 242456 243456 244456 245456 246456 247456 248456 249456 250456 251456 252456 253456 254456 255456 256456 257456 258456 259456 260456 261456 262456 263456 264456 265456 266456 267456 268456 269456 270456 271456 272456 273456 274456 275456 276456 277456 278456 279456 280456 281456 282456 283456 284456 285456 286456 287456 288456 289456 290456 291456 292456 293456 294456 295456 296456 297456 298456 299456 300456 301456 302456 303456 304456 305456 306456 307456 308456 309456 310456 311456 312456 313456 314456 315456 316456 317456 318456 319456 320456 321456 322456 323456 324456 325456 326456 327456 328456 329456 330456 331456 332456 333456 334456 335456 336456 337456 338456 339456 340456 341456 342456 343456 344456 345456 346456 347456 348456 349456 350456 351456 352456 353456 354456 355456 356456 357456 358456 359456 360456 361456 362456 363456 364456 365456 366456 367456 368456 369456 370456 371456 372456 373456 374456 375456 376456 377456 378456 379456 380456 381456 382456 383456 384456 385456 386456 387456 388456 389456 390456 391456 392456 393456 394456 395456 396456 397456 398456 399456 400456 401456 402456 403456 404456 405456 406456 407456 408456 409456 410456 411456 412456 413456 414456 415456 416456 417456 418456 419456 420456 421456 422456 423456 424456 425456 426456 427456 428456 429456 430456 431456 432456 433456 434456 435456 436456 437456 438456 439456 440456 441456 442456 443456 444456 445456 446456 447456 448456 449456 450456 451456 452456 453456 454456 455456 456456 457456 458456 459456 460456 461456 462456 463456 464456 465456 466456 467456 468456 469456 470456 471456 472456 473456 474456 475456 476456 477456 478456 479456 480456 481456 482456 483456 484456 485456 486456 487456 488456 489456 490456 491456 492456 493456 494456 495456 496456 497456 498456 499456 500456 501456 502456 503456 504456 505456 506456 507456 508456 509456 510456 511456 512456 513456 514456 515456 516456 517456 518456 519456 520456 521456 522456 523456 524456 525456 526456 527456 528456 529456 530456 531456 532456 533456 534456 535456 536456 537456 538456 539456 540456 541456 542456 543456 544456 545456 546456 547456 548456 549456 550456 551456 552456 553456 554456 555456 556456 557456 558456 559456 560456 561456 562456 563456 564456 565456 566456 567456 568456 569456 570456 571456 572456 573456 574456 575456 576456 577456 578456 579456 580456 581456 582456 583456 584456 585456 586456 587456 588456 589456 590456 591456 592456 593456 594456 595456 596456 597456 598456 599456 600456 601456 602456 603456 604456 605456 606456 607456 608456 609456 610456 611456 612456 613456 614456 615456 616456 617456 618456 619456 620456 621456 622456 624456 625456 626456 627456 628456 629456 630456 631456 632456 633456 634456 635456 636456 637456 638456 639456 640456 641456 642456 643456 644456 645456 646456 647456 648456 649456 650456 651456 652456 653456 654456 655456 656456 657456 658456 659456 660456 661456 662456 663456 664456 665456 666456 667456 668456 669456 670456 671456 672456 673456 674456 675456 676456 677456 678456 679456 680456 681456 682456 683456 684456 685456 686456 687456 688456 689456 690456 691456 692456 693456 694456 695456 696456 697456 698456 699456 700456 701456 702456 703456 704456 705456 706456 707456 708456 709456 710456 711456 712456 713456 714456 715456 716456 717456 718456 719456 720456 721456 722456 723456 724456 725456 726456 727456 728456 729456 730456 731456 732456 733456 734456 735456 736456 737456 738456 739456 740456 741456 742456 743456 744456 745456 746456 747456 748456 749456 750456 751456 752456 753456 754456 755456 756456 757456 758456 759456 760456 761456 762456 763456 764456 765456 766456 767456 768456 769456 770456 771456 772456 773456 774456 775456 776456 777456 778456 779456 780456 781456 782456 783456 784456 785456 786456 787456 788456 789456 790456 791456 792456 793456 794456 795456 796456 797456 798456 799456 800456 801456 802456 803456 804456 805456 806456 807456 808456 809456 810456 811456 812456 813456 814456 815456 816456 817456 818456 819456 820456 821456 822456 823456 824456 825456 826456 827456 828456 829456 830456 831456 832456 833456 834456 835456 836456 837456 838456 839456 840456 841456 842456 843456 844456 845456 846456 847456 848456 849456 850456 851456 852456 853456 854456 855456 856456 857456 858456 859456 860456 861456 862456 863456 864456 865456 866456 867456 868456 869456 870456 871456 872456 873456 874456 875456 876456 877456 878456 879456 880456 881456 882456 883456 884456 885456 886456 887456 888456 889456 890456 891456 892456 893456 894456 895456 896456 897456 898456 899456 900456 901456 902456 903456 904456 905456 906456 907456 908456 909456 910456 911456 912456 913456 914456 915456 916456 917456 918456 919456 920456 921456 922456 923456 924456 925456 926456 927456 928456 929456 930456 931456 932456 933456 934456 935456 936456 937456 938456 939456 940456 941456 942456 943456 944456 945456 946456 947456 948456 949456 950456 951456 952456 953456 954456 955456 956456 957456 958456 959456 960456 961456 962456 963456 964456 965456 966456 967456 968456 969456 970456 971456 972456 973456 974456 975456 976456 977456 978456 979456 980456 981456 982456 983456 984456 985456 986456 987456 988456 989456 990456 991456 992456 993456 994456 995456 996456 997456 998456 999456 1000456 1001456 1002456 1003456 1004456 1005456 1006456 1007456 1008456 1009456 1010456 1011456 1012456 1013456 1014456 1015456 1016456 1017456 1018456 1019456 1020456 1021456 1022456 1023456 1024456 1025456 1026456 1027456 1028456 1029456 1030456 1031456 1032456 1033456 1034456 1035456 1036456 1037456 1038456 1039456 1040456 1041456 1042456 1043456 1044456 1045456 1046456 1047456 1048456 1049456 1050456 1051456 1052456 1053456 1054456 1055456 1056456 1057456 1058456 1059456 1060456 1061456 1062456 1063456 1064456 1065456 1066456 1067456 1068456 1069456 1070456 1071456 1072456 1073456 1074456 1075456 1076456 1077456 1078456 1079456 1080456 1081456 1082456 1083456 1084456 1085456 1086456 1087456 1088456 1089456 1090456 1091456 1092456 1093456 1094456 1095456 1096456 1097456 1098456 1099456 1100456 1101456 1102456 1103456 1104456 1105456 1106456 1107456 1108456 1109456 1110456 1111456 1112456 1113456 1114456 1115456 1116456 1117456 1118456 1119456 1120456 1121456 1122456 1123456",
        expected: "623456",
      },
      { input: "-1000000000 -500000000 0 1000000000", expected: "500000000" },
    ],
    hints: [
      "Work out the interval first. How many gaps lie between the first and last beat?",
      "Before the missing beat, index i holds exactly first + i · interval. What happens to every index after it?",
      "Each index is either on schedule or shifted, and all the on-schedule indices come first. That is a sorted yes/no pattern.",
      "Binary search for the first shifted index; the missing beat is first + index · interval.",
    ],
    solutions: [
      {
        title: "Walk until a gap is too wide",
        order: 1,
        intuition:
          "Compare each pair of neighbours. The one pair that is two intervals apart surrounds the missing beat. One pass, but it reads every timestamp.",
        approach: [
          "Compute interval = (last − first) / n.",
          "For each i, if beats[i + 1] − beats[i] is not the interval, return beats[i] + interval.",
        ],
        code: {
          PYTHON: `def missingHeartbeat(beats: List[int]) -> int:
    interval = (beats[-1] - beats[0]) // len(beats)
    for i in range(len(beats) - 1):
        if beats[i + 1] - beats[i] != interval:
            return beats[i] + interval
    return -1  # unreachable for valid input`,
          JAVA: `class Solution {
    public int missingHeartbeat(int[] beats) {
        int interval = (beats[beats.length - 1] - beats[0]) / beats.length;
        for (int i = 0; i + 1 < beats.length; i++) {
            if (beats[i + 1] - beats[i] != interval) return beats[i] + interval;
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(1)",
        edgeCases: ["The gap right after the first beat or right before the last."],
        commonMistakes: [
          "Dividing by n − 1 instead of n — there are n gaps, because one beat is missing.",
        ],
      },
      {
        title: "Optimal: binary search for the first shifted index",
        order: 2,
        intuition:
          "Index i is on schedule when beats[i] equals first + i · interval. Every index before the gap is on schedule and every index after it is shifted by one interval, so the predicate flips exactly once. Binary search finds the first shifted index, and the beat that should have been there is the answer.",
        approach: [
          "Compute interval = (last − first) / n.",
          "Search lo = 0, hi = n − 1 for the first index that is not on schedule.",
          "If beats[mid] is on schedule, lo = mid + 1; otherwise hi = mid.",
          "Return first + lo · interval.",
        ],
        code: {
          PYTHON: `def missingHeartbeat(beats: List[int]) -> int:
    first = beats[0]
    interval = (beats[-1] - first) // len(beats)
    lo, hi = 0, len(beats) - 1  # the last beat is always shifted
    while lo < hi:
        mid = (lo + hi) // 2
        if beats[mid] == first + mid * interval:
            lo = mid + 1   # on schedule: the gap is further right
        else:
            hi = mid       # shifted: the gap is here or to the left
    return first + lo * interval`,
          JAVA: `class Solution {
    public int missingHeartbeat(int[] beats) {
        long first = beats[0];
        long interval = (beats[beats.length - 1] - first) / beats.length;
        int lo = 0, hi = beats.length - 1;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (beats[mid] == first + mid * interval) lo = mid + 1;
            else hi = mid;
        }
        return (int) (first + lo * interval);
    }
}`,
        },
        timeComplexity: "O(log n)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Negative timestamps.",
          "The gap at index 1 or at index n − 1.",
          "A span of two billion, where last − first overflows a 32-bit integer.",
        ],
        commonMistakes: [
          "Computing last − first in 32 bits when the timestamps span most of the integer range.",
          "Returning beats[lo] instead of the timestamp that should have been there.",
        ],
      },
    ],
    expectedTime: "O(log n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "sensor-spacing",
    title: "Sensor Spacing",
    difficulty: "MEDIUM",
    learningObjective:
      "Maximise a minimum by binary searching the answer, with a greedy left-to-right check deciding feasibility.",
    topics: ["binary-search"],
    patterns: ["binary-search", "greedy"],
    statement: [
      para(
        "A rail line has mounting posts at fixed distances from the depot. Engineers must clip vibration sensors onto some of the posts, at most one per post. Sensors placed close together pick up each other's noise, so the team wants them as far apart as possible."
      ),
      rich(
        "Given the post positions in ",
        { code: "posts" },
        " (not sorted) and the number of ",
        { code: "sensors" },
        ", return the largest possible value of the smallest distance between any two placed sensors."
      ),
      example(
        "posts = [1, 2, 8, 4, 9], sensors = 3",
        "3",
        [
          {
            state: "sorted: 1 2 4 8 9",
            note: "the check is easiest on sorted positions",
          },
          { state: "gap 4?", note: "1, then 8 — only two sensors fit" },
          { state: "gap 3?", note: "1, 4, 8 — three sensors fit" },
          { state: "answer 3", note: "3 works and 4 does not" },
        ],
        "Testing candidate gaps"
      ),
    ],
    constraints: [
      "2 ≤ sensors ≤ posts.length ≤ 100000",
      "0 ≤ posts[i] ≤ 1000000000, all distinct",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["posts", "sensors"],
      returns: "int",
      functionName: "widestSpacing",
    },
    tests: [
      {
        input: "1 2 8 4 9\n3",
        expected: "3",
        isSample: true,
        explanation:
          "Posts at 1, 4 and 8 (or 1, 4, 9) keep every pair at least 3 apart; no choice reaches 4.",
      },
      {
        input: "10 0\n2",
        expected: "10",
        isSample: true,
        explanation: "With two posts and two sensors, the gap is the full distance.",
      },
      { input: "5 1 3\n3", expected: "2" },
      { input: "1 2 3 4 5 6 7 8\n4", expected: "2" },
      { input: "0 100 1 99 50\n3", expected: "50" },
      { input: "3 17 41 2 90 64 33 8 77 25\n5", expected: "16" },
      {
        input:
          "67631193 196100368 293174395 132250083 415721552 520136706 244749620 170675193 989588958 383185185 243607055 41328263 547799067 948812171 532509680 45308 676452720 737895883 262410865 703194152 224895370 914109719 104903754 132191666 43258425 441083658 532698648 879755791 837658601 976876236 182112950 43436005 458229374 765684920 849063281 650345695 844649712 377178799 728700677 125735879 569769755 750327368 872591128 355218012 622784692 40740856 331268559 314972977 518288143 198628732 608991157 533805108 165510873 594311580 959534400 49097223 139169694 119981608 497948529 36157293 566749567 114119296 530413061 691472013 246408382 518890009 323277117 151609685 916347254 579076245 956951422 75810837 77924468 973258490 70459129 803799680 477287692 941115288 631141203 637351718 857571181 986589694 121892179 500701597 190293513 870883827 907568575 233716920 654400496 273186156 113006390 667068232 958088898 546618686 624873116 993383581 80156240 445172493 762688833 195489161 24595351 845912353 432436302 8625049 492177480 115672392 399163098 123238504 506865576 665070222 69681556 740468361 464200669 182307428 347570291 887674733 527525151 244868250 589851450 842733297 80403974 443659473 522921073 636268722 539033414 577114703 487719699 677093294 690379731 385365645 58303250 968221688 827344725 311484888 817818074 446197337 68920935 226189738 477756510 96375822 630917645 593326149 544706405 876996482 669986123 89971305 965288175 710043706 434607078 844587431 970734311 305709660 646498396 927913285 511228431 463552591 122364694 475725708 144764355 518564748 14805112 977150497 531038075 7041182 488717560 165254922 601892217 471029212 458887266 382319802 768699407 675202591 105205145 746031803 783764090 169560089 330992643 12807798 447315209 972738760 41234102 593511180 462909593 33073729 286847768 302047636 574690214 795553027 600846756 492792774 542341539 565047869 260109202 680944288 752335443 899225621 604375057 120274516 570224651 975374526 152430989 429607872 906182565 737291914 797101803 72715472 914742694 983292599 192892479 776728469 975096022 463071071 392625826 27172280 648270853 289893729 520287852 228187707 441325063 922917275 845320048 696404065 677981340 698475900 980338919 939538516 878489011 68290368 598994655 369775144 174774567 456162521 975715246 231023711 673119178 572282940 458372701 615703669 788587322 507377420 142850056 245084311 302977501 523655567 103180372 279633417 752522885 575803873 989840563 956498333 453624850 333614974 927203329 82253962 448371395 281468217 419615232 33450711 555241543 746885661 173249398 289819319 961256685 536948765 155897349 542953170 965423902 152246100 249055123 618834837 907020989 181052340 501231015 283794972 256883736 506975060 973681767 263955760 622334303 239622665 459560506 407572432 131300528 1081477 497514901 119056433 697566305 484409925 920230963 165343930 761843835 824167756 89282557 338033384 776005961 993749628 968404252 425933582 571417273 443163 46766722 221492299 740052623 250949825 623682923 81719516 213250555 566603575 160439746 717246181 391835952 470652722 791393770 915151720 148379202 194957149 428705765 252733 8515160 617121919 217385514 260422447 961984537 39760219 124491837 404248133 63703938 655964789 453974949 265094537 239289375 567330618 118914037 840383236 472107365 140412662 313996030 545434200 702326469 590157680 996969317 430990892 393099765 675125484 401702049 205875373 793130260 935986399 465711726 158144775 568932826 792807278 858314293 266428810 859205764 790257055 774414006 366571651 461933723 250830094 846375118 231682436 30075764 579009501 327478172 27627290 224348684 650699912 836226950 963097013 629389351 9209955 965695886 771033814 245894150 219003112 718387038 444491075 790512162 238415080 313841760 246368443 747303911 753819505 71417931 131011790 979242151 144161718 898699143 33390042 356822751 566463560 114808851 706548405 506616858 673346953 415126108 854241812 502242819 69312943 897669132 920877398 534969887 762907336 984122210 969956722 887452500 728496662 96879684 894499334 531438110 810069180 304892636 726417972 189654618 546270764 292418299 123132873 828337759 387511285 615155787 73675098 136903428 2380161 481792085 938431746 6867075 844624515 105017501 997030183 420442106 825650999 662150016 944064856 117007841 329290084 654650381 163641885 544457488 82159119 529455262 740240643 933055349 625572062 85478900 929317132 279735422 734114126 951167847 265227188 414764020 765845335 764002630 81681229 369595912 835844725 587498946 675017180 26456001 168654180 569552182 426851260 482923174 722087844 741739457 315585546 366712427 837123834 314002716 146707232 71007927 305861828 787199838 739721479 579964907 653280896 131055296 880252177 780351575 655422030 993952355 959817155 346530291 14424671 202094708 103027248 564666937 249031713 86440627 715188211 136168584 476112356 35324449 346726268 345536996 82791280 262323925 458265891 359152419 382224834 995344923 720573459 235666442 369049874 714722408 428469415 886192238 652977192 934537253 927405928 770641333 319372505 164158963 734088875 853171031 931199656 845460565 583253880 695223127 13722279 585074271 375679713 615335578 582045422 733219118 414045990 200635680 660610853 131073928 24950979 836738434 492411807 452915947 484887987 179666168 674899421 865155953 897475996 632749392 506908769 615003312 156768588 130359117 333485053 489236667 294217676 909609488 148385342 489665817 537962600 779622093 342444811 731449468 781016889 91455334 909246771 81415021 135439552 556391019 214603009 288751127 707643771 834800411 554977628 50909940 360458700 35568766 317534693 411466602 32398613 346144612 149736989 35646232 894711593 661218671 12628997 997998917 908939987 557080766 7430016 673913999 894851456 234136024 8264048 210550174 614733359 581259449 220796207 271170920 133771517 78530963 63494917 632870072 154709193 408060143 139828080 178117845 125849980 910217600 272931690 173021073 125111043 360303319 231854200 723255671 127129262 413436000 768385182 506827546 994306860 867161858 213554125 657205026 253205958 914207455 640628682 207764485 52614393 818234436 413307358 1404347 703577326 109380036 641344699 675851682 663620449 547631525 73944295 129698103 282513496 377925497 364439798 905641857 392479651 327554153 880515054 862995609 708907662 728815122 418953925 472144446 11379090 246336496 166239270 535956702 700547982 168733552 269697986 291667919 234926516 105669592 68498513 302027690 429572585 880239714 520467635 553333181 635228894 275675790 590579288 407282682 957462806 16598283 374033337 704040466 169384087 874983853 806384747 471206617 118800533 791914900 270979317 75582282 356627317 8804621 531320729 542255037 18416849 39062488 162214208 643375211 65967906 566816623 561087106 801763970 573080271 200115562 677290501 241002403 837461375 962184106 960119973 541857745 28767637 481715270 824838899 576395762 891836303 148119631 424187451 910751429 299166645 242986569 930325805 463974802 421672629 617633969 485666181 883844093 941937754 57617660 372531531 415203173 782084026 993713748 335988013 468333003 216895487 381681822 823586166 845890521 194357516 654242041 429243414 954590073 698188950 663672591 289430198 530200931 661992818 498263451 479392300 594978181 201914280 897756034 176611669 434373180 635872334 446435028 948402720 158314114 146727403 90783462 104954233 95742030 963133947 249414784 380124065 159834218 370424806 816564059 720875097 136503574 888173515 921598271 757318923 456122569 393635466 944379618 984235412 153248619 504681048 429591580 414375994 761220181 491880384 884793722 872541488 542296199 704228385 849440471 185128049 161125167 101650018 430004417 217170549 400681791 539685440 473842236 461561347 712567725 186667421 540027078 941461648 689942922 635027795 827867142 321704462 76277723 151059264 134081824 2452110 640281111 333191374 854570537 999513220 11356293 912678741 168408746 874056732 31020163 679282810 383727408 835832785 769122120 991589411 186523032 823429989 156811464 100264487 257011613 529645229 753573905 520394644 563356419 118428145 722810970 178475541 169398102 864471618 901169261 914114937 741201595 150026189 409259822 422009251 2991077 418219559 163231217 439020430 179673058 490158857 494938769 33642587 442741903 503113401 459846530 257209992 208596078 432630388 919074600 444897098 649696845 101125820 490420775 868630621 932786401 667664948 674079664 664348603 937479219 889189738 872463393 738311356 90610082 632420726 211179635 253056934 882811446 824273630 217076248 994639978 225969657 181902917 397865910 626141539 384260672 407835770 10268171 759547324 439074280 104405075 806626133 585625646 701736731 316219631 893901141 891415980 89331912 555931713 886172339 694534678 353204956 134134809 42695575 754199602 755386020 785998640 585455664 660182791 418992572 153619861 27683503 754272479 103264975 278102442 946452248 783596641 261363796 641028710 363653921 102359870 154777982 660045403 85870278 464782058 856378124 575633212 124493996 959342096 686430464 590555887 646006125 561788696 506396533 152243604 390624438 929187066 820273370 712161373 637734128 587593429 489319918 622729599 128970397 986297654 550817633 437203877 453736233 95250077 839477027 54531672 113998618 927177819 56617583 146010497 583786257 924711459 928204429 825465638 200707017 980779074 226782561 636334119 720494648 357979385 128603070 547685941 397999587 48422146 925814131 10931644 958453296 762003932 503625161 556251669 867019165 897912451 626823602 84188920 708776494 753993785 60125435 536425632 552776588 510445042 228131019 349726236 757335525 718947143 582234435 151851954 654676652 817593928 648778630 946530663 300666468 817813462 114131717 581912835 908496787 801571228 245906729 201500223 782962219 71343248 580476798 62586597 949764369 92296492 636396016 56808233 671467963 863783624 512483939 161700824 401468475 11247336 345413213 900943151 963464456 291889740 862557284 324349118 386086568 787644620 625268747 547293201 34056935 513704459 597380110 354045637 236383046 979221516 549245235 480290985 596811206 609676482 587356287 482448384 596010227 767027218 541803038 596396558 729002134 703886017 975223717 155767964 175922895 665717570 52223683 548734620 721732919 728220088 55948697 363521989 884994597 692216196 854914616 896611003 951961066 662917749 764955357 787965448 223126513 609829630 626418414 929500808 858815808 639555135 390038755 604649071 360847748 619967331 828897548 152845767 142181518 209518881 147920230 297520145 637309772 712440615 40406488 938929915 230578024 543460989 680123093 583569025 365619776 651494984 446072730 628940020 362980579 186064539 260410063 218613754 172178560 67645301 929206780 861315576 430374972 69162237 504930368 519371550 544003379 615645511 190263054 376321942 768952127 623404829 442628456 718202355 386653645 935180582 151617429 172803080 437847045 33565138 21961529 445909955 248062233 66935396 936562318 440217301 132819095 826941110 29481746 669894260 625946254 208995141 54429641 137186991 197876041 550758912 692350479 745264867 401862286 300930237 350962782 52363865 586084787 202515808 267789402 815355942 414954919 303512476 313360039 437469900 180963585 458771322 758482648 437121403 506218957 306730269 138018480 369103573 922701476 194022543 359711543 491276697 715174252 916726252 924687414 420276900 439391675 322718865 713825589 840465534 733019444 564711068 331153248 805257742 29177316 807991403 132961102 471080619 655574818 371976246 934833593 13092670 800706686 412959066 594903423 172667464 953850233 429958817 373438143 960152155 974263492 245949348 371174611 568085864 207301684 284519513 352772178 193681708 675334825 715777933 839869702 885194695 958350105 461545532 505945056 643882218 40529377 945120603 879857921 764476985 466257010 758844516 609344940 105893029 514851188 184397113 883048323 721058170 523680691 656179805 37012081 364244195 121670212 912723672 820402139 190203934 875648253 497668250 800180563 364914636 32119558 258851790 3128693 974895859 425018474 743208832 466333353 472397541 292878688 632049700 563985935 480792595 12840535 624941835 992966437 613509723 938092845 963285816 9017561 775647098 384008477 727457726 439480164 353195398 625560202 206987172 416152613 657955444 115099264 762355672 985485914 511424508 782141275 587044377 109246209 557153716 389888459 493779606 442397853 32078629 577867061 176272395 169698823 923360779 311081971 193122813 924235364 649967504 776944283 48782002 597411051 586530669 705536114 126460376 664493236 249896516 563641356 766398828 213429094 616835534 834498466 280755104 620589912 406876871 583350346 104686606 113384571 514723882 900120100 993158899 870127982 45669416 81473656 219265101 522481006 232260192 629617989 616836485 230662004 993529370 223296882 711829141 983308102 109939812 162780572 160072861 698508863 453619718 376809972 674214686 81330017 27513841 75015904 124145622 554635271 720422254 320871849 298173257 434366820 153991550 315226139 410350835 634147229 917030257 545970442 666882138 719797537 229466852 486461035 936814742 880839940 343067028 223233384 759629049 295865874 41164023 574157070 710607353 430412408 423707385 392311729 910880588 411324924 812099833 55507402 837530725 670578311 566778440 809673910 870389746 620720964 714568061 142523871 762903689 637353355 948763714 611736972 920811515 313519865 167556505 35006588 254506452 89227027 335918678 995689879 137435777 830394285 436289285 490180768 423649811 690359772 440876165 633123908 869846634 792432283 921530972 664786739 475465379 343619836 621155766 82907216 284849841 99731312 55359471 397210989 183908809 687182836 515796613 275351355 584871639 214732545 57804452 225433071 869852393 685277269 937474402 543540483 142603852 967864367 825233237 646315915 760824127 329134607 449920957 549385293 311076913 767694656 529543845 958143026 8347219 143004499 339155113 110215190 227210769 823587974 744667765 978033496 70993094 95402272 638708631 617074495 90097765 650977878 152403802 98092622 617083596 455407601 168297000 250635096 854780016 363601939 535858649 763337823 279305089 545779058 374968921 43763744 703847150 572208219 913992226 792632154 351346051 262992696 303986864 24863251 185530025 184343428 180502199 825253888 222363098 937996183 874055747 259222144 908875603 143346124 915678317 605142132 107701388 261356855 670473731 72966545 562645671 421942009 488834102 488629110 53243168 539841355 418343845 25632057 322426920 163481900 305334782 4924126 973737074 480858576 348785243 996279584 537426884 330477935 505582392 395513414 231347360 120484695 529959708 388163590 474118182 657102833 891672724 995042340 522057487 232925828 244568868 239755602 624637537 498743667 674374322 264911337 423163388 996623047 369776436 273868328 406501318 966529442 414328899 506616882 356350873 93467464 652743030 828937170 428083911 270371857 416197823\n37",
        expected: "27110095",
      },
      {
        input:
          "24991441 74391890 1899405 484224751 28506256 76017226 723459235 595708119 917511243 536424526 414277715 950066972 381302302 451311296 274722056 360022322 282927354 933520961 271871768 155561928 800006558 38710749 917798198 948046663 890631819 329891119 583576100 802051884 470573617 701179547 483850567 46292075 192528849 465655868 543080083 145647715 824065465 271267116 794367655 980340210 325380901 722564741 715771807 614988656 77832980 520790346 203774555 979078908 774222982 372178706 61174135 523511011 855777692 323741005 183392425 704740774 996283035 3867293 211081575 613948289 737889964 837765879 948330550 620875335 22994164 758150918 841439646 419285379 269406750 907028971 319315309 887376523 681668597 609906777 38130696 386420272 768074201 156408824 952627835 191537644 6591795 725290907 895989254 191779482 79481834 847396638 577632416 896051076 852389013 27061020 201932353 198021489 6746341 989203774 269757296 380858115 447683130 975352418 440655617 521478819 575247852 7835183 350876504 541847060 267683067 643224540 275577656 400119439 355083808 960691684 158141599 954364352 982842447 185190385 177377053 982178845 401795119 573942782 530149897 379713592 642127292 333267375 145713200 869416335 160366806 456088505 644962958 178320074 561847283 129257278 204704622 75630981 113855275 531165831 262566245 53816114 683223951 659418445 940154146 717836706 768378823 683996781 434296130 464822207 62475986 997978316 848365975 203157989 85915295 118797678 353492917 684595486 462023421 972260624 238144102 559492552 652023048 285208805 632447581 631847973 547651038 171651344 381381425 414336166 963227447 968636625 917989726 816993115 871345699 471995153 622464963 747914605 304615387 893817952 974412279 572602991 380200197 128907626 996547411 492924419 132021355 920127249 428362156 53372138 201476777 897761897 822902687 94195512 598991684 994186480 215120103 630897939 169525758 252985845 827400294 557552914 31694449 268614133 349253887 956756305 79803570 988707265 963740267 838353730 711691654 120187904 501158856 868207780 191049388 721214093 836878957 706509135 711291031 120478600 372455598 286496208 652959551 975154575 173294537 748989364 56690775 299452812 13251665 694001540 180737827 147303026 527170842 761229627 278689494 143631230 206896908 625638326 320842461 360630713 470305511 563130375 902265201 525481303 697899248 546483854 72194082 277103891 935567630 682997070 691789445 814559002 841160226 221778640 265605473 580995743 907936393 652450297 947952839 701738002 224529475 205794294 286090160 168763107 387053694 437214040 386613021 919707991 61030932 876704671 776210767 680251893 522886689 701874926 648664566 500600094 489479813 250066740 506801444 859568089 61611074 596478846 541937515 529341731 295200230 513259129 988113361 924695634 301107477 725748145 685763288 547462270 229214456 802918095 439143328 960456710 815400047 194966837 686930625 493965965 9800247 27732186 366860588 65102767 239934578 493135142 245638740 42230108 811984793 645289606 744395577 625007099 336731160 395257959 584562631 396063501 563064327 341587455 958960590 851051470 706155158 840690747 969185388 977372698 524300309 537465322 535030417 450835762 968795319 786512419 162874263 348333215 723695089 513228629 878749356 513328650 802027144 578937893 646361052 98121626 86374774 606877836 264089364 774115667 675728871 281538615 180051658 824555200 155540510 207469867 382168036 803448991 228306109 317967152 451188411 188324098 312115870 36302669 661798575 536876765 495175763 254945894 413286077 968655843 561941329 934755218 680683469 484454404 145970613 755379619 122085925 338463572 226533222 134198570 501334750 459418873 21154280 598452384 256657748 458026779 103895385 637805900 434948229 599161754 416721249 793016442 559303450 943560119 324749913 48400771 861996278 39295802 412673929 253969504 422676623 677887411 129558776 280247977 147989907 61472375 462611709 560338402 556709457 997949685 858975750 169172165 758059093 784190130 755210724 403651556 978282094 883016016 980572587 321972650 279017259 948196787 489861989 562102219 228574875 696984719 356957159 633134855 245897717 608799163 403734691 8929105 307230330 423721453 954246194 728013054 455414553 289236594 377960187 4917905 672977327 925200243 759774043 772341503 892912343 415741015 542093990 615669518 335397207 494648264 777513593 917170049 954655538 700108160 966751574 159186240 925902087 695355416 596384965 202892568 933258813 967712875 539214420 138716565 747389921 280074421 984979567 390035775 816391883 254916987 295495519 415175886 122014347 801404503 931753032 779252293 519537312 886952673 872735638 169751889 933194510 478262704 525847136 278129207 261614337 34165823 897332135 638897883 136770288 715438242 947700728 785797749 552339590 265306589 553977711 861123157 777361753 921549679 217764147 862946240 515968728 862384535 274034624 127620607 455125311 181764634 687990986 821906521 167633051 991924082 161265228 269866158 697482035 72504054 693626144 612976104 953369880 684299887 802303959 841044386 423938299 547936526 848448319 804585989 551665989 634915118 995736558 349839592 848535534 778502317 654368846 732914226 487804760 626762214 414511229 142878734 220014350 114410856 78256292 562423374 69329137 21301030 895108289 902368071 443670761 855025066 517337437 535850684 153783584 898946471 388970349 933837606 337972378 175514162 58488742 901445250 477635395 958052401 329043395 375013012 97210516 813706920 770847663 621537181 840447826 328407623 52300674 504526535 171073351 455100771 487219614 237817710 96027340 972516984 58275590 319899220 708615301 173613168 859081710 563521033 364396719 183118715 627447117 261026860 830546970 701916506 110960678 872783946 216774491 820169497 682781393 865688418 297759922 634777541 690480517 240179695 520354788 30395924 242592012 602467141 89076687 691214219 232061925 92929775 962163885 249967990 18023906 627275326 908469022 315924669 672188147 968479566 965924617 26305776 325081712 728744655 441392817 419751132 314158732 752053890 301176993 135968859 196021981 617801911 957131679 416725771 133528236 894491198 132910148 776716680 341256200 133137213 429258631 360786174 46607576 425027302 881243276 790630457 838125113 860184958 249323679 415185719 68541851 814620226 145330286 591865920 91562043 30860859 390671374 901917859 729006039 983439519 862809417 254665759 643718050 588900841 900008925 13288693 222694051 745810747 77453894 112374030 797156720 673290327 984125106 82930538 894292885 165650267 180991943 610391476 290668112 199307281 817520177 708745922 313132201 757558256 572828527 142065075 574574764 693759446 649671823 440222464 651850400 488729173 435476086 812534820 141969649 803068794 129355964 679085232 48626594 989224545 429413025 507430768 272518891 216650472 694788280 697297199 1982739 278350062 676721492 890741052 768567144 26824577 762531914 456608888 810047585 587921669 123815151 841368278 286706365 593526889 788352945 885935297 8690852 310520804 420334294 574336495 293693839 97225655 538934806 114574999 320075068 687984604 25508784 572529202 334624731 36616799 594587987 813441073 790566749 154201438 214330397 351196908 782178464 358194322 977195963 673790329 679129205 162994647 838530501 394683156 448231321 885737997 6783474 836785499 571077620 416404582 675803895 851895540 12530685 941437597 757702992 74353219 841632186 747822263 898525124 854226875 667194816 995593805 546279361 500707717 501051326 245756077 273638021 299495954 577294331 377264626 251892548 642047678 101288422 788923116 451575035 431331308 320301316 371710270 56493728 355416719 803281600 22497664 996058332 724078807 262260958 396990234 897726088 211939929 61338545 360023818 781275936 651726018 34855677 738930837 919118498 739551268 240267607 791452566 860996318 769876780 689046608 173214285 853979041 291983102 525073298 331760187 913564479 70023286 991554597 166042735 418028505 877303837 109311281 425660046 393239972 325891080 829963460 509303426 476451092 889785095 696958183 183404725 296474839 654660399 287510555 616837301 790150164 227794941 980594954 458549220 135964665 306023150 610901381 285755898 398259876 252399328 95758834 212065958 850568849 368773205 109369422 182614188 774776444 125131486 677094284 113895030 658152209 335364048 819025976 711610080 851761829 829131147 300794752 868522483 964702039 130174907 727443478 868652997 345901372 727784178 238010634 507098783 928587878 355676866 909344720 541377509 920638120 455599546 570091471 193804779 216471753 850988507 702858357 995516385 156207217 83441782 192716974 501406133 251505863 219170767 343878732 823663738 370696694 889245760 872555875 940180880 788847269 133812724 558507476 666516401 539750912 642893095 610265592 700020482 319076722 639850632 968740652 528433383 847175434 945871333 182124209 106493353 790580977 889866750 88864829 250012133 177193412 716507659 661875409 362690207 500886915 731013780 753306579 799806297 403984471 713446912 453219479 596657968 517994125 59869301 637736899 355057861 277050783 414489536 853857394 533094852 761937480 179653401 304292706 71923701 40067471 43999055 968316407 491753919 368464192 624571663 659530919 381779293 837836133 72242103 615696204 671422742 51931717 188280859 769387583 91632468 93266328 823505783 507641758 635566568 867447105 272995571 318270941 991045476 164202526 49844473 267056609 596669242 929747642 101622119 881347232 158213213 222999532 521912391 305456115 456991820 772887034 709077202 845263351 771738981 68987178 444298088 736912429 928225651 346808725 629574766 319088492 636004732 742211326 575817686 754980679 918133530 519970603 455473005 313262343 482689577 386889758 971796137 814223189 416866074 161170392 666971488 139336259 873525378 480580782 592781262 52144154 31905059 278095608 526293269 1998796 204939395 884622814 161205189 800140395 936999543 214466169 598102764 336979353 954211425 282178943 713317454 689252197 108165595 91147151 116051036 845735332 668810683 105574871 346137667 731008355 446656555 92480861 403853875 765546666 394196255 57810067 698248350 265953542 904328064 437113789 659838086 405720626 254864308 877812319 678979493 13074778 904727006 98416682 767792220 44978616 102781462 750668866 107249052 620061615 699471506 171483742 944084204 787914901 947929525 579743149 382703638 277806589 318264691 388565042 495950618 969625664 131980463 578792558 393093451 936562183 122196127 827914766 313565779 947354066 339772752 653723151 784236791 58099082 667610487 1764523 799794347 576419762 770541241 514878454 387564165 760793929 607825979 615882950 453503374 856791829 774547457 699491188 754295194 467918199 830819932 982324705 790513706 554642049 320843099 914127771 17557735 118235440 649661222 56913967 290241444 524750193 670400010 857173885 464982418 397058267 194250631 422452377 504302078 442059146 846403907 887929502 306416768 619522878 630226918 450171014 183636438 972189690 335352504 211894051 828180324 412812988 474125976 866714469 529250041 108117433 497558585 201922809 693094648 165604846 488158075 287682308 210869114 767971858 327891574 345224442 636917203 273310923 955520639 976892844 823141209 155376004 346422433 286895591 775557339 717420070 142074902 19513508 605549374 466948817 6547716 396238937 424030653 9402554 80365221 490341518 946025863 303415634 594352299 788675191 27054130 781029881 981155733 397215834 607472130 895395057 436463633 82668603 359728400 748084380 420079946 688916664 640691033 504743710 391143025 194600234 371594425 939637338 361865016 471672728 768566823 707967387 188096156 388323465 49279158 829530171 77563072 358852381 329246475 496851476 616793762 5093449 846542490 997641155 509902244 828989855 8816954 948373972 192437982 679194064 874329613 155493001 939764274 431290257 145760642 984897755 490103226 396372010 708027474 635442335 170928570 105095797 619623133 105659877 436917145 369467096 666525728 128846166 819681121 111639124 339782961 762424946 805498819 920025967 397557994 367246777 628933913 4856587 810792346 310975627 455165494 885625866 302404766 210344420 818366451 768036612 338735790 432164830 252825400 1297039 260193511 646692359 582555097 266410231 270029276 185650591 213391750 124774661 240055251 561145439 736102845 335931652 383469574 890305148 124502249 880789226 203190637 666483101 441456190 662085855 246156059 859819313 664781011 999649049 448081858 827948107 722062552 918732683 949236304 698549460 256276419 743290628 588273061 360896431 576844686 411570964 542144090 90631186 844692632 833792607 459701968 685862586 89549670 361905067 739276717 204816878 316073307 628924818 537333937 777667531 319640505 375777239 645922138 184788905 210891286 888386582 771956574 562255518 77680828 493119323 824974958 777766962 339111693 828872481 406576758 240934090 435080854 577702716 696232130 303978797 776928492 506882615 443429894 24102246 175194540 33355732 205620228 842778196 481909245 46110509 889908871 875828377 109975556 560022723 277326706 525524091 744282867 310684101 854456975 653915017 610935026 689786488 829425943 33072814 573615000 6719459 505107562 786987268 572875986 991298196 900038607 237937329 446194339 120270672 799964431 237345311 42939526 570792500 73008626 769153671 818362605 563783638 388837314 974708112 85481282 820786858 712062045 86037347 219258399 435693927 896443355 643654373 730871624 99399207 122329083 931293660 804035079 942934815 760069728 826854749 175877681 580426376 849258697 6325557 789452397 418145946 133535410 516795797 282396865 592624095 147477598 948872086 682490728 281184186 688143614 20103317 835561933 686354613 798608740 206011267 327694124 677261084 451514276 439853466 825480341 534264454 956820600 994385183 563105926 833763203 510172855 307467501 341175024 13164714 285270722 419953680 434608437 134765746 960245338 558643665 39616412 53954435 378276898 796724027 171213110 429602304 650782595 397654424 430304657 992740293 961743695 75479641 758666142 99957486 480210964 510723181 724594637 593636680 416752880 686920194 528186134 99929588 199935161 554321956 242078839 492795484 609462957 958048714 945935838 222687358 697976740 501022479 731814466 749806805 637126841 980706296 315529554 33148998 636030300 885381386 771502560 746820682 521507425 589604406 105649631 18352817 864650434 598005478 578689774 285941137 442314287 764990774 591695104 880449841 928642160 172930055 169105089 601623515 42694134 428893549 376863671 314042830 495876936 313737650 443732191 911902443 65529849 120850149 372020426 318365904 472540043 697423606 51837281 545688974 784889303 705280072 790505858 881673746 265665607 595030022 440949083 328184236 308036685 595925074 326507528 287028581 893332622 534351983 644630354 136992977 671427708 793556368 184308283 831648638 17617008 818981495 265689976 349564484 231978366 590833532 88121096 781605370 245554821 347117473 353256261 899734937 26174202 90301016 367089321 613273312 339403702 537410775 520324476 555113476 766677857 764167537 91524650 65641288 116293292 753035291 385695038 972280261 183648434 410826147 337335837 222300917 236928848 859904886 268471964 272610361 711255738 12284004 829178994 281819119 971491827 277704483 15019472 455113008 136544930 291276430 172536603 585816093 8733707 356869304 527888887 472684940 816643649 234625504 7522193 53607676 117401663 1642377 500602857 533170881 604341729 808460193 423964056 298752238 711556205 487963913 855117995 671679796 927826951 826638000 946800345 789211243 411428707 535322250 211540933 648194795 734642431 868584313 314458380 840316969 462612028 368639187 743383140 26713571 687050918 310514437 537734984 445706622 147282435 445965830 74759015 284617236 107009280 615886208 900464996 576951646 891347913 169542034 198420316 911245857 707968867 548959437 60595823 706105832 956137886 444686644 798394971 699514151 222312053 371458591 567091386 915421797 637176420 5192284 11248071 761954006 698828539 53045522 267292899 617537696 486305874 291802864 88334247 388454460 215291676 362646691 71915074 332181691 909056833 951575081 197495698 133698348 516410380 978436298 382780432 202295169 879839233 610909912 607890341 885423425 323869940 827777502 543035076 279004961 50147485 940966274 384805034 900962463 598936134 324091472 908259888 847364120 176163838 318458345 378174622 155703603 27760609 94192893 215570105 881852660 273615420 881235611 417299179 128776073 108301831 967685957 986592167 878062133 817525088 929247378 738850194 608156675 776200289 609489313 382543933 169059361 182158655 543034250 580648989 870138012 731061721 699943265 702603456 222993014 774442994 957601585 717310904 608367064 331574746 179831741 662530643 935502467 347670008 325404343 607253669 312772537 473494551 642811192 128150363 930326241 692147234 740534234 480031550 290826835 985565261 789414698 224820394 375400527 44875991 300676869 888630931 445468763 969809460 742366961 865973588 367005774 948053802 339933720 179065220 219391149 829566700 496818863 192404406 106883766 907735693 305881476 742202510 786819048 721065653 705010450 373336334 725328858 746713485 474766167 974689669 297214813 254421778 543150861 112667044 233331198 499948443 888148003 244780223 275304248 867281889 34109253 479222433 682415209 432661794 935456289 941595970 448529537 515243479 767499692 843779976 744224487 805001912 306967632 376920204 847443453 546865786 267684896 947396902 163433136 919361676 830945325 784650560 788223522 805099117 722020988 279815701 890291943 799263133 275467107 250664395 876703094 217488244 944920 817965473 707437971 645594544 285259007 158866150 345506986 66060184 382590956 772025165 210713196 182759367 230327636 539509597 576709455 950712536 400937344 339609841 782880598 189590958 807151144 290334132 881490274 382829119 930998750 682857576 363366212 451425615 276864418 207934801 410453868 159713819 421891416 788198774 176288152 334777571 92656486 461689544\n2",
        expected: "998704129",
      },
    ],
    hints: [
      "Flip the question: given a gap g, can you place all the sensors so that neighbours are at least g apart?",
      "On sorted posts, greedily put a sensor on the first post, then on each post at least g beyond the last sensor. If that fits enough sensors, g is achievable.",
      "If gap g is achievable, so is every smaller gap. The answers form a yes…yes no…no pattern.",
      "Binary search for the largest achievable gap between 1 and (last − first) / (sensors − 1).",
    ],
    solutions: [
      {
        title: "Try every gap, largest first",
        order: 1,
        intuition:
          "The greedy check answers 'is gap g achievable?' in one pass. Trying every gap from the largest conceivable value downwards finds the answer, but the gaps can number in the hundreds of millions.",
        approach: [
          "Sort the posts.",
          "For g from (last − first) / (sensors − 1) down to 1, run the greedy check.",
          "Return the first g that passes.",
        ],
        code: {
          PYTHON: `def widestSpacing(posts: List[int], sensors: int) -> int:
    ordered = sorted(posts)

    def fits(gap: int) -> bool:
        placed, last = 1, ordered[0]
        for p in ordered[1:]:
            if p - last >= gap:
                placed, last = placed + 1, p
        return placed >= sensors

    gap = (ordered[-1] - ordered[0]) // (sensors - 1)
    while not fits(gap):
        gap -= 1
    return gap`,
          JAVA: `class Solution {
    private int[] ordered;
    private int sensors;

    public int widestSpacing(int[] posts, int sensors) {
        ordered = posts.clone();
        Arrays.sort(ordered);
        this.sensors = sensors;
        int gap = (ordered[ordered.length - 1] - ordered[0]) / (sensors - 1);
        while (!fits(gap)) gap--;
        return gap;
    }

    private boolean fits(int gap) {
        int placed = 1, last = ordered[0];
        for (int i = 1; i < ordered.length; i++) {
            if (ordered[i] - last >= gap) {
                placed++;
                last = ordered[i];
            }
        }
        return placed >= sensors;
    }
}`,
        },
        timeComplexity: "O(n · range)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: ["Two sensors: the answer is the full span."],
        commonMistakes: [
          "Starting the search at a gap that cannot possibly fit, wasting passes.",
        ],
      },
      {
        title: "Optimal: binary search the gap, greedy check",
        order: 2,
        intuition:
          "Placing each sensor as early as allowed never hurts: it leaves the most room for the rest. So the greedy pass decides feasibility exactly. Feasibility is monotonic in the gap, so binary search narrows the gap range in about 30 checks instead of millions.",
        approach: [
          "Sort the posts.",
          "Search gaps in [1, (last − first) / (sensors − 1)] for the largest feasible one.",
          "Use the upper midpoint: if fits(mid), lo = mid, else hi = mid − 1.",
          "fits(gap) greedily places sensors left to right and checks that at least sensors were placed.",
        ],
        code: {
          PYTHON: `def widestSpacing(posts: List[int], sensors: int) -> int:
    ordered = sorted(posts)

    def fits(gap: int) -> bool:
        # Place each sensor on the earliest post the gap allows.
        placed, last = 1, ordered[0]
        for p in ordered[1:]:
            if p - last >= gap:
                placed += 1
                last = p
        return placed >= sensors

    lo, hi = 1, (ordered[-1] - ordered[0]) // (sensors - 1)
    while lo < hi:
        mid = (lo + hi + 1) // 2
        if fits(mid):
            lo = mid       # achievable: try wider
        else:
            hi = mid - 1   # too wide
    return lo`,
          JAVA: `class Solution {
    private int[] ordered;
    private int sensors;

    public int widestSpacing(int[] posts, int sensors) {
        ordered = posts.clone();
        Arrays.sort(ordered);
        this.sensors = sensors;

        int lo = 1, hi = (ordered[ordered.length - 1] - ordered[0]) / (sensors - 1);
        while (lo < hi) {
            int mid = lo + (hi - lo + 1) / 2;
            if (fits(mid)) lo = mid;
            else hi = mid - 1;
        }
        return lo;
    }

    private boolean fits(int gap) {
        int placed = 1, last = ordered[0];
        for (int i = 1; i < ordered.length; i++) {
            if (ordered[i] - last >= gap) {
                placed++;
                last = ordered[i];
            }
        }
        return placed >= sensors;
    }
}`,
        },
        timeComplexity: "O(n log n + n log range)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: [
          "Exactly as many sensors as posts: the answer is the smallest neighbouring gap.",
          "Two sensors: the answer is last − first.",
          "Unsorted input.",
        ],
        commonMistakes: [
          "Forgetting to sort before the greedy check.",
          "Using the lower midpoint with lo = mid, which never terminates.",
          "Starting lo at 0 — gaps of 0 are impossible with distinct posts and only add a wasted step.",
        ],
      },
    ],
    expectedTime: "O(n log n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "fairest-shift-split",
    title: "Fairest Shift Split",
    difficulty: "HARD",
    learningObjective:
      "Replace a partition DP with a binary search over the answer, using a greedy pass to test each candidate cap.",
    topics: ["binary-search"],
    patterns: ["binary-search", "greedy"],
    statement: [
      para(
        "A warehouse has a queue of pallets, each with a handling time, that must be split among a number of workers. Each worker takes one contiguous run of the queue — at least one pallet, in queue order — and the shift ends when the busiest worker finishes."
      ),
      rich(
        "Split ",
        { code: "loads" },
        " into exactly ",
        { code: "workers" },
        " non-empty contiguous parts so that the largest part total is as small as possible, and return that total."
      ),
      example(
        "loads = [4, 9, 3, 6, 2, 8], workers = 3",
        "13",
        [
          { state: "cap 13?", note: "[4, 9] [3, 6, 2] [8] — three workers suffice" },
          { state: "cap 12?", note: "[4] [9, 3] [6, 2] [8] — needs four" },
          { state: "answer 13", note: "the smallest cap that three workers can meet" },
        ],
        "Testing caps on the busiest worker"
      ),
    ],
    constraints: ["1 ≤ workers ≤ loads.length ≤ 1000", "0 ≤ loads[i] ≤ 1000000"],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["loads", "workers"],
      returns: "int",
      functionName: "fairestSplit",
    },
    tests: [
      {
        input: "4 9 3 6 2 8\n3",
        expected: "13",
        isSample: true,
        explanation:
          "[4, 9] | [3, 6, 2] | [8] has largest shift 13, and no split does better.",
      },
      {
        input: "5 5 5\n3",
        expected: "5",
        isSample: true,
        explanation: "One block per worker: each carries 5.",
      },
      { input: "10\n1", expected: "10" },
      { input: "1 2 3 4 5\n1", expected: "15" },
      { input: "0 0 0 7\n2", expected: "7" },
      { input: "1 4 4\n3", expected: "4" },
      { input: "2 3 1 2 4 3 8 1\n4", expected: "8" },
      { input: "7 2 5 10 8 1 1 6 3 9 4 4\n5", expected: "16" },
      {
        input:
          "325850 519805 133597 952807 84576 567702 724087 740249 661457 439781 48566 860702 299130 258341 209819 367361 619659 822658 67744 214035 292172 839529 195743 689639 292170 659418 505174 552899 162887 72857 749255 662346 440851 516789 810318 129888 985657 509852 805705 237455 684643 725367 106472 31514 624923 556194 48718 636533 196468 290028 518012 542212 655360 899904 479232 823562 255680 340774 504182 837041 951876 750756 78965 685277 280763 303777 920298 460447 935855 784460 105115 335701 608739 233046 718064 278457 846019 876036 175843 163749 499174 532515 711046 358947 71976 404921 58586 352183 790615 23314 498145 120701 781838 993529 324831 758555 838551 867794 116972 619177 588883 210165 357751 327920 603537 555677 721227 534811 964110 338528 517253 506521 513325 39356 121248 91729 446744 265203 718541 113457 888968 269503 554556 607222 379758 846909 283036 826062 296010 901625 599941 828216 542240 241916 863216 201786 503877 835361 892703 646010 381698 913017 569313 762056 652061 478764 77138 562365 564413 54194 893032 443270 214740 971591 731115 365235 755067 590503 589451 763232 330125 341308 366494 4139 626418 440692 430474 559216 190285 616932 159836 508206 398967 550122 740924 919972 335145 293296 184736 387239 335658 30927 981037 908010 754236 406493 475671 410263 958092 124438 753380 194051 529186 680538 730368 315838 545691 346537 218032 870461 849657 840721 492278 439436 418446 529440 332510 985061 305554 383859 421729 712281 171882 40370 698493 545531 844043 463522 201058 875841 939217 735271 666526 603037 523201 517417 949936 70479 703752 386316 3984 62970 319537 302319 929105 47839 916611 352491 477239 657879 777183 931754 983515 63662 915501 838004 75388 502226 14128 419630 448535 412476 748426 162059 116564 45342 137205 269084 760672 373799 252105 175149 788731 575017 904941 583908 141820 372154 268609 792522 55622 325623 739367 909280 130524 275889 665989 589332 376110 551499 69595 89689 277325 666340 654371 80459 303945 498655 495065 134869 737366 947040 445147 437710 71268 631631 855246 145002 893732 929681 312567 113130 343651 602568 151827 739932 499660 102643 488644 829710 773696 636079 217809 370882 721391 956327 209595 841354 428055 731058 767498 844268 609321 885998 403621 139125 190857 722270 408689 607862 721319 983958 871383 982611 65885 982923 283700 584093 91023 276364 805631 199605 705425 26122 258239 436059 428093 349656 38503 583144 891852 154841 683509 525724 312200 664370 962001 563368 441940 494667 720243 626956 36085 518621 446601 274526 425683 905898 697328 907841 34306 824854 469536 248221 460537 405096 393187 868969 367375 221728 500011 661821 130185 166363 462416 2600 343440 351776 633317 304438 255152 824627 809027 630417 437922 241644 535072 855508 985613 997800 492389 488453 49972 582612 886976 837799 976041 136196 669733 163382 525881 265463 687761 995064 9898 839625 483302 653295 50366 971589 468903 625705 223118 953764 407265 142652 442556 778125 319403 659185 625588 42554 985674 46444 206508 865234 950596 403353 115268 819509 73860 452621 810597 774649 687398 442683 840199 982870 921722 32843 964073 280004 949189 504010 838485 153071 634726 226777 15744 702437 183435 337018 75217 879288 232681 449351 47130 896816 210489 522800 194226 389664 302673 566438 868247 231461 908586 224291 715849 369682 564547 289191 563066 597736 463697 412227 567699 491134 792806 48530 222232 619745 478640 823778 638374 782778 499759 144426 884528 267979 248389 271547 276879 863473 739980 407481 834917 448645 993828 913387 370096 907983 897750 339129 497731 678136 119862 618783 356914 284983 483652 172660 126956 259751 319000 537055 811992 419725 470424 689846 632228 237379 381759 986717 749040 818943 528105 696313 771090 954759 222479 514419 355215 302174 409555 301493 298422 740132 123005 428252 597592 50948 55344 258625 788844 224826 902108 301645 301910 998917 12778 395081 145197 347943 735939 821551 760304 839512 1818 885131 785137 956572 863914 121430 983617 547362 918144 667068 596226 13107 132649 734208 646295 178339 747603 84498 788348 157984 506680 548264 62460 309530 270590 773809 70557 382885 955975 889734 829713 189227 84982 91545 237928 997338 843647 890867 949410 435692 530441 165930 248821 708382 207749 638611 263130 108083 71840 544365 183879 868944 85023 460489 230265 291991 496498 665944 971087 837426 103411 561807 463118 617093 861577 25207 832646 90141 548802 655504 298003 175015 372879 547305 651018 5935 192237 67062 577546 958530 484509 878340 352066 540365 198325 370745 993354 979364 155440 681452 156978 856466 797844 818 791415 964770 374258 45956 639775 375176 292236 672092 427631 561830 772718 380954 844186 362408 974576 489862 550965 379323 681216 116538 411795 235255 446572 498374 325906 918796 377061 434324 922615 664054 220774 985022 457173 734624 347581 833577 354533 771079 777500 248707 573066 785098 521483 913116 674988 714419 481494 990519 204739 347599 179930 646792 190015 157995 343218 170599 408093 114611 129662 433655 667134 774931 224480 379836 696521 393164 620558 331802 916023 152970 481601 423845 256117 540306 114559 622769 343179 379765 778328 363731 985289 326238 660753 235745 561798 741006 512220 926382 913279 564151 885001 149163 190717 316402 933664 25483 297183 122617 897563 449620 772301 817459 864931 744551 458108 611218 832109 75606 428969 506856 942011 49545 38839 65240 787706 731608 257276 441957 801229 701276 218148 929315 622566 253160 179083 681316 819229 92400 397746 930047 990273 849848 699610 66321 134283 410426 448134 510893 450774 184477 819750 163447 210952 874548 480974 470058 598559 133319 351532 352395 36103 367318 13037 850703 817262 873331 849645 491150 955589 452933 874668 487250 906825 464064 564641 821438 953859 337560 119885 115979 646043 734066 997446 839609 48166 246971 526871 433898 323008 565053 999972 324042 493960 550091 73169 638389 435369 718237 664636 191728 367838 985794 671691 297239 490566 222199 877672 365819 616777 355136 556329 883447 954358 906584 993304 91512 637466 116157 771669 59368 78911 442549 46816 896431 908252 401959 498378 931647 985698 528474 101041 936920 309399 423360 23838 481654 983472 3959 398826 378743 342391 714483 251347 662340 378107 243926 93349 883854 858040 276044 957803 260192 707973 515364 24038 346184 490698 236332 225034 196320 719221 432245 450212 655419 721097 26461 872145 89008 624129 853249 238906 484283 230624 865768 249838 47896 727871 369845 787459 544666 262121 263489 43833 522983 60972 803647 864654 331327 352575 122985 477843 630317 860571 88117 73123 904197 237337 61188 704391 257628 143857 974790 893008 773636 298916 555987 701436 514346 126170 333880 974404 334936 444879 604169 90757 686716 86198 96545 701611 242426 185671 453897 300344 698483 157872 331651 741151 807207 138679 953008 757803 250777 634960 676711 290753 556918 419630 203271 665849 880701 901188 795813 521405 861805 455308 600075 79450 155344\n17",
        expected: "29771480",
      },
      {
        input:
          "265 597 758 510 139 778 244 305 373 961 457 451 162 608 946 593 775 860 539 890 535 336 546 319 815 659 670 557 558 374 234 705 406 755 229 332 502 171 867 525 340 18 922 965 394 868 869 183 989 567 683 210 301 377 337 285 751 428 973 467 322 141 186 168 286 858 516 854 483 444 272 463 665 887 509 393 286 394 319 418 993 102 608 617 343 781 901 652 26 590 128 264 136 846 972 793 439 573 772 368 868 911 687 247 147 838 118 254 705 629 232 453 68 557 980 556 502 650 690 887\n9",
        expected: "7380",
      },
    ],
    hints: [
      "The answer is at least the largest single load and at most the total of all loads.",
      "Fix a cap C. Walk the queue, giving pallets to the current worker until the next one would push them over C, then start a new worker. How many workers did you need?",
      "If cap C needs at most `workers` workers, any larger cap does too. Splitting into fewer parts is fine, because a part can always be split further without exceeding C.",
      "Binary search the smallest feasible cap between max(loads) and sum(loads).",
    ],
    solutions: [
      {
        title: "Partition DP",
        order: 1,
        intuition:
          "best[p][i] is the smallest possible busiest-worker total when the first i pallets go to p workers. The last worker takes pallets j..i−1 for some j, so best[p][i] = min over j of max(best[p − 1][j], sum(j..i−1)). Prefix sums make each range total O(1), but the triple loop is still O(workers · n²).",
        approach: [
          "Build prefix sums of the loads.",
          "best[0][0] = 0; everything else starts at infinity.",
          "For each p from 1 to workers and each i, try every split point j and keep the minimum of max(best[p − 1][j], prefix[i] − prefix[j]).",
          "Return best[workers][n].",
        ],
        code: {
          PYTHON: `def fairestSplit(loads: List[int], workers: int) -> int:
    n = len(loads)
    prefix = [0]
    for x in loads:
        prefix.append(prefix[-1] + x)

    INF = float("inf")
    best = [[INF] * (n + 1) for _ in range(workers + 1)]
    best[0][0] = 0
    for p in range(1, workers + 1):
        for i in range(1, n + 1):
            for j in range(p - 1, i):
                best[p][i] = min(best[p][i], max(best[p - 1][j], prefix[i] - prefix[j]))
    return best[workers][n]`,
          JAVA: `class Solution {
    public int fairestSplit(int[] loads, int workers) {
        int n = loads.length;
        long[] prefix = new long[n + 1];
        for (int i = 0; i < n; i++) prefix[i + 1] = prefix[i] + loads[i];

        long INF = Long.MAX_VALUE;
        long[][] best = new long[workers + 1][n + 1];
        for (long[] row : best) Arrays.fill(row, INF);
        best[0][0] = 0;
        for (int p = 1; p <= workers; p++) {
            for (int i = 1; i <= n; i++) {
                for (int j = p - 1; j < i; j++) {
                    if (best[p - 1][j] == INF) continue;
                    best[p][i] = Math.min(best[p][i], Math.max(best[p - 1][j], prefix[i] - prefix[j]));
                }
            }
        }
        return (int) best[workers][n];
    }
}`,
        },
        timeComplexity: "O(workers · n²)",
        spaceComplexity: "O(workers · n)",
        edgeCases: [
          "workers = n: every pallet alone, so the answer is the largest load.",
        ],
        commonMistakes: [
          "Letting j start below p − 1, which would leave some worker empty.",
        ],
      },
      {
        title: "Optimal: binary search the cap",
        order: 2,
        intuition:
          "For a fixed cap, the greedy pass — keep loading the current worker until the next pallet would overflow — uses the fewest workers possible. Feasibility only improves as the cap grows, so the smallest feasible cap can be binary searched between the largest single load and the total.",
        approach: [
          "Set lo = max(loads), hi = sum(loads).",
          "needed(cap): walk the loads, starting a new worker whenever the running total would exceed cap; return the number of workers used.",
          "While lo < hi: mid = (lo + hi) / 2; if needed(mid) ≤ workers, hi = mid, else lo = mid + 1.",
          "Return lo.",
        ],
        code: {
          PYTHON: `def fairestSplit(loads: List[int], workers: int) -> int:
    def needed(cap: int) -> int:
        used, current = 1, 0
        for load in loads:
            if current + load > cap:
                used += 1        # this pallet starts a new worker's run
                current = load
            else:
                current += load
        return used

    lo, hi = max(loads), sum(loads)
    while lo < hi:
        mid = (lo + hi) // 2
        if needed(mid) <= workers:
            hi = mid             # feasible: try a tighter cap
        else:
            lo = mid + 1
    return lo`,
          JAVA: `class Solution {
    public int fairestSplit(int[] loads, int workers) {
        int lo = 0, hi = 0;
        for (int load : loads) {
            lo = Math.max(lo, load);
            hi += load;
        }
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (needed(loads, mid) <= workers) hi = mid;
            else lo = mid + 1;
        }
        return lo;
    }

    private int needed(int[] loads, int cap) {
        int used = 1, current = 0;
        for (int load : loads) {
            if (current + load > cap) {
                used++;
                current = load;
            } else {
                current += load;
            }
        }
        return used;
    }
}`,
        },
        timeComplexity: "O(n log(sum))",
        spaceComplexity: "O(1)",
        edgeCases: [
          "One worker: the answer is the total.",
          "As many workers as pallets: the answer is the largest pallet.",
          "Zero-time pallets, which never force a new worker.",
        ],
        commonMistakes: [
          "Starting lo at 0 or 1 instead of the largest load, so the greedy pass is asked to fit a pallet bigger than the cap.",
          "Treating needed(cap) < workers as infeasible — using fewer workers is fine, since a run can always be split further.",
        ],
      },
    ],
    expectedTime: "O(n log(sum))",
    expectedSpace: "O(1)",
  },

  // ---------------------------------------------------------------------------
  // Tries and prefix structures
  // ---------------------------------------------------------------------------
  {
    slug: "shared-label-prefix",
    title: "Shared Label Prefix",
    difficulty: "EASY",
    learningObjective:
      "See a common prefix as the single-branch stem at the top of a trie, then walk that stem directly with a column scan.",
    topics: ["tries", "strings"],
    patterns: ["trie"],
    statement: [
      para(
        "A warehouse prints shelf labels, and the team wants to know the longest leading text every label shares so it can be printed once on the aisle sign instead."
      ),
      rich(
        "Return the longest string that is a prefix of every label in ",
        { code: "labels" },
        ". If they share nothing, return the empty string (the output line is blank)."
      ),
      example(
        'labels = ["interstate", "internal", "interval"]',
        '"inter"',
        [
          { state: "column 0..4", note: "i, n, t, e, r — every label agrees" },
          { state: "column 5", note: "s, n, v — disagreement, stop" },
        ],
        "Scanning column by column"
      ),
    ],
    constraints: [
      "1 ≤ labels.length ≤ 200",
      "0 ≤ labels[i].length ≤ 200",
      "Labels contain only lowercase English letters.",
    ],
    signature: {
      params: ["string[]"],
      paramNames: ["labels"],
      returns: "string",
      functionName: "sharedPrefix",
    },
    tests: [
      {
        input: "3\ninterstate\ninternal\ninterval",
        expected: "inter",
        isSample: true,
        explanation:
          'All three begin with "inter"; the sixth letters s, n and v differ.',
      },
      {
        input: "2\nnorth\nsouth",
        expected: "",
        isSample: true,
        explanation:
          "The first letters already differ, so the shared prefix is empty and the output line is blank.",
      },
      { input: "1\nsolo", expected: "solo" },
      { input: "3\nabc\nabc\nabc", expected: "abc" },
      { input: "3\nab\nabc\na", expected: "a" },
      { input: "2\n\nabc", expected: "" },
      { input: "4\nprefix\npre\nprefixed\npreview", expected: "pre" },
      {
        input:
          "3\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxa\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxb\nxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
        expected:
          "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx",
      },
    ],
    hints: [
      "The answer can never be longer than the shortest label.",
      "Compare the labels one character position at a time.",
      "Stop at the first position where some label ends or disagrees with the first label.",
      "In a trie of all the labels, the answer is the path from the root while each node has exactly one child and no label ends there.",
    ],
    solutions: [
      {
        title: "Build a trie and walk its stem",
        order: 1,
        intuition:
          "Insert every label into a trie. Every label passes through the shared prefix, so near the root the trie is a single stem. The stem ends where the trie branches or where some label finishes. Walking it spells the answer — but building the whole trie costs memory proportional to all the text.",
        approach: [
          "Insert each label into a trie of nested dictionaries, marking where labels end.",
          "From the root, while the node has exactly one child and no label ends there, step into the child and append its letter.",
          "Return the collected letters.",
        ],
        code: {
          PYTHON: `def sharedPrefix(labels: List[str]) -> str:
    END = "$"
    root = {}
    for label in labels:
        node = root
        for ch in label:
            node = node.setdefault(ch, {})
        node[END] = True

    prefix = []
    node = root
    while len(node) == 1 and END not in node:
        ch = next(iter(node))
        prefix.append(ch)
        node = node[ch]
    return "".join(prefix)`,
          JAVA: `class Solution {
    private static class Node {
        Node[] next = new Node[26];
        int children = 0;
        boolean end = false;
    }

    public String sharedPrefix(String[] labels) {
        Node root = new Node();
        for (String label : labels) {
            Node node = root;
            for (char ch : label.toCharArray()) {
                int k = ch - 'a';
                if (node.next[k] == null) {
                    node.next[k] = new Node();
                    node.children++;
                }
                node = node.next[k];
            }
            node.end = true;
        }

        StringBuilder prefix = new StringBuilder();
        Node node = root;
        while (node.children == 1 && !node.end) {
            for (int k = 0; k < 26; k++) {
                if (node.next[k] != null) {
                    prefix.append((char) ('a' + k));
                    node = node.next[k];
                    break;
                }
            }
        }
        return prefix.toString();
    }
}`,
        },
        timeComplexity: "O(total characters)",
        spaceComplexity: "O(total characters) for the trie",
        edgeCases: [
          "An empty label, which ends at the root and forces an empty answer.",
        ],
        commonMistakes: ["Continuing past a node where a label ends."],
      },
      {
        title: "Optimal: column scan against the first label",
        order: 2,
        intuition:
          "The trie's stem is just the positions where every label has the same letter. Read those positions directly: take each character of the first label and check that every other label has the same character there. The first mismatch or short label ends the stem — and nothing needs to be stored.",
        approach: [
          "For each index i and character ch of the first label:",
          "for every other label, if it is too short or its i-th character differs, return the first label cut to length i.",
          "If the loop finishes, the whole first label is shared: return it.",
        ],
        code: {
          PYTHON: `def sharedPrefix(labels: List[str]) -> str:
    first = labels[0]
    for i, ch in enumerate(first):
        for other in labels[1:]:
            if i == len(other) or other[i] != ch:
                return first[:i]
    return first`,
          JAVA: `class Solution {
    public String sharedPrefix(String[] labels) {
        String first = labels[0];
        for (int i = 0; i < first.length(); i++) {
            char ch = first.charAt(i);
            for (int j = 1; j < labels.length; j++) {
                if (i == labels[j].length() || labels[j].charAt(i) != ch) {
                    return first.substring(0, i);
                }
            }
        }
        return first;
    }
}`,
        },
        timeComplexity:
          "O(total characters) in the worst case, and it stops at the first mismatch",
        spaceComplexity: "O(1) beyond the answer",
        edgeCases: [
          "A single label: it is its own shared prefix.",
          "Identical labels.",
          "One label is a prefix of the others.",
          "An empty label.",
        ],
        commonMistakes: [
          "Indexing past the end of a shorter label.",
          "Scanning label by label instead of column by column, which reads more than needed when the first letters already differ.",
        ],
      },
    ],
    expectedTime: "O(total characters)",
    expectedSpace: "O(1)",
  },

  {
    slug: "prefix-tally",
    title: "Prefix Tally",
    difficulty: "MEDIUM",
    learningObjective:
      "Store a pass-through count on every trie node so that each prefix query costs only the length of the prefix.",
    topics: ["tries"],
    patterns: ["trie"],
    statement: [
      para(
        "A search box shows, as the user types, how many catalogue entries begin with what they have typed so far. The catalogue is fixed; the typed prefixes arrive as a batch to answer."
      ),
      rich(
        "Given ",
        { code: "words" },
        " and ",
        { code: "prefixes" },
        ", return an array whose i-th value is the number of words that begin with ",
        { code: "prefixes[i]" },
        ". A word counts as beginning with itself, and repeated words count each time they appear."
      ),
      example(
        'words = ["cart", "care", "cat", "dog"], prefixes = ["ca", "car", "d", "x"]',
        "[3, 2, 1, 0]",
        [
          { state: "c → a", note: "three words pass through this node" },
          { state: "c → a → r", note: "two words pass through" },
          { state: "d", note: "one word" },
          { state: "x", note: "no such child: zero" },
        ],
        "Reading pass-through counts off the trie"
      ),
    ],
    constraints: [
      "1 ≤ words.length, prefixes.length ≤ 10000",
      "1 ≤ words[i].length, prefixes[i].length ≤ 20",
      "All strings contain only lowercase English letters.",
    ],
    signature: {
      params: ["string[]", "string[]"],
      paramNames: ["words", "prefixes"],
      returns: "int[]",
      functionName: "prefixTally",
    },
    tests: [
      {
        input: "4\ncart\ncare\ncat\ndog\n4\nca\ncar\nd\nx",
        expected: "3 2 1 0",
        isSample: true,
        explanation:
          "ca matches cart, care and cat; car matches cart and care; d matches dog; x matches nothing.",
      },
      {
        input: "3\nnote\nnote\nno\n2\nno\nnote",
        expected: "3 2",
        isSample: true,
        explanation: "Repeated words count each time they appear.",
      },
      { input: "1\na\n3\na\nab\nb", expected: "1 0 0" },
      {
        input: "5\napple\napply\nape\napex\nbat\n7\nap\napp\napple\napplex\nb\nbat\nc",
        expected: "4 2 1 0 1 1 0",
      },
      { input: "3\nzz\nz\nzzz\n4\nz\nzz\nzzz\nzzzz", expected: "3 2 1 0" },
      {
        input:
          "400\nccaa\naa\nccabbbac\ncbca\nbcbb\nb\nab\nbbcb\ncbaaa\nbbac\ncaabcaa\nc\nba\nbbbacbab\ncb\na\ncaca\ncbacaaca\nccb\nbaccabb\nb\nccbbbbac\nbbab\na\ncbb\nacc\nccbbcc\nccaabb\nbbc\nacccb\ncaccbca\nb\ncbbcaac\nccabac\nc\ncaa\nabb\nbbcbcc\na\nbacbbc\nabcabbcb\nccacba\nca\nbaaaccab\ncaaac\nbbbc\naccbbaa\nbaaa\nbc\ncbcacbba\naabca\nbccabca\ncbcab\ncbaacaba\nc\nacbaab\nbbcbcb\naabaabbc\ncaca\nb\ncbbb\ncc\naabc\naba\nca\ncbbac\naccaccb\nbaab\ncacbbbc\nabbbbcab\ncc\nb\ncb\nb\nc\nbbabbcac\nb\nbcb\nbbac\nbbbaaa\nccccb\naaacccb\ncbbcba\na\naccaaa\ncccccbc\nbabac\nbaacbba\ncaa\nab\ncbb\ncbbc\ncbccba\nbcc\nccbbbb\nb\nbcbb\ncaacc\nc\nbbbccbb\nacbbbca\nbbbbbaa\nbca\nacbaab\nccc\naa\nbb\nbcb\nacbbaacb\nbc\ncacbba\nb\nbbcccbbb\nabccaaab\naabc\nabcca\nccca\nabababbb\nb\nac\nbb\naaba\nbcccc\ncbaccb\ncaca\nbbaac\na\naaabbb\nccb\naabbbbca\nbc\nab\ncba\na\nbcac\ncb\naacacbac\nbbbcbbac\ncba\nb\nbba\nbaabcbac\ncbbbaac\ncaaaaba\nbacba\nb\nbcacbcac\nc\nabbbbbcb\nbbabb\nabccbacc\nbbcbcbca\nbb\ncaacacb\nc\nabcbcc\naa\ncbacbc\na\nca\ncabcbacb\ncaca\nbbb\nacabaacc\ncba\nca\nbbaaaba\nbcacaa\nabbb\naacaabc\nbbc\ncbb\ncc\nbacb\nacccacab\nc\nbbbbca\naacac\ncabbb\ncbac\nb\na\nbbca\nbcb\nabbacca\nabbaab\naaaab\nabaccaac\nbbcba\nbbbaca\nabac\nc\nbaabab\ncca\naaa\nbc\ncaab\nabbaabab\ncabbcaa\nbcacca\ncbc\naabc\nb\nabab\nbcacc\nbc\naa\nbacb\nbbaccbbc\nba\nabcccabb\nabbbcb\nbacc\nbac\naaa\nbb\ncb\naccccbab\ncaacabcc\nacaacb\nabaaba\nbccacbc\ncccbc\ncccb\ncc\nbaabbb\ncbcc\nccac\naabbcaac\ncbaabb\nccbcb\nac\nacbbca\nb\naacbabcb\nabcbbc\nbccb\ncaaa\nabcccaac\nacbbbaa\naccaacb\nbcabcab\naa\naab\nacbb\na\nabaabb\ncbbbaca\nbaba\na\nacab\ncaac\naaac\naccaccb\ncbca\ncb\nacccbcb\nacc\nacccb\na\ncbcbab\ncbabc\nbbcaab\nbcaccba\nacaaac\nca\nbacaacb\nbb\nbaab\nbbcbb\ncbcab\nccbbca\nbcb\nb\nca\ncaac\ncaccbc\naabaccaa\nccaccaac\ncbbcac\ncab\ncbaacc\naacccbca\naa\ncccbcc\nacaab\ncac\nbac\ncbbb\ncbac\nb\nbbcb\nccacbaa\ncbabb\nbbbcbc\nc\ncaaa\naa\naccbca\nabbabc\nacaabc\nc\nc\nbcbca\naaabc\nbcbcaa\nbaca\nc\nb\nbbacca\nb\na\nabaa\nca\nbccc\ncccb\nbcabbcb\nbc\nccaacbaa\nbbcccaa\nabcacc\nacaaba\nc\ncbaac\nccca\nc\nabcacaac\nbb\nc\nbbcab\nccccbacc\ncaaccabc\nbb\naabaa\nab\nabcbcac\ncbac\nb\na\ncc\nacac\ncbbba\nca\nbc\ncacbaa\ncac\naabbca\ncaacbaca\nccac\nbac\naacccb\nc\ncabccaa\nab\naaa\naababb\naa\nbcbb\nbacbab\nbbcbabc\nac\ncaaccaac\naaca\nbaaabbac\nbcc\ncaaab\nabccb\nbbcb\ncba\nccbccbac\nbbbacb\nbacbca\nbcbbcb\naaac\nbba\nbac\nacb\nb\nabbac\na\nccaacaac\nbbaa\nbbcbaa\nbaabacc\ncab\ncb\na\nbaa\ncac\naaaac\nacbacca\naac\na\nb\ncc\naa\nbcaaabb\nc\nacbcacb\nb\n300\ncc\nbc\naaab\nacbc\nab\nccb\nc\nbacc\ncc\nabcc\ncacc\nab\nbcb\nacac\nbac\nbacc\nabca\ncab\nc\ncccc\nacb\na\nac\naab\nc\na\nbaca\ncc\ncbba\ncbaa\nbca\ncaac\nbbaa\nabc\ncc\nca\ncac\ncca\ncc\nbc\nb\na\nba\nbcc\nb\nb\ncacb\nc\ncb\ncaaa\naacb\nb\naab\nc\nccbc\nb\nb\nca\nbbab\naaba\na\na\nabca\ncca\nacbb\nbbc\nca\ncbca\ncaa\ncba\nb\nabc\nb\nb\ncb\nab\ncac\nbb\nc\nacbb\nccc\na\nac\naca\nbba\na\nabcb\ncb\nacca\nbba\nab\ncbb\nbb\nb\nbaa\nb\ncbca\nbb\naba\nacb\naaab\nb\nbaab\nacb\ncb\ncbc\nbc\ncca\naac\ncb\nbcc\nca\nab\na\na\nbbc\na\nba\ncc\nba\nc\nabca\ncc\na\nc\nc\nbac\nacc\nc\nb\nbc\nab\nca\ncc\nccac\naa\nbb\nbac\nbcbc\ncc\nbccc\ncc\nca\nacc\nacb\nc\nc\na\na\ncbac\nbba\na\nbc\naca\nacbb\nb\na\nbab\nb\nbbb\nbcac\nbaab\naa\nc\nc\nb\nbc\nbcb\nabba\nbacc\nb\nac\naca\ncb\ncb\naca\na\nbaac\na\ncc\nccb\na\ncc\ncbb\nabba\naa\nab\naabc\nbcc\nca\na\naa\nb\naba\nc\ncbab\nccb\nccab\nb\nab\naabc\nbaa\nabaa\nc\nbc\ncac\nacc\nac\nb\nbba\nbba\nbba\nc\ncbba\nab\nccaa\nc\nbb\naa\nab\nbbcb\ncc\na\ncaca\nacac\nb\naaca\nb\nab\nc\nbb\nbba\na\nb\nccc\nac\nbbb\nbb\ncc\na\nccbb\na\naac\na\nb\naab\nacba\ncb\naabc\ncba\nb\naab\nbaac\nca\nbac\na\na\nb\nb\na\nc\nabab\nac\naabb\nccba\nabac\ncab\nbb\na\na\ncb\naaa\ncc\nacc\ncbc\nbaac\nab\nbb\nac\nbaca\ncca\na\nabb\na\nca\ncabb\nc\nc\nabc\nbb\nabc\nbca\ncbaa\nabc\nbbab\ncc\nc\na\nbcc\nbaa",
        expected:
          "36 34 2 1 35 8 142 2 36 6 2 35 10 1 14 2 3 6 142 3 10 125 34 13 142 125 2 36 1 5 10 8 3 12 36 43 12 12 36 34 133 125 29 7 133 133 3 142 45 5 1 133 13 142 2 133 133 43 3 5 125 125 3 12 5 17 43 5 17 17 133 12 133 133 45 35 12 47 142 5 10 125 34 8 12 125 3 45 4 12 35 13 47 133 11 133 5 47 8 10 2 133 6 10 45 9 34 12 8 45 7 43 35 125 125 17 125 29 36 29 142 3 36 125 142 142 14 13 142 133 34 35 43 36 5 40 47 14 2 36 2 36 43 13 10 142 142 125 125 6 12 125 34 8 5 133 125 2 133 11 6 6 40 142 142 133 34 10 5 2 133 34 8 45 45 8 125 1 125 36 8 125 36 13 5 40 35 4 7 43 125 40 133 8 142 2 8 2 133 35 4 11 3 142 34 12 13 34 133 12 12 12 142 1 35 4 142 47 40 35 10 36 125 4 1 133 4 133 35 142 47 12 125 133 10 34 11 47 36 125 4 125 8 125 133 13 3 45 4 17 133 13 1 43 14 125 125 133 133 125 142 2 34 3 0 2 6 47 125 125 45 10 36 13 9 1 35 47 34 2 12 125 10 125 43 2 142 142 12 47 12 10 5 12 3 36 142 125 7 11",
      },
    ],
    hints: [
      "Checking every word against every prefix works, but costs words × prefixes comparisons.",
      "Words that share a prefix share a path in a trie.",
      "When inserting a word, increment a counter on every node you pass through.",
      "To answer a prefix, walk its letters from the root and read the counter where you stop — or 0 if the path breaks.",
    ],
    solutions: [
      {
        title: "Compare every word with every prefix",
        order: 1,
        intuition:
          "For each prefix, test each word with a starts-with check. Simple and correct, but ten thousand prefixes against ten thousand words is a hundred million comparisons.",
        approach: [
          "For each prefix, count the words that start with it.",
          "Collect the counts in order.",
        ],
        code: {
          PYTHON: `def prefixTally(words: List[str], prefixes: List[str]) -> List[int]:
    return [sum(1 for w in words if w.startswith(p)) for p in prefixes]`,
          JAVA: `class Solution {
    public int[] prefixTally(String[] words, String[] prefixes) {
        int[] counts = new int[prefixes.length];
        for (int i = 0; i < prefixes.length; i++) {
            for (String w : words) if (w.startsWith(prefixes[i])) counts[i]++;
        }
        return counts;
    }
}`,
        },
        timeComplexity: "O(words · prefixes · L)",
        spaceComplexity: "O(1) beyond the output",
        edgeCases: ["A prefix longer than every word."],
        commonMistakes: [
          "Counting distinct words only, when duplicates should each count.",
        ],
      },
      {
        title: "Optimal: trie with pass-through counts",
        order: 2,
        intuition:
          "Insert every word into a trie and bump a counter on each node along its path. A node's counter is then exactly the number of words whose first few letters spell the path to it. Answering a prefix is a walk of at most twenty steps.",
        approach: [
          "Each trie node holds 26 child links and a pass count.",
          "Insert each word, incrementing the pass count of every node it reaches (not the root).",
          "For each prefix, walk from the root; if a letter has no child, the answer is 0, otherwise it is the pass count of the final node.",
        ],
        code: {
          PYTHON: `def prefixTally(words: List[str], prefixes: List[str]) -> List[int]:
    children = [[-1] * 26]  # node 0 is the root
    passing = [0]

    for word in words:
        node = 0
        for ch in word:
            k = ord(ch) - 97
            if children[node][k] == -1:
                children[node][k] = len(children)
                children.append([-1] * 26)
                passing.append(0)
            node = children[node][k]
            passing[node] += 1   # one more word runs through here

    answers = []
    for prefix in prefixes:
        node = 0
        for ch in prefix:
            node = children[node][ord(ch) - 97]
            if node == -1:
                break
        answers.append(0 if node == -1 else passing[node])
    return answers`,
          JAVA: `class Solution {
    private static class Node {
        Node[] next = new Node[26];
        int passing = 0;
    }

    public int[] prefixTally(String[] words, String[] prefixes) {
        Node root = new Node();
        for (String word : words) {
            Node node = root;
            for (char ch : word.toCharArray()) {
                int k = ch - 'a';
                if (node.next[k] == null) node.next[k] = new Node();
                node = node.next[k];
                node.passing++;
            }
        }

        int[] answers = new int[prefixes.length];
        for (int i = 0; i < prefixes.length; i++) {
            Node node = root;
            for (char ch : prefixes[i].toCharArray()) {
                node = node.next[ch - 'a'];
                if (node == null) break;
            }
            answers[i] = node == null ? 0 : node.passing;
        }
        return answers;
    }
}`,
        },
        timeComplexity: "O(total characters of words and prefixes)",
        spaceComplexity: "O(total characters of words) for the trie",
        edgeCases: [
          "A prefix equal to a whole word.",
          "A prefix that leaves the trie part-way.",
          "Duplicate words.",
        ],
        commonMistakes: [
          "Counting only words that end at a node, instead of all words that pass through it.",
          "Reading a child of a missing node when the prefix leaves the trie part-way, instead of answering 0.",
        ],
      },
    ],
    expectedTime: "O(total characters)",
    expectedSpace: "O(total characters)",
  },

  {
    slug: "root-shorthand",
    title: "Root Shorthand",
    difficulty: "MEDIUM",
    learningObjective:
      "Use a trie to find the shortest dictionary entry that prefixes a word in a single left-to-right walk.",
    topics: ["tries", "strings"],
    patterns: ["trie"],
    statement: [
      para(
        "A note-taking app compresses text by replacing each word with a registered root — a short stem the word begins with. When several roots fit a word, the shortest one is used. Words with no matching root are left alone."
      ),
      rich(
        "Given ",
        { code: "roots" },
        " and a ",
        { code: "sentence" },
        " of lowercase words separated by single spaces, return the sentence with every word replaced by its shortest root."
      ),
      example(
        'roots = ["re", "pre", "un"], sentence = "unwind before rerun prepay"',
        '"un before re pre"',
        [
          { state: "unwind", note: "u → n hits the end of root un" },
          { state: "before", note: "no root starts with b — keep the word" },
          { state: "rerun", note: "r → e hits the end of re" },
          { state: "prepay", note: "p → r → e hits the end of pre" },
        ],
        "Walking each word down the root trie"
      ),
    ],
    constraints: [
      "1 ≤ roots.length ≤ 1000, 1 ≤ roots[i].length ≤ 50",
      "1 ≤ sentence.length ≤ 100000",
      "Words and roots contain only lowercase English letters; words are separated by single spaces.",
    ],
    signature: {
      params: ["string[]", "string"],
      paramNames: ["roots", "sentence"],
      returns: "string",
      functionName: "shortenWithRoots",
    },
    tests: [
      {
        input: "3\nre\npre\nun\nunwind before rerun prepay",
        expected: "un before re pre",
        isSample: true,
        explanation: "unwind → un, before keeps its form, rerun → re, prepay → pre.",
      },
      {
        input: "2\na\nab\nabc bca",
        expected: "a bca",
        isSample: true,
        explanation:
          "Both roots are prefixes of abc; the shorter one, a, wins. bca has no root.",
      },
      { input: "1\nx\nx", expected: "x" },
      { input: "3\ncat\nca\nc\ncatalog cart dog", expected: "c c dog" },
      {
        input: "2\nlong\nlonger\nlo longest longerish long",
        expected: "lo long long long",
      },
      { input: "1\nabc\nab abd abcd", expected: "ab abd abc" },
      {
        input:
          "60\ncc\nc\nccb\ncaca\nac\nbaa\na\naccb\nc\nbcc\naa\nacc\ncb\nac\nccbc\ncbcc\nca\nc\nacc\ncabc\na\naa\nb\na\nccb\nc\nb\ncbc\nca\na\ncbb\nb\nba\na\ncaba\nacb\nc\nba\naa\naaaa\na\naaa\nb\naa\naa\naac\nb\nbca\nb\nbcc\nac\nbc\nb\nbb\nabcc\nab\nbcb\nbaa\nacca\naccc\naacaaa aabcb bba baa b baac a abbc aacbcab bbba ba ab cbaabccba cabbacba bbcccc abc cbcaa aabcab ccacb bbbbca caaa bbac ccaaaac cacaabb acbcb bccb bab abcbc babaabbb a ba cb bcabac bbbc aaaacbacb acbbbaa cacb cccbc babbab cccaa b baa cbba aac cbb bbc ccba acbaac c bab accc aa c bbbaaaaab baa cacabcaba ccaa bbb bccc b cc a bcacc bcc ccc acbbbac abaaab caaabba bbcbbcca bbccbac c aaabb a ccaca ba abcabbc cbbaa babaa bacbbc bcac c aacbcccab cabacb cb cacacbaab aaab bbcbcacba abab ababacccb bcaacbaba aabcba cbabbb bbbaca bbaabc bac baacc bcabba abcabc baabc ac cbbaccba bacb cbcac baab bcb c bb c cac baaaabc baba abc cabcb baca baaab acacb aaccba abacaaa bcccba bbacbc cab baababcb cacbaaac ccbccca cbcbcca ac acbacbc bacbab abbcbabc ccabbabcc bbcbb cbcb aaacacaac baccc bcb bccbca bbcbb c acaaccb cc c aca aacc ab b bcba cccacac baabaab ccacbb babac cbbabbcc cbcbbbca bcbcaa acccb ca aacab cbbcccaab cccacaa cccbcaa bcabcbba bcaa b abababc abc bbb abc ababacb acabbbccc bbcb cc abbaabbcc accaccab cb cacbc bacacaabb bcc b ccca caa bbbaa cacb bbaccb bcaaacaaa bcaaaba bbccccc cb cabb bbbabcb bbcbbb acbb cacbacc caabbbcbc acbbacbcb bab bcb acaabac bacccbcc bbaaccaaa cabbacaa aaccbbc aca ccbccbba abcbcbc cccc cbcabcac bcbaa bbcbcaaab abbabab cccccaab acaacccab abababcb aaaa abaacca ccabcbab ccabbb bccbaca ba aaabba acacccc caac bcc aabc ccbbababa cabacaa bacbb c aabcb bcbcccbba bbabaaba aabcccac cbacccca ba ccbabbb bc aaaabbaa aa bbc acb bbcbc ab cccbc bccbc a cbaaccaac abccc caccabb acac bac abccb ccbca cbcbcaac aacbacc acbbabb bccccac abbbc c c cacaa caaaacb baa bbcac cababa ac cabaccba cc aaaacac ba bacc cabacba ba bcaac cc c cccab b ca caaab aaabccb cbacbac a bcabcccca bcc aaacaac bccacc bcb abbb ccbaa baccb cabcab b baacba abc bbccab bcc bacaacca bcabaab ccbcac cbaaac cccacba cac a bacb acac a cacc cccaba acaaabbc b ac baabcbbcc abbcabbc abccacbb ccbb ccaacaaa aacaaccb a aabca a bbba bac aabaaab bbccac bbacbbbc acaacb cc baab accaacb bca bacbaaaaa bbba cc cbccbbaaa b aaacb cabcaac babcacba caa caaaaa abcabaccc cbcbbc cbab acaabc bbabaccbb bacc caccbcbba ca bacc bc babaccacc bacbcab ccac cbbc acabc bacabbbb caabccaac acb cbacccbbb bbc ab ca cbaaacc bacbaca aabc acacbcb babac bccabccb ccabba bcccc cacbba bc bc bcabb b bcaabcba bacabbcab ababbbca accacccab abcb ab aacabba ccba a baca acaab acc bbbb aa cccaa cbcbbbbc bc abcabc baaca acb b cbbccc cbcabb ccbaabc bc ab cccacccac",
        expected:
          "a a b b b b a a a b b a c c b a c a c b c b c c a b b a b a b c b b a a c c b c b b c a c b c a c b a a c b b c c b b b c a b b c a a c b b c a a c b a c b b b c a c c c a b a a b a c b b b b b a b a c b c b b c b c c b b a c b b a a a b b c b c c c a a b a c b c a b b b b c a c c a a a b b c b c b c c b a c a c c c b b b a a b a a a b c a a c c b b b c c b c b b b b c c b b a c c a b b a b b c a a c a c c b b a c a a a a c c b b a a c b a c c b c a b b a c b c b a a b a b a c b a c a c a b a c c a a b a c c c c b b c a c c a b b c b b c c c b c c a c a b b a b b a c b c b b a b b b b c c c c a b a a c c a b a b a a c c a a a a b b a b b a c b a b b b c c b a c b c c a c c a b b c c b b b b c c a b c a c b a c c b a a b b c b c b b b b b b a a a a a c a b a a b a c c b a b a b c c c b a c",
      },
    ],
    hints: [
      "For one word, which roots could apply? Only those that are prefixes of it.",
      "Checking every root against every word is roots × words work.",
      "Put the roots in a trie. Walking a word down the trie visits its prefixes from shortest to longest.",
      "Stop at the first node that marks the end of a root. If the walk falls off the trie first, keep the word.",
    ],
    solutions: [
      {
        title: "Check every root for every word",
        order: 1,
        intuition:
          "For each word, collect the roots it starts with and take the shortest. Easy to get right, slow when there are many roots and many words.",
        approach: [
          "Split the sentence into words.",
          "For each word, find the shortest root that is a prefix of it, if any.",
          "Join the results with single spaces.",
        ],
        code: {
          PYTHON: `def shortenWithRoots(roots: List[str], sentence: str) -> str:
    out = []
    for word in sentence.split(" "):
        best = word
        for root in roots:
            if word.startswith(root) and len(root) < len(best):
                best = root
        out.append(best)
    return " ".join(out)`,
          JAVA: `class Solution {
    public String shortenWithRoots(String[] roots, String sentence) {
        String[] words = sentence.split(" ");
        for (int i = 0; i < words.length; i++) {
            String best = words[i];
            for (String root : roots) {
                if (words[i].startsWith(root) && root.length() < best.length()) best = root;
            }
            words[i] = best;
        }
        return String.join(" ", words);
    }
}`,
        },
        timeComplexity: "O(words · roots · L)",
        spaceComplexity: "O(sentence length)",
        edgeCases: ["A root equal to the whole word."],
        commonMistakes: ["Taking the first matching root instead of the shortest."],
      },
      {
        title: "Optimal: trie of roots",
        order: 2,
        intuition:
          "In a trie of the roots, a word's prefixes are visited shortest first as you walk its letters. The first node marking the end of a root is therefore the shortest applicable root, and the walk can stop right there. Each word costs at most its own length, however many roots there are.",
        approach: [
          "Insert every root into a trie and mark the node where it ends.",
          "For each word, walk its letters from the root.",
          "If a letter has no child, keep the whole word. If a node marks a root end, replace the word with the letters walked so far.",
          "Join the words with single spaces.",
        ],
        code: {
          PYTHON: `def shortenWithRoots(roots: List[str], sentence: str) -> str:
    END = "$"
    trie = {}
    for root in roots:
        node = trie
        for ch in root:
            node = node.setdefault(ch, {})
        node[END] = True

    out = []
    for word in sentence.split(" "):
        node, replacement = trie, word
        for i, ch in enumerate(word):
            if ch not in node:
                break              # no root continues this way
            node = node[ch]
            if END in node:
                replacement = word[:i + 1]  # shortest root found
                break
        out.append(replacement)
    return " ".join(out)`,
          JAVA: `class Solution {
    private static class Node {
        Node[] next = new Node[26];
        boolean end = false;
    }

    public String shortenWithRoots(String[] roots, String sentence) {
        Node trie = new Node();
        for (String root : roots) {
            Node node = trie;
            for (char ch : root.toCharArray()) {
                int k = ch - 'a';
                if (node.next[k] == null) node.next[k] = new Node();
                node = node.next[k];
            }
            node.end = true;
        }

        StringBuilder out = new StringBuilder();
        for (String word : sentence.split(" ")) {
            if (out.length() > 0) out.append(' ');
            Node node = trie;
            String replacement = word;
            for (int i = 0; i < word.length(); i++) {
                node = node.next[word.charAt(i) - 'a'];
                if (node == null) break;
                if (node.end) {
                    replacement = word.substring(0, i + 1);
                    break;
                }
            }
            out.append(replacement);
        }
        return out.toString();
    }
}`,
        },
        timeComplexity: "O(total root characters + sentence length)",
        spaceComplexity: "O(total root characters)",
        edgeCases: [
          "A word shorter than every root it partially matches.",
          "Roots where one is a prefix of another — the shorter wins.",
          "A sentence of a single word.",
        ],
        commonMistakes: [
          "Continuing the walk after a root end, which picks a longer root.",
          "Replacing a word with a root that is only a partial match of it, by not checking the end marker.",
        ],
      },
    ],
    expectedTime: "O(total characters)",
    expectedSpace: "O(total root characters)",
  },

  // ---------------------------------------------------------------------------
  // Cyclic placement
  // ---------------------------------------------------------------------------
  {
    slug: "reprinted-badge",
    title: "Reprinted Badge",
    difficulty: "EASY",
    learningObjective:
      "Use the values themselves as home indices: swap each value toward its slot until a collision exposes the duplicate.",
    topics: ["arrays"],
    patterns: ["cyclic-placement"],
    statement: [
      rich(
        "A conference printed badges numbered 1 to ",
        { code: "n" },
        ", but the printer jammed: the stack now holds ",
        { code: "n + 1" },
        " badges, every number between 1 and n, and exactly one badge number appears more than once (it may appear many times, in which case some other numbers are missing)."
      ),
      rich(
        "Return the badge number that appears more than once in ",
        { code: "badges" },
        "."
      ),
      example(
        "badges = [3, 1, 4, 2, 3]",
        "3",
        [
          { state: "[3, 1, 4, 2, 3]", note: "3 belongs at index 2: swap it there" },
          { state: "[4, 1, 3, 2, 3]", note: "4 belongs at index 3: swap" },
          { state: "[2, 1, 3, 4, 3]", note: "2 belongs at index 1: swap" },
          { state: "[1, 2, 3, 4, 3]", note: "indices 0–3 hold their own number" },
          { state: "index 4 holds 3", note: "index 2 already holds 3 — the reprint" },
        ],
        "Sending each badge to its home index"
      ),
    ],
    constraints: [
      "2 ≤ badges.length ≤ 100000",
      "1 ≤ badges[i] ≤ badges.length − 1",
      "Exactly one value occurs more than once.",
      "You may rearrange badges in place.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["badges"],
      returns: "int",
      functionName: "reprintedBadge",
    },
    tests: [
      {
        input: "3 1 4 2 3",
        expected: "3",
        isSample: true,
        explanation: "Five badges numbered 1 to 4: badge 3 was printed twice.",
      },
      {
        input: "2 2 2",
        expected: "2",
        isSample: true,
        explanation:
          "Three badges in the range 1 to 2: badge 2 appears three times, and badge 1 is missing entirely.",
      },
      { input: "1 1", expected: "1" },
      { input: "2 1 2", expected: "2" },
      { input: "1 2 3 3", expected: "3" },
      { input: "4 4 4 4 4", expected: "4" },
      { input: "5 1 4 2 3 5", expected: "5" },
      { input: "3 1 3 4 2", expected: "3" },
      {
        input:
          "1043 1598 830 988 599 1319 1070 1358 945 1678 426 792 1455 1091 578 1011 227 386 286 277 1471 1408 515 537 1535 1017 1085 1365 262 1438 1421 239 187 719 647 1320 1751 1491 1224 918 147 953 1572 1618 190 656 812 1326 895 1240 1122 616 545 997 218 402 1279 427 1236 14 1370 614 282 1230 946 1597 380 317 1261 609 1654 1266 482 90 748 1517 1439 1225 1766 152 899 965 935 1641 1180 663 1541 288 1250 1067 1191 1077 53 821 701 621 652 1712 1561 546 1759 721 1177 845 491 1650 1756 1566 995 1383 1701 1227 850 508 343 1363 1456 63 510 480 5 575 496 791 622 816 309 902 479 48 645 541 1636 1174 557 814 802 1711 885 634 377 458 413 155 869 669 1215 1030 1684 281 631 26 1190 734 560 682 435 1784 960 1292 4 725 856 351 760 369 1445 567 302 1754 580 1542 1785 1189 661 374 87 1110 331 993 362 941 450 132 1686 1530 892 252 264 1288 1771 414 782 949 1040 1732 963 1290 1746 308 1348 883 1233 733 1127 1192 292 47 247 474 201 363 1627 1632 1520 1531 276 51 1423 1671 742 1164 203 382 527 1617 245 86 697 761 1129 439 651 686 319 973 1075 1093 561 597 1374 204 1488 1387 1672 540 10 443 1464 1486 1036 1448 1375 387 188 1141 878 1321 1570 1394 743 1168 39 1449 92 1687 494 1389 1604 780 1688 583 1242 182 1476 1593 1373 422 974 364 908 315 772 1073 1000 1761 1256 230 1235 1310 976 1006 1353 823 942 437 978 1044 389 1391 1461 406 44 57 275 1155 211 840 1790 1115 1615 1662 591 485 1703 1269 1677 1599 793 571 220 233 1608 613 795 1595 1071 568 1555 874 1628 765 552 853 1339 1327 1088 990 1797 1034 1014 1066 79 768 1787 438 304 741 1635 401 986 1173 857 690 1018 526 1346 1209 1770 952 781 1553 454 678 1012 716 1165 283 938 968 1117 1094 1212 83 859 1208 723 469 1619 1427 600 1 727 787 844 192 1467 751 1545 1752 251 1676 822 1125 410 460 1049 1372 95 492 803 481 595 1343 320 1539 1131 849 1657 103 1357 1104 736 287 1052 1576 1378 888 971 829 294 1286 347 154 305 586 779 115 199 758 1640 112 1522 1059 1492 175 896 608 1132 1228 862 300 1702 754 353 1301 722 1743 1655 1472 1179 579 1138 210 770 243 685 327 1350 894 455 88 755 912 142 1016 564 1079 632 1499 1634 1381 1102 1295 1738 1096 1425 1144 1121 532 1234 1734 483 224 706 409 766 98 619 1552 1521 1762 278 1248 572 1411 1214 1149 116 836 1432 1089 240 1210 271 774 1024 1143 1336 487 726 1656 149 962 689 1501 1685 712 987 757 1470 903 615 1273 415 1231 594 1386 321 110 699 977 1606 1424 1376 906 119 392 1698 74 183 544 641 131 695 85 1710 1198 1020 1565 7 675 1442 1315 1674 419 576 1447 593 778 249 1664 1237 1462 1511 1309 1123 64 1188 1505 1747 1181 533 1773 1201 504 345 956 296 889 633 488 1446 818 1019 462 1393 1170 1670 161 1097 1742 1362 11 89 1285 1090 950 1646 489 93 1213 1113 1708 509 886 680 332 170 1158 295 1468 767 1300 174 1196 798 590 1194 967 679 1360 1204 157 832 1777 125 1554 1791 1247 1614 452 65 1485 627 1648 1431 625 1160 1588 24 1344 475 1046 1142 1510 839 91 676 729 1638 1331 640 412 1767 236 658 1726 985 118 457 548 543 606 916 241 1502 1334 1624 447 1652 1514 1607 523 111 135 1667 1120 31 521 158 538 737 1451 937 1056 416 1796 674 441 728 1682 1364 1441 702 596 550 1569 373 120 1265 1021 1659 529 528 1118 672 922 428 1454 1078 268 1108 1725 1013 569 1693 25 1205 1107 972 1280 254 1550 453 15 1642 977 356 588 1195 1596 649 1332 1185 1307 534 720 346 1055 1605 999 827 855 1789 49 539 493 1176 1222 926 330 1221 1414 1736 1601 1062 468 168 982 234 290 1723 42 745 1253 1193 992 1051 1038 433 1769 1385 1263 1197 692 1575 789 507 1578 231 1064 1031 1347 1223 785 411 881 1675 677 749 418 237 1047 1453 1050 1349 1496 200 511 1316 1392 520 684 1135 318 1750 1275 176 456 1406 235 513 577 559 805 1298 360 1495 1417 193 55 486 1706 421 1727 1270 194 378 1329 1429 831 424 1493 1371 432 368 106 931 893 846 22 177 1401 1564 1753 73 213 1152 994 1306 920 1087 934 1042 694 1150 164 566 301 324 1458 1342 1477 551 136 1571 1528 601 671 1029 1609 925 217 444 1281 1592 1249 1629 21 1284 769 1074 1716 1167 80 1600 1560 620 1637 717 783 339 1700 1616 299 1187 367 1459 825 1076 664 753 212 43 1299 1718 1623 1220 1721 1262 30 913 121 1729 549 1377 461 285 1602 1504 69 1082 904 801 229 948 1594 775 842 688 1341 173 1398 808 349 547 1536 1643 1612 666 714 1145 248 612 148 1359 858 198 1312 436 923 911 501 214 1128 68 1154 337 384 1737 1665 1027 811 84 834 516 1546 979 598 800 746 1130 901 1489 643 1758 13 1103 358 8 1251 1276 514 1065 776 890 280 1562 1322 1645 1673 1508 270 868 46 1045 659 1573 32 153 1063 1419 1443 1696 58 708 1361 232 1072 1159 395 306 189 1775 1715 1574 1544 1001 1304 703 1058 1243 124 1178 563 1412 1744 134 1409 1098 773 1328 219 465 310 969 1368 1584 425 128 417 127 470 519 1245 20 1583 1559 104 1795 1317 944 1497 1338 1577 1015 62 267 799 1551 687 724 400 919 530 1264 707 1303 216 1556 471 905 1533 1457 1041 1450 1114 1010 618 169 624 1434 1239 1631 1026 445 1340 524 1494 1475 1719 1061 1330 139 464 1356 1219 490 1396 933 238 500 144 1523 759 17 875 1119 1713 809 442 265 133 1081 35 466 1748 383 1460 478 939 1294 223 66 179 352 570 396 635 1625 77 143 1524 186 1714 225 209 1538 97 1479 838 981 215 12 1567 610 582 484 837 764 1200 379 1048 467 350 1324 1404 1591 657 408 860 293 96 1333 1582 691 852 961 202 1498 497 1169 1680 815 1244 638 100 1283 1513 806 261 185 642 1707 556 1626 289 1437 1780 297 1610 1537 1277 1217 1452 117 71 263 872 747 1367 1086 1765 440 847 1207 1254 655 451 1473 784 1084 1739 1171 1579 1668 129 1139 637 1069 1697 1211 1735 1293 370 298 312 954 1466 430 222 1255 260 9 1297 989 1666 1586 1216 639 996 101 813 1318 1435 1232 1428 1002 700 1005 914 1527 542 1246 1380 536 1724 375 828 50 113 756 1731 1603 843 253 1525 1798 1444 1163 67 630 316 565 1400 1722 763 517 172 1057 1704 1352 1793 361 1478 1651 1162 502 650 1033 1557 314 796 887 1101 1692 1585 269 19 160 1252 917 1779 668 713 122 1589 732 27 448 1781 1313 1153 371 197 1563 731 407 503 964 738 82 1068 473 1778 325 1151 495 512 975 165 404 1278 1730 1440 244 1695 718 205 1100 54 255 1199 696 1558 1272 498 311 1054 771 592 709 59 1644 180 1302 1238 1083 434 38 1430 1399 740 991 693 381 81 166 313 1314 365 1206 397 405 810 626 1679 936 431 1426 195 1060 648 1699 250 385 257 553 667 662 61 208 388 326 1581 472 167 60 940 196 303 228 1540 1484 159 1369 1112 355 525 1543 1590 291 1483 932 1469 1080 338 256 1296 1134 1474 1405 1023 1639 1402 323 1463 1416 777 3 259 750 1111 1728 1323 18 336 94 927 1683 1768 584 1490 423 344 99 273 824 636 739 866 1355 1481 1099 873 518 646 221 681 531 1109 1534 1480 1147 1218 476 390 178 123 109 1003 342 1267 1035 1410 841 966 284 141 715 752 1186 107 1022 1136 854 246 876 604 1337 335 762 56 226 1740 928 670 1694 1354 1289 1633 848 181 970 1124 258 36 1403 1799 334 930 654 1792 1335 1532 184 23 1268 341 150 191 1140 1287 786 1366 28 348 819 1137 151 683 108 907 1733 272 1166 817 1413 105 653 900 1420 603 1529 1512 1203 1507 1422 1407 1658 1783 40 788 366 861 1587 1465 820 629 1282 867 833 171 1720 871 835 29 1653 605 984 1105 163 1175 1226 376 1133 628 1681 1509 924 1611 372 929 1009 1568 909 660 463 1580 1788 562 589 877 1157 1025 698 1526 1259 1095 329 807 156 1395 1622 41 1613 998 307 1515 1325 983 1649 1184 1028 340 1126 1764 1032 449 506 1717 1384 1116 70 499 704 206 705 790 354 863 1691 72 1500 137 735 1630 1786 1241 505 623 1037 1620 1549 710 1436 333 1148 884 1388 1039 279 644 1776 587 1053 1106 1257 1763 399 1271 951 1182 1397 1774 1772 980 138 555 1503 870 1390 915 947 1663 1487 328 958 882 1433 804 429 1516 607 943 617 37 602 1345 744 1690 6 611 554 130 1647 1305 126 1418 75 1274 1291 403 1669 1519 114 140 558 1518 1547 420 1757 1161 957 102 1661 78 1008 826 585 1351 45 1794 1092 574 146 242 1782 794 535 864 1308 1660 797 1258 730 673 665 1755 1749 398 33 1156 477 52 1379 898 446 880 322 391 76 1705 1183 879 522 1709 459 1548 1172 921 394 1760 266 1415 1482 1745 1004 1007 897 959 1382 162 1202 851 1689 393 1621 357 145 274 891 207 1741 1229 865 1260 16 359 34 2 711 1311 1506 1146 910 581 955 573",
        expected: "977",
      },
      {
        input:
          "527 1030 554 213 195 906 492 873 971 1200 378 1200 513 884 447 81 1125 703 74 1200 1245 482 832 486 1200 902 1258 465 1458 1468 1200 1056 345 1113 548 400 1409 1121 34 1051 560 1200 1479 1214 747 617 860 1031 597 60 1200 12 1200 996 1200 1050 787 1126 240 1191 457 731 490 501 1311 829 68 1200 461 1057 1200 1472 976 156 1200 987 962 771 677 73 287 6 1200 531 753 1093 25 421 1249 281 1015 474 1200 1202 1200 402 550 1183 1200 222 1369 901 798 1003 1200 934 1200 100 198 1200 1176 1200 1200 1243 1209 570 979 1434 1200 912 1200 1106 980 891 805 214 1224 956 1200 374 1203 246 592 875 885 1120 636 1200 86 90 130 1200 957 1421 269 315 1200 1017 1200 1436 436 326 1320 288 1324 1021 528 1276 1200 623 683 936 368 48 159 1200 1374 1200 414 1354 1200 237 1200 184 242 1450 1018 1289 1087 1200 792 1200 876 1200 538 50 247 202 239 1200 1235 46 881 1229 1200 1200 298 435 375 1201 1200 419 500 1200 102 190 1109 1200 1200 717 316 408 1178 618 1098 947 149 422 964 1268 622 693 276 1200 92 1200 811 1200 484 658 1200 869 1200 514 1105 1200 818 153 1402 837 82 407 21 1295 115 1036 1490 1200 872 1046 1464 1219 1367 1129 834 452 600 720 103 1159 1200 1200 1200 236 908 655 1200 1061 919 826 1187 1294 1200 161 1350 334 615 839 549 170 142 822 547 207 262 1192 397 223 1067 39 833 1200 1381 1090 1356 660 72 1493 1200 1200 1134 318 338 994 1085 1088 1200 256 206 562 1200 1248 762 1305 914 745 388 1200 926 1097 1140 1186 404 495 632 166 340 689 1200 804 1152 654 769 151 1160 1274 898 52 1491 841 279 311 455 1200 886 1371 844 504 1200 1184 24 1200 1200 423 530 290 824 84 781 66 140 656 43 415 774 532 1200 1302 135 870 848 718 603 1127 1200 1384 1352 1398 1014 1499 729 838 104 1161 312 1049 1200 797 1200 1153 1200 431 1200 284 1200 777 1200 1200 1042 1489 2 1363 1200 639 1307 1238 1405 1200 1394 920 1483 1269 428 685 883 715 1392 1200 1151 1170 1200 1200 760 1200 1200 673 270 42 350 1217 1337 1200 1200 614 1200 433 1200 915 113 856 228 339 390 1198 599 1492 1200 521 283 651 303 417 916 1169 758 1200 1200 871 598 904 320 1048 975 1325 1200 1200 22 488 604 139 827 1200 1331 191 265 984 175 868 1200 566 892 383 1336 1200 1288 1339 1200 1477 221 1197 469 1044 1445 825 505 349 1019 241 581 1200 704 1455 675 911 578 1270 183 158 1200 666 795 1200 146 322 1037 1074 922 1310 1200 453 285 1200 215 1040 481 756 126 1035 931 1060 563 1200 1358 1200 1200 477 590 1116 687 859 38 418 1200 1200 1346 929 865 145 1425 1232 393 1064 479 1469 125 1200 251 380 1200 180 910 1476 1200 821 362 1103 1013 1318 1449 229 630 840 1417 659 1200 966 1135 1485 1200 665 491 154 445 18 1200 1264 432 420 726 1200 1312 1200 233 1053 226 57 45 1221 1200 278 384 1200 1200 967 784 1200 1143 1200 1393 478 261 776 302 1200 200 882 114 17 1488 1200 373 1200 641 1146 224 1136 879 473 746 363 1411 1463 701 522 1200 992 1094 845 44 446 498 900 1427 1481 1200 61 1220 1397 117 1130 516 187 733 1200 712 1326 1200 751 1012 1200 863 97 1277 1237 398 1446 164 1200 1375 1108 1283 132 1200 1200 1301 569 1200 1308 356 854 1298 1252 1332 700 1391 983 36 529 31 1286 144 1200 1200 585 559 958 1200 1273 252 1200 1200 831 1211 1200 815 1261 1200 1173 65 565 1271 463 396 1111 346 1200 141 1428 1200 59 1020 123 740 1462 699 552 1351 1372 1165 157 1200 1200 294 136 1251 835 181 1200 680 354 616 695 1200 1200 1200 328 1200 1200 602 1104 399 638 1200 972 33 1300 999 649 1200 828 773 1338 1080 437 1461 1357 506 836 558 51 907 1200 94 594 1066 1418 468 653 199 974 643 1100 254 1263 425 637 663 857 444 1465 1077 1200 1287 218 577 460 951 1292 1058 738 370 1172 1200 1047 694 725 450 722 536 1396 1142 313 954 489 1200 1200 1344 1296 1439 932 1071 1171 970 296 9 862 1052 574 789 416 793 779 1200 1448 410 557 55 778 1200 551 943 584 575 381 209 1200 697 1212 1200 1023 850 580 295 1313 197 1359 439 757 1029 1299 1177 1200 705 1091 1260 736 300 8 1148 70 605 714 754 409 1200 225 244 343 625 806 1210 1435 1467 799 1199 607 1200 1200 847 1122 314 1200 601 716 1200 212 1083 761 83 1412 1497 1335 1092 1141 800 1484 355 148 1244 1230 721 348 1200 785 376 272 127 743 201 633 796 1304 1315 544 1200 1420 1154 120 1200 613 1096 496 1200 263 723 1162 291 1406 1218 579 405 1011 1200 1200 331 1022 56 485 467 1157 129 1132 1027 864 372 499 851 1256 389 188 730 1460 939 1200 440 1416 1200 1016 1376 319 401 1107 1200 1410 1373 816 475 1073 1166 231 260 759 1200 681 277 645 935 1182 1327 194 1200 1442 1200 809 918 509 1459 1200 817 16 11 1043 1128 1471 1200 830 1110 3 732 1213 1349 642 567 458 53 1200 1188 1200 801 707 852 1257 899 1480 713 1200 1200 78 1365 1498 1034 620 1181 556 1222 1200 1158 1430 275 1200 192 1200 387 96 1200 1200 76 442 887 541 1228 1189 426 169 1343 163 1005 803 1306 1200 903 1353 775 1200 1200 1200 369 1200 1137 989 1293 768 1089 443 1200 5 472 944 1200 545 10 755 810 867 1068 1033 849 819 991 1200 1254 160 324 692 1200 69 938 1444 430 1317 204 1078 1200 105 945 464 1437 686 1200 1200 1470 1200 608 301 1281 1195 1200 588 1200 101 525 1495 1241 118 1200 329 1200 1200 1010 909 763 727 583 13 1414 1045 1200 807 794 462 858 1309 1205 823 1117 889 553 1200 1200 364 89 88 67 1200 668 85 1175 676 1443 235 1200 650 1368 330 205 1065 1200 1024 846 1200 1200 880 1115 1180 1200 1200 1200 307 555 483 367 537 1474 1453 54 1200 518 1032 657 248 780 1131 941 1001 470 466 1207 162 93 266 995 1200 1200 977 1285 353 1323 894 360 1118 593 1200 1432 165 652 1319 15 107 905 1200 155 121 629 933 1345 748 1200 709 1069 770 1200 595 1200 87 111 648 1072 682 512 342 327 80 790 1144 243 1208 29 1200 576 1138 208 1451 216 1253 305 1200 1194 888 1009 1200 1200 7 358 321 1419 220 210 1155 961 1200 297 965 1440 1025 624 1200 1478 1382 1200 232 167 724 1262 1200 1 1200 739 1200 255 1200 782 1200 946 1200 1200 1200 1200 1200 1200 571 671 1379 534 1452 612 708 292 133 134 766 814 990 1200 672 1063 95 1200 1413 1200 1303 1200 352 1200 1200 1426 250 1388 1200 1200 1156 20 62 1227 487 998 268 274 1004 333 631 323 1387 238 959 1389 359 627 1225 1395 110 282 1475 1200 587 1002 459 1200 1333 1297 124 678 1200 735 1200 309 1246 1291 1200 335 1204 1240 953 377 1200 986 23 131 924 1028 1390 1401 1200 30 494 674 928 28 1200 1380 1334 646 1200 186 515 259 1196 1259 1059 1280 1377 451 71 1290 1168 193 1438 137 1340 1200 861 808 1370 1486 413 948 1000 842 438 1200 32 4 394 347 1008 337 1385 1200 791 382 395 471 173 177 611 371 267 510 1054 1167 1200 960 1200 116 253 1415 308 392 1145 742 1275 1038 1200 508 609 217 344 1076 619 706 1361 1278 1200 1403 1223 621 878 1250 26 969 1267 711 688 1200 185 189 1147 143 332 893 568 1200 1200 424 1341 1200 1200 304 1200 385 1099 540 365 1200 427 1200 963 561 526 1200 1355",
        expected: "1200",
      },
    ],
    hints: [
      "A set of seen numbers finds the repeat in one pass. Can you do it with no extra memory?",
      "Every value v is between 1 and n, so it has a natural home: index v − 1.",
      "Repeatedly swap the value at index i to its home. If its home already holds the same value, you have found two copies.",
      "Each swap puts one value in its final place, so the total number of swaps is at most n.",
    ],
    solutions: [
      {
        title: "Remember what you have seen",
        order: 1,
        intuition:
          "Walk the badges and keep a set. The first badge already in the set is the reprint. Linear time, but the set can grow to n entries.",
        approach: [
          "Keep an empty set.",
          "For each badge, return it if it is already in the set; otherwise add it.",
        ],
        code: {
          PYTHON: `def reprintedBadge(badges: List[int]) -> int:
    seen = set()
    for badge in badges:
        if badge in seen:
            return badge
        seen.add(badge)
    return -1  # unreachable for valid input`,
          JAVA: `class Solution {
    public int reprintedBadge(int[] badges) {
        Set<Integer> seen = new HashSet<>();
        for (int badge : badges) {
            if (!seen.add(badge)) return badge;
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: ["The repeated value appears many times."],
        commonMistakes: [
          "Assuming the duplicate appears exactly twice and using a sum formula.",
        ],
      },
      {
        title: "Optimal: cyclic placement",
        order: 2,
        intuition:
          "Value v's home is index v − 1. Standing at index i, if the value there is not at home, swap it into its home. Either that home already holds the same value — a second copy, so we are done — or one more value is now permanently placed. With n + 1 badges and only n homes, a collision is guaranteed.",
        approach: [
          "Start at i = 0.",
          "Let v = badges[i]. If v == i + 1, it is home: move to i + 1.",
          "Otherwise, if badges[v − 1] == v, its home is already taken by a copy: return v.",
          "Otherwise swap badges[i] with badges[v − 1] and look at index i again.",
        ],
        code: {
          PYTHON: `def reprintedBadge(badges: List[int]) -> int:
    i = 0
    while True:
        value = badges[i]
        if value == i + 1:
            i += 1                  # already home
            continue
        if badges[value - 1] == value:
            return value            # its home already holds a copy
        # Send value home; whatever was there lands at i for the next check.
        badges[i], badges[value - 1] = badges[value - 1], value`,
          JAVA: `class Solution {
    public int reprintedBadge(int[] badges) {
        int i = 0;
        while (true) {
            int value = badges[i];
            if (value == i + 1) {
                i++;
                continue;
            }
            if (badges[value - 1] == value) return value;
            badges[i] = badges[value - 1];
            badges[value - 1] = value;
        }
    }
}`,
        },
        timeComplexity: "O(n) — every swap places one value for good",
        spaceComplexity: "O(1)",
        edgeCases: [
          "The duplicate sits in the last slot, which has no home of its own.",
          "Every badge is the same number.",
        ],
        commonMistakes: [
          "Advancing i after a swap, which skips the value that was just swapped in.",
          "Writing the swap as badges[i], badges[badges[i] − 1] = … in Python, where the index is re-read after badges[i] changes.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "unfilled-seats",
    title: "Unfilled Seats",
    difficulty: "EASY",
    learningObjective:
      "Place each value at its home index in place, then read the gaps off a single final scan.",
    topics: ["arrays"],
    patterns: ["cyclic-placement"],
    statement: [
      rich(
        "A theatre has seats numbered 1 to ",
        { code: "n" },
        ". The check-in log ",
        { code: "seats" },
        " has exactly n entries, each a seat number from 1 to n, but a scanning fault recorded some seats more than once — so other seats never appear."
      ),
      para(
        "Return the seat numbers that never appear, in increasing order. If every seat appears, return an empty array (the output line is blank)."
      ),
      example(
        "seats = [4, 2, 2, 6, 1, 6]",
        "[3, 5]",
        [
          { state: "[4, 2, 2, 6, 1, 6]", note: "send each number to index number − 1" },
          {
            state: "[1, 2, 2, 4, 6, 6]",
            note: "after placement: index 2 holds 2, index 4 holds 6",
          },
          {
            state: "scan",
            note: "indices 2 and 4 are not home, so seats 3 and 5 are missing",
          },
        ],
        "Placing, then scanning"
      ),
    ],
    constraints: [
      "1 ≤ seats.length ≤ 100000",
      "1 ≤ seats[i] ≤ seats.length",
      "You may rearrange seats in place.",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["seats"],
      returns: "int[]",
      functionName: "unfilledSeats",
    },
    tests: [
      {
        input: "4 2 2 6 1 6",
        expected: "3 5",
        isSample: true,
        explanation: "Seats 3 and 5 never appear in the check-in log.",
      },
      {
        input: "2 1",
        expected: "",
        isSample: true,
        explanation: "Both seats are filled, so the output line is empty.",
      },
      { input: "1", expected: "" },
      { input: "1 1", expected: "2" },
      { input: "2 2", expected: "1" },
      { input: "1 2 3 4", expected: "" },
      { input: "5 5 5 5 5", expected: "1 2 3 4" },
      { input: "2 3 4 5 1 1", expected: "6" },
      {
        input:
          "1127 885 540 783 1360 1861 1611 547 1165 1788 1219 202 1462 995 1187 14 547 507 212 1334 461 1436 1266 1303 534 730 801 1965 1032 1522 1587 277 586 354 1302 1943 836 307 551 626 427 1506 1378 289 340 1125 463 424 1743 653 1663 1723 375 1888 1047 2000 1011 1659 1578 637 556 1133 1546 146 1129 1213 880 1111 426 806 195 660 1616 1962 1052 241 34 523 1450 1880 294 1542 987 728 1766 1899 68 706 1928 470 1997 1460 965 431 1030 1796 1295 794 79 1046 480 1011 199 1524 747 1114 1936 651 336 701 1692 1082 1680 1083 1771 718 630 1112 1091 971 1204 950 1057 133 97 618 958 718 1570 1407 1597 27 1865 1776 191 1507 878 1552 846 953 1616 1797 1112 1066 1950 87 65 2000 1550 1525 1081 774 217 948 1086 1348 1623 582 524 628 384 328 781 407 1511 643 668 818 1887 895 813 1892 37 805 734 1470 107 1812 591 76 288 1828 354 838 1927 90 774 1273 1735 1227 1425 1705 1484 764 1453 973 111 134 618 1247 1193 208 69 587 1357 305 664 1957 794 344 1726 1095 283 693 512 1917 1868 492 982 1150 1822 1436 689 672 1485 361 520 579 1836 191 1977 1081 391 186 833 964 800 1695 970 719 851 720 1950 1736 1376 1637 1338 101 78 159 402 326 1719 1233 1903 857 1202 1574 676 1156 1589 508 1785 1320 1268 1595 1945 1429 1341 502 1908 426 345 1632 1627 997 796 799 463 1696 77 1072 1060 1039 734 565 116 820 1887 586 57 605 316 907 214 1621 812 1957 788 499 1 110 1487 1880 1758 1025 1039 1885 1804 1162 991 1369 1772 316 157 36 331 756 1216 1325 836 222 1228 1070 960 996 1233 210 1896 18 832 1039 255 1946 352 706 1413 559 443 1500 1526 252 170 352 1237 885 458 1978 1706 1415 1228 557 76 1815 130 1204 995 1760 96 1133 776 1749 787 1205 1158 411 130 863 12 747 821 895 1653 183 1309 297 945 1794 412 1967 85 840 1325 663 1366 1144 176 1275 501 1188 1001 1698 1867 1604 1953 1398 1642 1321 604 144 1232 1941 1402 191 1316 810 105 499 383 1668 1415 304 706 1046 590 1740 675 419 569 1139 1899 425 266 178 1670 250 1987 1464 793 1121 1953 1429 560 1960 781 1625 663 1884 423 390 1582 197 676 1783 929 846 591 1429 1130 1057 1369 703 109 1302 340 884 915 285 1960 1486 534 191 1230 1883 1433 386 1803 523 164 940 278 1009 1122 748 1320 139 659 1683 832 1860 846 1982 1794 1757 1333 1860 1742 418 1050 996 1533 387 673 1714 1077 1828 1939 1529 1916 747 1335 1456 1695 203 947 647 1564 256 1912 1879 556 1690 443 905 898 930 1395 1710 1403 625 1050 421 321 1847 831 654 595 1748 1350 455 1744 711 679 135 964 1757 662 174 964 868 1592 1358 18 137 787 486 609 705 557 1373 212 711 791 967 1011 594 582 119 8 484 211 160 347 1706 1384 1522 398 696 912 1980 973 863 910 1790 1330 178 340 202 60 182 1803 1792 287 1811 550 931 198 1736 1387 312 1807 1816 547 1326 1158 1646 1299 709 423 174 1323 1544 612 1656 760 1309 1475 781 1821 31 713 1095 1866 616 799 188 762 1781 324 349 1645 122 135 488 1817 617 1685 968 288 1050 777 861 1942 1832 1163 1679 1561 1283 1712 1295 995 758 777 241 1364 938 547 1079 1168 868 1569 934 597 1036 1998 318 1008 1386 277 1607 1300 297 1646 1750 1110 140 137 1530 1187 950 1904 116 704 912 658 51 1787 385 1945 1578 364 865 14 853 618 1327 258 388 529 673 616 1900 1387 29 1738 999 926 112 1586 1580 959 54 440 1369 713 259 708 1606 1311 786 1057 399 1018 1980 1837 1859 1433 636 1210 520 1773 1109 19 443 1497 71 1404 1762 1291 358 611 262 312 1246 1554 1249 1791 1186 752 1037 31 185 1764 1295 693 862 1072 438 1811 1012 1482 1124 278 337 1551 1995 1795 1347 655 1885 1732 1945 924 1095 1633 1059 1158 608 1771 1506 537 1720 1775 1774 1842 433 10 1015 1537 1480 1174 1764 1481 1061 1430 1611 357 1246 213 1349 541 1684 1792 1476 1576 1744 53 423 1600 1093 1252 1106 1941 937 794 1737 694 484 673 637 736 1431 489 161 1305 1348 94 212 1771 1609 1718 1714 879 1673 747 1343 1037 1329 313 1603 278 1215 230 111 1376 1356 440 1674 1389 679 913 297 191 199 1639 145 403 1528 1440 1801 1099 646 762 663 156 989 1607 678 1713 1957 531 1802 124 858 34 362 1552 1373 1599 1540 625 317 1898 897 198 873 34 1160 1709 655 850 937 1183 732 1550 1231 52 1279 1217 1367 419 265 883 889 2000 488 230 880 1937 505 1643 256 1665 939 185 1910 527 261 334 295 1741 581 1226 1699 1630 266 1307 1908 762 1469 1567 907 460 1692 1097 1123 761 1074 1902 381 1276 1358 1420 1770 1367 1803 315 1901 1761 430 1531 1101 1592 353 1567 1920 1042 1650 1663 1282 569 87 19 907 412 1578 784 1565 806 1495 332 645 1379 1751 443 1937 965 1769 1197 211 565 920 1176 1516 728 1980 812 586 157 252 1489 836 282 1808 1745 1308 345 1935 1332 165 1838 412 926 777 1343 444 14 1356 1277 1317 1117 1060 1828 1743 1605 1213 352 261 556 1837 1156 1053 63 484 1349 1290 1424 1286 922 278 440 1504 1336 1089 842 474 352 971 1520 1221 1207 1934 64 1676 1927 1203 606 1638 477 627 1925 507 1903 954 1312 926 366 716 1643 1072 124 546 453 1751 356 1236 456 1979 40 1292 848 277 477 1387 66 503 1784 710 848 512 1797 1404 1872 1604 570 1838 1048 1960 330 387 1623 1333 907 592 283 640 1302 1682 1327 1736 125 1990 610 256 9 129 31 760 585 828 640 986 2 1672 269 51 539 1230 502 437 1347 475 1767 1513 56 1534 629 831 397 960 498 1331 51 934 45 1018 734 631 321 1458 848 1960 1412 1718 177 1375 625 992 89 120 1173 257 1707 868 689 923 95 641 810 518 113 1294 1235 1923 699 475 876 1017 1969 406 638 1414 1232 289 1525 323 1441 616 451 400 1571 650 1807 1890 1768 1922 1612 1870 1690 1834 218 1769 29 728 306 1513 68 1097 979 668 1904 1772 27 1189 143 1923 1393 521 1923 1574 103 172 1336 803 632 12 1194 353 1737 1988 990 388 1175 689 1749 1604 965 1844 515 1001 1276 1943 839 34 833 360 670 1933 1356 379 262 1067 144 1082 1681 1307 837 238 1744 186 294 348 293 1218 1947 1136 306 154 597 167 13 346 887 518 470 1064 1594 1905 1848 720 1630 198 266 1770 994 1423 634 1586 1270 1217 1937 1835 511 1875 1575 322 1978 1180 1811 168 1998 1106 1630 1765 125 1008 1612 1260 454 1534 944 1616 508 502 857 641 1060 96 418 1791 178 1454 1052 37 959 1013 1680 891 135 747 312 402 1477 510 370 873 1997 1042 641 25 755 776 23 950 771 889 434 569 1993 1213 894 64 1235 389 163 1055 1247 1334 723 1509 1607 542 588 1277 314 1016 901 1374 714 697 309 217 1974 209 1312 1889 522 50 1964 173 1665 97 1347 805 943 1191 1036 876 1193 343 516 1940 55 1339 1850 1684 1613 496 898 1123 945 1087 1766 448 1309 1371 282 421 1608 772 1590 1098 633 1367 1315 1119 980 1506 1232 1935 1386 801 40 1216 1007 1517 771 1290 372 1166 1012 1805 967 660 1918 797 1097 494 1009 1807 637 1956 1058 7 1195 1368 521 200 553 1717 722 1984 270 688 1018 938 1461 379 1629 1779 1304 1930 308 238 220 1906 805 170 275 1963 1370 1033 1619 1288 1271 1692 1501 1152 1733 721 790 1932 981 507 1496 593 804 63 948 597 1430 582 1649 806 1384 427 1119 1643 739 293 1822 1869 1119 962 1112 1966 1393 1440 1750 264 751 1196 381 977 237 1216 51 1391 1727 1992 1974 772 270 727 1576 1278 1188 888 1417 1925 923 1392 1245 262 205 582 1716 694 1543 12 11 1159 766 1204 742 270 1505 1093 1240 1224 914 922 1018 1764 886 206 1397 1448 1746 1748 1923 1115 960 1160 1785 1127 518 551 909 792 814 301 1285 1558 1047 1873 693 1556 1247 582 1686 1932 1975 1737 592 365 1330 189 1150 884 335 1627 735 1644 1667 1595 190 269 771 756 1578 249 1662 120 1033 1083 928 676 1900 1082 1679 788 1332 1099 253 1883 817 1934 296 920 701 1014 1125 1866 744 1550 1591 486 1745 720 1220 1750 1410 747 181 551 323 988 1292 1508 637 577 1947 997 1888 1307 1549 950 1916 1752 653 278 916 982 1126 179 1953 1241 7 323 209 271 844 99 1738 1071 330 1858 908 1020 1557 1753 1360 663 240 1049 203 1213 158 1996 1089 519 1915 912 746 1519 570 344 1579 510 1032 269 484 1954 1161 823 328 58 569 1450 331 444 1920 1352 1017 731 1061 1234 922 165 411 1150 1755 753 1243 1314 1718 714 1988 1057 1387 7 883 489 1573 1189 1691 35 529 692 840 1392 852 1355 1523 851 1437 1966 340 742 457 588 1124 1672 1372 598 1229 1670 1207 502 82 1669 1328 824 1447 1116 921 1252 58 41 333 1561 458 531 42 923 1219 1214 960 1576 20 1800 1433 184 155 1971 1774 1312 1428 242 179 832 1538 1027 1469 774 582 1120 1074 233 426 1735 824 662 297 593 1623 1892 798 425 604 1563 1513 384 1993 334 514 856 387 163 1434 1181 1938 1052 192 736 75 831 1517 1974 104 513 717 662 1496 1809 4 820 411 67 1387 746 1805 161 327 1899 806 1520 1528 1077 1186 1889 435 97 782 1959 703 159 1348 1637 651 1061 1292 1262 1944 1440 742 304 1197 345 945 1766 160 1211 1629 1706 1955 862 738 1559 321 1158 1406 683 1541 1068 544 301 14 1419 564 966 654 649 1847 725 408 705 567 1237 1018 1528 1760 551 1460 50 174 730 1707 1857 72 777 1819 577 1370 1527 928 1570 617 1917 1493 765 1651 1746 810 240 788 1514 444 1253 1497 1774 852 103 1524 657 740 328 802 1418 1949 1700 1781 1252 1782 1040 705 225 778 1260 1540 1417 1136 164 490 947 1989 1238 1487 1027 1684 705 409 1423 1604 1873 1905 873 1290 409 1579 1526 282 1062 831 1334 688 889 1214 1160 1954 1532 798 381 1345 993 983 517 606 1982 1733 1626 624 1864 1325 168 42 164 1254 126 1871 1974 1141 1207 1019 1407 1190 1120 1929 753 1618 819 1674 1303 633 508 1808 1356 1842 931 541 779 1547 1363 1178 352 1522 1975 1382 1236",
        expected:
          "3 5 6 15 16 17 21 22 24 26 28 30 32 33 38 39 43 44 46 47 48 49 59 61 62 70 73 74 80 81 83 84 86 88 91 92 93 98 100 102 106 108 114 115 117 118 121 123 127 128 131 132 136 138 141 142 147 148 149 150 151 152 153 162 166 169 171 175 180 187 193 194 196 201 204 207 215 216 219 221 223 224 226 227 228 229 231 232 234 235 236 239 243 244 245 246 247 248 251 254 260 263 267 268 272 273 274 276 279 280 281 284 286 290 291 292 298 299 300 302 303 310 311 319 320 325 329 338 339 341 342 350 351 355 359 363 367 368 369 371 373 374 376 377 378 380 382 392 393 394 395 396 401 404 405 410 413 414 415 416 417 420 422 428 429 432 436 439 441 442 445 446 447 449 450 452 459 462 464 465 466 467 468 469 471 472 473 476 478 479 481 482 483 485 487 491 493 495 497 500 504 506 509 525 526 528 530 532 533 535 536 538 543 545 548 549 552 554 555 558 561 562 563 566 568 571 572 573 574 575 576 578 580 583 584 589 596 599 600 601 602 603 607 613 614 615 619 620 621 622 623 635 639 642 644 648 652 656 661 665 666 667 669 671 674 677 680 681 682 684 685 686 687 690 691 695 698 700 702 707 712 715 724 726 729 733 737 741 743 745 749 750 754 757 759 763 767 768 769 770 773 775 780 785 789 795 807 808 809 811 815 816 822 825 826 827 829 830 834 835 841 843 845 847 849 854 855 859 860 864 866 867 869 870 871 872 874 875 877 881 882 890 892 893 896 899 900 902 903 904 906 911 917 918 919 925 927 932 933 935 936 941 942 946 949 951 952 955 956 957 961 963 969 972 974 975 976 978 984 985 998 1000 1002 1003 1004 1005 1006 1010 1021 1022 1023 1024 1026 1028 1029 1031 1034 1035 1038 1041 1043 1044 1045 1051 1054 1056 1063 1065 1069 1073 1075 1076 1078 1080 1084 1085 1088 1090 1092 1094 1096 1100 1102 1103 1104 1105 1107 1108 1113 1118 1128 1131 1132 1134 1135 1137 1138 1140 1142 1143 1145 1146 1147 1148 1149 1151 1153 1154 1155 1157 1164 1167 1169 1170 1171 1172 1177 1179 1182 1184 1185 1192 1198 1199 1200 1201 1206 1208 1209 1212 1222 1223 1225 1239 1242 1244 1248 1250 1251 1255 1256 1257 1258 1259 1261 1263 1264 1265 1267 1269 1272 1274 1280 1281 1284 1287 1289 1293 1296 1297 1298 1301 1306 1310 1313 1318 1319 1322 1324 1337 1340 1342 1344 1346 1351 1353 1354 1359 1361 1362 1365 1377 1380 1381 1383 1385 1388 1390 1394 1396 1399 1400 1401 1405 1408 1409 1411 1416 1421 1422 1426 1427 1432 1435 1438 1439 1442 1443 1444 1445 1446 1449 1451 1452 1455 1457 1459 1463 1465 1466 1467 1468 1471 1472 1473 1474 1478 1479 1483 1488 1490 1491 1492 1494 1498 1499 1502 1503 1510 1512 1515 1518 1521 1535 1536 1539 1545 1548 1553 1555 1560 1562 1566 1568 1572 1577 1581 1583 1584 1585 1588 1593 1596 1598 1601 1602 1610 1614 1615 1617 1620 1622 1624 1628 1631 1634 1635 1636 1640 1641 1647 1648 1652 1654 1655 1657 1658 1660 1661 1664 1666 1671 1675 1677 1678 1687 1688 1689 1693 1694 1697 1701 1702 1703 1704 1708 1711 1715 1721 1722 1724 1725 1728 1729 1730 1731 1734 1739 1747 1754 1756 1759 1763 1777 1778 1780 1786 1789 1793 1798 1799 1806 1810 1813 1814 1818 1820 1823 1824 1825 1826 1827 1829 1830 1831 1833 1839 1840 1841 1843 1845 1846 1849 1851 1852 1853 1854 1855 1856 1862 1863 1874 1876 1877 1878 1881 1882 1886 1891 1893 1894 1895 1897 1907 1909 1911 1913 1914 1919 1921 1924 1926 1931 1948 1951 1952 1958 1961 1968 1970 1972 1973 1976 1981 1983 1985 1986 1991 1994 1999",
      },
    ],
    hints: [
      "A set of the seats that appear makes this easy. Can the array itself act as that set?",
      "Seat number v belongs at index v − 1.",
      "Swap values toward their homes. When the home already holds the same number, the current value is a duplicate — leave it and move on.",
      "Afterwards, index i holds i + 1 exactly when seat i + 1 appeared.",
    ],
    solutions: [
      {
        title: "Set of occupied seats",
        order: 1,
        intuition:
          "Put every logged seat in a set, then list the numbers from 1 to n that are absent. Clear and linear, but it allocates a set as big as the input.",
        approach: [
          "Build a set from the log.",
          "Collect every k from 1 to n that is not in the set.",
        ],
        code: {
          PYTHON: `def unfilledSeats(seats: List[int]) -> List[int]:
    present = set(seats)
    return [k for k in range(1, len(seats) + 1) if k not in present]`,
          JAVA: `class Solution {
    public int[] unfilledSeats(int[] seats) {
        Set<Integer> present = new HashSet<>();
        for (int s : seats) present.add(s);
        List<Integer> missing = new ArrayList<>();
        for (int k = 1; k <= seats.length; k++) if (!present.contains(k)) missing.add(k);
        int[] out = new int[missing.size()];
        for (int i = 0; i < out.length; i++) out[i] = missing.get(i);
        return out;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: ["Every seat present: an empty answer."],
        commonMistakes: ["Iterating 0..n − 1 instead of 1..n."],
      },
      {
        title: "Optimal: cyclic placement, then scan",
        order: 2,
        intuition:
          "Use the array as its own lookup table. Swap each value into its home index; if the home already holds the same number, the value is a spare copy and stays where it is. After one sweep, every seat that appears sits at its home, and each index that does not hold its own number marks a missing seat.",
        approach: [
          "Set i = 0. While i < n: let home = seats[i] − 1.",
          "If seats[home] differs from seats[i], swap them and stay at i.",
          "Otherwise (home already correct, or this is a duplicate) move to i + 1.",
          "Finally, collect i + 1 for every index whose value is not i + 1.",
        ],
        code: {
          PYTHON: `def unfilledSeats(seats: List[int]) -> List[int]:
    i = 0
    while i < len(seats):
        home = seats[i] - 1
        if seats[home] != seats[i]:
            seats[i], seats[home] = seats[home], seats[i]
        else:
            i += 1  # already home, or a duplicate with nowhere to go

    return [i + 1 for i in range(len(seats)) if seats[i] != i + 1]`,
          JAVA: `class Solution {
    public int[] unfilledSeats(int[] seats) {
        int i = 0;
        while (i < seats.length) {
            int home = seats[i] - 1;
            if (seats[home] != seats[i]) {
                int tmp = seats[home];
                seats[home] = seats[i];
                seats[i] = tmp;
            } else {
                i++;
            }
        }

        int count = 0;
        for (int k = 0; k < seats.length; k++) if (seats[k] != k + 1) count++;
        int[] missing = new int[count];
        int w = 0;
        for (int k = 0; k < seats.length; k++) if (seats[k] != k + 1) missing[w++] = k + 1;
        return missing;
    }
}`,
        },
        timeComplexity: "O(n) — each swap fixes one value permanently",
        spaceComplexity: "O(1) beyond the output",
        edgeCases: [
          "A log that is already a permutation.",
          "Every entry the same seat number.",
        ],
        commonMistakes: [
          "Comparing seats[home] with home + 1 instead of with seats[i], which loops forever on duplicates.",
          "Reporting the misplaced values rather than the indices that lack their own number.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  {
    slug: "smallest-unclaimed-ticket",
    title: "Smallest Unclaimed Ticket",
    difficulty: "HARD",
    learningObjective:
      "Find the first missing positive in linear time and constant space by placing in-range values at their home index and ignoring the rest.",
    topics: ["arrays"],
    patterns: ["cyclic-placement"],
    statement: [
      para(
        "A raffle lets people claim any integer as their ticket number. The log is messy: it contains duplicates, zeros, negative numbers and very large numbers."
      ),
      rich(
        "Return the smallest positive integer that nobody claimed in ",
        { code: "tickets" },
        ". Aim for linear time and only constant extra memory; you may rearrange the array."
      ),
      example(
        "tickets = [3, -2, 1, 6, 2]",
        "4",
        [
          { state: "[3, -2, 1, 6, 2]", note: "only values 1..5 can affect the answer" },
          {
            state: "[1, 2, 3, 6, -2]",
            note: "after placing 1, 2 and 3 at their homes",
          },
          { state: "index 3 holds 6", note: "4 is not home — 4 is the answer" },
        ],
        "Only values 1..n matter"
      ),
    ],
    constraints: [
      "1 ≤ tickets.length ≤ 100000",
      "-2147483648 ≤ tickets[i] ≤ 2147483647",
    ],
    signature: {
      params: ["int[]"],
      paramNames: ["tickets"],
      returns: "int",
      functionName: "smallestUnclaimed",
    },
    tests: [
      {
        input: "3 -2 1 6 2",
        expected: "4",
        isSample: true,
        explanation:
          "1, 2 and 3 are claimed; 4 is the smallest positive number nobody holds.",
      },
      {
        input: "4 1 2 3",
        expected: "5",
        isSample: true,
        explanation:
          "1 through 4 are all claimed, so the answer is the next number, 5.",
      },
      { input: "1", expected: "2" },
      { input: "2", expected: "1" },
      { input: "-3 0 -1", expected: "1" },
      { input: "1 1 1", expected: "2" },
      { input: "2 2 1", expected: "3" },
      { input: "5 4 3 2 1", expected: "6" },
      { input: "1 2 3 4 5 6 8", expected: "7" },
      { input: "7 8 9 11 12", expected: "1" },
      { input: "2147483647 -2147483648 1", expected: "2" },
      {
        input:
          "1952 1850 318 1624 1371 422 269 600 191 107 1167 1122 931 1165 213 365 1344 1929 303 581 1076 950 1863 147 676 1661 874 343 1666 1789 329 1305 305 900 1135 1462 759 15 727 1807 1024 467 1644 210 294 1097 664 1409 1584 41 728 414 1333 835 175 873 832 1099 1444 690 1900 1318 1274 1104 1611 1587 638 1499 483 1000 258 348 527 969 787 840 601 1063 1672 842 1793 1169 530 551 1495 1678 1654 820 57 977 962 616 682 323 1784 1719 1338 967 1314 -7 723 1598 1720 267 1845 1648 1627 1275 291 1035 1886 1441 1423 599 645 1297 817 1443 815 1902 394 479 1498 732 1724 74 461 125 1292 1649 1289 763 1752 1414 460 133 18 245 1811 830 539 1618 994 1032 1664 1090 1288 838 1821 1820 790 500 62 264 1431 238 1428 1138 217 1313 625 1681 993 909 1911 150 1606 1520 1264 379 198 341 1782 1968 1982 529 1424 765 761 1569 1766 652 8 1589 1810 1070 851 639 257 206 711 361 408 1089 865 899 1248 400 772 306 204 428 1841 1072 1633 510 1853 673 1605 1263 1094 1273 453 646 720 777 1400 1381 1601 25 535 1045 272 1652 1178 1182 1224 1858 1310 1662 1926 1805 1179 190 814 1617 1531 858 615 649 496 24 519 1615 1773 1879 1914 1335 620 1677 1523 1643 504 462 498 844 1398 1418 677 1161 1693 919 121 644 689 1628 262 300 2000 1039 1950 749 59 714 50 1875 103 903 614 1621 575 78 1659 1031 587 1971 1939 278 1594 236 1083 1751 1851 660 480 1553 1578 822 56 1345 481 39 637 1183 1300 1829 82 827 1554 1703 423 1155 1488 22 1885 528 1450 1050 1758 979 234 261 770 1896 898 1235 726 358 1361 1121 246 713 1125 1996 1993 1759 716 1844 708 1266 1086 209 1291 958 1017 226 1214 778 1272 647 1676 520 155 1786 4 1865 253 1607 1199 31 1579 1002 707 1282 1711 586 44 33 16 473 189 337 1562 1380 1236 1108 1874 464 968 1234 401 665 319 1755 1390 1491 754 67 1739 1504 1613 1298 1951 1131 1061 811 1966 165 284 595 918 1392 518 1293 1028 1239 128 704 1960 1706 75 1332 910 126 182 23 540 785 584 1542 1847 961 1834 30 802 381 84 1379 730 43 1727 1025 196 651 1497 1084 95 1626 1157 1005 1472 1591 1940 313 1351 1969 1882 1385 1349 1792 1827 1082 642 1702 1978 110 1760 1294 878 593 397 192 1233 307 1339 1040 280 1064 998 260 1791 265 102 712 1517 1716 1117 1237 1545 268 35 90 1148 1261 1412 1564 52 546 687 1880 1513 458 398 1159 588 470 709 434 972 947 1075 1437 1114 1447 1712 1221 681 568 342 1247 1207 385 1496 617 619 1029 666 427 1928 1190 1295 1856 881 1324 429 948 1052 741 1658 1547 971 867 797 1873 1471 430 448 179 1904 1699 1893 1813 1913 571 163 13 1408 1684 1629 141 1525 983 576 1386 893 508 1552 1908 1069 1687 1691 882 955 895 352 1205 954 1932 1726 6 274 912 1991 697 452 846 920 654 1635 1085 901 1425 1346 1328 1258 1350 3 1184 1098 566 328 1107 1222 988 227 106 1757 1230 1788 604 1762 1663 549 963 1941 73 1265 944 1411 297 1198 663 863 966 1534 1883 657 1636 848 1590 380 1862 79 580 1831 1448 554 501 629 1308 839 89 1176 406 1506 1204 1713 1189 1735 515 1044 9 891 299 1777 390 1331 1934 259 471 1276 474 762 1631 1124 1674 596 1709 1455 674 1382 1193 989 767 463 12 1997 1582 1486 273 662 505 856 378 1347 1403 1011 325 1375 1549 828 992 786 1763 1384 853 1021 1647 368 855 1519 1304 369 1995 122 124 1460 1311 1577 317 1790 373 1876 760 184 459 1772 222 1137 695 320 410 353 60 382 223 1303 747 633 1963 1354 1139 1651 250 1429 256 421 952 1977 1599 48 1680 232 880 534 1937 287 526 1127 1990 1608 1281 1930 1597 1022 524 1336 913 1694 1402 1546 563 1959 1972 1852 1884 153 1737 456 1377 241 351 176 1041 1397 1175 550 1964 1824 389 1888 432 1689 1490 1797 1894 1816 1393 151 420 417 1581 386 634 1457 1640 1987 1201 816 129 703 472 219 1 1427 1620 755 1583 1170 1548 322 177 1609 658 1251 1352 116 1399 188 1359 1355 431 415 1360 161 1087 1730 1144 77 37 1194 789 943 552 488 1426 1729 279 702 104 921 1692 861 843 1931 1372 193 144 803 255 1365 309 744 724 301 1134 793 991 1736 1417 655 879 186 14 883 21 123 1812 1700 495 1933 1278 1014 216 316 904 1212 1268 1714 304 68 1100 1936 1433 1269 533 157 933 594 1586 183 99 1317 810 199 374 731 779 1432 1483 1389 718 172 1203 1544 1725 1521 945 1112 1592 174 391 1493 1690 738 69 439 733 612 783 437 61 849 283 757 659 156 359 1912 1623 668 1146 693 493 547 924 752 1012 1315 1826 572 424 1981 1225 1160 685 1568 1800 746 1923 1942 650 115 591 201 1163 1388 1401 1511 1353 384 142 1440 1187 1947 167 1835 523 1130 1458 710 138 1503 1059 592 769 1533 579 1037 1988 383 1475 1769 1516 706 1363 1270 678 173 1580 1801 17 436 800 1095 1742 1975 149 1655 1704 1464 334 45 1872 1639 1394 1833 1279 1965 514 1855 691 1935 86 780 1794 27 722 1387 285 1142 1396 135 974 435 544 609 982 1854 94 1330 970 195 503 465 247 228 1526 409 908 1439 1141 562 739 1020 1630 1710 1181 111 1638 1867 829 1817 806 1641 1080 70 1734 1508 1616 207 1775 1038 824 1799 675 1574 221 976 302 1057 11 119 980 293 669 1944 1067 1697 648 1670 1756 1065 1632 1864 1415 1008 295 1319 1101 511 934 1921 715 1561 296 1210 1216 1078 166 372 1986 680 997 1857 1761 1226 132 1698 1299 249 326 688 446 137 1974 298 871 1026 602 447 932 1825 1878 1502 1454 1033 1209 1492 490 339 1535 791 239 618 1795 635 1030 1186 696 1003 360 1668 1465 1192 1110 1717 1557 872 477 145 1364 512 1836 1839 1327 1675 1252 736 1653 263 885 2 1213 1119 1480 243 1989 1461 729 906 1111 1054 270 1585 140 113 986 1665 1466 338 1515 248 1686 235 1200 1958 1051 624 796 911 1796 557 117 475 1819 1771 1512 792 1868 1848 187 1732 1983 344 1171 10 590 1006 812 1779 1555 653 484 683 857 1901 1286 548 1637 1905 1924 721 700 774 1034 1042 1430 88 740 1442 753 1405 756 876 543 251 1814 1260 1985 42 887 768 1174 1731 416 1957 362 929 1539 1049 672 866 1482 1634 46 169 282 808 1980 1559 536 1307 1197 1316 1806 92 781 1470 171 897 197 795 1541 553 541 1945 1420 55 1747 1451 7 1081 506 742 1077 97 1708 214 114 1588 1452 363 1368 1753 1453 403 1530 1341 327 990 1015 621 996 289 942 1166 1185 964 907 643 1047 884 686 1395 205 1909 1168 451 26 694 412 1287 1838 1603 252 1765 1322 1489 1970 1245 1285 1832 1657 583 1153 1043 1550 1907 330 570 1823 71 231 1524 1449 1999 393 212 1149 1374 1869 999 854 387 396 923 1456 1815 1610 433 1010 517 1348 995 670 491 333 419 1887 1220 1593 1701 1120 743 87 623 1543 565 1154 1219 926 1906 1093 1056 367 1745 573 1096 636 1596 784 1406 975 1092 987 1223 561 220 1343 1949 1255 80 1560 354 324 1459 1132 1861 1903 564 1920 1956 366 894 985 598 766 1979 776 513 76 605 1019 1507 36 630 1604 859 509 1764 1007 1156 1910 1218 485 957 889 425 532 1808 1478 1227 1373 1136 1667 1301 819 40 679 825 1133 1188 965 877 1306 1102 377 507 852 281 1891 556 560 28 63 1881 1413 1416 1162 1685 1246 1240 1518 356 1622 981 1992 896 112 927 134 1438 1822 959 719 1938 51 868 321 290 1536 53 1474 208 308 1718 1419 277 917 148 1576 332 1009 1004 725 66 1783 960 1660 1476 139 946 442 1477 847 1469 1925 941 531 949 1837 608 1748 146 292 1673 1953 1362 34 160 627 130 1871 178 357 1369 597 127 120 469 347 864 1479 1889 1376 916 58 869 1770 1202 1721 1208 1048 5 610 937 286 1113 1510 244 1410 1646 888 476 1436 1018 233 1892 1302 1804 745 468 558 1849 804 522 136 1243 1487 574 798 1312 1998 928 1723 47 170 1283 405 271 1707 905 1830 1522 521 809 773 487 215 494 486 1151 1463 1337 478 1573 1173 54 1890 1860 1238 482 850 1152 1943 426 1916 1145 1509 1551 345 1023 1973 1320 1785 314 200 1249 1370 1650 1556 559 1715 38 152 833 154 582 418 275 454 1340 1215 350 1036 336 108 1407 1058 922 404 230 164 1738 1244 1866 656 622 1435 1514 826 388 823 1566 1253 951 1537 845 578 1231 661 886 162 254 1501 978 96 1918 1404 1309 131 1776 65 1342 860 1798 1895 492 902 93 1256 1068 29 440 497 1915 821 1744 1688 1143 355 1290 589 641 181 837 626 1682 516 370 1961 1754 764 1774 1473 1126 1140 1358 569 1284 1917 1079 1846 611 1563 444 606 331 1262 1066 938 890 229 841 628 930 1259 1378 818 1828 83 1842 1277 98 1242 1962 1877 64 567 1722 1250 1741 49 1217 376 1984 1625 242 1055 613 1749 203 1527 202 775 499 1016 1614 698 1241 1421 1565 1683 782 538 1505 218 1778 1840 801 1767 168 1357 392 1898 794 1595 438 771 1123 185 105 349 1267 1485 577 1656 735 1994 1927 1383 85 1128 109 1600 1106 1150 407 1899 32 1329 1191 1228 542 1570 1422 224 1768 1919 701 1367 180 1484 1103 751 1787 1053 1558 72 346 457 1060 502 1740 266 413 1528 1325 799 1781 1743 1013 211 118 1922 364 1619 953 717 1366 914 525 836 1001 1567 603 750 81 1180 1257 1074 1229 1642 1115 1843 585 1091 640 1196 1529 20 1468 1976 1750 1027 607 699 1802 973 1859 1129 1434 537 1481 870 748 1164 1211 1540 449 237 399 1575 925 1356 692 1870 411 340 1232 632 1177 335 936 1954 705 915 312 1746 1612 91 225 1602 1105 1391 684 311 445 813 1323 276 862 788 1671 555 1946 1334 1271 940 1780 758 807 1733 1280 1494 450 489 1818 1296 935 734 956 1948 1571 805 310 1195 1695 1088 1147 1116 1803 1172 1572 1645 834 875 1897 443 737 315 19 1696 288 1669 1705 395 831 1809 143 441 371 1046 240 1326 631 375 1109 939 1467 1321 1955 667 158 892 1728 1158 1967 671 1500 1206 1071 159 1254 984 545 402 455 101 1118 1446 194 466 1532 100 1679 1445 1062 1073",
        expected: "1538",
      },
      {
        input:
          "1236 3 1781 1850 1318 1238 1806 281 1562 1891 172 1969 649 1949 195 638 1204 1574 326 826 1968 1052 243 374 541 1982 1063 71 1070 1663 902 963 798 1390 1262 868 59 1445 77 1291 447 1355 674 654 1934 125 746 1367 734 824 444 1681 192 1439 507 1287 1752 1978 1560 1447 768 1344 1009 1347 574 293 344 1809 1805 88 1434 598 1450 1606 1057 1994 1750 101 1173 579 1533 814 1320 1013 1258 461 526 21 179 1454 1423 1256 1026 448 934 1733 804 375 9 1064 199 1855 278 790 711 498 692 1992 901 545 439 1921 702 417 621 570 135 749 1048 1656 1465 1285 1431 1846 372 791 1767 569 559 1100 323 665 1478 1309 863 770 614 1995 1385 966 1159 1280 1360 1596 1971 110 1158 37 121 1492 1905 109 1406 46 1799 1184 1802 142 191 780 717 1766 1130 1662 1444 529 1628 264 1595 1275 1455 1212 1782 999 1166 1314 1683 728 1266 122 763 810 345 1440 239 524 1451 1214 1876 1577 554 316 1947 1536 1551 217 398 490 1513 1753 1555 314 451 1720 580 712 1293 1131 1597 1965 615 330 1161 865 1015 1843 108 1710 1136 773 1087 1265 1122 399 960 1427 206 1881 174 276 1368 823 1644 223 922 854 1679 830 967 359 613 156 1140 777 484 623 993 280 185 1746 1035 1744 433 1059 474 1066 578 951 225 442 436 841 100 1532 15 610 94 937 1274 1038 1263 311 61 1102 1094 1737 1834 72 335 620 1638 1657 126 1101 1388 1348 1707 933 1509 1758 304 519 1230 1119 360 1698 36 532 591 681 235 1623 796 1319 1622 931 471 567 895 566 803 1557 1927 1760 719 871 1500 1342 834 1254 407 755 1114 555 668 367 831 1736 1498 827 843 1284 1193 458 1054 58 1928 91 29 772 1160 1885 815 1222 1395 1999 1068 1845 876 1722 1024 714 385 904 455 619 1548 1677 1570 576 611 295 838 1727 1429 1121 1807 1017 757 1591 752 120 138 1572 1069 164 250 1098 965 1246 761 1252 636 1854 357 1849 1157 1586 1706 1703 1479 352 945 387 949 1824 163 1988 107 69 361 1972 1413 1003 1133 479 641 1966 1030 1667 1109 1571 488 391 741 381 303 732 1567 716 1588 1127 1037 1862 1177 141 1392 1522 1704 817 1033 504 783 266 1516 1044 1081 1797 973 450 820 1408 531 759 1820 1323 1504 659 1942 1005 63 886 392 1882 1202 1249 346 1185 661 1327 52 1589 1694 1738 1072 389 1233 114 919 1800 1844 983 690 1339 7 647 1761 1483 202 652 1362 19 1723 1851 1466 907 914 1954 1617 1164 1853 462 251 708 1333 1789 1135 449 508 168 629 1594 699 1987 93 1741 432 140 940 571 1205 1614 203 1324 1894 1615 1179 1670 376 698 1979 1206 631 1684 666 582 1935 1209 786 1932 787 1869 1793 735 1967 894 222 1962 540 1590 1379 683 1754 1488 1463 1093 1784 1708 1139 1290 1409 891 420 1045 546 96 1654 1221 221 1816 358 1096 1874 73 331 469 1559 74 677 577 968 466 539 1117 1260 535 273 171 562 850 390 1652 1235 860 1721 1247 1000 1110 1796 181 1943 1821 28 765 1937 1549 977 1582 159 1911 457 921 878 602 423 1610 686 1546 797 1079 328 1863 1777 1305 118 67 599 1716 244 704 910 1985 1607 1149 1176 776 1146 819 1801 400 679 696 237 680 1389 39 1695 1931 1021 106 408 771 1338 1636 464 929 1545 1541 608 1019 1550 924 584 995 881 1441 112 56 175 754 1391 460 1255 869 568 1170 523 612 1529 468 617 1813 801 1714 764 1945 544 549 133 388 1399 310 1958 792 689 1243 947 1839 739 1474 1107 845 1270 946 1411 68 671 1023 500 1859 422 1892 430 1151 1508 45 309 618 726 1199 329 197 828 556 231 952 18 1552 1520 134 1490 917 800 1194 911 1152 1790 305 748 1810 1470 1540 989 880 916 427 1717 1705 151 1690 166 637 1518 1841 1865 1861 17 160 180 279 673 1866 373 1948 51 930 534 333 1208 1155 1940 821 822 939 1977 1762 1269 1501 1499 30 1394 1838 848 1964 1297 1337 510 1929 1207 119 1527 105 496 1547 564 306 371 979 701 353 1351 1172 954 76 149 386 1288 70 1620 421 123 513 1735 1020 495 1556 1944 1150 1955 454 1495 1321 1401 1880 1174 1554 1365 1267 1375 1775 301 1215 438 972 299 459 724 393 1680 1795 520 1268 428 1227 35 1773 1481 616 440 282 1524 1519 1148 1833 1468 272 129 688 95 627 184 1900 1649 890 1725 1190 1261 1195 1583 132 537 97 103 707 1171 769 1936 1276 918 1621 550 867 317 47 1742 1125 1751 1901 1568 1506 201 1029 1908 1144 356 955 441 518 985 1803 1771 313 297 116 270 369 1335 154 1827 998 1397 1128 1963 1867 1871 593 969 1228 547 1502 1870 1906 1162 1920 1832 1763 1452 1578 1593 1682 660 158 1819 20 1279 1608 583 5 405 603 84 1304 354 2000 573 775 604 962 1923 465 153 1629 1641 1091 363 1660 1240 1566 736 651 1383 1612 743 723 1991 733 193 409 437 1491 1410 1115 1223 494 927 1601 137 913 144 1648 233 1561 1756 1219 1973 1691 1808 75 1953 853 176 1778 1167 778 1635 1956 1055 277 1825 1175 1837 1687 152 1914 1897 971 503 836 655 789 1776 1493 713 646 1366 1334 478 932 988 1196 1624 851 493 1890 48 260 1422 238 1014 1329 212 350 1272 41 1216 528 975 1857 322 1791 53 211 1639 1581 1779 1747 1475 635 2 1300 1627 1356 656 1675 1711 1369 1292 630 1016 925 1393 1418 1398 1697 1186 1907 751 706 1674 1200 434 1041 1899 818 1283 1884 456 334 1515 600 1645 1840 31 136 742 379 241 1359 1818 1875 1435 1860 1116 1071 411 1941 320 747 1613 256 693 1310 54 425 1097 633 1404 173 57 220 178 835 727 1616 1442 1563 1120 470 327 530 453 1485 663 872 1099 991 905 720 1630 648 640 658 1089 1496 1446 795 1419 1461 1904 1505 34 862 1073 1137 672 196 1585 1298 1060 426 1528 1748 1480 1113 644 1989 1239 806 710 1376 964 1105 605 882 557 650 1879 289 1241 1631 1467 1469 590 1374 756 1436 200 938 483 1512 224 1893 1027 247 1997 127 1984 676 98 210 1678 892 1471 731 1659 362 1112 1051 227 1201 511 552 1006 959 642 1306 1823 66 1182 840 1718 1 366 16 209 298 1124 27 722 492 587 1058 1004 870 291 730 416 1224 355 205 1688 413 1569 1970 1768 1531 1282 1432 1852 485 111 799 1847 443 267 514 294 81 1770 143 1873 1913 1700 1345 452 1095 1939 1203 1189 79 1693 24 1798 55 920 139 480 1925 1086 325 1759 1634 1192 23 1218 130 909 1437 1986 157 155 1764 275 1930 915 565 1974 1647 1245 403 1848 1903 744 1514 1001 1325 1286 1668 1686 1040 1138 1457 1619 99 1602 997 1090 395 1831 246 1692 467 750 1734 1075 1143 1651 1643 1225 394 285 1740 1609 996 253 1580 793 715 1065 431 1565 588 837 858 1732 1598 1815 1259 38 1210 1829 475 1061 1361 885 1165 958 1910 1403 1749 148 1412 525 1424 1046 816 781 1407 64 1745 1889 639 102 678 1575 1579 592 1864 1358 1814 694 1076 856 1449 607 877 1302 1386 1296 517 1788 1642 263 941 1428 1425 1534 1078 1340 1553 117 1050 477 161 1232 1168 1836 1709 575 802 1497 429 384 1787 873 1726 1998 1341 1104 1912 1917 307 248 1699 1951 1062 487 1996 1535 935 1669 1231 234 44 1655 292 1126 40 501 753 186 1264 1396 1036 1311 609 536 1835 62 182 187 1842 337 1421 1564 85 846 832 1299 1229 1653 784 1197 888 486 1887 406 1792 1316 506 961 86 296 257 1352 1031 1618 1349 1957 551 1599 1812 1049 601 1689 906 1331 25 1460 1632 1363 1696 1673 1336 258 1715 976 1405 1676 1420 1129 1183 1765 1032 1672 261 1295 957 875 762 1646 286 300 884 343 1025 1108 833 737 1459 347 410 1783 351 1983 1886 1739 1701 189 10 1111 1755 1242 788 899 1503 502 1959 1384 382 594 950 1828 994 1702 1719 1772 653 669 597 866 1975 926 1426 87 1145 1804 697 1926 1343 1082 857 657 1786 1830 8 936 131 992 1377 269 190 1558 548 645 505 92 1946 1600 288 1462 1018 944 236 667 6 146 1774 1198 324 805 1141 82 538 516 226 1380 1539 1993 809 283 1277 1685 1530 1938 491 533 675 1526 1008 128 42 167 1895 912 1611 664 1785 419 1587 515 1191 606 1357 332 709 183 230 808 1103 162 1521 1757 150 1990 377 1507 839 255 472 50 634 581 1244 404 1543 1780 1303 349 682 1981 1728 685 760 1371 1486 1085 380 811 1088 662 721 1372 703 232 1278 302 1056 177 213 1605 482 948 1826 364 1511 1517 1301 1976 1961 978 785 265 1053 1067 1289 43 1281 1364 859 558 1888 874 1933 1523 342 262 1074 1916 4 1576 1187 1637 684 370 259 984 883 718 383 207 249 22 1022 1640 1456 893 499 1237 1743 1918 1487 942 1039 1896 928 987 553 497 855 1315 1142 339 1257 1538 1378 1458 1883 596 1730 980 1178 1332 1868 115 240 758 1326 1438 887 208 312 1011 245 228 844 1592 252 1664 767 670 1484 982 1661 1346 509 473 65 1370 560 242 561 215 83 315 1482 170 1665 268 1877 1658 1010 794 521 32 229 424 89 287 13 695 1416 1729 1123 476 1731 861 481 1909 849 687 1132 1464 625 1308 169 1794 412 1604 11 49 401 522 1312 956 898 1919 1317 80 198 1822 1402 595 1106 729 1712 1153 1118 586 1430 572 1872 308 194 585 774 1313 1188 1811 974 900 1769 340 1154 397 527 923 271 274 813 1250 402 414 1220 1042 981 1387 1307 1443 1294 1043 284 825 368 1217 446 1226 624 643 1083 632 1012 829 1671 1134 1084 1080 1952 740 60 943 204 1922 1180 104 165 1400 1253 1573 415 879 1448 1163 254 12 691 889 489 1542 341 1713 953 1381 908 1415 33 1077 90 1147 445 1322 113 842 1924 864 1211 1898 214 321 216 1417 1382 626 1817 1902 990 336 543 779 124 700 1858 738 896 1494 78 903 1666 1584 1489 1980 1034 1878 1350 365 147 1724 563 628 1248 145 319 1633 1915 1453 705 1328 1477 14 542 26 812 512 1626 219 1856 1234 1028 1603 338 1251 378 1414 188 852 1002 290 622 847 1213 725 1544 1092 396 1169 348 589 745 970 1353 418 1433 782 1156 1525 1625 986 1960 766 1330 1537 897 1047 807 1271 1472 1473 218 1273 1181 1354 1950 318 1476 1007 1373 1510 435 1650 463",
        expected: "2001",
      },
    ],
    hints: [
      "With n tickets, the answer is at most n + 1. Why?",
      "So only values from 1 to n can matter. Everything else can be ignored.",
      "Put each value v in 1..n at index v − 1 by swapping, skipping values out of range and values whose home already holds them.",
      "After placement, the first index i with tickets[i] != i + 1 gives the answer i + 1; if every index is home, it is n + 1.",
    ],
    solutions: [
      {
        title: "Sort, then walk",
        order: 1,
        intuition:
          "After sorting, positive values appear in increasing order. Walk them with a candidate starting at 1: each time the candidate is found, bump it. The first gap is the answer. Sorting costs O(n log n).",
        approach: [
          "Sort the tickets.",
          "Set want = 1. For each value, if it equals want, increase want.",
          "Return want.",
        ],
        code: {
          PYTHON: `def smallestUnclaimed(tickets: List[int]) -> int:
    want = 1
    for value in sorted(tickets):
        if value == want:
            want += 1
    return want`,
          JAVA: `class Solution {
    public int smallestUnclaimed(int[] tickets) {
        int[] sorted = tickets.clone();
        Arrays.sort(sorted);
        int want = 1;
        for (int value : sorted) if (value == want) want++;
        return want;
    }
}`,
        },
        timeComplexity: "O(n log n)",
        spaceComplexity: "O(n) for the sorted copy",
        edgeCases: ["Duplicates, which equal want only once."],
        commonMistakes: [
          "Breaking at the first value greater than want before duplicates are skipped.",
        ],
      },
      {
        title: "Hash set",
        order: 2,
        intuition:
          "Put every ticket in a set, then count up from 1 until a number is missing. Linear time, but the set is as large as the input.",
        approach: [
          "Build a set of the tickets.",
          "Return the first k ≥ 1 not in the set.",
        ],
        code: {
          PYTHON: `def smallestUnclaimed(tickets: List[int]) -> int:
    claimed = set(tickets)
    k = 1
    while k in claimed:
        k += 1
    return k`,
          JAVA: `class Solution {
    public int smallestUnclaimed(int[] tickets) {
        Set<Integer> claimed = new HashSet<>();
        for (int t : tickets) claimed.add(t);
        int k = 1;
        while (claimed.contains(k)) k++;
        return k;
    }
}`,
        },
        timeComplexity: "O(n)",
        spaceComplexity: "O(n)",
        edgeCases: ["Every value from 1 to n present: the answer is n + 1."],
        commonMistakes: ["Starting the count at 0."],
      },
      {
        title: "Optimal: cyclic placement of in-range values",
        order: 3,
        intuition:
          "n slots can hold at most the values 1..n, so the answer is somewhere in 1..n + 1, and every value outside 1..n is noise. Treat the array as a set of those n candidates: swap each in-range value to its home index v − 1. Afterwards, the first index not holding its own number names the smallest unclaimed ticket.",
        approach: [
          "For each index i: while tickets[i] is in 1..n and its home tickets[tickets[i] − 1] does not already hold it, swap it home.",
          "Then scan: the first i with tickets[i] != i + 1 gives i + 1.",
          "If every index holds its own number, return n + 1.",
        ],
        code: {
          PYTHON: `def smallestUnclaimed(tickets: List[int]) -> int:
    n = len(tickets)
    for i in range(n):
        # Keep sending the value at i home until it is out of range,
        # already home, or a copy of what is home.
        while 1 <= tickets[i] <= n and tickets[tickets[i] - 1] != tickets[i]:
            home = tickets[i] - 1
            tickets[i], tickets[home] = tickets[home], tickets[i]

    for i in range(n):
        if tickets[i] != i + 1:
            return i + 1
    return n + 1`,
          JAVA: `class Solution {
    public int smallestUnclaimed(int[] tickets) {
        int n = tickets.length;
        for (int i = 0; i < n; i++) {
            while (tickets[i] >= 1 && tickets[i] <= n && tickets[tickets[i] - 1] != tickets[i]) {
                int home = tickets[i] - 1;
                int tmp = tickets[home];
                tickets[home] = tickets[i];
                tickets[i] = tmp;
            }
        }
        for (int i = 0; i < n; i++) {
            if (tickets[i] != i + 1) return i + 1;
        }
        return n + 1;
    }
}`,
        },
        timeComplexity: "O(n) — each swap places a value permanently",
        spaceComplexity: "O(1)",
        edgeCases: [
          "No positive values at all: the answer is 1.",
          "A complete run 1..n: the answer is n + 1.",
          "Extreme values such as -2147483648 and 2147483647, which must never be used as indices.",
          "Duplicates of an in-range value.",
        ],
        commonMistakes: [
          "Swapping a duplicate whose home already holds the same value, which loops forever.",
          "Computing the home index before checking the range, which indexes out of bounds.",
          "Returning n instead of n + 1 when every slot is filled.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(1)",
  },

  // ---------------------------------------------------------------------------
  // Prefix sums
  // ---------------------------------------------------------------------------
  {
    slug: "reading-range-totals",
    title: "Reading Range Totals",
    difficulty: "EASY",
    learningObjective:
      "Precompute running totals once so that every range-sum query becomes a single subtraction.",
    topics: ["arrays"],
    patterns: ["prefix-sum"],
    statement: [
      para(
        "A smart meter records the net energy flow for each interval of the day — positive when the house draws power, negative when its panels export it. An analyst asks many questions of the form: what was the total flow from interval l to interval r?"
      ),
      rich(
        "Given ",
        { code: "readings" },
        " and ",
        { code: "queries" },
        ", where each query is a pair ",
        { code: "[l, r]" },
        " of 0-based indices with l ≤ r, return the total of readings[l..r] inclusive for every query, in order."
      ),
      example(
        "readings = [4, -1, 7, 2, 3], queries = [[0, 2], [1, 3], [4, 4]]",
        "[10, 8, 3]",
        [
          {
            state: "prefix = [0, 4, 3, 10, 12, 15]",
            note: "prefix[i] = total of the first i readings",
          },
          { state: "[0, 2]", note: "prefix[3] − prefix[0] = 10" },
          { state: "[1, 3]", note: "prefix[4] − prefix[1] = 8" },
          { state: "[4, 4]", note: "prefix[5] − prefix[4] = 3" },
        ],
        "Each query is one subtraction"
      ),
    ],
    constraints: [
      "1 ≤ readings.length ≤ 100000",
      "-10000 ≤ readings[i] ≤ 10000",
      "1 ≤ queries.length ≤ 100000",
      "0 ≤ l ≤ r < readings.length",
    ],
    signature: {
      params: ["int[]", "int[][]"],
      paramNames: ["readings", "queries"],
      returns: "int[]",
      functionName: "rangeTotals",
    },
    tests: [
      {
        input: "4 -1 7 2 3\n3\n0 2\n1 3\n4 4",
        expected: "10 8 3",
        isSample: true,
        explanation: "4 + (-1) + 7 = 10, (-1) + 7 + 2 = 8, and the single reading 3.",
      },
      { input: "2 2\n2\n0 1\n1 1", expected: "4 2", isSample: true },
      { input: "5\n1\n0 0", expected: "5" },
      { input: "-3 3 -3 3\n4\n0 3\n1 2\n0 0\n3 3", expected: "0 0 -3 3" },
      { input: "0 0 0\n2\n0 2\n1 1", expected: "0 0" },
      {
        input:
          "-1475 5060 -1865 -2250 -6393 2000 -8093 -7218 8214 -2035 3788 -7221 8959 6205 -8443 -1987 -2931 -3178 5708 -5766 -362 -8828 -8191 7050 -222 -9365 3050 2252 3250 -1972 -2240 -6526 7838 5310 -3650 521 -505 2505 -4022 1926 -1420 -1989 2471 -9496 -5053 -6898 6404 -2520 -8670 2907 6633 2406 -2708 -47 3863 -9920 2571 -3780 6937 1109 -2037 7420 4640 -9171 4709 -172 -1893 829 6808 -1434 -637 -9595 397 -1420 -491 453 2492 2125 -6914 6809 -4028 -8783 2910 -7217 -4988 -7199 -7255 4579 286 -6261 8584 2620 -1491 6664 9971 4433 3794 -7009 6791 1542 5075 1400 -6844 -5528 -7068 -5039 1626 -2129 -4441 -5671 383 4310 -8337 393 1235 9402 6392 921 7298 -2952 7587 5558 -856 9628 -3859 8774 -5607 2440 6845 -6397 5955 -6345 -3948 -5039 8952 -8825 -4871 3752 -8880 9049 -9245 9028 6949 -4797 5581 3036 5445 -6488 -8111 2003 5403 -5364 -1096 8820 9154 -4910 7614 -3112 7508 2895 -7063 -9753 -1709 7027 -2970 -5893 9049 7571 -1990 5159 -5950 -2393 5699 3084 -4236 -306 6718 4203 -7926 -7332 4925 -3083 852 -142 -5010 5404 9690 4331 -7104 2955 2427 -9472 -6550 6172 -6998 2190 -8148 1438 -504 3743 -8459 -6699 -8077 4046 -7293 -5153 -7568 8877 7467 -5521 90 4644 3961 6820 -9382 4410 1791 -429 -1705 -4707 8708 -9133 2988 1141 -623 -7231 6184 8784 -673 -4128 -5122 2500 3392 -1220 1812 1046 -1555 4006 8955 6877 5866 2600 -1216 8609 -4626 -6032 8907 -7897 -6748 -3750 -6407 -4011 -2683 -5892 4626 -5260 -6304 6985 -573 -7612 -8598 944 -4959 -5213 2514 -308 8074 5292 7823 -9167 -8198 6784 -9120 -3787 5 1755 -7352 -2003 1913 7224 2802 -1022 -3359 -6786 -8334 -221 -4829 -3936 -7229 -300 7809 -5820 -4834 397 4010 -1092 -2059 9363 4450 8686 -4123 3066 -4207 7874 -2319 4341 -6495 -5258 8505 -9154 3274 -5225 -3751 -1547 3624 -8794 -4793 8321 -7878 987 2916 -8259 -4619 5448 -7013 5581 6296 -67 -6235 -962 6014 561 -6273 -7908 5662 -7231 3844 -4255 -2874 -8409 -7376 4606 8702 1477 9849 9057 7708 -8726 -4490 6613 2584 -8634 -1736 -3352 -2859 8352 -4696 6969 -4214 927 2272 9003 -645 -6220 2325 -8148 -4937 -262 8142 4924 -804 5098 7355 -1399 1533 -2305 2491 3006 -1187 9370 9814 2989 2767 -1563 -5935 -6564 -4832 8088 -6691 2187 -3493 -5756 -4175 1545 -238 -2019 -6302 9455 4823 2843 8726 -6623 -657 -8113 6978 -138 5554 255 -3535 -6532 -7765 -5214 7581 9852 -251 9418 -5538 5146 5594 4127 2259 -5655 -8849 -4817 -4590 -8977 5228 311 111 1658 -5787 8081 7101 4016 6324 -5826 3907 8327 -3300 -5040 -6621 1106 7001 5139 7095 -9427 -4676 963 -3440 -6785 1037 6051 -4071 -7822 -3457 -8518 -9374 -2701 8658 -9994 -8809 -5528 798 -2242 -2168 -4787 1670 -3517 -177 -6550 -7458 -3691 -3949 -9381 -7453 -6044 -8269 -7681 -2100 7768 -147 4971 3474 9462 8944 -1650 -6900 5463 284 -6667 -6168 6738 -2369 634 306 -8407 -6961 3038 7318 742 7135 5859 -1567 -1126 4348 -4278 -188 -3497 -7490 -3953 8710 9663 2644 -7038 11 -6875 -5637 -4820 8665 -7771 -7284 -2314 3073 5147 6412 -9792 1754 -2789 -5597 -3585 4473 3638 6437 2986 1641 5281 -4170 -5546 5258 -8349 338 8113 6729 2255 2289 6335 -9302 -5901 -6476 -8547 -7631 -3782 6430 4488 206 -885 -2539 6599 2295 7474 -1983 -161 2513 8416 2219 7340 7913 8120 -3062 45 -5320 5081 -6961 5047 6931 4858 -5136 5497 1304 -3597 -9646 4762 4518 7807 6124 -8004 2999 -7568 9500 1379 -4047 -4764 -7366 -2723 -8910 -3621 -9385 -7997 3162 -3520 -9787 3461 4441 -9392 8926 -1736 4797 2543 858 3580 8188 4295 -2110 2264 -2041 -6560 3467 -7373 2160 5589 8768 5801 8980 6880 7974 -5544 -5602 -3726 6585 1680 4050 -7599 -8972 -8709 -910 -4830 -5482 8101 8516 4398 -6929 -6098 -7032 -1953 -4608 -8934 -5205 7043 9602 4836 536 2778 2994 2418 2432 4540 131 -8316 4461 3866 -6895 -5995 303 -6707 6225 -8723 8595 9226 9535 -4825 -8516 -1404 314 -4596 -9339 -6964 8478 -9997 -9973 -5163 4353 9672 4324 -4956 -6195 8759 9221 -5892 4773 8154 -8229 7239 -8221 583 5791 2482 6001 7632 9359 -5297 -8124 3981 -2511 -5464 -6113 9932 5639 875 -6382 -914 1598 -7565 -8206 9816 5947 -2769 5069 -7089 -9366 -5864 4513 -6553 -5695 -4628 -4312 -3798 -4481 -5661 -497 -3921 3675 -2287 -7173 9543 7792 -9548 1551 -2965 -5484 -6826 1243 1660 5165 -2227 -853 -9676 -8497 1366 -3708 5956 7241 -2804 -7537 9157 3710 -9334 9077 8871 5181 -4468 -237 3830 -632 3242 5865 8034 9692 8846 4573 -6814 780 -7082 -7273 -8402 -3146 -7415 -8971 -4818 8730 -4097 -3418 -5357 -9768 6374 5096 4149 -9212 2797 1486 2160 7556 -7635 -7632 -3931 -4092 3105 138 -3387 -4600 655 6909 6581 1342 70 5200 -433 -1362 -3544 6039 -947 -9913 -7515 8703 -8354 -980 16 6569 -65 -5036 -770 3821 -9593 -7546 -1236 -564 5754 -8059 -6324 7095 -4989 -7849 -5049 -6448 7323 -7365 -492 8827 -6733 -9168 -3519 7284 7115 -3355 9647 4270 -6447 -9470 3651 8759 -2326 5235 -7149 -1514 5449 3903 5559 2872 -6462 -3125 4961 4240 1571 8091 137 -5018 6407 -8765 -3732 8648 -7847 -5026 1435 -3018 981 -3817 -2533 2419 -1968 7386 3561 509 -4377 -5712 2699 -457 -4803 -4074 -5309 -3539 1150 -6003 5904 1866 5899 -2259 3342 5671 383 7177 4433 6176 558 -6528 1612 -537 7952 -2452 -4961 -7568 -5779 5653 6359 4596 -9093 9793 1325 2464 -4211 -9173 -1503 -5934 -3938 3061 2525 -6656 -6900 -5821 5380 -229 4985 2659 6452 -6765 194 9735 -4808 1177 2256 -1613 5258 3418 -9788 -4946 -6548 -5747 -6181 -8450 1158 -1810 -6867 3144 -107 -8152 -4774 503 1226 5808 -7722 3436 -2750 -3475 5197 1365 4268 -334 -1266 -6742 1533 -7515 1502 -5024 -5089 -9243 -9 9590 -5685 6997 6520 6864 -7291 9098 -8145 -9449 -6914 -7925 -762 -1988 -191 659 232 7428 5843 1265 -100 4066 6277 9575 2711 -3192 -61 -622 -2360 7899 -7573 4046 -3781 6077 -8456 8310 -3659 -657 -786 -5486 4130 6212 9340 7880 -912 -3714 4807 6700 9588 -2796 5747 4597 -5797 -6080 -1530 -5987 -8228 -9199 -6769 1659 5290 6817 7696 3314 7145 -6436 6514 -4222 -9572 -8339 -2964 -7120 9759 4775 6581 -4092 -1779 3325 -3354 1135 5055 5198 -5122 2488 -6522 -5286 -3319 5010 239 9647 -7103 -2576 769 170 5861 5846 -8242 -4250 2360 3644 4212 5185 4195 -9481 -1433 -12 -6329 457 375 9655 -1692 830 2191 8051 -322 -9361 7921 756 8808 -7906 -8266 2763 -959 1281 -6662 -1625 2065 7696 3830 1574 -4317 1187 -802 1058 7803 -3750 -3570 -7048 -7531 -6666 -3724 9042 -6755 -6574 4279 7560 7089 -9824 -4611 -1705 1184 -3156 8248 -4423 7783 7667 9410 -1149 -2696 9885 -6244 -4802 -9916 9536 -5378 -3926 -3386 2914 -4444 -4785 -8207 4532 5179 -5360 6879 -1909 9082 8791 -5460 -2221 -7691 -4093 416 6767 -8875 6613 -6639 1704 -1167 5756 5216 4132 9278 4530 -6284 2247 2731 -4219 -7043 -4831 5057 -7415 9285 -7109 7976 3199 8253 5069 -5362 -1338 7220 5564 7828 -9788 3809 2172 2274 675 1082 -4641 1256 7748 -8690 5464 -1337 -6308 382\n400\n466 792\n316 709\n934 1005\n33 678\n719 1011\n1056 1140\n1092 1177\n998 1151\n681 987\n890 1045\n58 192\n1083 1164\n772 869\n94 730\n154 995\n627 805\n431 720\n512 567\n737 1025\n799 1089\n740 1078\n591 1109\n556 1192\n564 765\n230 372\n352 365\n682 1185\n855 964\n346 353\n662 1172\n788 1163\n1026 1092\n428 914\n704 708\n1014 1031\n1162 1169\n127 733\n875 914\n744 922\n995 1165\n1130 1179\n950 1110\n894 1109\n813 945\n239 362\n1175 1181\n64 877\n53 882\n1005 1017\n809 1038\n194 893\n419 973\n935 1106\n231 468\n957 1105\n474 1196\n1084 1198\n64 336\n893 897\n1052 1083\n628 908\n1147 1195\n613 706\n784 1047\n859 1098\n1040 1068\n3 806\n516 526\n1055 1072\n128 321\n1010 1018\n297 779\n316 488\n247 958\n1138 1142\n236 289\n1111 1119\n92 133\n484 1135\n302 390\n873 914\n804 1122\n76 926\n1014 1160\n1007 1105\n653 1098\n282 921\n954 1088\n1197 1198\n77 1020\n972 995\n696 1084\n53 366\n695 1115\n751 816\n469 974\n197 869\n1188 1194\n478 740\n415 765\n882 931\n7 789\n541 967\n596 1005\n537 648\n686 1060\n1055 1096\n56 518\n485 1011\n862 882\n357 557\n801 1071\n1061 1167\n307 716\n655 748\n991 1114\n872 931\n992 1130\n913 1027\n993 1040\n1170 1196\n1013 1108\n168 964\n939 1194\n264 877\n1030 1075\n1066 1129\n725 733\n1146 1156\n79 484\n663 765\n110 320\n430 1198\n1100 1196\n446 700\n701 1018\n1183 1195\n385 616\n226 379\n195 1163\n77 104\n721 1088\n869 924\n340 870\n187 809\n348 1076\n1091 1176\n229 617\n970 1175\n340 609\n108 321\n963 1090\n630 1150\n625 769\n562 941\n1037 1120\n586 588\n226 340\n1152 1176\n104 322\n521 1034\n492 1163\n439 781\n892 1140\n774 1035\n430 939\n1141 1179\n774 989\n470 654\n740 1079\n830 989\n1029 1117\n671 1070\n906 1165\n1134 1190\n848 938\n126 713\n1164 1192\n597 1006\n723 794\n555 1050\n748 755\n510 1013\n640 1102\n934 1007\n503 531\n143 1066\n917 1075\n778 1025\n729 1187\n1133 1178\n912 1083\n907 1001\n666 794\n314 1125\n421 991\n365 444\n954 1013\n801 1151\n987 1149\n87 708\n1117 1162\n248 1137\n765 824\n541 773\n315 822\n898 923\n8 189\n908 936\n1052 1167\n1055 1105\n502 1067\n1105 1147\n968 1059\n32 837\n451 530\n51 1032\n226 521\n531 752\n591 1181\n154 319\n987 1019\n469 522\n64 164\n302 1065\n110 245\n981 1007\n784 994\n491 848\n1103 1120\n982 1018\n1100 1149\n589 678\n554 1044\n762 1166\n989 993\n1160 1185\n1125 1131\n684 692\n464 878\n114 1106\n556 869\n275 532\n172 561\n331 608\n559 1010\n1183 1197\n518 1162\n890 1005\n707 1189\n203 442\n604 773\n656 1023\n716 1021\n1111 1144\n839 1055\n547 663\n646 1140\n840 1001\n1144 1161\n649 1176\n540 1163\n637 1163\n971 1146\n264 1154\n430 1171\n647 1190\n943 1153\n324 881\n41 775\n272 864\n101 990\n1177 1189\n831 1066\n1198 1199\n138 177\n800 839\n934 1073\n1138 1144\n781 863\n950 1029\n1135 1156\n733 963\n528 743\n804 871\n482 868\n380 1017\n317 514\n692 1122\n414 924\n310 369\n153 1102\n317 867\n390 701\n145 852\n1189 1198\n264 709\n181 1095\n900 1093\n26 188\n294 476\n229 389\n1194 1199\n140 673\n1172 1192\n529 707\n1059 1070\n1083 1157\n1076 1077\n988 1061\n977 1176\n1153 1192\n147 529\n1 1135\n431 1085\n533 853\n733 934\n261 1187\n978 1090\n857 982\n291 607\n788 1186\n855 920\n314 338\n313 538\n603 952\n281 986\n790 838\n1087 1091\n483 728\n104 1091\n796 1030\n1147 1185\n653 1163\n926 1021\n248 566\n277 1187\n204 827\n140 445\n235 355\n591 603\n602 690\n824 1082\n968 1134\n1186 1191\n972 981\n387 877\n1025 1177\n1009 1171\n328 612\n865 1145\n70 432\n217 563\n603 1108\n811 1091\n632 1153\n548 1044\n599 1097\n787 1141\n834 971\n199 805\n727 907\n838 996\n965 978\n1126 1196\n475 478\n1178 1185\n479 737\n448 969\n174 509\n125 593\n160 836\n615 827\n505 1182\n491 727\n620 892\n176 1034\n1089 1125\n742 1107\n517 679\n826 853\n813 1137\n781 1175\n234 442\n102 419\n369 724\n87 929\n464 1023\n519 915\n485 1018\n628 1157\n480 549\n887 953\n862 987\n1169 1181\n827 1137\n629 644\n838 910\n758 1170\n976 1019",
        expected:
          "-92824 -51519 -44945 -154792 -149422 -775 -15098 22474 -159009 -21963 33771 -2119 -77923 -135494 -290190 -83088 -71362 18718 -71782 -37916 -71635 -142661 -62426 -16038 -51879 -2022 -73697 -42970 -10033 -131430 -68617 -1694 -157250 3951 3859 27606 -166584 17146 -54352 50233 4709 20500 -3765 -60316 -73166 21311 -220234 -217282 18212 -68329 -256579 -268274 -16426 -89554 28359 -84194 27925 -69309 13036 10134 -119874 47834 14899 -65462 -24673 -5512 -222555 -12567 -6386 -76507 16007 -110165 -65986 -304180 -13627 -62726 -3280 29857 -118148 -3138 14310 -78977 -233321 14626 31119 -133270 -202548 28552 -7645 -238296 7137 -124909 -68851 -135665 -10577 -192697 -226796 10566 -19905 -103366 -3365 -206303 -124013 -154014 13430 -121335 4533 -123228 -150323 -12239 -75527 -63566 18594 -65955 -81978 46803 -4222 55983 -32815 47994 23495 46964 -290134 15567 -197577 17623 21040 -14600 5201 -112141 -28921 -25538 -169661 36005 -84372 -145494 16509 -90166 -30203 -268179 -13002 -119048 -22186 -128886 -210123 -181044 -14266 -133965 35038 -39224 -43909 33641 -150062 -46693 -81786 -9523 4931 -87952 -3855 -61138 -104966 -118348 -155807 -10917 -96783 -169099 19871 -152998 -8623 -77964 -88634 -13768 -143661 -33168 23036 12257 -126844 34351 -138552 -56219 -99883 2681 -132323 -131075 -47324 -25496 -261004 -33896 -56102 -56582 -9584 -33271 -68621 -66540 -200960 -269779 46887 -1827 -55135 56908 -69812 9207 -272616 -55487 -4783 -157593 2007 11252 -12020 17231 7479 -125574 -20384 9609 -235034 -116398 -261762 -144015 -33885 -138000 -72576 55207 -56433 20193 -215525 60398 -5441 -102610 -87320 -22543 23362 -3241 -56559 -118246 -68904 14668 50277 24840 9609 -133047 -197921 -61352 -116370 -161416 -69687 -125421 20636 -109766 -34836 -108098 -22229 -3420 -126298 -122263 -20773 -5664 6692 -112829 -27331 6548 -123826 -102118 -127284 19425 -231266 -196773 -69630 -27428 -151577 -171948 -193575 -297113 36876 -31252 -5926 36729 -49604 -17402 -17302 -28806 8111 -12680 -94413 -20082 -35508 -62096 -211569 -63756 -141298 -185884 -16350 -233600 -151014 -66068 -237460 -2477 -82563 -265642 -30084 26902 -84705 -44238 -2741 -117082 28979 52154 2052 -17734 -10914 49517 36392 32358 -174008 -289951 -188778 -81032 -48889 -197914 44138 -74755 -81896 -39637 -1794 -27907 -86681 -128315 -281751 -65908 7802 -19471 -214811 -73437 51937 -135329 1284 -140067 -183001 -216506 -24239 -70330 -56401 16380 -34145 31629 224 8696 -182436 -14683 23345 -56917 -48523 -41439 -131461 -92082 -38949 -161885 -133764 -112206 -70348 -58969 -191046 -56364 -36494 -7567 45488 -24094 30433 -6738 -248098 -170769 -109984 -256537 -99454 -109142 -21742 -115241 -280925 -11307 -54478 -10930 -21601 -59256 -67070 -28144 -25150 -77768 -191137 -145910 -68764 -132873 -162954 -2593 -41234 -93720 5591 -33213 -36377 15948 -70123 42212",
      },
      {
        input:
          "10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000 10000\n3\n0 999\n500 999\n0 0",
        expected: "10000000 5000000 10000",
      },
    ],
    hints: [
      "Summing each range directly is fine for one query. With a hundred thousand queries over a hundred thousand readings, it is ten billion additions.",
      "What if you knew the total of every prefix of the readings?",
      "The total of l..r is (total of the first r + 1 readings) − (total of the first l readings).",
      "Store prefix[0] = 0 so that ranges starting at index 0 need no special case.",
    ],
    solutions: [
      {
        title: "Sum each range directly",
        order: 1,
        intuition:
          "Answer each query by adding up its readings. Correct, and fine for a handful of queries, but the same additions are repeated for overlapping ranges.",
        approach: [
          "For each query [l, r], add readings[l] through readings[r].",
          "Collect the totals.",
        ],
        code: {
          PYTHON: `def rangeTotals(readings: List[int], queries: List[List[int]]) -> List[int]:
    return [sum(readings[l:r + 1]) for l, r in queries]`,
          JAVA: `class Solution {
    public int[] rangeTotals(int[] readings, int[][] queries) {
        int[] out = new int[queries.length];
        for (int q = 0; q < queries.length; q++) {
            for (int i = queries[q][0]; i <= queries[q][1]; i++) out[q] += readings[i];
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(n · q)",
        spaceComplexity: "O(1) beyond the output",
        edgeCases: ["A query covering a single reading."],
        commonMistakes: ["Treating r as exclusive."],
      },
      {
        title: "Optimal: prefix totals",
        order: 2,
        intuition:
          "prefix[i] holds the total of the first i readings. Any range total is the difference of two prefixes: everything up to r, minus everything before l. One linear pass builds the table, and each query is then O(1).",
        approach: [
          "Build prefix of length n + 1 with prefix[0] = 0 and prefix[i + 1] = prefix[i] + readings[i].",
          "For each query [l, r], the answer is prefix[r + 1] − prefix[l].",
        ],
        code: {
          PYTHON: `def rangeTotals(readings: List[int], queries: List[List[int]]) -> List[int]:
    prefix = [0]
    for value in readings:
        prefix.append(prefix[-1] + value)

    answers = []
    for l, r in queries:
        answers.append(prefix[r + 1] - prefix[l])
    return answers`,
          JAVA: `class Solution {
    public int[] rangeTotals(int[] readings, int[][] queries) {
        long[] prefix = new long[readings.length + 1];
        for (int i = 0; i < readings.length; i++) prefix[i + 1] = prefix[i] + readings[i];

        int[] answers = new int[queries.length];
        for (int q = 0; q < queries.length; q++) {
            answers[q] = (int) (prefix[queries[q][1] + 1] - prefix[queries[q][0]]);
        }
        return answers;
    }
}`,
        },
        timeComplexity: "O(n + q)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A range starting at index 0, handled by prefix[0] = 0.",
          "A range covering the whole array.",
          "Negative readings, which need no special handling.",
        ],
        commonMistakes: [
          "Using prefix[r] − prefix[l], which drops the last reading.",
          "Building an n-length prefix array and then special-casing l = 0.",
        ],
      },
    ],
    expectedTime: "O(n + q)",
    expectedSpace: "O(n)",
  },

  {
    slug: "divisible-stretches",
    title: "Divisible Stretches",
    difficulty: "MEDIUM",
    learningObjective:
      "Count ranges with a sum property by grouping prefix sums by remainder, normalising remainders of negative totals.",
    topics: ["arrays", "hashing"],
    patterns: ["prefix-sum", "hashing"],
    statement: [
      para(
        "A shipping company records the daily change in its container count — positive when containers arrive, negative when they leave. Containers are loaded onto trains of a fixed capacity, so a stretch of consecutive days is tidy when its net change is an exact multiple of that capacity."
      ),
      rich(
        "Return how many non-empty contiguous stretches of ",
        { code: "values" },
        " have a total divisible by ",
        { code: "k" },
        ". A total of 0 counts, and negative multiples count."
      ),
      example(
        "values = [3, 1, 2, -2, 5], k = 3",
        "7",
        [
          {
            state: "prefix totals 0, 3, 4, 6, 4, 9",
            note: "start with the empty prefix",
          },
          {
            state: "remainders 0, 0, 1, 0, 1, 0",
            note: "two prefixes with equal remainder bound a divisible stretch",
          },
          { state: "four 0s → 6 pairs, two 1s → 1 pair", note: "6 + 1 = 7 stretches" },
        ],
        "Pairing prefixes by remainder"
      ),
    ],
    constraints: [
      "1 ≤ values.length ≤ 30000",
      "-10000 ≤ values[i] ≤ 10000",
      "1 ≤ k ≤ 10000",
    ],
    signature: {
      params: ["int[]", "int"],
      paramNames: ["values", "k"],
      returns: "int",
      functionName: "countDivisibleStretches",
    },
    tests: [
      {
        input: "3 1 2 -2 5\n3",
        expected: "7",
        isSample: true,
        explanation:
          "Seven stretches: [3], [3, 1, 2], the whole list, [1, 2], [1, 2, -2, 5], [2, -2] and [-2, 5]. Each totals 0, 3, 6 or 9.",
      },
      {
        input: "2 -2\n4",
        expected: "1",
        isSample: true,
        explanation:
          "Only the whole stretch, totalling 0, works — and 0 is a multiple of every k.",
      },
      { input: "5\n5", expected: "1" },
      { input: "4\n5", expected: "0" },
      { input: "-1 2 9\n2", expected: "2" },
      { input: "0 0 0\n7", expected: "6" },
      { input: "1 2 3 4 5\n1", expected: "15" },
      { input: "-7 -3 10 4 -4 6 1\n4", expected: "7" },
      {
        input:
          "45 -10 22 47 26 16 -22 11 -17 -35 23 -16 44 50 -6 -43 -11 9 29 31 17 -5 1 48 24 -4 25 -36 3 -47 15 -17 -48 47 -9 31 9 -3 49 -15 -13 -34 -12 38 -45 -32 -39 47 -2 -4 36 -24 -45 -14 43 43 -41 -8 24 15 50 -2 -42 6 1 15 -48 -7 -18 46 -8 -25 41 22 20 -29 20 -25 -47 -25 1 17 -2 26 -26 -35 12 -8 -35 -18 13 -38 -13 -6 -32 40 39 15 33 -3 -34 -38 -24 15 -38 -4 49 -44 -22 5 3 -18 30 -48 -27 37 12 -31 -43 -5 6 -24 18 18 29 28 -4 38 -5 29 -48 7 -35 -5 -12 -47 -44 -4 -5 -15 -25 -21 41 -8 22 -12 25 -24 -32 -37 -45 -5 -38 28 38 18 -36 50 13 20 -39 -17 -17 33 21 11 6 -30 11 47 16 -50 -43 -33 20 19 7 -2 44 -10 14 -46 -7 -9 -33 -34 -28 40 22 -41 -26 -15 15 -17 46 -17 -32 1 -11 -35 44 -27 44 44 37 -12 -42 -27 -47 49 3 6 -46 4 1 17 42 23 29 -16 -37 31 18 40 -38 -27 1 8 -44 -8 46 -36 -6 46 35 42 -3 -27 -25 1 -15 -45 31 -18 -22 -10 -3 -11 -16 23 11 17 -8 17 49 -38 -15 17 50 -23 6 43 -26 -42 -50 21 -44 -17 29 21 -12 -3 42 -32 -31 -25 34 0 -22 -31 26 -7 -34 -18 -18 32 -6 6 22 -36 -6 -1 12 45 -14 1 -39 1 0 -3\n13",
        expected: "3494",
      },
      {
        input:
          "2913 3233 -8361 -9988 -9076 -6926 3083 3862 91 7211 -7161 2547 -6945 6924 -1693 3371 5876 -4006 6903 4154 -2700 8183 -5632 6876 -1506 -7457 8272 -540 8164 -2366 9107 2696 7638 -1115 9054 5535 2175 5328 9692 -9342 -9850 5650 -7689 -5695 8766 2726 -4867 8976 7710 -4225 898 894 -9337 3195 -4188 3663 -391 6059 9657 -7036 -4474 4928 -1947 6087 3842 -9639 -6484 3563 484 -9435 -7701 8211 9005 9973 3160 -125 1208 -9450 -2817 3002 138 -2670 3279 1315 9982 2638 2363 8322 1988 -9702 8079 -4619 3879 -6773 5446 5315 1038 1987 9568 -2455 -4935 -4555 -2112 7528 2483 -4681 -9973 -8607 8959 3796 -3252 -3779 -6441 -2623 -8926 -9560 -9337 -496 4227 4641 8494 -5919 -3828 4089 -9057 -686 6326 -9988 -8273 -2730 30 4461 4951 2098 1950 5981 8653 -3361 5019 -3434 -3209 8913 2653 -6701 1775 179 -4868 -7203 -2609 7633 3951 1047 -8700 -5556 6692 904 -5143 -5078 8942 -7834 5211 5042 5725 -113 -9732 6037 -7659 -2949 -3292 9688 5683 -5686 -7429 652 -4305 -7942 1780 7335 640 -492 -2924 5362 -1971 -6661 2614 4895 4028 3564 5602 -5559 9889 -6539 9348 8510 9403 -777 -3695 4525 274 4195 8696 2862 -8109 4453 -1136 -191 -1631 -7835 8511 7597 874 2531 9123 -5908 7252 1422 -594 -1914 7351 -6360 3725 -4171 6531 -3544 -9796 1204 5427 4444 -6974 -2541 -6160 -3863 -9634 -2194 6108 -4500 -5700 3583 -4388 -7642 934 -7963 3216 -1362 1166 9522 9674 -5394 -4930 3187 -3654 9650 -981 -3248 -5613 3090 3309 5105 4146 5052 -2690 2450 5465 4193 3928 -4612 7093 -568 -5264 2247 -3308 -2231 6680 -1604 -1233 -9370 -9489 -2587 8193 5657 7475 5345 3672 4320 4818 -8166 3427 468 -956 9072 9578 -8121 5996 6949 5594 -6756 -8318 5145 9911 -8281 1242 -9473 -9253 -1165 7187 -7721 3723 -2029 -7324 -7669 -8946 -7974 -5348 -4120 8081 -5059 -7761 4494 3058 -3567 6814 -699 6109 2995 -4186 430 3711 1256 2199 5350 4536 8426 873 7381 -6251 9122 -3195 4559 5658 7713 5781 -6029 6989 5786 -3898 6530 7401 3175 2564 -6309 -2070 -6790 -4580 4913 -1947 -710 9345 4551 -7465 -8441 -8747 -9218 2095 5924 8939 7637 6478 -3410 3581 -3075 -7984 3500 -7834 -5218 -9344 -2230 1520 686 -5114 -9553 -6269 -6730 -9482 2438 -2609 8527 7608 3122 7764 -6712 1403 -2568 6937 -9040 -1469 703 -4987 -1858 1022 7391 3762 -3246 2081 -867 4899 8483 -4225 4880 218 1061 -4867 -2310 -5373 -791 5904 2654 -7330 4685 5890 1904 -5979 2824 -4527 7530 6851 -8474 -6381 4823 -7542 3886 -3049 -6350 9863 -4154 -4629 8892 -7487 414 -216 -8745 6956 -9874 -6835 -8729 -9592 8622 -7526 5631 6882 672 -7906 7760 7984 -3510 -3547 9963 2135 -1219 -9045 -5503 -1102 1609 872 -4551 -5249 -253 -7815 -1815 -4619 388 -5001 2027 2539 2301 -4467 3458 -7950 -5337 -5262 2425 -4907 -8953 -7749 1346 -9640 2084 9370 8750 2740 6323 5573 -7535 -1105 -2159 382 3637 669 9048 -6249 -6595 5745 8212 2790 9889 -2684 1110 -2585 -4275 1059 -6403 -9450 5613 -5502 101 -4160 -4626 3358 1336 8568 -6213 -7211 6469 9252 -934 2031 548 505 4479 -2948 -7344 3996 2003 2805 5680 1679 2459 -8009 -7721 4930 8571 -4260 6050 -3440 5287 -8911 9646 -8361 768 -4906 9457 3239 -4258 8885 6585 -9641 -4059 3858 7814 -7061 8603 9749 -6498 -645 -8646 8221 -8992 7761 9855 -1784 5266 -797 -215 -3597 -6476 -6388 2543 7190 825 3265 6833 -4337 -886 2901 -3048 7316 -878 5895 -7169 7841 -1127 3747 7038 -4304 1682 3846 1734 -4147 -4825 6116 -5589 -7227 7061 624 -9066 -4245 8844 2978 8957 2153 9806 5949 -5285 5671 -6825 4627 -6799 -1474 -6892 -9906 -3516 7188 9126 -1664 6475 -641 5168 2720 42 8293 -2855 -4343 4872 2959 7951 -3086 -6238 4059 -2942 5290 -8251 -9964 5962 -1798 -1264 6106 -7878 -6989 9346 -8358 8626 -6216 4005 6657 -7452 2528 2012 -8561 5220 -579 2591 -3723 -7256 -4014 -1045 -6286 459 7262 5953 3367 1917 5060 -1805 2597 -4422 4248 -9746 -7160 6951 7935 -8231 3669 -5187 -6630 377 2319 -6540 2534 -7195 9775 -5813 -2350 4498 799 3600 2981 8475 3705 -3492 -8510 -3729 -2932 -8731 5562 1945 1541 216 -7556 -4010 -1126 9503 2964 1640 -4898 8551 -2532 -5665 -1515 -1881 2719 4604 9446 2859 -7157 -5729 7828 4548 3817 4590 -2803 -1284 -7318 -3198 -5551 6048 -2766 9153 202 5353 9760 6919 4331 -5233 7007 1329 -7884 8876 -575 -1580 1022 -868 8425 -8093 -1429 -6132 2854 924 5956 363 -2988 6721 7866 4434 -4591 634 -1268 7294 1567 5025 9184 -7505 243 8751 7723 5127 -2519 -4706 8031 -4403 3981 7606 -4207 1826 7170 9525 6736 -1155 -6624 -5197 -2042 7563 9545 2480 749 6929 -8910 -7703 -2490 862 5098 329 -5771 1957 -2135 -5669 -4340 -8390 -3553 -9862 3355 -459 9223 4240 -2659 -3936 5124 2524 -1269 -99 -904 2552 5235 3365 -1549 -7877 3436 -4315 -4842 -7689 7996 3634 2563 -215 9434 9481 5276 7409 -7245 8688 -5716 2266 6552 -2796 -1635 -7013 -3256 -4485 9258 -9772 -6282 4249 9555 3006 -6397 8667 1770 7361 -3909 -9649 6157 -7726 9387 1383 -3675 2727 -5967 -3618 6313 4164 -5515 -3854 3650 8336 -2579 -8808 -8156 1912 -8115 -5940 3803 -3232 -8553 9702 -3400 -1762 -543 -5210 -3227 -4313 -5138 8288 -1085 -284 4109 2472 -8665 -8227 9992 364 -5909 -3754 -9999 -647 1823 2915 -2167 -317 -6708 2087 6752 -9335 -7232 -352 4232 3110 8259 1459 2371 -1447 -4368 -6432 9817 7195 -1471 8294 4138 -2647 -6832 6969 9390 -5265 -7316 6086 -724 8258 -606 -5268 -5016 3806 -4223 -447 5732 480 -6808 -5555 -1285 4151 6901 -2844 7687 464 0 6559 109 7856 7456 1903 5448 602 -6958 -2294 -1557 -5565 -5107 3317 -2399 -2796 -5752 -3611 -4856 -430 5319 8152 -9582 1056 3809 2945 -6691 755 -1257 2973 2082 7172 6955 -1176 4353 473 -1070 4052 8592 -5550 4467 3972 -5420 -3838 -761 -4194 6701 4055 1404 5852 7570 1076 -1925 8696 -7733 5446 -9367 -5430 -8383 -294 -251 -9457 2089 -9430 9875 3861 -6867 7025 -7449 -3517 -5391 4533 7323 5917 3744 -6810 7489 -7673 -4011 -1574 6156 3247 -248 -5012 -2791 6907 6133 6331 -5318 -3136 8537 -6900 1446 3697 -4908 3734 -4686 8504 -2592 -2093 -1536 -7930 3056 3667 5344 6092 1621 6308 -9586 2419 503 9160 2566 -2975 -459 7065 657 8776 166 -4777 -5325 9017 6789 8072 -1034 -2010 3113 2466 -4777 -9056 2910 -6447 5093 4177 -4734 -3763 3054 -3542 6014 8979 7097 -492 6539 4263 4796 -585 -2348 -1058 -3749 9257 592 1855 -5595 3882 -3577 -1449 -7690 5044 7972 -6590 9558 9665 -9804 3968 -2020 4072 -7743 -6901 -9965 -4087 3777 9626 7326 -6765 -3599 2317 -4302 3657 9068 -6585 -5707 -4594 4781 -2896 5783 -7032 3607 685 -260 6836 -991 -1744 589 8471 4973 5502 -5672 -9404 8050 1890 8999 2407 3558 -1814 -6637 6286 -8999 4737 3586 3858 -7607 -5888 1253 -9961 1631 4990 -9439 9260 4133 -8304 9554 2674 4619 4291 4613 1989 7493 -375 6017 -7833 -7159 -9742 7555 -5666 8352 -2876 9341 5715 -1444 -7828 -9624 8557 -7342 -5224 7206 -5121 -4125 3826 9829 5619 3670 -7026 9664 -6770 -4079 -6168 3512 -4218 -2387 9762 -3574 -3888 -3921 -6381 3966 -4777 -7801 7918 -9378 157 5676 -8953 -6077 2183 -7932 3357 -3225 -9373 525 6180 6517 -6158 -9288 -723 3447 -1227 -3502 66 -9972 536 -3856 -7544 5321 108 4126 -6111 -7585 -5273 -9198 -1370 -9053 -2706 -2392 7464 -4311 550 -7781 -446 -825 -8572 -1142 -3056 5218 -4092 4117 5054 -8273 -9962 7590 -9400 -87 -7556 -484 3622 1816 -1044 3850 6675 9963 1694 -5141 -6776 -3907 -7553 3559 -8025 4733 9718 -7012 7250 -6139 -453 -1612 3548 3826 -5444 -9961 5338 -7345 -2684 3254 -1693 3355 -9918 6573 -711 -7455 3266 -8569 2782 5098 -9797 -6979 8118 3743 -7298 3723 6301 201 7260 4311 -5324 -3798 3951 -5274 7751 422 6882 -9537 -4943 -9178 -3355 7085 -6849 2207 2786 958 8765 3842 -1116 49 -9065 -9003 -4305 3459 -1856 -2480 8420 532 2917 4812 6537 -5136 8408 5507 2384 -3556 -2400 8245 6946 -2351 9396 3432 3993 -4063 247 6247 4562 -2319 -5466 1555 3273 7091 2382 2794 -7769 -2221 -7688 4908 -3945 6331 -4404 334 -8928 -117 -8941 7700 1005 305 4818 2825 1318 -7342 -8817 -4973 1703 1118 -3463 1115 6040 -806 -9418 6870 5733 -4685 -2523 7233 1089 -5427 7251 5371 -2072 5888 8666 6789 9132 -7778 1583 -3751 -5663 -8332 -5295 -7981 2761 6597 -8450 9715 -8807 3768 3564 -6899 7153 7078 -2998 3759 -531 -3936 -8426 4072 9359 797 -865 -9855 8144 1531 -2599 8697 4704 -509 7325 8814 -2403 -9783 -8399 4591 -3785 -4678 -7605 -8195 -5570 5409 9673 -3309 -5790 -7712 6754 4998 9010 -775 -3104 3424 -3362 6403 6427 4788 2571 -978 1182 -3229 -2202 303 -1791 -9402 -3641 1627 8633 -4604 -1071 -578 2885 4331 -4959 -1549 1067 -4598 6916 -4528 -7122 7405 8718 -7614 2648 1771 -3097 -6137 -3150 6701 -9740 9468 -3582 -8645 -1554 -8640 8358 -9167 9160 -9914 6133 607 8988 -1926 -5602 6725 2073 3135 -3664 2584 -410 4445 -8174 5075 5620 -1358 5216 -3603 9323 375 5012 -8659 -9492 -1055 -2516 1812 -162 -1645 -3673 -8839 -839 -7165 6040 -594 2140 -5826 8392 2885 -7066 9192 -4516 -5713 -2507 2472 1992 4689 -1924 1433 -2358 -158 2201 7422 -565 -708 -3579 1893 -4826 5387 7338 1859 -3430 254 9148 1288 9300 9330 7549 -2396 -6002 -7427 2847 -4065 7972 3101 -2986 -4290 -8573 4055 -9402 -3837 -1780 -3451 -5404 -6158 -4924 8358 2062 4895 9270 6807 9474 6529 -6835 -3268 -5057 -8354 5563 9296 5581 5444 -3762 -1220 -5784 -3777 7536 -4592 4820 -1361 -8228 4810 -539 -865 7230 -8117 -8793 9705 -3697 -3757 7610 -9441 270 -1308 -2887 -8400 -8692 -2095 -8349 -6906 3301 7759 7402 -1268 -8339 979 -9534 5032 -6840 69 3997 -1484 6331 -321 2004 7693 -433 4447 -6739 1847 -740 -4324 -5826 1214 6479 -5977 -4891 -4232 -8022 -1073 -6379 3864 -2370 -5873 -2047 -4848 -4140 3603 3620 -8726 -6513 7563 80 -2825 4651 9268 -6494 7501 -8446 -858 5569 -2430 -4087 8115 -5320 8578 -3213 -3272 -1622 -1326 4828 7873 -6406 -3319 5145 -1256 -6344 -2754 5518 -6760 -6652 1515 3615 3466 5623 4471 8581 -183 1846 -8077 -3142 7181 3572 -2121 9889 5023 -3997 -6498 -8293 -2977 -9943 -4239 4786 -8744 3331 -9346 -2412 3123 477 9866 464 -9356 -1266 1978 6055 3881 1612 1952 5034 4562 6800 -8992 3039 2425 -3371 -8134 -6260 7574 -6486 2403 3961 1301 7106 -1117 6130 8694 -8272 -4600 4422 987 6604 -5653 1321 3885 -7831 -1673 -2049 -9898 7319 -3372 -8876 9644 -1178 -880 -1313 -654 9055 5922 -3907 -885 -5713 -7441 5807 1031 8934 4623 5250 8547 871 554 9757 -6769 2564 -3084 929 4244 -2792 -7507 -5883 -9847 -1965 -6296 566 -2451 -9807 9796 6198 5369 733 -7142 -7315 -615 2045 -8725 -8755 8562 4801 8296 -8033 -6385 -1904 -6547 7195 -9365 304 223 7765 -343 444 5112 -3700 -7128 -2221 5507 -3671 9004 5264 4476 -7980 -7611 5497 7933 8554 7808 7852 2794 -1877 321 -2996 -2381 -3350 1341 4421 9602 -3686 -8760 1315 8798 -7484 -2345 6173 -6288 8214 2166 -432 -3072 7567 2743 -9525 8106 -3507 -2307 50 -5416 4061 -2985 5438 -6584 -3061 -9786 -4569 -3390 -6256 -3373 3728 4632 -1657 -4141 -6165 2122 -844 1297 8183 1572 9663 -17 -877 5790 -4527 8568 -8868 602 76 2213 -3429 -8113 1157 6820 6960 8792 8627 -7432 -7759 491 -952 100 4596 -8534 -7294 2301 -9164 -8799 -8561 -3889 -88 -8664 2222 2082 6113 4042 -6776 6585 9313 -8381 458 9541 -8838 8261 -2140 -1477 5611 -1023 3106 9432 -8536 5610 -5847 5664 -5099 6053 -2948 -4518 1588 -9220 -126 -5457 9211 376 -2768 1015 7188 -4045 6089 7537 5633 5576 -8631 -3847 -161 6120 -4 2176 145 -8075 4781 9114 9502 -3746 9839 4183 7902 1426 -5757 -2128 9678\n97",
        expected: "20987",
      },
    ],
    hints: [
      "The total of values[i..j] is prefix[j + 1] − prefix[i].",
      "That difference is divisible by k exactly when the two prefixes leave the same remainder modulo k.",
      "Walk once, keeping a count of how many earlier prefixes had each remainder. Each new prefix pairs with all of them.",
      "Negative totals: in Java and C++ the % operator can return a negative remainder. Normalise it into 0..k − 1.",
    ],
    solutions: [
      {
        title: "Every stretch, with a running total",
        order: 1,
        intuition:
          "Fix a start day and extend the end one day at a time, carrying the total. Each stretch is checked in O(1), but there are about n²/2 stretches.",
        approach: [
          "For each start i, set total = 0.",
          "For each end j ≥ i, add values[j] and count the stretch if total % k == 0.",
        ],
        code: {
          PYTHON: `def countDivisibleStretches(values: List[int], k: int) -> int:
    count = 0
    for i in range(len(values)):
        total = 0
        for j in range(i, len(values)):
            total += values[j]
            if total % k == 0:
                count += 1
    return count`,
          JAVA: `class Solution {
    public int countDivisibleStretches(int[] values, int k) {
        int count = 0;
        for (int i = 0; i < values.length; i++) {
            int total = 0;
            for (int j = i; j < values.length; j++) {
                total += values[j];
                if (total % k == 0) count++;
            }
        }
        return count;
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(1)",
        edgeCases: ["k = 1, where every stretch counts."],
        commonMistakes: [
          "Restarting the total from scratch for each end, which makes it cubic.",
        ],
      },
      {
        title: "Optimal: count prefix remainders",
        order: 2,
        intuition:
          "A stretch is divisible exactly when the prefix totals at its two ends share a remainder mod k. So walk the array once, track the running remainder, and add how many earlier prefixes had the same remainder. Seeding the count for remainder 0 with 1 represents the empty prefix, which lets stretches starting at day 0 be counted.",
        approach: [
          "Make an array seen of size k with seen[0] = 1.",
          "Keep a running remainder, normalised into 0..k − 1 after each addition.",
          "Add seen[remainder] to the answer, then increment seen[remainder].",
          "Return the answer.",
        ],
        code: {
          PYTHON: `def countDivisibleStretches(values: List[int], k: int) -> int:
    seen = [0] * k
    seen[0] = 1        # the empty prefix
    remainder = 0
    count = 0
    for value in values:
        remainder = (remainder + value) % k   # Python's % is never negative
        count += seen[remainder]              # pair with every earlier match
        seen[remainder] += 1
    return count`,
          JAVA: `class Solution {
    public int countDivisibleStretches(int[] values, int k) {
        int[] seen = new int[k];
        seen[0] = 1;
        int remainder = 0, count = 0;
        for (int value : values) {
            remainder = ((remainder + value) % k + k) % k; // keep it in 0..k-1
            count += seen[remainder];
            seen[remainder]++;
        }
        return count;
    }
}`,
        },
        timeComplexity: "O(n + k)",
        spaceComplexity: "O(k)",
        edgeCases: [
          "Negative values, which make raw remainders negative in Java.",
          "All zeroes, where every stretch counts.",
          "k = 1.",
        ],
        commonMistakes: [
          "Forgetting seen[0] = 1, which misses every stretch that starts on the first day.",
          "Using a raw % in Java, so −1 and k − 1 land in different buckets.",
        ],
      },
    ],
    expectedTime: "O(n + k)",
    expectedSpace: "O(k)",
  },

  {
    slug: "plots-with-target-yield",
    title: "Plots With a Target Yield",
    difficulty: "HARD",
    learningObjective:
      "Reduce a 2-D range-count problem to many 1-D ones by fixing a band of rows and running a prefix-sum hash count over its column totals.",
    topics: ["arrays", "hashing"],
    patterns: ["prefix-sum", "hashing"],
    statement: [
      para(
        "An agronomist divides a field into a grid of cells and records each cell's yield change versus last season, which may be negative. She wants to know how many rectangular plots — any axis-aligned block of whole cells — changed by exactly a target amount."
      ),
      rich(
        "Given ",
        { code: "grid" },
        " and ",
        { code: "target" },
        ", return the number of non-empty rectangular sub-grids whose cells sum to exactly ",
        { code: "target" },
        ". Plots at different positions count separately even if they overlap."
      ),
      example(
        "grid = [[1, 2], [3, 1]], target = 3",
        "3",
        [
          {
            state: "rows 0..0: column totals [1, 2]",
            note: "[1, 2] sums to 3 — one plot",
          },
          { state: "rows 1..1: column totals [3, 1]", note: "[3] alone — one plot" },
          {
            state: "rows 0..1: column totals [4, 3]",
            note: "the right column alone — one plot",
          },
        ],
        "Fixing a band of rows, then counting in one dimension"
      ),
    ],
    constraints: [
      "1 ≤ rows, columns ≤ 60",
      "-1000 ≤ grid[i][j] ≤ 1000",
      "-100000000 ≤ target ≤ 100000000",
    ],
    signature: {
      params: ["int[][]", "int"],
      paramNames: ["grid", "target"],
      returns: "int",
      functionName: "countTargetPlots",
    },
    tests: [
      {
        input: "2\n1 2\n3 1\n3",
        expected: "3",
        isSample: true,
        explanation:
          "[1, 2] across the top row, [3] alone, and [2, 1] down the right column.",
      },
      {
        input: "2\n1 -1\n-1 1\n0",
        expected: "5",
        isSample: true,
        explanation:
          "Both full rows, both full columns, and the whole grid each sum to 0: five plots.",
      },
      { input: "1\n5\n5", expected: "1" },
      { input: "1\n5\n0", expected: "0" },
      { input: "2\n0 0\n0 0\n0", expected: "9" },
      { input: "3\n1 -1 1\n-1 1 -1\n1 -1 1\n0", expected: "20" },
      { input: "1\n2 2 2 2\n4", expected: "3" },
      {
        input:
          "6\n3 -2 0 2 0 0 -1\n3 -2 -1 3 -1 -2 -2\n3 1 1 1 0 3 2\n2 1 3 -2 0 -2 0\n3 1 -2 3 1 -1 0\n-3 0 -3 -3 2 1 0\n2",
        expected: "62",
      },
      {
        input:
          "40\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0",
        expected: "672400",
      },
      {
        input:
          "40\n3 -2 -5 3 -2 5 2 4 -2 -2 0 2 -1 -1 -1 1 5 5 5 -4 -5 -1 -2 -4 -4 1 -3 -4 -3 2 -4 -1 -1 0 -3 0 1 -2 2 4\n2 2 -2 -3 4 2 -3 -5 0 -5 -2 0 1 -2 -1 5 1 1 -4 0 2 -5 2 -2 -3 3 -4 0 4 5 -5 3 -5 0 -2 -3 1 -4 1 -4\n-2 3 2 1 -4 -4 4 -3 -2 5 4 -4 -4 -4 -3 3 -2 4 1 3 5 -1 3 4 1 -4 -1 -3 -3 -4 1 5 0 5 -3 -4 -3 -2 -3 4\n3 -2 -5 -4 -1 0 5 -5 -4 3 -5 -3 0 5 -5 4 -2 -2 5 -5 -5 -3 1 -3 5 -5 -2 -5 5 1 -5 -5 -2 4 -3 2 1 -3 2 1\n4 2 -2 -2 1 -2 -3 -1 3 4 2 3 -2 -5 -3 3 -5 -4 -1 -1 -2 -2 -4 4 -1 -5 2 -1 -2 -1 1 2 -3 -5 4 2 -1 3 3 4\n4 -1 1 1 5 4 -5 0 -2 2 2 -3 5 -4 1 -3 3 2 1 3 -4 -3 1 -2 -4 2 1 3 2 2 -5 -2 3 -5 1 -2 0 3 -1 3\n-4 -3 0 4 -3 0 1 4 5 0 0 5 -4 -2 1 4 -2 -1 1 4 0 -5 -2 -4 0 -3 2 3 -2 -2 -3 3 -1 -2 0 -1 1 -2 3 -4\n-1 -4 0 4 5 -2 -3 1 5 3 4 -1 -3 -5 -5 -1 -5 -4 -1 0 2 0 0 -4 3 0 -2 -4 2 -2 1 -2 3 -1 3 -3 -1 1 -1 -1\n1 -1 2 4 4 4 1 -4 4 0 3 4 -2 0 -4 -5 0 3 -1 4 -1 2 3 4 0 0 -2 3 -4 0 -4 0 -5 1 4 5 5 4 5 0\n-1 -3 -5 -2 -2 -2 5 -4 -1 -5 3 3 -5 2 3 1 -4 0 -3 -3 1 5 -1 5 -5 5 -2 0 2 -2 -3 -4 1 4 1 -1 3 -3 0 2\n-4 0 -5 3 5 0 -1 -3 -4 -5 5 -1 2 2 4 -1 2 -5 -2 -1 -1 -5 0 -1 5 -1 4 -5 -1 3 4 -4 -1 4 0 -5 1 5 4 0\n3 4 -2 -5 -2 5 2 -1 -3 -2 -4 -4 5 -4 3 4 4 -5 5 4 -1 0 3 -2 -5 -5 0 1 0 -5 0 -2 3 -5 2 2 1 3 -5 -1\n-1 4 -1 -1 -1 2 -1 1 -5 1 -4 -5 2 -3 -1 -5 -3 0 0 -3 -3 -3 -2 2 -2 -1 3 -5 4 0 3 3 4 -3 -2 0 2 -4 -4 -2\n2 -2 4 -5 -3 -5 0 -4 -5 -3 1 -3 3 -5 4 3 0 0 5 1 5 2 2 4 -4 -1 -5 3 4 -3 -3 0 3 -4 -5 4 -3 1 2 1\n3 0 -3 -3 -4 4 1 -4 0 0 -3 -1 -1 1 -5 0 2 -5 1 0 -2 2 0 -2 -2 -4 1 -5 -2 3 2 -1 -3 -4 -3 4 0 5 -1 -1\n0 5 -1 1 -1 5 2 5 -5 -5 2 3 4 2 -4 0 3 1 4 3 1 1 -1 1 -2 5 -2 4 1 4 -3 -2 4 -1 -4 -1 -2 2 4 -3\n-3 -3 4 1 1 3 -2 3 4 -3 -4 5 -3 2 5 2 -1 -5 -4 -4 4 -1 -3 2 1 -4 -4 -5 5 -1 -1 3 -2 1 4 -3 4 1 -2 -5\n3 -3 -3 -3 -1 -1 -4 -2 0 -3 3 1 -3 0 -5 0 -5 2 5 -3 3 -3 -5 -1 -3 2 -1 -3 -3 -3 -2 1 -4 -5 5 0 2 -5 3 -1\n4 4 2 0 -5 0 -1 0 1 1 -3 -4 -1 1 -3 5 2 3 5 4 0 3 -3 -1 -3 3 -2 1 3 -2 5 -4 -1 5 -5 5 2 4 4 2\n-2 3 3 -2 -2 -2 0 4 0 -4 -2 1 -5 3 -3 4 -1 -3 -5 -3 3 -5 -4 -4 1 4 5 3 -3 1 5 -1 -3 -3 -2 -5 -2 -3 -2 -3\n1 1 3 4 1 -4 -3 0 -4 5 1 -1 1 4 4 1 -4 4 -2 4 -3 -1 -4 -4 -1 -2 -4 4 -3 -2 -4 -4 1 2 4 3 -3 -3 -3 -3\n-3 0 4 -1 1 -3 4 0 -2 2 3 3 0 -5 -5 4 2 3 1 2 -3 0 5 -3 -2 2 -1 -2 -3 -4 -4 4 4 -3 1 -4 1 0 4 -1\n0 -2 3 -5 0 4 -5 -4 1 3 5 3 0 -5 0 2 -4 -2 2 4 -1 5 4 3 -3 -3 -5 -1 0 -2 -5 5 -5 -4 3 -1 -3 0 4 -2\n4 1 -1 1 2 1 -4 3 2 4 -1 -2 -1 -5 4 3 -5 5 2 0 -5 -4 -4 -4 2 3 0 -5 4 3 0 -2 4 0 -3 3 3 -3 1 2\n4 -2 -3 3 1 -2 -3 5 0 2 -4 -4 4 -4 3 0 4 -4 -5 -2 4 -1 -2 -5 5 -2 5 2 -4 0 5 1 -5 5 2 -1 -3 5 1 -5\n-1 2 -2 -1 -4 -3 -1 3 -4 -5 5 4 -3 -1 0 2 0 4 -3 3 -1 -3 -1 -4 1 2 5 4 -4 3 -1 4 0 0 -1 -1 -2 -2 4 -4\n-5 -5 -2 1 3 -5 3 -3 5 -5 -2 -5 5 3 -1 -3 -2 -5 -5 0 1 1 -3 -5 3 1 -1 -5 0 -2 1 4 4 4 4 2 -2 0 5 3\n-5 2 -4 3 0 -1 4 4 5 -3 5 -2 -5 2 0 4 -2 -4 -3 0 4 -5 -4 3 3 2 -4 0 3 0 2 3 5 -4 1 -1 3 -2 2 -5\n-3 0 -1 2 -5 -4 -5 -5 1 0 0 2 3 4 -4 -4 3 -2 3 -5 5 3 -3 2 0 0 2 -3 0 -4 2 -4 3 -2 -2 2 1 -2 -2 0\n5 -3 -1 2 -3 0 0 -3 0 1 5 0 4 -1 4 3 1 -2 2 -5 4 5 -3 -2 0 2 1 4 0 1 3 2 1 2 4 5 -3 0 1 4\n-5 3 5 1 4 -1 0 5 -3 -1 -4 -5 4 -3 -1 -2 3 2 -4 -4 -3 0 -5 2 5 2 2 1 -1 -2 -3 -2 -5 -1 5 -1 -4 -2 1 -1\n-5 -3 5 5 0 -4 2 -5 -4 -5 -3 -3 5 5 0 5 -4 1 5 -1 -1 1 2 -2 1 -1 2 2 0 -2 4 4 -5 3 -4 1 2 -2 0 -5\n5 5 1 4 3 5 3 -5 -3 1 5 -5 1 4 0 -5 0 5 0 5 2 4 3 -5 -5 3 0 -1 -2 -4 -2 -5 3 -4 -4 4 -2 -4 4 5\n0 2 -4 1 2 5 4 1 5 -3 -1 3 5 -4 5 -3 -3 -2 5 4 -4 3 1 5 -2 5 5 0 5 5 -1 3 0 4 5 -4 -4 -2 -5 0\n4 4 -1 0 -4 3 0 0 4 -3 4 2 0 3 3 -4 -5 5 0 1 1 -2 1 -2 2 -4 3 5 1 -4 -1 2 -3 3 3 3 -1 0 -5 -4\n-1 -2 -3 4 3 -3 2 0 0 -5 2 5 0 0 2 2 4 4 0 5 2 -1 5 -5 0 3 4 -5 -3 -4 3 -5 3 3 -1 -5 5 5 4 3\n-3 -4 -5 1 5 -4 -4 -4 -2 0 4 2 2 4 5 4 0 5 0 2 -2 -5 -3 1 2 -2 1 3 -5 2 3 -1 5 3 2 -5 -4 5 0 -4\n-2 -2 -5 5 -4 -3 -1 -5 4 1 -2 -3 -3 -1 0 4 -5 4 -1 -1 -3 -3 -1 5 -2 1 3 -3 -3 2 -1 -1 5 1 1 -4 -2 3 -4 2\n2 -2 -4 3 -5 -2 -3 1 -5 4 4 0 0 5 3 3 -1 -4 5 4 1 2 2 2 1 2 0 0 -1 -5 2 -4 3 5 3 1 -2 -3 2 -5\n-3 2 -5 -2 4 4 -3 0 4 -1 -2 0 -2 -5 -4 0 -2 3 -5 -1 4 -1 -1 5 0 1 1 -5 -1 1 0 5 4 5 -1 1 4 -2 -1 -2\n7",
        expected: "7166",
      },
      {
        input:
          "10\n-4 0 -2 4 0 1 0 -2 4 0 -4 -4\n3 0 -3 3 1 5 1 -3 -3 4 5 -3\n2 -5 4 3 5 0 -1 2 -5 3 -5 -3\n-2 -1 -5 -5 1 4 2 3 2 -2 -4 5\n3 -4 -1 1 1 -3 5 1 4 5 -4 2\n0 -1 -2 0 -3 -3 4 -3 3 -3 0 -4\n5 -2 5 1 -3 5 -5 1 -4 -2 -3 0\n-1 0 2 -5 -1 -2 0 -5 3 -2 5 2\n4 -2 3 0 1 -5 -3 4 -5 2 -2 -4\n-1 -3 1 5 -2 1 -1 -3 0 -4 3 2\n-3",
        expected: "201",
      },
    ],
    hints: [
      "In one dimension, counting stretches that sum to a target is a running total plus a hash map of earlier totals.",
      "A rectangle is a band of rows (top to bottom) and a range of columns. Fix the band first.",
      "For a fixed band, collapse each column into the sum of its cells inside the band. Now the band is a 1-D array.",
      "Extend the bottom row one step at a time, adding that row into the column totals, and run the 1-D count each time: O(rows² · cols) overall.",
    ],
    solutions: [
      {
        title: "Every rectangle via a 2-D prefix table",
        order: 1,
        intuition:
          "A 2-D prefix table P, where P[i][j] is the sum of the block above and left of (i, j), gives any rectangle's sum by inclusion–exclusion in O(1). Enumerating all rectangles is still O(rows² · cols²).",
        approach: [
          "Build P with an extra zero row and column.",
          "For every top ≤ bottom and left ≤ right, compute the sum as P[b+1][r+1] − P[t][r+1] − P[b+1][l] + P[t][l].",
          "Count the sums equal to target.",
        ],
        code: {
          PYTHON: `def countTargetPlots(grid: List[List[int]], target: int) -> int:
    rows, cols = len(grid), len(grid[0])
    P = [[0] * (cols + 1) for _ in range(rows + 1)]
    for i in range(rows):
        for j in range(cols):
            P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j]

    count = 0
    for t in range(rows):
        for b in range(t, rows):
            for l in range(cols):
                for r in range(l, cols):
                    if P[b + 1][r + 1] - P[t][r + 1] - P[b + 1][l] + P[t][l] == target:
                        count += 1
    return count`,
          JAVA: `class Solution {
    public int countTargetPlots(int[][] grid, int target) {
        int rows = grid.length, cols = grid[0].length;
        int[][] P = new int[rows + 1][cols + 1];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                P[i + 1][j + 1] = grid[i][j] + P[i][j + 1] + P[i + 1][j] - P[i][j];
            }
        }

        int count = 0;
        for (int t = 0; t < rows; t++) {
            for (int b = t; b < rows; b++) {
                for (int l = 0; l < cols; l++) {
                    for (int r = l; r < cols; r++) {
                        if (P[b + 1][r + 1] - P[t][r + 1] - P[b + 1][l] + P[t][l] == target) count++;
                    }
                }
            }
        }
        return count;
    }
}`,
        },
        timeComplexity: "O(rows² · cols²)",
        spaceComplexity: "O(rows · cols)",
        edgeCases: ["A 1 × 1 grid."],
        commonMistakes: [
          "Getting the signs in inclusion–exclusion wrong, which double-counts the corner.",
        ],
      },
      {
        title: "Optimal: row bands with a 1-D prefix-sum count",
        order: 2,
        intuition:
          "Choose the top row of the band, then grow the bottom row downward, adding each new row into a running array of column totals. For that band, the rectangles are exactly the column ranges of this 1-D array, and counting ranges that sum to target is the classic running-total-plus-hash-map trick. That replaces two nested column loops with one.",
        approach: [
          "For each top row: reset column totals to zero.",
          "For each bottom row from top down: add the row into the column totals.",
          "Walk the column totals with a running sum, a map of earlier running sums (seeded with 0 → 1), and add the count of earlier sums equal to running − target.",
          "Sum the counts over all bands.",
        ],
        code: {
          PYTHON: `def countTargetPlots(grid: List[List[int]], target: int) -> int:
    rows, cols = len(grid), len(grid[0])
    count = 0
    for top in range(rows):
        column = [0] * cols          # column totals for rows top..bottom
        for bottom in range(top, rows):
            for c in range(cols):
                column[c] += grid[bottom][c]

            # 1-D: how many column ranges of this band sum to target?
            earlier = {0: 1}
            running = 0
            for c in range(cols):
                running += column[c]
                count += earlier.get(running - target, 0)
                earlier[running] = earlier.get(running, 0) + 1
    return count`,
          JAVA: `class Solution {
    public int countTargetPlots(int[][] grid, int target) {
        int rows = grid.length, cols = grid[0].length;
        int count = 0;
        for (int top = 0; top < rows; top++) {
            int[] column = new int[cols];
            for (int bottom = top; bottom < rows; bottom++) {
                for (int c = 0; c < cols; c++) column[c] += grid[bottom][c];

                Map<Integer, Integer> earlier = new HashMap<>();
                earlier.put(0, 1);
                int running = 0;
                for (int c = 0; c < cols; c++) {
                    running += column[c];
                    count += earlier.getOrDefault(running - target, 0);
                    earlier.merge(running, 1, Integer::sum);
                }
            }
        }
        return count;
    }
}`,
        },
        timeComplexity: "O(rows² · cols)",
        spaceComplexity: "O(cols)",
        edgeCases: [
          "A grid of zeroes with target 0, where every rectangle counts.",
          "Negative cells, which rule out any sliding-window shortcut.",
          "A single row or a single column.",
        ],
        commonMistakes: [
          "Forgetting to seed the map with 0 → 1, which misses ranges starting at column 0.",
          "Resetting the column totals for every bottom row instead of every top row, which turns the band into a single row.",
          "Adding the current running sum to the map before looking up running − target, which counts empty ranges when target is 0.",
        ],
      },
    ],
    expectedTime: "O(rows² · cols)",
    expectedSpace: "O(cols)",
  },
];
