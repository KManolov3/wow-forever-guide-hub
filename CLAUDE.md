# WoW Forever Talent Calculator

The product specification is [docs/PRD.md](docs/PRD.md). Treat it as the source of truth for requirements, talent rules and acceptance criteria; when a change alters behaviour it describes, update the PRD in the same change.

## Commands

- `npm run dev` – start the dev server
- `npm test` – unit and data-validation tests (Vitest)
- `npm run test:e2e` – browser tests for [docs/test-cases.md](docs/test-cases.md) (Playwright, `e2e/`); starts the dev server if one isn't running
- `npm run lint` – ESLint
- `npm run build` – type-check and production build

## Layout

- `src/lib/talents.ts` – pure calculator rules (allocation, validation, URL encoding)
- `src/data/types.ts` – data model; `src/data/classes/*.json` – one talent data file per class
- `src/lib/leveling.ts` – pure leveling-guide logic (route building, travel directions, level lookup)
- `src/data/leveling.ts` – Horde zones, dungeons, map positions and the leveling route; `src/data/mapShapes.ts` – zone outlines on the map images in `public/maps/`
- `src/components/` – UI components
