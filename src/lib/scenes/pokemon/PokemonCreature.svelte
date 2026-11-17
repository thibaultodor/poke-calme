<script lang="ts" module>
  import type { CreatureInstance } from "$lib/session/session.svelte";
  import type { WalkState } from "./walk";
  import type { NapState } from "./nap";
  const positions = new WeakMap<CreatureInstance, WalkState>();
  const naps = new WeakMap<CreatureInstance, NapState>();
  const entrances = new WeakMap<
    CreatureInstance,
    { age: number; x: number; y: number; exitY: number }
  >();
  const playback = new WeakMap<
    CreatureInstance,
    { distance: number; idleAge: number; action: "walk" | "idle" | "sleep" }
  >();
</script>

<script lang="ts">
  import { onMount } from "svelte";
  import { cancelFrame, requestFrame } from "$lib/frames";
  import manifest from "./manifest.json";
  import {
    advanceWalk,
    createWalk,
    frameAt,
    perspectiveScale,
    walkingFrame,
    MEADOW_FOREGROUND,
  } from "./walk";
  import { advanceNap, createNap, startNap } from "./nap";
  import { encounterAt, ENCOUNTER_SECONDS } from "./encounter";
  import PokemonSprite from "./PokemonSprite.svelte";
  import PokemonEncounter from "./PokemonEncounter.svelte";
  import { spriteBox } from "./sprites";

  let {
    creature,
    frozen,
    listening,
    fleeing,
    isNewest,
    sleepRequested = false,
    ongone,
  }: {
    creature: CreatureInstance;
    frozen: boolean;
    listening: boolean;
    fleeing: boolean;
    isNewest: boolean;
    sleepRequested?: boolean;
    ongone: () => void;
  } = $props();

  let element: HTMLDivElement;
  let action = $state<"walk" | "idle" | "sleep">("idle");
  let direction = $state(0);
  let frame = $state(0);
  let spriteReady = $state(false);
  let arrivalAge = $state(ENCOUNTER_SECONDS);
  let arrivalX = $state(0);
  let arrivalY = $state(0);
  let arrivalScale = $state(1);
  let arrivalZ = $state(0);
  let reducedMotion = $state(false);
  const entranceVisual = $derived(encounterAt(arrivalAge));
  function spriteLoaded() {
    spriteReady = true;
  }
  const data = $derived(manifest[creature.def.slug as keyof typeof manifest]);
  const box = $derived(spriteBox(data));
  const width = $derived(box.width);
  const height = $derived(box.height);
  // Also positions the server-rendered preview before its first animation frame.
  const initial = $derived(
    positions.get(creature) ?? createWalk(creature.spawnX, creature.spawnY),
  );

  onMount(() => {
    const stage = element.parentElement!;
    const view = element.ownerDocument.defaultView ?? window;
    const reduced = view.matchMedia("(prefers-reduced-motion: reduce)");
    const state = positions.get(creature) ?? initial;
    positions.set(creature, state);
    const nap = naps.get(creature) ?? createNap(Math.random);
    naps.set(creature, nap);
    const animation = playback.get(creature) ?? {
      distance: 0,
      idleAge: 0,
      action: "idle",
    };
    playback.set(creature, animation);
    let last = performance.now();
    let w = stage.clientWidth;
    let h = stage.clientHeight;
    let pixelUnit = 1.7;
    const resize = new view.ResizeObserver(() => {
      w = stage.clientWidth;
      h = stage.clientHeight;
      pixelUnit =
        parseFloat(view.getComputedStyle(element).width) / width || 1.7;
    });
    resize.observe(stage);
    pixelUnit = parseFloat(view.getComputedStyle(element).width) / width || 1.7;
    let entrance = entrances.get(creature);
    if (!entrance && isNewest && !creature.restored) {
      const exitY = Math.min(
        0.06,
        Math.max(0.025, (10 * pixelUnit * perspectiveScale(state.y)) / h),
      );
      state.y = Math.min(state.y, MEADOW_FOREGROUND - exitY);
      entrance = { age: 0, x: state.x, y: state.y, exitY };
      entrances.set(creature, entrance);
    }
    if (entrance) {
      arrivalX = entrance.x * w;
      arrivalY = entrance.y * h;
      arrivalScale = perspectiveScale(entrance.y);
      arrivalZ = Math.round(entrance.y * 1000) + 1;
      arrivalAge = entrance.age;
    }
    let previewHandled = false;
    let handle = requestFrame(function tick(now) {
      const dt = Math.min(0.08, (now - last) / 1000);
      last = now;
      const mode = fleeing
        ? "flee"
        : frozen
          ? "frozen"
          : listening
            ? "pause"
            : "walk";
      // Reduced motion makes the walk gentler; it must not freeze the feet.
      const speed = reduced.matches ? 0.8 : 1;
      reducedMotion = reduced.matches;
      const previousX = state.x;
      const previousY = state.y;
      const previousScale = perspectiveScale(state.y);
      if (entrance && mode === "flee") entrance.age = ENCOUNTER_SECONDS;
      let asleep = false;
      if (entrance && entrance.age < ENCOUNTER_SECONDS) {
        if (spriteReady && mode === "walk")
          entrance.age = Math.min(ENCOUNTER_SECONDS, entrance.age + dt);
        const visual = encounterAt(entrance.age);
        state.x = entrance.x;
        state.y = entrance.y + entrance.exitY * visual.exit;
        state.direction = 0;
        state.moving = visual.phase === "emerge" && mode !== "pause";
      } else {
        if (sleepRequested && !previewHandled && mode === "walk") {
          startNap(nap, Math.random);
          state.moving = false;
          previewHandled = true;
        }
        if (!sleepRequested) previewHandled = false;
        const wasAsleep = nap.remaining > 0;
        asleep = advanceNap(
          nap,
          dt,
          mode,
          !state.moving && state.rest > 0,
          Math.random,
        );
        if (wasAsleep && !asleep) {
          state.rest = 0;
          state.moving = false;
        }
        if (asleep) state.moving = false;
        else if (
          w &&
          h &&
          advanceWalk(state, dt * speed, h / w, Math.random, mode)
        ) {
          ongone();
          return;
        }
      }
      if (entrance) {
        arrivalAge = entrance.age;
        arrivalX = entrance.x * w;
        arrivalY = entrance.y * h;
        arrivalZ = Math.round(entrance.y * 1000) + 1;
      }
      action = asleep
        ? "sleep"
        : state.moving && (!listening || fleeing)
          ? "walk"
          : "idle";
      direction = asleep && data.sleep.rows === 1 ? 0 : state.direction;
      const scale = perspectiveScale(state.y);
      if (action !== animation.action) animation.idleAge = 0;
      animation.action = action;
      if (action === "walk") {
        const travelled = Math.hypot(
          (state.x - previousX) * w,
          (state.y - previousY) * h,
        );
        animation.distance +=
          travelled / ((pixelUnit * (previousScale + scale)) / 2);
        frame = walkingFrame(data.walk.durations, animation.distance);
      } else if (action === "sleep") {
        frame = frameAt(data.sleep.durations, nap.age);
      } else {
        if (!frozen) animation.idleAge += dt;
        frame = reduced.matches
          ? 0
          : frameAt(data.idle.durations, animation.idleAge);
      }
      element.style.setProperty("--pmd-depth", String(scale));
      element.style.setProperty("--pmd-x", `${state.x * w}px`);
      element.style.setProperty("--pmd-y", `${state.y * h}px`);
      element.style.zIndex = String(Math.round(state.y * 1000));
      handle = requestFrame(tick);
    });
    return () => {
      cancelFrame(handle);
      resize.disconnect();
    };
  });
