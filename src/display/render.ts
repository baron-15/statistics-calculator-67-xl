/**
 * Renderer (Agent D): View → 96 × 31 pixel frame + lit indicator segments.
 * Fonts come from ./fonts/*.json (extracted from TI-SmartView captures); layout rules from
 * docs/research/display.md. Golden fixtures: tests/fixtures/lcd_dumps.txt.
 */
import type { Indicator, View } from "../engine/screen";
import { MATRIX_H, MATRIX_W } from "./metrics";

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
  void opts;
  return { pixels: new Uint8Array(MATRIX_W * MATRIX_H), indicators: view.indicators, contrast: view.contrast, on: view.on };
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
