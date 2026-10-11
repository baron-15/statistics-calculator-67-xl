import { describe, expect, it } from "vitest";
import { row, sym } from "../../../src/engine/expr";
import { cursorStyle, editKey, EDITOR_DEFAULTS, nestingDepth } from "../../../src/engine/editor";
import { at, CL, MP, text, type } from "./helpers";

describe("guidebook entry sequences", () => {
  it("n/d 3 ▼ 4 ► + 1", () => {
    const ed = type("n/d 3 ▼ 4 ► + 1");
    expect(ed.row).toEqual([{ t: "frac", num: row("3"), den: row("4") }, sym("add"), sym("1")]);
    expect(ed.cursor).toEqual(at(3));
    expect(text(ed)).toBe("3/4+1");
  });

  it("2 ^ 3 ► + 1", () => {
    const ed = type("2 ^ 3 ► + 1");
    expect(ed.row).toEqual([sym("2"), { t: "pow", exp: row("3") }, sym("add"), sym("1")]);
    expect(ed.cursor).toEqual(at(4));
    expect(text(ed)).toBe("2^3+1");
  });

  it("5 ^ 2 ► + 4 ^ ( 2 + 1 ) (GB-046)", () => {
    expect(text(type("5 ^ 2 ► + 4 ^ ( 2 + 1 )"))).toBe("5^2+4^((2+1))");
  });

  it("√ 3 ^ 2 ► + 4 ^ 2: ► leaves the exponent but stays under the radical (GB-026)", () => {
    const ed = type("√ 3 ^ 2 ► + 4 ^ 2");
    expect(ed.row).toEqual([{ t: "sqrt", rad: [sym("3"), { t: "pow", exp: row("2") }, sym("add"), sym("4"), { t: "pow", exp: row("2") }] }]);
    expect(ed.cursor).toEqual(at(1, [0, "rad"], [4, "exp"]));
  });

  it("√ 3 x² + 7 x²: x² keeps the cursor in place (GB-070c)", () => {
    const ed = type("√ 3 x² + 7 x²");
    expect(text(ed)).toBe("√(3²+7²)");
    expect(ed.cursor).toEqual(at(5, [0, "rad"]));
  });

  it("2 ^ 3 ^ 2 nests the exponents (GB-020)", () => {
    const ed = type("2 ^ 3 ^ 2");
    expect(ed.row).toEqual([sym("2"), { t: "pow", exp: [sym("3"), { t: "pow", exp: row("2") }] }]);
  });

  it("▼ from an exponent inside the numerator reaches the denominator (GB-044)", () => {
    const ed = type("n/d 2 ×10ⁿ 3 ▼ 4 ×10ⁿ 5 ► ► ◂▸");
    expect(ed.row).toEqual([
      { t: "frac", num: [sym("2"), { t: "ee", exp: row("3") }], den: [sym("4"), { t: "ee", exp: row("5") }] },
      sym("toggle"),
    ]);
    expect(text(ed)).toBe("(2*10^3)/(4*10^5)◂▸");
  });

  it("the quadratic-formula fraction (GB-040)", () => {
    const ed = type("n/d (−) 5 + √ 5 x² − 4 ( 1 ) ( 6 ) ▼ 2 ( 1 )");
    expect(text(ed)).toBe("(⁻5+√(5²−4(1)(6)))/(2(1))");
    expect(ed.cursor).toEqual(at(4, [0, "den"]));
  });

  it("a power after a mixed number", () => {
    expect(text(type("3 Un/d 1 ▼ 4 ► ^ 2"))).toBe("3⌴1/4^2");
  });
});

