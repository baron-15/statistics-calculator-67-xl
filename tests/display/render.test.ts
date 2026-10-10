/**
 * Renderer behaviour that the captures do not show (cursors, overflow on the left, inverse history
 * selection, metrics) and glyph coverage for every text the screens use.
 */
import { describe, expect, it } from "vitest";
import { SYMS, sym, type SymId } from "../../src/engine/expr";
import { missingGlyphs } from "../../src/display/fonts";
import { frameText, homeLayout, layoutRow, renderView, textWidth } from "../../src/display/render";
import { symText } from "../../src/display/symbols";
import { cat, frac, home, mixed, pow, renderRows, sqrt, tx } from "./build";

const rect = (rows: string[], x: number, y: number, w: number, h: number): string[] => rows.slice(y, y + h).map((r) => r.slice(x, x + w));

describe("glyph coverage", () => {
  it("draws every symbol in the big font", () => {
    const missing = (Object.keys(SYMS) as SymId[]).flatMap((s) => missingGlyphs("big", symText(s)).map((c) => `${s}:${c}`));
    expect(missing).toEqual([]);
  });

  it("draws menu, message and stat texts in the big font", () => {
    const texts = [
      "Clear Var", "Recall Var", "Reset", "1:Yes", "2:No", "PRB RAND", "1:nPr", "3:!", "2:randint(", "DMS R◂▸P", "6:▸DMS", "3↓″",
      "CLEAR FORMULA", "4:Clear ALL", "1:Add/Edit Frmla", "STATS", "1:1-Var Stats", "3:StatVars", "1-Var:L1,One", "2-Var:L1,L2",
      "C↑Σxy=5234.15", "E↓b≡⁻18.6663732", "Ls", "Start=0", "Step=1", "Auto", "Ask-ẋ", "OK", "K=*2+3", "y=ẋ(36−ẋ)", "MEMORY CLEARED",
      "ARGUMENT", "DIVIDE BY 0", "DOMAIN", "EQUATION LENGTH ERROR", "FRQ DOMAIN", "OVERFLOW", "STAT", "DIM MISMATCH", "SYNTAX",
      "INVALID FUNCTION", "MEMORY LIMIT", "LOW BATTERY", "▶◀■", "1:ẋ=196ᴇ3",
    ];
    const stats = (Object.keys(SYMS) as SymId[]).filter((s) => s.startsWith("stat_")).map((s) => SYMS[s]);
    expect(texts.concat(stats).flatMap((t) => missingGlyphs("big", t))).toEqual([]);
  });

  it("draws the MODE, wizard, data-editor and table texts in the 4×5 font", () => {
    const texts = [
      "DEG RAD GRAD", "NORM SCI ENG", "FLOAT 0123456789", "CLASSIC MATHPRINT", "1-VAR STATS", "2-VAR STATS", "DATA: L1 L2 L3",
      "FRQ: ONE L1 L2 L3", "ẋDATA:", "ẏDATA:", "CALC", "______", "L1(5)=", "♦L2=9/5×L1+32", "▸F◂▸D", "1⁄2", "⁻1.5ᴇ3", "ẋ=15", "ẏ",
    ];
    expect(texts.flatMap((t) => missingGlyphs("menu", t))).toEqual([]);
  });

  it("draws MathPrint script and fraction text in the small and tiny fonts", () => {
    const small = ["0123456789.+−⁻()π*,", "sin(cos(tan(log(ln(", "sinh⁻¹(", "Ans", "ẋẏżℯ", "°′″ʳᵍ!%", "→▸◂▸"];
    expect(small.flatMap((t) => missingGlyphs("small", t))).toEqual([]);
    expect(missingGlyphs("tinyMP", "0123456789.+−⁻()π")).toEqual([]);
  });
});

