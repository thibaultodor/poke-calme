import { describe, expect, it } from "bun:test";
import { advanceNap, createNap, startNap } from "./nap";
import { encounterAt, ENCOUNTER_SECONDS } from "./encounter";

describe("rare naps", () => {
  it("does not fall asleep immediately or in the middle of a walk", () => {
    const nap = createNap(() => 0);
    expect(advanceNap(nap, 179, "walk", true, () => 0)).toBe(false);
    expect(advanceNap(nap, 1, "walk", false, () => 0)).toBe(false);
    expect(advanceNap(nap, 60, "walk", false, () => 0)).toBe(false);
    expect(advanceNap(nap, 0.01, "walk", true, () => 0)).toBe(true);
  });
  it.each([0, 0.5, 1])(
    "holds a nap between 30 and 120 seconds (draw %s)",
    (draw) => {
      const nap = createNap(() => 0);
      startNap(nap, () => draw);
      const duration = nap.remaining;
      expect(duration).toBeGreaterThanOrEqual(30);
      expect(duration).toBeLessThanOrEqual(120);
      expect(advanceNap(nap, 29, "walk", true, () => 0)).toBe(true);
      expect(advanceNap(nap, duration - 29, "walk", true, () => 0)).toBe(false);
      expect(nap.remaining).toBe(0);
      expect(nap.age).toBe(duration);
      expect(nap.awakeFor).toBeGreaterThanOrEqual(300);
      expect(advanceNap(nap, 1, "walk", true, () => 0)).toBe(false);
    },
  );
  it("freezes the sleep timer and breathing animation during noise", () => {
    const nap = createNap(() => 0);
    startNap(nap, () => 0.5);
    const before = { ...nap };
    expect(advanceNap(nap, 400, "frozen", true, () => 0)).toBe(true);
    expect(nap).toEqual(before);
  });
  it("does not count paused time towards a new nap", () => {
    const nap = createNap(() => 0);
    const before = { ...nap };
    advanceNap(nap, 400, "pause", true, () => 0);
    expect(nap).toEqual(before);
  });
  it.each(["pause", "flee"] as const)("wakes up for %s", (mode) => {
    const nap = createNap(() => 0);
    startNap(nap, () => 0.5);
    expect(advanceNap(nap, 0.1, mode, true, () => 0.5)).toBe(false);
    expect(nap.remaining).toBe(0);
    expect(nap.awakeFor).toBe(600);
  });
  it("spreads the first naps and later naps over several minutes", () => {
    expect(createNap(() => 0).awakeFor).toBe(180);
    expect(createNap(() => 1).awakeFor).toBe(600);
    const nap = createNap(() => 0);
    startNap(nap, () => 0);
    advanceNap(nap, 30, "walk", true, () => 1);
    expect(nap.awakeFor).toBe(900);
  });
});

describe("a wild encounter", () => {
  it("rustles, shows an alert, reveals the Pokémon then clears the grass", () => {
    expect(
      [0, 0.6, 1.3, 2.9, ENCOUNTER_SECONDS].map(
        (age) => encounterAt(age).phase,
      ),
    ).toEqual(["rustle", "alert", "emerge", "settle", "done"]);
    expect(encounterAt(0.6).alert).toBe(true);
    expect(encounterAt(0.6).reveal).toBe(0);
    expect(encounterAt(1.3).reveal).toBeGreaterThan(0);
    expect(encounterAt(1.3).exit).toBeGreaterThan(0);
    expect(encounterAt(2.6).exit).toBe(1);
    expect(encounterAt(ENCOUNTER_SECONDS).opacity).toBe(0);
  });
  it("keeps the single tuft's sway gentle throughout the encounter", () => {
    for (let frame = 0; frame < 500; frame++) {
      const visual = encounterAt(frame / 60);
      expect(Math.abs(visual.sway)).toBeLessThanOrEqual(3.5);
      expect(visual.reveal).toBeGreaterThanOrEqual(0);
      expect(visual.reveal).toBeLessThanOrEqual(1);
    }
  });
});
