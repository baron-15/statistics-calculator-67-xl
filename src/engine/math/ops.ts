/**
 * Value-level arithmetic and functions. Each operation keeps the exact form when the device does
 * (MathPrint: fractions, a√b/c, aπ/c, exact trig values; Classic: fractions only) and otherwise
 * computes a 13-digit decimal. Domain errors follow the guidebook list (GB p.37, M §8.1).
 *
 * Exactness rules (M §3, SPEC decision 3):
 * - A decimal operand (from a typed decimal point, a decimal variable, a function value…) makes the
 *   result decimal.
 * - `÷` is decimal division: its result is a decimal unless the quotient is an integer
 *   (`Ans÷3` → 85.66666667 with Ans = 257, TG p.73; `Ans÷4` → 56.25, GB p.11). The n/d template,
 *   x⁻¹ and negative integer powers stay exact (`2⁻¹` → 1/2, `10^⁻2` → 1/100). The integer exception
 *   (`6÷2*π` → 3π) is a SPEC: assumption.
 * - `%` is a decimal ÷100 ("results of percent calculations display according to the decimal
 *   notation mode setting", TG p.45).
 */
import { CalcError } from "../errors";
import { E13, norm, PI13 } from "./decimal";
import {
  abs, addEx, dec, divEx, int, isIntegerExact, isRational, mk, mulEx, powIntEx, rootEx, sqrtEx,
} from "./exact";
import type { Value } from "./value";

export interface Env {
  /** MathPrint: radicals and π stay exact. Classic: only fractions do. */
  mp: boolean;
  angle: "DEG" | "RAD" | "GRAD";
}

const exactOf = (v: Value) => v.exact;

/** Strip forms the current mode cannot keep (Classic: radicals and π become decimals). */
export function forMode(v: Value, env: Env): Value {
  const e = v.exact;
  if (!e) return v.form ? { re: v.re } : v;
  if (!env.mp && !isRational(e)) return { re: v.re };
  return v.form ? { re: v.re, exact: e } : v;
}

export const isInt = (v: Value): boolean => Number.isInteger(v.re);

export function neg(a: Value): Value {
  const e = exactOf(a);
  return e ? mk(-e.n, e.d, e.root, e.pi) : { re: a.re === 0 ? 0 : -a.re };
}

export function add(a: Value, b: Value): Value {
  const ea = exactOf(a);
  const eb = exactOf(b);
  if (ea && eb) {
    const r = addEx(ea, eb);
    if (r) return r;
  }
  return dec(a.re + b.re);
}

export const sub = (a: Value, b: Value): Value => add(a, neg(b));

export function mul(a: Value, b: Value): Value {
  const ea = exactOf(a);
  const eb = exactOf(b);
  if (ea && eb) {
    const r = mulEx(ea, eb);
    if (r) return r;
  }
  return dec(a.re * b.re);
}

/** Exact division (fraction templates, x⁻¹, negative powers). */
export function divide(a: Value, b: Value): Value {
  if (b.re === 0 && !(b.exact && b.exact.n !== 0n)) throw new CalcError("DIVIDE BY 0");
  const ea = exactOf(a);
  const eb = exactOf(b);
  if (ea && eb) {
    const r = divEx(ea, eb);
    if (r) return r;
  }
  return dec(a.re / b.re);
}

/** The ÷ key: decimal division, exact only when the quotient is an integer. */
export function divOp(a: Value, b: Value): Value {
  const q = divide(a, b);
  if (q.exact && isIntegerExact(q.exact)) return q;
  return { re: q.re };
}

export function percent(a: Value): Value {
  return dec(a.re / 100);
}

export function recip(a: Value): Value {
  return divide(int(1), a);
}

export function square(a: Value): Value {
  return mul(a, a);
}

// ---------------------------------------------------------------------------------------------
// powers and roots

/** y^x (GB p.37: y = 0 and x = 0, or y < 0 and x not an integer → DOMAIN). */
export function pow(y: Value, x: Value, env: Env): Value {
  const ex = exactOf(x);
  const ey = exactOf(y);
  if (isInt(x)) {
    const k = ex && isIntegerExact(ex) ? ex.n : BigInt(x.re);
    if (y.re === 0) {
      if (k === 0n) throw new CalcError("DOMAIN");
      if (k < 0n) throw new CalcError("DIVIDE BY 0");
      return int(0);
    }
    if (ey && ex && isIntegerExact(ex)) {
      const r = powIntEx(ey, k);
      if (r) return r;
    }
    return dec(intPowReal(y.re, x.re));
  }
  if (y.re < 0) throw new CalcError("DOMAIN");
  if (y.re === 0) {
    if (x.re < 0) throw new CalcError("DIVIDE BY 0");
    return int(0);
  }
  // rational exponent p/q on an exact rational base: exact when the q-th root is exact
  if (ex && ey && isRational(ex) && isRational(ey) && ex.d <= 64n) {
    const q = Number(ex.d);
    const base = q === 2 && env.mp ? sqrtEx(ey) : rootEx(ey, q);
    if (base && base.exact) {
      const r = powIntEx(base.exact, ex.n);
      if (r) return r;
    }
  }
  return dec(Math.pow(y.re, x.re));
}

