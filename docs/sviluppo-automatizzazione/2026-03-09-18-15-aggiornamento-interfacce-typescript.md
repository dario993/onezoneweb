# Aggiornamento Interfacce TypeScript per Risposte Reali del Backend

> Punto 6 della gap analysis: aggiornare le interfacce TypeScript per riflettere le risposte reali

## Analisi stato attuale

Molte delle interfacce sono gia state corrette nei punti precedenti (1-5). Resta da fare:

### Da correggere

1. **`SetupResponse`** — interfaccia morta, non usata da nessuno. Era il vecchio concetto di "setup unico" che ora e stato sostituito da `ConsultantRegistrationResponse` + `CredentialsUpdateResponse`. Va rimossa.

2. **`ConsultantRegistrationResponse.status`** — attualmente `string`, dovrebbe essere tipizzato come `'created'` (unico valore restituito dal backend).

3. **`CredentialsUpdateResponse.status`** — attualmente `string`, dovrebbe essere tipizzato come `'updated'`.

4. **`EcoHubSetupPayload.ecohub_totp_secret`** — attualmente `string` (required), ma il backend lo accetta come opzionale. Va cambiato in `string` opzionale.

5. **`QuoteRequestPayload`** — manca il campo `marital_status` (stato civile) che il backend accetta e usa.

6. **`ConsultantRegistrationPayload`** — mancano i campi opzionali `commission_number` e `registration_number` presenti nello schema backend.

### Gia corretti (nessuna azione necessaria)

- `CheckLoginResponse` — gia mappa `{ status, login_check, error? }` correttamente
- `ExtractTotpResponse` — gia mappa `{ secret, issuer, name }` correttamente
- `GenerateQuotesResponse` — aggiunta nel punto 5
- `QuoteRequestStatus` — aggiunta nel punto 5
- `QuoteRequestPayload.scrapers` — gia presente come campo opzionale
- `QuoteRequestPayload` non ha `consultant_id` — gia corretto

## File coinvolti

| File | Azione |
|------|--------|
| `src/app/interfaces/automation.interface.ts` | Rimuovere SetupResponse, tipizzare status, aggiungere marital_status, rendere totp_secret opzionale, aggiungere commission/registration_number |

## Impatto

Modifiche solo alle interfacce, nessun impatto funzionale. Nessun componente usa `SetupResponse`.
