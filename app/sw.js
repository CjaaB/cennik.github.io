const APP_CACHE = "cad-app-v77";

const CORE_ASSETS = [
    "./",
    "./index.html",
    "./manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/apple-touch-icon.png",
    "./css/app.css",
    "./css/app-premium.css",
    "./js/firebase-config.js",
    "./js/i18n.js",
    "./js/cad-currency.js",
    "./js/app-home.js",
    "../site/js/lang-switch.js",
    "./js/app-shell.js",
    "./js/chat-client.js",
    "./js/cad-version.js",
    "./js/cad-chat-media.js",
    "../assets/logo1.png",
    "../assets/tlo-app.jpg",
    "../config.js",
    "./js/app-weather.js",
    "./js/app-quote.js",
    "./js/app-gallery.js",
    "../site/js/vendor/lucide.min.js",
    "../site/js/cad-icons.js",
    "../site/js/cad-print.js",
    "../site/js/cad-documents.js",
    "../site/js/cad-pdf.js",
    "../assets/gallery/manifest.json",
    "../assets/location-maarssen.jpg",
    "./js/cad-data.js"
];

function isAdminPath(pathname) {
    return /\/admin(\/|$)/.test(pathname || "");
}

function isAppShellRequest(url) {
    const p = url.pathname || "";
    if (p.endsWith(".html") || p.endsWith("/")) return true;
    if (/\/app\/js\/.+\.js$/i.test(p)) return true;
    if (/\/app\/css\/.+\.css$/i.test(p)) return true;
    if (p.endsWith("/config.js")) return true;
    return false;
}

async function cacheCoreAssets(cache) {
    await Promise.all(
        CORE_ASSETS.map(async (url) => {
            try {
                await cache.add(url);
            } catch (e) {
                console.warn("[CAD SW] skip cache:", url, e);
            }
        })
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(
        caches.open(APP_CACHE).then((cache) => cacheCoreAssets(cache)).then(() => self.skipWaiting())
    );
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== APP_CACHE && k.startsWith("cad-app")).map((k) => caches.delete(k)))
            )
            .then(() => self.clients.claim())
    );
});

self.addEventListener("fetch", (event) => {
    if (event.request.method !== "GET") return;
    const url = new URL(event.request.url);
    if (url.origin !== self.location.origin) return;
    if (isAdminPath(url.pathname)) return;

    if (isAppShellRequest(url)) {
        event.respondWith(
            fetch(event.request)
                .then((response) => {
                    if (response && response.status === 200) {
                        const copy = response.clone();
                        caches.open(APP_CACHE).then((c) => c.put(event.request, copy));
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
                        caches.open(APP_CACHE).then((c) => c.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});

self.addEventListener("push", (event) => {
    let data = { title: "Car All Detailing", body: "Nowa wiadomość" };
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        data.body = event.data?.text() || data.body;
    }
    const target = data.url || (data.role === "client" ? "./index.html#chat" : "./admin/index.html");
    event.waitUntil(
        self.registration.showNotification(data.title || "Car All Detailing", {
            body: data.body,
            icon: "./icons/icon-192.png",
            badge: "./icons/icon-192.png",
            tag: data.tag || "cad-chat",
            renotify: true,
            data: { url: target }
        })
    );
});

self.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const raw = event.notification.data?.url || "./index.html";
    const wantsAdmin = String(raw).includes("admin");
    const targetUrl = wantsAdmin ? "./admin/index.html" : "./index.html#chat";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                const url = client.url || "";
                if (wantsAdmin && url.includes("/admin") && "focus" in client) {
                    return client.focus();
                }
            }
            for (const client of list) {
                if (!wantsAdmin && urlIncludesClientApp(client.url) && "focus" in client) {
                    client.postMessage({ type: "cad:open-panel", panel: "chat" });
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(targetUrl);
        })
    );
});

function urlIncludesClientApp(url) {
    return url && !url.includes("/admin") && (url.includes("index.html") || /\/app\/?(\?|#|$)/.test(url));
}
