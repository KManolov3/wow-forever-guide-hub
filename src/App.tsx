import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import { CLASSES, findClass } from "./data/classes";
import type { WowClass } from "./data/types";
import { STARTING_ZONES, type StartingZoneId, isStartingZone } from "./data/startingZones";
import { ClassQuiz } from "./components/ClassQuiz";
import { Icon } from "./components/Icon";
import { TalentTreeView } from "./components/TalentTreeView";
import {
  type Build,
  TOTAL_POINTS,
  addPoint,
  decodeBuild,
  emptyBuild,
  encodeBuild,
  removePoint,
  requiredLevel,
  resetTree,
  totalPoints,
  treePoints,
} from "./lib/talents";
import "./App.css";

const LAUNCH = new Date("2026-11-04T15:00:00-08:00");

const LevelingGuide = lazy(() => import("./components/LevelingGuide").then((m) => ({ default: m.LevelingGuide })));
const ClassGuideView = lazy(() => import("./components/ClassGuideView").then((m) => ({ default: m.ClassGuideView })));

const GUIDE_PATH = "leveling";
const CLASS_GUIDE_PATH = "guide";
/** Class the class guide opens on until another one is picked there. */
const DEFAULT_GUIDE_CLASS = findClass("warlock") ?? CLASSES[0];

interface State {
  view: "talents" | "leveling" | "guide";
  cls: WowClass;
  build: Build;
  start: StartingZoneId;
  /** Class shown in the class guide, kept apart from the calculator's class so browsing guides keeps the build. */
  guideClass: WowClass;
  /** Talent tree id of the spec shown in the class guide; empty for the guide's default spec. */
  spec: string;
}

/**
 * Reads the view from the URL hash: `#/leveling/<starting-zone>` for the leveling guide,
 * `#/guide/<class>/<spec>` for the class guide, otherwise `#/<class>/<build>`. Whatever the hash does not
 * mention keeps its previous value.
 */
function readHash(prev?: State): State {
  const [, first = "", second = "", third = ""] = window.location.hash.split("/");
  const start = prev?.start ?? STARTING_ZONES[0];
  const guide = { guideClass: prev?.guideClass ?? DEFAULT_GUIDE_CLASS, spec: prev?.spec ?? "" };
  if (first === GUIDE_PATH || first === CLASS_GUIDE_PATH) {
    const cls = prev?.cls ?? CLASSES[0];
    const kept = { cls, build: prev?.build ?? emptyBuild(cls) };
    if (first === GUIDE_PATH) return { view: "leveling", ...kept, ...guide, start: isStartingZone(second) ? second : start };
    const guideClass = findClass(second) ?? guide.guideClass;
    const spec = guideClass.trees.some((t) => t.id === third) ? third : "";
    return { view: "guide", ...kept, start, guideClass, spec };
  }
  const cls = findClass(first) ?? CLASSES[0];
  return { view: "talents", cls, build: decodeBuild(cls, second), start, ...guide };
}

