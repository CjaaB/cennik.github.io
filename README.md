# Car All Detailing — strona + PWA

Projekt **produkcyjny**: landing z kalkulatorem, apka klienta (wycena, chat, rezerwacja) i panel **CAD Admin**.

| Co | URL (po wdrożeniu) |
|----|---------------------|
| Strona www | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | https://cjaab.github.io/cennik.github.io/app/ |
| CAD Admin | https://cjaab.github.io/cennik.github.io/app/admin/ |

## Struktura

| Folder | Opis |
|--------|------|
| `index.html` + `site/` + `assets/` | Strona www |
| `app/` | PWA klienta + admin |
| `config.js` | Wspólna konfiguracja (pogoda, EUR) |
| `sw.js` | Cache strony www |
| `docs/cad-app/` | Wdrożenie, Firebase, mobile |

## Wdrożenie na GitHub

Szczegółowa checklista: **[docs/cad-app/WGRAJ-NA-GITHUB.md](docs/cad-app/WGRAJ-NA-GITHUB.md)**  
Test na telefonie + upload: **[docs/cad-app/MOBILE-I-GITHUB.md](docs/cad-app/MOBILE-I-GITHUB.md)**

**Wgraj zawsze:** `index.html`, `config.js`, `sw.js`, `site/`, `assets/`, cały `app/` (w tym `app/icons/` i `app/admin/icons/`).

**Wersje cache (maj 2026):** strona `cad-static-v105` · klient `cad-app-v40` · admin `cad-admin-v16`

## Mobile

Strona jest zoptymalizowana pod telefony (safe area, touch 44px, modale `100dvh`, słowniczek w jednej kolumnie). Po wdrożeniu przetestuj według `MOBILE-I-GITHUB.md`.

## Firebase

Reguły Firestore: `app/firestore.rules` → opublikuj w konsoli. Instrukcja: `docs/cad-app/PUBLIKUJ-REGUŁY.md`.