describe("metrics", () => {
  it("measures text in glyph cells, multi-character glyphs counting once", () => {
    expect(textWidth("big", "1:nPr")).toBe(30);
    expect(textWidth("menu", "DEG")).toBe(15);
    expect(textWidth("tiny", "12")).toBe(8);
    expect(textWidth("big", "2π◂▸")).toBe(18);
    expect(textWidth("big", SYMS.toFracMixed)).toBe(30);
    expect(textWidth("big", SYMS.stat_xbar)).toBe(6);
    expect(textWidth("big", SYMS.asin)).toBe(30);
  });

  it("lays out rows for the apps layer", () => {
    const mp = { mathprint: true };
    expect(layoutRow(tx("1+1"), mp)).toEqual({ width: 18, height: 7, axis: 3, cells: 3 });
    expect(layoutRow([frac("1", "2")], mp)).toEqual({ width: 6, height: 14, axis: 6, cells: 1 });
    expect(layoutRow([frac("41", "9")], mp)).toEqual({ width: 12, height: 14, axis: 6, cells: 2 });
    expect(layoutRow([mixed("4", "5", "9")], mp)).toEqual({ width: 12, height: 14, axis: 6, cells: 2 });
    expect(layoutRow(cat("2", pow("5")), mp)).toEqual({ width: 12, height: 9, axis: 5, cells: 2 });
    expect(layoutRow([sqrt("8")], mp)).toEqual({ width: 12, height: 9, axis: 5, cells: 2 });
    expect(layoutRow([frac("1", "2")], { mathprint: false })).toEqual({ width: 18, height: 7, axis: 3, cells: 3 });
  });
});

describe("x² and x⁻¹", () => {
  it("draws the square and recip symbols like ^2 and ^⁻1 templates in MathPrint", () => {
    const a = home({ history: [[cat("3", sym("square"), "+2", sym("recip")), "9.5"]] });
    const b = home({ history: [[cat("3", pow("2"), "+2", pow("⁻1")), "9.5"]] });
    expect(renderRows(a)).toEqual(renderRows(b));
  });

  it("draws them as one raised glyph each in Classic", () => {
    const rows = renderRows(home({ mp: false, history: [[cat("3", sym("square"), "+2", sym("recip")), "9.5"]] }));
    expect(rect(rows, 6, 0, 6, 7)).toEqual(["..##..", "....#.", "...#..", "..###.", "......", "......", "......"]);
    expect(rect(rows, 24, 0, 6, 3)).toEqual(["....##", ".....#", ".##..#"]);
  });
});

describe("cursor", () => {
  const typing = (style: "block" | "insert" | "exit", index = 3) => home({ entry: "1+2", cursor: { path: [], index }, cursorStyle: style });

  it("is drawn only in the blink-on phase", () => {
    expect(renderRows(typing("block"), false)).toEqual(renderRows(home({ entry: "1+2", cursor: null })));
  });

  it("block: fills the 5×7 glyph box of the cell after the entry", () => {
    expect(rect(renderRows(typing("block")), 18, 0, 6, 8)).toEqual([...Array(7).fill(".#####"), "......"]);
  });

  it("insert: an underscore on the glyph box's bottom row, hiding the character under it", () => {
    expect(rect(renderRows(typing("insert", 2)), 12, 0, 6, 7)).toEqual([...Array(6).fill("......"), ".#####"]);
  });

  it("exit: a block with a white > inside", () => {
    expect(rect(renderRows(typing("exit")), 18, 0, 6, 7)).toEqual([".#####", ".#.###", ".##.##", ".###.#", ".##.##", ".#.###", ".#####"]);
  });

  it("sits in a template slot in the slot's font (5×5 in a denominator)", () => {
    const v = home({ entry: cat("1+", frac("12", "")), cursor: { path: [{ node: 2, slot: "den" }], index: 0 } });
    // the denominator is one empty cell centred under "12": cell origin 15, rows 8–12
    expect(rect(renderRows(v), 15, 8, 6, 5)).toEqual(Array(5).fill(".#####"));
  });

  it("shows on a cleared screen at the top left", () => {
    const v = home({ history: [["1+1", "2"]], firstShown: 1 });
    expect(rect(renderRows(v), 0, 0, 6, 8)).toEqual([...Array(7).fill(".#####"), "......"]);
  });

  it("is not drawn after enter (empty entry under history)", () => {
    expect(renderRows(home({ history: [["1+1", "2"]] }))).toEqual(renderRows(home({ history: [["1+1", "2"]], cursor: null })));
  });
});

