# Car All Detailing — aplikacja (PWA)

Osobna aplikacja mobilna oparta na stronie: **kalkulator (pełna strona), chat, PL/NL/EN, instalacja z linku, powiadomienia dla admina**.

## Adres po wdrożeniu

`https://cjaab.github.io/cennik.github.io/app/`

## Co potrafi aplikacja

- **Start** — szybkie skróty (wycena, chat, WhatsApp, Calendly)
- **Wycena** — pełna strona w aplikacji (kalkulator, pogoda, PDF, wszystkie sekcje)
- **Chat** — wiadomości od klientów (Firebase)
- **Więcej** — kontakt, udostępnienie linku, panel admina
- **Instalacja** — „Dodaj do ekranu głównego” (Android / iPhone / PC)
- **Języki** — PL, NL, EN (interfejs aplikacji; kalkulator dziedziczy język ze strony)

## Jak wysłać znajomemu do testów

1. **Najprościej:** wyślij link do `.../app/` — po otwarciu w Chrome/Safari: *Zainstaluj* / *Dodaj do ekranu początkowego*.
2. **Udostępnij w apce:** zakładka *Więcej* → *Udostępnij aplikację* (kopiuje link).
3. **ZIP (offline test):** spakuj folder `app/` + pliki strony (`index.html`, `style.css`, `script.js`, `app.js`, `config.js`, `logo1.png` itd.) — znajomy musi otworzyć przez lokalny serwer (np. Live Server w VS Code), nie przez `file://`.

> Prawdziwy plik `.apk` (Android) wymaga osobnego kroku (Capacitor / Google Play). PWA działa jak aplikacja bez sklepu.

---

## Konfiguracja Firebase (chat + powiadomienia)

### 1. Utwórz projekt

1. Wejdź na [Firebase Console](https://console.firebase.google.com)
2. *Add project* → np. `car-all-detailing`
3. Włącz **Authentication** → Sign-in method → **Email/Password** → włącz
4. Utwórz użytkownika (Twój email + hasło) — to login do `admin.html`
5. Włącz **Firestore Database** → Start in **test mode** (potem wklej reguły poniżej)

### 2. Skopiuj konfigurację

Project settings → Your apps → Web app → skopiuj `firebaseConfig`.

W pliku `app/js/firebase-config.js`:

```javascript
window.CAD_FIREBASE = {
    enabled: true,
    apiKey: "AIza...",
    authDomain: "twoj-projekt.firebaseapp.com",
    projectId: "twoj-projekt",
    storageBucket: "twoj-projekt.appspot.com",
    messagingSenderId: "123...",
    appId: "1:123...",
    vapidKey: "BEl...",
    adminEmail: "twoj@email.com"
};
```

### 3. Powiadomienia push (opcjonalnie, dla Ciebie)

1. Firebase → Project settings → **Cloud Messaging** → *Web Push certificates* → Generate key pair → wklej jako `vapidKey`
2. Zaloguj się w `app/admin.html` → *Włącz powiadomienia*
3. Zainstaluj panel admina na telefonie (Add to Home Screen)

Gdy aplikacja admina jest otwarta lub w tle (PWA), dostaniesz alert o nowej wiadomości. **Push przy całkowicie zamkniętej apce:** `vapidKey` w config + przycisk powiadomień w adminie + wdrożenie funkcji z `app/functions/` (instrukcja w `app/functions/README.md`).

**Panel admina:** godzina przy każdej wiadomości, zakładki Aktywne / Archiwum, przycisk Archiwizuj / Przywróć.

### 4. Reguły Firestore (wklej w Firebase → Firestore → Rules)

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /conversations/{convId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null || request.resource.data.keys().hasAll(['clientName', 'clientLang']);
      allow update: if request.auth != null
        || (request.auth != null == false && request.resource.data.diff(resource.data).affectedKeys().hasOnly(['lastMessage', 'lastMessageAt', 'unreadAdmin']));
      match /messages/{msgId} {
        allow read: if request.auth != null || true;
        allow create: if request.auth != null || request.resource.data.sender == 'client';
      }
    }
    match /adminTokens/{tokenId} {
      allow read, write: if request.auth != null;
    }
  }
}
```

> Dla produkcji warto zawęzić reguły — na start testów powyższe wystarczą.

---

## Panel admina (Ty)

Otwórz: `app/admin.html`  
Zaloguj emailem z Firebase. Lista rozmów po lewej, odpowiedzi po prawej.

**Tip:** dodaj skrót admina na ekran główny telefonu — to Twoja „apka do wiadomości”.

---

## Link ze strony głównej

Na stronie www możesz dodać przycisk:

`https://twoja-domena/app/`

---

## Pliki

| Plik | Opis |
|------|------|
| `app/index.html` | Aplikacja klienta |
| `app/admin.html` | Panel Karola |
| `app/manifest.json` | Instalacja PWA |
| `app/sw.js` | Cache + powiadomienia |
| `app/js/firebase-config.js` | Klucze Firebase (UZUPEŁNIJ) |

---

## Bezpieczeństwo

- Nie publikuj haseł admina w repozytorium.
- `firebase-config.js` z kluczem API jest normalny dla aplikacji web — ochronę daje Firestore Rules + Auth.
- Po testach ustaw reguły Firestore na stricte.
