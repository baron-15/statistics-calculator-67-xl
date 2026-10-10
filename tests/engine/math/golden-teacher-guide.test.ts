/**
 * Golden tests: the Teacher Guide screenshots (TG, M §10.2), its text-only activities (TG-A1…A4) and
 * the TI Knowledge Base examples (M §10.3). Same conventions as golden-guidebook.test.ts.
 */
import { describe, expect, it } from "vitest";
import { rowText } from "../../../src/engine/expr";
import {
  evalFunctionAt, evaluateListFormula, formatNumberText, formatResult, oneVarStats, randNext, twoVarStats,
  type EvalContext, type StatResults,
} from "../../../src/engine/math";
import { Calc, CL, DEFAULT_MODES, res } from "./helpers";

const menu = (r: StatResults, keys: string[]) =>
  keys.map((k) => formatNumberText(r.items.find((i) => i.key === k)?.value ?? null, DEFAULT_MODES));

describe("History, fractions and editing (TG p.31–47)", () => {
  it("TG-01 p.31: 46−23 → 23; 41−26 → 15; {2/5}+{3/10} → {7/10}", () => {
    const c = new Calc();
    expect(c.res("46 − 23")).toBe("23");
    expect(c.res("41 − 26")).toBe("15");
    expect(c.res("2 n/d 5 ► + 3 n/d 10")).toBe("7/(10)");
  });

  it("TG-03 p.38: 5²+12² → 169; √(Ans) → 13", () => {
    const c = new Calc();
    expect(c.enter("5 x² + 12 x²")).toMatchObject({ entry: "5²+12²", result: "169" });
    expect(c.enter("√ ans")).toMatchObject({ entry: "√Ans", result: "13" });
  });

  it("TG-04 p.39: √8 → 2√2; ◂▸ → 2.828427125", () => {
    const c = new Calc();
    expect(c.res("√ 8")).toBe("2√2");
    expect(c.toggle().result).toBe("2.828427125");
  });

  it("TG-05 p.42: 459+2865 → 3324", () => expect(res("459 + 2865")).toBe("3324"));

  it("TG-07 p.46: 2+54−6 → 50; 16*21 → 336; {1/2}*10 → 5; 12*(5+6) → 132", () => {
    expect(["2 + 54 − 6", "16 × 21", "1 n/d 2 ► × 10", "12 × ( 5 + 6 )"].map((s) => res(s))).toEqual(["50", "336", "5", "132"]);
  });

  it("TG-08 p.47: ⁻3+12 → 9", () => expect(res("(−) 3 + 12")).toBe("9"));
  it("TG-09 p.48: 15%*80 → 12", () => expect(res("15 % × 80")).toBe("12"));

  it("TG-10 p.52: 1+2*3 → 7; 1+(2*3) → 7; (1+2)*3 → 9", () => {
    expect(["1 + 2 × 3", "1 + ( 2 × 3 )", "( 1 + 2 ) × 3"].map((s) => res(s))).toEqual(["7", "7", "9"]);
  });
});

describe("Classic vs MathPrint radicals (TG p.53)", () => {
  it("TG-11a: Classic √(5²−4(1)(3) (no closing paren) → 3.605551275", () => {
    expect(new Calc(CL).enter("√ 5 x² − 4 ( 1 ) ( 3 )")).toMatchObject({ entry: "√(5²−4(1)(3)", result: "3.605551275" });
  });

  it("TG-11b/c: MathPrint √(5²−4(1)(3)) → √13; ◂▸ → 3.605551275", () => {
    const c = new Calc();
    expect(c.res("√ 5 x² − 4 ( 1 ) ( 3 )")).toBe("√(13)");
    expect(c.toggle()).toMatchObject({ entry: "√(13)◂▸", result: "3.605551275" });
  });
});

