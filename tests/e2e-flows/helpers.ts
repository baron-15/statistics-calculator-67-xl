/**
 * Helpers for the end-to-end flows: the calculator is driven only by keystroke scripts
 * (runScript), and what the screen shows is read back from the View (home text, canvas text
 * lines, highlighted items) or rendered and compared pixel for pixel with a TI-SmartView capture.
 */
import { expect } from "vitest";
import { rowText, runScript, view, type CalcState } from "../../src/engine";
import type { CanvasScreen, DrawItem, Indicator, View } from "../../src/engine/screen";
import { FONT_METRICS } from "../../src/display/metrics";
import { tokens } from "../../src/display/fonts";
import { frameText, renderView } from "../../src/display/render";
import { diffRows, indicatorsOf } from "../display/build";
import { parseFixture } from "../display/fixtures";
import { homeText, initialState } from "../helpers/run";

export { homeText, initialState };

/** Expand `TOKEN×N` into N copies of TOKEN; everything else is passed to runScript unchanged. */
export function expand(script: string): string {
  return script
    .trim()
    .split(/\s+/)
    .flatMap((tok) => {
      const m = /^(.+)×(\d+)$/.exec(tok);
      return m && m[1] && m[2] ? Array<string>(Number(m[2])).fill(m[1]) : [tok];
    })
    .join(" ");
}

/** Run a keystroke script from `from` (default: a fresh calculator). */
export function run(script: string, from: CalcState = initialState()): CalcState {
  const s = expand(script);
  return s ? runScript(s, from) : from;
}

/** The last history item as "entry = result" (with ◂▸ after a toggled entry). */
export const last = (s: CalcState): string => homeText(s).at(-2) ?? "";

/** The entry line being typed (home screen). */
export const entry = (s: CalcState): string => homeText(s).at(-1) ?? "";

/** The history items as "entry = result" lines, oldest first. */
export const lines = (s: CalcState): string[] => homeText(s).slice(0, -1);

export function canvasOf(s: CalcState): CanvasScreen {
  const v = view(s);
  if (v.screen.kind !== "canvas") throw new Error(`not a canvas screen (${v.screen.kind}, app ${s.app.kind})`);
  return v.screen;
}

type TextItem = Extract<DrawItem, { t: "text" }>;
type RectItem = Extract<DrawItem, { t: "rect" }>;
type MathItem = Extract<DrawItem, { t: "math" }>;


/** Split canvas text into its glyph cells, as the renderer does (`R◂▸P` is 3 cells, `x̄=` 2). */
export function cells(text: string): string[] {
  const out: string[] = [];
  let start = 0;
  for (let i = 1; i <= text.length; i++) {
    // a cell ends at i when the next character starts a new glyph
    if (i === text.length || tokens(text.slice(0, i + 1)).length > tokens(text.slice(0, i)).length) {
      out.push(text.slice(start, i));
      start = i;
    }
  }
  return out;
}

/**
 * The canvas as text lines, top to bottom: items whose tops lie within 4 rows of each other form one
 * line (K= is lowered under a raised ²), joined left to right with one space; math items read as
 * rowText and empty ones are skipped. Menu lines read "1:nPr", the mode screen "DEG RAD GRAD", the
 * data editor's author line "L1(5)=".
 */
export function screenLines(s: CalcState): string[] {
  const items = canvasOf(s)
    .items.filter((i): i is TextItem | MathItem => (i.t === "text" && i.text !== "") || (i.t === "math" && i.row.length > 0))
    .sort((a, b) => a.y - b.y);
  const groups: (TextItem | MathItem)[][] = [];
  let top = -Infinity;
  for (const i of items) {
    if (i.y - top > 4) {
      groups.push([]);
      top = i.y;
    }
    groups.at(-1)?.push(i);
  }
  return groups.map((g) =>
    g
      .sort((a, b) => a.x - b.x)
      .map((i) => (i.t === "text" ? i.text : rowText(i.row)))
      .join(" "),
  );
}

