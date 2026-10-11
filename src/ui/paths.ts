/**
 * Outline helpers: the measured point lists in geometry.ts become smooth SVG paths here.
 * The spline is the one the measurements were verified with (a centripetal Catmull–Rom through the
 * traced points; centripetal parametrisation avoids overshoot and cusps where points bunch up).
 */
import { AXIS_X, type Pt } from "./geometry";

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A symmetric closed outline from its left half (top centre → left side → bottom centre). */
export function mirrorHalf(half: readonly Pt[], axis = AXIS_X): Pt[] {
  const right = half
    .slice(1, -1)
    .reverse()
    .map(([x, y]) => [2 * axis - x, y] as Pt);
  return [...half, ...right];
}

/** Closed (or open) centripetal Catmull–Rom spline through `pts`, as an SVG path of cubic Béziers. */
export function smoothPath(pts: readonly Pt[], closed = true): string {
  const n = pts.length;
  if (n < 2) return "";
  const at = (i: number): Pt => {
    if (closed) return pts[((i % n) + n) % n]!;
    return pts[Math.max(0, Math.min(n - 1, i))]!;
  };
  let d = `M${r1(pts[0]![0])},${r1(pts[0]![1])}`;
  const segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const p0 = at(i - 1);
    const p1 = at(i);
    const p2 = at(i + 1);
    const p3 = at(i + 2);
    const d1 = Math.max(Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), 1e-6) ** 0.5;
    const d2 = Math.max(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]), 1e-6) ** 0.5;
    const d3 = Math.max(Math.hypot(p3[0] - p2[0], p3[1] - p2[1]), 1e-6) ** 0.5;
    const b1x = (d1 * d1 * p2[0] - d2 * d2 * p0[0] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[0]) / (3 * d1 * (d1 + d2));
    const b1y = (d1 * d1 * p2[1] - d2 * d2 * p0[1] + (2 * d1 * d1 + 3 * d1 * d2 + d2 * d2) * p1[1]) / (3 * d1 * (d1 + d2));
    const b2x = (d3 * d3 * p1[0] - d2 * d2 * p3[0] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[0]) / (3 * d3 * (d3 + d2));
    const b2y = (d3 * d3 * p1[1] - d2 * d2 * p3[1] + (2 * d3 * d3 + 3 * d3 * d2 + d2 * d2) * p2[1]) / (3 * d3 * (d3 + d2));
    d += `C${r1(b1x)},${r1(b1y)} ${r1(b2x)},${r1(b2y)} ${r1(p2[0])},${r1(p2[1])}`;
  }
  return closed ? `${d}Z` : d;
}

/** Points as a straight-edged polygon path (triangles, hit zones). */
export function polygonPath(pts: readonly Pt[]): string {
  return `M${pts.map(([x, y]) => `${r1(x)},${r1(y)}`).join("L")}Z`;
}

/** Axis-aligned bounds of a point list. */
export function bounds(pts: readonly Pt[]): { x0: number; y0: number; x1: number; y1: number } {
  let x0 = Infinity;
  let y0 = Infinity;
  let x1 = -Infinity;
  let y1 = -Infinity;
  for (const [x, y] of pts) {
    x0 = Math.min(x0, x);
    y0 = Math.min(y0, y);
    x1 = Math.max(x1, x);
    y1 = Math.max(y1, y);
  }
  return { x0, y0, x1, y1 };
}

/** Grow a convex-ish outline about a centre point by `dx` / `dy` units (used for bevel rings). */
export function grow(pts: readonly Pt[], dx: number, dyTop: number, dyBottom = dyTop): Pt[] {
  const b = bounds(pts);
  const cx = (b.x0 + b.x1) / 2;
  const cy = (b.y0 + b.y1) / 2;
  const hw = (b.x1 - b.x0) / 2;
  const hh = (b.y1 - b.y0) / 2;
  return pts.map(([x, y]) => {
    const fx = (x - cx) / hw;
    const fy = (y - cy) / hh;
    return [x + fx * dx, y + (fy < 0 ? fy * dyTop : fy * dyBottom)] as Pt;
  });
}
