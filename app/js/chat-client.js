(function () {

    const STORAGE_CONV = "cad_app_conversation_id";

    const STORAGE_NAME = "cad_app_client_name";

    let db = null;

    let auth = null;

    let unsubscribe = null;

    let convUnsub = null;

    let lastNotifyAt = 0;

    let hasThread = false;



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

        return true;

    }



    async function ensureConversation(name) {

        let convId = localStorage.getItem(STORAGE_CONV);

        const lang = window.CAD_APP?.locale || "pl";



        if (convId) {

            const doc = await db.collection("conversations").doc(convId).get();

            if (doc.exists) return convId;

        }



        const ref = await db.collection("conversations").add({

            clientName: name,

            clientLang: lang,

            lastMessage: "",

            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),

            unreadAdmin: false,

            unreadClient: false,

            archived: false,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        });

        convId = ref.id;

        localStorage.setItem(STORAGE_CONV, convId);

        localStorage.setItem(STORAGE_NAME, name);

        return convId;

    }



    async function sendMessage(text, sender) {

        const convId = localStorage.getItem(STORAGE_CONV);

        if (!convId) throw new Error("No conversation");

        const payload = {

            text,

            sender,

            createdAt: firebase.firestore.FieldValue.serverTimestamp()

        };

        await db.collection("conversations").doc(convId).collection("messages").add(payload);

        const patch = {

            lastMessage: text,

            lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),

            unreadAdmin: sender === "client"

        };

        if (sender === "client") {

            patch.unreadClient = false;

            patch.archived = false;

        }

        await db.collection("conversations").doc(convId).update(patch);

    }



    function listenConversationMeta(convId) {

        if (convUnsub) convUnsub();

        convUnsub = db.collection("conversations").doc(convId).onSnapshot((doc) => {

            if (!doc.exists) return;

            const data = doc.data();

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

            const convId = await ensureConversation(name);

            await sendMessage(firstMsg, "client");

            showThread(true);

            listenMessages(convId);

            setStatus(appT("chatWaiting"));

            if (Notification.permission === "default") {

                setTimeout(() => requestClientNotifications(), 600);

            }

        } catch (e) {

            console.error("CAD chat start failed:", e);

            const code = e?.code || "";

            if (code === "auth/operation-not-allowed") {

                setStatus("W Firebase włącz logowanie Anonymous (Authentication → Sign-in method).", true);

            } else if (code === "permission-denied" || code === "firestore/permission-denied") {

                setStatus("Brak uprawnień Firestore — opublikuj reguły w Firebase Console.", true);

            } else {

                setStatus(appT("chatError"), true);

            }

        }

    }



    async function sendChatReply() {

        const input = document.getElementById("chat-reply-input");

        const text = input?.value.trim();

        if (!text) return;

        try {

            await sendMessage(text, "client");

            input.value = "";

        } catch (e) {

            setStatus(appT("chatError"), true);

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

            setStatus(appT("chatWaiting"));

            const doc = await db.collection("conversations").doc(convId).get();

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

        document.getElementById("chat-notify-btn")?.addEventListener("click", requestClientNotifications);



        document.addEventListener("visibilitychange", () => {

            if (!document.hidden && isChatPanelActive()) clearUnread();

        });

    }



    window.CAD_ChatClient = {

        init() {

            try {

                bindEvents();

                if (localStorage.getItem(STORAGE_CONV)) {

                    setTimeout(() => resumeConversation(), 0);

                } else if (!isReady()) {

                    setStatus(appT("chatOffline"), true);

                }

            } catch (e) {

                console.error("CAD chat init failed", e);

            }

        },

        clearUnread

    };

})();


