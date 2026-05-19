# Ricerca per Matricola nel Modale Veicolo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Aggiungere nel modale di ricerca veicolo un campo matricola (Stammnummer) sopra i campi marca/modello; se compilato, la ricerca usa `type=matricule` della SwissCarInfo API con auto-selezione del risultato.

**Architecture:** Il campo matricola esclude automaticamente marca/modello e viceversa. `onSearchVehicles()` controlla quale campo è compilato e dirama: matricola → `searchBySerial()` → auto-select + patch `serial_number_X`; altrimenti → flusso brand/model esistente.

**Tech Stack:** Angular 20, TypeScript, RxJS, SwissCarInfo v3 API, Tailwind CSS, ngx-translate (i18n pipe)

---

## File Map

| File | Operazione | Responsabilità |
|---|---|---|
| `src/assets/i18n/it.json` | Modify | Aggiungere 3 chiavi i18n |
| `src/assets/i18n/de.json` | Modify | Aggiungere 3 chiavi i18n |
| `src/assets/i18n/en.json` | Modify | Aggiungere 3 chiavi i18n |
| `src/assets/i18n/fr.json` | Modify | Aggiungere 3 chiavi i18n |
| `src/app/services/swiss-car-info.service.ts` | Modify | Aggiungere interfaccia matricola + metodo `searchBySerial` |
| `src/app/pages/automation-form/automation-form.component.ts` | Modify | `serialQuery` nel modal state, `onModalSerialInput`, `onModalModelInput`, update `onModalBrandInput`, update `onSearchVehicles`, update `openVehicleModal` |
| `src/app/pages/automation-form/automation-form.component.html` | Modify | Campo matricola + divisore sopra la riga brand/model nel modale |

---

## Task 1: Aggiungere chiavi i18n nelle 4 lingue

**Files:**
- Modify: `src/assets/i18n/it.json`
- Modify: `src/assets/i18n/de.json`
- Modify: `src/assets/i18n/en.json`
- Modify: `src/assets/i18n/fr.json`

In ogni file, aggiungere le 3 nuove chiavi subito dopo `"vehicle_search_results_total": "..."` (riga ~660 in tutti i file, dentro il blocco `"automation": { ... }`).

- [ ] **Step 1: Aggiungere chiavi in `it.json`**

Trovare la riga `"vehicle_search_results_total": "risultati totali"` e aggiungere dopo di essa:

```json
    "vehicle_search_serial_label": "Matricola (Stammnummer)",
    "vehicle_search_serial_placeholder": "Es. 234675930",
    "vehicle_search_or_divider": "oppure",
```

- [ ] **Step 2: Aggiungere chiavi in `de.json`**

Trovare `"vehicle_search_results_total": "Ergebnisse gesamt"` e aggiungere:

```json
    "vehicle_search_serial_label": "Stammnummer (Matricola)",
    "vehicle_search_serial_placeholder": "z.B. 234675930",
    "vehicle_search_or_divider": "oder",
```

- [ ] **Step 3: Aggiungere chiavi in `en.json`**

Trovare `"vehicle_search_results_total": "total results"` e aggiungere:

```json
    "vehicle_search_serial_label": "Serial Number (Stammnummer)",
    "vehicle_search_serial_placeholder": "e.g. 234675930",
    "vehicle_search_or_divider": "or",
```

- [ ] **Step 4: Aggiungere chiavi in `fr.json`**

Trovare `"vehicle_search_results_total": "résultats au total"` e aggiungere:

```json
    "vehicle_search_serial_label": "Matricule (Stammnummer)",
    "vehicle_search_serial_placeholder": "ex. 234675930",
    "vehicle_search_or_divider": "ou",
```

- [ ] **Step 5: Commit**

```bash
git add src/assets/i18n/it.json src/assets/i18n/de.json src/assets/i18n/en.json src/assets/i18n/fr.json
git commit -m "feat: aggiunta chiavi i18n per ricerca matricola nel modale veicolo"
```

---

