# OneZone Web — Specifica Funzionale dell'Applicazione

> Questo documento descrive **cosa fa l'applicazione** e **cosa fa ciascuna pagina** dal punto di vista dell'utente. Non contiene scelte implementative: framework, libreria UI, gestione dello stato, struttura del codice e naming sono lasciati interamente al team di sviluppo che si occuperà della riscrittura.

---

## 1. Panoramica dell'applicazione

OneZone Web è un portale digitale per la **gestione assicurativa** rivolto al mercato svizzero. L'applicazione mette in comunicazione due tipologie principali di utenti:

- **Clienti finali** (persone fisiche o aziende): consultano le proprie polizze, scaricano documenti, ricevono e gestiscono offerte assicurative, comunicano con il proprio consulente di fiducia, inviano mandati di gestione.
- **Consulenti assicurativi**: gestiscono un portafoglio di clienti, registrano nuovi clienti, generano preventivi automatici per polizze auto interrogando diverse compagnie assicurative in un'unica operazione, raccolgono e gestiscono mandati firmati, monitorano lo stato delle offerte prodotte.

Oltre a queste due categorie esiste un **ruolo amministrativo riservato**, assegnato a pochissimi account specifici, che ha accesso a un pannello di supervisione dell'intera rete consulenti.

### Valore offerto

- **Per il cliente:** un unico punto di accesso a tutte le polizze, i documenti, lo storico sinistri e le offerte personali, con la possibilità di rispondere alle proposte del consulente senza scambi di email o cartaceo.
- **Per il consulente:** automazione del processo di quotazione auto (raccolta dati una sola volta, interrogazione simultanea di più compagnie), gestione strutturata dei mandati, anagrafica clienti centralizzata.
- **Per la rete:** controllo amministrativo su quali consulenti sono attivi e quali compagnie ciascuno può interrogare.

### Lingue supportate

L'applicazione è disponibile in **tedesco, italiano, francese e inglese**. Il tedesco è la lingua di default. La lingua può essere cambiata in qualsiasi momento, sia prima del login sia da utente autenticato, e la preferenza viene ricordata fra una sessione e l'altra.

### Identità visiva

Il portale ha una propria identità di marca (logo OneZone, palette colori coordinata). La riscrittura può proporre una nuova interfaccia grafica: in questo documento descriviamo soltanto *cosa* deve essere mostrato e *come* deve comportarsi, non l'aspetto estetico.

---

## 2. Funzionalità trasversali

Queste capacità sono presenti in tutta l'applicazione e ogni pagina vi si appoggia. Vanno progettate come servizi/elementi condivisi indipendentemente dal framework scelto.

### 2.1 Autenticazione e sessione

- Accesso tramite **email + password**.
- La sessione resta valida per **24 ore**, dopodiché è richiesto un nuovo accesso.
- È possibile uscire dall'applicazione in qualsiasi momento (logout esplicito).
- L'app distingue chiaramente fra **area pubblica** (login, registrazione, recupero password, selezione lingua) e **area autenticata** (tutto il resto): un utente non loggato non può accedere all'area autenticata, un utente loggato che apre una pagina pubblica viene rimandato alla home.
- È previsto un percorso di **recupero password** via email e un percorso di **registrazione** che distingue tra persona fisica e azienda.
- Esiste un meccanismo di **invito da consulente**: il consulente può generare un link che, aperto da un nuovo cliente, pre-associa il cliente al consulente fin dalla registrazione.

### 2.2 Ruoli e permessi

- **Cliente finale**: vede le proprie polizze, le proprie offerte, può inviare un mandato al consulente.
- **Consulente**: vede in più l'anagrafica dei propri clienti, l'area mandati, l'area di generazione preventivi automatici.
- **Account amministrativo**: solo pochi account specifici hanno questo privilegio; vedono in più un pannello di gestione consulenti.
- Alcuni consulenti possono essere **partner Wefox**: per loro è disponibile un form dedicato per l'invio mandato Wefox.

### 2.3 Multilingua

