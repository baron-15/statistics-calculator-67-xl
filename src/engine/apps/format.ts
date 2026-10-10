/**
 * Text helpers for the apps layer:
 * - `glyphCount`: how many character cells a canvas text string occupies (the renderer's tokens).
 * - `formatPlain`: values as plain text for the "restricted contexts" (Recall Var, StatVars, data
 *   editor, function table), which use E notation instead of ×10ⁿ (K §2.3, §4.17; GB p.3).
 * - `decimalRow` / `rationalRow`: a number as editable Classic symbols (table Start= / Step=).
 * - `linearText`: an entry Row as one line of text in the 4×5 menu font (data-editor author line).
 */
import { textWidth } from "../../display/fonts";
import { symText } from "../../display/symbols";
import { sym, type Node, type Row, type SymId } from "../expr";
import { formatNumberText, type Modes, type Value } from "../math";

/**
 * Glyph cells in a canvas string, counted as the renderer draws it: one per character, except the
 * single-glyph sequences ◂▸, ⁻¹ and n/d, and combining marks (the bar of x̄) that take no cell.
 */
export const glyphCount = (text: string): number => textWidth("big", text) / 6;

/**
 * A value in at most `max` characters, as the restricted contexts show it (the math engine's
 * formatNumberText: `0.677325190`, `⁻18.6663732`, `196ᴇ3`, `0ᴇ0`). Exact rationals print as `n⁄d`
 * with the slanted bar when they fit (GB p.32: fractions stay fractions in the data editor,
 * MT_DataEd01). The menu font draws ᴇ as its E.
 */
export function formatPlain(v: Value, modes: Modes, max: number): string {
  const ex = v.exact;
  if (ex && ex.root === 1n && !ex.pi && ex.d !== 1n) {
    const s = `${ex.n < 0n ? "⁻" : ""}${ex.n < 0n ? -ex.n : ex.n}⁄${ex.d}`;
    if (glyphCount(s) <= max) return s;
  }
  return formatNumberText(Number.isFinite(v.re) ? v.re : null, modes, max);
}

// ------------------------------------------------------------------------------------------------
// Numbers as editable Classic rows

const digitSyms = (s: string): Node[] => [...s].map((ch) => sym(ch as SymId));

/** A decimal as Classic symbols with up to 13 significant digits (`*10^` beyond 10¹³ or below 10⁻⁹). */
export function decimalRow(x: number, mathprint: boolean): Row {
  if (x === 0) return [sym("0")];
  const neg: Row = x < 0 ? [sym("neg")] : [];
  const [m = "0", e = "0"] = Math.abs(x).toExponential(12).split("e");
  const digits = m.replace(".", "").replace(/0+$/, "") || "0";
  const exp = Number(e);
  if (exp >= -9 && exp < 13) {
    const text = exp < 0
      ? `0.${"0".repeat(-exp - 1)}${digits}`
      : digits.length > exp + 1 ? `${digits.slice(0, exp + 1)}.${digits.slice(exp + 1)}` : digits.padEnd(exp + 1, "0");
    return [...neg, ...digitSyms(text)];
  }
  const mant = digits.length > 1 ? `${digits[0]}.${digits.slice(1)}` : digits;
  const ex: Row = [...(exp < 0 ? [sym("neg")] : []), ...digitSyms(String(Math.abs(exp)))];
  const tail: Row = mathprint ? [{ t: "ee", exp: ex }] : [sym("mul"), sym("1"), sym("0"), sym("caret"), ...ex];
  return [...neg, ...digitSyms(mant), ...tail];
}

/** A rational as Classic symbols: `n⁄d`, or the integer. */
export function rationalRow(n: bigint, d: bigint): Row {
  const neg: Row = n < 0n ? [sym("neg")] : [];
  const abs = n < 0n ? -n : n;
  if (d === 1n) return [...neg, ...digitSyms(String(abs))];
  return [...neg, ...digitSyms(String(abs)), sym("fracbar"), ...digitSyms(String(d))];
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
