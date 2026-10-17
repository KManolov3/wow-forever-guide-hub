import {
  LINKS,
  clickTalent,
  currentHash,
  expect,
  expectHash,
  expectRank,
  expectSummary,
  load,
  rightClick,
  shiftClick,
  spend,
  talent,
  tooltip,
  test,
} from "./fixtures";

test.describe("E. Allocation rules", () => {
  test("TC-18 left-click adds one rank", async ({ page }) => {
    await load(page, "#/mage");
    await clickTalent(page, "Arcane", "Arcane Focus");
    await expectRank(page, "Arcane", "Arcane Focus", 1, 5);
    await expectSummary(page, { points: 1, build: "1 / 0 / 0", level: "10" });
    await expectHash(page, "#/mage/01");
  });

  test("TC-19 talent cannot exceed its max rank", async ({ page }) => {
    await load(page, "#/mage");
    await clickTalent(page, "Arcane", "Wand Specialization", 3);
    await expectRank(page, "Arcane", "Wand Specialization", 2, 2);
    const wand = talent(page, "Arcane", "Wand Specialization");
    await expect(wand.locator(".rank")).toHaveText("2/2");
    await expect(wand).toHaveClass(/\bmaxed\b/);
    await expectSummary(page, { points: 2 });
    await expectHash(page, "#/mage/2");
  });

  test("TC-20 tier 2 stays locked at 4 points and unlocks at the 5th", async ({ page }) => {
    await load(page, "#/mage");
    const subtlety = talent(page, "Arcane", "Arcane Subtlety");

    await clickTalent(page, "Arcane", "Arcane Focus", 4);
    await clickTalent(page, "Arcane", "Arcane Subtlety");
    await expectRank(page, "Arcane", "Arcane Subtlety", 0, 2);
    await expectSummary(page, { points: 4 });
    await expect(subtlety).toHaveClass(/\blocked\b/);
    await expectHash(page, "#/mage/04");

    await clickTalent(page, "Arcane", "Arcane Focus");
    await expect(subtlety).toHaveClass(/\bavailable\b/);

    await clickTalent(page, "Arcane", "Arcane Subtlety");
    await expectRank(page, "Arcane", "Arcane Subtlety", 1, 2);
    await expectSummary(page, { points: 6 });
    await expectHash(page, "#/mage/05001");
  });

  test("TC-21 tier gating counts points across several talents, and tier 3 needs exactly 10", async ({ page }) => {
    await load(page, "#/mage");
    await spend(page, [
      ["Arcane", "Wand Specialization", 2],
      ["Arcane", "Missile Barrage", 2],
      ["Arcane", "Improved Channeling", 1],
      ["Arcane", "Arcane Subtlety", 2],
      ["Arcane", "Magic Absorption", 2],
    ]);
    await expectRank(page, "Arcane", "Arcane Subtlety", 2, 2);
    await expectRank(page, "Arcane", "Magic Absorption", 2, 2);

    await clickTalent(page, "Arcane", "Arcane Geometry");
    await expectRank(page, "Arcane", "Arcane Geometry", 0, 2);

    await clickTalent(page, "Arcane", "Arcane Resilience");
    await clickTalent(page, "Arcane", "Arcane Geometry");
    await expectRank(page, "Arcane", "Arcane Geometry", 1, 2);
    await expectSummary(page, { points: 11 });
  });

  test("TC-22 tier unlock counts only points in the same tree", async ({ page }) => {
    await load(page, "#/mage");
    await clickTalent(page, "Fire", "Improved Fireball", 5);

    await clickTalent(page, "Arcane", "Arcane Subtlety");
    await expectRank(page, "Arcane", "Arcane Subtlety", 0, 2);

    await clickTalent(page, "Fire", "Ignite");
    await expectRank(page, "Fire", "Ignite", 1, 5);
    await expectSummary(page, { build: "0 / 6 / 0" });
  });

  test("TC-23 tier 7 needs exactly 30 points below it (31-point talent)", async ({ page }) => {
    await load(page, LINKS.AP29);
    await expectSummary(page, { points: 29 });
    await expectRank(page, "Arcane", "Presence of Mind", 1, 1);

    await clickTalent(page, "Arcane", "Arcane Power");
    await expectRank(page, "Arcane", "Arcane Power", 0, 1);
    await expectSummary(page, { points: 29 });
    await talent(page, "Arcane", "Arcane Power").hover();
    await expect(tooltip(page).locator(".tooltip-req")).toHaveText(["Requires 30 points in Arcane"]);
    await expect(tooltip(page).locator(".tooltip-req")).toHaveCSS("color", "rgb(255, 77, 77)");

    await clickTalent(page, "Arcane", "Arcane Impact");
    await clickTalent(page, "Arcane", "Arcane Power");
    await expectRank(page, "Arcane", "Arcane Power", 1, 1);
    await expectSummary(page, { points: 31, build: "31 / 0 / 0", level: "40" });
    await expectHash(page, "#/mage/2552225222000001001");
  });

  test("TC-24 prerequisite must be maxed (single-rank prerequisite)", async ({ page }) => {
    await load(page, "#/mage");
    await spend(page, [
      ["Arcane", "Arcane Focus", 5],
      ["Arcane", "Improved Channeling", 5],
      ["Arcane", "Arcane Concentration", 5],
    ]);

    await clickTalent(page, "Arcane", "Arcane Wrath");
    await expectRank(page, "Arcane", "Arcane Wrath", 0, 1);
    await expectSummary(page, { points: 15 });

    await clickTalent(page, "Arcane", "Arcane Blast");
    await expectRank(page, "Arcane", "Arcane Blast", 1, 1);

    await clickTalent(page, "Arcane", "Arcane Wrath");
    await expectRank(page, "Arcane", "Arcane Wrath", 1, 1);
    await expectSummary(page, { points: 17 });
  });

  test("TC-25 multi-rank prerequisite must be at max rank, not just invested", async ({ page }) => {
    await load(page, "#/mage");
    await spend(page, [
      ["Arcane", "Arcane Focus", 5],
      ["Arcane", "Improved Channeling", 5],
      ["Arcane", "Wand Specialization", 2],
      ["Arcane", "Arcane Concentration", 4],
    ]);

    await clickTalent(page, "Arcane", "Arcane Meditation");
    await expectRank(page, "Arcane", "Arcane Meditation", 0, 3);

    await clickTalent(page, "Arcane", "Arcane Concentration");
    await clickTalent(page, "Arcane", "Arcane Meditation");
    await expectRank(page, "Arcane", "Arcane Meditation", 1, 3);
    await expectSummary(page, { points: 18 });
  });

  test("TC-26 same-tier prerequisite: Priest Improved Mind Flay requires Mind Flay", async ({ page }) => {
    await load(page, "#/priest");
    await spend(page, [
      ["Shadow", "Shadow Focus", 5],
      ["Shadow", "Blackout", 5],
    ]);

    await clickTalent(page, "Shadow", "Improved Mind Flay");
    await expectRank(page, "Shadow", "Improved Mind Flay", 0, 2);

    await clickTalent(page, "Shadow", "Mind Flay");
    await clickTalent(page, "Shadow", "Improved Mind Flay", 2);
    await expectRank(page, "Shadow", "Mind Flay", 1, 1);
    await expectRank(page, "Shadow", "Improved Mind Flay", 2, 2);
    await expectSummary(page, { build: "0 / 0 / 13" });
    // Shadow in link order: SF 5, Blackout 5, four empty, Improved Psychic Scream 0, Mind Flay 1, Improved Mind Flay 2.
    await expectHash(page, "#/priest/0-0-550000012", "#/priest/--550000012");
  });

  test("TC-27 same-tier prerequisite: Paladin Divine Precision requires Holy Shock", async ({ page }) => {
    await load(page, "#/paladin");
    await spend(page, [
      ["Holy", "Divine Strength", 5],
      ["Holy", "Divine Intellect", 5],
      ["Holy", "Healing Light", 3],
      ["Holy", "Spiritual Focus", 2],
      ["Holy", "Reverence", 3],
      ["Holy", "Purifying Power", 2],
    ]);

    await clickTalent(page, "Holy", "Divine Precision");
    await expectRank(page, "Holy", "Divine Precision", 0, 3);

    await clickTalent(page, "Holy", "Holy Shock");
    await clickTalent(page, "Holy", "Divine Precision");
    await expectRank(page, "Holy", "Holy Shock", 1, 1);
    await expectRank(page, "Holy", "Divine Precision", 1, 3);
    await expectSummary(page, { points: 22 });
    await expectHash(page, LINKS.PAL);
  });

  test("TC-28 build stops at 51 points", async ({ page }) => {
    await load(page, LINKS.L50);
    await expectSummary(page, { points: 50, build: "31 / 19 / 0", level: "59" });

    await clickTalent(page, "Fire", "Impact");
    await expectRank(page, "Fire", "Impact", 3, 3);
    await expectSummary(page, { points: 51, build: "31 / 20 / 0", level: "60" });
    await expectHash(page, LINKS.L51);

    await clickTalent(page, "Frost", "Frost Warding");
    await clickTalent(page, "Arcane", "Arcane Shielding");
    await expectRank(page, "Frost", "Frost Warding", 0, 2);
    await expectRank(page, "Arcane", "Arcane Shielding", 0, 2);
    await expectSummary(page, { points: 51 });
    await expectHash(page, LINKS.L51);
    await expect(page.locator("section.tree .talent.available")).toHaveCount(0);
  });

  test("TC-29 ignored click changes nothing (no state, no URL change)", async ({ page }) => {
    await load(page, "#/mage/04");
    const before = await page.evaluate(() => ({ hash: location.hash, history: history.length }));

    await clickTalent(page, "Arcane", "Arcane Subtlety", 3);
    await expectRank(page, "Arcane", "Arcane Subtlety", 0, 2);
    await expectSummary(page, { points: 4, build: "4 / 0 / 0" });
    expect(await page.evaluate(() => ({ hash: location.hash, history: history.length }))).toEqual(before);
    expect(before.hash).toBe("#/mage/04");
  });
});

