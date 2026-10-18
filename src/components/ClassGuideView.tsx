import { useMemo, useState } from "react";
import { CLASS_GUIDES } from "../data/classGuides";
import { findClass } from "../data/classes";
import type {
  ClassGuide,
  GearSource,
  GearUpgrade,
  GuideSpell,
  RotationMode,
  RotationStep,
  SpecGuide,
  TrainPriority,
} from "../data/classGuides/types";
import { DUNGEONS, ZONES } from "../data/leveling";
import type { WowClass } from "../data/types";
import {
  type TalentPick,
  buildAtLevel,
  GEAR_LOOKAHEAD,
  type GearStatus,
  expandTalentOrder,
  gearStatus,
  locateTalent,
  rankAt,
  rotationFor,
  trainPriority,
  trainingPlan,
} from "../lib/classGuide";
import { FIRST_TALENT_LEVEL, MAX_LEVEL, encodeBuild, treePoints } from "../lib/talents";
import { GuideNav } from "./GuideNav";
import { Icon } from "./Icon";

interface Props {
  cls: WowClass;
  spec: string;
  onSpecChange: (spec: string) => void;
}

const PRIORITY_LABEL: Record<TrainPriority, string> = {
  must: "Must train",
  recommended: "Recommended",
  skip: "Skip",
};

/** Leveling plan (rotation by level, talent order, trainer plan), specs at 60 and spells for one class. */
export function ClassGuideView({ cls, spec, onSpecChange }: Props) {
  const guide = CLASS_GUIDES[cls.id];
  if (!guide) {
    const covered = Object.values(CLASS_GUIDES);
    return (
      <main className="class-guide">
        <div className="guide-panel">
          <h2 className="panel-title">{cls.name} guide coming soon</h2>
          <p className="panel-intro">
            The class guide covers{" "}
            {covered.map((g, i) => (
              <span key={g.classId}>
                {i > 0 && ", "}
                <a href={`#/guide/${g.classId}`}>{findClass(g.classId)?.name ?? g.classId}</a>
              </span>
            ))}{" "}
            so far. Pick that class above to read its leveling plan, rotations and spells.
          </p>
        </div>
      </main>
    );
  }
  const specGuide =
    guide.specs.find((s) => s.treeId === spec) ?? guide.specs.find((s) => s.treeId === guide.leveling.treeId)!;
  return <GuideContent cls={cls} guide={guide} spec={specGuide} onSpecChange={onSpecChange} />;
}

interface ContentProps {
  cls: WowClass;
  guide: ClassGuide;
  spec: SpecGuide;
  onSpecChange: (spec: string) => void;
}

/** Sections the guide's navigation bar jumps to, in page order. */
const SECTIONS = [
  { id: "guide-rotation", label: "Rotation" },
  { id: "guide-talents", label: "Talents" },
  { id: "guide-trainer", label: "Trainer" },
  { id: "guide-gear", label: "Gear" },
  { id: "guide-specs", label: "Specs at 60" },
  { id: "guide-spells", label: "Spells" },
] as const;

interface Ability {
  name: string;
  icon?: string;
  /** Level the ability first becomes available, if known. */
  level?: number;
  talent?: boolean;
}

