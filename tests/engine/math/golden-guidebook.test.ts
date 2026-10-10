/**
 * Golden tests: every calculation in the TI-30XS MultiView guidebook (GB19, M §10.1), keyed by the
 * example IDs and printed pages of docs/research/math-stats.md. Entries are typed with the guidebook
 * keystrokes through the real editor; results are compared as rowText of the result row:
 * MathPrint fractions read "n/d" with multi-digit parts in parentheses ("(41)/9"), radicals "√(58)",
 * ×10ⁿ "*10^4" / "*10^(⁻3)", Classic fractions "7⁄3" and mixed numbers "4⌴1⁄2", DMS "1°30′0″".
 */
import { describe, expect, it } from "vitest";
import { rowText, sym } from "../../../src/engine/expr";
import {
  evalFunctionAt, evaluateListFormula, formatNumberText, formatResult, oneVarStats, twoVarStats, type EvalContext, type Value,
} from "../../../src/engine/math";
import { Calc, CL, DEFAULT_MODES, res } from "./helpers";

describe("Getting started, modes and history (GB p.2–8)", () => {
  it("GB-001 p.2: √25 → 5", () => expect(res("√ 25")).toBe("5"));

  it("GB-002 p.3: Classic SCI 12345 → 1.2345*10^4 (inline ^)", () => {
    const r = new Calc({ ...CL, notation: "SCI" }).enter("12345");
    expect(r.result).toBe("1.2345*10^4");
    expect(r.row.some((n) => n.t === "sym" && n.s === "caret")).toBe(true);
  });

  it("GB-003 p.3: MathPrint SCI 12345 → 1.2345*10⁴ (ee node)", () => {
    const r = new Calc({ notation: "SCI" }).enter("12345");
    expect(r.result).toBe("1.2345*10^4");
    expect(r.row.at(-1)).toEqual({ t: "ee", exp: [sym("4")] });
  });

  it("GB-004 p.3: Classic 1⁄8 → 1⁄8; ◂▸ → 0.125", () => {
    const c = new Calc(CL);
    expect(c.enter("1 n/d 8")).toMatchObject({ entry: "1⁄8", result: "1⁄8" });
    expect(c.toggle()).toMatchObject({ entry: "1⁄8◂▸", result: "0.125" });
  });

  it("GB-005 p.3: MathPrint {1/8} → 1/8; ◂▸ → 0.125", () => {
    const c = new Calc();
    expect(c.res("1 n/d 8")).toBe("1/8");
    expect(c.toggle()).toMatchObject({ entry: "1/8◂▸", result: "0.125" });
  });

  it("GB-006 p.4: Classic FIX 2, 2π → 6.28", () => expect(res("2 π", { ...CL, decimals: 2 })).toBe("6.28"));

  it("GB-007 p.4: MathPrint FIX 2, 2π → 2π (exact ignores FIX); ◂▸ → 6.28", () => {
    const c = new Calc({ decimals: 2 });
    expect(c.res("2 π")).toBe("2π");
    expect(c.toggle()).toMatchObject({ entry: "2π◂▸", result: "6.28" });
  });

  it("GB-008 p.4: Classic 4⌴5⁄9 → 41⁄9", () => {
    expect(new Calc(CL).enter("4 Un/d 5 n/d 9")).toMatchObject({ entry: "4⌴5⁄9", result: "41⁄9" });
  });

  it("GB-009 p.4: MathPrint 4{5/9} → {41/9}", () => expect(res("4 Un/d 5 ▼ 9")).toBe("(41)/9"));
  it("GB-010 p.4: Classic 2^5 → 32", () => expect(res("2 ^ 5", CL)).toBe("32"));
  it("GB-011 p.4: MathPrint 2^{5} → 32", () => expect(res("2 ^ 5")).toBe("32"));

  it("GB-012 p.4: Classic √(2) → 1.414213562", () => {
    expect(new Calc(CL).enter("√ 2")).toMatchObject({ entry: "√(2", result: "1.414213562" });
  });

  it("GB-013 p.4: MathPrint √2 → √2; ◂▸ → 1.414213562", () => {
    const c = new Calc();
    expect(c.res("√ 2")).toBe("√2");
    expect(c.toggle().result).toBe("1.414213562");
  });

  it("GB-014 p.4: Classic 3ˣ√64 → 4", () => expect(new Calc(CL).enter("3 ˣ√ 64")).toMatchObject({ entry: "3ˣ√64", result: "4" }));
  it("GB-015 p.4: MathPrint ³√(64) → 4", () => expect(res("3 ˣ√ 64")).toBe("4"));

  it("GB-016 p.6–7: 1+1, 2+2, 3+3, 4+4; pasted 3+3 then +2 → 8", () => {
    const c = new Calc();
    expect(["1 + 1", "2 + 2", "3 + 3", "4 + 4"].map((s) => c.res(s))).toEqual(["2", "4", "6", "8"]);
    expect(c.enter("3 + 3 + 2")).toMatchObject({ entry: "3+3+2", result: "8" });
  });

  it("GB-017 p.7: √8 → 2√2; ◂▸ → 2.828427125", () => {
    const c = new Calc();
    expect(c.res("√ 8")).toBe("2√2");
    expect(c.toggle()).toMatchObject({ entry: "2√2◂▸", result: "2.828427125" });
  });

  it("GB-018 p.7–8: 3*3 → 9; Ans*3 → 27; ³√(Ans) → 3", () => {
    const c = new Calc();
    expect(c.res("3 × 3")).toBe("9");
    expect(c.enter("× 3")).toMatchObject({ entry: "Ans*3", result: "27" });
    expect(c.res("3 ˣ√ ans")).toBe("3");
  });

  it("GB-019 p.8: Classic 2^3^2 → 64 (left to right)", () => expect(res("2 ^ 3 ^ 2", CL)).toBe("64"));
  it("GB-020 p.8: MathPrint 2^{3^{2}} → 512 (right to left)", () => expect(res("2 ^ 3 ^ 2")).toBe("512"));
});

