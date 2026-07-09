# Regole di Sviluppo

## Lettura CLAUDE.md e Wiki

All'inizio di ogni lavoro:

1. **Leggere questo file CLAUDE.md** per orientarsi sul progetto e sulle regole
2. **Se il compito lo richiede**, consultare i file della cartella `/wiki` che potrebbero essere inerenti al lavoro (es. routing, servizi, auth, componenti, i18n, API, build)

---

## Consultazione Documentazione Esistente

**Prima di fare qualsiasi cosa**, è obbligatorio:

1. **Listare sempre i file** nella cartella `/docs` e leggerne almeno i titoli
2. **Se si implementa una nuova feature**, cercare un file in `/docs` che possa essere rilevante e leggerlo per capire il contesto già sviluppato
3. I file in `/docs` documentano le feature già implementate: **evitare duplicati** e rispettare le scelte già fatte

---

## Documento di Progetto Obbligatorio

Ogni volta che viene richiesto di sviluppare una nuova funzionalità o implementazione, **prima di scrivere qualsiasi codice** è necessario:

1. **Verificare la data e ora corrente** eseguendo il comando `date` nel terminale
2. **Creare un documento di progetto** nella cartella `/docs` con il nome nel formato: `YYYY-MM-DD-HH-mm-nome-funzione.md` (usando la data e ora correnti appena verificate)
3. **Descrivere nel documento** cosa verrà implementato: obiettivi, modifiche ai file, logica di funzionamento, eventuali impatti su componenti esistenti
4. **Aggiornare la sezione "Documenti di Progetto (docs/)"** in questo file CLAUDE.md, aggiungendo il nuovo documento con il formato: `nome-file.md` — Titolo del documento
5. **Attendere la conferma esplicita dell'utente** prima di procedere con lo sviluppo

> **IMPORTANTE**: Non procedere mai con l'implementazione del codice senza aver prima creato il documento di progetto e ricevuto conferma dall'utente.

---

## Conferma Prima di Iniziare

Prima di iniziare qualsiasi lavoro:

1. **Fornire un resoconto** di cosa verrà fatto (file da creare/modificare, funzionalità da implementare)
2. **Chiedere conferma esplicita** all'utente prima di procedere
3. **Non iniziare l'implementazione** finché l'utente non approva

> **IMPORTANTE**: Queste tre regole si applicano a qualsiasi task, incluse modifiche minori. Nessuna eccezione.

---

## Regole di Stesura del Codice

Queste regole valgono **dopo** che l'utente ha approvato il documento di progetto (vedi sopra) e durante la scrittura del codice.

### 1. Pensare prima di scrivere

- Esplicitare le assunzioni. Se incerto, chiedere.
- Se esistono più interpretazioni, presentarle — non scegliere in silenzio.
- Se esiste un approccio più semplice, dirlo.

### 2. Semplicità

- Codice minimo che risolve il problema, niente di speculativo.
- No feature non richieste, no astrazioni per codice usato una sola volta.
- No gestione errori per scenari impossibili.
- Se hai scritto 200 righe e potevano essere 50, riscrivile.

### 3. Modifiche chirurgiche

- Toccare solo ciò che serve. Non "migliorare" codice adiacente, commenti o formattazione.
- Rispettare lo stile esistente anche se faresti diversamente.
- Rimuovere import/variabili resi inutilizzati **dalle tue modifiche**; non rimuovere dead code preesistente senza chiedere.
- Test: ogni riga modificata deve essere riconducibile alla richiesta dell'utente.

### 4. Criteri di successo verificabili

Per task non banali, formulare un piano breve con verifica per ogni step:

```
1. [Step] → verifica: [come controllo]
2. [Step] → verifica: [come controllo]
```

---

# OneZone Web — Documentazione Tecnica

**OneZone Web** è una SPA Angular 20 che funge da portale clienti per la gestione di polizze assicurative, offerte e comunicazioni con i consulenti. Il backend è **BrokerStar** (`https://onezone.brokerstar.biz/api/v3`), autenticazione via Bearer JWT con validità 24h.

