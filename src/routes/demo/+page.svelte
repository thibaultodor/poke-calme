<script lang="ts">
  import { resolve } from "$app/paths";
  import Scene from "$lib/components/Scene.svelte";
  import { SCENES } from "$lib/scenes";
  import { POKEMON_ROSTER } from "$lib/scenes/pokemon/catalog";
  import type { CreatureInstance } from "$lib/session/session.svelte";
  let paused = $state(false);
  let newestId = $state<number | null>(null);
  let sleepingId = $state<number | null>(null);
  let nextId = 17;
  let creatures = $state<CreatureInstance[]>(
    POKEMON_ROSTER.map((def, index) => ({
      id: index + 1,
      def,
      depth: (index % 4) / 4,
      spawnX: ((index * 7) % 16) / 16,
      spawnY: ((index * 5) % 16) / 16,
      restored: true,
    })),
  );
  function newEncounter() {
    const def = POKEMON_ROSTER.find(
      (pokemon) => pokemon.slug === "pmd-pikachu",
    )!;
    const creature = {
      id: nextId++,
      def,
      depth: 0.5,
      spawnX: 0.5,
      spawnY: 0.5,
    };
    creatures = [...creatures.filter((pokemon) => pokemon.id <= 16), creature];
    newestId = creature.id;
    paused = false;
  }
  function showNap() {
    sleepingId = ((sleepingId ?? 0) % 16) + 1;
    paused = false;
  }
</script>

<svelte:head
  ><title>La clairière — Poké Calme</title><meta
    name="robots"
    content="noindex"
  /></svelte:head
>

<main class="fixed inset-0 overflow-hidden">
  <Scene
    scene={SCENES.pokemon}
    {creatures}
    {newestId}
    {sleepingId}
    murky={false}
    frozen={false}
    listening={paused}
    scares={false}
    fleeing={[]}
    ondepart={() => {}}
  />
  <div
    class="pointer-events-none absolute inset-x-0 top-0 z-40 flex flex-wrap items-start justify-between gap-3 p-5 sm:p-8"
  >
    <div
      class="rounded-2xl bg-white/85 px-5 py-4 text-slate-800 shadow-sm backdrop-blur-sm"
    >
      <p
        class="text-xs font-semibold tracking-[0.2em] text-emerald-800 uppercase"
      >
        Une petite pause dans le bruit
      </p>
      <h1 class="mt-1 text-3xl font-semibold tracking-tight">Poké Calme</h1>
      <p class="mt-1 text-sm">Le calme fait venir de belles rencontres.</p>
    </div>
    <a
      class="pointer-events-auto rounded-full bg-slate-800 px-5 py-3 text-sm font-medium text-white shadow-sm"
      href={resolve("/")}>Ouvrir pour la classe →</a
    >
  </div>
  <div
    class="absolute inset-x-0 bottom-5 z-40 flex flex-wrap items-center justify-center gap-3 px-4"
  >
    <span class="rounded-full bg-white/90 px-4 py-2 text-sm text-slate-700"
      >Aperçu · le micro est coupé</span
    >
    <button
      type="button"
      class="rounded-full bg-white/90 px-3 py-2 text-xs font-medium text-slate-800 sm:px-4 sm:text-sm"
      onclick={newEncounter}>Une nouvelle rencontre</button
    >
    <button
      type="button"
      class="rounded-full bg-white/90 px-3 py-2 text-xs font-medium text-slate-800 sm:px-4 sm:text-sm"
      onclick={showNap}>Voir une sieste</button
    >
    <button
      type="button"
      class="rounded-full bg-slate-800 px-5 py-2 text-sm font-medium text-white"
      onclick={() => (paused = !paused)}
      >{paused ? "Reprendre la promenade" : "Pause, on écoute"}</button
    >
  </div>
</main>
