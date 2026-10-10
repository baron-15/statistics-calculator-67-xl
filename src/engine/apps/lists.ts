/**
 * The three data lists and their formulas (K §3.4; M §5.1; TG p.79).
 *
 * A formula list is computed element by element: each `L1`/`L2`/`L3` in the formula is replaced by
 * that list's element (as a parenthesised value) and the row is evaluated. It is recomputed whenever
 * a list changes (GB-089e). A formula must name a list other than its own (FORMULA), and the lists
 * it names must have equal lengths (DIM MISMATCH).
 * Any change to the data removes the StatVars results until stats are recalculated (TG p.83).
 */
import { CalcError } from "../errors";
import type { Row, SymId } from "../expr";
import type { Value } from "../math";
import type { CalcState } from "../state";
import { evalRow, substitute } from "./calc";
import { operandRow } from "./format";

export const MAX_LIST = 42;

export type Lists = [Value[], Value[], Value[]];
export type Formulas = [Row | null, Row | null, Row | null];

const LIST_SYMS: SymId[] = ["L1", "L2", "L3"];

/** Which lists a formula names. */
export function listRefs(formula: Row): number[] {
  const refs = new Set<number>();
  const walk = (r: Row) => {
    for (const n of r) {
      if (n.t === "sym") {
        const i = LIST_SYMS.indexOf(n.s);
        if (i >= 0) refs.add(i);
      } else {
        for (const v of Object.values(n)) if (Array.isArray(v)) walk(v as Row);
      }
    }
  };
  walk(formula);
  return [...refs].sort();
}

/** The values of formula list `col`. Throws CalcError (FORMULA, DIM MISMATCH, or an evaluation error). */
export function formulaValues(s: CalcState, lists: Lists, col: number, formula: Row): Value[] {
  const refs = listRefs(formula);
  if (refs.length === 0 || refs.includes(col)) throw new CalcError("FORMULA");
  const lens = refs.map((i) => lists[i]?.length ?? 0);
  const n = lens[0] ?? 0;
  if (lens.some((l) => l !== n)) throw new CalcError("DIM MISMATCH");
  const ctxState: CalcState = { ...s, apps: { ...s.apps, lists } };
  const out: Value[] = [];
  for (let i = 0; i < Math.min(n, MAX_LIST); i++) {
    const row = substitute(formula, (sid) => {
      const k = LIST_SYMS.indexOf(sid);
      const v = k >= 0 ? lists[k]?.[i] : undefined;
      return v ? operandRow(v) : null;
    });
    out.push(evalRow(ctxState, row).value);
  }
  return out;
}

/**
 * Recompute every formula list (twice, so a formula over another formula list settles). A formula
 * that cannot be computed keeps its previous values.
 */
export function recompute(s: CalcState, lists: Lists, formulas: Formulas): Lists {
  let out: Lists = [lists[0], lists[1], lists[2]];
  for (let pass = 0; pass < 2; pass++) {
    formulas.forEach((f, col) => {
      if (!f) return;
      try {
        const vals = formulaValues(s, out, col, f);
        out = out.map((l, i) => (i === col ? vals : l)) as Lists;
      } catch {
        // keep the previous values
      }
    });
  }
  return out;
}

/** Store new lists (and formulas), recompute formula lists, and drop the StatVars results. */
export function withLists(s: CalcState, lists: Lists, formulas: Formulas = s.apps.formulas): CalcState {
  const next = recompute(s, lists, formulas);
  return { ...s, apps: { ...s.apps, lists: next, formulas, stat: null } };
}

export const replaceAt = <T,>(xs: readonly T[], i: number, v: T): T[] => xs.map((x, k) => (k === i ? v : x));

export function setList(lists: Lists, col: number, values: Value[]): Lists {
  return lists.map((l, i) => (i === col ? values : l)) as Lists;
}

export function setFormula(formulas: Formulas, col: number, f: Row | null): Formulas {
  return formulas.map((x, i) => (i === col ? f : x)) as Formulas;
}
