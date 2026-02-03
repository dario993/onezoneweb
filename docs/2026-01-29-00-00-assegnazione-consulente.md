# Piano di Implementazione: Assegnazione Consulente Tramite URL

## Informazioni Documento
- **Versione**: 1.1
- **Data creazione**: 2026-01-28
- **Data implementazione**: 2026-01-29
- **Autore**: Piano Tecnico per sviluppo
- **Stato**: Implementato

---

## 1. Obiettivo

Implementare un sistema che permetta di assegnare automaticamente un consulente specifico a un nuovo utente durante la registrazione, passando il codice identificativo del consulente tramite URL.

### Esempio URL
```
https://webapp.onezone.ch/register/0852221850d5638e4c80b9da870f942b
```

Dove `0852221850d5638e4c80b9da870f942b` è il codice univoco del consulente.

---

## 2. Analisi Stato Precedente all'Implementazione

### 2.1 Codice Esistente (Prima delle modifiche)

#### Componente: RegisterComponent
**File**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

**Funzionalità già presente**:
- Il componente **già gestiva** un parametro `code` dall'URL
- Il codice veniva **già inviato** al backend come `invitationCode` nel payload
- La logica era già implementata ma **non era attiva** perché mancava la rotta corrispondente

**Codice rilevante (prima delle modifiche)**:
```typescript
private code: string = '';

this.route.params.subscribe((params) => {
  if (params['code']) {
    this.code = params['code'];
  }
});

if (isset(this.code, true)) {
  payload['invitationCode'] = this.code;
}
```

#### Routing (Prima delle modifiche)
**File**: [src/app/app.routes.ts](src/app/app.routes.ts)

**Rotte presenti**:
- `/register` - Registrazione standard
- `/link/:contactid` - Collegamento sotto-contatto (layout autenticato)

**Problema**: Non esisteva la rotta `/register/:consultantCode`

### 2.2 Servizi API

#### BrokerstarService
**File**: [src/app/services/brokerstar.service.ts](src/app/services/brokerstar.service.ts)

**Metodo utilizzato**: `registerUser(registerData)`

**Endpoint API**: `POST /api/v3/user/register`

Il payload inviato include il campo `invitationCode`, che il backend utilizza per l'assegnazione del consulente.

---

## 3. Modifiche Implementate

### 3.1 Modifica al File: app.routes.ts - IMPLEMENTATA

**Percorso**: [src/app/app.routes.ts](src/app/app.routes.ts)

Aggiunta la rotta parametrizzata `register/:consultantCode` mantenendo anche la rotta base `/register`.

**Codice implementato** (righe 40-46):
```typescript
{
  path: '',
  component: LayoutUnauthedComponent,
  children: [
    { path: 'login', component: LoginComponent },
    { path: 'recover', component: RecoverComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'register/:consultantCode', component: RegisterComponent },
    { path: 'language_unauthed', component: LanguageComponent },
  ],
  canActivate: [isNonAuthenticatedRoute],
}
```

**Nota**: La rotta `/register` viene prima di `/register/:consultantCode` per evitare conflitti.

---

### 3.2 Modifica al File: register.component.ts - IMPLEMENTATA

**Percorso**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

Il nome del parametro URL è stato cambiato da `code` a `consultantCode` per maggiore chiarezza.

**Codice implementato** (righe 45-53):
```typescript
public ngOnInit(): void {
  this.route.params.subscribe((params) => {
    if (params['consultantCode']) {
      this.code = params['consultantCode'];
    }
    if (params['contactid']) {
      this.link = true;
    }
  });
}
```

**Nota**: L'implementazione è stata mantenuta semplice e pulita, senza validazione frontend del codice né logging di debug, in quanto la validazione è delegata al backend.

---

### 3.3 Invio del codice nel payload - GIA' PRESENTE

**Percorso**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

Il codice consulente viene aggiunto al payload di registrazione come `invitationCode` (righe 176-178):

```typescript
if (isset(this.code, true)) {
  payload['invitationCode'] = this.code;
}
```

Questo codice era già presente prima delle modifiche e non ha richiesto cambiamenti.

---

### 3.4 Gestione Errori - IMPLEMENTATA (versione semplificata)

**Percorso**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

La gestione errori nella funzione `submit()` gestisce sia errori generici che violations in modo unificato (righe 236-255):

```typescript
error: (error: any) => {
  if (error.error?.error) {
    this.toasterService.alert(error.error.error);
  } else {
    this.toasterService.alert(
      this.i18n.getTranslation('profile', 'error')
    );
  }

  if (error.error?.violations) {
    error.error.violations.forEach((violation: any) => {
      this.errorFields[violation.propertyPath] = violation.title;
    });
  }

  this.loaderService.hide();
  this.cdr.detectChanges();
}
```

**Differenza dal piano originale**: Non è stata implementata una gestione specifica per l'errore `invitationCode`. Gli eventuali errori del codice consulente vengono gestiti tramite il meccanismo generico delle `violations` del backend.

---