describe("Order of operations (GB p.9)", () => {
  it("GB-021: 60+5*⁻12 → 0", () => expect(new Calc().enter("60 + 5 × (−) 12")).toMatchObject({ entry: "60+5*⁻12", result: "0" }));
  it("GB-022: 1+⁻8+12 → 5", () => expect(res("1 + (−) 8 + 12")).toBe("5"));
  it("GB-023: √(9+16) → 5", () => expect(res("√ 9 + 16")).toBe("5"));
  it("GB-024: 4*(2+3) → 20", () => expect(res("4 × ( 2 + 3 )")).toBe("20"));
  it("GB-025: 4(2+3) → 20 (implied ×)", () => expect(res("4 ( 2 + 3 )")).toBe("20"));
  it("GB-026: √(3^{2}+4^{2}) → 5", () => expect(res("√ 3 ^ 2 ► + 4 ^ 2")).toBe("5"));
});

describe("Memory and stored variables (GB p.10–12)", () => {
  it("GB-028 – GB-031: 15→x; 15² → 225; Ans→y; y → 225; Ans÷4 → 56.25", () => {
    const c = new Calc();
    expect(c.enter("15 sto var")).toMatchObject({ entry: "15→x", result: "15" });
    expect(c.vars.x.re).toBe(15);
    expect(c.enter("rcl:x x²")).toMatchObject({ entry: "15²", result: "225" });
    expect(c.enter("sto var var")).toMatchObject({ entry: "Ans→y", result: "225" });
    expect(c.enter("var var")).toMatchObject({ entry: "y", result: "225" });
    expect(c.enter("÷ 4")).toMatchObject({ entry: "Ans÷4", result: "56.25" });
  });

  it("GB-032 p.11–12: ENG mode volumes", () => {
    const c = new Calc({ notation: "ENG" });
    expect(c.enter("350 × 560 sto var")).toMatchObject({ entry: "350*560→x", result: "196*10^3" });
    expect(c.res("340 × 610 sto var var")).toBe("207.4*10^3");
    // Recall Var shows E notation in ENG: x=196ᴇ3, y=207.4ᴇ3, z=0ᴇ0 (GB-032c)
    expect([c.vars.x, c.vars.y, c.vars.z].map((v) => formatNumberText(v.re, c.modes))).toEqual(["196ᴇ3", "207.4ᴇ3", "0ᴇ0"]);
    expect(c.enter("150 × rcl:x")).toMatchObject({ entry: "150*196000", result: "29.4*10^6" });
    expect(c.res("210 × rcl:x")).toBe("41.16*10^6");
    expect(c.res("150 × var var")).toBe("31.11*10^6");
    expect(c.res("210 × var var")).toBe("43.554*10^6");
  });
});

