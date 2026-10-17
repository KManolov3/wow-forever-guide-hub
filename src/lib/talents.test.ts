import { describe, expect, it } from "vitest";
import type { Talent, WowClass } from "../data/types";
import {
  TOTAL_POINTS,
  addPoint,
  canRemove,
  decodeBuild,
  emptyBuild,
  encodeBuild,
  removePoint,
  totalPoints,
} from "./talents";

const talent = (id: string, tier: number, column: number, maxRank: number, requires?: string): Talent => ({
  id,
  name: id,
  tier,
  column,
  maxRank,
  requires,
  ranks: ["desc"],
});

const tree = (id: string) => ({
  id,
  name: id,
  talents: [
    talent("a", 1, 1, 5),
    talent("b", 1, 2, 5),
    talent("c", 2, 1, 3, "a"),
    talent("d", 2, 2, 5),
    talent("e", 3, 2, 5),
    talent("f", 4, 2, 5),
    talent("g", 5, 2, 5),
    talent("h", 6, 2, 5),
    talent("i", 7, 2, 1),
  ],
});

const cls: WowClass = {
  id: "test",
  name: "Test",
  color: "#fff",
  source: "https://example.com",
  trees: [tree("one"), tree("two"), tree("three")],
};

const t = (id: string) => cls.trees[0].talents.find((x) => x.id === id)!;

const addMany = (build = emptyBuild(cls), ...steps: [string, number][]) =>
  steps.reduce((b, [id, n]) => {
    for (let k = 0; k < n; k++) b = addPoint(cls, b, 0, t(id));
    return b;
  }, build);

describe("talent rules", () => {
  it("locks higher tiers until 5 points per tier are spent", () => {
    const b = addMany(undefined, ["a", 4], ["d", 1]);
    expect(b[0].d).toBeUndefined();
    const b2 = addMany(b, ["b", 1], ["d", 1]);
    expect(b2[0].d).toBe(1);
  });

  it("requires prerequisites to be fully ranked", () => {
    const b = addMany(undefined, ["b", 5], ["a", 4], ["c", 1]);
    expect(b[0].c).toBeUndefined();
    expect(addMany(b, ["a", 1], ["c", 1])[0].c).toBe(1);
  });

  it("does not exceed max rank", () => {
    expect(addMany(undefined, ["a", 9])[0].a).toBe(5);
  });

  it("blocks removals that would strand higher-tier points", () => {
    const b = addMany(undefined, ["a", 5], ["d", 1]);
    expect(canRemove(cls, b, 0, t("a"))).toBe(false);
    expect(removePoint(cls, b, 0, t("d"))[0].d).toBeUndefined();
  });

  it("blocks removals that would break a prerequisite", () => {
    const b = addMany(undefined, ["a", 5], ["b", 5], ["c", 1]);
    expect(canRemove(cls, b, 0, t("a"))).toBe(false);
  });

  it("caps total points", () => {
    let b = emptyBuild(cls);
    for (let i = 0; i < 3; i++) {
      for (const x of cls.trees[i].talents) for (let k = 0; k < 5; k++) b = addPoint(cls, b, i, x);
    }
    expect(totalPoints(b)).toBe(TOTAL_POINTS);
  });

  it("round-trips builds through the URL encoding", () => {
    const b = addMany(undefined, ["a", 5], ["b", 2], ["c", 3]);
    const encoded = encodeBuild(cls, b);
    expect(encoded).toBe("523--");
    expect(decodeBuild(cls, encoded)).toEqual(b);
  });

  it("drops invalid points when decoding", () => {
    expect(decodeBuild(cls, "0010000009")[0]).toEqual({});
  });
});
