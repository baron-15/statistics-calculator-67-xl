# TI-30XS MultiView: keys, menus, entry behavior (research findings)

This file covers the 4-line MathPrint™ TI-30XS MultiView™. The TI-30XB MultiView is the battery-only twin with identical keys and firmware behavior. It does not cover the TI-30XIIS, TI-36X Pro, or TI-30X Pro/Plus MathPrint, all of which have different mode screens and menus.

Everything below is **verified** against at least one TI primary source unless marked **[unverified]** (an inference or an unresolved conflict). "Observed" means it was seen in an official TI screenshot.

---

## 0. Sources and citation keys

| Key | Source | Notes |
|---|---|---|
| **GB p.N** | *TI-30XS MultiView™ and TI-30XB MultiView™ Scientific Calculator Guidebook*, English, © 2025. `https://education.ti.com/download/en/ed-tech/50BE24C84836434485BD2E8D49374AF7/2FB7733DDAC447A4B4375E77846E1DF0/30XSMV_Guidebook_EN.pdf` | RC4-128 encrypted (R3). Decrypted with a stdlib script. N is the printed page number, which is PDF page − 4. |
| **GB2006 p.N** | The original 2006 guidebook, mirrored at `https://people.math.wisc.edu/~meyer/math141/TI30XS.pdf` | Used for cross-validation. Its text and screens match the 2025 edition. |
| **eG:Topic** | TI eGuide HTML (MadCap Flare build of 3/21/2025): `https://education.ti.com/html/eguides/scientifics/EN/Content/EG_30XSMV/<Section>/<Topic>.HTML` | Same text as GB. Every screenshot (224×81 1-bit BMP) was downloaded and viewed. |
| **TG p.N** | *TI-30XS MultiView™: A Guide for Teachers*, © 2025: `https://education.ti.com/download/en/ed-tech/62522EB25D284112819FDB8A46F90740/A3A2CEC48F954B2DA422F4772C92DAA9/TI30MV_TeacherGuide_EN.pdf` | RC4 plus object streams. N is the printed page (PDF page − 8 in the body; A-x, B-x, C-x for the appendices). All screenshots were viewed. Contains extra behavioral notes. |
| **SV** | TI-SmartView™ for MathPrint™ eGuide pages, including the TI-30XS keyboard-mapping image `30xs_keymaps.png` and the emulator window `30xs_emu_screen2.png` | Shows the primary key grid and the emulator's power-up screen. |
| **PHOTO** | Official TI product photo of the solar TI-30XS MultiView, plus TI's on-screen GED version, both embedded in a GED-prep handout (`beta.geogebra.org/resource/uk2xsps3/...pdf`) | The only source for the physical placement of the green 2nd legends. Every legend was read from it. |
| **KB nnnnn** | TI Knowledge Base solutions 15401 (entry-line length), 15420 (Equation Length error) and 20469 (dividing scientific-notation values, with two screenshots) | |
| **GED** | The same GED handout: tutor-written notes on cursors and `clear` | Third-party, so used only as corroboration. |

**Key-glyph decoding.** TI's documents draw keys with private symbol fonts ("Elmo-KeySymbols" in the GB PDF, "TI-30X III Key Symbols" in the eGuide HTML, "TI-30XIIIKeySymbols" in the TG). I rendered the embedded TrueType glyphs to images and mapped every character code:

`%`=2nd, `&`=on, `'`=[off], `-`=clear, `<`=enter, `>`=sin, `?`=cos, `@`=tan, `A`=log, `B`=ln, `C`=×10ⁿ, `D`=(, `E`=), `F`=x², `G`=^, `H`=prb, `I`=[angle], `J`=delete, `L`=sto▸, `M`=(−), `N`=[U n/d], `O`=[n/d◂▸U n/d], `Q`=[quit], `R`=[▸%], `T`=+, `U`=−, `V`=×, `W`=÷, `Y`=[hyp], `Z`=[sin⁻¹], `[`=[cos⁻¹], `\`=[tan⁻¹], `]`=[10ˣ], `^`=[eˣ], `_`=[%], `` ` ``=[,], `a`=x⁻¹, `b`=[√], `c`=[ˣ√], `f`=[insert], `g`=π, `h`=[recall], `i`=[ans], `j`=[f◂▸d], `l`=[K], `n`=◂▸ (toggle), `o`=table, `p`=mode, `q`=n/d, `t`=[stat], `v`=data, `z`=x^yzt_abc, `{`=[clear var], `0x81`=[reset], `!"#$`=◄►▲▼, `8`=decimal point.

Bracketed glyphs are 2nd functions. The TG and the 2006 GB print reset with the `c` code, which renders as [ˣ√]. That is a font quirk; the 2025 GB uses the reset glyph, and PHOTO shows reset above **0**.

Working files (all in the scratchpad `ti30xs/` directory): decrypted GB text in `pdftext_old/`, TG text in `tg_text/`, eGuide text in `eguide/txt/`, screenshot contact sheets in `sheets/`, photos in `photos/`, and the scripts in `scripts/`.

---

## 1. Key layout

### 1.1 Physical grid

The keypad has 9 rows of 5 columns, except rows 1–2, where a 4-way arrow pad sits on the right. The primary legends are confirmed by SV `30xs_keymaps.png`, PHOTO and the emulator image. The 2nd legends (printed in green above each key) are confirmed by PHOTO and the SV emulator skin.

```
            col 1         col 2          col 3           col 4          col 5
         ┌────────────┬─────────────┬──────────────┬─────────────────────────────┐
row 1    │   [2nd]    │ quit        │ insert       │                             │
         │  (green)   │  [mode]     │  [delete]    │        ▲                    │
row 2    │ 10ˣ        │ angle       │ stat         │    ◄       ►   (4-way pad)  │
         │  [log]     │  [prb]      │  [data]      │        ▼                    │
         ├────────────┼─────────────┼──────────────┼──────────────┬──────────────┤
row 3    │ eˣ         │ Uⁿ⁄d        │ ⁿ⁄d◂▸Uⁿ⁄d    │ f◂▸d         │   (none)     │
         │  [ln]      │  [ⁿ⁄d]      │  [×10ⁿ]      │  [table]     │  [clear]     │
row 4    │ hyp        │ sin⁻¹       │ cos⁻¹        │ tan⁻¹        │ K            │
         │  [π]       │  [sin]      │  [cos]       │  [tan]       │  [÷]         │
row 5    │ ˣ√‾        │ (none)      │ %            │ ▸%           │ (none)       │
         │  [^]       │  [x⁻¹]      │  [(]         │  [)]         │  [×]         │
row 6    │ √‾         │             │              │              │ ◂◑           │
         │  [x²]      │  [7]        │  [8]         │  [9]         │  [−]         │
row 7    │ clear var  │             │              │              │ ◑▸           │
         │ [x^yzt_abc]│  [4]        │  [5]         │  [6]         │  [+]         │
row 8    │ recall     │             │              │              │ (none)       │
         │  [sto▸]    │  [1]        │  [2]         │  [3]         │  [◂▸]        │
row 9    │ off        │ reset       │ ,            │ ans          │ (none)       │
         │  [on]      │  [0]        │  [.]         │  [(−)]       │  [enter]     │
         └────────────┴─────────────┴──────────────┴──────────────┴──────────────┘
```

### 1.2 Key-by-key reference

