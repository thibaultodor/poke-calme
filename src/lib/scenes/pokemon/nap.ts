export const MIN_NAP_SECONDS = 30;
export const MAX_NAP_SECONDS = 120;

export interface NapState {
  awakeFor: number;
  remaining: number;
  age: number;
}

export function createNap(random: () => number): NapState {
  return { awakeFor: 180 + random() * 420, remaining: 0, age: 0 };
}

export function startNap(state: NapState, random: () => number): void {
  state.remaining =
    MIN_NAP_SECONDS + random() * (MAX_NAP_SECONDS - MIN_NAP_SECONDS);
  state.age = 0;
}

export function advanceNap(
  state: NapState,
  dt: number,
  mode: "walk" | "pause" | "frozen" | "flee",
  resting: boolean,
  random: () => number,
): boolean {
  if (mode === "frozen") return state.remaining > 0;
  // A teacher's explicit pause and optional departure wake the Pokémon.
  if (mode === "pause" || mode === "flee") {
    if (state.remaining > 0) {
      state.remaining = 0;
      state.age = 0;
      state.awakeFor = 300 + random() * 600;
    }
    return false;
  }
  if (state.remaining > 0) {
    state.age += Math.min(dt, state.remaining);
    state.remaining = Math.max(0, state.remaining - dt);
    if (state.remaining === 0) state.awakeFor = 300 + random() * 600;
    return state.remaining > 0;
  }
  state.awakeFor = Math.max(0, state.awakeFor - dt);
  if (state.awakeFor === 0 && resting) {
    startNap(state, random);
    return true;
  }
  return false;
}
