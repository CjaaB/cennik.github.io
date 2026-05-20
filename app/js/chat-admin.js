(function () {
    let db = null;
    let auth = null;
    let messaging = null;
    let activeConvId = null;
    let activeConvData = null;
    let msgUnsub = null;
    let convUnsub = null;
    let lastNotifiedAt = 0;
    let listTab = "active";
    let allConvDocs = [];
    let deferredInstallPrompt = null;
    let toastTimer = null;
    let swReady = null;

    function cfg() {
        return window.CAD_FIREBASE || {};
    }

    function ready() {
        const c = cfg();
        return c.enabled && c.projectId && c.apiKey;
    }

    function $(id) {
        return document.getElementById(id);
    }

    function toast(message, isError) {
        const el = $("admin-toast");
        if (!el) return;
        el.textContent = message;
        el.classList.toggle("admin-toast--error", !!isError);
        el.hidden = false;
        clearTimeout(toastTimer);
        toastTimer = window.setTimeout(() => {
            el.hidden = true;
        }, isError ? 5000 : 2800);
    }

    function formatTime(ts) {
        if (!ts) return "";
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            hour: "2-digit",
            minute: "2-digit"
        });
    }

    function langLabel(code) {
        const map = { pl: "PL", nl: "NL", en: "EN" };
        return map[code] || "";
    }

    function isArchived(data) {
        return data && data.archived === true;
    }

    function isDeleted(data) {
        return data && data.deleted === true;
    }

    function isIos() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }

    function isStandaloneMode() {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true
        );
    }

    function visibleConversations() {
        return allConvDocs.filter((d) => {
            if (isDeleted(d.data())) return false;
            const archived = isArchived(d.data());
            return listTab === "archive" ? archived : !archived;
        });
    }

    /* ——— PWA / ikona ——— */

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        const btn = $("admin-install-pwa-btn");
        if (btn) btn.disabled = false;
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        toast("Ikona CAD Admin dodana na ekran.");
        hideAdminInstallSheet();
        updateInstallButtonState();
    });

    async function ensureServiceWorker() {
        if (!("serviceWorker" in navigator)) return null;
        try {
            swReady = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            await navigator.serviceWorker.ready;
            return swReady;
        } catch (e) {
            console.warn("[CAD Admin] SW", e);
            return null;
        }
    }

    function updateInstallButtonState() {
        const btn = $("install-admin-btn");
        if (!btn) return;
        if (isStandaloneMode()) {
            btn.hidden = true;
            return;
        }
        btn.hidden = false;
        btn.title = isIos()
            ? "Dodaj ikonę (Safari → Udostępnij)"
            : deferredInstallPrompt
              ? "Dodaj ikonę na ekran"
              : "Dodaj ikonę (Chrome → menu ⋮)";
    }

    function setInstallStatus(text) {
        const el = $("admin-install-status");
        if (el) el.textContent = text || "";
    }

    function showAdminInstallSheet() {
        if (isStandaloneMode()) {
            toast("Panel jest już na ekranie głównym.");
            return;
        }
        const sheet = $("admin-install-sheet");
        if (!sheet) return;
        $("admin-install-android").hidden = isIos();
        $("admin-install-ios").hidden = !isIos();
        sheet.hidden = false;

        if (isIos()) {
            setInstallStatus("Użyj Safari, nie Instagrama.");
            return;
        }
        if (deferredInstallPrompt) {
            setInstallStatus("Kliknij przycisk poniżej.");
            $("admin-install-pwa-btn").disabled = false;
        } else {
            setInstallStatus("Chrome: menu (⋮) → Zainstaluj aplikację / Dodaj do ekranu głównego.");
            $("admin-install-pwa-btn").disabled = true;
        }
    }

    function hideAdminInstallSheet() {
        const sheet = $("admin-install-sheet");
        if (sheet) sheet.hidden = true;
    }

    async function triggerAdminPwaInstall() {
        if (isIos()) return;
        if (!deferredInstallPrompt) {
            setInstallStatus("Otwórz w Chrome i odśwież stronę, potem spróbuj ponownie.");
            return;
        }
        try {
            await deferredInstallPrompt.prompt();
            const choice = await deferredInstallPrompt.userChoice;
            if (choice.outcome === "accepted") {
                hideAdminInstallSheet();
            }
        } catch (e) {
            console.warn(e);
        }
        deferredInstallPrompt = null;
        updateInstallButtonState();
    }

    function setupAdminInstall() {
        $("install-admin-btn")?.addEventListener("click", showAdminInstallSheet);
        $("admin-install-pwa-btn")?.addEventListener("click", triggerAdminPwaInstall);
        document.querySelectorAll("[data-admin-install-dismiss]").forEach((el) => {
            el.addEventListener("click", hideAdminInstallSheet);
        });
        updateInstallButtonState();
    }

    /* ——— Firebase ——— */

    async function initFirebase() {
        if (!ready() || typeof firebase === "undefined") return false;
        const c = cfg();
        if (!firebase.apps.length) {
            firebase.initializeApp({
                apiKey: c.apiKey,
                authDomain: c.authDomain,
                projectId: c.projectId,
                storageBucket: c.storageBucket,
                messagingSenderId: c.messagingSenderId,
                appId: c.appId
            });
        }
        auth = firebase.auth();
        db = firebase.firestore();
        if (c.vapidKey && firebase.messaging.isSupported()) {
            messaging = firebase.messaging();
            messaging.onMessage((payload) => {
                const title = payload.notification?.title || "Nowa wiadomość";
                const body = payload.notification?.body || "";
                if (Notification.permission === "granted") {
                    new Notification(title, { body, icon: "./icons/icon-192.png", tag: "cad-admin-fcm" });
                } else {
                    toast(`${title}: ${body}`);
                }
            });
        }
        return true;
    }

    async function login(email, password) {
        await auth.signInWithEmailAndPassword(email, password);
    }

    async function logout() {
        await auth.signOut();
    }

    function showLogin(show) {
        $("admin-login").hidden = !show;
        $("admin-app").hidden = show;
        $("admin-top-actions").hidden = show;
    }

    /* ——— Rozmowy ——— */

    function updateThreadHeader() {
        const header = $("admin-thread-header");
        if (!header || !activeConvId || !activeConvData) {
            if (header) header.hidden = true;
            return;
        }
        header.hidden = false;
        $("admin-thread-title").textContent = activeConvData.clientName || "Klient";
        const lang = langLabel(activeConvData.clientLang);
        const langEl = $("admin-thread-lang");
        if (langEl) langEl.textContent = lang ? `Język: ${lang}` : "";
        const archiveBtn = $("archive-btn");
        if (archiveBtn) {
            archiveBtn.textContent = isArchived(activeConvData) ? "Przywróć" : "Archiwizuj";
        }
    }

    function renderConvList() {
        const list = $("conv-list");
        if (!list) return;
        const filtered = visibleConversations();
        if (!filtered.length) {
            list.innerHTML = `<p class="conv-empty">${listTab === "archive" ? "Brak w archiwum." : "Brak rozmów."}</p>`;
            return;
        }
        list.innerHTML = filtered
            .map((d) => {
                const data = d.data();
                const active = d.id === activeConvId ? " active" : "";
                const unread = data.unreadAdmin && !isArchived(data) ? '<span class="badge">NOWA</span>' : "";
                const preview = (data.lastMessage || "—").slice(0, 70);
                const name = data.clientName || "Klient";
                const when = formatTime(data.lastMessageAt);
                return `<button type="button" class="conv-item${active}" data-id="${d.id}">
                    <strong>${escapeHtml(name)}</strong>
                    <small>${escapeHtml(preview)}</small>
                    ${when ? `<time>${escapeHtml(when)}</time>` : ""}
                    ${unread}
                </button>`;
            })
            .join("");
        list.querySelectorAll(".conv-item").forEach((btn) => {
            btn.addEventListener("click", () => openConversation(btn.dataset.id));
        });
    }

    function escapeHtml(str) {
        return String(str)
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;");
    }

    function renderMessages(messages) {
        const box = $("admin-messages");
        if (!box) return;
        if (!messages.length) {
            box.innerHTML = '<p class="admin-empty-hint">Brak wiadomości.</p>';
            return;
        }
        box.innerHTML = messages
            .map((m) => {
                const when = formatTime(m.createdAt);
                return `<div class="chat-bubble chat-bubble--${m.sender === "admin" ? "admin" : "client"}">
                ${escapeHtml(m.text)}
                ${when ? `<time>${escapeHtml(when)}</time>` : ""}
            </div>`;
            })
            .join("");
        box.scrollTop = box.scrollHeight;
    }

    async function openConversation(convId) {
        const doc = allConvDocs.find((d) => d.id === convId);
        if (!doc || isDeleted(doc.data())) return;

        activeConvId = convId;
        activeConvData = doc.data();
        updateThreadHeader();
        if (msgUnsub) msgUnsub();

        document.querySelectorAll(".conv-item").forEach((el) => {
            el.classList.toggle("active", el.dataset.id === convId);
        });

        $("admin-messages").innerHTML = '<p class="admin-empty-hint">Ładowanie…</p>';

        try {
            await db.collection("conversations").doc(convId).update({ unreadAdmin: false });
        } catch (e) {
            /* ignore */
        }

        msgUnsub = db
            .collection("conversations")
            .doc(convId)
            .collection("messages")
            .orderBy("createdAt", "asc")
            .onSnapshot((snap) => {
                renderMessages(snap.docs.map((d) => d.data()));
            });
    }

    function closeActiveThread() {
        activeConvId = null;
        activeConvData = null;
        if (msgUnsub) {
            msgUnsub();
            msgUnsub = null;
        }
        updateThreadHeader();
        $("admin-messages").innerHTML = '<p class="admin-empty-hint">Wybierz rozmowę z listy.</p>';
    }

    async function toggleArchive() {
        if (!activeConvId) return;
        const next = !isArchived(activeConvData);
        await db.collection("conversations").doc(activeConvId).update({
            archived: next,
            unreadAdmin: false
        });
        toast(next ? "Przeniesiono do archiwum." : "Przywrócono do aktywnych.");
        if (next) closeActiveThread();
    }

    async function purgeMessages(convRef) {
        const chunkSize = 400;
        while (true) {
            const snap = await convRef.collection("messages").limit(chunkSize).get();
            if (snap.empty) break;
            const batch = db.batch();
            snap.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            if (snap.size < chunkSize) break;
        }
    }

    async function hardDeleteConversation(convId) {
        const convRef = db.collection("conversations").doc(convId);
        await purgeMessages(convRef);
        await convRef.delete();
    }

    async function deleteConversation() {
        if (!activeConvId || !db) return;
        const convId = activeConvId;
        const name = activeConvData?.clientName || "Klient";

        if (!window.confirm(`Usunąć rozmowę „${name}”?\nNie będzie widoczna na liście.`)) return;

        const deleteBtn = $("delete-conv-btn");
        if (deleteBtn) deleteBtn.disabled = true;

        try {
            await db.collection("conversations").doc(convId).update({
                deleted: true,
                archived: true,
                unreadAdmin: false,
                deletedAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            closeActiveThread();
            toast("Rozmowa usunięta.");

            hardDeleteConversation(convId).catch((e) => {
                console.warn("[CAD Admin] hard delete", e);
                if (e?.code === "permission-denied") {
                    toast("Ukryto na liście. Pełne skasowanie: wklej reguły z app/firestore.rules w Firebase.", true);
                }
            });
        } catch (e) {
            console.warn(e);
            toast(
                e?.code === "permission-denied"
                    ? "Brak uprawnień. Firebase → Firestore → Rules → wklej app/firestore.rules → Publish."
                    : "Nie udało się usunąć. Spróbuj ponownie.",
                true
            );
        } finally {
            if (deleteBtn) deleteBtn.disabled = false;
        }
    }

    function listenConversations() {
        if (convUnsub) convUnsub();
        convUnsub = db
            .collection("conversations")
            .orderBy("lastMessageAt", "desc")
            .limit(100)
            .onSnapshot((snap) => {
                allConvDocs = snap.docs;
                renderConvList();

                snap.docChanges().forEach((change) => {
                    if (change.type === "removed" && change.doc.id === activeConvId) {
                        closeActiveThread();
                    }
                    if (change.type !== "added" && change.type !== "modified") return;
                    const data = change.doc.data();
                    if (isDeleted(data) || isArchived(data)) return;
                    if (data.unreadAdmin && change.doc.id !== activeConvId) {
                        notifyNewMessage(data.clientName, data.lastMessage);
                    }
                });

                if (activeConvId) {
                    const doc = allConvDocs.find((d) => d.id === activeConvId);
                    if (!doc || isDeleted(doc.data())) {
                        closeActiveThread();
                    } else {
                        activeConvData = doc.data();
                        updateThreadHeader();
                    }
                }
            });
    }

    function notifyNewMessage(name, text) {
        const now = Date.now();
        if (now - lastNotifiedAt < 4000) return;
        lastNotifiedAt = now;
        const title = `Nowa wiadomość: ${name || "Klient"}`;
        const body = (text || "").slice(0, 120);
        if (Notification.permission === "granted") {
            new Notification(title, { body, icon: "./icons/icon-192.png", tag: "cad-admin-chat" });
        }
    }

    function updateNotifyButton() {
        const btn = $("notify-btn");
        if (!btn) return;
        btn.classList.remove("is-on", "is-blocked");
        if (!("Notification" in window) || location.protocol === "file:") {
            btn.title = "Powiadomienia niedostępne";
            return;
        }
        if (Notification.permission === "granted") {
            btn.classList.add("is-on");
            btn.title = "Powiadomienia włączone";
        } else if (Notification.permission === "denied") {
            btn.classList.add("is-blocked");
            btn.title = "Powiadomienia zablokowane";
        } else {
            btn.title = "Włącz powiadomienia";
        }
    }

    async function registerPushToken() {
        if (!messaging || !cfg().vapidKey || !swReady) return false;
        try {
            const token = await messaging.getToken({
                vapidKey: cfg().vapidKey,
                serviceWorkerRegistration: swReady
            });
            if (!token) return false;
            await db.collection("adminTokens").doc(token.slice(0, 120)).set({
                token,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (e) {
            console.warn("FCM", e);
            return false;
        }
    }

    async function requestNotifications() {
        if (!("Notification" in window)) {
            toast("Brak powiadomień w tej przeglądarce.", true);
            return;
        }
        if (location.protocol === "file:") {
            toast("Użyj adresu z GitHuba (https).", true);
            return;
        }
        if (Notification.permission === "denied") {
            toast("Odblokuj powiadomienia w ustawieniach Chrome.", true);
            updateNotifyButton();
            return;
        }
        if (Notification.permission === "default") {
            const result = await Notification.requestPermission();
            if (result !== "granted") {
                toast("Powiadomienia nie włączone.", true);
                updateNotifyButton();
                return;
            }
        }
        updateNotifyButton();
        await registerPushToken();
        toast("Powiadomienia włączone.");
    }

    async function sendAdminReply() {
        const input = $("admin-reply");
        const text = input?.value.trim();
        if (!text || !activeConvId) return;
        await db.collection("conversations").doc(activeConvId).collection("messages").add({
            text,
            sender: "admin",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
        await db.collection("conversations").doc(activeConvId).update({
            lastMessage: text,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            unreadAdmin: false,
            unreadClient: true
        });
        input.value = "";
    }

    function bindUi() {
        $("login-form")?.addEventListener("submit", async (e) => {
            e.preventDefault();
            try {
                await login($("admin-email").value.trim(), $("admin-password").value);
            } catch (err) {
                toast("Błędny e-mail lub hasło.", true);
            }
        });
        $("logout-btn")?.addEventListener("click", () => logout());
        $("notify-btn")?.addEventListener("click", requestNotifications);
        $("admin-send")?.addEventListener("click", sendAdminReply);
        $("archive-btn")?.addEventListener("click", toggleArchive);
        $("delete-conv-btn")?.addEventListener("click", deleteConversation);
        $("admin-reply")?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendAdminReply();
            }
        });
        document.querySelectorAll(".conv-tab").forEach((tab) => {
            tab.addEventListener("click", () => {
                listTab = tab.dataset.tab || "active";
                document.querySelectorAll(".conv-tab").forEach((t) => {
                    t.classList.toggle("active", t === tab);
                });
                renderConvList();
                if (activeConvId) {
                    const doc = allConvDocs.find((d) => d.id === activeConvId);
                    if (!doc || isDeleted(doc.data())) {
                        closeActiveThread();
                        return;
                    }
                    const archived = isArchived(doc.data());
                    if ((listTab === "archive" && !archived) || (listTab === "active" && archived)) {
                        closeActiveThread();
                    }
                }
            });
        });
    }

    async function onAuthState(user) {
        if (!user) {
            showLogin(true);
            $("admin-user-label").textContent = "Panel wiadomości";
            return;
        }
        showLogin(false);
        $("admin-user-label").textContent = user.email || "Zalogowano";
        listenConversations();
        updateNotifyButton();
        updateInstallButtonState();
        if (Notification.permission === "granted") {
            await registerPushToken();
        }
    }

    async function init() {
        bindUi();
        setupAdminInstall();
        await ensureServiceWorker();

        if (!ready()) {
            toast("Uzupełnij firebase-config.js", true);
            showLogin(true);
            return;
        }
        await initFirebase();
        auth.onAuthStateChanged(onAuthState);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
