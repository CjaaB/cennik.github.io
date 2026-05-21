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

## 5. Ustawienia aplikacji (cennik, godziny, Calendly)

- Kolekcja **`settings`** → dokument **`app`** (tworzy admin z panelu **Ustawienia** lub przycisk „Wgraj domyślny cennik”).
- Klient i wycena **czytają** ten dokument (wymaga zalogowania anonimowego + reguły `read: signedIn`).

## 6. Historia klienta (admin)

- Przy pierwszym użyciu **Historia klienta** Firebase może poprosić o **indeks złożony**: `conversations` → `clientId` + `lastMessageAt` (desc). Kliknij link w błędzie w konsoli przeglądarki i utwórz indeks.

## 7. Powiadomienia push klienta

- Tokeny zapisują się w **`clientTokens`** (apka klienta po włączeniu powiadomień).
- Wysyłka push przy odpowiedzi admina wymaga **Cloud Function** lub rozszerzenia FCM — bez tego działają powiadomienia gdy apka jest otwarta (Firestore + Notification API).

## Usuwanie rozmów (admin)

- Zaloguj się w **CAD Admin** e-mailem i hasłem z Firebase Authentication (nie anonimowo).
- Reguły muszą pozwalać adminowi na **delete** dokumentów i wiadomości (`app/firestore.rules`).
- Po usunięciu rozmowa znika z listy admina; u klienta chat się resetuje (nowa wiadomość = nowa rozmowa).
- Jeśli widzisz toast o braku uprawnień — reguły w konsoli Firebase **nie są opublikowane** lub są stare.
