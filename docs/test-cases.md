# Browser test cases: WoW Forever Talent Calculator (v1)

Manual / agent-driven browser test cases derived from [docs/PRD.md](PRD.md). They are automated with Playwright in [`e2e/`](../e2e) (`npm run test:e2e`), one test per case named after its `TC-` id. Expected results follow the PRD; where the current code appears to behave differently, the case carries a **Suspected discrepancy** note so a failure there is expected and should be reported, not "fixed" in the test.

## Conventions

- **Base URL:** `http://localhost:5173` (start with `npm run dev`). Every case starts from a fresh page load of the URL in *Preconditions* unless it says otherwise. Loading a new hash on the same page is not enough: navigate to the URL and reload.
- **Talent positions** are written `T<tier>C<column>`, e.g. Arcane Focus (T1C2).
- **"Click"** means a plain left-click. **"Right-click"** opens the context menu event. **"Shift+click"** is a left-click with Shift held.
- **Finding a talent button.** Each talent is a `<button>` whose accessible name is `"<Talent name>, rank <N> of <M>"`. Trees are `<section>` elements whose `<h2>` is the tree name. Inspection helpers you may paste in the console:

  ```js
  const tree = (name) => [...document.querySelectorAll("section")].find((s) => s.querySelector("h2")?.textContent === name);
  const talent = (treeName, name) => [...tree(treeName).querySelectorAll("button")].find((b) => (b.getAttribute("aria-label") || "").startsWith(name + ","));
  const label = (treeName, name) => talent(treeName, name).getAttribute("aria-label");
  ```
- **Summary bar** shows the class name, "Points" (`N / 51`), "Build" (tree split `a / b / c`) and "Required level".
- **Build link format** (PRD): `#/<class-id>/<tree1>-<tree2>-<tree3>`, one digit per talent in tier-then-column order, trailing zeros and empty trailing trees trimmed. The PRD's own example (`#/mage/0500320-0-31`) writes an empty *middle* tree as `0`; the code may write it as an empty string (`--`). Cases that depend on this say so.
- **Required level** (PRD): `9 + P` for P > 0 points (1 point → 10, 51 points → 60).
- **Colours** (PRD): gold `#F8B700` = `rgb(248, 183, 0)`; green `#1EFF00` = `rgb(30, 255, 0)`; requirement text red.

### Reference data used below (from `src/data/classes/*.json`)

Mage, Arcane tree, in link order (index: name, position, max rank, prerequisite):

| # | Talent | Pos | Max | Requires |
| --- | --- | --- | --- | --- |
| 0 | Wand Specialization | T1C1 | 2 | |
| 1 | Arcane Focus | T1C2 | 5 | |
| 2 | Improved Channeling (NEW) | T1C3 | 5 | |
| 3 | Missile Barrage (NEW) | T1C4 | 2 | |
| 4 | Arcane Subtlety | T2C1 | 2 | |
| 5 | Magic Absorption | T2C2 | 2 | |
| 6 | Arcane Concentration | T2C3 | 5 | |
| 7 | Arcane Resilience | T2C4 | 2 | |
| 8 | Arcane Geometry (NEW) | T3C1 | 2 | |
| 9 | Arcane Impact (NEW) | T3C2 | 3 | |
| 10 | Arcane Blast (NEW) | T3C4 | 1 | |
| 11 | Arcane Shielding (NEW) | T4C1 | 2 | |
| 12 | Improved Counterspell | T4C2 | 2 | |
| 13 | Arcane Meditation | T4C3 | 3 | Arcane Concentration |
| 14 | Arcane Wrath (NEW) | T4C4 | 1 | Arcane Blast |
| 15 | Presence of Mind | T5C2 | 1 | |
| 16 | Arcane Mind | T5C3 | 5 | |
| 17 | Arcane Instability | T6C3 | 3 | |
| 18 | Arcane Power | T7C2 | 1 | Presence of Mind |

Mage Fire, first six: Improved Fire Blast T1C1 (2), Incineration T1C2 (3), Improved Fireball T1C3 (5), Ignite T2C1 (5), Flame Throwing T2C2 (2), Impact T2C3 (3).
Mage Frost, first two: Frost Warding T1C1 (2), Improved Frostbolt T1C2 (5). Also Ice Lance T3C3 (1, NEW) → Fingers of Frost T5C3 (2, requires Ice Lance).

Priest Shadow, in link order: Shadow Focus T1C1 (5), Blackout T1C2 (5), Spirit Tap T1C3 (5), Improved Mind Blast T2C1 (5), Improved Shadow Word: Pain T2C3 (2), Shadow Reach T2C4 (2), Improved Psychic Scream T3C2 (2, req Blackout), **Mind Flay T3C3 (1)**, **Improved Mind Flay T3C4 (2, req Mind Flay, same tier)**, ...

Paladin Holy, in link order: Divine Strength T1C2 (5), Divine Intellect T1C3 (5), Healing Light T2C1 (3), Spiritual Focus T2C2 (2), Improved Seals T2C3 (3), Unyielding Faith T2C4 (2), Voice of Truth T3C1 (1), Reverence T3C2 (3), Purifying Power T3C3 (2), Infusion of Light T4C1 (2), Illumination T4C2 (5, req Reverence), Divine Favor T4C3 (1), **Divine Precision T5C1 (3, req Holy Shock, same tier)**, **Holy Shock T5C2 (1)**, ...

Prepared links:

| Name | Hash | Content |
| --- | --- | --- |
| L-51 | `#/mage/25522252231-235523` | Arcane 31 (tiers 1–3), Fire 20 (tiers 1–2) = 51 points |
| L-50 | `#/mage/25522252231-235522` | As L-51 but Impact 2/3 = 50 points |
| L-AP29 | `#/mage/2552225221000001` | Arcane tiers 1–3 = 28 points (Arcane Impact 1/3) + Presence of Mind 1/1 (T5) = 29 points below tier 7 |
| L-AP30 | `#/mage/2552225222000001` | Arcane tiers 1–3 = 29 points (Arcane Impact 2/3) + Presence of Mind 1/1 (T5) = 30 points below tier 7 |
| L-PAL | `#/paladin/55320003200011` | Paladin Holy: DS 5, DI 5, HL 3, SF 2, Reverence 3, Purifying Power 2, Divine Precision 1, Holy Shock 1 = 22 |

---

## A. Header, footer and page shell

### TC-01 Page loads with title, countdown and no console errors
- **PRD:** FR-1, Acceptance "no console errors"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Load the page and wait for it to render.
  2. Read the header text.
  3. In the console, evaluate `Math.ceil((Date.parse("2026-11-04T23:00:00Z") - Date.now()) / 864e5)` to get N.
  4. Read console messages.
- **Expected:**
  - The header shows the product title "World of Warcraft: Forever" and a subtitle containing "Talent Calculator" and `launches in N days` with N from step 3 (singular "day" if N = 1).
  - No console errors or React warnings.

### TC-02 Countdown switches to "now live" after launch
- **PRD:** FR-1
- **Preconditions:** A way to fake the clock, e.g. add a script that overrides `Date.now` before the app bundle runs (`Date.now = () => Date.parse("2026-11-05T00:00:00Z")`) and reload. If the clock cannot be faked, mark **Blocked**, don't fail it.
- **Steps:**
  1. Set the clock to 2026-11-04 23:01 UTC (15:01 PST) or later, then load `http://localhost:5173/#/mage`.
  2. Read the subtitle.
- **Expected:** The subtitle shows "now live" and no "launches in" text. Also check 2026-11-04 22:59 UTC: it shows "launches in 1 day".

### TC-03 Footer content and data-source link per class
- **PRD:** FR-16
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Read the footer text.
  2. Inspect the footer link's `href` and text.
  3. Click the Paladin class button and repeat steps 1–2.
