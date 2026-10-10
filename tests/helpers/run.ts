import { initialState, rowText, runScript, view, type CalcState } from "../../src/engine";

export { initialState, runScript };

/** Home screen as text lines: each history item "entry = result", then the current entry. */
export function homeText(s: CalcState): string[] {
  const v = view(s);
  if (v.screen.kind !== "home") throw new Error(`not on the home screen (${v.screen.kind})`);
  return [...v.screen.history.map((h) => `${rowText(h.entry)}${h.toggled ? "◂▸" : ""} = ${rowText(h.result)}`), rowText(v.screen.entry)];
}

/** The last result's text, e.g. result("1 n/d 2 RIGHT + 1 n/d 3 ENTER") === "5/6". */
export function result(script: string, from?: CalcState): string {
  const s = runScript(script, from);
  const last = s.history.at(-1);
  if (!last) throw new Error("no result");
  return rowText(last.result);
}
