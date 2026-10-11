/**
 * The device: case art (SVG), the LCD contents and the keypad (HTML), all laid out in device units
 * from geometry.ts so the proportions are exact at any size. The shell is the size container: one
 * device unit is 100 / 824 cqw. The key tip bubble is positioned in the shell, over the device.
 */
import { memo, useCallback, useEffect, useRef, useState } from "react";
import type { KeyId } from "../engine";
import type { Frame } from "../display/render";
import { CaseArt } from "./CaseArt";
import { DEVICE_W, DPAD, GLASS_BOX, GLASS_RECESS, WORDMARK_LINE2, WORDMARK_MODEL, WORDMARK_PREFIX } from "./geometry";
import { KeyTip, type KeyTipAnchor } from "./KeyTip";
import { Keypad, type OnTip } from "./Keypad";
import { Lcd } from "./Lcd";
import "./fonts";
import "./device.css";

export const DEVICE_NAME = `${WORDMARK_PREFIX}${WORDMARK_MODEL} ${WORDMARK_LINE2}`;

/** A long-press tip closes on its own after this long (or at the next touch). */
const TOUCH_TIP_MS = 3500;
/** Bottom of the LCD window and its recess, in device units: a tip above a key stops short of it. */
const LCD_BOTTOM = GLASS_BOX.y + GLASS_BOX.h + GLASS_RECESS.bottom;
/** Margin round an arrow-pad triangle, in device units, so the tip's pointer clears the arrow. */
const ARROW_PAD = 8;

export interface CalculatorProps {
  frame: Frame;
  /** the screen as text (live region) */
  text: string;
  onPress: (id: KeyId) => void;
  flash: { id: KeyId; n: number } | null;
  /** The "Key tips" switch: show a key's tip on hover, long-press or keyboard focus. */
  tipsEnabled: boolean;
}

export const Calculator = memo(function Calculator({ frame, text, onPress, flash, tipsEnabled }: CalculatorProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const deviceRef = useRef<HTMLElement>(null);
  const [tip, setTip] = useState<KeyTipAnchor | null>(null);
  const touchTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const tipsOn = useRef(tipsEnabled);

  const onTip = useCallback<OnTip>((req, closeId) => {
    if (!req && closeId) {
      // A key's blur or mouse leave closes only that key's tip (focus moving after a long-press must not close it).
      setTip((t) => (t?.id === closeId ? null : t));
      return;
    }
    clearTimeout(touchTimer.current);
    const shell = shellRef.current;
    const device = deviceRef.current;
    if (!req || !shell || !device || !tipsOn.current) {
      setTip(null);
      return;
    }
    const s = shell.getBoundingClientRect();
    const d = device.getBoundingClientRect();
    const unit = d.width / DEVICE_W;
    const ox = d.left - s.left;
    const oy = d.top - s.top;
    let x: number, top: number, bottom: number;
    const arrow = DPAD.arrows[req.id as keyof typeof DPAD.arrows];
    if (arrow) {
      // An arrow-pad button covers the whole pad: point at its own triangle.
      const xs = arrow.map((p) => p[0]);
      const ys = arrow.map((p) => p[1]);
      x = ox + ((Math.min(...xs) + Math.max(...xs)) / 2) * unit;
      top = oy + (Math.min(...ys) - ARROW_PAD) * unit;
      bottom = oy + (Math.max(...ys) + ARROW_PAD) * unit;
    } else {
      const k = (req.el.querySelector(".dv-face") ?? req.el).getBoundingClientRect();
      x = k.left - s.left + k.width / 2;
      top = k.top - s.top;
      bottom = k.bottom - s.top;
    }
    setTip({ id: req.id, x, top, bottom, shellWidth: s.width, lcdBottom: oy + LCD_BOTTOM * unit });
    if (req.via === "touch") touchTimer.current = setTimeout(() => setTip(null), TOUCH_TIP_MS);
  }, []);

  // A touch anywhere else dismisses a long-press tip.
  useEffect(() => {
    if (!tip) return;
    const dismiss = (e: PointerEvent) => {
      if (e.pointerType !== "mouse") setTip(null);
    };
    window.addEventListener("pointerdown", dismiss);
    return () => window.removeEventListener("pointerdown", dismiss);
  }, [tip]);

  useEffect(() => () => clearTimeout(touchTimer.current), []);

  // Turning the switch off closes a tip that is open (and ignores one that was about to open).
  useEffect(() => {
    tipsOn.current = tipsEnabled;
    if (tipsEnabled) return;
    clearTimeout(touchTimer.current);
    setTip(null);
  }, [tipsEnabled]);

  return (
    <div className="dv-shell" ref={shellRef}>
      <section className="dv-device" ref={deviceRef} aria-label={`${DEVICE_NAME} calculator`} data-testid="device">
        <CaseArt />
        <Lcd frame={frame} text={text} />
        <Keypad onPress={onPress} flash={flash} secondActive={frame.indicators.includes("2nd")} onTip={onTip} tipsEnabled={tipsEnabled} />
      </section>
      <KeyTip tip={tip} />
    </div>
  );
});
