(function () {
    let db = null;
    let auth = null;
    let storage = null;
    let messaging = null;
    let activeConvId = null;
    let activeConvData = null;
    let msgUnsub = null;
    let convUnsub = null;
    let lastNotifiedAt = 0;
    let listTab = "active";
    let listSearchQuery = "";
    let listLangFilter = "";
    let allConvDocs = [];
    const ADMIN_VER_DISMISS_KEY = "cad_admin_ver_dismiss";
    let deferredInstallPrompt = null;
    let installPromptWaiter = null;
    let toastTimer = null;
    let swReady = null;
    let typingDebounceTimer = null;
    let typingIdleTimer = null;
    let adminTypingFirestore = false;
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
        const age = Date.now() - ts.toDate().getTime();
        if (age < 0 || age > TYPING_TTL_MS) return false;
        return true;
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
        if (active && adminTypingFirestore) return;
        if (!active && !adminTypingFirestore) return;
        adminTypingFirestore = !!active;
        const patch = { typingAdmin: active };
        if (active) {
            patch.typingAdminAt = firebase.firestore.FieldValue.serverTimestamp();
        } else {
            patch.typingAdminAt = firebase.firestore.FieldValue.delete();
        }
        try {
            await db.collection("conversations").doc(activeConvId).update(patch);
        } catch (e) {
            adminTypingFirestore = !active;
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
        adminTypingFirestore = false;
        setAdminTyping(false);
        const el = $("admin-typing-indicator");
        if (el) {
            el.hidden = true;
            el.setAttribute("hidden", "");
        }
    }

    function isIos() {
        return /iphone|ipad|ipod/i.test(navigator.userAgent);
    }

    function isAndroid() {
        return /android/i.test(navigator.userAgent);
    }

    function isDesktopInstall() {
        return !isIos() && !isAndroid();
    }

    function isStandaloneMode() {
        return (
            window.matchMedia("(display-mode: standalone)").matches ||
            window.navigator.standalone === true
        );
    }

    function needsReply(data) {
        if (!data || isDeleted(data) || isArchived(data)) return false;
        if (data.adminHandled === true) return false;
        return data.unreadAdmin === true || data.lastSender === "client";
    }

    function matchesConvSearch(doc, q) {
        if (!q) return true;
        const data = doc.data();
        const hay = [data.clientName, data.clientEmail, data.lastMessage]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return hay.includes(q.toLowerCase());
    }

    function matchesLangFilter(doc) {
        if (!listLangFilter) return true;
        const lang = String(doc.data().clientLang || "pl").toLowerCase();
        return lang === listLangFilter;
    }

    function sortConvList(docs) {
        return [...docs].sort((a, b) => {
            const da = a.data();
            const dbb = b.data();
            const ua = da.unreadAdmin && !isArchived(da) ? 1 : 0;
            const ub = dbb.unreadAdmin && !isArchived(dbb) ? 1 : 0;
            if (ub !== ua) return ub - ua;
            const ta = da.lastMessageAt?.toDate?.()?.getTime() || 0;
            const tb = dbb.lastMessageAt?.toDate?.()?.getTime() || 0;
            return tb - ta;
        });
    }

    function visibleConversations() {
        const q = listSearchQuery.trim();
        return sortConvList(
            allConvDocs.filter((d) => {
                if (isDeleted(d.data())) return false;
                if (!matchesConvSearch(d, q)) return false;
                if (!matchesLangFilter(d)) return false;
                const archived = isArchived(d.data());
                if (listTab === "archive") return archived;
                if (listTab === "reply") return !archived && needsReply(d.data());
                return !archived;
            })
        );
    }

    const TEMPLATES_KEY = "cad_admin_reply_templates_v1";
    const DEFAULT_REPLY_TEMPLATES = [
        "Cześć! Dziękuję za wiadomość — sprawdzam kalendarz i zaraz odpiszę.",
        "Proszę o numer rejestracyjny i preferowany termin.",
        "Termin potwierdzony. Do zobaczenia!",
        "Niestety ten termin jest zajęty — podaj proszę inną datę."
    ];

    function getReplyTemplates() {
        const fromCloud = window.CAD_DATA?.getSettings?.()?.adminReplyTemplates;
        if (Array.isArray(fromCloud) && fromCloud.length) {
            return fromCloud.map((s) => String(s).trim()).filter(Boolean).slice(0, 12);
        }
        try {
            const raw = localStorage.getItem(TEMPLATES_KEY);
            if (raw) {
                const arr = JSON.parse(raw);
                if (Array.isArray(arr) && arr.length) {
                    return arr.map((s) => String(s).trim()).filter(Boolean).slice(0, 12);
                }
            }
        } catch (e) {
            /* ignore */
        }
        return DEFAULT_REPLY_TEMPLATES.slice();
    }

    async function saveReplyTemplatesFromText(text) {
        const lines = String(text || "")
            .split("\n")
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 12);
        if (!lines.length) return false;
        localStorage.setItem(TEMPLATES_KEY, JSON.stringify(lines));
        if (db && window.CAD_DATA?.saveSettings) {
            await window.CAD_DATA.saveSettings(db, { adminReplyTemplates: lines });
        }
        return true;
    }

    function buildQuoteSummaryText(data) {
        const q = data?.quoteSnapshot;
        if (!q) return "";
        const services = (q.serviceLabels || q.serviceIds || []).join(", ");
        const car = q.carModel ? `, ${q.carModel}` : "";
        return (
            `Wycena Car All Detailing:\n` +
            `Usługi: ${services || "—"}\n` +
            `Klasa auta: ${q.size || "—"}${car}\n` +
            `Szacunek: ~€${q.totalEur || 0}`
        );
    }

    async function markConversationDone() {
        if (!activeConvId || !db) return;
        try {
            await db.collection("conversations").doc(activeConvId).update({
                adminHandled: true,
                unreadAdmin: false
            });
            toast("Oznaczono jako załatwione.");
            window.CAD_AdminPanel?.refreshStats?.();
        } catch (e) {
            toast("Nie udało się oznaczyć rozmowy.", true);
        }
    }

    function playNewMessageAlert() {
        try {
            if (navigator.vibrate) navigator.vibrate([60, 40, 60]);
        } catch (e) {
            /* ignore */
        }
        try {
            const Ctx = window.AudioContext || window.webkitAudioContext;
            if (!Ctx) return;
            const ctx = new Ctx();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.07;
            osc.start();
            osc.stop(ctx.currentTime + 0.1);
            osc.onended = () => ctx.close();
        } catch (e) {
            /* ignore */
        }
    }

    async function checkAdminUpdateAvailable() {
        const banner = $("admin-update-banner");
        if (!banner || !window.CAD_VERSION?.admin) return;
        try {
            const res = await fetch(`./sw.js?cad-check=${Date.now()}`, { cache: "no-store" });
            const text = await res.text();
            const m = text.match(/cad-admin-v(\d+)/);
            const remote = m ? `cad-admin-v${m[1]}` : "";
            if (!remote || remote === window.CAD_VERSION.admin) {
                banner.hidden = true;
                return;
            }
            if (localStorage.getItem(ADMIN_VER_DISMISS_KEY) === remote) {
                banner.hidden = true;
                return;
            }
            banner.dataset.remoteVer = remote;
            banner.hidden = false;
        } catch (e) {
            /* ignore */
        }
    }

    function renderAdminTemplates() {
        const box = $("admin-templates");
        if (!box || !activeConvId) {
            if (box) box.hidden = true;
            return;
        }
        const templates = getReplyTemplates();
        box.hidden = false;
        box.innerHTML = templates
            .map(
                (t) =>
                    `<button type="button" class="admin-template-chip" data-template="${escapeHtml(t).replace(/"/g, "&quot;")}">${escapeHtml(t.length > 48 ? t.slice(0, 48) + "…" : t)}</button>`
            )
            .join("");
        box.querySelectorAll(".admin-template-chip").forEach((btn) => {
            btn.addEventListener("click", () => {
                const input = $("admin-reply");
                if (input) {
                    input.value = btn.getAttribute("data-template") || "";
                    input.focus();
                }
            });
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
            const regs = await navigator.serviceWorker.getRegistrations();
            for (const reg of regs) {
                const scope = reg.scope || "";
                const script =
                    reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || "";
                const isClientSw =
                    (scope.includes("/app/") && !scope.includes("/admin")) ||
                    (script.includes("/app/sw.js") && !script.includes("/admin/"));
                if (isClientSw) {
                    await reg.unregister();
                }
            }

            let reg = await navigator.serviceWorker.getRegistration("./");
            if (!reg || !reg.active?.scriptURL?.includes("/admin/sw.js")) {
                reg = await navigator.serviceWorker.register("./sw.js", { scope: "./" });
            }
            swReady = reg;

            if (reg.waiting) {
                reg.waiting.postMessage({ type: "SKIP_WAITING" });
            }

            if (!navigator.serviceWorker.controller) {
                await new Promise((resolve) => {
                    const done = () => {
                        navigator.serviceWorker.removeEventListener("controllerchange", done);
                        resolve();
                    };
                    navigator.serviceWorker.addEventListener("controllerchange", done);
                    window.setTimeout(done, 5000);
                });
            }

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
        const hint = $("install-admin-login-hint");
        if (hint) hint.hidden = standalone;
        const headerBtn = $("install-admin-btn");
        if (!headerBtn || standalone) return;
        headerBtn.title = deferredInstallPrompt
            ? "Pobierz aplikację CAD Admin"
            : "Pobierz aplikację CAD Admin (instrukcja w panelu)";
    }

    function installEnvironmentIssue() {
        if (location.protocol === "file:") {
            return "Otwórz panel przez internet (https://…/app/admin/), nie pliku z dysku.";
        }
        if (!window.isSecureContext) {
            return "Instalacja wymaga bezpiecznego połączenia HTTPS.";
        }
        return "";
    }

    function setInstallStatus(text) {
        const el = $("admin-install-status");
        if (el) el.textContent = text || "";
    }

    async function refreshAdminInstallUi() {
        const android = $("admin-install-android");
        const ios = $("admin-install-ios");
        const desktop = $("admin-install-desktop");
        const inapp = $("admin-install-inapp");
        const pwaBtn = $("admin-install-pwa-btn");

        const envIssue = installEnvironmentIssue();
        if (envIssue) {
            if (android) android.hidden = true;
            if (ios) ios.hidden = true;
            if (desktop) desktop.hidden = true;
            if (inapp) inapp.hidden = true;
            setInstallStatus(envIssue);
            return;
        }

        if (inapp) inapp.hidden = !isInAppBrowser();

        if (isInAppBrowser()) {
            if (android) android.hidden = true;
            if (ios) ios.hidden = true;
            if (desktop) desktop.hidden = true;
            setInstallStatus("Skopiuj link i otwórz w Chrome lub Safari (nie Instagram / Facebook).");
            return;
        }

        if (isIos()) {
            if (android) android.hidden = true;
            if (ios) ios.hidden = false;
            if (desktop) desktop.hidden = true;
            setInstallStatus("iPhone: tylko Safari → Udostępnij → Dodaj do ekranu początkowego.");
            return;
        }

        if (isDesktopInstall()) {
            if (android) android.hidden = true;
            if (ios) ios.hidden = true;
            if (desktop) desktop.hidden = false;
        } else {
            if (android) android.hidden = false;
            if (ios) ios.hidden = true;
            if (desktop) desktop.hidden = true;
            if (pwaBtn) {
                pwaBtn.disabled = true;
                pwaBtn.classList.remove("is-ready");
            }
        }

        setInstallStatus("Przygotowanie instalacji…");
        await ensureExclusiveAdminSw();
        await waitForInstallPrompt(isDesktopInstall() ? 5000 : 8000);

        if (deferredInstallPrompt && !isDesktopInstall()) {
            setInstallStatus("Stuknij „Zainstaluj teraz”, potem potwierdź na ekranie.");
            if (pwaBtn) {
                pwaBtn.disabled = false;
                pwaBtn.classList.add("is-ready");
            }
            return;
        }

        if (deferredInstallPrompt && isDesktopInstall()) {
            setInstallStatus("Chrome/Edge: użyj ikony instalacji w pasku adresu albo menu ⋮.");
            return;
        }

        if (isDesktopInstall()) {
            setInstallStatus("Menu Chrome/Edge (⋮) → Zainstaluj CAD Admin. Ikona w pasku adresu też działa.");
            return;
        }

        setInstallStatus("Menu Chrome (⋮) → Zainstaluj aplikację / Dodaj do ekranu głównego.");
    }

    function showAdminInstallSheet() {
        if (isStandaloneMode()) {
            toast("CAD Admin jest już na ekranie głównym.");
            return;
        }
        const sheet = $("admin-install-sheet");
        if (!sheet) return;
        sheet.hidden = false;
        document.body.classList.add("admin-install-sheet-open");
        refreshAdminInstallUi();
    }

    function hideAdminInstallSheet() {
        const sheet = $("admin-install-sheet");
        if (sheet) sheet.hidden = true;
        document.body.classList.remove("admin-install-sheet-open");
        try {
            localStorage.setItem("cad_admin_install_sheet_seen", "1");
        } catch (e) {
            /* ignore */
        }
    }

    function maybePromptAdminInstall() {
        if (isStandaloneMode()) return;
        const params = new URLSearchParams(location.search);
        if (params.has("install")) {
            showAdminInstallSheet();
            return;
        }
        try {
            if (!localStorage.getItem("cad_admin_install_sheet_seen")) {
                window.setTimeout(showAdminInstallSheet, 1200);
            }
        } catch (e) {
            /* ignore */
        }
    }

    async function triggerAdminPwaInstall() {
        const envIssue = installEnvironmentIssue();
        if (envIssue) {
            toast(envIssue, true);
            showAdminInstallSheet();
            return;
        }

        if (isInAppBrowser() || isIos() || isDesktopInstall()) {
            showAdminInstallSheet();
            return;
        }

        await ensureExclusiveAdminSw();
        if (!deferredInstallPrompt) {
            await waitForInstallPrompt(10000);
        }

        if (deferredInstallPrompt) {
            try {
                await deferredInstallPrompt.prompt();
                const choice = await deferredInstallPrompt.userChoice;
                deferredInstallPrompt = null;
                updateInstallButtonState();
                if (choice?.outcome === "accepted") {
                    hideAdminInstallSheet();
                } else {
                    showAdminInstallSheet();
                    setInstallStatus("Anulowano — użyj menu Chrome (⋮) → Zainstaluj aplikację.");
                }
            } catch (e) {
                console.warn(e);
                showAdminInstallSheet();
                setInstallStatus("Automatyczna instalacja niedostępna — użyj menu Chrome (⋮).");
            }
            return;
        }

        showAdminInstallSheet();
    }

    function setupAdminInstall() {
        $("install-admin-btn")?.addEventListener("click", () => triggerAdminPwaInstall());
        $("install-admin-login-btn")?.addEventListener("click", () => triggerAdminPwaInstall());
        $("admin-install-pwa-btn")?.addEventListener("click", () => triggerAdminPwaInstall());
        $("admin-install-copy-link")?.addEventListener("click", async () => {
            const url = new URL("./index.html?install=1", window.location.href).href;
            try {
                await navigator.clipboard.writeText(url);
                setInstallStatus("Link skopiowany. Otwórz w Chrome lub Safari.");
            } catch (e) {
                window.prompt("Skopiuj adres i otwórz w Chrome lub Safari:", url);
            }
        });
        document.querySelectorAll("[data-admin-install-dismiss]").forEach((el) => {
            el.addEventListener("click", hideAdminInstallSheet);
        });
        updateInstallButtonState();
        const params = new URLSearchParams(location.search);
        if (params.has("install") && !isStandaloneMode()) {
            showAdminInstallSheet();
        }
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
        if (firebase.storage) storage = firebase.storage();
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
        closeActiveThread();
        if (convUnsub) {
            convUnsub();
            convUnsub = null;
        }
        allConvDocs = [];
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
            const quick = $("admin-thread-quick");
            if (quick) quick.hidden = true;
            return;
        }
        setThreadUi(true);
        const name = activeConvData.clientName || "Klient";
        $("admin-thread-title").textContent = name;
        const lang = langLabel(activeConvData.clientLang);
        const langEl = $("admin-thread-lang");
        const email = (activeConvData.clientEmail || "").trim();
        const idShort = (activeConvData.clientId || "").slice(0, 10);
        const parts = [];
        if (email) parts.push(email);
        else parts.push("Brak e-mail");
        if (lang) parts.push(`Język: ${lang}`);
        if (idShort) parts.push(`ID: ${idShort}…`);
        if (langEl) {
            langEl.textContent = parts.join(" · ");
            langEl.classList.toggle("admin-meta--warn", !email);
        }
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
        const quick = $("admin-thread-quick");
        if (quick) {
            quick.hidden = false;
            const mailto = $("admin-mailto-btn");
            if (mailto) {
                if (email) {
                    mailto.href = `mailto:${encodeURIComponent(email)}`;
                    mailto.hidden = false;
                } else {
                    mailto.href = "#";
                    mailto.hidden = true;
                }
            }
            const copyBtn = $("admin-copy-email-btn");
            if (copyBtn) copyBtn.disabled = !email;
            const doneBtn = $("admin-done-btn");
            if (doneBtn) {
                doneBtn.disabled = !!activeConvData.adminHandled && !activeConvData.unreadAdmin;
            }
        }
        renderThreadExtras();
    }

    function renderQuoteCard(data) {
        const card = $("admin-quote-card");
        const actions = $("admin-quote-actions");
        const q = data?.quoteSnapshot;
        if (!card) return;
        if (!q?.serviceLabels?.length && !q?.serviceIds?.length) {
            card.hidden = true;
            if (actions) actions.hidden = true;
            return;
        }
        const lines = (q.serviceLabels || q.serviceIds || []).slice(0, 8).join(", ");
        const car = q.carModel ? ` · ${escapeHtml(q.carModel)}` : "";
        card.innerHTML = `<strong>Wycena klienta</strong><p>Klasa ${escapeHtml(q.size || "—")}${car} · ~€${q.totalEur || 0}</p><small>${escapeHtml(lines)}</small>`;
        card.hidden = false;
        if (actions) actions.hidden = false;
    }

    async function copyQuoteSummary() {
        const text = buildQuoteSummaryText(activeConvData);
        if (!text) {
            toast("Brak wyceny w tej rozmowie.", true);
            return;
        }
        try {
            await navigator.clipboard.writeText(text);
            toast("Wycena skopiowana.");
        } catch (e) {
            toast("Nie udało się skopiować.", true);
        }
    }

    function insertQuoteIntoReply() {
        const text = buildQuoteSummaryText(activeConvData);
        const input = $("admin-reply");
        if (!text || !input) {
            toast("Brak wyceny w tej rozmowie.", true);
            return;
        }
        input.value = input.value.trim() ? `${input.value.trim()}\n\n${text}` : text;
        input.focus();
    }

    async function copyClientEmail() {
        const email = (activeConvData?.clientEmail || "").trim();
        if (!email) {
            toast("Brak e-maila klienta.", true);
            return;
        }
        try {
            await navigator.clipboard.writeText(email);
            toast("E-mail skopiowany.");
        } catch (e) {
            toast("Nie udało się skopiować.", true);
        }
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
            toast("Nie zapisano notatki. Spróbuj ponownie.", true);
        }
    }

    async function renderClientHistory(data) {
        const list = $("admin-history-list");
        if (!list || !db) return;
        const clientId = data?.clientId;
        if (!clientId) {
            list.innerHTML = "<li>Brak powiązania z klientem (starsza rozmowa).</li>";
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
            list.innerHTML = "<li>Nie udało się wczytać historii — odśwież stronę.</li>";
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
        renderAdminTemplates();
    }

    function messagePreview(data) {
        return window.CAD_ChatMedia?.lastMessagePreview?.(data) || (data?.text || "").trim() || "—";
    }

    function renderMessages(messages) {
        const box = $("admin-messages");
        if (!box) return;
        box.hidden = false;
        if (!messages.length) {
            box.innerHTML = '<p class="admin-empty-hint">Brak wiadomości w tej rozmowie.</p>';
            return;
        }
        const renderContent = window.CAD_ChatMedia?.renderMessageContent || ((m, esc) => esc(m.text || ""));
        box.innerHTML = messages
            .map((m) => {
                const side = m.sender === "admin" ? "admin" : "client";
                const when = formatTime(m.createdAt);
                const delBtn = m.id
                    ? `<button type="button" class="chat-bubble__delete" data-delete-msg="${escapeHtml(m.id)}" title="Usuń wiadomość" aria-label="Usuń wiadomość"><i class="fas fa-trash-alt"></i></button>`
                    : "";
                return `<div class="chat-bubble-row chat-bubble-row--${side}">
                <div class="chat-bubble chat-bubble--${side}">
                ${renderContent(m, escapeHtml)}
                ${when ? `<time>${escapeHtml(when)}</time>` : ""}
            </div>${delBtn}</div>`;
            })
            .join("");
        box.scrollTop = box.scrollHeight;
    }

    async function postAdminMessage(fields) {
        if (!activeConvId || !db) return;
        const preview = messagePreview(fields);
        const payload = {
            sender: "admin",
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (fields.text) payload.text = fields.text;
        if (fields.imageUrl) payload.imageUrl = fields.imageUrl;
        if (!payload.text && !payload.imageUrl) return;

        await db.collection("conversations").doc(activeConvId).collection("messages").add(payload);
        clearAdminTyping();
        await db.collection("conversations").doc(activeConvId).update({
            lastMessage: preview,
            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastSender: "admin",
            unreadAdmin: false,
            unreadClient: true,
            adminHandled: true,
            typingAdmin: false,
            typingAdminAt: firebase.firestore.FieldValue.delete()
        });
    }

    async function sendAdminPhoto(file) {
        if (!file || !activeConvId || !storage || !auth?.currentUser) {
            toast("Wysyłanie zdjęć jest wyłączone.", true);
            return;
        }
        if (!isEmailAdmin(auth.currentUser)) {
            toast("Zaloguj się e-mailem.", true);
            return;
        }
        toast("Wysyłanie zdjęcia…");
        try {
            const url = await window.CAD_ChatMedia.uploadChatImage(
                storage,
                activeConvId,
                auth.currentUser.uid,
                file
            );
            await postAdminMessage({ imageUrl: url });
            toast("Zdjęcie wysłane.");
            window.CAD_AdminPanel?.refreshStats?.();
        } catch (e) {
            console.warn("[CAD Admin] photo", e);
            const msg =
                e?.message === "too-large"
                    ? "Zdjęcie za duże — wybierz mniejsze."
                    : "Nie wysłano zdjęcia. Spróbuj ponownie.";
            toast(msg, true);
        }
    }

    function renderConvList() {
        const list = $("conv-list");
        if (!list) return;
        const filtered = visibleConversations();
        if (!filtered.length) {
            const emptyMsg =
                listTab === "archive"
                    ? "Brak w archiwum."
                    : listTab === "reply"
                      ? "Brak rozmów wymagających odpowiedzi."
                      : "Brak rozmów.";
            list.innerHTML = `<p class="conv-empty">${emptyMsg}</p>`;
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
                const emailLine = (data.clientEmail || "").trim();
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
                        <small class="conv-item__email${emailLine ? "" : " conv-item__email--missing"}">${escapeHtml(emailLine || "Brak e-mail")}</small>
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

    async function syncConversationLastMessage(convId) {
        const snap = await db
            .collection("conversations")
            .doc(convId)
            .collection("messages")
            .orderBy("createdAt", "desc")
            .limit(1)
            .get();
        if (snap.empty) {
            await db.collection("conversations").doc(convId).update({
                lastMessage: "",
                lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
                lastSender: "admin"
            });
            return;
        }
        const m = snap.docs[0].data();
        await db.collection("conversations").doc(convId).update({
            lastMessage: messagePreview(m),
            lastMessageAt: m.createdAt || firebase.firestore.FieldValue.serverTimestamp(),
            lastSender: m.sender || "client"
        });
    }

    async function deleteMessage(msgId) {
        if (!activeConvId || !msgId || !db) return;
        if (!isEmailAdmin(auth?.currentUser)) {
            toast("Usuwanie wymaga logowania e-mailem administratora.", true);
            return;
        }
        if (!window.confirm("Usunąć tę wiadomość? Zniknie też u klienta po odświeżeniu czatu.")) return;
        try {
            await db
                .collection("conversations")
                .doc(activeConvId)
                .collection("messages")
                .doc(msgId)
                .delete();
            await syncConversationLastMessage(activeConvId);
            toast("Wiadomość usunięta.");
        } catch (e) {
            console.warn("[CAD Admin] deleteMessage", e);
            const denied = e?.code === "permission-denied" || e?.code === "firestore/permission-denied";
            toast(
                denied
                    ? "Brak uprawnień do usunięcia wiadomości. Zaloguj się e-mailem administratora."
                    : "Nie udało się usunąć wiadomości.",
                true
            );
        }
    }

    async function openConversation(convId) {
        const doc = allConvDocs.find((d) => d.id === convId);
        if (!doc || isDeleted(doc.data())) return;

        if (activeConvId && activeConvId !== convId) {
            clearAdminTyping();
        }

        adminTypingFirestore = false;
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
                renderMessages(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
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
            toast("Usuwanie wymaga logowania e-mailem administratora.", true);
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
                        "Rozmowa ukryta na liście. Pełne usunięcie wymaga uprawnień administratora.",
                        true
                    );
                } catch (e2) {
                    toast("Brak uprawnień do usunięcia. Zaloguj się e-mailem administratora.", true);
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
        playNewMessageAlert();
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
            toast("Otwórz panel przez stronę w internecie (https://), nie pliku z dysku.", true);
            return;
        }
        if (Notification.permission === "denied") {
            toast("Odblokuj powiadomienia w ustawieniach przeglądarki.", true);
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
            toast("Zaloguj się e-mailem i hasłem administratora.", true);
            showLogin(true);
            return;
        }
        clearAdminTyping();
        try {
            await postAdminMessage({ text });
            input.value = "";
            window.CAD_AdminPanel?.refreshStats?.();
        } catch (e) {
            console.error("CAD admin send failed:", e);
            toast("Nie udało się wysłać wiadomości. Sprawdź połączenie i spróbuj ponownie.", true);
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
        $("admin-done-btn")?.addEventListener("click", markConversationDone);
        $("admin-copy-email-btn")?.addEventListener("click", copyClientEmail);
        $("admin-quote-copy")?.addEventListener("click", copyQuoteSummary);
        $("admin-quote-insert")?.addEventListener("click", insertQuoteIntoReply);
        $("admin-update-reload")?.addEventListener("click", () => location.reload());
        $("admin-update-dismiss")?.addEventListener("click", () => {
            const banner = $("admin-update-banner");
            if (banner?.dataset.remoteVer) {
                localStorage.setItem(ADMIN_VER_DISMISS_KEY, banner.dataset.remoteVer);
            }
            banner.hidden = true;
        });
        $("conv-search")?.addEventListener("input", (e) => {
            listSearchQuery = e.target.value || "";
            renderConvList();
        });
        document.querySelectorAll(".conv-lang-pill").forEach((pill) => {
            pill.addEventListener("click", () => {
                listLangFilter = pill.dataset.lang || "";
                document.querySelectorAll(".conv-lang-pill").forEach((p) => {
                    p.classList.toggle("active", p === pill);
                });
                renderConvList();
            });
        });
        $("admin-reply")?.addEventListener("keydown", (e) => {
            if (e.key === "Enter") {
                e.preventDefault();
                sendAdminReply();
            }
        });
        $("admin-reply")?.addEventListener("input", scheduleAdminTyping);
        $("admin-reply")?.addEventListener("blur", () => {
            window.setTimeout(() => clearAdminTyping(), 600);
        });
        document.addEventListener("visibilitychange", () => {
            if (document.hidden) clearAdminTyping();
        });
        $("admin-messages")?.addEventListener("click", (e) => {
            const btn = e.target.closest("[data-delete-msg]");
            if (!btn) return;
            deleteMessage(btn.getAttribute("data-delete-msg"));
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
        if (window.CAD_ChatMedia?.chatPhotosEnabled?.()) {
            $("admin-photo-btn")?.addEventListener("click", () => $("admin-photo-input")?.click());
            $("admin-photo-input")?.addEventListener("change", (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) sendAdminPhoto(file);
            });
        } else {
            $("admin-photo-btn")?.remove();
            $("admin-photo-input")?.remove();
        }
    }

    async function onAuthState(user) {
        if (!user) {
            if (convUnsub) {
                convUnsub();
                convUnsub = null;
            }
            allConvDocs = [];
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
        checkAdminUpdateAvailable();
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
        updateInstallButtonState();
        maybePromptAdminInstall();

        const verEl = $("admin-version");
        if (verEl && window.CAD_VERSION?.label) {
            verEl.textContent = `Wersja ${window.CAD_VERSION.label}`;
        }

        if (!ready()) {
            toast("Uzupełnij konfigurację w pliku firebase-config.js.", true);
            showLogin(true);
            return;
        }

        if (location.protocol === "file:") {
            toast("Otwórz panel przez stronę w internecie (https://), nie pliku z dysku.", true);
        }

        const emailInput = $("admin-email");
        const adminMail = cfg().adminEmail;
        if (emailInput && adminMail) {
            emailInput.placeholder = adminMail;
        }

        await initFirebase();
        auth.onAuthStateChanged(onAuthState);
    }

    window.CAD_Admin = {
        toast,
        getDb: () => db,
        getAllConversations: () => allConvDocs,
        openConversation,
        closeThread: closeActiveThread,
        getReplyTemplates,
        saveReplyTemplatesFromText,
        renderAdminTemplates,
        buildQuoteSummaryText
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init);
    } else {
        init();
    }
})();
