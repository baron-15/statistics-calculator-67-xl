/** Cursors and layout details of the canvas screens that the captures do not show. */
import { describe, expect, it } from "vitest";
import { messageScreen } from "../../../src/engine/apps";
import { decimalRow, formatPlain, linearText, rationalRow } from "../../../src/engine/apps/format";
import { rowText } from "../../../src/engine/expr";
import type { CalcState } from "../../../src/engine";
import type { Value } from "../../../src/engine/math";
import { canvas, indicators, initialState, inverts, row, run, sym, textAt } from "./helpers";

const int = (n: number): Value => ({ re: n, exact: { n: BigInt(n), d: 1n, root: 1n, pi: false } });
const cur = (s: CalcState) => canvas(s).cursor;
const MODES = initialState().modes;

describe("message screens", () => {
  it("centre each line on the 16 cells from line 2", () => {
    expect(messageScreen("MEMORY CLEARED").items).toEqual([{ t: "text", x: 6, y: 8, font: "big", text: "MEMORY CLEARED" }]);
    expect(messageScreen("DIVIDE BY 0").items[0]).toMatchObject({ x: 12, y: 8 });
    expect(messageScreen("INVALID FUNCTION").items[0]).toMatchObject({ x: 0, y: 8 });
  });
});

describe("the K= editor (MT_ConK01)", () => {
  it("K= then the tail; the block cursor follows it", () => {
    expect(cur(run("K"))).toEqual({ x: 13, y: 0, w: 5, h: 7, style: "block" });
    expect(cur(run("K * 2"))).toEqual({ x: 25, y: 0, w: 5, h: 7, style: "block" });
  });

  it("no Ans before a first operator, and 44 cells at most (GB p.35)", () => {
    const s = run("K SQUARE");
    expect(s.app.kind === "constant" && rowText(s.app.editor.row)).toBe("²");
    const long = run(`K + ${"1 ".repeat(60)}`);
    expect(long.app.kind === "constant" && long.app.editor.row.length).toBe(44);
  });

  it("prb and recall paste into it", () => {
    const s = run("K PRB 3");
    expect(s.app.kind === "constant" && rowText(s.app.editor.row)).toBe("!");
  });

  it("clear on an empty K= leaves; enter on an empty K= turns the constant off", () => {
    expect(run("K CLEAR").app.kind).toBe("home");
    expect(run("K * 2 ENTER K K CLEAR ENTER").apps.constant).toBeNull();
  });

  it("a superscript lowers K= and the cursor below it", () => {
    const s = run("K ^ 2");
    expect(textAt(s)).toEqual(["0,2:K="]);
    const c = cur(s);
    expect(c && c.y).toBe(0);
    expect(c && c.h).toBe(5);
  });
});

describe("y= function entry", () => {
  it("y= then the function in MathPrint; the cursor follows", () => {
    const s = run("TABLE VAR");
    expect(textAt(s)).toEqual(["0,0:y="]);
    expect(canvas(s).items[1]).toEqual({ t: "math", x: 12, y: 0, row: [sym("x")] });
    expect(cur(s)).toEqual({ x: 19, y: 0, w: 5, h: 7, style: "block" });
  });

  it("a fraction puts the cursor in its denominator, below the axis", () => {
    const c = cur(run("TABLE VAR FRAC 2"));
    expect(c && c.y).toBeGreaterThan(3);
    expect(c && c.h).toBe(5);
  });
});

describe("table setup (MT_functable02)", () => {
  it("the cursor overwrites from Start's first character, then Step's", () => {
    expect(cur(run("TABLE ENTER"))).toEqual({ x: 37, y: 0, w: 5, h: 7, style: "block" });
    expect(cur(run("TABLE ENTER DOWN"))).toEqual({ x: 31, y: 8, w: 5, h: 7, style: "block" });
    expect(textAt(run("TABLE ENTER 15"))[0]).toBe("0,0:Start=15");
  });

  it("Auto / Ask-x and OK have cursor boxes", () => {
    expect(cur(run("TABLE ENTER DOWN DOWN"))).toEqual({ x: 0, y: 16, w: 24, h: 8, style: "block" });
    expect(cur(run("TABLE ENTER DOWN DOWN RIGHT"))).toEqual({ x: 36, y: 16, w: 30, h: 8, style: "block" });
    expect(cur(run("TABLE ENTER DOWN×3"))).toEqual({ x: 84, y: 24, w: 12, h: 8, style: "block" });
    expect(inverts(run("TABLE ENTER DOWN DOWN RIGHT"))).toEqual([{ x: 0, y: 16, w: 24, h: 8 }]);
    expect(inverts(run("TABLE ENTER DOWN DOWN RIGHT ENTER"))).toEqual([{ x: 36, y: 16, w: 30, h: 8 }]);
  });

  it("the table view's selected row moves with ▼", () => {
    expect(inverts(run("TABLE VAR ENTER DOWN×3 ENTER DOWN"))).toEqual([{ x: 0, y: 12, w: 35, h: 6 }]);
  });
});

describe("stat wizards", () => {
  it("the cursor box follows the rows and lands on each row's choice", () => {
    expect(cur(run("STAT 1"))).toEqual({ x: 30, y: 6, w: 11, h: 6, style: "block" });
    expect(cur(run("STAT 1 DOWN"))).toEqual({ x: 25, y: 12, w: 16, h: 6, style: "block" });
    expect(cur(run("STAT 1 DOWN DOWN"))).toEqual({ x: 70, y: 24, w: 21, h: 6, style: "block" });
    expect(cur(run("STAT 2 DOWN"))).toEqual({ x: 50, y: 12, w: 11, h: 6, style: "block" });
  });

  it("enter chooses and moves down; choices are remembered", () => {
    const s = run("STAT 2 RIGHT RIGHT ENTER");
    expect(s.apps.statSetup.x).toBe(2);
    expect(s.app).toMatchObject({ row: 1, col: 1 });
    expect(run("CLEAR STAT 2", s).apps.statSetup.x).toBe(2);
    expect(cur(run("CLEAR STAT 2", s))).toEqual({ x: 65, y: 6, w: 11, h: 6, style: "block" });
  });

  it("clear returns Home", () => {
    expect(run("STAT 1 CLEAR").app.kind).toBe("home");
  });
});

