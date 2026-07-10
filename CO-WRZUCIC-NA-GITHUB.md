# Co wgrać na GitHub (cennik.github.io)

Repo: **https://github.com/cjaab/cennik.github.io**  
Strona: **https://cjaab.github.io/cennik.github.io/**

GitHub Pages serwuje pliki z **korzenia repozytorium** — nie z podfolderu `deploy/`.
Dlatego pliki produkcyjne zostają w korzeniu projektu, a materiały lokalne są w `local/`.

---

## ✅ WGRAJ (GitHub Pages — TAK)

| Folder / plik | URL po wgraniu |
|---------------|----------------|
| `index.html` | `/` — strona www |
| `config.js` | pogoda, kurs EUR |
| `sw.js` | cache strony www |
| `site/` | CSS, JS, dokumenty HTML |
| `assets/` | obrazy, PDF, wideo, galeria, vCard |
| `app/` | PWA klienta + `app/admin/` |
| `private/` | aplikacja protokołu (`/private/`) |
| `README.md` | opcjonalnie (nie psuje strony) |

### Kolejność uploadu (Add file → Upload files)

1. **`assets/`** — cały folder
2. **`site/`** — cały folder
3. **`app/`** — cały folder (w tym `icons/`, `admin/icons/`)
4. **`private/`** — cały folder
5. **`config.js`** — w korzeniu repo
6. **`sw.js`** — w korzeniu repo
7. **`index.html`** — w korzeniu repo

Po każdym kroku: **Commit changes**. Odczekaj 1–3 minuty przed testem.

### Szybka weryfikacja (200 OK)

- `…/site/css/style.css`
- `…/app/js/cad-data.js`
- `…/app/admin/icons/icon-192.png`
- `…/private/index.html`
- `…/sw.js`

---

## ❌ NIE WGRYWAJ (lokalne — NIE)

| Folder | Po co jest |
|--------|------------|
| **`local/`** | **Cały folder — narzędzia, dokumentacja dev, materiały druku** |
| `local/tools/` | Podgląd mobile, serwer HTTP, generowanie PDF/ikon |
| `local/extras/` | Wizytówki, QR, ogłoszenia |
| `local/firebase/` | Firebase CLI |
| `local/unsplash/` | Zdjęcia źródłowe przed kompresją |
| `local/scripts/` | Skrypty budujące pliki JS |
| `local/docs/` | Instrukcje wdrożenia (szczegóły) |

Szczegóły: `local/NIEC-WGRYWAC-NA-GITHUB.txt`

---

## Jak wgrać

### Ręcznie (obecny sposób)

1. Wejdź na github.com → repo `cennik.github.io`
2. **Add file → Upload files**
3. Przeciągnij foldery/pliki z listy ✅ (bez `local/`)
4. Commit

### Git (jeśli używasz)

```bash
git add index.html config.js sw.js site/ assets/ app/ private/
git commit -m "Aktualizacja strony"
git push
```

Folder `local/` jest w `.gitignore` — nie trafi do repo przy `git push`.

---

## Adresy produkcyjne

| Usługa | URL |
|--------|-----|
| Strona www | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | …/app/ |
| CAD Admin | …/app/admin/ |
| Protokół | …/private/ |

Więcej szczegółów: `local/docs/cad-app/WGRAJ-NA-GITHUB.md`
