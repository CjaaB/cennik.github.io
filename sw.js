const CACHE_NAME = "cad-static-v163";
const ASSETS = [
    "./",
    "./index.html",
    "./config.js",
    "./site/css/style.css",
    "./site/css/refined.css",
    "./site/css/weather-modal.css",
    "./site/css/cad-icons.css",
    "./site/js/vendor/lucide.min.js",
    "./site/js/vendor/jspdf.umd.min.js",
    "./site/js/cad-icons.js",
    "./site/js/cad-print.js",
    "./site/js/cad-documents.js",
    "./site/js/cad-pdf.js",
    "./site/js/script.js",
    "./site/js/refined.js",
    "./site/js/lang-switch.js",
    "./site/js/app.js",
    "./site/js/fun.js",
    "./assets/kontakt-car-all-detailing.vcf",
    "./assets/logo1.png",
    "./assets/tlo.jpg",
    "./assets/gallery/manifest.json",
    "./assets/gallery/01.jpg",
    "./assets/gallery/02.jpg",
    "./assets/gallery/03.jpg",
    "./assets/gallery/04.jpg",
    "./assets/gallery/05.jpg",
    "./assets/gallery/06.jpg",
    "./assets/gallery/07.jpg",
    "./assets/location-maarssen.jpg",
    "./assets/protokol-wzor.pdf",
    "./assets/regulamin.pdf",
    "./site/css/cad-documents.css",
    "./site/js/vendor/html2canvas.min.js",
    "./site/documents/regulamin.html",
    "./site/documents/protokol-wzor.html",
    "./app/index.html",
    "./app/quote.html",
    "./app/admin.html",
    "./app/manifest.json",
    "./app/sw.js",
    "./app/css/app.css",
    "./app/css/app-premium.css",
    "./app/css/quote.css",
    "./app/css/admin.css",
    "./app/css/admin-premium.css",
    "./app/js/cad-version.js",
    "./app/js/firebase-config.js",
    "./app/js/i18n.js",
    "./app/js/app-home.js",
    "./app/js/app-shell.js",
    "./app/js/app-quote.js",
    "./app/js/app-weather.js",
    "./app/js/chat-client.js",
    "./app/js/cad-chat-media.js",
    "./app/js/cad-data.js",
    "./app/js/cad-currency.js",
    "./assets/logos/adbl.png",
    "./assets/logos/fxprotect.png",
    "./assets/logos/cleantle.png",
    "./assets/logos/fresso.png",
    "./assets/logos/goodstuff.png",
    "./assets/logos/kiurlab.png",
    "./assets/logos/swag.png",
    "./assets/logos/workstuff.png",
    "./assets/logos/monstershine.png"
];

function isAdminPath(pathname) {
    return /\/admin(\/|$)/.test(pathname || "");
}

async function cacheAssets(cache) {
    await Promise.all(
        ASSETS.map(async (url) => {
            try {
                await cache.add(url);
            } catch (e) {
                console.warn("[CAD SW] skip cache:", url, e);
            }
        })
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(CACHE_NAME).then((cache) => cacheAssets(cache)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (isAdminPath(url.pathname)) return;

    event.respondWith(
        fetch(event.request)
            .then((response) => {
                if (response && response.status === 200) {
                    const copy = response.clone();
                    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
                }
                return response;
            })
            .catch(() => caches.match(event.request))
    );
});
