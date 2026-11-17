<script lang="ts" module>
  const poses = ["idle", "walk", "sleep"] as const;
  const decoded: Record<string, Promise<void> | undefined> = {};

  function prepare(url: string): Promise<void> {
    let pending = decoded[url];
    if (!pending) {
      const image = new Image();
      image.src = url;
      pending = image.decode().catch((error) => {
        delete decoded[url];
        throw error;
      });
      decoded[url] = pending;
    }
    return pending;
  }
</script>

<script lang="ts">
  import manifest from "./manifest.json";
  import { atlasCell, spriteBox } from "./sprites";

  const files = import.meta.glob("./atlases/*.png", {
    query: "?url",
    import: "default",
    eager: true,
  }) as Record<string, string>;

  let {
    slug,
    action = "idle",
    direction = 0,
    frame = 0,
    onready,
  }: {
    slug: string;
    action?: "idle" | "walk" | "sleep";
    direction?: number;
    frame?: number;
    onready?: () => void;
  } = $props();

  const data = $derived(manifest[slug as keyof typeof manifest]);
  // A shared box keeps a change between Idle and Walk from resizing the Pokémon.
  const box = $derived(spriteBox(data));
  let ready = $state(false);
  const displayed = $derived(ready ? action : "idle");

  $effect(() => {
    let mounted = true;
    ready = false;
    // Decoding both sheets up front avoids an empty first walking frame too.
    const finish = () => {
      if (mounted) {
        ready = true;
        onready?.();
      }
    };
    void Promise.all(
      poses.map((pose) => prepare(files[`./atlases/${data[pose].file}`])),
    ).then(finish, finish);
    return () => {
      mounted = false;
    };
  });
</script>

<svg
  class="pmd-sprite"
  viewBox={`${-box.width / 2} ${-box.height / 2} ${box.width} ${box.height}`}
  aria-hidden="true"
  style="overflow:hidden;image-rendering:pixelated;display:block;width:100%;height:100%"
>
  <!-- Each decoded sheet keeps its own image element and immutable geometry.
       Replacing one image's href and dimensions can paint the previous texture
       with the new sheet's crop for one frame. Switching opacity avoids that race. -->
  {#each poses as pose (`${slug}:${pose}`)}
    {@const anim = data[pose]}
    {@const cell = atlasCell(anim)}
    {@const active = displayed === pose}
    {@const row = anim.rows === 1 ? 0 : direction}
    <svg
      data-pose={pose}
      data-active={active}
      data-row={row}
      x={-cell.width / 2}
      y={-cell.height / 2}
      width={cell.width}
      height={cell.height}
      viewBox={`0 0 ${cell.width} ${cell.height}`}
      opacity={active ? 1 : 0}
      style="overflow:hidden"
    >
      <image
        href={files[`./atlases/${anim.file}`]}
        x={-((active ? frame : 0) % anim.durations.length) * cell.width}
        y={-row * cell.height}
        width={cell.width * anim.durations.length}
        height={cell.height * anim.rows}
        style="image-rendering:pixelated"
      />
    </svg>
  {/each}
</svg>
