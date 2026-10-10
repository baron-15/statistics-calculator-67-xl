/**
 * Cross-layer edge cases driven by keystrokes through the whole calculator (editor → math → apps →
 * renderer): long entries scrolling with ◀ ▶, history browsing across 2-D lines, ◂▸ after results,
 * repeating enter, errors and recovery, the CLASSIC ↔ MATHPRINT switch, sto▸ and recall, the
 * constant K, and reset. Rendered frames are read back cell by cell where the arrows matter.
 */
import { describe, expect, it } from "vitest";
import { view } from "../../src/engine";
import { missingGlyphs } from "../../src/display/fonts";
import { entry, highlighted, homeText, indicators, last, lines, lit, MODE, readLine, run, screenLines } from "./helpers";

const LONG = "1 + 2 + 3 + 4 + 5 + 6 + 7 + 8 + 9 + 10"; // 20 cells

describe("long entries scroll with ◀ ▶ (K §4.8, D §3)", () => {
  it("the cursor at the end: ◀ in cell 0 and the last 14 characters, the cursor cell after them", () => {
    const s = run(LONG);
    expect(entry(s)).toBe("1+2+3+4+5+6+7+8+9+10");
    expect(readLine(s, 0)).toBe("◀4+5+6+7+8+9+10 ");
  });

  it("2nd ◀ jumps to the start: no ◀, the first 15 characters and ▶ in cell 15", () => {
    expect(readLine(run(`${LONG} 2ND HOME`), 0)).toBe("1+2+3+4+5+6+7+8▶");
  });

  it("▶ past cell 14 scrolls: both arrows while text is hidden on both sides", () => {
    const start = `${LONG} 2ND HOME`;
    expect(readLine(run(`${start} RIGHT×14`), 0)).toBe("1+2+3+4+5+6+7+8▶");
    expect(readLine(run(`${start} RIGHT×15`), 0)).toBe("◀2+3+4+5+6+7+8+▶");
    expect(readLine(run(`${start} RIGHT×16`), 0)).toBe("◀+3+4+5+6+7+8+9▶");
    // on the last character nothing is hidden on the right any more
    expect(readLine(run(`${start} RIGHT×19`), 0)).toBe("◀+4+5+6+7+8+9+10");
    expect(readLine(run(`${start} RIGHT×20`), 0)).toBe("◀4+5+6+7+8+9+10 ");
  });

  it("◀ back to the start scrolls back; inserting in the middle keeps the entry whole", () => {
    expect(readLine(run(`${LONG} LEFT×20`), 0)).toBe("1+2+3+4+5+6+7+8▶");
    const s = run(`${LONG} LEFT×18`);
    const edited = run("2ND INSERT 0", s);
    expect(entry(edited)).toBe("1+02+3+4+5+6+7+8+9+10");
    expect(last(run("ENTER", edited))).toBe("1+02+3+4+5+6+7+8+9+10 = 55");
  });

  it("after enter the history entry is cut with ▶ in cell 15 and the result goes to the next line", () => {
    const s = run(`${LONG} ENTER`);
    expect(homeText(s)).toEqual(["1+2+3+4+5+6+7+8+9+10 = 55", ""]);
    expect(readLine(s, 0)).toBe("1+2+3+4+5+6+7+8▶");
    expect(readLine(s, 8)).toBe("              55");
  });

  it("the entry line holds 80 characters (KB 15401); further keys are ignored", () => {
    const s = run("1 ".repeat(85));
    expect(entry(s)).toHaveLength(80);
    expect(readLine(s, 0)).toBe("◀11111111111111 ");
  });
});

