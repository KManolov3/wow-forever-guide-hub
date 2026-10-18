/** Horde starting zones the leveling guide can begin in; kept apart from the guide data so links parse cheaply. */
export const STARTING_ZONES = ["durotar", "mulgore", "tirisfal", "zephras-isle"] as const;
export type StartingZoneId = (typeof STARTING_ZONES)[number];

export const isStartingZone = (id: string): id is StartingZoneId => (STARTING_ZONES as readonly string[]).includes(id);
