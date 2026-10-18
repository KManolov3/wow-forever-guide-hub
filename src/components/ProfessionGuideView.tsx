import { useMemo, useState } from "react";
import { CLASSES, findClass } from "../data/classes";
import { PROFESSION_GUIDES, findProfession } from "../data/professions";
import type { ProfessionGuide, Recipe, RecipeSource } from "../data/professions/types";
import type { WowClass } from "../data/types";
import {
  type ActiveStep,
  MAX_SKILL,
  type RecipeColor,
  activeSteps,
  disenchantYield,
  findMaterial,
  findRecipe,
  materialsNeeded,
  nextTier,
  recipeColor,
  remainingCrafts,
  stepAt,
} from "../lib/professions";
import { GuideNav } from "./GuideNav";
import { Icon } from "./Icon";

interface Props {
  profession: string;
  onProfessionChange: (id: string) => void;
  /** Class to show items for; empty for none. */
  classId: string;
  onClassChange: (id: string) => void;
}

const SECTIONS = [
  { id: "profession-trainers", label: "Trainers" },
  { id: "profession-route", label: "Route" },
  { id: "profession-materials", label: "Materials" },
  { id: "profession-recipes", label: "Key recipes" },
  { id: "profession-tips", label: "Tips" },
] as const;

const SOURCE_LABEL: Record<RecipeSource, string> = {
  trainer: "Trainer",
  vendor: "Vendor",
  favor: "Merchant's Favor",
  drop: "Drop",
  quest: "Quest",
  unknown: "Source unknown",
};

const COLOR_LABEL: Record<RecipeColor, string> = {
  unlearnable: "not learnable yet",
  orange: "orange",
  yellow: "yellow",
  green: "green",
  grey: "grey",
};

/** Horde guide to one crafting profession: trainers, a skill 1–300 route, materials and recipes worth having. */
export function ProfessionGuideView({ profession, onProfessionChange, classId, onClassChange }: Props) {
  const guide = findProfession(profession) ?? PROFESSION_GUIDES[0];
  const focus = findClass(classId);
  const sections = useMemo(
    () =>
      focus
        ? [...SECTIONS.slice(0, 3), { id: "profession-class", label: `${focus.name} items` }, ...SECTIONS.slice(3)]
        : SECTIONS,
    [focus],
  );
  const classRecipes = new Set((focus && guide.classItems?.[focus.id]?.map((i) => i.recipe)) ?? []);
  const [skillInput, setSkillInput] = useState("");
  const [enchanter, setEnchanter] = useState(false);
  const pairs = guide.steps.some((s) => s.enchanterAlt);
  const route = useMemo(() => ({ ...guide, steps: activeSteps(guide, pairs && enchanter) }), [guide, pairs, enchanter]);
  const typed = Number(skillInput);
  const skill = skillInput !== "" && Number.isInteger(typed) && typed >= 1 && typed <= MAX_SKILL ? typed : null;

  return (
    <main className="guide profession-guide">
      <div className="start-picker profession-picker" role="group" aria-label="Profession">
        {PROFESSION_GUIDES.map((p) => (
          <button key={p.id} aria-pressed={p.id === guide.id} onClick={() => onProfessionChange(p.id)}>
            <Icon name={p.icon} label={p.name} size={28} />
            <span className="start-name">{p.name}</span>
          </button>
        ))}
      </div>

      <div className="start-picker class-focus" role="group" aria-label="Class focus">
        <span className="start-picker-label">Focus on a class</span>
        <button aria-pressed={!focus} onClick={() => onClassChange("")}>
          <span className="start-name">None</span>
        </button>
        {CLASSES.map((c) => (
          <button
            key={c.id}
            aria-pressed={focus?.id === c.id}
            onClick={() => onClassChange(c.id)}
            style={{ "--class-color": c.color } as React.CSSProperties}
            title={c.name}
          >
            <Icon name={c.icon ?? `classicon_${c.id}`} label={c.name} size={24} className="round" />
            <span className="start-name">{c.name}</span>
          </button>
        ))}
      </div>

      <div className="summary guide-summary">
        <h2 className="class-name">{guide.name} guide</h2>
        <div className="stat">
          <span className="label">Faction</span>
          <span className="value">Horde</span>
        </div>
        <div className="stat">
          <span className="label">Skill</span>
          <span className="value">1–{MAX_SKILL}</span>
        </div>
      </div>

      <GuideNav
        sections={sections}
        field={{
          id: "profession-skill",
          label: "My skill",
          max: MAX_SKILL,
          value: skillInput,
          onChange: setSkillInput,
        }}
      />

      <section className="guide-panel" aria-labelledby="profession-title">
        <h3 id="profession-title" className="panel-title">
          Leveling {guide.name} 1–{MAX_SKILL}
        </h3>
        <p className="spec-summary">{guide.intro}</p>
        <Trainers guide={guide} skill={skill} />
        {pairs && (
          <label className="skip-toggle enchanter-toggle">
            <input type="checkbox" checked={enchanter} onChange={(e) => setEnchanter(e.target.checked)} /> I also level
            Enchanting: disenchant the greens instead of selling them
          </label>
        )}
        <Route guide={route} skill={skill} focus={focus} classRecipes={classRecipes} enchanter={pairs && enchanter} />
        <Materials guide={route} skill={skill} enchanter={pairs && enchanter} />
      </section>

      {focus && <ClassItems guide={guide} cls={focus} skill={skill} />}

      <KeyRecipes guide={guide} skill={skill} />

      <section id="profession-tips" tabIndex={-1} className="guide-panel guide-section" aria-labelledby="tips-title">
        <h3 id="tips-title" className="panel-title">
          How {guide.name} works in Forever
        </h3>
        <dl className="mechanics">
          {guide.tips.map((t) => (
            <div key={t.title}>
              <dt>{t.title}</dt>
              <dd>{t.text}</dd>
            </div>
          ))}
        </dl>
      </section>

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
        . Steps marked “Not confirmed” follow Classic until Blizzard publishes Forever data for them. Not affiliated
        with Blizzard Entertainment.
      </footer>
    </main>
  );
}