function intPowReal(y: number, k: number): number {
  const r = Math.pow(y, k);
  if (!Number.isFinite(r) || Math.abs(r) >= 1e100) throw new CalcError("OVERFLOW");
  return r;
}

/** e^x. */
export function expE(x: Value): Value {
  if (x.re === 0) return int(1);
  const r = Math.exp(x.re);
  if (!Number.isFinite(r)) throw new CalcError("OVERFLOW");
  return dec(r);
}

/** √x (DOMAIN for x < 0). Exact in MathPrint for rationals: √8 → 2√2, √(1/2) → √2/2. */
export function sqrt(x: Value, env: Env): Value {
  if (x.re < 0) throw new CalcError("DOMAIN");
  const e = exactOf(x);
  if (e && env.mp) {
    const r = sqrtEx(e);
    if (r) return r;
  }
  return dec(Math.sqrt(x.re));
}

/** ˣ√y: the x-th root of y (GB p.37: x = 0, or y < 0 and x not an odd integer → DOMAIN). */
export function nthRoot(x: Value, y: Value, env: Env): Value {
  if (x.re === 0) throw new CalcError("DOMAIN");
  const oddInt = isInt(x) && Math.abs(x.re) % 2 === 1;
  if (y.re < 0 && !oddInt) throw new CalcError("DOMAIN");
  const ex = exactOf(x);
  const ey = exactOf(y);
  if (env.mp && ex && ey && isIntegerExact(ex) && abs(ex.n) <= 64n) {
    const k = Number(abs(ex.n));
    const r = k === 2 ? sqrtEx(ey) : rootEx(ey, k);
    if (r) return ex.n < 0n ? recip(r) : r;
  }
  if (y.re === 0) {
    if (x.re < 0) throw new CalcError("DIVIDE BY 0");
    return int(0);
  }
  const mag = Math.pow(Math.abs(y.re), 1 / x.re);
  return dec(y.re < 0 ? -mag : mag);
}

// ---------------------------------------------------------------------------------------------
// logarithms

export function log10(x: Value): Value {
  if (x.re <= 0) throw new CalcError("DOMAIN");
  const e = exactOf(x);
  if (e && isRational(e)) {
    // log of an exact power of ten is exact: log(10^5) = 5 (GB-075), log(1) = 0
    const k = powerOfTen(e.n, e.d);
    if (k !== null) return int(k);
  }
  return dec(Math.log10(x.re));
}

function powerOfTen(n: bigint, d: bigint): number | null {
  const isPow = (v: bigint): number | null => {
    let k = 0;
    while (v > 1n && v % 10n === 0n) {
      v /= 10n;
      k++;
    }
    return v === 1n ? k : null;
  };
  if (d === 1n) return isPow(n);
  if (n === 1n) {
    const k = isPow(d);
    return k === null ? null : -k;
  }
  return null;
}

export function ln(x: Value): Value {
  if (x.re <= 0) throw new CalcError("DOMAIN");
  if (x.exact && isIntegerExact(x.exact) && x.exact.n === 1n) return int(0);
  return dec(Math.log(x.re));
}

export const eConst = (): Value => ({ re: E13 });

export const piConst = (env: Env): Value => (env.mp ? mk(1n, 1n, 1n, true) : { re: PI13 });

// ---------------------------------------------------------------------------------------------
// angles and trigonometry

/** Degrees per unit of the angle mode. */
const DEG_PER: Record<Env["angle"], number> = { DEG: 1, RAD: 180 / PI13, GRAD: 0.9 };

/**
 * An angle-unit modifier (° ′ ″ ʳ ᵍ; GB p.18): the operand is in the modifier's unit and the result in
 * the mode's unit. ° ʳ ᵍ convert exactly when they can (`30°` in RAD is π/6, `πʳ` in DEG is 180);
 * ′ and ″ are decimal (45°30′ → 45.5, not 91/2: TG p.118 shows 81.75 for 45°30′+36°15′).
 */
export function angleMark(v: Value, mark: "deg" | "min" | "sec" | "radian" | "grad", env: Env): Value {
  if (mark === "min" || mark === "sec") {
    const deg = dec(v.re / (mark === "min" ? 60 : 3600));
    return env.angle === "DEG" ? deg : fromDegrees(deg, env);
  }
  const from: Env["angle"] = mark === "deg" ? "DEG" : mark === "radian" ? "RAD" : "GRAD";
  if (from === env.angle) return v;
  return fromDegrees(toDegrees(v, from), env);
}

