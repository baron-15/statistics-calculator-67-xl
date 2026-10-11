# TI-30XS MultiView: calculation semantics, statistics, tables, probability, errors, and worked examples

Research notes for a faithful web recreation. This file covers math behaviour only. The sibling notes cover key layout, menus and editing; I repeat menu and editing facts here only where they change a result.

---

## 0. Sources, citation scheme and confidence markers

| Tag | Document | Where | Notes |
|---|---|---|---|
| **GB19** | *TI-30XS MultiView™ and TI-30XB MultiView™ Scientific Calculator Guidebook*, © 2019, 43 PDF pages | `https://education.ti.com/html/eguides/scientifics/PDFs/EN/TI30XS-MultiView-Guide_EN.pdf` (linked from `.../EN/TI-30XS-MultiView-guidebook-en.html`) | **Primary source.** AES-256 (V5/R6) encrypted, empty user password. I decrypted it with a stdlib-only Python script (pure-Python AES) and extracted both text and the embedded screen captures (224×81 px LCD bitmaps). **Printed page = PDF page − 3.** All "p. N" citations below are *printed* page numbers. |
| **GB25** | Same guidebook, © 2025, 45 PDF pages | `https://education.ti.com/-/media/2FB7733DDAC447A4B4375E77846E1DF0` | Identical text and identical screenshots (pixel-hash compared), apart from new battery-warning pages and fixed superscripts. Printed page numbers are the same as GB19 for every page cited here. |
| **GB06** | Earlier edition of the same guidebook, "Copyright © 2006" in the footer, 44 pages | mirror: `https://people.math.wisc.edu/~meyer/math141/TI30XS.pdf` | Same examples. **9 screenshots differ**, and the error and stats wording differs (older firmware). Used to detect firmware changes. Page numbers are GB06's own printed pages. |
| **TG** | *TI-30XS MultiView™: A Guide For Teachers*, © 2006–2025, 151 PDF pages | `https://education.ti.com/download/en/ed-tech/62522EB25D284112819FDB8A46F90740/A3A2CEC48F954B2DA422F4772C92DAA9/TI30MV_TeacherGuide_EN.pdf` | RC4-128 encrypted. 197 more screen captures (54 worked examples), plus "Notes" that settle several vague points. **Printed page = PDF page − 8** in the body; appendices are A-1…D-1. |
| **eGuide** | HTML eGuide | `https://education.ti.com/html/eguides/scientifics/TI-30XS-MultiView/EN/Content/EG_30XSMV/...` | Same text as GB19; no new facts. |
| **KB nnnnn** | TI Knowledge Base solutions | `https://education.ti.com/en/customer-support/knowledge-base/...` | 15401 (entry-line length), 31772 (1-Var example), 12280 (std-dev example), 20469 (×10ⁿ division needs parentheses). 15400 (fraction limits) and 40237 (domain error) cover **other models** and are used only for comparison. |

Confidence markers used throughout:
- **[GB19 p.N] / [TG p.N] / [KB n]**: stated in TI material.
- **[screen GB19 p.N]**: read off a TI screenshot (pixel-level reading).
- **[inferred]**: my deduction from TI screenshots or statements; the reasoning is given.
- **[unverified]**: not established from TI material. Treat it as a placeholder until tested on hardware.

How keys were decoded: the guidebooks print keys with symbol fonts (Elmo-KeySymbols, TI-30XIIIKeySymbols, TI-34IIIKeySymbols, ICOMSymbols). I rasterized the embedded TrueType glyphs to identify every key glyph. Keystrokes below use these names: `[2nd] [mode] [delete] [on] [◄] [►] [▲] [▼] [x²] [^] [log] [prb] [data] [stat] (2nd) [enter] [ln] [×10ⁿ] [(] [)] [π] [sin] [cos] [tan] [sto→] [n/d] [x⁻¹] [table] [clear] [(−)] [◄►]` (the answer-toggle key), and the digits. A 2nd function is written `[2nd] [label]`, for example `[2nd] [√]`, `[2nd] [x√]`, `[2nd] [U n/d]`, `[2nd] [f◄►d]`, `[2nd] [n/d◄►U n/d]`, `[2nd] [%]`, `[2nd] [▸%]`, `[2nd] [K]`, `[2nd] [hyp]`, `[2nd] [sin⁻¹]`, `[2nd] [10^x]`, `[2nd] [e^x]`, `[2nd] [ans]`, `[2nd] [recall]`, `[2nd] [clear var]`, `[2nd] [reset]`, `[2nd] [angle]`, `[2nd] [,]`, `[2nd] [quit]`, `[2nd] [insert]`, `[2nd] [off]`, `[2nd] [stat]`. The variable key is `[xyzt]` (it cycles x y z t a b c).

Local artifacts, all under `scratchpad/`:
- `ti30xs-math/dl*/`: downloaded PDFs and HTML.
- `ti30xs-math/out/`: GB19 decrypted objects, per-page text (`readable/page_NNN.txt`, `all.txt`), every screen capture as a PNG (`img/pPPP_imgN_*.png`, where PPP is the PDF page), and labelled contact sheets (`sheets/s_NN.png`).
- `ti30xs-math/out_media1/`: GB25. `ti30xs-math/out_wisc/`: GB06. `ti30xs-math/out_tg/`: TG (`all_full.txt`, `scr/`, `sheets/t_NN.png`).
- `ti30xs-scripts/`: the stdlib-only tools.
  - `aes.py`: AES self-tested against FIPS-197.
  - `pdfx.py`: decrypts RC4 and AES-256 R6 PDFs and expands object streams.
  - `pdftext.py`: text and image extraction.
  - `keymap*.py`: key-glyph names.
  - `glyphs.py`: TrueType glyph rasterizer.
  - `montage.py`: contact sheets.

### 0.1 Display transcription conventions (used in §10)

Screens are 16 characters × 4 lines plus an indicator row [GB19 p.1]. In the transcriptions:
- `*` is the multiplication glyph the home screen actually shows (`3*3`, `1.2345*10⁴`). The data editor shows `×` in its small font [screen GB19 p.33].
- `⁻` is the negative sign: a short, raised minus, distinct from subtraction `−` (`60+5*⁻12`, result `⁻2`).
- `÷` is division as displayed (`Ans÷4`).
- `→` is the store arrow (`15→x`). Variables display in italic lowercase: `x y z t a b c`.
- `␣` is the Classic-mode mixed-number separator: a small "⌴" glyph between unit and fraction (`4␣1/2`).
- `◄►` (small) is appended to an entry that was evaluated with the answer-toggle key (`1/8◄►`).
- `▸` is the conversion arrow: `▸DMS`, `▸%`, `▸F◄►D`, `▸n/d◄►Un/d`.
- MathPrint 2-D structures are written as follows:
  - `{N/D}` is a stacked fraction.
  - `U{N/D}` is a stacked mixed number.
  - `√(X)` is a radical whose bar spans X.
  - `ⁿ√(X)` is a radical with index n.
  - `^{X}` is raised exponent text, for example `2^{5}` (a superscript 5) or `10^{log(2)}`.
  - `ʳ`, `ᵍ`, `°`, `'`, `"` are angle markers as shown.
- "→ R" means the result is right-aligned **on the same line** as the entry. "→ ↵R" means it is right-aligned **on the next line** because it did not fit [GB19 p.1: "depending upon space, the answer is displayed either directly to the right of the entry or on the right side of the next line"].
- Indicator-row items (`DEG`, `RAD`, `FIX`, `SCI`, `ENG`, `K`, `2nd`, `HYP`, scroll arrows) are noted only when relevant.

---

## 1. Order of operations (EOS™)

### 1.1 The guidebook list, verbatim [GB19 p.8–9; identical in GB06 p.11–12 and TG p.50–51]

> The TI-30XS MultiView™ calculator uses Equation Operating System (EOS™) to evaluate expressions. Within a priority level, EOS evaluates functions from left to right and in the following order.

| Priority | Item |
|---|---|
| 1st | Expressions inside parentheses. |
| 2nd | Functions that need a `)` and precede the argument, such as sin, log, and all R◄►P menu items. |
| 3rd | Fractions. |
| 4th | Functions that are entered after the argument, such as x² and angle unit modifiers. (TG p.50 lists the modifiers: °, ′, ″, r, g.) |
| 5th | Exponentiation (^) and roots (ˣ√). |
| 6th | Negation (⁻). |
| 7th | Permutations (nPr) and combinations (nCr). |
| 8th | Multiplication, implied multiplication, division. |
| 9th | Addition and subtraction. |
| 10th | Conversions (n/d◄►Un/d, F◄►D, ▸DMS). TG p.51 adds **▸%**. |
| 11th | `[enter]` completes all operations and closes all open parentheses. |

### 1.2 Notes that settle associativity and edge cases
- **Power associativity depends on the display mode.**
  - Classic: "exponentiation using the [^] key is evaluated from left to right. 2^3^2 is evaluated as (2^3)^2 = 64."
  - MathPrint: "evaluated from right to left. 2^3^2 is evaluated as 2^(3^2) = 512."
  - Source: [GB19 p.8, screen p.8: Classic `2^3^2` → `64`; MathPrint `2^{3^{2}}` → `512`].
- **x² and x⁻¹ always evaluate left to right**, in both modes: `3 [x²] [x²]` = (3²)² = 81 [GB19 p.8, p.16; TG p.50, p.101].
- **Negation is below powers**: ⁻2² = ⁻4 and (⁻2)² = 4 [TG p.45]; ⁻5² = ⁻25 and (⁻5)² = 25 [TG p.101]. Negation is **above** nPr/nCr and ×÷ (6th vs 7th and 8th).
- **Implied multiplication has the same priority as explicit ×÷** (both 8th): `4(2+3)` = 20 [screen GB19 p.9]; "3 (4+3) = 21" [TG p.45]. It does **not** bind tighter than division. [inferred from the table: so `1÷2(3)` should evaluate as (1÷2)·3 = 1.5. **[unverified on hardware]**]
- **nPr/nCr bind tighter than × and ÷** (7th vs 8th): `2*5 nCr 2` = 2·10 = 20 [inferred from the table].
- **Postfix operators** (x², x⁻¹, angle modifiers °′″ʳᵍ, and by the 4th-level definition `!` and `%`) are 4th level. `%` is a postfix "÷100": `2%*150` = 3 [screen GB19 p.15]. [inferred: `!` and `%` sit at level 4 because they are "entered after the argument"; the guidebook does not list them by name.]
- **Fractions (3rd) bind tighter than ^ (5th).** The MathPrint fraction template is a single grouped unit. In Classic, `n/d` entered with the `[n/d]` key is a fraction token, not division, so `[n/d]` fractions are evaluated before ×÷ [GB19 p.13 note: "In Classic mode … use [÷] to perform complex division problems"].
- **Conversions are applied last** (10th), to the whole preceding expression: `4␣1/2▸F◄►D` → 4.5; `1/5▸%` → 20%.
- **[enter] auto-closes parentheses**: `√(5²−4(1)(3)` without the final `)` evaluates in Classic [screen TG p.53].
- **[×10ⁿ] is not an atomic E-notation token.** It enters `*10^` (display `2*10⁵`, or MathPrint `2×10^{5}`), so it takes part in EOS. TI KB 20469: "When dividing two values in scientific notation, it is necessary to put parentheses around the second value … If parentheses are omitted, the calculator will yield an incorrect result." GB19 p.15: "Use parentheses to compute the correct order of operation." Consequence: `6[×10ⁿ]5 ÷ 2[×10ⁿ]3` evaluates as ((6·10⁵)÷2)·10³ = 3×10⁸, not 300 [inferred from KB 20469].
- **Pending-operation limits**: more than 23 pending operations or 8 pending values gives **SYNTAX** [GB19 p.37] or **MEMORY LIMIT** [GB19 p.38]. Both pages state "more than 23 pending operations"; GB19 p.37 says SYNTAX for >23 ops or >8 values, and p.38 says MEMORY LIMIT for >23 pending operations. Use SYNTAX for the 8-pending-values case. Which message fires for >23 operations is **[unverified]**.
- **MathPrint nesting limit**: "up to four levels of consecutive nested functions and expressions, which include fractions, square roots, exponents with ^, ˣ√, eˣ, and 10ˣ" [GB19 p.1]. Exceeding it in K-constant mode gives MEMORY LIMIT [GB19 p.38].

### 1.3 EOS test cases already shown on TI screens

| Entry | Result | Source |
|---|---|---|
| `60+5*⁻12` | `0` | [screen GB19 p.9] |
| `1+⁻8+12` | `5` | [screen GB19 p.9] |
| `√(9+16)` | `5` | [screen GB19 p.9] |
| `4*(2+3)` | `20` | [screen GB19 p.9] |
| `4(2+3)` | `20` | [screen GB19 p.9] |
| `√(3^{2}+4^{2})` | `5` | [screen GB19 p.9] |
| `1+2*3` | `7` | [screen TG p.52] |
| `1+(2*3)` | `7` | [screen TG p.52] |
| `(1+2)*3` | `9` | [screen TG p.52] |
| `2^3^2` (Classic) | `64` | [screen GB19 p.8] |
| `2^{3^{2}}` (MathPrint) | `512` | [screen GB19 p.8] |
| `5^{2}+4^{(2+1)}` | `89` | [screen GB19 p.16] |

---

## 2. Numeric precision and result formatting

### 2.1 Internal precision: 13 significant digits [inferred, strong evidence]
- π: "π = 3.141592653590 for calculations. π = 3.141592654 for display." [GB19 p.17]. "Internally, pi is stored to 13 digits (3.141592653590)." [TG p.113]
- e: "e ≈ 2.718281828459" (13 digits) [GB19 p.23; TG p.109, A-3]. GB06 p.24 misprints it as "2.819291929".
- When the toggle key re-enters the previous answer, the history shows it with **13 significant digits**:
  - `0.7853981633975◄►` → `{π/4}` [screen GB19 p.21]. 0.7853981633975 is exactly 3.14159265359/4. It is not the true π/4 = 0.78539816339744…, which proves π is held to 13 digits.
  - `9.42477796077◄►` → `3π` [screen TG p.114]. This is 3 × 3.14159265359.
  - `39.43972222221▸DMS` [screen GB19 p.19]. 12°31′45″ + 26°54′38″ = 39.4397222… The last digit `1` (not `2` or `3`) suggests the intermediate quotients 31/60 and 38/3600 were **truncated** to 13 significant digits: 12.52916666666 + 26.91055555555 = 39.43972222221. [inferred: intermediates truncate rather than round at 13 digits. **[unverified]**, based on one data point.]
- "Numeric notation modes affect only the display of results, and not the accuracy of the values stored in the unit, which remain maximal." [GB19 p.3]. "The decimal setting does not affect the internal precision of results." [TG p.65]

### 2.2 FLOAT display: 10 digits [GB19 p.3]
> "FLOAT (floating decimal point) displays up to 10 digits, plus the sign and decimal."

