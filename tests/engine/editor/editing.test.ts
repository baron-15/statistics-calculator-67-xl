import { describe, expect, it } from "vitest";
import { row, sym, type Row } from "../../../src/engine/expr";
import {
  cellCount, clearAction, editKey, EDITOR_DEFAULTS, emptyEditor, isEmpty, MAX_ENTRY_CELLS, pasteRow, symCells,
} from "../../../src/engine/editor";
import type { Action } from "../../../src/engine/keys";
import { at, CL, MP, text, type, withRow } from "./helpers";

describe("delete and 2nd insert (TG p.42)", () => {
  it("4569+285: ◄×6, delete → 459+285; ►►►►, 2nd insert, 6 → 459+2865", () => {
    const typed = type("4569 + 285");
    const moved = type("◄×6", MP, typed);
    expect(moved.cursor).toEqual(at(2));
    const deleted = type("del", MP, moved);
    expect(text(deleted)).toBe("459+285");
    expect(deleted.cursor).toEqual(at(2));
    const onFive = type("►►►►", MP, deleted);
    expect(onFive.cursor).toEqual(at(6));
    const inserted = type("ins 6", MP, onFive);
    expect(text(inserted)).toBe("459+2865");
    expect(inserted.cursor).toEqual(at(7));
  });

  it("a plain 6 at the same place would overwrite the 5", () => {
    expect(text(type("4569 + 285 ◄×6 del ►►►► 6"))).toBe("459+286");
  });

  it("delete past the end of the entry is a backspace", () => {
    const ed = type("123 del");
    expect(text(ed)).toBe("12");
    expect(ed.cursor).toEqual(at(2));
    expect(text(type("123 del del del del"))).toBe("");
  });

  it("delete on an empty entry does nothing", () => {
    const ed = editKey(EDITOR_DEFAULTS, "DELETE", MP)!;
    expect(ed.row).toEqual([]);
    expect(ed.cursor).toEqual(at(0));
  });

  it("delete removes multi-cell symbols whole", () => {
    expect(text(type("sin 30 ) 2nd◄ del"))).toBe("30)");
    expect(text(type("2 x⁻¹ del"))).toBe("2");
  });

  it("delete keeps insert mode", () => {
    expect(type("12 ◄ ins del").insert).toBe(true);
  });

  it("works in Classic on the symbol forms", () => {
    expect(text(type("3 n/d 4 ◄◄ del", CL))).toBe("34");
  });
});

describe("delete around templates", () => {
  it("backspacing into a template deletes its last character", () => {
    const ed = type("n/d 3 ▼ 45 ► del");
    expect(ed.row).toEqual([{ t: "frac", num: row("3"), den: row("4") }]);
    expect(ed.cursor).toEqual(at(1, [0, "den"]));
  });

  it("backspacing in an empty slot removes the template and keeps the rest of its content", () => {
    const ed = type("n/d 3 ▼ 4 ► del del");
    expect(ed.row).toEqual(row("3"));
    expect(ed.cursor).toEqual(at(1));
  });

  it("an empty template disappears on backspace", () => {
    expect(type("1 + √ del").row).toEqual(row("1", "add"));
    expect(type("1 + √ del").cursor).toEqual(at(2));
    expect(type("1 + n/d del").row).toEqual(row("1", "add"));
  });

  it("3 n/d then delete undoes the template: 3", () => {
    const ed = type("3 n/d del");
    expect(ed.row).toEqual(row("3"));
    expect(ed.cursor).toEqual(at(1));
  });

  it("2 ^ 3 ► del del: the exponent, then the template", () => {
    const one = type("2 ^ 3 ► del");
    expect(one.row).toEqual([sym("2"), { t: "pow", exp: [] }]);
    expect(one.cursor).toEqual(at(0, [1, "exp"]));
    const two = type("del", MP, one);
    expect(two.row).toEqual(row("2"));
    expect(two.cursor).toEqual(at(1));
  });

  it("delete with the cursor just before a template removes the template and keeps its content", () => {
    expect(type("√ 9 + 16 ► 2nd◄ del").row).toEqual(row("9", "add", "1", "6"));
    expect(type("2 ^ 3 ► ◄◄◄ del").row).toEqual(row("2", "3"));
    expect(type("n/d 3 ▼ 4 ► 2nd◄ del").row).toEqual(row("3", "4"));
    const mixed = type("4 Un/d 1 ▼ 2 ► 2nd◄ del");
    expect(mixed.row).toEqual(row("4", "1", "2"));
    expect(mixed.cursor).toEqual(at(0));
  });

  it("delete at the start of a non-empty slot deletes the character under the cursor", () => {
    const ed = type("n/d 12 ◄◄ del");
    expect(ed.row).toEqual([{ t: "frac", num: row("2"), den: [] }]);
    expect(ed.cursor).toEqual(at(0, [0, "num"]));
  });

  it("backspacing in an empty denominator keeps the cursor after the numerator's content", () => {
    const ed = type("1 + n/d 23 ▼ ► del");
    expect(ed.row).toEqual(row("1", "add", "2", "3"));
    expect(ed.cursor).toEqual(at(4));
  });

  it("backspacing in an empty numerator puts the cursor before the denominator's content", () => {
    const ed = type("n/d ▼ 45 ▲ del");
    expect(ed.row).toEqual(row("4", "5"));
    expect(ed.cursor).toEqual(at(0));
  });

  it("backspacing in an empty unit, index or radicand", () => {
    expect(type("Un/d del").row).toEqual([]);
    expect(type("3 ˣ√ del").row).toEqual(row("3"));
    expect(type("3 ˣ√ del").cursor).toEqual(at(1));
  });

  it("nested: backspacing walks into the innermost last slot", () => {
    const ed = type("√ 2 ^ 3 ► ► del");
    expect(ed.row).toEqual([{ t: "sqrt", rad: [sym("2"), { t: "pow", exp: [] }] }]);
    expect(ed.cursor).toEqual(at(0, [0, "rad"], [1, "exp"]));
  });
});

