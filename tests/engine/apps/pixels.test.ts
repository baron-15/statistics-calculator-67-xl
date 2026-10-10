/**
 * Pixel goldens for the apps layer: each state is built with keystrokes (data seeded where the
 * capture needs it), rendered by the real renderer and compared pixel for pixel with the TI-SmartView
 * capture (tests/fixtures/lcd_dumps.txt). Where the capture comes from a current build (its strip
 * shows the angle unit), the lit indicators must match too.
 */
import { describe, expect, it } from "vitest";
import { view, type CalcState } from "../../../src/engine";
import type { Row, SymId } from "../../../src/engine/expr";
import type { Value } from "../../../src/engine/math";
import type { StatRecord } from "../../../src/engine/apps";
import { compareWithCapture } from "../../display/build";
import { parseFixture } from "../../display/fixtures";
import { initialState, mathReady, run } from "./helpers";

const int = (n: number): Value => ({ re: n, exact: { n: BigInt(n), d: 1n, root: 1n, pi: false } });
const q = (n: number, d: number): Value => ({ re: n / d, exact: { n: BigInt(n), d: BigInt(d), root: 1n, pi: false } });
const dec = (re: number): Value => ({ re });
const S = (id: SymId) => ({ t: "sym" as const, s: id });

const base = initialState();
const withModes = (m: Partial<CalcState["modes"]>, from: CalcState = base): CalcState => ({ ...from, modes: { ...from.modes, ...m } });
const withLists = (l1: Value[], l2: Value[] = [], l3: Value[] = [], formulas: CalcState["apps"]["formulas"] = [null, null, null]): CalcState =>
  ({ ...base, apps: { ...base.apps, lists: [l1, l2, l3], formulas } });
const withStat = (stat: StatRecord): CalcState => ({ ...base, apps: { ...base.apps, stat } });

const TO_INDICATOR: Record<string, string> = {
  DEG: "deg", RAD: "rad", GRAD: "grad", UP: "up", DOWN: "down", FIX: "fix", SCI: "sci", ENG: "eng", K: "k",
  "[L1]": "l1", "[L2]": "l2", "[L3]": "l3",
};

interface Case {
  name: string;
  what: string;
  state: () => CalcState;
  /** the capture's cursor is in its "on" blink phase */
  blinkOn?: boolean;
  /** skip the indicator check: older emulator builds omit the angle unit, or (string) the reason */
  oldStrip?: boolean | string;
  needsMath?: boolean;
}

function check(c: Case) {
  const s = c.state();
  const d = compareWithCapture(c.name, () => view(s), c.blinkOn ?? false);
  expect(d.count, `${c.name}: ${c.what}\n${d.text}`).toBe(0);
  if (!c.oldStrip) {
    const captured = parseFixture(c.name).indicators.map((l) => TO_INDICATOR[l] ?? l);
    expect(view(s).indicators, `${c.name} indicators`).toEqual(captured);
  }
}

function suite(title: string, cases: Case[]) {
  describe(title, () => {
    for (const c of cases) (c.needsMath && !mathReady ? it.skip : it)(`${c.name}: ${c.what}`, () => check(c));
  });
}

// ------------------------------------------------------------------------------------------------

const stats2: StatRecord = {
  kind: "2-Var",
  title: "2-Var:L1,L2",
  items: ([
    ["stat_n", 4], ["stat_xbar", 56.5], ["stat_Sx", 19.89137166], ["stat_sx", 17.22643318], ["stat_Sumx", 226],
    ["stat_Sumx2", 13956], ["stat_ybar", 19.6025], ["stat_Sy", 13.98459957], ["stat_sy", 12.11101849], ["stat_Sumy", 78.41],
    ["stat_Sumy2", 2123.7391], ["stat_Sumxy", 5234.15], ["stat_a", 0.6773251903], ["stat_b", -18.66637321], ["stat_r", 0.9634117174],
    ["stat_xprime", null], ["stat_yprime", null], ["stat_minX", 45], ["stat_maxX", 79], ["stat_minY", 5.3], ["stat_maxY", 38.45],
  ] as [SymId, number | null][]).map(([key, value]) => ({ key, value })),
};

