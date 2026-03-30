# Fix campo electric_vehicle nel payload QuoteRequest

## Problema

L'API `/generate-quotes` si aspetta che `electric_vehicle` sia un oggetto con 4 proprietà booleane:

```json
{
  "stazione di ricarica e accessori": false,
  "batterie alta tensione": false,
  "protezione informatica": false,
  "protezione carte ricarica e app": false
}
```

Attualmente il form invia una stringa vuota `""`.

## Modifiche previste

### 1. `automation-form.component.ts`
- Sostituire il form control `electric_vehicle: ['']` con 4 checkbox booleane:
  - `ev_charging_station` (default: false)
  - `ev_high_voltage_battery` (default: false)
  - `ev_cyber_protection` (default: false)
  - `ev_charging_cards_apps` (default: false)
- In `onSubmit()`, mappare i 4 campi nell'oggetto `electric_vehicle` con le chiavi italiane attese dall'API, e rimuovere i 4 campi singoli dal payload.

### 2. `automation-form.component.html`
- Sostituire l'input text `electric_vehicle` con 4 checkbox con label descrittive.

### 3. `automation.interface.ts`
- Rimuovere i 4 campi `electric_vehicle_*` separati.
- Aggiungere `electric_vehicle` come oggetto con le 4 chiavi booleane.
- Aggiungere `recipient_email` come campo opzionale.
