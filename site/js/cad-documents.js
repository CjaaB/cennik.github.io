/**
 * Podgląd dokumentów Car All Detailing — wycena, regulamin, protokół.
 */
(function () {
    "use strict";

    function esc(text) {
        return String(text || "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function logoPath() {
        const scripts = [...document.scripts];
        const self = scripts.find((s) => s.src && s.src.includes("cad-documents.js"));
        if (self?.src) {
            const root = self.src.replace(/site\/js\/cad-documents\.js.*$/, "");
            if (root !== self.src) return `${root}assets/logo1.png`;
        }
        if (location.pathname.includes("/app/")) return "../assets/logo1.png";
        if (location.pathname.includes("/private/")) return "../assets/logo1.png";
        if (location.pathname.includes("/site/documents/")) return "../../assets/logo1.png";
        return "assets/logo1.png";
    }

    function masthead(subtitle) {
        return `
            <header class="cad-doc__masthead">
                <img class="cad-doc__logo" src="${esc(logoPath())}" alt="" width="72" height="72">
                <div>
                    <p class="cad-doc__brand-name">CAR ALL DETAILING</p>
                    <p class="cad-doc__brand-sub">by Karol Zagórski</p>
                    <p class="cad-doc__doc-kicker">${esc(subtitle)}</p>
                </div>
            </header>`;
    }

    function buildQuoteDocumentHtml(payload) {
        const {
            title = "Oferta Car All Detailing",
            subtitle = "Wstępna wycena usług",
            dateLabel = "Data",
            classLabel = "Klasa auta",
            modelLabel = "Model auta",
            serviceCol = "Wybrana usługa",
            priceCol = "Cena szacunkowa",
            totalLabel = "Suma całkowita (brutto)",
            disclaimer = "",
            footerLine = "Car All Detailing · Karol Zagórski · Maarssen, NL",
            date = new Date().toLocaleDateString("pl-PL"),
            sizeLabel = "—",
            carModel = "",
            statusLabel = "Status",
            statusValue = "wycena orientacyjna",
            rows = [],
            totalText = "0 €"
        } = payload;

        const rowsHtml = rows.length
            ? rows
                  .map(
                      (row) => `
                <tr>
                    <td>${esc(row.name)}</td>
                    <td>${esc(row.price)}</td>
                </tr>`
                  )
                  .join("")
            : `<tr><td colspan="2">Brak wybranych usług</td></tr>`;

        return `
<article class="cad-doc cad-doc--quote" data-cad-doc="quote">
    ${masthead(subtitle)}
    <div class="cad-doc__body">
        <h1 class="cad-doc__title">${esc(title)}</h1>
        <div class="cad-doc__title-rule" aria-hidden="true"></div>
        <div class="cad-doc__meta">
            <div class="cad-doc__meta-item"><span>${esc(dateLabel)}</span><strong>${esc(date)}</strong></div>
            <div class="cad-doc__meta-item"><span>${esc(classLabel)}</span><strong>${esc(sizeLabel)}</strong></div>
            <div class="cad-doc__meta-item"><span>${esc(modelLabel)}</span><strong>${esc(carModel || "do uzupełnienia")}</strong></div>
            <div class="cad-doc__meta-item"><span>${esc(statusLabel)}</span><strong>${esc(statusValue)}</strong></div>
        </div>
        <table class="cad-doc__table">
            <thead><tr><th>${esc(serviceCol)}</th><th>${esc(priceCol)}</th></tr></thead>
            <tbody>${rowsHtml}</tbody>
        </table>
        <div class="cad-doc__total">
            <div class="cad-doc__total-box">
                <span>${esc(totalLabel)}</span>
                <strong>${esc(totalText)}</strong>
            </div>
        </div>
        ${disclaimer ? `<p class="cad-doc__disclaimer">${esc(disclaimer)}</p>` : ""}
        <footer class="cad-doc__footer">${esc(footerLine)}</footer>
    </div>
</article>`;
    }

    let modalRoot = null;
    let activePayload = null;
    let activeOnDownload = null;

    function ensureModal() {
        if (modalRoot) return modalRoot;

        modalRoot = document.createElement("div");
        modalRoot.className = "cad-doc-modal";
        modalRoot.hidden = true;
        modalRoot.setAttribute("role", "dialog");
        modalRoot.setAttribute("aria-modal", "true");
        modalRoot.setAttribute("aria-label", "Podgląd dokumentu");
        modalRoot.innerHTML = `
            <div class="cad-doc-modal__panel">
                <div class="cad-doc-modal__head">
                    <strong data-cad-doc-modal-title>Podgląd dokumentu</strong>
                    <button type="button" class="cad-doc-btn cad-doc-btn--ghost" data-cad-doc-close aria-label="Zamknij">✕ Zamknij</button>
                </div>
                <div class="cad-doc-modal__scroll" data-cad-doc-modal-body></div>
                <div class="cad-doc-modal__foot">
                    <button type="button" class="cad-doc-btn cad-doc-btn--primary" data-cad-doc-print><i class="fas fa-print"></i> Drukuj / Zapisz jako PDF</button>
                    <button type="button" class="cad-doc-btn cad-doc-btn--ghost" data-cad-doc-close-inline>Zamknij</button>
                </div>
            </div>`;

        document.body.appendChild(modalRoot);

        modalRoot.querySelector("[data-cad-doc-close]").addEventListener("click", closePreview);
        modalRoot.querySelector("[data-cad-doc-close-inline]")?.addEventListener("click", closePreview);
        modalRoot.addEventListener("click", (e) => {
            if (e.target === modalRoot) closePreview();
        });
        modalRoot.querySelector("[data-cad-doc-print]").addEventListener("click", () => {
            printActiveDocument();
        });
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && modalRoot && !modalRoot.hidden) closePreview();
        });

        return modalRoot;
    }

    function printActiveDocument() {
        const el = modalRoot?.querySelector("[data-cad-doc-modal-body] .cad-doc");
        if (!el) return;
        if (window.CAD_printCore?.printElement) {
            window.CAD_printCore.printElement(el, "Car All Detailing");
            return;
        }
        window.CAD_printDocument?.(".cad-doc-modal__scroll .cad-doc", "Car All Detailing");
    }

    function openPreview({ title, html, payload, onDownload }) {
        const modal = ensureModal();
        activePayload = payload || null;
        activeOnDownload = onDownload || null;
        modal.querySelector("[data-cad-doc-modal-title]").textContent = title || "Podgląd dokumentu";
        modal.querySelector("[data-cad-doc-modal-body]").innerHTML = html;
        modal.hidden = false;
        document.body.classList.add("cad-doc-modal-open");
        window.CAD_Icons?.refresh(modal);
    }

    function closePreview() {
        if (!modalRoot) return;
        modalRoot.hidden = true;
        document.body.classList.remove("cad-doc-modal-open");
        activePayload = null;
        activeOnDownload = null;
    }

    function previewQuote(payload) {
        const html = buildQuoteDocumentHtml(payload);
        openPreview({
            title: payload.title || "Podgląd wyceny",
            html,
            payload
        });
    }

    let quotePrintHost = null;

    function ensureQuotePrintHost() {
        if (quotePrintHost) return quotePrintHost;
        quotePrintHost = document.createElement("div");
        quotePrintHost.id = "cad-quote-print-host";
        quotePrintHost.className = "cad-quote-print-host";
        quotePrintHost.setAttribute("aria-hidden", "true");
        quotePrintHost.style.cssText =
            "position:fixed;left:-9999px;top:0;width:210mm;pointer-events:none;visibility:hidden;overflow:hidden";
        quotePrintHost.innerHTML = '<main class="cad-doc-stage"></main>';
        document.body.appendChild(quotePrintHost);
        return quotePrintHost;
    }

    async function printQuote(payload) {
        if (!payload || typeof payload !== "object") {
            console.error("[CAD Documents] printQuote: invalid payload");
            return false;
        }

        const host = ensureQuotePrintHost();
        const stage = host.querySelector(".cad-doc-stage");
        stage.innerHTML = buildQuoteDocumentHtml(payload);

        const el = stage.querySelector(".cad-doc");
        if (!el) {
            console.error("[CAD Documents] printQuote: .cad-doc missing");
            return false;
        }

        el.classList.add("cad-doc--quote-print");
        const title = payload.title || "Car All Detailing — wycena";

        if (window.CAD_printCore?.printElement) {
            return window.CAD_printCore.printElement(el, title);
        }

        return window.CAD_printDocument?.("#cad-quote-print-host .cad-doc--quote-print", title) ?? false;
    }

    window.CAD_Documents = {
        buildQuoteDocumentHtml,
        previewQuote,
        printQuote,
        openPreview,
        closePreview,
        printActiveDocument
    };
})();