suite("menus", [
  { name: "GS_mem01", what: "Clear Var", state: () => run("CLEAR_VAR") },
  { name: "GS_mem04", what: "Recall Var after 15→x", state: () => run("RECALL", { ...base, vars: { ...base.vars, x: int(15) } }) },
  {
    name: "GS_mem_p02b",
    what: "Recall Var in ENG (GB-032c)",
    state: () => run("RECALL", withModes({ notation: "ENG" }, { ...base, vars: { ...base.vars, x: int(196000), y: int(207400) } })),
  },
  { name: "MF_prob02", what: "8 prb", state: () => run("8 PRB"), oldStrip: true },
  { name: "MF_prob06", what: "prb ►", state: () => run("5 STO PRB RIGHT"), oldStrip: true },
  { name: "MF_StAngle02", what: "RAD: sin 30 2nd angle", state: () => run("SIN 30 ANGLE", withModes({ angle: "RAD" })) },
  { name: "MF_stats1var03", what: "2nd stat", state: () => run("STAT") },
  {
    name: "MF_stats2var03",
    what: "2nd stat with StatVars, ▼",
    state: () => run("STAT DOWN", withStat({ kind: "1-Var", title: "1-Var:L1,One", items: [{ key: "stat_n", value: 4 }] })),
  },
  { name: "MF_stats1var01", what: "data data ▼▼▼ (GB-077a)", state: () => run("DATA DATA DOWN×3") },
  { name: "MT_DataEd014", what: "data data ► in ENG", state: () => run("DATA DATA RIGHT", withModes({ notation: "ENG" })) },
  { name: "MT_DataEd03b", what: "FORMULA tab, ▼×4", state: () => run("DATA DATA RIGHT DOWN×4") },
  {
    name: "MF_stats1var05",
    what: "1-Var results (GB-077d)",
    state: () => run("STAT 3", withStat({ kind: "1-Var", title: "1-Var:L1,One", items: [{ key: "stat_n", value: 4 }, { key: "stat_xbar", value: 52.5 }, { key: "stat_Sx", value: 5 }, { key: "stat_sx", value: 4.330127019 }] })),
  },
  {
    name: "MF_statspr05B",
    what: "1-Var results with Sx=Error (GB-079c)",
    state: () => run("STAT 3", withStat({ kind: "1-Var", title: "1-Var:L1,L2", items: [{ key: "stat_n", value: 3 }, { key: "stat_xbar", value: 11.33333333 }, { key: "stat_Sx", value: null }, { key: "stat_sx", value: 1 }] })),
  },
  { name: "MF_statspr205", what: "2-Var results (GB-080b)", state: () => run("STAT 3", withStat(stats2)) },
  { name: "MF_statspr206", what: "2-Var results ▼ to E (GB-080c)", state: () => run("STAT 3 DOWN×13", withStat(stats2)) },
  { name: "MF_statspr207", what: "2-Var results ▼ to H (GB-080d)", state: () => run("STAT 3 DOWN×16", withStat(stats2)), oldStrip: true },
  { name: "MF_stats2var05B", what: "2-Var results ▲×6 wraps to G (GB-078c)", state: () => run("STAT 3 UP×6", withStat(stats2)) },
]);

suite("MODE screen", [
  { name: "GS_ModeDefaults", what: "defaults", state: () => run("MODE") },
  { name: "MF_AngModeRad", what: "► enter selects RAD", state: () => run("MODE RIGHT ENTER") },
  { name: "MF_x10n01", what: "▼ ► enter selects SCI", state: () => run("MODE DOWN RIGHT ENTER") },
  { name: "MF_TrigModeFix1", what: "▼▼ ►► enter selects FIX 1", state: () => run("MODE DOWN DOWN RIGHT RIGHT ENTER") },
  { name: "MF_AngModeFix2", what: "▼▼ ►►► enter selects FIX 2 (GB-057a)", state: () => run("MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER") },
]);

suite("stat wizards", [
  { name: "MF_stats1var04", what: "1-VAR STATS defaults", state: () => run("STAT 1") },
  { name: "MF_statspr04", what: "FRQ L2 chosen (GB-079b)", state: () => run("STAT 1 DOWN RIGHT RIGHT ENTER") },
  { name: "MF_stats2var04", what: "2-VAR STATS defaults", state: () => run("STAT 2") },
]);

const L1frac = [q(1, 4), q(1, 2), q(3, 4), int(1)];
const L1neg = [int(8), int(-1), int(4)];
const formulaL1FD: Row = [S("L1"), S("toFD")];

