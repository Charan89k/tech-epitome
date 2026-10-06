import { parse, type Node } from "acorn";

/**
 * Rewrites a learner's JavaScript so that running it records a trace.
 *
 * Three hooks are inserted, all implemented by the trace worker:
 *
 *   __tl(line, snap)        before every statement inside a function body
 *   __tr(line, value, snap) wrapping every `return <expr>`, passing it through
 *   __te(name) / __tx()     entering and leaving a function, for the call stack
 *
 * `snap` is a closure returning the variables in scope at that point. Only
 * names declared *earlier in source order* are included, which is what keeps
 * the closure from touching a `let` in its temporal dead zone: reading one
 * throws, and a trace that crashes code which otherwise works would be worse
 * than no trace at all.
 *
 * The rewrite is a list of text insertions at AST offsets, not a re-print of
 * the tree, so the learner's formatting survives and nothing but the hooks
 * changes. Top-level statements are not traced — the learner's code is a
 * function definition, and the interesting lines are inside it.
 */

type Edit = { pos: number; text: string; kind: "open" | "close"; seq: number };

type Scope = { names: string[]; parent: Scope | null };

export type InstrumentResult =
  { ok: true; code: string } | { ok: false; error: string; line?: number };

/** Names never worth snapshotting, and `arguments`, which a closure cannot see. */
const SKIP_NAMES = new Set(["arguments", "undefined", "NaN", "Infinity"]);

type AnyNode = Node & Record<string, unknown> & { loc: { start: { line: number } } };