## Task 2: Aggiungere `searchBySerial` in SwissCarInfoService

**Files:**
- Modify: `src/app/services/swiss-car-info.service.ts`

- [ ] **Step 1: Aggiungere interfacce matricola**

Dopo l'interfaccia `SwissCarInfoResponse` (riga ~33) e prima del `@Injectable`, aggiungere:

```typescript
interface SwissCarInfoMatriculeData {
  identification: {
    make: string;
    commercial_name: string;
    type_approval: string;
    registration_number?: string;
    date_of_approval?: string;
  };
  engine?: { power_kw?: number; power_hp?: number };
  fuel?: { type_label?: string };
}

interface SwissCarInfoMatriculeResponse {
  success: boolean;
  data: SwissCarInfoMatriculeData | null;
}
```

- [ ] **Step 2: Aggiungere metodo `searchBySerial`**

Aggiungere il metodo alla fine della classe, dopo `searchVehicles`:

```typescript
searchBySerial(serial: string, lang: string = 'de'): Observable<VehicleResult | null> {
  const params = new HttpParams()
    .set('q', serial.trim())
    .set('type', 'matricule')
    .set('lang', lang);
  return this.http
    .get<SwissCarInfoMatriculeResponse>(`${this.apiUrl}/search`, { headers: this.headers, params })
    .pipe(
      map((res) => {
        if (!res.success || !res.data) return null;
        const item = res.data;
        return {
          make: item.identification?.make ?? '',
          commercial_name: item.identification?.commercial_name ?? '',
          type_approval: item.identification?.type_approval ?? '',
          fuel_type: item.fuel?.type_label,
          power_kw: item.engine?.power_kw,
          power_hp: item.engine?.power_hp,
          date_of_approval: item.identification?.date_of_approval,
          source: 'matricule',
        } as VehicleResult;
      }),
      catchError((err) => {
        console.error('SwissCarInfo searchBySerial error:', err);
        return of(null);
      })
    );
}
```

- [ ] **Step 3: Verificare build**

```bash
npx ng build --configuration development 2>&1 | tail -20
```

Atteso: nessun errore TypeScript.

- [ ] **Step 4: Commit**

```bash
git add src/app/services/swiss-car-info.service.ts
git commit -m "feat: aggiunto searchBySerial in SwissCarInfoService per ricerca matricola"
```

---

## Task 3: Aggiornare AutomationFormComponent (TypeScript)

**Files:**
- Modify: `src/app/pages/automation-form/automation-form.component.ts`

Ci sono 5 modifiche distinte in questo file.

- [ ] **Step 1: Aggiungere `serialQuery` nella dichiarazione del modal state**

Trovare la dichiarazione `modal = { ... }` (riga ~35) e aggiungere `serialQuery: ''` dopo `modelQuery: ''`:

```typescript
modal = {
    open: false,
    vehicleIndex: 1 as 1 | 2,
    brandQuery: '',
    modelQuery: '',
    serialQuery: '',
    results: [] as VehicleResult[],
    page: 1,
    total: 0,
    loading: false,
    searched: false,
    perPage: 10,
  };
```

- [ ] **Step 2: Aggiornare `openVehicleModal` per resettare `serialQuery`**

Trovare il metodo `openVehicleModal` e aggiornarlo:

```typescript
openVehicleModal(vehicleIndex: 1 | 2): void {
    this.modal = {
      open: true,
      vehicleIndex,
      brandQuery: '',
      modelQuery: '',
      serialQuery: '',
      results: [],
      page: 1,
      total: 0,
      loading: false,
      searched: false,
      perPage: 10,
    };
  }
```

- [ ] **Step 3: Aggiornare `onModalBrandInput` per svuotare la matricola**

Trovare `onModalBrandInput` e aggiungere la riga di esclusione:

```typescript
onModalBrandInput(value: string): void {
    this.modal.brandQuery = value;
    if (value.length > 0) this.modal.serialQuery = '';
    if (value.length >= 2) this.modalBrandInput$.next(value);
    else { this.modalBrandSuggestions = []; this.showModalBrandDropdown = false; }
  }
```

