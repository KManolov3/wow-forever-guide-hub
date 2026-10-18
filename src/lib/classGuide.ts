import type { GearUpgrade, GuideSpell, LevelRotation, TalentSegment, TrainPriority } from "../data/classGuides/types";
import type { Talent, WowClass } from "../data/types";
import { type Build, FIRST_TALENT_LEVEL, addPoint, emptyBuild } from "./talents";

/** One talent point from a leveling order: the level it is spent at and the rank it brings the talent to. */
export interface TalentPick {
  level: number;
  treeIndex: number;
  talent: Talent;
  rank: number;
  /** Note of the segment the pick belongs to, on the segment's first pick only. */
  note?: string;
}

/** Finds a talent by id in any of the class's trees. */
export function locateTalent(cls: WowClass, id: string): { treeIndex: number; talent: Talent } | undefined {
  for (const [treeIndex, tree] of cls.trees.entries()) {
    const talent = tree.talents.find((t) => t.id === id);
    if (talent) return { treeIndex, talent };
  }
  return undefined;
}

/**
 * Expands a talent order into one pick per level from 10 upwards. Throws on an unknown talent id, since a
 * guide naming a talent the class does not have is a data error.
 */
export function expandTalentOrder(cls: WowClass, order: TalentSegment[]): TalentPick[] {
  const picks: TalentPick[] = [];
  const ranks = new Map<string, number>();
  for (const segment of order) {
    const found = locateTalent(cls, segment.talent);
    if (!found) throw new Error(`Unknown talent "${segment.talent}" for ${cls.name}`);
    for (let i = 0; i < segment.points; i++) {
      const rank = (ranks.get(segment.talent) ?? 0) + 1;
      ranks.set(segment.talent, rank);
      picks.push({
        level: FIRST_TALENT_LEVEL + picks.length,
        ...found,
        rank,
        note: i === 0 ? segment.note : undefined,
      });
    }
  }
  return picks;
}

/** Replays the picks up to the given level through the calculator rules; picks the rules reject are skipped. */
export function buildAtLevel(cls: WowClass, picks: TalentPick[], level: number): Build {
  return picks
    .filter((p) => p.level <= level)
    .reduce((build, p) => addPoint(cls, build, p.treeIndex, p.talent), emptyBuild(cls));
}

/** Levels whose pick the calculator rules reject (tier, prerequisite, max rank or point cap). */
export function illegalPickLevels(cls: WowClass, picks: TalentPick[]): number[] {
  const illegal: number[] = [];
  let build = emptyBuild(cls);
  for (const p of picks) {
    const next = addPoint(cls, build, p.treeIndex, p.talent);
    if (next === build) illegal.push(p.level);
    build = next;
  }
  return illegal;
}

/** Highest rank of the spell known at the given level, or 0 when it is not learned yet. */
export const rankAt = (spell: GuideSpell, level: number) => spell.ranks.filter((l) => l <= level).length;

/** Spells (with the rank) that become available at exactly the given level. */
export function trainingAt(spells: GuideSpell[], level: number): { spell: GuideSpell; rank: number }[] {
  return spells.flatMap((spell) => {
    const index = spell.ranks.indexOf(level);
    return index === -1 ? [] : [{ spell, rank: index + 1 }];
  });
}

/** The first level above `level` at which any spell gains a rank, or undefined when none is left. */
export function nextTrainingLevel(spells: GuideSpell[], level: number): number | undefined {
  const upcoming = spells.flatMap((s) => s.ranks).filter((l) => l > level);
  return upcoming.length ? Math.min(...upcoming) : undefined;
}

/** Training priority of the spell's rank learned at the given level. */
export const trainPriority = (spell: GuideSpell, rankLevel: number): TrainPriority =>
  spell.trainRanks?.[rankLevel] ?? spell.train;

export interface TrainingVisit {
  level: number;
  ranks: { spell: GuideSpell; rank: number; priority: TrainPriority }[];
}

const PRIORITY_ORDER: TrainPriority[] = ["must", "recommended", "skip"];

/** Every level at which the trainer has something new, with each rank's priority, most important first. */
export function trainingPlan(spells: GuideSpell[]): TrainingVisit[] {
  const levels = [...new Set(spells.flatMap((s) => s.ranks))].sort((a, b) => a - b);
  return levels.map((level) => ({
    level,
    ranks: trainingAt(spells, level)
      .map(({ spell, rank }) => ({ spell, rank, priority: trainPriority(spell, level) }))
      .sort(
        (a, b) =>
          PRIORITY_ORDER.indexOf(a.priority) - PRIORITY_ORDER.indexOf(b.priority) ||
          a.spell.name.localeCompare(b.spell.name),
      ),
  }));
}

/** The leveling rotation covering the given level. */
export const rotationFor = (rotations: LevelRotation[], level: number) =>
  rotations.find((r) => r.from <= level && level <= r.to);

/** How far ahead of the player's level an item counts as coming up next. */
export const GEAR_LOOKAHEAD = 5;

export type GearStatus = "outgrown" | "now" | "soon" | "later";

/**
 * Where an item stands for a player of the given level: "outgrown" once a later item for the same slot is
 * usable, "now" when usable, "soon" within the next few levels, otherwise "later".
 */
export function gearStatus(gear: GearUpgrade[], item: GearUpgrade, level: number): GearStatus {
  if (item.level > level) return item.level <= level + GEAR_LOOKAHEAD ? "soon" : "later";
  const replaced = gear.some((g) => g !== item && g.slot === item.slot && g.level > item.level && g.level <= level);
  return replaced ? "outgrown" : "now";
}
