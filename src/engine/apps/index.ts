/**
 * Apps layer (Agent C): the key router for every screen, history, memory and modes, and all
 * non-home screens: mode, prb / angle / recall / clear var / reset menus, sto▸, data editor,
 * stat (1-Var/2-Var, StatVars), table, constant K, contrast, error screens. Also builds the View.
 * See docs/SPEC.md §Apps.
 *
 * Module map: home.ts (entry, enter, history), menus.ts (all list menus), mode.ts, data.ts +
 * lists.ts (data editor, formulas), stat.ts (wizards), table.ts, constant.ts (2nd K), reset.ts
 * (power, reset), canvas.ts (pixel layout helpers), format.ts (restricted number text, value rows),
 * calc.ts (evaluation context), nav.ts (moving between screens).
 *
 * Error screen (SPEC: assumption; no TI capture exists, K §7): the bare message name from the
 * guidebook (`DIVIDE BY 0`, `SYNTAX`, `EQUATION LENGTH ERROR`) in the big font, centred, starting on
 * line 2 like `MEMORY CLEARED`, wrapped at spaces when longer than 16 cells. Only clear dismisses it
 * (2nd quit, off and contrast still work); clear returns to the screen that raised it.
 *
 * Indicators (SPEC: assumption for ↑ ↓, K §5): ↑ while history exists above (also on a blank
 * screen), ↓ while a history item is highlighted; in the data editor they mean rows hidden above /
 * below, and L1 L2 L3 are lit. FIX / SCI / ENG / K / the angle unit follow the modes everywhere.
 */
import type { Action } from "../keys";
import type { CanvasScreen, Indicator, Screen, View } from "../screen";
import type { CalcState } from "../state";
import { bigText } from "./canvas";
import { constantKey, constantScreen } from "./constant";
import { dataArrows, dataKey, dataView } from "./data";
import { glyphCount } from "./format";
import { homeArrows, homeKey, homeView } from "./home";
import { menuKey, menuView } from "./menus";
import { modeKey, modeView } from "./mode";
import { goHome } from "./nav";
import { powerOff } from "./reset";
import { wizardKey, wizardView } from "./stat";
import { tableFuncKey, tableFuncView, tableSetupKey, tableSetupView, tableView, tableViewKey } from "./table";

export type { AppState, AppsData, HistoryRecord, MenuId, Selection, StatRecord, TableData } from "./types";
export { APP_DEFAULTS, APPS_DATA_DEFAULTS } from "./defaults";
export { onClearReset, powerOn, resetMemory } from "./reset";
export { menuText } from "./menus";

/** Contrast levels 0–15 (D §9: 16 levels, saturating). */
export const CONTRAST_MAX = 15;

/** Route an action (2nd already resolved) to the active screen. */
export function routeAction(s0: CalcState, a: Action): CalcState {
  // 2nd hyp waits for the next key: a trig key uses it, any other key cancels it (K §4.14)
  if (a === "HYP") return { ...s0, hyp: !s0.hyp };
  const hyp = s0.hyp;
  const s: CalcState = hyp ? { ...s0, hyp: false } : s0;
  switch (a) {
    case "OFF": return powerOff(s);
    case "ON": return s;
    case "CONTRAST_DARKER": return { ...s, contrast: Math.min(CONTRAST_MAX, s.contrast + 1) };
    case "CONTRAST_LIGHTER": return { ...s, contrast: Math.max(0, s.contrast - 1) };
    case "QUIT": return goHome(s, true);
    default: break;
  }
  const app = s.app;
  switch (app.kind) {
    case "home": return homeKey(s, a, hyp);
    case "error": return a === "CLEAR" ? { ...s, app: app.back } : s;
    case "message": {
      // MEMORY CLEARED: clear gives an empty Home screen; other keys act there directly
      const home = goHome(s, true);
      return a === "CLEAR" ? home : homeKey(home, a, hyp);
    }
    case "menu": return menuKey(s, a);
    case "mode": return modeKey(s, a);
    case "constant": return constantKey(s, a, hyp);
    case "data": return dataKey(s, a, hyp);
    case "statWizard": return wizardKey(s, a);
    case "tableFunc": return tableFuncKey(s, a, hyp);
    case "tableSetup": return tableSetupKey(s, a, hyp);
    case "tableView": return tableViewKey(s, a, hyp);
  }
}

/** Build what the display should show. */
export function buildView(s: CalcState): View {
  return {
    screen: s.on ? screenOf(s) : { kind: "blank" },
    indicators: s.on ? indicators(s) : [],
    contrast: s.contrast,
    on: s.on,
  };
}

function screenOf(s: CalcState): Screen {
  const app = s.app;
  switch (app.kind) {
    case "home": return homeView(s);
    case "error": return messageScreen(app.error);
    case "message": return messageScreen(app.text);
    case "menu": return menuView(s);
    case "mode": return modeView(s);
    case "constant": return constantScreen(s, app.editor.row, app.editor);
    case "data": return dataView(s);
    case "statWizard": return wizardView(s);
    case "tableFunc": return tableFuncView(s);
    case "tableSetup": return tableSetupView(s);
    case "tableView": return tableView(s);
  }
}

/** A message centred on the 16-cell lines from line 2 down (`MEMORY CLEARED` at cell 1, K §3.11). */
export function messageScreen(text: string): CanvasScreen {
  const lines: string[] = [];
  for (const word of text.split(" ")) {
    const last = lines.at(-1);
    if (last !== undefined && glyphCount(`${last} ${word}`) <= 16) lines[lines.length - 1] = `${last} ${word}`;
    else lines.push(word);
  }
  return {
    kind: "canvas",
    items: lines.map((l, i) => bigText(Math.floor((16 - glyphCount(l)) / 2) * 6, 8 * (i + 1), l)),
  };
}

/**
 * Indicators in the order of their segments along the strip (the captures list them so:
 * `[L1] [L2] [L3] DEG UP`, `K DEG UP DOWN`, `FIX DEG UP`); 2nd and HYP, never captured, are placed
 * in the free area left of FIX (D §2.2).
 */
const STRIP_ORDER: Indicator[] = ["l1", "2nd", "hyp", "fix", "k", "l2", "sci", "eng", "l3", "deg", "rad", "grad", "busy", "up", "down"];

export function indicators(s: CalcState): Indicator[] {
  return litIndicators(s).sort((a, b) => STRIP_ORDER.indexOf(a) - STRIP_ORDER.indexOf(b));
}

function litIndicators(s: CalcState): Indicator[] {
  const out: Indicator[] = [];
  if (s.second) out.push("2nd");
  if (s.hyp) out.push("hyp");
  if (s.modes.decimals !== "FLOAT") out.push("fix");
  if (s.modes.notation === "SCI") out.push("sci");
  if (s.modes.notation === "ENG") out.push("eng");
  if (s.apps.constant?.on) out.push("k");
  out.push(s.modes.angle === "DEG" ? "deg" : s.modes.angle === "RAD" ? "rad" : "grad");
  const app = s.app;
  if (app.kind === "home") {
    const { up, down } = homeArrows(s);
    if (up) out.push("up");
    if (down) out.push("down");
  } else if (app.kind === "data") {
    out.push("l1", "l2", "l3");
    const { up, down } = dataArrows(s);
    if (up) out.push("up");
    if (down) out.push("down");
  }
  return out;
}
