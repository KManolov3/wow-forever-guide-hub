import { useEffect, useRef, useState } from "react";
import { CHANGED_ZONE_MAPS, ZONE_HUBS } from "../data/hubs";
import { ZONES } from "../data/leveling";
import { type GuideStep, hubNames, hubSteps, hubsForStep, zoneSteps } from "../lib/leveling";

interface Props {
  /** Zone to show, or null when the dialog is closed. */
  zoneId: string | null;
  route: GuideStep[];
  selected: number;
  done: ReadonlySet<string>;
  onSelect: (index: number) => void;
  onToggleDone: (id: string) => void;
  /** Switches the dialog to another zone, e.g. when stepping along the route into the next zone. */
  onOpenZone: (zoneId: string) => void;
  onClose: () => void;
}

const levelText = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);

/** How a trip is named in the dialog: a dungeon by its name, a zone visit by its number. */
const tripName = (step: GuideStep) =>
  step.place.kind === "dungeon" ? step.place.name : step.visits > 1 ? `Visit ${step.visit} of ${step.visits}` : "Only visit";

/**
 * Modal map of one zone. The route's trips to the zone (its visits and the dungeons entered from it) are listed
 * beside the map; choosing one highlights its hubs and shows its directions and objectives without leaving the
 * dialog. Previous and next buttons walk the route, switching to another zone's map when the route does.
 */
