/**
 * Every worked example of docs/research/math-stats.md §10 (guidebook GB19, GB06, teacher guide TG,
 * TI knowledge base KB), driven end to end: a fresh calculator, the printed keystrokes through
 * runScript only, and assertions on what the screen shows (home text "entry = result" in order,
 * canvas text lines and highlights for menus and apps). Pixel comparisons with the TI-SmartView
 * captures are in captures.test.ts.
 *
 * Text conventions are rowText's: MathPrint fractions read "n/d" with multi-node parts in
 * parentheses ("(41)/9"), roots "√(58)" / "3ˣ√(64)", powers "2^5" / "10^(⁻2)", ×10ⁿ "*10^4";
 * Classic fractions "7⁄3", mixed numbers "4⌴1⁄2"; minutes and seconds ′ ″; memory variables in menus
 * ẋ ẏ ż (the renderer's script glyphs); the raised "=" of some StatVars "≡".
 *
 * Carried-over state: a row marked ↳ in M §10 continues from the row above, so each test runs a
 * whole chain. Where the guidebook implies state from an earlier page (data entered for the STATS
 * menu, a mode left set) the test reproduces it with keystrokes and says so. Mode changes use the
 * guidebook's own keystrokes (the MODE scripts in helpers.ts); where a page omits the [clear] that
 * leaves the mode screen, the test adds it and says so.
 */
import { describe, expect, it } from "vitest";
import { view } from "../../src/engine";
import { entry, highlighted, homeText, indicators, last, lines, lit, MODE, run, screenLines } from "./helpers";

const lastN = (s: Parameters<typeof homeText>[0], n: number) => lines(s).slice(-n);

// ================================================================================================
// 10.1 Guidebook GB19
// ================================================================================================

describe("GB p.2–8: getting started, modes and history", () => {
  it("GB-001 p.2: √25 → 5", () => {
    expect(last(run("2ND SQRT 25 ENTER"))).toBe("√(25) = 5");
  });

  it("GB-002 p.3: Classic SCI, 12345 → 1.2345*10^4 on the next line, inline ^", () => {
    const s = run(`${MODE.CLASSIC} ${MODE.SCI} 12345 ENTER`);
    expect(homeText(s)).toEqual(["12345 = 1.2345*10^4", ""]);
    expect(s.history[0]?.result.some((n) => n.t === "sym" && n.s === "caret")).toBe(true);
    expect(indicators(s)).toContain("sci");
  });

  it("GB-003 p.3: MathPrint SCI, 12345 → 1.2345*10⁴ (×10ⁿ superscript)", () => {
    const s = run(`${MODE.SCI} 12345 ENTER`);
    expect(homeText(s)).toEqual(["12345 = 1.2345*10^4", ""]);
    expect(s.history[0]?.result.at(-1)?.t).toBe("ee");
  });

  it("GB-004 p.3: Classic 1⁄8 → 1⁄8; ◂▸ adds 1⁄8◂▸ → 0.125", () => {
    const s = run(`${MODE.CLASSIC} 1 FRAC 8 ENTER TOGGLE`);
    expect(homeText(s)).toEqual(["1⁄8 = 1⁄8", "1⁄8◂▸ = 0.125", ""]);
  });

  it("GB-005 p.3: MathPrint 1/8 → 1/8; ◂▸ → 0.125", () => {
    const s = run("1 FRAC 8 ENTER TOGGLE");
    expect(homeText(s)).toEqual(["1/8 = 1/8", "1/8◂▸ = 0.125", ""]);
  });

  it("GB-006 p.4: Classic FIX 2, 2π → 6.28", () => {
    const s = run(`${MODE.CLASSIC} ${MODE.FIX(2)} 2 PI ENTER`);
    expect(last(s)).toBe("2π = 6.28");
    expect(indicators(s)).toContain("fix");
  });

  it("GB-007 p.4: MathPrint FIX 2, 2π → 2π (exact ignores FIX); ◂▸ → 6.28", () => {
    const s = run(`${MODE.FIX(2)} 2 PI ENTER TOGGLE`);
    expect(homeText(s)).toEqual(["2π = 2π", "2π◂▸ = 6.28", ""]);
  });

  it("GB-008 p.4: Classic 4⌴5⁄9 → 41⁄9", () => {
    expect(last(run(`${MODE.CLASSIC} 4 2ND MIXED 5 FRAC 9 ENTER`))).toBe("4⌴5⁄9 = 41⁄9");
  });

  it("GB-009 p.4: MathPrint 4 5/9 → 41/9", () => {
    expect(last(run("4 2ND MIXED 5 DOWN 9 ENTER"))).toBe("4⌴5/9 = (41)/9");
  });

  it("GB-010 p.4: Classic 2^5 → 32", () => {
    const s = run(`${MODE.CLASSIC} 2 POWER 5 ENTER`);
    expect(last(s)).toBe("2^5 = 32");
    expect(s.history[0]?.entry.some((n) => n.t === "sym" && n.s === "caret")).toBe(true);
  });

  it("GB-011 p.4: MathPrint 2⁵ → 32", () => {
    const s = run("2 POWER 5 ENTER");
    expect(last(s)).toBe("2^5 = 32");
    expect(s.history[0]?.entry[1]?.t).toBe("pow");
  });

  it("GB-012 p.4: Classic √(2) → 1.414213562 on the next line", () => {
    // the printed keys omit [)]; the screen (GS_modeclasssqrt) shows √(2) with the result on the
    // next line (4+11 cells), and Classic keeps an unclosed √( as typed (TG-11a), so the screen wins
    expect(last(run(`${MODE.CLASSIC} 2ND SQRT 2 ) ENTER`))).toBe("√(2) = 1.414213562");
    expect(last(run(`${MODE.CLASSIC} 2ND SQRT 2 ENTER`))).toBe("√(2 = 1.414213562");
  });

  it("GB-013 p.4: MathPrint √2 → √2; ◂▸ → 1.414213562", () => {
    expect(homeText(run("2ND SQRT 2 ENTER TOGGLE"))).toEqual(["√2 = √2", "√2◂▸ = 1.414213562", ""]);
  });

  it("GB-014 p.4: Classic 3ˣ√64 → 4", () => {
    expect(last(run(`${MODE.CLASSIC} 3 2ND NTH_ROOT 64 ENTER`))).toBe("3ˣ√64 = 4");
  });

  it("GB-015 p.4: MathPrint ³√64 → 4", () => {
    expect(last(run("3 2ND NTH_ROOT 64 ENTER"))).toBe("3ˣ√(64) = 4");
  });

  it("GB-016 p.6–7: 1+1 … 4+4; ▲×4 enter pastes 3+3; + 2 → 8", () => {
    let s = run("1 + 1 ENTER 2 + 2 ENTER 3 + 3 ENTER 4 + 4 ENTER");
    expect(homeText(s)).toEqual(["1+1 = 2", "2+2 = 4", "3+3 = 6", "4+4 = 8", ""]);
    s = run("UP UP UP UP ENTER", s);
    expect(entry(s)).toBe("3+3");
    s = run("+ 2 ENTER", s);
    expect(last(s)).toBe("3+3+2 = 8");
  });

  it("GB-017 p.7: √8 → 2√2; ◂▸ → 2.828427125 on the next line", () => {
    expect(homeText(run("2ND SQRT 8 ENTER TOGGLE"))).toEqual(["√8 = 2√2", "2√2◂▸ = 2.828427125", ""]);
  });

  it("GB-018 p.7–8: 3*3 → 9; × 3 → Ans*3 = 27; 3 ˣ√ Ans → 3", () => {
    const s = run("3 * 3 ENTER * 3 ENTER 3 2ND NTH_ROOT 2ND ANS ENTER");
    expect(homeText(s)).toEqual(["3*3 = 9", "Ans*3 = 27", "3ˣ√Ans = 3", ""]);
  });

  it("GB-019 p.8: Classic 2^3^2 → 64 (left to right)", () => {
    expect(last(run(`${MODE.CLASSIC} 2 POWER 3 POWER 2 ENTER`))).toBe("2^3^2 = 64");
  });

  it("GB-020 p.8: MathPrint 2^3^2 → 512 (right to left)", () => {
    expect(last(run("2 POWER 3 POWER 2 ENTER"))).toBe("2^(3^2) = 512");
  });
});

describe("GB p.9: order of operations", () => {
  it("GB-021: 60+5*⁻12 → 0", () => expect(last(run("60 + 5 * NEG 12 ENTER"))).toBe("60+5*⁻12 = 0"));
  it("GB-022: 1+⁻8+12 → 5", () => expect(last(run("1 + NEG 8 + 12 ENTER"))).toBe("1+⁻8+12 = 5"));
  it("GB-023: √(9+16) → 5 (the bar spans 9+16)", () => expect(last(run("2ND SQRT 9 + 16 ENTER"))).toBe("√(9+16) = 5"));
  it("GB-024: 4*(2+3) → 20", () => expect(last(run("4 * ( 2 + 3 ) ENTER"))).toBe("4*(2+3) = 20"));
  it("GB-025: 4(2+3) → 20 (implied ×)", () => expect(last(run("4 ( 2 + 3 ) ENTER"))).toBe("4(2+3) = 20"));
  it("GB-026: √(3²+4²) → 5, ► leaves the exponent", () => {
    expect(last(run("2ND SQRT 3 POWER 2 RIGHT + 4 POWER 2 ENTER"))).toBe("√(3^2+4^2) = 5");
  });
});

