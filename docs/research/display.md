# TI-30XS MultiView display: pixel-level research

Scope: (A) what the LCD looks like at the pixel level, and (B) open-source prior art. No product code was written.
Anything I inferred rather than measured is marked **[unverified]**.

Root folder for this research: `/private/tmp/claude-501/-Users-baron-repos-financial-calculator-too-minus/f5ceb392-e749-4ad5-a127-1e49c8ca6350/scratchpad/ti30xs-display/` (written `$R/` below).

---

## 0. Key numbers

| Item | Value | Evidence |
|---|---|---|
| Dot matrix | **96 × 31 px** (not 96 × 32) | All 182 TI eGuide screen captures: lit pixels never leave a 96 × 31 box. The 2007 rskey.org review says "96 by 31 pixels". The CasioEmuMsvc ROM-level emulator has `Width = 96, Height = 31, BodyBytes = 372`. |
| Text grid | 16 columns × 4 lines | Each cell is **6 × 8**. The glyph is **5 × 7** in cell columns 1–5. Column 0 of every cell is the blank spacer, on the **left**. |
| Line rows (classic, top-aligned) | rows 0–6, 8–14, 16–22, 24–30 | Line pitch is 8 rows. Lines 1–3 are each followed by one blank row (7, 15, 23). There is no blank row after line 4, so 4 × 8 − 1 = 31. |
| Indicator row | **Separate fixed LCD segments above the matrix**, not dot-matrix pixels | CasioEmuMsvc reads 39 status bits from LCD RAM after the 372 body bytes. In the real photo, `DEG` is an italic vector-style word and the L1/L2/L3 boxes ghost faintly while unlit. |
| Fonts in the ROM | Large 5×7 (home screen); MathPrint small 5×5 (fractions, exponents); tiny 3×4 (superscript inside small text); menu/editor 4×5 (MODE screen, stat wizards, data editor) | Measured from captures (section 8). |
| Large font | 59 of 67 compared ASCII glyphs match the HD44780 A00 5×7 font exactly | Section 8.1 |
| MathPrint layout | Small 5×5 parts. Fraction = 5 + 1 + **bar 1 px** + 1 + 5 rows, with the bar exactly as wide as the content. Exponent raised 2 rows. Radical: hook, stem, and a vinculum 2 rows above. Same-line results are top-aligned. | 182 eGuide captures. **TI marketing images differ** (section 5.8). |
| Multiplication | Shown as `*` on the home screen and `×` (4×5 font) in data-editor formulas | Captures, and the real photo shows `89*2.36` |
| Contrast | 16 levels (register R37, 0–15). **2nd** then **+** darkens; **2nd** then **−** lightens. | The eGuide uses key-font glyphs T and U; in eGuide examples T is the + key. The 16 levels and the 0–15 clamp come from CasioEmuMsvc's ROM analysis. |
| Real LCD colours (one photo, white balance not controlled) | glass ≈ `#9FA985`; lit dot ≈ `#4B5272` (blue-slate); dot ≈ 80–85 % of pitch; slight shadow down-right | Commons `TI30XSMV.jpg` |

---

## 1. Sources and downloaded files

All downloads are under `$R/dl/` (each source in its own folder). Analysis scripts are in `$R/scripts/` and derived outputs in `$R/out/`.

### 1.1 Primary pixel source: TI eGuide screen captures (TI-SmartView output)
- Crawled from `https://education.ti.com/html/eguides/scientifics/TI-30XS-MultiView/EN/Content/EG_30XSMV/M_GetStart/GS_Home.HTML`, which covers 53 pages. The page and image list is in `$R/dl/tieg/crawl.json`.
- **182 screen captures**: 224 × 81 px, 1-bit palette `.bmp`. URLs follow the pattern
  `https://education.ti.com/html/eguides/scientifics/TI-30XS-MultiView/EN/Content/EG_30XSMV/_Images/<M_GetStart|M_MathFunc|M_MathTools>/<name>.bmp`
  (e.g. `.../_Images/M_MathFunc/MF_frac08.bmp`). They are saved as `$R/dl/tieg/img/EG_30XSMV___Images__<section>__<name>.bmp`.
- Capture format, measured:
  - The image has a 1-px black border.
  - The **dot matrix is drawn at 2×**: LCD pixel (c, r) is the 2 × 2 block at image (16 + 2c, 18 + 2r). Over all 182 captures, no 2 × 2 block is non-uniform.
  - SmartView draws the **indicator row at 1× scale** as pixel art in image rows 6–12, above the matrix.
- These captures are TI-SmartView output. SmartView emulates the real chip running the real ROM; the `trkiabout/ti30xpro-mp-hax` repo shows that a ROM ships inside SmartView's emulator jars. So **the matrix content should be firmware-exact**. The indicator-row art, however, is SmartView's own rendering.
- **Derived files (most useful for implementation):**
  - `$R/out/lcd_dumps.txt`: all 182 captures converted to 96 × 31 `#`/`.` grids, with the indicators each one shows. These can serve directly as golden test fixtures.
  - `$R/out/mont_00.png` … `mont_07.png`: contact sheets of all captures at 2×. The index is in `$R/out/mont_index.txt`.
  - `$R/out/font_big.json`, `font_mathprint_small.json`, `font_menu_small.json`, `font_editor_small.json`: the extracted glyph bitmaps.
  - `$R/out/evidence_crops.txt`: the ASCII crops quoted in section 5.

### 1.2 Real hardware photos
- `$R/dl/commons/TI30XSMV.jpg`: powered on, classic mode, shows the ↑↓ and DEG indicators and an inverse history line. **CC BY 4.0**, User:TraininteriorguyALT. https://commons.wikimedia.org/wiki/File:TI30XSMV.jpg (upload URL `https://upload.wikimedia.org/wikipedia/commons/8/8c/TI30XSMV.jpg`). **This is the best real-LCD reference.**
  - Crops: `$R/out/TI30XSMV_lcd2.png` (whole window), `$R/out/TI30XSMV_dots.png` (3× zoom on dots), `$R/out/TI30XSMV_indicators.png`.
- `$R/dl/commons/TI-30XS_Multiview.jpg`: powered off, shows the window framing. CC BY-SA 4.0, User:Vogler. `https://upload.wikimedia.org/wikipedia/commons/b/b5/TI-30XS_Multiview.jpg`. Crop: `$R/out/TI-30XS_Multiview_lcd.png`.
- `$R/dl/commons/TI-30XB_MultiView.jpg`: sister model, CC BY-SA 4.0.
- `$R/dl/rskey/*.jpg`: Mike Sebastian's 2007 review photos, including the PCB (`ti30xsmv_pcb.jpg`). They are © the author and not reusable. https://www.rskey.org/~mwsebastian/reviews/ti30xsmv.htm

### 1.3 Official marketing images (provided by the lead, not re-downloaded)
- `…/scratchpad/ti30xs-geo/dl/ti-30xs_mv_mathprint.png`, `ti-30xs_mv_view-more-calculations.png`, `ti-30xs_mv_scientific-notation-output.png`, `ti30xsmvexplorexytableofvalues.png`, `user-render.png`.
- These are composites: a SmartView capture laid over a painted gradient LCD. They are useful for TI's intended look but are **not photographs**. Measured glass gradient: about `#C2D1C4` (top-left) to `#9DA89C` (edges). Ink is pure `#000000` (or `#231F20`).
- They independently confirm that the home screen uses `*` for multiplication (`5*π`).

### 1.4 Other
- `$R/dl/geogebra/material-dckja6sx.pdf`, `material-uk2xsps3.pdf`: teacher handouts (GED prep, hosted on GeoGebra) that describe the cursors. Text was extracted to `$R/out/geogebra*.txt`.
- `$R/dl/gh_casioemu/*.cpp|hpp`: source files from `telecomadm1145/CasioEmuMsvc` (GPL-3.0), **read for facts only**.
- `$R/dl/gh_font_atlas/`: `userse31/ti30xs_font_atlas` (no license). It says the ROM font is at `$6000–$686F` (2160 bytes = 270 glyphs × 8 bytes, 5 bits wide, 7 rows used) and lays glyphs out in 6 × 8 cells.
- `$R/dl/hd44780/FontLcd.cpp`: an HD44780 A00 table, MIT-licensed (SloeComputers/PDK), used for comparison.
- Not usable: `$R/dl/pdf/wisc.pdf` (TI guidebook, encrypted streams) and `guide_en.pdf` (returned a 404 HTML page).

