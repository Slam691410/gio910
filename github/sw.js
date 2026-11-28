const SW_VER = "gio910-v47";
self.addEventListener("install", (event) => {
  self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const u = event.request.url || "";
  const noStore = /\.(js|css|html|webmanifest)(\?|$)/i.test(u) || u.endsWith("/");
  event.respondWith(
    fetch(noStore ? new Request(event.request, { cache: "no-store" }) : event.request).catch(() =>
      caches.match(event.request)
    )
  );
});
