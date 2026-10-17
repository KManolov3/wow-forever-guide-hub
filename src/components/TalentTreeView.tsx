import { useState } from "react";
import type { Talent, WowClass } from "../data/types";
import {
  type Build,
  canAdd,
  canRemove,
  describeRank,
  findTalent,
  isUnlocked,
  rankOf,
  tierRequirement,
  tierUnlocked,
  treePoints,
} from "../lib/talents";
import { Icon } from "./Icon";

interface Props {
  cls: WowClass;
  build: Build;
  treeIndex: number;
  onAdd: (talent: Talent) => void;
  onRemove: (talent: Talent) => void;
  onReset: () => void;
}

const COLUMNS = 4;

export function TalentTreeView({ cls, build, treeIndex, onAdd, onRemove, onReset }: Props) {
  const tree = cls.trees[treeIndex];
  const ranks = build[treeIndex];
  const spent = treePoints(ranks);
  const maxTier = Math.max(7, ...tree.talents.map((t) => t.tier));
  const [hovered, setHovered] = useState<Talent | null>(null);

  return (
    <section className="tree">
      <header className="tree-header">
        <Icon name={tree.icon} label={tree.name} size={28} className="round" />
        <h2>{tree.name}</h2>
        <span className="tree-points">{spent}</span>
        <button className="link-button" onClick={onReset} disabled={spent === 0} title="Reset tree">
          Reset
        </button>
      </header>

      <div
        className="tree-grid"
        style={{ gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`, gridTemplateRows: `repeat(${maxTier}, auto)` }}
      >
        {tree.talents.map((talent) => {
          const rank = rankOf(build, treeIndex, talent.id);
          const unlocked = isUnlocked(tree, ranks, talent);
          const addable = canAdd(cls, build, treeIndex, talent);
          const state = rank === talent.maxRank ? "maxed" : rank > 0 ? "partial" : unlocked && addable ? "available" : "locked";
          const prereq = talent.requires ? findTalent(tree, talent.requires) : undefined;
          const missingPrereq = prereq && rankOf(build, treeIndex, prereq.id) < prereq.maxRank ? prereq : undefined;

          return (
            <div
              key={talent.id}
              className={`talent-cell col-${talent.column}`}
              style={{ gridColumn: talent.column, gridRow: talent.tier }}
            >
              {prereq && <Arrow from={prereq} to={talent} active={unlocked} />}
              <button
                className={`talent ${state}`}
                aria-label={`${talent.name}, rank ${rank} of ${talent.maxRank}`}
                onClick={(e) => (e.shiftKey ? onRemove(talent) : onAdd(talent))}
                onContextMenu={(e) => {
                  e.preventDefault();
                  onRemove(talent);
                }}
                onMouseEnter={() => setHovered(talent)}
                onMouseLeave={() => setHovered((h) => (h === talent ? null : h))}
                onFocus={() => setHovered(talent)}
                onBlur={() => setHovered((h) => (h === talent ? null : h))}
              >
                <Icon name={talent.icon} label={talent.name} />
                <span className="rank">
                  {rank}/{talent.maxRank}
                </span>
                {talent.isNew && <span className="new-badge">NEW</span>}
              </button>

              {hovered === talent && (
                <Tooltip
                  talent={talent}
                  rank={rank}
                  tierNeed={tierRequirement(talent.tier)}
                  tierMet={tierUnlocked(tree, ranks, talent.tier)}
                  prereq={missingPrereq}
                  treeName={tree.name}
                  canRemove={canRemove(cls, build, treeIndex, talent)}
                />
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}

function Arrow({ from, to, active }: { from: Talent; to: Talent; active: boolean }) {
  // Vertical connector from the prerequisite's row down to this talent; drawn within this cell's column.
  const rows = to.tier - from.tier;
  if (from.column !== to.column) {
    return <span className={`arrow side ${active ? "active" : ""} ${from.column < to.column ? "from-left" : "from-right"}`} />;
  }
  return <span className={`arrow down ${active ? "active" : ""}`} style={{ "--rows": rows } as React.CSSProperties} />;
}

interface TooltipProps {
  talent: Talent;
  rank: number;
  tierNeed: number;
  tierMet: boolean;
  prereq?: Talent;
  treeName: string;
  canRemove: boolean;
}

function Tooltip({ talent, rank, tierNeed, tierMet, prereq, treeName, canRemove }: TooltipProps) {
  const hasNext = rank < talent.maxRank && talent.ranks.length > 1;
  return (
    <div className="tooltip" role="tooltip">
      <div className="tooltip-title">
        {talent.name}
        {talent.isNew && <span className="new-badge inline">NEW IN FOREVER</span>}
      </div>
      <div className="tooltip-rank">
        Rank {rank}/{talent.maxRank}
      </div>
      {!tierMet && (
        <div className="tooltip-req">
          Requires {tierNeed} points in {treeName}
        </div>
      )}
      {prereq && (
        <div className="tooltip-req">
          Requires {prereq.maxRank} point{prereq.maxRank > 1 ? "s" : ""} in {prereq.name}
        </div>
      )}
      <p>{describeRank(talent, rank || 1)}</p>
      {hasNext && rank > 0 && (
        <>
          <div className="tooltip-next">Next rank:</div>
          <p>{describeRank(talent, rank + 1)}</p>
        </>
      )}
      <div className="tooltip-hint">
        {rank < talent.maxRank ? "Click to learn" : "Maxed"}
        {canRemove ? " · Right-click to unlearn" : ""}
      </div>
    </div>
  );
}
