(function () {
    const MAX_DIM = 1280;
    const JPEG_QUALITY = 0.82;
    const MAX_BYTES = 2.8 * 1024 * 1024;

    function lastMessagePreview(data) {
        const text = (data?.text || "").trim();
        if (text) return text.slice(0, 200);
        if (data?.imageUrl) {
            const label = typeof appT === "function" ? appT("chatPhotoPreview") : "Photo";
            return `📷 ${label}`;
        }
        return "";
    }

    function compressImageFile(file) {
        return new Promise((resolve, reject) => {
            if (!file || !file.type?.startsWith("image/")) {
                reject(new Error("invalid-image"));
                return;
            }
            const img = new Image();
            const url = URL.createObjectURL(file);
            img.onload = () => {
                URL.revokeObjectURL(url);
                let w = img.width;
                let h = img.height;
                const scale = Math.min(1, MAX_DIM / Math.max(w, h));
                w = Math.round(w * scale);
                h = Math.round(h * scale);
                const canvas = document.createElement("canvas");
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext("2d");
                ctx.drawImage(img, 0, 0, w, h);
                canvas.toBlob(
                    (blob) => {
                        if (!blob) {
                            reject(new Error("compress-failed"));
                            return;
                        }
                        if (blob.size > MAX_BYTES) {
                            reject(new Error("too-large"));
                            return;
                        }
                        resolve(blob);
                    },
                    "image/jpeg",
                    JPEG_QUALITY
                );
            };
            img.onerror = () => {
                URL.revokeObjectURL(url);
                reject(new Error("load-failed"));
            };
            img.src = url;
        });
    }

    async function uploadChatImage(storage, convId, uid, file) {
        if (!storage || !convId || !uid || !file) throw new Error("missing-args");
        const blob = await compressImageFile(file);
        const name = `${Date.now()}_${uid.slice(0, 8)}.jpg`;
        const ref = storage.ref().child(`chat/${convId}/${name}`);
        await ref.put(blob, { contentType: "image/jpeg" });
        return ref.getDownloadURL();
    }

    function renderMessageContent(m, escapeHtml) {
        const parts = [];
        const text = (m.text || "").trim();
        if (text) parts.push(escapeHtml(text));
        if (m.imageUrl) {
            const url = escapeHtml(m.imageUrl);
            parts.push(
                `<a class="chat-bubble__image-link" href="${url}" target="_blank" rel="noopener noreferrer"><img class="chat-bubble__image" src="${url}" alt="" loading="lazy"></a>`
            );
        }
        return parts.join(text && m.imageUrl ? "<br>" : "") || "—";
    }

    function chatPhotosEnabled() {
        return window.CAD_FIREBASE?.chatPhotosEnabled === true;
    }

    window.CAD_ChatMedia = {
        chatPhotosEnabled,
        lastMessagePreview,
        compressImageFile,
        uploadChatImage,
        renderMessageContent
    };
})();
