# TI-30XS MultiView behavior spec

This is the authoritative spec for the emulator. It records the decisions; the detail lives in the research files, which are cited by section:

- **K:** `docs/research/keys-menus.md`. Keys, the mode screen, menus, editing, history, indicators, errors.
- **D:** `docs/research/display.md`. The 96×31 dot matrix, fonts, MathPrint pixel layout, menus, the data editor, cursors.
- **M:** `docs/research/math-stats.md`. EOS, precision, exact forms, functions, statistics, table, and the guidebook worked examples (golden tests).

Golden display fixtures are in `tests/fixtures/lcd_dumps.txt`: 182 TI-SmartView screen captures (firmware output) as 96×31 `#`/`.` grids, with the lit indicators.

## Decisions

1. **The display truth is TI-SmartView output.** Where TI's marketing images disagree (fraction-bar overhang, result alignment, radical gap; D §5.8), follow the 182 captures. They come from TI's emulator running the real ROM.
2. **The mode screen has 4 rows only:** `DEG RAD GRAD` / `NORM SCI ENG` / `FLOAT 0123456789` / `CLASSIC MATHPRINT`. The defaults are DEG, NORM, FLOAT and MATHPRINT (K §2).
3. **Exact results in MathPrint.** Results are kept exact where the device does so: fractions, a·√b/c radicals, π multiples, and trig exact values at multiples of 15° or π/12. A decimal in the input forces a decimal result, and so does `÷` with non-integer operands per M. The ◂▸ key toggles between forms (K §4.16). Classic mode shows decimals for √ and π, but keeps fractions entered with n/d.
4. **Multiplication is drawn `*`**, negation is a raised `⁻`, and subtraction is `−`. The token is `Ans`, with a capital A.
5. **Typing overwrites by default.** 2nd insert switches to insert mode, shown with an underscore cursor.
6. **History:**
   - ▲ steps through results and entries alternately, and enter pastes the highlighted item.
   - Enter on an empty line repeats the last entry.
   - clear inside an entry erases from the cursor to the end; on an empty entry it blanks the screen, and the history can still be scrolled to.
   - History is kept through off/on, and cleared by reset or a CLASSIC↔MATHPRINT switch.
7. **Result placement:** a result shares the entry's line when entry cells + result cells ≤ 14. Otherwise it goes right-aligned on the next line. Both are top-aligned (D §3, §5.7).
8. **Unverified points** in K §8 and D (error-screen layout, positions of the 2nd/HYP/GRAD/busy indicators, history depth, the switch to scientific notation) are resolved by the most plausible reading. Each choice gets a code comment and a test, marked `// SPEC: assumption`.

## Architecture

```
src/engine/   pure, no DOM: press(state, key) → state; view(state) → View
  keys.ts        key ids, 2nd functions (lead)
  expr.ts        expression tree: Row/Node/Cursor, SYMS (lead)
  screen.ts      View/Screen/DrawItem/Indicator contract (lead)
  state.ts       composes the slices (lead)
  press.ts       power and 2nd, then apps.routeAction (lead)
  editor/        Agent A: entry editing, cursor, templates
  math/          Agent B: parse (EOS), evaluate (exact + 13-digit), format results, toggle forms, stats math
  apps/          Agent C: router, history, memory, modes and every menu/app screen; builds the View
src/display/  Agent D: fonts, glyphs, MathPrint/Classic layout, home composition, canvas drawing → 96×31 frame
src/ui/       Agent E: device skin from measured geometry, LCD dot rendering, keys, keyboard map, persistence
```

### Key contracts

- `Row` is the shared expression tree. The editor builds it; math parses it and formats results back into Rows; the display lays it out.
- The home screen is semantic (`HomeScreen`). All other screens are a `CanvasScreen` of positioned text, math and rect items in matrix pixels, built by the apps layer from the measured rules in D §3–§7.
- `renderView(view, { blinkOn })` returns a `Frame`: 96×31 pixels, the indicators and the contrast. The UI draws the frame as LCD dots, plus the fixed indicator segments.