Rules confirmed by every FLOAT screenshot I recomputed in double precision (about 50 values; all match) [inferred]:
1. **At most 10 digit positions in total, and the leading `0` of a number below 1 counts as one of them.**
   - `tan⁻¹(1)` in RAD → `0.785398163` (nine decimals), not 0.7853981634.
   - `rand` → `0.000093165` (only 5 significant digits survive) [screen GB19 p.30].
   - `tanh(2)` → `0.96402758`, which is 0.964027580 with the zero stripped [screen TG p.132].
2. **Round half up to that many places, then strip trailing zeros and any trailing decimal point.** `sinh(5)+2` → `76.20321058`; `ln(5)*2` → `3.218875825`; `Ans÷3` with Ans = 257 → `85.66666667`.
3. **Switch to scientific notation when the value needs more than 10 digits.** "Results requiring more than 10 digits are automatically displayed in scientific notation." [TG p.55]
   - For large values this means |x| ≥ 10¹⁰ shows as `m*10ⁿ` [inferred].
   - For small values, the screenshots show that FLOAT keeps the fixed 10-digit window and gives up significant digits (`0.000093165`). The switch therefore happens only when no significant digit would remain, i.e. |x| < 1×10⁻⁹ (strictly, below 0.0000000005 after rounding) [inferred; **exact threshold [unverified]**].
   - TG p.3 activity: in NORM, `3×10⁻⁸` shows as `0.00000003` and `6.2×10⁻⁶` as `0.0000062`, which is consistent.
4. When a sci result is shown in FLOAT, the mantissa uses the remaining significant digits with trailing zeros stripped (`1.2345*10⁴`, `5*10⁻³`, `2*10⁵`) [screens GB19 p.3, p.16; GB06 p.16]. The maximum mantissa length is **[unverified]**; 10 significant digits is the natural assumption.
5. Exponent display:
   - MathPrint: `*10` followed by a superscript exponent; negative exponents use `⁻`, as in `5*10⁻³`.
   - Classic: `*10^4` inline [screen GB19 p.3].
   - Restricted contexts (function table, data editor, `[2nd] [recall]` menu) use `E`/`ᴇ` instead: "2×10³ appears as 2E3" [GB19 p.3; TG p.79]; recall menu `x=196ᴇ3`, `z=0ᴇ0` [screen GB19 p.11].
6. Negative results use the `⁻` glyph: `⁻2`, `⁻1`, `⁻27` [screens GB19 p.14, TG p.120, GB19 p.36].
7. **StatVars menu values** use an 11-character field, rounded to fit, and **trailing zeros are kept**:
   - `D:a=0.677325190` (true value 0.67732518955…), `E↓b=⁻18.6663732`, `F↑r=0.963411717`, `3↓Sx=19.89137166`, `2:x̄=11.33333333` [screens GB19 p.27–28].
   - On the home screen the same `a` is quoted as `0.67732519` [GB19 p.28 text].
   - [inferred: menu items render the value in at most 11 characters; whether that is "10 significant digits" or "width-limited" cannot be separated from these samples.]

### 2.3 FIX n (decimal setting 0–9) [GB19 p.3; TG p.65]
- "0123456789 (fixed decimal point) specifies the number of digits (0 through 9) to display to the right of the decimal." The FIX indicator shows.
- "The TI-30XS MultiView calculator automatically rounds the result to the number of decimal places selected. For example, when the decimal is set to 2 places, 0.147 becomes 0.15 … also rounds or pads resulting values with trailing zeros … when the decimal is set to 5 places, 0.147 becomes 0.14700." [TG p.65]
- Rounding is decimal **round-half-up**: `12.345` → FIX 2 `12.35`, FIX 1 `12.3` [screen TG p.66].
- "The decimal mode setting affects most decimal results and the mantissa of scientific and engineering notation results." [TG p.65]
- **Exact results are not affected by FIX** (MathPrint):
  - FIX 2: `2π` → `2π`, and toggling gives `6.28` [screen GB19 p.4].
  - FIX 1: `√(3²+7²)` → `√58`, and toggling gives `7.6` [screen GB19 p.22].
  - FIX 2: `sin(30)` → `{1/2}` [screen GB19 p.19].
  - FIX 0: `16π◄►` → `50`; `√3◄►` → `2` [screens TG p.103, p.115].
- In Classic, FIX 2 gives `2π` → `6.28` (Classic does not keep π exact) [screen GB19 p.4].
- `[mode] [▼] [▼] [enter]` returns to FLOAT [TG p.65]. Reset restores FLOAT [TG p.65].

### 2.4 SCI and ENG [GB19 p.3; TG p.34, p.55]
- SCI: "one digit to the left of the decimal and the appropriate power of 10", 1 ≤ m < 10.
- ENG: "a number from 1 to 999 times 10 to an integer power. The integer power is always a multiple of 3." TG p.34 and p.55 say "1 to 1000 (1 ≤ n < 1000)".
- Examples:
  - SCI: `12345` → `1.2345*10⁴`.
  - ENG: `350*560→x` → `196*10³`; `340*610→y` → `207.4*10³`; `150*196000` → `29.4*10⁶`; `12543` → `12.543*10³` [screens GB19 p.11–12, TG p.56].
- "Numeric notation modes affect only the display of results" [GB19 p.3]. **Integers in SCI**: `2*10⁵` in SCI shows `2*10⁵` [screen GB06 p.16].
- **Zero in ENG** is shown as `0ᴇ0` in the recall menu [screen GB19 p.11]. The home-screen form for 0 in SCI/ENG is **[unverified]** (probably `0`).

### 2.5 Range, overflow and underflow
- The **OVERFLOW** message means "You attempted to enter, or you have calculated, a number that is beyond the range of the calculator." [GB19 p.37]
- GB06 p.41 and TG C-1 define OVERFLOW more narrowly: "|θ| ≥ 1ᴇ10, where θ is an angle in a trig, hyperbolic, or R▸Pr( function." So a trig argument ≥ 10¹⁰ in magnitude is an OVERFLOW error, not DOMAIN.
- The numeric range is **[unverified]**. The TI scientific-calculator norm is ±9.999999999×10⁹⁹ maximum, with results smaller than 1×10⁻⁹⁹ in magnitude underflowing to 0; the two-digit exponent fits the display. Treat 10¹⁰⁰ as the overflow threshold until tested.
- Factorial limit 69 (69! ≈ 1.711×10⁹⁸, 70! ≈ 1.198×10¹⁰⁰ > 10¹⁰⁰) supports the 10¹⁰⁰ ceiling [inferred].

### 2.6 Input limits
- Entry line: up to **80 characters** [KB 15401].
- K constant: "up to 44 characters" [GB19 p.35]; the error page says 47 for constant entries and 80 for stat entries [GB19 p.37].
- Lists: 3 lists × 42 items [GB19 p.32].
- The number of digits per typed number is not documented **[unverified]**.

---

## 3. Fractions and exact answers

### 3.1 Entry rules [GB19 p.13; TG p.59–60]
- `[n/d]`:
  - Pressing it **after** a number makes that number the numerator.
  - Pressing it **before** a number opens an empty template (MathPrint), whose numerator and denominator can hold operators and most functions.
  - In MathPrint, `[▼]` moves from numerator to denominator and `[►]` exits the template.
  - In Classic, `[n/d]` separates the numerator from the denominator, and "fractions with [n/d] do not allow operation keys, functions, or complex fractions in the numerator or denominator".
  - In Classic, the data editor and the table, use `[÷]` for complex division.
- Variables (x y z t a b c) are allowed in a MathPrint fraction but not in Classic [TG p.59].
- `[2nd] [U n/d]` enters a mixed number: "Press [2nd] [U n/d] between the entry of the unit and the numerator."
  - "The unit must be an integer. The numerator and denominator can contain decimals." [TG p.59]
  - "In MathPrint mode, pressing [2nd][U n/d] before entering an integer displays a fraction template, and allows only one digit to be entered for the unit." [TG p.59]
- Pasting history into a fraction:
  - Denominator: cursor in the denominator, `[2nd] [▲]` to the entry, `[enter]`.
  - Numerator or unit: `[▲]` or `[2nd] [▲]`, then `[enter]` [GB19 p.13].
- Table functions allow only one level of fractions [GB19 p.33].

### 3.2 Results [GB19 p.13; TG p.60]
- "The TI-30XS MultiView™ calculator defaults output to improper fractions. Results are automatically simplified." "Fractional results and entries are automatically simplified to their lowest terms."
- "Calculations using fractions can display fraction or decimal results, depending on input."
  - Any decimal in the input forces a decimal result: `{(1.2+1.3)/4}` → `0.625` [screen GB19 p.14]. This is AUTO-like behaviour; the TI-30XS has no AUTO/DEC answer-mode setting in its mode screen [GB19 p.2–3].
  - A table setting or function containing a decimal forces decimal y-values [TG p.97].
  - In ask-x, an x typed as `2π` displays `2π`, while `2.0π` displays as decimal [TG p.97].
- Integer powers with negative exponents give fractions: `10⁻²` → `{1/100}`; `2⁻¹` → `{1/2}`; `10⁻¹` → `{1/10}`; `5⁻¹` → `{1/5}`; `(16/3)⁻¹` → `{3/16}` [screens GB19 p.16–17; TG p.107].
- Classic mode also gives fraction results: `1/8` → `1/8`; `3/4+1␣7/12` → `7/3` [screens GB19 p.3, p.13].
- Mixed numbers appear only after an explicit conversion (`▸n/d◄►Un/d`): `9/2▸n/d◄►Un/d` → `4␣1/2` (Classic) or `4{1/2}` (MathPrint) [screen GB19 p.14].
- Fractions in the data editor are shown as fractions (`1/2`, `3/4`); `4/4` is shown as `1`. "Numeric notation, decimal notation, and angle modes affect the display of an element (except fractional elements)." [GB19 p.32]
- **Size limits for fraction results**: TI material does not document them. **[unverified]**
  - The largest denominator a TI screen shows: `12.167◄►` → `{12167/1000}` [screen TG p.104], so a denominator of 1000 (numerator 12167) is supported.
  - The sister TI-30X IIS (a different model) documents "numerator up to 6 digits, denominator through 1000" [KB 15400].
  - Recommendation: keep a fraction if the reduced denominator is ≤ 1000 and the numerator magnitude is < 10⁶ (or fits the 16-char line); otherwise show the decimal. Mark this in code as a hypothesis to test on hardware.

### 3.3 Conversions
- `[2nd] [f◄►d]` (displays `▸F◄►D`) "converts a fraction to its decimal equivalent or changes a decimal to its fractional equivalent, if possible" [TG p.59].
  - `4␣1/2▸F◄►D` → `4.5`; `5{3/4}▸F◄►D` → `5.75`; `2.25▸F◄►D` → `{9/4}` [screens GB19 p.14, TG p.63].
- `[2nd] [n/d◄►U n/d]` (displays `▸n/d◄►Un/d`) converts between simple fraction and mixed form: `{57/8}▸n/d◄►Un/d` → `7{1/8}` [screen TG p.62].
- Both conversions are 10th-level operators. In the data editor a formula can apply one: `L2=L1▸F◄►D` [screen GB19 p.32].

### 3.4 The answer-toggle key `[◄►]` [GB19 p.7; TG p.29–30]
> "Press the [◄►] key to toggle the display result between fraction and decimal answers, exact square root and decimal, and exact pi and decimal."

The behaviour seen on screens:
1. **After a result**, pressing `[◄►]` adds a **new history line**. Its entry is the previous answer followed by the small `◄►` marker; its result is the alternate form.
   - Exact results are re-entered exactly: `√8 → 2√2`, then `2√2◄►` → `2.828427125` [screen GB19 p.7].
   - Decimal results are re-entered with 13 significant digits: `0.7853981633975◄►` → `{π/4}` [screen GB19 p.21].
   - Pressing it again toggles back: `{π/4}◄►` → `0.785398163` [screen GB19 p.21].
2. **During an entry**: "[◄►] can be used in an entry before pressing [enter]." The entry is then evaluated straight to the alternate form. `{2×10³/4×10⁵}◄►` gives `5×10⁻³` (SCI mode); without the toggle the result would be the fraction 1/200 [screen GB19 p.16; inferred].
3. "Pressing [◄►] more than once in a current entry may result in a Syntax error." [TG p.30]
4. Directions observed:
   - fraction → decimal: `1/8◄►` → `0.125`.
   - decimal → fraction: `2.25◄►` → `{9/4}`; `12.167◄►` → `{12167/1000}`.
   - radical → decimal: `√3◄►` → `1.732050808`.
   - π form → decimal: `2π◄►` → `6.283185307`; `144π◄►` → `452.3893421`.
   - decimal → π form: `0.785398163…` → `{π/4}`; `9.424777961…` → `3π`.
   - exact radical-fraction → decimal: `{5√2/2}◄►` → `3.535533906`.
   - Sources: screens GB19 p.3, 7, 17, 21; TG p.63, 103–104, 114.
5. `[clear] [enter]` re-executes the last history entry, toggle marker included. Changing FIX and re-running `√3◄►` gives `2` [screen TG p.103].
6. When the toggle cannot produce a fraction or exact form, the result is **[unverified]**: probably it shows the same value again.

### 3.5 Exact square roots and π: the hypothesis is wrong
**The caller's hypothesis ("the TI-30XS shows fractions but NOT exact radicals or π; the TI-36X Pro does exact forms") does not hold for the TI-30XS MultiView as documented since the GB06 edition.** In MathPrint mode, every TI source shows exact radicals and π multiples:

| Entry (MathPrint) | Result | Source |
|---|---|---|
| `√8` | `2√2` | [screen GB19 p.7; TG p.39] |
| `√2` | `√2` | [screen GB19 p.4] |
| `√3` | `√3` | [screen TG p.103] |
| `√(5²−4(1)(3))` | `√13` | [screen TG p.53] |
| `√(3²+7²)` | `√58` | [screen GB19 p.22] |
| `5*cos({π/4})` (RAD) | `{5√2/2}` | [screen GB19 p.21] |
| `2*π` | `2π` | [screen GB19 p.17] |
| `π*12^{2}` | `144π` | [screen GB19 p.17] |
| `π*4^{2}` | `16π` | [screen TG p.115] |
| `tan⁻¹(1)`, toggled (RAD) | `{π/4}` | [screen GB19 p.21] |
| `sin(30°)` (RAD) | `{1/2}` | [screen GB19 p.18] |
| `5*cos(60)` (DEG) | `{5/2}` | [screen GB19 p.21] |

- TG p.123: "In MathPrint mode and the corresponding mode setting of DEG or RAD, evaluating trigonometric functions at multiples of 15 degree or pi/12 increments yields exact radical output in many cases."
- TG p.113: "In MathPrint mode, include a decimal number inside the expression with pi to receive a decimal output. For example, if you enter 2π, the TI-30XS MultiView calculator displays 2π. If you enter 2.0π, the calculator displays the decimal version." `2*π*1.5` → `9.424777961` [screen TG p.114].
- **Classic mode does not keep exact √ or π**: `√(2)` → `1.414213562`; `√(5²−4(1)(3)` → `3.605551275`; FIX 2 `2π` → `6.28` [screens GB19 p.4, TG p.53]. Classic does keep fractions.
- The exact-form grammar is **[unverified]**. Observed forms are:
  - integer or rational `{n/d}`;
  - `a√b` and `{a√b/c}`, with b square-free;
  - `aπ` and `{aπ/b}`;
  - `√b` alone.

  Sums such as `{(⁻5+√13)/2}` were never shown. The `{(⁻5+√(5²−4(1)(6)))/(2(1))}` example simplifies to the integer `⁻2` [screen GB19 p.14]. Mixed radical and π forms (`π√2`) are also unknown. For the MVP, support `±{p√q/r}` and `±{pπ/r}`, and fall back to decimal otherwise.

