/**
 * The mode screen (K §2; D §6, E9 = GS_ModeDefaults): four rows in the 4×5 font at a 6-row pitch,
 * every current setting inverse, a blinking cursor box on the option under the cursor.
 *
 * - The cursor starts on DEG every time (GB-055: `[mode] [enter]` from RAD selects DEG).
 * - ▲ ▼ change rows keeping the column (clamped); ◄ ► move within a row without wrapping.
 *   SPEC: assumption (only moves from column 0 are documented).
 * - enter selects; clear or 2nd quit leaves. CLASSIC ↔ MATHPRINT clears history, the pending entry
 *   and the constant K (TG p.35). History already shown is not reformatted (K §2.2).
 */
import { emptyEditor } from "../editor";
import type { Action } from "../keys";
import type { Modes } from "../math";
import type { CanvasScreen, DrawItem } from "../screen";
import type { CalcState } from "../state";
import { choiceBox, invert, menuText, MENU_ADV } from "./canvas";
import { homeApp, openApp } from "./nav";
import { clamp } from "./util";

/** Pixel rows of the four mode lines. */
const ROW_Y = [0, 6, 12, 18];

interface Opt {
  text: string;
  x: number;
}

/** Options per row with their x (first glyph column). Words use a 5-px advance; FIX digits a 6-px advance from x=31. */
const ROWS: Opt[][] = [
  words(["DEG", "RAD", "GRAD"]),
  words(["NORM", "SCI", "ENG"]),
  [{ text: "FLOAT", x: 1 }, ...Array.from({ length: 10 }, (_, i) => ({ text: String(i), x: 31 + 6 * i }))],
  words(["CLASSIC", "MATHPRINT"]),
];

function words(ws: string[]): Opt[] {
  let x = 1;
  return ws.map((text) => {
    const o = { text, x };
    x += (text.length + 1) * MENU_ADV;
    return o;
  });
}

/** Column of the current setting in each row. */
function current(m: Modes): number[] {
  return [
    ["DEG", "RAD", "GRAD"].indexOf(m.angle),
    ["NORM", "SCI", "ENG"].indexOf(m.notation),
    m.decimals === "FLOAT" ? 0 : m.decimals + 1,
    m.display === "CLASSIC" ? 0 : 1,
  ];
}

export function modeKey(s: CalcState, a: Action): CalcState {
  const app = s.app;
  if (app.kind !== "mode") return s;
  const width = (r: number) => ROWS[r]?.length ?? 1;
  const at = (row: number, col: number): CalcState => ({ ...s, app: { kind: "mode", row, col: clamp(col, 0, width(row) - 1) } });
  switch (a) {
    case "UP": return at(Math.max(0, app.row - 1), app.col);
    case "DOWN": return at(Math.min(3, app.row + 1), app.col);
    case "LEFT": return at(app.row, app.col - 1);
    case "RIGHT": return at(app.row, app.col + 1);
    case "CLEAR": return { ...s, app: homeApp() };
    case "ENTER": return selectMode(s, app.row, app.col);
    // other screens open from here; their clear returns Home
    default: return openApp(s, a, homeApp()) ?? s;
  }
}

function selectMode(s: CalcState, row: number, col: number): CalcState {
  const m = s.modes;
  switch (row) {
    case 0: return { ...s, modes: { ...m, angle: (["DEG", "RAD", "GRAD"] as const)[col] ?? m.angle } };
    case 1: return { ...s, modes: { ...m, notation: (["NORM", "SCI", "ENG"] as const)[col] ?? m.notation } };
    case 2: return { ...s, modes: { ...m, decimals: col === 0 ? "FLOAT" : ((col - 1) as Modes["decimals"]) } };
    case 3: {
      const display = col === 0 ? "CLASSIC" : "MATHPRINT";
      if (display === m.display) return s;
      // switching Classic ↔ MathPrint clears history and the constant K (TG p.35)
      return {
        ...s,
        modes: { ...m, display },
        history: [],
        firstShown: 0,
        editor: emptyEditor(),
        apps: { ...s.apps, constant: null },
      };
    }
    default: return s;
  }
}

export function modeView(s: CalcState): CanvasScreen {
  const app = s.app;
  const items: DrawItem[] = [];
  const boxes: DrawItem[] = [];
  const sel = current(s.modes);
  ROWS.forEach((opts, r) => {
    const y = ROW_Y[r] ?? 0;
    opts.forEach((o, c) => {
      items.push(menuText(o.x, y, o.text));
      if (sel[r] === c) {
        const b = choiceBox(o.x, y, o.text.length);
        boxes.push(invert(b.x, b.y, b.w, b.h));
      }
    });
  });
  const screen: CanvasScreen = { kind: "canvas", items: [...items, ...boxes] };
  if (app.kind === "mode") {
    const o = ROWS[app.row]?.[app.col];
    if (o) screen.cursor = { ...choiceBox(o.x, ROW_Y[app.row] ?? 0, o.text.length), style: "block" };
  }
  return screen;
}
