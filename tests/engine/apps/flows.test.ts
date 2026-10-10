/**
 * End-to-end flows through the router with the real math engine: guidebook (GB) and teacher-guide
 * (TG) keystroke sequences from docs/research/math-stats.md §10. Gated on the engine being present.
 */
import { describe, expect, it } from "vitest";
import { menuText } from "../../../src/engine/apps";
import { rowText } from "../../../src/engine/expr";
import { homeText } from "../../helpers/run";
import { entryText, indicators, mathReady, run, statsReady, textAt } from "./helpers";
import type { CalcState } from "../../../src/engine";

const last = (s: CalcState): string => homeText(s).at(-2) ?? "";
const lists = (s: CalcState) => s.apps.lists.map((l) => l.map((v) => v.re));

describe.runIf(mathReady)("Home: enter, history, repeat (K §4)", () => {
  it("GB-016: 1+1 … 4+4, ▲×4 enter pastes 3+3, + 2 → 8", () => {
    const s = run("1 + 1 ENTER 2 + 2 ENTER 3 + 3 ENTER 4 + 4 ENTER");
    expect(homeText(s)).toEqual(["1+1 = 2", "2+2 = 4", "3+3 = 6", "4+4 = 8", ""]);
    expect(entryText(run("UP×4 ENTER", s))).toBe("3+3");
    expect(last(run("UP×4 ENTER + 2 ENTER", s))).toBe("3+3+2 = 8");
  });

  it("enter on an empty line repeats the last entry (K §4.6), also after clear blanks the screen", () => {
    const s = run("2 + 3 ENTER ENTER");
    expect(homeText(s)).toEqual(["2+3 = 5", "2+3 = 5", ""]);
    expect(homeText(run("CLEAR ENTER", s)).slice(-2)).toEqual(["2+3 = 5", ""]);
    expect(run("ENTER").history).toHaveLength(0);
  });

  it("the first operator inserts Ans: 3*3 → 9, * 3 → Ans*3 = 27 (GB-018)", () => {
    expect(last(run("3 * 3 ENTER * 3 ENTER"))).toBe("Ans*3 = 27");
    expect(last(run("3 * 3 ENTER * 3 ENTER 3 NTH_ROOT ANS ENTER"))).toMatch(/= 3$/);
  });

  it("re-evaluating in a new mode leaves the old line as it was (TG p.56)", () => {
    const s = run("12345 ENTER MODE DOWN RIGHT ENTER CLEAR ENTER");
    expect(homeText(s)).toEqual(["12345 = 12345", "12345 = 1.2345*10^4", ""]);
    expect(indicators(s)).toContain("sci");
  });

  it("FIX 2 then FIX 1: 12.35 stays above 12.3 (TG p.66)", () => {
    const s = run("12.345 ENTER MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER CLEAR ENTER MODE DOWN DOWN RIGHT RIGHT ENTER CLEAR ENTER");
    expect(homeText(s).map((l) => l.split(" = ")[1])).toEqual(["12.345", "12.35", "12.3", undefined]);
    expect(indicators(s)).toContain("fix");
  });

  it("2nd hyp: sinh(5)+2 (GB-071a)", () => {
    expect(last(run("HYP SIN 5 ) + 2 ENTER"))).toBe("sinh(5)+2 = 76.20321058");
  });

  it("prb: 8 nPr 3, 52 nCr 5, 4! (GB-081–083)", () => {
    expect(last(run("8 PRB 1 3 ENTER"))).toBe("8 nPr 3 = 336");
    expect(last(run("52 PRB 2 5 ENTER"))).toBe("52 nCr 5 = 2598960");
    expect(last(run("4 PRB 3 ENTER"))).toBe("4! = 24");
  });

  it("angle: 1.5▸DMS (GB-056) and P▸Rx in FIX 1 (GB-062a)", () => {
    expect(last(run("1.5 ANGLE UP ENTER ENTER"))).toMatch(/^1\.5▸DMS = 1°30.0.$/);
    expect(last(run("MODE DOWN DOWN RIGHT RIGHT ENTER CLEAR ANGLE RIGHT 3 5 COMMA 30 ) ENTER"))).toBe("P▸Rx(5,30) = 4.3");
  });
});