---

## 4. Functions, syntax and domains

The display form is the token that appears in the entry line. "Needs `)`" functions are 2nd-level prefix functions that open a parenthesis; `[enter]` closes it.

| Function | Key | Displayed as | Domain / error | Source |
|---|---|---|---|---|
| Common log | `[log]` | `log(` | x ≤ 0 → DOMAIN | GB19 p.23, 37 |
| Natural log | `[ln]` | `ln(` | x ≤ 0 → DOMAIN | GB19 p.23, 37 |
| 10ˣ | `[2nd] [10^x]` | MathPrint `10^{…}` (exponent template; `[►]` exits); Classic `10^(` [unverified] | via yˣ rules | GB19 p.23 |
| eˣ | `[2nd] [e^x]` | MathPrint `e^{…}`; Classic `e^(` [unverified] | overflow | GB19 p.23 |
| sin/cos/tan | `[sin] [cos] [tan]` | `sin(` `cos(` `tan(` | tan at 90°, ⁻90°, 270°… (and radian equivalents) → DOMAIN; \|θ\| ≥ 10¹⁰ → OVERFLOW | GB19 p.37; GB06 p.41 |
| sin⁻¹/cos⁻¹/tan⁻¹ | `[2nd] [sin⁻¹]` etc. | `sin⁻¹(` | sin⁻¹ and cos⁻¹: \|x\| > 1 → DOMAIN. Ranges not documented [unverified]: standard principal values in the current angle mode | GB19 p.37 |
| Hyperbolic | `[2nd] [hyp]`, then a trig key | `sinh(` `cosh(` `tanh(` `sinh⁻¹(` `cosh⁻¹(` `tanh⁻¹(` | angle mode ignored. cosh⁻¹ x<1 and tanh⁻¹ \|x\|≥1 → DOMAIN [unverified] | GB19 p.22–23; TG p.131 |
| Square | `[x²]` | `²` superscript (Classic shows a small raised `²` too) | | GB19 p.16 |
| Reciprocal | `[x⁻¹]` | `⁻¹` superscript | 0 → DIVIDE BY 0 [inferred] | GB19 p.16 |
| Power | `[^]` | MathPrint raised template; Classic `^` | yˣ: y = 0 and x = 0, or y < 0 and x not an integer → DOMAIN. "If you insert an expression as the exponent, you must place it between parentheses" (Classic wording) | GB19 p.16, 37 |
| Square root | `[2nd] [√]` | MathPrint `√` with bar; Classic `√(` | x < 0 → DOMAIN | GB19 p.16, 37 |
| nth root | `[2nd] [x√]` (index typed **before**: `3 [2nd] [x√] 64`) | MathPrint `³√(64)`; Classic `3ˣ√64` | x = 0, or y < 0 and x not an odd integer → DOMAIN | GB19 p.16, 37 |
| ×10ⁿ | `[×10ⁿ]` | `*10^{n}` / `×10^{n}`; Classic `*10^` [unverified] | literal ×10^; obeys EOS (§1.2) | GB19 p.15; KB 20469 |
| π | `[π]` | `π` | value 3.141592653590 internally | GB19 p.17 |
| Percent | `[2nd] [%]` after a value | `%` (postfix ÷100) | — | GB19 p.14–15 |
| To percent | `[2nd] [▸%]` after a value | `▸%`; result shown as e.g. `20%` | 10th-level conversion | GB19 p.14–15 |
| Factorial | `[prb] 3` | `!` postfix | x not an integer 0…69 → DOMAIN | GB19 p.29, 37 |
| Permutations | `[prb] 1` | ` nPr ` (spaces around) | n or r not an integer ≥ 0 → DOMAIN; r > n [unverified] (probably 0 or DOMAIN) | GB19 p.29, 37 |
| Combinations | `[prb] 2` | ` nCr ` | same as nPr | GB19 p.29, 37 |
| rand | `[prb] [►] 1` | `rand` | 0 < rand < 1 | GB19 p.29 |
| randint | `[prb] [►] 2` | `randint(A,B)` | integers A ≤ result ≤ B. A > B or non-integers → [unverified] | GB19 p.29 |
| DMS markers | `[2nd] [angle]` 1/2/3 | `°` `'` `"` | | GB19 p.5, 18 |
| Radian / gradian marker | `[2nd] [angle]` 4/5 | `ʳ` `ᵍ` | | GB19 p.5, 18 |
| To DMS | `[2nd] [angle]` 6 | `▸DMS` | 10th-level conversion | GB19 p.5, 18 |
| Polar↔rect | `[2nd] [angle] [►]` 1–4 | `R▸Pr(` `R▸Pθ(` `P▸Rx(` `P▸Ry(` | `[2nd] [,]` separates the arguments; θ uses the current angle mode | GB19 p.5, 20 |

### 4.1 Angle modes and modifiers [GB19 p.18; TG p.117]
- DEG (default), RAD, GRAD. "Entries are interpreted and results displayed according to the angle mode setting without needing to enter an angle unit modifier."
- "If you specify an angle unit modifier from the Angle menu, the calculation is performed in that angle type, but the result will be given in the angle mode setting." [TG p.117]
- Modifiers are postfix (4th level):
  - DEG: `2πʳ` → `360` [screen GB19 p.18]. `cos(πʳ)` → `⁻1`; `cos(200ᵍ)` → `⁻1` [screen TG p.120].
  - RAD: `sin(30°)` → `{1/2}` [screen GB19 p.18].
- **DMS arithmetic**:
  - `12°31'45"+26°54'38"` → `39.44` (FIX 2), i.e. decimal degrees [screen GB19 p.19].
  - `45°30'+36°15'` → `81.75` [screen TG p.118].
- **▸DMS output format**: `D°M'S"` with integer seconds shown even when zero: `1.5▸DMS` → `1°30'0"`; `98.25▸DMS` → `98°15'0"`; `39.55°▸DMS` → `39°33'0"`; `116.20°▸DMS` → `116°12'0"` [screens GB19 p.18, TG p.118–119].
  - Rounding or format of fractional seconds is **[unverified]**: no TI example has non-integer seconds.
- **Quirk: an empty entry followed by ▸DMS inserts the Ans value, not the word "Ans".**
  - `[2nd] [angle] 6 [enter]` on an empty line produced the entry `39.43972222221▸DMS` [screen GB19 p.19] and `98.25▸DMS` [screen TG p.118].
  - By contrast, pressing a binary operator first inserts the token `Ans` (`Ans*3`, `Ans÷4`).
  - [inferred from two screenshots]

### 4.2 Polar and rectangular [GB19 p.20; TG p.121–122]
- `P▸Rx(r,θ)` = r·cos θ; `P▸Ry(r,θ)` = r·sin θ; `R▸Pr(x,y)` = √(x²+y²); `R▸Pθ(x,y)` = angle of (x, y) in the current mode.
- Examples:
  - `P▸Rx(5,30)` → `4.3`, `P▸Ry(5,30)` → `2.5`, `R▸Pr(3,4)` → `5.0`, `R▸Pθ(3,4)` → `53.1` (FIX 1).
  - `P▸Rx(7,30)` → `6.062177826`, `P▸Ry(7,30)` → `3.5`.
- The range of R▸Pθ (−180, 180] is **[unverified]**; the atan2 convention is assumed.

### 4.3 Percent [GB19 p.14–15; TG p.45]
- "To perform a calculation involving a percentage, press [2nd] [%] after entering the value of the percentage." `2%*150` → `3`; `15%*80` → `12`; `Ans+2.3%*7300` → `317.9`.
- "To express a value as a percentage, press [2nd] [▸%] after the value." `{1/5}▸%` → `20%`.
- "Results of percent calculations display according to the decimal notation mode setting." [TG p.45]

### 4.4 Constant K [GB19 p.35–36; TG p.67–69]
- `[2nd] [K]` turns the Constant feature on and opens the editor `K=█`. Enter "any combination of numbers, operators, and/or values, up to 44 characters", then `[enter]`. The `K` indicator shows.
- After that, each `[enter]` "recalls the stored operation and applies it to the last answer or the current entry". The history shows the full expression, e.g. `4*2+3` → `11` with `K=*2+3`.
- TG p.67 procedure:
  - "Press [2nd] [K]. If a constant is already stored, press [clear] to clear it."
  - "Enter an initial value. If you do not enter a value, 0 is assumed, and Ans will appear in the display." [unclear wording; the empty-entry behaviour is **[unverified]**]
  - "Continue pressing [enter] to repeat the constant." Whether repeated [enter] presses chain on Ans is **[unverified]**; TG says "repeat".
- Toggle off: `[2nd] [K]` again. To redefine while K is on: `[2nd] [K]` (off), then `[2nd] [K]` (editor shows the previous K), `[clear]`, the new constant, `[enter]` [GB19 p.36].
- "Switching the mode between Classic and MathPrint clears calculator history and the Constant value." [TG p.35]
- K works with postfix-only constants: `K=²` turns `5` into `5²` → `25` [screen GB19 p.36].

### 4.5 Probability and the rand algorithm
- `n!`: "n must be a positive whole number ≤ 69" [GB19 p.29]. DOMAIN for "x is not an integer between 0 and 69" [GB19 p.37]. So 0! = 1 is allowed.
- Display: `8 nPr 3` → `336`; `52 nCr 5` → `2598960` (↵); `4!` → `24`.
- **rand**: "Generates a random real number between 0 and 1. To control a sequence of random numbers, store an integer (seed value) ≥ 0 to rand. The seed value changes randomly every time a random number is generated." [GB19 p.29]. Seeding: `5 [sto→] [prb] [►] 1 [enter]` displays `5→rand` → `5`.
- **The algorithm, recovered from TI screenshots [inferred, strong evidence]**: a single multiplicative LCG with L'Ecuyer's first component.

  ```
  state x (the seed; after "s→rand", x = s)
  rand:  x = (40014 * x) mod 2147483563 ;  return x / 2147483563
  ```

  Evidence:
  - seed 5: first rand = 200070/2147483563 = 0.0000931648… → screen `0.000093165` [GB19 p.30];
  - seed 1: first = 40014/2147483563 = 0.00001863297 → `0.000018633`; second = 1601120196/2147483563 = 0.7455797211 → `0.745579721` [TG p.94];
  - the "results will vary" pair `0.390926039` → `0.514541293` [TG p.93] is an exact consecutive pair of the same generator (state 839507244 → …; it back-solves to a seed of 665000). The chance of matching 2 of 9 digits by accident is about 10⁻⁹.

  It is **not** the TI-84 combined generator: that gives 0.7455607724 for the second value.
- **randint(A,B)** = A + ⌊u·(B−A+1)⌋, where u is the next rand draw [inferred]. Evidence: seed 5, rand, then `randint(3,5)` → `5`, since u₂ = 0.7279 gives 3 + ⌊2.18⌋ = 5 [screen GB19 p.30]. This is a single data point, also consistent with other monotone maps, so the formula is **[unverified]**.
- The default seed after reset and the handling of seed 0 (which would lock an MLCG at 0) are **[unverified]**. Suggestion: treat 0 like the TI-8x family's 12345 seed, and document it as a guess.

---

## 5. Statistics

### 5.1 Data editor and lists [GB19 p.32; TG p.79]
- `[data]` opens the editor with three lists, `L1 L2 L3`. "Each list can contain up to 42 items."
  - `[2nd] [▲]` jumps to the top of a list and `[2nd] [▼]` to the bottom (first blank).
  - Column headers are boxed digits; the bottom line shows the editing cell, e.g. `L1(5)=`.
  - Empty cells below the data show as `------`.
  - Elements show in a small font; fractions stay as fractions; scientific notation shows as `2E3`.
- `[data]` pressed again opens tabs `CLEAR` / `FORMULA`:
  - CLEAR: `1: Clear L1`, `2: Clear L2`, `3: Clear L3`, `4: Clear ALL`.
  - FORMULA: `1: Add/Edit Frmla`, `2: Clear L1 Frmla`, `3: Clear L2 Frmla`, `4: Clear L3 Frmla`, `5: Clear ALL`.
  - [GB19 p.5]
- **List formulas**:
  - Add/Edit Frmla prompts `◆L2=` (◆ is the formula marker).
  - `[data]` inside the formula editor opens menu `Ls`: `1: L1 2: L2 3: L3`.
  - "List formulas accept all calculator functions."
  - "If a formula is entered to a list, the formula list automatically updates if a referenced list element is updated." [TG p.79]
  - "Pressing [enter] in a formula list automatically deletes the formula. No message is displayed. When a formula is deleted, the data remains for use." [TG p.79]
  - A formula-generated list's label (`L2(1)=`) is shown highlighted.
  - FORMULA error: the formula has no list name, or references its own list. DIM MISMATCH: lists of unequal length [GB19 p.37].
  - Example: `◆L2=9/5×L1+32` on L1 = {8, ⁻1, 4} gives L2 = {46.4, 30.2, 39.2}. Adding `21` to L1 appends `69.8` [screens GB19 p.33].

### 5.2 STATS menu and setup screens [GB19 p.5, 23–28]
- `[2nd] [stat]` opens `STATS`: `1:1-Var Stats`, `2:2-Var Stats`, and `3:StatVars` (present only after a calculation, and gone again once the data is edited [TG p.83: "You must then recalculate 1-var or 2-var stats to display the StatVars option"]).
- 1-Var setup screen (4 lines) [screen GB19 p.25]:
  ```
  1-VAR STATS
  DATA: L1 L2 L3
  FRQ: ONE L1 L2 L3
              CALC
  ```
- 2-Var setup screen [screen GB19 p.26]:
  ```
  2-VAR STATS
  xDATA: L1 L2 L3
  yDATA: L1 L2 L3
              CALC
  ```
  2-Var has **no frequency list**.
- Results menu title: `1-Var:L1,One`, `1-Var:L1,L2` or `2-Var:L1,L2`, highlighted. Items are numbered `1`–`9`, then `A`, `B`, `C`… The separator is `:`, or `↑` / `↓` on the top and bottom visible rows when more items exist.

### 5.3 StatVars, in exact order
**1-Var (11 items, all verified on screen TG p.85)**:

| key | name as shown | example value (TG p.85 data) |
|---|---|---|
| 1 | `n` | `n=5` |
| 2 | `x̄` | `x̄=79.4` |
| 3 | `Sx` | `Sx=16.39512123` |
| 4 | `σx` | `σx=14.66424222` |
| 5 | `Σx` | `Σx=397` |
| 6 | `Σx²` | `Σx²=32597` |
| 7 | `minX` | `minX=53` |
| 8 | `Q1` | `Q1=77` |
| 9 | `Med` | `Med=85` |
| A | `Q3` | `Q3=85` |
| B | `maxX` | `maxX=97` |

