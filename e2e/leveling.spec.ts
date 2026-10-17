import type { Page } from "@playwright/test";
import { clickTalent, currentHash, expect, expectSummary, load, selectClass, test } from "./fixtures";

/** Fresh page load of the leveling guide at the given hash. */
async function loadGuide(page: Page, hash = "#/leveling") {
  await page.goto("about:blank");
  await page.goto(`/${hash}`);
  await expect(page.locator("main.guide")).toBeVisible();
}

const startButton = (page: Page, name: string) =>
  page.getByRole("group", { name: "Starting zone" }).getByRole("button", { name: new RegExp(`^${name}`) });
const steps = (page: Page) => page.locator("ol.steps > li");
const currentStep = (page: Page) => page.locator('ol.steps > li[aria-current="step"]');
const stepNames = (page: Page) => page.locator("ol.steps .step-name").allTextContents();
const levelsOf = async (page: Page) => {
  const text = (await currentStep(page).locator(".step-levels").textContent())!;
  const [from, to = from] = text.split("–").map(Number);
  return [from, to];
};
const continentTab = (page: Page, name: string) => page.getByRole("group", { name: "Continent" }).getByRole("button", { name });
const progress = (page: Page) =>
  page.locator(".guide-summary .stat").filter({ has: page.locator(".label", { hasText: "Progress" }) }).locator(".value");

