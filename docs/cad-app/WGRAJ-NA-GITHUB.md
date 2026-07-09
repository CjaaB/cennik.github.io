# Co wgrać na GitHub (checklista)

**Cache (lipiec 2026):** strona `cad-static-v122` · apka `cad-app-v59` · admin `cad-admin-v20`

---

## Adresy po wgraniu

| Co | URL |
|----|-----|
| Strona www | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | https://cjaab.github.io/cennik.github.io/app/ |
| CAD Admin | https://cjaab.github.io/cennik.github.io/app/admin/ |

---

## Kolejność wgrywania (najłatwiej folder po folderze)

Na github.com → repo `cennik.github.io` → **Add file → Upload files**

1. **`assets/`** — przeciągnij cały folder (logo, tło, PDF, wideo, `logos/`)
2. **`site/`** — cały folder (`css/`, `js/`)
3. **`app/`** — **cały** folder (nie pomijaj `icons/`, `admin/icons/`, `js/`)
4. **`config.js`** — plik w korzeniu repozytorium
5. **`sw.js`** — plik w korzeniu
6. **`index.html`** — plik w korzeniu

Po każdym kroku: **Commit changes**. Odczekaj 1–3 minuty przed testem.

---

## Co MUSI być w `app/`

```
app/
├── index.html, quote.html, admin.html
├── manifest.json, sw.js
├── icons/              ← icon-192, icon-512, apple-touch-icon
├── admin/
│   ├── index.html, sw.js, manifest.webmanifest
│   └── icons/          ← te same 3 ikony!
├── css/  (app.css, admin.css, quote.css)
└── js/   (wszystkie pliki .js)
```

---

## Co NIE wgrywać (nie jest potrzebne stronie)

| Folder | Po co jest |
|--------|------------|
| `extras/` | QR, wizytówki — tylko do druku |
| `firebase/` | Firebase CLI lokalnie |
| `tools/` | Generowanie PDF / ikon na PC |
| `docs/` | Instrukcje (opcjonalnie możesz wgrać) |

---

## Szybka weryfikacja (200 OK)

- `…/site/css/style.css`
- `…/app/js/cad-data.js`
- `…/app/admin/icons/icon-192.png`
- `…/sw.js` → pierwsza linia: `cad-static-v122`

---

## Telefon

Po wgraniu: wyczyść cache strony lub Ctrl+F5. Checklista mobile: [MOBILE-I-GITHUB.md](MOBILE-I-GITHUB.md)
