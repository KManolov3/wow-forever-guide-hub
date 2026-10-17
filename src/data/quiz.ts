/** Playstyle traits a spec can have; quiz answers award points to specs with matching traits. */
export type Trait =
  | "tank"
  | "healer"
  | "melee"
  | "ranged"
  | "caster"
  | "hybrid"
  | "solo"
  | "group"
  | "pvp"
  | "pet"
  | "simple"
  | "complex"
  | "burst"
  | "dot"
  | "cc"
  | "support"
  | "durable"
  | "fragile"
  | "self-heal"
  | "martial"
  | "arcane"
  | "elements"
  | "nature"
  | "holy"
  | "shadow"
  | "stealth";

export type Faction = "alliance" | "horde";

export interface QuizOption {
  id: string;
  label: string;
  /** Points awarded to a spec for each trait it has; negative weights count against it. */
  weights: Partial<Record<Trait, number>>;
  /** Shown in the results when this answer counted towards a recommendation. */
  reason?: string;
  /** Restricts recommendations to classes available to this faction. */
  faction?: Faction;
}

export interface QuizQuestion {
  id: string;
  prompt: string;
  options: QuizOption[];
}

export interface SpecProfile {
  classId: string;
  treeId: string;
  traits: Trait[];
}

/** Classes limited to one faction; every other class is available to both. */
export const FACTION_CLASSES: Record<string, Faction> = {
  paladin: "alliance",
  shaman: "horde",
};

export const QUIZ: QuizQuestion[] = [
  {
    id: "role",
    prompt: "What do you want to do in a dungeon group?",
    options: [
      { id: "tank", label: "Hold the enemies' attention and take the hits", weights: { tank: 4 }, reason: "You want to tank" },
      { id: "healer", label: "Keep everyone alive", weights: { healer: 4 }, reason: "You want to heal" },
      { id: "melee", label: "Deal damage up close", weights: { melee: 4 }, reason: "You like melee damage" },
      { id: "ranged", label: "Shoot from a distance with a bow or gun", weights: { ranged: 4 }, reason: "You like ranged weapons" },
      { id: "caster", label: "Cast damaging spells from afar", weights: { caster: 4 }, reason: "You like casting spells" },
      { id: "hybrid", label: "A bit of everything", weights: { hybrid: 4 }, reason: "You want to switch roles" },
    ],
  },
  {
    id: "fantasy",
    prompt: "Which fantasy speaks to you most?",
    options: [
      { id: "martial", label: "A master of weapons and combat", weights: { martial: 3 }, reason: "Weapon mastery fits your fantasy" },
      { id: "arcane", label: "A scholar of arcane magic", weights: { arcane: 3 }, reason: "Arcane magic fits your fantasy" },
      { id: "elements", label: "Commanding fire, frost and lightning", weights: { elements: 3 }, reason: "Elemental power fits your fantasy" },
      { id: "nature", label: "A guardian of nature and the wild", weights: { nature: 3 }, reason: "Nature fits your fantasy" },
      { id: "holy", label: "A champion of the Light", weights: { holy: 3 }, reason: "The Light fits your fantasy" },
      { id: "shadow", label: "Wielding shadow and dark pacts", weights: { shadow: 3 }, reason: "Shadow magic fits your fantasy" },
      { id: "stealth", label: "Striking unseen from the shadows", weights: { stealth: 3 }, reason: "Stealth fits your fantasy" },
    ],
  },
  {
    id: "content",
    prompt: "Where will you spend most of your time?",
    options: [
      { id: "solo", label: "Questing and levelling on my own", weights: { solo: 2 }, reason: "Strong when playing solo" },
      { id: "group", label: "Dungeons and raids", weights: { group: 2 }, reason: "Valued in dungeons and raids" },
      { id: "pvp", label: "Battlegrounds and world PvP", weights: { pvp: 2 }, reason: "Strong in PvP" },
    ],
  },
  {
    id: "pet",
    prompt: "How do you feel about a permanent pet companion?",
    options: [
      { id: "yes", label: "I want a loyal companion at my side", weights: { pet: 3 }, reason: "Fights alongside a pet" },
      { id: "neutral", label: "No preference", weights: {} },
      { id: "no", label: "I'd rather fight alone", weights: { pet: -3 } },
    ],
  },
  {
    id: "complexity",
    prompt: "How involved do you want your rotation to be?",
    options: [
      { id: "simple", label: "Easy to pick up, so I can focus on the world", weights: { simple: 2 }, reason: "Easy to pick up" },
      { id: "neutral", label: "Somewhere in between", weights: {} },
      { id: "complex", label: "Lots of tools to master", weights: { complex: 2 }, reason: "Lots of tools to master" },
    ],
  },
  {
    id: "style",
    prompt: "What does a good fight look like to you?",
    options: [
      { id: "burst", label: "Huge hits that end it quickly", weights: { burst: 2 }, reason: "Big burst damage" },
      { id: "dot", label: "Wearing enemies down over time", weights: { dot: 2 }, reason: "Damage over time" },
      { id: "cc", label: "Controlling the battlefield", weights: { cc: 2 }, reason: "Plenty of crowd control" },
      { id: "support", label: "Making my allies stronger", weights: { support: 2 }, reason: "Supports and buffs allies" },
    ],
  },
  {
    id: "survival",
    prompt: "How do you like to survive?",
    options: [
      { id: "durable", label: "Heavy armour, hard to kill", weights: { durable: 2 }, reason: "Hard to kill" },
      { id: "self-heal", label: "Healing myself between and during fights", weights: { "self-heal": 2 }, reason: "Can heal itself" },
      { id: "fragile", label: "Glass cannon: kill them before they reach me", weights: { fragile: 2 }, reason: "A glass cannon" },
    ],
  },
  {
    id: "faction",
    prompt: "Which faction will you play?",
    options: [
      { id: "alliance", label: "Alliance", weights: {}, faction: "alliance" },
      { id: "horde", label: "Horde", weights: {}, faction: "horde" },
      { id: "either", label: "Not decided yet", weights: {} },
    ],
  },
];

