/**
 * Layout of an expression Row into a box of pixels, in MathPrint (2-D) or Classic (linear) form.
 * All rules are measured from the TI-SmartView captures (D §5; tests/display/golden-home.test.ts).
 *
 * Box model. Every box has a width (a multiple of the 6-px cell), a height, an `axis` row and a
 * `pad` (blank rows at its bottom that tall delimiters ignore). A row aligns its items on the axis:
 * - a 5×7 glyph has its axis on row 3, a 5×5 glyph on row 2, a 3×4 glyph on row 1;
 * - a fraction's axis is its bar: numerator, 1 blank row, the 1-px bar, 1 blank row, denominator
 *   and 1 extra blank row (the pad); the bar is the content width minus the first spacer column;
 * - a script (`pow`, `ee`, `²`, `⁻¹`) puts its row's glyph line 2 rows above the top of the item
 *   before it (E3; EOS02 shows it stacking for 2^3^2);
 * - a radical is a vinculum row, 1 blank row, then the radicand, with the stem at offset 3 of its
 *   6-px advance and a 2-px hook (E2). A big-font radicand with a script at its top level gets 2
 *   more blank rows (GS_order06, MF_powerRootsInv4, MF_Trig7-4). Neighbours align with the
 *   radicand's glyph line, ignoring raised scripts (E4: `⁻5+√(5²…)`);
 * - parentheses around content taller than the glyph stretch to its ink height (E5, MF_log10xB).
 *
 * Fonts by level: the main row is big; fraction parts are small; ^ and ×10ⁿ scripts are small
 * (also over small text: 2^3^2, MF_x10n02); the one-character ² and ⁻¹ are small over big text and
 * tiny over small text (E4).
 */
import { sym, type Cursor, type CursorStep, type Node, type Row, type Slot } from "../engine/expr";
import type { Bitmap } from "./bitmap";
import { FONTS, glyph, tokens } from "./fonts";
import { classicText, symText } from "./symbols";

/** The font of a row: big on the main line, small in fraction parts and scripts, tiny below that. */
export type LevelFont = "big" | "small" | "tinyMP";

/** Where the cursor sits: the origin of its glyph cell, in the font of the row it is in. */
export interface Caret {
  x: number;
  y: number;
  font: LevelFont;
}

export interface Box {
  w: number;
  h: number;
  axis: number;
  pad: number;
  /** rows the axis was raised by scripts above the row's own glyph line (radical alignment) */
  lift: number;
  caret?: Caret;
  paint(bm: Bitmap, x: number, y: number): void;
}

interface Ctx {
  mp: boolean;
  cursor: Cursor | null;
}

type Kind = "glyph" | "open" | "close" | "box" | "pow";

interface Item {
  kind: Kind;
  node: number;
  box: Box;
  /** pow items: the exponent row, and the base the script hangs from once resolved */
  sup?: Box;
  supFont?: LevelFont;
  base?: Box;
}

const fa = (f: LevelFont): number => FONTS[f].axis;

/**
 * Fraction parts, and ^ and ×10ⁿ templates: small under big text, and the same font below that
 * (2^3^2 stacks small on small; MF_x10n02 keeps a ×10ⁿ exponent small inside a fraction).
 */
const partFont = (f: LevelFont): LevelFont => (f === "big" ? "small" : f);
/** The one-character ² and ⁻¹, and a root index: small under big text, tiny under small text (E4). */
const smallerFont = (f: LevelFont): LevelFont => (f === "big" ? "small" : "tinyMP");

function glyphBox(font: LevelFont, key: string): Box {
  const g = glyph(font, key);
  const f = FONTS[font];
  return { w: f.advance, h: f.height, axis: f.axis, pad: 0, lift: 0, paint: (bm, x, y) => bm.glyph(g, x, y) };
}