const PI_OVER = (n: bigint): Value => mk(1n, n, 1n, true);

/** An angle in `unit` expressed in degrees (exact when possible). */
function toDegrees(v: Value, unit: Env["angle"]): Value {
  if (unit === "DEG") return v;
  if (unit === "GRAD") return mul(v, mk(9n, 10n));
  // radians → degrees: ×180/π, exact when v is a multiple of π
  if (v.exact && v.exact.pi) return mul(divide(v, PI_OVER(1n)), int(180));
  return dec(v.re * (180 / PI13));
}

/** An angle in degrees expressed in the mode's unit. */
function fromDegrees(v: Value, env: Env): Value {
  if (env.angle === "DEG") return v;
  if (env.angle === "GRAD") return mul(v, mk(10n, 9n));
  if (env.mp && v.exact && isRational(v.exact)) return mul(v, PI_OVER(180n));
  return dec(v.re * (PI13 / 180));
}

/**
 * The exact angle in degrees, when exact trig applies: MathPrint, DEG or RAD mode (TG p.123: "in
 * MathPrint mode and the corresponding mode setting of DEG or RAD"), and an exact rational number of
 * degrees, or a rational multiple of π radians.
 */
function exactDegrees(x: Value, env: Env): bigint | null {
  const e = x.exact;
  if (!env.mp || !e || e.root !== 1n) return null;
  let deg: Value;
  if (env.angle === "DEG") {
    if (e.pi) return null;
    deg = x;
  } else if (env.angle === "RAD") {
    if (!e.pi && e.n !== 0n) return null;
    deg = e.n === 0n ? int(0) : mul(divide(x, PI_OVER(1n)), int(180));
  } else return null;
  const de = deg.exact;
  if (!de || !isIntegerExact(de)) return null;
  return de.n;
}

/** sin of a multiple of 15°, as [n, d, root] (√ forms only; 15° itself needs a sum and is decimal). */
const SIN_TABLE: Record<number, [bigint, bigint, bigint] | null> = {
  0: [0n, 1n, 1n], 15: null, 30: [1n, 2n, 1n], 45: [1n, 2n, 2n], 60: [1n, 2n, 3n], 75: null, 90: [1n, 1n, 1n],
};

function exactSin(deg: bigint): Value | null {
  let a = Number(((deg % 360n) + 360n) % 360n);
  let sign = 1n;
  if (a >= 180) {
    a -= 180;
    sign = -1n;
  }
  if (a > 90) a = 180 - a;
  const t = SIN_TABLE[a];
  if (!t) return null;
  return mk(sign * t[0], t[1], t[2]);
}

const exactCos = (deg: bigint): Value | null => exactSin(deg + 90n);

/** An angle (mode units) in degrees as a 13-digit decimal reduced to [0, 360). */
function decimalDegrees(x: Value, env: Env): number {
  if (Math.abs(x.re) >= 1e10) throw new CalcError("OVERFLOW");
  const deg = norm(x.re * DEG_PER[env.angle]);
  return ((deg % 360) + 360) % 360;
}

function sinDeg(d: number): number {
  if (d % 180 === 0) return 0;
  if (d === 90) return 1;
  if (d === 270) return -1;
  return Math.sin((d * Math.PI) / 180);
}

function cosDeg(d: number): number {
  return sinDeg((d + 90) % 360);
}

export function sin(x: Value, env: Env): Value {
  const d = exactDegrees(x, env);
  if (d !== null) {
    const r = exactSin(d);
    if (r) return r;
  }
  return dec(sinDeg(decimalDegrees(x, env)));
}

export function cos(x: Value, env: Env): Value {
  const d = exactDegrees(x, env);
  if (d !== null) {
    const r = exactCos(d);
    if (r) return r;
  }
  return dec(cosDeg(decimalDegrees(x, env)));
}

export function tan(x: Value, env: Env): Value {
  const d = exactDegrees(x, env);
  if (d !== null) {
    if (((d % 180n) + 180n) % 180n === 90n) throw new CalcError("DOMAIN");
    const s = exactSin(d);
    const c = exactCos(d);
    if (s && c) return divide(s, c);
  }
  const deg = decimalDegrees(x, env);
  if (deg % 180 === 90) throw new CalcError("DOMAIN");
  if (deg % 180 === 0) return int(0);
  return dec(Math.tan((deg * Math.PI) / 180));
}