- **Expected:**
  - The footer has controls help covering click to learn and right-click / Shift+click to unlearn (currently "Click to learn · Right-click or Shift+click to unlearn").
  - Mage: the link `href` is `https://warcraft.wiki.gg/wiki/Mage_abilities_(Forever)`, the link text is `warcraft.wiki.gg`, and it opens in a new tab (`target="_blank"`).
  - The footer has a beta-data disclaimer ("beta data, may change before launch") and the exact text "Not affiliated with Blizzard Entertainment".
  - Paladin: the link `href` is `https://www.zockify.com/forever/paladin/talents/`.

### TC-04 Dark theme and typography
- **PRD:** UX "Theme", "Type"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Read `getComputedStyle(document.body).backgroundColor` (and the `.app` background if the body is transparent).
  2. Read `getComputedStyle(document.querySelector("h1")).fontFamily` and the font family of a tree `<h2>` and of a class name in the picker.
  3. Read the font family of the footer (body text).
- **Expected:** The background is near-black (each RGB channel ≤ 0x20). Titles, tree names and class names use Cinzel (first in the font stack). Body text uses Inter. Headings are gold `rgb(248, 183, 0)`.

## B. Class picker

### TC-05 All 9 classes listed in a labelled navigation region
- **PRD:** FR-2, Scope, Accessibility ("class picker is a labelled navigation region"), Acceptance "All 9 classes appear"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Read the accessibility tree and find the navigation landmark.
  2. List its buttons in order.
- **Expected:**
  - There is one `navigation` landmark with an accessible name (currently "Choose a class").
  - It contains exactly 9 buttons, in this order: Druid, Hunter, Mage, Paladin, Priest, Rogue, Shaman, Warlock, Warrior. Each has an icon and the visible class name.

### TC-06 Class names in official class colours
- **PRD:** FR-2
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:** For each class button, read the computed `color` of its name text.
- **Expected:** Each name is shown in its class colour: Druid `#FF7C0A`, Hunter `#AAD372`, Mage `#3FC7EB`, Paladin `#F48CBA`, Priest `#FFFFFF`, Rogue `#FFF468`, Shaman `#0070DD`, Warlock `#8788EE`, Warrior `#C69B6D`. If the colour is applied as the button border or accent instead of the text, record where it is and mark this case as a partial pass.

### TC-07 Selected class is highlighted and uses aria-pressed
- **PRD:** FR-2, Accessibility (`aria-pressed`)
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Read `aria-pressed` on all 9 class buttons.
  2. Click "Priest".
  3. Read `aria-pressed` again and compare the styles of the Priest and Mage buttons.
- **Expected:**
  - Step 1: Mage has `aria-pressed="true"` and the other 8 have `"false"`.
  - Step 3: only Priest has `"true"`. The Priest button looks visibly different from the rest (selected style), and Mage no longer does.
  - The summary heading reads "Priest" and the page accent changes to the Priest colour.

### TC-08 Switching class clears the build
- **PRD:** FR-3, FR-14
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus (Arcane T1C2) 3 times. The summary shows `3 / 51`.
  2. Click the "Priest" class button.
  3. Click the "Mage" class button.
- **Expected:**
  - After step 2: Points `0 / 51`, Build `0 / 0 / 0`, and the hash is `#/priest/` (or `#/priest`).
  - After step 3: the Mage build is still empty (Arcane Focus is "rank 0 of 5"). The old build is not restored.

## C. Trees, grid and content

### TC-09 Three trees with name, icon and points for the selected class
- **PRD:** FR-4, Acceptance "each shows 3 trees with icons"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Read the three tree headers.
  2. Check that each header has an icon (an `<img>` from `wow.zamimg.com`, or the initials fallback).
  3. Click Arcane Focus twice and Frost Warding (Frost T1C1) once, then read the header point counters.
- **Expected:** Headers in order: "Arcane", "Fire", "Frost". Each has an icon. After step 3 the counters read Arcane 2, Fire 0, Frost 1.

### TC-10 Talent counts per tree for all 9 classes
- **PRD:** Content counts (v1), Scope, Acceptance "All 9 classes … 3 trees"
- **Preconditions:** `http://localhost:5173/#/druid`
- **Steps:** For each class (click its button), count the talent buttons in each tree section.
- **Expected:**

  | Class | Tree 1 | Tree 2 | Tree 3 |
  | --- | --- | --- | --- |
  | Druid | Balance 16 | Feral Combat 20 | Restoration 16 |
  | Hunter | Beast Mastery 16 | Marksmanship 16 | Survival 18 |
  | Mage | Arcane 19 | Fire 17 | Frost 19 |
  | Paladin | Holy 17 | Protection 16 | Retribution 17 |
  | Priest | Discipline 18 | Holy 17 | Shadow 17 |
  | Rogue | Assassination 17 | Combat 17 | Subtlety 19 |
  | Shaman | Elemental 16 | Enhancement 18 | Restoration 16 |
  | Warlock | Affliction 17 | Demonology 19 | Destruction 16 |
  | Warrior | Arms 17 | Fury 17 | Protection 18 |

  Every class shows exactly 3 trees, in the order above, and no console errors appear while switching.

### TC-11 Talents placed on a 4-column, 7-tier grid at their positions
- **PRD:** FR-5
- **Preconditions:** `http://localhost:5173/#/mage`, desktop viewport
- **Steps:**
  1. Get bounding rects for these Arcane buttons: Wand Specialization (T1C1), Missile Barrage (T1C4), Arcane Subtlety (T2C1), Arcane Blast (T3C4), Presence of Mind (T5C2), Arcane Instability (T6C3) and Arcane Power (T7C2).
  2. Compare their x and y positions.
- **Expected:**
  - Same column means the same left edge (±2 px): Missile Barrage and Arcane Blast (C4), Presence of Mind and Arcane Power (C2), Wand Specialization and Arcane Subtlety (C1).
  - Rows increase strictly from tier to tier: T1 < T2 < T3 < T5 < T6 < T7 in y.
  - The empty slots (T3C3, T5C1, T5C4, T6C1, T6C2, T6C4, T7C1, T7C3, T7C4) are empty, and later talents do not shift into them. For example, Arcane Blast is in column 4, not column 3.
  - Arcane Power is on the 7th row, below Arcane Instability.

### TC-12 Prerequisite connectors drawn and highlighted when the prerequisite is maxed
- **PRD:** FR-6
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Count the connector elements (`.arrow`) in the Arcane tree.
  2. Load `http://localhost:5173/#/mage/2552225222000001` (L-AP30: Presence of Mind maxed, 30 points below tier 7). Check whether the connector from Presence of Mind (T5C2) to Arcane Power (T7C2) is highlighted (`.arrow.active`, or a visibly brighter/gold style).
  3. Load `http://localhost:5173/#/mage` (empty build) and check the same connector.
- **Expected:**
  - Step 1: there are 3 connectors in Arcane: Arcane Concentration → Arcane Meditation, Arcane Blast → Arcane Wrath and Presence of Mind → Arcane Power. Each one runs from the prerequisite toward the dependent talent.
  - Step 2: the Presence of Mind → Arcane Power connector is highlighted.
  - Step 3: it is not highlighted.

### TC-13 Connector highlights on a maxed prerequisite even while the tier is still locked
- **PRD:** FR-6 ("highlighted once the prerequisite is maxed")
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. In Frost, click Frost Warding ×2, Improved Frostbolt ×5, Ice Shards ×3. That is 10 points, which unlocks tier 3.
  2. Click Ice Lance (T3C3) once. It is now 1/1, maxed.
  3. Check the connector from Ice Lance to Fingers of Frost (T5C3). Frost has 11 points, so tier 5 (20 points) is still locked.
