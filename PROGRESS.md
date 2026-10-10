# TI-30XS MultiView emulator: progress and handoff

Status as of 2026-10-10 (branch `build/ti30xs-emulator`):

## Done
- Scaffold: React 18 + Vite 8 + TypeScript 7 + Tailwind 4 + Vitest + Playwright. Builds and typechecks.
- Reference images: TI official renders and screen close-ups, in the session scratchpad (`ti30xs-geo/dl/`).
- Measured colors: faceplate #466474, case sides #d5d5d5, top cap #262626, LCD #a2a7a0, 2nd key #5b8b1b, function keys #405c6a, digit keys #d0d0d0.

## In progress
- Research: all three are done (`docs/research/`: keys-menus, display, math-stats with 158 worked examples).
- Phase 0 contracts are committed: keys, expr, screen, state, press, script, and stubs for editor/math/apps/display.
- Wave 1: A (editor) is MERGED (251 tests). D (renderer) is still running; its worktree is `.claude/worktrees/agent-d-display`.
- Wave 2 (running since 19:47 UTC), each in a TI-repo worktree:
  - B math: `../ti30xs-wt-math`, branch `agent/math`
  - C apps: `../ti30xs-wt-apps`, branch `agent/apps`
  - E UI: `../ti30xs-wt-ui`, branch `agent/ui`
- Merge order once done: D, B, C, E. Then verification (guidebook golden tests and a visual comparison).

## Next
1. Compile `docs/SPEC.md` from the research.
2. Write the engine contracts: keys, state, expression tree, screen model.
3. Parallel build agents: expression editor; parser and evaluator with number formatting; menus and modes (prb, angle, data/stat, table, memory, reset); dot-matrix renderer; device skin from the measured geometry.
4. Verification: guidebook golden tests and a visual comparison with TI's screen images.

## If paused
Resume by reading this file and the research files, then continue from "Next".