describe("Fractions (GB p.13–14)", () => {
  it("GB-033: Classic 3⁄4+1⌴7⁄12 → 7⁄3", () => expect(res("3 n/d 4 + 1 Un/d 7 n/d 12", CL)).toBe("7⁄3"));
  it("GB-034: Classic 9⁄2▸n/d◂▸Un/d → 4⌴1⁄2", () => expect(res("9 n/d 2 ▸n/d◂▸Un/d", CL)).toBe("4⌴1⁄2"));
  it("GB-035: Classic 4⌴1⁄2▸F◂▸D → 4.5", () => expect(res("4 Un/d 1 n/d 2 ▸F◂▸D", CL)).toBe("4.5"));
  it("GB-036: {3/4}+1{7/12} → {7/3}", () => expect(res("n/d 3 ▼ 4 ► + 1 Un/d 7 ▼ 12")).toBe("7/3"));

  it("GB-037: {9/2}▸n/d◂▸Un/d → 4{1/2} (mixed node)", () => {
    const r = new Calc().enter("9 n/d 2 ► ▸n/d◂▸Un/d");
    expect(r.result).toBe("4⌴1/2");
    expect(r.row[0]?.t).toBe("mixed");
  });

  it("GB-038: 4{1/2}▸F◂▸D → 4.5", () => expect(res("4 Un/d 1 ▼ 2 ► ▸F◂▸D")).toBe("4.5"));
  it("GB-039: {(1.2+1.3)/4} → 0.625 (decimal input gives a decimal)", () => expect(res("n/d 1.2 + 1.3 ▼ 4")).toBe("0.625"));

  it("GB-040: {⁻5+√(5²−4(1)(6)) / 2(1)} → ⁻2", () => {
    const r = new Calc().enter("n/d (−) 5 + √ 5 x² − 4 ( 1 ) ( 6 ) ▼ 2 ( 1 )");
    expect(r.entry).toBe("(⁻5+√(5²−4(1)(6)))/(2(1))");
    expect(r.result).toBe("⁻2");
  });
});

describe("Percentages (GB p.14–15)", () => {
  it("GB-041: 2%*150 → 3", () => expect(res("2 % × 150")).toBe("3"));
  it("GB-042: {1/5}▸% → 20%", () => expect(res("1 n/d 5 ► ▸%")).toBe("20%"));

  it("GB-043: 3%*5000 → 150; Ans+2.3%*7300 → 317.9; Ans*280 → 89012", () => {
    const c = new Calc();
    expect(c.res("3 % × 5000")).toBe("150");
    expect(c.enter("+ 2.3 % × 7300")).toMatchObject({ entry: "Ans+2.3%*7300", result: "317.9" });
    expect(c.res("× 280")).toBe("89012");
  });
});

describe("×10ⁿ (GB p.15–16, GB06 p.16)", () => {
  it("GB-044: SCI {2×10³/4×10⁵}◂▸ → 5×10⁻³ (toggle typed before enter)", () => {
    const r = new Calc({ notation: "SCI" }).enter("n/d 2 ×10ⁿ 3 ▼ 4 ×10ⁿ 5 ► ► ◂▸");
    expect(r.entry).toBe("(2*10^3)/(4*10^5)◂▸");
    expect(r.result).toBe("5*10^(⁻3)");
  });

  it("GB-044 (without ◂▸): the fraction stays exact, 1/200", () => {
    expect(res("n/d 2 ×10ⁿ 3 ▼ 4 ×10ⁿ 5", { notation: "SCI" })).toBe("1/(200)");
  });

  it("GB-045: SCI (2*10³)÷(4*10⁵) → 5*10⁻³", () => {
    expect(res("( 2 ×10ⁿ 3 ► ) ÷ ( 4 ×10ⁿ 5 ► )", { notation: "SCI" })).toBe("5*10^(⁻3)");
  });

  it("GB06-1: 2*10⁵ → 200000; in SCI, re-run → 2*10⁵", () => {
    const c = new Calc();
    expect(c.res("2 ×10ⁿ 5")).toBe("200000");
    c.setModes({ notation: "SCI" });
    expect(c.rerun().result).toBe("2*10^5");
  });
});

