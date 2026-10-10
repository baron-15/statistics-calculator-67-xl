/**
 * Math engine (Agent B): parse an entry Row with TI EOS precedence, evaluate it (exact rationals,
 * radicals and π multiples where the TI-30XS keeps them; 13-digit reals otherwise), and format
 * results back into Rows for the display. See docs/SPEC.md §Math.
 */
import { CalcError } from "../errors";
import { row, type Row, type SymId } from "../expr";
import type { Value } from "./value";

export type { Exact, Value } from "./value";

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
  /** stat results available to the StatVars menu tokens */
  statVars: Partial<Record<SymId, number>>;
  /** deterministic PRNG for rand/randint: returns the next [0,1) value and the new seed */
  random: () => number;
}

/** Evaluate an entry. Throws CalcError. */
export function evaluate(entry: Row, ctx: EvalContext): Value {
  void entry; void ctx;
  throw new CalcError("SYNTAX", "not implemented");
}

/** Format a value as the result row shown on the home screen in the current modes. */
export function formatResult(v: Value, modes: Modes): Row {
  void modes;
  return String(v.re)
    .split("")
    .map((ch) => (ch === "-" ? "neg" : ch) as SymId)
    .reduce<Row>((r, s) => [...r, ...row(s)], []);
}

/** The ◂▸ toggle: the alternate form of a result (fraction↔decimal, √↔decimal, π↔decimal), or null if none. */
export function toggleForm(v: Value, current: Row, modes: Modes): Row | null {
  void v; void current; void modes;
  return null;
}

export { oneVarStats, twoVarStats, type StatItem, type StatResults } from "./stats";
