/** A 96 × 31 one-bit pixel buffer with clipping, used by every drawing routine. */
import { glyph, tokens, FONTS, type FontKey, type Glyph } from "./fonts";
import { MATRIX_H, MATRIX_W } from "./metrics";

export interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

export class Bitmap {
  readonly pixels = new Uint8Array(MATRIX_W * MATRIX_H);
  /** drawing is limited to this rectangle (x0 ≤ x < x1, y0 ≤ y < y1) */
  private clip = { x0: 0, y0: 0, x1: MATRIX_W, y1: MATRIX_H };

  /** Run `fn` with drawing clipped to `r` (intersected with the screen). */
  clipped(r: Rect, fn: () => void): void {
    const saved = this.clip;
    this.clip = {
      x0: Math.max(saved.x0, r.x),
      y0: Math.max(saved.y0, r.y),
      x1: Math.min(saved.x1, r.x + r.w),
      y1: Math.min(saved.y1, r.y + r.h),
    };
    try {
      fn();
    } finally {
      this.clip = saved;
    }
  }

  private inClip(x: number, y: number): boolean {
    const c = this.clip;
    return x >= c.x0 && x < c.x1 && y >= c.y0 && y < c.y1;
  }

  set(x: number, y: number, on = true): void {
    if (this.inClip(x, y)) this.pixels[y * MATRIX_W + x] = on ? 1 : 0;
  }

  get(x: number, y: number): boolean {
    return x >= 0 && x < MATRIX_W && y >= 0 && y < MATRIX_H && this.pixels[y * MATRIX_W + x] === 1;
  }

  rect(r: Rect, mode: "fill" | "invert" | "clear"): void {
    for (let y = r.y; y < r.y + r.h; y++) {
      for (let x = r.x; x < r.x + r.w; x++) {
        if (!this.inClip(x, y)) continue;
        const i = y * MATRIX_W + x;
        this.pixels[i] = mode === "fill" ? 1 : mode === "clear" ? 0 : this.pixels[i] ? 0 : 1;
      }
    }
  }

  hline(x0: number, x1: number, y: number): void {
    for (let x = x0; x <= x1; x++) this.set(x, y);
  }

  vline(x: number, y0: number, y1: number): void {
    for (let y = y0; y <= y1; y++) this.set(x, y);
  }

  /** OR a glyph cell onto the buffer with its top-left at (x, y). */
  glyph(g: Glyph, x: number, y: number): void {
    for (let gy = 0; gy < g.h; gy++) {
      for (let gx = 0; gx < g.w; gx++) if (g.bits[gy * g.w + gx]) this.set(x + gx, y + gy);
    }
  }

  /** Draw a text run; returns the x after the last glyph. */
  text(font: FontKey, text: string, x: number, y: number): number {
    const adv = FONTS[font].advance;
    for (const k of tokens(text)) {
      this.glyph(glyph(font, k), x, y);
      x += adv;
    }
    return x;
  }
}
