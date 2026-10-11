/**
 * The "Key tips" switch: whether a key's tip opens on hover, long-press or keyboard focus.
 * Off by default; remembered in this browser ("on" / "off").
 */
import { useStoredSwitch } from "./useStoredSwitch";

export const KEY_TIPS_STORAGE_KEY = "ti30xs:keytips";

export function useKeyTips(): [boolean, (on: boolean) => void] {
  return useStoredSwitch(KEY_TIPS_STORAGE_KEY);
}
