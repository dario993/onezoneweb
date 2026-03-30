# 05 — Modalità Mock API

**Stato**: ✅ Completato
**Scopo**: Permettere lo sviluppo e il testing del frontend senza interrogare il server `server-automation` reale.

> **Nota implementazione**: `throwError` è importato in `automation.service.ts` per permettere di testare i casi errore. Nella Home sono stati aggiunti bottoni `[DEV] Setup` e `[DEV] Form` visibili solo in mock mode per accesso diretto senza passare dal flusso `checkLogin`.

---

## Attivazione / Disattivazione

Controllata dal flag in `src/environments/environment.ts`:

```typescript
export const environment = {
  production: false,
  apiEndpoint: "https://onezone.brokerstar.biz/api/v3",
  automationApiEndpoint: "https://server-automation.example.com/api",
  automationApiToken: "MOCK_TOKEN_DEV_12345",
  useMockApi: true   // ← true = mock attivo, false = chiamate reali
};
```

In **produzione** (`environment.prod.ts`):
```typescript
useMockApi: false  // sempre false in produzione
```

---

## Risposte Mock per Endpoint

### `POST /check_login`

**Risposta mock default** (consulente non configurato):
```typescript
of({ logged_in: false }).pipe(delay(1500))
```

**Per testare il caso "già configurato"** — modifica temporaneamente in `automation.service.ts`:
```typescript
// MOCK TEST: consulente già configurato
return of({ logged_in: true }).pipe(delay(1500));
```

---

### `POST /extract_totp`

**Risposta mock default** (successo):
```typescript
of({ totp: 'MOCK_TOTP_SECRET_BASE32' }).pipe(delay(1500))
```

**Per testare il caso errore** — lancia un'eccezione:
```typescript
return throwError(() => new Error('QR non riconoscibile')).pipe(delay(1500));
```

---

### `POST /setup`

**Risposta mock default** (successo):
```typescript
of({ success: true, message: 'Setup completato con successo.' }).pipe(delay(1500))
```

**Per testare il caso errore credenziali**:
```typescript
return of({ success: false, message: 'Username o password EcoHub non validi.' }).pipe(delay(1500));
```

**Per testare il caso errore OTP**:
```typescript
return of({ success: false, message: 'Codice OTP non valido o scaduto.' }).pipe(delay(1500));
```

---

### `POST /quote_request`

**Risposta mock default** (HTTP 200):
```typescript
of({ status: 'ok', message: 'Richiesta ricevuta.' }).pipe(delay(1500))
```

**Per testare il caso errore**:
```typescript
return throwError(() => ({ status: 500, message: 'Errore interno del server.' })).pipe(delay(1500));
```

---

## Import necessari in `automation.service.ts` per mock

```typescript
import { Observable, of, delay, throwError } from 'rxjs';
```

---

## Come Testare i Flussi Completi

### Flusso 1: Prima configurazione (setup)
1. `useMockApi: true`
2. `checkLogin` mock → `{ logged_in: false }`
3. Clicca "Genera Preventivi" → redirect a `/automation-setup`
4. Completa Step 1, Step 2 (paste immagine qualsiasi), Step 3 (6 cifre qualsiasi)
5. Clicca INVIA → mock `setup` restituisce `{ success: true }`
6. Toast "Operazione completata con successo!" → redirect a `/automation-form`

### Flusso 2: Consulente già configurato
1. Cambia mock di `checkLogin` → `{ logged_in: true }`
2. Clicca "Genera Preventivi" → redirect diretto a `/automation-form`
3. Compila form, invia → toast successo + schermata "riceverai email"

### Flusso 3: Errore nel setup
1. Cambia mock di `setup` → `{ success: false, message: '...' }`
2. Verifica che il toast errore appaia e l'utente rimanga sul wizard

### Flusso 4: Errore invio form
1. Cambia mock di `submitQuoteRequest` → `throwError(...)`
2. Verifica che il toast errore appaia

---

## Note

- Il delay di `1500ms` simula la latenza di rete — ridurlo a `0` per test rapidi
- Non modificare mai `environment.prod.ts` per aggiungere mock
- Prima di passare alla produzione, verificare che `useMockApi: false` in `environment.prod.ts` e che i valori reali di `automationApiEndpoint` e `automationApiToken` siano configurati
