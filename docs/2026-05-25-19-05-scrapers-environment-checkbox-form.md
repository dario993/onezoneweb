# Centralizzazione lista assicurazioni (scrapers) in environment + checkbox nel form automation

## Obiettivo

Spostare la lista delle assicurazioni/scrapers (`axa`, `Allianz`, `Helvetia`, `Generali`, `Simpego`, `Zurich`, `Vaudoise`, `Automate`, `Mobiliar`) in `src/environments/environment.ts` (e `environment.prod.ts`) come unica source-of-truth, e utilizzarla:

1. nella modale di `consultant-automation` (sostituendo la costante locale `ALL_SCRAPERS`);
2. in fondo al form `automation-form` come gruppo di checkbox (layout minimal, multi-colonna) per selezionare almeno una assicurazione da interrogare;
3. filtrando dall'elenco mostrato nel form le assicurazioni presenti in `disabled_scrapers` del consulente loggato (ricevuto dalla chiamata `GET /consultants/{id}` già effettuata in `home.component.ts`).

## Modifiche ai file

### 1. `src/environments/environment.ts` e `src/environments/environment.prod.ts`
Aggiunta proprietà:
```ts
automationScrapers: ['axa', 'Allianz', 'Helvetia', 'Generali', 'Simpego', 'Zurich', 'Vaudoise', 'Automate', 'Mobiliar']
```

### 2. `src/app/interfaces/automation.interface.ts`
Estensione di `GetConsultantResponse` con `disabled_scrapers?: string[]`.

### 3. `src/app/pages/home/home.component.ts`
Nella subscribe di `automationService.getConsultant(onezoneId)` (riga 94), oltre a `consultantApiKey`, salvare in StorageService la chiave `consultantDisabledScrapers` come JSON dell'array `disabled_scrapers` (default `[]`).

### 4. `src/app/pages/consultant-automation/consultant-automation.component.ts`
- Rimozione costante locale `ALL_SCRAPERS` (riga 9).
- `allScrapers = environment.automationScrapers`.

### 5. `src/app/pages/automation-form/automation-form.component.ts`
- Import di `environment` e `StorageService`.
- Nuova proprietà `availableScrapers: string[]` calcolata in `ngOnInit` filtrando `environment.automationScrapers` per escludere i nomi presenti in `consultantDisabledScrapers` (match case-insensitive).
- Validator custom su control `scrapers` (già esistente al rigo 680) per richiedere `length >= 1`.
- Metodo `toggleScraper(name)` che aggiunge/rimuove l'elemento nell'array del control `scrapers`.

### 6. `src/app/pages/automation-form/automation-form.component.html`
Aggiunta in fondo al form (prima del bottone submit) di una nuova sezione "Seleziona assicurazioni per ricevere l'offerta" con grid Tailwind `grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2` e una checkbox + label per ogni elemento di `availableScrapers`. Messaggio di errore se nessuna selezione.

### 7. Default selection
In `ngOnInit`, dopo `buildForm()`, il control `scrapers` viene inizializzato con `[...this.availableScrapers]` → all'apertura del form **tutti i checkbox sono già spuntati**. Stesso comportamento applicato a `loadTestData()`.

### 8. Chiavi i18n
Aggiunte in `src/assets/i18n/{it,en,fr,de}.json` sotto la sezione `automation`:
- `scrapers_title` — "Seleziona assicurazioni per ricevere l'offerta" (+ traduzioni)
- `scrapers_hint` — descrizione breve
- `scrapers_required` — messaggio di errore

## Logica di funzionamento

- Al login del consulente: Home chiama `GET /consultants/{id}`, salva `api_key` (già fatto) e `disabled_scrapers` in storage.
- All'apertura del form automation: viene calcolato l'array `availableScrapers` partendo da `environment.automationScrapers` ed escludendo quelli in `consultantDisabledScrapers`.
- L'utente spunta una o più checkbox; il control `scrapers` del FormGroup viene aggiornato di conseguenza.
- La validazione richiede almeno 1 scraper selezionato.
- Al submit, il payload include `scrapers: string[]` (mapping già presente in `QuoteRequestPayload.scrapers`).

## Impatti

- Nessuna modifica al backend né al flusso di submit.
- La modifica della lista in `environment.ts` si riflette automaticamente in `consultant-automation` e `automation-form`.

## Verifica

1. `npm run build` senza errori.
2. Consulente con `disabled_scrapers: []` → 9 checkbox visibili nel form.
3. Consulente con `disabled_scrapers: ['AXA','Mobiliar']` → 7 checkbox visibili.
4. Submit senza selezioni → form invalido.
5. Submit con 2 selezioni → payload include `scrapers: [<v1>, <v2>]`.
6. Pagina `consultant-automation` mostra le 9 assicurazioni dall'environment.
