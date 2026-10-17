import type { Talent, TalentTree, WowClass } from "../data/types";

export const MAX_LEVEL = 60;
export const FIRST_TALENT_LEVEL = 10;
export const TOTAL_POINTS = MAX_LEVEL - FIRST_TALENT_LEVEL + 1;
export const POINTS_PER_TIER = 5;

/** Ranks per talent id, one map per tree (same order as WowClass.trees). */
export type Build = Record<string, number>[];

export const emptyBuild = (cls: WowClass): Build => cls.trees.map(() => ({}));

export const rankOf = (build: Build, treeIndex: number, talentId: string) =>
  build[treeIndex]?.[talentId] ?? 0;

export const treePoints = (ranks: Record<string, number>) =>
  Object.values(ranks).reduce((sum, r) => sum + r, 0);

export const totalPoints = (build: Build) =>
  build.reduce((sum, ranks) => sum + treePoints(ranks), 0);

export const requiredLevel = (points: number) =>
  points === 0 ? 0 : FIRST_TALENT_LEVEL - 1 + points;

export const tierRequirement = (tier: number) => (tier - 1) * POINTS_PER_TIER;

/** Points spent in the tree on tiers strictly below the given tier. */
const pointsBelowTier = (tree: TalentTree, ranks: Record<string, number>, tier: number) =>
  tree.talents
    .filter((t) => t.tier < tier)
    .reduce((sum, t) => sum + (ranks[t.id] ?? 0), 0);

export function findTalent(tree: TalentTree, id: string): Talent | undefined {
  return tree.talents.find((t) => t.id === id);
}

export const tierUnlocked = (tree: TalentTree, ranks: Record<string, number>, tier: number) =>
  pointsBelowTier(tree, ranks, tier) >= tierRequirement(tier);

export function isUnlocked(tree: TalentTree, ranks: Record<string, number>, talent: Talent) {
  if (!tierUnlocked(tree, ranks, talent.tier)) return false;
  if (talent.requires) {
    const req = findTalent(tree, talent.requires);
    if (req && (ranks[req.id] ?? 0) < req.maxRank) return false;
  }
  return true;
}

export function canAdd(cls: WowClass, build: Build, treeIndex: number, talent: Talent) {
  const ranks = build[treeIndex];
  if (totalPoints(build) >= TOTAL_POINTS) return false;
  if ((ranks[talent.id] ?? 0) >= talent.maxRank) return false;
  return isUnlocked(cls.trees[treeIndex], ranks, talent);
}

/**
 * A point can be removed only if every other invested talent stays valid:
 * tier thresholds still met and no fully-ranked prerequisite is broken.
 */
export function canRemove(cls: WowClass, build: Build, treeIndex: number, talent: Talent) {
  const ranks = build[treeIndex];
  const current = ranks[talent.id] ?? 0;
  if (current === 0) return false;
  const tree = cls.trees[treeIndex];
  const next = { ...ranks, [talent.id]: current - 1 };
  return tree.talents.every((t) => (next[t.id] ?? 0) === 0 || isUnlocked(tree, next, t));
}

export function addPoint(cls: WowClass, build: Build, treeIndex: number, talent: Talent): Build {
  if (!canAdd(cls, build, treeIndex, talent)) return build;
  return build.map((ranks, i) =>
    i === treeIndex ? { ...ranks, [talent.id]: (ranks[talent.id] ?? 0) + 1 } : ranks,
  );
}

export function removePoint(cls: WowClass, build: Build, treeIndex: number, talent: Talent): Build {
  if (!canRemove(cls, build, treeIndex, talent)) return build;
  return build.map((ranks, i) => {
    if (i !== treeIndex) return ranks;
    const next = { ...ranks, [talent.id]: ranks[talent.id] - 1 };
    if (next[talent.id] === 0) delete next[talent.id];
    return next;
  });
}

export function resetTree(build: Build, treeIndex: number): Build {
  return build.map((ranks, i) => (i === treeIndex ? {} : ranks));
}

const orderedTalents = (tree: TalentTree) =>
  [...tree.talents].sort((a, b) => a.tier - b.tier || a.column - b.column);

/** Encodes a build as one digit per talent per tree, e.g. "0500320-0-31". Trailing zeros are trimmed. */
export function encodeBuild(cls: WowClass, build: Build): string {
  return cls.trees
    .map((tree, i) =>
      orderedTalents(tree)
        .map((t) => String(rankOf(build, i, t.id)))
        .join("")
        .replace(/0+$/, ""),
    )
    .join("-");
}

/** Decodes a build string, replaying points in tier order so invalid input is dropped rather than trusted. */
export function decodeBuild(cls: WowClass, encoded: string): Build {
  const parts = encoded.split("-");
  let build = emptyBuild(cls);
  const wanted = cls.trees.map((tree, i) =>
    orderedTalents(tree).map((t, j) => ({ talent: t, rank: Number(parts[i]?.[j] ?? 0) || 0 })),
  );
  for (let tier = 1; tier <= 7; tier++) {
    wanted.forEach((entries, treeIndex) => {
      for (const { talent, rank } of entries) {
        if (talent.tier !== tier) continue;
        for (let r = 0; r < rank; r++) build = addPoint(cls, build, treeIndex, talent);
      }
    });
  }
  return build;
}

/** Description for the given rank (1-based), falling back to the last one available. */
export function describeRank(talent: Talent, rank: number): string {
  const { ranks } = talent;
  if (ranks.length === 0) return "";
  return ranks[Math.min(Math.max(rank, 1), ranks.length) - 1];
}
