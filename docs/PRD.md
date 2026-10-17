# PRD: WoW Forever Talent Calculator

Oct 17, 2026 · Kaloyan Manolov · [Live doc](https://claude.ai/code/artifact/98e43ff8-2c95-4765-af99-d88f099841db)

## Overview

A web talent calculator that lets World of Warcraft: Forever players plan and share a level-60 build for any of the 9 classes before and after the November 4, 2026 launch, with a Horde leveling guide that plans the road from level 1 to 60. It doubles as a showcase of AI-assisted development: v1 was researched, designed, built and verified by Claude in one session.

**Background.** WoW: Forever is Blizzard's third permanent game version, alongside Retail and Classic. It recreates the 2004 era with a level cap of 60, but every class has rebalanced talent trees, many new talents and a new 16-point milestone talent. Classic-era calculators therefore give wrong answers for Forever.

**Goals**

1. Give players an accurate, Forever-specific calculator for all 9 classes on launch day.
2. Make builds shareable as a single link.
3. Demonstrate end-to-end AI delivery: research, data gathering, implementation, tests and browser verification.

**Success metrics**

| Metric | Target |
| --- | --- |
| Classes covered at launch | 9 of 9 |
| Talent data matching the live game build | 100% of talents on launch day |
| Shared-link round trip | A shared link restores the exact build, every time |
| Time to first point allocated | Under 10 seconds from page load |

## Target users and user stories

The primary user is a WoW: Forever player choosing or refining a spec. Secondary users are guide writers and guild leaders who share builds, and stakeholders viewing the app as an AI demo.

| Persona | Need |
| --- | --- |
| New or returning player | Understand how a class's Forever trees differ from Classic before picking a class |
| Planner / min-maxer | Build a precise 51-point spec and check the level each talent arrives at |
| Guide writer / guild leader | Share a build with others as one link |
| Demo audience | See a polished, working product built by AI |

**User stories**

1. As a player, I pick a class and see its three Forever talent trees, so I can explore what is available.
2. As a player, I click a talent to add a point and right-click to remove one, so I can plan a build quickly.
3. As a player, I hover a talent to read what each rank does and what it requires, so I can make informed choices.
4. As a player, I see points spent, the tree split and the level required, so I know when my build is complete.
5. As a player, I can spot talents that are new in Forever, so I can learn what changed from Classic.
6. As a guide writer, I copy a link that restores my exact build, so I can share it in guides and chat.
7. As a player on a phone, I can use the calculator without horizontal scrolling.
8. As a new player, I answer a short quiz about how I like to play and get a recommended class and spec, so I know where to start.
9. As a Horde player who wants to see everything, I follow a leveling route that takes me through every Horde zone and dungeon close to its level, starting from my own race's starting zone, and tick off steps as I go.
10. As a player mid-way through leveling, I enter my level and jump to the step I should be doing now.

## Scope

v1 is a single-page, client-only calculator for class talents; anything account-wide or server-backed is out of scope.

**In scope (v1)**

- All 9 classes: Druid, Hunter, Mage, Paladin, Priest, Rogue, Shaman, Warlock, Warrior, with 3 trees each
- Point allocation with tier and prerequisite rules, capped at 51 points
- Rich tooltips with per-rank descriptions and unmet requirements
- Build summary: points spent, tree split, required level
- Shareable build links and reset (per tree and whole build)
- Responsive layout for desktop, tablet and phone
- A class-choice quiz that recommends a class and spec from playstyle answers
- A Horde completionist leveling guide (1–60) with a level timeline, a route map and a step checklist

**Out of scope (v1)**

- The Legacy System (account-wide talents such as Talented)
- Dual spec comparison, respec cost tracking
- Stats, gear or damage simulation
- User accounts, saved builds or a backend
- Races and racials
- Localisation (English only)
- Suggested starter builds from the quiz (see Roadmap: build library)
- An Alliance leveling guide, quest-by-quest directions, coordinates and real game maps

## Functional requirements

The app has two views, switched from the header: the calculator (class picker, build summary bar, three trees side by side, and a footer with help and data attribution) and the leveling guide. The class quiz opens as a modal dialog over either view.

| ID | Area | Requirement | Priority |
| --- | --- | --- | --- |
| FR-1 | Header | Show the product title and a countdown to launch ("launches in N days"); show "now live" after 4 Nov 2026, 15:00 PST. | Should |
| FR-2 | Class picker | List all 9 classes with icon and name in official class colour; the selected class is highlighted. | Must |
| FR-3 | Class picker | Switching class clears the current build. | Must |
| FR-4 | Trees | Show the class's three trees with name, icon and points spent per tree. | Must |
| FR-5 | Trees | Place each talent on a 4-column, 7-tier grid at its in-game position. | Must |
| FR-6 | Trees | Draw a connector from each prerequisite to the talent that requires it, highlighted once the prerequisite is maxed. | Must |
| FR-7 | Talent | Show the icon, current/max rank badge and a NEW badge when the talent is new in Forever. | Must |
| FR-8 | Talent | Visual states: locked (greyed), available (green), partially ranked (green glow), maxed (gold). | Must |
| FR-9 | Allocation | Left-click adds one rank when the rules allow; otherwise nothing happens. | Must |
| FR-10 | Allocation | Right-click or Shift+click removes one rank when the rules allow; the browser context menu is suppressed on talents. | Must |
| FR-11 | Tooltip | On hover or keyboard focus, show name, rank N/M, unmet tier or prerequisite requirements (in red), the current rank's text, the next rank's text, and a learn/unlearn hint. | Must |
| FR-12 | Summary | Show class name, points spent of 51, tree split (e.g. 31 / 20 / 0) and required level. | Must |
| FR-13 | Reset | Reset per tree and "Reset all"; disabled when there is nothing to reset. | Must |
| FR-14 | Sharing | The URL always reflects the current class and build; "Copy link" copies it and confirms with "Copied!". If the clipboard is unavailable, show the link in a prompt. | Must |
| FR-15 | Sharing | Opening a link restores the class and build; editing the URL hash in place updates the view. | Must |
| FR-16 | Footer | Show controls help, a link to the data source, a beta-data disclaimer and "Not affiliated with Blizzard Entertainment". | Must |
| FR-17 | Quiz | A "Find my class" button in the header opens the class quiz in a modal dialog; Esc or the close button closes it without changing the build. | Must |
| FR-18 | Quiz | Show one question at a time with "Question N of 8" progress; choosing an answer moves to the next question; "Back" returns to the previous one with the earlier answer marked. | Must |
| FR-19 | Quiz | After the last question, show the best match (class, spec, match %, a class tagline and the reasons from the answers) and the next two classes; "Retake quiz" starts over. Reopening the dialog shows the last results until the quiz is retaken or the page reloads. | Must |
| FR-20 | Quiz | "Open <Class> talents" closes the quiz, selects that class with an empty build, and marks the recommended tree "Suggested" until the class changes. | Must |
| FR-21 | Views | The header has "Talents" and "Leveling guide" links; the current one is marked. Switching views keeps the class, build and starting zone. The subtitle names the current view. | Must |
| FR-22 | Guide | A starting-zone picker offers Durotar (Orc & Troll), Mulgore (Tauren), Tirisfal Glades (Undead) and Zephras Isle (Skyborne, Horde). The route starts there and never visits the other starting zones. | Must |
| FR-23 | Guide | The URL is `#/leveling/<starting-zone>`; opening it restores the guide and starting zone, and an unknown zone falls back to Durotar. | Must |
| FR-24 | Guide | A level timeline shows one row per zone or dungeon and one bar per visit along levels 1–60; zones and dungeons have different colours, unconfirmed level ranges are hatched, and hovering or focusing a bar shows the step, levels, quest hub and visit number. Clicking a bar selects that step. | Must |
| FR-25 | Guide | The route map is the in-game Forever map of one continent at a time (Kalimdor or Eastern Kingdoms). Each zone on the route is outlined on it and tinted by level band, with its name, level range and visit count (a label sits off the zone's centre where it would otherwise cover a neighbouring label or marker, so at the whole-continent view no label overlaps another label or marker); dungeons, cities and ports are marked and the route's legs drawn. Zones and dungeons are buttons: hovering or focusing one shows its levels, hubs and visits, and clicking selects it (a zone with several visits cycles through them). Clicking a zone centres the map on it and zooms in so its outline takes up about the middle 40% of the map, leaving the neighbouring zones in view (at most 2.5×); clicking a dungeon centres on its entrance and zooms in to at least 2.5×. The map opens zoomed in on the selected step, follows it to its continent and keeps it in view; it pans by dragging and zooms with buttons, double-click or Ctrl/⌘ + scroll. A caption says how to get to the selected step. | Must |
| FR-26 | Guide | The step list shows each step's number, name, zone or dungeon, visit number, quest hub and levels; the selected step expands to show how to get there, what to do and any unconfirmed details. Content new in Forever has a NEW badge. | Must |
| FR-27 | Guide | "My level" selects the first unfinished step covering that level. | Should |
| FR-28 | Guide | Each step has a "done" checkbox; the summary shows progress (done / total), which survives a reload; "Reset progress" clears it. | Should |
| FR-29 | Guide | A "Left out on purpose" panel lists the zones and dungeons the route skips and why. | Must |
| FR-30 | Guide | "Open <Zone> map" (in the selected step's detail and in the route map's toolbar) opens that zone's in-game Forever map in a modal dialog; a dungeon step opens its entrance zone. The map pins each quest hub with its name and the numbers of the route steps that use it; the shown trip's hubs are highlighted, and clicking a pin shows the next trip that uses that hub. Beside the map (below it on phones, where the map stays in view while the list scrolls) the dialog lists the route's trips to the zone: its visits and the dungeons entered from it, each with its step number, levels and hubs. The shown trip, at first the selected step or else the zone's first trip, is expanded with its directions, hubs (hubs in other zones marked apart), objectives and a "done" checkbox. Choosing a trip selects that step and keeps the dialog open. "Previous step" and "Next step" buttons walk the route and switch to the next step's zone map when it is elsewhere. The dialog also lists the zone's hubs with their coordinates and steps, and a note for zones Blizzard changed in Forever. Esc, the close button or a backdrop click closes it, and focus returns to the button that opened it. | Must |

## Talent rules

A point can be added only when the build is under 51 points, the talent is below max rank, its tier is unlocked and its prerequisite is maxed; a point can be removed only if every other invested talent stays valid.

```mermaid
flowchart TD
    click[Player left-clicks a talent] --> total{Fewer than 51 points spent in total?}
    total -- yes --> rank{Talent below its max rank?}
    rank -- yes --> tier{Enough points in the tiers below?}
    tier -- yes --> prereq{Prerequisite talent at max rank?}
    prereq -- yes --> add[Add one rank, update link]
    total -- no --> ignore[No change: click is ignored; tooltip shows any unmet tier or prerequisite]
    rank -- no --> ignore
    tier -- no --> ignore
    prereq -- no --> ignore
```

The checks run in order on every click; the first failed check stops it, and the tooltip lists any unmet tier or prerequisite requirement in red.

**Points and levels**

- One point per level from 10 to 60: 51 points in total.
- Points can be spread freely across all three trees.
- Required level for a build of P points (P > 0): **level = 9 + P**.

**Tiers**

- Each tree has 7 tiers. Tier T unlocks when at least (T − 1) × 5 points are spent on tiers below T in the same tree.
- Milestone talents sit at 11, 16, 21 and 31 points; they follow the normal tier rule, so they need no special handling.

**Prerequisites**

- A talent with a prerequisite unlocks only when that prerequisite is at max rank.
- A prerequisite is usually in a lower tier, but may sit in the same tier (Priest: Improved Mind Flay requires Mind Flay; Paladin: Divine Precision requires Holy Shock).

**Removing points**

- Removing a rank is allowed only if, after removal, every talent with points still meets its tier and prerequisite rules.
- Example: with 5 points in tier 1 and 1 in tier 2, no tier-1 point can be removed until the tier-2 point is removed first.

**Build link format**

- URL hash: `#/<class-id>/<tree1>-<tree2>-<tree3>`, e.g. `#/mage/0500320-0-31`.
- Each tree is one digit per talent, in tier then column order; trailing zeros and empty trailing trees are trimmed.
- When decoding, points are replayed tier by tier through the normal rules, so an invalid or tampered link drops illegal points instead of producing an impossible build.
- An unknown class id falls back to the first class.

## Class quiz

The quiz scores every spec against the answers and recommends the class whose best spec scores highest. It runs entirely in the browser and stores nothing.

**Tone.** The quiz is written for experienced WoW players. Each question is a joke scenario built on WoW and gamer stereotypes (pulling before the healer has mana, Tarren Mill on fire, "Can it tank?"), so the answer that leads to each trait is not obvious. Reasons on the result use the same voice, and the best match ends with a one-line class send-off.

**Questions (in order), by what they measure:** group role, class fantasy, main activity (solo, dungeons and raids, PvP), pet companion, rotation complexity, fight style (burst, damage over time, crowd control, support), survival style, and faction (where you hearth to).

**Scoring**

- Each spec has a profile of playstyle traits (e.g. `tank`, `holy`, `pet`, `burst`). Each answer gives weights to traits; a spec's score is the sum of the weights of its traits over all answers. Some weights are negative (e.g. "I'd rather fight alone" counts against pet specs).
- A class's score is its best spec's score; classes are ranked by that, ties in class-picker order.
- Match % = the spec's score ÷ the highest score the chosen answers could give, rounded and never below 0.
- Reasons are the answers that added points to the recommended spec.
- Faction: Alliance excludes Shaman and Horde excludes Paladin, as in Classic; "Not decided yet" excludes nothing.

Questions, spec profiles and class taglines live in `src/data/quiz.ts`; the scoring is a pure function in `src/lib/quiz.ts`. Automated tests check that every spec of every class has exactly one profile and that every class can be the top recommendation for some set of answers.

## Leveling guide

The guide plans a Horde completionist playthrough: every Horde quest hub and every dungeon the Horde can reasonably reach, each done as close to its level as the route allows. Wide-ranging zones are visited several times (the Barrens and Stranglethorn Vale three times each).

**Route rules (enforced by automated tests)**

- The route is the chosen starting zone, then one shared route of 73 steps from level 10 to 60, ordered by the level each step starts at, with no level left uncovered.
- Every non-starting Horde zone and every listed dungeon appears at least once; no step goes to a starting zone.
- A step starts no more than 2 levels below its place's level range and ends within it.
- Every zone with Horde quests has an outline on the map, and every dungeon entrance lies inside its zone or on an island just off its coast. A completionist outlevels content, so arriving a little early is preferred to arriving late.
- Repeat visits to a place come at increasing levels and do not overlap.
- Travel between steps is computed: crossing continents uses the zeppelin (Orgrimmar–Undercity, Orgrimmar–Grom'gol) arriving nearest the destination; the boats (Ratchet–Booty Bay, Steamwheedle Port–Powderfuse Port) only when both places are near their docks; and the Undercity–Grom'gol zeppelin within the Eastern Kingdoms only when one end is in Tirisfal or Stranglethorn. Horde Skyborne leave Zephras Isle by airship to Skywatcher Plateau in Mulgore.

**What is left out**

- Other Horde starting zones, Alliance starting zones, and zones with no Horde quests (Westfall, Redridge, Duskwood, Loch Modan, Wetlands, Darkshore, Deadwind Pass, Moonglade).
- Dungeons deep in Alliance territory: The Deadmines, The Stockade, Gnomeregan, and the new Hall of Thanes (inside Old Ironforge). The new Excavation Site in the Wetlands is on the route: it has Horde quests (from Hammerfall, Orgrimmar and Thunder Bluff) and the Horde reach it over the hills from Arathi Highlands.
- Raids and battlegrounds.

**Forever content.** The route includes the new zones Riverglades (35–45; Horde hub Rog'mar, with flights to Stonard, Kargath, Flame Crest and Hammerfall, and a ship from Powderfuse Port to Tanaris), Shen'dralas (range unannounced; entered from southern Desolace through the Valley of Bones; placed at 44–47) and Mount Hyjal (endgame, through Darkwhisper Gorge in Winterspring), the Skyborne starting zone Zephras Isle (1–12), and the new dungeons Ruins of Lordaeron, Excavation Site: Wetlands, City of Dalaran, The Drowned City, Krol'dok Stronghold, Alcaz Prison, Blackmaw Hold and Shaper's Terrace. Dungeon brackets are Blizzard's beta brackets where published; hubs, flight paths and ships come from beta client data. Anything not confirmed by Blizzard shows a "Not confirmed" note. Other zones use their Forever ranges where sources publish them (Travelcraft, Wowhead) and their 2004 Horde quest hubs.

**Zone maps and hubs.** Each zone's in-game Forever map is in `public/maps/zones/<zone-id>.webp` (from warcraft.wiki.gg). Hub positions in `src/data/hubs.ts` are in-game coordinates (0–100), taken from each hub's flight master, innkeeper or main questgiver in the vanilla 1.12 database at classicdb.ch, and checked against the Forever map images. Hubs in new zones (Rog'mar, Powderfuse Port and Hyjal's flight points) are placed at their labels on the Forever zone maps. Tests check that every zone has a map and a hub list, that every hub a zone or zone step names exists, and that every pin is on its map.

**Map.** The map images are the in-game Forever continent maps (1002×668 px), kept in `public/maps/`. Zone outlines in `src/data/mapShapes.ts` were traced from the zone borders on those images; where the map's own lettering hides a border (Stonetalon and Desolace, Searing Gorge, Burning Steppes, Badlands and Riverglades) the border is approximate.

**Data.** Zones, dungeons, the route, map positions and exclusions live in `src/data/leveling.ts`, zone outlines in `src/data/mapShapes.ts`; route building, travel directions and level lookups are pure functions in `src/lib/leveling.ts`. The guide loads as a separate chunk, so the calculator's first load does not grow.

## Data model and content

Talent data lives in one JSON file per class, loaded at build time; adding or updating a class needs no code change.

**Class**

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Kebab-case, e.g. `mage`; used in links |
| name | string | Display name |
| color | hex string | Official class colour |
| icon | string, optional | Wowhead icon name, e.g. `classicon_mage` |
| source | URL | Where the data was taken from; shown in the footer |
| trees | 3 trees | In in-game order |

**Tree**: id, name, optional icon, and a list of talents.

**Talent**

| Field | Type | Notes |
| --- | --- | --- |
| id | string | Kebab-case of the name, unique within the class |
| name | string | Display name |
| tier | 1–7 | Row in the tree |
| column | 1–4 | Position in the row |
| maxRank | integer ≥ 1 | |
| requires | talent id, optional | Prerequisite that must be maxed; same tree, same or lower tier |
| ranks | list of strings | One description per rank, or a single entry for all ranks; may contain line breaks |
| icon | string, optional | Wowhead icon name |
| isNew | boolean, optional | True if the talent did not exist in Classic |

**Sources.** v1 data is from the Forever beta, game build 1.60.1.70425 (data generated 16 Oct 2026). Talent lists, tiers and prerequisites were cross-checked against the [warcraft.wiki.gg Forever pages](https://warcraft.wiki.gg/wiki/World_of_Warcraft:_Forever); columns, per-rank text and icons come from [Zockify's datamined talent data](https://www.zockify.com/forever/talents/). Where the two disagreed, the newer Zockify build data was used.

**Data quality rules (enforced by automated tests)**

- Every class has exactly 3 trees.
- Talent ids are unique within a tree, and no two talents share a tier and column.
- Tier is 1–7, column 1–4, maxRank ≥ 1, at least one rank description.
- Every prerequisite exists in the same tree at the same or a lower tier.

**Content counts (v1)**

| Class | Trees (talents per tree) |
| --- | --- |
| Druid | Balance 16, Feral Combat 20, Restoration 16 |
| Hunter | Beast Mastery 16, Marksmanship 16, Survival 18 |
| Mage | Arcane 19, Fire 17, Frost 19 |
| Paladin | Holy 17, Protection 16, Retribution 17 |
| Priest | Discipline 18, Holy 17, Shadow 17 |
| Rogue | Assassination 17, Combat 17, Subtlety 19 |
| Shaman | Elemental 16, Enhancement 18, Restoration 16 |
| Warlock | Affliction 17, Demonology 19, Destruction 16 |
| Warrior | Arms 17, Fury 17, Protection 18 |

## UX and visual design

The look follows the in-game talent frame: dark parchment panels, gold accents, Blizzard-style icons, and the selected class's colour as the page accent.

- **Theme:** dark only. Background near-black, panels dark brown, gold (#F8B700) for maxed talents and headings, green (#1EFF00) for learnable talents, red for unmet requirements.
- **Type:** Cinzel for titles, tree and class names; Inter for body text.
- **Icons:** game icons from the Wowhead CDN; when an icon fails to load, show the talent's initials on a dark tile.
- **Leveling guide charts:** zone visits in blue and dungeons in orange on the timeline; on the map, route zones are tinted by level band in five hues running cool to hot (teal 1–19, blue 20–29, violet 30–39, magenta 40–49, red 50–60), chosen to stay distinguishable over the parchment map with colour-blind vision, and separated by thin dark borders; zone outlines do not overlap. Labels, level ranges and a legend mean colour is never the only cue; the selected zone is outlined in gold and other starting zones are shaded out.
- **Tooltips:** game-style dark-blue panels; open to the right of talents in columns 1–2 and to the left in columns 3–4 so they stay inside the tree.
- **Layout:** three trees side by side on desktop (each at least 290 px wide); they wrap to one column on narrow screens. No horizontal page scroll down to 375 px wide. Talent cells are 52 px (46 px under 400 px wide).

**Accessibility**

- Every talent is a real button, reachable by keyboard; focus shows the tooltip and a visible focus ring.
- Talents have an accessible name with the rank, e.g. "Arcane Focus, rank 2 of 5".
- Selected class uses `aria-pressed`; the class picker is a labelled navigation region.
- Gap: removing points needs a right-click or Shift+click, so there is no keyboard-only way to unlearn yet (see Open questions).

## Non-functional requirements

The app is a static single-page site with no backend, so it can be hosted on any static host or CDN.

| Area | Requirement |
| --- | --- |
| Stack | React 18, TypeScript 5.6, Vite 5; Vitest for tests; ESLint |
| Architecture | Calculator rules in one pure module (`src/lib/talents.ts`), separate from UI components and data files |
| Performance | Initial load under 100 kB gzipped (about 90 kB JS + 5 kB CSS); the leveling guide loads on demand (about 20 kB); clicks update instantly |
| Browsers | Current Chrome, Edge, Firefox and Safari, desktop and mobile |
| Offline / network | Works without a backend; icons and fonts need internet access (Wowhead CDN, Google Fonts); the map images (two continent maps of about 190 kB each, and 34 zone maps of 130–190 kB each, loaded only when opened) are served with the app |
| Privacy | No accounts, cookies, analytics or stored personal data; build state lives only in the URL. Leveling-guide progress (ticked step ids) is kept in the browser's local storage and never leaves the device |
| Quality gates | Type-check, lint, unit tests and production build all pass before release |
| Legal | Blizzard names, icons and map images are used for fan purposes with a "Not affiliated with Blizzard Entertainment" notice; the map credits Blizzard and warcraft.wiki.gg |

## Acceptance criteria

v1 is accepted when every item below passes; all were verified for the 17 Oct 2026 build.

- [x] All 9 classes appear in the picker and each shows 3 trees with icons.
- [x] A tier-2 talent stays locked at 4 points in tier 1 and unlocks at the 5th point.
- [x] A talent with an unmaxed prerequisite cannot be learned; it can once the prerequisite is maxed.
- [x] A talent cannot go above its max rank.
- [x] The build stops at 51 points; the summary then shows 51 / 51 and required level 60.
- [x] Removing a point that would strand a higher-tier talent or break a prerequisite is blocked.
- [x] Right-click removes a point without opening the browser menu.
- [x] Tooltips show rank text, next-rank text and unmet requirements.
- [x] Copying a link and reloading it restores the same class and build.
- [x] A link with illegal points loads with those points dropped.
- [x] No horizontal scroll at 375 px wide; no console errors.
- [x] Data quality tests pass for all 9 class files.
- [x] The class quiz recommends a class and spec after 8 questions, lists two runners-up, and "Open … talents" loads that class with the suggested tree marked.
- [x] The quiz respects the faction answer (no Paladin for Horde, no Shaman for Alliance) and has no horizontal scroll at 375 px.
- [x] The leveling guide starts in the chosen starting zone, never visits the other starting zones, and skips The Deadmines, The Stockade and Gnomeregan.
- [x] The guide's timeline shows three Barrens visits; clicking a bar or a map zone selects that step, and the map follows the step's continent.
- [x] "My level" selects a step covering that level; ticked steps survive a reload and "Reset progress" clears them.
- [x] Route rule tests pass (coverage of 10–60, every zone and dungeon visited, steps close to their level range); the guide has no horizontal scroll at 375 px.
- [x] The route map shows the in-game continent map with clickable zone outlines; it zooms, pans and returns to the whole continent.
- [x] A step's zone map opens from the step or the route map, pins the zone's quest hubs with the step's hub highlighted, and fits a 375 px screen.

## Risks, open questions and roadmap

The biggest risk is stale data: v1 uses beta data, and Blizzard may change talents before or after the 4 Nov 2026 launch.

**Risks**

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Talent data changes at launch or in patches | Wrong builds and tooltips | Re-import data at launch and per patch; show the game build in the footer |
| `isNew` flags assigned by hand from memory of Classic | Some talents mislabelled as new or not new | Review flags against an authoritative Classic list |
| Third-party sources (wiki, Zockify, Wowhead CDN) change or block access | Data refresh or icons break | Keep data in the repo; initials fallback for icons; consider self-hosting icons |
| Use of Blizzard names and art | Takedown request | Fan-site notice; no monetisation; remove assets on request |
| Forever's new zones and dungeons are only known from pre-launch coverage and beta data | Leveling steps at the wrong level, or missing Horde hubs | Mark unconfirmed content in the guide; re-check levels and hubs at launch |
| Map images or zone borders change at launch | Outlines no longer match the map | Re-trace `mapShapes.ts` from the launch map; tests check every zone has an outline and every entrance sits in its zone |
| Blizzard revamps classic zones ("expanded and overhauled") without saying which | Classic quest hubs or levels in the guide may be out of date | Review each zone against the live game at launch |

**Open questions**

- [ ] Is the total exactly 51 points? The Legacy perk "Talented" may give points at earlier levels; should v2 model it?
- [ ] Which talent in each tree is the 16-point milestone, and should it be highlighted?
- [ ] How should keyboard users remove points (e.g. Backspace or Delete on a focused talent)?
- [ ] Where will the app be hosted, and under what domain?
- [ ] Should the data source change from beta data to an official source once one exists?
- [ ] Are Paladin and Shaman still faction-locked in Forever? The quiz assumes the Classic rule.
- [ ] Should quiz results be shareable as a link?
- [ ] Does the Steamwheedle Port–Powderfuse Port ship sail at launch, and does Powderfuse Port get a Horde flight path?
- [ ] What level range and Horde hubs does Shen'dralas have, and which new dungeons have Horde quests?
- [ ] Does the Horde still need the Dalaran Sewer Key for City of Dalaran after the Oct 15 change?
- [ ] Should there be an Alliance leveling guide?

**Roadmap**

1. **v1.1 — Launch data refresh:** re-import all 9 classes from the launch build; fix keyboard removal; show the data build number.
2. **v2 — Class quiz (shipped):** an 8-question questionnaire that recommends a class and spec and opens the calculator on it with the suggested tree marked.
3. **v2.x — Build library:** curated starter builds per spec (levelling, raiding, PvP) loadable in one click; the quiz will then open its recommendation with a starter build.
4. **v3 — Horde leveling guide (shipped):** a completionist 1–60 route with a level timeline, route map, step checklist and level lookup.
5. **Later:** races and racials with valid race and class combinations (including the new Skyborne race), Legacy System talents, dual-spec comparison, and localisation.

**Sources**

- [warcraft.wiki.gg — World of Warcraft: Forever](https://warcraft.wiki.gg/wiki/World_of_Warcraft:_Forever)
- [Zockify — WoW Forever talents](https://www.zockify.com/forever/talents/)
- [TechSpot — World of Warcraft: Forever launches November 4](https://www.techspot.com/news/113832-world-warcraft-forever-launches-november-4-new-race.html)
- [Warcraft Tavern — All new zones and areas in WoW: Forever](https://www.warcrafttavern.com/forever/news/all-new-zones-areas-in-wow-forever-revealed-at-blizzcon/)
- [Gfinity — Skyborne race and Zephras Isle guide](https://www.gfinityesports.com/article/world-of-warcraft-forever-skyborne-race-zephras-isle-guide)
- [AccountShark — WoW Forever preview: zones, dungeons and races](https://accountshark.net/blog/wow-forever-complete-preview-2026-zones-dungeons-races) (new dungeon level ranges, citing Wowhead)
- [Travelcraft — WoW Forever guide: zones and levels](https://wow-travelcraft.com/guide.html) (zone ranges, flight paths, ships)
- [WoW Forever Guides — leveling](https://wowforeverguides.com/leveling) (beta client data: Rog'mar, Excavation Site and Ruins of Lordaeron quests, Blizzard dungeon brackets)
- [ConquestCapped — WoW Forever new zones](https://conquestcapped.com/guides/wow-forever/wow-forever-new-zones/) and [LFCarry — WoW Forever new zones](https://lfcarry.com/guides/wow-forever-new-zones) (Riverglades, Shen'dralas, Hyjal access, Dalaran change)
- [warcraft.wiki.gg — Forever map comparison](https://warcraft.wiki.gg/wiki/Forever_map_comparison) (continent and zone map images)
- [classicdb.ch](https://classicdb.ch/) (vanilla 1.12 NPC coordinates for quest hub positions)
