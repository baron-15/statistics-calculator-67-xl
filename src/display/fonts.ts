/**
 * The four ROM fonts as cell bitmaps (D §8). Every glyph is stored as one full advance cell, spacer
 * columns included, so a run of glyphs is drawn by stepping x by the advance.
 *
 * - big 5×7, 6-px advance, glyph in cell columns 1–5 (home screen, menus).
 * - small 5×5, 6-px advance, columns 1–5 (MathPrint fraction parts, exponents, root index).
 * - menu 4×5, 5-px advance, columns 1–4 (MODE screen, wizards, data editor, table).
 * - tiny 3×4 (second-level MathPrint scripts). On a canvas it uses the 4-px advance of
 *   FONT_METRICS (columns 1–3). Inside MathPrint layout it sits in a 6-px cell at columns 2–4, as
 *   the ² of `5²` in MF_frac08 does ("tinyMP").
 *
 * Text is split into glyph tokens with a few multi-character sequences that the ROM draws as one
 * glyph: `⁻¹`, `x̄`, `◂▸`, and the `n/d` of `▸n/d◂▸Un/d` (MF_frac02).
 */
import bigJson from "./fonts/font_big.json";
import smallJson from "./fonts/font_mathprint_small.json";
import menuJson from "./fonts/font_menu_small.json";
import editorJson from "./fonts/font_editor_small.json";
import { BIG_EXTRA, MENU_EXTRA, SMALL_EXTRA, TINY } from "./glyphs";
import type { FontId } from "./metrics";

export type FontKey = FontId | "tinyMP";

export interface Glyph {
  /** cell width = the font's advance */
  w: number;
  h: number;
  /** row-major w × h, 1 = lit */
  bits: Uint8Array;
}

export interface Font {
  key: FontKey;
  advance: number;
  height: number;
  /** vertical axis row used to align mixed fonts in MathPrint rows (center, rounded down) */
  axis: number;
  glyphs: Map<string, Glyph>;
}

type Table = Record<string, string[]>;

function toGlyph(rows: string[], w: number, padLeft: number): Glyph {
  const h = rows.length;
  if (rows.some((r) => r.length + padLeft > w)) throw new Error(`glyph wider than its ${w}-px cell: ${rows.join("|")}`);
  const bits = new Uint8Array(w * h);
  rows.forEach((r, y) => {
    for (let i = 0; i < r.length; i++) if (r[i] === "#") bits[y * w + padLeft + i] = 1;
  });
  return { w, h, bits };
}

function build(key: FontKey, advance: number, height: number, axis: number, sources: [Table, number][]): Font {
  const glyphs = new Map<string, Glyph>();
  for (const [table, padLeft] of sources) {
    for (const [ch, rows] of Object.entries(table)) {
      if (glyphs.has(ch)) continue;
      if (rows.length !== height) throw new Error(`font ${key}: glyph ${ch} has ${rows.length} rows`);
      glyphs.set(ch, toGlyph(rows, advance, padLeft));
    }
  }
  return { key, advance, height, axis, glyphs };
}

/** Same-shape aliases: the ROM has one glyph for these pairs. */
const ALIASES: Record<string, string> = {
  "′": "'", "″": "\"", "-": "−", "−": "-", "⁄": "/", "÷": "/", "ᴇ": "E",
};

export const FONTS: Record<FontKey, Font> = {
  // The extracted big glyphs are 6 wide, spacer column included; designed ones get the spacer added.
  big: build("big", 6, 7, 3, [[bigJson as Table, 0], [BIG_EXTRA, 1]]),
  small: build("small", 6, 5, 2, [[smallJson as Table, 1], [SMALL_EXTRA, 1], [menuJson as Table, 1], [MENU_EXTRA, 1]]),
  menu: build("menu", 5, 5, 2, [[menuJson as Table, 1], [editorJson as Table, 1], [MENU_EXTRA, 1]]),
  tiny: build("tiny", 4, 4, 1, [[TINY, 1]]),
  tinyMP: build("tinyMP", 6, 4, 1, [[TINY, 2]]),
};

/** Multi-character sequences drawn as a single glyph, longest first. */
const SEQUENCES: [string, string][] = [
  ["n/d", "ⁿ"],
  ["⁻¹", "¹"],
  ["◂▸", "⇔"],
  ["x\u0304", "§"],
  ["x\u0305", "§"],
  ["y\u0304", "ȳ"],
  ["y\u0305", "ȳ"],
];

/** Split text into glyph keys (one per cell). */
export function tokens(text: string): string[] {
  const out: string[] = [];
  let i = 0;
  outer: while (i < text.length) {
    for (const [seq, key] of SEQUENCES) {
      if (text.startsWith(seq, i)) {
        out.push(key);
        i += seq.length;
        continue outer;
      }
    }
    const cp = text.codePointAt(i) ?? 0;
    const ch = String.fromCodePoint(cp);
    i += ch.length;
    // a stray combining mark joins the previous cell
    if (/\p{M}/u.test(ch) && out.length) continue;
    out.push(ch);
  }
  return out;
}

const BLANK = new Map<FontKey, Glyph>();

/** The glyph for one token; an unknown character draws as a blank cell (see missingGlyphs). */
export function glyph(font: FontKey, key: string): Glyph {
  const f = FONTS[font];
  const g = f.glyphs.get(key) ?? f.glyphs.get(ALIASES[key] ?? "");
  if (g) return g;
  let blank = BLANK.get(font);
  if (!blank) {
    blank = { w: f.advance, h: f.height, bits: new Uint8Array(f.advance * f.height) };
    BLANK.set(font, blank);
  }
  return blank;
}

export const hasGlyph = (font: FontKey, key: string): boolean =>
  FONTS[font].glyphs.has(key) || FONTS[font].glyphs.has(ALIASES[key] ?? "");

/** Characters of `text` that the font cannot draw (tests use this for coverage). */
export const missingGlyphs = (font: FontKey, text: string): string[] => tokens(text).filter((k) => !hasGlyph(font, k));

/** Width in pixels of a text run: one advance per glyph token. */
export function textWidth(font: FontId, text: string): number {
  return tokens(text).length * FONTS[font].advance;
}
