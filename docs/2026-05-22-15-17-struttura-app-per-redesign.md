# OneZone Web — Struttura App e Inventario UI per Redesign

> Documento destinato a un designer/AI di design che deve progettare un **nuovo design da zero**.
> **Contiene solo informazioni strutturali e funzionali.** Nessun riferimento a colori, font, spaziature, ombre, bordi, animazioni, classi CSS o componenti visivi esistenti. Il designer è libero di reinventare l'intero linguaggio visivo.

---

## 1. Overview

**OneZone Web** è una Single Page Application (SPA) che funge da **portale clienti per la gestione di polizze assicurative**. È usata da due tipologie di utenti:

- **Cliente finale**: visualizza le proprie polizze, riceve offerte, comunica con il consulente, denuncia sinistri, gestisce dati personali.
- **Consulente assicurativo**: gestisce un portafoglio di clienti, invia mandati, genera preventivi auto in modo automatizzato, accede a strumenti amministrativi.

L'app è multilingua (DE, EN, FR, IT) con cambio runtime. Tutte le pagine si adattano allo stesso device target (mobile-first, ma usata anche su desktop).

---

## 2. Architettura di navigazione

### 2.1 Layout

L'app utilizza **tre contenitori (layout)** che avvolgono le pagine:

| Layout | Quando | Elementi chrome |
|--------|--------|-----------------|
| **Unauthed** | Utente non loggato (login, registrazione, recupero) | Area centrale contenuto; footer con accesso a supporto, link OneZone, selettore lingua |
| **Authed** | Utente loggato (tutte le sezioni applicative) | Header con accesso a profilo, logo, menu; footer con accesso a supporto, FAQ, home; overlay loader globale |
| **PDF** | Visualizzazione documenti a tutto schermo | Header minimale con bottone "back"; area documento full-screen |

### 2.2 Guard di accesso

- Le rotte autenticate richiedono token valido; in assenza si è reindirizzati al login.
- Le rotte non-autenticate (login, register, recover) reindirizzano alla home se l'utente è già loggato.
- Alcune funzioni sono visibili **solo ai consulenti**, altre **solo a uno specifico account amministratore** (gestione consulenti).

### 2.3 Mappa rotte → pagine

| Rotta | Pagina | Layout |
|-------|--------|--------|
| `/login` | Login | Unauthed |
| `/register`, `/register/:code`, `/link/:contactid` | Register | Unauthed / Authed |
| `/recover` | Recover | Unauthed |
| `/language`, `/language_unauthed` | Language | Authed/Unauthed |
| `/home` | Home (dashboard) | Authed |
| `/menu` | Menu | Authed |
| `/profile` | Profile | Authed |
| `/policies`, `/policies/:clientid` | Policies | Authed |
| `/policy/:policyid` | Policy (dettaglio) | Authed |
| `/policyadd` | PolicyAdd | Authed |
| `/policy-select` | PolicySelect | Authed |
| `/compare` | PolicyCalculate | Authed |
| `/report/:policyid` | Report (sinistro) | Authed |
| `/customers` | Customers (lista) | Authed |
| `/customers-mandate` | CustomersMandate | Authed |
| `/customers-mandate-add` | CustomersMandateAdd | Authed |
| `/customers-mandate-policies/:id` | CustomersMandatePolicies | Authed |
| `/offer`, `/offer/:offerid` | Offers | Authed |
| `/consultant`, `/consultant/:policyid` | Consultant | Authed |
| `/agreement` | Agreement | Authed |
| `/form-mandate-wefox` | FormMandateWefox | Authed |
| `/automation-setup` | AutomationSetup | Authed |
| `/automation-form` | AutomationForm | Authed |
| `/consultant-automation` | ConsultantAutomation | Authed |
| `/file/:fileid`, `/jasper/:reportName/:contactId` | File | PDF |

---

## 3. Flussi utente principali

