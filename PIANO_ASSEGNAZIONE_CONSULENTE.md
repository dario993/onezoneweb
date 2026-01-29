# Piano di Implementazione: Assegnazione Consulente Tramite URL

## Informazioni Documento
- **Versione**: 1.0
- **Data**: 2026-01-28
- **Autore**: Piano Tecnico per sviluppo
- **Stato**: Da implementare

---

## 1. Obiettivo

Implementare un sistema che permetta di assegnare automaticamente un consulente specifico a un nuovo utente durante la registrazione, passando il codice identificativo del consulente tramite URL.

### Esempio URL
```
https://webapp.onezone.ch/register/0852221850d5638e4c80b9da870f942b
```

Dove `0852221850d5638e4c80b9da870f942b` è il codice univoco del consulente.

---

## 2. Analisi Stato Attuale

### 2.1 Codice Esistente

#### Componente: RegisterComponent
**File**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

**Funzionalità già presente**:
- Il componente **già gestisce** un parametro `code` dall'URL (righe 31, 46-49)
- Il codice viene **già inviato** al backend come `invitationCode` nel payload (righe 176-178)
- La logica è già implementata ma **non è attiva** perché manca la rotta corrispondente

**Codice rilevante**:
```typescript
// Riga 31
private code: string = '';

// Righe 46-49
this.route.params.subscribe((params) => {
  if (params['code']) {
    this.code = params['code'];
  }
});

// Righe 176-178
if (isset(this.code, true)) {
  payload['invitationCode'] = this.code;
}
```

#### Routing
**File**: [src/app/app.routes.ts](src/app/app.routes.ts)

**Rotte attuali**:
- `/register` - Registrazione standard (riga 43)
- `/link/:contactid` - Collegamento sotto-contatto (riga 56, layout autenticato)

**Problema**: Non esiste una rotta `/register/:consultantCode`

### 2.2 Servizi API

#### BrokerstarService
**File**: [src/app/services/brokerstar.service.ts](src/app/services/brokerstar.service.ts)

**Metodo utilizzato**: `registerUser(registerData)` (righe 67-80)

**Endpoint API**: `POST /api/v3/user/register`

Il payload inviato include già il campo `invitationCode`, che presumibilmente il backend utilizza per l'assegnazione del consulente.

---

## 3. Modifiche Necessarie

### 3.1 Modifica al File: app.routes.ts

**Percorso**: [src/app/app.routes.ts](src/app/app.routes.ts)

#### Azione Richiesta
Aggiungere una nuova rotta parametrizzata per gestire il codice consulente nell'URL.

#### Modifica Dettagliata

**PRIMA** (righe 38-47):
```typescript
{
  path: '',
  component: LayoutUnauthedComponent,
  children: [
    { path: 'login', component: LoginComponent },
    { path: 'recover', component: RecoverComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'language_unauthed', component: LanguageComponent },
  ],
  canActivate: [isNonAuthenticatedRoute],
}
```

**DOPO**:
```typescript
{
  path: '',
  component: LayoutUnauthedComponent,
  children: [
    { path: 'login', component: LoginComponent },
    { path: 'recover', component: RecoverComponent },
    { path: 'register', component: RegisterComponent },
    { path: 'register/:consultantCode', component: RegisterComponent },  // NUOVA RIGA
    { path: 'language_unauthed', component: LanguageComponent },
  ],
  canActivate: [isNonAuthenticatedRoute],
}
```

**Nota importante sull'ordine**: La rotta specifica `/register` deve venire **prima** della rotta parametrizzata `/register/:consultantCode` per evitare conflitti.

#### Alternativa - Ordine Invertito (NON CONSIGLIATO)
Se si volesse solo la rotta parametrizzata:
```typescript
// Sostituire 'register' con 'register/:consultantCode'
{ path: 'register/:consultantCode', component: RegisterComponent }
```
Ma questo **impedirebbe** l'accesso diretto a `/register` senza codice.

