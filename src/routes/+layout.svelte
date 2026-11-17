<!-- Modifié pour Poké Calme (2026) : adaptation CP, voir NOTICE.md. -->
<script lang="ts">
  import "./layout.css";
  import { current, initializeLanguage } from "$lib/i18n/index.svelte";
  import { onMount } from "svelte";
  import { asset } from "$app/paths";

  let { children } = $props();

  onMount(initializeLanguage);

  $effect(() => {
    document.documentElement.lang = current().locale;
  });
</script>

<svelte:head>
  <link rel="manifest" href={asset("/manifest.webmanifest")} />
  <link rel="apple-touch-icon" href={asset("/icons/icon-192.png")} />
  <meta name="theme-color" content="#315d4c" />
</svelte:head>

{@render children()}
