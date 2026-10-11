/**
 * Parse an entry Row into an expression tree with TI EOS precedence (GB p.8–9, K §4.15, M §1):
 *
 *   1  parentheses                         ( … ), templates: n/d, U n/d, √, ˣ√
 *   2  prefix functions that need ")"      sin( log( R▸Pr( randint( x′( …
 *   3  fractions                           MathPrint n/d templates; Classic `3⁄4`, `1⌴7⁄12`
 *   4  postfix                             ² ⁻¹ ! % ° ′ ″ ʳ ᵍ (left to right)
 *   5  powers and roots                    MathPrint ^ (right to left), Classic ^ and ˣ√ (left to right)
 *   6  negation                            ⁻2² = ⁻4
 *   7  nPr nCr
 *   8  × ÷ and implied ×                   4(2+3), 2π, x(36−x), 2√2
 *   9  + −
 *   10 conversions                         ▸DMS ▸% ▸n/d◂▸Un/d ▸F◂▸D (on the whole expression)
 *   11 enter closes open parentheses       √(5²−4(1)(3)  is valid
 *
 * Also: `→ target` (store) and a trailing `◂▸` (answer toggle) on the entry.
 *
 * Representation notes (editor contract): x² and x⁻¹ are the postfix syms `square` / `recip`; ^ is a
 * `pow` node after its base; 10ˣ is the syms 1 0 then a pow; eˣ is the sym e then a pow; ×10ⁿ is an
 * `ee` node, read literally as "× 10^n" so it takes part in EOS (KB 20469: 6ᴇ5÷2ᴇ3 = 3×10⁸).
 *
 * Pending-operation limits (GB p.37–38): more than 8 pending values is SYNTAX and more than 23 pending
 * operations is MEMORY LIMIT. A pending value is a left operand waiting for its right operand; a
 * pending operation is any of those operators, open parenthesis/function/template or negation.
 * SPEC: assumption (which message fires for >23 operations is [unverified]).
 */
import { CalcError } from "../errors";
import type { Node, Row, SymId } from "../expr";

export type VarSym = "x" | "y" | "z" | "t" | "a" | "b" | "c";
export type StoreTarget = VarSym | "rand";
export type Fn1 =
  | "sin" | "cos" | "tan" | "asin" | "acos" | "atan"
  | "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh"
  | "log" | "ln" | "sqrtFn" | "tenPow" | "ePow" | "stat_xprime" | "stat_yprime";
export type Fn2 = "RPr" | "RPth" | "PRx" | "PRy" | "randint";
export type Postfix = "square" | "recip" | "fact" | "percent" | "deg" | "min" | "sec" | "radian" | "grad";
export type BinOp = "add" | "sub" | "mul" | "div" | "nPr" | "nCr" | "pow" | "xroot";
export type Conversion = "toDMS" | "toPercent" | "toFracMixed" | "toFD";

export type Ast =
  | { k: "num"; text: string }
  | { k: "pi" }
  | { k: "e" }
  | { k: "ans" }
  | { k: "var"; name: VarSym }
  | { k: "stat"; s: SymId }
  | { k: "list"; i: 0 | 1 | 2 }
  | { k: "rand" }
  | { k: "call"; fn: Fn1 | Fn2; args: Ast[] }
  | { k: "neg"; a: Ast }
  | { k: "bin"; op: BinOp; a: Ast; b: Ast }
  | { k: "post"; op: Postfix; a: Ast }
  /** ° ′ ″ written together (12°31′45″): the parts are added */
  | { k: "dms"; parts: Ast[] }
  /** MathPrint n/d template or Classic n⁄d */
  | { k: "frac"; num: Ast; den: Ast }
  /** mixed number: unit + n/d */
  | { k: "mixed"; whole: Ast; num: Ast; den: Ast }
  | { k: "sqrt"; a: Ast }
  | { k: "root"; index: Ast; a: Ast };

export interface Entry {
  expr: Ast;
  conv?: Conversion;
  store?: StoreTarget;
  /** the entry ends with ◂▸ */
  toggle: boolean;
}

