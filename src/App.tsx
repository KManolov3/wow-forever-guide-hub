import { useEffect, useMemo, useState } from "react";
import { CLASSES, findClass } from "./data/classes";
import type { WowClass } from "./data/types";
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

interface State {
  cls: WowClass;
  build: Build;
}

function readHash(): State {
  const [, classId, encoded = ""] = window.location.hash.split("/");
  const cls = findClass(classId ?? "") ?? CLASSES[0];
  return { cls, build: decodeBuild(cls, encoded) };
}

export default function App() {
  const [{ cls, build }, setState] = useState<State>(readHash);
  const [copied, setCopied] = useState(false);
  const [quizOpen, setQuizOpen] = useState(false);
  const [suggested, setSuggested] = useState<{ classId: string; treeIndex: number } | null>(null);

  const encoded = useMemo(() => encodeBuild(cls, build), [cls, build]);

  useEffect(() => {
    const hash = `#/${cls.id}/${encoded.replace(/-+$/, "")}`;
    if (window.location.hash !== hash) window.history.replaceState(null, "", hash);
  }, [cls, encoded]);

  useEffect(() => {
    const onHash = () => setState(readHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const spent = totalPoints(build);
  const split = build.map(treePoints).join(" / ");
  const daysToLaunch = Math.ceil((LAUNCH.getTime() - Date.now()) / 86_400_000);

  const selectClass = (next: WowClass) => {
    setSuggested(null);
    setState({ cls: next, build: emptyBuild(next) });
  };

  const chooseFromQuiz = (next: WowClass, treeIndex: number) => {
    setState({ cls: next, build: emptyBuild(next) });
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
    <div className="app" style={{ "--class-color": cls.color } as React.CSSProperties}>
      <header className="masthead">
        <div>
          <h1>
            World of Warcraft<span className="forever">: Forever</span>
          </h1>
          <p className="subtitle">
            Talent Calculator ·{" "}
            {daysToLaunch > 0 ? `launches in ${daysToLaunch} day${daysToLaunch === 1 ? "" : "s"}` : "now live"}
          </p>
        </div>
        <button className="quiz-launch" onClick={() => setQuizOpen(true)} aria-haspopup="dialog">
          Find my class
        </button>
      </header>

      <ClassQuiz open={quizOpen} onClose={() => setQuizOpen(false)} onChoose={chooseFromQuiz} />

      <nav className="class-picker" aria-label="Choose a class">
        {CLASSES.map((c) => (
          <button
            key={c.id}
            className={`class-button ${c.id === cls.id ? "selected" : ""}`}
            style={{ "--class-color": c.color } as React.CSSProperties}
            onClick={() => selectClass(c)}
            aria-pressed={c.id === cls.id}
          >
            <Icon name={c.icon ?? `classicon_${c.id}`} label={c.name} size={36} className="round" />
            <span className="class-label">{c.name}</span>
          </button>
        ))}
      </nav>

      {CLASSES.length === 0 ? (
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
              <button onClick={() => setState({ cls, build: emptyBuild(cls) })} disabled={spent === 0}>
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
    </div>
  );
}
