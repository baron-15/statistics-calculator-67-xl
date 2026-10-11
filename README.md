# B-67XL AmazingView Online

A faithful web recreation of the TI-30XS MultiView scientific calculator. It reproduces the 4-line MathPrint dot-matrix display, the keystroke behavior, the menus, statistics and the function table.

> Not affiliated with or endorsed by Texas Instruments. "TI-30XS MultiView" is a trademark of Texas Instruments.

## Side panels

Beside the calculator (under it on a phone), read-only panels show what the 4-line screen cannot. Their numbers come from the calculator's own engine, so they match the LCD.

- **The feature panel** follows what you are doing. It switches when a key opens a feature:
  - `data` or `2nd stat` → **Statistics & data**: lists L1–L3 with their formulas, the 1-Var or 2-Var results, and a box plot and histogram, or a scatter plot with the regression line;
  - `table` → **Function table**: f(x), Start and Step, 12 rows instead of 3, and a plot of f(x);
  - `prb` → **Probability**: nPr, nCr, n!, rand and randint written out with your numbers;
  - `2nd angle`, or `sin`/`cos`/`tan` on the Home screen → **Angles & trig**: the angle in DEG, RAD, GRAD and D°M′S″, its sin, cos and tan, and a unit circle;
  - `n/d`, `◂▸`, `f◂▸d`, `%` and the other fraction keys on the Home screen → **Fractions & answer forms**: Ans as a fraction, a mixed number, a decimal, a percent and its exact √ or π form.

  Other keys leave the panel as it is. A selector in its header switches it by hand, and an **In use** badge shows while the calculator is inside that feature.
- **Memory** (x–c, Ans and the constant K), **Mode** (the four mode rows, following the mode screen's cursor) and **History** (every Home entry, newest first) are always shown.
- **Calculator only**, the switch at the top right, hides every panel for a clean, native calculator page.

The panel choice and both header switches are remembered in this browser. `docs/research/feature-blocks.md` explains which features got a panel and why.

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
  - **`panels/`** holds the side panels. `featureContext.ts` is the pure trigger rule: given the state before and after a key press, it picks the feature panel. The `*Data.ts` files shape the panel contents with the engine's own math, and `charts.tsx` draws them as inline SVG.
- **`docs/SPEC.md`** records the decisions. The research it relies on is in **`docs/research/`**: keys and menus, the display, and math and statistics, all sourced from TI's guidebook, teacher guide, eGuide and knowledge base.

## Fidelity tests

- **Guidebook examples:** all 158 worked examples run end to end from keystrokes alone (`tests/e2e-flows/guidebook.test.ts`).
- **Screen captures:** all 183 TI-SmartView screen captures are reproduced from keystrokes. 175 match pixel for pixel; the other 8 are documented minority captures (`tests/e2e-flows/captures.test.ts`).
