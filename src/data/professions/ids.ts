/** Ids of the professions with a guide, in picker order; kept apart from the guides so the app shell stays small. */
export const PROFESSION_IDS = ["tailoring", "enchanting"] as const;

export const DEFAULT_PROFESSION = PROFESSION_IDS[0];

export const isProfession = (id: string): boolean => (PROFESSION_IDS as readonly string[]).includes(id);
