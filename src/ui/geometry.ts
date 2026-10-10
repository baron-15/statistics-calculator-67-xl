/**
 * Measured geometry of the TI-30XS MultiView (solar), in device units.
 *
 * Source: TI's official 2000 × 2000 product render (`user-render.png`), cross-checked against TI's
 * 250 × 518 "key features" render and a real-unit photo (Wikimedia Commons `TI30XSMV.jpg`,
 * CC BY 4.0) for the LCD.
 *
 * Device units are pixels of the 2000-px render, with the origin at render pixel (588, 91): the
 * device's bounding box there is x 588–1411, y 91–1908, i.e. 824 × 1818 units (aspect 1 : 2.206; the
 * retail 7.2 × 3.3 in. gives 2.18). Every number below was measured with throwaway PIL/OpenCV
 * scripts (connected components, colour-class masks, Sobel-gradient key outlines, colour profiles,
 * gridded crops); the comment on each constant says how.
 *
 * Outlines are point lists traced from colour-class masks (contour → 2-px resampling → moving-average
 * smoothing → Douglas–Peucker at 0.7 px). `smoothPath` (paths.ts) runs a centripetal Catmull–Rom
 * spline through them; the rasterised spline differs from the mask by 0.25–0.4 px on average.
 * Symmetric outlines are stored as their left half (top centre → down the left side → bottom
 * centre) and mirrored about x = 412.
 */
import type { KeyId } from "../engine";

export const DEVICE_W = 824;
export const DEVICE_H = 1818;
/** The vertical axis of symmetry (render x = 1000). */
export const AXIS_X = 412;

/** Device units → percentage of the device width / height (absolute positioning). */
export const pctX = (u: number) => `${(u / DEVICE_W) * 100}%`;
export const pctY = (u: number) => `${(u / DEVICE_H) * 100}%`;
/** Device units → cqw of the device (font sizes; the device is the size container). */
export const cqw = (u: number) => `${(u / DEVICE_W) * 100}cqw`;

export type Pt = readonly [number, number];

// ---------------------------------------------------------------------------------------------
// Case

/**
 * Whole silhouette: grey sides, the black top cap with its raised tab (render y 91–204) and the
 * black feet under the bottom curve (y 1815–1908). Drawn first in the cap colour; the grey body and
 * the faceplate are drawn over it, so the cap and feet are what remains visible. Mask: every pixel
 * that is not the white background, holes filled, left half mirrored.
 */
export const SILHOUETTE_HALF: Pt[] = [
  [412, 0.5], [375.5, 0.5], [297.6, 2.9], [276.3, 8.5], [259, 18.3], [247.2, 29.1], [233.7, 46.5], [225.5, 55.2],
  [209.6, 67.4], [199.3, 73.4], [187.8, 77], [166.3, 81.3], [152.4, 81.1], [110.8, 86.3], [105.3, 88.8], [101.1, 93],
  [99.4, 96.6], [98.4, 106.5], [95.9, 109.5], [23, 122], [16, 125.6], [12.3, 132.6], [5.5, 308.4], [2.5, 432.3],
  [1.5, 550.3], [0.5, 566.3], [0.5, 810.3], [1.5, 826.3], [2.5, 938.3], [10.5, 1194], [22.5, 1475.7], [28.1, 1557.5],
  [34.4, 1590.9], [44.9, 1623.2], [55.7, 1646.8], [71.8, 1672.1], [91.1, 1695], [120.7, 1721.9], [135.9, 1740.5],
  [153.1, 1757.2], [175.4, 1774], [198, 1786.9], [208.9, 1791.8], [224.2, 1796.5], [267.1, 1806.2], [306.7, 1811.8],
  [370.5, 1816.5], [412, 1816.5],
];

/**
 * Light grey case body (#d5d5d5 sides): the silhouette minus the cap and the feet. Its top edge is
 * the cap's lower edge, which arches from y 107 at the cap ends to 88 at the centre.
 */
