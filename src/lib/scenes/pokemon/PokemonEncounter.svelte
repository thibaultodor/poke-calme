<script lang="ts">
  import grass from "./effects/grass-tuft.svg?url";
  import { encounterAt } from "./encounter";
  let {
    age,
    x,
    y,
    scale,
    zIndex,
    reduced = false,
  }: {
    age: number;
    x: number;
    y: number;
    scale: number;
    zIndex: number;
    reduced?: boolean;
  } = $props();
  const appearance = $derived(encounterAt(age));
</script>

<div
  class="pmd-encounter"
  data-encounter-phase={appearance.phase}
  style={`--pmd-x:${x}px;--pmd-y:${y}px;--pmd-depth:${scale};z-index:${zIndex};opacity:${appearance.opacity}`}
  aria-hidden="true"
>
  <svg
    viewBox="-24 -64 48 80"
    style="overflow:visible;image-rendering:pixelated"
  >
    <g
      class="pmd-grass"
      transform={`skewX(${appearance.sway * (reduced ? 0.45 : 1)})`}
    >
      <image href={grass} x="-20" y="-36" width="40" height="40" />
    </g>
    {#if appearance.alert}
      <g class="pmd-alert">
        <path d="M-6-55H6V-53H8V-41H2V-37H0V-41H-8V-53H-6Z" fill="#263b39" />
        <path d="M-5-53H5V-51H6V-43H1V-40H0V-43H-6V-51H-5Z" fill="#fff8d8" />
        <path d="M-1-51H1V-46H-1ZM-1-45H1V-43H-1Z" fill="#c94c45" />
      </g>
    {/if}
  </svg>
</div>
