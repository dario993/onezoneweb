# Regole di Sviluppo

## Documento di Progetto Obbligatorio

Ogni volta che viene richiesto di sviluppare una nuova funzionalità o implementazione, **prima di scrivere qualsiasi codice** è necessario:

1. **Verificare la data e ora corrente** eseguendo il comando `date` nel terminale
2. **Creare un documento di progetto** nella cartella `/docs` con il nome nel formato: `YYYY-MM-DD-HH-mm-nome-funzione.md` (usando la data e ora correnti appena verificate)
3. **Descrivere nel documento** cosa verrà implementato: obiettivi, modifiche ai file, logica di funzionamento, eventuali impatti su componenti esistenti
4. **Attendere la conferma esplicita dell'utente** prima di procedere con lo sviluppo

> **IMPORTANTE**: Non procedere mai con l'implementazione del codice senza aver prima creato il documento di progetto e ricevuto conferma dall'utente.

---

# Documentazione Tecnica - OneZone Web Application

## Indice
1. [Panoramica Generale](#1-panoramica-generale)
2. [Stack Tecnologico](#2-stack-tecnologico)
3. [Architettura dell'Applicazione](#3-architettura-dellapplicazione)
4. [Struttura del Progetto](#4-struttura-del-progetto)
5. [Sistema di Routing](#5-sistema-di-routing)
6. [Servizi Principali](#6-servizi-principali)
7. [Autenticazione e Autorizzazione](#7-autenticazione-e-autorizzazione)
8. [Componenti e Pagine](#8-componenti-e-pagine)
9. [Internazionalizzazione (i18n)](#9-internazionalizzazione-i18n)
10. [Integrazione API](#10-integrazione-api)
11. [Gestione dello Stato](#11-gestione-dello-stato)
12. [Build e Deployment](#12-build-e-deployment)
13. [Configurazioni](#13-configurazioni)

---

## 1. Panoramica Generale

**OneZone Web** è un'applicazione web moderna per la gestione di polizze assicurative, clienti e offerte. L'applicazione funge da portale clienti per interagire con il sistema BrokerStar, permettendo agli utenti di:

- Gestire le proprie polizze assicurative
- Visualizzare e accettare offerte
- Comunicare tramite chat con consulenti
- Generare report e documenti
- Gestire il proprio profilo e contatti

### Versione
**v2.1.8**

### Tipo di Applicazione
Single Page Application (SPA) con architettura standalone basata su Angular 20.

---

## 2. Stack Tecnologico

### Framework e Librerie Principali

| Tecnologia | Versione | Utilizzo |
|------------|----------|----------|
| **Angular** | 20.1.6 | Framework principale |
| **TypeScript** | 5.8.2 | Linguaggio di programmazione |
| **RxJS** | 7.8.0 | Programmazione reattiva |
| **Tailwind CSS** | 3.4.17 | Framework CSS utility-first |
| **ngx-toastr** | 19.0.0 | Notifiche toast |
| **PostCSS** | 8.5.6 | Trasformazione CSS |
| **Autoprefixer** | 10.4.21 | Prefissi CSS automatici |

### Strumenti di Sviluppo

- **Angular CLI** 20.1.4 - Tooling per sviluppo
- **Karma** 6.4.0 - Test runner
- **Jasmine** 5.8.0 - Framework di testing
- **Prettier** - Code formatting (configurato per template Angular)

---

## 3. Architettura dell'Applicazione

### Pattern Architetturale

L'applicazione segue un'architettura **Component-Based** con **Standalone Components** (Angular 20+), eliminando la necessità di NgModules.

```
┌─────────────────────────────────────────────┐
│           Bootstrap (main.ts)               │
│              App Component                  │
└──────────────────┬──────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────┐        ┌─────▼──────┐
   │  Layouts │        │  Services  │
   └────┬─────┘        └─────┬──────┘
        │                     │
   ┌────┴─────────┐    ┌─────┴──────────┐
   │   - Authed   │    │  - Auth        │
   │   - Unauthed │    │  - BrokerStar  │
   │   - PDF      │    │  - I18n        │
   └──────┬───────┘    │  - Storage     │
          │            │  - Navigator   │
     ┌────▼─────┐      │  - Toaster     │
     │  Pages   │      └────────────────┘
     └──────────┘
```

### Principi di Design

1. **Separation of Concerns**: Separazione netta tra presentazione, logica di business e accesso ai dati
2. **Dependency Injection**: Gestione centralizzata delle dipendenze
3. **Reactive Programming**: Utilizzo di Observable e RxJS per gestire dati asincroni
4. **Component Isolation**: Componenti standalone auto-sufficienti
5. **Guard-based Authorization**: Protezione delle rotte tramite guard funzionali

---

## 4. Struttura del Progetto

```
onezoneweb_20251219/
├── src/
│   ├── app/
│   │   ├── enums/              # Enumerazioni (es. HTTP status)
│   │   │   └── http.ts
│   │   ├── guards/             # Route guards
│   │   │   └── group.guard.ts
│   │   ├── interfaces/         # TypeScript interfaces
│   │   │   ├── contact.interface.ts
│   │   │   ├── policy.interface.ts
│   │   │   ├── policy-by-client.interface.ts
│   │   │   └── quote.interface.ts
│   │   ├── layouts/            # Layout components
│   │   │   ├── authed/         # Layout per utenti autenticati
│   │   │   ├── unauthed/       # Layout per utenti non autenticati
│   │   │   └── pdf/            # Layout per visualizzazione PDF
│   │   ├── pages/              # Componenti pagina
│   │   │   ├── login/
│   │   │   ├── register/
│   │   │   ├── home/
│   │   │   ├── profile/
│   │   │   ├── policies/
│   │   │   ├── policy/
│   │   │   ├── policyadd/
│   │   │   ├── policyselect/
│   │   │   ├── policycalculate/
│   │   │   ├── customers/
│   │   │   ├── consultant/
│   │   │   ├── offers/
│   │   │   ├── report/
│   │   │   ├── agreement/
│   │   │   ├── file/
│   │   │   ├── menu/
│   │   │   ├── language/
│   │   │   └── recover/
│   │   ├── pipes/              # Custom pipes
│   │   │   └── i18n.pipe.ts
│   │   ├── services/           # Servizi applicativi
│   │   │   ├── auth.service.ts
│   │   │   ├── brokerstar.service.ts
│   │   │   ├── i18n.service.ts
│   │   │   ├── i18nfile.service.ts
│   │   │   ├── navigator.service.ts
│   │   │   ├── onezone.service.ts
│   │   │   ├── storage.service.ts
│   │   │   ├── toaster.service.ts
│   │   │   └── loader.service.ts
│   │   ├── app.ts              # Root component
│   │   ├── app.config.ts       # Application configuration
│   │   ├── app.routes.ts       # Route configuration
│   │   └── helper.ts           # Utility functions
│   ├── assets/
│   │   ├── favicons/           # Favicon e manifest
│   │   ├── i18n/               # File di traduzione
│   │   │   ├── de.json
│   │   │   ├── en.json
│   │   │   ├── fr.json
│   │   │   └── it.json
│   │   └── statics.json        # Dati statici
│   ├── environments/           # Configurazioni ambiente
│   │   ├── environment.ts
│   │   └── environment.prod.ts
│   ├── index.html              # HTML principale
│   ├── main.ts                 # Bootstrap dell'app
│   └── styles.scss             # Stili globali
├── public/                     # File pubblici statici
├── dist/                       # Output di build
├── node_modules/               # Dipendenze
├── angular.json                # Configurazione Angular CLI
├── package.json                # Dipendenze npm
├── tailwind.config.js          # Configurazione Tailwind
├── tsconfig.json               # Configurazione TypeScript
└── README.md                   # Documentazione
```

---

## 5. Sistema di Routing

### Configurazione delle Rotte

Il routing è definito in [app.routes.ts](src/app/app.routes.ts) e utilizza una struttura gerarchica con layout differenti.

#### Struttura Rotte

```typescript
routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rotte non autenticate
  {
    path: '',
    component: LayoutUnauthedComponent,
    canActivate: [isNonAuthenticatedRoute],
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'recover', component: RecoverComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'register/:consultantCode', component: RegisterComponent },
      { path: 'language_unauthed', component: LanguageComponent }
    ]
  },

  // Rotte autenticate
  {
    path: '',
    component: LayoutAuthedComponent,
    canActivate: [isAuthenticatedRoute],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'menu', component: MenuComponent },
      { path: 'policies', component: PoliciesComponent },
      { path: 'policy/:policyid', component: PolicyComponent },
      // ... altre rotte autenticate
    ]
  },

  // Rotte PDF
  {
    path: '',
    component: LayoutPDFComponent,
    canActivate: [isAuthenticatedRoute],
    children: [
      { path: 'file/:fileid', component: FileComponent },
      { path: 'jasper/:reportName/:contactId', component: FileComponent }
    ]
  },

  { path: '**', redirectTo: '/login', pathMatch: 'full' }
]
```

### Guard di Routing

Definiti in [group.guard.ts](src/app/guards/group.guard.ts):

#### `isAuthenticatedRoute`
Protegge le rotte che richiedono autenticazione:
- Verifica se l'utente è loggato tramite `authService.isLogged()`
- Se non loggato, reindirizza a `/login`
- Restituisce `true` se autenticato

#### `isNonAuthenticatedRoute`
Protegge le rotte accessibili solo quando non autenticati:
- Verifica se l'utente NON è loggato
- Se già loggato, reindirizza a `/home`
- Restituisce `true` se non autenticato

---

## 6. Servizi Principali

### 6.1 AuthService

**File**: [auth.service.ts](src/app/services/auth.service.ts)

**Responsabilità**: Gestione completa dell'autenticazione e sessione utente.

#### Proprietà Principali
```typescript
- isAuth: boolean           // Stato autenticazione
- isRegister: boolean       // Stato registrazione
- isConsultant: boolean     // Ruolo consulente
- token: string             // Token JWT
- userData: any             // Dati utente corrente
- tokenValidUntil: Date     // Scadenza token
```

#### Metodi Principali

| Metodo | Descrizione | Parametri | Ritorno |
|--------|-------------|-----------|---------|
| `isLogged()` | Verifica se l'utente è autenticato | - | `boolean` |
| `startSession(oUserAuthData)` | Inizia una nuova sessione | `oUserAuthData` | `Promise<boolean>` |
| `loadSession()` | Carica sessione da storage | - | `void` |
| `endSession()` | Termina sessione corrente | - | `void` |
| `fetchUserData()` | Recupera dati utente | - | `Promise<boolean>` |
| `logout()` | Effettua logout | - | `Promise<boolean>` |
| `getUserName(type, name1, name2)` | Formatta nome utente | `type?`, `name1?`, `name2?` | `string` |

#### Flusso di Autenticazione

```
1. Login (LoginComponent)
   ↓
2. BrokerstarService.login()
   ↓
3. AuthService.startSession(authData)
   ↓
4. Salva token (validità 24h)
   ↓
5. Fetch userData via BrokerstarService.userMe()
   ↓
6. Salva in StorageService (token, userData, tokenValidUntil)
   ↓
7. Redirect a /home
```

---

### 6.2 BrokerstarService

**File**: [brokerstar.service.ts](src/app/services/brokerstar.service.ts)

**Responsabilità**: Interfaccia con le API del backend BrokerStar.

**Base URL**: `https://onezone.brokerstar.biz/api/v3`

#### Categorie di API

##### Autenticazione
- `login(username, password)` - Login utente
- `logout()` - Logout utente

##### Gestione Contatti
- `registerUser(registerData)` - Registrazione nuovo utente
- `addSubcontact(registerData)` - Aggiunge sotto-contatto
- `contactRelation(page, limit, contact_login_id, contact_id)` - Relazioni contatti
- `contactContactList(requestParams)` - Lista contatti (con paginazione automatica)
- `contact(contactid)` - Dettagli singolo contatto
- `changeContact(contactid, payload)` - Modifica contatto
- `changeContactPassword(payload)` - Cambio password
- `contactGetAvatar(contact)` - Recupera avatar

##### Gestione Utente
- `userMe()` - Dati utente corrente
- `userMeUpdate(formData)` - Aggiorna dati utente

##### Menu e Navigazione
- `customerportalmenu(level)` - Menu portale clienti (con cache)

##### Chat
- `chatConversationMessages(userid, limit, page, lastid)` - Messaggi chat
- `chatFloodedChat()` - Verifica flood chat
- `chatPostMessage(message, userid)` - Invia messaggio
- `chatMuteConversation(userid)` - Silenzia conversazione

##### Documenti e File
- `getDocumentCategoryItemInfo(contact)` - Info categoria documenti
- `fileInfo(fileid)` - Info file
- `file(fileid)` - Download file
- `contactFiles(contactid)` - File di un contatto
- `uploadFile(files, params, claimid)` - Upload file
- `uploadProfileFile(options, file)` - Upload file profilo

##### Polizze
- `policyList(requestParams)` - Lista polizze
- `policy(policyid)` - Dettagli polizza
- `premiumInvoice(policyid)` - Fattura premio

##### Sinistri (Claims)
- `createClaim(policyid, datetime, info)` - Crea sinistro
- `claimInformInsurances(claimid)` - Notifica assicurazioni

##### Mandati
- `mandateInformInsurances(newMandate, insurances)` - Informa assicurazioni

##### Preventivi e Offerte
- `quotation()` - Lista preventivi (con cache)
- `tender()` - Lista tender
- `tenderOffer(tenderid)` - Offerte per tender
- `tenderOfferAccept(offerid)` - Accetta offerta
- `tenderOfferReject(offerid)` - Rifiuta offerta

##### Report
- `createJasperreport(reportName, contactid)` - Genera report Jasper
- `createSignetJasperreport(reportName, contactid, image)` - Report con firma

##### Assicurazioni
- `insurance()` - Lista assicurazioni

##### Password Recovery
- `confirmResetPassword(formData)` - Conferma reset password
- `resetPassword(formData)` - Reset password

#### Caratteristiche Tecniche

**Headers Standard**:
```typescript
{
  'Authorization': 'Bearer ' + this.token,
  'Accept': 'application/json'
}
```

**Gestione Errori**: Ogni chiamata utilizza `catchError` di RxJS per gestire errori HTTP.

**Cache**: Alcuni endpoint (menu, quotations) implementano caching tramite `StorageService`.

**Paginazione Automatica**: `contactContactList` carica automaticamente tutte le pagine in parallelo usando `forkJoin`.

---

### 6.3 I18nService

**File**: [i18n.service.ts](src/app/services/i18n.service.ts)

**Responsabilità**: Gestione internazionalizzazione e traduzioni.

#### Lingue Supportate
- `de` - Tedesco (default)
- `en` - Inglese
- `fr` - Francese
- `it` - Italiano

#### Metodi Principali

| Metodo | Descrizione |
|--------|-------------|
| `init(storage, navigator, languagesAvailable)` | Inizializza il servizio |
| `checkLanguage()` | Rileva lingua browser |
| `getSelectedLanguage()` | Ottiene lingua selezionata |
| `loadLanguage(oLang)` | Carica file lingua |
| `getTranslation(...aGroups)` | Ottiene traduzione per chiave |
| `getTypeAsNummeric(languageType)` | Converte lingua in codice numerico |

#### Mappatura Lingue-Codici

```typescript
de → 1
fr → 2
it → 3
en → 4
```

#### Utilizzo

```typescript
// Nel componente
this.i18nService.getTranslation('menu', 'home')  // → "Home"
this.i18nService.getTranslation('login', 'email')  // → "Email"
```

**Fallback**: Se la traduzione non viene trovata, restituisce `'MISSINGTRANSLATION'`.

---

### 6.4 StorageService

**File**: [storage.service.ts](src/app/services/storage.service.ts)

**Responsabilità**: Gestione del localStorage del browser.

#### Metodi
- `setItem(key, value)` - Salva nel localStorage
- `getItem(key)` - Recupera dal localStorage
- `removeItem(key)` - Rimuove dal localStorage
- `clear()` - Pulisce tutto il localStorage
- `clearOldVersions()` - Pulisce vecchie versioni cache

#### Dati Persistiti
- `token` - Token JWT
- `tokenValidUntil` - Data scadenza token
- `userData` - Dati utente
- `selectedLanguage` - Lingua selezionata
- `customerportalmenu{level}` - Menu (cache)
- `quotations` - Preventivi (cache)

---

### 6.5 NavigatorService

**File**: [navigator.service.ts](src/app/services/navigator.service.ts)

**Responsabilità**: Gestione della navigazione programmatica.

#### Metodi
- `navigateTo(route, params?)` - Naviga a una rotta
- `back()` - Torna indietro nella storia
- `getLanguage()` - Ottiene lingua del browser

---

### 6.6 ToasterService

**File**: [toaster.service.ts](src/app/services/toaster.service.ts)

**Responsabilità**: Gestione notifiche toast (basato su ngx-toastr).

#### Metodi
- `success(message, title?)` - Notifica successo
- `error(message, title?)` - Notifica errore
- `warning(message, title?)` - Notifica warning
- `info(message, title?)` - Notifica informativa

**Configurazione**:
```typescript
{
  timeOut: 3000,
  positionClass: 'toast-top-right',
  preventDuplicates: true
}
```

---

### 6.7 OneZoneService

**File**: [onezone.service.ts](src/app/services/onezone.service.ts)

**Responsabilità**: Integrazione con API WordPress OneZone.

#### Metodi
- `banner()` - Recupera banner da WordPress (endpoint: `https://onezone.ch/wp-json/wp/v2/banner`)

---

### 6.8 LoaderService

**File**: [loader.service.ts](src/app/services/loader.service.ts)

**Responsabilità**: Gestione dello stato di caricamento globale.

#### Utilizzo
Gestisce la visualizzazione di spinner/loader durante operazioni asincrone.

---

## 7. Autenticazione e Autorizzazione

### Flusso di Autenticazione Completo

```
┌──────────────┐
│  LoginPage   │
└──────┬───────┘
       │ 1. Submit (email, password)
       ▼
┌────────────────────┐
│ BrokerstarService  │
│   .login()         │
└──────┬─────────────┘
       │ 2. POST /api/v3/login
       │    Riceve: { token: "...", ... }
       ▼
┌────────────────┐
│  AuthService   │
│ .startSession()│
└──────┬─────────┘
       │ 3. Salva token
       │ 4. Token valido 24h
       ▼
┌────────────────────┐
│ BrokerstarService  │
│    .userMe()       │
└──────┬─────────────┘
       │ 5. GET /api/v3/user/me
       │    Headers: Authorization: Bearer {token}
       │    Riceve userData
       ▼
┌────────────────┐
│ StorageService │
│  localStorage  │
└──────┬─────────┘
       │ 6. Salva:
       │    - token
       │    - tokenValidUntil
       │    - userData
       ▼
┌──────────────────┐
│ NavigatorService │
│   /home          │
└──────────────────┘
```

### Validazione Token

Il token viene validato in due modi:

1. **Presenza e Scadenza**: `authService.isLogged()`
   ```typescript
   isLogged(): boolean {
     return (
       this.isAuth &&
       this.userData.contact &&
       this.token &&
       this.tokenValidUntil > new Date()
     );
   }
   ```

2. **Guard di Rotta**: Ogni richiesta protetta verifica il token

### Logout

```
1. Componente chiama authService.logout()
   ↓
2. Chiama brokerstarService.logout()
   ↓
3. authService.endSession()
   ↓
4. Rimuove da StorageService:
   - token
   - tokenValidUntil
   - userData
   ↓
5. Redirect a /login
```

---

## 8. Componenti e Pagine

### 8.1 Layouts

#### LayoutAuthedComponent
**Path**: [layouts/authed/](src/app/layouts/authed/)
- Layout per utenti autenticati
- Include: header, navigation, sidebar, footer
- Outlet per componenti child

#### LayoutUnauthedComponent
**Path**: [layouts/unauthed/](src/app/layouts/unauthed/)
- Layout minimal per pagine pubbliche
- Solo logo e contenuto centrale
- Usato per: login, register, recover

#### LayoutPDFComponent
**Path**: [layouts/pdf/](src/app/layouts/pdf/)
- Layout per visualizzazione documenti PDF
- Schermo intero senza distrazioni

---

### 8.2 Pagine Principali

#### LoginComponent
**Path**: [pages/login/](src/app/pages/login/)
**Rotta**: `/login`

**Funzionalità**:
- Form di login (email, password)
- Validazione input
- Chiamata `brokerstarService.login()`
- Gestione errori (credenziali errate, 2FA non supportato)
- Link a registrazione e recupero password

---

#### RegisterComponent
**Path**: [pages/register/](src/app/pages/register/)
**Rotta**: `/register`, `/register/:consultantCode` o `/link/:contactid`

**Funzionalità**:
- Registrazione come cliente (persona fisica) o azienda
- Form dinamico basato sul tipo
- Campi: nome, cognome, email, data nascita, telefono, password
- Collegamento a un contatto esistente (via parametro `:contactid`)
- Chiamata `brokerstarService.registerUser()`

**Assegnazione Consulente tramite URL**:
- La rotta `/register/:consultantCode` permette di assegnare automaticamente un consulente al nuovo utente
- Esempio URL: `https://webapp.onezone.ch/register/0852221850d5638e4c80b9da870f942b`
- Il parametro `consultantCode` viene letto da `ActivatedRoute.params` e inviato nel payload della registrazione come campo `invitationCode`
- L'API `POST /api/v3/user/register` accetta il campo `invitationCode` e assegna automaticamente l'intermediario corrispondente
- Il link "Registrati" nella pagina di login punta direttamente a `/register/0852221850d5638e4c80b9da870f942b`

**Gestione Errori API**:
- Se l'API restituisce un errore con campo `violations`, i singoli campi vengono evidenziati con il relativo messaggio
- Se l'API restituisce un errore generico (es. `{error: "This value is too short..."}`) il messaggio viene mostrato all'utente tramite `toasterService.alert()`
- Il loader viene sempre nascosto correttamente in caso di errore

**Campi Azienda**:
- Nome ditta
- Data fondazione
- Email aziendale

---

#### HomeComponent
**Path**: [pages/home/](src/app/pages/home/)
**Rotta**: `/home`

**Funzionalità**:
- Dashboard principale
- Widget: polizze attive, messaggi, offerte
- Benvenuto personalizzato
- Link rapidi alle funzioni principali

---

#### PoliciesComponent
**Path**: [pages/policies/](src/app/pages/policies/)
**Rotta**: `/policies` o `/policies/:clientid`

**Funzionalità**:
- Lista tutte le polizze dell'utente
- Filtro per cliente (opzionale)
- Ricerca e ordinamento
- Card per ogni polizza con:
  - Nome polizza
  - Compagnia assicurativa
  - Data scadenza
  - Premio
- Click per dettagli → `/policy/:policyid`

---

#### PolicyComponent
**Path**: [pages/policy/](src/app/pages/policy/)
**Rotta**: `/policy/:policyid`

**Funzionalità**:
- Dettagli completi polizza
- Informazioni contratto
- Documenti allegati
- Fatture premi
- Azioni:
  - Segnala sinistro
  - Scarica documenti
  - Modifica polizza

---

#### PolicyAddComponent
**Path**: [pages/policyadd/](src/app/pages/policyadd/)
**Rotta**: `/policyadd`

**Funzionalità**:
- Form per aggiungere nuova polizza
- Selezione compagnia assicurativa
- Caricamento documenti

---

#### PolicySelectComponent
**Path**: [pages/policyselect/](src/app/pages/policyselect/)
**Rotta**: `/policy-select`

**Funzionalità**:
- Selezione polizza per operazioni specifiche

---

#### PolicyCalculateComponent
**Path**: [pages/policycalculate/](src/app/pages/policycalculate/)
**Rotta**: `/compare`

**Funzionalità**:
- Confronto polizze
- Calcolo premi
- Comparazione offerte

---

#### CustomersComponent
**Path**: [pages/customers/](src/app/pages/customers/)
**Rotta**: `/customers`

**Funzionalità**:
- Lista clienti (per consulenti)
- Ricerca e filtri
- Aggiunta nuovi clienti
- Link a polizze cliente

---

#### ConsultantComponent
**Path**: [pages/consultant/](src/app/pages/consultant/)
**Rotta**: `/consultant` o `/consultant/:policyid`

**Funzionalità**:
- Interfaccia consulente
- Chat con consulente
- Messaggi e comunicazioni
- Allegati e documenti

---

#### OffersComponent
**Path**: [pages/offers/](src/app/pages/offers/)
**Rotta**: `/offer` o `/offer/:offerid`

**Funzionalità**:
- Visualizzazione offerte (tender)
- Dettagli offerta
- Confronto offerte
- Azioni:
  - Accetta offerta (`tenderOfferAccept`)
  - Rifiuta offerta (`tenderOfferReject`)

---

#### ReportComponent
**Path**: [pages/report/](src/app/pages/report/)
**Rotta**: `/report/:policyid`

**Funzionalità**:
- Generazione report per polizza
- Esportazione PDF
- Chiamata `createJasperreport()`

---

#### AgreementComponent
**Path**: [pages/agreement/](src/app/pages/agreement/)
**Rotta**: `/agreement`

**Funzionalità**:
- Gestione mandati
- Notifica assicurazioni
- Firma elettronica documenti

---

#### FileComponent
**Path**: [pages/file/](src/app/pages/file/)
**Rotta**: `/file/:fileid` o `/jasper/:reportName/:contactId`

**Funzionalità**:
- Visualizzazione file/documenti
- Rendering PDF in-app
- Download file

---

#### ProfileComponent
**Path**: [pages/profile/](src/app/pages/profile/)
**Rotta**: `/profile`

**Funzionalità**:
- Visualizzazione dati profilo
- Modifica informazioni personali
- Cambio password
- Upload avatar
- Gestione preferenze

---

#### MenuComponent
**Path**: [pages/menu/](src/app/pages/menu/)
**Rotta**: `/menu`

**Funzionalità**:
- Menu di navigazione
- Link a tutte le sezioni
- Logout

---

#### LanguageComponent
**Path**: [pages/language/](src/app/pages/language/)
**Rotta**: `/language` o `/language_unauthed`

**Funzionalità**:
- Selezione lingua interfaccia
- 4 lingue disponibili: DE, EN, FR, IT
- Salva preferenza in localStorage
- Ricarica traduzioni

---

#### RecoverComponent
**Path**: [pages/recover/](src/app/pages/recover/)
**Rotta**: `/recover`

**Funzionalità**:
- Form recupero password
- Invio email reset
- Chiamate:
  - `resetPassword()` - Richiesta reset
  - `confirmResetPassword()` - Conferma con token

---

## 9. Internazionalizzazione (i18n)

### Architettura i18n

```
┌──────────────────┐
│  I18nService     │
├──────────────────┤
│ - currentLanguage│
│ - oLanguage      │
└────────┬─────────┘
         │
    ┌────▼─────────────┐
    │ I18nFileService  │
    └────┬─────────────┘
         │
    ┌────▼─────────────────────┐
    │  assets/i18n/*.json      │
    │  - de.json               │
    │  - en.json               │
    │  - fr.json               │
    │  - it.json               │
    └──────────────────────────┘
```

### File di Traduzione

**Formato**: JSON strutturato gerarchicamente

**Esempio** ([it.json](src/assets/i18n/it.json)):
```json
{
  "menu": {
    "support": "Supporto",
    "onezone": "OneZone",
    "lang": "Lingue",
    "home": "Home"
  },
  "login": {
    "email": "Email",
    "password": "Password",
    "button": "Login"
  }
}
```

### Pipe Personalizzata: I18nPipe

**File**: [pipes/i18n.pipe.ts](src/app/pipes/i18n.pipe.ts)

**Utilizzo nei Template**:
```html
<h1>{{ 'menu.home' | i18n }}</h1>
<button>{{ 'login.button' | i18n }}</button>
```

**Implementazione**:
```typescript
transform(value: string): string {
  const keys = value.split('.');
  return this.i18nService.getTranslation(...keys);
}
```

### Cambio Lingua Runtime

```typescript
// 1. Utente seleziona lingua
// 2. Salva in StorageService
this.storageService.setItem('selectedLanguage', 'it');

// 3. Carica file traduzioni
const langFile = this.i18nFileService.getLanguageFile('it');
this.i18nService.loadLanguage(langFile);

// 4. Aggiorna currentLanguage
this.i18nService.currentLanguage = 'it';

// 5. Ricarica componente (o usa ChangeDetectorRef)
```

---

## 10. Integrazione API

### Endpoint Base

**Produzione**: `https://onezone.brokerstar.biz/api/v3`

Configurato in [environment.ts](src/environments/environment.ts):
```typescript
export const environment = {
  production: false,
  apiEndpoint: "https://onezone.brokerstar.biz/api/v3"
};
```

### Autenticazione API

**Tipo**: Bearer Token (JWT)

**Header**:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Durata Token**: 24 ore

**Refresh**: Non implementato (richiede re-login)

### Gestione Errori HTTP

Ogni chiamata API gestisce gli errori con `catchError`:

```typescript
.pipe(
  map((data: any): any => data),
  catchError((error: HttpErrorResponse): any => {
    console.log(error);
    return of([]); // Fallback a array/oggetto vuoto
  })
)
```

### Operatori RxJS Utilizzati

| Operatore | Utilizzo |
|-----------|----------|
| `map` | Trasformazione dati |
| `catchError` | Gestione errori |
| `distinctUntilChanged` | Evita duplicati consecutivi |
| `switchMap` | Flatten observable annidati |
| `forkJoin` | Parallellizzazione richieste |
| `firstValueFrom` | Conversione Observable → Promise |

---

## 11. Gestione dello Stato

### Approccio

L'applicazione utilizza un approccio **Service-Based State Management** senza librerie esterne (no Redux/NgRx).

### Stato Globale

Gestito tramite servizi singleton:

| Servizio | Stato Gestito |
|----------|---------------|
| **AuthService** | Autenticazione, dati utente, token |
| **I18nService** | Lingua corrente, traduzioni |
| **LoaderService** | Stato caricamento globale |
| **StorageService** | Persistenza localStorage |

### Stato Locale

Gestito nei componenti tramite:
- Proprietà del componente
- Observable e Subject di RxJS
- Angular Signals (se usati in Angular 20+)

### Persistenza

**localStorage** tramite StorageService:
- Token autenticazione
- Dati utente
- Preferenze lingua
- Cache (menu, quotations)

**Strategia Cache**:
- Cache-first per dati statici (menu)
- Network-first per dati dinamici (polizze, messaggi)

---

## 12. Build e Deployment

### Build di Sviluppo

```bash
npm start
# oppure
ng serve
```

**Caratteristiche**:
- SourceMaps abilitati
- Nessuna ottimizzazione
- Hot Module Replacement
- Porta: `http://localhost:4200`

### Build di Produzione

```bash
npm run build
# equivale a:
ng build --configuration=production
```

**Output**: `dist/onezoneweb/`

**Ottimizzazioni**:
- Minificazione JS/CSS
- Tree-shaking
- AOT Compilation
- Output hashing (cache busting)
- Bundle optimization

**Budgets**:
```json
{
  "type": "initial",
  "maximumWarning": "500kB",
  "maximumError": "1MB"
}
```

### Configurazione Build

Definita in [angular.json](angular.json):

```json
{
  "build": {
    "builder": "@angular/build:application",
    "options": {
      "browser": "src/main.ts",
      "polyfills": ["zone.js"],
      "tsConfig": "tsconfig.app.json",
      "assets": [
        { "glob": "**/*", "input": "public" },
        { "glob": "**/*", "input": "src/assets", "output": "assets" }
      ],
      "styles": ["src/styles.scss"]
    }
  }
}
```

### Deployment

#### Requisiti
- Web server statico (Apache, Nginx, etc.)
- Supporto per Single Page Application (routing client-side)

#### Configurazione Server

**Nginx**:
```nginx
server {
    listen 80;
    server_name onezone.example.com;
    root /var/www/onezoneweb;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Apache**:
```apache
<VirtualHost *:80>
    ServerName onezone.example.com
    DocumentRoot /var/www/onezoneweb

    <Directory /var/www/onezoneweb>
        RewriteEngine On
        RewriteBase /
        RewriteRule ^index\.html$ - [L]
        RewriteCond %{REQUEST_FILENAME} !-f
        RewriteCond %{REQUEST_FILENAME} !-d
        RewriteRule . /index.html [L]
    </Directory>
</VirtualHost>
```

#### Processo di Deployment

1. **Build**:
   ```bash
   npm run build
   ```

2. **Upload**:
   ```bash
   scp -r dist/onezoneweb/* user@server:/var/www/onezoneweb/
   ```

3. **Verifica**:
   - Accedi all'URL
   - Testa routing
   - Verifica assets (immagini, fonts)
   - Controlla console browser per errori

---

## 13. Configurazioni

### 13.1 TypeScript

**File**: [tsconfig.json](tsconfig.json)

**Opzioni Chiave**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022", "dom"],
    "strict": true,
    "skipLibCheck": true
  }
}
```

### 13.2 Tailwind CSS

**File**: [tailwind.config.js](tailwind.config.js)

**Configurazione**:
```javascript
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### 13.3 PostCSS

**File**: [postcss.config.js](postcss.config.js)

**Plugins**:
```javascript
module.exports = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

### 13.4 Prettier

**Configurazione** in [package.json](package.json):
```json
{
  "prettier": {
    "overrides": [
      {
        "files": "*.html",
        "options": {
          "parser": "angular"
        }
      }
    ]
  }
}
```

---

## Appendici

### A. Interfaces Principali

#### ContactInterface
Definisce la struttura di un contatto/utente.

#### PolicyInterface
Definisce la struttura di una polizza assicurativa.

#### QuoteInterface
Definisce la struttura di un preventivo/offerta.

#### PolicyByClientInterface
Relazione tra polizza e cliente.

### B. Helper Functions

**File**: [helper.ts](src/app/helper.ts)

Funzioni di utilità:
- `isset(value, allowEmpty?)` - Verifica esistenza valore
- `trim(str)` - Rimuove spazi
- `isString(value)` - Verifica se è stringa
- `convertStringToJSON(str, fallback)` - Parsing JSON sicuro
- `clone(obj)` - Deep clone oggetto

### C. Enums

**File**: [enums/http.ts](src/app/enums/http.ts)

HTTP status codes e costanti.

---

## Glossario

| Termine | Descrizione |
|---------|-------------|
| **BrokerStar** | Sistema backend per gestione assicurativa |
| **OneZone** | Portale clienti per gestione polizze |
| **Tender** | Gara/Offerta assicurativa |
| **Policy** | Polizza assicurativa |
| **Claim** | Sinistro |
| **Mandate** | Mandato/Delega |
| **Quotation** | Preventivo |
| **Jasper Report** | Sistema di reportistica PDF |
| **Contact** | Contatto/Cliente/Utente |
| **Premium Invoice** | Fattura premio assicurativo |

---

## Contatti e Supporto

Per supporto tecnico o domande:
- **Repository**: Consultare il README.md
- **API Documentation**: https://wmcch.atlassian.net/wiki/spaces/FAQ/

---

## Changelog

### v2.1.8 (Corrente)
- Aggiornamento a Angular 20
- Migrazione a Standalone Components
- Ottimizzazioni performance
- Aggiornamento dipendenze

---

**Documento generato il**: 2026-01-28
**Versione Applicazione**: 2.1.8
**Autore Documentazione**: Claude AI (Anthropic)