</script>

{#if arrivalAge < ENCOUNTER_SECONDS}
  <PokemonEncounter
    age={arrivalAge}
    x={arrivalX}
    y={arrivalY}
    scale={arrivalScale}
    zIndex={arrivalZ}
    reduced={reducedMotion}
  />
{/if}

<div
  bind:this={element}
  class="pmd-walker pointer-events-none absolute"
  class:fleeing
  data-pokemon={creature.def.slug}
  data-direction={direction}
  data-action={action}
  data-appearing={arrivalAge < ENCOUNTER_SECONDS}
  style={`width:calc(${width} * var(--pmd-pixel));height:calc(${height} * var(--pmd-pixel));--pmd-depth:${perspectiveScale(initial.y)};--pmd-x:${initial.x * 100}cqw;--pmd-y:${initial.y * 100}cqh;z-index:${Math.round(initial.y * 1000)}`}
>
  <div class="pmd-shadow" style:opacity={entranceVisual.reveal * 0.16}></div>
  <div
    class="pmd-appearance"
    style:opacity={entranceVisual.reveal === 0 ? 0 : 1}
    style:clip-path={`inset(0 0 ${(1 - entranceVisual.reveal) * 100}% 0)`}
  >
    <PokemonSprite
      slug={creature.def.slug}
      {action}
      {direction}
      {frame}
      onready={spriteLoaded}
    />
  </div>
  {#if action === "sleep"}
    <svg class="pmd-snooze" viewBox="0 0 14 18" aria-hidden="true">
      <path
        d="M1 11H7V13L3 16H7V18H1V16L5 13H1ZM7 1H14V3L9 7H14V9H7V7L12 3H7Z"
      />
    </svg>
  {/if}
</div>
