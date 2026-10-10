import { rowText, type Cursor, type Row } from "../../../src/engine/expr";
import { editKey, EDITOR_DEFAULTS, type EditContext, type EditorState } from "../../../src/engine/editor";
import type { Action } from "../../../src/engine/keys";

export const MP: EditContext = { mathprint: true };
export const CL: EditContext = { mathprint: false };

const ALIAS: Record<string, Action> = {
  "+": "ADD", "-": "SUBTRACT", "−": "SUBTRACT", "*": "MULTIPLY", "×": "MULTIPLY", "/": "DIVIDE", "÷": "DIVIDE",
  "(": "LPAREN", ")": "RPAREN", "^": "POWER", ".": "DOT", "(−)": "NEG", ",": "COMMA", "π": "PI",
  "n/d": "FRAC", "Un/d": "MIXED", "x²": "SQUARE", "x⁻¹": "RECIP", "√": "SQRT", "ˣ√": "NTH_ROOT",
  "×10ⁿ": "EE", "10ˣ": "TEN_X", "eˣ": "E_X", "%": "PERCENT", "▸%": "TO_PERCENT", "◂▸": "TOGGLE",
  "◄": "LEFT", "►": "RIGHT", "▲": "UP", "▼": "DOWN", "2nd◄": "HOME", "2nd►": "END",
  sto: "STO", var: "VAR", ans: "ANS", ins: "INSERT", del: "DELETE", clear: "CLEAR",
  log: "LOG", ln: "LN", sin: "SIN", cos: "COS", tan: "TAN",
};

/**
 * Keystrokes as editor actions. Numbers expand to digit keys ("4569", "1.5"), "◄×6" or "◄◄◄" repeat,
 * and upper-case tokens are taken as Action names ("SIN", "FRAC_CONV").
 */
export function actions(seq: string): Action[] {
  const out: Action[] = [];
  for (const tok of seq.trim().split(/\s+/).filter(Boolean)) {
    const rep = /^(.+)×(\d+)$/.exec(tok);
    if (rep && rep[1] && rep[2]) {
      out.push(...Array<Action>(Number(rep[2])).fill(one(rep[1])));
      continue;
    }
    if (/^[◄►▲▼]{2,}$/.test(tok)) {
      for (const ch of tok) out.push(one(ch));
      continue;
    }
    if (/^\d*\.?\d+$/.test(tok) && tok !== ".") {
      for (const ch of tok) out.push(ch === "." ? "DOT" : (ch as Action));
      continue;
    }
    out.push(one(tok));
  }
  return out;
}

function one(tok: string): Action {
  const a = ALIAS[tok];
  if (a) return a;
  if (/^[A-Z][A-Z_]*$/.test(tok) || /^\d$/.test(tok)) return tok as Action;
  throw new Error(`unknown token ${tok}`);
}

/** Apply keystrokes with editKey; every key must be an editing action. */
export function type(seq: string, ctx: EditContext = MP, from: EditorState = EDITOR_DEFAULTS): EditorState {
  return actions(seq).reduce<EditorState>((ed, a) => {
    const next = editKey(ed, a, ctx);
    if (!next) throw new Error(`${a} returned null`);
    return next;
  }, from);
}

export const text = (ed: EditorState): string => rowText(ed.row);

/** A cursor value: at(index) at the top level, or at(index, [node, slot], …) inside templates. */
export function at(index: number, ...steps: [number, Cursor["path"][number]["slot"]][]): Cursor {
  return { path: steps.map(([node, slot]) => ({ node, slot })), index };
}

/** A state holding `row` with the cursor at the end of it. */
export function withRow(row: Row, cursor?: Cursor): EditorState {
  return { row, cursor: cursor ?? { path: [], index: row.length }, insert: false, varCycle: null };
}

/** Recursively freeze a value so tests catch mutation of input states. */
export function deepFreeze<T>(v: T): T {
  if (v && typeof v === "object") {
    for (const k of Object.keys(v)) deepFreeze((v as Record<string, unknown>)[k]);
    Object.freeze(v);
  }
  return v;
}
