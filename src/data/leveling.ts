/** Leveling guide content: Horde zones, dungeons and the completionist route through them. */

import type { StartingZoneId } from "./startingZones";

export type Continent = "kalimdor" | "eastern-kingdoms";

/** Where a zone is drawn on its continent's schematic map, 0-100 on each axis (x east, y south). */
export interface MapPoint {
  x: number;
  y: number;
}

/** Transport hubs that link the two continents. */
export type Port = "orgrimmar" | "ratchet" | "undercity" | "gromgol" | "booty-bay";

export interface Zone {
  id: string;
  name: string;
  continent: Continent;
  /** Level range of the zone's Horde quests. */
  levels: [number, number];
  /** Horde (or neutral) quest hubs; empty when not announced. */
  hubs: string[];
  map: MapPoint;
  /** Nearest port for crossing to the other continent. */
  port: Port;
  /** Race(s) that start here; set only on starting zones. */
  startingRaces?: string;
  /** New in Forever. */
  isNew?: boolean;
  /** Level range or Horde content not confirmed by Blizzard yet. */
  unconfirmed?: string;
  /** Not drawn on the continent maps because its location is unknown. */
  offMap?: boolean;
}

export interface Dungeon {
  id: string;
  name: string;
  /** Zone the entrance is in. */
  zone: string;
  levels: [number, number];
  /** Map offset from the entrance zone's marker, in map units. */
  offset: MapPoint;
  isNew?: boolean;
  unconfirmed?: string;
}

export interface RouteStep {
  /** Zone or dungeon id. */
  place: string;
  /** Character level while doing this step. */
  levels: [number, number];
  /** Where to pick up and hand in the quests; absent when not announced. */
  hub?: string;
  /** What to do on this visit. */
  focus: string[];
}

/** A zone that is not on the map's route but is drawn for orientation. */
export interface ContextZone {
  name: string;
  continent: Continent;
  map: MapPoint;
}

export interface Exclusion {
  name: string;
  kind: "zone" | "dungeon";
  reason: string;
}

