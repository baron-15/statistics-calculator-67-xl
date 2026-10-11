/**
 * The key tip bubble: the key's legend, name, what it does and an example, then its green 2nd
 * function below a divider, and the computer-keyboard shortcut. It opens above the key, or below
 * it when above would cover the LCD (the top rows and the arrow pad), and stays inside the device
 * column.
 */
import { Fragment, useLayoutEffect, useRef, useState } from "react";
import { KEY_BY_ID, type KeyId } from "../engine";
import { KEY_BOXES, type FaceKeyId } from "./geometry";
import { KEYBOARD_HINTS } from "./keyboardMap";
import { KEY_TIPS, SECOND_TIPS, type LegendSecondFn } from "./keyTips";

export interface KeyTipAnchor {
  id: KeyId;
  /** Horizontal centre of the key, in px from the shell's left edge */
  x: number;
  /** Top and bottom of the key, in px from the shell's top edge */
  top: number;
  bottom: number;
  shellWidth: number;
  /** Bottom of the LCD window: a tip placed above the key must not reach higher than this */
  lcdBottom: number;
}

const TIP_WIDTH = 288;
const GAP = 8;
const EDGE = 8;

const KEY_NAMES: Record<string, string> = {
  ArrowUp: "↑",
  ArrowDown: "↓",
  ArrowLeft: "←",
  ArrowRight: "→",
  Escape: "Esc",
};

/** The computer keys for a calculator key, readable: "Backspace Delete" → ["Backspace", "Delete"], "ArrowUp" → ["↑"]. */
export function keyboardKeys(id: KeyId): string[] {
  return (KEYBOARD_HINTS[id] ?? "")
    .split(" ")
    .filter(Boolean)
    .map((k) => KEY_NAMES[k] ?? k);
}

/** Chip colour: the key's own colour on the device. */
function chipColor(id: KeyId): string {
  return id in KEY_BOXES ? KEY_BOXES[id as FaceKeyId].color : "dark";
}

export function KeyTip({ tip }: { tip: KeyTipAnchor | null }) {
  const ref = useRef<HTMLDivElement>(null);
  const [below, setBelow] = useState(false);

  // Measure before paint: open above the key unless the bubble would then cover the LCD.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!tip || !el) return;
    setBelow(tip.top - GAP - el.offsetHeight < tip.lcdBottom);
  }, [tip]);

  if (!tip) return null;
  const spec = KEY_BY_ID[tip.id];
  const main = KEY_TIPS[tip.id];
  const second = spec.second?.label ? SECOND_TIPS[spec.second.fn as LegendSecondFn] : undefined;
  const kbd = keyboardKeys(tip.id);
  const width = Math.min(TIP_WIDTH, tip.shellWidth - 2 * EDGE);
  const left = Math.max(EDGE, Math.min(tip.shellWidth - width - EDGE, tip.x - width / 2));
  const arrow = Math.max(14, Math.min(width - 14, tip.x - left));
  const style = below ? { left, width, top: tip.bottom + GAP } : { left, width, top: tip.top - GAP, transform: "translateY(-100%)" };

  return (
    <div ref={ref} className={`dv-tip ${below ? "is-below" : "is-above"}`} style={style} role="tooltip" data-testid="key-tip" data-key={tip.id}>
      <span className="dv-tip-arrow" style={{ left: arrow }} />
      <div className="dv-tip-head">
        <span className={`dv-tip-key dv-tip-key--${chipColor(tip.id)}`}>{spec.label}</span>
        <span className="dv-tip-name">{main.name}</span>
      </div>
      <p className="dv-tip-does">{main.does}</p>
      <p className="dv-tip-ex">{main.example}</p>
      {second && spec.second && (
        <div className="dv-tip-second">
          <div className="dv-tip-head">
            <span className="dv-tip-key dv-tip-key--second">2nd {spec.second.label}</span>
            <span className="dv-tip-name dv-tip-name--second">{second.name}</span>
          </div>
          <p className="dv-tip-does">{second.does}</p>
          <p className="dv-tip-ex">{second.example}</p>
        </div>
      )}
      {kbd.length > 0 && (
        <p className="dv-tip-kbd">
          Keyboard:{" "}
          {kbd.map((k, i) => (
            <Fragment key={k}>
              {i > 0 && " or "}
              <kbd>{k}</kbd>
            </Fragment>
          ))}
        </p>
      )}
    </div>
  );
}
