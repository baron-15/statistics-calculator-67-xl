import { describe, expect, it } from "vitest";
import { initialState, runScript } from "../../src/engine";
import { exactRow } from "../../src/engine/math/format";
import { angleView } from "../../src/ui/panels/angleData";
import { answerForms, answerFormsView, fractionStrip } from "../../src/ui/panels/fractionData";
import { fallingProduct, probabilityView } from "../../src/ui/panels/probabilityData";
import {
  chartData,
  chartSetup,
  histogram,
  listsView,
  niceStep,
  parseStatTitle,
  regressionText,
  resultsView,
  setupText,
} from "../../src/ui/panels/statsData";
import { tableBlockView } from "../../src/ui/panels/tableData";
import { groupDigits, linearReadable, numberText, readableNumber, readableRow, superscript, valueText } from "../../src/ui/panels/text";

const MODES = initialState().modes;
const forms = (script: string) => Object.fromEntries(answerFormsView(runScript(script)).forms.map((f) => [f.id, f.text]));

describe("readable text", () => {
  it("uses a true minus, × and a/b, keeping the LCD's digits", () => {
    expect(readableNumber("⁻18.6663732")).toBe("−18.6663732");
    expect(readableNumber("196ᴇ3")).toBe("196×10³");
    expect(readableNumber("⁻1.5ᴇ⁻12")).toBe("−1.5×10⁻¹²");
    expect(readableNumber("1⁄4")).toBe("1/4");
    expect(readableNumber("Error")).toBe("Error");
  });

  it("writes result rows in one line: fractions, mixed numbers, radicals, ×10ⁿ", () => {
    expect(readableRow(runScript("1 n/d 2 RIGHT + 1 n/d 3 ENTER").history[0]!.result)).toBe("5/6");
    expect(readableRow(runScript("9 n/d 2 RIGHT 2ND EE ENTER").history[0]!.result)).toBe("4 1/2");
    expect(readableRow(runScript("2ND SQUARE 8 ENTER").history[0]!.result)).toBe("2√2");
    expect(readableRow(exactRow({ n: 5n, d: 2n, root: 2n, pi: false }, MODES))).toBe("5√2/2");
    expect(readableRow(exactRow({ n: -3n, d: 4n, root: 1n, pi: true }, MODES))).toBe("−3π/4");
    expect(readableRow(runScript("MODE DOWN RIGHT ENTER CLEAR 12345 ENTER").history[0]!.result)).toBe("1.2345×10⁴");
    expect(readableRow(runScript("2 POWER 10 ENTER").history[0]!.entry)).toBe("2¹⁰");
    expect(readableRow(runScript("2 MULTIPLY NEG 3 SUBTRACT 1").editor.row)).toBe("2×−3−1");
  });

  it("parenthesizes compound fraction parts", () => {
    const s = runScript("FRAC 1 + 2 DOWN 3");
    expect(readableRow(s.editor.row)).toBe("(1+2)/3");
  });

  it("formats values as Home results and as restricted-context text", () => {
    expect(valueText({ re: 0.5, exact: { n: 1n, d: 2n, root: 1n, pi: false } }, MODES)).toBe("1/2");
    expect(valueText({ re: -2 }, MODES)).toBe("−2");
    expect(numberText(null, MODES)).toBe("Error");
    expect(numberText(0.6773251902, MODES)).toBe("0.677325190");
  });

  it("superscripts, digit grouping and linear text", () => {
    expect(superscript("-12")).toBe("⁻¹²");
    expect(superscript("x")).toBeNull();
    expect(groupDigits(2598960)).toBe("2,598,960");
    expect(groupDigits(-1234n)).toBe("−1,234");
    expect(groupDigits(12)).toBe("12");
    const app = runScript("DATA RIGHT DATA RIGHT 1 9 n/d 5 MULTIPLY DATA 1 + 32").app;
    expect(app.kind === "data" && app.formula && linearReadable(app.formula.row)).toBe("9/5×L1+32");
  });
});