- **Expected:** The connector is highlighted because its prerequisite, Ice Lance, is maxed. Fingers of Frost itself stays locked (greyed).
- **Suspected discrepancy:** the code highlights the connector only when the dependent talent is fully unlocked (tier and prerequisite both met), so the connector will probably not be highlighted here.

### TC-14 Same-tier prerequisite connector
- **PRD:** FR-6, Talent rules › Prerequisites (same-tier)
- **Preconditions:** `http://localhost:5173/#/priest`
- **Steps:**
  1. In the Shadow tree, find the connector between Mind Flay (T3C3) and Improved Mind Flay (T3C4).
  2. Click Shadow Focus ×5, Blackout ×5 and Mind Flay ×1.
  3. Check the connector again.
- **Expected:** There is a horizontal connector between Mind Flay and Improved Mind Flay. It is not highlighted at step 1 and is highlighted after step 2.

## D. Talent display and visual states

### TC-15 Icon, rank badge and NEW badge
- **PRD:** FR-7, User story 5
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Inspect the Arcane Focus (T1C2) and Improved Channeling (T1C3) buttons.
  2. Click Arcane Focus twice and inspect it again.
- **Expected:**
  - Both show an icon and a rank badge: Arcane Focus "0/5", Improved Channeling "0/5".
  - Improved Channeling shows a "NEW" badge. Arcane Focus does not.
  - After step 2, the Arcane Focus badge reads "2/5".
  - Spot check: Missile Barrage, Arcane Geometry, Arcane Impact, Arcane Blast, Arcane Shielding and Arcane Wrath show NEW. Wand Specialization, Arcane Subtlety and Arcane Power do not.

### TC-16 Icon fallback shows initials
- **PRD:** UX "Icons"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Make the Arcane Focus icon fail to load. In the console, run `const img = talent("Arcane", "Arcane Focus").querySelector("img"); img.src = "https://wow.zamimg.com/images/wow/icons/large/does_not_exist_xyz.jpg";`. Alternatively, block `wow.zamimg.com` and reload.
  2. Wait 1 s and inspect the button.
- **Expected:** The icon is replaced by the initials "AF" on a dark tile. The rank badge and the button still work.

### TC-17 Visual states: locked, available, partial, maxed
- **PRD:** FR-8, UX "Theme" colours
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Inspect Arcane Subtlety (T2C1, locked) and Arcane Focus (T1C2, available): read their computed `borderColor` and `boxShadow`, and the icon's computed `filter`.
  2. Click Arcane Focus twice (partial) and inspect it.
  3. Click Arcane Focus 3 more times (5/5, maxed) and inspect it.
- **Expected:**
  - Locked: the icon is greyed (grayscale or desaturated filter) and the border is not green or gold.
  - Available: green border `rgb(30, 255, 0)` and no glow.
  - Partial (2/5): green border plus a green glow (a non-`none` box-shadow in a green tone).
  - Maxed (5/5): gold border `rgb(248, 183, 0)` and gold glow. The rank badge text is gold.
  - After step 3, Arcane Subtlety turns from locked to available (green).

## E. Allocation rules

### TC-18 Left-click adds one rank
- **PRD:** FR-9, User story 2
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus once.
  2. Read its accessible name, the summary and the hash.
- **Expected:**
  - Accessible name: "Arcane Focus, rank 1 of 5".
  - Summary: Points `1 / 51`, Build `1 / 0 / 0`, Required level `10`.
  - Hash: `#/mage/01`.
- **Suspected discrepancy:** the code computes the level as 10 + P, so it will probably show `11`.

### TC-19 Talent cannot exceed its max rank
- **PRD:** Talent rules (below max rank), Acceptance "cannot go above its max rank"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Wand Specialization (T1C1, max 2) 3 times.
- **Expected:** "Wand Specialization, rank 2 of 2". The badge reads "2/2" in the maxed (gold) state. Points `2 / 51` (the third click is ignored). Hash `#/mage/2`.

### TC-20 Tier 2 stays locked at 4 points and unlocks at the 5th
- **PRD:** Talent rules › Tiers, Acceptance "tier-2 … locked at 4 … unlocks at the 5th"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus (T1C2) 4 times.
  2. Click Arcane Subtlety (T2C1) once.
  3. Click Arcane Focus a 5th time.
  4. Click Arcane Subtlety once.
- **Expected:**
  - After step 2: "Arcane Subtlety, rank 0 of 2", Points `4 / 51`, locked state, hash `#/mage/04`.
  - After step 3: Arcane Subtlety is in the available (green) state.
  - After step 4: "Arcane Subtlety, rank 1 of 2", Points `6 / 51`, hash `#/mage/05001`.

### TC-21 Tier gating counts points across several talents, and tier 3 needs exactly 10
- **PRD:** Talent rules › Tiers ("(T − 1) × 5 points … on tiers below T")
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Wand Specialization ×2, Missile Barrage ×2 and Improved Channeling ×1 (5 points in tier 1).
  2. Click Arcane Subtlety ×2 and Magic Absorption ×2. Arcane now has 9 points in tiers 1–2.
  3. Click Arcane Geometry (T3C1).
  4. Click Arcane Resilience (T2C4) once (10 points), then click Arcane Geometry again.
- **Expected:**
  - Step 2: both tier-2 talents accept points (tier 2 is unlocked by points spread over three tier-1 talents).
  - Step 3: Arcane Geometry stays "rank 0 of 2".
  - Step 4: Arcane Geometry becomes "rank 1 of 2". Points `11 / 51`.

### TC-22 Tier unlock counts only points in the same tree
- **PRD:** Talent rules › Tiers ("in the same tree"), "Points can be spread freely across all three trees"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. In Fire, click Improved Fireball (T1C3) ×5.
  2. In Arcane, click Arcane Subtlety (T2C1).
  3. In Fire, click Ignite (T2C1).
- **Expected:**
  - Step 2: Arcane Subtlety stays "rank 0 of 2". 5 Fire points do not unlock Arcane tier 2.
  - Step 3: Ignite becomes "rank 1 of 5". Build `0 / 6 / 0`.

### TC-23 Deep tier: tier 7 needs exactly 30 points below it (31-point talent)
- **PRD:** Talent rules › Tiers, Milestones ("31 points … normal tier rule")
- **Preconditions:** `http://localhost:5173/#/mage/2552225221000001` (L-AP29: 28 points in Arcane tiers 1–3 + Presence of Mind 1/1 = 29 points below tier 7)
- **Steps:**
  1. Confirm Points `29 / 51` and "Presence of Mind, rank 1 of 1".
  2. Click Arcane Power (T7C2). Hover it and read the tooltip.
  3. Click Arcane Impact (T3C2) once (now 30 points below tier 7), then click Arcane Power again.
- **Expected:**
  - Step 2: no change. "Arcane Power, rank 0 of 1", Points `29 / 51`, and the tooltip shows a red "Requires 30 points in Arcane". Presence of Mind is maxed, so no prerequisite line appears.
  - Step 3: "Arcane Power, rank 1 of 1", Points `31 / 51`, Build `31 / 0 / 0`, Required level `40`, hash `#/mage/2552225222000001001`.
- **Suspected discrepancy:** the code computes the level as 10 + P, so it will probably show `41`.

### TC-24 Prerequisite must be maxed (single-rank prerequisite)
- **PRD:** Talent rules › Prerequisites, Acceptance "unmaxed prerequisite cannot be learned; it can once maxed"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus ×5, Improved Channeling ×5 and Arcane Concentration ×5 (15 points, which unlocks tier 4).
  2. Click Arcane Wrath (T4C4, requires Arcane Blast).
  3. Click Arcane Blast (T3C4) once.
  4. Click Arcane Wrath once.
