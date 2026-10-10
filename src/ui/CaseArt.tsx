/**
 * The case, faceplate, notch, solar panel, wordmark, LCD window and all green 2nd printing, as one
 * SVG in device units (geometry.ts). The keys, the d-pad and the LCD contents are HTML layered on top.
 * The device keeps fixed colours, so it looks like the hardware in light and dark page themes.
 */
import { memo, type ReactNode } from "react";
import { KEY_BY_ID } from "../engine";
import {
  BODY_HALF, CAP_RECESS_HALF, COLORS, DEVICE_H, DEVICE_W, FACE, FACE_TOP_GLOW, GLASS_HALF, GLASS_RECESS, ON_RIB_PATH,
  SECOND_FONT, SECOND_LEGENDS, SILHOUETTE_HALF, SOLAR_DIVIDERS, SOLAR_HALF, WORDMARK, WORDMARK_LINE2, WORDMARK_MODEL,
  WORDMARK_PREFIX, DPAD, type FaceKeyId, type Pt,
} from "./geometry";
import { grow, mirrorHalf, polygonPath, smoothPath } from "./paths";

const SILHOUETTE = smoothPath(mirrorHalf(SILHOUETTE_HALF));
const BODY = smoothPath(mirrorHalf(BODY_HALF));
const FACE_PATH = smoothPath(FACE);
const CAP_RECESS = smoothPath(mirrorHalf(CAP_RECESS_HALF));
/** The recess's lit lower lip (render y 162–165 at the centre, 167–169 at x 840). */
const CAP_LIP = smoothPath([[250, 77.5], [292, 74.8], [350, 72.4], [412, 71.4], [474, 72.4], [532, 74.8], [574, 77.5]], false);
const SOLAR = smoothPath(mirrorHalf(SOLAR_HALF));
const SOLAR_BEVEL = smoothPath(grow(mirrorHalf(SOLAR_HALF), 9, 9, 14));
const GLASS_PTS = mirrorHalf(GLASS_HALF);
const GLASS = smoothPath(GLASS_PTS);
const GLASS_RECESS_PATH = smoothPath(grow(GLASS_PTS, GLASS_RECESS.side, GLASS_RECESS.top, GLASS_RECESS.bottom));
/** The cap's lower edge, offset down by half the glow depth: the faceplate's lit top band follows it. */
const GLOW_PATH = smoothPath(
  mirrorHalf([[412, 88], [308.5, 90.6], [200.8, 98.1], [117, 107.5], [104, 112]]).map(([x, y]) => [x, y + FACE_TOP_GLOW.depth / 2] as Pt),
  false,
);

/** Italic serif for math letters (x, n), as printed on the device. */
const MATH_FONT = "'STIX Two Text', 'Times New Roman', serif";
const SANS = "'Source Sans 3 Variable', 'Source Sans 3', 'Myriad Pro', 'Segoe UI', sans-serif";

const tri = (cx: number, cy: number, w: number, h: number, dir: "left" | "right") =>
  polygonPath(dir === "left" ? [[cx - w / 2, cy], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2]] : [[cx + w / 2, cy], [cx - w / 2, cy - h / 2], [cx - w / 2, cy + h / 2]]);

/** A small stacked n/d (sans), centred on x, with its bar `barDy` above the baseline. */
function stackedFraction(x: number, baseline: number): ReactNode {
  return (
    <g>
      <text x={x} y={baseline - 17} fontSize={15} fontWeight={700} textAnchor="middle">
        n
      </text>
      <rect x={x - 5.5} y={baseline - 12.5} width={11} height={1.8} />
      <text x={x} y={baseline + 3} fontSize={15} fontWeight={700} textAnchor="middle">
        d
      </text>
    </g>
  );
}

/** A radical sign: tick, stem and overbar (render: stroke ≈ 3.2 units). */
const radical = (pts: Pt[]) => <path d={`M${pts.map((p) => p.join(",")).join("L")}`} fill="none" stroke="currentColor" strokeWidth={3.2} strokeLinejoin="round" strokeLinecap="round" />;

