import type { Language } from "@/generated/prisma/enums";

/**
 * Problem signatures, and the code generation that follows from them.
 *
 * Every problem declares the shape of its entry point once:
 *
 *     { params: ["int[]", "int"], paramNames: ["nums", "k"], returns: "int" }
 *
 * From that single declaration this module derives, for each language, the
 * starter stub the learner sees and the harness that feeds it test input.
 * That is the whole point: 50 problems x 4 languages is 200 harnesses, and
 * hand-writing 200 near-identical stdin parsers is both enormous and exactly
 * the kind of repetition that rots. Here there is one reader per (type,
 * language) pair, and a signature composes them.
 *
 * ---------------------------------------------------------------------------
 * WIRE FORMAT
 *
 * Test input is plain text, one argument after another, in parameter order.
 * It is deliberately not JSON: every target language can parse this with its
 * standard library alone, and a failing case stays readable in the results
 * panel.
 *
 *   int         one line, e.g. `7`
 *   string      one line, taken verbatim (may be empty)
 *   int[]       one line of space-separated integers; empty line = []
 *   string[]    a count line, then that many lines
 *   int[][]     a count line, then that many space-separated rows
 *
 * Output is written the same way, so expected values are diffable text:
 *
 *   int/double  the number (double fixed to 6 decimal places)
 *   bool        `true` or `false`
 *   string      verbatim
 *   int[]       one line, space separated
 *   string[]    a count line, then that many lines
 * ---------------------------------------------------------------------------
 */

export type ParamType =
  | "int"
  | "string"
  | "int[]"
  | "string[]"
  | "int[][]"
  /**
   * A singly linked list. Sent over the wire exactly like `int[]` - one line
   * of space-separated values - but materialised into real nodes before the
   * entry point is called, and serialised back afterwards.
   *
   * The alternative was to hand learners an array and call it a linked list,
   * which would teach the wrong thing: pointer reassignment is the entire
   * point of these problems. The node type is declared by the harness ahead
   * of the learner's code, so the starter stub can reference it.
   */
  | "list";
export type ReturnType =
  | "int"
  | "double"
  | "bool"
  | "string"
  | "int[]"
  | "string[]"
  | "list";

export type Signature = {
  params: ParamType[];
  paramNames: string[];
  returns: ReturnType;
  /** Entry point name. Shared across languages so the harness can call it. */
  functionName: string;
  /**
   * Force the ListNode declaration into the harness even though no parameter
   * or return value is a list.
   *
   * Needed by problems that take a plain description of a chain - values plus
   * a loop index, say - and expect the learner to build the nodes themselves.
   * Without this the class would simply not exist and their code would not
   * compile, which is a confusing failure for something they did not write.
   */
  needsListNode?: boolean;
};

/** Languages the execution pipeline can currently build and run. */
export const SUPPORTED_LANGUAGES: Language[] = [
  "PYTHON",
  "JAVASCRIPT",
  "JAVA",
  "CPP",
];

export const LANGUAGE_LABEL: Record<Language, string> = {
  PYTHON: "Python",
  JAVASCRIPT: "JavaScript",
  TYPESCRIPT: "TypeScript",
  JAVA: "Java",
  CPP: "C++",
  GO: "Go",
};

/** Monaco's language id, which does not always match our enum. */
export const MONACO_LANGUAGE: Record<Language, string> = {
  PYTHON: "python",
  JAVASCRIPT: "javascript",
  TYPESCRIPT: "typescript",
  JAVA: "java",
  CPP: "cpp",
  GO: "go",
};

// ---------------------------------------------------------------------------
// Type rendering
// ---------------------------------------------------------------------------

const PY_TYPE: Record<ParamType | ReturnType, string> = {
  int: "int",
  double: "float",
  bool: "bool",
  string: "str",
  "int[]": "List[int]",
  "string[]": "List[str]",
  "int[][]": "List[List[int]]",
  list: "Optional[ListNode]",
};

const JAVA_TYPE: Record<ParamType | ReturnType, string> = {
  int: "int",
  double: "double",
  bool: "boolean",
  string: "String",
  "int[]": "int[]",
  "string[]": "String[]",
  "int[][]": "int[][]",
  list: "ListNode",
};

