import { describe, expect, it } from "vitest";
import { row, sym, type Row } from "../../../src/engine/expr";
import { editKey, EDITOR_DEFAULTS, pasteRow, type EditContext } from "../../../src/engine/editor";
import type { Action } from "../../../src/engine/keys";
import { at, CL, deepFreeze, MP, text, type, withRow } from "./helpers";

describe("plain symbols (same in both modes)", () => {
  const cases: [Action, string][] = [
    ["0", "0"], ["1", "1"], ["2", "2"], ["3", "3"], ["4", "4"], ["5", "5"], ["6", "6"], ["7", "7"], ["8", "8"], ["9", "9"],
    ["DOT", "."], ["NEG", "⁻"], ["LPAREN", "("], ["RPAREN", ")"], ["COMMA", ","], ["PI", "π"],
    ["LOG", "log("], ["LN", "ln("], ["SIN", "sin("], ["COS", "cos("], ["TAN", "tan("],
    ["ASIN", "sin⁻¹("], ["ACOS", "cos⁻¹("], ["ATAN", "tan⁻¹("], ["ANS", "Ans"],
  ];
  for (const ctx of [MP, CL]) {
    for (const [a, want] of cases) {
      it(`${ctx.mathprint ? "MathPrint" : "Classic"}: ${a} on an empty entry → ${want}`, () => {
        const ed = editKey(EDITOR_DEFAULTS, a, ctx);
        expect(ed && text(ed)).toBe(want);
        expect(ed?.cursor).toEqual(at(1));
      });
    }
  }

  it("types a number with a point and negation: (−) 1.5", () => {
    expect(text(type("(−) 1.5"))).toBe("⁻1.5");
  });
});

describe("operators, postfix functions and conversions after a number", () => {
  const cases: [string, string][] = [
    ["+", "2+"], ["−", "2−"], ["×", "2*"], ["÷", "2÷"], ["x²", "2²"], ["x⁻¹", "2⁻¹"], ["sto", "2→"], ["%", "2%"],
    ["▸%", "2▸%"], ["FRAC_CONV", "2▸n/d◂▸Un/d"], ["F_D", "2▸F◂▸D"], ["◂▸", "2◂▸"],
  ];
  for (const ctx of [MP, CL]) {
    for (const [k, want] of cases) {
      it(`${ctx.mathprint ? "MathPrint" : "Classic"}: 2 ${k} → ${want}`, () => {
        expect(text(type(`2 ${k}`, ctx))).toBe(want);
      });
    }
  }

  it("2nd % then × 150 (GB-041)", () => {
    expect(text(type("2 % × 150"))).toBe("2%*150");
  });
});

describe("hyperbolic functions (2nd hyp pending)", () => {
  const hyp: EditContext = { mathprint: true, hyp: true };
  const cases: [Action, string][] = [
    ["SIN", "sinh("], ["COS", "cosh("], ["TAN", "tanh("], ["ASIN", "sinh⁻¹("], ["ACOS", "cosh⁻¹("], ["ATAN", "tanh⁻¹("],
  ];
  for (const [a, want] of cases) {
    it(`hyp ${a} → ${want}`, () => {
      expect(text(editKey(EDITOR_DEFAULTS, a, hyp)!)).toBe(want);
      expect(text(editKey(EDITOR_DEFAULTS, a, { mathprint: false, hyp: true })!)).toBe(want);
    });
  }

  it("hyp does not affect other keys", () => {
    expect(text(editKey(EDITOR_DEFAULTS, "LOG", hyp)!)).toBe("log(");
  });

  it("sinh(5)+2 → ◄×5 → hyp 2nd sin⁻¹ overwrites the function (GB-071b)", () => {
    const pasted = pasteRow(EDITOR_DEFAULTS, row("sinh", "5", "rparen", "add", "2"), MP);
    const moved = type("◄×5", MP, pasted);
    expect(moved.cursor).toEqual(at(0));
    expect(text(editKey(moved, "ASIN", hyp)!)).toBe("sinh⁻¹(5)+2");
  });
});

