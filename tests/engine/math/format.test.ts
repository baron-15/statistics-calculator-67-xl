/**
 * Result formatting (M §2, K §4.16–4.17): the 10-digit window, FIX, SCI/ENG, the switch to
 * scientific notation, exact rows, the ◂▸ toggle, the 13-digit answer row and restricted-context text.
 */
import { describe, expect, it } from "vitest";
import { rowText, sym } from "../../../src/engine/expr";
import {
  answerRow, formatNumberText, formatResult, toggleForm, type Modes, type Value,
} from "../../../src/engine/math";
import { Calc, CL, DEFAULT_MODES, res } from "./helpers";

const fmt = (re: number, m: Partial<Modes> = {}) => rowText(formatResult({ re }, { ...DEFAULT_MODES, ...m }));

describe("NORM FLOAT: 10 digits, the leading zero counts (M §2.2)", () => {
  it("rounds half up to the 10-digit window and strips zeros", () => {
    expect(fmt(1 / 3)).toBe("0.333333333");
    expect(fmt(0.3333333333333)).toBe("0.333333333");
    expect(fmt(123456789.123)).toBe("123456789.1");
    expect(fmt(9999999999)).toBe("9999999999");
    expect(fmt(-0.5)).toBe("⁻0.5");
    expect(fmt(0)).toBe("0");
  });

  it("switches to ×10ⁿ past 10 integer digits, including by rounding (SPEC: assumption)", () => {
    expect(fmt(9999999999.6)).toBe("1*10^(10)");
    expect(fmt(1e10)).toBe("1*10^(10)");
    expect(fmt(12345678901)).toBe("1.23456789*10^(10)");
  });

  it("keeps positional form down to 1E−9 and switches below (SPEC: assumption, M §11.3)", () => {
    expect(fmt(1e-9)).toBe("0.000000001");
    expect(fmt(1.2345e-9)).toBe("0.000000001");
    expect(fmt(9.9e-10)).toBe("9.9*10^(⁻10)");
    expect(fmt(0.000093164772)).toBe("0.000093165");
  });
});

describe("FIX n (TG p.65–66)", () => {
  it("pads and rounds half up; integers are padded (SPEC: assumption)", () => {
    expect(fmt(2, { decimals: 2 })).toBe("2.00");
    expect(fmt(2.5, { decimals: 0 })).toBe("3");
    expect(fmt(0.5, { decimals: 0 })).toBe("1");
    expect(fmt(0.147, { decimals: 5 })).toBe("0.14700");
  });

  it("a value that rounds to zero shows no sign", () => {
    expect(fmt(0.001, { decimals: 2 })).toBe("0.00");
    expect(fmt(-0.001, { decimals: 2 })).toBe("0.00");
  });

  it("never more than 10 digits in all (SPEC: assumption)", () => {
    expect(fmt(12.345, { decimals: 9 })).toBe("12.34500000");
    expect(fmt(1234567890.5, { decimals: 2 })).toBe("1234567891");
  });

  it("exact fractions, radicals and π ignore FIX (GB p.4, p.19, p.22)", () => {
    expect(res("1 n/d 3", { decimals: 2 })).toBe("1/3");
    expect(res("√ 2", { decimals: 2 })).toBe("√2");
  });
});

describe("SCI and ENG (GB p.3, p.11; TG p.56)", () => {
  it("SCI FLOAT keeps up to 10 significant digits; FIX sets the mantissa decimals", () => {
    expect(fmt(12345, { notation: "SCI" })).toBe("1.2345*10^4");
    expect(fmt(12345, { notation: "SCI", decimals: 2 })).toBe("1.23*10^4");
    expect(fmt(2 / 3, { notation: "SCI" })).toBe("6.666666667*10^(⁻1)");
    expect(fmt(9.99999999996, { notation: "SCI" })).toBe("1*10^1");
  });

  it("ENG uses exponents that are multiples of 3", () => {
    expect(fmt(0.00012, { notation: "ENG" })).toBe("120*10^(⁻6)");
    expect(fmt(1234, { notation: "ENG" })).toBe("1.234*10^3");
    expect(fmt(999.996, { notation: "ENG", decimals: 2 })).toBe("1.00*10^3");
    expect(fmt(123456789012, { notation: "ENG" })).toBe("123.456789*10^9");
  });

  it("zero in SCI/ENG shows ×10⁰ like the Recall Var 0ᴇ0 (SPEC: assumption, M §2.4)", () => {
    expect(fmt(0, { notation: "SCI" })).toBe("0*10^0");
    expect(fmt(0, { notation: "ENG", decimals: 2 })).toBe("0.00*10^0");
  });

  it("the ×10 part: MathPrint ee node, Classic *10^ symbols", () => {
    expect(formatResult({ re: 0.005 }, { ...DEFAULT_MODES, notation: "SCI" })).toEqual([sym("5"), { t: "ee", exp: [sym("neg"), sym("3")] }]);
    expect(fmt(0.005, { notation: "SCI", display: "CLASSIC" })).toBe("5*10^⁻3");
  });

  it("exact fractions stay fractions in SCI; integers follow the notation", () => {
    expect(res("1 n/d 3", { notation: "SCI" })).toBe("1/3");
    expect(res("2 ^ 40")).toBe("1.099511628*10^(12)");
  });
});

