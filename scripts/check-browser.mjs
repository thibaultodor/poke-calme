/** End-to-end checks against the compiled app, using a synthetic microphone. */
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";
import { mkdir } from "node:fs/promises";
import { chromium } from "playwright";
import { checkSpriteCrops } from "./check-sprite-crops.mjs";

const port = process.env.POKE_TEST_PORT ?? "4173";
const prefix = process.env.BASE_PATH ?? "";
const origin = `http://127.0.0.1:${port}`;
const url = `${origin}${prefix}/`;
const server = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    port,
    "--strictPort",
  ],
  { stdio: ["ignore", "pipe", "pipe"], windowsHide: true },
);
let log = "";
server.stdout.on("data", (data) => {
  log += data;
});
server.stderr.on("data", (data) => {
  log += data;
});
let browser;
const errors = [];

function watch(page) {
  page.on("pageerror", (error) => errors.push(String(error)));
}
async function screenshot(page, name) {
  const folder = process.env.POKE_SCREENSHOT_DIR;
  if (!folder) return;
  await mkdir(folder, { recursive: true });
  await page.screenshot({ path: `${folder}/${name}.png` });
}

try {
  for (let attempt = 0; attempt < 60; attempt++) {
    if (server.exitCode !== null)
      throw new Error(`Preview server failed: ${log}`);
    try {
      if ((await fetch(url)).ok) break;
    } catch {
      /* Wait for preview startup. */
    }
    if (attempt === 59) throw new Error(`Preview server did not start: ${log}`);
    await delay(200);
  }
  browser = await chromium.launch({
    headless: true,
    ...(process.env.POKE_BROWSER_PATH
      ? { executablePath: process.env.POKE_BROWSER_PATH }
      : {}),
    args: [
      "--use-fake-device-for-media-stream",
      "--use-fake-ui-for-media-stream",
    ],
  });

  const context = await browser.newContext({
    reducedMotion: "reduce",
    viewport: { width: 1440, height: 900 },
    permissions: ["microphone"],
  });
  await context.addInitScript(() => {
    window.__noiseAmplitude = 0;
    window.__denyMic = false;
    window.__micTracks = [];
    // New tabs briefly have an about:blank document without media APIs.
    if (!navigator.mediaDevices?.getUserMedia || !window.AudioContext) return;
    const getUserMedia = navigator.mediaDevices.getUserMedia.bind(
      navigator.mediaDevices,
    );
    navigator.mediaDevices.getUserMedia = async (...args) => {
      if (window.__denyMic)
        throw new DOMException("Permission denied by test", "NotAllowedError");
      const stream = await getUserMedia(...args);
      window.__micTracks.push(...stream.getAudioTracks());
      return stream;
    };
    const original = AudioContext.prototype.createAnalyser;
    AudioContext.prototype.createAnalyser = function () {
      const analyser = original.call(this);
      analyser.getByteTimeDomainData = (samples) => {
        for (let i = 0; i < samples.length; i++)
          samples[i] = 128 + (i % 2 ? 1 : -1) * window.__noiseAmplitude;
      };
      return analyser;
    };
  });

  const page = await context.newPage();
  watch(page);
  const time = new Date("2026-11-17T11:00:00Z");
  await page.clock.install({ time });
  await page.clock.pauseAt(time);
  await page.goto(url);
  await page.locator(".scene-stage").waitFor();
  assert.equal(await page.locator("html").getAttribute("lang"), "fr");
  await screenshot(page, "accueil-poke-calme");

  // A refusal must have a way back, and retrying must actually start the lesson.
  await page.evaluate(() => {
    window.__denyMic = true;
  });
  await page.getByRole("button", { name: "Commencer", exact: true }).click();
  await page
    .getByRole("heading", { name: "Retrouvons le micro de la classe" })
    .waitFor();
  await page
    .getByRole("button", { name: "Revenir à l’accueil", exact: true })
    .click();
  await page.locator(".welcome-card").waitFor();
  await page.evaluate(() => {
    window.__denyMic = false;
  });
  await page.getByRole("button", { name: "Commencer", exact: true }).click();
  await page.locator(".welcome-card").waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
  await page.clock.runFor(23_000);
  assert.ok(
    (await page.locator("[data-pokemon]").count()) > 0,
    "Quiet time must earn a Pokémon",
  );
  console.log("✓ Permission recovery and quiet-time arrival");

  const earned = await page.locator("[data-pokemon]").count();
  await page.evaluate(() => {
    window.__noiseAmplitude = 24;
  });
  await page.clock.runFor(16_000);
  assert.equal(
    await page.locator(".scene-stage").getAttribute("data-murky"),
    "true",
  );
  await page.clock.runFor(16_000);
  assert.equal(await page.locator("[data-pokemon]").count(), earned);
  await page.locator("body").press("Space");
  await page.clock.runFor(200);
  assert.equal(
    await page.locator(".scene-stage").getAttribute("data-murky"),
    "false",
  );
  assert.ok(
    (
      await page
        .locator("[data-pokemon]")
        .evaluateAll((elements) =>
          elements.map((element) => [
            element.dataset.action,
            element.dataset.direction,
          ]),
        )
    ).every(([action, direction]) => action === "idle" && direction === "0"),
  );
  console.log(
    "✓ Sustained noise keeps earned Pokémon; Space pauses and faces the class",
  );

  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  const settings = page.getByRole("dialog", { name: "Réglages", exact: true });
  await settings.waitFor();
  await page.keyboard.press("Tab");
  assert.ok(
    await settings.evaluate((element) =>
      element.contains(element.ownerDocument.activeElement),
    ),
  );
  const [demo] = await Promise.all([
    context.waitForEvent("page"),
    settings
      .getByRole("link", { name: "Ouvrir la démonstration ↗", exact: true })
      .click(),
  ]);
  watch(demo);
  await demo.waitForLoadState("domcontentloaded");
  await demo.locator("[data-pokemon]").first().waitFor();
  assert.equal(await demo.locator("[data-pokemon]").count(), 16);
  assert.equal(
    await demo.locator(".pmd-rare").count(),
    0,
    "Rare Pokémon must not display stars",
  );
  const beforeWalk = await demo
    .locator("[data-pokemon]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().x),
    );
  // Playwright's clock is shared by the pages in this browser context.
  await demo.waitForLoadState("networkidle");
  await page.clock.runFor(600);
  const afterWalk = await demo
    .locator("[data-pokemon]")
    .evaluateAll((elements) =>
      elements.map((element) => element.getBoundingClientRect().x),
    );
  assert.ok(
    beforeWalk.some((x, index) => Math.abs(x - afterWalk[index]) > 0.1),
    "The demonstration must actually walk",
  );
  const perspective = await demo
    .locator("[data-pokemon]")
    .evaluateAll((elements) =>
      elements.map((element) => {
        const box = element.getBoundingClientRect();
        const stage = element.parentElement.getBoundingClientRect();
        const style = getComputedStyle(element);
        const frameWidth = element.querySelector("svg").viewBox.baseVal.width;
        const ground = element.style.getPropertyValue("--pmd-y");
        const y =
          parseFloat(ground) *
          (ground.includes("cqh") ? stage.height / 100 : 1);
        return {
          y,
          scale: new DOMMatrixReadOnly(style.transform).a,
          footError: Math.abs(
            box.top +
              box.height / 2 +
              (5 * box.width) / frameWidth -
              stage.top -
              y,
          ),
        };
      }),
    );
  perspective.sort((a, b) => a.y - b.y);
  assert.ok(
    perspective.at(-1).scale / perspective[0].scale > 1.8,
    "The foreground must be visibly larger",
  );
  for (let index = 1; index < perspective.length; index++)
    assert.ok(
      perspective[index].scale >= perspective[index - 1].scale - 0.001,
      "Size must follow ground position, not a random depth",
    );
  assert.ok(
    perspective.every((pokemon) => pokemon.footError < 1),
    "Perspective must keep feet on their ground position",
  );
  await checkSpriteCrops(demo);
  console.log(
    "✓ No stray pixels in Jigglypuff's four diagonals at fractional scales",
  );
  for (const preference of ["reduce", "no-preference"]) {
    await demo.emulateMedia({ reducedMotion: preference });
    const frames = new Map();
    let previousPositions = new Map();
    let depthSamples = 0;
    for (let sample = 0; sample < 10; sample++) {
      await page.clock.runFor(160);
      const moving = await demo
        .locator('[data-action="walk"]')
        .evaluateAll((elements) =>
          elements.map((element) => ({
            slug: element.dataset.pokemon,
            direction: Number(element.dataset.direction),
            x: parseFloat(element.style.getPropertyValue("--pmd-x")),
            y: parseFloat(element.style.getPropertyValue("--pmd-y")),
            frame: element
              .querySelector('[data-active="true"] image')
              .getAttribute("x"),
          })),
        );
      for (const sprite of moving) {
        if (!frames.has(sprite.slug)) frames.set(sprite.slug, new Set());
        frames.get(sprite.slug).add(sprite.frame);
        const previous = previousPositions.get(sprite.slug);
        if (previous && previous.direction === sprite.direction) {
          const dx = Math.abs(sprite.x - previous.x);
          const dy = Math.abs(sprite.y - previous.y);
          if ([1, 3, 5, 7].includes(sprite.direction)) {
            assert.ok(
              Math.abs(dx - dy) < 0.01,
              `${sprite.slug}'s diagonal pose must follow a real diagonal`,
            );
          } else {
            assert.ok(
              ([0, 4].includes(sprite.direction) ? dx : dy) < 0.01,
              `${sprite.slug}'s straight pose must follow a straight path`,
            );
          }
        }
        if (previous && Math.abs(sprite.y - previous.y) > 0.0001) {
          const allowed = sprite.y > previous.y ? [0, 1, 7] : [3, 4, 5];
          assert.ok(
            allowed.includes(sprite.direction),
            `${sprite.slug} must face its depth travel, even on a shallow diagonal`,
          );
          depthSamples++;
        }
      }
      previousPositions = new Map(
        moving.map((sprite) => [sprite.slug, sprite]),
      );
    }
    assert.ok(
      [...frames.values()].some((seen) => seen.size > 1),
      `The feet must animate with reducedMotion=${preference}`,
    );
    assert.ok(depthSamples > 0, "The demo must exercise travel in depth");
  }
  console.log(
    "✓ Perspective, grounded feet, eight-direction paths and walking frames in both motion preferences; no rare stars",
  );
  await demo.emulateMedia({ reducedMotion: "reduce" });
  await demo
    .getByRole("button", { name: "Une nouvelle rencontre", exact: true })
    .click();
  await page.clock.runFor(32);
  const arrival = demo.locator('[data-appearing="true"]');
  assert.equal(await arrival.count(), 1);
  assert.equal(
    await demo.locator(".pmd-encounter").getAttribute("data-encounter-phase"),
    "rustle",
  );
  assert.equal(
    await arrival
      .locator(".pmd-appearance")
      .evaluate((element) => getComputedStyle(element).opacity),
    "0",
  );
  assert.equal(
    await demo.locator(".pmd-grass image").count(),
    1,
    "One coherent grass tuft",
  );
  const grassMotion = await demo
    .locator(".pmd-grass")
    .getAttribute("transform");
  await page.clock.runFor(640);
  assert.equal(
    await demo.locator(".pmd-encounter").getAttribute("data-encounter-phase"),
    "alert",
  );
  assert.equal(await demo.locator(".pmd-alert").count(), 1);
  assert.notEqual(
    await demo.locator(".pmd-grass").getAttribute("transform"),
    grassMotion,
  );
  await screenshot(demo, "rencontre-alerte");
  await page.clock.runFor(640);
  assert.equal(
    await demo.locator(".pmd-encounter").getAttribute("data-encounter-phase"),
    "emerge",
  );
  assert.equal(await arrival.getAttribute("data-action"), "walk");
  const emergingY = await arrival.evaluate((element) =>
    parseFloat(element.style.getPropertyValue("--pmd-y")),
  );
  await screenshot(demo, "rencontre-sortie");
  await page.clock.runFor(800);
  assert.ok(
    (await arrival.evaluate((element) =>
      parseFloat(element.style.getPropertyValue("--pmd-y")),
    )) > emergingY,
    "The Pokémon must really walk out of its grass patch",
  );
  await page.clock.runFor(1600);
  assert.equal(await demo.locator(".pmd-encounter").count(), 0);
  assert.equal(await demo.locator('[data-appearing="true"]').count(), 0);
  console.log(
    "✓ Grass rustle, Pokémon-style alert, progressive reveal and real exit",
  );

  // The demo request uses the same sleep state and renderer as a natural nap.
  for (let pokemon = 0; pokemon < 16; pokemon++) {
    await demo
      .getByRole("button", { name: "Voir une sieste", exact: true })
      .click();
    await page.clock.runFor(32);
  }
  const sleepers = demo.locator('[data-action="sleep"]');
  assert.equal(await sleepers.count(), 16);
  const sleepingPositions = await sleepers.evaluateAll((elements) =>
    elements.map((element) => [
      element.style.getPropertyValue("--pmd-x"),
      element.style.getPropertyValue("--pmd-y"),
    ]),
  );
  const sleepFrames = new Map();
  await demo.emulateMedia({ reducedMotion: "reduce" });
  for (let sample = 0; sample < 10; sample++) {
    await page.clock.runFor(160);
    for (const sprite of await sleepers.evaluateAll((elements) =>
      elements.map((element) => {
        const sheet = element.querySelector('[data-active="true"]');
        const image = sheet.querySelector("image");
        return {
          slug: element.dataset.pokemon,
          pose: sheet.dataset.pose,
          row: sheet.dataset.row,
          y: image.getAttribute("y"),
          frame: image.getAttribute("x"),
          sheetHeight: image.height.baseVal.value,
          cellHeight: sheet.height.baseVal.value,
        };
      }),
    )) {
      assert.equal(sprite.pose, "sleep");
      assert.equal(
        sprite.row,
        "0",
        "A single-row sleep sheet must never use a walking direction",
      );
      assert.equal(Number(sprite.y), 0);
      assert.equal(sprite.sheetHeight, sprite.cellHeight);
      if (!sleepFrames.has(sprite.slug))
        sleepFrames.set(sprite.slug, new Set());
      sleepFrames.get(sprite.slug).add(sprite.frame);
    }
  }
  assert.ok(
    [...sleepFrames.values()].every((frames) => frames.size > 1),
    "All 16 Pokémon must breathe using their own sleep frames",
  );
  await screenshot(demo, "siestes-pokemon");
  // Less than 30 seconds since the earliest request, including the above samples.
  await page.clock.runFor(26_000);
  assert.equal(
    await sleepers.count(),
    16,
    "Naps must last at least 30 seconds",
  );
  assert.deepEqual(
    await sleepers.evaluateAll((elements) =>
      elements.map((element) => [
        element.style.getPropertyValue("--pmd-x"),
        element.style.getPropertyValue("--pmd-y"),
      ]),
    ),
    sleepingPositions,
    "Sleeping Pokémon must stay on the ground without drifting",
  );
  await page.clock.runFor(95_000);
  assert.equal(
    await sleepers.count(),
    0,
    "Every nap must finish within two minutes",
  );
  await demo
    .getByRole("button", { name: "Voir une sieste", exact: true })
    .click();
  await page.clock.runFor(32);
  assert.equal(await sleepers.count(), 1);
  await demo
    .getByRole("button", { name: "Pause, on écoute", exact: true })
    .click();
  await page.clock.runFor(32);
  assert.equal(
    await sleepers.count(),
    0,
    "A teacher pause must wake sleepers to face the class",
  );
  assert.ok(
    await demo
      .locator("[data-pokemon]")
      .evaluateAll((elements) =>
        elements.every(
          (element) =>
            element.dataset.action === "idle" &&
            element.dataset.direction === "0",
        ),
      ),
  );
  console.log(
    "✓ All 16 sleep sheets, correct row and breathing, no drift, 30–120 second naps and teacher wake-up",
  );
  await demo.setViewportSize({ width: 390, height: 844 });
  await screenshot(demo, "demo-mobile");
  for (const label of [
    "Une nouvelle rencontre",
    "Voir une sieste",
    "Reprendre la promenade",
  ]) {
    const box = await demo
      .getByRole("button", { name: label, exact: true })
      .boundingBox();
    assert.ok(
      box && box.x >= 0 && box.x + box.width <= 390 && box.y + box.height < 844,
      "Demo controls must fit on mobile",
    );
  }
  await demo.setViewportSize({ width: 1440, height: 900 });
  assert.equal(
    await page.locator("[data-pokemon]").count(),
    earned,
    "The demo must not populate the real class",
  );
  await screenshot(demo, "clairiere-poke-calme");
  await demo.close();
  await page.keyboard.press("Escape");
  await settings.waitFor({ state: "hidden" });
  assert.equal(
    await page.evaluate(() => document.activeElement?.textContent.trim()),
    "Réglages",
  );
  console.log(
    "✓ Settings keyboard focus, Escape and independent demonstration",
  );

  await page.mouse.move(20, 20);
  await page.getByRole("button", { name: "Pokémon", exact: true }).click();
  const collection = page.getByRole("dialog", {
    name: "Nos rencontres Pokémon",
  });
  await collection.waitFor();
  assert.match(await collection.innerText(), /Bulbizarre/);
  await screenshot(page, "collection-poke-calme");
  await page.keyboard.press("Escape");
  await collection.waitFor({ state: "hidden" });

  // An unplugged microphone cannot quietly turn into a stream of earned silence.
  await page.evaluate(() => {
    const track = window.__micTracks.at(-1);
    track.stop();
    track.dispatchEvent(new Event("ended"));
  });
  await page
    .getByRole("heading", { name: "Retrouvons le micro de la classe" })
    .waitFor();
  await page.clock.runFor(150_000);
  assert.equal(await page.locator("[data-pokemon]").count(), earned);
  await page.evaluate(() => {
    window.__noiseAmplitude = 0;
  });
  await page.getByRole("button", { name: "Réessayer", exact: true }).click();
  await page
    .getByRole("heading", { name: "Retrouvons le micro de la classe" })
    .waitFor({ state: "hidden" });
  await page.getByRole("button", { name: "Pause", exact: true }).waitFor();
  await page.getByRole("button", { name: "Réglages", exact: true }).click();
  await page
    .getByRole("button", {
      name: "Couper le micro et revenir à l’accueil",
      exact: true,
    })
    .click();
  await page.locator(".welcome-card").waitFor();
  assert.ok(
    await page.evaluate(() =>
      window.__micTracks.every((track) => track.readyState === "ended"),
    ),
  );
  assert.equal(await page.locator("[data-pokemon]").count(), earned);
  console.log(
    "✓ Unplug/retry and complete microphone shutdown preserve the class",
  );

  await page.reload();
  await page.locator(".scene-stage").waitFor();
  assert.equal(await page.locator("[data-pokemon]").count(), earned);
  await page.setViewportSize({ width: 390, height: 844 });
  await screenshot(page, "accueil-mobile-poke-calme");
  const start = await page
    .getByRole("button", { name: "Reprendre avec ma classe", exact: true })
    .boundingBox();
  assert.ok(
    start &&
      start.x >= 0 &&
      start.x + start.width <= 390 &&
      start.y + start.height < 844,
  );
  console.log("✓ Persistence and mobile welcome screen");
  await context.close();

  // Separate browser state proves the installed, compiled site works offline.
  const offline = await browser.newContext({
    viewport: { width: 1280, height: 800 },
  });
  const offlinePage = await offline.newPage();
  watch(offlinePage);
  await offlinePage.goto(url);
  await offlinePage.evaluate(async () => {
    await caches.open("unrelated-application-cache");
    await navigator.serviceWorker.ready;
  });
  await offlinePage.waitForFunction(() =>
    Boolean(navigator.serviceWorker.controller),
  );
  const scope = await offlinePage.evaluate(
    async () => (await navigator.serviceWorker.ready).scope,
  );
  assert.equal(scope, url);
  assert.ok(
    await offlinePage.evaluate(async () =>
      (await caches.keys()).includes("unrelated-application-cache"),
    ),
  );
  await offline.setOffline(true);
  await offlinePage.reload();
  await offlinePage.locator(".scene-stage").waitFor();
  await offlinePage.goto(`${url}demo/`);
  await offlinePage.locator("[data-pokemon]").first().waitFor();
  assert.equal(await offlinePage.locator("[data-pokemon]").count(), 16);
  await offlinePage
    .getByRole("button", { name: "Voir une sieste", exact: true })
    .click();
  await offlinePage.locator('[data-action="sleep"]').first().waitFor();
  await offlinePage
    .getByRole("button", { name: "Une nouvelle rencontre", exact: true })
    .click();
  await offlinePage
    .locator(".pmd-grass image")
    .first()
    .waitFor({ state: "attached" });
  await offlinePage
    .getByRole("button", { name: "Pause, on écoute", exact: true })
    .click();
  await offlinePage.waitForFunction(() =>
    [...document.querySelectorAll("[data-pokemon]")].every(
      (element) => element.dataset.action === "idle",
    ),
  );
  await offlinePage.goto(`${url}privacy/`);
  await offlinePage
    .getByRole("heading", { name: "Le son reste dans la classe" })
    .waitFor();
  console.log(
    `✓ Offline reload, sprites, navigation and cache isolation under ${prefix || "/"}`,
  );
  assert.deepEqual(errors, [], "No browser JavaScript errors");
  await offline.close();
} finally {
  await browser?.close();
  server.kill();
}
