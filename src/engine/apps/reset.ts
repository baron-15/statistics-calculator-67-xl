/**
 * Power and memory reset (K §3.11, §6).
 *
 * - 2nd reset → 2:Yes and on+clear both return the modes to DEG NORM FLOAT MATHPRINT and clear the
 *   variables, Ans, history, lists and formulas, StatVars, the constant K, the table settings and
 *   function (K §3.11 says "probably") and the rand seed. The menu path then shows MEMORY CLEARED;
 *   on+clear goes straight to an empty Home screen.
 * - Contrast is a property of the glass, not memory, so a reset keeps it. SPEC: assumption.
 * - 2nd off keeps everything; on returns to a blank Home screen with the history still reachable
 *   with ▲ (TG p.31).
 */
import { emptyEditor } from "../editor";
import type { CalcState, VarName } from "../state";
import { DEFAULT_SEED, VARS, ZERO } from "./calc";
import { homeApp } from "./nav";
import { appsDataDefaults } from "./defaults";

export function resetMemory(s: CalcState): CalcState {
  return {
    ...s,
    second: false,
    hyp: false,
    modes: { angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" },
    editor: emptyEditor(),
    history: [],
    firstShown: 0,
    ans: ZERO,
    vars: Object.fromEntries(VARS.map((v) => [v, ZERO])) as Record<VarName, typeof ZERO>,
    apps: appsDataDefaults(),
    randSeed: DEFAULT_SEED,
    app: homeApp(),
  };
}

export function powerOff(s: CalcState): CalcState {
  return { ...s, on: false, second: false, hyp: false };
}

export function powerOn(s: CalcState): CalcState {
  return { ...s, on: true, second: false, hyp: false, app: homeApp(), editor: emptyEditor(), firstShown: s.history.length };
}

/** on and clear pressed together: reset at once, no menu or message (TG p.29, A-5). */
export function onClearReset(s: CalcState): CalcState {
  return { ...resetMemory(s), on: true };
}
