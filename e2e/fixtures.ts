import { test as base, expect, type Locator, type Page } from "@playwright/test";

/** Failed icon downloads are network noise, not application errors. */
const IGNORED_CONSOLE = [/Failed to load resource/];

/**
 * Every test fails if the page logs a console error or warning, or throws an uncaught error.
 * Tests that need the messages themselves can read `consoleProblems`.
 */
export const test = base.extend<{ consoleProblems: string[] }>({
  consoleProblems: [
    async ({ page }, use) => {
      const problems: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() !== "error" && msg.type() !== "warning") return;
        if (IGNORED_CONSOLE.some((re) => re.test(msg.text()))) return;
        problems.push(`${msg.type()}: ${msg.text()}`);
      });
      page.on("pageerror", (err) => problems.push(`pageerror: ${err.message}`));
      await use(problems);
      expect(problems, "console errors or warnings").toEqual([]);
    },
    { auto: true },
  ],
});

export { expect };

export const CLASS_ORDER = ["Druid", "Hunter", "Mage", "Paladin", "Priest", "Rogue", "Shaman", "Warlock", "Warrior"];

/** Prepared build links from the test-case reference data. */
export const LINKS = {
  L51: "#/mage/25522252231-235523",
  L50: "#/mage/25522252231-235522",
  AP29: "#/mage/2552225221000001",
  AP30: "#/mage/2552225222000001",
  PAL: "#/paladin/55320003200011",
};

const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Fresh page load of the app at the given hash. Navigating via about:blank forces a real load,
 * since a hash-only change on the same document would just fire `hashchange`.
 */
export async function load(page: Page, hash = "") {
  await page.goto("about:blank");
  await page.goto(`/${hash}`);
  await expect(page.locator("section.tree")).toHaveCount(3);
}

export const tree = (page: Page, name: string) =>
  page.locator("section.tree").filter({ has: page.getByRole("heading", { level: 2, name, exact: true }) });

const talentName = (name: string) => new RegExp(`^${escapeRegExp(name)}, rank \\d+ of \\d+$`);

export const talent = (page: Page, treeName: string, name: string) =>
  tree(page, treeName).getByRole("button", { name: talentName(name) });

/** The grid cell holding a talent; prerequisite connectors are drawn inside the dependent's cell. */
export const cell = (page: Page, treeName: string, name: string) =>
  tree(page, treeName)
    .locator(".talent-cell")
    .filter({ has: page.getByRole("button", { name: talentName(name) }) });

export const talentButtons = (scope: Page | Locator) => scope.getByRole("button", { name: /, rank \d+ of \d+$/ });

export const tooltip = (page: Page) => page.getByRole("tooltip");

export async function expectRank(page: Page, treeName: string, name: string, rank: number, max: number) {
  await expect(talent(page, treeName, name)).toHaveAccessibleName(`${name}, rank ${rank} of ${max}`);
}

/** Clicks a talent `times` times; pass `{ button: "right" }` or `{ modifiers: ["Shift"] }` to remove. */
export async function clickTalent(
  page: Page,
  treeName: string,
  name: string,
  times = 1,
  options: Parameters<Locator["click"]>[0] = {},
) {
  const button = talent(page, treeName, name);
  for (let i = 0; i < times; i++) await button.click(options);
}

export const rightClick = (page: Page, treeName: string, name: string, times = 1) =>
  clickTalent(page, treeName, name, times, { button: "right" });

export const shiftClick = (page: Page, treeName: string, name: string, times = 1) =>
  clickTalent(page, treeName, name, times, { modifiers: ["Shift"] });

/** Applies a list of `[tree, talent, clicks]` in order. */
export async function spend(page: Page, steps: [string, string, number][]) {
  for (const [treeName, name, times] of steps) await clickTalent(page, treeName, name, times);
}

export const stat = (page: Page, label: string) =>
  page.locator(".summary .stat").filter({ has: page.locator(".label", { hasText: label }) }).locator(".value");

export async function expectSummary(page: Page, { points, build, level }: { points?: number; build?: string; level?: string }) {
  if (points !== undefined) await expect(stat(page, "Points")).toHaveText(`${points} / 51`);
  if (build !== undefined) await expect(stat(page, "Build")).toHaveText(build);
  if (level !== undefined) await expect(stat(page, "Required level")).toHaveText(level);
}

/** Asserts the URL hash is one of the accepted forms (e.g. PRD `-0-` and code `--` for an empty middle tree). */
export async function expectHash(page: Page, ...accepted: string[]) {
  await expect(page).toHaveURL(new RegExp(`(?:${accepted.map(escapeRegExp).join("|")})$`));
}

export const currentHash = (page: Page) => page.evaluate(() => location.hash);

export const classButton = (page: Page, name: string) =>
  page.getByRole("navigation", { name: "Choose a class" }).getByRole("button", { name, exact: true });

export async function selectClass(page: Page, name: string) {
  await classButton(page, name).click();
  await expect(page.locator(".summary .class-name")).toHaveText(name);
}

/** Parses `rgb(r, g, b)` / `rgba(r, g, b, a)` into channel numbers. */
export function rgb(color: string): [number, number, number] {
  const m = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
  if (!m) throw new Error(`Not an rgb colour: ${color}`);
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

export function hexToRgb(hex: string) {
  const n = parseInt(hex.replace("#", ""), 16);
  return `rgb(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255})`;
}

export const GOLD = "rgb(248, 183, 0)";
export const GREEN = "rgb(30, 255, 0)";

/** Records an informational observation in the report without failing the test. */
export function note(type: string, description: string) {
  test.info().annotations.push({ type, description });
}
