/** Default values of the apps-layer state slices. */
import type { AppsData, AppState } from "./types";

const ZERO = { re: 0, exact: { n: 0n, d: 1n, root: 1n, pi: false } };
const ONE = { re: 1, exact: { n: 1n, d: 1n, root: 1n, pi: false } };

export const APP_DEFAULTS: AppState = { kind: "home", selected: null };

export function appsDataDefaults(): AppsData {
  return {
    lists: [[], [], []],
    formulas: [null, null, null],
    statSetup: { data: 0, freq: -1, x: 0, y: 1 },
    stat: null,
    // Start=0, Step=1, Auto (GB p.34)
    table: { func: [], start: { ...ZERO, exact: { ...ZERO.exact } }, step: { ...ONE, exact: { ...ONE.exact } }, ask: false, xs: [] },
    constant: null,
  };
}

export const APPS_DATA_DEFAULTS: AppsData = appsDataDefaults();
