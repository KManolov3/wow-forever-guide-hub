/**
 * How much a spell rank is worth its training cost while leveling the recommended spec: "must" ranks are
 * worth buying even when gold is short, "recommended" ones when you can afford them, "skip" ones not at all.
 */
export type TrainPriority = "must" | "recommended" | "skip";

/** A spell taught by the class trainer (or a quest), with the level each rank becomes available. */
export interface GuideSpell {
  /** Kebab-case id, unique within the guide. */
  id: string;
  name: string;
  /** Wowhead/zamimg icon name. */
  icon?: string;
  /** Talent tree the spell belongs to in the spellbook, or "pet" for summons and demon abilities. */
  school: string;
  /** Level each rank is learned at, ascending; the first entry is when the spell is first available. */
  ranks: number[];
  description: string;
  /** Training priority for every rank, unless `trainRanks` overrides it. */
  train: TrainPriority;
  /** Priority for particular ranks, keyed by the level the rank is learned at. */
  trainRanks?: Record<number, TrainPriority>;
  /** Why the priority is what it is, shown with the spell. */
  trainNote?: string;
  /** How the spell is learned when it is not simply bought from the trainer. */
  learnedFrom?: string;
  /** True when the spell is new or reworked in Forever. */
  isNew?: boolean;
  /** What is not confirmed for Forever yet. */
  unconfirmed?: string;
}

/** One line of a priority list: a spell (or talent ability) to cast and when. */
export interface RotationStep {
  /** A GuideSpell id, or a talent id from the class's talent data. */
  ability: string;
  note: string;
}

/** The leveling rotation for a range of levels; ranges run from level 1 to 60 without gaps. */
export interface LevelRotation {
  from: number;
  to: number;
  pet: string;
  /** In priority order. */
  steps: RotationStep[];
  tips?: string[];
}

export interface Rotation {
  title: string;
  /** When this rotation applies, e.g. "Solo questing from level 10". */
  context: string;
  /** In priority order: the first step whose condition holds is cast next. */
  steps: RotationStep[];
  tips?: string[];
}

/** Talent points spent in one go: `points` ranks of `talent`, one per level. */
export interface TalentSegment {
  /** Talent id from the class's talent data; ids are unique across the class's trees. */
  talent: string;
  points: number;
  note?: string;
}

export interface SpecGuide {
  /** Id of the talent tree the spec is built around. */
  treeId: string;
  summary: string;
  pet: string;
  strengths: string[];
  weaknesses: string[];
  /** Rotations at level 60, e.g. dungeons and raids. */
  rotations: Rotation[];
  /** Talent order from level 10 to 60, one point per level: 51 points in total. */
  talentOrder: TalentSegment[];
}

export type GearSource = "quest" | "dungeon" | "auction" | "crafted" | "class";

/** An item that powers the class up noticeably while leveling. */
export interface GearUpgrade {
  /** Kebab-case id, unique within the guide. */
  id: string;
  name: string;
  /** Wowhead/zamimg icon name. */
  icon?: string;
  quality: "common" | "uncommon" | "rare" | "epic";
  /** Equipment slot, e.g. "Wand" or "Chest"; a later item in the same slot replaces an earlier one. */
  slot: string;
  /** Level required to use the item. */
  level: number;
  source: GearSource;
  /** Id of the zone or dungeon from the leveling guide where it is found, when it is found in one place. */
  place?: string;
  /** Where exactly: the quest and its giver, the boss that drops it, or who makes it. */
  where: string;
  /** Short stat summary. */
  stats: string;
  /** Why it is worth getting. */
  why: string;
  /** Page with the item's full tooltip: Wowhead's Forever database when the item is there, else Classic. */
  url?: string;
  /** What is not confirmed for Forever yet. */
  unconfirmed?: string;
}

export interface ClassGuide {
  classId: string;
  intro: string;
  /** Short notes on class-wide mechanics, shown above the spell list. */
  mechanics: { title: string; text: string }[];
  spells: GuideSpell[];
  /** The one spec recommended for leveling as fast as possible, with its rotation at each level. */
  leveling: {
    treeId: string;
    reason: string;
    rotations: LevelRotation[];
  };
  specs: SpecGuide[];
  /** Key item upgrades while leveling the recommended spec, in level order. */
  gear: GearUpgrade[];
  sources: { label: string; url: string }[];
}
