export interface Talent {
  /** Kebab-case id, unique within the class (e.g. "arcane-focus"). */
  id: string;
  name: string;
  /** 1-7; each tier unlocks after (tier - 1) * 5 points in the tree. */
  tier: number;
  /** 1-4, position within the tier row. */
  column: number;
  maxRank: number;
  /** Id of a talent that must be fully ranked first. */
  requires?: string;
  /** One description per rank; a single entry means it applies to all ranks. */
  ranks: string[];
  /** Wowhead/zamimg icon name, e.g. "spell_holy_dispelmagic". */
  icon?: string;
  /** True when the talent is new or redesigned in Forever. */
  isNew?: boolean;
}

export interface TalentTree {
  id: string;
  name: string;
  /** Icon name for the tree's specialization badge. */
  icon?: string;
  talents: Talent[];
}

export interface WowClass {
  id: string;
  name: string;
  /** Official class color, hex. */
  color: string;
  icon?: string;
  /** URL the data was taken from. */
  source: string;
  trees: [TalentTree, TalentTree, TalentTree];
}