describe.runIf(mathReady)("the ◂▸ toggle (K §4.16)", () => {
  it("after √8 → 2√2 it adds `2√2◂▸` → 2.828427125, and a second press toggles back (GB-017)", () => {
    const s = run("SQRT 8 ENTER TOGGLE");
    expect(homeText(s)).toEqual(["√8 = 2√2", "2√2◂▸ = 2.828427125", ""]);
    expect(s.history[1]?.toggled).toBe(true);
    expect(s.ans.re).toBeCloseTo(2.828427125, 9);
    expect(homeText(run("TOGGLE", s)).at(-2)).toMatch(/◂▸ = 2√2$/);
  });

  it("in RAD, tan⁻¹(1) then ◂▸ shows the 13-digit Ans and π/4 (GB-068b)", () => {
    const s = run("MODE RIGHT ENTER CLEAR ATAN 1 ) ENTER TOGGLE");
    expect(last(s)).toMatch(/^0\.785398163397\d◂▸ = π\/4$/);
  });

  it("typed inside an entry before enter (GB-044, SCI)", () => {
    const s = run("MODE DOWN RIGHT ENTER CLEAR FRAC 2 EE 3 DOWN 4 EE 5 RIGHT RIGHT TOGGLE ENTER");
    expect(s.history[0]?.entry.at(-1)).toEqual({ t: "sym", s: "toggle" });
    expect(s.ans.re).toBeCloseTo(0.005, 12);
    expect(rowText(s.history[0]?.result ?? [])).toBe("5*10^(⁻3)");
  });
});

describe.runIf(mathReady)("sto▸, recall, clear var (GB p.10–12)", () => {
  it("GB-027–031: 15→x, recall pastes the value, Ans→y, y, Ans÷4", () => {
    let s = run("CLEAR_VAR 1 15 STO VAR ENTER");
    expect(last(s)).toBe("15→x = 15");
    expect(s.vars.x.re).toBe(15);
    s = run("RECALL ENTER SQUARE ENTER", s);
    expect(last(s)).toBe("15² = 225");
    s = run("STO VAR VAR ENTER", s);
    expect(last(s)).toBe("Ans→y = 225");
    expect(s.vars.y.re).toBe(225);
    s = run("VAR VAR ENTER", s);
    expect(last(s)).toBe("y = 225");
    expect(last(run("/ 4 ENTER", s))).toBe("Ans÷4 = 56.25");
  });

  it("GB-032 in ENG: stored values recalled in E form and pasted in full", () => {
    let s = run("MODE DOWN RIGHT RIGHT ENTER CLEAR 350 * 560 STO VAR ENTER 340 * 610 STO VAR VAR ENTER");
    expect(homeText(s).slice(0, 2)).toEqual(["350*560→x = 196*10^3", "340*610→y = 207.4*10^3"]);
    expect(menuText(run("150 * RECALL", s))?.items.slice(0, 3)).toEqual(["ẋ=196ᴇ3", "ẏ=207.4ᴇ3", "ż=0ᴇ0"]);
    s = run("150 * RECALL ENTER ENTER", s);
    expect(last(s)).toBe("150*196000 = 29.4*10^6");
    expect(last(run("150 * VAR VAR ENTER", s))).toBe("150*y = 31.11*10^6");
  });

  it("clear var resets every variable", () => {
    const s = run("15 STO VAR ENTER CLEAR_VAR 1");
    expect(s.vars.x.re).toBe(0);
  });

  it("rand: 5→rand seeds it; the next draws are reproducible (GB-084–086)", () => {
    let s = run("5 STO PRB RIGHT 1 ENTER");
    expect(last(s)).toBe("5→rand = 5");
    expect(s.randSeed).toBe(5);
    s = run("PRB RIGHT 1 ENTER", s);
    expect(last(s)).toBe("rand = 0.000093165");
    s = run("PRB RIGHT 2 3 COMMA 5 ) ENTER", s);
    expect(last(s)).toBe("randint(3,5) = 5");
  });

  it("enter repeats randint with new draws (TG p.95)", () => {
    const s = run("PRB RIGHT 2 2 COMMA 10 ) ENTER ENTER ENTER");
    expect(s.history.map((h) => rowText(h.entry))).toEqual(["randint(2,10)", "randint(2,10)", "randint(2,10)"]);
    expect(new Set([s.randSeed, run("PRB RIGHT 2 2 COMMA 10 ) ENTER").randSeed]).size).toBe(2);
  });
});

