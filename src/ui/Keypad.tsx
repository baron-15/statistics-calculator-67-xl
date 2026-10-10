/**
 * The keys: absolutely positioned HTML buttons over the case art. Each button is the key's hit area
 * (HIT_BOXES: its column, half-way to the keys around it); the visible key face inside it keeps the
 * measured box exactly. The arrow pad is one oval split into four triangular hit zones.
 */
import { memo, useEffect, useId, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from "react";
import { ALL_KEYS, type KeyId, type KeySpec } from "../engine";
import {
  DPAD, DPAD_HIT, HIT_BOXES, KEY_BOXES, LEGEND, SHAPE_RADII, cqw, pctX, pctY, type FaceKeyId, type HitBox, type KeyBox,
} from "./geometry";
import { KEYBOARD_HINTS } from "./keyboardMap";
import { polygonPath } from "./paths";

export interface KeypadProps {
  onPress: (id: KeyId) => void;
  /** The key to animate as pressed (keyboard input); n changes on every press. */
  flash: { id: KeyId; n: number } | null;
  secondActive: boolean;
}

const ARROWS: readonly KeyId[] = ["UP", "DOWN", "LEFT", "RIGHT"];
/** Keys whose legend is drawn in an SVG covering the whole face (symbolSvg), placed at measured offsets. */
const SYMBOL_KEYS: ReadonlySet<KeyId> = new Set(["DIVIDE", "MULTIPLY", "SUBTRACT", "ADD", "POWER", "TOGGLE", "DOT", "FRAC", "EE", "PI", "RECIP", "SQUARE", "VAR"]);

/** CSS border-radius from the measured per-corner radii, as percentages of the key box. */
function radius(box: KeyBox): string {
  const r = SHAPE_RADII[box.shape];
  const xs = r.map(([rx]) => `${((rx / box.w) * 100).toFixed(2)}%`).join(" ");
  const ys = r.map(([, ry]) => `${((ry / box.h) * 100).toFixed(2)}%`).join(" ");
  return `${xs} / ${ys}`;
}

/** Position of an inner box relative to an outer one, as percentages. */
function within(outer: HitBox, inner: { x: number; y: number; w: number; h: number }): CSSProperties {
  return {
    left: `${((inner.x - outer.x) / outer.w) * 100}%`,
    top: `${((inner.y - outer.y) / outer.h) * 100}%`,
    width: `${(inner.w / outer.w) * 100}%`,
    height: `${(inner.h / outer.h) * 100}%`,
  };
}

const u = (n: number) => cqw(n);
/**
 * Drawn symbols (device units, centred on the key): the operators, the caret, the ◂▸ triangles and
 * the sto arrow are wider and heavier than any font's glyphs at the legend size. Sizes are the
 * render's ink boxes: ÷ 27 × 26, × 22 × 23, − 27 × 5, + 27 × 25, ^ 30 × 13, ◀ ▶ 20 × 15.
 */
function symbolSvg(box: KeyBox, children: ReactNode, dy = 0, dx = 0): ReactNode {
  return (
    <svg className="dv-symbol" viewBox={`${-box.w / 2 - dx} ${-box.h / 2 - dy} ${box.w} ${box.h}`} aria-hidden="true" focusable="false">
      {children}
    </svg>
  );
}

function legend(spec: KeySpec, box: KeyBox): ReactNode {
  const word = (s: string) => <span style={{ fontSize: u(LEGEND.word) }}>{s}</span>;
  switch (spec.id) {
    case "DIVIDE":
      return symbolSvg(
        box,
        <>
          <rect x={-13.5} y={-1.9} width={27} height={3.8} />
          <circle cx={0} cy={-9.3} r={3} />
          <circle cx={0} cy={9.3} r={3} />
        </>,
        -1,
        3,
      );
    case "MULTIPLY":
      return symbolSvg(box, <path d="M-10.8,-10.8L10.8,10.8M-10.8,10.8L10.8,-10.8" fill="none" strokeWidth={4.2} />, -2.5, 2.5);
    case "SUBTRACT":
      return symbolSvg(box, <rect x={-13.5} y={-2.6} width={27} height={5.2} />, -1.5, 1);
    case "ADD":
      return symbolSvg(
        box,
        <>
          <rect x={-13.5} y={-2.3} width={27} height={4.6} />
          <rect x={-2.3} y={-12.5} width={4.6} height={25} />
        </>,
        -2.5,
        1,
      );
    case "POWER":
      return symbolSvg(box, <path d="M-13,5L0,-6L13,5" fill="none" strokeWidth={4.4} strokeLinejoin="miter" />, 0, -0.5);
    case "TOGGLE":
      return symbolSvg(
        box,
        <>
          <path d={polygonPath([[-20, 0], [-5, -7.5], [-5, 7.5]])} />
          <path d={polygonPath([[19, 0], [4, -7.5], [4, 7.5]])} />
        </>,
        1.5,
      );
    case "DOT":
      return symbolSvg(box, <circle cx={0} cy={15} r={3.6} />);
    // Math legends: SVG text at the render's measured ink positions (dx, baseline) from the key centre.
    case "FRAC":
      // n: ink x 870–887, y 1071–1082; bar y 1091–1092 × 20; d: y 1094–1111 (key centre 878.5, 1093)
      return symbolSvg(
        box,
        <g className="dv-svg-sans" textAnchor="middle">
          <text x={0} y={-11} fontSize={23}>
            n
          </text>
          <rect x={-10} y={-2.5} width={20} height={2.2} />
          <text x={0} y={18} fontSize={24}>
            d
          </text>
        </g>,
      );
    case "EE":
      // x: ink 975–985 (baseline 1103); 10: 990–1015 (baseline 1106, 22 tall); n: 1016–1029 (baseline 1095)
      return symbolSvg(
        box,
        <g className="dv-svg-sans">
          <text x={-20} y={9} fontSize={25} textAnchor="middle">
            x
          </text>
          <text x={2.5} y={12} fontSize={34} fontWeight={600} textAnchor="middle">
            10
          </text>
          <text className="dv-svg-math" x={22.5} y={1} fontSize={25} textAnchor="middle">
            n
          </text>
        </g>,
      );
    case "PI":
      // ink x 745–770, y 1182–1201 (key centre 756, 1187.5)
      return symbolSvg(
        box,
        <text className="dv-svg-math" x={-0.5} y={13} fontSize={41} textAnchor="middle">
          π
        </text>,
      );
    case "RECIP":
      // x: ink 855–878, baseline 1300; -1: ink 880–896, baseline 1287 (key centre 878, 1287.5)
      return symbolSvg(
        box,
        <g textAnchor="middle">
          <text className="dv-svg-math" x={-11.5} y={12.5} fontSize={39}>
            x
          </text>
          <text className="dv-svg-sans" x={10} y={-0.5} fontSize={22}>
            -1
          </text>
        </g>,
      );
    case "SQUARE":
      // x: ink 744–768, baseline 1396; 2: ink 768–783, baseline 1383 (key centre 756.5, 1384)
      return symbolSvg(
        box,
        <g textAnchor="middle">
          <text className="dv-svg-math" x={-2.5} y={12} fontSize={46}>
            x
          </text>
          <text className="dv-svg-sans" x={15} y={2} fontSize={26}>
            2
          </text>
        </g>,
      );
    case "VAR":
      // x: ink 721–741, baseline 1500; yzt: 744–790, baseline 1484; abc: 743–785, baseline 1508 (centre 756, 1489)
      return symbolSvg(
        box,
        <g className="dv-svg-math" textAnchor="middle">
          <text x={-25} y={11} fontSize={46}>
            x
          </text>
          <text x={11} y={-5} fontSize={27} textLength={44} lengthAdjust="spacing">
            yzt
          </text>
          <text x={8} y={19} fontSize={27} textLength={40} lengthAdjust="spacing">
            abc
          </text>
        </g>,
      );
    case "STO":
      return (
        <span className="dv-sto" style={{ position: "relative", left: u(2) }}>
          {word("sto")}
          {/* a block arrow: stem 9 × 7, head 12 wide × 17 tall (render x 767–788, y 1585–1602) */}
          <svg className="dv-sto-arrow" viewBox="0 0 21 17" aria-hidden="true" focusable="false">
            <path d="M0,5H9V0L21,8.5L9,17V12H0Z" />
          </svg>
        </span>
      );
    // Parentheses: 24 tall, thin; ")" sits 4 units right of its key's centre (render ink 534–541)
    case "LPAREN":
      return <span style={{ fontSize: u(28), fontWeight: 600, position: "relative", top: u(-2.5) }}>(</span>;
    case "RPAREN":
      return <span style={{ fontSize: u(28), fontWeight: 600, position: "relative", left: u(4), top: u(-2.5) }}>)</span>;
    // "(−)": ink x 509–550 (4.5 left of the key centre), parentheses 27 tall
    case "NEG":
      return (
        <span className="dv-neg" style={{ fontSize: u(32), fontWeight: 600, position: "relative", left: u(-4.5) }}>
          (<span className="dv-neg-bar" />)
        </span>
      );
    // "enter" is printed lighter than the function-key words
    case "ENTER":
      return <span style={{ fontSize: u(27.5), fontWeight: 600 }}>enter</span>;
    // "on" is printed larger than the other words (x-height 17 against 14)
    case "ON":
      return <span style={{ fontSize: u(31), position: "relative", top: u(-2) }}>on</span>;
    default:
      if (spec.kind === "digit") {
        // on the keys rounded on the outside, the digit sits towards the block's centre
        const nudge = box.shape === "digitL" ? LEGEND.digitInset : box.shape === "digitR" ? -LEGEND.digitInset - 1 : 0;
        return <span style={{ fontSize: u(LEGEND.digit), position: "relative", left: u(nudge) }}>{spec.label}</span>;
      }
      return word(spec.label);
  }
}

function useFlash(ref: RefObject<HTMLElement | null>, n: number) {
  useEffect(() => {
    if (!n) return;
    ref.current?.animate?.(
      [
        { transform: "translateY(0)", filter: "brightness(1)" },
        { transform: `translateY(${u(2)})`, filter: "brightness(0.8)", offset: 0.35 },
        { transform: "translateY(0)", filter: "brightness(1)" },
      ],
      { duration: 180, easing: "ease-out" },
    );
  }, [n, ref]);
}

interface KeyProps {
  spec: KeySpec;
  flashN: number;
  pressed2nd: boolean;
  onPress: (id: KeyId) => void;
}

const Key = memo(function Key({ spec, flashN, pressed2nd, onPress }: KeyProps) {
  const id = spec.id as FaceKeyId;
  const box = KEY_BOXES[id];
  const hit = HIT_BOXES[id];
  const faceRef = useRef<HTMLSpanElement>(null);
  const descId = useId();
  useFlash(faceRef, flashN);
  const second = spec.second?.label ? `2nd: ${spec.second.label}` : null;
  const lift = spec.kind === "digit" ? -LEGEND.digitDrop : LEGEND.wordLift;
  return (
    <div className="dv-cell" style={{ left: pctX(hit.x), top: pctY(hit.y), width: pctX(hit.w), height: pctY(hit.h) }}>
      {second && (
        <span id={descId} className="sr-only">
          {second}
        </span>
      )}
      <button
        type="button"
        className={`dv-key dv-key--${box.color} dv-shape--${box.shape} dv-kind--${spec.kind}`}
        aria-label={spec.aria}
        aria-pressed={spec.id === "2ND" ? pressed2nd : undefined}
        aria-describedby={second ? descId : undefined}
        aria-keyshortcuts={KEYBOARD_HINTS[spec.id]}
        data-calc-key={spec.id}
        onContextMenu={(e) => e.preventDefault()}
        onClick={() => onPress(spec.id)}
      >
        <span
          ref={faceRef}
          className="dv-face"
          style={{ ...within(hit, box), borderRadius: radius(box), ...(box.rotate ? { rotate: `${box.rotate}deg` } : {}) }}
        >
          {SYMBOL_KEYS.has(spec.id) ? (
            legend(spec, box)
          ) : (
            <span className="dv-legend" aria-hidden="true" style={{ top: u(-lift) }}>
              {legend(spec, box)}
            </span>
          )}
        </span>
      </button>
    </div>
  );
});

/** Clip polygons splitting the arrow pad's hit box into four triangles along its diagonals. */
const DPAD_CLIP: Record<string, string> = {
  UP: "polygon(0 0, 100% 0, 50% 50%)",
  RIGHT: "polygon(100% 0, 100% 100%, 50% 50%)",
  DOWN: "polygon(0 100%, 100% 100%, 50% 50%)",
  LEFT: "polygon(0 0, 50% 50%, 0 100%)",
};

const DPad = memo(function DPad({ onPress, flash }: { onPress: (id: KeyId) => void; flash: { id: KeyId; n: number } | null }) {
  const [held, setHeld] = useState<KeyId | null>(null);
  const [flashed, setFlashed] = useState<KeyId | null>(null);
  useEffect(() => {
    if (!flash || !ARROWS.includes(flash.id)) return;
    setFlashed(flash.id);
    const t = setTimeout(() => setFlashed(null), 170);
    return () => clearTimeout(t);
  }, [flash]);
  const active = held ?? flashed;
  const h = DPAD_HIT;
  const specs = ARROWS.map((a) => ALL_KEYS.find((s) => s.id === a)!);
  return (
    <div className="dv-dpad" data-pressed={active ?? undefined} style={{ left: pctX(h.x), top: pctY(h.y), width: pctX(h.w), height: pctY(h.h) }}>
      {specs.map((spec) => (
        <button
          key={spec.id}
          type="button"
          className={`dv-dpad-btn dv-dpad-btn--${spec.id.toLowerCase()}`}
          style={{ clipPath: DPAD_CLIP[spec.id] }}
          aria-label={spec.aria}
          aria-keyshortcuts={KEYBOARD_HINTS[spec.id]}
          data-calc-key={spec.id}
          onPointerDown={() => setHeld(spec.id)}
          onPointerUp={() => setHeld(null)}
          onPointerLeave={() => setHeld(null)}
          onPointerCancel={() => setHeld(null)}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => onPress(spec.id)}
        />
      ))}
      {/* after the buttons, so a focused button can highlight its arrow (device.css) */}
      <svg className="dv-dpad-art" viewBox={`${h.x} ${h.y} ${h.w} ${h.h}`} aria-hidden="true" focusable="false">
        <defs>
          <radialGradient id="dv-dpad-g" cx="0.5" cy="0.42" r="0.6">
            <stop offset="0" stopColor="#4d4d4e" />
            <stop offset="0.7" stopColor="#3c3c3d" />
            <stop offset="1" stopColor="#2a2a2b" />
          </radialGradient>
          <radialGradient id="dv-dpad-boss" cx="0.5" cy="0.35" r="0.7">
            <stop offset="0" stopColor="#5c5d5e" />
            <stop offset="1" stopColor="#4a4b4c" />
          </radialGradient>
        </defs>
        {/* drop shadow and rim */}
        <ellipse cx={DPAD.cx + 1} cy={DPAD.cy + 4} rx={DPAD.rx + 1} ry={DPAD.ry + 1.5} fill="#000" opacity={0.25} />
        <ellipse cx={DPAD.cx} cy={DPAD.cy} rx={DPAD.rx} ry={DPAD.ry} fill="#1b1b1c" />
        <g className="dv-dpad-top">
          <ellipse cx={DPAD.cx} cy={DPAD.cy - 1} rx={DPAD.rx - 5} ry={DPAD.ry - 5} fill="url(#dv-dpad-g)" />
          <ellipse cx={DPAD.cx} cy={DPAD.cy - 3} rx={DPAD.rx - 9} ry={DPAD.ry - 9} fill="none" stroke="#fff" strokeOpacity={0.08} strokeWidth={2} />
          <ellipse cx={DPAD.boss.cx} cy={DPAD.boss.cy} rx={DPAD.boss.rx} ry={DPAD.boss.ry} fill="url(#dv-dpad-boss)" />
          {ARROWS.map((a) => (
            <path key={a} className={`dv-arrow dv-arrow--${a.toLowerCase()}`} d={polygonPath(DPAD.arrows[a as keyof typeof DPAD.arrows])} />
          ))}
        </g>
      </svg>
    </div>
  );
});

export const Keypad = memo(function Keypad({ onPress, flash, secondActive }: KeypadProps) {
  return (
    <div className="dv-keypad" role="group" aria-label="Keypad">
      {ALL_KEYS.filter((s) => !ARROWS.includes(s.id)).map((spec) => (
        <Key key={spec.id} spec={spec} flashN={flash?.id === spec.id ? flash.n : 0} pressed2nd={spec.id === "2ND" && secondActive} onPress={onPress} />
      ))}
      <DPad onPress={onPress} flash={flash} />
    </div>
  );
});