type Tok =
  | { k: "num"; text: string }
  | { k: "sym"; s: SymId }
  | { k: "node"; n: Exclude<Node, { t: "sym" }> };

const syntax = (detail: string): CalcError => new CalcError("SYNTAX", detail);

const DIGITS = new Set<string>(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]);
const VARS: ReadonlySet<SymId> = new Set<SymId>(["x", "y", "z", "t", "a", "b", "c"]);
const STATS: ReadonlySet<SymId> = new Set<SymId>([
  "stat_n", "stat_xbar", "stat_Sx", "stat_sx", "stat_Sumx", "stat_Sumx2", "stat_ybar", "stat_Sy", "stat_sy",
  "stat_Sumy", "stat_Sumy2", "stat_Sumxy", "stat_a", "stat_b", "stat_r", "stat_r2", "stat_minX", "stat_Q1",
  "stat_Med", "stat_Q3", "stat_maxX", "stat_minY", "stat_maxY",
]);
const FN1: ReadonlySet<SymId> = new Set<SymId>([
  "sin", "cos", "tan", "asin", "acos", "atan", "sinh", "cosh", "tanh", "asinh", "acosh", "atanh",
  "log", "ln", "sqrtFn", "tenPow", "ePow",
]);
const FN2: ReadonlySet<SymId> = new Set<SymId>(["RPr", "RPth", "PRx", "PRy", "randint"]);
const POSTFIX: ReadonlySet<SymId> = new Set<SymId>(["square", "recip", "fact", "percent", "deg", "min", "sec", "radian", "grad"]);
const CONVERSIONS: ReadonlySet<SymId> = new Set<SymId>(["toDMS", "toPercent", "toFracMixed", "toFD"]);
const DMS_RANK: Partial<Record<SymId, number>> = { deg: 0, min: 1, sec: 2 };

/** Flatten a row into tokens: digit runs become numbers; ×10ⁿ becomes `* 10 ^n`. */
function tokenize(row: Row): Tok[] {
  const out: Tok[] = [];
  let num = "";
  const flush = () => {
    if (num) out.push({ k: "num", text: num });
    num = "";
  };
  for (let i = 0; i < row.length; i++) {
    const n = row[i]!;
    if (n.t === "sym" && DIGITS.has(n.s)) {
      num += n.s;
      continue;
    }
    // restricted-context E notation (data editor): digits ᴇ [⁻] digits
    if (n.t === "sym" && n.s === "E" && num) {
      let j = i + 1;
      let exp = "";
      if (row[j]?.t === "sym" && (row[j] as { s: SymId }).s === "neg") {
        exp = "-";
        j++;
      }
      while (row[j]?.t === "sym" && /^\d$/.test((row[j] as { s: SymId }).s)) exp += (row[j++] as { s: SymId }).s;
      if (!/\d/.test(exp)) throw syntax("E without exponent");
      num += `e${exp}`;
      i = j - 1;
      continue;
    }
    flush();
    if (n.t === "sym") out.push({ k: "sym", s: n.s });
    else if (n.t === "ee") {
      out.push({ k: "sym", s: "mul" }, { k: "num", text: "10" }, { k: "node", n: { t: "pow", exp: n.exp } });
    } else out.push({ k: "node", n });
  }
  flush();
  return out;
}

/** Parse a complete entry: expression, optional conversion, optional store, optional ◂▸. */
export function parseEntry(row: Row): Entry {
  const toks = tokenize(row);
  let toggle = false;
  const last = toks.at(-1);
  if (last?.k === "sym" && last.s === "toggle") {
    toggle = true;
    toks.pop();
  }
  let store: StoreTarget | undefined;
  const si = toks.findIndex((t) => t.k === "sym" && t.s === "store");
  if (si >= 0) {
    const target = toks[si + 1];
    if (si + 2 !== toks.length || target?.k !== "sym" || !(VARS.has(target.s) || target.s === "rand")) {
      throw syntax("store target");
    }
    store = target.s as StoreTarget;
    toks.splice(si);
  }
  if (toks.length === 0) throw syntax("empty");
  let conv: Conversion | undefined;
  const lt = toks.at(-1);
  if (lt?.k === "sym" && CONVERSIONS.has(lt.s)) {
    conv = lt.s as Conversion;
    toks.pop();
    if (toks.length === 0) throw syntax("conversion without a value");
  }
  const p = new Parser();
  const expr = p.parseAll(toks);
  return { expr, toggle, ...(conv ? { conv } : {}), ...(store ? { store } : {}) };
}

