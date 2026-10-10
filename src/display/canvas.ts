/**
 * Canvas screens (menus, MODE, wizards, data editor, table, messages): draw the items in order,
 * then the blinking cursor box.
 *
 * - text: glyph cells from (x, y), the cell's spacer column first (big/small: glyph in columns
 *   x+1…x+5 of each 6-px cell; menu: x+1…x+4 of each 5-px cell; tiny: x+1…x+3 of each 4-px cell).
 * - math: a Row laid out in MathPrint; (x, y) is the box's top-left, or x is its right edge
 *   (exclusive: x = 96 right-aligns to the screen edge) when align = "right".
 * - rect: fill, invert or clear.
 */
import type { CanvasScreen } from "../engine/screen";
import type { Bitmap } from "./bitmap";
import { drawCursor } from "./home";
import { layoutTop } from "./layout";

export function renderCanvas(bm: Bitmap, s: CanvasScreen, blinkOn: boolean): void {
  for (const it of s.items) {
    switch (it.t) {
      case "text":
        bm.text(it.font, it.text, it.x, it.y);
        break;
      case "math": {
        const box = layoutTop(it.row, true);
        box.paint(bm, it.align === "right" ? it.x - box.w : it.x, it.y);
        break;
      }
      case "rect":
        bm.rect(it, it.mode);
        break;
    }
  }
  if (s.cursor && blinkOn) drawCursor(bm, s.cursor, s.cursor.style);
}
