const ADMIN_CACHE = "cad-admin-v10";

const CORE_ASSETS = [
    "./",
    "./index.html",
    "./manifest.webmanifest",
    "../css/admin.css",
    "../js/cad-data.js",
    "../js/admin-panel.js",
    "../js/chat-admin.js",
    "../js/firebase-config.js",
    "../icons/icon-192.png",
    "../icons/icon-512.png",
    "../icons/apple-touch-icon.png"
];

async function cacheCore(cache) {
    await Promise.all(
        CORE_ASSETS.map(async (url) => {
            try {
                await cache.add(url);
            } catch (e) {
                console.warn("[CAD Admin SW] skip:", url, e);
            }
        })
    );
}

self.addEventListener("install", (event) => {
    event.waitUntil(caches.open(ADMIN_CACHE).then((c) => cacheCore(c)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
    event.waitUntil(
        caches
            .keys()
            .then((keys) =>
                Promise.all(keys.filter((k) => k !== ADMIN_CACHE && k.startsWith("cad-admin")).map((k) => caches.delete(k)))
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
                        caches.open(ADMIN_CACHE).then((c) => c.put(event.request, copy));
                    }
                    return response;
                })
                .catch(() => cached);
            return cached || network;
        })
    );
});

self.addEventListener("push", (event) => {
    let data = { title: "CAD Admin", body: "Nowa wiadomość" };
    try {
        if (event.data) data = event.data.json();
    } catch (e) {
        data.body = event.data?.text() || data.body;
    }
    const target = data.url || "./index.html";
    event.waitUntil(
        self.registration.showNotification(data.title || "CAD Admin", {
            body: data.body,
            icon: "../icons/icon-192.png",
            badge: "../icons/icon-192.png",
            tag: data.tag || "cad-admin-chat",
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
                if ((client.url || "").includes("/admin") && "focus" in client) {
                    return client.focus();
                }
            }
            if (clients.openWindow) return clients.openWindow(target);
        })
    );
});
