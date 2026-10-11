/**
 * The LCD contents over the glass (the glass itself is part of the case art):
 * - the 96 × 31 dot matrix of the renderer's Frame, drawn on a canvas at devicePixelRatio as
 *   round-cornered square dots (82 % of the pitch, blue-slate ink with a faint down-right shadow,
 *   as on the real unit); unlit dots are not drawn;
 * - the fixed indicator segments above it (lcdIndicators.ts), lit or ghosting faintly;
 * - a visually hidden live region with the screen as text.
 * Contrast 0–15 sets how dark the dots and segments are. Off: blank glass.
 */
import { memo, useEffect, useRef } from "react";
import type { Indicator } from "../engine";
import type { Frame } from "../display/render";
import { MATRIX_H, MATRIX_W } from "../display/metrics";
import { GLASS_BOX, INDICATOR_BAND, MATRIX, MATRIX_H_U, MATRIX_W_U, pctX, pctY } from "./geometry";
import { SEGMENTS, segmentLit, type Segment } from "./lcdIndicators";

/** Lit-dot ink on the real unit (Commons TI30XSMV.jpg): blue-slate #4B5272. */
const INK = [0x4b, 0x52, 0x72] as const;
/** Darkest ink at contrast 15. */
const INK_DARK = [0x23, 0x27, 0x3c] as const;
/** Fraction of the dot pitch a dot fills (photo: 80–85 %; 0.86 reads closest at screen sizes). */
export const DOT_FILL = 0.86;

/**
 * Ink colour and opacity for a contrast level. Level 8 (the default) is the photo's ink at full strength;
 * lower levels fade towards the glass, higher ones darken. The 16 levels come from the ROM analysis
 * (display.md §0); the exact response curve is [unverified].
 */
export function inkFor(contrast: number): { rgb: readonly [number, number, number]; alpha: number } {
  const c = Math.max(0, Math.min(15, Math.round(contrast)));
  if (c <= 8) return { rgb: INK, alpha: 0.12 + 0.88 * (c / 8) ** 1.25 };
  const t = (c - 8) / 7;
  const rgb = INK.map((v, i) => Math.round(v + (INK_DARK[i]! - v) * t)) as unknown as readonly [number, number, number];
  return { rgb, alpha: 1 };
}

const rgba = ([r, g, b]: readonly number[], a: number) => `rgba(${r},${g},${b},${a.toFixed(3)})`;

function drawDots(canvas: HTMLCanvasElement, frame: Frame) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!frame.on) return;
  const px = W / MATRIX_W;
  const py = H / MATRIX_H;
  const size = DOT_FILL * Math.min(px, py);
  const r = size * 0.16;
  const ix = (px - size) / 2;
  const iy = (py - size) / 2;
  const path = new Path2D();
  const rounded = typeof path.roundRect === "function";
  for (let y = 0; y < MATRIX_H; y++) {
    for (let x = 0; x < MATRIX_W; x++) {
      if (!frame.pixels[y * MATRIX_W + x]) continue;
      const dx = x * px + ix;
      const dy = y * py + iy;
      if (rounded) path.roundRect(dx, dy, size, size, r);
      else path.rect(dx, dy, size, size);
    }
  }
  const { rgb, alpha } = inkFor(frame.contrast);
  // The segments cast a faint shadow on the reflector behind the liquid crystal (down-right).
  ctx.shadowColor = `rgba(40,46,24,${(0.28 * alpha).toFixed(3)})`;
  ctx.shadowOffsetX = size * 0.1;
  ctx.shadowOffsetY = size * 0.13;
  ctx.shadowBlur = size * 0.12;
  ctx.fillStyle = rgba(rgb, alpha);
  ctx.fill(path);
}

/** Indicator SVG coordinates: x in matrix columns, y in pitches (0 = matrix top, negative = above). */
const P = MATRIX.pitch;
const BAND_TOP = (GLASS_BOX.y - MATRIX.y) / P;
const BASE = -INDICATOR_BAND.baseline / P;
const CAP = INDICATOR_BAND.cap / P;