describe("Classic forms of the template keys", () => {
  const cases: [string, string][] = [
    ["3 n/d 4", "3⁄4"],
    ["1 Un/d 7 n/d 12", "1⌴7⁄12"],
    ["2 ^ 5", "2^5"],
    ["2 ^ 3 ^ 2", "2^3^2"],
    ["√ 2 )", "√(2)"],
    ["3 ˣ√ 64", "3ˣ√64"],
    ["10ˣ 2", "10^(2"],
    ["eˣ .5", "e^(.5"],
    ["2 ×10ⁿ 5", "2*10^5"],
  ];
  for (const [keys, want] of cases) {
    it(`${keys} → ${want}`, () => {
      const ed = type(keys, CL);
      expect(text(ed)).toBe(want);
      expect(ed.row.every((n) => n.t === "sym")).toBe(true);
      expect(ed.cursor.path).toEqual([]);
    });
  }

  it("each Classic template key is a single symbol", () => {
    const single: [Action, string][] = [
      ["FRAC", "fracbar"], ["MIXED", "mixsep"], ["POWER", "caret"], ["SQRT", "sqrtFn"], ["NTH_ROOT", "xroot"],
      ["TEN_X", "tenPow"], ["E_X", "ePow"],
    ];
    for (const [a, s] of single) expect(editKey(withRow(row("7")), a, CL)?.row).toEqual([sym("7"), { t: "sym", s }]);
  });
});