export const BODY_HALF: Pt[] = [
  [412, 88.5], [356.5, 88.6], [308.5, 90.6], [200.8, 98.1], [117.4, 107.5], [106.1, 111.4], [92.2, 110.8], [23.1, 121.9],
  [16.1, 125.5], [12.9, 130.6], [12, 134.5], [5.5, 308.3], [0.5, 566.3], [0.5, 810.3], [1.5, 826.3], [1.5, 882.3],
  [10.5, 1194.1], [15.5, 1326], [26.2, 1539.7], [29.6, 1567.5], [34.4, 1591], [44.2, 1621.5], [49.5, 1634.4],
  [58.8, 1652.2], [75.5, 1677], [96.8, 1700.8], [118.1, 1719.1], [146.7, 1737.4], [173.5, 1750.9], [207, 1764.1],
  [241.6, 1774], [272.9, 1780.4], [296.7, 1783.8], [314.6, 1782.5], [372.5, 1786.5], [412, 1786.5],
];

/**
 * Recessed panel on the cap's raised tab: a dark shadow line along its top and sloped sides
 * (render y 116 at the centre; x 848 at y 140, 833 at y 160) and a light lip along its bottom
 * (y 162–165 at the centre, 167–169 at x 840).
 */
export const CAP_RECESS_HALF: Pt[] = [
  [412, 25], [330, 25.3], [300, 26.2], [287, 28.5], [276, 34], [266, 43], [254, 57], [245.5, 69], [244, 74], [250, 77.5],
  [292, 74.8], [350, 72.4], [412, 71.4],
];

/** Under the cap's lower edge the faceplate catches the light: a pale blue band (#94b0be → #466474) about 14 units deep. */
export const FACE_TOP_GLOW = { depth: 12, color: "#94b0be" } as const;

// ---------------------------------------------------------------------------------------------
// Faceplate

/**
 * The blue faceplate (#466474 at the top, #446272 mid, darkening to #2d4350 along the curved
 * bottom), traced in full because of the notch: on the right, between y 740 and 933, the case's
 * light grey wraps round the d-pad. Mask: pixels left after removing the outer grey component, the
 * cap and the feet.
 */
export const FACE: Pt[] = [
  [115.4, 107.9], [110, 110.3], [107.6, 113.5], [106.6, 117.3], [91, 302.6], [73.7, 558], [71.2, 575.9], [60.6, 835.5],
  [58.5, 943.5], [56.5, 987.4], [56.5, 1189.5], [59.5, 1319.4], [71.1, 1537], [74.8, 1564.8], [80.4, 1588.1],
  [88.6, 1610.6], [100.4, 1633.8], [114.3, 1653.4], [133.8, 1673.4], [150.9, 1687.2], [171.4, 1699.7], [198.4, 1712.8],
  [238, 1726.6], [286.8, 1737.3], [322.5, 1741.8], [366.4, 1745.5], [418.4, 1746.5], [454.3, 1745.4], [508.1, 1740.8],
  [541.8, 1736.3], [586.7, 1726.3], [620.8, 1714.7], [651.5, 1700.2], [675.1, 1685.1], [695.1, 1668.5], [712.4, 1649.2],
  [729.7, 1622.3], [739.9, 1598.4], [748.5, 1567.6], [751.1, 1553.8], [755.5, 1494], [758.5, 1418.1], [763.5, 1332.2],
  [766.5, 1248.3], [765.5, 1222.3], [767.5, 1190.4], [767.5, 1062.4], [765.6, 956.4], [763.8, 946.6], [759, 937.8],
  [750, 930], [740.7, 926.3], [728.8, 925.5], [631, 932.5], [617, 932.5], [587.3, 928.7], [562.7, 920.6], [545.1, 911.1],
  [535.3, 904.2], [525.1, 894.5], [516.3, 883.7], [509.3, 871.6], [504.6, 858.4], [502.1, 846.7], [502, 834.7],
  [503.8, 822.9], [507, 811.3], [511.1, 802.2], [517.4, 792], [526.6, 781.4], [537.1, 772.2], [557.3, 759.3],
  [577.7, 751.2], [605.2, 746], [691, 740.6], [709, 740.5], [726.9, 738.3], [736.2, 734.9], [745.9, 727.8], [752.1, 720],
  [756, 710.8], [757.5, 698.9], [752.4, 585.1], [749.7, 559.2], [747.2, 509.3], [730.1, 268], [716.7, 114.6],
  [714.6, 111.2], [709.5, 108.2], [622.1, 98.1], [592.2, 96.7], [516.5, 90.5], [462.5, 88.5], [358.5, 88.5],
  [308.5, 90.6], [200.8, 98.1],
];