function segmentArt(seg: Segment) {
  const w = seg.x1 - seg.x0;
  switch (seg.shape) {
    case "text":
      return (
        <text x={seg.x0} y={BASE} textLength={w} lengthAdjust="spacingAndGlyphs" fontSize={CAP / 0.66}>
          {seg.text}
        </text>
      );
    case "box": {
      // a small boxed label (the data editor's list markers)
      const top = BASE - CAP - 0.35;
      return (
        <g>
          <rect x={seg.x0} y={top} width={w + 0.5} height={CAP + 0.7} fill="none" strokeWidth={0.32} />
          <text x={seg.x0 + (w + 0.5) / 2} y={BASE - 0.1} textAnchor="middle" fontSize={(CAP * 0.78) / 0.66} fontStyle="normal">
            {seg.text}
          </text>
        </g>
      );
    }
    case "up":
    case "down": {
      // thin stroked arrows; ↓ sits half a pitch lower than ↑ (SmartView art)
      const cx = (seg.x0 + seg.x1) / 2;
      const top = BASE - CAP + (seg.shape === "down" ? 0.5 : 0);
      const bot = BASE + (seg.shape === "down" ? 0.5 : 0);
      const head = seg.shape === "up" ? `M${cx - 1},${top + 1}L${cx},${top}L${cx + 1},${top + 1}` : `M${cx - 1},${bot - 1}L${cx},${bot}L${cx + 1},${bot - 1}`;
      return (
        <g fill="none" strokeWidth={0.36} strokeLinecap="round" strokeLinejoin="round">
          <path d={`M${cx},${top}V${bot}`} />
          <path d={head} />
        </g>
      );
    }
    case "busy": {
      const top = BASE - CAP;
      return <path d={`M${seg.x0},${top}H${seg.x1}L${seg.x0},${BASE}H${seg.x1}Z`} strokeWidth={0.3} />;
    }
  }
}

export interface LcdProps {
  frame: Frame;
  /** the screen as text, for the live region */
  text: string;
}

export const Lcd = memo(function Lcd({ frame, text }: LcdProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(frame);
  frameRef.current = frame;

  // Keep the backing store at device pixels.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      drawDots(canvas, frameRef.current);
    };
    resize();
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
    ro?.observe(canvas);
    window.addEventListener("resize", resize);
    return () => {
      ro?.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  useEffect(() => {
    if (canvasRef.current) drawDots(canvasRef.current, frame);
  }, [frame]);

  const lit = new Set<Indicator>(frame.on ? frame.indicators : []);
  const { rgb, alpha } = inkFor(frame.contrast);
  const ink = rgba(rgb, alpha);
  const g = GLASS_BOX;
  const rel = (x: number, y: number, w: number, h: number) => ({
    left: `${((x - g.x) / g.w) * 100}%`,
    top: `${((y - g.y) / g.h) * 100}%`,
    width: `${(w / g.w) * 100}%`,
    height: `${(h / g.h) * 100}%`,
  });

  return (
    <div
      className={`dv-lcd${frame.on ? " is-on" : " is-off"}`}
      data-testid="lcd"
      style={{ left: pctX(g.x), top: pctY(g.y), width: pctX(g.w), height: pctY(g.h) }}
    >
      <svg
        className="dv-ind"
        style={rel(MATRIX.x, g.y, MATRIX_W_U, MATRIX.y - g.y)}
        viewBox={`0 ${BAND_TOP} ${MATRIX.cols} ${-BAND_TOP}`}
        preserveAspectRatio="none"
        aria-hidden="true"
        focusable="false"
      >
        {SEGMENTS.map((seg) => {
          const on = segmentLit(seg, lit);
          return (
            <g
              key={seg.id}
              className={`dv-seg${on ? " is-lit" : ""}`}
              data-indicator={seg.id}
              data-on={on ? "true" : "false"}
              fill={on ? ink : "currentColor"}
              stroke={on ? ink : "currentColor"}
            >
              {segmentArt(seg)}
            </g>
          );
        })}
      </svg>
      <canvas ref={canvasRef} className="dv-matrix" style={rel(MATRIX.x, MATRIX.y, MATRIX_W_U, MATRIX_H_U)} aria-hidden="true" />
      <div role="status" aria-live="polite" aria-atomic="true" className="sr-only" data-testid="lcd-text">
        {text}
      </div>
    </div>
  );
});
