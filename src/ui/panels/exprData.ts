/**
 * Shared helpers for blocks that explain one calculation (Probability, Angles & trig): find the
 * entry to explain (the one being typed, else the newest history entry that uses the feature), parse
 * it with the engine's parser, and evaluate parts of it with the engine's evaluator in the
 * calculator's own context (Ans, variables, modes).
 */
import type { CalcState, Row } from "../../engine";
import { evalContext } from "../../engine/apps/calc";
import { evalAst, type EvalScope } from "../../engine/math/evaluate";
import { finalize, type Value } from "../../engine/math";
import { parseEntry, type Ast, type Entry } from "../../engine/math/parse";
import { rowFeatures, type FeatureId } from "./featureContext";
import { readableRow } from "./text";

export interface Source {
  row: Row;
  /** the entry being typed on Home, or a history entry */
  from: "entry" | "history";
  /** the entry as readable text */
  text: string;
  /** the history result, as readable text */
  result: string | null;
  /** the parsed entry, or null while it is incomplete */
  parsed: Entry | null;
}

const parse = (row: Row): Entry | null => {
  try {
    return parseEntry(row);
  } catch {
    return null;
  }
};

/** The entry to explain for a feature: the Home entry if it uses it, else the newest history entry that does. */
export function findSource(s: CalcState, feature: FeatureId): Source | null {
  if (s.app.kind === "home" && rowFeatures(s.editor.row).has(feature)) {
    return { row: s.editor.row, from: "entry", text: readableRow(s.editor.row), result: null, parsed: parse(s.editor.row) };
  }
  for (let i = s.history.length - 1; i >= 0; i--) {
    const rec = s.history[i]!;
    if (rec.toggled || !rowFeatures(rec.entry).has(feature)) continue;
    return { row: rec.entry, from: "history", text: readableRow(rec.entry), result: readableRow(rec.result), parsed: parse(rec.entry) };
  }
  return null;
}

/** The evaluator's scope for this state, optionally with another Ans and angle mode. rand draws do not touch the state. */
export function scopeOf(s: CalcState, opts: { ans?: Value; angle?: CalcState["modes"]["angle"] } = {}): EvalScope {
  const { ctx } = evalContext(s);
  return {
    env: { mp: s.modes.display === "MATHPRINT", angle: opts.angle ?? s.modes.angle },
    ans: opts.ans ?? ctx.ans,
    vars: ctx.vars,
    statVars: ctx.statVars,
    random: ctx.random,
  };
}

/** Evaluate an expression tree; null on any calculator error. */
export function tryEval(a: Ast, scope: EvalScope, modes: CalcState["modes"]): Value | null {
  try {
    const v = finalize(evalAst(a, scope), modes);
    return Number.isFinite(v.re) ? v : null;
  } catch {
    return null;
  }
}

/** Evaluate an expression tree, or report the calculator's error message. */
export function evalOrError(a: Ast, scope: EvalScope, modes: CalcState["modes"]): { value: Value } | { error: string } {
  try {
    return { value: finalize(evalAst(a, scope), modes) };
  } catch (e) {
    return { error: e instanceof Error && "kind" in e ? String((e as { kind: unknown }).kind) : "SYNTAX" };
  }
}

function children(a: Ast): Ast[] {
  switch (a.k) {
    case "neg":
    case "post":
    case "sqrt":
      return [a.a];
    case "bin":
      return [a.a, a.b];
    case "dms":
      return a.parts;
    case "frac":
      return [a.num, a.den];
    case "mixed":
      return [a.whole, a.num, a.den];
    case "root":
      return [a.index, a.a];
    case "call":
      return a.args;
    default:
      return [];
  }
}

/** The first node in reading order (pre-order) that matches. */
export function findNode(a: Ast, match: (n: Ast) => boolean): Ast | null {
  if (match(a)) return a;
  for (const c of children(a)) {
    const found = findNode(c, match);
    if (found) return found;
  }
  return null;
}
