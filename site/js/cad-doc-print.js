/**
 * Kompatybilność wsteczna — logika w cad-print.js
 */
(function () {
    "use strict";
    if (!window.CAD_printDocument) {
        console.warn("[CAD] Załaduj site/js/cad-print.js przed cad-doc-print.js");
    }
})();