describe("statistics", () => {
  const twoVar = "DATA 1 ENTER 2 ENTER 3 ENTER 4 ENTER 5 ENTER RIGHT 2 ENTER 4 ENTER 5 ENTER 4 ENTER 5 ENTER 2ND STAT 2 DOWN DOWN ENTER";
  const tg85 = "DATA 53 ENTER 77 ENTER 85 ENTER 85 ENTER 97 ENTER 2ND STAT 1 DOWN DOWN ENTER";

  it("shows the lists with formulas and the editor's cursor", () => {
    const s = runScript("DATA 1 ENTER 2 n/d 4 ENTER RIGHT DATA RIGHT 1 9 n/d 5 MULTIPLY DATA 1 + 32 ENTER");
    const v = listsView(s);
    expect(v.columns[0]!.values).toEqual(["1", "1/2"]);
    expect(v.columns[1]!.formula).toBe("9/5×L1+32");
    // formula lists keep exact values, like the editor's own cells
    expect(v.columns[1]!.values).toEqual(["169/5", "329/10"]);
    expect(v.rows).toBe(2);
    expect(v.cursor).toEqual({ col: 1, row: 0 });
    expect(listsView(runScript("DATA 5 ENTER 2ND MODE")).cursor).toBeNull();
  });

  it("keeps the cursor while a data menu is open over the editor", () => {
    expect(listsView(runScript("DATA 5 ENTER DATA")).cursor).toEqual({ col: 0, row: 1 });
  });

  it("parses result titles", () => {
    expect(parseStatTitle("1-Var:L1,One")).toEqual({ kind: "1-Var", data: 0, freq: null });
    expect(parseStatTitle("1-Var:L2,L3")).toEqual({ kind: "1-Var", data: 1, freq: 2 });
    expect(parseStatTitle("2-Var:L1,L2")).toEqual({ kind: "2-Var", x: 0, y: 1 });
    expect(parseStatTitle("nonsense")).toBeNull();
    expect(setupText({ kind: "1-Var", data: 0, freq: null })).toBe("1-Var · data L1 · frequency one");
  });

  it("lists 1-Var results with the device's quartiles (TG p.85)", () => {
    const r = resultsView(runScript(tg85))!;
    expect(r.kind).toBe("1-Var");
    expect(r.items.map((i) => `${i.label}=${i.text}`)).toEqual([
      "n=5",
      "x̄=79.4",
      "Sx=16.39512123",
      "σx=14.66424222",
      "Σx=397",
      "Σx²=32597",
      "minX=53",
      "Q1=77",
      "Med=85",
      "Q3=85",
      "maxX=97",
    ]);
    expect(r.stale).toBe(false);
    expect(r.selected).toBe(0);
    expect(r.regression).toBeNull();
  });

  it("lists 2-Var results without x′ and y′, with the regression line", () => {
    const r = resultsView(runScript(twoVar))!;
    expect(r.items.some((i) => i.key === "stat_xprime" || i.key === "stat_yprime")).toBe(false);
    expect(r.items.find((i) => i.key === "stat_minX")!.index).toBe(17);
    expect(r.regression).toMatchObject({ a: 0.6, b: 2.2, text: "y = 0.6x + 2.2" });
    expect(regressionText(0.67732519, -18.6663732, MODES)).toBe("y = 0.67732519x − 18.6663732");
  });

  it("follows the StatVars highlight and notices when the lists changed afterwards", () => {
    expect(resultsView(runScript(`${tg85} DOWN DOWN`))!.selected).toBe(2);
    const changed = runScript(`${tg85} DATA 100 ENTER`);
    expect(resultsView(changed)!.stale).toBe(true);
    expect(resultsView(changed)!.selected).toBeNull();
    expect(resultsView(initialState())).toBeNull();
  });

  it("charts a 1-Var box plot and histogram from the engine's summary", () => {
    const c = chartData(runScript(tg85));
    expect(c.kind).toBe("1-Var");
    if (c.kind !== "1-Var") return;
    expect(c.box).toEqual({ min: 53, q1: 77, med: 85, q3: 85, max: 97, mean: 79.4, n: 5 });
    expect(c.bins.reduce((t, b) => t + b.count, 0)).toBe(5);
  });

  it("weights the histogram by the frequency list", () => {
    const s = runScript("DATA 1 ENTER 2 ENTER RIGHT 3 ENTER 1 ENTER 2ND STAT 1 DOWN RIGHT RIGHT ENTER ENTER");
    expect(s.apps.stat?.title).toBe("1-Var:L1,L2");
    const c = chartData(s);
    expect(c.kind === "1-Var" && c.bins.map((b) => b.count)).toEqual([3, 1]);
  });

  it("charts a 2-Var scatter with the regression line", () => {
    const c = chartData(runScript(twoVar));
    expect(c).toMatchObject({ kind: "2-Var", xList: "L1", yList: "L2", line: { a: 0.6, b: 2.2 } });
    expect(c.kind === "2-Var" && c.points.length).toBe(5);
  });

  it("explains what is missing instead of charting", () => {
    expect(chartData(initialState())).toEqual({ kind: "message", text: "L1 is empty. Press data and type some values." });
    expect(chartData(runScript("DATA 5 ENTER"))).toEqual({ kind: "message", text: "L1: Needs at least two values." });
    const mismatch = chartData(runScript("DATA 1 ENTER 2 ENTER RIGHT 3 ENTER"), { kind: "2-Var", x: 0, y: 1 });
    expect(mismatch).toEqual({ kind: "message", text: "L1 has 2 values and L2 has 1: they must match." });
    const flat = chartData(runScript("DATA 1 ENTER 1 ENTER RIGHT 3 ENTER 4 ENTER"), { kind: "2-Var", x: 0, y: 1 });
    expect(flat).toMatchObject({ kind: "2-Var", line: null });
  });

  it("charts the setup of the open wizard, else the last calculation", () => {
    expect(chartSetup(runScript("2ND STAT 2"))).toEqual({ kind: "2-Var", x: 0, y: 1 });
    expect(chartSetup(runScript(twoVar))).toEqual({ kind: "2-Var", x: 0, y: 1 });
    expect(chartSetup(initialState())).toEqual({ kind: "1-Var", data: 0, freq: null });
  });

  it("bins integers one per value, other data with nice widths", () => {
    expect(
      histogram([
        { x: 1, f: 1 },
        { x: 3, f: 2 },
      ]).map((b) => [b.lo, b.count]),
    ).toEqual([
      [0.5, 1],
      [1.5, 0],
      [2.5, 2],
    ]);
    const wide = histogram([53, 77, 85, 85, 97].map((x) => ({ x, f: 1 })));
    expect(wide.map((b) => b.lo)).toEqual([50, 60, 70, 80, 90]);
    expect(wide.map((b) => b.count)).toEqual([1, 0, 1, 2, 1]);
    expect(
      histogram([
        { x: 0.5, f: 1 },
        { x: 1.5, f: 1 },
      ]).reduce((t, b) => t + b.count, 0),
    ).toBe(2);
    expect(histogram([])).toEqual([]);
    expect(niceStep(11)).toBe(10);
    expect(niceStep(0.3)).toBe(0.2);
    expect(niceStep(0)).toBe(1);
  });
});

