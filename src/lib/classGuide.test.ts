import { describe, expect, it } from "vitest";
import { CLASS_GUIDES } from "../data/classGuides";
import type { GuideSpell } from "../data/classGuides/types";
import { findClass } from "../data/classes";
import {
  buildAtLevel,
  expandTalentOrder,
  illegalPickLevels,
  locateTalent,
  nextTrainingLevel,
  rankAt,
  rotationFor,
  trainPriority,
  trainingAt,
  trainingPlan,
} from "./classGuide";
import { TOTAL_POINTS, decodeBuild, encodeBuild, totalPoints, treePoints } from "./talents";

const warlock = findClass("warlock")!;

const spell = (id: string, ranks: number[], extra: Partial<GuideSpell> = {}): GuideSpell => ({
  id,
  name: id,
  school: "Test",
  ranks,
  description: "",
  train: "must",
  ...extra,
});

describe("talent order helpers", () => {
  it("expands segments into one pick per level from 10", () => {
    const picks = expandTalentOrder(warlock, [
      { talent: "improved-corruption", points: 2, note: "first" },
      { talent: "suppression", points: 1 },
    ]);
    expect(picks.map((p) => [p.level, p.talent.id, p.rank, p.note])).toEqual([
      [10, "improved-corruption", 1, "first"],
      [11, "improved-corruption", 2, undefined],
      [12, "suppression", 1, undefined],
    ]);
  });

  it("finds talents in any tree", () => {
    expect(locateTalent(warlock, "conflagrate")?.treeIndex).toBe(2);
    expect(locateTalent(warlock, "nope")).toBeUndefined();
  });

  it("rejects unknown talent ids", () => {
    expect(() => expandTalentOrder(warlock, [{ talent: "nope", points: 1 }])).toThrow(/nope/);
  });

  it("flags picks the calculator rules reject", () => {
    const picks = expandTalentOrder(warlock, [
      { talent: "improved-corruption", points: 6 },
      { talent: "siphon-life", points: 1 },
    ]);
    expect(illegalPickLevels(warlock, picks)).toEqual([15, 16]);
  });

  it("builds the talents spent up to a level", () => {
    const picks = expandTalentOrder(warlock, [
      { talent: "improved-corruption", points: 5 },
      { talent: "improved-drains", points: 3 },
    ]);
    expect(totalPoints(buildAtLevel(warlock, picks, 9))).toBe(0);
    expect(buildAtLevel(warlock, picks, 12)[0]).toEqual({ "improved-corruption": 3 });
    expect(buildAtLevel(warlock, picks, 60)[0]).toEqual({ "improved-corruption": 5, "improved-drains": 3 });
  });
});

describe("spell helpers", () => {
  const spells = [spell("a", [1, 6, 12]), spell("b", [4]), spell("c", [12, 20])];

  it("counts the ranks known at a level", () => {
    expect(rankAt(spells[0], 1)).toBe(1);
    expect(rankAt(spells[0], 11)).toBe(2);
    expect(rankAt(spells[2], 11)).toBe(0);
  });

  it("lists what the trainer teaches at a level", () => {
    expect(trainingAt(spells, 12).map(({ spell, rank }) => [spell.id, rank])).toEqual([
      ["a", 3],
      ["c", 1],
    ]);
    expect(trainingAt(spells, 13)).toEqual([]);
  });

  it("finds the next training level", () => {
    expect(nextTrainingLevel(spells, 4)).toBe(6);
    expect(nextTrainingLevel(spells, 20)).toBeUndefined();
  });

  it("uses a rank's own priority over the spell's", () => {
    const s = spell("x", [1, 10, 20], { train: "skip", trainRanks: { 10: "must" } });
    expect([1, 10, 20].map((l) => trainPriority(s, l))).toEqual(["skip", "must", "skip"]);
  });

  it("plans one trainer visit per level, most important ranks first", () => {
    const plan = trainingPlan([
      spell("b", [4, 12], { train: "skip" }),
      spell("a", [12], { train: "recommended" }),
      spell("c", [12], { train: "must" }),
    ]);
    expect(plan.map((v) => v.level)).toEqual([4, 12]);
    expect(plan[1].ranks.map((r) => [r.spell.id, r.rank, r.priority])).toEqual([
      ["c", 1, "must"],
      ["a", 1, "recommended"],
      ["b", 2, "skip"],
    ]);
  });

  it("finds the leveling rotation for a level", () => {
    const rotations = [
      { from: 1, to: 9, pet: "", steps: [] },
      { from: 10, to: 60, pet: "", steps: [] },
    ];
    expect(rotationFor(rotations, 9)).toBe(rotations[0]);
    expect(rotationFor(rotations, 10)).toBe(rotations[1]);
  });
});

