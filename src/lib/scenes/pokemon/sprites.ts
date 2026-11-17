/** Transparent gutters prevent neighbouring cells leaking at fractional scales. */
export const SPRITE_GUTTER = 2;
type Size = { width: number; height: number };

export function atlasCell(frame: Size): Size {
  return {
    width: frame.width + SPRITE_GUTTER * 2,
    height: frame.height + SPRITE_GUTTER * 2,
  };
}

export function spriteBox(
  animations: Record<"idle" | "walk" | "sleep", Size>,
): Size {
  const cells = Object.values(animations).map(atlasCell);
  return {
    width: Math.max(...cells.map((cell) => cell.width)),
    height: Math.max(...cells.map((cell) => cell.height)),
  };
}
