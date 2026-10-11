/**
 * Error kinds (GB p.37–38, M §8.1), statistics edge cases (M §5.4–5.5), the table and list-formula
 * entry points (GB p.32–35) and the rand generator (M §4.5).
 */
import { describe, expect, it } from "vitest";
import { sym, type Row } from "../../../src/engine/expr";
import { CalcError, isCalcError, type ErrorKind } from "../../../src/engine/errors";
import {
  evalFunctionAt, evaluateEntry, evaluateListFormula, makeRandom, oneVarStats, randNext, statVarsOf, twoVarStats,
  type EvalContext,
} from "../../../src/engine/math";
import { Calc, CL, DEFAULT_MODES, res } from "./helpers";

const kind = (f: () => unknown): ErrorKind | "none" => {
  try {
    f();
    return "none";
  } catch (e) {
    if (isCalcError(e)) return e.kind;
    throw e;
  }
};
const err = (seq: string, m = {}) => kind(() => res(seq, m));

const ctx = (over: Partial<EvalContext> = {}): EvalContext => ({
  modes: DEFAULT_MODES, ans: { re: 0 }, vars: new Calc().vars, lists: [[], [], []], statVars: {}, random: () => 0.5, ...over,
});

describe("errors (GB p.37–38)", () => {
  it("SYNTAX: misplaced operators, parentheses, commas, store; Classic n⁄d with operators", () => {
    for (const s of ["2 +", ")", "2 , 3", "( )", "2 sto", "1 . 2 . 3", "2 ×"]) expect(err(s), s).toBe("SYNTAX");
    expect(err("1 n/d 2 n/d 3", CL)).toBe("SYNTAX");
    expect(err("( 1 + 2 ) n/d 3", CL)).toBe("SYNTAX");
    expect(err("n/d ▼ 2")).toBe("SYNTAX"); // empty numerator
  });

  it("ARGUMENT: wrong number of arguments", () => {
    expect(err("R▸Pr( 3 )")).toBe("ARGUMENT");
    expect(err("sin 1 , 2 )")).toBe("ARGUMENT");
    expect(err("randint( 1 , 2 , 3 )")).toBe("ARGUMENT");
  });

  it("DIVIDE BY 0", () => {
    for (const s of ["1 ÷ 0", "1 n/d 0", "0 x⁻¹", "0 ^ (−) 1"]) expect(err(s), s).toBe("DIVIDE BY 0");
  });

  it("DOMAIN: the guidebook list", () => {
    const cases = [
      "0 ˣ√ 8", "2 ˣ√ (−) 8", // ˣ√y: x = 0, or y < 0 and x not odd
      "0 ^ 0", "( (−) 8 ) ^ 0.5", // yˣ
      "√ (−) 4", "log 0 )", "ln (−) 1 )", "tan 90 )", "tan 270 )", "sin⁻¹ 2 )", "cos⁻¹ (−) 1.5 )",
      "2.5 nPr 1", "(−) 5 nCr 2", "70 !", "2.5 !", "( (−) 1 ) !",
      "hyp cos⁻¹ 0.5 )", "hyp tan⁻¹ 1 )", // SPEC: assumption (M §4 [unverified])
      "randint( 3.5 , 5 )", "2.5 sto rand", // SPEC: assumption
    ];
    for (const s of cases) expect(err(s), s).toBe("DOMAIN");
    expect(err("tan π n/d 2 ► )", { angle: "RAD" })).toBe("DOMAIN");
  });

  it("odd roots of negatives are fine: ³√(⁻8) = ⁻2", () => expect(res("3 ˣ√ (−) 8")).toBe("⁻2"));

  it("OVERFLOW: |x| ≥ 1E100, trig/hyperbolic angles ≥ 1E10 (M §2.5, TG C-1)", () => {
    for (const s of ["10 ^ 100", "10 ^ 99 × 10", "sin 10 ^ 10", "hyp sin 1000 )", "hyp tan 10 ^ 10"]) {
      expect(err(s), s).toBe("OVERFLOW");
    }
    expect(res("9.9 ×10ⁿ 99")).toBe("9.9*10^(99)");
    expect(res("69 !")).toBe("1.711224524*10^(98)");
  });

  it("underflow to 0 below 1E−99", () => expect(res("10 ^ (−) 100")).toBe("0"));

  it("StatVars that were not computed are STAT; x′ needs a regression", () => {
    expect(err("x̄")).toBe("STAT");
    expect(err("x′( 1 )")).toBe("STAT");
  });

  it("errors are CalcError instances", () => {
    expect(() => res("1 ÷ 0")).toThrow(CalcError);
  });
});

