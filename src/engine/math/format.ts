/**
 * Result formatting (M §2, K §4.16–4.17): a Value becomes the Row the home screen shows.
 *
 * Decimals (NORM):
 * - FLOAT: at most 10 digits, the leading 0 of a number below 1 counting as one (`0.785398163`,
 *   `0.000093165`), rounded half up, trailing zeros and point stripped.
 * - FIX n: n decimals, rounded half up and padded (`5.0`, `25.0`), but never more than 10 digits in
 *   all (SPEC: assumption). Integers are padded too (`1+1` → `2.00` in FIX 2); exact non-integer
 *   forms (fractions, √, π) ignore FIX (GB p.4, p.19, p.22).
 * - Scientific notation takes over when the integer part needs more than 10 digits (|x| ≥ 1E10 after
 *   rounding) or when |x| < 1E−9 (SPEC: assumption; M §2.2 rule 3 [unverified]).
 * SCI / ENG: mantissa with 10 significant digits in FLOAT (trailing zeros stripped) or n decimals in
 * FIX; ENG exponents are multiples of 3. Zero shows as `0*10⁰` (the Recall Var menu shows `0ᴇ0` in
 * ENG, GB p.11; SPEC: assumption).
 * The ×10 part is an `ee` node (MathPrint: `*10` + superscript) or the syms `*10^` (Classic).
 *
 * Exact forms (MathPrint): `frac` nodes for n/d, `sqrt` for √b, `π`, combined as a√b/c and aπ/c with
 * the radical or π in the numerator (`5√2/2`, `π/4`); a negative sign goes in front (`⁻1/2`).
 * Classic: `n⁄d` with the fracbar sym and `u⌴n⁄d`; radicals and π are shown as decimals.
 */
import { sym, type Row, type SymId } from "../expr";
import { digitsOf, fixedText, intDigits, near13, norm, PI13, roundDec, roundSig, type Digits } from "./decimal";
import { abs, displayable, isIntegerExact, isRational, MAX_DEN, MAX_NUM, mk, squarePart } from "./exact";
import type { Modes } from "./index";
import type { Exact, Value } from "./value";

const symsOf = (text: string): Row =>
  [...text].map((ch) => sym(ch === "-" || ch === "⁻" ? "neg" : (ch as SymId)));

const isMP = (m: Modes): boolean => m.display === "MATHPRINT";

/** Can this exact value be shown exactly in this mode? */
export function showsExact(e: Exact | undefined, modes: Modes): boolean {
  if (!e || isIntegerExact(e) || !displayable(e)) return false;
  return isMP(modes) || isRational(e);
}

/** The result row for a value in the current modes. */
export function formatResult(v: Value, modes: Modes): Row {
  if (v.form === "dms") return dmsRow(v.re, modes);
  if (v.form === "percent") return percentRow(v, modes);
  if (v.exact && showsExact(v.exact, modes)) return exactRow(v.exact, modes, v.form === "mixed");
  return decimalRow(v.re, modes);
}

// ---------------------------------------------------------------------------------------------
// decimals

/** Parts of a formatted decimal: sign, mantissa text, and the power of ten (null = none). */
export interface NumParts {
  neg: boolean;
  mant: string;
  exp: number | null;
}

/** Format a real per the notation and decimal modes (no rows yet). */
export function numberParts(x: number, modes: Pick<Modes, "notation" | "decimals">): NumParts {
  const neg = x < 0;
  const g = digitsOf(x);
  const fix = modes.decimals === "FLOAT" ? null : modes.decimals;
  if (modes.notation === "NORM") {
    if (g.d === "") return { neg: false, mant: fixedText(g, fix ?? 0, fix !== null), exp: null };
    const small = Math.abs(x) < 1e-9;
    if (!small && intDigits(g) <= 10) {
      const r = normFixed(g, fix);
      if (r !== null) return { neg, mant: r, exp: null };
    }
  }
  return { neg, ...sciParts(g, modes.notation === "ENG", fix) };
}

