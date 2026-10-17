# WoW Forever Talent Calculator

The product specification is [docs/PRD.md](docs/PRD.md). Treat it as the source of truth for requirements, talent rules and acceptance criteria; when a change alters behaviour it describes, update the PRD in the same change.

## Commands

- `npm run dev` – start the dev server
- `npm test` – unit and data-validation tests (Vitest)
- `npm run lint` – ESLint
- `npm run build` – type-check and production build

## Layout

- `src/lib/talents.ts` – pure calculator rules (allocation, validation, URL encoding)
- `src/data/types.ts` – data model; `src/data/classes/*.json` – one talent data file per class
- `src/components/` – UI components