export const ZONES: Zone[] = [
  // Starting zones
  {
    id: "durotar",
    name: "Durotar",
    continent: "kalimdor",
    levels: [1, 10],
    hubs: ["Valley of Trials", "Razor Hill", "Sen'jin Village"],
    map: { x: 88, y: 44 },
    port: "orgrimmar",
    startingRaces: "Orc & Troll",
  },
  {
    id: "mulgore",
    name: "Mulgore",
    continent: "kalimdor",
    levels: [1, 10],
    hubs: ["Camp Narache", "Bloodhoof Village", "Thunder Bluff"],
    map: { x: 42, y: 57 },
    port: "orgrimmar",
    startingRaces: "Tauren",
  },
  {
    id: "tirisfal",
    name: "Tirisfal Glades",
    continent: "eastern-kingdoms",
    levels: [1, 10],
    hubs: ["Deathknell", "Brill", "Undercity"],
    map: { x: 26, y: 7 },
    port: "undercity",
    startingRaces: "Undead",
  },
  {
    id: "zephras-isle",
    name: "Zephras Isle",
    continent: "kalimdor",
    levels: [1, 12],
    hubs: [],
    map: { x: 12, y: 8 },
    port: "orgrimmar",
    startingRaces: "Skyborne (Horde)",
    isNew: true,
    unconfirmed: "Blizzard has not said where Horde Skyborne arrive after the isle; the guide assumes Orgrimmar.",
    offMap: true,
  },

  // Kalimdor
  {
    id: "barrens",
    name: "The Barrens",
    continent: "kalimdor",
    levels: [10, 33],
    hubs: ["The Crossroads", "Ratchet", "Camp Taurajo"],
    map: { x: 66, y: 50 },
    port: "ratchet",
  },
  {
    id: "stonetalon",
    name: "Stonetalon Mountains",
    continent: "kalimdor",
    levels: [15, 27],
    hubs: ["Malaka'jin", "Sun Rock Retreat"],
    map: { x: 16, y: 36 },
    port: "orgrimmar",
  },
  {
    id: "ashenvale",
    name: "Ashenvale",
    continent: "kalimdor",
    levels: [18, 30],
    hubs: ["Zoram'gar Outpost", "Splintertree Post"],
    map: { x: 42, y: 30 },
    port: "orgrimmar",
  },
  {
    id: "thousand-needles",
    name: "Thousand Needles",
    continent: "kalimdor",
    levels: [25, 37],
    hubs: ["Freewind Post", "Mirage Raceway"],
    map: { x: 62, y: 75 },
    port: "ratchet",
  },
  {
    id: "desolace",
    name: "Desolace",
    continent: "kalimdor",
    levels: [30, 40],
    hubs: ["Shadowprey Village", "Ghost Walker Post"],
    map: { x: 12, y: 54 },
    port: "orgrimmar",
  },
  {
    id: "dustwallow",
    name: "Dustwallow Marsh",
    continent: "kalimdor",
    levels: [35, 45],
    hubs: ["Brackenwall Village"],
    map: { x: 86, y: 68 },
    port: "ratchet",
  },
  {
    id: "shen-dralas",
    name: "Shen'dralas",
    continent: "kalimdor",
    levels: [40, 50],
    hubs: [],
    map: { x: 28, y: 66 },
    port: "orgrimmar",
    isNew: true,
    unconfirmed:
      "Level range and quest hubs are unannounced; preview coverage links its story to Razorfen Downs and Maraudon, so the guide slots it in the mid-40s.",
  },
  {
    id: "feralas",
    name: "Feralas",
    continent: "kalimdor",
    levels: [40, 50],
    hubs: ["Camp Mojache"],
    map: { x: 14, y: 80 },
    port: "ratchet",
  },
  {
    id: "tanaris",
    name: "Tanaris",
    continent: "kalimdor",
    levels: [40, 50],
    hubs: ["Gadgetzan", "Steamwheedle Port"],
    map: { x: 76, y: 90 },
    port: "ratchet",
  },
  {
    id: "azshara",
    name: "Azshara",
    continent: "kalimdor",
    levels: [45, 55],
    hubs: ["Valormok"],
    map: { x: 90, y: 20 },
    port: "orgrimmar",
  },
  {
    id: "un-goro",
    name: "Un'Goro Crater",
    continent: "kalimdor",
    levels: [48, 55],
    hubs: ["Marshal's Refuge"],
    map: { x: 44, y: 88 },
    port: "ratchet",
  },
  {
    id: "felwood",
    name: "Felwood",
    continent: "kalimdor",
    levels: [48, 55],
    hubs: ["Bloodvenom Post"],
    map: { x: 50, y: 14 },
    port: "orgrimmar",
  },
  {
    id: "winterspring",
    name: "Winterspring",
    continent: "kalimdor",
    levels: [53, 60],
    hubs: ["Everlook"],
    map: { x: 76, y: 8 },
    port: "orgrimmar",
  },
  {
    id: "silithus",
    name: "Silithus",
    continent: "kalimdor",
    levels: [55, 60],
    hubs: ["Cenarion Hold"],
    map: { x: 22, y: 95 },
    port: "orgrimmar",
  },
  {
    id: "mount-hyjal",
    name: "Mount Hyjal",
    continent: "kalimdor",
    levels: [60, 60],
    hubs: [],
    map: { x: 66, y: 22 },
    port: "orgrimmar",
    isNew: true,
    unconfirmed: "Endgame zone at level 60; quest hubs are not announced.",
  },

  // Eastern Kingdoms
  {
    id: "silverpine",
    name: "Silverpine Forest",
    continent: "eastern-kingdoms",
    levels: [10, 20],
    hubs: ["The Sepulcher"],
    map: { x: 12, y: 26 },
    port: "undercity",
  },
  {
    id: "hillsbrad",
    name: "Hillsbrad Foothills",
    continent: "eastern-kingdoms",
    levels: [20, 31],
    hubs: ["Tarren Mill"],
    map: { x: 26, y: 38 },
    port: "undercity",
  },
  {
    id: "alterac",
    name: "Alterac Mountains",
    continent: "eastern-kingdoms",
    levels: [30, 40],
    hubs: ["Tarren Mill"],
    map: { x: 40, y: 24 },
    port: "undercity",
  },
  {
    id: "arathi",
    name: "Arathi Highlands",
    continent: "eastern-kingdoms",
    levels: [30, 41],
    hubs: ["Hammerfall"],
    map: { x: 58, y: 40 },
    port: "undercity",
  },
  {
    id: "stranglethorn",
    name: "Stranglethorn Vale",
    continent: "eastern-kingdoms",
    levels: [30, 45],
    hubs: ["Grom'gol Base Camp", "Nesingwary's Expedition", "Booty Bay"],
    map: { x: 28, y: 93 },
    port: "gromgol",
  },
  {
    id: "badlands",
    name: "Badlands",
    continent: "eastern-kingdoms",
    levels: [35, 45],
    hubs: ["Kargath"],
    map: { x: 76, y: 62 },
    port: "gromgol",
  },
  {
    id: "swamp-of-sorrows",
    name: "Swamp of Sorrows",
    continent: "eastern-kingdoms",
    levels: [35, 45],
    hubs: ["Stonard"],
    map: { x: 70, y: 86 },
    port: "gromgol",
  },
  {
    id: "riverglades",
    name: "Riverglades",
    continent: "eastern-kingdoms",
    levels: [35, 45],
    hubs: ["Neutral goblin port"],
    map: { x: 90, y: 76 },
    port: "gromgol",
    isNew: true,
    unconfirmed: "Level range comes from preview coverage (mid-30s to mid-40s); Horde quest hubs are not announced.",
  },
  {
    id: "hinterlands",
    name: "The Hinterlands",
    continent: "eastern-kingdoms",
    levels: [40, 50],
    hubs: ["Revantusk Village"],
    map: { x: 76, y: 26 },
    port: "undercity",
  },
  {
    id: "searing-gorge",
    name: "Searing Gorge",
    continent: "eastern-kingdoms",
    levels: [43, 50],
    hubs: ["Thorium Point", "Kargath"],
    map: { x: 44, y: 58 },
    port: "gromgol",
  },
  {
    id: "blasted-lands",
    name: "Blasted Lands",
    continent: "eastern-kingdoms",
    levels: [45, 55],
    hubs: ["Neutral questgivers by the Dark Portal"],
    map: { x: 74, y: 97 },
    port: "gromgol",
  },
  {
    id: "burning-steppes",
    name: "Burning Steppes",
    continent: "eastern-kingdoms",
    levels: [50, 58],
    hubs: ["Flame Crest"],
    map: { x: 44, y: 77 },
    port: "gromgol",
  },
  {
    id: "western-plaguelands",
    name: "Western Plaguelands",
    continent: "eastern-kingdoms",
    levels: [51, 58],
    hubs: ["The Bulwark"],
    map: { x: 52, y: 9 },
    port: "undercity",
  },
  {
    id: "eastern-plaguelands",
    name: "Eastern Plaguelands",
    continent: "eastern-kingdoms",
    levels: [53, 60],
    hubs: ["Light's Hope Chapel"],
    map: { x: 82, y: 9 },
    port: "undercity",
  },
];

