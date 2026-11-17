/// <reference lib="webworker" />
import { build, files, prerendered, version } from "$service-worker";

const sw = self as unknown as ServiceWorkerGlobalScope;
const root = new URL(sw.registration.scope);
// Other applications can share a github.io origin. Only manage our own scope.
const prefix = `poke-calme:${encodeURIComponent(root.pathname)}:`;
const name = `${prefix}${version}`;
const assets = [...new Set([...build, ...files, ...prerendered])];
const paths = new Set(
  assets.map((path) => new URL(path, sw.location.origin).pathname),
);

sw.addEventListener("install", (event) => {
  event.waitUntil(caches.open(name).then((cache) => cache.addAll(assets)));
});

sw.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const key of await caches.keys())
        if (key.startsWith(prefix) && key !== name) await caches.delete(key);
      await sw.clients.claim();
    })(),
  );
});

sw.addEventListener("message", (event) => {
  if (event.data?.type === "ACTIVATE_UPDATE") void sw.skipWaiting();
});

sw.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== root.origin ||
    !url.pathname.startsWith(root.pathname) ||
    !paths.has(url.pathname)
  )
    return;
  event.respondWith(
    (async () => {
      const cache = await caches.open(name);
      // Keep HTML and its chunks from the same release, even during a lesson.
      const saved = await cache.match(url.pathname);
      if (saved) return saved;
      try {
        const response = await fetch(request);
        if (response.ok) await cache.put(url.pathname, response.clone());
        return response;
      } catch {
        return new Response(
          "Cette page n’est pas encore disponible hors connexion.",
          {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          },
        );
      }
    })(),
  );
});
