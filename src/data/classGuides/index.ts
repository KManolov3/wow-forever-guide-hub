import type { ClassGuide } from "./types";
import { WARLOCK_GUIDE } from "./warlock";

/** Class guides by class id; classes without an entry show a "coming soon" note. */
export const CLASS_GUIDES: Record<string, ClassGuide> = {
  [WARLOCK_GUIDE.classId]: WARLOCK_GUIDE,
};