| Row / col | Primary key (legend) | 2nd legend (green, above) | Notes |
|---|---|---|---|
| 1/1 | **2nd** (green key) | (none) | Turns on the `2nd` annunciator. Pressing it again cancels (GB p.2). |
| 1/2 | **mode** | **quit** | 2nd quit returns to a blank Home screen from any menu or app (GB p.4; TG p.vi). |
| 1/3 | **delete** | **insert** | (§4.2) |
| 1–2/4–5 | 4-way pad **◄ ► ▲ ▼** | (none printed) | 2nd◄ and 2nd► jump to the start or end of the entry. 2nd▲ and 2nd▼ jump through history and lists (GB p.6; TG p.29, A-1). Arrows auto-repeat when held (SV). |
| 2/1 | **log** | **10ˣ** | |
| 2/2 | **prb** | **angle** | |
| 2/3 | **data** | **stat** | Press `data` once for the data editor and again for the CLEAR/FORMULA menu (GB p.5). |
| 3/1 | **ln** | **eˣ** | |
| 3/2 | **n/d** (drawn as a stacked ⁿ⁄d) | **U n/d** (Uⁿ⁄d) | |
| 3/3 | **×10ⁿ** (drawn as "×10ⁿ" with an italic n) | **n/d◂▸U n/d** | The legend reads ⁿ⁄d◂▸Uⁿ⁄d: simple fraction first. The task brief wrote "U n/d◄►n/d", which is reversed. |
| 3/4 | **table** | **f◂▸d** | |
| 3/5 | **clear** | (none) | |
| 4/1 | **π** | **hyp** | |
| 4/2 | **sin** | **sin⁻¹** | |
| 4/3 | **cos** | **cos⁻¹** | |
| 4/4 | **tan** | **tan⁻¹** | |
| 4/5 | **÷** (dark key) | **K** | |
| 5/1 | **^** (caret) | **ˣ√‾** (nth root) | |
| 5/2 | **x⁻¹** | (none) | |
| 5/3 | **(** | **%** | |
| 5/4 | **)** | **▸%** | |
| 5/5 | **×** (dark key) | (none) | |
| 6/1 | **x²** | **√‾** | |
| 6/2–4 | **7 8 9** (white keys) | (none) | |
| 6/5 | **−** (dark key) | **◂◑** (contrast: lighter) | |
| 7/1 | **x^yzt_abc** (x with "yzt" superscript and "abc" subscript) | **clear var** | |
| 7/2–4 | **4 5 6** | (none) | |
| 7/5 | **+** (dark key) | **◑▸** (contrast: darker) | |
| 8/1 | **sto▸** (SV skin: "sto→") | **recall** | |
| 8/2–4 | **1 2 3** | (none) | |
| 8/5 | **◂▸** (toggle; small white oval) | (none) | |
| 9/1 | **on** | **off** | |
| 9/2 | **0** | **reset** | GED confirms the sequence `2nd 0 2` produces "MEMORY CLEARED". |
| 9/3 | **.** | **,** | |
| 9/4 | **(−)** | **ans** | |
| 9/5 | **enter** | (none) | |

Every 2nd legend in the task brief was checked against PHOTO:

- **Present and confirmed:** quit, insert, 10ˣ, angle, stat, eˣ, U n/d, n/d◂▸U n/d, f◂▸d, hyp, sin⁻¹, cos⁻¹, tan⁻¹, K, ˣ√, %, ▸%, √, ◂◑, ◑▸, clear var, recall, off, reset, `,` and ans.
- **No 2nd legend:** 2nd, clear, x⁻¹, ×, 1–9, ◂▸ and enter.
- **Not on this model:** a "math" key or menu. That belongs to the TI-36X Pro.

### 1.3 Keys that behave differently on repeated presses

- **x^yzt_abc** cycles **x → y → z → t → a → b → c** on consecutive presses. Each press replaces the variable just inserted (GB p.10: "Press this key multiple times to choose x, y, z, t, a, b, or c"). Observed: `sto▸ x x` with an empty line produces `Ans→y` (eG:GS_MemVar). Whether it wraps from c back to x is **[unverified]** (probably yes).
- **data** has three levels:
  1. The 1st press opens the data editor.
  2. The 2nd press (from inside the editor) opens the CLEAR/FORMULA menu.
  3. Pressed while editing a formula (Add/Edit Frmla), it opens the `Ls` list-name menu (GB p.5; TG p.79).
- **2nd** toggles: a second press cancels the 2nd state.
- **2nd K** toggles constant mode on and off (§3.12).
- **clear** behaves differently on successive presses (§4.3).
- **◂▸ toggle** can be pressed repeatedly after a result. Each press adds a new history line showing the alternate format (TG p.30).
- **n/d** and **×10ⁿ**: no documented cycling. Each press inserts a template. TI's documents describe no third function for either key.
- **prb** and **2nd angle**: pressing the key again while its menu is open is undocumented **[unverified]**. Tabs are switched with ◄ ►.

### 1.4 SmartView computer-keyboard map (bonus, from SV `30xs_keymaps.png`)

2nd=`Q`, mode=`W`, delete=`Delete`/`Ctrl+Delete`, log=`R`, prb=`T`, data=`Y`, ln=`U`, n/d=`I`, ×10ⁿ=`P`, table=`A`, clear=`Backspace`/`Ctrl+Backspace` (Mac: `Clear`), π=`D`, sin=`F`, cos=`G`, tan=`H`, ÷=`/`, ^=`J`, x⁻¹=`K`, (=`Shift+(`, )=`Shift+)`, ×=`Shift+*`, x²=`L`, −=`-`, x^yzt_abc=`Z`, +=`Shift++`, sto▸=`X`, ◂▸=`C`, on=`V`, (−)=`B`, enter=`Enter`, digits and `.` map to themselves, and the arrows map to the arrow keys. On a Mac, `Delete`=delete and `Backspace`=clear.

---

## 2. Mode screen

### 2.1 Layout (GB p.2–3; eG:GS_Modes screenshot `GS_ModeDefaults`; TG p.33–35)

There are **4 lines and only one page**. The 2006 GB, the 2025 GB, the TG and the GED on-screen version all agree.

```
DEG RAD GRAD
NORM SCI ENG
FLOAT 0123456789
CLASSIC MATHPRINT
```

- **Defaults** (shown in inverse video): **DEG**, **NORM**, **FLOAT**, **MATHPRINT** (TG p.29: "degree (DEG) angle mode, normal numeric notation (NORM), floating decimal notation (FLOAT) and MathPrint™ display mode").
- The `0123456789` row is the FIX digit count, with no spaces between digits. The TG text spaces them out, but every screenshot shows `0123456789`. Choosing a digit highlights that single digit and turns on the **FIX** annunciator, while FLOAT is no longer highlighted.
- **Not present on this model:** `n/d U n/d`, `ANSWER: AUTO DEC FRAC`, `STAT`, `DECIMAL SEPARATOR`, `LANGUAGE` and any second page. These belong to the TI-36X Pro / TI-30X Pro, so do not emulate them.
- One TG screenshot (TG p.115, image 617) shows `DEG RAD GRD`. Every other capture, including the 2006 and 2025 GB and the GED on-screen version, shows `GRAD`. Use `GRAD`.

### 2.2 Behavior

