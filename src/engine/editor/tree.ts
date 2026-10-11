/**
 * Tree utilities for the entry editor: copying, measuring and unwrapping rows, and the slot geometry
 * of each MathPrint template (which slot lies left/right/above/below which) used by cursor movement.
 */
import { SYMS, slotRow, slotsOf, type Node, type Row, type Slot, type SymId } from "../expr";

/** A 2-D MathPrint node (anything but a plain symbol). */
export type Template = Exclude<Node, { t: "sym" }>;

export const isTemplate = (n: Node | undefined): n is Template => n !== undefined && n.t !== "sym";

/** Entry limit: KB 15401, "the entry line … can contain up to 80 characters" (K §4.8). */
export const MAX_ENTRY_CELLS = 80;

/** MathPrint nesting limit: "up to four levels of consecutive nested functions" (GB p.1, K §4.8). */
export const MAX_NESTING = 4;

export function cloneRow(r: Row): Row {
  return r.map(cloneNode);
}

export function cloneNode(n: Node): Node {
  switch (n.t) {
    case "sym": return { t: "sym", s: n.s };
    case "frac": return { t: "frac", num: cloneRow(n.num), den: cloneRow(n.den) };
    case "mixed": return { t: "mixed", whole: cloneRow(n.whole), num: cloneRow(n.num), den: cloneRow(n.den) };
    case "pow": return { t: "pow", exp: cloneRow(n.exp) };
    case "sqrt": return { t: "sqrt", rad: cloneRow(n.rad) };
    case "root": return { t: "root", index: cloneRow(n.index), rad: cloneRow(n.rad) };
    case "ee": return { t: "ee", exp: cloneRow(n.exp) };
  }
}

/**
 * Character cells a symbol occupies on the 5×7 home screen. Each code point is one cell, except:
 * `⁻¹` and `◂▸` are single glyphs (D §3, §8.1), combining marks (the bar of x̄) take no cell, and
 * `▸n/d◂▸Un/d` uses the one-cell n/d glyph twice (D §8.1): ▸ n/d ◂▸ U n/d = 5 cells.
 */
export function symCells(s: SymId): number {
  if (s === "toFracMixed") return 5;
  let n = 0;
  for (const ch of SYMS[s].replace(/⁻¹|◂▸/g, "\u0001")) if (!/\p{M}/u.test(ch)) n++;
  return n;
}

/**
 * Character cells of a row, counted as the same entry would occupy in Classic (linear) form:
 * symbols by their glyph cells, and each template as its content plus its Classic operator:
 * n/d → n⁄d (+1), U n/d → u⌴n⁄d (+2), ^ → ^e (+1), √ → √(r (+2), ˣ√ → iˣ√r (+2), ×10ⁿ → *10^e (+4).
 * Used for the 80-character entry limit; for a Classic row it is exactly the on-screen width.
 */
export function cellCount(row: Row): number {
  let n = 0;
  for (const node of row) {
    switch (node.t) {
      case "sym": n += symCells(node.s); break;
      case "frac": n += cellCount(node.num) + 1 + cellCount(node.den); break;
      case "mixed": n += cellCount(node.whole) + 1 + cellCount(node.num) + 1 + cellCount(node.den); break;
      case "pow": n += 1 + cellCount(node.exp); break;
      case "sqrt": n += 2 + cellCount(node.rad); break;
      case "root": n += cellCount(node.index) + 2 + cellCount(node.rad); break;
      case "ee": n += 4 + cellCount(node.exp); break;
    }
  }
  return n;
}

/** Deepest template nesting in a row: 0 for plain symbols, 1 for `1/2`, 2 for `√(1/2)`, … */
export function nestingDepth(row: Row): number {
  let d = 0;
  for (const n of row) {
    if (!isTemplate(n)) continue;
    for (const s of slotsOf(n)) d = Math.max(d, 1 + nestingDepth(slotRow(n, s)));
  }
  return d;
}

/** A template's content, slot after slot in navigation order (used when deleting the template). */
export function unwrap(n: Template): Row {
  return slotsOf(n).flatMap((s) => slotRow(n, s));
}

export function firstSlot(n: Template): Slot {
  const s = slotsOf(n)[0];
  if (!s) throw new Error(`template ${n.t} has no slots`);
  return s;
}

export function lastSlot(n: Template): Slot {
  const s = slotsOf(n).at(-1);
  if (!s) throw new Error(`template ${n.t} has no slots`);
  return s;
}

type SlotMap = Partial<Record<Template["t"], Partial<Record<Slot, Slot>>>>;

/**
 * Horizontal neighbours inside a template. Only side-by-side slots are linked: the whole part sits
 * left of a mixed number's fraction, and an n-th root's index sits left of its radicand. Stacked
 * slots (numerator over denominator) are not: ► at the end of either exits the fraction (GB p.13).
 */
const RIGHT_OF: SlotMap = { mixed: { whole: "num" }, root: { index: "rad" } };
const LEFT_OF: SlotMap = { mixed: { num: "whole", den: "whole" }, root: { rad: "index" } };

/** Vertical neighbours: ▼ numerator → denominator, ▲ back (K §4.1). */
const BELOW: SlotMap = { frac: { num: "den" }, mixed: { num: "den" } };
const ABOVE: SlotMap = { frac: { den: "num" }, mixed: { den: "num" } };

export const slotRightOf = (n: Template, s: Slot): Slot | undefined => RIGHT_OF[n.t]?.[s];
export const slotLeftOf = (n: Template, s: Slot): Slot | undefined => LEFT_OF[n.t]?.[s];
export const slotBelow = (n: Template, s: Slot): Slot | undefined => BELOW[n.t]?.[s];
export const slotAbove = (n: Template, s: Slot): Slot | undefined => ABOVE[n.t]?.[s];
