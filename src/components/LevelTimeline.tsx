import { useState } from "react";
import { type GuideStep, MAX_LEVEL, MIN_LEVEL, timelineRows } from "../lib/leveling";

interface Props {
  route: GuideStep[];
  selected: number;
  done: ReadonlySet<string>;
  onSelect: (index: number) => void;
}

const SPAN = MAX_LEVEL - MIN_LEVEL + 1;
const TICKS = [1, 10, 20, 30, 40, 50, 60];
/** Left edge of a level as a percentage of the track; a level occupies a whole slot. */
const pos = (level: number) => ((level - MIN_LEVEL) / SPAN) * 100;

/** Gantt-style overview: one row per zone or dungeon, one bar per visit, along the 1-60 level axis. */
export function LevelTimeline({ route, selected, done, onSelect }: Props) {
  const rows = timelineRows(route);
  const [hover, setHover] = useState<number | null>(null);
  const firstDungeon = rows.findIndex((r) => r.place.kind === "dungeon");

  return (
    <div className="timeline" role="group" aria-label="Route by level">
      <div className="timeline-axis" aria-hidden="true">
        <span className="timeline-label" />
        <div className="timeline-track">
          {TICKS.map((t) => (
            <span key={t} className="timeline-tick" style={{ left: `${pos(t)}%` }}>
              {t}
            </span>
          ))}
        </div>
      </div>

      {rows.map((row, r) => (
        <div key={row.place.id} className={`timeline-row ${r === firstDungeon ? "first-dungeon" : ""}`}>
          <span className="timeline-label" title={row.place.name}>
            {row.place.name.replace("Scarlet Monastery:", "SM:")}
          </span>
          <div className="timeline-track">
            {TICKS.map((t) => (
              <span key={t} className="timeline-grid" style={{ left: `${pos(t)}%` }} />
            ))}
            {row.steps.map((i) => {
              const step = route[i];
              const [from, to] = step.levels;
              const classes = [
                "timeline-bar",
                row.place.kind,
                i === selected ? "current" : "",
                done.has(step.id) ? "done" : "",
                row.place.unconfirmed ? "unconfirmed" : "",
              ];
              return (
                <button
                  key={i}
                  className={classes.join(" ")}
                  style={{ left: `${pos(from)}%`, width: `${pos(to + 1) - pos(from)}%` }}
                  aria-label={`Step ${i + 1}: ${row.place.name}, levels ${from}–${to}`}
                  aria-pressed={i === selected}
                  onClick={() => onSelect(i)}
                  onMouseEnter={() => setHover(i)}
                  onMouseLeave={() => setHover(null)}
                  onFocus={() => setHover(i)}
                  onBlur={() => setHover(null)}
                >
                  {hover === i && (
                    <span className="viz-tooltip timeline-tooltip" role="tooltip">
                      <strong>
                        Step {i + 1}: {row.place.name}
                      </strong>
                      <span className="viz-tooltip-sub">
                        Levels {from}–{to}
                        {step.hub && ` · ${step.hub}`}
                      </span>
                      {step.visits > 1 && (
                        <span className="viz-tooltip-sub">
                          Visit {step.visit} of {step.visits}
                        </span>
                      )}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ))}

      <ul className="map-legend" aria-label="Timeline legend">
        <li>
          <span className="swatch zone" /> Zone visit
        </li>
        <li>
          <span className="swatch dungeon" /> Dungeon
        </li>
        <li>
          <span className="swatch unconfirmed" /> Level range not confirmed
        </li>
        <li>
          <span className="swatch done" /> Done
        </li>
      </ul>
    </div>
  );
}
