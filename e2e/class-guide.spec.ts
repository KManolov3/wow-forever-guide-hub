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
    await expect(plan.getByRole("status", { name: "Next trainer visit" })).toHaveText(
      /^Next trainer visit at level 36: must train: Life Tap \(rank 4\); recommended: /,
    );
    await expect(visit(36)).toHaveClass(/next/);
    await expect(visit(34)).toHaveClass(/done/);
  });

  test("TC-89 gear upgrades filter by source and follow my level", async ({ page }) => {
    await loadClassGuide(page);
    const plan = panel(page, /^Leveling plan/);
    const gear = plan.locator(".gear");
    const item = (name: string) => gear.filter({ has: page.getByText(name, { exact: true }) });

    await expect(item("Gravestone Scepter")).toContainText("Blackfathom Deeps (dungeon, levels 24–32)");
    await expect(item("Gravestone Scepter").getByRole("link", { name: "Gravestone Scepter" })).toHaveAttribute(
      "href",
      "https://www.wowhead.com/forever/item=7001",
    );
    await expect(plan.getByLabel("Hide outgrown items")).toHaveCount(0);

    await plan.getByRole("group", { name: "Filter gear by source" }).getByRole("button", { name: "Auction house" }).click();
    await expect(gear.locator(".gear-source")).toHaveText(Array(await gear.count()).fill("Auction house"));
    await plan.getByRole("group", { name: "Filter gear by source" }).getByRole("button", { name: "All" }).click();

    await setLevel(page, 17);
    await expect(plan.getByRole("status", { name: "Upcoming gear" })).toHaveText(
      "Coming up by level 22: Gravestone Scepter (18), Small Soul Pouch (20), Staff of Soran'ruk (20).",
    );
    await expect(item("Greater Magic Wand").locator(".gear-status")).toHaveText("Use now");
    await expect(item("Lesser Magic Wand")).toHaveCount(0);

    await plan.getByLabel("Hide outgrown items").uncheck();
    await expect(item("Lesser Magic Wand")).toHaveClass(/outgrown/);
  });

  test("TC-90 the class guide opens on the Warlock and keeps the calculator's class and build", async ({ page }) => {
    await load(page, "#/mage/25");
    await page.getByRole("link", { name: "Class guide", exact: true }).click();
    expect(await currentHash(page)).toBe("#/guide/warlock");
    await expect(classButton(page, "Warlock")).toHaveAttribute("aria-pressed", "true");

    await classButton(page, "Druid").click();
    await expect(page.getByRole("heading", { name: "Druid guide coming soon" })).toBeVisible();
    expect(await currentHash(page)).toBe("#/guide/druid");

    await page.getByRole("link", { name: "Talents", exact: true }).click();
    await expect(page.locator(".summary .class-name")).toHaveText("Mage");
    await expectSummary(page, { points: 7 });

    await loadClassGuide(page, "#/guide");
    await expect(classButton(page, "Warlock")).toHaveAttribute("aria-pressed", "true");
    expect(await currentHash(page)).toBe("#/guide/warlock");
  });

  test("TC-91 section navigation jumps to each section and marks the one in view", async ({ page }) => {
    await loadClassGuide(page);
    const nav = page.getByRole("navigation", { name: "Guide sections" });
    const link = (name: string) => nav.getByRole("button", { name, exact: true });
    await expect(link("Rotation")).toHaveAttribute("aria-current", "true");
    await expect(nav.getByLabel("My level")).toBeVisible();

    for (const [name, id] of [
      ["Gear", "guide-gear"],
      ["Spells", "guide-spells"],
      ["Talents", "guide-talents"],
    ]) {
      await link(name).click();
      await expect(link(name)).toHaveAttribute("aria-current", "true");
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(page.locator(`#${id}`)).toBeInViewport();
      await expect(nav).toBeInViewport();
    }
  });

  test("TC-92 rotation modes for leveling, dungeons and world PvP", async ({ page }) => {
    await loadClassGuide(page);
    const plan = panel(page, /^Leveling plan/);
    const modes = plan.getByRole("group", { name: "Rotation mode" });
    const brackets = plan.getByRole("group", { name: "Level range" });
    const rotation = plan.locator("#guide-rotation .rotation");
    await expect(modes.getByRole("button", { name: "Leveling" })).toHaveAttribute("aria-pressed", "true");

    await modes.getByRole("button", { name: "Dungeons" }).click();
    await expect(rotation).toContainText("No dungeon yet: Ragefire Chasm, the first one, is level 13.");

    await brackets.getByRole("button", { name: "10–13" }).click();
    await expect(rotation.locator("h4")).toHaveText("Dungeons, levels 10–13");
    await expect(rotation.locator(".rotation-steps li").filter({ hasText: "Immolate" })).toContainText("Bosses only");
    await expect(rotation.locator(".added-tag")).toHaveCount(0);
    await expect(rotation.locator(".rotation-context")).toHaveText("Pet: Imp");

    await brackets.getByRole("button", { name: "20–29" }).click();
    await expect(rotation.locator(".rotation-context")).toHaveText(
      "Pet: Imp (Succubus or Incubus when the group needs crowd control on humanoids)",
    );
    await expect(rotation.locator(".rotation-tips")).toContainText("Seduction holds one");
    await brackets.getByRole("button", { name: "10–13" }).click();

    await modes.getByRole("button", { name: "World PvP" }).click();
    await expect(rotation).toContainText("Nobody to fight yet");

    await setLevel(page, 45);
    await expect(rotation.locator("h4")).toHaveText("World PvP, levels 41–60");
    await expect(rotation.locator(".rotation-steps li").first()).toContainText("Corruption");
    const names = rotation.locator(".rotation-steps li strong");
    await expect(names.filter({ hasText: /^Death Coil$/ })).toHaveCount(1);
    await expect(names.filter({ hasText: /^Fear$/ })).toHaveCount(1);
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
