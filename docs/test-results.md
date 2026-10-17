# Browser test results — 17 Oct 2026

Run of [test-cases.md](test-cases.md) against the dev server (`http://localhost:5174`) in the in-app browser (Chromium). Talents were clicked, right-clicked, Shift+clicked and hovered with dispatched DOM events; Copy link, the native right-click, Tab/Enter/Space and reloads were done with real input.

**Result: 49 pass, 9 fail (2 of them partial), 0 blocked.** All five issues are now fixed: see [Re-run after fixes](#re-run-after-fixes).

## Failures

| # | Cases | Issue | Evidence |
| --- | --- | --- | --- |
| 1 | TC-18, TC-23, TC-28, TC-43 | **Required level is 10 + P, PRD says 9 + P.** A full 51-point build shows level **61**. | 1 pt → 11; 30 pts → 40; 50 pts → 60; 51 pts → 61 |
| 2 | TC-49, TC-43 | **Shared Paladin links lose Divine Precision.** When a link is decoded, Divine Precision (T5C1) is applied before Holy Shock (T5C2), the same-tier talent it requires, so it gets dropped and the hash is rewritten. | Built 22 pts in the UI, `#/paladin/55320003200011` → after reload 21 pts, `#/paladin/55320003200001`, Divine Precision 0/3 |
| 3 | TC-42, TC-56 (partial) | **Tooltips for columns 3–4 spill outside the tree and off the left edge of the screen.** They open on the correct side, but the 280 px tooltip doesn't fit. | At 768 px: Improved Channeling tooltip left = −83 px, clipped. At 1024 px: −103 px. At 1440 px: Arcane Focus tooltip ends 83 px past the tree's right edge. |
| 4 | TC-13 | **Connector stays dim when the prerequisite is maxed but the tier is locked.** | Ice Lance 1/1 with 11 Frost points: the Ice Lance → Fingers of Frost arrow is not `active` |
| 5 | TC-04 (partial) | **Class names in the picker use Inter, PRD says Cinzel.** Tree headings are cream `rgb(232,220,198)`, not gold. Page title, background and body font pass. | computed `fontFamily` / `color` |

## Notes (passing, but worth knowing)

- Link format writes an empty middle tree as `--` (for example `#/mage/0500003--21`), while the PRD example uses `-0-`. Both decode correctly.
- The PRD's example link `#/mage/0500320-0-31` is invalid (3 points in two max-2 talents). It loads as 12 points, `#/mage/050022--21`.
- `#/MAGE` and `#/deathknight/55` both fall back to Druid. The `MAGE` hash is not rewritten to `#/druid`, and `55` gets applied to Druid Balance (10 points).
- The tooltip on a **locked** talent still says "Click to learn".
- TC-26's expected hash in the test-case file has a typo (`5500000112`). The correct value, `--550000012`, is what the app produced.
- TC-02 was run by stubbing `Date`: "NOW LIVE" shows at 15:01 PST on 4 Nov and "LAUNCHES IN 1 DAY" at 14:59.
- No console errors or warnings during the run. No cookies or storage are used, and the only network hosts are localhost, Google Fonts and `wow.zamimg.com`.

## Per-case status

| Area | Pass | Fail |
| --- | --- | --- |
| A. Shell (TC-01–04) | 01, 02, 03 | 04 (partial) |
| B. Class picker (TC-05–08) | 05, 06, 07, 08 | |
| C. Trees (TC-09–14) | 09, 10, 11, 12, 14 | 13 |
| D. Talent display (TC-15–17) | 15, 16, 17 | |
| E. Allocation (TC-18–29) | 19, 20, 21, 22, 24, 25, 26, 27, 29 | 18, 23, 28 (level only) |
| F. Removal (TC-30–36) | 30, 31, 32, 33, 34, 35, 36 | |
| G. Tooltips (TC-37–42) | 37, 38, 39, 40, 41 | 42 |
| H. Summary / reset (TC-43–45) | 44, 45 | 43 |
| I. Sharing (TC-46–52) | 46, 47, 48, 50, 51, 52 | 49 |
| J. Accessibility (TC-53–54) | 53, 54 | |
| K. Layout / quality (TC-55–58) | 55, 57, 58 | 56 (partial) |

TC-18, TC-23 and TC-28 pass on everything except the required-level value.

## Re-run after fixes

All 9 failing cases now pass.

| Issue | Fix | Re-run result |
| --- | --- | --- |
| 1. Required level | `requiredLevel` returns `9 + P` (`src/lib/talents.ts`) | TC-18: 1 pt → 10 · TC-23: 31 pts → 40 · TC-28: 50 → 59, 51 → **60** · TC-43: 22 pts → 31 |
| 2. Paladin link decode | `decodeBuild` keeps replaying a tier until nothing more can be added, so column order no longer matters | TC-49 / TC-43: after reload `#/paladin/55320003200011` gives 22 pts, Holy Shock 1/1, Divine Precision 1/3, and the hash is unchanged |
| 3. Tooltip overflow | Tooltips open beside the talent (right for columns 1–2, left for 3–4) and narrow to fit the space. If less than 200 px is free, they open below the talent, kept inside the tree. | TC-42 / TC-56: at 1440, 768 and 375 px, all 12 first-row tooltips across 3 trees sit inside their tree and the viewport. No horizontal scroll. |
| 4. Connector highlight | The arrow lights up as soon as the prerequisite is maxed | TC-13: Ice Lance 1/1 → arrow `active`, Fingers of Frost still locked. TC-12: arrows still dim on an empty build. |
| 5. Fonts / colours | Class names in the picker use Cinzel; tree headings are gold | TC-04: class label `Cinzel`, tree `h2` `rgb(248, 183, 0)` |

Unit tests added to `src/lib/talents.test.ts`: `requiredLevel` for 0, 1 and 51 points; decoding a same-tier prerequisite that sits in a higher column; the Paladin Holy link. Four of these fail on the old code. `npm test` (50 tests), `tsc -b`, `npm run lint` and `npm run build` (84 kB gzipped JS) all pass. No console errors.

**Trade-off:** in columns 2 and 3 there is never 200 px free beside the talent, so those tooltips always open below it. The PRD's "right for 1–2, left for 3–4" now applies only to the outer columns, and only when there is room. The PRD may need updating to match.
