/**
 * Golden display tests: hand-built Views rendered and compared pixel for pixel with TI-SmartView
 * captures (tests/fixtures/lcd_dumps.txt). Each case names the View that reproduces its capture.
 *
 * Where captures disagree, the majority rule is implemented and the minority captures are listed
 * with `fails` (run as it.fails) and the reason.
 */
import type { View } from "../../src/engine/screen";
import { cat, ee, frac, home, mixed, pow, root, sqrt, type HomeSpec } from "./build";
import { suite, type Case } from "./golden";

const H = (spec: HomeSpec) => (ind: View["indicators"]) => home(spec, ind);
const C = (spec: HomeSpec) => H({ ...spec, mp: false });

// ---------------------------------------------------------------------------------------------
// Home screen, Classic

const CLASSIC: Case[] = [
  { name: "GS_EOS01", what: "2^3^2 = 64", view: C({ history: [["2^3^2", "64"]] }) },
  { name: "GS_modeclasscuberoot", what: "3ˣ√64 = 4", view: C({ history: [["3ˣ√64", "4"]] }) },
  { name: "GS_modeclassexponent", what: "2^5 = 32", view: C({ history: [["2^5", "32"]] }) },
  { name: "GS_modeclassfixed", what: "2π = 6.28 (FIX 2)", view: C({ history: [["2π", "6.28"]] }) },
  { name: "GS_modeclassfloat", what: "1⁄8 = 1⁄8, then toggled 1⁄8◂▸ = 0.125", view: C({ history: [["1⁄8", "1⁄8"], ["1⁄8", "0.125", true]] }) },
  { name: "GS_modeclasssci", what: "12345 = 1.2345*10^4 on the next line (16 cells)", view: C({ history: [["12345", cat("1.2345", ee("4"))]] }) },
  { name: "GS_modeclasssqrt", what: "√(2) = 1.414213562 on the next line (15 cells)", view: C({ history: [["√(2)", "1.414213562"]] }) },
  { name: "GS_modeclassund", what: "4⌴5⁄9 = 41⁄9", view: C({ history: [["4⌴5⁄9", "41⁄9"]] }) },
  { name: "MF_frac01", what: "3⁄4+1⌴7⁄12 = 7⁄3 (13 cells, same line)", view: C({ history: [["3⁄4+1⌴7⁄12", "7⁄3"]] }) },
  { name: "MF_frac02", what: "9⁄2▸n/d◂▸Un/d = 4⌴1⁄2", view: C({ history: [["9⁄2▸n/d◂▸Un/d", "4⌴1⁄2"]] }) },
  { name: "MF_frac03", what: "4⌴1⁄2▸F◂▸D = 4.5", view: C({ history: [["4⌴1⁄2▸F◂▸D", "4.5"]] }) },
  {
    name: "MF_StAngle08",
    what: "a 19-cell entry cut at cell 15 with ▶; FIX 2 result on the next line",
    view: C({ history: [["12°31′45″+26°54′38″", "39.44"]] }),
  },
  {
    name: "MF_StAngle09",
    what: "two cut entries; ▸DMS result on the next line, 4 lines filling the screen",
    view: C({ history: [["12°31′45″+26°54′38″", "39.44"], ["39.43972222221▸DMS", "39°26′23″"]] }),
  },
  { name: "MF_StAngle15", what: "P▸Rx(5,30) = 4.3, P▸Ry(5,30) = 2.5 (FIX 1)", view: C({ history: [["P▸Rx(5,30)", "4.3"], ["P▸Ry(5,30)", "2.5"]] }) },
  {
    name: "MF_StAngle16",
    what: "4 lines of polar/rectangular conversions",
    view: C({ history: [["P▸Rx(5,30)", "4.3"], ["P▸Ry(5,30)", "2.5"], ["R▸Pr(3,4)", "5.0"], ["R▸Pθ(3,4)", "53.1"]] }),
  },
];

// ---------------------------------------------------------------------------------------------
// Home screen, MathPrint: plain lines, history stacking, scrolling

