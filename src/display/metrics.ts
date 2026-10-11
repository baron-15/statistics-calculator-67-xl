/**
 * Dot-matrix geometry (docs/research/display.md §2): 96 × 31 dots, 16 cells × 4 lines of 6 × 8.
 * Shared by the renderer (src/display) and screen builders in the engine (src/engine/apps).
 */
export const MATRIX_W = 96;
export const MATRIX_H = 31;
export const CELL_W = 6;
export const LINE_H = 8;
export const COLS = 16;
export const LINES = 4;

/** Fonts in the ROM: big 5×7 (home, menus), small 5×5 (MathPrint scripts), tiny 3×4, menu 4×5 (mode, wizards, data editor). */
export type FontId = "big" | "small" | "tiny" | "menu";

/** Advance (px) and glyph height for each font; the menu font's FIX digits use a 6-px advance. */
export const FONT_METRICS: Record<FontId, { advance: number; height: number }> = {
  big: { advance: 6, height: 7 },
  small: { advance: 6, height: 5 },
  tiny: { advance: 4, height: 4 },
  menu: { advance: 5, height: 5 },
};

/** Row pitch of the 4×5 menu font screens (MODE, wizards, data editor). */
export const MENU_LINE_H = 6;
