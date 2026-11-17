import { PNG } from "pngjs";
import { SPRITE_GUTTER, atlasCell } from "../src/lib/scenes/pokemon/sprites";

export function paddedAtlas(
  png: Buffer,
  frame: {
    width: number;
    height: number;
    rows: number;
    durations: readonly number[];
  },
): Buffer {
  const original = PNG.sync.read(png);
  const cell = atlasCell(frame);
  const atlas = new PNG({
    width: cell.width * frame.durations.length,
    height: cell.height * frame.rows,
  });
  atlas.data.fill(0);
  for (let row = 0; row < frame.rows; row++)
    for (let column = 0; column < frame.durations.length; column++)
      for (let y = 0; y < frame.height; y++) {
        const from =
          ((row * frame.height + y) * original.width + column * frame.width) *
          4;
        const to =
          ((row * cell.height + SPRITE_GUTTER + y) * atlas.width +
            column * cell.width +
            SPRITE_GUTTER) *
          4;
        original.data.copy(atlas.data, to, from, from + frame.width * 4);
      }
  return PNG.sync.write(atlas);
}
