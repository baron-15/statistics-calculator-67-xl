/**
 * Global keyboard listener (keyboardMap.ts). Ignores form fields, browser shortcuts and auto-repeat
 * of non-arrow keys (the device's arrows auto-repeat when held; other keys do not).
 */
import { useEffect, useRef } from "react";
import type { KeyId } from "../engine";
import { isTypingTarget, keyFromKeyboard, ownsActivationKey } from "./keyboardMap";

const REPEATS: ReadonlySet<KeyId> = new Set(["UP", "DOWN", "LEFT", "RIGHT", "DELETE"]);

export function useKeyboard(onKey: (key: KeyId) => void): void {
  const onKeyRef = useRef(onKey);
  useEffect(() => {
    onKeyRef.current = onKey;
  });

  useEffect(() => {
    // A calculator key reached with Tab: Enter / Space activate that key, as for any button.
    // A key focused by a click keeps Enter meaning "enter".
    let pointerFocus = false;
    let tabbedKey: EventTarget | null = null;
    const onPointerDown = () => {
      pointerFocus = true;
    };
    const onFocusIn = (e: FocusEvent) => {
      const t = e.target as HTMLElement | null;
      tabbedKey = !pointerFocus && t?.dataset?.calcKey != null ? t : null;
      pointerFocus = false;
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.defaultPrevented) return;
      const target = e.target as HTMLElement | null;
      if (isTypingTarget(target)) return;
      if ((e.key === "Enter" || e.key === " ") && (target === tabbedKey || ownsActivationKey(target))) return;
      const key = keyFromKeyboard(e);
      if (!key) return;
      tabbedKey = null;
      // Stop the browser's own handling: Enter re-clicking a focused key, "/" quick find, arrow scrolling.
      e.preventDefault();
      if (e.repeat && !REPEATS.has(key)) return;
      onKeyRef.current(key);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown, true);
    window.addEventListener("focusin", onFocusIn);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown, true);
      window.removeEventListener("focusin", onFocusIn);
    };
  }, []);
}