/** The contrast symbol ◑: a ring with its right half filled. */
const halfDisc = (cx: number, cy: number, r: number) => (
  <g>
    <circle cx={cx} cy={cy} r={r - 1.2} fill="none" stroke="currentColor" strokeWidth={2.4} />
    <path d={`M${cx},${cy - r}A${r},${r} 0 0 1 ${cx},${cy + r}Z`} />
  </g>
);

/**
 * One green legend. Offsets are device units from the legend's measured centre (cx) and baseline,
 * measured on the render's green-pixel components (see geometry.ts SECOND_LEGENDS).
 */
function secondLegend(id: FaceKeyId, cx: number, b: number): ReactNode {
  const fn = KEY_BY_ID[id].second?.fn;
  const label = KEY_BY_ID[id].second?.label ?? "";
  const sup = (s: string) => (
    <tspan dy={-11} fontSize={20} fontWeight={600}>
      {s}
    </tspan>
  );
  switch (fn) {
    case "TEN_X":
      // "10" x 745–767; italic x 768–782 raised 10 units
      return (
        <g>
          <text x={cx + 4.5} y={b} textAnchor="end">
            10
          </text>
          <text x={cx + 6} y={b - 10} fontFamily={MATH_FONT} fontStyle="italic" fontWeight={500} fontSize={24}>
            x
          </text>
        </g>
      );
    case "E_X":
      return (
        <g>
          <text x={cx - 1} y={b} textAnchor="end">
            e
          </text>
          <text x={cx} y={b - 9} fontFamily={MATH_FONT} fontStyle="italic" fontWeight={500} fontSize={27}>
            x
          </text>
        </g>
      );
    case "MIXED":
      // U x 866–879, n/d centred at 889.5
      return (
        <g>
          <text x={cx - 1} y={b} textAnchor="end">
            U
          </text>
          {stackedFraction(cx + 9.5, b)}
        </g>
      );
    case "FRAC_CONV":
      // n/d ◂▸ U n/d (the KeySpec order, which TI's photo shows); pieces spaced as on the render
      return (
        <g>
          {stackedFraction(cx - 36.5, b)}
          <path d={tri(cx - 16, b - 11, 12, 12, "left")} />
          <path d={tri(cx + 2, b - 11, 12, 12, "right")} />
          <text x={cx + 27} y={b} textAnchor="end">
            U
          </text>
          {stackedFraction(cx + 37.5, b)}
        </g>
      );
    case "F_D":
      // f 1090–1100, ◀ 1105–1118, ▶ 1124–1136, d 1138–1152 (y 1036–1048 for the triangles)
      return (
        <g>
          <text x={cx - 31} y={b}>
            f
          </text>
          <path d={tri(cx - 9.5, b - 11, 13, 12, "left")} />
          <path d={tri(cx + 9, b - 11, 12, 12, "right")} />
          <text x={cx + 17} y={b}>
            d
          </text>
        </g>
      );
    case "ASIN":
    case "ACOS":
    case "ATAN":
      return (
        <text x={cx} y={b} textAnchor="middle">
          {label.replace("⁻¹", "")}
          {sup("-1")}
        </text>
      );
    case "NTH_ROOT":
      // small italic x (741–757, bottom 1238) over the radical's tick
      return (
        <g>
          <text x={cx - 24} y={b - 9} fontFamily={MATH_FONT} fontStyle="italic" fontWeight={500} fontSize={25}>
            x
          </text>
          {radical([[cx - 15.5, b - 9.5], [cx - 12, b - 11], [cx - 6, b], [cx + 2, b - 19], [cx + 22, b - 19]])}
        </g>
      );
    case "SQRT":
      return radical([[cx - 14, b - 8], [cx - 10, b - 10], [cx - 3, b], [cx + 3, b - 14], [cx + 16, b - 14]]);
    case "TO_PERCENT":
      return (
        <g>
          <path d={tri(cx - 11.5, b - 7, 12, 12, "right")} />
          <text x={cx - 2.5} y={b}>
            %
          </text>
        </g>
      );
    case "CONTRAST_LIGHTER":
      return (
        <g>
          <path d={tri(cx - 11.5, b - 9.5, 9, 9, "left")} />
          {halfDisc(cx + 6, b - 10, 10)}
        </g>
      );
    case "CONTRAST_DARKER":
      return (
        <g>
          {halfDisc(cx - 6.5, b - 10, 10)}
          <path d={tri(cx + 12, b - 10, 9, 10, "right")} />
        </g>
      );
    default:
      return (
        <text x={cx} y={b} textAnchor="middle">
          {label}
        </text>
      );
  }
}