describe("function table", () => {
  const tg = "TABLE VAR ( 36 - VAR ) ENTER CLEAR 15 DOWN CLEAR 3 DOWN DOWN ENTER";

  it("lists 12 rows from the LCD's top row, marking the LCD's rows and its selection", () => {
    const v = tableBlockView(runScript(`${tg} DOWN`));
    expect(v.func).toBe("x(36−x)");
    expect(v.settings).toEqual({ start: "15", step: "3", ask: false, field: null });
    expect(v.rows).toHaveLength(12);
    expect(v.rows.slice(0, 4).map((r) => `${r.xText}:${r.yText}`)).toEqual(["15:315", "18:324", "21:315", "24:288"]);
    expect(v.rows.filter((r) => r.onLcd).map((r) => r.x)).toEqual([15, 18, 21]);
    expect(v.rows.find((r) => r.selected)?.x).toBe(18);
    expect(v.rows.at(-1)?.yText).toBe("−576");
  });

  it("previews the function being typed and the setup being edited", () => {
    const typing = tableBlockView(runScript("TABLE VAR SQUARE"));
    expect(typing.live).toBe(true);
    expect(typing.func).toBe("x²");
    expect(typing.rows[3]!.yText).toBe("9");
    const setup = tableBlockView(runScript("TABLE VAR ENTER CLEAR 2 n/d 3 DOWN"));
    expect(setup.settings).toMatchObject({ start: "2/3", field: 1 });
  });

  it("lists every Ask-x value", () => {
    const v = tableBlockView(runScript("TABLE VAR SQUARE ENTER DOWN DOWN RIGHT ENTER ENTER 5 ENTER 2 ENTER"));
    expect(v.settings.ask).toBe(true);
    expect(v.rows.map((r) => `${r.xText}:${r.yText}`)).toEqual(["5:25", "2:4"]);
  });

  it("shows Error cells and an empty table without a function", () => {
    const v = tableBlockView(runScript("TABLE 1 n/d VAR ENTER ENTER ENTER ENTER"));
    expect(v.rows[0]!.yText).toBe("Error");
    expect(v.rows[1]!.yText).toBe("1");
    expect(tableBlockView(initialState()).rows[0]!.yText).toBe("");
    expect(tableBlockView(initialState()).plot).toBeNull();
  });

  it("plots the curve over the table range, breaking at an asymptote", () => {
    const parabola = tableBlockView(runScript(tg)).plot!;
    expect(parabola.xMin).toBe(15);
    expect(parabola.xMax).toBe(48);
    expect(parabola.segments).toHaveLength(1);
    expect(parabola.points).toHaveLength(12);
    expect(parabola.yMax).toBeGreaterThan(324);
    // 1/(x−5) from 0: undefined at 5, and the curve splits there
    const hyper = tableBlockView(runScript("TABLE 1 n/d VAR - 5 ENTER ENTER ENTER ENTER")).plot!;
    expect(hyper.segments.length).toBeGreaterThanOrEqual(2);
    expect(hyper.points).toHaveLength(11);
  });
});