export const SPECS: SpecProfile[] = [
  { classId: "druid", treeId: "balance", traits: ["caster", "hybrid", "arcane", "nature", "complex", "support", "self-heal"] },
  { classId: "druid", treeId: "feral-combat", traits: ["tank", "melee", "hybrid", "nature", "stealth", "solo", "durable", "self-heal"] },
  { classId: "druid", treeId: "restoration", traits: ["healer", "hybrid", "nature", "group", "dot", "support"] },
  { classId: "hunter", treeId: "beast-mastery", traits: ["ranged", "pet", "nature", "solo", "simple"] },
  { classId: "hunter", treeId: "marksmanship", traits: ["ranged", "group", "pvp", "burst", "simple", "support"] },
  { classId: "hunter", treeId: "survival", traits: ["ranged", "nature", "pvp", "cc", "complex"] },
  { classId: "mage", treeId: "arcane", traits: ["caster", "arcane", "burst", "complex", "fragile", "support"] },
  { classId: "mage", treeId: "fire", traits: ["caster", "elements", "burst", "group", "simple", "fragile"] },
  { classId: "mage", treeId: "frost", traits: ["caster", "elements", "cc", "solo", "pvp", "fragile"] },
  { classId: "paladin", treeId: "holy", traits: ["healer", "holy", "group", "durable", "simple", "support"] },
  { classId: "paladin", treeId: "protection", traits: ["tank", "holy", "group", "durable", "self-heal", "support"] },
  { classId: "paladin", treeId: "retribution", traits: ["melee", "hybrid", "holy", "martial", "solo", "durable", "self-heal", "simple"] },
  { classId: "priest", treeId: "discipline", traits: ["healer", "holy", "pvp", "complex", "support"] },
  { classId: "priest", treeId: "holy", traits: ["healer", "holy", "group", "simple"] },
  { classId: "priest", treeId: "shadow", traits: ["caster", "shadow", "dot", "solo", "pvp", "self-heal", "cc"] },
  { classId: "rogue", treeId: "assassination", traits: ["melee", "stealth", "shadow", "burst", "dot", "pvp"] },
  { classId: "rogue", treeId: "combat", traits: ["melee", "martial", "group", "simple"] },
  { classId: "rogue", treeId: "subtlety", traits: ["melee", "stealth", "shadow", "cc", "pvp", "complex"] },
  { classId: "shaman", treeId: "elemental", traits: ["caster", "hybrid", "elements", "burst", "pvp", "support"] },
  { classId: "shaman", treeId: "enhancement", traits: ["melee", "hybrid", "elements", "martial", "burst", "solo", "durable"] },
  { classId: "shaman", treeId: "restoration", traits: ["healer", "hybrid", "elements", "nature", "group", "support", "durable"] },
  { classId: "warlock", treeId: "affliction", traits: ["caster", "shadow", "pet", "dot", "cc", "solo", "complex", "self-heal"] },
  { classId: "warlock", treeId: "demonology", traits: ["caster", "shadow", "pet", "solo", "durable", "simple"] },
  { classId: "warlock", treeId: "destruction", traits: ["caster", "shadow", "elements", "pet", "burst", "group", "fragile"] },
  { classId: "warrior", treeId: "arms", traits: ["melee", "martial", "burst", "pvp", "durable"] },
  { classId: "warrior", treeId: "fury", traits: ["melee", "martial", "group", "complex"] },
  { classId: "warrior", treeId: "protection", traits: ["tank", "martial", "group", "durable", "complex"] },
];
