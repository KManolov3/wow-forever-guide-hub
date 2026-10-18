/** Leveling guide content: Horde zones, dungeons and the completionist route through them. */

import type { StartingZoneId } from "./startingZones";

export type Continent = "kalimdor" | "eastern-kingdoms";

/** A position on a continent map image, in its pixels (see `mapShapes.ts`). */
export interface MapPoint {
  x: number;
  y: number;
}

/** Transport hubs that link the two continents. */
export type Port = "orgrimmar" | "ratchet" | "steamwheedle" | "undercity" | "gromgol" | "booty-bay" | "powderfuse";

export interface Zone {
  id: string;
  name: string;
  continent: Continent;
  /** Level range of the zone's Horde quests. */
  levels: [number, number];
  /** Horde (or neutral) quest hubs; empty when not announced. */
  hubs: string[];
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
  /** How to leave a starting zone when it is not by the usual roads and transports. */
  exit?: string;
  /** No Horde quests: on the map and the route only because a dungeon entrance is here. */
  noHordeQuests?: boolean;
}

export interface Dungeon {
  id: string;
  name: string;
  /** Zone the entrance is in. */
  zone: string;
  levels: [number, number];
  /** Entrance on the continent map. */
  map: MapPoint;
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
    port: "orgrimmar",
    startingRaces: "Orc & Troll",
  },
  {
    id: "mulgore",
    name: "Mulgore",
    continent: "kalimdor",
    levels: [1, 10],
    hubs: ["Camp Narache", "Bloodhoof Village", "Thunder Bluff"],
    port: "orgrimmar",
    startingRaces: "Tauren",
  },
  {
    id: "tirisfal",
    name: "Tirisfal Glades",
    continent: "eastern-kingdoms",
    levels: [1, 10],
    hubs: ["Deathknell", "Brill", "Undercity"],
    port: "undercity",
    startingRaces: "Undead",
  },
  {
    id: "zephras-isle",
    name: "Zephras Isle",
    continent: "kalimdor",
    levels: [1, 12],
    hubs: [],
    port: "orgrimmar",
    startingRaces: "Skyborne (Horde)",
    isNew: true,
    unconfirmed:
      "From beta client data: an airship links the isle with Skywatcher Plateau in Mulgore, and Horde Skyborne are then sent to Thrall in Orgrimmar.",
    offMap: true,
    exit: "Airship from Zephras Isle to Skywatcher Plateau in Mulgore, then head north to The Barrens.",
  },

  // Kalimdor
  {
    id: "barrens",
    name: "The Barrens",
    continent: "kalimdor",
    levels: [10, 33],
    hubs: ["The Crossroads", "Ratchet", "Camp Taurajo"],
    port: "ratchet",
  },
  {
    id: "stonetalon",
    name: "Stonetalon Mountains",
    continent: "kalimdor",
    levels: [15, 27],
    hubs: ["Malaka'jin", "Sun Rock Retreat"],
    port: "orgrimmar",
  },
  {
    id: "ashenvale",
    name: "Ashenvale",
    continent: "kalimdor",
    levels: [18, 30],
    hubs: ["Zoram'gar Outpost", "Splintertree Post"],
    port: "orgrimmar",
  },
  {
    id: "thousand-needles",
    name: "Thousand Needles",
    continent: "kalimdor",
    levels: [25, 35],
    hubs: ["Freewind Post", "Mirage Raceway"],
    port: "ratchet",
  },
  {
    id: "desolace",
    name: "Desolace",
    continent: "kalimdor",
    levels: [30, 40],
    hubs: ["Shadowprey Village", "Ghost Walker Post"],
    port: "orgrimmar",
  },
  {
    id: "dustwallow",
    name: "Dustwallow Marsh",
    continent: "kalimdor",
    levels: [35, 45],
    hubs: ["Brackenwall Village"],
    port: "ratchet",
  },
  {
    id: "shen-dralas",
    name: "Shen'dralas",
    continent: "kalimdor",
    levels: [40, 50],
    hubs: [],
    port: "orgrimmar",
    isNew: true,
    unconfirmed:
      "No published level range or Horde hub. It is entered from southern Desolace through the Valley of Bones, and its quests lead to Maraudon and Razorfen Downs, so the guide places it in the mid-40s.",
  },
  {
    id: "feralas",
    name: "Feralas",
    continent: "kalimdor",
    levels: [40, 50],
    hubs: ["Camp Mojache"],
    port: "ratchet",
  },
  {
    id: "tanaris",
    name: "Tanaris",
    continent: "kalimdor",
    levels: [40, 50],
    hubs: ["Gadgetzan", "Steamwheedle Port"],
    port: "steamwheedle",
  },
  {
    id: "azshara",
    name: "Azshara",
    continent: "kalimdor",
    levels: [45, 55],
    hubs: ["Valormok"],
    port: "orgrimmar",
  },
  {
    id: "un-goro",
    name: "Un'Goro Crater",
    continent: "kalimdor",
    levels: [48, 55],
    hubs: ["Marshal's Refuge"],
    port: "ratchet",
  },
  {
    id: "felwood",
    name: "Felwood",
    continent: "kalimdor",
    levels: [48, 55],
    hubs: ["Bloodvenom Post"],
    port: "orgrimmar",
  },
  {
    id: "winterspring",
    name: "Winterspring",
    continent: "kalimdor",
    levels: [53, 60],
    hubs: ["Everlook"],
    port: "orgrimmar",
  },
  {
    id: "silithus",
    name: "Silithus",
    continent: "kalimdor",
    levels: [55, 60],
    hubs: ["Cenarion Hold"],
    port: "orgrimmar",
  },
  {
    id: "mount-hyjal",
    name: "Mount Hyjal",
    continent: "kalimdor",
    levels: [60, 60],
    hubs: [],
    port: "orgrimmar",
    isNew: true,
    unconfirmed: "Blizzard calls it an endgame leveling zone but has not published a level range or Horde hub.",
  },

  // Eastern Kingdoms
  {
    id: "silverpine",
    name: "Silverpine Forest",
    continent: "eastern-kingdoms",
    levels: [10, 20],
    hubs: ["The Sepulcher"],
    port: "undercity",
  },
  {
    id: "hillsbrad",
    name: "Hillsbrad Foothills",
    continent: "eastern-kingdoms",
    levels: [20, 31],
    hubs: ["Tarren Mill"],
    port: "undercity",
  },
  {
    id: "alterac",
    name: "Alterac Mountains",
    continent: "eastern-kingdoms",
    levels: [30, 40],
    hubs: ["Tarren Mill"],
    port: "undercity",
  },
  {
    id: "arathi",
    name: "Arathi Highlands",
    continent: "eastern-kingdoms",
    levels: [30, 41],
    hubs: ["Hammerfall"],
    port: "undercity",
  },
  {
    id: "stranglethorn",
    name: "Stranglethorn Vale",
    continent: "eastern-kingdoms",
    levels: [30, 45],
    hubs: ["Grom'gol Base Camp", "Nesingwary's Expedition", "Booty Bay"],
    port: "gromgol",
  },
  {
    id: "badlands",
    name: "Badlands",
    continent: "eastern-kingdoms",
    levels: [35, 45],
    hubs: ["Kargath"],
    port: "gromgol",
  },
  {
    id: "swamp-of-sorrows",
    name: "Swamp of Sorrows",
    continent: "eastern-kingdoms",
    levels: [35, 45],
    hubs: ["Stonard"],
    port: "gromgol",
  },
  {
    id: "riverglades",
    name: "Riverglades",
    continent: "eastern-kingdoms",
    levels: [35, 45],
    hubs: ["Rog'mar", "Powderfuse Port (neutral)"],
    port: "powderfuse",
    isNew: true,
    unconfirmed:
      "Sources give 35–45 or 36–44 (Blizzard: mid-30s to mid-40s). Rog'mar, its flight paths and the Powderfuse Port ship come from beta client files.",
  },
  {
    id: "wetlands",
    name: "Wetlands",
    continent: "eastern-kingdoms",
    levels: [20, 30],
    hubs: [],
    port: "undercity",
    noHordeQuests: true,
  },
  {
    id: "hinterlands",
    name: "The Hinterlands",
    continent: "eastern-kingdoms",
    levels: [40, 50],
    hubs: ["Revantusk Village"],
    port: "undercity",
  },
  {
    id: "searing-gorge",
    name: "Searing Gorge",
    continent: "eastern-kingdoms",
    levels: [43, 50],
    hubs: ["Thorium Point", "Kargath"],
    port: "gromgol",
  },
  {
    id: "blasted-lands",
    name: "Blasted Lands",
    continent: "eastern-kingdoms",
    levels: [45, 55],
    hubs: ["Bloodmages' camp (neutral)"],
    port: "gromgol",
  },
  {
    id: "burning-steppes",
    name: "Burning Steppes",
    continent: "eastern-kingdoms",
    levels: [50, 58],
    hubs: ["Flame Crest"],
    port: "gromgol",
  },
  {
    id: "western-plaguelands",
    name: "Western Plaguelands",
    continent: "eastern-kingdoms",
    levels: [51, 58],
    hubs: ["The Bulwark"],
    port: "undercity",
  },
  {
    id: "eastern-plaguelands",
    name: "Eastern Plaguelands",
    continent: "eastern-kingdoms",
    levels: [53, 60],
    hubs: ["Light's Hope Chapel"],
    port: "undercity",
  },
];

