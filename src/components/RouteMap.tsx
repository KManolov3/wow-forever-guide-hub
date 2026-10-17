import { type KeyboardEvent, useState } from "react";
import { CONTEXT_ZONES, type Continent, type MapPoint, ZONES } from "../data/leveling";
import { type GuideStep, type Place, isStartingZone, levelBand } from "../lib/leveling";

interface Props {
  route: GuideStep[];
  selected: number;
  done: ReadonlySet<string>;
  onSelect: (index: number) => void;
}

const CONTINENTS: { id: Continent; name: string }[] = [
  { id: "kalimdor", name: "Kalimdor" },
  { id: "eastern-kingdoms", name: "Eastern Kingdoms" },
];

/** Cities and ports; `left` puts the label on the marker's left. */
const CITIES: { name: string; continent: Continent; map: MapPoint; left?: boolean }[] = [
  { name: "Orgrimmar", continent: "kalimdor", map: { x: 80, y: 33 }, left: true },
  { name: "Thunder Bluff", continent: "kalimdor", map: { x: 38, y: 49 }, left: true },
  { name: "Ratchet", continent: "kalimdor", map: { x: 80, y: 57 } },
  { name: "Undercity", continent: "eastern-kingdoms", map: { x: 24, y: 15 }, left: true },
  { name: "Grom'gol", continent: "eastern-kingdoms", map: { x: 14, y: 90 }, left: true },
  { name: "Booty Bay", continent: "eastern-kingdoms", map: { x: 34, y: 101 } },
];

const BAND_LABELS = ["1–19", "20–29", "30–39", "40–49", "50–60"];

const W = 440;
const H = 520;
const toX = (x: number) => 30 + x * 3.8;
const toY = (y: number) => 28 + y * 4.5;

interface Marker {
  key: string;
  places: Place[];
  /** Route indexes of every visit to the places at this marker. */
  steps: number[];
  map: MapPoint;
  kind: "zone" | "dungeon";
}

function markersFor(route: GuideStep[], continent: Continent): Marker[] {
  const markers = new Map<string, Marker>();
  route.forEach((s, i) => {
    if (s.place.continent !== continent || s.place.zone.offMap) return;
    const key = s.place.kind === "zone" ? s.place.id : `d:${s.place.map.x},${s.place.map.y}`;
    const m = markers.get(key) ?? { key, places: [], steps: [], map: s.place.map, kind: s.place.kind };
    if (!m.places.some((p) => p.id === s.place.id)) m.places.push(s.place);
    m.steps.push(i);
    markers.set(key, m);
  });
  // Zones first so dungeon diamonds draw on top of them.
  return [...markers.values()].sort((a, b) => (a.kind === b.kind ? 0 : a.kind === "zone" ? -1 : 1));
}

/** The next visit after the selected step, wrapping, so repeated clicks walk through every visit. */
function nextVisit(steps: number[], selected: number) {
  return steps.find((i) => i > selected) ?? steps[0];
}

const levelText = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);