- Tutti i testi dell'interfaccia sono traducibili.
- Il cambio lingua è disponibile in due punti: una pagina di selezione lingua **prima del login** e una pagina equivalente **dopo il login**.
- Il cambio è immediato (l'interfaccia si aggiorna nella nuova lingua) e la preferenza viene memorizzata.

### 2.4 Notifiche, caricamenti e feedback

- **Toast** non bloccanti per confermare un'azione riuscita, segnalare un errore, dare un avviso.
- **Overlay di caricamento** globale durante operazioni che richiedono attesa (es. login, invio form, generazione preventivi).
- **Validazione dei form** in tempo reale, con messaggi di errore inline accanto al campo problematico.
- **Modal di conferma** per azioni critiche o per comunicare blocchi (es. impossibile procedere perché alcune condizioni non sono soddisfatte).

### 2.5 Layout

L'app prevede tre layout differenziati:

1. **Layout area autenticata**: header con logo (riporta alla home), accesso al profilo utente, accesso al menu principale; barra di navigazione inferiore con scorciatoie verso supporto, FAQ e home; contenuto centrale dinamico.
2. **Layout area pubblica** (login, registrazione, ecc.): logo centrato, contenuto centrale, barra inferiore con supporto, sito istituzionale OneZone, scelta lingua.
3. **Layout documento a tutto schermo**: usato per la visualizzazione di PDF (contratti, report, allegati). Niente header né barre, soltanto il documento.

### 2.6 Integrazioni con servizi esterni (capacità funzionali)

Queste integrazioni sono parte del comportamento dell'app; le modalità tecniche di collegamento sono a discrezione del team di sviluppo.

- **Sistema di quotazione preventivi auto**: l'app invia i dati raccolti dal consulente a un servizio esterno (oggi "EcoHub") che interroga in parallelo più compagnie assicurative e restituisce offerte. Il consulente deve effettuare un proprio accesso a questo servizio una volta sola, durante il setup iniziale, fornendo anche un codice di autenticazione a due fattori.
- **Catalogo veicoli svizzero**: durante la compilazione del form preventivo auto, marca e modello vengono cercati in un catalogo ufficiale dei veicoli circolanti in Svizzera, che restituisce anche il codice di omologazione e altri dati tecnici pre-compilati automaticamente.
- **Mandati Wefox**: per i consulenti partner Wefox è disponibile un form dedicato che replica il modulo di invio mandato di quella compagnia.
- **Banner informativi**: nella home page può comparire un banner promozionale/informativo gestito da una redazione esterna (oggi il sito istituzionale OneZone).

### 2.7 Performance percepita

L'utente non deve attendere ad ogni apertura di pagina il ricaricamento di dati che cambiano raramente. Per alcune informazioni (dati del consulente, banner home, esito del controllo di accesso al servizio di quotazione) l'app deve mostrare subito quello che ha già visto in passato e aggiornare in background.

---

## 3. Flussi utente principali

### 3.1 Accesso e primo orientamento

L'utente apre l'applicazione e vede la pagina di login. Può scegliere la lingua, inserire le credenziali, oppure passare alla registrazione o al recupero password. Effettuato l'accesso, viene portato alla **home**, dove trova:

- un saluto personalizzato,
- uno slider con immagini e azioni promozionali,
- un menu di scorciatoie verso le aree principali (le voci variano a seconda che sia cliente o consulente),
- se è consulente, un bottone per avviare la generazione di preventivi auto e un bottone per inviare un mandato a nome di un cliente.

Da qui può raggiungere ogni altra area tramite il menu principale (accessibile sempre dall'icona del menu in alto) o tramite le scorciatoie della home.

### 3.2 Cliente: consultare polizze e documenti

Dal menu il cliente apre l'elenco delle proprie polizze, raggruppate visivamente per cliente assicurato (utile alle famiglie e alle aziende con più persone/veicoli). Selezionando una polizza accede al dettaglio: dati generali, beni assicurati, coperture, premi, documenti scaricabili, eventuale storico sinistri. Da qui può aprire i documenti in modalità visualizzazione PDF a tutto schermo e scaricarli.

### 3.3 Cliente: gestire le offerte ricevute

Dal menu il cliente apre la pagina offerte, suddivisa in tre schede: **pendenti, accettate, rifiutate**. Le offerte sono raggruppate per ramo assicurativo. Da ogni offerta può vedere il dettaglio, confrontare il premio, **accettare** o **rifiutare**. L'accettazione genera, lato sistema, l'avvio della pratica per la nuova polizza.

### 3.4 Consulente: generare preventivi auto

Dalla home il consulente avvia la generazione preventivi. La prima volta in assoluto deve compiere un **setup iniziale**: inserisce le proprie credenziali del servizio di quotazione esterno, fornisce il codice di autenticazione a due fattori, e attende la verifica (che può richiedere fino a un minuto e mezzo, con messaggio di attesa esplicito).

Una volta configurato il setup, il flusso ordinario è il seguente:

1. Apertura del **form preventivo auto**, organizzato in più sezioni: dati personali del cliente, dati di uno o due veicoli, dettagli di utilizzo e coperture richieste, storico sinistri degli ultimi 5 anni, alcune domande qualificanti.
2. Durante la compilazione del veicolo, il consulente apre un modal di ricerca per marca/modello che interroga il catalogo veicoli svizzero. Selezionando un risultato, dati come codice di omologazione, alimentazione, potenza e data di omologazione si auto-compilano.
3. Il consulente sceglie quali compagnie assicurative interrogare tramite una serie di **checkbox compagnie**, già filtrate in base alle compagnie consentite per quel consulente.
4. Se almeno una delle "domande qualificanti" finali blocca l'offerta (per esempio polizza precedente disdetta dalla compagnia, rifiuto di copertura, sospensione patente), un **modal di blocco** spiega che non è possibile generare un preventivo e impedisce l'invio.
5. All'invio del form il consulente vede un messaggio di conferma. La richiesta viene processata in background e gli esiti (le offerte ricevute) appaiono progressivamente nello **storico preventivi del consulente** e, di riflesso, nell'area offerte del cliente.

### 3.5 Consulente: registrare un cliente e inviare un mandato

Dalla home il consulente avvia il flusso di invio mandato. Vede l'elenco dei propri clienti (con indicazione di chi ha già un mandato firmato). Può:

- selezionare un cliente esistente per consultare le sue polizze e proseguire il lavoro su quel cliente, oppure
- aggiungere un nuovo cliente compilando un form di anagrafica (persona fisica o azienda); al termine della registrazione, il consulente prosegue immediatamente con l'aggiunta di polizze e l'invio mandato per quel cliente.

L'app gestisce caricamento e archiviazione del documento di mandato firmato.

### 3.6 Amministratore: supervisione consulenti

L'account amministrativo trova nel menu una voce dedicata "Gestione consulenti". Da lì può cercare un consulente, vederne lo stato di attivazione e quali compagnie assicurative ha disponibili per la generazione preventivi, e modificare entrambe le cose (attivare/disattivare il consulente, abilitare/disabilitare singole compagnie per quel consulente).

---

## 4. Inventario delle pagine

Per ogni pagina è descritto: **scopo**, **cosa vede l'utente**, **azioni possibili**, **stati visibili**, **navigazione** (da dove ci si arriva e dove si va), **restrizioni di accesso**.

---

### Area Accesso (pubblica)

#### 4.1 Login

- **Scopo:** consentire all'utente di entrare nell'area autenticata fornendo email e password.
- **Cosa vede:** logo OneZone, campo email, campo password con possibilità di mostrare/nascondere il testo, pulsante di accesso, link "Hai dimenticato la password?", link "Registrati", link alla scelta lingua.
- **Azioni:** inserire credenziali, inviare il form (anche con Invio), mostrare/nascondere la password, andare alla registrazione, andare al recupero password, cambiare lingua.
- **Stati:** caricamento durante la verifica delle credenziali; messaggio di errore chiaro in caso di credenziali errate o problemi di rete.
- **Navigazione:** è la pagina di arrivo per chi non è loggato; in caso di successo porta alla home; collega a registrazione, recupero password, selezione lingua.
- **Restrizioni:** solo utenti non autenticati.

#### 4.2 Registrazione

- **Scopo:** registrare un nuovo cliente nell'app, eventualmente associandolo a un consulente tramite link di invito.
- **Cosa vede:** selettore "Persona fisica" / "Azienda" che cambia i campi del form; campi anagrafici (nome, cognome o ragione sociale, indirizzo, CAP, città, email, telefono, data di nascita); checkbox di accettazione dei termini; pulsante di registrazione.
- **Azioni:** scegliere il tipo, compilare il form, accettare i termini, inviare.
- **Stati:** validazione campo per campo con messaggi inline; caricamento durante la creazione dell'account; messaggio di conferma o errore.
- **Navigazione:** raggiungibile dal login o da un link di invito personalizzato del consulente; in caso di successo l'utente viene autenticato e portato alla home.
- **Restrizioni:** solo utenti non autenticati.

#### 4.3 Recupero password

- **Scopo:** inviare al cliente un'email per reimpostare la password.
- **Cosa vede:** campo email, pulsante di invio, messaggio informativo.
- **Azioni:** inserire l'email, richiedere l'invio del link di reset.
- **Stati:** caricamento durante l'invio; messaggio di conferma dell'invio o messaggio di errore.
- **Navigazione:** raggiungibile dal login; in caso di successo invita l'utente a controllare la propria casella email.
- **Restrizioni:** solo utenti non autenticati.

#### 4.4 Selezione lingua (pre-login)

- **Scopo:** permettere all'utente non loggato di scegliere la lingua dell'interfaccia.
- **Cosa vede:** elenco delle lingue disponibili (tedesco, italiano, francese, inglese).
- **Azioni:** selezionare una lingua; l'interfaccia viene aggiornata e la preferenza salvata.
- **Stati:** indicazione della lingua attualmente attiva.
- **Navigazione:** raggiungibile dalla barra inferiore del layout pubblico; al termine si torna al login.
- **Restrizioni:** solo utenti non autenticati.

---

### Area Dashboard e Profilo (autenticata)

#### 4.5 Home

- **Scopo:** pagina di benvenuto e punto di partenza per ogni attività dell'utente loggato.
- **Cosa vede:** saluto personalizzato col nome; slider promozionale/informativo (immagini, titoli, testi, pulsante di azione); menu di scorciatoie verso le aree principali (le voci differiscono fra cliente e consulente); se è consulente, **due bottoni dedicati**: "Genera preventivi" e "Invia mandato"; in fondo una citazione/frase ispirazionale.
- **Azioni:** scorrere lo slider, cliccare le sue chiamate all'azione, aprire una voce del menu, avviare la generazione preventivi o il flusso mandato (solo consulente).
- **Stati:** caricamento dei banner; caricamento della verifica iniziale di setup per consulenti (con messaggio di attesa che può durare fino a un minuto e mezzo); informazioni "fresche" mostrate immediatamente quando già conosciute, aggiornate poi in background.
- **Navigazione:** è la prima pagina dopo il login; da qui si raggiungono tutte le altre aree.
- **Restrizioni:** solo utenti autenticati; il bottone "Genera preventivi" è visibile soltanto ai consulenti.

#### 4.6 Menu principale

- **Scopo:** offrire l'elenco completo delle aree dell'app in un'unica vista.
- **Cosa vede:** elenco di voci dinamico (varia per cliente/consulente/admin); in fondo, scorciatoie verso supporto, sito istituzionale e cambio lingua.
- **Azioni:** scegliere una voce per navigare verso l'area corrispondente; aprire la pagina cambio lingua; uscire dall'app (logout).
- **Stati:** indicazione della voce attiva.
- **Navigazione:** apribile da qualsiasi pagina autenticata tramite l'icona menu in header.
- **Restrizioni:** solo utenti autenticati; alcune voci visibili solo a consulenti, alcune solo agli amministratori.

#### 4.7 Profilo utente

- **Scopo:** visualizzare e modificare i propri dati personali, l'avatar e la password.
- **Cosa vede:** sezione dati personali (nome, email, telefono, indirizzo), avatar, sezione cambio password, pulsante di logout.
- **Azioni:** modificare i campi e salvare; caricare un nuovo avatar; cambiare password (vecchia + nuova confermata); effettuare il logout.
- **Stati:** caricamento dei dati, validazione, conferma del salvataggio, messaggi di errore.
- **Navigazione:** raggiungibile dall'icona profilo in header o dal menu.
- **Restrizioni:** solo utenti autenticati.

#### 4.8 Selezione lingua (post-login)

- **Scopo:** consentire all'utente già autenticato di cambiare lingua.
- **Cosa vede:** elenco delle lingue disponibili.
- **Azioni:** selezionare una lingua; l'interfaccia si aggiorna immediatamente e la preferenza viene salvata.
- **Stati:** indicazione della lingua attualmente attiva.
- **Navigazione:** raggiungibile dal menu principale.
- **Restrizioni:** solo utenti autenticati.

---

### Area Polizze

#### 4.9 Elenco polizze

- **Scopo:** mostrare le polizze associate all'utente (proprie, oppure di un cliente specifico se si tratta di un consulente).
- **Cosa vede:** intestazione con il titolo della pagina; eventuale pulsante "Aggiungi polizza"; le polizze sono presentate come card a due colonne, con immagine della compagnia o della targa del veicolo, e raggruppate per cliente assicurato.
- **Azioni:** aprire la card per vedere il dettaglio; avviare l'aggiunta di una nuova polizza.
- **Stati:** caricamento iniziale; stato vuoto se non esistono polizze.
- **Navigazione:** raggiungibile dal menu o dalle scorciatoie home; cliccando una card si apre il dettaglio polizza; può essere visualizzata anche filtrata per uno specifico cliente.
- **Restrizioni:** solo utenti autenticati.

#### 4.10 Dettaglio polizza

- **Scopo:** mostrare tutte le informazioni di una singola polizza.
- **Cosa vede:** informazioni generali (numero, tipo, compagnia, periodo di validità), beni assicurati (es. veicoli), coperture e franchigie, premi, documenti scaricabili, timeline di eventi/sinistri.
- **Azioni:** aprire/scaricare un documento, eventualmente avviare azioni collegate (es. report, condivisione, modifica se permessa).
- **Stati:** caricamento, eventuali messaggi se mancano dati.
- **Navigazione:** raggiungibile dall'elenco polizze; permette di aprire la visualizzazione documenti e altri sotto-flussi.
- **Restrizioni:** solo utenti autenticati e solo per polizze a cui l'utente ha titolo ad accedere.

#### 4.11 Aggiunta polizza

- **Scopo:** registrare una nuova polizza in archivio.
- **Cosa vede:** form multi-sezione con dati anagrafici dell'assicurato, beni assicurati, coperture, caricamento documenti.
- **Azioni:** compilare il form, caricare allegati (PDF, immagini), inviare.
- **Stati:** validazione, caricamento durante l'invio, messaggio di esito.
- **Navigazione:** raggiungibile dall'elenco polizze; al termine torna all'elenco aggiornato.
- **Restrizioni:** solo utenti autenticati con il permesso di aggiungere polizze.

#### 4.12 Selezione multipla polizze

- **Scopo:** permettere di selezionare più polizze contemporaneamente per eseguire un'azione cumulativa (per esempio confrontarle).
- **Cosa vede:** elenco polizze con casella di selezione, pulsante "seleziona tutto", pulsante che avvia l'azione cumulativa.
- **Azioni:** selezionare/deselezionare polizze, avviare il confronto o l'azione successiva.
- **Stati:** indicazione del numero di selezionati.
- **Navigazione:** dall'elenco polizze; porta al confronto.
- **Restrizioni:** solo utenti autenticati.

#### 4.13 Confronto polizze

- **Scopo:** confrontare visivamente più polizze fianco a fianco.
- **Cosa vede:** tabella comparativa con una colonna per polizza e una riga per ciascuna caratteristica/premio; eventuali grafici riassuntivi.
- **Azioni:** consultare il confronto, esportare/scaricare il risultato.
- **Stati:** caricamento, calcolo dei premi.
- **Navigazione:** raggiungibile dalla selezione multipla; consente di tornare all'elenco.
- **Restrizioni:** solo utenti autenticati.

#### 4.14 Report polizza

- **Scopo:** generare un documento riepilogativo di una polizza in formato PDF.
- **Cosa vede:** anteprima del documento, opzioni di download e stampa.
- **Azioni:** scaricare, stampare, eventualmente condividere.
- **Stati:** generazione del documento (caricamento), pronto.
- **Navigazione:** raggiungibile dal dettaglio polizza; viene aperto in **layout documento a tutto schermo**.
- **Restrizioni:** solo utenti autenticati.

---

### Area Offerte

#### 4.15 Elenco offerte

- **Scopo:** mostrare al cliente tutte le offerte ricevute dal consulente, organizzate per stato.
- **Cosa vede:** tre schede in alto: **Pendenti**, **Accettate**, **Rifiutate**, ciascuna con un'icona e il conteggio; all'interno di ogni scheda le offerte sono raggruppate per ramo assicurativo, presentate come liste espandibili; ogni offerta mostra date, premio, stato e azioni (accetta, rifiuta, vedi dettaglio).
- **Azioni:** cambiare scheda; espandere/contrarre un ramo; aprire il dettaglio di una singola offerta; accettare o rifiutare un'offerta.
- **Stati:** caricamento iniziale; stato vuoto per le schede senza offerte; conferma/errore dopo accettazione o rifiuto.
- **Navigazione:** raggiungibile dal menu o dalla home; le azioni accetta/rifiuta producono un toast di conferma e aggiornano lo stato in lista.
- **Restrizioni:** solo utenti autenticati.

---

### Area Clienti e Mandati (consulente)

#### 4.16 Elenco clienti

- **Scopo:** mostrare al consulente l'anagrafica dei propri clienti.
- **Cosa vede:** barra di ricerca con filtro in tempo reale; pulsante "Aggiungi cliente"; card per cliente che riportano nome, conteggio di persone e polizze associate, indirizzo, eventuale badge "Mandato presente", scorciatoie per telefonare o inviare un'email.
- **Azioni:** cercare un cliente, aprirne il dettaglio, telefonare/inviare email direttamente, aggiungere un nuovo cliente.
- **Stati:** caricamento, stato vuoto, risultato di ricerca vuoto.
- **Navigazione:** raggiungibile dal menu (visibile ai consulenti); apre il dettaglio cliente o l'elenco delle sue polizze.
- **Restrizioni:** solo consulenti.

#### 4.17 Elenco clienti con focus mandato

- **Scopo:** versione dell'elenco clienti pensata per il flusso "Invia mandato": evidenzia lo stato del mandato.
- **Cosa vede:** stessa struttura dell'elenco clienti, con maggior risalto al badge "Mandato presente/assente" e azioni rapide per caricare/visualizzare il mandato.
- **Azioni:** cercare un cliente, aprirne le polizze, caricare un mandato, aggiungere un nuovo cliente.
- **Stati:** caricamento, stato vuoto.
- **Navigazione:** raggiungibile dal pulsante "Invia mandato" della home o dal menu; porta all'aggiunta cliente o all'elenco polizze del cliente selezionato.
- **Restrizioni:** solo consulenti.

#### 4.18 Aggiunta cliente per mandato

- **Scopo:** registrare un nuovo cliente come parte del flusso di invio mandato, senza uscire dalla sessione consulente.
- **Cosa vede:** selettore "Persona fisica / Azienda" che cambia i campi; campi anagrafici (nome, cognome o ragione sociale, email, data di nascita, indirizzo, CAP, città, telefono, password iniziale); pulsante di creazione.
- **Azioni:** compilare il form, salvare.
- **Stati:** validazione locale + validazione lato server con messaggi specifici per campo; caricamento durante la creazione.
- **Navigazione:** raggiungibile dall'elenco clienti con focus mandato; al termine porta direttamente all'elenco polizze del cliente appena creato.
- **Restrizioni:** solo consulenti.

#### 4.19 Polizze del cliente sotto mandato

- **Scopo:** mostrare al consulente l'elenco delle polizze di uno specifico cliente per cui sta gestendo un mandato.
- **Cosa vede:** intestazione con il nome del cliente; elenco delle polizze del cliente; possibilità di aggiungerne di nuove.
- **Azioni:** aprire una polizza per il dettaglio, aggiungere una polizza.
- **Stati:** caricamento, stato vuoto se il cliente non ha ancora polizze.
- **Navigazione:** raggiungibile selezionando un cliente nell'elenco mandati; apre il dettaglio polizza.
- **Restrizioni:** solo consulenti.

#### 4.20 Form mandato Wefox

- **Scopo:** compilare e inviare il modulo specifico di mandato per la compagnia Wefox.
- **Cosa vede:** form replica del modulo Wefox con i campi essenziali per il mandato.
- **Azioni:** compilare e inviare.
- **Stati:** validazione, caricamento, conferma di invio.
- **Navigazione:** raggiungibile dal menu, ma soltanto per i consulenti partner Wefox.
- **Restrizioni:** solo consulenti partner Wefox.

---

### Area Automazione Preventivi (consulente)

#### 4.21 Setup iniziale automazione

- **Scopo:** collegare il consulente al servizio esterno di quotazione preventivi auto. Va eseguito una sola volta, alla prima generazione.
- **Cosa vede:** wizard a step con istruzioni; campi per le credenziali del servizio esterno; passaggio dedicato all'autenticazione a due fattori; messaggio informativo sulla durata della verifica (fino a circa un minuto e mezzo).
- **Azioni:** inserire credenziali, fornire il codice a due fattori, confermare.
- **Stati:** caricamento prolungato durante la verifica; messaggio di esito (successo o errore con possibilità di riprovare).
- **Navigazione:** raggiungibile dalla home quando il consulente avvia "Genera preventivi" e il sistema rileva che non è ancora configurato; al termine porta direttamente al form preventivi.
- **Restrizioni:** solo consulenti.

#### 4.22 Form generazione preventivi auto

- **Scopo:** raccogliere in un unico form tutte le informazioni necessarie per chiedere preventivi auto a più compagnie contemporaneamente.
- **Cosa vede:** form lungo, diviso in **sezioni numerate** chiaramente separate:

  1. **Dati personali del cliente**: genere (uomo/donna/azienda), nome e cognome o ragione sociale, data di nascita, dati patente, indirizzo con CAP e città, email, telefono, nazionalità ed eventuale documento per stranieri, lingua preferita per l'offerta.
  2. **Dati del primo veicolo**: ricerca marca/modello tramite **modal dedicato** che interroga il catalogo veicoli svizzero; dati tecnici (alimentazione, potenza, omologazione) pre-compilati e non modificabili dopo la selezione; numero certificato, matricola, accessori, cantone di immatricolazione, targa, data di prima immatricolazione, leasing, garage abituale, eventuale targa intercambiabile.
  3. **Dati di un eventuale secondo veicolo**: stessa struttura del primo, opzionale.
  4. **Utilizzo e coperture**: uso del veicolo, livello di responsabilità civile, coperture aggiuntive (kasko totale o parziale, danni di parcheggio, vetri, beni personali, pneumatici, protezione bonus, assistenza, libera scelta dell'officina, infortuni passeggeri); per veicoli elettrici quattro checkbox specifiche (batteria, ricarica, cyber, altro); modalità di pagamento.
  5. **Storico sinistri**: compagnia assicurativa attuale, numero di sinistri negli ultimi 5 anni divisi per tipologia (responsabilità civile, collisione, parcheggio, vetri, kasko parziale); sotto il titolo della sezione è presente una breve descrizione informativa che spiega cosa indicare.
  6. **Altre domande**: tre checkbox qualificanti (polizza precedente disdetta, rifiuto di copertura, sospensione patente).

  Sopra il pulsante di invio, una serie di **checkbox per la scelta delle compagnie** da interrogare; l'elenco è già filtrato escludendo quelle non disponibili per il consulente.

- **Azioni:** compilare il form (con assistenza alla compilazione, ad esempio auto-completamento CAP/città); aprire il modal di ricerca veicolo e selezionare il risultato per popolare il blocco veicolo; selezionare le compagnie; inviare il form.

- **Modal di ricerca veicolo:** campi di ricerca per matricola, omologazione, marca, modello; pulsante cerca; tabella risultati con marca, modello, omologazione, alimentazione, potenza (in kW e cv), data di omologazione; paginazione; cliccando una riga il veicolo viene selezionato e popola il blocco veicolo.

- **Modal di blocco offerta:** se almeno una delle checkbox dell'ultima sezione è selezionata, all'invio compare un modal che spiega che non è possibile calcolare l'offerta ed elenca le condizioni bloccanti; il submit è impedito.

- **Stati:** validazione in tempo reale con asterischi sui campi obbligatori e messaggi di errore inline; caricamento durante la ricerca veicolo nel modal; caricamento durante l'invio; schermata di successo con conferma visiva che resta visibile alcuni secondi.

- **Modalità di test:** in ambiente di sviluppo è disponibile un pulsante che riempie automaticamente il form con dati di esempio (deve essere rimovibile in produzione).

- **Navigazione:** raggiungibile dalla home (se il setup è già fatto) o automaticamente dopo il setup iniziale; al termine torna alla home.

- **Restrizioni:** solo consulenti che hanno completato il setup.

#### 4.23 Storico e gestione preventivi consulente

- **Scopo:** mostrare al consulente l'esito delle proprie richieste di preventivo, con lo stato di avanzamento e le offerte raccolte.
- **Cosa vede:** elenco delle richieste con data, cliente di riferimento, numero di offerte raccolte, stato (in elaborazione, completata, errore), pulsante per vedere il dettaglio delle offerte ricevute. Se l'account corrente è amministrativo, in alternativa viene mostrato un **pannello di gestione consulenti** con:
  - barra di ricerca per nome/cognome/username del consulente,
  - card consulente con stato attivo/disattivo e indicatore di stato del collegamento al servizio esterno,
  - modal di dettaglio in cui è possibile attivare/disattivare il consulente e abilitare/disabilitare singolarmente ciascuna compagnia assicurativa.
- **Azioni:** aprire il dettaglio di una richiesta per consultare le offerte; (admin) cercare un consulente, aprirne il dettaglio, modificarne attivazione e compagnie disponibili.
- **Stati:** caricamento, stato vuoto, indicatori di stato chiari (in attesa / completato / errore).
- **Navigazione:** raggiungibile dal menu; per i consulenti porta al dettaglio delle offerte; per gli amministratori contiene il pannello di gestione.
- **Restrizioni:** solo consulenti; il pannello di gestione consulenti è riservato agli account amministrativi.

---

### Area Documenti

#### 4.24 Visualizzatore documenti

- **Scopo:** mostrare a tutto schermo un documento PDF (contratto, report, allegato di polizza, mandato).
- **Cosa vede:** documento PDF a tutto schermo con barra strumenti per zoom, scorrimento pagine, download e stampa. Non sono presenti header né barre di navigazione dell'app.
- **Azioni:** scorrere, zoomare, scaricare, stampare.
- **Stati:** caricamento del documento, errore se il documento non è disponibile.
- **Navigazione:** raggiungibile da un dettaglio polizza, da un report o da un mandato; il ritorno avviene tramite il comando "indietro" del browser/app.
- **Restrizioni:** solo utenti autenticati e solo per documenti a cui l'utente ha titolo ad accedere.

---

## 5. Documentazione API

La documentazione delle API del backend principale è consultabile al seguente indirizzo:

**https://onezone.brokerstar.biz/api/docs**

La documentazione delle API relative all'automazione (generazione preventivi auto, integrazione con il servizio di quotazione esterno) è consultabile al seguente indirizzo:

**https://api-car-scraping.onezone.ch/docs**

---

## 6. Note finali per il team di sviluppo

- Le scelte di framework, libreria UI, gestione dello stato, struttura cartelle, naming, stile grafico e libreria di componenti sono **interamente a discrezione del team di sviluppo**.
- Il documento descrive comportamenti e contenuti minimi attesi: il team è libero di proporre miglioramenti di esperienza utente, di rivedere il raggruppamento di pagine o di unire/separare schermate, purché ogni capacità funzionale qui elencata resti supportata.
- Restano vincolanti: i ruoli (cliente, consulente, amministrativo, consulente partner Wefox), le quattro lingue, la presenza delle integrazioni esterne come capacità funzionali, i blocchi di compilazione descritti nel form preventivi auto, la distinzione fra area pubblica, area autenticata e visualizzazione documento a tutto schermo.
