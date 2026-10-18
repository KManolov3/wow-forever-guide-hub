import {
  type Continent,
  DUNGEONS,
  type MapPoint,
  PORT_NAMES,
  PORT_ZONES,
  type Port,
  ROUTE,
  STARTING_FOCUS,
  TRANSPORTS,
  type StartingZoneId,
  type Zone,
  ZONES,
} from "../data/leveling";
import { type Hub, ZONE_HUBS } from "../data/hubs";
import { ZONE_SHAPES } from "../data/mapShapes";

/** A zone or dungeon, resolved to what the guide needs to show and draw it. */
export interface Place {
  id: string;
  name: string;
  kind: "zone" | "dungeon";
  /** The zone itself, or the zone a dungeon's entrance is in. */
  zone: Zone;
  continent: Continent;
  /** Marker position on the continent map image; absent when the place is not drawn there. */
  map?: MapPoint;
  levels: [number, number];
  isNew: boolean;
  unconfirmed?: string;
}

export interface GuideStep {
  /** Stable id, e.g. "barrens-2" for the second visit to the Barrens. */
  id: string;
  place: Place;
  levels: [number, number];
  /** Quest hub; absent when not announced. */
  hub?: string;
  focus: string[];
  /** 1-based visit number of this place, and how many visits the route makes in total. */
  visit: number;
  visits: number;
  /** How to get here from the previous step; absent for the first step. */
  travel?: string;
}

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 60;

const zoneById = new Map(ZONES.map((z) => [z.id, z]));

export function findPlace(id: string): Place | undefined {
  const zone = zoneById.get(id);
  if (zone) {
    return {
      id,
      name: zone.name,
      kind: "zone",
      zone,
      continent: zone.continent,
      map: zone.offMap ? undefined : ZONE_SHAPES[id]?.anchor,
      levels: zone.levels,
      isNew: !!zone.isNew,
      unconfirmed: zone.unconfirmed,
    };
  }
  const dungeon = DUNGEONS.find((d) => d.id === id);
  const entrance = dungeon && zoneById.get(dungeon.zone);
  if (!dungeon || !entrance) return undefined;
  return {
    id,
    name: dungeon.name,
    kind: "dungeon",
    zone: entrance,
    continent: entrance.continent,
    map: dungeon.map,
    levels: dungeon.levels,
    isNew: !!dungeon.isNew,
    unconfirmed: dungeon.unconfirmed,
  };
}

function place(id: string): Place {
  const found = findPlace(id);
  if (!found) throw new Error(`Unknown zone or dungeon "${id}"`);
  return found;
}

const portContinent = (port: Port): Continent => zoneById.get(PORT_ZONES[port])!.continent;

export { isStartingZone } from "../data/startingZones";

/**
 * How to get from one place to the next. Crossing to the other continent prefers the line linking both
 * places' nearest ports, then the zeppelin arriving nearest the destination, then the one leaving nearest the
 * starting point; the boat is only worth it when both places are near its docks. On the same continent, a zeppelin is taken only when it links the two places' ports and one of
 * the places is in a port's own zone; otherwise the flight paths are quicker.
 */
export function travelBetween(from: Place, to: Place): string {
  const destination = to.kind === "dungeon" ? `${to.name} in ${to.zone.name}` : to.name;

  const leaving = from.zone.port;
  const arriving = to.zone.port;
  const lines = TRANSPORTS.flatMap((t) => [t, { ...t, from: t.to, to: t.from }]);

  let line: (typeof lines)[number] | undefined;
  if (from.continent === to.continent) {
    const nearPort = from.zone.id === PORT_ZONES[leaving] || to.zone.id === PORT_ZONES[arriving];
    line = nearPort ? lines.find((l) => l.from === leaving && l.to === arriving) : undefined;
  } else {
    const crossing = lines.filter(
      (l) =>
        portContinent(l.from) === from.continent &&
        portContinent(l.to) === to.continent &&
        (l.by === "zeppelin" || (l.from === leaving && l.to === arriving)),
    );
    line =
      crossing.find((l) => l.from === leaving && l.to === arriving) ??
      crossing.find((l) => l.to === arriving) ??
      crossing.find((l) => l.from === leaving) ??
      crossing[0];
  }

  if (!line) return `Head to ${destination}.`;
  const by = line.by === "boat" ? "Boat" : "Zeppelin";
  return `${by} from ${PORT_NAMES[line.from]} to ${PORT_NAMES[line.to]}, then head to ${destination}.`;
}

