# Powiadomienia w tle (push + e-mail)

Gdy klient napisze wiadomość, **Cloud Function** może wysłać:

1. **Push** na telefon (CAD Admin, przycisk dzwonka)
2. **E-mail** na Twoją skrzynkę (opcjonalnie — Gmail lub inny SMTP)

Bez wdrożenia Functions działa tylko chat w przeglądarce + powiadomienia gdy panel jest otwarty.

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

### 4. E-mail przy każdej wiadomości klienta (opcjonalnie, polecane)

Nie musisz nic kupować — wystarczy **Gmail** i **hasło aplikacji** (nie zwykłe hasło do konta).

1. Konto Google → **Bezpieczeństwo** → **Weryfikacja dwuetapowa** (włącz)
2. **Hasła aplikacji** → wygeneruj hasło dla „Poczta” / „Inne”
3. W terminalu (w folderze projektu):

```bash
firebase functions:config:set smtp.user="yakasu1999@gmail.com" smtp.pass="xxxx-xxxx-xxxx-xxxx" smtp.to="yakasu1999@gmail.com"
firebase deploy --only functions
```

| Pole | Znaczenie |
|------|-----------|
| `smtp.user` | Konto Gmail, z którego wysyłasz |
| `smtp.pass` | 16-znakowe hasło aplikacji (nie login Gmail) |
| `smtp.to` | Na jaki adres ma przychodzić powiadomienie (może być ten sam) |

W mailu będzie: imię klienta, treść wiadomości, link do **CAD Admin**.

Jeśli **nie** ustawisz `smtp.*`, push nadal może działać — po prostu bez e-maila.

## Jak to działa

| Sytuacja | Powiadomienie |
|----------|----------------|
| Admin otwarty / w tle (PWA) | Przeglądarka + ewentualnie FCM |
| Admin zamknięty | Push po **vapidKey** + deploy; **e-mail** po ustawieniu `smtp.*` + deploy |
| Brak vapidKey | Tylko gdy panel jest otwarty (+ e-mail jeśli SMTP skonfigurowane) |
| Tylko e-mail, bez push | Ustaw `smtp.*`, deploy — działa nawet bez dzwonka w apce |

## Rozwiązywanie problemów

- **Brak push przy zamkniętej apce** — sprawdź `vapidKey`, przycisk powiadomień, `firebase deploy --only functions`
- **Token nie zapisuje się** — otwórz admin przez https://cjaab.github.io/…/app/admin.html
- **Funkcja nie startuje** — włącz Blaze, włącz API **Cloud Messaging**