**Raccomandazione**: Mantenere entrambe le rotte come mostrato sopra.

---

### 3.2 Modifica al File: register.component.ts

**Percorso**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

#### Azione Richiesta
Modificare il nome del parametro URL da `code` a `consultantCode` per maggiore chiarezza.

#### Modifica Dettagliata

**PRIMA** (righe 46-49):
```typescript
this.route.params.subscribe((params) => {
  if (params['code']) {
    this.code = params['code'];
  }
  if (params['contactid']) {
    this.link = true;
  }
});
```

**DOPO**:
```typescript
this.route.params.subscribe((params) => {
  if (params['consultantCode']) {
    this.code = params['consultantCode'];
  }
  if (params['contactid']) {
    this.link = true;
  }
});
```

**Motivazione**: Il nome `consultantCode` è più esplicito e autodocumentante.

#### Opzionale - Logging per Debug

Per facilitare il debug durante lo sviluppo, è consigliabile aggiungere un log:

```typescript
this.route.params.subscribe((params) => {
  if (params['consultantCode']) {
    this.code = params['consultantCode'];
    console.log('Codice consulente ricevuto:', this.code);  // DEBUG
  }
  if (params['contactid']) {
    this.link = true;
  }
});
```

**Rimuovere il log in produzione**.

---

### 3.3 Verifica Backend API

**Percorso**: Backend BrokerStar API

#### Azione Richiesta
Verificare che l'endpoint `/api/v3/user/register` accetti e processi correttamente il campo `invitationCode`.

#### Verifiche da Eseguire

1. **Documentazione API**
   - Consultare: https://wmcch.atlassian.net/wiki/spaces/FAQ/pages/557833/API+Authentication
   - Verificare che `invitationCode` sia un campo accettato
   - Verificare il formato richiesto (stringa, lunghezza, pattern)

2. **Test Endpoint**
   - Effettuare una chiamata POST con `invitationCode` nel payload
   - Verificare che il backend assegni correttamente il consulente
   - Verificare eventuali errori o validazioni

3. **Formato del Codice**
   ```json
   {
     "name1": "Mario",
     "name2": "Rossi",
     "mail": "mario.rossi@example.com",
     "password": "SecurePass123!",
     "invitationCode": "0852221850d5638e4c80b9da870f942b",
     ...
   }
   ```

4. **Possibili Scenari da Gestire**
   - Codice consulente non valido
   - Codice consulente scaduto
   - Consulente non disponibile
   - Codice non fornito (registrazione libera)

#### Modifiche Backend Necessarie (se non già implementato)

Se il backend **non supporta** ancora `invitationCode`, sarà necessario:

1. **Creare tabella mapping**
   ```sql
   CREATE TABLE consultant_codes (
     id INT PRIMARY KEY AUTO_INCREMENT,
     code VARCHAR(255) UNIQUE NOT NULL,
     consultant_id INT NOT NULL,
     active BOOLEAN DEFAULT TRUE,
     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
     expires_at TIMESTAMP NULL,
     FOREIGN KEY (consultant_id) REFERENCES consultants(id)
   );
   ```

2. **Modificare endpoint registrazione**
   - Accettare parametro `invitationCode`
   - Validare il codice nel database
   - Associare `consultant_id` all'utente registrato
   - Gestire errori (codice invalido, scaduto, ecc.)

3. **Aggiungere endpoint per generare codici**
   - `POST /api/v3/consultant/generate-code`
   - Permette ai consulenti di generare i propri codici referral

---

### 3.4 Gestione Errori Frontend

**Percorso**: [src/app/pages/register/register.component.ts](src/app/pages/register/register.component.ts)

#### Azione Richiesta
Migliorare la gestione degli errori relativi al codice consulente non valido.

#### Modifica Dettagliata

**Aggiungere nella funzione submit()** (dopo riga 235):