- **Expected:**
  - Step 2: "Arcane Wrath, rank 0 of 1" and Points `15 / 51`.
  - Step 3: "Arcane Blast, rank 1 of 1".
  - Step 4: "Arcane Wrath, rank 1 of 1" and Points `17 / 51`.

### TC-25 Multi-rank prerequisite must be at max rank, not just invested
- **PRD:** Talent rules › Prerequisites
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus ×5, Improved Channeling ×5, Wand Specialization ×2 and Arcane Concentration ×4 (16 points, so tier 4 is unlocked).
  2. Click Arcane Meditation (T4C3, requires Arcane Concentration 5/5).
  3. Click Arcane Concentration a 5th time, then click Arcane Meditation.
- **Expected:**
  - Step 2: "Arcane Meditation, rank 0 of 3". It is locked even though its tier is open.
  - Step 3: "Arcane Meditation, rank 1 of 3" and Points `18 / 51`.

### TC-26 Same-tier prerequisite: Priest Improved Mind Flay requires Mind Flay
- **PRD:** Talent rules › Prerequisites (same-tier example)
- **Preconditions:** `http://localhost:5173/#/priest`
- **Steps:**
  1. In Shadow, click Shadow Focus ×5 and Blackout ×5 (10 points, which unlocks tier 3).
  2. Click Improved Mind Flay (T3C4).
  3. Click Mind Flay (T3C3) once, then click Improved Mind Flay twice.
- **Expected:**
  - Step 2: "Improved Mind Flay, rank 0 of 2" (locked).
  - Step 3: "Mind Flay, rank 1 of 1" and "Improved Mind Flay, rank 2 of 2". Build `0 / 0 / 13`. The hash is `#/priest/0-0-550000012` (PRD form). The code may write `#/priest/--550000012`.

### TC-27 Same-tier prerequisite: Paladin Divine Precision requires Holy Shock
- **PRD:** Talent rules › Prerequisites (same-tier example)
- **Preconditions:** `http://localhost:5173/#/paladin`
- **Steps:**
  1. In Holy, click Divine Strength ×5, Divine Intellect ×5, Healing Light ×3, Spiritual Focus ×2, Reverence ×3 and Purifying Power ×2. That is 20 points, which unlocks tier 5.
  2. Click Divine Precision (T5C1).
  3. Click Holy Shock (T5C2) once, then click Divine Precision once.
- **Expected:**
  - Step 2: "Divine Precision, rank 0 of 3".
  - Step 3: "Holy Shock, rank 1 of 1" and "Divine Precision, rank 1 of 3". Points `22 / 51`. Hash `#/paladin/55320003200011`.

### TC-28 Build stops at 51 points
- **PRD:** Talent rules (51 cap), FR-12, Acceptance "stops at 51 … 51 / 51 and required level 60"
- **Preconditions:** `http://localhost:5173/#/mage/25522252231-235522` (L-50)
- **Steps:**
  1. Confirm Points `50 / 51`, Build `31 / 19 / 0` and Required level `59`.
  2. Click Impact (Fire T2C3) once.
  3. Click Frost Warding (Frost T1C1) and Arcane Shielding (Arcane T4C1).
- **Expected:**
  - Step 2: "Impact, rank 3 of 3". Points `51 / 51`, Build `31 / 20 / 0`, Required level `60`, hash `#/mage/25522252231-235523`.
  - Step 3: no change. Both talents stay at rank 0, Points stay `51 / 51`, and the hash is unchanged. Unspent talents no longer show the available (green) state.
- **Suspected discrepancy:** the code computes the level as 10 + P, so it will probably show `60` at 50 points and `61` at 51 points.

### TC-29 Ignored click changes nothing (no state, no URL change)
- **PRD:** FR-9 ("otherwise nothing happens"), Talent rules flowchart
- **Preconditions:** `http://localhost:5173/#/mage/04`
- **Steps:**
  1. Record `location.hash` and `history.length`.
  2. Click Arcane Subtlety (locked) 3 times.
- **Expected:** The hash is still `#/mage/04`, all counters are unchanged and no error is logged.

## F. Removing points

### TC-30 Right-click removes a rank without opening the browser menu
- **PRD:** FR-10, Acceptance "Right-click removes a point without opening the browser menu"
- **Preconditions:** `http://localhost:5173/#/mage/03` (Arcane Focus 3/5)
- **Steps:**
  1. Right-click Arcane Focus.
  2. Take a screenshot, then press Escape if any menu is visible.
  3. In the console, run `const e = new MouseEvent("contextmenu", {bubbles: true, cancelable: true, button: 2}); talent("Arcane", "Arcane Focus").dispatchEvent(e); e.defaultPrevented`.
- **Expected:**
  - Step 1: "Arcane Focus, rank 2 of 5" and hash `#/mage/02`.
  - Step 2: no native context menu is visible.
  - Step 3: returns `true`, and the rank drops to 1.

### TC-31 Shift+click removes a rank
- **PRD:** FR-10
- **Preconditions:** `http://localhost:5173/#/mage/03`
- **Steps:** Shift+click Arcane Focus twice.
- **Expected:** "Arcane Focus, rank 1 of 5", Points `1 / 51`, hash `#/mage/01`. Shift+click never adds a point.

### TC-32 Removing at rank 0 does nothing
- **PRD:** FR-10 ("when the rules allow")
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:** Right-click Arcane Focus, then Shift+click it.
- **Expected:** It stays "rank 0 of 5", Points `0 / 51`, and there are no console errors.

### TC-33 Removal blocked when it would strand a higher tier (PRD example)
- **PRD:** Talent rules › Removing points (example: 5 in tier 1, 1 in tier 2), Acceptance "strand a higher-tier talent … blocked"
- **Preconditions:** `http://localhost:5173/#/mage/05001` (Arcane Focus 5, Arcane Subtlety 1)
- **Steps:**
  1. Right-click Arcane Focus.
  2. Shift+click Arcane Focus.
  3. Right-click Arcane Subtlety, then right-click Arcane Focus.
- **Expected:**
  - Steps 1–2: Arcane Focus stays "rank 5 of 5" and Points stay `6 / 51`.
  - Step 3: Arcane Subtlety goes to 0, then Arcane Focus goes to "rank 4 of 5". Points `4 / 51` and hash `#/mage/04`.

### TC-34 Removal blocked when it would strand a deep tier (tier 7)
- **PRD:** Talent rules › Removing points
- **Preconditions:** `http://localhost:5173/#/mage/2552225222000001` (L-AP30). Then click Arcane Power once (1/1, Points `31 / 51`).
- **Steps:**
  1. Right-click Arcane Impact (T3C2) once. Exactly 30 points are spent below tier 7, so removing one would strand Arcane Power.
  2. Right-click Presence of Mind. It is the prerequisite of Arcane Power.
  3. Right-click Arcane Power, then right-click Arcane Impact.
- **Expected:**
  - Steps 1–2: blocked. "Arcane Impact, rank 2 of 3", "Presence of Mind, rank 1 of 1", Points `31 / 51`.
  - Step 3: both removals succeed. Arcane Impact becomes "rank 1 of 3" and Points `29 / 51`.

### TC-35 Removal blocked when it would break a prerequisite (tier still satisfied)
- **PRD:** Talent rules › Removing points ("break a prerequisite"), Acceptance
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus ×5, Improved Channeling ×5, Wand Specialization ×2, Arcane Concentration ×5 and Arcane Meditation ×1 (18 points, 17 of them below tier 4).
  2. Right-click Arcane Concentration.
  3. Right-click Wand Specialization.
- **Expected:**
  - Step 2: blocked. Arcane Concentration stays "rank 5 of 5" because removing a point would leave Arcane Meditation without a maxed prerequisite, even though the tier would still have 16 ≥ 15 points.
  - Step 3: allowed. "Wand Specialization, rank 1 of 2" and Points `17 / 51`.

