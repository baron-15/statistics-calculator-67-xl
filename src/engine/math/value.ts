/**
 * Calculator values (Agent B). `re` is the 13-significant-digit real value. `exact`, when present,
 * is the exact MathPrint form the TI-30XS can display: (n/d)·√root·π^pi, e.g. 1/2, 2√2, 144π, 5√2/2.
 *
 * Invariants kept by the engine (./exact.ts): d > 0, gcd(n, d) = 1, root ≥ 1 is square-free, zero is
 * { n: 0, d: 1, root: 1, pi: false }, and a radical never occurs together with π (a·√b·π is not a form
 * the device is known to show, so such a product is a decimal; M §3.5).
 */
export interface Exact {
  n: bigint;
  d: bigint;
  /** radicand ≥ 1 (1 = no radical) */
  root: bigint;
  pi: boolean;
}

/**
 * How a result is displayed when it is not the default form. Set by the conversions:
 * - "mixed": ▸n/d◂▸Un/d turned an improper fraction into a mixed number (4⌴1/2);
 * - "percent": ▸% shows the value ×100 with a % suffix (the value itself is unchanged: 1/5▸% is 0.2);
 * - "dms": ▸DMS shows decimal degrees as D°M′S″ (the value itself is unchanged).
 */
export type ValueForm = "mixed" | "percent" | "dms";

export interface Value {
  re: number;
  exact?: Exact;
  /** display form chosen by a conversion; absent = the default form */
  form?: ValueForm;
}

export const real = (re: number): Value => ({ re });
