# Co wgrać na GitHub (checklista)

Sprawdzone **20.05.2026**: na żywo brakuje nowych plików (`cad-data.js`, `admin-panel.js`, zaktualizowanych HTML).  
Ikony PWA **są** na serwerze — admin **może** się instalować, ale tylko z właściwego linku i przeglądarki.

---

## Adresy po wgraniu

| Co | URL |
|----|-----|
| Strona www | https://cjaab.github.io/cennik.github.io/ |
| Apka klienta | https://cjaab.github.io/cennik.github.io/app/ |
| **CAD Admin (PWA)** | https://cjaab.github.io/cennik.github.io/app/admin/ |
| Skrót admin | https://cjaab.github.io/cennik.github.io/app/admin.html → przekierowanie |

---

## 1. Obowiązkowo — cały folder `app/`

Wgraj **wszystko** z folderu `app/` (nie tylko wybrane pliki):

```
app/
├── index.html              ← klient PWA
├── admin.html              ← przekierowanie do admin/
├── manifest.json
├── sw.js
├── admin-manifest.json
├── quote.html
├── firestore.rules         ← kopia (prawdziwe reguły: Firebase Console)
├── icons/                  ← WYMAGANE do instalacji!
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── admin/
│   ├── index.html
│   ├── manifest.webmanifest
│   └── sw.js
├── css/
│   ├── app.css
│   ├── admin.css
│   └── quote.css
└── js/
    ├── cad-data.js         ← NOWY — musi być na GitHub!
    ├── admin-panel.js      ← NOWY — musi być na GitHub!
    ├── chat-admin.js
    ├── chat-client.js
    ├── app-shell.js
    ├── app-quote.js
    ├── app-home.js
    ├── app-weather.js
    ├── i18n.js
    └── firebase-config.js
```

Pliki `.md` (README, FIREBASE-SETUP, PUBLIKUJ-REGUŁY) — opcjonalnie, nie psują działania.

Folder `app/functions/` — tylko jeśli wdrażasz push w chmurze (Firebase Functions); **nie jest potrzebny** do zwykłego chatu na GitHub Pages.

---

## 2. Obowiązkowo poza `app/` — tylko jeden plik

W **korzeniu** repozytorium (obok `index.html` strony):

| Plik | Dlaczego |
|------|----------|
| **`config.js`** | Apka ładuje `../config.js` — bez niego kalkulator / pogoda mogą nie działać |

---

## 3. Strona www (reszta) — gdy aktualizujesz stronę

To **osobna** warstwa — wgrywaj gdy zmieniasz landing, nie przy każdej poprawce apki:

| Pliki |
|-------|
| `index.html`, `style.css`, `script.js`, `app.js` |
| `logo1.png`, `tlo.jpg` |
| `regulamin.pdf`, `protokol-wzor.pdf` (jeśli linkujesz z apki / strony) |
| `kontakt-car-all-detailing.vcf` |
| `sw.js` (cache strony głównej, nie mylić z `app/sw.js`) |
| opcjonalnie: `video1.mp4`, `video2.mp4` |

**Nie musisz** wgrywać: `tools/`, `wizytowka/`, `qr/`, `firebase.json`, `.firebaserc` — to lokalne / Firebase CLI.

---

## 4. CAD Admin — instalacja na telefon

To **nie jest** plik APK z Google Play. To **PWA** (ikona na ekranie).

1. Otwórz w **Chrome** (Android) lub **Safari** (iPhone):  
   **https://cjaab.github.io/cennik.github.io/app/admin/**
2. **Nie** otwieraj z Instagrama / Facebooka — tam instalacja nie działa.
3. **Android:** przycisk **Pobierz CAD Admin** (logowanie lub górny pasek) **lub** menu Chrome ⋮ → „Zainstaluj aplikację”.
4. **iPhone:** Safari → **Udostępnij** → **Dodaj do ekranu początkowego** (panel pokaże kroki po przycisku pobierania).
5. To **inna ikona** niż apka klienta — instaluj tylko z **`/app/admin/`**, nie z `/app/`.
6. Po aktualizacji: usuń starą ikonę admina, wejdź ponownie w link, zainstaluj od nowa (cache SW `cad-admin-v11`).

Po wgraniu nowych plików: usuń starą ikonę admina z ekranu, wyczyść cache Chrome dla strony, otwórz link ponownie.

---

## 5. Jak sprawdzić, czy wgrane poprawnie

Po 1–2 minutach od commita na GitHubie otwórz w przeglądarce:

- https://cjaab.github.io/cennik.github.io/app/js/cad-data.js → musi być **200**, nie 404  
- https://cjaab.github.io/cennik.github.io/app/js/admin-panel.js → **200**  
- https://cjaab.github.io/cennik.github.io/app/icons/icon-192.png → **200**

W CAD Admin po zalogowaniu na dole: **Wiadomości | Klienci | Statystyki | Ustawienia**.  
Przy wiadomości klienta jest ikona kosza (usuń pojedynczą wiadomość).

---

## 6. Firebase (już zrobione u Ciebie)

- Reguły: **Publish** w konsoli (plik w repo to tylko kopia).  
- **Anonymous** + **Email/Password** włączone.  
- Domena `cjaab.github.io` w Authorized domains.

---

## Szybkie podsumowanie

| Wgrywasz | Kiedy |
|---------|--------|
| Cały **`app/`** + **`config.js`** | Przy każdej aktualizacji apki i admina |
| Strona (`index.html`, css, js, zdjęcia, PDF) | Gdy zmieniasz www |
| Reguły Firestore | Tylko w **Firebase Console → Publish** |