### TC-36 Same-tier prerequisite blocks removal
- **PRD:** Talent rules › Removing points, Prerequisites (same tier)
- **Preconditions:** `http://localhost:5173/#/priest/0-0-550000011` (Shadow: Shadow Focus 5, Blackout 5, Mind Flay 1, Improved Mind Flay 1)
- **Steps:**
  1. Confirm Build `0 / 0 / 12`.
  2. Right-click Mind Flay.
  3. Right-click Blackout.
  4. Right-click Improved Mind Flay, then right-click Mind Flay.
- **Expected:**
  - Step 2: blocked (Mind Flay stays 1/1).
  - Step 3: blocked (it would leave 9 points below tier 3).
  - Step 4: both removals succeed and the Build shows `0 / 0 / 10`.

## G. Tooltips

### TC-37 Tooltip on hover: name, rank, current and next rank text, hint
- **PRD:** FR-11, User story 3, Acceptance "Tooltips show rank text, next-rank text"
- **Preconditions:** `http://localhost:5173/#/mage/02` (Arcane Focus 2/5)
- **Steps:**
  1. Hover Arcane Focus.
  2. Read the element with `role="tooltip"`.
  3. Move the mouse away.
- **Expected:**
  - Step 2: the tooltip shows:
    - the name "Arcane Focus"
    - "Rank 2/5"
    - the current-rank text "Improves your chance to hit with Arcane spells by 2%."
    - a next-rank section with "Improves your chance to hit with Arcane spells by 3%."
    - a learn/unlearn hint (currently "Click to learn · Right-click to unlearn")
  - It has no red requirement line.
  - Step 3: the tooltip disappears.

### TC-38 Tooltip at rank 0 and at max rank
- **PRD:** FR-11
- **Preconditions:** `http://localhost:5173/#/mage/2`
- **Steps:**
  1. Hover Arcane Focus (0/5).
  2. Hover Wand Specialization (2/2).
- **Expected:**
  - Step 1: "Rank 0/5", the rank-1 text "…by 1%." and a learn hint.
  - Step 2: "Rank 2/2", the text "Increases your damage with Wands by 25%.", and no next-rank section. The hint says it is maxed (currently "Maxed") and that it can be unlearned (currently "· Right-click to unlearn").

### TC-39 Tooltip lists an unmet tier requirement in red
- **PRD:** FR-11, Talent rules flowchart ("tooltip shows any unmet tier or prerequisite"), UX red
- **Preconditions:** `http://localhost:5173/#/mage/04`
- **Steps:**
  1. Hover Arcane Subtlety (T2C1).
  2. Read the requirement line and its computed `color`.
  3. Unhover, click Arcane Focus once more, then hover Arcane Subtlety again.
- **Expected:**
  - Step 2: a line like "Requires 5 points in Arcane", in red (red channel high, green and blue low, e.g. `rgb(255, 77, 77)`).
  - Step 3: the requirement line is gone.

### TC-40 Tooltip lists an unmet prerequisite, and both requirements together
- **PRD:** FR-11, Acceptance "Tooltips show … unmet requirements"
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Hover Arcane Wrath (T4C4).
  2. Click Arcane Focus ×5, Improved Channeling ×5 and Arcane Concentration ×5, then hover Arcane Wrath again.
- **Expected:**
  - Step 1: two red lines, "Requires 15 points in Arcane" and "Requires 1 point in Arcane Blast".
  - Step 2: only "Requires 1 point in Arcane Blast" remains.
  - Bonus: hover Arcane Meditation with Arcane Concentration at 4/5. It shows "Requires 5 points in Arcane Concentration".

### TC-41 Tooltip for a NEW talent and a multi-line rank
- **PRD:** FR-11, FR-7, User story 5, Data model (ranks may contain line breaks)
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:** Hover Improved Channeling (T1C3).
- **Expected:** The tooltip title shows "Improved Channeling" with a NEW marker (currently "NEW IN FOREVER"). The rank text begins "Gives your Arcane Missiles spell a 20% chance…". Line breaks in any rank text render as separate lines, not literal `\n`.

### TC-42 Tooltip opens right for columns 1–2 and left for columns 3–4
- **PRD:** UX "Tooltips"
- **Preconditions:** `http://localhost:5173/#/mage`, desktop viewport (≥ 1280 px wide)
- **Steps:** For each of Wand Specialization (C1), Arcane Focus (C2), Improved Channeling (C3) and Missile Barrage (C4): hover it, then compare `tooltip.getBoundingClientRect()` with the button's rect.
- **Expected:**
  - C1 and C2: `tooltip.left >= button.right`.
  - C3 and C4: `tooltip.right <= button.left`.
  - In all four cases the tooltip is horizontally within the Arcane tree section's bounds (±10 px).

## H. Summary and reset

### TC-43 Summary shows class, points, split and required level
- **PRD:** FR-12, User story 4, Points and levels (level = 9 + P)
- **Preconditions:** `http://localhost:5173/#/paladin/55320003200011` (L-PAL, 22 points)
- **Steps:** Read the summary bar.
- **Expected:** Heading "Paladin", Points `22 / 51`, Build `22 / 0 / 0`, Required level `31`. With 0 points (click Reset all) the required level shows a placeholder, not a number ≤ 9.
- **Suspected discrepancy:** with the code's 10 + P formula, the level will probably show `32`. See also TC-49 about Divine Precision being dropped on decode, which would make it 21 points.

### TC-44 Reset per tree
- **PRD:** FR-13
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Check the three tree "Reset" buttons.
  2. Click Arcane Focus ×3 and Frost Warding ×2.
  3. Check the Reset buttons again.
  4. Click the Arcane "Reset".
- **Expected:**
  - Step 1: all three are disabled.
  - Step 3: Arcane and Frost Reset are enabled, Fire Reset is still disabled.
  - Step 4: Arcane goes to 0, Frost keeps 2, and Build is `0 / 0 / 2`. The hash is `#/mage/-0-2` (PRD form) or `#/mage/--2` (code form), and the Arcane Reset is disabled again.

### TC-45 Reset all
- **PRD:** FR-13
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Check "Reset all".
  2. Click Arcane Focus ×2, then check it again.
  3. Click "Reset all".
- **Expected:**
  - Step 1: disabled.
  - Step 2: enabled.
  - Step 3: Points `0 / 51`, every talent at rank 0, hash `#/mage/` (or `#/mage`), and "Reset all" plus every tree Reset disabled. Mage is still the selected class.

## I. Sharing and build links

### TC-46 URL hash always reflects class and build, with trailing trimming
- **PRD:** FR-14, Build link format
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click Arcane Focus ×5. Read the hash.
  2. Click Arcane Concentration ×3. Read the hash.
  3. Click Frost Warding ×2 and Improved Frostbolt ×1. Read the hash.
  4. Right-click Improved Frostbolt and Frost Warding ×2. Read the hash.
- **Expected:**
  - Step 1: `#/mage/05` (trailing zeros of tree 1 trimmed, empty trailing trees omitted).
  - Step 2: `#/mage/0500003`.
  - Step 3: `#/mage/0500003-0-21` per the PRD example. If the empty middle tree is written as an empty string, the hash is `#/mage/0500003--21`; **record which**.
  - Step 4: `#/mage/0500003` (the trailing empty trees are trimmed again, with no dangling `-`).
  - No history entries are added per click: `history.length` is unchanged. This is informational only.

### TC-47 Copy link copies the URL and confirms with "Copied!"
- **PRD:** FR-14, User story 6
- **Preconditions:** `http://localhost:5173/#/mage/0500003-0-21`. Clipboard permission granted to the page.
- **Steps:**
  1. Click "Copy link".
  2. Read the button text right away.
  3. Run `await navigator.clipboard.readText()`.
  4. Wait 3 s and read the button text again.