const CPP_TYPE: Record<ParamType | ReturnType, string> = {
  int: "int",
  double: "double",
  bool: "bool",
  string: "string",
  "int[]": "vector<int>",
  "string[]": "vector<string>",
  "int[][]": "vector<vector<int>>",
  list: "ListNode*",
};

// ---------------------------------------------------------------------------
// Starter code
// ---------------------------------------------------------------------------

/** The stub a learner starts from. Compiles and runs; returns a placeholder. */
export function buildStarter(language: Language, signature: Signature): string {
  const { params, paramNames, returns, functionName } = signature;

  switch (language) {
    case "PYTHON": {
      const args = paramNames
        .map((name, i) => `${name}: ${PY_TYPE[params[i]!]}`)
        .join(", ");
      return [
        "from typing import List",
        "",
        "",
        `def ${functionName}(${args}) -> ${PY_TYPE[returns]}:`,
        "    # Write your solution here.",
        `    ${pyPlaceholder(returns)}`,
        "",
      ].join("\n");
    }

    case "JAVASCRIPT": {
      const jsdoc = paramNames
        .map((name, i) => ` * @param {${jsDocType(params[i]!)}} ${name}`)
        .join("\n");
      return [
        "/**",
        jsdoc,
        ` * @returns {${jsDocType(returns)}}`,
        " */",
        `function ${functionName}(${paramNames.join(", ")}) {`,
        "  // Write your solution here.",
        `  ${jsPlaceholder(returns)}`,
        "}",
        "",
      ].join("\n");
    }

    case "JAVA": {
      const args = paramNames
        .map((name, i) => `${JAVA_TYPE[params[i]!]} ${name}`)
        .join(", ");
      return [
        "class Solution {",
        `    public ${JAVA_TYPE[returns]} ${functionName}(${args}) {`,
        "        // Write your solution here.",
        `        ${javaPlaceholder(returns)}`,
        "    }",
        "}",
        "",
      ].join("\n");
    }

    case "CPP": {
      const args = paramNames
        .map((name, i) => `${cppParam(params[i]!)} ${name}`)
        .join(", ");
      return [
        "class Solution {",
        "public:",
        `    ${CPP_TYPE[returns]} ${functionName}(${args}) {`,
        "        // Write your solution here.",
        `        ${cppPlaceholder(returns)}`,
        "    }",
        "};",
        "",
      ].join("\n");
    }

    default:
      throw new Error(`No starter template for ${language}.`);
  }
}

/** Pass containers by const reference in C++; copying a vector per call is waste. */
function cppParam(type: ParamType): string {
  // Scalars and pointers by value; containers by const reference, because
  // copying a vector on every call is pure waste.
  if (type === "int" || type === "list") return CPP_TYPE[type];
  return `const ${CPP_TYPE[type]}&`;
}

function jsDocType(type: ParamType | ReturnType): string {
  switch (type) {
    case "int":
    case "double":
      return "number";
    case "bool":
      return "boolean";
    case "string":
      return "string";
    case "int[]":
      return "number[]";
    case "string[]":
      return "string[]";
    case "int[][]":
      return "number[][]";
    case "list":
      return "ListNode|null";
  }
}

function pyPlaceholder(type: ReturnType): string {
  const value = {
    int: "0",
    double: "0.0",
    bool: "False",
    string: '""',
    "int[]": "[]",
    "string[]": "[]",
    list: "None",
  }[type];
  return `return ${value}`;
}

function jsPlaceholder(type: ReturnType): string {
  const value = {
    int: "0",
    double: "0",
    bool: "false",
    string: '""',
    "int[]": "[]",
    "string[]": "[]",
    list: "null",
  }[type];
  return `return ${value};`;
}

function javaPlaceholder(type: ReturnType): string {
  const value = {
    int: "0",
    double: "0.0",
    bool: "false",
    string: '""',
    "int[]": "new int[0]",
    "string[]": "new String[0]",
    list: "null",
  }[type];
  return `return ${value};`;
}