describe.runIf(mathReady)("errors (K §7)", () => {
  it("DIVIDE BY 0: the message centred on line 2; clear returns to the entry", () => {
    const err = run("1 / 0 ENTER");
    expect(err.app).toMatchObject({ kind: "error", error: "DIVIDE BY 0" });
    expect(textAt(err)).toEqual(["12,8:DIVIDE BY 0"]);
    const back = run("CLEAR", err);
    expect(entryText(back)).toBe("1÷0");
    expect(back.history).toHaveLength(0);
  });

  it("DOMAIN and SYNTAX", () => {
    expect(run("LOG 0 ) ENTER").app).toMatchObject({ error: "DOMAIN" });
    expect(run("2 + * 3 ENTER").app).toMatchObject({ error: "SYNTAX" });
  });

  it("EQUATION LENGTH ERROR wraps onto two centred lines", () => {
    const s = run(`K + 1 ENTER ${"1 ".repeat(46)}ENTER`);
    expect(s.app).toMatchObject({ error: "EQUATION LENGTH ERROR" });
    expect(textAt(s)).toEqual(["0,8:EQUATION LENGTH", "30,16:ERROR"]);
  });
});

describe.runIf(mathReady)("constant K (GB p.35–36)", () => {
  it("GB-092: K=*2+3, then 4 → 4*2+3 = 11 and 6 → 6*2+3 = 15", () => {
    const def = run("K * 2 + 3 ENTER");
    expect(def.apps.constant).toMatchObject({ on: true });
    expect(indicators(def)).toEqual(["k", "deg"]);
    expect(textAt(def)).toEqual(["0,0:K="]);
    const s = run("4 ENTER 6 ENTER", def);
    expect(homeText(s)).toEqual(["4*2+3 = 11", "6*2+3 = 15", ""]);
    expect(s.firstShown).toBe(0);
  });

  it("GB-093: 2nd K 2nd K clear x² enter → K=², 5 → 25, 20 → 400", () => {
    const s = run("K * 2 + 3 ENTER K K CLEAR SQUARE ENTER 5 ENTER 20 ENTER");
    expect(homeText(s).slice(-3)).toEqual(["5² = 25", "20² = 400", ""]);
  });

  it("GB-094: 2nd K turns it off: 1+1 = 2 with K unlit", () => {
    const s = run("K * 2 + 3 ENTER K 1 + 1 ENTER");
    expect(last(s)).toBe("1+1 = 2");
    expect(indicators(s)).not.toContain("k");
    expect(s.apps.constant).toMatchObject({ on: false });
  });

  it("GB-095: K=*5−2 with negative inputs", () => {
    const s = run("K * 5 - 2 ENTER NEG 5 ENTER NEG 1 ENTER");
    expect(homeText(s).slice(-3)).toEqual(["⁻5*5−2 = ⁻27", "⁻1*5−2 = ⁻7", ""]);
  });

  it("an empty entry applies K to Ans (SPEC: assumption)", () => {
    expect(last(run("3 ENTER K * 2 ENTER ENTER"))).toBe("Ans*2 = 6");
  });

  it("CLASSIC ↔ MATHPRINT clears K and history (TG p.35)", () => {
    const s = run("1 + 1 ENTER K * 2 ENTER MODE DOWN×3 LEFT ENTER");
    expect(s.apps.constant).toBeNull();
    expect(s.history).toHaveLength(0);
    expect(s.modes.display).toBe("CLASSIC");
  });
});

