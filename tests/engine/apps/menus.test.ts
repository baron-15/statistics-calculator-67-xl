import { describe, expect, it } from "vitest";
import { menuText } from "../../../src/engine/apps";
import { pressOnClear } from "../../../src/engine/press";
import type { CalcState } from "../../../src/engine";
import type { Value } from "../../../src/engine/math";
import { canvas, entryText, gbHistory, indicators, initialState, inverts, run, sym, textAt } from "./helpers";

const int = (n: number): Value => ({ re: n, exact: { n: BigInt(n), d: 1n, root: 1n, pi: false } });
const menu = (s: CalcState) => menuText(s);

describe("prb menu (K §3.2; MF_prob02, MF_prob06)", () => {
  it("draws the PRB RAND tabs and three items with only PRB and `1:` inverse", () => {
    const s = run("8 PRB");
    expect(textAt(s)).toEqual(["0,0:PRB", "24,0:RAND", "0,8:1:nPr", "0,16:2:nCr", "0,24:3:!"]);
    // PRB covers columns 0–18 and the selected number cells columns 0–11 (D §4)
    expect(inverts(s)).toEqual([
      { x: 0, y: 0, w: 19, h: 8 },
      { x: 0, y: 8, w: 12, h: 8 },
    ]);
    expect(indicators(s)).toEqual(["deg"]);
  });

  it("number keys select at once and paste at the cursor (eG:MF_Prob)", () => {
    expect(entryText(run("4 PRB 3"))).toBe("4!");
    expect(entryText(run("8 PRB 1 3"))).toBe("8 nPr 3");
    expect(entryText(run("52 PRB 2 5"))).toBe("52 nCr 5");
  });

  it("► switches to RAND (inverse at columns 24–48) and wraps back", () => {
    const s = run("PRB RIGHT");
    expect(textAt(s)).toEqual(["0,0:PRB", "24,0:RAND", "0,8:1:rand", "0,16:2:randint("]);
    expect(inverts(s)[0]).toEqual({ x: 24, y: 0, w: 25, h: 8 });
    expect(menu(run("PRB RIGHT RIGHT"))?.active).toBe(0);
    expect(menu(run("PRB LEFT"))?.active).toBe(1);
    expect(entryText(run("PRB RIGHT 2 3 COMMA 5 )"))).toBe("randint(3,5)");
    expect(entryText(run("5 STO PRB RIGHT 1"))).toBe("5→rand");
  });

  it("▲ ▼ wrap; enter selects the highlighted item", () => {
    expect(menu(run("PRB UP"))?.selected).toBe(2);
    expect(menu(run("PRB DOWN DOWN DOWN"))?.selected).toBe(0);
    expect(entryText(run("3 PRB DOWN DOWN ENTER"))).toBe("3!");
  });

  it("clear returns to the entry unchanged; 2nd quit goes to a blank Home", () => {
    const s = run("150 * PRB CLEAR");
    expect(s.app.kind).toBe("home");
    expect(entryText(s)).toBe("150*");
    expect(entryText(run("150 * PRB QUIT"))).toBe("");
  });

  it("number keys past the item count are ignored", () => {
    expect(run("PRB RIGHT 3").app.kind).toBe("menu");
  });
});