/** Radians (true π) to the mode's unit, consistent with the 13-digit π (atan(1) in RAD = 0.7853981633975, GB p.21). */
function fromRadians(r: number, env: Env): Value {
  const unit = env.angle === "DEG" ? 180 / Math.PI : env.angle === "GRAD" ? 200 / Math.PI : PI13 / Math.PI;
  return dec(r * unit);
}

export function asin(x: Value, env: Env): Value {
  if (Math.abs(x.re) > 1) throw new CalcError("DOMAIN");
  return fromRadians(Math.asin(x.re), env);
}

export function acos(x: Value, env: Env): Value {
  if (Math.abs(x.re) > 1) throw new CalcError("DOMAIN");
  return fromRadians(Math.acos(x.re), env);
}

export function atan(x: Value, env: Env): Value {
  return fromRadians(Math.atan(x.re), env);
}

/** Hyperbolics ignore the angle mode (GB p.22). |x| ≥ 1E10 is OVERFLOW (TG C-1). */
export function hyp(fn: "sinh" | "cosh" | "tanh" | "asinh" | "acosh" | "atanh", x: Value): Value {
  const v = x.re;
  switch (fn) {
    case "sinh":
    case "cosh":
    case "tanh":
      if (Math.abs(v) >= 1e10) throw new CalcError("OVERFLOW");
      if (v === 0 && fn !== "cosh") return int(0);
      return dec(Math[fn](v));
    case "asinh":
      return dec(Math.asinh(v));
    case "acosh":
      if (v < 1) throw new CalcError("DOMAIN");
      return dec(Math.acosh(v));
    case "atanh":
      if (Math.abs(v) >= 1) throw new CalcError("DOMAIN");
      return dec(Math.atanh(v));
  }
}

// polar ↔ rectangular (GB p.20). Decimal results: P▸Ry(7,30) shows 3.5, not 7/2 (TG p.122).
export function rToPr(x: Value, y: Value): Value {
  return dec(Math.hypot(x.re, y.re));
}

/** R▸Pθ: atan2 convention, (−180°, 180°]; R▸Pθ(0,0) = 0. SPEC: assumption (M §4.2). */
export function rToPtheta(x: Value, y: Value, env: Env): Value {
  if (x.re === 0 && y.re === 0) return int(0);
  return fromRadians(Math.atan2(y.re, x.re), env);
}

export function pToRx(r: Value, theta: Value, env: Env): Value {
  return dec(r.re * cosDeg(decimalDegrees(theta, env)));
}

export function pToRy(r: Value, theta: Value, env: Env): Value {
  return dec(r.re * sinDeg(decimalDegrees(theta, env)));
}

// ---------------------------------------------------------------------------------------------
// probability (GB p.29, p.37)

function nonNegInt(v: Value, max = Infinity): bigint {
  if (!isInt(v) || v.re < 0 || v.re > max) throw new CalcError("DOMAIN");
  return BigInt(v.re);
}

export function factorial(v: Value): Value {
  const n = nonNegInt(v, 69);
  let r = 1n;
  for (let i = 2n; i <= n; i++) r *= i;
  return big(r);
}

/** nPr; r > n gives 0 (SPEC: assumption, M §11.12). */
export function nPr(nv: Value, rv: Value): Value {
  const n = nonNegInt(nv);
  const r = nonNegInt(rv);
  if (r > n) return int(0);
  if (r >= 70n) throw new CalcError("OVERFLOW"); // ≥ 70! > 1E100
  let p = 1n;
  for (let i = 0n; i < r; i++) p *= n - i;
  return big(p);
}

/** nCr; r > n gives 0 (SPEC: assumption). */
export function nCr(nv: Value, rv: Value): Value {
  const n = nonNegInt(nv);
  let r = nonNegInt(rv);
  if (r > n) return int(0);
  if (n - r < r) r = n - r;
  if (r >= 340n) throw new CalcError("OVERFLOW"); // C(2r, r) > 1E100
  let c = 1n;
  for (let i = 1n; i <= r; i++) c = (c * (n - r + i)) / i;
  return big(c);
}

/** A (possibly huge) integer result: exact when it fits, else a decimal, OVERFLOW from 1E100. */
function big(n: bigint): Value {
  if (n >= 10n ** 100n) throw new CalcError("OVERFLOW");
  return mk(n);
}

/** randint(A,B) = A + ⌊u·(B−A+1)⌋ (M §4.5 [inferred]); A > B are swapped and non-integers are DOMAIN (SPEC: assumption). */
export function randint(a: Value, b: Value, u: number): Value {
  if (!isInt(a) || !isInt(b)) throw new CalcError("DOMAIN");
  let lo = a.re;
  let hi = b.re;
  if (lo > hi) [lo, hi] = [hi, lo];
  return int(lo + Math.floor(u * (hi - lo + 1)));
}
