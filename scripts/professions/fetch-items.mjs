// Fetches Forever item data from Wowhead's tooltip API for every item the recipe lists in
// docs/research/professions make or use, and writes docs/research/professions/forever-items.json.
// Run with: node scripts/professions/fetch-items.mjs
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../../docs/research/professions");
const TOOLTIP = "https://nether.wowhead.com/forever/tooltip/item/";
const LISTS = ["forever-tailoring-recipes.jsonl", "forever-enchanting-recipes.jsonl"];

const ids = new Set();
for (const file of LISTS) {
  for (const line of readFileSync(join(DIR, file), "utf8").split("\n").filter(Boolean)) {
    const [, , , , reagents, creates] = JSON.parse(line);
    if (creates) ids.add(creates);
    for (const [id] of reagents ?? []) ids.add(id);
  }
}

const SLOTS =
  "Head|Neck|Shoulder|Back|Chest|Wrist|Hands|Waist|Legs|Feet|Finger|Trinket|Held In Off-hand|Off Hand|Main Hand|One-Hand|Two-Hand|Ranged|Shirt|Tabard";

function copper(html) {
  const block = html.match(/whtt-sellprice[^]*?<\/div>/)?.[0];
  if (!block) return 0;
  const part = (unit) => Number(block.match(new RegExp(`money${unit}">(\\d+)`))?.[1] ?? 0);
  return part("gold") * 10000 + part("silver") * 100 + part("copper");
}

function parse(json) {
  const html = json.tooltip.replace(/<!--[^>]*-->/g, "");
  const text = html.replace(/<br\s*\/?>/g, "\n").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/[ \t]+/g, " ");
  const num = (re) => Number(text.match(re)?.[1] ?? 0) || undefined;
  return {
    name: json.name,
    quality: json.quality,
    icon: json.icon,
    itemLevel: Number(json.tooltip.match(/Item Level <!--ilvl-->(\d+)/)?.[1] ?? 0) || undefined,
    requiredLevel: num(/Requires Level (\d+)/),
    slot: html.match(new RegExp(`<td>(${SLOTS})</td>`))?.[1],
    bagSlots: num(/(\d+) Slot/),
    sell: copper(json.tooltip),
    bindsOnPickup: /Binds when picked up/.test(text) || undefined,
    classes: text.match(/Classes:\s*([A-Za-z, ]+)/)?.[1]?.trim(),
    stamina: num(/\+(\d+) Stamina/),
    intellect: num(/\+(\d+) Intellect/),
    spirit: num(/\+(\d+) Spirit/),
    spellPower: num(/magical spells and effects by up to (\d+)/),
    shadowPower: num(/Shadow spells and effects by up to (\d+)/),
    firePower: num(/Fire spells and effects by up to (\d+)/),
    dps: num(/\(([\d.]+) damage per second\)/),
  };
}

const items = {};
const failed = [];
const list = [...ids].sort((a, b) => a - b);
for (let i = 0; i < list.length; i += 10) {
  await Promise.all(
    list.slice(i, i + 10).map(async (id) => {
      try {
        const res = await fetch(TOOLTIP + id);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        items[id] = parse(await res.json());
      } catch (e) {
        failed.push(`${id}: ${e.message}`);
      }
    }),
  );
  await new Promise((r) => setTimeout(r, 300));
}

writeFileSync(
  join(DIR, "forever-items.json"),
  JSON.stringify(
    {
      _source: `Wowhead Forever tooltip API (${TOOLTIP}<id>), fetched ${new Date().toISOString().slice(0, 10)} by scripts/professions/fetch-items.mjs. sell is the vendor sell price in copper; stats are parsed from the tooltip text.`,
      failed,
      items,
    },
    null,
    1,
  ),
);
console.log(`${Object.keys(items).length} items, ${failed.length} failed`);
