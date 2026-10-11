/**
 * Pixel-level checks of whole flows: each TI-SmartView capture in tests/fixtures/lcd_dumps.txt that
 * shows a Home, menu or app screen is reproduced by its guidebook / teacher-guide keystrokes from a
 * fresh calculator (runScript only, no seeded state), rendered with renderView(view(state)) and
 * compared pixel for pixel. The lit indicators are compared too, except where noted per case.
 *
 * The last test checks the coverage: every capture is either reproduced here or listed in
 * NOT_FROM_KEYS with the reason.
 */
import { describe, expect, it } from "vitest";
import { fixtureNames } from "../display/fixtures";
import { expectCapture, MODE, run } from "./helpers";
import { view } from "../../src/engine";
import { indicatorsOf } from "../display/build";
import { parseFixture } from "../display/fixtures";

interface Case {
  name: string;
  keys: string;
  /** the capture shows the cursor in its "on" phase */
  blinkOn?: boolean;
  /**
   * Indicator check: "full" (default) compares every indicator; "noDown" ignores ↓, which the
   * captures light inconsistently after enter (home.ts homeArrows, SPEC: assumption); a string
   * skips the check and gives the reason.
   */
  strip?: "full" | "noDown" | string;
  /** expected to differ (minority or edited capture): the reason */
  fails?: string;
}

const OLD = "older emulator build: the strip omits the angle unit";
const STRAY_S = "stray S at the SCI position in NORM mode, an emulator artifact (K §5)";

// ---------------------------------------------------------------------------------------------
// Chains of guidebook steps (M §10), each step's keys appended to the previous ones

/** Join steps into cumulative scripts: chain("a", "b") → ["a", "a b"]. */
function chain<T extends string[]>(...steps: T): { [K in keyof T]: string } {
  const out: string[] = [];
  for (const st of steps) out.push(out.length ? `${out.at(-1)} ${st}` : st);
  return out as { [K in keyof T]: string };
}

