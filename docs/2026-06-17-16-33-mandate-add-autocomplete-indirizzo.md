# Customers Mandate Add — riordino e autocomplete CAP/Località/Indirizzo

**Data:** 2026-06-17 16:33

## Obiettivo

Nella pagina `customers-mandate-add`:
1. Riordinare i campi indirizzo nell'ordine: **CAP → Località → Indirizzo** (sia per persona che per azienda).
2. Replicare il pattern di autocomplete del form `automation-form` per i tre campi:
   - CAP e Località da JSON locale CH (`AutomationService.searchByPlz` / `getLocalitiesByPlz`).
   - Indirizzo da OpenPLZ (`AutomationService.searchStreets`), disponibile solo dopo che CAP e Località sono valorizzati.

## Modifiche

### `customers-mandate-add.component.ts`
- Iniettato `AutomationService`; implementati `OnInit` + `OnDestroy`.
- Stato locale per dropdown (`plzSuggestions`, `areaSuggestions`, `streetSuggestions`, `show*Dropdown`, `addressLoading`, `validAddresses`).
- Subject `addressInput$` con `debounceTime(350) + distinctUntilChanged + switchMap(searchStreets)`.
- Metodi `onPlzInput / selectPlz / onAreaFocus / selectArea / onAddressInput / selectStreet / hide*Dropdown / canQueryStreets` mirror di `automation-form`.
- `checkData()` esteso con validazioni "PLZ valido CH", "Località fra quelle del PLZ", "Indirizzo proveniente da API".
- Reset automatico di indirizzo + suggerimenti quando cambiano `postCode` o `city`.

### `customers-mandate-add.component.html`
- Riordinati i campi nel blocco persona e azienda (CAP, Località, Indirizzo).
- Sostituiti i tre input con il pattern relative-wrapper + `<ul>` suggerimenti (classi Tailwind compatibili con lo stile esistente).
- Indirizzo disabilitato finché CAP+Località non sono validi, con hint testuale.

## Riuso

- `AutomationService.searchByPlz / getLocalitiesByPlz / searchStreets`.
- Interfacce `LocalityEntry`, `StreetEntry`.
- Stesso flusso RxJS di `automation-form.component.ts:1310-1434`.
