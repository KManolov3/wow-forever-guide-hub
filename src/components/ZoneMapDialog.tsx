import { useEffect, useRef, useState } from "react";
import { CHANGED_ZONE_MAPS, ZONE_HUBS } from "../data/hubs";
import { ZONES } from "../data/leveling";
import { type GuideStep, hubsForStep } from "../lib/leveling";

interface Props {
  /** Zone to show, or null when the dialog is closed. */
  zoneId: string | null;
  route: GuideStep[];
  selected: number;
  onSelect: (index: number) => void;
  onClose: () => void;
}

const levelText = ([a, b]: [number, number]) => (a === b ? `${a}` : `${a}–${b}`);

/** Modal map of one zone with its quest hubs pinned and the route's visits to it listed. */
export function ZoneMapDialog({ zoneId, route, selected, onSelect, onClose }: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [failed, setFailed] = useState<string | null>(null);

  useEffect(() => {
    const el = dialog.current;
    if (!el) return;
    if (zoneId && !el.open) el.showModal();
    if (!zoneId && el.open) el.close();
  }, [zoneId]);

  const zone = ZONES.find((z) => z.id === zoneId);
  const visits = route.flatMap((s, i) => (s.place.zone.id === zoneId ? [i] : []));
  // The selected step if it is in this zone, otherwise the zone's first visit.
  const focus = visits.includes(selected) ? selected : visits[0];
  const step = focus === undefined ? undefined : route[focus];
  const { hubs, elsewhere } = step
    ? hubsForStep(step)
    : { hubs: (ZONE_HUBS[zoneId ?? ""] ?? []).map((h) => ({ ...h, active: false })), elsewhere: [] };
  const pinned = hubs.filter((h) => h.x !== undefined && h.y !== undefined);
  const image = zoneId ? `${import.meta.env.BASE_URL}maps/zones/${zoneId}.webp` : "";

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

          <div className="zone-map">
            {failed === image ? (
              <p className="zone-map-missing">The map image could not be loaded.</p>
            ) : (
              <img src={image} alt={`Map of ${zone.name}`} width={1002} height={668} onError={() => setFailed(image)} />
            )}
            {pinned.map((h) => (
              <span
                key={h.name}
                className={`hub-pin ${h.active ? "active" : ""}`}
                style={{ left: `${h.x}%`, top: `${h.y}%` }}
                title={`${h.name} (${h.x}, ${h.y})`}
              >
                <span className="hub-dot" aria-hidden="true" />
                <span className="hub-label">{h.name}</span>
              </span>
            ))}
          </div>

          <div className="zone-dialog-body">
            <section aria-labelledby="zone-hubs-title">
              <h3 id="zone-hubs-title">Quest hubs</h3>
              {hubs.length === 0 && <p className="zone-dialog-note">Quest hubs have not been announced.</p>}
              <ul className="zone-hubs">
                {hubs.map((h) => (
                  <li key={h.name} className={h.active ? "active" : ""}>
                    <strong>{h.name}</strong>
                    {h.active && <span className="hub-tag">This step</span>}
                    <span className="zone-dialog-note">
                      {h.elsewhere
                        ? ` In ${h.elsewhere}.`
                        : h.x === undefined
                          ? " Position not published."
                          : ` ${h.x}, ${h.y}`}
                    </span>
                  </li>
                ))}
              </ul>
              {elsewhere.length > 0 && (
                <p className="zone-dialog-note">This step's quests also come from {elsewhere.join(", ")}.</p>
              )}
              {CHANGED_ZONE_MAPS.includes(zone.id) && (
                <p className="zone-dialog-note">
                  Blizzard changed this zone in Forever; hub positions come from 2004 data and may be slightly off.
                </p>
              )}
            </section>

            {visits.length > 0 && (
              <section aria-labelledby="zone-visits-title">
                <h3 id="zone-visits-title">On the route</h3>
                <ol className="zone-visits">
                  {visits.map((i) => (
                    <li key={route[i].id}>
                      <button
                        className={i === focus ? "current" : ""}
                        aria-current={i === selected ? "step" : undefined}
                        onClick={() => {
                          onSelect(i);
                          onClose();
                        }}
                      >
                        <span className="step-number">{i + 1}</span>
                        <span>
                          {route[i].place.name}
                          <span className="zone-dialog-note"> · {route[i].hub ?? "quest givers not announced"}</span>
                        </span>
                        <span className="step-levels">{levelText(route[i].levels)}</span>
                      </button>
                    </li>
                  ))}
                </ol>
              </section>
            )}
          </div>

          <p className="map-credit">
            Map: World of Warcraft: Forever zone map, © Blizzard Entertainment, via warcraft.wiki.gg. Hub positions from
            classicdb.ch (vanilla 1.12) and the Forever maps' own labels.
          </p>
        </>
      )}
    </dialog>
  );
}
