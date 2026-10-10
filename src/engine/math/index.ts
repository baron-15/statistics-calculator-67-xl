/**
 * Math engine (Agent B): parse an entry Row with TI EOS precedence, evaluate it (exact rationals,
 * radicals and π multiples where the TI-30XS keeps them; 13-digit reals otherwise), and format
 * results back into Rows for the display. See docs/SPEC.md §Math and docs/research/math-stats.md (M).
 *
 * Module map: ./parse (EOS parser), ./evaluate (tree walk), ./ops (functions and exactness rules),
 * ./exact (bigint forms), ./decimal (13-digit model), ./format (result rows, ◂▸, menu text),
 * ./random (rand), ./stats (1-Var / 2-Var).
 *
 * For the router: call `evaluateEntry` on enter. It returns the new Ans value, the result row, the
 * store target (`→x`, `→rand`) and whether the entry was a ◂▸ toggle. `answerRow(ans, modes)` is the
 * row to pass as EditContext.lastAnswerRow.
 */
import { CalcError } from "../errors";
import type { Row, SymId } from "../expr";
import { isIntegerExact, isRational } from "./exact";
import { evalAst, fromNumber, type EvalScope } from "./evaluate";
import { alternate, formatResult as fmt, recognize, showsExact } from "./format";
import { listRefs, parseEntry, usesRandom, type Ast, type Conversion, type StoreTarget } from "./parse";
import type { Value } from "./value";

export type { Exact, Value, ValueForm } from "./value";
export type { StoreTarget } from "./parse";

export interface Modes {
  angle: "DEG" | "RAD" | "GRAD";
  notation: "NORM" | "SCI" | "ENG";
  /** "FLOAT" or a FIX digit count */
  decimals: "FLOAT" | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
  display: "CLASSIC" | "MATHPRINT";
}

export interface EvalContext {
  modes: Modes;
  ans: Value;
  vars: Record<"x" | "y" | "z" | "t" | "a" | "b" | "c", Value>;
  /** data-editor lists (for formulas and statistics) */
  lists: [number[], number[], number[]];
  /**
   * Optional exact list elements (fractions typed with n/d stay fractions, GB p.32). When absent, list
   * numbers are read as exact integers or decimals.
   */
  listValues?: [Value[], Value[], Value[]];
  /** stat results available to the StatVars menu tokens (stat_a / stat_b also drive x′( and y′() */
  statVars: Partial<Record<SymId, number>>;
  /** deterministic PRNG for rand/randint: returns the next (0,1) value (see makeRandom) */
  random: () => number;
}

export interface EntryResult {
  /** the new Ans (and the value stored by →) */
  value: Value;
  /** the result row as displayed */
  result: Row;
  /** `→ x` … `→ c` or `→ rand` (the router stores; for rand, randSeed = value.re) */
  store?: StoreTarget;
  /** the entry ended with ◂▸ (draw the marker; the result is the alternate form) */
  toggled: boolean;
}

const scopeOf = (ctx: EvalContext, extra: Partial<EvalScope> = {}): EvalScope => ({
  env: { mp: ctx.modes.display === "MATHPRINT", angle: ctx.modes.angle },
  ans: ctx.ans,
  vars: ctx.vars,
  statVars: ctx.statVars,
  random: ctx.random,
  ...extra,
});

/** Evaluate an entry: the full home-screen pipeline. Throws CalcError. */
export function evaluateEntry(entry: Row, ctx: EvalContext): EntryResult {
  const parsed = parseEntry(entry);
  let v = evalAst(parsed.expr, scopeOf(ctx));
  if (parsed.conv) v = convert(parsed.conv, v, parsed.expr);
  v = finalize(v, ctx.modes);
  let result = fmt(v, ctx.modes);
  if (parsed.toggle) {
    const alt = alternate(v, result, ctx.modes);
    if (alt) {
      v = alt.value;
      result = alt.row;
    }
  }
  if (parsed.store === "rand" && !(Number.isInteger(v.re) && v.re >= 0)) throw new CalcError("DOMAIN", "seed");
  return { value: v, result, toggled: parsed.toggle, ...(parsed.store ? { store: parsed.store } : {}) };
}

/** Evaluate an entry to its value (the new Ans). Throws CalcError. */
export function evaluate(entry: Row, ctx: EvalContext): Value {
  return evaluateEntry(entry, ctx).value;
}

/** Format a value as the result row shown on the home screen in the current modes. */
export function formatResult(v: Value, modes: Modes): Row {
  return fmt(v, modes);
}

/** The ◂▸ toggle: the alternate form of a result (fraction↔decimal, √↔decimal, π↔decimal), or null if none. */
export function toggleForm(v: Value, current: Row, modes: Modes): Row | null {
  return alternate(v, current, modes)?.row ?? null;
}

/**
 * Drop exact forms the display cannot show (too large, or √/π in Classic): such results are decimals,
 * and so is the Ans they leave behind.
 */