describe.runIf(mathReady && statsReady)("data editor and statistics (GB p.24–33)", () => {
  const gb077 = "DATA DATA DOWN×3 ENTER 45 DOWN 55 DOWN 55 DOWN 55 ENTER";

  it("GB-077: enter data, 1-Var stats, paste x̄, Ans*2", () => {
    let s = run(gb077);
    expect(lists(s)[0]).toEqual([45, 55, 55, 55]);
    expect(s.app).toMatchObject({ kind: "data", row: 4, top: 1 });
    expect(textAt(s).at(-1)).toBe("0,25:L1(5)=");
    s = run("STAT 1 DOWN DOWN ENTER", s);
    expect(menuText(s)).toMatchObject({ tabs: ["1-Var:L1,One"] });
    expect(menuText(s)?.items).toEqual(["n=4", "x̄≡52.5", "Sx≡5", "σx=4.330127019", "Σx=210", "Σx²=11100", "minX=45", "Q1=50", "Med=55", "Q3=55", "maxX=55"]);
    s = run("2", s);
    expect(entryText(s)).toBe("x̄");
    s = run("ENTER * 2 ENTER", s);
    expect(homeText(s).slice(-3)).toEqual(["x̄ = 52.5", "Ans*2 = 105", ""]);
  });

  it("GB-078: 2-Var, then StatVars ▲×6 → x′(45) = 15", () => {
    const s = run("DATA DATA DOWN×3 ENTER 45 DOWN 55 DOWN RIGHT 30 DOWN 25 DOWN STAT 2 DOWN DOWN ENTER QUIT STAT 3 UP×6 ENTER 45 ) ENTER");
    expect(last(s)).toBe("x′(45) = 15");
  });

  it("GB-079: frequencies in L2 give Sx=Error; 11 overwritten by 15 → x̄=12", () => {
    let s = run("DATA DATA 4 DATA RIGHT 5 12 DOWN 13 DOWN 10 DOWN 11 DOWN RIGHT 1 DOWN .5 DOWN 1 DOWN .5 DOWN");
    expect(lists(s)).toEqual([[12, 13, 10, 11], [1, 0.5, 1, 0.5], []]);
    s = run("STAT 1 DOWN RIGHT RIGHT ENTER ENTER", s);
    expect(menuText(s)).toMatchObject({ tabs: ["1-Var:L1,L2"] });
    expect(menuText(s)?.items.slice(0, 3)).toEqual(["n=3", "x̄≡11.33333333", "Sx=Error"]);
    s = run("DATA DOWN DOWN DOWN 15 DOWN STAT 1 DOWN DOWN ENTER", s);
    expect(lists(s)[0]).toEqual([12, 13, 10, 15]);
    expect(menuText(s)?.items.slice(0, 3)).toEqual(["n=3", "x̄≡12", "Sx=Error"]);
  });

  it("GB-080: 2-Var results, then y′(55)", () => {
    let s = run("DATA DATA 4 33 DOWN 49 DOWN 65 DOWN 79 DOWN RIGHT 5.3 DOWN 14.45 DOWN 20.21 DOWN 38.45 DOWN STAT 2 DOWN DOWN ENTER");
    expect(menuText(s)?.items.slice(0, 3)).toEqual(["n=4", "x̄≡56.5", "Sx≡19.89137166"]);
    expect(menuText(s)?.items.slice(11, 15)).toEqual(["Σxy=5234.15", "a=0.677325190", "b≡⁻18.6663732", "r≡0.963411717"]);
    s = run("DOWN×16 ENTER 55 ) ENTER", s);
    expect(last(s)).toBe("y′(55) = 18.58651222");
  });

  it("STAT, DIM MISMATCH and FRQ DOMAIN errors return to the wizard", () => {
    const empty = run("STAT 1 DOWN DOWN ENTER");
    expect(empty.app).toMatchObject({ kind: "error", error: "STAT" });
    expect(run("CLEAR", empty).app.kind).toBe("statWizard");
    expect(run("DATA 1 DOWN 2 DOWN RIGHT 1 DOWN STAT 1 DOWN RIGHT RIGHT ENTER ENTER").app).toMatchObject({ error: "DIM MISMATCH" });
    expect(run("DATA 1 DOWN RIGHT 100 DOWN STAT 1 DOWN RIGHT RIGHT ENTER ENTER").app).toMatchObject({ error: "FRQ DOMAIN" });
    expect(run("DATA 1 DOWN 2 DOWN RIGHT 1 DOWN STAT 2 DOWN DOWN ENTER").app).toMatchObject({ error: "STAT" });
  });

  it("delete removes an element and closes the gap (TG p.86)", () => {
    const s = run("DATA 85 DOWN 53 DOWN 97 DOWN 77 DOWN UP×3 DELETE");
    expect(lists(s)[0]).toEqual([85, 97, 77]);
  });

  it("GB-088: fractions stay fractions; ♦L2=L1▸F◂▸D gives decimals", () => {
    let s = run("DATA 1 FRAC 4 DOWN 2 FRAC 4 DOWN 3 FRAC 4 DOWN 4 FRAC 4 ENTER");
    expect(s.apps.lists[0].map((v) => (v.exact ? `${v.exact.n}/${v.exact.d}` : v.re))).toEqual(["1/4", "1/2", "3/4", "1/1"]);
    expect(textAt(s).slice(0, 3)).toEqual(["0,0:1⁄2", "0,6:3⁄4", "0,12:1"]);
    s = run("RIGHT DATA RIGHT ENTER DATA ENTER F_D", s);
    expect(textAt(s).at(-1)).toBe("0,25:♦L2=L1▸F◂▸D");
    s = run("ENTER", s);
    expect(lists(s)[1]).toEqual([0.25, 0.5, 0.75, 1]);
    expect(textAt(s).slice(-2)).toEqual(["0,25:L2(1)=", "32,25:0.25"]);
  });

  it("GB-089: ♦L2=9/5×L1+32, then adding 21 to L1 appends 69.8", () => {
    let s = run("DATA DATA 4 DATA RIGHT 5 8 DOWN NEG 1 DOWN 4 DOWN RIGHT DATA RIGHT 1 9 / 5 * DATA 1 + 32");
    expect(textAt(s).at(-1)).toBe("0,25:♦L2=9/5×L1+32");
    s = run("ENTER", s);
    expect(lists(s)[1]).toEqual([46.4, 30.2, 39.2]);
    s = run("LEFT DOWN DOWN DOWN 21 ENTER", s);
    expect(lists(s)).toEqual([[8, -1, 4, 21], [46.4, 30.2, 39.2, 69.8], []]);
    expect(s.app).toMatchObject({ kind: "data", col: 0, row: 4, top: 1 });
  });

  it("formula errors: its own list or no list → FORMULA; unequal lists → DIM MISMATCH", () => {
    expect(run("DATA DATA RIGHT 1 DATA 1 ENTER").app).toMatchObject({ error: "FORMULA" });
    expect(run("DATA DATA RIGHT 1 5 ENTER").app).toMatchObject({ error: "FORMULA" });
    const s = run("DATA 1 DOWN 2 DOWN RIGHT 3 DOWN RIGHT DATA RIGHT 1 DATA 1 + DATA 2 ENTER");
    expect(s.app).toMatchObject({ error: "DIM MISMATCH" });
    expect(run("CLEAR", s).app).toMatchObject({ kind: "data", formula: expect.anything() });
  });

  it("enter on a formula list deletes the formula; the data stay (TG p.79)", () => {
    let s = run("DATA 1 DOWN 2 DOWN RIGHT DATA RIGHT 1 DATA 1 * 2 ENTER");
    expect(s.apps.formulas[1]).not.toBeNull();
    s = run("ENTER", s);
    expect(s.apps.formulas[1]).toBeNull();
    expect(lists(run("LEFT 5 ENTER", s))[1]).toEqual([2, 4]);
  });

  it("Clear L2 Frmla keeps the data; StatVars stay after edits (MF_stats2var03)", () => {
    let s = run("DATA 1 DOWN 2 DOWN RIGHT DATA RIGHT 1 DATA 1 * 2 ENTER DATA RIGHT 3");
    expect(s.apps.formulas[1]).toBeNull();
    expect(lists(s)[1]).toEqual([2, 4]);
    s = run("STAT 1 DOWN DOWN ENTER DATA 7 ENTER STAT", s);
    expect(menuText(s)?.items).toContain("StatVars");
  });
});