- **Expected:**
  - Step 2: "Copied!".
  - Step 3: equals `location.href` and ends with the current build hash.
  - Step 4: the button reads "Copy link" again.

### TC-48 Copy link falls back to a prompt when the clipboard is unavailable
- **PRD:** FR-14
- **Preconditions:** `http://localhost:5173/#/mage/05`
- **Steps:**
  1. In the console, run `navigator.clipboard.writeText = () => Promise.reject(new Error("blocked")); window.__prompt = null; window.prompt = (msg, val) => { window.__prompt = [msg, val]; return null; };`.
  2. Click "Copy link".
  3. Read `window.__prompt`.
- **Expected:** `window.__prompt[1] === location.href`, which is the build link `http://localhost:5173/#/mage/05`. The button does not claim "Copied!" and there is no uncaught error in the console.

### TC-49 Shared link round trip restores exact class and build
- **PRD:** FR-15, Success metric "Shared-link round trip … every time", Acceptance "Copying a link and reloading it restores the same class and build"
- **Preconditions:** `http://localhost:5173/#/paladin`
- **Steps:**
  1. Build the TC-27 Holy build in the UI, including Holy Shock 1/1 and Divine Precision 1/3 (22 points).
  2. Click "Copy link" and read the clipboard (or `location.href`).
  3. Open that URL in a new tab, or reload the page.
  4. Read the summary and the accessible names of Holy Shock and Divine Precision.
- **Expected:** Paladin is selected, Points `22 / 51`, Build `22 / 0 / 0`, "Holy Shock, rank 1 of 1", "Divine Precision, rank 1 of 3", and the hash is identical to step 2.
- **Suspected discrepancy:** the decoder replays each tier in column order, so Divine Precision (T5C1) is tried before its same-tier prerequisite Holy Shock (T5C2) and will probably be dropped (Points `21 / 51`). Also repeat with Mage `#/mage/25522252231-235523` (expect 51 points restored) and Priest `#/priest/0-0-550000011` (expect 12 points restored).

### TC-50 Tampered link: illegal points are dropped
- **PRD:** Build link format ("invalid or tampered link drops illegal points"), Acceptance "A link with illegal points loads with those points dropped"
- **Preconditions:** none
- **Steps:**
  1. Load `http://localhost:5173/#/mage/0000020`: Magic Absorption 2 with no tier-1 points.
  2. Load `http://localhost:5173/#/mage/9`: Wand Specialization 9, over its max of 2.
  3. Load `http://localhost:5173/#/mage/0500320-0-31` (the PRD example). Arcane Subtlety is set to 3 (max 2) and Frost Warding to 3 (max 2).
  4. Load `http://localhost:5173/#/mage/0000000000000010` (Arcane Wrath 1 with no prerequisite and no tier points).
- **Expected:**
  - Step 1: Points `0 / 51` and the hash is rewritten to `#/mage/` (or `#/mage`).
  - Step 2: "Wand Specialization, rank 2 of 2" and Points `2 / 51`. Record whether the hash becomes `#/mage/2`.
  - Step 3: no impossible ranks. Arcane Focus 5/5, Arcane Subtlety 2/2, Magic Absorption 2/2, Frost Warding 2/2, Improved Frostbolt 1/5; Points `12 / 51`, Build `9 / 0 / 3`; the hash is canonicalised to `#/mage/050022-0-21` (or `#/mage/050022--21`).
  - Step 4: Points `0 / 51`.
  - No console errors in any step.

### TC-51 Unknown class id falls back to the first class
- **PRD:** Build link format ("unknown class id falls back to the first class")
- **Preconditions:** none
- **Steps:**
  1. Load `http://localhost:5173/#/deathknight/55`.
  2. Load `http://localhost:5173/` with no hash.
  3. Load `http://localhost:5173/#/MAGE`.
- **Expected:**
  - Step 1: Druid (the first class) is selected (`aria-pressed="true"`), the summary heading is "Druid", the hash starts with `#/druid`, and nothing crashes. Record whether the `55` points were applied to Druid Balance (Improved Wrath 5, Genesis 5), since the PRD does not say.
  - Step 2: Druid is selected and the hash becomes `#/druid/` (or `#/druid`).
  - Step 3: ids are kebab-case lowercase, so this falls back to Druid. Record the result.

### TC-52 Editing the URL hash in place updates the view
- **PRD:** FR-15 ("editing the URL hash in place updates the view")
- **Preconditions:** `http://localhost:5173/#/mage/05`
- **Steps:**
  1. Without reloading, edit the address bar hash to `#/mage/0500003` and press Enter (or run `location.hash = "#/mage/0500003"`).
  2. Change the hash to `#/priest/0-0-550000011`.
  3. Change the hash to `#/warrior`.
  4. Use the browser Back button once.
- **Expected:**
  - Step 1: Arcane Concentration shows "rank 3 of 5" and Points `8 / 51`.
  - Step 2: Priest is selected, Build `0 / 0 / 12`, and the tree headers are Discipline, Holy, Shadow.
  - Step 3: Warrior is selected with Points `0 / 51`.
  - Step 4: the view matches the hash it lands on (informational).
  - No full page reload happens (a `window.__marker = 1` set before step 1 survives), and there are no console errors.

## J. Accessibility

### TC-53 Talents are real buttons with "X, rank N of M" names
- **PRD:** Accessibility
- **Preconditions:** `http://localhost:5173/#/mage/02`
- **Steps:**
  1. Read the accessibility tree for the Arcane tree.
  2. Check `talent("Arcane", "Arcane Focus").tagName`.
- **Expected:** All 19 Arcane talents have role `button`. The name of Arcane Focus is exactly "Arcane Focus, rank 2 of 5", and Arcane Power's is "Arcane Power, rank 0 of 1". The `tagName` is `BUTTON`. The name updates right after a click (click Arcane Focus → "Arcane Focus, rank 3 of 5").

### TC-54 Keyboard focus shows the tooltip and a visible focus ring; Enter learns
- **PRD:** Accessibility ("reachable by keyboard; focus shows the tooltip and a visible focus ring"), FR-11
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Click on empty page space, then press Tab repeatedly until Wand Specialization (the first Arcane talent) has focus. Record the number of Tab presses.
  2. Read `document.activeElement`'s `aria-label` and computed `outline`, and look for a `role="tooltip"` element.
  3. Press Enter, then Space.
  4. Press Tab once.
- **Expected:**
  - Step 2: focus is on "Wand Specialization, rank 0 of 2". There is a visible focus ring (a non-zero outline, e.g. 2 px solid white) and a tooltip for Wand Specialization is shown.
  - Step 3: the name becomes "rank 2 of 2".
  - Step 4: focus moves to Arcane Focus, its tooltip appears and the Wand Specialization tooltip disappears.
  - Known gap (PRD): there is no keyboard way to remove points. This is informational only.

## K. Responsive layout and quality

### TC-55 Desktop layout: three trees side by side, each at least 290 px wide
- **PRD:** UX "Layout"
- **Preconditions:** `http://localhost:5173/#/druid`, viewport 1440×900
- **Steps:** Read the bounding rects of the three tree sections and of one talent button.
- **Expected:** All three sections share the same top (±2 px) and sit left to right. Each is ≥ 290 px wide. A talent button is 52×52 px (±1).

### TC-56 Phone layout at 375 px: no horizontal scroll, trees stacked, 46 px cells
- **PRD:** UX "Layout", User story 7, Acceptance "No horizontal scroll at 375 px wide"
- **Preconditions:** viewport 375×812
- **Steps:**
  1. For each of the 9 classes, load `http://localhost:5173/#/<class-id>` and evaluate `document.documentElement.scrollWidth <= document.documentElement.clientWidth`.
  2. On Mage, read the tree section rects and a talent button's size.
  3. Load `#/mage/02`, tap or hover Missile Barrage (C4) and Wand Specialization (C1), and evaluate the scroll-width check while each tooltip is open.
  4. Repeat the scroll-width check at 400 px and 768 px.
