/**
 * An on/off page setting remembered in this browser as "on" / "off" (the header switches). Every
 * storage access is guarded: in a private window or with storage blocked, the switch still works
 * for this visit.
 */
import { useCallback, useState } from "react";

export function readSwitch(storageKey: string, fallback = false): boolean {
  try {
    const saved = globalThis.localStorage?.getItem(storageKey);
    return saved === "on" ? true : saved === "off" ? false : fallback;
  } catch {
    return fallback;
  }
}

export function writeSwitch(storageKey: string, on: boolean): void {
  try {
    globalThis.localStorage?.setItem(storageKey, on ? "on" : "off");
  } catch {
    /* storage unavailable: the switch still works for this visit */
  }
}

export function useStoredSwitch(storageKey: string, fallback = false): [boolean, (on: boolean) => void] {
  const [on, setOn] = useState(() => readSwitch(storageKey, fallback));
  const set = useCallback(
    (next: boolean) => {
      setOn(next);
      writeSwitch(storageKey, next);
    },
    [storageKey],
  );
  return [on, set];
}
