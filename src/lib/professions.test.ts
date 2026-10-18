import { describe, expect, it } from "vitest";
import { CLASSES } from "../data/classes";
import { PROFESSION_GUIDES, findProfession } from "../data/professions";
import { PROFESSION_IDS } from "../data/professions/ids";
import { BETA_SKILL_CAP, type ProfessionGuide } from "../data/professions/types";
import {
  MAX_SKILL,
  activeSteps,
  disenchantYield,
  expectedCrafts,
  findRecipe,
  materialsNeeded,
  nextTier,
  recipeColor,
  remainingCrafts,
  stepAt,
} from "./professions";

const tailoring = findProfession("tailoring")!;
const enchanting = findProfession("enchanting")!;

describe("profession helpers", () => {
  it("colours a recipe by skill from its learn skill and thresholds", () => {
    const bolt = findRecipe(tailoring, "bolt-linen")!;
    expect([1, 24, 25, 36, 37, 49, 50].map((s) => recipeColor(bolt, s))).toEqual([
      "orange",
      "orange",
      "yellow",
      "yellow",
      "green",
      "green",
      "grey",
    ]);
    expect(recipeColor(findRecipe(tailoring, "faction-banner")!, 80)).toBeUndefined();
  });

  it("finds the step for a skill and nothing past the top", () => {
    expect(stepAt(tailoring, 1)?.recipe).toBe("bolt-linen");
    expect(stepAt(tailoring, 45)?.recipe).toBe("linen-bag");
    expect(stepAt(tailoring, 299)?.to).toBe(MAX_SKILL);
    expect(stepAt(tailoring, MAX_SKILL)).toBeUndefined();
  });

  it("expects one craft per point while orange and more once yellow", () => {
    const bag = findRecipe(tailoring, "linen-bag")!;
    expect(expectedCrafts(bag, 45, 47)).toBeCloseTo(1 + 20 / 19);
    expect(expectedCrafts(bag, 60, 66)).toBe(Infinity);
    expect(expectedCrafts(findRecipe(tailoring, "faction-banner")!, 20, 21)).toBeUndefined();
  });

  it("scales the crafts left in a step by the skill already gained", () => {
    const step = { from: 100, to: 120, recipe: "bolt-silk", crafts: 40 };
    expect(remainingCrafts(step, 90)).toBe(40);
    expect(remainingCrafts(step, 110)).toBe(20);
    expect(remainingCrafts(step, 119)).toBe(2);
    expect(remainingCrafts(step, 120)).toBe(0);
  });

  it("totals the materials the rest of the route needs", () => {
    const all = materialsNeeded(tailoring);
    // 42 bolts from the bolt step plus 64 more for the 106 the linen steps use, at 2 Linen Cloth each.
    expect(all.find((n) => n.material.id === "linen-cloth")?.count).toBe(212);
    expect(all.some((n) => n.material.id === "bolt-linen")).toBe(false);
    expect(all[0].count).toBeGreaterThanOrEqual(all[all.length - 1].count);
    const late = materialsNeeded(tailoring, 260);
    expect(late.some((n) => n.material.id === "linen-cloth")).toBe(false);
    expect(late.find((n) => n.material.id === "rune-thread")?.count).toBe(17 + 11 + 16);
    expect(materialsNeeded(tailoring, MAX_SKILL)).toEqual([]);
  });

  it("swaps in the Enchanting-paired steps only when asked", () => {
    expect(activeSteps(tailoring, false)).toBe(tailoring.steps);
    const paired = activeSteps(tailoring, true);
    const swapped = paired.filter((s) => s.swapped);
    expect(swapped.map((s) => [s.from, s.recipe])).toEqual([
      [56, "brown-linen-pants"],
      [98, "woolen-cape"],
    ]);
    expect(paired.map((s) => [s.from, s.to])).toEqual(tailoring.steps.map((s) => [s.from, s.to]));
  });

  it("totals what disenchanting the route's greens gives", () => {
    const plain = disenchantYield(tailoring);
    const paired = disenchantYield({ ...tailoring, steps: activeSteps(tailoring, true) });
    const dust = (n: typeof plain) => n.find((m) => m.material.id === "strange-dust")?.count ?? 0;
    expect(dust(paired)).toBeGreaterThan(dust(plain));
    expect(disenchantYield(tailoring, MAX_SKILL)).toEqual([]);
  });

  it("levels Enchanting on Strange Dust rather than Lesser Magic Essence", () => {
    expect(stepAt(enchanting, 1)?.recipe).toBe("runed-copper-rod");
    expect(stepAt(enchanting, 20)?.recipe).toBe("chest-inferior-stamina");
    expect(stepAt(enchanting, 110)?.recipe).toBe("cloak-minor-protection");
    expect(stepAt(enchanting, 140)?.recipe).toBe("boots-minor-stamina");
    const count = (id: string) => materialsNeeded(enchanting).find((n) => n.material.id === id)?.count;
    // 83 Chest – Inferior Stamina, 43 Cloak – Minor Protection at 2, 9 2H Weapon – Minor Impact,
    // 34 Boots – Minor Stamina at 4 and 3 for the Runed Silver Rod.
    expect(count("strange-dust")).toBe(83 + 43 * 2 + 9 + 34 * 4 + 3);
    // Five Lesser Magic Wands and the Runed Silver Rod's four.
    expect(count("lesser-magic-essence")).toBe(9);
  });

  it("names the next trainer rank to learn", () => {
    expect(nextTier(enchanting, 1)?.name).toBe("Journeyman");
    expect(nextTier(enchanting, 60)?.name).toBe("Expert");
    expect(nextTier(enchanting, 200)).toBeUndefined();
  });
});