- **Expected:**
  - Step 1: `true` for every class.
  - Step 2: the trees are stacked in one column (each top is below the previous bottom) and the talent button is 46×46 px.
  - Steps 3–4: still no horizontal scroll, and the tooltips are fully visible inside the viewport.

### TC-57 No console errors across a full session
- **PRD:** Acceptance "no console errors", NFR Quality
- **Preconditions:** `http://localhost:5173/#/mage`. Clear the console.
- **Steps:**
  1. Do all of these in turn:
     - switch through all 9 classes
     - add and remove points (click, right-click, Shift+click)
     - hover several talents
     - press both Reset buttons and Copy link
     - load L-51 and the tampered links from TC-50
  2. Read the console messages, filtered to errors and warnings.
- **Expected:** No errors and no React warnings (e.g. no "key" or "controlled" warnings). Failed icon loads, if any, are network 404s only and are not JS errors.

### TC-58 Privacy: no cookies or storage, state only in URL
- **PRD:** NFR Privacy
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:**
  1. Build a few points.
  2. Read `document.cookie`, `localStorage.length` and `sessionStorage.length`.
  3. List network requests other than localhost, `wow.zamimg.com` and Google Fonts.
- **Expected:** The cookie is empty, both storage lengths are `0`, and there are no analytics or other third-party requests.

## L. Class quiz

Answers are matched by the start of their label. Tank answers used below, in question order: "Marking skull…", "\"Raised among Arathi steel…", "Molten Core…", "Pets path into the next pack…", "All of them…", "Them rooted, feared…", "Me. Encased in metal…", "Wherever the queue is shorter…".

### TC-59 Quiz opens from the header and closes without changing the build
- **PRD:** FR-17
- **Preconditions:** `http://localhost:5173/#/mage/05`
- **Steps:**
  1. Click "Find my class".
  2. Press Escape.
  3. Open the quiz again and click the close button (×).
- **Expected:** Step 1 opens a dialog named "Find your class" showing "Question 1 of 8" and the dungeon-group question ("The dungeon group finally has five people…"). Steps 2 and 3 close it. Points stay `5 / 51` and the hash stays `#/mage/05`.

### TC-60 One question at a time with progress and Back
- **PRD:** FR-18
- **Preconditions:** `http://localhost:5173/#/mage`, quiz open
- **Steps:**
  1. Check the Back button on question 1.
  2. Choose "Staring at green bars…".
  3. Click Back.
- **Expected:** Step 1: Back is hidden. Step 2: progress reads "Question 2 of 8". Step 3: progress reads "Question 1 of 8" and "Staring at green bars…" has `aria-pressed="true"`; the other options have `false`.

### TC-61 Results show best match, reasons and two runners-up; retake starts over
- **PRD:** FR-19
- **Preconditions:** `http://localhost:5173/#/mage`, quiz open
- **Steps:**
  1. Answer with the tank answers.
  2. Press Escape and reopen the quiz.
  3. Click "Retake quiz".
- **Expected:** Step 1: three results; the first is "Warrior, Protection, N% match" and its first reason is "You were born to mark skull and pull early" and its tagline starts "Rage is a resource"; each result has an "Open <Class> talents" button. Step 2: the same results are shown. Step 3: the quiz is back at "Question 1 of 8".

### TC-62 Opening a result loads the class with the suggested tree marked
- **PRD:** FR-20
- **Preconditions:** `http://localhost:5173/#/mage/05`, quiz open
- **Steps:**
  1. Answer with the tank answers and click "Open Warrior talents".
  2. Select Mage in the class picker.
- **Expected:** Step 1: the dialog closes, Warrior is selected, Points `0 / 51`, the hash is `#/warrior/` (or `#/warrior`), and only the Protection tree shows a "Suggested" badge. Step 2: no tree shows the badge.

### TC-63 Faction answer filters faction-locked classes
- **PRD:** Class quiz "Scoring" (faction)
- **Preconditions:** `http://localhost:5173/#/mage`, quiz open
- **Steps:**
  1. Answer "Staring at green bars…", "\"Blessed by the Light…", "Molten Core…", "I whisper the seller…", "One. …", "Nobody. I got distracted…", "Me. Encased in metal…", "Orgrimmar…" (Horde).
  2. Retake with the same answers but "Goldshire…" (Alliance).
- **Expected:** Step 1: the best match is Priest · Holy and no result is Paladin. Step 2: the best match is Paladin · Holy and no result is Shaman.

### TC-64 Quiz fits a 375 px phone without horizontal scroll
- **PRD:** UX "Layout", User story 7
- **Preconditions:** viewport 375×812, `http://localhost:5173/#/mage`
- **Steps:** Open the quiz, check horizontal scroll, answer with the tank answers and check again.
- **Expected:** No horizontal scroll on the questions or the results, and the dialog lies within the 375 px viewport.

## M. Leveling guide

### TC-65 Header switches between the calculator and the guide, keeping the build
- **PRD:** FR-21
- **Preconditions:** `http://localhost:5173/#/mage`
- **Steps:** Click Arcane Focus ×3, click "Leveling guide", then click "Talents".
- **Expected:** The guide opens at `#/leveling/durotar`, its link is marked current and the subtitle reads "Horde Leveling Guide". Back on "Talents", Mage is selected with 3 points.

### TC-66 Starting zone picker sets the first step and leaves out the other starting zones
- **PRD:** FR-22, Acceptance "starts in the chosen starting zone"
- **Preconditions:** `http://localhost:5173/#/leveling`
- **Steps:** Check the picker, then choose Tirisfal Glades.
- **Expected:** Four starting zones, Durotar pressed by default. After choosing Tirisfal Glades the hash is `#/leveling/tirisfal` and step 1 is Tirisfal Glades. No step is Durotar, Mulgore, Zephras Isle, The Deadmines, The Stockade or Gnomeregan; The Barrens appears three times.

### TC-67 Guide links restore the starting zone
- **PRD:** FR-23
- **Steps:** Load `#/leveling/mulgore`, then `#/leveling/elwynn`.
- **Expected:** Mulgore is selected and is step 1. The unknown zone falls back to Durotar and the hash becomes `#/leveling/durotar`.

### TC-68 Timeline shows one bar per visit and selects that step
- **PRD:** FR-24
- **Preconditions:** `http://localhost:5173/#/leveling`
- **Steps:** Find the bars labelled "…: The Barrens, levels …" and click the second.
- **Expected:** Three Barrens bars. The clicked bar is pressed, and the selected step in the list is The Barrens, "visit 2 of 3", expanded with "Getting there:".

### TC-69 Map follows the selected step and cycles through a zone's visits
- **PRD:** FR-25
- **Preconditions:** `http://localhost:5173/#/leveling`
- **Steps:** Select the Silverpine Forest step; switch the map to Kalimdor; click The Barrens marker twice.
- **Expected:** Kalimdor is shown first; selecting Silverpine switches to "Route map of Eastern Kingdoms". The Barrens zone outline selects visit 1 of 3, then visit 2 of 3, and the caption names the selected step.

### TC-74 Route map is the in-game map with clickable zones, zoom and pan
- **PRD:** FR-25
- **Preconditions:** `http://localhost:5173/#/leveling`
- **Steps:** Check the map image loads; click "Show the whole continent", "Zoom in", drag the map sideways, then "Show the whole continent" again; select Wailing Caverns and click the Durotar outline.
- **Expected:** The map image is `maps/kalimdor.webp` and loads. The whole-continent button is disabled when nothing is zoomed; zooming in shrinks the view and enables it; dragging pans; the button restores the full view. Clicking Durotar selects step 1.