describe("Notation and decimal modes (TG p.56–66)", () => {
  it("TG-12 p.56–57: 12543 in NORM, SCI, ENG, NORM", () => {
    const c = new Calc();
    expect(c.res("12543")).toBe("12543");
    expect(c.setModes({ notation: "SCI" }).rerun().result).toBe("1.2543*10^4");
    expect(c.setModes({ notation: "ENG" }).rerun().result).toBe("12.543*10^3");
    expect(c.setModes({ notation: "NORM" }).rerun().result).toBe("12543");
  });

  it("TG-13 p.58: 7.8*10⁸−1.5*10⁸ → 630000000 (9 digits stay in NORM)", () => {
    expect(new Calc().enter("7.8 ×10ⁿ 8 ► − 1.5 ×10ⁿ 8")).toMatchObject({ entry: "7.8*10^8−1.5*10^8", result: "630000000" });
  });

  it("TG-17 p.66: 12.345 in FLOAT, FIX 2 → 12.35 (half up), FIX 1 → 12.3, FLOAT", () => {
    const c = new Calc();
    expect(c.res("12.345")).toBe("12.345");
    expect(c.setModes({ decimals: 2 }).rerun().result).toBe("12.35");
    expect(c.setModes({ decimals: 1 }).rerun().result).toBe("12.3");
    expect(c.setModes({ decimals: "FLOAT" }).rerun().result).toBe("12.345");
  });
});

describe("Fractions and conversions (TG p.61–63)", () => {
  it("TG-14 p.61: {5/6}+{1/10} → {14/15}", () => expect(res("5 n/d 6 ► + 1 n/d 10")).toBe("(14)/(15)"));

  it("TG-15 p.62: 4{3/8}+2{3/4} → {57/8}; ▸n/d◂▸Un/d on the answer → 7{1/8}", () => {
    const c = new Calc();
    expect(c.res("4 Un/d 3 ▼ 8 ► + 2 Un/d 3 ▼ 4")).toBe("(57)/8");
    expect(c.enter("▸n/d◂▸Un/d")).toMatchObject({ entry: "(57)/8▸n/d◂▸Un/d", result: "7⌴1/8" });
  });

  it("TG-16 p.63: 5{3/4}▸F◂▸D → 5.75; 2.25▸F◂▸D → {9/4}; 2.25 then ◂▸ → {9/4}", () => {
    expect(res("5 Un/d 3 ▼ 4 ► ▸F◂▸D")).toBe("5.75");
    expect(res("2.25 ▸F◂▸D")).toBe("9/4");
    const c = new Calc();
    expect(c.res("2.25")).toBe("2.25");
    expect(c.toggle()).toMatchObject({ entry: "2.25◂▸", result: "9/4" });
  });
});

describe("Constant and memory (TG p.68–77)", () => {
  it("TG-18 p.68–69: K=*5.25: 16 → 84, 12 → 63, 17 → 89.25", () => {
    expect(["16 × 5.25", "12 × 5.25", "17 × 5.25"].map((s) => res(s))).toEqual(["84", "63", "89.25"]);
  });

  it("TG-19 p.72–73: test averages", () => {
    const c = new Calc();
    expect(c.res("96 + 76 + 85")).toBe("257");
    expect(c.enter("÷ 3")).toMatchObject({ entry: "Ans÷3", result: "85.66666667" });
    expect(c.enter("sto var")).toMatchObject({ entry: "Ans→x", result: "85.66666667" });
    expect(c.res("92 + 83 + 97 + 86")).toBe("358");
    expect(c.res("÷ 4")).toBe("89.5");
    expect(c.enter("+ var")).toMatchObject({ entry: "Ans+x", result: "175.1666667" });
    expect(c.res("÷ 2")).toBe("87.58333333");
  });

  it("TG-20 p.74–75: 4.5→x; 2+x(1.40) → 8.3; 3+x(1.10) → 7.95; 3.2→x; re-run → 6.48, 6.52", () => {
    const c = new Calc();
    expect(c.res("4.5 sto var")).toBe("4.5");
    const e1 = c.type("2 + var ( 1.40 )");
    const e2 = c.type("3 + var ( 1.10 )");
    expect(c.run(e1)).toMatchObject({ entry: "2+x(1.40)", result: "8.3" });
    expect(c.run(e2).result).toBe("7.95");
    expect(c.res("3.2 sto var")).toBe("3.2");
    expect(c.run(e1).result).toBe("6.48");
    expect(c.run(e2).result).toBe("6.52");
  });

  it("TG-21 p.76–77: 27.96→x, 23.94→y, 16.96→z; recalled values 27.96+23.94+16.96 → 68.86", () => {
    const c = new Calc();
    expect(c.res("2 × 13.98")).toBe("27.96");
    c.enter("sto var");
    expect(c.res("3 × 7.98")).toBe("23.94");
    c.enter("sto var var");
    expect(c.res("6.98 + 9.98")).toBe("16.96");
    c.enter("sto var var var");
    expect([c.vars.x, c.vars.y, c.vars.z].map((v) => formatNumberText(v.re, c.modes))).toEqual(["27.96", "23.94", "16.96"]);
    expect(c.enter("rcl:x + rcl:y + rcl:z")).toMatchObject({ entry: "27.96+23.94+16.96", result: "68.86" });
  });
});