/** A parenthesis stretched to `h` rows (D §5.5): offsets 4,3,2…2,3,4 for "(" and 2,3,4…4,3,2 for ")". */
function tallParen(open: boolean, up: number, down: number): Box {
  const h = up + down;
  return {
    w: 6, h, axis: up, pad: 0, lift: 0,
    paint(bm, x, y) {
      for (let r = 0; r < h; r++) {
        const edge = r === 0 || r === h - 1 ? 0 : r === 1 || r === h - 2 ? 1 : 2;
        bm.set(x + (open ? 4 - edge : 2 + edge), y + r);
      }
    },
  };
}

const samePath = (a: CursorStep[], b: CursorStep[]): boolean =>
  a.length === b.length && a.every((s, i) => s.node === b[i]?.node && s.slot === b[i]?.slot);

const child = (path: CursorStep[] | null, node: number, slot: Slot): CursorStep[] | null => (path ? [...path, { node, slot }] : null);

const isScript = (n: Node): boolean => n.t === "pow" || n.t === "ee" || (n.t === "sym" && (n.s === "square" || n.s === "recip"));

interface Aligned {
  axis: number;
  h: number;
  pad: number;
  /** top of each box relative to the row top */
  tops: number[];
}

function align(boxes: Box[], font: LevelFont): Aligned {
  if (!boxes.length) {
    const f = FONTS[font];
    return { axis: f.axis, h: f.height, pad: 0, tops: [] };
  }
  const axis = Math.max(...boxes.map((b) => b.axis));
  const down = Math.max(...boxes.map((b) => b.h - b.axis));
  const pad = Math.min(...boxes.map((b) => down - (b.h - b.axis) + b.pad));
  return { axis, h: axis + down, pad, tops: boxes.map((b) => axis - b.axis) };
}

function pushNode(items: Item[], n: Node, k: number, font: LevelFont, path: CursorStep[] | null, ctx: Ctx): void {
  const pushText = (text: string) => {
    for (const t of tokens(text)) {
      const kind: Kind = t === "(" ? "open" : t === ")" ? "close" : "glyph";
      items.push({ kind, node: k, box: glyphBox(font, t) });
    }
  };
  const pushScript = (exp: Row, p: CursorStep[] | null, supFont = partFont(font)) => {
    const sup = rowBox(exp, supFont, p, true, ctx);
    items.push({ kind: "pow", node: k, box: sup, sup, supFont });
  };
  if (!ctx.mp) {
    pushText(classicText(n));
    return;
  }
  switch (n.t) {
    case "sym":
      if (n.s === "square") pushScript([sym("2")], null, smallerFont(font));
      else if (n.s === "recip") pushScript([sym("neg"), sym("1")], null, smallerFont(font));
      else pushText(symText(n.s));
      return;
    case "frac":
      items.push({ kind: "box", node: k, box: fracBox(n.num, n.den, font, child(path, k, "num"), child(path, k, "den"), ctx) });
      return;
    case "mixed": {
      const whole = rowBox(n.whole, font, child(path, k, "whole"), true, ctx);
      const f = fracBox(n.num, n.den, font, child(path, k, "num"), child(path, k, "den"), ctx);
      items.push({ kind: "box", node: k, box: hbox([whole, f], font) });
      return;
    }
    case "sqrt":
      items.push({ kind: "box", node: k, box: radical(null, n.rad, font, null, child(path, k, "rad"), ctx) });
      return;
    case "root":
      items.push({ kind: "box", node: k, box: radical(n.index, n.rad, font, child(path, k, "index"), child(path, k, "rad"), ctx) });
      return;
    case "pow":
      pushScript(n.exp, child(path, k, "exp"));
      return;
    case "ee":
      pushText("*10");
      pushScript(n.exp, child(path, k, "exp"));
      return;
  }
}

