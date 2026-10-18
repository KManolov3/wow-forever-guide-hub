import { describe, expect, it } from "vitest";
import { CONTEXT_ZONES, DUNGEONS, LANDMARKS, type MapPoint, ROUTE, STARTING_ZONES, ZONES } from "../data/leveling";
import { MAP_HEIGHT, MAP_WIDTH, ZONE_SHAPES } from "../data/mapShapes";
import { ZONE_HUBS } from "../data/hubs";
import { existsSync } from "node:fs";
import {
  MAX_LEVEL,
  buildRoute,
  findPlace,
  hubNames,
  hubSteps,
  hubsForStep,
  isStartingZone,
  levelBand,
  stepForLevel,
  timelineRows,
  travelBetween,
  zoneHasHub,
  zoneSteps,
} from "./leveling";

const place = (id: string) => findPlace(id)!;
const polygon = (id: string) => ZONE_SHAPES[id].points.split(" ").map((p) => p.split(",").map(Number) as [number, number]);

/** Distance from a point to a polygon's outline; 0 inside it. */
function distanceToZone(p: MapPoint, id: string) {
  const pts = polygon(id);
  let inside = false;
  let best = Infinity;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi) inside = !inside;
    const dx = xj - xi;
    const dy = yj - yi;
    const t = Math.max(0, Math.min(1, ((p.x - xi) * dx + (p.y - yi) * dy) / (dx * dx + dy * dy || 1)));
    best = Math.min(best, Math.hypot(p.x - (xi + t * dx), p.y - (yi + t * dy)));
  }
  return inside ? 0 : best;
}

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

  it("has a map outline for every zone with Horde quests that is on the maps", () => {
    for (const z of ZONES.filter((z) => !z.offMap && !z.noHordeQuests)) {
      expect(ZONE_SHAPES[z.id], z.id).toBeDefined();
      expect(polygon(z.id).length, z.id).toBeGreaterThanOrEqual(3);
      expect(distanceToZone(ZONE_SHAPES[z.id].anchor, z.id), `${z.id} anchor`).toBe(0);
    }
  });

  it("keeps every map point on the map image", () => {
    const points = [
      ...Object.keys(ZONE_SHAPES).flatMap(polygon),
      ...DUNGEONS.map((d) => [d.map.x, d.map.y]),
      ...CONTEXT_ZONES.map((z) => [z.map.x, z.map.y]),
      ...LANDMARKS.map((l) => [l.map.x, l.map.y]),
    ];
    for (const [x, y] of points) {
      expect(x).toBeGreaterThanOrEqual(0);
      expect(x).toBeLessThanOrEqual(MAP_WIDTH);
      expect(y).toBeGreaterThanOrEqual(0);
      expect(y).toBeLessThanOrEqual(MAP_HEIGHT);
    }
  });

  it("puts each dungeon entrance in its zone or on an island just off its coast", () => {
    for (const d of DUNGEONS.filter((d) => ZONE_SHAPES[d.zone])) {
      expect(distanceToZone(d.map, d.zone), d.id).toBeLessThanOrEqual(20);
    }
  });

  it("does not let neighbouring zone outlines overlap", () => {
    const inside = (pts: [number, number][], x: number, y: number) => {
      let hit = false;
      for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
        const [xi, yi] = pts[i];
        const [xj, yj] = pts[j];
        if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
      }
      return hit;
    };
    const shapes = ZONES.filter((z) => ZONE_SHAPES[z.id]).map((z) => {
      const pts = polygon(z.id);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return { z, pts, box: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)] };
    });
    const overlaps: string[] = [];
    for (let i = 0; i < shapes.length; i++) {
      for (let j = i + 1; j < shapes.length; j++) {
        const a = shapes[i];
        const b = shapes[j];
        if (a.z.continent !== b.z.continent) continue;
        let shared = 0;
        // Count whole map pixels inside both outlines; a few are allowed for rounding along shared borders.
        for (let x = Math.ceil(Math.max(a.box[0], b.box[0])); x <= Math.min(a.box[2], b.box[2]); x++) {
          for (let y = Math.ceil(Math.max(a.box[1], b.box[1])); y <= Math.min(a.box[3], b.box[3]); y++) {
            if (inside(a.pts, x + 0.5, y + 0.5) && inside(b.pts, x + 0.5, y + 0.5)) shared++;
          }
        }
        if (shared > 6) overlaps.push(`${a.z.id} / ${b.z.id}: ${shared} px`);
      }
    }
    expect(overlaps).toEqual([]);
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
    for (const z of ZONES.filter((z) => !isStartingZone(z.id) && !z.noHordeQuests)) expect(visited.has(z.id), z.id).toBe(true);
    for (const d of DUNGEONS) expect(visited.has(d.id), d.id).toBe(true);
  });

  it("leaves out dungeons that are hard for the Horde to reach", () => {
    const names = ROUTE.map((s) => place(s.place).name);
    for (const name of ["The Deadmines", "The Stockade", "Gnomeregan", "Hall of Thanes"]) {
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

  it("sends Skyborne off Zephras Isle by airship", () => {
    expect(buildRoute("zephras-isle")[1].travel).toMatch(/^Airship from Zephras Isle to Skywatcher Plateau/);
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

  it("takes the Powderfuse Port ship from Riverglades to Tanaris", () => {
    expect(travelBetween(place("krol-dok"), place("tanaris"))).toBe(
      "Boat from Powderfuse Port to Steamwheedle Port, then head to Tanaris.",
    );
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

describe("zone maps and hubs", () => {
  it("has a zone map image and a hub list for every zone", () => {
    for (const z of ZONES) {
      expect(existsSync(`public/maps/zones/${z.id}.webp`), z.id).toBe(true);
      expect(ZONE_HUBS[z.id], z.id).toBeDefined();
    }
  });

  it("puts every pinned hub on the map", () => {
    for (const [zone, hubs] of Object.entries(ZONE_HUBS)) {
      for (const h of hubs) {
        if (h.elsewhere) continue;
        expect(h.x, `${zone}: ${h.name}`).toBeGreaterThanOrEqual(0);
        expect(h.x, `${zone}: ${h.name}`).toBeLessThanOrEqual(100);
        expect(h.y, `${zone}: ${h.name}`).toBeGreaterThanOrEqual(0);
        expect(h.y, `${zone}: ${h.name}`).toBeLessThanOrEqual(100);
      }
    }
  });

  it("knows every hub a zone lists", () => {
    for (const z of ZONES) for (const name of z.hubs) expect(zoneHasHub(z.id, name), `${z.id}: ${name}`).toBe(true);
  });

  it.each(STARTING_ZONES)("knows every hub a zone step names, starting in %s", (start) => {
    for (const s of buildRoute(start).filter((s) => s.place.kind === "zone")) {
      for (const name of hubNames(s.hub)) expect(zoneHasHub(s.place.id, name), `${s.id}: ${name}`).toBe(true);
    }
  });

  it("marks the hubs a step names", () => {
    const route = buildRoute("durotar");
    const barrens2 = route.find((s) => s.id === "barrens-2")!;
    const { hubs, elsewhere } = hubsForStep(barrens2);
    expect(hubs.filter((h) => h.active).map((h) => h.name)).toEqual(["The Crossroads", "Ratchet"]);
    expect(elsewhere).toEqual([]);
  });

  it("shows a dungeon on its entrance zone's map and lists hubs from other zones", () => {
    const route = buildRoute("durotar");
    const rfc = hubsForStep(route.find((s) => s.place.id === "ragefire-chasm")!);
    expect(rfc.zone.id).toBe("durotar");
    expect(rfc.hubs.filter((h) => h.active).map((h) => h.name)).toEqual(["Orgrimmar"]);

    const excavation = hubsForStep(route.find((s) => s.place.id === "excavation-site")!);
    expect(excavation.zone.id).toBe("wetlands");
    expect(excavation.elsewhere).toEqual(["Hammerfall", "Orgrimmar", "Thunder Bluff"]);
  });
});

describe("zone trips", () => {
  const route = buildRoute("durotar");
  const ids = (steps: number[]) => steps.map((i) => route[i].id);

  it("lists a zone's visits and the dungeons entered from it, in route order", () => {
    expect(ids(zoneSteps(route, "barrens"))).toEqual(
      route.filter((s) => s.place.zone.id === "barrens").map((s) => s.id),
    );
    expect(ids(zoneSteps(route, "barrens"))).toEqual(expect.arrayContaining(["barrens-1", "barrens-2", "barrens-3"]));
    expect(ids(zoneSteps(route, "durotar"))).toEqual(expect.arrayContaining(["durotar-1", "ragefire-chasm-1"]));
  });

  it("maps each hub to the steps that use it", () => {
    const byHub = hubSteps(route, "barrens");
    expect([...byHub.keys()]).toEqual(["The Crossroads", "Ratchet", "Camp Taurajo"]);
    expect(ids(byHub.get("The Crossroads")!)).toContain("barrens-1");
    expect(ids(byHub.get("Ratchet")!)).toContain("barrens-2");
    expect(ids(byHub.get("Camp Taurajo")!)).toContain("barrens-3");
    for (const steps of byHub.values()) expect(steps).toEqual([...steps].sort((a, b) => a - b));
  });

  it("gives a zone without hubs an empty map", () => {
    expect(hubSteps(route, "wetlands").size).toBe(0);
  });
});