1. **Onboarding cliente**: Login → (eventuale 2FA) → Home. Se nuovo utente: Register (eventualmente con codice consulente in URL) → Home.
2. **Recupero password**: Login → Recover (email) → email con codice → Recover (codice + nuova password) → Login.
3. **Consultazione polizze**: Home → Policies → Policy (dettaglio) → (opzionale) Report (sinistro) o Consultant (chat).
4. **Aggiunta polizza**: Policies → PolicyAdd → selezione assicuratore → Policies.
5. **Offerte**: Home → Offers → tab Pending/Accepted/Declined → accetta/rifiuta/download/contatta consulente.
6. **Sinistro**: Home → Policies → Policy → Report (data + descrizione + foto) → conferma.
7. **Mandato (consulente)**: Home → CustomersMandate → CustomersMandateAdd (nuovo cliente) o CustomersMandatePolicies/:id (upload mandato e selezione compagnie) → conferma.
8. **Agreement / firma**: Agreement → checkbox e selezione → firma su canvas → submit.
9. **Generazione preventivi auto (consulente)**: Home → (primo accesso) AutomationSetup (3 step: credenziali EcoHub → QR/TOTP → Google Authenticator) → AutomationForm (form completo con modal ricerca veicolo) → invio.
10. **Gestione consulenti (admin)**: Menu → ConsultantAutomation → modale gestione attivazione e scraper.
11. **Profilo**: Menu → Profile → tab/sezioni collassabili per dati personali, indirizzo, accesso, documenti.

---

## 4. Dettaglio pagine

> Per ogni pagina: **scopo**, **elementi UI funzionali**, **azioni**, **uscite di navigazione**.

### 4.1 Auth & onboarding

#### Login (`/login`)
- **Scopo**: autenticare l'utente.
- **Elementi**: identificativo app/logo; input email; input password con toggle mostra/nascondi; bottone "Accedi"; link "Password dimenticata"; link "Registrati"; area messaggio errore (chiudibile cliccando).
- **Azioni**: invio credenziali (Enter su password sottomette); toggle visibilità password; navigazione a register/recover.
- **Stati**: idle, loading, errore credenziali, eventuale step 2FA (campo codice).
- **Uscite**: `/home` (successo), `/register/:code`, `/recover`.

#### Register (`/register`, `/register/:consultantCode`, `/link/:contactid`)
- **Scopo**: registrare un nuovo utente (persona fisica o azienda); in modalità `/link/:contactid` aggiunge un contatto al profilo esistente.
- **Elementi**: selettore tipologia "Persona / Azienda"; **form persona** (nome, cognome, indirizzo, CAP, città, data nascita, relazione opzionale); **form azienda** (ragione sociale, indirizzo, CAP, città, data fondazione); campi comuni (email, telefono opzionale, password con toggle visibilità); bottone submit; messaggi di errore inline per campo (validazione).
- **Azioni**: toggle tipologia; submit; toggle visibilità password.
- **Stati**: idle, loading, errori per campo (violations), errore generico (toast).
- **Uscite**: `/home` o `/customers-mandate-add` se entrato da link; `/login`.

#### Recover (`/recover`)
- **Scopo**: reset password in due step (richiesta via email, conferma con codice).
- **Elementi**: input email; separatore "OPPURE"; input nuova password con toggle; input codice di verifica; bottone submit.
- **Uscite**: `/login`.

#### Language (`/language`, `/language_unauthed`)
- **Scopo**: selezionare la lingua dell'interfaccia.
- **Elementi**: trigger dropdown; lista lingue selezionabili (DE, EN, FR, IT); indicatore lingua attiva.
- **Azioni**: scelta lingua → applicata immediatamente.
- **Uscite**: pagina precedente.

### 4.2 Dashboard, menu, profilo

#### Home (`/home`)
- **Scopo**: dashboard d'ingresso con accessi rapidi alle aree dell'app.
- **Elementi**:
  - Carousel/slider di card promozionali (titolo, testo, bottone CTA, indicatori di posizione).
  - Saluto personalizzato con nome utente.
  - Bottoni rapidi visibili solo ai consulenti: "Invia mandato", "Genera preventivi".
  - Messaggio di stato verifica dati con spinner (durante il check).
  - Menu principale come **lista di voci dinamiche** (icona + etichetta) navigabili.
  - Eventuale sezione citazione/testo motivazionale.
- **Uscite**: `/customers-mandate`, `/automation-form`, `/policies`, `/offer`, `/menu`, ecc.

#### Menu (`/menu`)
- **Scopo**: indice di tutte le sezioni dell'app.
- **Elementi**: lista voci di menu (icona + etichetta); voce "Gestione consulenti" visibile solo all'admin; voce logout (distintamente identificata come azione critica); link esterno al sito istituzionale.
- **Uscite**: tutte le rotte applicative; `/login` dopo logout.

#### Profile (`/profile`)
- **Scopo**: gestione dati profilo e contatti collegati.
- **Elementi**:
  - Intestazione con dati utente principale.
  - **Carousel orizzontale di contatti** (avatar + nome) con possibilità di selezionarli come "attivo".
  - Bottone "Aggiungi profilo" (+).
  - Indicazione contatto attivo (nome, data).
  - **Sezioni collassabili**: "Dati personali" (vista + modifica), "Indirizzo" (vista + form modifica + salva), "Accesso" (email, telefono, password — vista + form modifica + salva), "Documenti" (griglia file con upload e apertura).