export const DUNGEONS: Dungeon[] = [
  { id: "ragefire-chasm", name: "Ragefire Chasm", zone: "durotar", levels: [13, 18], offset: { x: -3, y: -6 } },
  {
    id: "ruins-of-lordaeron",
    name: "Ruins of Lordaeron",
    zone: "tirisfal",
    levels: [15, 20],
    offset: { x: 2, y: 10 },
    isNew: true,
    unconfirmed: "Level range from preview coverage; quest givers not announced.",
  },
  { id: "wailing-caverns", name: "Wailing Caverns", zone: "barrens", levels: [17, 24], offset: { x: -7, y: -6 } },
  { id: "blackfathom-deeps", name: "Blackfathom Deeps", zone: "ashenvale", levels: [24, 32], offset: { x: -10, y: -6 } },
  { id: "shadowfang-keep", name: "Shadowfang Keep", zone: "silverpine", levels: [22, 30], offset: { x: 8, y: -6 } },
  { id: "razorfen-kraul", name: "Razorfen Kraul", zone: "barrens", levels: [30, 40], offset: { x: -7, y: 9 } },
  { id: "sm-graveyard", name: "Scarlet Monastery: Graveyard", zone: "tirisfal", levels: [26, 36], offset: { x: 10, y: -3 } },
  {
    id: "city-of-dalaran",
    name: "City of Dalaran",
    zone: "alterac",
    levels: [28, 33],
    offset: { x: 8, y: -6 },
    isNew: true,
    unconfirmed: "Level range from preview coverage; quest givers not announced.",
  },
  { id: "sm-library", name: "Scarlet Monastery: Library", zone: "tirisfal", levels: [29, 39], offset: { x: 10, y: -3 } },
  { id: "sm-armory", name: "Scarlet Monastery: Armory", zone: "tirisfal", levels: [32, 42], offset: { x: 10, y: -3 } },
  { id: "sm-cathedral", name: "Scarlet Monastery: Cathedral", zone: "tirisfal", levels: [35, 45], offset: { x: 10, y: -3 } },
  {
    id: "drowned-city",
    name: "The Drowned City",
    zone: "stranglethorn",
    levels: [35, 40],
    offset: { x: 10, y: -6 },
    isNew: true,
    unconfirmed: "Level range from preview coverage; quest givers not announced.",
  },
  { id: "razorfen-downs", name: "Razorfen Downs", zone: "barrens", levels: [40, 50], offset: { x: -1, y: 15 } },
  { id: "uldaman", name: "Uldaman", zone: "badlands", levels: [42, 52], offset: { x: -7, y: -6 } },
  {
    id: "krol-dok",
    name: "Krol'dok Stronghold",
    zone: "riverglades",
    levels: [40, 45],
    offset: { x: -8, y: -7 },
    isNew: true,
    unconfirmed: "Sources disagree on the range (40–45 or 40–55); quest givers not announced.",
  },
  { id: "zul-farrak", name: "Zul'Farrak", zone: "tanaris", levels: [44, 54], offset: { x: -9, y: -6 } },
  { id: "maraudon", name: "Maraudon", zone: "desolace", levels: [46, 55], offset: { x: 9, y: -2 } },
  {
    id: "alcaz-island",
    name: "Alcaz Island Prison",
    zone: "dustwallow",
    levels: [48, 53],
    offset: { x: 8, y: -6 },
    isNew: true,
    unconfirmed: "Level range from preview coverage; quest givers not announced.",
  },
  { id: "sunken-temple", name: "Sunken Temple", zone: "swamp-of-sorrows", levels: [50, 60], offset: { x: -9, y: -3 } },
  { id: "blackrock-depths", name: "Blackrock Depths", zone: "burning-steppes", levels: [52, 60], offset: { x: -4, y: -9 } },
  { id: "lower-blackrock-spire", name: "Lower Blackrock Spire", zone: "burning-steppes", levels: [55, 60], offset: { x: 4, y: -9 } },
  { id: "dire-maul", name: "Dire Maul", zone: "feralas", levels: [55, 60], offset: { x: 9, y: -6 } },
  {
    id: "blackmaw-hold",
    name: "Blackmaw Hold",
    zone: "azshara",
    levels: [55, 60],
    offset: { x: -2, y: 8 },
    isNew: true,
    unconfirmed: "Level range from preview coverage; quest givers not announced.",
  },
  { id: "scholomance", name: "Scholomance", zone: "western-plaguelands", levels: [58, 60], offset: { x: 6, y: 8 } },
  { id: "stratholme", name: "Stratholme", zone: "eastern-plaguelands", levels: [58, 60], offset: { x: -4, y: -6 } },
  { id: "upper-blackrock-spire", name: "Upper Blackrock Spire", zone: "burning-steppes", levels: [58, 60], offset: { x: 4, y: -9 } },
  {
    id: "shapers-terrace",
    name: "Shaper's Terrace",
    zone: "un-goro",
    levels: [58, 60],
    offset: { x: 9, y: -5 },
    isNew: true,
    unconfirmed: "Level range from preview coverage; quest givers not announced.",
  },
];

