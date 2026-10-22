// A tiny, safe Python-subset interpreter for the Automaton Garden.
//
// Pipeline: tokenize (indentation aware) -> parse (recursive descent AST) -> evaluate
// (tree-walking, implemented as generators so execution is live and step-able).
//
// The evaluator never uses eval / new Function. Every farming action (move, plant, ...)
// is `yield`ed to the host as `{ action, line }`; the host applies it to the simulation and
// resumes the generator (optionally sending a return value back, e.g. harvest() -> True).
// Queries (can_harvest(), get_x(), ...) are answered synchronously through `GardenHost.query`.

import type { Dir } from './types';

// ---------------------------------------------------------------------------
// Errors & limits
// ---------------------------------------------------------------------------

export class GardenError extends Error {
  /** 1-based source line the error refers to. */
  line: number;
  constructor(message: string, line: number) {
    super(message);
    this.name = 'GardenError';
    this.line = line;
    Object.setPrototypeOf(this, GardenError.prototype);
  }
}

export const MAX_ACTIONS = 400;
export const MAX_STEPS_BETWEEN_ACTIONS = 20000;
export const MAX_RECURSION_DEPTH = 100;

// ---------------------------------------------------------------------------
// Public host / action types
// ---------------------------------------------------------------------------

export type GardenAction =
  | { type: 'move'; dir?: Dir }
  | { type: 'turn'; turn: 'left' | 'right' }
  | { type: 'plant'; crop: string }
  | { type: 'water' }
  | { type: 'harvest' }
  | { type: 'wait' };

export interface ActionRequest {
  action: GardenAction;
  /** 1-based line of the statement that requested the action. */
  line: number;
}

export type QueryName =
  | 'can_harvest'
  | 'is_empty'
  | 'is_watered'
  | 'get_x'
  | 'get_y'
  | 'get_crop'
  | 'get_growth'
  | 'get_coins'
  | 'get_tick';

export interface GardenHost {
  query(name: QueryName): Value;
  print(text: string, line: number): void;
}

export interface RunOutcome {
  status: 'finished' | 'out_of_energy';
  actions: number;
}

export interface RunOptions {
  maxActions?: number;
  maxStepsBetweenActions?: number;
  maxRecursionDepth?: number;
}

// ---------------------------------------------------------------------------
// Values
// ---------------------------------------------------------------------------

interface PyFunc {
  kind: 'func';
  name: string;
  params: string[];
  body: Stmt[];
}

interface PyRange {
  kind: 'range';
  start: number;
  stop: number;
  step: number;
}

interface PyBuiltin {
  kind: 'builtin';
  name: string;
  /** Pure builtin / free query. */
  fn?: (args: Value[], line: number) => Value;
  /** Farming action: validate args and build the action to yield. */
  action?: (args: Value[], line: number) => GardenAction;
}

export type Value = number | string | boolean | null | PyFunc | PyRange | PyBuiltin;

// ---------------------------------------------------------------------------
// Tokenizer
// ---------------------------------------------------------------------------

type TokType = 'num' | 'str' | 'name' | 'kw' | 'op' | 'newline' | 'indent' | 'dedent' | 'eof';

interface Tok {
  type: TokType;
  value: string;
  num?: number;
  line: number;
}

const KEYWORDS = new Set([
  'if', 'elif', 'else', 'while', 'for', 'in', 'def', 'return', 'break', 'continue', 'pass',
  'and', 'or', 'not', 'True', 'False', 'None', 'global', 'is',
]);

const UNSUPPORTED_KEYWORDS = new Set([
  'class', 'import', 'from', 'with', 'try', 'except', 'finally', 'lambda', 'yield', 'del',
  'assert', 'raise', 'as', 'nonlocal', 'async', 'await',
]);

const OPERATORS = [
  '//=', '**=', '==', '!=', '<=', '>=', '//', '**', '+=', '-=', '*=', '/=', '%=', '->',
  '+', '-', '*', '/', '%', '<', '>', '=', '(', ')', '[', ']', ',', ':', '.',
];

const TAB_WIDTH = 4;

