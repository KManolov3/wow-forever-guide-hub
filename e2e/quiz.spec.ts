import type { Page } from "@playwright/test";
import { classButton, expect, expectSummary, load, selectClass, talentButtons, test, tree } from "./fixtures";

const dialog = (page: Page) => page.getByRole("dialog", { name: "Find your class" });
const openQuiz = (page: Page) => page.getByRole("button", { name: "Find my class" }).click();
/** Answer button whose label starts with `prefix`. */
const option = (page: Page, prefix: string) =>
  dialog(page).getByRole("button", { name: new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`) });
const progress = (page: Page) => dialog(page).locator(".quiz-progress span");
const results = (page: Page) => dialog(page).locator(".quiz-result");

const TANK = [
  "Marking skull",
  '"Raised among Arathi steel',
  "Molten Core",
  "Pets path into the next pack",
  "All of them",
  "Them rooted, feared",
  "Me. Encased in metal",
  "Wherever the queue is shorter",
];

async function answerAll(page: Page, labels: string[]) {
  for (const [i, label] of labels.entries()) {
    await expect(progress(page)).toHaveText(`Question ${i + 1} of ${labels.length}`);
    await option(page, label).click();
  }
}

test.describe("L. Class quiz", () => {
  test("TC-59 quiz opens from the header and closes without changing the build", async ({ page }) => {
    await load(page, "#/mage/05");
    await openQuiz(page);
    await expect(dialog(page)).toBeVisible();
    await expect(progress(page)).toHaveText("Question 1 of 8");
    await expect(dialog(page).getByRole("group", { name: /^The dungeon group finally has five people/ })).toBeVisible();

    await page.keyboard.press("Escape");
    await expect(dialog(page)).toBeHidden();

    await openQuiz(page);
    await dialog(page).getByRole("button", { name: "Close quiz" }).click();
    await expect(dialog(page)).toBeHidden();
    await expectSummary(page, { points: 5 });
    await expect(page).toHaveURL(/#\/mage\/05$/);
  });

  test("TC-60 one question at a time with progress and Back", async ({ page }) => {
    await load(page, "#/mage");
    await openQuiz(page);
    await expect(dialog(page).getByRole("button", { name: "Back", exact: true })).toBeHidden();
    await option(page, "Staring at green bars").click();
    await expect(progress(page)).toHaveText("Question 2 of 8");

    await dialog(page).getByRole("button", { name: "Back", exact: true }).click();
    await expect(progress(page)).toHaveText("Question 1 of 8");
    await expect(option(page, "Staring at green bars")).toHaveAttribute("aria-pressed", "true");
    await expect(option(page, "Glued to the boss")).toHaveAttribute("aria-pressed", "false");
  });

  test("TC-61 results show best match, reasons and two runners-up; retake starts over", async ({ page }) => {
    await load(page, "#/mage");
    await openQuiz(page);
    await answerAll(page, TANK);

    await expect(results(page)).toHaveCount(3);
    const best = results(page).first();
    await expect(best).toHaveAccessibleName(/^Warrior, Protection, \d+% match$/);
    await expect(best.locator(".quiz-reasons li").first()).toHaveText("You were born to mark skull and pull early");
    await expect(best.locator(".quiz-tagline")).toHaveText(/^Rage is a resource/);
    await expect(dialog(page).getByRole("button", { name: /^Open \w+ talents$/ })).toHaveCount(3);

    await page.keyboard.press("Escape");
    await openQuiz(page);
    await expect(results(page)).toHaveCount(3);

    await dialog(page).getByRole("button", { name: "Retake quiz" }).click();
    await expect(progress(page)).toHaveText("Question 1 of 8");
  });

  test("TC-62 opening a result loads the class with the suggested tree marked", async ({ page }) => {
    await load(page, "#/mage/05");
    await openQuiz(page);
    await answerAll(page, TANK);
    await dialog(page).getByRole("button", { name: "Open Warrior talents" }).click();

    await expect(dialog(page)).toBeHidden();
    await expect(classButton(page, "Warrior")).toHaveAttribute("aria-pressed", "true");
    await expectSummary(page, { points: 0 });
    await expect(page).toHaveURL(/#\/warrior\/?$/);
    await expect(page.locator(".suggested-badge")).toHaveCount(1);
    await expect(tree(page, "Protection").locator(".suggested-badge")).toHaveText("Suggested");
    await expect(talentButtons(tree(page, "Protection")).first()).toBeVisible();

    await selectClass(page, "Mage");
    await expect(page.locator(".suggested-badge")).toHaveCount(0);
  });

  test("TC-63 faction answer filters faction-locked classes", async ({ page }) => {
    const healer = (faction: string) => [
      "Staring at green bars",
      '"Blessed by the Light',
      "Molten Core",
      "I whisper the seller",
      "One.",
      "Nobody. I got distracted",
      "Me. Encased in metal",
      faction,
    ];

    await load(page, "#/mage");
    await openQuiz(page);
    await answerAll(page, healer("Orgrimmar"));
    await expect(results(page).first()).toHaveAccessibleName(/^Priest, Holy/);
    await expect(results(page).filter({ hasText: "Paladin" })).toHaveCount(0);

    await dialog(page).getByRole("button", { name: "Retake quiz" }).click();
    await answerAll(page, healer("Goldshire"));
    await expect(results(page).first()).toHaveAccessibleName(/^Paladin, Holy/);
    await expect(results(page).filter({ hasText: "Shaman" })).toHaveCount(0);
  });

  test("TC-64 quiz fits a 375 px phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 });
    await load(page, "#/mage");
    await openQuiz(page);
    const noHScroll = () => page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth);
    expect(await noHScroll()).toBe(true);
    await answerAll(page, TANK);
    await expect(results(page)).toHaveCount(3);
    expect(await noHScroll()).toBe(true);
    const box = await dialog(page).boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(375);
  });
});