describe("history browsing across 2-D lines (K §4.5)", () => {
  const base = "1 FRAC 2 RIGHT + 1 FRAC 3 ENTER 2 + 2 ENTER";

  it("▲ alternates results and entries through a fraction line; enter pastes the stacked fraction", () => {
    let s = run(`${base} UP UP UP`);
    expect(s.app).toMatchObject({ selected: { line: 0, part: "result" } });
    expect(indicators(s)).toEqual(["deg", "up", "down"]);
    s = run("ENTER", s);
    expect(entry(s)).toBe("5/6");
    expect(s.editor.row[0]?.t).toBe("frac");
    expect(last(run("+ 1 FRAC 6 ENTER", s))).toBe("5/6+1/6 = 1");
  });

  it("▲ on to the fraction entry pastes 1/2+1/3 for editing; ▼ walks back to the entry line", () => {
    expect(entry(run(`${base} UP UP UP UP ENTER`))).toBe("1/2+1/3");
    const back = run(`${base} UP UP UP UP DOWN DOWN DOWN DOWN`);
    expect(back.app).toMatchObject({ selected: null });
    expect(indicators(back)).not.toContain("down");
  });

  it("a highlighted line above the screen top scrolls back into view, inverse from the top left", () => {
    // five fraction lines (14 rows each) leave the oldest ones above the screen
    const s = run(`${base} ${"1 FRAC 4 ENTER ".repeat(4)}`);
    expect(lit(s, 0, 0)).toBe(false);
    // 2nd ▲ jumps to the newest entry, a second press to the oldest (TG p.29)
    expect(run("2ND TOP", s).app).toMatchObject({ selected: { line: 5, part: "entry" } });
    const top = run("2ND TOP 2ND TOP", s);
    expect(top.app).toMatchObject({ selected: { line: 0, part: "entry" } });
    expect(lit(top, 0, 0)).toBe(true);
    expect(indicators(top)).toEqual(["deg", "down"]);
  });

  it("2nd ▲ reaches history from a denominator, where ▲ moves to the numerator (GB p.13)", () => {
    const s = run(`${base} 1 FRAC UP`);
    expect(s.app).toMatchObject({ selected: null });
    expect(entry(run("2ND TOP ENTER", run(`${base} 1 FRAC`)))).toBe("1/(2+2)");
    expect(entry(run("2ND TOP 2ND TOP ENTER", run(`${base} 1 FRAC`)))).toBe("1/(1/2+1/3)");
  });
});

describe("◂▸ after results (K §4.16)", () => {
  it("fraction → decimal → fraction; the 13-digit Ans is shown for the way back", () => {
    expect(homeText(run("1 FRAC 3 ENTER TOGGLE TOGGLE"))).toEqual([
      "1/3 = 1/3", "1/3◂▸ = 0.333333333", "0.3333333333333◂▸ = 1/3", "",
    ]);
  });

  it("an integer has no other form: 5◂▸ = 5", () => {
    expect(last(run("2 + 3 ENTER TOGGLE"))).toBe("5◂▸ = 5");
  });

  it("acts on the last result after clear blanks the screen, and after a menu was left", () => {
    expect(last(run("2ND SQRT 8 ENTER CLEAR TOGGLE"))).toBe("2√2◂▸ = 2.828427125");
    expect(last(run("2ND SQRT 8 ENTER PRB CLEAR TOGGLE"))).toBe("2√2◂▸ = 2.828427125");
  });

  it("typed inside an entry it waits for enter; twice in one entry is a SYNTAX error (TG p.30)", () => {
    const s = run("1 FRAC 4 RIGHT + 1 FRAC 4 RIGHT TOGGLE");
    expect(entry(s)).toBe("1/4+1/4◂▸");
    expect(last(run("ENTER", s))).toBe("1/4+1/4◂▸ = 0.5");
    expect(run("1 + 2 TOGGLE TOGGLE ENTER").app).toMatchObject({ kind: "error", error: "SYNTAX" });
  });

  it("Ans takes the toggled value: ◂▸ then × 2 works on the decimal", () => {
    expect(last(run("1 FRAC 4 ENTER TOGGLE * 2 ENTER"))).toBe("Ans*2 = 0.5");
  });
});

describe("enter on an empty line repeats the last entry (K §4.6)", () => {
  it("three enters give three lines; clear blanks the screen and enter still repeats", () => {
    let s = run("7 * 6 ENTER ENTER ENTER");
    expect(lines(s)).toEqual(["7*6 = 42", "7*6 = 42", "7*6 = 42"]);
    s = run("CLEAR ENTER", s);
    expect(view(s).screen).toMatchObject({ firstShown: 3 });
    expect(last(s)).toBe("7*6 = 42");
  });

  it("re-evaluates with the current variables and Ans", () => {
    const s = run("2 STO VAR ENTER VAR + 1 ENTER 10 STO VAR ENTER UP×4 ENTER ENTER");
    expect(lines(s)).toEqual(["2→x = 2", "x+1 = 3", "10→x = 10", "x+1 = 11"]);
    expect(lines(run("5 ENTER + 1 ENTER ENTER ENTER"))).toEqual(["5 = 5", "Ans+1 = 6", "Ans+1 = 7", "Ans+1 = 8"]);
  });

  it("does nothing with no history; an entry that failed is not repeated", () => {
    expect(run("ENTER").history).toHaveLength(0);
    const s = run("3 + 3 ENTER 1 / 0 ENTER CLEAR CLEAR ENTER");
    expect(lines(s)).toEqual(["3+3 = 6", "3+3 = 6"]);
  });

  it("re-runs a ◂▸ line in a new mode: FIX 3 gives √2◂▸ = 1.414", () => {
    expect(last(run(`2ND SQRT 2 ENTER TOGGLE ${MODE.FIX(3)} ENTER`))).toBe("√2◂▸ = 1.414");
  });
});

