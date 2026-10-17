import { describe, expect, it } from "vitest";
import { CLASSES } from "../data/classes";
import { CLASS_TAGLINES, FACTION_CLASSES, QUIZ, SPECS, type QuizQuestion, type SpecProfile } from "../data/quiz";
import { type Answers, recommendClasses } from "./quiz";

const recommend = (answers: Answers) => recommendClasses(CLASSES, SPECS, QUIZ, answers);
const top = (answers: Answers) => {
  const [best] = recommend(answers);
  return `${best.cls.id}/${best.cls.trees[best.treeIndex].id}`;
};

describe("quiz data", () => {
  it("has a profile for every spec of every class, and none for unknown specs", () => {
    const expected = CLASSES.flatMap((c) => c.trees.map((t) => `${c.id}/${t.id}`)).sort();
    expect(SPECS.map((s) => `${s.classId}/${s.treeId}`).sort()).toEqual(expected);
  });

  it("has unique question ids and at least two unique options per question", () => {
    expect(new Set(QUIZ.map((q) => q.id)).size).toBe(QUIZ.length);
    for (const q of QUIZ) {
      expect(q.options.length, q.id).toBeGreaterThanOrEqual(2);
      expect(new Set(q.options.map((o) => o.id)).size, q.id).toBe(q.options.length);
    }
  });

  it("has a tagline for every class", () => {
    for (const c of CLASSES) expect(CLASS_TAGLINES[c.id], c.id).toBeTruthy();
  });

  it("only restricts known classes to a faction", () => {
    for (const id of Object.keys(FACTION_CLASSES)) expect(CLASSES.map((c) => c.id)).toContain(id);
  });

  it("can recommend every class for some set of answers", () => {
    const winners = new Set<string>();
    const walk = (i: number, answers: Answers) => {
      if (i === QUIZ.length) {
        winners.add(recommend(answers)[0].cls.id);
        return;
      }
      for (const o of QUIZ[i].options) walk(i + 1, { ...answers, [QUIZ[i].id]: o.id });
    };
    walk(0, {});
    expect([...winners].sort()).toEqual(CLASSES.map((c) => c.id).sort());
  });
});

describe("recommendClasses", () => {
  const questions: QuizQuestion[] = [
    {
      id: "role",
      prompt: "Role?",
      options: [
        { id: "tank", label: "Tank", weights: { tank: 2 }, reason: "Tanks" },
        { id: "heal", label: "Heal", weights: { healer: 2 }, reason: "Heals" },
      ],
    },
    {
      id: "pet",
      prompt: "Pet?",
      options: [
        { id: "yes", label: "Yes", weights: { pet: 1 }, reason: "Has a pet" },
        { id: "no", label: "No", weights: { pet: -1 } },
      ],
    },
    {
      id: "faction",
      prompt: "Faction?",
      options: [
        { id: "alliance", label: "Alliance", weights: {}, faction: "alliance" },
        { id: "horde", label: "Horde", weights: {}, faction: "horde" },
      ],
    },
  ];
  const specs: SpecProfile[] = [
    { classId: "warrior", treeId: "protection", traits: ["tank"] },
    { classId: "paladin", treeId: "holy", traits: ["healer"] },
    { classId: "paladin", treeId: "protection", traits: ["tank", "healer"] },
    { classId: "shaman", treeId: "restoration", traits: ["healer"] },
    { classId: "warlock", treeId: "affliction", traits: ["pet"] },
    { classId: "warlock", treeId: "demonology", traits: ["pet"] },
    { classId: "warlock", treeId: "destruction", traits: ["pet"] },
  ];
  const run = (answers: Answers) => recommendClasses(CLASSES, specs, questions, answers);

  it("returns one match per class with its best spec, best first", () => {
    const result = run({ role: "tank" });
    expect(result).toHaveLength(CLASSES.length);
    expect(result[0].cls.id).toBe("paladin");
    expect(result[0].cls.trees[result[0].treeIndex].id).toBe("protection");
    expect(result[0].score).toBe(2);
  });

  it("keeps class order for ties", () => {
    const ids = run({ role: "tank" }).map((m) => m.cls.id);
    expect(ids.slice(0, 2)).toEqual(["paladin", "warrior"]);
  });

  it("reports the score as a percentage of the best the answers allow", () => {
    const [best] = run({ role: "tank", pet: "yes" });
    expect(best.score).toBe(2);
    expect(best.percent).toBe(67);
    expect(run({ pet: "yes" })[0]).toMatchObject({ percent: 100, reasons: ["Has a pet"] });
  });

  it("lists reasons only from answers that counted towards the spec", () => {
    const warlock = run({ role: "tank", pet: "yes" }).find((m) => m.cls.id === "warlock")!;
    expect(warlock.reasons).toEqual(["Has a pet"]);
  });

  it("applies negative weights and never reports a negative percentage", () => {
    const warlock = run({ pet: "no" }).find((m) => m.cls.id === "warlock")!;
    expect(warlock.score).toBe(-1);
    expect(warlock.percent).toBe(0);
    expect(run({ pet: "no" }).at(-1)!.cls.id).toBe("warlock");
  });

  it("leaves out classes unavailable to the chosen faction", () => {
    expect(run({ faction: "alliance" }).map((m) => m.cls.id)).not.toContain("shaman");
    expect(run({ faction: "horde" }).map((m) => m.cls.id)).not.toContain("paladin");
    expect(run({}).map((m) => m.cls.id)).toEqual(expect.arrayContaining(["paladin", "shaman"]));
  });

  it("ignores unknown question and option ids", () => {
    expect(run({ role: "nope", other: "x" }).every((m) => m.score === 0 && m.percent === 0)).toBe(true);
  });
});

describe("real quiz recommendations", () => {
  it("matches archetypal answer sets to the expected spec", () => {
    expect(
      top({ role: "tank", fantasy: "martial", content: "group", pet: "no", complexity: "complex", style: "cc", survival: "durable" }),
    ).toBe("warrior/protection");
    expect(top({ role: "healer", fantasy: "holy", content: "group", survival: "durable", faction: "alliance" })).toBe(
      "paladin/holy",
    );
    expect(top({ role: "ranged", fantasy: "nature", content: "solo", pet: "yes", complexity: "simple" })).toBe(
      "hunter/beast-mastery",
    );
    expect(top({ role: "melee", fantasy: "stealth", content: "pvp", pet: "no", style: "cc" })).toBe("rogue/subtlety");
    expect(top({ role: "caster", fantasy: "elements", style: "cc", survival: "fragile", pet: "no" })).toBe("mage/frost");
  });
});