function cppPlaceholder(type: ReturnType): string {
  const value = {
    int: "0",
    double: "0.0",
    bool: "false",
    string: '""',
    "int[]": "{}",
    "string[]": "{}",
    list: "nullptr",
  }[type];
  return `return ${value};`;
}

// ---------------------------------------------------------------------------
// Harness
// ---------------------------------------------------------------------------

/** Where the learner's code is spliced into a harness template. */
export const USER_CODE_MARKER = "%%USER_CODE%%";

/**
 * Builds the full program: readers, the learner's code, and a main that
 * parses stdin, calls the entry point once, and prints the result.
 *
 * The learner never sees this. It is regenerated from the signature on every
 * run rather than stored, so fixing a reader bug fixes every problem at once
 * instead of requiring 200 rows to be migrated.
 */
export function buildHarness(language: Language, signature: Signature): string {
  switch (language) {
    case "PYTHON":
      return pythonHarness(signature);
    case "JAVASCRIPT":
      return javascriptHarness(signature);
    case "JAVA":
      return javaHarness(signature);
    case "CPP":
      return cppHarness(signature);
    default:
      throw new Error(`No harness template for ${language}.`);
  }
}

function pythonHarness(signature: Signature): string {
  const { params, paramNames, returns, functionName } = signature;

  const reads = paramNames
    .map((name, i) => `    ${name} = ${PY_READER[params[i]!]}()`)
    .join("\n");

  const listSupport = usesList(signature) ? `${LIST_SUPPORT.PYTHON}\n\n` : "";

  return `import sys
from typing import List, Optional

_data = sys.stdin.read().split("\\n")
_cursor = 0


def _next_line() -> str:
    global _cursor
    line = _data[_cursor] if _cursor < len(_data) else ""
    _cursor += 1
    return line


def _read_int() -> int:
    return int(_next_line().strip())


def _read_string() -> str:
    return _next_line()


def _read_int_array() -> List[int]:
    raw = _next_line().strip()
    return [int(x) for x in raw.split()] if raw else []


def _read_string_array() -> List[str]:
    n = int(_next_line().strip())
    return [_next_line() for _ in range(n)]


def _read_int_matrix() -> List[List[int]]:
    n = int(_next_line().strip())
    rows = []
    for _ in range(n):
        raw = _next_line().strip()
        rows.append([int(x) for x in raw.split()] if raw else [])
    return rows


${listSupport}${USER_CODE_MARKER}


def _main() -> None:
${reads || "    pass"}
    _result = ${functionName}(${paramNames.join(", ")})
${PY_WRITER[returns]}


_main()
`;
}

const PY_READER: Record<ParamType, string> = {
  int: "_read_int",
  string: "_read_string",
  "int[]": "_read_int_array",
  "string[]": "_read_string_array",
  "int[][]": "_read_int_matrix",
  list: "_read_list",
};

const PY_WRITER: Record<ReturnType, string> = {
  int: "    sys.stdout.write(str(_result) + \"\\n\")",
  double: '    sys.stdout.write("%.6f\\n" % _result)',
  bool: '    sys.stdout.write(("true" if _result else "false") + "\\n")',
  string: '    sys.stdout.write(str(_result) + "\\n")',
  "int[]": '    sys.stdout.write(" ".join(str(x) for x in _result) + "\\n")',
  "string[]":
    '    sys.stdout.write(str(len(_result)) + "\\n")\n    for _item in _result:\n        sys.stdout.write(str(_item) + "\\n")',
  list: "    sys.stdout.write(_list_to_line(_result) + \"\\n\")",
};