describe.each(PROFESSION_GUIDES.map((g) => [g.name, g] as [string, ProfessionGuide]))("%s guide data", (_, guide) => {
  it("has unique recipe and material ids", () => {
    const recipes = guide.recipes.map((r) => r.id);
    const materials = guide.materials.map((m) => m.id);
    expect(new Set(recipes).size).toBe(recipes.length);
    expect(new Set(materials).size).toBe(materials.length);
  });

  it("names only known materials", () => {
    for (const r of guide.recipes) {
      for (const m of r.materials) {
        expect(guide.materials.some((x) => x.id === m.material), `${r.id} uses ${m.material}`).toBe(true);
        expect(m.count).toBeGreaterThan(0);
      }
    }
  });

  it("has trainer ranks with rising skill, level and cap up to 300", () => {
    guide.tiers.forEach((t, i) => {
      expect(t.trainers.length).toBeGreaterThan(0);
      expect(t.cap).toBeGreaterThan(t.skill);
      if (i === 0) return expect(t.skill).toBe(0);
      const prev = guide.tiers[i - 1];
      expect(t.skill).toBeGreaterThan(prev.skill);
      expect(t.skill).toBeLessThan(prev.cap);
      expect(t.level).toBeGreaterThan(prev.level);
      expect(t.cap).toBeGreaterThan(prev.cap);
    });
    expect(guide.tiers[guide.tiers.length - 1].cap).toBe(MAX_SKILL);
  });

  it("runs the route from skill 1 to 300 without gaps", () => {
    expect(guide.steps[0].from).toBe(1);
    expect(guide.steps[guide.steps.length - 1].to).toBe(MAX_SKILL);
    guide.steps.forEach((s, i) => {
      expect(s.to).toBeGreaterThan(s.from);
      expect(s.crafts).toBeGreaterThanOrEqual(s.to - s.from);
      if (i > 0) expect(s.from).toBe(guide.steps[i - 1].to);
    });
  });

  it("uses recipes that can be learned and still give points at each step", () => {
    for (const s of guide.steps) {
      const recipe = findRecipe(guide, s.recipe);
      expect(recipe, s.recipe).toBeDefined();
      expect(recipe!.materials.length, `${s.recipe} has materials`).toBeGreaterThan(0);
      if (recipe!.learn !== undefined) expect(s.from).toBeGreaterThanOrEqual(recipe!.learn);
      if (recipe!.colors) expect(s.from, `${s.recipe} is grey at ${s.from}`).toBeLessThan(recipe!.colors[2]);
      const expected = expectedCrafts(recipe!, s.from, s.to);
      if (expected !== undefined) expect(s.crafts, `${s.from}–${s.to} ${s.recipe}`).toBeGreaterThanOrEqual(Math.floor(expected));
    }
  });

  it("never needs a trainer rank before its skill", () => {
    for (const s of guide.steps) {
      const tier = guide.tiers.find((t) => t.cap >= s.to)!;
      expect(s.from, `${s.from}–${s.to} needs ${tier.name}`).toBeGreaterThanOrEqual(tier.skill);
    }
  });

  it("marks every step past the beta's skill cap as not confirmed", () => {
    for (const s of guide.steps) {
      if (s.from >= BETA_SKILL_CAP) expect(s.unconfirmed, `${s.from}–${s.to}`).toBeTruthy();
      if (s.to <= BETA_SKILL_CAP) expect(s.unconfirmed).toBeUndefined();
    }
  });

  it("has Enchanting-paired steps and disenchant yields that follow the same rules", () => {
    for (const s of guide.steps) {
      if (!s.enchanterAlt) continue;
      const alt = findRecipe(guide, s.enchanterAlt.recipe);
      expect(alt, s.enchanterAlt.recipe).toBeDefined();
      expect(alt!.disenchant, `${alt!.id} disenchants`).toBeDefined();
      if (alt!.learn !== undefined) expect(s.from).toBeGreaterThanOrEqual(alt!.learn);
      const expected = expectedCrafts(alt!, s.from, s.to);
      if (expected !== undefined) expect(s.enchanterAlt.crafts).toBeGreaterThanOrEqual(Math.floor(expected));
    }
    for (const r of guide.recipes) {
      for (const d of r.disenchant ?? []) expect(guide.materials.some((m) => m.id === d.material), d.material).toBe(true);
    }
  });

  it("lists class items made from known recipes, with where to get any recipe that is not from the trainer", () => {
    for (const [classId, items] of Object.entries(guide.classItems ?? {})) {
      expect(CLASSES.some((c) => c.id === classId), classId).toBe(true);
      expect(new Set(items.map((i) => i.recipe)).size).toBe(items.length);
      for (const item of items) {
        const recipe = findRecipe(guide, item.recipe);
        expect(recipe, item.recipe).toBeDefined();
        expect(item.level).toBeGreaterThanOrEqual(1);
        expect(item.level).toBeLessThanOrEqual(60);
        expect(recipe!.materials.length, `${item.recipe} has materials`).toBeGreaterThan(0);
        if (recipe!.source !== "trainer") expect(recipe!.where, `${item.recipe} says where`).toBeTruthy();
        if (recipe!.source === "favor") expect(recipe!.cost, `${item.recipe} has a price`).toMatch(/Merchant's Favor/);
      }
    }
  });

  it("lists key recipes that exist", () => {
    for (const k of guide.keyRecipes) expect(findRecipe(guide, k.recipe), k.recipe).toBeDefined();
  });
});

it("covers Warlocks in both guides", () => {
  expect(tailoring.classItems?.warlock?.length).toBeGreaterThan(10);
  expect(enchanting.classItems?.warlock?.length).toBeGreaterThan(10);
});

it("has a guide for every profession id, in order", () => {
  expect(PROFESSION_GUIDES.map((g) => g.id)).toEqual([...PROFESSION_IDS]);
});
