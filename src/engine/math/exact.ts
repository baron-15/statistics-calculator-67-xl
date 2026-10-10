/**
 * Exact values: (n/d)·√root·π^pi with bigints (M §3.5). Arithmetic here stays exact while the
 * result has a form the TI-30XS shows, and otherwise falls back to a 13-digit decimal (`dec`).
 *
 * Limits:
 * - Precision: an exact value whose numerator, denominator or radicand reaches 10^13 becomes a decimal
 *   (beyond 13 digits the device has nothing more to show).
 * - Display (applied to final results by `displayable`; SPEC: assumption, M §3.2 / §11.1): a fraction
 *   is shown when the reduced denominator is ≤ 1000 and the numerator magnitude is < 10^6, which
 *   admits the largest TI example 12167/1000 (TG p.104); the same bounds hold for the coefficient of
 *   a√b/c and aπ/c, and the radicand must be < 10^6. Otherwise the decimal is shown.
 */
import { CalcError } from "../errors";
import { norm, PI13 } from "./decimal";
import type { Exact, Value } from "./value";

export const PREC_LIMIT = 10n ** 13n;
export const MAX_DEN = 1000n;
export const MAX_NUM = 10n ** 6n;
export const MAX_ROOT = 10n ** 6n;

export const abs = (a: bigint): bigint => (a < 0n ? -a : a);

export function gcd(a: bigint, b: bigint): bigint {
  a = abs(a);
  b = abs(b);
  while (b) [a, b] = [b, a % b];
  return a;
}

/** ⌊√n⌋ for n ≥ 0. */
export function isqrt(n: bigint): bigint {
  if (n < 2n) return n;
  let x = BigInt(Math.floor(Math.sqrt(Number(n))));
  while (x * x > n) x--;
  while ((x + 1n) * (x + 1n) <= n) x++;
  return x;
}

/** Exact integer k-th root of n ≥ 0, or null when n is not a perfect k-th power. */
export function iroot(n: bigint, k: number): bigint | null {
  if (n < 2n) return n;
  let x = BigInt(Math.round(Number(n) ** (1 / k)));
  for (const c of [x - 1n, x, x + 1n]) if (c >= 0n && c ** BigInt(k) === n) return c;
  // large values: Newton refinement
  const K = BigInt(k);
  x = BigInt(Math.floor(Number(n) ** (1 / k))) + 1n;
  for (let i = 0; i < 200; i++) {
    const y = ((K - 1n) * x + n / x ** (K - 1n)) / K;
    if (y >= x) break;
    x = y;
  }
  for (const c of [x - 1n, x, x + 1n]) if (c >= 0n && c ** K === n) return c;
  return null;
}

/**
 * n = out²·inside with `inside` square-free, or null when n is too large to factor (> 10^12).
 * Trial division up to 10^4 leaves a cofactor that is 1, a prime, a prime square or a product of
 * two primes; only the prime square needs a check.
 */
export function squarePart(n: bigint): [bigint, bigint] | null {
  if (n < 0n || n > 10n ** 12n) return null;
  let out = 1n;
  let inside = 1n;
  let m = n;
  for (let p = 2n; p * p <= m && p <= 10000n; p += p === 2n ? 1n : 2n) {
    let k = 0;
    while (m % p === 0n) {
      m /= p;
      k++;
    }
    if (k) {
      out *= p ** BigInt(k >> 1);
      if (k & 1) inside *= p;
    }
  }
  if (m > 1n) {
    const r = isqrt(m);
    if (r * r === m) out *= r;
    else inside *= m;
  }
  return [out, inside];
}

export const ZERO: Exact = { n: 0n, d: 1n, root: 1n, pi: false };

/** A decimal value (no exact form), normalized to 13 digits. */
export const dec = (x: number): Value => ({ re: norm(x) });

/** The real value of an exact form (π is the 13-digit constant). */
export function exactRe(e: Exact): number {
  let x = Number(e.n) / Number(e.d);
  if (e.root !== 1n) x *= Math.sqrt(Number(e.root));
  if (e.pi) x *= PI13;
  return x;
}

/**
 * Build a normalized exact value: (n/d)·√root·π^pi with any n, d ≠ 0, root ≥ 1. Square factors of
 * the radicand move into the coefficient. Falls back to a decimal when the value has no exact form
 * (√ together with π) or exceeds the precision limit.
 */
