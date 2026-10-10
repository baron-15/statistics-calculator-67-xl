/**
 * What each key inserts, in MathPrint and in Classic (K §4.12–4.14, D §3).
 *
 * Tree representation choices:
 * - x² and x⁻¹ are the postfix symbols `square` and `recip`, not `pow` templates. On the device they
 *   are one character each: the cursor never enters them and delete removes them whole; they stay
 *   inline after the base (`√(3²+7²)`, GB-070c), and both modes draw them the same (K §4.14).
 * - ^ is a `pow` node with an empty exponent, placed after its base (the base is whatever precedes).
 * - 10ˣ is the symbols 1, 0 then a `pow`; eˣ is the symbol e then a `pow` (expr.ts contract).
 * - ×10ⁿ is an `ee` node; in Classic it is the four symbols `*10^`.
 * - n/d, U n/d and ˣ√ take the number before the cursor as numerator / unit / index.
 * Classic mode inserts only symbols (no 2-D templates).
 */
import { sym, type Node, type Row, type Slot, type SymId } from "../expr";
import type { Action } from "../keys";

export interface EditContext {
  mathprint: boolean;
  /** 2nd hyp is pending: sin/cos/tan and their inverses insert sinh( … tanh⁻¹( (K §4.14). */
  hyp?: boolean;
  /**
   * The previous answer as a row: its exact form, or the decimal with up to 13 significant digits
   * (K §4.4: `57/8▸n/d◂▸Un/d`, `0.7853981633975◂▸`). Inserted when a conversion or the ◂▸ toggle is
   * the first key of an entry. When absent, the `Ans` token is inserted instead.
   */
  lastAnswerRow?: Row;
}

/** An insertion at the cursor. */
export interface Insert {
  nodes: Node[];
  /** number of nodes just before the cursor that the new template takes over (n/d after a number) */
  grab?: number;
  /** a single plain symbol: in overwrite mode it replaces the symbol under the cursor */
  overwrite?: boolean;
  /** place the cursor at the start of this slot of nodes[node]; otherwise after the inserted nodes */
  into?: { node: number; slot: Slot };
}

const PLAIN: Partial<Record<Action, SymId>> = {
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  DOT: ".", NEG: "neg", ADD: "add", SUBTRACT: "sub", MULTIPLY: "mul", DIVIDE: "div",
  LPAREN: "lparen", RPAREN: "rparen", COMMA: "comma", PI: "pi", LOG: "log", LN: "ln", ANS: "ans",
  PERCENT: "percent", SQUARE: "square", RECIP: "recip", STO: "store",
  TO_PERCENT: "toPercent", FRAC_CONV: "toFracMixed", F_D: "toFD", TOGGLE: "toggle",
};

/** [normal, after 2nd hyp] */
const TRIG: Partial<Record<Action, [SymId, SymId]>> = {
  SIN: ["sin", "sinh"], COS: ["cos", "cosh"], TAN: ["tan", "tanh"],
  ASIN: ["asin", "asinh"], ACOS: ["acos", "acosh"], ATAN: ["atan", "atanh"],
};

/**
 * Pressed as the first key of an empty entry, these insert `Ans` before themselves (K §4.4): the
 * binary operators, ^, x², x⁻¹, sto▸, and also % (a postfix function) and ×10ⁿ (literally "×10 to
 * the power", K §4.13). The last two are not in TI's list. SPEC: assumption.
 */
export const ANS_FIRST_ACTIONS: ReadonlySet<Action> = new Set<Action>([
  "ADD", "SUBTRACT", "MULTIPLY", "DIVIDE", "POWER", "SQUARE", "RECIP", "STO", "PERCENT", "EE",
]);

/** Pressed first, these insert the previous answer's value instead of `Ans` (K §4.4). */
export const CONVERSION_ACTIONS: ReadonlySet<Action> = new Set<Action>(["TO_PERCENT", "FRAC_CONV", "F_D", "TOGGLE"]);

/**
 * The same rules for pasted rows (menu items): a row that starts with one of these symbols, or with a
 * `pow`, gets `Ans` first on an empty entry. The angle marks, `!`, nPr and nCr are postfix or binary
 * but not in TI's list. SPEC: assumption.
 */