```typescript
error: (error: any) => {
  // Gestione esistente
  this.toasterService.alert(
    this.i18n.getTranslation('profile', 'error')
  );

  error.error.violations.forEach((violation: any) => {
    this.errorFields[violation.propertyPath] = violation.title;

    // NUOVO: Gestione specifica per invitationCode
    if (violation.propertyPath === 'invitationCode') {
      this.toasterService.error(
        this.i18n.getTranslation('register', 'invalidConsultantCode') ||
        'Codice consulente non valido'
      );
    }
  });

  this.loaderService.hide();
  this.cdr.detectChanges();
}
```

---

### 3.5 Aggiornamento File i18n

**Percorsi**:
- [src/assets/i18n/it.json](src/assets/i18n/it.json)
- [src/assets/i18n/en.json](src/assets/i18n/en.json)
- [src/assets/i18n/de.json](src/assets/i18n/de.json)
- [src/assets/i18n/fr.json](src/assets/i18n/fr.json)

#### Azione Richiesta
Aggiungere traduzioni per i messaggi relativi al codice consulente.

#### Modifica Dettagliata

**Aggiungere nella sezione "register"**:

**it.json**:
```json
{
  "register": {
    ...esistenti,
    "invalidConsultantCode": "Il codice consulente fornito non è valido o è scaduto",
    "consultantAssigned": "Sei stato assegnato al tuo consulente personale"
  }
}
```

**en.json**:
```json
{
  "register": {
    ...existing,
    "invalidConsultantCode": "The provided consultant code is invalid or expired",
    "consultantAssigned": "You have been assigned to your personal consultant"
  }
}
```

**de.json**:
```json
{
  "register": {
    ...existing,
    "invalidConsultantCode": "Der angegebene Beratercode ist ungültig oder abgelaufen",
    "consultantAssigned": "Sie wurden Ihrem persönlichen Berater zugewiesen"
  }
}
```

**fr.json**:
```json
{
  "register": {
    ...existing,
    "invalidConsultantCode": "Le code consultant fourni est invalide ou expiré",
    "consultantAssigned": "Vous avez été affecté à votre consultant personnel"
  }
}
```

---

### 3.6 Feedback Visivo all'Utente (Opzionale)

**Percorso**: [src/app/pages/register/register.component.html](src/app/pages/register/register.component.html)

#### Azione Richiesta
Mostrare un messaggio all'utente quando viene rilevato un codice consulente nell'URL.

#### Modifica Dettagliata

**Aggiungere dopo l'header** (dopo riga 8):

```html
<!-- Consultant Code Indicator -->
<div *ngIf="code && !link" class="w-full mb-6 p-4 bg-green-100 border border-green-300 rounded">
  <p class="text-sm text-green-800 font-semibold">
    ✓ {{ "register.consultantAssigned" | i18n }}
  </p>
</div>
```

Questo mostrerà un banner verde quando un codice consulente è presente nell'URL.

#### CSS Aggiuntivo (se necessario)

Se si desidera uno stile personalizzato, aggiungere in [register.component.scss](src/app/pages/register/register.component.scss):

```scss
.consultant-assigned-banner {
  background: linear-gradient(135deg, #e8f5e9 0%, #c8e6c9 100%);
  border-left: 4px solid #4caf50;
  padding: 12px 16px;
  border-radius: 4px;
  margin-bottom: 24px;

  p {
    margin: 0;
    color: #2e7d32;
    font-weight: 600;
    font-size: 14px;
  }
}
```

---

## 4. Testing

### 4.1 Test Unitari

#### Test per RegisterComponent

**File da creare/modificare**: `src/app/pages/register/register.component.spec.ts`

**Test da implementare**:

