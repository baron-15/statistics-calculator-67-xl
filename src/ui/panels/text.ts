/**
 * Readable text for the side panels. The LCD's own text (the engine's result rows and the
 * restricted-context number text) is kept digit for digit, and only its typography is changed for
 * a web page:
 * - the raised negation ⁻ and subtraction become a true minus sign −, and * becomes ×;
 * - the slanted fraction bar becomes "/", and a mixed number reads "4 1/2";
 * - ᴇ notation and ×10ⁿ templates read "1.96×10³", and simple exponents become superscripts.
 */
import { rowText, type Node, type Row } from "../../engine";
import { SYMS } from "../../engine/expr";
import { formatResult, type Modes, type Value } from "../../engine/math";
import { formatPlain, linearText } from "../../engine/apps/format";

export const MINUS = "−";

const SUPERSCRIPT: Readonly<Record<string, string>> = {
  "0": "⁰", "1": "¹", "2": "²", "3": "³", "4": "⁴", "5": "⁵", "6": "⁶", "7": "⁷", "8": "⁸", "9": "⁹",
  "−": "⁻", "-": "⁻", "⁻": "⁻", "+": "⁺",
};

/** Superscript digits and signs, or null when the text has other characters. */
export function superscript(text: string): string | null {
  let out = "";
  for (const ch of text) {
    const s = SUPERSCRIPT[ch];
    if (!s) return null;
    out += s;
  }
  return out;
}

const SYM_TEXT: Partial<Record<keyof typeof SYMS, string>> = {
  neg: MINUS,
  sub: MINUS,
  mul: "×",
  fracbar: "/",
  mixsep: " ",
  E: "ᴇ",
};

const symText = (s: keyof typeof SYMS): string => SYM_TEXT[s] ?? SYMS[s];

/** Wrap a part of a fraction in parentheses when it is not a single term. */
function group(text: string): string {
  if (/^\(.*\)$/.test(text) && balanced(text.slice(1, -1))) return text;
  return /[+×÷/ ]|.−/.test(text) ? `(${text})` : text;
}

function balanced(text: string): boolean {
  let depth = 0;
  for (const ch of text) {
    if (ch === "(") depth++;
    if (ch === ")" && --depth < 0) return false;
  }
  return depth === 0;
}

function nodeText(n: Node): string {
  switch (n.t) {
    case "sym": return symText(n.s);
    case "frac": return `${group(readableRow(n.num))}/${group(readableRow(n.den))}`;
    case "mixed": return `${readableRow(n.whole)} ${group(readableRow(n.num))}/${group(readableRow(n.den))}`;
    case "pow": {
      const exp = readableRow(n.exp);
      return superscript(exp) ?? `^${exp.length > 1 ? `(${exp})` : exp}`;
    }
    case "sqrt": {
      const rad = readableRow(n.rad);
      return `√${/^[\w.π]+$/.test(rad) ? rad : `(${rad})`}`;
    }
    case "root": {
      const index = readableRow(n.index);
      const rad = readableRow(n.rad);
      return `${superscript(index) ?? `(${index})`}√${/^[\w.π]+$/.test(rad) ? rad : `(${rad})`}`;
    }
    case "ee": {
      const exp = readableRow(n.exp);
      return `×10${superscript(exp) ?? `^(${exp})`}`;
    }
  }
}

/** An expression or result row as one readable line. Falls back to the engine's rowText. */
export function readableRow(row: Row): string {
  try {
    return row.map(nodeText).join("").replace(/\s+/g, " ").trim();
  } catch {
    return rowText(row);
  }
}

/**
 * A restricted-context number text (formatPlain: `⁻18.6663732`, `196ᴇ3`, `1⁄4`, `Error`) with
 * readable typography: `−18.6663732`, `196×10³`, `1/4`.
 */
export function readableNumber(text: string): string {
  // the sign is only ever in front; an exponent's sign becomes a superscript minus
  return text
    .replace(/^[⁻-]/, MINUS)
    .replace(/ᴇ([⁻-]?\d+)/g, (_m, exp: string) => `×10${superscript(exp) ?? `^${exp}`}`)
    .replace(/⁄/g, "/");
}

/**
 * A row typed on a linear author line (data-editor formulas, table Start= / Step=) as the LCD shows
 * it (`9/5×L1+32`), with a true minus sign and "/" for the fraction bar.
 */
export function linearReadable(row: Row): string {
  return linearText(row).replace(/⁻/g, MINUS).replace(/⁄/g, "/").replace(/[ẋẏż]/g, (c) => ({ ẋ: "x", ẏ: "y", ż: "z" })[c] ?? c);
}

/** A value as the restricted contexts show it (StatVars, data editor, table) in at most `width` characters. */
export function plainText(v: Value, modes: Modes, width = 11): string {
  return readableNumber(formatPlain(v, modes, width));
}

/** A number as the restricted contexts show it, or "Error" for null. */
export function numberText(x: number | null, modes: Modes, width = 11): string {
  return x === null || !Number.isFinite(x) ? "Error" : plainText({ re: x }, modes, width);
}

/** A value as the Home screen shows it as a result in the current modes (exact forms, FIX, SCI…). */
export function valueText(v: Value, modes: Modes): string {
  try {
    return readableRow(formatResult(v, modes));
  } catch {
    return numberText(v.re, modes);
  }
}

/** Thousands separators for an integer's digits (for counts such as 2,598,960). */
export function groupDigits(n: number | bigint): string {
  const s = typeof n === "bigint" ? n.toString() : Number.isSafeInteger(n) ? String(n) : "";
  if (!s) return String(n);
  const neg = s.startsWith("-");
  const digits = neg ? s.slice(1) : s;
  return `${neg ? MINUS : ""}${digits.replace(/\B(?=(\d{3})+(?!\d))/g, ",")}`;
}