export const ANS_FIRST_SYMS: ReadonlySet<SymId> = new Set<SymId>([
  "add", "sub", "mul", "div", "caret", "square", "recip", "store", "percent", "fact", "nPr", "nCr",
  "deg", "min", "sec", "radian", "grad",
]);
export const CONVERSION_SYMS: ReadonlySet<SymId> = new Set<SymId>(["toPercent", "toFracMixed", "toFD", "toggle", "toDMS"]);

/** The variable key cycles through these (K §1.3). */
export const VAR_SYMS: readonly SymId[] = ["x", "y", "z", "t", "a", "b", "c"];

const NUMBER_SYMS: ReadonlySet<SymId> = new Set<SymId>(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "."]);
const DIGIT_SYMS: ReadonlySet<SymId> = new Set<SymId>(["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"]);
/** What n/d and ˣ√ take as numerator / index: digits and the point, π (`π n/d 6`, GB-059), e, Ans, x…c. */
const OPERAND_SYMS: ReadonlySet<SymId> = new Set<SymId>([...NUMBER_SYMS, "pi", "e", "ans", ...VAR_SYMS]);

/** How many nodes immediately before `index` belong to `set`. */
function runBefore(row: Row, index: number, set: ReadonlySet<SymId>): number {
  let k = 0;
  for (let i = index - 1; i >= 0; i--) {
    const n = row[i];
    if (n?.t !== "sym" || !set.has(n.s)) break;
    k++;
  }
  return k;
}

const one = (s: SymId): Insert => ({ nodes: [sym(s)], overwrite: true });

/**
 * The insertion for a key, or null if the key inserts nothing. `row`/`index` locate the cursor
 * (needed to find the number that n/d, U n/d and ˣ√ take over).
 */
export function keyInsert(a: Action, row: Row, index: number, ctx: EditContext): Insert | null {
  const plain = PLAIN[a];
  if (plain) return one(plain);
  const trig = TRIG[a];
  if (trig) return one(ctx.hyp ? trig[1] : trig[0]);
  const mp = ctx.mathprint;
  switch (a) {
    case "POWER":
      return mp ? { nodes: [{ t: "pow", exp: [] }], into: { node: 0, slot: "exp" } } : one("caret");
    case "SQRT":
      return mp ? { nodes: [{ t: "sqrt", rad: [] }], into: { node: 0, slot: "rad" } } : one("sqrtFn");
    case "EE":
      return mp ? { nodes: [{ t: "ee", exp: [] }], into: { node: 0, slot: "exp" } } : { nodes: [sym("mul"), sym("1"), sym("0"), sym("caret")] };
    case "TEN_X":
      return mp ? { nodes: [sym("1"), sym("0"), { t: "pow", exp: [] }], into: { node: 2, slot: "exp" } } : one("tenPow");
    case "E_X":
      return mp ? { nodes: [sym("e"), { t: "pow", exp: [] }], into: { node: 1, slot: "exp" } } : one("ePow");
    case "FRAC": {
      // After a number: it becomes the numerator, cursor to the denominator. Otherwise an empty template.
      if (!mp) return one("fracbar");
      const k = runBefore(row, index, OPERAND_SYMS);
      const num = row.slice(index - k, index);
      return { nodes: [{ t: "frac", num, den: [] }], grab: k, into: { node: 0, slot: k ? "den" : "num" } };
    }
    case "MIXED": {
      // After an integer: it becomes the unit, cursor to the numerator. Otherwise an empty template
      // whose unit holds one digit (TG p.59; enforced by the editor on typing).
      if (!mp) return one("mixsep");
      const k = runBefore(row, index, DIGIT_SYMS);
      const whole = row.slice(index - k, index);
      return { nodes: [{ t: "mixed", whole, num: [], den: [] }], grab: k, into: { node: 0, slot: k ? "num" : "whole" } };
    }
    case "NTH_ROOT": {
      // The index is the number before the cursor (`3 ˣ√ 64`, GB-015), else empty with the cursor in it.
      if (!mp) return one("xroot");
      const k = runBefore(row, index, OPERAND_SYMS);
      const idx = row.slice(index - k, index);
      return { nodes: [{ t: "root", index: idx, rad: [] }], grab: k, into: { node: 0, slot: k ? "rad" : "index" } };
    }
    default:
      return null;
  }
}
