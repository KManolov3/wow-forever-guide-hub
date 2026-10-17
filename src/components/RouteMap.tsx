import { type KeyboardEvent, type PointerEvent, useEffect, useRef, useState } from "react";
import { CONTEXT_ZONES, type Continent, LANDMARKS, type MapPoint, ZONES } from "../data/leveling";
import { CONTINENT_MAPS, MAP_HEIGHT, MAP_WIDTH, ZONE_SHAPES } from "../data/mapShapes";
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

const BAND_LABELS = ["1–19", "20–29", "30–39", "40–49", "50–60"];
const MAX_ZOOM = 5;
/** Zoom the map opens at, centred on the selected step. */
const START_ZOOM = 1.6;
/** Space left around a clicked zone's outline, as a multiple of its size. */
const ZONE_PADDING = 1.3;
/** Least zoom a clicked dungeon is shown at. */
const DUNGEON_ZOOM = 2.5;
/** Pointer movement, in screen pixels, after which a press counts as a drag rather than a click. */
const DRAG_THRESHOLD = 4;

interface View {
  x: number;
  y: number;
  width: number;
  height: number;
}

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
    const map = s.place.map;
    if (s.place.continent !== continent || !map) return;
    const key = s.place.kind === "zone" ? s.place.id : `d:${map.x},${map.y}`;
    const m = markers.get(key) ?? { key, places: [], steps: [], map, kind: s.place.kind };
    if (!m.places.some((p) => p.id === s.place.id)) m.places.push(s.place);
    m.steps.push(i);
    markers.set(key, m);
  });
  return [...markers.values()];
}

/** The next visit after the selected step, wrapping, so repeated clicks walk through every visit. */
const nextVisit = (steps: number[], selected: number) => steps.find((i) => i > selected) ?? steps[0];

const levelText = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);

/** The view that shows a continent whole in a viewport of the given aspect (height / width). */
function fitView(frame: View, aspect: number): View {
  const width = Math.max(frame.width, frame.height / aspect);
  const height = width * aspect;
  return { x: frame.x + (frame.width - width) / 2, y: frame.y + (frame.height - height) / 2, width, height };
}

/** Keeps a view between the whole-continent view and MAX_ZOOM, and on the map image where it fits. */
function clampView(v: View, fit: View, aspect: number): View {
  const width = Math.min(fit.width, Math.max(fit.width / MAX_ZOOM, v.width));
  const height = width * aspect;
  const axis = (pos: number, size: number, total: number, centre: number) =>
    size >= total ? centre - size / 2 : Math.min(total - size, Math.max(0, pos));
  return {
    x: axis(v.x, width, MAP_WIDTH, fit.x + fit.width / 2),
    y: axis(v.y, height, MAP_HEIGHT, fit.y + fit.height / 2),
    width,
    height,
  };
}

/** The view that frames a zone's outline with some room around it, as close as MAX_ZOOM allows. */
function zoneView(id: string, fit: View, aspect: number): View {
  const pts = ZONE_SHAPES[id].points.split(" ").map((p) => p.split(",").map(Number));
  const xs = pts.map(([x]) => x);
  const ys = pts.map(([, y]) => y);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const width = Math.max((x1 - x0) * ZONE_PADDING, ((y1 - y0) * ZONE_PADDING) / aspect);
  const height = width * aspect;
  return clampView({ x: (x0 + x1 - width) / 2, y: (y0 + y1 - height) / 2, width, height }, fit, aspect);
}

const centredOn = (p: MapPoint, zoom: number, fit: View, aspect: number) => {
  const width = fit.width / zoom;
  return clampView({ x: p.x - width / 2, y: p.y - (width * aspect) / 2, width, height: width * aspect }, fit, aspect);
};

const inView = (p: MapPoint, v: View) => p.x >= v.x && p.x <= v.x + v.width && p.y >= v.y && p.y <= v.y + v.height;

