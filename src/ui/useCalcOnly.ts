/**
 * The "Calculator only" switch: hide every side block for a clean, native calculator page.
 * Off by default; remembered in this browser ("on" / "off").
 */
import { useStoredSwitch } from "./useStoredSwitch";

export const CALC_ONLY_STORAGE_KEY = "ti30xs:calcOnly";

export function useCalcOnly(): [boolean, (on: boolean) => void] {
  return useStoredSwitch(CALC_ONLY_STORAGE_KEY);
}
