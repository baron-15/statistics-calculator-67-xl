/**
 * Golden display tests for canvas screens (menus, MODE, stat wizards, data editor, table, the K
 * and y= editors), built as the apps layer would build them from D §4, §6 and compared pixel for
 * pixel with the TI-SmartView captures.
 */
import type { DrawItem, View } from "../../src/engine/screen";
import { canvas, inv, line } from "./build";
import { suite, type Case } from "./golden";

const V = (items: DrawItem[], cursor?: Parameters<typeof canvas>[2]) => (ind: View["indicators"]) => canvas(items, ind, cursor);

/**
 * A menu (D §6, E7/E8): tab titles on line 1, separated by one blank cell, the active one inverse
 * with one extra column; items on lines 2–4 with only the selected item's "n:" cells inverse.
 */
function menu(tabs: string[], active: number, items: string[], selected: number): DrawItem[] {
  const out: DrawItem[] = [];
  let cell = 0;
  tabs.forEach((t, i) => {
    out.push(line(0, t, cell));
    if (i === active) out.push(inv(0, cell, cell + [...t].length, 1));
    cell += [...t].length + 1;
  });
  items.forEach((t, i) => out.push(line(i + 1, t)));
  out.push(inv(selected + 1, 0, 2));
  return out;
}

const MENUS: Case[] = [
  { name: "GS_mem01", what: "E7: Clear Var, 1:Yes selected", view: V(menu(["Clear Var"], 0, ["1:Yes", "2:No"], 0)) },
  { name: "GS_mem04", what: "Recall Var: values with the variable glyphs; ↓ in item 3", view: V(menu(["Recall Var"], 0, ["1:ẋ=15", "2:ẏ=0", "3↓ż=0"], 0)) },
  { name: "GS_mem_p02b", what: "Recall Var in ENG: small-caps ᴇ", view: V(menu(["Recall Var"], 0, ["1:ẋ=196ᴇ3", "2:ẏ=207.4ᴇ3", "3↓ż=0ᴇ0"], 0)) },
  { name: "MF_prob02", what: "E8: PRB RAND tabs, PRB active", view: V(menu(["PRB", "RAND"], 0, ["1:nPr", "2:nCr", "3:!"], 0)) },
  { name: "MF_prob06", what: "PRB RAND tabs, RAND active", view: V(menu(["PRB", "RAND"], 1, ["1:rand", "2:randint("], 0)) },
  { name: "MF_StAngle02", what: "DMS R◂▸P tabs; minute and second marks", view: V(menu(["DMS", "R◂▸P"], 0, ["1:°", "2:′", "3↓″"], 0)) },
  { name: "MF_stats1var03", what: "STATS menu", view: V(menu(["STATS"], 0, ["1:1-Var Stats", "2:2-Var Stats"], 0)) },
  { name: "MF_stats2var03", what: "STATS menu with StatVars, item 2 selected", view: V(menu(["STATS"], 0, ["1:1-Var Stats", "2:2-Var Stats", "3:StatVars"], 1)) },
  { name: "MF_stats1var01", what: "CLEAR FORMULA, scrolled: ↑ in the first visible item", view: V(menu(["CLEAR", "FORMULA"], 0, ["2↑Clear L2", "3:Clear L3", "4:Clear ALL"], 2)) },
  { name: "MT_DataEd014", what: "FORMULA tab active", view: V(menu(["CLEAR", "FORMULA"], 1, ["1:Add/Edit Frmla", "2:Clear L1 Frmla", "3↓Clear L2 Frmla"], 0)) },
  { name: "MT_DataEd03b", what: "FORMULA tab scrolled to item 5", view: V(menu(["CLEAR", "FORMULA"], 1, ["3↑Clear L2 Frmla", "4:Clear L3 Frmla", "5:Clear ALL"], 2)) },
  { name: "MF_stats1var05", what: "1-Var results: x̄ glyph and the 1-row-higher = (written ≡)", view: V(menu(["1-Var:L1,One"], 0, ["1:n=4", "2:x̄≡52.5", "3↓Sx≡5"], 0)) },
  { name: "MF_statspr05B", what: "1-Var results with Sx=Error", view: V(menu(["1-Var:L1,L2"], 0, ["1:n=3", "2:x̄≡11.33333333", "3↓Sx=Error"], 0)) },
  { name: "MF_statspr206", what: "2-Var results: C↑Σxy, a, b with ⁻", view: V(menu(["2-Var:L1,L2"], 0, ["C↑Σxy=5234.15", "D:a=0.677325190", "E↓b≡⁻18.6663732"], 2)) },
  { name: "MF_statspr207", what: "2-Var results: r, x′, y′", view: V(menu(["2-Var:L1,L2"], 0, ["F↑r≡0.963411717", "G:x′", "H↓y′"], 2)) },
  { name: "MF_stats2var05B", what: "2-Var results: G↑x′ selected, I↓minX=45", view: V(menu(["2-Var:L1,L2"], 0, ["G↑x′", "H:y′", "I↓minX=45"], 0)) },
];

