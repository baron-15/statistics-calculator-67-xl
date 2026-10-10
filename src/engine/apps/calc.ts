/**
 * Evaluation glue between the apps layer and the math engine: the EvalContext (Ans, variables,
 * lists, StatVars, the rand generator), the `→ var` store suffix, and the shared zero value.
 */
import { CalcError } from "../errors";
import { type Node, type Row, type SymId } from "../expr";
import { evaluate, type EvalContext, type Value } from "../math";
import type { CalcState, VarName } from "../state";

export const ZERO: Value = { re: 0, exact: { n: 0n, d: 1n, root: 1n, pi: false } };

export const VARS: readonly VarName[] = ["x", "y", "z", "t", "a", "b", "c"];

const isVar = (s: SymId): s is VarName => (VARS as readonly string[]).includes(s);

/** The rand generator recovered from TI screens (M §4.5): x ← 40014·x mod 2147483563. */
export const RAND_MOD = 2147483563;
/** Seed used when the stored seed is 0 (an MLCG would stick at 0). SPEC: assumption (M §4.5). */
export const DEFAULT_SEED = 12345;

export function nextRand(seed: number): number {
  const x = seed === 0 ? DEFAULT_SEED : seed;
  return (40014 * x) % RAND_MOD;
}

export interface EvalOptions {
  /** override variables (the function table binds x) */
  vars?: Partial<Record<VarName, Value>>;
}

/** Evaluate a row in the current state. Returns the value and the rand seed after any rand draws. */
export function evalRow(s: CalcState, row: Row, opts: EvalOptions = {}): { value: Value; seed: number } {
  let seed = s.randSeed;
  const ctx: EvalContext = {
    modes: s.modes,
    ans: s.ans,
    vars: { ...s.vars, ...opts.vars },
    lists: [s.apps.lists[0].map((v) => v.re), s.apps.lists[1].map((v) => v.re), s.apps.lists[2].map((v) => v.re)],
    statVars: statVars(s),
    random: () => {
      seed = nextRand(seed);
      return seed / RAND_MOD;
    },
  };
  const value = evaluate(row, ctx);
  return { value, seed };
}

/** StatVars values for evaluation (`x̄`, `Σx`, `a`, `b`, …) from the last 1-Var/2-Var results. */
export function statVars(s: CalcState): Partial<Record<SymId, number>> {
  const out: Partial<Record<SymId, number>> = {};
  for (const it of s.apps.stat?.items ?? []) if (it.value !== null) out[it.key] = it.value;
  return out;
}

/** A trailing `→x` … `→c` or `→rand` on an entry (K §3.8, §3.2). */
export interface StoreTarget {
  expr: Row;
  target: VarName | "rand" | null;
}

export function splitStore(entry: Row): StoreTarget {
  const n = entry.length;
  const last: Node | undefined = entry[n - 1];
  const prev: Node | undefined = entry[n - 2];
  if (prev?.t === "sym" && prev.s === "store" && last?.t === "sym") {
    if (isVar(last.s)) return { expr: entry.slice(0, -2), target: last.s };
    if (last.s === "rand") return { expr: entry.slice(0, -2), target: "rand" };
  }
  return { expr: entry, target: null };
}

/** Seed value stored by `n→rand`: an integer ≥ 0, else DOMAIN. SPEC: assumption (GB p.29 asks for one). */
export function seedFrom(v: Value): number {
  if (!Number.isInteger(v.re) || v.re < 0 || v.re >= RAND_MOD) throw new CalcError("DOMAIN", "rand seed");
  return v.re;
}

/** Does the row contain any of these symbols (at any depth)? */
export function containsSym(row: Row, ids: ReadonlySet<SymId>): boolean {
  for (const n of row) {
    switch (n.t) {
      case "sym": if (ids.has(n.s)) return true; break;
      case "frac": if (containsSym(n.num, ids) || containsSym(n.den, ids)) return true; break;
      case "mixed": if (containsSym(n.whole, ids) || containsSym(n.num, ids) || containsSym(n.den, ids)) return true; break;
      case "pow": case "ee": if (containsSym(n.exp, ids)) return true; break;
      case "sqrt": if (containsSym(n.rad, ids)) return true; break;
      case "root": if (containsSym(n.index, ids) || containsSym(n.rad, ids)) return true; break;
    }
  }
  return false;
}

/** Replace symbols with rows (at any depth): list names → element values in a formula. */
export function substitute(row: Row, f: (s: SymId) => Row | null): Row {
  const out: Row = [];
  for (const n of row) {
    switch (n.t) {
      case "sym": {
        const r = f(n.s);
        if (r) out.push(...r);
        else out.push(n);
        break;
      }
      case "frac": out.push({ t: "frac", num: substitute(n.num, f), den: substitute(n.den, f) }); break;
      case "mixed": out.push({ t: "mixed", whole: substitute(n.whole, f), num: substitute(n.num, f), den: substitute(n.den, f) }); break;
      case "pow": out.push({ t: "pow", exp: substitute(n.exp, f) }); break;
      case "ee": out.push({ t: "ee", exp: substitute(n.exp, f) }); break;
      case "sqrt": out.push({ t: "sqrt", rad: substitute(n.rad, f) }); break;
      case "root": out.push({ t: "root", index: substitute(n.index, f), rad: substitute(n.rad, f) }); break;
    }
  }
  return out;
}
