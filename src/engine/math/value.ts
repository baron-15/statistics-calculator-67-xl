/**
 * Calculator values (Agent B). `re` is the 13-significant-digit real value. `exact`, when present,
 * is the exact MathPrint form the TI-30XS can display: (n/d)·√root·π^pi, e.g. 1/2, 2√2, 144π, 5√2/2.
 */
export interface Exact {
  n: bigint;
  d: bigint;
  /** radicand ≥ 1 (1 = no radical) */
  root: bigint;
  pi: boolean;
}

export interface Value {
  re: number;
  exact?: Exact;
}

export const real = (re: number): Value => ({ re });