describe("clear", () => {
  it("21595 ◄◄ clear → 215 (clear to right, TG p.43)", () => {
    const ed = type("21595 ◄◄");
    expect(clearAction(ed)).toBe("cleared-right");
    const cleared = type("clear", MP, ed);
    expect(text(cleared)).toBe("215");
    expect(cleared.cursor).toEqual(at(3));
  });

  it("at the end of the entry, clear empties it", () => {
    const ed = type("21595");
    expect(clearAction(ed)).toBe("emptied");
    const cleared = type("clear", MP, ed);
    expect(cleared.row).toEqual([]);
    expect(cleared.cursor).toEqual(at(0));
    expect(isEmpty(cleared)).toBe(true);
  });

  it("on an empty entry it reports was-empty", () => {
    expect(clearAction(EDITOR_DEFAULTS)).toBe("was-empty");
    expect(editKey(EDITOR_DEFAULTS, "CLEAR", MP)?.row).toEqual([]);
  });

  it("clear at the start erases everything (it is still clear-to-right)", () => {
    const ed = type("123 2nd◄");
    expect(clearAction(ed)).toBe("cleared-right");
    expect(type("clear", MP, ed).row).toEqual([]);
  });

  it("inside a template: erases the rest of the slot and everything after the template", () => {
    const ed = type("1 + n/d 3 ▼ 456 ► + 7 ◄◄◄ ◄◄");
    expect(ed.cursor).toEqual(at(1, [2, "den"]));
    expect(clearAction(ed)).toBe("cleared-right");
    const cleared = type("clear", MP, ed);
    expect(cleared.row).toEqual([sym("1"), sym("add"), { t: "frac", num: row("3"), den: row("4") }]);
    expect(cleared.cursor).toEqual(at(1, [2, "den"]));
  });

  it("at the end of a slot with content after the template, clear erases that content", () => {
    const ed = type("n/d 3 ▼ 4 ► + 7 ◄◄◄");
    expect(ed.cursor).toEqual(at(1, [0, "den"]));
    const cleared = type("clear", MP, ed);
    expect(cleared.row).toEqual([{ t: "frac", num: row("3"), den: row("4") }]);
  });

  it("at the end of the last slot with nothing after, clear empties the entry", () => {
    const ed = type("1 + n/d 3 ▼ 4");
    expect(clearAction(ed)).toBe("emptied");
    expect(type("clear", MP, ed).row).toEqual([]);
  });

  it("emptying ends insert mode; clearing to the right keeps it", () => {
    expect(type("12 ins clear").insert).toBe(false);
    expect(type("12 ◄ ins clear").insert).toBe(true);
  });
});

describe("pasteRow", () => {
  it("inserts at the cursor and leaves the cursor after the pasted row", () => {
    const ed = pasteRow(type("12 ◄"), row("3", "add", "3"), MP);
    expect(text(ed)).toBe("13+32");
    expect(ed.cursor).toEqual(at(4));
  });

  it("never overwrites, even in overwrite mode", () => {
    expect(pasteRow(type("12 ◄◄"), row("9"), MP).row).toEqual(row("9", "1", "2"));
  });

  it("pastes into a template slot (history into a denominator, GB p.13)", () => {
    const ed = pasteRow(type("n/d 1 ▼"), row("3", "add", "3"), MP);
    expect(ed.row).toEqual([{ t: "frac", num: row("1"), den: row("3", "add", "3") }]);
    expect(ed.cursor).toEqual(at(3, [0, "den"]));
  });

  it("copies the pasted nodes", () => {
    const src: Row = [{ t: "frac", num: row("1"), den: row("2") }];
    const ed = pasteRow(EDITOR_DEFAULTS, src, MP);
    expect(ed.row).toEqual(src);
    expect(ed.row[0]).not.toBe(src[0]);
  });

  it("applies the first-key rules on an empty entry", () => {
    expect(text(pasteRow(EDITOR_DEFAULTS, row("nPr"), MP))).toBe("Ans nPr ");
    expect(text(pasteRow(EDITOR_DEFAULTS, row("deg"), MP))).toBe("Ans°");
    expect(text(pasteRow(EDITOR_DEFAULTS, row("toDMS"), { mathprint: true, lastAnswerRow: row("9", "8", ".", "2", "5") }))).toBe("98.25▸DMS");
    expect(text(pasteRow(EDITOR_DEFAULTS, row("toDMS"), { mathprint: true, lastAnswerRow: row("9"), }, { ansFirst: false }))).toBe("▸DMS");
    expect(text(pasteRow(type("2"), row("nPr"), MP))).toBe("2 nPr ");
  });

  it("an empty row changes nothing", () => {
    const ed = type("12");
    expect(pasteRow(ed, [], MP)).toBe(ed);
  });

  it("refuses rows that would pass the 80-cell or nesting limits", () => {
    const full = type("1".repeat(79));
    expect(pasteRow(full, row("2", "3"), MP)).toBe(full);
    expect(text(pasteRow(full, row("2"), MP))).toHaveLength(80);
    const deep = type("n/d n/d n/d");
    expect(pasteRow(deep, [{ t: "sqrt", rad: row("2") }], MP).row).toEqual(type("√ 2", MP, deep).row);
    expect(pasteRow(deep, [{ t: "sqrt", rad: [{ t: "sqrt", rad: [] }] }], MP)).toBe(deep);
  });

  it("ends the variable cycle", () => {
    const ed = pasteRow(type("var"), row("add"), MP);
    expect(ed.varCycle).toBeNull();
  });
});