### TC-75 Clicking a zone centres the map on it and zooms to fit it
- **PRD:** FR-25
- **Preconditions:** `http://localhost:5173/#/leveling`
- **Steps:** Click "Show the whole continent", then click The Barrens outline, then the Durotar outline.
- **Expected:** After each click the map is centred on that zone and its whole outline is visible. The Barrens zooms in from the whole-continent view, Durotar (smaller) zooms in further, and Durotar becomes the selected step.


### TC-76 A step's zone map pins its quest hubs and highlights the step's hub
- **PRD:** FR-30
- **Preconditions:** `http://localhost:5173/#/leveling`
- **Steps:** Select the Ruins of Lordaeron step, click "Open Tirisfal Glades map", then press Esc.
- **Expected:** A dialog titled Tirisfal Glades shows `maps/zones/tirisfal.webp` with pins for Deathknell, Brill and Undercity. Undercity is highlighted, and the hub list tags it "This step". Esc closes the dialog and focus returns to the button.

### TC-77 The route map opens the selected zone's map; a visit there selects that step
- **PRD:** FR-30
- **Steps:** Select the first Barrens step, click "Open The Barrens map" in the route map's toolbar, then click the visit whose hub is Camp Taurajo.
- **Expected:** Pins for The Crossroads, Ratchet and Camp Taurajo, with The Crossroads highlighted. Clicking the visit closes the dialog and selects The Barrens, visit 3 of 3.

### TC-78 The zone map fits a 375 px phone
- **PRD:** FR-30, UX "Layout"
- **Preconditions:** viewport 375×812
- **Steps:** Open the Durotar map from step 1, then close it with the close button.
- **Expected:** The dialog lies within the 375 px viewport, with no horizontal scroll; the close button closes it.
### TC-70 "My level" jumps to a covering step
- **PRD:** FR-27
- **Steps:** Enter 27 in "My level" and click "Find step".
- **Expected:** The selected step's level range contains 27.

### TC-71 Progress is counted, survives a reload and resets
- **PRD:** FR-28
- **Steps:** Tick steps 1 and 2, reload, then click "Reset progress".
- **Expected:** Progress reads `0 / N`, then `2 / N`, still `2 / N` after the reload with step 2 ticked, then `0 / N`. "Reset progress" is disabled at 0.

### TC-72 Guide fits a 375 px phone without horizontal scroll
- **PRD:** UX "Layout", User story 7
- **Preconditions:** viewport 375×812
- **Steps:** Load `#/leveling`, hover the first timeline bar, then load `#/leveling/zephras-isle`.
- **Expected:** No horizontal scroll at any point.

### TC-73 The quiz still works from the guide
- **PRD:** FR-17, FR-21
- **Steps:** On `#/leveling`, open "Find my class", press Esc, click "Talents" and pick Warrior.
- **Expected:** The quiz opens and closes over the guide; the calculator then works as usual.

---

## Acceptance criteria coverage

| PRD acceptance criterion | Cases |
| --- | --- |
| All 9 classes appear in the picker and each shows 3 trees with icons | TC-05, TC-09, TC-10 |
| Tier-2 talent locked at 4 points in tier 1, unlocks at the 5th | TC-20 |
| Unmaxed prerequisite blocks learning; maxed allows it | TC-24, TC-25, TC-26, TC-27 |
| Talent cannot go above its max rank | TC-19 |
| Build stops at 51; summary 51 / 51 and required level 60 | TC-28 |
| Removing a point that would strand a higher tier or break a prerequisite is blocked | TC-33, TC-34, TC-35, TC-36 |
| Right-click removes a point without opening the browser menu | TC-30 |
| Tooltips show rank text, next-rank text and unmet requirements | TC-37, TC-38, TC-39, TC-40 |
| Copying a link and reloading restores the same class and build | TC-47, TC-49 |
| A link with illegal points loads with those points dropped | TC-50 |
| No horizontal scroll at 375 px; no console errors | TC-56, TC-01, TC-57 |
| Class quiz recommends a class and spec, lists two runners-up, and opens the class with the suggested tree | TC-61, TC-62 |
| Quiz respects the faction answer; no horizontal scroll at 375 px | TC-63, TC-64 |
| Guide starts in the chosen zone, skips other starting zones and Alliance dungeons | TC-66 |
| Guide timeline shows three Barrens visits; bars and map zones select steps; map follows the continent | TC-68, TC-69 |
| Route map is the in-game map with clickable zone outlines, zoom and pan | TC-74 |
| Zone map opens from the step or route map, pins hubs with the step's highlighted, fits 375 px | TC-76, TC-77, TC-78 |
| "My level" lookup; progress survives reload and resets | TC-70, TC-71 |
| Route rule tests pass; guide has no horizontal scroll at 375 px | Vitest `src/lib/leveling.test.ts`; TC-72 |
| Data quality tests pass for all 9 class files | Not a browser test (Vitest `src/data/classes/classes.test.ts`); TC-10 checks the visible counts |

## FR coverage

| FR | Cases |
| --- | --- |
| FR-1 | TC-01, TC-02 |
| FR-2 | TC-05, TC-06, TC-07 |
| FR-3 | TC-08 |
| FR-4 | TC-09 |
| FR-5 | TC-11 |
| FR-6 | TC-12, TC-13, TC-14 |
| FR-7 | TC-15, TC-16 |
| FR-8 | TC-17 |
| FR-9 | TC-18, TC-19, TC-20–TC-29 |
| FR-10 | TC-30–TC-36 |
| FR-11 | TC-37–TC-42, TC-54 |
| FR-12 | TC-18, TC-28, TC-43 |
| FR-13 | TC-44, TC-45 |
| FR-14 | TC-46, TC-47, TC-48 |
| FR-15 | TC-49, TC-50, TC-51, TC-52 |
| FR-16 | TC-03 |
| FR-17 | TC-59 |
| FR-18 | TC-60 |
| FR-19 | TC-61 |
| FR-20 | TC-62 |
| FR-21 | TC-65, TC-73 |
| FR-22 | TC-66 |
| FR-23 | TC-67 |
| FR-24 | TC-68 |
| FR-25 | TC-69, TC-74, TC-75 |
| FR-26 | TC-68 |
| FR-27 | TC-70 |
| FR-28 | TC-71 |
| FR-30 | TC-76, TC-77, TC-78 |
| FR-29 | Not automated: check the "Left out on purpose" panel lists the skipped zones and dungeons with reasons |

## Suspected discrepancies between code and PRD (to confirm during execution)

1. **Required level:** the PRD says `9 + P`. The code (`requiredLevel` in `src/lib/talents.ts`) returns `10 + P`, so a full build would show 61 instead of 60 (TC-18, TC-28, TC-43).
2. **Same-tier prerequisite in a lower column is lost on decode:** `decodeBuild` replays each tier in column order, so Paladin Divine Precision (T5C1) is applied before Holy Shock (T5C2) and dropped. This breaks the round-trip metric (TC-49). The Priest Mind Flay pair is unaffected because the prerequisite is in the lower column.
3. **Connector highlight:** the PRD says it lights up once the prerequisite is maxed. The code lights it only when the dependent talent is fully unlocked, including its tier (TC-13).
4. **Empty middle tree in links:** the PRD example writes it as `0` (`0500320-0-31`). The encoder writes it as an empty string (`0500320--31`). Both decode, but the canonical form differs (TC-26, TC-44, TC-46, TC-50).
5. **PRD example link is itself illegal:** `#/mage/0500320-0-31` puts 3 points in Arcane Subtlety and Frost Warding, which both have max rank 2, so it cannot round-trip unchanged (TC-50 step 3).
