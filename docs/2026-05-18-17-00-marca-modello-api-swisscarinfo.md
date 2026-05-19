# Integrazione SwissCarInfo v3 per autocomplete marca/modello

**Data:** 2026-05-18 17:00
**Componente:** `automation-form`
**Tipo:** Sostituzione di dataset statico con API dinamica + nuovo service

---

## Obiettivo

Sostituire i campi `<select>` di marca e modello veicolo (oggi popolati dal JSON statico `src/assets/vehicles.json`) con **autocomplete dinamici** che interrogano l'API **SwissCarInfo v3**.

Vantaggi attesi:
- Dataset sempre aggiornato (non più foto statica del CSV USTRA)
- Recupero del campo `type_approval` del modello selezionato → pre-compilazione automatica di `n_certificate_1` / `n_certificate_2`
- Eliminazione di ~382KB di asset statico dal bundle

---

## Contesto API

- **Base URL:** `https://api.swisscarinfo.ch/v3`
- **Endpoint usato:** `GET /search?q=<testo>&type=brand_model`
- **Autenticazione:** header `X-API-Key: <chiave>`
- **Quota:** 500 richieste/giorno (visibile in `meta.quota` di ogni risposta)
- **Lingua:** per ora default API (parametro `lang` non passato)

Struttura risposta (campi che useremo):
```json
{
  "success": true,
  "data": [
    {
      "identification": {
        "type_approval": "1PA537",
        "make": "BMW",
        "commercial_name": "X5 xDrive40i"
      }
    }
  ]
}
```

⚠️ **Nota di sicurezza:** la chiave API verrà esposta nel bundle Angular (SPA lato client). La doc ufficiale raccomanda l'uso server-side, ma in questa fase si è scelto consapevolmente di metterla negli `environment.ts` per semplicità. Da valutare in futuro un proxy lato BrokerStar se la quota o l'esposizione diventano problematiche.

---

## Scelte UX

1. **Due campi separati** (marca e modello) con autocomplete su entrambi — stesso pattern dei campi PLZ/area già presenti nel form
2. Marca: l'utente digita ≥ 2 caratteri, l'API restituisce risultati brand+model, deduplichiamo lato client per `identification.make`
3. Modello: disabilitato finché la marca non è selezionata; quando la marca c'è, l'utente digita e l'API riceve `q="<brand> <query>"`. I risultati vengono filtrati per `identification.make` e deduplicati per `commercial_name`
4. Alla selezione del modello, il campo `n_certificate_X` viene pre-compilato col `type_approval`
5. Al cambio di marca, modello e `n_certificate` vengono resettati
6. **Debounce 400ms** + `switchMap` per cancellare chiamate in volo (proteggere la quota)
7. Errori API → suggerimenti vuoti, nessun crash, log su console

---

## File coinvolti

### Creati
- `src/app/services/swiss-car-info.service.ts` — service Angular che incapsula le due chiamate (`searchBrands`, `searchModels`) con header `X-API-Key`
- Questo documento

### Modificati
- `src/environments/environment.ts` e `environment.prod.ts` — aggiunte `swissCarInfoApiUrl` e `swissCarInfoApiKey`
- `src/app/interfaces/automation.interface.ts` — nuova interfaccia `ModelSuggestion { commercial_name: string; type_approval: string }`
- `src/app/pages/automation-form/automation-form.component.ts` — rimosso caricamento `vehicles.json` + `vehiclesMap` + `onBrandChange`. Aggiunto: iniezione del nuovo service, 4 stream `Subject<string>` con `debounceTime` + `switchMap`, handler `onBrandInput`, `selectBrand`, `onModelInput`, `selectModel`, `hideBrandDropdown`, `hideModelDropdown`. Aggiornati i dati di test in `fillTestData()`.
- `src/app/pages/automation-form/automation-form.component.html` — 4 `<select>` (brand 1, model 1, brand 2, model 2) trasformati in `<input>` + dropdown, replicando il pattern di ZIP/area
- `CLAUDE.md` — riga di indice in "Documenti di Progetto"

### Eliminati
- `src/assets/vehicles.json`

---

## Logica di funzionamento (riassunto)

```
[user digita su Marca]
   └─► onBrandInput(N) ─► brandInputN$.next(query)
         └─► debounce(400ms) + distinctUntilChanged
              └─► switchMap → SwissCarInfoService.searchBrands(query)
                   └─► GET /search?q=...&type=brand_model
                        └─► dedupe make ─► brandSuggestionsN[]

[user clicca un brand]
   └─► selectBrand(N, brand)
        ├─► car_brand_N ← brand
        ├─► car_model_N ← ''
        └─► n_certificate_N ← ''

[user digita su Modello (con brand impostato)]
   └─► onModelInput(N) ─► modelInputN$.next(query)
        └─► debounce + switchMap → searchModels(brand, query)
             └─► GET /search?q=<brand>+<query>&type=brand_model
                  └─► filter by make + dedupe commercial_name → modelSuggestionsN[]

[user clicca un modello]
   └─► selectModel(N, suggestion)
        ├─► car_model_N ← suggestion.commercial_name
        └─► n_certificate_N ← suggestion.type_approval
```

---

## Impatti su componenti esistenti

- **Nessuno** al di fuori di `automation-form`
- Il payload inviato a `automationService.submitQuoteRequest()` mantiene la stessa struttura: `car_brand_1`, `car_model_1`, `n_certificate_1` (e i corrispondenti del veicolo 2) restano stringhe
- `vehicles.json` non è referenziato altrove → eliminazione safe

---

## Edge case gestiti

- Marca vuota → campo modello disabilitato + nessuna chiamata API
- Query < 2 caratteri → nessuna chiamata API
- API in errore (network, 401, 429, 5xx) → dropdown vuoto, form ancora utilizzabile, log console
- Click su voce dropdown mentre l'input perde focus → `setTimeout(200)` su `hide*Dropdown` come già fatto per PLZ/area
- Componente distrutto durante chiamata in volo → `takeUntil(destroy$)` o completamento dei Subject in `ngOnDestroy`

---

## Verifica end-to-end

1. `npx ng build` senza errori dopo refactor
2. `npm start` → aprire `/automation-form`
3. Digitare "bm" nella marca → vedere "BMW" tra i suggerimenti
4. Selezionare "BMW" → modello abilitato, n_certificate resettato
5. Digitare "x5" → vedere `X5 xDrive40i` ecc.
6. Selezionare uno → `car_model_1` e `n_certificate_1` popolati
7. Cambiare marca → modello e n_certificate si svuotano
8. Veicolo 2 (toggle interchangeable_plate = Si): stessa verifica
9. Tab Network: verificare debounce e switchMap funzionanti
10. Submit form → payload corretto
11. Mode test (`fillTestData`) → compila con valori coerenti coi nuovi campi

---

## Nota operativa

L'API key reale verrà fornita dall'utente in fase di implementazione e inserita in `environment.ts` / `environment.prod.ts` come stringa nel campo `swissCarInfoApiKey`.