/**
 * The shared Horde route after the starting zone, ordered by the level you start each step at.
 * Zones with quests across a wide level range are visited several times.
 */
export const ROUTE: RouteStep[] = [
  {
    place: "barrens",
    levels: [10, 14],
    hub: "The Crossroads",
    focus: ["Crossroads quest chains and plainstrider, raptor and harpy hunts", "Far Watch Post and the Kolkar centaurs", "Pick up Ratchet's first quests"],
  },
  {
    place: "ragefire-chasm",
    levels: [13, 16],
    hub: "Orgrimmar",
    focus: ["Collect every Orgrimmar quest for the chasm before going in", "Searching for the Lost Satchel, Hidden Enemies, Slaying the Beast"],
  },
  {
    place: "silverpine",
    levels: [14, 18],
    hub: "The Sepulcher",
    focus: ["Sepulcher quests against the Scourge, worgen and Dalaran mages", "Pyrewood Village and the Dalaran Brotherhood camps"],
  },
  {
    place: "ruins-of-lordaeron",
    levels: [16, 20],
    hub: "Undercity",
    focus: ["New Forsaken dungeon above the Undercity", "Grab its quests in the Undercity while you are on this continent"],
  },
  {
    place: "barrens",
    levels: [17, 21],
    hub: "The Crossroads, Ratchet",
    focus: ["Lushwater and the Stagnant Oasis", "Ratchet's pirate and Samophlange chains", "Collect the Wailing Caverns quests"],
  },
  {
    place: "wailing-caverns",
    levels: [18, 22],
    hub: "The Crossroads",
    focus: ["Leaders of the Fang and Serpentbloom", "Escort the Disciple of Naralex to finish the dungeon"],
  },
  {
    place: "stonetalon",
    levels: [19, 23],
    hub: "Malaka'jin, Sun Rock Retreat",
    focus: ["Venture Company quests at the Barrens border", "Early Sun Rock Retreat quests"],
  },
  {
    place: "ashenvale",
    levels: [20, 24],
    hub: "Zoram'gar Outpost, Splintertree Post",
    focus: ["Zoram'gar's naga and Blackfathom quests", "Splintertree Post's first round"],
  },
  {
    place: "blackfathom-deeps",
    levels: [22, 26],
    hub: "Zoram'gar Outpost",
    focus: ["Do it while the Zoram'gar quests are fresh", "Allegiance to the Old Gods and Baron Aquanis"],
  },
  {
    place: "hillsbrad",
    levels: [22, 26],
    hub: "Tarren Mill",
    focus: ["Tarren Mill's first round: Southshore farms, bears and the Hillsbrad fields", "Collect Shadowfang Keep quests in the Sepulcher on the way"],
  },
  {
    place: "shadowfang-keep",
    levels: [23, 27],
    hub: "The Sepulcher",
    focus: ["Arugal Must Die and Deathstalkers in Shadowfang", "The Book of Ur from the Undercity"],
  },
  {
    place: "stonetalon",
    levels: [24, 27],
    hub: "Sun Rock Retreat",
    focus: ["Charred Vale, Windshear Crag and the Cenarion Thicket", "Finish every Sun Rock chain"],
  },
  {
    place: "barrens",
    levels: [25, 28],
    hub: "Camp Taurajo, The Crossroads",
    focus: ["Southern Barrens: Bael Modan, Field of Giants and the Raptor Grounds", "Collect the Razorfen Kraul quests"],
  },
  {
    place: "ashenvale",
    levels: [26, 29],
    hub: "Splintertree Post",
    focus: ["Warsong Lumber Camp, Satyrnaar and the Forest Song raid", "Finish Splintertree's remaining chains"],
  },
  {
    place: "thousand-needles",
    levels: [27, 31],
    hub: "Freewind Post",
    focus: ["Freewind Post and the Galak centaur", "Highperch wyverns and the Grimtotem"],
  },
  {
    place: "razorfen-kraul",
    levels: [28, 32],
    hub: "Camp Taurajo, Thunder Bluff",
    focus: ["Blueleaf Tubers and Willix the Importer escort", "A Vengeful Fate from Thunder Bluff"],
  },
  {
    place: "sm-graveyard",
    levels: [28, 31],
    hub: "Undercity",
    focus: ["Run it while you pass through Tirisfal for Hillsbrad", "Pick up every Scarlet Monastery quest in the Undercity"],
  },
  {
    place: "hillsbrad",
    levels: [28, 31],
    hub: "Tarren Mill",
    focus: ["The Battle of Hillsbrad chain against Southshore", "Azurelode Mine and the Syndicate"],
  },
  {
    place: "city-of-dalaran",
    levels: [29, 33],
    hub: "Tarren Mill",
    focus: ["New dungeon at Dalaran's old site in Alterac", "Do it alongside the Alterac quests"],
  },
  {
    place: "alterac",
    levels: [30, 33],
    hub: "Tarren Mill",
    focus: ["Tarren Mill's Alterac quests: Syndicate camps and the Ruins of Alterac", "Prison Break In and Stone Tokens"],
  },
  {
    place: "arathi",
    levels: [30, 34],
    hub: "Hammerfall",
    focus: ["Hammerfall's first round: Boulderfist ogres, Go'Shek Farm and Witherbark trolls", "Leave the Stromgarde chains for later"],
  },
  {
    place: "sm-library",
    levels: [31, 34],
    hub: "Undercity",
    focus: ["Compendium of the Fallen and other Library quests"],
  },
  {
    place: "stranglethorn",
    levels: [31, 35],
    hub: "Grom'gol Base Camp, Nesingwary's Expedition",
    focus: ["Nesingwary's tiger, panther and raptor hunts", "Grom'gol's troll and Kurzen quests", "Start collecting Green Hills of Stranglethorn pages"],
  },
  {
    place: "desolace",
    levels: [32, 36],
    hub: "Shadowprey Village, Ghost Walker Post",
    focus: ["Kolkar, Gelkis and Magram centaur reputation chains", "Shadowprey Village's naga and Kodo Graveyard quests"],
  },
  {
    place: "thousand-needles",
    levels: [33, 36],
    hub: "Mirage Raceway",
    focus: ["Shimmering Flats racing quests", "Finish the Freewind chains"],
  },
  {
    place: "sm-armory",
    levels: [33, 37],
    hub: "Undercity",
    focus: ["Armory quests and gear upgrades for the 30s"],
  },
  {
    place: "dustwallow",
    levels: [35, 38],
    hub: "Brackenwall Village",
    focus: ["Brackenwall's first round in the marshes"],
  },
  {
    place: "badlands",
    levels: [35, 39],
    hub: "Kargath",
    focus: ["Kargath's ogre, dragonkin and Dustbelcher quests", "Pick up the Uldaman quests for later"],
  },
  {
    place: "swamp-of-sorrows",
    levels: [36, 39],
    hub: "Stonard",
    focus: ["Stonard's swamp quests", "Pick up the Sunken Temple quest for later"],
  },
  {
    place: "riverglades",
    levels: [36, 40],
    hub: "Neutral goblin port",
    focus: ["New zone with 150+ quests: start with its low-level areas", "Expect contested-zone world PvP"],
  },
  {
    place: "drowned-city",
    levels: [36, 40],
    focus: ["New naga and pirate dungeon in Stranglethorn"],
  },
  {
    place: "stranglethorn",
    levels: [37, 41],
    hub: "Booty Bay, Grom'gol Base Camp",
    focus: ["Booty Bay's Bloodsail Buccaneers and Venture Company quests", "Nesingwary's second round"],
  },
  {
    place: "sm-cathedral",
    levels: [37, 40],
    hub: "Undercity",
    focus: ["Into the Scarlet Monastery: Mograine and Whitemane"],
  },
  {
    place: "arathi",
    levels: [38, 41],
    hub: "Hammerfall",
    focus: ["Stromgarde Keep, Drywhisker kobolds and the Witherbark chains"],
  },
  {
    place: "razorfen-downs",
    levels: [38, 42],
    hub: "Thunder Bluff, Camp Taurajo",
    focus: ["Bring Down the Amnennar and A Host of Evil", "Escort Belnistrasz to the idol"],
  },
  {
    place: "dustwallow",
    levels: [39, 42],
    hub: "Brackenwall Village",
    focus: ["Theramore raids and the Stonemaul ogre chains"],
  },
  {
    place: "uldaman",
    levels: [40, 44],
    hub: "Kargath",
    focus: ["Power Stones and Uldaman Reagent Run", "Agmond's Fate and the Badlands dwarf quests"],
  },
  {
    place: "riverglades",
    levels: [40, 44],
    hub: "Neutral goblin port",
    focus: ["Second round: the zone's higher-level areas"],
  },
  {
    place: "krol-dok",
    levels: [41, 45],
    focus: ["New contested outdoor dungeon in Riverglades"],
  },
  {
    place: "stranglethorn",
    levels: [42, 45],
    hub: "Booty Bay",
    focus: ["Finish Booty Bay, the pirate chains and the jungle troll quests", "Hand in the completed Green Hills of Stranglethorn"],
  },
  {
    place: "shen-dralas",
    levels: [42, 46],
    focus: ["New zone continuing the Desolace centaur stories", "Move this step once Blizzard confirms its levels"],
  },
  {
    place: "tanaris",
    levels: [43, 46],
    hub: "Gadgetzan",
    focus: ["Gadgetzan's first round: Wastewander bandits, Southsea pirates and Steamwheedle Port"],
  },
  {
    place: "feralas",
    levels: [43, 47],
    hub: "Camp Mojache",
    focus: ["Gordunni ogres, Grimtotem and the Woodpaw gnolls"],
  },
  {
    place: "zul-farrak",
    levels: [44, 48],
    hub: "Gadgetzan",
    focus: ["Divino-matic Rod, Tiara of the Deep and Scarab Shells", "Gahz'rilla if your group has the mallet"],
  },
  {
    place: "hinterlands",
    levels: [44, 48],
    hub: "Revantusk Village",
    focus: ["Revantusk's Vilebranch and Highvale quests"],
  },
  {
    place: "searing-gorge",
    levels: [45, 48],
    hub: "Thorium Point, Kargath",
    focus: ["Thorium Brotherhood and Dark Iron quests", "Pick up the Blackrock Depths attunement chain"],
  },
  {
    place: "maraudon",
    levels: [46, 50],
    hub: "Shadowprey Village",
    focus: ["Corruption of Earth and Seed, Legends of Maraudon", "Princess Theradras"],
  },
  {
    place: "azshara",
    levels: [47, 50],
    hub: "Valormok",
    focus: ["Valormok's satyr and naga quests"],
  },
  {
    place: "tanaris",
    levels: [47, 50],
    hub: "Gadgetzan",
    focus: ["Gadgetzan's second round: Thistleshrub Valley and Lost Rigger Cove"],
  },
  {
    place: "feralas",
    levels: [48, 50],
    hub: "Camp Mojache",
    focus: ["Finish the Mojache chains: Lariss Pavilion, Isle of Dread and the yeti cave"],
  },
  {
    place: "alcaz-island",
    levels: [48, 52],
    focus: ["New prison dungeon off the Dustwallow coast"],
  },
  {
    place: "blasted-lands",
    levels: [48, 51],
    hub: "Neutral questgivers by the Dark Portal",
    focus: ["The bloodmages' collection quests for stat elixirs"],
  },
  {
    place: "hinterlands",
    levels: [48, 50],
    hub: "Revantusk Village",
    focus: ["Finish Revantusk: Jintha'Alor and the Witherbark"],
  },
  {
    place: "un-goro",
    levels: [49, 53],
    hub: "Marshal's Refuge",
    focus: ["Crystals, dinosaurs and the A-Me 01 escort", "Pick up the Linken and Ringo chains"],
  },
  {
    place: "felwood",
    levels: [50, 54],
    hub: "Bloodvenom Post",
    focus: ["Bloodvenom Post's corruption and furbolg quests", "Start Timbermaw Hold reputation"],
  },
  {
    place: "sunken-temple",
    levels: [50, 54],
    hub: "Stonard",
    focus: ["The Temple of Atal'Hakkar and Into the Depths", "Class quests that need the Sunken Temple"],
  },
  {
    place: "burning-steppes",
    levels: [51, 55],
    hub: "Flame Crest",
    focus: ["Flame Crest's dragonkin and Blackrock orc quests"],
  },
  {
    place: "blackrock-depths",
    levels: [52, 58],
    hub: "Kargath, Flame Crest, Thorium Point",
    focus: ["Several runs: Dark Iron Legacy, Hurley Blackbreath and the Emperor", "Kharan Mighthammer and Ragnaros attunement chains start here"],
  },
  {
    place: "western-plaguelands",
    levels: [52, 56],
    hub: "The Bulwark",
    focus: ["The Bulwark's Scourge and farmhouse quests"],
  },
  {
    place: "eastern-plaguelands",
    levels: [53, 57],
    hub: "Light's Hope Chapel",
    focus: ["Light's Hope and Tirion Fordring's chain", "Fiona's Caravan and the Argent Dawn"],
  },
  {
    place: "winterspring",
    levels: [54, 58],
    hub: "Everlook",
    focus: ["Everlook, Donova Snowden and the Winterfall furbolgs"],
  },
  {
    place: "silithus",
    levels: [55, 58],
    hub: "Cenarion Hold",
    focus: ["Cenarion Hold's Twilight's Hammer and silithid quests"],
  },
  {
    place: "blackmaw-hold",
    levels: [55, 59],
    focus: ["New dungeon in corrupted Azshara"],
  },
  {
    place: "lower-blackrock-spire",
    levels: [55, 59],
    hub: "Flame Crest, Kargath",
    focus: ["Warlord Thrall's Champion and the Spire quests", "Seal of Ascension for Upper Blackrock Spire"],
  },
  {
    place: "dire-maul",
    levels: [56, 60],
    hub: "Camp Mojache",
    focus: ["East, West and North wings", "Library books for class and reputation quests"],
  },
  {
    place: "western-plaguelands",
    levels: [56, 58],
    hub: "The Bulwark",
    focus: ["Finish the Bulwark chains and the Scholomance key quests"],
  },
  {
    place: "eastern-plaguelands",
    levels: [57, 60],
    hub: "Light's Hope Chapel",
    focus: ["Finish Light's Hope and the Scourge quests"],
  },
  {
    place: "stratholme",
    levels: [58, 60],
    hub: "Light's Hope Chapel",
    focus: ["Live and Undead sides: Baron Rivendare and the Argent Dawn quests"],
  },
  {
    place: "scholomance",
    levels: [58, 60],
    hub: "The Bulwark",
    focus: ["Darkmaster Gandling and the Bulwark's Scholomance quests"],
  },
  {
    place: "upper-blackrock-spire",
    levels: [58, 60],
    hub: "Kargath",
    focus: ["10-player: General Drakkisath and the Onyxia attunement chain"],
  },
  {
    place: "shapers-terrace",
    levels: [58, 60],
    focus: ["New titan dungeon in Un'Goro"],
  },
  {
    place: "mount-hyjal",
    levels: [60, 60],
    focus: ["Reached from Darkwhisper Gorge", "New endgame zone with several reputations; the leveling route ends here"],
  },
];

