# Plan: zone maps with quest hub locations

Status: done (17 Oct 2026, branch `fix/prd-test-findings`), except dungeon entrance pins on zone maps (see Follow-ups).

## Goal

From the leveling guide, a player can open the map of a zone and see where its quest hubs are, with the current step's hub highlighted. The guide's route map currently shows whole continents only.

## User experience

- **Opening a zone map.** The selected step's detail in the step list gets an "Open zone map" button; for a dungeon step it opens the entrance zone. The continent map's toolbar also shows "Open <Zone> map" for the selected step's zone. A zone click on the continent map already zooms to the zone and cycles its visits, so double-click is not reused for this.
- **The dialog.** A modal `<dialog>` (same pattern as the class quiz) titled with the zone name and level range. It shows:
  - the in-game Forever zone map image;
  - a pin for each Horde or neutral quest hub, labelled with the hub's name, with the selected step's hub highlighted in gold;
  - a pin for each dungeon entrance in the zone;
  - a list of the zone's visits on the route (step number, levels and hub). Clicking a visit selects that step and closes the dialog.
- **Closing.** Press Esc, click the close button or click the backdrop. Focus returns to the button that opened the dialog.
- **Missing data.** A hub whose position is not published (for example Rog'mar in Riverglades) is listed under the map as "location not published" rather than pinned. If a zone map image fails to load, the dialog shows the pins on a plain panel with a note.
- **Phone.** The map scales to the dialog width with no horizontal scroll at 375 px; labels stay legible.

## Data

1. **Zone map images.** Use the Forever zone maps from warcraft.wiki.gg (`WorldMap-<Zone>_c60.jpg`; new zones use `WorldMap-Riverlands.jpg`, `WorldMap-Shendralas.jpg`, `WorldMap-Hyjal-forever.jpg` and `WorldMap-ZephrasIsle.jpg`, listed on [Forever map comparison](https://warcraft.wiki.gg/wiki/Forever_map_comparison)). Convert each to WebP in `public/maps/zones/<zone-id>.webp`. Zone maps are 1002×668 like the continent maps, but the playable area sits in the middle; coordinates are given relative to the whole image.
2. **Hub coordinates.** Add `src/data/hubs.ts`, which maps each zone id to its hubs:
   - fields: `name`, `x` and `y` as in-game map coordinates (0–100, as shown by coordinate add-ons), `kind` (`"town"` for a hub with quests, `"flight"` when only the flight master is known), and `source`;
   - take each position from the hub's innkeeper or flight master on classicdb.ch (vanilla 1.12 data);
   - in Forever-changed zones (Tirisfal, Mulgore, Desolace, Alterac, Eastern Plaguelands), check positions against the Forever map image and correct any that are off;
   - give new-zone hubs (Rog'mar, Powderfuse Port, Hyjal, Shen'dralas and Zephras Isle) `x`/`y` only where a source publishes them; otherwise leave them unpinned.
3. **Linking steps to hubs.** A step's `hub` string may name several hubs ("The Crossroads, Ratchet"). Match each name against the zone's hubs so the dialog can highlight them, and add a test that every hub named by a zone step resolves to a hub in `hubs.ts` (pinned or explicitly unpinned).
4. **Dungeon entrances on zone maps.** Add zone-map coordinates for each dungeon entrance (`zoneMap: {x, y}`) where known from classicdb.ch or the wiki; otherwise leave the dungeon unpinned on the zone map.

## Code

- `src/data/hubs.ts`: hub data, as described above.
- `src/lib/leveling.ts`: add `hubsForStep(step)`, which returns the step zone's hubs and marks the ones the step names. It should be a pure function with unit tests.
- `src/components/ZoneMapDialog.tsx`: the dialog. It takes the zone, the route, the selected step, `onSelect` and `onClose`.
- `src/components/LevelingGuide.tsx`: owns the open-zone state and renders the dialog. Step detail gets an "Open zone map" button.
- `src/components/RouteMap.tsx`: takes an `onOpenZone(zoneId)` prop and shows an "Open <Zone> map" toolbar button for the selected step's zone.
- `src/App.css`: styles for the dialog, the pins and the visit list, reusing the quiz dialog's styles.

## Tests and docs

- **Unit tests:**
  - every route zone that is drawn on the maps has a zone map image file;
  - every hub coordinate is between 0 and 100;
  - every zone step's hubs resolve;
  - `hubsForStep` marks the right hubs.
- **Browser tests:**
  - TC-76: open the zone map from a step and see the hub pin highlighted; Esc closes it and focus returns to the button.
  - TC-77: the continent map's "Open <Zone> map" button opens the zone map; a visit in the list selects that step.
  - TC-78: the zone map has no horizontal scroll at 375 px.
- **PRD:** add FR-30 (zone maps) and the hub-coordinate sources; update the acceptance criteria. **Test cases:** add the three cases above and update the coverage tables.

## Steps

- [x] Write this plan
- [x] Download the zone maps and convert them to WebP
- [x] Gather hub coordinates (classicdb.ch) and write `hubs.ts`
- [x] Add `hubsForStep` with unit tests
- [x] Build `ZoneMapDialog` and wire it into the guide and the route map
- [x] Add browser tests TC-76 to TC-78
- [x] Update the PRD and the test cases
- [x] Verify in the browser at desktop and phone widths

## Follow-ups

- Dungeon entrance pins on zone maps (Data item 4) were not added: the zone maps label most entrances already, and vanilla entrance coordinates still need sourcing.
- Re-check hub positions in the zones Blizzard changed (Tirisfal, Mulgore, Desolace, Alterac and Eastern Plaguelands) against the live game at launch.
