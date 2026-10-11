/**
 * What every key and every green 2nd function does, with a guidebook-style keystroke example.
 * Shown in the key tip (hover, long-press or keyboard focus, when the "Key tips" switch is on).
 * Behavior follows docs/SPEC.md and docs/research/keys-menus.md §1–§4; the examples are the
 * guidebook's (docs/research/math-stats.md §10) and are checked against the engine in
 * tests/ui/keyTips.test.ts.
 *
 * Keystrokes are written with the key legends: `2nd √` means 2nd, then the key with the green √
 * above it; `xyzt` is the x yzt abc key. Results are shown as the screen shows them (`*` for ×,
 * `⁻` for a negative sign).
 */
import type { KeyId } from "../engine";
import type { SecondFn } from "../engine/keys";

export interface Tip {
  /** Short name, e.g. "Square root" */
  name: string;
  /** One or two sentences on what it does */
  does: string;
  /** Mini example: keystrokes → what the screen shows */
  example: string;
}

const digit = (d: number): Tip => ({
  name: `Digit ${d}`,
  does: `Types ${d} at the cursor. Typing replaces the character under the cursor unless 2nd insert is on.`,
  example: `${d} + ${d} enter → ${d + d}`,
});

export const KEY_TIPS: Record<KeyId, Tip> = {
  "2ND": {
    name: "Second function",
    does: "Makes the next key do the green function printed above it; 2nd shows on the screen until then. Press 2nd again to cancel.",
    example: "2nd √ 25 enter → 5",
  },
  MODE: {
    name: "Mode",
    does: "Opens the mode screen: DEG RAD GRAD, NORM SCI ENG, FLOAT or 0–9 fixed decimals, CLASSIC or MATHPRINT. Move with the arrows and press enter to choose.",
    example: "mode ▼ ► enter clear 12345 enter → 1.2345*10⁴",
  },
  DELETE: {
    name: "Delete",
    does: "Deletes the character under the cursor, or the one to its left at the end of the entry. In the data editor it removes the current value.",
    example: "123 ◄ ◄ delete → 13",
  },
  UP: {
    name: "Up",
    does: "Steps back through history, results and entries in turn (enter pastes the highlighted one), or moves up a menu, list or fraction. 2nd ▲ jumps to the last entry, then the oldest, or to the top of a list.",
    example: "1 + 1 enter ▲ ▲ enter + 3 enter → 1+1+3 = 5",
  },
  DOWN: {
    name: "Down",
    does: "Moves into a fraction's denominator, forward through history, or down a menu, list or table. 2nd ▼ jumps back to the entry line or to the bottom of a list.",
    example: "n/d 3 ▼ 4 ► enter → 3/4",
  },
  LEFT: {
    name: "Left",
    does: "Moves the cursor left in the entry, or to the previous menu tab or list. 2nd ◄ jumps to the start of the entry.",
    example: "12 ◄ 3 → 13 (typing overwrites)",
  },
  RIGHT: {
    name: "Right",
    does: "Moves the cursor right, and out of a fraction, exponent or root when you reach its end; also the next menu tab or list. 2nd ► jumps to the end of the entry.",
    example: "5 ^ 2 ► + 4 enter → 29",
  },
  LOG: {
    name: "Common logarithm",
    does: "Inserts log( for the base-10 logarithm. Close it with ), or let enter close it.",
    example: "log 100 ) enter → 2",
  },
  PRB: {
    name: "Probability menu",
    does: "Opens PRB (nPr, nCr, !) and, with ►, RAND (rand, randint(). Type the first number before opening it; press an item's number to pick it.",
    example: "8 prb 1 3 enter → 8 nPr 3 = 336",
  },
  DATA: {
    name: "Data editor",
    does: "Opens the 3-list editor, L1 L2 L3 (up to 42 values each): type a value, then ▼ or enter. Press data again for the CLEAR and FORMULA menus.",
    example: "data data 4 45 ▼ 55 ▼ 55 ▼ 55 enter → L1: 45 55 55 55",
  },
  LN: {
    name: "Natural logarithm",
    does: "Inserts ln( for the logarithm base e.",
    example: "ln 5 ) × 2 enter → 3.218875825",
  },
  FRAC: {
    name: "Fraction",
    does: "Inserts a stacked fraction: type the numerator, ▼, the denominator, then ► to leave it. After a number, that number becomes the numerator. Results are simplified.",
    example: "n/d 1 ▼ 2 ► + n/d 1 ▼ 3 ► enter → 5/6",
  },
  EE: {
    name: "Times ten to the power",
    does: "Inserts *10 with a raised exponent for scientific notation; ► leaves the exponent. It is an ordinary multiplication, so use ( ) when dividing.",
    example: "2 ×10ⁿ 5 enter → 200000",
  },
  TABLE: {
    name: "Function table",
    does: "Type y= a function of x (the xyzt key) and press enter, set Start, Step and Auto or Ask-x, then choose OK for a table of x and y values.",
    example: "table xyzt ( 36 − xyzt ) enter clear 15 ▼ clear 3 ▼ ▼ enter → 15 315, 18 324, 21 315",
  },
  CLEAR: {
    name: "Clear",
    does: "Erases from the cursor to the right; at the end of the entry it clears the line, and pressed again blanks the screen (▲ still reaches the history). Also dismisses errors and backs out of menus.",
    example: "21595 ◄ ◄ clear → 215",
  },
  PI: {
    name: "Pi",
    does: "Inserts π. In MathPrint the result stays an exact multiple of π; ◂▸ shows the decimal.",
    example: "2 × π enter → 2π, then ◂▸ → 6.283185307",
  },
  SIN: {
    name: "Sine",
    does: "Inserts sin( in the current angle mode (DEG unless changed). Multiples of 15° give exact values in MathPrint.",
    example: "sin 30 ) enter → 1/2",
  },
  COS: {
    name: "Cosine",
    does: "Inserts cos( in the current angle mode.",
    example: "5 × cos 60 ) enter → 5/2",
  },
  TAN: {
    name: "Tangent",
    does: "Inserts tan( in the current angle mode.",
    example: "tan 45 ) enter → 1",
  },
  DIVIDE: {
    name: "Divide",
    does: "Divides; pressed first on an empty line it starts with Ans, the last answer. Use n/d for a stacked fraction.",
    example: "225 enter ÷ 4 enter → Ans÷4 = 56.25",
  },
  POWER: {
    name: "Power",
    does: "Raises to a power, typed as a raised exponent; press ► to leave it. Pressed first, it starts with Ans.",
    example: "5 ^ 2 ► + 4 ^ ( 2 + 1 ) enter → 89",
  },
  RECIP: {
    name: "Reciprocal",
    does: "Raises the value before it to the power −1. In MathPrint the result is an exact fraction.",
    example: "2 x⁻¹ enter → 1/2",
  },
  LPAREN: {
    name: "Open parenthesis",
    does: "Starts a group, which is worked out first. A number right before ( multiplies it.",
    example: "4 ( 2 + 3 ) enter → 20",
  },
  RPAREN: {
    name: "Close parenthesis",
    does: "Closes a group, or a function such as sin( or log(. Parentheses still open at the end are closed by enter.",
    example: "( 2 + 3 ) x² enter → 25",
  },
  MULTIPLY: {
    name: "Multiply",
    does: "Multiplies, shown as * on the screen. Pressed first on an empty line it starts with Ans.",
    example: "3 × 3 enter → 9, then × 3 enter → Ans*3 = 27",
  },
  SQUARE: {
    name: "Square",
    does: "Squares the value before it. Pressed first, it squares Ans.",
    example: "3 x² + 4 x² enter → 25",
  },
  "7": digit(7),
  "8": digit(8),
  "9": digit(9),
  SUBTRACT: {
    name: "Subtract",
    does: "Subtracts; pressed first on an empty line it starts with Ans. For a negative number use (−), not −.",
    example: "7 − (−) 3 enter → 7−⁻3 = 10",
  },
  VAR: {
    name: "Variables x y z t a b c",
    does: "Inserts a variable. Press it again to cycle x→y→z→t→a→b→c. Use it after sto▸ to store, or in expressions and table functions.",
    example: "4 sto▸ xyzt xyzt enter → 4→y = 4",
  },
  "4": digit(4),
  "5": digit(5),
  "6": digit(6),
  ADD: {
    name: "Add",
    does: "Adds. Pressed first on an empty line it starts with Ans, the last answer.",
    example: "1 + 1 enter → 2, then + 3 enter → Ans+3 = 5",
  },
  STO: {
    name: "Store",
    does: "Appends → to store a value: press sto▸, then xyzt (again for y, z, …), then enter. Pressed first, it stores Ans.",
    example: "15 sto▸ xyzt enter → 15→x = 15",
  },
  "1": digit(1),
  "2": digit(2),
  "3": digit(3),
  TOGGLE: {
    name: "Answer toggle",
    does: "Switches the last answer between fraction and decimal, √ form and decimal, or π form and decimal. Each press adds a new line; no enter needed.",
    example: "2nd √ 8 enter → 2√2, then ◂▸ → 2.828427125",
  },
  ON: {
    name: "On",
    does: "Turns the calculator on to a blank Home screen. History, settings and stored values are kept from before it was turned off.",
    example: "1 + 1 enter 2nd off on ▲ → 2 (the history is kept)",
  },
  "0": digit(0),
  DOT: {
    name: "Decimal point",
    does: "Types a decimal point. A decimal anywhere in the entry makes the result a decimal.",
    example: "n/d 1.2 + 1.3 ▼ 4 enter → 0.625",
  },
  NEG: {
    name: "Negative",
    does: "Types a negative sign, shown as a raised ⁻. Use it for negative numbers; − subtracts.",
    example: "60 + 5 × (−) 12 enter → 0",
  },
  ENTER: {
    name: "Enter",
    does: "Evaluates the entry, closing any open parentheses. Also pastes a highlighted history item or picks a menu item; on an empty line it repeats the last entry.",
    example: "4 ( 2 + 3 enter → 20",
  },
};

