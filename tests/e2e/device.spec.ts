import { expect, test, type Page } from "@playwright/test";
import { ALL_KEYS } from "../../src/engine";

const key = (page: Page, id: string) => page.locator(`[data-calc-key="${id}"]`);
const indicator = (page: Page, id: string) => page.locator(`[data-indicator="${id}"]`);
const screen = (page: Page) => page.getByTestId("lcd-text");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("device")).toBeVisible();
});

test("has the B-67XL title and wordmark", async ({ page }) => {
  await expect(page).toHaveTitle("B-67XL AmazingView Online");
  await expect(page.getByTestId("wordmark")).toHaveText("B-67XL");
  await expect(page.getByText("Texas Instruments", { exact: false }).first()).toBeVisible(); // the disclaimer only
  await expect(page.getByTestId("device").getByText("Texas Instruments")).toHaveCount(0);
});

test("every key is a named button", async ({ page }) => {
  for (const spec of ALL_KEYS) {
    const button = key(page, spec.id);
    await expect(button, spec.id).toHaveCount(1);
    await expect(button, spec.id).toHaveAccessibleName(spec.aria);
  }
});

test("clicking keys presses them: 2nd lights its indicator, digits appear", async ({ page }) => {
  await expect(indicator(page, "2nd")).toHaveAttribute("data-on", "false");
  await expect(indicator(page, "deg-de")).toHaveAttribute("data-on", "true");
  await key(page, "2ND").click();
  await expect(indicator(page, "2nd")).toHaveAttribute("data-on", "true");
  await expect(key(page, "2ND")).toHaveAttribute("aria-pressed", "true");
  await key(page, "2ND").click();
  await expect(indicator(page, "2nd")).toHaveAttribute("data-on", "false");

  for (const id of ["1", "2", "ADD", "3"]) await key(page, id).click();
  await expect(screen(page)).toHaveText("12+3");
});

test("the arrow pad has four zones", async ({ page }) => {
  for (const id of ["1", "2"]) await key(page, id).click();
  // left of the pad's centre is ◀: the cursor moves onto the 2, and typing 3 overwrites it
  const pad = key(page, "LEFT");
  const box = (await page.locator(".dv-dpad").boundingBox())!;
  await page.mouse.click(box.x + box.width * 0.12, box.y + box.height / 2);
  await key(page, "3").click();
  await expect(screen(page)).toHaveText("13");
  await expect(pad).toHaveAccessibleName("Left");
});

test("keyboard input presses keys", async ({ page }) => {
  await page.keyboard.press("q");
  await expect(indicator(page, "2nd")).toHaveAttribute("data-on", "true");
  await page.keyboard.press("q");
  await expect(indicator(page, "2nd")).toHaveAttribute("data-on", "false");
  await page.keyboard.type("45*6");
  await expect(screen(page)).toHaveText("45*6");
  // Backspace at the end of the entry deletes the 6; ◀ then 7 overwrites the *
  await page.keyboard.press("Backspace");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("7");
  await expect(screen(page)).toHaveText("457");
  // Esc is clear: with the cursor on the 5 it erases to the end
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("ArrowLeft");
  await page.keyboard.press("Escape");
  await expect(screen(page)).toHaveText("4");
});

test("memory survives a reload", async ({ page }) => {
  await page.keyboard.type("789");
  await key(page, "2ND").click();
  await expect(screen(page)).toHaveText("789. 2nd");
  await page.waitForFunction(() => localStorage.getItem("ti30xs:state:v1")?.includes('"second":true'));
  await page.reload();
  await expect(screen(page)).toHaveText("789. 2nd");
  await expect(indicator(page, "2nd")).toHaveAttribute("data-on", "true");
});

test("draws lit dots on the LCD canvas", async ({ page }) => {
  await page.keyboard.type("8");
  const lit = await page.locator("canvas.dv-matrix").evaluate((c: HTMLCanvasElement) => {
    const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height).data;
    let n = 0;
    for (let i = 3; i < d.length; i += 4) if (d[i]! > 128) n++;
    return n;
  });
  expect(lit).toBeGreaterThan(50);
});

test("no horizontal overflow at 360 px", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 780 });
  await page.reload();
  const { scroll, client } = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  expect(scroll).toBeLessThanOrEqual(client);
});

test("on a phone the whole device is on screen when the page opens", async ({ page }) => {
  // A Pixel 7 and an iPhone 14 with their browser bars showing, and a small Android phone.
  for (const [width, height] of [[412, 747], [390, 664], [360, 640]] as const) {
    await page.setViewportSize({ width, height });
    await page.reload();
    const box = (await page.getByTestId("device").boundingBox())!;
    expect(box.y + box.height, `${width}×${height}`).toBeLessThanOrEqual(height);
  }
  // On a very short screen it stops shrinking at 240 px wide (the page scrolls), and every key stays a
  // 24 px target at least (WCAG 2.5.8).
  await page.setViewportSize({ width: 375, height: 553 });
  await page.reload();
  expect((await page.getByTestId("device").boundingBox())!.width).toBeCloseTo(240, 0);
  for (const button of await page.locator("[data-calc-key]").all()) {
    const box = (await button.boundingBox())!;
    expect(Math.min(box.width, box.height), (await button.getAttribute("data-calc-key")) ?? "").toBeGreaterThanOrEqual(24);
  }
});