describe("Powers, roots, inverses (GB p.16–17)", () => {
  it("GB-046: 5^{2}+4^{(2+1)} → 89", () => expect(res("5 ^ 2 ► + 4 ^ ( 2 + 1 )")).toBe("89"));
  it("GB-047: 10^{⁻2} → {1/100}", () => expect(res("10 ^ (−) 2")).toBe("1/(100)"));
  it("GB-048: √49 → 7", () => expect(res("√ 49")).toBe("7"));
  it("GB-049: √(3^{2}+2^{4}) → 5", () => expect(res("√ 3 ^ 2 ► + 2 ^ 4")).toBe("5"));
  it("GB-050: ⁶√(64) → 2", () => expect(res("6 ˣ√ 64")).toBe("2"));
  it("GB-051: 2⁻¹ → {1/2}", () => expect(res("2 x⁻¹")).toBe("1/2"));
});

describe("Pi (GB p.17)", () => {
  it("GB-052: 2*π → 2π; ◂▸ → 6.283185307", () => {
    const c = new Calc();
    expect(c.res("2 × π")).toBe("2π");
    expect(c.toggle().result).toBe("6.283185307");
  });

  it("GB-053: π*12^{2} → 144π; ◂▸ → 452.3893421", () => {
    const c = new Calc();
    expect(c.res("π × 12 ^ 2")).toBe("144π");
    expect(c.toggle()).toMatchObject({ entry: "144π◂▸", result: "452.3893421" });
  });
});

describe("Angle menu, DMS (GB p.18–20)", () => {
  it("GB-054: RAD sin(30°) → {1/2}", () => expect(res("sin 30 ° )", { angle: "RAD" })).toBe("1/2"));
  it("GB-055: DEG 2πʳ → 360", () => expect(res("2 π ʳ")).toBe("360"));
  it("GB-056: 1.5▸DMS → 1°30′0″", () => expect(res("1.5 ▸DMS")).toBe("1°30′0″"));

  it("GB-057: FIX 2, 12°31′45″+26°54′38″ → 39.44; ▸DMS on the answer → 39°26′23″", () => {
    const c = new Calc({ decimals: 2 });
    expect(c.enter("12 ° 31 ′ 45 ″ + 26 ° 54 ′ 38 ″")).toMatchObject({ entry: "12°31′45″+26°54′38″", result: "39.44" });
    // the conversion pressed first inserts the 13-digit Ans value
    expect(c.enter("▸DMS")).toMatchObject({ entry: "39.43972222221▸DMS", result: "39°26′23″" });
  });

  it("GB-058: DEG (FIX 2) sin(30) → {1/2}", () => expect(res("sin 30 )", { decimals: 2 })).toBe("1/2"));
  it("GB-059: RAD sin({π/6}) → {1/2}", () => expect(res("sin π n/d 6 ► )", { angle: "RAD" })).toBe("1/2"));
  it("GB-060: RAD sin(30°) → {1/2}", () => expect(res("sin 30 ° )", { angle: "RAD" })).toBe("1/2"));
  it("GB-061: DEG sin({π/6}ʳ) → {1/2}", () => expect(new Calc().enter("sin π n/d 6 ► ʳ )")).toMatchObject({ entry: "sin(π/6ʳ)", result: "1/2" }));
});

describe("Rectangular ↔ polar (GB p.20)", () => {
  it("GB-062/063: FIX 1 P▸Rx(5,30) → 4.3, P▸Ry(5,30) → 2.5, R▸Pr(3,4) → 5.0, R▸Pθ(3,4) → 53.1", () => {
    const c = new Calc({ decimals: 1 });
    expect(c.enter("P▸Rx( 5 , 30 )")).toMatchObject({ entry: "P▸Rx(5,30)", result: "4.3" });
    expect(c.res("P▸Ry( 5 , 30 )")).toBe("2.5");
    expect(c.res("R▸Pr( 3 , 4 )")).toBe("5.0");
    expect(c.res("R▸Pθ( 3 , 4 )")).toBe("53.1");
  });
});

