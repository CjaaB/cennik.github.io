const CACHE = "cad-protocol-v3";

const CORE_ASSETS = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "./css/field-book.css",
    "./js/field-book.js",
    "./js/field-book-db.js",
    "./js/protocol-shell.js",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "../assets/logo1.png",
    "../site/js/cad-print.js"
];

async function cacheCoreAssets(cache) {
    await Promise.all(
        CORE_ASSETS.map(async (url) => {
            try {
                await cache.add(url);
            } catch (e) {
                console.warn("[CAD Protocol SW] skip:", url, e);
            }
        })
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(cacheCoreAssets(caches.open(CACHE)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(
                    keys
                        .filter((k) => k.startsWith("cad-protocol") && k !== CACHE)
                        .map((k) => caches.delete(k))
                )
            )
            .then(() => self.clients.claim())
    );
});

function isShellRequest(url) {
    const p = url.pathname || "";
    if (p.includes("/private/")) return true;
    if (p.endsWith(".html") || p.endsWith("/")) return true;
    return /\/(private\/(css|js)|site\/js)\/.+\.(css|js)$/i.test(p);
}

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    if (isShellRequest(url)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE).then((c) => c.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const network = fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE).then((c) => c.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
