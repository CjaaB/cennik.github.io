(function () {
    "use strict";

    const DB_NAME = "cad_field_book_v1";
    const DB_VERSION = 1;
    const STORE = "protocols";
    let dbPromise = null;

    function openDb() {
        if (dbPromise) return dbPromise;
        dbPromise = new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onupgradeneeded = () => {
                const db = req.result;
                if (!db.objectStoreNames.contains(STORE)) {
                    const store = db.createObjectStore(STORE, { keyPath: "id" });
                    store.createIndex("updatedAt", "updatedAt");
                }
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
        return dbPromise;
    }

    async function listProtocols() {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readonly");
            const store = tx.objectStore(STORE);
            const req = store.getAll();
            req.onsuccess = () => {
                const items = (req.result || []).sort((a, b) => (b.updatedAt || "").localeCompare(a.updatedAt || ""));
                resolve(items);
            };
            req.onerror = () => reject(req.error);
        });
    }

    async function getProtocol(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readonly");
            const req = tx.objectStore(STORE).get(id);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => reject(req.error);
        });
    }

    async function saveProtocol(record) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).put(record);
            tx.oncomplete = () => resolve(record);
            tx.onerror = () => reject(tx.error);
        });
    }

    async function deleteProtocol(id) {
        const db = await openDb();
        return new Promise((resolve, reject) => {
            const tx = db.transaction(STORE, "readwrite");
            tx.objectStore(STORE).delete(id);
            tx.oncomplete = () => resolve(true);
            tx.onerror = () => reject(tx.error);
        });
    }

    window.CAD_FieldBookDb = {
        listProtocols,
        getProtocol,
        saveProtocol,
        deleteProtocol
    };
})();