export function tokenize(source: string): Tok[] {
  const toks: Tok[] = [];
  const lines = source.replace(/\r\n?/g, '\n').split('\n');
  const indentStack = [0];
  const parenStack: { ch: string; line: number }[] = [];
  let lastLine = 1;

  for (let i = 0; i < lines.length; i++) {
    const text = lines[i];
    const lineNo = i + 1;
    let pos = 0;

    if (parenStack.length === 0) {
      // Measure indentation (tabs count as TAB_WIDTH columns).
      let width = 0;
      while (pos < text.length && (text[pos] === ' ' || text[pos] === '\t')) {
        width = text[pos] === '\t' ? width + TAB_WIDTH - (width % TAB_WIDTH) : width + 1;
        pos++;
      }
      if (pos >= text.length || text[pos] === '#') continue; // blank or comment-only line
      const top = indentStack[indentStack.length - 1];
      if (width > top) {
        indentStack.push(width);
        toks.push({ type: 'indent', value: '', line: lineNo });
      } else if (width < top) {
        while (indentStack.length > 1 && width < indentStack[indentStack.length - 1]) {
          indentStack.pop();
          toks.push({ type: 'dedent', value: '', line: lineNo });
        }
        if (width !== indentStack[indentStack.length - 1]) {
          throw new GardenError('IndentationError: unindent does not match any outer indentation level', lineNo);
        }
      }
    }

    let emitted = false;
    while (pos < text.length) {
      const ch = text[pos];
      if (ch === ' ' || ch === '\t') {
        pos++;
        continue;
      }
      if (ch === '#') break;

      // Numbers
      if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(text[pos + 1] ?? ''))) {
        const m = /^(\d+\.?\d*(?:[eE][+-]?\d+)?|\.\d+(?:[eE][+-]?\d+)?)/.exec(text.slice(pos));
        const raw = m ? m[0] : ch;
        if (/[A-Za-z_]/.test(text[pos + raw.length] ?? '')) {
          throw new GardenError(`SyntaxError: invalid number '${raw}${text[pos + raw.length]}'`, lineNo);
        }
        toks.push({ type: 'num', value: raw, num: parseFloat(raw), line: lineNo });
        pos += raw.length;
        emitted = true;
        continue;
      }

      // Strings
      if (ch === '"' || ch === "'") {
        const quote = ch;
        let j = pos + 1;
        let out = '';
        let closed = false;
        while (j < text.length) {
          const c = text[j];
          if (c === '\\' && j + 1 < text.length) {
            const n = text[j + 1];
            out += n === 'n' ? '\n' : n === 't' ? '\t' : n;
            j += 2;
            continue;
          }
          if (c === quote) {
            closed = true;
            j++;
            break;
          }
          out += c;
          j++;
        }
        if (!closed) throw new GardenError('SyntaxError: unterminated string literal', lineNo);
        toks.push({ type: 'str', value: out, line: lineNo });
        pos = j;
        emitted = true;
        continue;
      }

      // Names / keywords
      if (/[A-Za-z_]/.test(ch)) {
        const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(text.slice(pos))!;
        const word = m[0];
        if (UNSUPPORTED_KEYWORDS.has(word)) {
          throw new GardenError(`SyntaxError: '${word}' is not supported by the garden drone`, lineNo);
        }
        toks.push({ type: KEYWORDS.has(word) ? 'kw' : 'name', value: word, line: lineNo });
        pos += word.length;
        emitted = true;
        continue;
      }

      // Operators
      const op = OPERATORS.find((o) => text.startsWith(o, pos));
      if (op) {
        if (op === '(' || op === '[') parenStack.push({ ch: op, line: lineNo });
        if (op === ')' || op === ']') {
          const open = parenStack.pop();
          if (!open || (open.ch === '(') !== (op === ')')) {
            throw new GardenError(`SyntaxError: unmatched '${op}'`, lineNo);
          }
        }
        toks.push({ type: 'op', value: op, line: lineNo });
        pos += op.length;
        emitted = true;
        continue;
      }

      throw new GardenError(`SyntaxError: invalid character '${ch}'`, lineNo);
    }

    if (emitted) lastLine = lineNo;
    if (parenStack.length === 0 && emitted) {
      toks.push({ type: 'newline', value: '', line: lineNo });
    }
  }

  if (parenStack.length) {
    const open = parenStack[parenStack.length - 1];
    throw new GardenError(`SyntaxError: '${open.ch}' was never closed`, open.line);
  }
  while (indentStack.length > 1) {
    indentStack.pop();
    toks.push({ type: 'dedent', value: '', line: lastLine });
  }
  toks.push({ type: 'eof', value: '', line: lastLine });
  return toks;
}

// ---------------------------------------------------------------------------
// AST
// ---------------------------------------------------------------------------

type Expr =
  | { t: 'num'; v: number; line: number }
  | { t: 'str'; v: string; line: number }
  | { t: 'const'; v: boolean | null; line: number }
  | { t: 'name'; name: string; line: number }
  | { t: 'unary'; op: '-' | '+' | 'not'; e: Expr; line: number }
  | { t: 'bin'; op: string; l: Expr; r: Expr; line: number }
  | { t: 'bool'; op: 'and' | 'or'; l: Expr; r: Expr; line: number }
  | { t: 'cmp'; ops: string[]; items: Expr[]; line: number }
  | { t: 'ternary'; cond: Expr; a: Expr; b: Expr; line: number }
  | { t: 'call'; callee: Expr; args: Expr[]; line: number };

type Stmt =
  | { t: 'expr'; e: Expr; line: number }
  | { t: 'assign'; name: string; op: string; e: Expr; line: number }
  | { t: 'if'; branches: { cond: Expr; body: Stmt[] }[]; orelse: Stmt[] | null; line: number }
  | { t: 'while'; cond: Expr; body: Stmt[]; line: number }
  | { t: 'for'; name: string; iter: Expr; body: Stmt[]; line: number }
  | { t: 'def'; name: string; params: string[]; body: Stmt[]; line: number }
  | { t: 'return'; e: Expr | null; line: number }
  | { t: 'global'; names: string[]; line: number }
  | { t: 'break'; line: number }
  | { t: 'continue'; line: number }
  | { t: 'pass'; line: number };

export interface Program {
  body: Stmt[];
  /** True when the program defines at least one function with `def`. */
  hasDef: boolean;
}

// ---------------------------------------------------------------------------
// Parser
// ---------------------------------------------------------------------------

const describeTok = (t: Tok): string => {
  if (t.type === 'newline') return 'end of line';
  if (t.type === 'eof') return 'end of program';
  if (t.type === 'indent') return 'indent';
  if (t.type === 'dedent') return 'dedent';
  if (t.type === 'str') return `"${t.value}"`;
  return `'${t.value}'`;
};

class Parser {
  private i = 0;
  private loopDepth = 0;
  private funcDepth = 0;
  hasDef = false;

  constructor(private toks: Tok[]) {}

  private peek(o = 0): Tok {
    return this.toks[Math.min(this.i + o, this.toks.length - 1)];
  }
  private next(): Tok {
    const t = this.toks[this.i];
    if (this.i < this.toks.length - 1) this.i++;
    return t;
  }
  private isOp(v: string, o = 0): boolean {
    const t = this.peek(o);
    return t.type === 'op' && t.value === v;
  }
  private isKw(v: string, o = 0): boolean {
    const t = this.peek(o);
    return t.type === 'kw' && t.value === v;
  }
  private expectOp(v: string, what?: string): Tok {
    const t = this.peek();
    if (t.type === 'op' && t.value === v) return this.next();
    throw new GardenError(`SyntaxError: expected '${v}'${what ? ` ${what}` : ''}`, t.line);
  }
  private expectName(what: string): string {
    const t = this.peek();
    if (t.type === 'name') return this.next().value;
    throw new GardenError(`SyntaxError: expected ${what} but found ${describeTok(t)}`, t.line);
  }

