import type { WowClass } from "../types";

const CLASS_ORDER = [
  "druid",
  "hunter",
  "mage",
  "paladin",
  "priest",
  "rogue",
  "shaman",
  "warlock",
  "warrior",
];

const modules = import.meta.glob<WowClass>("./*.json", { eager: true, import: "default" });

export const CLASSES: WowClass[] = Object.values(modules).sort(
  (a, b) => CLASS_ORDER.indexOf(a.id) - CLASS_ORDER.indexOf(b.id),
);

export const findClass = (id: string) => CLASSES.find((c) => c.id === id);
