const CACHE_NAME = "cad-static-v99";
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
    "./app/index.html",
    "./app/quote.html",
    "./app/admin.html",
    "./app/manifest.json",
    "./app/sw.js",
    "./app/css/app.css",
    "./app/css/quote.css",
    "./app/css/admin.css",
    "./app/js/firebase-config.js",
    "./app/js/i18n.js",
    "./app/js/app-home.js",
    "./app/js/app-shell.js",
    "./app/js/chat-client.js",
    "./app/js/chat-admin.js",
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