describe("data editor details", () => {
  const seeded = (n: number): CalcState => ({ ...initialState(), apps: { ...initialState().apps, lists: [Array.from({ length: n }, (_, i) => int(i + 1)), [], []] } });

  it("typing shows the value on the author line with the 4×5 block cursor", () => {
    const s = run("DATA 12");
    expect(textAt(s).slice(-2)).toEqual(["0,25:L1(1)=", "32,25:12"]);
    expect(cur(s)).toEqual({ x: 43, y: 25, w: 4, h: 5, style: "block" });
  });

  it("the selected cell's value follows the label", () => {
    expect(textAt(run("DATA", seeded(3))).at(-1)).toBe("32,25:1");
  });

  it("▲ ▼ ◄ ► move and clamp; 2nd ▲ / 2nd ▼ jump to the top and the first blank row", () => {
    expect(run("DATA UP", seeded(3)).app).toMatchObject({ row: 0 });
    expect(run("DATA DOWN×9", seeded(3)).app).toMatchObject({ row: 3, top: 0 });
    expect(run("DATA BOTTOM", seeded(6)).app).toMatchObject({ row: 6, top: 3 });
    expect(run("DATA BOTTOM TOP", seeded(6)).app).toMatchObject({ row: 0, top: 0 });
    expect(run("DATA DOWN DOWN RIGHT", seeded(6)).app).toMatchObject({ col: 1, row: 0 });
    expect(run("DATA LEFT RIGHT×5", seeded(1)).app).toMatchObject({ col: 2 });
  });

  it("↑ / ↓ show elements scrolled off above / below", () => {
    expect(indicators(run("DATA", seeded(4)))).toEqual(["l1", "l2", "l3", "deg"]);
    expect(indicators(run("DATA", seeded(5)))).toEqual(["l1", "l2", "l3", "deg", "down"]);
    expect(indicators(run("DATA BOTTOM", seeded(5)))).toEqual(["l1", "l2", "l3", "deg", "up"]);
  });

  it("▲ stores the value and moves up; clear abandons the value, then leaves", () => {
    const s = run("DATA DOWN DOWN 7 UP", seeded(3));
    expect(s.apps.lists[0].map((v) => v.re)).toEqual([1, 2, 7]);
    expect(s.app).toMatchObject({ row: 1 });
    expect(run("DATA 7 CLEAR CLEAR", seeded(3)).apps.lists[0]).toHaveLength(3);
    expect(run("DATA 7 CLEAR CLEAR", seeded(3)).app.kind).toBe("data");
    expect(run("DATA CLEAR", seeded(3)).app.kind).toBe("home");
  });

  it("recall pastes into a new cell value", () => {
    const s = run("DATA RECALL ENTER", { ...seeded(0), vars: { ...initialState().vars, x: int(15) } });
    expect(s.app.kind === "data" && s.app.edit && rowText(s.app.edit.row)).toBe("15");
  });

  it("an error keeps the typed value for correcting", () => {
    const s = run("DATA 1 / 0 ENTER");
    expect(s.app).toMatchObject({ kind: "error", error: "DIVIDE BY 0" });
    const back = run("CLEAR", s);
    expect(back.app.kind === "data" && back.app.edit && rowText(back.app.edit.row)).toBe("1÷0");
  });

  it("holds at most 42 elements per list (GB p.32)", () => {
    const s = run("DATA BOTTOM 5 ENTER", seeded(42));
    expect(s.apps.lists[0]).toHaveLength(42);
  });
});

describe("text helpers", () => {
  it("formatPlain keeps exact fractions with the slanted bar when they fit", () => {
    expect(formatPlain({ re: 0.25, exact: { n: 1n, d: 4n, root: 1n, pi: false } }, MODES, 6)).toBe("1⁄4");
    expect(formatPlain({ re: -0.5, exact: { n: -1n, d: 2n, root: 1n, pi: false } }, MODES, 6)).toBe("⁻1⁄2");
    expect(formatPlain({ re: 1 / 997, exact: { n: 1n, d: 997n, root: 1n, pi: false } }, MODES, 4)).not.toContain("⁄");
    expect(formatPlain({ re: 196000 }, { ...MODES, notation: "ENG" }, 11)).toBe("196ᴇ3");
  });

  it("decimalRow / rationalRow build editable Classic symbols", () => {
    expect(rowText(decimalRow(0.5, false))).toBe("0.5");
    expect(rowText(decimalRow(-2.25, false))).toBe("⁻2.25");
    expect(rowText(decimalRow(1.5e15, false))).toBe("1.5*10^15");
    expect(decimalRow(1.5e15, true).at(-1)).toEqual({ t: "ee", exp: row("1", "5") });
    expect(rowText(rationalRow(-3n, 4n))).toBe("⁻3⁄4");
  });

  it("linearText shows × / ⁄ and the variable glyphs", () => {
    expect(linearText([sym("9"), sym("div"), sym("5"), sym("mul"), sym("L1"), sym("add"), sym("x"), sym("1"), sym("fracbar"), sym("2")])).toBe("9/5×L1+ẋ1⁄2");
  });
});