---

## 2. Panel geometry

### 2.1 Matrix and cells
- 96 × 31 dots. Dots are square: the photo gives a pitch of 11.9 px horizontally and 11.65 px vertically, and the difference is within the camera's perspective error.
- Text-mode cells are 6 × 8 (16 × 4). A glyph occupies cell columns 1–5 and cell rows 0–6.
  - Cell `k` spans matrix columns `6k … 6k+5`; its glyph spans `6k+1 … 6k+5`.
  - Line `n` (0–3) has its glyph rows at `8n … 8n+6`.
  - The text area therefore runs from column 1 to column 95. Column 0 is lit only by inverse video, tall delimiters, radical hooks, and similar.
- Union over all 182 captures: lit pixels span columns 0–95 and rows 0–30. **Row 31 never exists.**

### 2.2 Indicator row (status line)
- On the real glass these are **fixed segments** in a band about 3.6 dot-pitches tall above matrix row 0. They are not matrix pixels.
  - CasioEmuMsvc: "Status fields are individual fragments in the official MultiView painter". It lists 39 status-bit indices (`2, 8, 9, 10, 11, 15, 16, 17, 21, 22, 23, 27, 31, 35, 41–48, 53–58, 68, 76–81, 87, 89, 91, 93`) in the 12 bytes after the body.
  - Some words are therefore built from several fragments **[unverified: which fragment is which]**.
- Real-glass styling (photo): `DEG` is an **italic sans-serif word** with cap height about 1.6–2 dot-pitches. ↑ and ↓ are thin stroked arrows. L1, L2 and L3 are small **boxed labels**; their unlit outlines ghost faintly.
- Horizontal positions in matrix-column units. SmartView data is from the captures, converted as `(x − 16) / 2`. Photo data is calibrated on the "3" at columns 91–95.

