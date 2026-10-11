/**
 * Statistics math (Agent B implements; Agent C's STATS screens call it). docs/research/math-stats.md §5.
 * Results are returned as the ordered item list shown on the results screen / StatVars menu.
 *
 * - n is the sum of the frequencies; σx = √(Σf(x−x̄)²/n), Sx = √(Σf(x−x̄)²/(n−1)) (M §5.5).
 * - FRQ: each frequency must be 0–99 (FRQ DOMAIN). Non-integer frequencies are valid, but Sx (and Sy)
 *   is then undefined and shown as `Error` (value null; GB p.24, current firmware).
 * - Errors: no data points (or all frequencies 0), unequal list lengths → STAT; n = 1 → DIVIDE BY 0
 *   (GB p.37). 2-Var with all x equal has no regression line → DIVIDE BY 0, and with all y equal r is
 *   undefined → `r=Error` (SPEC: assumption).
 * - Quartiles: Tukey hinges (M §5.5 recommendation). Q1 is the median of the lower half and Q3 of the
 *   upper half of the sorted data (expanded by frequency); with an odd count the median belongs to both
 *   halves ("Q1: median of the elements between MinX and Med", GB p.24). This reproduces TG p.85
 *   (53 77 85 85 97 → Q1 = 77, Q3 = 85), which the TI-84 method (65, 91) does not. With non-integer
 *   frequencies the quartiles are weighted quantiles at ¼, ½, ¾ of the total weight, averaging the two
 *   neighbours on an exact boundary (SPEC: assumption, M §5.5 [unverified]).
 * - Every value is normalized to 13 significant digits.
 */
import { CalcError } from "../errors";
import type { SymId } from "../expr";
import { norm } from "./decimal";

export interface StatItem {
  /** the StatVars symbol, e.g. "stat_xbar" */
  key: SymId;
  /** null = shown as "Error" (e.g. Sx with non-integer frequencies); x′ and y′ have no value (they paste "x′(" / "y′(") */
  value: number | null;
}

export interface StatResults {
  kind: "1-Var" | "2-Var";
  items: StatItem[];
}

interface Weighted {
  x: number;
  f: number;
}

function checkFreq(freq: number[] | null, len: number): number[] {
  if (!freq) return new Array<number>(len).fill(1);
  if (freq.length !== len) throw new CalcError("STAT", "frequency list length");
  for (const f of freq) if (!(f >= 0 && f <= 99)) throw new CalcError("FRQ DOMAIN");
  return freq;
}

const sum = (xs: number[]): number => xs.reduce((s, v) => s + v, 0);

interface Moments {
  n: number;
  mean: number;
  /** Σf(x−x̄)² */
  ss: number;
  sum: number;
  sum2: number;
  min: number;
  max: number;
}

function moments(xs: number[], fs: number[]): Moments {
  const n = sum(fs);
  const s = sum(xs.map((x, i) => fs[i]! * x));
  const mean = s / n;
  let min = Infinity;
  let max = -Infinity;
  xs.forEach((x, i) => {
    if (fs[i]! > 0) {
      min = Math.min(min, x);
      max = Math.max(max, x);
    }
  });
  return {
    n,
    mean,
    ss: sum(xs.map((x, i) => fs[i]! * (x - mean) ** 2)),
    sum: s,
    sum2: sum(xs.map((x, i) => fs[i]! * x * x)),
    min,
    max,
  };
}

const sd = (ss: number, df: number): number => norm(Math.sqrt(ss / df));

/** 1-Var stats: n x̄ Sx σx Σx Σx² minX Q1 Med Q3 maxX (11 items, TG p.85 order). */
export function oneVarStats(data: number[], freq: number[] | null): StatResults {
  if (data.length === 0) throw new CalcError("STAT", "no data");
  const fs = checkFreq(freq, data.length);
  const m = moments(data, fs);
  if (m.n === 0) throw new CalcError("STAT", "no data");
  if (m.n === 1) throw new CalcError("DIVIDE BY 0");
  const integral = fs.every((f) => Number.isInteger(f));
  const q = quartiles(data.map((x, i) => ({ x, f: fs[i]! })).filter((p) => p.f > 0), integral);
  return {
    kind: "1-Var",
    items: [
      { key: "stat_n", value: norm(m.n) },
      { key: "stat_xbar", value: norm(m.mean) },
      { key: "stat_Sx", value: integral ? sd(m.ss, m.n - 1) : null },
      { key: "stat_sx", value: sd(m.ss, m.n) },
      { key: "stat_Sumx", value: norm(m.sum) },
      { key: "stat_Sumx2", value: norm(m.sum2) },
      { key: "stat_minX", value: m.min },
      { key: "stat_Q1", value: q.q1 },
      { key: "stat_Med", value: q.med },
      { key: "stat_Q3", value: q.q3 },
      { key: "stat_maxX", value: m.max },
    ],
  };
}

