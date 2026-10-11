import { expect, test, type Page } from "@playwright/test";

const key = (page: Page, id: string) => page.locator(`[data-calc-key="${id}"]`);
const screen = (page: Page) => page.getByTestId("lcd-text");
const block = (page: Page) => page.getByTestId("feature-block");
const inUse = (page: Page) => page.getByTestId("panel-feature-in-use");
const ARROWS: Record<string, string> = { UP: "ArrowUp", DOWN: "ArrowDown", LEFT: "ArrowLeft", RIGHT: "ArrowRight" };

/** Press calculator keys: key ids, multi-digit numbers; the arrow pad through the keyboard. */
async function press(page: Page, keys: string) {
  for (const k of keys.split(/\s+/).filter(Boolean)) {
    if (ARROWS[k]) await page.keyboard.press(ARROWS[k]);
    else if (/^\d+$/.test(k)) for (const d of k) await key(page, d).click();
    else await key(page, k).click();
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("device")).toBeVisible();
});

test("the header has Key tips, Calculator only and the theme toggle, in that order", async ({ page }) => {
  const controls = page.locator("header").getByRole("switch").or(page.locator("header .theme-toggle"));
  await expect(controls).toHaveCount(3);
  await expect(controls.nth(0)).toHaveAccessibleName("Key tips");
  await expect(controls.nth(1)).toHaveAccessibleName("Calculator only");
  await expect(controls.nth(2)).toHaveClass(/theme-toggle/);
  await expect(page.getByTestId("calc-only-switch")).toHaveAttribute("aria-checked", "false");
});

test("the feature block follows the keys: data, table and prb switch it, a digit does not", async ({ page }) => {
  await expect(block(page)).toHaveAttribute("data-feature", "none");
  await expect(page.getByTestId("feature-placeholder")).toBeVisible();

  await press(page, "DATA");
  await expect(block(page)).toHaveAttribute("data-feature", "stats");
  await expect(page.locator("#feature-title")).toHaveText("Statistics & data");
  await expect(inUse(page)).toBeVisible();
  await expect(page.getByTestId("feature-stats")).toHaveAttribute("aria-checked", "true");

  // typing in the editor and leaving it keeps the block (sticky); the badge goes when the editor closes
  await press(page, "5 ENTER 2ND MODE");
  await expect(block(page)).toHaveAttribute("data-feature", "stats");
  await expect(inUse(page)).toHaveCount(0);
  await press(page, "7");
  await expect(screen(page)).toHaveText("7");
  await expect(block(page)).toHaveAttribute("data-feature", "stats");

  await press(page, "TABLE");
  await expect(block(page)).toHaveAttribute("data-feature", "table");
  await expect(page.locator("#feature-title")).toHaveText("Function table");
  await expect(inUse(page)).toBeVisible();

  await press(page, "CLEAR CLEAR PRB");
  await expect(block(page)).toHaveAttribute("data-feature", "probability");
  await expect(page.locator("#feature-title")).toHaveText("Probability");
  await expect(inUse(page)).toBeVisible();

  // 8 nPr 3: the block writes it out
  await press(page, "CLEAR 8 PRB 1 3");
  await expect(page.getByTestId("probability-equation")).toHaveText("8 nPr 3 = 8!/(8−3)! = 8×7×6 = 336");
  await press(page, "ENTER");
  await expect(page.getByTestId("probability-chance")).toContainText("1 in 336");
});

test("the keyboard drives the block too, and the choice survives a reload", async ({ page }) => {
  await page.keyboard.press("a"); // SmartView's table key
  await expect(block(page)).toHaveAttribute("data-feature", "table");
  expect(await page.evaluate(() => localStorage.getItem("ti30xs:feature"))).toBe("table");
  await page.reload();
  await expect(block(page)).toHaveAttribute("data-feature", "table");
});

test("the selector switches by hand, with the mouse or the arrow keys, without pressing calculator keys", async ({ page }) => {
  await page.getByTestId("feature-fractions").click();
  await expect(block(page)).toHaveAttribute("data-feature", "fractions");
  await expect(page.getByTestId("feature-fractions")).toHaveAttribute("aria-checked", "true");
  await expect(page.getByRole("radiogroup", { name: "Feature shown" })).toBeVisible();

  await press(page, "1 2");
  await page.getByTestId("feature-fractions").focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByTestId("feature-probability")).toBeFocused();
  await expect(page.getByTestId("feature-probability")).toHaveAttribute("aria-checked", "true");
  await expect(block(page)).toHaveAttribute("data-feature", "probability");
  await page.keyboard.press("End");
  await expect(block(page)).toHaveAttribute("data-feature", "angles");
  // the arrows went to the selector, not to the calculator's cursor
  await expect(screen(page)).toHaveText("12");
  // only the selected segment is a tab stop
  await expect(page.getByTestId("feature-angles")).toHaveAttribute("tabindex", "0");
  await expect(page.getByTestId("feature-stats")).toHaveAttribute("tabindex", "-1");
});

