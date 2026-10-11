/**
 * Physical keys of the TI-30XS MultiView and the functions they produce with/without 2nd.
 * Source: docs/research/keys-menus.md §1 (guidebook + product photo + TI-SmartView keymap).
 * KEY_ROWS is the logical reading order; the 4-way arrow pad sits right of rows 1–2.
 */

export type KeyId =
  | "2ND" | "MODE" | "DELETE" | "UP" | "DOWN" | "LEFT" | "RIGHT"
  | "LOG" | "PRB" | "DATA"
  | "LN" | "FRAC" | "EE" | "TABLE" | "CLEAR"
  | "PI" | "SIN" | "COS" | "TAN" | "DIVIDE"
  | "POWER" | "RECIP" | "LPAREN" | "RPAREN" | "MULTIPLY"
  | "SQUARE" | "7" | "8" | "9" | "SUBTRACT"
  | "VAR" | "4" | "5" | "6" | "ADD"
  | "STO" | "1" | "2" | "3" | "TOGGLE"
  | "ON" | "0" | "DOT" | "NEG" | "ENTER";

/** Green 2nd functions printed above keys. */
export type SecondFn =
  | "QUIT" | "INSERT"
  | "TEN_X" | "ANGLE" | "STAT"
  | "E_X" | "MIXED" | "FRAC_CONV" | "F_D"
  | "HYP" | "ASIN" | "ACOS" | "ATAN" | "K"
  | "NTH_ROOT" | "PERCENT" | "TO_PERCENT"
  | "SQRT" | "CONTRAST_LIGHTER"
  | "CLEAR_VAR" | "CONTRAST_DARKER"
  | "RECALL"
  | "OFF" | "RESET" | "COMMA" | "ANS"
  /** 2nd + arrow: jump to start/end of entry, or top/bottom of history/lists */
  | "HOME" | "END" | "TOP" | "BOTTOM";

export type Action = KeyId | SecondFn;

export interface KeySpec {
  id: KeyId;
  /** Legend on the key face (Unicode approximation; the skin draws the real typography) */
  label: string;
  /** Green 2nd legend above the key */
  second?: { fn: SecondFn; label: string };
  /** Key family, used by the skin for color/shape */
  kind: "second" | "function" | "digit" | "operator" | "toggle" | "enter" | "arrow";
  /** Accessible name */
  aria: string;
}

const k = (id: KeyId, label: string, kind: KeySpec["kind"], aria: string, second?: [SecondFn, string]): KeySpec => ({
  id,
  label,
  kind,
  aria,
  ...(second ? { second: { fn: second[0], label: second[1] } } : {}),
});