**2-Var (21 items)**. Items 1–3 and C–I are verified on screens [GB19 p.26, 28]. Items 4–B and J–L are inferred: the guidebook reaches `G:x'` by pressing `[▲]` six times from item 1, so the list wraps after 21 items, and items 4–B follow the 1-Var pattern [inferred].

| key | name | status |
|---|---|---|
| 1 | `n` | screen |
| 2 | `x̄` | screen |
| 3 | `Sx` | screen |
| 4 | `σx` | inferred |
| 5 | `Σx` | inferred |
| 6 | `Σx²` | inferred |
| 7 | `ȳ` | inferred |
| 8 | `Sy` | inferred |
| 9 | `σy` | inferred |
| A | `Σy` | inferred |
| B | `Σy²` | inferred |
| C | `Σxy` | screen (`C↑Σxy=5234.15`) |
| D | `a` | screen (`D:a=0.677325190`) |
| E | `b` | screen (`E↓b=⁻18.6663732`) |
| F | `r` | screen (`F↑r=0.963411717`) |
| G | `x'` | screen (`G:x'`, no value: it pastes `x'(`) |
| H | `y'` | screen (`H↓y'`, pastes `y'(`) |
| I | `minX` | screen (`I↓minX=45`) |
| J | `maxX` | inferred |
| K | `minY` | inferred |
| L | `maxY` | inferred |

- **The only regression offered is linear `y' = a·x' + b`** ("least squares method to find the line of best fit, y'=ax'+b" [GB19 p.28]). There is no r² item, no other models, and no residuals.
- The definitions [GB19 p.24]:
  - a = slope, b = y-intercept, r = correlation coefficient;
  - `x'` "Uses a and b to calculate predicted x value when you input a y value": x'(y) = (y − b)/a;
  - `y'` "…predicted y value when you input an x value": y'(x) = a·x + b.
- **Selecting a StatVar pastes it into the home entry line**:
  - `[2nd] [stat] 3 2 [enter]` pastes `x̄` and evaluates it to `52.5`;
  - `x'` and `y'` paste `x'(` and `y'(`, and the user types the argument and `)`: `x'(45)` → `15`, `y'(55)` → `18.58651222`.
  - [screens GB19 p.25–29]

### 5.4 Frequencies [GB19 p.24; TG p.83]
- FRQ can be `ONE` (all weights 1) or a list.
- **Current firmware**: "Non-integer frequency elements are valid … However, the sample standard deviation, Sx, is undefined for non-integer frequencies, and Sx = Error is displayed for that value. All other statistics are displayed." [GB19 p.24]. Screen: `3↓Sx=Error` [GB19 p.27]. n is the **sum of the frequencies** (n=3 for weights 1, .5, 1, .5).
- **FRQ DOMAIN**: "FRQ value (in 1-Var stats) < 0 or > 99." [GB19 p.37]
- **Older firmware (GB06 p.40–41)**: "FRQ DOMAIN — … < 0 or > 99, *or not an integer*". Yet its screenshot computes `Sx=1.354006401` for the same weighted data [GB06 p.34], using n−1 = 2. **Implement the current behaviour (Sx=Error).**

### 5.5 Formulas, quartiles and edge cases
- Population SD: σx = √(Σf(x−x̄)²/n). Sample SD: Sx = √(Σf(x−x̄)²/(n−1)). Checked against all screenshots and KB 31772/12280.
- **DIVIDE BY 0 in statistics when n = 1** [GB19 p.37]. Probably this applies to Sx, and to a/r in 2-Var.
- **STAT error**: "calculate 1-var or 2-var stats with no defined data points, or … 2-var stats when the data lists are not of equal length." [GB19 p.37]
- **Quartiles**: GB19 p.24 defines "Q1 (1-Var): Median of the elements between MinX and Med (1st quartile). Q3: Median of the elements between Med and MaxX."
  - The one TI screenshot with quartiles [TG p.85] has data 53, 77, 85, 85, 97 (n = 5, odd) and shows **Q1 = 77, Q3 = 85**.
  - The TI-83/84 "exclude the median" rule would give 65 and 91, so **the TI-30XS does not use the TI-84 method.**
  - Two methods reproduce 77 and 85:
    - (a) **Tukey hinges**: when n is odd, the median belongs to both halves: Q1 = median{53,77,85} = 77, Q3 = median{85,85,97} = 85. This matches the wording "between MinX and Med" read inclusively.
    - (b) Nearest rank: Q1 = x₍⌈n/4⌉₎ and Q3 = x₍⌈3n/4⌉₎.
  - **Recommend (a)** [inferred]. Test it on hardware with L1 = {1,2,3,4,5,6,7}: (a) gives Q1 = 2.5, Q3 = 5.5; (b) gives 2 and 6; TI-84 gives 2 and 6. Also try {45,55,55,55}: (a) gives Q1 = 50; (b) gives 45.
- **Weighted median and quartiles with non-integer FRQ**: **[unverified]**.

---

## 6. Function table [GB19 p.33–35; TG p.97–100]
1. `[table]` shows `y=` followed by the last function. "The TI-30XS MultiView calculator retains the last entered function in memory when you quit the function table application." [TG p.97]
   - The function is written in x, using `[xyzt]` (only x is meaningful).
   - "Functions allow up to one level of fractions." [GB19 p.33]
   - Functions "can not contain [◄►] or the functions rand and randint". Invalid functions give **INVALID FUNCTION** [GB19 p.38; TG p.97].
   - Clearing a previous function: `[clear]` [TG p.100].
2. `[enter]` opens the setup screen:
   ```
   Start=0
   Step=1
   Auto  Ask-x
               OK
   ```
   - Defaults are Start=0, Step=1, Auto [screen GB19 p.34].
   - "To change a value on the table setup screen, press [clear] and then enter a new value." [TG p.97]
   - "Step … can be positive or negative, but cannot be zero." [GB19 p.34]
   - Select `Auto` or `Ask-x`, then `[▼]` to `OK` and `[enter]`.
3. The table screen has two columns headed `x` and `y`, with **3 data rows visible**. The bottom line echoes the selected x: `x=15`. The current row is highlighted in the x column. `[▼]` and `[▲]` scroll, and Auto generates more rows past the bottom [screens GB19 p.34, TG p.98–99].
4. **Ask-x**: empty rows. The user types x values and presses `[enter]`, and y is computed. "To clear the table in ask-x, press [delete] on each entry." [TG p.97]
5. **Formatting**:
   - y values follow the same exact/decimal rules: decimals in the function or the Step force decimal output [TG p.97].
   - x typed as `2π` displays `2π`; `2.0π` displays as a decimal; a fraction typed with `[n/d]` displays as a fraction [TG p.97].
   - TG prints the decimal form as `6.28319`, which suggests the table cells hold **6 significant characters** for decimals [inferred; **cell width [unverified]**].
   - Sci notation in the table uses `E` [GB19 p.3].
6. `[clear]` backs up screens; `[2nd] [quit]` exits [TG p.97].

---

## 7. Memory and variables [GB19 p.10–12; TG p.71–77]
- 7 variables: `x y z t a b c`. Each holds "a real number or an expression that results in a real number". The default after reset/clear is 0 (the Recall Var menu shows `y=0`, `z=0`).
- **Storing**:
  - `[sto→]` inserts `→`. If the entry is empty it first inserts `Ans`, giving `Ans→`.
  - `[xyzt]` (pressed repeatedly) picks the variable; `[enter]` stores it, and the stored value becomes the result: `15→x` → `15`.
- **`[xyzt]` in an expression inserts the variable name**, and the value is used at evaluation: `150*y` → `31.11*10⁶`.
- **`[2nd] [recall]`** shows `Recall Var` with items `1:x=15`, `2:y=0`, `3↓z=0`… (values in restricted E format, e.g. `x=196ᴇ3` in ENG).
  - Choosing an item **pastes the value, not the name**: `150*196000` was pasted from x [screen GB19 p.12].
  - In the TG "you spent" example, three recalls give `27.96+23.94+16.96` [screen TG p.77].
- **`[2nd] [clear var]`** shows `Clear Var`, `1:Yes`, `2:No`, and clears all seven variables.
- **Ans**:
  - "The most recently calculated result is stored to the variable Ans. Ans is retained in memory, even after the TI-30XS MultiView calculator is turned off."
  - `[2nd] [ans]` inserts `Ans`.
  - Starting an entry with an operator key inserts `Ans` before it (`Ans*3`, `Ans÷4`, `Ans+x`) [GB19 p.7; screens].
  - Screens show `Ans` capitalized. One GB19 screenshot shows `ans*3` in lowercase, but the GB06 screenshot of the same step shows `Ans*3`, so treat the lowercase as an artifact.
  - `√(Ans)` and `³√(Ans)` work [screens].
- **Reset**: `[2nd] [reset]` shows `Reset`, `1:No`, `2:Yes`. Choosing 2 shows `MEMORY CLEARED` (centred, line 2) [screen TG p.32]. `[on]`+`[clear]` together "resets the calculator immediately. No menu or message is displayed." [TG p.29]. GB06 p.43 says that on+clear "displays a MEM DELETED message" (older firmware).
  - Reset "returns settings to their defaults: degree (DEG) angle mode, normal numeric notation (NORM), floating decimal notation (FLOAT) and MathPrint display mode", and "clears memory variables, pending operations, entries in history, statistical data, constants, and Ans" [TG p.29; GB19 p.9–10].
- `[clear]` "does not affect the memory, statistical registers, angle units, or numeric notation" [TG p.41].
- **Empty `[enter]` repeats the last entry**: `[clear] [enter]` re-evaluates the previous history entry in the current modes. This is used throughout TG to re-show results after a mode change, e.g. `12543` again gives `1.2543*10⁴` in SCI [screens TG p.56, 66, 103, 110…]. [inferred from screens, consistent behaviour]

---

## 8. Errors and messages

### 8.1 Complete list, current firmware [GB19 p.37–38; GB25 p.37–38]
Message names exactly as printed:

| Message | Trigger (TI wording) |
|---|---|
| `ARGUMENT` | "A function does not have the correct number of arguments." |
| `DIVIDE BY 0` | "You attempted to divide by 0. In statistics, n = 1." |
| `DOMAIN` | "You specified an argument to a function outside the valid range. For example: For ˣ√y: x = 0 or y < 0 and x is not an odd integer. For yˣ: y and x = 0; y < 0 and x is not an integer. For √x: x < 0. For LOG or LN: x ≤ 0. For TAN: x = 90°, -90°, 270°, -270°, 450°, etc., and equivalent for radian mode. For SIN⁻¹ or COS⁻¹: \|x\| > 1. For nCr or nPr: n or r are not integers ≥ 0. For x!: x is not an integer between 0 and 69." |
| `EQUATION LENGTH ERROR` | "An entry exceeds the digit limits (80 for stat entries or 47 for constant entries); for example, combining an entry with a constant that exceeds the limit." |
| `FRQ DOMAIN` | "FRQ value (in 1-Var stats) < 0 or > 99." |
| `OVERFLOW` | "You attempted to enter, or you have calculated, a number that is beyond the range of the calculator." (GB06/TG: "\|θ\| ≥ 1ᴇ10, where θ is an angle in a trig, hyperbolic, or R▸Pr( function.") |
| `STAT` | "Attempting to calculate 1-var or 2-var stats with no defined data points, or attempting to calculate 2-var stats when the data lists are not of equal length." |
| `DIM MISMATCH` | "Attempting to create a formula when the lists are not of equal length." |
| `FORMULA` | "The formula does not contain a list name (L1, L2, or L3), or the formula for a list contains its own list name." |
| `SYNTAX` | "The command contains a syntax error: entering more than 23 pending operations or 8 pending values; or having misplaced functions, arguments, parentheses, or commas. If using [n/d], try using [÷]." TG C-2 adds "conversions, variables". |
| `INVALID FUNCTION` | "Invalid function entered in the function table." |
| `MEMORY LIMIT` | "The calculation contains too many pending operations (more than 23). If using the constant feature (K), you attempted to enter more than four levels of nested functions using fractions, square roots, exponents with ^, ˣ√, eˣ, and 10ˣ." (Not in GB06 or TG.) |
| `LOW BATTERY` | "Replace the battery. Note: This message displays briefly and then disappears. Pressing [clear] does not clear this message." |

Other messages and "error" displays:
- `MEMORY CLEARED`: after Reset → 2:Yes [TG p.29, 32; screen].
- `MEM DELETED`: older firmware, on [on]+[clear] [GB06 p.43]. Current TG says no message.
- `Sx=Error`: shown **inside** the StatVars menu for non-integer FRQ [GB19 p.24; screen p.27]. This is a value, not an error screen.

The messages the caller asked about but that **do not exist on the TI-30XS**, per all three TI documents: `CHANGE MODE`, `INVALID DIM`, `MEMORY` (only `MEMORY LIMIT` exists), and `INVALID` (only `INVALID FUNCTION` exists). These belong to the TI-36X Pro or TI-8x families.

### 8.2 Error screen behaviour
- "When the TI-30XS MultiView calculator detects an error, it returns an error message with the type of error … Press [clear] to clear the error message. The previous screen is displayed with the cursor at or near the error location. Correct the expression." [GB19 p.37]
- `[clear]` "Clears an error message." [GB19 p.9]
- **Layout [unverified]**: no TI document reproduces an error screen. Every TI source describes it as a message naming the error type, with no option menu. This differs from the TI-84's `1:Quit 2:Goto`. The only dismissal is `[clear]`, which returns to the entry with the cursor at the error.
  - Suggested rendering, consistent with the `MEMORY CLEARED` screen (centred, large font, line 2): the message name, e.g. `DIVIDE BY 0`, centred.
  - Whether the text reads `DOMAIN` or `DOMAIN ERROR` is **[unverified]**. The doc lists bare names, except "EQUATION LENGTH ERROR", whose name includes "ERROR". This suggests the screen shows the bare name.
- Suspected precedence: DOMAIN before OVERFLOW (e.g. tan(90°)). Not documented.

---

## 9. Firmware and edition differences to be aware of
| Topic | GB06 (older) | GB19/GB25/TG-2025 (current) | Recommendation |
|---|---|---|---|
| Non-integer FRQ | text: FRQ DOMAIN if not an integer; screen computes Sx=1.354006401 | valid; `Sx=Error` | current |
| OVERFLOW wording | trig/hyp/R▸Pr angle \|θ\| ≥ 1ᴇ10 | any out-of-range number | implement both conditions |
| MEMORY LIMIT | absent | present | current |
| Reset by on+clear | "MEM DELETED" message | no message | current |
| `Ans` capitalization | `Ans*3` | one screenshot `ans*3` | use `Ans` (TG-2025 screens all show `Ans`) |
| Mode screen | — | `DEG RAD GRAD` (some TG screenshots show `GRD`) | `GRAD` |
| Indicator `S` | — | an unexplained small `S` in the indicator row on 5 fraction screenshots (GB19 p.13–14) | screenshot artifact; do not reproduce [unverified] |
| Guidebook keystroke typos | GB06 p.19: `[sin] 30 [2nd][angle] 1` | GB19 p.18 prints `… [angle] 4 [)]`, but the screen shows `sin(30°)` | use `1` (°) |
| | GB06 p.20: `… [2nd][angle] 4 [)]` | GB19 p.20 omits `4`; the screen shows `ʳ` | include `4` (r) |

