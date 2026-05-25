const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

const ADMIN_PANEL_URL = "https://cjaab.github.io/cennik.github.io/app/admin/";

/**
 * Opcjonalny e-mail do admina (Gmail / inny SMTP).
 * Ustawienie (gdy będziesz wdrażać Functions):
 *   firebase functions:config:set smtp.user="twoj@gmail.com" smtp.pass="haslo_aplikacji" smtp.to="yakasu1999@gmail.com"
 * Hasło aplikacji Gmail: konto Google → Bezpieczeństwo → Weryfikacja 2-etapowa → Hasła aplikacji.
 */
async function sendAdminEmailIfConfigured(conv, msg, convId) {
    const smtp = functions.config().smtp || {};
    const user = smtp.user;
    const pass = smtp.pass;
    const to = smtp.to || user;
    if (!user || !pass || !to) return;

    const name = conv.clientName || "Klient";
    const text = (msg.text || "").trim() || "(pusta wiadomość)";
    const lang = conv.clientLang ? ` · język: ${conv.clientLang}` : "";
    const emailLine = conv.clientEmail ? `\nE-mail klienta: ${conv.clientEmail}` : "";

    const transporter = nodemailer.createTransport({
        host: smtp.host || "smtp.gmail.com",
        port: Number(smtp.port || 587),
        secure: false,
        auth: { user, pass }
    });

    await transporter.sendMail({
        from: `"CAD Chat" <${user}>`,
        to,
        subject: `CAD — nowa wiadomość od ${name}`,
        text: [
            `Klient: ${name}${lang}`,
            emailLine.trim(),
            "",
            text.slice(0, 1500),
            "",
            `Odpowiedz w panelu: ${ADMIN_PANEL_URL}`,
            `ID rozmowy: ${convId}`
        ]
            .filter(Boolean)
            .join("\n"),
        html: [
            `<p><strong>${escapeHtml(name)}</strong> napisał w czacie Car All Detailing.</p>`,
            conv.clientEmail ? `<p>E-mail: ${escapeHtml(conv.clientEmail)}</p>` : "",
            `<blockquote style="border-left:3px solid #d4af37;padding-left:12px;margin:16px 0">`,
            escapeHtml(text.slice(0, 1500)).replace(/\n/g, "<br>"),
            `</blockquote>`,
            `<p><a href="${ADMIN_PANEL_URL}">Otwórz CAD Admin</a></p>`
        ].join("")
    });
}

function escapeHtml(s) {
    return String(s)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");
}

async function sendAdminPush(conv, msg, convId) {
    const tokensSnap = await admin.firestore().collection("adminTokens").get();
    if (tokensSnap.empty) return;

    const tokens = [];
    tokensSnap.forEach((doc) => {
        const t = doc.data().token;
        if (t) tokens.push(t);
    });
    if (!tokens.length) return;

    const name = conv.clientName || "Klient";
    const body = (msg.text || "").slice(0, 200);

    const response = await admin.messaging().sendEachForMulticast({
        tokens,
        notification: {
            title: `Nowa wiadomość: ${name}`,
            body
        },
        data: {
            role: "admin",
            convId,
            url: "admin/index.html"
        },
        webpush: {
            notification: { icon: "/assets/logo1.png" },
            fcmOptions: { link: "/app/admin/index.html" }
        }
    });

    const batch = admin.firestore().batch();
    response.responses.forEach((res, i) => {
        if (!res.success) {
            const err = res.error;
            if (
                err &&
                (err.code === "messaging/invalid-registration-token" ||
                    err.code === "messaging/registration-token-not-registered")
            ) {
                const bad = tokens[i];
                if (bad) {
                    batch.delete(admin.firestore().collection("adminTokens").doc(bad.slice(0, 120)));
                }
            }
        }
    });
    await batch.commit().catch(() => {});
}

/**
 * Nowa wiadomość od klienta → push (jeśli włączony) + e-mail (jeśli skonfigurowany SMTP).
 */
exports.notifyAdminOnClientMessage = functions.firestore
    .document("conversations/{convId}/messages/{msgId}")
    .onCreate(async (snap, context) => {
        const msg = snap.data();
        if (!msg || msg.sender !== "client") return null;

        const convId = context.params.convId;
        const convSnap = await admin.firestore().collection("conversations").doc(convId).get();
        if (!convSnap.exists) return null;
        const conv = convSnap.data();
        if (conv.archived === true) return null;

        try {
            await sendAdminEmailIfConfigured(conv, msg, convId);
        } catch (e) {
            console.warn("[CAD] admin email failed", e.message || e);
        }

        try {
            await sendAdminPush(conv, msg, convId);
        } catch (e) {
            console.warn("[CAD] admin push failed", e.message || e);
        }

        return null;
    });

/**
 * Push do klienta gdy admin odpisze (tokeny w clientTokens z tym convId).
 */
exports.notifyClientOnAdminMessage = functions.firestore
    .document("conversations/{convId}/messages/{msgId}")
    .onCreate(async (snap, context) => {
        const msg = snap.data();
        if (!msg || msg.sender !== "admin") return null;

        const convId = context.params.convId;
        const tokensSnap = await admin
            .firestore()
            .collection("clientTokens")
            .where("convId", "==", convId)
            .get();
        if (tokensSnap.empty) return null;

        const tokens = [];
        tokensSnap.forEach((doc) => {
            const t = doc.data().token;
            if (t) tokens.push(t);
        });
        if (!tokens.length) return null;

        const body = (msg.text || "").slice(0, 200);

        const response = await admin.messaging().sendEachForMulticast({
            tokens,
            notification: {
                title: "Odpowiedź od Karola",
                body
            },
            data: {
                role: "client",
                convId,
                url: "index.html#chat"
            },
            webpush: {
                notification: { icon: "/assets/logo1.png" },
                fcmOptions: { link: "/app/index.html#chat" }
            }
        });

        const batch = admin.firestore().batch();
        response.responses.forEach((res, i) => {
            if (!res.success) {
                const err = res.error;
                if (
                    err &&
                    (err.code === "messaging/invalid-registration-token" ||
                        err.code === "messaging/registration-token-not-registered")
                ) {
                    const bad = tokens[i];
                    if (bad) {
                        batch.delete(
                            admin.firestore().collection("clientTokens").doc(bad.slice(0, 120))
                        );
                    }
                }
            }
        });
        await batch.commit().catch(() => {});

        return null;
    });
