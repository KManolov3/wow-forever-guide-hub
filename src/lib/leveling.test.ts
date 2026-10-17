import { describe, expect, it } from "vitest";
import { CONTEXT_ZONES, DUNGEONS, ROUTE, STARTING_ZONES, ZONES } from "../data/leveling";
import { MAX_LEVEL, buildRoute, findPlace, isStartingZone, levelBand, stepForLevel, timelineRows, travelBetween } from "./leveling";

const place = (id: string) => findPlace(id)!;
/** Steps may start this many levels below a place's range: a completionist arrives a little ahead of the quests. */
const EARLY_TOLERANCE = 2;

describe("leveling data", () => {
  it("has unique ids across zones and dungeons", () => {
    const ids = [...ZONES, ...DUNGEONS].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("puts every dungeon entrance in a known zone", () => {
    for (const d of DUNGEONS) expect(ZONES.some((z) => z.id === d.zone), d.id).toBe(true);
  });

  it("has valid level ranges", () => {
    for (const p of [...ZONES, ...DUNGEONS]) {
      expect(p.levels[0], p.id).toBeGreaterThanOrEqual(1);
      expect(p.levels[0], p.id).toBeLessThanOrEqual(p.levels[1]);
      expect(p.levels[1], p.id).toBeLessThanOrEqual(MAX_LEVEL);
    }
  });

  it("keeps every map marker on the map", () => {
    const points = [...ZONES.map((z) => z.map), ...DUNGEONS.map((d) => place(d.id).map), ...CONTEXT_ZONES.map((z) => z.map)];
    for (const p of points) {
      expect(p.x).toBeGreaterThanOrEqual(0);
      expect(p.x).toBeLessThanOrEqual(100);
      expect(p.y).toBeGreaterThanOrEqual(0);
      expect(p.y).toBeLessThanOrEqual(100);
    }
  });

  it("gives every starting zone its races", () => {
    for (const id of STARTING_ZONES) expect(ZONES.find((z) => z.id === id)?.startingRaces, id).toBeTruthy();
  });
});

describe("shared route", () => {
  it("only names known places", () => {
    for (const s of ROUTE) expect(findPlace(s.place), s.place).toBeDefined();
  });

  it("never sends you to a starting zone", () => {
    for (const s of ROUTE) expect(isStartingZone(s.place), s.place).toBe(false);
  });

  it("visits every non-starting zone and every dungeon at least once", () => {
    const visited = new Set(ROUTE.map((s) => s.place));
    for (const z of ZONES.filter((z) => !isStartingZone(z.id))) expect(visited.has(z.id), z.id).toBe(true);
    for (const d of DUNGEONS) expect(visited.has(d.id), d.id).toBe(true);
  });

  it("leaves out dungeons that are hard for the Horde to reach", () => {
    const names = ROUTE.map((s) => place(s.place).name);
    for (const name of ["The Deadmines", "The Stockade", "Gnomeregan", "Hall of Thanes", "Excavation Site"]) {
      expect(names).not.toContain(name);
    }
  });

  it("is ordered by starting level and leaves no level uncovered up to 60", () => {
    let reached = 10;
    ROUTE.forEach((s, i) => {
      const [from, to] = s.levels;
      expect(from, `step ${i} ${s.place}`).toBeLessThanOrEqual(to);
      if (i > 0) expect(from, `step ${i} ${s.place}`).toBeGreaterThanOrEqual(ROUTE[i - 1].levels[0]);
      expect(from, `gap before step ${i} ${s.place}`).toBeLessThanOrEqual(reached + 1);
      reached = Math.max(reached, to);
    });
    expect(reached).toBe(MAX_LEVEL);
  });

  it("does each place close to its level range", () => {
    for (const s of ROUTE) {
      const { levels } = place(s.place);
      expect(s.levels[0], s.place).toBeGreaterThanOrEqual(levels[0] - EARLY_TOLERANCE);
      expect(s.levels[1], s.place).toBeLessThanOrEqual(levels[1]);
    }
  });

  it("does repeat visits to a place at increasing, non-overlapping levels", () => {
    const last = new Map<string, number>();
    for (const s of ROUTE) {
      const prevTo = last.get(s.place);
      if (prevTo !== undefined) expect(s.levels[0], s.place).toBeGreaterThanOrEqual(prevTo);
      last.set(s.place, s.levels[1]);
    }
  });

  it("returns to wide-ranging zones like the Barrens several times", () => {
    expect(ROUTE.filter((s) => s.place === "barrens").length).toBeGreaterThanOrEqual(3);
    expect(ROUTE.filter((s) => s.place === "stranglethorn").length).toBeGreaterThanOrEqual(3);
  });

  it("has something to do on every step", () => {
    for (const s of ROUTE) expect(s.focus.length, s.place).toBeGreaterThan(0);
  });
});

describe("buildRoute", () => {
  it.each(STARTING_ZONES)("starts in %s and skips the other starting zones", (start) => {
    const route = buildRoute(start);
    expect(route[0].place.id).toBe(start);
    expect(route[0].travel).toBeUndefined();
    for (const s of route.slice(1)) {
      expect(isStartingZone(s.place.id), s.id).toBe(false);
      expect(s.travel, s.id).toBeTruthy();
    }
    expect(route).toHaveLength(ROUTE.length + 1);
  });

  it("gives each step a unique id and numbers repeat visits", () => {
    const route = buildRoute("durotar");
    expect(new Set(route.map((s) => s.id)).size).toBe(route.length);
    const barrens = route.filter((s) => s.place.id === "barrens");
    expect(barrens.map((s) => s.id)).toEqual(barrens.map((_, i) => `barrens-${i + 1}`));
    expect(barrens.every((s) => s.visits === barrens.length)).toBe(true);
  });

  it("sends Undead to Kalimdor by zeppelin after Tirisfal", () => {
    expect(buildRoute("tirisfal")[1].travel).toBe("Zeppelin from Undercity to Orgrimmar, then head to The Barrens.");
  });
});

describe("travelBetween", () => {
  it("walks or flies within a continent", () => {
    expect(travelBetween(place("barrens"), place("ashenvale"))).toBe("Head to Ashenvale.");
    expect(travelBetween(place("silverpine"), place("shadowfang-keep"))).toBe("Head to Shadowfang Keep in Silverpine Forest.");
  });

  it("takes the zeppelin from Orgrimmar to Undercity for the northern Eastern Kingdoms", () => {
    expect(travelBetween(place("barrens"), place("silverpine"))).toMatch(/^Zeppelin from Orgrimmar to Undercity/);
  });

  it("uses the Grom'gol zeppelin to and from Stranglethorn", () => {
    expect(travelBetween(place("stranglethorn"), place("desolace"))).toMatch(/^Zeppelin from Grom'gol to Orgrimmar/);
    expect(travelBetween(place("sm-library"), place("stranglethorn"))).toMatch(/^Zeppelin from Undercity to Grom'gol/);
  });

  it("does not take a zeppelin between two zones far from either port", () => {
    expect(travelBetween(place("blackrock-depths"), place("western-plaguelands"))).toBe("Head to Western Plaguelands.");
  });
});

describe("stepForLevel", () => {
  const route = buildRoute("durotar");

  it("picks the first step that covers the level", () => {
    const i = stepForLevel(route, 27);
    expect(route[i].levels[0]).toBeLessThanOrEqual(27);
    expect(route[i].levels[1]).toBeGreaterThanOrEqual(27);
    expect(route.slice(0, i).some((s) => s.levels[0] <= 27 && 27 <= s.levels[1])).toBe(false);
  });

  it("skips steps already done", () => {
    const first = stepForLevel(route, 27);
    const next = stepForLevel(route, 27, new Set([route[first].id]));
    expect(next).toBeGreaterThan(first);
    expect(route[next].levels[0]).toBeLessThanOrEqual(27);
    expect(route[next].levels[1]).toBeGreaterThanOrEqual(27);
  });

  it("falls back to a covering step when every one is done", () => {
    const all = new Set(route.map((s) => s.id));
    expect(stepForLevel(route, 27, all)).toBe(stepForLevel(route, 27));
  });

  it("handles both ends of the level range", () => {
    expect(stepForLevel(route, 1)).toBe(0);
    expect(route[stepForLevel(route, 60)].levels[1]).toBe(60);
  });
});

describe("timelineRows", () => {
  const route = buildRoute("mulgore");
  const rows = timelineRows(route);

  it("has one row per place, zones before dungeons", () => {
    expect(new Set(rows.map((r) => r.place.id)).size).toBe(rows.length);
    const firstDungeon = rows.findIndex((r) => r.place.kind === "dungeon");
    expect(rows.slice(firstDungeon).every((r) => r.place.kind === "dungeon")).toBe(true);
    expect(rows.reduce((n, r) => n + r.steps.length, 0)).toBe(route.length);
  });

  it("collects every visit to a zone on its row", () => {
    const barrens = rows.find((r) => r.place.id === "barrens")!;
    expect(barrens.steps.map((i) => route[i].visit)).toEqual([1, 2, 3]);
  });
});

describe("levelBand", () => {
  it.each([
    [1, 0],
    [19, 0],
    [20, 1],
    [35, 2],
    [49, 3],
    [50, 4],
    [60, 4],
  ])("level %i is band %i", (level, band) => {
    expect(levelBand(level)).toBe(band);
  });
});
