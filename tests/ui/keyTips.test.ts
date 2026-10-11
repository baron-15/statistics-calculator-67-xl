import { describe, expect, it } from "vitest";
import { ALL_KEYS, KEY_BY_ID, runScript, view, type KeyId } from "../../src/engine";
import { keyboardKeys } from "../../src/ui/KeyTip";
import { secondDescription } from "../../src/ui/Keypad";
import { KEY_TIPS, SECOND_TIPS, type LegendSecondFn, type Tip } from "../../src/ui/keyTips";
import { homeText } from "../helpers/run";

/** Every 2nd function printed above a key (2nd + arrow has no legend; the arrow tips cover it). */
const LEGEND_SECONDS = ALL_KEYS.flatMap((k) => (k.second?.label ? [k.second.fn as LegendSecondFn] : []));
const ARROWS: KeyId[] = ["UP", "DOWN", "LEFT", "RIGHT"];

function expectUseful(tip: Tip | undefined, what: string) {
  expect(tip, what).toBeDefined();
  expect(tip!.name.trim().length, `${what} name`).toBeGreaterThanOrEqual(2);
  expect(tip!.does.trim().length, `${what} does`).toBeGreaterThanOrEqual(30);
  expect(tip!.does, `${what} does`).toMatch(/\.$/);
  expect(tip!.example.trim().length, `${what} example`).toBeGreaterThanOrEqual(5);
  expect(tip!.example, `${what} example`).toMatch(/→/);
}

describe("key tips content", () => {
  it("explains every key", () => {
    expect(ALL_KEYS).toHaveLength(45);
    for (const spec of ALL_KEYS) expectUseful(KEY_TIPS[spec.id], spec.id);
    expect(Object.keys(KEY_TIPS).sort()).toEqual(ALL_KEYS.map((k) => k.id).sort());
  });

  it("explains every 2nd function with a printed legend", () => {
    expect(LEGEND_SECONDS).toHaveLength(26);
    for (const fn of LEGEND_SECONDS) expectUseful(SECOND_TIPS[fn], fn);
    expect(Object.keys(SECOND_TIPS).sort()).toEqual([...LEGEND_SECONDS].sort());
  });

  it("describes the 2nd + arrow jumps on the arrow tips", () => {
    for (const id of ARROWS) expect(KEY_TIPS[id].does, id).toMatch(/2nd [▲▼◄►]/);
    expect(KEY_TIPS.LEFT.does).toMatch(/start of the entry/);
    expect(KEY_TIPS.RIGHT.does).toMatch(/end of the entry/);
  });

  it("covers the behaviours people trip over", () => {
    expect(KEY_TIPS["5"].does).toMatch(/unless 2nd insert/);
    expect(KEY_TIPS.ADD.does).toMatch(/Ans/);
    expect(KEY_TIPS.TOGGLE.does).toMatch(/fraction and decimal.*√.*π/);
    expect(KEY_TIPS.VAR.does).toContain("x→y→z→t→a→b→c");
    expect(KEY_TIPS.CLEAR.does).toMatch(/cursor to the right/);
    expect(KEY_TIPS.DATA.does).toMatch(/3-list editor/);
    expect(SECOND_TIPS.QUIT.does).toMatch(/Returns home/);
  });

  it("never names the manufacturer", () => {
    const all = [...Object.values(KEY_TIPS), ...Object.values(SECOND_TIPS)].flatMap((t) => [t.name, t.does, t.example]);
    for (const text of all) expect(text).not.toMatch(/Texas Instruments|\bTI\b/);
  });
});

/** The last evaluated line, "entry = result", after a keystroke script. */
function lastLine(script: string): string {
  const lines = homeText(runScript(script));
  return lines.at(-2) ?? "";
}

