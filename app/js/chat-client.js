(function () {

    const STORAGE_CONV = "cad_app_conversation_id";

    const STORAGE_NAME = "cad_app_client_name";

    let db = null;

    let auth = null;

    let messaging = null;

    let swRegistration = null;

    let unsubscribe = null;

    let convUnsub = null;

    let lastNotifyAt = 0;

    let hasThread = false;

    let typingDebounceTimer = null;

    let typingIdleTimer = null;

    const TYPING_TTL_MS = 8000;



    function isReady() {

        const cfg = window.CAD_FIREBASE;

        return cfg && cfg.enabled && cfg.projectId && cfg.apiKey;

    }



    function setStatus(message, isError) {

        const el = document.getElementById("chat-status");

        if (!el) return;

        el.textContent = message;

        el.classList.toggle("chat-status--error", !!isError);

        el.hidden = !message;

    }



    function formatTime(ts) {

        if (!ts) return "";

        const d = ts.toDate ? ts.toDate() : new Date(ts);

        return d.toLocaleString(undefined, { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });

    }



    function renderMessages(messages) {

        const box = document.getElementById("chat-messages");

        if (!box) return;

        box.innerHTML = messages

            .map(

                (m) => `

            <div class="chat-bubble chat-bubble--${m.sender === "admin" ? "admin" : "client"}">

                ${escapeHtml(m.text)}

                <time>${formatTime(m.createdAt)}</time>

            </div>`

            )

            .join("");

        box.scrollTop = box.scrollHeight;

    }



    function escapeHtml(str) {

        return String(str)

            .replace(/&/g, "&amp;")

            .replace(/</g, "&lt;")

            .replace(/>/g, "&gt;")

            .replace(/"/g, "&quot;");

    }



    function showThread(show) {

        hasThread = show;

        document.getElementById("chat-setup")?.classList.toggle("active", !show);

        document.getElementById("chat-thread")?.classList.toggle("active", show);

        if (show) updateNotifyButton();

    }

    function resetClientChat(statusMessage) {
        localStorage.removeItem(STORAGE_CONV);
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        if (convUnsub) {
            convUnsub();
            convUnsub = null;
        }
        hasThread = false;
        showThread(false);
        const box = document.getElementById("chat-messages");
        if (box) box.innerHTML = "";
        setNavBadge(false);
        if (statusMessage) setStatus(statusMessage, false);
    }

    function isConvDeleted(data) {
        return data && data.deleted === true;
    }

    function isTypingFresh(ts) {
        if (!ts?.toDate) return false;
        return Date.now() - ts.toDate().getTime() < TYPING_TTL_MS;
    }

    function updateClientTypingUI(data) {
        const el = document.getElementById("chat-typing-indicator");
        const box = document.getElementById("chat-messages");
        if (!el || !hasThread) return;
        const show = data?.typingAdmin === true && isTypingFresh(data.typingAdminAt);
        el.hidden = !show;
        const label = el.querySelector(".chat-typing__label");
        if (label) label.textContent = appT("chatTypingAdmin");
        if (show && box) {
            window.requestAnimationFrame(() => {
                box.scrollTop = box.scrollHeight;
            });
        }
    }

    async function setClientTyping(active) {
        const convId = localStorage.getItem(STORAGE_CONV);
        if (!convId || !db) return;
        try {
            await db.collection("conversations").doc(convId).update({
                typingClient: active,
                typingClientAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        } catch (e) {
            /* ignore */
        }
    }

    function scheduleClientTyping() {
        clearTimeout(typingDebounceTimer);
        clearTimeout(typingIdleTimer);
        typingDebounceTimer = setTimeout(() => {
            setClientTyping(true);
            typingIdleTimer = setTimeout(() => setClientTyping(false), 4000);
        }, 280);
    }

    function clearClientTyping() {
        clearTimeout(typingDebounceTimer);
        clearTimeout(typingIdleTimer);
        setClientTyping(false);
    }



    function isChatPanelActive() {

        return window.CAD_APP?.panel === "chat";

    }



    function setNavBadge(show) {

        const badge = document.getElementById("chat-nav-badge");

        if (!badge) return;

        if (show) {

            badge.textContent = "1";

            badge.classList.add("show");

        } else {

            badge.textContent = "";

            badge.classList.remove("show");

        }

    }



    function updateNotifyButton() {

        const btn = document.getElementById("chat-notify-btn");

        if (!btn) return;

        if (!hasThread || !("Notification" in window)) {

            btn.hidden = true;

            return;

        }

        btn.hidden = false;

        const span = btn.querySelector("span");

        if (Notification.permission === "granted") {

            if (span) span.textContent = appT("chatNotifyOn");

            btn.classList.add("is-on");

            btn.disabled = true;

        } else if (Notification.permission === "denied") {

            if (span) span.textContent = appT("chatNotifyBlocked");

            btn.classList.remove("is-on");

            btn.disabled = true;

        } else {

            if (span) span.textContent = appT("chatNotifyEnable");

            btn.classList.remove("is-on");

            btn.disabled = false;

        }

    }



    function notifyAdminReply(text) {

        const now = Date.now();

        if (now - lastNotifyAt < 4000) return;

        lastNotifyAt = now;



        if (Notification.permission === "granted") {

            const body = (text || "").slice(0, 140);

            new Notification(appT("chatNotifyTitle"), {

                body,

                icon: "../logo1.png",

                tag: "cad-client-chat",

                data: { panel: "chat" }

            });

        }



        if (!isChatPanelActive() || document.hidden) {

            setNavBadge(true);

        }

    }



    async function requestClientNotifications() {

        if (!("Notification" in window)) {

            setStatus(appT("chatNotifyUnsupported"), true);

            return;

        }

        if (location.protocol === "file:") {

            setStatus(appT("chatNotifyNeedHttps"), true);

            return;

        }

        if (Notification.permission === "denied") {

            setStatus(appT("chatNotifyDenied"), true);

            updateNotifyButton();

            return;

        }

        if (Notification.permission === "default") {

            const result = await Notification.requestPermission();

            if (result !== "granted") {

                setStatus(result === "denied" ? appT("chatNotifyDenied") : appT("chatNotifySkipped"), true);

                updateNotifyButton();

                return;

            }

        }

        updateNotifyButton();

        setStatus(appT("chatNotifyReady"));

        new Notification(appT("chatNotifyTitle"), {

            body: appT("chatNotifyTest"),

            icon: "../logo1.png",

            tag: "cad-client-test"

        });

    }



    async function clearUnread() {

        setNavBadge(false);

        const convId = localStorage.getItem(STORAGE_CONV);

        if (!convId || !db) return;

        try {

            await db.collection("conversations").doc(convId).update({ unreadClient: false });

        } catch (e) {

            /* ignore */

        }

    }



    async function initFirebase() {

        if (!isReady() || typeof firebase === "undefined") return false;

        const cfg = window.CAD_FIREBASE;

        if (!firebase.apps.length) {

            firebase.initializeApp({

                apiKey: cfg.apiKey,

                authDomain: cfg.authDomain,

                projectId: cfg.projectId,

                storageBucket: cfg.storageBucket,

                messagingSenderId: cfg.messagingSenderId,

                appId: cfg.appId

            });

        }

        auth = firebase.auth();

        db = firebase.firestore();

        if (!auth.currentUser) {

            await auth.signInAnonymously();

        }

        if (cfg.vapidKey && firebase.messaging?.isSupported?.()) {

            messaging = firebase.messaging();

            messaging.onMessage((payload) => {

                const title = payload.notification?.title || appT("chatNotifyTitle");

                const body = payload.notification?.body || "";

                if (Notification.permission === "granted") {

                    new Notification(title, { body, icon: "../logo1.png", tag: "cad-client-fcm" });

                }

                if (!isChatPanelActive() || document.hidden) setNavBadge(true);

            });

        }

        return true;

    }



    async function ensureClientSw() {

        if (!("serviceWorker" in navigator)) return null;

        try {

            swRegistration = await navigator.serviceWorker.ready;

            return swRegistration;

        } catch (e) {

            return null;

        }

    }



    async function registerClientPushToken(convId) {

        const cfg = window.CAD_FIREBASE;

        if (!messaging || !cfg?.vapidKey || !db || !convId) return;

        await ensureClientSw();

        if (!swRegistration) return;

        try {

            const token = await messaging.getToken({

                vapidKey: cfg.vapidKey,

                serviceWorkerRegistration: swRegistration

            });

            if (!token) return;

            const clientId = window.CAD_DATA?.getOrCreateClientId?.() || "anon";

            await db.collection("clientTokens").doc(token.slice(0, 120)).set({

                token,

                convId,

                clientId,

                updatedAt: firebase.firestore.FieldValue.serverTimestamp()

            });

        } catch (e) {

            console.warn("[CAD] client FCM", e);

        }

    }



    function refreshHours() {

        const el = document.getElementById("chat-hours");

        if (!el || !window.CAD_DATA?.businessHoursText) return;

        const text = window.CAD_DATA.businessHoursText(window.CAD_APP?.locale || "pl");

        if (text) {

            el.textContent = text;

            el.hidden = false;

        }

    }



    async function updateQuoteSnapshot(snapshot) {

        const convId = localStorage.getItem(STORAGE_CONV);

        if (!convId || !db || !snapshot) return;

        try {

            await db.collection("conversations").doc(convId).update({ quoteSnapshot: snapshot });

        } catch (e) {

            /* ignore */

        }

    }



    async function ensureConversation(name, email) {

        let convId = localStorage.getItem(STORAGE_CONV);

        const lang = window.CAD_APP?.locale || "pl";

        const clientId = window.CAD_DATA?.getOrCreateClientId?.() || "anon";

        const quoteRaw = localStorage.getItem("cad_calculator_state_v2");

        let quoteSnapshot = null;

        try {

            if (quoteRaw) {

                const st = JSON.parse(quoteRaw);

                quoteSnapshot = window.CAD_DATA?.buildQuoteSnapshot?.(st, lang);

            }

        } catch (e) {

            /* ignore */

        }



        if (convId) {
            const doc = await db.collection("conversations").doc(convId).get();
            if (doc.exists && !isConvDeleted(doc.data())) {
                const patch = { clientName: name, clientId };
                if (email) patch.clientEmail = email;
                if (quoteSnapshot) patch.quoteSnapshot = quoteSnapshot;
                try {
                    await db.collection("conversations").doc(convId).update(patch);
                } catch (e) {
                    /* ignore */
                }
                return convId;
            }
            localStorage.removeItem(STORAGE_CONV);
        }



        const payload = {

            clientName: name,

            clientId,

            clientLang: lang,

            lastMessage: "",

            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),

            lastSender: "client",

            unreadAdmin: false,

            unreadClient: false,

            archived: false,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        };

        if (email) payload.clientEmail = email;

        if (quoteSnapshot) payload.quoteSnapshot = quoteSnapshot;

        const ref = await db.collection("conversations").add(payload);

        convId = ref.id;

        localStorage.setItem(STORAGE_CONV, convId);

        localStorage.setItem(STORAGE_NAME, name);

        return convId;

    }



    async function sendMessage(text, sender) {

        let convId = localStorage.getItem(STORAGE_CONV);

        if (!convId) throw new Error("No conversation");

        const convSnap = await db.collection("conversations").doc(convId).get();

        if (!convSnap.exists || isConvDeleted(convSnap.data())) {
            localStorage.removeItem(STORAGE_CONV);
            const name = localStorage.getItem(STORAGE_NAME) || "Klient";
            convId = await ensureConversation(name, "");
        }

        const payload = {

            text,

            sender,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        };

        await db.collection("conversations").doc(convId).collection("messages").add(payload);

        const patch = {

            lastMessage: text,

            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),

            lastSender: sender,

            unreadAdmin: sender === "client"

        };

        if (sender === "client") {

            patch.unreadClient = false;

            patch.archived = false;

            patch.typingClient = false;

        } else {

            patch.unreadClient = true;

        }

        await db.collection("conversations").doc(convId).update(patch);

    }



    function listenConversationMeta(convId) {

        if (convUnsub) convUnsub();

        convUnsub = db.collection("conversations").doc(convId).onSnapshot((doc) => {
            if (!doc.exists || isConvDeleted(doc.data())) {
                resetClientChat(appT("chatClosedByAdmin"));
                return;
            }

            const data = doc.data();

            updateClientTypingUI(data);

            if (data.unreadClient && !isChatPanelActive()) {
                setNavBadge(true);
            }
        });

    }



    function listenMessages(convId) {

        if (unsubscribe) unsubscribe();

        listenConversationMeta(convId);

        unsubscribe = db

            .collection("conversations")

            .doc(convId)

            .collection("messages")

            .orderBy("createdAt", "asc")

            .onSnapshot(

                (snap) => {

                    const messages = snap.docs.map((d) => ({ id: d.id, ...d.data() }));

                    renderMessages(messages);



                    snap.docChanges().forEach((change) => {

                        if (change.type !== "added") return;

                        const data = change.doc.data();

                        if (data.sender !== "admin") return;

                        const onChat = isChatPanelActive() && !document.hidden;

                        if (!onChat) {

                            notifyAdminReply(data.text);

                        } else {

                            clearUnread();

                        }

                    });



                    if (isChatPanelActive()) clearUnread();

                },

                () => setStatus(appT("chatError"), true)

            );

    }



    async function startConversation() {

        const nameInput = document.getElementById("chat-client-name");

        const msgInput = document.getElementById("chat-first-message");

        const name = nameInput?.value.trim();

        const email = document.getElementById("chat-client-email")?.value.trim() || "";

        const firstMsg = msgInput?.value.trim();

        if (!name || !firstMsg) {

            setStatus(appT("chatEmpty"), true);

            return;

        }



        setStatus("");

        try {

            const ok = await initFirebase();

            if (!ok) {

                setStatus(appT("chatOffline"), true);

                return;

            }

            const convId = await ensureConversation(name, email);

            await sendMessage(firstMsg, "client");

            showThread(true);

            listenMessages(convId);

            refreshHours();

            setStatus(appT("chatWaiting"));

            await registerClientPushToken(convId);

            if (Notification.permission === "default") {

                setTimeout(() => requestClientNotifications(), 600);

            }

        } catch (e) {

            console.error("CAD chat start failed:", e);

            const code = e?.code || "";

            if (code === "auth/operation-not-allowed") {

                setStatus("W Firebase włącz logowanie Anonymous (Authentication → Sign-in method).", true);

            } else if (code === "permission-denied" || code === "firestore/permission-denied") {

                setStatus(
                    "Brak uprawnień Firestore. Firebase → Rules → wklej app/firestore.rules → Publish. Authentication → włącz Anonymous.",
                    true
                );

            } else {

                setStatus(appT("chatError"), true);

            }

        }

    }



    async function sendChatReply() {
        const input = document.getElementById("chat-reply-input");
        const text = input?.value.trim();
        if (!text) return;

        clearClientTyping();

        try {
            const ok = await initFirebase();
            if (!ok) {
                setStatus(appT("chatOffline"), true);
                return;
            }
            if (!localStorage.getItem(STORAGE_CONV)) {
                setStatus(appT("chatEmpty"), true);
                showThread(false);
                return;
            }
            await sendMessage(text, "client");
            input.value = "";
            setStatus("");
        } catch (e) {
            console.error("CAD chat send failed:", e);
            const code = e?.code || "";
            if (code === "auth/operation-not-allowed") {
                setStatus("W Firebase włącz Anonymous (Authentication → Sign-in method).", true);
            } else if (code === "permission-denied" || code === "firestore/permission-denied") {
                setStatus(
                    "Brak uprawnień Firestore. Firebase → Rules → wklej app/firestore.rules → Publish. Authentication → włącz Anonymous.",
                    true
                );
            } else {
                setStatus(appT("chatError"), true);
            }
        }
    }



    async function resumeConversation() {

        if (!isReady()) {

            setStatus(appT("chatOffline"), true);

            return;

        }

        const convId = localStorage.getItem(STORAGE_CONV);

        const name = localStorage.getItem(STORAGE_NAME);

        if (!convId || !name) return;



        try {

            const ok = await initFirebase();

            if (!ok) return;

            showThread(true);

            listenMessages(convId);

            refreshHours();

            setStatus(appT("chatWaiting"));

            await registerClientPushToken(convId);

            const doc = await db.collection("conversations").doc(convId).get();

            if (!doc.exists || isConvDeleted(doc.data())) {
                resetClientChat(appT("chatClosedByAdmin"));
                return;
            }

            if (doc.data()?.unreadClient) setNavBadge(true);

        } catch (e) {
            localStorage.removeItem(STORAGE_CONV);
        }

    }



    function bindEvents() {

        document.getElementById("chat-start-btn")?.addEventListener("click", startConversation);

        document.getElementById("chat-send-btn")?.addEventListener("click", sendChatReply);

        document.getElementById("chat-reply-input")?.addEventListener("keydown", (e) => {

            if (e.key === "Enter") {

                e.preventDefault();

                sendChatReply();

            }

        });

        document.getElementById("chat-reply-input")?.addEventListener("input", scheduleClientTyping);

        document.getElementById("chat-notify-btn")?.addEventListener("click", requestClientNotifications);

        window.addEventListener("cad:app-locale-change", () => {
            const convId = localStorage.getItem(STORAGE_CONV);
            if (convId && db) {
                db.collection("conversations")
                    .doc(convId)
                    .get()
                    .then((doc) => doc.exists && updateClientTypingUI(doc.data()));
            }
        });



        document.addEventListener("visibilitychange", () => {

            if (!document.hidden && isChatPanelActive()) clearUnread();

        });

    }



    window.CAD_ChatClient = {

        init() {

            try {

                bindEvents();

                refreshHours();

                window.addEventListener("cad:settings-loaded", refreshHours);

                if (localStorage.getItem(STORAGE_CONV)) {

                    setTimeout(() => resumeConversation(), 0);

                } else if (!isReady()) {

                    setStatus(appT("chatOffline"), true);

                }

            } catch (e) {

                console.error("CAD chat init failed", e);

            }

        },

        clearUnread,

        refreshHours,

        updateQuoteSnapshot

    };

})();


