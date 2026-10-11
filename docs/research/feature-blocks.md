# Smart side panels: which TI-30XS features deserve a block

The BA II Plus sibling site shows one "smart" feature block beside the calculator that follows what the user is doing, with Memory and Format always visible. This note works out the same idea for the TI-30XS MultiView: which features are worksheet-like enough to deserve a context block, which keys or screens should switch to each block, and what each block should show beyond the 4 × 16 LCD.

## Sources

- **TI product overview:** <https://education.ti.com/en/us/products/calculators/scientific-calculators/ti-30xs-multiview/tabs/overview>. TI groups the features exactly along the blocks below:
  - "One- and two-variable statistics with permanent stat variable input storage", "Basic Data/List Editor with three lists", "List formulas";
  - "(x,y) table feature with Auto and Ask-x options";
  - "Stacked fractions and fraction functions", "Change between improper fractions and mixed numbers", "Fraction/decimal/percent conversions";
  - "Convert angles from degrees to radians to grads", "Trigonometry";
  - "Combinations and permutations", "Random number and random integer generator".
- **Guidebook** (2025): <https://education.ti.com/download/en/ed-tech/50BE24C84836434485BD2E8D49374AF7/2FB7733DDAC447A4B4375E77846E1DF0/30XSMV_Guidebook_EN.pdf>. Also the 2019 edition: <https://education.ti.com/html/eguides/scientifics/PDFs/EN/TI30XS-MultiView-Guide_EN.pdf>.
- **Teacher guide:** <https://education.ti.com/download/en/ed-tech/62522EB25D284112819FDB8A46F90740/A3A2CEC48F954B2DA422F4772C92DAA9/TI30MV_TeacherGuide_EN.pdf>. Chapters 6 (fractions), 8 (memory), 11 (statistics), 12 (probability), 13 (function table) and 15 (angles and trig) are each organized around one of these features.
- **This repo's research** (built from the same TI documents and the TI-SmartView captures):
  - `keys-menus.md` §3 (every menu and screen, with its keys) and §4.11–4.17 (fractions, %, ◂▸);
  - `math-stats.md` §3 (exact answers), §4.1–4.5 (angles, polar, percent, K, probability), §5 (statistics) and §6 (table).
- **The TI-30XS cannot graph.** It has no plot or graph screen and no regression other than linear (`keys-menus.md` §3.5, §3.13). So the charts in the blocks are genuinely beyond what the LCD can show. They are drawn from the engine's own numbers: the five-number summary uses the device's quartile rule, and the line uses its y′ = a·x′ + b.

All key and menu names below were checked against the engine (`src/engine/keys.ts` key ids and 2nd functions, `src/engine/apps/types.ts` screen kinds and menu ids).

## Always visible

| Block | Shows | Highlights |
|---|---|---|
| **Memory** | x y z t a b c, Ans, and the constant K (its tail such as `*2+3`, and whether it is on) | the K line while the 2nd K editor is open; the variable list while 2nd recall or 2nd clear var is open |
| **Mode** | the four mode rows: DEG RAD GRAD / NORM SCI ENG / FLOAT 0–9 / CLASSIC MATHPRINT, with the current setting of each marked | the row under the mode-screen cursor, and the option under it, while the mode screen is open |
| **History** | the Home history (the engine keeps 30 entries), newest first: each entry with its result, ◂▸ lines marked | the line being browsed with ▲ |

Memory and Mode correspond to the BA's Memory and Format blocks. History plays the part of the BA's keystroke tape. On the TI the 4-line screen scrolls through at most a few entries, while the block shows them all.

## Context blocks

### Trigger table

The function is `featureTrigger(before, key, after)` in `src/ui/panels/featureContext.ts`. It first resolves the key with the 2nd state before the press. The block is sticky: every other key leaves it unchanged.

| Block | Switches when… | "In use" while… |
|---|---|---|
| **Statistics & data** | `data` or `2nd stat` actually opens the data editor, its CLEAR/FORMULA menu, or the STATS menu (from any screen) | the data editor, its CLEAR/FORMULA or Ls menu, the STATS menu, the 1-Var/2-Var setup or the results (StatVars) are on screen, including an error raised there |
| **Function table** | `table` opens the y= editor (from any screen) | y=, the Start/Step setup or the table is on screen |
| **Probability** | `prb` opens the PRB/RAND menu. It opens only where there is an entry to paste into. | the prb menu is open, or the Home entry contains nPr, nCr, !, rand or randint |
| **Angles & trig** | `2nd angle` opens the DMS / R◂▸P menu; or, **on Home only**, `sin cos tan` or `2nd sin⁻¹ cos⁻¹ tan⁻¹` (not after 2nd hyp) | the angle menu is open, or the Home entry contains a trig function, ° ′ ″ ʳ ᵍ, ▸DMS or R▸P/P▸R |
| **Fractions & answer forms** | **on Home only**: `n/d`, `2nd U n/d`, `2nd n/d◂▸Un/d`, `2nd f◂▸d`, `◂▸`, `2nd %` or `2nd ▸%` | the Home entry contains a fraction, a mixed number, a conversion, % or ◂▸ |

**No change:** digits, operators, arrows, enter, clear, delete, 2nd itself, mode, sto▸, x/y/z/t/a/b/c, recall, clear var, K, reset, quit, on/off, contrast, hyp, log, ln, 10ˣ, eˣ, x², x⁻¹, ^, √, ˣ√, π, ×10ⁿ, (−), ans and insert. A key that does nothing on its screen (prb on the stat setup screen, which has no entry) changes nothing either, because the rule checks the screen the press led to.

