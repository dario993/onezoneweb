# Form Automation — Tipo richiesta ("Was können wir für Sie tun") + Registration Scraper

**Data:** 2026-06-22 16:50
**Componente:** `src/app/pages/automation-form/automation-form.component.{ts,html}`

## Obiettivo

Estendere il form `automation-form` con un selettore "Tipo di richiesta" che cambia dinamicamente i campi visibili e il payload inviato a `POST /generate-quotes`, supportando tre modalità:

1. **Solo immatricolazione** (`Nur Nachweis bestellen`) → eVN, no preventivo
2. **Confronto offerte** (`Vergleich Versicherungsangebote`) → flusso attuale, default
3. **Offerta + immatricolazione** (`Offerte und Nachweis nur von dieser Versicherung`) → preventivo + eVN da un singolo assicuratore

## Mappatura modalità → payload (allineata a `CLIENT_GUIDE_GENERATE_QUOTES.md`)

| Modalità UI | `registration_scraper` | `registration_only` | `scrapers` | `submit_vehicle_proof_*` |
|---|---|---|---|---|
| Opzione 1 (solo immatricolazione) | scelto (1 fra 6 supportati) | `true` | omettere | omettere (backend default → V1) |
| Opzione 2 (confronto offerte) | omettere | omettere | array selezionato (≥1) | come oggi (libero) |
| Opzione 3 (offerta + immatricolazione) | scelto (1 fra 6 supportati) | `false` (esplicito) | omettere (ignorato dal backend) | visibili e obbligatori (V1 sempre, V2 se interchangeable_plate=Si) — valori `Yes`/`No` del form inviati così come sono |

**Note backend:**
- `registration_scraper` supportati: `zurich`, `automate`, `helvetia`, `axa`, `mobiliar`, `allianz` (altri → 400).
- Quando `registration_scraper` è settato, `scrapers` viene ignorato (omesso per chiarezza).
- `serial_number_N` deve essere il vero Stammnummer 9 cifre (già validato).
- `reasons_for_redemption_N`: **NON viene reso obbligatorio** dalla UI (scelta esplicita del PO). Resta facoltativo come oggi.
- `submit_vehicle_proof_*` accetta `"Yes"`/`"No"` (verificato a runtime: il backend rifiuta `"Si"`/`"No"` con 422 — la guida `CLIENT_GUIDE_GENERATE_QUOTES.md` è disallineata su questo punto). I valori del form vengono quindi inviati così come sono, senza mapping.

## File modificati

### `src/app/pages/automation-form/automation-form.component.ts`

1. **`buildForm()`** (~righe 815-925): aggiungere due control
   ```ts
   request_type: ['Vergleich Versicherungsangebote', Validators.required],
   registration_scraper: [''],
   ```

2. **Proprietà classe**: 
   ```ts
   registrationScraperOptions = ['zurich', 'automate', 'helvetia', 'axa', 'mobiliar', 'allianz'];
   ```

3. **Getter di visibilità** (accanto a `showVehicle2`, ecc.):
   ```ts
   get isRegistrationOnly(): boolean
   get isCompareOffers(): boolean
   get isOfferAndRegistration(): boolean
   get showRegistrationScraper(): boolean  // opzione 1 || 3
   get showSubmitVehicleProof(): boolean   // opzione 3
   get showScrapersSection(): boolean      // opzione 2
   ```

4. **`setupConditionalFields()`** — aggiungere subscription a `request_type.valueChanges`:
   - Opzione 1: `registration_scraper` → required; `scrapers` → clearValidators+[]; `submit_vehicle_proof_1/2` → clearValidators+''
   - Opzione 2: `registration_scraper` → clearValidators+''; `scrapers` → `minArrayLength(1)`; `submit_vehicle_proof_1/2` → clearValidators
   - Opzione 3: `registration_scraper` → required; `submit_vehicle_proof_1` → required (e `_2` se `showVehicle2`); `scrapers` → clearValidators+[]
   - `updateValueAndValidity()` sui control toccati

5. **`onSubmit()`** (~riga 1256): estrarre dal destructuring `request_type`, `registration_scraper`, `submit_vehicle_proof_1/2`, `scrapers`; costruire payload condizionalmente:
   ```ts
   if (this.isRegistrationOnly) {
     payload.registration_scraper = registration_scraper;
     payload.registration_only = true;
   } else if (this.isOfferAndRegistration) {
     payload.registration_scraper = registration_scraper;
     payload.registration_only = false;
     if (submit_vehicle_proof_1) payload.submit_vehicle_proof_1 = submit_vehicle_proof_1;
     if (this.showVehicle2 && submit_vehicle_proof_2) payload.submit_vehicle_proof_2 = submit_vehicle_proof_2;
   } else {
     payload.scrapers = scrapers;
     if (submit_vehicle_proof_1) payload.submit_vehicle_proof_1 = submit_vehicle_proof_1;
     if (this.showVehicle2 && submit_vehicle_proof_2) payload.submit_vehicle_proof_2 = submit_vehicle_proof_2;
   }
   ```
   `request_type` non viene inviato (solo UI). I valori di `submit_vehicle_proof_*` (`Yes`/`No`) sono passati senza mapping perché il backend li accetta in questa forma.