/** The full route for a starting zone: the starting zone itself, then the shared Horde route. */
export function buildRoute(start: StartingZoneId): GuideStep[] {
  const startZone = place(start);
  const steps = [
    {
      place: startZone,
      levels: startZone.levels,
      hub: startZone.zone.hubs.join(", ") || undefined,
      focus: STARTING_FOCUS[start],
    },
    ...ROUTE.map((s) => ({ ...s, place: place(s.place) })),
  ];

  const totals = new Map<string, number>();
  for (const s of steps) totals.set(s.place.id, (totals.get(s.place.id) ?? 0) + 1);

  const seen = new Map<string, number>();
  return steps.map((s, i) => {
    const visit = (seen.get(s.place.id) ?? 0) + 1;
    seen.set(s.place.id, visit);
    const prev = steps[i - 1];
    return {
      id: `${s.place.id}-${visit}`,
      place: s.place,
      levels: s.levels,
      hub: s.hub,
      focus: s.focus,
      visit,
      visits: totals.get(s.place.id)!,
      travel: !prev ? undefined : i === 1 && prev.place.zone.exit ? prev.place.zone.exit : travelBetween(prev.place, s.place),
    };
  });
}

/**
 * Index of the step to do at a character level: the first step not yet done whose range contains the level,
 * else the first step that starts above it, else the last step.
 */
export function stepForLevel(route: GuideStep[], level: number, done: ReadonlySet<string> = new Set()): number {
  const fits = (s: GuideStep) => s.levels[0] <= level && level <= s.levels[1];
  const open = route.findIndex((s) => fits(s) && !done.has(s.id));
  if (open >= 0) return open;
  const any = route.findIndex(fits);
  if (any >= 0) return any;
  const next = route.findIndex((s) => s.levels[0] > level);
  return next >= 0 ? next : route.length - 1;
}

export interface TimelineRow {
  place: Place;
  /** Indexes into the route of every visit to this place. */
  steps: number[];
}

/** One row per place, in the order the route first visits it; zones first, then dungeons. */
export function timelineRows(route: GuideStep[]): TimelineRow[] {
  const rows = new Map<string, TimelineRow>();
  route.forEach((s, i) => {
    const row = rows.get(s.place.id) ?? { place: s.place, steps: [] };
    row.steps.push(i);
    rows.set(s.place.id, row);
  });
  const all = [...rows.values()];
  return [...all.filter((r) => r.place.kind === "zone"), ...all.filter((r) => r.place.kind === "dungeon")];
}

/** Level band 0-4 used to colour zones on the map: 1-19, 20-29, 30-39, 40-49, 50-60. */
export const levelBand = (level: number) => Math.min(4, Math.max(0, Math.floor(level / 10) - 1));

/** A hub's name without a trailing note, e.g. "Powderfuse Port (neutral)" → "Powderfuse Port". */
const hubKey = (name: string) => name.replace(/\s*\(.*\)$/, "").trim().toLowerCase();

/** Splits a step's or zone's hub text ("The Crossroads, Ratchet") into hub names. */
export const hubNames = (text: string | undefined) => (text ? text.split(",").map((n) => n.trim()).filter(Boolean) : []);

export interface StepHubs {
  /** The zone whose map shows the step: the zone itself, or a dungeon's entrance zone. */
  zone: Zone;
  /** Every hub on that zone's map, with the ones the step names marked. */
  hubs: (Hub & { active: boolean })[];
  /** Hubs the step names that are not on that zone's map, such as a city that hands out dungeon quests. */
  elsewhere: string[];
}

/** The hubs to show on a step's zone map, with the step's own hubs marked. */
export function hubsForStep(step: GuideStep): StepHubs {
  const zone = step.place.zone;
  const named = hubNames(step.hub);
  const keys = new Set(named.map(hubKey));
  const hubs = (ZONE_HUBS[zone.id] ?? []).map((h) => ({ ...h, active: keys.has(hubKey(h.name)) }));
  const known = new Set(hubs.map((h) => hubKey(h.name)));
  return { zone, hubs, elsewhere: named.filter((n) => !known.has(hubKey(n))) };
}

/** Whether a hub name appears in a zone's hub list. */
export const zoneHasHub = (zoneId: string, name: string) =>
  (ZONE_HUBS[zoneId] ?? []).some((h) => hubKey(h.name) === hubKey(name));

/** Route indexes of the steps shown on a zone's map: visits to the zone and to dungeons whose entrance is there. */
export const zoneSteps = (route: GuideStep[], zoneId: string) =>
  route.flatMap((s, i) => (s.place.zone.id === zoneId ? [i] : []));

/** For each hub on a zone's map, keyed by its name, the route indexes of the zone's steps that use it. */
export function hubSteps(route: GuideStep[], zoneId: string): Map<string, number[]> {
  const result = new Map((ZONE_HUBS[zoneId] ?? []).map((h) => [h.name, [] as number[]]));
  for (const i of zoneSteps(route, zoneId)) {
    for (const h of hubsForStep(route[i]).hubs) if (h.active) result.get(h.name)!.push(i);
  }
  return result;
}
