# Rotta pubblica `/automation-form-generic-client`

**Data:** 2026-06-11 18:26
**Branch:** `feature/wip-mandato`

## Obiettivo

Esporre lo **stesso form** di `automation-form` su una rotta pubblica (senza login) raggiungibile da `/automation-form-generic-client`, in modo che un cliente generico possa compilare la richiesta di preventivi auto senza dover essere un consulente loggato.

## Accortezze richieste dall'utente

1. Accesso **pubblico** (senza autenticazione), dentro `LayoutUnauthed`.
2. Form **identico** a quello attuale — cambia solo la rotta/l'accesso.
3. Il campo `recipient_email` (oggi nascosto e popolato da `consultantData.ecohub_username`) deve essere **visibile e compilato dall'utente** nel form.
4. Per il submit a `/generate-quotes` viene usato un **consulente di default fisso** la cui `apiKey` è la stringa `valeman`, definita in `environment.ts` ed `environment.prod.ts`.

## Approccio

**Riuso dello stesso `AutomationFormComponent`** con un flag `publicMode` ricavato dalla `data` della rotta. Nessuna duplicazione di file → manutenzione singola, il form resta sincronizzato con la versione autenticata.

## Modifiche ai file

### 1. `src/app/app.routes.ts`
Nuova entry nella sezione `LayoutUnauthed` (con guard `isNonAuthenticatedRoute`):
```ts
{ path: 'automation-form-generic-client', component: AutomationFormComponent, data: { publicMode: true } }
```

### 2. `src/environments/environment.ts` e `src/environments/environment.prod.ts`
Nuova costante:
```ts
genericClientConsultantApiKey: 'valeman'
```

### 3. `src/app/pages/automation-form/automation-form.component.ts`
Aggiungere `publicMode: boolean` letto in `ngOnInit` da `ActivatedRoute.snapshot.data['publicMode']`. Branching chirurgico in 4 punti:
- `computeAvailableScrapers()`: in `publicMode` ignora `consultantDisabledScrapers` (mostra tutti gli scrapers di `environment.automationScrapers`).
- `resolveRecipientEmail()`: in `publicMode` restituisce **solo** il valore del campo form `recipient_email`.
- Validazione di `recipient_email` (FormBuilder): in `publicMode` applica `[Validators.required, Validators.email]`.
- `fillTestData()` (dev-only): valorizza anche `recipient_email` quando `publicMode`.
- Submit: passa flag `usePublicConsultant` ad `AutomationService.submitQuoteRequest`.

### 4. `src/app/services/automation.service.ts`
`submitQuoteRequest` accetta un parametro/flag `usePublicConsultant`; quando attivo, usa `environment.genericClientConsultantApiKey` per costruire l'header consulente al posto di leggere `consultantApiKey` da `StorageService`.

### 5. `src/app/pages/automation-form/automation-form.component.html`
Mostra l'input `recipient_email` (label, placeholder, validation message) **solo se `publicMode`**, posizionato nel blocco dati personali/contatto.

### 6. `src/assets/i18n/{it,en,de,fr}.json`
4 chiavi nuove sotto `automation_form`:
- `recipient_email_label`
- `recipient_email_placeholder`
- `recipient_email_required`
- `recipient_email_invalid`

## Impatti

- **Rotta esistente `/automation-form`**: **nessun cambio funzionale** (publicMode resta `false`, comportamento identico a prima).
- **`AutomationService`**: estensione retro-compatibile (flag opzionale, default `false`).
- **Layout**: `LayoutUnauthed` già adatto (loader + footer, nessuna UI di login mescolata).

## Verifica

1. `npm start` → `http://localhost:4200/automation-form-generic-client` accessibile senza login.
2. Se loggato e si visita la stessa URL → redirect a `/home` (coerente con altre rotte pubbliche).
3. Campo `recipient_email` visibile, required, validato come email.
4. Dev mode: `fillTestData` popola anche `recipient_email`.
5. Submit → POST `/generate-quotes` con header consulente derivato da `valeman` e `recipient_email` dal form.
6. `/automation-form` (loggati) invariato.