describe("Statistics (TG p.84–88)", () => {
  it("TG-23 p.85: L1 = 85 97 53 77, FRQ L2 = 2 1 1 1: all 11 items (quartile evidence)", () => {
    const r = oneVarStats([85, 97, 53, 77], [2, 1, 1, 1]);
    expect(r.items.map((i) => i.key)).toEqual([
      "stat_n", "stat_xbar", "stat_Sx", "stat_sx", "stat_Sumx", "stat_Sumx2", "stat_minX", "stat_Q1", "stat_Med", "stat_Q3", "stat_maxX",
    ]);
    expect(r.items.map((i) => formatNumberText(i.value, DEFAULT_MODES)))
      .toEqual(["5", "79.4", "16.39512123", "14.66424222", "397", "32597", "53", "77", "85", "85", "97"]);
  });

  it("TG-24 p.86: after deleting 53: n=4, x̄=86, Sx=8.246211251", () => {
    expect(menu(oneVarStats([85, 97, 77], [2, 1, 1]), ["stat_n", "stat_xbar", "stat_Sx"])).toEqual(["4", "86", "8.246211251"]);
  });

  it("TG-25 p.87–88: L1 = 58 47, L2 = 35 28: y′(32) → 18.45454545", () => {
    const c = new Calc().useStats(twoVarStats([58, 47], [35, 28], null));
    expect(c.res("y′( 32 )")).toBe("18.45454545");
  });

  it("TG-A4 p.7–8: heart rates with frequencies: n=22, x̄=62.27272727, Σx=1370", () => {
    const r = oneVarStats([60, 61, 62, 63, 64, 65], [3, 5, 6, 3, 1, 4]);
    expect(menu(r, ["stat_n", "stat_xbar", "stat_Sumx"])).toEqual(["22", "62.27272727", "1370"]);
  });
});

describe("Probability (TG p.90–95)", () => {
  it("TG-26/27/28: 4 nCr 2 → 6; 4 nPr 2 → 12; 4! → 24", () => {
    expect(["4 nCr 2", "4 nPr 2", "4 !"].map((s) => res(s))).toEqual(["6", "12", "24"]);
  });

  it("TG-29 p.93: a consecutive pair 0.390926039, 0.514541293 (seed 665000)", () => {
    const c = new Calc();
    c.seed = 665000;
    expect([c.res("rand"), c.res("rand")]).toEqual(["0.390926039", "0.514541293"]);
  });

  it("TG-30 p.94: 1→rand → 1; rand → 0.000018633; rand → 0.745579721", () => {
    const c = new Calc();
    expect(c.res("1 sto rand")).toBe("1");
    expect(c.res("rand")).toBe("0.000018633");
    expect(c.rerun().result).toBe("0.745579721");
  });

  it("TG-31 p.95: randint(2,10) gives integers 2…10 (results vary)", () => {
    const c = new Calc();
    for (let i = 0; i < 50; i++) {
      const v = Number(c.res("randint( 2 , 10 )"));
      expect(Number.isInteger(v) && v >= 2 && v <= 10).toBe(true);
    }
  });

  it("the generator is x ← 40014·x mod 2147483563", () => {
    expect(randNext(5)).toEqual({ value: 200070 / 2147483563, seed: 200070 });
  });
});

