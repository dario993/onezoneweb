# Rimozione Polling e Allineamento JSON submitQuoteRequest

**Data**: 2026-03-12 19:48
**Componente**: `automation-form.component.ts` / `.html`

## Obiettivi

### 1. Rimozione gestione Polling
- Rimuovere tutte le proprietà relative al polling (`requestId`, `pollingStatus`, `pollingErrorMessage`, `pollingTimedOut`, `pollingSub`, `POLL_INTERVAL_MS`, `POLL_MAX_ATTEMPTS`)
- Rimuovere i metodi `startPolling()`, `stopPolling()`, `retrySubmit()`
- Rimuovere `OnDestroy` e `ngOnDestroy()`
- Rimuovere import non più necessari (`Subscription`, `interval`, `switchMap`, `takeWhile`, `QuoteRequestStatus`)
- Semplificare `onSubmit()`: chiamare `submitQuoteRequest`, mostrare messaggio "Offerta inviata con successo, nei prossimi minuti riceverai una mail"

### 2. Allineamento form al JSON di esempio
Campi da **aggiungere** al form:
- `electric_vehicle` (stringa, default `""`) — sostituisce i 4 checkbox separati
- `other_questions` (stringa, default `""`)
- `recipient_email` (stringa, default `"automate@onezone.ch"`)
- `scrapers` (array, default `[]`)

Campi da **rimuovere** dal form:
- `electric_vehicle_charging_station`
- `electric_vehicle_high_voltage_battery`
- `electric_vehicle_cyber_protection`
- `electric_vehicle_charging_cards_apps`
- `situation_contract_cancelled`
- `situation_application_rejected`
- `situation_license_suspended`

### 3. Aggiornamento HTML
- Sostituire la sezione polling con messaggio di successo semplice
- Sostituire i 4 checkbox elettrici con un campo testuale `electric_vehicle`
- Rimuovere la sezione "situazioni ultimi 5 anni" (3 checkbox)
- Aggiungere campo `other_questions` (textarea)

## File modificati
- `src/app/pages/automation-form/automation-form.component.ts`
- `src/app/pages/automation-form/automation-form.component.html`
