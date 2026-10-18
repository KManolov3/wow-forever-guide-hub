import {
  CLASS_ORDER,
  GOLD,
  GREEN,
  LINKS,
  cell,
  clickTalent,
  expect,
  load,
  selectClass,
  spend,
  talent,
  talentButtons,
  test,
  tree,
} from "./fixtures";

test.describe("C. Trees, grid and content", () => {
  test("TC-09 three trees with name, icon and points for the selected class", async ({ page }) => {
    await load(page, "#/mage");
    const sections = page.locator("section.tree");
    await expect(sections.locator("h2")).toHaveText(["Arcane", "Fire", "Frost"]);

    for (const header of await sections.locator(".tree-header").all()) {
      const icon = header.locator(".icon");
      await expect(icon).toHaveCount(1);
      await expect(icon.locator('img[src*="wow.zamimg.com"], .icon-fallback')).toHaveCount(1);
    }

    await clickTalent(page, "Arcane", "Arcane Focus", 2);
    await clickTalent(page, "Frost", "Frost Warding");
    await expect(sections.locator(".tree-points")).toHaveText(["2", "0", "1"]);
  });

  test("TC-10 talent counts per tree for all 9 classes", async ({ page }) => {
    const expected: Record<string, [string, number][]> = {
      Druid: [["Balance", 16], ["Feral Combat", 20], ["Restoration", 16]],
      Hunter: [["Beast Mastery", 16], ["Marksmanship", 16], ["Survival", 18]],
      Mage: [["Arcane", 19], ["Fire", 17], ["Frost", 19]],
      Paladin: [["Holy", 17], ["Protection", 16], ["Retribution", 17]],
      Priest: [["Discipline", 18], ["Holy", 17], ["Shadow", 17]],
      Rogue: [["Assassination", 17], ["Combat", 17], ["Subtlety", 19]],
      Shaman: [["Elemental", 16], ["Enhancement", 18], ["Restoration", 16]],
      Warlock: [["Affliction", 17], ["Demonology", 19], ["Destruction", 16]],
      Warrior: [["Arms", 17], ["Fury", 17], ["Protection", 18]],
    };

    await load(page, "#/druid");
    const sections = page.locator("section.tree");
    for (const cls of CLASS_ORDER) {
      await selectClass(page, cls);
      await expect(sections).toHaveCount(3);
      await expect(sections.locator("h2")).toHaveText(expected[cls].map(([name]) => name));
      for (const [i, [name, count]] of expected[cls].entries()) {
        await expect(talentButtons(sections.nth(i)), `${cls} ${name}`).toHaveCount(count);
      }
    }
  });

  test("TC-11 talents placed on a 4-column, 7-tier grid at their positions", async ({ page }) => {
    await load(page, "#/mage");
    // Web fonts swap in after load and shift the trees down, so every rect is read in one
    // evaluate: positions taken at different moments would not line up with each other.
    const boxes = await talentButtons(tree(page, "Arcane")).evaluateAll((els) =>
      els.map((e) => ({ name: e.getAttribute("aria-label")!.replace(/, rank \d+ of \d+$/, ""), ...e.getBoundingClientRect().toJSON() })),
    );
    expect(boxes).toHaveLength(19);
    const box = (name: string) => boxes.find((b) => b.name === name)!;

    const columns = ["Wand Specialization", "Arcane Focus", "Improved Channeling", "Missile Barrage"].map(box);
    const tiers = ["Wand Specialization", "Arcane Subtlety", "Arcane Blast", "Arcane Shielding", "Presence of Mind", "Arcane Instability", "Arcane Power"].map(
      box,
    );
    const xs = columns.map((b) => b.x);
    const ys = tiers.map((b) => b.y);

    expect(Math.abs(box("Arcane Blast").x - xs[3])).toBeLessThanOrEqual(2);
    expect(Math.abs(box("Arcane Power").x - box("Presence of Mind").x)).toBeLessThanOrEqual(2);
    expect(Math.abs(box("Arcane Subtlety").x - xs[0])).toBeLessThanOrEqual(2);
    for (let i = 1; i < ys.length; i++) expect(ys[i]).toBeGreaterThan(ys[i - 1]);

    // Every talent sits exactly at its tier/column; empty slots stay empty.
    const expected = [
      "1,1", "1,2", "1,3", "1,4", "2,1", "2,2", "2,3", "2,4", "3,1", "3,2", "3,4",
      "4,1", "4,2", "4,3", "4,4", "5,2", "5,3", "6,3", "7,2",
    ];
    const nearest = (values: number[], v: number) => {
      const i = values.findIndex((x) => Math.abs(x - v) <= 2);
      return i === -1 ? "?" : String(i + 1);
    };
    const positions = boxes.map((b) => `${nearest(ys, b.y)},${nearest(xs, b.x)}`);
    expect(positions.sort()).toEqual([...expected].sort());
  });

  test("TC-12 prerequisite connectors drawn and highlighted when the prerequisite is maxed", async ({ page }) => {
    await load(page, "#/mage");
    await expect(tree(page, "Arcane").locator(".arrow")).toHaveCount(3);
    for (const dependent of ["Arcane Meditation", "Arcane Wrath", "Arcane Power"]) {
      await expect(cell(page, "Arcane", dependent).locator(".arrow"), dependent).toHaveCount(1);
    }

    const powerArrow = cell(page, "Arcane", "Arcane Power").locator(".arrow");
    await load(page, LINKS.AP30);
    await expect(powerArrow).toHaveClass(/\bactive\b/);

    await load(page, "#/mage");
    await expect(powerArrow).not.toHaveClass(/\bactive\b/);
  });

  test("TC-13 connector highlights on a maxed prerequisite even while the tier is still locked", async ({ page }) => {
    await load(page, "#/mage");
    await spend(page, [
      ["Frost", "Frost Warding", 2],
      ["Frost", "Improved Frostbolt", 5],
      ["Frost", "Ice Shards", 3],
      ["Frost", "Ice Lance", 1],
    ]);
    await expect(talent(page, "Frost", "Ice Lance")).toHaveAccessibleName("Ice Lance, rank 1 of 1");
    await expect(cell(page, "Frost", "Fingers of Frost").locator(".arrow")).toHaveClass(/\bactive\b/);
    await expect(talent(page, "Frost", "Fingers of Frost")).toHaveClass(/\blocked\b/);
  });

  test("TC-14 same-tier prerequisite connector", async ({ page }) => {
    await load(page, "#/priest");
    const arrow = cell(page, "Shadow", "Improved Mind Flay").locator(".arrow");
    await expect(arrow).toHaveClass(/\bside\b/);
    await expect(arrow).not.toHaveClass(/\bactive\b/);

    await spend(page, [
      ["Shadow", "Shadow Focus", 5],
      ["Shadow", "Blackout", 5],
      ["Shadow", "Mind Flay", 1],
    ]);
    await expect(arrow).toHaveClass(/\bactive\b/);
  });
});