describe("List formula and function table (TG p.80–81, p.98–100)", () => {
  const ctx = (lists: EvalContext["lists"] = [[], [], []]): EvalContext => ({
    modes: DEFAULT_MODES, ans: { re: 0 }, vars: new Calc().vars, lists, statVars: {}, random: () => 0.5,
  });
  const table = (seq: string, xs: number[]) => {
    const f = new Calc().type(seq);
    return xs.map((x) => rowText(formatResult(evalFunctionAt(f, x, ctx()), DEFAULT_MODES)));
  };

  it("TG-22 p.80–81: L2=9/5×L1+32 → 46.4 30.2 39.2, then 69.8 for 21", () => {
    const f = new Calc().type("9 ÷ 5 × L1 + 32");
    expect(evaluateListFormula(f, ctx([[8, -1, 4, 21], [], []]), 1).map((v) => v.re)).toEqual([46.4, 30.2, 39.2, 69.8]);
  });

  it("TG-32 p.98–99: y=x(36−x): Step 4 rows 12 16 20 → 288 320 320; Start 15 Step 1 rows 17 18 19 → 323 324 323", () => {
    expect(table("var ( 36 − var )", [12, 16, 20])).toEqual(["288", "320", "320"]);
    expect(table("var ( 36 − var )", [17, 18, 19])).toEqual(["323", "324", "323"]);
  });

  it("TG-33 p.100: y=3600−450x, Ask-x 6 7 8 → 900 450 0", () => {
    expect(table("3600 − 450 var", [6, 7, 8])).toEqual(["900", "450", "0"]);
  });
});

describe("Powers, roots, logs (TG p.102–111)", () => {
  it("TG-34 p.102: 27.4² → 750.76 (also 27.4^2)", () => {
    expect(res("27.4 x²")).toBe("750.76");
    expect(res("27.4 ^ 2")).toBe("750.76");
  });

  it("TG-35 p.103: √3 → √3; ◂▸ → 1.732050808; FIX 0 re-run of √3◂▸ → 2", () => {
    const c = new Calc();
    expect(c.res("√ 3")).toBe("√3");
    expect(c.toggle()).toMatchObject({ entry: "√3◂▸", result: "1.732050808" });
    expect(c.setModes({ decimals: 0 }).rerun().result).toBe("2");
  });

  it("TG-36 p.104: 2.3^{3} → 12.167; ◂▸ → {12167/1000}", () => {
    const c = new Calc();
    expect(c.res("2.3 ^ 3")).toBe("12.167");
    expect(c.toggle()).toMatchObject({ entry: "12.167◂▸", result: "(12167)/(1000)" });
  });

  it("TG-37 p.105: 2^{10} → 1024; 2^{15} → 32768", () => {
    expect(res("2 ^ 10")).toBe("1024");
    expect(res("2 ^ 15")).toBe("32768");
  });

  it("TG-38 p.106: ³√(125) → 5", () => expect(res("3 ˣ√ 125")).toBe("5"));

  it("TG-39 p.107: 10⁻¹ → {1/10}; 5⁻¹ → {1/5}; 5{1/3} → {16/3}; Ans⁻¹ → {3/16}", () => {
    expect(res("10 x⁻¹")).toBe("1/(10)");
    expect(res("5 x⁻¹")).toBe("1/5");
    const c = new Calc();
    expect(c.res("5 Un/d 1 ▼ 3 ►")).toBe("(16)/3");
    expect(c.enter("x⁻¹")).toMatchObject({ entry: "Ans⁻¹", result: "3/(16)" });
  });

  it("TG-40 p.110: log(23) → 1.361727836; FIX 4 → 1.3617; ln(23) → 3.1355; FLOAT → 3.135494216", () => {
    const c = new Calc();
    expect(c.res("log 23 )")).toBe("1.361727836");
    expect(c.setModes({ decimals: 4 }).rerun().result).toBe("1.3617");
    expect(c.res("ln 23 )")).toBe("3.1355");
    expect(c.setModes({ decimals: "FLOAT" }).rerun().result).toBe("3.135494216");
  });

  it("TG-41 p.111: 10^{3.9824} → 9602.846792; FIX 4 → 9602.8468; e^{3.9824} → 53.6456; FLOAT → 53.64562936", () => {
    const c = new Calc();
    expect(c.res("10ˣ 3.9824")).toBe("9602.846792");
    expect(c.setModes({ decimals: 4 }).rerun().result).toBe("9602.8468");
    expect(c.res("eˣ 3.9824")).toBe("53.6456");
    expect(c.setModes({ decimals: "FLOAT" }).rerun().result).toBe("53.64562936");
  });
});

