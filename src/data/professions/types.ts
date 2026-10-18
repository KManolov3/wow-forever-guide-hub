/** A reagent: something a recipe uses up. */
export interface Material {
  /** Kebab-case id, unique within the guide. */
  id: string;
  name: string;
  /** Wowhead/zamimg icon name. */
  icon?: string;
  /** Where a Horde player gets it. */
  source: string;
}

/** A profession rank bought from a trainer; each raises the skill cap. */
export interface TrainerTier {
  name: string;
  /** Skill needed to learn the rank (0 for the first). */
  skill: number;
  /** Character level needed to learn the rank. */
  level: number;
  /** Skill cap the rank raises the profession to. */
  cap: number;
  /** Who teaches it to the Horde and where. */
  trainers: string[];
  note?: string;
}

/**
 * "favor" is a Merchant's Favor vendor (Durotar Supply and Logistics for the Horde); "unknown" is a recipe whose
 * pattern is in the game data but whose source is not known yet.
 */
export type RecipeSource = "trainer" | "vendor" | "favor" | "drop" | "quest" | "unknown";

/** Something the profession makes, with the skill at which its colour changes. */
export interface Recipe {
  /** Kebab-case id, unique within the guide. */
  id: string;
  name: string;
  /** Wowhead/zamimg icon name. */
  icon?: string;
  /** Skill needed to learn it, when a source publishes it for Forever. */
  learn?: number;
  /**
   * Skill at which the recipe turns yellow (usually a point), green (sometimes a point) and grey (no points);
   * it is orange (a point every craft) from `learn` up to yellow. Only where a source publishes it for Forever.
   */
  colors?: [yellow: number, green: number, grey: number];
  /** Empty when no source lists them yet. */
  materials: { material: string; count: number }[];
  /** Tools held, not used up, e.g. an enchanting rod. */
  tools?: string[];
  source: RecipeSource;
  /** Where a Horde player learns it, when not from the profession trainer. */
  where?: string;
  /** What the recipe itself costs when it has to be bought, e.g. "30 Merchant's Favor" or "1g 20s". */
  cost?: string;
  /** Expected materials from disenchanting one of what it makes, for green results. */
  disenchant?: { material: string; count: number }[];
  /** True when the recipe is new or changed in Forever. */
  isNew?: boolean;
  /** What is not confirmed for Forever yet. */
  unconfirmed?: string;
}

/** Crafts to make over a range of skill; steps run from skill 1 to the top without gaps. */
export interface LevelingStep {
  from: number;
  to: number;
  recipe: string;
  /** Crafts expected to take the skill from `from` to `to`. */
  crafts: number;
  note?: string;
  /** What is not confirmed for Forever yet, e.g. a step past the beta's skill cap. */
  unconfirmed?: string;
  /** What to make over the same skill range instead when you also level Enchanting and disenchant the results. */
  enchanterAlt?: { recipe: string; crafts: number; note: string };
}

/** Something the profession makes that one class uses while leveling. */
export interface ClassItem {
  /** Recipe id in the same guide. */
  recipe: string;
  /** The item made, or the enchant applied. */
  name: string;
  /** Wowhead/zamimg icon name. */
  icon?: string;
  quality: "common" | "uncommon" | "rare" | "epic";
  /** Equipment slot, or the slot an enchant goes on. */
  slot: string;
  /** Level needed to use it; 1 for enchants, which any level can use. */
  level: number;
  stats: string;
  why: string;
  /** Wowhead Forever page of the item or enchant. */
  url?: string;
  /** True when only the crafter can use it. */
  bindsOnPickup?: boolean;
}

/** A recipe worth picking up for what it makes rather than for skill points. */
export interface KeyRecipe {
  recipe: string;
  why: string;
}

/** Highest skill the Forever beta allowed; the route above it follows Classic data. */
export const BETA_SKILL_CAP = 225;

/** Shown on route steps above the beta's skill cap. */
export const AFTER_BETA = `the beta stops at skill ${BETA_SKILL_CAP}, so this step follows Classic data`;

export interface ProfessionGuide {
  /** Kebab-case id, used in links. */
  id: string;
  name: string;
  /** Wowhead/zamimg icon name. */
  icon: string;
  intro: string;
  /** Short notes on how the profession works in Forever and with other professions. */
  tips: { title: string; text: string }[];
  tiers: TrainerTier[];
  materials: Material[];
  recipes: Recipe[];
  /** The leveling route from skill 1 to the top of the last tier. */
  steps: LevelingStep[];
  keyRecipes: KeyRecipe[];
  /** Items for a class to make and use while leveling, by class id; classes without a list show a note. */
  classItems?: Record<string, ClassItem[]>;
  sources: { label: string; url: string }[];
}