  parseProgram(): Program {
    const body: Stmt[] = [];
    while (this.peek().type !== 'eof') {
      body.push(...this.parseStatement());
    }
    return { body, hasDef: this.hasDef };
  }

  private parseStatement(): Stmt[] {
    const t = this.peek();
    if (t.type === 'indent') throw new GardenError('IndentationError: unexpected indent', t.line);
    if (t.type === 'dedent') {
      this.next();
      return [];
    }
    if (t.type === 'kw') {
      switch (t.value) {
        case 'if':
          return [this.parseIf()];
        case 'while':
          return [this.parseWhile()];
        case 'for':
          return [this.parseFor()];
        case 'def':
          return [this.parseDef()];
        case 'elif':
        case 'else':
          throw new GardenError(`SyntaxError: '${t.value}' without a matching 'if' (check indentation)`, t.line);
      }
    }
    const stmts = [this.parseSimple()];
    this.endOfStatement();
    return stmts;
  }

  private endOfStatement() {
    const t = this.peek();
    if (t.type === 'newline') {
      this.next();
      return;
    }
    if (t.type === 'eof' || t.type === 'dedent') return;
    if (t.type === 'op' && t.value === ':') {
      throw new GardenError("SyntaxError: unexpected ':'", t.line);
    }
    if (t.type === 'name' || t.type === 'str' || t.type === 'num') {
      throw new GardenError(
        `SyntaxError: invalid syntax near ${describeTok(t)} (missing parentheses, comma or operator?)`,
        t.line
      );
    }
    throw new GardenError(`SyntaxError: invalid syntax near ${describeTok(t)}`, t.line);
  }

  private parseSimple(): Stmt {
    const t = this.peek();
    if (t.type === 'kw') {
      if (t.value === 'pass') {
        this.next();
        return { t: 'pass', line: t.line };
      }
      if (t.value === 'break' || t.value === 'continue') {
        this.next();
        if (this.loopDepth === 0) throw new GardenError(`SyntaxError: '${t.value}' outside loop`, t.line);
        return { t: t.value, line: t.line };
      }
      if (t.value === 'return') {
        this.next();
        if (this.funcDepth === 0) throw new GardenError("SyntaxError: 'return' outside function", t.line);
        const nt = this.peek();
        const e = nt.type === 'newline' || nt.type === 'eof' || nt.type === 'dedent' ? null : this.parseExpr();
        return { t: 'return', e, line: t.line };
      }
      if (t.value === 'global') {
        this.next();
        const names = [this.expectName('a variable name')];
        while (this.isOp(',')) {
          this.next();
          names.push(this.expectName('a variable name'));
        }
        return { t: 'global', names, line: t.line };
      }
    }

    // Assignment: NAME (= | op=) expr
    if (t.type === 'name') {
      const n1 = this.peek(1);
      if (n1.type === 'op' && ['=', '+=', '-=', '*=', '/=', '//=', '%=', '**='].includes(n1.value)) {
        this.next();
        this.next();
        const e = this.parseExpr();
        return { t: 'assign', name: t.value, op: n1.value, e, line: t.line };
      }
    }

    const e = this.parseExpr();
    if (this.isOp('=') || ['+=', '-=', '*=', '/=', '//=', '%=', '**='].some((o) => this.isOp(o))) {
      throw new GardenError('SyntaxError: cannot assign to expression (only plain variable names can be assigned)', t.line);
    }
    return { t: 'expr', e, line: t.line };
  }

  private parseBlock(header: string, headerLine: number): Stmt[] {
    this.expectOp(':', `after '${header}'`);
    if (this.peek().type !== 'newline') {
      // One-liner: `if x: harvest()`
      const s = this.parseSimple();
      this.endOfStatement();
      return [s];
    }
    this.next(); // newline
    if (this.peek().type !== 'indent') {
      throw new GardenError(
        `IndentationError: expected an indented block after '${header}' on line ${headerLine}`,
        this.peek().type === 'eof' ? headerLine : this.peek().line
      );
    }
    this.next(); // indent
    const body: Stmt[] = [];
    while (this.peek().type !== 'dedent' && this.peek().type !== 'eof') {
      body.push(...this.parseStatement());
    }
    if (this.peek().type === 'dedent') this.next();
    return body;
  }

  private parseIf(): Stmt {
    const kw = this.next();
    const branches: { cond: Expr; body: Stmt[] }[] = [];
    const cond = this.parseExpr();
    branches.push({ cond, body: this.parseBlock('if', kw.line) });
    let orelse: Stmt[] | null = null;
    for (;;) {
      if (this.isKw('elif')) {
        const e = this.next();
        const c = this.parseExpr();
        const body = this.parseBlock('elif', e.line);
        branches.push({ cond: c, body });
      } else if (this.isKw('else')) {
        const e = this.next();
        orelse = this.parseBlock('else', e.line);
        break;
      } else break;
    }
    return { t: 'if', branches, orelse, line: kw.line };
  }

  private parseWhile(): Stmt {
    const kw = this.next();
    const cond = this.parseExpr();
    this.loopDepth++;
    const body = this.parseBlock('while', kw.line);
    this.loopDepth--;
    return { t: 'while', cond, body, line: kw.line };
  }