test("Statistics: lists, 2-Var results and the scatter plot", async ({ page }) => {
  await press(page, "DATA 1 ENTER 2 ENTER 3 ENTER 4 ENTER RIGHT 2 ENTER 4 ENTER 5 ENTER 4 ENTER");
  await expect(page.getByTestId("stats-lists")).toContainText("L2");
  // four values, plus the row of the editor's cursor: L2's first blank cell
  await expect(page.getByTestId("stats-lists").locator("tbody tr")).toHaveCount(5);
  await expect(page.getByTestId("stats-lists").locator('td[aria-current="true"]')).toHaveCount(1);
  await expect(page.getByTestId("stats-lists").locator("tbody tr").nth(4).locator("td").nth(1)).toHaveAttribute("aria-current", "true");
  await press(page, "2ND DATA 2 DOWN DOWN ENTER");
  await expect(page.getByTestId("stat-stat_n")).toContainText("4");
  await expect(page.getByTestId("stat-stat_a")).toContainText("0.7");
  await expect(page.getByTestId("stats-regression")).toHaveText("Line y = 0.7x + 2 · r 0.718184846");
  await expect(page.getByTestId("stat-stat_n")).toHaveAttribute("data-current", "true");
  const chart = page.getByTestId("chart-scatter").getByRole("img");
  await expect(chart).toHaveAccessibleName("Scatter plot of L2 against L1");
  await expect(chart).toHaveAccessibleDescription("4 points (L1, L2); regression line y = 0.7x + 2.");
});

test("Memory updates after 5 sto▸ x enter", async ({ page }) => {
  await expect(page.getByTestId("mem-x")).toContainText("0");
  await press(page, "5 STO VAR");
  await expect(screen(page)).toHaveText("5→x");
  await expect(page.getByTestId("panel-memory")).toHaveAttribute("data-active", "true");
  await expect(page.getByTestId("mem-x")).toHaveAttribute("data-current", "true");
  await press(page, "ENTER");
  await expect(page.getByTestId("mem-x")).toContainText("5");
  await expect(page.getByTestId("mem-ans")).toContainText("5");
  await expect(page.getByTestId("panel-memory")).toHaveAttribute("data-active", "false");
});

test("the Mode block follows the mode screen and a mode change", async ({ page }) => {
  const angle = page.getByTestId("mode-angle");
  await expect(angle.locator('[data-selected="true"]')).toHaveText("DEG");
  await press(page, "MODE");
  await expect(page.getByTestId("panel-mode")).toHaveAttribute("data-active", "true");
  await expect(angle).toHaveAttribute("data-current", "true");
  await press(page, "RIGHT ENTER");
  await expect(angle.locator('[data-selected="true"]')).toHaveText("RAD");
  await press(page, "DOWN");
  await expect(page.getByTestId("mode-notation")).toHaveAttribute("data-current", "true");
  await press(page, "CLEAR");
  await expect(page.getByTestId("panel-mode")).toHaveAttribute("data-active", "false");
  await expect(angle.locator('[data-selected="true"]')).toHaveText("RAD");
});

test("History lists entries newest first", async ({ page }) => {
  await press(page, "1 ADD 2 ENTER 3 MULTIPLY 4 ENTER");
  const items = page.getByTestId("history-list").locator("li");
  await expect(items).toHaveCount(2);
  await expect(items.nth(0)).toContainText("3×4");
  await expect(items.nth(0)).toContainText("= 12");
  await expect(items.nth(1)).toContainText("1+2");
});

test("Calculator only hides every block and persists across a reload", async ({ page }) => {
  const sw = page.getByTestId("calc-only-switch");
  await expect(page.getByTestId("panels")).toBeVisible();
  await sw.click();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("panels")).toHaveCount(0);
  await expect(page.locator(".panel-card")).toHaveCount(0);
  await expect(page.getByTestId("device")).toBeVisible();
  await expect(page.getByTestId("tips-hint")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("ti30xs:calcOnly"))).toBe("on");

  await page.reload();
  await expect(sw).toHaveAttribute("aria-checked", "true");
  await expect(page.getByTestId("panels")).toHaveCount(0);
  // the calculator still works, and is centered as before the panels existed
  await press(page, "4 ADD 4 ENTER");
  await expect(screen(page)).toHaveText("4+4 = 8");
  const device = (await page.getByTestId("device").boundingBox())!;
  const width = page.viewportSize()!.width;
  expect(Math.abs(device.x + device.width / 2 - width / 2)).toBeLessThan(2);

  await sw.click();
  await expect(page.getByTestId("panels")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("ti30xs:calcOnly"))).toBe("off");
});

test("the page never scrolls sideways", async ({ page }) => {
  await press(page, "TABLE");
  for (const f of ["stats", "table", "fractions", "probability", "angles"]) {
    await page.getByTestId(`feature-${f}`).click();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
    expect(overflow, f).toBeLessThanOrEqual(0);
  }
});