/** Zones without a Horde stop, drawn faintly on the map so the route has its neighbours. */
export const CONTEXT_ZONES: ContextZone[] = [
  { name: "Teldrassil", continent: "kalimdor", map: { x: 30, y: 4 } },
  { name: "Darkshore", continent: "kalimdor", map: { x: 34, y: 16 } },
  { name: "Moonglade", continent: "kalimdor", map: { x: 58, y: 4 } },
  { name: "Dun Morogh", continent: "eastern-kingdoms", map: { x: 30, y: 54 } },
  { name: "Wetlands", continent: "eastern-kingdoms", map: { x: 46, y: 48 } },
  { name: "Loch Modan", continent: "eastern-kingdoms", map: { x: 62, y: 46 } },
  { name: "Elwynn Forest", continent: "eastern-kingdoms", map: { x: 24, y: 70 } },
  { name: "Redridge", continent: "eastern-kingdoms", map: { x: 62, y: 72 } },
  { name: "Westfall", continent: "eastern-kingdoms", map: { x: 10, y: 80 } },
  { name: "Duskwood", continent: "eastern-kingdoms", map: { x: 28, y: 82 } },
  { name: "Deadwind Pass", continent: "eastern-kingdoms", map: { x: 50, y: 90 } },
];

/** Content the route skips on purpose, and why. */
export const EXCLUSIONS: Exclusion[] = [
  { name: "Other Horde starting zones", kind: "zone", reason: "Only your own starting zone is on the route." },
  { name: "Dun Morogh, Elwynn Forest, Teldrassil", kind: "zone", reason: "Alliance starting zones." },
  { name: "Westfall, Redridge, Duskwood, Loch Modan, Wetlands, Darkshore", kind: "zone", reason: "No Horde quests." },
  { name: "Deadwind Pass, Moonglade", kind: "zone", reason: "No Horde leveling quests." },
  { name: "The Deadmines", kind: "dungeon", reason: "Deep in Westfall; a long run through Alliance territory." },
  { name: "The Stockade", kind: "dungeon", reason: "Inside Stormwind City." },
  { name: "Gnomeregan", kind: "dungeon", reason: "Reached through Dun Morogh, next to Ironforge." },
  { name: "Hall of Thanes", kind: "dungeon", reason: "New dungeon beneath Ironforge." },
  { name: "Excavation Site", kind: "dungeon", reason: "New dungeon in the Wetlands, between Menethil Harbor and Ironforge." },
  { name: "Raids and battlegrounds", kind: "dungeon", reason: "Not part of leveling." },
];