describe("errors and recovery (K §7)", () => {
  it("DIVIDE BY 0: only clear leaves; the entry comes back for correcting; history and Ans untouched", () => {
    const err = run("4 ENTER 1 / 0 ENTER");
    expect(screenLines(err)).toEqual(["DIVIDE BY 0"]);
    expect(run("5 ENTER UP", err)).toEqual(err);
    const back = run("CLEAR", err);
    expect(entry(back)).toBe("1÷0");
    expect(back.history).toHaveLength(1);
    expect(back.ans.re).toBe(4);
    expect(last(run("DELETE 2 ENTER", back))).toBe("1÷2 = 0.5");
  });

  it("SYNTAX: fix the entry after clear and evaluate", () => {
    const s = run("2 + * 3 ENTER");
    expect(screenLines(s)).toEqual(["SYNTAX"]);
    expect(last(run("CLEAR LEFT LEFT DELETE ENTER", s))).toBe("2+3 = 5");
  });

  it("DOMAIN, OVERFLOW; 2nd quit leaves an error for a blank Home", () => {
    expect(screenLines(run("LOG 0 ) ENTER"))).toEqual(["DOMAIN"]);
    expect(screenLines(run("10 POWER 100 ENTER"))).toEqual(["OVERFLOW"]);
    const q = run("1 + 1 ENTER 1 / 0 ENTER 2ND QUIT");
    expect(view(q).screen).toMatchObject({ kind: "home", firstShown: 1 });
    expect(entry(q)).toBe("");
  });

  it("an error inside an app returns to it: STAT on empty lists, back to the wizard", () => {
    const s = run("2ND STAT 1 DOWN DOWN ENTER");
    expect(screenLines(s)).toEqual(["STAT"]);
    expect(run("CLEAR", s).app.kind).toBe("statWizard");
  });

  it("an error while K is on: K=÷0 gives DIVIDE BY 0, clear returns with K still on", () => {
    const s = run("2ND K / 0 ENTER 5 ENTER");
    expect(screenLines(s)).toEqual(["DIVIDE BY 0"]);
    const back = run("CLEAR", s);
    expect(indicators(back)).toContain("k");
    expect(last(run("CLEAR 2ND K 5 ENTER", back))).toBe("5 = 5");
  });
});

describe("CLASSIC ↔ MATHPRINT clears history and K (K §2.2, TG p.35)", () => {
  it("history and K go; Ans, variables and lists stay; the screen is blank and ▲ finds nothing", () => {
    let s = run("4 STO VAR ENTER 2ND K * 2 ENTER 3 ENTER DATA 9 DOWN 2ND QUIT");
    expect(s.history).toHaveLength(2);
    s = run(MODE.CLASSIC, s);
    expect(s.history).toEqual([]);
    expect(s.apps.constant).toBeNull();
    expect(indicators(s)).toEqual(["deg"]);
    expect(homeText(s)).toEqual([""]);
    expect(run("UP", s).app).toMatchObject({ selected: null });
    expect(s.vars.x.re).toBe(4);
    expect(s.apps.lists[0].map((v) => v.re)).toEqual([9]);
    expect(last(run("+ 1 ENTER", s))).toBe("Ans+1 = 7");
  });

  it("selecting the current display mode again changes nothing", () => {
    const s = run(`1 + 1 ENTER ${MODE.MATHPRINT}`);
    expect(lines(s)).toEqual(["1+1 = 2"]);
  });

  it("Classic results come back in Classic forms after the switch; MathPrint ones after switching back", () => {
    let s = run(`${MODE.CLASSIC} 1 FRAC 2 + 1 FRAC 3 ENTER`);
    expect(lines(s)).toEqual(["1⁄2+1⁄3 = 5⁄6"]);
    s = run(`${MODE.MATHPRINT} 1 FRAC 2 RIGHT + 1 FRAC 3 ENTER`, s);
    expect(lines(s)).toEqual(["1/2+1/3 = 5/6"]);
  });
});

