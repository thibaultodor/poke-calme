/** Original Emerald grass; palette index zero is transparent in the game. */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

const revision = "9103e529c2fbdd7add4a1ff3350c6c1f92112c42";
const source = `https://raw.githubusercontent.com/pret/pokeemerald/${revision}`;
const path = "graphics/field_effects/pics/tall_grass.png";
async function download(path: string) {
  const response = await fetch(`${source}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}
const original = await download(path);
if (
  original.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
  original.readUInt32BE(16) !== 80 ||
  original.readUInt32BE(20) !== 16 ||
  original[25] !== 3
) {
  throw new Error(
    "Unexpected tall-grass sheet: expected five indexed 16×16 frames",
  );
}
// Add PNG transparency without changing the palette or any source pixel indices.
const transparency = Buffer.from([0, 0, 0, 1, 116, 82, 78, 83, 0, 0, 0, 0, 0]);
let crc = 0xffffffff;
for (const value of transparency.subarray(4, 9)) {
  crc ^= value;
  for (let bit = 0; bit < 8; bit++)
    crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
}
transparency.writeUInt32BE((crc ^ 0xffffffff) >>> 0, 9);
let offset = 8;
while (original.toString("ascii", offset + 4, offset + 8) !== "IDAT") {
  if (original.toString("ascii", offset + 4, offset + 8) === "tRNS")
    throw new Error("Source transparency changed; review before importing");
  offset += original.readUInt32BE(offset) + 12;
}
const effects = join(import.meta.dirname, "../src/lib/scenes/pokemon/effects");
const credits = join(import.meta.dirname, "../static/credits/emerald");
await mkdir(effects, { recursive: true });
await mkdir(credits, { recursive: true });
await writeFile(
  join(effects, "tall-grass.png"),
  Buffer.concat([
    original.subarray(0, offset),
    transparency,
    original.subarray(offset),
  ]),
);
await writeFile(join(credits, "tall-grass-original.png"), original);
await writeFile(
  join(credits, "field-effect-objects.h.txt"),
  await download("src/data/field_effects/field_effect_objects.h"),
);
await writeFile(
  join(credits, "CREDITS.md"),
  `# Hautes herbes — Pokémon Émeraude\n\nSource : https://github.com/pret/pokeemerald/blob/${revision}/${path}\n\nRévision : ${revision}\n\nGraphismes d’origine Pokémon Émeraude, GAME FREAK / Nintendo / Creatures. Le dépôt de décompilation pret/pokeemerald ne confère pas de licence sur les graphismes Pokémon.\n\nLa planche contient cinq images de 16 × 16 pixels. L’animation d’origine joue les images 1, 2, 3, 4, 0 pendant 10 ticks chacune. Le fichier d’origine et le code descriptif sont conservés ici. Seule la transparence de l’indice de palette 0 est ajoutée pour l’affichage web, sans modifier les couleurs ni les indices des pixels.\n\nLa bulle d’exclamation et les signes de sommeil sont dessinés en SVG pour cette application.\n`,
);
console.log(
  "✓ Five original grass frames imported with palette-zero transparency and attribution",
);