export const DUNGEONS: Dungeon[] = [
  { id: "ragefire-chasm", name: "Ragefire Chasm", zone: "durotar", levels: [13, 18], map: { x: 579, y: 306 } },
  {
    id: "ruins-of-lordaeron",
    name: "Ruins of Lordaeron",
    zone: "tirisfal",
    levels: [15, 20],
    map: { x: 469, y: 141 },
    isNew: true,
  },
  { id: "wailing-caverns", name: "Wailing Caverns", zone: "barrens", levels: [15, 24], map: { x: 518, y: 352 } },
  { id: "blackfathom-deeps", name: "Blackfathom Deeps", zone: "ashenvale", levels: [24, 32], map: { x: 463, y: 262 } },
  { id: "shadowfang-keep", name: "Shadowfang Keep", zone: "silverpine", levels: [22, 30], map: { x: 416, y: 221 } },
  {
    id: "excavation-site",
    name: "Excavation Site: Wetlands",
    zone: "wetlands",
    levels: [26, 31],
    map: { x: 530, y: 322 },
    isNew: true,
    unconfirmed: "Sources count 3 to 5 Horde quests; the level range moved from 24–29 to 26–31 during the beta.",
  },
  { id: "razorfen-kraul", name: "Razorfen Kraul", zone: "barrens", levels: [30, 40], map: { x: 512, y: 447 } },
  { id: "sm-graveyard", name: "Scarlet Monastery: Graveyard", zone: "tirisfal", levels: [26, 36], map: { x: 492, y: 126 } },
  {
    id: "city-of-dalaran",
    name: "City of Dalaran",
    zone: "alterac",
    levels: [28, 33],
    map: { x: 451, y: 199 },
    isNew: true,
    unconfirmed: "Since Oct 15 the Horde are attacked on sight in Dalaran; the dungeon stays open through the sewer gate. Horde quest givers are not confirmed.",
  },
  { id: "sm-library", name: "Scarlet Monastery: Library", zone: "tirisfal", levels: [29, 39], map: { x: 492, y: 126 } },
  { id: "sm-armory", name: "Scarlet Monastery: Armory", zone: "tirisfal", levels: [32, 42], map: { x: 492, y: 126 } },
  { id: "sm-cathedral", name: "Scarlet Monastery: Cathedral", zone: "tirisfal", levels: [35, 45], map: { x: 492, y: 126 } },
  {
    id: "drowned-city",
    name: "The Drowned City",
    zone: "stranglethorn",
    levels: [35, 40],
    map: { x: 442, y: 566 },
    isNew: true,
    unconfirmed: "Blizzard's bracket is 35–40; Horde quests are not confirmed.",
  },
  { id: "razorfen-downs", name: "Razorfen Downs", zone: "barrens", levels: [40, 50], map: { x: 528, y: 470 } },
  { id: "uldaman", name: "Uldaman", zone: "badlands", levels: [42, 52], map: { x: 574, y: 396 } },
  {
    id: "krol-dok",
    name: "Krol'dok Stronghold",
    zone: "riverglades",
    levels: [40, 45],
    map: { x: 602, y: 452 },
    isNew: true,
    unconfirmed: "Sources disagree on the range (40–45 or 40–55); Horde quests are not confirmed.",
  },
  { id: "zul-farrak", name: "Zul'Farrak", zone: "tanaris", levels: [44, 54], map: { x: 556, y: 538 } },
  { id: "maraudon", name: "Maraudon", zone: "desolace", levels: [46, 55], map: { x: 404, y: 402 } },
  {
    id: "alcaz-prison",
    name: "Alcaz Prison",
    zone: "dustwallow",
    levels: [48, 53],
    map: { x: 578, y: 436 },
    isNew: true,
    unconfirmed: "Blizzard's bracket is 48–53; Horde quests are not confirmed.",
  },
  { id: "sunken-temple", name: "Sunken Temple", zone: "swamp-of-sorrows", levels: [50, 60], map: { x: 546, y: 512 } },
  { id: "blackrock-depths", name: "Blackrock Depths", zone: "burning-steppes", levels: [52, 60], map: { x: 501, y: 437 } },
  { id: "lower-blackrock-spire", name: "Lower Blackrock Spire", zone: "burning-steppes", levels: [55, 60], map: { x: 513, y: 437 } },
  { id: "dire-maul", name: "Dire Maul", zone: "feralas", levels: [55, 60], map: { x: 440, y: 482 } },
  {
    id: "blackmaw-hold",
    name: "Blackmaw Hold",
    zone: "azshara",
    levels: [55, 60],
    map: { x: 622, y: 247 },
    isNew: true,
    unconfirmed: "Blizzard's bracket is 55–60; Horde quests are not confirmed.",
  },
  { id: "scholomance", name: "Scholomance", zone: "western-plaguelands", levels: [58, 60], map: { x: 524, y: 176 } },
  { id: "stratholme", name: "Stratholme", zone: "eastern-plaguelands", levels: [58, 60], map: { x: 560, y: 108 } },
  { id: "upper-blackrock-spire", name: "Upper Blackrock Spire", zone: "burning-steppes", levels: [58, 60], map: { x: 513, y: 437 } },
  {
    id: "shapers-terrace",
    name: "Shaper's Terrace",
    zone: "un-goro",
    levels: [58, 60],
    map: { x: 508, y: 546 },
    isNew: true,
    unconfirmed: "Blizzard's bracket is 58–60; Horde quests are not confirmed.",
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
    focus: [
      "New Forsaken dungeon above the Undercity, south of Brill",
      "Eight Horde quests, several of them versions of Master Apothecary Faranell's Unending Torment",
    ],
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
    focus: [
      "New dungeon at Dalaran's old site in Alterac, entered through the sewer gate on the Lordamere Lake shore",
      "The Horde are attacked on sight in the city above, so go straight to the dungeon",
    ],
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
    focus: [
      "Hammerfall's first round: Boulderfist ogres, Go'Shek Farm and Witherbark trolls",
      "Pick up Dragonmaw Rumors from Zaruk for the Excavation Site",
      "Leave the Stromgarde chains for later",
    ],
  },
  {
    place: "excavation-site",
    levels: [30, 31],
    hub: "Hammerfall, Orgrimmar, Thunder Bluff",
    focus: [
      "New Wetlands dungeon: ride over the Arathi hills to the entrance, avoiding Menethil Harbor",
      "Dragonmaw Rumors and Open the Maw, Changing Tastes from Orgrimmar's cooking trainer, and the Titan Relic chain that ends in Thunder Bluff and Mulgore",
    ],
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
    levels: [33, 35],
    hub: "Mirage Raceway",
    focus: [
      "Shimmering Flats racing quests",
      "Finish the Freewind chains",
    ],
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
    hub: "Rog'mar",
    focus: [
      "Fly to Rog'mar from Stonard or Kargath",
      "New zone with 150+ quests: do its lower-level areas first",
      "Expect contested-zone world PvP",
    ],
  },
  {
    place: "drowned-city",
    levels: [36, 40],
    focus: ["New naga and pirate dungeon in Stranglethorn"],
  },
  {
    place: "stranglethorn",
    levels: [37, 40],
    hub: "Booty Bay, Grom'gol Base Camp",
    focus: [
      "Booty Bay's Bloodsail Buccaneers and Venture Company quests",
      "Nesingwary's second round",
    ],
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
    place: "stranglethorn",
    levels: [40, 43],
    hub: "Booty Bay",
    focus: [
      "Finish Booty Bay, the pirate chains and the jungle troll quests",
      "Hand in the completed Green Hills of Stranglethorn",
    ],
  },
  {
    place: "riverglades",
    levels: [41, 44],
    hub: "Rog'mar",
    focus: [
      "Second round: the zone's higher-level areas",
    ],
  },
  {
    place: "krol-dok",
    levels: [42, 45],
    focus: ["New contested outdoor dungeon in Riverglades", "Then take the ship from Powderfuse Port to Steamwheedle Port in Tanaris"],
  },
  {
    place: "tanaris",
    levels: [43, 46],
    hub: "Gadgetzan",
    focus: ["Gadgetzan's first round: Wastewander bandits, Southsea pirates and Steamwheedle Port"],
  },
  {
    place: "zul-farrak",
    levels: [43, 47],
    hub: "Gadgetzan",
    focus: ["Divino-matic Rod, Tiara of the Deep and Scarab Shells", "Gahz'rilla if your group has the mallet"],
  },
  {
    place: "feralas",
    levels: [43, 47],
    hub: "Camp Mojache",
    focus: ["Gordunni ogres, Grimtotem and the Woodpaw gnolls"],
  },
  {
    place: "shen-dralas",
    levels: [44, 47],
    focus: ["Enter from southern Desolace through the Valley of Bones; the new zone continues the centaur stories", "Move this step once Blizzard confirms its levels"],
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
    place: "alcaz-prison",
    levels: [48, 52],
    focus: ["New prison dungeon off the Dustwallow coast"],
  },
  {
    place: "blasted-lands",
    levels: [48, 51],
    hub: "Bloodmages' camp",
    focus: [
      "No Horde town here: fly to Stonard and ride south",
      "The bloodmages' collection quests for stat elixirs",
    ],
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
    focus: ["Ride up through Darkwhisper Gorge in southern Winterspring", "New endgame zone with several reputations; the leveling route ends here"],
  },
];

