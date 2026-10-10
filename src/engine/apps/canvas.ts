/**
 * Canvas-screen building blocks, in matrix pixels, following the measured rules of
 * docs/research/display.md §2–§7 and the TI-SmartView captures in tests/fixtures/lcd_dumps.txt.
 *
 * Text-item convention (for the renderer): a text item's `x` is where the font bitmap of its first
 * character is drawn and `y` is the glyph's top row; each further character is one advance to the
 * right (metrics.ts). The big-font bitmaps are 6 px wide with the blank spacer column on the left,
 * so big text at cell k has x = 6k (glyph columns 6k+1 … 6k+5). The 4×5 menu-font bitmaps are
 * 4 px wide with the spacer on the right, so menu text is placed at its first glyph column.
 *
 * Math-item convention: `x` is the left edge of the row's first cell (as for big text) and `y` the
 * top of the row's line box (MathPrint lines are top-aligned, D §5.7).
 */
import { CELL_W, FONT_METRICS, LINE_H } from "../../display/metrics";
import { slotRow, sym, type Cursor, type Node, type Row, type SymId } from "../expr";
import { symCells } from "../editor";
import type { CursorStyle, DrawItem } from "../screen";
import { glyphCount } from "./format";

export const MENU_ADV = FONT_METRICS.menu.advance;

export const bigText = (x: number, y: number, text: string): DrawItem => ({ t: "text", x, y, font: "big", text });
export const menuText = (x: number, y: number, text: string): DrawItem => ({ t: "text", x, y, font: "menu", text });
export const invert = (x: number, y: number, w: number, h: number): DrawItem => ({ t: "rect", x, y, w, h, mode: "invert" });
export const fill = (x: number, y: number, w: number, h: number): DrawItem => ({ t: "rect", x, y, w, h, mode: "fill" });
export const math = (x: number, y: number, row: Row): DrawItem => ({ t: "math", x, y, row });

/** Width in px of big text (6-px cells). */
export const bigWidth = (text: string): number => glyphCount(text) * CELL_W;

/**
 * Inverse box of a big-font title or tab (D §4): its cells plus one column on the right, rows 0–7.
 * `Clear Var` covers columns 0–54; `PRB` 0–18; `RAND` (at cell 4) 24–48.
 */
export const titleBox = (cell: number, text: string, line = 0): DrawItem =>
  invert(cell * CELL_W, line * LINE_H, bigWidth(text) + 1, LINE_H);

/**
 * Inverse box of a 4×5 menu-font choice (MODE screen, stat wizards, D §4): one column left of the
 * first glyph to one column right of the last, glyph rows plus one: `DEG` at x=1 → columns 0–15.
 */
export const choiceBox = (x: number, y: number, chars: number): { x: number; y: number; w: number; h: number } =>
  ({ x: x - 1, y, w: chars * MENU_ADV + 1, h: FONT_METRICS.menu.height + 1 });

// ------------------------------------------------------------------------------------------------
// Menus (D §6; K §3.1)

/** Item numbers: 1–9, then A, B, C, … (K §3.1). */
export const itemNumber = (i: number): string => "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] ?? "?";

export interface MenuLine {
  /** text after the number and separator, e.g. "nPr", "Clear L1", "x̄=52.5" */
  label: string;
  /** a variable name drawn with the variable glyph (Recall Var `1:x=15`) before `label` */
  variable?: SymId;
}

/**
 * A menu screen: the tab bar (or single title) on line 1 with only the active tab inverse and one
 * blank cell between tabs; three items on lines 2–4 as `n:label`, only the selected item's `n:`
 * cells inverse (columns 0–11); `↑` / `↓` replace the colon of the first / last visible item when
 * more items lie above / below (D §6, E7, E8).
 */
