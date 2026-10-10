/**
 * Evaluate a parsed expression tree. See ./ops.ts for the exactness rules and ./parse.ts for EOS.
 */
import { CalcError } from "../errors";
import type { SymId } from "../expr";
import { norm } from "./decimal";
import { dec, int, isIntegerExact, isRational, mk } from "./exact";
import * as op from "./ops";
import type { Env } from "./ops";
import type { Ast } from "./parse";
import type { Value } from "./value";

export interface EvalScope {
  env: Env;
  ans: Value;
  vars: Record<"x" | "y" | "z" | "t" | "a" | "b" | "c", Value>;
  statVars: Partial<Record<SymId, number>>;
  random: () => number;
  /** list element values bound for a data-editor formula row (index = list number − 1) */
  listRow?: [Value | undefined, Value | undefined, Value | undefined];
}

/** A number literal: integers are exact, any decimal point makes a decimal (M §3.2). */
export function literal(text: string): Value {
  if (/^\d+$/.test(text)) return mk(BigInt(text));
  const x = Number(text);
  if (!Number.isFinite(x)) throw new CalcError("SYNTAX", "bad number");
  return dec(x);
}

/** A stored value read back in the current mode (Classic shows no radicals or π). */
const load = (v: Value, s: EvalScope): Value => op.forMode(v, s.env);

/** A plain number (stat result, list element) as a value: integers exact, others decimal. */
export function fromNumber(x: number): Value {
  if (Number.isInteger(x) && Math.abs(x) < 1e13) return int(x);
  return dec(x);
}

export function evalAst(a: Ast, s: EvalScope): Value {
  const env = s.env;
  switch (a.k) {
    case "num": return literal(a.text);
    case "pi": return op.piConst(env);
    case "e": return op.eConst();
    case "ans": return load(s.ans, s);
    case "var": return load(s.vars[a.name], s);
    case "stat": {
      const v = s.statVars[a.s];
      if (v === undefined) throw new CalcError("STAT", `${a.s} not available`);
      return dec(v);
    }
    case "list": {
      const v = s.listRow?.[a.i];
      if (!v) throw new CalcError("SYNTAX", "list outside a formula");
      return load(v, s);
    }
    case "rand": return dec(s.random());
    case "neg": return op.neg(evalAst(a.a, s));
    case "dms": return a.parts.map((p) => evalAst(p, s)).reduce((x, y) => op.add(x, y));
    case "frac": return op.divide(evalAst(a.num, s), evalAst(a.den, s));
    case "mixed": {
      const w = evalAst(a.whole, s);
      const f = op.divide(evalAst(a.num, s), evalAst(a.den, s));
      return op.add(w, f);
    }
    case "sqrt": return op.sqrt(evalAst(a.a, s), env);
    case "root": return op.nthRoot(evalAst(a.index, s), evalAst(a.a, s), env);
    case "post": return postfix(a.op, evalAst(a.a, s), env);
    case "bin": return binary(a, s);
    case "call": return call(a, s);
  }
}

function postfix(o: Extract<Ast, { k: "post" }>["op"], v: Value, env: Env): Value {
  switch (o) {
    case "square": return op.square(v);
    case "recip": return op.recip(v);
    case "fact": return op.factorial(v);
    case "percent": return op.percent(v);
    default: return op.angleMark(v, o, env);
  }
}

function binary(a: Extract<Ast, { k: "bin" }>, s: EvalScope): Value {
  // e^x: the e constant raised to a power is the exponential function (eˣ key = e + pow)
  if (a.op === "pow" && a.a.k === "e") return op.expE(evalAst(a.b, s));
  const x = evalAst(a.a, s);
  const y = evalAst(a.b, s);
  switch (a.op) {
    case "add": return op.add(x, y);
    case "sub": return op.sub(x, y);
    case "mul": return op.mul(x, y);
    case "div": return op.divOp(x, y);
    case "nPr": return op.nPr(x, y);
    case "nCr": return op.nCr(x, y);
    case "pow": return op.pow(x, y, s.env);
    case "xroot": return op.nthRoot(x, y, s.env);
  }
}

function call(a: Extract<Ast, { k: "call" }>, s: EvalScope): Value {
  const env = s.env;
  const args = a.args.map((x) => evalAst(x, s));
  const [x, y] = args as [Value, Value];
  switch (a.fn) {
    case "sin": return op.sin(x, env);
    case "cos": return op.cos(x, env);
    case "tan": return op.tan(x, env);
    case "asin": return op.asin(x, env);
    case "acos": return op.acos(x, env);
    case "atan": return op.atan(x, env);
    case "sinh": case "cosh": case "tanh": case "asinh": case "acosh": case "atanh":
      return op.hyp(a.fn, x);
    case "log": return op.log10(x);
    case "ln": return op.ln(x);
    case "sqrtFn": return op.sqrt(x, env);
    case "tenPow": return op.pow(int(10), x, env);
    case "ePow": return op.expE(x);
    case "RPr": return op.rToPr(x, y);
    case "RPth": return op.rToPtheta(x, y, env);
    case "PRx": return op.pToRx(x, y, env);
    case "PRy": return op.pToRy(x, y, env);
    case "randint": return op.randint(x, y, s.random());
    case "stat_xprime": {
      // x′(y) = (y − b)/a (GB p.24)
      const { a: sa, b: sb } = regression(s);
      if (sa === 0) throw new CalcError("DIVIDE BY 0");
      return dec((x.re - sb) / sa);
    }
    case "stat_yprime": {
      const { a: sa, b: sb } = regression(s);
      return dec(norm(sa * x.re) + sb);
    }
  }
}

function regression(s: EvalScope): { a: number; b: number } {
  const a = s.statVars.stat_a;
  const b = s.statVars.stat_b;
  if (a === undefined || b === undefined) throw new CalcError("STAT", "no regression");
  return { a, b };
}

/** Is the value an integer (exactly or as a decimal)? */
export const isIntegral = (v: Value): boolean => (v.exact ? isIntegerExact(v.exact) : Number.isInteger(v.re));

/** Is the value a non-integer rational with an exact form? */
export const isFraction = (v: Value): boolean => !!v.exact && isRational(v.exact) && v.exact.d !== 1n;