describe("sto▸ and recall (K §3.7–§3.10)", () => {
  it("the variable key cycles x y z t a b c and wraps; each store lands in its variable", () => {
    const keys = ["VAR", "VAR VAR", "VAR VAR VAR", "VAR×4", "VAR×5", "VAR×6", "VAR×7"];
    let s = run("");
    keys.forEach((k, i) => (s = run(`${i + 1} STO ${k} ENTER`, s)));
    expect(Object.values(s.vars).map((v) => v.re)).toEqual([1, 2, 3, 4, 5, 6, 7]);
    expect(entry(run("VAR×8", s))).toBe("x");
  });

  it("Recall Var lists all seven, scrolling to 7:c; enter pastes the value", () => {
    let s = run("1 STO VAR ENTER 7 STO VAR×7 ENTER 2ND RECALL DOWN×6");
    expect(screenLines(s)).toEqual(["Recall Var", "5↑a=0", "6:b=0", "7:c=7"]);
    expect(highlighted(s)).toEqual(["Recall Var", "7:"]);
    s = run("ENTER", s);
    expect(entry(s)).toBe("7");
  });

  it("a stored fraction keeps its exact value; recall pastes it as a stacked fraction", () => {
    let s = run("1 FRAC 3 RIGHT STO VAR ENTER");
    expect(last(s)).toBe("1/3→x = 1/3");
    const menu = run("2ND RECALL", s);
    expect(screenLines(menu)[1]).toBe("1:ẋ=1⁄3");
    s = run("ENTER * 3 ENTER", menu);
    expect(last(s)).toBe("1/3*3 = 1");
  });

  it("recall pastes at the cursor inside a template: √( recalled )", () => {
    const s = run("49 STO VAR ENTER 2ND SQRT 2ND RECALL ENTER ENTER");
    expect(last(s)).toBe("√(49) = 7");
  });

  it("clear var zeroes every variable; No keeps them", () => {
    const s = run("5 STO VAR ENTER");
    expect(run("2ND CLEAR_VAR 2", s).vars.x.re).toBe(5);
    expect(screenLines(run("2ND CLEAR_VAR 1 2ND RECALL", s))[1]).toBe("1:ẋ=0");
  });

  it("variables, Ans and history survive off/on", () => {
    const s = run("5 STO VAR ENTER 2ND OFF ON");
    expect(s.vars.x.re).toBe(5);
    expect(last(run("VAR * 2 ENTER", s))).toBe("x*2 = 10");
    expect(run("UP", s).app).toMatchObject({ selected: { line: 0, part: "result" } });
  });
});

describe("the constant K (K §3.12)", () => {
  it("a fraction in K: K=+1/2, 1 → 1+1/2 = 3/2", () => {
    expect(last(run("2ND K + 1 FRAC 2 ENTER 1 ENTER"))).toBe("1+1/2 = 3/2");
  });

  it("K survives off/on with its indicator; reset clears it", () => {
    let s = run("2ND K * 3 ENTER 2ND OFF ON");
    expect(indicators(s)).toContain("k");
    expect(last(run("2 ENTER", s))).toBe("2*3 = 6");
    s = run("2ND RESET 2 CLEAR", s);
    expect(s.apps.constant).toBeNull();
    expect(last(run("2 ENTER", s))).toBe("2 = 2");
  });

  it("editing the stored constant: 2nd K twice shows it with the cursor on its first character", () => {
    const s = run("2ND K * 2 + 3 ENTER 2ND K 2ND K");
    expect(screenLines(s)).toEqual(["K= *2+3"]);
    expect(view(s).screen).toMatchObject({ cursor: { x: 13 } });
    expect(screenLines(run("RIGHT RIGHT RIGHT 5", s))).toEqual(["K= *2+5"]);
  });

  it("a combination over 47 characters is an EQUATION LENGTH ERROR (GB p.37)", () => {
    const s = run(`2ND K ${"+ 1 ".repeat(20)}ENTER ${"1 ".repeat(8)}ENTER`);
    expect(screenLines(s)).toEqual(["EQUATION LENGTH", "ERROR"]);
  });
});

