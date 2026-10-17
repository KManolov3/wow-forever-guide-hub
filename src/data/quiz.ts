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
    prompt: "The dungeon group finally has five people. Twenty minutes later, where are you?",
    options: [
      {
        id: "tank",
        label: "Marking skull, pulling before anyone has mana, and typing \"heal pls\" mid-pull",
        weights: { tank: 4 },
        reason: "You were born to mark skull and pull early",
      },
      {
        id: "healer",
        label: "Staring at green bars and silently judging who keeps standing in the fire",
        weights: { healer: 4 },
        reason: "Green bars are your love language",
      },
      {
        id: "melee",
        label: "Glued to the boss's backside, eating cleaves, refusing to move out of anything",
        weights: { melee: 4 },
        reason: "You're allergic to being more than five yards from the boss",
      },
      {
        id: "ranged",
        label: "Way back at 35 yards, rolling Need on that two-hander \"for the stats\"",
        weights: { ranged: 4 },
        reason: "You keep a healthy 35 yards between you and responsibility",
      },
      {
        id: "caster",
        label: "Standing perfectly still turning mana into numbers, then asking who has water",
        weights: { caster: 4 },
        reason: "You turn mana into numbers and you're good at it",
      },
      {
        id: "hybrid",
        label: "Whatever the group is missing. I carry four sets of gear and zero bag space",
        weights: { hybrid: 4 },
        reason: "Four gear sets and no bag space: a true hybrid",
      },
    ],
  },
  {
    id: "fantasy",
    prompt: "You've joined an RP server. Your character's backstory opens with…",
    options: [
      {
        id: "martial",
        label: "\"Raised among Arathi steel. Has never read a book. Has broken several.\"",
        weights: { martial: 3 },
        reason: "You solve problems with sharp metal",
      },
      {
        id: "arcane",
        label: "\"Graduated from Dalaran. Still paying off the student loans.\"",
        weights: { arcane: 3 },
        reason: "Dalaran tuition was worth every copper",
      },
      {
        id: "elements",
        label: "\"The fire spoke to them. So did the wind. They should probably see someone about that.\"",
        weights: { elements: 3 },
        reason: "The elements talk to you (and you talk back)",
      },
      {
        id: "nature",
        label: "\"Sleeps in a moonwell. Trusts trees more than people. Has a point.\"",
        weights: { nature: 3 },
        reason: "You trust trees more than people",
      },
      {
        id: "holy",
        label: "\"Blessed by the Light, and will mention it in every single conversation.\"",
        weights: { holy: 3 },
        reason: "The Light chose you and you won't shut up about it",
      },
      {
        id: "shadow",
        label: "\"Hears whispers. It's fine. Everything is fine. Don't ask about the whispers.\"",
        weights: { shadow: 3 },
        reason: "The whispers approve",
      },
      {
        id: "stealth",
        label: "\"Unknown. No one has ever actually seen them.\"",
        weights: { stealth: 3 },
        reason: "Nobody has ever actually seen you",
      },
    ],
  },
  {
    id: "content",
    prompt: "It's Saturday night on your server. Where do we find you?",
    options: [
      {
        id: "solo",
        label: "Grinding furbolgs in Felwood with a podcast on. Do not invite me to anything",
        weights: { solo: 2 },
        reason: "Your guild has forgotten what your voice sounds like",
      },
      {
        id: "group",
        label: "Molten Core. It's been Molten Core for four hours. The rogues are still arguing about the Core Hound pack",
        weights: { group: 2 },
        reason: "You have the patience of a forty-man raid",
      },
      {
        id: "pvp",
        label: "Tarren Mill. Southshore is on fire and honestly it's beautiful",
        weights: { pvp: 2 },
        reason: "You think Southshore looks better on fire",
      },
    ],
  },
  {
    id: "pet",
    prompt: "Someone links a rare vanity pet in trade chat. Your honest reaction?",
    options: [
      {
        id: "yes",
        label: "\"Cute. Can it tank?\" I want a sidekick that takes the hits and the blame",
        weights: { pet: 3 },
        reason: "You want a sidekick to take the hits and the blame",
      },
      { id: "neutral", label: "I whisper the seller a lowball offer and move on with my life", weights: {} },
      {
        id: "no",
        label: "Pets path into the next pack and get everyone killed. I travel alone",
        weights: { pet: -3 },
      },
    ],
  },
  {
    id: "complexity",
    prompt: "Be honest: how many action bars are on your screen right now?",
    options: [
      {
        id: "simple",
        label: "One. The \"1\" key is worn smooth and I've never needed more",
        weights: { simple: 2 },
        reason: "You've been pressing the same button since 2004 and it still works",
      },
      { id: "neutral", label: "Enough. Some keybound, some clicked, and I've made peace with my clicking", weights: {} },
      {
        id: "complex",
        label: "All of them, plus an addon that adds more bars and one that screams at me",
        weights: { complex: 2 },
        reason: "Your UI looks like an airplane cockpit",
      },
    ],
  },
  {
    id: "style",
    prompt: "Someone challenges you to a duel outside the capital gates. It ends with…",
    options: [
      {
        id: "burst",
        label: "Them dead before the duel flag has finished falling",
        weights: { burst: 2 },
        reason: "Your fights are over before the flag lands",
      },
      {
        id: "dot",
        label: "Them slowly realising every tick hurts and there's nothing they can do about it",
        weights: { dot: 2 },
        reason: "You enjoy watching the ticks add up",
      },
      {
        id: "cc",
        label: "Them rooted, feared, stunned and typing angrily in /say",
        weights: { cc: 2 },
        reason: "Your opponents spend most fights not playing",
      },
      {
        id: "support",
        label: "Nobody. I got distracted buffing the crowd. Free buffs build friendships",
        weights: { support: 2 },
        reason: "You hand out free buffs to strangers",
      },
    ],
  },
  {
    id: "survival",
    prompt: "The raid wipes on the last boss. Who's the last one standing?",
    options: [
      {
        id: "durable",
        label: "Me. Encased in metal, on 3% health, refusing to die out of pure spite",
        weights: { durable: 2 },
        reason: "You refuse to die out of pure spite",
      },
      {
        id: "self-heal",
        label: "Me, because I quietly healed myself while the healer was busy with the tank",
        weights: { "self-heal": 2 },
        reason: "You don't need a healer, you need a mirror",
      },
      {
        id: "fragile",
        label: "Not me. I pulled aggro in the first three seconds, but what a crit it was",
        weights: { fragile: 2 },
        reason: "You'd rather die to a crit than live without one",
      },
    ],
  },
  {
    id: "faction",
    prompt: "Last one. Where do you hearth to?",
    options: [
      { id: "alliance", label: "Goldshire. Don't ask what happens at the inn", weights: {}, faction: "alliance" },
      { id: "horde", label: "Orgrimmar. Jumping on the bank roof is cardio", weights: {}, faction: "horde" },
      { id: "either", label: "Wherever the queue is shorter. Loyalty is for guild banks", weights: {} },
    ],
  },
];

/** One-line send-off shown with the best match. */
export const CLASS_TAGLINES: Record<string, string> = {
  druid: "Four forms, every role, and a strong opinion about how each one is played.",
  hunter: "Your pet does the work, you take the loot, and you've never once been wrong about it.",
  mage: "Portals, water and Polymorph. Everyone will need you; nobody will tip.",
  paladin: "Bubble, hearthstone, a blessing for every occasion. The Light has your back.",
  priest: "You decide who lives. Try not to let it go to your head. Too much.",
  rogue: "They'll never see you coming, and they'll never stop complaining about it.",
  shaman: "Totems, Windfury, and one crit the whole server will still be talking about next week.",
  warlock: "Soul shards fill your bags and your heart. The demons handle the rest.",
  warrior: "Rage is a resource. So is everyone else's patience while you gear up.",
};

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
