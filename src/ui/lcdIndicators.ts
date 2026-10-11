/**
 * The fixed indicator segments above the dot matrix (docs/research/display.md §2.2; keys-menus.md §5).
 * x positions are matrix columns, measured from the TI-SmartView captures ((x − 16) / 2) and checked
 * on the real-unit photo (DEG ≈ 73–78, ↑ ≈ 89, ↓ ≈ 92) and on TI's render (DEG 73.0–79.1, ↑↓ 88.1–93.4).
 */
import type { Indicator } from "../engine";

export type SegmentShape = "text" | "box" | "up" | "down" | "busy";

export interface Segment {
  /** stable id (data-indicator) */
  id: string;
  /** which indicators light this segment */
  lit: readonly Indicator[];
  shape: SegmentShape;
  text?: string;
  /** matrix columns (left edge of x0 … right edge of x1) */
  x0: number;
  x1: number;
}

/**
 * GRAD has no capture. The real glass has 39 status fragments, and DEG's "G" ends one column
 * before RAD starts, so we light DEG's "G" together with RAD for GRAD.
 * SPEC: assumption (unverified): GRAD = G + RAD; 2nd and HYP in the free span between L1 and FIX;
 * the busy hourglass in the free span between ENG and L3.
 */
export const SEGMENTS: readonly Segment[] = [
  { id: "l1", lit: ["l1"], shape: "box", text: "L1", x0: 0, x1: 2.5 },
  { id: "2nd", lit: ["2nd"], shape: "text", text: "2nd", x0: 4.5, x1: 9.5 },
  { id: "hyp", lit: ["hyp"], shape: "text", text: "HYP", x0: 11, x1: 16.5 },
  { id: "fix", lit: ["fix"], shape: "text", text: "FIX", x0: 19.5, x1: 23.5 },
  { id: "k", lit: ["k"], shape: "text", text: "K", x0: 25, x1: 26.5 },
  { id: "l2", lit: ["l2"], shape: "box", text: "L2", x0: 33.5, x1: 36.5 },
  { id: "sci", lit: ["sci"], shape: "text", text: "SCI", x0: 38, x1: 42 },
  { id: "eng", lit: ["eng"], shape: "text", text: "ENG", x0: 48, x1: 54 },
  { id: "busy", lit: ["busy"], shape: "busy", x0: 60, x1: 62.5 },
  { id: "l3", lit: ["l3"], shape: "box", text: "L3", x0: 68.5, x1: 71.5 },
  { id: "deg-de", lit: ["deg"], shape: "text", text: "DE", x0: 73, x1: 76.6 },
  { id: "deg-g", lit: ["deg", "grad"], shape: "text", text: "G", x0: 76.8, x1: 78.5 },
  { id: "rad", lit: ["rad", "grad"], shape: "text", text: "RAD", x0: 79.5, x1: 84.5 },
  { id: "up", lit: ["up"], shape: "up", x0: 88, x1: 90.5 },
  { id: "down", lit: ["down"], shape: "down", x0: 91, x1: 93.5 },
];

export function segmentLit(seg: Segment, lit: ReadonlySet<Indicator>): boolean {
  return seg.lit.some((i) => lit.has(i));
}
