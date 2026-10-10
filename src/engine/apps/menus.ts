/**
 * Every list menu (K §3.1–§3.11; D §6, E7, E8): prb, 2nd angle, 2nd recall, 2nd clear var,
 * 2nd reset, 2nd stat (STATS), the StatVars / results menu, the data CLEAR / FORMULA menu and the
 * Ls list-name menu used inside a formula.
 *
 * ▲ ▼ move the highlight and wrap (▲ on item 1 goes to the last item, TG p.119, GB-078c); ◄ ►
 * switch tabs (wrapping); a number key 1–9 selects its item at once; enter selects the highlighted
 * item; clear returns to the screen the menu came from. Selecting a paste item inserts its text at
 * the cursor of that screen's entry (K §3.1).
 */
import type { Action } from "../keys";
import { SYMS, sym, type Row, type SymId } from "../expr";
import type { CanvasScreen } from "../screen";
import type { CalcState, VarName } from "../state";
import { VARS, ZERO } from "./calc";
import { menuItems, scrollTop, type MenuLine } from "./canvas";
import { startFormula } from "./data";
import { symText } from "../../display/symbols";
import { formatPlain, glyphCount, valueRow } from "./format";
import { setFormula, setList, withLists, type Formulas, type Lists } from "./lists";
import { homeApp, openMenu, pasteInto } from "./nav";
import { resetMemory } from "./reset";
import { startWizard } from "./stat";
import type { AppState, MenuId } from "./types";

interface Item {
  line: MenuLine;
  run: (s: CalcState, back: AppState) => CalcState;
}

interface Tab {
  title: string;
  items: Item[];
}

const paste = (label: string, row: Row): Item => ({ line: { label }, run: (s, back) => pasteInto(s, back, row) });
const pasteSym = (id: SymId): Item => paste(SYMS[id].trim(), [sym(id)]);
const back = (label: string): Item => ({ line: { label }, run: (s, b) => ({ ...s, app: b }) });

function tabsOf(s: CalcState, id: MenuId): Tab[] {
  switch (id) {
    case "prb":
      return [
        { title: "PRB", items: [pasteSym("nPr"), pasteSym("nCr"), pasteSym("fact")] },
        { title: "RAND", items: [pasteSym("rand"), pasteSym("randint")] },
      ];
    case "angle":
      return [
        { title: "DMS", items: (["deg", "min", "sec", "radian", "grad", "toDMS"] as SymId[]).map(pasteSym) },
        { title: "R◂▸P", items: (["RPr", "RPth", "PRx", "PRy"] as SymId[]).map(pasteSym) },
      ];
    case "recall":
      // values in the restricted E format (GB-032c `x=196ᴇ3`); selecting pastes the VALUE (K §3.7)
      return [{
        title: "Recall Var",
        items: VARS.map((v): Item => ({
          line: { label: `${symText(v)}=${formatPlain(s.vars[v], s.modes, 11)}` },
          run: (st, b) => pasteInto(st, b, valueRow(st.vars[v], st.modes)),
        })),
      }];
    case "clearVar":
      // Yes first (GB p.10); afterwards the previous screen returns. SPEC: assumption (K §3.10)
      return [{
        title: "Clear Var",
        items: [
          { line: { label: "Yes" }, run: (st, b) => ({ ...st, vars: zeroVars(), app: b }) },
          back("No"),
        ],
      }];
    case "reset":
      // No first (K §3.11)
      return [{
        title: "Reset",
        items: [back("No"), { line: { label: "Yes" }, run: (st) => ({ ...resetMemory(st), app: { kind: "message", text: "MEMORY CLEARED" } }) }],
      }];
    case "stats": {
      const items: Item[] = [
        { line: { label: "1-Var Stats" }, run: (st) => startWizard(st, 1) },
        { line: { label: "2-Var Stats" }, run: (st) => startWizard(st, 2) },
      ];
      // StatVars is offered only after a calculation (K §3.5)
      if (s.apps.stat) items.push({ line: { label: "StatVars" }, run: (st) => openMenu(st, "statVars", homeApp()) });
      return [{ title: "STATS", items }];
    }
    case "statVars": {
      const st = s.apps.stat;
      if (!st) return [{ title: "STATS", items: [] }];
      return [{
        title: st.title,
        items: st.items.map((it): Item => {
          const name = SYMS[it.key];
          const prime = it.key === "stat_xprime" || it.key === "stat_yprime";
          // the value fills what is left of the 16 cells, at most an 11-character field (K §3.5)
          const room = Math.min(11, 16 - 2 - glyphCount(name) - 1);
          const eq = it.value !== null && RAISED_EQ.has(it.key) ? "≡" : "=";
          const label = prime ? name : `${name}${eq}${it.value === null ? "Error" : formatPlain({ re: it.value }, s.modes, room)}`;
          // x′ and y′ paste with an open parenthesis (GB-078d `x′(45)`)
          const row: Row = prime ? [sym(it.key), sym("lparen")] : [sym(it.key)];
          return { line: { label }, run: (stt, b) => pasteInto(stt, b, row) };
        }),
      }];
    }
    case "dataMenu": {
      const clearList = (cols: number[]): Item["run"] => (st, b) => {
        let lists = st.apps.lists as Lists;
        let formulas = st.apps.formulas as Formulas;
        for (const c of cols) {
          lists = setList(lists, c, []);
          formulas = setFormula(formulas, c, null);
        }
        return withLists({ ...st, app: atTop(b) }, lists, formulas);
      };
      const clearFormula = (cols: number[]): Item["run"] => (st, b) => {
        let formulas = st.apps.formulas as Formulas;
        for (const c of cols) formulas = setFormula(formulas, c, null);
        return { ...st, apps: { ...st.apps, formulas }, app: atTop(b) };
      };
      return [
        {
          title: "CLEAR",
          items: [
            { line: { label: "Clear L1" }, run: clearList([0]) },
            { line: { label: "Clear L2" }, run: clearList([1]) },
            { line: { label: "Clear L3" }, run: clearList([2]) },
            { line: { label: "Clear ALL" }, run: clearList([0, 1, 2]) },
          ],
        },
        {
          title: "FORMULA",
          items: [
            { line: { label: "Add/Edit Frmla" }, run: (st, b) => (b.kind === "data" ? startFormula(st, b) : { ...st, app: b }) },
            { line: { label: "Clear L1 Frmla" }, run: clearFormula([0]) },
            { line: { label: "Clear L2 Frmla" }, run: clearFormula([1]) },
            { line: { label: "Clear L3 Frmla" }, run: clearFormula([2]) },
            { line: { label: "Clear ALL" }, run: clearFormula([0, 1, 2]) },
          ],
        },
      ];
    }
    case "listNames":
      // title from the guidebook's menu chart (K §3.4) [unverified on screen]
      return [{ title: "Ls", items: [pasteSym("L1"), pasteSym("L2"), pasteSym("L3")] }];
  }
}

