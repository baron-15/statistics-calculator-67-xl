/**
 * The 13-significant-digit decimal model (M §2.1), on top of IEEE doubles.
 *
 * Every decimal result is normalized by `norm`: first rounded to 15 significant digits (which removes
 * binary noise such as 0.7·3 = 2.0999999999999996), then TRUNCATED to 13 significant digits.
 * Truncation reproduces the guidebook's `39.43972222221` for 12°31′45″+26°54′38″ (GB-057c), where
 * rounding would give …223 (M §2.1 [inferred from one data point]). SPEC: assumption.
 *
 * π and e are the device's 13-digit constants (GB p.17, p.23).
 *
 * Range (M §2.5 [unverified]): |x| ≥ 1E100 is OVERFLOW; nonzero |x| < 1E−99 underflows to 0.
 */
import { CalcError } from "../errors";

export const PI13 = 3.14159265359;
export const E13 = 2.718281828459;

/** Normalize a computed real to the device's 13 significant digits. Throws OVERFLOW. */
export function norm(x: number): number {
  if (!Number.isFinite(x)) throw new CalcError("OVERFLOW");
  if (x === 0) return 0;
  const ax = Math.abs(x);
  const [m = "", ex = "0"] = ax.toExponential(14).split("e");
  const digits = m.replace(".", "").slice(0, 13);
  const r = Number(`${digits[0]}.${digits.slice(1)}e${ex}`);
  if (r >= 1e100) throw new CalcError("OVERFLOW");
  if (r < 1e-99) return 0;
  return x < 0 ? -r : r;
}

/**
 * Significant digits of a (normalized) nonzero magnitude: value = 0.D × 10^(e+1), i.e. D[0] is the
 * 10^e digit. `d` has no trailing zeros. Zero is { d: "", e: 0 }.
 */
export interface Digits {
  d: string;
  e: number;
}

export function digitsOf(x: number): Digits {
  const ax = Math.abs(x);
  if (ax === 0) return { d: "", e: 0 };
  const [m = "", ex = "0"] = ax.toExponential(12).split("e");
  return { d: m.replace(".", "").replace(/0+$/, ""), e: Number(ex) };
}

/** Round half up to `keep` significant digits (keep may be ≤ 0: the result is then 0 or one unit). */
export function roundSig(g: Digits, keep: number): Digits {
  if (g.d === "" || keep >= g.d.length) return g;
  if (keep < 0) return { d: "", e: 0 };
  const up = (g.d[keep] ?? "0") >= "5";
  if (keep === 0) return up ? { d: "1", e: g.e + 1 } : { d: "", e: 0 };
  let head = g.d.slice(0, keep);
  if (up) {
    const arr = head.split("");
    let i = arr.length - 1;
    for (; i >= 0; i--) {
      if (arr[i] === "9") arr[i] = "0";
      else {
        arr[i] = String(Number(arr[i]) + 1);
        break;
      }
    }
    head = arr.join("");
    if (i < 0) return { d: "1", e: g.e + 1 };
  }
  head = head.replace(/0+$/, "");
  return head === "" ? { d: "", e: 0 } : { d: head, e: g.e };
}

/** Round half up at `dec` decimal places. */
export const roundDec = (g: Digits, dec: number): Digits => roundSig(g, g.e + 1 + dec);

/**
 * Plain positional text of digits (no sign), with exactly `dec` decimals when `pad`, otherwise with
 * the digits present (at most `dec`). Digits beyond `dec` must already be rounded away.
 */
export function fixedText(g: Digits, dec: number, pad: boolean): string {
  if (g.d === "") return pad && dec > 0 ? `0.${"0".repeat(dec)}` : "0";
  let int: string;
  let frac: string;
  if (g.e >= 0) {
    int = g.d.slice(0, g.e + 1).padEnd(g.e + 1, "0");
    frac = g.d.slice(g.e + 1);
  } else {
    int = "0";
    frac = "0".repeat(-g.e - 1) + g.d;
  }
  frac = frac.slice(0, Math.max(0, dec));
  if (pad) frac = frac.padEnd(dec, "0");
  else frac = frac.replace(/0+$/, "");
  return frac ? `${int}.${frac}` : int;
}

/** Number of digits left of the point (the leading 0 of a number below 1 counts as one; M §2.2). */
export const intDigits = (g: Digits): number => (g.d === "" || g.e < 0 ? 1 : g.e + 1);

/** One unit in the 13th significant digit of x (the comparison tolerance for 13-digit values). */
export function ulp13(x: number): number {
  if (x === 0) return 1e-112;
  return 10 ** (Math.floor(Math.log10(Math.abs(x))) - 12);
}

/** Two 13-digit values agree within `units` units of the 13th digit. */
export const near13 = (a: number, b: number, units = 2): boolean =>
  Math.abs(a - b) <= units * ulp13(Math.max(Math.abs(a), Math.abs(b)));
