import { describe, expect, it } from "vitest";
import { CLASSES } from ".";

describe.each(CLASSES.map((c) => [c.name, c] as const))("%s data", (_, cls) => {
  it("has three trees", () => {
    expect(cls.trees).toHaveLength(3);
  });

  it.each(cls.trees.map((t) => [t.name, t] as const))("%s tree is consistent", (_, tree) => {
    const ids = new Set(tree.talents.map((t) => t.id));
    expect(ids.size).toBe(tree.talents.length);

    const cells = new Set(tree.talents.map((t) => `${t.tier}:${t.column}`));
    expect(cells.size).toBe(tree.talents.length);

    for (const t of tree.talents) {
      expect(t.tier).toBeGreaterThanOrEqual(1);
      expect(t.tier).toBeLessThanOrEqual(7);
      expect(t.column).toBeGreaterThanOrEqual(1);
      expect(t.column).toBeLessThanOrEqual(4);
      expect(t.maxRank).toBeGreaterThanOrEqual(1);
      expect(t.ranks.length).toBeGreaterThanOrEqual(1);
      if (t.requires) {
        const req = tree.talents.find((r) => r.id === t.requires);
        expect(req, `${t.id} requires ${t.requires}`).toBeDefined();
        expect(req!.tier).toBeLessThanOrEqual(t.tier);
      }
    }
  });
});