- **Azioni**: cambia contatto attivo; espandi/comprimi sezione; entra in modalità edit; salva; upload file; apri documento.
- **Uscite**: `/register/:contactid` per aggiungere un contatto; `/file/:fileid` per documenti.

#### Language authed: vedi 4.1.

### 4.3 Polizze

#### Policies (`/policies`, `/policies/:clientid`)
- **Scopo**: elenco delle polizze (proprie o di un cliente specifico).
- **Elementi**: intestazione con eventuale nome cliente; bottone "Aggiungi polizza" (visibile solo nella vista personale); **griglia di card polizza** (logo assicurazione + targa/titolo), cliccabili; stato vuoto con messaggio "Nessuna polizza".
- **Uscite**: `/policy/:id`, `/policyadd`.

#### Policy (`/policy/:policyid`)
- **Scopo**: dettaglio polizza.
- **Elementi**: intestazione; card riassuntiva con logo assicurazione; lista dettagli (numero polizza, data scadenza, info fatturazione con importo + data); bottone "Copia polizza" (condizionale); bottone "Crea sinistro"; bottone "Contatta consulente".
- **Uscite**: `/consultant/:policyid`, `/report/:policyid`, download PDF.

#### PolicyAdd (`/policyadd`)
- **Scopo**: aggiungere polizze selezionando uno o più assicuratori.
- **Elementi**: intestazione; testo descrittivo; **lista assicuratori selezionabili** (checkbox + nome + logo) con scroll; indicatore di selezione su elementi attivi; bottone submit.
- **Uscite**: `/policies`.

#### PolicySelect (`/policy-select`)
- **Scopo**: scegliere una polizza prima di una operazione (es. sinistro).
- **Elementi**: intestazione; griglia card polizza (analoga a Policies).
- **Uscite**: `/report/:policyid`.

#### PolicyCalculate (`/compare`)
- **Scopo**: confronto/calcolo di premi e offerte.
- **Elementi**: form di parametri di confronto; risultati tabellari o a card; eventuale bottone richiedi offerta.
- **Uscite**: `/offer`.

#### Report (`/report/:policyid`)
- **Scopo**: creare denuncia di sinistro.
- **Elementi**: intestazione; card polizza centrata con info polizza e dati consulente (nome, telefono, email); input data sinistro; area testo descrizione; **galleria foto orizzontale scrollabile** con bottone aggiungi (+) e rimuovi (×) per immagine; bottone submit.
- **Uscite**: `/policies`.

### 4.4 Clienti (consulente)

#### Customers (`/customers`)
- **Scopo**: elenco clienti del consulente.
- **Elementi**: intestazione; bottone "Aggiungi cliente" (+); input ricerca con icona; **lista card cliente** (nome in evidenza, conteggio persone/polizze opzionale, indirizzo, bottoni rapidi telefono ed email, badge "Mandato" se presente); stato vuoto; **caricamento a scaglioni con scroll infinito**.
- **Azioni**: aggiungi, ricerca, apri cliente, chiama, manda email.
- **Uscite**: `/customers-mandate-add`, `/customers-mandate-policies/:id`.

#### CustomersMandate (`/customers-mandate`)
- **Scopo**: variante di Customers usata nel flusso mandato; stesse caratteristiche UI.
- **Note**: dati con **cache stale-while-revalidate** (mostrati subito da cache locale e aggiornati in background).

#### CustomersMandateAdd (`/customers-mandate-add`)
- **Scopo**: creare un nuovo cliente persona o azienda.
- **Elementi**: intestazione; selettore Persona/Azienda; form persona (nome, cognome, indirizzo, CAP, città, data nascita); form azienda (ragione sociale, indirizzo, CAP, città, data fondazione); email; telefono; bottone submit.
- **Uscite**: `/customers-mandate`.

#### CustomersMandatePolicies (`/customers-mandate-policies/:id`)
- **Scopo**: gestire polizze del cliente e caricare il mandato.
- **Elementi**:
  - **Sezione upload mandato** (visibile finché non esiste un mandato): area drag-and-drop PDF + input file; lista assicuratori da selezionare (checkbox multi); bottone "Invia".
  - **Griglia di polizze** del cliente; stato vuoto se nessuna polizza.
- **Uscite**: `/policy/:id`.

### 4.5 Offerte e consulenza

