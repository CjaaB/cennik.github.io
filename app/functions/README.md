# Push w tle dla panelu admina

Gdy klient napisze wiadomość, a Ty masz **zamkniętą** apkę admina na telefonie, powiadomienie wyśle **Cloud Function** (nie sam chat w przeglądarce).

## Co musisz zrobić (jednorazowo)

### 1. Klucz VAPID (w projekcie na GitHubie)

1. [Firebase Console](https://console.firebase.google.com) → projekt **carall-detailing-app**
2. **Project settings** (koło zębate) → **Cloud Messaging**
3. **Web Push certificates** → **Generate key pair**
4. Skopiuj klucz do `app/js/firebase-config.js`:

```javascript
vapidKey: "BEl...twój_klucz...",
```

Wgraj plik na GitHub.

### 2. W panelu admina

1. Otwórz `…/app/admin.html` z GitHub Pages (https, nie plik z dysku)
2. Zaloguj się
3. Kliknij **Włącz powiadomienia** → Zezwól
4. Status powinien mówić, że token push został zapisany

### 3. Wdróż Cloud Function (na komputerze z Node.js)

Potrzebujesz planu **Blaze** (pay-as-you-go; mały ruch chatu jest praktycznie darmowy).

```bash
npm install -g firebase-tools
firebase login
cd "ścieżka/do/Car All Detailing"
firebase use carall-detailing-app
cd app/functions
npm install
cd ../..
firebase deploy --only functions
```

Po wdrożeniu w konsoli Firebase → **Functions** zobaczysz `notifyAdminOnClientMessage`.

## Jak to działa

| Sytuacja | Powiadomienie |
|----------|----------------|
| Admin otwarty / w tle (PWA) | Przeglądarka + ewentualnie FCM |
| Admin zamknięty | Tylko po **vapidKey** + **deploy funkcji** |
| Brak vapidKey | Tylko gdy panel jest otwarty |

## Rozwiązywanie problemów

- **Brak push przy zamkniętej apce** — sprawdź `vapidKey`, przycisk powiadomień, `firebase deploy --only functions`
- **Token nie zapisuje się** — otwórz admin przez https://cjaab.github.io/…/app/admin.html
- **Funkcja nie startuje** — włącz Blaze, włącz API **Cloud Messaging**