class Parser {
  private toks: Tok[] = [];
  private pos = 0;
  private pendingValues = 0;
  private pendingOps = 0;

  parseAll(toks: Tok[]): Ast {
    const saved = [this.toks, this.pos] as const;
    this.toks = toks;
    this.pos = 0;
    if (toks.length === 0) throw syntax("empty slot");
    const e = this.parseAdd();
    if (this.pos < toks.length) {
      const t = toks[this.pos]!;
      throw syntax(t.k === "sym" ? `unexpected ${t.s}` : "unexpected token");
    }
    [this.toks, this.pos] = saved;
    return e;
  }

  private peek(o = 0): Tok | undefined {
    return this.toks[this.pos + o];
  }

  private peekSym(o = 0): SymId | undefined {
    const t = this.peek(o);
    return t?.k === "sym" ? t.s : undefined;
  }

  private value<T>(f: () => T): T {
    this.pendingValues++;
    this.pendingOps++;
    if (this.pendingValues > 8) throw syntax("more than 8 pending values");
    if (this.pendingOps > 23) throw new CalcError("MEMORY LIMIT");
    try {
      return f();
    } finally {
      this.pendingValues--;
      this.pendingOps--;
    }
  }

  private group<T>(f: () => T): T {
    this.pendingOps++;
    if (this.pendingOps > 23) throw new CalcError("MEMORY LIMIT");
    try {
      return f();
    } finally {
      this.pendingOps--;
    }
  }

  private parseAdd(): Ast {
    let a = this.parseMul();
    for (let s = this.peekSym(); s === "add" || s === "sub"; s = this.peekSym()) {
      this.pos++;
      const b = this.value(() => this.parseMul());
      a = { k: "bin", op: s, a, b };
    }
    return a;
  }

  private parseMul(): Ast {
    let a = this.parsePerm();
    for (;;) {
      const s = this.peekSym();
      if (s === "mul" || s === "div") {
        this.pos++;
        const b = this.value(() => this.parsePerm());
        a = { k: "bin", op: s, a, b };
      } else if (this.startsOperand()) {
        const b = this.value(() => this.parsePerm());
        a = { k: "bin", op: "mul", a, b };
      } else return a;
    }
  }

  /** Can the next token begin an operand (implied multiplication)? */
  private startsOperand(): boolean {
    const t = this.peek();
    if (!t) return false;
    if (t.k === "num") return true;
    if (t.k === "node") return t.n.t === "frac" || t.n.t === "mixed" || t.n.t === "sqrt" || t.n.t === "root";
    const s = t.s;
    return (
      s === "pi" || s === "e" || s === "ans" || s === "rand" || s === "lparen" || s === "neg" ||
      s === "L1" || s === "L2" || s === "L3" || s === "stat_xprime" || s === "stat_yprime" ||
      VARS.has(s) || STATS.has(s) || FN1.has(s) || FN2.has(s)
    );
  }

  private parsePerm(): Ast {
    let a = this.parseNeg();
    for (let s = this.peekSym(); s === "nPr" || s === "nCr"; s = this.peekSym()) {
      this.pos++;
      const b = this.value(() => this.parseNeg());
      a = { k: "bin", op: s, a, b };
    }
    return a;
  }

  private parseNeg(): Ast {
    if (this.peekSym() === "neg") {
      this.pos++;
      return { k: "neg", a: this.group(() => this.parseNeg()) };
    }
    return this.parsePow();
  }