describe("◄ and ►", () => {
  it("► enters a fraction at the start of the numerator; ► at the end of the numerator exits", () => {
    const start = type("n/d 12 ▼ 3 ► 2nd◄");
    expect(start.cursor).toEqual(at(0));
    const inNum = type("►", MP, start);
    expect(inNum.cursor).toEqual(at(0, [0, "num"]));
    expect(type("►►", MP, inNum).cursor).toEqual(at(2, [0, "num"]));
    expect(type("►►►", MP, inNum).cursor).toEqual(at(1));
  });

  it("◄ enters a fraction at the end of the denominator; ◄ at the start of a slot exits", () => {
    const ed = type("n/d 12 ▼ 34 ►");
    expect(type("◄", MP, ed).cursor).toEqual(at(2, [0, "den"]));
    expect(type("◄◄◄", MP, ed).cursor).toEqual(at(0, [0, "den"]));
    expect(type("◄◄◄◄", MP, ed).cursor).toEqual(at(0));
  });

  it("► at the end of the denominator exits the fraction", () => {
    expect(type("n/d 1 ▼ 2 ►").cursor).toEqual(at(1));
  });

  it("a pow is entered from either side and left at either edge", () => {
    const ed = type("2 ^ 34 ► + 1");
    expect(type("◄◄", MP, ed).cursor).toEqual(at(2));
    expect(type("◄◄◄", MP, ed).cursor).toEqual(at(2, [1, "exp"]));
    expect(type("◄◄◄◄◄", MP, ed).cursor).toEqual(at(0, [1, "exp"]));
    expect(type("◄◄◄◄◄◄", MP, ed).cursor).toEqual(at(1));
    expect(type("◄◄◄◄◄◄►", MP, ed).cursor).toEqual(at(0, [1, "exp"]));
  });

  it("mixed numbers: unit ► numerator; ◄ from the fraction returns to the unit", () => {
    const ed = type("Un/d 4 ► 1 ▼ 2 ►");
    expect(ed.row).toEqual([{ t: "mixed", whole: row("4"), num: row("1"), den: row("2") }]);
    expect(type("◄", MP, ed).cursor).toEqual(at(1, [0, "den"]));
    expect(type("◄◄", MP, ed).cursor).toEqual(at(0, [0, "den"]));
    expect(type("◄◄◄", MP, ed).cursor).toEqual(at(1, [0, "whole"]));
    expect(type("◄◄◄◄◄", MP, ed).cursor).toEqual(at(0));
    expect(type("2nd◄ ►", MP, ed).cursor).toEqual(at(0, [0, "whole"]));
    expect(type("2nd◄ ►►►", MP, ed).cursor).toEqual(at(0, [0, "num"]));
  });

  it("n-th roots: index ► radicand, ◄ back", () => {
    const ed = type("3 ˣ√ 64 ►");
    expect(ed.cursor).toEqual(at(1));
    expect(type("◄", MP, ed).cursor).toEqual(at(2, [0, "rad"]));
    expect(type("◄◄◄◄", MP, ed).cursor).toEqual(at(1, [0, "index"]));
    expect(type("◄◄◄◄◄◄", MP, ed).cursor).toEqual(at(0));
    expect(type("2nd◄ ►►►", MP, ed).cursor).toEqual(at(0, [0, "rad"]));
  });

  it("×10ⁿ: ► leaves the exponent", () => {
    expect(type("2 ×10ⁿ 3 ► + 1").row).toEqual([sym("2"), { t: "ee", exp: row("3") }, sym("add"), sym("1")]);
  });

  it("does not wrap at either end of the entry", () => {
    expect(type("12 ►").cursor).toEqual(at(2));
    expect(type("12 ◄◄◄").cursor).toEqual(at(0));
    expect(type("◄ ►").cursor).toEqual(at(0));
  });

  it("2nd ◄ and 2nd ► jump to the start and end of the entry from inside templates", () => {
    const ed = type("1 + n/d 2 ▼ √ 3");
    expect(ed.cursor).toEqual(at(1, [2, "den"], [0, "rad"]));
    expect(type("2nd◄", MP, ed).cursor).toEqual(at(0));
    expect(type("2nd►", MP, ed).cursor).toEqual(at(3));
  });

  it("Classic rows are linear: ◄ ► step over every symbol", () => {
    const ed = type("3 n/d 4", CL);
    expect(type("◄◄", CL, ed).cursor).toEqual(at(1));
  });
});