/** Zones without a Horde stop, drawn faintly on the map so the route has its neighbours. */
export const CONTEXT_ZONES: ContextZone[] = [
  { name: "Teldrassil", continent: "kalimdor", map: { x: 432, y: 72 } },
  { name: "Darkshore", continent: "kalimdor", map: { x: 462, y: 150 } },
  { name: "Moonglade", continent: "kalimdor", map: { x: 543, y: 123 } },
  { name: "Dun Morogh", continent: "eastern-kingdoms", map: { x: 462, y: 378 } },
  { name: "Wetlands", continent: "eastern-kingdoms", map: { x: 520, y: 305 } },
  { name: "Loch Modan", continent: "eastern-kingdoms", map: { x: 570, y: 366 } },
  { name: "Elwynn Forest", continent: "eastern-kingdoms", map: { x: 463, y: 476 } },
  { name: "Redridge", continent: "eastern-kingdoms", map: { x: 533, y: 478 } },
  { name: "Westfall", continent: "eastern-kingdoms", map: { x: 418, y: 520 } },
  { name: "Duskwood", continent: "eastern-kingdoms", map: { x: 462, y: 526 } },
  { name: "Deadwind Pass", continent: "eastern-kingdoms", map: { x: 514, y: 528 } },
];

/** Content the route skips on purpose, and why. */
export const EXCLUSIONS: Exclusion[] = [
  { name: "Other Horde starting zones", kind: "zone", reason: "Only your own starting zone is on the route." },
  { name: "Dun Morogh, Elwynn Forest, Teldrassil", kind: "zone", reason: "Alliance starting zones." },
  {
    name: "Westfall, Redridge, Duskwood, Loch Modan, Wetlands, Darkshore",
    kind: "zone",
    reason: "No Horde quests. The Wetlands' Excavation Site dungeon is on the route, reached from Arathi Highlands.",
  },
  { name: "Deadwind Pass, Moonglade", kind: "zone", reason: "No Horde leveling quests." },
  { name: "The Deadmines", kind: "dungeon", reason: "Deep in Westfall; a long run through Alliance territory." },
  { name: "The Stockade", kind: "dungeon", reason: "Inside Stormwind City." },
  { name: "Gnomeregan", kind: "dungeon", reason: "Reached through Dun Morogh, next to Ironforge." },
  {
    name: "Hall of Thanes",
    kind: "dungeon",
    reason: "New dungeon inside Old Ironforge; sources disagree on whether it has any Horde quests.",
  },
  { name: "Raids and battlegrounds", kind: "dungeon", reason: "Not part of leveling." },
];