// ---------------------------------------------------------------------------------------------
// 4×5-font screens (D §6, E9, E10)

const m = (x: number, y: number, text: string): DrawItem => ({ t: "text", x, y, font: "menu", text });
/** Inverse box of a 4×5 word whose cell starts at x: one column left and right of the glyphs. */
const minv = (x: number, y: number, chars: number, adv = 5): DrawItem => ({ t: "rect", x, y, w: chars * adv + 1, h: 6, mode: "invert" });
const fill = (x: number, y: number, w: number, h: number): DrawItem => ({ t: "rect", x, y, w, h, mode: "fill" });

/** MODE screen: rows at a 6-px pitch; FIX digits at a 6-px advance from x = 30. */
function mode(sel: { angle: number; notation: number; fix: number | null; mathprint: boolean }): DrawItem[] {
  const out: DrawItem[] = [m(0, 0, "DEG RAD GRAD"), m(0, 6, "NORM SCI ENG"), m(0, 12, "FLOAT"), m(0, 18, "CLASSIC MATHPRINT")];
  for (let d = 0; d <= 9; d++) out.push(m(30 + 6 * d, 12, String(d)));
  out.push(minv([0, 20, 40][sel.angle] ?? 0, 0, [3, 3, 4][sel.angle] ?? 3));
  out.push(minv([0, 25, 45][sel.notation] ?? 0, 6, [4, 3, 3][sel.notation] ?? 3));
  out.push(sel.fix === null ? minv(0, 12, 5) : minv(30 + 6 * sel.fix, 12, 1, 5));
  out.push(sel.mathprint ? minv(40, 18, 9) : minv(0, 18, 7));
  return out;
}

const DEFAULTS = { angle: 0, notation: 0, fix: null, mathprint: true };

const MODE: Case[] = [
  { name: "GS_ModeDefaults", what: "E9: MODE defaults DEG NORM FLOAT MATHPRINT", view: V(mode(DEFAULTS)) },
  { name: "MF_ModeDefaults_1", what: "MODE defaults", view: V(mode(DEFAULTS)) },
  { name: "MF_AngModeRad", what: "MODE with RAD", view: V(mode({ ...DEFAULTS, angle: 1 })) },
  { name: "MF_TrigModeFix1", what: "MODE with FIX 1: one digit inverse, FLOAT plain", view: V(mode({ ...DEFAULTS, fix: 1 })) },
  { name: "MF_x10n01", what: "MODE with SCI", view: V(mode({ ...DEFAULTS, notation: 1 })) },
];

const WIZARDS: Case[] = [
  {
    name: "MF_stats1var04",
    what: "1-VAR STATS setup: DATA L1 and FRQ ONE inverse, CALC on the bottom line",
    view: V([m(0, 0, "1-VAR STATS"), m(0, 6, "DATA: L1 L2 L3"), minv(30, 6, 2), m(0, 12, "FRQ: ONE L1 L2 L3"), minv(25, 12, 3), m(70, 24, "CALC")]),
  },
  {
    name: "MF_stats2var04",
    what: "2-VAR STATS setup: xDATA/yDATA with the variable glyphs",
    view: V([m(0, 0, "2-VAR STATS"), m(0, 6, "ẋDATA: L1 L2 L3"), minv(35, 6, 2), m(0, 12, "ẏDATA: L1 L2 L3"), minv(50, 12, 2), m(70, 24, "CALC")]),
  },
];