describe("exact rows (M §3.5)", () => {
  it("a negative sign goes in front of the fraction", () => {
    expect(res("(−) 1 n/d 2")).toBe("⁻1/2");
    expect(new Calc().enter("(−) 1 n/d 2").row[0]).toEqual(sym("neg"));
    expect(res("(−) 1 n/d 2", CL)).toBe("⁻1⁄2");
  });

  it("aπ/c keeps π in the numerator; 1 is not written", () => {
    expect(new Calc({ angle: "RAD" }).enter("30 °").row).toEqual([{ t: "frac", num: [sym("pi")], den: [sym("6")] }]);
    expect(res("3 π n/d 4")).toBe("(3π)/4");
  });

  it("mixed numbers: MathPrint mixed node, Classic u⌴n⁄d", () => {
    expect(new Calc().enter("9 n/d 2 ► ▸n/d◂▸Un/d").row).toEqual([{ t: "mixed", whole: [sym("4")], num: [sym("1")], den: [sym("2")] }]);
    expect(res("9 n/d 2 ▸n/d◂▸Un/d", CL)).toBe("4⌴1⁄2");
  });
});

describe("◂▸ toggle (K §4.16)", () => {
  it("decimal → fraction, π, or radical when one matches all 13 digits", () => {
    expect(res("1 ÷ 3 ◂▸")).toBe("1/3");
    expect(res("1.414213562373 ◂▸")).toBe("√2"); // radicals: SPEC: assumption
    expect(res("0.1234567 ◂▸")).toBe("0.1234567");
    expect(res("5 ◂▸")).toBe("5");
  });

  it("√ round-trips: √2 ◂▸ ◂▸ → √2 (via the 13-digit re-entry)", () => {
    const c = new Calc();
    c.enter("√ 2");
    expect(c.toggle().result).toBe("1.414213562");
    expect(c.toggle()).toMatchObject({ entry: "1.414213562373◂▸", result: "√2" });
  });

  it("Classic: fractions toggle, π does not exist", () => {
    expect(res("1 n/d 3 ◂▸", CL)).toBe("0.333333333");
    expect(res("0.7853981633975 ◂▸", CL)).toBe("0.785398163");
  });

  it("toggleForm: alternate row for the current one, null when there is none", () => {
    const half: Value = { re: 0.5, exact: { n: 1n, d: 2n, root: 1n, pi: false } };
    expect(rowText(toggleForm(half, formatResult(half, DEFAULT_MODES), DEFAULT_MODES)!)).toBe("0.5");
    expect(rowText(toggleForm(half, [sym("0"), sym("."), sym("5")], DEFAULT_MODES)!)).toBe("1/2");
    expect(toggleForm({ re: 3 }, [sym("3")], DEFAULT_MODES)).toBeNull();
    // FIX applies to the decimal form (TG p.103)
    const r3: Value = { re: 1.732050807568, exact: { n: 1n, d: 1n, root: 3n, pi: false } };
    expect(rowText(toggleForm(r3, formatResult(r3, DEFAULT_MODES), { ...DEFAULT_MODES, decimals: 0 })!)).toBe("2");
  });

  it("◂▸ pressed twice in one entry is SYNTAX (TG p.30)", () => expect(() => res("2 ◂▸ ◂▸")).toThrow("SYNTAX"));
});

describe("answerRow: the previous answer re-entered (K §4.4)", () => {
  const ans = (v: Value, m: Partial<Modes> = {}) => rowText(answerRow(v, { ...DEFAULT_MODES, ...m }));

  it("exact answers in their exact form, decimals with 13 significant digits", () => {
    expect(ans({ re: 2.828427124746, exact: { n: 2n, d: 1n, root: 2n, pi: false } })).toBe("2√2");
    expect(ans({ re: 0.7853981633975 })).toBe("0.7853981633975");
    expect(ans({ re: -2.5 })).toBe("⁻2.5");
    expect(ans({ re: 257, exact: { n: 257n, d: 1n, root: 1n, pi: false } })).toBe("257");
    expect(ans({ re: 1.5e20 })).toBe("1.5*10^(20)");
    expect(ans({ re: 1.5e20 }, CL)).toBe("1.5*10^20");
  });

  it("a mixed-number answer is re-entered as a mixed number; Classic fractions use ⁄", () => {
    expect(ans({ re: 4.5, exact: { n: 9n, d: 2n, root: 1n, pi: false }, form: "mixed" })).toBe("4⌴1/2");
    expect(ans({ re: 0.5, exact: { n: 1n, d: 2n, root: 1n, pi: false } }, CL)).toBe("1⁄2");
  });
});

describe("formatNumberText: StatVars, Recall Var, data editor (M §2.2 rules 5 and 7)", () => {
  const t = (x: number | null, m: Partial<Modes> = {}, w?: number) => formatNumberText(x, { ...DEFAULT_MODES, ...m }, w);

  it("NORM FLOAT fills 11 characters by rounding and keeps the zeros rounding produces", () => {
    expect(t(0.67732518955)).toBe("0.677325190");
    expect(t(-18.66637320977)).toBe("⁻18.6663732");
    expect(t(79.4)).toBe("79.4");
    expect(t(null)).toBe("Error");
  });

  it("E notation in SCI/ENG and when a value does not fit", () => {
    expect(t(196000, { notation: "ENG" })).toBe("196ᴇ3");
    expect(t(0, { notation: "ENG" })).toBe("0ᴇ0");
    expect(t(12345, { notation: "SCI" })).toBe("1.2345ᴇ4");
    expect(t(1e15)).toBe("1ᴇ15");
    expect(t(2.5e-12)).toBe("2.5ᴇ⁻12");
  });

  it("FIX pads; a narrower field rounds harder", () => {
    expect(t(0.5, { decimals: 2 })).toBe("0.50");
    expect(t(6.283185307, {}, 7)).toBe("6.28319");
  });
});