- `mode` opens the screen. **▲ ▼ ◄ ►** move a blinking cursor over the options, and **enter** selects the option under the cursor, which then becomes highlighted. **clear** or **2nd quit** returns to Home (GB p.2).
  - Example: `[mode] [▼] [►] [enter] [clear]` selects SCI (TG p.56).
  - Example: `[mode] [▼][▼] [►][►][►] [enter]` selects FIX 2: the cursor lands on FLOAT, then moves 0 → 1 → 2 (eG:MF_Angles).
- Each row holds exactly one selected value. Moving the cursor alone changes nothing; only **enter** commits **[unverified that leaving without enter discards the move; strongly implied by "and enter to select it"]**.
- The NORM/SCI/ENG and FLOAT/FIX settings affect only how results are displayed. Stored values keep full precision (GB p.3).
- **Switching CLASSIC ↔ MATHPRINT clears the history and the constant K** (TG p.vi, p.35).
- **Changing modes does not reformat results already in history.** Old lines keep the format they were computed in. Observed: `1.2543*10⁴` stays while the new line shows `12.543*10³` (TG p.56–57); FIX 2 `12.35` stays above FIX 1 `12.3` (TG p.66).
- A common idiom is "re-evaluate in the new mode": `[mode] … [enter] [clear] [enter]`. `clear` leaves the mode screen, and `enter` on the empty Home line re-executes the last entry (TG p.3, p.56; see §4.6).

### 2.3 Mode meanings (GB p.2–3)

- **DEG/RAD/GRAD:** the angle unit used when no modifier is typed.
- **NORM:** "displays results with digits to the left and right of the decimal, as in 123456.78."
- **SCI:** one digit left of the decimal times a power of 10, for example `1.2345*10⁴`. "In some restricted environments (for example function table, data editor, and the 2nd recall menu), the TI-30XS MultiView™ calculator may display E instead of ×10ⁿ."
- **ENG:** mantissa from 1 to 999 (the TG says "1 to 1000"), with an exponent that is a multiple of 3.
- **FLOAT:** "displays up to 10 digits, plus the sign and decimal."
- **0–9 (FIX):** a fixed number of decimal places. Results are rounded or padded with trailing zeros: with 5 places, 0.147 becomes 0.14700 (TG p.65).
- **CLASSIC:** "displays inputs and outputs in a single line."
- **MATHPRINT:** "displays most inputs and outputs in textbook format."

---

## 3. Menus

### 3.1 General menu mechanics (GB p.4; TG p.36; screenshots)

- **Menu keys:** `prb`, `2nd angle`, `data` (2nd press), `2nd stat`, `2nd reset`, `2nd recall` and `2nd clear var`.
- **Screen form:** line 1 is the title, or a tab bar of 1–2 titles. The current tab is in inverse video and the other tab is plain text. Lines 2–4 show three items.
- **Item format:** `N:Text`, with no space after the colon. The guidebook typesets "1: nPr", but every screen shows `1:nPr`.
  - The highlighted item shows only its **number and colon in inverse video** (`1:`), not the whole line.
  - If more items exist below the window, the 3rd visible item's colon becomes **↓** (`3↓″`).
  - If items exist above, the first visible item's colon becomes **↑** (`2↑Clear L2`).
  - Items numbered past 9 continue as **A, B, C, …** (`A:Q3=85`, `B:maxX=97`).
- **Navigation:** ▲ ▼ move the highlight and ◄ ► switch tabs. **▲ on item 1 wraps to the last item**. Observed: `2nd angle ▲ enter` selects `6:▸DMS` (TG p.119), and `2nd stat 3 ▲×6` lands on item G of a 21-item list.
- **Selecting:** press enter, or press the item's number key for an immediate selection. GB p.4: "press the corresponding number next to the menu item." Example: `4 [prb] 3` pastes `!` with no enter (eG:MF_Prob). Letter-numbered items (A–L) can only be reached with the arrows and enter.
- **Leaving:** **clear** returns to the previous screen without selecting; **2nd quit** returns to Home.
- **What selecting does:** most menus **paste text at the cursor** in the entry you were editing. The menu temporarily replaces the screen, and the pending entry (for example `150*`) is restored with the paste appended (eG:GS_MemVar `150*` then `[2nd][recall][enter][enter]` gives `150*196000`).

### 3.2 `prb` menu (GB p.5, p.29–31; eG:MF_Prob; TG p.89–95)

```
PRB RAND            ← "PRB" inverse
1:nPr
2:nCr
3:!
```
```
PRB RAND            ← "RAND" inverse (press ►)
1:rand
2:randint(
```

