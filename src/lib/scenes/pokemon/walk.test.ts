import { describe, expect, it } from "bun:test";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import {
  advanceWalk,
  createWalk,
  directionFor,
  frameAt,
  perspectiveScale,
  walkingFrame,
  WALK_STRIDE_PIXELS,
  MEADOW_HORIZON,
  MEADOW_FOREGROUND,
} from "./walk";
import { POKEMON } from "./catalog";
import manifest from "./manifest.json";

describe("PMD animation playback", () => {
  it("selects the eight sheet rows, including both diagonals", () => {
    const vectors = [
      [0, 1],
      [1, 1],
      [1, 0],
      [1, -1],
      [0, -1],
      [-1, -1],
      [-1, 0],
      [-1, 1],
    ];
    expect(vectors.map(([x, y]) => directionFor(x, y))).toEqual([
      0, 1, 2, 3, 4, 5, 6, 7,
    ]);
  });
  it.each([
    [1, 0.01, 1],
    [-1, 0.01, 7],
    [1, -0.01, 3],
    [-1, -0.01, 5],
  ])("shows depth on a shallow diagonal (%s, %s)", (dx, dy, expected) => {
    expect(directionFor(dx, dy)).toBe(expected);
  });
  it("honours unequal frame durations and wraps exactly at the cycle boundary", () => {
    expect(
      [0, 7, 8, 17, 18, 25, 26, 35, 36].map((ticks) =>
        frameAt([8, 10, 8, 10], ticks / 60),
      ),
    ).toEqual([0, 0, 1, 1, 2, 2, 3, 3, 0]);
  });
  it("advances all walking frames with travel, and loops after one stride", () => {
    const durations = [8, 10, 8, 10];
    const frames = Array.from({ length: 80 }, (_, index) =>
      walkingFrame(durations, (index * WALK_STRIDE_PIXELS) / 80),
    );
    expect(new Set(frames)).toEqual(new Set([0, 1, 2, 3]));
    expect(walkingFrame(durations, WALK_STRIDE_PIXELS)).toBe(0);
    expect(walkingFrame(durations, WALK_STRIDE_PIXELS * 100)).toBe(0);
  });
  it("has valid local sheets, actual row counts and original credits for the whole roster", () => {
    expect(Object.keys(manifest)).toHaveLength(POKEMON.length);
    for (const pokemon of POKEMON) {
      const data = manifest[pokemon.slug as keyof typeof manifest];
      for (const anim of [data.idle, data.walk, data.sleep]) {
        const png = readFileSync(
          join(import.meta.dirname, "assets", anim.file),
        );
        expect(png.toString("hex", 0, 8)).toBe("89504e470d0a1a0a");
        expect(png.readUInt32BE(16)).toBe(anim.width * anim.durations.length);
        expect([1, 8]).toContain(anim.rows);
        expect(png.readUInt32BE(20)).toBe(anim.height * anim.rows);
        expect(anim.durations.every((duration) => duration > 0)).toBe(true);
      }
      expect(data.idle.rows).toBe(8);
      expect(data.walk.rows).toBe(8);
      expect(
        existsSync(
          join(
            import.meta.dirname,
            "../../../../static/credits/pmd",
            `${String(pokemon.id).padStart(4, "0")}-credits.txt`,
          ),
        ),
      ).toBe(true);
    }
  });
});