/** NORM positional text, or null when rounding pushes it past 10 integer digits. */
function normFixed(g: Digits, fix: number | null): string | null {
  const room = 10 - intDigits(g);
  let r = roundDec(g, fix === null ? room : Math.min(fix, room));
  if (intDigits(r) > 10) return null;
  if (intDigits(r) > intDigits(g)) {
    // a carry added an integer digit (9.9999999996 → 10): one decimal fewer fits
    const room2 = 10 - intDigits(r);
    r = roundDec(r, fix === null ? room2 : Math.min(fix, room2));
  }
  const decs = fix === null ? 10 - intDigits(r) : Math.min(fix, 10 - intDigits(r));
  return fixedText(r, decs, fix !== null);
}

function sciParts(g: Digits, eng: boolean, fix: number | null): { mant: string; exp: number } {
  if (g.d === "") return { mant: fixedText(g, fix ?? 0, fix !== null), exp: 0 };
  const expOf = (e: number) => (eng ? e - (((e % 3) + 3) % 3) : e);
  let E = expOf(g.e);
  let r = fix === null ? roundSig(g, 10) : roundSig(g, g.e - E + 1 + fix);
  if (expOf(r.e) !== E) {
    // rounding carried into a new exponent (9.9999999999 → 10, ENG 999.995 → 1000)
    E = expOf(r.e);
    if (fix !== null) r = roundSig(r, r.e - E + 1 + fix);
  }
  const shifted: Digits = { d: r.d, e: r.e - E };
  const decs = fix ?? 9;
  return { mant: fixedText(shifted, decs, fix !== null), exp: E };
}

/** A decimal result row: `⁻12.5`, `1.2345*10⁴` (ee node) or Classic `1.2345*10^4`. */
export function decimalRow(x: number, modes: Modes): Row {
  return partsRow(numberParts(x, modes), isMP(modes));
}

function partsRow(p: NumParts, mp: boolean): Row {
  const out: Row = [];
  if (p.neg) out.push(sym("neg"));
  out.push(...symsOf(p.mant));
  if (p.exp !== null) out.push(...tenPower(p.exp, mp));
  return out;
}

function tenPower(e: number, mp: boolean): Row {
  const exp = symsOf(e < 0 ? `⁻${-e}` : String(e));
  return mp ? [{ t: "ee", exp }] : [sym("mul"), sym("1"), sym("0"), sym("caret"), ...exp];
}

// ---------------------------------------------------------------------------------------------
// exact forms

const digitsRow = (n: bigint): Row => symsOf(abs(n).toString());

/** The numerator content of a√b·π: `5√2`, `√2`, `3π`, `π`, `7`. */
function numerator(n: bigint, e: Exact): Row {
  const out: Row = [];
  const a = abs(n);
  if (a !== 1n || (e.root === 1n && !e.pi)) out.push(...digitsRow(a));
  if (e.root !== 1n) out.push({ t: "sqrt", rad: digitsRow(e.root) });
  if (e.pi) out.push(sym("pi"));
  return out;
}

export function exactRow(e: Exact, modes: Modes, mixed = false): Row {
  const out: Row = e.n < 0n ? [sym("neg")] : [];
  const mp = isMP(modes);
  if (mixed && isRational(e) && abs(e.n) > e.d) {
    const a = abs(e.n);
    const whole = a / e.d;
    const rem = a % e.d;
    if (mp) out.push({ t: "mixed", whole: digitsRow(whole), num: digitsRow(rem), den: digitsRow(e.d) });
    else out.push(...digitsRow(whole), sym("mixsep"), ...digitsRow(rem), sym("fracbar"), ...digitsRow(e.d));
    return out;
  }
  if (!mp) {
    out.push(...digitsRow(e.n), sym("fracbar"), ...digitsRow(e.d));
    return out;
  }
  const num = numerator(e.n, e);
  if (e.d === 1n) out.push(...num);
  else out.push({ t: "frac", num, den: digitsRow(e.d) });
  return out;
}

// ---------------------------------------------------------------------------------------------
// ▸% and ▸DMS

function percentRow(v: Value, modes: Modes): Row {
  const e = v.exact;
  const hundred = e && isRational(e) ? mk(e.n * 100n, e.d) : { re: norm(v.re * 100) };
  return [...decimalRow(hundred.re, modes), sym("percent")];
}

