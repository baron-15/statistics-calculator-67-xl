/**
 * The emulator's state: a reducer over the engine's pure `press`, continuous memory in localStorage,
 * a cursor blink timer, and the rendered LCD frame.
 */
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { press, view, type CalcState, type KeyId, type View } from "../engine";
import { renderView, type Frame } from "../display/render";
import { MATRIX_H, MATRIX_W } from "../display/metrics";
import { loadState, saveState } from "./persist";

/** Cursor blink half-period: about 2 Hz (250 ms on, 250 ms off). The real rate is [unverified]. */
export const BLINK_MS = 250;
/** Persist this long after the last key press (and immediately when the page is hidden). */
export const SAVE_DEBOUNCE_MS = 250;

/** One press, guarded: an engine exception keeps the previous state instead of breaking the page. */
export function safePress(s: CalcState, key: KeyId): CalcState {
  try {
    return press(s, key);
  } catch (e) {
    console.error(`press(${key}) threw`, e);
    return s;
  }
}

function safeView(s: CalcState): View {
  try {
    return view(s);
  } catch (e) {
    console.error("view() threw", e);
    return { screen: { kind: "blank" }, indicators: [], contrast: s.contrast, on: s.on };
  }
}

function safeRender(v: View, blinkOn: boolean): Frame {
  try {
    return renderView(v, { blinkOn });
  } catch (e) {
    console.error("renderView() threw", e);
    return { pixels: new Uint8Array(MATRIX_W * MATRIX_H), indicators: v.indicators, contrast: v.contrast, on: v.on };
  }
}

/** Whether the view shows a cursor that blinks. */
function hasCursor(v: View): boolean {
  if (!v.on) return false;
  if (v.screen.kind === "home") return v.screen.cursor !== null;
  if (v.screen.kind === "canvas") return !!v.screen.cursor;
  return false;
}

type Action = { type: "press"; key: KeyId };

const reducer = (s: CalcState, a: Action): CalcState => safePress(s, a.key);

export interface UseCalculator {
  state: CalcState;
  view: View;
  frame: Frame;
  pressKey: (key: KeyId) => void;
}

export function useCalculator(): UseCalculator {
  const [state, dispatch] = useReducer(reducer, undefined, loadState);
  const v = useMemo(() => safeView(state), [state]);
  const blinking = hasCursor(v);
  const [blinkOn, setBlinkOn] = useState(true);

  // Blink while a cursor is shown; restart "on" after every key so typing never hides the cursor.
  useEffect(() => {
    setBlinkOn(true);
    if (!blinking) return;
    const t = setInterval(() => {
      if (document.visibilityState !== "hidden") setBlinkOn((b) => !b);
    }, BLINK_MS);
    return () => clearInterval(t);
  }, [blinking, state]);

  const frame = useMemo(() => safeRender(v, blinking ? blinkOn : true), [v, blinking, blinkOn]);

  // Debounced save, plus an immediate save when the page is hidden or unloads.
  const latest = useRef(state);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flush = useCallback(() => {
    clearTimeout(timer.current);
    if (!dirty.current) return;
    dirty.current = false;
    saveState(latest.current);
  }, []);
  useEffect(() => {
    if (latest.current === state) return;
    latest.current = state;
    dirty.current = true;
    clearTimeout(timer.current);
    timer.current = setTimeout(flush, SAVE_DEBOUNCE_MS);
  }, [state, flush]);
  useEffect(() => {
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
      flush();
    };
  }, [flush]);

  const pressKey = useCallback((key: KeyId) => dispatch({ type: "press", key }), []);
  return { state, view: v, frame, pressKey };
}