```typescript
describe('RegisterComponent - Consultant Code', () => {
  it('should extract consultant code from URL parameters', () => {
    // Setup
    const consultantCode = '0852221850d5638e4c80b9da870f942b';
    const activatedRoute = {
      params: of({ consultantCode })
    };

    // Test
    component.ngOnInit();

    // Assert
    expect(component['code']).toBe(consultantCode);
  });

  it('should include invitationCode in registration payload', () => {
    // Setup
    component['code'] = '0852221850d5638e4c80b9da870f942b';
    component.registerData = { /* dati completi */ };

    // Spy
    spyOn(brokerstarService, 'registerUser');

    // Test
    component.submit();

    // Assert
    expect(brokerstarService.registerUser).toHaveBeenCalledWith(
      jasmine.objectContaining({
        invitationCode: '0852221850d5638e4c80b9da870f942b'
      })
    );
  });

  it('should not include invitationCode if code is empty', () => {
    // Setup
    component['code'] = '';
    component.registerData = { /* dati completi */ };

    // Spy
    spyOn(brokerstarService, 'registerUser');

    // Test
    component.submit();

    // Assert
    expect(brokerstarService.registerUser).toHaveBeenCalledWith(
      jasmine.not.objectContaining({
        invitationCode: jasmine.anything()
      })
    );
  });
});
```

### 4.2 Test di Integrazione

#### Scenari da Testare

1. **Registrazione con codice consulente valido**
   - URL: `https://webapp.onezone.ch/register/CODICE_VALIDO`
   - Compilare form completo
   - Submit
   - Verificare assegnazione consulente nel backend

2. **Registrazione con codice consulente non valido**
   - URL: `https://webapp.onezone.ch/register/CODICE_INVALIDO`
   - Compilare form completo
   - Submit
   - Verificare messaggio di errore appropriato

3. **Registrazione senza codice consulente**
   - URL: `https://webapp.onezone.ch/register`
   - Compilare form completo
   - Submit
   - Verificare registrazione standard senza consulente

4. **Navigazione diretta**
   - Accedere a `/register`
   - Accedere a `/register/CODICE`
   - Verificare che entrambe le rotte funzionino

### 4.3 Test E2E

**Strumento**: Protractor, Cypress o Playwright

**Scenari**:

```typescript
describe('Consultant Code Registration Flow', () => {
  it('should register user with consultant code from URL', () => {
    // 1. Naviga alla pagina con codice
    cy.visit('/register/0852221850d5638e4c80b9da870f942b');

    // 2. Verifica presenza indicatore
    cy.get('.consultant-assigned-banner').should('be.visible');

    // 3. Compila form
    cy.get('input[name="name1"]').type('Mario');
    cy.get('input[name="name2"]').type('Rossi');
    // ... altri campi

    // 4. Submit
    cy.get('button[type="submit"]').click();

    // 5. Verifica successo
    cy.url().should('include', '/policyadd');
  });
});
```

### 4.4 Test Manuali

#### Checklist

- [ ] Accedere a `/register` senza parametri
- [ ] Accedere a `/register/ABC123` con codice consulente
- [ ] Verificare che il codice venga visualizzato nella console (se logging attivo)
- [ ] Compilare form di registrazione completo
- [ ] Verificare che il payload includa `invitationCode`
- [ ] Verificare assegnazione consulente nel backend
- [ ] Testare con codice non valido
- [ ] Testare con codice scaduto (se applicabile)
- [ ] Verificare traduzioni in tutte le lingue (DE, EN, FR, IT)
- [ ] Testare su dispositivi mobile
- [ ] Testare su diversi browser (Chrome, Firefox, Safari, Edge)

---

## 5. Flusso Funzionale Completo

### 5.1 Diagramma di Flusso

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
│  Parametro: consultantCode = XXX            │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  RegisterComponent.ngOnInit()               │
│  - Estrae consultantCode dai params         │
│  - Salva in this.code                       │
│  - (Opzionale) Mostra banner conferma       │
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
│  Utente clicca su "Registrati"              │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  RegisterComponent.submit()                 │
│  - Valida dati                              │
│  - Crea payload con tutti i dati            │
│  - Aggiunge invitationCode: XXX             │
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
┌─────────────┐    ┌─────────────────┐
│   SUCCESS   │    │     ERROR       │
└──────┬──────┘    └────────┬────────┘
       │                    │
       ▼                    ▼