describe("fractions and answer forms", () => {
  it("shows an improper fraction as a mixed number, decimal and percent", () => {
    expect(forms("9 n/d 2 ENTER")).toMatchObject({ shown: "9/2", fraction: "9/2", mixed: "4 1/2", decimal: "4.5", percent: "450%" });
  });

  it("finds the fraction f◂▸d would give for a decimal", () => {
    expect(forms("0.75 ENTER")).toMatchObject({ shown: "0.75", fraction: "3/4", percent: "75%" });
    expect(forms("0.75 ENTER").decimal).toBeUndefined(); // reads like "As shown"
  });

  it("shows exact radical and π forms with the 13-digit value Ans keeps", () => {
    expect(forms("2ND SQUARE 8 ENTER")).toMatchObject({ shown: "2√2", exact: "2√2", decimal: "2.828427125", stored: "2.828427124746" });
    expect(forms("PI n/d 4 ENTER")).toMatchObject({ exact: "π/4", decimal: "0.785398163" });
    const toggled = answerFormsView(runScript("PI n/d 4 ENTER TOGGLE"));
    expect(toggled.forms[0]!.text).toBe("0.785398163");
    expect(toggled.forms.find((f) => f.id === "exact")?.text).toBe("π/4");
    expect(toggled.last).toEqual({ entry: "π/4", result: "0.785398163", toggled: true });
  });

  it("follows the modes: FIX and Classic", () => {
    expect(forms("MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER CLEAR 1 n/d 8 ENTER").decimal).toBe("0.13");
    const classic = answerFormsView(runScript("MODE DOWN DOWN DOWN ENTER CLEAR 2ND SQUARE 2 ENTER"));
    expect(classic.classic).toBe(true);
    expect(classic.forms[0]!.text).toBe("1.414213562");
    expect(classic.forms.find((f) => f.id === "exact")).toMatchObject({ label: "Exact (MathPrint)", text: "√2" });
  });

  it("names the key for each form", () => {
    const keys = Object.fromEntries(answerForms({ re: 4.5, exact: { n: 9n, d: 2n, root: 1n, pi: false } }, MODES).map((f) => [f.id, f.keys]));
    expect(keys).toMatchObject({ fraction: "2nd f◄►d", mixed: "2nd n/d◄►Un/d", percent: "2nd ►%" });
  });

  it("draws a strip: whole bars plus d pieces up to 12, else a proportion", () => {
    expect(fractionStrip({ re: 7 / 3, exact: { n: 7n, d: 3n, root: 1n, pi: false } })).toEqual({ neg: false, whole: 2, num: 1, den: 3, part: 1 / 3 });
    expect(fractionStrip({ re: -0.75 })).toMatchObject({ neg: true, whole: 0, num: 3, den: 4 });
    expect(fractionStrip({ re: 0.123, exact: { n: 123n, d: 1000n, root: 1n, pi: false } })).toMatchObject({ den: 0, part: 0.123 });
    expect(fractionStrip({ re: Math.SQRT2 })).toMatchObject({ whole: 1, den: 0 });
  });
});

