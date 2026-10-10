/**
 * Text and number helpers for the apps layer:
 * - `glyphCount`: how many character cells a canvas text string occupies (fixed advances, metrics.ts).
 * - `formatPlain`: numbers as plain text for the "restricted contexts" (Recall Var, StatVars, data
 *   editor, function table), which use E notation instead of ×10ⁿ (K §2.3, §4.17; GB p.3).
 * - `valueRow`: a value as an entry Row, for pasting (recall, Ans in conversions) and substitution.
 * - `linearText`: an entry Row as one line of text in the 4×5 menu font (data-editor author line).
 */
import { textWidth } from "../../display/fonts";
import { symText } from "../../display/symbols";
import { sym, type Node, type Row, type SymId } from "../expr";
import { formatResult, type Modes, type Value } from "../math";

// ------------------------------------------------------------------------------------------------
// Text measurement

/**
 * Glyph cells in a canvas string, counted as the renderer draws it: one per character, except the
 * single-glyph sequences ◂▸, ⁻¹ and n/d, and combining marks (the bar of x̄) that take no cell.
 */
export const glyphCount = (text: string): number => textWidth("big", text) / 6;

// ------------------------------------------------------------------------------------------------
// Restricted-context numbers (E notation)

const isRational = (v: Value): boolean => !!v.exact && v.exact.root === 1n && !v.exact.pi;

/** Strip trailing zeros (and a trailing point) from a positional decimal string. */
const strip = (s: string): string => (s.includes(".") ? s.replace(/0+$/, "").replace(/\.$/, "") : s);

/** Digits and decimal exponent of |x| rounded to `sig` significant digits. */
function sci(x: number, sig: number): { digits: string; exp: number } {
  const [m = "0", e = "0"] = Math.abs(x).toExponential(sig - 1).split("e");
  return { digits: m.replace(".", ""), exp: Number(e) };
}

/** Positional form of `digits` × 10^exp (digits read d.ddd), without stripping. */
function positional(digits: string, exp: number): string {
  if (exp < 0) return `0.${"0".repeat(-exp - 1)}${digits}`;
  const int = digits.slice(0, exp + 1).padEnd(exp + 1, "0");
  const frac = digits.slice(exp + 1);
  return frac ? `${int}.${frac}` : int;
}

/**
 * A number as the TI shows it where ×10ⁿ cannot be drawn: Recall Var (`196ᴇ3` in ENG), the StatVars
 * list, data-editor cells, table cells. The result fits `max` characters including the sign:
 * - FLOAT NORM: up to 10 significant digits; if that does not fit, it is rounded to fit, keeping the
 *   zeros that rounding leaves (`a=0.677325190`, `b=⁻18.6663732`: the 11-character StatVars field).
 *   |x| ≥ 10¹⁰, or a value that would keep fewer than 3 significant digits, switches to E form.
 * - FIX n: n decimals (rounded to fit if needed).
 * - SCI / ENG: mantissa, `E`, exponent (ENG exponents are multiples of 3: `207.4ᴇ3`, `0ᴇ0`).
 * Exact rationals print as `n⁄d` with the slanted bar when they fit (GB p.32: fractions stay `1⁄4`
 * in the data editor, MT_DataEd01).
 * Negative numbers use the raised `⁻` (K §4.10). `eChar` is `ᴇ` (big font) or `E` (menu font).
 */
export function formatPlain(v: Value, modes: Modes, max: number, eChar = "ᴇ"): string {
  if (!Number.isFinite(v.re)) return "Error";
  const ex = v.exact;
  if (ex && isRational(v) && ex.d !== 1n) {
    const s = `${ex.n < 0n ? "⁻" : ""}${ex.n < 0n ? -ex.n : ex.n}⁄${ex.d}`;
    if (glyphCount(s) <= max) return s;
  }
  return formatNumber(v.re, modes, max, eChar);
}

export function formatNumber(x: number, modes: Modes, max: number, eChar: string): string {
  const sign = x < 0 ? "⁻" : "";
  const room = max - sign.length;
  const fix = modes.decimals === "FLOAT" ? null : modes.decimals;
  const a = Math.abs(x);
  if (modes.notation === "NORM" && a < 1e10) {
    const s = normal(a, fix, room);
    if (s !== null) return sign + s;
  }
  return sign + eForm(a, modes.notation === "ENG", fix, room, eChar);
}

/** Positional text for 0 ≤ a < 10¹⁰ in at most `room` characters, or null if it cannot show the value. */
function normal(a: number, fix: number | null, room: number): string | null {
  if (a === 0) return fix === null ? "0" : fit((0).toFixed(fix), room);
  const { digits, exp } = sci(a, 10);
  let s = fix === null ? strip(positional(digits, exp)) : a.toFixed(fix);
  if (s.length > room) {
    const decimals = room - Math.max(1, exp + 1) - 1;
    s = a.toFixed(Math.max(0, decimals));
    // rounding can add a digit (9.99 → 10.0)
    if (s.length > room && decimals > 0) s = a.toFixed(decimals - 1);
  }
  if (s.length > room) return null;
  if (fix === null) {
    // rounding that keeps fewer than 3 significant digits of a longer value switches to E form
    const shown = s.replace(".", "").replace(/^0+/, "").length;
    if (shown < Math.min(3, digits.replace(/0+$/, "").length)) return null;
  }
  return s;
}

/** Cut a string to `room` characters (only used for the zero of a long FIX setting). */
function fit(s: string, room: number): string {
  return s.length <= room ? s : s.slice(0, room).replace(/\.$/, "");
}