/**
 * Raised rib curving round the lower left of the "on" key (render (692, 1690) → (720, 1735) →
 * (775, 1745)): a pale blue moulding about 5 units wide with rounded ends.
 */
export const ON_RIB_PATH = "M104,1599 C103,1628 116,1647 148,1651 L186,1654";

// ---------------------------------------------------------------------------------------------
// Solar panel, wordmark, LCD

/**
 * Solar cell window: near-black (#150c0d) glass, render x 834–1166, y 342–445. The top corners are
 * rounded far more (r ≈ 38) than the bottom ones (r ≈ 12), and the sides lean in by 4 units, as the
 * render looks slightly down on it. A soft shadow falls inside its top edge; a pale bevel
 * (#86a0ad → faceplate over 12 units) runs under its bottom edge.
 */
export const SOLAR_HALF: Pt[] = [
  [412, 251.7], [285.5, 252], [271.9, 255.1], [261.6, 261.2], [254.2, 270.6], [250.4, 281.9], [247.1, 337.8], [249, 343.5],
  [252.6, 348.3], [257.5, 351.7], [261.3, 352.9], [269.3, 353.5], [412, 353.5],
];
/** Vertical cell dividers inside the solar window (local brightness peaks at render x 859, 915.5, 971.5, 1028, 1084.5, 1140.5). */
export const SOLAR_DIVIDERS = [271, 327.5, 383.5, 440, 496.5, 552.5] as const;

/**
 * The model wordmark, kept in the device's position and style but with our own name. Render: the
 * first line ("TI-30XS") has cap height 45 (y 230–276) and spans x 894–1096 (centre 995): a light
 * prefix then a black-weight "30XS". The second line ("MultiView") is a light italic, cap height 27
 * (y 288–315), letter-spaced over x 885–1108. Colour #d5d7d7.
 */
export const WORDMARK_PREFIX = "B-";
export const WORDMARK_MODEL = "30XS";
export const WORDMARK_LINE2 = "MultiView";
export const WORDMARK = {
  cx: 407,
  line1: { baseline: 185.5, cap: 44, gap: 1 },
  line2: { baseline: 224, cap: 26, x0: 297, x1: 520 },
  color: "#d5d7d7",
} as const;
/**
 * The maker's name and logo line (render y 455–495, x 800–1135) is intentionally left blank: we do
 * not reproduce the "Texas Instruments" name or the TI logo. The spacing is kept.
 */
export const MAKER_LINE_Y = { top: 364, bottom: 404 } as const;

/**
 * LCD glass: render x 700–1299, y 543–782 (device 112–712 × 452–691). Its top corners are tight
 * (r ≈ 14), the sides lean out by 9 units towards the bottom, and the bottom corners are wide
 * (r ≈ 35) with a bottom edge that bows down by 4 units. Mask: low-saturation pixels with
 * 110 < max < 215 connected to the glass centre, excluding the bluish bevel below it.
 */
export const GLASS_HALF: Pt[] = [
  [412, 452.5], [136.4, 452.5], [128.8, 454.4], [125.7, 456.9], [123.8, 460.4], [122.5, 468.3], [116.5, 572.1],
  [113.3, 646], [115.4, 657.8], [120.8, 668.4], [129.2, 677], [139.9, 682.2], [149.7, 684.4], [181.6, 686.4],
  [253.6, 687.8], [330, 689.4], [412, 690.5],
];
/** Bounding box of the glass (for the HTML LCD layer). */
export const GLASS_BOX = { x: 112, y: 452, w: 600, h: 239 } as const;
/**
 * The LCD window recess around the glass: a dark shadow above it (render y 526–541 at x 1000:
 * #405e6e → #111717) and a pale bevel below (y 782–794: #809ca7 → faceplate). Offsets of the
 * recess beyond the glass edge.
 */