describe("MathPrint template keys", () => {
  it("^ inserts a pow after the base and enters the exponent", () => {
    const ed = type("2 ^");
    expect(ed.row).toEqual([sym("2"), { t: "pow", exp: [] }]);
    expect(ed.cursor).toEqual(at(0, [1, "exp"]));
  });

  it("x² and x⁻¹ are postfix symbols, not templates", () => {
    expect(type("3 x²").row).toEqual(row("3", "square"));
    expect(type("3 x⁻¹").row).toEqual(row("3", "recip"));
    expect(type("3 x² x²").cursor).toEqual(at(3));
  });

  it("√ inserts a sqrt template with the cursor in the radicand", () => {
    const ed = type("√ 25");
    expect(ed.row).toEqual([{ t: "sqrt", rad: row("2", "5") }]);
    expect(ed.cursor).toEqual(at(2, [0, "rad"]));
  });

  it("ˣ√ after a number makes it the index: 3 ˣ√ 64 (GB-015)", () => {
    const ed = type("3 ˣ√ 64");
    expect(ed.row).toEqual([{ t: "root", index: row("3"), rad: row("6", "4") }]);
    expect(ed.cursor).toEqual(at(2, [0, "rad"]));
    expect(text(ed)).toBe("3ˣ√(64)");
  });

  it("ˣ√ with nothing before it leaves the index empty and puts the cursor there", () => {
    const ed = type("ˣ√");
    expect(ed.row).toEqual([{ t: "root", index: [], rad: [] }]);
    expect(ed.cursor).toEqual(at(0, [0, "index"]));
    expect(type("ˣ√ 6 ► 64").row).toEqual([{ t: "root", index: row("6"), rad: row("6", "4") }]);
  });

  it("3 ˣ√ 2nd ans (GB-018c)", () => {
    expect(type("3 ˣ√ ans").row).toEqual([{ t: "root", index: row("3"), rad: row("ans") }]);
  });

  it("×10ⁿ inserts an ee template: 1.5 ×10ⁿ 8", () => {
    const ed = type("1.5 ×10ⁿ 8");
    expect(ed.row).toEqual([...row("1", ".", "5"), { t: "ee", exp: row("8") }]);
    expect(ed.cursor).toEqual(at(1, [3, "exp"]));
  });

  it("10ˣ inserts the digits 1 0 and a pow (GB-074)", () => {
    const ed = type("10ˣ log 2 )");
    expect(ed.row).toEqual([sym("1"), sym("0"), { t: "pow", exp: row("log", "2", "rparen") }]);
    expect(text(ed)).toBe("10^(log(2))");
  });

  it("eˣ inserts e and a pow (GB-076)", () => {
    const ed = type("eˣ .5");
    expect(ed.row).toEqual([sym("e"), { t: "pow", exp: row(".", "5") }]);
    expect(ed.cursor).toEqual(at(2, [1, "exp"]));
  });

  it("log 10ˣ 5 ► ) (GB-075)", () => {
    expect(text(type("log 10ˣ 5 ► )"))).toBe("log(10^5)");
  });

  it("n/d before a number gives an empty fraction with the cursor in the numerator", () => {
    const ed = type("n/d");
    expect(ed.row).toEqual([{ t: "frac", num: [], den: [] }]);
    expect(ed.cursor).toEqual(at(0, [0, "num"]));
  });

  it("n/d after a number takes it as the numerator: 5 n/d 9", () => {
    const ed = type("5 n/d 9");
    expect(ed.row).toEqual([{ t: "frac", num: row("5"), den: row("9") }]);
    expect(ed.cursor).toEqual(at(1, [0, "den"]));
    expect(text(ed)).toBe("5/9");
  });

  it("n/d takes the whole number run, including a decimal point: 2 + 12.5 n/d", () => {
    const ed = type("2 + 12.5 n/d");
    expect(ed.row).toEqual([sym("2"), sym("add"), { t: "frac", num: row("1", "2", ".", "5"), den: [] }]);
    expect(ed.cursor).toEqual(at(0, [2, "den"]));
  });

  it("n/d takes π as the numerator: sin π n/d 6 ► ) (GB-059)", () => {
    expect(text(type("sin π n/d 6 ► )"))).toBe("sin(π/6)");
  });

  it("n/d after a closing parenthesis or a postfix starts an empty fraction", () => {
    expect(type("( 1 ) n/d").row.at(-1)).toEqual({ t: "frac", num: [], den: [] });
    expect(type("3 x² n/d").cursor).toEqual(at(0, [2, "num"]));
  });

  it("U n/d after an integer takes it as the unit: 4 U n/d 1 ▼ 2 ►", () => {
    const ed = type("4 Un/d 1 ▼ 2 ►");
    expect(ed.row).toEqual([{ t: "mixed", whole: row("4"), num: row("1"), den: row("2") }]);
    expect(ed.cursor).toEqual(at(1));
    expect(text(ed)).toBe("4⌴1/2");
  });

  it("U n/d takes only digits as the unit", () => {
    const ed = type("var Un/d");
    expect(ed.row).toEqual([sym("x"), { t: "mixed", whole: [], num: [], den: [] }]);
    expect(ed.cursor).toEqual(at(0, [1, "whole"]));
  });

  it("U n/d first: the unit holds one digit (TG p.59)", () => {
    const ed = type("Un/d 4 5");
    expect(ed.row).toEqual([{ t: "mixed", whole: row("4"), num: [], den: [] }]);
    expect(ed.cursor).toEqual(at(1, [0, "whole"]));
    const done = type("► 1 ▼ 2 ►", MP, ed);
    expect(text(done)).toBe("4⌴1/2");
  });

  it("the unit digit can still be overwritten", () => {
    const ed = type("Un/d 4 ◄ 7");
    expect(ed.row).toEqual([{ t: "mixed", whole: row("7"), num: [], den: [] }]);
  });

  it("3/4 + 1 U n/d 7 ▼ 12 (GB-036)", () => {
    const ed = type("n/d 3 ▼ 4 ► + 1 Un/d 7 ▼ 12");
    expect(ed.row).toEqual([
      { t: "frac", num: row("3"), den: row("4") },
      sym("add"),
      { t: "mixed", whole: row("1"), num: row("7"), den: row("1", "2") },
    ]);
  });
});