#### Offers (`/offer`, `/offer/:offerid`)
- **Scopo**: gestire preventivi/offerte in tre stati.
- **Elementi**: intestazione; **tab navigation** (Sospese / Accettate / Rifiutate) con icone e conteggio; **lista di "tender" collassabili** (intestazione + numero offerte); per ogni offerta dentro un tender: assicurazione + importo, bottoni "Contatta consulente", "Accetta" (solo pending), "Rifiuta" (solo pending), "Scarica" (se allegato).
- **Uscite**: `/consultant/:contactid`, download PDF.

#### Consultant (`/consultant`, `/consultant/:policyid`)
- **Scopo**: scheda contatto del consulente.
- **Elementi**: intestazione; card con foto e nome; riga email cliccabile; riga telefono cliccabile; riga mobile cliccabile.
- **Azioni**: apre mail/dialer del device.

#### Agreement (`/agreement`)
- **Scopo**: sottoscrizione accordo e firma elettronica.
- **Elementi**: intestazione; testo introduttivo; **lista di voci di check** con icone; checkbox "Mantieni il consulente attuale"; selezione assicuratori (condizionale); link "Scarica documento"; **area canvas per firma** (touch/mouse); bottone "Cancella firma"; testo termini & condizioni (link); bottone submit.
- **Uscite**: `/policies`.

### 4.6 Mandato Wefox

#### FormMandateWefox (`/form-mandate-wefox`)
- **Scopo**: form di mandato Wefox (replica del flusso esterno).
- **Elementi**: form a sezioni: titolo persona (selezione), ragione sociale (condizionale), nome, cognome, indirizzo (via, numero, CAP, città), data, contatti (email, telefono); validazione inline per campo; bottone submit; messaggio di successo post-invio.
- **Uscite**: rimane sulla pagina con conferma; eventuale ritorno alla home.

### 4.7 Automazione preventivi (consulente)

#### AutomationSetup (`/automation-setup`)
- **Scopo**: configurazione iniziale credenziali EcoHub in **3 step**.
- **Elementi**:
  - Barra di progresso a 3 segmenti + etichetta step corrente.
  - **Step 1 (Credenziali)**: input username, input password con toggle visibilità, input commissione.
  - **Step 2 (QR / TOTP)**: lista istruzioni numerata; area "incolla QR code" o seleziona file immagine (drag-drop / click); preview QR; indicatore stato TOTP (success/error).
  - **Step 3 (Google Authenticator)**: lista istruzioni numerata; box di avviso.
  - Bottoni "Indietro", "Avanti" (disabilitato se step incompleto), "Invio" (solo step 3).
  - Messaggio di attesa con spinner durante la verifica login finale (checkLogin post-setup).
- **Uscite**: `/automation-form` a fine setup.

#### AutomationForm (`/automation-form`)
- **Scopo**: compilazione del form completo preventivo assicurativo auto.
- **Elementi** (raggruppati per sezione, scrollabile a singola pagina):
  1. **Dati personali**: radio sesso; nome azienda (condizionale); nome; cognome; data nascita (date picker); CAP con autocomplete dropdown; area/località con autocomplete dropdown; via; civico; email; telefono; nazionalità (dropdown); ID stranieri (dropdown condizionale); lingua (dropdown).
  2. **Veicolo 1**: dropdown franchigia under 26; bottone "Cerca veicolo" (apre modale); campi readonly marca, modello, n. omologazione, n. matricola; input accessori (CHF); dropdown cantone; input targa; data prima immatricolazione; radio leasing; radio garage; dropdown targa intercambiabile.
  3. **Veicolo 2** (sezione condizionale, stessi campi del veicolo 1).
  4. **Utilizzo veicoli**: dropdown uso, RC, casco completa, franchigie totale/parziale (condizionali), parking, fanali, effetti personali, danni pneumatici, protezione bonus, soccorso stradale, scelta libera officina, infortunio passeggero; **gruppo checkbox veicolo elettrico** (4 opzioni: colonnina, batteria, cyber, schede/app).
  5. **Sinistri**: dropdown assicurazione attuale e sinistri (RC, collisione, parking, vetri, casco parziale).
  6. Bottone submit; messaggio di successo post-invio (stato finale).
  - **Modale "Cerca veicolo"** (overlay):
    - Intestazione con numero veicolo + bottone chiudi (×).
    - Input matricola; input n. omologazione; input marca con autocomplete; input modello.
    - Bottone "Cerca".
    - **Tabella risultati** (sticky header) con colonne Marca, Modello, Tipo omologazione, Carburante, Potenza, Data omologazione; righe cliccabili.
    - Paginazione (prev/next + numeri).
- **Stati**: idle, loading autocomplete, loading ricerca veicolo, success post-submit.
- **Uscite**: `/home`.

