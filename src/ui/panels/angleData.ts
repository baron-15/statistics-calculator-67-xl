/**
 * Data for the Angles & trig block. It explains one angle, chosen in this order from the entry being
 * typed (or the newest history entry that uses an angle feature):
 *   the argument of the first sin / cos / tan · the result of an inverse trig function ·
 *   the θ of a polar↔rectangular conversion · an angle written with ° ′ ″ ʳ ᵍ · a ▸DMS conversion;
 * otherwise Ans, read as an angle in the current mode.
 * The angle is converted to DEG, RAD, GRAD and D°M′S″, and sin, cos and tan of it are evaluated, all by
 * the engine (unit modifiers, exact values at multiples of 15°), so the text matches the LCD.
 */
import type { CalcState } from "../../engine";
import { exactRow, formatResult, recognize } from "../../engine/math/format";
import type { Modes, Value } from "../../engine/math";
import type { Ast } from "../../engine/math/parse";
import { findNode, findSource, scopeOf, tryEval } from "./exprData";
import { numberText, readableRow, valueText } from "./text";

type Angle = Modes["angle"];

export interface AngleView {
  source: "entry" | "history" | "ans";
  entry: string | null;
  /** what the angle is, e.g. "the argument of sin" */
  what: string;
  mode: Angle;
  /** the angle in the current mode's unit, as the Home screen shows it */
  angle: string;
  /** the angle in degrees (for drawing) */
  degrees: number;
  units: { deg: string; rad: string; radPi: string | null; grad: string; dms: string };
  trig: { sin: string; cos: string; tan: string };
  /** a polar↔rectangular conversion: the point and its polar form */
  point: { x: number; y: number; xText: string; yText: string; rText: string; thetaText: string } | null;
}

const MARK: Record<Angle, "deg" | "radian" | "grad"> = { DEG: "deg", RAD: "radian", GRAD: "grad" };
const ANS: Ast = { k: "ans" };

const TRIG = new Set(["sin", "cos", "tan"]);
const INVERSE = new Set(["asin", "acos", "atan"]);
const RECT_TO_POLAR = new Set(["RPr", "RPth"]);
const POLAR_TO_RECT = new Set(["PRx", "PRy"]);
const NAMES: Record<string, string> = { sin: "sin", cos: "cos", tan: "tan", asin: "sin⁻¹", acos: "cos⁻¹", atan: "tan⁻¹" };

function isAngleNode(a: Ast): boolean {
  if (a.k === "call") return TRIG.has(a.fn) || INVERSE.has(a.fn) || RECT_TO_POLAR.has(a.fn) || POLAR_TO_RECT.has(a.fn);
  if (a.k === "post") return a.op === "deg" || a.op === "min" || a.op === "sec" || a.op === "radian" || a.op === "grad";
  return a.k === "dms";
}

interface Found {
  theta: Value;
  what: string;
  point: { x: Value; y: Value; r: Value; theta: Value } | null;
}

function locate(s: CalcState): { found: Found | null; source: "entry" | "history" | null; entry: string | null } {
  const src = findSource(s, "angles");
  if (!src?.parsed) return { found: null, source: src?.from ?? null, entry: src?.text ?? null };
  const scope = scopeOf(s);
  const ev = (a: Ast) => tryEval(a, scope, s.modes);
  const meta = { source: src.from, entry: src.text };
  const node = findNode(src.parsed.expr, isAngleNode);
  if (node?.k === "call") {
    const [a0, a1] = node.args;
    if (TRIG.has(node.fn) && a0) {
      const theta = ev(a0);
      return { ...meta, found: theta && { theta, what: `the argument of ${NAMES[node.fn]}`, point: null } };
    }
    if (INVERSE.has(node.fn)) {
      const theta = ev(node);
      return { ...meta, found: theta && { theta, what: `the result of ${NAMES[node.fn]}`, point: null } };
    }
    if (a0 && a1 && RECT_TO_POLAR.has(node.fn)) {
      const x = ev(a0);
      const y = ev(a1);
      const r = ev({ k: "call", fn: "RPr", args: [a0, a1] });
      const theta = ev({ k: "call", fn: "RPth", args: [a0, a1] });
      if (x && y && r && theta) return { ...meta, found: { theta, what: "θ of the point (x, y)", point: { x, y, r, theta } } };
    }
    if (a0 && a1 && POLAR_TO_RECT.has(node.fn)) {
      const r = ev(a0);
      const theta = ev(a1);
      const x = ev({ k: "call", fn: "PRx", args: [a0, a1] });
      const y = ev({ k: "call", fn: "PRy", args: [a0, a1] });
      if (x && y && r && theta) return { ...meta, found: { theta, what: "θ of the polar point (r, θ)", point: { x, y, r, theta } } };
    }
  } else if (node) {
    const theta = ev(node);
    return { ...meta, found: theta && { theta, what: "the angle you typed", point: null } };
  }
  if (src.parsed.conv === "toDMS") {
    const theta = ev(src.parsed.expr);
    return { ...meta, found: theta && { theta, what: "the angle converted with ▸DMS", point: null } };
  }
  return { ...meta, found: null };
}

/** θ (in the current mode) expressed in another unit, by the engine: `Ans` with the mode's marker. */
function inUnit(s: CalcState, theta: Value, unit: Angle): Value | null {
  if (unit === s.modes.angle) return theta;
  return tryEval({ k: "post", op: MARK[s.modes.angle], a: ANS }, scopeOf(s, { ans: theta, angle: unit }), { ...s.modes, angle: unit });
}

function trigText(s: CalcState, fn: "sin" | "cos" | "tan", theta: Value): string {
  const v = tryEval({ k: "call", fn, args: [ANS] }, scopeOf(s, { ans: theta }), s.modes);
  return v ? valueText(v, s.modes) : "undefined";
}

/** A radian measure as a multiple of π when one matches all 13 digits (π/6, 3π/4). */
function piForm(rad: Value | null): string | null {
  if (!rad) return null;
  if (rad.re === 0) return "0";
  const e = rad.exact?.pi ? rad.exact : recognize(rad.re, true)?.exact;
  if (!e || !e.pi || e.root !== 1n) return null;
  return readableRow(exactRow(e, { angle: "RAD", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" }));
}

export function angleView(s: CalcState): AngleView {
  const { found, source, entry } = locate(s);
  const theta = found?.theta ?? s.ans;
  const deg = inUnit(s, theta, "DEG");
  const rad = inUnit(s, theta, "RAD");
  const grad = inUnit(s, theta, "GRAD");
  const degrees = deg?.re ?? 0;
  const p = found?.point ?? null;
  return {
    source: found ? (source ?? "ans") : "ans",
    entry: found ? entry : null,
    what: found?.what ?? "Ans, read as an angle",
    mode: s.modes.angle,
    angle: valueText(theta, s.modes),
    degrees,
    units: {
      deg: deg ? numberText(deg.re, s.modes) : "—",
      rad: rad ? numberText(rad.re, s.modes) : "—",
      radPi: piForm(rad),
      grad: grad ? numberText(grad.re, s.modes) : "—",
      dms: deg ? readableRow(formatResult({ re: deg.re, form: "dms" }, s.modes)) : "—",
    },
    trig: { sin: trigText(s, "sin", theta), cos: trigText(s, "cos", theta), tan: trigText(s, "tan", theta) },
    point: p && {
      x: p.x.re,
      y: p.y.re,
      xText: valueText(p.x, s.modes),
      yText: valueText(p.y, s.modes),
      rText: valueText(p.r, s.modes),
      thetaText: valueText(p.theta, s.modes),
    },
  };
}