  /** Classic ^ and ˣ√, left to right (GB p.8: 2^3^2 = 64 in Classic). */
  private parsePow(): Ast {
    let a = this.parsePostfix();
    for (let s = this.peekSym(); s === "caret" || s === "xroot"; s = this.peekSym()) {
      this.pos++;
      const b = this.value(() => this.parsePowOperand());
      a = s === "caret" ? { k: "bin", op: "pow", a, b } : { k: "bin", op: "xroot", a, b };
    }
    return a;
  }

  /** An exponent or radicand after ^ / ˣ√ may carry its own negation: 2^⁻3. */
  private parsePowOperand(): Ast {
    if (this.peekSym() === "neg") {
      this.pos++;
      return { k: "neg", a: this.group(() => this.parsePowOperand()) };
    }
    return this.parsePostfix();
  }

  private parsePostfix(): Ast {
    let a = this.parsePrimary();
    for (;;) {
      const t = this.peek();
      if (t?.k === "sym" && POSTFIX.has(t.s)) {
        this.pos++;
        a = { k: "post", op: t.s as Postfix, a };
        const rank = DMS_RANK[t.s];
        if (rank !== undefined) a = this.dmsTail(a, rank);
      } else if (t?.k === "node" && t.n.t === "pow") {
        // a run of MathPrint exponents is right-associative (GB p.8: 2^{3^{2}} = 512)
        const exps: Ast[] = [];
        while (this.peek()?.k === "node" && (this.peek() as { n: Node }).n.t === "pow") {
          const n = (this.toks[this.pos++] as { n: { exp: Row } }).n;
          exps.push(this.value(() => this.parseSlot(n.exp)));
        }
        let e = exps.pop()!;
        while (exps.length) e = { k: "bin", op: "pow", a: exps.pop()!, b: e };
        a = { k: "bin", op: "pow", a, b: e };
      } else return a;
    }
  }

  /** After d° (or m′), a following number with a smaller unit mark continues the angle: 12°31′45″. */
  private dmsTail(first: Ast, rank: number): Ast {
    const parts = [first];
    for (;;) {
      const n = this.peek();
      const mark = this.peekSym(1);
      const r = mark === undefined ? undefined : DMS_RANK[mark];
      if (n?.k !== "num" || r === undefined || r <= rank) break;
      this.pos += 2;
      parts.push({ k: "post", op: mark as Postfix, a: { k: "num", text: n.text } });
      rank = r;
    }
    return parts.length === 1 ? first : { k: "dms", parts };
  }

  private parseSlot(row: Row): Ast {
    return this.group(() => this.parseAll(tokenize(row)));
  }

  private parsePrimary(): Ast {
    const t = this.peek();
    if (!t) throw syntax("missing operand");
    this.pos++;
    if (t.k === "num") return this.number(t.text);
    if (t.k === "node") {
      const n = t.n;
      switch (n.t) {
        case "frac":
          return { k: "frac", num: this.parseSlot(n.num), den: this.parseSlot(n.den) };
        case "mixed": {
          const whole = this.parseSlot(n.whole);
          if (whole.k !== "num" || !/^\d+$/.test(whole.text)) throw syntax("mixed-number unit must be an integer");
          return { k: "mixed", whole, num: this.parseSlot(n.num), den: this.parseSlot(n.den) };
        }
        case "sqrt":
          return { k: "sqrt", a: this.parseSlot(n.rad) };
        case "root":
          return { k: "root", index: this.parseSlot(n.index), a: this.parseSlot(n.rad) };
        default:
          throw syntax(`misplaced ${n.t}`);
      }
    }
    const s = t.s;
    if (s === "pi") return this.classicFrac({ k: "pi" });
    if (s === "e") return { k: "e" };
    if (s === "ans") return { k: "ans" };
    if (s === "rand") return { k: "rand" };
    if (VARS.has(s)) return { k: "var", name: s as VarSym };
    if (STATS.has(s)) return { k: "stat", s };
    if (s === "L1" || s === "L2" || s === "L3") return { k: "list", i: s === "L1" ? 0 : s === "L2" ? 1 : 2 };
    if (s === "lparen") return this.group(() => this.closeParen(this.parseAdd()));
    if (FN1.has(s)) return this.call(s as Fn1, 1);
    if (FN2.has(s)) return this.call(s as Fn2, 2);
    if (s === "stat_xprime" || s === "stat_yprime") {
      if (this.peekSym() !== "lparen") throw syntax(`${s} needs (`);
      this.pos++;
      return this.call(s, 1);
    }
    throw syntax(`unexpected ${s}`);
  }