export function instrumentJs(source: string): InstrumentResult {
  let program: AnyNode;
  try {
    program = parse(source, {
      ecmaVersion: "latest",
      sourceType: "script",
      locations: true,
      allowReturnOutsideFunction: false,
    }) as unknown as AnyNode;
  } catch (error) {
    const err = error as SyntaxError & { loc?: { line: number } };
    return {
      ok: false,
      error: `SyntaxError: ${err.message.replace(/\s*\(\d+:\d+\)$/, "")}`,
      line: err.loc?.line,
    };
  }

  const edits: Edit[] = [];
  let seq = 0;
  const insert = (pos: number, text: string, kind: Edit["kind"]) =>
    edits.push({ pos, text, kind, seq: seq++ });

  const visible = (scope: Scope): string[] => {
    const seen = new Set<string>();
    const ordered: string[] = [];
    // Outermost first, so parameters lead and locals follow in order.
    const chain: Scope[] = [];
    for (let s: Scope | null = scope; s; s = s.parent) chain.unshift(s);
    for (const s of chain) {
      for (const name of s.names) {
        if (seen.has(name)) {
          // An inner declaration shadows an outer one; keep its later slot.
          ordered.splice(ordered.indexOf(name), 1);
        }
        seen.add(name);
        ordered.push(name);
      }
    }
    return ordered;
  };

  const snapText = (scope: Scope): string => {
    const names = visible(scope);
    if (names.length === 0) return "null";
    return `()=>({${names.map((n) => `${JSON.stringify(n)}:${n}`).join(",")}})`;
  };

  const trace = (node: AnyNode, scope: Scope) =>
    `__tl(${node.loc.start.line},${snapText(scope)});`;

  /** A statement in a slot that is not a block gets braces, so the hook fits. */
  const wrapStatement = (stmt: AnyNode, scope: Scope, fnDepth: number) => {
    if (stmt.type === "BlockStatement") {
      if ((stmt.body as AnyNode[]).length === 0 && fnDepth > 0) {
        // An empty loop body must still count toward the execution cap, or
        // `while (true) {}` hangs the worker instead of reporting a limit.
        insert(stmt.start + 1, "__tk();", "open");
      }
      visit(stmt, scope, fnDepth);
      return;
    }
    if (fnDepth > 0) {
      insert(stmt.start, `{${trace(stmt, scope)}`, "open");
      insert(stmt.end, "}", "close");
    }
    visit(stmt, scope, fnDepth);
  };

  const declare = (scope: Scope, pattern: AnyNode | null | undefined) => {
    for (const name of patternNames(pattern)) {
      if (!SKIP_NAMES.has(name)) scope.names.push(name);
    }
  };

  const statementList = (statements: AnyNode[], scope: Scope, fnDepth: number) => {
    for (const stmt of statements) {
      const skip =
        stmt.type === "FunctionDeclaration" ||
        stmt.type === "ClassDeclaration" ||
        stmt.type === "EmptyStatement";
      if (fnDepth > 0 && !skip) insert(stmt.start, trace(stmt, scope), "open");
      visit(stmt, scope, fnDepth);
      if (stmt.type === "VariableDeclaration") {
        for (const declarator of stmt.declarations as AnyNode[]) {
          declare(scope, declarator.id as AnyNode);
        }
      }
    }
  };

  const visitFunction = (fn: AnyNode, scope: Scope, name: string, fnDepth: number) => {
    const fnScope: Scope = { names: [], parent: scope };
    for (const param of fn.params as AnyNode[]) {
      declare(fnScope, param);
      visit(param, fnScope, fnDepth + 1);
    }
    const body = fn.body as AnyNode;
    if (body.type !== "BlockStatement") {
      // Expression-bodied arrow: no statements to hook, but its expression
      // may still contain functions that do.
      visit(body, fnScope, fnDepth + 1);
      return;
    }
    insert(body.start + 1, `__te(${JSON.stringify(name)});try{`, "open");
    statementList(body.body as AnyNode[], fnScope, fnDepth + 1);
    insert(body.end - 1, "}finally{__tx()}", "close");
  };

  const visit = (
    node: AnyNode | null | undefined,
    scope: Scope,
    fnDepth: number,
    nameHint = "anonymous"
  ): void => {
    if (!node || typeof node.type !== "string") return;

    switch (node.type) {
      case "FunctionDeclaration":
      case "FunctionExpression":
      case "ArrowFunctionExpression": {
        const id = node.id as AnyNode | null;
        visitFunction(node, scope, (id?.name as string) ?? nameHint, fnDepth);
        return;
      }
      case "VariableDeclarator": {
        const id = node.id as AnyNode;
        visit(node.init as AnyNode, scope, fnDepth, (id.name as string) ?? nameHint);
        return;
      }
      case "MethodDefinition":
      case "Property": {
        const key = node.key as AnyNode;
        if (node.computed) visit(key, scope, fnDepth);
        visit(node.value as AnyNode, scope, fnDepth, (key.name as string) ?? nameHint);
        return;
      }
      case "Program":
        statementList(node.body as AnyNode[], { names: [], parent: scope }, fnDepth);
        return;
      case "BlockStatement":
        statementList(node.body as AnyNode[], { names: [], parent: scope }, fnDepth);
        return;
      case "SwitchStatement": {
        visit(node.discriminant as AnyNode, scope, fnDepth);
        const switchScope: Scope = { names: [], parent: scope };
        for (const switchCase of node.cases as AnyNode[]) {
          visit(switchCase.test as AnyNode, switchScope, fnDepth);
          statementList(switchCase.consequent as AnyNode[], switchScope, fnDepth);
        }
        return;
      }
      case "IfStatement":
        visit(node.test as AnyNode, scope, fnDepth);
        wrapStatement(node.consequent as AnyNode, scope, fnDepth);
        if (node.alternate) wrapStatement(node.alternate as AnyNode, scope, fnDepth);
        return;
      case "WhileStatement":
      case "DoWhileStatement":
        visit(node.test as AnyNode, scope, fnDepth);
        wrapStatement(node.body as AnyNode, scope, fnDepth);
        return;
      case "ForStatement": {
        const loopScope: Scope = { names: [], parent: scope };
        const init = node.init as AnyNode | null;
        visit(init, loopScope, fnDepth);
        if (init?.type === "VariableDeclaration") {
          for (const d of init.declarations as AnyNode[])
            declare(loopScope, d.id as AnyNode);
        }
        visit(node.test as AnyNode, loopScope, fnDepth);
        visit(node.update as AnyNode, loopScope, fnDepth);
        wrapStatement(node.body as AnyNode, loopScope, fnDepth);
        return;
      }
      case "ForInStatement":
      case "ForOfStatement": {
        const loopScope: Scope = { names: [], parent: scope };
        const left = node.left as AnyNode;
        visit(node.right as AnyNode, scope, fnDepth);
        if (left.type === "VariableDeclaration") {
          for (const d of left.declarations as AnyNode[])
            declare(loopScope, d.id as AnyNode);
        } else {
          visit(left, scope, fnDepth);
        }
        wrapStatement(node.body as AnyNode, loopScope, fnDepth);
        return;
      }
      case "LabeledStatement":
        // Never wrapped: braces between a label and its loop would turn
        // `continue label` into a syntax error.
        visit(node.body as AnyNode, scope, fnDepth);
        return;
      case "CatchClause": {
        const catchScope: Scope = { names: [], parent: scope };
        declare(catchScope, node.param as AnyNode);
        visit(node.body as AnyNode, catchScope, fnDepth);
        return;
      }
      case "ReturnStatement": {
        const argument = node.argument as AnyNode | null;
        if (argument && fnDepth > 0) {
          insert(argument.start, `__tr(${node.loc.start.line},(`, "open");
          visit(argument, scope, fnDepth);
          insert(argument.end, `),${snapText(scope)})`, "close");
          return;
        }
        visit(argument, scope, fnDepth);
        return;
      }
    }

    for (const key of Object.keys(node)) {
      if (key === "type" || key === "loc" || key === "start" || key === "end") continue;
      const child = node[key];
      if (Array.isArray(child)) {
        for (const item of child) visit(item as AnyNode, scope, fnDepth);
      } else if (child && typeof child === "object" && "type" in child) {
        visit(child as AnyNode, scope, fnDepth);
      }
    }
  };

  visit(program, { names: [], parent: null }, 0);

  // At one offset, closing text goes first, innermost (latest created)
  // first; then opening text, outermost (earliest created) first. That is
  // what keeps `{return x}` producing `__tr(1,(x),…)}finally{…}` rather
  // than closing the try inside the return's parentheses.
  edits.sort((a, b) => {
    if (a.pos !== b.pos) return a.pos - b.pos;
    if (a.kind !== b.kind) return a.kind === "close" ? -1 : 1;
    return a.kind === "close" ? b.seq - a.seq : a.seq - b.seq;
  });

  let out = "";
  let cursor = 0;
  for (const edit of edits) {
    out += source.slice(cursor, edit.pos) + edit.text;
    cursor = edit.pos;
  }
  out += source.slice(cursor);
  return { ok: true, code: out };
}

function patternNames(pattern: AnyNode | null | undefined): string[] {
  if (!pattern) return [];
  switch (pattern.type) {
    case "Identifier":
      return [pattern.name as string];
    case "AssignmentPattern":
      return patternNames(pattern.left as AnyNode);
    case "RestElement":
      return patternNames(pattern.argument as AnyNode);
    case "ArrayPattern":
      return (pattern.elements as (AnyNode | null)[]).flatMap((e) => patternNames(e));
    case "ObjectPattern":
      return (pattern.properties as AnyNode[]).flatMap((p) =>
        p.type === "RestElement" ? patternNames(p) : patternNames(p.value as AnyNode)
      );
    default:
      return [];
  }
}