describe.each(Object.values(CLASS_GUIDES))("$classId guide data", (guide) => {
  const cls = findClass(guide.classId)!;

  it("belongs to a known class", () => {
    expect(cls).toBeDefined();
  });

  it("has unique spell ids with ascending rank levels between 1 and 60", () => {
    expect(new Set(guide.spells.map((s) => s.id)).size).toBe(guide.spells.length);
    for (const s of guide.spells) {
      expect(s.ranks.length, s.id).toBeGreaterThan(0);
      expect(s.ranks[0], s.id).toBeGreaterThanOrEqual(1);
      expect(s.ranks.at(-1), s.id).toBeLessThanOrEqual(60);
      for (let i = 1; i < s.ranks.length; i++) expect(s.ranks[i], s.id).toBeGreaterThan(s.ranks[i - 1]);
    }
  });

  it("gives each trainRanks override a level the spell is learned at", () => {
    for (const s of guide.spells) {
      for (const level of Object.keys(s.trainRanks ?? {})) expect(s.ranks, s.id).toContain(Number(level));
    }
  });

  describe("leveling plan", () => {
    const spec = guide.specs.find((s) => s.treeId === guide.leveling.treeId);
    const picks = spec ? expandTalentOrder(cls, spec.talentOrder) : [];
    const rotations = guide.leveling.rotations;

    it("recommends one of the class's specs", () => {
      expect(spec).toBeDefined();
    });

    it("has a rotation for every level from 1 to 60, without gaps or overlaps", () => {
      expect(rotations[0].from).toBe(1);
      expect(rotations.at(-1)!.to).toBe(60);
      for (let i = 0; i < rotations.length; i++) {
        expect(rotations[i].to).toBeGreaterThanOrEqual(rotations[i].from);
        if (i > 0) expect(rotations[i].from).toBe(rotations[i - 1].to + 1);
      }
    });

    it("only uses abilities learned by the end of each level range, and none the trainer plan says to skip", () => {
      for (const r of rotations) {
        expect(r.steps.length).toBeGreaterThan(0);
        for (const step of r.steps) {
          const where = `${r.from}–${r.to}: ${step.ability}`;
          const s = guide.spells.find((x) => x.id === step.ability);
          if (s) {
            expect(s.ranks[0], where).toBeLessThanOrEqual(r.to);
            expect(trainPriority(s, s.ranks[0]), where).not.toBe("skip");
          } else {
            const pick = picks.find((p) => p.talent.id === step.ability);
            expect(pick, where).toBeDefined();
            expect(pick!.level, where).toBeLessThanOrEqual(r.to);
          }
        }
      }
    });

    it("marks every spell the leveling rotations rely on from the start of a range as must train", () => {
      for (const r of rotations) {
        for (const step of r.steps) {
          const s = guide.spells.find((x) => x.id === step.ability);
          if (s && s.ranks[0] <= r.from) expect(trainPriority(s, s.ranks[0]), step.ability).toBe("must");
        }
      }
    });
  });

  it("covers each talent tree with exactly one spec", () => {
    expect(guide.specs.map((s) => s.treeId).sort()).toEqual(cls.trees.map((t) => t.id).sort());
  });

  describe.each(guide.specs)("$treeId", (spec) => {
    const picks = expandTalentOrder(cls, spec.talentOrder);

    it("spends exactly 51 points, every one legal under the calculator rules", () => {
      expect(picks).toHaveLength(TOTAL_POINTS);
      expect(illegalPickLevels(cls, picks)).toEqual([]);
    });

    it("puts most points in its own tree", () => {
      const build = buildAtLevel(cls, picks, 60);
      const own = cls.trees.findIndex((t) => t.id === spec.treeId);
      const points = build.map(treePoints);
      expect(Math.max(...points)).toBe(points[own]);
      expect(points[own]).toBeGreaterThanOrEqual(31);
    });

    it("produces a build link that round-trips", () => {
      const build = buildAtLevel(cls, picks, 60);
      expect(decodeBuild(cls, encodeBuild(cls, build))).toEqual(build);
    });

    it("names only known spells or talents in its rotations", () => {
      for (const r of spec.rotations) {
        expect(r.steps.length, r.title).toBeGreaterThan(0);
        for (const step of r.steps) {
          const known = guide.spells.some((s) => s.id === step.ability) || locateTalent(cls, step.ability);
          expect(known, `${r.title}: ${step.ability}`).toBeTruthy();
        }
      }
    });

    it("only uses talents in its rotations that its talent order takes", () => {
      for (const r of spec.rotations) {
        for (const step of r.steps) {
          if (guide.spells.some((s) => s.id === step.ability)) continue;
          expect(
            picks.some((p) => p.talent.id === step.ability),
            `${r.title}: ${step.ability}`,
          ).toBe(true);
        }
      }
    });
  });
});
