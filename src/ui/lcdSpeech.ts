/**
 * What a screen reader hears: the screen as text. Home lines use rowText (Classic linear form), so
 * "1/2+1/3 = 5/6"; other screens read their text items top to bottom, left to right.
 */
import { rowText, type View } from "../engine";

const INDICATOR_WORDS: Partial<Record<string, string>> = { "2nd": "2nd", hyp: "hyp", k: "constant", fix: "fix", sci: "sci", eng: "eng" };

export function screenText(view: View): string {
  if (!view.on) return "Off";
  const s = view.screen;
  const lines: string[] = [];
  if (s.kind === "home") {
    for (const h of s.history.slice(Math.max(s.firstShown, s.history.length - 3))) {
      lines.push(`${rowText(h.entry)}${h.toggled ? " ◂▸" : ""} = ${rowText(h.result)}`);
    }
    const entry = rowText(s.entry);
    if (entry) lines.push(entry);
  } else if (s.kind === "canvas") {
    const texts = s.items.filter((i) => i.t === "text" || i.t === "math");
    const rows = new Map<number, { x: number; text: string }[]>();
    for (const i of texts) {
      const text = i.t === "text" ? i.text : rowText(i.row);
      const row = rows.get(i.y) ?? [];
      row.push({ x: i.x, text });
      rows.set(i.y, row);
    }
    for (const y of [...rows.keys()].sort((a, b) => a - b)) {
      lines.push(
        rows
          .get(y)!
          .sort((a, b) => a.x - b.x)
          .map((r) => r.text)
          .join(" "),
      );
    }
  }
  const flags = view.indicators.map((i) => INDICATOR_WORDS[i]).filter(Boolean);
  const body = lines.join(". ");
  return flags.length ? `${body}${body ? ". " : ""}${flags.join(", ")}` : body;
}
