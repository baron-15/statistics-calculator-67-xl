/**
 * EOS precedence (M §1, K §4.15) and the exact/decimal rules (M §3, SPEC decision 3). Lines marked
 * SPEC: assumption pin choices made where the research is [unverified].
 */
import { describe, expect, it } from "vitest";
import { Calc, CL, res } from "./helpers";

describe("EOS precedence (M §1.2)", () => {
  it("negation is below powers: ⁻2² = ⁻4, (⁻2)² = 4, ⁻5² = ⁻25 (TG p.45, p.101)", () => {
    expect(res("(−) 2 x²")).toBe("⁻4");
    expect(res("( (−) 2 ) x²")).toBe("4");
    expect(res("(−) 5 x²")).toBe("⁻25");
  });

  it("x² chains left to right: 3²² = 81 (GB p.8)", () => expect(res("3 x² x²")).toBe("81"));

  it("implied × has the same level as ÷: 1÷2(3) = 1.5 (SPEC: assumption, M §1.2 [unverified])", () => {
    expect(res("1 ÷ 2 ( 3 )")).toBe("1.5");
  });

  it("nCr binds tighter than ×: 2*5 nCr 2 = 20", () => expect(res("2 × 5 nCr 2")).toBe("20"));
  it("implied × before a negation: 2⁻3 = ⁻6 (SPEC: assumption)", () => expect(res("2 (−) 3")).toBe("⁻6"));
  it("Classic exponent can be negated: 2^⁻3 → 1⁄8", () => expect(res("2 ^ (−) 3", CL)).toBe("1⁄8"));
  it("a run of MathPrint exponents is right-associative: 2^{3}^{2} = 512", () => expect(res("2 ^ 3 ► ^ 2")).toBe("512"));
  it("x² after an exponent squares the power: 2^{3}² = 64", () => expect(res("2 ^ 3 ► x²")).toBe("64"));
  it("postfix binds tighter than Classic ^: 2^3² = 512", () => expect(res("2 ^ 3 x²", CL)).toBe("512"));
  it("× 10ⁿ is a literal ×10^n: 2*10³ = 2000", () => expect(res("2 ×10ⁿ 3")).toBe("2000"));
  it("implied × with π, functions and templates: 2π, 2sin(30), 2√2", () => {
    expect(res("2 π")).toBe("2π");
    expect(res("2 sin 30 )")).toBe("1");
    expect(res("2 √ 2")).toBe("2√2");
  });
  it("x(36−x) with x = 5 → 155", () => {
    const c = new Calc();
    c.enter("5 sto var");
    expect(c.res("var ( 36 − var )")).toBe("155");
  });
  it("enter closes open parentheses: (1+2 → 3, sin(cos(0 → …", () => {
    expect(res("( 1 + 2")).toBe("3");
    expect(res("sin 90")).toBe("1");
  });
  it("conversions apply to the whole expression: 1+1⁄4▸F◂▸D → 1.25", () => expect(res("1 + 1 n/d 4 ► ▸F◂▸D")).toBe("1.25"));
  it("DMS parts written together are added; separate angles multiply as usual", () => {
    expect(res("1 ° 30 ′")).toBe("1.5");
    expect(res("1 ° 30 ′ 36 ″")).toBe("1.51");
  });
  it("pending limits: 8 pending values are fine, 9 is SYNTAX; 24 open parentheses is MEMORY LIMIT (SPEC: assumption)", () => {
    expect(res("1 + ( 2 + ( 3 + ( 4 + ( 5 + ( 6 + ( 7 + ( 8 + 1")).toBe("37");
    expect(() => res("1 + ( 2 + ( 3 + ( 4 + ( 5 + ( 6 + ( 7 + ( 8 + ( 9 + 1")).toThrow("SYNTAX");
    expect(res("(×23 1")).toBe("1");
    expect(() => res("(×24 1")).toThrow("MEMORY LIMIT");
  });
});