  private parseFor(): Stmt {
    const kw = this.next();
    const name = this.expectName("a loop variable after 'for'");
    if (!this.isKw('in')) throw new GardenError("SyntaxError: expected 'in' after the loop variable", this.peek().line);
    this.next();
    const iter = this.parseExpr();
    this.loopDepth++;
    const body = this.parseBlock('for', kw.line);
    this.loopDepth--;
    return { t: 'for', name, iter, body, line: kw.line };
  }

  private parseDef(): Stmt {
    const kw = this.next();
    const name = this.expectName("a function name after 'def'");
    this.expectOp('(', `after the function name '${name}'`);
    const params: string[] = [];
    if (!this.isOp(')')) {
      params.push(this.expectName('a parameter name'));
      while (this.isOp(',')) {
        this.next();
        if (this.isOp(')')) break;
        params.push(this.expectName('a parameter name'));
      }
    }
    this.expectOp(')', 'to close the parameter list');
    if (new Set(params).size !== params.length) {
      throw new GardenError(`SyntaxError: duplicate parameter name in '${name}'`, kw.line);
    }
    const savedLoop = this.loopDepth;
    this.loopDepth = 0;
    this.funcDepth++;
    const body = this.parseBlock(`def ${name}`, kw.line);
    this.funcDepth--;
    this.loopDepth = savedLoop;
    this.hasDef = true;
    return { t: 'def', name, params, body, line: kw.line };
  }

  // ---- expressions (lowest to highest precedence) ----

  parseExpr(): Expr {
    const a = this.parseOr();
    if (this.isKw('if')) {
      const t = this.next();
      const cond = this.parseOr();
      if (!this.isKw('else')) throw new GardenError("SyntaxError: expected 'else' in conditional expression", this.peek().line);
      this.next();
      const b = this.parseExpr();
      return { t: 'ternary', cond, a, b, line: t.line };
    }
    return a;
  }

  private parseOr(): Expr {
    let l = this.parseAnd();
    while (this.isKw('or')) {
      const t = this.next();
      l = { t: 'bool', op: 'or', l, r: this.parseAnd(), line: t.line };
    }
    return l;
  }

  private parseAnd(): Expr {
    let l = this.parseNot();
    while (this.isKw('and')) {
      const t = this.next();
      l = { t: 'bool', op: 'and', l, r: this.parseNot(), line: t.line };
    }
    return l;
  }

  private parseNot(): Expr {
    if (this.isKw('not')) {
      const t = this.next();
      return { t: 'unary', op: 'not', e: this.parseNot(), line: t.line };
    }
    return this.parseComparison();
  }

  private parseComparison(): Expr {
    const first = this.parseArith();
    const ops: string[] = [];
    const items: Expr[] = [first];
    for (;;) {
      const t = this.peek();
      let op: string | null = null;
      if (t.type === 'op' && ['==', '!=', '<', '>', '<=', '>='].includes(t.value)) {
        op = t.value;
        this.next();
      } else if (t.type === 'kw' && t.value === 'in') {
        op = 'in';
        this.next();
      } else if (t.type === 'kw' && t.value === 'not' && this.isKw('in', 1)) {
        op = 'not in';
        this.next();
        this.next();
      } else if (t.type === 'kw' && t.value === 'is') {
        this.next();
        if (this.isKw('not')) {
          this.next();
          op = 'is not';
        } else op = 'is';
      } else if (t.type === 'op' && t.value === '=') {
        throw new GardenError("SyntaxError: invalid syntax. Maybe you meant '==' instead of '='?", t.line);
      }
      if (!op) break;
      ops.push(op);
      items.push(this.parseArith());
    }
    if (!ops.length) return first;
    return { t: 'cmp', ops, items, line: first.line };
  }

  private parseArith(): Expr {
    let l = this.parseTerm();
    while (this.isOp('+') || this.isOp('-')) {
      const t = this.next();
      l = { t: 'bin', op: t.value, l, r: this.parseTerm(), line: t.line };
    }
    return l;
  }

  private parseTerm(): Expr {
    let l = this.parseUnary();
    while (this.isOp('*') || this.isOp('/') || this.isOp('//') || this.isOp('%')) {
      const t = this.next();
      l = { t: 'bin', op: t.value, l, r: this.parseUnary(), line: t.line };
    }
    return l;
  }

  private parseUnary(): Expr {
    if (this.isOp('-') || this.isOp('+')) {
      const t = this.next();
      return { t: 'unary', op: t.value as '-' | '+', e: this.parseUnary(), line: t.line };
    }
    return this.parsePower();
  }

  private parsePower(): Expr {
    const base = this.parseCall();
    if (this.isOp('**')) {
      const t = this.next();
      return { t: 'bin', op: '**', l: base, r: this.parseUnary(), line: t.line };
    }
    return base;
  }

  private parseCall(): Expr {
    let e = this.parseAtom();
    for (;;) {
      if (this.isOp('(')) {
        const t = this.next();
        const args: Expr[] = [];
        if (!this.isOp(')')) {
          args.push(this.parseExpr());
          while (this.isOp(',')) {
            this.next();
            if (this.isOp(')')) break;
            args.push(this.parseExpr());
          }
        }
        if (this.isOp('=')) {
          throw new GardenError('SyntaxError: keyword arguments (name=value) are not supported', this.peek().line);
        }
        this.expectOp(')', 'to close the function call');
        e = { t: 'call', callee: e, args, line: t.line };
      } else if (this.isOp('[')) {
        throw new GardenError('SyntaxError: lists and indexing are not supported by the garden drone', this.peek().line);
      } else if (this.isOp('.')) {
        throw new GardenError("SyntaxError: attribute access ('.') is not supported by the garden drone", this.peek().line);
      } else break;
    }
    return e;
  }

