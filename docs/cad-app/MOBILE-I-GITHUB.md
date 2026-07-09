# Telefon + GitHub — checklista „idealnego” wdrożenia

Stan: **20.05.2026** · cache strony: `cad-static-v105` · apka: `cad-app-v40` · admin: `cad-admin-v16`

---

## 1. Co sprawdzić na telefonie (5 minut)

Otwórz w **Chrome** (Android) lub **Safari** (iPhone), nie z Instagrama / Facebooka.

| Test | Adres | Oczekiwany wynik |
|------|--------|------------------|
| Strona www | `https://cjaab.github.io/cennik.github.io/` | Kalkulator, przyciski min. 44px, brak przewijania w bok |
| Tap na logo | Nagłówek strony | Dymek z tekstem Karola (tap ponownie / tap poza — zamyka) |
| Słowniczek | Przycisk **?** po prawej | Modal na pełny ekran, sceny Mycie/Lakier/Ochrona w jednej kolumnie |
| WhatsApp / motyw | Dolny pasek ikon | Ikony okrągłe, nie zasłaniają treści |
| Apka klienta | `…/app/` | Dolna nawigacja, chat, wycena |
| CAD Admin | `…/app/admin/` | Logowanie, Wiadomości / Klienci, instalacja PWA |

Po każdej aktualizacji na GitHubie: **Ctrl+F5** (PC) lub wyczyść cache strony na telefonie.

---

## 2. Co wgrać na GitHub (cały projekt)

Folder **musi** zawierać (oprócz kodu):

| Folder / plik | Wymagane |
|---------------|----------|
| `assets/` | logo, tło, PDF, vCard, logotypy, wideo |
| `app/icons/` | `icon-192.png`, `icon-512.png`, `apple-touch-icon.png` |
| `app/admin/icons/` | to samo dla admina |
| `config.js` | pogoda, kurs EUR |
| `index.html`, `site/`, `sw.js` | strona www |
| `app/` | cały folder (PWA klient + admin) |

Ikony PWA (jeśli brakuje folderu `app/icons/`):

```powershell
cd "ścieżka\do\Car All Detailing"
.\tools\generate-pwa-icons.ps1
# Skopiuj app\icons\ → app\admin\icons\
```

---

## 3. Jak wgrać na GitHub (bez terminala)

Repozytorium docelowe: **https://github.com/cjaab/cennik.github.io**

### Opcja A — GitHub Desktop (najprostsza)

1. Zainstaluj [GitHub Desktop](https://desktop.github.com/).
2. **File → Add local repository** → wybierz folder `Car All Detailing`.
3. Jeśli brak repo: **Create a repository** w tym folderze.
4. **Publish repository** → nazwa `cennik.github.io`, konto `cjaab`.
5. Przy każdej zmianie: wpisz opis commita → **Commit** → **Push origin**.

### Opcja B — strona github.com

1. Wejdź w repo `cjaab/cennik.github.io`.
2. **Add file → Upload files** — przeciągnij zaktualizowane pliki/foldery.
3. **Commit changes**.

### Po pushu

- GitHub Pages: **Settings → Pages → Source: main branch / root** (jeśli jeszcze nie włączone).
- Odczekaj 1–3 minuty, potem test na telefonie.

---

## 4. Weryfikacja po wgraniu (linki 200)

| URL | Musi być |
|-----|----------|
| `…/site/css/style.css` | 200 |
| `…/site/js/script.js` | 200 |
| `…/sw.js` | pierwsza linia: `cad-static-v105` |
| `…/app/js/cad-data.js` | 200 |
| `…/app/admin/icons/icon-192.png` | 200 |

---

## 5. Firebase (bez zmian)

- Firestore Rules → **Publish** w konsoli.
- Storage — opcjonalnie (wyłączone w apce).

---

## 6. Ostatnie poprawki mobilne (v105)

- Safe area (notch) na body i modalach.
- Słowniczek: jedna kolumna scen na telefonie (≤768px).
- Logo: tap otwiera dymek na telefonie (zamiast hover).
- Pola formularza: `font-size: 16px` — bez zoomu iOS przy wpisywaniu modelu auta.