describe("exact vs decimal results (M §3)", () => {
  it("÷ is decimal division (TG p.73); an integer quotient stays exact (SPEC: assumption)", () => {
    expect(res("1 ÷ 2")).toBe("0.5");
    expect(res("2 ÷ 3")).toBe("0.666666667");
    expect(res("6 ÷ 2 × π")).toBe("3π");
  });

  it("a decimal point anywhere forces a decimal: 2.0π (TG p.113)", () => expect(res("2.0 π")).toBe("6.283185307"));

  it("radicals simplify: √12 → 2√3, √(1/2) → √2/2, (√2)⁻¹ → √2/2", () => {
    expect(res("√ 12")).toBe("2√3");
    expect(res("√ 1 n/d 2")).toBe("√2/2");
    expect(res("√ 2 ► x⁻¹")).toBe("√2/2");
    expect(res("√ 2 ► √ 3")).toBe("√6");
    expect(res("√ 2 ► √ 2")).toBe("2");
  });

  it("forms the device is not known to show become decimals (M §3.5): π², √2·π, 1+√2", () => {
    expect(res("π × π")).toBe("9.869604401");
    expect(res("√ 2 ► π")).toBe("4.442882938");
    expect(res("1 + √ 2")).toBe("2.414213562");
    expect(res("π n/d π")).toBe("1");
  });

  it("fraction size limits: denominator ≤ 1000 and |numerator| < 10⁶ (SPEC: assumption, M §3.2)", () => {
    expect(res("1 n/d 1000")).toBe("1/(1000)");
    expect(res("1 n/d 1001")).toBe("0.000999001");
    expect(res("999998 n/d 7")).toBe("(999998)/7");
    expect(res("1000000 n/d 7")).toBe("142857.1429");
    expect(res("2 ^ (−) 10")).toBe("0.000976563");
  });

  it("rational exponents stay exact when the root is: 4^{1/2} = 2, 8^{2/3} = 4, 2^{1/2} = √2", () => {
    expect(res("4 ^ 1 n/d 2")).toBe("2");
    expect(res("8 ^ 2 n/d 3")).toBe("4");
    expect(res("2 ^ 1 n/d 2")).toBe("√2");
    expect(res("2 ^ 0.5")).toBe("1.414213562");
  });

  it("exact logs of powers of ten: log(1000) = 3, log(1/100) = ⁻2", () => {
    expect(res("log 1000 )")).toBe("3");
    expect(res("log 1 n/d 100 ► )")).toBe("⁻2");
    expect(res("log 2 )")).toBe("0.301029996");
  });

  it("×10ⁿ with a negative exponent is an exact power of ten: 5*10⁻³ → 1/200 (SPEC: assumption)", () => {
    expect(res("5 ×10ⁿ (−) 3")).toBe("1/(200)");
  });

  it("Classic keeps fractions but shows √, π and trig as decimals (GB p.4, TG p.53)", () => {
    expect(res("1 n/d 2 + 1 n/d 3", CL)).toBe("5⁄6");
    expect(res("√ 8", CL)).toBe("2.828427125");
    expect(res("π", CL)).toBe("3.141592654");
    expect(res("sin 30 )", CL)).toBe("0.5");
    expect(res("2 x⁻¹", CL)).toBe("1⁄2");
    expect(res("10ˣ (−) 2", CL)).toBe("1⁄100");
    expect(res("eˣ 1", CL)).toBe("2.718281828");
  });

  it("a radical stored in MathPrint reads back as a decimal in Classic", () => {
    const c = new Calc();
    c.enter("√ 2 ► sto var");
    c.setModes({ display: "CLASSIC" });
    expect(c.res("var")).toBe("1.414213562");
  });
});

