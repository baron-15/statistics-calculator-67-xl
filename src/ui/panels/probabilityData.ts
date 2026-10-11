/**
 * Data for the Probability block: the prb calculation being typed (or the last one in history),
 * written out with the user's numbers. Operands and results come from the engine's parser and
 * evaluator, so `(2+3) nPr 2`, variables and Ans work, and errors are the calculator's own.
 */
import type { CalcState } from "../../engine";
import { usesRandom, type Ast } from "../../engine/math/parse";
import type { Value } from "../../engine/math";
import type { SymId } from "../../engine/expr";
import { evalOrError, findNode, findSource, scopeOf, tryEval } from "./exprData";
import { groupDigits, MINUS, valueText } from "./text";

export type ProbKind = "nPr" | "nCr" | "fact" | "rand" | "randint";

export interface ProbCalc {
  kind: ProbKind;
  /** the operation with the user's numbers, e.g. "8 nPr 3" */
  expr: string;
  /** the definition with the user's numbers, e.g. "8!/(8−3)!" (null when the operands are unknown) */
  formula: string | null;
  /** the product written out, e.g. "8×7×6" */
  steps: string | null;
  /** the result as the Home screen shows it, or the calculator's error */
  result: string | null;
  error: string | null;
  /** one probability that follows, e.g. "1 in 2,598,960" */
  chance: string | null;
  /** randint: the integers it can return */
  range: { lo: string; hi: string; count: number } | null;
}

export interface ProbabilityView {
  source: "entry" | "history" | null;
  entry: string | null;
  calc: ProbCalc | null;
}

const KIND_OF_SYM: Partial<Record<SymId, ProbKind>> = { nPr: "nPr", nCr: "nCr", fact: "fact", rand: "rand", randint: "randint" };

function kindOf(a: Ast): ProbKind | null {
  if (a.k === "bin" && (a.op === "nPr" || a.op === "nCr")) return a.op;
  if (a.k === "post" && a.op === "fact") return "fact";
  if (a.k === "call" && a.fn === "randint") return "randint";
  if (a.k === "rand") return "rand";
  return null;
}

const isCount = (v: Value | null): v is Value => !!v && Number.isInteger(v.re) && v.re >= 0 && v.re < 1e6;

/** n × (n−1) × … for `terms` factors, shortened with "…" past `max`. */
export function fallingProduct(n: number, terms: number, max = 8): string {
  if (terms <= 0) return "1";
  const f = Array.from({ length: Math.min(terms, max) }, (_, i) => String(n - i));
  if (terms > max) return `${f.slice(0, 3).join("×")}×…×${n - terms + 1}`;
  return f.join("×");
}

function chanceText(result: Value | null): string | null {
  if (!result || !Number.isInteger(result.re) || result.re < 1 || result.re >= 1e15) return null;
  return result.re === 1 ? "certain (1 in 1)" : `1 in ${groupDigits(result.re)}`;
}

export function probabilityView(s: CalcState): ProbabilityView {
  const src = findSource(s, "probability");
  if (!src) return { source: null, entry: null, calc: null };
  const base = { source: src.from, entry: src.text };
  const node = src.parsed ? findNode(src.parsed.expr, (a) => kindOf(a) !== null) : null;
  if (!node) {
    // still being typed: name the operation from its first prb symbol
    const first = src.row.find((n) => n.t === "sym" && KIND_OF_SYM[n.s]);
    const kind = first && first.t === "sym" ? (KIND_OF_SYM[first.s] ?? null) : null;
    return { ...base, calc: kind ? emptyCalc(kind) : null };
  }
  return { ...base, calc: explain(s, node) };
}

function emptyCalc(kind: ProbKind): ProbCalc {
  const expr = { nPr: "n nPr r", nCr: "n nCr r", fact: "n!", rand: "rand", randint: "randint(A,B)" }[kind];
  const formula = { nPr: `n!/(n${MINUS}r)!`, nCr: `n!/(r!·(n${MINUS}r)!)`, fact: `n×(n${MINUS}1)×…×1`, rand: null, randint: null }[kind];
  return { kind, expr, formula, steps: null, result: null, error: null, chance: null, range: null };
}

function explain(s: CalcState, node: Ast): ProbCalc {
  const kind = kindOf(node)!;
  const scope = scopeOf(s);
  const show = (v: Value | null) => (v ? valueText(v, s.modes) : "?");
  // never draw random numbers to explain an expression (it would not match what enter gives)
  const safe = (a: Ast) => (usesRandom(a) ? null : tryEval(a, scope, s.modes));
  const outcome = usesRandom(node) ? null : evalOrError(node, scope, s.modes);
  const result = outcome && "value" in outcome ? outcome.value : null;
  const error = outcome && "error" in outcome ? outcome.error : null;
  const calc: ProbCalc = { ...emptyCalc(kind), result: result ? valueText(result, s.modes) : null, error };

  if (node.k === "bin") {
    const n = safe(node.a);
    const r = safe(node.b);
    calc.expr = `${show(n)} ${kind} ${show(r)}`;
    if (isCount(n) && isCount(r) && r.re <= n.re) {
      const N = n.re;
      const R = r.re;
      if (kind === "nPr") {
        calc.formula = `${N}!/(${N}${MINUS}${R})!`;
        calc.steps = fallingProduct(N, R);
      } else {
        const k = Math.min(R, N - R);
        calc.formula = `${N}!/(${R}!·${N - R}!)`;
        calc.steps = k === 0 ? "1" : k <= 6 ? `(${fallingProduct(N, k)})/(${fallingProduct(k, k)})` : null;
      }
      calc.chance = chanceText(result);
    }
  } else if (node.k === "post") {
    const n = safe(node.a);
    calc.expr = `${show(n)}!`;
    if (isCount(n)) {
      calc.formula = null;
      calc.steps = n.re === 0 ? "1 (by definition)" : n.re <= 12 ? fallingProduct(n.re, n.re, 12) : fallingProduct(n.re, n.re);
    }
  } else if (node.k === "call") {
    const lo = safe(node.args[0]!);
    const hi = node.args[1] ? safe(node.args[1]) : null;
    calc.expr = `randint(${show(lo)},${show(hi)})`;
    if (lo && hi && Number.isInteger(lo.re) && Number.isInteger(hi.re) && hi.re >= lo.re) {
      const count = hi.re - lo.re + 1;
      calc.range = { lo: show(lo), hi: show(hi), count };
      calc.chance = `1/${groupDigits(count)} for each integer`;
    }
    calc.result = null; // a random draw: the block does not draw one
  } else {
    calc.result = null;
  }
  return calc;
}