/**
 * 2-Var stats with linear regression y′ = a·x′ + b (21 items, guidebook order; items 4–B and J–L are
 * inferred, M §5.3): n x̄ Sx σx Σx Σx² ȳ Sy σy Σy Σy² Σxy a b r x′ y′ minX maxX minY maxY.
 * The setup screen has no frequency list (M §5.2); `freq` is accepted for completeness.
 */
export function twoVarStats(xs: number[], ys: number[], freq: number[] | null): StatResults {
  if (xs.length === 0 || ys.length === 0) throw new CalcError("STAT", "no data");
  if (xs.length !== ys.length) throw new CalcError("STAT", "lists of unequal length");
  const fs = checkFreq(freq, xs.length);
  const mx = moments(xs, fs);
  const my = moments(ys, fs);
  if (mx.n === 0) throw new CalcError("STAT", "no data");
  if (mx.n === 1) throw new CalcError("DIVIDE BY 0");
  if (mx.ss === 0) throw new CalcError("DIVIDE BY 0", "no regression line");
  const integral = fs.every((f) => Number.isInteger(f));
  const sxy = sum(xs.map((x, i) => fs[i]! * (x - mx.mean) * (ys[i]! - my.mean)));
  const a = norm(sxy / mx.ss);
  const b = norm(norm(my.mean) - norm(a * norm(mx.mean)));
  const r = my.ss === 0 ? null : norm(sxy / Math.sqrt(mx.ss * my.ss));
  return {
    kind: "2-Var",
    items: [
      { key: "stat_n", value: norm(mx.n) },
      { key: "stat_xbar", value: norm(mx.mean) },
      { key: "stat_Sx", value: integral ? sd(mx.ss, mx.n - 1) : null },
      { key: "stat_sx", value: sd(mx.ss, mx.n) },
      { key: "stat_Sumx", value: norm(mx.sum) },
      { key: "stat_Sumx2", value: norm(mx.sum2) },
      { key: "stat_ybar", value: norm(my.mean) },
      { key: "stat_Sy", value: integral ? sd(my.ss, my.n - 1) : null },
      { key: "stat_sy", value: sd(my.ss, my.n) },
      { key: "stat_Sumy", value: norm(my.sum) },
      { key: "stat_Sumy2", value: norm(my.sum2) },
      { key: "stat_Sumxy", value: norm(sum(xs.map((x, i) => fs[i]! * x * ys[i]!))) },
      { key: "stat_a", value: a },
      { key: "stat_b", value: b },
      { key: "stat_r", value: r },
      { key: "stat_xprime", value: null },
      { key: "stat_yprime", value: null },
      { key: "stat_minX", value: mx.min },
      { key: "stat_maxX", value: mx.max },
      { key: "stat_minY", value: my.min },
      { key: "stat_maxY", value: my.max },
    ],
  };
}

/** The values to put in EvalContext.statVars (items with a value). */
export function statVarsOf(r: StatResults): Partial<Record<SymId, number>> {
  const out: Partial<Record<SymId, number>> = {};
  for (const it of r.items) if (it.value !== null) out[it.key] = it.value;
  return out;
}

function quartiles(pairs: Weighted[], integral: boolean): { q1: number; med: number; q3: number } {
  const sorted = [...pairs].sort((p, q) => p.x - q.x);
  if (!integral) {
    return { q1: weightedQuantile(sorted, 0.25), med: weightedQuantile(sorted, 0.5), q3: weightedQuantile(sorted, 0.75) };
  }
  const total = sum(sorted.map((p) => p.f));
  /** the k-th smallest (0-based) of the data expanded by frequency */
  const kth = (k: number): number => {
    let c = 0;
    for (const p of sorted) {
      c += p.f;
      if (k < c) return p.x;
    }
    return sorted.at(-1)!.x;
  };
  /** median of expanded positions lo … lo+len−1 */
  const median = (lo: number, len: number): number =>
    norm((kth(lo + Math.floor((len - 1) / 2)) + kth(lo + Math.ceil((len - 1) / 2))) / 2);
  const half = Math.ceil(total / 2); // odd counts include the median in both halves
  return { q1: median(0, half), med: median(0, total), q3: median(total - half, half) };
}

function weightedQuantile(sorted: Weighted[], p: number): number {
  const total = sum(sorted.map((q) => q.f));
  const target = p * total;
  let c = 0;
  for (let i = 0; i < sorted.length; i++) {
    c += sorted[i]!.f;
    if (Math.abs(c - target) < 1e-12 * total) return norm((sorted[i]!.x + (sorted[i + 1] ?? sorted[i]!).x) / 2);
    if (c > target) return sorted[i]!.x;
  }
  return sorted.at(-1)!.x;
}