describe("Trigonometry (GB p.21–22)", () => {
  it("GB-064: tan(45) → 1", () => expect(res("tan 45 )")).toBe("1"));
  it("GB-065: tan⁻¹(1) → 45", () => expect(res("tan⁻¹ 1 )")).toBe("45"));
  it("GB-066: 5*cos(60) → {5/2}", () => expect(res("5 × cos 60 )")).toBe("5/2"));
  it("GB-067: RAD tan({π/4}) → 1", () => expect(res("tan π n/d 4 ► )", { angle: "RAD" })).toBe("1"));

  it("GB-068: RAD tan⁻¹(1) → 0.785398163; ◂▸ re-enters 0.7853981633975 → {π/4}; ◂▸ again → 0.785398163", () => {
    const c = new Calc({ angle: "RAD" });
    expect(c.res("tan⁻¹ 1 )")).toBe("0.785398163");
    expect(c.toggle()).toMatchObject({ entry: "0.7853981633975◂▸", result: "π/4" });
    expect(c.toggle()).toMatchObject({ entry: "π/4◂▸", result: "0.785398163" });
  });

  it("GB-069: RAD 5*cos({π/4}) → {5√2/2}; ◂▸ → 3.535533906", () => {
    const c = new Calc({ angle: "RAD" });
    const r = c.enter("5 × cos π n/d 4 ► )");
    expect(r.result).toBe("(5√2)/2");
    expect(r.row).toEqual([{ t: "frac", num: [sym("5"), { t: "sqrt", rad: [sym("2")] }], den: [sym("2")] }]);
    expect(c.toggle().result).toBe("3.535533906");
  });

  it("GB-070: FIX 1 tan⁻¹({7/3}) → 66.8; 90−Ans → 23.2; √(3²+7²) → √58; ◂▸ → 7.6", () => {
    const c = new Calc({ decimals: 1 });
    expect(c.res("tan⁻¹ 7 n/d 3 ► )")).toBe("66.8");
    expect(c.enter("90 − ans")).toMatchObject({ entry: "90−Ans", result: "23.2" });
    expect(c.enter("√ 3 x² + 7 x²")).toMatchObject({ entry: "√(3²+7²)", result: "√(58)" });
    expect(c.toggle().result).toBe("7.6");
  });
});

describe("Hyperbolics, logs, exponentials (GB p.22–23, GB06 p.24)", () => {
  it("GB-071: sinh(5)+2 → 76.20321058; sinh⁻¹(5)+2 → 4.312438341", () => {
    expect(new Calc().enter("hyp sin 5 ) + 2")).toMatchObject({ entry: "sinh(5)+2", result: "76.20321058" });
    expect(res("hyp sin⁻¹ 5 ) + 2")).toBe("4.312438341");
  });
  it("GB-072: log(1) → 0", () => expect(res("log 1 )")).toBe("0"));
  it("GB-073: ln(5)*2 → 3.218875825", () => expect(res("ln 5 ) × 2")).toBe("3.218875825"));
  it("GB06-2: ln(15)*2 → 5.416100402", () => expect(res("ln 15 ) × 2")).toBe("5.416100402"));
  it("GB-074: 10^{log(2)} → 2", () => expect(res("10ˣ log 2 )")).toBe("2"));
  it("GB-075: log(10^{5}) → 5", () => expect(res("log 10ˣ 5 ► )")).toBe("5"));
  it("GB-076: e^{.5} → 1.648721271", () => expect(new Calc().enter("eˣ .5")).toMatchObject({ entry: "e^(.5)", result: "1.648721271" }));
});