  private parseAtom(): Expr {
    const t = this.peek();
    if (t.type === 'num') {
      this.next();
      return { t: 'num', v: t.num!, line: t.line };
    }
    if (t.type === 'str') {
      this.next();
      let v = t.value;
      while (this.peek().type === 'str') v += this.next().value; // implicit concatenation
      return { t: 'str', v, line: t.line };
    }
    if (t.type === 'name') {
      this.next();
      return { t: 'name', name: t.value, line: t.line };
    }
    if (t.type === 'kw') {
      if (t.value === 'True' || t.value === 'False' || t.value === 'None') {
        this.next();
        return { t: 'const', v: t.value === 'None' ? null : t.value === 'True', line: t.line };
      }
    }
    if (t.type === 'op' && t.value === '(') {
      this.next();
      const e = this.parseExpr();
      this.expectOp(')', 'to close the parenthesis');
      return e;
    }
    if (t.type === 'op' && t.value === '[') {
      throw new GardenError('SyntaxError: lists are not supported by the garden drone', t.line);
    }
    if (t.type === 'newline' || t.type === 'eof') {
      throw new GardenError('SyntaxError: incomplete expression (something is missing at the end of the line)', t.line);
    }
    throw new GardenError(`SyntaxError: invalid syntax near ${describeTok(t)}`, t.line);
  }
}

export function parse(source: string): Program {
  return new Parser(tokenize(source)).parseProgram();
}

// ---------------------------------------------------------------------------
// Runtime helpers
// ---------------------------------------------------------------------------

const isNum = (v: Value): v is number | boolean => typeof v === 'number' || typeof v === 'boolean';
const toNum = (v: number | boolean): number => (typeof v === 'boolean' ? (v ? 1 : 0) : v);

export const typeName = (v: Value): string => {
  if (v === null) return 'NoneType';
  if (typeof v === 'boolean') return 'bool';
  if (typeof v === 'number') return Number.isInteger(v) ? 'int' : 'float';
  if (typeof v === 'string') return 'str';
  if (v.kind === 'range') return 'range';
  return 'function';
};

const fmtNum = (n: number): string => {
  if (Number.isInteger(n)) return String(n);
  if (!Number.isFinite(n)) return n > 0 ? 'inf' : n < 0 ? '-inf' : 'nan';
  return String(parseFloat(n.toFixed(10)));
};

export const pyStr = (v: Value): string => {
  if (v === null) return 'None';
  if (v === true) return 'True';
  if (v === false) return 'False';
  if (typeof v === 'number') return fmtNum(v);
  if (typeof v === 'string') return v;
  if (v.kind === 'range') return v.step === 1 ? `range(${v.start}, ${v.stop})` : `range(${v.start}, ${v.stop}, ${v.step})`;
  return `<function ${v.name}>`;
};

const truthy = (v: Value): boolean => {
  if (v === null || v === false || v === 0 || v === '') return false;
  if (typeof v === 'object' && v.kind === 'range') return rangeLen(v) > 0;
  return true;
};

const rangeLen = (r: PyRange): number => {
  if (r.step > 0) return Math.max(0, Math.ceil((r.stop - r.start) / r.step));
  return Math.max(0, Math.ceil((r.start - r.stop) / -r.step));
};

const pyEq = (a: Value, b: Value): boolean => {
  if (isNum(a) && isNum(b)) return toNum(a) === toNum(b);
  return a === b;
};

const pyMod = (a: number, b: number) => a - b * Math.floor(a / b);

const requireInt = (v: Value, fn: string, line: number): number => {
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (typeof v !== 'number' || !Number.isInteger(v)) {
    throw new GardenError(`TypeError: ${fn}() expects whole numbers, got '${typeName(v)}'`, line);
  }
  return v;
};

const DIR_ALIASES: Record<string, Dir> = {
  north: 'N', n: 'N', up: 'N',
  east: 'E', e: 'E', right: 'E',
  south: 'S', s: 'S', down: 'S',
  west: 'W', w: 'W', left: 'W',
};

const argCount = (name: string, args: Value[], min: number, max: number, line: number) => {
  if (args.length < min || args.length > max) {
    const want = min === max ? `${min}` : `${min} to ${max}`;
    throw new GardenError(
      `TypeError: ${name}() takes ${want} argument${max === 1 && min === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`,
      line
    );
  }
};

const iterValues = (v: Value, line: number): Value[] | PyRange => {
  if (typeof v === 'string') return Array.from(v);
  if (v !== null && typeof v === 'object' && v.kind === 'range') return v;
  throw new GardenError(`TypeError: '${typeName(v)}' object is not iterable (try range(...))`, line);
};

// ---------------------------------------------------------------------------
// Builtins
// ---------------------------------------------------------------------------

const CROP_NAMES = ['wheat', 'carrot', 'pumpkin', 'sunflower'];

