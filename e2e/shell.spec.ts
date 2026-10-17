import {
  CLASS_ORDER,
  clickTalent,
  expect,
  expectHash,
  expectRank,
  expectSummary,
  hexToRgb,
  load,
  rgb,
  selectClass,
  test,
} from "./fixtures";

test.describe("A. Header, footer and page shell", () => {
  test("TC-01 page loads with title and launch countdown", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-10-17T12:00:00Z"));
    await load(page, "#/mage");

    const days = Math.ceil((Date.parse("2026-11-04T23:00:00Z") - Date.parse("2026-10-17T12:00:00Z")) / 864e5);
    await expect(page.locator("h1")).toHaveText("World of Warcraft: Forever");
    const subtitle = page.locator(".masthead .subtitle");
    await expect(subtitle).toContainText("Talent Calculator");
    await expect(subtitle).toContainText(`launches in ${days} days`);
  });

  test("TC-02 countdown switches to 'now live' after launch", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-04T23:01:00Z"));
    await load(page, "#/mage");
    const subtitle = page.locator(".masthead .subtitle");
    await expect(subtitle).toContainText("now live");
    await expect(subtitle).not.toContainText("launches in");
  });

  test("TC-02 countdown shows a singular day just before launch", async ({ page }) => {
    await page.clock.setFixedTime(new Date("2026-11-04T22:59:00Z"));
    await load(page, "#/mage");
    await expect(page.locator(".masthead .subtitle")).toContainText("launches in 1 day");
    await expect(page.locator(".masthead .subtitle")).not.toContainText("launches in 1 days");
  });

  test("TC-03 footer content and data-source link per class", async ({ page }) => {
    await load(page, "#/mage");
    const footer = page.locator("footer.footer");
    await expect(footer).toContainText("Click to learn");
    await expect(footer).toContainText("Right-click or Shift+click to unlearn");
    await expect(footer).toContainText("beta data, may change before launch");
    await expect(footer).toContainText("Not affiliated with Blizzard Entertainment");

    const link = footer.getByRole("link");
    await expect(link).toHaveAttribute("href", "https://warcraft.wiki.gg/wiki/Mage_abilities_(Forever)");
    await expect(link).toHaveText("warcraft.wiki.gg");
    await expect(link).toHaveAttribute("target", "_blank");

    await selectClass(page, "Paladin");
    await expect(link).toHaveAttribute("href", "https://www.zockify.com/forever/paladin/talents/");
  });

  test("TC-04 dark theme and typography", async ({ page }) => {
    await load(page, "#/mage");
    const styles = await page.evaluate(() => {
      const css = (el: Element | null) => getComputedStyle(el!);
      const bodyBg = css(document.body).backgroundColor;
      const transparent = bodyBg === "rgba(0, 0, 0, 0)" || bodyBg === "transparent";
      return {
        background: transparent ? css(document.querySelector(".app")).backgroundColor : bodyBg,
        h1Font: css(document.querySelector("h1")).fontFamily,
        h1Color: css(document.querySelector("h1")).color,
        treeFont: css(document.querySelector("section.tree h2")).fontFamily,
        treeColor: css(document.querySelector("section.tree h2")).color,
        classFont: css(document.querySelector(".class-label")).fontFamily,
        footerFont: css(document.querySelector("footer")).fontFamily,
      };
    });

    for (const channel of rgb(styles.background)) expect(channel).toBeLessThanOrEqual(0x20);
    for (const font of [styles.h1Font, styles.treeFont, styles.classFont]) expect(font).toMatch(/^"?Cinzel"?\s*,/);
    expect(styles.footerFont).toMatch(/^"?Inter"?\s*,/);
    expect(styles.h1Color).toBe("rgb(248, 183, 0)");
    expect(styles.treeColor).toBe("rgb(248, 183, 0)");
  });
});

test.describe("B. Class picker", () => {
  const COLOURS: Record<string, string> = {
    Druid: "#FF7C0A",
    Hunter: "#AAD372",
    Mage: "#3FC7EB",
    Paladin: "#F48CBA",
    Priest: "#FFFFFF",
    Rogue: "#FFF468",
    Shaman: "#0070DD",
    Warlock: "#8788EE",
    Warrior: "#C69B6D",
  };

  test("TC-05 all 9 classes listed in a labelled navigation region", async ({ page }) => {
    await load(page, "#/mage");
    await expect(page.getByRole("navigation")).toHaveCount(1);
    const nav = page.getByRole("navigation", { name: "Choose a class" });
    await expect(nav).toBeVisible();

    const buttons = nav.getByRole("button");
    await expect(buttons).toHaveCount(9);
    await expect(nav.locator(".class-label")).toHaveText(CLASS_ORDER);
    for (const button of await buttons.all()) {
      await expect(button.locator(".icon")).toHaveCount(1);
    }
  });

  test("TC-06 class names in official class colours", async ({ page }) => {
    await load(page, "#/mage");
    const nav = page.getByRole("navigation", { name: "Choose a class" });
    for (const name of CLASS_ORDER) {
      const label = nav.getByRole("button", { name, exact: true }).locator(".class-label");
      await expect(label, name).toHaveCSS("color", hexToRgb(COLOURS[name]));
    }
  });

  test("TC-07 selected class is highlighted and uses aria-pressed", async ({ page }) => {
    await load(page, "#/mage");
    const nav = page.getByRole("navigation", { name: "Choose a class" });
    const pressed = () => nav.getByRole("button").evaluateAll((els) => els.map((e) => e.getAttribute("aria-pressed")));

    expect(await pressed()).toEqual(CLASS_ORDER.map((c) => String(c === "Mage")));

    await selectClass(page, "Priest");
    expect(await pressed()).toEqual(CLASS_ORDER.map((c) => String(c === "Priest")));

    const priest = nav.getByRole("button", { name: "Priest", exact: true });
    const mage = nav.getByRole("button", { name: "Mage", exact: true });
    await expect(priest).toHaveClass(/\bselected\b/);
    await expect(mage).not.toHaveClass(/\bselected\b/);

    const look = (el: Element) => {
      const s = getComputedStyle(el);
      return [s.backgroundColor, s.borderColor, s.boxShadow, s.opacity, s.outlineStyle].join("|");
    };
    expect(await priest.evaluate(look)).not.toBe(await mage.evaluate(look));

    const accent = await page.locator(".app").evaluate((el) => getComputedStyle(el).getPropertyValue("--class-color").trim());
    expect(accent.toUpperCase()).toBe(COLOURS.Priest);
  });

  test("TC-08 switching class clears the build", async ({ page }) => {
    await load(page, "#/mage");
    await clickTalent(page, "Arcane", "Arcane Focus", 3);
    await expectSummary(page, { points: 3 });

    await selectClass(page, "Priest");
    await expectSummary(page, { points: 0, build: "0 / 0 / 0" });
    await expectHash(page, "#/priest/", "#/priest");

    await selectClass(page, "Mage");
    await expectRank(page, "Arcane", "Arcane Focus", 0, 5);
    await expectSummary(page, { points: 0 });
  });
});