export const GLASS_RECESS = { top: 14, side: 11, bottom: 14 } as const;

/**
 * The 96 × 31 dot matrix inside the glass. TI's render has a dot pitch of 5.62 px (the 5-dot-wide
 * "5" of the result spans x 1238–1266; its 7 rows span y 628–667) and the matrix's right edge at
 * x 1266 (column 95 of the right-aligned result), so its left edge is at 726.5 (device 139).
 * The render's composite drops the matrix to the very bottom of the glass, where the round corners
 * would clip it; we keep its width and leave the real unit's 2.9-pitch bottom margin
 * (display.md §2.3: 2.7), which puts the top at device 500.
 */
export const MATRIX = { x: 139, y: 500, pitch: 5.62, cols: 96, rows: 31 } as const;
export const MATRIX_W_U = MATRIX.pitch * MATRIX.cols;
export const MATRIX_H_U = MATRIX.pitch * MATRIX.rows;

/**
 * Indicator segments above the matrix (lcdIndicators.ts), in device units relative to the matrix
 * top. In the render, DEG spans x 1137–1171 (columns 73.0–79.1) and ↑↓ 1222–1252 (88.1–93.4),
 * matching the SmartView captures; its cap spans render y 570–585, i.e. its baseline is 6 units
 * above the matrix top. That art is SmartView's pixel font scaled up; on the real glass DEG is an
 * italic word about 2 pitches tall that fits columns 73–78 (display.md §2.2), so we set the cap at
 * 2.1 pitches and the baseline 1.3 pitches above the matrix.
 */
export const INDICATOR_BAND = { baseline: 7.3, cap: 11.8 } as const;

// ---------------------------------------------------------------------------------------------
// Keys

/**
 * Key shapes. Each key's outline was traced from the Sobel gradient ring round it (threshold swept
 * 3.5–8 until the ring closed), its box measured, and elliptical corner radii fitted per corner.
 * The fits cluster into classes:
 * - pill: function keys, 2nd, ÷ and × — 97 × 58, corners 25 / 29 (a stadium with flattened ends);
 * - tall: x², x^yzt_abc, sto▸, on, − and + — 97 × 69, corners 36 / 34 (egg-shaped);
 * - digit keys — 101 × 73: the outer side of the block is a half-oval (corners 40 / 36), the inner
 *   corners tight (9 / 16); so 7 4 1 0 round on the left, 9 6 3 (−) on the right, 8 5 2 . neither;
 * - oval: ◂▸ and enter — 102 × 76, corners 42 / 38, white tops inside a thick dark rim, tilted.
 */
export type KeyShape = "pill" | "tall" | "digitL" | "digitM" | "digitR" | "oval";
export type KeyColor = "blue" | "green" | "white" | "dark" | "ring";

export interface KeyBox {
  x: number;
  y: number;
  w: number;
  h: number;
  shape: KeyShape;
  color: KeyColor;
  /** degrees, clockwise */
  rotate?: number;
}

export const SHAPE_SIZE: Record<KeyShape, { w: number; h: number }> = {
  pill: { w: 97, h: 58 },
  tall: { w: 97, h: 69 },
  digitL: { w: 101, h: 73 },
  digitM: { w: 101, h: 73 },
  digitR: { w: 101, h: 73 },
  oval: { w: 102, h: 76 },
};

/** Per-corner radii [top-left, top-right, bottom-right, bottom-left] as [rx, ry] (device units). */
export const SHAPE_RADII: Record<KeyShape, readonly [Pt, Pt, Pt, Pt]> = {
  pill: [[25, 29], [25, 29], [25, 29], [25, 29]],
  tall: [[36, 34.5], [36, 34.5], [36, 34.5], [36, 34.5]],
  digitL: [[40, 36.5], [9, 14], [9, 18], [40, 36.5]],
  digitM: [[9, 14], [9, 14], [9, 18], [9, 18]],
  digitR: [[9, 14], [40, 36.5], [40, 36.5], [9, 18]],
  oval: [[42, 38], [42, 38], [42, 38], [42, 38]],
};

