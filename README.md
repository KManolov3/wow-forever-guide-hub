# WoW Forever Talent Calculator

A talent calculator for **World of Warcraft: Forever** (launching November 4, 2026), built as a demo of AI-assisted development.

The product specification is in [docs/PRD.md](docs/PRD.md).

## Features

- All nine classes, three trees each, with Forever's rebalanced talents (new talents are tagged **NEW**)
- 51 points (levels 10–60), 5 points per tier, prerequisite arrows
- Click to learn, right-click / Shift+click to unlearn; removals that would break the build are blocked
- Tooltips with per-rank descriptions and unmet requirements
- Points spent, tree split and required level
- Shareable builds via the URL (`#/<class>/<ranks>`)

## Running

```bash
npm install
npm run dev
```

```bash
npm test
```

## Project layout

- `src/data/types.ts` – data model for classes, trees and talents
- `src/data/classes/*.json` – talent data per class (one file per class, auto-discovered)
- `src/lib/talents.ts` – pure calculator rules (allocation, validation, URL encoding)
- `src/components/` – UI components

## Data

Talent data comes from the WoW Forever beta (game build 1.60.1.70425), sourced from
[warcraft.wiki.gg](https://warcraft.wiki.gg/wiki/World_of_Warcraft:_Forever) and Zockify's datamined talent data.
It may change before launch. The `isNew` flag marks talents that did not exist in Classic and was assigned by hand.
Icons are loaded from the Wowhead CDN.

Not affiliated with Blizzard Entertainment.