---

## 10. Worked examples: the golden corpus

The default state is DEG, NORM, FLOAT, MathPrint, cleared history [GB19 p.1: "Examples assume all default settings"], unless a row says otherwise. Each row is one evaluation. A letter suffix (a, b, c…) marks a later step that depends on the earlier state. Display notation follows §0.1:
- `R` means the result sits on the same line as the entry; `↵` means it sits on the next line.
- "Screen" means the text was read from TI's screenshot. "Text" means it comes only from TI prose.

Where the printed keystrokes contradict the screenshot, the **screenshot wins** and the correction is noted.

### 10.1 Guidebook GB19 (identical screens in GB25; GB06 differences noted)

#### Getting started, modes and history (GB19 p.2–8)
| ID | p. | Setup | Keystrokes | Entry as shown | Result as shown | Notes |
|---|---|---|---|---|---|---|
| GB-001 | 2 | default | `[2nd] [√] 25 [enter]` | `√25` | `5` | text only ("returns the result, 5") |
| GB-002 | 3 | **Classic**, SCI | `12345 [enter]` | `12345` | ↵ `1.2345*10^4` | screen; Classic shows `^` |
| GB-003 | 3 | MathPrint, SCI | `12345 [enter]` | `12345` | ↵ `1.2345*10⁴` | screen |
| GB-004a | 3 | Classic, FLOAT | `1 [n/d] 8 [enter]` | `1/8` | R `1/8` | screen |
| GB-004b | 3 | ↳ | `[◄►]` | `1/8◄►` | R `0.125` | screen; toggle adds a history line |
| GB-005a | 3 | MathPrint | `1 [n/d] 8 [enter]` | `{1/8}` | R `{1/8}` | screen |
| GB-005b | 3 | ↳ | `[◄►]` | `{1/8}◄►` | R `0.125` | screen |
| GB-006 | 4 | Classic, FIX 2 | `2 [π] [enter]` | `2π` | R `6.28` | screen; Classic gives a decimal π result |
| GB-007a | 4 | MathPrint, FIX 2 | `2 [π] [enter]` | `2π` | R `2π` | screen; exact form ignores FIX |
| GB-007b | 4 | ↳ | `[◄►]` | `2π◄►` | R `6.28` | screen |
| GB-008 | 4 | Classic | `4 [2nd][U n/d] 5 [n/d] 9 [enter]` | `4␣5/9` | R `41/9` | screen |
| GB-009 | 4 | MathPrint | `4 [2nd][U n/d] 5 [▼] 9 [enter]` | `4{5/9}` | R `{41/9}` | screen |
| GB-010 | 4 | Classic | `2 [^] 5 [enter]` | `2^5` | R `32` | screen |
| GB-011 | 4 | MathPrint | `2 [^] 5 [enter]` | `2^{5}` | R `32` | screen |
| GB-012 | 4 | Classic | `[2nd][√] 2 [enter]` | `√(2)` | ↵ `1.414213562` | screen; Classic shows `√(` with a parenthesis |
| GB-013a | 4 | MathPrint | `[2nd][√] 2 [enter]` | `√2` | R `√2` | screen; exact |
| GB-013b | 4 | ↳ | `[◄►]` | `√2◄►` | R `1.414213562` | screen |
| GB-014 | 4 | Classic | `3 [2nd][x√] 64 [enter]` | `3ˣ√64` | R `4` | screen |
| GB-015 | 4 | MathPrint | `3 [2nd][x√] 64 [enter]` | `³√(64)` | R `4` | screen |
| GB-016a | 6 | default | `1 [+] 1 [enter]` | `1+1` | R `2` | screen |
| GB-016b | 6 | ↳ | `2 [+] 2 [enter]` | `2+2` | R `4` | screen |
| GB-016c | 6 | ↳ | `3 [+] 3 [enter]` | `3+3` | R `6` | screen |
| GB-016d | 6 | ↳ | `4 [+] 4 [enter]` | `4+4` | R `8` | screen; all 4 lines in use |
| GB-016e | 6 | ↳ | `[▲] [▲] [▲] [▲] [enter]` | the entry line becomes `3+3█` (history shows 2+2/3+3/4+4 above) | — | screen. `[▲]` alternates answer, entry, answer, entry, so the 4th press reaches entry `3+3`, which `[enter]` pastes **[inferred]**; TG p.31 shows an answer (`15`) highlighted while scrolling |
| GB-016f | 7 | ↳ | `[+] 2 [enter]` | `3+3+2` | R `8` | screen |
| GB-017a | 7 | default | `[2nd][√] 8 [enter]` | `√8` | R `2√2` | screen |
| GB-017b | 7 | ↳ | `[◄►]` | `2√2◄►` | ↵ `2.828427125` | screen |
| GB-018a | 7 | default | `3 [×] 3 [enter]` | `3*3` | R `9` | screen |
| GB-018b | 7 | ↳ | `[×] 3 [enter]` | `Ans*3` | R `27` | screen (GB19 image shows `ans*3`; GB06 shows `Ans*3`) |
| GB-018c | 8 | ↳ | `3 [2nd][x√] [2nd][ans] [enter]` | `³√(Ans)` | R `3` | screen |
| GB-019 | 8 | Classic | `2 [^] 3 [^] 2 [enter]` | `2^3^2` | R `64` | screen; left to right |
| GB-020 | 8 | MathPrint | `2 [^] 3 [^] 2 [enter]` | `2^{3^{2}}` | R `512` | screen; right to left |

#### Order-of-operations examples (GB19 p.9)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-021 | 9 | `60 [+] 5 [×] [(−)] 12 [enter]` | `60+5*⁻12` | R `0` | screen |
| GB-022 | 9 | `1 [+] [(−)] 8 [+] 12 [enter]` | `1+⁻8+12` | R `5` | screen |
| GB-023 | 9 | `[2nd][√] 9 [+] 16 [enter]` | `√(9+16)` (bar over 9+16) | R `5` | screen. GB19 text prints "9 [+] 6"; GB06 and the screen show 16 |
| GB-024 | 9 | `4 [×] [(] 2 [+] 3 [)] [enter]` | `4*(2+3)` | R `20` | screen |
| GB-025 | 9 | `4 [(] 2 [+] 3 [)] [enter]` | `4(2+3)` | R `20` | screen; implied × |
| GB-026 | 9 | `[2nd][√] 3 [^] 2 [►] [+] 4 [^] 2 [enter]` | `√(3^{2}+4^{2})` | R `5` | screen; `[►]` exits the exponent |

#### Memory and stored variables (GB19 p.10–12)
| ID | p. | Setup | Keystrokes | Entry / screen | Result | Notes |
|---|---|---|---|---|---|---|
| GB-027 | 10 | default | `[2nd][clear var]` | menu `Clear Var` / `1:Yes` / `2:No` | — | screen; then `1` clears all |
| GB-028a | 10 | after 027 | `15 [sto→] [xyzt]` | `15→x` (pending) | — | screen |
| GB-028b | 10 | ↳ | `[enter]` | `15→x` | R `15` | screen |
| GB-029a | 10 | ↳ | `[2nd][recall]` | `Recall Var` / `1:x=15` / `2:y=0` / `3↓z=0` | — | screen |
| GB-029b | 11 | ↳ | `[enter] [x²] [enter]` | `15²` | R `225` | screen; recall pastes the **value** |
| GB-030a | 11 | ↳ | `[sto→] [xyzt] [xyzt]` | `Ans→y` (pending) | — | screen; `Ans` is auto-inserted |
| GB-030b | 11 | ↳ | `[enter]` | `Ans→y` | R `225` | screen |
| GB-031a | 11 | ↳ | `[xyzt] [xyzt]` | `y` (pending) | — | screen |
| GB-031b | 11 | ↳ | `[enter]` | `y` | R `225` | screen |
| GB-031c | 11 | ↳ | `[÷] 4 [enter]` | `Ans÷4` | R `56.25` | screen |
| GB-032a | 11 | → **ENG** | `[mode] [▼] [►] [►] [enter] [clear]`, then `350 [×] 560 [sto→] [xyzt] [enter]` | `350*560→x` | ↵ `196*10³` | screen; ENG indicator |
| GB-032b | 11 | ↳ | `340 [×] 610 [sto→] [xyzt] [xyzt] [enter]` | `340*610→y` | ↵ `207.4*10³` | screen |
| GB-032c | 11 | ↳ | `150 [×] [2nd][recall]` | `Recall Var` / `1:x=196ᴇ3` / `2:y=207.4ᴇ3` / `3↓z=0ᴇ0` | — | screen; E-format in the menu |
| GB-032d | 12 | ↳ | `[enter] [enter]` | `150*196000` | ↵ `29.4*10⁶` | screen; full value pasted |
| GB-032e | 12 | ↳ | `210 [×] [2nd][recall] [enter] [enter]` | `210*196000` | ↵ `41.16*10⁶` | screen |
| GB-032f | 12 | ↳ | `150 [×] [xyzt] [xyzt] [enter]` | `150*y` | R `31.11*10⁶` | screen |
| GB-032g | 12 | ↳ | `210 [×] [xyzt] [xyzt] [enter]` | `210*y` | ↵ `43.554*10⁶` | screen; text gives 29.4 M, 41.16 M, 31.11 M, 43.554 M m³ |

#### Fractions (GB19 p.13–14)
| ID | p. | Mode | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|---|
| GB-033 | 13 | Classic | `3 [n/d] 4 [+] 1 [2nd][U n/d] 7 [n/d] 12 [enter]` | `3/4+1␣7/12` | R `7/3` | screen (stray `S` indicator, see §9) |
| GB-034 | 14 | Classic | `9 [n/d] 2 [2nd][n/d◄►U n/d] [enter]` | `9/2▸n/d◄►Un/d` | R `4␣1/2` | screen |
| GB-035 | 14 | Classic | `4 [2nd][U n/d] 1 [n/d] 2 [2nd][f◄►d] [enter]` | `4␣1/2▸F◄►D` | R `4.5` | screen |
| GB-036 | 14 | MathPrint | `[n/d] 3 [▼] 4 [►] [+] 1 [2nd][U n/d] 7 [▼] 12 [enter]` | `{3/4}+1{7/12}` | R `{7/3}` | screen |
| GB-037 | 14 | MathPrint | `9 [n/d] 2 [►] [2nd][n/d◄►U n/d] [enter]` | `{9/2}▸n/d◄►Un/d` | R `4{1/2}` | screen |
| GB-038 | 14 | MathPrint | `4 [2nd][U n/d] 1 [▼] 2 [►] [2nd][f◄►d] [enter]` | `4{1/2}▸F◄►D` | R `4.5` | screen |
| GB-039 | 14 | MathPrint | `[n/d] 1.2 [+] 1.3 [▼] 4 [enter]` | `{1.2+1.3 / 4}` | R `0.625` | screen; a decimal input gives a decimal result |
| GB-040 | 14 | MathPrint | `[n/d] [(−)] 5 [+] [2nd][√] 5 [x²] [−] 4 [(] 1 [)] [(] 6 [)] [▼] 2 [(] 1 [)] [enter]` | `{⁻5+√(5²−4(1)(6)) / 2(1)}` | ↵ `⁻2` | screen; the 2-line fraction pushes the result down |

#### Percentages (GB19 p.14–15)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-041 | 15 | `2 [2nd][%] [×] 150 [enter]` | `2%*150` | R `3` | screen |
| GB-042 | 15 | `1 [n/d] 5 [►] [2nd][▸%] [enter]` | `{1/5}▸%` | R `20%` | screen |
| GB-043a | 15 | `3 [2nd][%] [×] 5000 [enter]` | `3%*5000` | R `150` | screen |
| GB-043b | 15 | `[+] 2.3 [2nd][%] [×] 7300 [enter]` | `Ans+2.3%*7300` | ↵ `317.9` | screen |
| GB-043c | 15 | `[×] 280 [enter]` | `Ans*280` | R `89012` | screen |

#### ×10ⁿ key (GB19 p.15–16; GB06 p.16)
| ID | p. | Setup | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|---|
| GB-044 | 15–16 | → SCI via `[mode] [▼] [►] [enter]` | `[n/d] 2 [×10ⁿ] 3 [▼] 4 [×10ⁿ] 5 [►] [►] [◄►] [enter]` | `{2×10³ / 4×10⁵}◄►` | R `5×10⁻³` | screen. Toggle pressed before `[enter]`; this screenshot renders × as a small ×. The mode screen shows SCI highlighted |
| GB-045 | 16 | SCI | `[clear] [(] 2 [×10ⁿ] 3 [►] [)] [÷] [(] 4 [×10ⁿ] 5 [►] [)] [enter]` | `(2*10³)÷(4*10⁵)` | ↵ `5*10⁻³` | screen. Parentheses are needed (KB 20469) |
| GB06-1a | GB06 16 | default | `2 [×10ⁿ] 5 [enter]` | `2*10⁵` | R `200000` | GB06 screen |
| GB06-1b | GB06 16 | → SCI, then `[clear] [enter]` | (re-runs the last entry) | `2*10⁵` | R `2*10⁵` | GB06 screen |

#### Powers, roots, inverses (GB19 p.16–17)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-046 | 16 | `5 [^] 2 [►] [+] 4 [^] [(] 2 [+] 1 [)] [enter]` | `5^{2}+4^{(2+1)}` | R `89` | screen |
| GB-047 | 16 | `10 [^] [(−)] 2 [enter]` | `10^{⁻2}` | R `{1/100}` | screen; fraction result |
| GB-048 | 16 | `[2nd][√] 49 [enter]` | `√49` | R `7` | screen |
| GB-049 | 16 | `[2nd][√] 3 [^] 2 [►] [+] 2 [^] 4 [enter]` | `√(3^{2}+2^{4})` | R `5` | screen |
| GB-050 | 17 | `6 [2nd][x√] 64 [enter]` | `⁶√(64)` | R `2` | screen |
| GB-051 | 17 | `2 [x⁻¹] [enter]` | `2⁻¹` | R `{1/2}` | screen |

#### Pi (GB19 p.17)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-052a | 17 | `2 [×] [π] [enter]` | `2*π` | R `2π` | screen |
| GB-052b | 17 | `[◄►]` | `2π◄►` | R `6.283185307` | screen |
| GB-053a | 17 | `[π] [×] 12 [^] 2 [enter]` | `π*12^{2}` | R `144π` | screen |
| GB-053b | 17 | `[◄►]` | `144π◄►` | ↵ `452.3893421` | screen |

