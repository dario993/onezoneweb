# Flusso Registrazione Consulente — Completamento

**Data creazione**: 2026-03-09 17:52
**Stato**: Implementato

---

## Obiettivo

Completare il flusso di registrazione consulente allineandolo al backend reale. Il metodo `registerConsultant()` esiste già nel service, ma il flusso end-to-end ha gap importanti nella gestione degli stati e delle risposte.

---

## Gap Identificati

| # | Problema | Dettaglio |
|---|---------|-----------|
| 1 | `CheckLoginResponse` non allineata | Ha `{ logged_in: boolean }`, backend restituisce `{ status, login_check, error? }` |
| 2 | `GET /consultants/{onezone_id}` mancante | Non c'è modo di verificare se il consulente è già registrato |
| 3 | Flusso Home non gestisce 404 | Se consulente non registrato, `verify-login` restituisce 404, non `{ logged_in: false }` |
| 4 | Mock `checkLogin` non allineato | Restituisce `{ logged_in: false }` invece di `{ status, login_check }` |
| 5 | Mock `extractTotp` non allineato | Restituisce `{ totp: "..." }` invece di `{ secret, issuer, name }` |
| 6 | `SetupResponse` non allineata | Ha `{ success, message }`, backend restituisce `{ status, onezone_id }` |

---

## Modifiche Previste

### 1. `src/app/interfaces/automation.interface.ts`

Aggiornare le interfacce per allinearle al backend:

```typescript
// PRIMA:
export interface CheckLoginResponse {
  logged_in: boolean;
}

// DOPO:
export interface CheckLoginResponse {
  status: 'verified' | 'failed' | 'already_verified' | 'error';
  login_check: boolean;
  error?: string;
}

// PRIMA:
export interface ExtractTotpResponse {
  totp: string;
}

// DOPO:
export interface ExtractTotpResponse {
  secret: string;
  issuer: string;
  name: string;
}

// PRIMA:
export interface SetupResponse {
  success: boolean;
  message?: string;
}

// DOPO (rinominata):
export interface CredentialsUpdateResponse {
  status: string;  // "updated"
  onezone_id: string;
}
```

Aggiungere:

```typescript
export interface GetConsultantResponse {
  id: number;
  onezone_id: string;
  name: string;
  surname: string;
  commission_number?: string;
  registration_number?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
```

### 2. `src/app/services/automation.service.ts`

#### a) Aggiungere `getConsultant()`
```typescript
public getConsultant(onezoneId: string): Observable<GetConsultantResponse> {
  // mock + chiamata reale GET /consultants/{onezone_id} con adminHeaders
}
```

#### b) Aggiornare `checkLogin()` mock
```typescript
// PRIMA mock: { logged_in: false }
// DOPO mock: { status: 'failed', login_check: false }
```

#### c) Aggiornare `extractTotp()` mock
```typescript
// PRIMA mock: { totp: 'MOCK_TOTP_SECRET_BASE32' }
// DOPO mock: { secret: 'MOCK_TOTP_SECRET_BASE32', issuer: 'EcoHub', name: 'test@ecohub.ch' }
```

#### d) Aggiornare `setupEcoHub()` — tipo di ritorno
```typescript
// Cambiare il tipo di ritorno da SetupResponse a CredentialsUpdateResponse
// PRIMA mock: { success: true, message: '...' }
// DOPO mock: { status: 'updated', onezone_id: '...' }
```

### 3. `src/app/pages/home/home.component.ts`

Aggiornare `onGeneraPreventivi()`:

```typescript
// PRIMA:
if (result.logged_in) → automation-form
else → automation-setup

// DOPO:
try checkLogin(consultantId)
  if result.login_check === true → automation-form
  else → automation-setup
catch (err)
  if err.status === 404 → automation-setup (consulente non registrato)
  else → automation-setup (fallback)
```

### 4. `src/app/pages/automation-setup/automation-setup.component.ts`

Aggiornare `extractTotp()`:
```typescript
// PRIMA: this.form.ecohub_totp_secret = result.totp;
// DOPO: this.form.ecohub_totp_secret = result.secret;
```

Aggiornare `onSubmit()`:
```typescript
// PRIMA: if (result.success)
// DOPO: if (result.status === 'updated')
```

### 5. Traduzioni (solo de.json e it.json — già presenti)

Nessuna nuova chiave di traduzione necessaria per queste modifiche.

---

## File da Modificare (riepilogo)

| File | Tipo modifica |
|------|--------------|
| `src/app/interfaces/automation.interface.ts` | Aggiorna interfacce + aggiunge GetConsultantResponse |
| `src/app/services/automation.service.ts` | Aggiunge getConsultant(), aggiorna mock e tipi ritorno |
| `src/app/pages/home/home.component.ts` | Aggiorna flusso onGeneraPreventivi() |
| `src/app/pages/automation-setup/automation-setup.component.ts` | Aggiorna mapping risposte |

---

## Cosa NON cambia (fuori scope)

- Il formato multipart per extract-totp-secret (punto 4 separato)
- Il polling asincrono delle quote (punto 5 separato)
- La gestione errore 429 (punto 7 separato)
- I file di traduzione en.json e fr.json (punto 9 separato)
- L'HTML dei componenti (nessun cambio di layout necessario)
