import { expect, test, type Page } from "@playwright/test";

const key = (page: Page, id: string) => page.locator(`[data-calc-key="${id}"]`);
const screen = (page: Page) => page.getByTestId("lcd-text");
const tip = (page: Page) => page.getByTestId("key-tip");
const tipsSwitch = (page: Page) => page.getByRole("switch", { name: "Key tips" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByTestId("device")).toBeVisible();
});

/** Hold a touch on the centre of a key for `ms` (a long press), through the DevTools protocol. */
async function longPress(page: Page, id: string, ms = 800) {
  const box = (await key(page, id).boundingBox())!;
  const point = { x: box.x + box.width / 2, y: box.y + box.height / 2 };
  const cdp = await page.context().newCDPSession(page);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [point] });
  await page.waitForTimeout(ms);
  await cdp.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  await cdp.detach();
}

test.describe("desktop", () => {
  test.skip(({ isMobile }) => isMobile, "hover tips are for mouse pointers; touch uses long-press");

  test("tips are off by default; the switch turns on hover tips that show the key and its 2nd function", async ({ page }) => {
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "false");
    await expect(page.getByTestId("tips-hint")).toContainText("Turn on Key tips");
    await key(page, "MODE").hover();
    await page.waitForTimeout(700);
    await expect(tip(page)).toHaveCount(0);

    await page.mouse.move(0, 0);
    await tipsSwitch(page).click();
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "true");
    await expect(page.getByTestId("tips-hint")).toHaveText("Hover a key (or long-press on a phone) to see what it does.");
    await key(page, "MODE").hover();
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toContainText("Mode");
    await expect(tip(page)).toContainText("2nd quit");
    await expect(tip(page)).toContainText("Returns home");
    await expect(tip(page)).toContainText("Keyboard: W");
    // Leaving the key closes it.
    await page.mouse.move(0, 0);
    await expect(tip(page)).toHaveCount(0);
  });

  test("the setting persists across a reload", async ({ page }) => {
    await tipsSwitch(page).click();
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "true");
    expect(await page.evaluate(() => localStorage.getItem("ti30xs:keytips"))).toBe("on");
    await page.reload();
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "true");
    await key(page, "7").hover();
    await expect(tip(page)).toContainText("Digit 7");

    await page.mouse.move(0, 0);
    await tipsSwitch(page).click();
    await page.reload();
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "false");
    expect(await page.evaluate(() => localStorage.getItem("ti30xs:keytips"))).toBe("off");
  });

  test("tips stay above the LCD: below the top keys, above the lower ones", async ({ page }) => {
    await tipsSwitch(page).click();
    const lcd = (await page.locator(".dv-lcd").boundingBox())!;
    for (const [id, placement] of [["2ND", "is-below"], ["ENTER", "is-above"]] as const) {
      await key(page, id).hover();
      await expect(tip(page)).toHaveAttribute("data-key", id);
      await expect(tip(page)).toHaveClass(new RegExp(placement));
      const box = (await tip(page).boundingBox())!;
      expect(box.y, id).toBeGreaterThanOrEqual(lcd.y + lcd.height);
      const device = (await page.getByTestId("device").boundingBox())!;
      expect(box.x, id).toBeGreaterThanOrEqual(device.x);
      expect(box.x + box.width, id).toBeLessThanOrEqual(device.x + device.width + 0.5);
      await page.mouse.move(0, 0);
    }
  });

  test("the arrow pad's zones have tips too, with their 2nd jumps", async ({ page }) => {
    await tipsSwitch(page).click();
    const pad = (await page.locator(".dv-dpad").boundingBox())!;
    await page.mouse.move(pad.x + pad.width * 0.12, pad.y + pad.height / 2);
    await expect(tip(page)).toHaveAttribute("data-key", "LEFT");
    await expect(tip(page)).toContainText("2nd ◄ jumps to the start of the entry");
    await page.mouse.move(pad.x + pad.width * 0.88, pad.y + pad.height / 2);
    await expect(tip(page)).toHaveAttribute("data-key", "RIGHT");
    await expect(key(page, "LEFT")).toHaveAccessibleDescription("2nd: start of entry");
  });

  test("turning the switch off closes an open tip; keyboard focus opens one", async ({ page }) => {
    await tipsSwitch(page).click();
    // Tab from the switch: the theme toggle, then the first key (2nd).
    await page.keyboard.press("Tab");
    await page.keyboard.press("Tab");
    await expect(key(page, "2ND")).toBeFocused();
    await expect(tip(page)).toHaveAttribute("data-key", "2ND");
    await expect(tip(page)).toContainText("Second function");

    await key(page, "PI").hover();
    await expect(tip(page)).toHaveAttribute("data-key", "PI");
    await tipsSwitch(page).click();
    await expect(tip(page)).toHaveCount(0);
  });

  test("keys describe their 2nd function even with tips off", async ({ page }) => {
    await expect(key(page, "MODE")).toHaveAccessibleDescription("2nd: quit");
    await expect(key(page, "LOG")).toHaveAccessibleDescription("2nd: 10ˣ, Ten to the power");
    await expect(key(page, "MODE")).not.toHaveAttribute("title", /.*/);
  });
});

test.describe("phone", () => {
  test.skip(({ isMobile }) => !isMobile, "long-press is for touch screens");

  test("with tips on, a long-press shows the tip without pressing the key", async ({ page }) => {
    await tipsSwitch(page).tap();
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "true");
    await key(page, "1").tap();
    await expect(screen(page)).toHaveText("1");

    await longPress(page, "7");
    await expect(tip(page)).toBeVisible();
    await expect(tip(page)).toContainText("Digit 7");
    await page.waitForTimeout(300);
    await expect(screen(page)).toHaveText("1");

    // A tap elsewhere dismisses it; a short tap still presses the key.
    await key(page, "2").tap();
    await expect(tip(page)).toHaveCount(0);
    await expect(screen(page)).toHaveText("12");
  });

  test("with tips off, a long-press presses the key", async ({ page }) => {
    await expect(tipsSwitch(page)).toHaveAttribute("aria-checked", "false");
    await longPress(page, "7");
    await expect(screen(page)).toHaveText("7");
    await expect(tip(page)).toHaveCount(0);
  });
});