describe("Pi (TG p.113–116)", () => {
  it("TG-42 p.114: 2*π*1.5 → 9.424777961; ◂▸ re-enters 9.42477796077 → 3π", () => {
    const c = new Calc();
    expect(c.res("2 × π × 1.5")).toBe("9.424777961");
    expect(c.toggle()).toMatchObject({ entry: "9.42477796077◂▸", result: "3π" });
  });

  it("TG-43 p.115–116: π*4² → 16π; FIX 0 ◂▸ → 50; FLOAT re-run → 50.26548246", () => {
    const c = new Calc();
    expect(c.enter("π × 4 x²")).toMatchObject({ entry: "π*4²", result: "16π" });
    c.setModes({ decimals: 0 });
    expect(c.toggle()).toMatchObject({ entry: "16π◂▸", result: "50" });
    expect(c.setModes({ decimals: "FLOAT" }).rerun().result).toBe("50.26548246");
  });
});

describe("Angles (TG p.118–122)", () => {
  it("TG-44 p.118: 45°30′+36°15′ → 81.75; 180°−Ans → 98.25; ▸DMS → 98°15′0″", () => {
    const c = new Calc();
    expect(c.res("45 ° 30 ′ + 36 ° 15 ′")).toBe("81.75");
    expect(c.enter("180 ° − ans")).toMatchObject({ entry: "180°−Ans", result: "98.25" });
    expect(c.enter("▸DMS")).toMatchObject({ entry: "98.25▸DMS", result: "98°15′0″" });
  });

  it("TG-45 p.119: 39.55°▸DMS → 39°33′0″; 116.20°▸DMS → 116°12′0″", () => {
    expect(res("39.55 ° ▸DMS")).toBe("39°33′0″");
    expect(new Calc().enter("116.20 ° ▸DMS")).toMatchObject({ entry: "116.20°▸DMS", result: "116°12′0″" });
  });

  it("TG-46 p.120: DEG cos(180°), cos(πʳ), cos(200ᵍ) → ⁻1", () => {
    expect(["cos 180 ° )", "cos π ʳ )", "cos 200 ᵍ )"].map((s) => res(s))).toEqual(["⁻1", "⁻1", "⁻1"]);
  });

  it("TG-47 p.122: P▸Rx(7,30) → 6.062177826; P▸Ry(7,30) → 3.5", () => {
    expect(res("P▸Rx( 7 , 30 )")).toBe("6.062177826");
    expect(res("P▸Ry( 7 , 30 )")).toBe("3.5");
  });
});

describe("Trigonometry applications (TG p.124–132)", () => {
  const twice = (seq: string, fix: 0 | 1) => {
    const c = new Calc();
    const a = c.res(seq);
    return [a, c.setModes({ decimals: fix }).rerun().result];
  };

  it("TG-48 p.124: {78/tan(27°)} → 153.0836194; FIX 0 → 153", () => {
    expect(twice("78 n/d tan 27 ° )", 0)).toEqual(["153.0836194", "153"]);
  });
  it("TG-49 p.125: tan⁻¹({600/2500}) → 13.49573328; FIX 1 → 13.5", () => {
    expect(twice("tan⁻¹ 600 n/d 2500 ► )", 1)).toEqual(["13.49573328", "13.5"]);
  });
  it("TG-50 p.126: 5*cos(74) → 1.378186779; FIX 0 → 1", () => {
    expect(twice("5 × cos 74 )", 0)).toEqual(["1.378186779", "1"]);
  });
  it("TG-51 p.127: cos⁻¹({453/500}) → 25.04169519; FIX 1 → 25.0", () => {
    expect(twice("cos⁻¹ 453 n/d 500 ► )", 1)).toEqual(["25.04169519", "25.0"]);
  });
  it("TG-52 p.128: {1.5/sin(12)} → 7.214601517; FIX 0 → 7", () => {
    expect(twice("1.5 n/d sin 12 )", 0)).toEqual(["7.214601517", "7"]);
  });
  it("TG-53 p.129: sin⁻¹({13/20}) → 40.54160187; FIX 1 → 40.5", () => {
    expect(twice("sin⁻¹ 13 n/d 20 ► )", 1)).toEqual(["40.54160187", "40.5"]);
  });

  it("TG-54 p.132: sinh, cosh, tanh of 2 and their inverses on Ans → 2", () => {
    const c = new Calc();
    expect(c.res("hyp sin 2 )")).toBe("3.626860408");
    expect(c.enter("hyp sin⁻¹ ans )")).toMatchObject({ entry: "sinh⁻¹(Ans)", result: "2" });
    expect(c.res("hyp cos 2 )")).toBe("3.762195691");
    expect(c.res("hyp cos⁻¹ ans )")).toBe("2");
    expect(c.res("hyp tan 2 )")).toBe("0.96402758");
    expect(c.res("hyp tan⁻¹ ans )")).toBe("2");
  });
});

