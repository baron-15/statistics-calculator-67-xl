/**
 * Cursor movement through the entry tree. All functions are pure: they read the row and return a
 * new Cursor. Paths are never mutated, so they can be shared between states.
 *
 * ◄ / ► walk the row; a template next to the cursor is entered (► enters its first slot at the start,
 * ◄ enters its last slot at the end), and at the edge of a slot the cursor moves to the side-by-side
 * slot (mixed whole ↔ fraction, root index ↔ radicand) or leaves the template. ▲ / ▼ switch between
 * numerator and denominator of the innermost fraction that allows it.
 */
import { rowAt, slotRow, type Cursor, type Row } from "../expr";
import { firstSlot, isTemplate, lastSlot, slotAbove, slotBelow, slotLeftOf, slotRightOf, type Template } from "./tree";

/** The template that holds the slot at the end of `path` (path must be non-empty). */
function enclosing(root: Row, c: Cursor, depth = c.path.length - 1): Template {
  const step = c.path[depth];
  const n = step && rowAt(root, c.path.slice(0, depth))[step.node];
  if (!isTemplate(n)) throw new Error("bad cursor path");
  return n;
}

export function moveLeft(root: Row, c: Cursor): Cursor {
  const prev = rowAt(root, c.path)[c.index - 1];
  if (prev) {
    if (!isTemplate(prev)) return { path: c.path, index: c.index - 1 };
    const s = lastSlot(prev);
    return { path: [...c.path, { node: c.index - 1, slot: s }], index: slotRow(prev, s).length };
  }
  const step = c.path.at(-1);
  if (!step) return c; // start of the entry: stay (no wrap)
  const parentPath = c.path.slice(0, -1);
  const tmpl = enclosing(root, c);
  const left = slotLeftOf(tmpl, step.slot);
  if (left) return { path: [...parentPath, { node: step.node, slot: left }], index: slotRow(tmpl, left).length };
  return { path: parentPath, index: step.node };
}

export function moveRight(root: Row, c: Cursor): Cursor {
  const next = rowAt(root, c.path)[c.index];
  if (next) {
    if (!isTemplate(next)) return { path: c.path, index: c.index + 1 };
    return { path: [...c.path, { node: c.index, slot: firstSlot(next) }], index: 0 };
  }
  const step = c.path.at(-1);
  if (!step) return c; // end of the entry: stay (no wrap)
  const parentPath = c.path.slice(0, -1);
  const right = slotRightOf(enclosing(root, c), step.slot);
  if (right) return { path: [...parentPath, { node: step.node, slot: right }], index: 0 };
  return { path: parentPath, index: step.node + 1 };
}

/**
 * ▲ / ▼: move to the slot above/below in the innermost enclosing fraction or mixed number that has
 * one (from inside an exponent in a numerator, ▼ still reaches the denominator; GB-044). The cursor
 * lands at the end of the target slot. Returns null when no enclosing template allows the move
 * (top level, a numerator for ▲, a whole part): the router then scrolls history (GB p.13).
 */
export function moveVertical(root: Row, c: Cursor, dir: "up" | "down"): Cursor | null {
  for (let k = c.path.length - 1; k >= 0; k--) {
    const step = c.path[k];
    if (!step) continue;
    const tmpl = enclosing(root, c, k);
    const target = dir === "up" ? slotAbove(tmpl, step.slot) : slotBelow(tmpl, step.slot);
    if (target) return { path: [...c.path.slice(0, k), { node: step.node, slot: target }], index: slotRow(tmpl, target).length };
  }
  return null;
}

export const homeCursor = (): Cursor => ({ path: [], index: 0 });
export const endCursor = (root: Row): Cursor => ({ path: [], index: root.length });