┌─────────────┐    ┌─────────────────┐
│  Backend    │    │  Mostra errore  │
│  assegna    │    │  "Codice non    │
│  consulente │    │   valido"       │
│  all'utente │    └─────────────────┘
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────────────────┐
│  Auto-login dell'utente                     │
└─────────────────┬───────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────┐
│  Redirect a /policyadd                      │
│  (Utente inizia ad aggiungere polizze)      │
└─────────────────────────────────────────────┘
```

---

## 6. Sicurezza

### 6.1 Validazione Codice

#### Frontend
- **Lunghezza**: Validare che il codice sia di lunghezza corretta (es. 32 caratteri per MD5/SHA)
- **Pattern**: Verificare che contenga solo caratteri validi (es. `[a-f0-9]` per hash esadecimale)
- **Sanitizzazione**: Evitare XSS sanitizzando l'input

**Esempio validazione**:
```typescript
private validateConsultantCode(code: string): boolean {
  // Solo caratteri esadecimali, lunghezza 32
  const pattern = /^[a-f0-9]{32}$/;
  return pattern.test(code);
}
```

#### Backend
- **Verifica esistenza**: Controllare che il codice esista nel database
- **Verifica scadenza**: Se applicabile, verificare che non sia scaduto
- **Verifica attività**: Controllare che il consulente sia ancora attivo
- **Rate limiting**: Proteggere da tentativi bruteforce

### 6.2 Privacy

- **Non loggare codici completi**: Nei log, mascherare parzialmente
  ```typescript
  console.log('Codice consulente:', code.substring(0, 8) + '***');
  ```
- **HTTPS obbligatorio**: Assicurarsi che l'app usi sempre HTTPS
- **No cache URL**: Evitare che i codici rimangano nella history del browser

---

## 7. Monitoraggio e Analytics

### 7.1 Metriche da Tracciare

1. **Registrazioni con codice consulente**
   - Numero totale
   - Tasso di conversione per consulente
   - Codici più utilizzati

2. **Errori**
   - Codici non validi utilizzati
   - Codici scaduti
   - Consulenti inattivi

3. **Funnel di conversione**
   - Visite alla pagina `/register/:code`
   - Form compilati
   - Registrazioni completate

### 7.2 Implementazione Google Analytics (esempio)

```typescript
// In RegisterComponent.ngOnInit()
if (params['consultantCode']) {
  this.code = params['consultantCode'];

  // Track evento
  gtag('event', 'consultant_code_detected', {
    'consultant_code': this.code.substring(0, 8), // Mascherato
    'page_path': window.location.pathname
  });
}
```

---

## 8. Documentazione

### 8.1 Documentazione Utente

Creare guida per i consulenti su come:
1. Generare il proprio codice referral
2. Condividere il link con i clienti
3. Tracciare le registrazioni

**Esempio**: [GUIDA_CONSULENTE.md](GUIDA_CONSULENTE.md) (da creare)

### 8.2 Documentazione API

Aggiornare la documentazione API per includere:
- Parametro `invitationCode`
- Formato richiesto
- Codici di errore possibili
- Esempi di request/response

### 8.3 Aggiornamento README

Aggiungere sezione nel README principale:

```markdown
## Registrazione con Codice Consulente

I nuovi utenti possono registrarsi tramite un link personalizzato fornito dal loro consulente:

https://webapp.onezone.ch/register/CODICE_CONSULENTE