describe("exact trigonometry (TG p.123)", () => {
  it("DEG multiples of 30° and 45° give fractions and radicals", () => {
    const cases: [string, string][] = [
      ["sin 45 )", "√2/2"], ["cos 30 )", "√3/2"], ["tan 30 )", "√3/3"], ["tan 60 )", "√3"], ["sin 120 )", "√3/2"],
      ["sin 210 )", "⁻1/2"], ["cos 135 )", "⁻√2/2"], ["tan (−) 45 )", "⁻1"], ["cos 360 )", "1"], ["sin (−) 90 )", "⁻1"],
    ];
    for (const [s, want] of cases) expect(res(s), s).toBe(want);
  });

  it("15° needs a sum of radicals, so it is a decimal", () => expect(res("sin 15 )")).toBe("0.258819045"));

  it("RAD multiples of π/12: sin(π) = 0, cos(2π/3) = ⁻1/2", () => {
    expect(res("sin π )", { angle: "RAD" })).toBe("0");
    expect(res("cos 2 π n/d 3 ► )", { angle: "RAD" })).toBe("⁻1/2");
  });

  it("GRAD has no exact trig (TG p.123 names DEG and RAD only)", () => expect(res("sin 50 )", { angle: "GRAD" })).toBe("0.707106781"));

  it("angle marks convert into the mode's unit, exactly when possible", () => {
    expect(res("30 °", { angle: "RAD" })).toBe("π/6"); // SPEC: assumption (exact π form for a converted angle)
    expect(res("π ʳ")).toBe("180");
    expect(res("90 °", { angle: "GRAD" })).toBe("100");
    expect(res("100 ᵍ")).toBe("90");
  });

  it("inverse trig is decimal, in the mode's unit", () => {
    expect(res("tan⁻¹ 1 )", { angle: "GRAD" })).toBe("50");
    expect(res("sin⁻¹ 1 )", { angle: "RAD" })).toBe("1.570796327");
  });

  it("R▸Pθ uses atan2: (⁻1,0) → 180, (0,0) → 0 (SPEC: assumption)", () => {
    expect(res("R▸Pθ( (−) 1 , 0 )")).toBe("180");
    expect(res("R▸Pθ( 0 , 0 )")).toBe("0");
    expect(res("R▸Pθ( 1 , 1 )", { angle: "RAD" })).toBe("0.785398163");
  });
});

describe("conversions (GB p.13–19)", () => {
  it("▸n/d◂▸Un/d: improper → mixed, mixed → improper, decimals via their fraction", () => {
    expect(res("(−) 9 n/d 2 ► ▸n/d◂▸Un/d")).toBe("⁻4⌴1/2");
    expect(res("4 Un/d 1 ▼ 2 ► ▸n/d◂▸Un/d")).toBe("9/2");
    expect(res("2.5 ▸n/d◂▸Un/d")).toBe("2⌴1/2");
    expect(res("1 n/d 2 ► ▸n/d◂▸Un/d")).toBe("1/2");
  });

  it("▸F◂▸D: exact → decimal, decimal → fraction when one matches, else unchanged", () => {
    expect(res("√ 2 ► ▸F◂▸D")).toBe("1.414213562");
    expect(res("0.1234567 ▸F◂▸D")).toBe("0.1234567");
    expect(res("5 ▸F◂▸D")).toBe("5");
  });

  it("▸% shows the value ×100 with %; it follows FIX (TG p.45)", () => {
    expect(res("1 n/d 3 ► ▸%")).toBe("33.33333333%");
    expect(res("0.125 ▸%")).toBe("12.5%");
    expect(res("0.125 ▸%", { decimals: 2 })).toBe("12.50%");
  });

  it("▸% and ▸DMS change the display only: Ans keeps the value", () => {
    const c = new Calc();
    c.enter("1 n/d 5 ► ▸%");
    expect(c.res("ans × 10")).toBe("2");
  });

  it("▸DMS rounds seconds to fit 10 digits (FLOAT) or FIX decimals (SPEC: assumption, M §11.9)", () => {
    expect(res("1.2345 ▸DMS")).toBe("1°14′4.2″");
    expect(res("1.2345 ▸DMS", { decimals: 0 })).toBe("1°14′4″");
    expect(res("(−) 1.5 ▸DMS")).toBe("⁻1°30′0″");
    expect(res("10.999999 ▸DMS")).toBe("10°59′59.9964″");
  });
});