/** Boxes side by side, aligned on their axes (mixed numbers). */
function hbox(boxes: Box[], font: LevelFont): Box {
  const a = align(boxes, font);
  const xs: number[] = [];
  let w = 0;
  for (const b of boxes) {
    xs.push(w);
    w += b.w;
  }
  let caret: Caret | undefined;
  boxes.forEach((b, i) => {
    if (b.caret) caret = { x: b.caret.x + (xs[i] ?? 0), y: b.caret.y + (a.tops[i] ?? 0), font: b.caret.font };
  });
  return {
    w, h: a.h, axis: a.axis, pad: a.pad, lift: 0,
    ...(caret ? { caret } : {}),
    paint(bm, x, y) {
      boxes.forEach((b, i) => b.paint(bm, x + (xs[i] ?? 0), y + (a.tops[i] ?? 0)));
    },
  };
}

function fracBox(num: Row, den: Row, font: LevelFont, pN: CursorStep[] | null, pD: CursorStep[] | null, ctx: Ctx): Box {
  const ff = partFont(font);
  const N = rowBox(num, ff, pN, true, ctx);
  const D = rowBox(den, ff, pD, true, ctx);
  const w = Math.max(N.w, D.w);
  const nx = (w - N.w) / 2;
  const dx = (w - D.w) / 2;
  const dy = N.h + 3;
  const caret = N.caret ? { ...N.caret, x: N.caret.x + nx } : D.caret ? { ...D.caret, x: D.caret.x + dx, y: D.caret.y + dy } : undefined;
  return {
    w, h: dy + D.h + 1, axis: N.h + 1, pad: D.pad + 1, lift: 0,
    ...(caret ? { caret } : {}),
    paint(bm, x, y) {
      N.paint(bm, x + nx, y);
      bm.hline(x + 1, x + w - 1, y + N.h + 1);
      D.paint(bm, x + dx, y + dy);
    },
  };
}

/** √ (index null) or ˣ√ with the index top-aligned with the vinculum (D §5.4). */
function radical(index: Row | null, rad: Row, font: LevelFont, pI: CursorStep[] | null, pR: CursorStep[] | null, ctx: Ctx): Box {
  const I = index ? rowBox(index, smallerFont(font), pI, true, ctx) : null;
  const R = rowBox(rad, font, pR, true, ctx);
  const top = 2 + (font === "big" && rad.some(isScript) ? 2 : 0);
  const ix = I ? I.w : 0;
  const rh = top + R.h;
  const w = ix + 6 + R.w;
  const caret = I?.caret ?? (R.caret ? { ...R.caret, x: R.caret.x + ix + 6, y: R.caret.y + top } : undefined);
  return {
    w, h: Math.max(rh, I ? I.h : 0), axis: top + R.axis - R.lift, pad: R.pad, lift: 0,
    ...(caret ? { caret } : {}),
    paint(bm, x, y) {
      I?.paint(bm, x, y);
      const sx = x + ix + 3;
      const bottom = y + rh - R.pad - 1;
      bm.hline(sx, x + w - 1, y);
      bm.vline(sx, y, bottom);
      bm.set(sx - 2, bottom - 2);
      bm.set(sx - 1, bottom - 1);
      R.paint(bm, x + ix + 6, y + top);
    },
  };
}

/**
 * Lay out one row. `slot` rows (template parts) are at least one cell wide, so an empty slot has
 * room for the cursor; a row holding the cursor at its end gets an extra cell for it (`3+3█`).
 */