const PLAIN: Case[] = [
  { name: "GS_scroll01", what: "1+1 = 2", view: H({ history: [["1+1", "2"]] }) },
  { name: "GS_scroll04", what: "4 history lines fill the screen; no entry line after enter", view: H({ history: [["1+1", "2"], ["2+2", "4"], ["3+3", "6"], ["4+4", "8"]] }) },
  {
    name: "GS_scroll05",
    what: "history pasted into the entry: 3+3 with the block cursor after it, scrolled up one line",
    view: H({ history: [["1+1", "2"], ["2+2", "4"], ["3+3", "6"], ["4+4", "8"]], entry: "3+3" }),
  },
  {
    name: "GS_scroll06",
    what: "3+3+2 = 8 as the 5th line: bottom-aligned, top line hidden",
    view: H({ history: [["1+1", "2"], ["2+2", "4"], ["3+3", "6"], ["4+4", "8"], ["3+3+2", "8"]] }),
  },
  { name: "GS_scrolltest", what: "3 lines (cursor blink off)", view: H({ history: [["1+1", "2"], ["2+2", "4"], ["3+3", "6"]] }), blinkOn: false },
  { name: "GS_order01", what: "60+5*⁻12 = 0: raised negation", view: H({ history: [["60+5*⁻12", "0"]] }) },
  { name: "GS_order02", what: "1+⁻8+12 = 5", view: H({ history: [["1+⁻8+12", "5"]] }) },
  { name: "GS_order04", what: "4*(2+3) = 20", view: H({ history: [["4*(2+3)", "20"]] }) },
  { name: "GS_order05", what: "4(2+3) = 20", view: H({ history: [["4(2+3)", "20"]] }) },
  { name: "GS_lastans01", what: "3*3 = 9", view: H({ history: [["3*3", "9"]] }) },
  { name: "GS_mem02", what: "typing 15→x (variable glyph), cursor blink off", view: H({ entry: "15→x" }), blinkOn: false },
  { name: "GS_mem03", what: "15→x = 15", view: H({ history: [["15→x", "15"]] }) },
  { name: "MF_prob01", what: "typing 8 with the block cursor after it", view: H({ entry: "8" }) },
  { name: "MF_prob03", what: "8 nPr 3 = 336", view: H({ history: [["8 nPr 3", "336"]] }) },
  { name: "MF_prob04", what: "52 nCr 5 = 2598960 on the next line (8+7 cells)", view: H({ history: [["52 nCr 5", "2598960"]] }) },
  { name: "MF_prob05", what: "4! = 24", view: H({ history: [["4!", "24"]] }) },
  {
    name: "MF_prob09",
    what: "5→rand, rand (result on the next line), randint(3,5): 4 lines",
    view: H({ history: [["5→rand", "5"], ["rand", "0.000093165"], ["randint(3,5)", "5"]] }),
  },
  { name: "MF_probpr02", what: "typing 25 nCr (blink off)", view: H({ entry: "25 nCr " }), blinkOn: false },
  {
    name: "MF_Percent05",
    what: "% entries; Ans+2.3%*7300 (13 cells) puts 317.9 on the next line",
    view: H({ history: [["3%*5000", "150"], ["Ans+2.3%*7300", "317.9"], ["Ans*280", "89012"]] }),
  },
  { name: "MF_Pi2", what: "2*π = 2π, toggled 2π◂▸ = 6.283185307 (3+11 cells, same line)", view: H({ history: [["2*π", "2π"], ["2π", "6.283185307", true]] }) },
  { name: "MF_hyp02", what: "sinh(5)+2 and sinh⁻¹(5)+2 with results on the next lines", view: H({ history: [["sinh(5)+2", "76.20321058"], ["sinh⁻¹(5)+2", "4.312438341"]] }) },
  { name: "MF_log02B", what: "log(1) = 0, ln(5)*2 = 3.218875825", view: H({ history: [["log(1)", "0"], ["ln(5)*2", "3.218875825"]] }) },
  { name: "MF_Trig2", what: "tan⁻¹(1) = 45: the ⁻¹ glyph", view: H({ history: [["tan⁻¹(1)", "45"]] }) },
  { name: "MF_stats1var_08", what: "x̄ = 52.5, Ans*2 = 105", view: H({ history: [["x̄", "52.5"], ["Ans*2", "105"]] }) },
  { name: "MF_stats2var06", what: "x′(45) = 15", view: H({ history: [["x′(45)", "15"]] }) },
  { name: "MF_statspr208", what: "y′(55) = 18.58651222 on the next line", view: H({ history: [["y′(55)", "18.58651222"]] }) },
  { name: "MT_Conk04", what: "constant K: 4*2+3 = 11, 6*2+3 = 15", view: H({ history: [["4*2+3", "11"], ["6*2+3", "15"]] }) },
  { name: "MT_Conk12", what: "⁻5*5−2 = ⁻27: negation vs subtraction", view: H({ history: [["⁻5*5−2", "⁻27"], ["⁻1*5−2", "⁻7"]] }) },
  {
    name: "GS_mem09",
    what: "5 history items, bottom-aligned; the 15² line is cut at the top and not drawn",
    view: H({ history: [["15→x", "15"], [cat("15", "²"), "225"], ["Ans→y", "225"], ["y", "225"], ["Ans÷4", "56.25"]] }),
  },
];