/**
 * Key centres in render pixels (from the traced outlines; the rows are not straight: the middle
 * columns sit 2–4 px lower, so every key keeps its own centre). Column centres: 756, 878, 1000,
 * 1121.5, 1243.5 (pitch 121.9).
 */
const CENTRES: Record<Exclude<KeyId, "UP" | "DOWN" | "LEFT" | "RIGHT">, [number, number, KeyShape, KeyColor, number?]> = {
  "2ND": [756, 898, "pill", "green"],
  MODE: [878, 898.5, "pill", "blue"],
  DELETE: [999.5, 899, "pill", "blue"],
  LOG: [755.5, 992, "pill", "blue"],
  PRB: [878, 994.5, "pill", "blue"],
  DATA: [1000, 995, "pill", "blue"],
  LN: [756.5, 1090, "pill", "blue"],
  FRAC: [878.5, 1093, "pill", "blue"],
  EE: [1000, 1094, "pill", "blue"],
  TABLE: [1121.5, 1093.5, "pill", "blue"],
  CLEAR: [1243.5, 1090, "pill", "blue"],
  PI: [756, 1187.5, "pill", "blue"],
  SIN: [878, 1191.5, "pill", "blue"],
  COS: [1000.5, 1193, "pill", "blue"],
  TAN: [1122, 1191.5, "pill", "blue"],
  DIVIDE: [1243.5, 1188, "pill", "dark"],
  POWER: [756, 1283, "pill", "blue"],
  RECIP: [878, 1287.5, "pill", "blue"],
  LPAREN: [1000, 1288, "pill", "blue"],
  RPAREN: [1121.5, 1288, "pill", "blue"],
  MULTIPLY: [1243.5, 1283, "pill", "dark"],
  SQUARE: [756.5, 1384, "tall", "blue"],
  "7": [878, 1389, "digitL", "white"],
  "8": [999.5, 1390.5, "digitM", "white"],
  "9": [1122, 1388.5, "digitR", "white"],
  SUBTRACT: [1243, 1384, "tall", "dark"],
  VAR: [756, 1489, "tall", "blue"],
  "4": [878, 1495, "digitL", "white"],
  "5": [1000.5, 1496.5, "digitM", "white"],
  "6": [1122, 1494.5, "digitR", "white"],
  ADD: [1243.5, 1489, "tall", "dark"],
  STO: [756, 1593.5, "tall", "blue"],
  "1": [878, 1601, "digitL", "white"],
  "2": [1000, 1603.5, "digitM", "white"],
  "3": [1122, 1601, "digitR", "white"],
  // The ◂▸ and enter keys lean: an ellipse fit to their outlines gives −10° to −11° (part of that
  // is their lopsided outline; the legends lean about −5°).
  TOGGLE: [1243.5, 1593.5, "oval", "ring", -6],
  ON: [756, 1698.5, "tall", "blue"],
  "0": [878, 1707, "digitL", "white"],
  DOT: [1000, 1709.5, "digitM", "white"],
  NEG: [1122, 1707, "digitR", "white"],
  ENTER: [1243.5, 1696.5, "oval", "ring", -6],
};

const RX = 588;
const RY = 91;

export type FaceKeyId = keyof typeof CENTRES;

export const KEY_BOXES = Object.fromEntries(
  Object.entries(CENTRES).map(([id, [cx, cy, shape, color, rotate]]) => {
    const { w, h } = SHAPE_SIZE[shape];
    const box: KeyBox = { x: cx - RX - w / 2, y: cy - RY - h / 2, w, h, shape, color, ...(rotate ? { rotate } : {}) };
    return [id, box];
  }),
) as Record<FaceKeyId, KeyBox>;

/**
 * The 4-way arrow pad: a black oval in the case's notch. Ellipse fit to the dark mask: centre
 * render (1207, 927), axes 180 × 128.5 → device centre (619, 836), rx 90, ry 64.3. Inside: a 5-unit
 * darker rim, a lighter centre boss (rx 27, ry 18 at render (1205, 928)) and four dark arrow
 * triangles: ▲ apex (1206, 876) base y 897 × 20 wide; ▼ base y 963 (1197–1216) apex 978;
 * ◀ apex (1133, 928) base x 1150 (y 919–937); ▶ apex (1280, 929) base x 1264 (y 920–938).
 */