function rowBox(row: Row, font: LevelFont, path: CursorStep[] | null, slot: boolean, ctx: Ctx): Box {
  const items: Item[] = [];
  row.forEach((n, k) => pushNode(items, n, k, font, path, ctx));
  const cur = ctx.cursor && path && samePath(ctx.cursor.path, path) ? ctx.cursor : null;
  if ((row.length === 0 && slot) || (cur && cur.index >= row.length)) {
    items.push({ kind: "glyph", node: row.length, box: glyphBox(font, " ") });
  }

  // Scripts hang from the item before them; parentheses stretch around their content.
  const phantom = glyphBox(font, " ");
  const opens: number[] = [];
  let lastClose = -1;
  // Stretch the open paren `o` and close paren `c` (either may be missing: an unclosed "sin(" spans
  // to the end of the row) around the items between `from` and `to`.
  const stretch = (o: Item | undefined, c: Item | undefined, from: number, to: number) => {
    const inner = items.slice(from, to).map((it) => it.box);
    if (!inner.length) return;
    const f = FONTS[font];
    const up = Math.max(...inner.map((b) => b.axis));
    const down = Math.max(...inner.map((b) => b.h - b.pad - b.axis));
    if (up <= f.axis && down <= f.height - f.axis) return;
    if (o) o.box = tallParen(true, up, down);
    if (c) c.box = tallParen(false, up, down);
  };
  items.forEach((it, i) => {
    if (it.kind === "pow" && it.sup && it.supFont) {
      const prev = items[i - 1];
      const base = prev ? (prev.kind === "pow" && prev.base ? prev.base : prev.box) : phantom;
      it.base = base;
      const sup = it.sup;
      it.box = { ...sup, axis: base.axis + 2 + sup.axis - fa(it.supFont), lift: 0 };
    } else if (it.kind === "open") {
      opens.push(i);
    } else if (it.kind === "close") {
      const o = opens.pop();
      if (o === undefined) {
        stretch(undefined, it, lastClose + 1, i);
        lastClose = i;
      } else stretch(items[o], it, o + 1, i);
    }
  });
  for (let o = opens.pop(); o !== undefined; o = opens.pop()) stretch(items[o], undefined, o + 1, items.length);

  const boxes = items.map((it) => it.box);
  const a = align(boxes, font);
  const plain = items.filter((it) => it.kind !== "pow").map((it) => it.box.axis);
  const lift = Math.max(0, a.axis - Math.max(fa(font), ...plain));
  const xs: number[] = [];
  let w = 0;
  for (const b of boxes) {
    xs.push(w);
    w += b.w;
  }

  let caret: Caret | undefined;
  if (cur) {
    const i = items.findIndex((it) => it.node >= cur.index);
    caret = { x: i < 0 ? w : (xs[i] ?? w), y: a.axis - fa(font), font };
  } else {
    boxes.forEach((b, i) => {
      if (b.caret) caret = { x: b.caret.x + (xs[i] ?? 0), y: b.caret.y + (a.tops[i] ?? 0), font: b.caret.font };
    });
  }
  return {
    w, h: a.h, axis: a.axis, pad: a.pad, lift,
    ...(caret ? { caret } : {}),
    paint(bm, x, y) {
      boxes.forEach((b, i) => b.paint(bm, x + (xs[i] ?? 0), y + (a.tops[i] ?? 0)));
    },
  };
}

/** Lay out a top-level row (home-screen entry or result, or a canvas math item) in the big font. */
export function layoutTop(row: Row, mathprint: boolean, cursor: Cursor | null = null): Box {
  return rowBox(row, "big", [], false, { mp: mathprint, cursor });
}

export interface RowMetrics {
  /** width in pixels (a multiple of 6) */
  width: number;
  /** height in pixels, including a fraction's extra bottom row */
  height: number;
  /** the row of the main 5×7 glyph line's axis (its top is axis − 3) */
  axis: number;
  /** width in 6-px character cells */
  cells: number;
}

/**
 * Metrics of a row as the home screen would draw it. For a canvas `math` item, the box's top-left
 * is (x, y) (or its right edge is x when align = "right"), and its 5×7 glyph line starts at
 * y + axis − 3.
 */
export function layoutRow(row: Row, opts: { mathprint: boolean }): RowMetrics {
  const b = layoutTop(row, opts.mathprint);
  return { width: b.w, height: b.h, axis: b.axis, cells: b.w / 6 };
}

/** The pixel rectangle the cursor covers for a caret, by cursor style (D §7, K §4.1). */
export function cursorRect(c: Caret): { x: number; y: number; w: number; h: number } {
  const f = FONTS[c.font];
  const tiny = c.font === "tinyMP";
  return { x: c.x + (tiny ? 2 : 1), y: c.y, w: tiny ? 3 : f.advance - 1, h: f.height };
}