#### Angle menu, DMS (GB19 p.18–20)
| ID | p. | Setup | Keystrokes | Entry / screen | Result | Notes |
|---|---|---|---|---|---|---|
| GB-054a | 18 | → RAD `[mode] [►] [enter]` | — | mode screen with RAD highlighted | — | screen |
| GB-054b | 18 | RAD | `[clear] [sin] 30 [2nd][angle]` | menu tabs `DMS  R◄►P`; `1:°` `2:'` `3↓"` | — | screen |
| GB-054c | 18 | RAD | `1 [)] [enter]` | `sin(30°)` | R `{1/2}` | screen. **GB19/GB25 print `4`; GB06 prints `1`; the screen shows `°`** |
| GB-055 | 18 | → DEG `[mode] [enter]` | `[clear] 2 [π] [2nd][angle] 4 [enter]` | `2πʳ` | R `360` | screen |
| GB-056 | 18 | DEG | `1.5 [2nd][angle] 6 [enter]` | `1.5▸DMS` | R `1°30'0"` | screen |
| GB-057a | 19 | → FIX 2 `[clear] [mode] [▼] [▼] [►] [►] [►] [enter]` | — | mode screen, `2` highlighted, FIX indicator | — | screen |
| GB-057b | 19 | FIX 2 | `[clear] 12 [2nd][angle] 1 31 [2nd][angle] 2 45 [2nd][angle] 3 [+] 26 [2nd][angle] 1 54 [2nd][angle] 2 38 [2nd][angle] 3 [enter]` | `12°31'45"+26°54▸` (line truncated with the scroll arrow) | ↵ `39.44` | screen |
| GB-057c | 19 | FIX 2 | `[2nd][angle] 6 [enter]` | `39.43972222221▸` (`▸DMS` cut off) | ↵ `39°26'23"` | screen. The **Ans value** (13 digits) is inserted instead of `Ans` |
| GB-058 | 19 | DEG (FIX indicator still shown) | `[clear] [sin] 30 [)] [enter]` | `sin(30)` | R `{1/2}` | screen |
| GB-059 | 19 | → RAD | `[mode] [►] [enter] [clear] [sin] [π] [n/d] 6 [►] [)] [enter]` | `sin({π/6})` | R `{1/2}` | screen |
| GB-060 | 19 | RAD | `[sin] 30 [2nd][angle] [enter] [)] [enter]` | `sin(30°)` | R `{1/2}` | screen. `[enter]` picks the highlighted `1:°` |
| GB-061 | 20 | → DEG | `[mode] [enter] [clear] [sin] [π] [n/d] 6 [►] [2nd][angle] 4 [)] [enter]` | `sin({π/6}ʳ)` | R `{1/2}` | screen. **GB19 omits the `4`; GB06 has it** |

#### Rectangular↔polar (GB19 p.20)
| ID | p. | Setup | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|---|
| GB-062a | 20 | → FIX 1 `[clear] [mode] [▼] [▼] [►] [►] [enter]` | `[clear] [2nd][angle] [►] 3 5 [2nd][,] 30 [)] [enter]` | `P▸Rx(5,30)` | R `4.3` | screen |
| GB-062b | 20 | FIX 1 | `[2nd][angle] [►] 4 5 [2nd][,] 30 [)] [enter]` | `P▸Ry(5,30)` | R `2.5` | screen |
| GB-063a | 20 | FIX 1 | `[2nd][angle] [►] 1 3 [2nd][,] 4 [)] [enter]` | `R▸Pr(3,4)` | R `5.0` | screen. FIX pads with a zero |
| GB-063b | 20 | FIX 1 | `[2nd][angle] [►] 2 3 [2nd][,] 4 [)] [enter]` | `R▸Pθ(3,4)` | R `53.1` | screen |

