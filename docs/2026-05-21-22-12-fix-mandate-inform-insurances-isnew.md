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