describe("key tip examples match the emulator", () => {
  // [tip, keystroke script, last history line]
  const cases: [string, string, string][] = [
    ["2ND", "2ND SQRT 25 ENTER", "√(25) = 5"],
    ["MODE", "MODE DOWN RIGHT ENTER CLEAR 12345 ENTER", "12345 = 1.2345*10^4"],
    ["UP", "1 + 1 ENTER UP UP ENTER + 3 ENTER", "1+1+3 = 5"],
    ["DOWN", "n/d 3 DOWN 4 RIGHT ENTER", "3/4 = 3/4"],
    ["RIGHT", "5 ^ 2 RIGHT + 4 ENTER", "5^2+4 = 29"],
    ["LOG", "LOG 100 ) ENTER", "log(100) = 2"],
    ["PRB", "8 PRB 1 3 ENTER", "8 nPr 3 = 336"],
    ["LN", "LN 5 ) × 2 ENTER", "ln(5)*2 = 3.218875825"],
    ["FRAC", "n/d 1 DOWN 2 RIGHT + n/d 1 DOWN 3 RIGHT ENTER", "1/2+1/3 = 5/6"],
    ["EE", "2 EE 5 ENTER", "2*10^5 = 200000"],
    ["PI", "2 × π ENTER TOGGLE", "2π◂▸ = 6.283185307"],
    ["SIN", "SIN 30 ) ENTER", "sin(30) = 1/2"],
    ["COS", "5 × COS 60 ) ENTER", "5*cos(60) = 5/2"],
    ["TAN", "TAN 45 ) ENTER", "tan(45) = 1"],
    ["DIVIDE", "225 ENTER ÷ 4 ENTER", "Ans÷4 = 56.25"],
    ["POWER", "5 ^ 2 RIGHT + 4 ^ ( 2 + 1 ) ENTER", "5^2+4^((2+1)) = 89"],
    ["RECIP", "2 RECIP ENTER", "2⁻¹ = 1/2"],
    ["LPAREN", "4 ( 2 + 3 ) ENTER", "4(2+3) = 20"],
    ["RPAREN", "( 2 + 3 ) x² ENTER", "(2+3)² = 25"],
    ["MULTIPLY", "3 × 3 ENTER × 3 ENTER", "Ans*3 = 27"],
    ["SQUARE", "3 x² + 4 x² ENTER", "3²+4² = 25"],
    ["7", "7 + 7 ENTER", "7+7 = 14"],
    ["SUBTRACT", "7 − (−) 3 ENTER", "7−⁻3 = 10"],
    ["VAR", "4 STO VAR VAR ENTER", "4→y = 4"],
    ["ADD", "1 + 1 ENTER + 3 ENTER", "Ans+3 = 5"],
    ["STO", "15 STO VAR ENTER", "15→x = 15"],
    ["TOGGLE", "2ND SQRT 8 ENTER TOGGLE", "2√2◂▸ = 2.828427125"],
    ["DOT", "n/d 1.2 + 1.3 DOWN 4 ENTER", "(1.2+1.3)/4 = 0.625"],
    ["NEG", "60 + 5 × (−) 12 ENTER", "60+5*⁻12 = 0"],
    ["ENTER", "4 ( 2 + 3 ENTER", "4(2+3 = 20"],
    ["TEN_X", "2ND TEN_X LOG 2 ) ENTER", "10^(log(2)) = 2"],
    ["ANGLE", "1.5 2ND ANGLE 6 ENTER", "1.5▸DMS = 1°30′0″"],
    ["E_X", "2ND E_X .5 ENTER", "e^(.5) = 1.648721271"],
    ["MIXED", "4 2ND MIXED 5 DOWN 9 ENTER", "4⌴5/9 = (41)/9"],
    ["FRAC_CONV", "9 n/d 2 RIGHT 2ND FRAC_CONV ENTER", "9/2▸n/d◂▸Un/d = 4⌴1/2"],
    ["F_D", "2.25 2ND F_D ENTER", "2.25▸F◂▸D = 9/4"],
    ["HYP", "2ND HYP SIN 5 ) + 2 ENTER", "sinh(5)+2 = 76.20321058"],
    ["ASIN", "2ND ASIN .5 ) ENTER", "sin⁻¹(.5) = 30"],
    ["ACOS", "2ND ACOS .5 ) ENTER", "cos⁻¹(.5) = 60"],
    ["ATAN", "2ND ATAN 1 ) ENTER", "tan⁻¹(1) = 45"],
    ["K", "2ND K × 2 + 3 ENTER 4 ENTER", "4*2+3 = 11"],
    ["NTH_ROOT", "3 2ND NTH_ROOT 64 ENTER", "3ˣ√(64) = 4"],
    ["PERCENT", "2 2ND PERCENT × 150 ENTER", "2%*150 = 3"],
    ["TO_PERCENT", "1 n/d 5 RIGHT 2ND TO_PERCENT ENTER", "1/5▸% = 20%"],
    ["SQRT", "2ND SQRT 8 ENTER", "√8 = 2√2"],
    ["RECALL", "15 STO VAR ENTER 2ND RECALL ENTER x² ENTER", "15² = 225"],
    ["COMMA", "2ND ANGLE RIGHT 1 3 2ND COMMA 4 ) ENTER", "R▸Pr(3,4) = 5"],
    ["ANS", "16 ENTER 2ND SQRT 2ND ANS ENTER", "√Ans = 4"],
  ];
  it.each(cases)("%s: %s", (_tip, script, expected) => {
    expect(lastLine(script)).toBe(expected);
  });

  it("shows the edits the editing examples describe", () => {
    const entry = (script: string) => homeText(runScript(script)).at(-1);
    expect(entry("1 2 3 LEFT LEFT DELETE")).toBe("13"); // delete
    expect(entry("1 2 LEFT 3")).toBe("13"); // ◄, overwrite
    expect(entry("2 1 5 9 5 LEFT LEFT CLEAR")).toBe("215"); // clear to the right
    expect(entry("1 2 LEFT 2ND INSERT 3")).toBe("132"); // 2nd insert
  });

  it("opens the screens the menu examples describe", () => {
    const texts = (script: string) => {
      const s = view(runScript(script)).screen;
      return s.kind === "canvas" ? s.items.flatMap((i) => (i.t === "text" ? [i.text] : [])) : [];
    };
    expect(texts("DATA DATA 4 45 DOWN 55 DOWN 55 DOWN 55 ENTER")).toContain("L1(5)=");
    expect(texts("DATA DATA 4 45 DOWN 55 DOWN 55 DOWN 55 ENTER 2ND STAT 1 DOWN DOWN ENTER")).toEqual(
      expect.arrayContaining(["1-Var:L1,One", "1:n=4"]),
    );
    expect(texts("TABLE VAR ( 36 − VAR ) ENTER CLEAR 15 DOWN CLEAR 3 DOWN DOWN ENTER")).toEqual(
      expect.arrayContaining(["15", "315", "18", "324", "21"]),
    );
    expect(texts("2ND RESET 2")).toContain("MEMORY CLEARED");
    expect(view(runScript("DATA 2ND QUIT")).screen.kind).toBe("home");
  });
});

describe("key descriptions and shortcuts", () => {
  it("describes each key's 2nd function for screen readers", () => {
    expect(secondDescription(KEY_BY_ID.MODE)).toBe("2nd: quit");
    expect(secondDescription(KEY_BY_ID.LOG)).toBe("2nd: 10ˣ, Ten to the power");
    expect(secondDescription(KEY_BY_ID.LEFT)).toBe("2nd: start of entry");
    expect(secondDescription(KEY_BY_ID.CLEAR)).toBeNull();
    for (const spec of ALL_KEYS) if (spec.second) expect(secondDescription(spec), spec.id).toMatch(/^2nd: \S/);
  });

  it("lists the computer keys readably", () => {
    expect(keyboardKeys("2ND")).toEqual(["Q"]);
    expect(keyboardKeys("DELETE")).toEqual(["Backspace", "Delete"]);
    expect(keyboardKeys("UP")).toEqual(["↑"]);
    expect(keyboardKeys("CLEAR")).toEqual(["Esc"]);
  });
});