**Why trig and fraction keys switch only on Home.** In the data editor and the table they are ingredients of the work in progress: typing `1/4` as a data value, or `y=sin(x)`. Switching away there would hide the very block the user is working in.

On Home they are the feature. A trigonometry or fractions session presses them again and again, and since the block is sticky, repeated presses keep the same block; there is no flicker. The one cost is a single sin pressed on Home in the middle of a statistics session, which switches to Angles. That follows "what you are doing now", and the selector switches back in one click.

**Why 2nd hyp is excluded.** Hyperbolic functions ignore the angle mode (`math-stats.md` §4), so the angle block has nothing to say about them.

### What each block shows

**Statistics & data**
- **L1–L3 as one table.** It has row numbers, up to 42 rows, and an "L2 = …" line for each formula list. The cell under the editor's cursor is outlined.
- **The setup:** 1-Var DATA and FRQ, or 2-Var x and y lists.
- **The last results**, in StatVars order. The item under the StatVars highlight is marked. Values use the engine's StatVars text with an 11-character field, with ᴇ shown as ×10ⁿ.
- **The 2-Var regression line** as an equation, y = ax + b, with r.
- **A note when the lists changed after the calculation.** The device keeps the old StatVars (`lists.ts`), so the block says so instead of silently mixing old results with new data.
- **Charts:**
  - 1-Var: a box plot from the engine's minX, Q1, Med, Q3 and maxX (Tukey hinges, as on the device), and a histogram that weights each value by its FRQ list.
  - 2-Var: a scatter plot of the x and y lists, with the line y = a·x + b over the data range.

**Function table**
- **The function**, as `y = …` in readable linear text.
- **The settings:** Start, Step, and Auto or Ask-x. The field under the setup cursor is marked.
- **A 12-row table.** On the LCD it shows the three rows visible there and the selected row; Ask-x lists every typed x. Cells use the LCD's restricted-context text.
- **A plot of f(x)** over the table's x range: the curve is sampled with the engine, and the table rows are drawn as points. Asymptotes and undefined points break the line instead of drawing a spike.

**Fractions & answer forms**

The last answer, in every form the device can switch it to:
- the form as shown;
- a fraction a/b (`2nd f◂▸d`);
- a mixed number U n/d (`2nd n/d◂▸Un/d`);
- a decimal (`◂▸`);
- a percent (`2nd ▸%`);
- the exact √ or π form, when the engine finds one;
- the 13-digit value kept in Ans.

Each form names the key that produces it. The last entry is shown with its result.

A fraction-strip picture shows the value as whole bars plus a part split into d pieces, up to d = 12; larger denominators get a plain proportional fill.

**Probability**
- **The current calculation:** the Home entry while you type it, or else the last history line that used a prb function.
- **nPr, nCr and n!** are written out with your numbers: 8 nPr 3 = 8!/(8−3)! = 8·7·6 = 336; 52 nCr 5 = 52!/(5!·47!) = 2,598,960. A one-line meaning follows, such as "ordered arrangements", and nCr adds the chance of one particular combination.
- **rand and randint:** the rule (uniform on (0, 1), or the integers A…B, each with chance 1/(B−A+1)) and how to seed it with `n sto▸ rand`.
- **Operands come from the engine's own parser and evaluator**, so `(2+3) nPr 2` and variables work.

**Angles & trig**
- **The angle of interest:**
  - the argument of the first trig function in the current or last entry;
  - else the result of an inverse trig function;
  - else the value converted with ▸DMS;
  - else Ans.
- **That angle in DEG, RAD (as a π multiple when exact), GRAD and D°M′S″.**
- **sin, cos and tan of it**, evaluated by the engine in the current mode, so exact values such as √3/2 appear in MathPrint.
- **A unit circle** with the angle, the point (cos θ, sin θ) and its projections.
- **For R▸P / P▸R:** the point (x, y) and its polar form (r, θ).

## Rejected, and why

| Candidate | Why not a context block |
|---|---|
| Constant K | It is one stored tail and an on/off flag. It fits on one line of the always-visible Memory block, which highlights it while 2nd K is open. A block of its own would rarely appear and would hold a single line. |
| Memory: sto▸, recall, clear var | Already always visible. These keys light up the Memory block instead of replacing the feature block, just as the BA keeps Memory in view. |
| Mode, and SCI/ENG/×10ⁿ | Always visible in the Mode block. ×10ⁿ is number entry, not a feature. |
| History | Always visible. |
| Powers, roots, logs, eˣ, 10ˣ, hyperbolic | One-shot functions whose result the LCD already shows in full. A block would only repeat it. |
| π on its own | Too common (areas, circumferences) to switch on. Its exact form already appears in Fractions & answer forms after ◂▸. |
| Reset, error screens, contrast, on/off | Transient or device-only. Memory, Mode and History update to show the effect of a reset. |

## Layout and the "Calculator only" switch

- **Header:** Key tips, then Calculator only, then the theme toggle.
- **Desktop (lg and up):** the calculator sits on the left and stays in view while the blocks scroll. The feature block is first, then Memory and Mode (side by side on xl), then History.
- **Phones:** the blocks stack under the calculator.
- **Calculator only:** hides every block and centers the calculator exactly as the page looked before the blocks existed. It is remembered as `ti30xs:calcOnly`.
- **The feature block's selector** is a keyboard-operable radio group, so the user can switch blocks without pressing calculator keys. The last block is remembered as `ti30xs:feature`.