describe("Scientific-notation activities (TG p.3–4, text only)", () => {
  it("TG-A1 (SCI): 12000000, 974000000, 0.0000034, 0.000000004", () => {
    const sci = { notation: "SCI" } as const;
    expect(["12000000", "974000000", "0.0000034", "0.000000004"].map((s) => res(s, sci)))
      .toEqual(["1.2*10^7", "9.74*10^8", "3.4*10^(⁻6)", "4*10^(⁻9)"]);
  });

  it("TG-A2 (NORM): 5.8×10⁷, 7.32×10⁵, 6.2×10⁻⁶, 3×10⁻⁸", () => {
    expect(["5.8 ×10ⁿ 7", "7.32 ×10ⁿ 5", "6.2 ×10ⁿ (−) 6", "3 ×10ⁿ (−) 8"].map((s) => res(s)))
      .toEqual(["58000000", "732000", "0.0000062", "0.00000003"]);
  });

  it("TG-A3 (SCI): 2.5×10¹³+9.3×10⁷ → 2.5000093×10¹³; {Ans/6×10¹²} → 4.166682167×10⁰", () => {
    const c = new Calc({ notation: "SCI" });
    expect(c.res("2.5 ×10ⁿ 13 ► + 9.3 ×10ⁿ 7")).toBe("2.5000093*10^(13)");
    // TG prints 4.166682167; SPEC: assumption that SCI shows the ×10⁰ (M §10.2 [unverified])
    expect(c.res("ans n/d 6 ×10ⁿ 12")).toBe("4.166682167*10^0");
  });
});

describe("Knowledge Base (M §10.3)", () => {
  it("KB-1 (KB 31772): L1 = 50 64 87 3 95", () => {
    expect(menu(oneVarStats([50, 64, 87, 3, 95], null), ["stat_n", "stat_xbar", "stat_Sx", "stat_sx", "stat_Sumx", "stat_Sumx2"]))
      .toEqual(["5", "59.8", "36.46505176", "32.61533382", "299", "23199"]);
  });

  it("KB-2 (KB 12280): L1 = 1 2 3: Sx=1, σx=0.816496581", () => {
    expect(menu(oneVarStats([1, 2, 3], null), ["stat_Sx", "stat_sx"])).toEqual(["1", "0.816496581"]);
  });

  it("KB-3 (KB 20469): ×10ⁿ takes part in EOS: 6ᴇ5÷2ᴇ3 = 3×10⁸ without parentheses, 300 with", () => {
    expect(res("6 ×10ⁿ 5 ► ÷ 2 ×10ⁿ 3")).toBe("300000000");
    expect(res("6 ×10ⁿ 5 ► ÷ ( 2 ×10ⁿ 3 ► )")).toBe("300");
    // K §4.13: 2*10³÷4*10⁴ → 5000000, 2*10³÷(4*10⁴) → 0.05
    expect(res("2 ×10ⁿ 3 ► ÷ 4 ×10ⁿ 4")).toBe("5000000");
    expect(res("2 ×10ⁿ 3 ► ÷ ( 4 ×10ⁿ 4 ► )")).toBe("0.05");
  });
});
