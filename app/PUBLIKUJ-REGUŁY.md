# Naprawa: „Brak uprawnień Firestore”

Ten komunikat **nie znika sam** po wgraniu plików na GitHub. Reguły muszą być **opublikowane w konsoli Firebase** (projekt `carall-detailing-app`).

## Krok 1 — Otwórz właściwy projekt

1. Wejdź na: https://console.firebase.google.com  
2. Wybierz projekt **carall-detailing-app** (ten sam co w `app/js/firebase-config.js` → `projectId`).

## Krok 2 — Opublikuj reguły

1. Menu po lewej: **Build** → **Firestore Database** → zakładka **Rules**.  
2. **Usuń całą** starą treść w edytorze.  
3. Otwórz na komputerze plik **`app/firestore.rules`** z tego folderu i **skopiuj wszystko** (Ctrl+A, Ctrl+C).  
4. Wklej w edytorze reguł w Firebase (Ctrl+V).  
5. Kliknij **Publish** (Opublikuj).  
6. Poczekaj ok. 30 sekund.

## Krok 3 — Authentication (obowiązkowe)

**Authentication** → **Sign-in method**:

| Metoda | Kto | Status |
|--------|-----|--------|
| **Anonymous** | apka klienta (chat, wycena) | **Włączona** |
| **Email/Password** | CAD Admin | **Włączona** |

W **Users** musi być konto admina (np. `yakasu1999@gmail.com`).

## Krok 4 — Domeny

**Authentication** → **Settings** → **Authorized domains** — dodaj:

- `cjaab.github.io`
- `localhost` (testy)

## Krok 5 — Sprawdzenie

1. Odśwież stronę apki (Ctrl+F5) — adres **https://**, nie `file://`.  
2. **Klient**: wyślij wiadomość w czacie.  
3. **Admin**: zaloguj się **e-mailem i hasłem** (nie anonimowo) → odpowiedz w wątku.

## Częste przyczyny błędu

- Reguły **nigdy nie opublikowane** (zostały stare `allow read, write: if false`).  
- Tryb testowy Firestore **wygasł** (po ~30 dniach) — znowu Publish z `app/firestore.rules`.  
- **Anonymous wyłączone** — klient nie może pisać do `conversations`.  
- Admin **niezalogowany** e-mailem — nie zapisze wiadomości jako `admin`.  
- Otwarcie apki z **innego projektu Firebase** niż `carall-detailing-app`.

## Zawartość reguł (skrót)

- `settings` — odczyt dla wszystkich, zapis tylko admin  
- `conversations` + `messages` — zalogowany użytkownik (klient anonimowy lub admin e-mail)  
- `internal`, `adminTokens` — tylko admin (e-mail w tokenie)  
- `clientTokens` — zapis po zalogowaniu (anonimowy klient)

Po Publish **nie trzeba** ponownie wgrywać reguł na GitHub — GitHub to tylko kopia pliku; decyduje to, co jest w **Firebase Console → Rules**.
