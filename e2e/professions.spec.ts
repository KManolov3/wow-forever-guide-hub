import type { Page } from "@playwright/test";
import { currentHash, expect, load, test } from "./fixtures";

/** Fresh page load of the profession guides at the given hash. */
async function loadProfessions(page: Page, hash = "#/professions/tailoring") {
  await page.goto("about:blank");
  await page.goto(`/${hash}`);
  await expect(page.locator("main.profession-guide")).toBeVisible();
}

const professionButton = (page: Page, name: string) =>
  page.getByRole("group", { name: "Profession" }).getByRole("button", { name });
const setSkill = (page: Page, skill: number) => page.getByLabel("My skill").fill(String(skill));
const step = (page: Page, name: string) => page.locator(".craft-step").filter({ has: page.getByText(name) });

test.describe("O. Profession guides", () => {
  test("TC-93 header opens the profession guides and keeps the calculator's build", async ({ page }) => {
    await load(page, "#/mage/25522252231-235523");
    await page.getByRole("link", { name: "Professions", exact: true }).click();

    expect(await currentHash(page)).toBe("#/professions/tailoring");
    await expect(page.locator(".masthead .subtitle")).toContainText("Horde Profession Guides");
    await expect(page.getByRole("link", { name: "Professions", exact: true })).toHaveAttribute("aria-current", "page");
    await expect(professionButton(page, "Tailoring")).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByRole("navigation", { name: "Choose a class" })).toHaveCount(0);

    await page.getByRole("link", { name: "Talents", exact: true }).click();
    expect(await currentHash(page)).toBe("#/mage/25522252231-235523");
  });

  test("TC-94 profession picker switches profession and the URL restores it", async ({ page }) => {
    await loadProfessions(page);
    await professionButton(page, "Enchanting").click();
    expect(await currentHash(page)).toBe("#/professions/enchanting");
    await expect(page.getByRole("heading", { name: "Leveling Enchanting 1–300" })).toBeVisible();
    await expect(page.getByText("Hgarth, Sun Rock Retreat, Stonetalon Mountains")).toBeVisible();

    await loadProfessions(page, "#/professions/enchanting");
    await expect(professionButton(page, "Enchanting")).toHaveAttribute("aria-pressed", "true");

    await loadProfessions(page, "#/professions/alchemy");
    await expect(professionButton(page, "Tailoring")).toHaveAttribute("aria-pressed", "true");
    expect(await currentHash(page)).toBe("#/professions/tailoring");
  });

  test("TC-95 the route covers 1–300 with Horde trainers and marks steps past the beta", async ({ page }) => {
    await loadProfessions(page);
    const steps = page.locator(".craft-step");
    await expect(steps.first()).toContainText("1–38");
    await expect(steps.last()).toContainText("286–300");
    await expect(step(page, "Bolt of Linen Cloth").first()).toContainText("2 Linen Cloth");
    await expect(page.getByLabel("Expert")).toContainText("Josef Gregorian, Magic Quarter, Undercity");
    await expect(step(page, "Runecloth Belt")).toContainText("Not confirmed: the beta stops at skill 225");
    await expect(step(page, "Azure Silk Pants")).not.toContainText("Not confirmed");
    await expect(step(page, "Azure Silk Hood")).toContainText("Not confirmed: Forever's skill thresholds");
    await expect(step(page, "Linen Bag")).toContainText("3 Bolt of Linen Cloth, 3 Coarse Thread");
  });

  test("TC-96 my skill marks the current step, the next trainer rank and the materials left", async ({ page }) => {
    await loadProfessions(page);
    await expect(page.getByRole("heading", { name: "Materials for the whole route" })).toBeVisible();
    await setSkill(page, 130);

    await expect(page.getByRole("status", { name: "What to make now" })).toHaveText(
      "At skill 130: make 14 × Bolt of Silk Cloth (orange) to reach 141. Next trainer rank: Artisan at skill 200 (level 35).",
    );
    await expect(page.locator(".craft-step.now")).toHaveCount(1);
    await expect(page.locator(".craft-step.now")).toContainText("Bolt of Silk Cloth");
    await expect(page.locator(".craft-step.done")).toHaveCount(9);
    await expect(page.locator(".profession-tier.next")).toHaveAttribute("aria-label", "Artisan");

    const materials = page.locator("#profession-materials");
    await expect(materials.getByRole("heading", { name: "Materials from skill 130" })).toBeVisible();
    await expect(materials).not.toContainText("Linen Cloth");
    await expect(materials).toContainText("Mageweave Cloth");

    await setSkill(page, 300);
    await expect(page.getByRole("status", { name: "What to make now" })).toHaveText(
      "You have finished the route at skill 300.",
    );
    await expect(materials).toContainText("Nothing left to buy.");
  });

  test("TC-97 colour thresholds show where published and the skill resets per profession", async ({ page }) => {
    await loadProfessions(page, "#/professions/enchanting");
    await expect(
      step(page, "Enchant Chest – Inferior Stamina")
        .first()
        .getByLabel("Orange from 15, yellow 70, green 90, grey 110"),
    ).toBeVisible();
    await setSkill(page, 20);
    await expect(page.getByRole("status", { name: "What to make now" })).toContainText(
      "make 56 × Enchant Chest – Inferior Stamina (orange) to reach 75",
    );

    await professionButton(page, "Tailoring").click();
    await expect(page.getByLabel("My skill")).toHaveValue("");
  });

  test("TC-98 section navigation and a 375 px phone", async ({ page }) => {
    await loadProfessions(page);
    const nav = page.getByRole("navigation", { name: "Guide sections" });
    for (const [name, id] of [
      ["Materials", "profession-materials"],
      ["Tips", "profession-tips"],
      ["Route", "profession-route"],
    ]) {
      await nav.getByRole("button", { name, exact: true }).click();
      await expect(page.locator(`#${id}`)).toBeFocused();
      await expect(page.locator(`#${id}`)).toBeInViewport();
    }

    await page.setViewportSize({ width: 375, height: 812 });
    for (const id of ["tailoring", "enchanting"]) {
      await loadProfessions(page, `#/professions/${id}/warlock`);
      await setSkill(page, 150);
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
    }
  });

  test("TC-99 class focus lists Warlock items with the level to use them and what the recipe costs", async ({
    page,
  }) => {
    await loadProfessions(page);
    const focus = page.getByRole("group", { name: "Class focus" });
    await focus.getByRole("button", { name: "Warlock" }).click();
    expect(await currentHash(page)).toBe("#/professions/tailoring/warlock");

    const items = page.locator("#profession-class");
    await expect(items.getByRole("heading", { name: "Tailoring for Warlocks" })).toBeVisible();
    await expect(
      page.getByRole("navigation", { name: "Guide sections" }).getByRole("button", { name: "Warlock items" }),
    ).toBeVisible();
    const first = items.locator("li.class-item").first();
    await expect(first).toHaveAccessibleName("Novice Arcanist's Sash");
    await expect(first.getByLabel("Skill 50")).toBeVisible();
    await expect(first.getByLabel("Level 10")).toBeVisible();
    const gown = items.getByRole("listitem", { name: "Shadow Gown", exact: true });
    await expect(gown.getByLabel("Skill 110")).toBeVisible();
    await expect(gown.getByLabel("Level 22")).toBeVisible();
    await expect(gown).toContainText("pattern costs 30 Merchant's Favor");
    await expect(gown).toContainText("Jim'bek");
    await expect(items.getByRole("listitem", { name: "Black Slippers" })).toContainText("no pattern to buy");
    await expect(step(page, "Runecloth Cloak").locator(".class-tag")).toHaveText("Warlock");

    await setSkill(page, 120);
    await expect(items.getByRole("listitem", { name: "Shadow Gown", exact: true })).toContainText("Can make");
    await expect(items.getByRole("listitem", { name: "Shadow Leggings", exact: true })).not.toContainText("Can make");

    await professionButton(page, "Enchanting").click();
    expect(await currentHash(page)).toBe("#/professions/enchanting/warlock");
    await expect(items.getByRole("listitem", { name: "Brilliant Wand" })).toContainText(
      "pattern costs 180 Merchant's Favor",
    );
    await expect(
      items.getByRole("listitem", { name: "Greater Magic Wand", exact: true }).getByLabel("Level 13"),
    ).toBeVisible();

    await focus.getByRole("button", { name: "Mage" }).click();
    await expect(items).toContainText("Mage items coming soon");
    await focus.getByRole("button", { name: "None" }).click();
    expect(await currentHash(page)).toBe("#/professions/enchanting");
    await expect(items).toHaveCount(0);
  });

  test("TC-100 pairing with Enchanting swaps in green steps and shows what they disenchant into", async ({ page }) => {
    await loadProfessions(page);
    await expect(step(page, "Linen Belt")).toBeVisible();
    await page.getByLabel(/I also level Enchanting/).check();

    const pants = step(page, "Brown Linen Pants");
    await expect(pants).toContainText("For enchanters");
    await expect(pants).toContainText("Disenchant all 24: about 29 Strange Dust, 7 Lesser Magic Essence");
    await expect(step(page, "Linen Belt")).toHaveCount(0);
    await expect(page.getByRole("list", { name: "Disenchant yield" })).toContainText("Strange Dust");

    await page.getByLabel(/I also level Enchanting/).uncheck();
    await expect(step(page, "Linen Belt")).toBeVisible();
    await professionButton(page, "Enchanting").click();
    await expect(page.getByLabel(/I also level Enchanting/)).toHaveCount(0);
  });
});