const [gb016a, gb016b, gb016c, gb016d, gb016e, gb016f] = chain("1 + 1 ENTER", "2 + 2 ENTER", "3 + 3 ENTER", "4 + 4 ENTER", "UP UP UP UP ENTER", "+ 2 ENTER");
const [gb027, gb028a, gb028b, gb029a, gb029b, gb030a, gb030b, gb031a, gb031b] = chain(
  "2ND CLEAR_VAR", "1 15 STO VAR", "ENTER", "2ND RECALL", "ENTER SQUARE ENTER", "STO VAR VAR", "ENTER", "VAR VAR", "ENTER",
);
const [gb032a, gb032b, gb032c, gb032d, gb032e, gb032f, gb032g] = chain(
  `${MODE.ENG} 350 * 560 STO VAR ENTER`, "340 * 610 STO VAR VAR ENTER", "150 * 2ND RECALL", "ENTER ENTER",
  "210 * 2ND RECALL ENTER ENTER", "150 * VAR VAR ENTER", "210 * VAR VAR ENTER",
);
const [gb043a, gb043b, gb043c] = chain("3 2ND PERCENT * 5000 ENTER", "+ 2.3 2ND PERCENT * 7300 ENTER", "* 280 ENTER");
const [gb054a, gb054b, gb054c, gb055, gb056, gb057a, gb057b, gb057c, gb058] = chain(
  "MODE RIGHT ENTER", "CLEAR SIN 30 2ND ANGLE", "1 ) ENTER", "MODE ENTER CLEAR 2 PI 2ND ANGLE 4 ENTER", "1.5 2ND ANGLE 6 ENTER",
  "CLEAR MODE DOWN DOWN RIGHT RIGHT RIGHT ENTER",
  "CLEAR 12 2ND ANGLE 1 31 2ND ANGLE 2 45 2ND ANGLE 3 + 26 2ND ANGLE 1 54 2ND ANGLE 2 38 2ND ANGLE 3 ENTER",
  "2ND ANGLE 6 ENTER", "CLEAR SIN 30 ) ENTER",
);
const [gb062fix, , gb062b, , gb063b] = chain(
  "CLEAR MODE DOWN DOWN RIGHT RIGHT ENTER", "CLEAR 2ND ANGLE RIGHT 3 5 2ND COMMA 30 ) ENTER", "2ND ANGLE RIGHT 4 5 2ND COMMA 30 ) ENTER",
  "2ND ANGLE RIGHT 1 3 2ND COMMA 4 ) ENTER", "2ND ANGLE RIGHT 2 3 2ND COMMA 4 ) ENTER",
);
const [gb068a, gb068b] = chain(`${MODE.RAD} 2ND ATAN 1 ) ENTER`, "TOGGLE");
const [gb069a, gb069b] = chain(`${gb068b} TOGGLE 5 * COS PI FRAC 4 RIGHT ) ENTER`, "TOGGLE");
const [gb070a, gb070b, gb070c, gb070d] = chain(
  "MODE DOWN DOWN RIGHT RIGHT ENTER CLEAR 2ND ATAN 7 FRAC 3 RIGHT ) ENTER", "90 - 2ND ANS ENTER", "2ND SQRT 3 SQUARE + 7 SQUARE ENTER", "TOGGLE",
);
const [gb071a, gb071b] = chain("2ND HYP SIN 5 ) + 2 ENTER", "UP UP ENTER LEFT LEFT LEFT LEFT LEFT 2ND HYP 2ND ASIN ENTER");
const [gb072, gb073] = chain("LOG 1 ) ENTER", "LN 5 ) * 2 ENTER");
const [gb077a, gb077b, gb077c1, gb077c2, gb077d, gb077e, gb077f] = chain(
  "DATA DATA DOWN DOWN DOWN", "ENTER 45 DOWN 55 DOWN 55 DOWN 55 ENTER", "2ND STAT", "1", "DOWN DOWN ENTER", "2 ENTER", "* 2 ENTER",
);
// GB-078 follows GB-077 (its STATS menu shows 3:StatVars); 2nd quit leaves the results first
const [gb078a0, gb078a, gb078b1, gb078b2, gb078c, gb078d] = chain(
  `${gb077d} 2ND QUIT DATA DATA DOWN DOWN DOWN`, "ENTER 45 DOWN 55 DOWN RIGHT 30 DOWN 25 DOWN", "2ND STAT DOWN", "UP 2",
  "DOWN DOWN ENTER 2ND QUIT 2ND STAT 3 UP×6", "ENTER 45 ) ENTER",
);
// GB-079 follows GB-078 (the STATS menu still offers StatVars)
const [gb079a, gb079b0, gb079b, gb079c, gb079d, gb079e] = chain(
  `${gb078d} DATA DATA 4 DATA RIGHT 5 12 DOWN 13 DOWN 10 DOWN 11 DOWN RIGHT 1 DOWN .5 DOWN 1 DOWN .5 DOWN`, "2ND STAT", "1 DOWN RIGHT RIGHT ENTER",
  "ENTER", "DATA DOWN DOWN DOWN 15 DOWN", "2ND STAT 1 DOWN DOWN ENTER",
);
// GB-080's captures come from a new session: its STATS menu has no StatVars, and y′(55) is alone
const [gb080a0, gb080a, gb080b0, gb080b1, gb080b, gb080c, gb080d, gb080e] = chain(
  "DATA DATA DOWN DOWN DOWN", "UP 4 33 DOWN 49 DOWN 65 DOWN 79 DOWN RIGHT 5.3 DOWN 14.45 DOWN 20.21 DOWN 38.45 DOWN",
  "2ND STAT DOWN", "UP 2", "DOWN DOWN ENTER", "DOWN×13", "DOWN×3", "ENTER 55 ) ENTER",
);
const [gb081a, gb081b, gb081c] = chain("8", "PRB", "1 3 ENTER");
const [gb084a, gb084b, gb085, gb086] = chain("5 STO PRB RIGHT", "1 ENTER", "PRB RIGHT 1 ENTER", "PRB RIGHT 2 3 2ND COMMA 5 ) ENTER");
const [gb087a, gb087b, gb087c] = chain("25", "PRB 2", "3 ENTER");
const [gb088a, , gb088c, gb088d, gb088e] = chain(
  "DATA 1 FRAC 4 DOWN 2 FRAC 4 DOWN 3 FRAC 4 DOWN 4 FRAC 4 ENTER", "RIGHT DATA RIGHT", "ENTER", "DATA ENTER 2ND F_D", "ENTER",
);
const [gb089a1, gb089a2, gb089a, gb089b, gb089c, gb089d, gb089e] = chain(
  "DATA DATA DOWN DOWN DOWN", "UP 4 DATA RIGHT DOWN DOWN DOWN DOWN", "UP 5 8 DOWN NEG 1 DOWN 4 DOWN RIGHT", "DATA RIGHT 1", "9 / 5 * DATA 1 + 32",
  "ENTER", "LEFT DOWN DOWN DOWN 21 ENTER",
);
const [gb090a, gb090b, gb090c1, gb090c] = chain("TABLE VAR ( 36 - VAR )", "ENTER", "CLEAR 15 DOWN CLEAR 3", "DOWN DOWN ENTER");
const [gb091a, gb091b1, , gb091c] = chain("TABLE 3600 - 450 VAR", "ENTER 0 DOWN 1 DOWN RIGHT ENTER", "DOWN ENTER", "2 ENTER 7 ENTER 8 ENTER");
const [gb092a, gb092b, gb092c, gb092d, gb093a, gb093b, gb093c, gb094, gb095a, gb095b, gb095c, gb095d] = chain(
  "2ND K", "* 2 + 3 ENTER", "4 ENTER", "6 ENTER", "2ND K 2ND K CLEAR SQUARE ENTER", "5 ENTER", "20 ENTER", "2ND K 1 + 1 ENTER",
  "2ND K * 5 - 2 ENTER", "NEG 5 ENTER", "NEG 1 ENTER", "2ND K",
);