function javascriptHarness(signature: Signature): string {
  const { params, paramNames, returns, functionName } = signature;

  const reads = paramNames
    .map((name, i) => `  const ${name} = ${JS_READER[params[i]!]}();`)
    .join("\n");

  const listSupport = usesList(signature) ? `${LIST_SUPPORT.JAVASCRIPT}\n\n` : "";

  return `"use strict";

const _data = require("fs").readFileSync(0, "utf8").split("\\n");
let _cursor = 0;

function _nextLine() {
  const line = _cursor < _data.length ? _data[_cursor] : "";
  _cursor += 1;
  return line;
}

function _readInt() {
  return parseInt(_nextLine().trim(), 10);
}

function _readString() {
  return _nextLine();
}

function _readIntArray() {
  const raw = _nextLine().trim();
  return raw ? raw.split(/\\s+/).map(Number) : [];
}

function _readStringArray() {
  const n = parseInt(_nextLine().trim(), 10);
  const out = [];
  for (let i = 0; i < n; i += 1) out.push(_nextLine());
  return out;
}

function _readIntMatrix() {
  const n = parseInt(_nextLine().trim(), 10);
  const out = [];
  for (let i = 0; i < n; i += 1) {
    const raw = _nextLine().trim();
    out.push(raw ? raw.split(/\\s+/).map(Number) : []);
  }
  return out;
}

${listSupport}${USER_CODE_MARKER}

function _main() {
${reads}
  const _result = ${functionName}(${paramNames.join(", ")});
${JS_WRITER[returns]}
}

_main();
`;
}

const JS_READER: Record<ParamType, string> = {
  int: "_readInt",
  string: "_readString",
  "int[]": "_readIntArray",
  "string[]": "_readStringArray",
  "int[][]": "_readIntMatrix",
  list: "_readList",
};

const JS_WRITER: Record<ReturnType, string> = {
  int: '  process.stdout.write(String(_result) + "\\n");',
  double: '  process.stdout.write(Number(_result).toFixed(6) + "\\n");',
  bool: '  process.stdout.write((_result ? "true" : "false") + "\\n");',
  string: '  process.stdout.write(String(_result) + "\\n");',
  "int[]":
    '  process.stdout.write(Array.from(_result).join(" ") + "\\n");',
  "string[]":
    '  process.stdout.write(String(_result.length) + "\\n");\n  for (const _item of _result) process.stdout.write(String(_item) + "\\n");',
  list: '  process.stdout.write(_listToLine(_result) + "\\n");',
};

function javaHarness(signature: Signature): string {
  const { params, paramNames, returns, functionName } = signature;

  const reads = paramNames
    .map(
      (name, i) =>
        `        ${JAVA_TYPE[params[i]!]} ${name} = ${JAVA_READER[params[i]!]}();`
    )
    .join("\n");

  const listSupport = usesList(signature) ? `${LIST_SUPPORT.JAVA}\n\n` : "";
  const listMethods = usesList(signature) ? JAVA_LIST_METHODS : "";

  return `import java.io.*;
import java.util.*;

${listSupport}${USER_CODE_MARKER}

public class Main {
    private static BufferedReader _in =
        new BufferedReader(new InputStreamReader(System.in));

    private static String nextLine() throws IOException {
        String line = _in.readLine();
        return line == null ? "" : line;
    }

    private static int readInt() throws IOException {
        return Integer.parseInt(nextLine().trim());
    }

    private static String readString() throws IOException {
        return nextLine();
    }

    private static int[] readIntArray() throws IOException {
        String raw = nextLine().trim();
        if (raw.isEmpty()) return new int[0];
        String[] parts = raw.split("\\\\s+");
        int[] out = new int[parts.length];
        for (int i = 0; i < parts.length; i++) out[i] = Integer.parseInt(parts[i]);
        return out;
    }

    private static String[] readStringArray() throws IOException {
        int n = Integer.parseInt(nextLine().trim());
        String[] out = new String[n];
        for (int i = 0; i < n; i++) out[i] = nextLine();
        return out;
    }

    private static int[][] readIntMatrix() throws IOException {
        int n = Integer.parseInt(nextLine().trim());
        int[][] out = new int[n][];
        for (int i = 0; i < n; i++) out[i] = readIntArray();
        return out;
    }
${listMethods}
    public static void main(String[] args) throws IOException {
        StringBuilder _sb = new StringBuilder();
${reads}
        ${JAVA_TYPE[returns]} _result = new Solution().${functionName}(${paramNames.join(", ")});
${JAVA_WRITER[returns]}
        System.out.print(_sb);
    }
}
`;
}

