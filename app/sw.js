const APP_CACHE = "cad-app-v22";

const CORE_ASSETS = [
    "./",
    "./index.html",
    "./admin.html",
    "./manifest.json",
    "./admin-manifest.json",
    "./icons/icon-192.png",
    "./icons/icon-512.png",
    "./icons/apple-touch-icon.png",
    "./css/app.css",
    "./css/quote.css",
    "./css/admin.css",
    "./js/firebase-config.js",
    "./js/i18n.js",
    "./js/app-home.js",
    "./js/app-shell.js",
    "./js/chat-client.js",
    "./js/chat-admin.js",
    "../logo1.png"
];

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
    const target = data.url || (data.role === "client" ? "./index.html#chat" : "./admin.html");
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
    const target = event.notification.data?.url || "./index.html";
    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((list) => {
            for (const client of list) {
                if ("focus" in client) return client.focus();
            }
            if (clients.openWindow) return clients.openWindow(target);
        })
    );
});
