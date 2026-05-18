const CACHE_NAME = "cad-static-v83";
const ASSETS = [
    "./",
    "./index.html",
    "./style.css",
    "./script.js",
    "./config.js",
    "./app.js",
    "./fun.js",
    "./kontakt-car-all-detailing.vcf",
    "./logo1.png",
    "./tlo.jpg",
    "./protokol-wzor.pdf",
    "./regulamin.pdf",
    "./logos/adbl.png",
    "./logos/fxprotect.png",
    "./logos/cleantle.png",
    "./logos/fresso.png",
    "./logos/goodstuff.png",
    "./logos/kiurlab.png",
    "./logos/swag.png",
    "./logos/workstuff.png",
    "./logos/monstershine.png"
];

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches.keys().then((keys) =>
            Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
        ).then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;

    event.respondWith(
        caches.match(event.request).then((cached) => {
            const network = fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});