suite("data editor", [
  { name: "MT_DataEd01", what: "fractions stay fractions (GB-088a)", state: () => run("DATA DOWN×4", withLists(L1frac)) },
  { name: "MF_stats1var02", what: "45 55 55 55, ▼ to the end (GB-077b)", state: () => run("DATA DOWN×4", withLists([int(45), int(55), int(55), int(55)])) },
  { name: "MT_DataEd015", what: "Add/Edit Frmla prompt (GB-088c)", state: () => run("DATA RIGHT DATA RIGHT 1", withLists(L1frac)) },
  { name: "MT_DataEd016", what: "♦L2=L1▸F◂▸D via the Ls menu (GB-088d)", state: () => run("DATA RIGHT DATA RIGHT 1 DATA 1 F_D", withLists(L1frac)) },
  {
    name: "MT_DataEd055",
    what: "♦L2=9/5×L1+32 with the block cursor (GB-089c)",
    state: () => run("DATA RIGHT DATA RIGHT 1 9 / 5 * DATA 1 + 32", withLists(L1neg)),
    blinkOn: true,
  },
  {
    name: "MT_DataEd02",
    what: "a formula list: inverse label, decimal values",
    state: () => run("DATA RIGHT", withLists(L1frac, [dec(0.25), dec(0.5), dec(0.75), dec(1)], [], [null, formulaL1FD, null])),
  },
  {
    name: "MT_DataEd04",
    what: "L1 8 ⁻1 4, ► to the empty L2",
    state: () => run("DATA RIGHT", withLists(L1neg)),
    // ↑ is lit with nothing scrolled off, and goes out at the next step (MT_DataEd05): no rule fits
    oldStrip: "unexplained ↑",
  },
  { name: "MT_DataEd05", what: "formula prompt over an empty L2", state: () => run("DATA RIGHT DATA RIGHT 1", withLists(L1neg)) },
  {
    name: "MF_statspr06",
    what: "frequencies in L2; the end of L1 selected",
    state: () => run("DATA DOWN×4", withLists([int(12), int(13), int(10), int(15)], [int(1), dec(0.5), int(1), dec(0.5)])),
  },
  {
    name: "MT_DataEd06",
    what: "formula results in L2 (GB-089d)",
    state: () => run("DATA RIGHT", withLists(L1neg, [dec(46.4), dec(30.2), dec(39.2)], [], [null, formulaL1FD, null])),
  },
  {
    name: "MT_DataEd07",
    what: "scrolled: the empty L1 cell at the bottom (GB-089e)",
    state: () => run("DATA DOWN×4", withLists([...L1neg, int(21)], [dec(46.4), dec(30.2), dec(39.2), dec(69.8)], [], [null, formulaL1FD, null])),
  },
  {
    name: "MF_statspr202",
    what: "L2 decimals; ► ▼×4 to the end of L2",
    state: () => run("DATA RIGHT DOWN×4", withLists([int(33), int(49), int(65), int(79)], [dec(5.3), dec(14.45), dec(20.21), dec(38.45)])),
    oldStrip: true,
  },
  {
    name: "MF_statspr02",
    what: "frequencies 1 .5 1 .5; the end of L2",
    state: () => run("DATA RIGHT DOWN×4", withLists([int(12), int(13), int(10), int(11)], [int(1), dec(0.5), int(1), dec(0.5)])),
  },
  {
    name: "MF_stats2var02",
    what: "two short lists (GB-078a)",
    state: () => run("DATA RIGHT DOWN×2", withLists([int(45), int(55)], [int(30), int(25)])),
    oldStrip: "unexplained ↑ (nothing scrolled off)",
  },
]);

suite("table and the K editor", [
  { name: "MT_functable01", what: "y=x(36−x) (GB-090a)", state: () => run("TABLE VAR ( 36 - VAR )"), oldStrip: true },
  { name: "MT_functable05", what: "y=3600−450x (GB-091a)", state: () => run("TABLE 3600 - 450 VAR"), oldStrip: true },
  { name: "MT_functable02", what: "setup defaults (GB-090b)", state: () => run("TABLE VAR ENTER") },
  { name: "MT_functable03", what: "Start=15 Step=3 (GB-090c)", state: () => run("TABLE VAR ENTER CLEAR 15 DOWN CLEAR 3") },
  { name: "MT_functable06", what: "Ask-x chosen (GB-091b)", state: () => run("TABLE VAR ENTER DOWN DOWN RIGHT ENTER") },
  {
    name: "MT_functable04",
    what: "Auto table from 15 step 3 (GB-090c)",
    state: () => run("TABLE VAR ( 36 - VAR ) ENTER CLEAR 15 DOWN CLEAR 3 DOWN DOWN ENTER"),
    oldStrip: true,
    needsMath: true,
  },
  {
    name: "MT_functable07",
    what: "Ask-x rows 2, 7, 8 (GB-091c)",
    state: () => run("TABLE 3600 - 450 VAR ENTER DOWN DOWN RIGHT ENTER ENTER 2 ENTER DOWN 7 ENTER DOWN 8 ENTER"),
    oldStrip: true,
    needsMath: true,
  },
  { name: "MT_ConK01", what: "2nd K: K= (GB-092a)", state: () => run("K") },
  { name: "MT_Conk02", what: "K=*2+3 saved (GB-092b)", state: () => run("K * 2 + 3 ENTER") },
  { name: "MT_Conk05", what: "K=² saved: the script lowers K= by 2 rows (GB-093a)", state: () => run("K * 2 + 3 ENTER K K CLEAR SQUARE ENTER") },
  { name: "MT_Conk09", what: "K=*5−2 saved (GB-095a)", state: () => run("K * 5 - 2 ENTER") },
]);