## Stack

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Angular** | 20.1.6 | Framework principale |
| **TypeScript** | 5.8.2 | Linguaggio |
| **RxJS** | 7.8.0 | Programmazione reattiva |
| **Tailwind CSS** | 3.4.17 | Stili utility-first |
| **ngx-toastr** | 19.0.0 | Notifiche toast |

## Architettura

Architettura **Component-Based** con **Standalone Components** (no NgModules). Tre layout principali: `LayoutAuthed`, `LayoutUnauthed`, `LayoutPDF`. Lo stato globale è gestito tramite servizi singleton (no Redux/NgRx).

```
Bootstrap (main.ts)
  └── App Component
        ├── Layouts (Authed / Unauthed / PDF)
        │     └── Pages
        └── Services (Auth, BrokerStar, I18n, Storage, Navigator, Toaster, Loader)
```

## Struttura del Progetto

```
src/app/
├── enums/        # HTTP status codes
├── guards/       # isAuthenticatedRoute, isNonAuthenticatedRoute
├── interfaces/   # Contact, Policy, Quote, PolicyByClient
├── layouts/      # authed/, unauthed/, pdf/
├── pages/        # login, home, policies, policy, customers, offers, ...
├── pipes/        # i18n.pipe.ts
├── services/     # auth, brokerstar, i18n, storage, navigator, toaster, loader, onezone
├── app.routes.ts
└── helper.ts     # isset, trim, clone, convertStringToJSON, ...
```

## Glossario

| Termine | Descrizione |
|---------|-------------|
| **BrokerStar** | Sistema backend per gestione assicurativa |
| **Tender** | Gara/Offerta assicurativa |
| **Claim** | Sinistro |
| **Mandate** | Mandato/Delega |
| **Quotation** | Preventivo |
| **Jasper Report** | Sistema di reportistica PDF |
| **Contact** | Contatto/Cliente/Utente |

## Wiki (dettaglio tecnico)

| File | Contenuto |
|------|-----------|
| [02-routing.md](wiki/02-routing.md) | Sistema di routing, struttura rotte, guard |
| [03-services.md](wiki/03-services.md) | Tutti i servizi: Auth, Brokerstar, I18n, Storage, Navigator, Toaster, Loader, OneZone |
| [04-auth.md](wiki/04-auth.md) | Flusso login/logout completo, validazione token |
| [05-components.md](wiki/05-components.md) | Layouts e tutte le pagine (rotte, funzionalità) |
| [06-i18n.md](wiki/06-i18n.md) | Internazionalizzazione, pipe i18n, cambio lingua runtime |
| [07-api-state.md](wiki/07-api-state.md) | Integrazione API, operatori RxJS, gestione stato |
| [08-build-deploy.md](wiki/08-build-deploy.md) | Build, deployment, configurazioni (TS, Tailwind, Prettier) |
 
---

## Documenti di Progetto (docs/)