describe("Statistics (GB p.24–29)", () => {
  const value = (r: ReturnType<typeof oneVarStats>, key: string) => r.items.find((i) => i.key === key)?.value;
  const menu = (x: number | null | undefined) => formatNumberText(x ?? null, DEFAULT_MODES);

  it("GB-077: L1 = 45 55 55 55: n=4, x̄=52.5, Sx=5; x̄ pasted → 52.5; Ans*2 → 105", () => {
    const r = oneVarStats([45, 55, 55, 55], null);
    expect(r.items.slice(0, 3).map((i) => menu(i.value))).toEqual(["4", "52.5", "5"]);
    // remaining items computed from the formulas (M §10.1 note); quartiles by Tukey hinges
    expect(r.items.slice(3).map((i) => menu(i.value))).toEqual(["4.330127019", "210", "11100", "45", "50", "55", "55", "55"]);
    const c = new Calc().useStats(r);
    expect(c.enter("x̄")).toMatchObject({ entry: "x̄", result: "52.5" });
    expect(c.res("× 2")).toBe("105");
  });

  it("GB-078: 2-Var L1 = 45 55, L2 = 30 25: x′(45) → 15 (a = ⁻0.5, b = 52.5, r = ⁻1)", () => {
    const r = twoVarStats([45, 55], [30, 25], null);
    expect([value(r, "stat_a"), value(r, "stat_b"), value(r, "stat_r"), value(r, "stat_minX")]).toEqual([-0.5, 52.5, -1, 45]);
    // [▲]×6 from item 1 wraps to G:x′ (21 items: (0 − 6) mod 21 = 15)
    expect(r.items).toHaveLength(21);
    expect(r.items[15]?.key).toBe("stat_xprime");
    expect(new Calc().useStats(r).enter("x′( 45 )")).toMatchObject({ entry: "x′(45)", result: "15" });
  });

  it("GB-079: FRQ L2 = 1 .5 1 .5: n=3, x̄=11.33333333, Sx=Error; after 11 → 15: x̄=12", () => {
    const r = oneVarStats([12, 13, 10, 11], [1, 0.5, 1, 0.5]);
    expect(r.items.slice(0, 3).map((i) => menu(i.value))).toEqual(["3", "11.33333333", "Error"]);
    const r2 = oneVarStats([12, 13, 10, 15], [1, 0.5, 1, 0.5]);
    expect(r2.items.slice(0, 3).map((i) => menu(i.value))).toEqual(["3", "12", "Error"]);
  });

  it("GB-080: 2-Var: n=4, x̄=56.5, Sx=19.89137166, Σxy=5234.15, a=0.677325190, b=⁻18.6663732, r=0.963411717; y′(55) → 18.58651222", () => {
    const r = twoVarStats([33, 49, 65, 79], [5.3, 14.45, 20.21, 38.45], null);
    const shown = (k: string) => menu(value(r, k));
    expect(["stat_n", "stat_xbar", "stat_Sx", "stat_Sumxy", "stat_a", "stat_b", "stat_r"].map(shown))
      .toEqual(["4", "56.5", "19.89137166", "5234.15", "0.677325190", "⁻18.6663732", "0.963411717"]);
    // computed values from M §10.1
    expect(["stat_sx", "stat_Sumx", "stat_Sumx2", "stat_ybar", "stat_Sy", "stat_sy", "stat_Sumy", "stat_Sumy2", "stat_minX", "stat_maxX", "stat_minY", "stat_maxY"].map(shown))
      .toEqual(["17.22643318", "226", "13956", "19.6025", "13.98459957", "12.11101849", "78.41", "2123.7391", "33", "79", "5.3", "38.45"]);
    const c = new Calc().useStats(r);
    expect(c.enter("y′( 55 )")).toMatchObject({ entry: "y′(55)", result: "18.58651222" });
    // on the home screen a shows as 0.67732519 (GB p.28 text)
    expect(c.res("a")).toBe("0.67732519");
  });
});

describe("Probability (GB p.29–31)", () => {
  it("GB-081: 8 nPr 3 → 336", () => expect(new Calc().enter("8 nPr 3")).toMatchObject({ entry: "8 nPr 3", result: "336" }));
  it("GB-082: 52 nCr 5 → 2598960", () => expect(res("52 nCr 5")).toBe("2598960"));
  it("GB-083: 4! → 24", () => expect(res("4 !")).toBe("24"));

  it("GB-084 – GB-086: 5→rand → 5; rand → 0.000093165; randint(3,5) → 5", () => {
    const c = new Calc();
    expect(c.enter("5 sto rand")).toMatchObject({ entry: "5→rand", result: "5" });
    expect(c.seed).toBe(5);
    expect(c.res("rand")).toBe("0.000093165");
    expect(c.enter("randint( 3 , 5 )")).toMatchObject({ entry: "randint(3,5)", result: "5" });
  });

  it("GB-087: 25 nCr 3 → 2300", () => expect(res("25 nCr 3")).toBe("2300"));
});