describe("GB p.10–12: memory and stored variables", () => {
  it("GB-027 p.10: 2nd clear var shows Clear Var / 1:Yes / 2:No; 1 clears every variable", () => {
    const menu = run("15 STO VAR ENTER 2ND CLEAR_VAR");
    expect(screenLines(menu)).toEqual(["Clear Var", "1:Yes", "2:No"]);
    expect(highlighted(menu)).toEqual(["Clear Var", "1:"]);
    expect(run("1", menu).vars.x.re).toBe(0);
  });

  // GB-028 – GB-031 are one session on p.10–11, after GB-027 cleared the variables
  const gb028 = "2ND CLEAR_VAR 1 15 STO VAR ENTER";
  const gb029 = `${gb028} 2ND RECALL ENTER SQUARE ENTER`;
  const gb030 = `${gb029} STO VAR VAR ENTER`;

  it("GB-028 p.10: 15 sto▸ x shows 15→x; enter stores it → 15", () => {
    const s = run("2ND CLEAR_VAR 1 15 STO VAR");
    expect(entry(s)).toBe("15→x");
    expect(homeText(run("ENTER", s))).toEqual(["15→x = 15", ""]);
  });

  it("GB-029 p.10–11: Recall Var lists x=15 y=0 z=0; enter pastes the value; x² → 225", () => {
    const menu = run(`${gb028} 2ND RECALL`);
    expect(screenLines(menu)).toEqual(["Recall Var", "1:ẋ=15", "2:ẏ=0", "3↓ż=0"]);
    expect(highlighted(menu)).toEqual(["Recall Var", "1:"]);
    expect(last(run("ENTER SQUARE ENTER", menu))).toBe("15² = 225");
  });

  it("GB-030 p.11: sto▸ first inserts Ans; the variable key cycles x → y: Ans→y → 225", () => {
    const s = run(`${gb029} STO VAR VAR`);
    expect(entry(s)).toBe("Ans→y");
    expect(last(run("ENTER", s))).toBe("Ans→y = 225");
  });

  it("GB-031 p.11: y → 225; ÷ 4 → Ans÷4 = 56.25", () => {
    let s = run(`${gb030} VAR VAR`);
    expect(entry(s)).toBe("y");
    s = run("ENTER / 4 ENTER", s);
    expect(homeText(s)).toEqual(["15→x = 15", "15² = 225", "Ans→y = 225", "y = 225", "Ans÷4 = 56.25", ""]);
  });

  it("GB-032 p.11–12: ENG volumes; Recall Var in E form; recall pastes the full value", () => {
    let s = run("MODE DOWN RIGHT RIGHT ENTER CLEAR 350 * 560 STO VAR ENTER");
    expect(last(s)).toBe("350*560→x = 196*10^3");
    expect(indicators(s)).toContain("eng");
    s = run("340 * 610 STO VAR VAR ENTER", s);
    expect(last(s)).toBe("340*610→y = 207.4*10^3");
    const menu = run("150 * 2ND RECALL", s);
    expect(screenLines(menu)).toEqual(["Recall Var", "1:ẋ=196ᴇ3", "2:ẏ=207.4ᴇ3", "3↓ż=0ᴇ0"]);
    s = run("ENTER ENTER", menu);
    expect(last(s)).toBe("150*196000 = 29.4*10^6");
    s = run("210 * 2ND RECALL ENTER ENTER", s);
    expect(last(s)).toBe("210*196000 = 41.16*10^6");
    s = run("150 * VAR VAR ENTER", s);
    expect(last(s)).toBe("150*y = 31.11*10^6");
    s = run("210 * VAR VAR ENTER", s);
    expect(last(s)).toBe("210*y = 43.554*10^6");
  });
});

describe("GB p.13–14: fractions", () => {
  it("GB-033 p.13: Classic 3⁄4+1⌴7⁄12 → 7⁄3", () => {
    expect(last(run(`${MODE.CLASSIC} 3 FRAC 4 + 1 2ND MIXED 7 FRAC 12 ENTER`))).toBe("3⁄4+1⌴7⁄12 = 7⁄3");
  });

  it("GB-034 p.14: Classic 9⁄2▸n/d◂▸Un/d → 4⌴1⁄2", () => {
    expect(last(run(`${MODE.CLASSIC} 9 FRAC 2 2ND FRAC_CONV ENTER`))).toBe("9⁄2▸n/d◂▸Un/d = 4⌴1⁄2");
  });

  it("GB-035 p.14: Classic 4⌴1⁄2▸F◂▸D → 4.5", () => {
    expect(last(run(`${MODE.CLASSIC} 4 2ND MIXED 1 FRAC 2 2ND F_D ENTER`))).toBe("4⌴1⁄2▸F◂▸D = 4.5");
  });

  it("GB-036 p.14: MathPrint 3/4 + 1 7/12 → 7/3", () => {
    expect(last(run("FRAC 3 DOWN 4 RIGHT + 1 2ND MIXED 7 DOWN 12 ENTER"))).toBe("3/4+1⌴7/(12) = 7/3");
  });

  it("GB-037 p.14: MathPrint 9/2▸n/d◂▸Un/d → 4 1/2", () => {
    expect(last(run("9 FRAC 2 RIGHT 2ND FRAC_CONV ENTER"))).toBe("9/2▸n/d◂▸Un/d = 4⌴1/2");
  });

  it("GB-038 p.14: MathPrint 4 1/2▸F◂▸D → 4.5", () => {
    expect(last(run("4 2ND MIXED 1 DOWN 2 RIGHT 2ND F_D ENTER"))).toBe("4⌴1/2▸F◂▸D = 4.5");
  });

  it("GB-039 p.14: (1.2+1.3)/4 → 0.625 (a decimal input gives a decimal)", () => {
    expect(last(run("FRAC 1.2 + 1.3 DOWN 4 ENTER"))).toBe("(1.2+1.3)/4 = 0.625");
  });

  it("GB-040 p.14: the quadratic formula (⁻5+√(5²−4(1)(6)))/2(1) → ⁻2", () => {
    const s = run("FRAC NEG 5 + 2ND SQRT 5 SQUARE - 4 ( 1 ) ( 6 ) DOWN 2 ( 1 ) ENTER");
    expect(last(s)).toBe("(⁻5+√(5²−4(1)(6)))/(2(1)) = ⁻2");
  });
});

describe("GB p.14–15: percentages", () => {
  it("GB-041: 2%*150 → 3", () => expect(last(run("2 2ND PERCENT * 150 ENTER"))).toBe("2%*150 = 3"));
  it("GB-042: 1/5▸% → 20%", () => expect(last(run("1 FRAC 5 RIGHT 2ND TO_PERCENT ENTER"))).toBe("1/5▸% = 20%"));
  it("GB-043: 3%*5000 → 150; Ans+2.3%*7300 → 317.9; Ans*280 → 89012", () => {
    const s = run("3 2ND PERCENT * 5000 ENTER + 2.3 2ND PERCENT * 7300 ENTER * 280 ENTER");
    expect(homeText(s)).toEqual(["3%*5000 = 150", "Ans+2.3%*7300 = 317.9", "Ans*280 = 89012", ""]);
  });
});

describe("GB p.15–16 (GB06 p.16): ×10ⁿ", () => {
  it("GB-044: SCI; (2*10³)/(4*10⁵) with ◂▸ typed before enter → 5*10⁻³", () => {
    // the page goes from the mode screen straight to the entry; [clear] leaves the mode screen
    const s = run("MODE DOWN RIGHT ENTER CLEAR FRAC 2 EE 3 DOWN 4 EE 5 RIGHT RIGHT TOGGLE ENTER");
    expect(homeText(s)).toEqual(["(2*10^3)/(4*10^5)◂▸ = 5*10^(⁻3)", ""]);
    expect(indicators(s)).toContain("sci");
  });

  it("GB-045: SCI; (2*10³)÷(4*10⁵) → 5*10⁻³ (parentheses needed, KB 20469)", () => {
    const s = run(`${MODE.SCI} CLEAR ( 2 EE 3 RIGHT ) / ( 4 EE 5 RIGHT ) ENTER`);
    expect(last(s)).toBe("(2*10^3)÷(4*10^5) = 5*10^(⁻3)");
  });

  it("GB06-1: 2*10⁵ → 200000; in SCI, clear enter re-runs it → 2*10⁵", () => {
    let s = run("2 EE 5 ENTER");
    expect(last(s)).toBe("2*10^5 = 200000");
    s = run("MODE DOWN RIGHT ENTER CLEAR ENTER", s);
    expect(homeText(s)).toEqual(["2*10^5 = 200000", "2*10^5 = 2*10^5", ""]);
  });
});

describe("GB p.16–17: powers, roots, inverses; π", () => {
  it("GB-046: 5²+4^(2+1) → 89", () => expect(last(run("5 POWER 2 RIGHT + 4 POWER ( 2 + 1 ) ENTER"))).toBe("5^2+4^((2+1)) = 89"));
  it("GB-047: 10^⁻2 → 1/100", () => expect(last(run("10 POWER NEG 2 ENTER"))).toBe("10^(⁻2) = 1/(100)"));
  it("GB-048: √49 → 7", () => expect(last(run("2ND SQRT 49 ENTER"))).toBe("√(49) = 7"));
  it("GB-049: √(3²+2⁴) → 5", () => expect(last(run("2ND SQRT 3 POWER 2 RIGHT + 2 POWER 4 ENTER"))).toBe("√(3^2+2^4) = 5"));
  it("GB-050: ⁶√64 → 2", () => expect(last(run("6 2ND NTH_ROOT 64 ENTER"))).toBe("6ˣ√(64) = 2"));
  it("GB-051: 2⁻¹ → 1/2", () => expect(last(run("2 RECIP ENTER"))).toBe("2⁻¹ = 1/2"));

  it("GB-052 p.17: 2*π → 2π; ◂▸ → 6.283185307 (same line)", () => {
    expect(homeText(run("2 * PI ENTER TOGGLE"))).toEqual(["2*π = 2π", "2π◂▸ = 6.283185307", ""]);
  });

  it("GB-053 p.17: π*12² → 144π; ◂▸ → 452.3893421 (next line)", () => {
    expect(homeText(run("PI * 12 POWER 2 ENTER TOGGLE"))).toEqual(["π*12^2 = 144π", "144π◂▸ = 452.3893421", ""]);
  });
});

