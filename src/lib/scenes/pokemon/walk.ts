/** PMD rows: down, down-right, right, up-right, up, up-left, left, down-left. */
export function directionFor(dx: number, dy: number): number {
  const direction = (Math.round(Math.atan2(dx, dy) / (Math.PI / 4)) + 8) % 8;
  // Even a shallow change in depth must face towards or away from the class.
  // Reserve the side-on rows for travel that stays at exactly the same depth.
  if (dy !== 0 && (direction === 2 || direction === 6)) {
    return dy > 0 ? (dx > 0 ? 1 : 7) : dx > 0 ? 3 : 5;
  }
  return direction;
}

/** Ground line under the distant trees, and the front edge of the clearing. */
export const MEADOW_HORIZON = 0.59;
export const MEADOW_FOREGROUND = 0.88;
export const WALK_STRIDE_PIXELS = 8;
const WALK_SPEED = 0.022;
const WALK_DIRECTIONS = [
  [0, 1],
  [1, 1],
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, -1],
  [-1, 0],
  [-1, 1],
] as const;

/** Equal-size Pokémon grow with their feet's distance below the horizon. */
export function perspectiveScale(y: number): number {
  const depth = Math.max(
    0,
    Math.min(1, (y - MEADOW_HORIZON) / (MEADOW_FOREGROUND - MEADOW_HORIZON)),
  );
  return 1 + depth * 1.8;
}

/** Durations are PMD ticks (1/60 second), and need not be equal. */
export function frameAt(durations: readonly number[], seconds: number): number {
  const total = durations.reduce((sum, duration) => sum + duration, 0);
  let tick = (((seconds * 60) % total) + total) % total;
  for (let frame = 0; frame < durations.length; frame++) {
    if (tick < durations[frame]) return frame;
    tick -= durations[frame];
  }
  return 0;
}

/** Advance the feet with distance travelled, preserving PMD's unequal timings. */
export function walkingFrame(
  durations: readonly number[],
  sourcePixels: number,
): number {
  const cycle = durations.reduce((sum, duration) => sum + duration, 0) / 60;
  const distance =
    ((sourcePixels % WALK_STRIDE_PIXELS) + WALK_STRIDE_PIXELS) %
    WALK_STRIDE_PIXELS;
  return frameAt(durations, (distance / WALK_STRIDE_PIXELS) * cycle);
}

export interface WalkState {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  direction: number;
  rest: number;
  moving: boolean;
  age: number;
  aspect?: number;
}

export function createWalk(x: number, y: number): WalkState {
  return {
    x: 0.1 + x * 0.8,
    y: MEADOW_HORIZON + y * (MEADOW_FOREGROUND - MEADOW_HORIZON),
    targetX: 0,
    targetY: 0,
    direction: 0,
    rest: 0,
    moving: false,
    age: 0,
  };
}

/** Choose a real eight-direction leg, with enough room to see it progress. */
function chooseDestination(
  state: WalkState,
  aspect: number,
  worldWidthRatio: number,
  random: () => number,
): void {
  const minimum = Math.min(
    0.06 * worldWidthRatio,
    ((MEADOW_FOREGROUND - MEADOW_HORIZON) * aspect) / 4,
  );
  const headings = WALK_DIRECTIONS.map(([x, y]) => {
    const length = Math.hypot(x, y);
    const dx = x / length;
    const dy = y / length;
    const horizontal = dx ? ((dx > 0 ? 0.9 : 0.1) - state.x) / dx : Infinity;
    const vertical = dy
      ? (((dy > 0 ? MEADOW_FOREGROUND : MEADOW_HORIZON) - state.y) * aspect) /
        dy
      : Infinity;
    return { dx, dy, room: Math.min(horizontal, vertical) };
  }).filter((heading) => heading.room >= minimum);
  // At least one vertical heading always has half the meadow's depth available.
  const heading = headings[Math.floor(random() * headings.length)];
  const distance =
    minimum +
    random() * (Math.min(heading.room, 0.18 * worldWidthRatio) - minimum);
  state.targetX = Math.max(0.1, Math.min(0.9, state.x + heading.dx * distance));
  state.targetY = Math.max(
    MEADOW_HORIZON,
    Math.min(MEADOW_FOREGROUND, state.y + (heading.dy * distance) / aspect),
  );
}

/** All coordinates are stage fractions. Aspect keeps diagonal speed consistent. */
export function advanceWalk(
  state: WalkState,
  dt: number,
  aspect: number,
  random: () => number,
  mode: "walk" | "pause" | "frozen" | "flee",
): boolean {
  if (mode === "frozen") return false;
  state.age += dt;
  if (mode === "pause") {
    state.direction = 0;
    state.moving = false;
    return false;
  }
  if (mode === "flee") {
    const right = state.x >= 0.5;
    state.direction = right ? 2 : 6;
    state.moving = true;
    state.x += (right ? 1 : -1) * dt * 0.16 * perspectiveScale(state.y);
    return state.x < -0.12 || state.x > 1.12;
  }
  if (state.rest > 0) {
    state.rest = Math.max(0, state.rest - dt);
    state.moving = false;
    return false;
  }
  // On portrait screens the landscape is cropped; use its full projected width.
  const worldWidthRatio = Math.max(1, (aspect * 4) / 3);
  // Replan on resize so a diagonal stays diagonal in screen pixels.
  if (state.aspect !== undefined && state.aspect !== aspect)
    state.moving = false;
  state.aspect = aspect;
  if (!state.moving) chooseDestination(state, aspect, worldWidthRatio, random);
  const dx = state.targetX - state.x;
  const dy = (state.targetY - state.y) * aspect;
  const distance = Math.hypot(dx, dy);
  const step = dt * WALK_SPEED * worldWidthRatio * perspectiveScale(state.y);
  if (distance <= step) {
    state.x = state.targetX;
    state.y = state.targetY;
    state.rest = 2 + random() * 5;
    state.moving = false;
  } else {
    state.direction = directionFor(dx, dy);
    state.x += (dx / distance) * step;
    state.y += ((dy / distance) * step) / aspect;
    state.moving = true;
  }
  return false;
}
