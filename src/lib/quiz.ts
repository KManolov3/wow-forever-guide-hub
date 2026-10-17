import type { WowClass } from "../data/types";
import { FACTION_CLASSES, type QuizOption, type QuizQuestion, type SpecProfile } from "../data/quiz";

/** Chosen option id per question id. */
export type Answers = Record<string, string>;

export interface ClassMatch {
  cls: WowClass;
  /** Index of the best-matching tree (spec) within the class. */
  treeIndex: number;
  score: number;
  /** Score as a share of the best score the answers allow, 0-100. */
  percent: number;
  /** Reasons from the answers that counted towards this spec, in question order. */
  reasons: string[];
}

const chosenOptions = (questions: QuizQuestion[], answers: Answers): QuizOption[] =>
  questions.flatMap((q) => q.options.filter((o) => o.id === answers[q.id]));

const optionScore = (option: QuizOption, spec: SpecProfile) =>
  spec.traits.reduce((sum, trait) => sum + (option.weights[trait] ?? 0), 0);

const maxOptionScore = (option: QuizOption) =>
  Object.values(option.weights).reduce((sum, w) => sum + Math.max(0, w), 0);

/**
 * Ranks classes by how well their best spec matches the answers, best first.
 * Classes unavailable to the chosen faction are left out; ties keep class and tree order.
 */
export function recommendClasses(
  classes: WowClass[],
  specs: SpecProfile[],
  questions: QuizQuestion[],
  answers: Answers,
): ClassMatch[] {
  const options = chosenOptions(questions, answers);
  const faction = options.find((o) => o.faction)?.faction;
  const maxScore = options.reduce((sum, o) => sum + maxOptionScore(o), 0);

  const matches = classes
    .filter((cls) => !faction || !FACTION_CLASSES[cls.id] || FACTION_CLASSES[cls.id] === faction)
    .map((cls): ClassMatch => {
      const ranked = cls.trees.map((tree, treeIndex) => {
        const spec = specs.find((s) => s.classId === cls.id && s.treeId === tree.id);
        const scores = options.map((o) => (spec ? optionScore(o, spec) : 0));
        const score = scores.reduce((a, b) => a + b, 0);
        const reasons = options.flatMap((o, i) => (scores[i] > 0 && o.reason ? [o.reason] : []));
        return { treeIndex, score, reasons };
      });
      const best = ranked.reduce((a, b) => (b.score > a.score ? b : a));
      const percent = maxScore > 0 ? Math.round((100 * Math.max(0, best.score)) / maxScore) : 0;
      return { cls, ...best, percent };
    });

  return matches.sort((a, b) => b.score - a.score);
}