describe("store and entry results", () => {
  it("→ returns the target; rand seeds are non-negative integers", () => {
    const e: Row = [sym("5"), sym("store"), sym("rand")];
    expect(evaluateEntry(e, ctx())).toMatchObject({ store: "rand", toggled: false, value: { re: 5 } });
    expect(evaluateEntry([sym("2"), sym("store"), sym("z")], ctx()).store).toBe("z");
    expect(kind(() => evaluateEntry([sym("2"), sym("store"), sym("2")], ctx()))).toBe("SYNTAX");
  });

  it("a toggled entry reports toggled and leaves the alternate value as Ans", () => {
    const r = evaluateEntry(new Calc().type("1 ÷ 4 ◂▸"), ctx());
    expect(r.toggled).toBe(true);
    expect(r.value.exact).toEqual({ n: 1n, d: 4n, root: 1n, pi: false });
  });
});

describe("statistics edge cases (M §5.4–5.5)", () => {
  it("FRQ DOMAIN outside 0–99", () => {
    expect(kind(() => oneVarStats([1, 2], [1, 100]))).toBe("FRQ DOMAIN");
    expect(kind(() => oneVarStats([1, 2], [-1, 1]))).toBe("FRQ DOMAIN");
  });

  it("STAT: no data, all frequencies 0, unequal 2-Var lists", () => {
    expect(kind(() => oneVarStats([], null))).toBe("STAT");
    expect(kind(() => oneVarStats([1, 2], [0, 0]))).toBe("STAT");
    expect(kind(() => twoVarStats([1, 2], [1], null))).toBe("STAT");
  });

  it("DIVIDE BY 0 when n = 1 (GB p.37); 2-Var with all x equal (SPEC: assumption)", () => {
    expect(kind(() => oneVarStats([5], null))).toBe("DIVIDE BY 0");
    expect(kind(() => oneVarStats([5, 6], [1, 0]))).toBe("DIVIDE BY 0");
    expect(kind(() => twoVarStats([3, 3], [1, 2], null))).toBe("DIVIDE BY 0");
  });

  it("r is Error when all y are equal (SPEC: assumption)", () => {
    const r = twoVarStats([1, 2, 3], [4, 4, 4], null);
    expect(r.items.find((i) => i.key === "stat_r")?.value).toBeNull();
    expect(r.items.find((i) => i.key === "stat_a")?.value).toBe(0);
  });

  it("zero-frequency elements are ignored, including for min and max", () => {
    const r = oneVarStats([1, 50, 3], [1, 0, 1]);
    expect(r.items.map((i) => i.value)).toEqual([2, 2, 1.414213562373, 1, 4, 10, 1, 1, 2, 3, 3]);
  });

  it("quartiles are Tukey hinges: {1…7} → Q1 2.5, Q3 5.5 (SPEC: assumption, M §11.5)", () => {
    const q = (xs: number[], f: number[] | null = null) =>
      ["stat_Q1", "stat_Med", "stat_Q3"].map((k) => oneVarStats(xs, f).items.find((i) => i.key === k)?.value);
    expect(q([1, 2, 3, 4, 5, 6, 7])).toEqual([2.5, 4, 5.5]);
    expect(q([45, 55, 55, 55])).toEqual([50, 55, 55]);
    expect(q([3, 1, 2])).toEqual([1.5, 2, 2.5]);
    expect(q([1, 2], [2, 2])).toEqual([1, 1.5, 2]);
  });

  it("non-integer frequencies: weighted quartiles, Sx Error, n is Σf (SPEC: assumption for the quartiles)", () => {
    const r = oneVarStats([10, 20, 30], [0.5, 1, 0.5]);
    const v = (k: string) => r.items.find((i) => i.key === k)?.value;
    expect([v("stat_n"), v("stat_xbar"), v("stat_Sx"), v("stat_Med")]).toEqual([2, 20, null, 20]);
    expect([v("stat_Q1"), v("stat_Q3")]).toEqual([15, 25]);
  });

  it("statVarsOf feeds EvalContext.statVars (values only)", () => {
    const sv = statVarsOf(twoVarStats([45, 55], [30, 25], null));
    expect(sv.stat_a).toBe(-0.5);
    expect("stat_xprime" in sv).toBe(false);
  });
});

