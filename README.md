# B-30XS MultiView Online

A faithful web recreation of the TI-30XS MultiView scientific calculator. It reproduces the 4-line MathPrint dot-matrix display, the keystroke behavior, the menus, statistics and the function table.

> Not affiliated with or endorsed by Texas Instruments. "TI-30XS MultiView" is a trademark of Texas Instruments.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the dev server |
| `npm test` | Runs the unit, golden and flow tests (Vitest) |
| `npm run typecheck` | Runs TypeScript in strict mode |
| `npm run e2e` | Runs the Playwright browser tests |
| `npm run build` | Builds for production |

## How it works

- **`src/engine/`** is pure TypeScript: `press(state, key)` returns the new state, and `view(state)` returns what the screen shows.
  - **`editor/`** handles entry editing with MathPrint templates.
  - **`math/`**
    - parses with TI's order of operations (EOS);
    - evaluates with exact fractions, √ and π, and with 13-digit decimals otherwise;
    - formats results in every number mode;
    - computes statistics.
  - **`apps/`** holds the key router, history, the mode screen and every menu, the data editor, statistics, the table, constant K and reset.
- **`src/display/`** renders the view to the 96×31 dot matrix pixel for pixel, using the ROM fonts and the measured MathPrint layout rules.
- **`src/ui/`** is the device skin, measured from TI's product render. It also draws the LCD's dots, maps the computer keyboard (TI-SmartView key map) and saves state between visits.
- **`docs/SPEC.md`** records the decisions. The research it relies on is in **`docs/research/`**: keys and menus, the display, and math and statistics, all sourced from TI's guidebook, teacher guide, eGuide and knowledge base.

## Fidelity tests

- **Guidebook examples:** all 158 worked examples run end to end from keystrokes alone (`tests/e2e-flows/guidebook.test.ts`).
- **Screen captures:** all 183 TI-SmartView screen captures are reproduced from keystrokes. 175 match pixel for pixel; the other 8 are documented minority captures (`tests/e2e-flows/captures.test.ts`).