- `2026-01-29-00-00-assegnazione-consulente.md` — Piano di Implementazione: Assegnazione Consulente Tramite URL
- `2026-02-11-17-41-fix-file-loading-flash.md` — Fix Flash "Not Supported" nel FileComponent
- `docs/sviluppo-automatizzazione/2026-03-04-16-39-master-control-genera-preventivi.md` — Master Control: Feature "Genera Preventivi" con wizard EcoHub, form preventivi auto e modalità mock
- `docs/sviluppo-automatizzazione/2026-03-09-16-30-riallineamento-endpoint-api.md` — Riallineamento Endpoint API AutomationService ai veri endpoint backend
- `docs/sviluppo-automatizzazione/2026-03-09-17-38-autenticazione-due-livelli.md` — Autenticazione a 2 Livelli: ADMIN_API_KEY + Consultant api_key
- `docs/sviluppo-automatizzazione/2026-03-09-17-52-flusso-registrazione-consulente.md` — Flusso Registrazione Consulente: allineamento interfacce, getConsultant(), gestione 404
- `docs/sviluppo-automatizzazione/2026-03-09-17-59-extract-totp-multipart.md` — Conversione extract-totp-secret da JSON/base64 a multipart/form-data
- `docs/sviluppo-automatizzazione/2026-03-09-18-03-polling-asincrono-generate-quotes.md` — Polling asincrono dopo generate-quotes (request_id → status tracking)
- `docs/sviluppo-automatizzazione/2026-03-09-18-15-aggiornamento-interfacce-typescript.md` — Aggiornamento interfacce TypeScript per risposte reali del backend
- `docs/2026-03-11-17-56-checklogin-dopo-setup.md` — CheckLogin dopo Setup Automazione: verifica login EcoHub post-setup con messaggio di attesa
- `docs/2026-03-12-20-06-fix-electric-vehicle-payload.md` — Fix campo electric_vehicle: da stringa a oggetto con 4 checkbox booleane per l'API
- `docs/2026-03-19-16-47-customers-lazy-loading-scroll.md` — Caricamento a scaglioni con scroll per la pagina Customers
- `docs/2026-03-24-16-57-i18n-automation-form.md` — Internazionalizzazione del form preventivi auto (automation-form)
- `docs/2026-03-31-19-07-form-mandate-wefox.md` — Nuova pagina Form Mandate Wefox: replica del form "Mandate einreichen"
- `docs/2026-04-28-15-24-flusso-invia-mandato.md` — Flusso "Invia Mandato": bottone Home + pagine customers-mandate, customers-mandate-add, customers-mandate-policies/:id
- `docs/2026-05-12-16-24-pannello-gestione-consulenti.md` — Tasto "Gestione consulenti" nel Menu: visibile solo agli account con contact.id 58 o 25755
- `docs/2026-05-14-17-47-veicoli-json-statico.md` — Marca/Modello auto da CSV svizzero: JSON statico 55k coppie uniche in assets, select dinamici nel form automation
- `docs/2026-05-18-17-00-marca-modello-api-swisscarinfo.md` — Integrazione SwissCarInfo v3 per autocomplete marca/modello con pre-compilazione type_approval
- `docs/2026-05-21-21-23-cache-sessionstorage-customers-mandate.md` — Cache sessionStorage con stale-while-revalidate per customers-mandate
- `docs/2026-05-21-22-12-fix-mandate-inform-insurances-isnew.md` — Fix payload `mandateInformInsurances`: campo `new_mandate` → `isNew` per allineamento allo schema Swagger
- `docs/2026-05-22-15-17-struttura-app-per-redesign.md` — Documento struttura app e inventario UI funzionale (senza stile grafico) per redesign from-scratch
- `docs/2026-05-25-19-05-scrapers-environment-checkbox-form.md` — Centralizzazione lista assicurazioni in `environment` + checkbox selezione scrapers nel form automation, filtrate per `disabled_scrapers` del consulente
- `docs/2026-05-25-20-20-cache-consultant-home.md` — Cache-first in Home della GET `/consultants/{id}`: chiave `consultantData` in localStorage, salta chiamata API se presente
- `docs/2026-05-25-20-25-cache-banner-home.md` — Cache-first in Home della GET `wp/v2/banner`: chiave `bannerData` in localStorage
- `docs/2026-05-25-20-30-cache-verify-login-home.md` — Cache-first in Home della POST `/consultants/{id}/verify-login`: chiave `consultantLoginCheck` in localStorage
- `docs/2026-05-25-21-04-fix-cambio-lingua-reload.md` — Fix cambio lingua: switch `getSelectedLanguage()` per codici corti + `window.location.reload()` in `selectLanguage()`
- `docs/2026-05-26-16-22-validator-eta-patente.md` — Validator custom su `first_driving_license_date`: età calcolata deve essere ≥ 18 anni
- `docs/2026-05-26-18-04-descrizione-storico-sinistri.md` — Descrizione informativa sotto il titolo "Storico Sinistri" nel form automation (i18n it/en/de/fr)
- `docs/2026-05-26-18-31-other-questions-checkbox.md` — Nuova sezione "Altre domande" con 3 checkbox; campo API `other_questions` come array di stringhe tradotte nella lingua corrente
- `docs/2026-05-26-18-57-block-offer-other-questions.md` — Blocco submit + modal "Non possibile calcolare l'offerta" se almeno una checkbox della Sezione 6 è selezionata
- `docs/2026-06-02-15-27-bottone-invia-mandato-home.md` — Bottone "Invia mandato" in Home (solo consulenti), sopra "Genera Preventivi", link a `/customers-mandate`
- `docs/2026-06-11-18-14-allineamento-form-automation-api.md` — Allineamento del form automation al contratto API `POST /generate-quotes`: nuovi campi V1/V2/Sinistri, sub-form `main_driver`, `recipient_email` da `consultantData.ecohub_username`, auto-fill in dev mode
- `docs/2026-06-11-18-26-automation-form-public-route.md` — Rotta pubblica `/automation-form-generic-client`: stesso form senza login, `recipient_email` dal form, consulente fisso con apiKey `valeman` da environment
- `docs/2026-06-12-21-37-autocomplete-indirizzo-openplz.md` — Autocomplete campo `address` nel form automation via OpenPLZ API (CH): abilitato solo con `zip_code`+`area` validi, ≥3 char, validator "from API"
- `docs/2026-06-16-18-23-lang-query-param-automation-form-public.md` — Query param `?lang=it|de|fr|en` sulla rotta pubblica `automation-form-generic-client` per forzare la lingua del form
- `docs/2026-06-17-16-33-mandate-add-autocomplete-indirizzo.md` — Riordino campi `customers-mandate-add` (CAP → Località → Indirizzo) + autocomplete CH (JSON locale + OpenPLZ) come in `automation-form`
- `docs/2026-06-22-16-50-form-tipo-richiesta-immatricolazione.md` — Form automation: selettore "Was können wir für Sie tun" (3 modalità), `registration_scraper`/`registration_only` nel payload, visibilità condizionale Scrapers/Fahrzeugnachweis
- `docs/2026-06-22-18-43-license-suspension-select.md` — Form automation: la domanda "Ritiro patente" (Sezione 6) da checkbox a `<select>` con 4 opzioni (durata); in `other_questions` finisce `"<label>: <durata>"` quando ≠ keine
- `docs/2026-06-24-14-24-mandate-add-gender-civico-mobile.md` — customers-mandate-add: radio Gender (Mann/Frau) nel form persona, campo Hausnummer concatenato in `payload['address']`, mobile obbligatorio, label DE "Privat Kunde"/"Firma"
- `docs/2026-06-24-14-40-main-driver-multiple-only-company.md` — automation-form: opzione "Mehrere Fahrer" (`main_driver_type=multiple`) visibile solo se gender = `Azienda` (Firma); reset a `user` quando il gender cambia
- `docs/2026-07-03-17-45-perf-customers-mandate-single-call.md` — customers-mandate: fusione base+enrich in una sola `GET /contact` con `add[…]` e `limit=30` (elimina doppia chiamata per pagina)
- `docs/2026-07-06-16-18-customers-mandate-pages-map.md` — customers-mandate: refactor cache in `Map<page, records>` + rebuild per gestire add/delete/reorder backend durante la revalidate
- `docs/2026-07-06-18-26-rinomina-tires-garage-labels.md` — Rinomina etichette i18n `form_tires_damage` (pneumatici + cerchi) e `form_garage_free_choice` (rimosso "libera") in it/en/fr/de
- `docs/2026-07-06-20-16-autocomplete-keyboard-nav.md` — Navigazione da tastiera (ArrowUp/Down/Home/End/Enter/Esc) + ARIA combobox/listbox nei dropdown di autocomplete indirizzo (CAP/Località/Via) in automation-form e customers-mandate-add