/** The green 2nd functions with a printed legend. 2nd + arrow (HOME, END, TOP, BOTTOM) is on the arrow tips. */
export type LegendSecondFn = Exclude<SecondFn, "HOME" | "END" | "TOP" | "BOTTOM">;

export const SECOND_TIPS: Record<LegendSecondFn, Tip> = {
  QUIT: {
    name: "Quit",
    does: "Returns home, to a blank Home screen, from any menu, the mode screen, the data editor, the table or the stat screens. History is kept.",
    example: "data 2nd quit → Home screen",
  },
  INSERT: {
    name: "Insert",
    does: "Turns on insert mode (an underscore cursor) until the cursor moves: new characters go before the one under the cursor instead of replacing it.",
    example: "12 ◄ 2nd insert 3 → 132",
  },
  TEN_X: {
    name: "Ten to the power",
    does: "Inserts 10 with a raised exponent, the inverse of log.",
    example: "2nd 10ˣ log 2 ) enter → 2",
  },
  ANGLE: {
    name: "Angle menu",
    does: "Opens DMS (° ′ ″ r g ▸DMS) and, with ►, R◂▸P (polar and rectangular conversions). A degree or radian mark overrides the angle mode for that value.",
    example: "1.5 2nd angle 6 enter → 1°30'0\"",
  },
  STAT: {
    name: "Statistics",
    does: "Opens STATS: 1-Var Stats or 2-Var Stats (with linear regression) on the data editor's lists. Choose the lists, then CALC for n, x̄, Sx, σx and more.",
    example: "L1 = 45 55 55 55: 2nd stat 1 ▼ ▼ enter → n=4, x̄=52.5, Sx=5",
  },
  E_X: {
    name: "e to the power",
    does: "Inserts e with a raised exponent, the inverse of ln.",
    example: "2nd eˣ .5 enter → 1.648721271",
  },
  MIXED: {
    name: "Mixed number",
    does: "Inserts a mixed number: the whole part, then the fraction (▼ moves to the denominator). Results come back as improper fractions.",
    example: "4 2nd U n/d 5 ▼ 9 enter → 41/9",
  },
  FRAC_CONV: {
    name: "Improper ↔ mixed",
    does: "Appends ▸n/d◂▸Un/d, which shows the result as a mixed number or an improper fraction.",
    example: "9 n/d 2 ► 2nd n/d◂▸U n/d enter → 4 1/2",
  },
  F_D: {
    name: "Fraction ↔ decimal",
    does: "Appends ▸F◂▸D, which shows the result as a fraction or a decimal.",
    example: "2.25 2nd f◂▸d enter → 9/4",
  },
  HYP: {
    name: "Hyperbolic",
    does: "Makes the next sin, cos or tan (or their inverses) hyperbolic: sinh(, cosh(, tanh(. HYP shows on the screen until then.",
    example: "2nd hyp sin 5 ) + 2 enter → 76.20321058",
  },
  ASIN: {
    name: "Inverse sine",
    does: "Inserts sin⁻¹(: the angle whose sine is the value, in the current angle mode.",
    example: "2nd sin⁻¹ .5 ) enter → 30",
  },
  ACOS: {
    name: "Inverse cosine",
    does: "Inserts cos⁻¹(: the angle whose cosine is the value, in the current angle mode.",
    example: "2nd cos⁻¹ .5 ) enter → 60",
  },
  ATAN: {
    name: "Inverse tangent",
    does: "Inserts tan⁻¹(: the angle whose tangent is the value, in the current angle mode.",
    example: "2nd tan⁻¹ 1 ) enter → 45",
  },
  K: {
    name: "Constant",
    does: "Stores an operation, such as *2+3, that each enter appends to the entry. K shows on the screen while it is on; 2nd K again turns it off.",
    example: "2nd K × 2 + 3 enter 4 enter → 4*2+3 = 11",
  },
  NTH_ROOT: {
    name: "Nth root",
    does: "Takes a root whose index is the number typed before it.",
    example: "3 2nd ˣ√ 64 enter → 4",
  },
  PERCENT: {
    name: "Percent",
    does: "Appends %, which divides the value before it by 100.",
    example: "2 2nd % × 150 enter → 3",
  },
  TO_PERCENT: {
    name: "Convert to percent",
    does: "Appends ▸%, which shows the result as a percentage.",
    example: "1 n/d 5 ► 2nd ▸% enter → 20%",
  },
  SQRT: {
    name: "Square root",
    does: "Inserts a square root; type under it, then ► to leave. In MathPrint the result stays exact.",
    example: "2nd √ 8 enter → 2√2",
  },
  CONTRAST_LIGHTER: {
    name: "Lighter display",
    does: "Lightens the display contrast by one step.",
    example: "2nd ◂◑ → a lighter screen",
  },
  CLEAR_VAR: {
    name: "Clear variables",
    does: "Opens Clear Var: 1 (Yes) sets x, y, z, t, a, b and c to 0.",
    example: "2nd clear var 1 → x … c are 0",
  },
  CONTRAST_DARKER: {
    name: "Darker display",
    does: "Darkens the display contrast by one step.",
    example: "2nd ◑▸ → a darker screen",
  },
  RECALL: {
    name: "Recall",
    does: "Opens Recall Var with x … c and their values; enter pastes the value, not the name, at the cursor.",
    example: "15 sto▸ xyzt enter 2nd recall enter x² enter → 15² = 225",
  },
  OFF: {
    name: "Off",
    does: "Turns the calculator off. History, settings and stored values are kept; press on to turn it back on.",
    example: "2nd off on → a blank Home screen",
  },
  RESET: {
    name: "Reset",
    does: "Opens Reset: 1 (No) goes back; 2 (Yes) restores DEG, NORM, FLOAT and MATHPRINT and clears variables, lists, history and K.",
    example: "2nd reset 2 → MEMORY CLEARED",
  },
  COMMA: {
    name: "Comma",
    does: "Separates the two arguments of randint( and the R◂▸P conversions.",
    example: "2nd angle ► 1 3 2nd , 4 ) enter → R▸Pr(3,4) = 5",
  },
  ANS: {
    name: "Last answer",
    does: "Inserts Ans, the last result, anywhere in an entry.",
    example: "16 enter 2nd √ 2nd ans enter → √Ans = 4",
  },
};

/** Accessible names of the 2nd + arrow jumps (the arrows have no printed 2nd legend). */
export const ARROW_SECOND: Readonly<Partial<Record<KeyId, string>>> = {
  UP: "top of history or list",
  DOWN: "bottom of history or list",
  LEFT: "start of entry",
  RIGHT: "end of entry",
};
