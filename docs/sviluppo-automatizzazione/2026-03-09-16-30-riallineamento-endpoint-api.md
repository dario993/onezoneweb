# Riallineamento Endpoint API — AutomationService

**Data creazione**: 2026-03-09 16:30
**Stato**: Da implementare

---

## Obiettivo

Riallineare gli endpoint nell'`AutomationService` e nelle interfacce TypeScript ai veri endpoint del backend documentati in `FRONTEND_INTEGRATION.md`.

**Scope**: Solo punto 1 — cambio URL e struttura richieste/risposte. NON include il cambio modello di autenticazione (punto 2), la registrazione consulente (punto 3), il multipart per TOTP (punto 4), il polling asincrono (punto 6), né la gestione errore 429 (punto 7).

---

## Mappatura Endpoint: Vecchio → Nuovo

| # | Metodo attuale | Endpoint attuale | Endpoint reale backend | Note |
|---|---|---|---|---|
| 1 | `checkLogin()` | `POST /check_login` | `POST /consultants/{consultant_id}/verify-login` | Il `consultant_id` va nel path, non nel body |
| 2 | `extractTotp()` | `POST /extract_totp` | `POST /extract-totp-secret` | Solo cambio URL (il formato multipart sarà gestito nel punto 4) |
| 3 | `setupEcoHub()` | `POST /setup` | `POST /consultants/{onezone_id}/credentials` | Solo cambio URL, il body resta simile per ora |
| 4 | `submitQuoteRequest()` | `POST /quote_request` | `POST /generate-quotes` | Solo cambio URL |

---

## File da modificare

### 1. `src/app/services/automation.service.ts`

Modifiche per ogni metodo:

#### `checkLogin(consultantId)`
- **Prima**: `POST ${baseUrl}/check_login` con body `{ consultant_id }`
- **Dopo**: `POST ${baseUrl}/consultants/${consultantId}/verify-login` senza body
- **Mock invariato** (resta `{ logged_in: false }` per compatibilità con i componenti che lo consumano — la mappatura della risposta reale `{ status, login_check }` verrà gestita in un task separato)

#### `extractTotp(payload)`
- **Prima**: `POST ${baseUrl}/extract_totp`
- **Dopo**: `POST ${baseUrl}/extract-totp-secret`
- Body e mock invariati (la conversione a multipart/form-data sarà il punto 4)

#### `setupEcoHub(payload)`
- **Prima**: `POST ${baseUrl}/setup`
- **Dopo**: `POST ${baseUrl}/consultants/${payload.consultant_id}/credentials`
- Il `consultant_id` va estratto dal payload e messo nel path URL
- Il body inviato al backend sarà `{ ecohub_username, ecohub_password, ecohub_totp_secret }` (mappando i nomi dei campi)

#### `submitQuoteRequest(payload)`
- **Prima**: `POST ${baseUrl}/quote_request`
- **Dopo**: `POST ${baseUrl}/generate-quotes`
- Body e mock invariati

### 2. `src/app/interfaces/automation.interface.ts`

- **`EcoHubSetupPayload`**: rinominare i campi per allinearli al backend:
  - `username_eh` → `ecohub_username`
  - `password_eh` → `ecohub_password`
  - `totp_secret` → `ecohub_totp_secret`
  - Rimuovere `otp_code` (non esiste nel backend)
  - Mantenere `consultant_id` (serve per costruire l'URL)

### 3. `src/app/pages/automation-setup/automation-setup.component.ts`

- Aggiornare i nomi dei campi nel form e in `onSubmit()` per riflettere i nuovi nomi dell'interfaccia:
  - `username_eh` → `ecohub_username`
  - `password_eh` → `ecohub_password`
  - `totp_secret` → `ecohub_totp_secret`
  - `otp_code` → rimosso (lo step 3 del wizard non è supportato dal backend come endpoint separato)

### 4. `src/app/pages/automation-setup/automation-setup.component.html`

- Aggiornare i `[(ngModel)]` binding per riflettere i nuovi nomi campi

### 5. `docs/sviluppo-automatizzazione/02-automation-service.md`

- Aggiornare la documentazione con i nuovi endpoint

---

## Cosa NON cambia (fuori scope)

- Il sistema di autenticazione (resta il singolo `automationApiToken` — sarà cambiato nel punto 2)
- Il formato di invio del QR code (resta JSON base64 — sarà cambiato nel punto 4)
- La gestione asincrona delle quote (sarà il punto 6)
- Le interfacce di risposta (`CheckLoginResponse`, `ExtractTotpResponse`) — verranno allineate quando si implementerà la gestione completa
- I mock — restano funzionanti e invariati
- I file `environment.ts` / `environment.prod.ts` — nessun cambio necessario
- I file di traduzione — nessun cambio necessario

---

## Impatto sui componenti

- **`AutomationSetupComponent`**: deve aggiornare i nomi dei campi form (`username_eh` → `ecohub_username`, ecc.)
- **`AutomationFormComponent`**: nessun impatto (il payload del form non cambia)
- **`HomeComponent`**: nessun impatto (chiama `checkLogin()` che mantiene la stessa firma)