/** Zeppelin and boat lines; each runs in both directions. */
export const TRANSPORTS: { from: Port; to: Port; by: "zeppelin" | "boat" }[] = [
  { from: "orgrimmar", to: "undercity", by: "zeppelin" },
  { from: "orgrimmar", to: "gromgol", by: "zeppelin" },
  { from: "undercity", to: "gromgol", by: "zeppelin" },
  { from: "ratchet", to: "booty-bay", by: "boat" },
  { from: "steamwheedle", to: "powderfuse", by: "boat" },
];

/** Zone each port is in. */
export const PORT_ZONES: Record<Port, string> = {
  orgrimmar: "durotar",
  ratchet: "barrens",
  undercity: "tirisfal",
  steamwheedle: "tanaris",
  gromgol: "stranglethorn",
  "booty-bay": "stranglethorn",
  powderfuse: "riverglades",
};

export const PORT_NAMES: Record<Port, string> = {
  orgrimmar: "Orgrimmar",
  ratchet: "Ratchet",
  undercity: "Undercity",
  gromgol: "Grom'gol",
  "booty-bay": "Booty Bay",
  steamwheedle: "Steamwheedle Port",
  powderfuse: "Powderfuse Port",
};

/** Cities and ports drawn on the maps. */
export const LANDMARKS: { name: string; continent: Continent; map: MapPoint; kind: "city" | "port" }[] = [
  { name: "Orgrimmar", continent: "kalimdor", map: { x: 583, y: 298 }, kind: "city" },
  { name: "Thunder Bluff", continent: "kalimdor", map: { x: 468, y: 396 }, kind: "city" },
  { name: "Ratchet", continent: "kalimdor", map: { x: 566, y: 400 }, kind: "port" },
  { name: "Steamwheedle Port", continent: "kalimdor", map: { x: 590, y: 552 }, kind: "port" },
  { name: "Undercity", continent: "eastern-kingdoms", map: { x: 466, y: 153 }, kind: "city" },
  { name: "Grom'gol", continent: "eastern-kingdoms", map: { x: 458, y: 553 }, kind: "port" },
  { name: "Booty Bay", continent: "eastern-kingdoms", map: { x: 452, y: 612 }, kind: "port" },
  { name: "Powderfuse Port", continent: "eastern-kingdoms", map: { x: 612, y: 458 }, kind: "port" },
];

export { STARTING_ZONES, type StartingZoneId } from "./startingZones";

/** What to do in each starting zone before joining the shared route. */
export const STARTING_FOCUS: Record<StartingZoneId, string[]> = {
  durotar: ["Valley of Trials, then every Razor Hill and Sen'jin Village quest", "Tiragarde Keep, Dustwind Cave and the Echo Isles before crossing into the Barrens"],
  mulgore: ["Camp Narache, then every Bloodhoof Village quest", "Visit Thunder Bluff for its quests before heading north to the Barrens"],
  tirisfal: ["Deathknell, then every Brill quest", "Agamand Mills and the Scarlet Crusade camps before leaving for Kalimdor"],
  "zephras-isle": [
    "Follow the isle's route through its villages, shrines and ruins",
    "The Skyborne zone runs to level 12, so you join the Barrens slightly ahead",
  ],
};
