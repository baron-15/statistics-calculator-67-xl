/**
 * The expression tree shared by the editor (builds it), the math engine (parses/evaluates it, and
 * formats results back into it) and the display (lays it out in MathPrint or Classic form).
 *
 * A Row is a sequence of Nodes. MathPrint templates are 2-D nodes with child Rows ("slots").
 * Symbols are semantic ids (SymId) with a canonical on-screen text; the display maps text to glyphs.
 * See docs/SPEC.md §Expression model.
 */

/** Every insertable symbol. `text` is how it reads on the 5×7 home screen (Classic linear form). */
export const SYMS = {
  // digits and number parts
  "0": "0", "1": "1", "2": "2", "3": "3", "4": "4", "5": "5", "6": "6", "7": "7", "8": "8", "9": "9",
  ".": ".",
  /** negation (the (−) key), drawn as a raised short minus */
  neg: "⁻",
  /** scientific E used only in restricted contexts (data editor, table, recall) */
  E: "ᴇ",
  // operators
  add: "+",
  sub: "−",
  /** multiplication is drawn as "*" on the home screen */
  mul: "*",
  /** division is drawn "÷" on the home screen (fractions use the n/d template or the classic fracbar) */
  div: "÷",
  lparen: "(",
  rparen: ")",
  comma: ",",
  nPr: " nPr ",
  nCr: " nCr ",
  /** Classic power and roots */
  caret: "^",
  /** Classic fraction bar (slanted glyph) and mixed-number separator */
  fracbar: "⁄",
  mixsep: "⌴",
  // postfix
  square: "²",
  recip: "⁻¹",
  fact: "!",
  percent: "%",
  deg: "°",
  min: "′",
  sec: "″",
  radian: "ʳ",
  grad: "ᵍ",
  // constants, memory, answer
  pi: "π",
  e: "e",
  ans: "Ans",
  x: "x", y: "y", z: "z", t: "t", a: "a", b: "b", c: "c",
  store: "→",
  // functions (each includes its opening parenthesis where the device shows one)
  sin: "sin(", cos: "cos(", tan: "tan(",
  asin: "sin⁻¹(", acos: "cos⁻¹(", atan: "tan⁻¹(",
  sinh: "sinh(", cosh: "cosh(", tanh: "tanh(",
  asinh: "sinh⁻¹(", acosh: "cosh⁻¹(", atanh: "tanh⁻¹(",
  log: "log(", ln: "ln(",
  /** Classic forms of templates */
  sqrtFn: "√(", tenPow: "10^(", ePow: "e^(", xroot: "ˣ√",
  rand: "rand", randint: "randint(",
  // angle menu
  toDMS: "▸DMS",
  RPr: "R▸Pr(", RPth: "R▸Pθ(", PRx: "P▸Rx(", PRy: "P▸Ry(",
  // conversions (pasted after an expression)
  toPercent: "▸%",
  toFracMixed: "▸n/d◂▸Un/d",
  toFD: "▸F◂▸D",
  /** answer-toggle marker shown after a toggled entry */
  toggle: "◂▸",
  // lists (data-editor formulas) and stat variables (StatVars menu)
  L1: "L1", L2: "L2", L3: "L3",
  stat_n: "n", stat_xbar: "x̄", stat_Sx: "Sx", stat_sx: "σx", stat_Sumx: "Σx", stat_Sumx2: "Σx²",
  stat_ybar: "ȳ", stat_Sy: "Sy", stat_sy: "σy", stat_Sumy: "Σy", stat_Sumy2: "Σy²", stat_Sumxy: "Σxy",
  stat_a: "a", stat_b: "b", stat_r: "r", stat_r2: "r²",
  stat_minX: "minX", stat_Q1: "Q1", stat_Med: "Med", stat_Q3: "Q3", stat_maxX: "maxX",
  stat_minY: "minY", stat_maxY: "maxY",
  stat_xprime: "x′", stat_yprime: "y′",
} as const;

export type SymId = keyof typeof SYMS;

export type Slot = "num" | "den" | "whole" | "exp" | "rad" | "index";

export type Node =
  | { t: "sym"; s: SymId }
  /** stacked fraction */
  | { t: "frac"; num: Row; den: Row }
  /** mixed number: whole (big font) + stacked fraction */
  | { t: "mixed"; whole: Row; num: Row; den: Row }
  /** superscript attached to the preceding node: x², ^, 10ˣ (syms 1,0 + pow), eˣ (sym e + pow) */
  | { t: "pow"; exp: Row }
  /** square root template */
  | { t: "sqrt"; rad: Row }
  /** n-th root template: small index before the radical */
  | { t: "root"; index: Row; rad: Row }
  /** ×10ⁿ template: drawn "*10" with a superscript exponent */
  | { t: "ee"; exp: Row };

export type Row = Node[];

/** Path from the top-level row into a slot: each step is (index of the node in its row, slot). */
export interface CursorStep {
  node: number;
  slot: Slot;
}

/** A caret position: the row reached by `path`, and the gap index inside it (0 … row.length). */
export interface Cursor {
  path: CursorStep[];
  index: number;
}

export const sym = (s: SymId): Node => ({ t: "sym", s });

/** The slots a node has, in navigation order. */
export function slotsOf(n: Node): Slot[] {
  switch (n.t) {
    case "frac": return ["num", "den"];
    case "mixed": return ["whole", "num", "den"];
    case "pow": case "ee": return ["exp"];
    case "sqrt": return ["rad"];
    case "root": return ["index", "rad"];
    default: return [];
  }
}

/** The child row of a slot. */
export function slotRow(n: Node, slot: Slot): Row {
  const r = (n as Record<string, unknown>)[slot];
  if (!Array.isArray(r)) throw new Error(`node ${n.t} has no slot ${slot}`);
  return r as Row;
}

/** Resolve the row a cursor points into. */
export function rowAt(root: Row, path: CursorStep[]): Row {
  let row = root;
  for (const step of path) {
    const n = row[step.node];
    if (!n) throw new Error("bad cursor path");
    row = slotRow(n, step.slot);
  }
  return row;
}

/**
 * Linear text of a row, Classic style: used by tests, debugging and the screen-reader announcement.
 * Fractions read "(a)/(b)" only when a part has more than one node, e.g. "1/2", "(1+2)/3".
 */
export function rowText(row: Row): string {
  const group = (r: Row) => (r.length > 1 ? `(${rowText(r)})` : rowText(r));
  return row
    .map((n) => {
      switch (n.t) {
        case "sym": return SYMS[n.s];
        case "frac": return `${group(n.num)}/${group(n.den)}`;
        case "mixed": return `${rowText(n.whole)}⌴${group(n.num)}/${group(n.den)}`;
        case "pow": return `^${group(n.exp)}`;
        case "sqrt": return `√${group(n.rad)}`;
        case "root": return `${group(n.index)}ˣ√${group(n.rad)}`;
        case "ee": return `*10^${group(n.exp)}`;
      }
    })
    .join("");
}

/** Build a row from a compact list of sym ids, e.g. row("1", "add", "2"). */
export const row = (...ids: SymId[]): Row => ids.map(sym);