test.describe("F. Removing points", () => {
  test("TC-30 right-click removes a rank without opening the browser menu", async ({ page }) => {
    await load(page, "#/mage/03");
    await page.evaluate(() => {
      const w = window as unknown as { __menuPrevented: boolean[] };
      w.__menuPrevented = [];
      window.addEventListener("contextmenu", (e) => w.__menuPrevented.push(e.defaultPrevented));
    });

    await rightClick(page, "Arcane", "Arcane Focus");
    await expectRank(page, "Arcane", "Arcane Focus", 2, 5);
    await expectHash(page, "#/mage/02");
    expect(await page.evaluate(() => (window as unknown as { __menuPrevented: boolean[] }).__menuPrevented)).toEqual([true]);

    const prevented = await talent(page, "Arcane", "Arcane Focus").evaluate((button) => {
      const e = new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 });
      button.dispatchEvent(e);
      return e.defaultPrevented;
    });
    expect(prevented).toBe(true);
    await expectRank(page, "Arcane", "Arcane Focus", 1, 5);
  });

  test("TC-31 Shift+click removes a rank", async ({ page }) => {
    await load(page, "#/mage/03");
    await shiftClick(page, "Arcane", "Arcane Focus", 2);
    await expectRank(page, "Arcane", "Arcane Focus", 1, 5);
    await expectSummary(page, { points: 1 });
    await expectHash(page, "#/mage/01");
  });

  test("TC-32 removing at rank 0 does nothing", async ({ page }) => {
    await load(page, "#/mage");
    await rightClick(page, "Arcane", "Arcane Focus");
    await shiftClick(page, "Arcane", "Arcane Focus");
    await expectRank(page, "Arcane", "Arcane Focus", 0, 5);
    await expectSummary(page, { points: 0 });
  });

  test("TC-33 removal blocked when it would strand a higher tier", async ({ page }) => {
    await load(page, "#/mage/05001");

    await rightClick(page, "Arcane", "Arcane Focus");
    await shiftClick(page, "Arcane", "Arcane Focus");
    await expectRank(page, "Arcane", "Arcane Focus", 5, 5);
    await expectSummary(page, { points: 6 });

    await rightClick(page, "Arcane", "Arcane Subtlety");
    await expectRank(page, "Arcane", "Arcane Subtlety", 0, 2);
    await rightClick(page, "Arcane", "Arcane Focus");
    await expectRank(page, "Arcane", "Arcane Focus", 4, 5);
    await expectSummary(page, { points: 4 });
    await expectHash(page, "#/mage/04");
  });

  test("TC-34 removal blocked when it would strand a deep tier (tier 7)", async ({ page }) => {
    await load(page, LINKS.AP30);
    await clickTalent(page, "Arcane", "Arcane Power");
    await expectSummary(page, { points: 31 });

    await rightClick(page, "Arcane", "Arcane Impact");
    await rightClick(page, "Arcane", "Presence of Mind");
    await expectRank(page, "Arcane", "Arcane Impact", 2, 3);
    await expectRank(page, "Arcane", "Presence of Mind", 1, 1);
    await expectSummary(page, { points: 31 });

    await rightClick(page, "Arcane", "Arcane Power");
    await rightClick(page, "Arcane", "Arcane Impact");
    await expectRank(page, "Arcane", "Arcane Power", 0, 1);
    await expectRank(page, "Arcane", "Arcane Impact", 1, 3);
    await expectSummary(page, { points: 29 });
  });

  test("TC-35 removal blocked when it would break a prerequisite (tier still satisfied)", async ({ page }) => {
    await load(page, "#/mage");
    await spend(page, [
      ["Arcane", "Arcane Focus", 5],
      ["Arcane", "Improved Channeling", 5],
      ["Arcane", "Wand Specialization", 2],
      ["Arcane", "Arcane Concentration", 5],
      ["Arcane", "Arcane Meditation", 1],
    ]);
    await expectSummary(page, { points: 18 });

    await rightClick(page, "Arcane", "Arcane Concentration");
    await expectRank(page, "Arcane", "Arcane Concentration", 5, 5);

    await rightClick(page, "Arcane", "Wand Specialization");
    await expectRank(page, "Arcane", "Wand Specialization", 1, 2);
    await expectSummary(page, { points: 17 });
  });

  test("TC-36 same-tier prerequisite blocks removal", async ({ page }) => {
    await load(page, "#/priest/0-0-550000011");
    await expectSummary(page, { build: "0 / 0 / 12" });

    await rightClick(page, "Shadow", "Mind Flay");
    await expectRank(page, "Shadow", "Mind Flay", 1, 1);

    await rightClick(page, "Shadow", "Blackout");
    await expectRank(page, "Shadow", "Blackout", 5, 5);

    const hash = await currentHash(page);
    await rightClick(page, "Shadow", "Improved Mind Flay");
    await rightClick(page, "Shadow", "Mind Flay");
    await expectSummary(page, { build: "0 / 0 / 10" });
    expect(await currentHash(page)).not.toBe(hash);
  });
});