// ---------------------------------------------------------------------------------------------
// Home screen, MathPrint 2-D layout

const MP: Case[] = [
  { name: "GS_EOS02", what: "2^3^2 as a stacked tower (small font twice), 512 top-aligned", view: H({ history: [[cat("2", pow(cat("3", pow("2")))), "512"]] }) },
  { name: "GS_modempexponent", what: "2⁵ = 32", view: H({ history: [[cat("2", pow("5")), "32"]] }) },
  { name: "MF_powerRootsInv1", what: "E3: 5²+4^(2+1) = 89, result top-aligned", view: H({ history: [[cat("5²+4", pow("(2+1)")), "89"]] }) },
  { name: "MF_powerRootsInv2", what: "10⁻² = 1/100", view: H({ history: [[cat("10", pow("⁻2")), [frac("1", "100")]]] }) },
  { name: "MF_powerRootsInv6", what: "2⁻¹ (x⁻¹ drawn as a small ⁻1 script) = 1/2", view: H({ history: [["2⁻¹", [frac("1", "2")]]] }) },
  { name: "MT_Conk07", what: "5² = 25, 20² = 400", view: H({ history: [["5²", "25"], ["20²", "400"]] }) },
  { name: "MF_Pi4", what: "π*12² = 144π, toggled 144π◂▸ = 452.3893421 on the next line", view: H({ history: [["π*12²", "144π"], ["144π", "452.3893421", true]] }) },
  { name: "GS_mem07", what: "15→x, 15² = 225, Ans→y = 225", view: H({ history: [["15→x", "15"], ["15²", "225"], ["Ans→y", "225"]] }) },
  {
    name: "GS_mem08",
    what: "typing y below 3 items; the 15→x line is cut at the top and not drawn (blink off)",
    view: H({ history: [["15→x", "15"], ["15²", "225"], ["Ans→y", "225"]], entry: "y" }),
    blinkOn: false,
  },
  { name: "GS_modempsci", what: "12345 = 1.2345*10⁴ (×10ⁿ superscript) on the next line", view: H({ history: [["12345", cat("1.2345", ee("4"))]] }) },
  { name: "GS_mem_p01", what: "350*560→x = 196*10³ (ENG) on the next line", view: H({ history: [["350*560→x", cat("196", ee("3"))]] }) },
  {
    name: "GS_mem_p02",
    what: "bottom-aligned; the partly hidden entry line at the top is not drawn",
    view: H({ history: [["350*560→x", cat("196", ee("3"))], ["340*610→y", cat("207.4", ee("3"))]] }),
  },
  {
    name: "GS_mem_p03",
    what: "bottom-aligned 9-row script lines",
    view: H({ history: [["350*560→x", cat("196", ee("3"))], ["340*610→y", cat("207.4", ee("3"))], ["150*196000", cat("29.4", ee("6"))]] }),
  },
  {
    name: "GS_mem_p06",
    what: "150*y = 31.11*10⁶ shares its line (5+9 cells, top-aligned); 210*y = 43.554*10⁶ does not (5+10)",
    view: H({ history: [["210*196000", cat("41.16", ee("6"))], ["150*y", cat("31.11", ee("6"))], ["210*y", cat("43.554", ee("6"))]] }),
  },
  { name: "GS_order03", what: "√(9+16) = 5", view: H({ history: [[[sqrt("9+16")], "5"]] }) },
  { name: "GS_order06", what: "√(3²+4²): 3 blank rows above a big radicand with scripts; 5 top-aligned", view: H({ history: [[[sqrt("3²+4²")], "5"]] }) },
  { name: "MF_powerRootsInv3", what: "√49 = 7", view: H({ history: [[[sqrt("49")], "7"]] }) },
  { name: "MF_powerRootsInv4", what: "√(3²+2⁴) = 5", view: H({ history: [[[sqrt(cat("3²+2", pow("4")))], "5"]] }) },
  { name: "GS_modempcuberoot", what: "∛64 = 4: small index top-aligned with the vinculum", view: H({ history: [[[root("3", "64")], "4"]] }) },
  { name: "MF_powerRootsInv5", what: "⁶√64 = 2", view: H({ history: [[[root("6", "64")], "2"]] }) },
  { name: "GS_AnsTog01", what: "√8 = 2√2", view: H({ history: [[[sqrt("8")], cat("2", sqrt("2"))]] }) },
  {
    name: "GS_AnsTog02",
    what: "toggled 2√2◂▸ = 2.828427125 on the next line",
    view: H({ history: [[[sqrt("8")], cat("2", sqrt("2"))], [cat("2", sqrt("2")), "2.828427125", true]] }),
  },
  {
    name: "GS_modempsqrt",
    what: "√2 = √2, toggled √2◂▸ = 1.414213562",
    view: H({ history: [[[sqrt("2")], [sqrt("2")]], [[sqrt("2")], "1.414213562", true]] }),
    fails: "the capture lacks one stem pixel of the second √ (row 11, column 3), a SmartView glitch",
  },
  { name: "GS_modempund", what: "E1: mixed 4 5/9 = 41/9", view: H({ history: [[[mixed("4", "5", "9")], [frac("41", "9")]]] }) },
  {
    name: "GS_modempfloat",
    what: "1/8 = 1/8; toggled 1/8◂▸ = 0.125 starts 15 rows down (fraction lines are 14 rows)",
    view: H({ history: [[[frac("1", "8")], [frac("1", "8")]], [[frac("1", "8")], "0.125", true]] }),
  },
  { name: "GS_modempfixed", what: "2π = 2π, toggled = 6.28", view: H({ history: [["2π", "2π"], ["2π", "6.28", true]] }) },
  { name: "MF_frac04", what: "3/4+1 7/12 = 7/3: centred numerator over a wider denominator", view: H({ history: [[[frac("3", "4"), ...cat("+"), mixed("1", "7", "12")], [frac("7", "3")]]] }) },
  { name: "MF_frac05", what: "9/2▸n/d◂▸Un/d = 4 1/2", view: H({ history: [[cat(frac("9", "2"), "▸n/d◂▸Un/d"), [mixed("4", "1", "2")]]] }) },
  { name: "MF_frac06", what: "4 1/2▸F◂▸D = 4.5", view: H({ history: [[cat(mixed("4", "1", "2"), "▸F◂▸D"), "4.5"]] }) },
  { name: "MF_frac07", what: "(1.2+1.3)/4 = 0.625: 7-cell numerator", view: H({ history: [[[frac("1.2+1.3", "4")], "0.625"]] }) },
  {
    name: "MF_frac08",
    what: "E4: quadratic formula numerator with a radical and a tiny ²; ⁻2 on the next line",
    view: H({ history: [[[frac(cat("⁻5+", sqrt("5²−4(1)(6)")), "2(1)")], "⁻2"]] }),
  },
  { name: "MF_Percent02", what: "1/5▸% = 20%", view: H({ history: [[cat(frac("1", "5"), "▸%"), "20%"]] }) },
  { name: "MF_StAngle03", what: "sin(30°) = 1/2 (RAD mode), the result top-aligned", view: H({ history: [["sin(30°)", [frac("1", "2")]]] }) },
  { name: "MF_StAngle05", what: "+ 2πʳ = 360 below a fraction line", view: H({ history: [["sin(30°)", [frac("1", "2")]], ["2πʳ", "360"]] }) },
  { name: "MF_StAngle07", what: "+ 1.5▸DMS = 1°30′0″ (7+7 cells, same line)", view: H({ history: [["sin(30°)", [frac("1", "2")]], ["2πʳ", "360"], ["1.5▸DMS", "1°30′0″"]] }) },
  { name: "MF_Trig3", what: "5*cos(60) = 5/2", view: H({ history: [["5*cos(60)", [frac("5", "2")]]] }) },
  {
    name: "MF_Trig4",
    what: "tan(π/4) = 1 with tall parentheses",
    view: H({ history: [[cat("tan(", frac("π", "4"), ")"), "1"]] }),
    fails: "7-px bar under one π (edited image; MF_Trig6-1 draws the same π/4 with a 5-px bar)",
  },
  {
    name: "MF_StAngle12",
    what: "sin(π/6) = 1/2, sin(30°) = 1/2",
    view: H({ history: [[cat("sin(", frac("π", "6"), ")"), [frac("1", "2")]], ["sin(30°)", [frac("1", "2")]]] }),
    fails: "7-px bar under one π, as in MF_Trig4 (majority: bar = content width, MF_Trig6-1)",
  },
  {
    name: "MF_Trig6-1",
    what: "E5: π/4◂▸; 5*cos(π/4) with 13-row parentheses = 5√2/2 (radical in a numerator)",
    view: H({ history: [[[frac("π", "4")], "0.785398163", true], [cat("5*cos(", frac("π", "4"), ")"), [frac(cat("5", sqrt("2")), "2")]]] }),
  },
  {
    name: "MF_Trig6-2",
    what: "bottom-aligned; the partly hidden 5*cos(π/4) line is not drawn",
    view: H({
      history: [
        [[frac("π", "4")], "0.785398163", true],
        [cat("5*cos(", frac("π", "4"), ")"), [frac(cat("5", sqrt("2")), "2")]],
        [[frac(cat("5", sqrt("2")), "2")], "3.535533906", true],
      ],
    }),
  },
  { name: "MF_Trig5", what: "tan⁻¹(1) = 0.785398163 on the next line (RAD)", view: H({ history: [["tan⁻¹(1)", "0.785398163"]] }) },
  {
    name: "MF_Trig5-2",
    what: "E11: a 16-cell toggled entry and π/4; bottom-aligned with the fraction's pad on row 30",
    view: H({ history: [["tan⁻¹(1)", "0.785398163"], ["0.7853981633975", [frac("π", "4")], true]] }),
  },
  { name: "MF_Trig7-1", what: "tan⁻¹(7/3) = 66.8 with tall parentheses", view: H({ history: [[cat("tan⁻¹(", frac("7", "3"), ")"), "66.8"]] }) },
  {
    name: "MF_Trig7-3",
    what: "√(3²+7²) = √58; the tan⁻¹(7/3) line is cut at the top and not drawn",
    view: H({ history: [[cat("tan⁻¹(", frac("7", "3"), ")"), "66.8"], ["90−Ans", "23.2"], [[sqrt("3²+7²")], [sqrt("58")]]] }),
  },
  {
    name: "MF_Trig7-4",
    what: "√58◂▸ = 7.6: the three lines fill exactly 31 rows",
    view: H({ history: [[cat("tan⁻¹(", frac("7", "3"), ")"), "66.8"], ["90−Ans", "23.2"], [[sqrt("3²+7²")], [sqrt("58")]], [[sqrt("58")], "7.6", true]] }),
  },
  { name: "MF_log04", what: "eˣ: the constant e glyph with a .5 script; the ^ template counts a cell, so the result goes on the next line", view: H({ history: [[cat("e", pow(".5")), "1.648721271"]] }) },
  {
    name: "MF_log10xB",
    what: "10^log(2) = 2 and ln(10⁵) = 5",
    view: H({ history: [["log(1)", "0"], ["ln(5)*2", "3.218875825"], [cat("10", pow("log(2)")), "2"], [cat("ln(10", pow("5"), ")"), "5"]] }),
    fails: "older build: draws the partly hidden top line and bottom-aligns results (majority: GS_mem_p02, MF_Trig7-3; E3, GS_order06)",
  },
  {
    name: "GS_lastans03",
    what: "∛ans = 3",
    view: H({ history: [["3*3", "9"], ["Ans*3", "27"], [[root("3", "Ans")], "3"]] }),
    fails: "older build: lower-case `ans`, and the result is aligned with the radicand instead of the line top",
  },
  {
    name: "MF_x10n02",
    what: "(2*10³)/(4*10⁵)◂▸ = 5*10⁻³",
    view: H({ history: [[[frac(cat("2", ee("3")), cat("4", ee("5")))], cat("5", ee("⁻3")), true]] }),
    fails: "a .png from a newer layout: the bar overhangs its content by 2 px on each side, as in TI's marketing images (D §5.8)",
  },
];

suite("home screen, Classic", CLASSIC);
suite("home screen, MathPrint plain", PLAIN);
suite("home screen, MathPrint 2-D", MP);
