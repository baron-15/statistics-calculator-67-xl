/**
 * The "Key tips" switch: whether a key's tip opens on hover, long-press or keyboard focus.
 * Off by default; remembered in this browser ("on" / "off").
 */
import { useCallback, useState } from "react";

export const KEY_TIPS_STORAGE_KEY = "ti30xs:keytips";

function readPref(): boolean {
  try {
    return globalThis.localStorage?.getItem(KEY_TIPS_STORAGE_KEY) === "on";
  } catch {
    return false;
  }
}

export function useKeyTips(): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(readPref);
  const set = useCallback((next: boolean) => {
    setOn(next);
    try {
      globalThis.localStorage?.setItem(KEY_TIPS_STORAGE_KEY, next ? "on" : "off");
    } catch {
      /* storage unavailable: the switch still works for this visit */
    }
  }, []);
  return [on, set];
}