/** Zeppelin and boat lines; each runs in both directions. */
export const TRANSPORTS: { from: Port; to: Port; by: "zeppelin" | "boat" }[] = [
  { from: "orgrimmar", to: "undercity", by: "zeppelin" },
  { from: "orgrimmar", to: "gromgol", by: "zeppelin" },
  { from: "undercity", to: "gromgol", by: "zeppelin" },
  { from: "ratchet", to: "booty-bay", by: "boat" },
];

/** Zone each port is in. */
export const PORT_ZONES: Record<Port, string> = {
  orgrimmar: "durotar",
  ratchet: "barrens",
  undercity: "tirisfal",
  gromgol: "stranglethorn",
  "booty-bay": "stranglethorn",
};

export const PORT_NAMES: Record<Port, string> = {
  orgrimmar: "Orgrimmar",
  ratchet: "Ratchet",
  undercity: "Undercity",
  gromgol: "Grom'gol",
  "booty-bay": "Booty Bay",
};

export { STARTING_ZONES, type StartingZoneId } from "./startingZones";

/** What to do in each starting zone before joining the shared route. */
export const STARTING_FOCUS: Record<StartingZoneId, string[]> = {
  durotar: ["Valley of Trials, then every Razor Hill and Sen'jin Village quest", "Tiragarde Keep, Dustwind Cave and the Echo Isles before crossing into the Barrens"],
  mulgore: ["Camp Narache, then every Bloodhoof Village quest", "Visit Thunder Bluff for its quests before heading north to the Barrens"],
  tirisfal: ["Deathknell, then every Brill quest", "Agamand Mills and the Scarlet Crusade camps before leaving for Kalimdor"],
  "zephras-isle": ["Follow the isle's route through its villages, shrines and ruins", "The Skyborne zone runs to level 12, so you join the Barrens slightly ahead"],
};
