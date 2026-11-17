export const ENCOUNTER_SECONDS = 3.4;
const clamp = (value: number) => Math.max(0, Math.min(1, value));

export function encounterAt(age: number) {
  return {
    phase:
      age < 0.55
        ? "rustle"
        : age < 1.15
          ? "alert"
          : age < 2.6
            ? "emerge"
            : age < ENCOUNTER_SECONDS
              ? "settle"
              : "done",
    alert: age >= 0.55 && age < 1.55,
    reveal: clamp((age - 1.05) / 0.5),
    exit: clamp((age - 1.15) / 1.45),
    opacity: clamp((ENCOUNTER_SECONDS - age) / 0.6),
    sway: Math.sin(Math.max(0, age) * 7) * 3.5 * (age < 1.55 ? 1 : 0.45),
  };
}
