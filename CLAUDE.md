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