/**
 * D°M′S″ with whole degrees and minutes and the seconds rounded to fit the 10-digit display: FLOAT
 * keeps as many second decimals as fit, FIX n keeps at most n; trailing zeros are stripped, so whole
 * seconds show as `0″` (GB p.18: `1°30′0″`; GB p.19 FIX 2: `39°26′23″`). SPEC: assumption for
 * fractional seconds (M §11.9).
 */
export function dmsRow(x: number, modes: Modes): Row {
  const neg = x < 0;
  const ax = Math.abs(x);
  let d = Math.floor(ax);
  const mf = norm((ax - d) * 60);
  let m = Math.floor(mf);
  const sx = norm((mf - m) * 60);
  const used = String(d).length + 2 + String(Math.floor(sx)).length;
  const room = Math.max(0, 10 - used);
  const decs = modes.decimals === "FLOAT" ? room : Math.min(room, modes.decimals);
  let s = Number(fixedText(roundDec(digitsOf(sx), decs), decs, false));
  if (s >= 60) {
    s -= 60;
    m++;
  }
  if (m >= 60) {
    m -= 60;
    d++;
  }
  const sText = fixedText(roundDec(digitsOf(s), decs), decs, false);
  return [
    ...(neg ? [sym("neg")] : []),
    ...symsOf(String(d)), sym("deg"), ...symsOf(String(m)), sym("min"), ...symsOf(sText), sym("sec"),
  ];
}

// ---------------------------------------------------------------------------------------------
// the answer as an entry row (◂▸ and conversions pressed first insert it; K §4.4)

/**
 * The previous answer as an entry row: its exact form (as displayed), or the decimal with up to 13
 * significant digits (`0.7853981633975`, `39.43972222221`, `9.42477796077`; GB p.19, p.21, TG p.114).
 * Large or tiny decimals use ×10ⁿ (outside 1E−5 ≤ |x| < 1E13; SPEC: assumption).
 */
export function answerRow(v: Value, modes: Modes): Row {
  if (v.exact && showsExact(v.exact, modes)) return exactRow(v.exact, modes, v.form === "mixed");
  if (v.exact && isIntegerExact(v.exact) && abs(v.exact.n) < 10n ** 13n) return [...(v.exact.n < 0n ? [sym("neg")] : []), ...digitsRow(v.exact.n)];
  const g = digitsOf(v.re);
  const out: Row = v.re < 0 ? [sym("neg")] : [];
  if (g.d === "") return [sym("0")];
  if (g.e >= -5 && g.e < 13) return [...out, ...symsOf(fixedText(g, 20, false))];
  const mant: Digits = { d: g.d, e: 0 };
  return [...out, ...symsOf(fixedText(mant, 12, false)), ...tenPower(g.e, isMP(modes))];
}

// ---------------------------------------------------------------------------------------------
// ◂▸ toggle

/** Does a result row show an exact form (fraction, mixed number, radical or π)? */
export function rowIsExact(r: Row): boolean {
  return r.some((n) => n.t === "frac" || n.t === "mixed" || n.t === "sqrt" ||
    (n.t === "sym" && (n.s === "pi" || n.s === "fracbar" || n.s === "mixsep")));
}

/**
 * The alternate form of a result (K §4.16): an exact form shows as a decimal (FIX applies); a decimal
 * shows as a fraction, π multiple or radical when one matches all 13 digits. Null when there is none
 * (integers; decimals with no exact match).
 */
export function alternate(v: Value, current: Row, modes: Modes): { value: Value; row: Row } | null {
  if (rowIsExact(current)) {
    const value: Value = { re: v.re };
    return { value, row: decimalRow(v.re, modes) };
  }
  if (v.form === "dms" || v.form === "percent") {
    return { value: { re: v.re }, row: decimalRow(v.re, modes) };
  }
  if (v.exact && showsExact(v.exact, modes)) return { value: { re: v.re, exact: v.exact }, row: exactRow(v.exact, modes) };
  const found = recognize(v.re, isMP(modes));
  if (!found?.exact || !showsExact(found.exact, modes)) return null;
  return { value: found, row: exactRow(found.exact, modes) };
}

/**
 * Find an exact form for a 13-digit decimal: n/d (d ≤ 1000, |n| < 10^6), then in MathPrint aπ/c and
 * a√b/c (b square-free ≤ 1000, c ≤ 100). Matches must agree in all 13 digits. Radicals are a
 * SPEC: assumption (K §4.16 lists fractions and π); they make ◂▸ round-trip `2√2 ◂▸ ◂▸`.
 */
