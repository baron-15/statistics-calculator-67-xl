/**
 * What the display shows, as data. The engine builds a View from state (view.ts); the renderer
 * (src/display) turns it into a 96 × 31 bitmap plus lit indicator segments.
 *
 * - The home screen is described semantically (expression rows); the renderer does MathPrint/Classic
 *   layout, history stacking, scrolling, inverse selection and the cursor.
 * - Every other screen (menus, mode, data editor, stat results, table, error, messages) is a
 *   "canvas": positioned text runs, math rows and rectangles in matrix pixels, built by the apps layer
 *   following the measured rules in docs/research/display.md §3–§7.
 */
import type { FontId } from "../display/metrics";
import type { Cursor, Row } from "./expr";

export type Indicator =
  | "2nd" | "hyp" | "fix" | "sci" | "eng" | "k"
  | "deg" | "rad" | "grad"
  | "up" | "down"
  | "busy"
  | "l1" | "l2" | "l3";

export interface HistoryLine {
  /** the entry as typed */
  entry: Row;
  /** the formatted result (fraction/radical/π templates in MathPrint, linear in Classic) */
  result: Row;
  /** the entry was re-entered by the ◂▸ toggle: draw the ◂▸ marker after it */
  toggled?: boolean;
}

export type CursorStyle = "block" | "insert" | "exit";

export interface HomeScreen {
  kind: "home";
  mathprint: boolean;
  /** oldest first; the renderer bottom-aligns and scrolls */
  history: HistoryLine[];
  /** history lines hidden above the screen top since the last clear (blank screen keeps history) */
  firstShown: number;
  entry: Row;
  /** null while browsing history */
  cursor: Cursor | null;
  cursorStyle: CursorStyle;
  /** history browsing: highlighted item (inverse video) */
  selected: { line: number; part: "entry" | "result" } | null;
}

export type DrawItem =
  | { t: "text"; x: number; y: number; font: FontId; text: string }
  /** a math row (e.g. a fraction value in Recall Var); x is the left edge, or the right edge when align = "right" */
  | { t: "math"; x: number; y: number; row: Row; align?: "left" | "right" }
  /** "fill" lights pixels, "invert" toggles them (inverse video), "clear" turns them off */
  | { t: "rect"; x: number; y: number; w: number; h: number; mode: "fill" | "invert" | "clear" };

export interface CanvasScreen {
  kind: "canvas";
  items: DrawItem[];
  /** blinking cursor box, if any (e.g. mode screen option, data-editor formula) */
  cursor?: { x: number; y: number; w: number; h: number; style: CursorStyle };
}

export type Screen = HomeScreen | CanvasScreen | { kind: "blank" };

export interface View {
  screen: Screen;
  indicators: Indicator[];
  /** 0 (lightest) … 15 (darkest) */
  contrast: number;
  /** calculator powered on */
  on: boolean;
}