export function mk(n: bigint, d: bigint = 1n, root: bigint = 1n, pi = false): Value {
  if (d === 0n) throw new CalcError("DIVIDE BY 0");
  if (d < 0n) {
    n = -n;
    d = -d;
  }
  if (n === 0n) return { re: 0, exact: ZERO };
  if (root !== 1n) {
    const sp = squarePart(root);
    if (!sp) return dec((Number(n) / Number(d)) * Math.sqrt(Number(root)) * (pi ? PI13 : 1));
    n *= sp[0];
    root = sp[1];
  }
  const g = gcd(n, d);
  n /= g;
  d /= g;
  const e: Exact = { n, d, root, pi };
  if ((root !== 1n && pi) || abs(n) >= PREC_LIMIT || d >= PREC_LIMIT || root >= PREC_LIMIT) return dec(exactRe(e));
  return { re: norm(exactRe(e)), exact: e };
}

export const int = (n: bigint | number): Value => mk(BigInt(n));

export const isZero = (v: Value): boolean => v.re === 0;
export const isRational = (e: Exact): boolean => e.root === 1n && !e.pi;
export const isIntegerExact = (e: Exact): boolean => isRational(e) && e.d === 1n;

/** The exact form, if the value has one. */
export const ex = (v: Value): Exact | undefined => v.exact;

/** Can this exact value be shown as an exact result (fraction, a√b/c, aπ/c)? */
export function displayable(e: Exact): boolean {
  if (isIntegerExact(e)) return true;
  return abs(e.n) < MAX_NUM && e.d <= MAX_DEN && e.root < MAX_ROOT && !(e.root !== 1n && e.pi);
}

// ---------------------------------------------------------------------------------------------
// exact arithmetic (callers guarantee both operands are exact)

export function addEx(a: Exact, b: Exact, sign: 1n | -1n = 1n): Value | null {
  if (b.n === 0n) return mk(a.n, a.d, a.root, a.pi);
  if (a.n === 0n) return mk(sign * b.n, b.d, b.root, b.pi);
  if (a.root !== b.root || a.pi !== b.pi) return null;
  return mk(a.n * b.d + sign * b.n * a.d, a.d * b.d, a.root, a.pi);
}

export function mulEx(a: Exact, b: Exact): Value | null {
  if (a.n === 0n || b.n === 0n) return { re: 0, exact: ZERO };
  if (a.pi && b.pi) return null;
  const g = gcd(a.root, b.root);
  return mk(a.n * b.n * g, a.d * b.d, (a.root / g) * (b.root / g), a.pi || b.pi);
}

/** a ÷ b exactly (b ≠ 0), or null when the quotient has no exact form (1/π). */
export function divEx(a: Exact, b: Exact): Value | null {
  if (b.n === 0n) throw new CalcError("DIVIDE BY 0");
  if (a.n === 0n) return { re: 0, exact: ZERO };
  if (b.pi && !a.pi) return null;
  // √r1/√r2 = √(r1'·r2')/r2' with r' = r/gcd
  const g = gcd(a.root, b.root);
  const r1 = a.root / g;
  const r2 = b.root / g;
  return mk(a.n * b.d, a.d * b.n * r2, r1 * r2, a.pi && !b.pi);
}

/** a^k for an integer k (a ≠ 0 when k ≤ 0), or null when the power has no exact form or is too big. */
export function powIntEx(a: Exact, k: bigint): Value | null {
  if (k === 0n) return int(1);
  if (a.pi && k !== 1n) return null;
  const m = k < 0n ? -k : k;
  // size guard: digits of the result
  const digits = Number(m) * Math.log10(Math.max(Number(abs(a.n)), Number(a.d), Number(a.root), 2));
  if (digits > 40) return null;
  let n = a.n ** m;
  let d = a.d ** m;
  let root = 1n;
  if (a.root !== 1n) {
    n *= a.root ** (m / 2n);
    if (m % 2n === 1n) root = a.root;
  }
  if (k < 0n) {
    if (n === 0n) throw new CalcError("DIVIDE BY 0");
    // 1/(n√r/d) = d√r/(n·r)
    return mk(d, n * root, root, false);
  }
  return mk(n, d, root, a.pi);
}

/** √(n/d) for a rational ≥ 0: √(n·d)/d. Null when it cannot be factored. */
export function sqrtEx(a: Exact): Value | null {
  if (!isRational(a) || a.n < 0n) return null;
  const sp = squarePart(a.n * a.d);
  if (!sp) return null;
  return mk(sp[0], a.d, sp[1], false);
}

/** The exact k-th root (k ≥ 1) of a rational when numerator and denominator are perfect powers. */
export function rootEx(a: Exact, k: number): Value | null {
  if (!isRational(a)) return null;
  const neg = a.n < 0n;
  if (neg && k % 2 === 0) return null;
  const n = iroot(abs(a.n), k);
  const d = iroot(a.d, k);
  if (n === null || d === null) return null;
  return mk(neg ? -n : n, d);
}
