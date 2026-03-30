# Polling Asincrono dopo generate-quotes

> Punto 5 della gap analysis: implementare il polling dello stato dopo l'invio di una richiesta preventivi

## Problema attuale

Il frontend tratta `POST /generate-quotes` come sincrono: al completamento della chiamata HTTP, mostra `submitSuccess = true` con un messaggio statico "Richiesta inviata!". In realta il backend restituisce `{ status: "accepted", request_id: 42 }` e il processo di scraping avviene in modo asincrono. Manca completamente il tracking dello stato della richiesta.

## Obiettivo

Dopo l'invio del form, mostrare all'utente lo stato di avanzamento della richiesta:
- **accepted/pending** — Richiesta accettata, in attesa di elaborazione
- **processing** — Scraping in corso
- **completed** — Preventivi generati con successo
- **error** — Errore durante l'elaborazione

## Implementazione

### 1. Nuova interfaccia `GenerateQuotesResponse`

**File**: `src/app/interfaces/automation.interface.ts`

Aggiungere:
```typescript
export interface GenerateQuotesResponse {
  status: 'accepted';
  request_id: number;
  message: string;
}

export interface QuoteRequestStatus {
  id: number;
  status: 'pending' | 'processing' | 'completed' | 'error';
  error_message?: string;
  created_at?: string;
  updated_at?: string;
}
```

### 2. Nuovo metodo `pollQuoteStatus` nell'AutomationService

**File**: `src/app/services/automation.service.ts`

- Aggiungere metodo `getQuoteRequestStatus(requestId: number)` che chiama un endpoint di polling
- Nota: il backend originale suggerisce polling diretto su Supabase DB. Per il frontend Angular, implementiamo un endpoint generico `GET /quote-requests/{request_id}/status` oppure usiamo un pattern di polling con `interval` + `switchMap`
- Dato che il backend non ha un endpoint dedicato di status, useremo il pattern di polling lato client con un endpoint ipotizzato `GET /quote-requests/{request_id}` (autenticato con consultant api_key)
- In modalita mock, simulare la progressione: pending → processing → completed

### 3. Modifiche al componente `AutomationFormComponent`

**File**: `src/app/pages/automation-form/automation-form.component.ts`

- Dopo `submitQuoteRequest` con successo, salvare il `request_id`
- Avviare un polling con `interval(5000)` che chiama `getQuoteRequestStatus(requestId)`
- Gestire i vari stati: mostrare UI diversa per pending/processing/completed/error
- Fermare il polling quando lo stato e `completed` o `error`
- Timeout massimo di 5 minuti (60 tentativi * 5 secondi)

### 4. Modifiche al template HTML

**File**: `src/app/pages/automation-form/automation-form.component.html`

Sostituire la schermata di successo statica con una UI dinamica:
- Stato **accepted/pending**: spinner + "Richiesta accettata, in attesa di elaborazione..."
- Stato **processing**: spinner + "Generazione preventivi in corso..."
- Stato **completed**: checkmark verde + "Preventivi generati con successo!"
- Stato **error**: icona errore + messaggio di errore + pulsante "Riprova"

### 5. Traduzioni

**File**: `src/assets/i18n/de.json`, `src/assets/i18n/it.json`

Aggiungere chiavi:
- `automation.status_pending` — "Richiesta in coda..."
- `automation.status_processing` — "Generazione preventivi in corso..."
- `automation.status_completed` — "Preventivi generati!"
- `automation.status_error` — "Si e verificato un errore durante l'elaborazione."
- `automation.status_timeout` — "L'elaborazione sta impiegando piu tempo del previsto."
- `automation.retry` — "Riprova"

### 6. Gestione errore 429

Quando `submitQuoteRequest` restituisce HTTP 429, mostrare un messaggio specifico "Il pool di sessioni e pieno. Riprova tra qualche minuto." invece del generico errore.

## File coinvolti

| File | Azione |
|------|--------|
| `src/app/interfaces/automation.interface.ts` | Aggiungere `GenerateQuotesResponse` e `QuoteRequestStatus` |
| `src/app/services/automation.service.ts` | Aggiungere `getQuoteRequestStatus()`, tipizzare `submitQuoteRequest`, mock polling |
| `src/app/pages/automation-form/automation-form.component.ts` | Logica polling con interval/switchMap, gestione stati |
| `src/app/pages/automation-form/automation-form.component.html` | UI dinamica per i vari stati |
| `src/assets/i18n/it.json` | Traduzioni polling |
| `src/assets/i18n/de.json` | Traduzioni polling |

## Note

- Il polling si ferma automaticamente su `completed`, `error` o dopo timeout di 5 minuti
- In mock mode, simuliamo la progressione pending → processing → completed in circa 10 secondi
- L'endpoint di polling ipotizzato e `GET /quote-requests/{request_id}` — quando il backend lo implementera, basta aggiornare l'URL