| Indicator | SmartView capture x (image px) | ≈ matrix columns | Photo check |
|---|---|---|---|
| `[L1]` boxed | 16–21 | 0–2.5 | ghost visible at far left |
| `FIX` | 55–63 | 19.5–23.5 | – |
| `K` | 66–69 | 25–26.5 | – |
| `[L2]` boxed | 83–89 | 33.5–36.5 | ghost visible |
| `SCI` | 92–100 | 38–42 | – |
| `S` alone (unexplained; 5 fraction captures) | 92–94 | 38–39 | probably the first fragment of SCI lit alone **[unverified]** |
| `ENG` | 112–124 | 48–54 | – |
| `[L3]` boxed | 153–159 | 68.5–71.5 | ghost visible |
| `DEG` | 162–173 | 73–78.5 | photo: cols ≈ 73–78 ✔ |
| `RAD` | 175–185 | 79.5–84.5 | – |
| `↑` | 192–196 | 88–90.5 | photo ≈ 89 ✔ |
| `↓` | 198–202 (one row lower than ↑) | 91–93.5 | photo ≈ 92 ✔ |
| `2nd`, `HYP`, `GRAD`, busy, `◄ ►` | not in any capture | – | **[unverified]**; 2nd and HYP are probably in the free left area between L1 and FIX. Busy is an hourglass (`GS_HomeHour.png` is SmartView's 10 × 17 antialiased hourglass icon). |

- **Indicator semantics** (eGuide GS_Home):
  - `2nd`, `HYP`, `FIX`, `SCI`/`ENG`, `DEG`/`RAD`/`GRAD`, `K` (constant on), and `L1 L2 L3` (above the data-editor columns) show the state their names suggest.
  - Hourglass: busy.
  - ↑ / ↓: history exists above or below the screen.
  - ◄ ►: an entry or menu is wider than 16 characters.
- Vertically, SmartView draws the indicator text 5 px tall (2.5 dot-pitches) with its top about 6 dot-pitches above matrix row 0. Treat this as SmartView framing; on the glass the band is about 3.6 pitches.
- SmartView's indicator pixel art, at 1× capture pixels (generated by `scripts/indart.py`):

```
[L1]    FIX        K     [L2]     SCI        S?   ENG            [L3]     DEG           RAD          UP+DOWN    
######  ###.#.#.#  #..#  #######  .##..##.#  .##  ###.#..#..###  #######  ##..###..###  ###..#..##.  ..#........
#.##.#  #...#.#.#  #.#.  #.#...#  #...#...#  #..  #...##.#.#...  #.#..##  #.#.#...#...  #.#.#.#.#.#  .###....#..
#.##.#  ###.#..#.  ##..  #.###.#  .#..#...#  .#.  ###.#.##.#.##  #.###.#  #.#.###.#.##  ###.#.#.#.#  #.#.#.#.#.#
#.##.#  #...#.#.#  #.#.  #.##.##  ..#.#...#  ..#  #...#..#.#..#  #.#..##  #.#.#...#..#  ##..###.#.#  ..#....###.
#.##.#  #...#.#.#  #..#  #.#.###  ##...##.#  ##.  ###.#..#..###  #.###.#  ##..###..###  #.#.#.#.##.  ........#..
#..#.#  .........  ....  #.....#  .........  ...  .............  #....##  ............  ...........  ...........
######  .........  ....  #######  .........  ...  .............  #######  ............  ...........  ...........
```

### 2.3 Physical framing (photo `TI30XSMV.jpg`, ±0.5 dot-pitch)
- The visible LCD window is about **103 × 37 dot-pitches** (aspect ≈ 2.8 : 1). The lead is measuring the case, so this is only a cross-check.
- The matrix is inset by about **3.0 pitches on the left, 3.1 on the right, 3.6 at the top** (the indicator band), and **2.7 at the bottom**.
- SmartView capture framing is different: 7.5 pitches of margin left and right, an 8.5-pitch indicator band, and no bottom margin.

---

## 3. Classic mode text layout (measured)

- **Entry**: left-aligned, starting at cell 0. Glyph columns are 1–5, 7–11, and so on.
- **Result**: right-aligned. The last glyph ends at matrix column 95, in cell 15.
- **Result on the same line or the next line.** Over every capture the boundary is consistent: the result stays on the entry's line when `len(entry) + len(result) ≤ 14` cells, which leaves at least two blank cells. Otherwise the result goes on the next line, right-aligned.

  | Entry | Result | Total | Placement |
  |---|---|---|---|
  | `3/4+1⌴7/12` | `7/3` | 13 | same line |
  | `P▸Rx(5,30)` | `4.3` | 13 | same line |
  | `1.5▸DMS` | `1°30'0"` | 14 | same line |
  | `2π◂▸` | `6.283185307` | 14 | same line |
  | `√(2)` | `1.414213562` | 15 | next line |
  | `52 nCr 5` | `2598960` | 15 | next line |
  | `12345` | `1.2345*10^4` | 16 | next line |

  The eGuide puts it this way: "depending upon space, the answer is displayed either directly to the right of the entry or on the right side of the next line."
- **Too wide for the screen**: the line is cut at 16 cells, and **cell 15 is replaced by `▶`**, a 4 × 7 solid right triangle (`MF_StAngle08`, `MF_StAngle09`). After horizontal scrolling, `◀` is presumably drawn in cell 0 **[unverified]**.
- **History**: lines stack top-down until all 4 are used; after that the newest entry is on the bottom line.
  - ↑ and ↓ in the indicator row show that hidden history exists.
  - With ▲/▼ the selected history line is drawn in inverse video. In the real photo, line 4 is a selected result shown inverse across its cells.
- **Classic notation glyphs**:
  - fractions use `/`;
  - mixed numbers use the `⌴` glyph (a U shape in rows 4–6);
  - powers use `^`;
  - square root is the 5 × 7 `√` glyph followed by `(`;
  - x-th root is `3ˣ√64`, i.e. a superscript-x glyph followed by the `√` glyph;
  - `⁻¹` is a single glyph;
  - the negative sign `⁻` is a raised 3-px dash (row 2, right-aligned in the glyph), and subtraction `−` is a 5-px dash at row 3.

## 4. Inverse video (all contexts)

- **Home and menu text (5×7)**: the inverse box is the full 6-px cells × 8 rows, i.e. the glyph rows plus the blank row below them.
  - Titles and tabs get **one extra column on the right**, so the last glyph has a 1-px dark margin. Examples:
    - `Clear Var` covers columns 0–54 (9 cells + 1), rows 0–7.
    - `PRB` covers columns 0–18.
    - `CLEAR` covers columns 0–30.
  - A selected menu item number covers just its two cells, `n:`: columns 0–11, rows 8–15.
- **4×5 font (MODE screen, wizards)**: the box starts one column left of the first glyph and ends one column right of the last glyph. It spans the glyph rows plus one row below; e.g. `DEG` covers columns 0–15, rows 0–5.
- **Data editor**: the current cell is inverse across the whole column width (e.g. columns 32–63) × 6 rows.

## 5. MathPrint layout at the pixel level

All measurements below come from the captures. The ASCII crops in the appendix (E1–E11) show them pixel by pixel.

### 5.1 Fonts and advance
- Base text uses the **5×7 large font** with a 6-px advance; MathPrint entries also start at column 1.
- **First-level scripts use the small 5×5 font**, also with a 6-px advance. This covers fraction numerators and denominators, exponents, and the n-th-root index.
- **Second-level scripts use a tiny 3×4 font** (e.g. a `²` inside a numerator in E4). Only `2` was observed: `##.` / `..#` / `.#.` / `###`.

### 5.2 Stacked fractions (E1, E4, E5)
- Layout, top to bottom:
  - numerator box (5 rows, small font);
  - 1 blank row;
  - **bar: 1 row thick**;
  - 1 blank row;
  - denominator (5 rows);
  - 1 more blank row at the bottom of the box.
- The **fraction box is therefore 14 rows**, with 13 drawn. Evidence:
  - The next line starts 15 rows below the fraction top: 2 blank rows, against 1 for every other line type.
  - A bottom-aligned screen ends a fraction at row 29, not 30 (E11).
- **Bar length**: the full width of the wider part's glyph boxes, `6n − 1` px. It has **no overhang**; e.g. `41/9` gives a bar at columns 85–95 and `1/8` gives columns 1–5.
  - `MF_Trig4` shows a 7-px bar under a single `π`. I believe it is an edited image (a removed `ʳ`), because `MF_Trig6-1` shows the same `π/4` with a 5-px bar. **[unverified]**
- **Centering**: the narrower part is centered exactly. The width difference is always a multiple of 6, so centering never needs rounding.
- **Line axis**: the bar row is the line's axis. Adjacent big glyphs (7 rows) are vertically centered on it, i.e. they occupy rows `bar−3 … bar+3`. Examples: the whole part `4` of `4 5/9`, `tan` in `tan(π/4)`, `5*cos` in E5.
- **Mixed number** `4 5/9`: the whole part is in the big font in the advance immediately before the fraction.
- **Content inside numerators** stays in the small font, including `+`, `−`, `(`, `)`, `.`, the negative sign and radicals. This holds even for large expressions (E4: `(⁻5+√(5²−4(1)(6)))/2(1)`).

### 5.3 Exponents (E3)
- The superscript is set in the small 5×5 font in the advance that follows the base.
- **The superscript top is 2 rows above the base glyph top**, so it overlaps the top 3 rows of the base's 7-row box.
- The line box grows by 2 rows at the top: `15²` occupies rows 8–16 while the plain line above occupies rows 0–6.
- A parenthesized exponent `4^(2+1)` uses small `(` `+` `)` glyphs.
- `10^n` results look like `29.4*10⁶`: a small superscript after big `10`. In SCI/ENG mode they show as `1.2345*10⁴`; in classic mode as `1.2345*10^4`.

### 5.4 Square roots and n-th roots (E2, E4, E5)
- **Shape**:
  - a 2-px diagonal hook at `(stem−2, bottom−2)` and `(stem−1, bottom−1)`;
  - a 1-px **stem** from the vinculum row down to the radicand's bottom row;
  - a 1-row **vinculum**, **2 rows above the radicand's top** with 1 blank row between, running from the stem to the last column of the radicand's last glyph box.
- **Heights**:
  - A big-font radicand is 7 rows, so the radical is 9 rows tall (E2 `√8`: vinculum row 0, digit rows 2–8).
  - The gap above the radicand is not always 1 row. Observed cases:

    | Radicand | Vinculum row vs top of radicand ink | Blank rows | Captures |
    |---|---|---|---|
    | big digits (`√8`, `√58`, `∛ans`) | top − 2 | 1 | GS_AnsTog01/02, MF_Trig7-4 result, GS_lastans03 |
    | small digit (`√2` in the result `5√2/2`) | top − 2 | 1 | MF_Trig6-1 |
    | small base + tiny superscript (`√(5²−4(1)(6))` in a numerator) | top − 2 | 1 | MF_frac08 |
    | **big base + small superscripts** (`√(3²+4²)`, `√(3²+2⁴)`, `√(3²+7²)`) | **superscript top − 4** | **3** | GS_order06, MF_powerRootsInv4, MF_Trig7-4 |

  - So a radicand with a big-font exponent gets 2 extra empty rows. **[rule not fully derived]**
- **Horizontal**: the √ sign takes one 6-px advance before the radicand, with the stem at offset 2 or 3 of that advance.
  - Offset 2 (hook in the cell's spacer column) appears in `GS_AnsTog01/02`. Offset 3 appears in `GS_lastans03`, `MF_frac08` and `MF_Trig6-1`.
  - Both are firmware output, possibly from different OS versions. **[unverified which is current]**
- **n-th root** (`∛ans`, `⁶√64`): the index is a small 5×5 glyph in the advance before the √ advance, **top-aligned with the vinculum**.

### 5.5 Tall parentheses (E5)
- Around 2-D content, `(` and `)` stretch to the line box height (13 rows around a fraction).
- `(` within its 6-px advance: offset 4 at the top row, 3 on the next row, 2 for all middle rows, 3, and 4 at the bottom row.
- `)` mirrors it: offsets 2, 3, 4…4, 3, 2.

### 5.6 Answer-toggle marker
- After toggling an answer (◄► key), the re-entered expression is followed by a `◂▸` glyph. It is 5 × 3 (`.#.#.` / `##.##` / `.#.#.`) in its own advance, vertically centered on the line axis (E2, E5).

### 5.7 Placing lines
- **Entry and result on the same line are both top-aligned** to the line box top. Examples:
  - `sin(30°)` (rows 0–6) next to `1/2` (rows 0–12);
  - result `89` at rows 0–6 next to an entry whose base text is at rows 2–8 (E3).
- When a result goes on its own line it is right-aligned in that line.
- Consecutive line boxes are separated by **1 blank row**. A fraction line appears to have 2 because of its extra bottom row.
- **When history is taller than 31 rows**, the content is **bottom-aligned** to row 30 and scrolls by pixels. The top line can be partly visible:
  - E11 starts at row 1;
  - `MF_log10xB` shows the bottom 3 rows of a line at rows 0–2.
  - However, `GS_mem_p02`/`p03` leave rows 0–2/0–3 blank where a partial line would be. **[conflict, unverified]**
- MathPrint allows nesting 4 levels deep (eGuide).

### 5.8 Warning: TI's marketing images show a *different* MathPrint layout
- I resampled the official close-up `…/ti30xs-geo/dl/ti-30xs_mv_mathprint.png` onto the 96 × 31 grid. It is a 2.26× rendering of the same fonts; the grid is in `$R/out/mkt_mathprint_grid.txt`. The same layout appears in the `user-render.png` LCD.
- It differs from all 182 eGuide captures in three ways:

  | Feature | eGuide / SmartView captures (182) | Marketing image (`√(3²+4²)`, `1/2+1/10`) |
  |---|---|---|
  | Fraction bar | exactly the content width (`1/8` bar 5 px) | **overhangs about 2 px on each side** (`1/2` bar 9 px, `1/10` bar 16 px) |
  | Result next to a tall entry | **top-aligned** (`5` at rows 0–6 beside `√(3²+4²)`, GS_order06) | **aligned with the base glyphs** (`5` at rows 4–10) |
  | Radical over `3²` | 3 blank rows | 1 blank row |
  | Gap between lines | 1 row (2 after a fraction) | 1 row |

- I do not know whether this is an older OS (the 2007 launch) or a designer mock-up. Which one current hardware does is the **most important open question for faithful MathPrint layout**.
- The eGuide set is large, self-consistent, and comes from the shipping emulator, so I recommend it as the default **[unverified against hardware]**. A single photo of a real unit showing `√(3²+4²)` and `1/2+1/10` would settle it.

## 6. Menus and other screens

- **Single-title menus** (`Clear Var`, `Recall Var`, `STATS`, `1-Var:L1,One`, `2-Var:L1,L2`): the inverse title is on line 1, and up to 3 items fill lines 2–4 (E7).
- **Tabbed menus** (`PRB RAND`, `CLEAR FORMULA`): tabs on line 1 are separated by one blank cell, and only the active tab is inverse (E8).
- **Items** look like `1:nPr`:
  - number or letter in cell 0, colon in cell 1, label from cell 2;
  - the colon is two **2 × 2 dots**;
  - only the number and colon cells of the selected item are inverse.
- **Scroll hints sit inside the item numbers**: the last visible item shows `↓` instead of `:` when more items follow (`3↓Clear L2 Frmla`), and the first visible item shows `↑` when there are more above (`2↑Clear L2`, `C↑Σxy=…`). Items past 9 continue with letters (`A:`…`I↓minX=45`).
- **Value lists** look like `1:x=15` or `2:x̄=52.5`. Here `x`, `y` are the special MathPrint variable glyphs; stat names use the normal letters.
- **MODE screen** (E9):
  - all 4×5 font: 4 rows at a **6-row pitch** (rows 0–4, 6–10, 12–16, 18–22), so rows 23–30 are empty;
  - words use a 5-px advance, but the FIX digits `0123456789` use a **6-px advance** (starting at column 31);
  - every current setting is inverse.
  - The text is `DEG RAD GRAD / NORM SCI ENG / FLOAT 0123456789 / CLASSIC MATHPRINT`.
- **Stat and setup wizards** (`1-VAR STATS / DATA: L1 L2 L3 / FRQ: ONE L1 L2 L3 / CALC`): the same 4×5 font and pitch, with choices inverse-boxed. `CALC` is right-aligned on the bottom line.
- **Function-table setup** (`Start=0 / Step=1 / Auto Ask-x / OK`): the large font. `Auto`/`Ask-x` are at cells 0 and 6, and `OK` is right-aligned.
- **Data editor** (E10):
  - columns at 0–30, 32–63 and 65–95, with 1-px vertical rules at **columns 31 and 64** running rows 0–22;
  - a full-width rule at **row 23**;
  - 4 data rows at a 6-row pitch in the 4×5 font;
  - an author line at rows 25–29, e.g. `L1(5)=`, plus a 4×4 block cursor when editing a formula;
  - formula-defined lists show the author label (`L2(1)=`) inverse;
  - end of list is a dashed `------` (4-px dashes with 1-px gaps);
  - L1, L2 and L3 headers are indicator segments, not matrix pixels.
- **Table view** (`MT_functable04`): `x` and `y` columns in the small font, a vertical rule, the selected row inverse, and the bottom line `x=15`.

## 7. Cursors

- **Normal**: a **solid 5 × 7 block** filling the glyph box. It is seen in `GS_scroll05` (`3+3█`), `MF_prob01` (`8█`), and on SmartView's idle screen. It blinks; the handouts say "normal cursor blinks". The blink rate is unknown **[unverified]**.
- **Insert** (after 2nd [insert]): "a black underscore", according to GED teacher handouts (`$R/out/geogebra.txt`). The pixel shape is presumably row 6 of the glyph box, 5 px wide **[unverified]**.
- **Exit cursor in a MathPrint template**: "black blinking one with a white > inside it; press ► to exit" (`$R/out/geogebra2.txt`). Pixel shape **[unverified]**; a plausible version is the 5 × 7 block with the `▸` glyph inverted inside.
- **In the 4×5 font** (data-editor formula): a **4 × 4 block**, at rows 25–28.
- **2nd**: there is no evidence that the cursor changes; only the `2nd` indicator turns on **[unverified]**.

## 8. Fonts

Notation: `#` = lit and `.` = off. Each glyph is shown at its true size: 5 × 7 for the large font, and the small fonts as captured. Labels:
- `x̄` = x-bar, `⁻¹` = inverse;
- `n/d` = the improper-fraction conversion glyph used in `▸n/d◂▸Un/d`;
- `x_var`/`y_var`/`z_var` = MathPrint variable glyphs;
- `=alt` = a 1-row-higher `=` seen in some stat-result captures (inconsistent between captures);
- `◂▸` = answer-toggle marker, `⁻neg` = negative sign, `−sub` = subtraction, `▶ovf` = overflow arrow;
- `■cur` = block cursor, `ˣroot` = the superscript-x half of classic `ˣ√`.

### 8.1 Large font, 5 × 7 (home screen, menus): 92 glyphs extracted
- Comparison against an MIT-licensed HD44780 A00 table (`SloeComputers/PDK`, `GUI/Font/FontLcd.cpp`), run with `scripts/cmphd.py`:
  - **59 glyphs identical**: `"%()*+,-./12345689:=BCDEFGHIKLMNOPRSTUXY^abcdeghilmnoprtuxy`.
  - **8 differ**:
    - `0`: TI has **no slash**;
    - `!`: TI's dot is 2 rows;
    - `'`: TI's is a straight 3-px tick;
    - `7`: differs from that table's `7`, which has an unusual `#...#` second row and may itself be non-standard;
    - `A`: crossbar on row 3;
    - `V`: two-row neck;
    - `k`: shifted 1 column right;
    - `s`: top row is 3 px.
- For glyphs not captured (`J Q W Z f j q v w z # & ; < > ? @ [ ] _ |` …), using HD44780 A00 shapes is a reasonable fallback **[unverified]**.

```
0      1      2      3      4      5      6      7      8      9    
.###.  ..#..  .###.  #####  ...#.  #####  ..##.  #####  .###.  .###.
#...#  .##..  #...#  ...#.  ..##.  #....  .#...  ....#  #...#  #...#
#...#  ..#..  ....#  ..#..  .#.#.  ####.  #....  ...#.  #...#  #...#
#...#  ..#..  ...#.  ...#.  #..#.  ....#  ####.  ..#..  .###.  .####
#...#  ..#..  ..#..  ....#  #####  ....#  #...#  .#...  #...#  ....#
#...#  ..#..  .#...  #...#  ...#.  #...#  #...#  .#...  #...#  ...#.
.###.  .###.  #####  .###.  ...#.  .###.  .###.  .#...  .###.  .##..

⁻¹     A      B      C      D      E      F      G      H      I    
...##  .###.  ####.  .###.  ###..  #####  #####  .###.  #...#  .###.
....#  #...#  #...#  #...#  #..#.  #....  #....  #...#  #...#  ..#..
##..#  #...#  #...#  #....  #...#  #....  #....  #....  #...#  ..#..
....#  #####  ####.  #....  #...#  ####.  ####.  #.###  #####  ..#..
....#  #...#  #...#  #....  #...#  #....  #....  #...#  #...#  ..#..
.....  #...#  #...#  #...#  #..#.  #....  #....  #...#  #...#  ..#..
.....  #...#  ####.  .###.  ###..  #####  #....  .####  #...#  .###.

K      L      M      N      O      P      R      S      T      U    
#...#  #....  #...#  #...#  .###.  ####.  ####.  .####  #####  #...#
#..#.  #....  ##.##  #...#  #...#  #...#  #...#  #....  ..#..  #...#
#.#..  #....  #.#.#  ##..#  #...#  #...#  #...#  #....  ..#..  #...#
##...  #....  #.#.#  #.#.#  #...#  ####.  ####.  .###.  ..#..  #...#
#.#..  #....  #...#  #..##  #...#  #....  #.#..  ....#  ..#..  #...#
#..#.  #....  #...#  #...#  #...#  #....  #..#.  ....#  ..#..  #...#
#...#  #####  #...#  #...#  .###.  #....  #...#  ####.  ..#..  .###.

V      X      Y      Σ      a      b      c      d      e      g    
#...#  #...#  #...#  #####  .....  #....  .....  ....#  .....  .....
#...#  #...#  #...#  .#...  .....  #....  .....  ....#  .....  .####
#...#  .#.#.  #...#  ..#..  .###.  #.##.  .###.  .##.#  .###.  #...#
#...#  ..#..  .#.#.  ...#.  ....#  ##..#  #....  #..##  #...#  #...#
.#.#.  .#.#.  ..#..  ..#..  .####  #...#  #....  #...#  #####  .####
.#.#.  #...#  ..#..  .#...  #...#  #...#  #...#  #...#  #....  ....#
..#..  #...#  ..#..  #####  .####  ####.  .###.  .####  .###.  .###.

h      i      k      l      m      n      o      p      r      s    
#....  ..#..  .#...  .##..  .....  .....  .....  .....  .....  .....
#....  .....  .#...  ..#..  .....  .....  .....  .....  .....  .....
#.##.  .##..  .#..#  ..#..  ##.#.  #.##.  .###.  ####.  #.##.  .###.
##..#  ..#..  .#.#.  ..#..  #.#.#  ##..#  #...#  #...#  ##..#  #....
#...#  ..#..  .##..  ..#..  #.#.#  #...#  #...#  ####.  #....  .###.
#...#  ..#..  .#.#.  ..#..  #...#  #...#  #...#  #....  #....  ....#
#...#  .###.  .#..#  .###.  #...#  #...#  .###.  #....  #....  ####.

t      u      x      y      z_var  ˣroot  θ      π      ᴇ      x_var
.#...  .....  .....  .....  .....  ..#.#  ..##.  .....  .....  .....
.#...  .....  .....  .....  .....  ...#.  .#..#  .....  .....  .....
###..  #...#  #...#  #...#  #####  ..#.#  #...#  #####  .####  .#.#.
.#...  #...#  .#.#.  #...#  ...#.  .....  #####  .#.#.  .#...  #.#..
.#...  #...#  ..#..  .####  ..#..  .....  #...#  .#.#.  .###.  ..#..
.#..#  #..##  .#.#.  ....#  .#...  .....  #..#.  .#.#.  .#...  ..#.#
..##.  .##.#  #...#  .###.  #####  .....  .##..  #..##  .####  .#.#.

y_var  n/d    !      "      %      '      (      )      *      +    
.....  ###..  ..#..  .#.#.  ##...  ..#..  ...#.  .#...  .....  .....
.....  #.#.#  ..#..  .#.#.  ##..#  ..#..  ..#..  ..#..  ..#..  ..#..
.#.#.  ...#.  ..#..  .#.#.  ...#.  ..#..  .#...  ...#.  #.#.#  ..#..
.#.#.  ..#..  ..#..  .....  ..#..  .....  .#...  ...#.  .###.  #####
..##.  .#..#  .....  .....  .#...  .....  .#...  ...#.  #.#.#  ..#..
...#.  #..##  ..#..  .....  #..##  .....  ..#..  ..#..  ..#..  ..#..
.##..  ...##  ..#..  .....  ...##  .....  ...#.  .#...  .....  .....

,      -      .      /      :      =      ^      x̄     °      ÷    
.....  .....  .....  .....  .....  .....  ..#..  #####  .##..  .....
.....  .....  .....  ....#  .##..  .....  .#.#.  .....  #..#.  ..#..
.....  .....  .....  ...#.  .##..  #####  #...#  #...#  #..#.  .....
.....  #####  .....  ..#..  .....  .....  .....  .#.#.  .##..  #####
.##..  .....  .....  .#...  .##..  #####  .....  ..#..  .....  .....
..#..  .....  .##..  #....  .##..  .....  .....  .#.#.  .....  ..#..
.#...  .....  .##..  .....  .....  .....  .....  #...#  .....  .....

⁻neg   ↑      →      ↓      ◂▸     −sub   √      =alt   ⌴      ■cur 
.....  ..#..  .....  ..#..  .....  .....  ..###  .....  .....  #####
.....  .###.  ..#..  ..#..  .....  .....  ..#..  #####  .....  #####
..###  #.#.#  ...#.  ..#..  .#.#.  .....  ..#..  .....  .....  #####
.....  ..#..  #####  ..#..  ##.##  #####  ..#..  #####  .....  #####
.....  ..#..  ...#.  #.#.#  .#.#.  .....  #.#..  .....  #...#  #####
.....  ..#..  ..#..  .###.  .....  .....  .##..  .....  #...#  #####
.....  ..#..  .....  ..#..  .....  .....  ..#..  .....  #####  #####

▶ovf   ▸    
#....  .....
##...  .#...
###..  .##..
####.  .###.
###..  .##..
##...  .#...
#....  .....
```

### 8.2 MathPrint small font, 5 × 5 (fraction parts, exponents, root index), 6-px advance

```
0      1      2      3      4      5      6      7      8      9    
.###.  ..#..  .###.  ####.  ...#.  #####  .###.  #####  .###.  .###.
#...#  .##..  #...#  ....#  ..##.  #....  #....  ....#  #...#  #...#
#...#  ..#..  ..##.  ..##.  .#.#.  ####.  ####.  ...#.  .###.  .####
#...#  ..#..  .#...  ....#  #####  ....#  #...#  ..#..  #...#  ....#
.###.  .###.  #####  ####.  ...#.  ####.  .###.  .#...  .###.  .###.

g      l      o      π      (      )      +      .      ⁻neg   −sub 
.###.  .##..  .....  .....  ..#..  ..#..  .....  .....  .....  .....
#..#.  ..#..  .##..  #####  .#...  ...#.  ..#..  .....  ..###  .....
.###.  ..#..  #..#.  .#.#.  .#...  ...#.  .###.  .....  .....  .###.
...#.  ..#..  #..#.  .#.#.  .#...  ...#.  ..#..  .##..  .....  .....
.##..  .###.  .##..  #..##  ..#..  ..#..  .....  .##..  .....  .....
```
- Tiny 3 × 4 (second level), only `2` observed: `##.` / `..#` / `.#.` / `###`.

### 8.3 Menu / editor small font, 4 × 5 (MODE screen, wizards, data editor)
- Words and data-editor values use a 5-px advance. The MODE screen's FIX digit picker uses a 6-px advance.
- In this font, editor formulas show multiplication as `×`.

```
0     1     2     3     4     5     6     7     8     9     A     C   
.##.  ..#.  .##.  ###.  #...  ####  .##.  ####  .##.  .##.  .##.  .###
#..#  .##.  #..#  ...#  #..#  #...  #...  ...#  #..#  #..#  #..#  #...
#..#  ..#.  ..#.  .##.  ####  ###.  ###.  ..#.  .##.  .###  ####  #...
#..#  ..#.  .#..  ...#  ...#  ...#  #..#  .#..  #..#  ...#  #..#  #...
.##.  .###  ####  ###.  ...#  ###.  .##.  #...  .##.  .##.  #..#  .###

D     E     F     G     H     I     L     M     N     O     P     Q   
###.  ####  ####  .###  #..#  .###  #...  #..#  #..#  .##.  ###.  .##.
#..#  #...  #...  #...  #..#  ..#.  #...  ####  ##.#  #..#  #..#  #..#
#..#  ###.  ###.  #.##  ####  ..#.  #...  #..#  #.##  #..#  #..#  #..#
#..#  #...  #...  #..#  #..#  ..#.  #...  #..#  #..#  #..#  ###.  #.#.
###.  ####  #...  .###  #..#  .###  ####  #..#  #..#  .##.  #...  .#.#

R     S     T     V     -     :   
###.  .###  .###  #..#  ....  ....
#..#  #...  ..#.  #..#  ....  .#..
###.  .##.  ..#.  #.#.  .###  ....
#.#.  ...#  ..#.  #.#.  ....  .#..
#..#  ###.  ..#.  .#..  ....  ....
```
Data-editor formula line (`MT_DataEd055`, same font):
```
1     2     3     5     9     L     +     /     =     ×     ■cur  ♦   
..#.  .##.  ###.  ####  .##.  #...  ....  ....  ....  ....  ####  .##.
.##.  #..#  ...#  #...  #..#  #...  ..#.  ...#  ####  .#.#  ####  ####
..#.  ..#.  .##.  ###.  .###  #...  .###  ..#.  ....  ..#.  ####  ####
..#.  .#..  ...#  ...#  ...#  #...  ..#.  .#..  ####  .#.#  ####  ####
.###  ####  ###.  ###.  .##.  ####  ....  ....  ....  ....  ####  .##.
```
- `♦` marks a formula being edited, and `■` is the 4 × 4 cursor.

### 8.4 Can existing open fonts be reused?
- Rendering from **bitmap tables** (canvas or SVG rects) is the right approach, rather than a web font. The display is a strict grid, it needs three or four sizes, and it needs inverse video.
- `LCD 5x7 FONT` by ChihayaSta (http://72k.jp/lcdfont/, **SIL OFL 1.1**, 5 × 7 dot font, Latin only, plus an italic variant) is an option for prose. It is **not** TI's glyph set **[unverified glyph match]**.
- A legal note **[not legal advice]**: in the US, typeface designs (as opposed to font software) are generally not copyrightable. Re-drawing glyph bitmaps from screenshots is therefore usually treated differently from copying a font file or the ROM.

## 9. LCD appearance

### Real hardware (Commons `TI30XSMV.jpg`; one photo, white balance and exposure not controlled)
- Glass (background) is about **`#9FA985`**, a yellow-green khaki. The powered-off photo `TI-30XS_Multiview.jpg`, taken in dim light, shows olive (about `#3D3916`), which mainly reflects the lighting.
- Lit dots are about **`#4B5272`**, a dark slate blue, with a slightly darker rim.
- Dots are **square, with clear gaps**. The dot side is about **80–85 % of the pitch**, so the gap is about 15–20 %. Each dot casts a faint **shadow about 0.2 pitch down and right** onto the reflector behind the glass (`$R/out/TI30XSMV_dots.png`).
- **Ghosting**: unlit matrix dots are **not visible** at default contrast. Unlit **indicator segments are faintly visible** (the L1/L2/L3 boxes).
  - Suggested render: off dots at about 0–3 % ink; off segments at about 4–8 % ink **[inferred]**.
- Indicator styling: italic sans text (`DEG`) and thin arrows, in the same ink colour as the dots.

### Contrast
- **2nd + darkens, 2nd − lightens**: eGuide "Display Contrast". Its T and U are key-font glyphs, and in eGuide examples T is the + key.
- There are **16 levels** (R37 register, 0–15, saturating), per CasioEmuMsvc's ROM analysis.
- CasioEmuMsvc's *visual calibration*, which they say is not measured: lit alpha = `clamp(240 + 20·c)`, residual (off) alpha = `clamp(24 + c·231/15) · scale`. They model pixel response with 50 ms rise and fall half-lives.
- Physically, higher contrast darkens lit dots and starts to show unlit dots **[inferred]**.

### TI marketing renders
- These are flat black ink on a painted gradient `#C2D1C4`→`#9DA89C`, with the bezel in TI blue.
- **SmartView** itself draws black on white: 2× matrix with 1× indicator art.

## 10. Prior art (B)

| Project | License | What it is | Fidelity / completeness | Reusable? |
|---|---|---|---|---|
| **TI-SmartView for MathPrint** (TI) | Proprietary; TI login required | The official emulator, running the real ROM | Exact | No. It is only a **reference**: its eGuide captures are our pixel ground truth. |
| **telecomadm1145/CasioEmuMsvc** (PR #95 "TI & Screen", merged 2026-10-05) | **GPL-3.0** | nX-U8/T4x chip emulator in C++ that runs a **user-supplied TI MultiView ROM** | Cycle-level, so the display is exact *if you have a ROM* | Facts only: 96 × 31, 39 status fragments, R37 contrast with 16 levels, LCD-RAM layout. The code is GPL; ROMs are TI's. Not usable in a non-GPL product, and needs a ROM. |
| **userse31/ti30xs_font_atlas** | none | HTML viewer for the ROM font atlas (you supply the ROM dump) | – | Facts only: the ROM font is 270 × (5 × 7) glyphs at `$6000`. No data included. |
| **trkiabout/ti30xpro-mp-hax** | none | Re-hosts TI's proprietary SmartView jars and ROMs | – | **Do not use** (redistributes TI copyright material). |
| **ndeineko/TI-MultiView-data-recovery** | CC-BY-4.0 | Procedure to recover history after reset | – | Not display-related; useful notes on MathPrint/Classic encodings. |
| **oggefaderen/ti34-multiview** | **MIT** | Virtual TI-34 MultiView (a close sibling: same 96 × 31 4-line display, similar menus). JS engine (EOS, format, menus, stats) plus a DOM/CSS renderer, with tests. | Behaviour is fairly thorough. Display uses `Courier New` text with CSS fractions/radicals, **not pixel-faithful**. | Engine structure, layout-node model (`text/row/frac/sup/radical`) and test ideas. Model differences need care. |
| **tubbylumpkinz/ti30xsmultiviewGEDprac** | **Apache-2.0** | TI-30XS simulator for GED practice (JS, ~78 KB, with tests) | Web-font display (`Share Tech Mono`), not pixel-faithful | Possibly engine logic; check its accuracy first. |
| ken862734801/Calculator, 85matthew/ti-30xs, mpokodner/ti30xs-calculator, Mrsuzi/ti-30xs-calculator, menezesd/ti30xs-emulator, Ehthar91/BaderTi30xs, bhavani-b03/TI-30XS-Calculator | **none** (all rights reserved) | Hobby or GED-prep web clones | All use system or web fonts; none has a dot-matrix renderer | Not reusable (no license). |
| NoahDMoore/ti-30x-iis-emulator | GPL-3.0 | TI-30X IIS (a different 2-line model) | – | No. |
| SloeComputers/PDK `FontLcd.cpp` | **MIT** | HD44780 A00 5 × 8 table | – | Fallback for uncaptured ASCII glyphs (section 8.1). |
| LCD 5x7 FONT (ChihayaSta) | **SIL OFL 1.1** | 5 × 7 dot OpenType font | Not TI's glyphs | Optional. |
| Adafruit-GFX `glcdfont.c` | BSD | Classic 5 × 7 font | Differs from TI in about 30 glyphs | No. |

**Verdict**: no open-source project renders the TI-30XS LCD pixel-faithfully, and no MathPrint pixel-layout engine exists in the open. The pixel ground truth is the 182 eGuide captures, already converted to `$R/out/lcd_dumps.txt` (good golden fixtures), plus the glyph tables above. The only open behavioural reference worth reading is `oggefaderen/ti34-multiview` (MIT).

## 11. Open questions and unverified items

0. **Which MathPrint layout real hardware uses** (section 5.8): fraction-bar overhang, result vertical alignment, and radical gap. The eGuide captures and TI's marketing images disagree.
1. Exact shapes and positions of the `2nd`, `HYP`, `GRAD`, busy and `◄ ►` segments. They appear in no capture; real photos with these lit are needed. Also: which of the 39 fragments make up which word, and is the lone "S" fragment part of `SCI`?
2. The insert-underline and MathPrint "exit" cursor pixel shapes, and the blink period.
3. Radical stem offset 2 vs 3 (two firmware revisions?). Also the 7-px `π/4` bar in `MF_Trig4`.
4. Whether a partially scrolled-off top line is drawn: `MF_log10xB` draws it, while `GS_mem_p02`/`p03` show blank rows.
5. The `=` drawn 1 row higher in some stat-result captures (`MF_stats1var05`, `MF_statspr206/207`) but not others (`MF_statspr05B`). This looks like a firmware revision difference.
6. Real-glass colours under neutral light, and how the indicator band looks at each of the 16 contrast levels. Only one powered-on photo was available.
7. `◀` left-overflow arrow in cell 0, and a horizontal-scroll example in MathPrint mode.
8. Glyphs never captured: `J Q W Z f j q v w`, `σ`, `ȳ`, `Σx²`, `≠` and others. HD44780 is the fallback.

---

## Appendix: pixel evidence (ASCII crops from `$R/out/evidence_crops.txt`)

Columns are matrix columns (cell boundaries every 6) and rows are matrix rows.

```
E1. Mixed number entry "4 5/9" (left) and stacked result 41/9 (right)  (GS_modempund.bmp, rows 0-13, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  .......#####............................................................................#....#..
  1  .......#...............................................................................##...##..
  2  .......####...........................................................................#.#....#..
  3  ....#......#.........................................................................#####...#..
  4  ...##..####.............................................................................#...###.
  5  ..#.#...........................................................................................
  6  .#..#..#####.........................................................................###########
  7  .#####..........................................................................................
  8  ....#...###..............................................................................###....
  9  ....#..#...#............................................................................#...#...
 10  ........####.............................................................................####...
 11  ...........#................................................................................#...
 12  ........###..............................................................................###....
 13  ................................................................................................

E2. Square roots: entry sqrt(8), result 2sqrt(2), toggled decimal on its own line  (GS_AnsTog02.bmp, rows 0-26, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  ...#########...........................................................................#########
  1  ...#...................................................................................#........
  2  ...#....###.....................................................................###....#....###.
  3  ...#...#...#...................................................................#...#...#...#...#
  4  ...#...#...#.......................................................................#...#.......#
  5  ...#....###.......................................................................#....#......#.
  6  .#.#...#...#.....................................................................#...#.#.....#..
  7  ..##...#...#....................................................................#.....##....#...
  8  ...#....###....................................................................#####...#...#####
  9  ................................................................................................
 10  .........#########..............................................................................
 11  .........#......................................................................................
 12  ..###....#....###...............................................................................
 13  .#...#...#...#...#..............................................................................
 14  .....#...#.......#..#.#.........................................................................
 15  ....#....#......#..##.##........................................................................
 16  ...#...#.#.....#....#.#.........................................................................
 17  ..#.....##....#.................................................................................
 18  .#####...#...#####..............................................................................
 19  ................................................................................................
 20  ................................###.........###...###...###.....#...###..#####...#....###..#####
 21  ...............................#...#.......#...#.#...#.#...#...##..#...#.....#..##...#...#.#....
 22  ...................................#.......#...#.....#.#...#..#.#......#....#....#.......#.####.
 23  ..................................#.........###.....#...###..#..#.....#....#.....#......#......#
 24  .................................#.........#...#...#...#...#.#####...#....#......#.....#.......#
 25  ................................#.....##...#...#..#....#...#....#...#.....#......#....#....#...#
 26  ...............................#####..##....###..#####..###.....#..#####..#.....###..#####..###.

E3. Exponents 5^2+4^(2+1) (small 5x5 superscripts) with result 89  (MF_powerRootsInv1.bmp, rows 0-8, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  ........###................#....###..........#.....#..................................###...###.
  1  .......#...#..............#....#...#...#....##......#................................#...#.#...#
  2  .#####...##...........#...#......##...###....#......#................................#...#.#...#
  3  .#......#......#.....##...#.....#......#.....#......#.................................###...####
  4  .####..#####...#....#.#....#...#####........###....#.................................#...#.....#
  5  .....#.......#####.#..#..............................................................#...#....#.
  6  .....#.........#...#####..............................................................###...##..
  7  .#...#.........#......#.........................................................................
  8  ..###.................#.........................................................................

E4. Large fraction with nested radical, tiny 3x4 superscript, result on next line  (MF_frac08.bmp, rows 0-25, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  .....................###############################################################............
  1  .....................#..........................................................................
  2  .......#####.........#..........##..............................................................
  3  ...###.#.......#.....#............#.............................................................
  4  .......####...###....#...#####...#............#....#.....#.....#.....#....###....#..............
  5  ...........#...#.....#...#......###..........##...#.....##......#...#....#........#.............
  6  .......####........#.#...####.........###...#.#...#......#......#...#....####.....#.............
  7  ....................##.......#.............#####..#......#......#...#....#...#....#.............
  8  .....................#...####.................#....#....###....#.....#....###....#..............
  9  ................................................................................................
 10  .###################################################################################............
 11  ................................................................................................
 12  ................................###....#.....#.....#............................................
 13  ...............................#...#..#.....##......#...........................................
 14  .................................##...#......#......#...........................................
 15  ................................#.....#......#......#...........................................
 16  ...............................#####...#....###....#............................................
 17  ................................................................................................
 18  ................................................................................................
 19  ............................................................................................###.
 20  ...........................................................................................#...#
 21  .......................................................................................###.....#
 22  ..............................................................................................#.
 23  .............................................................................................#..
 24  ............................................................................................#...
 25  ...........................................................................................#####

E5. pi/4 toggle marker; 5*cos(pi/4) with tall parentheses; radical in a small-font numerator  (MF_Trig6-1.bmp, rows 0-29, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  ................................###........#####..###..#####.#####..###...###....#.....##..#####
  1  .#####.........................#...#...........#.#...#.#........#..#...#.#...#..##....#.......#.
  2  ..#.#..........................#...#..........#..#...#.####....#...#...#.#...#...#...#.......#..
  3  ..#.#..........................#...#.........#....###......#....#...####..###....#...####.....#.
  4  .#..##.........................#...#........#....#...#.....#.....#.....#.#...#...#...#...#.....#
  5  ........#.#....................#...#..##....#....#...#.#...#.#...#....#..#...#...#...#...#.#...#
  6  .#####.##.##....................###...##....#.....###...###...###...##....###...###...###...###.
  7  ........#.#.....................................................................................
  8  ....#...........................................................................................
  9  ...##...........................................................................................
 10  ..#.#...........................................................................................
 11  .#####..........................................................................................
 12  ....#...........................................................................................
 13  ................................................................................................
 14  ................................................................................................
 15  ..................................#.........#..........................................#########
 16  .................................#...#####...#.........................................#........
 17  ................................#.....#.#.....#................................#####...#....###.
 18  .#####..........................#.....#.#.....#................................#.......#...#...#
 19  .#.......#......................#....#..##....#................................####..#.#.....##.
 20  .####..#.#.#..###...###...###...#.............#....................................#..##....#...
 21  .....#..###..#.....#...#.#......#....#####....#................................####....#...#####
 22  .....#.#.#.#.#.....#...#..###...#.............#.................................................
 23  .#...#...#...#...#.#...#.....#..#.......#.....#................................#################
 24  ..###.........###...###..####...#......##.....#.................................................
 25  ................................#.....#.#.....#.......................................###.......
 26  .................................#...#####...#.......................................#...#......
 27  ..................................#.....#...#..........................................##.......
 28  ......................................................................................#.........
 29  .....................................................................................#####......

E6. Classic line wider than 16 cells: overflow arrow in cell 15  (MF_StAngle08.bmp, rows 0-14, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  ...#....###...##...#####...#.....#......#..#####..#.#.........###....##...##...#####....#..#....
  1  ..##...#...#.#..#.....#...##.....#.....##..#......#.#....#...#...#..#....#..#..#.......##..##...
  2  ...#.......#.#..#....#.....#.....#....#.#..####...#.#....#.......#.#.....#..#..####...#.#..###..
  3  ...#......#...##......#....#.........#..#......#.......#####....#..####...##.......#.#..#..####.
  4  ...#.....#.............#...#.........#####.....#.........#.....#...#...#...........#.#####.###..
  5  ...#....#..........#...#...#............#..#...#.........#....#....#...#.......#...#....#..##...
  6  ..###..#####........###...###...........#...###..............#####..###.........###.....#..#....
  7  ................................................................................................
  8  ...................................................................#####..###...........#.....#.
  9  ......................................................................#..#...#.........##....##.
 10  .....................................................................#...#...#........#.#...#.#.
 11  ......................................................................#...####.......#..#..#..#.
 12  .......................................................................#.....#.......#####.#####
 13  ...................................................................#...#....#...##......#.....#.
 14  ....................................................................###...##....##......#.....#.

E7. Menu: inverse title, inverse selected item number, colon glyph  (GS_mem01.bmp, rows 0-22, cols 0-60)
     0     0     1     1     2     3     3     4     4     5     6
     0     6     2     8     4     0     6     2     8     4     0
  0  ##...###..###########################.###.#############......
  1  #.###.###.###########################.###.#############......
  2  #.#######.####...###...##.#..########.###.##...##.#..##......
  3  #.#######.###.###.#####.#..##.#######.###.#####.#..##.#......
  4  #.#######.###.....##....#.############.#.###....#.#####......
  5  #.###.###.###.#####.###.#.############.#.##.###.#.#####......
  6  ##...###...###...###....#.#############.####....#.#####......
  7  #######################################################......
  8  ###.########.#...#...........................................
  9  ##..####..##.#...#...........................................
 10  ###.####..##.#...#..###...###................................
 11  ###.########..#.#..#...#.#...................................
 12  ###.####..##...#...#####..###................................
 13  ###.####..##...#...#.........#...............................
 14  ##...#######...#....###..####................................
 15  ############.................................................
 16  ..###........#...#...........................................
 17  .#...#..##...#...#...........................................
 18  .....#..##...##..#..###......................................
 19  ....#........#.#.#.#...#.....................................
 20  ...#....##...#..##.#...#.....................................
 21  ..#.....##...#...#.#...#.....................................
 22  .#####.......#...#..###......................................

E8. Tabbed menu: active tab inverse; last visible item shows down arrow instead of colon  (MF_prob02.bmp, rows 0-30, cols 0-60)
     0     0     1     1     2     3     3     4     4     5     6
     0     6     2     8     4     0     6     2     8     4     0
  0  #....##....##....##......####...###..#...#.###...............
  1  #.###.#.###.#.###.#......#...#.#...#.#...#.#..#..............
  2  #.###.#.###.#.###.#......#...#.#...#.##..#.#...#.............
  3  #....##....##....##......####..#####.#.#.#.#...#.............
  4  #.#####.#.###.###.#......#.#...#...#.#..##.#...#.............
  5  #.#####.##.##.###.#......#..#..#...#.#...#.#..#..............
  6  #.#####.###.#....##......#...#.#...#.#...#.###...............
  7  ###################..........................................
  8  ###.########.......####......................................
  9  ##..####..##.......#...#.....................................
 10  ###.####..##.#.##..#...#.#.##................................
 11  ###.########.##..#.####..##..#...............................
 12  ###.####..##.#...#.#.....#...................................
 13  ###.####..##.#...#.#.....#...................................
 14  ##...#######.#...#.#.....#...................................
 15  ############.................................................
 16  ..###...............###......................................
 17  .#...#..##.........#...#.....................................
 18  .....#..##...#.##..#.....#.##................................
 19  ....#........##..#.#.....##..#...............................
 20  ...#....##...#...#.#.....#...................................
 21  ..#.....##...#...#.#...#.#...................................
 22  .#####.......#...#..###..#...................................
 23  .............................................................
 24  .#####.........#.............................................
 25  ....#...##.....#.............................................
 26  ...#....##.....#.............................................
 27  ....#..........#.............................................
 28  .....#..##...................................................
 29  .#...#..##.....#.............................................
 30  ..###..........#.............................................

E9. MODE screen: 4x5 small font, 6-row line pitch, inverse current settings  (GS_ModeDefaults.bmp, rows 0-23, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  #...##....##...#.....###...##..###........###.###...##..###.....................................
  1  #.##.#.####.####.....#..#.#..#.#..#......#....#..#.#..#.#..#....................................
  2  #.##.#...##.#..#.....###..####.#..#......#.##.###..####.#..#....................................
  3  #.##.#.####.##.#.....#.#..#..#.#..#......#..#.#.#..#..#.#..#....................................
  4  #...##....##...#.....#..#.#..#.###........###.#..#.#..#.###.....................................
  5  ################................................................................................
  6  #.##.##..##...##.##.#......###..###..###......####.#..#..###....................................
  7  #..#.#.##.#.##.#....#.....#....#......#.......#....##.#.#.......................................
  8  #.#..#.##.#...##.##.#......##..#......#.......###..#.##.#.##....................................
  9  #.##.#.##.#.#.##.##.#........#.#......#.......#....#..#.#..#....................................
 10  #.##.##..##.##.#.##.#.....###...###..###......####.#..#..###....................................
 11  #####################...........................................................................
 12  #....#.#####..###..###...#......##.....#....##...###...#.....####...##...####...##....##........
 13  #.####.####.##.#.##.###.##.....#..#...##...#..#.....#..#..#..#.....#........#..#..#..#..#.......
 14  #...##.####.##.#....###.##.....#..#....#.....#....##...####..###...###.....#....##....###.......
 15  #.####.####.##.#.##.###.##.....#..#....#....#.......#.....#.....#..#..#...#....#..#.....#.......
 16  #.####....##..##.##.###.##......##....###..####..###......#..###....##...#......##....##........
 17  ##########################......................................................................
 18  ..###.#.....##...###..###..###..###.....#.##.##..###...#.##.#...##...###...#.##.##...#..........
 19  .#....#....#..#.#....#......#..#........#....#.##.###.##.##.#.##.#.##.###.##..#.###.##..........
 20  .#....#....####..##...##....#..#........#.##.#....###.##....#.##.#...####.##.#..###.##..........
 21  .#....#....#..#....#....#...#..#........#.##.#.##.###.##.##.#...##.#.####.##.##.###.##..........
 22  ..###.####.#..#.###..###...###..###.....#.##.#.##.###.##.##.#.####.##.##...#.##.###.##..........
 23  ........................................##############################################..........

E10. Data editor: 4x5 font, column rules at cols 31/64, rule at row 23, author line  (MT_DataEd02.bmp, rows 0-30, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  ...#.......#...................#.##..########..##....##########.#...............................
  1  ..##.....#.#..#................#.#.##.######.##.#.#############.#...............................
  2  ...#....#..####................#.#.##.########.##...###########.#...............................
  3  ...#...#......#................#.#.##.#..####.######.##########.#...............................
  4  ..###.#.......#................#.##..##..###....#...###########.#..####.####.####.####.####.####
  5  ...............................#.##############################.#...............................
  6  ...#........##.................#...##.......####................#...............................
  7  ..##.....#.#..#................#..#..#......#...................#...............................
  8  ...#....#....#.................#..#..#......###.................#...............................
  9  ...#...#....#..................#..#..#.##......#................#...............................
 10  ..###.#....####................#...##..##...###.................#...............................
 11  ...............................#................................#...............................
 12  .###.......#...................#...##.......####.####...........#...............................
 13  ....#....#.#..#................#..#..#.........#.#..............#...............................
 14  ..##....#..####................#..#..#........#..###............#...............................
 15  ....#..#......#................#..#..#.##....#......#...........#...............................
 16  .###..#.......#................#...##..##...#....###............#...............................
 17  ...............................#................................#...............................
 18  ...#...........................#....#...........................#...............................
 19  ..##...........................#...##...........................#...............................
 20  ...#...........................#....#...........................#...............................
 21  ...#...........................#....#...........................#...............................
 22  ..###..........................#...###..........................#...............................
 23  ################################################################################################
 24  ................................................................................................
 25  #.#####..###.#####.###.########...##........##..####............................................
 26  #.####.##.#.#####..####.##....#..#..#......#..#.#...............................................
 27  #.######.##.######.####.#######..#..#........#..###.............................................
 28  #.#####.###.######.####.##....#..#..#.##....#......#............................................
 29  #....#....##.####...##.########...##..##...####.###.............................................
 30  ###############################.................................................................

E11. History overflow: content bottom-aligned with pixel scrolling  (MF_Trig5-2.bmp, rows 0-30, cols 0-95)
     0     0     1     1     2     3     3     4     4     5     6     6     7     7     8     9     
     0     6     2     8     4     0     6     2     8     4     0     6     2     8     4     0     
  0  ................................................................................................
  1  ................................###........#####..###..#####.#####..###...###....#.....##..#####
  2  ...............................#...#...........#.#...#.#........#..#...#.#...#..##....#.......#.
  3  ...............................#...#..........#..#...#.####....#...#...#.#...#...#...#.......#..
  4  ...............................#...#.........#....###......#....#...####..###....#...####.....#.
  5  ...............................#...#........#....#...#.....#.....#.....#.#...#...#...#...#.....#
  6  ...............................#...#..##....#....#...#.#...#.#...#....#..#...#...#...#...#.#...#
  7  ................................###...##....#.....###...###...###...##....###...###...###...###.
  8  ................................................................................................
  9  ..###........#####..###..#####.#####..###...###....#.....##..#####.#####..###..#####.#####......
 10  .#...#...........#.#...#.#........#..#...#.#...#..##....#.......#.....#..#...#.....#.#..........
 11  .#...#..........#..#...#.####....#...#...#.#...#...#...#.......#.....#...#...#....#..####...#.#.
 12  .#...#.........#....###......#....#...####..###....#...####.....#.....#...####...#.......#.##.##
 13  .#...#........#....#...#.....#.....#.....#.#...#...#...#...#.....#.....#.....#..#........#..#.#.
 14  .#...#..##....#....#...#.#...#.#...#....#..#...#...#...#...#.#...#.#...#....#...#....#...#......
 15  ..###...##....#.....###...###...###...##....###...###...###...###...###...##....#.....###.......
 16  ................................................................................................
 17  ................................................................................................
 18  ...........................................................................................#####
 19  ............................................................................................#.#.
 20  ............................................................................................#.#.
 21  ...........................................................................................#..##
 22  ................................................................................................
 23  ...........................................................................................#####
 24  ................................................................................................
 25  ..............................................................................................#.
 26  .............................................................................................##.
 27  ............................................................................................#.#.
 28  ...........................................................................................#####
 29  ..............................................................................................#.
 30  ................................................................................................
```
