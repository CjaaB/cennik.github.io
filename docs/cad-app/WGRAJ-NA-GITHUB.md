# Co wgrać na GitHub (checklista)

Sprawdzone **20.05.2026** · mobile + słowniczek poprawione lokalnie.  
**Cache strony:** `cad-static-v105` · **apka:** `cad-app-v40` · **admin:** `cad-admin-v16`  
Test telefonu: [MOBILE-I-GITHUB.md](MOBILE-I-GITHUB.md)

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
├── sw.js                   ← service worker KLIENTA (nie obejmuje /admin/)
├── quote.html
├── firestore.rules         ← kopia (prawdziwe reguły: Firebase Console)
├── icons/                  ← ikony PWA klienta
│   ├── icon-192.png
│   ├── icon-512.png
│   └── apple-touch-icon.png
├── admin/
│   ├── index.html
│   ├── manifest.webmanifest
│   ├── sw.js               ← osobny SW admina (cad-admin-v12)
│   └── icons/              ← WYMAGANE — ikony w scope admin PWA!
│       ├── icon-192.png
│       ├── icon-512.png
│       └── apple-touch-icon.png
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

## 2. Obowiązkowo w korzeniu (obok strony)

| Plik / folder | Dlaczego |
|---------------|----------|
| **`config.js`** | Apka ładuje `../config.js` — pogoda, kurs EUR |
| **`site/`** | CSS i JS strony www |
| **`assets/`** | Logo, tło, PDF, vCard, wideo, logotypy partnerów |
| **`sw.js`** | Cache strony (nie mylić z `app/sw.js`) |

---

## 3. Strona www — gdy aktualizujesz landing

Wgraj:

| Pliki |
|-------|
| `index.html` |
| cały folder **`site/`** |
| cały folder **`assets/`** |
| `config.js`, `sw.js` |

**Nie musisz** wgrywać: `tools/`, `wizytowka/`, `qr/`, `docs/`, `firebase.json`, `.firebaserc` — lokalne / Firebase CLI.

---

## 4. CAD Admin — instalacja na telefon

To **nie jest** plik APK z Google Play. To **PWA** (ikona na ekranie).

1. Otwórz w **Chrome** (Android) lub **Safari** (iPhone):  
   **https://cjaab.github.io/cennik.github.io/app/admin/**
2. **Nie** otwieraj z Instagrama / Facebooka — tam instalacja nie działa.
3. **Android:** przycisk **Pobierz CAD Admin** (logowanie lub górny pasek) **lub** menu Chrome ⋮ → „Zainstaluj aplikację”.
4. **iPhone:** Safari → **Udostępnij** → **Dodaj do ekranu początkowego** (panel pokaże kroki po przycisku pobierania).
5. To **inna ikona** niż apka klienta — instaluj tylko z **`/app/admin/`**, nie z `/app/`.
6. Po aktualizacji: usuń starą ikonę admina, wejdź ponownie w link, zainstaluj od nowa (cache SW `cad-admin-v16`, klient `cad-app-v40`, strona `cad-static-v105`).

Po wgraniu nowych plików: usuń starą ikonę admina z ekranu, wyczyść cache Chrome dla strony, otwórz link ponownie.

---

## 5. Jak sprawdzić, czy wgrane poprawnie

Po 1–2 minutach od commita na GitHubie otwórz w przeglądarce:

- https://cjaab.github.io/cennik.github.io/app/js/cad-data.js → musi być **200**, nie 404  
- https://cjaab.github.io/cennik.github.io/app/js/admin-panel.js → **200**  
- https://cjaab.github.io/cennik.github.io/app/admin/icons/icon-192.png → **200**
- https://cjaab.github.io/cennik.github.io/sw.js → **`cad-static-v105`**
- https://cjaab.github.io/cennik.github.io/app/admin/sw.js → pierwsza linia **`cad-admin-v16`**

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
| Cały **`app/`** + **`config.js`** + **`site/`** + **`assets/`** + `index.html` + `sw.js` | Przy każdej aktualizacji |
| Reguły Firestore | Tylko w **Firebase Console → Publish** |