describe("Ans insertion on an empty entry (K §4.4)", () => {
  const cases: [string, string][] = [
    ["+ 2", "Ans+2"], ["− 2", "Ans−2"], ["× 3", "Ans*3"], ["÷ 4", "Ans÷4"], ["x²", "Ans²"], ["x⁻¹", "Ans⁻¹"],
    ["sto var", "Ans→x"], ["% × 2", "Ans%*2"],
  ];
  for (const ctx of [MP, CL]) {
    for (const [keys, want] of cases) {
      it(`${ctx.mathprint ? "MathPrint" : "Classic"}: ${keys} → ${want}`, () => {
        expect(text(type(keys, ctx))).toBe(want);
      });
    }
  }

  it("^ first: MathPrint Ans with an exponent template, Classic Ans^", () => {
    const mp = type("^ 2");
    expect(mp.row).toEqual([sym("ans"), { t: "pow", exp: row("2") }]);
    expect(mp.cursor).toEqual(at(1, [1, "exp"]));
    expect(text(type("^ 2", CL))).toBe("Ans^2");
  });

  it("×10ⁿ first inserts Ans too (SPEC: assumption)", () => {
    expect(type("×10ⁿ 3").row).toEqual([sym("ans"), { t: "ee", exp: row("3") }]);
    expect(text(type("×10ⁿ 3", CL))).toBe("Ans*10^3");
  });

  it("(−) first is negation, not Ans−", () => {
    expect(text(type("(−) 2"))).toBe("⁻2");
  });

  it("prefix functions and templates first do not insert Ans", () => {
    expect(text(type("sin"))).toBe("sin(");
    expect(type("n/d").row).toEqual([{ t: "frac", num: [], den: [] }]);
    expect(type("√").row).toEqual([{ t: "sqrt", rad: [] }]);
  });

  it("only an empty entry gets Ans", () => {
    expect(text(type("3 + ◄ ◄ +", MP, EDITOR_DEFAULTS))).toBe("++");
    expect(text(type("2 ◄ ins +"))).toBe("+2");
  });

  it("2nd ans inserts Ans anywhere: 90 − ans, √ ans", () => {
    expect(text(type("90 − ans"))).toBe("90−Ans");
    expect(type("√ ans").row).toEqual([{ t: "sqrt", rad: row("ans") }]);
  });

  it("conversions and ◂▸ first insert the previous answer's value", () => {
    const last: Row = [{ t: "frac", num: row("5", "7"), den: row("8") }];
    const ctx: EditContext = { mathprint: true, lastAnswerRow: deepFreeze(last) };
    expect(text(editKey(EDITOR_DEFAULTS, "FRAC_CONV", ctx)!)).toBe("(57)/8▸n/d◂▸Un/d");
    const toggled = editKey(EDITOR_DEFAULTS, "TOGGLE", { mathprint: true, lastAnswerRow: row("2", "sqrtFn", "2") })!;
    expect(text(toggled)).toBe("2√(2◂▸");
    expect(toggled.cursor).toEqual(at(4));
    const dec = row("0", ".", "7", "8", "5", "3", "9", "8", "1", "6", "3", "3", "9", "7", "5");
    expect(text(editKey(EDITOR_DEFAULTS, "TOGGLE", { mathprint: true, lastAnswerRow: dec })!)).toBe("0.7853981633975◂▸");
    expect(text(editKey(EDITOR_DEFAULTS, "F_D", { mathprint: false, lastAnswerRow: row("2", ".", "2", "5") })!)).toBe("2.25▸F◂▸D");
    expect(text(editKey(EDITOR_DEFAULTS, "TO_PERCENT", { mathprint: true, lastAnswerRow: row("1") })!)).toBe("1▸%");
  });

  it("the inserted answer is a copy", () => {
    const last = row("4");
    const ed = editKey(EDITOR_DEFAULTS, "TOGGLE", { mathprint: true, lastAnswerRow: last })!;
    expect(ed.row[0]).not.toBe(last[0]);
  });

  it("without a previous answer row, conversions fall back to the Ans token", () => {
    expect(text(editKey(EDITOR_DEFAULTS, "TOGGLE", MP)!)).toBe("Ans◂▸");
  });

  it("conversions inside an entry are plain symbols", () => {
    expect(text(type("n/d 9 ▼ 2 ► FRAC_CONV"))).toBe("9/2▸n/d◂▸Un/d");
  });
});

