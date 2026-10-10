import { describe, expect, it } from "vitest";
import { KEY_BY_ID, type KeyId } from "../../src/engine";
import { KEYBOARD_HINTS, isTypingTarget, keyFromKeyboard, ownsActivationKey } from "../../src/ui/keyboardMap";

const k = (key: string, mods: { ctrlKey?: boolean; metaKey?: boolean; altKey?: boolean } = {}) => keyFromKeyboard({ key, ...mods });

describe("keyboard map", () => {
  it("follows TI-SmartView's letter map (keys-menus.md §1.4)", () => {
    const smartView: Record<string, KeyId> = {
      Q: "2ND", W: "MODE", R: "LOG", T: "PRB", Y: "DATA", U: "LN", I: "FRAC", P: "EE", A: "TABLE", D: "PI", F: "SIN", G: "COS",
      H: "TAN", J: "POWER", K: "RECIP", L: "SQUARE", Z: "VAR", X: "STO", C: "TOGGLE", V: "ON", B: "NEG",
    };
    for (const [letter, id] of Object.entries(smartView)) {
      expect(k(letter), letter).toBe(id);
      expect(k(letter.toLowerCase()), letter.toLowerCase()).toBe(id);
    }
  });

  it("maps the natural keys", () => {
    for (const d of "0123456789") expect(k(d)).toBe(d);
    expect(k(".")).toBe("DOT");
    expect(k("+")).toBe("ADD");
    expect(k("-")).toBe("SUBTRACT");
    expect(k("*")).toBe("MULTIPLY");
    expect(k("/")).toBe("DIVIDE");
    expect(k("^")).toBe("POWER");
    expect(k("(")).toBe("LPAREN");
    expect(k(")")).toBe("RPAREN");
    expect(k("Enter")).toBe("ENTER");
    expect(k("=")).toBe("ENTER");
    expect(k("ArrowUp")).toBe("UP");
    expect(k("ArrowDown")).toBe("DOWN");
    expect(k("ArrowLeft")).toBe("LEFT");
    expect(k("ArrowRight")).toBe("RIGHT");
    expect(k("Backspace")).toBe("DELETE");
    expect(k("Delete")).toBe("DELETE");
    expect(k("Escape")).toBe("CLEAR");
  });

  it("leaves browser shortcuts and unmapped keys alone", () => {
    expect(k("c", { ctrlKey: true })).toBeNull();
    expect(k("r", { metaKey: true })).toBeNull();
    expect(k("1", { altKey: true })).toBeNull();
    for (const key of ["e", "S", "m", "Tab", "Shift", " ", "F5", "%"]) expect(k(key), key).toBeNull();
  });

  it("only produces real key ids, and hints every mapped key", () => {
    for (const id of Object.keys(KEYBOARD_HINTS)) expect(KEY_BY_ID[id as KeyId], id).toBeDefined();
    expect(KEYBOARD_HINTS["2ND"]).toBe("Q");
    expect(KEYBOARD_HINTS.ENTER).toBe("Enter =");
    expect(KEYBOARD_HINTS.DELETE).toBe("Backspace Delete");
  });

  it("recognises form fields and other controls", () => {
    expect(isTypingTarget({ tagName: "INPUT" })).toBe(true);
    expect(isTypingTarget({ tagName: "div", isContentEditable: true })).toBe(true);
    expect(isTypingTarget({ tagName: "DIV", getAttribute: (n) => (n === "role" ? "textbox" : null) })).toBe(true);
    expect(isTypingTarget({ tagName: "BUTTON" })).toBe(false);
    expect(isTypingTarget(null)).toBe(false);
    expect(ownsActivationKey({ tagName: "BUTTON", getAttribute: () => null })).toBe(true);
    expect(ownsActivationKey({ tagName: "BUTTON", getAttribute: (n) => (n === "data-calc-key" ? "ENTER" : null) })).toBe(false);
    expect(ownsActivationKey({ tagName: "BODY", getAttribute: () => null })).toBe(false);
  });
});
