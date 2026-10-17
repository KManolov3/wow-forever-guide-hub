import { type Page } from "@playwright/test";
import {
  LINKS,
  classButton,
  clickTalent,
  currentHash,
  expect,
  expectHash,
  expectRank,
  expectSummary,
  load,
  note,
  rightClick,
  spend,
  test,
  tree,
} from "./fixtures";

const resetAll = (page: Page) => page.getByRole("button", { name: "Reset all" });
/** Disabled tree Reset buttons are `visibility: hidden`, so hidden ones must be included to assert on them. */
const treeReset = (page: Page, name: string) =>
  tree(page, name).getByRole("button", { name: "Reset", exact: true, includeHidden: true });
const copyButton = (page: Page) => page.getByRole("button", { name: /^(Copy link|Copied!)$/ });

const PALADIN_HOLY: [string, string, number][] = [
  ["Holy", "Divine Strength", 5],
  ["Holy", "Divine Intellect", 5],
  ["Holy", "Healing Light", 3],
  ["Holy", "Spiritual Focus", 2],
  ["Holy", "Reverence", 3],
  ["Holy", "Purifying Power", 2],
  ["Holy", "Holy Shock", 1],
  ["Holy", "Divine Precision", 1],
];

test.describe("H. Summary and reset", () => {
  test("TC-43 summary shows class, points, split and required level", async ({ page }) => {
    await load(page, LINKS.PAL);
    await expect(page.locator(".summary .class-name")).toHaveText("Paladin");
    await expectSummary(page, { points: 22, build: "22 / 0 / 0", level: "31" });

    await resetAll(page).click();
    await expectSummary(page, { points: 0 });
    await expect(page.locator(".summary .stat").filter({ hasText: "Required level" }).locator(".value")).not.toHaveText(/\d/);
  });

  test("TC-44 reset per tree", async ({ page }) => {
    await load(page, "#/mage");
    for (const name of ["Arcane", "Fire", "Frost"]) await expect(treeReset(page, name)).toBeDisabled();

    await clickTalent(page, "Arcane", "Arcane Focus", 3);
    await clickTalent(page, "Frost", "Frost Warding", 2);
    await expect(treeReset(page, "Arcane")).toBeEnabled();
    await expect(treeReset(page, "Frost")).toBeEnabled();
    await expect(treeReset(page, "Fire")).toBeDisabled();

    await treeReset(page, "Arcane").click();
    await expect(tree(page, "Arcane").locator(".tree-points")).toHaveText("0");
    await expect(tree(page, "Frost").locator(".tree-points")).toHaveText("2");
    await expectSummary(page, { build: "0 / 0 / 2" });
    await expectHash(page, "#/mage/-0-2", "#/mage/--2");
    await expect(treeReset(page, "Arcane")).toBeDisabled();
  });

  test("TC-45 reset all", async ({ page }) => {
    await load(page, "#/mage");
    await expect(resetAll(page)).toBeDisabled();

    await clickTalent(page, "Arcane", "Arcane Focus", 2);
    await expect(resetAll(page)).toBeEnabled();

    await resetAll(page).click();
    await expectSummary(page, { points: 0 });
    const ranks = await page.locator("section.tree .talent .rank").allTextContents();
    expect(ranks.length).toBeGreaterThan(0);
    for (const rank of ranks) expect(rank).toMatch(/^0\//);
    await expectHash(page, "#/mage/", "#/mage");
    await expect(resetAll(page)).toBeDisabled();
    for (const name of ["Arcane", "Fire", "Frost"]) await expect(treeReset(page, name)).toBeDisabled();
    await expect(classButton(page, "Mage")).toHaveAttribute("aria-pressed", "true");
  });
});

test.describe("I. Sharing and build links", () => {
  test("TC-46 URL hash always reflects class and build, with trailing trimming", async ({ page }) => {
    await load(page, "#/mage");
    const historyBefore = await page.evaluate(() => history.length);

    await clickTalent(page, "Arcane", "Arcane Focus", 5);
    await expectHash(page, "#/mage/05");

    await clickTalent(page, "Arcane", "Arcane Concentration", 3);
    await expectHash(page, "#/mage/0500003");

    await clickTalent(page, "Frost", "Frost Warding", 2);
    await clickTalent(page, "Frost", "Improved Frostbolt", 1);
    await expectHash(page, "#/mage/0500003-0-21", "#/mage/0500003--21");
    note("empty middle tree", `written as ${await currentHash(page)}`);

    await rightClick(page, "Frost", "Improved Frostbolt");
    await rightClick(page, "Frost", "Frost Warding", 2);
    await expectHash(page, "#/mage/0500003");

    note("history.length", `${historyBefore} before clicks, ${await page.evaluate(() => history.length)} after`);
  });

  test("TC-47 copy link copies the URL and confirms with 'Copied!'", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await load(page, "#/mage/0500003-0-21");

    await copyButton(page).click();
    await expect(copyButton(page)).toHaveText("Copied!");
    const { clipboard, href, hash } = await page.evaluate(async () => ({
      clipboard: await navigator.clipboard.readText(),
      href: location.href,
      hash: location.hash,
    }));
    expect(clipboard).toBe(href);
    expect(clipboard.endsWith(hash)).toBe(true);

    await expect(copyButton(page)).toHaveText("Copy link", { timeout: 3500 });
  });

  test("TC-48 copy link falls back to a prompt when the clipboard is unavailable", async ({ page }) => {
    await load(page, "#/mage/05");
    await page.evaluate(() => {
      const w = window as unknown as { __prompt: unknown };
      navigator.clipboard.writeText = () => Promise.reject(new Error("blocked"));
      w.__prompt = null;
      window.prompt = (msg, val) => {
        w.__prompt = [msg, val];
        return null;
      };
    });

    await copyButton(page).click();
    await expect.poll(() => page.evaluate(() => (window as unknown as { __prompt: unknown }).__prompt)).not.toBeNull();
    const [prompt, href] = await page.evaluate(() => [(window as unknown as { __prompt: string[] }).__prompt, location.href]);
    expect(prompt[1]).toBe(href);
    expect(href).toMatch(/\/#\/mage\/05$/);
    await expect(copyButton(page)).toHaveText("Copy link");
  });

  test("TC-49 shared link round trip restores the Paladin build built in the UI", async ({ page, context }) => {
    await context.grantPermissions(["clipboard-read", "clipboard-write"]);
    await load(page, "#/paladin");
    await spend(page, PALADIN_HOLY);
    await expectSummary(page, { points: 22 });

    await copyButton(page).click();
    await expect(copyButton(page)).toHaveText("Copied!");
    const link = await page.evaluate(() => navigator.clipboard.readText());
    const hash = new URL(link).hash;

    await load(page, hash);
    await expect(classButton(page, "Paladin")).toHaveAttribute("aria-pressed", "true");
    await expectSummary(page, { points: 22, build: "22 / 0 / 0" });
    await expectRank(page, "Holy", "Holy Shock", 1, 1);
    await expectRank(page, "Holy", "Divine Precision", 1, 3);
    expect(await currentHash(page)).toBe(hash);
  });

  for (const [link, points] of [
    [LINKS.L51, 51],
    ["#/priest/0-0-550000011", 12],
  ] as const) {
    test(`TC-49 shared link round trip restores ${link}`, async ({ page }) => {
      await load(page, link);
      await expectSummary(page, { points });
      const canonical = await currentHash(page);
      await load(page, canonical);
      await expectSummary(page, { points });
      expect(await currentHash(page)).toBe(canonical);
    });
  }

  test("TC-50 tampered link: illegal points are dropped", async ({ page }) => {
    await load(page, "#/mage/0000020");
    await expectSummary(page, { points: 0 });
    await expectHash(page, "#/mage/", "#/mage");

    await load(page, "#/mage/9");
    await expectRank(page, "Arcane", "Wand Specialization", 2, 2);
    await expectSummary(page, { points: 2 });
    await expectHash(page, "#/mage/2");

    await load(page, "#/mage/0500320-0-31");
    await expectRank(page, "Arcane", "Arcane Focus", 5, 5);
    await expectRank(page, "Arcane", "Arcane Subtlety", 2, 2);
    await expectRank(page, "Arcane", "Magic Absorption", 2, 2);
    await expectRank(page, "Frost", "Frost Warding", 2, 2);
    await expectRank(page, "Frost", "Improved Frostbolt", 1, 5);
    await expectSummary(page, { points: 12, build: "9 / 0 / 3" });
    await expectHash(page, "#/mage/050022-0-21", "#/mage/050022--21");

    await load(page, "#/mage/0000000000000010");
    await expectSummary(page, { points: 0 });
  });

  test("TC-51 unknown class id falls back to the first class", async ({ page }) => {
    const expectDruid = async () => {
      await expect(classButton(page, "Druid")).toHaveAttribute("aria-pressed", "true");
      await expect(page.locator(".summary .class-name")).toHaveText("Druid");
    };

    await load(page, "#/deathknight/55");
    await expectDruid();
    await expect(page).toHaveURL(/#\/druid/);
    note("#/deathknight/55", `Balance points applied: ${await tree(page, "Balance").locator(".tree-points").textContent()}`);

    await load(page, "");
    await expectDruid();
    await expectHash(page, "#/druid/", "#/druid");

    await load(page, "#/MAGE");
    await expectDruid();
    note("#/MAGE", `hash after load: ${await currentHash(page)}`);
  });

  test("TC-52 editing the URL hash in place updates the view", async ({ page }) => {
    await load(page, "#/mage/05");
    await page.evaluate(() => ((window as unknown as { __marker: number }).__marker = 1));
    const setHash = (hash: string) => page.evaluate((h) => (location.hash = h), hash);

    await setHash("#/mage/0500003");
    await expectRank(page, "Arcane", "Arcane Concentration", 3, 5);
    await expectSummary(page, { points: 8 });

    await setHash("#/priest/0-0-550000011");
    await expect(classButton(page, "Priest")).toHaveAttribute("aria-pressed", "true");
    await expectSummary(page, { build: "0 / 0 / 12" });
    await expect(page.locator("section.tree h2")).toHaveText(["Discipline", "Holy", "Shadow"]);

    await setHash("#/warrior");
    await expect(classButton(page, "Warrior")).toHaveAttribute("aria-pressed", "true");
    await expectSummary(page, { points: 0 });

    await page.goBack();
    const hash = await currentHash(page);
    const selected = await page
      .getByRole("navigation", { name: "Choose a class" })
      .getByRole("button", { pressed: true })
      .textContent();
    note("after Back", `hash ${hash}, selected ${selected?.trim()}`);

    expect(await page.evaluate(() => (window as unknown as { __marker?: number }).__marker)).toBe(1);
  });
});
