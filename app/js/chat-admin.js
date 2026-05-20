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
    let installPromptWaiter = null;

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

    function setStatus(text) {
        const loginEl = $("admin-status");
        const toolbarEl = $("admin-toolbar-status");
        if (loginEl) loginEl.textContent = text || "";
        if (toolbarEl) toolbarEl.textContent = text || "";
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
        const map = { pl: "Polski", nl: "Niderlandzki", en: "Angielski" };
        return map[code] || code || "";
    }

    function isArchived(data) {
        return data && data.archived === true;
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

    function setInstallStatus(text) {
        const el = $("admin-install-status");
        if (el) el.textContent = text || "";
    }

    function showAdminInstallSheet() {
        const sheet = $("admin-install-sheet");
        if (!sheet || isStandaloneMode()) return;
        const android = $("admin-install-android");
        const ios = $("admin-install-ios");
        if (android) android.hidden = isIos();
        if (ios) ios.hidden = !isIos();
        sheet.hidden = false;
        refreshAdminInstallUi();
    }

    function hideAdminInstallSheet() {
        const sheet = $("admin-install-sheet");
        if (!sheet) return;
        sheet.hidden = true;
    }

    function waitForInstallPrompt(timeoutMs) {
        if (deferredInstallPrompt) return Promise.resolve(deferredInstallPrompt);
        return new Promise((resolve) => {
            const timer = window.setTimeout(() => resolve(null), timeoutMs);
            installPromptWaiter = (event) => {
                event.preventDefault();
                deferredInstallPrompt = event;
                window.clearTimeout(timer);
                installPromptWaiter = null;
                resolve(event);
            };
            window.addEventListener("beforeinstallprompt", installPromptWaiter);
        });
    }

    async function refreshAdminInstallUi() {
        if (isIos()) {
            setInstallStatus("Safari → Udostępnij → Dodaj do ekranu początkowego.");
            return;
        }
        setInstallStatus("Przygotowanie…");
        await waitForInstallPrompt(8000);
        const btn = $("admin-install-pwa-btn");
        if (deferredInstallPrompt) {
            setInstallStatus("Kliknij „Dodaj ikonę”, aby potwierdzić na ekranie głównym.");
            if (btn) btn.disabled = false;
        } else {
            setInstallStatus("Chrome: menu (⋮) → Zainstaluj aplikację.");
            if (btn) btn.disabled = true;
        }
    }

    async function triggerAdminPwaInstall() {
        if (!deferredInstallPrompt) await waitForInstallPrompt(3000);
        if (!deferredInstallPrompt) {
            setInstallStatus("Użyj menu Chrome (⋮) → Zainstaluj aplikację.");
            return;
        }
        try {
            await deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
        } catch (e) {
            /* ignore */
        }
        deferredInstallPrompt = null;
    }

    function setupAdminInstall() {
        window.addEventListener("beforeinstallprompt", (e) => {
            e.preventDefault();
            deferredInstallPrompt = e;
            if (installPromptWaiter) {
                installPromptWaiter(e);
                installPromptWaiter = null;
            }
        });
        window.addEventListener("appinstalled", () => {
            setInstallStatus("Ikona CAD Admin dodana na ekran główny.");
            window.setTimeout(hideAdminInstallSheet, 2000);
        });
        $("login-install-btn")?.addEventListener("click", showAdminInstallSheet);
        $("install-admin-btn")?.addEventListener("click", showAdminInstallSheet);
        $("admin-install-pwa-btn")?.addEventListener("click", triggerAdminPwaInstall);
        document.querySelectorAll("[data-admin-install-dismiss]").forEach((el) => {
            el.addEventListener("click", hideAdminInstallSheet);
        });
        const params = new URLSearchParams(location.search);
        if (params.has("install") && !isStandaloneMode()) {
            showAdminInstallSheet();
        }
    }

    function updateNotifyButton() {
        const btn = $("notify-btn");
        if (!btn) return;
        if (!("Notification" in window)) {
            btn.textContent = "Brak powiadomień w tej przeglądarce";
            btn.disabled = true;
            return;
        }
        if (location.protocol === "file:") {
            btn.textContent = "Wymaga linku http (GitHub / Live Server)";
            return;
        }
        const hasVapid = !!cfg().vapidKey;
        if (Notification.permission === "granted") {
            btn.textContent = hasVapid ? "Powiadomienia + push ✓" : "Powiadomienia włączone ✓";
            btn.classList.add("is-on");
        } else if (Notification.permission === "denied") {
            btn.textContent = "Zablokowane — odblokuj w Chrome";
            btn.classList.add("is-blocked");
        } else {
            btn.textContent = hasVapid ? "Włącz powiadomienia (push)" : "Włącz powiadomienia";
            btn.classList.remove("is-on", "is-blocked");
        }
    }

    function pushStatusHint() {
        if (!cfg().vapidKey) {
            return "Push w tle: wygeneruj klucz Web Push w Firebase → wklej jako vapidKey w firebase-config.js, potem wdróż app/functions (instrukcja w app/functions/README.md).";
        }
        return "Push w tle: po włączeniu powiadomień i wdrożeniu Cloud Function dostaniesz alert nawet przy zamkniętej apce admina.";
    }

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
                    setStatus(`${title}: ${body}`);
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
    }

    function updateThreadHeader() {
        const header = $("admin-thread-header");
        const title = $("admin-thread-title");
        const langEl = $("admin-thread-lang");
        const archiveBtn = $("archive-btn");
        if (!header || !activeConvId || !activeConvData) {
            if (header) header.hidden = true;
            return;
        }
        header.hidden = false;
        if (title) title.textContent = activeConvData.clientName || "Klient";
        if (langEl) {
            const lang = langLabel(activeConvData.clientLang);
            langEl.textContent = lang ? `Język: ${lang}` : "";
        }
        if (archiveBtn) {
            archiveBtn.textContent = isArchived(activeConvData) ? "Przywróć z archiwum" : "Archiwizuj";
        }
    }

    function renderConvList(docs) {
        const list = $("conv-list");
        if (!list) return;
        const filtered = docs.filter((d) => {
            const archived = isArchived(d.data());
            return listTab === "archive" ? archived : !archived;
        });
        if (!filtered.length) {
            list.innerHTML =
                listTab === "archive"
                    ? '<p style="padding:16px;color:var(--muted)">Brak rozmów w archiwum.</p>'
                    : '<p style="padding:16px;color:var(--muted)">Brak aktywnych rozmów.</p>';
            return;
        }
        list.innerHTML = filtered
            .map((d) => {
                const data = d.data();
                const active = d.id === activeConvId ? " active" : "";
                const unread = data.unreadAdmin && !isArchived(data) ? '<span class="badge">NOWA</span>' : "";
                const preview = (data.lastMessage || "").slice(0, 80);
                const name = data.clientName || "Klient";
                const when = formatTime(data.lastMessageAt);
                return `<button type="button" class="conv-item${active}" data-id="${d.id}">
                    <strong>${escapeHtml(name)}</strong>
                    <small>${escapeHtml(preview)}</small>
                    ${when ? `<time class="conv-time">${escapeHtml(when)}</time>` : ""}
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
            box.innerHTML = '<p style="color:var(--muted);padding:8px 0">Brak wiadomości.</p>';
            return;
        }
        box.innerHTML = messages
            .map((m) => {
                const when = formatTime(m.createdAt);
                return `
            <div class="chat-bubble chat-bubble--${m.sender === "admin" ? "admin" : "client"}">
                ${escapeHtml(m.text)}
                ${when ? `<time>${escapeHtml(when)}</time>` : ""}
            </div>`;
            })
            .join("");
        box.scrollTop = box.scrollHeight;
    }

    async function openConversation(convId) {
        activeConvId = convId;
        const doc = allConvDocs.find((d) => d.id === convId);
        activeConvData = doc ? doc.data() : null;
        updateThreadHeader();
        if (msgUnsub) msgUnsub();
        document.querySelectorAll(".conv-item").forEach((el) => {
            el.classList.toggle("active", el.dataset.id === convId);
        });
        const box = $("admin-messages");
        if (box) box.innerHTML = '<p style="color:var(--muted);padding:8px 0">Ładowanie…</p>';
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
                const messages = snap.docs.map((d) => d.data());
                renderMessages(messages);
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
        const box = $("admin-messages");
        if (box) {
            box.innerHTML = '<p style="color:var(--muted);padding:16px">Wybierz rozmowę z listy.</p>';
        }
    }

    async function toggleArchive() {
        if (!activeConvId) return;
        const next = !isArchived(activeConvData);
        await db.collection("conversations").doc(activeConvId).update({
            archived: next,
            unreadAdmin: next ? false : activeConvData?.unreadAdmin || false
        });
        activeConvData = { ...activeConvData, archived: next };
        updateThreadHeader();
        if (next) {
            closeActiveThread();
        }
    }

    async function deleteAllMessages(convRef) {
        const chunkSize = 400;
        let total = 0;
        while (true) {
            const snap = await convRef.collection("messages").limit(chunkSize).get();
            if (snap.empty) break;
            const batch = db.batch();
            snap.docs.forEach((doc) => batch.delete(doc.ref));
            await batch.commit();
            total += snap.docs.length;
            if (snap.docs.length < chunkSize) break;
        }
        return total;
    }

    async function deleteConversation() {
        if (!activeConvId || !db) return;
        const convId = activeConvId;
        const name = activeConvData?.clientName || "Klient";
        const ok = window.confirm(
            `Usunąć rozmowę z „${name}”?\n\nWszystkie wiadomości zostaną trwale usunięte. Tej operacji nie cofniesz.`
        );
        if (!ok) return;

        const convRef = db.collection("conversations").doc(convId);
        const deleteBtn = $("delete-conv-btn");
        if (deleteBtn) deleteBtn.disabled = true;

        try {
            setStatus("Usuwanie wiadomości…");
            const count = await deleteAllMessages(convRef);
            setStatus("Usuwanie rozmowy…");
            await convRef.delete();

            if (activeConvId === convId) {
                closeActiveThread();
            }
            setStatus(`Rozmowa usunięta (${count} wiadomości).`);
        } catch (e) {
            console.warn("[CAD Admin] delete", e);
            const code = e?.code || "";
            let hint = "Sprawdź reguły Firestore (delete tylko dla admina z e-mailem) i połączenie.";
            if (code === "permission-denied") {
                hint = "Brak uprawnień — w Firebase wklej nowe reguły z app/README.md i Publish.";
            } else if (code === "unavailable") {
                hint = "Brak internetu — spróbuj ponownie za chwilę.";
            }
            setStatus(`Nie udało się usunąć (${code || "błąd"}). ${hint}`);
        } finally {
            if (deleteBtn) deleteBtn.disabled = false;
        }
    }

    function listenConversations() {
        if (convUnsub) convUnsub();
        convUnsub = db
            .collection("conversations")
            .orderBy("lastMessageAt", "desc")
            .limit(80)
            .onSnapshot((snap) => {
                allConvDocs = snap.docs;
                renderConvList(allConvDocs);
                snap.docChanges().forEach((change) => {
                    if (change.type !== "added" && change.type !== "modified") return;
                    const data = change.doc.data();
                    if (isArchived(data)) return;
                    if (data.unreadAdmin && change.doc.id !== activeConvId) {
                        notifyNewMessage(data.clientName, data.lastMessage);
                    }
                });
                if (activeConvId) {
                    const doc = allConvDocs.find((d) => d.id === activeConvId);
                    if (doc) {
                        activeConvData = doc.data();
                        updateThreadHeader();
                    } else {
                        closeActiveThread();
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

    async function registerPushToken() {
        if (!messaging || !cfg().vapidKey) return false;
        try {
            const reg = await navigator.serviceWorker.register("./sw.js");
            const token = await messaging.getToken({ vapidKey: cfg().vapidKey, serviceWorkerRegistration: reg });
            if (!token) return false;
            await db.collection("adminTokens").doc(token.slice(0, 120)).set({
                token,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            return true;
        } catch (e) {
            console.warn("FCM token", e);
            return false;
        }
    }

    async function requestNotifications(fromClick) {
        updateNotifyButton();

        if (!("Notification" in window)) {
            setStatus("Ta przeglądarka nie obsługuje powiadomień.");
            return;
        }

        if (location.protocol === "file:") {
            setStatus("Powiadomienia nie działają z pliku na dysku. Użyj linku z GitHuba lub Live Server.");
            return;
        }

        if (Notification.permission === "denied") {
            setStatus("Powiadomienia zablokowane. Chrome → ikona kłódki → Powiadomienia → Zezwól.");
            updateNotifyButton();
            return;
        }

        if (Notification.permission === "default") {
            const result = await Notification.requestPermission();
            if (result !== "granted") {
                setStatus(result === "denied" ? "Odmówiłeś powiadomień. Możesz włączyć w ustawieniach Chrome." : "Nie włączono powiadomień.");
                updateNotifyButton();
                return;
            }
        }

        updateNotifyButton();

        if (fromClick && Notification.permission === "granted") {
            new Notification("Car All Detailing — Admin", {
                body: "Powiadomienia działają. Dostaniesz alert przy nowej wiadomości od klienta.",
                icon: "./icons/icon-192.png",
                tag: "cad-admin-test"
            });
        }

        let status = "Powiadomienia włączone (panel otwarty lub w tle na telefonie).";
        if (cfg().vapidKey) {
            const ok = await registerPushToken();
            status = ok
                ? "Powiadomienia + token push zapisany. Push w tle działa po wdrożeniu Cloud Function (app/functions/README.md)."
                : "Powiadomienia OK, ale token push się nie zapisał — sprawdź vapidKey i odśwież stronę.";
        } else {
            status += " " + pushStatusHint();
        }
        setStatus(status);
        updateNotifyButton();
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
            const email = $("admin-email").value.trim();
            const pass = $("admin-password").value;
            try {
                await login(email, pass);
            } catch (err) {
                setStatus("Błędny login lub hasło.");
            }
        });
        $("logout-btn")?.addEventListener("click", () => logout());
        $("notify-btn")?.addEventListener("click", () => requestNotifications(true));
        $("admin-send")?.addEventListener("click", sendAdminReply);
        $("archive-btn")?.addEventListener("click", () => toggleArchive());
        $("delete-conv-btn")?.addEventListener("click", () => deleteConversation());
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
                renderConvList(allConvDocs);
                if (activeConvId) {
                    const doc = allConvDocs.find((d) => d.id === activeConvId);
                    const archived = doc && isArchived(doc.data());
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
            setStatus("");
            return;
        }
        showLogin(false);
        listenConversations();
        updateNotifyButton();
        setStatus(`Zalogowano: ${user.email}. ${pushStatusHint()}`);
        if (Notification.permission === "granted") {
            await registerPushToken();
        }
    }

    async function init() {
        bindUi();
        setupAdminInstall();
        if (!ready()) {
            setStatus("Uzupełnij app/js/firebase-config.js (instrukcja w README).");
            showLogin(true);
            return;
        }
        await initFirebase();
        auth.onAuthStateChanged(onAuthState);
        if ("serviceWorker" in navigator) {
            try {
                await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            } catch (e) {
                console.warn("[CAD Admin] SW", e);
            }
        }
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
