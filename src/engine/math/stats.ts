/**
 * Statistics math (Agent B implements; Agent C's STATS screens call it). docs/research/math-stats.md §5.
 * Results are returned as the ordered item list shown on the results screen / StatVars menu.
 */
import { CalcError } from "../errors";
import type { SymId } from "../expr";

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

/** 1-Var stats: n x̄ Sx σx Σx Σx² minX Q1 Med Q3 maxX (11 items, TG p.85 order). */
export function oneVarStats(data: number[], freq: number[] | null): StatResults {
  void data; void freq;
  throw new CalcError("STAT", "not implemented");
}

/** 2-Var stats with linear regression y′ = a·x′ + b (21 items, guidebook order). */
export function twoVarStats(xs: number[], ys: number[], freq: number[] | null): StatResults {
  void xs; void ys; void freq;
  throw new CalcError("STAT", "not implemented");
}
