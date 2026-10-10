/**
 * The complete calculator state: pure JSON-like data (bigints aside) so it can be persisted and
 * replayed. Each module owns its slice's type and defaults; this file only composes them.
 */
import { APP_DEFAULTS, APPS_DATA_DEFAULTS, type AppState, type AppsData, type HistoryRecord } from "./apps";
import { EDITOR_DEFAULTS, type EditorState } from "./editor";
import type { Modes, Value } from "./math";

export type VarName = "x" | "y" | "z" | "t" | "a" | "b" | "c";
export const VAR_NAMES: VarName[] = ["x", "y", "z", "t", "a", "b", "c"];

export const MODE_DEFAULTS: Modes = { angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" };

export interface CalcState {
  version: 1;
  on: boolean;
  /** 2nd pressed, waiting for the next key */
  second: boolean;
  /** 2nd hyp pressed, waiting for a trig key */
  hyp: boolean;
  modes: Modes;
  editor: EditorState;
  /** oldest first */
  history: HistoryRecord[];
  /** index of the first history line shown (lines above were cleared off the screen but can be scrolled to) */
  firstShown: number;
  ans: Value;
  vars: Record<VarName, Value>;
  app: AppState;
  apps: AppsData;
  /** LCD contrast 0–15 */
  contrast: number;
  randSeed: number;
}

export function initialState(): CalcState {
  const zero: Value = { re: 0, exact: { n: 0n, d: 1n, root: 1n, pi: false } };
  return {
    version: 1,
    on: true,
    second: false,
    hyp: false,
    modes: { ...MODE_DEFAULTS },
    editor: structuredClone(EDITOR_DEFAULTS),
    history: [],
    firstShown: 0,
    ans: zero,
    vars: Object.fromEntries(VAR_NAMES.map((v) => [v, zero])) as Record<VarName, Value>,
    app: structuredClone(APP_DEFAULTS),
    apps: structuredClone(APPS_DATA_DEFAULTS),
    contrast: 8,
    randSeed: 12345,
  };
}
