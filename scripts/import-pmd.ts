/** Download Idle/Walk/Sleep, with their original metadata and attribution. */
import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { POKEMON } from "../src/lib/scenes/pokemon/catalog";
import { paddedAtlas } from "./sprite-atlas";

// Pinned for reproducible downloads; update deliberately, after reviewing credits.
const revision = "c9765fc6f8474168a24be5c785ded6fe58683ce0";
const raw = `https://raw.githubusercontent.com/PMDCollab/SpriteCollab/${revision}`;
const root = join(import.meta.dirname, "../src/lib/scenes/pokemon");
const assets = join(root, "assets");
const creditsDir = join(import.meta.dirname, "../static/credits/pmd");
await mkdir(assets, { recursive: true });
await mkdir(join(root, "atlases"), { recursive: true });
await mkdir(creditsDir, { recursive: true });

async function download(path: string) {
  const response = await fetch(`${raw}/${path}`);
  if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
  return Buffer.from(await response.arrayBuffer());
}

interface Animation {
  file: string;
  width: number;
  height: number;
  durations: number[];
  rows: number;
}
const manifest: Record<
  string,
  { idle: Animation; walk: Animation; sleep: Animation }
> = {};
const credits = [
  "# Sprites Pokémon Donjon Mystère — crédits",
  "",
  "Source : https://github.com/PMDCollab/SpriteCollab",
  `Révision : ${revision}`,
  "",
  "Politique du dépôt : CC BY-NC 4.0 pour les contributions que leurs auteurs peuvent licencier.",
  "Les crédits CHUNSOFT désignent des sprites officiels. Les droits Pokémon restent réservés à leurs titulaires.",
  "Sprites PNG et métadonnées d’origine conservés ; seul leur affichage est animé et agrandi dans cette app.",
  "Licence : https://creativecommons.org/licenses/by-nc/4.0/",
  "",
];

// Batches keep the import small and avoid fetching the entire repository.
for (let start = 0; start < POKEMON.length; start += 4) {
  await Promise.all(
    POKEMON.slice(start, start + 4).map(async (pokemon) => {
      const id = String(pokemon.id).padStart(4, "0");
      const source = `sprite/${id}`;
      const [xmlBuffer, attribution] = await Promise.all([
        download(`${source}/AnimData.xml`),
        download(`${source}/credits.txt`),
      ]);
      const xml = xmlBuffer.toString("utf8");
      const blocks = [...xml.matchAll(/<Anim>([\s\S]*?)<\/Anim>/g)].map(
        (m) => m[1],
      );
      const read = async (
        name: "Idle" | "Walk" | "Sleep",
      ): Promise<Animation> => {
        let block = blocks.find((b) => b.includes(`<Name>${name}</Name>`));
        if (!block) throw new Error(`${id}: missing ${name}`);
        const copy = block.match(/<CopyOf>([^<]+)<\/CopyOf>/)?.[1];
        if (copy)
          block = blocks.find((b) => b.includes(`<Name>${copy}</Name>`));
        if (!block) throw new Error(`${id}: missing copied animation`);
        const width = Number(
          block.match(/<FrameWidth>(\d+)<\/FrameWidth>/)?.[1],
        );
        const height = Number(
          block.match(/<FrameHeight>(\d+)<\/FrameHeight>/)?.[1],
        );
        const durations = [
          ...block.matchAll(/<Duration>(\d+)<\/Duration>/g),
        ].map((m) => Number(m[1]));
        const filename = `${id}-${name}.png`;
        const png = await download(`${source}/${copy ?? name}-Anim.png`);
        const rows = png.readUInt32BE(20) / height;
        if (
          !width ||
          !height ||
          !durations.length ||
          durations.some((d) => d <= 0) ||
          png.toString("hex", 0, 8) !== "89504e470d0a1a0a" ||
          png.readUInt32BE(16) !== width * durations.length ||
          ![1, 8].includes(rows) ||
          (name !== "Sleep" && rows !== 8)
        ) {
          throw new Error(`${id}: unexpected ${name} spritesheet dimensions`);
        }
        await writeFile(join(assets, filename), png);
        const animation = { file: filename, width, height, durations, rows };
        await writeFile(
          join(root, "atlases", filename),
          paddedAtlas(png, animation),
        );
        return animation;
      };
      const [idle, walk, sleep] = await Promise.all([
        read("Idle"),
        read("Walk"),
        read("Sleep"),
      ]);
      manifest[pokemon.slug] = { idle, walk, sleep };
      await writeFile(join(creditsDir, `${id}-AnimData.xml`), xmlBuffer);
      await writeFile(join(creditsDir, `${id}-credits.txt`), attribution);
      console.log(
        `✓ ${pokemon.name}: Idle + Walk (8 directions), Sleep (${sleep.rows} row)`,
      );
    }),
  );
}
// Stable output even when downloads complete out of order.
const ordered = Object.fromEntries(
  POKEMON.map((p) => [p.slug, manifest[p.slug]]),
);
for (const pokemon of POKEMON) {
  const id = String(pokemon.id).padStart(4, "0");
  const attribution = await import("node:fs/promises").then((fs) =>
    fs.readFile(join(creditsDir, `${id}-credits.txt`), "utf8"),
  );
  credits.push(
    `## ${pokemon.name} (#${id})`,
    "",
    `Source : https://github.com/PMDCollab/SpriteCollab/tree/${revision}/sprite/${id}`,
    "",
    "```text",
    attribution.trim(),
    "```",
    "",
  );
}
await writeFile(
  join(root, "manifest.json"),
  `${JSON.stringify(ordered, null, 2)}\n`,
);
await writeFile(join(creditsDir, "CREDITS.md"), credits.join("\n"));
await writeFile(join(creditsDir, "LICENSE.md"), await download("LICENSE.md"));
console.log("Manifest and original credits saved. No runtime API needed.");