/** Mantissa E exponent, e.g. 1.2345ᴇ4, 196ᴇ3, 5ᴇ⁻3. */
function eForm(a: number, eng: boolean, fix: number | null, room: number, eChar: string): string {
  let exp = a === 0 ? 0 : sci(a, 10).exp;
  if (eng) exp = Math.floor(exp / 3) * 3;
  let mant = a / 10 ** exp;
  if (a === 0) mant = 0;
  const expText = (e: number) => `${eChar}${e < 0 ? "⁻" : ""}${Math.abs(e)}`;
  const intLen = String(Math.trunc(mant)).length;
  // decimals that fit next to the exponent
  let decimals = room - expText(exp).length - intLen - 1;
  if (fix !== null) decimals = Math.min(decimals, fix);
  decimals = Math.max(0, Math.min(decimals, 9));
  let m = mant.toFixed(decimals);
  // rounding can carry into a new digit (9.99 → 10.0): renormalise
  if (Number(m) >= (eng ? 1000 : 10)) {
    exp += eng ? 3 : 1;
    mant = a / 10 ** exp;
    m = mant.toFixed(decimals);
  }
  if (fix === null) m = strip(m);
  return m + expText(exp);
}

// ------------------------------------------------------------------------------------------------
// Values as entry rows

const digitSyms = (s: string): Node[] => [...s].map((ch) => sym((ch === "." ? "." : ch) as SymId));

/**
 * A decimal as entry symbols with up to 13 significant digits (K §4.4: `0.7853981633975`,
 * `39.43972222221`). Large or tiny values use ×10ⁿ: the `ee` template in MathPrint, `*10^` in Classic.
 */
export function decimalRow(x: number, mathprint: boolean): Row {
  const neg: Row = x < 0 ? [sym("neg")] : [];
  if (x === 0) return [sym("0")];
  const { digits, exp } = sci(x, 13);
  const d = digits.replace(/0+$/, "") || "0";
  if (exp >= -9 && exp < 13) return [...neg, ...digitSyms(strip(positional(d, exp)))];
  const mant = d.length > 1 ? `${d[0]}.${d.slice(1)}` : d;
  const e: Row = [...(exp < 0 ? [sym("neg")] : []), ...digitSyms(String(Math.abs(exp)))];
  const tail: Row = mathprint ? [{ t: "ee", exp: e }] : [sym("mul"), sym("1"), sym("0"), sym("caret"), ...e];
  return [...neg, ...digitSyms(mant), ...tail];
}

/** A rational as Classic symbols: `n⁄d`, or the integer. */
export function rationalRow(n: bigint, d: bigint): Row {
  const neg: Row = n < 0n ? [sym("neg")] : [];
  const abs = n < 0n ? -n : n;
  if (d === 1n) return [...neg, ...digitSyms(String(abs))];
  return [...neg, ...digitSyms(String(abs)), sym("fracbar"), ...digitSyms(String(d))];
}

/**
 * A value as the row the calculator pastes for it (Recall Var, Ans before a conversion or ◂▸):
 * the exact form when there is one (formatResult with FLOAT / NORM), else the 13-digit decimal.
 * Classic cannot draw √ or π results, so those paste as decimals there.
 */
export function valueRow(v: Value, modes: Modes): Row {
  const ex = v.exact;
  const mathprint = modes.display === "MATHPRINT";
  if (ex && !(ex.d === 1n && ex.root === 1n && !ex.pi)) {
    if (mathprint || isRational(v)) return formatResult(v, { ...modes, decimals: "FLOAT", notation: "NORM" });
  }
  if (ex && ex.d === 1n && ex.root === 1n && !ex.pi && (ex.n < 10n ** 13n && ex.n > -(10n ** 13n))) {
    return rationalRow(ex.n, 1n);
  }
  return decimalRow(v.re, mathprint);
}

/** A value as a parenthesised Classic row, for substituting a list element into a formula. */
export function operandRow(v: Value): Row {
  const inner = v.exact && isRational(v) ? rationalRow(v.exact.n, v.exact.d) : decimalRow(v.re, false);
  return [sym("lparen"), ...inner, sym("rparen")];
}

// ------------------------------------------------------------------------------------------------
// Linear text of a row (author line of the data editor, table cells)

/**
 * One-line text of a Classic row, as the 4×5 data-editor font shows it: `×` for multiplication, `/`
 * for division (GB-089c `♦L2=9/5×L1+32`), `⁄` for the fraction bar, and the variable glyphs (ẋ).
 * Templates (which a Classic editor never builds) fall back to rowText-like forms.
 */
export function linearText(row: Row): string {
  return row
    .map((n) => {
      switch (n.t) {
        case "sym":
          if (n.s === "mul") return "×";
          if (n.s === "div") return "/";
          return symText(n.s);
        case "frac": return `${group(n.num)}⁄${group(n.den)}`;
        case "mixed": return `${linearText(n.whole)}⌴${group(n.num)}⁄${group(n.den)}`;
        case "pow": return `^${group(n.exp)}`;
        case "sqrt": return `√${group(n.rad)}`;
        case "root": return `${group(n.index)}ˣ√${group(n.rad)}`;
        case "ee": return `×10^${group(n.exp)}`;
      }
    })
    .join("");
}

const group = (r: Row): string => (r.length > 1 ? `(${linearText(r)})` : linearText(r));

/** Character index in linearText(row) of a top-level gap (for the menu-font cursor). */
export function linearOffset(row: Row, index: number): number {
  return glyphCount(linearText(row.slice(0, index)));
}