export const DPAD = {
  cx: 619,
  cy: 836,
  rx: 90,
  ry: 64.3,
  boss: { cx: 617, cy: 837, rx: 27, ry: 18.5 },
  arrows: {
    UP: [[618, 785], [608.5, 806], [627.5, 806]] as Pt[],
    DOWN: [[609, 872], [628, 872], [619, 887]] as Pt[],
    LEFT: [[545, 837], [562, 828], [562, 846]] as Pt[],
    RIGHT: [[692, 838], [676, 829], [676, 847]] as Pt[],
  },
  /**
   * Hit area: the oval's box plus these margins, split into four triangles by its diagonals. The
   * vertical margin fills the notch (render y 830–1024) so the ▲ and ▼ zones are 88 units tall:
   * 44 px on a 412-px-wide phone.
   */
  hitPad: { x: 14, y: 24 },
} as const;

/**
 * Hit areas. Each key's button covers its column (half-way to the neighbouring columns) and half the
 * gap to the keys above and below, so the visible key keeps its exact size while touch targets grow,
 * and neighbouring hit areas never overlap. Column edges: midpoints between column centres; the
 * outer columns extend by half a pitch.
 */
export const COLUMN_CENTRES = [168, 290, 412, 533.5, 655.5] as const;
export const COLUMN_PITCH = 121.9;

export interface HitBox {
  x: number;
  y: number;
  w: number;
  h: number;
}

function columnOf(box: KeyBox): number {
  const cx = box.x + box.w / 2;
  let best = 0;
  COLUMN_CENTRES.forEach((c, i) => {
    if (Math.abs(c - cx) < Math.abs((COLUMN_CENTRES[best] ?? 0) - cx)) best = i;
  });
  return best;
}

function computeHitBoxes(): Record<FaceKeyId, HitBox> {
  const byCol: FaceKeyId[][] = [[], [], [], [], []];
  for (const id of Object.keys(KEY_BOXES) as FaceKeyId[]) byCol[columnOf(KEY_BOXES[id])]!.push(id);
  const out = {} as Record<FaceKeyId, HitBox>;
  byCol.forEach((ids, col) => {
    ids.sort((a, b) => KEY_BOXES[a].y - KEY_BOXES[b].y);
    const c = COLUMN_CENTRES[col]!;
    const left = col === 0 ? c - COLUMN_PITCH / 2 : (c + COLUMN_CENTRES[col - 1]!) / 2;
    const right = col === 4 ? c + COLUMN_PITCH / 2 : (c + COLUMN_CENTRES[col + 1]!) / 2;
    ids.forEach((id, i) => {
      const b = KEY_BOXES[id];
      const prev = i > 0 ? KEY_BOXES[ids[i - 1]!] : null;
      const next = i < ids.length - 1 ? KEY_BOXES[ids[i + 1]!] : null;
      const gapAbove = prev ? b.y - (prev.y + prev.h) : next ? next.y - (b.y + b.h) : 20;
      const gapBelow = next ? next.y - (b.y + b.h) : gapAbove;
      const top = b.y - gapAbove / 2;
      const bottom = b.y + b.h + gapBelow / 2;
      out[id] = { x: left + 0.5, y: top + 0.5, w: right - left - 1, h: bottom - top - 1 };
    });
  });
  return out;
}

export const HIT_BOXES = computeHitBoxes();

export const DPAD_HIT: HitBox = {
  x: DPAD.cx - DPAD.rx - DPAD.hitPad.x,
  y: DPAD.cy - DPAD.ry - DPAD.hitPad.y,
  w: 2 * (DPAD.rx + DPAD.hitPad.x),
  h: 2 * (DPAD.ry + DPAD.hitPad.y),
};

// ---------------------------------------------------------------------------------------------
// Printing