L'utente verrà automaticamente assegnato al consulente corrispondente al codice.
```

---

## 9. Rollout e Deployment

### 9.1 Strategia di Rilascio

#### Fase 1: Sviluppo e Test (1-2 settimane)
- [ ] Implementare modifiche frontend
- [ ] Implementare modifiche backend (se necessario)
- [ ] Test unitari
- [ ] Test di integrazione
- [ ] Code review

#### Fase 2: Staging (1 settimana)
- [ ] Deploy su ambiente staging
- [ ] Test E2E completi
- [ ] Test con utenti beta (consulenti selezionati)
- [ ] Raccolta feedback
- [ ] Fix bug eventualmente trovati

#### Fase 3: Produzione (1 settimana)
- [ ] Deploy graduale (feature flag)
- [ ] Monitoraggio metriche
- [ ] Supporto intensivo per primi giorni
- [ ] Abilitazione completa

### 9.2 Feature Flag (Opzionale)

Per un rollout più sicuro, implementare feature flag:

```typescript
// environment.ts
export const environment = {
  production: false,
  features: {
    consultantCodeRegistration: true  // Toggle feature
  }
};

// In RegisterComponent
if (environment.features.consultantCodeRegistration && params['consultantCode']) {
  this.code = params['consultantCode'];
}
```

### 9.3 Rollback Plan

In caso di problemi gravi:

1. **Disabilitare feature flag** (se implementato)
2. **Rimuovere rotta** `/register/:consultantCode` temporaneamente
3. **Mantenere rotta base** `/register` funzionante
4. **Comunicare ai consulenti** di non condividere link temporaneamente

---

## 10. Possibili Estensioni Future

### 10.1 QR Code Generator

Permettere ai consulenti di generare QR code con il proprio link:

```typescript
// Servizio per generare QR code
import QRCode from 'qrcode';