describe("function table value formats (TG p.97 notes)", () => {
  const ask = "TABLE VAR ENTER DOWN DOWN RIGHT ENTER DOWN ENTER";

  it("Ask-x: 2π shows as 2π, 2.0π as 6.28319, a fraction as a fraction", () => {
    expect(screenLines(run(`${ask} 2 PI ENTER`))[1]).toBe("2π 6.283185307");
    expect(screenLines(run(`${ask} 2 PI ENTER UP`)).at(-1)).toBe("ẋ=2π");
    expect(missingGlyphs("menu", "2π")).toEqual([]);
    expect(screenLines(run(`${ask} 2.0 PI ENTER`))[1]).toBe("6.28319 6.283185307");
    expect(screenLines(run(`${ask} 1 FRAC 2 ENTER`))[1]).toBe("1⁄2 1⁄2");
  });

  it("a decimal step forces decimal y values; an integer step keeps fractions", () => {
    const f = "TABLE VAR FRAC 2 ENTER DOWN CLEAR";
    expect(screenLines(run(`${f} 1 DOWN DOWN ENTER`)).slice(1, 4)).toEqual(["0 0", "1 1⁄2", "2 1"]);
    expect(screenLines(run(`${f} .5 DOWN DOWN ENTER`)).slice(1, 4)).toEqual(["0 0", "0.5 0.25", "1 0.5"]);
  });
});

describe("reset (K §3.11)", () => {
  const busy = `${MODE.SCI} ${MODE.RAD} 2ND K * 2 ENTER 3 ENTER 5 STO VAR ENTER DATA 9 DOWN 2ND STAT 1 DOWN DOWN ENTER 2ND QUIT`;

  it("No returns to the screen it came from, with the pending entry and everything kept", () => {
    const s = run(`${busy} 4 + 2ND RESET 1`);
    expect(entry(s)).toBe("4+");
    expect(s.modes).toMatchObject({ notation: "SCI", angle: "RAD" });
  });

  it("Yes: MEMORY CLEARED with DEG only; clear gives an empty Home with nothing left", () => {
    let s = run(`${busy} 2ND RESET 2`);
    expect(screenLines(s)).toEqual(["MEMORY CLEARED"]);
    expect(indicators(s)).toEqual(["deg"]);
    s = run("CLEAR", s);
    expect(homeText(s)).toEqual([""]);
    expect(s.modes).toEqual({ angle: "DEG", notation: "NORM", decimals: "FLOAT", display: "MATHPRINT" });
    expect(s.history).toEqual([]);
    expect(s.vars.x.re).toBe(0);
    expect(s.ans.re).toBe(0);
    expect(s.apps.lists).toEqual([[], [], []]);
    expect(s.apps.constant).toBeNull();
    expect(s.apps.stat).toBeNull();
    expect(screenLines(run("2ND STAT", s))).toEqual(["STATS", "1:1-Var Stats", "2:2-Var Stats"]);
    expect(run("UP", s).app).toMatchObject({ selected: null });
  });

  it("from the data editor too; a key after MEMORY CLEARED starts a new entry", () => {
    const s = run(`${busy} DATA 2ND RESET 2 7`);
    expect(entry(s)).toBe("7");
    expect(s.apps.lists).toEqual([[], [], []]);
  });
});

describe("open questions: no TI evidence settles these (SPEC: assumption in the engine)", () => {
  it.todo("↓ after enter: 48 captures light it (GS_mem05, GS_order01), others in the same situation do not (GS_mem03, GS_scroll04); the engine never lights it after enter, so captures.test.ts does not compare ↓ on Home");
  it.todo("long-entry scrolling: the engine keeps the smallest scroll that shows the cursor, so ◀ from the end scrolls back at once; whether the TI window sticks until the cursor reaches its edge is undocumented");
  it.todo("◂▸ with no history at all: the engine types 0◂▸ into the entry; the guidebook never shows it");
  it.todo("a cut history entry: the eGuide captures draw ▶ in cell 15 (MF_StAngle08/09, followed here), the older TG p.77 screen shows 16 characters and no ▶");
});