describe("the quiet meadow", () => {
  it("keeps the current size at the horizon and grows towards the foreground", () => {
    expect(perspectiveScale(MEADOW_HORIZON)).toBe(1);
    expect(perspectiveScale(MEADOW_FOREGROUND)).toBeCloseTo(2.8);
    expect(perspectiveScale(-1)).toBe(1);
    expect(perspectiveScale(2)).toBeCloseTo(2.8);
    let previous = perspectiveScale(MEADOW_HORIZON);
    for (let y = MEADOW_HORIZON + 0.01; y <= MEADOW_FOREGROUND; y += 0.01) {
      expect(perspectiveScale(y)).toBeGreaterThan(previous);
      previous = perspectiveScale(y);
    }
  });
  it("does not move or age a frozen Pokémon", () => {
    const state = createWalk(0.3, 0.4);
    const before = { ...state };
    advanceWalk(state, 10, 0.5625, Math.random, "frozen");
    expect(state).toEqual(before);
  });
  it("faces the class during a teacher pause without moving", () => {
    const state = createWalk(0.3, 0.4);
    const [x, y] = [state.x, state.y];
    state.direction = 6;
    advanceWalk(state, 3, 0.5625, Math.random, "pause");
    expect([state.x, state.y, state.direction, state.moving]).toEqual([
      x,
      y,
      0,
      false,
    ]);
  });
  it.each([0.4, 0.75, 1.8])(
    "chooses visible legs aligned with the eight poses at aspect ratio %s",
    (aspect) => {
      let seed = 42;
      const random = () =>
        (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
      const seen = new Set<number>();
      for (let trial = 0; trial < 128; trial++) {
        const state = createWalk(random(), random());
        const before = { ...state };
        advanceWalk(state, 0.05, aspect, random, "walk");
        const dx = state.targetX - before.x;
        const dy = (state.targetY - before.y) * aspect;
        expect(state.moving).toBe(true);
        expect(Math.hypot(dx, dy)).toBeGreaterThan(
          0.02 * Math.max(1, (aspect * 4) / 3),
        );
        // A diagonal pose must move just as much vertically as horizontally.
        expect(
          Math.abs(dx) < 1e-12 ||
            Math.abs(dy) < 1e-12 ||
            Math.abs(Math.abs(dx) - Math.abs(dy)) < 1e-12,
        ).toBe(true);
        seen.add(state.direction);
      }
      expect(seen.size).toBe(8);
    },
  );
  it.each([0.4, 0.75, 1.8])(
    "walks equally fast forwards, backwards and sideways at aspect ratio %s",
    (aspect) => {
      const distances = [];
      for (const [dx, dy] of [
        [0, 1],
        [1, 1],
        [1, 0],
        [1, -1],
        [0, -1],
        [-1, -1],
        [-1, 0],
        [-1, 1],
      ]) {
        const state = createWalk(0.5, 0.5);
        const before = { ...state };
        state.moving = true;
        state.targetX = state.x + dx * 0.05;
        state.targetY = state.y + (dy * 0.05) / aspect;
        advanceWalk(state, 0.05, aspect, Math.random, "walk");
        distances.push(
          Math.hypot(state.x - before.x, (state.y - before.y) * aspect),
        );
      }
      expect(Math.min(...distances)).toBeGreaterThan(0);
      expect(Math.max(...distances) - Math.min(...distances)).toBeLessThan(
        1e-12,
      );
    },
  );
  it("keeps a real diagonal after resizing from landscape to portrait", () => {
    const state = createWalk(0.5, 0.5);
    advanceWalk(state, 0.05, 0.4, () => 0.2, "walk");
    const before = { ...state };
    advanceWalk(state, 0.05, 1.8, () => 0.2, "walk");
    expect(state.direction).toBe(1);
    expect(state.targetX - before.x).toBeCloseTo(
      (state.targetY - before.y) * 1.8,
      12,
    );
  });
  it.each([0.4, 0.75, 1.8])(
    "keeps feet inside the meadow at aspect ratio %s",
    (aspect) => {
      const state = createWalk(0.5, 0.5);
      let seed = 42;
      const random = () =>
        (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;
      for (let tick = 0; tick < 20000; tick++) {
        advanceWalk(state, 0.05, aspect, random, "walk");
        expect(state.x).toBeGreaterThanOrEqual(0.1);
        expect(state.x).toBeLessThanOrEqual(0.9);
        expect(state.y).toBeGreaterThanOrEqual(0.59);
        expect(state.y).toBeLessThanOrEqual(0.88);
      }
    },
  );
  it("keeps the same screen speed when walking diagonally", () => {
    const state = createWalk(0.5, 0.5);
    state.moving = true;
    state.targetX = 0.85;
    state.targetY = 0.85;
    const before = { ...state };
    const horizontal = { ...state, targetY: state.y };
    advanceWalk(state, 0.05, 0.5625, Math.random, "walk");
    advanceWalk(horizontal, 0.05, 0.5625, Math.random, "walk");
    expect(
      Math.hypot(state.x - before.x, (state.y - before.y) * 0.5625),
    ).toBeCloseTo(Math.abs(horizontal.x - before.x), 10);
  });
  it.each([0.4, 0.75, 1.8])(
    "faces the direction of depth travel at aspect ratio %s",
    (aspect) => {
      for (const horizontal of [-1, 1]) {
        for (const depth of [-1, 1]) {
          const state = createWalk(0.5, 0.5);
          const before = { ...state };
          state.moving = true;
          state.targetX = state.x + horizontal * 0.3;
          state.targetY = state.y + depth * 0.01;
          advanceWalk(state, 0.05, aspect, Math.random, "walk");
          expect(Math.sign(state.x - before.x)).toBe(horizontal);
          expect(Math.sign(state.y - before.y)).toBe(depth);
          expect(state.direction).toBe(
            depth > 0 ? (horizontal > 0 ? 1 : 7) : horizontal > 0 ? 3 : 5,
          );
        }
      }
    },
  );
  it("projects the same stride into faster screen movement in the foreground", () => {
    const far = {
      ...createWalk(0.3, 0),
      targetX: 0.8,
      targetY: MEADOW_HORIZON,
      moving: true,
    };
    const near = { ...far, y: MEADOW_FOREGROUND, targetY: MEADOW_FOREGROUND };
    const x = far.x;
    advanceWalk(far, 0.05, 0.5625, Math.random, "walk");
    advanceWalk(near, 0.05, 0.5625, Math.random, "walk");
    expect(near.x - x).toBeGreaterThan(far.x - x);
    expect((near.x - x) / perspectiveScale(near.y)).toBeCloseTo(
      (far.x - x) / perspectiveScale(far.y),
      10,
    );
  });
  it("completes an optional departure beyond the nearer edge", () => {
    const state = createWalk(0.8, 0.5);
    let gone = false;
    for (let tick = 0; tick < 200 && !gone; tick++)
      gone = advanceWalk(state, 0.05, 0.5625, Math.random, "flee");
    expect(gone).toBe(true);
    expect(state.x).toBeGreaterThan(1);
  });
});
