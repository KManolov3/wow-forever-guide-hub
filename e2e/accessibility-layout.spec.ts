import { type Page } from "@playwright/test";
import {
  CLASS_ORDER,
  LINKS,
  classButton,
  clickTalent,
  expect,
  expectRank,
  load,
  note,
  rightClick,
  talentButtons,
  test,
  tree,
} from "./fixtures";

const resetAll = (page: Page) => page.getByRole("button", { name: "Reset all" });
/** Disabled tree Reset buttons are `visibility: hidden`, so hidden ones must be included to assert on them. */
const treeReset = (page: Page, name: string) =>
  tree(page, name).getByRole("button", { name: "Reset", exact: true, includeHidden: true });

test.describe("J. Accessibility", () => {
  test("TC-53 talents are real buttons with 'X, rank N of M' names", async ({ page }) => {
    await load(page, "#/mage/02");
    const buttons = talentButtons(tree(page, "Arcane"));
    await expect(buttons).toHaveCount(19);
    expect(new Set(await buttons.evaluateAll((els) => els.map((e) => e.tagName)))).toEqual(new Set(["BUTTON"]));

    await expect(tree(page, "Arcane").getByRole("button", { name: "Arcane Focus, rank 2 of 5", exact: true })).toHaveCount(1);
    await expect(tree(page, "Arcane").getByRole("button", { name: "Arcane Power, rank 0 of 1", exact: true })).toHaveCount(1);

    await clickTalent(page, "Arcane", "Arcane Focus");
    await expectRank(page, "Arcane", "Arcane Focus", 3, 5);
  });

  test("TC-54 keyboard focus shows the tooltip and a visible focus ring; Enter learns", async ({ page }) => {
    await load(page, "#/mage");
    await page.mouse.click(2, 2);

    const focusedLabel = () => page.evaluate(() => document.activeElement?.getAttribute("aria-label") ?? "");
    let presses = 0;
    while (!(await focusedLabel()).startsWith("Wand Specialization,") && presses < 50) {
      await page.keyboard.press("Tab");
      presses++;
    }
    note("Tab presses to first talent", String(presses));
    expect(await focusedLabel()).toBe("Wand Specialization, rank 0 of 2");

    const outline = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement!);
      return { style: s.outlineStyle, width: parseFloat(s.outlineWidth) };
    });
    expect(outline.style).not.toBe("none");
    expect(outline.width).toBeGreaterThan(0);
    await expect(page.getByRole("tooltip").locator(".tooltip-title")).toHaveText("Wand Specialization");

    await page.keyboard.press("Enter");
    await page.keyboard.press("Space");
    expect(await focusedLabel()).toBe("Wand Specialization, rank 2 of 2");

    await page.keyboard.press("Tab");
    expect(await focusedLabel()).toMatch(/^Arcane Focus, rank/);
    await expect(page.getByRole("tooltip")).toHaveCount(1);
    await expect(page.getByRole("tooltip").locator(".tooltip-title")).toHaveText("Arcane Focus");
  });
});

test.describe("K. Responsive layout and quality", () => {
  test("TC-55 desktop layout: three trees side by side, each at least 290 px wide", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await load(page, "#/druid");
    const boxes = await page.locator("section.tree").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (const [i, box] of boxes.entries()) {
      expect(Math.abs(box.top - boxes[0].top)).toBeLessThanOrEqual(2);
      expect(box.width).toBeGreaterThanOrEqual(290);
      if (i > 0) expect(box.left).toBeGreaterThanOrEqual(boxes[i - 1].right);
    }
    const button = (await talentButtons(page.locator("section.tree").first()).first().boundingBox())!;
    expect(Math.abs(button.width - 52)).toBeLessThanOrEqual(1);
    expect(Math.abs(button.height - 52)).toBeLessThanOrEqual(1);
  });

  test("TC-56 phone layout at 375 px: no horizontal scroll, trees stacked, 46 px cells", async ({ page }) => {
    const noHorizontalScroll = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);

    await page.setViewportSize({ width: 375, height: 812 });
    for (const cls of CLASS_ORDER) {
      await load(page, `#/${cls.toLowerCase()}`);
      expect(await noHorizontalScroll(), cls).toBe(true);
    }

    await load(page, "#/mage");
    const boxes = await page.locator("section.tree").evaluateAll((els) => els.map((e) => e.getBoundingClientRect().toJSON()));
    for (let i = 1; i < boxes.length; i++) expect(boxes[i].top).toBeGreaterThanOrEqual(boxes[i - 1].bottom);
    const button = (await talentButtons(page.locator("section.tree").first()).first().boundingBox())!;
    expect(Math.abs(button.width - 46)).toBeLessThanOrEqual(1);
    expect(Math.abs(button.height - 46)).toBeLessThanOrEqual(1);

    await load(page, "#/mage/02");
    for (const name of ["Missile Barrage", "Wand Specialization"]) {
      await tree(page, "Arcane").getByRole("button", { name: new RegExp(`^${name}, rank`) }).hover();
      const tip = (await page.getByRole("tooltip").boundingBox())!;
      expect(tip.x, name).toBeGreaterThanOrEqual(0);
      expect(tip.x + tip.width, name).toBeLessThanOrEqual(375);
      expect(await noHorizontalScroll(), name).toBe(true);
    }

    for (const width of [400, 768]) {
      await page.setViewportSize({ width, height: 900 });
      await load(page, "#/mage");
      expect(await noHorizontalScroll(), `${width}px`).toBe(true);
    }
  });

  test("TC-57 no console errors across a full session", async ({ page, context }) => {
    // The auto fixture fails the test on any console error or warning; this test drives a long session.
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await load(page, "#/mage");
    for (const cls of CLASS_ORDER) await classButton(page, cls).click();
    await classButton(page, "Mage").click();

    await clickTalent(page, "Arcane", "Arcane Focus", 3);
    await rightClick(page, "Arcane", "Arcane Focus");
    await clickTalent(page, "Arcane", "Arcane Focus", 1, { modifiers: ["Shift"] });
    for (const name of ["Arcane Focus", "Arcane Power", "Missile Barrage", "Arcane Wrath"]) {
      await tree(page, "Arcane").getByRole("button", { name: new RegExp(`^${name}, rank`) }).hover();
    }
    await page.getByRole("button", { name: "Copy link" }).click();
    await expect(page.getByRole("button", { name: "Copied!" })).toBeVisible();
    await treeReset(page, "Arcane").click();
    await clickTalent(page, "Fire", "Improved Fireball", 2);
    await resetAll(page).click();

    for (const link of [LINKS.L51, "#/mage/0000020", "#/mage/9", "#/mage/0500320-0-31", "#/mage/0000000000000010"]) {
      await load(page, link);
    }
  });

  test("TC-58 privacy: no cookies or storage, state only in URL", async ({ page }) => {
    const hosts = new Set<string>();
    page.on("request", (req) => hosts.add(new URL(req.url()).hostname));

    await load(page, "#/mage");
    await clickTalent(page, "Arcane", "Arcane Focus", 3);
    await clickTalent(page, "Frost", "Frost Warding", 2);

    expect(
      await page.evaluate(() => ({ cookie: document.cookie, local: localStorage.length, session: sessionStorage.length })),
    ).toEqual({ cookie: "", local: 0, session: 0 });

    const allowed = ["localhost", "wow.zamimg.com", "fonts.googleapis.com", "fonts.gstatic.com"];
    expect([...hosts].filter((h) => h && !allowed.includes(h))).toEqual([]);
  });
});