const CASES: Case[] = [
  // ---- GB p.2–8: modes, history (GS_*)
  { name: "GS_ModeDefaults", keys: "MODE" },
  { name: "MF_ModeDefaults_1", keys: "MODE" },
  { name: "GS_modeclasssci", keys: `${MODE.CLASSIC} ${MODE.SCI} 12345 ENTER`, strip: "noDown" },
  { name: "GS_modempsci", keys: `${MODE.SCI} 12345 ENTER`, strip: "noDown" },
  { name: "GS_modeclassfloat", keys: `${MODE.CLASSIC} 1 FRAC 8 ENTER TOGGLE`, strip: "noDown" },
  { name: "GS_modempfloat", keys: "1 FRAC 8 ENTER TOGGLE", strip: "noDown" },
  { name: "GS_modeclassfixed", keys: `${MODE.CLASSIC} ${MODE.FIX(2)} 2 PI ENTER`, strip: "noDown" },
  { name: "GS_modempfixed", keys: `${MODE.FIX(2)} 2 PI ENTER TOGGLE`, strip: "noDown" },
  { name: "GS_modeclassund", keys: `${MODE.CLASSIC} 4 2ND MIXED 5 FRAC 9 ENTER`, strip: "noDown" },
  { name: "GS_modempund", keys: "4 2ND MIXED 5 DOWN 9 ENTER", strip: "noDown" },
  { name: "GS_modeclassexponent", keys: `${MODE.CLASSIC} 2 POWER 5 ENTER`, strip: "noDown" },
  { name: "GS_modempexponent", keys: "2 POWER 5 ENTER", strip: "noDown" },
  // GB-012: the printed keys omit [)], the screen shows √(2) (see guidebook.test.ts)
  { name: "GS_modeclasssqrt", keys: `${MODE.CLASSIC} 2ND SQRT 2 ) ENTER`, strip: "noDown" },
  {
    name: "GS_modempsqrt",
    keys: "2ND SQRT 2 ENTER TOGGLE",
    strip: "noDown",
    fails: "the capture lacks one stem pixel of the second √ (row 11, column 3), a SmartView glitch",
  },
  { name: "GS_modeclasscuberoot", keys: `${MODE.CLASSIC} 3 2ND NTH_ROOT 64 ENTER`, strip: "noDown" },
  { name: "GS_modempcuberoot", keys: "3 2ND NTH_ROOT 64 ENTER", strip: "noDown" },
  { name: "GS_scroll01", keys: gb016a, strip: "noDown" },
  { name: "GS_scroll02", keys: gb016b, strip: "noDown" },
  { name: "GS_scrolltest", keys: gb016c, strip: OLD },
  { name: "GS_scroll04", keys: gb016d, strip: "noDown" },
  { name: "GS_scroll05", keys: gb016e, blinkOn: true, strip: "noDown" },
  { name: "GS_scroll06", keys: gb016f, strip: "noDown" },
  { name: "GS_AnsTog01", keys: "2ND SQRT 8 ENTER", strip: "noDown" },
  { name: "GS_AnsTog02", keys: "2ND SQRT 8 ENTER TOGGLE", strip: "noDown" },
  { name: "GS_lastans01", keys: "3 * 3 ENTER", strip: "noDown" },
  { name: "GS_lastans02", keys: "3 * 3 ENTER * 3 ENTER", strip: "noDown", fails: "older build: lower-case `ans` (K §4.4)" },
  {
    name: "GS_lastans03",
    keys: "3 * 3 ENTER * 3 ENTER 3 2ND NTH_ROOT 2ND ANS ENTER",
    strip: "noDown",
    fails: "older build: lower-case `ans`, and the result aligned with the radicand",
  },
  { name: "GS_EOS01", keys: `${MODE.CLASSIC} 2 POWER 3 POWER 2 ENTER`, strip: "noDown" },
  { name: "GS_EOS02", keys: "2 POWER 3 POWER 2 ENTER", strip: "noDown" },

  // ---- GB p.9: order of operations
  { name: "GS_order01", keys: "60 + 5 * NEG 12 ENTER", strip: "noDown" },
  { name: "GS_order02", keys: "1 + NEG 8 + 12 ENTER", strip: "noDown" },
  { name: "GS_order03", keys: "2ND SQRT 9 + 16 ENTER", strip: "noDown" },
  { name: "GS_order04", keys: "4 * ( 2 + 3 ) ENTER", strip: "noDown" },
  { name: "GS_order05", keys: "4 ( 2 + 3 ) ENTER", strip: "noDown" },
  { name: "GS_order06", keys: "2ND SQRT 3 POWER 2 RIGHT + 4 POWER 2 ENTER", strip: "noDown" },

  // ---- GB p.10–12: memory
  { name: "GS_mem01", keys: gb027 },
  { name: "GS_mem02", keys: gb028a },
  { name: "GS_mem03", keys: gb028b, strip: "noDown" },
  { name: "GS_mem04", keys: gb029a },
  { name: "GS_mem05", keys: gb029b, strip: "noDown" },
  { name: "GS_mem06", keys: gb030a, strip: "noDown" },
  { name: "GS_mem07", keys: gb030b, strip: "noDown" },
  { name: "GS_mem08", keys: gb031a, strip: "noDown" },
  { name: "GS_mem09", keys: `${gb031b} / 4 ENTER`, strip: "noDown" },
  { name: "GS_mem_p01", keys: gb032a, strip: "noDown" },
  { name: "GS_mem_p02", keys: gb032b, strip: "noDown" },
  { name: "GS_mem_p02b", keys: gb032c },
  { name: "GS_mem_p03", keys: gb032d, strip: "noDown" },
  { name: "GS_Mem_P04b", keys: gb032e, strip: "noDown" },
  { name: "GS_mem_p05a", keys: gb032f, strip: "noDown" },
  { name: "GS_mem_p06", keys: gb032g, strip: "noDown" },

  // ---- GB p.13–14: fractions
  { name: "MF_frac01", keys: `${MODE.CLASSIC} 3 FRAC 4 + 1 2ND MIXED 7 FRAC 12 ENTER`, strip: STRAY_S },
  { name: "MF_frac02", keys: `${MODE.CLASSIC} 9 FRAC 2 2ND FRAC_CONV ENTER`, strip: STRAY_S },
  { name: "MF_frac03", keys: `${MODE.CLASSIC} 4 2ND MIXED 1 FRAC 2 2ND F_D ENTER`, strip: "noDown" },
  { name: "MF_frac04", keys: "FRAC 3 DOWN 4 RIGHT + 1 2ND MIXED 7 DOWN 12 ENTER", strip: STRAY_S },
  { name: "MF_frac05", keys: "9 FRAC 2 RIGHT 2ND FRAC_CONV ENTER", strip: STRAY_S },
  { name: "MF_frac06", keys: "4 2ND MIXED 1 DOWN 2 RIGHT 2ND F_D ENTER", strip: "noDown" },
  { name: "MF_frac07", keys: "FRAC 1.2 + 1.3 DOWN 4 ENTER", strip: STRAY_S },
  { name: "MF_frac08", keys: "FRAC NEG 5 + 2ND SQRT 5 SQUARE - 4 ( 1 ) ( 6 ) DOWN 2 ( 1 ) ENTER", strip: "noDown" },

  // ---- GB p.14–16: percent, ×10ⁿ
  { name: "MF_Percent01", keys: "2 2ND PERCENT * 150 ENTER", strip: "noDown" },
  { name: "MF_Percent02", keys: "1 FRAC 5 RIGHT 2ND TO_PERCENT ENTER", strip: "noDown" },
  { name: "MF_Percent03", keys: gb043a, strip: "noDown" },
  { name: "MF_Percent04", keys: gb043b, strip: "noDown" },
  { name: "MF_Percent05", keys: gb043c, strip: "noDown" },
  { name: "MF_x10n01", keys: "MODE DOWN RIGHT ENTER" },
  {
    name: "MF_x10n02",
    keys: "MODE DOWN RIGHT ENTER CLEAR FRAC 2 EE 3 DOWN 4 EE 5 RIGHT RIGHT TOGGLE ENTER",
    strip: "noDown",
    fails: "a .png from a newer layout: the bar overhangs its content by 2 px on each side (D §5.8)",
  },

  // ---- GB p.16–17: powers, roots, π
  { name: "MF_powerRootsInv1", keys: "5 POWER 2 RIGHT + 4 POWER ( 2 + 1 ) ENTER", strip: "noDown" },
  { name: "MF_powerRootsInv2", keys: "10 POWER NEG 2 ENTER", strip: OLD },
  { name: "MF_powerRootsInv3", keys: "2ND SQRT 49 ENTER", strip: "noDown" },
  { name: "MF_powerRootsInv4", keys: "2ND SQRT 3 POWER 2 RIGHT + 2 POWER 4 ENTER", strip: "noDown" },
  { name: "MF_powerRootsInv5", keys: "6 2ND NTH_ROOT 64 ENTER", strip: "noDown" },
  { name: "MF_powerRootsInv6", keys: "2 RECIP ENTER", strip: "noDown" },
  { name: "MF_Pi1", keys: "2 * PI ENTER", strip: "noDown" },
  { name: "MF_Pi2", keys: "2 * PI ENTER TOGGLE", strip: "noDown" },
  { name: "MF_Pi3", keys: "PI * 12 POWER 2 ENTER", strip: "noDown" },
  { name: "MF_Pi4", keys: "PI * 12 POWER 2 ENTER TOGGLE", strip: "noDown" },

  // ---- GB p.18–20: angles, DMS, polar
  { name: "MF_AngModeRad", keys: gb054a },
  { name: "MF_StAngle02", keys: gb054b },
  { name: "MF_StAngle02_1", keys: gb054b },
  { name: "MF_StAngle03", keys: gb054c, strip: "noDown" },
  { name: "MF_StAngle05", keys: gb055, strip: "noDown" },
  { name: "MF_StAngle07", keys: gb056, strip: "noDown" },
  { name: "MF_AngModeFix2", keys: gb057a },
  { name: "MF_StAngle08", keys: gb057b, strip: "noDown" },
  { name: "MF_StAngle09", keys: gb057c, strip: "noDown" },
  { name: "MF_StAngle10", keys: gb058, strip: OLD },
  {
    name: "MF_StAngle11.",
    keys: `${gb058} MODE RIGHT ENTER CLEAR SIN PI FRAC 6 RIGHT ) ENTER`,
    strip: "noDown",
    fails: "edited image: the ʳ of sin(π/6ʳ) erased, bar stretched to 7 px (unedited: MF_StAngle13)",
  },
  {
    name: "MF_StAngle12",
    keys: `${MODE.RAD} SIN PI FRAC 6 RIGHT ) ENTER SIN 30 2ND ANGLE ENTER ) ENTER`,
    strip: "noDown",
    fails: "edited image: the ʳ of sin(π/6ʳ) erased, bar stretched to 7 px (unedited: MF_StAngle13)",
  },
  // GB-060 then GB-061 (GB-061 switches back to DEG; FIX from p.19 is not set in this capture)
  { name: "MF_StAngle13", keys: `${MODE.RAD} SIN 30 2ND ANGLE ENTER ) ENTER MODE ENTER CLEAR SIN PI FRAC 6 RIGHT 2ND ANGLE 4 ) ENTER`, strip: "noDown" },
  { name: "MF_RcPolModeFix1", keys: gb062fix },
  { name: "MF_TrigModeFix1", keys: gb062fix },
  { name: "MF_StAngle15", keys: gb062b, strip: "noDown" },
  { name: "MF_StAngle16", keys: gb063b, strip: "noDown" },

  // ---- GB p.21–22: trigonometry (each capture starts a session; the page's first step is FLOAT DEG)
  { name: "MF_Trig1", keys: "TAN 45 ) ENTER", strip: "noDown" },
  { name: "MF_Trig2", keys: "2ND ATAN 1 ) ENTER", strip: "noDown" },
  { name: "MF_Trig3", keys: "5 * COS 60 ) ENTER", strip: "noDown" },
  {
    name: "MF_Trig4",
    keys: "MODE RIGHT ENTER CLEAR TAN PI FRAC 4 RIGHT ) ENTER",
    strip: "the edited image keeps DEG (M §10: the indicator is wrong)",
    fails: "edited image: the ʳ after π/4 erased and the bar stretched to 7 px (MF_Trig6-1 draws π/4 with a 5-px bar)",
  },
  { name: "MF_Trig5", keys: gb068a, strip: "noDown" },
  { name: "MF_Trig5-2", keys: gb068b, strip: "noDown" },
  // the capture's first line is π/4◂▸ = 0.785398163: ◂▸ was pressed again after GB-068b
  { name: "MF_Trig6-1", keys: gb069a, strip: "noDown" },
  { name: "MF_Trig6-2", keys: gb069b, strip: "noDown" },
  { name: "MF_Trig7-1", keys: gb070a, strip: "noDown" },
  { name: "MF_Trig7-2", keys: gb070b, strip: "noDown" },
  { name: "MF_Trig7-3", keys: gb070c, strip: "noDown" },
  { name: "MF_Trig7-4", keys: gb070d, strip: "noDown" },

  // ---- GB p.23: hyperbolics, logs
  { name: "MF_hyp01", keys: gb071a, strip: "noDown" },
  { name: "MF_hyp02", keys: gb071b, strip: "noDown" },
  { name: "MF_log01", keys: gb072, strip: "noDown" },
  { name: "MF_log02B", keys: gb073, strip: "noDown" },
  { name: "MF_log04", keys: "2ND E_X .5 ENTER", strip: "noDown" },
  {
    name: "MF_log10xB",
    keys: `${gb073} 2ND TEN_X LOG 2 ) ENTER LOG 2ND TEN_X 5 RIGHT ) ENTER`,
    strip: "noDown",
    fails: "older build: draws the partly hidden top line and bottom-aligns results (majority: GS_mem_p02, MF_Trig7-3)",
  },

  // ---- GB p.24–29: statistics
  { name: "MF_stats1var01", keys: gb077a },
  { name: "MF_stats1var01_1", keys: gb077a },
  { name: "MF_stats1var02", keys: gb077b },
  { name: "MF_stats1var03", keys: gb077c1 },
  { name: "MF_stats1var04", keys: gb077c2 },
  { name: "MF_stats1var05", keys: gb077d },
  { name: "MF_stats1var06", keys: gb077e, strip: "noDown" },
  { name: "MF_stats1var_08", keys: gb077f, strip: "noDown" },
  { name: "MF_stats2var01", keys: gb078a0 },
  { name: "MF_stats2var02", keys: gb078a, strip: "↑ lit with nothing scrolled off (MF_statspr02 lights it, MT_DataEd05 not): no rule fits" },
  // the page shows the menu as [2nd][stat] 2 is pressed: item 2 highlighted
  { name: "MF_stats2var03", keys: gb078b1 },
  { name: "MF_stats2var04", keys: gb078b2 },
  { name: "MF_stats2var05B", keys: gb078c },
  { name: "MF_stats2var06", keys: gb078d, strip: "noDown" },
  { name: "MF_statspr02", keys: gb079a },
  { name: "MF_statspr03", keys: gb079b0 },
  { name: "MF_statspr04", keys: gb079b },
  { name: "MF_statspr05B", keys: gb079c },
  { name: "MF_statspr06", keys: gb079d },
  { name: "MF_statspr07B", keys: gb079e },
  { name: "MF_statspr201", keys: gb080a0 },
  { name: "MF_statspr202", keys: gb080a, strip: OLD },
  { name: "MF_statspr203", keys: gb080b0, strip: OLD },
  { name: "MF_statspr204", keys: gb080b1, strip: OLD },
  { name: "MF_statspr205", keys: gb080b },
  { name: "MF_statspr206", keys: gb080c },
  { name: "MF_statspr207", keys: gb080d, strip: OLD },
  { name: "MF_statspr208", keys: gb080e, strip: "noDown" },

  // ---- GB p.29–31: probability (older strips: no angle unit)
  { name: "MF_prob01", keys: gb081a, blinkOn: true, strip: OLD },
  { name: "MF_prob02", keys: gb081b, strip: OLD },
  { name: "MF_prob03", keys: gb081c, strip: OLD },
  { name: "MF_prob04", keys: "52 PRB 2 5 ENTER", strip: OLD },
  { name: "MF_prob05", keys: "4 PRB 3 ENTER", strip: OLD },
  { name: "MF_prob06", keys: gb084a, strip: OLD },
  { name: "MF_prob07", keys: gb084b, strip: OLD },
  { name: "MF_prob08", keys: gb085, strip: OLD },
  { name: "MF_prob09", keys: gb086, strip: OLD },
  { name: "MF_probpr01", keys: gb087a, strip: OLD },
  { name: "MF_probpr02", keys: gb087b, strip: OLD },
  { name: "MF_probpr03", keys: gb087c, strip: OLD },

  // ---- GB p.32–33: data editor and formulas
  { name: "MT_DataEd01", keys: gb088a },
  // GB-088b's CLEAR FORMULA menu, captured in another session left in ENG
  { name: "MT_DataEd014", keys: `${MODE.ENG} DATA DATA RIGHT` },
  { name: "MT_DataEd015", keys: gb088c },
  { name: "MT_DataEd016", keys: gb088d },
  { name: "MT_DataEd02", keys: gb088e },
  { name: "MT_DataEd03", keys: gb089a1 },
  { name: "MT_DataEd03b", keys: gb089a2 },
  { name: "MT_DataEd03b_1", keys: gb089a2 },
  { name: "MT_DataEd04", keys: gb089a, strip: "↑ lit with nothing scrolled off, out again at the next step (MT_DataEd05): no rule fits" },
  { name: "MT_DataEd05", keys: gb089b },
  { name: "MT_DataEd055", keys: gb089c, blinkOn: true },
  { name: "MT_DataEd06", keys: gb089d },
  { name: "MT_DataEd07", keys: gb089e },

  // ---- GB p.34–35: function table
  { name: "MT_functable01", keys: gb090a, strip: OLD },
  { name: "MT_functable02", keys: gb090b },
  { name: "MT_functable03", keys: gb090c1 },
  { name: "MT_functable04", keys: gb090c, strip: OLD },
  { name: "MT_functable05", keys: gb091a, strip: OLD },
  { name: "MT_functable06", keys: gb091b1 },
  { name: "MT_functable07", keys: gb091c, strip: OLD },

  // ---- GB p.35–36: constant K
  { name: "MT_ConK01", keys: gb092a },
  { name: "MT_Conk02", keys: gb092b },
  { name: "MT_Conk03", keys: gb092c, strip: "noDown" },
  { name: "MT_Conk04", keys: gb092d, strip: "noDown" },
  { name: "MT_Conk05", keys: gb093a },
  { name: "MT_Conk06", keys: gb093b, strip: "noDown" },
  { name: "MT_Conk07", keys: gb093c, strip: "noDown" },
  { name: "MT_Conk08", keys: gb094, strip: "noDown" },
  { name: "MT_Conk09", keys: gb095a },
  { name: "MT_Conk10", keys: gb095b, strip: "noDown" },
  { name: "MT_Conk11", keys: gb095c, strip: "noDown" },
  { name: "MT_Conk12", keys: gb095d, strip: "noDown" },
];

