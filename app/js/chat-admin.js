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
    let toastTimer = null;
    let swReady = null;
    let typingDebounceTimer = null;
    let typingIdleTimer = null;
    const TYPING_TTL_MS = 8000;

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

    function isTypingFresh(ts) {
        if (!ts?.toDate) return false;
        return Date.now() - ts.toDate().getTime() < TYPING_TTL_MS;
    }

    function updateAdminTypingUI(data) {
        const el = $("admin-typing-indicator");
        const box = $("admin-messages");
        if (!el || !activeConvId) return;
        const show = data?.typingClient === true && isTypingFresh(data.typingClientAt);
        el.hidden = !show;
        const label = el.querySelector(".chat-typing__label");
        if (label) {
            const name = data?.clientName || "Klient";
            label.textContent = `${name} pisze`;
        }
        if (show && box && !box.hidden) {
            window.requestAnimationFrame(() => {
                box.scrollTop = box.scrollHeight;
            });
        }
    }

    async function setAdminTyping(active) {
        if (!activeConvId || !db || !isEmailAdmin(auth?.currentUser)) return;
        try {
            await db.collection("conversations").doc(activeConvId).update({
                typingAdmin: active,
                typingAdminAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            /* ignore */
        }
    }

    function scheduleAdminTyping() {
        clearTimeout(typingDebounceTimer);
        clearTimeout(typingIdleTimer);
        typingDebounceTimer = setTimeout(() => {
            setAdminTyping(true);
            typingIdleTimer = setTimeout(() => setAdminTyping(false), 4000);
        }, 280);
    }

    function clearAdminTyping() {
        clearTimeout(typingDebounceTimer);
        clearTimeout(typingIdleTimer);
        setAdminTyping(false);
        const el = $("admin-typing-indicator");
        if (el) el.hidden = true;
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

    /* ——— PWA / ikona (osobna aplikacja: manifest id cad-admin-app) ——— */

    function isInAppBrowser() {
        const ua = navigator.userAgent || "";
        return /instagram|fbav|fban|fbios|line\/|tiktok/i.test(ua);
    }

    function waitForInstallPrompt(timeoutMs) {
        if (deferredInstallPrompt) return Promise.resolve(deferredInstallPrompt);
        return new Promise((resolve) => {
            const timer = window.setTimeout(() => {
                if (installPromptWaiter) {
                    window.removeEventListener("beforeinstallprompt", installPromptWaiter);
                    installPromptWaiter = null;
                }
                resolve(null);
            }, timeoutMs);
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

    window.addEventListener("beforeinstallprompt", (e) => {
        e.preventDefault();
        deferredInstallPrompt = e;
        if (installPromptWaiter) {
            installPromptWaiter(e);
            installPromptWaiter = null;
        }
        const btn = $("admin-install-pwa-btn");
        if (btn) {
            btn.disabled = false;
            btn.classList.add("is-ready");
        }
        updateInstallButtonState();
    });

    window.addEventListener("appinstalled", () => {
        deferredInstallPrompt = null;
        toast("Ikona CAD Admin dodana na ekran.");
        hideAdminInstallSheet();
        updateInstallButtonState();
    });

    function isAdminPwaApp() {
        return (
            window.CAD_ADMIN_PWA === true ||
            /\/admin\/(index\.html)?(\?|#|$)/i.test(location.pathname) ||
            location.pathname.endsWith("/admin/")
        );
    }

    function adminScopeUrl() {
        return new URL("./", window.location.href).href;
    }

    async function ensureExclusiveAdminSw() {
        if (!("serviceWorker" in navigator) || !isAdminPwaApp()) return null;
        try {
            const scope = adminScopeUrl();
            let reg = await navigator.serviceWorker.getRegistration(scope);
            if (!reg) {
                reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            }
            swReady = reg;
            await navigator.serviceWorker.ready;
            return swReady;
        } catch (e) {
            console.warn("[CAD Admin] SW", e);
            return null;
        }
    }

    function updateInstallButtonState() {
        const standalone = isStandaloneMode();
        ["install-admin-btn", "install-admin-login-btn"].forEach((id) => {
            const btn = $(id);
            if (!btn) return;
            btn.hidden = standalone;
        });
        const headerBtn = $("install-admin-btn");
        if (!headerBtn || standalone) return;
        headerBtn.title = deferredInstallPrompt
            ? "Pobierz aplikację CAD Admin"
            : "Pobierz aplikację CAD Admin";
    }

    function setInstallStatus(text) {
        const el = $("admin-install-status");
        if (el) el.textContent = text || "";
    }

    async function refreshAdminInstallUi() {
        const android = $("admin-install-android");
        const ios = $("admin-install-ios");
        const inapp = $("admin-install-inapp");
        const pwaBtn = $("admin-install-pwa-btn");

        if (inapp) inapp.hidden = !isInAppBrowser();

        if (isInAppBrowser()) {
            if (android) android.hidden = true;
            if (ios) ios.hidden = true;
            setInstallStatus("");
            return;
        }

        if (isIos()) {
            if (android) android.hidden = true;
            if (ios) ios.hidden = false;
            setInstallStatus("");
            return;
        }

        if (android) android.hidden = false;
        if (ios) ios.hidden = true;
        if (pwaBtn) {
            pwaBtn.disabled = true;
            pwaBtn.classList.remove("is-ready");
        }

        setInstallStatus("Ładowanie…");
        await ensureExclusiveAdminSw();
        await waitForInstallPrompt(8000);

        if (deferredInstallPrompt) {
            setInstallStatus("");
            if (pwaBtn) {
                pwaBtn.disabled = false;
                pwaBtn.classList.add("is-ready");
            }
        } else {
            setInstallStatus("");
            if (android) android.hidden = true;
        }
    }

    function showAdminInstallSheet() {
        if (isStandaloneMode()) {
            toast("CAD Admin jest już na ekranie głównym.");
            return;
        }
        const sheet = $("admin-install-sheet");
        if (!sheet) return;
        sheet.hidden = false;
        refreshAdminInstallUi();
    }

    function hideAdminInstallSheet() {
        const sheet = $("admin-install-sheet");
        if (sheet) sheet.hidden = true;
    }

    async function triggerAdminPwaInstall() {
        if (isInAppBrowser()) {
            showAdminInstallSheet();
            return;
        }
        if (isIos()) {
            showAdminInstallSheet();
            return;
        }

        await ensureExclusiveAdminSw();
        if (!deferredInstallPrompt) {
            await waitForInstallPrompt(10000);
        }

        if (deferredInstallPrompt) {
            hideAdminInstallSheet();
            try {
                await deferredInstallPrompt.prompt();
                await deferredInstallPrompt.userChoice;
            } catch (e) {
                console.warn(e);
            }
            deferredInstallPrompt = null;
            updateInstallButtonState();
            return;
        }

        showAdminInstallSheet();
    }

    function setupAdminInstall() {
        $("install-admin-btn")?.addEventListener("click", () => triggerAdminPwaInstall());
        $("install-admin-login-btn")?.addEventListener("click", () => triggerAdminPwaInstall());
        $("admin-install-pwa-btn")?.addEventListener("click", () => triggerAdminPwaInstall());
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
        if (auth.currentUser?.isAnonymous) {
            await auth.signOut();
        }
        await auth.signInWithEmailAndPassword(email, password);
    }

    async function logout() {
        await auth.signOut();
    }

    function isEmailAdmin(user) {
        return !!(user && user.email && user.isAnonymous !== true);
    }

    function showLogin(show) {
        $("admin-login").hidden = !show;
        $("admin-app").hidden = show;
        const authActions = $("admin-auth-actions");
        if (authActions) authActions.hidden = show;
        if (show) {
            closeActiveThread();
            if (convUnsub) {
                convUnsub();
                convUnsub = null;
            }
        }
        updateInstallButtonState();
    }

    /* ——— Rozmowy ——— */

    function clientInitial(name) {
        const n = String(name || "K").trim();
        return (n[0] || "K").toUpperCase();
    }

    function setThreadUi(open) {
        document.body.classList.toggle("admin-has-thread", !!open);
        const empty = $("admin-empty-state");
        const msgs = $("admin-messages");
        const compose = $("admin-compose");
        const header = $("admin-thread-header");
        if (empty) empty.hidden = open;
        if (msgs) msgs.hidden = !open;
        if (compose) compose.hidden = !open;
        if (header) header.hidden = !open;
    }

    function updateAdminStats() {
        const stats = $("admin-stats");
        const countEl = $("admin-stats-count");
        if (!stats || !countEl) return;
        const unread = allConvDocs.filter((d) => {
            const data = d.data();
            return !isDeleted(data) && !isArchived(data) && data.unreadAdmin;
        }).length;
        countEl.textContent = String(unread);
        stats.hidden = unread === 0;
    }

    function convStatusFor(data) {
        return window.CAD_DATA?.convStatusLabel?.(data) || { key: "reply", pl: "—" };
    }

    function updateThreadHeader() {
        if (!activeConvId || !activeConvData) {
            setThreadUi(false);
            const extras = $("admin-thread-extras");
            if (extras) extras.hidden = true;
            return;
        }
        setThreadUi(true);
        const name = activeConvData.clientName || "Klient";
        const email = activeConvData.clientEmail ? ` · ${activeConvData.clientEmail}` : "";
        $("admin-thread-title").textContent = name + email;
        const lang = langLabel(activeConvData.clientLang);
        const langEl = $("admin-thread-lang");
        if (langEl) langEl.textContent = lang ? `Język: ${lang}` : "";
        const st = convStatusFor(activeConvData);
        const statusEl = $("admin-thread-status");
        if (statusEl) {
            statusEl.textContent = st.pl;
            statusEl.className = `admin-thread-status ${window.CAD_DATA?.statusClass?.(st.key) || ""}`;
        }
        const archiveBtn = $("archive-btn");
        const archiveLabel = archiveBtn?.querySelector(".admin-chip__label");
        if (archiveLabel) {
            archiveLabel.textContent = isArchived(activeConvData) ? "Przywróć" : "Archiwizuj";
        }
        if (archiveBtn) {
            archiveBtn.title = isArchived(activeConvData) ? "Przywróć do aktywnych" : "Archiwizuj";
        }
        renderThreadExtras();
    }

    function renderQuoteCard(data) {
        const card = $("admin-quote-card");
        const q = data?.quoteSnapshot;
        if (!card) return;
        if (!q?.serviceLabels?.length && !q?.serviceIds?.length) {
            card.hidden = true;
            return;
        }
        const lines = (q.serviceLabels || q.serviceIds || []).slice(0, 8).join(", ");
        const car = q.carModel ? ` · ${escapeHtml(q.carModel)}` : "";
        card.innerHTML = `<strong>Wycena klienta</strong><p>Klasa ${escapeHtml(q.size || "—")}${car} · ~€${q.totalEur || 0}</p><small>${escapeHtml(lines)}</small>`;
        card.hidden = false;
    }

    async function loadInternalNote(convId) {
        const ta = $("admin-internal-note");
        if (!ta || !db) return;
        try {
            const snap = await db.collection("conversations").doc(convId).collection("internal").doc("note").get();
            ta.value = snap.exists ? snap.data().text || "" : "";
        } catch (e) {
            ta.value = "";
        }
    }

    async function saveInternalNote() {
        if (!activeConvId || !db) return;
        const text = $("admin-internal-note")?.value?.trim() || "";
        try {
            await db
                .collection("conversations")
                .doc(activeConvId)
                .collection("internal")
                .doc("note")
                .set({
                    text,
                    updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    updatedBy: auth?.currentUser?.email || ""
                });
            toast("Notatka zapisana.");
        } catch (e) {
            toast("Nie zapisano notatki — sprawdź reguły Firestore.", true);
        }
    }

    async function renderClientHistory(data) {
        const list = $("admin-history-list");
        if (!list || !db) return;
        const clientId = data?.clientId;
        if (!clientId) {
            list.innerHTML = "<li>Brak ID klienta (stara rozmowa).</li>";
            return;
        }
        try {
            const snap = await db
                .collection("conversations")
                .where("clientId", "==", clientId)
                .orderBy("lastMessageAt", "desc")
                .limit(8)
                .get();
            if (snap.empty) {
                list.innerHTML = "<li>Pierwsza rozmowa tego klienta.</li>";
                return;
            }
            list.innerHTML = snap.docs
                .map((d) => {
                    const c = d.data();
                    if (isDeleted(c)) return "";
                    const when = formatTime(c.lastMessageAt);
                    const preview = escapeHtml((c.lastMessage || "—").slice(0, 60));
                    const current = d.id === activeConvId ? " admin-history-item--current" : "";
                    return `<li class="admin-history-item${current}"><time>${escapeHtml(when)}</time> ${preview}</li>`;
                })
                .filter(Boolean)
                .join("");
        } catch (e) {
            list.innerHTML = "<li>Historia wymaga indeksu Firestore (clientId + lastMessageAt).</li>";
        }
    }

    function renderThreadExtras() {
        const extras = $("admin-thread-extras");
        if (!extras || !activeConvData) {
            if (extras) extras.hidden = true;
            return;
        }
        extras.hidden = false;
        renderQuoteCard(activeConvData);
        renderClientHistory(activeConvData);
        loadInternalNote(activeConvId);
    }

    function renderConvList() {
        const list = $("conv-list");
        if (!list) return;
        const filtered = visibleConversations();
        if (!filtered.length) {
            list.innerHTML = `<p class="conv-empty">${listTab === "archive" ? "Brak w archiwum." : "Brak rozmów."}</p>`;
            updateAdminStats();
            return;
        }
        list.innerHTML = filtered
            .map((d) => {
                const data = d.data();
                const active = d.id === activeConvId ? " active" : "";
                const hasUnread = data.unreadAdmin && !isArchived(data);
                const preview = (data.lastMessage || "—").slice(0, 72);
                const name = data.clientName || "Klient";
                const when = formatTime(data.lastMessageAt);
                const initial = escapeHtml(clientInitial(name));
                const st = convStatusFor(data);
                const stClass = window.CAD_DATA?.statusClass?.(st.key) || "";
                return `<button type="button" class="conv-item${active}" data-id="${d.id}">
                    <span class="conv-item__avatar">${initial}</span>
                    <span class="conv-item__body">
                        <span class="conv-item__row">
                            <strong>${escapeHtml(name)}</strong>
                            <span class="conv-status ${stClass}">${escapeHtml(st.pl)}</span>
                            ${when ? `<time>${escapeHtml(when)}</time>` : ""}
                        </span>
                        <small>${escapeHtml(preview)}</small>
                    </span>
                    <span class="conv-item__dot"${hasUnread ? "" : " hidden"} aria-hidden="true"></span>
                </button>`;
            })
            .join("");
        updateAdminStats();
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
        box.hidden = false;
        if (!messages.length) {
            box.innerHTML = '<p class="admin-empty-hint">Brak wiadomości w tej rozmowie.</p>';
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
        updateAdminTypingUI(activeConvData);
        if (msgUnsub) msgUnsub();

        document.querySelectorAll(".conv-item").forEach((el) => {
            el.classList.toggle("active", el.dataset.id === convId);
        });

        const msgs = $("admin-messages");
        if (msgs) {
            msgs.hidden = false;
            msgs.innerHTML = '<p class="admin-empty-hint">Ładowanie…</p>';
        }

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
        clearAdminTyping();
        activeConvId = null;
        activeConvData = null;
        if (msgUnsub) {
            msgUnsub();
            msgUnsub = null;
        }
        document.querySelectorAll(".conv-item").forEach((el) => el.classList.remove("active"));
        updateThreadHeader();
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
        if (!auth?.currentUser?.email) {
            toast("Usuwanie wymaga logowania e-mailem (nie anonimowo).", true);
            return;
        }

        const convId = activeConvId;
        const name = activeConvData?.clientName || "Klient";

        if (!window.confirm(`Usunąć rozmowę „${name}”?\nZniknie u Ciebie i u klienta po odświeżeniu chatu.`)) return;

        const deleteBtn = $("delete-conv-btn");
        if (deleteBtn) deleteBtn.disabled = true;
        closeActiveThread();
        toast("Usuwanie rozmowy…");

        try {
            await hardDeleteConversation(convId);
            toast("Rozmowa usunięta.");
        } catch (e) {
            console.warn("[CAD Admin] delete", e);
            const denied = e?.code === "permission-denied" || e?.code === "firestore/permission-denied";
            if (denied) {
                try {
                    await db.collection("conversations").doc(convId).update({
                        deleted: true,
                        archived: true,
                        unreadAdmin: false,
                        deletedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    toast(
                        "Ukryto na liście. Pełne skasowanie: Firebase → Firestore → Rules → wklej app/firestore.rules → Publish.",
                        true
                    );
                } catch (e2) {
                    toast("Brak uprawnień do usunięcia. Sprawdź reguły Firestore i login admina.", true);
                }
            } else {
                toast("Nie udało się usunąć. Spróbuj ponownie.", true);
            }
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
                        updateAdminTypingUI(activeConvData);
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
        if (!isEmailAdmin(auth?.currentUser)) {
            toast("Zaloguj się e-mailem i hasłem z Firebase (nie sesja z apki klienta).", true);
            showLogin(true);
            return;
        }
        clearAdminTyping();
        try {
            await db.collection("conversations").doc(activeConvId).collection("messages").add({
                text,
                sender: "admin",
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await db.collection("conversations").doc(activeConvId).update({
                lastMessage: text,
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastSender: "admin",
                unreadAdmin: false,
                unreadClient: true,
                typingAdmin: false
            });
            input.value = "";
            window.CAD_AdminPanel?.refreshStats?.();
        } catch (e) {
            console.error("CAD admin send failed:", e);
            const code = e?.code || "";
            if (code === "permission-denied" || code === "firestore/permission-denied") {
                toast(
                    "Brak uprawnień Firestore. W konsoli Firebase: Rules → wklej app/firestore.rules → Publish. Admin: logowanie e-mailem. Klient: włącz Anonymous.",
                    true
                );
            } else {
                toast("Nie udało się wysłać wiadomości.", true);
            }
        }
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
        $("admin-back-btn")?.addEventListener("click", closeActiveThread);
        $("admin-send")?.addEventListener("click", sendAdminReply);
        $("archive-btn")?.addEventListener("click", toggleArchive);
        $("delete-conv-btn")?.addEventListener("click", deleteConversation);
        $("admin-save-note-btn")?.addEventListener("click", saveInternalNote);
        $("admin-reply")?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendAdminReply();
            }
        });
        $("admin-reply")?.addEventListener("input", scheduleAdminTyping);
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

        if (!isEmailAdmin(user)) {
            showLogin(true);
            $("admin-user-label").textContent = "Wymagane logowanie e-mailem";
            try {
                await auth.signOut();
            } catch (e) {
                /* ignore */
            }
            return;
        }

        showLogin(false);
        $("admin-user-label").textContent = user.email || "Zalogowano";
        if (window.CAD_DATA?.loadSettings) {
            await window.CAD_DATA.loadSettings(db);
        }
        listenConversations();
        window.CAD_AdminPanel?.init?.();
        updateNotifyButton();
        updateInstallButtonState();
        if (Notification.permission === "granted") {
            await registerPushToken();
        }
    }

    async function init() {
        bindUi();
        setupAdminInstall();
        await ensureExclusiveAdminSw();

        if (!ready()) {
            toast("Uzupełnij firebase-config.js", true);
            showLogin(true);
            return;
        }
        await initFirebase();
        auth.onAuthStateChanged(onAuthState);
    }

    window.CAD_Admin = {
        toast,
        getDb: () => db,
        getAllConversations: () => allConvDocs
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
