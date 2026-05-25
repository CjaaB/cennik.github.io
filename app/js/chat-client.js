(function () {

    const STORAGE_CONV = "cad_app_conversation_id";

    const STORAGE_NAME = "cad_app_client_name";

    let db = null;

    let auth = null;

    let storage = null;

    let messaging = null;

    let swRegistration = null;

    let unsubscribe = null;

    let convUnsub = null;

    let lastNotifyAt = 0;

    let hasThread = false;

    let typingDebounceTimer = null;

    let typingIdleTimer = null;

    let staleTypingClearAttempted = false;

    let typingBubbleUntil = 0;

    let lastTypingAdminAtMs = null;

    let typingRecheckTimer = null;

    const TYPING_TTL_MS = 8000;

    const TYPING_SHOW_MS = 5500;



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

        const renderContent = window.CAD_ChatMedia?.renderMessageContent || ((m, esc) => esc(m.text || ""));

        box.innerHTML = messages

            .map(

                (m) => `

            <div class="chat-bubble chat-bubble--${m.sender === "admin" ? "admin" : "client"}">

                ${renderContent(m, escapeHtml)}

                <time>${formatTime(m.createdAt)}</time>

            </div>`

            )

            .join("");

        box.scrollTop = box.scrollHeight;

    }



    function messagePreview(data) {

        return window.CAD_ChatMedia?.lastMessagePreview?.(data) || (data?.text || "").trim() || "";

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

        if (show) {
            hideTypingIndicator();
            staleTypingClearAttempted = false;
            updateNotifyButton();
        } else {
            hideTypingIndicator();
        }

    }

    function resetClientChat(statusMessage) {
        localStorage.removeItem(STORAGE_CONV);
        staleTypingClearAttempted = false;
        typingBubbleUntil = 0;
        lastTypingAdminAtMs = null;
        stopTypingRecheckTimer();
        clearClientTyping();
        hideTypingIndicator();
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

    function syncAdminTypingPulse(data) {
        if (!data || data.typingAdmin !== true) {
            typingBubbleUntil = 0;
            lastTypingAdminAtMs = null;
            return;
        }
        const ms = data.typingAdminAt?.toDate?.()?.getTime?.();
        if (!ms) return;
        if (ms !== lastTypingAdminAtMs) {
            lastTypingAdminAtMs = ms;
            typingBubbleUntil = Date.now() + TYPING_SHOW_MS;
        }
    }

    function isAdminTypingVisibleNow() {
        return Date.now() < typingBubbleUntil;
    }

    function hideTypingIndicator() {
        const el = document.getElementById("chat-typing-indicator");
        if (el) {
            el.hidden = true;
            el.setAttribute("hidden", "");
        }
    }

    function showTypingIndicatorIfNeeded() {
        const el = document.getElementById("chat-typing-indicator");
        if (!el) return false;
        const show = isAdminTypingVisibleNow();
        if (show) el.removeAttribute("hidden");
        else el.setAttribute("hidden", "");
        el.hidden = !show;
        return show;
    }

    async function clearStaleAdminTyping(convId) {
        if (!convId || !db) return;
        try {
            await db.collection("conversations").doc(convId).update({
                typingAdmin: false,
                typingAdminAt: firebase.firestore.FieldValue.delete()
            });
        } catch (e) {
            /* ignore */
        }
    }

    function stopTypingRecheckTimer() {
        if (typingRecheckTimer) {
            clearInterval(typingRecheckTimer);
            typingRecheckTimer = null;
        }
    }

    function startTypingRecheckTimer() {
        if (typingRecheckTimer) return;
        typingRecheckTimer = window.setInterval(() => {
            if (!hasThread) {
                hideTypingIndicator();
                return;
            }
            const show = showTypingIndicatorIfNeeded();
            if (!show && Date.now() >= typingBubbleUntil) {
                const convId = localStorage.getItem(STORAGE_CONV);
                if (convId && !staleTypingClearAttempted) {
                    staleTypingClearAttempted = true;
                    clearStaleAdminTyping(convId);
                }
            }
        }, 1000);
    }

    function updateClientTypingUI(data) {
        const box = document.getElementById("chat-messages");
        if (!hasThread) {
            hideTypingIndicator();
            return;
        }

        syncAdminTypingPulse(data);
        const show = showTypingIndicatorIfNeeded();

        const convId = localStorage.getItem(STORAGE_CONV);
        if (!show && data?.typingAdmin === true && convId && !staleTypingClearAttempted) {
            staleTypingClearAttempted = true;
            clearStaleAdminTyping(convId);
        }

        const el = document.getElementById("chat-typing-indicator");
        const label = el?.querySelector(".chat-typing__label");
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



    function notifyAdminReply(data) {

        const now = Date.now();

        if (now - lastNotifyAt < 4000) return;

        lastNotifyAt = now;

        const preview =
            typeof data === "string" ? data : messagePreview(data) || appT("chatPhotoSent");

        if (Notification.permission === "granted") {

            const body = preview.slice(0, 140);

            new Notification(appT("chatNotifyTitle"), {

                body,

                icon: "../assets/logo1.png",

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

            icon: "../assets/logo1.png",

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

        if (firebase.storage) storage = firebase.storage();

        if (!auth.currentUser) {

            await auth.signInAnonymously();

        }

        if (cfg.vapidKey && firebase.messaging?.isSupported?.()) {

            messaging = firebase.messaging();

            messaging.onMessage((payload) => {

                const title = payload.notification?.title || appT("chatNotifyTitle");

                const body = payload.notification?.body || "";

                if (Notification.permission === "granted") {

                    new Notification(title, { body, icon: "../assets/logo1.png", tag: "cad-client-fcm" });

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

            const clientId = auth?.currentUser?.uid || window.CAD_DATA?.getOrCreateClientId?.() || "anon";

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



    function getStableClientId() {
        const uid = auth?.currentUser?.uid;
        if (!uid) throw new Error("Brak sesji — odśwież stronę.");
        return uid;
    }

    async function upsertClientProfile(name, email, convId) {
        const clientId = getStableClientId();
        const ref = db.collection("clients").doc(clientId);
        const snap = await ref.get();
        const payload = {
            displayName: name,
            email: String(email || "").trim().toLowerCase(),
            lastSeenAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastConvId: convId,
            lang: window.CAD_APP?.locale || "pl"
        };
        if (!snap.exists) {
            payload.firstSeenAt = firebase.firestore.FieldValue.serverTimestamp();
        }
        await ref.set(payload, { merge: true });
    }

    async function findConversationForClient(clientId) {
        try {
            const snap = await db
                .collection("conversations")
                .where("clientId", "==", clientId)
                .orderBy("lastMessageAt", "desc")
                .limit(8)
                .get();
            for (const doc of snap.docs) {
                if (!isConvDeleted(doc.data())) return doc.id;
            }
        } catch (e) {
            console.warn("[CAD] findConversationForClient", e);
        }
        return null;
    }

    async function ensureConversation(name, email) {

        const clientId = getStableClientId();
        const lang = window.CAD_APP?.locale || "pl";
        let convId = localStorage.getItem(STORAGE_CONV);

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
            if (doc.exists && !isConvDeleted(doc.data()) && doc.data().clientId === clientId) {
                const patch = { clientName: name, clientId, clientEmail: email };
                if (quoteSnapshot) patch.quoteSnapshot = quoteSnapshot;
                await db.collection("conversations").doc(convId).update(patch);
                await upsertClientProfile(name, email, convId);
                return convId;
            }
            localStorage.removeItem(STORAGE_CONV);
        }

        convId = await findConversationForClient(clientId);
        if (convId) {
            localStorage.setItem(STORAGE_CONV, convId);
            const patch = { clientName: name, clientId, clientEmail: email, archived: false };
            if (quoteSnapshot) patch.quoteSnapshot = quoteSnapshot;
            await db.collection("conversations").doc(convId).update(patch);
            await upsertClientProfile(name, email, convId);
            return convId;
        }

        const payload = {

            clientName: name,

            clientId,

            clientEmail: email,

            clientLang: lang,

            lastMessage: "",

            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),

            lastSender: "client",

            unreadAdmin: false,

            unreadClient: false,

            archived: false,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        };

        if (quoteSnapshot) payload.quoteSnapshot = quoteSnapshot;

        const ref = await db.collection("conversations").add(payload);

        convId = ref.id;

        localStorage.setItem(STORAGE_CONV, convId);

        localStorage.setItem(STORAGE_NAME, name);

        await upsertClientProfile(name, email, convId);

        return convId;

    }



    async function postChatMessage(fields, sender) {

        let convId = localStorage.getItem(STORAGE_CONV);

        if (!convId) throw new Error("No conversation");

        const convSnap = await db.collection("conversations").doc(convId).get();

        if (!convSnap.exists || isConvDeleted(convSnap.data())) {
            localStorage.removeItem(STORAGE_CONV);
            const name = localStorage.getItem(STORAGE_NAME) || "Klient";
            let email = convSnap.data()?.clientEmail || "";
            if (!email) {
                try {
                    const prof = await db.collection("clients").doc(getStableClientId()).get();
                    email = prof.data()?.email || "";
                } catch (e) {
                    /* ignore */
                }
            }
            convId = await ensureConversation(name, email);
        }

        const payload = {

            sender,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        };

        if (fields.text) payload.text = fields.text;

        if (fields.imageUrl) payload.imageUrl = fields.imageUrl;

        if (!payload.text && !payload.imageUrl) return;

        await db.collection("conversations").doc(convId).collection("messages").add(payload);

        const preview = messagePreview(fields);

        const patch = {

            lastMessage: preview,

            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),

            lastSender: sender,

            unreadAdmin: sender === "client"

        };

        if (sender === "client") {

            patch.unreadClient = false;

            patch.archived = false;

            patch.typingClient = false;

            patch.adminHandled = false;

        } else {

            patch.unreadClient = true;

        }

        await db.collection("conversations").doc(convId).update(patch);

        return convId;

    }



    async function sendMessage(text, sender) {

        await postChatMessage({ text }, sender);

    }



    function listenConversationMeta(convId) {

        if (convUnsub) convUnsub();

        staleTypingClearAttempted = false;
        typingBubbleUntil = 0;
        lastTypingAdminAtMs = null;
        startTypingRecheckTimer();

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

                            notifyAdminReply(data);
                        } else {

                            clearUnread();

                        }

                    });



                    if (isChatPanelActive()) clearUnread();

                },

                () => setStatus(appT("chatError"), true)

            );

    }



    function reportChatError(e, context) {
        if (context) console.error(context, e);
        const code = e?.code || "";
        if (
            code === "auth/operation-not-allowed" ||
            code === "permission-denied" ||
            code === "firestore/permission-denied"
        ) {
            setStatus(appT("chatServiceUnavailable"), true);
            return;
        }
        setStatus(appT("chatError"), true);
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

        if (!email || !email.includes("@")) {

            setStatus(appT("chatEmailRequired"), true);

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
            reportChatError(e, "CAD chat start failed:");
        }

    }



    async function sendClientPhoto(file) {
        if (!file) return;
        if (location.protocol === "file:") {
            setStatus(appT("chatPhotoNeedHttps"), true);
            return;
        }
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
            if (!storage || !auth?.currentUser) {
                setStatus(appT("chatPhotoError"), true);
                return;
            }
            setStatus(appT("chatPhotoSending"));
            const convId = localStorage.getItem(STORAGE_CONV);
            const url = await window.CAD_ChatMedia.uploadChatImage(
                storage,
                convId,
                auth.currentUser.uid,
                file
            );
            await postChatMessage({ imageUrl: url }, "client");
            setStatus("");
            setStatus(appT("chatPhotoSent"));
            window.setTimeout(() => setStatus(""), 2500);
        } catch (e) {
            console.warn("[CAD] client photo", e);
            const msg =
                e?.message === "too-large" ? appT("chatPhotoTooLarge") : appT("chatPhotoError");
            setStatus(msg, true);
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
            reportChatError(e, "CAD chat send failed:");
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

            const uid = auth?.currentUser?.uid;
            if (uid && doc.data()?.clientId && doc.data().clientId !== uid) {
                localStorage.removeItem(STORAGE_CONV);
                showThread(false);
                return;
            }

            if (doc.data()?.unreadClient) setNavBadge(true);

            const data = doc.data();
            updateClientTypingUI(data);
            if (data?.typingAdmin === true) {
                clearStaleAdminTyping(convId);
            }

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

        if (window.CAD_ChatMedia?.chatPhotosEnabled?.()) {
            document.getElementById("chat-photo-btn")?.addEventListener("click", () => {
                document.getElementById("chat-photo-input")?.click();
            });
            document.getElementById("chat-photo-input")?.addEventListener("change", (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) sendClientPhoto(file);
            });
        } else {
            document.getElementById("chat-photo-btn")?.remove();
            document.getElementById("chat-photo-input")?.remove();
        }

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
        hideTypingIndicator,
        onChatPanelOpen() {
            typingBubbleUntil = 0;
            lastTypingAdminAtMs = null;
            staleTypingClearAttempted = false;
            hideTypingIndicator();
            const convId = localStorage.getItem(STORAGE_CONV);
            if (convId) clearStaleAdminTyping(convId);
        },

        refreshHours,

        updateQuoteSnapshot

    };

})();