export const CaseArt = memo(function CaseArt() {
  return (
    <svg className="dv-case" viewBox={`0 0 ${DEVICE_W} ${DEVICE_H}`} aria-hidden="true" focusable="false">
      <defs>
        {/* The cap colour on top, the feet darker at the bottom; the middle is covered by the body. */}
        <linearGradient id="dv-sil" x1="0" x2="0" y1="0" y2={DEVICE_H} gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#3a3a3a" />
          <stop offset="0.004" stopColor="#2c2c2c" />
          <stop offset="0.03" stopColor={COLORS.cap} />
          <stop offset="0.97" stopColor="#1e1e1e" />
          <stop offset="1" stopColor={COLORS.feet} />
        </linearGradient>
        {/* Case sides: #cecece at the outer edge to #d5d5d5 (render y = 1000 profile). */}
        <linearGradient id="dv-body" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#c9c9c9" />
          <stop offset="0.012" stopColor="#d0d0d0" />
          <stop offset="0.06" stopColor="#d5d5d5" />
          <stop offset="0.94" stopColor="#d6d6d6" />
          <stop offset="0.988" stopColor="#d0d0d0" />
          <stop offset="1" stopColor="#c9c9c9" />
        </linearGradient>
        {/* The case darkens towards its curved bottom (#afafaf beside the faceplate at y 1700). */}
        <linearGradient id="dv-body-shade" x1="0" x2="0" y1="1500" y2="1790" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.16" />
        </linearGradient>
        <linearGradient id="dv-face" x1="0" x2="0" y1="88" y2="1747" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor={COLORS.faceTop} />
          <stop offset="0.5" stopColor={COLORS.faceMid} />
          <stop offset="0.86" stopColor="#415f6f" />
          <stop offset="0.95" stopColor="#38505d" />
          <stop offset="1" stopColor={COLORS.faceBottom} />
        </linearGradient>
        <linearGradient id="dv-recess" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor={COLORS.recessTop} />
          <stop offset="0.08" stopColor="#2b424c" />
          <stop offset="0.5" stopColor="#3f5b69" />
          <stop offset="0.93" stopColor="#5f7e90" />
          <stop offset="1" stopColor={COLORS.recessBottom} />
        </linearGradient>
        {/* Glass: the real unit's yellow-green (≈ #9FA985), shaded under the window's top edge. */}
        <linearGradient id="dv-glass" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7d8569" />
          <stop offset="0.05" stopColor="#8e967a" />
          <stop offset="0.2" stopColor="#a0a888" />
          <stop offset="0.6" stopColor="#a5ad8d" />
          <stop offset="1" stopColor="#9ba283" />
        </linearGradient>
        <linearGradient id="dv-solar-bevel" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#273946" />
          <stop offset="0.55" stopColor="#3a5463" />
          <stop offset="0.86" stopColor={COLORS.solarBevel} />
          <stop offset="1" stopColor="#6d8d9c" />
        </linearGradient>
        <linearGradient id="dv-solar-shade" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1d2a33" />
          <stop offset="0.07" stopColor="#0d0407" />
          <stop offset="0.5" stopColor={COLORS.solar} />
          <stop offset="1" stopColor="#170e0f" />
        </linearGradient>
        <radialGradient id="dv-notch" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0.82" stopColor="#fff" stopOpacity="0" />
          <stop offset="0.9" stopColor="#fff" stopOpacity="0.55" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
        <clipPath id="dv-face-clip">
          <path d={FACE_PATH} />
        </clipPath>
        <filter id="dv-glow" x="-5%" y="-50%" width="110%" height="200%">
          <feGaussianBlur stdDeviation="2.2" />
        </filter>
        <filter id="dv-soft" x="-5%" y="-50%" width="110%" height="200%">
          <feGaussianBlur stdDeviation="3" />
        </filter>
      </defs>

      {/* Case: silhouette (cap and feet colour), grey body, faceplate */}
      <path d={SILHOUETTE} fill="url(#dv-sil)" />
      <path d={BODY} fill="url(#dv-body)" />
      <path d={BODY} fill="url(#dv-body-shade)" />
      <path d={CAP_RECESS} fill={COLORS.capRecess} stroke="#0a0a0a" strokeWidth={2} />
      <path d={CAP_LIP} fill="none" stroke="#4a4a4a" strokeWidth={2} />

      {/* The pale rim where the case meets the faceplate (half of this stroke is covered by the face) */}
      <path d={FACE_PATH} fill="none" stroke={COLORS.faceRim} strokeWidth={6} strokeLinejoin="round" />
      <path d={FACE_PATH} fill="url(#dv-face)" />
      <g clipPath="url(#dv-face-clip)">
        <path d={GLOW_PATH} fill="none" stroke={FACE_TOP_GLOW.color} strokeWidth={FACE_TOP_GLOW.depth} strokeOpacity={0.85} filter="url(#dv-glow)" />
        {/* the lower curve is in shadow at its very edge */}
        <path d={FACE_PATH} fill="none" stroke="#1d2f3a" strokeOpacity={0.45} strokeWidth={5} filter="url(#dv-soft)" />
      </g>
      <path d={FACE_PATH} fill="none" stroke="#2a3c47" strokeOpacity={0.7} strokeWidth={1.4} />

      {/* Notch: a raised lip round the d-pad */}
      <ellipse cx={DPAD.cx} cy={DPAD.cy} rx={DPAD.rx + 22} ry={DPAD.ry + 20} fill="url(#dv-notch)" />

      {/* Raised rib beside the "on" key */}
      <path d={ON_RIB_PATH} fill="none" stroke="#22343f" strokeOpacity={0.6} strokeWidth={6.5} strokeLinecap="round" transform="translate(0.8 2.2)" />
      <path d={ON_RIB_PATH} fill="none" stroke="#6d8b9d" strokeWidth={5} strokeLinecap="round" />

      {/* Solar panel */}
      <path d={SOLAR_BEVEL} fill="url(#dv-solar-bevel)" />
      <path d={SOLAR} fill="url(#dv-solar-shade)" />
      <g stroke={COLORS.solarDivider} strokeWidth={2}>
        {SOLAR_DIVIDERS.map((x) => (
          <line key={x} x1={x} x2={x} y1={256} y2={350} />
        ))}
      </g>

      {/* Wordmark (our own model name, in the device's position and style; geometry.ts WORDMARK) */}
      <text
        x={WORDMARK.cx}
        y={WORDMARK.line1.baseline}
        textAnchor="middle"
        fill={WORDMARK.color}
        fontFamily={SANS}
        fontSize={WORDMARK.line1.cap / 0.66}
        data-testid="wordmark"
      >
        <tspan fontWeight={400}>{WORDMARK_PREFIX}</tspan>
        <tspan fontWeight={900} dx={WORDMARK.line1.gap}>
          {WORDMARK_MODEL}
        </tspan>
      </text>
      <text
        x={WORDMARK.line2.x0}
        y={WORDMARK.line2.baseline}
        textLength={WORDMARK.line2.x1 - WORDMARK.line2.x0}
        lengthAdjust="spacing"
        fill={WORDMARK.color}
        fontFamily={SANS}
        fontStyle="italic"
        fontWeight={400}
        fontSize={WORDMARK.line2.cap / 0.66}
      >
        {WORDMARK_LINE2}
      </text>

      {/* LCD window: recess, then glass */}
      <path d={GLASS_RECESS_PATH} fill="url(#dv-recess)" />
      <path d={GLASS} fill="url(#dv-glass)" />

      {/* Green 2nd legends */}
      <g className="dv-second" fill={COLORS.second} color={COLORS.second} fontFamily={SANS} fontWeight={SECOND_FONT.weight} fontSize={SECOND_FONT.size}>
        {(Object.keys(SECOND_LEGENDS) as FaceKeyId[]).map((id) => {
          const pos = SECOND_LEGENDS[id]!;
          return (
            <g key={id} data-second={KEY_BY_ID[id].second?.fn}>
              {secondLegend(id, pos.cx, pos.baseline)}
            </g>
          );
        })}
      </g>
    </svg>
  );
});