function makeBuiltins(host: GardenHost): Map<string, Value> {
  const b = new Map<string, Value>();
  const pure = (name: string, fn: (args: Value[], line: number) => Value) =>
    b.set(name, { kind: 'builtin', name, fn });
  const act = (name: string, action: (args: Value[], line: number) => GardenAction) =>
    b.set(name, { kind: 'builtin', name, action });
  const query = (name: QueryName) =>
    pure(name, (args, line) => {
      argCount(name, args, 0, 0, line);
      return host.query(name);
    });

  // --- general builtins ---
  pure('print', (args, line) => {
    host.print(args.map(pyStr).join(' '), line);
    return null;
  });
  pure('range', (args, line) => {
    argCount('range', args, 1, 3, line);
    const n = args.map((a) => requireInt(a, 'range', line));
    const [start, stop, step] = n.length === 1 ? [0, n[0], 1] : [n[0], n[1], n[2] ?? 1];
    if (step === 0) throw new GardenError('ValueError: range() step must not be zero', line);
    return { kind: 'range', start, stop, step };
  });
  pure('abs', (args, line) => {
    argCount('abs', args, 1, 1, line);
    const v = args[0];
    if (!isNum(v)) throw new GardenError(`TypeError: bad operand type for abs(): '${typeName(v)}'`, line);
    return Math.abs(toNum(v));
  });
  const minmax = (name: 'min' | 'max') =>
    pure(name, (args, line) => {
      if (args.length === 0) throw new GardenError(`TypeError: ${name}() expected at least 1 argument, got 0`, line);
      let items: Value[] = args;
      if (args.length === 1) {
        const it = iterValues(args[0], line);
        items = Array.isArray(it) ? it : Array.from({ length: rangeLen(it) }, (_, i) => it.start + i * it.step);
        if (!items.length) throw new GardenError(`ValueError: ${name}() arg is an empty sequence`, line);
      }
      let best = items[0];
      for (const v of items.slice(1)) {
        const c = compare(v, best, name === 'min' ? '<' : '>', line);
        if (c) best = v;
      }
      return best;
    });
  minmax('min');
  minmax('max');
  pure('len', (args, line) => {
    argCount('len', args, 1, 1, line);
    const v = args[0];
    if (typeof v === 'string') return v.length;
    if (v !== null && typeof v === 'object' && v.kind === 'range') return rangeLen(v);
    throw new GardenError(`TypeError: object of type '${typeName(v)}' has no len()`, line);
  });
  pure('str', (args, line) => {
    argCount('str', args, 0, 1, line);
    return args.length ? pyStr(args[0]) : '';
  });
  pure('int', (args, line) => {
    argCount('int', args, 0, 1, line);
    const v = args.length ? args[0] : 0;
    if (isNum(v)) return Math.trunc(toNum(v));
    if (typeof v === 'string' && /^\s*[+-]?\d+\s*$/.test(v)) return parseInt(v, 10);
    throw new GardenError(`ValueError: invalid literal for int(): '${pyStr(v)}'`, line);
  });
  pure('float', (args, line) => {
    argCount('float', args, 0, 1, line);
    const v = args.length ? args[0] : 0;
    if (isNum(v)) return toNum(v);
    if (typeof v === 'string' && v.trim() !== '' && !isNaN(Number(v))) return Number(v);
    throw new GardenError(`ValueError: could not convert string to float: '${pyStr(v)}'`, line);
  });
  pure('round', (args, line) => {
    argCount('round', args, 1, 2, line);
    const v = args[0];
    if (!isNum(v)) throw new GardenError(`TypeError: round() expects a number, got '${typeName(v)}'`, line);
    const digits = args.length > 1 ? requireInt(args[1], 'round', line) : 0;
    const f = Math.pow(10, digits);
    return Math.round(toNum(v) * f) / f;
  });

  // --- constants ---
  b.set('north', 'north');
  b.set('east', 'east');
  b.set('south', 'south');
  b.set('west', 'west');
  for (const c of CROP_NAMES) b.set(c, c);

  // --- farming actions ---
  act('move', (args, line) => {
    argCount('move', args, 0, 1, line);
    if (!args.length) return { type: 'move' };
    const d = args[0];
    const dir = typeof d === 'string' ? DIR_ALIASES[d.toLowerCase()] : undefined;
    if (!dir) {
      throw new GardenError(`ValueError: move() expects north, east, south or west, got '${pyStr(d)}'`, line);
    }
    return { type: 'move', dir };
  });
  act('turn_left', (args, line) => {
    argCount('turn_left', args, 0, 0, line);
    return { type: 'turn', turn: 'left' };
  });
  act('turn_right', (args, line) => {
    argCount('turn_right', args, 0, 0, line);
    return { type: 'turn', turn: 'right' };
  });
  act('plant', (args, line) => {
    argCount('plant', args, 1, 1, line);
    const c = args[0];
    if (typeof c !== 'string' || !CROP_NAMES.includes(c.toLowerCase())) {
      throw new GardenError(`ValueError: unknown crop '${pyStr(c)}'. Try "wheat", "carrot", "pumpkin" or "sunflower"`, line);
    }
    return { type: 'plant', crop: c.toLowerCase() };
  });
  act('water', (args, line) => {
    argCount('water', args, 0, 0, line);
    return { type: 'water' };
  });
  act('harvest', (args, line) => {
    argCount('harvest', args, 0, 0, line);
    return { type: 'harvest' };
  });
  act('wait', (args, line) => {
    argCount('wait', args, 0, 0, line);
    return { type: 'wait' };
  });

  // --- free queries ---
  (['can_harvest', 'is_empty', 'is_watered', 'get_x', 'get_y', 'get_crop', 'get_growth', 'get_coins', 'get_tick'] as QueryName[]).forEach(query);

  return b;
}

function compare(a: Value, b: Value, op: string, line: number): boolean {
  if (isNum(a) && isNum(b)) {
    const x = toNum(a);
    const y = toNum(b);
    return op === '<' ? x < y : op === '>' ? x > y : op === '<=' ? x <= y : x >= y;
  }
  if (typeof a === 'string' && typeof b === 'string') {
    return op === '<' ? a < b : op === '>' ? a > b : op === '<=' ? a <= b : a >= b;
  }
  throw new GardenError(
    `TypeError: '${op}' not supported between instances of '${typeName(a)}' and '${typeName(b)}'`,
    line
  );
}

// ---------------------------------------------------------------------------
// Evaluator
// ---------------------------------------------------------------------------

class OutOfEnergy {}

type Completion = undefined | { k: 'break' } | { k: 'continue' } | { k: 'return'; v: Value };

interface Frame {
  vars: Map<string, Value>;
  globalNames: Set<string>;
  isGlobal: boolean;
}

type Gen<T> = Generator<ActionRequest, T, Value | undefined>;

