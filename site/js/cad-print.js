/**
 * Car All Detailing — druk przez ukryty iframe (podglad wydruku / Zapisz jako PDF).
 */
(function () {
    "use strict";

    const CSS_VERSION = "6";
    let cachedCssText = null;

    const EXTRA_PRINT_CSS = `
@page { size: A4 portrait; margin: 10mm 12mm; }
html, body.cad-doc-page { margin: 0; padding: 0; background: #fff !important; min-height: 0; }
body.cad-doc-print-job .cad-doc-stage { padding: 0 !important; margin: 0 !important; }
`;

    const FALLBACK_CSS = `/* Car All Detailing — dokumenty: podgląd, druk, PDF */
:root {
    --cad-doc-gold: #c9a227;
    --cad-doc-gold-soft: rgba(201, 162, 39, 0.14);
    --cad-doc-ink: #1a1712;
    --cad-doc-muted: #5c564c;
    --cad-doc-line: rgba(201, 162, 39, 0.28);
    --cad-doc-paper: #faf8f3;
    --cad-doc-paper-shadow: 0 28px 64px rgba(0, 0, 0, 0.38);
    --cad-doc-toolbar-h: 58px;
}

*,
*::before,
*::after {
    box-sizing: border-box;
}

html {
    -webkit-text-size-adjust: 100%;
}

body.cad-doc-page {
    margin: 0;
    min-height: 100vh;
    background:
        radial-gradient(ellipse 80% 50% at 50% -10%, rgba(201, 162, 39, 0.12), transparent 55%),
        #0a0a0a;
    color: var(--cad-doc-ink);
    font-family: "Segoe UI", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.cad-doc-toolbar {
    position: sticky;
    top: 0;
    z-index: 20;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    min-height: var(--cad-doc-toolbar-h);
    padding: 10px clamp(14px, 4vw, 28px);
    border-bottom: 1px solid rgba(201, 162, 39, 0.18);
    background: rgba(8, 8, 8, 0.92);
    backdrop-filter: blur(12px);
    -webkit-backdrop-filter: blur(12px);
}

.cad-doc-toolbar__brand {
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 0;
    color: #f5f0e4;
    font-size: 0.82rem;
    font-weight: 600;
    letter-spacing: 0.04em;
    text-decoration: none;
}

.cad-doc-toolbar__brand img {
    width: 34px;
    height: 34px;
    border-radius: 10px;
    object-fit: contain;
    background: rgba(255, 255, 255, 0.06);
}

.cad-doc-toolbar__actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
}

.cad-doc-toolbar__hint {
    flex: 1 1 100%;
    margin: 0;
    padding-top: 2px;
    color: rgba(255, 255, 255, 0.42);
    font-size: 0.72rem;
    line-height: 1.4;
    text-align: right;
}

.cad-doc-btn {
    display: inline-flex;
    align-items: center;
    gap: 7px;
    padding: 9px 14px;
    border-radius: 999px;
    border: 1px solid rgba(201, 162, 39, 0.32);
    background: rgba(201, 162, 39, 0.08);
    color: #f1d279;
    font: inherit;
    font-size: 0.8rem;
    font-weight: 600;
    text-decoration: none;
    cursor: pointer;
    transition: background 0.2s ease, border-color 0.2s ease, transform 0.2s ease;
}

.cad-doc-btn:hover,
.cad-doc-btn:focus-visible {
    background: rgba(201, 162, 39, 0.16);
    border-color: rgba(201, 162, 39, 0.5);
    outline: none;
    transform: translateY(-1px);
}

.cad-doc-btn--primary {
    background: linear-gradient(160deg, #d4af37, #b8922a);
    border-color: #d4af37;
    color: #111;
}

.cad-doc-btn--ghost {
    background: transparent;
    border-color: rgba(255, 255, 255, 0.14);
    color: #d8d2c4;
}

.cad-doc-stage {
    padding: clamp(20px, 4vw, 40px) clamp(12px, 3vw, 24px) 48px;
}

.cad-doc {
    width: min(210mm, 100%);
    margin: 0 auto;
    background: var(--cad-doc-paper);
    color: var(--cad-doc-ink);
    box-shadow: var(--cad-doc-paper-shadow);
    border-radius: 4px;
    overflow: hidden;
}

.cad-doc__masthead {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 18px;
    align-items: center;
    padding: 28px 32px 24px;
    background: linear-gradient(145deg, #0d0d0d 0%, #17140f 100%);
    color: #fff;
    border-bottom: 3px solid var(--cad-doc-gold);
}

.cad-doc__masthead--split {
    grid-template-columns: 1fr auto;
    align-items: end;
}

.cad-doc__masthead-brand {
    display: flex;
    align-items: center;
    gap: 16px;
}

.cad-doc__masthead-meta {
    text-align: right;
}

.cad-doc__meta-label {
    display: block;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.48);
    font-size: 0.62rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.cad-doc__datetime {
    display: block;
    color: var(--cad-doc-gold);
    font-size: 0.92rem;
    font-weight: 700;
    line-height: 1.35;
    white-space: nowrap;
}

.cad-doc__intro {
    margin: 0;
    color: var(--cad-doc-muted);
    font-size: 0.88rem;
    line-height: 1.5;
}

.cad-doc__section--lead {
    margin-bottom: 22px;
    padding-bottom: 18px;
    border-bottom: 1px solid var(--cad-doc-line);
}

.cad-doc__section-note {
    margin: 0;
    color: var(--cad-doc-muted);
    font-size: 0.86rem;
    line-height: 1.5;
}

.cad-doc__logo {
    display: block;
    width: auto;
    height: 56px;
    max-width: 72px;
    object-fit: contain;
}

.cad-doc__brand-name {
    margin: 0 0 4px;
    font-size: 1.35rem;
    font-weight: 800;
    letter-spacing: 0.06em;
}

.cad-doc__brand-sub {
    margin: 0;
    color: var(--cad-doc-gold);
    font-size: 0.82rem;
    font-weight: 600;
}

.cad-doc__doc-kicker {
    margin: 8px 0 0;
    color: rgba(255, 255, 255, 0.58);
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.14em;
    text-transform: uppercase;
}

.cad-doc__body {
    padding: 32px 32px 40px;
}

.cad-doc__title {
    margin: 0 0 6px;
    font-size: clamp(1.35rem, 3vw, 1.75rem);
    line-height: 1.15;
    letter-spacing: -0.02em;
}

.cad-doc__title-rule {
    width: 72px;
    height: 3px;
    margin: 0 0 22px;
    border-radius: 999px;
    background: var(--cad-doc-gold);
}

.cad-doc__lead {
    margin: 0 0 28px;
    padding: 16px 18px;
    border-left: 3px solid var(--cad-doc-gold);
    background: var(--cad-doc-gold-soft);
    color: var(--cad-doc-muted);
    font-size: 0.92rem;
    line-height: 1.55;
    border-radius: 0 12px 12px 0;
}

.cad-doc__section {
    margin-bottom: 26px;
}

.cad-doc__section h2 {
    margin: 0 0 10px;
    font-size: 1rem;
    font-weight: 800;
    color: var(--cad-doc-ink);
}

.cad-doc__section h2::after {
    content: "";
    display: block;
    width: 36px;
    height: 2px;
    margin-top: 6px;
    background: var(--cad-doc-gold);
    border-radius: 999px;
}

.cad-doc__section p,
.cad-doc__section li {
    margin: 0 0 10px;
    color: var(--cad-doc-muted);
    font-size: 0.9rem;
    line-height: 1.55;
}

.cad-doc__section ul {
    margin: 0;
    padding: 0;
    list-style: none;
}

.cad-doc__section li {
    display: flex;
    gap: 10px;
    align-items: flex-start;
}

.cad-doc__section li::before {
    content: "";
    flex-shrink: 0;
    width: 8px;
    height: 8px;
    margin-top: 7px;
    border-radius: 2px;
    background: var(--cad-doc-gold);
}

.cad-doc__field-grid {
    display: grid;
    gap: 14px;
}

.cad-doc__field-grid--2 {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px 20px;
}

.cad-doc__field--full {
    grid-column: 1 / -1;
}

.cad-doc__checks--2col {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px 16px;
    margin-bottom: 14px;
}

.cad-doc__field {
    display: grid;
    grid-template-columns: 168px 1fr;
    gap: 12px;
    align-items: end;
    font-size: 0.88rem;
}

.cad-doc--protocol .cad-doc__field {
    grid-template-columns: 1fr;
    gap: 6px;
    align-items: start;
}

.cad-doc__field label {
    color: var(--cad-doc-muted);
    font-weight: 600;
}

.cad-doc__field-line {
    min-height: 22px;
    border-bottom: 1px solid var(--cad-doc-line);
}

.cad-doc__checks {
    display: grid;
    gap: 10px;
}

.cad-doc__check {
    display: grid;
    grid-template-columns: 14px 1fr;
    gap: 10px;
    align-items: start;
    font-size: 0.88rem;
    color: var(--cad-doc-ink);
}

.cad-doc__check-box {
    width: 14px;
    height: 14px;
    margin-top: 3px;
    border: 1.5px solid var(--cad-doc-gold);
    border-radius: 3px;
}

.cad-doc__check-box--on {
    position: relative;
    background: var(--cad-doc-gold-soft);
}

.cad-doc__check-box--on::after {
    content: "✓";
    position: absolute;
    inset: 0;
    display: grid;
    place-items: center;
    font-size: 10px;
    font-weight: 800;
    color: var(--cad-doc-gold);
    line-height: 1;
}

.cad-doc__photos {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 8px;
    margin-top: 8px;
}

.cad-doc--protocol .cad-doc__field + .cad-doc__photos {
    margin-bottom: 6px;
}

.cad-doc--protocol .cad-doc__field-grid--2 > .cad-doc__photos {
    grid-column: 1 / -1;
}

.cad-doc__photo {
    margin: 0;
    break-inside: avoid;
    page-break-inside: avoid;
}

.cad-doc__photo img {
    display: block;
    width: 100%;
    border-radius: 8px;
    border: 1px solid var(--cad-doc-line);
}

.cad-doc__photo figcaption {
    margin-top: 4px;
    color: var(--cad-doc-muted);
    font-size: 0.68rem;
    line-height: 1.35;
}

.cad-doc__note-box {
    padding: 16px 18px;
    border: 1px solid var(--cad-doc-line);
    border-radius: 12px;
    background: rgba(201, 162, 39, 0.06);
}

.cad-doc__note-box--tall {
    min-height: 88px;
}

.cad-doc__signatures {
    display: grid;
    gap: 22px;
    margin-top: 28px;
}

.cad-doc__sign-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
}

.cad-doc__sign-field label {
    display: block;
    margin-bottom: 8px;
    color: var(--cad-doc-muted);
    font-size: 0.78rem;
    font-weight: 600;
}

.cad-doc__sign-line {
    height: 1px;
    background: var(--cad-doc-line);
}

.cad-doc__footer {
    margin-top: 32px;
    padding-top: 14px;
    border-top: 1px solid var(--cad-doc-line);
    color: var(--cad-doc-muted);
    font-size: 0.76rem;
    text-align: center;
}

/* ── Wycena kalkulatora ── */
.cad-doc--quote .cad-doc__meta {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 12px 20px;
    margin-bottom: 24px;
}

.cad-doc__meta-item {
    padding: 12px 14px;
    border: 1px solid var(--cad-doc-line);
    border-radius: 12px;
    background: #fff;
}

.cad-doc__meta-item span {
    display: block;
    margin-bottom: 4px;
    color: var(--cad-doc-muted);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.cad-doc__meta-item strong {
    font-size: 0.92rem;
    font-weight: 700;
    color: var(--cad-doc-ink);
}

.cad-doc__table {
    width: 100%;
    border-collapse: collapse;
    margin-bottom: 20px;
    font-size: 0.88rem;
}

.cad-doc__table th {
    padding: 11px 14px;
    background: #111;
    color: #fff;
    font-size: 0.76rem;
    font-weight: 700;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
}

.cad-doc__table th:last-child {
    text-align: right;
}

.cad-doc__table td {
    padding: 11px 14px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    vertical-align: top;
}

.cad-doc__table tr:nth-child(even) td {
    background: rgba(201, 162, 39, 0.05);
}

.cad-doc__table td:last-child {
    text-align: right;
    font-weight: 700;
    white-space: nowrap;
}

.cad-doc__total {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 22px;
}

.cad-doc__total-box {
    min-width: 220px;
    padding: 14px 18px;
    border-radius: 14px;
    background: linear-gradient(145deg, #111, #1a1712);
    color: #fff;
    text-align: right;
}

.cad-doc__total-box span {
    display: block;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.72rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
}

.cad-doc__total-box strong {
    font-size: 1.45rem;
    color: var(--cad-doc-gold);
}

.cad-doc__disclaimer {
    margin: 0;
    color: var(--cad-doc-muted);
    font-size: 0.82rem;
    line-height: 1.55;
}

/* ── Modal podglądu na stronie głównej ── */
.cad-doc-modal {
    position: fixed;
    inset: 0;
    z-index: 12000;
    display: grid;
    place-items: center;
    padding: 16px;
    background: rgba(0, 0, 0, 0.72);
    backdrop-filter: blur(6px);
    -webkit-backdrop-filter: blur(6px);
    animation: cadDocFadeIn 0.22s ease;
}

.cad-doc-modal[hidden] {
    display: none !important;
}

.cad-doc-modal__panel {
    display: flex;
    flex-direction: column;
    width: min(920px, 100%);
    max-height: min(92vh, 900px);
    border-radius: 18px;
    border: 1px solid rgba(201, 162, 39, 0.22);
    background: #0e0e0e;
    box-shadow: 0 32px 80px rgba(0, 0, 0, 0.55);
    overflow: hidden;
}

.cad-doc-modal__head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 14px 16px;
    border-bottom: 1px solid rgba(201, 162, 39, 0.14);
}

.cad-doc-modal__head strong {
    color: #f5f0e4;
    font-size: 0.92rem;
}

.cad-doc-modal__scroll {
    flex: 1;
    overflow: auto;
    padding: 18px;
    background:
        radial-gradient(ellipse 70% 40% at 50% 0%, rgba(201, 162, 39, 0.08), transparent 60%),
        #111;
}

.cad-doc-modal__scroll .cad-doc {
    box-shadow: 0 18px 48px rgba(0, 0, 0, 0.42);
}

.cad-doc-modal__foot {
    display: flex;
    flex-wrap: wrap;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 16px 14px;
    border-top: 1px solid rgba(201, 162, 39, 0.12);
}

@keyframes cadDocFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}

@media (max-width: 720px) {
    .cad-doc__masthead,
    .cad-doc__masthead--split {
        grid-template-columns: 1fr;
        text-align: center;
        justify-items: center;
    }

    .cad-doc__masthead-brand {
        flex-direction: column;
    }

    .cad-doc__masthead-meta {
        text-align: center;
    }

    .cad-doc__datetime {
        white-space: normal;
    }

    .cad-doc__field-grid--2,
    .cad-doc__checks--2col {
        grid-template-columns: 1fr;
    }

    .cad-doc__body {
        padding: 24px 18px 32px;
    }

    .cad-doc__field {
        grid-template-columns: 1fr;
        gap: 6px;
    }

    .cad-doc--quote .cad-doc__meta {
        grid-template-columns: 1fr;
    }

    .cad-doc__sign-row {
        grid-template-columns: 1fr;
    }

    .cad-doc-toolbar {
        flex-direction: column;
        align-items: stretch;
    }

    .cad-doc-toolbar__actions {
        justify-content: stretch;
    }

    .cad-doc-btn {
        flex: 1;
        justify-content: center;
    }
}

@media print {
    @page {
        size: A4 portrait;
        margin: 10mm 12mm;
    }

    html,
    body.cad-doc-page {
        background: #fff !important;
        min-height: 0;
    }

    .cad-doc-toolbar,
    .cad-doc-toolbar__hint,
    [data-screen-only],
    .cad-doc-modal__head,
    .cad-doc-modal__foot,
    .cad-doc-modal {
        display: none !important;
    }

    .cad-doc-stage,
    .cad-doc-modal__scroll {
        padding: 0 !important;
        margin: 0 !important;
        background: #fff !important;
        overflow: visible !important;
    }

    .cad-doc {
        width: 100% !important;
        max-width: none !important;
        margin: 0 !important;
        box-shadow: none !important;
        border-radius: 0 !important;
        overflow: visible !important;
    }

    .cad-doc__masthead,
    .cad-doc__masthead--split {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 12px;
        padding: 8px 0 10px !important;
        margin-bottom: 6px;
        background: transparent !important;
        color: #111 !important;
        border-bottom: 2px solid #c9a227 !important;
        break-after: avoid;
        page-break-after: avoid;
    }

    .cad-doc__masthead-brand {
        display: flex;
        align-items: center;
        gap: 10px;
    }

    .cad-doc__masthead-meta {
        text-align: right;
    }

    .cad-doc__meta-label {
        font-size: 0.58rem !important;
        color: #888 !important;
    }

    .cad-doc__datetime {
        font-size: 0.78rem !important;
        color: #8a6b16 !important;
        white-space: normal;
    }

    .cad-doc--protocol .cad-doc__section--lead {
        display: none !important;
    }

    .cad-doc__logo {
        width: auto !important;
        height: 44px !important;
        max-width: 56px !important;
        border: none !important;
        border-radius: 0 !important;
        background: none !important;
        box-shadow: none !important;
    }

    .cad-doc__brand-name {
        font-size: 1rem !important;
        color: #111 !important;
    }

    .cad-doc__brand-sub {
        font-size: 0.72rem !important;
        color: #8a6b16 !important;
    }

    .cad-doc__doc-kicker {
        margin-top: 4px !important;
        font-size: 0.62rem !important;
        color: #666 !important;
    }

    .cad-doc__body {
        padding: 0 !important;
    }

    .cad-doc__title {
        margin: 0 0 4px !important;
        font-size: 1.2rem !important;
        break-after: avoid;
        page-break-after: avoid;
    }

    .cad-doc__title-rule {
        width: 56px;
        height: 2px;
        margin: 0 0 10px !important;
    }

    .cad-doc__lead {
        margin: 0 0 14px !important;
        padding: 10px 12px !important;
        font-size: 0.8rem !important;
        line-height: 1.4 !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc__section {
        margin-bottom: 14px !important;
        break-inside: auto !important;
        page-break-inside: auto !important;
    }

    .cad-doc__section h2 {
        margin: 0 0 8px !important;
        font-size: 0.92rem !important;
        break-after: avoid;
        page-break-after: avoid;
    }

    .cad-doc__section p,
    .cad-doc__section li {
        font-size: 0.82rem !important;
        line-height: 1.4 !important;
    }

    .cad-doc--protocol .cad-doc__field-grid--2 {
        grid-template-columns: 1fr 1fr;
        gap: 8px 16px;
    }

    .cad-doc--protocol .cad-doc__field {
        display: block;
        margin-bottom: 0 !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc--protocol .cad-doc__field label {
        display: block;
        font-size: 0.68rem !important;
        margin-bottom: 3px !important;
    }

    .cad-doc--protocol .cad-doc__checks--2col {
        grid-template-columns: 1fr 1fr;
    }

    .cad-doc__field-line {
        min-height: 16px !important;
    }

    .cad-doc__checks {
        gap: 6px !important;
    }

    .cad-doc__check {
        font-size: 0.8rem !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc__note-box {
        min-height: 64px !important;
        padding: 10px !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc__signatures {
        margin-top: 16px !important;
        gap: 14px !important;
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc__sign-row {
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc__footer {
        margin-top: 16px !important;
        padding-top: 8px !important;
        font-size: 0.68rem !important;
    }

    .cad-doc--terms .cad-doc__section {
        margin-bottom: 12px !important;
    }

    .cad-doc__photos {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        margin-top: 6px;
    }

    .cad-doc__photo {
        break-inside: avoid;
        page-break-inside: avoid;
    }

    .cad-doc__photo img {
        border-radius: 6px;
        border-color: #ddd;
    }

    .cad-doc__photo figcaption {
        font-size: 0.62rem !important;
    }
}
`;
    function escapeTitle(title) {
        return String(title || "Car All Detailing")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;");
    }

    function scriptRoot() {
        const script = [...document.scripts].find((s) => s.src && s.src.includes("cad-print.js"));
        if (!script?.src) return "";
        const root = script.src.replace(/\/site\/js\/cad-print\.js.*$/, "");
        return root !== script.src ? root : "";
    }

    function resolveCssHref(customHref) {
        if (customHref) return customHref;
        const link = document.querySelector('link[href*="cad-documents.css"]');
        if (link?.href) return link.href.split("?")[0] + "?v=" + CSS_VERSION;
        const base = scriptRoot();
        if (base) return `${base}/site/css/cad-documents.css?v=${CSS_VERSION}`;
        if (location.pathname.includes("/site/documents/")) return `../css/cad-documents.css?v=${CSS_VERSION}`;
        if (location.pathname.includes("/private/")) return `../site/css/cad-documents.css?v=${CSS_VERSION}`;
        return `site/css/cad-documents.css?v=${CSS_VERSION}`;
    }

    function cssCandidateUrls(customHref) {
        const urls = [];
        const add = (href) => {
            if (!href) return;
            const clean = href.split("?")[0];
            urls.push(`${clean}?v=${CSS_VERSION}`);
            try {
                urls.push(new URL(`${clean}?v=${CSS_VERSION}`, document.baseURI || location.href).href);
            } catch (_) {}
        };
        add(customHref);
        add(resolveCssHref());
        const base = scriptRoot();
        if (base) add(`${base}/site/css/cad-documents.css`);
        if (location.pathname.includes("/site/documents/")) add("../css/cad-documents.css");
        if (location.pathname.includes("/private/")) add("../site/css/cad-documents.css");
        add("site/css/cad-documents.css");
        return [...new Set(urls)];
    }

    async function fetchText(url) {
        try {
            const res = await fetch(url, { cache: "no-store" });
            if (res.ok) {
                const text = await res.text();
                if (text && text.includes("--cad-doc")) return text;
            }
        } catch (_) {}
        return "";
    }

    function fetchTextSync(url) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.send(null);
            if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                const text = xhr.responseText;
                if (text && text.includes("--cad-doc")) return text;
            }
        } catch (_) {}
        return "";
    }

    function readLinkedStylesheets() {
        let css = "";
        for (const sheet of document.styleSheets) {
            try {
                const rules = sheet.cssRules || sheet.rules;
                if (!rules) continue;
                for (let i = 0; i < rules.length; i++) {
                    css += `${rules[i].cssText}\n`;
                }
            } catch (_) {}
        }
        return css.includes("--cad-doc") ? css : "";
    }

    async function resolveDocumentCss(customHref) {
        if (cachedCssText) return cachedCssText;
        let css = "";
        for (const href of cssCandidateUrls(customHref)) {
            css = await fetchText(href);
            if (css) break;
            css = fetchTextSync(href);
            if (css) break;
        }
        if (!css) css = readLinkedStylesheets();
        if (!css || css.length < 400) css = FALLBACK_CSS;
        cachedCssText = css + EXTRA_PRINT_CSS;
        return cachedCssText;
    }

    let cachedLogoDataUrl = null;

    function isLogoImg(img) {
        const src = (img.getAttribute("src") || "").toLowerCase();
        const cls = img.className || "";
        return src.includes("logo") || /cad-doc__logo/.test(cls);
    }

    function logoCandidateUrls(src) {
        const urls = [];
        const add = (href) => {
            if (!href) return;
            try {
                urls.push(new URL(href, document.baseURI || location.href).href);
            } catch (_) {
                urls.push(href);
            }
        };
        if (src) add(src);
        const base = scriptRoot();
        if (base) {
            add(`${base}/assets/logo1.png`);
            add(`${base}/app/icons/icon-192.png`);
        }
        if (location.pathname.includes("/site/documents/")) {
            add("../../assets/logo1.png");
            add("../../../assets/logo1.png");
        }
        if (location.pathname.includes("/private/")) {
            add("../assets/logo1.png");
            add("../../assets/logo1.png");
        }
        if (location.pathname.includes("/app/")) {
            add("../assets/logo1.png");
        }
        add("assets/logo1.png");
        add("../assets/logo1.png");
        add("../../assets/logo1.png");
        return [...new Set(urls)];
    }

    function bytesToDataUrl(bytes, mime) {
        let bin = "";
        const chunk = 0x8000;
        for (let i = 0; i < bytes.length; i += chunk) {
            bin += String.fromCharCode.apply(null, bytes.subarray(i, Math.min(i + chunk, bytes.length)));
        }
        return `data:${mime};base64,${btoa(bin)}`;
    }

    function fetchImageSyncAsDataUrl(url) {
        try {
            const xhr = new XMLHttpRequest();
            xhr.open("GET", url, false);
            xhr.overrideMimeType("text/plain; charset=x-user-defined");
            xhr.send(null);
            if (xhr.status === 0 || (xhr.status >= 200 && xhr.status < 300)) {
                const raw = xhr.responseText;
                const bytes = new Uint8Array(raw.length);
                for (let i = 0; i < raw.length; i++) bytes[i] = raw.charCodeAt(i) & 0xff;
                const mime = /\.jpe?g/i.test(url) ? "image/jpeg" : "image/png";
                return bytesToDataUrl(bytes, mime);
            }
        } catch (_) {}
        return "";
    }

    function loadedDocumentImgDataUrl(src) {
        try {
            const resolved = new URL(src, document.baseURI || location.href).href;
            for (const img of document.images) {
                const imgUrl = img.currentSrc || img.src;
                if (!imgUrl) continue;
                try {
                    if (
                        new URL(imgUrl, document.baseURI || location.href).href === resolved &&
                        img.complete &&
                        img.naturalWidth > 0
                    ) {
                        const canvas = document.createElement("canvas");
                        canvas.width = img.naturalWidth;
                        canvas.height = img.naturalHeight;
                        canvas.getContext("2d").drawImage(img, 0, 0);
                        return canvas.toDataURL("image/png");
                    }
                } catch (_) {}
            }
        } catch (_) {}
        return "";
    }

    function blobToDataUrl(blob) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    }

    async function resolveImageDataUrl(src, forLogo) {
        if (!src || src.startsWith("data:")) return src;

        const fromDoc = loadedDocumentImgDataUrl(src);
        if (fromDoc) return fromDoc;

        const urls = forLogo ? logoCandidateUrls(src) : [src];
        for (const href of urls) {
            let abs;
            try {
                abs = new URL(href, document.baseURI || location.href).href;
            } catch (_) {
                abs = href;
            }

            try {
                const res = await fetch(abs, { cache: "no-store" });
                if (res.ok) {
                    const data = await blobToDataUrl(await res.blob());
                    if (forLogo) cachedLogoDataUrl = data;
                    return data;
                }
            } catch (_) {}

            const sync = fetchImageSyncAsDataUrl(abs);
            if (sync) {
                if (forLogo) cachedLogoDataUrl = sync;
                return sync;
            }
        }

        if (forLogo && cachedLogoDataUrl) return cachedLogoDataUrl;
        return "";
    }

    async function inlineImages(root) {
        const imgs = root.querySelectorAll("img");
        await Promise.all(
            [...imgs].map(async (img) => {
                const src = img.getAttribute("src");
                if (!src || src.startsWith("data:")) return;
                const forLogo = isLogoImg(img);
                const dataUrl = await resolveImageDataUrl(src, forLogo);
                if (dataUrl) {
                    img.setAttribute("src", dataUrl);
                } else if (forLogo) {
                    console.warn("[CAD print] logo not inlined:", src);
                }
            })
        );
    }

    function waitForImages(doc) {
        const images = [...doc.images];
        if (!images.length) return Promise.resolve();
        return Promise.all(
            images.map(
                (img) =>
                    new Promise((resolve) => {
                        if (img.complete) {
                            resolve();
                            return;
                        }
                        img.addEventListener("load", () => resolve(), { once: true });
                        img.addEventListener("error", () => resolve(), { once: true });
                    })
            )
        );
    }

    function wrapDocument(bodyHtml, css, title) {
        return `<!DOCTYPE html>
<html lang="pl">
<head>
<meta charset="utf-8">
<title>${escapeTitle(title)}</title>
<style>${css}</style>
</head>
<body class="cad-doc-page cad-doc-print-job">
<main class="cad-doc-stage">${bodyHtml}</main>
</body>
</html>`;
    }

    function printInIframe(html) {
        return new Promise((resolve) => {
            const iframe = document.createElement("iframe");
            iframe.setAttribute("aria-hidden", "true");
            iframe.style.cssText =
                "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;pointer-events:none";
            document.body.appendChild(iframe);

            const win = iframe.contentWindow;
            const doc = win.document;
            let printed = false;

            const cleanup = () => {
                window.setTimeout(() => iframe.remove(), 600);
            };

            const runPrint = async () => {
                if (printed) return;
                printed = true;
                try {
                    await waitForImages(doc);
                    window.setTimeout(() => {
                        try {
                            win.focus();
                            win.print();
                            resolve(true);
                        } catch (err) {
                            console.error("[CAD print]", err);
                            resolve(false);
                        }
                        win.addEventListener("afterprint", cleanup, { once: true });
                        window.setTimeout(cleanup, 120000);
                    }, 120);
                } catch (err) {
                    console.error("[CAD print]", err);
                    cleanup();
                    resolve(false);
                }
            };

            iframe.addEventListener("load", () => runPrint(), { once: true });
            doc.open();
            doc.write(html);
            doc.close();
            window.setTimeout(() => runPrint(), 500);
        });
    }

    function extractBodyFragment(raw) {
        const trimmed = String(raw || "").trim();
        if (!/<!DOCTYPE|<html/i.test(trimmed)) return trimmed;
        const parser = new DOMParser();
        const doc = parser.parseFromString(trimmed, "text/html");
        const article = doc.querySelector(".cad-doc");
        if (article) return article.outerHTML;
        const main = doc.querySelector("main");
        if (main) return main.innerHTML;
        return doc.body?.innerHTML || trimmed;
    }

    async function prepareFragmentHtml(html, title, customCssHref) {
        const host = document.createElement("div");
        host.innerHTML = extractBodyFragment(html);
        host.querySelectorAll("[data-screen-only]").forEach((node) => node.remove());
        await inlineImages(host);
        const css = await resolveDocumentCss(customCssHref);
        const bodyHtml = host.querySelector(".cad-doc")?.outerHTML || host.innerHTML;
        return wrapDocument(bodyHtml, css, title);
    }

    async function prepareElementHtml(el, title, customCssHref) {
        const clone = el.cloneNode(true);
        clone.querySelectorAll("[data-screen-only]").forEach((node) => node.remove());
        await inlineImages(clone);
        const css = await resolveDocumentCss(customCssHref);
        return wrapDocument(clone.outerHTML, css, title);
    }

    async function printElement(el, title, customCssHref) {
        if (!el) return false;
        const html = await prepareElementHtml(el, title, customCssHref);
        return printInIframe(html);
    }

    async function printDocument(selector, title) {
        const el = document.querySelector(selector || ".cad-doc");
        return printElement(el, title);
    }

    async function printHtml(html, title, customCssHref) {
        const raw = String(html || "").trim();
        if (!raw) return false;
        const prepared = await prepareFragmentHtml(raw, title, customCssHref);
        return printInIframe(prepared);
    }

    window.CAD_printCore = {
        printHtml,
        printDocument,
        printElement,
        printInIframe,
        resolveDocumentCss,
        inlineImages,
        prepareFragmentHtml
    };
    window.CAD_printHtml = printHtml;
    window.CAD_printDocument = printDocument;
})();
