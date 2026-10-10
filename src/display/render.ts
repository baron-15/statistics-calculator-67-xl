/**
 * Renderer (Agent D): View → 96 × 31 pixel frame + lit indicator segments.
 * Fonts come from ./fonts/*.json (extracted from TI-SmartView captures) plus ./glyphs.ts; layout
 * rules from docs/research/display.md. Golden fixtures: tests/fixtures/lcd_dumps.txt, checked in
 * tests/display/golden.test.ts.
 *
 * API for the other agents:
 * - renderView(view, { blinkOn }) → Frame;
 * - frameText(frame) → 31 strings of "#"/".";
 * - textWidth(font, text) → pixels (one advance per glyph cell);
 * - layoutRow(row, { mathprint }) → { width, height, axis, cells } of a home-screen row;
 * - homeLayout(screen) → line tops and whether lines are hidden above/below (↑/↓ hints).
 */
import type { Indicator, View } from "../engine/screen";
import { Bitmap } from "./bitmap";
import { renderCanvas } from "./canvas";
import { renderHome } from "./home";
import { MATRIX_H, MATRIX_W } from "./metrics";

export { textWidth } from "./fonts";
export { layoutRow, type RowMetrics } from "./layout";
export { homeLayout, type HomeLayout } from "./home";

export interface Frame {
  /** row-major, MATRIX_W × MATRIX_H, 1 = lit */
  pixels: Uint8Array;
  indicators: Indicator[];
  contrast: number;
  on: boolean;
}

export interface RenderOptions {
  /** cursor blink phase: true = cursor drawn */
  blinkOn: boolean;
}

export function renderView(view: View, opts: RenderOptions): Frame {
  const bm = new Bitmap();
  if (view.on) {
    const s = view.screen;
    if (s.kind === "home") renderHome(bm, s, opts.blinkOn);
    else if (s.kind === "canvas") renderCanvas(bm, s, opts.blinkOn);
  }
  return { pixels: bm.pixels, indicators: view.indicators, contrast: view.contrast, on: view.on };
}

/** Frame as text rows of "#"/"." (tests compare against tests/fixtures/lcd_dumps.txt). */
export function frameText(f: Frame): string[] {
  const rows: string[] = [];
  for (let y = 0; y < MATRIX_H; y++) {
    let s = "";
    for (let x = 0; x < MATRIX_W; x++) s += f.pixels[y * MATRIX_W + x] ? "#" : ".";
    rows.push(s);
  }
  return rows;
}