describe("long entries", () => {
  const long = "123456789+123456789+12";

  it("show ▶ in cell 15 while the cursor is on the left", () => {
    const rows = renderRows(home({ entry: long, cursor: { path: [], index: 0 } }));
    expect(rect(rows, 90, 0, 6, 7)).toEqual([".#....", ".##...", ".###..", ".####.", ".###..", ".##...", ".#...."]);
  });

  it("scroll to keep the cursor visible, with ◀ in cell 0", () => {
    const rows = renderRows(home({ entry: long }));
    expect(rect(rows, 0, 0, 6, 7)).toEqual(["....#.", "...##.", "..###.", ".####.", "..###.", "...##.", "....#."]);
    // the last character, "2", is in cell 14 and the cursor block in cell 15
    expect(rect(rows, 84, 0, 6, 7)).toEqual(["..###.", ".#...#", ".....#", "....#.", "...#..", "..#...", ".#####"]);
    expect(rect(rows, 90, 0, 6, 7)).toEqual(Array(7).fill(".#####"));
  });
});

describe("history", () => {
  const two = { history: [["1+1", "2"], ["2+3", "5"]] as [string, string][], cursor: null };

  it("draws the selected item inverse over its full cells and the row below", () => {
    const plain = renderRows(home(two));
    const sel = renderRows(home({ ...two, selected: { line: 1, part: "entry" } }));
    plain.forEach((r, y) => {
      const want = y >= 8 && y <= 15 ? [...r].map((c, x) => (x < 18 ? (c === "#" ? "." : "#") : c)).join("") : r;
      expect(sel[y]).toBe(want);
    });
  });

  it("scrolls a selected item above the screen back into view at the top", () => {
    const history = Array.from({ length: 6 }, (_, i): [string, string] => [`${i}+${i}`, String(2 * i)]);
    const v = home({ history, cursor: null, selected: { line: 0, part: "result" } });
    const rows = renderRows(v);
    // "0+0 … 0" on line 1 (TI's 0 has no slash), its result inverse in cell 15
    expect(rect(rows, 0, 0, 6, 7)).toEqual(["..###.", ".#...#", ".#...#", ".#...#", ".#...#", ".#...#", "..###."]);
    expect(rows[7]?.slice(90)).toBe("######");
  });

  it("reports hidden lines above for the ↑ indicator", () => {
    const history = Array.from({ length: 5 }, (_, i): [string, string] => [`${i}+${i}`, String(2 * i)]);
    const s = home({ history, cursor: null }).screen;
    if (s.kind !== "home") throw new Error("home");
    const l = homeLayout(s);
    expect(l.lines.map((x) => x.top)).toEqual([-8, 0, 8, 16, 24]);
    expect(l.hiddenAbove).toBe(true);
    expect(l.hiddenBelow).toBe(false);
  });
});

describe("frames", () => {
  it("is blank when the calculator is off, and passes indicators and contrast through", () => {
    const v = { ...home({ history: [["1+1", "2"]] }, ["deg", "up"]), on: false, contrast: 11 };
    const f = renderView(v, { blinkOn: true });
    expect(frameText(f).join("")).not.toContain("#");
    expect(f.indicators).toEqual(["deg", "up"]);
    expect(f.contrast).toBe(11);
  });

  it("draws nothing for the blank screen", () => {
    const f = renderView({ screen: { kind: "blank" }, indicators: [], contrast: 8, on: true }, { blinkOn: true });
    expect(frameText(f).join("")).not.toContain("#");
  });

  it("lays out four nesting levels without leaving the frame", () => {
    const deep = [frac(cat(sqrt(cat("2", pow([frac("1", [sqrt("3")])]))), "+1"), "4")];
    const rows = renderRows(home({ history: [[deep, "1"]] }));
    expect(rows).toHaveLength(31);
    expect(rows.every((r) => r.length === 96)).toBe(true);
    expect(rows.join("")).toContain("#");
  });
});