/** Captures not reproduced from keystrokes, with the reason (none at present). */
const NOT_FROM_KEYS: Record<string, string> = {};

function check(c: Case): void {
  const s = run(c.keys);
  const strip = c.strip ?? "full";
  expectCapture(s, c.name, { blinkOn: c.blinkOn ?? false, strip: false });
  if (strip === "full" || strip === "noDown") {
    const want = indicatorsOf(parseFixture(c.name)).filter((i) => strip === "full" || i !== "down");
    const got = view(s).indicators.filter((i) => strip === "full" || i !== "down");
    expect(got, `${c.name} indicators`).toEqual(want);
  }
}

describe("TI-SmartView captures reproduced from guidebook keystrokes", () => {
  for (const c of CASES) {
    if (c.fails) it.fails(`${c.name} (minority capture: ${c.fails})`, () => check(c));
    else it(`${c.name}`, () => check(c));
  }
});

describe("capture coverage", () => {
  it("every capture is reproduced from keys or listed with a reason", () => {
    const covered = new Set([...CASES.map((c) => c.name), ...Object.keys(NOT_FROM_KEYS)]);
    expect(fixtureNames().filter((n) => !covered.has(n))).toEqual([]);
    expect(CASES.map((c) => c.name).filter((n, i, a) => a.indexOf(n) !== i)).toEqual([]);
  });
});