describe("GB p.18–20: the angle menu and DMS", () => {
  it("GB-054 p.18: RAD; sin 30 2nd angle shows DMS R◂▸P; 1 ) enter → sin(30°) = 1/2", () => {
    let s = run("MODE RIGHT ENTER");
    expect(highlighted(s)).toEqual(["RAD", "NORM", "FLOAT", "MATHPRINT"]);
    expect(indicators(s)).toEqual(["rad"]);
    s = run("CLEAR SIN 30 2ND ANGLE", s);
    expect(screenLines(s)).toEqual(["DMS R◂▸P", "1:°", "2:′", "3↓″"]);
    expect(highlighted(s)).toEqual(["DMS", "1:"]);
    s = run("1 ) ENTER", s);
    expect(last(s)).toBe("sin(30°) = 1/2");
  });

  it("GB-055 p.18: back to DEG; 2πʳ → 360", () => {
    const s = run("MODE RIGHT ENTER CLEAR MODE ENTER CLEAR 2 PI 2ND ANGLE 4 ENTER");
    expect(last(s)).toBe("2πʳ = 360");
    expect(indicators(s)).toContain("deg");
  });

  it("GB-056 p.18: 1.5▸DMS → 1°30′0″", () => expect(last(run("1.5 2ND ANGLE 6 ENTER"))).toBe("1.5▸DMS = 1°30′0″"));

  it("GB-057 p.19: FIX 2; 12°31′45″+26°54′38″ → 39.44; ▸DMS inserts the 13-digit Ans → 39°26′23″", () => {
    let s = run("CLEAR MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER");
    expect(highlighted(s)).toEqual(["DEG", "NORM", "2", "MATHPRINT"]);
    expect(indicators(s)).toEqual(["fix", "deg"]);
    s = run("CLEAR 12 2ND ANGLE 1 31 2ND ANGLE 2 45 2ND ANGLE 3 + 26 2ND ANGLE 1 54 2ND ANGLE 2 38 2ND ANGLE 3 ENTER", s);
    expect(last(s)).toBe("12°31′45″+26°54′38″ = 39.44");
    s = run("2ND ANGLE 6 ENTER", s);
    expect(last(s)).toBe("39.43972222221▸DMS = 39°26′23″");
  });

  it("GB-058 p.19: FIX still set; sin(30) → 1/2", () => {
    const s = run(`${MODE.FIX(2)} CLEAR SIN 30 ) ENTER`);
    expect(last(s)).toBe("sin(30) = 1/2");
    expect(indicators(s)).toContain("fix");
  });

  it("GB-059 p.19: RAD; sin(π/6) → 1/2", () => {
    expect(last(run("MODE RIGHT ENTER CLEAR SIN PI FRAC 6 RIGHT ) ENTER"))).toBe("sin(π/6) = 1/2");
  });

  it("GB-060 p.19: RAD; enter picks the highlighted 1:° → sin(30°) = 1/2", () => {
    expect(last(run(`${MODE.RAD} SIN 30 2ND ANGLE ENTER ) ENTER`))).toBe("sin(30°) = 1/2");
  });

  it("GB-061 p.20: DEG; sin(π/6ʳ) → 1/2 (GB06 prints the 4 that GB19 omits)", () => {
    const s = run(`${MODE.RAD} MODE ENTER CLEAR SIN PI FRAC 6 RIGHT 2ND ANGLE 4 ) ENTER`);
    expect(last(s)).toBe("sin(π/6ʳ) = 1/2");
  });
});

describe("GB p.20: rectangular ↔ polar (FIX 1)", () => {
  const fix1 = "CLEAR MODE DOWN DOWN RIGHT RIGHT ENTER";
  const gb062 = `${fix1} CLEAR 2ND ANGLE RIGHT 3 5 2ND COMMA 30 ) ENTER 2ND ANGLE RIGHT 4 5 2ND COMMA 30 ) ENTER`;

  it("GB-062: FIX 1; P▸Rx(5,30) → 4.3, P▸Ry(5,30) → 2.5", () => {
    expect(highlighted(run(fix1))).toEqual(["DEG", "NORM", "1", "MATHPRINT"]);
    expect(homeText(run(gb062))).toEqual(["P▸Rx(5,30) = 4.3", "P▸Ry(5,30) = 2.5", ""]);
  });

  it("GB-063: FIX 1; R▸Pr(3,4) → 5.0 (padded), R▸Pθ(3,4) → 53.1", () => {
    const s = run(`${gb062} 2ND ANGLE RIGHT 1 3 2ND COMMA 4 ) ENTER 2ND ANGLE RIGHT 2 3 2ND COMMA 4 ) ENTER`);
    expect(lines(s).slice(2)).toEqual(["R▸Pr(3,4) = 5.0", "R▸Pθ(3,4) = 53.1"]);
  });
});

describe("GB p.21–22: trigonometry", () => {
  // p.21 starts with "→ FLOAT [mode] [▼] [▼] [enter] [clear]": FIX was left set on p.20
  const gb064 = `${MODE.FIX(1)} MODE DOWN DOWN ENTER CLEAR TAN 45 ) ENTER`;

  it("GB-064: back to FLOAT (FIX left set on p.20); tan(45) → 1", () => {
    const s = run(gb064);
    expect(homeText(s)).toEqual(["tan(45) = 1", ""]);
    expect(indicators(s)).not.toContain("fix");
  });

  it("GB-065: tan⁻¹(1) → 45", () => expect(last(run(`${gb064} 2ND ATAN 1 ) ENTER`))).toBe("tan⁻¹(1) = 45"));
  it("GB-066: 5*cos(60) → 5/2", () => expect(last(run(`${gb064} 5 * COS 60 ) ENTER`))).toBe("5*cos(60) = 5/2"));

  it("GB-067: RAD; tan(π/4) → 1", () => {
    expect(last(run("MODE RIGHT ENTER CLEAR TAN PI FRAC 4 RIGHT ) ENTER"))).toBe("tan(π/4) = 1");
  });

  it("GB-068: RAD; tan⁻¹(1) → 0.785398163; ◂▸ inserts the 13-digit Ans → π/4", () => {
    const s = run(`${MODE.RAD} 2ND ATAN 1 ) ENTER TOGGLE`);
    expect(homeText(s)).toEqual(["tan⁻¹(1) = 0.785398163", "0.7853981633975◂▸ = π/4", ""]);
  });

  it("GB-069: RAD; 5*cos(π/4) → 5√2/2; ◂▸ → 3.535533906", () => {
    const s = run(`${MODE.RAD} 5 * COS PI FRAC 4 RIGHT ) ENTER TOGGLE`);
    expect(homeText(s)).toEqual(["5*cos(π/4) = (5√2)/2", "(5√2)/2◂▸ = 3.535533906", ""]);
  });

  it("GB-070 p.22: FIX 1; tan⁻¹(7/3) 66.8, 90−Ans 23.2, √(3²+7²) √58 (exact despite FIX), ◂▸ 7.6", () => {
    const s = run("MODE DOWN DOWN RIGHT RIGHT ENTER CLEAR 2ND ATAN 7 FRAC 3 RIGHT ) ENTER 90 - 2ND ANS ENTER 2ND SQRT 3 SQUARE + 7 SQUARE ENTER TOGGLE");
    expect(homeText(s)).toEqual(["tan⁻¹(7/3) = 66.8", "90−Ans = 23.2", "√(3²+7²) = √(58)", "√(58)◂▸ = 7.6", ""]);
  });
});

describe("GB p.23 (GB06 p.24): hyperbolics, logs and exponentials", () => {
  it("GB-071: sinh(5)+2 → 76.20321058; edited by overwrite into sinh⁻¹(5)+2 → 4.312438341", () => {
    let s = run("2ND HYP");
    expect(indicators(s)).toContain("hyp");
    s = run("SIN 5 ) + 2 ENTER", s);
    expect(last(s)).toBe("sinh(5)+2 = 76.20321058");
    s = run("UP UP ENTER LEFT LEFT LEFT LEFT LEFT 2ND HYP 2ND ASIN ENTER", s);
    expect(homeText(s)).toEqual(["sinh(5)+2 = 76.20321058", "sinh⁻¹(5)+2 = 4.312438341", ""]);
  });

  it("GB-072: log(1) → 0", () => expect(last(run("LOG 1 ) ENTER"))).toBe("log(1) = 0"));
  it("GB-073: ln(5)*2 → 3.218875825", () => expect(last(run("LN 5 ) * 2 ENTER"))).toBe("ln(5)*2 = 3.218875825"));
  it("GB06-2: ln(15)*2 → 5.416100402", () => expect(last(run("LN 15 ) * 2 ENTER"))).toBe("ln(15)*2 = 5.416100402"));
  it("GB-074: 10^log(2) → 2", () => expect(last(run("2ND TEN_X LOG 2 ) ENTER"))).toBe("10^(log(2)) = 2"));
  it("GB-075: log(10⁵) → 5", () => expect(last(run("LOG 2ND TEN_X 5 RIGHT ) ENTER"))).toBe("log(10^5) = 5"));
  it("GB-076: e^.5 → 1.648721271 (the entry keeps .5)", () => expect(last(run("2ND E_X .5 ENTER"))).toBe("e^(.5) = 1.648721271"));
});

