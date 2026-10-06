import { example, para, rich, type ProblemSeed } from "./types";

/** Matrices, grids and graphs: flood fills, breadth-first layers, union-find and shortest paths. */
export const GRID_GRAPH_PROBLEMS: ProblemSeed[] = [
  {
    slug: "paint-bucket-region",
    title: "Paint Bucket Region",
    difficulty: "EASY",
    learningObjective:
      "Flood-fill a grid from one cell, marking cells as visited the moment they are discovered so none is counted twice.",
    topics: ["matrices", "graphs"],
    patterns: ["breadth-first-search", "depth-first-search"],
    statement: [
      para(
        "A pixel-art editor stores an image as a grid of colour codes. Its paint bucket tool recolours the region under the cursor: the clicked pixel plus every pixel of the same colour that can be reached from it by stepping up, down, left or right through pixels of that colour."
      ),
      rich(
        "Before repainting, the editor wants to show how many pixels will change. Given the grid ",
        { code: "canvas" },
        " and the clicked position ",
        { code: "(row, col)" },
        ", return the number of pixels in that region. Diagonal neighbours do not count."
      ),
      example(
        "canvas = [[1,1,0,2],[0,1,1,2],[2,0,1,0],[2,2,1,1]], row = 0, col = 0",
        "7",
        [
          { state: "(0,0)", note: "colour 1 — start the region" },
          { state: "(0,1)", note: "right of the start, also colour 1" },
          { state: "(1,1) (1,2)", note: "down from (0,1), then right" },
          { state: "(2,2) (3,2)", note: "straight down the middle column" },
          { state: "(3,3)", note: "right of (3,2); seven pixels in all" },
        ],
        "Growing the region from the top-left pixel"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "0 ≤ canvas[i][j] ≤ 9",
      "0 ≤ row < rows and 0 ≤ col < cols",
      "Your function may modify canvas.",
    ],
    signature: {
      params: ["int[][]", "int", "int"],
      paramNames: ["canvas", "row", "col"],
      returns: "int",
      functionName: "regionSize",
    },
    tests: [
      {
        input: "4\n1 1 0 2\n0 1 1 2\n2 0 1 0\n2 2 1 1\n0\n0",
        expected: "7",
        isSample: true,
      },
      { input: "3\n3 3 3\n3 4 3\n3 3 3\n1\n1", expected: "1", isSample: true },
      { input: "2\n5 5\n5 5\n1\n0", expected: "4", isSample: true },
      { input: "1\n7\n0\n0", expected: "1" },
      { input: "3\n1 0 1\n0 1 0\n1 0 1\n1\n1", expected: "1" },
      {
        input: "5\n0 0 0 0 0\n0 1 1 1 0\n0 1 0 1 0\n0 1 1 1 0\n0 0 0 0 0\n2\n2",
        expected: "1",
      },
      {
        input: "5\n0 0 0 0 0\n0 1 1 1 0\n0 1 0 1 0\n0 1 1 1 0\n0 0 0 0 0\n4\n4",
        expected: "16",
      },
      { input: "1\n2 2 2 2 9 2\n0\n0", expected: "4" },
      {
        input:
          "50\n0 0 0 0 0 1 0 0 0 0 1 1 1 1 0 1 1 1 0 1 1 0 0 1 1 0 1 1 1 1 0 1 0 0 0 1 1 1 0 0 0 0 0 1 0 0 1 1 0\n1 1 1 1 0 1 0 1 1 1 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 0 1 0 1 1 0 1 0 1 0 1 0 1 0 1 0 0 0 1 0 1 1\n1 1 0 0 1 0 0 1 0 0 0 1 1 0 0 0 0 0 1 0 1 1 1 0 1 0 0 0 1 0 0 0 1 0 0 0 1 0 0 1 1 1 0 0 0 0 0 0 0\n1 0 0 0 0 0 1 0 1 0 0 1 1 1 1 0 1 0 1 0 0 0 0 0 1 1 0 1 1 1 1 1 0 1 0 1 0 1 1 1 1 1 0 0 0 0 1 1 0\n1 1 1 0 1 0 0 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 1 0 0 1 0 1 0 0 1 1 0 1 0 0 0 0 0 1 0 1 1\n1 0 0 1 0 1 1 1 0 1 0 0 0 0 0 0 1 0 1 0 1 0 1 0 0 0 1 1 1 0 0 1 0 0 1 1 1 1 0 0 0 1 0 1 1 0 0 1 1\n0 0 1 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 1 1 1 0 1 0 0 1 0 1 0 1 1 1 1 1 0 0 0 0 1 1 0 1 1 0 0 1 1\n0 1 1 0 1 0 0 0 0 1 0 1 1 0 0 0 1 1 1 1 0 0 0 0 0 1 0 1 1 1 1 1 0 0 0 0 1 0 0 0 0 1 1 0 1 1 1 0 0\n0 0 0 0 0 0 1 0 1 0 0 0 0 1 1 0 0 1 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 0 1 0 0 0 1 1 0 0 0 0 1 1 1 0 0\n1 0 0 1 1 1 0 0 1 0 1 1 1 0 1 1 1 0 0 0 1 0 0 1 1 1 1 0 1 0 1 0 1 1 0 0 0 0 0 0 0 1 0 0 1 0 1 0 1\n0 1 0 0 0 1 0 0 0 1 0 1 0 0 1 1 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 0 1 1 1 1 0 0 0 0 0\n1 0 1 0 0 1 0 0 0 1 1 0 1 0 0 0 0 0 0 1 1 0 1 1 0 0 0 1 1 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0\n0 1 1 1 0 0 0 0 1 1 1 1 1 0 1 0 0 1 0 1 1 1 1 1 1 0 0 0 0 1 1 0 0 1 1 1 0 1 1 0 1 1 1 0 1 0 0 1 0\n0 0 0 0 1 0 0 0 0 0 1 0 1 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 1\n1 0 1 0 0 1 1 0 1 1 0 1 0 1 0 1 1 0 1 0 0 0 1 0 0 1 0 0 1 1 0 1 0 1 0 1 1 0 1 1 1 0 0 0 0 0 1 1 0\n1 1 0 0 0 0 0 0 0 0 0 1 1 1 1 1 1 1 0 0 0 1 1 1 1 0 1 0 1 0 0 1 0 0 1 0 0 0 1 0 1 0 0 1 0 0 1 0 1\n0 0 1 1 0 0 1 1 1 1 1 0 0 0 1 0 0 1 0 0 1 0 1 0 1 0 0 1 0 1 0 0 1 1 0 1 0 1 0 0 1 0 1 1 1 1 0 0 0\n0 0 1 0 1 1 0 1 0 0 0 1 0 0 0 1 0 1 1 0 1 0 0 0 1 0 0 0 1 0 1 0 0 0 1 1 1 0 1 1 0 0 0 1 1 0 1 1 1\n0 1 0 1 1 1 1 0 1 0 0 1 1 1 1 0 0 1 1 1 0 0 0 0 0 0 1 1 1 0 1 0 1 0 1 1 0 0 0 0 1 0 1 1 0 0 1 0 1\n0 0 1 0 1 1 1 0 0 0 1 0 0 1 0 1 1 0 1 1 0 1 1 1 0 0 0 0 1 0 0 1 0 0 0 1 1 1 1 1 0 0 0 0 0 1 0 1 0\n1 0 1 1 0 1 0 1 1 0 1 0 0 1 0 0 0 0 0 0 0 1 0 1 0 0 0 0 1 1 0 0 0 1 0 1 1 1 0 1 0 0 0 1 1 1 0 1 0\n0 0 0 0 0 1 0 1 1 1 1 0 0 0 0 0 0 0 0 1 0 1 1 1 1 1 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 1 0 1 1 0 1 1 1\n0 0 0 1 0 1 1 0 0 0 1 0 0 0 0 1 1 0 0 1 1 0 0 0 1 0 0 0 0 0 0 1 1 1 1 1 0 1 0 1 1 1 1 0 1 1 0 0 1\n0 0 1 0 1 0 0 1 0 0 1 0 0 0 1 0 0 1 1 1 0 1 0 0 0 0 0 1 0 1 1 0 1 0 0 1 1 1 0 0 1 1 1 1 1 0 0 0 0\n1 0 1 0 1 1 0 1 0 1 0 1 0 1 0 0 0 0 0 0 1 0 1 0 0 0 0 1 1 0 1 0 0 1 1 0 1 1 0 0 1 0 0 0 1 1 0 1 0\n1 0 0 1 0 0 0 0 0 1 1 1 0 0 0 1 1 0 0 1 0 1 0 1 0 1 0 0 0 0 0 0 1 1 1 0 0 0 1 0 0 1 0 1 1 1 1 1 1\n0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 1 0 0 1 1 1 1 1 0 0 0 0 0 1 0 0 1 0 1 1 0 0 0 1 0 0 0 1 0 0 1 1 1 0\n0 1 1 0 1 0 1 0 0 1 0 1 0 0 1 1 0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 0 0 0 1 1 0 1 1 0 0 0 0 1 1 1 0 1 1\n1 1 0 0 0 1 0 0 0 1 1 0 0 0 0 1 1 0 1 1 1 1 0 0 1 1 0 0 1 0 0 0 0 0 0 0 1 1 0 1 0 0 1 1 1 0 0 1 0\n1 1 0 1 1 1 1 0 1 1 0 1 1 0 1 0 1 1 1 0 0 0 0 1 0 1 0 0 0 0 1 1 0 1 1 1 1 0 1 0 0 0 0 1 1 0 1 0 1\n0 1 0 0 1 0 1 0 0 0 1 0 0 1 1 0 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 1 0 1 0 1 0 1 0 1 0 1 0\n1 0 1 0 1 1 0 1 0 0 0 1 0 0 1 1 0 0 1 1 1 0 0 0 0 1 0 0 0 1 1 0 1 0 0 0 0 1 1 0 0 0 1 1 0 1 0 0 0\n0 0 0 1 0 1 0 0 1 1 1 0 1 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 1 0 0 0 1 0 0 1 0 0 1 1 1 0 1 1 1 0 0 0 0\n0 0 1 0 1 0 0 0 1 1 1 1 1 1 1 0 1 0 0 0 0 1 1 1 1 1 1 0 1 1 0 0 0 1 1 1 1 1 0 0 1 1 0 0 0 1 0 0 0\n0 0 1 1 0 0 0 1 1 0 0 1 0 1 1 0 0 0 1 0 1 0 0 1 0 0 1 0 1 0 1 1 1 1 0 1 0 1 0 0 0 1 0 0 1 0 1 0 1\n1 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 0 0 1 0 1 1 0 0 0 0 1 0 1 1 0 0 0 1 1 0 0 1 0 0 0 1 0 0 1 1 0 1 0\n0 1 0 0 0 0 0 1 0 1 1 0 0 0 0 1 0 1 0 1 1 1 1 1 0 1 0 0 0 0 1 1 0 1 0 1 0 0 0 0 0 1 0 1 1 0 1 0 0\n0 0 1 0 0 0 0 0 1 0 1 0 0 1 0 0 0 1 0 0 1 1 0 0 1 0 0 0 1 0 0 1 1 0 0 0 1 0 1 0 1 0 0 0 1 0 0 1 0\n0 0 0 1 1 1 0 0 0 0 0 1 0 0 1 0 1 0 0 1 0 0 1 1 0 0 0 0 0 0 1 1 1 0 1 1 1 1 0 0 0 1 0 0 1 1 1 1 1\n0 0 1 0 0 0 0 0 0 1 1 0 0 0 0 0 1 0 0 1 1 1 1 1 0 1 0 0 1 1 1 0 1 0 1 1 1 0 1 0 1 0 1 0 1 0 1 0 0\n1 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 1 1 1 0 1 0 0 0 0 0 0 0 1 0 1 0 0 1 0 1 0 1 0 1 0 1 0 0 0 0\n0 0 1 0 0 0 0 0 1 0 0 0 0 1 1 1 0 0 1 0 1 0 1 0 1 0 0 0 0 1 1 0 1 1 0 1 0 0 0 0 0 1 0 1 1 1 1 0 1\n0 1 0 0 0 1 1 1 0 1 0 0 0 1 0 0 0 0 1 1 0 1 0 1 0 0 0 0 1 1 1 1 1 0 1 0 1 1 0 1 1 0 0 0 0 1 0 0 1\n1 0 0 0 0 1 1 1 0 0 1 1 0 0 1 1 0 0 1 0 0 0 1 0 0 0 0 1 1 0 1 1 0 1 0 0 1 1 1 0 0 0 1 0 1 1 0 0 1\n1 0 1 1 1 0 0 1 0 0 0 0 0 1 0 0 0 0 1 1 1 1 1 1 0 0 1 1 1 1 1 0 0 1 1 1 1 0 0 0 1 1 0 1 0 0 0 0 0\n1 0 1 1 0 0 0 0 1 0 0 1 0 0 1 0 0 0 1 0 0 0 1 1 1 0 0 0 0 0 0 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0 0 0\n0 0 0 0 0 1 1 0 0 0 1 1 0 1 0 1 1 1 1 1 0 0 0 1 0 1 0 0 0 0 0 1 1 1 0 0 0 1 0 0 0 1 0 0 1 1 0 1 0\n1 0 1 0 0 0 0 1 1 0 0 1 0 0 1 0 1 1 0 0 0 0 1 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 1 0 0 1 1 0 1 0 0 1 0\n1 1 1 1 0 1 1 0 0 0 0 0 1 1 1 1 0 0 0 1 1 1 0 0 0 1 0 1 0 1 0 0 0 0 0 0 1 0 0 1 1 0 0 0 1 0 1 0 1\n1 0 1 1 0 0 1 0 0 0 0 0 1 0 0 0 1 1 0 1 0 0 1 1 0 0 1 0 0 0 0 0 0 1 0 0 1 0 0 0 1 1 0 0 0 0 0 0 0\n25\n25",
        expected: "1",
      },
    ],
    hints: [
      "Treat each pixel as a node, joined to its four neighbours when they share a colour. The region is the connected piece containing the start.",
      "Keep a to-visit collection. Pop a pixel, count it, and push each same-coloured neighbour you have not seen yet.",
      "Mark a pixel as seen when you push it, not when you pop it, or the same pixel can be pushed several times.",
      "Overwriting a visited pixel with a value no real colour uses (such as -1) doubles as the seen-set and costs no extra memory.",
    ],
    solutions: [
      {
        title: "Recursive depth-first search with a seen set",
        order: 1,
        intuition:
          "The definition of a region is recursive: a pixel belongs if it matches and touches a pixel that belongs. A recursive function that visits a pixel and then its four neighbours mirrors that directly, and a set of visited positions stops it from looping between two neighbours forever.",
        approach: [
          "Remember the colour of the clicked pixel.",
          "Visit (r, c): if it is off the grid, already seen, or a different colour, contribute 0.",
          "Otherwise add it to the seen set and return 1 plus the visits of its four neighbours.",
        ],
        code: {
          PYTHON: `def regionSize(canvas: List[List[int]], row: int, col: int) -> int:
    rows, cols = len(canvas), len(canvas[0])
    colour = canvas[row][col]
    seen = set()

    def visit(r: int, c: int) -> int:
        if r < 0 or r >= rows or c < 0 or c >= cols:
            return 0
        if (r, c) in seen or canvas[r][c] != colour:
            return 0
        seen.add((r, c))
        return 1 + visit(r + 1, c) + visit(r - 1, c) + visit(r, c + 1) + visit(r, c - 1)

    return visit(row, col)`,
          JAVA: `class Solution {
    private int[][] canvas;
    private boolean[][] seen;
    private int colour;

    public int regionSize(int[][] canvas, int row, int col) {
        this.canvas = canvas;
        this.seen = new boolean[canvas.length][canvas[0].length];
        this.colour = canvas[row][col];
        return visit(row, col);
    }

    private int visit(int r, int c) {
        if (r < 0 || r >= canvas.length || c < 0 || c >= canvas[0].length) return 0;
        if (seen[r][c] || canvas[r][c] != colour) return 0;
        seen[r][c] = true;
        return 1 + visit(r + 1, c) + visit(r - 1, c) + visit(r, c + 1) + visit(r, c - 1);
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols) for the set and the recursion stack",
        edgeCases: [
          "A 1×1 canvas.",
          "A start pixel whose neighbours are all different colours.",
        ],
        commonMistakes: [
          "Forgetting the seen check, so two matching neighbours call each other forever.",
          "A single-colour 50×50 canvas recurses 2,500 deep, which can overflow Python's default stack.",
        ],
      },
      {
        title: "Optimal: breadth-first search, marking in place",
        order: 2,
        intuition:
          "An explicit queue removes the recursion-depth risk. Overwriting each discovered pixel with -1 marks it as visited without a separate set, and because -1 is never a real colour, a marked pixel can never match again.",
        approach: [
          "Record the start colour, mark the start with -1 and put it in a queue.",
          "Pop a pixel and count it.",
          "For each in-bounds neighbour that still holds the start colour, mark it -1 and enqueue it.",
          "When the queue empties, the count is the region size.",
        ],
        code: {
          PYTHON: `from collections import deque


def regionSize(canvas: List[List[int]], row: int, col: int) -> int:
    rows, cols = len(canvas), len(canvas[0])
    colour = canvas[row][col]

    # -1 is never a real colour, so it doubles as "already counted".
    canvas[row][col] = -1
    queue = deque([(row, col)])
    size = 0

    while queue:
        r, c = queue.popleft()
        size += 1
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and canvas[nr][nc] == colour:
                canvas[nr][nc] = -1  # mark on discovery, not on pop
                queue.append((nr, nc))

    return size`,
          JAVA: `class Solution {
    public int regionSize(int[][] canvas, int row, int col) {
        int rows = canvas.length, cols = canvas[0].length;
        int colour = canvas[row][col];
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        canvas[row][col] = -1;
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{row, col});
        int size = 0;

        while (!queue.isEmpty()) {
            int[] cell = queue.poll();
            size++;
            for (int[] s : steps) {
                int nr = cell[0] + s[0], nc = cell[1] + s[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && canvas[nr][nc] == colour) {
                    canvas[nr][nc] = -1;
                    queue.add(new int[]{nr, nc});
                }
            }
        }
        return size;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols) for the queue in the worst case",
        edgeCases: [
          "The whole canvas is one colour, so every pixel is counted.",
          "A pixel enclosed by a ring of another colour: the ring blocks the fill.",
        ],
        commonMistakes: [
          "Marking pixels when they are popped rather than pushed, which enqueues shared neighbours more than once and overcounts.",
          "Reading the start colour after overwriting it with -1.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(rows × cols)",
  },

  {
    slug: "spiral-readout",
    title: "Spiral Readout",
    difficulty: "EASY",
    learningObjective:
      "Walk a matrix layer by layer by maintaining four shrinking boundaries instead of tracking visited cells.",
    topics: ["matrices"],
    patterns: ["two-pointers"],
    statement: [
      para(
        "A scrolling LED panel shows numbers in a rectangular grid. In its screensaver mode a cursor starts in the top-left corner and reads every value once, travelling clockwise around the outside edge and then spiralling inward ring by ring."
      ),
      rich(
        "Given the panel as ",
        { code: "panel" },
        ", return the values in the order the cursor reads them."
      ),
      example(
        "panel = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]",
        "[1,2,3,4,8,12,11,10,9,5,6,7]",
        [
          { state: "1 2 3 4", note: "top row, left to right" },
          { state: "8 12", note: "right column, downward" },
          { state: "11 10 9", note: "bottom row, right to left" },
          { state: "5", note: "left column, upward" },
          { state: "6 7", note: "the inner ring is a single row" },
        ],
        "Reading a 3×4 panel"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "Every row has the same length.",
      "-100 ≤ panel[i][j] ≤ 100",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["panel"],
      returns: "int[]",
      functionName: "spiralReadout",
    },
    tests: [
      {
        input: "3\n1 2 3\n4 5 6\n7 8 9",
        expected: "1 2 3 6 9 8 7 4 5",
        isSample: true,
      },
      {
        input: "3\n1 2 3 4\n5 6 7 8\n9 10 11 12",
        expected: "1 2 3 4 8 12 11 10 9 5 6 7",
        isSample: true,
      },
      { input: "3\n4\n8\n15", expected: "4 8 15", isSample: true },
      { input: "1\n42", expected: "42" },
      { input: "1\n1 2 3 4 5", expected: "1 2 3 4 5" },
      { input: "2\n1 2\n3 4", expected: "1 2 4 3" },
      { input: "4\n1 2\n3 4\n5 6\n7 8", expected: "1 2 4 6 8 7 5 3" },
      {
        input:
          "5\n0 1 2 3 4\n5 6 7 8 9\n10 11 12 13 14\n15 16 17 18 19\n20 21 22 23 24",
        expected: "0 1 2 3 4 9 14 19 24 23 22 21 20 15 10 5 6 7 8 13 18 17 16 11 12",
      },
      {
        input:
          "40\n-47 -75 54 95 8 65 -39 -71 31 -11 -23 1 -37 -45 -90 -43 79 33 -87 -11 68 -5 10 41 -80 -73 51 -55 43 84 92 78 -36 62 -3 92 38 -5 -88 92 78 -26 11 48 40 -54 -3 -33 -96 -87\n-83 87 86 -18 -63 3 -21 -76 9 -9 12 62 64 -42 22 -22 -75 -4 -69 -93 47 -45 30 92 -79 -75 57 -92 1 -45 99 -52 30 87 -89 57 -64 38 92 24 32 -44 21 -47 43 -93 -93 -18 -96 -34\n-50 58 -23 74 -52 3 -44 52 -69 66 -6 24 16 81 -42 92 -13 -69 -8 -54 -79 60 22 -54 69 -26 25 95 -4 11 -50 -66 -7 -29 -65 93 5 27 37 -58 -36 37 64 98 20 -37 -78 -59 -10 -6\n84 29 -95 -77 -70 14 -87 5 -43 18 44 -2 44 -88 25 -33 68 45 -86 53 76 1 71 -55 -66 21 -53 55 -86 -27 -6 -11 72 65 -95 80 -44 -80 40 34 4 -89 -86 -71 -69 -21 44 21 38 26\n75 -43 62 -65 99 30 -48 -90 -18 5 -72 77 -66 -48 -91 93 12 -12 29 -8 78 -22 8 -27 -50 -94 30 32 44 65 63 85 81 6 -24 -76 85 -3 -28 99 -33 -44 24 -6 -36 -54 49 -66 44 86\n25 -46 89 -7 -33 -54 48 -10 44 -12 -26 -72 34 18 63 -60 77 43 8 21 -54 99 66 44 11 -66 16 73 13 -84 9 76 -71 28 28 91 0 79 39 -10 46 38 -78 66 80 41 -33 72 0 13\n35 5 62 -58 94 54 33 -94 17 23 -32 -99 30 -7 -99 14 25 0 -67 86 46 -93 -70 44 -61 -44 -14 -64 -18 -68 24 -93 52 -38 93 6 5 -45 -47 -4 76 27 -11 -38 -26 -76 99 -60 5 84\n-16 19 -40 25 66 -79 69 38 95 -61 58 11 -66 36 71 3 -35 -44 45 -99 98 -86 32 -52 53 -94 19 70 51 -86 -63 98 -15 38 20 82 56 9 1 -30 4 42 2 0 7 -93 -31 -65 -44 70\n80 -6 39 -83 -32 -11 90 81 65 -26 28 92 14 51 -62 82 45 -31 95 23 -33 -35 -98 19 -21 18 27 29 -64 64 58 -91 -24 73 -84 -94 -33 -94 -73 35 -37 -2 47 -93 72 -3 -19 -81 -39 0\n-30 -34 63 -18 -70 -21 -88 30 -51 41 -4 -47 -15 32 99 32 89 16 36 -12 57 52 -3 62 26 39 -5 33 77 43 -43 -77 -62 8 -65 -26 28 19 -38 32 96 -90 -92 99 -93 -39 2 -17 -91 -39\n-1 3 -64 -10 -90 -8 61 -61 22 -50 87 -10 -42 40 -35 73 36 30 -31 28 -95 11 -36 33 69 94 -64 1 -96 48 46 9 -88 83 85 -17 75 -36 -77 -4 -66 80 97 -57 -76 43 1 55 -35 -1\n-17 -44 -47 89 89 15 24 73 -49 85 -10 79 80 -75 97 -91 46 -51 -94 27 -21 49 -94 60 78 -48 -23 59 13 15 25 -82 -78 82 86 33 37 -89 55 -60 -81 -25 91 -97 13 43 -68 -29 37 83\n-19 -90 29 -86 -72 -11 29 60 -62 97 -13 34 -78 34 88 93 12 57 92 -54 20 5 93 -87 -87 43 -73 -92 -66 -83 24 66 -18 -73 -91 -27 -34 16 -74 -52 10 -93 21 60 -88 11 23 -6 93 -18\n-22 -64 -39 -64 37 63 89 6 0 39 83 60 49 7 74 52 95 42 29 -45 -27 -16 -70 78 -94 41 98 -28 98 82 35 -32 65 96 53 5 -23 93 29 31 35 64 96 -89 32 85 54 -11 -42 97\n26 20 94 41 -49 34 -36 79 20 -72 12 52 -93 -69 -90 52 65 64 16 -22 -11 -20 -81 19 -6 -97 32 45 -30 93 -71 51 52 46 44 -32 -6 64 0 70 86 -89 -24 73 -84 71 -67 -91 20 9\n-71 36 -11 -45 -85 -44 65 -74 28 -59 -79 -94 69 68 63 29 -56 -36 89 -32 78 95 61 30 84 55 83 65 -93 -85 10 39 35 -98 80 69 -85 -68 48 -77 -16 5 13 23 -43 70 84 -89 55 -66\n-11 -69 -96 -53 25 2 90 84 72 19 4 48 11 -35 -51 85 20 14 73 -4 49 -80 -39 69 16 51 -7 23 -94 44 -6 16 43 82 80 -50 57 -3 -36 86 66 99 -54 99 -55 64 -48 30 79 -69\n45 -76 3 39 -38 -38 -71 -44 -78 -48 68 -55 0 5 -61 -40 -10 70 26 86 -46 69 50 -73 92 -43 -18 -7 -66 -71 1 -18 -16 92 37 -93 40 -11 -11 83 -78 21 12 -2 -50 53 34 64 -83 44\n43 27 -38 -71 -17 -97 22 -75 25 -64 -64 -86 -80 -90 71 -47 -77 89 -5 -54 80 -87 -88 -29 -32 47 -70 30 69 72 93 -72 -10 -94 -19 85 -21 25 -75 99 0 5 -43 -92 24 13 70 79 98 -37\n49 74 -48 45 13 38 -62 -96 -42 75 -92 5 -64 65 -16 -54 37 -9 97 -93 -17 48 28 6 -13 -8 71 95 -35 57 82 48 -80 -48 -96 -28 40 -73 -21 -17 -90 88 36 -40 23 -63 -94 81 83 50\n33 17 -55 -55 61 -80 -69 -59 94 14 -46 -90 -86 -33 61 -99 -15 -49 79 -45 -96 86 94 -94 -48 -2 51 81 92 -28 -45 -86 6 36 -24 40 -52 27 65 -62 -32 -96 -91 28 11 -15 17 -81 98 41\n-81 80 3 32 -99 8 48 -5 9 40 46 -7 -19 67 99 22 -85 -95 40 -25 54 24 58 58 26 -87 -58 93 79 -34 -1 -68 -51 29 8 -50 -66 30 33 11 -85 -79 35 -95 -70 -80 11 -80 19 -7\n-7 -95 16 -34 -59 -50 40 -82 -21 -21 -97 74 87 46 -6 58 61 81 -27 -75 93 -22 37 37 46 -73 -86 -85 -29 77 74 -51 55 -87 -77 24 18 -53 -30 -45 -32 -80 -22 22 53 49 -24 -93 51 -40\n26 -79 2 -41 63 9 86 -65 45 -43 -19 -27 -17 64 -73 -62 -36 -15 79 -89 -57 84 77 62 -17 19 40 -80 80 -86 60 -22 14 -13 13 -93 -43 67 83 -73 -25 -57 -58 -53 8 -23 1 81 32 25\n75 85 9 -97 67 -94 35 -66 -7 -17 70 43 -27 -31 24 83 -68 -6 -66 -66 -58 -55 41 -38 -83 -25 -92 53 -48 -72 64 -82 91 -37 -17 -26 -42 -51 -49 38 -95 79 -96 82 89 -40 32 29 -25 19\n24 -34 -70 -79 35 -92 50 -67 5 47 89 -8 32 -45 -14 81 68 18 2 -86 27 -35 42 -26 -18 80 36 -65 78 -22 -50 20 -90 -16 92 -92 -27 -40 -85 -19 22 20 51 31 -75 -97 -42 75 34 77\n-24 -18 15 28 -35 89 50 45 -30 -25 -10 -9 -51 -85 41 -53 -12 93 -44 -75 -12 49 28 94 -12 92 33 81 14 27 29 42 43 -29 -13 -79 32 82 96 27 52 82 99 -56 47 -91 -37 63 -67 10\n-28 -93 59 -72 83 34 -39 -68 -86 -88 7 -46 -21 -59 -21 -81 43 -78 48 -67 90 23 77 2 -63 6 67 27 -97 -3 -40 66 -20 37 47 -91 -13 92 -18 -17 -92 47 57 -71 -42 79 61 -24 74 -12\n-29 -88 73 44 -29 90 77 -76 -30 -61 -4 -45 -11 89 -65 -97 -42 -84 -66 -24 -47 70 -49 -34 -40 93 99 0 62 -50 -54 51 -39 80 -24 33 -90 68 58 19 17 -37 11 -35 -3 79 -19 -8 63 -57\n-19 79 13 -51 -71 61 -62 66 -45 71 93 -14 -99 99 43 90 20 -34 16 91 -62 7 51 97 -19 -98 -14 -91 94 69 -36 -24 -2 73 33 46 -15 -66 -47 -97 30 -11 38 -94 62 -60 -32 -80 74 -31\n-61 -42 -15 -73 -5 -1 98 -71 -16 2 72 45 93 -65 -47 -88 -50 48 50 -4 44 -17 77 -81 -10 47 12 -81 -37 -39 36 -52 42 -97 -69 45 -84 -99 -1 77 -75 16 41 54 -38 47 54 -82 -90 -69\n-76 -76 26 81 75 -97 10 -17 -7 -74 50 61 -38 80 -11 55 -53 64 75 89 85 94 91 -42 98 -23 46 -13 -16 97 89 -92 14 -68 -59 0 -36 -5 -3 81 6 -25 34 -34 -58 -70 -96 95 41 -36\n-31 1 -63 36 3 34 -96 98 -76 -27 45 -69 -63 -90 69 -70 28 -72 65 72 71 19 -16 22 14 -49 43 -6 -96 -21 -79 29 -14 -89 -54 -43 76 -43 37 -41 24 60 28 -80 56 -79 -53 42 -78 68\n-62 63 74 17 57 5 -20 -91 50 56 -90 -4 -6 -95 -6 63 15 48 32 -34 11 27 28 -58 66 -49 3 16 -84 2 83 63 -92 -36 57 33 61 -66 42 13 15 67 -52 -70 69 88 61 -8 67 48\n21 -20 73 88 74 54 -9 34 51 -57 -36 -3 96 15 -55 27 -8 90 72 -24 -44 34 92 38 14 10 72 -95 43 82 -4 63 -42 68 -88 -27 -1 78 28 -9 77 -57 -77 87 -5 80 63 -75 -12 -49\n77 -85 68 -64 46 99 -76 -47 -56 -81 -32 19 36 -10 9 -8 92 -13 71 94 88 -91 -73 -12 7 -63 63 4 17 91 23 -97 23 65 -38 3 -22 54 -31 65 30 -13 44 72 -81 88 -31 -75 -78 39\n-65 20 0 -78 -61 -89 36 76 -94 5 -34 85 -44 -46 -89 51 -45 10 27 -28 37 3 -78 72 74 9 17 -70 -53 -51 -21 -93 -46 -75 -76 -10 34 24 72 98 9 58 -43 68 93 98 -14 95 -30 -78\n66 88 -28 -69 -88 25 32 -83 -3 -12 41 87 -95 98 8 74 -96 82 42 -20 54 21 81 -52 -26 14 44 -5 -96 -96 90 -70 -23 -96 -87 72 49 60 -13 -95 43 11 -88 -86 -24 -12 -19 -11 82 19\n64 -27 63 16 -83 -90 5 -74 -73 7 11 32 94 -47 90 -37 58 -98 -95 -25 -38 46 16 95 -28 -11 53 -68 54 79 -39 -50 -87 15 92 45 -54 -36 -5 -50 80 41 38 -83 66 -70 -24 36 -18 20\n-66 71 72 4 -39 83 44 -90 91 84 -26 -46 19 -42 -64 17 3 78 -94 61 -26 6 -1 64 13 -36 -6 -34 4 -6 43 -57 2 -76 37 66 -93 0 -74 73 -8 82 -98 12 -97 48 28 -30 -12 -99",
        expected:
          "-47 -75 54 95 8 65 -39 -71 31 -11 -23 1 -37 -45 -90 -43 79 33 -87 -11 68 -5 10 41 -80 -73 51 -55 43 84 92 78 -36 62 -3 92 38 -5 -88 92 78 -26 11 48 40 -54 -3 -33 -96 -87 -34 -6 26 86 13 84 70 0 -39 -1 83 -18 97 9 -66 -69 44 -37 50 41 -7 -40 25 19 77 10 -12 -57 -31 -69 -36 68 48 -49 39 -78 19 20 -99 -12 -30 28 48 -97 12 -98 82 -8 73 -74 0 -93 66 37 -76 2 -57 43 -6 4 -34 -6 -36 13 64 -1 6 -26 61 -94 78 3 17 -64 -42 19 -46 -26 84 91 -90 44 83 -39 4 72 71 -66 64 66 -65 77 21 -62 -31 -76 -61 -19 -29 -28 -24 24 75 26 -7 -81 33 49 43 45 -11 -71 26 -22 -19 -17 -1 -30 80 -16 35 25 75 84 -50 -83 87 86 -18 -63 3 -21 -76 9 -9 12 62 64 -42 22 -22 -75 -4 -69 -93 47 -45 30 92 -79 -75 57 -92 1 -45 99 -52 30 87 -89 57 -64 38 92 24 32 -44 21 -47 43 -93 -93 -18 -96 -10 38 44 0 5 -44 -39 -91 -35 37 93 -42 20 55 79 -83 98 83 98 19 51 32 -25 34 -67 74 63 74 -90 41 -78 67 -12 -78 -30 82 -18 36 -24 -70 66 -83 38 41 80 -50 -5 -36 -54 45 92 15 -87 -50 -39 79 54 -68 53 -11 -28 95 16 46 -38 -25 -95 -98 58 -37 90 -47 94 32 11 7 -73 -74 5 -90 -83 16 63 -27 88 20 -85 -20 63 1 -76 -42 79 -88 -93 -18 -34 85 -79 -95 80 17 74 27 -76 -69 36 20 -64 -90 -44 3 -34 -6 19 5 -46 -43 29 58 -23 74 -52 3 -44 52 -69 66 -6 24 16 81 -42 92 -13 -69 -8 -54 -79 60 22 -54 69 -26 25 95 -4 11 -50 -66 -7 -29 -65 93 5 27 37 -58 -36 37 64 98 20 -37 -78 -59 21 -66 72 -60 -65 -81 -17 55 -29 -6 -11 -91 -89 30 64 79 81 -81 -80 -93 81 29 75 63 -24 -8 -80 -82 95 42 -8 -75 -75 95 -11 -19 -12 -24 -86 -88 11 43 -95 -13 60 49 72 -87 -96 -23 -70 90 -96 -96 -5 44 14 -26 -52 81 21 54 -20 42 82 -96 74 8 98 -95 87 41 -12 -3 -83 32 25 -88 -69 -28 0 68 73 74 -63 26 -15 13 73 59 15 -70 9 2 16 3 -55 -48 -38 3 -96 -11 94 -39 29 -47 -64 63 39 -40 62 89 62 -95 -77 -70 14 -87 5 -43 18 44 -2 44 -88 25 -33 68 45 -86 53 76 1 71 -55 -66 21 -53 55 -86 -27 -6 -11 72 65 -95 80 -44 -80 40 34 4 -89 -86 -71 -69 -21 44 49 -33 99 -31 -19 2 1 -68 23 54 -67 84 -48 34 70 -94 17 11 -24 1 32 -42 -37 61 -19 -32 54 -96 -53 61 63 -31 -14 98 93 68 -43 58 9 98 72 24 34 -10 -76 -75 -46 -93 -21 -51 -53 -70 17 9 74 72 -78 3 37 -28 27 10 -45 51 -89 -46 -44 85 -34 5 -94 76 36 -89 -61 -78 -64 88 17 36 81 -73 -51 44 -72 28 -79 -97 -41 -34 32 -55 45 -71 39 -53 -45 41 -64 -86 89 -10 -18 -83 25 -58 -7 -65 99 30 -48 -90 -18 5 -72 77 -66 -48 -91 93 12 -12 29 -8 78 -22 8 -27 -50 -94 30 32 44 65 63 85 81 6 -24 -76 85 -3 -28 99 -33 -44 24 -6 -36 -54 41 -76 -93 -3 -39 43 43 11 85 71 70 64 53 13 -63 -15 -80 49 -23 -40 -97 -91 79 79 -60 47 -70 -79 88 80 88 -81 72 44 -13 30 65 -31 54 -22 3 -38 65 23 -97 23 91 17 4 63 -63 7 -12 -73 -91 88 94 71 -13 92 -8 9 -10 36 19 -32 -81 -56 -47 -76 99 46 74 57 3 75 -5 -71 -29 83 -35 35 67 63 -59 -99 61 13 -17 -38 25 -85 -49 37 -72 89 -90 -70 -32 66 94 -33 -54 48 -10 44 -12 -26 -72 34 18 63 -60 77 43 8 21 -54 99 66 44 11 -66 16 73 13 -84 9 76 -71 28 28 91 0 79 39 -10 46 38 -78 66 80 -26 7 72 -93 -76 13 -88 32 -84 -43 -55 -50 24 23 11 -70 53 8 89 -75 47 -42 -3 62 -38 -58 56 69 -5 87 -77 -57 77 -9 28 78 -1 -27 -88 68 -42 63 -4 82 43 -95 72 10 14 38 92 34 -44 -24 72 90 -8 27 -55 15 96 -3 -36 -57 51 34 -9 54 5 34 -97 -1 61 90 34 89 -92 -94 9 -50 8 -80 38 -97 -38 2 -44 34 63 -11 15 -8 -21 -11 -79 54 33 -94 17 23 -32 -99 30 -7 -99 14 25 0 -67 86 46 -93 -70 44 -61 -44 -14 -64 -18 -68 24 -93 52 -38 93 6 5 -45 -47 -4 76 27 -11 -38 0 -93 99 -57 -97 60 -89 73 23 99 -2 -92 -40 28 -95 22 -53 82 31 -56 -71 -35 -94 54 -34 -80 -70 -52 67 15 13 42 -66 61 33 57 -36 -92 63 83 2 -84 16 3 -49 66 -58 28 27 11 -34 32 48 15 63 -6 -95 -6 -4 -90 56 50 -91 -20 -96 10 98 -62 77 -39 50 50 35 86 40 48 -69 -62 22 -71 90 65 -36 89 29 24 61 -88 90 69 38 95 -61 58 11 -66 36 71 3 -35 -44 45 -99 98 -86 32 -52 53 -94 19 70 51 -86 -63 98 -15 38 20 82 56 9 1 -30 4 42 2 47 -92 97 91 21 96 -24 13 -54 12 -43 36 -91 35 -22 -58 -96 51 99 57 11 38 41 34 28 60 24 -41 37 -43 76 -43 -54 -89 -14 29 -79 -21 -96 -6 43 -49 14 22 -16 19 71 72 65 -72 28 -70 69 -90 -63 -69 45 -27 -76 98 -17 -71 66 -76 -68 45 -67 -66 -65 -82 -5 -59 -96 -75 -44 84 -74 79 6 60 73 -61 30 81 65 -26 28 92 14 51 -62 82 45 -31 95 23 -33 -35 -98 19 -21 18 27 29 -64 64 58 -91 -24 73 -84 -94 -33 -94 -73 35 -37 -2 -90 80 -25 -93 64 -89 5 99 21 5 88 -96 -79 -80 -57 79 20 82 47 -37 -11 16 -25 6 81 -3 -5 -36 0 -59 -68 14 -92 89 97 -16 -13 46 -23 98 -42 91 94 85 89 75 64 -53 55 -11 80 -38 61 50 -74 -7 -16 -45 -30 -86 -30 5 -7 45 -21 9 94 -42 25 -78 72 28 20 0 -62 -49 22 -51 41 -4 -47 -15 32 99 32 89 16 36 -12 57 52 -3 62 26 39 -5 33 77 43 -43 -77 -62 8 -65 -26 28 19 -38 32 96 -66 -81 10 35 86 -16 66 -78 0 -90 -32 -85 -32 -25 -95 22 52 -92 17 30 -75 77 -1 -99 -84 45 -69 -97 42 -52 36 -39 -37 -81 12 47 -10 -81 77 -17 44 -4 50 48 -50 -88 -47 -65 93 45 72 2 71 -61 -88 -25 47 -17 -43 -21 40 14 75 -64 -48 19 -59 -72 39 97 85 -50 87 -10 -42 40 -35 73 36 30 -31 28 -95 11 -36 33 69 94 -64 1 -96 48 46 9 -88 83 85 -17 75 -36 -77 -4 -60 -52 31 70 -77 86 83 99 -17 -62 11 -45 -73 38 -19 27 -17 19 -97 -47 -66 -15 46 33 73 -2 -24 -36 69 94 -91 -14 -98 -19 97 51 7 -62 91 16 -34 20 90 43 99 -99 -14 93 -4 7 -10 89 70 -19 -97 46 -46 -92 -64 68 4 -79 12 83 -13 -10 79 80 -75 97 -91 46 -51 -94 27 -21 49 -94 60 78 -48 -23 59 13 15 25 -82 -78 82 86 33 37 -89 55 -74 29 0 48 -36 -11 -75 -21 65 33 -30 83 -49 -85 96 -18 58 68 -90 33 -24 80 -39 51 -54 -50 62 0 99 93 -40 -34 -49 70 -47 -24 -66 -84 -42 -97 -65 89 -11 -45 -46 -9 -8 43 -27 74 -7 -90 5 -86 -55 48 -94 52 60 34 -78 34 88 93 12 57 92 -54 20 5 93 -87 -87 43 -73 -92 -66 -83 24 66 -18 -73 -91 -27 -34 16 93 64 -68 -3 -11 25 -73 27 30 -53 67 -51 -40 82 92 -13 -91 47 37 -20 66 -40 -3 -97 27 67 6 -63 2 77 23 90 -67 48 -78 43 -81 -21 -59 -21 -51 32 -27 -17 87 -19 -86 -64 -80 0 11 69 -93 49 7 74 52 95 42 29 -45 -27 -16 -70 78 -94 41 98 -28 98 82 35 -32 65 96 53 5 -23 -6 -85 57 40 -21 40 -52 -66 18 -43 -42 -27 32 -79 -13 -29 43 42 29 27 14 81 33 92 -12 94 28 49 -12 -75 -44 93 -12 -53 41 -85 -45 -31 64 46 67 -33 65 -90 5 -35 68 -69 -90 52 65 64 16 -22 -11 -20 -81 19 -6 -97 32 45 -30 93 -71 51 52 46 44 -32 69 -50 -93 85 -28 40 -50 24 -93 -26 -92 92 -16 -90 20 -50 -22 78 -65 36 80 -18 -26 42 -35 27 -86 2 18 68 81 -14 24 -73 -6 99 61 -16 71 -61 -51 63 29 -56 -36 89 -32 78 95 61 30 84 55 83 65 -93 -85 10 39 35 -98 80 80 37 -19 -96 -24 8 -77 13 -17 -37 91 -82 64 -72 -48 53 -92 -25 -83 -38 41 -55 -58 -66 -66 -6 -68 83 -62 58 22 -99 -54 -47 -40 85 20 14 73 -4 49 -80 -39 69 16 51 -7 23 -94 44 -6 16 43 82 92 -94 -48 36 29 -87 -13 14 -22 60 -86 80 -80 40 19 -17 62 77 84 -57 -89 79 -15 -36 61 -85 -15 37 -77 -10 70 26 86 -46 69 50 -73 92 -43 -18 -7 -66 -71 1 -18 -16 -10 -80 6 -51 55 -51 74 77 -29 -85 -86 -73 46 37 37 -22 93 -75 -27 81 -95 -49 -9 89 -5 -54 80 -87 -88 -29 -32 47 -70 30 69 72 93 -72 48 -86 -68 -1 -34 79 93 -58 -87 26 58 58 24 54 -25 40 79 97 -93 -17 48 28 6 -13 -8 71 95 -35 57 82 -45 -28 92 81 51 -2 -48 -94 94 86 -96 -45",
      },
    ],
    hints: [
      "Try it on paper with a 3×4 grid. When does the cursor turn?",
      "One way: move straight until the next cell is off the grid or already read, then turn right.",
      "Another way needs no visited marks: keep the top, bottom, left and right edges of the unread area, and move an edge inward after reading along it.",
      "Watch single rows and single columns. After the top row and right column, check the bounds again before reading the bottom row or left column, or you read cells twice.",
    ],
    solutions: [
      {
        title: "Simulate the cursor with a visited grid",
        order: 1,
        intuition:
          "Model the cursor literally: it has a position and a heading, and turns right whenever the next step would leave the panel or land on a value it already read. A visited grid answers the second question.",
        approach: [
          "Store the four headings in clockwise order: right, down, left, up.",
          "Repeat rows × cols times: read the current cell and mark it.",
          "If the next cell in the current heading is outside the panel or already read, turn to the next heading.",
          "Step forward.",
        ],
        code: {
          PYTHON: `def spiralReadout(panel: List[List[int]]) -> List[int]:
    rows, cols = len(panel), len(panel[0])
    read = [[False] * cols for _ in range(rows)]
    headings = [(0, 1), (1, 0), (0, -1), (-1, 0)]
    r = c = h = 0
    out = []

    for _ in range(rows * cols):
        out.append(panel[r][c])
        read[r][c] = True
        nr, nc = r + headings[h][0], c + headings[h][1]
        if not (0 <= nr < rows and 0 <= nc < cols) or read[nr][nc]:
            h = (h + 1) % 4
            nr, nc = r + headings[h][0], c + headings[h][1]
        r, c = nr, nc

    return out`,
          JAVA: `class Solution {
    public int[] spiralReadout(int[][] panel) {
        int rows = panel.length, cols = panel[0].length;
        boolean[][] read = new boolean[rows][cols];
        int[][] headings = {{0, 1}, {1, 0}, {0, -1}, {-1, 0}};
        int[] out = new int[rows * cols];
        int r = 0, c = 0, h = 0;

        for (int i = 0; i < rows * cols; i++) {
            out[i] = panel[r][c];
            read[r][c] = true;
            int nr = r + headings[h][0], nc = c + headings[h][1];
            if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || read[nr][nc]) {
                h = (h + 1) % 4;
                nr = r + headings[h][0];
                nc = c + headings[h][1];
            }
            r = nr;
            c = nc;
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols) for the visited grid",
        edgeCases: ["A single cell.", "A single row or a single column."],
        commonMistakes: [
          "Stepping before checking the turn, which walks off the grid.",
          "Looping until the cursor is stuck instead of a fixed rows × cols times.",
        ],
      },
      {
        title: "Optimal: four shrinking boundaries",
        order: 2,
        intuition:
          "The unread area is always a rectangle. Reading its top row removes that row, so the top edge moves down; reading its right column moves the right edge left, and so on. Four integers replace the whole visited grid.",
        approach: [
          "Set top = 0, bottom = rows - 1, left = 0, right = cols - 1.",
          "While top ≤ bottom and left ≤ right: read the top row from left to right, then move top down.",
          "Read the right column from top to bottom, then move right inward.",
          "If a row remains, read the bottom row from right to left and move bottom up.",
          "If a column remains, read the left column from bottom to top and move left inward.",
        ],
        code: {
          PYTHON: `def spiralReadout(panel: List[List[int]]) -> List[int]:
    top, bottom = 0, len(panel) - 1
    left, right = 0, len(panel[0]) - 1
    out = []

    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(panel[top][c])
        top += 1

        for r in range(top, bottom + 1):
            out.append(panel[r][right])
        right -= 1

        # A single remaining row was already read left to right.
        if top <= bottom:
            for c in range(right, left - 1, -1):
                out.append(panel[bottom][c])
            bottom -= 1

        # Likewise a single remaining column was already read downward.
        if left <= right:
            for r in range(bottom, top - 1, -1):
                out.append(panel[r][left])
            left += 1

    return out`,
          JAVA: `class Solution {
    public int[] spiralReadout(int[][] panel) {
        int top = 0, bottom = panel.length - 1;
        int left = 0, right = panel[0].length - 1;
        int[] out = new int[panel.length * panel[0].length];
        int k = 0;

        while (top <= bottom && left <= right) {
            for (int c = left; c <= right; c++) out[k++] = panel[top][c];
            top++;
            for (int r = top; r <= bottom; r++) out[k++] = panel[r][right];
            right--;
            if (top <= bottom) {
                for (int c = right; c >= left; c--) out[k++] = panel[bottom][c];
                bottom--;
            }
            if (left <= right) {
                for (int r = bottom; r >= top; r--) out[k++] = panel[r][left];
                left++;
            }
        }
        return out;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(1) beyond the output",
        edgeCases: [
          "A single row: the bottom-row pass must be skipped.",
          "A single column: the left-column pass must be skipped.",
          "A tall or wide rectangle whose innermost ring is one row or column.",
        ],
        commonMistakes: [
          "Leaving out the two inner bound checks, which reads the middle row or column twice.",
          "Off-by-one ranges when reading right to left or bottom to top.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(1) extra",
  },

  {
    slug: "unlock-every-vault",
    title: "Unlock Every Vault",
    difficulty: "EASY",
    learningObjective:
      "Recognise reachability from a single source as a graph traversal, even when the edges are described as keys inside rooms.",
    topics: ["graphs"],
    patterns: ["depth-first-search", "breadth-first-search"],
    statement: [
      para(
        "A bank's basement has a row of vaults numbered from 0. Vault 0 is unlocked; every other vault starts locked. Inside each vault is a set of keys, and each key opens exactly one vault. A key can be used any number of times."
      ),
      rich(
        { code: "vaults[i]" },
        " lists the vault numbers whose keys are stored in vault ",
        { code: "i" },
        ". Return ",
        { code: "true" },
        " if an auditor starting with vault 0 can eventually open every vault, and ",
        { code: "false" },
        " otherwise."
      ),
      example(
        "vaults = [[1,3],[3,0,1],[2],[0]]",
        "false",
        [
          { state: "open {0}", note: "vault 0 holds keys 1 and 3" },
          {
            state: "open {0,1,3}",
            note: "vault 1 gives 3, 0, 1; vault 3 gives 0 — nothing new",
          },
          { state: "vault 2 locked", note: "its only key is inside vault 2 itself" },
        ],
        "Following the keys from vault 0"
      ),
    ],
    constraints: [
      "1 ≤ vaults.length ≤ 1000",
      "0 ≤ vaults[i][j] < vaults.length",
      "A vault may hold no keys, duplicate keys, or its own key.",
      "The total number of keys is at most 2000.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["vaults"],
      returns: "bool",
      functionName: "canOpenAll",
    },
    tests: [
      {
        input: "4\n1\n2\n3\n",
        expected: "true",
        isSample: true,
        explanation: "Vault 0 holds key 1, vault 1 holds key 2, vault 2 holds key 3.",
      },
      {
        input: "4\n1 3\n3 0 1\n2\n0",
        expected: "false",
        isSample: true,
        explanation:
          "Only vault 2 holds the key to vault 2, so it can never be opened.",
      },
      {
        input: "1\n",
        expected: "true",
        isSample: true,
        explanation: "There is only vault 0, and it starts open.",
      },
      { input: "3\n2\n\n0", expected: "false" },
      { input: "3\n1\n1\n1 2", expected: "false" },
      { input: "4\n3\n\n1\n2", expected: "true" },
      { input: "5\n1 2 3 4\n\n\n\n", expected: "true" },
      { input: "2\n0 0\n", expected: "false" },
      {
        input:
          "1000\n711 71 788\n176 93\n242\n441\n157 840\n992\n994\n133\n135\n782 678\n561 272\n140 704\n235\n281 560\n444\n386\n555\n630\n791\n983\n891\n65\n259 148\n329 302\n256 564\n41\n950\n136\n940 665\n280 248 891\n305\n768\n213\n225\n623\n943 478\n31 507\n887\n765 159\n8 100\n580\n342 297\n884\n624\n747\n970 360 586 473\n509 417\n52\n701\n309\n678 459\n48 16\n620\n225 475\n291 22\n23\n96 117\n985\n403\n83 187\n825\n778 316\n544\n35\n733\n737\n534\n619\n731\n527 558 291\n404\n32\n669\n230\n868 44\n919 753\n933 948 182\n12 58 199\n894 285\n728 787\n824\n610\n477\n536\n973\n474\n130\n46\n739 77\n282\n222\n496 472 194\n677 848\n519 1\n770 369 694\n652\n338 86 122\n359 677\n484\n976 101\n145\n841 818 993\n972\n526\n175\n710\n540 816 159\n348\n462 657\n255\n883\n17\n491\n97\n656 809\n947\n167\n129\n69 212\n589 661\n196\n962\n25\n236\n519\n956\n539\n465\n684 638\n658\n380 149\n75\n739\n114\n778\n377 699\n658 481\n716 711 218\n438\n342\n272 457\n169\n376 5 719\n90 959 502\n760\n126\n374\n543\n118\n184 373\n207\n216\n517\n3 395\n429\n11\n830 206\n471 954\n293\n391\n87 625\n273\n524 448\n349\n179\n351\n817\n712\n557\n193\n269\n618\n443 554 943\n238 622\n892\n350\n561 578\n309 281 636\n121 484\n854 375\n248\n86\n719\n775\n851 913 661\n812\n140 266\n684 748\n890\n434\n243\n439\n763\n515 986 774\n717\n971\n178 734\n695 990\n426\n69\n450 503\n616\n407 170\n150\n449 394\n269 664\n713\n433\n72\n594\n19\n988\n488 571\n904\n6\n976 713 864 535\n80\n154 651 913\n397 87\n139 689\n192 707\n881\n885\n653\n680\n807\n15\n22\n727\n709 1\n321\n463\n773 563\n13\n874\n226\n286\n870 586\n562\n552\n483 427\n577\n629\n367\n633\n965\n107 241 449\n708\n615\n337\n744\n460\n540\n964 205 196\n691 205\n247\n91 316 865\n296\n520\n70 321\n29\n261 546\n92\n567\n682 912\n582 31\n340\n108\n644\n800\n432\n888\n372\n125 948\n742\n208\n905 163\n550\n56 810\n382\n151\n8\n326\n366\n101 764 731\n131 750 379\n195\n826\n451 146 580\n232\n185 366\n143 148\n464\n845 707\n559\n860\n591\n502 186\n612\n107 995\n318\n960\n556\n312\n262\n697 942\n153\n469\n136 325\n783 764\n16 986\n894 734\n317\n54\n173\n767 295 353\n446 144 754\n339 334\n601\n304\n756\n427\n14 993 792\n730 283\n270 268\n161\n969\n581\n179 299\n725\n322\n975\n554\n82\n510\n345\n802\n922\n695\n911\n228\n882\n923 836\n626\n393 380\n4\n158\n37\n535\n62 611\n257 850\n528 53 329\n423 806\n42 919\n\n643\n468\n600\n957 967 503\n631 679 380\n634 884\n41 224 281\n364\n668\n4 740\n916\n574 693\n955 802\n941\n263\n177 681\n582\n928\n784\n981\n447 539 726\n693 340\n641 537\n706\n997\n358 320\n130 838\n456\n112\n167 171\n611 684\n685\n134 641\n891 487\n435\n566\n93\n646\n94\n585\n662\n452\n821\n410\n7 802 692\n502 858\n79 78\n354\n39 106\n494\n835 59\n146 583\n45\n319 476\n953\n572\n853\n699\n344\n425\n819\n603 931\n828 300\n335\n836 505\n254 177\n674 300 688\n313\n362\n127 898\n201\n525\n330 545\n302 222\n666\n267\n742 416\n797\n604\n320 843\n958\n498\n461\n257\n187 504 876\n287\n109\n816\n249\n814 264\n48\n347\n12\n749\n343\n999\n550 562 596\n411 781\n328\n139\n44\n707 77\n570\n978\n163 405\n573 401\n919 703\n96\n687\n609 826\n81\n112 888 951\n39\n963\n925\n85 29\n879\n723 598 368\n317 323 419\n754\n489\n338\n154\n831 188\n49\n672\n497\n124\n602\n968\n119\n785\n987\n485 801\n454\n898\n692\n741\n895\n614 492\n294\n310 319\n191\n808 541\n57\n561\n200\n113\n899\n166\n876\n518 579 481\n970\n910\n183 210\n440\n583 420\n603\n902 227\n855\n562 934 258\n349 553 682\n803\n211\n935\n172 199\n938\n51\n690 523\n607\n276\n388\n506\n794 823\n23 872\n332 204\n979\n721 77\n761\n306\n857\n362 914\n846\n897\n939\n79\n599 877\n203\n315\n68 834\n595\n817 197\n219\n676\n904 635\n144 55\n400\n10\n806\n220 673\n233\n81 275\n385\n759\n532 562\n875\n759 890 681\n790\n659\n491 237 481\n379 352\n977\n106 160\n798\n523\n476\n243 493 142\n40\n445 206\n804\n279\n64\n147\n392 786\n647 181\n711 951\n67\n920 18\n847\n221\n788 210\n20\n58\n777\n76 774 696\n277 210\n705 711\n173 984 772\n47\n917\n841\n83 837\n747 387\n254 290\n240 39\n780\n138\n996 240 243\n424\n371\n111\n331\n236 918\n217 751\n252 304 816\n670\n787\n244\n533 129 878\n143 490\n781 852\n639 949\n568\n303 485\n356 794 43\n324\n800 859\n944\n966\n311\n906 467\n73\n805\n598\n587 257\n76\n989\n597\n174\n470\n548 879\n714\n275 948\n925 531\n104\n341\n251\n730 503\n743 850\n448\n268 698 542\n227 176 913\n289\n566 767 183 31\n870 704\n209\n34 893\n991\n673 168\n831\n336\n123 521\n258\n414\n467 752\n613\n21 21\n120\n952\n360 348\n521\n261\n930\n795\n164\n74 133 680\n896\n206\n843\n274\n19 293 549\n489 500\n560\n260\n927\n238 273 571 337\n563\n527 973\n770\n26 833\n840\n987 427 654 982 905 938\n683 253 1 243\n992 62 447\n220\n270\n417\n569\n586 674\n390 599\n353 209\n131 924\n480 660\n21 655\n482\n771 629 358\n137\n924\n461 943\n383 727 682 513\n458\n894\n908 899 592\n820\n327\n866\n696\n827\n119 460 832\n165 996\n982\n829\n576 424\n823\n762\n988 245\n56 779\n389 489\n149\n811 464\n886\n264\n89 91\n635 115 441 43\n381\n2 891\n402\n809\n660 905\n71\n889 413\n628\n53 589\n585 218\n590\n589\n415\n50\n465 370\n839\n785 938 529\n946 547\n253\n378\n152 365 754\n162\n614 426\n66\n301\n18\n374 512\n622 409\n428 229\n869\n909\n103 660\n980\n314\n530\n836\n399\n686\n479\n906\n524 676 945\n641\n575\n35 214\n271\n854\n766\n828\n993\n861\n940 836\n356\n430\n732\n786\n513 78 24 377\n60\n594 190\n61\n640\n307\n397 160\n496\n649 561\n365\n565\n697\n198\n253 736 38 539 802 94\n278\n217\n98\n936 36\n671\n110\n901 890\n642 284 180\n455\n657\n588 588 849\n849 333\n42\n689 611\n748 99\n514 13\n264 308\n143\n153 361\n63\n352\n614 993 606\n792\n908 84\n471\n728 772 211 33\n551\n568 431\n194\n541\n330\n479 977 667\n430 502\n799\n348 998\n95\n333 413\n967\n180\n801\n472 746 700\n758\n771 128\n720 411 573\n470 27\n442 192\n961\n88\n141\n645\n85 223\n116\n44 880\n724\n234\n354 84\n974\n142 129 33 683\n231 653\n155\n660 93\n158 776\n204 537\n451 849\n789\n796\n726 627\n957\n808 26\n132\n738\n292 125\n34\n941 406\n30\n533\n915\n637 331\n948 105\n107\n769\n863\n55 729\n842\n408\n782\n837\n538\n757\n298\n522 5 812\n484 586 173\n722\n307 723\n250\n102\n215\n815 358\n422\n359 227\n761 466\n511\n486 516\n355\n56 631\n672 735\n170\n921 656\n793\n946\n903 840\n156 280\n834 940\n446\n873\n418\n239\n932\n573\n969 518\n593 865\n929 823\n537 736 611 38\n396\n28\n499\n419 158\n24\n700 818\n373\n631 926\n986 871\n288\n438 205\n369 35\n686 696 229\n617\n677\n605\n387 773 238\n363\n246\n486\n346\n621\n339\n739 739 599\n844\n714 650\n34 937\n523 608\n211 46 745\n933\n384 876\n632\n663\n501\n645 810\n453 723\n90 879\n702 318\n99 867\n351 436\n970 584\n355 715 238\n852 665 657\n412\n12 189\n731 241\n718 330\n142\n900\n495 946 640 766\n284 41\n492 508 751\n9\n146\n59\n675\n473 864 964\n235 398\n755 527 275\n522\n676 822\n421\n265\n256 966\n350 907\n91\n639 241\n648\n181\n3 615\n813\n862\n202\n936\n856\n698 446\n357\n437\n912",
        expected: "true",
      },
      {
        input:
          "900\n343\n877\n567\n132\n525\n199\n192 212\n276\n508\n543 231 556\n327\n137 792\n155\n453\n614\n529\n512\n762 68\n21\n270\n428\n640\n170\n533 6 295\n223\n582\n753\n68\n840\n736 723\n843\n171\n99\n516\n281\n204\n570 180 434 716\n168\n804\n847\n80\n319\n277\n859 259 678\n827\n509\n190\n31 419 391\n297 593\n232\n546\n690 714\n789\n30\n539 419 315\n85\n543\n846\n719\n845 566\n109\n603 239\n502 74\n233\n420 728\n292\n438\n835 520\n826\n626\n131 656 454\n552\n535\n775 510\n644 316\n617\n528 784\n663\n366 594\n720 45 350\n392\n870\n523\n331\n376 242\n253 163\n198 165\n765\n475\n393\n562\n401\n819 153 703 440 150\n513 592\n201\n557 258\n553\n388 331\n19\n481\n273\n823\n305\n312\n417\n648\n87\n397 594\n600 770\n93 81\n628\n440\n289\n526\n611\n38\n503 701\n174\n581 8\n127 58\n749\n876\n206\n363\n841\n609\n33\n353\n690 404 398\n362\n59\n220 117\n411 559\n899\n536\n762 538\n236 357 311 712\n311\n131 371\n398\n65 340 685\n700\n694 742 32 381\n896\n695 429\n241 816 338 832\n387\n246\n439\n457 806\n494 212\n290\n825\n487 753\n667\n895\n879\n491\n802\n102\n3\n862 624\n585\n754\n157\n887\n45\n869 707 736 528\n322\n326 548\n622 171\n321\n198 672\n350 130\n166\n688 93\n836\n227\n477\n633 194\n790\n661\n189\n670\n234 614 795 438\n841 726\n848\n346\n394 466\n898\n159\n251\n275\n528 395 407\n274\n175\n595 895 63\n156 93 658\n863 484\n372\n134\n216\n413 467\n151\n494\n41 707\n284\n611 794\n15 634\n725 704\n379\n697 286\n860\n100\n181 555\n769\n354 862\n639 193\n52\n37 488\n225\n479\n173 315\n9\n202 528\n873\n858\n761\n703\n674 380\n503\n182\n287 681 722\n642\n338\n624\n555 356\n807\n566 532\n517\n708\n652\n670 263 590\n853\n767\n741 844\n480\n310\n374\n404\n20\n612 646\n342 15 36\n738\n423 317 586\n245\n323\n365\n809 154 505 96\n197\n42\n271\n894\n797\n152 810\n422 802\n830 248\n476\n866\n175 24\n496 241\n278 369\n406 786\n533\n710\n418\n227 658\n408\n815\n308 459 650\n278 95\n231 283\n79 250\n95 347 264\n16\n163 599\n267 342\n459\n447 59\n875\n897 140\n183\n208\n757 805\n783 263\n357\n636\n830 734 376 210\n722 897\n674 711\n304\n67\n577\n73\n421\n607\n861\n580\n46\n235 446\n333 723\n300 525\n882\n564 141\n118\n465\n328\n76\n407\n664\n332\n51\n587 619\n386 10\n885\n186\n220 142 183\n101 344\n248 70\n36\n555 139\n677\n537\n266\n291 124\n218\n61 11\n883\n325\n390\n44 433\n364 195\n516 568 696 317\n788 285 481\n660 752\n120\n856\n301\n504 74\n647\n245 55\n57\n397\n751\n675 726 335\n631 651\n485 758\n448\n422 706\n759\n527 133\n94 330\n22\n235 869\n820 813\n575\n259 812\n410 432\n107\n50\n185\n727 352\n351\n330 467\n137 750\n256 89\n859\n829\n881 579\n26\n466\n654 61\n803 132 31\n375\n97\n196 416\n699\n485 81\n144\n515\n257\n146\n382 424 80\n524\n1 724 595\n242\n435\n415\n846 511\n811\n140 547\n730\n729\n489\n733 656\n103\n148\n498\n613\n396\n49\n671\n837\n133 217\n287 115\n891 358\n773 856 842\n881\n576\n653\n627\n458\n844\n659\n302\n694\n244\n361\n865\n224 333\n454 369\n122\n865 828\n597\n350 437\n779\n630\n801 747\n814 482\n531\n787\n181 195 405\n493\n145\n126\n688 530\n715\n822 275\n649 850\n863\n771 657\n207\n313\n518\n656\n184 871\n281 623\n82\n86\n472 684\n674\n209\n557 749 666 454\n314 81\n765 35\n752\n89\n138 539\n296 782\n239 829\n798\n578 90 573\n784\n869\n47 182\n261\n643 396\n114\n330\n800 641\n685\n737\n739\n803 381\n615\n373\n104 84\n717 534\n2\n635\n831 515\n610\n341\n13\n383 33\n403\n629\n443\n893\n280 851\n136 169\n574 43\n593\n64\n610 746\n360\n857 133\n356\n317\n718\n487 725\n39\n74\n138\n810\n522 655\n568 295 41\n683\n423\n196\n849\n800\n895 7\n608 689\n17\n558 792\n63\n263\n886 177\n127 678\n444\n489 478\n680 303\n242 709\n541 13\n143\n180\n855\n133\n105\n538 682 53\n75 833\n890\n616\n29\n768\n638\n288 205\n133 864\n349\n764\n774 39\n366 610 221\n776 19\n810 48\n816 715 358\n766\n748\n720\n824\n129 399\n400\n293\n260\n332 116\n433\n174 294\n763\n254\n111\n409\n47 542\n819\n604\n178 326\n563\n18 675\n886 318\n257 505 60\n872 287\n545\n104\n549\n442 573\n92 447\n169 645\n430\n499\n778\n203\n436\n210\n72\n412 665\n4\n307\n344\n334\n742\n668\n294 676\n236 228\n619\n344 241\n213\n141\n170 750\n625\n320\n62\n506 287\n679\n302 571\n592\n460 404\n348\n238\n10\n587 673\n11\n730 121\n799\n164\n96\n144 83\n662 725\n436 160 344\n40 305\n339 62 838\n272\n154\n508 125\n889 42\n184 269\n74 369\n606\n854\n54\n389 129\n486\n796 102\n434\n352 173\n378 132\n864 723 560 812 329\n551\n589\n596\n12\n583\n500\n471 253\n395 821 368\n770\n835\n329 371\n267\n177 140 756\n296\n184 615 306\n601\n621 242\n561\n370\n441\n221 188\n365 335\n723 420\n461\n821 808\n269 455\n315 816\n897 250\n195\n804 298 395\n464\n8\n874\n65\n56\n412\n381\n386 692 330\n833\n698 98\n269\n707\n234\n21 240\n645\n548 698\n632\n755\n110\n336 211 633\n309 793\n780\n684\n867 743\n598\n824 608 199\n34 838 656\n285\n106\n359 892 88\n519 450\n67 521 568\n456\n850\n315 497\n327 252\n426\n471 758\n584\n744\n60\n772\n255\n735 480\n887 777\n70 794\n572\n161 283\n793 678\n71 193\n1\n282\n725 891 473\n451\n845 825\n211\n167\n112 893\n731 635\n129 413\n691 655\n680 441\n230 702\n655\n247 274\n620 683\n219\n88\n384 71\n162\n732\n816 162 308\n470\n469\n745\n772 615 215\n852\n628 892 488\n265\n897 834\n280\n62 431 534\n501 808\n854 123 319\n557 254 618\n540\n490\n488 285 510\n588 483\n881 880\n781\n878\n368\n159 834\n697\n872 851 335 174\n716\n602 274\n243\n749 793\n93\n205\n605 722\n113\n367\n226 767\n6\n43\n230 288\n554\n491 262\n14\n424\n179\n377\n34\n355\n5 148\n139\n27\n818\n775\n839 381\n176\n117\n885 514\n135\n149\n402\n173\n406 431\n493 427\n376 90\n200 453\n153 367\n892 273 25 258\n462\n183 127 474\n531 721\n28 711\n618\n177\n686\n124 639\n316\n16 813\n432\n669\n108\n119\n549 222\n646 266 106\n588\n698 167 359\n773\n569\n198\n884\n237\n713 755 325\n385\n440 687\n23\n214\n261 191\n445\n801\n771\n77 163\n712 810\n78\n740\n442 531\n550\n785\n519 729\n468\n158\n53 836\n556 249\n766 147\n69\n631\n740 449\n172\n91 171 388\n299\n591\n424 805\n835 463\n859 425 438\n217 868\n806 229\n128\n194\n176 397 414\n639\n695\n264\n492\n814\n637\n791 542\n611 66\n411\n135 867\n229 601\n565\n666 452 566\n172 345\n115\n817 888\n268\n249\n817\n528 337\n760 618\n693\n324\n279\n147 374 609 705\n187\n544\n406\n495",
        expected: "false",
      },
    ],
    hints: [
      "Draw each vault as a dot and each key as an arrow from the vault holding it to the vault it opens.",
      "The question becomes: can every dot be reached from dot 0 by following arrows?",
      "Keep a list of opened vaults you have not yet emptied. Empty one, and add every newly opened vault to the list.",
      "A depth-first search with a stack and an opened array answers it in one pass over all keys.",
    ],
    solutions: [
      {
        title: "Repeated sweeps until nothing new opens",
        order: 1,
        intuition:
          "Start with vault 0 open and keep sweeping over every open vault, using all of its keys. As long as a sweep opens something new, sweep again. When a sweep changes nothing, the open set is final.",
        approach: [
          "Mark vault 0 open.",
          "Sweep: for every open vault, open each vault its keys name, noting whether anything changed.",
          "Repeat while a sweep changed something.",
          "Return whether every vault is open.",
        ],
        code: {
          PYTHON: `def canOpenAll(vaults: List[List[int]]) -> bool:
    opened = [False] * len(vaults)
    opened[0] = True
    changed = True

    while changed:
        changed = False
        for v in range(len(vaults)):
            if opened[v]:
                for key in vaults[v]:
                    if not opened[key]:
                        opened[key] = True
                        changed = True

    return all(opened)`,
          JAVA: `class Solution {
    public boolean canOpenAll(int[][] vaults) {
        boolean[] opened = new boolean[vaults.length];
        opened[0] = true;
        boolean changed = true;

        while (changed) {
            changed = false;
            for (int v = 0; v < vaults.length; v++) {
                if (!opened[v]) continue;
                for (int key : vaults[v]) {
                    if (!opened[key]) {
                        opened[key] = true;
                        changed = true;
                    }
                }
            }
        }
        for (boolean o : opened) if (!o) return false;
        return true;
    }
}`,
        },
        timeComplexity:
          "O(n × (n + k)) where k is the number of keys — a long chain can need n sweeps",
        spaceComplexity: "O(n)",
        edgeCases: ["A single vault, which is already open."],
        commonMistakes: [
          "Stopping after one sweep, which misses vaults opened by keys found later in the same sweep order.",
        ],
      },
      {
        title: "Optimal: depth-first search with a stack",
        order: 2,
        intuition:
          "Each vault only needs to be emptied once. Push a vault onto a stack the moment it is opened; popping it means collecting its keys. Every vault and every key is handled exactly once.",
        approach: [
          "Mark vault 0 opened and push it.",
          "Pop a vault and look at each key inside.",
          "If a key opens a vault not yet opened, mark it and push it.",
          "When the stack is empty, check that every vault was opened.",
        ],
        code: {
          PYTHON: `def canOpenAll(vaults: List[List[int]]) -> bool:
    opened = [False] * len(vaults)
    opened[0] = True
    stack = [0]

    while stack:
        vault = stack.pop()
        for key in vaults[vault]:
            if not opened[key]:
                opened[key] = True  # mark on opening so it is pushed once
                stack.append(key)

    return all(opened)`,
          JAVA: `class Solution {
    public boolean canOpenAll(int[][] vaults) {
        boolean[] opened = new boolean[vaults.length];
        opened[0] = true;
        ArrayDeque<Integer> stack = new ArrayDeque<>();
        stack.push(0);

        while (!stack.isEmpty()) {
            int vault = stack.pop();
            for (int key : vaults[vault]) {
                if (!opened[key]) {
                    opened[key] = true;
                    stack.push(key);
                }
            }
        }
        for (boolean o : opened) if (!o) return false;
        return true;
    }
}`,
        },
        timeComplexity: "O(n + k)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A vault containing its own key, which never helps.",
          "Duplicate keys in one vault.",
          "A vault that holds no keys at all.",
        ],
        commonMistakes: [
          "Checking only that every vault's key exists somewhere, ignoring that the vault holding it may itself be unreachable.",
          "Forgetting that vault 0 starts open even though no key for it is needed.",
        ],
      },
    ],
    expectedTime: "O(n + k)",
    expectedSpace: "O(n)",
  },

  {
    slug: "coastline-length",
    title: "Coastline Length",
    difficulty: "EASY",
    learningObjective:
      "Count a property of a grid by examining each cell's four neighbours, treating the border as if it were outside water.",
    topics: ["matrices"],
    patterns: ["depth-first-search"],
    statement: [
      para(
        "A cartographer is measuring coastline on a square-tile map. Each tile is land (1) or water (0). Every tile has side length 1, and anything beyond the edge of the map is open sea."
      ),
      rich(
        "A unit of coastline is any tile side where a land tile meets water or the edge of the map. Return the total coastline of ",
        { code: "map" },
        ", summed over every piece of land."
      ),
      example(
        "map = [[0,1,0,0],[1,1,1,0],[0,1,0,0],[1,1,0,0]]",
        "16",
        [
          { state: "7 land tiles", note: "7 × 4 = 28 sides in total" },
          { state: "6 touching pairs", note: "each shared side hides 2 sides" },
          { state: "28 − 12 = 16", note: "coastline that remains exposed" },
        ],
        "Counting exposed sides"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "map[i][j] is 0 or 1",
      "There may be any number of separate islands, including none.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["map"],
      returns: "int",
      functionName: "coastlineLength",
    },
    tests: [
      {
        input: "4\n0 1 0 0\n1 1 1 0\n0 1 0 0\n1 1 0 0",
        expected: "16",
        isSample: true,
      },
      { input: "2\n1 1\n1 1", expected: "8", isSample: true },
      { input: "1\n1 0 1", expected: "8", isSample: true },
      { input: "1\n1", expected: "4" },
      { input: "1\n0", expected: "0" },
      { input: "2\n0 0 0\n0 0 0", expected: "0" },
      { input: "3\n1 1 1\n1 0 1\n1 1 1", expected: "16" },
      { input: "2\n1 0\n0 1", expected: "8" },
      {
        input:
          "50\n1 1 0 0 0 0 0 0 0 1 1 1 0 1 1 1 1 0 0 1 1 0 1 1 1 0 0 0 0 1 0 1 0 0 1 1 0 1 0 0 0 1 0 1 1 0 1 1 1 1\n1 1 1 1 0 0 0 1 1 1 0 1 1 0 1 0 1 1 0 0 0 1 0 0 0 0 1 1 0 1 0 0 1 0 1 0 0 0 0 1 0 0 1 0 1 0 1 1 0 0\n1 0 0 0 0 1 1 0 1 1 1 1 0 1 0 1 0 1 0 1 1 0 1 0 1 1 1 1 0 0 0 0 0 1 1 0 1 0 1 1 0 1 0 1 0 1 1 1 1 1\n1 0 0 1 1 0 1 0 1 0 0 1 0 1 1 1 1 1 0 0 0 0 1 0 0 1 0 0 1 0 1 0 1 0 0 1 0 0 1 1 0 1 1 1 0 0 1 1 1 0\n1 1 1 0 1 1 1 1 0 1 1 1 0 1 1 0 0 0 0 0 1 0 0 1 0 0 0 1 0 0 1 0 1 1 0 1 1 0 0 0 0 0 1 0 1 0 0 1 0 0\n1 0 1 1 0 0 1 0 0 0 0 0 1 1 0 1 1 0 1 1 0 0 1 1 0 1 0 1 1 1 0 0 1 1 1 1 1 1 1 1 1 0 1 1 1 0 0 0 1 1\n1 1 1 0 1 0 1 0 0 1 1 1 0 0 1 0 1 0 0 0 1 0 1 1 0 0 0 0 0 1 1 1 1 0 0 1 0 1 1 0 1 1 1 0 0 1 0 1 0 1\n0 0 0 1 0 0 1 1 0 1 0 0 0 1 1 0 1 0 1 1 0 0 0 1 1 1 1 0 1 0 1 1 0 0 1 1 0 0 0 1 1 0 1 1 1 0 0 1 0 0\n1 1 0 0 1 0 0 1 0 0 1 1 0 1 0 1 1 0 0 0 0 1 0 1 0 0 1 0 1 0 1 0 0 1 0 0 0 1 1 1 0 0 0 1 0 0 0 0 0 1\n0 1 0 0 1 0 1 1 0 0 1 0 1 1 0 1 0 0 0 1 1 0 1 0 1 1 0 1 1 0 1 0 1 1 1 1 1 1 0 1 0 1 0 1 0 0 1 1 0 0\n0 0 0 1 0 0 0 1 0 1 0 0 1 0 1 0 0 0 0 0 1 0 1 0 1 1 0 0 1 0 0 0 1 1 1 1 0 0 0 0 0 0 0 0 1 1 0 1 1 1\n1 1 0 0 0 1 1 0 0 1 0 1 1 1 1 1 0 1 1 0 1 0 0 0 0 1 1 1 1 1 1 0 0 0 1 0 0 0 0 1 0 0 1 0 0 1 0 0 1 0\n1 1 1 0 1 0 1 0 1 0 0 1 0 0 0 1 1 1 0 1 0 1 0 1 1 1 1 1 0 0 0 0 0 0 0 0 0 1 1 0 1 1 1 0 0 0 0 0 1 1\n0 1 1 0 0 1 0 1 0 0 1 1 1 0 0 0 0 0 0 1 1 1 1 0 1 0 1 0 0 0 0 1 0 1 1 0 1 0 1 1 1 0 0 1 1 1 0 1 0 0\n1 1 0 1 1 0 1 1 0 0 0 0 0 0 0 1 0 0 1 0 0 0 1 1 0 1 0 0 1 0 0 0 1 0 0 0 1 1 0 0 1 0 1 1 0 1 1 0 1 1\n1 1 0 1 0 1 0 1 0 0 1 1 1 0 0 0 0 1 1 1 0 1 1 1 0 0 0 1 1 0 1 0 1 0 0 1 1 0 1 0 0 1 1 0 0 0 1 0 0 1\n1 1 1 1 0 1 0 0 1 0 1 1 0 1 0 1 1 0 1 1 0 1 1 1 1 0 0 0 0 1 0 0 1 1 0 1 0 1 0 1 0 0 1 1 0 0 1 0 1 1\n1 0 0 0 0 1 0 1 1 0 1 0 0 1 0 1 0 0 0 1 0 1 1 1 0 1 1 0 1 0 1 0 0 1 0 0 0 1 1 0 1 1 0 0 0 1 0 0 1 1\n0 0 0 1 1 0 0 1 1 1 0 0 0 1 1 1 0 1 0 1 0 1 1 1 1 0 0 1 1 1 0 0 1 1 1 1 1 1 0 0 1 1 1 1 0 0 1 0 1 0\n1 0 0 0 1 0 1 0 1 0 0 1 1 1 1 0 1 1 0 1 0 0 1 1 0 1 1 1 0 0 0 1 0 1 1 1 1 1 0 1 0 1 1 1 0 1 1 1 0 0\n0 0 0 0 1 1 0 1 0 1 1 1 1 0 0 1 1 0 1 1 0 0 0 1 0 1 1 0 1 0 0 0 0 1 1 1 0 1 1 1 0 1 1 1 0 0 0 1 0 1\n1 1 0 0 1 0 1 0 0 1 0 1 0 0 1 0 0 0 0 1 1 1 0 1 0 0 0 0 0 0 0 0 1 1 1 0 1 1 0 0 1 1 1 0 1 0 0 0 0 1\n0 0 0 1 0 0 0 1 0 0 1 1 1 1 0 1 0 0 1 0 0 0 1 0 0 0 1 0 1 0 1 1 0 0 0 1 0 1 1 0 0 0 1 1 0 1 0 1 1 0\n0 1 1 0 1 1 1 0 1 0 1 0 1 1 0 0 1 0 1 0 1 0 0 1 1 0 1 0 0 0 1 1 0 0 1 1 0 1 1 1 1 0 1 1 0 0 1 0 0 1\n1 0 1 1 1 1 0 0 0 1 1 0 1 1 0 0 1 0 0 1 0 1 0 1 0 0 1 1 0 1 0 1 1 1 0 1 1 1 1 0 1 0 0 0 1 1 0 1 1 0\n1 0 0 1 1 1 1 1 1 0 1 0 0 0 0 1 1 0 0 0 1 1 1 1 1 1 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0 1 0 1 0 0 1 0 0 1\n1 0 0 1 0 1 1 0 1 1 1 0 1 1 0 1 0 0 0 1 0 0 1 1 0 1 1 1 0 1 0 1 0 1 1 0 1 0 0 0 1 1 0 0 1 0 0 1 1 1\n1 0 1 0 0 1 1 0 1 1 0 1 0 0 1 1 0 0 1 0 0 1 0 0 0 0 0 0 0 1 0 0 1 1 1 0 0 0 0 0 1 0 1 1 0 0 1 0 1 1\n1 1 1 1 1 1 0 1 0 1 0 0 0 1 1 1 1 0 1 1 1 0 1 1 0 0 1 1 0 1 1 0 1 0 1 0 0 0 1 1 0 1 0 0 1 1 1 0 0 1\n0 1 0 0 1 0 0 0 1 1 1 1 1 0 0 0 0 0 1 0 1 0 0 1 1 1 1 0 1 0 1 1 1 1 1 1 0 0 1 0 0 1 0 1 0 0 0 0 0 0\n0 0 0 0 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 0 0 1 1 1 0 1 0 1 1 1 1 0 0 0 0 0 1 1 1 0 1 1 0\n0 1 1 1 1 0 0 1 1 1 0 1 0 1 0 1 1 0 1 1 1 0 1 0 1 1 0 1 1 0 1 0 1 0 1 0 1 1 1 0 1 1 0 0 0 1 0 1 0 0\n0 0 0 0 0 0 0 0 1 0 1 1 0 0 1 0 0 1 1 0 0 1 1 0 0 1 0 0 0 1 1 0 1 0 1 0 0 1 0 1 1 1 0 0 0 1 1 1 0 0\n0 1 1 0 1 1 0 0 0 0 0 0 1 1 0 0 0 1 0 1 0 0 1 1 0 0 1 0 1 1 0 1 1 0 1 1 0 1 1 1 1 1 0 1 1 0 0 0 0 0\n0 0 1 0 1 0 0 0 1 1 0 1 0 0 0 0 0 0 0 0 1 1 0 1 1 1 0 1 0 1 1 0 0 0 0 1 1 0 0 1 1 0 1 1 1 1 0 0 0 1\n1 0 1 0 1 0 0 0 0 1 1 0 0 1 0 0 0 0 0 1 1 1 0 1 0 0 0 1 1 1 0 0 1 0 0 0 1 0 0 1 0 1 1 1 0 0 0 1 0 0\n0 0 0 1 0 1 0 1 0 0 0 0 1 1 1 1 0 1 1 1 0 0 0 0 0 0 1 0 1 1 1 0 1 1 0 1 1 0 1 0 1 1 0 0 0 0 0 0 0 1\n0 0 1 0 1 0 0 1 0 0 0 1 0 0 1 0 1 1 1 1 1 1 0 0 0 0 0 1 1 0 1 0 0 1 1 0 0 0 0 0 0 0 1 1 1 1 0 0 1 0\n0 0 0 0 1 0 0 0 0 1 0 0 1 0 0 0 1 1 0 1 0 0 0 1 0 1 0 1 0 0 0 1 1 0 0 1 0 0 0 1 1 0 1 1 1 0 1 1 1 1\n0 0 1 0 1 0 1 0 0 0 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 0 0 0 1 1 1 1 0 0 1 0 1 0 1 0 1 0 1 0 1 0 1 1 1 1\n1 0 0 1 0 0 0 1 1 1 0 0 0 1 0 1 0 0 1 1 0 1 1 0 0 1 0 0 1 0 1 1 1 0 0 1 0 0 1 0 0 0 1 1 0 0 1 1 0 1\n1 0 1 0 1 1 1 1 1 1 0 1 0 0 1 1 0 0 0 0 0 0 1 1 0 1 1 1 1 0 0 1 1 1 0 1 1 1 0 0 1 1 1 1 0 0 0 1 1 0\n1 0 0 0 0 1 1 0 1 1 1 0 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 0 1 0 1 1 1 0 0 0 1 1 0 0 1 0 0 0 0 0 1\n1 1 1 0 1 1 0 0 1 1 0 0 0 0 1 1 0 1 0 1 1 1 0 0 0 0 1 1 0 0 0 0 1 0 1 1 1 1 1 1 0 0 0 0 0 1 1 0 1 1\n0 1 1 0 1 1 1 0 1 1 0 1 1 0 1 1 0 0 0 0 1 1 1 0 0 1 0 1 0 1 0 1 1 0 1 0 1 1 0 0 1 1 0 1 1 0 1 0 0 0\n1 1 0 0 0 1 1 1 0 0 1 1 1 1 0 0 1 0 0 1 0 1 0 1 1 0 1 1 1 0 0 0 0 0 0 1 0 1 0 0 1 1 1 1 0 1 1 1 0 1\n1 0 1 0 1 0 0 1 1 1 1 0 1 1 1 1 0 1 0 1 1 1 1 0 1 1 1 1 0 0 1 0 1 0 0 0 1 1 0 1 1 1 1 1 1 0 1 0 0 0\n1 0 0 0 1 0 1 0 0 0 0 1 1 1 1 1 1 1 1 0 0 0 0 1 1 0 0 0 0 0 0 1 0 0 0 0 1 0 0 1 1 1 1 0 1 1 0 1 1 1\n0 0 1 0 0 1 0 0 0 0 1 1 0 1 1 0 1 0 0 0 1 1 1 0 1 0 1 0 0 0 1 0 0 1 0 0 0 0 0 0 0 1 1 1 0 0 1 0 0 0\n1 1 0 1 1 0 1 0 1 0 0 0 0 1 0 1 1 1 1 1 1 1 1 1 0 0 1 0 1 1 0 0 0 1 1 0 0 1 1 0 0 0 1 1 1 1 0 0 0 0",
        expected: "2628",
      },
    ],
    hints: [
      "A single land tile on its own has 4 units of coastline. When does a side stop counting?",
      "A side is hidden exactly when the neighbour on that side is land.",
      "So for every land tile, count its neighbours that are water or off the map.",
      "Alternatively: 4 × land tiles, minus 2 for every pair of land tiles that share a side.",
    ],
    solutions: [
      {
        title: "Check all four sides of every land tile",
        order: 1,
        intuition:
          "Coastline is local: whether a side counts depends only on the tile next to it. So look at each land tile's four neighbours and count the ones that are water or beyond the map.",
        approach: [
          "Visit every tile.",
          "For a land tile, test each of the four directions.",
          "Count a side if the neighbour is off the map or holds 0.",
        ],
        code: {
          PYTHON: `def coastlineLength(map: List[List[int]]) -> int:
    rows, cols = len(map), len(map[0])
    total = 0
    for r in range(rows):
        for c in range(cols):
            if map[r][c] == 1:
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if not (0 <= nr < rows and 0 <= nc < cols) or map[nr][nc] == 0:
                        total += 1
    return total`,
          JAVA: `class Solution {
    public int coastlineLength(int[][] map) {
        int rows = map.length, cols = map[0].length, total = 0;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (map[r][c] != 1) continue;
                for (int[] s : steps) {
                    int nr = r + s[0], nc = c + s[1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols || map[nr][nc] == 0) total++;
                }
            }
        }
        return total;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A map with no land returns 0.",
          "Land on the border, whose outer sides face the sea.",
        ],
        commonMistakes: [
          "Skipping out-of-bounds neighbours instead of counting them as sea.",
        ],
      },
      {
        title: "Optimal: count tiles and shared sides",
        order: 2,
        intuition:
          "Every land tile brings four sides. Each pair of land tiles touching along a side hides exactly two of them, one from each tile. Only look right and down from each tile so each touching pair is counted once.",
        approach: [
          "Count land tiles and touching pairs in one scan.",
          "For a land tile, check only the tile below and the tile to the right.",
          "Return 4 × land − 2 × pairs.",
        ],
        code: {
          PYTHON: `def coastlineLength(map: List[List[int]]) -> int:
    rows, cols = len(map), len(map[0])
    land = shared = 0

    for r in range(rows):
        for c in range(cols):
            if map[r][c] == 1:
                land += 1
                # Look only down and right so each touching pair counts once.
                if r + 1 < rows and map[r + 1][c] == 1:
                    shared += 1
                if c + 1 < cols and map[r][c + 1] == 1:
                    shared += 1

    return 4 * land - 2 * shared`,
          JAVA: `class Solution {
    public int coastlineLength(int[][] map) {
        int rows = map.length, cols = map[0].length;
        int land = 0, shared = 0;
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (map[r][c] != 1) continue;
                land++;
                if (r + 1 < rows && map[r + 1][c] == 1) shared++;
                if (c + 1 < cols && map[r][c + 1] == 1) shared++;
            }
        }
        return 4 * land - 2 * shared;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "Diagonal land tiles share no side, so nothing is subtracted.",
          "A ring of land around a lake: the lake's shore counts as coastline too.",
        ],
        commonMistakes: [
          "Checking all four neighbours and still subtracting 2 per neighbour, which counts every pair twice.",
          "Subtracting 1 per shared side instead of 2.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(1)",
  },

  {
    slug: "route-exists",
    title: "Is There a Route?",
    difficulty: "EASY",
    learningObjective:
      "Answer a connectivity question with union-find, merging the two ends of every edge and comparing representatives.",
    topics: ["graphs"],
    patterns: ["union-find", "breadth-first-search"],
    statement: [
      rich(
        "A rural county has ",
        { code: "n" },
        " junctions numbered 0 to n − 1, joined by two-way roads. Each entry of ",
        { code: "roads" },
        " is a pair ",
        { code: "[a, b]" },
        " meaning a road runs between junctions a and b."
      ),
      rich(
        "A courier is at junction ",
        { code: "start" },
        " and must deliver to junction ",
        { code: "finish" },
        ". Return ",
        { code: "true" },
        " if some sequence of roads connects them."
      ),
      example(
        "n = 6, roads = [[0,1],[1,2],[3,4],[4,5]], start = 0, finish = 5",
        "false",
        [
          { state: "{0} {1} {2} {3} {4} {5}", note: "every junction starts alone" },
          {
            state: "{0,1,2} {3} {4} {5}",
            note: "roads 0–1 and 1–2 merge three junctions",
          },
          { state: "{0,1,2} {3,4,5}", note: "roads 3–4 and 4–5 merge the rest" },
          { state: "0 and 5 apart", note: "different groups, so no route" },
        ],
        "Merging junctions road by road"
      ),
    ],
    constraints: [
      "1 ≤ n ≤ 1000",
      "0 ≤ roads.length ≤ 1500",
      "0 ≤ a, b, start, finish < n",
      "Roads may repeat, and a road may loop from a junction to itself.",
    ],
    signature: {
      params: ["int", "int[][]", "int", "int"],
      paramNames: ["n", "roads", "start", "finish"],
      returns: "bool",
      functionName: "routeExists",
    },
    tests: [
      {
        input: "6\n4\n0 1\n1 2\n3 4\n4 5\n0\n2",
        expected: "true",
        isSample: true,
        explanation: "0 → 1 → 2.",
      },
      {
        input: "6\n4\n0 1\n1 2\n3 4\n4 5\n0\n5",
        expected: "false",
        isSample: true,
        explanation: "Nodes 0, 1, 2 and nodes 3, 4, 5 form two separate networks.",
      },
      {
        input: "1\n0\n0\n0",
        expected: "true",
        isSample: true,
        explanation: "Start and finish are the same junction.",
      },
      { input: "2\n0\n0\n1", expected: "false" },
      { input: "4\n3\n0 1\n1 0\n2 3\n1\n3", expected: "false" },
      { input: "5\n5\n0 1\n1 2\n2 0\n3 4\n2 3\n0\n4", expected: "true" },
      { input: "3\n1\n2 2\n0\n2", expected: "false" },
      {
        input:
          "1000\n1200\n411 24\n209 284\n64 320\n953 977\n185 156\n888 866\n75 468\n849 641\n568 950\n538 835\n473 483\n727 887\n505 797\n81 360\n591 619\n513 909\n5 19\n300 492\n3 273\n612 761\n184 290\n997 503\n628 943\n894 806\n621 895\n70 364\n216 22\n313 25\n299 103\n220 370\n409 449\n933 525\n971 572\n764 646\n180 6\n574 552\n91 0\n709 795\n785 849\n751 966\n29 424\n415 469\n90 396\n682 713\n268 52\n24 345\n998 701\n502 855\n710 555\n841 990\n49 300\n688 832\n137 372\n276 147\n484 72\n214 162\n220 151\n470 240\n413 71\n177 201\n68 160\n516 663\n363 381\n98 288\n447 243\n366 48\n916 821\n448 381\n832 715\n761 701\n340 467\n198 379\n338 256\n351 381\n664 659\n679 726\n217 370\n522 871\n132 383\n310 117\n343 235\n446 94\n681 832\n330 54\n815 514\n955 888\n974 606\n919 673\n542 686\n602 767\n816 975\n2 332\n552 560\n894 784\n24 304\n57 149\n363 224\n83 113\n226 185\n80 325\n608 709\n187 83\n799 723\n485 95\n753 657\n563 789\n899 842\n79 212\n561 812\n158 64\n118 194\n70 202\n882 513\n502 743\n510 760\n518 618\n523 722\n498 376\n238 346\n856 649\n827 917\n606 947\n990 504\n680 649\n599 740\n21 37\n390 177\n616 667\n68 257\n32 28\n718 704\n338 361\n238 325\n571 862\n830 674\n244 28\n493 496\n676 622\n202 2\n225 9\n329 44\n73 42\n937 775\n204 273\n71 296\n688 696\n917 785\n684 634\n156 463\n705 758\n177 331\n600 516\n620 620\n158 433\n73 464\n384 111\n548 768\n320 133\n58 57\n588 607\n47 343\n924 564\n706 902\n140 219\n415 17\n939 713\n759 866\n361 229\n492 200\n718 645\n158 273\n623 670\n671 726\n642 828\n18 483\n756 561\n446 34\n477 192\n537 861\n6 446\n676 850\n152 281\n247 52\n59 364\n204 127\n697 843\n14 477\n173 466\n876 649\n468 150\n13 166\n801 963\n186 82\n943 878\n508 830\n564 818\n191 75\n213 37\n198 262\n942 590\n505 627\n218 210\n998 650\n94 8\n277 397\n598 896\n156 127\n654 522\n246 410\n359 56\n691 924\n995 835\n607 878\n12 323\n380 75\n169 71\n414 75\n810 654\n419 66\n771 609\n61 153\n479 233\n305 261\n783 573\n234 5\n971 527\n502 975\n419 291\n896 804\n529 970\n731 630\n864 703\n105 355\n952 508\n830 787\n342 118\n566 699\n158 329\n392 374\n563 861\n91 77\n746 993\n299 33\n8 359\n434 470\n163 191\n3 240\n482 5\n211 393\n74 5\n855 900\n222 446\n566 658\n13 454\n255 90\n764 808\n971 506\n402 499\n133 365\n240 194\n495 137\n85 136\n352 301\n974 662\n932 769\n136 304\n461 477\n286 234\n408 36\n785 626\n197 110\n329 289\n293 47\n917 626\n978 788\n122 140\n386 438\n26 129\n96 41\n875 999\n758 622\n778 584\n576 879\n540 802\n480 313\n152 42\n464 433\n959 647\n798 807\n993 938\n775 935\n187 184\n315 390\n209 26\n601 574\n464 139\n92 46\n786 667\n307 271\n750 961\n647 687\n27 67\n878 519\n748 893\n148 199\n666 613\n98 251\n551 676\n845 726\n891 781\n632 987\n448 284\n370 262\n479 241\n633 980\n345 265\n842 878\n812 501\n203 450\n647 799\n314 302\n165 486\n765 826\n847 847\n892 915\n860 568\n162 481\n386 362\n341 348\n503 767\n582 538\n793 766\n663 504\n637 619\n627 575\n987 605\n392 66\n327 153\n761 630\n500 672\n395 40\n240 154\n212 461\n187 246\n656 831\n590 753\n796 989\n373 427\n976 865\n312 165\n757 782\n50 154\n554 998\n289 245\n265 147\n948 727\n452 297\n368 83\n5 123\n925 740\n481 447\n895 843\n384 81\n928 939\n498 359\n653 864\n844 527\n340 344\n726 688\n710 581\n769 666\n535 571\n611 534\n774 797\n424 105\n593 582\n325 99\n715 942\n748 670\n801 955\n196 369\n865 635\n810 942\n825 655\n445 187\n583 846\n730 942\n703 995\n891 729\n594 969\n569 551\n793 567\n420 223\n624 665\n806 805\n210 389\n365 57\n972 599\n471 320\n228 256\n882 511\n259 6\n881 668\n89 51\n885 792\n392 457\n145 449\n535 736\n282 366\n782 658\n935 688\n830 957\n573 922\n851 719\n949 959\n111 11\n95 314\n995 563\n204 328\n676 903\n935 897\n324 108\n786 787\n51 478\n134 354\n634 909\n168 327\n911 899\n941 597\n407 285\n682 545\n973 519\n381 363\n691 715\n583 574\n247 218\n997 638\n846 836\n808 646\n202 114\n326 324\n984 512\n831 865\n400 80\n844 931\n50 335\n494 460\n91 3\n779 798\n225 380\n836 896\n372 257\n251 370\n195 358\n157 239\n322 15\n104 344\n608 754\n3 167\n812 716\n930 785\n71 424\n83 21\n715 761\n836 556\n745 854\n696 681\n601 870\n448 15\n881 537\n145 227\n827 956\n508 589\n216 307\n722 568\n451 89\n955 922\n300 40\n950 724\n436 370\n939 598\n386 114\n219 295\n479 97\n719 611\n12 119\n508 599\n666 668\n199 414\n633 698\n36 143\n511 837\n751 992\n25 239\n104 386\n34 28\n100 322\n354 31\n532 638\n422 185\n650 509\n151 456\n700 858\n81 483\n736 932\n717 875\n744 739\n795 979\n473 99\n98 314\n954 646\n482 69\n346 220\n976 858\n387 419\n759 655\n449 307\n424 34\n685 987\n697 676\n124 17\n99 126\n257 386\n256 295\n831 878\n786 999\n848 538\n273 314\n482 381\n756 789\n147 140\n115 164\n459 227\n391 486\n232 92\n877 858\n93 306\n776 745\n985 507\n706 542\n320 157\n492 366\n982 929\n991 591\n222 276\n376 300\n382 395\n854 724\n442 26\n853 959\n67 422\n26 170\n37 425\n86 6\n470 321\n37 85\n5 45\n170 333\n663 962\n83 481\n850 508\n962 742\n185 322\n152 167\n795 556\n583 834\n561 874\n255 26\n687 678\n570 997\n210 372\n816 585\n30 465\n97 118\n35 226\n872 950\n55 161\n218 454\n443 473\n949 934\n874 705\n973 585\n150 145\n943 619\n967 523\n4 330\n493 365\n187 64\n460 194\n226 80\n255 351\n823 997\n769 544\n72 350\n364 462\n383 88\n342 39\n526 556\n234 14\n617 961\n96 51\n997 665\n564 596\n161 264\n575 607\n656 943\n101 99\n591 828\n41 20\n673 747\n694 509\n309 325\n380 44\n612 514\n192 379\n124 339\n786 965\n63 13\n179 138\n399 231\n479 464\n600 970\n127 123\n966 581\n118 266\n520 684\n625 896\n708 549\n828 536\n682 929\n391 30\n666 981\n812 947\n567 931\n173 478\n775 887\n78 344\n727 758\n790 564\n677 970\n264 42\n190 192\n952 941\n157 16\n150 145\n945 696\n538 909\n528 849\n913 706\n611 633\n344 437\n506 728\n464 250\n726 807\n182 203\n963 525\n803 865\n852 540\n673 502\n55 107\n738 577\n578 900\n302 432\n520 767\n532 744\n350 406\n845 890\n985 770\n492 85\n983 663\n711 609\n271 95\n346 382\n996 717\n29 216\n192 336\n74 89\n356 72\n887 638\n953 984\n565 701\n980 647\n880 703\n720 792\n167 50\n929 712\n376 349\n618 960\n986 921\n214 428\n449 395\n664 706\n587 930\n94 217\n927 709\n939 645\n976 502\n367 399\n823 851\n524 704\n311 101\n309 286\n64 435\n35 317\n17 429\n98 142\n87 44\n555 808\n951 955\n670 595\n295 8\n33 66\n702 854\n865 595\n189 24\n624 559\n230 122\n204 405\n115 34\n436 127\n751 758\n367 130\n853 551\n991 588\n202 311\n302 155\n418 314\n973 937\n355 281\n158 499\n260 340\n389 404\n26 330\n795 617\n53 492\n176 133\n898 952\n599 680\n831 699\n515 753\n231 485\n491 235\n555 827\n704 592\n944 818\n129 117\n531 604\n885 606\n274 263\n520 936\n304 368\n577 932\n885 946\n693 704\n33 87\n56 140\n766 835\n50 30\n301 407\n594 652\n735 615\n28 64\n861 576\n829 759\n134 17\n868 933\n387 459\n564 503\n6 278\n450 317\n298 249\n416 41\n498 235\n668 685\n106 250\n717 572\n404 73\n5 356\n249 135\n903 583\n343 420\n428 114\n951 811\n903 642\n812 774\n956 514\n818 823\n21 105\n331 63\n683 749\n168 169\n367 309\n494 39\n53 384\n352 361\n221 108\n66 335\n673 756\n920 951\n822 661\n954 958\n846 708\n903 856\n106 460\n537 585\n510 537\n552 683\n380 211\n747 688\n72 210\n27 96\n179 115\n279 288\n617 579\n906 782\n92 414\n989 759\n255 99\n592 655\n224 9\n446 208\n338 87\n393 205\n670 909\n615 699\n903 753\n456 391\n377 473\n791 976\n111 498\n236 13\n391 20\n644 616\n233 411\n164 223\n664 614\n256 246\n24 7\n301 81\n276 404\n859 766\n582 824\n293 177\n7 226\n126 85\n508 719\n784 652\n133 66\n980 713\n183 263\n767 871\n559 972\n473 274\n267 214\n841 786\n969 836\n71 499\n273 172\n486 348\n760 944\n668 918\n761 790\n929 558\n22 208\n274 481\n302 271\n558 923\n456 476\n617 664\n690 857\n913 677\n338 45\n189 106\n898 824\n737 631\n286 312\n470 403\n953 813\n725 631\n516 566\n800 588\n216 439\n859 816\n257 328\n216 294\n465 470\n567 983\n736 694\n584 958\n39 313\n69 132\n546 809\n152 322\n527 680\n322 184\n89 80\n103 230\n76 179\n921 882\n243 296\n466 456\n757 970\n284 172\n751 769\n158 303\n572 644\n551 978\n666 952\n256 130\n468 351\n87 184\n49 251\n819 636\n313 421\n953 555\n339 252\n785 956\n542 767\n511 565\n536 522\n59 374\n842 634\n328 20\n331 186\n160 337\n5 326\n707 902\n885 951\n514 561\n796 556\n872 981\n750 586\n74 330\n983 603\n663 507\n770 950\n758 931\n328 172\n777 680\n932 597\n366 223\n259 98\n758 963\n737 802\n451 71\n567 641\n87 454\n992 826\n580 709\n397 255\n171 159\n418 315\n713 811\n298 174\n690 611\n698 614\n304 153\n793 877\n871 875\n621 643\n436 247\n790 819\n759 875\n594 864\n837 602\n452 174\n750 750\n529 691\n765 500\n125 295\n952 630\n566 707\n21 271\n288 435\n657 709\n730 922\n446 68\n571 764\n701 845\n58 453\n94 439\n506 971\n946 578\n718 652\n204 489\n24 341\n877 949\n205 216\n63 323\n14 237\n719 558\n392 495\n498 64\n971 541\n792 913\n889 858\n971 568\n210 265\n274 56\n543 790\n725 794\n225 468\n247 114\n318 97\n494 26\n229 194\n508 939\n42 156\n541 590\n314 127\n72 495\n441 285\n681 545\n36 132\n429 1\n486 258\n577 773\n338 434\n954 538\n830 877\n307 228\n658 665\n559 617\n920 781\n146 232\n907 821\n834 826\n284 408\n33 285\n732 856\n404 191\n981 925\n497 363\n107 424\n479 401\n93 437\n39 403\n215 1\n143 170\n307 143\n807 731\n591 653\n262 407\n85 321\n578 886\n360 57\n941 959\n45 35\n690 774\n112 93\n889 530\n506 504\n549 545\n259 387\n709 946\n916 680\n867 682\n845 684\n992 818\n622 581\n13 205\n121 84\n493 210\n870 595\n658 774\n900 511\n894 611\n237 315\n240 151\n878 909\n361 381\n194 244\n852 905\n738 622\n209 422\n793 852\n411 94\n914 645\n992 707\n989 683\n104 292\n249 15\n800 673\n476 127\n393 104\n550 828\n608 634\n779 903\n9 52\n472 0\n862 972\n610 783\n0 499\n111 320\n362 276\n996 979\n481 419\n708 921\n735 740\n262 121\n435 267\n287 48\n932 922\n460 221\n37 343\n938 998\n676 610\n50 298\n607 966\n904 855\n113 357\n996 515\n230 467\n542 564\n474 283\n909 816\n393 461\n619 716\n173 383\n572 784\n241 336\n11 24\n48 81\n331 146\n69 382\n728 863\n756 509\n850 902\n231 313\n876 587\n790 816\n665 732\n125 422\n734 613\n801 573\n398 42\n486 492\n161 72\n58 230\n174 22\n488 210\n481 79\n830 690\n793 820\n165 475\n576 640\n147 237\n52 246\n565 868\n719 562\n962 703\n577 797\n387 306\n999 864\n687 741\n57 185\n773 696\n672 951\n964 667\n625 855\n777 832\n56 160\n64 349\n510 656\n751 863\n888 953\n223 68\n751 537\n396 267\n479 177\n851 897\n102 379\n732 964\n643 618\n665 591\n836 576\n12 370\n509 718\n54 317\n696 760\n787 729\n779 787\n158 185\n746 925\n763 845\n723 900\n613 903\n633 667\n417 456\n270 488\n844 895\n357 303\n930 681\n998 748\n960 820\n775 585\n626 946\n868 572\n830 765\n280 159\n3\n999",
        expected: "false",
      },
      {
        input:
          "1000\n1201\n411 24\n209 284\n64 320\n953 977\n185 156\n888 866\n75 468\n849 641\n568 950\n538 835\n473 483\n727 887\n505 797\n81 360\n591 619\n513 909\n5 19\n300 492\n3 273\n612 761\n184 290\n997 503\n628 943\n894 806\n621 895\n70 364\n216 22\n313 25\n299 103\n220 370\n409 449\n933 525\n971 572\n764 646\n180 6\n574 552\n91 0\n709 795\n785 849\n751 966\n29 424\n415 469\n90 396\n682 713\n268 52\n24 345\n998 701\n502 855\n710 555\n841 990\n49 300\n688 832\n137 372\n276 147\n484 72\n214 162\n220 151\n470 240\n413 71\n177 201\n68 160\n516 663\n363 381\n98 288\n447 243\n366 48\n916 821\n448 381\n832 715\n761 701\n340 467\n198 379\n338 256\n351 381\n664 659\n679 726\n217 370\n522 871\n132 383\n310 117\n343 235\n446 94\n681 832\n330 54\n815 514\n955 888\n974 606\n919 673\n542 686\n602 767\n816 975\n2 332\n552 560\n894 784\n24 304\n57 149\n363 224\n83 113\n226 185\n80 325\n608 709\n187 83\n799 723\n485 95\n753 657\n563 789\n899 842\n79 212\n561 812\n158 64\n118 194\n70 202\n882 513\n502 743\n510 760\n518 618\n523 722\n498 376\n238 346\n856 649\n827 917\n606 947\n990 504\n680 649\n599 740\n21 37\n390 177\n616 667\n68 257\n32 28\n718 704\n338 361\n238 325\n571 862\n830 674\n244 28\n493 496\n676 622\n202 2\n225 9\n329 44\n73 42\n937 775\n204 273\n71 296\n688 696\n917 785\n684 634\n156 463\n705 758\n177 331\n600 516\n620 620\n158 433\n73 464\n384 111\n548 768\n320 133\n58 57\n588 607\n47 343\n924 564\n706 902\n140 219\n415 17\n939 713\n759 866\n361 229\n492 200\n718 645\n158 273\n623 670\n671 726\n642 828\n18 483\n756 561\n446 34\n477 192\n537 861\n6 446\n676 850\n152 281\n247 52\n59 364\n204 127\n697 843\n14 477\n173 466\n876 649\n468 150\n13 166\n801 963\n186 82\n943 878\n508 830\n564 818\n191 75\n213 37\n198 262\n942 590\n505 627\n218 210\n998 650\n94 8\n277 397\n598 896\n156 127\n654 522\n246 410\n359 56\n691 924\n995 835\n607 878\n12 323\n380 75\n169 71\n414 75\n810 654\n419 66\n771 609\n61 153\n479 233\n305 261\n783 573\n234 5\n971 527\n502 975\n419 291\n896 804\n529 970\n731 630\n864 703\n105 355\n952 508\n830 787\n342 118\n566 699\n158 329\n392 374\n563 861\n91 77\n746 993\n299 33\n8 359\n434 470\n163 191\n3 240\n482 5\n211 393\n74 5\n855 900\n222 446\n566 658\n13 454\n255 90\n764 808\n971 506\n402 499\n133 365\n240 194\n495 137\n85 136\n352 301\n974 662\n932 769\n136 304\n461 477\n286 234\n408 36\n785 626\n197 110\n329 289\n293 47\n917 626\n978 788\n122 140\n386 438\n26 129\n96 41\n875 999\n758 622\n778 584\n576 879\n540 802\n480 313\n152 42\n464 433\n959 647\n798 807\n993 938\n775 935\n187 184\n315 390\n209 26\n601 574\n464 139\n92 46\n786 667\n307 271\n750 961\n647 687\n27 67\n878 519\n748 893\n148 199\n666 613\n98 251\n551 676\n845 726\n891 781\n632 987\n448 284\n370 262\n479 241\n633 980\n345 265\n842 878\n812 501\n203 450\n647 799\n314 302\n165 486\n765 826\n847 847\n892 915\n860 568\n162 481\n386 362\n341 348\n503 767\n582 538\n793 766\n663 504\n637 619\n627 575\n987 605\n392 66\n327 153\n761 630\n500 672\n395 40\n240 154\n212 461\n187 246\n656 831\n590 753\n796 989\n373 427\n976 865\n312 165\n757 782\n50 154\n554 998\n289 245\n265 147\n948 727\n452 297\n368 83\n5 123\n925 740\n481 447\n895 843\n384 81\n928 939\n498 359\n653 864\n844 527\n340 344\n726 688\n710 581\n769 666\n535 571\n611 534\n774 797\n424 105\n593 582\n325 99\n715 942\n748 670\n801 955\n196 369\n865 635\n810 942\n825 655\n445 187\n583 846\n730 942\n703 995\n891 729\n594 969\n569 551\n793 567\n420 223\n624 665\n806 805\n210 389\n365 57\n972 599\n471 320\n228 256\n882 511\n259 6\n881 668\n89 51\n885 792\n392 457\n145 449\n535 736\n282 366\n782 658\n935 688\n830 957\n573 922\n851 719\n949 959\n111 11\n95 314\n995 563\n204 328\n676 903\n935 897\n324 108\n786 787\n51 478\n134 354\n634 909\n168 327\n911 899\n941 597\n407 285\n682 545\n973 519\n381 363\n691 715\n583 574\n247 218\n997 638\n846 836\n808 646\n202 114\n326 324\n984 512\n831 865\n400 80\n844 931\n50 335\n494 460\n91 3\n779 798\n225 380\n836 896\n372 257\n251 370\n195 358\n157 239\n322 15\n104 344\n608 754\n3 167\n812 716\n930 785\n71 424\n83 21\n715 761\n836 556\n745 854\n696 681\n601 870\n448 15\n881 537\n145 227\n827 956\n508 589\n216 307\n722 568\n451 89\n955 922\n300 40\n950 724\n436 370\n939 598\n386 114\n219 295\n479 97\n719 611\n12 119\n508 599\n666 668\n199 414\n633 698\n36 143\n511 837\n751 992\n25 239\n104 386\n34 28\n100 322\n354 31\n532 638\n422 185\n650 509\n151 456\n700 858\n81 483\n736 932\n717 875\n744 739\n795 979\n473 99\n98 314\n954 646\n482 69\n346 220\n976 858\n387 419\n759 655\n449 307\n424 34\n685 987\n697 676\n124 17\n99 126\n257 386\n256 295\n831 878\n786 999\n848 538\n273 314\n482 381\n756 789\n147 140\n115 164\n459 227\n391 486\n232 92\n877 858\n93 306\n776 745\n985 507\n706 542\n320 157\n492 366\n982 929\n991 591\n222 276\n376 300\n382 395\n854 724\n442 26\n853 959\n67 422\n26 170\n37 425\n86 6\n470 321\n37 85\n5 45\n170 333\n663 962\n83 481\n850 508\n962 742\n185 322\n152 167\n795 556\n583 834\n561 874\n255 26\n687 678\n570 997\n210 372\n816 585\n30 465\n97 118\n35 226\n872 950\n55 161\n218 454\n443 473\n949 934\n874 705\n973 585\n150 145\n943 619\n967 523\n4 330\n493 365\n187 64\n460 194\n226 80\n255 351\n823 997\n769 544\n72 350\n364 462\n383 88\n342 39\n526 556\n234 14\n617 961\n96 51\n997 665\n564 596\n161 264\n575 607\n656 943\n101 99\n591 828\n41 20\n673 747\n694 509\n309 325\n380 44\n612 514\n192 379\n124 339\n786 965\n63 13\n179 138\n399 231\n479 464\n600 970\n127 123\n966 581\n118 266\n520 684\n625 896\n708 549\n828 536\n682 929\n391 30\n666 981\n812 947\n567 931\n173 478\n775 887\n78 344\n727 758\n790 564\n677 970\n264 42\n190 192\n952 941\n157 16\n150 145\n945 696\n538 909\n528 849\n913 706\n611 633\n344 437\n506 728\n464 250\n726 807\n182 203\n963 525\n803 865\n852 540\n673 502\n55 107\n738 577\n578 900\n302 432\n520 767\n532 744\n350 406\n845 890\n985 770\n492 85\n983 663\n711 609\n271 95\n346 382\n996 717\n29 216\n192 336\n74 89\n356 72\n887 638\n953 984\n565 701\n980 647\n880 703\n720 792\n167 50\n929 712\n376 349\n618 960\n986 921\n214 428\n449 395\n664 706\n587 930\n94 217\n927 709\n939 645\n976 502\n367 399\n823 851\n524 704\n311 101\n309 286\n64 435\n35 317\n17 429\n98 142\n87 44\n555 808\n951 955\n670 595\n295 8\n33 66\n702 854\n865 595\n189 24\n624 559\n230 122\n204 405\n115 34\n436 127\n751 758\n367 130\n853 551\n991 588\n202 311\n302 155\n418 314\n973 937\n355 281\n158 499\n260 340\n389 404\n26 330\n795 617\n53 492\n176 133\n898 952\n599 680\n831 699\n515 753\n231 485\n491 235\n555 827\n704 592\n944 818\n129 117\n531 604\n885 606\n274 263\n520 936\n304 368\n577 932\n885 946\n693 704\n33 87\n56 140\n766 835\n50 30\n301 407\n594 652\n735 615\n28 64\n861 576\n829 759\n134 17\n868 933\n387 459\n564 503\n6 278\n450 317\n298 249\n416 41\n498 235\n668 685\n106 250\n717 572\n404 73\n5 356\n249 135\n903 583\n343 420\n428 114\n951 811\n903 642\n812 774\n956 514\n818 823\n21 105\n331 63\n683 749\n168 169\n367 309\n494 39\n53 384\n352 361\n221 108\n66 335\n673 756\n920 951\n822 661\n954 958\n846 708\n903 856\n106 460\n537 585\n510 537\n552 683\n380 211\n747 688\n72 210\n27 96\n179 115\n279 288\n617 579\n906 782\n92 414\n989 759\n255 99\n592 655\n224 9\n446 208\n338 87\n393 205\n670 909\n615 699\n903 753\n456 391\n377 473\n791 976\n111 498\n236 13\n391 20\n644 616\n233 411\n164 223\n664 614\n256 246\n24 7\n301 81\n276 404\n859 766\n582 824\n293 177\n7 226\n126 85\n508 719\n784 652\n133 66\n980 713\n183 263\n767 871\n559 972\n473 274\n267 214\n841 786\n969 836\n71 499\n273 172\n486 348\n760 944\n668 918\n761 790\n929 558\n22 208\n274 481\n302 271\n558 923\n456 476\n617 664\n690 857\n913 677\n338 45\n189 106\n898 824\n737 631\n286 312\n470 403\n953 813\n725 631\n516 566\n800 588\n216 439\n859 816\n257 328\n216 294\n465 470\n567 983\n736 694\n584 958\n39 313\n69 132\n546 809\n152 322\n527 680\n322 184\n89 80\n103 230\n76 179\n921 882\n243 296\n466 456\n757 970\n284 172\n751 769\n158 303\n572 644\n551 978\n666 952\n256 130\n468 351\n87 184\n49 251\n819 636\n313 421\n953 555\n339 252\n785 956\n542 767\n511 565\n536 522\n59 374\n842 634\n328 20\n331 186\n160 337\n5 326\n707 902\n885 951\n514 561\n796 556\n872 981\n750 586\n74 330\n983 603\n663 507\n770 950\n758 931\n328 172\n777 680\n932 597\n366 223\n259 98\n758 963\n737 802\n451 71\n567 641\n87 454\n992 826\n580 709\n397 255\n171 159\n418 315\n713 811\n298 174\n690 611\n698 614\n304 153\n793 877\n871 875\n621 643\n436 247\n790 819\n759 875\n594 864\n837 602\n452 174\n750 750\n529 691\n765 500\n125 295\n952 630\n566 707\n21 271\n288 435\n657 709\n730 922\n446 68\n571 764\n701 845\n58 453\n94 439\n506 971\n946 578\n718 652\n204 489\n24 341\n877 949\n205 216\n63 323\n14 237\n719 558\n392 495\n498 64\n971 541\n792 913\n889 858\n971 568\n210 265\n274 56\n543 790\n725 794\n225 468\n247 114\n318 97\n494 26\n229 194\n508 939\n42 156\n541 590\n314 127\n72 495\n441 285\n681 545\n36 132\n429 1\n486 258\n577 773\n338 434\n954 538\n830 877\n307 228\n658 665\n559 617\n920 781\n146 232\n907 821\n834 826\n284 408\n33 285\n732 856\n404 191\n981 925\n497 363\n107 424\n479 401\n93 437\n39 403\n215 1\n143 170\n307 143\n807 731\n591 653\n262 407\n85 321\n578 886\n360 57\n941 959\n45 35\n690 774\n112 93\n889 530\n506 504\n549 545\n259 387\n709 946\n916 680\n867 682\n845 684\n992 818\n622 581\n13 205\n121 84\n493 210\n870 595\n658 774\n900 511\n894 611\n237 315\n240 151\n878 909\n361 381\n194 244\n852 905\n738 622\n209 422\n793 852\n411 94\n914 645\n992 707\n989 683\n104 292\n249 15\n800 673\n476 127\n393 104\n550 828\n608 634\n779 903\n9 52\n472 0\n862 972\n610 783\n0 499\n111 320\n362 276\n996 979\n481 419\n708 921\n735 740\n262 121\n435 267\n287 48\n932 922\n460 221\n37 343\n938 998\n676 610\n50 298\n607 966\n904 855\n113 357\n996 515\n230 467\n542 564\n474 283\n909 816\n393 461\n619 716\n173 383\n572 784\n241 336\n11 24\n48 81\n331 146\n69 382\n728 863\n756 509\n850 902\n231 313\n876 587\n790 816\n665 732\n125 422\n734 613\n801 573\n398 42\n486 492\n161 72\n58 230\n174 22\n488 210\n481 79\n830 690\n793 820\n165 475\n576 640\n147 237\n52 246\n565 868\n719 562\n962 703\n577 797\n387 306\n999 864\n687 741\n57 185\n773 696\n672 951\n964 667\n625 855\n777 832\n56 160\n64 349\n510 656\n751 863\n888 953\n223 68\n751 537\n396 267\n479 177\n851 897\n102 379\n732 964\n643 618\n665 591\n836 576\n12 370\n509 718\n54 317\n696 760\n787 729\n779 787\n158 185\n746 925\n763 845\n723 900\n613 903\n633 667\n417 456\n270 488\n844 895\n357 303\n930 681\n998 748\n960 820\n775 585\n626 946\n868 572\n830 765\n280 159\n224 642\n7\n742",
        expected: "true",
      },
    ],
    hints: [
      "If start equals finish, the answer is immediate.",
      "One option: build an adjacency list and run a breadth-first search from start.",
      "Another: think of each junction as belonging to a group. A road merges the groups of its two ends.",
      "With union-find, after processing every road, start and finish are connected exactly when they have the same root.",
    ],
    solutions: [
      {
        title: "Breadth-first search from the start",
        order: 1,
        intuition:
          "Build an adjacency list and spread out from the start one road at a time. If the finish is ever discovered, a route exists.",
        approach: [
          "Build an adjacency list from the roads, adding each road in both directions.",
          "Run a breadth-first search from start with a visited array.",
          "Return whether finish was visited.",
        ],
        code: {
          PYTHON: `from collections import deque


def routeExists(n: int, roads: List[List[int]], start: int, finish: int) -> bool:
    neighbours = [[] for _ in range(n)]
    for a, b in roads:
        neighbours[a].append(b)
        neighbours[b].append(a)

    visited = [False] * n
    visited[start] = True
    queue = deque([start])
    while queue:
        node = queue.popleft()
        for nxt in neighbours[node]:
            if not visited[nxt]:
                visited[nxt] = True
                queue.append(nxt)

    return visited[finish]`,
          JAVA: `class Solution {
    public boolean routeExists(int n, int[][] roads, int start, int finish) {
        List<List<Integer>> neighbours = new ArrayList<>();
        for (int i = 0; i < n; i++) neighbours.add(new ArrayList<>());
        for (int[] road : roads) {
            neighbours.get(road[0]).add(road[1]);
            neighbours.get(road[1]).add(road[0]);
        }
        boolean[] visited = new boolean[n];
        visited[start] = true;
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        queue.add(start);
        while (!queue.isEmpty()) {
            int node = queue.poll();
            for (int next : neighbours.get(node)) {
                if (!visited[next]) {
                    visited[next] = true;
                    queue.add(next);
                }
            }
        }
        return visited[finish];
    }
}`,
        },
        timeComplexity: "O(n + roads)",
        spaceComplexity: "O(n + roads) for the adjacency list",
        edgeCases: ["start equals finish.", "No roads at all."],
        commonMistakes: [
          "Adding each road in only one direction, which turns two-way roads into one-way ones.",
        ],
      },
      {
        title: "Optimal: union-find",
        order: 2,
        intuition:
          "Connectivity does not need paths, only groups. Union-find keeps a parent pointer per junction; following parents leads to a group's root. Each road merges two roots. Path halving keeps the trees shallow, so no adjacency list is needed at all.",
        approach: [
          "Give every junction itself as parent.",
          "find(x): follow parents to the root, pointing each visited node at its grandparent along the way.",
          "For each road, attach the root of one end to the root of the other.",
          "Return whether start and finish share a root.",
        ],
        code: {
          PYTHON: `def routeExists(n: int, roads: List[List[int]], start: int, finish: int) -> bool:
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]  # path halving keeps trees shallow
            x = parent[x]
        return x

    for a, b in roads:
        parent[find(a)] = find(b)

    return find(start) == find(finish)`,
          JAVA: `class Solution {
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    public boolean routeExists(int n, int[][] roads, int start, int finish) {
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        for (int[] road : roads) parent[find(road[0])] = find(road[1]);
        return find(start) == find(finish);
    }
}`,
        },
        timeComplexity: "O((n + roads) · α(n)), effectively linear",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A self-loop road, which merges a junction with itself and changes nothing.",
          "Repeated roads between the same pair.",
          "A single junction where start and finish coincide.",
        ],
        commonMistakes: [
          "Setting parent[a] = b instead of linking the roots, which can split an existing group.",
          "Comparing parent[start] with parent[finish] directly instead of their roots.",
        ],
      },
    ],
    expectedTime: "O(n + roads)",
    expectedSpace: "O(n)",
  },

  {
    slug: "sorted-ledger-lookup",
    title: "Sorted Ledger Lookup",
    difficulty: "EASY",
    learningObjective:
      "Use the double sort order of a matrix to discard a whole row or column with every comparison.",
    topics: ["matrices"],
    patterns: ["two-pointers", "binary-search"],
    statement: [
      para(
        "An accounting tool keeps transaction amounts in a grid. Each row is sorted in increasing order from left to right, and each column is sorted in increasing order from top to bottom."
      ),
      rich(
        "Return ",
        { code: "true" },
        " if the amount ",
        { code: "target" },
        " appears anywhere in ",
        { code: "ledger" },
        ", and ",
        { code: "false" },
        " otherwise."
      ),
      example(
        "ledger = [[1,4,7,11],[2,5,8,12],[3,6,9,16],[10,13,14,17]], target = 9",
        "true",
        [
          {
            state: "(0,3) = 11",
            note: "11 > 9: the whole column below is bigger too — move left",
          },
          {
            state: "(0,2) = 7",
            note: "7 < 9: the whole row to the left is smaller too — move down",
          },
          { state: "(1,2) = 8", note: "8 < 9 — move down" },
          { state: "(2,2) = 9", note: "found" },
        ],
        "Starting from the top-right corner"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "-1000 ≤ ledger[i][j], target ≤ 1000",
      "Rows and columns are each strictly increasing.",
    ],
    signature: {
      params: ["int[][]", "int"],
      paramNames: ["ledger", "target"],
      returns: "bool",
      functionName: "ledgerContains",
    },
    tests: [
      {
        input: "4\n1 4 7 11\n2 5 8 12\n3 6 9 16\n10 13 14 17\n9",
        expected: "true",
        isSample: true,
      },
      {
        input: "4\n1 4 7 11\n2 5 8 12\n3 6 9 16\n10 13 14 17\n15",
        expected: "false",
        isSample: true,
      },
      { input: "1\n5\n5", expected: "true" },
      { input: "1\n5\n-3", expected: "false" },
      {
        input:
          "5\n1 4 7 11 15\n2 5 8 12 19\n3 6 9 16 22\n10 13 14 17 24\n18 21 23 26 30\n30",
        expected: "true",
      },
      {
        input:
          "5\n1 4 7 11 15\n2 5 8 12 19\n3 6 9 16 22\n10 13 14 17 24\n18 21 23 26 30\n18",
        expected: "true",
      },
      {
        input:
          "5\n1 4 7 11 15\n2 5 8 12 19\n3 6 9 16 22\n10 13 14 17 24\n18 21 23 26 30\n20",
        expected: "false",
      },
      {
        input:
          "5\n1 4 7 11 15\n2 5 8 12 19\n3 6 9 16 22\n10 13 14 17 24\n18 21 23 26 30\n0",
        expected: "false",
      },
      {
        input:
          "5\n1 4 7 11 15\n2 5 8 12 19\n3 6 9 16 22\n10 13 14 17 24\n18 21 23 26 30\n31",
        expected: "false",
      },
      { input: "1\n-5 -2 0 3 8\n-2", expected: "true" },
      { input: "4\n-5\n-2\n0\n3\n1", expected: "false" },
      {
        input:
          "50\n-499 -495 -494 -491 -488 -484 -483 -480 -477 -475 -471 -470 -466 -464 -461 -458 -454 -452 -449 -447 -444 -442 -441 -439 -438 -435 -433 -432 -429 -425 -423 -422 -421 -420 -419 -416 -413 -409 -408 -404 -401 -397 -394 -391 -389 -388 -385 -383 -381 -378\n-497 -493 -492 -490 -485 -480 -478 -476 -474 -472 -468 -467 -465 -462 -459 -456 -450 -448 -444 -442 -440 -439 -438 -434 -432 -428 -424 -420 -418 -417 -413 -409 -406 -405 -404 -403 -401 -399 -396 -395 -392 -388 -387 -383 -380 -378 -377 -376 -374 -370\n-496 -492 -488 -486 -481 -478 -474 -472 -468 -465 -462 -459 -458 -456 -454 -450 -447 -445 -443 -440 -439 -437 -434 -432 -428 -427 -423 -418 -415 -413 -409 -407 -404 -400 -398 -397 -396 -394 -391 -387 -386 -383 -381 -377 -375 -372 -371 -370 -367 -363\n-492 -489 -487 -485 -479 -475 -471 -469 -465 -462 -459 -456 -454 -452 -448 -444 -442 -438 -436 -432 -431 -428 -427 -426 -424 -421 -420 -417 -414 -412 -407 -403 -400 -398 -394 -392 -388 -384 -383 -382 -378 -376 -374 -373 -372 -369 -365 -361 -359 -357\n-491 -488 -484 -482 -478 -474 -467 -466 -463 -460 -457 -453 -450 -449 -447 -442 -439 -435 -431 -428 -426 -423 -421 -417 -414 -413 -412 -410 -406 -405 -404 -400 -397 -396 -393 -391 -385 -382 -378 -374 -372 -371 -367 -366 -362 -358 -356 -355 -354 -350\n-489 -486 -480 -476 -472 -471 -464 -461 -459 -458 -455 -452 -447 -445 -443 -439 -437 -433 -428 -424 -422 -418 -414 -410 -406 -402 -399 -398 -396 -392 -389 -386 -385 -384 -381 -377 -376 -373 -372 -371 -370 -369 -365 -362 -358 -355 -351 -347 -346 -345\n-485 -483 -476 -472 -471 -469 -463 -458 -455 -452 -448 -444 -441 -440 -438 -434 -433 -431 -425 -421 -420 -414 -411 -408 -404 -401 -397 -394 -390 -389 -385 -381 -378 -376 -374 -370 -369 -368 -365 -363 -362 -358 -357 -354 -351 -349 -348 -346 -345 -341\n-481 -477 -472 -468 -465 -464 -460 -456 -451 -449 -447 -442 -439 -435 -432 -428 -424 -423 -421 -419 -416 -410 -406 -402 -400 -396 -393 -390 -386 -382 -381 -380 -377 -374 -371 -367 -364 -360 -358 -357 -354 -353 -352 -350 -349 -348 -347 -344 -342 -338\n-478 -476 -469 -466 -462 -459 -456 -454 -450 -447 -443 -439 -436 -434 -428 -425 -422 -421 -420 -415 -414 -409 -402 -398 -396 -393 -389 -386 -384 -378 -374 -371 -367 -363 -360 -359 -358 -354 -352 -350 -346 -342 -338 -335 -332 -330 -326 -322 -321 -320\n-475 -473 -466 -462 -461 -457 -453 -450 -446 -445 -440 -438 -434 -433 -427 -422 -420 -419 -416 -412 -410 -406 -400 -395 -392 -390 -387 -382 -381 -376 -370 -367 -365 -362 -357 -354 -352 -350 -346 -342 -341 -340 -335 -333 -330 -327 -323 -318 -314 -312\n-472 -471 -465 -460 -457 -455 -452 -446 -443 -439 -435 -433 -432 -429 -424 -418 -417 -413 -410 -406 -405 -402 -396 -393 -389 -387 -383 -378 -377 -373 -367 -365 -361 -359 -353 -349 -345 -341 -338 -336 -333 -331 -327 -323 -322 -319 -318 -314 -310 -308\n-468 -467 -461 -459 -453 -451 -447 -445 -439 -438 -432 -430 -429 -426 -421 -416 -414 -409 -407 -404 -401 -399 -394 -391 -386 -383 -380 -377 -376 -369 -365 -363 -358 -356 -349 -345 -342 -340 -336 -334 -330 -329 -325 -319 -317 -313 -312 -310 -308 -307\n-467 -463 -460 -455 -450 -447 -445 -444 -435 -433 -430 -429 -425 -421 -419 -413 -409 -406 -405 -401 -397 -393 -391 -387 -384 -380 -378 -374 -373 -367 -362 -361 -355 -353 -345 -341 -337 -336 -334 -333 -327 -326 -321 -318 -314 -310 -306 -305 -303 -301\n-463 -461 -457 -453 -449 -446 -442 -440 -431 -428 -424 -421 -417 -415 -413 -412 -406 -403 -400 -397 -394 -391 -389 -386 -383 -378 -374 -372 -371 -365 -360 -356 -351 -348 -344 -337 -335 -331 -327 -324 -320 -319 -316 -312 -311 -307 -304 -303 -302 -298\n-462 -460 -456 -451 -447 -443 -440 -437 -430 -427 -420 -417 -413 -411 -408 -406 -402 -399 -396 -395 -393 -387 -386 -383 -382 -374 -372 -368 -364 -360 -356 -354 -350 -344 -343 -336 -334 -328 -323 -321 -318 -317 -313 -308 -307 -303 -300 -296 -294 -291\n-460 -457 -453 -448 -444 -440 -439 -433 -428 -423 -417 -416 -411 -410 -404 -401 -398 -394 -390 -389 -388 -384 -381 -380 -377 -371 -370 -366 -361 -358 -354 -352 -348 -340 -337 -333 -329 -326 -321 -319 -317 -316 -310 -307 -304 -301 -298 -294 -293 -290\n-457 -456 -452 -444 -440 -436 -435 -429 -427 -419 -416 -414 -408 -404 -402 -398 -397 -391 -386 -384 -380 -379 -376 -373 -372 -369 -368 -364 -359 -355 -352 -348 -345 -338 -336 -329 -326 -324 -319 -317 -316 -312 -306 -305 -301 -298 -294 -293 -292 -288\n-454 -453 -450 -441 -436 -433 -432 -425 -423 -417 -413 -412 -405 -401 -398 -395 -394 -387 -383 -382 -377 -373 -370 -369 -365 -361 -357 -353 -351 -348 -347 -346 -343 -336 -334 -326 -324 -323 -316 -315 -314 -309 -302 -300 -298 -294 -292 -291 -288 -285\n-452 -449 -445 -438 -434 -430 -426 -421 -417 -414 -409 -406 -401 -398 -395 -391 -390 -384 -382 -380 -375 -372 -367 -365 -364 -360 -354 -349 -345 -344 -341 -339 -336 -333 -330 -325 -320 -317 -314 -312 -311 -306 -299 -297 -293 -289 -286 -284 -281 -277\n-449 -447 -443 -434 -432 -427 -423 -420 -415 -411 -408 -403 -397 -395 -393 -390 -388 -380 -379 -377 -372 -371 -365 -362 -360 -356 -352 -346 -344 -341 -338 -337 -335 -329 -327 -324 -317 -316 -311 -308 -304 -301 -295 -292 -290 -287 -283 -281 -279 -276\n-446 -444 -441 -432 -431 -423 -421 -416 -414 -410 -405 -402 -394 -392 -390 -387 -383 -377 -376 -375 -369 -366 -361 -359 -358 -352 -350 -343 -342 -340 -334 -332 -331 -326 -324 -321 -313 -312 -307 -304 -300 -298 -293 -290 -288 -283 -281 -277 -276 -273\n-445 -441 -439 -431 -429 -421 -420 -414 -410 -406 -402 -399 -391 -388 -385 -381 -380 -376 -375 -372 -365 -362 -358 -354 -353 -349 -348 -341 -339 -335 -331 -327 -326 -322 -321 -320 -309 -305 -301 -298 -294 -291 -290 -286 -285 -280 -278 -276 -274 -270\n-442 -437 -435 -428 -426 -417 -415 -411 -407 -404 -400 -397 -389 -386 -382 -379 -375 -372 -369 -368 -361 -359 -354 -353 -350 -348 -347 -338 -336 -331 -328 -326 -323 -320 -316 -314 -305 -304 -299 -294 -293 -288 -285 -283 -280 -277 -274 -270 -266 -265\n-441 -434 -430 -425 -424 -416 -411 -407 -403 -402 -399 -393 -388 -382 -379 -376 -372 -370 -367 -363 -359 -356 -351 -347 -343 -339 -338 -334 -331 -330 -325 -324 -321 -318 -312 -311 -301 -298 -294 -293 -292 -285 -284 -282 -277 -275 -271 -266 -264 -262\n-438 -432 -428 -421 -418 -413 -409 -404 -400 -399 -397 -392 -384 -378 -374 -370 -367 -363 -360 -359 -358 -355 -349 -345 -339 -336 -334 -332 -329 -327 -321 -317 -313 -311 -310 -307 -298 -297 -290 -287 -286 -282 -280 -276 -275 -271 -267 -264 -263 -261\n-434 -430 -427 -420 -416 -410 -405 -403 -396 -392 -391 -390 -380 -377 -372 -367 -364 -361 -359 -358 -356 -351 -347 -342 -338 -335 -330 -329 -325 -321 -319 -316 -309 -308 -305 -301 -294 -293 -288 -283 -281 -280 -276 -273 -272 -269 -263 -260 -259 -258\n-430 -429 -425 -418 -414 -407 -402 -399 -394 -389 -387 -385 -379 -376 -368 -364 -360 -357 -355 -353 -352 -348 -343 -338 -335 -332 -329 -327 -321 -317 -315 -312 -308 -306 -302 -300 -290 -288 -284 -280 -279 -276 -272 -268 -266 -262 -260 -257 -254 -253\n-426 -423 -422 -415 -412 -403 -398 -394 -391 -387 -385 -381 -376 -373 -366 -361 -357 -356 -351 -348 -347 -343 -339 -337 -334 -328 -326 -323 -318 -314 -313 -309 -304 -300 -296 -293 -287 -286 -283 -278 -277 -275 -270 -266 -263 -258 -254 -250 -246 -245\n-424 -422 -421 -414 -410 -400 -394 -393 -389 -384 -381 -379 -375 -370 -363 -357 -356 -353 -348 -344 -343 -340 -337 -335 -333 -327 -324 -320 -314 -312 -308 -304 -300 -297 -292 -291 -283 -280 -276 -272 -269 -267 -263 -261 -259 -257 -253 -246 -245 -242\n-420 -417 -416 -412 -408 -396 -393 -389 -386 -382 -379 -376 -372 -367 -362 -353 -349 -348 -344 -343 -341 -337 -335 -332 -328 -325 -320 -317 -311 -310 -306 -303 -298 -294 -290 -288 -280 -279 -275 -269 -265 -263 -259 -257 -255 -252 -248 -243 -240 -238\n-419 -413 -411 -410 -405 -395 -391 -385 -381 -378 -376 -373 -369 -364 -360 -352 -348 -347 -340 -337 -335 -333 -332 -331 -326 -322 -316 -314 -310 -309 -305 -301 -295 -291 -287 -286 -276 -273 -270 -268 -261 -260 -257 -254 -252 -248 -247 -239 -238 -235\n-415 -409 -406 -405 -403 -393 -387 -381 -379 -377 -372 -370 -368 -360 -359 -349 -346 -344 -338 -334 -332 -329 -325 -323 -320 -318 -314 -312 -308 -305 -304 -300 -291 -289 -283 -279 -274 -270 -268 -264 -260 -257 -253 -250 -246 -243 -242 -238 -234 -232\n-413 -408 -404 -400 -396 -391 -386 -379 -377 -374 -371 -368 -364 -358 -356 -345 -343 -341 -334 -333 -329 -327 -322 -320 -316 -312 -310 -307 -306 -302 -300 -298 -289 -288 -279 -277 -272 -269 -266 -261 -256 -254 -250 -248 -244 -239 -236 -234 -231 -230\n-410 -407 -403 -399 -395 -388 -383 -375 -372 -368 -367 -365 -363 -355 -353 -343 -341 -340 -331 -327 -325 -321 -319 -318 -312 -311 -306 -303 -300 -298 -294 -293 -286 -282 -278 -276 -270 -265 -262 -257 -255 -251 -246 -243 -242 -236 -234 -230 -226 -224\n-407 -405 -401 -396 -393 -386 -380 -374 -371 -365 -363 -362 -358 -352 -351 -342 -338 -337 -330 -323 -320 -319 -317 -313 -310 -307 -302 -299 -295 -291 -290 -286 -284 -279 -276 -274 -269 -261 -260 -256 -253 -249 -244 -241 -240 -233 -232 -229 -224 -220\n-404 -402 -398 -395 -391 -382 -377 -372 -369 -364 -362 -358 -356 -348 -346 -340 -334 -331 -329 -321 -319 -318 -313 -309 -305 -304 -299 -297 -293 -289 -287 -282 -279 -278 -273 -269 -268 -257 -253 -249 -247 -244 -240 -239 -237 -232 -229 -226 -221 -218\n-400 -396 -393 -390 -388 -381 -376 -369 -368 -363 -361 -354 -350 -344 -342 -337 -333 -329 -325 -317 -315 -313 -311 -305 -302 -298 -294 -293 -289 -285 -283 -278 -274 -271 -267 -265 -261 -254 -252 -246 -245 -241 -237 -235 -232 -228 -224 -222 -219 -217\n-399 -392 -391 -388 -385 -377 -372 -367 -364 -359 -358 -350 -347 -341 -337 -335 -330 -327 -321 -315 -312 -310 -306 -304 -301 -294 -292 -289 -285 -281 -279 -277 -271 -268 -266 -264 -258 -251 -249 -242 -238 -234 -230 -229 -225 -222 -219 -215 -211 -207\n-397 -389 -386 -383 -381 -376 -368 -365 -361 -358 -356 -346 -343 -340 -336 -331 -327 -323 -320 -311 -309 -305 -302 -298 -295 -292 -289 -286 -284 -278 -276 -272 -268 -265 -261 -257 -254 -249 -245 -238 -237 -233 -228 -227 -223 -218 -217 -213 -207 -203\n-394 -388 -385 -382 -378 -372 -365 -362 -359 -356 -354 -344 -339 -337 -335 -328 -325 -321 -316 -308 -304 -303 -300 -295 -292 -291 -285 -283 -282 -275 -272 -268 -264 -260 -258 -254 -252 -246 -242 -236 -235 -229 -224 -223 -222 -216 -214 -210 -206 -199\n-390 -387 -384 -381 -377 -371 -361 -357 -354 -353 -351 -340 -336 -334 -331 -324 -322 -318 -314 -306 -301 -297 -295 -294 -291 -288 -284 -279 -278 -272 -269 -265 -263 -256 -254 -253 -249 -245 -240 -232 -230 -228 -220 -217 -216 -213 -210 -208 -204 -195\n-389 -383 -380 -378 -374 -368 -359 -356 -351 -347 -344 -337 -333 -331 -328 -321 -317 -314 -313 -305 -298 -296 -291 -288 -284 -281 -278 -274 -273 -268 -266 -261 -260 -253 -250 -248 -244 -241 -239 -228 -227 -225 -216 -213 -211 -207 -205 -203 -199 -192\n-385 -379 -377 -373 -369 -365 -356 -353 -350 -346 -343 -336 -329 -326 -322 -318 -315 -310 -307 -301 -296 -293 -287 -285 -282 -280 -275 -273 -272 -266 -262 -260 -256 -252 -248 -246 -242 -237 -235 -225 -224 -223 -213 -212 -207 -204 -200 -198 -196 -191\n-381 -377 -374 -370 -365 -363 -353 -350 -348 -342 -341 -334 -328 -324 -321 -314 -310 -308 -304 -297 -295 -289 -285 -282 -280 -276 -274 -269 -266 -264 -259 -256 -253 -251 -245 -242 -239 -234 -230 -222 -221 -219 -212 -208 -206 -202 -199 -197 -192 -188\n-380 -373 -370 -366 -361 -360 -350 -346 -343 -341 -339 -333 -326 -321 -319 -312 -308 -305 -300 -296 -292 -286 -282 -280 -276 -273 -271 -267 -262 -261 -255 -254 -251 -249 -244 -240 -235 -233 -229 -220 -216 -212 -208 -207 -205 -199 -195 -193 -189 -186\n-378 -369 -368 -365 -358 -356 -348 -344 -339 -338 -336 -329 -322 -319 -316 -308 -307 -304 -296 -294 -289 -283 -280 -276 -272 -271 -267 -263 -261 -260 -251 -250 -247 -246 -241 -237 -231 -230 -228 -219 -212 -211 -206 -205 -203 -196 -191 -187 -186 -182\n-375 -366 -363 -361 -357 -352 -345 -341 -338 -334 -331 -327 -320 -315 -311 -305 -302 -299 -293 -289 -285 -279 -276 -274 -271 -270 -266 -261 -260 -258 -249 -247 -243 -241 -240 -234 -230 -229 -225 -217 -210 -206 -203 -199 -198 -195 -190 -185 -182 -179\n-374 -364 -360 -356 -353 -350 -344 -340 -335 -332 -329 -326 -317 -313 -309 -302 -298 -295 -291 -285 -283 -275 -273 -271 -267 -266 -264 -260 -256 -254 -247 -244 -239 -238 -236 -233 -227 -223 -222 -215 -206 -205 -199 -195 -192 -191 -187 -181 -178 -177\n-373 -360 -359 -352 -350 -348 -343 -339 -331 -328 -327 -324 -313 -312 -306 -300 -296 -293 -289 -282 -279 -272 -271 -267 -266 -264 -261 -256 -253 -249 -244 -241 -237 -233 -229 -226 -222 -218 -215 -214 -205 -203 -198 -192 -190 -188 -185 -178 -175 -173\n-372 -356 -352 -351 -347 -346 -340 -335 -328 -326 -325 -323 -311 -308 -304 -296 -292 -288 -285 -280 -278 -270 -268 -266 -262 -259 -256 -253 -251 -245 -240 -238 -233 -231 -227 -225 -219 -214 -213 -211 -202 -200 -197 -189 -185 -183 -182 -176 -174 -172\n-347",
        expected: "true",
      },
      {
        input:
          "50\n-499 -495 -494 -491 -488 -484 -483 -480 -477 -475 -471 -470 -466 -464 -461 -458 -454 -452 -449 -447 -444 -442 -441 -439 -438 -435 -433 -432 -429 -425 -423 -422 -421 -420 -419 -416 -413 -409 -408 -404 -401 -397 -394 -391 -389 -388 -385 -383 -381 -378\n-497 -493 -492 -490 -485 -480 -478 -476 -474 -472 -468 -467 -465 -462 -459 -456 -450 -448 -444 -442 -440 -439 -438 -434 -432 -428 -424 -420 -418 -417 -413 -409 -406 -405 -404 -403 -401 -399 -396 -395 -392 -388 -387 -383 -380 -378 -377 -376 -374 -370\n-496 -492 -488 -486 -481 -478 -474 -472 -468 -465 -462 -459 -458 -456 -454 -450 -447 -445 -443 -440 -439 -437 -434 -432 -428 -427 -423 -418 -415 -413 -409 -407 -404 -400 -398 -397 -396 -394 -391 -387 -386 -383 -381 -377 -375 -372 -371 -370 -367 -363\n-492 -489 -487 -485 -479 -475 -471 -469 -465 -462 -459 -456 -454 -452 -448 -444 -442 -438 -436 -432 -431 -428 -427 -426 -424 -421 -420 -417 -414 -412 -407 -403 -400 -398 -394 -392 -388 -384 -383 -382 -378 -376 -374 -373 -372 -369 -365 -361 -359 -357\n-491 -488 -484 -482 -478 -474 -467 -466 -463 -460 -457 -453 -450 -449 -447 -442 -439 -435 -431 -428 -426 -423 -421 -417 -414 -413 -412 -410 -406 -405 -404 -400 -397 -396 -393 -391 -385 -382 -378 -374 -372 -371 -367 -366 -362 -358 -356 -355 -354 -350\n-489 -486 -480 -476 -472 -471 -464 -461 -459 -458 -455 -452 -447 -445 -443 -439 -437 -433 -428 -424 -422 -418 -414 -410 -406 -402 -399 -398 -396 -392 -389 -386 -385 -384 -381 -377 -376 -373 -372 -371 -370 -369 -365 -362 -358 -355 -351 -347 -346 -345\n-485 -483 -476 -472 -471 -469 -463 -458 -455 -452 -448 -444 -441 -440 -438 -434 -433 -431 -425 -421 -420 -414 -411 -408 -404 -401 -397 -394 -390 -389 -385 -381 -378 -376 -374 -370 -369 -368 -365 -363 -362 -358 -357 -354 -351 -349 -348 -346 -345 -341\n-481 -477 -472 -468 -465 -464 -460 -456 -451 -449 -447 -442 -439 -435 -432 -428 -424 -423 -421 -419 -416 -410 -406 -402 -400 -396 -393 -390 -386 -382 -381 -380 -377 -374 -371 -367 -364 -360 -358 -357 -354 -353 -352 -350 -349 -348 -347 -344 -342 -338\n-478 -476 -469 -466 -462 -459 -456 -454 -450 -447 -443 -439 -436 -434 -428 -425 -422 -421 -420 -415 -414 -409 -402 -398 -396 -393 -389 -386 -384 -378 -374 -371 -367 -363 -360 -359 -358 -354 -352 -350 -346 -342 -338 -335 -332 -330 -326 -322 -321 -320\n-475 -473 -466 -462 -461 -457 -453 -450 -446 -445 -440 -438 -434 -433 -427 -422 -420 -419 -416 -412 -410 -406 -400 -395 -392 -390 -387 -382 -381 -376 -370 -367 -365 -362 -357 -354 -352 -350 -346 -342 -341 -340 -335 -333 -330 -327 -323 -318 -314 -312\n-472 -471 -465 -460 -457 -455 -452 -446 -443 -439 -435 -433 -432 -429 -424 -418 -417 -413 -410 -406 -405 -402 -396 -393 -389 -387 -383 -378 -377 -373 -367 -365 -361 -359 -353 -349 -345 -341 -338 -336 -333 -331 -327 -323 -322 -319 -318 -314 -310 -308\n-468 -467 -461 -459 -453 -451 -447 -445 -439 -438 -432 -430 -429 -426 -421 -416 -414 -409 -407 -404 -401 -399 -394 -391 -386 -383 -380 -377 -376 -369 -365 -363 -358 -356 -349 -345 -342 -340 -336 -334 -330 -329 -325 -319 -317 -313 -312 -310 -308 -307\n-467 -463 -460 -455 -450 -447 -445 -444 -435 -433 -430 -429 -425 -421 -419 -413 -409 -406 -405 -401 -397 -393 -391 -387 -384 -380 -378 -374 -373 -367 -362 -361 -355 -353 -345 -341 -337 -336 -334 -333 -327 -326 -321 -318 -314 -310 -306 -305 -303 -301\n-463 -461 -457 -453 -449 -446 -442 -440 -431 -428 -424 -421 -417 -415 -413 -412 -406 -403 -400 -397 -394 -391 -389 -386 -383 -378 -374 -372 -371 -365 -360 -356 -351 -348 -344 -337 -335 -331 -327 -324 -320 -319 -316 -312 -311 -307 -304 -303 -302 -298\n-462 -460 -456 -451 -447 -443 -440 -437 -430 -427 -420 -417 -413 -411 -408 -406 -402 -399 -396 -395 -393 -387 -386 -383 -382 -374 -372 -368 -364 -360 -356 -354 -350 -344 -343 -336 -334 -328 -323 -321 -318 -317 -313 -308 -307 -303 -300 -296 -294 -291\n-460 -457 -453 -448 -444 -440 -439 -433 -428 -423 -417 -416 -411 -410 -404 -401 -398 -394 -390 -389 -388 -384 -381 -380 -377 -371 -370 -366 -361 -358 -354 -352 -348 -340 -337 -333 -329 -326 -321 -319 -317 -316 -310 -307 -304 -301 -298 -294 -293 -290\n-457 -456 -452 -444 -440 -436 -435 -429 -427 -419 -416 -414 -408 -404 -402 -398 -397 -391 -386 -384 -380 -379 -376 -373 -372 -369 -368 -364 -359 -355 -352 -348 -345 -338 -336 -329 -326 -324 -319 -317 -316 -312 -306 -305 -301 -298 -294 -293 -292 -288\n-454 -453 -450 -441 -436 -433 -432 -425 -423 -417 -413 -412 -405 -401 -398 -395 -394 -387 -383 -382 -377 -373 -370 -369 -365 -361 -357 -353 -351 -348 -347 -346 -343 -336 -334 -326 -324 -323 -316 -315 -314 -309 -302 -300 -298 -294 -292 -291 -288 -285\n-452 -449 -445 -438 -434 -430 -426 -421 -417 -414 -409 -406 -401 -398 -395 -391 -390 -384 -382 -380 -375 -372 -367 -365 -364 -360 -354 -349 -345 -344 -341 -339 -336 -333 -330 -325 -320 -317 -314 -312 -311 -306 -299 -297 -293 -289 -286 -284 -281 -277\n-449 -447 -443 -434 -432 -427 -423 -420 -415 -411 -408 -403 -397 -395 -393 -390 -388 -380 -379 -377 -372 -371 -365 -362 -360 -356 -352 -346 -344 -341 -338 -337 -335 -329 -327 -324 -317 -316 -311 -308 -304 -301 -295 -292 -290 -287 -283 -281 -279 -276\n-446 -444 -441 -432 -431 -423 -421 -416 -414 -410 -405 -402 -394 -392 -390 -387 -383 -377 -376 -375 -369 -366 -361 -359 -358 -352 -350 -343 -342 -340 -334 -332 -331 -326 -324 -321 -313 -312 -307 -304 -300 -298 -293 -290 -288 -283 -281 -277 -276 -273\n-445 -441 -439 -431 -429 -421 -420 -414 -410 -406 -402 -399 -391 -388 -385 -381 -380 -376 -375 -372 -365 -362 -358 -354 -353 -349 -348 -341 -339 -335 -331 -327 -326 -322 -321 -320 -309 -305 -301 -298 -294 -291 -290 -286 -285 -280 -278 -276 -274 -270\n-442 -437 -435 -428 -426 -417 -415 -411 -407 -404 -400 -397 -389 -386 -382 -379 -375 -372 -369 -368 -361 -359 -354 -353 -350 -348 -347 -338 -336 -331 -328 -326 -323 -320 -316 -314 -305 -304 -299 -294 -293 -288 -285 -283 -280 -277 -274 -270 -266 -265\n-441 -434 -430 -425 -424 -416 -411 -407 -403 -402 -399 -393 -388 -382 -379 -376 -372 -370 -367 -363 -359 -356 -351 -347 -343 -339 -338 -334 -331 -330 -325 -324 -321 -318 -312 -311 -301 -298 -294 -293 -292 -285 -284 -282 -277 -275 -271 -266 -264 -262\n-438 -432 -428 -421 -418 -413 -409 -404 -400 -399 -397 -392 -384 -378 -374 -370 -367 -363 -360 -359 -358 -355 -349 -345 -339 -336 -334 -332 -329 -327 -321 -317 -313 -311 -310 -307 -298 -297 -290 -287 -286 -282 -280 -276 -275 -271 -267 -264 -263 -261\n-434 -430 -427 -420 -416 -410 -405 -403 -396 -392 -391 -390 -380 -377 -372 -367 -364 -361 -359 -358 -356 -351 -347 -342 -338 -335 -330 -329 -325 -321 -319 -316 -309 -308 -305 -301 -294 -293 -288 -283 -281 -280 -276 -273 -272 -269 -263 -260 -259 -258\n-430 -429 -425 -418 -414 -407 -402 -399 -394 -389 -387 -385 -379 -376 -368 -364 -360 -357 -355 -353 -352 -348 -343 -338 -335 -332 -329 -327 -321 -317 -315 -312 -308 -306 -302 -300 -290 -288 -284 -280 -279 -276 -272 -268 -266 -262 -260 -257 -254 -253\n-426 -423 -422 -415 -412 -403 -398 -394 -391 -387 -385 -381 -376 -373 -366 -361 -357 -356 -351 -348 -347 -343 -339 -337 -334 -328 -326 -323 -318 -314 -313 -309 -304 -300 -296 -293 -287 -286 -283 -278 -277 -275 -270 -266 -263 -258 -254 -250 -246 -245\n-424 -422 -421 -414 -410 -400 -394 -393 -389 -384 -381 -379 -375 -370 -363 -357 -356 -353 -348 -344 -343 -340 -337 -335 -333 -327 -324 -320 -314 -312 -308 -304 -300 -297 -292 -291 -283 -280 -276 -272 -269 -267 -263 -261 -259 -257 -253 -246 -245 -242\n-420 -417 -416 -412 -408 -396 -393 -389 -386 -382 -379 -376 -372 -367 -362 -353 -349 -348 -344 -343 -341 -337 -335 -332 -328 -325 -320 -317 -311 -310 -306 -303 -298 -294 -290 -288 -280 -279 -275 -269 -265 -263 -259 -257 -255 -252 -248 -243 -240 -238\n-419 -413 -411 -410 -405 -395 -391 -385 -381 -378 -376 -373 -369 -364 -360 -352 -348 -347 -340 -337 -335 -333 -332 -331 -326 -322 -316 -314 -310 -309 -305 -301 -295 -291 -287 -286 -276 -273 -270 -268 -261 -260 -257 -254 -252 -248 -247 -239 -238 -235\n-415 -409 -406 -405 -403 -393 -387 -381 -379 -377 -372 -370 -368 -360 -359 -349 -346 -344 -338 -334 -332 -329 -325 -323 -320 -318 -314 -312 -308 -305 -304 -300 -291 -289 -283 -279 -274 -270 -268 -264 -260 -257 -253 -250 -246 -243 -242 -238 -234 -232\n-413 -408 -404 -400 -396 -391 -386 -379 -377 -374 -371 -368 -364 -358 -356 -345 -343 -341 -334 -333 -329 -327 -322 -320 -316 -312 -310 -307 -306 -302 -300 -298 -289 -288 -279 -277 -272 -269 -266 -261 -256 -254 -250 -248 -244 -239 -236 -234 -231 -230\n-410 -407 -403 -399 -395 -388 -383 -375 -372 -368 -367 -365 -363 -355 -353 -343 -341 -340 -331 -327 -325 -321 -319 -318 -312 -311 -306 -303 -300 -298 -294 -293 -286 -282 -278 -276 -270 -265 -262 -257 -255 -251 -246 -243 -242 -236 -234 -230 -226 -224\n-407 -405 -401 -396 -393 -386 -380 -374 -371 -365 -363 -362 -358 -352 -351 -342 -338 -337 -330 -323 -320 -319 -317 -313 -310 -307 -302 -299 -295 -291 -290 -286 -284 -279 -276 -274 -269 -261 -260 -256 -253 -249 -244 -241 -240 -233 -232 -229 -224 -220\n-404 -402 -398 -395 -391 -382 -377 -372 -369 -364 -362 -358 -356 -348 -346 -340 -334 -331 -329 -321 -319 -318 -313 -309 -305 -304 -299 -297 -293 -289 -287 -282 -279 -278 -273 -269 -268 -257 -253 -249 -247 -244 -240 -239 -237 -232 -229 -226 -221 -218\n-400 -396 -393 -390 -388 -381 -376 -369 -368 -363 -361 -354 -350 -344 -342 -337 -333 -329 -325 -317 -315 -313 -311 -305 -302 -298 -294 -293 -289 -285 -283 -278 -274 -271 -267 -265 -261 -254 -252 -246 -245 -241 -237 -235 -232 -228 -224 -222 -219 -217\n-399 -392 -391 -388 -385 -377 -372 -367 -364 -359 -358 -350 -347 -341 -337 -335 -330 -327 -321 -315 -312 -310 -306 -304 -301 -294 -292 -289 -285 -281 -279 -277 -271 -268 -266 -264 -258 -251 -249 -242 -238 -234 -230 -229 -225 -222 -219 -215 -211 -207\n-397 -389 -386 -383 -381 -376 -368 -365 -361 -358 -356 -346 -343 -340 -336 -331 -327 -323 -320 -311 -309 -305 -302 -298 -295 -292 -289 -286 -284 -278 -276 -272 -268 -265 -261 -257 -254 -249 -245 -238 -237 -233 -228 -227 -223 -218 -217 -213 -207 -203\n-394 -388 -385 -382 -378 -372 -365 -362 -359 -356 -354 -344 -339 -337 -335 -328 -325 -321 -316 -308 -304 -303 -300 -295 -292 -291 -285 -283 -282 -275 -272 -268 -264 -260 -258 -254 -252 -246 -242 -236 -235 -229 -224 -223 -222 -216 -214 -210 -206 -199\n-390 -387 -384 -381 -377 -371 -361 -357 -354 -353 -351 -340 -336 -334 -331 -324 -322 -318 -314 -306 -301 -297 -295 -294 -291 -288 -284 -279 -278 -272 -269 -265 -263 -256 -254 -253 -249 -245 -240 -232 -230 -228 -220 -217 -216 -213 -210 -208 -204 -195\n-389 -383 -380 -378 -374 -368 -359 -356 -351 -347 -344 -337 -333 -331 -328 -321 -317 -314 -313 -305 -298 -296 -291 -288 -284 -281 -278 -274 -273 -268 -266 -261 -260 -253 -250 -248 -244 -241 -239 -228 -227 -225 -216 -213 -211 -207 -205 -203 -199 -192\n-385 -379 -377 -373 -369 -365 -356 -353 -350 -346 -343 -336 -329 -326 -322 -318 -315 -310 -307 -301 -296 -293 -287 -285 -282 -280 -275 -273 -272 -266 -262 -260 -256 -252 -248 -246 -242 -237 -235 -225 -224 -223 -213 -212 -207 -204 -200 -198 -196 -191\n-381 -377 -374 -370 -365 -363 -353 -350 -348 -342 -341 -334 -328 -324 -321 -314 -310 -308 -304 -297 -295 -289 -285 -282 -280 -276 -274 -269 -266 -264 -259 -256 -253 -251 -245 -242 -239 -234 -230 -222 -221 -219 -212 -208 -206 -202 -199 -197 -192 -188\n-380 -373 -370 -366 -361 -360 -350 -346 -343 -341 -339 -333 -326 -321 -319 -312 -308 -305 -300 -296 -292 -286 -282 -280 -276 -273 -271 -267 -262 -261 -255 -254 -251 -249 -244 -240 -235 -233 -229 -220 -216 -212 -208 -207 -205 -199 -195 -193 -189 -186\n-378 -369 -368 -365 -358 -356 -348 -344 -339 -338 -336 -329 -322 -319 -316 -308 -307 -304 -296 -294 -289 -283 -280 -276 -272 -271 -267 -263 -261 -260 -251 -250 -247 -246 -241 -237 -231 -230 -228 -219 -212 -211 -206 -205 -203 -196 -191 -187 -186 -182\n-375 -366 -363 -361 -357 -352 -345 -341 -338 -334 -331 -327 -320 -315 -311 -305 -302 -299 -293 -289 -285 -279 -276 -274 -271 -270 -266 -261 -260 -258 -249 -247 -243 -241 -240 -234 -230 -229 -225 -217 -210 -206 -203 -199 -198 -195 -190 -185 -182 -179\n-374 -364 -360 -356 -353 -350 -344 -340 -335 -332 -329 -326 -317 -313 -309 -302 -298 -295 -291 -285 -283 -275 -273 -271 -267 -266 -264 -260 -256 -254 -247 -244 -239 -238 -236 -233 -227 -223 -222 -215 -206 -205 -199 -195 -192 -191 -187 -181 -178 -177\n-373 -360 -359 -352 -350 -348 -343 -339 -331 -328 -327 -324 -313 -312 -306 -300 -296 -293 -289 -282 -279 -272 -271 -267 -266 -264 -261 -256 -253 -249 -244 -241 -237 -233 -229 -226 -222 -218 -215 -214 -205 -203 -198 -192 -190 -188 -185 -178 -175 -173\n-372 -356 -352 -351 -347 -346 -340 -335 -328 -326 -325 -323 -311 -308 -304 -296 -292 -288 -285 -280 -278 -270 -268 -266 -262 -259 -256 -253 -251 -245 -240 -238 -233 -231 -227 -225 -219 -214 -213 -211 -202 -200 -197 -189 -185 -183 -182 -176 -174 -172\n-171",
        expected: "false",
      },
      {
        input:
          "50\n-499 -495 -494 -491 -488 -484 -483 -480 -477 -475 -471 -470 -466 -464 -461 -458 -454 -452 -449 -447 -444 -442 -441 -439 -438 -435 -433 -432 -429 -425 -423 -422 -421 -420 -419 -416 -413 -409 -408 -404 -401 -397 -394 -391 -389 -388 -385 -383 -381 -378\n-497 -493 -492 -490 -485 -480 -478 -476 -474 -472 -468 -467 -465 -462 -459 -456 -450 -448 -444 -442 -440 -439 -438 -434 -432 -428 -424 -420 -418 -417 -413 -409 -406 -405 -404 -403 -401 -399 -396 -395 -392 -388 -387 -383 -380 -378 -377 -376 -374 -370\n-496 -492 -488 -486 -481 -478 -474 -472 -468 -465 -462 -459 -458 -456 -454 -450 -447 -445 -443 -440 -439 -437 -434 -432 -428 -427 -423 -418 -415 -413 -409 -407 -404 -400 -398 -397 -396 -394 -391 -387 -386 -383 -381 -377 -375 -372 -371 -370 -367 -363\n-492 -489 -487 -485 -479 -475 -471 -469 -465 -462 -459 -456 -454 -452 -448 -444 -442 -438 -436 -432 -431 -428 -427 -426 -424 -421 -420 -417 -414 -412 -407 -403 -400 -398 -394 -392 -388 -384 -383 -382 -378 -376 -374 -373 -372 -369 -365 -361 -359 -357\n-491 -488 -484 -482 -478 -474 -467 -466 -463 -460 -457 -453 -450 -449 -447 -442 -439 -435 -431 -428 -426 -423 -421 -417 -414 -413 -412 -410 -406 -405 -404 -400 -397 -396 -393 -391 -385 -382 -378 -374 -372 -371 -367 -366 -362 -358 -356 -355 -354 -350\n-489 -486 -480 -476 -472 -471 -464 -461 -459 -458 -455 -452 -447 -445 -443 -439 -437 -433 -428 -424 -422 -418 -414 -410 -406 -402 -399 -398 -396 -392 -389 -386 -385 -384 -381 -377 -376 -373 -372 -371 -370 -369 -365 -362 -358 -355 -351 -347 -346 -345\n-485 -483 -476 -472 -471 -469 -463 -458 -455 -452 -448 -444 -441 -440 -438 -434 -433 -431 -425 -421 -420 -414 -411 -408 -404 -401 -397 -394 -390 -389 -385 -381 -378 -376 -374 -370 -369 -368 -365 -363 -362 -358 -357 -354 -351 -349 -348 -346 -345 -341\n-481 -477 -472 -468 -465 -464 -460 -456 -451 -449 -447 -442 -439 -435 -432 -428 -424 -423 -421 -419 -416 -410 -406 -402 -400 -396 -393 -390 -386 -382 -381 -380 -377 -374 -371 -367 -364 -360 -358 -357 -354 -353 -352 -350 -349 -348 -347 -344 -342 -338\n-478 -476 -469 -466 -462 -459 -456 -454 -450 -447 -443 -439 -436 -434 -428 -425 -422 -421 -420 -415 -414 -409 -402 -398 -396 -393 -389 -386 -384 -378 -374 -371 -367 -363 -360 -359 -358 -354 -352 -350 -346 -342 -338 -335 -332 -330 -326 -322 -321 -320\n-475 -473 -466 -462 -461 -457 -453 -450 -446 -445 -440 -438 -434 -433 -427 -422 -420 -419 -416 -412 -410 -406 -400 -395 -392 -390 -387 -382 -381 -376 -370 -367 -365 -362 -357 -354 -352 -350 -346 -342 -341 -340 -335 -333 -330 -327 -323 -318 -314 -312\n-472 -471 -465 -460 -457 -455 -452 -446 -443 -439 -435 -433 -432 -429 -424 -418 -417 -413 -410 -406 -405 -402 -396 -393 -389 -387 -383 -378 -377 -373 -367 -365 -361 -359 -353 -349 -345 -341 -338 -336 -333 -331 -327 -323 -322 -319 -318 -314 -310 -308\n-468 -467 -461 -459 -453 -451 -447 -445 -439 -438 -432 -430 -429 -426 -421 -416 -414 -409 -407 -404 -401 -399 -394 -391 -386 -383 -380 -377 -376 -369 -365 -363 -358 -356 -349 -345 -342 -340 -336 -334 -330 -329 -325 -319 -317 -313 -312 -310 -308 -307\n-467 -463 -460 -455 -450 -447 -445 -444 -435 -433 -430 -429 -425 -421 -419 -413 -409 -406 -405 -401 -397 -393 -391 -387 -384 -380 -378 -374 -373 -367 -362 -361 -355 -353 -345 -341 -337 -336 -334 -333 -327 -326 -321 -318 -314 -310 -306 -305 -303 -301\n-463 -461 -457 -453 -449 -446 -442 -440 -431 -428 -424 -421 -417 -415 -413 -412 -406 -403 -400 -397 -394 -391 -389 -386 -383 -378 -374 -372 -371 -365 -360 -356 -351 -348 -344 -337 -335 -331 -327 -324 -320 -319 -316 -312 -311 -307 -304 -303 -302 -298\n-462 -460 -456 -451 -447 -443 -440 -437 -430 -427 -420 -417 -413 -411 -408 -406 -402 -399 -396 -395 -393 -387 -386 -383 -382 -374 -372 -368 -364 -360 -356 -354 -350 -344 -343 -336 -334 -328 -323 -321 -318 -317 -313 -308 -307 -303 -300 -296 -294 -291\n-460 -457 -453 -448 -444 -440 -439 -433 -428 -423 -417 -416 -411 -410 -404 -401 -398 -394 -390 -389 -388 -384 -381 -380 -377 -371 -370 -366 -361 -358 -354 -352 -348 -340 -337 -333 -329 -326 -321 -319 -317 -316 -310 -307 -304 -301 -298 -294 -293 -290\n-457 -456 -452 -444 -440 -436 -435 -429 -427 -419 -416 -414 -408 -404 -402 -398 -397 -391 -386 -384 -380 -379 -376 -373 -372 -369 -368 -364 -359 -355 -352 -348 -345 -338 -336 -329 -326 -324 -319 -317 -316 -312 -306 -305 -301 -298 -294 -293 -292 -288\n-454 -453 -450 -441 -436 -433 -432 -425 -423 -417 -413 -412 -405 -401 -398 -395 -394 -387 -383 -382 -377 -373 -370 -369 -365 -361 -357 -353 -351 -348 -347 -346 -343 -336 -334 -326 -324 -323 -316 -315 -314 -309 -302 -300 -298 -294 -292 -291 -288 -285\n-452 -449 -445 -438 -434 -430 -426 -421 -417 -414 -409 -406 -401 -398 -395 -391 -390 -384 -382 -380 -375 -372 -367 -365 -364 -360 -354 -349 -345 -344 -341 -339 -336 -333 -330 -325 -320 -317 -314 -312 -311 -306 -299 -297 -293 -289 -286 -284 -281 -277\n-449 -447 -443 -434 -432 -427 -423 -420 -415 -411 -408 -403 -397 -395 -393 -390 -388 -380 -379 -377 -372 -371 -365 -362 -360 -356 -352 -346 -344 -341 -338 -337 -335 -329 -327 -324 -317 -316 -311 -308 -304 -301 -295 -292 -290 -287 -283 -281 -279 -276\n-446 -444 -441 -432 -431 -423 -421 -416 -414 -410 -405 -402 -394 -392 -390 -387 -383 -377 -376 -375 -369 -366 -361 -359 -358 -352 -350 -343 -342 -340 -334 -332 -331 -326 -324 -321 -313 -312 -307 -304 -300 -298 -293 -290 -288 -283 -281 -277 -276 -273\n-445 -441 -439 -431 -429 -421 -420 -414 -410 -406 -402 -399 -391 -388 -385 -381 -380 -376 -375 -372 -365 -362 -358 -354 -353 -349 -348 -341 -339 -335 -331 -327 -326 -322 -321 -320 -309 -305 -301 -298 -294 -291 -290 -286 -285 -280 -278 -276 -274 -270\n-442 -437 -435 -428 -426 -417 -415 -411 -407 -404 -400 -397 -389 -386 -382 -379 -375 -372 -369 -368 -361 -359 -354 -353 -350 -348 -347 -338 -336 -331 -328 -326 -323 -320 -316 -314 -305 -304 -299 -294 -293 -288 -285 -283 -280 -277 -274 -270 -266 -265\n-441 -434 -430 -425 -424 -416 -411 -407 -403 -402 -399 -393 -388 -382 -379 -376 -372 -370 -367 -363 -359 -356 -351 -347 -343 -339 -338 -334 -331 -330 -325 -324 -321 -318 -312 -311 -301 -298 -294 -293 -292 -285 -284 -282 -277 -275 -271 -266 -264 -262\n-438 -432 -428 -421 -418 -413 -409 -404 -400 -399 -397 -392 -384 -378 -374 -370 -367 -363 -360 -359 -358 -355 -349 -345 -339 -336 -334 -332 -329 -327 -321 -317 -313 -311 -310 -307 -298 -297 -290 -287 -286 -282 -280 -276 -275 -271 -267 -264 -263 -261\n-434 -430 -427 -420 -416 -410 -405 -403 -396 -392 -391 -390 -380 -377 -372 -367 -364 -361 -359 -358 -356 -351 -347 -342 -338 -335 -330 -329 -325 -321 -319 -316 -309 -308 -305 -301 -294 -293 -288 -283 -281 -280 -276 -273 -272 -269 -263 -260 -259 -258\n-430 -429 -425 -418 -414 -407 -402 -399 -394 -389 -387 -385 -379 -376 -368 -364 -360 -357 -355 -353 -352 -348 -343 -338 -335 -332 -329 -327 -321 -317 -315 -312 -308 -306 -302 -300 -290 -288 -284 -280 -279 -276 -272 -268 -266 -262 -260 -257 -254 -253\n-426 -423 -422 -415 -412 -403 -398 -394 -391 -387 -385 -381 -376 -373 -366 -361 -357 -356 -351 -348 -347 -343 -339 -337 -334 -328 -326 -323 -318 -314 -313 -309 -304 -300 -296 -293 -287 -286 -283 -278 -277 -275 -270 -266 -263 -258 -254 -250 -246 -245\n-424 -422 -421 -414 -410 -400 -394 -393 -389 -384 -381 -379 -375 -370 -363 -357 -356 -353 -348 -344 -343 -340 -337 -335 -333 -327 -324 -320 -314 -312 -308 -304 -300 -297 -292 -291 -283 -280 -276 -272 -269 -267 -263 -261 -259 -257 -253 -246 -245 -242\n-420 -417 -416 -412 -408 -396 -393 -389 -386 -382 -379 -376 -372 -367 -362 -353 -349 -348 -344 -343 -341 -337 -335 -332 -328 -325 -320 -317 -311 -310 -306 -303 -298 -294 -290 -288 -280 -279 -275 -269 -265 -263 -259 -257 -255 -252 -248 -243 -240 -238\n-419 -413 -411 -410 -405 -395 -391 -385 -381 -378 -376 -373 -369 -364 -360 -352 -348 -347 -340 -337 -335 -333 -332 -331 -326 -322 -316 -314 -310 -309 -305 -301 -295 -291 -287 -286 -276 -273 -270 -268 -261 -260 -257 -254 -252 -248 -247 -239 -238 -235\n-415 -409 -406 -405 -403 -393 -387 -381 -379 -377 -372 -370 -368 -360 -359 -349 -346 -344 -338 -334 -332 -329 -325 -323 -320 -318 -314 -312 -308 -305 -304 -300 -291 -289 -283 -279 -274 -270 -268 -264 -260 -257 -253 -250 -246 -243 -242 -238 -234 -232\n-413 -408 -404 -400 -396 -391 -386 -379 -377 -374 -371 -368 -364 -358 -356 -345 -343 -341 -334 -333 -329 -327 -322 -320 -316 -312 -310 -307 -306 -302 -300 -298 -289 -288 -279 -277 -272 -269 -266 -261 -256 -254 -250 -248 -244 -239 -236 -234 -231 -230\n-410 -407 -403 -399 -395 -388 -383 -375 -372 -368 -367 -365 -363 -355 -353 -343 -341 -340 -331 -327 -325 -321 -319 -318 -312 -311 -306 -303 -300 -298 -294 -293 -286 -282 -278 -276 -270 -265 -262 -257 -255 -251 -246 -243 -242 -236 -234 -230 -226 -224\n-407 -405 -401 -396 -393 -386 -380 -374 -371 -365 -363 -362 -358 -352 -351 -342 -338 -337 -330 -323 -320 -319 -317 -313 -310 -307 -302 -299 -295 -291 -290 -286 -284 -279 -276 -274 -269 -261 -260 -256 -253 -249 -244 -241 -240 -233 -232 -229 -224 -220\n-404 -402 -398 -395 -391 -382 -377 -372 -369 -364 -362 -358 -356 -348 -346 -340 -334 -331 -329 -321 -319 -318 -313 -309 -305 -304 -299 -297 -293 -289 -287 -282 -279 -278 -273 -269 -268 -257 -253 -249 -247 -244 -240 -239 -237 -232 -229 -226 -221 -218\n-400 -396 -393 -390 -388 -381 -376 -369 -368 -363 -361 -354 -350 -344 -342 -337 -333 -329 -325 -317 -315 -313 -311 -305 -302 -298 -294 -293 -289 -285 -283 -278 -274 -271 -267 -265 -261 -254 -252 -246 -245 -241 -237 -235 -232 -228 -224 -222 -219 -217\n-399 -392 -391 -388 -385 -377 -372 -367 -364 -359 -358 -350 -347 -341 -337 -335 -330 -327 -321 -315 -312 -310 -306 -304 -301 -294 -292 -289 -285 -281 -279 -277 -271 -268 -266 -264 -258 -251 -249 -242 -238 -234 -230 -229 -225 -222 -219 -215 -211 -207\n-397 -389 -386 -383 -381 -376 -368 -365 -361 -358 -356 -346 -343 -340 -336 -331 -327 -323 -320 -311 -309 -305 -302 -298 -295 -292 -289 -286 -284 -278 -276 -272 -268 -265 -261 -257 -254 -249 -245 -238 -237 -233 -228 -227 -223 -218 -217 -213 -207 -203\n-394 -388 -385 -382 -378 -372 -365 -362 -359 -356 -354 -344 -339 -337 -335 -328 -325 -321 -316 -308 -304 -303 -300 -295 -292 -291 -285 -283 -282 -275 -272 -268 -264 -260 -258 -254 -252 -246 -242 -236 -235 -229 -224 -223 -222 -216 -214 -210 -206 -199\n-390 -387 -384 -381 -377 -371 -361 -357 -354 -353 -351 -340 -336 -334 -331 -324 -322 -318 -314 -306 -301 -297 -295 -294 -291 -288 -284 -279 -278 -272 -269 -265 -263 -256 -254 -253 -249 -245 -240 -232 -230 -228 -220 -217 -216 -213 -210 -208 -204 -195\n-389 -383 -380 -378 -374 -368 -359 -356 -351 -347 -344 -337 -333 -331 -328 -321 -317 -314 -313 -305 -298 -296 -291 -288 -284 -281 -278 -274 -273 -268 -266 -261 -260 -253 -250 -248 -244 -241 -239 -228 -227 -225 -216 -213 -211 -207 -205 -203 -199 -192\n-385 -379 -377 -373 -369 -365 -356 -353 -350 -346 -343 -336 -329 -326 -322 -318 -315 -310 -307 -301 -296 -293 -287 -285 -282 -280 -275 -273 -272 -266 -262 -260 -256 -252 -248 -246 -242 -237 -235 -225 -224 -223 -213 -212 -207 -204 -200 -198 -196 -191\n-381 -377 -374 -370 -365 -363 -353 -350 -348 -342 -341 -334 -328 -324 -321 -314 -310 -308 -304 -297 -295 -289 -285 -282 -280 -276 -274 -269 -266 -264 -259 -256 -253 -251 -245 -242 -239 -234 -230 -222 -221 -219 -212 -208 -206 -202 -199 -197 -192 -188\n-380 -373 -370 -366 -361 -360 -350 -346 -343 -341 -339 -333 -326 -321 -319 -312 -308 -305 -300 -296 -292 -286 -282 -280 -276 -273 -271 -267 -262 -261 -255 -254 -251 -249 -244 -240 -235 -233 -229 -220 -216 -212 -208 -207 -205 -199 -195 -193 -189 -186\n-378 -369 -368 -365 -358 -356 -348 -344 -339 -338 -336 -329 -322 -319 -316 -308 -307 -304 -296 -294 -289 -283 -280 -276 -272 -271 -267 -263 -261 -260 -251 -250 -247 -246 -241 -237 -231 -230 -228 -219 -212 -211 -206 -205 -203 -196 -191 -187 -186 -182\n-375 -366 -363 -361 -357 -352 -345 -341 -338 -334 -331 -327 -320 -315 -311 -305 -302 -299 -293 -289 -285 -279 -276 -274 -271 -270 -266 -261 -260 -258 -249 -247 -243 -241 -240 -234 -230 -229 -225 -217 -210 -206 -203 -199 -198 -195 -190 -185 -182 -179\n-374 -364 -360 -356 -353 -350 -344 -340 -335 -332 -329 -326 -317 -313 -309 -302 -298 -295 -291 -285 -283 -275 -273 -271 -267 -266 -264 -260 -256 -254 -247 -244 -239 -238 -236 -233 -227 -223 -222 -215 -206 -205 -199 -195 -192 -191 -187 -181 -178 -177\n-373 -360 -359 -352 -350 -348 -343 -339 -331 -328 -327 -324 -313 -312 -306 -300 -296 -293 -289 -282 -279 -272 -271 -267 -266 -264 -261 -256 -253 -249 -244 -241 -237 -233 -229 -226 -222 -218 -215 -214 -205 -203 -198 -192 -190 -188 -185 -178 -175 -173\n-372 -356 -352 -351 -347 -346 -340 -335 -328 -326 -325 -323 -311 -308 -304 -296 -292 -288 -285 -280 -278 -270 -268 -266 -262 -259 -256 -253 -251 -245 -240 -238 -233 -231 -227 -225 -219 -214 -213 -211 -202 -200 -197 -189 -185 -183 -182 -176 -174 -172\n-334",
        expected: "true",
      },
    ],
    hints: [
      "Checking every cell works but ignores the ordering entirely.",
      "Each row is sorted, so a binary search per row is already faster.",
      "Look at the top-right corner. It is the largest in its row and the smallest in its column.",
      "If it is too big, its whole column is too big; if it is too small, its whole row is too small. Each comparison removes a row or a column.",
    ],
    solutions: [
      {
        title: "Binary search every row",
        order: 1,
        intuition:
          "Each row on its own is a sorted list, so a binary search finds or rules out the target in that row in logarithmic time. Doing it for every row uses only half of the available order.",
        approach: [
          "For each row, binary search for the target.",
          "Return true on the first hit; false if no row contains it.",
        ],
        code: {
          PYTHON: `def ledgerContains(ledger: List[List[int]], target: int) -> bool:
    for row in ledger:
        lo, hi = 0, len(row) - 1
        while lo <= hi:
            mid = (lo + hi) // 2
            if row[mid] == target:
                return True
            if row[mid] < target:
                lo = mid + 1
            else:
                hi = mid - 1
    return False`,
          JAVA: `class Solution {
    public boolean ledgerContains(int[][] ledger, int target) {
        for (int[] row : ledger) {
            int lo = 0, hi = row.length - 1;
            while (lo <= hi) {
                int mid = (lo + hi) >>> 1;
                if (row[mid] == target) return true;
                if (row[mid] < target) lo = mid + 1;
                else hi = mid - 1;
            }
        }
        return false;
    }
}`,
        },
        timeComplexity: "O(rows × log cols)",
        spaceComplexity: "O(1)",
        edgeCases: ["A 1×1 ledger."],
        commonMistakes: [
          "Stopping after the first row whose last value exceeds the target; later rows may still contain it.",
        ],
      },
      {
        title: "Optimal: staircase walk from the top-right corner",
        order: 2,
        intuition:
          "The top-right cell is special: everything left of it is smaller, everything below it is larger. Comparing the target with it therefore eliminates either the whole column (too big) or the whole row (too small). The remaining cells still form a grid with the same property, so repeat from its new top-right corner.",
        approach: [
          "Start at row 0 and the last column.",
          "If the value equals the target, return true.",
          "If it is greater, move one column left.",
          "If it is smaller, move one row down.",
          "Return false once you leave the grid.",
        ],
        code: {
          PYTHON: `def ledgerContains(ledger: List[List[int]], target: int) -> bool:
    r, c = 0, len(ledger[0]) - 1

    while r < len(ledger) and c >= 0:
        value = ledger[r][c]
        if value == target:
            return True
        if value > target:
            c -= 1  # everything below in this column is even larger
        else:
            r += 1  # everything left in this row is even smaller

    return False`,
          JAVA: `class Solution {
    public boolean ledgerContains(int[][] ledger, int target) {
        int r = 0, c = ledger[0].length - 1;
        while (r < ledger.length && c >= 0) {
            int value = ledger[r][c];
            if (value == target) return true;
            if (value > target) c--;
            else r++;
        }
        return false;
    }
}`,
        },
        timeComplexity: "O(rows + cols)",
        spaceComplexity: "O(1)",
        edgeCases: [
          "A target smaller than every amount, found missing after walking left along row 0.",
          "A target larger than every amount, found missing after walking down the last column.",
          "A single row or single column.",
        ],
        commonMistakes: [
          "Starting from the top-left corner, where both directions increase and nothing can be eliminated.",
          "Treating the grid as one flattened sorted list; the last value of a row can exceed the first of the next.",
        ],
      },
    ],
    expectedTime: "O(rows + cols)",
    expectedSpace: "O(1)",
  },

  {
    slug: "count-reefs",
    title: "Count the Reefs",
    difficulty: "MEDIUM",
    learningObjective:
      "Count connected components in a grid by launching one flood fill per unvisited cell and sinking everything it reaches.",
    topics: ["matrices", "graphs"],
    patterns: ["depth-first-search", "union-find"],
    statement: [
      para(
        "A marine survey divides a stretch of sea into square cells and marks each one as coral (1) or open water (0). Coral cells that touch along a side belong to the same reef; cells that only touch at a corner do not."
      ),
      rich("Return the number of separate reefs in ", { code: "chart" }, "."),
      example(
        "chart = [[1,1,0,0,1],[1,0,0,1,1],[0,0,1,0,0],[1,0,1,1,0]]",
        "4",
        [
          { state: "reef 1", note: "(0,0) (0,1) (1,0) — top-left" },
          { state: "reef 2", note: "(0,4) (1,3) (1,4) — top-right" },
          { state: "reef 3", note: "(2,2) (3,2) (3,3) — centre" },
          { state: "reef 4", note: "(3,0) — a single cell" },
        ],
        "Four reefs"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "chart[i][j] is 0 or 1",
      "Your function may modify chart.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["chart"],
      returns: "int",
      functionName: "countReefs",
    },
    tests: [
      {
        input: "4\n1 1 0 0 1\n1 0 0 1 1\n0 0 1 0 0\n1 0 1 1 0",
        expected: "4",
        isSample: true,
      },
      {
        input: "3\n1 0 1\n0 1 0\n1 0 1",
        expected: "5",
        isSample: true,
        explanation:
          "Diagonal neighbours do not join, so every reef cell stands alone.",
      },
      {
        input: "2\n0 0\n0 0",
        expected: "0",
        isSample: true,
        explanation: "Open water everywhere.",
      },
      { input: "1\n1", expected: "1" },
      { input: "1\n0", expected: "0" },
      { input: "2\n1 1 1\n1 1 1", expected: "1" },
      {
        input: "5\n1 1 1 1 1\n1 0 0 0 1\n1 0 1 0 1\n1 0 0 0 1\n1 1 1 1 1",
        expected: "2",
      },
      { input: "1\n1 0 1 0 1 0 1", expected: "4" },
      {
        input:
          "50\n0 1 0 0 1 1 1 0 0 0 1 0 1 0 0 0 1 1 0 0 0 1 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 1 1 0 1 0 0 1 0 1 1 1 1 0\n0 1 1 1 0 0 0 1 0 1 0 0 1 1 1 1 0 1 0 1 0 0 0 1 0 0 0 1 0 1 1 1 1 0 1 0 1 0 0 1 1 1 1 0 1 0 0 1 0 0\n1 0 0 0 1 0 1 0 0 0 0 0 0 1 0 0 1 0 1 1 1 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 1 1 1 0 0 0 0 0 0 1 0 1\n0 0 0 1 1 0 1 0 1 0 0 0 1 1 1 1 0 1 1 0 1 0 0 0 1 1 0 0 0 0 0 0 1 1 1 0 0 1 0 1 0 0 0 0 0 0 1 0 0 0\n0 1 1 0 1 0 0 1 1 1 0 0 0 1 0 1 0 0 1 0 0 0 1 1 1 0 0 0 1 0 0 0 1 0 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 1\n1 0 0 0 0 1 0 1 1 1 0 1 0 0 1 1 0 1 1 0 0 1 0 1 1 0 0 0 0 1 0 1 1 1 1 0 0 0 1 1 1 0 1 0 0 0 0 1 1 0\n1 0 1 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 1 1 0 0 1 1 0 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0\n0 1 1 1 1 0 1 0 1 0 1 1 1 0 1 1 1 1 0 0 0 0 0 0 0 0 1 1 1 1 1 0 1 0 0 0 1 0 1 1 0 1 0 1 1 0 0 0 0 1\n0 1 0 1 0 0 1 1 0 1 1 0 0 0 1 1 1 0 0 1 1 1 0 0 0 0 1 0 1 0 0 1 1 1 0 1 0 0 1 0 0 0 0 1 1 0 1 0 0 0\n1 0 0 1 1 0 0 1 1 0 1 0 0 0 0 1 0 1 0 0 1 0 0 0 0 0 0 0 1 1 0 1 0 1 1 0 1 0 0 1 0 1 0 1 0 1 0 0 0 1\n1 0 1 0 1 1 1 0 0 0 1 1 0 1 1 1 1 1 1 0 0 0 1 0 1 0 0 1 0 1 1 0 0 0 1 1 1 0 1 0 1 1 0 1 0 0 1 0 1 1\n0 0 1 0 0 1 1 1 1 0 0 1 1 1 1 0 1 0 0 1 1 0 0 0 1 0 0 0 1 1 0 0 1 0 1 1 1 1 0 0 0 1 1 0 1 0 1 0 0 0\n1 1 1 0 1 0 1 0 0 0 0 1 0 0 0 1 1 1 0 0 0 1 1 1 1 0 1 0 1 0 0 1 0 0 0 0 0 1 1 0 0 0 0 1 0 1 1 0 1 0\n0 1 0 1 0 0 0 0 0 0 0 1 1 1 0 0 1 1 0 0 1 1 1 0 1 0 0 0 0 0 0 1 0 0 0 1 1 1 1 0 0 1 0 1 0 1 1 0 1 0\n1 1 1 0 1 1 0 1 0 0 1 0 1 0 0 1 0 1 1 1 1 0 1 0 1 0 0 0 1 0 1 1 0 1 1 1 0 1 0 1 0 1 0 1 1 1 1 0 1 1\n0 1 1 1 0 1 1 0 0 0 0 1 1 0 0 0 0 0 1 1 1 1 1 0 0 1 1 0 1 0 0 1 1 1 0 0 1 0 1 0 1 1 0 0 0 1 0 1 1 1\n0 0 1 1 0 0 0 0 1 0 0 1 1 0 1 1 0 1 0 0 0 0 0 1 1 1 1 1 0 0 0 1 0 0 0 0 0 1 1 0 1 1 1 0 1 1 1 1 1 0\n1 1 0 0 0 1 0 0 0 1 0 0 1 0 0 0 0 1 0 1 1 0 1 0 0 1 0 0 1 1 0 0 0 1 1 0 0 0 1 0 0 1 0 0 1 0 0 0 1 0\n1 0 0 1 1 1 0 1 0 0 1 1 0 0 0 1 0 1 0 1 0 1 0 0 0 0 1 1 0 1 1 1 1 1 1 1 0 1 0 0 0 1 1 0 1 0 0 1 1 0\n1 1 0 0 0 0 0 1 0 0 0 0 1 1 1 0 1 1 1 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0 0 0 1 1 0 1 0 1 0 0 0 0 0 0 1 1\n0 0 0 1 0 0 0 1 1 0 0 1 0 0 0 0 1 0 1 0 1 1 1 0 0 1 0 1 1 0 1 0 0 1 0 0 1 0 1 0 0 1 1 1 0 0 0 0 0 0\n0 0 0 1 0 0 1 1 0 1 1 0 1 1 0 0 1 0 1 0 0 1 0 1 0 1 0 0 0 1 1 1 1 1 0 1 0 0 1 1 0 1 0 0 1 0 0 1 0 1\n0 1 0 1 1 1 1 0 1 0 0 1 1 0 1 0 1 0 0 1 1 1 0 0 1 1 0 0 0 1 1 0 1 1 0 1 0 0 1 1 1 1 1 1 0 1 0 1 1 0\n1 0 0 0 0 0 0 1 1 0 0 0 1 1 0 1 1 1 1 0 0 0 0 0 0 0 0 0 1 1 0 0 1 0 1 0 0 0 0 0 0 0 0 1 0 1 1 1 1 1\n0 1 0 0 0 0 0 1 1 1 0 1 1 1 0 1 1 0 1 1 0 0 1 1 0 1 1 1 0 0 0 0 0 0 0 1 1 1 1 1 0 0 0 0 0 1 0 0 1 1\n1 0 0 0 1 1 1 1 0 1 0 0 0 1 0 1 0 0 0 0 1 1 0 1 0 1 1 0 0 1 0 1 1 0 0 0 1 0 0 0 0 0 1 1 0 1 0 1 1 0\n1 0 1 0 0 1 1 1 1 0 1 0 0 0 0 0 1 1 0 1 1 0 1 1 0 1 1 0 0 1 1 1 1 0 0 1 1 0 1 1 0 1 1 1 0 0 1 0 1 0\n1 1 1 1 1 1 0 0 0 1 1 1 0 1 0 0 1 0 0 1 0 0 1 0 0 0 1 0 1 1 1 1 0 0 1 0 0 0 1 0 1 1 1 0 1 1 0 1 1 1\n0 0 1 0 0 0 0 0 0 1 1 1 0 0 1 1 1 1 1 0 1 1 1 1 0 0 0 0 1 0 1 0 1 0 1 0 0 0 0 1 1 0 0 0 1 0 1 1 1 0\n0 1 0 1 1 1 1 0 1 1 0 1 0 1 1 0 1 0 1 0 0 1 1 1 0 0 1 0 1 0 0 1 0 0 1 0 1 0 0 1 0 1 1 1 1 0 0 1 0 0\n0 0 1 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 0 0 0 1 1 1 0 0 1 0 0 1 0 0 0 1 1 1 0 1 0 1 1 0 1 1 1 0 0 1 0 1\n1 0 0 1 0 1 1 0 0 0 0 0 0 0 0 0 0 1 0 1 1 0 1 0 0 1 1 0 1 0 1 1 1 1 0 0 1 0 1 0 0 0 0 0 1 1 0 1 0 1\n0 0 1 0 0 0 0 0 0 0 0 0 1 1 1 0 1 1 1 1 0 0 1 0 0 0 1 0 0 0 1 0 0 1 0 0 0 1 1 1 1 0 1 1 1 0 0 1 0 0\n0 1 1 1 1 1 0 0 0 0 0 0 0 0 0 1 0 1 1 0 0 0 0 0 1 0 1 0 0 0 0 1 1 0 1 1 0 0 0 0 1 0 0 1 1 1 0 0 1 1\n0 0 1 1 0 1 1 1 0 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 1 1 0 0 0\n0 0 0 1 1 0 0 0 0 1 1 0 0 0 0 0 1 0 1 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0 1 0 0 0 0 1 1 0 0 0 1 0 1 1 1\n0 0 0 1 1 1 0 1 1 0 0 0 0 0 0 1 0 0 0 1 0 1 0 1 1 1 0 0 0 1 1 0 0 0 0 1 0 1 1 1 1 1 1 0 0 0 0 1 1 0\n1 0 1 1 0 1 1 0 0 0 1 0 1 0 1 0 1 0 0 1 0 0 1 0 1 1 1 1 1 0 0 0 0 1 0 1 1 0 0 0 0 0 1 0 0 1 0 1 0 1\n0 0 1 1 0 0 1 0 0 0 1 1 0 1 0 1 0 0 0 0 1 1 1 0 0 0 0 1 0 0 0 0 0 1 0 1 1 0 0 0 1 0 0 0 1 0 0 1 1 1\n1 0 0 0 0 1 0 1 0 0 0 0 0 0 1 1 1 1 0 1 1 0 1 1 1 0 1 0 1 0 1 1 1 1 1 1 0 1 0 0 1 0 1 0 0 0 1 1 1 0\n1 1 1 0 1 1 1 1 0 0 1 1 0 1 1 1 1 1 1 1 0 1 0 1 0 1 1 1 1 0 0 0 0 0 0 0 1 0 0 0 1 0 1 1 0 0 1 1 0 1\n0 1 1 0 0 0 1 0 0 1 0 1 1 1 0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 1 0 0 1 1 0 0 1 0 1 0 0 1 1 0 1 0 0 1 1 0\n0 0 1 0 1 0 0 0 1 0 0 0 0 1 1 1 0 1 1 1 0 1 0 1 1 0 0 1 0 0 1 0 0 0 1 0 0 0 0 1 0 1 0 0 1 1 0 1 0 0\n1 0 1 1 0 1 0 0 1 1 0 0 0 0 0 0 1 1 1 0 0 1 1 1 1 0 1 1 0 0 0 1 0 0 0 1 1 0 1 0 1 0 0 1 0 0 1 1 0 1\n0 0 1 1 1 1 0 0 0 1 0 0 1 0 0 0 0 1 1 1 1 1 0 0 0 0 0 0 1 1 1 1 1 0 0 1 1 1 0 1 0 0 1 1 1 0 0 0 1 1\n0 0 0 0 1 1 1 1 1 1 0 0 1 0 1 1 0 0 0 0 1 1 0 0 1 0 1 0 0 0 1 1 0 1 1 0 1 0 0 0 0 1 1 0 0 0 0 0 0 1\n0 0 0 1 0 0 0 0 1 0 0 1 0 1 0 0 1 0 1 1 1 1 0 1 0 0 1 1 1 1 0 0 1 0 0 0 0 1 0 0 0 1 0 1 1 1 0 0 1 0\n0 1 1 0 0 1 0 1 1 1 0 0 0 0 0 0 1 0 0 0 1 1 0 0 0 0 0 1 1 1 0 1 0 0 1 1 0 1 1 0 0 0 0 1 1 1 0 0 1 0\n1 1 1 1 0 1 0 0 1 0 0 0 0 1 0 0 1 0 1 0 0 1 0 1 0 0 1 1 1 0 1 1 1 0 1 1 0 1 0 0 1 1 1 1 0 0 1 1 0 0\n1 1 0 0 1 1 0 1 1 1 1 1 1 1 0 0 0 1 0 1 0 1 0 0 1 0 0 1 1 1 1 0 1 0 1 1 0 0 0 0 0 0 0 1 0 1 1 1 0 1",
        expected: "225",
      },
      {
        input:
          "50\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1",
        expected: "1",
      },
    ],
    hints: [
      "Scan the chart. When you meet coral you have not seen before, you have found a new reef.",
      "Before continuing the scan, make sure the rest of that reef can never be counted again.",
      "Flood out from that cell and overwrite every coral cell you reach, so later scanning skips it.",
      "Use an explicit stack: a 50×50 reef recursed cell by cell is 2,500 calls deep.",
    ],
    solutions: [
      {
        title: "Recursive flood fill",
        order: 1,
        intuition:
          "Each time the scan meets fresh coral, a new reef has been found. A recursive fill from that cell sinks the whole reef, turning it into water, so the scan never counts another cell of it.",
        approach: [
          "Scan every cell in row order.",
          "On a 1, add one to the count and call sink on it.",
          "sink(r, c) returns at once if off the grid or not coral; otherwise sets the cell to 0 and sinks its four neighbours.",
        ],
        code: {
          PYTHON: `def countReefs(chart: List[List[int]]) -> int:
    rows, cols = len(chart), len(chart[0])

    def sink(r: int, c: int) -> None:
        if r < 0 or r >= rows or c < 0 or c >= cols or chart[r][c] != 1:
            return
        chart[r][c] = 0
        sink(r + 1, c)
        sink(r - 1, c)
        sink(r, c + 1)
        sink(r, c - 1)

    reefs = 0
    for r in range(rows):
        for c in range(cols):
            if chart[r][c] == 1:
                reefs += 1
                sink(r, c)
    return reefs`,
          JAVA: `class Solution {
    private int[][] chart;

    public int countReefs(int[][] chart) {
        this.chart = chart;
        int reefs = 0;
        for (int r = 0; r < chart.length; r++) {
            for (int c = 0; c < chart[0].length; c++) {
                if (chart[r][c] == 1) {
                    reefs++;
                    sink(r, c);
                }
            }
        }
        return reefs;
    }

    private void sink(int r, int c) {
        if (r < 0 || r >= chart.length || c < 0 || c >= chart[0].length || chart[r][c] != 1) return;
        chart[r][c] = 0;
        sink(r + 1, c);
        sink(r - 1, c);
        sink(r, c + 1);
        sink(r, c - 1);
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols) recursion depth in the worst case",
        edgeCases: ["A chart that is all water.", "A chart that is one solid reef."],
        commonMistakes: [
          "Counting diagonal neighbours as connected.",
          "Recursion depth: one large reef can exceed Python's default limit of 1000 frames.",
        ],
      },
      {
        title: "Optimal: iterative flood fill with a stack",
        order: 2,
        intuition:
          "The same idea with the call stack replaced by a list. Each coral cell is marked (here with 2, so the visual shows which cells have been absorbed) the moment it is pushed, which guarantees it is pushed once. Memory is now heap memory, so a reef covering the whole chart is no problem.",
        approach: [
          "Scan every cell in row order.",
          "On a 1: count a new reef, mark the cell 2 and push it.",
          "While the stack is not empty, pop a cell and push every neighbouring 1 after marking it 2.",
          "Continue the scan; marked cells are skipped automatically.",
        ],
        code: {
          PYTHON: `def countReefs(chart: List[List[int]]) -> int:
    rows, cols = len(chart), len(chart[0])
    reefs = 0

    for r in range(rows):
        for c in range(cols):
            if chart[r][c] != 1:
                continue
            reefs += 1
            chart[r][c] = 2  # 2 = already part of a counted reef
            stack = [(r, c)]
            while stack:
                cr, cc = stack.pop()
                for nr, nc in ((cr + 1, cc), (cr - 1, cc), (cr, cc + 1), (cr, cc - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and chart[nr][nc] == 1:
                        chart[nr][nc] = 2
                        stack.append((nr, nc))

    return reefs`,
          JAVA: `class Solution {
    public int countReefs(int[][] chart) {
        int rows = chart.length, cols = chart[0].length, reefs = 0;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        ArrayDeque<int[]> stack = new ArrayDeque<>();

        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (chart[r][c] != 1) continue;
                reefs++;
                chart[r][c] = 2;
                stack.push(new int[]{r, c});
                while (!stack.isEmpty()) {
                    int[] cell = stack.pop();
                    for (int[] s : steps) {
                        int nr = cell[0] + s[0], nc = cell[1] + s[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && chart[nr][nc] == 1) {
                            chart[nr][nc] = 2;
                            stack.push(new int[]{nr, nc});
                        }
                    }
                }
            }
        }
        return reefs;
    }
}`,
        },
        timeComplexity: "O(rows × cols) — each cell is pushed at most once",
        spaceComplexity: "O(rows × cols) for the stack in the worst case",
        edgeCases: [
          "A checkerboard, where every coral cell is its own reef.",
          "A ring of coral around a single coral centre: two reefs, because the ring never touches the centre along a side.",
          "A 1×1 chart.",
        ],
        commonMistakes: [
          "Marking cells only when popped, so a cell can be pushed by several neighbours.",
          "Resetting the count inside the scan rather than once at the start.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(rows × cols)",
  },

  {
    slug: "mould-spread",
    title: "Mould Spread",
    difficulty: "MEDIUM",
    learningObjective:
      "Run breadth-first search from many sources at once, so each layer of the queue corresponds to one unit of time.",
    topics: ["matrices", "graphs"],
    patterns: ["breadth-first-search"],
    statement: [
      para(
        "A warehouse stores produce in a grid of crates. Each slot is empty (0), holds fresh produce (1), or holds mouldy produce (2). Every minute, mould jumps from each mouldy crate to every fresh crate directly above, below, left or right of it. Empty slots block it."
      ),
      rich(
        "Return the number of minutes until no fresh crate remains in ",
        { code: "crates" },
        ". If some fresh crate can never be reached, return ",
        { code: "-1" },
        ". If there is nothing fresh to begin with, return ",
        { code: "0" },
        "."
      ),
      example(
        "crates = [[2,1,1],[1,1,0],[0,1,1]]",
        "4",
        [
          { state: "minute 1", note: "(0,1) and (1,0) turn mouldy" },
          { state: "minute 2", note: "(0,2) and (1,1)" },
          { state: "minute 3", note: "(2,1)" },
          { state: "minute 4", note: "(2,2) — nothing fresh remains" },
        ],
        "Mould spreading from the corner"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "crates[i][j] is 0, 1 or 2",
      "Your function may modify crates.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["crates"],
      returns: "int",
      functionName: "minutesToSpoil",
    },
    tests: [
      { input: "3\n2 1 1\n1 1 0\n0 1 1", expected: "4", isSample: true },
      {
        input: "3\n2 1 1\n0 1 1\n1 0 1",
        expected: "-1",
        isSample: true,
        explanation:
          "The fresh item in the bottom-left corner has no neighbour that can ever turn mouldy.",
      },
      {
        input: "1\n0 2",
        expected: "0",
        isSample: true,
        explanation: "Nothing fresh to begin with, so zero minutes are needed.",
      },
      { input: "1\n1", expected: "-1" },
      { input: "1\n2", expected: "0" },
      { input: "1\n0", expected: "0" },
      { input: "1\n2 1 1 1 2", expected: "2" },
      { input: "3\n1 1 1\n1 2 1\n1 1 1", expected: "2" },
      { input: "1\n2 0 1", expected: "-1" },
      {
        input:
          "50\n2 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1\n0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 0\n1 1 0 1 1 1 0 0 0 0 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1\n1 0 1 0 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1\n1 1 1 1 0 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1\n1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 0 1 1 1 1 1 0 1 1 1 0 1 1 1 1 0 1 1 0 1 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1\n1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n1 1 1 1 1 1 1 0 0 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 1 0 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1\n1 0 1 1 1 1 1 1 1 1 1 1 0 0 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 0 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1\n1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1\n1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1\n0 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 0 1 1 1 1 1\n1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1\n1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 0 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 0 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 0 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1\n1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 0 1\n1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 0 0 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 1 1 0 1 1 0 0 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 0 1 1\n1 1 1 1 1 1 0 1 1 1 0 1 1 0 0 1 1 1 1 1 1 0 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 0 1 1 0 1 1 1 0 1 1 1 1 1 1 1 0 1 0 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 1 1 0 0 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1\n1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 0 1 0 0\n0 1 1 1 1 1 1 1 1 0 0 1 1 0 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1\n1 1 0 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 0 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 0 1 0 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 0 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1\n1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1",
        expected: "-1",
      },
      {
        input:
          "50\n1 1 0 1 1 1 0 1 1 0 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 0 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 0 1 0 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 0 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1\n0 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 0 1 1\n1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 0 0 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1\n1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 0 1 0 1 1 1 1 1 0 1 1 1 1 1 1 0 1 0 1 1 1 0 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 2 1 1 0 1 1 1 1 1 0 1 1 1 0 0 1 1 0 0 1 1\n1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 0 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1 0 1 1 0 1 0 0 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 0 0 1 1 1 1 1 1 1\n1 0 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 0 0 1 1 1 1 1 1 1 1 1 1 2 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 0 1 1 1 0 1 0 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 0 1 0 1 0 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1\n0 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 0\n1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 0 1 1 1 1 0 1 0 0 1 1 0 0 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 0 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 1 1 1 1 1 1 0 0 1 1 0 0 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0\n1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 0 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 0 1 1 1 1 1 0 0 1 1 1 0 1 1 1 1 1 1 1 0 1 0 1 0 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1\n1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 0 1 0 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 0\n0 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1 1 0 0 1\n1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 0 1 1 1 0 0 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0\n1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 0 1 1\n1 1 0 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 0 1 1 0 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 0 1\n0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 0 1 1\n1 1 0 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 2 1\n1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 0 0 1 0 1 0 1 1 1 1 1 0 1 1 0 0 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1\n1 0 1 1 1 1 0 1 0 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1\n1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 1 1 0 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1\n1 1 0 1 1 1 1 0 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 0 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1\n1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 0 0 1 1 1 1 1 0 1\n1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 0 1 1 1 1 0 1 0 1 1 1 1 0 1 0 1 1 1 0 1 1 1 1 1 1 0 1 1 0 0 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1\n1 1 0 1 0 1 0 1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 0 0 0 0 1 1 1 1 1 0 1 1 1 1 0 1 1 1 1 0 1 1 1 1 1 1 0 0 1 1 1 1 1\n0 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 1 1 1 1 1 1\n1 1 0 1 1 1 1 0 1 1 1 1 1 1 1 0 0 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 0 1 1 0 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 0 1 0 1 0 1 0 1 1 1 1 0 1 1 1 0\n0 0 1 1 1 1 1 1 0 1 1 1 1 1 1 0 1 1 0 1 0 0 1 1 0 0 1 0 1 1 1 1 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 0 1 1\n1 1 1 1 1 1 1 1 0 1 1 0 1 0 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 1 1 1 1\n1 1 0 1 1 0 0 1 1 1 1 0 1 1 0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 1 1 1 1 2 1 0 1 1 1 0 1 1 1",
        expected: "-1",
      },
    ],
    hints: [
      "Simulating minute by minute works, but each minute rescans the whole grid.",
      "Only crates that turned mouldy in the last minute can spread anything new.",
      "Put every initially mouldy crate in one queue. Process the queue in layers: one layer is one minute.",
      "Track how many fresh crates remain. When the queue runs dry, any leftovers are unreachable.",
    ],
    solutions: [
      {
        title: "Minute-by-minute simulation",
        order: 1,
        intuition:
          "Follow the rules literally. Each minute, find every fresh crate next to a mouldy one, turn them all at once (in a copy, so a crate turned this minute cannot spread until the next), and count minutes. Stop when nothing is fresh, or when a minute changes nothing.",
        approach: [
          "If nothing is fresh, return the minutes elapsed.",
          "Build the next grid: each fresh crate next to a mouldy one becomes mouldy.",
          "If nothing changed, return -1; otherwise advance the minute and repeat.",
        ],
        code: {
          PYTHON: `def minutesToSpoil(crates: List[List[int]]) -> int:
    rows, cols = len(crates), len(crates[0])
    minutes = 0
    while True:
        if not any(1 in row for row in crates):
            return minutes
        nxt = [row[:] for row in crates]
        changed = False
        for r in range(rows):
            for c in range(cols):
                if crates[r][c] != 1:
                    continue
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and crates[nr][nc] == 2:
                        nxt[r][c] = 2
                        changed = True
                        break
        if not changed:
            return -1
        crates = nxt
        minutes += 1`,
          JAVA: `class Solution {
    public int minutesToSpoil(int[][] crates) {
        int rows = crates.length, cols = crates[0].length, minutes = 0;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (true) {
            boolean anyFresh = false;
            for (int[] row : crates) for (int v : row) if (v == 1) anyFresh = true;
            if (!anyFresh) return minutes;
            int[][] next = new int[rows][];
            for (int r = 0; r < rows; r++) next[r] = crates[r].clone();
            boolean changed = false;
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (crates[r][c] != 1) continue;
                    for (int[] s : steps) {
                        int nr = r + s[0], nc = c + s[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && crates[nr][nc] == 2) {
                            next[r][c] = 2;
                            changed = true;
                            break;
                        }
                    }
                }
            }
            if (!changed) return -1;
            crates = next;
            minutes++;
        }
    }
}`,
        },
        timeComplexity:
          "O((rows × cols)²) — up to rows × cols minutes, each a full scan",
        spaceComplexity: "O(rows × cols)",
        edgeCases: [
          "No fresh crates at the start.",
          "A fresh crate walled off by empty slots.",
        ],
        commonMistakes: [
          "Updating the grid in place during a minute, so mould spreads several steps in one minute.",
        ],
      },
      {
        title: "Optimal: multi-source breadth-first search",
        order: 2,
        intuition:
          "Mould spreads exactly like a breadth-first search that starts from every mouldy crate at the same time. Seed the queue with all of them; then processing the queue one layer at a time advances the clock by one minute per layer, and each fresh crate is touched once.",
        approach: [
          "Scan once: enqueue every mouldy crate and count the fresh ones.",
          "While the queue is non-empty and fresh crates remain, start a new minute.",
          "Process exactly the crates in the queue at the start of the minute; turn each fresh neighbour mouldy, decrement the fresh count and enqueue it.",
          "Return the minutes if no fresh crate remains, otherwise -1.",
        ],
        code: {
          PYTHON: `from collections import deque


def minutesToSpoil(crates: List[List[int]]) -> int:
    rows, cols = len(crates), len(crates[0])
    queue = deque()
    fresh = 0

    for r in range(rows):
        for c in range(cols):
            if crates[r][c] == 2:
                queue.append((r, c))  # every source starts at minute 0
            elif crates[r][c] == 1:
                fresh += 1

    minutes = 0
    while queue and fresh > 0:
        minutes += 1
        # Exactly the crates that turned during the previous minute.
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and crates[nr][nc] == 1:
                    crates[nr][nc] = 2
                    fresh -= 1
                    queue.append((nr, nc))

    return minutes if fresh == 0 else -1`,
          JAVA: `class Solution {
    public int minutesToSpoil(int[][] crates) {
        int rows = crates.length, cols = crates[0].length, fresh = 0;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (crates[r][c] == 2) queue.add(new int[]{r, c});
                else if (crates[r][c] == 1) fresh++;
            }
        }

        int minutes = 0;
        while (!queue.isEmpty() && fresh > 0) {
            minutes++;
            for (int i = queue.size(); i > 0; i--) {
                int[] cell = queue.poll();
                for (int[] s : steps) {
                    int nr = cell[0] + s[0], nc = cell[1] + s[1];
                    if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && crates[nr][nc] == 1) {
                        crates[nr][nc] = 2;
                        fresh--;
                        queue.add(new int[]{nr, nc});
                    }
                }
            }
        }
        return fresh == 0 ? minutes : -1;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        edgeCases: [
          "Fresh crates but no mould at all: -1.",
          "Mould but nothing fresh: 0, without counting an extra minute.",
          "Two mould sources racing toward each other from opposite ends.",
        ],
        commonMistakes: [
          "Running a separate search from each mouldy crate, which overestimates when sources overlap and costs far more time.",
          "Incrementing the minute after the last layer even though it turned nothing.",
          "Looping while the queue is non-empty without checking the fresh count, which adds a wasted minute.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(rows × cols)",
  },

  {
    slug: "shortest-corridor",
    title: "Shortest Clear Corridor",
    difficulty: "MEDIUM",
    learningObjective:
      "Find the shortest path in an unweighted grid with breadth-first search, where the first arrival is guaranteed to be the shortest.",
    topics: ["matrices", "graphs"],
    patterns: ["breadth-first-search"],
    statement: [
      para(
        "A warehouse robot moves across a floor plan of square cells. Cells marked 0 are clear and cells marked 1 hold shelving. The robot steps up, down, left or right, never diagonally, and only onto clear cells."
      ),
      rich(
        "The robot starts in the top-left cell and must reach the bottom-right cell. Return the number of cells on the shortest route, counting both the start and the end, or ",
        { code: "-1" },
        " if no route exists (including when either end is blocked)."
      ),
      example(
        "floor = [[0,0,0],[1,1,0],[0,0,0]]",
        "5",
        [
          { state: "distance 1", note: "(0,0)" },
          { state: "distance 2", note: "(0,1)" },
          { state: "distance 3", note: "(0,2)" },
          { state: "distance 4", note: "(1,2)" },
          { state: "distance 5", note: "(2,2) — the goal" },
        ],
        "Breadth-first layers from the start"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 50",
      "floor[i][j] is 0 or 1",
      "Your function may modify floor.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["floor"],
      returns: "int",
      functionName: "shortestCorridor",
    },
    tests: [
      { input: "3\n0 0 0\n1 1 0\n0 0 0", expected: "5", isSample: true },
      { input: "4\n0 1 0 0\n0 1 0 1\n0 0 0 0\n1 1 1 0", expected: "7", isSample: true },
      {
        input: "2\n0 1\n1 0",
        expected: "-1",
        isSample: true,
        explanation:
          "Moves are only up, down, left and right, so the two open cells never touch.",
      },
      { input: "1\n0", expected: "1" },
      { input: "1\n1", expected: "-1" },
      { input: "2\n1 0\n0 0", expected: "-1" },
      { input: "2\n0 0\n0 1", expected: "-1" },
      { input: "1\n0 0 0 0 0", expected: "5" },
      { input: "3\n0 0 0\n0 1 0\n0 0 0", expected: "5" },
      {
        input:
          "50\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 1 0",
        expected: "1275",
      },
      {
        input:
          "50\n0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 1 1 0 0 0 0 0 1 1 0 1 1 0 0 1 1 0\n1 0 0 1 0 0 1 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 1\n0 0 0 0 1 0 0 1 0 0 1 0 0 0 1 1 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0\n0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 1 0 0 0 1 0 0 1 0 1 1 0 1 1 1 0 0 0 0 0 0 0 0 0 0 1 1\n1 1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 1 1 0 1 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 1 1 1 0 0 1 0 0 1 0 0\n0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 1 0 1 1 0 0 0 1 0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 1\n0 0 0 0 0 0 1 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 0 0 0\n0 0 0 1 1 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 0 1 0 1 0 0 1 0 0 0 0 0 1 1 1 0 0 0 0 0 1 0 0 1 0 0 0 1 0\n0 1 1 0 0 1 1 0 0 0 1 1 0 0 0 0 0 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 1 0 0 1 0 0 1 1 1\n1 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 0 1 0 1 1 0 0 0 0 0 1 0 0 0 0 1 0 0 0\n0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 1 0 1 0 1 0 0 1 0 0 1 0 0 0 0 0 0 1 0 0 1 0 0 0 0 1 1 1\n0 0 1 0 0 1 0 0 0 0 1 0 1 0 0 0 1 0 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0\n0 0 1 0 0 1 0 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 1 1 0 1 1 1 0 0 0 0 0 0 1 0 0 0 0 0 1 1 0\n1 0 0 0 0 1 0 0 0 0 1 0 0 1 0 1 1 1 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 1 1 0 0 0 0 0 0 1 0 0 0 1 0 0 1 0\n1 1 0 0 0 0 1 0 0 0 0 0 1 0 0 0 1 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 1 0 0 1 0 0 0 0 0 1 0\n1 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 1 0 0 0 0 0 1 1 0 1 0 1 0\n0 0 0 1 1 0 0 0 0 1 1 0 0 0 0 0 1 0 0 1 0 0 1 1 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 1\n0 0 0 1 0 0 1 0 0 0 0 0 1 0 0 1 0 1 0 0 1 0 1 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 1 0 1 0 1 0 1 0 0\n0 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 1 1 1 0 0 1 0 1 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 1\n0 1 1 1 0 0 0 0 0 1 0 0 0 1 1 1 1 1 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1\n0 0 1 0 0 0 1 0 1 1 0 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 1 1 0 0 1 0 1 0 0 1 0 0 0\n1 0 0 0 1 0 0 0 1 1 0 0 0 0 0 1 0 1 1 0 0 1 0 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0\n0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1 1 0 1 0 0 0 0 1 0 0 0 1 0 0 0 1 0 1 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 0 0 0 1 0 1 1 0 0 0 0 1 0 0 1 0 0 0 1 0 0 1 1 0 0 0 0 0 0 1 1 0 1 0 0 0 1 0 0 1 0 1 1 0 0 0 0 0\n0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 1 0 0 0 0 1 0 1 0 0 1 0 0 0 1 0 0\n1 0 1 0 0 1 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0\n0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0\n1 0 0 1 1 0 0 0 1 0 0 1 1 0 0 0 0 1 1 0 0 1 0 0 0 0 0 1 0 0 0 1 0 0 0 1 0 0 0 0 0 1 1 0 0 1 0 0 0 0\n0 0 0 1 0 0 0 1 0 0 1 0 0 0 1 0 1 0 0 0 0 0 1 1 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0\n0 0 0 0 0 0 0 1 0 0 0 0 1 0 0 1 1 0 0 0 1 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 1 0 0 1 0\n0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 1 0 0 0 0 0 0 0 1 0\n1 0 1 1 0 0 1 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 1 0 0 1 0 1 0 1 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 1 0 1 0\n0 0 0 1 0 0 1 0 1 0 0 1 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 1 0 1\n0 1 0 0 0 0 0 0 1 0 1 0 0 1 1 0 0 0 0 1 0 0 0 0 1 0 1 1 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 1 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 1 0 0 1 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 1 0 0 0 1 0 0 0 1 0 0 0 1 1 0 1 0 1 0 0\n0 0 0 1 0 1 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0 1 0 0 0 1 0 1 0 0 0 0 0 0 1 1 0 1\n1 1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 1 0 1 1 0 0 0 0 0 0 0 0\n0 0 0 1 0 0 1 0 0 1 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 1 1 1 0 1 0 0 0 1 1 0 0 0 0\n0 1 0 1 0 1 0 0 0 0 1 1 0 0 0 0 0 0 1 1 0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 1 0 1 0 0 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 1 1 0 0 0 0 0 0 0 1 1 1 0 1 0 0 0 0 0 1\n0 1 1 1 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 1 0 0 0 0 0 1 1 0 0 0 1 1 1 0 0 1 0 0 0 0 0 0 0 0 1 0\n0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 1 1 0 0 0 0 0 0 1 0 0 0 1 0 0 0 1 0\n0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 1 0 0 1 1 1 0 1 1 1 0 0 0 0 0 1 1 0 0 0 0 1 0 0 0 0 0 1 0 0\n1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 1 0 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0 1 0 1 0 1 0 0 0 0 0\n1 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 0 0",
        expected: "99",
      },
      {
        input:
          "45\n0 1 0 0 0 0 0 0 0 1 0 0 0 1 1 0 0 1 1 0 0 0 1 1 0 0 1 0 0 0 0 0 0 1 0 1 0 0 0 1 1 0 0 1 1 0 0 0 0 0\n1 0 1 0 0 0 0 0 0 0 1 0 1 0 1 0 0 1 0 0 0 0 1 1 0 1 0 0 0 0 1 1 0 1 1 1 0 0 1 0 0 0 0 1 0 0 0 1 1 1\n1 1 1 0 0 0 1 0 1 0 1 1 0 0 0 0 0 1 0 1 0 0 1 1 0 0 1 1 0 1 0 1 0 1 0 0 0 1 0 1 0 0 1 0 0 0 1 1 0 0\n0 0 0 0 0 0 0 0 0 1 0 0 1 1 1 0 0 0 0 0 0 0 1 1 0 1 0 0 0 1 0 0 0 0 0 1 0 0 0 0 1 0 1 0 1 1 0 0 0 0\n1 0 0 1 0 0 0 0 1 0 0 0 1 0 0 0 0 1 0 0 1 0 0 1 1 0 0 0 0 1 0 0 0 0 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 1 0 1 0 0 0 0 1 1 0 1 0 1 1 0 0 0 1 1 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 1 1 0 1 0 1 0 0 0 0\n1 0 0 1 1 0 0 0 0 1 1 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 1 0 0 1 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0\n0 0 0 1 0 1 0 0 0 0 1 0 1 0 1 0 1 1 1 0 0 1 1 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 1 1 0 0 0 0 0 1 1 0 0 0\n0 0 1 0 1 0 0 1 0 1 1 1 1 0 0 0 0 1 0 1 0 0 1 0 0 1 0 0 0 1 0 0 1 0 0 0 1 1 0 0 0 0 1 0 0 0 0 0 0 1\n1 1 1 0 0 1 0 0 1 0 0 1 0 0 0 0 0 0 0 1 1 0 1 0 0 1 0 1 1 0 0 1 0 1 0 1 0 1 1 0 1 1 0 0 1 0 0 0 0 0\n0 0 0 0 1 0 0 0 0 1 0 1 1 1 0 0 0 0 0 1 1 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 0 0 1 0\n0 0 0 0 0 0 0 0 0 1 0 0 1 1 0 1 0 0 0 1 1 1 0 1 1 1 1 1 0 1 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 1\n1 1 0 0 0 0 0 1 0 1 0 1 1 1 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 1 0 0 1 1 0 0 1 0 0 0 0 1 1 0 1 1 0 1 0 1\n1 1 0 0 1 0 0 1 0 1 0 1 1 0 0 0 1 0 0 0 0 1 0 1 0 1 1 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 1 0 0 0 1 1\n0 1 0 0 0 0 1 0 1 1 1 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 1 0 0 1 1 0 0 0 0 0 1 1 0 0 0 1 1 0 0 0 0 0\n0 1 0 0 0 1 1 0 1 0 1 0 1 0 0 1 1 0 0 1 0 1 0 0 0 0 0 0 0 1 1 0 1 1 0 1 0 0 0 0 0 1 0 1 0 0 0 0 0 1\n0 0 0 0 1 0 1 0 0 0 0 0 0 0 0 1 0 0 1 1 0 0 0 1 0 1 1 1 1 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 1 0 0 0 0\n1 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 1 0 1 0 1 0 0 1 1 0 0 0 0 0 0 1 0 0 0 0 1 1 1 1 0 1 0 1 0 0 1 0 0 1\n1 0 0 1 0 0 0 0 0 0 0 0 1 1 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 1\n0 0 0 0 0 1 0 1 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 1 1 0 0 0 0 0 1 0 0 1 1 0 1 0 0 1 1 1 0 0 1 1 0 0 1\n0 0 0 1 0 1 1 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 1 0 1 0 0 1 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0\n1 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 1 1 1 0 0 0\n0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 1 1 1 1 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 1 0 1 0 0 0 0 0 0 1 0 0\n0 1 0 0 0 0 0 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 0 0 0 0 1 0 0 1 0 1 0 0 0 0 1 0 0 0 1 0 1\n1 0 0 1 1 0 0 1 0 0 1 0 0 1 0 0 0 0 0 0 0 0 1 0 1 0 0 1 0 1 0 1 0 1 0 0 0 1 0 0 0 0 0 1 0 0 0 1 0 0\n1 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 0 1 1 1 0 0 1 0 0 0 0 1 0 1 0 1 1 0 0 0 0 0 1 1 0 1 1 0 0 1\n1 0 0 0 0 0 0 1 0 0 1 1 0 1 0 0 1 0 1 1 0 0 1 1 1 0 0 0 0 0 0 0 0 1 1 0 0 0 1 0 0 1 0 0 0 0 0 1 1 0\n0 0 1 0 0 0 0 0 0 1 1 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 1 1 0 1 0 1 1 0 1 0 0 0 0 0 0 0 1\n1 0 0 1 0 1 0 1 0 0 0 1 0 0 1 0 0 0 0 0 0 1 0 1 0 0 1 0 0 1 0 1 1 0 1 0 0 0 1 1 0 0 1 0 0 1 0 0 1 0\n0 0 0 0 0 1 1 1 0 1 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 1 1 0 0 0 1 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 0\n0 0 0 1 0 0 0 0 0 1 1 1 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 1 1 1 0 1 0 0 0 0 0 0 0 0 1 0 1 0 0\n0 0 1 0 0 0 0 1 0 1 1 0 0 0 0 0 1 0 0 0 0 0 1 0 1 0 0 0 0 0 0 1 1 0 0 1 0 1 0 1 0 0 1 0 1 1 1 0 1 0\n1 1 0 0 0 0 0 0 1 0 0 1 1 1 1 0 0 0 0 0 0 1 0 0 0 1 0 1 1 0 1 0 1 1 1 1 0 0 0 0 0 0 1 1 0 0 0 0 1 1\n0 1 0 1 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 1 1 1 0 0 0 1 1 0 1 1 1 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 1 0 1 0 0 0 0 0 1 0 0 0 1 1 0 0 1 0 0 0 1 1 1 0 0 1 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 1 0 0 1 1\n0 0 1 0 0 1 0 0 1 0 1 1 0 1 0 1 1 0 0 1 1 0 0 0 0 1 0 0 1 0 1 0 1 0 0 0 1 1 1 0 1 0 0 0 0 0 0 0 0 1\n0 0 0 0 1 1 1 0 0 0 0 0 0 1 1 1 1 1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 1 0 1 1 1 0 1 0 0 0 0 0 0 1\n0 0 0 0 1 1 0 0 0 1 1 0 0 1 1 0 0 0 0 1 0 1 1 0 1 0 0 0 1 1 0 0 0 0 0 0 0 1 0 0 1 0 1 0 0 0 1 0 0 0\n0 1 1 0 0 1 1 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 1 1 1 0 0 0 0 0 1 0 0 1 0\n0 1 0 0 0 1 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 1 0 1 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1\n0 0 0 1 1 1 0 1 1 0 0 1 0 0 0 0 0 1 1 0 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 1 1 0 0 0 1 0 0 0 1 1 0 1 1 0\n1 0 1 1 0 1 0 0 0 1 1 0 1 0 1 1 0 0 1 0 0 1 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 1 1 0 1 0 0 0 1 0 0 0\n0 0 0 1 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 1 1 1 0 1 0 1 1 1 0 0 1 0 1 0 0 0\n1 0 0 1 1 0 0 0 1 0 0 0 1 1 0 0 1 0 0 0 0 0 0 0 1 0 0 1 0 1 0 1 1 0 0 0 1 0 1 0 1 0 0 0 0 0 0 1 0 0\n0 0 1 0 1 0 0 1 0 0 1 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 1 0 0 1 1 0 0 0 1 1 0 0 1 1 0",
        expected: "-1",
      },
    ],
    hints: [
      "Depth-first search finds a route, but not necessarily the shortest one.",
      "Explore cells in order of distance from the start: first everything 1 cell away, then 2, and so on.",
      "A queue does exactly that. Store the distance alongside each cell.",
      "The first time the goal comes out of the queue, its distance is the answer. Mark cells when they are enqueued.",
    ],
    solutions: [
      {
        title: "Repeated relaxation",
        order: 1,
        intuition:
          "Give every clear cell a tentative distance, starting with 1 at the start and infinity elsewhere. Sweep the grid over and over: a cell can improve its distance to one more than any neighbour's. When a full sweep changes nothing, every distance is final.",
        approach: [
          "Return -1 at once if the start or goal is blocked.",
          "Set dist[start] = 1, everything else infinity.",
          "Sweep all clear cells, lowering neighbours to dist + 1 where that improves them; repeat until a sweep changes nothing.",
          "Return the goal's distance, or -1 if it is still infinity.",
        ],
        code: {
          PYTHON: `def shortestCorridor(floor: List[List[int]]) -> int:
    rows, cols = len(floor), len(floor[0])
    if floor[0][0] == 1 or floor[rows - 1][cols - 1] == 1:
        return -1
    INF = float("inf")
    dist = [[INF] * cols for _ in range(rows)]
    dist[0][0] = 1
    changed = True
    while changed:
        changed = False
        for r in range(rows):
            for c in range(cols):
                if floor[r][c] == 1 or dist[r][c] == INF:
                    continue
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and floor[nr][nc] == 0 and dist[nr][nc] > dist[r][c] + 1:
                        dist[nr][nc] = dist[r][c] + 1
                        changed = True
    best = dist[rows - 1][cols - 1]
    return -1 if best == INF else best`,
          JAVA: `class Solution {
    public int shortestCorridor(int[][] floor) {
        int rows = floor.length, cols = floor[0].length;
        if (floor[0][0] == 1 || floor[rows - 1][cols - 1] == 1) return -1;
        int INF = Integer.MAX_VALUE;
        int[][] dist = new int[rows][cols];
        for (int[] row : dist) Arrays.fill(row, INF);
        dist[0][0] = 1;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        boolean changed = true;
        while (changed) {
            changed = false;
            for (int r = 0; r < rows; r++) {
                for (int c = 0; c < cols; c++) {
                    if (floor[r][c] == 1 || dist[r][c] == INF) continue;
                    for (int[] s : steps) {
                        int nr = r + s[0], nc = c + s[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && floor[nr][nc] == 0
                                && dist[nr][nc] > dist[r][c] + 1) {
                            dist[nr][nc] = dist[r][c] + 1;
                            changed = true;
                        }
                    }
                }
            }
        }
        int best = dist[rows - 1][cols - 1];
        return best == INF ? -1 : best;
    }
}`,
        },
        timeComplexity:
          "O((rows × cols)²) in the worst case — a winding corridor needs many sweeps",
        spaceComplexity: "O(rows × cols)",
        edgeCases: [
          "A blocked start or goal.",
          "A 1×1 clear floor, whose route is one cell long.",
        ],
        commonMistakes: [
          "Stopping after a fixed number of sweeps rather than when nothing changes.",
        ],
      },
      {
        title: "Optimal: breadth-first search",
        order: 2,
        intuition:
          "In an unweighted grid, breadth-first search visits cells in non-decreasing order of distance from the start. So the first time the goal is reached, no shorter route can exist. Marking each cell when it enters the queue means every cell is processed once.",
        approach: [
          "Return -1 if the start or goal is blocked.",
          "Mark the start (here with 2) and enqueue it with distance 1.",
          "Pop a cell; if it is the goal, return its distance.",
          "Otherwise mark and enqueue every clear, unmarked neighbour with distance + 1.",
          "If the queue empties, the goal is unreachable.",
        ],
        code: {
          PYTHON: `from collections import deque


def shortestCorridor(floor: List[List[int]]) -> int:
    rows, cols = len(floor), len(floor[0])
    if floor[0][0] == 1 or floor[rows - 1][cols - 1] == 1:
        return -1

    floor[0][0] = 2  # 2 = reached; doubles as the visited mark
    queue = deque([(0, 0, 1)])

    while queue:
        r, c, length = queue.popleft()
        if r == rows - 1 and c == cols - 1:
            return length  # first arrival is the shortest
        for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
            if 0 <= nr < rows and 0 <= nc < cols and floor[nr][nc] == 0:
                floor[nr][nc] = 2
                queue.append((nr, nc, length + 1))

    return -1`,
          JAVA: `class Solution {
    public int shortestCorridor(int[][] floor) {
        int rows = floor.length, cols = floor[0].length;
        if (floor[0][0] == 1 || floor[rows - 1][cols - 1] == 1) return -1;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};

        floor[0][0] = 2;
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0, 1});
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            if (cur[0] == rows - 1 && cur[1] == cols - 1) return cur[2];
            for (int[] s : steps) {
                int nr = cur[0] + s[0], nc = cur[1] + s[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && floor[nr][nc] == 0) {
                    floor[nr][nc] = 2;
                    queue.add(new int[]{nr, nc, cur[2] + 1});
                }
            }
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        edgeCases: [
          "A 1×1 clear floor: the answer is 1.",
          "Shelving that cuts the floor into two halves.",
          "A long zig-zag corridor, where the route visits most of the floor.",
        ],
        commonMistakes: [
          "Counting moves instead of cells, which is off by one.",
          "Using depth-first search and returning the first route found.",
          "Marking cells only when dequeued, letting the queue fill with duplicates.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(rows × cols)",
  },

  {
    slug: "study-circles",
    title: "Study Circles",
    difficulty: "MEDIUM",
    learningObjective:
      "Count connected components from an adjacency matrix with union-find, decrementing the count only on merges that join two different groups.",
    topics: ["graphs", "matrices"],
    patterns: ["union-find", "depth-first-search"],
    statement: [
      para(
        "A tutor wants to form study circles. Two students who know each other belong to the same circle, and so does anyone linked through a chain of acquaintances: if Asha knows Ben and Ben knows Chen, all three share a circle even if Asha and Chen have never met."
      ),
      rich(
        { code: "knows" },
        " is an n × n grid where ",
        { code: "knows[i][j] = 1" },
        " when students i and j know each other. It is symmetric and every student knows themselves. Return the number of study circles."
      ),
      example(
        "knows = [[1,1,0,0,0],[1,1,1,0,0],[0,1,1,0,0],[0,0,0,1,1],[0,0,0,1,1]]",
        "2",
        [
          { state: "5 circles", note: "every student starts alone" },
          { state: "merge 0–1", note: "4 circles" },
          { state: "merge 1–2", note: "3 circles" },
          { state: "merge 3–4", note: "2 circles: {0,1,2} and {3,4}" },
        ],
        "Merging acquaintances"
      ),
    ],
    constraints: [
      "1 ≤ n ≤ 50",
      "knows[i][j] is 0 or 1",
      "knows[i][i] = 1 and knows[i][j] = knows[j][i]",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["knows"],
      returns: "int",
      functionName: "countCircles",
    },
    tests: [
      {
        input: "5\n1 1 0 0 0\n1 1 1 0 0\n0 1 1 0 0\n0 0 0 1 1\n0 0 0 1 1",
        expected: "2",
        isSample: true,
      },
      {
        input: "4\n1 0 0 0\n0 1 0 0\n0 0 1 0\n0 0 0 1",
        expected: "4",
        isSample: true,
        explanation: "Nobody knows anybody else, so every student is a circle of one.",
      },
      { input: "4\n1 0 0 1\n0 1 1 1\n0 1 1 0\n1 1 0 1", expected: "1", isSample: true },
      { input: "1\n1", expected: "1" },
      {
        input:
          "6\n1 0 0 0 0 1\n0 1 0 0 1 0\n0 0 1 1 0 0\n0 0 1 1 0 0\n0 1 0 0 1 0\n1 0 0 0 0 1",
        expected: "3",
      },
      {
        input:
          "7\n1 0 0 0 0 0 1\n0 1 1 0 0 1 0\n0 1 1 0 0 0 0\n0 0 0 1 0 0 1\n0 0 0 0 1 1 0\n0 1 0 0 1 1 0\n1 0 0 1 0 0 1",
        expected: "2",
      },
      {
        input:
          "50\n1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0\n0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 0 1 0 0 0 1 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0\n0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1",
        expected: "22",
      },
      {
        input:
          "50\n1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1",
        expected: "50",
      },
      {
        input:
          "48\n1 1 1 0 0 0 1 0 0 0 0 0 0 1 0 1 1 0 0 1 1 0 1 1 0 1 0 0 0 0 0 0 0 0 0 1 0 0 1 1 1 0 1 0 1 1 1 1\n1 1 0 1 0 0 0 1 1 1 0 0 0 1 0 0 1 0 1 0 1 0 1 0 0 1 1 0 1 0 0 0 0 0 1 0 0 0 0 0 1 0 1 0 0 1 1 0\n1 0 1 0 1 0 1 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 1 0 0 1 0 0 0 0 1 0 0 0 1 1 0 1 0 1 0 0 0 0 0 1 0\n0 1 0 1 0 0 1 0 1 1 0 1 0 1 0 0 0 0 1 0 0 1 1 1 0 1 1 0 0 0 1 0 0 1 0 0 1 1 0 0 1 1 1 1 1 0 0 1\n0 0 1 0 1 1 0 0 0 0 0 0 1 1 1 1 1 1 1 0 1 1 0 1 0 1 0 0 1 0 0 1 0 0 1 0 0 0 0 1 1 1 1 1 0 1 0 0\n0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 1 0 1 1 1 1 1 0 0 0 1 1 1 0 0 0 0 0 1 0 1 1 0 0 0 1 0 0 1 0 1 0 1\n1 0 1 1 0 0 1 0 0 0 0 0 0 0 0 1 1 0 0 0 0 0 0 0 0 0 1 0 1 1 1 1 0 1 0 0 0 0 0 0 1 0 1 1 0 0 1 0\n0 1 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 0 1 0 1 1 0 0 1 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0\n0 1 0 1 0 0 0 0 1 1 0 1 1 0 0 0 0 0 1 0 0 0 0 0 0 0 1 1 0 1 0 1 0 1 0 1 1 1 0 0 1 0 0 0 1 1 1 0\n0 1 0 1 0 0 0 0 1 1 1 0 0 1 0 0 1 0 1 0 0 0 0 1 0 1 0 0 0 1 0 0 0 1 0 0 0 0 1 1 1 0 0 1 1 1 0 0\n0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 1 1 1 0 0 1 0 0 1 0 1 0 1 1 0 0 0 1 0 0 0 1 0 0 1 1 0 0 1 1 1 0 1\n0 0 0 1 0 0 0 0 1 0 1 1 0 1 1 1 0 1 0 0 0 1 0 0 0 0 1 0 1 0 0 1 0 1 0 0 1 0 0 0 0 0 1 0 0 1 0 1\n0 0 0 0 1 0 0 0 1 0 0 0 1 1 0 0 1 1 1 1 0 0 1 0 1 0 1 1 0 0 0 1 0 1 0 1 0 1 0 0 0 0 0 0 0 0 1 0\n1 1 0 1 1 0 0 0 0 1 0 1 1 1 1 1 0 1 0 1 0 1 1 0 0 1 0 1 0 1 1 0 0 0 1 0 1 1 0 1 1 0 1 1 0 1 0 0\n0 0 0 0 1 0 0 0 0 0 0 1 0 1 1 0 0 1 0 1 1 0 1 1 1 1 1 1 0 0 0 0 1 0 1 1 0 0 0 1 1 1 0 1 1 0 1 1\n1 0 0 0 1 1 1 0 0 0 1 1 0 1 0 1 0 1 0 0 0 1 0 0 1 1 1 0 0 0 0 1 0 0 1 1 0 1 0 1 0 1 0 0 0 0 1 1\n1 1 0 0 1 0 1 1 0 1 1 0 1 0 0 0 1 1 0 0 1 0 0 1 0 0 0 0 0 1 1 1 0 1 0 1 1 0 0 0 0 0 1 0 0 1 1 0\n0 0 1 0 1 1 0 0 0 0 1 1 1 1 1 1 1 1 0 0 1 1 0 0 1 1 1 0 0 1 1 0 0 1 1 0 1 0 0 0 0 0 1 0 0 1 0 1\n0 1 0 1 1 1 0 0 1 1 0 0 1 0 0 0 0 0 1 0 0 1 1 0 0 0 1 0 0 1 0 0 0 0 0 0 0 1 1 0 1 0 1 0 1 1 0 0\n1 0 1 0 0 1 0 0 0 0 0 0 1 1 1 0 0 0 0 1 1 1 1 0 1 0 1 0 0 0 1 0 1 1 0 1 0 0 0 1 0 1 1 0 1 1 0 0\n1 1 0 0 1 1 0 0 0 0 1 0 0 0 1 0 1 1 0 1 1 1 0 0 1 0 0 0 0 0 0 1 1 0 1 1 0 1 0 0 1 0 0 1 0 0 0 0\n0 0 0 1 1 1 0 0 0 0 0 1 0 1 0 1 0 1 1 1 1 1 1 1 0 1 0 0 1 0 1 1 0 1 1 0 0 0 1 0 1 0 0 0 0 1 1 1\n1 1 0 1 0 0 0 0 0 0 0 0 1 1 1 0 0 0 1 1 0 1 1 1 0 0 0 1 0 0 0 0 1 0 0 1 0 0 1 0 0 1 0 1 0 0 0 1\n1 0 1 1 1 0 0 0 0 1 1 0 0 0 1 0 1 0 0 0 0 1 1 1 0 1 1 0 1 1 1 0 0 0 0 1 1 0 0 1 1 0 0 0 0 1 1 0\n0 0 0 0 0 0 0 0 0 0 0 0 1 0 1 1 0 1 0 1 1 0 0 0 1 1 1 0 1 1 1 0 1 0 0 1 1 1 1 1 1 0 0 1 0 0 0 0\n1 1 0 1 1 1 0 0 0 1 1 0 0 1 1 1 0 1 0 0 0 1 0 1 1 1 0 0 1 1 0 1 1 0 0 1 0 1 0 1 0 0 0 0 0 0 1 0\n0 1 1 1 0 1 1 1 1 0 0 1 1 0 1 1 0 1 1 1 0 0 0 1 1 0 1 1 1 0 0 1 0 0 0 1 0 0 1 0 1 1 1 1 0 0 0 1\n0 0 0 0 0 1 0 0 1 0 1 0 1 1 1 0 0 0 0 0 0 0 1 0 0 0 1 1 0 0 1 1 0 1 0 1 1 1 1 1 0 1 1 1 1 1 1 1\n0 1 0 0 1 0 1 1 0 0 1 1 0 0 0 0 0 0 0 0 0 1 0 1 1 1 1 0 1 1 0 1 0 0 0 0 1 0 0 0 1 1 1 0 0 0 0 1\n0 0 0 0 0 0 1 1 1 1 0 0 0 1 0 0 1 1 1 0 0 0 0 1 1 1 0 0 1 1 0 0 1 0 1 0 1 0 0 1 0 0 0 1 1 0 0 1\n0 0 0 1 0 0 1 0 0 0 0 0 0 1 0 0 1 1 0 1 0 1 0 1 1 0 0 1 0 0 1 0 0 0 0 1 0 0 1 0 0 0 0 1 1 1 0 1\n0 0 1 0 1 0 1 0 1 0 0 1 1 0 0 1 1 0 0 0 1 1 0 0 0 1 1 1 1 0 0 1 0 1 0 0 0 1 0 1 0 0 0 1 0 0 1 0\n0 0 0 0 0 0 0 1 0 0 1 0 0 0 1 0 0 0 0 1 1 0 1 0 1 1 0 0 0 1 0 0 1 0 0 1 0 1 0 0 1 1 1 0 0 1 0 0\n0 0 0 1 0 1 1 0 1 1 0 1 1 0 0 0 1 1 0 1 0 1 0 0 0 0 0 1 0 0 0 1 0 1 1 1 0 1 1 1 0 1 1 1 1 1 0 0\n0 1 0 0 1 0 0 0 0 0 0 0 0 1 1 1 0 1 0 0 1 1 0 0 0 0 0 0 0 1 0 0 0 1 1 0 1 0 0 0 1 1 0 0 1 1 1 0\n1 0 1 0 0 1 0 0 1 0 0 0 1 0 1 1 1 0 0 1 1 0 1 1 1 1 1 1 0 0 1 0 1 1 0 1 1 0 0 0 0 1 0 1 0 1 0 0\n0 0 1 1 0 1 0 1 1 0 1 1 0 1 0 0 1 1 0 0 0 0 0 1 1 0 0 1 1 1 0 0 0 0 1 1 1 0 1 1 1 0 1 0 0 0 1 0\n0 0 0 1 0 0 0 0 1 0 0 0 1 1 0 1 0 0 1 0 1 0 0 0 1 1 0 1 0 0 0 1 1 1 0 0 0 1 0 1 0 1 0 1 1 1 0 1\n1 0 1 0 0 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 1 1 0 1 0 1 1 0 0 1 0 0 1 0 0 1 0 1 1 0 0 0 1 0 0 0 0\n1 0 0 0 1 0 0 0 0 1 1 0 0 1 1 1 0 0 0 1 0 0 0 1 1 1 0 1 0 1 0 1 0 1 0 0 1 1 1 1 1 0 0 1 0 1 1 1\n1 1 1 1 1 1 1 0 1 1 1 0 0 1 1 0 0 0 1 0 1 1 0 1 1 0 1 0 1 0 0 0 1 0 1 0 1 0 0 1 1 1 0 0 0 0 0 1\n0 0 0 1 1 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 0 0 1 0 0 0 1 1 1 0 0 0 1 1 1 1 0 1 0 0 1 1 0 0 0 0 0 0\n1 1 0 1 1 0 1 0 0 0 0 1 0 1 0 0 1 1 1 1 0 0 0 0 0 0 1 1 1 0 0 0 1 1 0 0 1 0 0 0 0 0 1 1 0 1 0 0\n0 0 0 1 1 1 1 0 0 1 1 0 0 1 1 0 0 0 0 0 1 0 1 0 1 0 1 1 0 1 1 1 0 1 0 1 0 1 1 1 0 0 1 1 0 0 1 1\n1 0 0 1 0 0 0 0 1 1 1 0 0 0 1 0 0 0 1 1 0 0 0 0 0 0 0 1 0 1 1 0 0 1 1 0 0 1 0 0 0 0 0 0 1 0 0 0\n1 1 0 0 1 1 0 0 1 1 1 1 0 1 0 0 1 1 1 1 0 1 0 1 0 0 0 1 0 0 1 0 1 1 1 1 0 1 0 1 0 0 1 0 0 1 0 0\n1 1 1 0 0 0 1 0 1 0 0 0 1 0 1 1 1 0 0 0 0 1 0 1 0 1 0 1 0 0 0 1 0 0 1 0 1 0 0 1 0 0 0 1 0 0 1 0\n1 0 0 1 0 1 0 0 0 0 1 1 0 0 1 1 0 1 0 0 0 1 1 0 0 0 1 1 1 1 1 0 0 0 0 0 0 1 0 1 1 0 0 1 0 0 0 1",
        expected: "1",
      },
    ],
    hints: [
      "Students are nodes; a 1 in the grid is an edge. You are counting connected pieces.",
      "One approach: for every student not yet placed, explore everyone reachable from them and count one circle.",
      "Another: start with n circles and merge. Each merge of two different circles lowers the count by one.",
      "Because the grid is symmetric, only the cells above the diagonal need checking.",
    ],
    solutions: [
      {
        title: "Depth-first search from every unplaced student",
        order: 1,
        intuition:
          "Pick a student nobody has placed yet: they start a new circle. Explore everyone reachable from them by acquaintance, placing each one. When the exploration ends, that circle is complete.",
        approach: [
          "Keep a placed array.",
          "For each unplaced student, count a circle and run a depth-first search that places everyone reachable.",
          "In the search, a row of the grid lists a student's acquaintances.",
        ],
        code: {
          PYTHON: `def countCircles(knows: List[List[int]]) -> int:
    n = len(knows)
    placed = [False] * n

    def explore(i: int) -> None:
        placed[i] = True
        for j in range(n):
            if knows[i][j] == 1 and not placed[j]:
                explore(j)

    circles = 0
    for i in range(n):
        if not placed[i]:
            circles += 1
            explore(i)
    return circles`,
          JAVA: `class Solution {
    private int[][] knows;
    private boolean[] placed;

    public int countCircles(int[][] knows) {
        this.knows = knows;
        this.placed = new boolean[knows.length];
        int circles = 0;
        for (int i = 0; i < knows.length; i++) {
            if (!placed[i]) {
                circles++;
                explore(i);
            }
        }
        return circles;
    }

    private void explore(int i) {
        placed[i] = true;
        for (int j = 0; j < knows.length; j++) {
            if (knows[i][j] == 1 && !placed[j]) explore(j);
        }
    }
}`,
        },
        timeComplexity: "O(n²) — every cell of the grid is read once",
        spaceComplexity: "O(n)",
        edgeCases: ["A single student.", "Nobody knows anybody: n circles."],
        commonMistakes: [
          "Counting the number of 1s or rows with a 1, instead of connected groups.",
        ],
      },
      {
        title: "Optimal: union-find with a running count",
        order: 2,
        intuition:
          "Begin with n circles of one. Each acquaintance pair merges their circles; if the two were already in the same circle nothing changes, otherwise the count drops by one. Union-find answers 'same circle?' in near-constant time, and only the upper triangle of the symmetric grid needs reading.",
        approach: [
          "Give every student themselves as parent and set circles = n.",
          "For each i < j with knows[i][j] = 1, find both roots.",
          "If the roots differ, link them and decrement circles.",
          "Return circles.",
        ],
        code: {
          PYTHON: `def countCircles(knows: List[List[int]]) -> int:
    n = len(knows)
    parent = list(range(n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    circles = n
    for i in range(n):
        for j in range(i + 1, n):  # symmetric: the upper triangle is enough
            if knows[i][j] == 1:
                a, b = find(i), find(j)
                if a != b:
                    parent[a] = b
                    circles -= 1  # two separate circles just became one
    return circles`,
          JAVA: `class Solution {
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    public int countCircles(int[][] knows) {
        int n = knows.length;
        parent = new int[n];
        for (int i = 0; i < n; i++) parent[i] = i;
        int circles = n;
        for (int i = 0; i < n; i++) {
            for (int j = i + 1; j < n; j++) {
                if (knows[i][j] != 1) continue;
                int a = find(i), b = find(j);
                if (a != b) {
                    parent[a] = b;
                    circles--;
                }
            }
        }
        return circles;
    }
}`,
        },
        timeComplexity: "O(n² · α(n))",
        spaceComplexity: "O(n)",
        edgeCases: [
          "Everyone knows everyone: one circle.",
          "Acquaintance only through a long chain of intermediaries.",
        ],
        commonMistakes: [
          "Decrementing the count for every 1 in the grid, including pairs already in the same circle.",
          "Linking i to j directly instead of linking their roots.",
        ],
      },
    ],
    expectedTime: "O(n²)",
    expectedSpace: "O(n)",
  },

  {
    slug: "surplus-cable",
    title: "The Surplus Cable",
    difficulty: "MEDIUM",
    learningObjective:
      "Detect the edge that closes a cycle with union-find: it is the first edge whose endpoints are already connected.",
    topics: ["graphs"],
    patterns: ["union-find"],
    statement: [
      rich(
        "A campus network links ",
        { code: "n" },
        " buildings, numbered 1 to n, with exactly ",
        { code: "n" },
        " two-way cables. With one cable fewer it would be a tree — every building reachable from every other with no loops — but an installer laid one cable too many."
      ),
      rich(
        { code: "cables[i] = [a, b]" },
        " is the i-th cable laid. Return a cable that can be removed so the network becomes a tree again. Several cables may qualify; return the one that was laid ",
        { strong: "last" },
        ", written exactly as it appears in the input."
      ),
      example(
        "cables = [[1,2],[2,3],[3,4],[1,4],[1,5]]",
        "[1,4]",
        [
          { state: "[1,2] [2,3] [3,4]", note: "each joins two separate groups" },
          {
            state: "[1,4]",
            note: "1 and 4 are already connected via 2 and 3 — this closes a loop",
          },
          {
            state: "loop 1-2-3-4",
            note: "removing any of its four cables works; [1,4] was laid last",
          },
        ],
        "Finding the cable that closes the loop"
      ),
    ],
    constraints: [
      "3 ≤ n = cables.length ≤ 1000",
      "1 ≤ a, b ≤ n and a ≠ b",
      "No two cables join the same pair of buildings.",
      "The cables form a connected network.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["cables"],
      returns: "int[]",
      functionName: "surplusCable",
    },
    tests: [
      { input: "3\n1 2\n2 3\n1 3", expected: "1 3", isSample: true },
      { input: "5\n1 2\n2 3\n3 4\n1 4\n1 5", expected: "1 4", isSample: true },
      { input: "6\n3 4\n1 2\n2 4\n1 3\n2 5\n5 6", expected: "1 3", isSample: true },
      { input: "2\n1 2\n2 1", expected: "2 1" },
      { input: "5\n2 1\n3 1\n4 3\n5 3\n4 5", expected: "4 5" },
      { input: "7\n1 4\n4 2\n2 3\n3 1\n5 1\n6 5\n7 6", expected: "3 1" },
      { input: "5\n1 2\n1 3\n1 4\n1 5\n4 5", expected: "4 5" },
      {
        input:
          "1000\n147 353\n829 786\n401 110\n732 80\n911 206\n997 423\n71 209\n187 660\n602 973\n56 256\n532 852\n416 856\n610 103\n851 947\n104 118\n15 312\n556 258\n871 694\n421 852\n908 907\n642 220\n949 911\n537 216\n711 72\n687 682\n398 212\n738 300\n399 778\n186 259\n787 628\n12 172\n988 956\n480 871\n774 893\n562 366\n479 576\n441 11\n704 416\n1 488\n22 733\n448 720\n494 643\n536 513\n150 61\n505 292\n246 260\n748 807\n612 524\n818 193\n620 986\n89 223\n648 863\n860 928\n469 435\n924 76\n743 699\n894 127\n614 991\n644 935\n911 39\n354 629\n137 492\n575 441\n988 809\n108 707\n366 914\n463 962\n457 563\n786 522\n776 717\n215 478\n288 343\n488 187\n101 190\n314 574\n626 629\n831 298\n930 335\n887 997\n514 380\n151 83\n763 239\n328 845\n747 930\n382 900\n375 162\n885 523\n525 96\n499 363\n779 62\n207 419\n368 897\n867 85\n661 899\n972 265\n805 971\n279 248\n936 308\n237 232\n506 475\n106 714\n790 248\n942 995\n438 90\n864 809\n191 197\n391 643\n819 815\n717 66\n742 909\n614 591\n278 690\n399 396\n388 906\n288 371\n498 136\n717 697\n981 759\n4 712\n577 749\n556 282\n846 417\n949 838\n518 756\n592 202\n594 445\n75 910\n604 536\n580 114\n333 73\n866 646\n796 74\n959 886\n958 655\n100 230\n580 679\n493 930\n489 986\n834 907\n134 122\n130 141\n876 705\n697 476\n40 663\n292 645\n34 584\n573 652\n219 412\n49 50\n205 544\n377 366\n424 314\n823 369\n711 594\n157 785\n584 88\n112 191\n395 733\n68 593\n872 333\n657 565\n341 411\n479 688\n572 767\n60 145\n633 794\n311 605\n75 489\n408 975\n19 129\n330 217\n116 751\n718 254\n326 400\n332 242\n898 85\n973 971\n341 618\n893 947\n761 423\n678 863\n420 5\n162 161\n350 126\n91 440\n741 384\n235 267\n796 347\n791 756\n85 688\n290 673\n516 46\n917 812\n25 32\n415 122\n630 944\n26 11\n519 662\n949 782\n642 741\n314 255\n729 961\n670 857\n257 956\n459 933\n277 470\n167 231\n471 516\n549 214\n141 901\n719 33\n911 608\n386 294\n535 512\n235 162\n265 512\n556 121\n862 807\n410 8\n184 521\n79 757\n789 114\n193 468\n908 654\n360 7\n976 989\n87 890\n443 286\n811 756\n381 84\n315 173\n295 970\n157 971\n508 945\n202 764\n385 266\n264 290\n621 219\n820 302\n284 78\n720 352\n636 382\n896 717\n690 985\n650 648\n238 906\n505 723\n36 575\n544 47\n781 413\n857 948\n791 573\n284 651\n351 778\n811 750\n786 91\n53 339\n863 731\n523 404\n689 998\n106 480\n379 284\n769 634\n609 545\n87 70\n127 678\n527 549\n787 594\n600 857\n109 519\n363 334\n975 324\n770 302\n411 606\n837 143\n957 349\n564 614\n171 546\n646 491\n439 572\n705 444\n174 920\n338 492\n841 999\n569 204\n182 590\n222 793\n649 899\n877 272\n949 152\n140 326\n16 816\n379 697\n269 67\n327 452\n164 778\n314 336\n859 302\n407 60\n586 241\n415 778\n289 560\n644 581\n879 696\n716 533\n202 817\n190 379\n876 877\n904 477\n527 790\n345 228\n578 351\n222 70\n853 983\n601 810\n938 677\n820 463\n902 799\n411 356\n709 718\n618 481\n875 482\n120 454\n677 46\n978 820\n703 302\n748 506\n883 663\n704 92\n986 571\n765 267\n142 757\n623 563\n823 987\n366 960\n173 400\n803 42\n562 690\n710 231\n697 313\n692 192\n97 708\n417 150\n371 669\n745 383\n94 988\n632 400\n235 893\n392 611\n469 768\n548 842\n171 809\n23 808\n441 80\n804 183\n312 324\n348 329\n734 275\n935 522\n105 990\n624 400\n117 786\n314 973\n90 176\n288 35\n746 943\n628 897\n158 749\n548 201\n858 879\n700 147\n919 892\n86 68\n168 15\n210 191\n666 906\n359 866\n936 502\n960 441\n453 142\n649 412\n473 184\n487 279\n978 686\n719 497\n53 638\n852 86\n931 950\n480 997\n288 7\n109 907\n311 473\n331 72\n176 16\n852 394\n977 577\n14 584\n934 308\n754 841\n477 855\n540 569\n180 319\n805 115\n631 522\n813 964\n635 839\n970 22\n306 36\n132 770\n324 70\n439 124\n144 550\n483 441\n628 317\n406 12\n986 59\n240 835\n172 606\n141 612\n548 777\n681 666\n927 329\n994 294\n58 240\n300 484\n820 641\n797 721\n567 321\n742 808\n751 952\n420 762\n689 930\n254 683\n423 615\n326 486\n781 382\n526 568\n211 470\n262 283\n755 881\n979 897\n243 337\n836 178\n559 312\n761 251\n271 125\n180 412\n521 99\n983 485\n339 693\n335 216\n221 674\n808 596\n287 716\n265 931\n930 366\n820 207\n3 105\n503 873\n829 685\n966 161\n707 643\n536 682\n962 860\n919 462\n574 852\n584 461\n756 574\n195 288\n969 44\n76 935\n480 801\n429 96\n757 704\n916 724\n525 565\n517 857\n105 273\n823 691\n742 656\n90 526\n28 176\n585 269\n390 276\n356 303\n181 897\n472 242\n585 144\n735 260\n36 281\n440 906\n864 239\n829 367\n3 283\n906 983\n273 784\n312 274\n920 852\n691 372\n996 749\n555 448\n248 701\n935 646\n676 656\n888 116\n821 349\n91 196\n572 339\n62 91\n446 925\n98 666\n296 423\n312 446\n151 193\n450 592\n144 376\n183 143\n425 375\n876 33\n845 139\n298 185\n9 90\n280 105\n960 10\n97 971\n272 672\n136 912\n338 874\n366 515\n342 959\n757 381\n665 476\n159 981\n15 300\n781 386\n467 551\n989 127\n301 775\n271 816\n473 849\n45 332\n200 824\n727 93\n808 117\n265 675\n640 415\n658 574\n594 5\n154 922\n639 215\n702 465\n950 432\n429 634\n213 628\n374 913\n409 767\n783 588\n357 967\n270 624\n780 668\n554 106\n571 104\n874 974\n587 318\n298 402\n143 443\n873 683\n481 891\n41 79\n326 810\n476 339\n105 21\n50 557\n333 431\n229 567\n175 356\n226 103\n492 361\n4 552\n874 531\n921 274\n183 957\n571 697\n411 635\n414 370\n152 244\n269 843\n470 865\n895 183\n804 13\n784 236\n135 631\n100 507\n31 264\n535 56\n29 918\n366 166\n643 418\n613 682\n373 945\n622 942\n981 218\n932 264\n875 598\n663 284\n931 627\n697 208\n116 201\n8 237\n80 940\n107 314\n826 805\n875 418\n478 802\n312 196\n823 389\n906 177\n137 752\n230 900\n441 412\n85 289\n442 444\n309 571\n635 795\n902 786\n339 191\n311 617\n212 711\n362 427\n503 458\n955 335\n606 527\n120 30\n73 562\n683 465\n273 543\n393 753\n538 53\n156 723\n869 846\n756 105\n941 101\n70 456\n968 663\n787 454\n978 780\n854 629\n825 732\n440 697\n263 787\n266 42\n765 841\n541 50\n662 113\n340 553\n247 915\n497 291\n338 730\n908 354\n711 820\n465 937\n929 138\n397 561\n126 871\n795 547\n706 612\n373 635\n198 990\n285 783\n805 919\n773 651\n133 128\n242 447\n17 373\n405 365\n502 169\n848 595\n574 705\n967 12\n339 351\n24 898\n189 481\n178 237\n502 48\n880 425\n869 69\n170 37\n378 244\n997 427\n439 340\n148 579\n165 876\n318 492\n184 743\n176 196\n492 393\n541 574\n981 876\n393 527\n393 589\n836 704\n885 655\n217 786\n434 312\n687 185\n466 4\n91 960\n778 282\n664 344\n174 744\n624 37\n612 474\n176 819\n704 463\n827 242\n556 722\n60 454\n393 203\n878 79\n525 671\n574 583\n659 136\n345 304\n370 59\n383 136\n383 870\n731 822\n703 252\n832 190\n452 993\n82 746\n999 963\n365 174\n242 749\n635 18\n188 944\n412 470\n464 736\n6 675\n66 884\n348 433\n931 574\n224 300\n916 511\n998 51\n495 325\n683 460\n771 452\n245 519\n772 233\n728 100\n655 697\n682 950\n251 882\n105 240\n500 245\n313 95\n91 603\n146 260\n488 855\n219 38\n322 354\n558 412\n549 52\n310 510\n811 758\n800 9\n469 857\n297 949\n571 610\n365 457\n392 15\n969 7\n881 760\n940 128\n558 737\n695 618\n863 28\n590 185\n109 901\n32 690\n81 559\n363 646\n273 984\n852 440\n697 679\n77 104\n284 692\n827 422\n268 211\n698 382\n991 519\n656 727\n986 293\n812 253\n336 667\n148 382\n9 501\n616 105\n622 403\n847 436\n736 937\n155 375\n151 117\n35 509\n644 961\n572 288\n100 355\n562 917\n191 552\n328 619\n54 787\n721 151\n467 455\n606 196\n311 555\n130 27\n606 239\n582 546\n326 857\n592 522\n512 664\n684 746\n942 73\n677 149\n982 79\n463 726\n992 25\n15 775\n930 980\n465 144\n677 855\n215 545\n440 316\n348 830\n690 926\n589 833\n713 520\n364 239\n379 374\n109 869\n100 467\n533 844\n130 530\n131 886\n535 855\n637 487\n721 194\n506 926\n451 803\n869 339\n467 261\n703 372\n346 850\n490 267\n123 519\n861 933\n467 929\n430 664\n946 192\n542 516\n900 690\n713 706\n260 589\n571 428\n790 700\n423 28\n869 320\n834 850\n511 803\n527 634\n72 755\n358 237\n853 20\n491 163\n997 200\n501 347\n454 696\n625 175\n704 786\n227 415\n120 63\n8 504\n37 647\n918 786\n605 697\n101 828\n224 179\n566 949\n241 425\n571 323\n199 191\n1000 455\n42 144\n167 411\n541 55\n900 905\n946 102\n3 674\n207 653\n284 746\n187 847\n723 117\n160 292\n34 454\n496 902\n299 600\n89 630\n316 534\n569 574\n117 707\n561 220\n408 529\n991 119\n382 437\n959 960\n958 225\n761 788\n191 276\n361 715\n111 288\n915 354\n622 307\n326 630\n517 794\n783 749\n622 243\n345 895\n552 798\n380 412\n85 957\n643 328\n369 64\n861 935\n440 144\n931 597\n469 906\n440 47\n45 964\n957 242\n790 290\n236 814\n744 250\n449 538\n607 470\n954 644\n643 110\n644 229\n838 153\n951 262\n740 674\n840 624\n290 378\n600 235\n956 234\n2 806\n233 144\n574 957\n595 501\n485 903\n889 427\n387 768\n209 91\n912 305\n154 47\n135 739\n923 31\n671 539\n186 867\n15 43\n426 853\n528 968\n734 287\n308 965\n589 249\n733 846\n548 703\n725 601\n284 220\n946 19\n9 533\n679 939\n599 527\n120 993\n57 280\n440 545\n91 953\n92 912\n703 949\n90 502\n766 44\n43 570\n310 152\n868 677\n42 325\n967 65\n433 196\n2 157\n340 792\n535 680",
        expected: "703 949",
      },
      {
        input:
          "800\n200 314\n247 160\n215 82\n179 308\n534 358\n716 50\n405 160\n458 344\n562 712\n155 657\n556 537\n395 642\n599 527\n241 773\n658 585\n616 413\n60 750\n62 779\n42 796\n128 204\n333 631\n618 422\n325 369\n635 428\n318 121\n158 35\n618 792\n566 98\n41 516\n242 177\n13 293\n394 352\n615 237\n99 259\n172 185\n449 179\n581 515\n279 342\n489 576\n573 470\n410 603\n121 401\n46 193\n61 348\n626 282\n793 41\n481 470\n259 712\n739 284\n689 747\n287 714\n512 233\n751 472\n770 627\n680 508\n557 128\n452 746\n483 279\n715 739\n751 231\n580 441\n741 668\n752 394\n6 159\n609 703\n392 107\n272 566\n356 342\n586 713\n131 111\n659 139\n256 49\n719 96\n740 421\n563 781\n164 598\n756 254\n20 487\n227 290\n25 317\n569 201\n252 188\n712 781\n268 181\n209 798\n287 440\n381 330\n249 308\n170 107\n210 487\n619 201\n120 365\n699 693\n251 369\n186 770\n501 416\n571 42\n444 624\n165 136\n336 11\n754 488\n649 431\n93 29\n300 58\n283 775\n597 94\n232 385\n413 634\n453 758\n360 784\n678 677\n50 215\n720 595\n425 259\n440 579\n735 763\n131 314\n315 797\n162 174\n57 338\n534 439\n475 709\n92 156\n326 644\n403 790\n359 55\n182 659\n161 686\n16 311\n280 772\n186 464\n781 169\n373 64\n371 316\n725 88\n212 250\n65 620\n458 366\n739 692\n453 421\n572 390\n571 419\n512 724\n618 741\n121 776\n650 271\n149 245\n405 624\n707 83\n598 23\n800 710\n685 359\n598 197\n546 621\n22 537\n688 200\n469 655\n338 781\n332 116\n620 459\n110 232\n708 652\n195 394\n16 540\n25 558\n226 396\n213 172\n599 562\n8 666\n753 19\n254 513\n788 650\n757 667\n9 615\n100 391\n571 609\n144 167\n555 412\n306 67\n152 367\n581 245\n321 177\n373 723\n25 719\n448 683\n522 610\n172 543\n702 605\n235 580\n87 547\n520 363\n526 751\n494 193\n448 122\n502 143\n135 169\n699 398\n493 539\n370 369\n725 726\n222 376\n363 532\n766 731\n90 698\n369 47\n415 134\n730 65\n722 167\n400 294\n744 188\n65 408\n738 98\n604 537\n558 145\n329 165\n690 781\n172 598\n393 425\n516 551\n744 445\n132 325\n442 652\n457 406\n192 78\n367 148\n46 760\n512 687\n1 277\n512 751\n3 711\n381 671\n212 254\n102 459\n778 483\n486 619\n117 503\n647 527\n589 435\n575 670\n583 278\n81 736\n657 438\n524 41\n748 85\n397 565\n158 524\n108 609\n437 204\n133 528\n463 558\n458 378\n798 295\n574 305\n616 68\n416 472\n169 703\n273 337\n435 784\n698 599\n445 240\n270 130\n223 18\n446 465\n472 229\n754 329\n205 640\n726 276\n601 328\n414 553\n73 568\n329 31\n92 490\n773 165\n79 518\n675 66\n259 593\n358 248\n468 599\n345 487\n72 309\n686 234\n370 106\n37 58\n427 651\n75 631\n563 679\n783 259\n63 593\n698 429\n205 732\n24 757\n98 478\n156 339\n200 349\n15 263\n559 300\n509 366\n750 472\n221 618\n81 129\n495 297\n168 276\n781 491\n56 110\n685 267\n671 387\n115 353\n549 565\n15 695\n564 697\n528 26\n151 797\n198 325\n291 44\n777 96\n468 743\n477 497\n283 25\n214 574\n447 474\n531 636\n80 557\n474 466\n35 375\n392 719\n485 703\n627 65\n211 657\n420 634\n142 72\n781 386\n620 313\n310 438\n428 718\n311 747\n196 4\n215 62\n678 505\n177 8\n757 458\n717 400\n443 186\n57 704\n180 605\n28 48\n95 266\n112 257\n544 109\n522 284\n620 594\n285 74\n380 103\n217 468\n657 288\n257 542\n468 43\n207 17\n377 175\n770 69\n621 364\n514 688\n435 671\n407 159\n358 425\n125 472\n502 729\n300 66\n188 612\n621 728\n403 593\n771 27\n121 595\n384 15\n460 238\n314 278\n219 166\n143 297\n517 551\n3 768\n506 386\n82 621\n702 343\n727 47\n293 177\n641 309\n367 762\n397 299\n351 212\n321 239\n797 11\n557 153\n257 510\n588 286\n323 587\n89 39\n611 710\n81 623\n609 81\n52 141\n432 147\n74 634\n390 51\n390 479\n382 407\n333 266\n266 574\n74 455\n196 472\n660 74\n552 561\n30 338\n36 766\n140 685\n452 172\n566 591\n329 2\n138 7\n87 470\n230 425\n692 630\n235 251\n486 76\n643 432\n667 64\n400 719\n648 764\n503 410\n587 374\n535 107\n714 503\n150 679\n790 567\n639 163\n100 783\n719 749\n267 592\n269 685\n321 545\n332 521\n663 794\n600 254\n265 623\n418 479\n458 110\n487 706\n664 306\n84 227\n578 682\n474 472\n352 18\n286 511\n791 143\n191 131\n147 392\n473 413\n261 164\n492 296\n183 599\n491 71\n753 92\n282 749\n117 392\n661 548\n19 696\n782 667\n208 565\n471 124\n430 319\n753 656\n396 65\n479 121\n507 236\n707 337\n242 366\n74 389\n800 355\n512 699\n548 190\n523 9\n524 431\n314 326\n12 373\n10 596\n621 742\n231 748\n442 688\n612 130\n262 710\n783 434\n416 496\n632 46\n5 740\n638 215\n591 456\n194 588\n472 519\n79 694\n201 242\n316 648\n392 87\n367 94\n212 344\n629 557\n259 47\n87 84\n305 374\n185 585\n146 175\n166 367\n40 557\n107 210\n188 238\n178 257\n94 165\n397 274\n443 187\n117 633\n416 380\n397 794\n618 156\n23 312\n465 320\n74 156\n300 253\n744 218\n203 236\n105 690\n241 159\n480 400\n643 281\n347 424\n512 61\n738 344\n242 755\n304 466\n339 457\n40 189\n141 479\n270 346\n363 344\n653 688\n761 463\n443 292\n107 550\n239 32\n411 697\n697 483\n643 33\n598 562\n749 298\n409 169\n665 714\n397 404\n85 502\n70 721\n593 642\n757 780\n235 498\n345 785\n332 745\n554 507\n589 255\n309 484\n34 483\n719 781\n72 637\n211 136\n60 582\n363 795\n436 153\n676 670\n124 571\n591 175\n416 392\n220 241\n87 627\n424 750\n655 546\n184 339\n171 502\n645 792\n207 324\n11 331\n14 458\n347 451\n648 359\n787 392\n322 379\n575 677\n212 635\n176 100\n361 2\n181 318\n197 126\n693 615\n113 729\n296 372\n11 398\n369 262\n688 357\n475 277\n682 86\n167 276\n383 124\n162 203\n62 412\n117 648\n741 789\n638 276\n617 520\n318 574\n228 595\n677 737\n101 699\n388 196\n673 772\n620 516\n476 370\n94 608\n680 184\n507 742\n449 128\n636 58\n353 251\n243 493\n93 199\n799 313\n414 589\n394 739\n624 28\n413 446\n705 493\n378 314\n224 781\n461 770\n202 449\n335 567\n167 123\n322 276\n701 624\n466 450\n677 434\n504 231\n242 672\n259 178\n193 399\n314 338\n425 188\n725 127\n397 192\n340 291\n356 771\n781 352\n136 772\n552 544\n365 778\n781 165\n3 95\n672 533\n362 160\n45 100\n769 279\n342 149\n384 627\n275 640\n271 38\n584 257\n367 529\n225 108\n338 405\n622 207\n198 596\n574 87\n303 651\n537 646\n67 580\n367 303\n628 484\n246 238\n700 405\n570 150\n614 537\n188 91\n593 414\n202 759\n314 179\n104 117\n454 506\n49 711\n783 691\n21 139\n574 682\n286 750\n264 117\n477 128\n376 705\n514 482\n499 321\n156 654\n661 177\n553 605\n215 77\n277 483\n453 674\n273 574\n462 575\n340 783\n314 311\n637 681\n505 341\n541 27\n778 713\n141 154\n701 258\n604 301\n157 547\n53 518\n165 530\n780 234\n296 179\n354 277\n276 54\n448 580\n30 58\n47 430\n774 527\n694 598\n607 96\n142 415\n39 648\n296 606\n612 528\n165 142\n307 660\n206 366\n616 613\n169 173\n621 618\n366 73\n178 97\n404 767\n741 402\n276 163\n500 757\n538 769\n417 69\n267 590\n751 271\n598 618\n350 518\n659 377\n315 536\n179 493\n552 16\n596 426\n479 786\n710 368\n46 738\n293 433\n642 602\n611 244\n488 525\n509 556\n209 200\n216 286\n114 340\n302 8\n334 285\n118 561\n369 342\n467 389\n275 662\n356 332\n721 300\n141 137\n119 607\n765 701\n693 7\n289 458\n625 203\n712 758\n156 260\n684 207\n560 792\n192 390\n80 733\n327 378\n406 734\n607 199\n233 735\n724 577\n36 260\n669 459\n423 280\n207 744\n494 59\n576 378\n601 605\n640 156\n471 264",
        expected: "471 264",
      },
    ],
    hints: [
      "A tree with n nodes has n − 1 edges. One extra edge creates exactly one loop.",
      "Any cable on that loop can be removed. You want the one that appears last in the input.",
      "Add cables one at a time. The moment a cable joins two buildings that are already connected, it has closed the loop.",
      "Every other loop cable was added before it, so that cable is also the last loop cable. Union-find tells you if two buildings are already connected.",
    ],
    solutions: [
      {
        title: "Try removing cables from the end",
        order: 1,
        intuition:
          "Removing a cable leaves n − 1 cables, which form a tree exactly when they keep the network connected. So try cables from last to first, and return the first whose removal leaves every building reachable.",
        approach: [
          "For i from the last cable down to the first:",
          "Build adjacency lists from every cable except i.",
          "Search from building 1; if all n buildings are reached, return cable i.",
        ],
        code: {
          PYTHON: `def surplusCable(cables: List[List[int]]) -> List[int]:
    n = len(cables)
    for skip in range(n - 1, -1, -1):
        neighbours = [[] for _ in range(n + 1)]
        for i, (a, b) in enumerate(cables):
            if i != skip:
                neighbours[a].append(b)
                neighbours[b].append(a)
        seen = {1}
        stack = [1]
        while stack:
            u = stack.pop()
            for v in neighbours[u]:
                if v not in seen:
                    seen.add(v)
                    stack.append(v)
        if len(seen) == n:
            return cables[skip]
    return []`,
          JAVA: `class Solution {
    public int[] surplusCable(int[][] cables) {
        int n = cables.length;
        for (int skip = n - 1; skip >= 0; skip--) {
            List<List<Integer>> neighbours = new ArrayList<>();
            for (int i = 0; i <= n; i++) neighbours.add(new ArrayList<>());
            for (int i = 0; i < n; i++) {
                if (i == skip) continue;
                neighbours.get(cables[i][0]).add(cables[i][1]);
                neighbours.get(cables[i][1]).add(cables[i][0]);
            }
            boolean[] seen = new boolean[n + 1];
            seen[1] = true;
            int count = 1;
            ArrayDeque<Integer> stack = new ArrayDeque<>();
            stack.push(1);
            while (!stack.isEmpty()) {
                int u = stack.pop();
                for (int v : neighbours.get(u)) {
                    if (!seen[v]) {
                        seen[v] = true;
                        count++;
                        stack.push(v);
                    }
                }
            }
            if (count == n) return cables[skip];
        }
        return new int[0];
    }
}`,
        },
        timeComplexity: "O(n²)",
        spaceComplexity: "O(n)",
        edgeCases: ["The loop includes the very last cable."],
        commonMistakes: [
          "Trying cables from first to last, which returns the earliest loop cable instead of the latest.",
        ],
      },
      {
        title: "Optimal: union-find, stop at the first redundant cable",
        order: 2,
        intuition:
          "Lay the cables again in order, tracking which buildings are already connected. Before the loop closes, every cable joins two separate groups. The cable that closes it is the first one whose ends are already connected — and since every other cable on the loop was laid earlier, it is also the last loop cable, exactly the one asked for.",
        approach: [
          "Give buildings 1..n themselves as parent.",
          "For each cable in order, find the roots of both ends.",
          "If the roots match, this cable closes the loop: return it.",
          "Otherwise link the roots and continue.",
        ],
        code: {
          PYTHON: `def surplusCable(cables: List[List[int]]) -> List[int]:
    parent = list(range(len(cables) + 1))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for a, b in cables:
        root_a, root_b = find(a), find(b)
        if root_a == root_b:
            # Already connected: this cable closes the loop, and every other
            # loop cable was laid before it.
            return [a, b]
        parent[root_a] = root_b

    return []`,
          JAVA: `class Solution {
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    public int[] surplusCable(int[][] cables) {
        parent = new int[cables.length + 1];
        for (int i = 0; i < parent.length; i++) parent[i] = i;
        for (int[] cable : cables) {
            int ra = find(cable[0]), rb = find(cable[1]);
            if (ra == rb) return new int[]{cable[0], cable[1]};
            parent[ra] = rb;
        }
        return new int[0];
    }
}`,
        },
        timeComplexity: "O(n · α(n))",
        spaceComplexity: "O(n)",
        edgeCases: [
          "The loop has only three buildings.",
          "The loop runs through building 1 and the highest-numbered building.",
          "Cables listed with their ends in either order.",
        ],
        commonMistakes: [
          "Returning the pair sorted, when the input order of the two ends must be kept.",
          "Sizing the parent array n instead of n + 1 for 1-based labels.",
        ],
      },
    ],
    expectedTime: "O(n)",
    expectedSpace: "O(n)",
  },

  {
    slug: "curriculum-feasible",
    title: "Can the Curriculum Be Finished?",
    difficulty: "MEDIUM",
    learningObjective:
      "Detect a cycle in a directed graph with Kahn's algorithm: if peeling off zero-in-degree nodes cannot remove every node, a cycle remains.",
    topics: ["graphs"],
    patterns: ["breadth-first-search", "depth-first-search"],
    statement: [
      rich(
        "A bootcamp offers ",
        { code: "n" },
        " modules numbered 0 to n − 1. Each pair ",
        { code: "[module, required]" },
        " in ",
        { code: "prereqs" },
        " says that ",
        { code: "required" },
        " must be completed before ",
        { code: "module" },
        " can start."
      ),
      para(
        "A learner takes one module at a time. Return true if some order lets them complete every module, and false otherwise."
      ),
      example(
        "n = 4, prereqs = [[1,0],[2,1],[3,1]]",
        "true",
        [
          { state: "ready {0}", note: "only module 0 has no requirements" },
          { state: "take 0", note: "module 1 is now ready" },
          { state: "take 1", note: "modules 2 and 3 are now ready" },
          { state: "take 2, 3", note: "all four completed" },
        ],
        "Taking modules as they become ready"
      ),
    ],
    constraints: [
      "1 ≤ n ≤ 1000",
      "0 ≤ prereqs.length ≤ 1500",
      "0 ≤ module, required < n",
      "A pair may name the same module twice, which makes that module impossible.",
    ],
    signature: {
      params: ["int", "int[][]"],
      paramNames: ["n", "prereqs"],
      returns: "bool",
      functionName: "canFinishAll",
    },
    tests: [
      { input: "4\n3\n1 0\n2 1\n3 1", expected: "true", isSample: true },
      {
        input: "3\n3\n0 1\n1 2\n2 0",
        expected: "false",
        isSample: true,
        explanation:
          "Course 0 needs 1, 1 needs 2, and 2 needs 0: a loop that no order can satisfy.",
      },
      { input: "2\n0", expected: "true", isSample: true },
      { input: "1\n0", expected: "true" },
      { input: "1\n1\n0 0", expected: "false" },
      { input: "5\n5\n1 0\n2 0\n3 1\n3 2\n4 3", expected: "true" },
      { input: "6\n5\n1 0\n2 1\n0 2\n4 3\n5 4", expected: "false" },
      { input: "4\n2\n1 0\n0 1", expected: "false" },
      {
        input:
          "1000\n999\n1 0\n2 1\n3 2\n4 3\n5 4\n6 5\n7 6\n8 7\n9 8\n10 9\n11 10\n12 11\n13 12\n14 13\n15 14\n16 15\n17 16\n18 17\n19 18\n20 19\n21 20\n22 21\n23 22\n24 23\n25 24\n26 25\n27 26\n28 27\n29 28\n30 29\n31 30\n32 31\n33 32\n34 33\n35 34\n36 35\n37 36\n38 37\n39 38\n40 39\n41 40\n42 41\n43 42\n44 43\n45 44\n46 45\n47 46\n48 47\n49 48\n50 49\n51 50\n52 51\n53 52\n54 53\n55 54\n56 55\n57 56\n58 57\n59 58\n60 59\n61 60\n62 61\n63 62\n64 63\n65 64\n66 65\n67 66\n68 67\n69 68\n70 69\n71 70\n72 71\n73 72\n74 73\n75 74\n76 75\n77 76\n78 77\n79 78\n80 79\n81 80\n82 81\n83 82\n84 83\n85 84\n86 85\n87 86\n88 87\n89 88\n90 89\n91 90\n92 91\n93 92\n94 93\n95 94\n96 95\n97 96\n98 97\n99 98\n100 99\n101 100\n102 101\n103 102\n104 103\n105 104\n106 105\n107 106\n108 107\n109 108\n110 109\n111 110\n112 111\n113 112\n114 113\n115 114\n116 115\n117 116\n118 117\n119 118\n120 119\n121 120\n122 121\n123 122\n124 123\n125 124\n126 125\n127 126\n128 127\n129 128\n130 129\n131 130\n132 131\n133 132\n134 133\n135 134\n136 135\n137 136\n138 137\n139 138\n140 139\n141 140\n142 141\n143 142\n144 143\n145 144\n146 145\n147 146\n148 147\n149 148\n150 149\n151 150\n152 151\n153 152\n154 153\n155 154\n156 155\n157 156\n158 157\n159 158\n160 159\n161 160\n162 161\n163 162\n164 163\n165 164\n166 165\n167 166\n168 167\n169 168\n170 169\n171 170\n172 171\n173 172\n174 173\n175 174\n176 175\n177 176\n178 177\n179 178\n180 179\n181 180\n182 181\n183 182\n184 183\n185 184\n186 185\n187 186\n188 187\n189 188\n190 189\n191 190\n192 191\n193 192\n194 193\n195 194\n196 195\n197 196\n198 197\n199 198\n200 199\n201 200\n202 201\n203 202\n204 203\n205 204\n206 205\n207 206\n208 207\n209 208\n210 209\n211 210\n212 211\n213 212\n214 213\n215 214\n216 215\n217 216\n218 217\n219 218\n220 219\n221 220\n222 221\n223 222\n224 223\n225 224\n226 225\n227 226\n228 227\n229 228\n230 229\n231 230\n232 231\n233 232\n234 233\n235 234\n236 235\n237 236\n238 237\n239 238\n240 239\n241 240\n242 241\n243 242\n244 243\n245 244\n246 245\n247 246\n248 247\n249 248\n250 249\n251 250\n252 251\n253 252\n254 253\n255 254\n256 255\n257 256\n258 257\n259 258\n260 259\n261 260\n262 261\n263 262\n264 263\n265 264\n266 265\n267 266\n268 267\n269 268\n270 269\n271 270\n272 271\n273 272\n274 273\n275 274\n276 275\n277 276\n278 277\n279 278\n280 279\n281 280\n282 281\n283 282\n284 283\n285 284\n286 285\n287 286\n288 287\n289 288\n290 289\n291 290\n292 291\n293 292\n294 293\n295 294\n296 295\n297 296\n298 297\n299 298\n300 299\n301 300\n302 301\n303 302\n304 303\n305 304\n306 305\n307 306\n308 307\n309 308\n310 309\n311 310\n312 311\n313 312\n314 313\n315 314\n316 315\n317 316\n318 317\n319 318\n320 319\n321 320\n322 321\n323 322\n324 323\n325 324\n326 325\n327 326\n328 327\n329 328\n330 329\n331 330\n332 331\n333 332\n334 333\n335 334\n336 335\n337 336\n338 337\n339 338\n340 339\n341 340\n342 341\n343 342\n344 343\n345 344\n346 345\n347 346\n348 347\n349 348\n350 349\n351 350\n352 351\n353 352\n354 353\n355 354\n356 355\n357 356\n358 357\n359 358\n360 359\n361 360\n362 361\n363 362\n364 363\n365 364\n366 365\n367 366\n368 367\n369 368\n370 369\n371 370\n372 371\n373 372\n374 373\n375 374\n376 375\n377 376\n378 377\n379 378\n380 379\n381 380\n382 381\n383 382\n384 383\n385 384\n386 385\n387 386\n388 387\n389 388\n390 389\n391 390\n392 391\n393 392\n394 393\n395 394\n396 395\n397 396\n398 397\n399 398\n400 399\n401 400\n402 401\n403 402\n404 403\n405 404\n406 405\n407 406\n408 407\n409 408\n410 409\n411 410\n412 411\n413 412\n414 413\n415 414\n416 415\n417 416\n418 417\n419 418\n420 419\n421 420\n422 421\n423 422\n424 423\n425 424\n426 425\n427 426\n428 427\n429 428\n430 429\n431 430\n432 431\n433 432\n434 433\n435 434\n436 435\n437 436\n438 437\n439 438\n440 439\n441 440\n442 441\n443 442\n444 443\n445 444\n446 445\n447 446\n448 447\n449 448\n450 449\n451 450\n452 451\n453 452\n454 453\n455 454\n456 455\n457 456\n458 457\n459 458\n460 459\n461 460\n462 461\n463 462\n464 463\n465 464\n466 465\n467 466\n468 467\n469 468\n470 469\n471 470\n472 471\n473 472\n474 473\n475 474\n476 475\n477 476\n478 477\n479 478\n480 479\n481 480\n482 481\n483 482\n484 483\n485 484\n486 485\n487 486\n488 487\n489 488\n490 489\n491 490\n492 491\n493 492\n494 493\n495 494\n496 495\n497 496\n498 497\n499 498\n500 499\n501 500\n502 501\n503 502\n504 503\n505 504\n506 505\n507 506\n508 507\n509 508\n510 509\n511 510\n512 511\n513 512\n514 513\n515 514\n516 515\n517 516\n518 517\n519 518\n520 519\n521 520\n522 521\n523 522\n524 523\n525 524\n526 525\n527 526\n528 527\n529 528\n530 529\n531 530\n532 531\n533 532\n534 533\n535 534\n536 535\n537 536\n538 537\n539 538\n540 539\n541 540\n542 541\n543 542\n544 543\n545 544\n546 545\n547 546\n548 547\n549 548\n550 549\n551 550\n552 551\n553 552\n554 553\n555 554\n556 555\n557 556\n558 557\n559 558\n560 559\n561 560\n562 561\n563 562\n564 563\n565 564\n566 565\n567 566\n568 567\n569 568\n570 569\n571 570\n572 571\n573 572\n574 573\n575 574\n576 575\n577 576\n578 577\n579 578\n580 579\n581 580\n582 581\n583 582\n584 583\n585 584\n586 585\n587 586\n588 587\n589 588\n590 589\n591 590\n592 591\n593 592\n594 593\n595 594\n596 595\n597 596\n598 597\n599 598\n600 599\n601 600\n602 601\n603 602\n604 603\n605 604\n606 605\n607 606\n608 607\n609 608\n610 609\n611 610\n612 611\n613 612\n614 613\n615 614\n616 615\n617 616\n618 617\n619 618\n620 619\n621 620\n622 621\n623 622\n624 623\n625 624\n626 625\n627 626\n628 627\n629 628\n630 629\n631 630\n632 631\n633 632\n634 633\n635 634\n636 635\n637 636\n638 637\n639 638\n640 639\n641 640\n642 641\n643 642\n644 643\n645 644\n646 645\n647 646\n648 647\n649 648\n650 649\n651 650\n652 651\n653 652\n654 653\n655 654\n656 655\n657 656\n658 657\n659 658\n660 659\n661 660\n662 661\n663 662\n664 663\n665 664\n666 665\n667 666\n668 667\n669 668\n670 669\n671 670\n672 671\n673 672\n674 673\n675 674\n676 675\n677 676\n678 677\n679 678\n680 679\n681 680\n682 681\n683 682\n684 683\n685 684\n686 685\n687 686\n688 687\n689 688\n690 689\n691 690\n692 691\n693 692\n694 693\n695 694\n696 695\n697 696\n698 697\n699 698\n700 699\n701 700\n702 701\n703 702\n704 703\n705 704\n706 705\n707 706\n708 707\n709 708\n710 709\n711 710\n712 711\n713 712\n714 713\n715 714\n716 715\n717 716\n718 717\n719 718\n720 719\n721 720\n722 721\n723 722\n724 723\n725 724\n726 725\n727 726\n728 727\n729 728\n730 729\n731 730\n732 731\n733 732\n734 733\n735 734\n736 735\n737 736\n738 737\n739 738\n740 739\n741 740\n742 741\n743 742\n744 743\n745 744\n746 745\n747 746\n748 747\n749 748\n750 749\n751 750\n752 751\n753 752\n754 753\n755 754\n756 755\n757 756\n758 757\n759 758\n760 759\n761 760\n762 761\n763 762\n764 763\n765 764\n766 765\n767 766\n768 767\n769 768\n770 769\n771 770\n772 771\n773 772\n774 773\n775 774\n776 775\n777 776\n778 777\n779 778\n780 779\n781 780\n782 781\n783 782\n784 783\n785 784\n786 785\n787 786\n788 787\n789 788\n790 789\n791 790\n792 791\n793 792\n794 793\n795 794\n796 795\n797 796\n798 797\n799 798\n800 799\n801 800\n802 801\n803 802\n804 803\n805 804\n806 805\n807 806\n808 807\n809 808\n810 809\n811 810\n812 811\n813 812\n814 813\n815 814\n816 815\n817 816\n818 817\n819 818\n820 819\n821 820\n822 821\n823 822\n824 823\n825 824\n826 825\n827 826\n828 827\n829 828\n830 829\n831 830\n832 831\n833 832\n834 833\n835 834\n836 835\n837 836\n838 837\n839 838\n840 839\n841 840\n842 841\n843 842\n844 843\n845 844\n846 845\n847 846\n848 847\n849 848\n850 849\n851 850\n852 851\n853 852\n854 853\n855 854\n856 855\n857 856\n858 857\n859 858\n860 859\n861 860\n862 861\n863 862\n864 863\n865 864\n866 865\n867 866\n868 867\n869 868\n870 869\n871 870\n872 871\n873 872\n874 873\n875 874\n876 875\n877 876\n878 877\n879 878\n880 879\n881 880\n882 881\n883 882\n884 883\n885 884\n886 885\n887 886\n888 887\n889 888\n890 889\n891 890\n892 891\n893 892\n894 893\n895 894\n896 895\n897 896\n898 897\n899 898\n900 899\n901 900\n902 901\n903 902\n904 903\n905 904\n906 905\n907 906\n908 907\n909 908\n910 909\n911 910\n912 911\n913 912\n914 913\n915 914\n916 915\n917 916\n918 917\n919 918\n920 919\n921 920\n922 921\n923 922\n924 923\n925 924\n926 925\n927 926\n928 927\n929 928\n930 929\n931 930\n932 931\n933 932\n934 933\n935 934\n936 935\n937 936\n938 937\n939 938\n940 939\n941 940\n942 941\n943 942\n944 943\n945 944\n946 945\n947 946\n948 947\n949 948\n950 949\n951 950\n952 951\n953 952\n954 953\n955 954\n956 955\n957 956\n958 957\n959 958\n960 959\n961 960\n962 961\n963 962\n964 963\n965 964\n966 965\n967 966\n968 967\n969 968\n970 969\n971 970\n972 971\n973 972\n974 973\n975 974\n976 975\n977 976\n978 977\n979 978\n980 979\n981 980\n982 981\n983 982\n984 983\n985 984\n986 985\n987 986\n988 987\n989 988\n990 989\n991 990\n992 991\n993 992\n994 993\n995 994\n996 995\n997 996\n998 997\n999 998",
        expected: "true",
      },
      {
        input:
          "1000\n1000\n1 0\n2 1\n3 2\n4 3\n5 4\n6 5\n7 6\n8 7\n9 8\n10 9\n11 10\n12 11\n13 12\n14 13\n15 14\n16 15\n17 16\n18 17\n19 18\n20 19\n21 20\n22 21\n23 22\n24 23\n25 24\n26 25\n27 26\n28 27\n29 28\n30 29\n31 30\n32 31\n33 32\n34 33\n35 34\n36 35\n37 36\n38 37\n39 38\n40 39\n41 40\n42 41\n43 42\n44 43\n45 44\n46 45\n47 46\n48 47\n49 48\n50 49\n51 50\n52 51\n53 52\n54 53\n55 54\n56 55\n57 56\n58 57\n59 58\n60 59\n61 60\n62 61\n63 62\n64 63\n65 64\n66 65\n67 66\n68 67\n69 68\n70 69\n71 70\n72 71\n73 72\n74 73\n75 74\n76 75\n77 76\n78 77\n79 78\n80 79\n81 80\n82 81\n83 82\n84 83\n85 84\n86 85\n87 86\n88 87\n89 88\n90 89\n91 90\n92 91\n93 92\n94 93\n95 94\n96 95\n97 96\n98 97\n99 98\n100 99\n101 100\n102 101\n103 102\n104 103\n105 104\n106 105\n107 106\n108 107\n109 108\n110 109\n111 110\n112 111\n113 112\n114 113\n115 114\n116 115\n117 116\n118 117\n119 118\n120 119\n121 120\n122 121\n123 122\n124 123\n125 124\n126 125\n127 126\n128 127\n129 128\n130 129\n131 130\n132 131\n133 132\n134 133\n135 134\n136 135\n137 136\n138 137\n139 138\n140 139\n141 140\n142 141\n143 142\n144 143\n145 144\n146 145\n147 146\n148 147\n149 148\n150 149\n151 150\n152 151\n153 152\n154 153\n155 154\n156 155\n157 156\n158 157\n159 158\n160 159\n161 160\n162 161\n163 162\n164 163\n165 164\n166 165\n167 166\n168 167\n169 168\n170 169\n171 170\n172 171\n173 172\n174 173\n175 174\n176 175\n177 176\n178 177\n179 178\n180 179\n181 180\n182 181\n183 182\n184 183\n185 184\n186 185\n187 186\n188 187\n189 188\n190 189\n191 190\n192 191\n193 192\n194 193\n195 194\n196 195\n197 196\n198 197\n199 198\n200 199\n201 200\n202 201\n203 202\n204 203\n205 204\n206 205\n207 206\n208 207\n209 208\n210 209\n211 210\n212 211\n213 212\n214 213\n215 214\n216 215\n217 216\n218 217\n219 218\n220 219\n221 220\n222 221\n223 222\n224 223\n225 224\n226 225\n227 226\n228 227\n229 228\n230 229\n231 230\n232 231\n233 232\n234 233\n235 234\n236 235\n237 236\n238 237\n239 238\n240 239\n241 240\n242 241\n243 242\n244 243\n245 244\n246 245\n247 246\n248 247\n249 248\n250 249\n251 250\n252 251\n253 252\n254 253\n255 254\n256 255\n257 256\n258 257\n259 258\n260 259\n261 260\n262 261\n263 262\n264 263\n265 264\n266 265\n267 266\n268 267\n269 268\n270 269\n271 270\n272 271\n273 272\n274 273\n275 274\n276 275\n277 276\n278 277\n279 278\n280 279\n281 280\n282 281\n283 282\n284 283\n285 284\n286 285\n287 286\n288 287\n289 288\n290 289\n291 290\n292 291\n293 292\n294 293\n295 294\n296 295\n297 296\n298 297\n299 298\n300 299\n301 300\n302 301\n303 302\n304 303\n305 304\n306 305\n307 306\n308 307\n309 308\n310 309\n311 310\n312 311\n313 312\n314 313\n315 314\n316 315\n317 316\n318 317\n319 318\n320 319\n321 320\n322 321\n323 322\n324 323\n325 324\n326 325\n327 326\n328 327\n329 328\n330 329\n331 330\n332 331\n333 332\n334 333\n335 334\n336 335\n337 336\n338 337\n339 338\n340 339\n341 340\n342 341\n343 342\n344 343\n345 344\n346 345\n347 346\n348 347\n349 348\n350 349\n351 350\n352 351\n353 352\n354 353\n355 354\n356 355\n357 356\n358 357\n359 358\n360 359\n361 360\n362 361\n363 362\n364 363\n365 364\n366 365\n367 366\n368 367\n369 368\n370 369\n371 370\n372 371\n373 372\n374 373\n375 374\n376 375\n377 376\n378 377\n379 378\n380 379\n381 380\n382 381\n383 382\n384 383\n385 384\n386 385\n387 386\n388 387\n389 388\n390 389\n391 390\n392 391\n393 392\n394 393\n395 394\n396 395\n397 396\n398 397\n399 398\n400 399\n401 400\n402 401\n403 402\n404 403\n405 404\n406 405\n407 406\n408 407\n409 408\n410 409\n411 410\n412 411\n413 412\n414 413\n415 414\n416 415\n417 416\n418 417\n419 418\n420 419\n421 420\n422 421\n423 422\n424 423\n425 424\n426 425\n427 426\n428 427\n429 428\n430 429\n431 430\n432 431\n433 432\n434 433\n435 434\n436 435\n437 436\n438 437\n439 438\n440 439\n441 440\n442 441\n443 442\n444 443\n445 444\n446 445\n447 446\n448 447\n449 448\n450 449\n451 450\n452 451\n453 452\n454 453\n455 454\n456 455\n457 456\n458 457\n459 458\n460 459\n461 460\n462 461\n463 462\n464 463\n465 464\n466 465\n467 466\n468 467\n469 468\n470 469\n471 470\n472 471\n473 472\n474 473\n475 474\n476 475\n477 476\n478 477\n479 478\n480 479\n481 480\n482 481\n483 482\n484 483\n485 484\n486 485\n487 486\n488 487\n489 488\n490 489\n491 490\n492 491\n493 492\n494 493\n495 494\n496 495\n497 496\n498 497\n499 498\n500 499\n501 500\n502 501\n503 502\n504 503\n505 504\n506 505\n507 506\n508 507\n509 508\n510 509\n511 510\n512 511\n513 512\n514 513\n515 514\n516 515\n517 516\n518 517\n519 518\n520 519\n521 520\n522 521\n523 522\n524 523\n525 524\n526 525\n527 526\n528 527\n529 528\n530 529\n531 530\n532 531\n533 532\n534 533\n535 534\n536 535\n537 536\n538 537\n539 538\n540 539\n541 540\n542 541\n543 542\n544 543\n545 544\n546 545\n547 546\n548 547\n549 548\n550 549\n551 550\n552 551\n553 552\n554 553\n555 554\n556 555\n557 556\n558 557\n559 558\n560 559\n561 560\n562 561\n563 562\n564 563\n565 564\n566 565\n567 566\n568 567\n569 568\n570 569\n571 570\n572 571\n573 572\n574 573\n575 574\n576 575\n577 576\n578 577\n579 578\n580 579\n581 580\n582 581\n583 582\n584 583\n585 584\n586 585\n587 586\n588 587\n589 588\n590 589\n591 590\n592 591\n593 592\n594 593\n595 594\n596 595\n597 596\n598 597\n599 598\n600 599\n601 600\n602 601\n603 602\n604 603\n605 604\n606 605\n607 606\n608 607\n609 608\n610 609\n611 610\n612 611\n613 612\n614 613\n615 614\n616 615\n617 616\n618 617\n619 618\n620 619\n621 620\n622 621\n623 622\n624 623\n625 624\n626 625\n627 626\n628 627\n629 628\n630 629\n631 630\n632 631\n633 632\n634 633\n635 634\n636 635\n637 636\n638 637\n639 638\n640 639\n641 640\n642 641\n643 642\n644 643\n645 644\n646 645\n647 646\n648 647\n649 648\n650 649\n651 650\n652 651\n653 652\n654 653\n655 654\n656 655\n657 656\n658 657\n659 658\n660 659\n661 660\n662 661\n663 662\n664 663\n665 664\n666 665\n667 666\n668 667\n669 668\n670 669\n671 670\n672 671\n673 672\n674 673\n675 674\n676 675\n677 676\n678 677\n679 678\n680 679\n681 680\n682 681\n683 682\n684 683\n685 684\n686 685\n687 686\n688 687\n689 688\n690 689\n691 690\n692 691\n693 692\n694 693\n695 694\n696 695\n697 696\n698 697\n699 698\n700 699\n701 700\n702 701\n703 702\n704 703\n705 704\n706 705\n707 706\n708 707\n709 708\n710 709\n711 710\n712 711\n713 712\n714 713\n715 714\n716 715\n717 716\n718 717\n719 718\n720 719\n721 720\n722 721\n723 722\n724 723\n725 724\n726 725\n727 726\n728 727\n729 728\n730 729\n731 730\n732 731\n733 732\n734 733\n735 734\n736 735\n737 736\n738 737\n739 738\n740 739\n741 740\n742 741\n743 742\n744 743\n745 744\n746 745\n747 746\n748 747\n749 748\n750 749\n751 750\n752 751\n753 752\n754 753\n755 754\n756 755\n757 756\n758 757\n759 758\n760 759\n761 760\n762 761\n763 762\n764 763\n765 764\n766 765\n767 766\n768 767\n769 768\n770 769\n771 770\n772 771\n773 772\n774 773\n775 774\n776 775\n777 776\n778 777\n779 778\n780 779\n781 780\n782 781\n783 782\n784 783\n785 784\n786 785\n787 786\n788 787\n789 788\n790 789\n791 790\n792 791\n793 792\n794 793\n795 794\n796 795\n797 796\n798 797\n799 798\n800 799\n801 800\n802 801\n803 802\n804 803\n805 804\n806 805\n807 806\n808 807\n809 808\n810 809\n811 810\n812 811\n813 812\n814 813\n815 814\n816 815\n817 816\n818 817\n819 818\n820 819\n821 820\n822 821\n823 822\n824 823\n825 824\n826 825\n827 826\n828 827\n829 828\n830 829\n831 830\n832 831\n833 832\n834 833\n835 834\n836 835\n837 836\n838 837\n839 838\n840 839\n841 840\n842 841\n843 842\n844 843\n845 844\n846 845\n847 846\n848 847\n849 848\n850 849\n851 850\n852 851\n853 852\n854 853\n855 854\n856 855\n857 856\n858 857\n859 858\n860 859\n861 860\n862 861\n863 862\n864 863\n865 864\n866 865\n867 866\n868 867\n869 868\n870 869\n871 870\n872 871\n873 872\n874 873\n875 874\n876 875\n877 876\n878 877\n879 878\n880 879\n881 880\n882 881\n883 882\n884 883\n885 884\n886 885\n887 886\n888 887\n889 888\n890 889\n891 890\n892 891\n893 892\n894 893\n895 894\n896 895\n897 896\n898 897\n899 898\n900 899\n901 900\n902 901\n903 902\n904 903\n905 904\n906 905\n907 906\n908 907\n909 908\n910 909\n911 910\n912 911\n913 912\n914 913\n915 914\n916 915\n917 916\n918 917\n919 918\n920 919\n921 920\n922 921\n923 922\n924 923\n925 924\n926 925\n927 926\n928 927\n929 928\n930 929\n931 930\n932 931\n933 932\n934 933\n935 934\n936 935\n937 936\n938 937\n939 938\n940 939\n941 940\n942 941\n943 942\n944 943\n945 944\n946 945\n947 946\n948 947\n949 948\n950 949\n951 950\n952 951\n953 952\n954 953\n955 954\n956 955\n957 956\n958 957\n959 958\n960 959\n961 960\n962 961\n963 962\n964 963\n965 964\n966 965\n967 966\n968 967\n969 968\n970 969\n971 970\n972 971\n973 972\n974 973\n975 974\n976 975\n977 976\n978 977\n979 978\n980 979\n981 980\n982 981\n983 982\n984 983\n985 984\n986 985\n987 986\n988 987\n989 988\n990 989\n991 990\n992 991\n993 992\n994 993\n995 994\n996 995\n997 996\n998 997\n999 998\n0 999",
        expected: "false",
      },
      {
        input:
          "800\n1200\n451 110\n474 268\n315 120\n455 669\n763 598\n164 203\n0 35\n23 250\n310 450\n681 386\n303 275\n568 44\n7 20\n793 571\n740 126\n424 646\n75 421\n422 266\n60 15\n673 416\n792 290\n174 630\n124 49\n338 545\n159 350\n771 199\n213 479\n759 534\n88 621\n749 29\n295 552\n644 752\n401 9\n135 525\n444 155\n449 459\n120 322\n585 671\n95 273\n37 204\n265 608\n141 155\n706 664\n452 178\n539 678\n570 118\n10 72\n674 618\n552 637\n446 383\n273 711\n613 528\n356 786\n610 637\n601 385\n578 260\n10 55\n61 224\n705 617\n700 172\n128 602\n66 61\n381 385\n503 427\n570 384\n32 679\n669 675\n672 68\n374 790\n48 403\n778 314\n541 547\n346 55\n425 299\n287 437\n625 407\n383 70\n641 774\n263 314\n539 100\n82 628\n588 522\n342 148\n24 104\n387 538\n790 63\n114 389\n793 80\n493 45\n390 223\n524 95\n26 168\n265 724\n383 758\n422 436\n336 684\n564 176\n720 64\n414 692\n279 790\n631 709\n196 591\n279 69\n360 250\n192 136\n59 776\n128 277\n267 368\n190 233\n67 651\n576 33\n453 698\n720 118\n791 564\n2 279\n230 511\n750 569\n602 340\n383 724\n161 485\n788 20\n234 738\n323 728\n52 199\n295 467\n148 427\n453 675\n412 442\n387 61\n242 357\n50 443\n466 504\n181 331\n723 321\n584 45\n312 596\n633 477\n160 751\n333 196\n111 227\n111 727\n84 760\n77 279\n139 635\n685 413\n445 266\n634 480\n375 113\n202 195\n282 220\n586 608\n32 600\n754 179\n59 260\n221 575\n689 400\n235 387\n661 691\n204 316\n307 402\n585 272\n731 640\n421 332\n120 487\n75 116\n353 497\n671 94\n536 105\n243 135\n6 569\n294 409\n270 457\n256 767\n517 530\n362 652\n662 15\n568 534\n305 22\n635 199\n70 639\n331 521\n16 792\n538 20\n282 128\n141 641\n418 224\n615 211\n763 225\n275 89\n717 127\n157 776\n503 31\n107 686\n225 534\n328 601\n127 350\n330 97\n248 528\n223 648\n150 44\n682 249\n673 333\n447 776\n676 526\n532 623\n427 677\n701 474\n12 231\n165 517\n198 85\n552 253\n683 476\n247 662\n361 399\n573 258\n204 298\n30 520\n363 19\n14 403\n625 277\n204 690\n465 106\n2 451\n27 186\n516 487\n650 719\n692 448\n183 140\n162 504\n518 405\n657 385\n154 744\n27 401\n144 529\n522 501\n198 347\n219 789\n683 498\n504 69\n584 118\n200 70\n577 266\n765 419\n218 572\n599 268\n543 745\n408 55\n122 279\n406 462\n740 628\n412 529\n166 704\n734 273\n390 304\n166 594\n123 419\n646 748\n305 354\n796 709\n588 771\n362 289\n93 36\n114 424\n405 614\n564 645\n442 152\n284 326\n799 379\n469 199\n446 37\n620 416\n788 373\n323 582\n613 0\n759 98\n567 265\n793 74\n111 789\n537 98\n76 97\n496 96\n238 779\n671 609\n514 526\n164 69\n169 189\n601 54\n736 691\n518 387\n662 309\n776 600\n405 438\n545 772\n782 70\n32 248\n795 534\n770 106\n662 131\n558 66\n559 617\n446 266\n447 760\n683 609\n540 636\n87 542\n705 766\n381 559\n519 729\n232 137\n126 55\n206 591\n244 440\n250 498\n247 337\n562 391\n717 485\n765 591\n143 215\n717 331\n202 487\n632 169\n787 783\n502 781\n379 487\n725 197\n10 19\n453 136\n743 384\n550 14\n384 719\n717 301\n663 108\n301 616\n329 55\n408 771\n42 70\n198 489\n162 367\n515 652\n263 224\n742 527\n214 497\n246 675\n573 210\n334 276\n409 566\n791 398\n705 515\n759 130\n674 21\n361 75\n644 402\n348 94\n457 102\n330 681\n662 473\n331 69\n320 645\n100 513\n348 781\n68 473\n364 790\n361 89\n798 4\n71 194\n520 635\n150 473\n520 575\n292 647\n735 113\n726 238\n446 132\n756 699\n172 514\n180 118\n414 689\n187 728\n791 375\n86 436\n303 687\n467 513\n659 103\n22 224\n444 510\n794 783\n568 84\n516 484\n588 187\n642 26\n756 654\n251 410\n397 753\n297 100\n377 28\n642 321\n629 51\n566 702\n88 579\n332 194\n6 618\n439 200\n382 534\n360 752\n188 445\n604 249\n335 440\n204 662\n312 487\n615 203\n575 534\n796 277\n325 553\n336 249\n297 617\n46 187\n741 651\n204 667\n334 15\n581 773\n414 379\n124 598\n492 766\n68 4\n556 676\n158 317\n290 80\n12 705\n425 327\n669 429\n44 429\n235 15\n567 310\n222 442\n604 51\n537 79\n522 649\n236 489\n151 352\n478 221\n761 734\n565 118\n671 651\n625 278\n391 260\n133 305\n88 467\n124 480\n604 613\n499 386\n90 401\n585 559\n97 628\n185 637\n295 451\n151 586\n688 58\n256 216\n796 331\n3 771\n533 288\n383 377\n231 268\n546 142\n778 409\n340 379\n463 684\n735 728\n310 291\n133 124\n27 146\n99 358\n166 565\n264 65\n388 771\n30 239\n493 114\n97 158\n601 735\n419 559\n426 723\n149 211\n568 31\n469 280\n47 641\n476 110\n96 744\n647 239\n790 283\n162 622\n697 476\n466 236\n319 13\n24 521\n157 797\n665 797\n135 536\n747 594\n375 304\n21 60\n6 615\n459 193\n611 329\n365 719\n36 304\n469 263\n417 374\n240 203\n688 758\n165 761\n499 231\n300 796\n75 619\n230 289\n722 186\n540 36\n381 640\n165 47\n263 274\n279 83\n108 608\n330 278\n640 467\n493 181\n571 694\n369 508\n414 691\n359 62\n115 285\n730 64\n728 89\n189 8\n251 97\n221 790\n762 159\n134 109\n301 327\n529 17\n708 707\n707 614\n507 796\n686 583\n392 194\n628 48\n698 658\n652 774\n581 614\n261 27\n426 363\n263 303\n169 38\n201 45\n780 257\n675 194\n577 211\n665 318\n312 578\n722 578\n361 669\n514 85\n115 522\n561 94\n427 737\n253 274\n262 623\n633 692\n271 434\n567 85\n410 702\n457 211\n567 483\n205 262\n515 637\n641 525\n149 295\n442 69\n704 608\n499 630\n148 699\n491 198\n200 648\n740 426\n502 666\n351 575\n449 318\n745 96\n569 197\n717 199\n313 282\n499 438\n476 175\n271 393\n184 104\n216 317\n269 462\n282 702\n401 56\n565 209\n414 628\n57 237\n452 0\n342 219\n529 744\n358 526\n390 358\n7 597\n11 392\n703 646\n491 507\n739 239\n415 572\n217 248\n458 720\n519 18\n46 82\n664 48\n288 249\n424 376\n21 658\n530 501\n262 304\n442 318\n610 33\n640 409\n188 1\n250 686\n39 352\n29 254\n412 785\n603 762\n71 177\n231 522\n255 95\n349 600\n115 300\n687 487\n603 615\n253 466\n720 643\n505 492\n307 734\n730 190\n715 8\n73 766\n613 198\n128 56\n78 193\n795 415\n92 105\n68 194\n754 418\n2 130\n375 283\n488 289\n96 489\n732 472\n43 458\n208 705\n543 211\n67 698\n429 789\n323 359\n764 250\n255 678\n795 445\n64 583\n171 783\n702 118\n581 346\n252 47\n78 384\n225 691\n46 491\n517 728\n518 654\n184 789\n196 448\n387 500\n508 498\n268 637\n42 105\n381 574\n630 423\n216 250\n740 668\n26 466\n323 143\n204 660\n405 198\n599 309\n577 329\n539 621\n717 497\n634 527\n232 51\n39 563\n265 619\n730 535\n495 206\n76 336\n670 267\n793 288\n134 218\n270 526\n445 286\n231 118\n750 753\n388 720\n222 263\n661 489\n390 174\n134 791\n509 238\n174 226\n762 644\n384 18\n738 272\n604 481\n665 539\n264 120\n349 359\n359 698\n205 0\n7 361\n272 600\n431 748\n472 233\n188 520\n46 402\n518 583\n440 733\n75 744\n166 413\n124 120\n201 268\n410 400\n69 393\n449 462\n582 432\n39 337\n132 320\n725 574\n135 143\n616 753\n727 293\n284 300\n727 745\n220 260\n162 640\n777 63\n443 179\n607 599\n505 368\n548 535\n256 200\n187 80\n725 690\n549 748\n455 667\n787 653\n769 484\n408 536\n569 290\n298 18\n107 402\n608 711\n243 358\n784 625\n176 528\n73 74\n388 353\n183 645\n612 393\n507 749\n102 608\n455 129\n100 704\n780 353\n665 436\n274 379\n165 686\n417 249\n341 379\n581 68\n7 263\n236 620\n142 761\n669 482\n83 702\n627 427\n460 240\n475 716\n468 392\n208 613\n68 639\n247 651\n624 518\n547 35\n220 3\n475 729\n82 388\n584 769\n563 706\n84 91\n124 668\n773 617\n116 33\n316 1\n321 309\n251 732\n256 671\n683 485\n91 500\n660 213\n657 51\n378 55\n705 380\n501 20\n498 398\n13 80\n328 448\n204 549\n788 159\n696 370\n53 550\n700 377\n366 94\n763 229\n300 225\n68 396\n107 179\n338 268\n710 725\n550 352\n6 577\n245 614\n367 403\n516 331\n602 392\n263 169\n649 594\n319 413\n750 306\n451 557\n715 1\n596 776\n32 492\n563 568\n63 193\n358 447\n736 316\n354 371\n536 168\n97 377\n234 61\n472 337\n445 640\n128 359\n213 54\n545 156\n673 651\n26 223\n731 480\n93 55\n121 590\n132 365\n743 184\n261 743\n246 719\n689 85\n300 277\n41 440\n543 692\n247 80\n640 618\n396 83\n543 677\n330 129\n673 613\n770 48\n333 600\n354 309\n196 106\n632 463\n406 751\n301 214\n581 346\n362 748\n519 470\n721 197\n509 796\n225 616\n552 470\n444 108\n438 476\n193 238\n313 703\n550 34\n642 387\n463 73\n122 416\n6 519\n790 268\n367 625\n475 750\n539 320\n441 208\n240 511\n183 402\n599 587\n167 428\n313 772\n257 680\n452 779\n718 12\n463 623\n599 421\n522 147\n234 237\n484 753\n663 786\n291 755\n182 551\n387 327\n695 402\n592 609\n461 83\n325 726\n235 437\n241 200\n664 168\n623 448\n477 485\n182 464\n151 799\n16 733\n150 597\n612 779\n751 545\n358 376\n93 273\n784 58\n670 576\n319 152\n37 772\n597 240\n698 0\n339 728\n693 130\n222 793\n446 377\n469 36\n782 13\n77 413\n188 92\n661 562\n342 612\n111 40\n87 314\n221 428\n519 200\n659 248\n668 481\n747 388\n231 796\n409 377\n785 118\n142 61\n570 156\n446 772\n487 95\n305 224\n366 357\n661 686\n789 215\n261 314\n325 666\n63 25\n155 689\n241 648\n455 695\n366 790\n361 362\n553 658\n121 773\n303 88\n190 753\n121 359\n584 393\n798 18\n219 226\n230 478\n615 549\n466 772\n30 384\n174 779\n184 154\n45 411\n265 70\n172 280\n200 639\n541 81\n743 45\n739 305\n263 379\n253 578\n93 710\n28 636\n740 616\n748 616\n6 174\n243 496\n461 65\n336 248\n59 206\n721 613\n713 486\n795 674\n732 739\n465 101\n301 440\n88 297\n602 574\n492 541\n780 658\n13 612\n604 212\n542 323\n617 591\n395 427\n157 335\n491 336\n383 521\n543 157\n382 568\n556 721\n57 195\n794 120\n567 322\n736 168\n624 252\n699 709\n177 100\n697 104\n294 118\n263 12\n455 84\n216 581\n283 500\n247 512\n630 81\n334 326\n569 257\n762 152\n470 635\n146 515\n475 143\n366 70\n606 304\n744 19\n230 201\n625 497\n796 617\n418 231\n154 562\n454 66\n495 450\n795 164\n325 63\n42 579\n717 57\n119 41\n312 776\n558 639\n498 34\n192 424\n149 626\n723 129\n498 254\n468 357\n475 762\n316 333\n296 62\n791 640\n360 318\n535 227\n683 663\n793 719\n624 126\n42 60\n221 711\n475 617\n585 455\n582 226\n552 504\n499 237\n707 515\n313 104\n736 662\n707 758\n300 229\n791 110\n103 206\n796 38\n625 55\n464 343\n707 259\n361 61\n495 528\n370 511\n612 209\n423 73\n655 355\n537 352\n141 231\n138 388\n497 170\n490 448\n33 608\n740 716\n377 296\n543 726\n153 636\n197 521\n115 741\n611 101\n292 26\n165 88\n220 769\n23 755\n468 260\n673 436\n603 620\n151 639\n189 69\n563 261\n148 428\n434 646\n281 90\n706 755\n794 545\n188 68\n610 231\n607 295\n330 573\n613 195\n235 233\n80 18\n197 591\n7 220\n600 60\n779 386\n177 772\n441 106\n360 266\n387 365\n232 129\n797 616\n396 227\n703 608\n725 327\n708 489\n538 389\n305 30\n207 399\n595 136\n36 116\n571 407\n565 8\n472 413\n282 535\n508 612\n349 198\n647 219\n395 793\n590 401\n596 514\n458 260\n433 44\n108 237\n148 394\n496 380\n417 531\n469 64\n591 203\n27 516\n480 458\n453 72\n415 409\n727 335\n188 229\n125 276\n554 357\n777 764\n151 156\n480 81\n339 443\n741 451\n529 170\n543 194\n52 358",
        expected: "true",
      },
      {
        input:
          "800\n1201\n650 366\n737 382\n147 438\n27 281\n358 655\n637 679\n296 118\n486 422\n561 648\n794 145\n176 695\n141 18\n658 398\n94 283\n597 456\n271 214\n535 58\n643 631\n399 441\n528 540\n233 143\n212 470\n489 635\n527 91\n4 425\n57 606\n308 24\n89 270\n160 610\n221 678\n401 598\n324 546\n180 474\n389 237\n43 99\n322 628\n111 520\n280 180\n467 651\n445 402\n166 381\n406 715\n526 307\n252 225\n614 423\n783 285\n558 388\n20 140\n405 400\n543 627\n787 34\n323 250\n707 145\n53 40\n684 237\n10 649\n418 667\n206 117\n51 794\n436 365\n546 8\n338 278\n68 561\n60 62\n315 446\n644 228\n326 219\n14 398\n296 616\n430 143\n406 706\n491 275\n331 588\n3 565\n753 664\n445 178\n263 264\n258 128\n510 636\n462 746\n498 434\n272 638\n451 770\n5 270\n679 616\n434 522\n517 686\n347 692\n665 319\n661 291\n668 30\n248 749\n468 55\n107 531\n450 105\n52 439\n248 728\n156 459\n359 492\n589 207\n791 646\n305 536\n367 191\n558 381\n433 365\n745 391\n582 529\n673 574\n475 295\n553 145\n229 142\n761 200\n647 632\n700 596\n498 657\n656 281\n415 13\n392 29\n83 460\n541 646\n481 99\n665 263\n71 713\n291 235\n570 81\n171 787\n679 366\n582 143\n343 235\n45 651\n42 483\n116 202\n469 745\n707 6\n597 194\n596 283\n762 343\n484 360\n469 104\n681 180\n88 183\n74 264\n88 260\n430 31\n253 184\n429 792\n132 410\n77 231\n94 10\n562 447\n230 214\n72 445\n330 518\n293 707\n157 282\n593 281\n482 443\n650 137\n486 792\n517 247\n347 58\n462 148\n629 749\n562 647\n71 410\n267 557\n335 347\n502 380\n168 391\n435 532\n534 219\n645 61\n170 0\n175 728\n85 711\n371 349\n15 640\n677 337\n793 424\n660 595\n169 403\n684 491\n545 379\n498 341\n698 433\n537 557\n793 54\n265 297\n331 522\n591 154\n147 61\n463 752\n710 755\n546 283\n702 374\n457 452\n59 701\n700 65\n767 319\n244 456\n774 87\n644 422\n592 363\n572 659\n22 488\n91 103\n763 317\n127 228\n215 500\n536 66\n591 799\n390 47\n386 445\n455 599\n349 243\n690 454\n496 460\n35 515\n203 728\n14 734\n736 255\n206 199\n571 102\n284 416\n729 126\n205 655\n432 634\n234 413\n144 65\n648 603\n788 58\n4 341\n102 253\n516 686\n763 178\n608 542\n534 136\n796 692\n436 618\n177 175\n468 159\n619 535\n199 100\n733 442\n767 741\n109 78\n553 236\n61 43\n354 99\n453 90\n780 350\n449 678\n486 788\n689 21\n100 748\n473 27\n562 183\n22 48\n15 145\n628 175\n592 494\n676 344\n120 0\n295 40\n510 342\n323 155\n545 366\n133 194\n9 337\n61 506\n30 538\n406 427\n598 606\n406 574\n122 136\n211 743\n130 295\n157 58\n554 572\n64 165\n231 778\n380 332\n36 241\n33 379\n687 155\n639 301\n109 378\n575 458\n483 106\n74 94\n386 172\n211 300\n637 344\n608 357\n481 431\n125 323\n499 220\n66 1\n534 6\n480 316\n570 554\n89 385\n570 134\n206 27\n305 4\n151 247\n3 469\n459 351\n260 215\n647 331\n514 515\n287 675\n310 625\n614 748\n213 505\n60 433\n262 299\n73 740\n627 232\n265 660\n759 472\n71 40\n196 613\n617 324\n108 585\n710 480\n442 366\n595 743\n258 642\n676 692\n629 178\n159 674\n587 462\n617 461\n705 402\n743 697\n791 8\n0 550\n24 542\n651 441\n580 698\n632 696\n133 160\n343 713\n2 446\n630 721\n401 794\n209 363\n466 172\n797 655\n213 238\n525 30\n571 640\n793 152\n761 529\n125 458\n154 262\n791 18\n480 169\n3 694\n303 31\n735 756\n17 440\n122 743\n580 300\n543 638\n620 689\n128 249\n520 65\n621 522\n612 210\n113 378\n767 456\n650 424\n773 268\n512 131\n199 97\n29 749\n619 669\n37 288\n16 540\n797 12\n223 104\n345 472\n555 357\n777 463\n91 647\n98 458\n373 231\n551 424\n25 70\n2 635\n415 310\n174 118\n195 112\n251 421\n123 207\n508 90\n710 431\n763 328\n365 281\n560 299\n784 651\n695 594\n95 566\n317 572\n606 764\n211 512\n301 41\n288 393\n486 376\n177 768\n462 269\n209 708\n353 691\n565 108\n197 781\n325 249\n188 416\n570 240\n732 13\n326 487\n113 727\n408 29\n789 448\n207 164\n598 477\n101 16\n617 658\n664 634\n331 400\n14 772\n469 323\n710 400\n78 363\n790 584\n607 227\n645 146\n457 615\n755 573\n354 6\n687 419\n450 269\n213 492\n676 70\n207 549\n573 96\n562 612\n221 704\n540 225\n577 303\n698 317\n786 402\n123 6\n337 219\n61 309\n320 634\n623 138\n679 528\n103 249\n612 72\n451 266\n324 39\n720 333\n654 148\n310 717\n554 607\n181 426\n353 235\n251 457\n685 496\n491 619\n77 714\n710 158\n125 357\n493 332\n664 778\n694 19\n38 116\n633 477\n158 100\n72 365\n768 721\n241 79\n750 193\n348 788\n29 38\n390 569\n73 6\n538 379\n327 771\n273 193\n278 296\n104 165\n621 603\n196 461\n629 351\n77 388\n286 269\n690 173\n272 474\n719 414\n233 299\n149 708\n789 227\n783 627\n259 142\n654 628\n555 603\n354 695\n769 137\n311 362\n181 512\n165 631\n693 672\n358 197\n272 478\n580 121\n768 551\n766 220\n733 146\n581 651\n243 285\n245 519\n233 635\n707 214\n497 735\n10 346\n227 599\n760 666\n373 320\n498 35\n158 542\n451 99\n132 143\n627 339\n111 234\n163 772\n256 671\n138 568\n326 419\n576 198\n622 674\n487 122\n638 735\n581 242\n769 3\n124 728\n571 101\n272 222\n645 392\n750 342\n623 18\n690 279\n693 139\n567 724\n229 759\n250 356\n59 688\n181 378\n213 670\n245 709\n151 479\n414 23\n685 0\n273 476\n303 764\n451 55\n468 509\n795 536\n347 7\n767 301\n182 331\n35 568\n120 372\n729 13\n160 130\n541 505\n769 665\n787 706\n402 713\n74 474\n484 625\n443 718\n548 403\n693 178\n306 567\n577 451\n308 718\n503 458\n621 381\n420 408\n296 220\n51 459\n310 466\n488 111\n153 770\n108 689\n425 549\n86 743\n348 201\n725 782\n30 137\n22 95\n315 16\n451 152\n716 535\n373 667\n137 134\n716 406\n250 730\n797 281\n459 323\n464 568\n508 364\n571 777\n16 79\n490 410\n700 33\n723 363\n658 444\n721 7\n625 531\n597 95\n602 586\n405 78\n496 715\n410 448\n390 299\n425 117\n304 522\n517 766\n245 630\n498 104\n300 550\n539 184\n417 718\n188 770\n610 145\n752 463\n412 214\n119 536\n508 540\n86 52\n211 515\n710 454\n571 638\n196 281\n302 715\n247 447\n450 155\n669 241\n710 519\n587 475\n762 220\n132 294\n451 511\n684 360\n587 586\n491 344\n775 696\n78 76\n665 505\n64 508\n755 488\n59 719\n111 707\n493 297\n103 139\n204 592\n592 441\n272 140\n549 423\n685 528\n203 414\n120 586\n725 447\n673 66\n666 238\n414 4\n196 701\n405 682\n119 186\n57 184\n582 772\n373 731\n98 689\n529 674\n169 269\n332 603\n123 480\n650 697\n142 561\n405 652\n537 30\n135 84\n693 682\n280 7\n593 324\n305 469\n582 76\n525 346\n109 70\n294 486\n189 651\n700 86\n454 242\n690 240\n481 693\n429 584\n753 779\n760 451\n745 23\n660 418\n443 558\n502 357\n488 115\n684 570\n64 655\n537 50\n237 572\n279 115\n673 326\n544 487\n62 137\n666 222\n486 659\n710 375\n348 453\n626 380\n173 26\n663 46\n712 201\n510 568\n626 260\n233 46\n583 294\n207 751\n544 222\n340 464\n651 620\n693 238\n722 505\n707 505\n775 552\n327 717\n147 326\n218 464\n737 795\n219 727\n150 731\n48 551\n133 638\n151 318\n565 668\n369 23\n666 236\n277 92\n334 764\n710 138\n180 447\n488 184\n274 724\n97 99\n429 575\n639 466\n683 706\n85 7\n87 560\n71 771\n297 601\n194 748\n536 288\n563 354\n55 461\n141 378\n739 445\n506 781\n476 307\n673 360\n125 656\n22 565\n188 234\n695 644\n767 64\n693 194\n275 468\n263 317\n395 215\n5 509\n576 552\n666 107\n41 671\n157 146\n0 475\n528 675\n676 730\n366 504\n753 476\n239 69\n484 299\n384 215\n546 740\n433 439\n326 383\n308 376\n390 452\n643 365\n375 135\n310 694\n167 370\n537 576\n470 114\n543 354\n694 19\n257 19\n244 542\n141 542\n270 39\n339 383\n626 63\n531 363\n388 353\n382 613\n29 456\n217 283\n686 474\n480 372\n759 480\n59 329\n102 777\n791 71\n591 611\n559 372\n749 320\n158 542\n735 484\n442 257\n533 212\n780 583\n116 7\n693 779\n390 363\n599 402\n251 491\n555 95\n154 124\n705 344\n639 370\n528 671\n493 530\n141 755\n595 253\n720 234\n275 624\n324 611\n493 658\n304 633\n497 762\n314 337\n431 413\n259 190\n59 165\n756 742\n741 689\n81 270\n700 246\n663 290\n609 18\n252 83\n164 745\n619 257\n488 718\n442 83\n433 778\n747 676\n159 379\n321 425\n338 424\n35 463\n528 558\n397 604\n761 131\n528 255\n382 99\n580 505\n646 376\n429 531\n373 732\n254 44\n208 306\n647 100\n59 186\n337 728\n597 468\n773 321\n170 660\n638 753\n390 34\n67 393\n768 485\n684 369\n59 162\n397 727\n359 426\n70 435\n793 67\n593 699\n781 798\n510 219\n323 449\n305 315\n504 715\n133 213\n548 665\n630 39\n653 561\n737 231\n708 788\n777 743\n555 619\n162 181\n687 418\n368 224\n432 460\n357 238\n296 249\n136 184\n459 106\n260 691\n69 549\n496 175\n767 338\n746 703\n767 472\n537 501\n132 300\n93 750\n657 464\n780 181\n769 597\n533 76\n577 588\n476 667\n221 498\n580 528\n67 116\n270 295\n111 195\n102 66\n541 427\n174 43\n527 21\n67 297\n59 567\n567 786\n627 97\n716 785\n517 734\n594 540\n345 378\n69 235\n53 132\n168 388\n774 351\n181 223\n123 446\n389 748\n498 329\n343 757\n403 7\n49 584\n51 385\n258 726\n709 542\n771 742\n411 369\n233 477\n708 648\n153 112\n405 583\n295 346\n12 38\n795 526\n412 463\n395 120\n335 756\n395 654\n496 223\n94 193\n643 216\n282 117\n642 574\n86 112\n708 363\n731 184\n569 97\n167 461\n559 675\n771 8\n206 283\n627 756\n337 640\n236 456\n711 523\n421 58\n97 439\n86 231\n255 131\n556 331\n147 726\n739 583\n355 396\n740 731\n526 185\n81 640\n146 288\n357 317\n259 309\n171 234\n660 523\n546 740\n85 69\n367 474\n793 621\n37 603\n481 756\n283 644\n442 779\n645 342\n305 235\n277 796\n626 106\n48 532\n401 418\n170 407\n164 521\n222 765\n465 270\n558 52\n775 42\n98 148\n291 788\n428 696\n122 574\n122 299\n685 214\n386 484\n583 347\n390 285\n734 285\n154 332\n684 446\n544 633\n639 706\n20 166\n98 464\n52 790\n642 315\n167 412\n82 32\n395 526\n405 620\n677 331\n159 100\n442 428\n3 563\n755 606\n303 766\n417 647\n230 614\n239 609\n309 648\n263 723\n47 41\n656 628\n738 538\n385 579\n622 31\n188 4\n51 194\n705 640\n676 461\n253 452\n37 84\n387 30\n798 505\n209 703\n11 628\n414 472\n286 21\n133 161\n99 13\n433 513\n427 320\n667 398\n186 788\n737 26\n215 238\n564 205\n469 146\n443 45\n370 649\n173 490\n571 285\n118 478\n357 699\n170 351\n252 338\n564 241\n220 675\n198 734\n273 421\n151 14\n119 372\n205 604\n687 514\n488 476\n660 791\n70 796\n685 779\n57 604\n9 606\n9 652\n152 80\n562 721\n110 80\n690 192\n86 295\n660 748\n212 407\n405 290\n242 338\n87 292\n372 699\n652 640\n446 13\n135 392\n194 346\n18 692\n103 610\n287 700\n93 570\n455 313\n705 332\n773 652\n92 318\n348 384\n733 416\n639 612\n733 745\n133 9\n279 606\n147 356\n457 374\n366 327\n480 651\n668 343\n260 31\n88 285\n252 475\n358 240\n660 282\n457 659\n293 631\n188 332\n378 689\n404 434\n258 151\n39 200\n700 629\n174 470\n741 433\n646 384\n354 522\n787 726\n299 522\n2 640\n340 21\n577 349\n737 604\n655 749\n469 586\n609 495\n432 680\n35 674\n482 375\n286 657\n471 668\n525 458\n164 590\n336 519\n208 706\n131 222\n420 482\n484 209\n491 430\n612 403\n81 674\n276 402\n591 670",
        expected: "false",
      },
    ],
    hints: [
      "Draw an arrow from each required module to the module that needs it. When is finishing impossible?",
      "Exactly when the arrows contain a loop: every module on it waits for another one on it.",
      "Count, for each module, how many requirements are still outstanding. Which modules can be taken right now?",
      "Repeatedly take a module with zero outstanding requirements and update the counts of the modules it unlocks. If you take all n, there is no loop.",
    ],
    solutions: [
      {
        title: "Depth-first search with three colours",
        order: 1,
        intuition:
          "A loop exists exactly when a depth-first search walks into a module that is still on the current path. Colour modules white (unvisited), grey (on the current path) and black (fully explored). Meeting a grey module means the path has come back on itself.",
        approach: [
          "Build arrows from required → module.",
          "From every white module, run a depth-first search that colours the module grey on entry and black on exit.",
          "If the search reaches a grey module, report a loop.",
          "If no search finds one, every module can be finished.",
        ],
        code: {
          PYTHON: `def canFinishAll(n: int, prereqs: List[List[int]]) -> bool:
    import sys
    sys.setrecursionlimit(10000)
    unlocks = [[] for _ in range(n)]
    for module, required in prereqs:
        unlocks[required].append(module)

    WHITE, GREY, BLACK = 0, 1, 2
    colour = [WHITE] * n

    def has_loop(u: int) -> bool:
        colour[u] = GREY
        for v in unlocks[u]:
            if colour[v] == GREY:
                return True
            if colour[v] == WHITE and has_loop(v):
                return True
        colour[u] = BLACK
        return False

    for u in range(n):
        if colour[u] == WHITE and has_loop(u):
            return False
    return True`,
          JAVA: `class Solution {
    private List<List<Integer>> unlocks;
    private int[] colour;

    public boolean canFinishAll(int n, int[][] prereqs) {
        unlocks = new ArrayList<>();
        for (int i = 0; i < n; i++) unlocks.add(new ArrayList<>());
        for (int[] p : prereqs) unlocks.get(p[1]).add(p[0]);
        colour = new int[n];
        for (int u = 0; u < n; u++) {
            if (colour[u] == 0 && hasLoop(u)) return false;
        }
        return true;
    }

    private boolean hasLoop(int u) {
        colour[u] = 1;
        for (int v : unlocks.get(u)) {
            if (colour[v] == 1) return true;
            if (colour[v] == 0 && hasLoop(v)) return true;
        }
        colour[u] = 2;
        return false;
    }
}`,
        },
        timeComplexity: "O(n + prereqs)",
        spaceComplexity: "O(n + prereqs), plus recursion as deep as the longest chain",
        edgeCases: [
          "A module that requires itself.",
          "A long chain of 1000 modules, which recurses 1000 deep.",
        ],
        commonMistakes: [
          "Using a single visited flag: reaching a module explored on an earlier, finished path is not a loop.",
        ],
      },
      {
        title: "Optimal: Kahn's algorithm (peel off ready modules)",
        order: 2,
        intuition:
          "Simulate the learner. A module is ready when its count of outstanding requirements is zero. Taking it lowers the count of each module it unlocks. Modules on a loop never reach zero, so if the number taken falls short of n, a loop exists. The process is iterative, so a long chain causes no recursion trouble.",
        approach: [
          "Build arrows required → module and count incoming arrows per module.",
          "Queue every module with a count of zero.",
          "Pop a module, count it as taken, and decrement each module it unlocks; queue any that reach zero.",
          "Return whether all n modules were taken.",
        ],
        code: {
          PYTHON: `from collections import deque


def canFinishAll(n: int, prereqs: List[List[int]]) -> bool:
    unlocks = [[] for _ in range(n)]
    waiting = [0] * n  # outstanding requirements per module
    for module, required in prereqs:
        unlocks[required].append(module)
        waiting[module] += 1

    ready = deque(m for m in range(n) if waiting[m] == 0)
    taken = 0
    while ready:
        m = ready.popleft()
        taken += 1
        for nxt in unlocks[m]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                ready.append(nxt)

    # Modules on a loop never become ready.
    return taken == n`,
          JAVA: `class Solution {
    public boolean canFinishAll(int n, int[][] prereqs) {
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < n; i++) unlocks.add(new ArrayList<>());
        int[] waiting = new int[n];
        for (int[] p : prereqs) {
            unlocks.get(p[1]).add(p[0]);
            waiting[p[0]]++;
        }
        ArrayDeque<Integer> ready = new ArrayDeque<>();
        for (int m = 0; m < n; m++) if (waiting[m] == 0) ready.add(m);
        int taken = 0;
        while (!ready.isEmpty()) {
            int m = ready.poll();
            taken++;
            for (int next : unlocks.get(m)) {
                if (--waiting[next] == 0) ready.add(next);
            }
        }
        return taken == n;
    }
}`,
        },
        timeComplexity: "O(n + prereqs)",
        spaceComplexity: "O(n + prereqs)",
        edgeCases: [
          "No prerequisites at all: always true.",
          "A loop in one part of the curriculum while the rest is fine: still false.",
          "A self-requirement such as [0, 0].",
        ],
        commonMistakes: [
          "Reversing the arrow direction while also counting in-degree on the wrong end.",
          "Returning true when the queue empties, without checking that every module was taken.",
        ],
      },
    ],
    expectedTime: "O(n + prereqs)",
    expectedSpace: "O(n + prereqs)",
  },

  {
    slug: "curriculum-order",
    title: "Curriculum Order",
    difficulty: "MEDIUM",
    learningObjective:
      "Produce a topological order with Kahn's algorithm, using a min-heap as the ready set to make the order unique.",
    topics: ["graphs"],
    patterns: ["breadth-first-search", "heap"],
    statement: [
      rich(
        "A bootcamp has ",
        { code: "n" },
        " modules numbered 0 to n − 1. Each pair ",
        { code: "[module, required]" },
        " in ",
        { code: "prereqs" },
        " says ",
        { code: "required" },
        " must be completed before ",
        { code: "module" },
        "."
      ),
      para(
        "The registrar builds each learner's timetable by a fixed rule: at every step, take the lowest-numbered module whose requirements are all complete. Return the full timetable as a list of module numbers. If no timetable can include every module, return an empty list."
      ),
      example(
        "n = 5, prereqs = [[0,3],[2,4],[1,0]]",
        "[3,0,1,4,2]",
        [
          { state: "ready {3,4}", note: "take 3, the lowest — unlocks 0" },
          { state: "ready {0,4}", note: "take 0 — unlocks 1" },
          { state: "ready {1,4}", note: "take 1" },
          { state: "ready {4}", note: "take 4 — unlocks 2" },
          { state: "ready {2}", note: "take 2" },
        ],
        "Always taking the lowest ready module"
      ),
    ],
    constraints: [
      "1 ≤ n ≤ 1000",
      "0 ≤ prereqs.length ≤ 1500",
      "0 ≤ module, required < n",
    ],
    signature: {
      params: ["int", "int[][]"],
      paramNames: ["n", "prereqs"],
      returns: "int[]",
      functionName: "studyOrder",
    },
    tests: [
      { input: "4\n4\n1 0\n2 0\n3 1\n3 2", expected: "0 1 2 3", isSample: true },
      { input: "5\n3\n0 3\n2 4\n1 0", expected: "3 0 1 4 2", isSample: true },
      {
        input: "2\n2\n0 1\n1 0",
        expected: "",
        isSample: true,
        explanation:
          "Each course waits on the other, so no order exists and the answer is empty.",
      },
      { input: "1\n0", expected: "0" },
      { input: "3\n0", expected: "0 1 2" },
      { input: "3\n2\n0 1\n0 2", expected: "1 2 0" },
      { input: "6\n5\n0 5\n1 5\n2 4\n3 4\n1 0", expected: "4 2 3 5 0 1" },
      { input: "4\n4\n1 0\n2 1\n3 2\n1 3", expected: "" },
      {
        input:
          "700\n1100\n559 76\n77 165\n191 400\n369 299\n316 511\n67 405\n238 591\n70 157\n514 615\n473 338\n119 277\n120 679\n31 167\n146 166\n268 498\n446 653\n294 18\n207 535\n682 142\n597 275\n184 357\n493 221\n80 126\n391 537\n522 489\n223 110\n49 525\n264 274\n371 119\n495 494\n676 116\n261 634\n303 28\n320 162\n325 292\n255 328\n680 155\n261 418\n145 525\n225 504\n687 489\n302 358\n577 469\n199 666\n512 684\n118 32\n495 4\n628 413\n76 466\n40 582\n649 339\n337 693\n87 585\n10 331\n551 506\n81 555\n569 643\n532 524\n16 656\n117 292\n678 479\n575 64\n278 239\n631 234\n398 56\n664 590\n175 605\n210 482\n676 15\n312 385\n587 132\n391 195\n518 382\n428 233\n532 476\n593 169\n649 45\n568 69\n388 613\n505 351\n690 534\n391 477\n414 181\n571 208\n392 454\n366 204\n33 223\n279 234\n275 167\n24 572\n632 526\n478 417\n225 524\n104 32\n512 277\n550 352\n106 658\n431 141\n617 0\n469 439\n564 463\n205 579\n578 239\n158 382\n470 419\n349 35\n301 544\n256 657\n236 63\n414 131\n511 546\n2 61\n555 58\n290 410\n6 34\n53 100\n565 640\n383 154\n393 540\n309 667\n458 516\n362 209\n22 504\n114 189\n176 10\n590 636\n238 643\n16 205\n211 27\n628 138\n625 197\n435 32\n349 170\n169 653\n72 343\n300 398\n380 477\n461 277\n621 494\n353 382\n351 74\n207 493\n36 441\n248 63\n360 651\n443 299\n371 414\n471 596\n621 619\n320 633\n612 63\n562 362\n281 213\n584 537\n644 33\n79 361\n34 693\n520 530\n218 241\n543 571\n535 210\n331 525\n663 197\n252 396\n146 548\n686 248\n320 400\n113 544\n438 341\n241 591\n670 2\n531 84\n311 335\n627 178\n320 591\n617 627\n86 654\n391 13\n86 7\n193 456\n168 188\n216 458\n77 29\n226 594\n440 317\n228 483\n179 646\n49 204\n488 100\n96 201\n320 367\n337 693\n304 167\n423 583\n356 204\n270 524\n537 611\n647 104\n367 247\n147 305\n534 209\n34 282\n174 65\n471 13\n485 246\n420 7\n41 59\n632 157\n487 181\n164 20\n5 520\n21 462\n460 421\n170 559\n250 180\n386 82\n518 689\n607 657\n593 662\n125 602\n38 515\n455 105\n48 210\n264 131\n280 484\n143 581\n34 65\n224 590\n495 203\n138 331\n313 326\n644 80\n655 61\n436 85\n401 156\n216 580\n610 80\n181 541\n641 458\n102 518\n628 196\n584 482\n312 110\n249 327\n218 549\n597 219\n443 619\n189 116\n628 699\n615 500\n409 419\n367 414\n197 390\n270 632\n465 369\n217 75\n591 474\n217 108\n91 280\n356 528\n293 581\n263 45\n675 674\n649 326\n470 274\n431 504\n633 179\n542 597\n490 307\n394 232\n307 369\n690 11\n155 219\n632 352\n252 439\n367 80\n607 649\n380 385\n349 219\n140 294\n10 679\n636 152\n683 446\n394 95\n35 505\n317 408\n91 430\n428 662\n99 634\n293 530\n455 259\n317 646\n677 627\n321 372\n485 505\n45 124\n521 424\n172 404\n442 375\n628 339\n652 489\n535 286\n280 94\n438 1\n573 201\n280 659\n346 318\n135 652\n254 611\n305 209\n598 382\n283 228\n422 639\n676 145\n31 169\n241 689\n630 389\n55 561\n116 104\n586 572\n166 77\n162 319\n325 42\n575 248\n604 387\n372 462\n78 456\n70 265\n153 645\n246 270\n38 10\n480 659\n423 656\n579 318\n632 328\n547 126\n316 652\n699 354\n291 611\n316 648\n17 395\n505 230\n176 443\n581 59\n598 606\n633 486\n399 679\n304 161\n303 578\n696 682\n316 467\n460 588\n430 65\n608 7\n408 530\n584 201\n71 238\n699 260\n399 409\n575 52\n593 486\n194 14\n655 128\n598 371\n613 489\n156 67\n142 559\n173 299\n276 144\n497 478\n409 282\n325 1\n435 37\n658 410\n698 447\n542 597\n507 297\n436 306\n350 343\n698 573\n135 632\n172 607\n568 687\n119 131\n464 689\n510 530\n423 519\n363 125\n138 654\n464 658\n667 424\n451 43\n4 206\n355 189\n128 183\n496 267\n200 538\n555 657\n249 365\n99 426\n225 439\n697 274\n677 529\n258 352\n531 455\n624 117\n564 260\n442 657\n673 477\n135 332\n366 41\n224 654\n286 21\n277 94\n387 492\n627 259\n167 508\n414 74\n647 469\n628 688\n593 516\n98 153\n671 276\n317 84\n365 247\n171 29\n22 76\n38 626\n10 179\n223 137\n430 653\n174 259\n346 477\n672 242\n354 239\n191 56\n107 283\n101 610\n696 67\n28 614\n555 62\n138 250\n537 256\n697 239\n577 353\n655 5\n86 561\n605 293\n394 125\n682 29\n302 627\n26 658\n405 640\n563 84\n477 378\n218 382\n677 562\n571 351\n666 137\n388 451\n289 546\n617 638\n173 529\n563 454\n166 457\n266 534\n77 318\n518 351\n246 546\n214 181\n189 19\n633 594\n253 243\n583 646\n605 257\n355 373\n480 234\n7 156\n198 94\n270 462\n217 394\n222 486\n514 361\n146 104\n556 198\n149 235\n557 143\n635 466\n245 110\n577 50\n376 239\n586 590\n164 660\n160 182\n313 468\n330 486\n632 7\n81 380\n172 192\n397 611\n415 685\n320 429\n103 407\n221 445\n496 481\n498 19\n649 352\n297 347\n388 183\n450 178\n649 202\n360 567\n628 651\n53 75\n46 203\n493 307\n113 581\n125 162\n231 52\n151 106\n123 183\n345 86\n604 322\n386 337\n490 59\n431 179\n556 613\n207 587\n50 90\n248 319\n37 348\n577 475\n697 212\n131 486\n507 670\n187 535\n44 322\n533 59\n28 393\n456 521\n571 220\n3 53\n566 567\n340 57\n442 311\n81 450\n694 322\n224 692\n104 395\n70 167\n81 17\n592 344\n503 100\n307 662\n220 93\n592 520\n259 100\n697 639\n186 574\n138 72\n621 17\n672 434\n202 278\n588 63\n44 420\n620 295\n539 611\n16 239\n510 361\n485 266\n406 65\n303 131\n243 274\n75 273\n348 35\n578 572\n348 492\n678 180\n24 32\n432 613\n401 527\n391 107\n647 444\n3 14\n535 153\n484 483\n455 82\n504 567\n30 472\n27 74\n698 389\n311 517\n598 351\n365 68\n193 93\n425 222\n577 650\n452 211\n160 48\n349 84\n366 492\n468 273\n585 343\n686 357\n200 560\n679 501\n614 273\n602 17\n199 629\n399 192\n655 613\n535 638\n60 478\n662 126\n255 648\n146 622\n419 296\n377 142\n36 592\n435 625\n88 416\n213 278\n89 426\n142 544\n292 398\n261 357\n613 378\n350 499\n160 22\n490 146\n174 670\n251 588\n69 351\n627 693\n544 61\n60 319\n92 525\n456 159\n496 663\n329 261\n326 486\n122 298\n436 237\n649 652\n444 480\n628 689\n258 213\n381 354\n686 645\n677 7\n623 501\n19 582\n569 157\n555 305\n537 128\n477 131\n512 685\n92 227\n241 453\n549 555\n515 314\n168 463\n534 335\n172 648\n614 209\n473 401\n218 616\n587 44\n553 441\n470 234\n677 402\n164 132\n77 319\n246 431\n667 331\n356 403\n551 244\n362 463\n10 288\n192 231\n290 593\n129 626\n695 574\n438 211\n487 595\n377 525\n371 520\n158 373\n164 307\n628 522\n413 188\n435 233\n491 459\n538 179\n372 417\n526 94\n683 617\n576 383\n363 475\n236 655\n340 661\n284 85\n264 484\n581 206\n465 528\n120 306\n127 90\n381 128\n497 611\n367 264\n72 500\n595 471\n566 42\n640 545\n218 165\n106 328\n537 683\n443 616\n90 20\n106 328\n498 65\n610 463\n556 494\n363 16\n36 121\n79 225\n478 421\n536 267\n459 541\n128 29\n103 205\n3 583\n14 693\n607 576\n440 606\n542 327\n27 65\n97 331\n55 93\n466 165\n202 285\n436 196\n625 319\n202 407\n493 220\n64 480\n586 262\n377 40\n283 245\n307 451\n460 618\n70 209\n345 693\n76 685\n440 130\n372 23\n103 304\n638 631\n202 229\n140 262\n630 446\n628 459\n540 395\n173 110\n697 97\n655 147\n202 448\n203 74\n641 57\n490 58\n79 676\n550 225\n668 296\n265 80\n635 155\n523 153\n281 640\n599 75\n625 582\n351 27\n310 654\n187 84\n143 372\n345 558\n384 18\n690 33\n238 482\n461 440\n564 93\n4 423\n117 346\n408 167\n363 154\n307 422\n574 368\n173 457\n567 405\n416 351\n699 582\n88 660\n173 500\n662 609\n177 528\n337 5\n138 511\n631 150\n589 548\n467 541\n175 501\n622 25\n6 419\n0 93\n87 94\n351 548\n658 29\n630 275\n345 650\n312 628\n174 55\n600 120\n509 237\n415 378\n346 626\n602 430\n241 406\n253 429\n671 344\n266 591\n428 514\n81 1\n399 346\n460 151\n386 517\n202 520\n89 416\n298 378\n235 401\n203 395\n186 351\n215 113\n53 419\n214 364\n560 631\n515 67\n561 390\n307 145\n186 285\n399 589\n106 154\n523 233\n138 216\n118 105\n4 498\n166 389\n45 659\n76 197\n297 144\n677 272\n432 153\n557 502\n653 583\n468 100\n413 350\n172 245\n312 235\n279 1\n117 681\n70 253\n595 63\n379 300\n33 572\n181 572\n426 119\n228 51\n346 631\n329 258\n182 9\n367 296\n364 407\n522 432\n390 32\n281 343\n428 134\n459 421\n117 412\n10 403\n367 343\n356 402\n174 219\n184 534\n149 662\n38 653\n422 240\n473 578\n603 93\n579 424\n543 128\n534 19\n683 424\n295 56\n512 395\n416 681\n216 488\n103 552\n180 410\n350 508\n676 330\n498 137\n114 72\n235 513\n74 296\n553 21\n316 60\n461 113\n503 530\n320 288\n585 75\n652 618\n360 356\n561 570\n399 651\n690 81\n35 518\n369 339\n366 232\n164 219\n309 271\n364 105\n136 452\n374 288\n416 498\n99 413\n96 423\n503 603\n481 687\n269 583\n142 82\n329 136\n686 159\n157 337\n683 0\n698 579\n639 613\n485 688\n602 330\n611 5\n281 116\n493 691\n138 92\n221 582\n450 396\n125 468\n510 182\n388 384\n158 21\n418 284\n11 509\n222 100\n502 369\n261 243\n470 295\n11 276\n409 308\n411 479\n281 45\n383 494\n226 621\n412 331\n455 73\n393 470\n283 621\n93 405\n385 368\n234 130\n556 646\n135 491\n371 69\n539 122\n608 21\n304 479\n76 25\n624 121\n129 356\n345 550\n566 267\n658 361\n76 427\n36 178\n113 430\n347 439\n143 65\n394 284\n0 158\n624 227\n135 302\n83 470\n695 679\n111 13\n0 403\n587 82\n211 687\n224 591\n614 439\n129 669\n320 228\n171 481\n135 504\n325 599\n207 6\n512 536\n4 214\n454 29\n438 562\n246 143\n33 430\n154 603\n553 527\n44 211\n417 247\n46 66\n7 530\n38 471\n117 14\n194 58\n276 152\n683 106\n112 463\n102 385\n473 583\n393 66\n440 613\n539 268\n468 668\n696 97\n480 126\n507 39\n549 400\n57 31\n680 653\n246 237\n3 25\n136 196\n35 508\n400 350\n553 511\n200 385\n194 40\n394 160\n175 474\n649 154\n674 645\n675 259\n418 163\n139 555\n289 631\n135 573\n277 462\n312 577\n397 146\n504 469\n566 33\n447 317\n36 639\n185 115\n440 579\n425 603\n16 494\n199 684\n239 517\n690 23\n442 340\n68 100\n647 15\n697 277\n475 574\n8 426\n686 99\n163 453\n605 602\n338 530\n632 212\n549 37\n2 315\n663 212\n14 616\n447 213\n157 13\n117 466\n351 145\n33 559\n46 560\n173 133\n668 547\n478 402\n236 470\n683 268\n391 373\n549 116\n263 473\n10 645",
        expected:
          "1 9 12 13 15 18 20 23 25 29 32 39 42 43 47 51 52 54 56 58 59 41 61 62 63 65 66 73 82 84 85 90 50 94 95 100 68 105 108 109 110 111 115 118 121 124 126 80 127 130 132 133 134 137 141 144 148 150 152 159 161 165 178 182 183 123 128 185 188 190 195 196 198 201 204 206 208 209 212 219 155 223 227 229 230 231 192 232 233 234 237 240 242 244 245 247 257 259 260 262 265 267 271 272 273 75 274 243 276 279 282 284 285 287 288 294 140 295 296 74 27 299 305 147 306 308 314 315 2 318 319 77 162 248 322 323 324 327 328 332 333 334 335 336 339 341 342 343 344 352 357 358 359 361 365 249 368 369 370 373 374 375 378 298 122 382 353 384 385 389 390 197 395 17 104 116 203 396 398 292 300 379 402 403 404 406 407 364 410 180 250 417 419 53 409 421 424 427 429 253 433 434 436 437 439 252 347 297 441 445 448 449 450 451 453 163 418 454 392 455 457 166 462 21 158 277 286 372 321 463 112 168 362 466 469 470 83 472 30 474 476 478 60 479 411 482 210 48 483 228 484 486 131 119 222 264 326 330 426 8 477 380 488 489 492 366 387 494 499 500 72 501 502 506 508 167 275 304 350 400 191 413 509 11 513 516 458 517 239 278 213 258 311 354 376 381 519 521 456 78 524 525 49 92 145 331 97 412 526 527 528 177 356 465 529 173 530 338 408 510 520 5 202 531 532 533 536 540 393 541 459 467 491 544 301 545 546 511 547 548 351 69 505 551 552 553 554 558 562 563 570 561 572 24 181 214 414 367 371 573 574 186 475 578 579 205 103 580 216 581 143 293 557 582 19 40 189 114 221 355 498 268 534 184 585 87 588 251 589 591 266 592 594 596 471 595 487 597 542 599 325 601 604 606 598 609 610 101 611 254 291 497 539 612 613 388 614 28 303 615 514 616 618 619 443 620 621 226 283 107 622 146 397 623 625 626 629 631 289 346 560 46 634 99 261 635 636 590 586 637 638 639 36 422 640 405 67 93 0 55 156 7 193 220 401 235 420 515 564 565 567 504 225 550 571 543 603 154 383 425 503 576 608 642 643 238 71 645 153 98 432 522 523 535 187 646 179 317 431 440 447 538 200 556 583 269 473 633 320 648 255 650 577 651 360 652 316 653 169 31 57 430 113 215 446 461 602 605 175 630 641 654 86 138 310 655 236 656 16 423 4 96 495 657 256 555 81 139 658 26 106 151 460 659 45 263 280 91 281 480 64 444 575 647 649 607 172 660 661 340 442 662 149 307 164 428 490 593 290 663 664 665 666 667 309 668 468 125 313 363 669 129 670 174 507 671 672 673 674 675 676 79 678 679 10 38 120 176 399 600 680 681 416 88 89 684 199 685 76 22 160 394 217 415 512 559 33 142 170 377 566 644 682 686 687 211 44 438 452 136 329 481 171 496 568 587 688 689 241 464 518 35 102 348 37 349 435 549 218 690 691 493 692 224 693 14 3 34 6 117 194 207 337 157 70 345 386 569 624 627 302 617 632 135 270 246 485 677 683 537 391 584 694 695 696 697 698 699 628 312",
      },
      {
        input:
          "700\n1101\n385 464\n524 88\n322 381\n425 462\n213 237\n221 386\n164 188\n228 302\n270 239\n614 504\n654 266\n515 88\n445 386\n373 104\n203 361\n85 488\n186 395\n417 424\n420 465\n2 478\n21 75\n564 276\n646 348\n538 355\n129 190\n659 187\n176 475\n39 520\n316 519\n450 367\n243 181\n108 658\n287 688\n283 227\n206 8\n55 601\n103 342\n254 612\n392 667\n521 314\n391 370\n373 438\n201 558\n284 441\n641 299\n659 699\n215 682\n33 640\n402 361\n573 81\n588 400\n187 30\n267 67\n480 476\n380 494\n651 584\n264 369\n213 445\n284 237\n217 327\n510 692\n326 32\n292 527\n271 635\n244 441\n559 342\n647 469\n516 555\n109 257\n248 467\n559 615\n512 352\n162 641\n295 411\n278 624\n481 513\n623 210\n245 347\n417 519\n345 366\n290 641\n620 590\n493 563\n481 140\n93 296\n209 295\n44 286\n403 448\n120 189\n410 70\n297 488\n284 95\n47 83\n463 427\n381 413\n573 217\n11 353\n87 314\n95 556\n568 431\n474 530\n326 299\n421 516\n507 0\n633 42\n403 52\n532 432\n28 307\n209 595\n95 639\n487 683\n691 484\n221 111\n460 219\n338 39\n113 42\n206 403\n607 149\n102 295\n684 472\n500 391\n511 444\n461 509\n309 199\n155 228\n546 277\n175 257\n678 697\n581 603\n394 413\n11 200\n490 617\n356 119\n412 8\n420 2\n228 679\n449 501\n629 621\n174 462\n304 17\n362 385\n666 464\n295 146\n63 621\n628 311\n37 201\n81 15\n60 140\n365 8\n168 528\n141 631\n37 52\n539 276\n156 426\n597 158\n587 668\n123 475\n126 21\n135 312\n236 672\n469 436\n269 14\n87 590\n561 100\n485 7\n29 144\n612 393\n510 42\n596 474\n424 444\n309 230\n277 688\n476 336\n284 192\n547 0\n15 58\n591 144\n174 673\n259 521\n19 424\n4 553\n579 220\n2 315\n102 520\n130 369\n444 386\n542 523\n605 0\n274 294\n559 682\n481 372\n180 462\n445 121\n60 115\n404 555\n527 444\n156 390\n422 192\n542 127\n512 190\n526 233\n286 611\n49 695\n155 507\n322 498\n212 95\n33 279\n29 262\n19 498\n325 149\n533 490\n488 215\n427 451\n142 505\n577 552\n292 601\n12 658\n26 543\n457 311\n204 133\n11 363\n292 455\n577 656\n623 66\n447 7\n132 656\n438 22\n609 423\n142 591\n258 465\n163 334\n258 674\n397 656\n98 260\n575 407\n349 46\n97 118\n324 477\n27 346\n168 664\n694 419\n561 376\n397 30\n613 195\n58 541\n243 294\n306 121\n625 313\n511 352\n218 532\n626 323\n405 409\n222 555\n661 524\n68 128\n214 371\n164 679\n131 241\n546 109\n22 224\n218 552\n380 363\n249 451\n427 104\n248 23\n96 496\n435 650\n129 690\n696 140\n503 111\n356 329\n320 468\n550 581\n463 567\n457 651\n654 478\n411 56\n553 257\n442 124\n550 234\n620 693\n457 658\n324 399\n500 675\n66 286\n173 430\n509 472\n267 616\n618 169\n247 287\n91 248\n283 428\n442 494\n453 263\n123 230\n179 239\n129 575\n487 416\n111 639\n485 555\n623 668\n94 32\n75 657\n231 390\n655 128\n534 583\n212 599\n618 405\n103 690\n132 113\n588 482\n492 631\n74 456\n49 118\n37 419\n553 40\n246 230\n533 651\n181 574\n625 672\n429 346\n538 586\n671 298\n9 496\n173 575\n417 306\n84 468\n181 600\n228 266\n642 688\n246 265\n295 257\n443 65\n106 485\n325 468\n510 154\n487 7\n668 353\n38 360\n585 284\n409 151\n251 377\n43 248\n453 323\n396 53\n276 699\n389 507\n488 30\n484 609\n317 347\n662 681\n382 327\n685 414\n373 283\n668 139\n68 247\n317 382\n228 65\n85 688\n176 639\n34 128\n545 105\n203 616\n298 501\n207 501\n363 451\n554 699\n26 261\n538 138\n391 178\n22 228\n151 30\n526 651\n689 556\n106 132\n420 677\n53 219\n212 351\n118 91\n529 227\n505 199\n615 591\n169 293\n676 470\n660 449\n81 507\n463 192\n359 181\n689 665\n141 544\n651 537\n159 312\n632 466\n572 423\n12 424\n178 692\n403 314\n349 201\n169 380\n430 688\n415 443\n601 443\n342 128\n435 595\n38 649\n670 39\n274 466\n76 213\n495 175\n239 430\n182 353\n619 362\n498 338\n79 594\n550 178\n415 301\n477 302\n274 536\n239 581\n474 135\n119 239\n380 468\n177 168\n698 189\n550 454\n295 564\n533 94\n127 429\n438 543\n134 692\n97 182\n428 667\n172 158\n76 199\n220 649\n265 224\n554 228\n198 581\n571 341\n443 225\n687 176\n512 40\n252 100\n421 655\n404 379\n163 515\n155 578\n638 347\n218 558\n147 602\n201 517\n167 454\n163 697\n683 530\n626 134\n582 588\n148 287\n130 313\n18 649\n168 645\n622 315\n560 126\n254 272\n174 547\n2 371\n236 99\n590 695\n677 202\n485 310\n234 537\n383 420\n617 342\n563 521\n659 492\n62 645\n502 243\n242 467\n169 229\n290 353\n277 144\n206 595\n313 530\n691 280\n37 590\n87 84\n491 407\n156 336\n668 613\n358 593\n93 144\n200 56\n368 585\n554 641\n44 143\n441 7\n483 609\n7 379\n189 42\n268 570\n113 652\n447 16\n130 536\n34 119\n479 458\n292 494\n197 51\n111 79\n66 75\n531 446\n203 30\n265 166\n343 31\n13 529\n148 88\n292 273\n84 223\n184 499\n443 191\n45 190\n143 635\n200 652\n488 638\n4 594\n666 55\n512 158\n76 175\n242 291\n388 86\n83 451\n271 603\n269 18\n623 62\n626 315\n259 489\n410 437\n289 180\n697 348\n216 516\n153 91\n495 569\n689 612\n677 679\n596 432\n653 56\n131 576\n17 462\n461 29\n629 46\n101 98\n233 478\n660 431\n24 58\n659 278\n137 187\n512 464\n668 600\n13 482\n445 282\n605 529\n396 217\n575 482\n356 502\n480 343\n52 578\n317 319\n131 497\n412 19\n29 263\n9 72\n279 586\n157 398\n484 201\n13 425\n201 656\n135 164\n135 353\n329 557\n492 497\n28 649\n382 46\n280 363\n183 512\n629 116\n236 561\n526 537\n157 32\n525 148\n337 426\n240 117\n539 549\n324 381\n229 607\n212 6\n137 291\n306 276\n588 312\n41 441\n60 49\n548 545\n618 540\n402 581\n262 79\n311 139\n399 302\n34 167\n444 432\n476 514\n74 83\n221 318\n534 90\n666 123\n498 640\n375 692\n184 417\n692 520\n560 621\n81 243\n645 109\n388 346\n324 296\n12 660\n203 421\n160 112\n105 39\n473 224\n246 335\n243 30\n300 141\n41 306\n420 27\n427 9\n370 150\n672 651\n197 125\n245 253\n590 274\n93 211\n651 361\n554 324\n694 364\n193 273\n137 333\n2 529\n502 172\n615 309\n347 501\n221 101\n656 688\n519 133\n116 466\n364 48\n505 660\n263 430\n485 48\n418 690\n355 441\n260 614\n143 302\n81 174\n150 241\n130 549\n666 540\n301 47\n666 653\n539 509\n344 51\n84 427\n615 606\n316 414\n130 553\n190 575\n291 257\n35 271\n403 522\n338 411\n411 56\n275 341\n328 265\n381 283\n290 309\n96 316\n616 609\n29 692\n3 428\n81 55\n129 127\n158 226\n4 568\n358 395\n309 497\n196 681\n183 402\n49 561\n165 109\n584 67\n374 91\n424 646\n577 66\n559 48\n463 610\n471 492\n556 94\n666 259\n590 126\n258 394\n69 672\n167 64\n242 100\n86 451\n684 256\n150 679\n101 564\n278 631\n65 400\n525 695\n244 334\n403 514\n57 697\n548 441\n554 243\n356 194\n160 105\n4 591\n559 609\n521 348\n362 667\n676 191\n152 347\n297 319\n394 390\n95 432\n362 692\n177 384\n360 144\n620 367\n218 147\n469 272\n588 133\n539 404\n235 181\n26 664\n517 566\n435 595\n481 124\n272 230\n297 642\n441 501\n362 454\n371 136\n677 650\n494 56\n68 199\n529 186\n120 343\n480 529\n199 452\n424 519\n200 602\n339 287\n469 82\n470 432\n207 422\n421 381\n288 639\n482 341\n19 572\n140 377\n385 117\n368 283\n448 146\n189 125\n412 563\n360 307\n375 332\n527 144\n512 657\n422 688\n448 370\n177 594\n677 558\n396 321\n14 520\n335 99\n352 112\n253 315\n96 281\n549 208\n559 578\n193 327\n94 311\n171 506\n424 695\n352 104\n675 667\n649 693\n356 646\n4 199\n573 681\n551 388\n247 327\n284 104\n647 117\n677 126\n489 496\n439 477\n205 644\n439 266\n485 611\n463 332\n85 66\n592 219\n697 457\n348 464\n480 129\n57 66\n413 99\n507 335\n325 452\n109 679\n598 213\n268 42\n199 563\n488 179\n106 647\n378 556\n55 430\n463 427\n633 103\n456 249\n37 73\n556 303\n343 572\n376 56\n373 112\n96 427\n342 327\n374 141\n96 291\n1 279\n127 26\n364 452\n252 611\n374 343\n488 84\n588 653\n674 282\n362 660\n59 212\n92 22\n154 617\n243 692\n502 442\n512 489\n323 363\n424 86\n618 46\n532 564\n172 40\n350 662\n58 516\n243 661\n368 282\n463 174\n511 14\n170 537\n42 627\n698 361\n275 140\n251 164\n586 226\n269 256\n153 535\n323 603\n222 522\n210 0\n101 18\n607 390\n44 121\n552 281\n167 248\n156 666\n665 581\n373 422\n32 117\n484 384\n95 398\n694 82\n174 464\n19 226\n79 128\n268 346\n677 513\n152 42\n573 186\n310 541\n344 175\n213 648\n77 482\n284 18\n41 348\n346 657\n29 340\n351 147\n213 508\n461 660\n492 185\n560 664\n238 274\n416 3\n540 334\n130 270\n287 642\n262 504\n373 399\n53 457\n160 377\n120 50\n490 431\n406 531\n620 558\n92 275\n442 316\n92 576\n373 210\n588 624\n65 530\n143 333\n52 358\n445 185\n368 261\n238 667\n238 97\n567 17\n152 676\n489 305\n465 230\n264 371\n487 133\n106 341\n662 39\n34 182\n449 576\n344 3\n560 143\n59 553\n12 692\n406 139\n429 40\n207 187\n12 284\n326 369\n178 361\n38 198\n31 226\n548 276\n120 592\n457 697\n74 19\n164 416\n455 675\n553 42\n554 194\n238 253\n506 610\n27 30\n470 600\n471 58\n545 66\n698 547\n493 347\n357 227\n548 545\n442 232\n131 267\n498 658\n597 67\n453 258\n663 332\n618 467\n518 29\n289 519\n107 463\n203 653\n196 347\n98 334\n167 553\n152 113\n469 87\n308 448\n394 179\n235 348\n93 622\n448 668\n426 593\n74 178\n317 380\n385 519\n622 86\n550 327\n529 186\n690 631\n540 565\n248 504\n456 193\n202 583\n328 116\n637 448\n76 673\n29 588\n668 249\n359 689\n646 576\n345 674\n615 686\n538 482\n550 146\n619 151\n632 39\n186 581\n97 172\n384 638\n13 163\n405 110\n158 414\n365 193\n212 139\n636 434\n74 402\n381 631\n636 376\n214 441\n10 507\n677 385\n318 643\n283 379\n113 475\n218 302\n35 522\n590 140\n382 436\n661 339\n32 576\n121 395\n287 188\n463 188\n631 67\n269 321\n368 418\n500 94\n160 110\n540 78\n7 17\n92 205\n33 195\n636 599\n55 351\n37 56\n374 695\n76 413\n45 591\n368 603\n274 662\n15 531\n112 601\n157 676\n326 270\n253 517\n218 494\n397 578\n272 664\n460 395\n29 594\n456 190\n460 451\n129 694\n681 595\n13 699\n698 21\n296 673\n480 63\n204 334\n184 8\n413 273\n189 621\n660 501\n569 276\n201 555\n694 263\n330 607\n198 307\n393 528\n486 614\n665 547\n252 428\n588 563\n111 394\n577 3\n592 348\n661 399\n288 393\n40 333",
        expected: "",
      },
    ],
    hints: [
      "A module is ready when all of its requirements are done. Start by counting outstanding requirements per module.",
      "Taking a module can make others ready. Which data structure always hands you the lowest ready module?",
      "A min-heap of ready modules: pop the smallest, append it, and push any module whose count drops to zero.",
      "If the timetable ends with fewer than n modules, a loop blocked the rest — return an empty list.",
    ],
    solutions: [
      {
        title: "Repeatedly scan for the lowest ready module",
        order: 1,
        intuition:
          "Follow the registrar's rule literally: at each step look through modules 0, 1, 2, … for the first one not yet taken whose requirements are all done. If none exists before every module is taken, a loop blocks the rest.",
        approach: [
          "Group each module's requirements.",
          "Repeat n times: scan modules in increasing order for the first untaken one whose requirements are all taken.",
          "If none is found, return an empty list; otherwise take it.",
        ],
        code: {
          PYTHON: `def studyOrder(n: int, prereqs: List[List[int]]) -> List[int]:
    needs = [[] for _ in range(n)]
    for module, required in prereqs:
        needs[module].append(required)
    taken = [False] * n
    order = []
    for _ in range(n):
        pick = -1
        for m in range(n):
            if not taken[m] and all(taken[r] for r in needs[m]):
                pick = m
                break
        if pick == -1:
            return []
        taken[pick] = True
        order.append(pick)
    return order`,
          JAVA: `class Solution {
    public int[] studyOrder(int n, int[][] prereqs) {
        List<List<Integer>> needs = new ArrayList<>();
        for (int i = 0; i < n; i++) needs.add(new ArrayList<>());
        for (int[] p : prereqs) needs.get(p[0]).add(p[1]);
        boolean[] taken = new boolean[n];
        int[] order = new int[n];
        for (int k = 0; k < n; k++) {
            int pick = -1;
            for (int m = 0; m < n && pick == -1; m++) {
                if (taken[m]) continue;
                boolean ok = true;
                for (int r : needs.get(m)) if (!taken[r]) { ok = false; break; }
                if (ok) pick = m;
            }
            if (pick == -1) return new int[0];
            taken[pick] = true;
            order[k] = pick;
        }
        return order;
    }
}`,
        },
        timeComplexity: "O(n × (n + prereqs))",
        spaceComplexity: "O(n + prereqs)",
        edgeCases: ["No prerequisites: the order is simply 0, 1, …, n − 1."],
        commonMistakes: [
          "Picking any ready module rather than the lowest-numbered one.",
        ],
      },
      {
        title: "Optimal: Kahn's algorithm with a min-heap",
        order: 2,
        intuition:
          "Kahn's algorithm keeps a set of ready modules and updates it incrementally instead of rescanning. Making that set a min-heap enforces the 'lowest ready first' rule, so the order produced is exactly the registrar's timetable — the unique answer.",
        approach: [
          "Build arrows required → module and count incoming arrows.",
          "Heapify every module with a zero count.",
          "Pop the smallest, append it, and decrement each module it unlocks; push any that reach zero.",
          "If the order holds all n modules, return it; otherwise return an empty list.",
        ],
        code: {
          PYTHON: `import heapq


def studyOrder(n: int, prereqs: List[List[int]]) -> List[int]:
    unlocks = [[] for _ in range(n)]
    waiting = [0] * n
    for module, required in prereqs:
        unlocks[required].append(module)
        waiting[module] += 1

    # A min-heap makes "lowest ready module first" automatic.
    ready = [m for m in range(n) if waiting[m] == 0]
    heapq.heapify(ready)
    order = []

    while ready:
        m = heapq.heappop(ready)
        order.append(m)
        for nxt in unlocks[m]:
            waiting[nxt] -= 1
            if waiting[nxt] == 0:
                heapq.heappush(ready, nxt)

    return order if len(order) == n else []`,
          JAVA: `class Solution {
    public int[] studyOrder(int n, int[][] prereqs) {
        List<List<Integer>> unlocks = new ArrayList<>();
        for (int i = 0; i < n; i++) unlocks.add(new ArrayList<>());
        int[] waiting = new int[n];
        for (int[] p : prereqs) {
            unlocks.get(p[1]).add(p[0]);
            waiting[p[0]]++;
        }
        PriorityQueue<Integer> ready = new PriorityQueue<>();
        for (int m = 0; m < n; m++) if (waiting[m] == 0) ready.add(m);
        int[] order = new int[n];
        int k = 0;
        while (!ready.isEmpty()) {
            int m = ready.poll();
            order[k++] = m;
            for (int next : unlocks.get(m)) {
                if (--waiting[next] == 0) ready.add(next);
            }
        }
        return k == n ? order : new int[0];
    }
}`,
        },
        timeComplexity: "O((n + prereqs) log n)",
        spaceComplexity: "O(n + prereqs)",
        edgeCases: [
          "A loop anywhere: the answer is empty even if most modules could be ordered.",
          "A module unlocked by several requirements only becomes ready after the last one.",
          "n = 1 with no requirements: [0].",
        ],
        commonMistakes: [
          "Using a plain FIFO queue, which gives a valid order but not the lowest-first one.",
          "Returning the partial order when a loop exists instead of an empty list.",
        ],
      },
    ],
    expectedTime: "O((n + prereqs) log n)",
    expectedSpace: "O(n + prereqs)",
  },

  {
    slug: "two-team-split",
    title: "Two-Team Split",
    difficulty: "MEDIUM",
    learningObjective:
      "Test whether a graph is two-colourable by colouring breadth-first and checking every edge joins opposite colours.",
    topics: ["graphs"],
    patterns: ["breadth-first-search", "union-find"],
    statement: [
      para(
        "A five-a-side league is splitting its players into two training squads. Some pairs of players are rivals and must not share a squad. Players with no rivalries can go anywhere."
      ),
      rich(
        { code: "rivals[i]" },
        " lists every rival of player i; rivalry is mutual, so if j appears in ",
        { code: "rivals[i]" },
        " then i appears in ",
        { code: "rivals[j]" },
        ". Return ",
        { code: "true" },
        " if the players can be divided into two squads with no rivals together."
      ),
      example(
        "rivals = [[1,3],[0,2],[1,3],[0,2]]",
        "true",
        [
          { state: "0 → A", note: "start with player 0" },
          { state: "1, 3 → B", note: "rivals of 0 go to the other squad" },
          { state: "2 → A", note: "rival of 1 and 3, and nobody in A is its rival" },
          { state: "squads {0,2} {1,3}", note: "every rivalry crosses the split" },
        ],
        "Colouring outward from player 0"
      ),
    ],
    constraints: [
      "1 ≤ rivals.length ≤ 600",
      "0 ≤ rivals[i][j] < rivals.length, and no player is their own rival",
      "Rivalries are listed symmetrically and without repeats.",
      "The rivalry graph may be disconnected.",
    ],
    signature: {
      params: ["int[][]"],
      paramNames: ["rivals"],
      returns: "bool",
      functionName: "canSplitTeams",
    },
    tests: [
      { input: "4\n1 3\n0 2\n1 3\n2 0", expected: "true", isSample: true },
      {
        input: "3\n1 2\n0 2\n1 0",
        expected: "false",
        isSample: true,
        explanation:
          "Players 0, 1 and 2 are mutual rivals; two teams cannot separate all three.",
      },
      { input: "5\n1\n0\n3\n2\n", expected: "true", isSample: true },
      { input: "1\n", expected: "true" },
      { input: "2\n1\n0", expected: "true" },
      { input: "6\n1\n0 2\n1\n4 5\n3 5\n4 3", expected: "false" },
      { input: "7\n1 5 6\n0 2\n1 3\n2 4\n3 5\n4 0\n0", expected: "true" },
      { input: "5\n1 4\n0 2\n1 3\n2 4\n3 0", expected: "false" },
      {
        input:
          "600\n423 303\n113 359 300\n589 543\n416\n466\n22 109\n\n72 158 125 209 190 283\n436 440 504 458 67\n178 282 370\n417 222 59\n\n187 150\n574 405\n511 53 560\n592 298 227\n561 417 156 375 57 555\n362 486\n588\n\n439 136 64\n526\n5 433\n174 308 257 125\n88 44\n164 239\n496 341 96 329 193\n417 123 486\n131 120 562\n175 514 499 242\n386 116 334 439\n539\n\n489 236 133 248 86\n331 484\n313\n377 68 184\n340 349\n223\n103 517\n\n\n\n207 281\n24 485 555\n544\n58 402 442\n244\n\n520 384 496 118 108 70\n583\n500\n545 506 578\n423 501 324 14\n133 587 279\n\n466 284 256 372 571\n208 292 16\n104 216 89 336 46 418 406\n318 10\n140 599 449\n404 421\n\n478 148 170\n433 20\n454\n362 198\n8 459\n155 36 424\n298 353 551\n176 49 190\n554 117 102\n7 313 456\n93\n269\n180\n259 560\n138\n\n122 326\n\n315 216 167 130\n478 86\n150\n490\n\n547 160 82 33\n139 594 393 443\n24 252 347 306\n58 172 162 260 96\n460 328 341\n\n330 260\n168 268 73\n229 409 176\n523\n26 89\n328 316\n431\n374 591 367 422 543\n296 282 261\n293 132 479\n224 71 348\n241 39 501\n58\n402\n\n582 472 593\n427 278 49\n5 122\n\n122 250\n445 490\n1 216 283\n454 130\n507 157\n30 217\n71\n219 391 49\n570\n186 307 28 583\n416 288 198\n111 79 109\n534 213 231 27 319 282\n355\n23 7\n502 376\n346 246\n297 382\n528 163 553 593\n457 415 307 81 114\n28 179 266\n307 101 161\n231 54 33\n524 356\n167\n20 190\n203 379\n77 451 325\n410 87\n60 484 552\n\n\n384\n304\n\n505\n520\n257 355 63 448\n212\n12 83\n370\n154\n\n552 291 152 577 381\n68 322\n16\n518 353 115\n7 596\n514\n86 192\n557 202 391 132\n89\n129\n25 453\n459\n348 225\n302 135 81\n93 567\n363\n522 63 255 226 216\n289\n89 374\n\n277 23\n29\n70 94\n241\n9 298 389 221 481\n377 131\n182 343 75\n\n180 212\n\n440 460 36\n\n120 383\n192 12\n438 466\n506\n416 540 7 302 585 136 70\n440 435\n187 160\n527 378 26\n198 267\n421 430 460\n208\n246 296 476 322\n66 447 194 121\n\n307\n348\n161 569\n233 137\n461\n392 231 453\n\n43 388\n57 196 412\n233 7\n507\n\n149 182 352\n123 343 542\n350 309 479\n229\n58 113 81 170\n512 116\n483 393 338\n118 460 467\n422\n314 178\n554 296 10 314\n324 38 541 363\n102 554\n166 315\n321 170\n543 523 15\n243 450\n94 215\n464\n133 123 205\n426\n203 209\n\n335\n33\n279\n385\n462 25\n399 520\n103 177\n259 369 29\n228\n47\n356\n424 197 496 127\n\n423 33\n403\n380 111\n\n88 317 423\n396\n\n310 170 395\n407 56\n148 23\n527 447\n76 340 242 357\n378 89 92\n100\n425 387\n265\n552\n311 263\n360 363 131\n194\n288 93 590\n74 452\n500\n456\n424\n\n\n\n369\n174\n108\n237 54\n507\n43 420\n100 123 9\n515 113 419 7\n56\n\n459\n534\n268 588 121\n171\n\n154 485\n57\n101\n\n529\n100 429 197 222\n128\n549 69 178 15\n\n1\n410 586\n593 167 190\n348 0\n144 483\n\n338 88 318 466\n120 351 132 200 130\n23\n214\n255 522\n265\n328 535\n72 35\n221 222\n81 225\n97\n252 404 435\n369 59 306\n123\n436\n226\n394 155 197\n\n223 359 53\n569 333 138\n558 79 440\n\n97 312 90\n365 26\n92 366 475\n34\n\n544 325 351\n30\n235 420\n58\n573\n218 306\n396\n259 405 37 502\n26 441 90\n\n180 213 433\n528\n\n431 127\n448 88\n201 166 495 303 564 102\n37\n214 478\n440 307 333\n212 406\n69 157 579\n422\n148 124 586\n245 447 134\n259\n\n1 324 506\n266\n\n473 66 17 451\n266 223 169\n587\n329\n330\n389 99\n\n573 318 510 242 276\n440 151 512 525 9\n\n56\n531 452\n99 172\n519 16 427\n126\n36 179\n463 260 193\n595 137\n250\n154\n429 128\n186\n469 49 143\n429 563 405 238\n30 423\n414 262\n391 207\n367 178\n532\n118 388 161\n205\n218 87\n322\n577 255\n339 539 253\n\n\n240\n\n447 568\n105 438 46 543\n473 528 249\n545 61 317\n385 340 13\n598 425 352 58\n256 422\n493\n94\n139 301 553 506\n524 599\n487 208\n\n387 486\n130\n121 522 190 3 477\n10 16 27 484\n58 511\n283\n335 281\n195 61\n354 407 99 220\n248 0 252 53 386\n246 272 68\n406 262\n427 232 519\n108 426 375\n\n382 385 296\n195 527\n346 98 570\n576\n64 343 581 22\n541\n191 317\n8 320\n\n188 402 481 559\n20 30 495\n184 370 351 8 191 326\n341 537\n591 46\n87\n\n499 112 545 531\n\n567 401 525 356 198 258 583\n347 148\n60\n228\n138 362\n269 513 373\n164 205\n114 65\n\n72 271\n461 130\n8\n286 540 165 67\n90 219 184 195 549\n586 457 204\n509 239\n378\n230\n590\n56 4 188 306\n219\n\n384\n585\n472 484 544\n471 107 559\n583 362 403\n498\n330\n197 525\n535 416\n82 63 350\n515 214 101\n488\n438 572 178\n\n218 304 561\n140 34 471 417\n291 44\n27 414 589 17\n412\n480\n33\n84 562 112\n542 536\n563\n408\n\n348 595 439 533\n26 49 246\n502\n474\n445 29\n51 270\n103 53\n126 497 340\n592\n552 8\n146\n52 410 189 359\n115 587 280 210\n544\n462\n369\n14 591 418\n217 370\n452 528\n159 29 536\n479 283\n\n39\n157\n375 426\n49 147 240\n\n170 416 310\n95 227\n411 552 134\n447 476 370\n21\n430 258 193\n129 403 344 513\n295\n\n373 445\n390\n594 495\n123 287\n312 477\n514 594 491\n441\n\n396 31\n547 459 190\n587 223 434\n491 213\n2 227 402 99\n333 508 45 471\n52 404 445\n\n86 540\n\n298 460\n\n69\n154 504 264 524 140\n410 129\n71 222 224\n16 44\n\n161\n326\n438 472\n76 14\n16 483\n567 28 490\n385 492\n348\n\n\n447 562 168\n401\n325 202\n119 431\n596 56\n481\n369 337\n13\n\n432\n154 395\n52\n353\n\n433\n107\n473 50 447 120\n\n470 190\n461 355 301\n541 364 507 54\n18 288\n2 486\n268 465\n442 99 511\n503 15 594\n302 107 129\n87 592 533 536\n379 495\n571 158\n\n406\n411 60",
        expected: "true",
      },
      {
        input:
          "600\n260\n224 586\n454 247 377 362\n523\n549 576 450\n548 75 550\n\n482 178 372\n68 48\n399\n517 418\n352 555\n\n255\n179\n250 287\n474 184 495 428 261\n22\n586\n125\n\n590\n157 17 233\n\n256\n141 577\n249\n\n65 343\n262\n239\n540 174\n33\n551 32\n560 293\n\n\n341 354\n435 57\n476 418\n340\n263\n\n125\n507\n556 289 333 413\n480\n543\n416 104 8 353\n539 252\n425 68\n235\n\n253 302 468\n\n82 309 505 471\n527 144\n345 38\n164 129\n66\n278\n346 119\n325 383 313\n577 310 519\n478 82\n67 28 93 280\n59 468 286\n65 400\n8 50\n568 119\n574\n562\n581 337\n74 201\n73 205 557 161\n5\n\n228 226\n285\n200\n\n221 379 365 279 273\n559 250 55 64 210\n\n198 514 364 307\n202\n266 321\n260 142 588\n539 576 287 509\n90 503 466 125\n316 89 593\n\n330 348 259\n587 318 183 65 402\n234 559 540\n273\n580\n\n180 564\n378 217\n314 498\n375 508\n145 421 133\n467 583 169 224\n48\n\n\n563 274 421 374\n188\n558 393\n\n128 365 373 573\n389 175 517\n250\n\n134 221 503\n174 149\n156 407\n234 403 469\n493 563 69 61\n517 408\n467\n461\n586 207 281 211\n388 522 554 246\n19 89 43\n\n\n246 111 512\n58 376 407\n276 385\n362 348 150\n516\n548 102\n115 444 388\n\n\n154\n434\n563\n\n25 540\n209 410 87\n294\n56\n102 365\n238 350\n189\n154 195 204 203\n494 116\n535 544 434 131\n204 501 343 547 304\n547\n\n337 148 137\n\n355 354 117\n454 22 344\n472\n\n\n426 74 271\n448 399\n\n58\n476 205 343\n538 323\n572 217\n500 276 389\n103 561 340\n\n225 206\n510 289 228\n569 277\n116 248 31 320\n112\n599 304\n558 575\n209 7 496\n189 14\n455 502 98\n483 445 379 193\n\n93 243\n426 16\n278\n\n426\n108\n179 209 147 544\n301\n472\n304\n254 181\n512 585\n285 148 251 506\n562 496\n262\n231 599 84\n542 411\n79\n73\n495 85\n489 148\n246 148 151\n74 563 540 165 333\n171 417\n123\n\n142 178 189 559 339\n211 82\n210 123\n548\n380\n429 285 395\n333\n525\n99 167 395 413\n305 245\n250\n489\n81 115\n448 470\n566 530\n1 103 536\n171\n77\n\n371 496 77 172\n405 350\n453 598\n198\n\n597 22\n118 94 430 560 587\n51 493\n\n567 394 493\n507 146 538\n429 30 431 534\n\n\n459 330\n288 183\n444\n218 563 368\n204 128 408 547 124\n2\n174\n26\n82 15 219 113 586\n195 277\n272 49\n562 53\n193 523\n13\n458 592 401 24\n\n290 494 470 483\n92 399 371\n87 0 399\n540 16\n197 466 29 288 565\n41\n568\n\n86\n\n410 293 548\n431\n311\n467 161\n459 252\n95 81 289\n457 107\n405\n168 130 352\n251 173\n381 185 60 446 436\n479 81\n496 281 424 526 65 577\n280 123\n560\n437 306\n433\n214 195 573 78\n471 66\n544 88 15\n243 588 262\n45 172 293 273\n258\n\n471\n268 34 324 289\n306 143 529\n458\n383 567\n556 480\n529\n415\n\n190\n53\n419 375 361\n192 176 512 151\n335 218\n438 283 294\n365 565 492 84 310 399\n\n55\n426 63 368 484 307 311\n270 310\n345\n62\n100 425 317\n518 568\n90\n410 412 528 314\n93\n\n174\n86\n516\n166\n293 545\n62 358\n582\n446 345\n\n392\n92 334 242\n391 478 565\n566 433\n215 205 45 345\n588 330 484\n305\n\n154 72 441\n391 351\n209\n40 169\n37\n\n370 28 151 165\n157\n514 312 327 57 333\n61\n\n92 131 414\n470\n146 478 229\n431 338\n11 276\n48 561\n156 37\n156 573\n495 583\n395\n325 512 465 468\n364 437\n\n303\n445 557 131 2 385\n\n359 511 84 412\n307 81 111 145\n\n\n310 245\n474\n343 517\n228 594 259\n7 515 412\n546 111\n466 107\n101 563 303\n129\n463 2 513\n99 570\n81 181\n213\n278 532 499 596\n478\n296 62\n565\n362 130\n503\n551 437\n124 134\n455 112 549 168\n\n338 331 540 473 398\n329\n109\n237\n357 214 528 217\n440\n549\n391\n259 260 162 9 307\n67\n256\n559 549 93 594 588\n118\n\n275 229\n489\n117 129\n120 246\n\n268 142 317 552 588\n199\n317 364 372\n217 45\n348\n511 299 526\n48\n536 206\n493 39 10\n303\n577 557\n558 107 102\n449 549\n\n429 280\n50 507 314\n310 184 187 161\n\n16\n424 214 443 239 477\n234\n351 239 269\n\n284 332 452\n138 529 150\n38\n278 595\n283 359 387 522\n306\n\n465 396\n337\n586 562\n429\n244 486 526 134\n362 181\n450 327 278 452\n455\n222 162\n422\n446 562 492 4 498\n576\n575 476 446 433\n230 458\n2 157\n558 389 180 447 598\n\n274 563\n256 453 295\n531 242 272\n557\n122\n\n464 377\n568 463 516\n440 358\n374 262 89\n271 121 103\n538 66 358 53\n118 485\n222 258 349\n286 292 576 55\n596 158 191 588\n391\n16 369\n\n39 452 165\n527 429\n382 331 350 64\n279\n297 46\n\n7\n576 539 181 258\n334 310\n469\n444\n\n521\n531 203 220 406\n\n\n546 450 502 307\n235 418 119 237\n590 149 258\n356 16 202\n228 280 196 178\n\n100 450\n381\n168 514\n151\n180 492\n386 89 567 115\n\n55\n195\n44 238 425\n101\n88\n172\n415 364\n194 542 358 304 128\n377\n345 84 500\n372\n322 464 132\n120 370 10 582 112\n315\n63\n\n488\n124 437\n536 254 3\n\n216 534\n444 280 415\n56 599 477 569\n395 317\n294 434 298\n223\n459 489 595\n381\n\n525 239\n150 584\n523 417 224\n\n166 468 238\n49 483 574 88\n31 205 391 94 261 141\n\n512 199\n47 551\n150 287 189\n324\n492 373\n152 246 151\n212 5 268 133\n4 402 397 389 422\n5\n387 33 543\n587 410\n\n124\n11\n45 297\n362 420 74 460\n455 177 109 421\n82 402 94 209\n282 34 234\n169 353\n253 196 450 442 71\n139 579 107 205 375 457 119 245\n98\n307 384 262 331\n223 332\n237 503 296\n464 69 315 264 593\n173 527\n378\n\n167\n355 285 111\n539 70\n452 177\n483 451 88 4 471\n420 63 25 280\n593\n563\n96\n72\n326 517\n103 356\n535\n194\n123 442 1 18 250\n93 552 234\n334 288 472 87 410 402\n\n494 21\n\n256\n90 578 568\n371 402\n531 436\n472 381\n233\n455 230\n198 176 527",
        expected: "false",
      },
    ],
    hints: [
      "Put one player in squad A. Where must their rivals go? And the rivals of those rivals?",
      "Once one player is placed, everyone connected to them is forced. Spread the choice outward.",
      "If you ever need to place a player in the squad they already belong to the other of, it is impossible.",
      "Groups of players with no rivalry between them are independent: start a fresh colouring from each one.",
    ],
    solutions: [
      {
        title: "Union-find with opposite sides",
        order: 1,
        intuition:
          "Give each player two tokens: 'i in A' and 'i in B'. A rivalry i–j says 'i in A' goes with 'j in B', and 'i in B' with 'j in A'. Union those. The split is impossible exactly when some player's two tokens end up in the same group, because that would force them into both squads.",
        approach: [
          "Make 2n union-find nodes: i for 'player i in A' and i + n for 'player i in B'.",
          "For each rivalry i–j, union i with j + n and i + n with j.",
          "Return false if any i shares a root with i + n, else true.",
        ],
        code: {
          PYTHON: `def canSplitTeams(rivals: List[List[int]]) -> bool:
    n = len(rivals)
    parent = list(range(2 * n))

    def find(x: int) -> int:
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    for i in range(n):
        for j in rivals[i]:
            parent[find(i)] = find(j + n)
            parent[find(i + n)] = find(j)

    return all(find(i) != find(i + n) for i in range(n))`,
          JAVA: `class Solution {
    private int[] parent;

    private int find(int x) {
        while (parent[x] != x) {
            parent[x] = parent[parent[x]];
            x = parent[x];
        }
        return x;
    }

    public boolean canSplitTeams(int[][] rivals) {
        int n = rivals.length;
        parent = new int[2 * n];
        for (int i = 0; i < 2 * n; i++) parent[i] = i;
        for (int i = 0; i < n; i++) {
            for (int j : rivals[i]) {
                parent[find(i)] = find(j + n);
                parent[find(i + n)] = find(j);
            }
        }
        for (int i = 0; i < n; i++) if (find(i) == find(i + n)) return false;
        return true;
    }
}`,
        },
        timeComplexity: "O((n + rivalries) · α(n))",
        spaceComplexity: "O(n)",
        edgeCases: ["Players with no rivals.", "A triangle of rivals."],
        commonMistakes: [
          "Uniting i with j directly, which merges rivals into the same squad.",
        ],
      },
      {
        title: "Optimal: breadth-first two-colouring",
        order: 2,
        intuition:
          "Placing one player forces everyone connected to them: rivals alternate squads at every step outward. A breadth-first search assigns those forced colours. A rivalry between two players of the same colour proves the forced choices contradict each other. Restart from each uncoloured player to cover separate groups.",
        approach: [
          "Set every player's squad to -1 (unassigned).",
          "For each unassigned player, give them squad 0 and start a breadth-first search.",
          "For each rival of the current player: if unassigned, give them the opposite squad and enqueue; if in the same squad, return false.",
          "If every search finishes cleanly, return true.",
        ],
        code: {
          PYTHON: `from collections import deque


def canSplitTeams(rivals: List[List[int]]) -> bool:
    n = len(rivals)
    squad = [-1] * n

    for first in range(n):
        if squad[first] != -1:
            continue
        squad[first] = 0  # each disconnected group gets its own start
        queue = deque([first])
        while queue:
            p = queue.popleft()
            for r in rivals[p]:
                if squad[r] == -1:
                    squad[r] = 1 - squad[p]  # the other squad is forced
                    queue.append(r)
                elif squad[r] == squad[p]:
                    return False

    return True`,
          JAVA: `class Solution {
    public boolean canSplitTeams(int[][] rivals) {
        int n = rivals.length;
        int[] squad = new int[n];
        Arrays.fill(squad, -1);
        ArrayDeque<Integer> queue = new ArrayDeque<>();
        for (int first = 0; first < n; first++) {
            if (squad[first] != -1) continue;
            squad[first] = 0;
            queue.add(first);
            while (!queue.isEmpty()) {
                int p = queue.poll();
                for (int r : rivals[p]) {
                    if (squad[r] == -1) {
                        squad[r] = 1 - squad[p];
                        queue.add(r);
                    } else if (squad[r] == squad[p]) {
                        return false;
                    }
                }
            }
        }
        return true;
    }
}`,
        },
        timeComplexity: "O(n + rivalries)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A single player with no rivals.",
          "An odd loop of rivals (3, 5, 7 players), which is impossible.",
          "An even loop, which always splits.",
          "A conflict hidden in a group not connected to player 0.",
        ],
        commonMistakes: [
          "Searching only from player 0, missing conflicts in other disconnected groups.",
          "Colouring a player and enqueueing them again without checking they were already coloured.",
        ],
      },
    ],
    expectedTime: "O(n + rivalries)",
    expectedSpace: "O(n)",
  },

  {
    slug: "broadcast-delay",
    title: "Broadcast Delay",
    difficulty: "MEDIUM",
    learningObjective:
      "Use Dijkstra's algorithm for single-source shortest paths with non-negative weights, finalising each node the first time it leaves the heap.",
    topics: ["graphs"],
    patterns: ["heap", "breadth-first-search"],
    statement: [
      rich(
        "An emergency alert network has ",
        { code: "n" },
        " relay stations numbered 1 to n. Each entry ",
        { code: "[from, to, ms]" },
        " in ",
        { code: "links" },
        " is a one-way link: a message at ",
        { code: "from" },
        " reaches ",
        { code: "to" },
        " after ",
        { code: "ms" },
        " milliseconds."
      ),
      rich(
        "An alert is issued at station ",
        { code: "source" },
        " at time 0 and every station forwards it along all its links immediately. Return the time at which the last station receives it, or ",
        { code: "-1" },
        " if some station never does."
      ),
      example(
        "n = 4, links = [[1,2,4],[1,3,1],[3,2,2],[2,4,3]], source = 1",
        "6",
        [
          { state: "station 1 at 0", note: "the alert starts here" },
          { state: "station 3 at 1", note: "direct link, 1 ms" },
          { state: "station 2 at 3", note: "via 3 (1 + 2) beats the direct 4 ms" },
          { state: "station 4 at 6", note: "via 2 (3 + 3) — the last to hear" },
        ],
        "Earliest arrival at each station"
      ),
    ],
    constraints: [
      "1 ≤ n ≤ 300",
      "0 ≤ links.length ≤ 1000",
      "1 ≤ from, to, source ≤ n and from ≠ to",
      "0 ≤ ms ≤ 100",
    ],
    signature: {
      params: ["int", "int[][]", "int"],
      paramNames: ["n", "links", "source"],
      returns: "int",
      functionName: "broadcastDelay",
    },
    tests: [
      { input: "4\n4\n1 2 4\n1 3 1\n3 2 2\n2 4 3\n1", expected: "6", isSample: true },
      {
        input: "3\n2\n1 2 5\n2 1 5\n1",
        expected: "-1",
        isSample: true,
        explanation: "Nothing ever reaches station 3.",
      },
      { input: "1\n0\n1", expected: "0", isSample: true },
      { input: "2\n1\n1 2 7\n2", expected: "-1" },
      { input: "2\n1\n2 1 7\n2", expected: "7" },
      { input: "5\n5\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n1 5 10\n1", expected: "4" },
      { input: "4\n4\n2 1 3\n2 3 0\n3 4 0\n4 1 1\n2", expected: "1" },
      {
        input: "6\n7\n3 1 2\n3 2 9\n1 2 4\n2 4 1\n4 5 6\n5 6 1\n1 6 20\n3",
        expected: "14",
      },
      {
        input:
          "300\n800\n147 245 4\n4 43 48\n73 89 99\n24 98 12\n107 25 93\n2 64 21\n89 72 50\n40 48 74\n229 277 22\n155 14 45\n278 176 62\n196 41 52\n217 260 16\n165 225 43\n20 97 5\n113 217 61\n69 8 10\n144 6 91\n17 106 45\n122 131 96\n61 91 26\n3 5 73\n261 66 77\n13 203 7\n216 240 89\n264 101 16\n157 288 14\n70 62 14\n288 179 89\n239 81 29\n118 241 12\n45 162 10\n7 207 30\n111 279 89\n60 252 78\n31 32 50\n16 32 75\n89 123 2\n6 67 4\n34 140 25\n202 8 11\n25 243 72\n49 154 37\n161 295 92\n166 25 84\n290 256 94\n278 18 90\n32 56 79\n230 8 7\n176 42 4\n239 104 79\n186 90 20\n71 25 52\n107 126 1\n10 271 100\n99 125 98\n217 25 46\n57 168 39\n60 72 72\n92 132 19\n11 19 18\n31 90 54\n70 75 69\n187 49 7\n10 41 52\n27 53 22\n145 83 55\n84 288 62\n157 174 38\n44 272 72\n6 274 94\n145 60 60\n125 143 68\n50 213 30\n247 71 86\n62 102 78\n22 35 72\n250 58 5\n28 163 88\n251 32 55\n170 267 50\n84 148 63\n99 275 7\n227 173 44\n146 156 78\n82 145 36\n3 119 80\n201 170 97\n245 115 32\n61 254 51\n124 275 81\n33 94 17\n174 61 66\n94 122 20\n194 261 55\n12 206 31\n101 94 25\n82 101 12\n297 196 10\n120 124 5\n246 31 65\n117 263 48\n208 166 65\n28 236 3\n146 189 13\n46 28 89\n76 172 88\n7 24 83\n124 4 11\n298 111 63\n288 178 72\n159 132 37\n14 86 99\n143 149 22\n37 61 78\n6 76 96\n55 69 46\n261 108 71\n189 295 84\n34 155 30\n106 161 25\n250 75 49\n62 193 84\n181 115 100\n204 75 71\n42 246 21\n9 94 74\n236 185 56\n35 269 13\n227 215 26\n200 199 54\n39 80 86\n110 111 17\n65 195 21\n97 239 67\n282 215 62\n70 86 15\n67 109 43\n197 211 87\n34 160 94\n137 182 52\n259 296 91\n87 9 62\n7 42 11\n220 169 87\n155 263 5\n157 284 6\n49 71 40\n55 93 84\n248 17 56\n119 200 53\n176 230 100\n149 185 29\n37 222 35\n46 83 62\n32 73 22\n235 129 5\n203 204 45\n64 235 2\n121 239 14\n112 11 56\n93 215 81\n195 81 36\n94 71 14\n15 44 44\n161 13 80\n260 139 35\n191 194 52\n26 52 85\n197 224 16\n256 198 23\n230 273 98\n135 186 52\n98 293 22\n72 186 2\n99 261 52\n180 56 4\n129 240 63\n191 232 29\n247 159 54\n9 113 89\n14 300 81\n25 141 56\n276 201 9\n35 84 57\n185 207 39\n77 99 40\n32 177 62\n257 248 87\n70 49 41\n207 175 42\n43 230 57\n57 69 37\n32 221 63\n32 158 87\n259 99 35\n75 134 42\n44 67 87\n39 96 45\n251 274 3\n264 292 55\n117 142 22\n144 173 22\n137 47 20\n289 272 89\n135 165 43\n264 190 20\n87 206 44\n97 42 54\n171 276 62\n290 164 95\n142 152 2\n55 112 67\n18 119 45\n189 269 89\n296 202 48\n5 13 40\n131 61 79\n85 188 99\n126 205 17\n175 19 10\n198 240 69\n16 206 2\n45 121 22\n194 91 97\n170 175 75\n215 288 80\n288 204 50\n175 242 7\n20 69 38\n152 12 93\n211 239 85\n108 285 52\n79 255 43\n140 242 49\n222 231 41\n6 38 91\n40 133 60\n288 49 26\n9 54 87\n2 136 24\n45 28 71\n86 138 82\n39 215 59\n40 88 91\n81 296 71\n107 211 58\n12 185 81\n243 83 82\n82 117 69\n2 270 23\n52 219 44\n164 32 15\n204 105 90\n269 78 10\n184 198 61\n195 273 33\n270 68 61\n136 284 55\n79 50 94\n130 174 26\n261 38 46\n251 102 67\n59 178 64\n86 157 85\n5 21 76\n88 253 31\n173 54 86\n35 18 68\n89 296 84\n14 126 15\n11 70 44\n134 153 11\n126 211 10\n164 275 27\n95 182 49\n48 78 81\n7 62 93\n183 100 5\n17 293 30\n255 202 23\n132 250 80\n155 223 17\n75 234 4\n13 82 9\n96 123 41\n54 127 60\n296 82 88\n31 146 62\n272 254 0\n112 151 12\n7 39 47\n5 8 15\n204 266 75\n35 294 96\n15 30 95\n49 205 61\n50 179 37\n207 233 95\n189 120 38\n100 166 9\n10 55 20\n79 283 74\n291 114 45\n204 210 22\n195 22 57\n12 79 74\n40 85 1\n147 258 26\n157 208 55\n260 231 89\n110 85 4\n235 11 10\n179 230 92\n140 197 70\n116 71 32\n51 263 72\n6 149 52\n10 109 14\n245 112 15\n42 215 85\n83 193 71\n31 50 5\n157 99 74\n6 26 34\n57 230 56\n91 164 11\n37 286 2\n288 263 44\n265 286 9\n104 115 6\n143 39 72\n82 177 4\n184 141 71\n284 281 24\n207 297 19\n8 25 60\n124 139 61\n19 137 14\n156 280 1\n127 238 65\n162 167 37\n80 300 65\n260 105 27\n33 63 80\n82 83 49\n18 119 16\n229 242 31\n176 59 22\n298 96 35\n251 154 44\n7 9 65\n71 177 10\n196 100 58\n34 171 54\n182 193 28\n15 47 95\n110 114 37\n81 100 19\n74 173 49\n33 272 92\n75 50 78\n40 25 94\n163 256 30\n135 279 71\n228 279 79\n121 142 54\n41 95 35\n24 244 50\n26 135 40\n112 243 67\n214 237 94\n247 172 53\n58 105 48\n133 229 62\n111 212 70\n66 113 56\n103 210 100\n76 176 92\n281 233 90\n93 155 82\n6 125 12\n15 199 18\n93 116 57\n149 294 70\n43 168 6\n19 56 54\n15 23 6\n222 2 98\n169 272 9\n257 51 63\n213 122 27\n108 144 39\n132 231 93\n148 27 41\n10 81 86\n7 37 32\n171 283 6\n40 82 30\n15 176 55\n277 23 70\n195 248 87\n151 45 49\n59 125 17\n234 259 28\n196 105 61\n197 64 10\n20 237 57\n132 37 50\n260 282 70\n175 276 65\n23 126 3\n70 291 72\n262 15 98\n164 273 89\n202 195 32\n70 264 92\n150 177 80\n52 74 51\n39 135 40\n32 51 91\n82 279 81\n58 267 8\n96 268 41\n112 132 16\n29 212 22\n103 72 39\n217 160 92\n79 192 8\n214 166 70\n16 59 47\n212 268 4\n117 200 51\n60 184 66\n249 290 18\n79 100 29\n153 155 73\n179 199 87\n263 209 73\n25 181 90\n34 139 66\n229 196 12\n170 184 37\n45 103 86\n252 129 26\n127 139 22\n150 292 38\n123 259 32\n63 171 49\n61 91 59\n59 11 80\n147 189 42\n217 22 41\n235 225 90\n209 48 30\n11 60 52\n38 257 52\n119 198 22\n44 199 83\n150 195 27\n64 184 53\n122 205 100\n78 73 68\n27 29 14\n112 242 73\n80 183 65\n204 234 9\n46 188 79\n207 32 24\n57 58 17\n41 139 7\n288 239 6\n80 215 52\n90 151 70\n29 93 58\n242 105 71\n175 244 90\n44 249 64\n211 67 44\n10 36 98\n42 107 27\n19 94 69\n95 146 86\n91 153 93\n203 209 22\n287 187 41\n221 180 42\n12 16 63\n206 115 15\n53 84 68\n16 230 62\n125 147 35\n159 184 10\n274 299 64\n24 198 14\n266 70 61\n212 263 10\n13 22 15\n192 95 1\n144 183 48\n205 37 56\n162 270 38\n228 179 92\n252 63 19\n251 265 21\n136 168 1\n199 99 9\n100 296 81\n222 144 89\n128 14 39\n163 215 5\n141 29 66\n209 43 81\n89 229 68\n6 196 11\n291 153 19\n235 72 78\n105 46 52\n110 248 83\n2 6 10\n177 153 19\n202 151 35\n61 19 48\n93 157 5\n93 20 1\n160 165 97\n88 37 29\n91 147 10\n58 298 13\n224 181 34\n73 114 94\n126 79 90\n87 257 87\n280 292 5\n86 180 77\n147 163 7\n4 30 53\n137 78 90\n206 4 25\n228 98 95\n169 183 19\n2 7 88\n209 289 55\n229 5 5\n108 77 85\n2 45 37\n32 40 84\n54 66 29\n188 209 26\n22 156 89\n25 190 76\n11 15 26\n187 261 20\n118 24 73\n62 80 82\n56 94 33\n98 57 53\n1 190 99\n163 255 7\n18 115 91\n9 20 29\n210 212 60\n65 82 68\n298 98 53\n49 21 75\n11 40 62\n83 229 26\n215 216 40\n64 220 75\n153 187 98\n103 179 34\n70 98 10\n26 103 9\n61 66 56\n37 118 65\n160 227 59\n7 87 62\n212 299 59\n75 208 93\n205 157 22\n82 156 65\n166 260 56\n276 149 74\n16 246 65\n91 127 9\n10 12 65\n116 41 6\n142 49 29\n87 170 15\n293 137 1\n148 75 62\n3 169 98\n134 248 8\n167 60 9\n58 106 10\n227 205 53\n229 48 21\n179 11 83\n42 92 50\n282 196 4\n221 242 97\n29 51 65\n287 186 95\n100 110 41\n167 13 91\n182 297 32\n190 142 45\n99 52 32\n140 281 26\n15 262 38\n271 218 19\n108 175 49\n167 219 32\n1 2 83\n94 104 65\n60 55 74\n75 289 49\n135 159 48\n39 68 60\n217 88 31\n173 287 61\n29 34 18\n170 190 20\n272 81 95\n3 223 100\n45 250 12\n101 56 74\n7 12 87\n3 28 38\n198 190 32\n134 62 99\n154 187 11\n220 239 4\n55 194 69\n20 110 89\n215 131 58\n109 258 25\n88 191 76\n45 131 22\n1 3 70\n6 10 76\n153 205 38\n138 144 8\n196 251 20\n112 299 80\n195 247 15\n297 119 39\n2 46 61\n118 124 89\n135 167 69\n181 196 88\n20 59 73\n115 85 98\n84 136 7\n169 109 3\n120 201 96\n193 225 6\n116 257 58\n181 104 29\n245 239 78\n13 14 83\n183 61 77\n243 285 34\n189 105 99\n158 228 10\n297 4 26\n167 210 95\n27 98 5\n13 204 36\n7 27 27\n45 96 37\n8 11 56\n85 286 44\n106 167 42\n53 104 30\n281 70 54\n32 14 32\n204 222 15\n275 170 9\n105 103 37\n160 208 18\n286 84 37\n83 1 11\n150 191 85\n92 140 2\n55 281 14\n73 278 98\n113 129 60\n118 262 56\n216 228 36\n124 106 17\n13 31 62\n184 70 13\n200 93 12\n129 126 30\n64 191 48\n81 79 93\n134 39 62\n182 177 56\n165 261 85\n155 239 89\n5 248 20\n34 269 63\n56 65 74\n224 269 31\n93 114 100\n16 160 80\n144 17 66\n180 226 36\n185 14 7\n54 197 30\n137 182 62\n144 280 24\n36 262 87\n234 282 95\n61 125 16\n283 216 25\n133 177 94\n282 270 68\n197 289 30\n292 220 13\n12 133 3\n24 246 49\n215 143 38\n91 137 25\n57 150 45\n95 110 80\n76 40 35\n91 133 56\n109 237 48\n83 229 25\n82 298 52\n205 119 14\n199 90 97\n128 146 99\n171 38 87\n264 298 22\n13 17 4\n3 4 35\n18 287 77\n214 92 100\n240 298 68\n80 40 43\n174 108 97\n9 214 28\n4 33 94\n140 253 41\n112 299 70\n47 197 67\n12 1 10\n18 125 54\n95 202 55\n244 221 28\n52 232 33\n51 136 78\n70 9 76\n173 218 74\n186 274 12\n271 9 53\n107 203 10\n86 65 80\n76 165 21\n56 225 58\n211 57 48\n26 49 79\n12 28 15\n48 117 60\n30 100 66\n250 21 90\n50 57 34\n199 300 29\n34 77 6\n228 50 62\n15 69 100\n86 136 79\n44 108 8\n175 263 77\n248 274 63\n195 240 48\n51 130 10\n104 128 43\n36 202 71\n157 293 72\n210 12 41\n260 135 30\n218 237 42\n88 275 8\n88 148 46\n83 293 49\n10 18 22\n130 2 75\n93 120 36\n23 198 18\n231 178 88\n155 101 1\n199 149 53\n271 232 93\n224 125 77\n113 271 61\n292 245 7\n1",
        expected: "386",
      },
      {
        input:
          "300\n800\n181 256 31\n34 158 36\n78 172 24\n87 136 75\n30 151 78\n230 163 3\n44 77 60\n18 83 18\n175 256 30\n199 145 33\n292 58 16\n67 86 97\n64 199 71\n168 86 60\n63 258 39\n113 103 76\n10 62 4\n56 124 76\n77 240 4\n169 75 64\n72 79 42\n33 105 14\n60 280 17\n270 149 39\n261 246 96\n166 272 21\n136 70 26\n8 157 79\n201 281 15\n9 24 28\n82 104 3\n213 244 70\n91 53 70\n23 168 2\n186 58 78\n284 71 30\n3 175 43\n9 213 23\n247 121 54\n126 24 85\n27 287 20\n294 267 50\n227 217 88\n64 15 51\n284 187 6\n26 73 98\n117 262 3\n69 25 26\n208 101 7\n31 279 85\n92 143 93\n71 13 53\n160 295 46\n258 215 64\n206 223 92\n285 139 90\n177 75 43\n152 148 78\n47 186 32\n82 290 49\n150 197 2\n214 131 73\n15 79 12\n176 295 68\n29 71 18\n59 140 7\n253 164 32\n58 166 45\n46 81 76\n87 121 63\n132 297 57\n121 219 32\n14 44 75\n229 284 2\n134 199 20\n114 192 5\n3 27 72\n71 140 84\n135 149 79\n15 89 84\n261 28 3\n13 22 58\n3 278 43\n171 228 45\n134 205 48\n119 161 57\n224 237 8\n205 221 1\n108 129 67\n94 131 8\n196 135 98\n4 24 38\n29 155 8\n219 249 99\n198 220 81\n2 40 86\n73 24 46\n50 290 85\n25 123 87\n13 57 45\n193 106 96\n11 242 78\n37 155 32\n39 277 91\n83 234 53\n128 238 83\n46 123 28\n97 250 99\n81 149 35\n252 69 47\n86 252 75\n124 115 98\n173 149 48\n180 274 61\n262 81 66\n146 138 72\n38 78 3\n32 23 24\n140 252 1\n281 244 64\n147 247 14\n28 48 100\n210 276 4\n3 5 66\n94 274 3\n118 127 32\n32 53 68\n114 53 14\n115 88 29\n136 6 97\n228 285 98\n193 10 26\n162 209 63\n113 147 50\n266 127 41\n39 154 41\n23 75 58\n184 6 38\n13 23 5\n169 293 36\n188 151 90\n282 25 3\n90 119 36\n28 197 61\n128 54 77\n224 210 9\n296 122 74\n44 50 15\n120 144 57\n16 192 3\n224 258 79\n39 182 30\n11 25 66\n32 109 61\n220 80 4\n239 11 66\n179 189 81\n111 267 63\n56 50 35\n87 246 15\n168 192 65\n32 294 41\n65 74 57\n46 52 17\n88 270 91\n11 215 21\n43 183 33\n55 260 58\n269 249 61\n271 283 46\n29 111 3\n160 281 47\n256 296 24\n3 51 2\n3 6 95\n28 248 35\n125 15 40\n17 162 21\n263 106 1\n58 29 56\n3 63 49\n36 82 73\n64 70 100\n102 258 65\n138 210 55\n33 66 27\n69 289 100\n36 198 12\n241 112 99\n186 217 23\n215 73 68\n138 41 5\n78 115 91\n172 250 83\n52 72 72\n100 110 45\n183 203 88\n220 193 69\n16 238 57\n276 144 4\n28 208 50\n107 248 4\n244 93 85\n33 278 48\n30 176 72\n133 198 52\n10 292 20\n164 105 2\n98 173 45\n58 76 78\n135 74 64\n50 68 5\n184 251 86\n229 45 49\n76 267 57\n176 12 84\n275 172 37\n271 102 73\n242 1 63\n35 38 90\n51 220 80\n8 105 78\n209 31 9\n77 245 17\n238 156 70\n259 267 47\n66 203 44\n60 132 83\n129 292 53\n37 271 89\n112 229 64\n227 175 47\n80 213 43\n7 29 65\n122 80 42\n206 131 18\n36 207 92\n11 14 36\n222 266 86\n8 17 68\n100 43 34\n130 135 97\n283 54 72\n58 104 59\n104 28 47\n273 13 14\n119 271 11\n145 258 60\n225 69 11\n96 133 15\n191 35 54\n108 58 96\n149 179 75\n120 122 42\n98 291 89\n60 288 2\n126 148 87\n248 105 28\n16 146 71\n34 46 10\n127 243 92\n14 191 98\n106 183 76\n110 141 18\n207 127 85\n151 260 47\n187 74 47\n255 151 91\n294 86 13\n82 192 27\n197 286 13\n168 246 60\n92 52 60\n256 279 30\n37 42 67\n39 65 50\n19 91 34\n201 46 94\n283 291 64\n175 255 41\n283 74 33\n31 198 46\n220 115 48\n43 113 8\n226 271 75\n83 128 90\n113 289 36\n89 179 72\n224 263 43\n88 126 29\n209 265 49\n20 270 78\n108 92 66\n246 104 76\n1 123 61\n101 171 20\n135 275 88\n162 105 70\n166 18 90\n61 202 66\n93 162 23\n136 117 16\n104 212 3\n149 281 13\n97 108 59\n116 133 54\n6 50 50\n111 239 73\n52 130 18\n53 181 63\n112 211 73\n136 273 92\n282 255 11\n42 129 93\n82 139 9\n9 114 17\n79 264 18\n56 214 6\n102 135 34\n50 196 17\n71 257 20\n116 235 94\n179 266 68\n125 81 68\n161 163 74\n42 80 86\n11 20 6\n15 56 92\n156 230 60\n43 178 74\n81 90 43\n72 134 61\n293 52 76\n241 275 91\n74 91 15\n22 164 20\n100 158 50\n160 137 90\n31 49 54\n53 256 85\n18 161 86\n40 85 92\n221 7 50\n25 96 4\n148 86 68\n85 114 15\n26 209 76\n263 87 51\n1 19 38\n158 221 29\n292 255 9\n156 21 73\n12 54 31\n267 218 57\n122 220 10\n161 163 98\n39 83 74\n178 89 32\n29 112 53\n9 30 89\n223 119 11\n182 72 17\n73 19 51\n211 224 2\n239 191 61\n84 264 59\n236 26 37\n143 194 23\n6 35 95\n9 240 69\n244 51 22\n225 264 3\n267 250 34\n171 5 5\n151 133 77\n154 206 98\n214 125 2\n152 205 48\n22 26 63\n84 93 29\n92 274 58\n238 209 82\n7 117 1\n79 145 27\n47 288 89\n16 177 83\n15 47 9\n124 31 49\n235 267 89\n183 177 55\n105 186 85\n31 66 25\n20 35 72\n81 4 44\n285 286 89\n208 34 48\n227 113 13\n30 39 73\n164 54 64\n152 243 88\n103 137 95\n284 13 35\n197 36 14\n110 162 75\n262 167 11\n231 208 34\n296 167 31\n101 176 37\n74 118 45\n89 249 75\n91 234 87\n208 264 36\n151 131 45\n123 218 58\n102 51 18\n102 47 70\n123 91 36\n248 133 5\n6 153 78\n26 152 55\n70 137 27\n105 210 54\n88 146 82\n9 290 93\n87 253 60\n4 8 82\n186 240 21\n105 107 49\n202 45 14\n248 31 7\n190 254 6\n53 204 69\n118 99 19\n206 250 54\n231 283 10\n241 176 92\n234 254 10\n136 262 8\n11 57 67\n162 105 83\n57 195 38\n197 268 41\n48 179 55\n234 23 5\n284 196 12\n218 132 37\n297 265 84\n92 160 80\n219 87 43\n100 235 82\n76 241 87\n185 252 67\n17 21 19\n179 64 40\n10 85 17\n167 110 9\n245 75 69\n130 206 28\n82 212 58\n248 210 81\n61 132 83\n18 55 65\n20 100 27\n8 81 87\n68 98 26\n132 142 17\n225 269 26\n82 7 73\n54 279 4\n264 36 88\n87 70 5\n200 126 19\n154 202 30\n6 225 6\n126 45 67\n40 110 29\n69 34 86\n225 147 51\n230 218 90\n38 169 67\n20 37 22\n238 298 78\n138 215 29\n67 50 67\n59 218 21\n1 3 42\n241 3 68\n41 178 88\n95 189 25\n31 46 36\n282 214 16\n61 171 78\n62 80 64\n36 29 23\n44 201 13\n204 241 33\n118 155 69\n269 4 2\n174 34 64\n37 54 95\n69 252 82\n76 273 93\n100 106 29\n199 209 6\n236 149 83\n151 153 87\n206 237 54\n8 10 47\n56 51 20\n55 248 74\n241 260 19\n133 195 83\n231 16 6\n89 102 33\n16 227 46\n57 130 0\n6 15 94\n233 151 61\n51 170 28\n40 138 16\n173 179 31\n18 255 39\n18 238 29\n11 97 81\n131 190 48\n175 19 11\n72 27 95\n48 60 53\n58 68 6\n71 132 65\n77 213 2\n230 154 95\n243 300 27\n51 98 55\n81 48 4\n40 38 86\n104 157 15\n197 266 75\n264 1 79\n8 112 10\n148 107 15\n250 272 66\n6 33 17\n183 116 5\n208 257 33\n186 242 92\n99 125 81\n32 86 61\n162 276 36\n5 222 5\n15 197 71\n295 114 72\n101 6 95\n179 223 37\n35 125 66\n197 31 46\n207 142 18\n211 277 98\n196 129 83\n54 199 97\n31 69 47\n189 299 15\n151 244 78\n61 156 42\n49 12 14\n99 163 1\n2 123 73\n24 92 74\n154 167 79\n175 59 54\n91 201 1\n264 231 77\n142 207 100\n16 265 36\n156 193 74\n299 112 45\n59 168 18\n73 111 16\n27 61 60\n67 234 16\n28 40 12\n295 153 89\n192 10 56\n172 184 16\n13 109 36\n95 103 25\n84 228 20\n286 184 57\n80 204 63\n9 41 58\n98 56 90\n225 232 90\n81 290 48\n8 12 2\n3 61 56\n104 9 28\n34 48 75\n101 295 76\n276 30 83\n252 100 48\n112 269 69\n199 50 85\n27 59 82\n165 287 8\n21 43 54\n169 174 22\n1 2 2\n29 214 100\n1 32 74\n29 31 54\n36 99 37\n179 75 40\n245 217 92\n7 269 34\n193 26 0\n33 31 62\n69 72 89\n182 169 64\n35 84 69\n81 108 81\n16 77 22\n107 152 96\n165 287 73\n129 227 35\n294 26 25\n162 7 70\n269 41 29\n225 169 64\n40 117 21\n163 123 60\n272 234 57\n232 41 72\n150 188 100\n14 101 70\n14 296 49\n188 6 93\n6 9 95\n48 149 53\n9 244 72\n250 280 12\n155 122 18\n60 149 84\n240 263 51\n209 21 95\n57 130 65\n65 126 36\n135 216 37\n181 158 6\n87 185 25\n2 268 29\n136 87 100\n108 264 6\n4 285 81\n115 231 59\n214 220 47\n210 39 54\n192 294 26\n25 182 84\n227 121 62\n109 90 0\n29 34 90\n52 63 22\n235 294 49\n135 183 54\n199 291 19\n270 51 48\n103 300 93\n130 237 65\n104 118 53\n101 274 10\n11 226 50\n92 134 7\n14 16 52\n159 290 87\n168 295 100\n223 268 95\n64 200 65\n199 225 53\n115 287 58\n152 174 32\n256 38 15\n95 104 24\n42 268 34\n218 2 86\n249 299 94\n291 110 92\n125 233 79\n105 120 57\n61 180 12\n70 177 56\n96 154 83\n109 82 1\n65 131 77\n190 236 73\n40 159 43\n112 282 49\n214 89 68\n6 36 90\n12 13 41\n288 233 44\n223 235 99\n15 293 54\n81 175 76\n17 64 77\n142 196 83\n103 56 33\n172 145 65\n287 86 39\n236 196 16\n160 259 5\n70 299 52\n23 249 59\n162 31 9\n294 131 5\n201 108 76\n116 148 59\n100 123 64\n285 156 58\n18 262 41\n225 103 96\n161 23 98\n35 193 44\n93 111 100\n19 116 4\n187 110 80\n297 129 90\n35 166 36\n52 58 49\n37 41 20\n5 28 96\n143 178 41\n239 145 92\n254 130 78\n83 192 49\n237 137 64\n32 189 8\n239 297 58\n31 87 17\n214 143 36\n89 87 54\n288 180 57\n270 22 91\n92 123 54\n224 193 31\n9 55 24\n7 11 65\n91 150 10\n247 72 9\n183 217 8\n107 259 99\n39 120 10\n257 205 75\n87 94 20\n222 299 33\n59 67 21\n154 165 83\n195 217 67\n12 66 39\n16 18 59\n181 185 75\n191 6 74\n126 273 77\n3 45 19\n135 280 99\n142 150 84\n298 116 31\n68 261 35\n160 233 89\n26 100 31\n254 288 84\n96 286 71\n159 207 67\n66 64 74\n180 136 67\n134 205 73\n197 141 61\n17 51 60\n78 88 1\n188 106 84\n243 264 91\n295 254 67\n31 95 76\n117 39 57\n69 217 91\n80 279 94\n1 4 64\n5 7 47\n102 299 26\n253 300 10\n192 157 60\n123 191 96\n168 277 100\n214 216 50\n197 246 17\n39 187 74\n197 203 68\n81 20 81\n152 141 19\n89 149 81\n92 149 0\n150",
        expected: "355",
      },
    ],
    hints: [
      "Each station hears the alert at its shortest-path distance from the source. The answer is the largest of those distances.",
      "Plain breadth-first search counts hops, not milliseconds; a two-hop route can be faster than a one-hop link.",
      "Always settle next the unsettled station with the smallest known arrival time. Nothing later can improve it, since every link adds a non-negative delay.",
      "A min-heap of (time, station) pairs gives that station quickly. Skip entries for stations already settled.",
    ],
    solutions: [
      {
        title: "Bellman-Ford relaxation",
        order: 1,
        intuition:
          "A shortest route uses at most n − 1 links. So relax every link n − 1 times: each pass lets the correct times spread one more link outward. Simple, but each pass reads every link.",
        approach: [
          "Set time[source] = 0 and every other station to infinity.",
          "Repeat n − 1 times: for every link, lower time[to] to time[from] + ms if smaller.",
          "If any station is still infinite, return -1; otherwise return the maximum.",
        ],
        code: {
          PYTHON: `def broadcastDelay(n: int, links: List[List[int]], source: int) -> int:
    INF = float("inf")
    time = [INF] * (n + 1)
    time[source] = 0
    for _ in range(n - 1):
        for u, v, ms in links:
            if time[u] + ms < time[v]:
                time[v] = time[u] + ms
    latest = max(time[1:])
    return -1 if latest == INF else latest`,
          JAVA: `class Solution {
    public int broadcastDelay(int n, int[][] links, int source) {
        long INF = Long.MAX_VALUE / 4;
        long[] time = new long[n + 1];
        Arrays.fill(time, INF);
        time[source] = 0;
        for (int pass = 0; pass < n - 1; pass++) {
            for (int[] l : links) {
                if (time[l[0]] + l[2] < time[l[1]]) time[l[1]] = time[l[0]] + l[2];
            }
        }
        long latest = 0;
        for (int s = 1; s <= n; s++) latest = Math.max(latest, time[s]);
        return latest >= INF ? -1 : (int) latest;
    }
}`,
        },
        timeComplexity: "O(n × links)",
        spaceComplexity: "O(n)",
        edgeCases: ["n = 1: the answer is 0.", "A station with no incoming links."],
        commonMistakes: ["Forgetting that links are one-way."],
      },
      {
        title: "Optimal: Dijkstra with a min-heap",
        order: 2,
        intuition:
          "With no negative delays, the station with the smallest tentative time cannot be reached any sooner by a detour, because the detour only adds time. So settle stations in increasing order of arrival, pulled from a min-heap. The first time a station is popped, its time is final; later entries for it are stale and skipped.",
        approach: [
          "Build adjacency lists of (to, ms).",
          "Push (0, source) onto a min-heap.",
          "Pop the smallest; if the station is already settled, skip it. Otherwise record its time and push (time + ms, to) for each outgoing link to an unsettled station.",
          "If all n stations were settled, return the largest time; otherwise -1.",
        ],
        code: {
          PYTHON: `import heapq


def broadcastDelay(n: int, links: List[List[int]], source: int) -> int:
    out = [[] for _ in range(n + 1)]
    for u, v, ms in links:
        out[u].append((v, ms))

    arrival = {}  # settled stations and their final times
    heap = [(0, source)]
    while heap:
        t, station = heapq.heappop(heap)
        if station in arrival:
            continue  # a stale, slower entry
        arrival[station] = t
        for nxt, ms in out[station]:
            if nxt not in arrival:
                heapq.heappush(heap, (t + ms, nxt))

    if len(arrival) < n:
        return -1
    return max(arrival.values())`,
          JAVA: `class Solution {
    public int broadcastDelay(int n, int[][] links, int source) {
        List<List<int[]>> out = new ArrayList<>();
        for (int i = 0; i <= n; i++) out.add(new ArrayList<>());
        for (int[] l : links) out.get(l[0]).add(new int[]{l[1], l[2]});

        int[] arrival = new int[n + 1];
        Arrays.fill(arrival, -1);
        PriorityQueue<int[]> heap = new PriorityQueue<>((a, b) -> Integer.compare(a[0], b[0]));
        heap.add(new int[]{0, source});
        int settled = 0, latest = 0;
        while (!heap.isEmpty()) {
            int[] top = heap.poll();
            int t = top[0], station = top[1];
            if (arrival[station] != -1) continue;
            arrival[station] = t;
            settled++;
            latest = Math.max(latest, t);
            for (int[] e : out.get(station)) {
                if (arrival[e[0]] == -1) heap.add(new int[]{t + e[1], e[0]});
            }
        }
        return settled == n ? latest : -1;
    }
}`,
        },
        timeComplexity: "O(links × log links)",
        spaceComplexity: "O(n + links)",
        edgeCases: [
          "Zero-millisecond links, which are allowed and still work with Dijkstra.",
          "A link into the source, which never improves it.",
          "Stations that are reachable only in the wrong direction.",
        ],
        commonMistakes: [
          "Returning the time of the last station popped without checking every station was reached.",
          "Treating links as two-way.",
          "Finalising a station when it is pushed rather than when it is popped.",
        ],
      },
    ],
    expectedTime: "O(links log links)",
    expectedSpace: "O(n + links)",
  },

  {
    slug: "knight-hops",
    title: "Knight Hops",
    difficulty: "MEDIUM",
    learningObjective:
      "Shrink a breadth-first search on an unbounded grid by exploiting symmetry to fold the search into one quadrant.",
    topics: ["graphs", "matrices"],
    patterns: ["breadth-first-search"],
    statement: [
      para(
        "A chess puzzle app places a knight on square (0, 0) of a board that extends forever in every direction. A knight hops two squares in one direction and one square at right angles, giving eight possible hops from any square."
      ),
      rich(
        "Return the fewest hops that take the knight to square ",
        { code: "(row, col)" },
        "."
      ),
      example(
        "row = 3, col = 3",
        "2",
        [
          { state: "(0,0)", note: "start" },
          { state: "(1,2)", note: "hop +1, +2" },
          { state: "(3,3)", note: "hop +2, +1" },
        ],
        "Two hops to (3, 3)"
      ),
    ],
    constraints: ["|row| + |col| ≤ 300"],
    signature: {
      params: ["int", "int"],
      paramNames: ["row", "col"],
      returns: "int",
      functionName: "knightHops",
    },
    tests: [
      { input: "2\n1", expected: "1", isSample: true },
      { input: "3\n3", expected: "2", isSample: true },
      {
        input: "1\n0",
        expected: "3",
        isSample: true,
        explanation:
          "One square away in a straight line is surprisingly awkward for a knight: three hops, such as (2, 1), (1, -1)... then (1, 0).",
      },
      { input: "0\n0", expected: "0" },
      { input: "-1\n-2", expected: "1" },
      { input: "2\n2", expected: "4" },
      { input: "-5\n4", expected: "3" },
      { input: "1\n1", expected: "2" },
      { input: "0\n-7", expected: "5" },
      { input: "150\n150", expected: "100" },
      { input: "-300\n0", expected: "150" },
      { input: "120\n-180", expected: "100" },
      { input: "-1\n299", expected: "150" },
    ],
    hints: [
      "Each square is a node with eight neighbours, and every hop costs the same. That is a breadth-first search.",
      "The board is infinite, so the search must not wander aimlessly. What does the answer for (-3, 4) have in common with (3, 4)?",
      "By symmetry, the answer depends only on |row| and |col|. Search toward (|row|, |col|) only.",
      "You can forbid squares far into the negative side, but not all of them: some shortest routes briefly dip to -1 or -2. Allowing coordinates down to -2 is enough.",
    ],
    solutions: [
      {
        title: "Breadth-first search over the whole plane",
        order: 1,
        intuition:
          "Breadth-first search from (0, 0) finds the minimum hop count to any square, because it explores all squares at distance 1, then 2, and so on. On an infinite board it still terminates, since the target is at a finite distance, but it spreads evenly in all four quadrants.",
        approach: [
          "If the target is (0, 0), return 0.",
          "Run a level-by-level search from (0, 0) with a seen set.",
          "Return the level at which the target is first generated.",
        ],
        code: {
          PYTHON: `from collections import deque


def knightHops(row: int, col: int) -> int:
    if row == 0 and col == 0:
        return 0
    hops = [(1, 2), (2, 1), (-1, 2), (-2, 1), (1, -2), (2, -1), (-1, -2), (-2, -1)]
    seen = {(0, 0)}
    queue = deque([(0, 0)])
    level = 0
    while queue:
        level += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in hops:
                nr, nc = r + dr, c + dc
                if nr == row and nc == col:
                    return level
                if (nr, nc) not in seen:
                    seen.add((nr, nc))
                    queue.append((nr, nc))
    return -1`,
          JAVA: `class Solution {
    public int knightHops(int row, int col) {
        if (row == 0 && col == 0) return 0;
        int[][] hops = {{1, 2}, {2, 1}, {-1, 2}, {-2, 1}, {1, -2}, {2, -1}, {-1, -2}, {-2, -1}};
        HashSet<Long> seen = new HashSet<>();
        seen.add(0L);
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0});
        int level = 0;
        while (!queue.isEmpty()) {
            level++;
            for (int i = queue.size(); i > 0; i--) {
                int[] cur = queue.poll();
                for (int[] h : hops) {
                    int nr = cur[0] + h[0], nc = cur[1] + h[1];
                    if (nr == row && nc == col) return level;
                    long key = ((long) nr << 32) ^ (nc & 0xffffffffL);
                    if (seen.add(key)) queue.add(new int[]{nr, nc});
                }
            }
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(d²) squares for an answer of d hops — four quadrants' worth",
        spaceComplexity: "O(d²)",
        edgeCases: ["The target is the start square."],
        commonMistakes: [
          "Forgetting the seen set, which makes the queue grow by a factor of eight every level.",
        ],
      },
      {
        title: "Optimal: breadth-first search folded into one quadrant",
        order: 2,
        intuition:
          "Mirroring the board across either axis maps knight hops to knight hops, so (row, col) and (|row|, |col|) need the same number of hops. Search toward the non-negative target and refuse squares deeper than -2 on either axis; a shortest route never needs to go further back than that. Most of the plane is pruned away, and the visual stays focused on the region that matters.",
        approach: [
          "Replace the target by (|row|, |col|); return 0 if it is the origin.",
          "Run a level-by-level search from (0, 0).",
          "Only enqueue squares with both coordinates ≥ -2 that have not been seen.",
          "Return the level at which the target is generated.",
        ],
        code: {
          PYTHON: `from collections import deque


def knightHops(row: int, col: int) -> int:
    # Mirror symmetry: only the distance along each axis matters.
    tr, tc = abs(row), abs(col)
    if tr == 0 and tc == 0:
        return 0

    hops = [(1, 2), (2, 1), (-1, 2), (-2, 1), (1, -2), (2, -1), (-1, -2), (-2, -1)]
    seen = {(0, 0)}
    queue = deque([(0, 0)])
    level = 0

    while queue:
        level += 1
        for _ in range(len(queue)):
            r, c = queue.popleft()
            for dr, dc in hops:
                nr, nc = r + dr, c + dc
                if nr == tr and nc == tc:
                    return level
                # Short detours behind the origin are sometimes needed, never long ones.
                if nr >= -2 and nc >= -2 and (nr, nc) not in seen:
                    seen.add((nr, nc))
                    queue.append((nr, nc))

    return -1`,
          JAVA: `class Solution {
    public int knightHops(int row, int col) {
        int tr = Math.abs(row), tc = Math.abs(col);
        if (tr == 0 && tc == 0) return 0;
        int[][] hops = {{1, 2}, {2, 1}, {-1, 2}, {-2, 1}, {1, -2}, {2, -1}, {-1, -2}, {-2, -1}};
        HashSet<Long> seen = new HashSet<>();
        seen.add(0L);
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0});
        int level = 0;
        while (!queue.isEmpty()) {
            level++;
            for (int i = queue.size(); i > 0; i--) {
                int[] cur = queue.poll();
                for (int[] h : hops) {
                    int nr = cur[0] + h[0], nc = cur[1] + h[1];
                    if (nr == tr && nc == tc) return level;
                    if (nr < -2 || nc < -2) continue;
                    long key = ((long) nr << 32) ^ (nc & 0xffffffffL);
                    if (seen.add(key)) queue.add(new int[]{nr, nc});
                }
            }
        }
        return -1;
    }
}`,
        },
        timeComplexity:
          "O(d²) for an answer of d hops, about a quarter of the unfolded search",
        spaceComplexity: "O(d²)",
        edgeCases: [
          "(1, 0) needs 3 hops, for example (2, 1), (3, -1), (1, 0) — a route that dips below zero.",
          "(2, 2) needs 4 hops even though it looks close.",
          "Negative targets, which mirror to positive ones.",
        ],
        commonMistakes: [
          "Forbidding all negative coordinates, which gets (1, 0) and similar squares wrong.",
          "Checking the target only when a square is dequeued, which costs an extra level of work.",
        ],
      },
    ],
    expectedTime: "O(d²)",
    expectedSpace: "O(d²)",
  },

  {
    slug: "both-coasts",
    title: "Draining to Both Coasts",
    difficulty: "MEDIUM",
    learningObjective:
      "Reverse the direction of a reachability question so two searches from the boundaries replace one search per cell.",
    topics: ["matrices", "graphs"],
    patterns: ["breadth-first-search", "depth-first-search"],
    statement: [
      para(
        "A hydrology model represents an island as a grid of ground heights. The Northern Sea touches the top and left edges of the grid; the Southern Sea touches the bottom and right edges. Rain falling on a cell can flow to any neighbour above, below, left or right whose height is less than or equal to the current cell's, and from any edge cell straight into the sea beside it."
      ),
      rich(
        "Return how many cells of ",
        { code: "heights" },
        " can send rainwater to both seas."
      ),
      example(
        "heights = [[1,2,2,3],[3,2,3,4],[2,4,5,3],[6,7,1,4]]",
        "5",
        [
          { state: "north-reachable", note: "climb from the top and left edges" },
          { state: "south-reachable", note: "climb from the bottom and right edges" },
          { state: "both", note: "(0,3) (1,3) (2,2) (3,0) (3,1) — 5 cells" },
        ],
        "Intersecting the two climbs"
      ),
    ],
    constraints: ["1 ≤ rows, cols ≤ 50", "0 ≤ heights[i][j] ≤ 1000"],
    signature: {
      params: ["int[][]"],
      paramNames: ["heights"],
      returns: "int",
      functionName: "bothCoastCells",
    },
    tests: [
      { input: "4\n1 2 2 3\n3 2 3 4\n2 4 5 3\n6 7 1 4", expected: "5", isSample: true },
      {
        input: "2\n3 3\n3 3",
        expected: "4",
        isSample: true,
        explanation:
          "Flat ground lets water wander anywhere, so every cell reaches both coasts.",
      },
      { input: "2\n5 1\n1 5", expected: "4", isSample: true },
      { input: "1\n9", expected: "1" },
      { input: "1\n1 2 3 4 5", expected: "5" },
      { input: "1\n5 4 3 2 1", expected: "5" },
      { input: "3\n1 1 1\n1 0 1\n1 1 1", expected: "8" },
      { input: "3\n4 4 4\n4 0 4\n4 4 0", expected: "7" },
      { input: "3\n1 2 3\n8 9 4\n7 6 5", expected: "7" },
      {
        input:
          "45\n0 0 4 3 4 2 5 5 4 0 4 0 2 2 6 3 5 2 1 5 0 6 3 0 4 5 1 4 2 6 4 1 1 5 0 5 5 1 2 0 2 1 3 0 0\n6 4 6 0 0 3 2 3 4 0 3 3 2 3 3 3 1 2 4 5 4 5 3 3 1 2 0 6 6 4 5 4 6 6 6 1 4 0 2 2 2 6 2 4 0\n1 0 4 3 6 4 6 0 3 1 3 3 3 3 4 1 2 6 0 2 2 0 5 0 0 0 3 5 5 0 0 6 4 1 6 0 3 6 6 6 2 0 2 0 3\n1 0 2 0 0 6 3 2 2 1 4 1 3 5 3 6 6 3 1 0 5 4 3 3 2 4 0 1 2 3 6 0 1 3 5 5 2 0 3 2 2 5 4 3 0\n1 5 3 3 5 0 5 3 5 2 1 0 3 3 4 3 6 1 4 6 1 3 1 0 0 5 2 2 3 2 0 2 2 4 5 2 3 5 1 1 6 4 0 1 6\n2 3 3 1 5 1 2 2 6 5 1 5 1 1 1 3 6 4 6 0 5 2 4 3 2 3 4 3 3 6 1 3 6 3 2 3 5 6 3 5 4 6 1 5 3\n2 3 6 4 6 0 6 4 1 5 0 5 1 3 0 3 2 2 0 2 6 3 3 5 5 0 3 1 6 3 1 1 5 6 2 5 1 2 0 4 6 1 1 4 4\n6 2 5 0 3 0 3 6 2 4 5 1 1 1 1 0 5 2 6 4 6 3 3 4 0 1 2 2 4 1 6 5 5 4 6 2 0 4 0 6 6 1 1 0 5\n2 5 3 6 0 1 2 4 3 4 0 6 4 3 5 6 6 4 4 6 6 1 6 3 3 3 4 1 0 3 3 1 3 3 2 4 3 6 0 5 2 0 0 1 4\n5 4 0 0 3 0 3 4 2 4 1 6 3 0 0 0 3 5 6 4 5 3 5 0 3 4 6 5 2 2 5 2 3 6 0 5 2 5 3 1 3 6 5 5 6\n4 4 2 4 0 2 5 0 5 4 2 5 1 5 1 6 3 0 2 5 2 5 3 6 0 1 0 1 5 6 4 0 0 5 1 3 6 1 1 1 1 2 6 0 0\n6 1 1 4 6 2 4 4 4 4 4 2 2 4 5 2 4 1 3 0 3 2 1 3 2 1 5 6 5 0 6 3 2 4 5 5 6 4 1 5 5 4 3 5 6\n4 1 5 3 6 5 0 6 3 0 2 2 6 2 2 4 0 4 1 0 5 1 0 1 2 3 5 3 5 2 1 5 5 2 1 4 4 3 3 6 3 6 2 1 5\n4 1 2 5 2 0 1 0 3 3 3 1 4 2 0 1 5 4 3 6 4 4 5 1 3 3 6 3 3 3 1 0 4 3 6 1 3 2 2 1 6 3 4 4 0\n3 4 5 2 4 0 0 4 3 3 2 4 6 5 0 0 2 6 3 5 4 6 4 5 5 0 5 1 4 4 3 1 2 6 1 4 0 6 4 6 1 3 5 1 1\n2 0 0 6 1 2 6 2 6 3 3 1 6 1 4 0 2 4 1 0 5 4 1 3 2 5 2 1 2 4 0 1 5 0 2 2 5 4 2 2 0 6 3 4 0\n6 1 2 1 6 0 4 6 6 2 2 6 0 5 1 3 0 5 6 5 2 6 4 1 1 0 4 2 5 4 1 5 3 4 3 2 5 2 5 1 4 1 3 1 4\n2 2 3 3 1 6 0 4 4 3 3 4 3 1 0 4 0 0 6 4 3 2 0 5 6 1 3 0 3 1 6 0 4 0 3 5 2 2 2 0 0 1 1 0 3\n4 0 0 2 4 1 5 2 2 0 5 2 1 1 1 1 1 3 6 0 3 0 1 4 4 5 1 6 3 6 6 6 5 0 4 3 4 0 6 2 2 1 0 3 4\n3 1 3 5 5 1 0 4 3 3 5 5 6 5 0 2 6 5 2 2 3 2 3 2 2 3 4 6 5 6 0 2 1 1 3 4 0 5 6 6 0 2 1 1 4\n2 2 4 6 2 4 6 0 2 3 2 5 1 6 5 4 6 3 4 3 5 1 6 4 6 4 1 1 1 1 4 6 6 3 3 3 5 6 0 2 5 0 2 6 2\n5 3 5 1 5 2 2 5 6 1 1 4 3 0 5 0 6 6 3 2 5 5 3 2 6 4 6 3 1 3 6 4 4 5 3 0 4 5 1 0 1 6 6 2 2\n6 1 0 2 2 0 6 0 1 3 4 0 6 5 1 4 1 3 6 5 1 1 1 3 3 4 2 5 2 1 1 3 2 6 4 2 4 5 5 4 3 6 0 2 6\n1 3 5 4 6 1 2 3 5 3 3 4 0 1 4 5 3 2 6 4 2 2 5 2 1 6 4 5 1 1 1 6 0 1 5 3 6 5 1 0 6 2 0 0 6\n6 3 0 1 5 4 2 2 4 3 3 3 0 1 3 5 3 2 6 2 4 3 3 4 3 6 0 3 6 4 3 4 1 5 4 1 6 2 4 1 2 5 5 0 1\n2 5 5 4 6 0 3 1 5 0 2 0 3 5 5 1 5 4 5 2 4 1 4 4 4 4 2 5 3 1 4 4 2 4 5 5 0 6 5 2 3 6 2 4 3\n2 0 2 6 2 6 4 2 1 3 5 2 3 0 1 2 5 6 1 0 0 4 0 3 6 4 2 5 2 6 6 2 0 5 0 1 0 3 2 0 4 3 6 1 1\n6 4 6 6 2 1 2 0 3 1 3 6 3 2 3 3 1 3 2 3 2 5 6 1 5 2 2 2 6 4 6 4 6 1 5 1 0 6 0 1 2 1 5 6 0\n1 5 4 4 6 0 6 2 6 6 4 2 1 2 6 4 6 5 1 3 2 5 6 1 0 5 3 0 0 2 6 4 4 2 0 3 4 1 2 2 5 3 2 4 2\n4 5 3 4 2 5 6 5 4 1 6 1 2 0 3 3 3 2 6 1 2 6 3 6 0 1 0 1 3 3 3 2 0 3 1 2 6 4 1 2 1 5 3 1 1\n6 1 2 4 5 3 5 5 1 0 0 6 5 2 5 1 1 3 5 2 3 4 5 1 2 3 5 4 2 2 2 6 4 5 0 1 2 1 0 5 2 6 4 1 1\n5 0 5 3 4 4 1 2 4 2 3 3 5 0 1 1 2 3 4 2 4 4 6 3 4 6 6 1 2 1 0 4 3 2 1 3 6 6 0 4 2 6 1 0 6\n1 3 5 2 4 2 0 1 1 1 5 0 2 2 6 4 4 1 6 6 0 4 5 0 4 5 3 1 2 6 5 3 3 1 6 6 6 1 3 2 2 4 5 0 4\n3 4 3 2 6 3 5 5 3 4 6 6 1 6 6 4 0 0 4 0 3 3 4 3 5 2 1 4 4 3 3 3 0 5 6 6 0 5 3 6 4 4 2 2 0\n5 1 0 6 4 2 5 3 1 4 5 1 2 5 1 6 6 3 0 5 1 2 4 0 6 0 4 0 0 5 1 6 5 1 2 5 3 3 0 3 2 4 0 6 5\n2 3 5 3 5 0 2 2 0 5 0 3 4 6 1 3 5 1 2 4 5 1 5 1 5 2 4 1 4 4 3 0 0 4 0 5 2 0 2 6 6 6 1 6 2\n6 3 4 2 6 1 2 2 4 5 3 2 6 1 4 1 6 6 2 1 4 6 5 6 5 4 0 3 4 6 2 5 1 4 0 3 5 0 2 5 3 3 4 6 2\n4 4 3 3 3 1 0 4 1 0 5 2 6 3 6 0 0 0 6 5 5 3 2 0 4 6 4 2 4 3 0 1 3 6 2 4 2 5 0 5 6 1 5 6 2\n2 1 6 3 3 2 5 0 0 1 6 6 6 1 1 2 3 2 5 5 3 6 0 0 5 0 2 3 1 2 0 5 5 1 4 3 3 3 1 2 4 0 2 5 6\n0 4 5 5 6 3 1 0 0 3 5 0 5 0 3 5 5 6 2 6 2 3 5 3 3 1 1 5 5 5 3 2 2 2 2 6 1 6 6 5 5 3 5 4 6\n2 6 0 4 0 6 0 4 1 0 4 6 0 2 2 6 0 0 5 0 4 1 6 6 4 2 3 3 3 2 5 6 4 4 1 5 0 0 0 0 4 6 4 1 3\n4 5 1 2 1 1 2 5 5 5 2 0 4 3 4 3 4 0 4 6 6 1 5 1 1 0 4 4 2 5 4 0 2 2 1 4 5 4 1 5 4 1 3 3 5\n1 1 0 1 2 0 3 5 3 2 6 1 0 1 4 3 3 6 2 1 2 3 1 5 6 1 2 2 3 6 1 4 1 0 0 5 2 6 5 6 6 1 6 4 6\n1 5 1 5 5 1 2 4 6 5 6 6 0 2 3 4 4 4 5 3 2 5 1 0 2 3 5 5 4 5 4 6 6 0 5 5 5 1 6 1 4 2 0 1 2\n2 3 5 1 3 3 3 1 2 5 2 3 4 2 2 4 1 0 4 1 3 6 5 3 3 1 4 4 0 1 4 4 1 0 6 1 0 4 0 3 3 6 3 1 0",
        expected: "11",
      },
      {
        input:
          "40\n795 290 870 566 493 472 292 807 457 831 869 59 103 606 753 683 131 277 759 762 215 188 522 751 475 61 371 93 571 617 821 490 237 834 8 954 476 803 661 306 11 507 54 88 103 745 391 156 399 59\n494 302 65 731 255 681 470 773 160 127 163 172 546 367 409 955 990 862 895 548 768 51 214 151 2 900 535 454 827 817 624 303 950 312 471 73 359 7 627 510 94 501 963 105 154 549 18 750 14 550\n998 102 524 448 45 707 894 580 898 923 467 14 303 120 617 201 121 434 292 743 324 82 399 474 263 136 816 723 279 564 286 687 272 475 755 697 462 637 677 677 897 544 346 962 299 340 209 988 671 918\n545 487 767 844 741 863 389 207 33 195 26 487 912 705 953 1 229 304 287 946 88 644 200 706 701 194 678 733 243 558 955 354 217 154 825 934 761 969 708 161 551 515 458 706 436 799 826 623 926 949\n47 460 254 419 253 308 20 336 344 824 765 226 869 707 909 188 93 485 324 722 306 50 347 864 564 644 258 585 726 76 865 441 52 914 41 48 26 848 604 564 329 36 866 791 32 741 984 833 102 25\n6 517 410 973 341 739 439 791 103 197 117 220 714 184 931 444 529 539 186 31 332 346 823 986 569 386 650 766 929 682 468 714 44 72 670 103 388 505 165 385 922 698 555 235 544 336 899 280 380 165\n484 492 871 308 238 18 342 733 456 610 297 615 748 807 69 649 108 751 400 69 539 766 824 94 649 101 236 553 179 304 42 482 76 444 834 369 528 220 550 795 249 738 592 628 72 722 285 339 113 529\n812 66 285 542 88 712 124 546 131 821 811 717 473 201 79 324 853 572 188 770 165 903 689 751 768 615 752 675 98 578 549 77 363 629 406 562 358 128 374 695 287 398 65 868 924 667 979 830 107 242\n253 766 153 284 25 837 257 619 664 755 105 686 776 838 952 597 222 809 256 857 704 462 395 632 937 63 964 742 40 151 636 507 376 728 955 63 333 903 297 360 765 429 896 420 180 250 292 742 570 470\n151 987 829 989 999 69 147 925 691 465 419 272 391 455 923 476 606 964 597 363 118 541 337 874 213 114 291 979 955 186 974 435 380 643 397 378 246 432 537 878 538 138 76 654 976 76 134 333 929 993\n629 530 815 888 135 329 391 422 413 75 318 931 645 444 318 846 759 634 666 302 544 572 253 116 683 692 833 338 317 138 147 234 65 73 80 884 335 565 985 861 411 466 634 23 136 228 955 675 732 592\n654 308 363 357 887 356 746 489 475 365 518 403 986 626 700 472 233 952 36 373 717 955 72 34 874 858 972 664 545 752 914 298 723 605 786 510 798 250 427 955 127 370 29 276 577 192 346 870 791 67\n619 341 615 810 95 637 906 874 837 37 993 855 396 144 50 762 903 537 428 562 157 695 926 749 644 260 61 162 576 160 930 868 447 276 897 309 497 590 786 752 180 207 735 821 894 76 947 667 293 905\n518 263 631 562 377 141 195 70 735 859 89 191 743 331 710 97 348 151 446 133 321 122 683 859 938 213 205 782 979 31 652 324 729 72 281 950 230 149 334 437 263 497 194 259 885 686 572 423 732 321\n993 666 538 516 122 408 868 454 912 623 148 62 502 475 809 35 974 939 230 323 363 121 197 197 105 502 190 675 577 810 266 624 15 622 824 813 407 23 845 793 232 775 76 315 736 815 522 37 177 179\n184 438 0 458 130 743 502 616 297 335 757 962 655 817 822 40 383 370 261 144 719 588 661 551 610 543 528 317 520 251 332 238 725 320 573 215 213 210 32 157 87 93 427 523 734 749 473 815 327 422\n954 782 559 870 650 7 931 617 361 946 686 74 384 522 846 727 771 734 293 723 77 935 222 161 760 329 2 817 536 527 839 47 490 786 498 7 570 899 484 523 342 492 185 883 639 47 367 766 441 313\n26 402 582 215 219 347 759 216 922 540 183 651 746 713 801 948 208 574 208 114 363 577 7 228 395 654 581 774 136 469 121 910 748 647 172 1 663 316 637 12 130 362 876 99 600 339 820 5 308 783\n169 413 741 544 588 481 342 308 733 445 344 700 946 829 270 132 936 64 472 27 524 20 126 735 433 739 561 191 991 181 111 4 350 170 971 509 632 135 866 246 476 160 398 769 89 413 66 997 239 567\n311 449 861 292 314 909 112 614 564 542 343 434 566 629 568 479 555 407 357 145 955 14 337 731 179 86 703 267 65 240 357 534 216 186 491 746 930 333 927 446 848 327 525 683 755 457 554 246 373 662\n817 385 208 406 777 186 927 973 826 472 296 425 285 548 304 613 20 309 731 392 338 650 345 719 430 437 307 512 886 69 264 572 379 25 409 838 828 802 796 366 16 377 280 296 633 652 370 54 245 989\n435 793 189 755 847 408 807 278 314 759 664 380 348 652 214 476 76 785 962 746 43 255 147 148 870 452 876 530 655 348 604 616 762 365 411 929 875 581 881 634 745 300 851 673 541 795 748 219 814 29\n309 768 460 161 768 627 376 617 951 12 448 248 188 407 577 373 680 525 335 947 65 110 49 400 778 676 195 648 132 669 189 827 944 276 740 260 901 159 553 487 525 122 735 882 345 133 178 286 92 55\n923 525 833 200 947 348 284 647 366 410 34 386 323 230 366 88 489 296 38 170 551 459 487 291 512 728 963 585 736 782 20 15 307 894 357 599 468 575 130 82 923 867 63 630 580 186 588 135 279 262\n18 406 27 370 746 929 509 593 160 185 192 340 945 650 175 946 860 190 479 653 297 609 293 403 37 725 787 249 705 306 827 1 312 533 288 342 490 556 709 203 180 398 890 225 739 348 946 347 120 203\n567 794 999 11 467 93 319 800 152 34 647 2 652 655 863 156 796 583 11 308 55 756 206 117 627 850 537 859 125 870 158 220 145 225 743 381 524 814 671 379 456 374 86 107 228 772 916 235 673 450\n544 831 981 718 598 133 606 728 550 202 760 356 565 201 770 969 421 829 920 550 207 125 121 344 817 765 936 738 804 819 879 317 72 830 697 361 195 210 243 317 491 581 815 540 984 403 152 372 246 992\n44 207 445 930 128 244 734 877 258 807 488 901 913 219 301 475 165 80 842 676 896 298 647 159 182 790 968 843 797 689 532 433 917 999 610 410 610 873 938 82 995 976 75 479 970 852 562 613 904 310\n930 741 191 62 387 158 780 596 521 803 971 574 898 518 336 517 845 416 594 369 679 31 225 634 855 309 349 724 16 938 383 330 550 25 684 946 825 450 205 179 123 640 139 528 323 248 936 872 615 104\n37 790 82 527 815 632 537 845 659 246 659 792 940 523 313 996 1 371 307 314 904 904 48 744 162 662 667 744 112 489 608 536 66 232 897 992 327 248 367 192 153 294 853 978 28 830 639 31 822 899\n153 821 817 440 720 473 619 380 510 633 269 287 215 993 396 66 967 573 713 732 122 222 594 357 372 597 430 226 709 735 773 944 170 907 752 101 414 202 522 81 89 950 686 592 901 188 812 562 853 813\n632 513 382 770 258 192 987 303 328 675 53 612 759 515 764 374 421 628 2 134 872 205 903 727 124 179 827 34 384 854 769 288 203 482 610 941 200 228 767 351 848 725 697 866 885 60 633 519 251 529\n107 734 284 618 900 176 205 249 794 815 187 152 29 175 102 492 95 268 652 849 928 399 417 540 197 650 352 837 410 467 293 699 842 897 540 868 162 107 851 936 652 205 557 476 542 344 69 346 370 430\n196 249 533 525 470 71 189 874 972 379 972 349 739 111 705 689 177 497 246 151 160 617 465 51 693 258 393 602 803 877 474 593 93 895 819 803 311 397 304 237 521 78 74 958 157 472 261 973 143 989\n729 87 811 679 784 902 61 122 882 873 513 105 179 923 730 654 595 519 967 148 974 479 21 998 473 880 940 896 267 579 549 315 498 769 880 371 343 657 910 174 224 164 571 73 516 216 555 141 34 75\n969 294 162 8 889 937 717 11 467 597 847 254 144 638 877 673 871 233 65 287 601 467 851 439 334 899 848 492 615 550 154 866 20 390 951 774 996 355 95 141 768 29 595 677 449 874 42 984 390 302\n812 87 349 322 14 668 43 152 720 282 159 508 968 556 806 725 489 974 738 174 922 390 190 688 556 716 704 979 522 568 485 109 712 968 558 754 755 3 547 957 469 792 455 269 731 382 117 482 840 613\n531 301 42 854 542 894 287 380 401 287 708 136 716 56 171 50 466 840 183 201 855 154 542 673 274 943 16 849 112 194 521 550 887 359 935 261 743 918 140 292 704 954 670 959 337 65 187 648 934 903\n549 749 807 337 594 559 613 630 273 975 979 648 267 655 410 957 663 165 695 88 123 854 397 696 539 409 979 172 855 313 108 482 891 127 485 348 75 557 846 926 74 556 594 345 683 556 25 335 736 965\n369 690 793 598 48 857 16 678 553 970 887 567 605 505 644 114 820 671 816 425 571 548 580 98 935 641 211 647 22 94 950 355 276 335 207 219 786 767 16 582 14 25 457 253 227 348 442 170 151 92",
        expected: "12",
      },
    ],
    hints: [
      "You could follow the water downhill from every cell and see which edges it touches. How much repeated work does that do?",
      "Flip the question: instead of asking where water from a cell can go, ask which cells can feed a given sea.",
      "Water flows from high to equal-or-lower ground, so walk backwards: start at the sea's edge cells and climb to neighbours that are at least as high.",
      "Do that climb once for each sea, then count cells marked by both.",
    ],
    solutions: [
      {
        title: "Follow the water from every cell",
        order: 1,
        intuition:
          "Answer the question exactly as asked. From each cell, explore everywhere the water can flow (downhill or level) and note whether it touches a north/west edge and a south/east edge.",
        approach: [
          "For each cell, run a search over neighbours with height ≤ the current one.",
          "Record whether the search touched row 0 or column 0 (north) and the last row or column (south).",
          "Count cells that touched both.",
        ],
        code: {
          PYTHON: `def bothCoastCells(heights: List[List[int]]) -> int:
    rows, cols = len(heights), len(heights[0])
    count = 0
    for sr in range(rows):
        for sc in range(cols):
            seen = {(sr, sc)}
            stack = [(sr, sc)]
            north = south = False
            while stack:
                r, c = stack.pop()
                if r == 0 or c == 0:
                    north = True
                if r == rows - 1 or c == cols - 1:
                    south = True
                for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                    if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in seen and heights[nr][nc] <= heights[r][c]:
                        seen.add((nr, nc))
                        stack.append((nr, nc))
            if north and south:
                count += 1
    return count`,
          JAVA: `class Solution {
    public int bothCoastCells(int[][] heights) {
        int rows = heights.length, cols = heights[0].length, count = 0;
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        for (int sr = 0; sr < rows; sr++) {
            for (int sc = 0; sc < cols; sc++) {
                boolean[][] seen = new boolean[rows][cols];
                seen[sr][sc] = true;
                ArrayDeque<int[]> stack = new ArrayDeque<>();
                stack.push(new int[]{sr, sc});
                boolean north = false, south = false;
                while (!stack.isEmpty()) {
                    int[] cur = stack.pop();
                    int r = cur[0], c = cur[1];
                    if (r == 0 || c == 0) north = true;
                    if (r == rows - 1 || c == cols - 1) south = true;
                    for (int[] s : steps) {
                        int nr = r + s[0], nc = c + s[1];
                        if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !seen[nr][nc]
                                && heights[nr][nc] <= heights[r][c]) {
                            seen[nr][nc] = true;
                            stack.push(new int[]{nr, nc});
                        }
                    }
                }
                if (north && south) count++;
            }
        }
        return count;
    }
}`,
        },
        timeComplexity: "O((rows × cols)²)",
        spaceComplexity: "O(rows × cols)",
        edgeCases: ["A 1×1 grid touches every edge at once."],
        commonMistakes: [
          "Allowing flow only to strictly lower neighbours; level ground also carries water.",
        ],
      },
      {
        title: "Optimal: climb inward from each sea",
        order: 2,
        intuition:
          "A cell drains to a sea exactly when there is a non-increasing path from it to that sea's edge. Read backwards, that is a non-decreasing path from the edge to the cell. So start a breadth-first search from every edge cell of one sea, stepping only to neighbours at least as high. Two such searches, one per sea, mark everything; the answer is the overlap.",
        approach: [
          "Seed the north search with every cell in row 0 and column 0; the south search with the last row and column.",
          "In each search, step to a neighbour if it is unvisited and its height ≥ the current height.",
          "Return the number of cells visited by both searches.",
        ],
        code: {
          PYTHON: `from collections import deque


def bothCoastCells(heights: List[List[int]]) -> int:
    rows, cols = len(heights), len(heights[0])

    def climb(starts: List[tuple]) -> set:
        # Walk the flow backwards: from the sea, uphill or level only.
        reached = set(starts)
        queue = deque(starts)
        while queue:
            r, c = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if 0 <= nr < rows and 0 <= nc < cols and (nr, nc) not in reached and heights[nr][nc] >= heights[r][c]:
                    reached.add((nr, nc))
                    queue.append((nr, nc))
        return reached

    north = climb([(0, c) for c in range(cols)] + [(r, 0) for r in range(1, rows)])
    south = climb([(rows - 1, c) for c in range(cols)] + [(r, cols - 1) for r in range(rows - 1)])
    return len(north & south)`,
          JAVA: `class Solution {
    private int[][] heights;
    private int rows, cols;

    public int bothCoastCells(int[][] heights) {
        this.heights = heights;
        rows = heights.length;
        cols = heights[0].length;
        boolean[][] north = new boolean[rows][cols];
        boolean[][] south = new boolean[rows][cols];
        ArrayDeque<int[]> nq = new ArrayDeque<>(), sq = new ArrayDeque<>();
        for (int r = 0; r < rows; r++) {
            for (int c = 0; c < cols; c++) {
                if (r == 0 || c == 0) { north[r][c] = true; nq.add(new int[]{r, c}); }
                if (r == rows - 1 || c == cols - 1) { south[r][c] = true; sq.add(new int[]{r, c}); }
            }
        }
        climb(nq, north);
        climb(sq, south);
        int count = 0;
        for (int r = 0; r < rows; r++) for (int c = 0; c < cols; c++) if (north[r][c] && south[r][c]) count++;
        return count;
    }

    private void climb(ArrayDeque<int[]> queue, boolean[][] reached) {
        int[][] steps = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        while (!queue.isEmpty()) {
            int[] cur = queue.poll();
            for (int[] s : steps) {
                int nr = cur[0] + s[0], nc = cur[1] + s[1];
                if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && !reached[nr][nc]
                        && heights[nr][nc] >= heights[cur[0]][cur[1]]) {
                    reached[nr][nc] = true;
                    queue.add(new int[]{nr, nc});
                }
            }
        }
    }
}`,
        },
        timeComplexity: "O(rows × cols)",
        spaceComplexity: "O(rows × cols)",
        edgeCases: [
          "A single row or column, where every cell touches both seas.",
          "A flat grid: everything drains everywhere.",
          "A basin in the middle, lower than all its neighbours, which reaches neither sea.",
        ],
        commonMistakes: [
          "Climbing to strictly higher neighbours only, which misses level plateaus.",
          "Seeding the north search from the bottom edge, or mixing up which edges belong to which sea.",
        ],
      },
    ],
    expectedTime: "O(rows × cols)",
    expectedSpace: "O(rows × cols)",
  },

  {
    slug: "cheapest-trip",
    title: "Cheapest Trip With Few Layovers",
    difficulty: "HARD",
    learningObjective:
      "Bound a shortest-path search by edge count with layered Bellman-Ford, relaxing from a frozen copy so each round adds exactly one edge.",
    topics: ["graphs"],
    patterns: ["dynamic-programming", "breadth-first-search"],
    statement: [
      rich(
        "A budget travel site knows ",
        { code: "n" },
        " airports numbered 0 to n − 1 and a list of one-way ",
        { code: "flights" },
        ", each ",
        { code: "[from, to, price]" },
        "."
      ),
      rich(
        "A traveller wants to get from ",
        { code: "origin" },
        " to ",
        { code: "destination" },
        " but will accept at most ",
        { code: "maxStops" },
        " layovers — intermediate airports between the two. Return the cheapest total price, or ",
        { code: "-1" },
        " if no route respects the limit."
      ),
      example(
        "n = 4, flights = [[0,1,100],[1,2,100],[0,2,500],[1,3,600],[2,3,200]], origin = 0, destination = 3, maxStops = 1",
        "700",
        [
          { state: "0 → 1 → 3", note: "one layover, 100 + 600 = 700" },
          { state: "0 → 2 → 3", note: "one layover, 500 + 200 = 700" },
          { state: "0 → 1 → 2 → 3", note: "only 400, but needs two layovers" },
        ],
        "The cheapest route is not allowed"
      ),
    ],
    constraints: [
      "2 ≤ n ≤ 100",
      "0 ≤ flights.length ≤ 900",
      "0 ≤ from, to < n, from ≠ to, and no two flights share the same from and to",
      "1 ≤ price ≤ 10000",
      "origin ≠ destination and 0 ≤ maxStops < n",
    ],
    signature: {
      params: ["int", "int[][]", "int", "int", "int"],
      paramNames: ["n", "flights", "origin", "destination", "maxStops"],
      returns: "int",
      functionName: "cheapestTrip",
    },
    tests: [
      {
        input: "4\n5\n0 1 100\n1 2 100\n0 2 500\n1 3 600\n2 3 200\n0\n3\n1",
        expected: "700",
        isSample: true,
      },
      {
        input: "4\n5\n0 1 100\n1 2 100\n0 2 500\n1 3 600\n2 3 200\n0\n3\n2",
        expected: "400",
        isSample: true,
      },
      {
        input: "3\n2\n0 1 50\n1 2 50\n0\n2\n0",
        expected: "-1",
        isSample: true,
        explanation:
          "With no layovers allowed only a direct flight would do, and there is none.",
      },
      { input: "3\n3\n0 1 50\n1 2 50\n0 2 300\n0\n2\n0", expected: "300" },
      { input: "2\n0\n0\n1\n3", expected: "-1" },
      {
        input: "5\n6\n0 1 5\n1 2 5\n0 3 2\n3 1 2\n1 4 1\n2 4 1\n0\n4\n1",
        expected: "6",
      },
      {
        input: "5\n6\n0 1 5\n1 2 5\n0 3 2\n3 1 2\n1 4 1\n2 4 1\n0\n2\n1",
        expected: "10",
      },
      {
        input: "5\n6\n0 1 5\n1 2 5\n0 3 2\n3 1 2\n1 4 1\n2 4 1\n0\n2\n2",
        expected: "9",
      },
      {
        input: "6\n6\n0 1 1\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n0 5 100\n0\n5\n3",
        expected: "100",
      },
      {
        input: "6\n6\n0 1 1\n1 2 1\n2 3 1\n3 4 1\n4 5 1\n0 5 100\n0\n5\n4",
        expected: "5",
      },
      {
        input:
          "100\n800\n45 77 324\n36 3 82\n66 48 132\n11 9 339\n56 46 124\n37 59 501\n17 27 926\n5 92 711\n2 90 929\n77 93 556\n15 30 402\n74 41 219\n56 68 173\n45 13 247\n23 31 900\n75 47 350\n11 58 356\n75 62 869\n45 69 80\n9 99 16\n14 49 5\n70 66 930\n39 9 79\n97 15 225\n15 28 19\n55 22 626\n96 8 253\n69 76 139\n3 83 364\n47 49 775\n31 45 863\n69 57 293\n23 82 323\n18 11 428\n53 62 143\n89 40 628\n95 67 240\n36 39 651\n8 7 578\n74 51 457\n49 15 516\n73 43 722\n86 96 608\n55 5 354\n47 16 647\n50 54 179\n79 54 848\n56 4 869\n29 13 559\n70 95 380\n34 67 264\n53 11 11\n24 23 594\n95 50 141\n86 52 652\n52 83 975\n96 9 807\n21 75 780\n10 93 42\n95 41 656\n10 91 886\n70 14 145\n60 10 810\n36 23 142\n29 75 887\n24 25 530\n38 11 107\n89 51 597\n59 65 823\n16 14 544\n41 88 359\n93 65 91\n5 27 206\n21 42 567\n3 28 827\n44 91 801\n19 25 283\n60 67 474\n25 98 176\n36 88 730\n66 3 87\n21 60 756\n45 48 832\n83 5 361\n57 34 529\n46 6 324\n11 6 585\n34 49 943\n92 53 728\n73 4 208\n97 11 616\n46 40 605\n99 73 829\n74 29 632\n8 3 13\n36 58 439\n2 35 481\n56 97 536\n28 82 222\n47 78 385\n91 25 426\n65 78 304\n60 65 415\n68 79 646\n28 35 677\n99 18 125\n58 11 193\n41 48 859\n40 45 781\n10 32 214\n38 92 773\n21 69 109\n36 56 250\n57 80 653\n14 53 370\n89 6 963\n46 27 171\n98 22 789\n97 30 361\n49 50 418\n43 27 999\n99 27 886\n1 54 73\n67 50 787\n38 42 825\n43 78 805\n64 12 249\n47 30 502\n11 98 829\n64 24 215\n6 63 241\n41 59 443\n77 49 984\n70 10 271\n93 50 72\n80 43 175\n45 42 251\n45 5 664\n33 42 211\n11 52 22\n91 90 317\n84 29 407\n9 62 877\n73 9 451\n87 46 191\n21 30 21\n89 18 156\n21 81 228\n5 28 263\n54 7 82\n29 34 709\n90 65 279\n15 56 891\n63 23 95\n26 63 933\n90 53 510\n20 75 59\n33 14 984\n96 20 1000\n6 48 391\n39 52 583\n1 46 387\n2 80 555\n37 86 921\n22 77 176\n97 50 897\n93 6 581\n5 14 727\n91 71 652\n37 49 500\n35 6 410\n24 47 713\n15 29 776\n52 78 946\n84 61 911\n71 2 49\n96 22 51\n94 5 755\n65 8 295\n67 13 354\n40 89 580\n19 87 609\n0 92 612\n38 65 30\n52 47 560\n63 98 550\n2 1 545\n30 83 318\n45 15 295\n79 47 43\n88 40 23\n43 29 664\n27 74 347\n64 94 992\n23 59 984\n16 33 91\n62 21 275\n72 76 668\n46 41 383\n59 9 113\n78 64 92\n19 8 529\n85 78 271\n36 7 641\n40 4 689\n39 78 857\n47 95 489\n72 59 432\n4 36 348\n65 89 211\n28 21 113\n15 9 334\n23 54 329\n17 85 268\n28 87 421\n15 89 513\n42 52 450\n55 13 279\n52 86 699\n38 77 858\n40 54 817\n22 86 240\n84 66 233\n91 64 740\n8 84 317\n83 48 900\n57 77 986\n26 69 568\n53 73 214\n72 82 184\n37 9 487\n63 32 150\n2 12 978\n57 76 904\n78 25 891\n18 77 125\n23 88 124\n55 73 606\n48 8 290\n3 87 303\n14 55 858\n60 76 716\n97 6 867\n90 24 530\n21 12 359\n49 25 452\n58 62 190\n22 88 921\n75 0 830\n31 87 432\n90 58 600\n18 48 782\n1 39 785\n51 45 952\n47 15 216\n74 93 872\n14 80 322\n35 60 118\n64 68 199\n29 31 603\n12 79 452\n24 17 294\n36 2 881\n62 86 236\n2 28 121\n30 99 441\n96 71 14\n25 50 247\n68 65 580\n95 49 375\n99 7 751\n18 41 39\n69 52 271\n69 5 411\n65 97 385\n46 78 717\n45 27 69\n75 21 960\n68 18 762\n42 63 975\n95 15 667\n60 6 235\n11 47 250\n16 83 462\n52 75 314\n50 78 469\n21 50 57\n64 2 587\n27 41 504\n51 14 730\n40 38 158\n38 4 387\n74 23 258\n87 94 547\n53 52 33\n27 16 647\n15 72 119\n77 51 366\n84 76 9\n64 49 51\n81 71 269\n1 83 986\n31 74 383\n65 56 72\n16 53 171\n14 29 444\n29 61 22\n47 40 482\n76 12 106\n16 85 9\n32 69 414\n19 47 928\n36 26 102\n37 82 471\n77 55 632\n4 61 624\n33 15 236\n48 0 229\n16 21 827\n12 53 85\n15 64 533\n34 45 400\n10 54 762\n44 10 604\n73 37 208\n71 0 645\n99 77 514\n73 99 199\n67 37 948\n38 6 629\n71 5 564\n83 46 949\n4 70 75\n50 35 327\n41 73 372\n36 66 422\n16 35 11\n85 14 870\n54 53 603\n65 29 599\n91 98 230\n79 78 119\n46 0 603\n23 70 296\n93 42 196\n72 68 362\n13 30 601\n95 54 762\n29 26 209\n29 21 22\n13 44 476\n62 68 390\n96 92 508\n31 79 548\n82 15 328\n71 60 477\n73 78 734\n28 76 997\n91 38 623\n28 14 279\n14 78 973\n18 85 503\n92 26 644\n69 97 144\n87 4 825\n39 98 987\n50 65 598\n37 38 570\n88 44 74\n2 26 315\n78 17 866\n41 2 269\n86 4 541\n79 19 570\n44 41 171\n83 90 794\n1 82 756\n42 62 622\n41 85 994\n78 32 498\n90 63 460\n27 93 798\n90 51 121\n26 35 357\n60 81 872\n77 63 165\n43 67 13\n45 95 891\n37 87 811\n63 44 524\n18 37 294\n50 97 654\n52 92 971\n67 93 651\n36 95 572\n41 26 226\n94 0 728\n42 71 954\n33 83 377\n59 11 302\n88 95 480\n81 95 381\n6 36 56\n84 73 849\n12 90 961\n94 75 696\n36 22 620\n53 30 937\n64 92 261\n25 4 180\n81 74 591\n53 64 105\n33 45 30\n7 99 192\n85 31 954\n55 38 211\n59 81 636\n78 85 547\n51 79 67\n43 99 354\n9 24 564\n11 54 569\n46 80 883\n46 94 233\n25 85 907\n36 72 736\n79 26 532\n59 67 514\n84 87 719\n82 43 913\n78 19 996\n60 42 785\n41 49 667\n53 5 159\n4 33 348\n63 80 311\n0 74 27\n14 84 938\n11 85 694\n55 15 376\n74 88 23\n29 46 744\n33 79 269\n36 31 482\n81 72 360\n50 89 364\n24 14 500\n43 84 725\n36 0 382\n33 59 748\n79 49 715\n9 61 491\n16 60 656\n30 7 512\n57 82 539\n95 83 33\n19 93 686\n69 58 316\n52 36 716\n54 47 225\n61 22 396\n71 11 23\n89 72 58\n3 24 482\n62 17 390\n79 85 225\n74 2 240\n62 51 519\n43 66 206\n97 95 348\n49 76 644\n28 16 722\n44 49 214\n6 98 251\n99 67 739\n90 47 277\n40 97 266\n79 28 494\n24 69 733\n5 35 997\n31 55 23\n98 54 822\n7 61 81\n78 88 126\n11 30 666\n25 0 218\n17 4 293\n17 76 644\n53 41 382\n47 55 819\n27 56 69\n32 29 920\n22 90 557\n98 38 482\n88 16 35\n61 96 398\n26 87 416\n21 88 518\n30 54 360\n78 30 70\n0 62 40\n79 23 184\n71 49 757\n48 19 844\n80 59 148\n1 78 531\n96 83 690\n34 16 545\n20 19 475\n46 86 616\n37 42 130\n15 42 364\n1 11 217\n71 73 839\n23 27 13\n85 69 257\n43 83 389\n76 62 458\n92 81 102\n44 26 127\n36 34 898\n11 7 253\n19 31 744\n85 93 810\n92 33 373\n41 58 104\n29 18 870\n46 34 623\n72 29 329\n93 12 100\n36 42 671\n60 50 29\n16 93 704\n91 28 990\n65 87 545\n1 88 251\n49 95 825\n1 25 296\n96 51 488\n78 24 575\n9 1 706\n53 71 752\n91 45 355\n40 56 483\n53 38 575\n60 84 7\n67 61 112\n79 50 886\n86 7 75\n16 64 326\n69 11 962\n79 89 85\n69 86 801\n1 90 371\n7 77 758\n55 66 16\n51 26 591\n52 31 50\n28 55 522\n63 53 349\n75 72 203\n93 83 595\n44 4 400\n43 10 731\n15 67 127\n12 93 562\n99 24 785\n55 48 877\n44 3 833\n4 51 552\n54 42 989\n79 53 268\n4 1 423\n16 88 70\n59 60 95\n0 48 213\n41 27 740\n54 38 842\n51 75 776\n47 87 5\n21 66 56\n94 40 330\n72 26 656\n44 82 937\n32 95 124\n17 52 125\n62 24 127\n2 72 900\n31 2 679\n88 4 859\n10 90 763\n89 28 93\n83 38 874\n46 15 9\n89 38 683\n42 87 998\n27 66 664\n47 43 39\n81 23 105\n3 95 789\n26 99 312\n38 0 970\n91 77 401\n87 95 633\n33 29 184\n22 55 750\n39 70 388\n86 3 993\n99 15 960\n46 93 459\n80 76 136\n48 2 279\n3 37 498\n12 25 959\n42 10 362\n73 98 564\n35 9 191\n34 87 382\n4 80 432\n60 2 488\n41 60 21\n7 4 128\n99 10 297\n12 42 133\n17 13 770\n33 89 495\n19 85 85\n40 75 864\n14 41 804\n73 60 84\n3 13 119\n60 49 571\n0 46 912\n35 64 791\n96 73 566\n48 49 370\n80 13 48\n22 92 605\n26 41 425\n84 22 967\n29 14 864\n93 13 147\n93 22 828\n89 30 844\n81 4 576\n19 57 182\n47 86 38\n87 38 906\n22 31 454\n44 40 643\n61 86 953\n60 78 39\n56 6 621\n56 19 28\n2 58 562\n30 68 918\n0 8 969\n50 49 9\n73 24 870\n96 4 794\n68 24 512\n6 37 846\n29 89 21\n96 70 882\n91 86 780\n32 35 601\n40 77 632\n13 25 612\n35 41 204\n23 85 542\n39 77 755\n60 74 152\n78 84 892\n93 35 886\n73 34 553\n19 58 695\n5 93 612\n68 51 608\n94 98 859\n5 45 140\n78 80 114\n45 75 457\n86 61 596\n76 40 16\n48 72 744\n68 98 153\n33 57 773\n92 90 968\n38 61 371\n18 95 399\n66 43 901\n12 85 16\n45 2 131\n52 13 612\n74 56 569\n49 37 436\n9 48 81\n88 50 375\n10 97 98\n4 74 491\n14 17 190\n95 59 408\n13 8 188\n75 23 760\n57 83 548\n67 57 875\n0 85 371\n81 41 761\n96 18 198\n42 58 84\n60 24 586\n17 18 488\n89 86 447\n16 69 95\n75 88 102\n26 29 476\n69 67 398\n36 9 964\n12 36 812\n86 33 948\n17 6 132\n84 51 112\n30 87 541\n20 64 364\n58 43 210\n70 39 221\n32 83 82\n1 69 219\n87 43 783\n76 83 478\n95 10 850\n8 52 304\n33 17 215\n96 80 759\n67 5 289\n18 27 562\n17 16 25\n34 44 265\n29 67 556\n63 74 919\n64 59 89\n25 96 121\n98 12 984\n74 68 666\n15 8 36\n43 47 100\n33 85 637\n65 52 792\n41 4 743\n22 8 419\n80 21 934\n66 10 680\n72 18 971\n36 52 335\n92 45 624\n52 28 403\n31 88 701\n65 26 540\n59 8 900\n4 57 843\n6 30 295\n88 97 326\n69 8 400\n58 83 784\n95 16 613\n25 93 300\n13 19 5\n54 26 800\n14 73 380\n33 18 774\n63 36 438\n32 60 944\n29 1 229\n22 44 466\n38 8 508\n62 79 33\n0 7 176\n30 82 58\n5 72 580\n56 82 938\n36 21 652\n85 89 715\n66 99 108\n95 1 460\n39 72 629\n90 21 971\n4 21 897\n19 28 789\n86 54 203\n53 44 370\n41 32 997\n68 4 616\n58 32 844\n26 58 397\n61 92 763\n78 34 163\n90 28 667\n54 44 817\n93 17 842\n82 60 298\n0\n99\n3",
        expected: "368",
      },
      {
        input:
          "100\n800\n45 77 324\n36 3 82\n66 48 132\n11 9 339\n56 46 124\n37 59 501\n17 27 926\n5 92 711\n2 90 929\n77 93 556\n15 30 402\n74 41 219\n56 68 173\n45 13 247\n23 31 900\n75 47 350\n11 58 356\n75 62 869\n45 69 80\n9 99 16\n14 49 5\n70 66 930\n39 9 79\n97 15 225\n15 28 19\n55 22 626\n96 8 253\n69 76 139\n3 83 364\n47 49 775\n31 45 863\n69 57 293\n23 82 323\n18 11 428\n53 62 143\n89 40 628\n95 67 240\n36 39 651\n8 7 578\n74 51 457\n49 15 516\n73 43 722\n86 96 608\n55 5 354\n47 16 647\n50 54 179\n79 54 848\n56 4 869\n29 13 559\n70 95 380\n34 67 264\n53 11 11\n24 23 594\n95 50 141\n86 52 652\n52 83 975\n96 9 807\n21 75 780\n10 93 42\n95 41 656\n10 91 886\n70 14 145\n60 10 810\n36 23 142\n29 75 887\n24 25 530\n38 11 107\n89 51 597\n59 65 823\n16 14 544\n41 88 359\n93 65 91\n5 27 206\n21 42 567\n3 28 827\n44 91 801\n19 25 283\n60 67 474\n25 98 176\n36 88 730\n66 3 87\n21 60 756\n45 48 832\n83 5 361\n57 34 529\n46 6 324\n11 6 585\n34 49 943\n92 53 728\n73 4 208\n97 11 616\n46 40 605\n99 73 829\n74 29 632\n8 3 13\n36 58 439\n2 35 481\n56 97 536\n28 82 222\n47 78 385\n91 25 426\n65 78 304\n60 65 415\n68 79 646\n28 35 677\n99 18 125\n58 11 193\n41 48 859\n40 45 781\n10 32 214\n38 92 773\n21 69 109\n36 56 250\n57 80 653\n14 53 370\n89 6 963\n46 27 171\n98 22 789\n97 30 361\n49 50 418\n43 27 999\n99 27 886\n1 54 73\n67 50 787\n38 42 825\n43 78 805\n64 12 249\n47 30 502\n11 98 829\n64 24 215\n6 63 241\n41 59 443\n77 49 984\n70 10 271\n93 50 72\n80 43 175\n45 42 251\n45 5 664\n33 42 211\n11 52 22\n91 90 317\n84 29 407\n9 62 877\n73 9 451\n87 46 191\n21 30 21\n89 18 156\n21 81 228\n5 28 263\n54 7 82\n29 34 709\n90 65 279\n15 56 891\n63 23 95\n26 63 933\n90 53 510\n20 75 59\n33 14 984\n96 20 1000\n6 48 391\n39 52 583\n1 46 387\n2 80 555\n37 86 921\n22 77 176\n97 50 897\n93 6 581\n5 14 727\n91 71 652\n37 49 500\n35 6 410\n24 47 713\n15 29 776\n52 78 946\n84 61 911\n71 2 49\n96 22 51\n94 5 755\n65 8 295\n67 13 354\n40 89 580\n19 87 609\n0 92 612\n38 65 30\n52 47 560\n63 98 550\n2 1 545\n30 83 318\n45 15 295\n79 47 43\n88 40 23\n43 29 664\n27 74 347\n64 94 992\n23 59 984\n16 33 91\n62 21 275\n72 76 668\n46 41 383\n59 9 113\n78 64 92\n19 8 529\n85 78 271\n36 7 641\n40 4 689\n39 78 857\n47 95 489\n72 59 432\n4 36 348\n65 89 211\n28 21 113\n15 9 334\n23 54 329\n17 85 268\n28 87 421\n15 89 513\n42 52 450\n55 13 279\n52 86 699\n38 77 858\n40 54 817\n22 86 240\n84 66 233\n91 64 740\n8 84 317\n83 48 900\n57 77 986\n26 69 568\n53 73 214\n72 82 184\n37 9 487\n63 32 150\n2 12 978\n57 76 904\n78 25 891\n18 77 125\n23 88 124\n55 73 606\n48 8 290\n3 87 303\n14 55 858\n60 76 716\n97 6 867\n90 24 530\n21 12 359\n49 25 452\n58 62 190\n22 88 921\n75 0 830\n31 87 432\n90 58 600\n18 48 782\n1 39 785\n51 45 952\n47 15 216\n74 93 872\n14 80 322\n35 60 118\n64 68 199\n29 31 603\n12 79 452\n24 17 294\n36 2 881\n62 86 236\n2 28 121\n30 99 441\n96 71 14\n25 50 247\n68 65 580\n95 49 375\n99 7 751\n18 41 39\n69 52 271\n69 5 411\n65 97 385\n46 78 717\n45 27 69\n75 21 960\n68 18 762\n42 63 975\n95 15 667\n60 6 235\n11 47 250\n16 83 462\n52 75 314\n50 78 469\n21 50 57\n64 2 587\n27 41 504\n51 14 730\n40 38 158\n38 4 387\n74 23 258\n87 94 547\n53 52 33\n27 16 647\n15 72 119\n77 51 366\n84 76 9\n64 49 51\n81 71 269\n1 83 986\n31 74 383\n65 56 72\n16 53 171\n14 29 444\n29 61 22\n47 40 482\n76 12 106\n16 85 9\n32 69 414\n19 47 928\n36 26 102\n37 82 471\n77 55 632\n4 61 624\n33 15 236\n48 0 229\n16 21 827\n12 53 85\n15 64 533\n34 45 400\n10 54 762\n44 10 604\n73 37 208\n71 0 645\n99 77 514\n73 99 199\n67 37 948\n38 6 629\n71 5 564\n83 46 949\n4 70 75\n50 35 327\n41 73 372\n36 66 422\n16 35 11\n85 14 870\n54 53 603\n65 29 599\n91 98 230\n79 78 119\n46 0 603\n23 70 296\n93 42 196\n72 68 362\n13 30 601\n95 54 762\n29 26 209\n29 21 22\n13 44 476\n62 68 390\n96 92 508\n31 79 548\n82 15 328\n71 60 477\n73 78 734\n28 76 997\n91 38 623\n28 14 279\n14 78 973\n18 85 503\n92 26 644\n69 97 144\n87 4 825\n39 98 987\n50 65 598\n37 38 570\n88 44 74\n2 26 315\n78 17 866\n41 2 269\n86 4 541\n79 19 570\n44 41 171\n83 90 794\n1 82 756\n42 62 622\n41 85 994\n78 32 498\n90 63 460\n27 93 798\n90 51 121\n26 35 357\n60 81 872\n77 63 165\n43 67 13\n45 95 891\n37 87 811\n63 44 524\n18 37 294\n50 97 654\n52 92 971\n67 93 651\n36 95 572\n41 26 226\n94 0 728\n42 71 954\n33 83 377\n59 11 302\n88 95 480\n81 95 381\n6 36 56\n84 73 849\n12 90 961\n94 75 696\n36 22 620\n53 30 937\n64 92 261\n25 4 180\n81 74 591\n53 64 105\n33 45 30\n7 99 192\n85 31 954\n55 38 211\n59 81 636\n78 85 547\n51 79 67\n43 99 354\n9 24 564\n11 54 569\n46 80 883\n46 94 233\n25 85 907\n36 72 736\n79 26 532\n59 67 514\n84 87 719\n82 43 913\n78 19 996\n60 42 785\n41 49 667\n53 5 159\n4 33 348\n63 80 311\n0 74 27\n14 84 938\n11 85 694\n55 15 376\n74 88 23\n29 46 744\n33 79 269\n36 31 482\n81 72 360\n50 89 364\n24 14 500\n43 84 725\n36 0 382\n33 59 748\n79 49 715\n9 61 491\n16 60 656\n30 7 512\n57 82 539\n95 83 33\n19 93 686\n69 58 316\n52 36 716\n54 47 225\n61 22 396\n71 11 23\n89 72 58\n3 24 482\n62 17 390\n79 85 225\n74 2 240\n62 51 519\n43 66 206\n97 95 348\n49 76 644\n28 16 722\n44 49 214\n6 98 251\n99 67 739\n90 47 277\n40 97 266\n79 28 494\n24 69 733\n5 35 997\n31 55 23\n98 54 822\n7 61 81\n78 88 126\n11 30 666\n25 0 218\n17 4 293\n17 76 644\n53 41 382\n47 55 819\n27 56 69\n32 29 920\n22 90 557\n98 38 482\n88 16 35\n61 96 398\n26 87 416\n21 88 518\n30 54 360\n78 30 70\n0 62 40\n79 23 184\n71 49 757\n48 19 844\n80 59 148\n1 78 531\n96 83 690\n34 16 545\n20 19 475\n46 86 616\n37 42 130\n15 42 364\n1 11 217\n71 73 839\n23 27 13\n85 69 257\n43 83 389\n76 62 458\n92 81 102\n44 26 127\n36 34 898\n11 7 253\n19 31 744\n85 93 810\n92 33 373\n41 58 104\n29 18 870\n46 34 623\n72 29 329\n93 12 100\n36 42 671\n60 50 29\n16 93 704\n91 28 990\n65 87 545\n1 88 251\n49 95 825\n1 25 296\n96 51 488\n78 24 575\n9 1 706\n53 71 752\n91 45 355\n40 56 483\n53 38 575\n60 84 7\n67 61 112\n79 50 886\n86 7 75\n16 64 326\n69 11 962\n79 89 85\n69 86 801\n1 90 371\n7 77 758\n55 66 16\n51 26 591\n52 31 50\n28 55 522\n63 53 349\n75 72 203\n93 83 595\n44 4 400\n43 10 731\n15 67 127\n12 93 562\n99 24 785\n55 48 877\n44 3 833\n4 51 552\n54 42 989\n79 53 268\n4 1 423\n16 88 70\n59 60 95\n0 48 213\n41 27 740\n54 38 842\n51 75 776\n47 87 5\n21 66 56\n94 40 330\n72 26 656\n44 82 937\n32 95 124\n17 52 125\n62 24 127\n2 72 900\n31 2 679\n88 4 859\n10 90 763\n89 28 93\n83 38 874\n46 15 9\n89 38 683\n42 87 998\n27 66 664\n47 43 39\n81 23 105\n3 95 789\n26 99 312\n38 0 970\n91 77 401\n87 95 633\n33 29 184\n22 55 750\n39 70 388\n86 3 993\n99 15 960\n46 93 459\n80 76 136\n48 2 279\n3 37 498\n12 25 959\n42 10 362\n73 98 564\n35 9 191\n34 87 382\n4 80 432\n60 2 488\n41 60 21\n7 4 128\n99 10 297\n12 42 133\n17 13 770\n33 89 495\n19 85 85\n40 75 864\n14 41 804\n73 60 84\n3 13 119\n60 49 571\n0 46 912\n35 64 791\n96 73 566\n48 49 370\n80 13 48\n22 92 605\n26 41 425\n84 22 967\n29 14 864\n93 13 147\n93 22 828\n89 30 844\n81 4 576\n19 57 182\n47 86 38\n87 38 906\n22 31 454\n44 40 643\n61 86 953\n60 78 39\n56 6 621\n56 19 28\n2 58 562\n30 68 918\n0 8 969\n50 49 9\n73 24 870\n96 4 794\n68 24 512\n6 37 846\n29 89 21\n96 70 882\n91 86 780\n32 35 601\n40 77 632\n13 25 612\n35 41 204\n23 85 542\n39 77 755\n60 74 152\n78 84 892\n93 35 886\n73 34 553\n19 58 695\n5 93 612\n68 51 608\n94 98 859\n5 45 140\n78 80 114\n45 75 457\n86 61 596\n76 40 16\n48 72 744\n68 98 153\n33 57 773\n92 90 968\n38 61 371\n18 95 399\n66 43 901\n12 85 16\n45 2 131\n52 13 612\n74 56 569\n49 37 436\n9 48 81\n88 50 375\n10 97 98\n4 74 491\n14 17 190\n95 59 408\n13 8 188\n75 23 760\n57 83 548\n67 57 875\n0 85 371\n81 41 761\n96 18 198\n42 58 84\n60 24 586\n17 18 488\n89 86 447\n16 69 95\n75 88 102\n26 29 476\n69 67 398\n36 9 964\n12 36 812\n86 33 948\n17 6 132\n84 51 112\n30 87 541\n20 64 364\n58 43 210\n70 39 221\n32 83 82\n1 69 219\n87 43 783\n76 83 478\n95 10 850\n8 52 304\n33 17 215\n96 80 759\n67 5 289\n18 27 562\n17 16 25\n34 44 265\n29 67 556\n63 74 919\n64 59 89\n25 96 121\n98 12 984\n74 68 666\n15 8 36\n43 47 100\n33 85 637\n65 52 792\n41 4 743\n22 8 419\n80 21 934\n66 10 680\n72 18 971\n36 52 335\n92 45 624\n52 28 403\n31 88 701\n65 26 540\n59 8 900\n4 57 843\n6 30 295\n88 97 326\n69 8 400\n58 83 784\n95 16 613\n25 93 300\n13 19 5\n54 26 800\n14 73 380\n33 18 774\n63 36 438\n32 60 944\n29 1 229\n22 44 466\n38 8 508\n62 79 33\n0 7 176\n30 82 58\n5 72 580\n56 82 938\n36 21 652\n85 89 715\n66 99 108\n95 1 460\n39 72 629\n90 21 971\n4 21 897\n19 28 789\n86 54 203\n53 44 370\n41 32 997\n68 4 616\n58 32 844\n26 58 397\n61 92 763\n78 34 163\n90 28 667\n54 44 817\n93 17 842\n82 60 298\n5\n42\n10",
        expected: "391",
      },
      {
        input:
          "100\n800\n45 77 324\n36 3 82\n66 48 132\n11 9 339\n56 46 124\n37 59 501\n17 27 926\n5 92 711\n2 90 929\n77 93 556\n15 30 402\n74 41 219\n56 68 173\n45 13 247\n23 31 900\n75 47 350\n11 58 356\n75 62 869\n45 69 80\n9 99 16\n14 49 5\n70 66 930\n39 9 79\n97 15 225\n15 28 19\n55 22 626\n96 8 253\n69 76 139\n3 83 364\n47 49 775\n31 45 863\n69 57 293\n23 82 323\n18 11 428\n53 62 143\n89 40 628\n95 67 240\n36 39 651\n8 7 578\n74 51 457\n49 15 516\n73 43 722\n86 96 608\n55 5 354\n47 16 647\n50 54 179\n79 54 848\n56 4 869\n29 13 559\n70 95 380\n34 67 264\n53 11 11\n24 23 594\n95 50 141\n86 52 652\n52 83 975\n96 9 807\n21 75 780\n10 93 42\n95 41 656\n10 91 886\n70 14 145\n60 10 810\n36 23 142\n29 75 887\n24 25 530\n38 11 107\n89 51 597\n59 65 823\n16 14 544\n41 88 359\n93 65 91\n5 27 206\n21 42 567\n3 28 827\n44 91 801\n19 25 283\n60 67 474\n25 98 176\n36 88 730\n66 3 87\n21 60 756\n45 48 832\n83 5 361\n57 34 529\n46 6 324\n11 6 585\n34 49 943\n92 53 728\n73 4 208\n97 11 616\n46 40 605\n99 73 829\n74 29 632\n8 3 13\n36 58 439\n2 35 481\n56 97 536\n28 82 222\n47 78 385\n91 25 426\n65 78 304\n60 65 415\n68 79 646\n28 35 677\n99 18 125\n58 11 193\n41 48 859\n40 45 781\n10 32 214\n38 92 773\n21 69 109\n36 56 250\n57 80 653\n14 53 370\n89 6 963\n46 27 171\n98 22 789\n97 30 361\n49 50 418\n43 27 999\n99 27 886\n1 54 73\n67 50 787\n38 42 825\n43 78 805\n64 12 249\n47 30 502\n11 98 829\n64 24 215\n6 63 241\n41 59 443\n77 49 984\n70 10 271\n93 50 72\n80 43 175\n45 42 251\n45 5 664\n33 42 211\n11 52 22\n91 90 317\n84 29 407\n9 62 877\n73 9 451\n87 46 191\n21 30 21\n89 18 156\n21 81 228\n5 28 263\n54 7 82\n29 34 709\n90 65 279\n15 56 891\n63 23 95\n26 63 933\n90 53 510\n20 75 59\n33 14 984\n96 20 1000\n6 48 391\n39 52 583\n1 46 387\n2 80 555\n37 86 921\n22 77 176\n97 50 897\n93 6 581\n5 14 727\n91 71 652\n37 49 500\n35 6 410\n24 47 713\n15 29 776\n52 78 946\n84 61 911\n71 2 49\n96 22 51\n94 5 755\n65 8 295\n67 13 354\n40 89 580\n19 87 609\n0 92 612\n38 65 30\n52 47 560\n63 98 550\n2 1 545\n30 83 318\n45 15 295\n79 47 43\n88 40 23\n43 29 664\n27 74 347\n64 94 992\n23 59 984\n16 33 91\n62 21 275\n72 76 668\n46 41 383\n59 9 113\n78 64 92\n19 8 529\n85 78 271\n36 7 641\n40 4 689\n39 78 857\n47 95 489\n72 59 432\n4 36 348\n65 89 211\n28 21 113\n15 9 334\n23 54 329\n17 85 268\n28 87 421\n15 89 513\n42 52 450\n55 13 279\n52 86 699\n38 77 858\n40 54 817\n22 86 240\n84 66 233\n91 64 740\n8 84 317\n83 48 900\n57 77 986\n26 69 568\n53 73 214\n72 82 184\n37 9 487\n63 32 150\n2 12 978\n57 76 904\n78 25 891\n18 77 125\n23 88 124\n55 73 606\n48 8 290\n3 87 303\n14 55 858\n60 76 716\n97 6 867\n90 24 530\n21 12 359\n49 25 452\n58 62 190\n22 88 921\n75 0 830\n31 87 432\n90 58 600\n18 48 782\n1 39 785\n51 45 952\n47 15 216\n74 93 872\n14 80 322\n35 60 118\n64 68 199\n29 31 603\n12 79 452\n24 17 294\n36 2 881\n62 86 236\n2 28 121\n30 99 441\n96 71 14\n25 50 247\n68 65 580\n95 49 375\n99 7 751\n18 41 39\n69 52 271\n69 5 411\n65 97 385\n46 78 717\n45 27 69\n75 21 960\n68 18 762\n42 63 975\n95 15 667\n60 6 235\n11 47 250\n16 83 462\n52 75 314\n50 78 469\n21 50 57\n64 2 587\n27 41 504\n51 14 730\n40 38 158\n38 4 387\n74 23 258\n87 94 547\n53 52 33\n27 16 647\n15 72 119\n77 51 366\n84 76 9\n64 49 51\n81 71 269\n1 83 986\n31 74 383\n65 56 72\n16 53 171\n14 29 444\n29 61 22\n47 40 482\n76 12 106\n16 85 9\n32 69 414\n19 47 928\n36 26 102\n37 82 471\n77 55 632\n4 61 624\n33 15 236\n48 0 229\n16 21 827\n12 53 85\n15 64 533\n34 45 400\n10 54 762\n44 10 604\n73 37 208\n71 0 645\n99 77 514\n73 99 199\n67 37 948\n38 6 629\n71 5 564\n83 46 949\n4 70 75\n50 35 327\n41 73 372\n36 66 422\n16 35 11\n85 14 870\n54 53 603\n65 29 599\n91 98 230\n79 78 119\n46 0 603\n23 70 296\n93 42 196\n72 68 362\n13 30 601\n95 54 762\n29 26 209\n29 21 22\n13 44 476\n62 68 390\n96 92 508\n31 79 548\n82 15 328\n71 60 477\n73 78 734\n28 76 997\n91 38 623\n28 14 279\n14 78 973\n18 85 503\n92 26 644\n69 97 144\n87 4 825\n39 98 987\n50 65 598\n37 38 570\n88 44 74\n2 26 315\n78 17 866\n41 2 269\n86 4 541\n79 19 570\n44 41 171\n83 90 794\n1 82 756\n42 62 622\n41 85 994\n78 32 498\n90 63 460\n27 93 798\n90 51 121\n26 35 357\n60 81 872\n77 63 165\n43 67 13\n45 95 891\n37 87 811\n63 44 524\n18 37 294\n50 97 654\n52 92 971\n67 93 651\n36 95 572\n41 26 226\n94 0 728\n42 71 954\n33 83 377\n59 11 302\n88 95 480\n81 95 381\n6 36 56\n84 73 849\n12 90 961\n94 75 696\n36 22 620\n53 30 937\n64 92 261\n25 4 180\n81 74 591\n53 64 105\n33 45 30\n7 99 192\n85 31 954\n55 38 211\n59 81 636\n78 85 547\n51 79 67\n43 99 354\n9 24 564\n11 54 569\n46 80 883\n46 94 233\n25 85 907\n36 72 736\n79 26 532\n59 67 514\n84 87 719\n82 43 913\n78 19 996\n60 42 785\n41 49 667\n53 5 159\n4 33 348\n63 80 311\n0 74 27\n14 84 938\n11 85 694\n55 15 376\n74 88 23\n29 46 744\n33 79 269\n36 31 482\n81 72 360\n50 89 364\n24 14 500\n43 84 725\n36 0 382\n33 59 748\n79 49 715\n9 61 491\n16 60 656\n30 7 512\n57 82 539\n95 83 33\n19 93 686\n69 58 316\n52 36 716\n54 47 225\n61 22 396\n71 11 23\n89 72 58\n3 24 482\n62 17 390\n79 85 225\n74 2 240\n62 51 519\n43 66 206\n97 95 348\n49 76 644\n28 16 722\n44 49 214\n6 98 251\n99 67 739\n90 47 277\n40 97 266\n79 28 494\n24 69 733\n5 35 997\n31 55 23\n98 54 822\n7 61 81\n78 88 126\n11 30 666\n25 0 218\n17 4 293\n17 76 644\n53 41 382\n47 55 819\n27 56 69\n32 29 920\n22 90 557\n98 38 482\n88 16 35\n61 96 398\n26 87 416\n21 88 518\n30 54 360\n78 30 70\n0 62 40\n79 23 184\n71 49 757\n48 19 844\n80 59 148\n1 78 531\n96 83 690\n34 16 545\n20 19 475\n46 86 616\n37 42 130\n15 42 364\n1 11 217\n71 73 839\n23 27 13\n85 69 257\n43 83 389\n76 62 458\n92 81 102\n44 26 127\n36 34 898\n11 7 253\n19 31 744\n85 93 810\n92 33 373\n41 58 104\n29 18 870\n46 34 623\n72 29 329\n93 12 100\n36 42 671\n60 50 29\n16 93 704\n91 28 990\n65 87 545\n1 88 251\n49 95 825\n1 25 296\n96 51 488\n78 24 575\n9 1 706\n53 71 752\n91 45 355\n40 56 483\n53 38 575\n60 84 7\n67 61 112\n79 50 886\n86 7 75\n16 64 326\n69 11 962\n79 89 85\n69 86 801\n1 90 371\n7 77 758\n55 66 16\n51 26 591\n52 31 50\n28 55 522\n63 53 349\n75 72 203\n93 83 595\n44 4 400\n43 10 731\n15 67 127\n12 93 562\n99 24 785\n55 48 877\n44 3 833\n4 51 552\n54 42 989\n79 53 268\n4 1 423\n16 88 70\n59 60 95\n0 48 213\n41 27 740\n54 38 842\n51 75 776\n47 87 5\n21 66 56\n94 40 330\n72 26 656\n44 82 937\n32 95 124\n17 52 125\n62 24 127\n2 72 900\n31 2 679\n88 4 859\n10 90 763\n89 28 93\n83 38 874\n46 15 9\n89 38 683\n42 87 998\n27 66 664\n47 43 39\n81 23 105\n3 95 789\n26 99 312\n38 0 970\n91 77 401\n87 95 633\n33 29 184\n22 55 750\n39 70 388\n86 3 993\n99 15 960\n46 93 459\n80 76 136\n48 2 279\n3 37 498\n12 25 959\n42 10 362\n73 98 564\n35 9 191\n34 87 382\n4 80 432\n60 2 488\n41 60 21\n7 4 128\n99 10 297\n12 42 133\n17 13 770\n33 89 495\n19 85 85\n40 75 864\n14 41 804\n73 60 84\n3 13 119\n60 49 571\n0 46 912\n35 64 791\n96 73 566\n48 49 370\n80 13 48\n22 92 605\n26 41 425\n84 22 967\n29 14 864\n93 13 147\n93 22 828\n89 30 844\n81 4 576\n19 57 182\n47 86 38\n87 38 906\n22 31 454\n44 40 643\n61 86 953\n60 78 39\n56 6 621\n56 19 28\n2 58 562\n30 68 918\n0 8 969\n50 49 9\n73 24 870\n96 4 794\n68 24 512\n6 37 846\n29 89 21\n96 70 882\n91 86 780\n32 35 601\n40 77 632\n13 25 612\n35 41 204\n23 85 542\n39 77 755\n60 74 152\n78 84 892\n93 35 886\n73 34 553\n19 58 695\n5 93 612\n68 51 608\n94 98 859\n5 45 140\n78 80 114\n45 75 457\n86 61 596\n76 40 16\n48 72 744\n68 98 153\n33 57 773\n92 90 968\n38 61 371\n18 95 399\n66 43 901\n12 85 16\n45 2 131\n52 13 612\n74 56 569\n49 37 436\n9 48 81\n88 50 375\n10 97 98\n4 74 491\n14 17 190\n95 59 408\n13 8 188\n75 23 760\n57 83 548\n67 57 875\n0 85 371\n81 41 761\n96 18 198\n42 58 84\n60 24 586\n17 18 488\n89 86 447\n16 69 95\n75 88 102\n26 29 476\n69 67 398\n36 9 964\n12 36 812\n86 33 948\n17 6 132\n84 51 112\n30 87 541\n20 64 364\n58 43 210\n70 39 221\n32 83 82\n1 69 219\n87 43 783\n76 83 478\n95 10 850\n8 52 304\n33 17 215\n96 80 759\n67 5 289\n18 27 562\n17 16 25\n34 44 265\n29 67 556\n63 74 919\n64 59 89\n25 96 121\n98 12 984\n74 68 666\n15 8 36\n43 47 100\n33 85 637\n65 52 792\n41 4 743\n22 8 419\n80 21 934\n66 10 680\n72 18 971\n36 52 335\n92 45 624\n52 28 403\n31 88 701\n65 26 540\n59 8 900\n4 57 843\n6 30 295\n88 97 326\n69 8 400\n58 83 784\n95 16 613\n25 93 300\n13 19 5\n54 26 800\n14 73 380\n33 18 774\n63 36 438\n32 60 944\n29 1 229\n22 44 466\n38 8 508\n62 79 33\n0 7 176\n30 82 58\n5 72 580\n56 82 938\n36 21 652\n85 89 715\n66 99 108\n95 1 460\n39 72 629\n90 21 971\n4 21 897\n19 28 789\n86 54 203\n53 44 370\n41 32 997\n68 4 616\n58 32 844\n26 58 397\n61 92 763\n78 34 163\n90 28 667\n54 44 817\n93 17 842\n82 60 298\n17\n3\n0",
        expected: "-1",
      },
    ],
    hints: [
      "Plain Dijkstra finds the cheapest route but ignores the layover limit, and may settle an airport via a route with too many legs.",
      "At most k layovers means at most k + 1 flights. What is the cheapest price to each airport using at most 1 flight? At most 2?",
      "The cheapest cost with at most i + 1 flights comes from the cheapest with at most i flights plus one more flight.",
      "Relax every flight k + 1 times, but read from a copy of the previous round so one round never chains two flights together.",
    ],
    solutions: [
      {
        title: "Depth-first search over every route",
        order: 1,
        intuition:
          "Try every route from the origin that uses at most maxStops + 1 flights and keep the cheapest that ends at the destination. Pruning routes already more expensive than the best found helps, but the number of routes still grows exponentially with the limit.",
        approach: [
          "Build adjacency lists.",
          "Search from the origin with (airport, cost, flights used).",
          "On reaching the destination, update the best price.",
          "Stop extending a route once it has used maxStops + 1 flights or costs at least the best found.",
        ],
        code: {
          PYTHON: `def cheapestTrip(n: int, flights: List[List[int]], origin: int, destination: int, maxStops: int) -> int:
    out = [[] for _ in range(n)]
    for u, v, p in flights:
        out[u].append((v, p))
    best = float("inf")

    def explore(airport: int, cost: int, used: int) -> None:
        nonlocal best
        if cost >= best:
            return
        if airport == destination:
            best = cost
            return
        if used == maxStops + 1:
            return
        for nxt, price in out[airport]:
            explore(nxt, cost + price, used + 1)

    explore(origin, 0, 0)
    return -1 if best == float("inf") else best`,
          JAVA: `class Solution {
    private List<List<int[]>> out;
    private int destination, limit;
    private long best;

    public int cheapestTrip(int n, int[][] flights, int origin, int destination, int maxStops) {
        out = new ArrayList<>();
        for (int i = 0; i < n; i++) out.add(new ArrayList<>());
        for (int[] f : flights) out.get(f[0]).add(new int[]{f[1], f[2]});
        this.destination = destination;
        this.limit = maxStops + 1;
        best = Long.MAX_VALUE;
        explore(origin, 0, 0);
        return best == Long.MAX_VALUE ? -1 : (int) best;
    }

    private void explore(int airport, long cost, int used) {
        if (cost >= best) return;
        if (airport == destination) { best = cost; return; }
        if (used == limit) return;
        for (int[] e : out.get(airport)) explore(e[0], cost + e[1], used + 1);
    }
}`,
        },
        timeComplexity: "O(flights^(maxStops + 1)) in the worst case",
        spaceComplexity: "O(maxStops) recursion depth",
        edgeCases: ["maxStops = 0: only a direct flight qualifies."],
        commonMistakes: [
          "Counting airports visited instead of layovers, which is off by one.",
        ],
      },
      {
        title: "Optimal: Bellman-Ford limited to k + 1 rounds",
        order: 2,
        intuition:
          "Let cost[v] be the cheapest price to reach v using at most i flights. One more round over every flight extends each of those routes by one leg, giving the answers for at most i + 1 flights. The catch is to read from the previous round's frozen copy; updating in place could chain two flights in a single round and quietly exceed the layover limit. After maxStops + 1 rounds, cost[destination] is the answer.",
        approach: [
          "Set cost[origin] = 0 and every other airport to infinity.",
          "Repeat maxStops + 1 times: copy cost into next; for each flight u → v, set next[v] = min(next[v], cost[u] + price); then cost = next.",
          "Return cost[destination], or -1 if it is still infinity.",
        ],
        code: {
          PYTHON: `def cheapestTrip(n: int, flights: List[List[int]], origin: int, destination: int, maxStops: int) -> int:
    INF = float("inf")
    cost = [INF] * n
    cost[origin] = 0

    # Round i allows one more flight than round i - 1.
    for _ in range(maxStops + 1):
        nxt = cost[:]  # read from the frozen previous round
        for u, v, price in flights:
            if cost[u] + price < nxt[v]:
                nxt[v] = cost[u] + price
        cost = nxt

    return -1 if cost[destination] == INF else cost[destination]`,
          JAVA: `class Solution {
    public int cheapestTrip(int n, int[][] flights, int origin, int destination, int maxStops) {
        long INF = Long.MAX_VALUE / 4;
        long[] cost = new long[n];
        Arrays.fill(cost, INF);
        cost[origin] = 0;
        for (int round = 0; round <= maxStops; round++) {
            long[] next = cost.clone();
            for (int[] f : flights) {
                if (cost[f[0]] + f[2] < next[f[1]]) next[f[1]] = cost[f[0]] + f[2];
            }
            cost = next;
        }
        return cost[destination] >= INF ? -1 : (int) cost[destination];
    }
}`,
        },
        timeComplexity: "O((maxStops + 1) × flights)",
        spaceComplexity: "O(n)",
        edgeCases: [
          "A cheap route that needs one layover too many, so a dearer route wins.",
          "No route at all: -1.",
          "A direct flight is the only option when maxStops = 0.",
        ],
        commonMistakes: [
          "Relaxing in place within a round, which lets a single round use several flights.",
          "Running maxStops rounds instead of maxStops + 1.",
          "Using unrestricted Dijkstra that settles each airport once by price alone.",
        ],
      },
    ],
    expectedTime: "O(k × flights)",
    expectedSpace: "O(n)",
  },

  {
    slug: "word-chain",
    title: "Word Chain",
    difficulty: "HARD",
    learningObjective:
      "Model words as graph nodes joined by one-letter edits, and find neighbours fast by bucketing words under wildcard patterns.",
    topics: ["graphs", "strings"],
    patterns: ["breadth-first-search", "hashing"],
    statement: [
      rich(
        "In a word game, players turn ",
        { code: "start" },
        " into ",
        { code: "goal" },
        " by changing exactly one letter per move. Every word produced along the way, including ",
        { code: "goal" },
        " itself, must appear in the allowed list ",
        { code: "words" },
        ". The starting word does not need to be in the list."
      ),
      para(
        "Return the number of words in the shortest chain, counting both start and goal. If no chain exists, return 0. If start already equals goal and goal is allowed, the chain is just that one word."
      ),
      example(
        'start = "cold", goal = "warm", words = ["cord","card","ward","warm","worm","word","wore"]',
        "5",
        [
          { state: "cold", note: "1" },
          { state: "cord", note: "2 — change l to r" },
          { state: "card", note: "3 — change o to a" },
          { state: "ward", note: "4 — change c to w" },
          { state: "warm", note: "5 — change d to m" },
        ],
        "A five-word chain"
      ),
    ],
    constraints: [
      "1 ≤ start.length ≤ 5, and every word has the same length as start",
      "1 ≤ words.length ≤ 500",
      "All words use lowercase English letters; the list has no duplicates.",
    ],
    signature: {
      params: ["string", "string", "string[]"],
      paramNames: ["start", "goal", "words"],
      returns: "int",
      functionName: "chainLength",
    },
    tests: [
      {
        input: "cold\nwarm\n7\ncord\ncard\nward\nwarm\nworm\nword\nwore",
        expected: "5",
        isSample: true,
      },
      {
        input: "lamp\nfire\n4\ncamp\ncame\nfame\nfire",
        expected: "0",
        isSample: true,
        explanation:
          'No allowed word sits one letter away from "fame" on the way to "fire", so no chain exists.',
      },
      { input: "bat\ncot\n3\ncat\ncot\nbot", expected: "3", isSample: true },
      { input: "abc\nabd\n1\nabd", expected: "2" },
      { input: "abc\nxyz\n2\nabd\nxyz", expected: "0" },
      { input: "hit\nhot\n2\nhit\ndot", expected: "0" },
      { input: "same\nsame\n1\nsame", expected: "1" },
      { input: "same\nsame\n1\nlame", expected: "0" },
      {
        input:
          "aaaa\nhhhh\n502\naaad\naaae\naaba\naabg\naacc\naacd\naadb\naaeh\naafh\naagd\naahc\naahh\nabag\nabcd\nabfc\nabhd\nacae\nacbh\naccb\naccd\nacce\naccg\nacfe\nachb\nadea\nadec\nadeg\nadgd\naeba\naebb\naebd\naece\naedc\naeeb\naefd\naeff\naegf\nafcf\nafgh\nagah\nagbb\nagde\nagfe\nagfg\nagga\nahae\nahaf\nahba\nahbf\nahcf\nahga\nahgg\nahhd\nahhg\nbaab\nbaag\nbaah\nbabe\nbabf\nbacd\nbadd\nbagd\nbagg\nbagh\nbbbe\nbbbg\nbbbh\nbbcb\nbbcc\nbbcd\nbbch\nbbed\nbbeh\nbbgh\nbcaf\nbcag\nbcbf\nbcbh\nbcec\nbcfa\nbcfc\nbcfh\nbchf\nbdac\nbdbf\nbdcf\nbddc\nbdfh\nbdgf\nbdha\nbdhg\nbead\nbeae\nbebd\nbece\nbede\nbedh\nbefa\nbegf\nbfbd\nbfbf\nbfca\nbfeb\nbfec\nbfed\nbfgc\nbfhh\nbgdc\nbgga\nbhad\nbhae\nbhec\nbhfe\nbhfh\nbhgb\ncabe\ncabf\ncabg\ncaca\ncacd\ncadb\ncaeb\ncaed\ncagh\ncahb\ncahc\ncbeb\ncbec\ncbfe\ncbfg\ncbgf\ncbhb\nccab\nccag\nccch\nccdb\nccdc\nccde\nccea\ncced\nccfd\nccga\ncche\ncdaf\ncdah\ncdcc\ncdcd\ncdcg\ncddh\ncdea\ncded\ncdef\ncdfa\ncdfb\ncdgf\ncdhd\ncdhe\nceac\nceba\ncebe\ncecg\nceeg\ncegc\ncegh\ncfdc\ncfeh\ncfgb\ncfhb\ncfhd\ncgbb\ncgbd\ncgcf\ncged\ncgef\ncgfc\ncgfg\ncggf\ncghd\ncghf\nchbd\nchbf\nchcg\nched\nchfd\nchff\nchgh\ndabc\ndaff\ndagb\ndagd\ndbac\ndbce\ndbde\ndbdf\ndbec\ndbee\ndbeh\ndbhf\ndccd\ndcda\ndcdd\ndcee\ndcfa\ndcha\ndchf\nddad\nddbf\nddbg\nddcc\nddcd\ndddc\nddee\nddfa\nddfc\nddgh\nddhg\nddhh\ndeab\ndebc\ndecb\ndedd\ndeee\ndeeh\ndefb\ndegf\ndehb\ndfab\ndfae\ndfce\ndfdf\ndfeb\ndfha\ndgbc\ndgbe\ndgbh\ndgca\ndgfe\ndgfh\ndggg\ndghd\ndghg\ndhch\ndhdc\ndhee\ndhfb\ndhfe\ndhgh\neafb\neafc\neafh\neagc\neagf\neahd\neahg\nebba\nebbd\nebbf\nebch\nebgg\nebhg\necbf\necbg\necce\neccg\necdf\necfa\necfd\necge\neche\nedbf\nedbg\neddg\nedef\nedhd\neeac\neeba\neecb\neecc\neeec\nefac\nefad\nefcf\nefed\nefeh\nefff\nefga\nefhf\negad\negbd\negcf\negec\negeh\neggh\negha\nehaa\nehac\nehbg\neheb\nehef\nehfh\nehga\nehgc\nehgf\nehha\nehhb\nehhc\nfaaa\nfabg\nfada\nfadf\nfaee\nfafb\nfaga\nfbec\nfbee\nfbef\nfbeg\nfbge\nfcac\nfccg\nfcdh\nfcee\nfcfe\nfcff\nfcfg\nfcgc\nfcgg\nfdba\nfddd\nfdeg\nfdeh\nfdfa\nfdgg\nfdhb\nfdhf\nfeac\nfecf\nfeee\nfeff\nfegc\nfegd\nfege\nffac\nffdg\nffdh\nffed\nffeg\nffff\nffge\nffhe\nfgab\nfgac\nfgba\nfgda\nfgdd\nfgdg\nfgfc\nfggb\nfggc\nfggh\nfhag\nfhbc\nfhcd\nfhcg\nfhdg\nfheb\nfhfc\nfhfe\nfhfg\nfhga\nfhgh\ngaaa\ngaac\ngabg\ngadg\ngaeb\ngagb\ngagc\ngage\ngbae\ngbah\ngbbc\ngbbg\ngbdh\ngbed\ngbfe\ngbga\ngbgh\ngcad\ngcbd\ngcbg\ngcch\ngcdc\ngcde\ngcfd\ngdaf\ngdda\ngdea\ngdec\ngdfb\ngdfd\ngdga\ngdhg\ngeaa\ngeab\ngeba\ngecb\ngede\ngeef\ngefb\ngeff\ngehf\ngfag\ngfcb\ngfcf\ngfdd\ngfde\ngfga\ngfgf\ngfgh\ngfhc\nggbg\nggcb\nggeb\nggfe\nggge\ngggf\nggha\ngghe\ngghg\nghag\nghba\nghbd\nghca\ngheb\nghef\ngheg\nghfc\nghfg\nghgb\nhabh\nhacg\nhafe\nhahh\nhbaf\nhbbc\nhbbe\nhbca\nhbgg\nhbhc\nhbhh\nhcac\nhcbc\nhcca\nhcda\nhcfa\nhcfh\nhcha\nhche\nhdae\nhdbc\nhdcd\nhdda\nhdeg\nhdfe\nhdfg\nhdgb\nheae\nheca\nhecg\nhedb\nheff\nhegd\nhegh\nheha\nhehc\nhehd\nhfcc\nhfdd\nhfeg\nhffb\nhfgb\nhfgg\nhgbg\nhgda\nhgdd\nhgeg\nhgfc\nhgfg\nhggc\nhhab\nhhag\nhhbd\nhhdb\nhhfa\nhhfe\nhhgf\nhhgh\nhhhe\nhhhh\naaaa\nhhhh",
        expected: "7",
      },
      {
        input:
          "aabg\nhhdb\n500\naaad\naaae\naaba\naabg\naacc\naacd\naadb\naaeh\naafh\naagd\naahc\naahh\nabag\nabcd\nabfc\nabhd\nacae\nacbh\naccb\naccd\nacce\naccg\nacfe\nachb\nadea\nadec\nadeg\nadgd\naeba\naebb\naebd\naece\naedc\naeeb\naefd\naeff\naegf\nafcf\nafgh\nagah\nagbb\nagde\nagfe\nagfg\nagga\nahae\nahaf\nahba\nahbf\nahcf\nahga\nahgg\nahhd\nahhg\nbaab\nbaag\nbaah\nbabe\nbabf\nbacd\nbadd\nbagd\nbagg\nbagh\nbbbe\nbbbg\nbbbh\nbbcb\nbbcc\nbbcd\nbbch\nbbed\nbbeh\nbbgh\nbcaf\nbcag\nbcbf\nbcbh\nbcec\nbcfa\nbcfc\nbcfh\nbchf\nbdac\nbdbf\nbdcf\nbddc\nbdfh\nbdgf\nbdha\nbdhg\nbead\nbeae\nbebd\nbece\nbede\nbedh\nbefa\nbegf\nbfbd\nbfbf\nbfca\nbfeb\nbfec\nbfed\nbfgc\nbfhh\nbgdc\nbgga\nbhad\nbhae\nbhec\nbhfe\nbhfh\nbhgb\ncabe\ncabf\ncabg\ncaca\ncacd\ncadb\ncaeb\ncaed\ncagh\ncahb\ncahc\ncbeb\ncbec\ncbfe\ncbfg\ncbgf\ncbhb\nccab\nccag\nccch\nccdb\nccdc\nccde\nccea\ncced\nccfd\nccga\ncche\ncdaf\ncdah\ncdcc\ncdcd\ncdcg\ncddh\ncdea\ncded\ncdef\ncdfa\ncdfb\ncdgf\ncdhd\ncdhe\nceac\nceba\ncebe\ncecg\nceeg\ncegc\ncegh\ncfdc\ncfeh\ncfgb\ncfhb\ncfhd\ncgbb\ncgbd\ncgcf\ncged\ncgef\ncgfc\ncgfg\ncggf\ncghd\ncghf\nchbd\nchbf\nchcg\nched\nchfd\nchff\nchgh\ndabc\ndaff\ndagb\ndagd\ndbac\ndbce\ndbde\ndbdf\ndbec\ndbee\ndbeh\ndbhf\ndccd\ndcda\ndcdd\ndcee\ndcfa\ndcha\ndchf\nddad\nddbf\nddbg\nddcc\nddcd\ndddc\nddee\nddfa\nddfc\nddgh\nddhg\nddhh\ndeab\ndebc\ndecb\ndedd\ndeee\ndeeh\ndefb\ndegf\ndehb\ndfab\ndfae\ndfce\ndfdf\ndfeb\ndfha\ndgbc\ndgbe\ndgbh\ndgca\ndgfe\ndgfh\ndggg\ndghd\ndghg\ndhch\ndhdc\ndhee\ndhfb\ndhfe\ndhgh\neafb\neafc\neafh\neagc\neagf\neahd\neahg\nebba\nebbd\nebbf\nebch\nebgg\nebhg\necbf\necbg\necce\neccg\necdf\necfa\necfd\necge\neche\nedbf\nedbg\neddg\nedef\nedhd\neeac\neeba\neecb\neecc\neeec\nefac\nefad\nefcf\nefed\nefeh\nefff\nefga\nefhf\negad\negbd\negcf\negec\negeh\neggh\negha\nehaa\nehac\nehbg\neheb\nehef\nehfh\nehga\nehgc\nehgf\nehha\nehhb\nehhc\nfaaa\nfabg\nfada\nfadf\nfaee\nfafb\nfaga\nfbec\nfbee\nfbef\nfbeg\nfbge\nfcac\nfccg\nfcdh\nfcee\nfcfe\nfcff\nfcfg\nfcgc\nfcgg\nfdba\nfddd\nfdeg\nfdeh\nfdfa\nfdgg\nfdhb\nfdhf\nfeac\nfecf\nfeee\nfeff\nfegc\nfegd\nfege\nffac\nffdg\nffdh\nffed\nffeg\nffff\nffge\nffhe\nfgab\nfgac\nfgba\nfgda\nfgdd\nfgdg\nfgfc\nfggb\nfggc\nfggh\nfhag\nfhbc\nfhcd\nfhcg\nfhdg\nfheb\nfhfc\nfhfe\nfhfg\nfhga\nfhgh\ngaaa\ngaac\ngabg\ngadg\ngaeb\ngagb\ngagc\ngage\ngbae\ngbah\ngbbc\ngbbg\ngbdh\ngbed\ngbfe\ngbga\ngbgh\ngcad\ngcbd\ngcbg\ngcch\ngcdc\ngcde\ngcfd\ngdaf\ngdda\ngdea\ngdec\ngdfb\ngdfd\ngdga\ngdhg\ngeaa\ngeab\ngeba\ngecb\ngede\ngeef\ngefb\ngeff\ngehf\ngfag\ngfcb\ngfcf\ngfdd\ngfde\ngfga\ngfgf\ngfgh\ngfhc\nggbg\nggcb\nggeb\nggfe\nggge\ngggf\nggha\ngghe\ngghg\nghag\nghba\nghbd\nghca\ngheb\nghef\ngheg\nghfc\nghfg\nghgb\nhabh\nhacg\nhafe\nhahh\nhbaf\nhbbc\nhbbe\nhbca\nhbgg\nhbhc\nhbhh\nhcac\nhcbc\nhcca\nhcda\nhcfa\nhcfh\nhcha\nhche\nhdae\nhdbc\nhdcd\nhdda\nhdeg\nhdfe\nhdfg\nhdgb\nheae\nheca\nhecg\nhedb\nheff\nhegd\nhegh\nheha\nhehc\nhehd\nhfcc\nhfdd\nhfeg\nhffb\nhfgb\nhfgg\nhgbg\nhgda\nhgdd\nhgeg\nhgfc\nhgfg\nhggc\nhhab\nhhag\nhhbd\nhhdb\nhhfa\nhhfe\nhhgf\nhhgh\nhhhe\nhhhh",
        expected: "11",
      },
      {
        input:
          "aaaaf\nfffff\n450\naaaaf\naaaee\naabda\naafac\naafbd\naafbe\naaffc\nabaad\nababd\nabaef\nabbca\nabbfa\nabcad\nabcbc\nabcdc\nabcef\nabdab\nabdac\nabdae\nabddc\nabdfa\nabecb\nabedd\nabeed\nabfbb\nabfde\nacadb\nacadd\nacbfa\naccaf\naccbd\naccbf\nacdbd\nacdeb\naceba\nacecb\nacedc\nacedf\nacfae\nacfcc\nacfdb\nacffe\nadabd\nadabe\nadabf\nadaed\nadaff\nadbbb\nadbcc\nadbce\nadbfb\nadcba\nadcce\nadcea\nadcef\naddab\nadeeb\nadeff\nadfcf\naeaad\naeadb\naebba\naebce\naebdd\naebde\naebfc\naecae\naecfa\naecff\naedcd\naedfa\naeeae\naeebd\naeecf\naeedb\naeefd\naefcc\nafacf\nafafd\nafccc\nafebb\nafecd\naffbe\naffcc\naffdc\naffdd\nbaace\nbabed\nbadba\nbadef\nbaebf\nbaedf\nbaeee\nbaefa\nbafcd\nbbadd\nbbbbe\nbbcbc\nbbcbe\nbbccd\nbbccf\nbbddd\nbbdec\nbbecc\nbbeeb\nbbfad\nbbfcd\nbbfec\nbcaaa\nbcabc\nbcabe\nbcafd\nbcaff\nbcbdb\nbccfe\nbcdac\nbcdca\nbcdfe\nbcecf\nbcfbb\nbcfbd\nbcfcf\nbcfed\nbdabd\nbdacb\nbdadc\nbdbef\nbdddc\nbdded\nbdeda\nbdfaf\nbdfdd\nbeaaa\nbeabb\nbebfc\nbecca\nbeccb\nbecda\nbecdf\nbecef\nbedab\nbedad\nbedbc\nbedca\nbedda\nbedfd\nbefac\nbefad\nbefbc\nbfadf\nbfaee\nbfafe\nbfaff\nbfbbe\nbfbcd\nbfbee\nbfcbe\nbfdbe\nbfdde\nbfdee\nbfdfb\nbfedd\ncaabc\ncaabd\ncaacb\ncaadc\ncaaeb\ncabda\ncabed\ncabfa\ncacbe\ncadac\ncadbf\ncadef\ncaeba\ncaece\ncaecf\ncafce\ncafff\ncbbae\ncbbdd\ncbcae\ncbcbf\ncbccc\ncbced\ncbdac\ncbdee\ncbeae\ncbecd\ncbefb\ncbfee\nccadc\nccaef\nccbaf\nccbba\nccbcf\ncccec\ncccee\nccdaf\nccdbf\nccddb\nccdfc\ncceda\ncceff\nccfaa\nccfdb\nccfdc\ncdaae\ncdaba\ncdabe\ncdacf\ncdafd\ncdbaf\ncdbcc\ncdbea\ncdbec\ncdbfe\ncdcde\ncddce\ncdddb\ncddff\ncdedc\ncdeec\ncdfad\ncdfbd\ncdfdc\ncdffd\nceaff\ncecdd\ncefcc\ncefeb\nceffd\ncfaad\ncfaaf\ncfaee\ncfbae\ncfbec\ncfccb\ncfcce\ncfcfa\ncfcfb\ncfcff\ncfdcb\ncfebc\ncfece\ncfefc\ncffbd\ndaaac\ndaadb\ndaadd\ndabff\ndacae\ndacbd\ndaeae\ndafab\ndaffb\ndbabb\ndbadf\ndbbfd\ndbcbb\ndbcbf\ndbcdb\ndbecf\ndbedc\ndbeeb\ndbfba\ndbfcd\ndcade\ndcbad\ndcbba\ndcbee\ndccac\ndccae\ndccda\ndcdfa\ndcdfb\ndceec\ndcfac\nddaed\nddbbc\nddbdf\nddcff\ndddfc\nddecd\nddeef\nddffc\nddfff\ndeacd\ndebad\ndebbf\ndecaf\ndecef\ndecff\ndedfa\ndeede\ndeeef\ndefec\ndfbae\ndfbbb\ndfbfc\ndfcaf\ndfcbf\ndfcda\ndfcfb\ndfdcd\ndfefe\ndffdd\ndffea\ndfffa\ndfffd\neabab\neabaf\neabca\neacda\neadba\neaddc\neadea\neaeab\neaeea\neaeee\neafcf\nebacc\nebcad\nebcbe\nebcdd\nebdbd\nebddf\nebeac\nebedc\nebeef\nebfca\nebffd\necaad\necaae\necaaf\necaca\necade\necafd\necbaf\necbbd\necbdd\necbeb\neccac\necdae\necded\necebc\necfec\nedadb\nedadf\nedbca\nedbce\nedbcf\nedbee\nedcdc\nedcec\neddea\nedebc\nedecb\nedefb\nedfdb\nedfde\nedfec\nedffa\neebea\needba\neeeab\neeeae\neeeca\neeecd\neeeec\neeeef\neeefd\neefbe\neeffc\neefff\nefadd\nefade\nefafb\nefbad\nefbbe\nefbfd\nefccd\nefcde\nefcfa\neffbe\neffcf\nfabdb\nfaefa\nfafaa\nfafca\nfafcd\nfbaba\nfbabd\nfbada\nfbade\nfbbba\nfbcce\nfbcea\nfbecc\nfbfdc\nfbfdd\nfcabf\nfcacd\nfcbec\nfccda\nfccdb\nfccec\nfccff\nfcddf\nfceab\nfcebd\nfcebe\nfceca\nfcecd\nfcfbf\nfdacd\nfdbbf\nfdbeb\nfdcef\nfdcff\nfdddc\nfdecb\nfdefe\nfdeff\nfebdf\nfecfb\nfecfd\nfedbb\nfedca\nfedff\nfeeae\nfeeca\nfeeec\nfefca\nffaab\nffada\nffbce\nffcbb\nffcfa\nffcfe\nffded\nffdfd\nffeaf\nffecb\nffecc\nffeeb\nffefa\nfffcf\nfffec\nfffff",
        expected: "0",
      },
    ],
    hints: [
      "Every word is a node; two words are joined when they differ in exactly one position. You want the shortest path.",
      "Shortest path with equal-cost edges means breadth-first search, counting words rather than moves.",
      "Comparing every pair of words to find neighbours is slow. Words that differ only at position i share a pattern with a * at position i.",
      "Group words by each of their wildcard patterns once; then a word's neighbours are everything in its pattern groups.",
    ],
    solutions: [
      {
        title: "Breadth-first search, trying every letter",
        order: 1,
        intuition:
          "Generate neighbours directly: for every position, try all 26 letters and keep the results that are in the allowed set. Breadth-first search from the start then finds the shortest chain. Each word explored costs 26 × length set lookups, most of which miss.",
        approach: [
          "Put the allowed words in a set; if goal is missing, return 0.",
          "Breadth-first search from start, storing the chain length so far.",
          "For each popped word and each position, try every letter; enqueue allowed, unseen results.",
          "Return the length when goal is popped, or 0 if the queue empties.",
        ],
        code: {
          PYTHON: `from collections import deque


def chainLength(start: str, goal: str, words: List[str]) -> int:
    allowed = set(words)
    if goal not in allowed:
        return 0
    seen = {start}
    queue = deque([(start, 1)])
    while queue:
        word, length = queue.popleft()
        if word == goal:
            return length
        for i in range(len(word)):
            for ch in "abcdefghijklmnopqrstuvwxyz":
                cand = word[:i] + ch + word[i + 1:]
                if cand in allowed and cand not in seen:
                    seen.add(cand)
                    queue.append((cand, length + 1))
    return 0`,
          JAVA: `class Solution {
    public int chainLength(String start, String goal, String[] words) {
        HashSet<String> allowed = new HashSet<>(Arrays.asList(words));
        if (!allowed.contains(goal)) return 0;
        HashSet<String> seen = new HashSet<>();
        seen.add(start);
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.add(start);
        int length = 1;
        while (!queue.isEmpty()) {
            for (int k = queue.size(); k > 0; k--) {
                String word = queue.poll();
                if (word.equals(goal)) return length;
                char[] chars = word.toCharArray();
                for (int i = 0; i < chars.length; i++) {
                    char original = chars[i];
                    for (char ch = 'a'; ch <= 'z'; ch++) {
                        chars[i] = ch;
                        String cand = new String(chars);
                        if (allowed.contains(cand) && seen.add(cand)) queue.add(cand);
                    }
                    chars[i] = original;
                }
            }
            length++;
        }
        return 0;
    }
}`,
        },
        timeComplexity: "O(words × L² × 26)",
        spaceComplexity: "O(words × L)",
        edgeCases: ["goal is not in the list: 0 without searching."],
        commonMistakes: ["Counting moves instead of words in the chain."],
      },
      {
        title: "Optimal: breadth-first search with wildcard buckets",
        order: 2,
        intuition:
          "Two words are neighbours exactly when replacing the same position with * makes them identical. Build those buckets once: every word goes under its L wildcard patterns. During the search a word's neighbours are simply the members of its L buckets, so no lookup is wasted on a word that does not exist.",
        approach: [
          "If goal is not allowed, return 0.",
          "For each allowed word and each position i, add the word to the bucket for word[:i] + '*' + word[i+1:].",
          "Breadth-first search from start with chain length 1.",
          "For each popped word, scan the buckets of its L patterns and enqueue unseen members with length + 1.",
          "Return the length when goal is popped; 0 if the search ends first.",
        ],
        code: {
          PYTHON: `from collections import deque, defaultdict


def chainLength(start: str, goal: str, words: List[str]) -> int:
    if goal not in words:
        return 0

    # Words that differ only at position i share the pattern with * there.
    buckets = defaultdict(list)
    for w in words:
        for i in range(len(w)):
            buckets[w[:i] + "*" + w[i + 1:]].append(w)

    seen = {start}
    queue = deque([(start, 1)])
    while queue:
        word, length = queue.popleft()
        if word == goal:
            return length
        for i in range(len(word)):
            for nxt in buckets[word[:i] + "*" + word[i + 1:]]:
                if nxt not in seen:
                    seen.add(nxt)
                    queue.append((nxt, length + 1))

    return 0`,
          JAVA: `class Solution {
    public int chainLength(String start, String goal, String[] words) {
        boolean goalAllowed = false;
        HashMap<String, List<String>> buckets = new HashMap<>();
        for (String w : words) {
            if (w.equals(goal)) goalAllowed = true;
            for (int i = 0; i < w.length(); i++) {
                String key = w.substring(0, i) + "*" + w.substring(i + 1);
                buckets.computeIfAbsent(key, k -> new ArrayList<>()).add(w);
            }
        }
        if (!goalAllowed) return 0;

        HashSet<String> seen = new HashSet<>();
        seen.add(start);
        ArrayDeque<String> queue = new ArrayDeque<>();
        queue.add(start);
        int length = 1;
        while (!queue.isEmpty()) {
            for (int k = queue.size(); k > 0; k--) {
                String word = queue.poll();
                if (word.equals(goal)) return length;
                for (int i = 0; i < word.length(); i++) {
                    String key = word.substring(0, i) + "*" + word.substring(i + 1);
                    for (String next : buckets.getOrDefault(key, Collections.emptyList())) {
                        if (seen.add(next)) queue.add(next);
                    }
                }
            }
            length++;
        }
        return 0;
    }
}`,
        },
        timeComplexity: "O(words × L²) to build and search",
        spaceComplexity: "O(words × L²) for the buckets",
        edgeCases: [
          "start equals goal and goal is allowed: 1.",
          "start equals goal but goal is not allowed: 0.",
          "start appears in the list itself.",
          "Words reachable only through a long chain.",
        ],
        commonMistakes: [
          "Requiring start to be in the list.",
          "Forgetting to mark start as seen, so the search can loop back to it.",
          "Returning the number of moves (one fewer than the number of words).",
        ],
      },
    ],
    expectedTime: "O(words × L²)",
    expectedSpace: "O(words × L²)",
  },

  {
    slug: "demolition-corridor",
    title: "Corridor With Demolitions",
    difficulty: "HARD",
    learningObjective:
      "Extend breadth-first search with a resource dimension in the state, and prune a state when the same cell was reached with at least as much of the resource left.",
    topics: ["matrices", "graphs"],
    patterns: ["breadth-first-search"],
    statement: [
      para(
        "A rescue drone must cross a collapsed building mapped as a grid. Cells marked 0 are open and cells marked 1 are rubble walls. The drone moves up, down, left or right one cell per step. It carries a limited number of demolition charges: entering a wall cell uses one charge and clears the way."
      ),
      rich(
        "Starting in the top-left cell with ",
        { code: "charges" },
        " charges, return the fewest steps needed to reach the bottom-right cell, or ",
        { code: "-1" },
        " if it cannot be reached. The start and goal cells are always open."
      ),
      example(
        "grid = [[0,0,0],[1,1,0],[0,0,0],[0,1,1],[0,0,0]], charges = 1",
        "6",
        [
          { state: "without charges", note: "the zig-zag route takes 10 steps" },
          {
            state: "(0,0) → (1,0)",
            note: "blast through the wall below: 0 charges left",
          },
          { state: "(2,0) (3,0) (4,0)", note: "straight down the open left column" },
          { state: "(4,1) (4,2)", note: "along the bottom to the goal — 6 steps" },
        ],
        "Spending the charge where it saves the most"
      ),
    ],
    constraints: [
      "1 ≤ rows, cols ≤ 40",
      "grid[i][j] is 0 or 1, and grid[0][0] = grid[rows-1][cols-1] = 0",
      "0 ≤ charges ≤ 40",
    ],
    signature: {
      params: ["int[][]", "int"],
      paramNames: ["grid", "charges"],
      returns: "int",
      functionName: "fewestSteps",
    },
    tests: [
      {
        input: "5\n0 0 0\n1 1 0\n0 0 0\n0 1 1\n0 0 0\n1",
        expected: "6",
        isSample: true,
      },
      {
        input: "3\n0 1 1\n1 1 1\n1 0 0\n1",
        expected: "-1",
        isSample: true,
        explanation: "Every route needs to break through at least two walls.",
      },
      { input: "3\n0 1 0\n0 1 0\n0 1 0\n1", expected: "4", isSample: true },
      { input: "1\n0\n0", expected: "0" },
      { input: "2\n0 1\n1 0\n0", expected: "-1" },
      { input: "2\n0 1\n1 0\n1", expected: "2" },
      { input: "1\n0 1 1 1 0\n2", expected: "-1" },
      { input: "1\n0 1 1 1 0\n3", expected: "4" },
      { input: "5\n0 0 0 0\n1 1 1 0\n0 0 0 0\n0 1 1 1\n0 0 0 0\n0", expected: "13" },
      { input: "5\n0 0 0 0\n1 1 1 0\n0 0 0 0\n0 1 1 1\n0 0 0 0\n2", expected: "7" },
      {
        input:
          "40\n0 1 0 0 0 0 1 1 1 0 0 0 1 0 1 0 0 1 0 1 0 1 0 0 0 1 0 1 1 1 0 0 1 0 1 1 1 0 0 0\n1 0 1 0 1 0 0 0 1 1 0 0 1 1 1 1 0 1 0 0 1 0 1 0 1 0 0 0 1 0 1 0 0 0 1 0 1 0 1 1\n0 1 0 1 1 1 1 0 0 1 1 0 1 0 0 1 1 0 0 0 0 0 1 1 1 0 0 0 0 0 0 1 1 1 0 0 0 1 0 0\n0 0 0 1 1 0 0 0 1 0 0 1 0 0 0 0 1 1 0 1 0 1 0 0 0 1 0 1 1 1 0 0 0 0 1 1 1 1 0 0\n1 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 1 1 1 1 0 0 0 0 0 0 1 1 1 1 1 0 1 0 0 1 0 1 1 1\n0 1 0 1 0 0 0 1 1 1 1 1 0 1 1 1 1 0 1 1 0 1 0 0 0 1 1 1 1 0 1 0 0 0 1 0 0 0 0 0\n1 0 0 1 0 0 0 1 0 1 0 0 0 0 0 0 0 1 0 1 0 0 0 0 0 1 1 0 0 1 1 1 1 0 0 1 1 1 1 1\n0 1 0 1 0 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0\n0 1 1 1 1 1 0 0 0 0 1 0 1 0 0 1 1 0 0 0 0 0 1 0 0 0 0 0 0 1 0 0 0 1 1 0 0 0 1 1\n0 0 0 0 1 0 0 0 1 1 0 0 0 1 0 0 0 1 1 0 0 0 0 0 1 1 0 1 0 0 1 1 0 0 1 1 0 0 1 0\n0 0 1 0 0 0 0 0 1 1 1 1 0 1 1 0 0 0 0 0 1 1 0 1 0 1 1 1 0 0 0 0 0 0 0 0 0 1 1 0\n0 0 0 0 0 0 0 0 0 1 0 1 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 1 0\n1 0 1 0 1 1 0 1 0 0 1 0 1 0 0 1 0 1 0 1 0 0 1 0 0 0 1 0 0 1 0 0 0 0 0 0 1 1 1 0\n1 0 0 1 1 0 0 1 0 0 1 0 0 0 1 1 1 0 0 1 1 0 1 0 0 1 0 0 0 0 0 0 0 1 0 0 1 1 1 0\n0 1 0 0 1 0 1 0 1 1 1 1 0 0 1 0 1 0 0 1 1 0 0 1 0 1 1 0 0 0 0 0 1 0 1 0 1 0 1 0\n0 1 0 0 0 0 0 0 0 0 0 1 1 0 0 1 0 1 0 1 1 0 1 1 1 0 0 0 1 0 0 1 0 1 0 1 1 0 0 1\n0 0 0 0 0 1 1 0 1 1 1 0 0 0 1 0 0 0 0 1 0 0 0 0 0 0 0 0 1 0 0 0 0 0 1 1 0 0 0 1\n0 1 0 0 1 0 1 1 0 0 0 1 0 1 0 1 0 0 1 1 0 1 0 0 0 0 0 1 1 0 0 1 0 0 0 0 1 0 1 1\n0 0 0 0 0 0 0 1 0 1 0 0 1 0 1 1 0 0 1 1 0 1 0 1 0 0 1 1 0 0 0 1 1 0 0 0 1 0 0 0\n1 0 1 1 0 1 0 0 1 0 0 1 0 0 0 0 0 0 0 0 1 1 1 1 0 0 0 0 0 0 1 1 0 1 1 1 0 0 0 0\n0 0 0 1 0 0 1 0 0 1 0 0 1 0 0 0 1 1 0 1 1 0 1 1 0 0 0 0 1 1 1 0 0 0 0 0 0 0 1 0\n1 1 0 1 0 1 0 0 1 0 0 0 1 1 0 0 1 0 0 1 0 0 1 0 1 1 0 0 0 0 1 0 1 0 1 0 1 1 1 0\n1 0 1 0 0 0 0 1 1 0 0 1 0 1 1 0 0 0 0 0 0 0 0 0 0 1 1 0 0 0 1 0 1 0 0 0 0 0 0 0\n1 0 1 0 0 0 0 0 0 0 1 0 1 0 1 1 1 0 0 0 0 0 1 1 0 1 0 1 0 0 0 0 1 1 0 0 0 0 1 1\n0 1 0 0 0 1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 0 0 0 0 0 0 1 0 0 1 0 0 1 0 0 0 0 1 0 0\n1 1 0 0 1 1 1 0 1 0 0 1 0 1 0 0 0 0 0 1 0 1 0 0 0 1 0 0 0 1 1 0 0 0 0 1 0 0 1 0\n0 0 0 1 0 0 0 0 0 1 0 1 0 1 0 0 1 1 0 0 0 0 0 0 0 0 0 0 0 1 0 1 0 0 1 1 0 1 1 1\n0 1 0 0 0 1 0 1 0 1 0 0 0 0 1 0 1 1 1 0 0 0 0 1 1 0 1 1 0 1 1 0 1 0 1 0 0 0 0 0\n1 0 0 1 0 0 0 0 0 0 0 0 0 1 0 0 0 0 1 1 0 1 0 0 0 1 1 0 0 1 0 1 1 0 1 1 1 1 0 1\n0 0 0 1 0 0 1 0 0 0 0 0 1 0 0 0 1 0 0 1 0 0 0 1 0 0 1 0 1 0 0 0 1 1 0 0 1 0 0 0\n0 1 1 0 1 0 0 1 0 0 1 1 1 1 0 0 0 1 1 0 1 1 0 1 0 0 0 1 1 0 1 1 0 0 0 1 0 1 1 0\n0 0 0 0 0 1 1 1 0 0 0 1 0 0 1 1 0 1 0 1 1 1 0 1 1 1 0 0 1 0 0 1 0 1 0 0 1 0 1 0\n0 0 1 0 0 1 1 0 1 0 0 0 0 1 0 0 0 1 0 0 0 0 0 0 1 0 1 0 0 1 1 0 0 0 0 1 0 0 0 1\n1 0 1 0 1 1 1 0 1 1 0 0 0 0 0 0 0 1 0 1 0 0 0 1 0 1 0 0 0 0 0 1 0 0 1 0 0 0 0 1\n0 0 0 0 0 1 0 0 0 1 0 0 0 1 1 0 1 0 1 0 0 1 0 0 0 0 0 1 1 0 0 1 0 0 0 0 1 1 1 0\n0 0 1 0 0 0 0 0 0 0 0 0 0 1 1 1 0 0 0 0 1 1 0 0 0 0 1 0 1 1 1 0 0 1 0 0 0 0 0 1\n1 1 1 0 1 0 0 0 0 0 1 1 0 0 0 0 1 1 0 0 1 0 0 1 0 0 0 0 0 0 0 1 0 0 0 0 1 1 0 1\n1 0 0 0 1 0 0 0 0 0 0 1 0 0 0 0 1 1 1 1 1 1 1 1 0 0 0 0 0 1 0 0 1 0 0 0 0 0 1 0\n1 0 1 1 0 0 0 0 0 1 0 0 1 0 0 1 1 1 1 0 0 0 0 1 0 0 1 1 0 1 1 1 0 1 0 0 0 1 0 0\n0 0 1 0 0 1 1 0 0 0 0 0 0 1 1 0 1 1 0 1 0 1 0 0 0 1 0 1 0 1 0 0 0 0 0 0 1 1 0 0\n3",
        expected: "102",
      },
      {
        input:
          "40\n0 1 1 1 1 0 1 0 1 1 0 0 0 1 0 0 1 0 0 1 0 1 0 1 1 1 1 0 0 0 1 0 1 0 1 0 0 1 1 1\n0 1 0 0 0 1 1 0 0 0 0 1 1 0 0 0 1 0 0 0 0 1 0 0 0 1 1 1 1 1 1 1 1 0 0 1 0 0 1 0\n1 1 1 0 1 1 1 0 1 1 0 0 1 1 1 0 1 1 0 1 1 0 0 0 0 1 0 0 1 1 1 1 1 1 1 1 0 0 0 0\n1 1 1 1 1 1 0 1 0 1 1 0 1 0 0 0 1 0 0 0 0 0 0 0 0 1 0 1 0 0 0 1 1 1 1 0 1 1 1 1\n0 1 1 1 1 0 0 1 0 1 0 1 1 0 0 1 1 0 1 0 0 0 1 0 1 0 1 0 0 1 0 1 1 1 0 1 0 1 1 1\n1 0 0 0 0 1 1 1 1 0 0 1 1 0 0 1 1 0 1 0 0 0 0 1 0 0 0 1 0 0 0 1 0 0 0 1 0 1 0 0\n0 0 0 0 0 0 0 1 0 1 1 1 0 0 1 1 1 1 1 1 0 0 0 0 1 1 1 1 0 1 1 1 1 0 1 0 1 0 1 1\n1 1 0 0 1 1 1 0 1 0 0 1 0 0 0 1 1 1 0 0 0 1 0 0 1 0 0 0 0 0 0 1 1 1 1 1 1 0 1 0\n1 1 0 0 1 1 0 1 1 1 1 0 1 0 1 0 1 0 0 0 0 0 0 1 0 0 1 1 1 1 1 1 0 1 1 0 1 1 1 1\n0 1 0 0 1 1 0 1 1 0 1 0 0 1 0 0 1 1 1 1 0 0 1 1 1 0 0 0 0 1 0 0 0 0 0 1 1 0 1 1\n1 1 0 0 0 1 0 1 1 0 0 1 1 0 0 0 1 0 1 0 0 0 0 0 0 0 1 0 1 0 1 0 1 1 0 1 0 1 0 0\n0 0 1 1 0 1 0 1 0 0 0 1 0 0 0 1 0 1 0 0 1 0 1 0 0 1 1 1 0 0 0 0 1 0 1 0 1 0 0 1\n1 1 1 0 1 0 0 1 1 0 1 1 0 1 1 1 0 1 1 0 1 0 1 1 0 0 1 0 1 0 1 1 1 0 1 0 1 0 0 1\n0 1 0 1 1 1 1 1 0 1 0 0 0 1 1 1 0 1 1 1 0 0 1 1 1 0 1 1 1 1 1 0 1 0 1 0 1 1 1 0\n1 0 1 0 1 0 1 0 0 1 0 0 0 1 0 0 0 1 1 0 1 0 0 1 1 1 0 0 1 1 1 0 0 1 1 1 1 0 0 1\n1 0 0 0 0 1 0 0 0 0 0 0 1 1 0 1 1 0 1 0 0 0 1 0 0 1 0 1 1 0 0 0 1 1 1 0 0 1 1 0\n0 0 1 1 0 0 1 1 1 1 1 1 0 0 0 0 1 1 0 0 1 1 1 1 1 0 0 0 1 1 0 0 0 0 0 0 0 1 0 1\n1 1 1 1 0 1 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 1 1 1 1 1 0 1 0 0 1 1 0 0 0 0 1 0 1 0\n0 1 0 1 0 1 0 1 0 0 0 1 1 0 0 0 1 0 0 0 0 0 1 0 1 1 1 1 1 1 0 1 0 1 1 1 1 0 0 1\n1 1 1 1 0 1 1 0 0 1 0 0 1 0 1 1 0 1 0 1 1 1 0 0 0 1 0 0 0 0 0 0 1 0 1 0 1 1 1 0\n0 1 0 0 1 0 1 1 0 1 0 1 0 0 0 1 0 1 0 1 0 1 1 0 1 1 0 1 0 1 0 0 0 1 0 1 1 0 1 0\n1 1 1 0 0 0 0 1 1 1 0 0 0 0 0 1 0 1 1 0 1 0 1 1 0 1 1 1 0 0 1 0 0 0 0 1 1 1 1 1\n0 1 0 0 1 1 1 0 1 1 0 1 0 0 0 1 0 1 1 1 1 0 0 0 1 1 1 1 0 0 1 0 0 1 0 1 1 1 0 1\n0 0 0 1 0 1 0 1 0 1 0 1 0 1 1 0 1 1 1 1 0 0 0 1 0 0 0 1 0 0 0 1 1 1 1 0 0 0 0 0\n0 0 0 0 0 0 0 1 1 1 0 0 1 1 1 1 0 1 0 0 0 0 0 1 1 1 1 1 0 0 0 0 1 1 0 1 0 0 0 1\n0 0 0 1 0 1 1 1 0 0 0 1 1 0 0 0 0 1 1 0 1 1 1 1 1 1 1 0 0 1 0 0 0 0 0 1 0 1 1 0\n1 1 0 1 1 1 0 1 0 0 1 0 0 0 1 1 1 0 0 0 0 1 0 1 0 0 0 0 0 0 0 1 1 0 1 1 0 0 0 1\n0 1 0 1 0 1 1 0 1 0 1 1 1 0 0 0 0 1 1 0 1 1 1 0 0 0 1 0 1 0 1 1 0 1 0 1 1 1 1 1\n0 1 0 1 0 0 0 1 0 0 0 1 0 1 1 1 0 0 1 0 0 0 1 1 1 0 1 1 0 0 0 0 1 1 1 0 0 1 1 0\n1 1 0 0 1 1 1 0 0 0 0 1 0 1 1 1 0 0 1 0 0 0 1 0 0 0 1 0 0 0 1 0 1 0 1 1 1 0 0 0\n1 1 0 1 1 1 0 0 1 1 1 1 1 0 0 1 0 1 1 0 0 1 1 0 1 1 0 0 1 1 0 0 1 1 1 1 1 0 1 1\n1 1 0 0 1 1 1 0 1 0 0 1 0 0 1 0 0 0 1 0 1 1 1 0 1 1 0 0 0 1 1 1 0 1 0 0 1 0 1 0\n1 1 0 1 1 0 1 0 0 0 0 1 0 0 0 0 0 0 1 0 0 1 0 1 0 0 1 1 1 1 0 1 0 0 0 0 0 0 0 0\n0 1 1 0 1 1 0 1 0 0 0 0 1 1 0 1 1 1 0 0 1 0 1 1 0 0 0 0 0 0 1 0 1 0 1 0 1 1 1 0\n1 1 0 0 0 1 1 0 0 0 1 1 0 1 1 1 1 1 1 0 1 0 1 0 0 1 1 1 0 0 1 1 1 1 0 1 1 1 0 0\n0 0 1 0 1 1 1 1 1 0 1 0 0 1 1 1 0 1 0 1 1 1 0 0 1 0 0 1 0 1 0 1 0 1 1 0 1 1 1 1\n1 0 1 0 1 1 1 0 1 1 1 1 1 1 0 1 0 0 0 0 0 0 0 0 0 1 1 1 1 0 1 1 0 0 1 1 1 1 1 1\n1 1 1 1 0 0 1 0 1 1 1 1 0 0 1 0 0 1 0 1 0 1 0 1 1 0 0 1 0 1 0 0 1 0 1 1 0 1 0 0\n0 0 1 1 0 1 1 1 1 0 1 1 1 0 1 1 0 0 1 0 1 0 1 1 1 0 1 0 1 1 0 0 1 1 0 0 1 1 1 0\n1 1 0 0 0 0 1 0 1 0 1 0 0 1 1 0 0 0 1 0 0 0 1 1 0 0 0 0 1 0 1 1 0 0 1 1 0 0 1 0\n5",
        expected: "-1",
      },
      {
        input:
          "30\n0 1 0 1 0 1 1 1 1 0 1 1 0 1 1 1 0 1 1 1 1 0 1 1 1 0 0 0 0 1\n0 0 1 0 0 1 0 1 1 0 1 0 0 1 0 1 0 0 1 0 1 1 0 1 1 1 1 1 1 1\n1 1 1 1 0 1 1 0 1 1 0 1 0 1 1 1 0 1 0 0 1 1 1 1 1 1 0 1 1 0\n1 0 0 1 0 0 1 0 1 1 0 1 0 0 0 1 0 0 0 1 0 1 1 1 1 0 1 1 0 1\n0 0 1 1 1 0 0 0 1 0 1 1 1 1 0 1 1 0 1 1 1 0 1 1 0 1 1 0 1 1\n0 1 1 0 1 0 1 0 1 1 0 0 1 1 1 1 0 0 1 0 1 1 0 0 1 1 1 1 0 1\n1 1 0 1 1 1 0 1 1 1 0 1 1 1 0 1 1 1 1 1 1 0 1 1 0 1 0 0 1 0\n0 0 1 0 1 1 1 0 0 1 1 0 1 1 1 1 1 1 1 0 1 1 0 0 1 1 1 0 0 1\n1 0 0 0 1 1 1 0 0 1 1 0 0 1 0 1 0 0 1 0 1 1 1 1 0 0 1 1 0 0\n1 1 1 0 0 0 1 0 0 1 1 0 1 1 0 0 1 0 1 1 0 1 1 0 1 1 1 0 1 1\n0 1 1 0 1 0 0 0 0 0 0 0 1 0 1 1 0 1 0 1 1 1 0 1 0 0 1 0 0 1\n1 1 1 1 1 0 0 1 1 1 1 1 0 0 1 1 1 1 0 1 0 1 1 0 1 1 1 0 1 0\n1 0 1 1 1 0 0 1 0 1 0 1 0 0 1 0 0 1 1 1 1 1 1 0 1 1 0 0 1 1\n0 0 1 1 1 0 0 0 0 1 0 1 1 0 0 1 1 1 0 1 0 1 1 1 0 0 1 1 0 1\n0 1 1 0 0 1 0 1 0 1 1 0 1 0 1 0 1 1 0 1 1 0 0 1 0 1 1 1 0 0\n1 1 1 0 1 1 1 1 0 1 1 0 1 0 1 0 0 0 0 0 1 1 0 1 0 1 1 0 0 1\n1 1 0 0 0 1 1 1 0 1 1 1 0 0 1 1 0 1 0 1 1 1 0 1 1 1 0 1 0 1\n1 0 0 1 1 0 0 0 1 1 1 0 1 1 1 0 1 0 1 0 1 0 0 0 0 0 1 0 0 1\n0 0 0 0 1 1 0 1 0 1 0 1 0 1 1 0 0 1 1 1 1 1 1 1 0 1 1 1 0 0\n0 0 1 1 1 1 1 1 1 1 0 1 1 1 0 0 1 1 0 0 1 0 1 0 1 1 1 0 1 0\n1 1 0 1 0 1 1 1 1 1 1 0 0 1 0 1 1 1 1 1 1 1 1 1 1 1 0 0 1 1\n1 1 1 1 1 1 0 1 1 0 0 0 1 1 1 0 1 0 0 1 1 1 1 0 0 1 1 1 1 1\n1 1 1 0 0 1 1 1 0 1 1 0 0 1 1 1 1 1 1 1 1 1 1 0 1 0 1 1 0 0\n1 1 0 1 1 0 1 1 1 1 1 0 1 0 1 1 1 1 1 0 0 1 0 1 1 1 1 0 0 1\n0 1 0 0 0 0 1 0 0 1 0 1 1 0 1 1 1 1 0 1 0 0 0 1 1 1 0 0 1 0\n0 0 1 1 0 0 1 1 1 1 1 0 0 1 0 0 1 1 0 1 1 1 1 0 0 1 1 0 1 1\n1 1 1 0 1 0 1 1 1 1 1 0 0 0 1 1 1 1 1 0 1 1 0 1 1 1 0 1 1 1\n0 0 1 1 0 1 1 0 1 0 1 1 1 0 0 1 0 1 0 1 1 0 0 1 1 1 0 1 1 1\n0 0 1 1 1 0 1 0 1 1 1 0 1 1 1 1 1 0 0 0 1 1 1 1 0 0 0 1 1 0\n1 1 1 1 1 1 1 1 1 1 1 1 1 0 1 1 0 1 0 1 1 0 1 1 0 1 1 1 1 0\n0",
        expected: "-1",
      },
    ],
    hints: [
      "Without charges this is a plain shortest path: breadth-first search.",
      "With charges, being at a cell with 2 charges left is a different situation from being there with 0. The state is (row, col, charges left).",
      "Run breadth-first search over those states. Each move costs one step, whether or not it uses a charge.",
      "Prune: if you already reached a cell with at least as many charges left, a later arrival with fewer charges can never do better.",
    ],
    solutions: [
      {
        title: "Breadth-first search over (row, col, charges left)",
        order: 1,
        intuition:
          "Charges change what the drone can do next, so they belong in the state. Every move is one step, so breadth-first search over states (row, col, remaining) still finds the fewest steps; the first state that reaches the goal wins. Mark each state as visited separately.",
        approach: [
          "If the grid is 1×1, return 0.",
          "Enqueue (0, 0, charges) and mark it visited.",
          "Process level by level. For each neighbour, compute the charges left after entering it; skip if negative or already visited.",
          "Return the level when the goal is generated; -1 if the queue empties.",
        ],
        code: {
          PYTHON: `from collections import deque


def fewestSteps(grid: List[List[int]], charges: int) -> int:
    rows, cols = len(grid), len(grid[0])
    if rows == 1 and cols == 1:
        return 0
    visited = {(0, 0, charges)}
    queue = deque([(0, 0, charges)])
    steps = 0
    while queue:
        steps += 1
        for _ in range(len(queue)):
            r, c, left = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if not (0 <= nr < rows and 0 <= nc < cols):
                    continue
                remaining = left - grid[nr][nc]
                if remaining < 0 or (nr, nc, remaining) in visited:
                    continue
                if nr == rows - 1 and nc == cols - 1:
                    return steps
                visited.add((nr, nc, remaining))
                queue.append((nr, nc, remaining))
    return -1`,
          JAVA: `class Solution {
    public int fewestSteps(int[][] grid, int charges) {
        int rows = grid.length, cols = grid[0].length;
        if (rows == 1 && cols == 1) return 0;
        boolean[][][] visited = new boolean[rows][cols][charges + 1];
        visited[0][0][charges] = true;
        int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0, charges});
        int steps = 0;
        while (!queue.isEmpty()) {
            steps++;
            for (int i = queue.size(); i > 0; i--) {
                int[] cur = queue.poll();
                for (int[] m : moves) {
                    int nr = cur[0] + m[0], nc = cur[1] + m[1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    int remaining = cur[2] - grid[nr][nc];
                    if (remaining < 0 || visited[nr][nc][remaining]) continue;
                    if (nr == rows - 1 && nc == cols - 1) return steps;
                    visited[nr][nc][remaining] = true;
                    queue.add(new int[]{nr, nc, remaining});
                }
            }
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(rows × cols × charges)",
        spaceComplexity: "O(rows × cols × charges)",
        edgeCases: [
          "A 1×1 grid needs 0 steps.",
          "charges = 0, which reduces to a plain maze.",
        ],
        commonMistakes: [
          "Keeping a visited flag per cell only, which blocks a later arrival that has more charges left.",
        ],
      },
      {
        title: "Optimal: breadth-first search keeping the best charges per cell",
        order: 2,
        intuition:
          "Arriving at a cell later and with fewer charges is never useful: an earlier arrival with more charges can do everything it can. So for each cell, remember the most charges any arrival has had, and only accept a new arrival that strictly beats it. That collapses the charges dimension of the visited set into one number per cell, and the grid itself shows the search frontier.",
        approach: [
          "If the grid is 1×1, return 0.",
          "Keep best[r][c] = the most charges left on any arrival so far (-1 for none); set best at the start to charges.",
          "Process level by level. For a neighbour, compute charges left after entering it.",
          "Skip it if negative or not strictly better than best for that cell; return the level if it is the goal; otherwise record it and enqueue.",
        ],
        code: {
          PYTHON: `from collections import deque


def fewestSteps(grid: List[List[int]], charges: int) -> int:
    rows, cols = len(grid), len(grid[0])
    if rows == 1 and cols == 1:
        return 0

    # Most charges left on any arrival at each cell; -1 means never reached.
    best = [[-1] * cols for _ in range(rows)]
    best[0][0] = charges
    queue = deque([(0, 0, charges)])
    steps = 0

    while queue:
        steps += 1
        for _ in range(len(queue)):
            r, c, left = queue.popleft()
            for nr, nc in ((r + 1, c), (r - 1, c), (r, c + 1), (r, c - 1)):
                if not (0 <= nr < rows and 0 <= nc < cols):
                    continue
                remaining = left - grid[nr][nc]
                # An earlier arrival with at least as many charges dominates this one.
                if remaining < 0 or remaining <= best[nr][nc]:
                    continue
                if nr == rows - 1 and nc == cols - 1:
                    return steps
                best[nr][nc] = remaining
                queue.append((nr, nc, remaining))

    return -1`,
          JAVA: `class Solution {
    public int fewestSteps(int[][] grid, int charges) {
        int rows = grid.length, cols = grid[0].length;
        if (rows == 1 && cols == 1) return 0;
        int[][] best = new int[rows][cols];
        for (int[] row : best) Arrays.fill(row, -1);
        best[0][0] = charges;
        int[][] moves = {{1, 0}, {-1, 0}, {0, 1}, {0, -1}};
        ArrayDeque<int[]> queue = new ArrayDeque<>();
        queue.add(new int[]{0, 0, charges});
        int steps = 0;
        while (!queue.isEmpty()) {
            steps++;
            for (int i = queue.size(); i > 0; i--) {
                int[] cur = queue.poll();
                for (int[] m : moves) {
                    int nr = cur[0] + m[0], nc = cur[1] + m[1];
                    if (nr < 0 || nr >= rows || nc < 0 || nc >= cols) continue;
                    int remaining = cur[2] - grid[nr][nc];
                    if (remaining < 0 || remaining <= best[nr][nc]) continue;
                    if (nr == rows - 1 && nc == cols - 1) return steps;
                    best[nr][nc] = remaining;
                    queue.add(new int[]{nr, nc, remaining});
                }
            }
        }
        return -1;
    }
}`,
        },
        timeComplexity: "O(rows × cols × charges) in the worst case, usually far less",
        spaceComplexity: "O(rows × cols) for best, plus the queue",
        edgeCases: [
          "More charges than walls on the straight route: the answer is rows + cols − 2.",
          "A solid band of walls thicker than the charges available: -1.",
          "Charges saved early that are needed later on the route.",
        ],
        commonMistakes: [
          "Using Dijkstra on charges spent, which minimises demolitions rather than steps.",
          "Pruning with < instead of ≤, which re-enqueues equivalent states and slows the search.",
          "Spending a charge when entering an open cell.",
        ],
      },
    ],
    expectedTime: "O(rows × cols × charges)",
    expectedSpace: "O(rows × cols × charges)",
  },
];