### 3.5 Aggiornamento File i18n - NON IMPLEMENTATO

Le traduzioni specifiche `invalidConsultantCode` e `consultantAssigned` **non sono state aggiunte** ai file i18n. Gli errori relativi al codice consulente vengono gestiti tramite i messaggi di errore generici già esistenti e tramite i messaggi restituiti dal backend.

---

### 3.6 Feedback Visivo all'Utente - NON IMPLEMENTATO

Il banner visivo nel template HTML per indicare la presenza del codice consulente nell'URL **non è stato implementato**. La registrazione con codice consulente avviene in modo trasparente per l'utente, senza indicazioni visive aggiuntive.

---

### 3.7 Validazione Frontend del Codice - NON IMPLEMENTATA

Il metodo `validateConsultantCode()` proposto nel piano originale **non è stato implementato**. La validazione del codice consulente è interamente delegata al backend API.

---

## 4. Riepilogo Implementazione

### Checklist Finale

#### Frontend

- [x] Modificare [app.routes.ts](src/app/app.routes.ts) - Aggiunta rotta `/register/:consultantCode`
- [x] Modificare [register.component.ts](src/app/pages/register/register.component.ts) - Cambiato parametro da `code` a `consultantCode`
- [x] Gestione errori generica per violations (include eventuali errori `invitationCode`)
- [ ] ~~(Opzionale) Aggiungere logging per debug~~ - Non implementato
- [ ] ~~(Opzionale) Aggiungere banner visivo nel template HTML~~ - Non implementato
- [ ] ~~Aggiungere traduzioni i18n specifiche~~ - Non implementato
- [ ] ~~Validazione frontend del codice consulente~~ - Non implementato (delegato al backend)
- [ ] ~~Scrivere test unitari~~ - Non implementato
- [ ] ~~Scrivere test E2E~~ - Non implementato

---

## 5. Flusso Funzionale Implementato

```
┌─────────────────────────────────────────────┐
│  Consulente genera link con suo codice      │
│  https://webapp.onezone.ch/register/XXX     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Utente clicca sul link                     │
│  (Email, SMS, QR Code, etc.)                │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Router Angular carica RegisterComponent    │
│  Rotta: /register/:consultantCode           │
│  Parametro: consultantCode = XXX            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  RegisterComponent.ngOnInit()               │
│  - Estrae consultantCode dai params         │
│  - Salva in this.code                       │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Utente compila form di registrazione       │
│  - Nome, cognome, email, password, etc.     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  RegisterComponent.submit()                 │
│  - Valida dati form                         │
│  - Crea payload con tutti i dati            │
│  - Se this.code presente:                   │
│    payload['invitationCode'] = this.code    │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  BrokerstarService.registerUser(payload)    │
│  POST /api/v3/user/register                 │
└─────────────────┬───────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌─────────────┐    ┌──────────────────────┐
│   SUCCESS   │    │       ERROR          │
└──────┬──────┘    └────────┬─────────────┘
       │                    │
       ▼                    ▼
┌──────────────┐   ┌──────────────────────┐
│  Auto-login  │   │  Se error.error:     │
│  via         │   │    mostra messaggio  │
│  brokerstar  │   │  Se violations:      │
│  .login()    │   │    evidenzia campi   │
└──────┬───────┘   └──────────────────────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Redirect a /policyadd                      │
│  (Utente inizia ad aggiungere polizze)      │
└─────────────────────────────────────────────┘
```

---

## 6. File Modificati

| File | Tipo Modifica | Descrizione |
|------|--------------|-------------|
| `src/app/app.routes.ts` (riga 44) | Aggiunta riga | Nuova rotta `register/:consultantCode` |
| `src/app/pages/register/register.component.ts` (riga 47) | Modifica | Parametro rinominato da `params['code']` a `params['consultantCode']` |

---

## 7. Possibili Estensioni Future (Non Implementate)

Le seguenti funzionalità erano previste nel piano originale come opzionali o future:

1. **Validazione frontend del codice** - Metodo `validateConsultantCode()` con regex
2. **Banner visivo** - Indicatore nel template che il codice consulente è stato rilevato
3. **Traduzioni i18n specifiche** - Messaggi `invalidConsultantCode` e `consultantAssigned`
4. **QR Code Generator** - Generazione QR code per i consulenti
5. **Link con parametri aggiuntivi** - Tracciamento fonte (email, social, qr)
6. **Dashboard consulente** - Visualizzazione statistiche registrazioni
7. **Codici temporanei** - Codici con scadenza e limite utilizzi
8. **Google Analytics** - Tracciamento eventi registrazione con codice
9. **Test unitari e E2E** - Copertura test automatizzati

---

## 8. Riferimenti

- [Documentazione Tecnica OneZone](../CLAUDE.md)
- [API BrokerStar - Confluence](https://wmcch.atlassian.net/wiki/spaces/FAQ/)

---

**Fine Documento**

---

**Versione**: 1.1
**Ultima Modifica**: 2026-02-02
**Autore**: Piano Tecnico OneZone
**Status**: Implementato