describe("GB p.24–29: statistics", () => {
  const gb077 = "DATA DATA DOWN DOWN DOWN ENTER 45 DOWN 55 DOWN 55 DOWN 55 ENTER";

  it("GB-077: Clear ALL, 45 55 55 55, 1-Var stats, x̄ pasted → 52.5, Ans*2 → 105", () => {
    let s = run("DATA DATA DOWN DOWN DOWN");
    expect(screenLines(s)).toEqual(["CLEAR FORMULA", "2↑Clear L2", "3:Clear L3", "4:Clear ALL"]);
    expect(highlighted(s)).toEqual(["CLEAR", "4:"]);
    s = run("ENTER 45 DOWN 55 DOWN 55 DOWN 55 ENTER", s);
    expect(screenLines(s).slice(0, 3)).toEqual(["55", "55", "55"]);
    expect(screenLines(s).at(-1)).toBe("L1(5)=");
    s = run("2ND STAT", s);
    expect(screenLines(s)).toEqual(["STATS", "1:1-Var Stats", "2:2-Var Stats"]);
    s = run("1", s);
    expect(screenLines(s)).toEqual(["1-VAR STATS", "DATA: L1 L2 L3", "FRQ: ONE L1 L2 L3", "CALC"]);
    expect(highlighted(s)).toEqual(["L1", "ONE"]);
    s = run("DOWN DOWN ENTER", s);
    expect(screenLines(s)).toEqual(["1-Var:L1,One", "1:n=4", "2:x̄≡52.5", "3↓Sx≡5"]);
    s = run("2", s);
    expect(entry(s)).toBe("x̄");
    s = run("ENTER * 2 ENTER", s);
    expect(homeText(s)).toEqual(["x̄ = 52.5", "Ans*2 = 105", ""]);
  });

  it("GB-078: 2-Var on 45 55 / 30 25; StatVars ▲×6 wraps to G:x′; x′(45) → 15", () => {
    // p.26 shows 3:StatVars in the STATS menu: the 1-Var results of GB-077 are carried over
    let s = run(`${gb077} 2ND STAT 1 DOWN DOWN ENTER 2ND QUIT`);
    s = run("DATA DATA DOWN DOWN DOWN ENTER 45 DOWN 55 DOWN RIGHT 30 DOWN 25 DOWN", s);
    expect(screenLines(s).at(-1)).toBe("L2(3)=");
    s = run("2ND STAT", s);
    expect(screenLines(s)).toEqual(["STATS", "1:1-Var Stats", "2:2-Var Stats", "3:StatVars"]);
    s = run("2", s);
    expect(screenLines(s)).toEqual(["2-VAR STATS", "ẋDATA: L1 L2 L3", "ẏDATA: L1 L2 L3", "CALC"]);
    expect(highlighted(s)).toEqual(["L1", "L2"]);
    s = run("DOWN DOWN ENTER 2ND QUIT 2ND STAT 3 UP×6", s);
    expect(screenLines(s)).toEqual(["2-Var:L1,L2", "G↑x′", "H:y′", "I↓minX=45"]);
    expect(highlighted(s)).toEqual(["2-Var:L1,L2", "G↑"]);
    s = run("ENTER 45 ) ENTER", s);
    expect(last(s)).toBe("x′(45) = 15");
  });

  it("GB-079: frequencies 1 .5 1 .5 in L2 → n=3, Sx=Error; 11 overwritten by 15 → x̄=12", () => {
    let s = run("DATA DATA 4 DATA RIGHT 5 12 DOWN 13 DOWN 10 DOWN 11 DOWN RIGHT 1 DOWN .5 DOWN 1 DOWN .5 DOWN");
    expect(screenLines(s).at(-1)).toBe("L2(5)=");
    s = run("2ND STAT 1 DOWN RIGHT RIGHT ENTER", s);
    expect(highlighted(s)).toEqual(["L1", "L2"]);
    s = run("ENTER", s);
    expect(screenLines(s)).toEqual(["1-Var:L1,L2", "1:n=3", "2:x̄≡11.33333333", "3↓Sx=Error"]);
    s = run("DATA DOWN DOWN DOWN 15 DOWN", s);
    expect(s.apps.lists[0].map((v) => v.re)).toEqual([12, 13, 10, 15]);
    expect(screenLines(s).at(-1)).toBe("L1(5)=");
    s = run("2ND STAT 1 DOWN DOWN ENTER", s);
    expect(screenLines(s)).toEqual(["1-Var:L1,L2", "1:n=3", "2:x̄≡12", "3↓Sx=Error"]);
  });

  it("GB-080: 2-Var on 33 49 65 79 / 5.3 14.45 20.21 38.45; a, b, r; y′(55) → 18.58651222", () => {
    let s = run("DATA DATA 4 33 DOWN 49 DOWN 65 DOWN 79 DOWN RIGHT 5.3 DOWN 14.45 DOWN 20.21 DOWN 38.45 DOWN");
    expect(screenLines(s).at(-1)).toBe("L2(5)=");
    s = run("2ND STAT 2 DOWN DOWN ENTER", s);
    expect(screenLines(s)).toEqual(["2-Var:L1,L2", "1:n=4", "2:x̄≡56.5", "3↓Sx≡19.89137166"]);
    s = run("DOWN×13", s);
    expect(screenLines(s)).toEqual(["2-Var:L1,L2", "C↑Σxy=5234.15", "D:a=0.677325190", "E↓b≡⁻18.6663732"]);
    s = run("DOWN×3", s);
    expect(screenLines(s)).toEqual(["2-Var:L1,L2", "F↑r≡0.963411717", "G:x′", "H↓y′"]);
    expect(highlighted(s)).toEqual(["2-Var:L1,L2", "H↓"]);
    s = run("ENTER 55 ) ENTER", s);
    expect(last(s)).toBe("y′(55) = 18.58651222");
  });
});

describe("GB p.29–31: probability", () => {
  it("GB-081: 8, prb shows PRB RAND, 1 3 enter → 8 nPr 3 = 336", () => {
    let s = run("8");
    expect(entry(s)).toBe("8");
    s = run("PRB", s);
    expect(screenLines(s)).toEqual(["PRB RAND", "1:nPr", "2:nCr", "3:!"]);
    expect(highlighted(s)).toEqual(["PRB", "1:"]);
    s = run("1 3 ENTER", s);
    expect(last(s)).toBe("8 nPr 3 = 336");
  });

  it("GB-082: 52 nCr 5 → 2598960", () => expect(last(run("52 PRB 2 5 ENTER"))).toBe("52 nCr 5 = 2598960"));
  it("GB-083: 4! → 24", () => expect(last(run("4 PRB 3 ENTER"))).toBe("4! = 24"));

  const gb084 = "5 STO PRB RIGHT 1 ENTER";

  it("GB-084: 5 sto▸ prb ► shows the RAND tab; 1 enter → 5→rand = 5", () => {
    const s = run("5 STO PRB RIGHT");
    expect(screenLines(s)).toEqual(["PRB RAND", "1:rand", "2:randint("]);
    expect(highlighted(s)).toEqual(["RAND", "1:"]);
    expect(homeText(run("1 ENTER", s))).toEqual(["5→rand = 5", ""]);
  });

  it("GB-085: after seed 5, rand → 0.000093165 (next line)", () => {
    expect(last(run(`${gb084} PRB RIGHT 1 ENTER`))).toBe("rand = 0.000093165");
  });

  it("GB-086: then randint(3,5) → 5", () => {
    expect(last(run(`${gb084} PRB RIGHT 1 ENTER PRB RIGHT 2 3 2ND COMMA 5 ) ENTER`))).toBe("randint(3,5) = 5");
  });

  it("GB-087: 25 nCr (during entry) then 25 nCr 3 → 2300", () => {
    const s = run("25 PRB 2");
    expect(entry(s)).toBe("25 nCr ");
    expect(last(run("3 ENTER", s))).toBe("25 nCr 3 = 2300");
  });
});