function GuideContent({ cls, guide, spec, onSpecChange }: ContentProps) {
  const [levelInput, setLevelInput] = useState("");
  const levelingSpec = guide.specs.find((s) => s.treeId === guide.leveling.treeId)!;
  const levelingTree = cls.trees.find((t) => t.id === levelingSpec.treeId)!;
  const levelingPicks = useMemo(() => expandTalentOrder(cls, levelingSpec.talentOrder), [cls, levelingSpec]);
  const specPicks = useMemo(() => expandTalentOrder(cls, spec.talentOrder), [cls, spec]);
  const tree = cls.trees.find((t) => t.id === spec.treeId)!;
  const isLevelingSpec = spec.treeId === levelingSpec.treeId;

  const typed = Number(levelInput);
  const level = levelInput !== "" && Number.isInteger(typed) && typed >= 1 && typed <= MAX_LEVEL ? typed : null;

  const ability = (id: string, picks: TalentPick[]): Ability => {
    const spell = guide.spells.find((s) => s.id === id);
    if (spell) return { name: spell.name, icon: spell.icon, level: spell.ranks[0] };
    const found = locateTalent(cls, id);
    return {
      name: found?.talent.name ?? id,
      icon: found?.talent.icon,
      level: picks.find((p) => p.talent.id === id)?.level,
      talent: true,
    };
  };

  return (
    <main className="guide class-guide">
      <div className="summary guide-summary">
        <h2 className="class-name">{cls.name} guide</h2>
        <div className="stat">
          <span className="label">Leveling spec</span>
          <span className="value">{levelingTree.name}</span>
        </div>
      </div>

      <GuideNav
        sections={SECTIONS}
        field={{ id: "guide-level", label: "My level", max: MAX_LEVEL, value: levelInput, onChange: setLevelInput }}
      />

      <section className="guide-panel" aria-labelledby="leveling-title">
        <h3 id="leveling-title" className="panel-title">
          Leveling plan: {levelingTree.name}
          <span className="recommended-badge">Recommended</span>
        </h3>
        <p className="spec-summary">{guide.leveling.reason}</p>
        <LevelRotations guide={guide} level={level} ability={(id) => ability(id, levelingPicks)} />
        <TalentOrder
          id="guide-talents"
          cls={cls}
          picks={levelingPicks}
          level={level}
          spec={levelingSpec}
          title="Talent order"
          intro={`One point per level from ${FIRST_TALENT_LEVEL}, ordered for leveling speed.`}
        />
        <TrainerPlan spells={guide.spells} level={level} />
        <GearUpgrades gear={guide.gear} level={level} />
      </section>

      <section id="guide-specs" tabIndex={-1} className="guide-panel guide-section" aria-labelledby="spec-title">
        <h3 id="spec-title" className="panel-title">
          Specs at level 60
        </h3>
        <div className="start-picker spec-picker" role="group" aria-label="Specialization">
          {guide.specs.map((s) => {
            const t = cls.trees.find((x) => x.id === s.treeId)!;
            return (
              <button key={s.treeId} aria-pressed={s.treeId === spec.treeId} onClick={() => onSpecChange(s.treeId)}>
                <Icon name={t.icon} label={t.name} size={28} className="round" />
                <span className="start-name">{t.name}</span>
                {s.treeId === levelingSpec.treeId && <span className="recommended-badge">Leveling</span>}
              </button>
            );
          })}
        </div>
        <h4 className="sub-title">Playing {tree.name}</h4>
        <p className="spec-summary">{spec.summary}</p>
        <p className="spec-summary">
          <strong>Pet:</strong> {spec.pet}
        </p>
        <div className="spec-traits">
          <div>
            <h4>Strengths</h4>
            <ul>
              {spec.strengths.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
          <div>
            <h4>Weaknesses</h4>
            <ul>
              {spec.weaknesses.map((s) => (
                <li key={s}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
        {spec.rotations.map((r) => (
          <div key={r.title} className="rotation">
            <h4>{r.title} rotation</h4>
            <p className="rotation-context">{r.context}</p>
            <RotationSteps steps={r.steps} level={null} ability={(id) => ability(id, specPicks)} />
            {r.tips && <Tips tips={r.tips} />}
          </div>
        ))}
        {isLevelingSpec ? (
          <p className="panel-intro spec-note">{tree.name}'s talent order is in the leveling plan above.</p>
        ) : (
          <TalentOrder
            cls={cls}
            picks={specPicks}
            level={level}
            spec={spec}
            title={`${tree.name} talent order`}
            intro={`For a level 60 ${tree.name} build. Leveling as ${tree.name} is slower than ${levelingTree.name}: most players level ${levelingTree.name} and switch with dual spec at 40 or a respec at 60.`}
          />
        )}
      </section>

      <Spells guide={guide} level={level} />

      <footer className="footer guide-sources">
        Sources:{" "}
        {guide.sources.map((s, i) => (
          <span key={s.url}>
            {i > 0 && " · "}
            <a href={s.url} target="_blank" rel="noreferrer">
              {s.label}
            </a>
          </span>
        ))}
        . Spell levels marked “Not confirmed” follow Classic until Blizzard publishes Forever trainer data. Not
        affiliated with Blizzard Entertainment.
      </footer>
    </main>
  );
}

const MODES: { id: RotationMode; label: string }[] = [
  { id: "leveling", label: "Leveling" },
  { id: "dungeons", label: "Dungeons" },
  { id: "pvp", label: "World PvP" },
];

const levelRange = (from: number, to: number) => (from === to ? `${from}` : `${from}–${to}`);

function LevelRotations({
  guide,
  level,
  ability,
}: {
  guide: ClassGuide;
  level: number | null;
  ability: (id: string) => Ability;
}) {
  const rotations = guide.leveling.rotations;
  const [mode, setMode] = useState<RotationMode>("leveling");
  const [picked, setPicked] = useState<number | null>(null);
  const [pickedFor, setPickedFor] = useState(level);
  // A new level shows its own bracket again until the player picks another one.
  if (pickedFor !== level) {
    setPickedFor(level);
    setPicked(null);
  }
  const fromLevel = level === null ? undefined : rotationFor(rotations, level);
  const shown = picked ?? (fromLevel ? rotations.indexOf(fromLevel) : 0);
  const range = rotations[shown];
  const rotation = range.modes[mode];
  const before = rotations[shown - 1]?.modes[mode];
  const previous = new Set(before?.steps.map((s) => s.ability) ?? []);

  return (
    <div id="guide-rotation" tabIndex={-1} className="guide-sub guide-section">
      <h4 className="sub-title">Rotation by level</h4>
      <p className="panel-intro">
        Priority lists: cast the first ability whose note applies, then start again from the top. Your rotation changes
        as you learn spells and talents{level === null ? "; enter your level above to jump to yours" : ""}, and with
        what you are doing: questing alone, in a dungeon group, or fighting Alliance players in the open world.
      </p>
      <div className="start-picker rotation-modes" role="group" aria-label="Rotation mode">
        {MODES.map((m) => (
          <button key={m.id} aria-pressed={m.id === mode} onClick={() => setMode(m.id)}>
            {m.label}
          </button>
        ))}
      </div>
      <div className="start-picker level-brackets" role="group" aria-label="Level range">
        {rotations.map((r, i) => (
          <button key={r.from} aria-pressed={i === shown} onClick={() => setPicked(i)}>
            {levelRange(r.from, r.to)}
          </button>
        ))}
      </div>
      <div className="rotation">
        <h4>
          {MODES.find((m) => m.id === mode)!.label}, levels {levelRange(range.from, range.to)}
        </h4>
        {rotation ? (
          <>
            <p className="rotation-context">Pet: {rotation.pet}</p>
            <RotationSteps
              steps={rotation.steps}
              level={level}
              ability={ability}
              isNew={(id) => before !== undefined && !previous.has(id)}
            />
            {rotation.tips && <Tips tips={rotation.tips} />}
          </>
        ) : (
          <p className="rotation-context">{guide.leveling.unavailable[mode]}</p>
        )}
      </div>
    </div>
  );
}

function RotationSteps({
  steps,
  level,
  ability,
  isNew,
}: {
  steps: RotationStep[];
  level: number | null;
  ability: (id: string) => Ability;
  isNew?: (id: string) => boolean;
}) {
  return (
    <ol className="rotation-steps">
      {steps.map((step, i) => {
        const a = ability(step.ability);
        const locked = level !== null && a.level !== undefined && a.level > level;
        return (
          <li key={`${step.ability}-${i}`} className={locked ? "locked" : undefined}>
            <Icon name={a.icon} label={a.name} size={32} />
            <span>
              <strong>{a.name}</strong>
              {a.talent && <span className="talent-tag">talent</span>}
              {isNew?.(step.ability) && <span className="added-tag">new in this range</span>}
              {locked && <span className="level-tag">level {a.level}</span>}
              <span className="rotation-note">{step.note}</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

function Tips({ tips }: { tips: string[] }) {
  return (
    <ul className="rotation-tips">
      {tips.map((t) => (
        <li key={t}>{t}</li>
      ))}
    </ul>
  );
}

function TrainerPlan({ spells, level }: { spells: GuideSpell[]; level: number | null }) {
  const [showSkipped, setShowSkipped] = useState(false);
  const plan = useMemo(() => trainingPlan(spells), [spells]);
  const next = level === null ? undefined : plan.find((v) => v.level > level);
  const name = ({ spell, rank }: { spell: GuideSpell; rank: number }) =>
    spell.ranks.length > 1 ? `${spell.name} (rank ${rank})` : spell.name;

  return (
    <div id="guide-trainer" tabIndex={-1} className="guide-sub guide-section">
      <h4 className="sub-title">Trainer plan</h4>
      <p className="panel-intro">
        What to buy each time new ranks unlock. Short on gold? Buy every “Must train” rank first; “Recommended” ones
        when you can afford them; “Skip” ranks don't help you level.
      </p>
      {level !== null && (
        <p className="training-next" role="status" aria-label="Next trainer visit">
          {next === undefined ? (
            <>You have every spell rank by level {level}.</>
          ) : (
            <>
              Next trainer visit at level {next.level}:{" "}
              {(["must", "recommended"] as const)
                .map((p) => {
                  const ranks = next.ranks.filter((r) => r.priority === p);
                  return ranks.length ? `${PRIORITY_LABEL[p].toLowerCase()}: ${ranks.map(name).join(", ")}` : "";
                })
                .filter(Boolean)
                .join("; ") || "nothing worth buying"}
              .
            </>
          )}
        </p>
      )}
      <label className="skip-toggle">
        <input type="checkbox" checked={showSkipped} onChange={(e) => setShowSkipped(e.target.checked)} /> Show
        ranks to skip
      </label>
      <ol className="trainer-plan">
        {plan.map((visit) => {
          const ranks = showSkipped ? visit.ranks : visit.ranks.filter((r) => r.priority !== "skip");
          if (ranks.length === 0) return null;
          const state = level === null ? "" : visit.level <= level ? "done" : visit === next ? "next" : "";
          return (
            <li key={visit.level} className={`trainer-visit ${state}`} aria-label={`Level ${visit.level}`}>
              <span className="step-levels">
                {visit.level}
                {state === "next" && <span className="level-tag">next</span>}
              </span>
              <ul>
                {ranks.map((r) => (
                  <li key={r.spell.id} className={`train-${r.priority}`}>
                    <Icon name={r.spell.icon} label={r.spell.name} size={20} />
                    <span className="train-name">{name(r)}</span>
                    <span className={`priority-badge ${r.priority}`}>{PRIORITY_LABEL[r.priority]}</span>
                  </li>
                ))}
              </ul>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

const SOURCE_LABEL: Record<GearSource, string> = {
  quest: "Quest",
  dungeon: "Dungeon",
  auction: "Auction house",
  crafted: "Tailoring",
  class: "Class quest",
};

const STATUS_LABEL: Record<GearStatus, string | undefined> = {
  outgrown: "Outgrown",
  now: "Use now",
  soon: "Coming up",
  later: undefined,
};

function placeLabel(id: string) {
  const dungeon = DUNGEONS.find((d) => d.id === id);
  if (dungeon) return `${dungeon.name} (dungeon, levels ${levelRange(...dungeon.levels)})`;
  return ZONES.find((z) => z.id === id)?.name ?? id;
}

function GearUpgrades({ gear, level }: { gear: GearUpgrade[]; level: number | null }) {
  const [source, setSource] = useState<GearSource | null>(null);
  const [hideOutgrown, setHideOutgrown] = useState(true);
  const sources = (Object.keys(SOURCE_LABEL) as GearSource[]).filter((s) => gear.some((g) => g.source === s));
  const status = (g: GearUpgrade) => (level === null ? undefined : gearStatus(gear, g, level));
  const shown = [...gear]
    .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name))
    .filter((g) => !source || g.source === source)
    .filter((g) => !hideOutgrown || status(g) !== "outgrown");
  const soon = level === null ? [] : gear
          .filter((g) => status(g) === "soon")
          .sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  return (
    <div id="guide-gear" tabIndex={-1} className="guide-sub guide-section">
      <h4 className="sub-title">Gear upgrades</h4>
      <p className="panel-intro">
        Items that make a big difference while leveling, at the level you can use them. Each one replaces the last item
        listed for its slot.
      </p>
      {level !== null && (
        <p className="training-next gear-next" role="status" aria-label="Upcoming gear">
          {soon.length === 0
            ? `Nothing new to chase in the next ${GEAR_LOOKAHEAD} levels.`
            : `Coming up by level ${level + GEAR_LOOKAHEAD}: ${soon.map((g) => `${g.name} (${g.level})`).join(", ")}.`}
        </p>
      )}
      <div className="gear-controls">
        <div className="start-picker school-filter" role="group" aria-label="Filter gear by source">
          <button aria-pressed={source === null} onClick={() => setSource(null)}>
            All
          </button>
          {sources.map((s) => (
            <button key={s} aria-pressed={source === s} onClick={() => setSource(s)}>
              {SOURCE_LABEL[s]}
            </button>
          ))}
        </div>
        {level !== null && (
          <label className="skip-toggle">
            <input type="checkbox" checked={hideOutgrown} onChange={(e) => setHideOutgrown(e.target.checked)} /> Hide
            outgrown items
          </label>
        )}
      </div>
      <ul className="gear-list">
        {shown.map((g) => {
          const st = status(g);
          return (
            <li key={g.id} className={`gear ${st ?? ""}`}>
              <span className="step-levels">{g.level}</span>
              <Icon name={g.icon} label={g.name} size={36} />
              <div className="spell-body">
                <div className="spell-head">
                  {g.url ? (
                    <a
                      className={`gear-name q-${g.quality}`}
                      href={g.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {g.name}
                    </a>
                  ) : (
                    <strong className={`gear-name q-${g.quality}`}>{g.name}</strong>
                  )}
                  <span className="spell-school">{g.slot}</span>
                  <span className={`gear-source ${g.source}`}>{SOURCE_LABEL[g.source]}</span>
                  {st && STATUS_LABEL[st] && <span className={`gear-status ${st}`}>{STATUS_LABEL[st]}</span>}
                </div>
                <p className="spell-desc">{g.stats}</p>
                <p className="spell-ranks">
                  {g.place ? `${placeLabel(g.place)} · ` : ""}
                  {g.where}
                </p>
                <p className="spell-ranks train-note">{g.why}</p>
                {g.unconfirmed && <p className="step-unconfirmed">Not confirmed: {g.unconfirmed}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function Spells({ guide, level }: { guide: ClassGuide; level: number | null }) {
  const [school, setSchool] = useState<string | null>(null);
  const schools = [...new Set(guide.spells.map((s) => s.school))];
  const spells = [...guide.spells]
    .filter((s) => !school || s.school === school)
    .sort((a, b) => a.ranks[0] - b.ranks[0] || a.name.localeCompare(b.name));

  return (
    <section id="guide-spells" tabIndex={-1} className="guide-panel guide-section" aria-labelledby="spells-title">
      <h3 id="spells-title" className="panel-title">
        Spells
      </h3>
      <p className="panel-intro">{guide.intro}</p>
      <dl className="mechanics">
        {guide.mechanics.map((m) => (
          <div key={m.title}>
            <dt>{m.title}</dt>
            <dd>{m.text}</dd>
          </div>
        ))}
      </dl>
      <div className="start-picker school-filter" role="group" aria-label="Filter spells">
        <button aria-pressed={school === null} onClick={() => setSchool(null)}>
          All
        </button>
        {schools.map((s) => (
          <button key={s} aria-pressed={school === s} onClick={() => setSchool(s)}>
            {s}
          </button>
        ))}
      </div>
      <ul className="spell-list">
        {spells.map((s) => (
          <SpellRow key={s.id} spell={s} level={level} />
        ))}
      </ul>
    </section>
  );
}

function SpellRow({ spell, level }: { spell: GuideSpell; level: number | null }) {
  const known = level === null ? null : rankAt(spell, level);
  const priorities = new Set(spell.ranks.map((l) => trainPriority(spell, l)));
  const single = priorities.size === 1 ? [...priorities][0] : undefined;
  return (
    <li className={`spell ${known === 0 ? "locked" : ""}`}>
      <Icon name={spell.icon} label={spell.name} size={36} />
      <div className="spell-body">
        <div className="spell-head">
          <strong className="spell-name">{spell.name}</strong>
          {spell.isNew && <span className="new-badge inline">NEW</span>}
          <span className="spell-school">{spell.school}</span>
          {single && <span className={`priority-badge ${single}`}>{PRIORITY_LABEL[single]}</span>}
        </div>
        <p className="spell-desc">{spell.description}</p>
        <p className="spell-ranks">
          {spell.learnedFrom ? `${spell.learnedFrom} · ` : ""}
          {spell.ranks.length > 1 ? "Ranks at levels " : "Level "}
          {spell.ranks.map((l, i) => (
            <span key={l}>
              {i > 0 && ", "}
              <span
                className={`rank-level train-${trainPriority(spell, l)} ${known !== null && i < known ? "rank-known" : ""}`}
                title={PRIORITY_LABEL[trainPriority(spell, l)]}
              >
                {l}
              </span>
            </span>
          ))}
          {known !== null && known > 0 && spell.ranks.length > 1 && ` · you have rank ${known}`}
        </p>
        {priorities.size > 1 && (
          <p className="spell-ranks">
            {(["must", "recommended", "skip"] as const)
              .map((p) => {
                const levels = spell.ranks.filter((l) => trainPriority(spell, l) === p);
                return levels.length ? `${PRIORITY_LABEL[p]}: ${levels.join(", ")}` : "";
              })
              .filter(Boolean)
              .join(" · ")}
          </p>
        )}
        {spell.trainNote && <p className="spell-ranks train-note">{spell.trainNote}</p>}
        {spell.unconfirmed && <p className="step-unconfirmed">Not confirmed: {spell.unconfirmed}</p>}
      </div>
    </li>
  );
}

interface Segment {
  first: TalentPick;
  last: TalentPick;
}

function TalentOrder({
  id,
  cls,
  picks,
  level,
  spec,
  title,
  intro,
}: {
  /** Set when the navigation bar jumps here. */
  id?: string;
  cls: WowClass;
  picks: TalentPick[];
  level: number | null;
  spec: SpecGuide;
  title: string;
  intro: string;
}) {
  const shownLevel = level ?? MAX_LEVEL;
  const build = buildAtLevel(cls, picks, shownLevel);
  const split = build.map(treePoints).join(" / ");
  const hash = `#/${cls.id}/${encodeBuild(cls, build).replace(/-+$/, "")}`;

  const segments: Segment[] = [];
  let index = 0;
  for (const s of spec.talentOrder) {
    segments.push({ first: picks[index], last: picks[index + s.points - 1] });
    index += s.points;
  }

  return (
    <div
      id={id}
      tabIndex={id ? -1 : undefined}
      className={`guide-sub talent-order-block ${id ? "guide-section" : ""}`}
    >
      <h4 className="sub-title">{title}</h4>
      <p className="panel-intro">{intro}</p>
      <div className="talent-order-summary">
        <span>
          {shownLevel === MAX_LEVEL ? "Level 60 build" : `Build at level ${shownLevel}`}: <strong>{split}</strong>
        </span>
        <a className="open-zone" href={hash}>
          Open level {shownLevel} build in the calculator
        </a>
      </div>
      <ol className="talent-order">
        {segments.map(({ first, last }) => {
          const reached = level !== null && last.level <= level;
          const partial = level !== null && !reached && first.level <= level;
          const tree = cls.trees[first.treeIndex];
          return (
            <li key={first.level} className={reached ? "done" : partial ? "partial" : undefined}>
              <span className="step-levels">{levelRange(first.level, last.level)}</span>
              <Icon name={first.talent.icon} label={first.talent.name} size={32} />
              <span className="talent-order-body">
                <strong>
                  {first.talent.name} {last.rank}/{first.talent.maxRank}
                </strong>
                {first.talent.isNew && <span className="new-badge inline">NEW</span>}
                <span className="talent-order-tree">{tree.name}</span>
                {first.note && <span className="rotation-note">{first.note}</span>}
              </span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
