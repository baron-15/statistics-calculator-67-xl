/** Builders for hand-made Views in the display golden tests. */
import { SYMS, sym, type Cursor, type Node, type Row, type SymId } from "../../src/engine/expr";
import type { CanvasScreen, DrawItem, HistoryLine, Indicator, View } from "../../src/engine/screen";
import { frameText, renderView } from "../../src/display/render";
import { parseFixture, type Fixture } from "./fixtures";

// ---------------------------------------------------------------------------------------------
// Rows from text: longest match over the SYMS texts, e.g. tx("sin(30°)") = sin 3 0 deg rparen.

const BY_TEXT = new Map<string, SymId>();
for (const id of Object.keys(SYMS) as SymId[]) {
  const t = SYMS[id];
  if (!BY_TEXT.has(t)) BY_TEXT.set(t, id);
}
// spellings that are easier to type, or that SYMS reads differently
for (const [t, id] of [["÷", "div"], ["-", "sub"], ["'", "min"], ["\"", "sec"], ["ẋ", "x"], ["ẏ", "y"], ["ż", "z"], ["nPr", "nPr"], ["nCr", "nCr"]] as [string, SymId][]) BY_TEXT.set(t, id);
const TEXTS = [...BY_TEXT.keys()].sort((a, b) => b.length - a.length);

export function tx(text: string): Row {
  const out: Row = [];
  let i = 0;
  while (i < text.length) {
    const t = TEXTS.find((s) => text.startsWith(s, i));
    if (!t) throw new Error(`tx: no symbol at "${text.slice(i)}"`);
    out.push(sym(BY_TEXT.get(t) as SymId));
    i += t.length;
  }
  return out;
}

type R = Row | string;
const row = (r: R): Row => (typeof r === "string" ? tx(r) : r);
/** Concatenate text and nodes into one row. */
export const cat = (...parts: (R | Node)[]): Row => parts.flatMap((p) => (typeof p === "string" ? tx(p) : Array.isArray(p) ? p : [p]));

export const frac = (num: R, den: R): Node => ({ t: "frac", num: row(num), den: row(den) });
export const mixed = (whole: R, num: R, den: R): Node => ({ t: "mixed", whole: row(whole), num: row(num), den: row(den) });
export const pow = (exp: R): Node => ({ t: "pow", exp: row(exp) });
export const sqrt = (rad: R): Node => ({ t: "sqrt", rad: row(rad) });
export const root = (index: R, rad: R): Node => ({ t: "root", index: row(index), rad: row(rad) });
export const ee = (exp: R): Node => ({ t: "ee", exp: row(exp) });

// ---------------------------------------------------------------------------------------------
// Views

const IND: Record<string, Indicator> = {
  DEG: "deg", RAD: "rad", GRAD: "grad", UP: "up", DOWN: "down", FIX: "fix", SCI: "sci", ENG: "eng", K: "k",
  "[L1]": "l1", "[L2]": "l2", "[L3]": "l3", "2ND": "2nd", HYP: "hyp",
};
export const indicatorsOf = (f: Fixture): Indicator[] => f.indicators.flatMap((l): Indicator[] => { const i = IND[l]; return i ? [i] : []; });

export interface HomeSpec {
  mp?: boolean;
  /** [entry, result] or [entry, result, toggled] */
  history?: [R | Node[], R | Node[], boolean?][];
  entry?: R;
  /** cursor index in the top-level entry; default: at the end. null = browsing history */
  cursor?: Cursor | null;
  cursorStyle?: "block" | "insert" | "exit";
  firstShown?: number;
  selected?: { line: number; part: "entry" | "result" } | null;
}

const asRow = (r: R | Node[]): Row => (typeof r === "string" ? tx(r) : r);

export function home(spec: HomeSpec, indicators: Indicator[] = []): View {
  const history: HistoryLine[] = (spec.history ?? []).map(([e, r, t]) => ({ entry: asRow(e), result: asRow(r), ...(t ? { toggled: true } : {}) }));
  const entry = row(spec.entry ?? "");
  return {
    screen: {
      kind: "home",
      mathprint: spec.mp ?? true,
      history,
      firstShown: spec.firstShown ?? 0,
      entry,
      cursor: spec.cursor === undefined ? { path: [], index: entry.length } : spec.cursor,
      cursorStyle: spec.cursorStyle ?? "block",
      selected: spec.selected ?? null,
    },
    indicators,
    contrast: 8,
    on: true,
  };
}

export function canvas(items: DrawItem[], indicators: Indicator[] = [], cursor?: CanvasScreen["cursor"]): View {
  return { screen: { kind: "canvas", items, ...(cursor ? { cursor } : {}) }, indicators, contrast: 8, on: true };
}

/** Big-font text on line n (0–3) at cell c. */
export const line = (n: number, text: string, c = 0): DrawItem => ({ t: "text", x: c * 6, y: n * 8, font: "big", text });
/** Inverse box over cells [c0, c1) of line n, plus `extra` columns (titles and tabs get 1). */
export const inv = (n: number, c0: number, c1: number, extra = 0): DrawItem => ({ t: "rect", x: c0 * 6, y: n * 8, w: (c1 - c0) * 6 + extra, h: 8, mode: "invert" });

// ---------------------------------------------------------------------------------------------
// Comparison

/**
 * Merged view of two frames: "#" lit in both, "." dark in both, "+" lit only in the render,
 * "-" lit only in the capture. Rows that differ are marked with "!".
 */
export function diffRows(expected: string[], actual: string[]): { count: number; text: string } {
  let count = 0;
  const lines = expected.map((e, y) => {
    const a = actual[y] ?? "";
    let s = "";
    let bad = false;
    for (let x = 0; x < e.length; x++) {
      const ec = e[x] === "#";
      const ac = a[x] === "#";
      if (ec === ac) s += ec ? "#" : ".";
      else {
        s += ac ? "+" : "-";
        bad = true;
        count++;
      }
    }
    return `${bad ? "!" : " "}${String(y).padStart(2)} ${s}`;
  });
  return { count, text: `${count} pixel(s) differ ("+" rendered only, "-" captured only):\n${lines.join("\n")}` };
}

export function renderRows(view: View, blinkOn = true): string[] {
  return frameText(renderView(view, { blinkOn }));
}

/** Render `view` and compare it with capture `name`; returns the readable diff ("" when equal). */
export function compareWithCapture(name: string, view: (ind: Indicator[]) => View, blinkOn = true): { count: number; text: string; indicatorsOk: boolean } {
  const f = parseFixture(name);
  const ind = indicatorsOf(f);
  const v = view(ind);
  const frame = renderView(v, { blinkOn });
  const d = diffRows(f.rows, frameText(frame));
  return { ...d, indicatorsOk: JSON.stringify(frame.indicators) === JSON.stringify(ind) };
}
