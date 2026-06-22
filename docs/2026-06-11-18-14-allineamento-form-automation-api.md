# Allineamento form Automation al contratto API `POST /generate-quotes`

**Data**: 2026-06-11 18:14
**Branch**: `feature/wip-mandato`
**Scope**: pagina `src/app/pages/automation-form/`

---

## 1. Contesto

Backend di riferimento: `https://stage-api-car-scraping.onezone.ch/` — schema completo in `openapi.json` (root del repo) + contratto `~/Downloads/FRONTEND_FORM_CONTRACT.md` (mirror dello `UserSchema` Python lato backend).

Il form attuale `automation-form.component.html` esponeva solo un sottoinsieme dei campi previsti. Mancavano:

- Sezione **Veicolo 1**: 8 campi opzionali
- Sezione **Veicolo 2**: 8 campi opzionali (specchio di V1)
- Sezione **Storico Sinistri**: 5 campi 3-anni + `source_user`
- Sezione **Personal Info**: `main_driver` (oggetto annidato opzionale)

Obiettivo: completare il payload inviato al backend per permettere preventivi più accurati.

---

## 2. Linee guida del lavoro

### 2.1 Decisioni di scoping (confermate dall'utente)

1. **Aggiungere TUTTI i campi opzionali mancanti** in V1, V2, Storico Sinistri.
2. **Implementare `main_driver`** in versione MVP (solo 6 campi essenziali quando `driver_type='other'`).
3. **`electric_vehicle`**: chiavi con spazi (`"stazione di ricarica e accessori"`) lasciate invariate (formato accettato dal backend, confermato dallo schema openapi).
4. **Modifiche su HTML + `automation-form.component.ts`** (FormGroup, option arrays, payload). Niente refactor strutturali.

### 2.2 Vincoli enum (estratti da `openapi.json`)

Tutti i valori inviati al backend devono corrispondere ESATTAMENTE alle enum:

- `gender`: `Maschio` | `Femmina` | `Azienda`
- `vehicle_type_1/2`: `passenger_car` | `van`
- `drive_1/2`: `Benzin` | `Diesel` | `Hybrid-Benzin` | `Hybrid-Diesel` | `Electric`
- `kilometers_per_year_1/2`: `5000` | `7000` | `10000` | `15000` | `20000` | `25000` | `30000` | `+30000`
- `reasons_for_redemption_1/2`: 7 valori (`New redemption`, `Vehicle change`, ecc.)
- `leasing_company_1/2`: 123 voci enum LeasingCompany
- `submit_vehicle_proof_1/2`: `Yes` | `No` (inglese)
- `main_driver.driver_type`: `user` | `other` | `multiple`

### 2.3 Formati

- Date `DD.MM.YYYY` (nascita, patente, prima immatricolazione)
- Date `MM.YYYY` (data di acquisto)
- `serial_number_1/2`: esattamente 9 cifre
- `n_certificate_1/2`: alfanumerico max 7

### 2.4 Limitazioni backend scoperte in fase di test

Due campi del contratto MD risultano NON accettati dal backend reale (validazione respinge il payload):

1. `license_withdrawal_5_years` → "Extra inputs are not permitted" → **RIMOSSO** completamente (FormControl, HTML, options).
2. `other_questions` → deve essere `string`, non `string[]` → **CONVERTITO** a stringa vuota nel payload.

### 2.5 Pattern riusati (per non duplicare codice)

- `siNoOptions`, `claimsOptions`, `cantonOptions`, `nationalityOptions` → già definiti, riutilizzati.
- `onDateInput()` → pattern di formattazione `DD.MM.YYYY`; creato l'analogo `onMonthYearInput()` per `MM.YYYY`.
- `minAgeValidator(18)` → riutilizzato anche per il sub-form `main_driver.first_driving_license_date`.
- `isInvalid()` / `getError()` → pattern di display errori inline; aggiunti gli analoghi nested `isMainDriverInvalid()` / `getMainDriverError()`.
- `@if (showVehicle2)` → riutilizzato il pattern per `@if (showMainDriverFields)` e `@if (showLeasingCompany1/2)`.

---

## 3. Lavoro svolto

### 3.1 `automation-form.component.ts`

