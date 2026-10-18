import { ENCHANTING_GUIDE } from "./enchanting";
import { PROFESSION_IDS } from "./ids";
import { TAILORING_GUIDE } from "./tailoring";
import type { ProfessionGuide } from "./types";

const ALL = [TAILORING_GUIDE, ENCHANTING_GUIDE];

/** Profession guides in picker order. */
export const PROFESSION_GUIDES: ProfessionGuide[] = PROFESSION_IDS.map((id) => ALL.find((g) => g.id === id)!);

export function findProfession(id: string): ProfessionGuide | undefined {
  return PROFESSION_GUIDES.find((g) => g.id === id);
}
