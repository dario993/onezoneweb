# Fix `mandateInformInsurances`: campo body `new_mandate` → `isNew`

## Contesto

Nel flusso "Invia mandato" (pagina `customers-mandate-policies/:id`) il submit del form esegue:

1. `BrokerstarService.uploadProfileFile(...)` con `profileid: this.clientId` — carica il PDF sul profilo del cliente selezionato (corretto).
2. `BrokerstarService.mandateInformInsurances(true, insurancesMap)` — notifica le assicurazioni.

Consultando lo Swagger di BrokerStar (`POST /api/v3/mandate/inform-insurances`), lo schema del request body è:

```json
{
  "_sendMail": false,
  "isNew": false,
  "insurances": { "<insuranceId>": true | false }
}
```

Il codice attuale (`src/app/services/brokerstar.service.ts:652-676`) invia invece la chiave `new_mandate`, che non esiste nello schema. Il backend riceve quindi `isNew = undefined` e il flag "nuovo mandato" non arriva mai.

Nota: la rotta `inform-insurances` non accetta un id cliente (né in path né in body). Il legame al cliente avviene già tramite l'upload del PDF su `profileid`.

## Modifica

- **File**: `src/app/services/brokerstar.service.ts` (metodo `mandateInformInsurances`, righe ~652-676)
- Rinominare nel body la chiave `new_mandate` in `isNew`. La firma del metodo resta invariata; nessuna modifica ai chiamanti.

## Impatto

- `src/app/pages/customers-mandate-policies/customers-mandate-policies.component.ts` (chiamante): nessuna modifica richiesta.

## Verifica

1. `npm run start`
2. Login → aprire un cliente → "Invia mandato" → caricare PDF + selezionare un'assicurazione → invia.
3. In DevTools Network: la POST a `/api/v3/mandate/inform-insurances` deve avere body con `isNew: true` (non più `new_mandate`). Risposta attesa `204`.

## Out of scope

- Verifica nei docs Swagger di eventuali altre rotte del gruppo "Mandate" che leghino esplicitamente il mandato al cliente selezionato (da affrontare in un secondo intervento, se necessario).
- Verifica che `currentUploadEntryid: 1` in `uploadProfileFile` corrisponda alla categoria documenti "Mandate".

---

## Aggiornamento 2026-06-17 — Fix `insurances` map + `contact_login_id`

Dopo il rilascio precedente, il payload inviato a `/mandate/inform-insurances` presentava ancora due problemi:

1. **`insurances`**: le assicurazioni selezionate venivano serializzate con valore `false` invece di `true`. Solo le selezionate devono essere incluse nella mappa, tutte con valore `true`.
2. **`contact_login_id`**: veniva passato `contact.nr` (numero pratica), mentre il backend si aspetta `permissions.id` ottenuto dalla GET `/api/v3/contact/{id}` (il login id dell'utente associato al contatto).

### Payload corretto

```json
{
  "isNew": true,
  "_sendMail": true,
  "insurances": { "109": true, "110": true },
  "contact_login_id": 33635
}
```

### Modifiche

File: `src/app/pages/customers-mandate-policies/customers-mandate-policies.component.ts`

- Rinominata proprietà privata `contactNr: number` → `contactLoginId: number`.
- `loadContact()`: sostituito `this.contactNr = response.nr ?? 0` con `this.contactLoginId = response.permissions?.id ?? 0`.
- `submitMandate()`: il `reduce` su `insurances.filter(i => i.selected)` ora assegna `acc[curr.id] = true` (era `false`).
- Chiamata `mandateInformInsurances(true, insurancesMap, this.contactLoginId)` (era `this.contactNr`).

Nessuna modifica al servizio: `BrokerstarService.mandateInformInsurances()` già accetta il parametro `contactLoginId: number` e lo serializza come `contact_login_id` nel body.

### Verifica

1. Login come consulente → `customers-mandate` → selezionare un cliente (es. id 43355) → `customers-mandate-policies/:id`.
2. Selezionare 1+ assicurazioni, caricare PDF, "Invia mandato".
3. In DevTools Network, body POST `/mandate/inform-insurances`:
   - `insurances` contiene solo gli id selezionati come chiave, tutti con valore `true`.
   - `contact_login_id` uguale al `permissions.id` ritornato dalla GET `/contact/{id}` (non `nr`).
   - `isNew: true`, `_sendMail: true`.