/**
 * The results screens draw some `=` signs one row higher (D §8.1 "=alt"): in every capture this is
 * x̄, Sx, b and r with a value, and never n, a, Σxy, minX or `Sx=Error` (MF_stats1var05,
 * MF_statspr205/206/207, MF_stats2var05B). Reproduced as captured; the other items, never captured,
 * use the plain `=`.
 */
const RAISED_EQ: ReadonlySet<SymId> = new Set<SymId>(["stat_xbar", "stat_Sx", "stat_b", "stat_r"]);

/** After a CLEAR / FORMULA action the data editor shows the top of its lists (GB-077b, GB-079a). */
const atTop = (b: AppState): AppState => (b.kind === "data" ? { ...b, row: 0, top: 0, edit: null, formula: null } : b);

const zeroVars = (): Record<VarName, typeof ZERO> =>
  Object.fromEntries(VARS.map((v) => [v, ZERO])) as Record<VarName, typeof ZERO>;

export function menuKey(s: CalcState, a: Action): CalcState {
  const app = s.app;
  if (app.kind !== "menu") return s;
  const tabs = tabsOf(s, app.id);
  const tab = tabs[app.tab] ?? tabs[0];
  const n = tab?.items.length ?? 0;
  const goItem = (item: number): CalcState => ({ ...s, app: { ...app, item, top: scrollTop(app.top, item, n) } });
  const run = (i: number): CalcState => {
    const it = tab?.items[i];
    return it ? it.run({ ...s, app: app.back }, app.back) : s;
  };
  switch (a) {
    case "UP": return n ? goItem((app.item - 1 + n) % n) : s;
    case "DOWN": return n ? goItem((app.item + 1) % n) : s;
    case "LEFT": case "RIGHT": {
      if (tabs.length < 2) return s;
      const t = (app.tab + (a === "LEFT" ? -1 : 1) + tabs.length) % tabs.length;
      return { ...s, app: { ...app, tab: t, item: 0, top: 0 } };
    }
    case "ENTER": return run(app.item);
    case "CLEAR": return { ...s, app: app.back };
    default: break;
  }
  if (/^[1-9]$/.test(a)) {
    const i = Number(a) - 1;
    return i < n ? run(i) : s;
  }
  return s;
}

export function menuView(s: CalcState): CanvasScreen {
  const app = s.app;
  if (app.kind !== "menu") return { kind: "canvas", items: [] };
  const tabs = tabsOf(s, app.id);
  const tab = tabs[app.tab] ?? tabs[0];
  const lines = tab?.items.map((it) => it.line) ?? [];
  return { kind: "canvas", items: menuItems(tabs.map((t) => t.title), app.tab, lines, app.item, app.top) };
}

/** Menu titles and item labels as plain strings (tests, screen readers). */
export function menuText(s: CalcState): { tabs: string[]; active: number; items: string[]; selected: number; top: number } | null {
  const app = s.app;
  if (app.kind !== "menu") return null;
  const tabs = tabsOf(s, app.id);
  const tab = tabs[app.tab];
  return {
    tabs: tabs.map((t) => t.title),
    active: app.tab,
    items: tab?.items.map((it) => it.line.label) ?? [],
    selected: app.item,
    top: app.top,
  };
}