export default function App() {
  const [{ view, cls, build, start, guideClass, spec }, setState] = useState<State>(() => readHash());
  const [copied, setCopied] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [suggested, setSuggested] = useState<{ classId: string; treeIndex: number } | null>(null);

  const encoded = useMemo(() => encodeBuild(cls, build), [cls, build]);

  const talentsHash = `#/${cls.id}/${encoded.replace(/-+$/, "")}`;
  const guideHash = `#/${GUIDE_PATH}/${start}`;
  const classGuideHash = `#/${CLASS_GUIDE_PATH}/${guideClass.id}${spec ? `/${spec}` : ""}`;

  useEffect(() => {
    const hash = view === "leveling" ? guideHash : view === "guide" ? classGuideHash : talentsHash;
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
  }, [view, talentsHash, guideHash, classGuideHash]);

  useEffect(() => {
    const onHash = () => setState((s) => readHash(s));
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const spent = totalPoints(build);
  const split = build.map(treePoints).join(" / ");
  const daysToLaunch = Math.ceil((LAUNCH.getTime() - Date.now()) / 86_400_000);

  const selectClass = (next: WowClass) => {
    if (view === "guide") {
      setState((s) => ({ ...s, guideClass: next, spec: "" }));
      return;
    }
    setSuggested(null);
    setState((s) => ({ ...s, cls: next, build: emptyBuild(next) }));
  };
  const pickedClass = view === "guide" ? guideClass : cls;

  const chooseFromQuiz = (next: WowClass, treeIndex: number) => {
    setState((s) => ({ ...s, view: "talents", cls: next, build: emptyBuild(next) }));
    setSuggested({ classId: next.id, treeIndex });
    setQuizOpen(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      window.prompt("Copy this link:", window.location.href);
    }
  };

  return (
    <div className="app" style={{ "--class-color": pickedClass.color } as React.CSSProperties}>
      <header className="masthead">
        <div>
          <h1>
            World of Warcraft<span className="forever">: Forever</span>
          </h1>
          <p className="subtitle">
            {view === "leveling" ? "Horde Leveling Guide" : view === "guide" ? "Class Guide" : "Talent Calculator"} ·{" "}
            {daysToLaunch > 0 ? `launches in ${daysToLaunch} day${daysToLaunch === 1 ? "" : "s"}` : "now live"}
          </p>
        </div>
        <div className="view-switch">
          <a href={talentsHash} aria-current={view === "talents" ? "page" : undefined}>
            Talents
          </a>
          <a href={classGuideHash} aria-current={view === "guide" ? "page" : undefined}>
            Class guide
          </a>
          <a href={guideHash} aria-current={view === "leveling" ? "page" : undefined}>
            Leveling guide
          </a>
        </div>
        <button className="quiz-launch" onClick={() => setQuizOpen(true)} aria-haspopup="dialog">
          Find my class
        </button>
      </header>

      <ClassQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onChoose={chooseFromQuiz} />

      {view === "leveling" ? (
        <>
          <Suspense fallback={<p className="empty">Loading the leveling guide…</p>}>
            <LevelingGuide key={start} start={start} onStartChange={(next) => setState((s) => ({ ...s, start: next }))} />
          </Suspense>
          <footer className="footer">
            Horde route for a completionist playthrough: every Horde quest hub and every reachable dungeon, as close to
            its level as possible. Classic zones follow their 2004 quest levels; content new in Forever comes from
            pre-launch coverage and is marked when not confirmed. Not affiliated with Blizzard Entertainment.
          </footer>
        </>
      ) : (
        <>
          <nav className="class-picker" aria-label="Choose a class">
            {CLASSES.map((c) => (
              <button
                key={c.id}
                className={`class-button ${c.id === pickedClass.id ? "selected" : ""}`}
                style={{ "--class-color": c.color } as React.CSSProperties}
                onClick={() => selectClass(c)}
                aria-pressed={c.id === pickedClass.id}
              >
                <Icon name={c.icon ?? `classicon_${c.id}`} label={c.name} size={36} className="round" />
                <span className="class-label">{c.name}</span>
              </button>
            ))}
          </nav>

          {view === "guide" ? (
            <Suspense fallback={<p className="empty">Loading the class guide…</p>}>
              <ClassGuideView cls={guideClass} spec={spec} onSpecChange={(next) => setState((s) => ({ ...s, spec: next }))} />
            </Suspense>
          ) : CLASSES.length === 0 ? (
            <p className="empty">No class data loaded.</p>
          ) : (
            <>
              <div className="summary">
                <h2 className="class-name">{cls.name}</h2>
                <div className="stat">
                  <span className="label">Points</span>
                  <span className="value">
                    {spent} / {TOTAL_POINTS}
                  </span>
                </div>
                <div className="stat">
                  <span className="label">Build</span>
                  <span className="value">{split}</span>
                </div>
                <div className="stat">
                  <span className="label">Required level</span>
                  <span className="value">{requiredLevel(spent) || "—"}</span>
                </div>
                <div className="actions">
                  <button onClick={copyLink} disabled={spent === 0}>
                    {copied ? "Copied!" : "Copy link"}
                  </button>
                  <button onClick={() => setState((s) => ({ ...s, build: emptyBuild(s.cls) }))} disabled={spent === 0}>
                    Reset all
                  </button>
                </div>
              </div>

              <main className="trees">
                {cls.trees.map((tree, i) => (
                  <TalentTreeView
                    key={`${cls.id}-${tree.id}`}
                    cls={cls}
                    build={build}
                    treeIndex={i}
                    suggested={suggested?.classId === cls.id && suggested.treeIndex === i}
                    onAdd={(t) => setState((s) => ({ ...s, build: addPoint(s.cls, s.build, i, t) }))}
                    onRemove={(t) => setState((s) => ({ ...s, build: removePoint(s.cls, s.build, i, t) }))}
                    onReset={() => setState((s) => ({ ...s, build: resetTree(s.build, i) }))}
                  />
                ))}
              </main>

              <footer className="footer">
                Click to learn · Right-click or Shift+click to unlearn · Talent data from{" "}
                <a href={cls.source} target="_blank" rel="noreferrer">
                  {new URL(cls.source).hostname}
                </a>{" "}
                (beta data, may change before launch). Not affiliated with Blizzard Entertainment.
              </footer>
            </>
          )}
        </>
      )}
    </div>
  );
}