describe("2nd angle menu (K §3.3; MF_StAngle02)", () => {
  it("DMS tab: ° ′ ″ with the ↓ hint on the third line", () => {
    const s = run("ANGLE");
    expect(textAt(s)).toEqual(["0,0:DMS", "24,0:R◂▸P", "0,8:1:°", "0,16:2:′", "0,24:3↓″"]);
  });

  it("▲ on item 1 wraps to 6:▸DMS and shows ↑ on the first line (TG p.119)", () => {
    const s = run("ANGLE UP");
    expect(menu(s)).toMatchObject({ selected: 5, top: 3 });
    expect(textAt(s).slice(2)).toEqual(["0,8:4↑ʳ", "0,16:5:ᵍ", "0,24:6:▸DMS"]);
    expect(inverts(s)[1]).toEqual({ x: 0, y: 24, w: 12, h: 8 });
    expect(entryText(run("1.5 ANGLE UP ENTER"))).toBe("1.5▸DMS");
  });

  it("R◂▸P tab: R▸Pr( R▸Pθ( P▸Rx( P▸Ry(", () => {
    const s = run("ANGLE RIGHT");
    expect(menu(s)?.items).toEqual(["R▸Pr(", "R▸Pθ(", "P▸Rx(", "P▸Ry("]);
    // the tab is 3 cells (◂▸ is one glyph) at cell 4: columns 24–42
    expect(inverts(s)[0]).toEqual({ x: 24, y: 0, w: 19, h: 8 });
    expect(entryText(run("ANGLE RIGHT 3 5 COMMA 30 )"))).toBe("P▸Rx(5,30)");
  });

  it("sin 30 2nd angle 1 ) pastes the degree mark (GB-054c)", () => {
    expect(entryText(run("SIN 30 ANGLE 1 )"))).toBe("sin(30°)");
    expect(entryText(run("SIN 30 ANGLE ENTER )"))).toBe("sin(30°)");
    expect(entryText(run("2 PI ANGLE 4"))).toBe("2πʳ");
  });
});

describe("2nd recall (K §3.7; GS_mem04)", () => {
  const withX = (from: CalcState = initialState()) => ({ ...from, vars: { ...from.vars, x: int(15) } });

  it("lists x … c with values; variable names use the variable glyph (math items)", () => {
    const s = run("RECALL", withX());
    expect(textAt(s)).toEqual(["0,0:Recall Var", "0,8:1:", "18,8:=15", "0,16:2:", "18,16:=0", "0,24:3↓", "18,24:=0"]);
    expect(canvas(s).items.filter((i) => i.t === "math")).toEqual([
      { t: "math", x: 12, y: 8, row: [sym("x")] },
      { t: "math", x: 12, y: 16, row: [sym("y")] },
      { t: "math", x: 12, y: 24, row: [sym("z")] },
    ]);
    expect(inverts(s)).toEqual([
      { x: 0, y: 0, w: 61, h: 8 },
      { x: 0, y: 8, w: 12, h: 8 },
    ]);
    expect(menu(run("RECALL", withX()))?.items).toEqual(["x=15", "y=0", "z=0", "t=0", "a=0", "b=0", "c=0"]);
  });

  it("selecting pastes the value, not the name (GB-029b, GB-032d)", () => {
    expect(entryText(run("RECALL ENTER", withX()))).toBe("15");
    const eng: CalcState = { ...initialState(), modes: { ...initialState().modes, notation: "ENG" }, vars: { ...initialState().vars, x: int(196000), y: { re: 207400 } } };
    expect(entryText(run("150 * RECALL ENTER", eng))).toBe("150*196000");
    expect(entryText(run("RECALL 2", eng))).toBe("207400");
  });

  it("shows E-format values in ENG (GB-032c)", () => {
    const eng: CalcState = { ...initialState(), modes: { ...initialState().modes, notation: "ENG" }, vars: { ...initialState().vars, x: int(196000), y: { re: 207400 } } };
    expect(menu(run("RECALL", eng))?.items.slice(0, 3)).toEqual(["x=196ᴇ3", "y=207.4ᴇ3", "z=0ᴇ0"]);
  });
});

describe("2nd clear var (K §3.10; GS_mem01)", () => {
  it("Clear Var / 1:Yes / 2:No with Yes highlighted; the title covers columns 0–54", () => {
    const s = run("CLEAR_VAR");
    expect(textAt(s)).toEqual(["0,0:Clear Var", "0,8:1:Yes", "0,16:2:No"]);
    expect(inverts(s)).toEqual([
      { x: 0, y: 0, w: 55, h: 8 },
      { x: 0, y: 8, w: 12, h: 8 },
    ]);
  });

  it("1 clears every variable to 0 and returns to the previous screen", () => {
    const from = { ...initialState(), vars: { ...initialState().vars, x: int(15), c: int(3) } };
    const s = run("12 CLEAR_VAR 1", from);
    expect(Object.values(s.vars).every((v) => v.re === 0)).toBe(true);
    expect(s.app.kind).toBe("home");
    expect(entryText(s)).toBe("12");
  });

  it("2 (No) keeps them", () => {
    const from = { ...initialState(), vars: { ...initialState().vars, x: int(15) } };
    expect(run("CLEAR_VAR 2", from).vars.x.re).toBe(15);
    expect(run("CLEAR_VAR CLEAR", from).vars.x.re).toBe(15);
  });
});

