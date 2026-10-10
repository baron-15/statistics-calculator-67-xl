/**
 * The device: case art (SVG), the LCD contents and the keypad (HTML), all laid out in device units
 * from geometry.ts so the proportions are exact at any size. The shell is the size container: one
 * device unit is 100 / 824 cqw.
 */
import { memo } from "react";
import type { KeyId } from "../engine";
import type { Frame } from "../display/render";
import { CaseArt } from "./CaseArt";
import { WORDMARK_LINE2, WORDMARK_MODEL, WORDMARK_PREFIX } from "./geometry";
import { Keypad } from "./Keypad";
import { Lcd } from "./Lcd";
import "./fonts";
import "./device.css";

export const DEVICE_NAME = `${WORDMARK_PREFIX}${WORDMARK_MODEL} ${WORDMARK_LINE2}`;

export interface CalculatorProps {
  frame: Frame;
  /** the screen as text (live region) */
  text: string;
  onPress: (id: KeyId) => void;
  flash: { id: KeyId; n: number } | null;
}

export const Calculator = memo(function Calculator({ frame, text, onPress, flash }: CalculatorProps) {
  return (
    <div className="dv-shell">
      <section className="dv-device" aria-label={`${DEVICE_NAME} calculator`} data-testid="device">
        <CaseArt />
        <Lcd frame={frame} text={text} />
        <Keypad onPress={onPress} flash={flash} secondActive={frame.indicators.includes("2nd")} />
      </section>
    </div>
  );
});
