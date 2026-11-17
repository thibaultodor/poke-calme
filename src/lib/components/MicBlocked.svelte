<!-- Modifié pour Poké Calme (2026) : reprise accessible du micro, voir NOTICE.md. -->
<script lang="ts">
  /**
   * The microphone is the tool. When it is unavailable the app says so and
   * stops — it never quietly runs on a timer instead, because a Scene filling
   * up beautifully while the room is in chaos would cost the teacher all
   * confidence in it.
   */

  import { t, tIn } from "$lib/i18n/index.svelte";
  import type { App } from "$lib/app.svelte";
  import { settings } from "$lib/settings/settings.svelte";
  import { resolve } from "$app/paths";
  import { modal } from "$lib/ui/modal";

  let { app }: { app: App } = $props();

  const message = $derived(
    {
      denied: t("blocked.denied"),
      missing: t("blocked.missing"),
      unsupported: t("blocked.unsupported"),
      interrupted: t("blocked.interrupted"),
    }[
      app.microphone.status as
        "denied" | "missing" | "unsupported" | "interrupted"
    ] ?? "",
  );
</script>

<div
  class="safe-edges absolute inset-0 z-50 grid place-items-center overflow-y-auto bg-slate-900/70"
>
  <div
    class="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl"
    use:modal={() => app.disconnect()}
    role="dialog"
    aria-modal="true"
    aria-labelledby="mic-blocked-title"
    tabindex="-1"
  >
    <h1 id="mic-blocked-title" class="text-xl font-semibold text-slate-900">
      {tIn(app.scene.id, "blocked.title")}
    </h1>
    <p class="mt-3 text-slate-700">{message}</p>

    {#if app.microphone.status !== "unsupported"}
      <label class="mt-5 block text-sm font-medium text-slate-700">
        {t("settings.microphone")}
        <select
          class="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 font-normal"
          value={settings.deviceId}
          onchange={(event) => app.selectDevice(event.currentTarget.value)}
        >
          <option value="">{t("mic.default")}</option>
          {#each app.microphone.devices.filter((device) => device.deviceId) as device, index (device.deviceId)}
            <option value={device.deviceId}>
              {device.label || t("mic.numbered", { number: index + 1 })}
            </option>
          {/each}
        </select>
      </label>

      <button
        class="mt-5 rounded-md bg-slate-900 px-4 py-2 font-medium text-white"
        onclick={() => app.begin()}
      >
        {t("blocked.tryAgain")}
      </button>
    {/if}
    <div class="mt-5 flex flex-wrap gap-4 text-sm">
      <button
        type="button"
        class="font-semibold text-slate-600 underline underline-offset-4"
        onclick={() => app.disconnect()}>{t("blocked.back")}</button
      >
      <a
        class="font-semibold text-emerald-800 underline underline-offset-4"
        href={resolve("/demo/")}>{t("demo.withoutMic")}</a
      >
    </div>
  </div>
</div>
