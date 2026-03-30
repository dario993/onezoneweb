# Autenticazione a 2 Livelli — AutomationService

**Data creazione**: 2026-03-09 17:38
**Stato**: Implementato

---

## Obiettivo

Cambiare il modello di autenticazione dell'AutomationService da un singolo token globale (`automationApiToken`) a un sistema a 2 livelli come richiesto dal backend:

- **ADMIN_API_KEY**: per gestione consulenti (registrazione, verifica login, aggiornamento credenziali, sessioni)
- **Consultant api_key**: generata alla registrazione del consulente, usata per `POST /generate-quotes`
- **Nessuna auth**: per `POST /extract-totp-secret` (endpoint pubblico)

---

## Stato Attuale

- `environment.ts` ha un singolo campo `automationApiToken` usato per TUTTE le chiamate
- `AutomationService` crea un unico header `Authorization: Bearer ${this.token}` identico per ogni endpoint
- Non esiste un flusso di registrazione consulente (`POST /consultants`)
- Non viene salvata/gestita nessuna `api_key` per consulente

---

## Modifiche Previste

### 1. `src/environments/environment.ts` e `environment.prod.ts`

- Rinominare `automationApiToken` → `automationAdminApiKey`
- Questo token viene usato SOLO per endpoint admin

**Prima**:
```typescript
automationApiToken: "MOCK_TOKEN_DEV_12345",
```

**Dopo**:
```typescript
automationAdminApiKey: "MOCK_ADMIN_KEY_DEV_12345",
```

### 2. `src/app/interfaces/automation.interface.ts`

Aggiungere nuove interfacce:

```typescript
// Registrazione consulente
export interface ConsultantRegistrationPayload {
  onezone_id: string;
  name?: string;
  surname?: string;
  ecohub_username?: string;
  ecohub_password?: string;
  ecohub_totp_secret?: string;
}

export interface ConsultantRegistrationResponse {
  status: string;          // "created"
  onezone_id: string;
  api_key: string;         // CRITICO: va salvato in modo sicuro
}

// Aggiornamento credenziali (risposta reale)
export interface CredentialsUpdateResponse {
  status: string;          // "updated"
  onezone_id: string;
}
```

### 3. `src/app/services/automation.service.ts`

Cambiamenti principali:

#### a) Sostituire il singolo token con admin key
```typescript
private adminApiKey = environment.automationAdminApiKey;
```

#### b) Creare header differenziati
```typescript
// Per endpoint admin (checkLogin, setupEcoHub, registerConsultant)
private get adminHeaders(): HttpHeaders { ... Bearer ${this.adminApiKey} ... }

// Per endpoint consulente (submitQuoteRequest) — usa la api_key dal StorageService
private get consultantHeaders(): HttpHeaders { ... Bearer ${consultantApiKey} ... }

// Per endpoint pubblici (extractTotp) — nessun Authorization
private get publicHeaders(): HttpHeaders { ... solo Content-Type/Accept ... }
```

#### c) Aggiungere `registerConsultant()` — POST /consultants
- Usa `adminHeaders`
- Prende `ConsultantRegistrationPayload`
- Restituisce `ConsultantRegistrationResponse`
- Salva la `api_key` nel `StorageService`

#### d) Modificare `extractTotp()` — rimuovere Authorization header
- `POST /extract-totp-secret` è un endpoint pubblico, non serve auth

#### e) Modificare `submitQuoteRequest()` — usare consultant api_key
- Leggere la `api_key` dal `StorageService`
- Usarla come Bearer token al posto dell'admin key
- Se mancante, lanciare errore (consulente non registrato)

#### f) `checkLogin()` e `setupEcoHub()` — usare adminHeaders
- Continuano a usare l'admin key (come prima, ma con il nome aggiornato)

### 4. `src/app/services/storage.service.ts`

- Nessuna modifica strutturale necessaria
- Si usa `setItem('consultantApiKey', apiKey)` / `getItem('consultantApiKey')`

### 5. `src/app/pages/automation-setup/automation-setup.component.ts`

Modificare `onSubmit()` per il flusso a 2 step:

1. **Registrare il consulente** → `automationService.registerConsultant(...)` → salva `api_key`
2. **Aggiornare le credenziali** → `automationService.setupEcoHub(...)` (come prima, solo credenziali EcoHub)

Se la registrazione restituisce 409 (già registrato), proseguire direttamente con l'aggiornamento credenziali.

### 6. `src/app/pages/automation-form/automation-form.component.ts`

Modificare `onSubmit()`:
- Rimuovere `consultant_id` dal payload (l'autenticazione avviene via Bearer token del consulente)
- Il payload diventa solo i dati del form, senza `consultant_id`

### 7. `src/app/pages/home/home.component.ts`

`onGeneraPreventivi()` — nessuna modifica necessaria (checkLogin usa adminHeaders, la firma del metodo non cambia)

---

## Mock API

I mock restano funzionanti:
- `registerConsultant()` mock: restituisce `{ status: 'created', onezone_id: '...', api_key: 'MOCK_CONSULTANT_KEY' }`
- `extractTotp()` mock: invariato
- `submitQuoteRequest()` mock: invariato (ignora l'header)

---

## Flusso Aggiornato

```
1. Home → "Genera Preventivi"
   ↓
2. checkLogin(consultantId) [ADMIN_API_KEY]
   ↓
3a. Se NON verificato → AutomationSetup
   ↓
4. Setup wizard (credenziali EcoHub + TOTP)
   ↓
5. onSubmit():
   a. registerConsultant({onezone_id, name, ...}) [ADMIN_API_KEY]
      → riceve api_key → salva in StorageService
      → se 409, ignora (già registrato)
   b. setupEcoHub({ecohub_username, ecohub_password, ecohub_totp_secret}) [ADMIN_API_KEY]
   ↓
6. Redirect → AutomationForm
   ↓
7. submitQuoteRequest(formData) [CONSULTANT_API_KEY]
```

---

## File da Modificare (riepilogo)

| File | Tipo modifica |
|------|--------------|
| `src/environments/environment.ts` | Rinomina campo |
| `src/environments/environment.prod.ts` | Rinomina campo |
| `src/app/interfaces/automation.interface.ts` | Aggiunge interfacce |
| `src/app/services/automation.service.ts` | Refactor auth + nuovo metodo |
| `src/app/pages/automation-setup/automation-setup.component.ts` | Aggiunge step registrazione |
| `src/app/pages/automation-form/automation-form.component.ts` | Rimuove consultant_id dal payload |

---

## Cosa NON cambia (fuori scope)

- Il formato multipart per extract-totp-secret (punto 4 separato)
- Il polling asincrono delle quote (punto 5/6 separato)
- Le interfacce di risposta CheckLoginResponse/ExtractTotpResponse (saranno allineate in task separati)
- I file di traduzione
- La gestione errore 429