function Trainers({ guide, skill }: { guide: ProfessionGuide; skill: number | null }) {
  const next = skill === null ? undefined : nextTier(guide, skill);
  return (
    <div id="profession-trainers" tabIndex={-1} className="guide-sub guide-section">
      <h4 className="sub-title">Trainers</h4>
      <p className="panel-intro">
        Each rank raises the skill cap. Learn the next one as soon as you reach its skill, or skill points are wasted.
      </p>
      <ol className="profession-tiers">
        {guide.tiers.map((t) => {
          const state = skill === null ? "" : t.skill <= skill ? "done" : t === next ? "next" : "";
          return (
            <li key={t.name} className={`profession-tier ${state}`} aria-label={t.name}>
              <div className="spell-head">
                <strong>{t.name}</strong>
                <span className="spell-school">
                  skill {t.skill || 1}–{t.cap}
                </span>
                <span className="spell-school">level {t.level}+</span>
                {state === "next" && <span className="level-tag">next</span>}
              </div>
              <ul className="spell-ranks">
                {t.trainers.map((tr) => (
                  <li key={tr}>{tr}</li>
                ))}
              </ul>
              {t.note && <p className="spell-ranks train-note">{t.note}</p>}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

/** Learn skill and colour thresholds where published, e.g. "learn 1 · 25 37 50". */
function ColorScale({ recipe }: { recipe: Recipe }) {
  if (!recipe.colors) return recipe.learn ? <span>learn at {recipe.learn}</span> : null;
  const [yellow, green, grey] = recipe.colors;
  const orange = recipe.learn ?? "?";
  return (
    <span
      className="recipe-colors"
      aria-label={`Orange from ${orange}, yellow ${yellow}, green ${green}, grey ${grey}`}
    >
      <span className="rc-orange">{orange}</span>
      <span className="rc-yellow">{yellow}</span>
      <span className="rc-green">{green}</span>
      <span className="rc-grey">{grey}</span>
    </span>
  );
}

/** Joins the non-empty parts of a detail line with middle dots. */
function Details({ parts }: { parts: React.ReactNode[] }) {
  const shown = parts.filter(Boolean);
  if (shown.length === 0) return null;
  return (
    <p className="spell-ranks">
      {shown.map((p, i) => (
        <span key={i}>
          {i > 0 && " · "}
          {p}
        </span>
      ))}
    </p>
  );
}

const materialList = (guide: ProfessionGuide, recipe: Recipe) =>
  recipe.materials.map((m) => `${m.count} ${findMaterial(guide, m.material)?.name ?? m.material}`).join(", ");

interface RouteProps {
  guide: ProfessionGuide;
  skill: number | null;
  focus?: WowClass;
  /** Recipes whose result the focused class uses. */
  classRecipes: Set<string>;
  /** Shows what each green step disenchants into and marks the Enchanting-paired swaps. */
  enchanter: boolean;
}

function Route({ guide, skill, focus, classRecipes, enchanter }: RouteProps) {
  const current = skill === null ? undefined : stepAt(guide, skill);
  const currentRecipe = current && findRecipe(guide, current.recipe);
  const tier = skill === null ? undefined : nextTier(guide, skill);
  const color = current && currentRecipe && skill !== null ? recipeColor(currentRecipe, skill) : undefined;

  return (
    <div id="profession-route" tabIndex={-1} className="guide-sub guide-section">
      <h4 className="sub-title">Leveling route</h4>
      <p className="panel-intro">
        What to make at each skill, with how many crafts it usually takes. The four numbers are the skill at which a
        recipe turns <span className="rc-orange">orange</span>, <span className="rc-yellow">yellow</span>,{" "}
        <span className="rc-green">green</span> and <span className="rc-grey">grey</span>: orange always gives a point,
        yellow nearly always, green rarely and grey never.
      </p>
      {skill !== null && (
        <p className="training-next" role="status" aria-label="What to make now">
          {current && currentRecipe ? (
            <>
              At skill {skill}: make {remainingCrafts(current, skill)} × {currentRecipe.name}
              {color && ` (${COLOR_LABEL[color]})`} to reach {current.to}.
              {tier && (
                <>
                  {" "}
                  Next trainer rank: {tier.name} at skill {tier.skill} (level {tier.level}).
                </>
              )}
            </>
          ) : (
            <>You have finished the route at skill {skill}.</>
          )}
        </p>
      )}
      <ol className="gear-list profession-route">
        {guide.steps.map((step) => {
          const recipe = findRecipe(guide, step.recipe)!;
          const state = skill === null ? "" : step.to <= skill ? "done" : step === current ? "now" : "";
          return (
            <li
              key={`${step.from}-${step.recipe}`}
              className={`gear craft-step ${state}`}
              aria-label={`Skill ${step.from}–${step.to}: ${recipe.name}`}
              aria-current={state === "now" ? "step" : undefined}
            >
              <span className="step-levels">
                {step.from}–{step.to}
              </span>
              <Icon name={recipe.icon} label={recipe.name} size={36} />
              <div className="spell-body">
                <div className="spell-head">
                  <strong className="spell-name">
                    {step.crafts} × {recipe.name}
                  </strong>
                  {recipe.source !== "trainer" && (
                    <span className={`gear-source ${recipe.source}`}>{SOURCE_LABEL[recipe.source]}</span>
                  )}
                  {recipe.isNew && <span className="new-badge inline">NEW</span>}
                  {focus && classRecipes.has(recipe.id) && (
                    <span className="class-tag" style={{ "--tag-color": focus.color } as React.CSSProperties}>
                      {focus.name}
                    </span>
                  )}
                  {(step as ActiveStep).swapped && <span className="gear-source favor">For enchanters</span>}
                  {state === "now" && <span className="gear-status now">Now</span>}
                </div>
                <p className="spell-desc">{materialList(guide, recipe)}</p>
                {enchanter && recipe.disenchant && (
                  <p className="spell-ranks disenchant-yield">
                    Disenchant all {step.crafts}: about{" "}
                    {recipe.disenchant
                      .map(
                        (d) =>
                          `${Math.round(d.count * step.crafts)} ${findMaterial(guide, d.material)?.name ?? d.material}`,
                      )
                      .join(", ")}
                  </p>
                )}
                <Details
                  parts={[
                    <ColorScale key="c" recipe={recipe} />,
                    recipe.tools && `needs ${recipe.tools.join(", ")}`,
                    recipe.where,
                  ]}
                />
                {step.note && <p className="spell-ranks train-note">{step.note}</p>}
                {[step.unconfirmed, recipe.unconfirmed].filter(Boolean).map((u) => (
                  <p key={u} className="step-unconfirmed">
                    Not confirmed: {u}
                  </p>
                ))}
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function Materials({ guide, skill, enchanter }: { guide: ProfessionGuide; skill: number | null; enchanter: boolean }) {
  const needs = useMemo(() => materialsNeeded(guide, skill ?? 1), [guide, skill]);
  const yields = useMemo(() => (enchanter ? disenchantYield(guide, skill ?? 1) : []), [guide, skill, enchanter]);
  return (
    <div id="profession-materials" tabIndex={-1} className="guide-sub guide-section">
      <h4 className="sub-title">
        {skill === null ? "Materials for the whole route" : `Materials from skill ${skill}`}
      </h4>
      <p className="panel-intro">
        Totals for the route above; expect a few more where a step relies on yellow recipes.
      </p>
      {needs.length === 0 ? (
        <p className="panel-intro">Nothing left to buy.</p>
      ) : (
        <ul className="material-list">
          {needs.map(({ material, count }) => (
            <li key={material.id}>
              <Icon name={material.icon} label={material.name} size={28} />
              <span className="material-count">{count}</span>
              <span className="material-name">{material.name}</span>
              <span className="material-source">{material.source}</span>
            </li>
          ))}
        </ul>
      )}
      {yields.length > 0 && (
        <>
          <h4 className="sub-title">Disenchanting the route's greens</h4>
          <p className="panel-intro">
            What the greens above break into, plus the odd shard. Vendors pay 1 copper for Enchanting materials in
            Forever, so every green you disenchant costs its vendor price instead: worth it for materials your
            Enchanting needs and would otherwise buy.
          </p>
          <ul className="material-list" aria-label="Disenchant yield">
            {yields.map(({ material, count }) => (
              <li key={material.id}>
                <Icon name={material.icon} label={material.name} size={28} />
                <span className="material-count">{count}</span>
                <span className="material-name">{material.name}</span>
                <span className="material-source">{material.source}</span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function KeyRecipes({ guide, skill }: { guide: ProfessionGuide; skill: number | null }) {
  return (
    <section
      id="profession-recipes"
      tabIndex={-1}
      className="guide-panel guide-section"
      aria-labelledby="recipes-title"
    >
      <h3 id="recipes-title" className="panel-title">
        Recipes worth getting
      </h3>
      <p className="panel-intro">
        What to make for yourself or to sell once you have the skill, and where the Horde learns it.
      </p>
      <ul className="gear-list">
        {guide.keyRecipes.map(({ recipe: id, why }) => {
          const recipe = findRecipe(guide, id)!;
          const learnable = skill !== null && recipe.learn !== undefined && skill >= recipe.learn;
          return (
            <li key={id} className={`gear ${learnable ? "now" : ""}`} aria-label={recipe.name}>
              <span className="step-levels">{recipe.learn ?? "–"}</span>
              <Icon name={recipe.icon} label={recipe.name} size={36} />
              <div className="spell-body">
                <div className="spell-head">
                  <strong className="spell-name">{recipe.name}</strong>
                  <span className={`gear-source ${recipe.source}`}>{SOURCE_LABEL[recipe.source]}</span>
                  {recipe.isNew && <span className="new-badge inline">NEW</span>}
                  {learnable && <span className="gear-status now">Learnable</span>}
                </div>
                <p className="spell-desc">{why}</p>
                <Details parts={[materialList(guide, recipe), recipe.where]} />
                {recipe.unconfirmed && <p className="step-unconfirmed">Not confirmed: {recipe.unconfirmed}</p>}
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

/** Items the profession makes for one class, with the level to use them and what it takes to make them. */
function ClassItems({ guide, cls, skill }: { guide: ProfessionGuide; cls: WowClass; skill: number | null }) {
  const items = guide.classItems?.[cls.id];
  const covered = Object.keys(guide.classItems ?? {});
  const sorted = [...(items ?? [])].sort(
    (a, b) =>
      (findRecipe(guide, a.recipe)?.learn ?? 1) - (findRecipe(guide, b.recipe)?.learn ?? 1) ||
      a.level - b.level ||
      a.name.localeCompare(b.name),
  );
  return (
    <section
      id="profession-class"
      tabIndex={-1}
      className="guide-panel guide-section"
      aria-labelledby="class-items-title"
    >
      <h3 id="class-items-title" className="panel-title" style={{ "--class-color": cls.color } as React.CSSProperties}>
        {guide.name} for {cls.name}s
      </h3>
      {!items ? (
        <p className="panel-intro">
          {cls.name} items coming soon. So far this covers{" "}
          {covered.map((id, i) => (
            <span key={id}>
              {i > 0 && ", "}
              {findClass(id)?.name ?? id}
            </span>
          ))}
          .
        </p>
      ) : (
        <>
          <p className="panel-intro">
            What {guide.name} makes that a {cls.name} uses while leveling, in the order your skill reaches it. Each
            shows the skill needed to make it and the level needed to use it. Trainer recipes come with your rank; the
            others need a pattern or formula bought or found first.
          </p>
          <ul className="gear-list class-items">
            {sorted.map((item) => {
              const recipe = findRecipe(guide, item.recipe)!;
              const learn = recipe.learn ?? 1;
              const makeable = skill !== null && skill >= learn;
              return (
                <li key={item.recipe} className={`gear class-item ${makeable ? "now" : ""}`} aria-label={item.name}>
                  <div className="item-reqs">
                    <span className="req req-skill" aria-label={`Skill ${learn}`}>
                      <span className="req-label">Skill</span>
                      <span className="req-value">{learn}</span>
                    </span>
                    <span className="req req-level" aria-label={item.level > 1 ? `Level ${item.level}` : "Any level"}>
                      <span className="req-label">Level</span>
                      <span className="req-value">{item.level > 1 ? item.level : "Any"}</span>
                    </span>
                  </div>
                  <Icon name={item.icon ?? recipe.icon} label={item.name} size={36} />
                  <div className="spell-body">
                    <div className="spell-head">
                      {item.url ? (
                        <a className={`gear-name q-${item.quality}`} href={item.url} target="_blank" rel="noreferrer">
                          {item.name}
                        </a>
                      ) : (
                        <strong className={`gear-name q-${item.quality}`}>{item.name}</strong>
                      )}
                      <span className="spell-school">{item.slot}</span>
                      <span className={`gear-source ${recipe.source}`}>{SOURCE_LABEL[recipe.source]}</span>
                      {item.bindsOnPickup && <span className="spell-school">Soulbound</span>}
                      {makeable && <span className="gear-status now">Can make</span>}
                    </div>
                    <p className="spell-desc">{item.stats}</p>
                    <Details
                      parts={[
                        recipe.source === "trainer"
                          ? "no pattern to buy"
                          : recipe.cost && `pattern costs ${recipe.cost}`,
                        recipe.where,
                      ]}
                    />
                    <Details parts={[materialList(guide, recipe)]} />
                    <p className="spell-ranks train-note">{item.why}</p>
                    {recipe.unconfirmed && <p className="step-unconfirmed">Not confirmed: {recipe.unconfirmed}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </section>
  );
}
