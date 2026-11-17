<script lang="ts">
  import { onMount } from "svelte";
  import { dev } from "$app/environment";
  import { t } from "$lib/i18n/index.svelte";
  let ready = $state(false);
  let waiting = $state<ServiceWorker | null>(null);
  let updating = $state(false);

  onMount(() => {
    if (dev || !("serviceWorker" in navigator)) return;
    let disposed = false;
    let cleanup = () => {};
    void navigator.serviceWorker.ready
      .then((registration) => {
        if (disposed) return;
        ready = true;
        waiting = registration.waiting;
        let worker: ServiceWorker | null = null;
        const changed = () => {
          if (
            worker?.state === "installed" &&
            navigator.serviceWorker.controller
          )
            waiting = registration.waiting;
        };
        const found = () => {
          worker?.removeEventListener("statechange", changed);
          worker = registration.installing;
          worker?.addEventListener("statechange", changed);
        };
        registration.addEventListener("updatefound", found);
        cleanup = () => {
          registration.removeEventListener("updatefound", found);
          worker?.removeEventListener("statechange", changed);
        };
      })
      .catch(() => {});
    return () => {
      disposed = true;
      cleanup();
    };
  });

  function update() {
    if (!waiting || updating) return;
    updating = true;
    navigator.serviceWorker.addEventListener(
      "controllerchange",
      () => location.reload(),
      { once: true },
    );
    waiting.postMessage({ type: "ACTIVATE_UPDATE" });
  }
</script>

{#if ready}
  <p
    class="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-emerald-800"
    role="status"
  >
    <span>✓ {t("offline.ready")}</span>
    {#if waiting}
      <button
        type="button"
        class="font-semibold underline underline-offset-4 disabled:opacity-50"
        disabled={updating}
        onclick={update}>{t("offline.update")}</button
      >
    {/if}
  </p>
{/if}
