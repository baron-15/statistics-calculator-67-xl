/**
 * Golden-test harness for the math engine: entry rows are built by driving the real editor
 * (editKey / pasteRow) with the guidebook keystrokes, then evaluated and formatted by the engine.
 * `Calc` is a minimal stand-in for the apps router: Ans, the variables, the rand seed, StatVars,
 * history re-run ([clear] [enter]) and the ◂▸ toggle on an empty entry.
 *
 * Keystroke tokens (space separated):
 * - numbers expand to digit keys ("12.5"); `×N` repeats a token ("►×2");
 * - keys: + − × ÷ ( ) ^ (−) . , π n/d Un/d x² x⁻¹ √ ˣ√ ×10ⁿ 10ˣ eˣ % ▸% ◂▸ ◄ ► ▲ ▼ sto var ans
 *   log ln sin cos tan sin⁻¹ cos⁻¹ tan⁻¹ ▸n/d◂▸Un/d ▸F◂▸D, and upper-case Action names;
 * - `hyp` makes the next trig key hyperbolic (2nd hyp);
 * - menu items are pasted as the apps layer would: ° ′ ″ ʳ ᵍ ▸DMS R▸Pr( R▸Pθ( P▸Rx( P▸Ry( nPr nCr !
 *   rand randint( x′( y′( and StatVars (x̄ n Sx σx Σx …), `rcl:x` (Recall Var pastes the value).
 */
import { editKey, emptyEditor, pasteRow, type EditContext, type EditorState } from "../../../src/engine/editor";
import { rowText, sym, type Row, type SymId } from "../../../src/engine/expr";
import type { Action } from "../../../src/engine/keys";
import {
  answerRow, evaluateEntry, makeRandom, statVarsOf, type EvalContext, type Modes, type StatResults, type Value,
} from "../../../src/engine/math";

