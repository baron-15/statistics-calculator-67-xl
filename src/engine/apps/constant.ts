/**
 * 2nd K, the constant editor (K §3.12; GB p.35–36; screens MT_ConK01 … MT_Conk12).
 *
 * The editor shows `K=` and the operation tail on line 1 of an otherwise blank screen. enter saves
 * it and turns constant mode on (K indicator); the saved `K=…` line stays on screen until the next
 * key. From then on every enter appends K to the entry (home.ts).
 *
 * Decisions (SPEC: assumption): enter on an empty K= turns the constant off and forgets it; clear on
 * an empty K= leaves without changing anything. The editor does not insert Ans before a first
 * operator here (K=*2+3, K=²). The definition is limited to 44 cells (GB p.35).
 */
import { cellCount, clearAction, cursorStyle, editKey, type EditorState } from "../editor";
import type { Row } from "../expr";
import type { Action } from "../keys";
import type { CanvasScreen } from "../screen";
import type { CalcState } from "../state";
import { bigText, cursorBox, math, rowAscent } from "./canvas";
import { editContext, homeApp, openApp } from "./nav";
import { stripLeadingAns } from "./util";

export const MAX_CONSTANT = 44;

export function constantKey(s: CalcState, a: Action, hyp: boolean): CalcState {
  const app = s.app;
  if (app.kind !== "constant") return s;
  const ed = app.editor;
  switch (a) {
    case "ENTER": {
      const constant = ed.row.length ? { row: ed.row, on: true } : null;
      return { ...s, apps: { ...s.apps, constant }, app: constant ? homeApp({ kBanner: true }) : homeApp(), firstShown: s.history.length };
    }
    case "CLEAR":
      if (clearAction(ed) === "was-empty") return { ...s, app: homeApp() };
      break;
    case "PRB": case "ANGLE": case "RECALL":
      return openApp(s, a, app) ?? s;
    default:
      break;
  }
  const next = editKey(ed, a, editContext(s, app, ed, hyp));
  if (!next) return s;
  const tail = stripLeadingAns(ed, next, a);
  if (cellCount(tail.row) > MAX_CONSTANT && cellCount(tail.row) > cellCount(ed.row)) return s;
  return { ...s, app: { kind: "constant", editor: tail } };
}

/**
 * `K=` and the constant as a canvas line: the K= text sits on the row's base glyphs, which a
 * superscript pushes 2 rows down (MT_Conk05 `K=²`).
 */
export function constantScreen(s: CalcState, row: Row, ed: EditorState | null): CanvasScreen {
  const asc = s.modes.display === "MATHPRINT" ? rowAscent(row) : 0;
  return {
    kind: "canvas",
    items: [bigText(0, asc, "K="), math(12, 0, row)],
    ...(ed ? { cursor: cursorBox(row, ed.cursor, 12, 0, cursorStyle(ed)) } : {}),
  };
}
