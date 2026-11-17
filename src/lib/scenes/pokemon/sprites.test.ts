import { describe, expect, it } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { PNG } from "pngjs";
import manifest from "./manifest.json";
import { SPRITE_GUTTER, atlasCell } from "./sprites";

describe("display atlases", () => {
  it("preserves every source pixel and separates all 48 sheets with transparent gutters", () => {
    for (const pokemon of Object.values(manifest))
      for (const animation of Object.values(pokemon)) {
        const source = PNG.sync.read(
          readFileSync(join(import.meta.dirname, "assets", animation.file)),
        );
        const atlas = PNG.sync.read(
          readFileSync(join(import.meta.dirname, "atlases", animation.file)),
        );
        const cell = atlasCell(animation);
        expect(atlas.width).toBe(cell.width * animation.durations.length);
        expect(atlas.height).toBe(cell.height * animation.rows);
        let differences = 0;
        let gutterPixels = 0;
        for (let y = 0; y < atlas.height; y++)
          for (let x = 0; x < atlas.width; x++) {
            const cx = (x % cell.width) - SPRITE_GUTTER;
            const cy = (y % cell.height) - SPRITE_GUTTER;
            const to = (y * atlas.width + x) * 4;
            if (
              cx < 0 ||
              cy < 0 ||
              cx >= animation.width ||
              cy >= animation.height
            ) {
              if (atlas.data[to + 3]) gutterPixels++;
            } else {
              const sx = Math.floor(x / cell.width) * animation.width + cx;
              const sy = Math.floor(y / cell.height) * animation.height + cy;
              const from = (sy * source.width + sx) * 4;
              for (let channel = 0; channel < 4; channel++)
                if (source.data[from + channel] !== atlas.data[to + channel])
                  differences++;
            }
          }
        expect(differences).toBe(0);
        expect(gutterPixels).toBe(0);
      }
  });
});
