// Finds the cheapest skill-up at every skill from 1 to 299 using the research data in docs/research/professions,
// the method behind the Tailoring route in src/data/professions/tailoring.ts.
//
//   node scripts/professions/cheapest-route.mjs tailoring [--min-chance 0.5] [--include 18409,18417]
//   node scripts/professions/cheapest-route.mjs enchanting --exclude 1248461,1248509,1248505,1248515
//
//   node scripts/professions/cheapest-route.mjs enchanting --values   (prints what each Enchanting material is worth)
//
// Candidates are trainer recipes (source 6) and recipes with no source (learned automatically), plus any spell ids
// passed with --include (e.g. vendor patterns the Horde can buy), minus any passed with --exclude. An empty source
// list means either "learned automatically" or "source not datamined yet", so exclude the latter by hand. Cost per skill point at a skill is
//   (materials at vendor buy price, or at vendor sell price for anything vendors don't sell − vendor sell price of
//    the result) / chance of a skill-up,
// Enchanting materials sell to vendors for 1 copper, so for Enchanting they are valued instead by what disenchanting
// costs, from enchanting-material-values.json: the price of a green or blue you would otherwise sell divided by how
// many of the material disenchanting it gives, from the cheapest source, capped at any vendor price; its 'overrides'
// win. Its vendor prices also cover the wood, rods and motes Enchanting recipes buy.
// The chance is 1 below yellow and (grey − skill) / (grey − yellow) from yellow to grey. Recipes with
// incomplete Forever thresholds use Classic's (Tailoring only). Steps shorter than --merge points are merged into
// a neighbour that can cover them.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const DIR = join(dirname(fileURLToPath(import.meta.url)), "../../docs/research/professions");
const read = (f) => JSON.parse(readFileSync(join(DIR, f), "utf8"));

const args = process.argv.slice(2);
const profession = args[0] ?? "tailoring";
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : fallback;
};
const MIN_CHANCE = Number(opt("min-chance", 0.5));
const MERGE = Number(opt("merge", 4));
const ids = (name) => new Set(String(opt(name, "")).split(",").filter(Boolean).map(Number));
const INCLUDE = ids("include");
const EXCLUDE = ids("exclude");
const EXCLUDE_REAGENT = /Potion|Elixir|Pearl|Bar$|Jade|Elemental|Heart of|Globe|Shard|Shadow Silk|Spider|Wildvine|Oil|Buckle|Dye|Gem|Ore|Rune$|Essence of/;

const recipes = readFileSync(join(DIR, `forever-${profession}-recipes.jsonl`), "utf8")
  .split("\n")
  .filter(Boolean)
  .map((l) => {
    const [id, name, learn, colors, reagents, creates, count, source] = JSON.parse(l);
    return { id, name, learn, colors, reagents: reagents ?? [], creates, count: count || 1, source };
  });
const items = read("forever-items.json").items;
const prices = read("forever-vendor-prices.json");
const buy = {};
for (const group of [prices.tailoringReagents, prices.enchantingMaterials]) {
  for (const [id, v] of Object.entries(group)) if (v.buy != null) buy[id] = v.buy;
}
const enchantingValues = {};
if (profession === "enchanting") {
  const v = read("enchanting-material-values.json");
  for (const [band, kinds] of Object.entries(v.disenchant)) {
    if (band.startsWith("_")) continue;
    for (const [kind, yields] of Object.entries(kinds)) {
      for (const [id, count] of Object.entries(yields)) {
        const each = v.itemPrices[band][kind] / count;
        enchantingValues[id] = Math.min(enchantingValues[id] ?? Infinity, buy[id] ?? Infinity, each);
      }
    }
  }
  for (const [id, copper] of Object.entries(v.vendorBuy)) if (!id.startsWith("_")) buy[id] = copper;
  for (const [id, copper] of Object.entries(v.overrides)) if (!id.startsWith("_")) enchantingValues[id] = copper;
  for (const id of Object.keys(enchantingValues)) delete buy[id];
  if (args.includes("--values")) {
    for (const [id, copper] of Object.entries(enchantingValues).sort((a, b) => a[1] - b[1]))
      console.log(`${items[id]?.name ?? prices.enchantingMaterials[id]?.name ?? id}: ${Math.round(copper)}c`);
    process.exit(0);
  }
}
const classic = profession === "tailoring" ? read("classic-tailoring-thresholds.json").recipes : {};