6. **`fillTestData()`** (~riga 1661): aggiungere `request_type: 'Vergleich Versicherungsangebote'` e `registration_scraper: ''`, poi richiamare `applyRequestTypeValidators()` per riallineare i validators.

### `src/app/pages/automation-form/automation-form.component.html`

1. **Nuovo blocco** prima della sezione "Persönliche Informationen" (riga 32), come card a sé:
   ```html
   <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
     <label>...{{ 'automation.form_request_type' | i18n }}...</label>
     <select formControlName="request_type">
       <option value="Nur Nachweis bestellen">{{ 'automation.form_request_type_opt1' | i18n }}</option>
       <option value="Vergleich Versicherungsangebote">{{ 'automation.form_request_type_opt2' | i18n }}</option>
       <option value="Offerte und Nachweis nur von dieser Versicherung">{{ 'automation.form_request_type_opt3' | i18n }}</option>
     </select>
     @if (showRegistrationScraper) {
       <select formControlName="registration_scraper">
         <option value="">...</option>
         @for (s of registrationScraperOptions; track s) { <option [value]="s">{{ s }}</option> }
       </select>
     }
   </div>
   ```

2. **Wrappare `submit_vehicle_proof_1`** (righe 699-708) con `@if (showSubmitVehicleProof)`.
3. **Wrappare `submit_vehicle_proof_2`** (righe 915-924) con `@if (showSubmitVehicleProof)` (interno a `@if (showVehicle2)`).
4. **Wrappare sezione Scrapers** (righe 1309-1327) con `@if (showScrapersSection)`.

### `src/app/interfaces/automation.interface.ts`

Aggiungere a `QuoteRequestPayload` (campi opzionali):
```ts
registration_only?: boolean;
registration_scraper?: string;
submit_vehicle_proof_1?: string;
submit_vehicle_proof_2?: string;
```

### `src/assets/i18n/{de,en,fr,it}.json` — sezione `automation`

Nuove chiavi:
- `form_request_type` — "Was können wir für Sie tun" / "What can we do for you" / "Que pouvons-nous faire pour vous" / "Cosa possiamo fare per te"
- `form_request_type_opt1` — "Nur Nachweis bestellen" / "Order proof only" / "Commander uniquement l'attestation" / "Solo richiesta immatricolazione"
- `form_request_type_opt2` — "Vergleich Versicherungsangebote" / "Compare insurance offers" / "Comparer les offres d'assurance" / "Confronto offerte assicurative"
- `form_request_type_opt3` — "Offerte und Nachweis nur von dieser Versicherung" / "Offer and proof only from this insurer" / "Offre et attestation uniquement de cet assureur" / "Offerta e immatricolazione solo da questa assicurazione"
- `form_registration_scraper` — "Versicherung für Nachweis" / "Insurance for proof" / "Assurance pour l'attestation" / "Assicurazione per immatricolazione"

## Pattern riusati

- `@if (showXxx) { ... }` per visibilità condizionale (es. `showVehicle2`, `showLeasingCompany1`)
- Validators dinamici via `setValidators`/`clearValidators` + `updateValueAndValidity()` (es. gender → company_name in `setupConditionalFields()`, riga ~928)
- `isInvalid()` / `getError()` per UI errori
- `minArrayLength(1)` su `scrapers` (resta attivo solo quando la sezione è visibile)

## Impatti

- Nessuna regressione attesa per il flusso "Confronto offerte" (modalità default): comportamento identico a oggi.
- Modalità "registrazione" già supportata dal backend — solo UI/payload changes lato frontend.
- Nessun cambiamento a `automation.service.ts`.

## Verifica end-to-end

1. **Opzione 2 (default)**: form identico a oggi, payload include `scrapers`, no `registration_*`.
2. **Opzione 1**: Scrapers e Fahrzeugnachweis nascosti, `registration_scraper` visibile/required. Payload: `registration_only: true`, `registration_scraper: "<scelto>"`, no `scrapers`, no `submit_vehicle_proof_*`.
3. **Opzione 3**: Scrapers nascosti, Fahrzeugnachweis V1 (+V2 se interchangeable) visibili/required, `registration_scraper` visibile/required. Payload: `registration_only: false`, `registration_scraper`, `submit_vehicle_proof_1: "Yes"` (e `_2` se applicabile), no `scrapers`.
4. **Switch tra opzioni**: nessun errore "fantasma", validators si aggiornano correttamente.
5. **i18n**: cambio lingua de/en/fr/it aggiorna label e opzioni.
6. **Modalità pubblica** (`/automation-form-generic-client`): stesso comportamento, `recipient_email` resta obbligatorio.
