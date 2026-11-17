/** Compare the actual SVG renderer to isolated native frames at fractional scales. */
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PNG } from "pngjs";

export async function checkSpriteCrops(page) {
  const source = await readFile(
    new URL("../src/lib/scenes/pokemon/assets/0039-Walk.png", import.meta.url),
  );
  await page.evaluate(async (base64) => {
    const original = document.querySelector(
      '[data-pokemon="pmd-jigglypuff"] .pmd-sprite',
    );
    const overlay = document.createElement("div");
    overlay.id = "sprite-crop-fixture";
    overlay.style.cssText =
      "position:fixed;inset:0;z-index:9999;background:rgb(238,241,233)";
    document.body.append(overlay);
    const svg = original.cloneNode(true);
    for (const pose of svg.querySelectorAll("[data-pose]"))
      pose.setAttribute("opacity", pose.dataset.pose === "walk" ? "1" : "0");
    const box = svg.viewBox.baseVal;
    const cell = svg.querySelector('[data-pose="walk"]');
    const expected = new Image();
    expected.style.cssText =
      "display:block;width:100%;height:100%;image-rendering:pixelated";
    const containers = [200.371, 600.371].map((x) => {
      const container = document.createElement("div");
      container.style.cssText = `position:absolute;left:0;top:0;width:${box.width}px;height:${box.height}px;transform-origin:50% ${box.height / 2 + 5}px;--cx:${x}px`;
      overlay.append(container);
      return container;
    });
    containers[0].append(svg);
    containers[1].append(expected);
    const sheet = new Image();
    sheet.src = `data:image/png;base64,${base64}`;
    await sheet.decode();
    window.__spriteCropFixture = {
      svg,
      sheet,
      expected,
      containers,
      width: box.width,
      height: box.height,
      cellWidth: cell.width.baseVal.value,
      cellHeight: cell.height.baseVal.value,
    };
  }, source.toString("base64"));
  try {
    for (const direction of [1, 3, 5, 7])
      for (let frame = 0; frame < 5; frame++)
        for (const scale of [2.31, 7.03]) {
          await page.evaluate(
            async ({ direction, frame, scale }) => {
              const fixture = window.__spriteCropFixture;
              const {
                svg,
                sheet,
                expected,
                containers,
                width,
                height,
                cellWidth,
                cellHeight,
              } = fixture;
              const image = svg.querySelector('[data-pose="walk"] image');
              image.setAttribute("x", String(-frame * cellWidth));
              image.setAttribute("y", String(-direction * cellHeight));
              for (const box of containers)
                box.style.transform = `translate3d(var(--cx),350.413px,0) translate(-50%,calc(-50% - 5px)) scale(${scale})`;
              const canvas = document.createElement("canvas");
              canvas.width = width;
              canvas.height = height;
              canvas
                .getContext("2d")
                .drawImage(
                  sheet,
                  frame * 32,
                  direction * 40,
                  32,
                  40,
                  (width - 32) / 2,
                  (height - 40) / 2,
                  32,
                  40,
                );
              expected.src = canvas.toDataURL();
              await expected.decode();
            },
            { direction, frame, scale },
          );
          const png = PNG.sync.read(
            await page.screenshot({
              clip: { x: 0, y: 0, width: 800, height: 700 },
            }),
          );
          const background = [238, 241, 233];
          const nonempty = (x, y) => {
            const offset = (y * png.width + x) * 4;
            return (
              background.reduce(
                (sum, value, channel) =>
                  sum + Math.abs(png.data[offset + channel] - value),
                0,
              ) > 40
            );
          };
          let extra = 0;
          for (let y = 100; y < 600; y++)
            for (let x = 50; x < 350; x++) {
              if (!nonempty(x, y)) continue;
              let expected = false;
              // Allow a one-screen-pixel difference in the two rasterizers' edges.
              for (let dy = -1; dy <= 1 && !expected; dy++)
                for (let dx = -1; dx <= 1; dx++)
                  if (nonempty(x + 400 + dx, y + dy)) {
                    expected = true;
                    break;
                  }
              if (!expected) extra++;
            }
          assert.equal(
            extra,
            0,
            `No stray pixels: Jigglypuff direction=${direction}, frame=${frame}, scale=${scale}`,
          );
        }
  } finally {
    await page.evaluate(() => {
      document.getElementById("sprite-crop-fixture")?.remove();
      delete window.__spriteCropFixture;
    });
  }
}