#### Trigonometry (GB19 p.21–22)
| ID | p. | Setup | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|---|
| GB-064 | 21 | → FLOAT `[mode] [▼] [▼] [enter] [clear]`, DEG | `[tan] 45 [)] [enter]` | `tan(45)` | R `1` | screen |
| GB-065 | 21 | DEG | `[2nd][tan⁻¹] 1 [)] [enter]` | `tan⁻¹(1)` | R `45` | screen |
| GB-066 | 21 | DEG | `5 [×] [cos] 60 [)] [enter]` | `5*cos(60)` | R `{5/2}` | screen |
| GB-067 | 21 | → RAD `[mode] [►] [enter] [clear]` | `[tan] [π] [n/d] 4 [►] [)] [enter]` | `tan({π/4})` | R `1` | screen (the image's indicator wrongly says DEG) |
| GB-068a | 21 | RAD | `[2nd][tan⁻¹] 1 [)] [enter]` | `tan⁻¹(1)` | ↵ `0.785398163` | screen |
| GB-068b | 21 | RAD | `[◄►]` | `0.7853981633975◄►` | ↵ `{π/4}` | screen; 13-digit Ans |
| GB-069a | 21 | RAD | `5 [×] [cos] [π] [n/d] 4 [►] [)] [enter]` | `5*cos({π/4})` | R `{5√2/2}` | screen |
| GB-069b | 21 | RAD | `[◄►]` | `{5√2/2}◄►` | ↵ `3.535533906` | screen |
| GB-070a | 22 | → FIX 1 `[mode] [▼] [▼] [►] [►] [enter]` | `[clear] [2nd][tan⁻¹] 7 [n/d] 3 [►] [)] [enter]` | `tan⁻¹({7/3})` | R `66.8` | screen |
| GB-070b | 22 | FIX 1 | `90 [−] [2nd][ans] [enter]` | `90−Ans` | R `23.2` | screen |
| GB-070c | 22 | FIX 1 | `[2nd][√] 3 [x²] [+] 7 [x²] [enter]` | `√(3²+7²)` | R `√58` | screen; exact despite FIX |
| GB-070d | 22 | FIX 1 | `[◄►]` | `√58◄►` | R `7.6` | screen |

#### Hyperbolics, logs and exponentials (GB19 p.23; GB06 p.24)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-071a | 23 | `[2nd][hyp] [sin] 5 [)] [+] 2 [enter]` | `sinh(5)+2` | ↵ `76.20321058` | screen; HYP indicator during entry |
| GB-071b | 23 | `[▲] [▲] [enter] [◄] [◄] [◄] [◄] [◄] [2nd][hyp] [2nd][sin⁻¹] [enter]` | `sinh⁻¹(5)+2` | ↵ `4.312438341` | screen; overwrite editing |
| GB-072 | 23 | `[log] 1 [)] [enter]` | `log(1)` | R `0` | screen |
| GB-073 | 23 | `[ln] 5 [)] [×] 2 [enter]` | `ln(5)*2` | ↵ `3.218875825` | screen |
| GB06-2 | GB06 24 | `[ln] 15 [)] [×] 2 [enter]` | `ln(15)*2` | ↵ `5.416100402` | GB06 screen (older edition used 15) |
| GB-074 | 23 | `[2nd][10^x] [log] 2 [)] [enter]` | `10^{log(2)}` | R `2` | screen |
| GB-075 | 23 | `[log] [2nd][10^x] 5 [►] [)] [enter]` | `log(10^{5})` | R `5` | screen |
| GB-076 | 23 | `[2nd][e^x] .5 [enter]` | `e^{.5}` | ↵ `1.648721271` | screen; the entry keeps `.5` as typed |

#### Statistics (GB19 p.24–29)
| ID | p. | Keystrokes | Screen | Notes |
|---|---|---|---|---|
| GB-077a | 25 | `[data] [data] [▼] [▼] [▼]` | tabs `CLEAR FORMULA`; `2↑Clear L2` / `3:Clear L3` / `4:Clear ALL` (4 highlighted) | screen |
| GB-077b | 25 | `[enter] 45 [▼] 55 [▼] 55 [▼] 55 [enter]` | editor: L1 shows `55 55 55` and a highlighted blank; bottom `L1(5)=` | screen |
| GB-077c | 25 | `[2nd][stat] 1` | `STATS` / `1:1-Var Stats` / `2:2-Var Stats`, then setup `1-VAR STATS` / `DATA: [L1] L2 L3` / `FRQ: [ONE] L1 L2 L3` / `CALC` | screen |
| GB-077d | 25 | `[▼] [▼] [enter]` | `1-Var:L1,One` / `1:n=4` / `2:x̄=52.5` / `3↓Sx=5` | screen |
| GB-077e | 25 | `2 [enter]` (choose x̄) | home: `x̄` → R `52.5` | screen |
| GB-077f | 25 | `[×] 2 [enter]` | `Ans*2` → R `105` | screen |
| GB-078a | 25 | `[data] [data] [▼] [▼] [▼] [enter]`, then `45 [▼] 55 [▼] [►] 30 [▼] 25 [▼]` | editor L1 `45 55 ------`, L2 `30 25` and a highlighted blank, `L2(3)=` | screen |
| GB-078b | 26 | `[2nd][stat] 2` | `STATS` menu now includes `3:StatVars`; setup `2-VAR STATS` / `xDATA: [L1] L2 L3` / `yDATA: L1 [L2] L3` / `CALC` | screen |
| GB-078c | 26 | `[▼] [▼] [enter] [2nd][quit] [2nd][stat] 3 [▲]×6` | `2-Var:L1,L2` / `G↑x'` / `H:y'` / `I↓minX=45` | screen; `[▲]` wraps from item 1 to the end |
| GB-078d | 26 | `[enter] 45 [)] [enter]` | `x'(45)` → R `15` | screen. a = ⁻0.5, b = 52.5 |
| GB-079a | 26–27 | `[data] [data] 4`, `[data] [►] 5`, `12 [▼] 13 [▼] 10 [▼] 11 [▼] [►] 1 [▼] .5 [▼] 1 [▼] .5 [▼]` | L1 shows `13 10 11`, L2 `0.5 1 0.5`, `L2(5)=` | screen; `.5` is shown as `0.5` |
| GB-079b | 27 | `[2nd][stat] 1 [▼] [►] [►] [enter]` | setup: `DATA: [L1]`, `FRQ: ONE L1 [L2] L3` | screen |
| GB-079c | 27 | `[enter]` | `1-Var:L1,L2` / `1:n=3` / `2:x̄=11.33333333` / `3↓Sx=Error` | screen (GB06 firmware showed `Sx=1.354006401`) |
| GB-079d | 27 | `[data] [▼] [▼] [▼] 15 [▼]` | L1 `13 10 15`, `L1(5)=` | screen; 11 is overwritten by 15 |
| GB-079e | 27 | `[2nd][stat] 1 [▼] [▼] [enter]` | `1-Var:L1,L2` / `1:n=3` / `2:x̄=12` / `3↓Sx=Error` | screen (GB06: `Sx=2.121320344`) |
| GB-080a | 28 | `[data] [data] 4`, `33 [▼] 49 [▼] 65 [▼] 79 [▼] [►] 5.3 [▼] 14.45 [▼] 20.21 [▼] 38.45 [▼]` | L1 `49 65 79`, L2 `14.45 20.21 38.45`, `L2(5)=` | screen |
| GB-080b | 28 | `[2nd][stat] 2 [▼] [▼] [enter]` | `2-Var:L1,L2` / `1:n=4` / `2:x̄=56.5` / `3↓Sx=19.89137166` | screen |
| GB-080c | 28 | `[▼]` … | `C↑Σxy=5234.15` / `D:a=0.677325190` / `E↓b=⁻18.6663732` | screen; text gives y'=0.67732519x'−18.66637321 |
| GB-080d | 28 | `[▼]` until y' | `F↑r=0.963411717` / `G:x'` / `H↓y'` (H highlighted) | screen |
| GB-080e | 29 | `[enter] 55 [)] [enter]` | `y'(55)` → ↵ `18.58651222` | screen |

Computed values not shown on any screen, for completing the menus (they follow from the formulas):
- GB-077 data: σx=4.330127019, Σx=210, Σx²=11100, minX=45, Q1=50, Med=55, Q3=55, maxX=55 (Q1 and Q3 by Tukey; even n, so the method doesn't matter).
- GB-080 data: σx=17.22643318, Σx=226, Σx²=13956, ȳ=19.6025, Sy=13.98459957, σy=12.11101849, Σy=78.41, Σy²=2123.7391, minX=33, maxX=79, minY=5.3, maxY=38.45.
- GB-078 data: a=⁻0.5, b=52.5, r=⁻1.

#### Probability (GB19 p.29–31)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-081a | 29 | `8` | `8█` | — | screen |
| GB-081b | 29 | `[prb]` | menu tabs `PRB RAND`; `1:nPr` / `2:nCr` / `3:!` | — | screen |
| GB-081c | 30 | `1 3 [enter]` | `8 nPr 3` | R `336` | screen |
| GB-082 | 30 | `52 [prb] 2 5 [enter]` | `52 nCr 5` | ↵ `2598960` | screen |
| GB-083 | 30 | `4 [prb] 3 [enter]` | `4!` | R `24` | screen |
| GB-084a | 30 | `5 [sto→] [prb] [►]` | tabs `PRB RAND` (RAND highlighted); `1:rand` / `2:randint(` | — | screen |
| GB-084b | 30 | `1 [enter]` | `5→rand` | R `5` | screen |
| GB-085 | 30 | `[prb] [►] 1 [enter]` | `rand` | ↵ `0.000093165` | screen; deterministic after seed 5 (§4.5) |
| GB-086 | 30 | `[prb] [►] 2 3 [2nd][,] 5 [)] [enter]` | `randint(3,5)` | R `5` | screen; deterministic in sequence |
| GB-087 | 30–31 | `25 [prb] 2 3 [enter]` | `25 nCr` (during entry), then `25 nCr 3` | R `2300` | screen |

#### Data editor and list formulas (GB19 p.32–33)
| ID | p. | Keystrokes | Screen | Notes |
|---|---|---|---|---|
| GB-088a | 32 | `[data] 1 [n/d] 4 [▼] 2 [n/d] 4 [▼] 3 [n/d] 4 [▼] 4 [n/d] 4 [enter]` | L1 shows `1/2 3/4 1` (1/4 scrolled above), highlighted blank, `L1(5)=` | screen; 2/4 shows as `1/2` and 4/4 as `1` |
| GB-088b | 32 | `[►] [data] [►]` | tabs `CLEAR FORMULA`; `1:Add/Edit Frmla` / `2:Clear L1 Frmla` / `3↓Clear L2 Frmla` | screen |
| GB-088c | 32 | `[enter]` | L2 top cell highlighted; bottom `◆L2=` | screen |
| GB-088d | 32 | `[data] [enter] [2nd][f◄►d]` | bottom `◆L2=L1▸F◄►D` | screen; `[data]` opens the `Ls` menu and `[enter]` picks L1 |
| GB-088e | 32 | `[enter]` | L2 `0.25 0.5 0.75 1`; label `L2(1)=` highlighted, `0.25` | screen; formula list |
| GB-089a | 33 | `[data] [data] 4`, `[data] [►] 5`, `8 [▼] [(−)] 1 [▼] 4 [▼] [►]` | L1 `8 ⁻1 4`, `L2(1)=` | screen |
| GB-089b | 33 | `[data] [►] 1` | `◆L2=` | screen |
| GB-089c | 33 | `9 [÷] 5 [×] [data] 1 [+] 32` | `◆L2=9/5×L1+32█` | screen; editor shows ÷ as `/` and × as `×` |
| GB-089d | 33 | `[enter]` | L2 `46.4 30.2 39.2`; `L2(1)=` highlighted, `46.4` | screen |
| GB-089e | 33 | `[◄] [▼] [▼] [▼] 21 [enter]` | L1 `⁻1 4 21`, L2 `30.2 39.2 69.8`, `L1(5)=` | screen; the formula updates automatically |

#### Function table (GB19 p.34–35)
| ID | p. | Keystrokes | Screen | Notes |
|---|---|---|---|---|
| GB-090a | 34 | `[table] [xyzt] [(] 36 [−] [xyzt] [)]` | `y=x(36−x)` | screen |
| GB-090b | 34 | `[enter]` | `Start=0` / `Step=1` / `[Auto]  Ask-x` / `OK` | screen; defaults |
| GB-090c | 34 | `[clear] 15 [▼] [clear] 3 [▼] [▼] [enter]` | `Start=15` / `Step=3` / `[Auto]` then the table: header `x │ y`; rows `15 │ 315`, `18 │ 324`, `21 │ 315`; bottom `x=15`; first x highlighted | screen; vertex (18, 324) |
| GB-091a | 35 | `[table] 3600 [−] 450 [xyzt]` | `y=3600−450x` | screen |
| GB-091b | 35 | `[enter] 0 [▼] 1 [▼] [►] [enter] [▼] [enter]` | `Start=0` / `Step=1` / `Auto  [Ask-x]` / `OK` | screen |
| GB-091c | 35 | type guesses (`2 [enter] 7 [enter] 8 [enter]`) | rows `2 │ 2700`, `7 │ 450`, `8 │ 0`; bottom `x=8` | screen |

#### Constant K (GB19 p.35–36)
| ID | p. | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|
| GB-092a | 35 | `[2nd][K]` | `K=` | — | screen |
| GB-092b | 35 | `[×] 2 [+] 3 [enter]` | `K=*2+3` (K indicator on) | — | screen |
| GB-092c | 35 | `4 [enter]` | `4*2+3` | R `11` | screen |
| GB-092d | 36 | `6 [enter]` | `6*2+3` | R `15` | screen |
| GB-093a | 36 | `[2nd][K] [2nd][K] [clear] [x²] [enter]` | `K=²` | — | screen |
| GB-093b | 36 | `5 [enter]` | `5²` | R `25` | screen |
| GB-093c | 36 | `20 [enter]` | `20²` | R `400` | screen |
| GB-094 | 36 | `[2nd][K] 1 [+] 1 [enter]` | `1+1` | R `2` | screen; K indicator off |
| GB-095a | 36 | `[2nd][K] [×] 5 [−] 2 [enter]` | `K=*5−2` | — | screen |
| GB-095b | 36 | `[(−)] 5 [enter]` | `⁻5*5−2` | R `⁻27` | screen |
| GB-095c | 36 | `[(−)] 1 [enter]` | `⁻1*5−2` | R `⁻7` | screen |
| GB-095d | 36 | `[2nd][K]` | (K indicator off) | — | screen |

### 10.2 Teacher guide (TG, printed pages; all are screenshots unless marked "text")
| ID | TG p. | Setup | Keystrokes | Entry | Result | Notes |
|---|---|---|---|---|---|---|
| TG-01a | 31 | default | `46 [−] 23 [enter]` | `46−23` | R `23` | |
| TG-01b | 31 | ↳ | `[▲] [▲] [enter] [◄] [◄] [◄] [◄] 1 [►] [►] 6 [enter]` | `41−26` | R `15` | **overwrite mode**: typing replaces the char at the cursor |
| TG-01c | 31 | ↳ | `2 [n/d] 5 [►] [+] 3 [n/d] 10 [enter]` | `{2/5}+{3/10}` | R `{7/10}` | |
| TG-01d | 31 | ↳ | `[2nd][off] [on]`, then `[▲] [▲] [▲]` | blank screen with a cursor after on; then history shows `41−26 │ [15]` (15 highlighted) and `{2/5}+{3/10} │ {7/10}` | — | history survives off/on |
| TG-02 | 32 | any | `[2nd][reset]` → `Reset` / `1:No` / `2:Yes`; `2` → `MEMORY CLEARED`; `[clear]` → blank | — | — | |
| TG-03a | 38 | default | `5 [x²] [+] 12 [x²] [enter]` | `5²+12²` | R `169` | |
| TG-03b | 38 | ↳ | `[2nd][√] [2nd][ans] [enter]` | `√(Ans)` | R `13` | |
| TG-04 | 39 | default | `[2nd][√] 8 [enter]`; `[◄►]` | `√8` → `2√2`; `2√2◄►` | ↵ `2.828427125` | |
| TG-05a | 42 | default | `4569 [+] 285` | `4569+285` | — | |
| TG-05b | 42 | ↳ | `[◄]`×6 `[delete]` | `459+285` | — | `[delete]` removes the char under the cursor |
| TG-05c | 42 | ↳ | `[►]`×4 `[2nd][insert] 6` | `459+2865` | — | insert before the cursor |
| TG-05d | 42 | ↳ | `[enter]` | `459+2865` | R `3324` | |
| TG-06 | 43 | default | `21595`, then `[◄] [◄] [clear]`, then `[clear]` | `21595` → `215` → (empty) | — | `[clear]` mid-entry clears **from the cursor to the end** |
| TG-07a | 46 | default | `2 [+] 54 [−] 6 [enter]` | `2+54−6` | R `50` | TG prose says "2 + 54 ÷ 6"; keystrokes and screen use − |
| TG-07b | 46 | ↳ | `16 [×] 21 [enter]` | `16*21` | R `336` | |
| TG-07c | 46 | ↳ | `1 [n/d] 2 [►] [×] 10 [enter]` | `{1/2}*10` | R `5` | |
| TG-07d | 46 | ↳ | `12 [×] [(] 5 [+] 6 [)] [enter]` | `12*(5+6)` | R `132` | |
| TG-08 | 47 | default | `[(−)] 3 [+] 12 [enter]` | `⁻3+12` | R `9` | |
| TG-09 | 48 | default | `15 [2nd][%] [×] 80 [enter]` | `15%*80` | R `12` | |
| TG-10 | 52 | default | `1 [+] 2 [×] 3 [enter]`; `1 [+] [(] 2 [×] 3 [)] [enter]`; `[(] 1 [+] 2 [)] [×] 3 [enter]` | `1+2*3`; `1+(2*3)`; `(1+2)*3` | `7`; `7`; `9` | |
| TG-11a | 53 | **Classic** (`[mode] [▼][▼][▼] [enter] [clear]`) | `[2nd][√] 5 [x²] [−] 4 [(] 1 [)] [(] 3 [)] [enter]` | `√(5²−4(1)(3)` | ↵ `3.605551275` | unclosed paren allowed |
| TG-11b | 53 | MathPrint | same keys | `√(5²−4(1)(3))` | R `√13` | |
| TG-11c | 53 | MathPrint | `[◄►]` | `√13◄►` | ↵ `3.605551275` | |
| TG-12a | 56 | default | `12543 [enter]` | `12543` | R `12543` | |
| TG-12b | 56 | → SCI `[mode] [▼] [►] [enter]` | `[clear] [enter]` | `12543` | ↵ `1.2543*10⁴` | an empty `[enter]` re-runs the last entry |
| TG-12c | 56 | → ENG `[mode] [▼] [►] [►] [enter]` | `[clear] [enter]` | `12543` | ↵ `12.543*10³` | |
| TG-12d | 57 | → NORM `[mode] [▼] [enter]` | `[clear] [enter]` | `12543` | R `12543` | |
| TG-13 | 58 | default | `7.8 [×10ⁿ] 8 [►] [−] 1.5 [×10ⁿ] 8 [enter]` | `7.8*10⁸−1.5*10⁸` | ↵ `630000000` | 9 digits stay in NORM |
| TG-14 | 61 | default | `5 [n/d] 6 [►] [+] 1 [n/d] 10 [enter]` | `{5/6}+{1/10}` | R `{14/15}` | |
| TG-15a | 62 | default | `4 [2nd][U n/d] 3 [▼] 8 [►] [+] 2 [2nd][U n/d] 3 [▼] 4 [enter]` | `4{3/8}+2{3/4}` | R `{57/8}` | |
| TG-15b | 62 | ↳ | `[2nd][n/d◄►U n/d] [enter]` | `{57/8}▸n/d◄►Un/d` | R `7{1/8}` | the Ans **value** is inserted before the conversion (as in GB-057c) |
| TG-16a | 63 | default | `5 [2nd][U n/d] 3 [▼] 4 [►] [2nd][f◄►d] [enter]` | `5{3/4}▸F◄►D` | R `5.75` | |
| TG-16b | 63 | default | `2.25 [2nd][f◄►d] [enter]` | `2.25▸F◄►D` | R `{9/4}` | |
| TG-16c | 63 | default | `2.25 [enter]`, then `[◄►]` | `2.25` → `2.25`; `2.25◄►` | ↵ `{9/4}` | the toggle converts decimal to fraction |
| TG-17a | 66 | default | `12.345 [enter]` | `12.345` | R `12.345` | |
| TG-17b | 66 | → FIX 2 `[mode] [▼] [▼] [►] [►] [►] [enter]` | `[clear] [enter]` | `12.345` | R `12.35` | round half up |
| TG-17c | 66 | → FIX 1 `[mode] [▼] [▼] [►] [►] [enter]` | `[clear] [enter]` | `12.345` | R `12.3` | |
| TG-17d | 66 | → FLOAT `[mode] [▼] [▼] [enter]` | `[clear] [enter]` | `12.345` | R `12.345` | |
| TG-18 | 68–69 | default | `[2nd][K] [×] 5.25 [enter] [clear] 16 [enter] 12 [enter] 17 [enter] [2nd][K]` | `K=*5.25`; `16*5.25`; `12*5.25`; `17*5.25` | `84`; `63`; `89.25` | K indicator from `[enter]` on K= until the last `[2nd][K]` |
| TG-19a | 72 | default | `96 [+] 76 [+] 85 [enter]` | `96+76+85` | R `257` | |
| TG-19b | 73 | ↳ | `[÷] 3 [enter]` | `Ans÷3` | ↵ `85.66666667` | |
| TG-19c | 73 | ↳ | `[sto→] [xyzt] [enter]` | `Ans→x` | ↵ `85.66666667` | |
| TG-19d | 73 | ↳ | `92 [+] 83 [+] 97 [+] 86 [enter]` | `92+83+97+86` | R `358` | |
| TG-19e | 73 | ↳ | `[÷] 4 [enter]` | `Ans÷4` | R `89.5` | |
| TG-19f | 73 | ↳ | `[+] [xyzt] [enter]` | `Ans+x` | ↵ `175.1666667` | |
| TG-19g | 73 | ↳ | `[÷] 2 [enter]` | `Ans÷2` | ↵ `87.58333333` | |
| TG-20a | 74 | default | `4.5 [sto→] [xyzt] [enter]` | `4.5→x` | R `4.5` | |
| TG-20b | 74 | ↳ | `2 [+] [xyzt] [(] 1.40 [)] [enter]` | `2+x(1.40)` | R `8.3` | the entry keeps `1.40` as typed |
| TG-20c | 74 | ↳ | `3 [+] [xyzt] [(] 1.10 [)] [enter]` | `3+x(1.10)` | R `7.95` | |
| TG-20d | 75 | ↳ | `3.2 [sto→] [xyzt] [enter]` | `3.2→x` | R `3.2` | (the page's topic-key header, `[sto→] [2nd][recall]`, sits beside the keystrokes; it is not part of them) |
| TG-20e | 75 | ↳ | `[▲]`×6 `[enter] [enter]` | `2+x(1.40)` | R `6.48` | re-runs a history entry with the new x |
| TG-20f | 75 | ↳ | `[▲]`×6 `[enter] [enter]` | `3+x(1.10)` | R `6.52` | |
| TG-21a | 76 | default | `2 [×] 13.98 [enter]` | `2*13.98` | R `27.96` | |
| TG-21b | 76 | ↳ | `[sto→] [xyzt] [enter]` | `Ans→x` | R `27.96` | |
| TG-21c | 76 | ↳ | `3 [×] 7.98 [enter]` | `3*7.98` | R `23.94` | |
| TG-21d | 76 | ↳ | `[sto→] [xyzt] [xyzt] [enter]` | `Ans→y` | R `23.94` | |
| TG-21e | 77 | ↳ | `6.98 [+] 9.98 [enter]` | `6.98+9.98` | R `16.96` | |
| TG-21f | 77 | ↳ | `[sto→] [xyzt] [xyzt] [xyzt] [enter]` | `Ans→z` | R `16.96` | |
| TG-21g | 77 | ↳ | `[2nd][recall]` | `Recall Var` / `1:x=27.96` / `2:y=23.94` / `3↓z=16.96` | — | |
| TG-21h | 77 | ↳ | `1 [+] [2nd][recall] 2 [+] [2nd][recall] 3 [enter]` | `27.96+23.94+16.9` (17-char entry cut at 16) | ↵ `68.86` | values pasted |
| TG-22 | 80–81 | default | as GB-089 | as GB-089 | L2 `46.4 30.2 39.2`; after `[◄] [▼]×3 21 [enter]`: `69.8` | |
| TG-23a | 84 | default | `[data]` | empty lists, `L1(1)=` | — | |
| TG-23b | 84 | ↳ | `85 [▼] 97 [▼] 53 [▼] 77 [▼] [►] 2 [▼] 1 [▼] 1 [▼] 1 [▼]` | L1 `85 97 53 77`; L2 `2 1 1 1` | — | the screenshots show `L1(6)=` / `L2(6)=` (artifact) |
| TG-23c | 85 | ↳ | `[2nd][stat] 1 [▼] [►] [►] [enter] [▼] [enter]` | setup DATA: L1, FRQ: L2 | `1-Var:L1,L2` / `1:n=5` / `2:x̄=79.4` / `3↓Sx=16.39512123` | |
| TG-23d | 85 | ↳ | `[▼]`×5 | `4↑σx=14.66424222` / `5:Σx=397` / `6↓Σx²=32597` | — | |
| TG-23e | 85 | ↳ | `[▼]`×3 | `7↑minX=53` / `8:Q1=77` / `9↓Med=85` | — | **quartile evidence** (§5.5) |
| TG-23f | 85 | ↳ | `[▼]`×2 | `9↑Med=85` / `A:Q3=85` / `B:maxX=97` | — | B is the last item (`:` not `↓`) |
| TG-24a | 86 | after 23 | `[data] [▼] [▼]` | `L1(3)=53` (53 highlighted) | — | |
| TG-24b | 86 | ↳ | `[delete] [►] [delete]` | L1 `85 97 77`; L2 `2 1 1`; `L2(3)= 1` | — | `[delete]` removes a list element |
| TG-24c | 86 | ↳ | `[2nd][stat] 1 [▼] [▼] [enter]` | `1-Var:L1,L2` / `n=4` / `x̄=86` / `3↓Sx=8.246211251` | — | |
| TG-24d | 86 | ↳ | `[data] [data] 4`, then `[2nd][quit]` | CLEAR menu; then a blank home screen | — | |
| TG-25 | 87–88 | default | `[data] 58 [▼] 47 [▼] [►] 35 [▼] 28 [▼]`; `[2nd][stat] 2 [▼] [▼] [enter]`; `[▼]` to y', `[enter] 32 [)] [enter]` | `y'(` pasted; `y'(32)` | ↵ `18.45454545` | a = 7/11 |
| TG-26 | 90 | default | `4 [prb] [▼] [enter] 2 [enter]` | `4 nCr 2` | R `6` | |
| TG-27 | 91 | default | `4 [prb] [enter] 2 [enter]` | `4 nPr 2` | R `12` | |
| TG-28 | 92 | default | `4 [prb] [▼] [▼] [enter] [enter]` | `4!` | R `24` | |
| TG-29 | 93 | unknown seed | `[prb] [►] [enter] [enter]`, `[enter]` | `rand`; `rand` | ↵ `0.390926039`; ↵ `0.514541293` | "results will vary"; a consecutive MLCG pair (§4.5) |
| TG-30a | 94 | default | `1 [sto→] [prb] [►] [enter] [enter]` | `1→rand` | R `1` | |
| TG-30b | 94 | ↳ | `[prb] [►] [enter] [enter]` | `rand` | ↵ `0.000018633` | **deterministic** |
| TG-30c | 94 | ↳ | `[enter]` | `rand` | ↵ `0.745579721` | **deterministic** (the second draw) |
| TG-31 | 95 | unknown seed | `[prb] [►] [▼] [enter] 2 [2nd][,] 10 [)] [enter] [enter] [enter]` | `randint(2,10)` ×3 | `2`, `7`, `8` | results vary |
| TG-32a | 98 | default | `[table] [xyzt] [(] 36 [−] [xyzt] [)] [enter]`, then `0 [▼] 4 [▼] [enter] [▼]` | `Start=0` / `Step=4` / `[Auto]` | — | |
| TG-32b | 98 | ↳ | `[enter] [▼]`×5 | rows `12 │ 288`, `16 │ 320`, `20 │ 320`; `x=20` | — | |
| TG-32c | 99 | ↳ | `[clear] 15 [▼] 1 [▼] [▼] [enter] [▼]`×4 | `Start=15` / `Step=1` → rows `17 │ 323`, `18 │ 324`, `19 │ 323`; `x=19` | — | |
| TG-33 | 100 | default | `[table] [clear] 3600 [−] 450 [xyzt] [enter] [clear] 0 [▼] [clear] 1 [▼] [►] [enter] [▼] [enter]`, then guesses | rows `6 │ 900`, `7 │ 450`, `8 │ 0`; `x=8` | — | ask-x |
| TG-34 | 102 | default | `27.4 [x²] [enter]` (or `27.4 [^] 2`) | `27.4²` | R `750.76` | |
| TG-35a | 103 | default | `[2nd][√] 3 [enter]` | `√3` | R `√3` | |
| TG-35b | 103 | ↳ | `[◄►]` | `√3◄►` | R `1.732050808` | |
| TG-35c | 103 | → FIX 0 `[mode] [▼] [▼] [►] [enter]` | `[clear] [enter]` | `√3◄►` | R `2` | the re-run keeps the toggle |
| TG-36a | 104 | default | `2.3 [^] 3 [enter]` | `2.3^{3}` | R `12.167` | |
| TG-36b | 104 | ↳ | `[◄►]` | `12.167◄►` | R `{12167/1000}` | the denominator-1000 data point |
| TG-37 | 105 | default | `2 [^] 10 [enter]`; `2 [^] 15 [enter]` | `2^{10}`; `2^{15}` | `1024`; `32768` | |
| TG-38 | 106 | default | `3 [2nd][x√] 125 [enter]` | `³√(125)` | R `5` | |
| TG-39a | 107 | default | `10 [x⁻¹] [enter]` | `10⁻¹` | R `{1/10}` | |
| TG-39b | 107 | default | `5 [x⁻¹] [enter]` | `5⁻¹` | R `{1/5}` | |
| TG-39c | 107 | default | `5 [2nd][U n/d] 1 [▼] 3 [►] [enter]` | `5{1/3}` | R `{16/3}` | |
| TG-39d | 107 | ↳ | `[x⁻¹] [enter]` | `Ans⁻¹` | R `{3/16}` | |
| TG-40a | 110 | default | `[log] 23 [)] [enter]` | `log(23)` | ↵ `1.361727836` | |
| TG-40b | 110 | → FIX 4 `[mode] [▼] [▼] [►]×5 [enter]` | `[clear] [enter]` | `log(23)` | R `1.3617` | |
| TG-40c | 110 | FIX 4 | `[ln] 23 [)] [enter]` | `ln(23)` | R `3.1355` | |
| TG-40d | 110 | → FLOAT | `[mode] [▼] [▼] [enter] [clear] [enter]` | `ln(23)` | ↵ `3.135494216` | |
| TG-41a | 111 | default | `[2nd][10^x] 3.9824 [enter]` | `10^{3.9824}` | ↵ `9602.846792` | |
| TG-41b | 111 | → FIX 4 | `[clear] [enter]` | `10^{3.9824}` | ↵ `9602.8468` | |
| TG-41c | 111 | FIX 4 | `[2nd][e^x] 3.9824 [enter]` | `e^{3.9824}` | R `53.6456` | |
| TG-41d | 111 | → FLOAT | `[clear] [enter]` | `e^{3.9824}` | ↵ `53.64562936` | |
| TG-42a | 114 | default | `2 [×] [π] [×] 1.5 [enter]` | `2*π*1.5` | ↵ `9.424777961` | a decimal input gives a decimal |
| TG-42b | 114 | ↳ | `[◄►]` | `9.42477796077◄►` | ↵ `3π` | decimal → π form |
| TG-43a | 115 | default | `[π] [×] 4 [x²] [enter]` | `π*4²` | R `16π` | |
| TG-43b | 115 | → FIX 0 | `[clear] [◄►]` | `16π◄►` | R `50` | |
| TG-43c | 116 | → FLOAT | `[clear] [enter]` | `16π◄►` | ↵ `50.26548246` | |
| TG-44a | 118 | DEG | `45 [2nd][angle] 1 30 [2nd][angle] 2 [+] 36 [2nd][angle] 1 15 [2nd][angle] 2 [enter]` | `45°30'+36°15'` | ↵ `81.75` | |
| TG-44b | 118 | ↳ | `180 [2nd][angle] 1 [−] [2nd][ans] [enter]` | `180°−Ans` | R `98.25` | |
| TG-44c | 118 | ↳ | `[2nd][angle] 6 [enter]` | `98.25▸DMS` | ↵ `98°15'0"` | Ans value inserted |
| TG-45a | 119 | DEG | `39.55 [2nd][angle] [enter] [2nd][angle] [▲] [enter] [enter]` | `39.55°▸DMS` | ↵ `39°33'0"` | `[▲]` from item 1 wraps to `6:▸DMS` |
| TG-45b | 119 | DEG | `116.20 [2nd][angle] [enter] [2nd][angle] [▲] [enter] [enter]` | `116.20°▸DMS` | ↵ `116°12'0"` | the entry keeps `.20` |
| TG-46 | 120 | DEG | `[cos] 180 [2nd][angle] 1 [)] [enter]`; `[cos] [π] [2nd][angle] 4 [)] [enter]`; `[cos] 200 [2nd][angle] 5 [)] [enter]` | `cos(180°)`; `cos(πʳ)`; `cos(200ᵍ)` | `⁻1`; `⁻1`; `⁻1` | |
| TG-47a | 122 | DEG | `[2nd][angle] [►]` | tabs `DMS [R◄►P]`; `1:R▸Pr(` / `2:R▸Pθ(` / `3↓P▸Rx(` | — | |
| TG-47b | 122 | ↳ | `[▼] [▼] [enter]` | `P▸Rx(█` | — | |
| TG-47c | 122 | ↳ | `7 [2nd][,] 30 [)] [enter]` | `P▸Rx(7,30)` | ↵ `6.062177826` | |
| TG-47d | 122 | ↳ | `[2nd][angle] [►] [▼] [▼] [▼] [enter] 7 [2nd][,] 30 [)] [enter]` | `P▸Ry(7,30)` | R `3.5` | |
| TG-48a | 124 | DEG | `78 [n/d] [tan] 27 [2nd][angle] [enter] [)] [enter]` | `{78 / tan(27°)}` | ↵ `153.0836194` | |
| TG-48b | 124 | → FIX 0 | `[clear] [enter]` | same | R `153` | |
| TG-49a | 125 | DEG | `[2nd][tan⁻¹] 600 [n/d] 2500 [►] [)] [enter]` | `tan⁻¹({600/2500})` | ↵ `13.49573328` | |
| TG-49b | 125 | → FIX 1 | `[clear] [enter]` | same | R `13.5` | |
| TG-50a | 126 | DEG | `5 [×] [cos] 74 [)] [enter]` | `5*cos(74)` | ↵ `1.378186779` | |
| TG-50b | 126 | → FIX 0 | `[clear] [enter]` | same | R `1` | |
| TG-51a | 127 | DEG | `[2nd][cos⁻¹] 453 [n/d] 500 [►] [)] [enter]` | `cos⁻¹({453/500})` | ↵ `25.04169519` | |
| TG-51b | 127 | → FIX 1 | `[clear] [enter]` | same | R `25.0` | padded |
| TG-52a | 128 | DEG | `1.5 [n/d] [sin] 12 [)] [enter]` | `{1.5 / sin(12)}` | ↵ `7.214601517` | |
| TG-52b | 128 | → FIX 0 | `[clear] [enter]` | same | R `7` | |
| TG-53a | 129 | DEG | `[2nd][sin⁻¹] 13 [n/d] 20 [►] [)] [enter]` | `sin⁻¹({13/20})` | ↵ `40.54160187` | |
| TG-53b | 129 | → FIX 1 | `[clear] [enter]` | same | R `40.5` | |
| TG-54a | 132 | default | `[2nd][hyp] [sin] 2 [)] [enter]` | `sinh(2)` | ↵ `3.626860408` | |
| TG-54b | 132 | ↳ | `[2nd][hyp] [2nd][sin⁻¹] [2nd][ans] [)] [enter]` | `sinh⁻¹(Ans)` | R `2` | |
| TG-54c | 132 | default | `[2nd][hyp] [cos] 2 [)] [enter]` | `cosh(2)` | ↵ `3.762195691` | |
| TG-54d | 132 | ↳ | `[2nd][hyp] [2nd][cos⁻¹] [2nd][ans] [)] [enter]` | `cosh⁻¹(Ans)` | R `2` | |
| TG-54e | 132 | default | `[2nd][hyp] [tan] 2 [)] [enter]` | `tanh(2)` | ↵ `0.96402758` | trailing zero stripped from 0.964027580 |
| TG-54f | 132 | ↳ | `[2nd][hyp] [2nd][tan⁻¹] [2nd][ans] [)] [enter]` | `tanh⁻¹(Ans)` | R `2` | |

TG activity examples (text only; no screen captures):

| ID | TG p. | Example | Result |
|---|---|---|---|
| TG-A1 | 3 | SCI conversions (FLOAT): 12000000 | `1.2×10⁷` |
| | | 974000000 | `9.74×10⁸` |
| | | 0.0000034 | `3.4×10⁻⁶` |
| | | 0.000000004 | `4×10⁻⁹` |
| TG-A2 | 3 | NORM: 5.8×10⁷ | `58000000` |
| | | 7.32×10⁵ | `732000` |
| | | 6.2×10⁻⁶ | `0.0000062` |
| | | 3×10⁻⁸ | `0.00000003` |
| TG-A3 | 4 | `2.5 [×10ⁿ] 13 [►] [+] 9.3 [×10ⁿ] 7 [enter]` (SCI) | `2.5000093×10¹³` |
| | | then `[2nd][ans] [n/d] 6 [×10ⁿ] 12 [enter]` | `4.166682167` (as printed; the SCI form would be `4.166682167×10⁰`, **[unverified]**) |
| TG-A4 | 7–8 | heart-rate frequencies (60×3, 61×5, 62×6, 63×3, 64×1, 65×4) | `n=22`, `x̄=62.27272727`, `Σx=1370` |

### 10.3 TI Knowledge Base
| ID | Source | Data / keys | Expected |
|---|---|---|---|
| KB-1 | KB 31772 | L1 = {50, 64, 87, 3, 95}, FRQ ONE, CALC | `n=5`, `x̄=59.8`, `Sx=36.46505176`, `σx=32.61533382`, `Σx=299`, `Σx²=23199` |
| KB-2 | KB 12280 | L1 = {1, 2, 3}, FRQ ONE | `Sx=1`, `σx=0.816497` (KB rounds; under the 10-digit/11-char rule the menu would show `σx=0.816496581`, **[inferred]**) |
| KB-3 | KB 20469 | sci-notation division without parentheses, e.g. `6[×10ⁿ]5÷2[×10ⁿ]3` | the "wrong" EOS result 3×10⁸ (the correct 300 needs `(2[×10ⁿ]3)`); KB images not extracted, so the values are **[inferred]** |

### 10.4 Count
- GB19/GB25: **95** numbered examples (GB-001…GB-095, 173 table rows/steps), covering every screenshot in the guidebook (186 images; a few are mode or menu screens folded into their example).
- GB06-only: **2** (GB06-1, GB06-2), plus the two older-firmware Sx values noted in GB-079.
- TG: **54** screenshot examples (TG-01…TG-54, 137 rows) plus **4** text-only activity examples.
- KB: **3**.
- **Total: 158 examples.**

---

## 11. Open questions (test on hardware or the TI-SmartView emulator before freezing behaviour)
1. **Fraction size limits**: the maximum numerator and denominator before the result falls back to decimal. Evidence only shows a denominator of 1000 working (`12167/1000`).
2. **Exact-form grammar**: are sums like `(⁻5+√13)/2`, and products like `π√2`, kept exact? What does toggle show when no exact form exists?
3. **FLOAT to sci switch for small numbers** (exactly < 1E-9?) and the maximum mantissa digits in SCI/ENG FLOAT.
4. **Overflow and underflow limits** (assumed ±9.999999999E99 and 1E-99).
5. **Quartile method**: Tukey hinges (recommended) vs nearest-rank. Test {1,…,7} and {45,55,55,55}. Also the weighted quartiles with non-integer FRQ.
6. **2-Var StatVars items 4–B and J–L** (inferred order).
7. **Error screen layout**: the exact text (`DOMAIN` vs `DOMAIN ERROR`), its position, and whether any key other than `[clear]` dismisses it. Also SYNTAX vs MEMORY LIMIT for >23 pending operations.
8. **rand**: the default seed after reset, seed 0 handling, the randint mapping formula, and whether randint consumes exactly one draw.
9. **▸DMS with fractional seconds**: rounding and the decimal places of seconds.
10. **Empty-entry K behaviour**: the "0 is assumed, and Ans will appear" wording.
11. **Table cell formatting**: digits per cell (TG prints `6.28319`) and the sci format in cells.
12. **Range of nPr/nCr with r > n**, and randint with A > B.
13. **Classic-mode inline forms** of `10^(`, `e^(` and `×10ⁿ`.
14. **Intermediate rounding vs truncation** at 13 digits (the `39.43972222221` hint).
15. **The ▸ conversion inserting the Ans value instead of `Ans`**: is this universal for all four conversions (only ▸DMS and ▸n/d◄►Un/d are evidenced)?