/** Text lying under an inverse box, by glyph cell: the highlighted tab, item number, mode choice, cell. */
export function highlighted(s: CalcState): string[] {
  const items = canvasOf(s).items;
  const boxes = items.filter((i): i is RectItem => i.t === "rect" && i.mode === "invert");
  const out: string[] = [];
  for (const t of items.filter((i): i is TextItem => i.t === "text")) {
    const cs = cells(t.text);
    const a = FONT_METRICS[t.font].advance;
    for (const b of boxes) {
      const oy = Math.min(t.y + FONT_METRICS[t.font].height, b.y + b.h) - Math.max(t.y, b.y);
      if (oy <= 0) continue;
      // cells whose glyph columns (x+1 … x+advance−1) lie inside the box
      const part = cs.filter((_, k) => t.x + k * a + 1 >= b.x && t.x + (k + 1) * a - 1 <= b.x + b.w).join("");
      if (part) out.push(part);
    }
  }
  return out;
}

export const indicators = (s: CalcState): Indicator[] => view(s).indicators;

/** Pixel difference between the rendered state and a capture (count 0 = identical). */
export function captureDiff(s: CalcState, name: string, blinkOn = false): { count: number; text: string } {
  const f = parseFixture(name);
  return diffRows(f.rows, frameText(renderView(view(s), { blinkOn })));
}

/**
 * Expect the rendered state to match capture `name` pixel for pixel, and (unless `strip` is false)
 * the lit indicators to equal the capture's.
 */
export function expectCapture(s: CalcState, name: string, opts: { blinkOn?: boolean; strip?: boolean } = {}): void {
  const d = captureDiff(s, name, opts.blinkOn ?? false);
  expect(d.count, `${name}\n${d.text}`).toBe(0);
  if (opts.strip !== false) {
    expect(view(s).indicators, `${name} indicators`).toEqual(indicatorsOf(parseFixture(name)));
  }
}

/** Mode-change scripts as printed in the guidebook (the mode cursor starts on DEG; ▼ keeps the column). */
export const MODE = {
  CLASSIC: "MODE DOWN DOWN DOWN ENTER CLEAR",
  MATHPRINT: "MODE DOWN DOWN DOWN RIGHT ENTER CLEAR",
  SCI: "MODE DOWN RIGHT ENTER CLEAR",
  ENG: "MODE DOWN RIGHT RIGHT ENTER CLEAR",
  NORM: "MODE DOWN ENTER CLEAR",
  FLOAT: "MODE DOWN DOWN ENTER CLEAR",
  FIX: (n: number) => `MODE DOWN DOWN ${"RIGHT ".repeat(n + 1)}ENTER CLEAR`,
  RAD: "MODE RIGHT ENTER CLEAR",
  DEG: "MODE ENTER CLEAR",
} as const;

// ---------------------------------------------------------------------------------------------
// Reading the rendered frame back as text (big-font cells), for scrolling and arrow checks

const GLYPH_CACHE = new Map<string, string>();

/** The 6×8 pixel cell of one big-font character drawn at the top left, as a string key. */
function glyphKey(ch: string): string {
  let k = GLYPH_CACHE.get(ch);
  if (k === undefined) {
    const v: View = { screen: { kind: "canvas", items: [{ t: "text", x: 0, y: 0, font: "big", text: ch }] }, indicators: [], contrast: 8, on: true };
    k = frameText(renderView(v, { blinkOn: false })).slice(0, 8).map((r) => r.slice(0, 6)).join("\n");
    GLYPH_CACHE.set(ch, k);
  }
  return k;
}

/**
 * The 16 cells of the screen line whose glyph tops are at row `top`, read back from the rendered
 * frame by matching each 6×8 cell against the big-font glyphs of `alphabet` ("?" when none matches).
 */
export function readLine(s: CalcState, top: number, alphabet = "0123456789+−*÷().◀▶ ", blinkOn = false): string {
  const rows = frameText(renderView(view(s), { blinkOn }));
  let out = "";
  for (let c = 0; c < 16; c++) {
    const key = rows.slice(top, top + 8).map((r) => r.slice(c * 6, c * 6 + 6)).join("\n");
    out += [...alphabet].find((a) => glyphKey(a) === key) ?? "?";
  }
  return out;
}

/** Is the matrix pixel (x, y) lit in the rendered frame? */
export function lit(s: CalcState, x: number, y: number, blinkOn = false): boolean {
  return frameText(renderView(view(s), { blinkOn }))[y]?.[x] === "#";
}
