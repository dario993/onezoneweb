# Autocomplete indirizzo via OpenPLZ API (CH)

**Data**: 2026-06-12 21:37
**Stato**: ✅ Implementato e verificato dall'utente
**Pagina**: `automation-form` (rotta `/automation` e `/automation-form-generic-client`)

## Obiettivo

Trasformare il campo `address` del form preventivi auto in un campo con autocomplete che usa l'API pubblica **OpenPLZ** (`https://openplzapi.org/ch/Streets`), abilitato solo dopo aver inserito `zip_code` e `area` validi. Il campo è ritenuto valido solo se il valore inserito è una via restituita dall'API.

## Endpoint

```
GET https://openplzapi.org/ch/Streets?name={name}&postalCode={zip_code}&locality={area}&page=1&pageSize=20
```

- Pubblica, nessuna auth richiesta.
- Risposta: array di oggetti street (`name`, `postalCode`, `locality`, `canton.{key,name}`).
- Parametro `name`: lettere unicode, cifre, spazi, `.`, `-`, `'` (cfr. https://www.openplzapi.org/en/regex/).

## Comportamento

1. L'autocomplete parte quando `address.length >= 3` **e** `zip_code` (4 cifre, presente in CSV locale) **e** `area` (presente per quel CAP) sono validi.
2. Ogni successivo input (insert/cancel) con `length >= 3` rifa la chiamata, con debounce 350 ms e `distinctUntilChanged`.
3. Per `length < 3` o se zip/area non validi: dropdown chiuso, nessuna chiamata, nessun crash.
4. Selezione da dropdown → campo `address` valido, dropdown chiuso.
5. Digitando valore non presente nei suggerimenti → errore `addressNotFromApi` (i18n `form_err_address_not_found`).
6. Cambio `zip_code` o `area` → svuota suggerimenti + reset address (l'utente rigita).

## Modifiche

### `src/app/interfaces/automation.interface.ts`
- Nuovo `StreetEntry { name; postalCode; locality; canton }`.

### `src/app/services/automation.service.ts`
- Nuovo metodo `searchStreets(name, postalCode, locality)`:
  - HTTP GET diretto a OpenPLZ (no auth header).
  - Validazione regex client su `name`.
  - `catchError` → `of([])`.

### `src/app/pages/automation-form/automation-form.component.ts`
- Stato: `streetSuggestions`, `showAddressDropdown`, `addressLoading`, `validAddresses: Set<string>`, `addressInput$: Subject<string>`.
- `buildForm()`: validator `address` = `[Validators.required, addressFromApiValidator]`.
- `ngOnInit()`: `setupAddressStream()` + subscribe a `zip_code` / `area` valueChanges per reset.
- Handler: `onAddressInput`, `selectStreet`, `hideAddressDropdown`, `canQueryStreets`, `addressFromApiValidator`.
- `getError('address')`: aggiunge case `addressNotFromApi`.
- `fillTestData`: `address: ''` (l'utente deve scegliere dall'API).

### `src/app/pages/automation-form/automation-form.component.html`
- Blocco `<!-- Address -->`: input con `(input)`, `(blur)`, dropdown `@if (showAddressDropdown)` con loading state, hint se `!canQueryStreets`.

### i18n (`it/de/en/fr.json`)
- `automation.form_err_address_not_found`
- `automation.form_address_hint_need_zip_area`

## Verifica

- `npm start`, aprire form, testare casi A–D del piano.
- Network tab: nessuna chiamata se zip o area mancanti; chiamate debounciate altrimenti.
- `npm run build`: nessun errore TS.

## Esito finale

- TypeScript: `tsc --noEmit` pulito.
- Verifica funzionale: confermata dall'utente — l'autocomplete indirizzo funziona come previsto sia in modalità autenticata che pubblica.
- Note implementative effettive (rispetto al piano):
  - Input `address` reso disabilitato finché `canQueryStreets()` è falso (oltre all'hint testuale), per impedire input ambigui.
  - Reset del campo `address` su ogni valueChanges di `zip_code`/`area` (anche se cambia solo per via di `patchValue` da selezione PLZ): scelta conservativa per evitare disallineamenti CAP/via.
  - `fillTestData.address` impostato a `''` per coerenza con la nuova validazione "solo da API".
  - `searchStreets` mappa il payload OpenPLZ riducendolo a `{name, postalCode, locality, canton}` (canton da `canton.key`).