describe("2nd reset (K §3.11)", () => {
  const busy = (): CalcState => ({
    ...gbHistory(),
    modes: { angle: "RAD", notation: "SCI", decimals: 2, display: "MATHPRINT" },
    vars: { ...initialState().vars, x: int(15) },
    ans: int(8),
    apps: {
      ...initialState().apps,
      lists: [[int(1)], [int(2)], []],
      constant: { row: [sym("mul"), sym("2")], on: true },
    },
    randSeed: 99,
    contrast: 11,
  });

  it("Reset / 1:No / 2:Yes with No highlighted", () => {
    const s = run("RESET");
    expect(textAt(s)).toEqual(["0,0:Reset", "0,8:1:No", "0,16:2:Yes"]);
    expect(run("RESET 1", busy())).toEqual({ ...busy() });
  });

  it("2 resets memory and shows MEMORY CLEARED on line 2 with only DEG lit", () => {
    const s = run("RESET 2", busy());
    expect(textAt(s)).toEqual(["6,8:MEMORY CLEARED"]);
    expect(indicators(s)).toEqual(["deg"]);
    expect(s.modes).toEqual({ angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" });
    expect(s.history).toEqual([]);
    expect(s.vars.x.re).toBe(0);
    expect(s.ans.re).toBe(0);
    expect(s.apps.lists).toEqual([[], [], []]);
    expect(s.apps.constant).toBeNull();
    expect(s.randSeed).toBe(12345);
    expect(s.contrast).toBe(11);
    const home = run("CLEAR", s);
    expect(home.app).toEqual({ kind: "home", selected: null });
    expect(entryText(home)).toBe("");
  });

  it("a key other than clear on MEMORY CLEARED goes Home and acts there", () => {
    expect(entryText(run("RESET 2 7"))).toBe("7");
  });

  it("on+clear resets at once with no message (TG p.29)", () => {
    const s = pressOnClear({ ...busy(), on: false });
    expect(s.on).toBe(true);
    expect(s.app).toEqual({ kind: "home", selected: null });
    expect(s.history).toEqual([]);
    expect(s.apps.constant).toBeNull();
  });
});

describe("2nd stat menu (K §3.5)", () => {
  it("STATS lists 1-Var and 2-Var; StatVars only after a calculation", () => {
    expect(textAt(run("STAT"))).toEqual(["0,0:STATS", "0,8:1:1-Var Stats", "0,16:2:2-Var Stats"]);
    expect(inverts(run("STAT"))[0]).toEqual({ x: 0, y: 0, w: 31, h: 8 });
    const done: CalcState = { ...initialState(), apps: { ...initialState().apps, stat: { kind: "1-Var", title: "1-Var:L1,One", items: [{ key: "stat_n", value: 4 }] } } };
    expect(menu(run("STAT", done))?.items).toEqual(["1-Var Stats", "2-Var Stats", "StatVars"]);
    expect(menu(run("STAT 3", done))).toMatchObject({ tabs: ["1-Var:L1,One"], items: ["n=4"] });
  });
});

describe("StatVars (K §3.5; MF_stats2var05B, MF_statspr206)", () => {
  // GB-078 data: L1 = 45 55 (wait: 45, 55), L2 = 30, 25 → a = −0.5, b = 52.5, r = −1
  const keys = [
    "stat_n", "stat_xbar", "stat_Sx", "stat_sx", "stat_Sumx", "stat_Sumx2", "stat_ybar", "stat_Sy", "stat_sy",
    "stat_Sumy", "stat_Sumy2", "stat_Sumxy", "stat_a", "stat_b", "stat_r", "stat_xprime", "stat_yprime",
    "stat_minX", "stat_maxX", "stat_minY", "stat_maxY",
  ] as const;
  const values = [4, 56.5, 19.89137166, 17.22643318, 226, 13956, 19.6025, 13.98459957, 12.11101849, 78.41, 2123.7391, 5234.15, 0.6773251903, -18.66637321, 0.9634117174, null, null, 33, 79, 5.3, 38.45];
  const done: CalcState = {
    ...initialState(),
    apps: { ...initialState().apps, stat: { kind: "2-Var", title: "2-Var:L1,L2", items: keys.map((key, i) => ({ key, value: values[i] ?? null })) } },
  };
  const open = (script: string) => run(`STAT 3 ${script}`, done);

  it("shows name=value in an 11-character field, keeping rounding zeros (GB-080b/c)", () => {
    expect(textAt(open(""))).toEqual(["0,0:2-Var:L1,L2", "0,8:1:n=4", "0,16:2:x̄=56.5", "0,24:3↓Sx=19.89137166"]);
    expect(textAt(open("DOWN×13")).slice(1)).toEqual(["0,8:C↑Σxy=5234.15", "0,16:D:a=0.677325190", "0,24:E↓b=⁻18.6663732"]);
    expect(textAt(open("DOWN×16")).slice(1)).toEqual(["0,8:F↑r=0.963411717", "0,16:G:x′", "0,24:H↓y′"]);
  });

  it("▲×6 from item 1 wraps to G:x′ (GB-078c) and enter pastes x′(", () => {
    const s = open("UP×6");
    expect(textAt(s).slice(1)).toEqual(["0,8:G↑x′", "0,16:H:y′", "0,24:I↓minX=33"]);
    expect(inverts(s)[1]).toEqual({ x: 0, y: 8, w: 12, h: 8 });
    const pasted = run("ENTER 45 )", s);
    expect(pasted.app.kind).toBe("home");
    expect(entryText(pasted)).toBe("x′(45)");
  });

  it("number keys paste a statistic into the pending entry", () => {
    expect(entryText(run("3 * STAT 3 2", done))).toBe("3*x̄");
  });

  it("a null value shows Error (Sx with non-integer frequencies)", () => {
    const err: CalcState = { ...done, apps: { ...done.apps, stat: { kind: "1-Var", title: "1-Var:L1,L2", items: [{ key: "stat_Sx", value: null }] } } };
    expect(menu(run("STAT 3", err))?.items).toEqual(["Sx=Error"]);
  });
});

describe("data menu (K §3.4; MT_DataEd03, MT_DataEd014)", () => {
  it("CLEAR tab; ▼▼▼ shows 2↑Clear L2 / 3:Clear L3 / 4:Clear ALL (GB-077a)", () => {
    const s = run("DATA DATA DOWN×3");
    expect(textAt(s)).toEqual(["0,0:CLEAR", "36,0:FORMULA", "0,8:2↑Clear L2", "0,16:3:Clear L3", "0,24:4:Clear ALL"]);
    expect(inverts(s)).toEqual([
      { x: 0, y: 0, w: 31, h: 8 },
      { x: 0, y: 24, w: 12, h: 8 },
    ]);
  });

  it("FORMULA tab: Add/Edit Frmla, Clear L1 Frmla, 3↓Clear L2 Frmla; FORMULA covers columns 36–78", () => {
    const s = run("DATA DATA RIGHT");
    expect(textAt(s).slice(2)).toEqual(["0,8:1:Add/Edit Frmla", "0,16:2:Clear L1 Frmla", "0,24:3↓Clear L2 Frmla"]);
    expect(inverts(s)[0]).toEqual({ x: 36, y: 0, w: 43, h: 8 });
    expect(menu(run("DATA DATA RIGHT DOWN×4"))?.items.at(-1)).toBe("Clear ALL");
  });

  it("Clear L2 empties L2 only and returns to the editor at its top; Clear ALL empties all", () => {
    const from: CalcState = { ...initialState(), apps: { ...initialState().apps, lists: [[int(1), int(2)], [int(3)], [int(4)]] } };
    const s = run("DATA DOWN DATA 2", from);
    expect(s.apps.lists.map((l) => l.length)).toEqual([2, 0, 1]);
    expect(s.app).toMatchObject({ kind: "data", row: 0, top: 0 });
    expect(run("DATA DATA 4", from).apps.lists).toEqual([[], [], []]);
  });

  it("clear backs up to the editor", () => {
    expect(run("DATA DATA CLEAR").app.kind).toBe("data");
  });
});