class Interpreter {
  private globals: Frame = { vars: new Map(), globalNames: new Set(), isGlobal: true };
  private builtins: Map<string, Value>;
  private steps = 0;
  actions = 0;
  private depth = 0;
  private maxActions: number;
  private maxSteps: number;
  private maxDepth: number;

  constructor(host: GardenHost, opts: RunOptions) {
    this.builtins = makeBuiltins(host);
    this.maxActions = opts.maxActions ?? MAX_ACTIONS;
    this.maxSteps = opts.maxStepsBetweenActions ?? MAX_STEPS_BETWEEN_ACTIONS;
    this.maxDepth = opts.maxRecursionDepth ?? MAX_RECURSION_DEPTH;
  }

  private tickStep(line: number) {
    if (++this.steps > this.maxSteps) {
      throw new GardenError(`Infinite loop? No farming action in ${this.maxSteps} steps`, line);
    }
  }

  *run(program: Program): Gen<RunOutcome> {
    try {
      yield* this.execBlock(program.body, this.globals);
    } catch (e) {
      if (e instanceof OutOfEnergy) return { status: 'out_of_energy', actions: this.actions };
      throw e;
    }
    return { status: 'finished', actions: this.actions };
  }

  private *execBlock(body: Stmt[], f: Frame): Gen<Completion> {
    for (const s of body) {
      const c = yield* this.exec(s, f);
      if (c) return c;
    }
    return undefined;
  }

  private lookup(name: string, f: Frame, line: number): Value {
    if (!f.isGlobal && f.vars.has(name)) return f.vars.get(name)!;
    if (this.globals.vars.has(name)) return this.globals.vars.get(name)!;
    if (this.builtins.has(name)) return this.builtins.get(name)!;
    throw new GardenError(`NameError: '${name}' is not defined`, line);
  }

  private *exec(s: Stmt, f: Frame): Gen<Completion> {
    this.tickStep(s.line);
    switch (s.t) {
      case 'pass':
        return undefined;
      case 'break':
        return { k: 'break' };
      case 'continue':
        return { k: 'continue' };
      case 'return':
        return { k: 'return', v: s.e ? yield* this.eval(s.e, f) : null };
      case 'global':
        if (f.isGlobal) return undefined;
        s.names.forEach((n) => f.globalNames.add(n));
        return undefined;
      case 'expr': {
        const v = yield* this.eval(s.e, f);
        if (s.e.t === 'name' && v !== null && typeof v === 'object' && v.kind !== 'range') {
          throw new GardenError(`TypeError: '${s.e.name}' is a function. Call it with ${s.e.name}()`, s.line);
        }
        return undefined;
      }
      case 'assign': {
        const target = f.isGlobal || f.globalNames.has(s.name) ? this.globals : f;
        let v = yield* this.eval(s.e, f);
        if (s.op !== '=') {
          let cur: Value;
          if (target.vars.has(s.name)) cur = target.vars.get(s.name)!;
          else if (!f.isGlobal && target === f && this.globals.vars.has(s.name)) {
            throw new GardenError(
              `UnboundLocalError: cannot change '${s.name}' inside a function before assigning it (add 'global ${s.name}')`,
              s.line
            );
          } else throw new GardenError(`NameError: '${s.name}' is not defined`, s.line);
          v = this.binop(s.op.slice(0, -1), cur, v, s.line);
        }
        target.vars.set(s.name, v);
        return undefined;
      }
      case 'if': {
        for (const br of s.branches) {
          if (truthy(yield* this.eval(br.cond, f))) return yield* this.execBlock(br.body, f);
        }
        if (s.orelse) return yield* this.execBlock(s.orelse, f);
        return undefined;
      }
      case 'while': {
        for (;;) {
          this.tickStep(s.line);
          if (!truthy(yield* this.eval(s.cond, f))) break;
          const c = yield* this.execBlock(s.body, f);
          if (c?.k === 'break') break;
          if (c?.k === 'return') return c;
        }
        return undefined;
      }
      case 'for': {
        const it = iterValues(yield* this.eval(s.iter, f), s.line);
        const target = f.isGlobal || f.globalNames.has(s.name) ? this.globals : f;
        const len = Array.isArray(it) ? it.length : rangeLen(it);
        for (let i = 0; i < len; i++) {
          this.tickStep(s.line);
          target.vars.set(s.name, Array.isArray(it) ? it[i] : it.start + i * it.step);
          const c = yield* this.execBlock(s.body, f);
          if (c?.k === 'break') break;
          if (c?.k === 'return') return c;
        }
        return undefined;
      }
      case 'def': {
        const fn: PyFunc = { kind: 'func', name: s.name, params: s.params, body: s.body };
        const target = f.isGlobal || f.globalNames.has(s.name) ? this.globals : f;
        target.vars.set(s.name, fn);
        return undefined;
      }
    }
  }

  private binop(op: string, a: Value, b: Value, line: number): Value {
    if (op === '+') {
      if (isNum(a) && isNum(b)) return toNum(a) + toNum(b);
      if (typeof a === 'string' && typeof b === 'string') return a + b;
      if (typeof a === 'string') {
        throw new GardenError(`TypeError: can only concatenate str (not "${typeName(b)}") to str. Try str(...)`, line);
      }
    }
    if (op === '*') {
      if (typeof a === 'string' && isNum(b)) return a.repeat(Math.max(0, toNum(b)));
      if (isNum(a) && typeof b === 'string') return b.repeat(Math.max(0, toNum(a)));
    }
    if (isNum(a) && isNum(b)) {
      const x = toNum(a);
      const y = toNum(b);
      switch (op) {
        case '-':
          return x - y;
        case '*':
          return x * y;
        case '/':
          if (y === 0) throw new GardenError('ZeroDivisionError: division by zero', line);
          return x / y;
        case '//':
          if (y === 0) throw new GardenError('ZeroDivisionError: integer division by zero', line);
          return Math.floor(x / y);
        case '%':
          if (y === 0) throw new GardenError('ZeroDivisionError: modulo by zero', line);
          return pyMod(x, y);
        case '**':
          return Math.pow(x, y);
      }
    }
    throw new GardenError(
      `TypeError: unsupported operand type(s) for ${op}: '${typeName(a)}' and '${typeName(b)}'`,
      line
    );
  }