const JAVA_READER: Record<ParamType, string> = {
  int: "readInt",
  string: "readString",
  "int[]": "readIntArray",
  "string[]": "readStringArray",
  "int[][]": "readIntMatrix",
  list: "readList",
};

const JAVA_WRITER: Record<ReturnType, string> = {
  int: '        _sb.append(_result).append("\\n");',
  double: '        _sb.append(String.format("%.6f", _result)).append("\\n");',
  bool: '        _sb.append(_result ? "true" : "false").append("\\n");',
  string: '        _sb.append(_result).append("\\n");',
  "int[]":
    '        for (int i = 0; i < _result.length; i++) {\n' +
    '            if (i > 0) _sb.append(" ");\n' +
    "            _sb.append(_result[i]);\n" +
    "        }\n" +
    '        _sb.append("\\n");',
  "string[]":
    '        _sb.append(_result.length).append("\\n");\n' +
    '        for (String _item : _result) _sb.append(_item).append("\\n");',
  list: '        _sb.append(listToLine(_result)).append("\\n");',
};

function cppHarness(signature: Signature): string {
  const { params, paramNames, returns, functionName } = signature;

  const reads = paramNames
    .map(
      (name, i) =>
        `    ${CPP_TYPE[params[i]!]} ${name} = ${CPP_READER[params[i]!]}();`
    )
    .join("\n");

  const listSupport = usesList(signature) ? `${LIST_SUPPORT.CPP}\n\n` : "";

  return `#include <algorithm>
#include <climits>
#include <cmath>
#include <cstdio>
#include <deque>
#include <iostream>
#include <map>
#include <numeric>
#include <queue>
#include <set>
#include <sstream>
#include <stack>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <vector>

using namespace std;

static string _nextLine() {
    string line;
    if (!getline(cin, line)) return string();
    if (!line.empty() && line.back() == '\\r') line.pop_back();
    return line;
}

static int _readInt() {
    return stoi(_nextLine());
}

static string _readString() {
    return _nextLine();
}

static vector<int> _readIntArray() {
    istringstream iss(_nextLine());
    vector<int> out;
    int value;
    while (iss >> value) out.push_back(value);
    return out;
}

static vector<string> _readStringArray() {
    int n = stoi(_nextLine());
    vector<string> out;
    out.reserve(n);
    for (int i = 0; i < n; i++) out.push_back(_nextLine());
    return out;
}

static vector<vector<int>> _readIntMatrix() {
    int n = stoi(_nextLine());
    vector<vector<int>> out;
    out.reserve(n);
    for (int i = 0; i < n; i++) out.push_back(_readIntArray());
    return out;
}

${listSupport}${USER_CODE_MARKER}

int main() {
    ios::sync_with_stdio(false);
${reads}
    Solution _solution;
    ${CPP_TYPE[returns]} _result = _solution.${functionName}(${paramNames.join(", ")});
${CPP_WRITER[returns]}
    return 0;
}
`;
}

const CPP_READER: Record<ParamType, string> = {
  int: "_readInt",
  string: "_readString",
  "int[]": "_readIntArray",
  "string[]": "_readStringArray",
  "int[][]": "_readIntMatrix",
  list: "_readList",
};

const CPP_WRITER: Record<ReturnType, string> = {
  int: '    cout << _result << "\\n";',
  double: '    printf("%.6f\\n", (double)_result);',
  bool: '    cout << (_result ? "true" : "false") << "\\n";',
  string: '    cout << _result << "\\n";',
  "int[]":
    "    for (size_t i = 0; i < _result.size(); i++) {\n" +
    '        if (i) cout << " ";\n' +
    "        cout << _result[i];\n" +
    "    }\n" +
    '    cout << "\\n";',
  "string[]":
    '    cout << _result.size() << "\\n";\n' +
    '    for (const auto& _item : _result) cout << _item << "\\n";',
  list: '    cout << _listToLine(_result) << "\\n";',
};

/** True when the signature touches a linked list in either direction. */
function usesList(signature: Signature): boolean {
  return (
    signature.params.includes("list") ||
    signature.returns === "list" ||
    signature.needsListNode === true
  );
}