describe("function table (GB p.33–35)", () => {
  const f = (seq: string) => new Calc().type(seq);

  it("INVALID FUNCTION for ◂▸, rand, randint and → (GB p.38)", () => {
    for (const s of ["var + rand", "randint( 1 , var )", "var ◂▸", "var sto var"]) {
      expect(kind(() => evalFunctionAt(f(s), 1, ctx())), s).toBe("INVALID FUNCTION");
    }
  });

  it("integer x keeps exact results; a decimal x gives decimals (TG p.97)", () => {
    const g = f("1 n/d var");
    expect(evalFunctionAt(g, 4, ctx()).exact).toEqual({ n: 1n, d: 4n, root: 1n, pi: false });
    expect(evalFunctionAt(g, 0.5, ctx())).toEqual({ re: 2 });
    expect(evalFunctionAt(g, { re: 4 }, ctx())).toEqual({ re: 0.25 });
  });

  it("x can be an exact value such as 2π (Ask-x)", () => {
    const twoPi = new Calc().enter("2 π").value;
    expect(evalFunctionAt(f("var n/d 2"), twoPi, ctx()).exact).toEqual({ n: 1n, d: 1n, root: 1n, pi: true });
  });

  it("errors at one x propagate (DIVIDE BY 0)", () => {
    expect(kind(() => evalFunctionAt(f("1 ÷ var"), 0, ctx()))).toBe("DIVIDE BY 0");
  });
});

describe("list formulas (GB p.32–33)", () => {
  const L = (seq: string) => new Calc().type(seq);
  it("FORMULA: no list name, or the target's own list", () => {
    expect(kind(() => evaluateListFormula(L("2 + 3"), ctx(), 1))).toBe("FORMULA");
    expect(kind(() => evaluateListFormula(L("L2 + 1"), ctx({ lists: [[], [1], []] }), 1))).toBe("FORMULA");
  });

  it("DIM MISMATCH: referenced lists of unequal length", () => {
    expect(kind(() => evaluateListFormula(L("L1 + L2"), ctx({ lists: [[1, 2], [1], []] }), 2))).toBe("DIM MISMATCH");
  });

  it("evaluates element by element: L1 + L2", () => {
    expect(evaluateListFormula(L("L1 + L2"), ctx({ lists: [[1, 2], [10, 20], []] }), 2).map((v) => v.re)).toEqual([11, 22]);
  });
});

describe("rand generator (M §4.5)", () => {
  it("x ← 40014·x mod 2147483563 from the stored seed", () => {
    expect(randNext(1)).toEqual({ value: 40014 / 2147483563, seed: 40014 });
    expect(randNext(40014).seed).toBe(1601120196);
  });

  it("seed 0 would lock the generator; it is replaced by 12345 (SPEC: assumption)", () => {
    expect(randNext(0)).toEqual(randNext(12345));
  });

  it("makeRandom draws in sequence and exposes the new seed", () => {
    const r = makeRandom(5);
    r.random();
    expect(r.seed()).toBe(200070);
    expect(r.random()).toBeCloseTo(1563150291 / 2147483563, 15);
  });

  it("randint(A,B) = A + ⌊u(B−A+1)⌋; A > B is swapped (SPEC: assumption)", () => {
    expect(evaluateEntry(new Calc().type("randint( 5 , 3 )"), ctx({ random: () => 0.99 })).value.re).toBe(5);
    expect(evaluateEntry(new Calc().type("randint( 3 , 5 )"), ctx({ random: () => 0 })).value.re).toBe(3);
  });
});
