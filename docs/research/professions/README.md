# Profession research data (WoW: Forever)

Raw data behind the Tailoring and Enchanting guides in [src/data/professions/](../../../src/data/professions/), captured on 18 Oct 2026 from the 1.60.1 beta datamine. Use it to change a route or the class items without re-scraping. Every file says where its data came from in a `_source` field or at the top.

## Files

| File | What | Source |
| --- | --- | --- |
| [forever-tailoring-recipes.jsonl](forever-tailoring-recipes.jsonl) | All 413 Forever Tailoring recipes, one JSON array per line | Wowhead Forever spell list |
| [forever-enchanting-recipes.jsonl](forever-enchanting-recipes.jsonl) | All 270 Forever Enchanting spells (recipes, plus the rank and Disenchant spells) | Wowhead Forever spell list |
| [classic-tailoring-thresholds.json](classic-tailoring-thresholds.json) | Classic 1.12 learn skill and colours for 283 Tailoring recipes, by spell id | Wowhead Classic spell list |
| [forever-items.json](forever-items.json) | 652 items made or used by those recipes: quality, item and required level, slot, bag slots, vendor sell price, binding, caster stats, wand DPS | Wowhead Forever tooltip API, via [fetch-items.mjs](../../../scripts/professions/fetch-items.mjs) |
| [forever-vendor-prices.json](forever-vendor-prices.json) | Vendor buy prices of thread and dye, and buy/sell prices of every Enchanting material | Wowhead Forever item pages ("Sold by") |
| [enchanting-material-values.json](enchanting-material-values.json) | What each Enchanting material is worth for costing the route: median Forever vendor price of greens and blues per item-level band, Classic disenchant yields for green armor, green weapons and blues, vendor buy prices of wood, rods and Motes, per-material price overrides, the spread (count and quartiles) behind each median, and the rod each enchant is assumed to need (not confirmed) | Wowhead Forever item lists; warcraft.wiki.gg disenchanting tables |
| [forever-disenchanting.json](forever-disenchanting.json) | Observed disenchant results for 52 green Tailoring items, the Classic disenchant table, item levels of green Tailoring items | Wowhead Forever item pages ("Disenchanting") |
| [forever-recipe-sources.json](forever-recipe-sources.json) | Where Horde players get the non-trainer patterns and formulas used in the guides (vendor, Merchant's Favor price, drops), and the Horde trainers | Wowhead Forever spell and pattern pages; Zockify trainer pages |
| [published-guides.md](published-guides.md) | The Zockify and Kami-labs leveling routes and the Forever changes they list | Third-party guides |

### Recipe line format (`*.jsonl`)

```
[spellId, name, learnedAt, colors, reagents, createsItemId, createsCount, source]
[3755, "Linen Bag", 45, [45,45,47,65], [[2996,3],[2320,3]], 4238, 1, [6]]
```

- `colors` is `[orange, yellow, green, grey]`: the skill at which the recipe turns each colour. `0` means "not set". When orange is `0`, the recipe goes yellow as soon as it is learned, so use `learnedAt` as the learn skill.
- Forever's thresholds are incomplete above about skill 125. For example, `[125, 0, 0, 125]` would mean no skill-ups at all, so treat it as missing. Where Forever's are complete they are 10–40 points lower than Classic's, and most recipes turn yellow at their learn skill.
- `reagents` is a list of `[itemId, count]`. Item names, prices and stats are in `forever-items.json`.
- `createsCount` is `0` or `null` for enchants and for items Wowhead lists without a count.
- `source` uses Wowhead's codes: `6` trainer, `5` vendor, `2` drop, `4` quest, `16` world drop, `21` other. An empty list means either learned automatically (e.g. Bolt of Linen Cloth, Runed Copper Rod) or that the source is not datamined yet (e.g. Black Cord, Twisted Nether Wand). `forever-recipe-sources.json` says which.

## Findings used in the guides

- **Vendor prices.** Forever vendors pay much more for cloth than Classic did: Silk Cloth 1s 50c, Mageweave 2s 50c, Runecloth 4s, a Linen Bag 2s. Every Enchanting material sells for 1 copper. Strange Dust and Lesser Magic Essence can be bought from a vendor for 7s 57c each.
- **Disenchanting.** Forever's observed results match Classic's disenchant table by item level (e.g. Woolen Cape, item level 16: about 1.9 Strange Dust and 0.3 Greater Magic Essence).
- **Disenchant skill-ups.** Disenchant (spell 13262) has `learnedAt` 20 and colours `[0,20,40,60]` in both Forever and Classic data. In Classic it comes with Apprentice, so 20 is where its skill-up chance starts to fall, not a learn skill. Each disenchant can give a point until 60. The Enchanting route doesn't count these points.
- **Dyes.** Cerulean, Magenta and Viridian Dye come only from Alchemy.
- **Cost model.** The Tailoring route was found with [cheapest-route.mjs](../../../scripts/professions/cheapest-route.mjs). At each skill it takes the candidate with the lowest expected cost per point among those with at least a 50% skill-up chance, then merges steps shorter than 4 points:

  ```bash
  node scripts/professions/cheapest-route.mjs tailoring --include 18409,18417
  ```

  - Cost is the materials (vendor buy price, or vendor sell price for anything vendors don't sell) minus the vendor sell price of the result.
  - Skill-up chance is 1 below yellow, then (grey − skill) / (grey − yellow).
  - 18409 and 18417 are the neutral-vendor Runecloth Cloak and Gloves patterns.
  - The shipped route also hand-fixes a learn skill of 0 (Barbaric Linen Vest learns at 70).
- **Enchanting.** Enchanting materials are worth 1 copper to a vendor, so the script values them from [enchanting-material-values.json](enchanting-material-values.json) instead. A material is worth the price of a green or blue you would otherwise sell, divided by how many of it disenchanting that item gives. The cheapest source wins, and a material is never worth more than a vendor's price for it. To revalue, edit `itemPrices` (e.g. auction prices of greens) or `overrides` (auction prices of single materials) and rerun. `--values` prints the resulting values. The route in the guide adds the runed rods by hand. It excludes the new formulas with no known source (the four wands and 1248497, 1248528, 1248500, 1248510, 1248511, 1248599, all listed in `forever-recipe-sources.json`) and the Season of Discovery leftovers. It includes the Undercity Shield – Greater Stamina formula:

  ```bash
  node scripts/professions/cheapest-route.mjs enchanting --exclude 1248461,1248509,1248505,1248515,1248497,1248528,1248500,1248510,1248511,1248599,446243,435903,435481 --include 20017,20026
  ```

## Refreshing the data

- **Item data:** `node scripts/professions/fetch-items.mjs` re-fetches `forever-items.json` from the tooltip API, which works from the command line.
- **Recipe lists, vendor prices, disenchant results and pattern sources:** Wowhead's pages return HTTP 403 to scripts, so these were read in a browser. Open `https://www.wowhead.com/forever/spells/professions/<profession>` and run this in the console; it prints the lines of the `.jsonl` file:

  ```js
  Object.values(g_listviews).flatMap((l) => l.data)
    .map((x) => JSON.stringify([x.id, x.name, x.learnedat ?? null, x.colors ?? null, x.reagents ?? null, x.creates?.[0] ?? null, x.creates?.[1] ?? null, x.source ?? []]))
    .join("\n");
  ```

- **Item prices per item-level band** (`itemPrices` and `itemPriceSpread` in `enchanting-material-values.json`): in the browser, on any Wowhead Forever page, fetch `/forever/items/<armor|weapons>/min-level:<lo>/max-level:<hi>/quality:<2|3>` for each band (quality 2 green, 3 blue). The list is a JavaScript literal (not JSON) after `var listviewitems = `; take `"id":<id>,"level":<itemLevel>` pairs from it and keep those inside the band. Sell prices are in the embedded item data, `"<id>":{"name_enus":…,"jsonequip":{…"sellprice":<copper>…}}`. The median per band is the price used. About one request a second stays under the rate limit.
- **Item pages** (`https://www.wowhead.com/forever/item=<id>`) hold the "Sold by" (with `cost`), "Dropped by" and "Disenchanting" lists in the same `new Listview({ id: '…', data: [...] })` form. Wowhead rate-limits item pages after a few dozen quick requests, so fetch them slowly. Classic data is at the same paths under `/classic/`.