describe("▲ and ▼", () => {
  it("move between numerator and denominator, landing at the end of the slot", () => {
    const ed = type("n/d 12 ▼ 3");
    expect(type("▲", MP, ed).cursor).toEqual(at(2, [0, "num"]));
    expect(type("▲ ▼", MP, ed).cursor).toEqual(at(1, [0, "den"]));
  });

  it("move between numerator and denominator of a mixed number", () => {
    const ed = type("4 Un/d 1 ▼ 2");
    expect(type("▲", MP, ed).cursor).toEqual(at(1, [0, "num"]));
  });

  it("return null at the top level so the router can scroll history", () => {
    const ed = type("1 + 2");
    expect(editKey(ed, "UP", MP)).toBeNull();
    expect(editKey(ed, "DOWN", MP)).toBeNull();
    expect(editKey(EDITOR_DEFAULTS, "UP", MP)).toBeNull();
  });

  it("return null where no stacked slot exists: ▲ in a numerator, ▼ in a denominator, a unit, a radical", () => {
    expect(editKey(type("n/d 1"), "UP", MP)).toBeNull();
    expect(editKey(type("n/d 1 ▼ 2"), "DOWN", MP)).toBeNull();
    expect(editKey(type("Un/d 4"), "UP", MP)).toBeNull();
    expect(editKey(type("Un/d 4"), "DOWN", MP)).toBeNull();
    expect(editKey(type("√ 2"), "UP", MP)).toBeNull();
  });

  it("use the innermost fraction that can move", () => {
    // a fraction in the denominator of a fraction: ▲ from its numerator goes to the outer numerator
    const ed = type("n/d 1 ▼ n/d 2");
    expect(ed.cursor).toEqual(at(1, [0, "den"], [0, "num"]));
    expect(type("▼", MP, ed).cursor).toEqual(at(0, [0, "den"], [0, "den"]));
    expect(type("▲", MP, ed).cursor).toEqual(at(1, [0, "num"]));
  });
});

describe("nesting", () => {
  it("nested fractions", () => {
    const ed = type("n/d n/d 1 ▼ 2 ► ▼ 3");
    expect(ed.row).toEqual([{ t: "frac", num: [{ t: "frac", num: row("1"), den: row("2") }], den: row("3") }]);
    expect(ed.cursor).toEqual(at(1, [0, "den"]));
  });

  it("allows four levels and ignores a fifth", () => {
    const four = type("n/d n/d n/d n/d");
    expect(four.cursor.path).toHaveLength(4);
    expect(nestingDepth(four.row)).toBe(4);
    for (const k of ["n/d", "Un/d", "√", "^", "ˣ√", "×10ⁿ", "10ˣ", "eˣ"]) {
      const after = type(k, MP, four);
      expect(after).toBe(four);
    }
    expect(text(type("7 x²", MP, four))).toBe("(7²)////");
  });

  it("counts every template kind toward the limit", () => {
    const ed = type("√ ^ 2 n/d ×10ⁿ");
    expect(ed.cursor.path).toHaveLength(4);
    expect(type("√", MP, ed)).toBe(ed);
    expect(type("ˣ√", MP, ed)).toBe(ed);
  });

  it("10ˣ at the limit inserts nothing (not even the 10)", () => {
    const ed = type("n/d n/d n/d n/d");
    expect(type("10ˣ", MP, ed).row).toEqual(ed.row);
  });
});

describe("cursor style", () => {
  it("block by default, underscore in insert mode", () => {
    expect(cursorStyle(EDITOR_DEFAULTS)).toBe("block");
    expect(cursorStyle(type("12"))).toBe("block");
    expect(cursorStyle(type("12 ins"))).toBe("insert");
  });

  it("exit at the end of a non-empty template slot", () => {
    expect(cursorStyle(type("5 n/d 9"))).toBe("exit");
    expect(cursorStyle(type("2 ^ 3"))).toBe("exit");
    expect(cursorStyle(type("2 ^ 3 ins"))).toBe("exit");
  });

  it("block inside an empty slot or before the end of a slot", () => {
    expect(cursorStyle(type("n/d"))).toBe("block");
    expect(cursorStyle(type("n/d 12 ◄"))).toBe("block");
    expect(cursorStyle(type("2 ^ 3 ►"))).toBe("block");
  });
});