describe.runIf(mathReady)("function table (GB p.34–35)", () => {
  const gb090 = "TABLE VAR ( 36 - VAR ) ENTER CLEAR 15 DOWN CLEAR 3 DOWN DOWN ENTER";

  it("GB-090: y=x(36−x) from 15 step 3 shows 315, 324, 315 and x=15", () => {
    const s = run(gb090);
    expect(textAt(s)).toEqual(["10,0:ẋ", "46,0:ẏ", "0,6:15", "38,6:315", "0,12:18", "38,12:324", "0,18:21", "38,18:315", "0,26:ẋ=15"]);
  });

  it("▼ past the bottom and ▲ past the top scroll without end", () => {
    expect(textAt(run(`${gb090} DOWN×3`)).slice(2, 4)).toEqual(["0,6:18", "38,6:324"]);
    expect(textAt(run(`${gb090} UP`)).slice(2, 4)).toEqual(["0,6:12", "38,6:288"]);
    expect(textAt(run(`${gb090} DOWN`)).at(-1)).toBe("0,26:ẋ=18");
  });

  it("GB-091: Ask-x rows filled by typing x", () => {
    const s = run("TABLE 3600 - 450 VAR ENTER 0 DOWN 1 DOWN RIGHT ENTER DOWN ENTER 2 ENTER DOWN 7 ENTER DOWN 8 ENTER");
    expect(textAt(s)).toEqual(["10,0:ẋ", "46,0:ẏ", "0,6:2", "38,6:2700", "0,12:7", "38,12:450", "0,18:8", "38,18:0", "0,26:ẋ=8"]);
    const deleted = run("UP DELETE", s);
    expect(deleted.apps.table.xs.map((v) => v.re)).toEqual([2, 8]);
  });

  it("typing an Ask-x value shows it on the bottom line with the 4×5 cursor", () => {
    const s = run("TABLE VAR ENTER DOWN DOWN RIGHT ENTER ENTER 12");
    expect(textAt(s).at(-1)).toBe("0,26:ẋ=12");
  });

  it("clear backs up from the table; in setup and y= it first empties the value (TG p.97, p.100)", () => {
    const s = run(gb090);
    expect(run("CLEAR", s).app).toMatchObject({ kind: "tableSetup", field: 0 });
    const emptied = run("CLEAR CLEAR", s);
    expect(emptied.app).toMatchObject({ kind: "tableSetup", start: { row: [] } });
    expect(run("CLEAR", emptied).app.kind).toBe("tableFunc");
    expect(run("CLEAR CLEAR CLEAR CLEAR CLEAR", s).app.kind).toBe("home");
  });

  it("the last function and settings are kept after 2nd quit (TG p.97)", () => {
    const s = run(`${gb090} QUIT TABLE`);
    expect(s.app.kind === "tableFunc" ? rowText(s.app.editor.row) : "").toBe("x(36−x)");
    expect(textAt(run("ENTER", s)).slice(0, 2)).toEqual(["0,0:Start=15", "0,8:Step=3"]);
  });

  it("rand in the function is INVALID FUNCTION; step 0 is refused", () => {
    const bad = run("TABLE PRB RIGHT 1 ENTER");
    expect(bad.app).toMatchObject({ kind: "error", error: "INVALID FUNCTION" });
    expect(run("CLEAR", bad).app.kind).toBe("tableFunc");
    expect(run("TABLE VAR ENTER DOWN CLEAR 0 DOWN DOWN ENTER").app).toMatchObject({ error: "DOMAIN" });
  });
});