/**
 * Node declarations and list serialisation, prepended to a harness only when
 * the signature needs them. Kept out of every other program so a compile
 * error in an unrelated problem can never point at code the learner did not
 * write.
 */
const LIST_SUPPORT: Record<string, string> = {
  PYTHON: `class ListNode:
    def __init__(self, val: int = 0, next: "Optional[ListNode]" = None):
        self.val = val
        self.next = next


def _read_list() -> "Optional[ListNode]":
    raw = _next_line().strip()
    if not raw:
        return None
    head = tail = None
    for part in raw.split():
        node = ListNode(int(part))
        if head is None:
            head = tail = node
        else:
            tail.next = node
            tail = node
    return head


def _list_to_line(node: "Optional[ListNode]") -> str:
    parts = []
    # A cycle would hang the serialiser, so bound the walk generously.
    guard = 0
    while node is not None and guard < 1000000:
        parts.append(str(node.val))
        node = node.next
        guard += 1
    return " ".join(parts)`,

  JAVASCRIPT: `function ListNode(val, next) {
  this.val = val === undefined ? 0 : val;
  this.next = next === undefined ? null : next;
}

function _readList() {
  const raw = _nextLine().trim();
  if (!raw) return null;
  let head = null;
  let tail = null;
  for (const part of raw.split(/\\s+/)) {
    const node = new ListNode(Number(part));
    if (head === null) {
      head = node;
      tail = node;
    } else {
      tail.next = node;
      tail = node;
    }
  }
  return head;
}

function _listToLine(node) {
  const parts = [];
  let guard = 0;
  while (node !== null && node !== undefined && guard < 1000000) {
    parts.push(String(node.val));
    node = node.next;
    guard += 1;
  }
  return parts.join(" ");
}`,

  JAVA: `class ListNode {
    int val;
    ListNode next;
    ListNode() {}
    ListNode(int val) { this.val = val; }
    ListNode(int val, ListNode next) { this.val = val; this.next = next; }
}`,

  CPP: `struct ListNode {
    int val;
    ListNode* next;
    ListNode() : val(0), next(nullptr) {}
    ListNode(int x) : val(x), next(nullptr) {}
    ListNode(int x, ListNode* n) : val(x), next(n) {}
};

static ListNode* _readList() {
    string raw = _nextLine();
    istringstream iss(raw);
    ListNode* head = nullptr;
    ListNode* tail = nullptr;
    int value;
    while (iss >> value) {
        ListNode* node = new ListNode(value);
        if (!head) { head = node; tail = node; }
        else { tail->next = node; tail = node; }
    }
    return head;
}

static string _listToLine(ListNode* node) {
    ostringstream oss;
    bool first = true;
    long guard = 0;
    while (node && guard < 1000000) {
        if (!first) oss << " ";
        oss << node->val;
        first = false;
        node = node->next;
        guard++;
    }
    return oss.str();
}`,
};

/** Java needs its readers inside the Main class, unlike the other three. */
const JAVA_LIST_METHODS = `
    private static ListNode readList() throws IOException {
        String raw = nextLine().trim();
        if (raw.isEmpty()) return null;
        String[] parts = raw.split("\\\\s+");
        ListNode head = null, tail = null;
        for (String part : parts) {
            ListNode node = new ListNode(Integer.parseInt(part));
            if (head == null) { head = node; tail = node; }
            else { tail.next = node; tail = node; }
        }
        return head;
    }

    private static String listToLine(ListNode node) {
        StringBuilder sb = new StringBuilder();
        long guard = 0;
        while (node != null && guard < 1000000) {
            if (sb.length() > 0) sb.append(" ");
            sb.append(node.val);
            node = node.next;
            guard++;
        }
        return sb.toString();
    }
`;

/** Splices learner code into a harness template. */
export function spliceUserCode(harness: string, userCode: string): string {
  return harness.replace(USER_CODE_MARKER, userCode);
}

/** Starter code for every supported language, keyed for the `starterCode` column. */
export function buildAllStarters(signature: Signature): Record<string, string> {
  const out: Record<string, string> = {};
  for (const language of SUPPORTED_LANGUAGES) {
    out[language] = buildStarter(language, signature);
  }
  return out;
}
