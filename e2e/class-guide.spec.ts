import type { Page } from "@playwright/test";
import { classButton, currentHash, expect, expectSummary, load, test } from "./fixtures";

/** Fresh page load of the class guide at the given hash. */
async function loadClassGuide(page: Page, hash = "#/guide/warlock") {
  await page.goto("about:blank");
  await page.goto(`/${hash}`);
  await expect(page.locator("main.class-guide")).toBeVisible();
}

const specButton = (page: Page, name: string) =>
  page.getByRole("group", { name: "Specialization" }).getByRole("button", { name });
const setLevel = (page: Page, level: number) => page.getByLabel("My level").fill(String(level));
const panel = (page: Page, title: string | RegExp) =>
  page.locator("section.guide-panel").filter({ has: page.getByRole("heading", { level: 3, name: title }) });

test.describe("N. Class guide", () => {
  test("TC-81 header opens the class guide for the current class and keeps it when switching back", async ({ page }) => {
    await load(page, "#/warlock");
    await page.getByRole("link", { name: "Class guide", exact: true }).click();

    expect(await currentHash(page)).toBe("#/guide/warlock");
    await expect(page.locator(".masthead .subtitle")).toContainText("Class Guide");
    await expect(page.getByRole("link", { name: "Class guide", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(specButton(page, "Affliction")).toHaveAttribute("aria-pressed", "true");

    await page.getByRole("link", { name: "Talents", exact: true }).click();
    await expect(page.locator(".summary .class-name")).toHaveText("Warlock");
  });

  test("TC-82 spec picker switches spec and the URL restores it", async ({ page }) => {
    await loadClassGuide(page);
    await specButton(page, "Destruction").click();
    expect(await currentHash(page)).toBe("#/guide/warlock/destruction");
    await expect(page.getByRole("heading", { name: "Playing Destruction" })).toBeVisible();

    await loadClassGuide(page, "#/guide/warlock/demonology");
    await expect(specButton(page, "Demonology")).toHaveAttribute("aria-pressed", "true");

    await loadClassGuide(page, "#/guide/warlock/frost");
    await expect(specButton(page, "Affliction")).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-83 classes without a guide say so and link to the warlock guide", async ({ page }) => {
    await loadClassGuide(page, "#/guide/mage");
    await expect(page.getByRole("heading", { name: "Mage guide coming soon" })).toBeVisible();
    await page.getByRole("link", { name: "Warlock", exact: true }).click();
    await expect(classButton(page, "Warlock")).toHaveAttribute("aria-pressed", "true");
    await expect(specButton(page, "Affliction")).toBeVisible();
  });

  test("TC-84 leveling plan recommends one spec and shows the rotation for my level", async ({ page }) => {
    await loadClassGuide(page, "#/guide/warlock/destruction");
    const plan = panel(page, /^Leveling plan: Affliction/);
    await expect(plan.locator(".recommended-badge")).toHaveText("Recommended");
    await expect(page.locator(".spec-picker .recommended-badge")).toHaveCount(1);
    await expect(specButton(page, "Affliction")).toContainText("Leveling");

    const brackets = plan.getByRole("group", { name: "Level range" });
    await expect(brackets.getByRole("button", { name: "1–3" })).toHaveAttribute("aria-pressed", "true");

    await setLevel(page, 20);
    await expect(brackets.getByRole("button", { name: "20–29" })).toHaveAttribute("aria-pressed", "true");
    const steps = plan.locator(".rotation-steps li");
    await expect(steps.filter({ hasText: "Drain Life" })).toHaveCount(1);
    await expect(steps.filter({ hasText: "Wrack" })).toHaveCount(0);

    await brackets.getByRole("button", { name: "41–60" }).click();
    const wrack = steps.filter({ hasText: "Wrack" });
    await expect(wrack).toHaveClass(/locked/);
    await expect(wrack.locator(".level-tag")).toHaveText("level 41");
    await expect(wrack.locator(".added-tag")).toHaveText("new in this range");

    await setLevel(page, 5);
    await expect(brackets.getByRole("button", { name: "4–7" })).toHaveAttribute("aria-pressed", "true");
  });

  test("TC-85 talent order shows the build at my level and opens it in the calculator", async ({ page }) => {
    await loadClassGuide(page);
    const plan = panel(page, /^Leveling plan/);
    const summary = plan.locator(".talent-order-summary");
    await expect(summary).toContainText("Level 60 build: 37 / 14 / 0");

    await setLevel(page, 25);
    await expect(summary).toContainText("Build at level 25: 16 / 0 / 0");
    await plan.getByRole("link", { name: "Open level 25 build in the calculator" }).click();
    await expectSummary(page, { points: 16, build: "16 / 0 / 0", level: "25" });
  });

  test("TC-86 spell list filters by school and shows training priorities", async ({ page }) => {
    await loadClassGuide(page);
    const spells = panel(page, "Spells");
    const spell = (name: string) => spells.locator(".spell").filter({ has: page.getByText(name, { exact: true }) });
    await expect(spell("Bane of Agony")).toContainText("NEW");
    await expect(spell("Bane of Agony").locator(".priority-badge")).toHaveText("Must train");
    await expect(spell("Drain Soul")).toContainText("Must train: 10 · Skip: 24, 38, 52");
    await expect(spells.locator(".spell").filter({ hasText: "Curse of Shadow" })).toHaveCount(0);

    await spells.getByRole("button", { name: "Pet", exact: true }).click();
    await expect(spells.locator(".spell")).toHaveCount(6);

    await setLevel(page, 25);
    await expect(spell("Summon Felhunter")).toHaveClass(/locked/);
  });

  test("TC-88 trainer plan lists what to buy at each level and the next visit", async ({ page }) => {
    await loadClassGuide(page);
    const plan = panel(page, /^Leveling plan/);
    const visit = (level: number) => plan.getByRole("listitem", { name: `Level ${level}`, exact: true });
    const row = (level: number, name: string) => visit(level).locator("li").filter({ hasText: name });

    await expect(row(10, "Drain Soul")).toContainText("Must train");
    await expect(row(24, "Drain Soul (rank 2)")).toHaveCount(0);
    await expect(visit(26)).not.toContainText("Searing Pain");

    await plan.getByLabel("Show ranks to skip").check();
    await expect(row(24, "Drain Soul (rank 2)")).toContainText("Skip");
    await expect(visit(26)).toContainText("Searing Pain (rank 2)");

    await setLevel(page, 34);
    await expect(plan.getByRole("status")).toHaveText(
      /^Next trainer visit at level 36: must train: Life Tap \(rank 4\); recommended: /,
    );
    await expect(visit(36)).toHaveClass(/next/);
    await expect(visit(34)).toHaveClass(/done/);
  });

  test("TC-87 class guide fits a 375 px phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    for (const spec of ["affliction", "demonology", "destruction"]) {
      await loadClassGuide(page, `#/guide/warlock/${spec}`);
      await setLevel(page, 30);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    }
  });
});