export function menuItems(tabs: string[], active: number, lines: MenuLine[], selected: number, top: number): DrawItem[] {
  const items: DrawItem[] = [];
  let cell = 0;
  const boxes: DrawItem[] = [];
  tabs.forEach((t, i) => {
    items.push(bigText(cell * CELL_W, 0, t));
    if (i === active) boxes.push(titleBox(cell, t));
    cell += glyphCount(t) + 1;
  });
  for (let k = 0; k < 3; k++) {
    const i = top + k;
    const line = lines[i];
    if (!line) break;
    const y = (k + 1) * LINE_H;
    const sep = k === 0 && top > 0 ? "↑" : k === 2 && i < lines.length - 1 ? "↓" : ":";
    if (line.variable) {
      items.push(bigText(0, y, itemNumber(i) + sep), math(2 * CELL_W, y, [sym(line.variable)]), bigText(3 * CELL_W, y, line.label));
    } else {
      items.push(bigText(0, y, itemNumber(i) + sep + line.label));
    }
    if (i === selected) boxes.push(invert(0, y, 2 * CELL_W, LINE_H));
  }
  return [...items, ...boxes];
}

/** Keep the selected item inside the 3-line window, moving the window as little as possible. */
export function scrollTop(top: number, selected: number, count: number): number {
  let t = top;
  if (selected < t) t = selected;
  if (selected > t + 2) t = selected - 2;
  return Math.max(0, Math.min(t, Math.max(0, count - 3)));
}

// ------------------------------------------------------------------------------------------------
// An approximate MathPrint layout, only to place the blinking cursor of a canvas entry line
// (K= and y=). Widths use the 6-px advance of both the big and the small font (D §5.1); vertical
// offsets follow D §5.2–§5.4: exponents 2 rows above the base, numerators 3 rows above it
// (bar on the axis), denominators 5 rows below it.

export function rowWidth(r: Row): number {
  return r.reduce((w, n) => w + nodeWidth(n), 0);
}

const slotW = (r: Row): number => Math.max(rowWidth(r), CELL_W);

function nodeWidth(n: Node): number {
  switch (n.t) {
    case "sym": return symCells(n.s) * CELL_W;
    case "frac": return Math.max(slotW(n.num), slotW(n.den));
    case "mixed": return slotW(n.whole) + Math.max(slotW(n.num), slotW(n.den));
    case "pow": return slotW(n.exp);
    case "sqrt": return CELL_W + slotW(n.rad);
    case "root": return slotW(n.index) + CELL_W + slotW(n.rad);
    case "ee": return 3 * CELL_W + slotW(n.exp);
  }
}

/** Rows between the line-box top and the top of the row's big glyphs. */
export function rowAscent(r: Row): number {
  let a = 0;
  for (const n of r) {
    switch (n.t) {
      case "frac": case "mixed": a = Math.max(a, 3); break;
      case "pow": case "ee": a = Math.max(a, 2); break;
      case "sqrt": case "root": {
        const inner = rowAscent(n.rad);
        a = Math.max(a, inner > 0 ? inner + 4 : 2);
        break;
      }
      default: break;
    }
  }
  return a;
}

/** The cursor box of an entry drawn as a math item at (x0, top). */
export function cursorBox(root: Row, c: Cursor, x0: number, top: number, style: CursorStyle) {
  let x = x0;
  let y = top + rowAscent(root);
  let small = false;
  let row = root;
  for (const step of c.path) {
    for (let i = 0; i < step.node; i++) x += nodeWidth(row[i] as Node);
    const n = row[step.node] as Node;
    const centre = (part: Row, other: Row) => Math.floor((Math.max(slotW(part), slotW(other)) - slotW(part)) / 2);
    switch (n.t) {
      case "frac":
        x += step.slot === "num" ? centre(n.num, n.den) : centre(n.den, n.num);
        y += step.slot === "num" ? -3 : 5;
        break;
      case "mixed":
        if (step.slot !== "whole") {
          x += slotW(n.whole) + (step.slot === "num" ? centre(n.num, n.den) : centre(n.den, n.num));
          y += step.slot === "num" ? -3 : 5;
        }
        break;
      case "pow": y -= 2; break;
      case "ee": x += 3 * CELL_W; y -= 2; break;
      case "sqrt": x += CELL_W; break;
      case "root":
        if (step.slot === "index") y -= 2;
        else x += slotW(n.index) + CELL_W;
        break;
      default: break;
    }
    small = small || step.slot !== "rad" && step.slot !== "whole";
    row = slotRow(n, step.slot);
  }
  for (let i = 0; i < c.index; i++) x += nodeWidth(row[i] as Node);
  return { x: x + 1, y, w: 5, h: small ? 5 : 7, style };
}
