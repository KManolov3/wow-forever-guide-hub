/**
 * Quest hub positions on the zone maps (`public/maps/zones/<zone-id>.webp`), as in-game map coordinates
 * (0–100 across and down the whole map image, as coordinate add-ons show them). Positions are each hub's
 * innkeeper, flight master or main questgiver in the vanilla 1.12 database at classicdb.ch, unless noted.
 */

export interface Hub {
  name: string;
  /** In-game map coordinates; absent when the hub's position is unknown. */
  x?: number;
  y?: number;
  /** The zone the hub is in when it is not the zone it serves (e.g. Tarren Mill for Alterac Mountains). */
  elsewhere?: string;
  /** The NPC or source the position comes from. */
  source: string;
}

export const ZONE_HUBS: Record<string, Hub[]> = {
  durotar: [
    { name: "Valley of Trials", x: 43.3, y: 68.5, source: "Kaltunk" },
    { name: "Razor Hill", x: 51.5, y: 41.6, source: "Innkeeper Grosk" },
    { name: "Sen'jin Village", x: 56.0, y: 74.7, source: "Master Gadrin" },
    { name: "Orgrimmar", x: 45.5, y: 11.5, source: "Orgrimmar's gate on the zone map" },
  ],
  mulgore: [
    { name: "Camp Narache", x: 44.9, y: 77.1, source: "Grull Hawkwind" },
    { name: "Bloodhoof Village", x: 46.6, y: 61.1, source: "Innkeeper Kauth" },
    { name: "Thunder Bluff", x: 37.5, y: 30.5, source: "Thunder Bluff's mesa on the zone map" },
  ],
  tirisfal: [
    { name: "Deathknell", x: 30.2, y: 71.7, source: "Undertaker Mordo" },
    { name: "Brill", x: 61.7, y: 52.1, source: "Innkeeper Renee" },
    { name: "Undercity", x: 63.5, y: 64.5, source: "The Lordaeron ruins above the Undercity on the zone map" },
  ],
  "zephras-isle": [],
  barrens: [
    { name: "The Crossroads", x: 51.5, y: 30.3, source: "Devrak" },
    { name: "Ratchet", x: 63.1, y: 37.2, source: "Bragok" },
    { name: "Camp Taurajo", x: 44.5, y: 59.2, source: "Omusa Thunderhorn" },
  ],
  stonetalon: [
    { name: "Malaka'jin", x: 74.5, y: 97.9, source: "Witch Doctor Jin'Zil" },
    { name: "Sun Rock Retreat", x: 45.1, y: 59.8, source: "Tharm" },
  ],
  ashenvale: [
    { name: "Zoram'gar Outpost", x: 12.2, y: 33.8, source: "Andruk" },
    { name: "Splintertree Post", x: 73.2, y: 61.6, source: "Vhulgra" },
  ],
  "thousand-needles": [
    { name: "Freewind Post", x: 45.1, y: 49.1, source: "Nyse" },
    { name: "Mirage Raceway", x: 78.1, y: 77.1, source: "Fizzle Brassbolts" },
  ],
  desolace: [
    { name: "Shadowprey Village", x: 21.6, y: 74.1, source: "Thalon" },
    { name: "Ghost Walker Post", x: 52.3, y: 53.4, source: "Maurin Bonesplitter" },
  ],
  dustwallow: [{ name: "Brackenwall Village", x: 35.6, y: 31.9, source: "Shardi" }],
  "shen-dralas": [],
  feralas: [{ name: "Camp Mojache", x: 75.5, y: 44.4, source: "Shyn" }],
  tanaris: [
    { name: "Gadgetzan", x: 51.6, y: 25.4, source: "Bulkrek Ragefist" },
    { name: "Steamwheedle Port", x: 67.0, y: 22.4, source: "Yeh'kinya" },
  ],
  azshara: [{ name: "Valormok", x: 22.0, y: 49.6, source: "Kroum" }],
  "un-goro": [{ name: "Marshal's Refuge", x: 45.2, y: 5.8, source: "Gryfe" }],
  felwood: [{ name: "Bloodvenom Post", x: 34.4, y: 54.0, source: "Brakkar" }],
  winterspring: [{ name: "Everlook", x: 60.5, y: 36.3, source: "Yugrek" }],
  silithus: [{ name: "Cenarion Hold", x: 48.7, y: 36.7, source: "Runk Windtamer" }],
  "mount-hyjal": [
    { name: "Summit of Eternity", x: 75.8, y: 28.4, source: "Flight point in beta client data, at its label on the zone map" },
    { name: "Tainted Foothills", x: 73.8, y: 67.0, source: "Flight point in beta client data, at its label on the zone map" },
  ],
  silverpine: [{ name: "The Sepulcher", x: 45.6, y: 42.6, source: "Karos Razok" }],
  hillsbrad: [{ name: "Tarren Mill", x: 60.1, y: 18.6, source: "Zarise" }],
  alterac: [{ name: "Tarren Mill", elsewhere: "Hillsbrad Foothills", source: "Zarise" }],
  arathi: [{ name: "Hammerfall", x: 73.1, y: 32.7, source: "Urda" }],
  stranglethorn: [
    { name: "Grom'gol Base Camp", x: 32.5, y: 29.4, source: "Thysta" },
    { name: "Nesingwary's Expedition", x: 35.7, y: 10.8, source: "Hemet Nesingwary" },
    { name: "Booty Bay", x: 26.9, y: 77.1, source: "Gringer" },
  ],
  badlands: [{ name: "Kargath", x: 4.0, y: 44.8, source: "Gorrik" }],
  "swamp-of-sorrows": [{ name: "Stonard", x: 46.1, y: 54.8, source: "Breyk" }],
  riverglades: [
    { name: "Rog'mar", x: 58.1, y: 44.3, source: "Town label on the Forever zone map" },
    { name: "Powderfuse Port", x: 75.6, y: 49.7, source: "Town label on the Forever zone map" },
  ],
  hinterlands: [{ name: "Revantusk Village", x: 81.7, y: 81.8, source: "Gorkas" }],
  "searing-gorge": [
    { name: "Thorium Point", x: 34.8, y: 30.9, source: "Grisha" },
    { name: "Kargath", elsewhere: "Badlands", source: "Gorrik" },
  ],
  "blasted-lands": [{ name: "Bloodmages' camp", x: 50.5, y: 14.2, source: "Bloodmage Drazial" }],
  "burning-steppes": [{ name: "Flame Crest", x: 65.7, y: 24.2, source: "Vahgruk" }],
  "western-plaguelands": [{ name: "The Bulwark", x: 83.1, y: 68.9, source: "High Executor Derrington" }],
  "eastern-plaguelands": [{ name: "Light's Hope Chapel", x: 80.2, y: 57.0, source: "Georgia" }],
  wetlands: [],
};

/** Zones whose maps or hubs Blizzard changed in Forever; their vanilla positions may be slightly off. */
export const CHANGED_ZONE_MAPS = ["tirisfal", "mulgore", "desolace", "alterac", "eastern-plaguelands"];