/**
 * Key-face legends (render ink boxes inside each key): lowercase words have an ascender height of
 * 19.5 (e.g. "mode" y 886–907, minus 1.5 of anti-aliasing) and an x-height of 14; digits are 32.5
 * tall ("8" y 1377–1411). Sizes and offsets were then calibrated by measuring the same ink boxes on
 * our screenshot (scratchpad calib.py): words and digits now match within ±1 unit in height and
 * position.
 */
export const LEGEND = {
  /** font size of the word legends (Source Sans 3 Bold: ascender 0.712 em) */
  word: 28.5,
  /** font size of the digits (Source Sans 3 Semibold: figure height 0.65 em) */
  digit: 52.5,
  /** digit-key legends sit lower than the key centre by this much */
  digitDrop: 4.5,
  /** function-key legends sit higher than the key centre by this much (negative: lower) */
  wordLift: -1,
  /** digits on the outer-rounded keys (7 4 1 0, 9 6 3 (−)) sit this far towards the block's centre */
  digitInset: 3,
} as const;

/**
 * Green 2nd legends: centre x and baseline (render px → device below), from connected components
 * of green pixels (g > r + 22, g > b + 8) merged into words; the baseline is the last row of the
 * x-height band in each word's row profile (descenders are the thin rows below it). Ascenders are 19.5–20 tall, so the
 * face (Source Sans 3 Semibold) is set at 25.5 units (calibrated by comparing word boxes on our
 * screenshot with the render's: within ±4 % in width). Colour: the strokes' core is #6a9a3c on the
 * render (anti-aliased edges average #5c8838).
 */
const SECOND_RENDER: Partial<Record<FaceKeyId, [number, number]>> = {
  MODE: [880.5, 856],
  DELETE: [1002, 856],
  LOG: [762.5, 955],
  PRB: [880.5, 954],
  DATA: [1004.5, 954],
  LN: [761, 1052],
  FRAC: [880, 1053],
  EE: [1000, 1053],
  TABLE: [1121, 1053],
  PI: [760, 1144],
  SIN: [879.5, 1151],
  COS: [1000.5, 1152],
  TAN: [1121.5, 1152],
  DIVIDE: [1243, 1147],
  POWER: [764, 1247],
  LPAREN: [1001, 1251],
  RPAREN: [1118.5, 1249],
  SQUARE: [760, 1339],
  SUBTRACT: [1242, 1341],
  VAR: [759.5, 1444],
  ADD: [1248.5, 1445],
  STO: [759.5, 1548],
  ON: [760, 1654],
  "0": [880.5, 1660.5],
  DOT: [1001.5, 1659],
  NEG: [1122, 1660],
};

export const SECOND_LEGENDS = Object.fromEntries(
  Object.entries(SECOND_RENDER).map(([id, [x, y]]) => [id, { cx: x - RX, baseline: y - RY }]),
) as Partial<Record<FaceKeyId, { cx: number; baseline: number }>>;

export const SECOND_FONT = { size: 25.5, weight: 600 } as const;

// ---------------------------------------------------------------------------------------------
// Colours (sampled from the render; medians of 5 × 5 patches)

export const COLORS = {
  /** top cap and feet */
  cap: "#262626",
  capRecess: "#232323",
  feet: "#181818",
  /** case sides: #d5d5d5, #cecece at the outer edge */
  body: "#d5d5d5",
  bodyEdge: "#cbcbcb",
  /** faceplate: top, middle, and the shaded bottom curve */
  faceTop: "#466474",
  faceMid: "#446272",
  faceBottom: "#2d4350",
  /** the pale rim where the faceplate meets the case */
  faceRim: "#e6e7e8",
  solar: "#150c0d",
  solarDivider: "#2b2224",
  solarBevel: "#86a0ad",
  /** LCD recess: dark above the glass, pale below */
  recessTop: "#111717",
  recessBottom: "#809ca7",
  /** green 2nd printing */
  second: "#6a9a3c",
  /** d-pad */
  dpad: "#3c3c3d",
  dpadRim: "#1b1b1c",
  dpadBoss: "#555657",
  dpadArrow: "#1f1f20",
  /** the notch's raised lip round the d-pad */
  notchLip: "#eeeeee",
} as const;
