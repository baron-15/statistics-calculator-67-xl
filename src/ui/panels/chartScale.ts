/** Scales and ticks for the panels' small SVG charts (pure; tests/ui/chartScale.test.ts). */
import { niceStep } from "./statsData";

export interface Scale {
  (v: number): number;
  domain: [number, number];
  range: [number, number];
}

/** A linear map from [d0, d1] to [r0, r1]; a zero-width domain maps to the middle of the range. */
export function linear(domain: [number, number], range: [number, number]): Scale {
  const [d0, d1] = domain;
  const [r0, r1] = range;
  const k = d1 === d0 ? 0 : (r1 - r0) / (d1 - d0);
  const f = ((v: number) => (k === 0 ? (r0 + r1) / 2 : r0 + (v - d0) * k)) as Scale;
  f.domain = domain;
  f.range = range;
  return f;
}

/** Round tick values covering [lo, hi], about `count` of them, on a 1-2-5 step. */
export function niceTicks(lo: number, hi: number, count = 5): number[] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [];
  if (lo === hi) return [lo];
  if (lo > hi) [lo, hi] = [hi, lo];
  const step = niceStep((hi - lo) / Math.max(1, count));
  const first = Math.ceil(lo / step - 1e-9) * step;
  const out: number[] = [];
  for (let v = first; v <= hi + step * 1e-9 && out.length < 50; v += step) out.push(cleanZero(round(v, step)));
  return out;
}

/** The domain widened to whole ticks, so the axis starts and ends on a labelled value. */
export function niceDomain(lo: number, hi: number, count = 5): [number, number] {
  if (!Number.isFinite(lo) || !Number.isFinite(hi)) return [0, 1];
  if (lo === hi) return lo === 0 ? [-1, 1] : [lo - Math.abs(lo) * 0.1, hi + Math.abs(hi) * 0.1];
  const step = niceStep((hi - lo) / Math.max(1, count));
  return [cleanZero(round(Math.floor(lo / step + 1e-9) * step, step)), cleanZero(round(Math.ceil(hi / step - 1e-9) * step, step))];
}

/** Snap floating-point noise (0.30000000000000004) to the step's precision. */
function round(v: number, step: number): number {
  const decimals = Math.max(0, -Math.floor(Math.log10(step)) + 1);
  return Number(v.toFixed(Math.min(20, decimals)));
}

const cleanZero = (v: number): number => (Object.is(v, -0) ? 0 : v);

/** A tick label: short, with a true minus sign and k/M for large round values. */
export function tickLabel(v: number): string {
  const a = Math.abs(v);
  let text: string;
  if (a !== 0 && (a >= 1e6 || a < 1e-3)) text = v.toExponential(1).replace("e+", "e").replace(/\.0e/, "e");
  else if (a >= 1e4 && v % 1000 === 0) text = `${v / 1000}k`;
  else text = String(Number(v.toPrecision(6)));
  return text.replace(/^-/, "−");
}