const complete = (c) => c && c[1] > 0 && c[2] > 0 && c[3] > Math.max(c[0], 1);
const value = (id) => enchantingValues[id] ?? buy[id] ?? items[id]?.sell ?? 0;
const crafted = new Set(recipes.map((r) => r.creates).filter(Boolean));
const usable = (id) => buy[id] != null || enchantingValues[id] != null || crafted.has(id) || !EXCLUDE_REAGENT.test(items[id]?.name ?? "");

const pool = recipes
  .filter((r) => r.learn && r.learn < 9999 && r.reagents.length)
  .filter((r) => (r.source.includes(6) || r.source.length === 0 || INCLUDE.has(r.id)) && !EXCLUDE.has(r.id))
  .filter((r) => r.reagents.every(([id]) => usable(id)))
  .map((r) => {
    const confirmed = complete(r.colors);
    const col = confirmed ? [...r.colors] : classic[r.id]?.colors && [...classic[r.id].colors];
    if (!col || !complete(col)) return null;
    col[0] = Math.max(col[0], r.learn);
    const net = (items[r.creates]?.sell ?? 0) * r.count - r.reagents.reduce((a, [id, n]) => a + n * value(id), 0);
    return { ...r, col, confirmed, net };
  })
  .filter(Boolean);

const chance = (r, s) => {
  const [orange, yellow, , grey] = r.col;
  if (s < orange || s >= grey) return 0;
  return s < yellow ? 1 : (grey - s) / (grey - yellow);
};

function best(s) {
  for (const min of [MIN_CHANCE, 0.01]) {
    let pick = null;
    for (const r of pool) {
      const p = chance(r, s);
      if (p < min) continue;
      const cost = -r.net / p;
      if (!pick || cost < pick.cost) pick = { r, cost };
    }
    if (pick) return pick.r;
  }
  return null;
}

let steps = [];
for (let s = 1; s < 300; s++) {
  const r = best(s);
  const last = steps[steps.length - 1];
  if (last && last.r === r) last.to = s + 1;
  else steps.push({ from: s, to: s + 1, r });
}
const covers = (r, a, b) => r && Array.from({ length: b - a }, (_, i) => chance(r, a + i)).every((p) => p > 0);
for (let changed = true; changed; ) {
  changed = false;
  for (let i = 0; i < steps.length; i++) {
    const st = steps[i];
    if (st.to - st.from >= MERGE) continue;
    const prev = steps[i - 1];
    const next = steps[i + 1];
    if (prev && covers(prev.r, st.from, st.to)) prev.to = st.to;
    else if (next && covers(next.r, st.from, st.to)) next.from = st.from;
    else continue;
    steps.splice(i, 1);
    changed = true;
    break;
  }
}
steps = steps.reduce((out, st) => {
  const last = out[out.length - 1];
  if (last && last.r === st.r) last.to = st.to;
  else out.push({ ...st });
  return out;
}, []);

let total = 0;
for (const { from, to, r } of steps) {
  if (!r) {
    console.log(`${from}-${to}: no candidate`);
    continue;
  }
  let crafts = 0;
  for (let s = from; s < to; s++) crafts += 1 / chance(r, s);
  const cost = (-r.net * crafts) / 100;
  total += cost;
  console.log(
    `${from}-${to} ${r.name} (spell ${r.id}, learn ${r.learn}, colours ${r.col.join("/")}${r.confirmed ? "" : " Classic"}): ` +
      `${Math.ceil(crafts - 1e-9)} crafts, ${cost.toFixed(1)}s`,
  );
}
console.log(`Total at ${profession === "enchanting" ? "material values" : "vendor prices"}: ${(total / 100).toFixed(2)}g`);
