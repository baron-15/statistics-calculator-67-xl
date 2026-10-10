/**
 * Home screen composition (D §3, §5.7; K §4.5, §4.8, §4.17).
 *
 * - Each history item is an entry box, left-aligned, and a result box, right-aligned. They share a
 *   line when entry cells + result cells ≤ 14 (see entryCells), otherwise the result gets its own
 *   line. Boxes on a
 *   line are top-aligned (GS_order06, E3; GS_lastans03 and MF_log10xB are older builds, see tests).
 * - Lines are separated by 1 blank row. Content up to 31 rows is top-aligned; taller content is
 *   bottom-aligned at row 30, and a line that would be cut at the top is not drawn (MF_Trig6-2,
 *   MF_Trig7-3, GS_mem_p02/p03; MF_log10xB disagrees).
 * - A line wider than 16 cells is cut: cell 15 shows ▶ (MF_StAngle08/09). The current entry scrolls
 *   so the cursor stays visible, with ◀ in cell 0 when text is hidden on the left.
 * - The selected history item is inverse over its full cells and one row below (D §4).
 * - The current entry is the last line. An empty entry takes no line and shows no cursor while
 *   history is shown: none of the ~40 captures taken after enter shows one, and full screens keep
 *   4 history lines (GS_scroll04, MF_Percent05). On a cleared screen (no history line shown) the
 *   empty entry is line 1 with the cursor at the top left (K §4.3).
 */
import { sym, type Row } from "../engine/expr";
import type { HomeScreen } from "../engine/screen";
import type { Bitmap } from "./bitmap";
import { glyph } from "./fonts";
import { cursorRect, layoutTop, type Box, type Caret } from "./layout";
import { MATRIX_H, MATRIX_W } from "./metrics";

/** Columns of the 16 cells; cell 15 is 90–95. */
const W = MATRIX_W;
const LAST_CELL = W - 6;

interface Part {
  box: Box;
  x: number;
  selected: boolean;
  /** horizontal scroll of the current entry (pixels hidden on the left) */
  scroll: number;
  current: boolean;
}

interface Line {
  h: number;
  parts: Part[];
  /** the selected history item is on this line */
  selected: boolean;
}

export interface HomeLayout {
  lines: { top: number; h: number }[];
  /** some history line is above the screen top (not drawn) */
  hiddenAbove: boolean;
  /** some line is below the screen bottom (only while browsing history) */
  hiddenBelow: boolean;
}

/** ^ and ×10ⁿ templates in a row, at any depth. */
function scripts(row: Row): number {
  let n = 0;
  for (const node of row) {
    if (node.t === "pow" || node.t === "ee") n++;
    if (node.t !== "sym") for (const v of Object.values(node)) if (Array.isArray(v)) n += scripts(v as Row);
  }
  return n;
}

/**
 * Cells an entry counts for the same-line rule: its drawn cells, plus one per ^ or ×10ⁿ template.
 * MF_log04 puts `e^.5` (3 drawn cells) and an 11-cell result on separate lines, while the 3-cell
 * `√2◂▸` and `2π◂▸` share a line with 11-cell results (GS_modempsqrt, MF_Pi2). SPEC: assumption,
 * from that one capture; no capture contradicts it.
 */
const entryCells = (row: Row, box: Box): number => box.w / 6 + scripts(row);

/** Pick the smallest scroll (in whole cells) that keeps the cursor cell visible between the arrows. */
function entryScroll(box: Box): number {
  const c = box.caret;
  if (box.w <= W || !c) return 0;
  for (let off = 0; off < box.w; off += 6) {
    const left = off > 0 ? off + 6 : 0;
    const right = off + W < box.w ? off + LAST_CELL : off + W;
    if (c.x >= left && c.x + 6 <= right) return off;
  }
  return Math.max(0, box.w - W);
}