describe("Data editor list formulas (GB p.32–33)", () => {
  const ctx = (lists: EvalContext["lists"], listValues?: EvalContext["listValues"]): EvalContext => ({
    modes: DEFAULT_MODES, ans: { re: 0 }, vars: new Calc().vars, lists, statVars: {}, random: () => 0.5,
    ...(listValues ? { listValues } : {}),
  });
  const show = (vs: Value[]) => vs.map((v) => rowText(formatResult(v, DEFAULT_MODES)));

  it("GB-088: L1 = 1/4 2/4 3/4 4/4 shows 1/4 1/2 3/4 1; L2=L1▸F◂▸D → 0.25 0.5 0.75 1", () => {
    const c = new Calc();
    const l1 = ["1 n/d 4", "2 n/d 4", "3 n/d 4", "4 n/d 4"].map((s) => c.enter(s));
    expect(l1.map((r) => r.result)).toEqual(["1/4", "1/2", "3/4", "1"]);
    const values = l1.map((r) => r.value);
    const out = evaluateListFormula([sym("L1"), sym("toFD")], ctx([values.map((v) => v.re), [], []], [values, [], []]), 1);
    expect(out.map((v) => v.re)).toEqual([0.25, 0.5, 0.75, 1]);
    expect(out.every((v) => !v.exact || v.exact.d === 1n)).toBe(true);
    expect(show(out)).toEqual(["0.25", "0.5", "0.75", "1"]);
  });

  it("GB-089: L2 = 9/5×L1+32 on L1 = 8 ⁻1 4 → 46.4 30.2 39.2; appending 21 adds 69.8", () => {
    const f = new Calc().type("9 ÷ 5 × L1 + 32");
    expect(evaluateListFormula(f, ctx([[8, -1, 4], [], []]), 1).map((v) => v.re)).toEqual([46.4, 30.2, 39.2]);
    expect(evaluateListFormula(f, ctx([[8, -1, 4, 21], [], []]), 1).map((v) => v.re)).toEqual([46.4, 30.2, 39.2, 69.8]);
  });
});

describe("Function table (GB p.34–35)", () => {
  const ctx: EvalContext = { modes: DEFAULT_MODES, ans: { re: 0 }, vars: new Calc().vars, lists: [[], [], []], statVars: {}, random: () => 0.5 };
  const table = (seq: string, xs: number[]) => {
    const f = new Calc().type(seq);
    return xs.map((x) => rowText(formatResult(evalFunctionAt(f, x, ctx), DEFAULT_MODES)));
  };

  it("GB-090: y=x(36−x), Start 15, Step 3 → 315, 324, 315", () => {
    expect(rowText(new Calc().type("var ( 36 − var )"))).toBe("x(36−x)");
    expect(table("var ( 36 − var )", [15, 18, 21])).toEqual(["315", "324", "315"]);
  });

  it("GB-091: y=3600−450x, Ask-x 2, 7, 8 → 2700, 450, 0", () => {
    expect(table("3600 − 450 var", [2, 7, 8])).toEqual(["2700", "450", "0"]);
  });
});

describe("Constant K entries (GB p.35–36): the router composes the entry, the engine evaluates it", () => {
  it("GB-092: K=*2+3: 4*2+3 → 11, 6*2+3 → 15", () => {
    expect(res("4 × 2 + 3")).toBe("11");
    expect(res("6 × 2 + 3")).toBe("15");
  });
  it("GB-093: K=²: 5² → 25, 20² → 400", () => {
    expect(res("5 x²")).toBe("25");
    expect(res("20 x²")).toBe("400");
  });
  it("GB-094: 1+1 → 2", () => expect(res("1 + 1")).toBe("2"));
  it("GB-095: K=*5−2: ⁻5*5−2 → ⁻27, ⁻1*5−2 → ⁻7", () => {
    expect(new Calc().enter("(−) 5 × 5 − 2")).toMatchObject({ entry: "⁻5*5−2", result: "⁻27" });
    expect(res("(−) 1 × 5 − 2")).toBe("⁻7");
  });
});