  /** `)` or the end of the row (enter closes open parentheses). */
  private closeParen<T>(v: T): T {
    if (this.peekSym() === "rparen") this.pos++;
    else if (this.pos < this.toks.length) throw syntax("expected )");
    return v;
  }

  private call(fn: Fn1 | Fn2, arity: number): Ast {
    return this.group(() => {
      const args = [this.parseAdd()];
      while (this.peekSym() === "comma") {
        this.pos++;
        args.push(this.parseAdd());
      }
      this.closeParen(null);
      if (args.length !== arity) throw new CalcError("ARGUMENT", `${fn} takes ${arity}`);
      return { k: "call", fn, args };
    });
  }

  /** A number literal, or a Classic fraction n⁄d or mixed number u⌴n⁄d starting with it. */
  private number(text: string): Ast {
    if ((text.match(/\./g) ?? []).length > 1 || text === "." || /^\.e/.test(text)) throw syntax("bad number");
    const lit: Ast = { k: "num", text };
    if (this.peekSym() === "mixsep") {
      if (!/^\d+$/.test(text)) throw syntax("mixed-number unit must be an integer");
      this.pos++;
      const nt = this.peek();
      if (nt?.k !== "num") throw syntax("mixed number");
      this.pos++;
      const f = this.classicFrac({ k: "num", text: nt.text });
      if (f.k !== "frac") throw syntax("mixed number needs n⁄d");
      return { k: "mixed", whole: lit, num: f.num, den: f.den };
    }
    return this.classicFrac(lit);
  }

  /** Classic `n⁄d`: numerator and denominator are plain numbers (or π on top). GB p.13. */
  private classicFrac(num: Ast): Ast {
    if (this.peekSym() !== "fracbar") return num;
    this.pos++;
    const d = this.peek();
    if (d?.k !== "num") throw syntax("n⁄d takes a number; use ÷");
    this.pos++;
    if (this.peekSym() === "fracbar") throw syntax("complex fraction; use ÷");
    return { k: "frac", num, den: { k: "num", text: d.text } };
  }
}

/** Every list referenced by an expression (for data-editor formulas). */
export function listRefs(a: Ast, out = new Set<0 | 1 | 2>()): Set<0 | 1 | 2> {
  switch (a.k) {
    case "list": out.add(a.i); break;
    case "call": a.args.forEach((x) => listRefs(x, out)); break;
    case "neg": case "post": case "sqrt": listRefs(a.a, out); break;
    case "bin": listRefs(a.a, out); listRefs(a.b, out); break;
    case "dms": a.parts.forEach((x) => listRefs(x, out)); break;
    case "frac": listRefs(a.num, out); listRefs(a.den, out); break;
    case "mixed": listRefs(a.whole, out); listRefs(a.num, out); listRefs(a.den, out); break;
    case "root": listRefs(a.index, out); listRefs(a.a, out); break;
    default: break;
  }
  return out;
}

/** Does an expression draw random numbers (not allowed in table functions, GB p.33)? */
export function usesRandom(a: Ast): boolean {
  switch (a.k) {
    case "rand": return true;
    case "call": return a.fn === "randint" || a.args.some(usesRandom);
    case "neg": case "post": case "sqrt": return usesRandom(a.a);
    case "bin": return usesRandom(a.a) || usesRandom(a.b);
    case "dms": return a.parts.some(usesRandom);
    case "frac": return usesRandom(a.num) || usesRandom(a.den);
    case "mixed": return usesRandom(a.num) || usesRandom(a.den);
    case "root": return usesRandom(a.index) || usesRandom(a.a);
    default: return false;
  }
}