describe("probability", () => {
  it("writes out nPr and nCr with the user's numbers", () => {
    expect(probabilityView(runScript("8 PRB 1 3 ENTER")).calc).toMatchObject({
      kind: "nPr",
      expr: "8 nPr 3",
      formula: "8!/(8−3)!",
      steps: "8×7×6",
      result: "336",
      chance: "1 in 336",
    });
    expect(probabilityView(runScript("52 PRB 2 5")).calc).toMatchObject({
      kind: "nCr",
      formula: "52!/(5!·47!)",
      steps: "(52×51×50×49×48)/(5×4×3×2×1)",
      result: "2598960",
      chance: "1 in 2,598,960",
    });
  });

  it("prefers the entry being typed, then the newest history entry", () => {
    expect(probabilityView(runScript("8 PRB 1 3 ENTER")).source).toBe("history");
    expect(probabilityView(runScript("8 PRB 1 3 ENTER 5 PRB 2 2")).calc?.expr).toBe("5 nCr 2");
    expect(probabilityView(runScript("8 PRB 1 3 ENTER 1 + 1 ENTER")).calc?.expr).toBe("8 nPr 3");
    expect(probabilityView(initialState())).toEqual({ source: null, entry: null, calc: null });
  });

  it("evaluates operands with the engine (parentheses, variables)", () => {
    expect(probabilityView(runScript("( 2 + 3 ) PRB 1 2")).calc).toMatchObject({ expr: "5 nPr 2", steps: "5×4", result: "20" });
    expect(probabilityView(runScript("6 STO VAR ENTER VAR PRB 3")).calc).toMatchObject({ expr: "6!", steps: "6×5×4×3×2×1", result: "720" });
  });

  it("shows the general formula while the operation is incomplete", () => {
    expect(probabilityView(runScript("8 PRB 1")).calc).toMatchObject({ kind: "nPr", expr: "n nPr r", formula: "n!/(n−r)!", result: null });
  });

  it("explains factorials, randint and rand without drawing random numbers", () => {
    expect(probabilityView(runScript("0 PRB 3")).calc?.steps).toBe("1 (by definition)");
    expect(probabilityView(runScript("20 PRB 3")).calc?.steps).toBe("20×19×18×…×1");
    const r = probabilityView(runScript("PRB RIGHT 2 2 2ND DOT 10 RPAREN")).calc!;
    expect(r).toMatchObject({ kind: "randint", range: { lo: "2", hi: "10", count: 9 }, chance: "1/9 for each integer", result: null });
    expect(probabilityView(runScript("PRB RIGHT 1 ENTER")).calc).toMatchObject({ kind: "rand", result: null });
  });

  it("reports the calculator's error", () => {
    expect(probabilityView(runScript("2.5 PRB 3")).calc?.error).toBe("DOMAIN");
  });

  it("writes long products with an ellipsis", () => {
    expect(fallingProduct(8, 3)).toBe("8×7×6");
    expect(fallingProduct(30, 10)).toBe("30×29×28×…×21");
    expect(fallingProduct(5, 0)).toBe("1");
  });
});

describe("angles and trig", () => {
  it("explains the argument of sin in every unit, with exact values", () => {
    const v = angleView(runScript("SIN 30 RPAREN ENTER"));
    expect(v).toMatchObject({ source: "history", what: "the argument of sin", mode: "DEG", angle: "30", degrees: 30 });
    expect(v.units).toEqual({ deg: "30", rad: "0.523598776", radPi: "π/6", grad: "33.33333333", dms: "30°0′0″" });
    expect(v.trig).toEqual({ sin: "1/2", cos: "√3/2", tan: "√3/3" });
  });

  it("works in RAD with a π argument being typed", () => {
    const v = angleView(runScript("MODE RIGHT ENTER CLEAR COS PI n/d 4"));
    expect(v).toMatchObject({ source: "entry", mode: "RAD", angle: "π/4", degrees: 45 });
    expect(v.units.radPi).toBe("π/4");
    expect(v.trig.tan).toBe("1");
  });

  it("uses the result of an inverse function and of ▸DMS", () => {
    expect(angleView(runScript("2ND SIN 0.5 ENTER"))).toMatchObject({ what: "the result of sin⁻¹", degrees: 30 });
    expect(angleView(runScript("1.5 2ND PRB 6 ENTER")).units).toMatchObject({ dms: "1°30′0″", radPi: "π/120" });
  });

  it("shows the point of a polar/rectangular conversion", () => {
    const v = angleView(runScript("2ND PRB RIGHT 1 3 2ND DOT 4 RPAREN ENTER"));
    expect(v.point).toMatchObject({ x: 3, y: 4, rText: "5", thetaText: "53.13010235" });
    expect(v.units.dms).toBe("53°7′48.3685″");
    const p = angleView(runScript("2ND PRB RIGHT 3 7 2ND DOT 30 RPAREN ENTER"));
    expect(p.point).toMatchObject({ xText: "6.062177826", yText: "3.5", rText: "7" });
  });

  it("falls back to Ans, and marks undefined values", () => {
    expect(angleView(runScript("45 ENTER"))).toMatchObject({ source: "ans", what: "Ans, read as an angle", degrees: 45 });
    expect(angleView(runScript("TAN 90")).trig.tan).toBe("undefined");
    expect(angleView(runScript("MODE RIGHT RIGHT ENTER CLEAR 100 ENTER")).units).toMatchObject({ deg: "90", grad: "100" });
  });
});