export function finalize(v: Value, modes: Modes): Value {
  const e = v.exact;
  if (!e || isIntegerExact(e) || showsExact(e, modes)) return v;
  return v.form ? { re: v.re, form: v.form } : { re: v.re };
}

function isMixedLiteral(a: Ast): boolean {
  return a.k === "mixed" || (a.k === "neg" && isMixedLiteral(a.a));
}

/** The 10th-level conversions (GB p.13–19). */
function convert(c: Conversion, v: Value, expr: Ast): Value {
  const plain: Value = v.exact ? { re: v.re, exact: v.exact } : { re: v.re };
  switch (c) {
    case "toDMS": return { ...plain, form: "dms" };
    case "toPercent": return { ...plain, form: "percent" };
    case "toFracMixed": {
      // a mixed number becomes improper; anything else becomes mixed (decimals via their fraction)
      if (isMixedLiteral(expr)) return plain;
      const f = v.exact && isRational(v.exact) ? plain : fractionOf(v.re);
      return f ? { ...f, form: "mixed" } : plain;
    }
    case "toFD": {
      if (v.exact && !isIntegerExact(v.exact)) return { re: v.re };
      if (v.exact) return plain;
      return fractionOf(v.re) ?? plain;
    }
  }
}

/** A decimal's fraction (d ≤ 1000), if one matches all 13 digits. */
function fractionOf(x: number): Value | null {
  const r = recognize(x, false);
  return r?.exact && isRational(r.exact) ? r : null;
}

// ---------------------------------------------------------------------------------------------
// function table (GB p.33–35) and data-editor list formulas (GB p.32–33)

const TABLE_FORBIDDEN: ReadonlySet<SymId> = new Set<SymId>(["toggle", "rand", "randint", "store"]);

function containsSym(r: Row, set: ReadonlySet<SymId>): boolean {
  return r.some((n) => {
    if (n.t === "sym") return set.has(n.s);
    return Object.values(n).some((c) => Array.isArray(c) && containsSym(c as Row, set));
  });
}

/**
 * y = f(x) for the table app. `x` is a number (integers are exact, others decimal: a decimal Start or
 * Step gives decimal y values, TG p.97) or a Value (Ask-x entries such as 2π). Functions containing ◂▸,
 * rand, randint or → are INVALID FUNCTION (GB p.38). Other errors (DIVIDE BY 0, DOMAIN…) propagate.
 */
export function evalFunctionAt(fx: Row, x: number | Value, ctx: EvalContext): Value {
  if (containsSym(fx, TABLE_FORBIDDEN)) throw new CalcError("INVALID FUNCTION");
  const parsed = parseEntry(fx);
  if (parsed.store || parsed.toggle || usesRandom(parsed.expr)) throw new CalcError("INVALID FUNCTION");
  const xv = typeof x === "number" ? fromNumber(x) : x;
  let v = evalAst(parsed.expr, scopeOf(ctx, { vars: { ...ctx.vars, x: xv } }));
  if (parsed.conv) v = convert(parsed.conv, v, parsed.expr);
  return finalize(v, ctx.modes);
}

/**
 * Evaluate a list formula (`◆L2=9/5×L1+32`, `L1▸F◂▸D`) element by element. `target` is the list being
 * defined (0–2). FORMULA: no list name, or the target's own name; DIM MISMATCH: referenced lists of
 * unequal length.
 */
export function evaluateListFormula(formula: Row, ctx: EvalContext, target?: 0 | 1 | 2): Value[] {
  const parsed = parseEntry(formula);
  if (parsed.store || parsed.toggle) throw new CalcError("SYNTAX");
  const refs = [...listRefs(parsed.expr)];
  if (refs.length === 0 || (target !== undefined && refs.includes(target))) throw new CalcError("FORMULA");
  const lists = [0, 1, 2].map((k) => ctx.listValues?.[k] ?? (ctx.lists[k] ?? []).map(fromNumber));
  const len = lists[refs[0]!]!.length;
  if (refs.some((k) => lists[k]!.length !== len)) throw new CalcError("DIM MISMATCH");
  const out: Value[] = [];
  for (let i = 0; i < len; i++) {
    const listRow = [lists[0]![i], lists[1]![i], lists[2]![i]] as EvalScope["listRow"];
    let v = evalAst(parsed.expr, scopeOf(ctx, { ...(listRow ? { listRow } : {}) }));
    if (parsed.conv) v = convert(parsed.conv, v, parsed.expr);
    out.push(finalize(v, ctx.modes));
  }
  return out;
}

export { answerRow, formatNumberText, numberParts, decimalRow } from "./format";
export { fromNumber } from "./evaluate";
export { randNext, makeRandom, DEFAULT_SEED } from "./random";
export { oneVarStats, twoVarStats, statVarsOf, type StatItem, type StatResults } from "./stats";
