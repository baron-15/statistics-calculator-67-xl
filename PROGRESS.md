# TI-30XS MultiView emulator: progress and handoff

Status as of 2026-10-10 (branch `build/ti30xs-emulator`):

## Done
- Scaffold: React 18 + Vite 8 + TypeScript 7 + Tailwind 4 + Vitest + Playwright. Builds and typechecks.
- Reference images: TI official renders and screen close-ups, in the session scratchpad (`ti30xs-geo/dl/`).
- Measured colors: faceplate #466474, case sides #d5d5d5, top cap #262626, LCD #a2a7a0, 2nd key #5b8b1b, function keys #405c6a, digit keys #d0d0d0.

## In progress
- Research (three agents): (1) keys, modes and menus; (2) math, stats and worked examples; (3) the dot-matrix display and prior art. Findings go to the scratchpad `ti30xs*/research-*.md`.

## Next
1. Compile `docs/SPEC.md` from the research.
2. Write the engine contracts: keys, state, expression tree, screen model.
3. Parallel build agents: expression editor; parser and evaluator with number formatting; menus and modes (prb, angle, data/stat, table, memory, reset); dot-matrix renderer; device skin from the measured geometry.
4. Verification: guidebook golden tests and a visual comparison with TI's screen images.

## If paused
Resume by reading this file and the research files, then continue from "Next".