describe("GB p.32–33: data editor and list formulas", () => {
  it("GB-088: 1/4 2/4 3/4 4/4 stay fractions; ♦L2=L1▸F◂▸D → 0.25 0.5 0.75 1", () => {
    let s = run("DATA 1 FRAC 4 DOWN 2 FRAC 4 DOWN 3 FRAC 4 DOWN 4 FRAC 4 ENTER");
    expect(screenLines(s)).toEqual(["1⁄2", "3⁄4", "1", "______", "L1(5)="]);
    s = run("RIGHT DATA RIGHT", s);
    expect(screenLines(s)).toEqual(["CLEAR FORMULA", "1:Add/Edit Frmla", "2:Clear L1 Frmla", "3↓Clear L2 Frmla"]);
    expect(highlighted(s)).toEqual(["FORMULA", "1:"]);
    s = run("ENTER", s);
    expect(screenLines(s).at(-1)).toBe("♦L2=");
    s = run("DATA ENTER 2ND F_D", s);
    expect(screenLines(s).at(-1)).toBe("♦L2=L1▸F◂▸D");
    s = run("ENTER", s);
    expect(s.apps.lists[1].map((v) => v.re)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(screenLines(s).at(-1)).toBe("L2(1)= 0.25");
    expect(highlighted(s)).toContain("L2(1)=");
  });

  it("GB-089: ♦L2=9/5×L1+32 → 46.4 30.2 39.2; adding 21 to L1 appends 69.8", () => {
    let s = run("DATA DATA 4 DATA RIGHT 5 8 DOWN NEG 1 DOWN 4 DOWN RIGHT");
    expect(screenLines(s).at(-1)).toBe("L2(1)=");
    s = run("DATA RIGHT 1", s);
    expect(screenLines(s).at(-1)).toBe("♦L2=");
    s = run("9 / 5 * DATA 1 + 32", s);
    expect(screenLines(s).at(-1)).toBe("♦L2=9/5×L1+32");
    s = run("ENTER", s);
    expect(s.apps.lists[1].map((v) => v.re)).toEqual([46.4, 30.2, 39.2]);
    expect(screenLines(s).at(-1)).toBe("L2(1)= 46.4");
    s = run("LEFT DOWN DOWN DOWN 21 ENTER", s);
    expect(s.apps.lists.map((l) => l.map((v) => v.re))).toEqual([[8, -1, 4, 21], [46.4, 30.2, 39.2, 69.8], []]);
    expect(screenLines(s).at(-1)).toBe("L1(5)=");
  });
});

describe("GB p.34–35: function table", () => {
  it("GB-090: y=x(36−x), Start 15 Step 3 → 15 315, 18 324, 21 315", () => {
    let s = run("TABLE VAR ( 36 - VAR )");
    expect(screenLines(s)).toEqual(["y= x(36−x)"]);
    s = run("ENTER", s);
    expect(screenLines(s)).toEqual(["Start=0", "Step=1", "Auto Ask-ẋ", "OK"]);
    expect(highlighted(s)).toEqual(["Auto"]);
    s = run("CLEAR 15 DOWN CLEAR 3 DOWN DOWN ENTER", s);
    expect(screenLines(s)).toEqual(["ẋ ẏ", "15 315", "18 324", "21 315", "ẋ=15"]);
    expect(highlighted(s)).toEqual(["15"]);
  });

  it("GB-091: y=3600−450x with Ask-x; guesses 2, 7, 8 → 2700, 450, 0", () => {
    let s = run("TABLE 3600 - 450 VAR");
    expect(screenLines(s)).toEqual(["y= 3600−450x"]);
    s = run("ENTER 0 DOWN 1 DOWN RIGHT ENTER DOWN ENTER", s);
    expect(s.app.kind).toBe("tableView");
    s = run("2 ENTER 7 ENTER 8 ENTER", s);
    expect(screenLines(s)).toEqual(["ẋ ẏ", "2 2700", "7 450", "8 0", "ẋ=8"]);
  });

  it("GB-090 → GB-091 on one session: table shows the last function, which [clear] empties (TG p.22, p.100)", () => {
    const s = run("TABLE VAR ( 36 - VAR ) ENTER CLEAR 15 DOWN CLEAR 3 DOWN DOWN ENTER 2ND QUIT TABLE");
    expect(screenLines(s)).toEqual(["y= x(36−x)"]);
    expect(screenLines(run("CLEAR 3600 - 450 VAR", s))).toEqual(["y= 3600−450x"]);
  });
});

describe("GB p.35–36: constant K", () => {
  it("GB-092: K=*2+3, then 4 → 4*2+3 = 11 and 6 → 6*2+3 = 15", () => {
    let s = run("2ND K");
    expect(screenLines(s)).toEqual(["K="]);
    s = run("* 2 + 3 ENTER", s);
    expect(screenLines(s)).toEqual(["K= *2+3"]);
    expect(indicators(s)).toEqual(["k", "deg"]);
    s = run("4 ENTER", s);
    expect(homeText(s)).toEqual(["4*2+3 = 11", ""]);
    s = run("6 ENTER", s);
    expect(homeText(s)).toEqual(["4*2+3 = 11", "6*2+3 = 15", ""]);
  });

  // GB-092 – GB-095 are one session on p.35–36
  const gb093 = "2ND K * 2 + 3 ENTER 4 ENTER 6 ENTER 2ND K 2ND K CLEAR SQUARE ENTER";
  const gb094 = `${gb093} 5 ENTER 20 ENTER 2ND K 1 + 1 ENTER`;

  it("GB-093: reset K: 2nd K 2nd K clear x² enter → K=²; 5 → 25, 20 → 400", () => {
    let s = run(gb093);
    expect(screenLines(s)).toEqual(["K= ²"]);
    expect(indicators(s)).toContain("k");
    s = run("5 ENTER 20 ENTER", s);
    expect(lastN(s, 2)).toEqual(["5² = 25", "20² = 400"]);
  });

  it("GB-094: 2nd K turns K off: 1+1 → 2", () => {
    const s = run(gb094);
    expect(last(s)).toBe("1+1 = 2");
    expect(indicators(s)).not.toContain("k");
  });

  it("GB-095: K=*5−2 typed over the stored ² (no [clear] printed); ⁻5 → ⁻27, ⁻1 → ⁻7; 2nd K off", () => {
    let s = run(`${gb094} 2ND K * 5 - 2 ENTER`);
    expect(screenLines(s)).toEqual(["K= *5−2"]);
    s = run("NEG 5 ENTER NEG 1 ENTER", s);
    expect(lastN(s, 2)).toEqual(["⁻5*5−2 = ⁻27", "⁻1*5−2 = ⁻7"]);
    s = run("2ND K", s);
    expect(indicators(s)).not.toContain("k");
  });
});

// ================================================================================================
// 10.2 Teacher guide
// ================================================================================================

describe("TG p.29–48: history, editing, basic operations", () => {
  it("TG-01: 46−23 23; overwrite to 41−26 15; 2/5+3/10 7/10; off/on keeps history, ▲▲▲ highlights 15", () => {
    let s = run("46 - 23 ENTER");
    expect(last(s)).toBe("46−23 = 23");
    s = run("UP UP ENTER LEFT LEFT LEFT LEFT 1 RIGHT RIGHT 6 ENTER", s);
    expect(last(s)).toBe("41−26 = 15");
    s = run("2 FRAC 5 RIGHT + 3 FRAC 10 ENTER", s);
    expect(last(s)).toBe("2/5+3/(10) = 7/(10)");
    s = run("2ND OFF ON", s);
    const blank = view(s).screen;
    expect(blank.kind === "home" && blank.firstShown).toBe(3);
    expect(indicators(s)).toContain("up");
    // the block cursor at the top left of the blank screen (its "on" blink phase)
    expect([lit(s, 1, 0, true), lit(s, 5, 6, true), lit(s, 1, 0, false)]).toEqual([true, true, false]);
    s = run("UP UP UP", s);
    expect(s.app).toMatchObject({ kind: "home", selected: { line: 1, part: "result" } });
  });

  it("TG-02: 2nd reset → Reset 1:No 2:Yes; 2 → MEMORY CLEARED; clear → a blank Home screen", () => {
    let s = run("2 + 2 ENTER MODE RIGHT ENTER CLEAR 2ND RESET");
    expect(screenLines(s)).toEqual(["Reset", "1:No", "2:Yes"]);
    expect(highlighted(s)).toEqual(["Reset", "1:"]);
    s = run("2", s);
    expect(screenLines(s)).toEqual(["MEMORY CLEARED"]);
    expect(indicators(s)).toEqual(["deg"]);
    s = run("CLEAR", s);
    expect(homeText(s)).toEqual([""]);
    expect(s.modes.angle).toBe("DEG");
  });

  it("TG-03: 5²+12² → 169; √Ans → 13", () => {
    expect(homeText(run("5 SQUARE + 12 SQUARE ENTER 2ND SQRT 2ND ANS ENTER"))).toEqual(["5²+12² = 169", "√Ans = 13", ""]);
  });

  it("TG-04: √8 → 2√2; ◂▸ → 2.828427125", () => {
    expect(homeText(run("2ND SQRT 8 ENTER TOGGLE"))).toEqual(["√8 = 2√2", "2√2◂▸ = 2.828427125", ""]);
  });

  it("TG-05: delete under the cursor, then 2nd insert: 4569+285 → 459+285 → 459+2865 = 3324", () => {
    let s = run("4569 + 285");
    expect(entry(s)).toBe("4569+285");
    s = run("LEFT×6 DELETE", s);
    expect(entry(s)).toBe("459+285");
    s = run("RIGHT×4 2ND INSERT 6", s);
    expect(entry(s)).toBe("459+2865");
    expect(last(run("ENTER", s))).toBe("459+2865 = 3324");
  });

  it("TG-06: clear mid-entry clears to the right; clear again empties the line", () => {
    let s = run("21595");
    s = run("LEFT LEFT CLEAR", s);
    expect(entry(s)).toBe("215");
    s = run("CLEAR", s);
    expect(homeText(s)).toEqual([""]);
  });

  it("TG-07: 2+54−6 50, 16*21 336, 1/2*10 5, 12*(5+6) 132", () => {
    const s = run("2 + 54 - 6 ENTER 16 * 21 ENTER 1 FRAC 2 RIGHT * 10 ENTER 12 * ( 5 + 6 ) ENTER");
    expect(homeText(s)).toEqual(["2+54−6 = 50", "16*21 = 336", "1/2*10 = 5", "12*(5+6) = 132", ""]);
  });

  it("TG-08: ⁻3+12 → 9", () => expect(last(run("NEG 3 + 12 ENTER"))).toBe("⁻3+12 = 9"));
  it("TG-09: 15%*80 → 12", () => expect(last(run("15 2ND PERCENT * 80 ENTER"))).toBe("15%*80 = 12"));

  it("TG-10: 1+2*3 7; 1+(2*3) 7; (1+2)*3 9", () => {
    const s = run("1 + 2 * 3 ENTER 1 + ( 2 * 3 ) ENTER ( 1 + 2 ) * 3 ENTER");
    expect(homeText(s)).toEqual(["1+2*3 = 7", "1+(2*3) = 7", "(1+2)*3 = 9", ""]);
  });
});

describe("TG p.53–66: Classic vs MathPrint, notation, fractions, FIX", () => {
  it("TG-11: Classic √(5²−4(1)(3) unclosed → 3.605551275; MathPrint → √13; ◂▸ → 3.605551275", () => {
    const keys = "2ND SQRT 5 SQUARE - 4 ( 1 ) ( 3 ) ENTER";
    expect(last(run(`MODE DOWN DOWN DOWN ENTER CLEAR ${keys}`))).toBe("√(5²−4(1)(3) = 3.605551275");
    expect(homeText(run(`${keys} TOGGLE`))).toEqual(["√(5²−4(1)(3)) = √(13)", "√(13)◂▸ = 3.605551275", ""]);
  });

  it("TG-12: 12543 re-run by clear enter in SCI, ENG, NORM; old lines keep their format", () => {
    let s = run("12543 ENTER");
    s = run("MODE DOWN RIGHT ENTER CLEAR ENTER", s);
    s = run("MODE DOWN RIGHT RIGHT ENTER CLEAR ENTER", s);
    s = run("MODE DOWN ENTER CLEAR ENTER", s);
    expect(homeText(s)).toEqual(["12543 = 12543", "12543 = 1.2543*10^4", "12543 = 12.543*10^3", "12543 = 12543", ""]);
  });

  it("TG-13: 7.8*10⁸−1.5*10⁸ → 630000000 (9 digits stay in NORM)", () => {
    expect(last(run("7.8 EE 8 RIGHT - 1.5 EE 8 ENTER"))).toBe("7.8*10^8−1.5*10^8 = 630000000");
  });

  it("TG-14: 5/6+1/10 → 14/15", () => expect(last(run("5 FRAC 6 RIGHT + 1 FRAC 10 ENTER"))).toBe("5/6+1/(10) = (14)/(15)"));

  it("TG-15: 4 3/8 + 2 3/4 → 57/8; ▸n/d◂▸Un/d inserts the value → 7 1/8", () => {
    const s = run("4 2ND MIXED 3 DOWN 8 RIGHT + 2 2ND MIXED 3 DOWN 4 ENTER 2ND FRAC_CONV ENTER");
    expect(homeText(s)).toEqual(["4⌴3/8+2⌴3/4 = (57)/8", "(57)/8▸n/d◂▸Un/d = 7⌴1/8", ""]);
  });

  it("TG-16: 5 3/4▸F◂▸D → 5.75; 2.25▸F◂▸D → 9/4; 2.25 then ◂▸ → 9/4", () => {
    expect(last(run("5 2ND MIXED 3 DOWN 4 RIGHT 2ND F_D ENTER"))).toBe("5⌴3/4▸F◂▸D = 5.75");
    expect(last(run("2.25 2ND F_D ENTER"))).toBe("2.25▸F◂▸D = 9/4");
    expect(homeText(run("2.25 ENTER TOGGLE"))).toEqual(["2.25 = 2.25", "2.25◂▸ = 9/4", ""]);
  });

  it("TG-17: 12.345 re-run in FIX 2 (12.35, half up), FIX 1 (12.3), FLOAT (12.345)", () => {
    let s = run("12.345 ENTER");
    s = run("MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER CLEAR ENTER", s);
    s = run("MODE DOWN DOWN RIGHT RIGHT ENTER CLEAR ENTER", s);
    s = run("MODE DOWN DOWN ENTER CLEAR ENTER", s);
    expect(homeText(s)).toEqual(["12.345 = 12.345", "12.345 = 12.35", "12.345 = 12.3", "12.345 = 12.345", ""]);
  });
});

describe("TG p.68–77: constant K, memory", () => {
  it("TG-18: K=*5.25; 16 → 84, 12 → 63, 17 → 89.25; 2nd K turns K off", () => {
    let s = run("2ND K * 5.25 ENTER");
    expect(indicators(s)).toContain("k");
    s = run("CLEAR 16 ENTER 12 ENTER 17 ENTER", s);
    expect(homeText(s)).toEqual(["16*5.25 = 84", "12*5.25 = 63", "17*5.25 = 89.25", ""]);
    expect(indicators(run("2ND K", s))).not.toContain("k");
  });

  it("TG-19: test averages with Ans and x", () => {
    const s = run("96 + 76 + 85 ENTER / 3 ENTER STO VAR ENTER 92 + 83 + 97 + 86 ENTER / 4 ENTER + VAR ENTER / 2 ENTER");
    expect(homeText(s)).toEqual([
      "96+76+85 = 257", "Ans÷3 = 85.66666667", "Ans→x = 85.66666667", "92+83+97+86 = 358",
      "Ans÷4 = 89.5", "Ans+x = 175.1666667", "Ans÷2 = 87.58333333", "",
    ]);
  });

  it("TG-20: 2+x(1.40) re-run from history with a new x", () => {
    let s = run("4.5 STO VAR ENTER 2 + VAR ( 1.40 ) ENTER 3 + VAR ( 1.10 ) ENTER");
    expect(lines(s)).toEqual(["4.5→x = 4.5", "2+x(1.40) = 8.3", "3+x(1.10) = 7.95"]);
    s = run("3.2 STO VAR ENTER", s);
    expect(last(s)).toBe("3.2→x = 3.2");
    s = run("UP×6 ENTER ENTER", s);
    expect(last(s)).toBe("2+x(1.40) = 6.48");
    s = run("UP×6 ENTER ENTER", s);
    expect(last(s)).toBe("3+x(1.10) = 6.52");
  });

  it("TG-21: prices stored in x, y, z; Recall Var; recalled values summed (the 17-char entry is cut on screen)", () => {
    let s = run("2 * 13.98 ENTER STO VAR ENTER 3 * 7.98 ENTER STO VAR VAR ENTER 6.98 + 9.98 ENTER STO VAR VAR VAR ENTER");
    expect(lines(s)).toEqual(["2*13.98 = 27.96", "Ans→x = 27.96", "3*7.98 = 23.94", "Ans→y = 23.94", "6.98+9.98 = 16.96", "Ans→z = 16.96"]);
    const menu = run("2ND RECALL", s);
    expect(screenLines(menu)).toEqual(["Recall Var", "1:ẋ=27.96", "2:ẏ=23.94", "3↓ż=16.96"]);
    s = run("1 + 2ND RECALL 2 + 2ND RECALL 3 ENTER", menu);
    expect(last(s)).toBe("27.96+23.94+16.96 = 68.86");
  });
});

describe("TG p.80–88: data editor and statistics", () => {
  it("TG-22 p.80–81: as GB-089: ♦L2=9/5×L1+32 → 46.4 30.2 39.2; then 21 in L1 → 69.8", () => {
    let s = run("DATA DATA 4 DATA RIGHT 5 8 DOWN NEG 1 DOWN 4 DOWN RIGHT DATA RIGHT 1 9 / 5 * DATA 1 + 32 ENTER");
    expect(screenLines(s).slice(0, 3)).toEqual(["8 46.4 ______", "⁻1 30.2", "4 39.2"]);
    s = run("LEFT DOWN DOWN DOWN 21 ENTER", s);
    expect(s.apps.lists[1].map((v) => v.re).at(-1)).toBe(69.8);
  });

  const tg23 = "DATA 85 DOWN 97 DOWN 53 DOWN 77 DOWN RIGHT 2 DOWN 1 DOWN 1 DOWN 1 DOWN";

  it("TG-23: L1 with frequencies in L2; 1-Var results scrolled to B:maxX", () => {
    let s = run("DATA");
    expect(screenLines(s).at(-1)).toBe("L1(1)=");
    s = run(tg23.replace(/^DATA /, ""), s);
    s = run("2ND STAT 1 DOWN RIGHT RIGHT ENTER DOWN ENTER", s);
    expect(screenLines(s)).toEqual(["1-Var:L1,L2", "1:n=5", "2:x̄≡79.4", "3↓Sx≡16.39512123"]);
    s = run("DOWN×5", s);
    expect(screenLines(s).slice(1)).toEqual(["4↑σx=14.66424222", "5:Σx=397", "6↓Σx²=32597"]);
    s = run("DOWN×3", s);
    expect(screenLines(s).slice(1)).toEqual(["7↑minX=53", "8:Q1=77", "9↓Med=85"]);
    s = run("DOWN×2", s);
    expect(screenLines(s).slice(1)).toEqual(["9↑Med=85", "A:Q3=85", "B:maxX=97"]);
  });

  it("TG-24: delete removes 53 and its frequency; 1-Var again → n=4, x̄=86; Clear ALL, quit", () => {
    let s = run(`${tg23} 2ND STAT 1 DOWN RIGHT RIGHT ENTER DOWN ENTER`);
    s = run("DATA DOWN DOWN", s);
    expect(screenLines(s).at(-1)).toBe("L1(3)= 53");
    s = run("DELETE RIGHT DELETE", s);
    expect(s.apps.lists.map((l) => l.map((v) => v.re))).toEqual([[85, 97, 77], [2, 1, 1], []]);
    expect(screenLines(s).at(-1)).toBe("L2(3)= 1");
    s = run("2ND STAT 1 DOWN DOWN ENTER", s);
    expect(screenLines(s)).toEqual(["1-Var:L1,L2", "1:n=4", "2:x̄≡86", "3↓Sx≡8.246211251"]);
    s = run("DATA DATA 4", s);
    expect(s.apps.lists).toEqual([[], [], []]);
    s = run("2ND QUIT", s);
    expect(view(s).screen).toMatchObject({ kind: "home" });
    expect(homeText(s).at(-1)).toBe("");
  });

  it("TG-25: 2-Var on 58 47 / 35 28; y′(32) → 18.45454545", () => {
    const s = run("DATA 58 DOWN 47 DOWN RIGHT 35 DOWN 28 DOWN 2ND STAT 2 DOWN DOWN ENTER DOWN×16 ENTER 32 ) ENTER");
    expect(last(s)).toBe("y′(32) = 18.45454545");
  });
});

describe("TG p.90–95: probability", () => {
  it("TG-26: 4 nCr 2 → 6", () => expect(last(run("4 PRB DOWN ENTER 2 ENTER"))).toBe("4 nCr 2 = 6"));
  it("TG-27: 4 nPr 2 → 12", () => expect(last(run("4 PRB ENTER 2 ENTER"))).toBe("4 nPr 2 = 12"));
  it("TG-28: 4! → 24", () => expect(last(run("4 PRB DOWN DOWN ENTER ENTER"))).toBe("4! = 24"));

  it("TG-29: rand, enter repeats it with a new draw (unknown seed: results vary)", () => {
    const s = run("PRB RIGHT ENTER ENTER ENTER");
    expect(s.history.map((h) => h.entry.length)).toEqual([1, 1]);
    expect(lines(s).map((l) => l.split(" = ")[0])).toEqual(["rand", "rand"]);
    const [a, b] = s.history.map((h) => h.value.re);
    expect(a).not.toBe(b);
    for (const v of [a, b]) expect(v).toBeGreaterThan(0), expect(v).toBeLessThan(1);
    // the printed pair is consecutive for the generator: it back-solves to seed 665000 (M §4.5)
    const seeded = run("665000 STO PRB RIGHT ENTER ENTER PRB RIGHT ENTER ENTER ENTER");
    expect(lines(seeded).slice(1)).toEqual(["rand = 0.390926039", "rand = 0.514541293"]);
  });

  it("TG-30: 1→rand; rand → 0.000018633, then 0.745579721", () => {
    const s = run("1 STO PRB RIGHT ENTER ENTER PRB RIGHT ENTER ENTER ENTER");
    expect(homeText(s)).toEqual(["1→rand = 1", "rand = 0.000018633", "rand = 0.745579721", ""]);
  });

  it("TG-31: randint(2,10) three times (results vary, integers in 2…10)", () => {
    const s = run("PRB RIGHT DOWN ENTER 2 2ND COMMA 10 ) ENTER ENTER ENTER");
    expect(lines(s).map((l) => l.split(" = ")[0])).toEqual(["randint(2,10)", "randint(2,10)", "randint(2,10)"]);
    for (const h of s.history) {
      expect(Number.isInteger(h.value.re)).toBe(true);
      expect(h.value.re).toBeGreaterThanOrEqual(2);
      expect(h.value.re).toBeLessThanOrEqual(10);
    }
  });
});

describe("TG p.98–100: function table", () => {
  it("TG-32: Start 0 Step 4 → ▼×5 to 12 288 / 16 320 / 20 320; back to setup, Start 15 Step 1 → 17 323 / 18 324 / 19 323", () => {
    let s = run("TABLE VAR ( 36 - VAR ) ENTER 0 DOWN 4 DOWN ENTER DOWN");
    expect(screenLines(s)).toEqual(["Start=0", "Step=4", "Auto Ask-ẋ", "OK"]);
    expect(highlighted(s)).toEqual(["Auto"]);
    s = run("ENTER DOWN×5", s);
    expect(screenLines(s)).toEqual(["ẋ ẏ", "12 288", "16 320", "20 320", "ẋ=20"]);
    s = run("CLEAR 15 DOWN 1 DOWN DOWN ENTER DOWN×4", s);
    expect(screenLines(s)).toEqual(["ẋ ẏ", "17 323", "18 324", "19 323", "ẋ=19"]);
  });

  it("TG-33: clear the old function; y=3600−450x, Ask-x; guesses 6, 7, 8 → 900, 450, 0", () => {
    let s = run("TABLE VAR ( 36 - VAR ) ENTER ENTER 2ND QUIT");
    s = run("TABLE CLEAR 3600 - 450 VAR ENTER CLEAR 0 DOWN CLEAR 1 DOWN RIGHT ENTER DOWN ENTER", s);
    s = run("6 ENTER 7 ENTER 8 ENTER", s);
    expect(screenLines(s)).toEqual(["ẋ ẏ", "6 900", "7 450", "8 0", "ẋ=8"]);
  });
});

describe("TG p.102–116: powers, roots, logs, π", () => {
  it("TG-34: 27.4² → 750.76", () => expect(last(run("27.4 SQUARE ENTER"))).toBe("27.4² = 750.76"));

  it("TG-35: √3 → √3; ◂▸ → 1.732050808; FIX 0, clear enter re-runs the toggled line → 2", () => {
    let s = run("2ND SQRT 3 ENTER TOGGLE");
    expect(homeText(s)).toEqual(["√3 = √3", "√3◂▸ = 1.732050808", ""]);
    s = run("MODE DOWN DOWN RIGHT ENTER CLEAR ENTER", s);
    expect(last(s)).toBe("√3◂▸ = 2");
  });

  it("TG-36: 2.3³ → 12.167; ◂▸ → 12167/1000", () => {
    expect(homeText(run("2.3 POWER 3 ENTER TOGGLE"))).toEqual(["2.3^3 = 12.167", "12.167◂▸ = (12167)/(1000)", ""]);
  });

  it("TG-37: 2^10 → 1024; 2^15 → 32768", () => {
    expect(homeText(run("2 POWER 10 ENTER 2 POWER 15 ENTER"))).toEqual(["2^(10) = 1024", "2^(15) = 32768", ""]);
  });

  it("TG-38: ³√125 → 5", () => expect(last(run("3 2ND NTH_ROOT 125 ENTER"))).toBe("3ˣ√(125) = 5"));

  it("TG-39: 10⁻¹ 1/10; 5⁻¹ 1/5; 5 1/3 → 16/3; Ans⁻¹ → 3/16", () => {
    expect(last(run("10 RECIP ENTER"))).toBe("10⁻¹ = 1/(10)");
    expect(last(run("5 RECIP ENTER"))).toBe("5⁻¹ = 1/5");
    expect(homeText(run("5 2ND MIXED 1 DOWN 3 RIGHT ENTER RECIP ENTER"))).toEqual(["5⌴1/3 = (16)/3", "Ans⁻¹ = 3/(16)", ""]);
  });

  it("TG-40: log(23) in FLOAT and FIX 4; ln(23) in FIX 4 and FLOAT", () => {
    let s = run("LOG 23 ) ENTER");
    expect(last(s)).toBe("log(23) = 1.361727836");
    s = run("MODE DOWN DOWN RIGHT RIGHT RIGHT RIGHT RIGHT ENTER CLEAR ENTER", s);
    expect(last(s)).toBe("log(23) = 1.3617");
    s = run("LN 23 ) ENTER", s);
    expect(last(s)).toBe("ln(23) = 3.1355");
    s = run("MODE DOWN DOWN ENTER CLEAR ENTER", s);
    expect(last(s)).toBe("ln(23) = 3.135494216");
  });

  it("TG-41: 10^3.9824 and e^3.9824 in FLOAT and FIX 4", () => {
    let s = run("2ND TEN_X 3.9824 ENTER");
    expect(last(s)).toBe("10^(3.9824) = 9602.846792");
    s = run(`${MODE.FIX(4)} CLEAR ENTER`, s);
    expect(last(s)).toBe("10^(3.9824) = 9602.8468");
    s = run("2ND E_X 3.9824 ENTER", s);
    expect(last(s)).toBe("e^(3.9824) = 53.6456");
    s = run(`${MODE.FLOAT} CLEAR ENTER`, s);
    expect(last(s)).toBe("e^(3.9824) = 53.64562936");
  });

  it("TG-42: 2*π*1.5 → 9.424777961 (decimal input); ◂▸ → 3π", () => {
    expect(homeText(run("2 * PI * 1.5 ENTER TOGGLE"))).toEqual(["2*π*1.5 = 9.424777961", "9.42477796077◂▸ = 3π", ""]);
  });

  it("TG-43: π*4² → 16π; FIX 0, clear ◂▸ → 50; FLOAT, clear enter → 50.26548246", () => {
    let s = run("PI * 4 SQUARE ENTER");
    expect(last(s)).toBe("π*4² = 16π");
    s = run("MODE DOWN DOWN RIGHT ENTER CLEAR TOGGLE", s);
    expect(last(s)).toBe("16π◂▸ = 50");
    s = run("MODE DOWN DOWN ENTER CLEAR ENTER", s);
    expect(last(s)).toBe("16π◂▸ = 50.26548246");
  });
});

describe("TG p.118–132: angles, polar, trigonometry, hyperbolics", () => {
  it("TG-44: 45°30′+36°15′ → 81.75; 180°−Ans → 98.25; ▸DMS → 98°15′0″", () => {
    const s = run("45 2ND ANGLE 1 30 2ND ANGLE 2 + 36 2ND ANGLE 1 15 2ND ANGLE 2 ENTER 180 2ND ANGLE 1 - 2ND ANS ENTER 2ND ANGLE 6 ENTER");
    expect(homeText(s)).toEqual(["45°30′+36°15′ = 81.75", "180°−Ans = 98.25", "98.25▸DMS = 98°15′0″", ""]);
  });

  it("TG-45: ▲ from item 1 wraps to 6:▸DMS: 39.55°▸DMS → 39°33′0″; 116.20°▸DMS → 116°12′0″", () => {
    expect(last(run("39.55 2ND ANGLE ENTER 2ND ANGLE UP ENTER ENTER"))).toBe("39.55°▸DMS = 39°33′0″");
    expect(last(run("116.20 2ND ANGLE ENTER 2ND ANGLE UP ENTER ENTER"))).toBe("116.20°▸DMS = 116°12′0″");
  });

  it("TG-46: cos(180°), cos(πʳ), cos(200ᵍ) → ⁻1", () => {
    const s = run("COS 180 2ND ANGLE 1 ) ENTER COS PI 2ND ANGLE 4 ) ENTER COS 200 2ND ANGLE 5 ) ENTER");
    expect(homeText(s)).toEqual(["cos(180°) = ⁻1", "cos(πʳ) = ⁻1", "cos(200ᵍ) = ⁻1", ""]);
  });

  it("TG-47: the R◂▸P tab; P▸Rx(7,30) → 6.062177826; P▸Ry(7,30) → 3.5", () => {
    let s = run("2ND ANGLE RIGHT");
    expect(screenLines(s)).toEqual(["DMS R◂▸P", "1:R▸Pr(", "2:R▸Pθ(", "3↓P▸Rx("]);
    expect(highlighted(s)).toEqual(["R◂▸P", "1:"]);
    s = run("DOWN DOWN ENTER", s);
    expect(entry(s)).toBe("P▸Rx(");
    s = run("7 2ND COMMA 30 ) ENTER", s);
    expect(last(s)).toBe("P▸Rx(7,30) = 6.062177826");
    s = run("2ND ANGLE RIGHT DOWN DOWN DOWN ENTER 7 2ND COMMA 30 ) ENTER", s);
    expect(last(s)).toBe("P▸Ry(7,30) = 3.5");
  });

  const refix = (n: number) => `MODE DOWN DOWN ${"RIGHT ".repeat(n + 1)}ENTER CLEAR ENTER`;

  it("TG-48: 78/tan(27°) → 153.0836194; FIX 0 → 153", () => {
    const s = run(`78 FRAC TAN 27 2ND ANGLE ENTER ) ENTER ${refix(0)}`);
    expect(lastN(s, 2)).toEqual(["(78)/(tan(27°)) = 153.0836194", "(78)/(tan(27°)) = 153"]);
  });

  it("TG-49: tan⁻¹(600/2500) → 13.49573328; FIX 1 → 13.5", () => {
    const s = run(`2ND ATAN 600 FRAC 2500 RIGHT ) ENTER ${refix(1)}`);
    expect(lastN(s, 2)).toEqual(["tan⁻¹((600)/(2500)) = 13.49573328", "tan⁻¹((600)/(2500)) = 13.5"]);
  });

  it("TG-50: 5*cos(74) → 1.378186779; FIX 0 → 1", () => {
    const s = run(`5 * COS 74 ) ENTER ${refix(0)}`);
    expect(lastN(s, 2)).toEqual(["5*cos(74) = 1.378186779", "5*cos(74) = 1"]);
  });

  it("TG-51: cos⁻¹(453/500) → 25.04169519; FIX 1 → 25.0 (padded)", () => {
    const s = run(`2ND ACOS 453 FRAC 500 RIGHT ) ENTER ${refix(1)}`);
    expect(lastN(s, 2)).toEqual(["cos⁻¹((453)/(500)) = 25.04169519", "cos⁻¹((453)/(500)) = 25.0"]);
  });

  it("TG-52: 1.5/sin(12) → 7.214601517; FIX 0 → 7", () => {
    const s = run(`1.5 FRAC SIN 12 ) ENTER ${refix(0)}`);
    expect(lastN(s, 2)).toEqual(["(1.5)/(sin(12)) = 7.214601517", "(1.5)/(sin(12)) = 7"]);
  });

  it("TG-53: sin⁻¹(13/20) → 40.54160187; FIX 1 → 40.5", () => {
    const s = run(`2ND ASIN 13 FRAC 20 RIGHT ) ENTER ${refix(1)}`);
    expect(lastN(s, 2)).toEqual(["sin⁻¹((13)/(20)) = 40.54160187", "sin⁻¹((13)/(20)) = 40.5"]);
  });

  it("TG-54: sinh, cosh, tanh of 2 and their inverses of Ans → 2", () => {
    const s = run(
      "2ND HYP SIN 2 ) ENTER 2ND HYP 2ND ASIN 2ND ANS ) ENTER 2ND HYP COS 2 ) ENTER 2ND HYP 2ND ACOS 2ND ANS ) ENTER " +
        "2ND HYP TAN 2 ) ENTER 2ND HYP 2ND ATAN 2ND ANS ) ENTER",
    );
    expect(lines(s)).toEqual([
      "sinh(2) = 3.626860408", "sinh⁻¹(Ans) = 2", "cosh(2) = 3.762195691", "cosh⁻¹(Ans) = 2", "tanh(2) = 0.96402758", "tanh⁻¹(Ans) = 2",
    ]);
  });
});

describe("TG activities (text only)", () => {
  it("TG-A1: SCI conversions", () => {
    const s = run(`${MODE.SCI} 12000000 ENTER 974000000 ENTER .0000034 ENTER .000000004 ENTER`);
    expect(lines(s).map((l) => l.split(" = ")[1])).toEqual(["1.2*10^7", "9.74*10^8", "3.4*10^(⁻6)", "4*10^(⁻9)"]);
  });

  it("TG-A2: NORM shows ×10ⁿ inputs in full", () => {
    const s = run("5.8 EE 7 ENTER 7.32 EE 5 ENTER 6.2 EE NEG 6 ENTER 3 EE NEG 8 ENTER");
    expect(lines(s).map((l) => l.split(" = ")[1])).toEqual(["58000000", "732000", "0.0000062", "0.00000003"]);
  });

  it("TG-A3: SCI 2.5*10¹³+9.3*10⁷ → 2.5000093*10¹³; Ans/(6*10¹²) → 4.166682167 (SCI form [unverified])", () => {
    let s = run(`${MODE.SCI} 2.5 EE 13 RIGHT + 9.3 EE 7 ENTER`);
    expect(last(s)).toBe("2.5*10^(13)+9.3*10^7 = 2.5000093*10^(13)");
    s = run("2ND ANS FRAC 6 EE 12 ENTER", s);
    expect(last(s)).toMatch(/^Ans\/\(6\*10\^\(12\)\) = 4\.166682167(\*10\^0)?$/);
  });

  it("TG-A4: heart-rate frequencies → n=22, x̄=62.27272727, Σx=1370", () => {
    const s = run("DATA 60 DOWN 61 DOWN 62 DOWN 63 DOWN 64 DOWN 65 DOWN RIGHT 3 DOWN 5 DOWN 6 DOWN 3 DOWN 1 DOWN 4 DOWN 2ND STAT 1 DOWN RIGHT RIGHT ENTER DOWN ENTER DOWN×4");
    const items = s.apps.stat?.items ?? [];
    expect(items.find((i) => i.key === "stat_n")?.value).toBe(22);
    expect(items.find((i) => i.key === "stat_xbar")?.value).toBeCloseTo(62.27272727, 8);
    expect(items.find((i) => i.key === "stat_Sumx")?.value).toBe(1370);
    expect(screenLines(s).at(-1)).toBe("5↓Σx=1370");
  });
});

// ================================================================================================
// 10.3 TI Knowledge Base
// ================================================================================================

describe("TI Knowledge Base", () => {
  it("KB-1 (KB 31772): {50,64,87,3,95} → n=5, x̄=59.8, Sx=36.46505176, σx=32.61533382, Σx=299, Σx²=23199", () => {
    let s = run("DATA 50 DOWN 64 DOWN 87 DOWN 3 DOWN 95 DOWN 2ND STAT 1 DOWN DOWN ENTER");
    expect(screenLines(s)).toEqual(["1-Var:L1,One", "1:n=5", "2:x̄≡59.8", "3↓Sx≡36.46505176"]);
    s = run("DOWN×5", s);
    expect(screenLines(s).slice(1)).toEqual(["4↑σx=32.61533382", "5:Σx=299", "6↓Σx²=23199"]);
  });

  it("KB-2 (KB 12280): {1,2,3} → Sx=1, σx=0.816496581", () => {
    const s = run("DATA 1 DOWN 2 DOWN 3 DOWN 2ND STAT 1 DOWN DOWN ENTER DOWN×3");
    expect(screenLines(s).slice(1)).toEqual(["2↑x̄≡2", "3:Sx≡1", "4↓σx=0.816496581"]);
  });

  it("KB-3 (KB 20469): 6*10⁵÷2*10³ is 3*10⁸ by EOS; parentheses give 300", () => {
    expect(last(run("6 EE 5 RIGHT / 2 EE 3 ENTER"))).toBe("6*10^5÷2*10^3 = 300000000");
    expect(last(run("6 EE 5 RIGHT / ( 2 EE 3 RIGHT ) ENTER"))).toBe("6*10^5÷(2*10^3) = 300");
  });
});