test.describe("D. Talent display and visual states", () => {
  test("TC-15 icon, rank badge and NEW badge", async ({ page }) => {
    await load(page, "#/mage");
    const focus = talent(page, "Arcane", "Arcane Focus");
    const channeling = talent(page, "Arcane", "Improved Channeling");

    for (const button of [focus, channeling]) await expect(button.locator(".icon")).toHaveCount(1);
    await expect(focus.locator(".rank")).toHaveText("0/5");
    await expect(channeling.locator(".rank")).toHaveText("0/5");
    await expect(channeling.locator(".new-badge")).toHaveText("NEW");
    await expect(focus.locator(".new-badge")).toHaveCount(0);

    await clickTalent(page, "Arcane", "Arcane Focus", 2);
    await expect(focus.locator(".rank")).toHaveText("2/5");

    for (const name of ["Missile Barrage", "Arcane Geometry", "Arcane Impact", "Arcane Blast", "Arcane Shielding", "Arcane Wrath"]) {
      await expect(talent(page, "Arcane", name).locator(".new-badge"), name).toHaveText("NEW");
    }
    for (const name of ["Wand Specialization", "Arcane Subtlety", "Arcane Power"]) {
      await expect(talent(page, "Arcane", name).locator(".new-badge"), name).toHaveCount(0);
    }
  });

  test("TC-16 icon fallback shows initials", async ({ page }) => {
    await load(page, "#/mage");
    const focus = talent(page, "Arcane", "Arcane Focus");
    await focus.evaluate((button) => {
      const img = button.querySelector("img");
      if (img) img.src = "https://wow.zamimg.com/images/wow/icons/large/does_not_exist_xyz.jpg";
    });

    await expect(focus.locator(".icon-fallback")).toHaveText("AF");
    await expect(focus.locator("img")).toHaveCount(0);
    await expect(focus.locator(".rank")).toHaveText("0/5");
    await focus.click();
    await expect(focus).toHaveAccessibleName("Arcane Focus, rank 1 of 5");
    await expect(focus.locator(".rank")).toHaveText("1/5");
  });

  test("TC-17 visual states: locked, available, partial, maxed", async ({ page }) => {
    await load(page, "#/mage");
    const focus = talent(page, "Arcane", "Arcane Focus");
    const subtlety = talent(page, "Arcane", "Arcane Subtlety");

    await expect(subtlety.locator(".icon")).toHaveCSS("filter", /grayscale/);
    const lockedBorder = await subtlety.evaluate((e) => getComputedStyle(e).borderColor);
    expect([GREEN, GOLD]).not.toContain(lockedBorder);

    await expect(focus).toHaveCSS("border-color", GREEN);
    await expect(focus).toHaveCSS("box-shadow", "none");

    await clickTalent(page, "Arcane", "Arcane Focus", 2);
    await expect(focus).toHaveCSS("border-color", GREEN);
    await expect(focus).toHaveCSS("box-shadow", /rgba\(30, 255, 0, [\d.]+\)/);

    await clickTalent(page, "Arcane", "Arcane Focus", 3);
    await expect(focus).toHaveCSS("border-color", GOLD);
    await expect(focus).toHaveCSS("box-shadow", /rgba\(248, 183, 0, [\d.]+\)/);
    await expect(focus.locator(".rank")).toHaveCSS("color", GOLD);

    await expect(subtlety).toHaveClass(/\bavailable\b/);
    await expect(subtlety).toHaveCSS("border-color", GREEN);
  });
});