/** Data editor frame: column rules at 31 and 64 (rows 0–22) and the rule at row 23. */
const rules: DrawItem[] = [fill(31, 0, 1, 23), fill(64, 0, 1, 23), fill(0, 23, 96, 1)];
const END = "______";
const cell = (col: number, row: number): DrawItem => ({ t: "rect", x: [0, 33, 66][col] ?? 0, y: row * 6, w: 30, h: 6, mode: "invert" });

const EDITOR: Case[] = [
  {
    name: "MT_DataEd01",
    what: "list values as 4×5 fractions with the slanted bar; empty cell inverse; author line",
    view: V([m(0, 0, "1⁄2"), m(0, 6, "3⁄4"), m(0, 12, "1"), m(0, 18, END), cell(0, 3), ...rules, m(0, 25, "L1(5)=")]),
  },
  {
    name: "MF_stats1var02",
    what: "L1 = 55, 55, 55 and an empty inverse cell",
    view: V([m(0, 0, "55"), m(0, 6, "55"), m(0, 12, "55"), m(0, 18, END), cell(0, 3), ...rules, m(0, 25, "L1(5)=")]),
  },
  {
    name: "MT_DataEd015",
    what: "formula prompt ♦L2= under an empty L2 (cursor blink off)",
    view: V([m(0, 0, "1⁄4"), m(0, 6, "1⁄2"), m(0, 12, "3⁄4"), m(0, 18, "1"), m(33, 0, END), cell(1, 0), m(66, 0, END), ...rules, m(0, 25, "♦L2=")]),
  },
  {
    name: "MT_DataEd016",
    what: "formula ♦L2=L1▸F◂▸D (4×5 ▸ and ◂▸)",
    view: V([m(0, 0, "1⁄4"), m(0, 6, "1⁄2"), m(0, 12, "3⁄4"), m(0, 18, "1"), m(33, 0, END), cell(1, 0), m(66, 0, END), ...rules, m(0, 25, "♦L2=L1▸F◂▸D")]),
  },
  {
    name: "MT_DataEd055",
    what: "formula ♦L2=9/5×L1+32 with the 4×5 block cursor; ⁻1 in L1",
    view: V(
      [m(0, 0, "8"), m(0, 6, "⁻1"), m(0, 12, "4"), m(0, 18, END), m(33, 0, END), cell(1, 0), m(66, 0, END), ...rules, m(0, 25, "♦L2=9/5×L1+32")],
      { x: 66, y: 25, w: 4, h: 5, style: "block" },
    ),
  },
];

const TABLE: Case[] = [
  {
    name: "MT_functable04",
    what: "function table: x and y headers, rule, selected x inverse, x=15 on the bottom line",
    view: V([
      m(10, 0, "ẋ"), m(46, 0, "ẏ"), fill(36, 0, 1, 24), fill(0, 24, 96, 1),
      m(0, 6, "15"), m(38, 6, "315"), m(0, 12, "18"), m(38, 12, "324"), m(0, 18, "21"), m(38, 18, "315"),
      { t: "rect", x: 0, y: 6, w: 35, h: 6, mode: "invert" },
      m(0, 26, "ẋ=15"),
    ]),
  },
  {
    name: "MT_functable02",
    what: "table setup in the big font: Auto inverse, OK right-aligned",
    view: V([line(0, "Start=0"), line(1, "Step=1"), line(2, "Auto"), inv(2, 0, 4), line(2, "Ask-ẋ", 6), line(3, "OK", 14)]),
  },
  {
    name: "MT_functable03",
    what: "table setup with Start=15, Step=3",
    view: V([line(0, "Start=15"), line(1, "Step=3"), line(2, "Auto"), inv(2, 0, 4), line(2, "Ask-ẋ", 6), line(3, "OK", 14)]),
  },
  { name: "MT_functable01", what: "y= function entry with the variable glyph", view: V([line(0, "y=ẋ(36−ẋ)")]) },
  { name: "MT_functable05", what: "y=3600−450x", view: V([line(0, "y=3600−450ẋ")]) },
  { name: "MT_Conk02", what: "constant editor K=*2+3", view: V([line(0, "K=*2+3")]) },
  { name: "MT_Conk09", what: "constant editor K=*5−2", view: V([line(0, "K=*5−2")]) },
];

suite("menus", MENUS);
suite("MODE screen", MODE);
suite("stat wizards", WIZARDS);
suite("data editor", EDITOR);
suite("table and editors", TABLE);