**Nuove option arrays** (8):
- `vehicleTypeOptions`, `driveOptions`, `kmPerYearOptions`
- `reasonsForRedemptionOptions` (7 valori)
- `submitVehicleProofOptions`
- `driverTypeOptions` (3 valori: user/other/multiple)
- `leasingCompanyOptions` (array statico di 123 voci copiate da `openapi.json:components.schemas.LeasingCompany.enum`)

**FormGroup esteso**:
- 8 nuovi FormControl in V1: `vehicle_type_1`, `drive_1`, `purchase_date_1`, `kilometers_per_year_1`, `current_mileage_1`, `reasons_for_redemption_1`, `leasing_company_1`, `submit_vehicle_proof_1`
- 8 nuovi FormControl in V2 (specchio)
- 5 FormControl 3-anni: `n_rc_claims_3_years` … `n_partial_comprehensive_claims_3_years`
- `source_user`
- Sub-FormGroup `main_driver` (6 campi: gender, first_name, last_name, birth_date, first_driving_license_date, nationality) + radio `main_driver_type`

**Logica condizionale (`setupConditionalFields`)**:
- Quando `main_driver_type === 'other'` → applica `Validators.required` sui 6 campi del sub-form (più pattern date e `minAgeValidator(18)`).
- Altrimenti rilassa i validatori.
- `valueChanges` su `main_driver.birth_date` → ri-valida `main_driver.first_driving_license_date`.

**Getters aggiunti**:
- `showMainDriverFields`, `showLeasingCompany1`, `showLeasingCompany2`
- `successMessage` (interpolazione `{email}` con `submittedEmail`)

**Helper aggiunti**:
- `onMonthYearInput()` — formattazione live `MM.YYYY`
- `onMainDriverDateInput()` — formattazione date nel sub-form
- `isMainDriverInvalid()`, `getMainDriverError()` — display errori inline nested
- `resolveRecipientEmail()` — risolve `recipient_email` con fallback chain

**`onSubmit` aggiornato**:
1. Destrutturazione di `main_driver_type`, `main_driver`, EV checkboxes, other-questions checkboxes.
2. Costruzione payload:
   - `recipient_email` = `consultantData.ecohub_username` da localStorage; fallback = `email` del form (via `resolveRecipientEmail`).
   - `electric_vehicle` = oggetto con 4 chiavi-spazio.
   - `other_questions` = `""` (stringa vuota; le 3 checkbox del form bloccano il submit aprendo il modale, non popolano il campo).
   - `main_driver` incluso solo se `driver_type ∈ {other, multiple}`:
     - `other` → `{ driver_type: 'other', driver: <campi non vuoti del sub-form> }`
     - `multiple` → `{ driver_type: 'multiple' }`
3. `submittedEmail = recipientEmail` → usato dal box verde di successo.

**`fillTestData` aggiornato** col payload completo (incluso patch del sub-FormGroup `main_driver`).

**Auto-fill in dev mode** (`ngOnInit`):
```ts
if (!environment.production) {
  setTimeout(() => this.fillTestData(), 0);
}
```
Disattivato automaticamente in produzione (override di `environment.ts` → `environment.prod.ts`).

### 3.2 `automation-form.component.html`

- **Personal Info**: aggiunto radio `main_driver_type` + sotto-card condizionale `@if (showMainDriverFields)` con `formGroupName="main_driver"` (6 campi).
- **Veicolo 1**: aggiunti 8 nuovi blocchi field dopo `garage_parking_1`. `leasing_company_1` mostrato solo se `leasing_1=Si` (`@if (showLeasingCompany1)`).
- **Veicolo 2**: stessi 8 campi dentro `@if (showVehicle2)`.
- **Storico Sinistri**: aggiunto blocco "Sinistri 3 anni" con 5 select riusando `claimsOptions`.
- **Box successo**: `{{ successMessage }}` al posto di `'automation.form_success_message' | i18n` → interpola `{email}` con la mail reale.

### 3.3 i18n — `src/assets/i18n/{it,en,de,fr}.json`

Aggiunte ~45 chiavi nuove per labels/opzioni/hint dei nuovi campi: `form_main_driver`, `opt_driver_*`, `form_vehicle_type`, `opt_vtype_*`, `form_drive`, `opt_drive_*`, `form_purchase_date`, `form_month_year_placeholder`, `form_km_per_year`, `form_current_mileage`, `form_reason_redemption`, `opt_reason_*`, `form_leasing_company`, `form_submit_vehicle_proof`, `form_claims_3y_title`, `form_rc_claims_3y` ecc.