export function recognize(x: number, mp: boolean): Value | null {
  if (Number.isInteger(x) || x === 0) return null;
  const f = bestFraction(x, Number(MAX_DEN));
  if (f && Math.abs(f[0]) < Number(MAX_NUM)) return mk(BigInt(f[0]), BigInt(f[1]));
  if (!mp) return null;
  const p = bestFraction(x / PI13, Number(MAX_DEN), (n, d) => near13(norm((n / d) * PI13), x));
  if (p && Math.abs(p[0]) < Number(MAX_NUM)) return mk(BigInt(p[0]), BigInt(p[1]), 1n, true);
  for (let b = 2; b <= 1000; b++) {
    const sp = squarePart(BigInt(b));
    if (!sp || sp[0] !== 1n) continue;
    const rb = Math.sqrt(b);
    const q = bestFraction(x / rb, 100, (n, d) => near13(norm((n / d) * rb), x));
    if (q && Math.abs(q[0]) < Number(MAX_NUM)) return mk(BigInt(q[0]), BigInt(q[1]), BigInt(b));
  }
  return null;
}

/** The continued-fraction convergent n/d (d ≤ maxDen) that matches x to 13 digits, if any. */
function bestFraction(x: number, maxDen: number, ok?: (n: number, d: number) => boolean): [number, number] | null {
  const test = ok ?? ((n: number, d: number) => near13(norm(n / d), x));
  let [h0, h1] = [0, 1];
  let [k0, k1] = [1, 0];
  let y = x;
  for (let i = 0; i < 40; i++) {
    const a = Math.floor(y);
    [h0, h1] = [h1, a * h1 + h0];
    [k0, k1] = [k1, a * k1 + k0];
    if (k1 > maxDen) return null;
    if (test(h1, k1)) return [h1, k1];
    const f = y - a;
    if (f < 1e-15) return null;
    y = 1 / f;
  }
  return null;
}

// ---------------------------------------------------------------------------------------------
// restricted contexts: StatVars menu, Recall Var, data editor, table (E notation)

/**
 * A number as plain text for restricted contexts (M §2.2 rules 5 and 7): `0.677325190`, `⁻18.6663732`,
 * `196ᴇ3`. NORM FLOAT values are cut to `width` characters (sign and point included) by rounding,
 * keeping trailing zeros that the rounding produces (StatVars `a=0.677325190`, GB p.28); FIX pads.
 * SCI/ENG, and NORM values that do not fit, use the small-caps E (`2ᴇ3`). Null shows `Error`.
 */
export function formatNumberText(x: number | null, modes: Pick<Modes, "notation" | "decimals">, width = 11): string {
  if (x === null) return "Error";
  const sign = x < 0 ? "⁻" : "";
  const g = digitsOf(x);
  const fix = modes.decimals === "FLOAT" ? null : modes.decimals;
  if (modes.notation === "NORM" && (g.d === "" || Math.abs(x) >= 1e-9)) {
    const room = width - sign.length - intDigits(g) - 1;
    if (g.d === "") return fixedText(g, fix ?? 0, fix !== null);
    if (room >= 0 || intDigits(g) <= width - sign.length) {
      const natural = Math.max(0, g.d.length - (g.e + 1));
      const decs = Math.max(0, Math.min(room, fix ?? natural));
      const r = roundDec(g, decs);
      const text = fixedText(r, decs, fix !== null || (natural > room && decs > 0));
      if (sign.length + text.length <= width) return sign + text;
    }
  }
  const p = sciParts(g, modes.notation === "ENG", fix);
  let mant = p.mant;
  const tail = `ᴇ${p.exp < 0 ? "⁻" : ""}${Math.abs(p.exp)}`;
  const roomM = width - sign.length - tail.length;
  if (fix === null && mant.length > roomM && mant.includes(".")) {
    const intLen = mant.indexOf(".");
    const decs = Math.max(0, roomM - intLen - 1);
    const md = digitsOf(Number(mant));
    mant = fixedText(roundDec(md, decs), decs, false);
  }
  return sign + mant + tail;
}