async generateConsultantQRCode(consultantCode: string): Promise<string> {
  const url = `https://webapp.onezone.ch/register/${consultantCode}`;
  return await QRCode.toDataURL(url);
}
```

### 10.2 Link con Parametri Aggiuntivi

Estendere il sistema per tracciare la fonte:

```
https://webapp.onezone.ch/register/ABC123?source=email
https://webapp.onezone.ch/register/ABC123?source=social
https://webapp.onezone.ch/register/ABC123?source=qr
```

### 10.3 Dashboard Consulente

Creare una dashboard dove ogni consulente può:
- Vedere il proprio codice
- Generare link/QR code
- Visualizzare statistiche registrazioni
- Vedere lista clienti assegnati

### 10.4 Codici Temporanei

Implementare codici con scadenza:

```typescript
{
  code: "ABC123",
  consultantId: 42,
  expiresAt: "2026-12-31T23:59:59Z",
  maxUses: 100  // Limite utilizzi
}
```

---

## 11. Checklist Implementazione

### Frontend

- [ ] Modificare [app.routes.ts](src/app/app.routes.ts) - Aggiungere rotta `/register/:consultantCode`
- [ ] Modificare [register.component.ts](src/app/pages/register/register.component.ts) - Cambiare parametro da `code` a `consultantCode`
- [ ] (Opzionale) Aggiungere logging per debug
- [ ] (Opzionale) Aggiungere banner visivo in [register.component.html](src/app/pages/register/register.component.html)
- [ ] Aggiungere gestione errore specifico per codice non valido
- [ ] Aggiungere traduzioni in tutti i file i18n (DE, EN, FR, IT)
- [ ] Scrivere test unitari
- [ ] Scrivere test E2E
- [ ] Code review
- [ ] Aggiornare documentazione tecnica

### Backend

- [ ] Verificare endpoint `/api/v3/user/register` accetta `invitationCode`
- [ ] (Se necessario) Creare tabella `consultant_codes`
- [ ] (Se necessario) Implementare logica assegnazione consulente
- [ ] (Se necessario) Implementare validazione codice
- [ ] Implementare gestione errori appropriata
- [ ] Implementare rate limiting
- [ ] Test API
- [ ] Aggiornare documentazione API

### Testing

- [ ] Test registrazione con codice valido
- [ ] Test registrazione con codice non valido
- [ ] Test registrazione senza codice
- [ ] Test navigazione rotte
- [ ] Test su tutti i browser
- [ ] Test su dispositivi mobile
- [ ] Test traduzioni

### Deployment

- [ ] Build produzione
- [ ] Deploy su staging
- [ ] Test smoke su staging
- [ ] Deploy su produzione
- [ ] Monitoraggio post-deploy
- [ ] Comunicazione ai consulenti

---

## 12. Stima Tempi

| Attività | Tempo Stimato |
|----------|---------------|
| Modifica routes | 15 minuti |
| Modifica component | 30 minuti |
| UI feedback visivo | 1 ora |
| Traduzioni i18n | 30 minuti |
| Test unitari | 2 ore |
| Test E2E | 2 ore |
| Code review | 1 ora |
| Documentazione | 1 ora |
| **Totale Frontend** | **~8 ore** |
| Verifica/Modifica Backend | 4-8 ore (variabile) |
| Test su staging | 2 ore |
| Deploy produzione | 1 ora |
| **TOTALE PROGETTO** | **15-19 ore** |

---

## 13. Rischi e Mitigazioni

| Rischio | Impatto | Probabilità | Mitigazione |
|---------|---------|-------------|-------------|
| Backend non supporta `invitationCode` | Alto | Media | Verificare API prima di iniziare |
| Codici duplicati | Medio | Bassa | Usare hash univoci (UUID, GUID) |
| Codici condivisi pubblicamente | Alto | Media | Implementare scadenza e limiti |
| Conflitto rotte | Basso | Bassa | Ordinare rotte correttamente |
| Problemi cross-browser | Basso | Bassa | Test approfonditi |

---

## 14. Contatti e Responsabili

| Ruolo | Nome | Responsabilità |
|-------|------|----------------|
| Product Owner | [TBD] | Approvazione requisiti |
| Frontend Developer | [TBD] | Implementazione frontend |
| Backend Developer | [TBD] | Verifica/implementazione backend |
| QA Engineer | [TBD] | Testing |
| DevOps | [TBD] | Deploy e monitoraggio |

---

## 15. Riferimenti

- [Documentazione Tecnica OneZone](DOCUMENTAZIONE_TECNICA.md)
- [API BrokerStar - Confluence](https://wmcch.atlassian.net/wiki/spaces/FAQ/)
- [Angular Routing Guide](https://angular.io/guide/router)
- [Angular Route Parameters](https://angular.io/guide/router#route-parameters)

---

## Appendice A: Esempi di Codice Completo

### A.1 app.routes.ts (Completo)

```typescript
export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: '',
    component: LayoutUnauthedComponent,
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'recover', component: RecoverComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'register/:consultantCode', component: RegisterComponent }, // NUOVA
      { path: 'language_unauthed', component: LanguageComponent },
    ],
    canActivate: [isNonAuthenticatedRoute],
  },
  // ... resto delle rotte
];
```

### A.2 register.component.ts - ngOnInit() Modificato

```typescript
public ngOnInit(): void {
  this.route.params.subscribe((params) => {
    // Cattura codice consulente
    if (params['consultantCode']) {
      this.code = params['consultantCode'];

      // Validazione opzionale
      if (!this.validateConsultantCode(this.code)) {
        this.toasterService.warn('Codice consulente non valido');
        this.code = '';
      } else {
        console.log('Codice consulente valido:', this.code.substring(0, 8) + '***');
      }
    }

    // Link per sotto-contatti
    if (params['contactid']) {
      this.link = true;
    }
  });
}

private validateConsultantCode(code: string): boolean {
  // Esempio: hash MD5 (32 caratteri esadecimali)
  const pattern = /^[a-f0-9]{32}$/;
  return pattern.test(code);
}
```

---

**Fine Documento**

---

**Versione**: 1.0
**Ultima Modifica**: 2026-01-28
**Autore**: Piano Tecnico OneZone
**Status**: Ready for Implementation