  private *eval(e: Expr, f: Frame): Gen<Value> {
    switch (e.t) {
      case 'num':
      case 'str':
      case 'const':
        return e.v;
      case 'name':
        return this.lookup(e.name, f, e.line);
      case 'unary': {
        const v = yield* this.eval(e.e, f);
        if (e.op === 'not') return !truthy(v);
        if (!isNum(v)) throw new GardenError(`TypeError: bad operand type for unary ${e.op}: '${typeName(v)}'`, e.line);
        return e.op === '-' ? -toNum(v) : toNum(v);
      }
      case 'bool': {
        const l = yield* this.eval(e.l, f);
        if (e.op === 'and') return truthy(l) ? yield* this.eval(e.r, f) : l;
        return truthy(l) ? l : yield* this.eval(e.r, f);
      }
      case 'bin': {
        const l = yield* this.eval(e.l, f);
        const r = yield* this.eval(e.r, f);
        return this.binop(e.op, l, r, e.line);
      }
      case 'cmp': {
        let left = yield* this.eval(e.items[0], f);
        for (let i = 0; i < e.ops.length; i++) {
          const right = yield* this.eval(e.items[i + 1], f);
          const op = e.ops[i];
          let ok: boolean;
          if (op === '==') ok = pyEq(left, right);
          else if (op === '!=') ok = !pyEq(left, right);
          else if (op === 'is') ok = left === right;
          else if (op === 'is not') ok = left !== right;
          else if (op === 'in' || op === 'not in') {
            let found: boolean;
            if (typeof right === 'string') {
              if (typeof left !== 'string') {
                throw new GardenError(`TypeError: 'in <string>' requires string as left operand, not ${typeName(left)}`, e.line);
              }
              found = right.includes(left);
            } else {
              const it = iterValues(right, e.line);
              if (Array.isArray(it)) found = it.some((v) => pyEq(v, left));
              else {
                const x = isNum(left) ? toNum(left) : NaN;
                found =
                  Number.isInteger(x) &&
                  (it.step > 0 ? x >= it.start && x < it.stop : x <= it.start && x > it.stop) &&
                  (x - it.start) % it.step === 0;
              }
            }
            ok = op === 'in' ? found : !found;
          } else ok = compare(left, right, op, e.line);
          if (!ok) return false;
          left = right;
        }
        return true;
      }
      case 'ternary':
        return truthy(yield* this.eval(e.cond, f)) ? yield* this.eval(e.a, f) : yield* this.eval(e.b, f);
      case 'call': {
        const callee = yield* this.eval(e.callee, f);
        const args: Value[] = [];
        for (const a of e.args) args.push(yield* this.eval(a, f));
        return yield* this.call(callee, args, e);
      }
    }
  }

  private *call(callee: Value, args: Value[], e: Expr): Gen<Value> {
    const line = e.line;
    const label = e.t === 'call' && e.callee.t === 'name' ? e.callee.name : pyStr(callee);
    if (callee === null || typeof callee !== 'object' || callee.kind === 'range') {
      throw new GardenError(`TypeError: '${typeName(callee)}' object is not callable (${label} is not a function)`, line);
    }
    if (callee.kind === 'builtin') {
      if (callee.fn) return callee.fn(args, line);
      const action = callee.action!(args, line);
      if (this.actions >= this.maxActions) throw new OutOfEnergy();
      this.actions++;
      const res = yield { action, line };
      this.steps = 0;
      return res === undefined ? null : res;
    }
    // User-defined function
    const fn = callee;
    if (args.length !== fn.params.length) {
      if (args.length < fn.params.length) {
        const missing = fn.params.slice(args.length);
        throw new GardenError(
          `TypeError: ${fn.name}() missing ${missing.length} required argument${missing.length > 1 ? 's' : ''}: ${missing.map((m) => `'${m}'`).join(', ')}`,
          line
        );
      }
      throw new GardenError(
        `TypeError: ${fn.name}() takes ${fn.params.length} argument${fn.params.length === 1 ? '' : 's'} but ${args.length} ${args.length === 1 ? 'was' : 'were'} given`,
        line
      );
    }
    if (this.depth >= this.maxDepth) {
      throw new GardenError('RecursionError: maximum recursion depth exceeded', line);
    }
    const frame: Frame = { vars: new Map(), globalNames: new Set(), isGlobal: false };
    fn.params.forEach((p, i) => frame.vars.set(p, args[i]));
    this.depth++;
    try {
      const c = yield* this.execBlock(fn.body, frame);
      return c?.k === 'return' ? c.v : null;
    } finally {
      this.depth--;
    }
  }
}

/**
 * Run a program step-by-step. Each `next()` advances until the next farming action and
 * yields `{ action, line }`. Send the action's result (e.g. harvest succeeded) back with
 * `next(result)`. Throws GardenError on syntax/runtime errors (with a 1-based line).
 */
export function* runProgram(
  source: string | Program,
  host: GardenHost,
  opts: RunOptions = {}
): Generator<ActionRequest, RunOutcome, Value | undefined> {
  const program = typeof source === 'string' ? parse(source) : source;
  const interp = new Interpreter(host, opts);
  return yield* interp.run(program);
}

/** Count lines that contain code (not blank, not comment-only). Used for star ratings. */
export const countCodeLines = (source: string): number =>
  source.split(/\r?\n/).filter((l) => {
    const t = l.trim();
    return t !== '' && !t.startsWith('#');
  }).length;