- [ ] **Step 4: Aggiungere `onModalSerialInput` e `onModalModelInput`**

Aggiungere i due nuovi metodi subito dopo `hideModalBrandDropdown`:

```typescript
onModalSerialInput(value: string): void {
    this.modal.serialQuery = value;
    if (value.length > 0) {
      this.modal.brandQuery = '';
      this.modal.modelQuery = '';
      this.modalBrandSuggestions = [];
      this.showModalBrandDropdown = false;
    }
  }

  onModalModelInput(value: string): void {
    this.modal.modelQuery = value;
    if (value.length > 0) this.modal.serialQuery = '';
  }
```

- [ ] **Step 5: Aggiornare `onSearchVehicles` per gestire il branch matricola**

Sostituire l'intero metodo `onSearchVehicles`:

```typescript
onSearchVehicles(): void {
    const serial = this.modal.serialQuery.trim();
    if (serial) {
      this.modal.searched = true;
      this.modal.loading = true;
      const lang = this.i18nService.currentLanguage;
      this.swissCarInfoService.searchBySerial(serial, lang).subscribe((result) => {
        this.modal.loading = false;
        if (result) {
          this.form.patchValue({
            [`serial_number_${this.modal.vehicleIndex}`]: serial,
          });
          this.selectVehicleResult(result);
        } else {
          this.modal.results = [];
          this.modal.total = 0;
        }
      });
      return;
    }
    if (!this.modal.brandQuery.trim() && !this.modal.modelQuery.trim()) return;
    this.modal.page = 1;
    this.modal.searched = true;
    this.modal.loading = true;
    const lang = this.i18nService.currentLanguage;
    this.swissCarInfoService
      .searchVehicles(this.modal.brandQuery, this.modal.modelQuery, 1, this.modal.perPage, lang)
      .subscribe(({ results, total }) => {
        this.modal.results = results;
        this.modal.total = total;
        this.modal.loading = false;
      });
  }
```

- [ ] **Step 6: Verificare build**

```bash
npx ng build --configuration development 2>&1 | tail -20
```

Atteso: nessun errore TypeScript.

- [ ] **Step 7: Commit**

```bash
git add src/app/pages/automation-form/automation-form.component.ts
git commit -m "feat: aggiunta logica ricerca matricola nel modale veicolo"
```

---

## Task 4: Aggiornare il template HTML del modale

**Files:**
- Modify: `src/app/pages/automation-form/automation-form.component.html`

Il modale di ricerca si trova a partire da riga ~840. La sezione "Campi di ricerca" è racchiusa in `<div class="px-6 py-4 border-b shrink-0">` (riga ~857).

- [ ] **Step 1: Aggiungere campo matricola e divisore + estrarre model input a metodo**

Sostituire l'intera sezione `<!-- Campi di ricerca -->`:

```html
    <!-- Campi di ricerca -->
    <div class="px-6 py-4 border-b shrink-0">

      <!-- Matricola -->
      <div class="mb-3">
        <label class="block text-xs font-medium text-gray-500 mb-1">{{ 'automation.vehicle_search_serial_label' | i18n }}</label>
        <input type="text"
          [value]="modal.serialQuery"
          (input)="onModalSerialInput($any($event.target).value)"
          (keydown.enter)="onSearchVehicles()"
          [placeholder]="'automation.vehicle_search_serial_placeholder' | i18n"
          maxlength="9"
          class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>

      <!-- Divisore -->
      <div class="flex items-center my-3">
        <div class="flex-1 border-t border-gray-200"></div>
        <span class="px-3 text-xs text-gray-400">{{ 'automation.vehicle_search_or_divider' | i18n }}</span>
        <div class="flex-1 border-t border-gray-200"></div>
      </div>

      <!-- Brand + Model + Cerca -->
      <div class="flex gap-3">
        <div class="flex-1 relative">
          <input type="text"
            [value]="modal.brandQuery"
            (input)="onModalBrandInput($any($event.target).value)"
            (blur)="hideModalBrandDropdown()"
            (keydown.enter)="onSearchVehicles()"
            [placeholder]="'automation.vehicle_search_brand_placeholder' | i18n"
            class="w-full border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          @if (modalBrandLoading) {
          <span class="absolute right-3 top-2.5 text-gray-400 text-xs">...</span>
          }
          @if (showModalBrandDropdown) {
          <ul class="absolute z-10 w-full bg-white border border-gray-300 rounded-lg mt-1 max-h-48 overflow-y-auto shadow-lg">
            @for (b of modalBrandSuggestions; track b) {
            <li (mousedown)="selectModalBrand(b)"
              class="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm">{{ b }}</li>
            }
          </ul>
          }
        </div>
        <input type="text"
          [value]="modal.modelQuery"
          (input)="onModalModelInput($any($event.target).value)"
          (keydown.enter)="onSearchVehicles()"
          [placeholder]="'automation.vehicle_search_model_placeholder' | i18n"
          class="flex-1 border border-gray-300 rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <button type="button" (click)="onSearchVehicles()"
          class="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg text-sm transition-colors shrink-0">
          {{ 'automation.vehicle_search_btn_search' | i18n }}
        </button>
      </div>
    </div>
```

- [ ] **Step 2: Build finale**

```bash
npx ng build --configuration development 2>&1 | tail -20
```

Atteso: `Build at: ... - Hash: ... - Time: ...ms` senza errori.

- [ ] **Step 3: Commit**

```bash
git add src/app/pages/automation-form/automation-form.component.html
git commit -m "feat: campo matricola nel modale ricerca veicolo con divisore oppure/oder/or/ou"
```

---

## Task 5: Verifica manuale end-to-end

- [ ] **Step 1: Avviare il dev server**

```bash
npm start
```

Navigare su `http://localhost:4200/automation-form` (o la rotta configurata).

- [ ] **Step 2: Verifica ricerca per matricola**

1. Cliccare "Cerca Marca / Tipo" per il Veicolo 1
2. Il modale si apre con il campo matricola in cima, seguito dal divisore "oppure", poi marca/modello
3. Inserire `234675930` nel campo matricola → verificare che brand/model si svuotino
4. Premere Enter → il modale mostra "Ricerca in corso..." poi si chiude automaticamente
5. Verificare che nel form principale siano stati pre-compilati: `car_brand_1`, `car_model_1`, `n_certificate_1`, `serial_number_1`

- [ ] **Step 3: Verifica esclusione automatica**

1. Riaprire il modale
2. Digitare `234675930` in matricola → verificare che brand/model siano vuoti
3. Iniziare a digitare "BMW" in brand → verificare che il campo matricola si svuoti

- [ ] **Step 4: Verifica "nessun risultato" per matricola inesistente**

1. Aprire il modale
2. Inserire `000000000` (matricola sicuramente inesistente)
3. Premere Enter → il modale NON si chiude, mostra "Nessun risultato trovato."

- [ ] **Step 5: Verifica flusso brand/model non modificato**

1. Aprire il modale
2. Non compilare la matricola
3. Digitare "BMW" in brand, selezionare dal dropdown
4. Digitare "X5" in modello, cliccare "Cerca"
5. Verificare che la tabella risultati appaia come prima
6. Cliccare una riga → modale si chiude, brand/model/n_certificate pre-compilati (serial_number_1 NON modificato da questo flusso)

- [ ] **Step 6: Verifica Veicolo 2 (se interchangeable_plate = Si)**

1. Nel form principale impostare "Targa intercambiabile" = Sì
2. Aprire il modale del Veicolo 2
3. Ripetere step 2 con un numero di matricola valido
4. Verificare che vengano compilati `car_brand_2`, `car_model_2`, `n_certificate_2`, `serial_number_2`

- [ ] **Step 7: Verifica multilingua**

Cambiare lingua (DE, EN, FR) e verificare che il label e il divisore siano nella lingua corretta.