| Item | What it pastes | Example on screen (entry → result) |
|---|---|---|
| nPr | ` nPr ` (infix, spaces around it) | `8 nPr 3` → `336` |
| nCr | ` nCr ` (infix) | `52 nCr 5` → `2598960` (on the next line; see the fit rule in §4.17) |
| ! | `!` (postfix) | `4!` → `24` |
| rand | `rand` | `rand` → `0.390926039` |
| randint( | `randint(` (2 arguments, separated with **2nd ,**) | `randint(2,10)` → `2`. Pressing enter again re-runs it and gives `7`, then `8`. |

- **Seeding rand:** `5 [sto▸] [prb] [►] 1 [enter]` shows `5→rand` → `5` (GB p.30). Storing the same integer on every calculator gives the same sequence (TG p.89).
- **Domains:** ! takes integers 0–69 only. nPr and nCr need integers ≥ 0, otherwise DOMAIN (GB p.37).

### 3.3 `2nd angle` menu (GB p.5, p.18–20; eG:MF_Angles, MF_RectPolar; TG p.117–122)

```
DMS R◂▸P            ← tab "DMS" inverse
1:°
2:'
3↓"
```
The DMS tab continues with `4:r`, `5:g` and `6:▸DMS` (scrolling the list shows the ↑/↓ markers).

```
DMS R◂▸P            ← tab "R◂▸P" inverse
1:R▸Pr(
2:R▸Pθ(
3↓P▸Rx(
```
The R◂▸P tab continues with `4:P▸Ry(`. The tab name is drawn as `R◂▸P`, with small left and right arrowheads.

| Item | Pastes | Display example |
|---|---|---|
| ° | `°` | `sin(30°)` → `1/2` (stacked in MathPrint), even in RAD mode |
| ′ (minutes) | `'` | `12°31'45"+26°54'38"` |
| ″ (seconds) | `"` | |
| r | superscript `r` | `2πʳ` → `360` (DEG mode); `cos(πʳ)` → `-1` |
| g | superscript `g` | `cos(200ᵍ)` → `-1` |
| ▸DMS | `▸DMS` | `1.5▸DMS` → `1°30'0"`; `39.55°▸DMS` → `39°33'0"` |
| R▸Pr( and R▸Pθ( | the function with `(` | In FIX 1: `R▸Pr(3,4)` → `5.0`; `R▸Pθ(3,4)` → `53.1` (GB p.20) |
| P▸Rx( and P▸Ry( | the function with `(` | `P▸Rx(7,30)` → `6.062177826`; `P▸Ry(7,30)` → `3.5` |

- **Modifiers:** an angle-unit modifier overrides the mode for that value, but "the result will be given in the angle mode setting" (TG p.117).
- **DMS arithmetic:** `45°30'+36°15'` → `81.75`, a decimal-degree result (TG p.118).
- **▸DMS output format:** `D°M'S"` with integer seconds, as in `39°26'23"` and `1°30'0"`.

### 3.4 `data`: the data editor and its menus (GB p.5, p.32–33; eG:MT_DataEd; TG p.79–81)

**Editor screen (observed):**
- **Lists:** 3 columns L1, L2, L3. Their headers are tiny boxed "L1", "L2", "L3" **annunciators** in the indicator row above each column, not ordinary text.
- **Cells:** 3 data rows are visible. The current cell is shown in inverse video. An empty list shows `------` (6 dashes) in its first cell. Vertical rules separate the columns, and a horizontal rule sits above the bottom line.
- **Bottom ("author") line:** `L1(5)=`, or `L1(1)= 85` when the cell has a value. Values use `E` for scientific notation, for example `2E3` (TG p.79).
- **Formula lists:** if the column is a formula list, its `L2(1)=` label is shown in inverse video (TG p.81).
- **Capacity:** each list holds up to **42** items (GB p.32).
- **Navigation:**
  - ▲ ▼ move between rows and ◄ ► between columns.
  - 2nd▲ goes to the top of the list.
  - 2nd▼ goes to the bottom, or the first blank row (GB p.32; TG p.29).
- **Editing:**
  - Typing a number and pressing ▼ or enter stores it.
  - **delete** on a cell removes that element, and the elements below move up. Observed: after deleting `53`, the list reads `85, 97, 77` (TG p.86).
  - **clear** "backs up screens"; **2nd quit** returns to Home (TG p.79).
- **Display formats:** numeric notation, decimal setting and angle mode affect element display, except fractions, which stay `1/4` (GB p.32).

**Menu, reached by pressing `data` again inside the editor:**
```
CLEAR FORMULA       ← "CLEAR" inverse
1:Clear L1
2:Clear L2
3↓Clear L3
```
The CLEAR tab continues with `4:Clear ALL`; the screenshot after ▼▼▼ shows `2↑Clear L2 / 3:Clear L3 / 4:Clear ALL`. `data data 4` clears all lists (GB p.25).

```
CLEAR FORMULA       ← "FORMULA" inverse
1:Add/Edit Frmla
2:Clear L1 Frmla
3↓Clear L2 Frmla
```
The FORMULA tab continues with `4:Clear L3 Frmla` and `5:Clear ALL`.

**Add/Edit Frmla:**
- It opens a prompt on the author line for the **current column**: `♦L2=`, with a diamond-shaped bullet and the cursor after `=`.
- While typing, **data** opens the list-name menu: title `Ls` with `1:L1`, `2:L2`, `3:L3`. The exact title string is from the GB chart, not a screenshot **[unverified on screen]**.
- Example: `♦L2=L1▸F◂▸D` gives `0.25, 0.5, 0.75, 1` for L1 = 1/4…1. `♦L2=9/5×L1+32` gives `46.4, 30.2, 39.2`.
- In the formula prompt the multiply sign appears as `×`, not the Home screen's `*` **[observed in one capture; low confidence]**.

**Formula rules (TG p.79; GB p.37):**
- A formula list updates automatically when its source list changes.
- "Pressing enter in a formula list automatically deletes the formula. No message is displayed." The data remain but no longer update.
- A formula must reference L1, L2 or L3, and not its own list; otherwise the FORMULA error. Lists of unequal length give DIM MISMATCH.

### 3.5 `2nd stat`: statistics (GB p.5, p.23–29; eG:MF_Stats; TG p.83–88)

**Menu:**
```
STATS
1:1-Var Stats
2:2-Var Stats
3:StatVars          ← present only after 1-Var or 2-Var stats have been calculated
```
Editing the data afterward removes `3:StatVars` until you recalculate (TG p.83).

**1-Var setup screen (observed):**
```
1-VAR STATS
DATA: L1 L2 L3
FRQ: ONE L1 L2 L3
            CALC        (right-aligned on line 4)
```
- Defaults are DATA L1 and FRQ ONE. Selected choices are shown in inverse video.
- Navigate with ▼ and ►, press **enter** to choose, then ▼ to `CALC` and **enter** (eG:MF_Stats: `[2nd][stat] 1 [▼][▼] [enter]`).
- Non-integer frequencies are valid, but Sx then shows `Sx=Error` (GB p.24). A frequency below 0 or above 99 gives FRQ DOMAIN.

**2-Var setup screen (observed):**
```
2-VAR STATS
xDATA: L1 L2 L3
yDATA: L1 L2 L3
            CALC
```
Defaults are xDATA L1 and yDATA L2.

**Results / StatVars screen (observed):**
- The title is shown in inverse video: `1-Var:L1,One`, `1-Var:L1,L2` (with an FRQ list) or `2-Var:L1,L2`. Lines 2–4 hold the variables.
- Values sit in an 11-character field. Trailing zeros can appear, as in `D:a=0.677325190`, `E↓b=-18.6663732`, `2:x̄=11.33333333`.

**1-Var list (11 items), complete from TG p.85 screenshots:**
`1:n`, `2:x̄`, `3:Sx`, `4:σx`, `5:Σx`, `6:Σx²`, `7:minX`, `8:Q1`, `9:Med`, `A:Q3`, `B:maxX`

**2-Var list (21 items):**
- **Confirmed by screenshots:** `1:n`, `2:x̄`, `3:Sx`, `C:Σxy`, `D:a`, `E:b`, `F:r`, `G:x'`, `H:y'`, `I:minX`. The list length (21) was derived from the `▲×6` wrap landing on G.
- **[unverified order, inferred from the TI-30XIIS order and the item count]:** `4:σx`, `5:ȳ`, `6:Sy`, `7:σy`, `8:Σx`, `9:Σx²`, `A:Σy`, `B:Σy²`, `J:maxX`, `K:minY`, `L:maxY`.

**Selecting a variable:**
- **enter** pastes its **name** on the Home screen. For example, `x̄` appears, and **enter** then evaluates it to `52.5`. It can be used in expressions: `Ans*2` → `105`.
- `x'` and `y'` paste `x'(` and `y'(`. Type the argument and close: `y'(32)` → `18.45454545`; `x'(45)` → `15`.
- Regression is **linear only**: y' = a·x' + b. There is no regression-type menu.
- The GB names the variables `MinX`/`MaxX` in its table, but the screens show `minX`/`maxX`.

### 3.6 `table`: function table (GB p.33–35; eG:MT_FuncTbl; TG p.97–100)

1. `table` shows `y=` and the previous function. Type a function of **x**, entered with the x^yzt_abc key, for example `y=x(36-x)`. Only one level of fraction is allowed (GB p.34). The function cannot contain ◂▸, `rand` or `randint` (TG p.97). Then press **enter**.
2. The setup screen appears:
```
Start=0
Step=1
Auto     Ask-x
              OK
```
   - Defaults are Start 0, Step 1, Auto (inverse); `OK` sits at the bottom right.
   - To change a value: "press clear and then enter a new value" (TG p.97).
   - Step can be negative but not 0.
   - Navigate with ▼ and ◄ ►, choose with enter, then move to `OK` and press enter.
   - eG keys: `[clear] 15 [▼] [clear] 3 [▼] [▼] [enter]`.
3. The table screen appears:
   - Two columns with small headers: `x` over the narrow left column and `y` over the right. Three rows are visible, for example `15 315`, `18 324`, `21 315`.
   - The current x cell is in inverse video, and the bottom line shows `x=15`.
   - ▲ ▼ scroll beyond the visible rows.
   - **Ask-x:** the rows start empty. Type an x value and press enter to fill y (`2 → 2700`, `7 → 450`, `8 → 0`). Use **delete** on each entry to clear (TG p.97).
   - Decimals in the function or the step "force" decimal y values; otherwise fractions or exact values can appear (TG p.97).
4. Leaving: **clear** backs up one screen, and **2nd quit** exits. The last function is kept in memory (TG p.97). An invalid function gives INVALID FUNCTION.

### 3.7 `2nd recall` (GB p.6, p.10–12; eG:GS_MemVar; TG p.71–75)

```
Recall Var          ← title inverse
1:x=15
2:y=0
3↓z=0
```
- The list continues with `4:t=`, `5:a=`, `6:b=` and `7:c=`.
- Values appear in `E` form in restricted contexts. In ENG mode: `1:x=196ᴇ3`, `2:y=207.4ᴇ3`, `3↓z=0ᴇ0`, with a small-caps E.
- **Selecting pastes the variable's VALUE, not its name**, at the cursor. Example: `150*` then `[2nd][recall][enter]` gives `150*196000`; pressing enter again gives `29.4*10⁶` in ENG.
- Contrast: the x^yzt_abc key pastes the **name** (`150*y`).

### 3.8 `sto▸` (GB p.10; TG p.71)

- `sto▸` appends **`→`** to the entry. On an empty line right after a result it becomes `Ans→`.
- Then press **x^yzt_abc** one or more times to choose the variable. **enter** stores the value and shows it as the result:
  - `15→x` → `15`
  - `350*560→x` → `196*10³` (ENG)
  - `Ans→y` → `225`
- You can also store to `rand` to seed it: `5→rand` (§3.2).
- An existing value is replaced.

### 3.9 x^yzt_abc and memory variables

- There are 7 variables: **x y z t a b c**. They hold real numbers (GB p.10).
- The key inserts the variable **name** into the entry (cycling as in §1.3). Its stored value is used when the entry is evaluated. Variables print in a distinct script-like italic glyph: `15→x`, `y=x(36-x)`.
- Variables work inside MathPrint fractions but not in Classic `n/d` fractions (TG p.59).

### 3.10 `2nd clear var` (GB p.6, p.10)

```
Clear Var           ← title inverse
1:Yes               ← "1:" highlighted by default
2:No
```
- `1` clears x…c to 0 (GB p.11: `[2nd][clear var] 1`).
- What is displayed afterward is **[unverified]**; it probably returns to the previous screen.
- Clear Var lists **Yes first**, while Reset lists **No first**.

### 3.11 `2nd reset` (GB p.6, p.9; TG p.vii, p.29, p.32, A-5)

```
Reset               ← title inverse
1:No                ← default highlighted
2:Yes
```
- `1` (No) returns to the previous screen without resetting.
- `2` (Yes) resets and shows this, with only the `DEG` annunciator lit:
```
                 DEG
 MEMORY CLEARED
```
  The text sits on line 2 of the 4-line area and is roughly centered. `clear` then gives an empty Home screen with the cursor at the top left (TG p.32, images 146 and 797).
- **What a reset does:**
  - Returns modes to their defaults: DEG, NORM, FLOAT, MATHPRINT.
  - Clears the memory variables, pending operations, all history, statistical data (lists), the constant K and Ans (GB p.9; TG p.29).
  - Table settings and the stored table function are probably reset too **[unverified]**.
- **Hardware shortcut:** "Pressing on and clear simultaneously resets the calculator immediately. No menu or message is displayed" (TG p.29, A-5). Note that the GB2006 p.13 and GED material conflict about which message appears.
- The SmartView emulator starts up showing the `MEMORY CLEARED` screen (SV `30xs_emu_screen2.png`).
- The GED requires `MEMORY CLEARED` to be on screen at check-in; the key sequence is `2nd 0 2` (GED).

### 3.12 `2nd K`: constant (GB p.35–36; eG:MT_Const; TG p.67–69)

- `2nd K` opens the **constant editor**. The Home screen shows `K=` followed by the cursor (`K=█`). If a constant already exists it is shown for editing; press `clear` to clear it (TG p.67).
- Type an operation tail of up to **44 characters** (GB p.35), for example `*2+3` (shown as `K=*2+3`) or a postfix like `²` (shown as `K=²`).
- **enter** saves it. The **`K` annunciator** turns on (observed at the left part of the indicator row) and stays on while constant mode is active.
- From then on, each **enter** "places the contents of K at the end of the expression in the display" and evaluates. The history shows the full expression:
  - `4` enter → `4*2+3` = `11`
  - `6` enter → `6*2+3` = `15`
  - `16` enter → `16*5.25` = `84`
- With an empty entry, K is applied to the last answer. TG p.67: "If you do not enter a value, 0 is assumed, and Ans will appear in the display". The exact display is **[unverified]**.
- **2nd K pressed again turns constant mode off** and the K annunciator disappears (TG p.67).
- To redefine: `[2nd][K] [2nd][K] [clear] <new> [enter]`. The first press turns K off and the second opens the editor (GB p.36).
- **Limits:** a combined entry over 47 characters gives `EQUATION LENGTH ERROR`. More than 4 nested MathPrint levels with K gives `MEMORY LIMIT` (GB p.37–38).
- Switching CLASSIC/MATHPRINT clears K (TG p.35). Reset clears K.

### 3.13 No "math" menu

The TI-30XS MultiView has **no MATH, NUM, CPX, VECTOR, MATRIX or BASE menus** and no equation solver. Functions not reachable from the keys above (such as abs, round, lcm and gcd) do not exist on this model.

---

## 4. Entry and editing behavior

### 4.1 Cursor and cursor shapes

- **Normal (overwrite) cursor:** a **blinking solid block** the size of a character cell, for example `3+3█`, `K=█`, `P▸Rx(█` (screenshots; GED: "Normal Cursor is a black square… blinks").
- **Insert cursor:** an **underscore**, activated by **2nd insert** (GED).
- **Template "exit" cursor:** when the cursor sits at the end of a MathPrint template slot (an exponent, denominator, etc.), it is drawn as a **black block containing a small white ">" chevron**, prompting you to press ► (GED, which includes the 7×7 glyph image).
- **Default mode is overwrite** [inferred, strongly supported]. In the TG "Delete and insert" example (TG p.42), `4569+285` with the cursor moved 6 left onto `6`, then `delete`, gives `459+285`. Then `►►►►` puts the cursor on the final `5`, and `2nd insert 6` gives `459+2865`. A plain `6` at that point would have overwritten the `5`. How long insert mode lasts (one character, or until the cursor moves) is **[unverified]**.
- **◄ ►** move through the entry. **2nd◄** and **2nd►** jump to the beginning and end (GB p.6).
- Inside MathPrint templates:
  - **▼** moves from a numerator to its denominator, and **▲** moves back.
  - **►** at the end of a slot exits the template. Examples: `5 [^] 2 [►] [+] …` and `[n/d] 3 [▼] 4 [►] [+] …` (GB p.13, p.16).
  - Because ▲ inside a denominator moves to the numerator, history must be reached there with **2nd ▲** (GB p.13).

### 4.2 delete and 2nd insert

- **delete** "deletes the character at the cursor." TG p.41: "Then, each time you press delete, it deletes 1 character to the left of the cursor." When the cursor is past the end of the entry, delete acts as a backspace (GED: "or to the left of cursor if no value is under the cursor").
- **2nd insert** "Inserts a character at the cursor" (GB p.9). New characters go before the character under the cursor and push it right.

### 4.3 clear (GB p.9; TG p.41, p.43; eG:GS_ClrCorr)

The GB's list of what **clear** does:
- "Clears an error message."
- "Clears characters on entry line."
- "Moves the cursor to last entry in history once display is clear."
- "Backs up one screen in applications."

Observed details:
- **With the cursor inside the entry, clear erases from the cursor to the end (clear to right).** `21595` with the cursor moved 2 left and `clear` gives `215` (TG p.43, labeled "(Clear to right)").
- When the cursor is at the end or the entry is empty, clear empties the entry line. TG p.41: "Press clear once to clear an uncompleted entry; press it again to clear the display." The display becomes blank with the cursor at the top left (image 796).
- **History survives** a cleared screen and can still be reached with ▲. clear does not affect memory, stat data, angle units or notation (TG p.41).
- "You can scroll up and use clear to clear entries in history" (TG p.41). The exact effect, whether it deletes the highlighted history pair or only exits the history selection, is **[unverified]**.
- In menus, clear goes back one level. On the mode screen, clear exits to Home.

### 4.4 Pressing an operator first (Ans insertion)

- **Binary operators and postfix functions** (`+ − × ÷ ^ x² x⁻¹ sto▸` and also `nPr`/`nCr` **[unverified for the last two]**), pressed as the first key of an entry, insert **`Ans`** before the operator. Observed: `Ans*3`, `Ans÷3`, `Ans÷4`, `Ans+2.3%*7300`, `Ans⁻¹`, `Ans→x`, `Ans→y` (GB p.7; TG p.73, p.107).
- **Conversions and the toggle** behave differently: pressed first, they insert the **previous answer's value** rather than the word `Ans`:
  - `▸DMS` gives `39.4397222221▸DMS`, or `98.25▸DMS` in a later example.
  - `◂▸` gives `2√2◂▸` and `9.42477796077◂▸`.
  - `▸n/d◂▸Un/d` gives `57/8▸n/d◂▸Un/d`.
- Exact answers (fraction, radical, π) are inserted in their exact form. Decimal answers are inserted with about **12 significant digits** (`9.42477796077`, `39.4397222221`) [observed; exact rule **unverified**].
- **2nd ans** inserts the `Ans` token anywhere, for example `√Ans`, `³√Ans`, `sinh⁻¹(Ans)`, `180°-Ans`.
- **Casing:** the 2006 GB, the TG and most 2025 eGuide captures show **`Ans`**. Three eGuide captures (`GS_lastans01–03`) show lowercase `ans`, apparently from an older emulator build. Use `Ans`.
- Ans persists through power-off (GB p.7).

### 4.5 History: scrolling and reuse (GB p.6; TG p.vii, p.29, p.31, p.75)

- History is a list of (entry, result) pairs shown oldest at the top. **▲ moves a highlight upward, stepping through *results and entries alternately*:** the newest result, then its entry, then the previous result, and so on. The highlighted item is shown in inverse video.
  - Observed after off/on, `▲▲▲`: the 3rd press highlights the result `15` of `41-26` (TG p.31).
  - `▲×4` on the history `1+1, 2+2, 3+3, 4+4` lands on the entry `3+3` (GB p.6).
  - `▲×6` lands on `2+x(1.40)` (TG p.75).
- **enter** on a highlighted item **pastes it at the cursor** in the current entry: `3+3█`. You can then edit it and press enter to evaluate, for example `3+3+2` → `8`. Pasting into a fraction slot works: put the cursor in the denominator, press **2nd▲** to reach history, then enter (GB p.13).
- **2nd▲** jumps to the previous entry and then, on a second press, to the oldest (TG p.29). Appendix A-1 says simply "to the oldest entry". **2nd▼** moves "below the last entry", back to the entry line.
- Off and on, and **2nd quit**, leave a **blank Home screen**, but history is still there: "scroll up to view history" (TG p.31, p.36).
- History depth (number of entries kept) is **not documented [unverified]**. History survives off/on and APD; reset and a CLASSIC/MATHPRINT switch clear it.
- Re-evaluating a pasted entry uses current variable values: `2+x(1.40)` gives `8.3` with x=4.5 and `6.48` after x=3.2 (TG p.74–75).

### 4.6 enter on an empty line repeats the last entry

Observed several times:
- `randint(2,10)` gives `2`; pressing enter again on the new empty line gives a second `randint(2,10)` line with `7`, then `8` (TG p.95).
- `rand`, enter, then another `rand` (TG p.93).
- `[mode] [▼][►] [enter] [clear] [enter]` re-evaluates `12543` in SCI as `1.2543*10⁴` (TG p.56).

With constant mode on, enter instead applies K (§3.12).

### 4.7 2nd quit

Returns to the Home screen from any menu, the mode screen, the data editor, the table or stat screens (GB p.4). The Home screen comes back blank, with history kept (TG p.vi). On the Home screen itself, quit also clears the display **[unverified]**.

### 4.8 Entry limits

- **Entry line: up to 80 characters** (KB 15401: "The entry line of the TI-30XS MultiView calculator can contain up to 80 characters").
- Stat entries: 80 digits. Constant combinations: 47 (GB p.37: EQUATION LENGTH ERROR). The K definition itself is up to 44 characters (GB p.35).
- MathPrint nesting: "up to four levels of consecutive nested functions and expressions, which include fractions, square roots, exponents with ^, ˣ√y, eˣ, and 10ˣ" (GB p.1).
- More than 23 pending operations or 8 pending values gives SYNTAX (GB p.38). MEMORY LIMIT is also documented for more than 23 pending operations.
- Long entries scroll horizontally. The line shows 15 characters plus a **▶ arrowhead in the 16th cell** when more text lies to the right: `12°31'45"+26°54▶`. **◀** appears in the 1st cell when text lies to the left. The GB calls these "◀ ▶ … An entry or menu displays beyond 16 digits" (GB p.2).

### 4.9 Implicit multiplication

Supported, at the **same precedence as × and ÷** (EOS level 8, "Multiplication, implied multiplication, division"; GB p.8):
- `4(2+3)` → `20`
- `2π` → `2π`
- `x(36-x)`
- `2+x(1.40)`
- `-4(1)(6)`
- `16π`

### 4.10 (−) versus −

- **(−)** enters negation and is drawn as a raised short minus, **`⁻`**: `60+5*⁻12` → `0`; `1+⁻8+12` → `5`. Results also use this glyph: `⁻27`, `⁻2`. A few old captures render it like a hyphen, but the newer captures show the raised form **[the display agent should confirm the glyph]**.
- Negation has **lower precedence than powers** (EOS level 6, below level 5 for ^ and roots): `⁻2²` = `⁻4` and `(⁻2)²` = `4` (TG p.45).
- **−** is binary subtraction. As the first key of an entry it inserts `Ans−`. TG p.45: "Do not confuse (−) with −."
- For a negative exponent with ×10ⁿ or ^, use (−): `10^⁻2`.

### 4.11 2nd % and 2nd ▸%

- **2nd %** appends `%`, a postfix that divides by 100: `2%*150` → `3`; `15%*80` → `12`; `3%*5000` → `150`. The result follows the decimal setting (TG p.45).
- **2nd ▸%** is a conversion that formats the result as a percentage: `1/5▸%` → `20%`, with a `%` suffix in the result (GB p.14).

### 4.12 Fractions: n/d and U n/d (GB p.13–14; TG p.59–63)

**MathPrint:**
- `n/d` **before** a number gives an empty stacked template. Type the numerator, press **▼**, type the denominator, then press **►** to exit.
- `n/d` **after** a number makes that number the numerator and puts the cursor in the denominator.
- Templates can contain operators, functions and variables: `(1.2+1.3)/4` → `0.625`, and the quadratic-formula example `(⁻5+√(5²-4(1)(6)))/2(1)` → `⁻2`.

**Mixed numbers:**
- `4 [2nd][U n/d] 1 [▼] 2 [►]` gives a stacked mixed number.
- In MathPrint, pressing U n/d **before** typing a digit gives a template whose unit holds **only one digit** (TG p.59).
- The unit must be an integer. The numerator and denominator may contain decimals.

**Classic:**
- `3 [n/d] 4` is drawn **`3/4`** with a special slanted fraction-bar glyph.
- `1 [2nd][U n/d] 7 [n/d] 12` is drawn **`1⌴7/12`**, with a "⌴"-shaped mixed-number separator.
- Classic fractions accept no operators, functions, variables or nested fractions. Use ÷ with parentheses instead (GB p.13).

**Results:**
- Fraction results "default to improper fractions" and are "automatically simplified": `3/4+1⌴7/12` → `7/3`; `4⌴5/9` → `41/9`; `5⌴1/3` → `16/3`.
- **2nd n/d◂▸Un/d** appends `▸ⁿ⁄d◂▸Uⁿ⁄d`, drawn with single-cell n/d glyphs: `9/2▸n/d◂▸Un/d` → `4⌴1/2` (Classic) or a stacked 4½ (MathPrint); `57/8▸…` → 7⅛.
- **2nd f◂▸d** appends `▸F◂▸D`: `4⌴1/2▸F◂▸D` → `4.5`; `2.25▸F◂▸D` → `9/4` (GB p.13; TG p.63). Both need **enter**.

### 4.13 ×10ⁿ

- It is literally "× 10 to the power", shown as **`*10`** with a superscript exponent template in MathPrint (`1.5*10⁸`). Type the exponent, then press **►** to exit (GB p.15; TG p.58).
- It is an ordinary multiplication, so precedence applies. KB 20469 screenshots: `2*10³÷4*10⁴` → `5000000`, while `2*10³÷(4*10⁴)` → `0.05`.
- The Classic-mode rendering of the inserted text is **[unverified]**; probably `*10^`.
- The result is shown in the current notation mode (GB p.3).

### 4.14 Other insertion forms (screenshots)

| Key | MathPrint shows | Classic shows |
|---|---|---|
| sin, cos, tan, log, ln | `sin(`, `log(`, `ln(` (close them with `)`) | same |
| hyp then sin | `sinh(` (the HYP annunciator is on until the trig key) | |
| hyp then 2nd sin⁻¹ | `sinh⁻¹(` | |
| 2nd √ | radical template `√‾` | `√(` |
| 2nd ˣ√ | the index is the preceding number, as in `³√64` and `⁶√64` | infix `3ˣ√64` |
| ^ | superscript template: `5²+4⁽²⁺¹⁾`, `2^3^2` drawn as a stacked tower | `^`, as in `2^3^2` |
| 2nd 10ˣ and 2nd eˣ | `10` or `e` with a superscript template (`10^log(2)`, `e^.5`) | **[unverified]**: probably `10^(` / `e^(` |
| x², x⁻¹ | `²`, `⁻¹` | same |
| π | `π` | same |
| 2nd , | `,` | |

- **^ associativity differs by mode:** right-to-left in MathPrint (2^3^2 = **512**) and left-to-right in Classic (**64**) (GB p.8).
- **x² and x⁻¹ always associate left to right:** 3 x² x² = 81.

### 4.15 EOS order of operations (GB p.8; TG p.50–51)

1. Expressions inside parentheses.
2. Prefix functions that need a `)`: sin, log, all R▸P items, etc.
3. Fractions.
4. Postfix functions: x², angle modifiers ° ′ ″ ʳ ᵍ.
5. Exponentiation `^` and roots `ˣ√`.
6. Negation `⁻`.
7. nPr and nCr.
8. ×, implied ×, ÷.
9. + and −.
10. Conversions: n/d◂▸Un/d, F◂▸D, ▸%, ▸DMS.
11. **enter** "completes all operations and closes all open parentheses", so a missing `)` is allowed.

### 4.16 The ◂▸ toggle key (GB p.7; TG p.vii, p.30)

- It toggles a result between **fraction ↔ decimal**, **exact √ ↔ decimal** and **exact π ↔ decimal**. A decimal result also toggles back to a fraction or π form when possible:
  - `2.25` → `9/4`
  - `12.167` → `12167/1000`
  - `9.424777961` → `3π`
- **After a result, each press immediately adds a new history line** `<answer>◂▸` with the alternate form; no enter is needed:
  - `√8` → `2√2`, then press ◂▸: `2√2◂▸` → `2.828427125`
  - `2*π` → `2π`, then `2π◂▸` → `6.283185307`
- It can also be typed **inside** an entry before enter: `(2*10³)/(4*10⁵)◂▸` gives `5*10⁻³`. TG p.30: "Pressing ◂▸ more than once in a current entry may result in a Syntax error."
- The toggled decimal respects FIX: `√3◂▸` → `2` in FIX 0.

### 4.17 How results are displayed

- **Placement:** results are **right-aligned**. A result shares the entry's line when both fit, otherwise it goes "on the right side of the next line" (GB p.1). There is **no "=" or "▸" marker** before results.
  - **Inferred fit rule (single-height lines):** the result stays on the entry's line only when entry cells + result cells ≤ **14**, which leaves at least 2 blank cells. All of about 30 Classic and inline cases agree **[inferred]**:
    - Same line: `92+83+97+86 358` (11+3), `randint(2,10) 2` (13+1), `150*y 31.11*10⁶` (5+9), `1.5▸DMS 1°30'0"` (7+7).
    - Next line: `52 nCr 5` / `2598960` (8+7=15), `rand` / `0.390926039` (4+11), `Ans÷3` / `85.66666667` (5+11).
  - With stacked MathPrint objects the line is taller, but the same width rule appears to hold.
- **FLOAT:** up to **10 digits**, plus sign and decimal point, rounded:
  - `85.66666667`, `2.828427125`, `0.000093165`, `0.000018633`
  - `630000000` (9 digits, so it stays in normal form)
  - TG p.55: "Results requiring more than 10 digits are automatically displayed in scientific notation."
- **Switch to scientific in NORM (inferred):** |x| ≥ 1×10¹⁰, or nonzero |x| < about 1×10⁻⁹ (where 10 digits including leading zeros can no longer show it). The GED notes say the same. The exact threshold is **[unverified]**.
- **Scientific format:** a mantissa, a small `*` and `10` with a superscript exponent (MathPrint: `1.2543*10⁴`, `5*10⁻³`). Classic uses an inline caret: `1.2345*10^4`. Restricted contexts (Recall Var, data editor, table) use `1.2E3`-style with a small-caps E (`196ᴇ3`).
- **Multiplication glyph:** the Home screen draws × as a small **asterisk-like glyph (`*`)** in entries and results (`3*3`, `1.2345*10⁴`). The Classic-mode `×` key also shows `*`.
- **Exact results (MathPrint):**
  - **Fractions** come from `n/d` input, negative integer powers and x⁻¹: `2⁻¹` → `1/2`; `10⁻²` → `1/100`; `5⁻¹` → `1/5`.
  - **Radicals:** `√8` → `2√2`; `√(5²-4(1)(3))` → `√13`.
  - **π multiples:** `π*12²` → `144π`.
  - **Trig exact values** "at multiples of 15 degree or π/12 increments": `sin(30)` → `1/2` (TG p.123).
  - **Decimal input forces a decimal result:** `2*π*1.5` → `9.424777961`, and `2.0π` gives a decimal (TG p.113). A decimal in a fraction does the same: `(1.2+1.3)/4` → `0.625`.
  - **`÷` gives a decimal:** `Ans÷3` → `85.66666667`.
  - Full fraction/decimal rules for the math engine: **[the math agent should verify]**.
- **Classic:**
  - √ and π give decimals: `√(2)` → `1.414213562`; Classic FIX 2 `2π` → `6.28`.
  - `n/d` input still gives a fraction: `1/8` → `1/8`.
- **FIX applies to results only.** Entries keep their typed digits (`12.345` → `12.35`).

---

## 5. Indicators (annunciators)

GB p.1–2 and TG B-1 give this list. The positions are measured from TI-SmartView 224×81 captures, with x measured left to right in capture pixels. The indicators are **fixed-position annunciator segments in a strip above the 4 text lines**, each always drawn in the same place, not flowing text.

| Indicator | Exact text | When shown | Observed x-position (of 224) |
|---|---|---|---|
| 2nd | `2nd` | After 2nd, until the next key | not captured **[unverified position]** |
| HYP | `HYP` | After 2nd hyp, until a trig key | not captured **[unverified]** |
| FIX | `FIX` | Decimal mode set to 0–9 | x≈55–63 |
| K | `K` | Constant feature on | x≈66–69 |
| SCI | `SCI` | SCI notation | x≈92–100 |
| ENG | `ENG` | ENG notation | x≈112–124 |
| DEG | `DEG` | Angle mode degrees. One angle indicator is lit at all times, including on menu and mode screens. A few older eGuide captures (the prb examples, `10^-2`) omit it, apparently from an older emulator build. | x≈162–173 |
| RAD | `RAD` | Radians | x≈175–185 |
| GRAD | `GRAD` | Gradians | not captured **[unverified]** |
| L1 L2 L3 | tiny boxed "L1", "L2", "L3" | Data editor only, above each column | x≈16–21, 83–89, 153–159 |
| busy | hourglass icon ⌛ | "calculator is performing an operation" | not captured **[unverified]** |
| ↑ ↓ | small up and down arrows | "An entry is stored in memory before and/or after the active screen." ↑ appears once any history exists, including on a blank screen after off/on. | x≈192–196 (↑), 198–202 (↓) |
| ◀ ▶ | arrowheads in the first or last **text cell** of a line, not in the annunciator strip | the entry or menu extends past 16 characters | in-line |

- The rule for when **↓** appears is unclear. It shows on many single-screen histories (for example right after `5²+12²` on TG p.38) **[unverified rule]**.
- Several 2025 eGuide captures show a stray `S` at the SCI position (x≈92–94) while in NORM mode. Treat it as an emulator artifact; it is not a real state.
- The display itself is 4 text lines of 16 cells. Captures are drawn at 2× with 12-pixel cell pitch and 16-pixel line pitch, consistent with a 96×32 dot matrix below the annunciator strip. MathPrint stacked objects take more than one row of height **[the display agent should confirm]**.

---

## 6. Power, memory, contrast, reset defaults

- **on** turns the calculator on. **2nd off** turns it off: "The display is cleared, but the history, settings, and memory are retained" (GB p.1). Memory is continuous. After power-on the Home screen is blank, with the cursor at the top left and the ↑ annunciator lit if history exists (TG p.31).
- **APD:** the calculator turns off after **about 5 minutes** with no key press. Press **on** to resume; "the display, pending operations, settings, and memory are retained" (GB p.1). So unlike a manual off, APD restores the previous screen.
- **Contrast:** "Press and release the 2nd key. Press + (to darken the screen) or − (to lighten the screen)" (GB p.1). The legends are ◑▸ over + and ◂◑ over −. Whether repeated presses continue without re-pressing 2nd, and how many levels exist, is **[unverified]**.
- **Reset defaults:** DEG, NORM, FLOAT, MATHPRINT, with everything cleared (§3.11). There are two ways: **2nd reset 2** (shows `MEMORY CLEARED`) or **on+clear together** (silent).
- **Power and battery:** the solar TI-30XS has a backup CR2032 battery; the XB has a CR2032 only (GB p.39). `LOW BATTERY` "displays briefly and then disappears. Pressing clear does not clear this message" (GB p.38).

---

## 7. Errors (GB p.37–38; TG C-1–C-2)

- **clear** dismisses the message. "The previous screen is displayed with the cursor at or near the error location."
- **Message names:**
  - `ARGUMENT`
  - `DIVIDE BY 0` (also produced in statistics when n = 1)
  - `DOMAIN` (with the examples in GB p.37)
  - `EQUATION LENGTH ERROR`
  - `FRQ DOMAIN`
  - `OVERFLOW` (GB: a number entered or calculated beyond the calculator's range. TG C-1 adds "|θ| ≥ 1×10ⁿ, where θ is an angle in a trig, hyperbolic, or R▸Pr function"; the exponent is garbled in the source, probably 10¹⁰ **[unverified]**)
  - `STAT`
  - `DIM MISMATCH`
  - `FORMULA`
  - `SYNTAX` ("If using n/d, try using ÷")
  - `INVALID FUNCTION`
  - `MEMORY LIMIT`
  - `LOW BATTERY`
- **On-screen layout of an error (wording, case, position, whether "ERROR" is appended) is [unverified].** No TI screenshot of an error screen was found. GB and TG list the names in capitals; only EQUATION LENGTH ERROR includes the word "ERROR".

---

## 8. Discrepancies, corrections to the brief, and open questions

1. **No mode page 2.** The mode screen has exactly 4 rows. The brief's `n/d U n/d`, `ANSWER: AUTO DEC FRAC`, STAT and DECIMAL SEPARATOR options are TI-36X Pro / TI-30X Pro features.
2. **The ×10ⁿ 2nd legend is `n/d◂▸U n/d`** (simple fraction first), not "U n/d◄►n/d".
3. **Reset is 2nd + 0, and its menu lists No first; Clear Var lists Yes first.** The menu title is `Reset`; the TG prose says "RESET" **[the screenshot shows `Reset`]**.
4. **`Ans` casing:** use `Ans` (§4.4).
5. **Not found in any source:**
   - An error-screen screenshot.
   - Annunciator positions for 2nd, HYP, GRAD and the hourglass.
   - History depth.
   - The exact NORM↔SCI switch thresholds.
   - Classic-mode text for ×10ⁿ, 10ˣ and eˣ.
   - The exact effect of clear on a highlighted history item.
   - Whether insert mode persists.
   - Whether x^yzt_abc wraps from c back to x.
   - The 2-Var StatVars order for items 4–B and J–L.
   - The contrast step count.
   - What is displayed after Clear Var → Yes.
6. **A physical unit or the TI-SmartView emulator** would settle every item in point 5 in a few minutes.