describe("overwrite and insert", () => {
  it("typing overwrites the symbol under the cursor by default", () => {
    const ed = type("123 ◄◄ 9");
    expect(text(ed)).toBe("193");
    expect(ed.cursor).toEqual(at(2));
  });

  it("2nd insert pushes characters right and shows the underscore cursor", () => {
    const ed = type("123 ◄◄ ins 9 8");
    expect(text(ed)).toBe("19823");
    expect(ed.insert).toBe(true);
  });

  it("insert mode ends when the cursor moves", () => {
    const ed = type("123 ◄◄ ins 9 ◄ 7");
    expect(ed.insert).toBe(false);
    expect(text(ed)).toBe("1723");
  });

  it("2nd insert toggles", () => {
    expect(type("ins ins").insert).toBe(false);
  });

  it("overwrite also replaces functions with functions", () => {
    expect(text(type("sin 30 ) ◄×4 cos"))).toBe("cos(30)");
  });

  it("templates never overwrite: they insert", () => {
    const ed = type("12 ◄ √");
    expect(ed.row).toEqual([sym("1"), { t: "sqrt", rad: [] }, sym("2")]);
  });

  it("a symbol typed just before a template is inserted, not written over it", () => {
    const ed = type("√ 4 ► 2nd◄ 2");
    expect(ed.row).toEqual([sym("2"), { t: "sqrt", rad: row("4") }]);
  });

  it("n/d in the middle of a number takes the digits left of the cursor", () => {
    const ed = type("1234 ◄◄ n/d");
    expect(ed.row).toEqual([{ t: "frac", num: row("1", "2"), den: [] }, sym("3"), sym("4")]);
  });
});

describe("the variable key", () => {
  it("cycles x → y → z → t → a → b → c and wraps to x", () => {
    const seen: string[] = [];
    let ed = EDITOR_DEFAULTS;
    for (let i = 0; i < 8; i++) {
      ed = editKey(ed, "VAR", MP)!;
      seen.push(text(ed));
    }
    expect(seen).toEqual(["x", "y", "z", "t", "a", "b", "c", "x"]);
    expect(ed.cursor).toEqual(at(1));
  });

  it("sto▸ x x on an empty entry gives Ans→y (GB-030)", () => {
    expect(text(type("sto var var"))).toBe("Ans→y");
  });

  it("150 × var var gives 150*y (GB-032f)", () => {
    expect(text(type("150 × var var"))).toBe("150*y");
  });

  it("any other key ends the cycle", () => {
    expect(text(type("var 2 var"))).toBe("x2x");
    expect(text(type("var ◄ ► var"))).toBe("xx");
  });

  it("cycles in place after overwriting", () => {
    const ed = type("123 ◄◄ var var");
    expect(text(ed)).toBe("1y3");
    expect(ed.cursor).toEqual(at(2));
  });

  it("cycles inside templates", () => {
    expect(type("n/d var var var").row).toEqual([{ t: "frac", num: row("z"), den: [] }]);
  });
});

describe("immutability", () => {
  it("never mutates the input state", () => {
    const start = deepFreeze(type("n/d 3 ▼ 45 ► + √ 2 ► 7"));
    const keys: Action[] = ["1", "FRAC", "MIXED", "POWER", "SQRT", "NTH_ROOT", "EE", "TEN_X", "E_X", "VAR", "DELETE", "CLEAR", "LEFT", "RIGHT", "UP", "DOWN", "HOME", "END", "INSERT"];
    for (const a of keys) {
      for (const c of [start, type("◄", MP, start), type("◄◄◄◄", MP, start), type("2nd◄", MP, start)]) {
        expect(() => editKey(c, a, MP)).not.toThrow();
      }
    }
    expect(() => pasteRow(start, deepFreeze(row("1", "add")), MP)).not.toThrow();
  });
});