/** Rows top→bottom, keys left→right (arrow pad listed with rows 1–2). */
export const KEY_ROWS: KeySpec[][] = [
  [
    k("2ND", "2nd", "second", "Second function"),
    k("MODE", "mode", "function", "Mode", ["QUIT", "quit"]),
    k("DELETE", "delete", "function", "Delete", ["INSERT", "insert"]),
    k("UP", "▲", "arrow", "Up", ["TOP", ""]),
    k("LEFT", "◀", "arrow", "Left", ["HOME", ""]),
    k("RIGHT", "▶", "arrow", "Right", ["END", ""]),
    k("DOWN", "▼", "arrow", "Down", ["BOTTOM", ""]),
  ],
  [
    k("LOG", "log", "function", "Log", ["TEN_X", "10ˣ"]),
    k("PRB", "prb", "function", "Probability menu", ["ANGLE", "angle"]),
    k("DATA", "data", "function", "Data editor", ["STAT", "stat"]),
  ],
  [
    k("LN", "ln", "function", "Natural log", ["E_X", "eˣ"]),
    k("FRAC", "n/d", "function", "Fraction", ["MIXED", "U n/d"]),
    k("EE", "×10ⁿ", "function", "Times ten to the power", ["FRAC_CONV", "n/d◂▸U n/d"]),
    k("TABLE", "table", "function", "Table", ["F_D", "f◂▸d"]),
    k("CLEAR", "clear", "function", "Clear"),
  ],
  [
    k("PI", "π", "function", "Pi", ["HYP", "hyp"]),
    k("SIN", "sin", "function", "Sine", ["ASIN", "sin⁻¹"]),
    k("COS", "cos", "function", "Cosine", ["ACOS", "cos⁻¹"]),
    k("TAN", "tan", "function", "Tangent", ["ATAN", "tan⁻¹"]),
    k("DIVIDE", "÷", "operator", "Divide", ["K", "K"]),
  ],
  [
    k("POWER", "^", "function", "Power", ["NTH_ROOT", "ˣ√"]),
    k("RECIP", "x⁻¹", "function", "Reciprocal"),
    k("LPAREN", "(", "function", "Open parenthesis", ["PERCENT", "%"]),
    k("RPAREN", ")", "function", "Close parenthesis", ["TO_PERCENT", "▸%"]),
    k("MULTIPLY", "×", "operator", "Multiply"),
  ],
  [
    k("SQUARE", "x²", "function", "Square", ["SQRT", "√"]),
    k("7", "7", "digit", "7"),
    k("8", "8", "digit", "8"),
    k("9", "9", "digit", "9"),
    k("SUBTRACT", "−", "operator", "Subtract", ["CONTRAST_LIGHTER", "◂◑"]),
  ],
  [
    k("VAR", "x yzt abc", "function", "Variables x y z t a b c", ["CLEAR_VAR", "clear var"]),
    k("4", "4", "digit", "4"),
    k("5", "5", "digit", "5"),
    k("6", "6", "digit", "6"),
    k("ADD", "+", "operator", "Add", ["CONTRAST_DARKER", "◑▸"]),
  ],
  [
    k("STO", "sto▸", "function", "Store", ["RECALL", "recall"]),
    k("1", "1", "digit", "1"),
    k("2", "2", "digit", "2"),
    k("3", "3", "digit", "3"),
    k("TOGGLE", "◂▸", "toggle", "Toggle answer format"),
  ],
  [
    k("ON", "on", "function", "On", ["OFF", "off"]),
    k("0", "0", "digit", "0", ["RESET", "reset"]),
    k("DOT", ".", "digit", "Decimal point", ["COMMA", ","]),
    k("NEG", "(−)", "digit", "Negative", ["ANS", "ans"]),
    k("ENTER", "enter", "enter", "Enter"),
  ],
];

export const ALL_KEYS: KeySpec[] = KEY_ROWS.flat();
export const KEY_BY_ID: Record<KeyId, KeySpec> = Object.fromEntries(ALL_KEYS.map((s) => [s.id, s])) as Record<KeyId, KeySpec>;

/** Resolve a key press to its function given the 2nd state. */
export function resolveAction(key: KeyId, secondActive: boolean): Action {
  if (!secondActive) return key;
  return KEY_BY_ID[key].second?.fn ?? key;
}

/** Tokens accepted by keystroke scripts in tests, e.g. "2ND MODE", "1 FRAC 2 RIGHT + 1 ENTER". */
export const SCRIPT_ALIASES: Record<string, KeyId> = {
  "+": "ADD", "-": "SUBTRACT", "−": "SUBTRACT", "*": "MULTIPLY", "×": "MULTIPLY", "/": "DIVIDE", "÷": "DIVIDE",
  "(": "LPAREN", ")": "RPAREN", "^": "POWER", ".": "DOT", "(-)": "NEG", "(−)": "NEG", "n/d": "FRAC", "x²": "SQUARE",
  "x^-1": "RECIP", "x⁻¹": "RECIP", "π": "PI", "◂▸": "TOGGLE", "<>": "TOGGLE", "▲": "UP", "▼": "DOWN", "◀": "LEFT",
  "▶": "RIGHT", "sto": "STO", "x10^n": "EE", "×10ⁿ": "EE",
};
