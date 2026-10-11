# TI-30XS MultiView emulator: progress and handoff

Status as of 2026-10-10 (branch `build/ti30xs-emulator`):

## Done
- Scaffold: React 18 + Vite 8 + TypeScript 7 + Tailwind 4 + Vitest + Playwright. Builds and typechecks.
- Reference images: TI official renders and screen close-ups, in the session scratchpad (`ti30xs-geo/dl/`).
- Measured colors: faceplate #466474, case sides #d5d5d5, top cap #262626, LCD #a2a7a0, 2nd key #5b8b1b, function keys #405c6a, digit keys #d0d0d0.

## Status: complete (first release)
- 1287 unit/golden/flow tests and 17 browser tests pass. The build is clean, and `npm audit` reports 0 vulnerabilities.
- All 158 guidebook examples pass end to end. 175 of 183 TI captures match pixel for pixel from keystrokes; the other 8 are documented minority captures.
- Open `it.todo` items have no TI evidence either way:
  - the ↓ indicator after enter;
  - the long-entry scroll window;
  - ◂▸ with no history;
  - the overflow arrow on long history entries.
- To confirm with the user: the wordmark "B-67XL AmazingView" (user-chosen), and the real-unit yellow-green LCD glass (vs the render's grey).

## If paused
Resume by reading this file and the research files, then continue from "Next".