function buildLines(s: HomeScreen): { lines: Line[]; current: Part | null } {
  const mp = s.mathprint;
  const lines: Line[] = [];
  const part = (box: Box, x: number, selected: boolean): Part => ({ box, x, selected, scroll: 0, current: false });
  for (let i = Math.max(0, s.firstShown); i < s.history.length; i++) {
    const h = s.history[i];
    if (!h) continue;
    const entryRow: Row = h.toggled ? [...h.entry, sym("toggle")] : h.entry;
    const E = layoutTop(entryRow, mp);
    const R = layoutTop(h.result, mp);
    const selE = s.selected?.line === i && s.selected.part === "entry";
    const selR = s.selected?.line === i && s.selected.part === "result";
    const rx = Math.max(0, W - R.w);
    if (entryCells(entryRow, E) + R.w / 6 <= 14) {
      lines.push({ h: Math.max(E.h, R.h), parts: [part(E, 0, selE), part(R, rx, selR)], selected: selE || selR });
    } else {
      lines.push({ h: E.h, parts: [part(E, 0, selE)], selected: selE });
      lines.push({ h: R.h, parts: [part(R, rx, selR)], selected: selR });
    }
  }
  let current: Part | null = null;
  if (s.entry.length > 0 || lines.length === 0) {
    const E = layoutTop(s.entry, mp, s.cursor);
    current = { box: E, x: 0, selected: false, scroll: s.cursor ? entryScroll(E) : 0, current: true };
    lines.push({ h: E.h, parts: [current], selected: false });
  }
  return { lines, current };
}

/** Line tops: top-aligned when everything fits, else bottom-aligned; scrolled to a selected item. */
function placeLines(lines: Line[]): number[] {
  const total = lines.reduce((t, l) => t + l.h, 0) + Math.max(0, lines.length - 1);
  const tops: number[] = [];
  let y = total <= MATRIX_H ? 0 : MATRIX_H - total;
  for (const l of lines) {
    tops.push(y);
    y += l.h + 1;
  }
  const sel = lines.findIndex((l) => l.selected);
  const st = tops[sel];
  if (st !== undefined && st < 0) return tops.map((t) => t - st);
  return tops;
}

export function homeLayout(s: HomeScreen): HomeLayout {
  const { lines } = buildLines(s);
  const tops = placeLines(lines);
  const out = lines.map((l, i) => ({ top: tops[i] ?? 0, h: l.h }));
  return {
    lines: out,
    hiddenAbove: out.some((l) => l.top < 0) || s.firstShown > 0,
    hiddenBelow: out.some((l) => l.top + l.h > MATRIX_H),
  };
}

function drawArrow(bm: Bitmap, key: "▶" | "◀", x: number, top: number, box: Box): void {
  bm.rect({ x, y: top, w: 6, h: box.h }, "clear");
  bm.glyph(glyph("big", key), x, top + box.axis - 3);
}

/** Draw a cursor block, underscore or exit block at a caret (D §7). */
export function drawCursor(bm: Bitmap, r: { x: number; y: number; w: number; h: number }, style: HomeScreen["cursorStyle"]): void {
  if (style === "insert") {
    bm.rect({ x: r.x, y: r.y + r.h - 1, w: r.w, h: 1 }, "fill");
    return;
  }
  bm.rect(r, "fill");
  if (style === "exit") {
    // a white ">" inside the block (GED handout); rows 1…h−2, widest in the middle
    for (let row = 1; row <= r.h - 2; row++) bm.set(r.x + Math.min(row, r.h - 1 - row), r.y + row, false);
  }
}

export function renderHome(bm: Bitmap, s: HomeScreen, blinkOn: boolean): void {
  const { lines, current } = buildLines(s);
  const tops = placeLines(lines);
  let caret: Caret | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const top = tops[i] ?? 0;
    if (!line || top < 0 || top + line.h > MATRIX_H) continue;
    for (const p of line.parts) {
      const { box } = p;
      const x = p.x - p.scroll;
      bm.clipped({ x: 0, y: top, w: W, h: MATRIX_H - top }, () => box.paint(bm, x, top));
      if (x + box.w > W) drawArrow(bm, "▶", LAST_CELL, top, box);
      if (p.scroll > 0) drawArrow(bm, "◀", 0, top, box);
      if (p.selected) bm.rect({ x: Math.max(0, x), y: top, w: Math.min(box.w, W - Math.max(0, x)), h: box.h + 1 }, "invert");
      if (p.current && box.caret) caret = { ...box.caret, x: box.caret.x + x, y: box.caret.y + top };
    }
  }
  if (blinkOn && s.cursor && current && caret) drawCursor(bm, cursorRect(caret), s.cursorStyle);
}
