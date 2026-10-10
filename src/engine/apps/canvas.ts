/**
 * Canvas-screen building blocks, in matrix pixels, following the measured rules of
 * docs/research/display.md §2–§7 and the TI-SmartView captures in tests/fixtures/lcd_dumps.txt.
 *
 * Text-item convention (the renderer's, src/display/canvas.ts): `x` is the left edge of the first
 * character cell, spacer column first, and `y` the glyph's top row; each further character is one
 * advance to the right. Big text at cell k has x = 6k (glyph columns 6k+1 … 6k+5); 4×5 menu text
 * whose first glyph starts at column c has x = c − 1. Glyph text uses the renderer's characters:
 * `ẋ ẏ ż` for the memory variables, `≡` for the raised `=`, `⁄` for list fractions, `______` for
 * the end of a list.
 *
 * Math-item convention: `x` is the left edge of the row's first cell (as for big text) and `y` the
 * top of the row's line box (MathPrint lines are top-aligned, D §5.7).
 */
import { cursorRect, layoutRow, layoutTop } from "../../display/layout";
import { CELL_W, FONT_METRICS, LINE_H } from "../../display/metrics";
import type { Cursor, Row } from "../expr";
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
 * Inverse box of a 4×5 menu-font choice at text x (MODE screen, stat wizards, D §4): one column left
 * of the first glyph to one column right of the last, glyph rows plus one: `DEG` → columns 0–15.
 */
export const choiceBox = (x: number, y: number, chars: number): { x: number; y: number; w: number; h: number } =>
  ({ x, y, w: chars * MENU_ADV + 1, h: FONT_METRICS.menu.height + 1 });

// ------------------------------------------------------------------------------------------------
// Menus (D §6; K §3.1)

/** Item numbers: 1–9, then A, B, C, … (K §3.1). */
export const itemNumber = (i: number): string => "123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"[i] ?? "?";

export interface MenuLine {
  /** text after the number and separator, e.g. "nPr", "Clear L1", "x̄≡52.5", "ẋ=15" */
  label: string;
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
    items.push(bigText(0, y, itemNumber(i) + sep + line.label));
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
// Entry lines drawn as canvas math items (K= and y=): the renderer's own MathPrint layout places
// the prefix text and the blinking cursor.

/** Rows between the line-box top and the top of the row's 5×7 glyph line (2 under a script). */
export const rowAscent = (r: Row): number => layoutRow(r, { mathprint: true }).axis - 3;

/** The cursor box of an entry drawn as a math item at (x0, top). */
export function cursorBox(root: Row, c: Cursor, x0: number, top: number, style: CursorStyle) {
  const caret = layoutTop(root, true, c).caret;
  if (!caret) return { x: x0 + 1, y: top + rowAscent(root), w: 5, h: 7, style };
  const r = cursorRect(caret);
  return { x: x0 + r.x, y: top + r.y, w: r.w, h: r.h, style };
}
