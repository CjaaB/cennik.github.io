/**
 * Wycena — druk jak protokół (cad-print.js → iframe → print).
 * Bez html2canvas, jsPDF, modala ani pobierania pliku.
 */
(function () {
    "use strict";

    function printQuotePdf(payload) {
        return window.CAD_Documents?.printQuote?.(payload) ?? false;
    }

    function bindDocumentPrintButtons() {
        document.querySelectorAll("[data-cad-download-pdf], [data-cad-print-pdf]").forEach((btn) => {
            if (btn.dataset.cadPdfBound === "1") return;
            btn.dataset.cadPdfBound = "1";
            btn.addEventListener("click", async (e) => {
                e.preventDefault();
                const selector = btn.getAttribute("data-selector") || ".cad-doc";
                const title = btn.getAttribute("data-title") || "Car All Detailing";
                const label = btn.innerHTML;
                btn.disabled = true;
                btn.setAttribute("aria-busy", "true");
                const busy = btn.getAttribute("data-busy-label") || '<i class="fas fa-spinner fa-spin"></i> Przygotowuję…';
                btn.innerHTML = busy;
                try {
                    const ok = await window.CAD_printDocument?.(selector, title);
                    if (!ok) alert("Nie udało się otworzyć okna druku. Spróbuj ponownie.");
                } catch (err) {
                    console.error("[CAD PDF]", err);
                    alert("Nie udało się otworzyć okna druku. Spróbuj ponownie.");
                } finally {
                    btn.disabled = false;
                    btn.removeAttribute("aria-busy");
                    btn.innerHTML = label;
                }
            });
        });
    }

    window.CAD_printQuotePdf = printQuotePdf;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", bindDocumentPrintButtons);
    } else {
        bindDocumentPrintButtons();
    }
})();
