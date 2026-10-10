/**
 * Computer keyboard → calculator key. Pure helpers, unit tested (tests/ui/keyboardMap.test.ts).
 *
 * Two layers:
 * 1. TI-SmartView's TI-30XS keymap (docs/research/keys-menus.md §1.4): one letter per function key,
 *    e.g. Q = 2nd, W = mode, R = log, D = π, Z = x^yzt_abc, C = ◂▸, V = on, B = (−).
 * 2. The natural keys: digits and ".", + − * / ^ ( ), Enter (and =), the arrows.
 *    Backspace and Delete are delete and Escape is clear. (SmartView maps Backspace to clear; we
 *    follow the usual text-editing meaning instead.)
 * Ctrl / Cmd / Alt combinations are left to the browser.
 */
import type { KeyId } from "../engine";

export interface KeyLike {
  key: string;
  ctrlKey?: boolean;
  metaKey?: boolean;
  altKey?: boolean;
}

/** SmartView letter keys (case-insensitive). */
export const SMARTVIEW_LETTERS: Readonly<Record<string, KeyId>> = {
  q: "2ND",
  w: "MODE",
  r: "LOG",
  t: "PRB",
  y: "DATA",
  u: "LN",
  i: "FRAC",
  p: "EE",
  a: "TABLE",
  d: "PI",
  f: "SIN",
  g: "COS",
  h: "TAN",
  j: "POWER",
  k: "RECIP",
  l: "SQUARE",
  z: "VAR",
  x: "STO",
  c: "TOGGLE",
  v: "ON",
  b: "NEG",
};

/** Keys that mean the same on the keyboard and the calculator. */
export const NATURAL_KEYS: Readonly<Record<string, KeyId>> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": "DOT",
  "+": "ADD",
  "-": "SUBTRACT",
  "*": "MULTIPLY",
  "/": "DIVIDE",
  "^": "POWER",
  "(": "LPAREN",
  ")": "RPAREN",
  Enter: "ENTER",
  "=": "ENTER",
  ArrowUp: "UP",
  ArrowDown: "DOWN",
  ArrowLeft: "LEFT",
  ArrowRight: "RIGHT",
  Backspace: "DELETE",
  Delete: "DELETE",
  Escape: "CLEAR",
  Clear: "CLEAR",
};

/** The calculator key for a keydown, or null when it is not one of ours. */
export function keyFromKeyboard(e: KeyLike): KeyId | null {
  if (e.ctrlKey || e.metaKey || e.altKey) return null;
  const natural = NATURAL_KEYS[e.key];
  if (natural) return natural;
  if (e.key.length === 1) return SMARTVIEW_LETTERS[e.key.toLowerCase()] ?? null;
  return null;
}

/** Shortcut hints per calculator key (aria-keyshortcuts and help text), e.g. "Q" for 2nd. */
export const KEYBOARD_HINTS: Readonly<Partial<Record<KeyId, string>>> = (() => {
  const hints: Partial<Record<KeyId, string[]>> = {};
  const add = (id: KeyId, k: string) => (hints[id] ??= []).push(k);
  for (const [k, id] of Object.entries(NATURAL_KEYS)) if (k !== "Clear") add(id, k);
  for (const [k, id] of Object.entries(SMARTVIEW_LETTERS)) add(id, k.toUpperCase());
  return Object.fromEntries(Object.entries(hints).map(([id, ks]) => [id, ks.join(" ")]));
})();

interface TargetLike {
  tagName?: string;
  isContentEditable?: boolean;
  getAttribute?(name: string): string | null;
}

/** Keystrokes typed into form fields belong to the field, not the calculator. */
export function isTypingTarget(t: TargetLike | null | undefined): boolean {
  if (!t) return false;
  const tag = (t.tagName ?? "").toUpperCase();
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if (t.isContentEditable) return true;
  return t.getAttribute?.("role") === "textbox";
}

/**
 * Enter or Space on a focused control that is not a calculator key (a link, the theme toggle) must
 * keep activating that control.
 */
export function ownsActivationKey(t: TargetLike | null | undefined): boolean {
  if (!t) return false;
  const tag = (t.tagName ?? "").toUpperCase();
  const interactive = tag === "BUTTON" || tag === "A" || tag === "SUMMARY" || !!t.getAttribute?.("role");
  return interactive && t.getAttribute?.("data-calc-key") == null;
}
