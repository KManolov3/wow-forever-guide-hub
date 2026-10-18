import type { LevelingStep, Material, ProfessionGuide, Recipe, TrainerTier } from "../data/professions/types";

export const MAX_SKILL = 300;

/** How much skill a craft gives: orange always, yellow usually, green sometimes, grey never. */
export type RecipeColor = "unlearnable" | "orange" | "yellow" | "green" | "grey";

/** The recipe's colour at a skill, or undefined when its colour thresholds are not published. */
export function recipeColor(recipe: Recipe, skill: number): RecipeColor | undefined {
  if (!recipe.colors) return undefined;
  const [yellow, green, grey] = recipe.colors;
  if (skill < (recipe.learn ?? 1)) return "unlearnable";
  if (skill < yellow) return "orange";
  if (skill < green) return "yellow";
  if (skill < grey) return "green";
  return "grey";
}

/**
 * Crafts expected to raise the skill from `from` to `to` with a recipe: one per point while orange, then
 * (grey − skill) / (grey − yellow) chance per craft. Undefined when the thresholds are not published.
 */
export function expectedCrafts(recipe: Recipe, from: number, to: number): number | undefined {
  if (!recipe.colors) return undefined;
  const [yellow, , grey] = recipe.colors;
  let crafts = 0;
  for (let skill = from; skill < to; skill++) {
    if (skill >= grey) return Infinity;
    crafts += skill < yellow ? 1 : (grey - yellow) / (grey - skill);
  }
  return crafts;
}

/** A route step as shown; `swapped` marks an Enchanting-paired alternative. */
export type ActiveStep = LevelingStep & { swapped?: boolean };

/** The route's steps, with the Enchanting-paired alternatives swapped in when `enchanter` is set. */
export function activeSteps(guide: ProfessionGuide, enchanter: boolean): ActiveStep[] {
  if (!enchanter) return guide.steps;
  return guide.steps.map((s) =>
    s.enchanterAlt
      ? {
          from: s.from,
          to: s.to,
          recipe: s.enchanterAlt.recipe,
          crafts: s.enchanterAlt.crafts,
          note: s.enchanterAlt.note,
          unconfirmed: s.unconfirmed,
          swapped: true,
        }
      : s,
  );
}

/** Expected Enchanting materials from disenchanting every green the rest of the route makes, most first. */
export function disenchantYield(guide: ProfessionGuide, skill = 1): MaterialNeed[] {
  const totals = new Map<string, number>();
  for (const step of guide.steps) {
    const crafts = remainingCrafts(step, skill);
    for (const { material, count } of findRecipe(guide, step.recipe)?.disenchant ?? []) {
      totals.set(material, (totals.get(material) ?? 0) + crafts * count);
    }
  }
  return [...totals]
    .map(([id, count]) => ({
      material: findMaterial(guide, id)!,
      count: Math.round(count),
    }))
    .filter((n) => n.material && n.count > 0)
    .sort((a, b) => b.count - a.count || a.material.name.localeCompare(b.material.name));
}

export function findRecipe(guide: ProfessionGuide, id: string): Recipe | undefined {
  return guide.recipes.find((r) => r.id === id);
}

export function findMaterial(guide: ProfessionGuide, id: string): Material | undefined {
  return guide.materials.find((m) => m.id === id);
}

/** The step to work on at a skill: the one whose range holds it, or none once the route is finished. */
export function stepAt(guide: ProfessionGuide, skill: number): LevelingStep | undefined {
  return guide.steps.find((s) => skill < s.to && skill >= s.from) ?? guide.steps.find((s) => skill < s.from);
}

/** Crafts of a step still to make at a skill, assuming skill comes evenly across the step. */
export function remainingCrafts(step: LevelingStep, skill: number): number {
  if (skill <= step.from) return step.crafts;
  if (skill >= step.to) return 0;
  return Math.ceil((step.crafts * (step.to - skill)) / (step.to - step.from));
}

export interface MaterialNeed {
  material: Material;
  count: number;
}

/**
 * Everything the rest of the route uses up from a skill on, most needed first. Materials the route makes itself
 * (bolts, rods) count only for the shortfall, as the materials to make it.
 */
export function materialsNeeded(guide: ProfessionGuide, skill = 1): MaterialNeed[] {
  const totals = new Map<string, number>();
  const made = new Map<string, number>();
  const add = (map: Map<string, number>, id: string, n: number) => map.set(id, (map.get(id) ?? 0) + n);
  for (const step of guide.steps) {
    const crafts = remainingCrafts(step, skill);
    if (crafts === 0) continue;
    add(made, step.recipe, crafts);
    for (const { material, count } of findRecipe(guide, step.recipe)?.materials ?? [])
      add(totals, material, crafts * count);
  }
  for (const [id, need] of [...totals]) {
    const recipe = made.has(id) ? findRecipe(guide, id) : undefined;
    if (!recipe) continue;
    totals.delete(id);
    const short = need - made.get(id)!;
    if (short > 0) for (const { material, count } of recipe.materials) add(totals, material, short * count);
  }
  return [...totals]
    .map(([id, count]) => ({ material: findMaterial(guide, id)!, count }))
    .filter((n) => n.material)
    .sort((a, b) => b.count - a.count || a.material.name.localeCompare(b.material.name));
}

/** The next trainer rank to learn after a skill: the first that needs more skill, or none once all are learnable. */
export function nextTier(guide: ProfessionGuide, skill: number): TrainerTier | undefined {
  return guide.tiers.find((t) => t.skill > skill);
}
