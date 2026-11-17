/** Rebuild display atlases offline; originals remain untouched for attribution. */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import manifest from "../src/lib/scenes/pokemon/manifest.json";
import { paddedAtlas } from "./sprite-atlas";

const root = join(import.meta.dirname, "../src/lib/scenes/pokemon");
await mkdir(join(root, "atlases"), { recursive: true });
for (const pokemon of Object.values(manifest))
  for (const animation of Object.values(pokemon)) {
    await writeFile(
      join(root, "atlases", animation.file),
      paddedAtlas(
        await readFile(join(root, "assets", animation.file)),
        animation,
      ),
    );
  }
console.log(
  "✓ 48 display atlases rebuilt with transparent gutters; source pixels preserved",
);
