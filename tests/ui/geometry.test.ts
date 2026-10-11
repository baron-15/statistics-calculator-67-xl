import { describe, expect, it } from "vitest";
import { ALL_KEYS } from "../../src/engine";
import {
  DEVICE_H, DEVICE_W, DPAD, DPAD_HIT, FACE, GLASS_BOX, HIT_BOXES, KEY_BOXES, MATRIX, MATRIX_H_U, MATRIX_W_U, SECOND_LEGENDS,
  type FaceKeyId, type HitBox, type KeyBox, type Pt,
} from "../../src/ui/geometry";
import { mirrorHalf, smoothPath } from "../../src/ui/paths";

const ARROWS = new Set(["UP", "DOWN", "LEFT", "RIGHT"]);
const faceIds = Object.keys(KEY_BOXES) as FaceKeyId[];

/** Axis-aligned bounds of a key face, including its tilt. */
function faceBounds(b: KeyBox): HitBox {
  if (!b.rotate) return b;
  const a = (Math.abs(b.rotate) * Math.PI) / 180;
  const w = b.w * Math.cos(a) + b.h * Math.sin(a);
  const h = b.w * Math.sin(a) + b.h * Math.cos(a);
  return { x: b.x + b.w / 2 - w / 2, y: b.y + b.h / 2 - h / 2, w, h };
}

const overlaps = (a: HitBox, b: HitBox) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;
const inside = (inner: HitBox, outer: HitBox) =>
  inner.x >= outer.x - 1e-9 && inner.y >= outer.y - 1e-9 && inner.x + inner.w <= outer.x + outer.w + 1e-9 && inner.y + inner.h <= outer.y + outer.h + 1e-9;

/** Even-odd point-in-polygon test. */
function inPolygon([x, y]: Pt, poly: readonly Pt[]): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

describe("device geometry", () => {
  it("has a box for every key on the keypad", () => {
    for (const spec of ALL_KEYS) {
      if (ARROWS.has(spec.id)) continue;
      expect(KEY_BOXES[spec.id as FaceKeyId], spec.id).toBeDefined();
      expect(HIT_BOXES[spec.id as FaceKeyId], spec.id).toBeDefined();
    }
    expect(faceIds).toHaveLength(ALL_KEYS.length - 4);
    // the four arrows are zones of the pad
    for (const a of ["UP", "DOWN", "LEFT", "RIGHT"] as const) expect(DPAD.arrows[a]).toHaveLength(3);
  });

  it("has a green 2nd legend exactly for the keys whose KeySpec has a printed one", () => {
    const printed = ALL_KEYS.filter((s) => !ARROWS.has(s.id) && s.second?.label).map((s) => s.id).sort();
    expect(Object.keys(SECOND_LEGENDS).sort()).toEqual(printed);
  });

  it("keeps the key faces apart", () => {
    for (let i = 0; i < faceIds.length; i++) {
      for (let j = i + 1; j < faceIds.length; j++) {
        const a = faceIds[i]!;
        const b = faceIds[j]!;
        expect(overlaps(faceBounds(KEY_BOXES[a]), faceBounds(KEY_BOXES[b])), `${a} / ${b}`).toBe(false);
      }
    }
  });

  it("gives every key a hit area that contains its face and overlaps no other", () => {
    const all: [string, HitBox][] = [...faceIds.map((id) => [id, HIT_BOXES[id]] as [string, HitBox]), ["DPAD", DPAD_HIT]];
    for (const id of faceIds) expect(inside(faceBounds(KEY_BOXES[id]), HIT_BOXES[id]), id).toBe(true);
    for (let i = 0; i < all.length; i++) {
      for (let j = i + 1; j < all.length; j++) {
        expect(overlaps(all[i]![1], all[j]![1]), `${all[i]![0]} / ${all[j]![0]}`).toBe(false);
      }
    }
  });

  it("keeps hit areas at least 44 px tall on a 412-px-wide phone", () => {
    const pxPerUnit = 412 / DEVICE_W;
    for (const id of faceIds) expect(HIT_BOXES[id].h * pxPerUnit, id).toBeGreaterThanOrEqual(44);
    expect(((DPAD_HIT.h / 2) * pxPerUnit)).toBeGreaterThanOrEqual(44);
  });

  it("puts every key on the faceplate and the arrow pad in the notch", () => {
    for (const id of faceIds) {
      const b = KEY_BOXES[id];
      const cx = b.x + b.w / 2;
      const cy = b.y + b.h / 2;
      for (const p of [[cx, cy], [b.x + 4, cy], [b.x + b.w - 4, cy], [cx, b.y + 2], [cx, b.y + b.h - 2]] as Pt[]) {
        expect(inPolygon(p, FACE), `${id} at ${p}`).toBe(true);
      }
    }
    expect(inPolygon([DPAD.cx, DPAD.cy], FACE)).toBe(false);
    expect(inPolygon([DPAD.cx - DPAD.rx - 5, DPAD.cy], FACE)).toBe(false);
  });

  it("fits the 96 × 31 matrix inside the glass with the device inside its view box", () => {
    expect(MATRIX.x).toBeGreaterThan(GLASS_BOX.x);
    expect(MATRIX.y).toBeGreaterThan(GLASS_BOX.y);
    expect(MATRIX.x + MATRIX_W_U).toBeLessThan(GLASS_BOX.x + GLASS_BOX.w);
    expect(MATRIX.y + MATRIX_H_U).toBeLessThan(GLASS_BOX.y + GLASS_BOX.h);
    for (const id of faceIds) expect(inside(HIT_BOXES[id], { x: 0, y: 0, w: DEVICE_W, h: DEVICE_H }), id).toBe(true);
  });
});

describe("outline paths", () => {
  it("mirrors a half outline about the axis", () => {
    const half: Pt[] = [[412, 0], [400, 1], [390, 10], [412, 20]];
    expect(mirrorHalf(half)).toEqual([[412, 0], [400, 1], [390, 10], [412, 20], [434, 10], [424, 1]]);
  });

  it("draws a closed cubic spline through every point", () => {
    const d = smoothPath([[0, 0], [10, 0], [10, 10], [0, 10]]);
    expect(d.startsWith("M0,0C")).toBe(true);
    expect(d.endsWith("Z")).toBe(true);
    expect(d.match(/C/g)).toHaveLength(4);
    for (const p of ["10,0", "10,10", "0,10", "0,0Z"]) expect(d).toContain(p);
  });
});