/** Schematic map of one continent at a time, with the route's legs and a marker per zone and dungeon. */
export function RouteMap({ route, selected, done, onSelect }: Props) {
  const current = route[selected];
  const [shown, setShown] = useState<Continent>(current.place.continent);
  const [followed, setFollowed] = useState(current.id);
  const [hover, setHover] = useState<{ marker: Marker; x: number; y: number } | null>(null);

  // Follow the selected step to its continent; the tabs can still switch away from it.
  if (followed !== current.id) {
    setFollowed(current.id);
    setShown(current.place.continent);
  }

  const markers = markersFor(route, shown);
  const prev = route[selected - 1];
  const crossed = prev && prev.place.continent !== current.place.continent;
  const startId = route[0].place.id;
  const otherStarts = ZONES.filter((z) => isStartingZone(z.id) && z.id !== startId && z.continent === shown && !z.offMap);

  const legs = route.slice(1).flatMap((s, i) => {
    const from = route[i];
    if (from.place.continent !== shown || s.place.continent !== shown || from.place.zone.offMap) return [];
    return [{ from: from.place.map, to: s.place.map, index: i + 1 }];
  });

  const activate = (m: Marker) => onSelect(m.steps.includes(selected) ? nextVisit(m.steps, selected) : m.steps[0]);
  const onKey = (e: KeyboardEvent, m: Marker) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(m);
    }
  };

  const markerLabel = (m: Marker) =>
    m.places.length === 1
      ? `${m.places[0].name}, levels ${levelText(m.places[0].levels)}, ${m.steps.length} visit${m.steps.length === 1 ? "" : "s"}`
      : `${m.places.map((p) => p.name).join(", ")}: ${m.steps.length} visits`;

  return (
    <div className="route-map">
      <div className="map-tabs" role="group" aria-label="Continent">
        {CONTINENTS.map((c) => (
          <button key={c.id} aria-pressed={shown === c.id} onClick={() => setShown(c.id)}>
            {c.name}
          </button>
        ))}
      </div>

      <div className="map-frame">
        <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Route map of ${CONTINENTS.find((c) => c.id === shown)!.name}`}>
          <defs>
            <marker id="leg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--gold)" />
            </marker>
          </defs>

          {CONTEXT_ZONES.filter((z) => z.continent === shown).map((z) => (
            <g key={z.name} className="map-context">
              <circle cx={toX(z.map.x)} cy={toY(z.map.y)} r={9} />
              <text x={toX(z.map.x)} y={toY(z.map.y) + 20}>
                {z.name}
              </text>
            </g>
          ))}
          {otherStarts.map((z) => (
            <g key={z.id} className="map-context">
              <circle cx={toX(z.map.x)} cy={toY(z.map.y)} r={9} />
              <text x={toX(z.map.x)} y={toY(z.map.y) + 20}>
                {z.name}
              </text>
            </g>
          ))}

          {legs.map((l) => (
            <line
              key={l.index}
              className={`map-leg ${l.index === selected ? "active" : ""}`}
              x1={toX(l.from.x)}
              y1={toY(l.from.y)}
              x2={toX(l.to.x)}
              y2={toY(l.to.y)}
              markerEnd={l.index === selected ? "url(#leg-arrow)" : undefined}
            />
          ))}

          {CITIES.filter((c) => c.continent === shown).map((c) => (
            <g key={c.name} className="map-city">
              <rect x={toX(c.map.x) - 4} y={toY(c.map.y) - 4} width={8} height={8} />
              <text x={toX(c.map.x) + (c.left ? -8 : 8)} y={toY(c.map.y) + 4} textAnchor={c.left ? "end" : "start"}>
                {c.name}
              </text>
            </g>
          ))}

          {markers.map((m) => {
            const x = toX(m.map.x);
            const y = toY(m.map.y);
            const isCurrent = m.steps.includes(selected);
            const allDone = m.steps.every((i) => done.has(route[i].id));
            const place = m.places[0];
            const classes = ["map-marker", m.kind, isCurrent ? "current" : "", allDone ? "done" : "", place.isNew ? "new" : ""];
            return (
              <g
                key={m.key}
                className={classes.join(" ")}
                role="button"
                tabIndex={0}
                aria-label={markerLabel(m)}
                aria-pressed={isCurrent}
                onClick={() => activate(m)}
                onKeyDown={(e) => onKey(e, m)}
                onMouseEnter={() => setHover({ marker: m, x, y })}
                onMouseLeave={() => setHover(null)}
                onFocus={() => setHover({ marker: m, x, y })}
                onBlur={() => setHover(null)}
              >
                {m.kind === "zone" ? (
                  <>
                    <circle className="hit" cx={x} cy={y} r={22} />
                    <circle className={`zone-dot band-${levelBand(place.levels[0])}`} cx={x} cy={y} r={11} />
                    <text className="zone-name" x={x} y={y + 24}>
                      {place.name}
                    </text>
                    {m.steps.length > 1 && (
                      <text className="zone-visits" x={x + 10} y={y - 8}>
                        ×{m.steps.length}
                      </text>
                    )}
                  </>
                ) : (
                  <>
                    <rect className="hit" x={x - 13} y={y - 13} width={26} height={26} />
                    <rect className="dungeon-dot" x={x - 6} y={y - 6} width={12} height={12} transform={`rotate(45 ${x} ${y})`} />
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {route[0].place.zone.offMap && (
          <p className="map-note">{route[0].place.name} floats in the skies of Skywall and is not on this map.</p>
        )}

        {hover && (
          <div
            className="viz-tooltip"
            role="tooltip"
            style={{ left: `${(hover.x / W) * 100}%`, top: `${(hover.y / H) * 100}%` }}
          >
            {hover.marker.places.map((p) => (
              <div key={p.id}>
                <strong>{p.name}</strong> · {levelText(p.levels)}
                {p.isNew && <span className="new-badge inline">NEW</span>}
                <div className="viz-tooltip-sub">
                  {p.kind === "dungeon" ? `Dungeon in ${p.zone.name}` : p.zone.hubs.join(", ") || "Quest hubs not announced"}
                </div>
              </div>
            ))}
            <div className="viz-tooltip-sub">
              Visits: {hover.marker.steps.map((i) => `step ${i + 1} (${levelText(route[i].levels)})`).join(", ")}
            </div>
          </div>
        )}
      </div>

      <p className="map-caption" aria-live="polite">
        <strong>Step {selected + 1}:</strong>{" "}
        {current.travel ? current.travel : `Start in ${current.place.name}.`}
        {crossed && " This step crosses to the other continent."}
      </p>

      <ul className="map-legend" aria-label="Map legend">
        {BAND_LABELS.map((label, i) => (
          <li key={label}>
            <svg width="14" height="14" aria-hidden="true">
              <circle className={`zone-dot band-${i}`} cx="7" cy="7" r="6" />
            </svg>
            Zone {label}
          </li>
        ))}
        <li>
          <svg width="14" height="14" aria-hidden="true">
            <rect className="dungeon-dot" x="3" y="3" width="8" height="8" transform="rotate(45 7 7)" />
          </svg>
          Dungeon
        </li>
        <li>
          <svg width="14" height="14" aria-hidden="true">
            <rect className="city-dot" x="3" y="3" width="8" height="8" />
          </svg>
          City or port
        </li>
        <li>×N visits</li>
      </ul>
    </div>
  );
}
