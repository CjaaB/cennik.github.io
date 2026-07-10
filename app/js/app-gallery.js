(function () {
    "use strict";

    let images = [];
    let lightboxIndex = 0;

    function escapeHtml(value) {
        return String(value || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function normalizeImages(list) {
        return (Array.isArray(list) ? list : [])
            .map((item, index) => ({
                file: String(item.file || item.File || "").trim(),
                alt: String(item.alt || item.Alt || `Detailing - zdjecie ${index + 1}`).trim()
            }))
            .filter((item) => item.file);
    }

    function readEmbeddedManifest() {
        const node = document.getElementById("cad-app-gallery-manifest");
        if (!node) return [];
        try {
            return normalizeImages(JSON.parse(node.textContent || "{}").images);
        } catch (e) {
            return [];
        }
    }

    async function loadImages() {
        try {
            const res = await fetch("../assets/gallery/manifest.json", { cache: "no-store" });
            if (res.ok) {
                const data = await res.json();
                const parsed = normalizeImages(data.images);
                if (parsed.length) return parsed;
            }
        } catch (e) {
            /* file:// lub brak sieci — fallback poniżej */
        }
        return readEmbeddedManifest();
    }

    function buildTrack(root, list) {
        const track = root.querySelector("[data-app-gallery-track]");
        const empty = root.querySelector("[data-app-gallery-empty]");
        if (!track) return;

        if (!list.length) {
            track.innerHTML = "";
            if (empty) empty.hidden = false;
            return;
        }

        if (empty) empty.hidden = true;
        track.innerHTML = list
            .map(
                (item, index) => `
            <button type="button" class="app-gallery-item" data-app-gallery-index="${index}">
                <img src="../assets/gallery/${escapeHtml(item.file)}" alt="${escapeHtml(item.alt)}" loading="lazy" decoding="async">
            </button>`
            )
            .join("");
    }

    function setupCarousel(root) {
        const viewport = root.querySelector("[data-app-gallery-viewport]");
        if (!viewport) return;

        const step = () => {
            const item = viewport.querySelector(".app-gallery-item");
            if (!item) return 0;
            const track = viewport.querySelector(".app-gallery-track");
            const styles = track ? getComputedStyle(track) : getComputedStyle(viewport);
            const gap = parseFloat(styles.columnGap || styles.gap || "12") || 12;
            return item.getBoundingClientRect().width + gap;
        };

        root.querySelector('[data-app-gallery-prev]')?.addEventListener("click", () => {
            viewport.scrollBy({ left: -step(), behavior: "smooth" });
        });
        root.querySelector('[data-app-gallery-next]')?.addEventListener("click", () => {
            viewport.scrollBy({ left: step(), behavior: "smooth" });
        });
    }

    function setupLightbox(root) {
        const lightbox = document.getElementById("app-gallery-lightbox");
        if (!lightbox) return;

        const img = lightbox.querySelector("[data-app-gallery-lightbox-img]");
        const caption = lightbox.querySelector("[data-app-gallery-lightbox-caption]");

        const open = (index) => {
            const item = images[index];
            if (!item || !img) return;
            lightboxIndex = index;
            img.src = `../assets/gallery/${item.file}`;
            img.alt = item.alt || "";
            if (caption) caption.textContent = "";
            lightbox.hidden = false;
            lightbox.setAttribute("aria-hidden", "false");
            document.body.classList.add("cad-app-lightbox-open");
        };

        const close = () => {
            lightbox.hidden = true;
            lightbox.setAttribute("aria-hidden", "true");
            document.body.classList.remove("cad-app-lightbox-open");
            if (img) img.removeAttribute("src");
        };

        const shift = (dir) => {
            if (!images.length) return;
            lightboxIndex = (lightboxIndex + dir + images.length) % images.length;
            open(lightboxIndex);
        };

        root.addEventListener("click", (event) => {
            const btn = event.target.closest("[data-app-gallery-index]");
            if (!btn) return;
            open(Number(btn.dataset.appGalleryIndex));
        });

        lightbox.querySelector("[data-app-gallery-close]")?.addEventListener("click", close);
        lightbox.querySelector("[data-app-gallery-lightbox-prev]")?.addEventListener("click", () => shift(-1));
        lightbox.querySelector("[data-app-gallery-lightbox-next]")?.addEventListener("click", () => shift(1));
        lightbox.addEventListener("click", (event) => {
            if (event.target === lightbox) close();
        });
        document.addEventListener("keydown", (event) => {
            if (lightbox.hidden) return;
            if (event.key === "Escape") close();
            if (event.key === "ArrowLeft") shift(-1);
            if (event.key === "ArrowRight") shift(1);
        });
    }

    async function init() {
        const root = document.getElementById("app-gallery-root");
        if (!root) return;

        images = await loadImages();
        buildTrack(root, images);
        setupCarousel(root);
        setupLightbox(root);
        window.CAD_Icons?.refresh?.();
    }

    window.CAD_AppGallery = { init, refresh: init };
    document.addEventListener("DOMContentLoaded", init);
})();
