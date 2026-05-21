# Firebase — szybka checklista (chat)

Jeśli **wiadomości się nie wysyłają** (klient ani admin), zrób to w [Firebase Console](https://console.firebase.google.com) → projekt **carall-detailing-app**:

## 1. Authentication
- **Sign-in method** → włącz **Anonymous** (dla klienta w apce)
- **Sign-in method** → włącz **Email/Password** (dla admina)
- **Users** → konto admina (Twój e-mail + hasło)

## 2. Authorized domains
- **Authentication** → **Settings** → **Authorized domains**
- Dodaj: `cjaab.github.io` (i `localhost` do testów)

## 3. Firestore Rules
- **Firestore** → **Rules**
- Wklej całą zawartość pliku `app/firestore.rules` z tego repozytorium
- Kliknij **Publish**

## 4. (Opcjonalnie) Powiadomienia push
- **Project settings** → **Cloud Messaging** → Web Push → klucz VAPID → `vapidKey` w `firebase-config.js`

Po Publish odczekaj ~30 s i odśwież aplikację na telefonie.

## Usuwanie rozmów (admin)

- Zaloguj się w **CAD Admin** e-mailem i hasłem z Firebase Authentication (nie anonimowo).
- Reguły muszą pozwalać adminowi na **delete** dokumentów i wiadomości (`app/firestore.rules`).
- Po usunięciu rozmowa znika z listy admina; u klienta chat się resetuje (nowa wiadomość = nowa rozmowa).
- Jeśli widzisz toast o braku uprawnień — reguły w konsoli Firebase **nie są opublikowane** lub są stare.