/** The in-game continent map with the route's zones outlined, its legs drawn, and pan and zoom. */
export function RouteMap({ route, selected, done, onSelect }: Props) {
  const current = route[selected];
  const [shown, setShown] = useState<Continent>(current.place.continent);
  const [followed, setFollowed] = useState(current.id);
  const [aspect, setAspect] = useState(1.2);
  const fit = fitView(CONTINENT_MAPS[shown].view, aspect);
  const initialView = (place: Place, a: number) => {
    const f = fitView(CONTINENT_MAPS[place.continent].view, a);
    return place.map ? centredOn(place.map, START_ZOOM, f, a) : f;
  };
  const [view, setView] = useState<View>(() => initialView(current.place, aspect));
  const [hover, setHover] = useState<{ marker: Marker; point: MapPoint } | null>(null);
  const svg = useRef<SVGSVGElement>(null);
  const drag = useRef<{ x: number; y: number; view: View; moved: boolean } | null>(null);

  const showContinent = (c: Continent) => {
    setShown(c);
    setView(fitView(CONTINENT_MAPS[c].view, aspect));
  };

  // Match the view's shape to the element's so the map fills the panel, keeping its centre and zoom.
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect;
      if (width > 0 && height > 0) setAspect(height / width);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);
  const [sizedFor, setSizedFor] = useState(aspect);
  if (sizedFor !== aspect) {
    setSizedFor(aspect);
    const centre = { x: view.x + view.width / 2, y: view.y + view.height / 2 };
    const zoomNow = fitView(CONTINENT_MAPS[shown].view, sizedFor).width / view.width;
    setView(centredOn(centre, zoomNow, fit, aspect));
  }

  // Follow the selected step to its continent and keep it in view; the tabs can still switch away from it.
  if (followed !== current.id) {
    setFollowed(current.id);
    const target = current.place.map;
    if (current.place.continent !== shown) {
      setShown(current.place.continent);
      setView(initialView(current.place, aspect));
    } else if (target && !inView(target, view)) {
      setView(clampView({ ...view, x: target.x - view.width / 2, y: target.y - view.height / 2 }, fit, aspect));
    }
  }

  const zoomBy = (factor: number, center: MapPoint = { x: view.x + view.width / 2, y: view.y + view.height / 2 }) => {
    const width = view.width * factor;
    const height = view.height * factor;
    setView(
      clampView(
        {
          x: center.x - ((center.x - view.x) * width) / view.width,
          y: center.y - ((center.y - view.y) * height) / view.height,
          width,
          height,
        },
        fit,
        aspect,
      ),
    );
  };

  /** Converts a pointer position to map coordinates. */
  const toMap = (clientX: number, clientY: number): MapPoint => {
    const rect = svg.current!.getBoundingClientRect();
    return {
      x: view.x + ((clientX - rect.left) / rect.width) * view.width,
      y: view.y + ((clientY - rect.top) / rect.height) * view.height,
    };
  };

  // Ctrl/⌘ + wheel (and trackpad pinch) zooms; a plain wheel keeps scrolling the page.
  const zoomAt = useRef({ zoomBy, toMap });
  useEffect(() => {
    zoomAt.current = { zoomBy, toMap };
  });
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const { zoomBy, toMap } = zoomAt.current;
      zoomBy(e.deltaY > 0 ? 1.15 : 1 / 1.15, toMap(e.clientX, e.clientY));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  const onPointerDown = (e: PointerEvent<SVGSVGElement>) => {
    if (e.button !== 0) return;
    drag.current = { x: e.clientX, y: e.clientY, view, moved: false };
  };
  const onPointerMove = (e: PointerEvent<SVGSVGElement>) => {
    const d = drag.current;
    if (!d) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.moved && Math.hypot(dx, dy) < DRAG_THRESHOLD) return;
    if (!d.moved) {
      d.moved = true;
      svg.current?.setPointerCapture(e.pointerId);
      setHover(null);
    }
    const rect = svg.current!.getBoundingClientRect();
    const scale = d.view.width / rect.width;
    setView(clampView({ ...d.view, x: d.view.x - dx * scale, y: d.view.y - dy * scale }, fit, aspect));
  };
  const onPointerUp = (e: PointerEvent<SVGSVGElement>) => {
    if (drag.current?.moved) svg.current?.releasePointerCapture(e.pointerId);
    // Keep the drag until the click that ends this press has been ignored.
    setTimeout(() => (drag.current = null));
  };

  /** Selects a zone or dungeon and brings it into focus: a zone fills the map, a dungeon is centred. */
  const activate = (m: Marker) => {
    if (drag.current?.moved) return;
    setView(
      m.kind === "zone"
        ? zoneView(m.places[0].id, fit, aspect)
        : centredOn(m.map, Math.max(zoom, DUNGEON_ZOOM), fit, aspect),
    );
    onSelect(m.steps.includes(selected) ? nextVisit(m.steps, selected) : m.steps[0]);
  };
  const onKey = (e: KeyboardEvent, m: Marker) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      activate(m);
    }
  };

  const markers = markersFor(route, shown);
  const zoneMarkers = markers.filter((m) => m.kind === "zone");
  const dungeonMarkers = markers.filter((m) => m.kind === "dungeon");
  const prev = route[selected - 1];
  const crossed = prev && prev.place.continent !== current.place.continent;
  const startId = route[0].place.id;
  const otherStarts = ZONES.filter(
    (z) => isStartingZone(z.id) && z.id !== startId && z.continent === shown && ZONE_SHAPES[z.id],
  );
  const zoom = fit.width / view.width;
  // Labels and markers shrink less than the map grows, so zooming in reveals more room around them.
  const k = 1 / Math.sqrt(zoom);

  const legs = route.slice(1).flatMap((s, i) => {
    const from = route[i].place;
    if (from.continent !== shown || s.place.continent !== shown || !from.map || !s.place.map) return [];
    return [{ from: from.map, to: s.place.map, index: i + 1 }];
  });

  const markerLabel = (m: Marker) =>
    m.places.length === 1
      ? `${m.places[0].name}, levels ${levelText(m.places[0].levels)}, ${m.steps.length} visit${m.steps.length === 1 ? "" : "s"}`
      : `${m.places.map((p) => p.name).join(", ")}: ${m.steps.length} visits`;

  const markerProps = (m: Marker) => ({
    role: "button",
    tabIndex: 0,
    "aria-label": markerLabel(m),
    "aria-pressed": m.steps.includes(selected),
    onClick: () => activate(m),
    onKeyDown: (e: KeyboardEvent) => onKey(e, m),
    onMouseEnter: () => !drag.current?.moved && setHover({ marker: m, point: m.map }),
    onMouseLeave: () => setHover(null),
    onFocus: () => setHover({ marker: m, point: m.map }),
    onBlur: () => setHover(null),
  });

  const stateClasses = (m: Marker) =>
    [
      m.steps.includes(selected) ? "current" : "",
      m.steps.every((i) => done.has(route[i].id)) ? "done" : "",
      m.places[0].isNew ? "new" : "",
    ].join(" ");

  const contextLabels = [
    ...CONTEXT_ZONES.filter((z) => z.continent === shown),
    ...otherStarts.map((z) => ({ name: z.name, map: ZONE_SHAPES[z.id].anchor })),
  ];

  return (
    <div className="route-map">
      <div className="map-toolbar">
        <div className="map-tabs" role="group" aria-label="Continent">
          {CONTINENTS.map((c) => (
            <button key={c.id} aria-pressed={shown === c.id} onClick={() => showContinent(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <div className="map-zoom" role="group" aria-label="Zoom">
          <button onClick={() => zoomBy(1 / 1.5)} disabled={zoom >= MAX_ZOOM - 0.01} aria-label="Zoom in">
            +
          </button>
          <button onClick={() => zoomBy(1.5)} disabled={zoom <= 1.01} aria-label="Zoom out">
            −
          </button>
          <button onClick={() => setView(fit)} disabled={zoom <= 1.01} aria-label="Show the whole continent">
            ⤢
          </button>
        </div>
      </div>

      <div className="map-frame">
        <svg
          ref={svg}
          viewBox={`${view.x} ${view.y} ${view.width} ${view.height}`}
          role="group"
          aria-label={`Route map of ${CONTINENTS.find((c) => c.id === shown)!.name}`}
          className={zoom > 1.01 ? "zoomed" : ""}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onDoubleClick={(e) => zoomBy(1 / 1.5, toMap(e.clientX, e.clientY))}
        >
          <defs>
            <marker id="leg-arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto">
              <path d="M0,0 L10,5 L0,10 z" fill="var(--gold)" />
            </marker>
          </defs>

          <image
            href={`${import.meta.env.BASE_URL}${CONTINENT_MAPS[shown].image}`}
            x={0}
            y={0}
            width={MAP_WIDTH}
            height={MAP_HEIGHT}
            className="map-image"
          />

          {otherStarts.map((z) => (
            <polygon key={z.id} className="zone-shape other-start" points={ZONE_SHAPES[z.id].points} />
          ))}

          {zoneMarkers.map((m) => (
            <polygon
              key={m.key}
              {...markerProps(m)}
              className={`zone-shape band-${levelBand(m.places[0].levels[0])} ${stateClasses(m)}`}
              points={ZONE_SHAPES[m.places[0].id].points}
            />
          ))}

          {legs.map((l) => (
            <line
              key={l.index}
              className={`map-leg ${l.index === selected ? "active" : ""}`}
              x1={l.from.x}
              y1={l.from.y}
              x2={l.to.x}
              y2={l.to.y}
              strokeWidth={(l.index === selected ? 1.8 : 0.9) * k}
              markerEnd={l.index === selected ? "url(#leg-arrow)" : undefined}
            />
          ))}

          {LANDMARKS.filter((c) => c.continent === shown).map((c) => (
            <g key={c.name} className={`map-landmark ${c.kind}`} aria-hidden="true">
              <rect x={c.map.x - 2.2 * k} y={c.map.y - 2.2 * k} width={4.4 * k} height={4.4 * k} />
              <text x={c.map.x + 4.5 * k} y={c.map.y + 2.6 * k} fontSize={7.5 * k}>
                {c.name}
              </text>
            </g>
          ))}

          {contextLabels.map((z) => (
            <text key={z.name} className="map-context" x={z.map.x} y={z.map.y} fontSize={8 * k} aria-hidden="true">
              {z.name}
            </text>
          ))}

          {zoneMarkers.map((m) => (
            <g key={m.key} className={`zone-label ${stateClasses(m)}`} aria-hidden="true">
              <text x={m.map.x} y={m.map.y} fontSize={9.5 * k}>
                {m.places[0].name}
              </text>
              <text className="zone-label-levels" x={m.map.x} y={m.map.y + 9 * k} fontSize={7.5 * k}>
                {levelText(m.places[0].levels)}
                {m.steps.length > 1 && ` · ×${m.steps.length}`}
              </text>
            </g>
          ))}

          {dungeonMarkers.map((m) => {
            const r = 4 * k;
            return (
              <g key={m.key} {...markerProps(m)} className={`map-marker dungeon ${stateClasses(m)}`}>
                <circle className="hit" cx={m.map.x} cy={m.map.y} r={r * 2.2} />
                <rect
                  className="dungeon-dot"
                  x={m.map.x - r}
                  y={m.map.y - r}
                  width={r * 2}
                  height={r * 2}
                  strokeWidth={1.2 * k}
                  transform={`rotate(45 ${m.map.x} ${m.map.y})`}
                />
              </g>
            );
          })}
        </svg>

        {route[0].place.zone.offMap && (
          <p className="map-note">{route[0].place.name} floats in the skies of Skywall and is not on these maps.</p>
        )}

        {hover && inView(hover.point, view) && (
          <div
            className="viz-tooltip"
            role="tooltip"
            style={{
              left: `${((hover.point.x - view.x) / view.width) * 100}%`,
              top: `${((hover.point.y - view.y) / view.height) * 100}%`,
            }}
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
        <strong>Step {selected + 1}:</strong> {current.travel ? current.travel : `Start in ${current.place.name}.`}
        {crossed && " This step crosses to the other continent."}
      </p>
      <p className="map-hint">Drag to pan · double-click or Ctrl/⌘ + scroll to zoom · click a zone to step through its visits</p>

      <ul className="map-legend" aria-label="Map legend">
        {BAND_LABELS.map((label, i) => (
          <li key={label}>
            <svg width="14" height="14" aria-hidden="true">
              <rect className={`zone-swatch band-${i}`} x="1" y="1" width="12" height="12" rx="2" />
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
      </ul>
      <p className="map-credit">
        Map: World of Warcraft: Forever in-game world map, © Blizzard Entertainment, via{" "}
        <a href="https://warcraft.wiki.gg/wiki/Forever_map_comparison" target="_blank" rel="noreferrer">
          warcraft.wiki.gg
        </a>
        .
      </p>
    </div>
  );
}