describe("the 80-character limit", () => {
  it("ignores digits past 80", () => {
    const ed = type("1".repeat(85));
    expect(ed.row).toHaveLength(MAX_ENTRY_CELLS);
    expect(cellCount(ed.row)).toBe(80);
  });

  it("counts visible cells, not nodes", () => {
    const at78 = type("1".repeat(78));
    expect(type("sin", MP, at78)).toBe(at78);
    expect(type("ans", MP, at78)).toBe(at78);
    expect(text(type("π π", MP, at78))).toHaveLength(80);
  });

  it("still allows overwriting and deleting at the limit", () => {
    const full = type("1".repeat(80));
    expect(text(type("◄ 2", MP, full)).endsWith("2")).toBe(true);
    expect(cellCount(type("del", MP, full).row)).toBe(79);
  });

  it("refuses an overwrite that would grow the entry past 80", () => {
    const full = type("1".repeat(80) + " ◄");
    expect(type("sin", MP, full)).toBe(full);
  });

  it("counts templates by their Classic form", () => {
    expect(cellCount(type("n/d 1 ▼ 2").row)).toBe(3);
    expect(cellCount(type("4 Un/d 1 ▼ 2").row)).toBe(5);
    expect(cellCount(type("2 ^ 3").row)).toBe(3);
    expect(cellCount(type("√ 2").row)).toBe(3);
    expect(cellCount(type("3 ˣ√ 8").row)).toBe(4);
    expect(cellCount(type("2 ×10ⁿ 5").row)).toBe(6);
  });
});

describe("symbol widths", () => {
  it("counts glyph cells", () => {
    const cases: [Parameters<typeof symCells>[0], number][] = [
      ["1", 1], ["neg", 1], ["sin", 4], ["asin", 5], ["asinh", 6], ["ans", 3], ["recip", 1], ["square", 1],
      ["toggle", 1], ["toFD", 4], ["toFracMixed", 5], ["toPercent", 2], ["toDMS", 4], ["nPr", 5], ["xroot", 2],
      ["sqrtFn", 2], ["tenPow", 4], ["stat_xbar", 1], ["stat_Sumx2", 3], ["store", 1],
    ];
    for (const [s, n] of cases) expect([s, symCells(s)]).toEqual([s, n]);
  });

  it("row widths add up", () => {
    expect(cellCount(row("asin", "1", "rparen"))).toBe(7);
  });
});

describe("non-editing actions", () => {
  const others: Action[] = [
    "ENTER", "MODE", "QUIT", "PRB", "ANGLE", "DATA", "STAT", "TABLE", "HYP", "K", "RECALL", "CLEAR_VAR",
    "ON", "OFF", "RESET", "CONTRAST_LIGHTER", "CONTRAST_DARKER", "TOP", "BOTTOM", "2ND",
  ];
  for (const a of others) {
    it(`${a} returns null`, () => {
      expect(editKey(type("1 + 2"), a, MP)).toBeNull();
      expect(editKey(EDITOR_DEFAULTS, a, CL)).toBeNull();
    });
  }
});

describe("helpers", () => {
  it("isEmpty and emptyEditor", () => {
    expect(isEmpty(EDITOR_DEFAULTS)).toBe(true);
    expect(isEmpty(type("1"))).toBe(false);
    expect(emptyEditor()).toEqual(EDITOR_DEFAULTS);
    expect(emptyEditor().cursor).not.toBe(EDITOR_DEFAULTS.cursor);
  });

  it("withRow states work as starting points", () => {
    const ed = withRow([sym("1"), { t: "frac", num: row("2"), den: row("3") }]);
    expect(type("◄", MP, ed).cursor).toEqual(at(1, [1, "den"]));
  });
});
