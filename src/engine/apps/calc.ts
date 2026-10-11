/**
 * Evaluation glue between the apps layer and the math engine: the EvalContext (Ans, variables,
 * lists with their exact values, StatVars, the rand generator) and the shared zero value.
 */
import { type Row, type SymId } from "../expr";
import { evaluateEntry, makeRandom, statVarsOf, type EntryResult, type EvalContext, type Value } from "../math";
import type { CalcState, VarName } from "../state";

export const ZERO: Value = { re: 0, exact: { n: 0n, d: 1n, root: 1n, pi: false } };

export const VARS: readonly VarName[] = ["x", "y", "z", "t", "a", "b", "c"];

export { DEFAULT_SEED } from "../math";

export interface EvalOptions {
  /** override variables (the function table binds x) */
  vars?: Partial<Record<VarName, Value>>;
  /** evaluate against these lists instead of the stored ones */
  lists?: [Value[], Value[], Value[]];
}

/** The math engine's context for this state, and the rand seed after any draws made with it. */
export function evalContext(s: CalcState, opts: EvalOptions = {}): { ctx: EvalContext; seed: () => number } {
  const rng = makeRandom(s.randSeed);
  const lists = opts.lists ?? s.apps.lists;
  const ctx: EvalContext = {
    modes: s.modes,
    ans: s.ans,
    vars: { ...s.vars, ...opts.vars },
    lists: [lists[0].map((v) => v.re), lists[1].map((v) => v.re), lists[2].map((v) => v.re)],
    listValues: lists,
    statVars: s.apps.stat ? statVarsOf(s.apps.stat) : {},
    random: rng.random,
  };
  return { ctx, seed: rng.seed };
}

/** Evaluate an entry the way enter does (store target, ◂▸, conversions). Throws CalcError. */
export function evalEntry(s: CalcState, row: Row, opts: EvalOptions = {}): { r: EntryResult; seed: number } {
  const { ctx, seed } = evalContext(s, opts);
  const r = evaluateEntry(row, ctx);
  return { r, seed: seed() };
}

/** Evaluate a row to a value (data cells, table settings, Ask-x). Throws CalcError. */
export function evalRow(s: CalcState, row: Row, opts: EvalOptions = {}): { value: Value; seed: number } {
  const { r, seed } = evalEntry(s, row, opts);
  return { value: r.value, seed };
}

/** Does the row contain any of these symbols (at any depth)? */
export function containsSym(row: Row, ids: ReadonlySet<SymId>): boolean {
  return row.some((n) => (n.t === "sym" ? ids.has(n.s) : Object.values(n).some((c) => Array.isArray(c) && containsSym(c as Row, ids))));
}
