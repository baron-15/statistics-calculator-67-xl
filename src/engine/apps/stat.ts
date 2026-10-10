/**
 * 2nd stat: the 1-Var / 2-Var setup wizards and the calculation (K §3.5; M §5.2–§5.5; D §6;
 * captures MF_stats1var04, MF_stats2var04).
 *
 * The wizard uses the 4×5 font at a 6-row pitch: `1-VAR STATS` / `DATA: L1 L2 L3` /
 * `FRQ: ONE L1 L2 L3` / `CALC` at x=70 on the bottom line (`ẋDATA:` / `ẏDATA:` for 2-Var); each row's chosen option
 * is inverse and the cursor box blinks on the option under the cursor.
 * ▲ ▼ change rows (landing on that row's chosen option), ◄ ► move along a row, enter chooses the
 * option and moves down (GB-079b/c: `▼ ► ► enter` then `enter` calculates), enter on CALC
 * calculates. The choices are remembered (GB-079e). clear returns Home. SPEC: assumption for the
 * auto-advance and the landing column, which the guidebook keystrokes imply.
 *
 * Errors: no data → STAT; FRQ list of a different length → DIM MISMATCH; a frequency < 0 or > 99 →
 * FRQ DOMAIN; 2-Var lists of different lengths → STAT (GB p.37).
 */
import { CalcError } from "../errors";
import type { Action } from "../keys";
import { oneVarStats, twoVarStats } from "../math";
import type { CanvasScreen, DrawItem } from "../screen";
import type { CalcState } from "../state";
import { choiceBox, invert, menuText, MENU_ADV } from "./canvas";
import { glyphCount } from "./format";
import { tryCalc } from "./home";
import { homeApp, openApp, openMenu, showError } from "./nav";
import type { AppState, StatRecord } from "./types";
import { clamp } from "./util";

type WizardApp = Extract<AppState, { kind: "statWizard" }>;

interface WizRow {
  label: string;
  options: string[];
}

function rows(vars: 1 | 2): WizRow[] {
  return vars === 1
    ? [{ label: "DATA: ", options: ["L1", "L2", "L3"] }, { label: "FRQ: ", options: ["ONE", "L1", "L2", "L3"] }]
    : [{ label: "ẋDATA: ", options: ["L1", "L2", "L3"] }, { label: "ẏDATA: ", options: ["L1", "L2", "L3"] }];
}

/** The chosen column of wizard row 0 or 1. */
function chosen(s: CalcState, vars: 1 | 2, row: number): number {
  const st = s.apps.statSetup;
  if (vars === 1) return row === 0 ? st.data : st.freq + 1;
  return row === 0 ? st.x : st.y;
}

export const startWizard = (s: CalcState, vars: 1 | 2): CalcState =>
  ({ ...s, app: { kind: "statWizard", vars, row: 0, col: chosen(s, vars, 0) } });

export function wizardKey(s: CalcState, a: Action): CalcState {
  const app = s.app;
  if (app.kind !== "statWizard") return s;
  const opts = (r: number) => rows(app.vars)[r]?.options.length ?? 1;
  const goRow = (row: number): CalcState =>
    ({ ...s, app: { ...app, row, col: row < 2 ? chosen(s, app.vars, row) : 0 } });
  switch (a) {
    case "UP": return goRow(Math.max(0, app.row - 1));
    case "DOWN": return goRow(Math.min(2, app.row + 1));
    case "LEFT": case "RIGHT":
      if (app.row === 2) return s;
      return { ...s, app: { ...app, col: clamp(app.col + (a === "LEFT" ? -1 : 1), 0, opts(app.row) - 1) } };
    case "ENTER": {
      if (app.row === 2) return calculate(s, app);
      const st = { ...s.apps.statSetup };
      if (app.vars === 1) {
        if (app.row === 0) st.data = app.col;
        else st.freq = app.col - 1;
      } else if (app.row === 0) st.x = app.col;
      else st.y = app.col;
      const next: CalcState = { ...s, apps: { ...s.apps, statSetup: st } };
      return { ...next, app: { ...app, row: app.row + 1, col: app.row + 1 < 2 ? chosen(next, app.vars, app.row + 1) : 0 } };
    }
    case "CLEAR": return { ...s, app: homeApp() };
    default: return openApp(s, a, homeApp()) ?? s;
  }
}

function calculate(s: CalcState, app: WizardApp): CalcState {
  const st = s.apps.statSetup;
  const re = (i: number) => (s.apps.lists[i] ?? []).map((v) => v.re);
  const r = tryCalc((): StatRecord => {
    if (app.vars === 1) {
      const data = re(st.data);
      const freq = st.freq < 0 ? null : re(st.freq);
      if (data.length === 0) throw new CalcError("STAT");
      if (freq && freq.length !== data.length) throw new CalcError("DIM MISMATCH");
      if (freq && freq.some((f) => f < 0 || f > 99)) throw new CalcError("FRQ DOMAIN");
      const res = oneVarStats(data, freq);
      return { kind: "1-Var", title: `1-Var:L${st.data + 1},${freq ? `L${st.freq + 1}` : "One"}`, items: res.items };
    }
    const xs = re(st.x);
    const ys = re(st.y);
    if (xs.length === 0 || xs.length !== ys.length) throw new CalcError("STAT");
    const res = twoVarStats(xs, ys, null);
    return { kind: "2-Var", title: `2-Var:L${st.x + 1},L${st.y + 1}`, items: res.items };
  });
  if (!r.ok) return showError(s, r.error, app);
  const next: CalcState = { ...s, apps: { ...s.apps, stat: r.value } };
  // the results screen is the StatVars menu; selecting an item pastes it on Home
  return openMenu(next, "statVars", homeApp());
}

/** x of each option in a wizard row: the row text is one string in the 5-px advance from x=0. */
function optionXs(row: WizRow): number[] {
  let x = glyphCount(row.label) * MENU_ADV;
  return row.options.map((o) => {
    const at = x;
    x += (o.length + 1) * MENU_ADV;
    return at;
  });
}

const CALC_X = 70;
const CALC_Y = 24;

export function wizardView(s: CalcState): CanvasScreen {
  const app = s.app as WizardApp;
  const items: DrawItem[] = [menuText(0, 0, app.vars === 1 ? "1-VAR STATS" : "2-VAR STATS")];
  const boxes: DrawItem[] = [];
  rows(app.vars).forEach((r, i) => {
    const y = 6 * (i + 1);
    items.push(menuText(0, y, r.label + r.options.join(" ")));
    const xs = optionXs(r);
    const c = chosen(s, app.vars, i);
    const b = choiceBox(xs[c] ?? 0, y, r.options[c]?.length ?? 1);
    boxes.push(invert(b.x, b.y, b.w, b.h));
  });
  items.push(menuText(CALC_X, CALC_Y, "CALC"));
  let cursor;
  if (app.row === 2) cursor = choiceBox(CALC_X, CALC_Y, 4);
  else {
    const r = rows(app.vars)[app.row] as WizRow;
    cursor = choiceBox(optionXs(r)[app.col] ?? 0, 6 * (app.row + 1), r.options[app.col]?.length ?? 1);
  }
  return { kind: "canvas", items: [...items, ...boxes], cursor: { ...cursor, style: "block" } };
}