test.describe("M. Leveling guide", () => {
  test("TC-65 header switches between the calculator and the guide, keeping the build", async ({ page }) => {
    await load(page, "#/mage");
    await clickTalent(page, "Arcane", "Arcane Focus", 3);

    await page.getByRole("link", { name: "Leveling guide" }).click();
    await expect(page.locator("main.guide")).toBeVisible();
    expect(await currentHash(page)).toBe("#/leveling/durotar");
    await expect(page.locator(".masthead .subtitle")).toContainText("Horde Leveling Guide");
    await expect(page.getByRole("link", { name: "Leveling guide" })).toHaveAttribute("aria-current", "page");

    await page.getByRole("link", { name: "Talents" }).click();
    await expect(page.locator("section.tree")).toHaveCount(3);
    await expect(page.locator(".summary .class-name")).toHaveText("Mage");
    await expectSummary(page, { points: 3 });
  });

  test("TC-66 starting zone picker sets the first step and leaves out the other starting zones", async ({ page }) => {
    await loadGuide(page);
    const picker = page.getByRole("group", { name: "Starting zone" }).getByRole("button");
    await expect(picker).toHaveCount(4);
    await expect(startButton(page, "Durotar")).toHaveAttribute("aria-pressed", "true");

    await startButton(page, "Tirisfal Glades").click();
    await expect(startButton(page, "Tirisfal Glades")).toHaveAttribute("aria-pressed", "true");
    expect(await currentHash(page)).toBe("#/leveling/tirisfal");
    await expect(steps(page).first().locator(".step-name")).toHaveText("Tirisfal Glades");

    const names = await stepNames(page);
    for (const other of ["Durotar", "Mulgore", "Zephras Isle", "The Deadmines", "The Stockade", "Gnomeregan"]) {
      expect(names.map((n) => n.replace("NEW", ""))).not.toContain(other);
    }
    expect(names.filter((n) => n === "The Barrens")).toHaveLength(3);
  });

  test("TC-67 guide links restore the starting zone; unknown zones fall back to Durotar", async ({ page }) => {
    await loadGuide(page, "#/leveling/mulgore");
    await expect(startButton(page, "Mulgore")).toHaveAttribute("aria-pressed", "true");
    await expect(steps(page).first().locator(".step-name")).toHaveText("Mulgore");

    await loadGuide(page, "#/leveling/elwynn");
    await expect(startButton(page, "Durotar")).toHaveAttribute("aria-pressed", "true");
    expect(await currentHash(page)).toBe("#/leveling/durotar");
  });

  test("TC-68 timeline shows one bar per visit and selects that step", async ({ page }) => {
    await loadGuide(page);
    const timeline = page.getByRole("group", { name: "Route by level" });
    const barrens = timeline.getByRole("button", { name: /: The Barrens, levels/ });
    await expect(barrens).toHaveCount(3);

    await barrens.nth(1).click();
    await expect(barrens.nth(1)).toHaveAttribute("aria-pressed", "true");
    await expect(currentStep(page).locator(".step-name")).toHaveText("The Barrens");
    await expect(currentStep(page).locator(".step-meta")).toContainText("visit 2 of 3");
    await expect(currentStep(page).locator(".step-detail")).toContainText("Getting there:");
  });

  test("TC-69 map follows the selected step and cycles through a zone's visits", async ({ page }) => {
    await loadGuide(page);
    await expect(continentTab(page, "Kalimdor")).toHaveAttribute("aria-pressed", "true");

    await steps(page).filter({ hasText: "Silverpine Forest" }).locator(".step-main").click();
    await expect(continentTab(page, "Eastern Kingdoms")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("group", { name: "Route map of Eastern Kingdoms" })).toBeVisible();

    await continentTab(page, "Kalimdor").click();
    const marker = page.getByRole("button", { name: /^The Barrens, levels 10–33, 3 visits$/ });
    await marker.click();
    await expect(currentStep(page).locator(".step-meta")).toContainText("visit 1 of 3");
    await marker.click();
    await expect(currentStep(page).locator(".step-meta")).toContainText("visit 2 of 3");
    await expect(page.locator(".map-caption")).toContainText(`Step ${(await currentStep(page).locator(".step-number").textContent())!}:`);
  });

  test("TC-74 the route map is the in-game map with clickable zones, zoom and pan", async ({ page }) => {
    await loadGuide(page);
    const map = page.getByRole("group", { name: "Route map of Kalimdor" });
    const image = map.locator("image");
    const href = (await image.getAttribute("href"))!;
    expect(href).toMatch(/maps\/kalimdor\.webp$/);
    expect((await page.request.get(href)).ok()).toBe(true);

    const viewWidth = async () => Number((await map.getAttribute("viewBox"))!.split(" ")[2]);
    const viewX = async () => Number((await map.getAttribute("viewBox"))!.split(" ")[0]);

    const whole = page.getByRole("button", { name: "Show the whole continent" });
    await whole.click();
    await expect(whole).toBeDisabled();
    const full = await viewWidth();

    await page.getByRole("button", { name: "Zoom in" }).click();
    expect(await viewWidth()).toBeLessThan(full);
    await expect(whole).toBeEnabled();

    const box = (await map.boundingBox())!;
    const before = await viewX();
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2, { steps: 5 });
    await page.mouse.up();
    expect(await viewX()).toBeLessThan(before);

    await whole.click();
    expect(await viewWidth()).toBe(full);

    await steps(page).filter({ hasText: "Wailing Caverns" }).locator(".step-main").click();
    await page.getByRole("button", { name: /^Durotar, levels 1–10, 1 visit$/ }).click();
    await expect(currentStep(page).locator(".step-name")).toHaveText("Durotar");
  });

  test("TC-75 clicking a zone centres the map on it and zooms to fit it", async ({ page }) => {
    await loadGuide(page);
    const map = page.getByRole("group", { name: "Route map of Kalimdor" });
    const view = async () => (await map.getAttribute("viewBox"))!.split(" ").map(Number);
    /** Centre of a zone outline's bounding box, in map coordinates. */
    const zoneCentre = (name: RegExp) =>
      page.getByRole("button", { name }).evaluate((el) => {
        const b = (el as SVGGraphicsElement).getBBox();
        return [b.x + b.width / 2, b.y + b.height / 2, b.width, b.height];
      });
    const expectFramed = async (name: RegExp) => {
      const [x, y, w, h] = await view();
      const [cx, cy, zw, zh] = await zoneCentre(name);
      expect(Math.abs(x + w / 2 - cx), "centred horizontally").toBeLessThan(w * 0.1);
      expect(Math.abs(y + h / 2 - cy), "centred vertically").toBeLessThan(h * 0.1);
      expect(zw).toBeLessThanOrEqual(w);
      expect(zh).toBeLessThanOrEqual(h);
      return w;
    };

    await page.getByRole("button", { name: "Show the whole continent" }).click();
    const full = (await view())[2];

    await page.getByRole("button", { name: /^The Barrens, levels/ }).click();
    const barrens = await expectFramed(/^The Barrens, levels/);
    expect(barrens).toBeLessThan(full);

    await page.getByRole("button", { name: /^Durotar, levels/ }).click();
    const durotar = await expectFramed(/^Durotar, levels/);
    expect(durotar, "a smaller zone zooms in further").toBeLessThan(barrens);
    await expect(currentStep(page).locator(".step-name")).toHaveText("Durotar");
  });

  test("TC-70 'My level' jumps to a step covering that level", async ({ page }) => {
    await loadGuide(page);
    await page.getByLabel("My level").fill("27");
    await page.getByRole("button", { name: "Find step" }).click();
    const [from, to] = await levelsOf(page);
    expect(from).toBeLessThanOrEqual(27);
    expect(to).toBeGreaterThanOrEqual(27);
  });

  test("TC-71 ticked steps count as progress, survive a reload and reset", async ({ page }) => {
    await loadGuide(page);
    const total = await steps(page).count();
    await expect(progress(page)).toHaveText(`0 / ${total}`);
    await expect(page.getByRole("button", { name: "Reset progress" })).toBeDisabled();

    await page.getByRole("checkbox", { name: /^Mark step 1,/ }).check();
    await page.getByRole("checkbox", { name: /^Mark step 2,/ }).check();
    await expect(progress(page)).toHaveText(`2 / ${total}`);

    await page.reload();
    await expect(progress(page)).toHaveText(`2 / ${total}`);
    await expect(page.getByRole("checkbox", { name: /^Mark step 2,/ })).toBeChecked();

    await page.getByRole("button", { name: "Reset progress" }).click();
    await expect(progress(page)).toHaveText(`0 / ${total}`);
  });

  test("TC-72 guide fits a 375 px phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await loadGuide(page);
    const noHorizontalScroll = () =>
      page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(await noHorizontalScroll()).toBe(true);

    await page.getByRole("group", { name: "Route by level" }).getByRole("button").first().hover();
    expect(await noHorizontalScroll()).toBe(true);

    await loadGuide(page, "#/leveling/zephras-isle");
    expect(await noHorizontalScroll()).toBe(true);
  });

  test("TC-73 the quiz still opens the calculator from the guide", async ({ page }) => {
    await loadGuide(page);
    await page.getByRole("button", { name: "Find my class" }).click();
    await expect(page.getByRole("dialog", { name: "Find your class" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.locator("main.guide")).toBeVisible();
    await page.getByRole("link", { name: "Talents" }).click();
    await selectClass(page, "Warrior");
  });
});
