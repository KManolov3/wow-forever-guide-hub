import { type FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { EXCLUSIONS, STARTING_ZONES, type StartingZoneId, ZONES } from "../data/leveling";
import { MAX_LEVEL, MIN_LEVEL, buildRoute, stepForLevel } from "../lib/leveling";
import { LevelTimeline } from "./LevelTimeline";
import { RouteMap } from "./RouteMap";
import { ZoneMapDialog } from "./ZoneMapDialog";

interface Props {
  start: StartingZoneId;
  onStartChange: (start: StartingZoneId) => void;
}

const DONE_KEY = "leveling-guide:done";

function readDone(): Set<string> {
  try {
    const stored = JSON.parse(localStorage.getItem(DONE_KEY) ?? "[]");
    return new Set(Array.isArray(stored) ? stored.filter((s) => typeof s === "string") : []);
  } catch {
    return new Set();
  }
}

function writeDone(done: Set<string>) {
  try {
    localStorage.setItem(DONE_KEY, JSON.stringify([...done]));
  } catch {
    // Progress is a convenience; without storage it lasts until the page reloads.
  }
}

/** Horde completionist leveling route with a level timeline, a route map and a checklist of steps. */
export function LevelingGuide({ start, onStartChange }: Props) {
  const route = useMemo(() => buildRoute(start), [start]);
  const [selected, setSelected] = useState(0);
  const [done, setDone] = useState(readDone);
  const [level, setLevel] = useState("");
  const [openZone, setOpenZone] = useState<string | null>(null);
  const list = useRef<HTMLOListElement>(null);
  const scrollOnSelect = useRef(false);

  useEffect(() => {
    if (!scrollOnSelect.current) return;
    scrollOnSelect.current = false;
    list.current?.children[selected]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selected]);

  const select = (index: number) => {
    scrollOnSelect.current = true;
    setSelected(index);
  };

  const toggleDone = (id: string) => {
    setDone((d) => {
      const next = new Set(d);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      writeDone(next);
      return next;
    });
  };

  const resetProgress = () => {
    const next = new Set<string>();
    writeDone(next);
    setDone(next);
  };

  const jump = (e: FormEvent) => {
    e.preventDefault();
    const n = Number(level);
    if (Number.isInteger(n) && n >= MIN_LEVEL && n <= MAX_LEVEL) select(stepForLevel(route, n, done));
  };

  const completed = route.filter((s) => done.has(s.id)).length;
  const zoneCount = new Set(route.filter((s) => s.place.kind === "zone").map((s) => s.place.id)).size;
  const dungeonCount = new Set(route.filter((s) => s.place.kind === "dungeon").map((s) => s.place.id)).size;

  return (
    <main className="guide">
      <div className="summary guide-summary">
        <h2 className="class-name">Horde leveling</h2>
        <div className="stat">
          <span className="label">Route</span>
          <span className="value">
            {route.length} steps · {zoneCount} zones · {dungeonCount} dungeons
          </span>
        </div>
        <div className="stat">
          <span className="label">Progress</span>
          <span className="value">
            {completed} / {route.length}
          </span>
        </div>
        <form className="level-jump" onSubmit={jump}>
          <label htmlFor="level-jump">My level</label>
          <input
            id="level-jump"
            type="number"
            inputMode="numeric"
            min={MIN_LEVEL}
            max={MAX_LEVEL}
            value={level}
            onChange={(e) => setLevel(e.target.value)}
            placeholder="1–60"
          />
          <button type="submit">Find step</button>
        </form>
        <div className="actions">
          <button onClick={resetProgress} disabled={completed === 0}>
            Reset progress
          </button>
        </div>
      </div>

      <div className="start-picker" role="group" aria-label="Starting zone">
        <span className="start-picker-label">Starting zone</span>
        {STARTING_ZONES.map((id) => {
          const zone = ZONES.find((z) => z.id === id)!;
          return (
            <button key={id} aria-pressed={id === start} onClick={() => onStartChange(id)}>
              <span className="start-name">{zone.name}</span>
              <span className="start-races">{zone.startingRaces}</span>
            </button>
          );
        })}
      </div>

      <section className="guide-panel" aria-labelledby="timeline-title">
        <h3 id="timeline-title" className="panel-title">
          Your route at a glance
        </h3>
        <p className="panel-intro">
          Each bar is one visit, placed at the levels you do it. Zones with quests across many levels, like the
          Barrens, come back several times so every quest is done close to its level.
        </p>
        <LevelTimeline route={route} selected={selected} done={done} onSelect={select} />
      </section>

      <div className="guide-columns">
        <section className="guide-panel guide-steps" aria-labelledby="steps-title">
          <h3 id="steps-title" className="panel-title">
            Steps
          </h3>
          <ol ref={list} className="steps">
            {route.map((step, i) => {
              const isDone = done.has(step.id);
              const isCurrent = i === selected;
              return (
                <li
                  key={step.id}
                  className={`step ${step.place.kind} ${isCurrent ? "current" : ""} ${isDone ? "done" : ""}`}
                  aria-current={isCurrent ? "step" : undefined}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    onChange={() => toggleDone(step.id)}
                    aria-label={`Mark step ${i + 1}, ${step.place.name}, as done`}
                  />
                  <button className="step-main" onClick={() => select(i)} aria-expanded={isCurrent}>
                    <span className="step-number">{i + 1}</span>
                    <span className="step-title">
                      <span className="step-name">
                        {step.place.name}
                        {step.place.isNew && <span className="new-badge inline">NEW</span>}
                      </span>
                      <span className="step-meta">
                        {step.place.kind === "dungeon" ? "Dungeon" : "Zone"}
                        {step.visits > 1 && ` · visit ${step.visit} of ${step.visits}`} · {step.hub ?? "Quest givers not announced"}
                      </span>
                    </span>
                    <span className="step-levels">
                      {step.levels[0] === step.levels[1] ? step.levels[0] : `${step.levels[0]}–${step.levels[1]}`}
                    </span>
                  </button>
                  {isCurrent && (
                    <div className="step-detail">
                      {step.travel && (
                        <p className="step-travel">
                          <strong>Getting there:</strong> {step.travel}
                        </p>
                      )}
                      <ul>
                        {step.focus.map((f) => (
                          <li key={f}>{f}</li>
                        ))}
                      </ul>
                      {step.place.unconfirmed && <p className="step-unconfirmed">Not confirmed: {step.place.unconfirmed}</p>}
                      <button className="open-zone" onClick={() => setOpenZone(step.place.zone.id)}>
                        Open {step.place.zone.name} map
                      </button>
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>

        <section className="guide-panel guide-map" aria-labelledby="map-title">
          <h3 id="map-title" className="panel-title">
            Route map
          </h3>
          <RouteMap route={route} selected={selected} done={done} onSelect={select} onOpenZone={setOpenZone} />
        </section>
      </div>

      <section className="guide-panel" aria-labelledby="skipped-title">
        <h3 id="skipped-title" className="panel-title">
          Left out on purpose
        </h3>
        <ul className="skipped">
          {EXCLUSIONS.map((e) => (
            <li key={e.name}>
              <strong>{e.name}</strong> — {e.reason}
            </li>
          ))}
        </ul>
      </section>

      <ZoneMapDialog
        zoneId={openZone}
        route={route}
        selected={selected}
        done={done}
        onSelect={select}
        onToggleDone={toggleDone}
        onOpenZone={setOpenZone}
        onClose={() => setOpenZone(null)}
      />
    </main>
  );
}
