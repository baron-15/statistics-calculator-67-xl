/**
 * Helpers for the apps-layer tests: keystroke runs, canvas inspection, seeded states, and probes
 * that tell whether the real math engine (Agent B) is implemented yet.
 */
import { initialState, rowText, runScript, view, type CalcState } from "../../../src/engine";
import type { Row } from "../../../src/engine/expr";
import { row, sym } from "../../../src/engine/expr";
import { evaluate, oneVarStats, type Value } from "../../../src/engine/math";
import type { CanvasScreen, DrawItem } from "../../../src/engine/screen";
import type { HistoryRecord } from "../../../src/engine/apps";

export { initialState, runScript };

/** Run a keystroke script ("1 + 1 ENTER", "2ND QUIT"); `×N` repeats the previous token. */
export function run(script: string, from: CalcState = initialState()): CalcState {
  const expanded = script
    .trim()
    .split(/\s+/)
    .flatMap((tok) => {
      const m = /^(.+)×(\d+)$/.exec(tok);
      return m && m[1] && m[2] ? Array<string>(Number(m[2])).fill(m[1]) : [tok];
    })
    .join(" ");
  return expanded ? runScript(expanded, from) : from;
}

const notImplemented = (e: unknown) => String(e).includes("not implemented");

const ZERO: Value = { re: 0, exact: { n: 0n, d: 1n, root: 1n, pi: false } };

/** True once the real `evaluate` is no longer the Phase 0 stub. */
export const mathReady: boolean = (() => {
  try {
    evaluate(row("1"), {
      modes: { angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" },
      ans: ZERO,
      vars: { x: ZERO, y: ZERO, z: ZERO, t: ZERO, a: ZERO, b: ZERO, c: ZERO },
      lists: [[], [], []],
      statVars: {},
      random: () => 0.5,
    });
    return true;
  } catch (e) {
    return !notImplemented(e);
  }
})();

/** True once the real `oneVarStats` is no longer the stub. */
export const statsReady: boolean = (() => {
  try {
    oneVarStats([1, 2, 3], null);
    return true;
  } catch (e) {
    return !notImplemented(e);
  }
})();

export function canvas(s: CalcState): CanvasScreen {
  const v = view(s);
  if (v.screen.kind !== "canvas") throw new Error(`not a canvas screen (${v.screen.kind}, app ${s.app.kind})`);
  return v.screen;
}

export type TextItem = Extract<DrawItem, { t: "text" }>;
export type RectItem = Extract<DrawItem, { t: "rect" }>;

export const texts = (s: CalcState): TextItem[] => canvas(s).items.filter((i): i is TextItem => i.t === "text");
export const rects = (s: CalcState, mode?: RectItem["mode"]): RectItem[] =>
  canvas(s).items.filter((i): i is RectItem => i.t === "rect" && (!mode || i.mode === mode));
export const inverts = (s: CalcState) => rects(s, "invert").map(({ x, y, w, h }) => ({ x, y, w, h }));

/** Text items as "x,y:text" strings, for compact assertions. */
export const textAt = (s: CalcState): string[] => texts(s).map((t) => `${t.x},${t.y}:${t.text}`);

export const indicators = (s: CalcState) => view(s).indicators;

export const entryText = (s: CalcState): string => rowText(s.editor.row);

/** A history record from rows (the value is irrelevant for browsing tests). */
export function rec(entry: Row, result: Row, re = 0): HistoryRecord {
  return { entry, result, value: { re } };
}

/** A state whose history is `pairs` (entry text tokens → result tokens), as if each had been entered. */
export function withHistory(pairs: [Row, Row][], from: CalcState = initialState()): CalcState {
  return { ...from, history: pairs.map(([e, r]) => rec(e, r)) };
}

/** The GB p.6 history: 1+1 = 2, 2+2 = 4, 3+3 = 6, 4+4 = 8. */
export function gbHistory(): CalcState {
  const sum = (d: string, r: string) => [row(d as never, "add", d as never), row(r as never)] as [Row, Row];
  return withHistory([sum("1", "2"), sum("2", "4"), sum("3", "6"), sum("4", "8")]);
}

export { row, sym };