Aggiornata `form_success_message` con placeholder `{email}` in tutte le 4 lingue.

### 3.4 `automation.interface.ts`

Esteso `GetConsultantResponse` (era incompleto) con i campi realmente restituiti da `GET /consultants/{id}`:
- `ecohub_username`, `ecohub_password`, `ecohub_totp_secret`, `login_check`

### 3.5 `automation-setup.component.ts`

Al completamento del setup (login EcoHub verificato), aggiunta una chiamata `GET /consultants/{id}` e salvataggio della response come `consultantData` in localStorage. Così:
- Il form (e qualsiasi altra pagina) trova il `consultantData` aggiornato anche se l'utente non è ancora passato dalla Home.
- `ecohub_username` viene letto da `consultantData` direttamente (niente seconda chiave separata).

### 3.6 Cleanup post-test

Rimossi dopo gli errori di validazione backend:
- `license_withdrawal_5_years` (FormControl, HTML, `licenseWithdrawalOptions`)
- `other_questions: []` → `other_questions: ''`

---

## 4. Catena di fallback `recipient_email`

```
1. consultantData.ecohub_username  (da Home OR setup)
2. email del form                  (fallback finale)
```

Vedi `resolveRecipientEmail()` in `automation-form.component.ts`.

---

## 5. Verifica

### 5.1 Build

- ✅ `tsc --noEmit` pulito
- ✅ `ng build --configuration development` ok (~4s, bundle 3.05 MB)

### 5.2 Test manuale richiesto (browser)

1. Avviare `npm start`.
2. Aprire `/automation-form` in dev → form auto-compilato con i dati di test.
3. Verificare:
   - Sub-form `main_driver` visibile (driver_type=`other`).
   - `leasing_company_1` visibile (leasing_1=`Si`).
   - Cambiare `interchangeable_plate=Si` → Veicolo 2 appare con tutti gli 8 nuovi campi.
4. Network → `POST /generate-quotes`: verificare che il body contenga tutti i nuovi campi con i valori enum esatti.
5. Risposta 200 → box verde mostra la mail reale (no placeholder `{email}`).
6. Cambiare lingua (it/en/de/fr) → i nuovi label cambiano, i valori inviati restano in italiano enum.

### 5.3 Edge cases

- `main_driver_type=user` → `main_driver` NON nel payload.
- `main_driver_type=multiple` → `{ driver_type: 'multiple' }` senza `driver`.
- `leasing_1=No` → select `leasing_company_1` nascosta.
- `consultantData` non in localStorage → `recipient_email` fallback alla mail del form.

---

## 6. Note operative

- **123 voci `LeasingCompany`**: hardcoded come `readonly` const nel `.ts` (alternativa: fetch lazy da `/openapi.json`). Documentata la fonte nei commenti.
- **`source_user`**: FormControl presente, ma campo UI non aggiunto (resta stringa vuota — il backend lo accetta).
- **`main_driver` Step 2 (rimandato)**: PersonData completo (16 campi con autocomplete ZIP/canton/area, ecc.) NON implementato. Richiederebbe estrazione di un sub-component `<person-data-fields>` riutilizzabile (refactor non triviale, fuori scope).

---

## 7. File toccati

- `src/app/pages/automation-form/automation-form.component.ts`
- `src/app/pages/automation-form/automation-form.component.html`
- `src/app/pages/automation-setup/automation-setup.component.ts`
- `src/app/interfaces/automation.interface.ts`
- `src/assets/i18n/it.json`
- `src/assets/i18n/en.json`
- `src/assets/i18n/de.json`
- `src/assets/i18n/fr.json`

## 8. TODO future (fuori scope)

- Backend: aggiungere supporto a `license_withdrawal_5_years` (oggi rifiutato).
- Backend: chiarire perché `other_questions` rifiuta array (il contratto MD diceva "string free text").
- Frontend: rimuovere il blocco TEMP di auto-fill in `ngOnInit` prima del rilascio in produzione (è già protetto da `!environment.production`, ma il `// TEMP` è un marker per la pulizia successiva).
- Frontend: implementare main_driver Step 2 (PersonData completo) come sub-component riutilizzabile.