export function ZoneMapDialog({ zoneId, route, selected, done, onSelect, onToggleDone, onOpenZone, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (zoneId && !el.open) el.showModal();
    if (!zoneId && el.open) el.close();
  }, [zoneId]);

  const trips = zoneId ? zoneSteps(route, zoneId) : [];
  // The selected step if it is in this zone, otherwise the zone's first trip.
  const focus = trips.includes(selected) ? selected : trips[0];

  // Keep the shown trip in view when a pin or the route buttons choose it.
  useEffect(() => {
    dialog.current?.querySelector(".zone-trips li.current")?.scrollIntoView({ block: "nearest" });
  }, [focus, zoneId]);

  const zone = ZONES.find((z) => z.id === zoneId);
  const step = focus === undefined ? undefined : route[focus];
  const { hubs, elsewhere } = step
    ? hubsForStep(step)
    : { hubs: (ZONE_HUBS[zoneId ?? ""] ?? []).map((h) => ({ ...h, active: false })), elsewhere: [] };
  const usedBy = zoneId ? hubSteps(route, zoneId) : new Map<string, number[]>();
  const pinned = hubs.filter((h) => h.x !== undefined && h.y !== undefined);
  const image = zoneId ? `${import.meta.env.BASE_URL}maps/zones/${zoneId}.webp` : "";

  /** Selects a step, moving the dialog to that step's zone if it is elsewhere. */
  const go = (index: number) => {
    onSelect(index);
    const target = route[index].place.zone.id;
    if (target !== zoneId) onOpenZone(target);
  };

  /** A pin cycles through the trips that use its hub, starting after the trip shown. */
  const pinTarget = (name: string) => {
    const steps = usedBy.get(name) ?? [];
    return steps.find((i) => focus !== undefined && i > focus) ?? steps[0];
  };

  const prev = focus === undefined || focus === 0 ? undefined : focus - 1;
  const next = focus === undefined || focus === route.length - 1 ? undefined : focus + 1;
  /** A dungeon in another zone is named with its entrance zone, since that is the map the button opens. */
  const navLabel = (i: number) => {
    const p = route[i].place;
    return p.kind === "dungeon" && p.zone.id !== zoneId ? `${p.name} (${p.zone.name})` : p.name;
  };

  return (
    <dialog
      ref={dialog}
      className="zone-dialog"
      aria-labelledby="zone-dialog-title"
      onClose={onClose}
      onClick={(e) => e.target === dialog.current && onClose()}
    >
      {zone && (
        <>
          <header className="quiz-header">
            <h2 id="zone-dialog-title">
              {zone.name} <span className="zone-dialog-levels">{levelText(zone.levels)}</span>
            </h2>
            <button className="quiz-close" onClick={onClose} aria-label="Close zone map">
              ×
            </button>
          </header>

          <div className="zone-dialog-layout">
            <div className="zone-map-column">
              <div className="zone-map">
                {failed === image ? (
                  <p className="zone-map-missing">The map image could not be loaded.</p>
                ) : (
                  <img src={image} alt={`Map of ${zone.name}`} width={1002} height={668} onError={() => setFailed(image)} />
                )}
                {pinned.map((h) => {
                  const steps = usedBy.get(h.name) ?? [];
                  const target = pinTarget(h.name);
                  const label = `${h.name}${steps.length ? `, used on step${steps.length > 1 ? "s" : ""} ${steps.map((i) => i + 1).join(", ")}` : ", not on the route"}`;
                  return (
                    <button
                      key={h.name}
                      className={`hub-pin ${h.active ? "active" : ""}`}
                      style={{ left: `${h.x}%`, top: `${h.y}%` }}
                      title={`${h.name} (${h.x}, ${h.y})`}
                      aria-label={label}
                      aria-pressed={h.active}
                      disabled={target === undefined}
                      onClick={() => target !== undefined && go(target)}
                    >
                      <span className="hub-dot" aria-hidden="true" />
                      <span className="hub-label">{h.name}</span>
                      {steps.length > 0 && (
                        <span className="hub-steps" aria-hidden="true">
                          {steps.map((i) => (
                            <span key={i} className={i === focus ? "current" : done.has(route[i].id) ? "done" : ""}>
                              {i + 1}
                            </span>
                          ))}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="zone-map-hint">
                Numbers on a pin are the steps that use that hub. Click a pin to show its next trip.
              </p>
            </div>

            <div className="zone-trips-column">
              {trips.length > 0 && (
                <section aria-labelledby="zone-trips-title">
                  <h3 id="zone-trips-title">
                    Trips here <span className="zone-dialog-note">{trips.length}</span>
                  </h3>
                  <ol className="zone-trips">
                    {trips.map((i) => {
                      const s = route[i];
                      return (
                        <li key={s.id} className={i === focus ? "current" : ""}>
                          <button
                            className={`${i === focus ? "current" : ""} ${done.has(s.id) ? "done" : ""}`}
                            aria-expanded={i === focus}
                            onClick={() => go(i)}
                          >
                            <span className="step-number">{i + 1}</span>
                            <span className="trip-title">
                              <span className="trip-name">
                                {tripName(s)}
                                {s.place.kind === "dungeon" && <span className="trip-kind">Dungeon</span>}
                                {done.has(s.id) && <span className="trip-done" aria-label="done">✓</span>}
                              </span>
                              <span className="zone-dialog-note">{s.hub ?? "Quest givers not announced"}</span>
                            </span>
                            <span className="step-levels">{levelText(s.levels)}</span>
                          </button>
                          {i === focus && (
                            <div className="zone-trip">
                              {s.travel && (
                                <p className="step-travel">
                                  <strong>Getting there:</strong> {s.travel}
                                </p>
                              )}
                              {hubNames(s.hub).length > 0 && (
                                <p className="trip-hubs">
                                  <strong>Hubs:</strong>{" "}
                                  {hubs
                                    .filter((h) => h.active)
                                    .map((h) => (
                                      <span key={h.name} className="hub-chip">
                                        {h.name}
                                      </span>
                                    ))}
                                  {elsewhere.map((n) => (
                                    <span key={n} className="hub-chip elsewhere" title="Not on this zone's map">
                                      {n}
                                    </span>
                                  ))}
                                </p>
                              )}
                              <ul className="trip-focus">
                                {s.focus.map((f) => (
                                  <li key={f}>{f}</li>
                                ))}
                              </ul>
                              {s.place.unconfirmed && <p className="step-unconfirmed">Not confirmed: {s.place.unconfirmed}</p>}
                              <label className="trip-done-toggle">
                                <input type="checkbox" checked={done.has(s.id)} onChange={() => onToggleDone(s.id)} />
                                Step {i + 1} done
                              </label>
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ol>
                </section>
              )}

              <section aria-labelledby="zone-hubs-title">
                <h3 id="zone-hubs-title">Quest hubs</h3>
                {hubs.length === 0 && <p className="zone-dialog-note">Quest hubs have not been announced.</p>}
                <ul className="zone-hubs">
                  {hubs.map((h) => {
                    const steps = usedBy.get(h.name) ?? [];
                    return (
                      <li key={h.name} className={h.active ? "active" : ""}>
                        <strong>{h.name}</strong>
                        {h.active && <span className="hub-tag">This step</span>}
                        <span className="zone-dialog-note">
                          {h.elsewhere
                            ? ` In ${h.elsewhere}.`
                            : h.x === undefined
                              ? " Position not published."
                              : ` ${h.x}, ${h.y}`}
                          {steps.length > 0 && ` · step${steps.length > 1 ? "s" : ""} ${steps.map((i) => i + 1).join(", ")}`}
                        </span>
                      </li>
                    );
                  })}
                </ul>
                {CHANGED_ZONE_MAPS.includes(zone.id) && (
                  <p className="zone-dialog-note">
                    Blizzard changed this zone in Forever; hub positions come from 2004 data and may be slightly off.
                  </p>
                )}
              </section>
            </div>
          </div>

          <nav className="zone-route-nav" aria-label="Route">
            <button disabled={prev === undefined} onClick={() => prev !== undefined && go(prev)}>
              <span aria-hidden="true">←</span>
              <span>
                <span className="zone-dialog-note">Previous step</span>
                {prev !== undefined && (
                  <span className="nav-target">
                    {prev + 1}. {navLabel(prev)}
                  </span>
                )}
              </span>
            </button>
            <button disabled={next === undefined} onClick={() => next !== undefined && go(next)}>
              <span>
                <span className="zone-dialog-note">Next step</span>
                {next !== undefined && (
                  <span className="nav-target">
                    {next + 1}. {navLabel(next)}
                  </span>
                )}
              </span>
              <span aria-hidden="true">→</span>
            </button>
          </nav>

          <p className="map-credit">
            Map: World of Warcraft: Forever zone map, © Blizzard Entertainment, via warcraft.wiki.gg. Hub positions from
            classicdb.ch (vanilla 1.12) and the Forever maps' own labels.
          </p>
        </>
      )}
    </dialog>
  );
}
