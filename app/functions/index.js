const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

/**
 * Wysyła push do admina (tokeny z kolekcji adminTokens) gdy klient doda wiadomość.
 * Wymaga: vapidKey w aplikacji + przycisk „Włącz powiadomienia” w admin.html.
 */
exports.notifyAdminOnClientMessage = functions.firestore
    .document("conversations/{convId}/messages/{msgId}")
    .onCreate(async (snap, context) => {
        const msg = snap.data();
        if (!msg || msg.sender !== "client") return null;

        const convRef = admin.firestore().collection("conversations").doc(context.params.convId);
        const convSnap = await convRef.get();
        if (!convSnap.exists) return null;
        const conv = convSnap.data();
        if (conv.archived === true) return null;

        const tokensSnap = await admin.firestore().collection("adminTokens").get();
        if (tokensSnap.empty) return null;

        const tokens = [];
        tokensSnap.forEach((doc) => {
            const t = doc.data().token;
            if (t) tokens.push(t);
        });
        if (!tokens.length) return null;

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
                convId: context.params.convId,
                url: "admin/index.html"
            },
            webpush: {
                notification: {
                    icon: "/logo1.png"
                },
                fcmOptions: {
                    link: "/app/admin/index.html"
                }
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
                    if (bad) batch.delete(admin.firestore().collection("adminTokens").doc(bad.slice(0, 120)));
                }
            }
        });
        await batch.commit().catch(() => {});

        return null;
    });