export const DEFAULT_MODES: Modes = { angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" };

const KEY: Record<string, Action> = {
  "+": "ADD", "−": "SUBTRACT", "-": "SUBTRACT", "×": "MULTIPLY", "*": "MULTIPLY", "÷": "DIVIDE",
  "(": "LPAREN", ")": "RPAREN", "^": "POWER", "(−)": "NEG", ".": "DOT", ",": "COMMA", "π": "PI",
  "n/d": "FRAC", "Un/d": "MIXED", "x²": "SQUARE", "x⁻¹": "RECIP", "√": "SQRT", "ˣ√": "NTH_ROOT",
  "×10ⁿ": "EE", "10ˣ": "TEN_X", "eˣ": "E_X", "%": "PERCENT", "▸%": "TO_PERCENT", "◂▸": "TOGGLE",
  "◄": "LEFT", "►": "RIGHT", "▲": "UP", "▼": "DOWN", sto: "STO", var: "VAR", ans: "ANS",
  log: "LOG", ln: "LN", sin: "SIN", cos: "COS", tan: "TAN", "sin⁻¹": "ASIN", "cos⁻¹": "ACOS", "tan⁻¹": "ATAN",
  "▸n/d◂▸Un/d": "FRAC_CONV", "▸F◂▸D": "F_D",
};

/** Menu items pasted into the entry (angle, prb and StatVars menus). */
const PASTE: Record<string, SymId[]> = {
  "°": ["deg"], "′": ["min"], "″": ["sec"], "ʳ": ["radian"], "ᵍ": ["grad"], "▸DMS": ["toDMS"],
  "R▸Pr(": ["RPr"], "R▸Pθ(": ["RPth"], "P▸Rx(": ["PRx"], "P▸Ry(": ["PRy"],
  nPr: ["nPr"], nCr: ["nCr"], "!": ["fact"], rand: ["rand"], "randint(": ["randint"],
  "x′(": ["stat_xprime", "lparen"], "y′(": ["stat_yprime", "lparen"],
  n: ["stat_n"], "x̄": ["stat_xbar"], Sx: ["stat_Sx"], σx: ["stat_sx"], Σx: ["stat_Sumx"], "Σx²": ["stat_Sumx2"],
  a: ["stat_a"], b: ["stat_b"], r: ["stat_r"], L1: ["L1"], L2: ["L2"], L3: ["L3"],
};

const zero = (): Value => ({ re: 0, exact: { n: 0n, d: 1n, root: 1n, pi: false } });

export class Calc {
  modes: Modes;
  ans: Value = zero();
  vars: EvalContext["vars"] = { x: zero(), y: zero(), z: zero(), t: zero(), a: zero(), b: zero(), c: zero() };
  seed = 12345;
  statVars: EvalContext["statVars"] = {};
  lists: EvalContext["lists"] = [[], [], []];
  last: Row | null = null;

  constructor(modes: Partial<Modes> = {}) {
    this.modes = { ...DEFAULT_MODES, ...modes };
  }

  setModes(m: Partial<Modes>): this {
    this.modes = { ...this.modes, ...m };
    return this;
  }

  useStats(r: StatResults): this {
    this.statVars = statVarsOf(r);
    return this;
  }

  get mp(): boolean {
    return this.modes.display === "MATHPRINT";
  }

  editCtx(hyp = false): EditContext {
    return { mathprint: this.mp, lastAnswerRow: answerRow(this.ans, this.modes), ...(hyp ? { hyp: true } : {}) };
  }

  /** Build the entry row from keystrokes with the real editor. */
  type(seq: string): Row {
    let ed: EditorState = emptyEditor();
    let hyp = false;
    for (const tok of tokens(seq)) {
      if (tok === "hyp") {
        hyp = true;
        continue;
      }
      const rcl = /^rcl:([xyztabc])$/.exec(tok);
      if (rcl) {
        ed = pasteRow(ed, answerRow(this.vars[rcl[1] as keyof Calc["vars"]], this.modes), this.editCtx(), { ansFirst: false });
        continue;
      }
      const paste = PASTE[tok];
      if (paste) {
        ed = pasteRow(ed, paste.map(sym), this.editCtx());
        continue;
      }
      const a = KEY[tok] ?? (/^(\d|[A-Z][A-Z_]*)$/.test(tok) ? (tok as Action) : undefined);
      if (!a) throw new Error(`unknown token ${tok}`);
      const next = editKey(ed, a, this.editCtx(hyp));
      if (!next) throw new Error(`${a} is not an editing key here`);
      ed = next;
      hyp = false;
    }
    return ed.row;
  }

  /** Evaluate a row as [enter] would; updates Ans, variables and the seed. */
  run(entry: Row): { entry: string; result: string; value: Value; row: Row } {
    const rnd = makeRandom(this.seed);
    const ctx: EvalContext = {
      modes: this.modes, ans: this.ans, vars: this.vars, lists: this.lists, statVars: this.statVars, random: rnd.random,
    };
    const r = evaluateEntry(entry, ctx);
    this.seed = rnd.seed();
    this.ans = r.value;
    if (r.store === "rand") this.seed = r.value.re;
    else if (r.store) this.vars = { ...this.vars, [r.store]: r.value };
    this.last = entry;
    return { entry: rowText(entry), result: rowText(r.result), value: r.value, row: r.result };
  }

  /** Type keystrokes and press [enter]. */
  enter(seq: string) {
    return this.run(this.type(seq));
  }

  /** The result text of keystrokes + [enter]. */
  res(seq: string): string {
    return this.enter(seq).result;
  }

  /** ◂▸ pressed after a result: the editor inserts the answer + ◂▸ and the entry is evaluated at once. */
  toggle() {
    return this.run(this.type("◂▸"));
  }

  /** [clear] [enter]: re-run the last entry in the current modes. */
  rerun() {
    if (!this.last) throw new Error("no last entry");
    return this.run(this.last);
  }
}

function tokens(seq: string): string[] {
  const out: string[] = [];
  for (const tok of seq.trim().split(/\s+/).filter(Boolean)) {
    const rep = /^(.+)×(\d+)$/.exec(tok);
    if (rep && rep[1] && rep[2] && tok !== "×10ⁿ") {
      for (let i = 0; i < Number(rep[2]); i++) out.push(rep[1]);
      continue;
    }
    if (/^\d*\.?\d+$/.test(tok) || /^\d+\.$/.test(tok)) {
      for (const ch of tok) out.push(ch === "." ? "." : ch);
      continue;
    }
    out.push(tok);
  }
  return out;
}

/** One-shot: result text of keystrokes in the given modes. */
export const res = (seq: string, modes: Partial<Modes> = {}): string => new Calc(modes).res(seq);

export const MP: Partial<Modes> = { display: "MATHPRINT" };
export const CL: Partial<Modes> = { display: "CLASSIC" };