#### ConsultantAutomation (`/consultant-automation`)
- **Scopo**: pannello admin per gestire i consulenti (visibile solo a contact.id 58 / 25755).
- **Elementi**: intestazione; input ricerca; **lista card consulente** con nome, username, commissione, indicatore stato login (acceso/spento), badge "Disabilitato" se inattivo; stato vuoto.
  - **Modale** per consulente selezionato: intestazione con nome; toggle "Attivo"; **lista scraper** con toggle per ciascuno; bottone chiudi.
- **Uscite**: `/menu`.

### 4.8 Visualizzazione documenti

#### File (`/file/:fileid`, `/jasper/:reportName/:contactId`)
- **Scopo**: visualizzare un documento (PDF, immagine, generato Jasper).
- **Elementi**: area visualizzazione (spinner durante caricamento, viewer PDF, viewer immagine, messaggio "formato non supportato"); barra informativa inferiore con icona tipo file, nome file, MIME type, dimensione.
- **Layout**: PDF (full-screen).
- **Uscite**: indietro (browser/header).

---

## 5. Elementi UI ricorrenti (inventario)

Il designer deve prevedere un linguaggio coerente per:

- **Intestazione di pagina** con titolo e possibile bottone "indietro".
- **Bottoni di azione**: primario, secondario, distruttivo (es. logout, cancella firma, rimuovi foto), neutro.
- **Form**: input testuali, input password con toggle visibilità, input numerici, input data, dropdown, autocomplete, radio, checkbox, toggle switch, textarea, area canvas (firma), drag-and-drop file.
- **Validazione**: messaggi di errore inline per campo; messaggio di errore globale chiudibile.
- **Liste**: card cliccabili (clienti, polizze, consulenti), tabelle con header sticky e paginazione, sezioni collassabili (chevron), liste con scroll infinito.
- **Modali / overlay**: ricerca veicolo, dettaglio consulente, conferme.
- **Toast / notifiche**: success, error, info, alert.
- **Loader**: globale (overlay), per sezione (inline), spinner contestuale (es. durante autocomplete o verifica TOTP).
- **Stati vuoti**: messaggio + eventuale icona + eventuale CTA (es. "Nessuna polizza" → "Aggiungi polizza").
- **Badge / tag**: stato cliente con mandato, consulente disabilitato.
- **Indicatori di stato**: punto acceso/spento, barra di avanzamento step.
- **Tab navigation**: usata per gli stati delle offerte.
- **Selettori segmentati**: persona/azienda nei form di registrazione.
- **Carousel**: orizzontale (slide promozionali in home, contatti nel profilo).
- **Galleria immagini orizzontale scrollabile**: foto sinistro in Report.
- **Drag-and-drop file**: PDF mandato, immagine QR code.

---

## 6. Internazionalizzazione

- 4 lingue: tedesco (DE), inglese (EN), francese (FR), italiano (IT).
- Cambio lingua a runtime, persistente.
- Le label dell'app sono tutte da i18n key — il designer deve considerare **etichette di lunghezza variabile** (tedesco e francese tendono ad essere più lunghi).

---

## 7. Stati globali da considerare nel design

- **Autenticazione**: utente loggato vs non loggato (cambia il layout e l'accesso alle pagine).
- **Ruolo**: cliente finale vs consulente (alcune sezioni e azioni sono visibili solo ai consulenti); **admin** (un sottoinsieme di consulenti vede la gestione consulenti).
- **Stati di rete e dati**: loading, success, error, empty.
- **Stati di sincronizzazione cache**: alcune liste (es. CustomersMandate) sono mostrate immediatamente dalla cache e poi aggiornate in background — prevedere eventualmente un indicatore di "aggiornamento in corso".
- **Stati di flusso a più step**: AutomationSetup (3 step), wizard di onboarding, modali di ricerca.
- **Lunghezza contenuti variabile**: liste lunghe (clienti, polizze), liste vuote, form a molte sezioni (AutomationForm è la pagina più estesa).

---

## 8. Note per il redesign

- Mobile-first ma deve restare leggibile su desktop.
- Il punto di partenza naturale per la navigazione è la **Home** (dashboard) con il menu principale; il **Menu** è un'alternativa "tutte le sezioni".
- Il flusso più complesso è **AutomationForm** (form lunghissimo + modale di ricerca con tabella e paginazione): è il caso d'uso più stressante per il design system.
- I flussi mandato (Customers* + Agreement) coinvolgono caricamento file, selezioni multi-checkbox e firma — il design dovrà gestire bene questi pattern.
- Tutte le pagine devono comportarsi correttamente con label tradotte di lunghezza variabile.
