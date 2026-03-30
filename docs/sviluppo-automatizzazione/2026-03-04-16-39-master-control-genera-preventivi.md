# MASTER CONTROL — Feature "Genera Preventivi" (Automation)

**Data creazione**: 2026-03-04
**Versione app**: 2.1.9
**Stato**: Implementato (frontend con mock)

---

## Panoramica Generale

Aggiunta di un flusso completo di **generazione preventivi assicurativi auto** per i consulenti OneZone.
Il consulente, dopo il login, vedrà un bottone **"Genera Preventivi"** nella Home (visibile solo se `userData.login.isSharer` è true).
Il bottone avvia un flusso condizionale:

```
[Clicca "Genera Preventivi"]
         │
         ▼
  API check_login (server-automation)
         │
    ┌────┴────┐
   true      false
    │          │
    ▼          ▼
  /automation-form   /automation-setup
  (form preventivo)  (wizard 3 step EcoHub)
```

Dopo il setup completato con successo → apertura automatica di `/automation-form`.

---

## Modalità Mock (Sviluppo Frontend)

> **IMPORTANTE**: Tutte le chiamate API verso `server-automation` devono essere intercettate in modalità mock durante lo sviluppo frontend. Il server reale NON deve essere interrogato.

- Flag di controllo: `environment.useMockApi = true` (in `environment.ts`)
- Il servizio `AutomationService` rileva il flag e restituisce dati simulati con delay di 1500ms
- Dettagli in → [`05-mock-api.md`](./05-mock-api.md)

---

## Sotto-Documenti

| # | File | Contenuto | Stato |
|---|------|-----------|-------|
| 1 | [`01-architettura-e-routing.md`](./01-architettura-e-routing.md) | Nuove rotte Angular, bottone Home, guard di navigazione | ✅ Completato |
| 2 | [`02-automation-service.md`](./02-automation-service.md) | `AutomationService`: API calls, interfacce, modalità mock | ✅ Completato |
| 3 | [`03-wizard-setup-ecohub.md`](./03-wizard-setup-ecohub.md) | Componente wizard 3-step per configurazione EcoHub + 2FA | ✅ Completato |
| 4 | [`04-form-preventivi.md`](./04-form-preventivi.md) | Form complesso generazione preventivi (basato su schemas.py) | ✅ Completato |
| 5 | [`05-mock-api.md`](./05-mock-api.md) | Configurazione modalità mock, risposte simulate, test errori | ✅ Completato |
| 6 | [`06-environment-e-token.md`](./06-environment-e-token.md) | Aggiornamento environment.ts, token API, variabili produzione | ✅ Completato |

---

## File da Creare/Modificare nel Progetto

| File | Azione | Sotto-doc |
|------|--------|-----------|
| `src/app/app.routes.ts` | Aggiungere rotte `/automation-setup` e `/automation-form` | 01 |
| `src/app/pages/home/home.component.html` | Aggiunto bottone "Genera Preventivi" (solo consulenti) + bottoni DEV | 01 |
| `src/app/pages/home/home.component.ts` | Logica click bottone + navigazione condizionale via `isSharer` | 01 |
| `src/app/services/automation.service.ts` | **NUOVO** — Servizio API automation con mock | 02 |
| `src/app/interfaces/automation.interface.ts` | **NUOVO** — Interfacce TypeScript (payload e risposte) | 02 |
| `src/app/pages/automation-setup/` | **NUOVA** cartella + componente wizard 3-step | 03 |
| `src/app/pages/automation-form/` | **NUOVA** cartella + componente form reattivo 5 sezioni | 04 |
| `src/environments/environment.ts` | Aggiunti campi automation + `useMockApi: true` | 06 |
| `src/environments/environment.prod.ts` | Aggiunti campi automation + `useMockApi: false` | 06 |
| `src/assets/i18n/it.json` | Aggiunta sezione `automation` | 01 |
| `src/assets/i18n/de.json` | Aggiunta sezione `automation` | 01 |

---

## Dipendenze tra Sotto-Lavori

```
06-environment  ──►  02-automation-service
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        01-routing   03-wizard-setup  04-form-preventivi
                           │
                           └──► (apre automaticamente) 04-form-preventivi
```

## Sequenza di Implementazione Consigliata

1. **`06-environment-e-token.md`** — Prima di tutto, aggiornare l'environment con i nuovi campi
2. **`02-automation-service.md`** — Creare il servizio con mock attivo
3. **`05-mock-api.md`** — Verificare che il mock funzioni correttamente
4. **`01-architettura-e-routing.md`** — Aggiungere rotte e bottone consulente
5. **`03-wizard-setup-ecohub.md`** — Implementare il wizard di setup
6. **`04-form-preventivi.md`** — Implementare il form preventivi

---

## API Server-Automation (Riepilogo)

Base URL: `https://server-automation.example.com/api` (da configurare in environment)

Autenticazione: `Authorization: Bearer <AUTOMATION_API_TOKEN>`

| Endpoint | Metodo | Descrizione | Body | Risposta |
|----------|--------|-------------|------|----------|
| `/check_login` | POST | Verifica se il consulente ha già configurato EcoHub | `{consultant_id}` | `{logged_in: boolean}` |
| `/extract_totp` | POST | Estrae il TOTP dal QR code incollato | `{qr_image_base64}` | `{totp: string}` |
| `/setup` | POST | Invia credenziali EcoHub + TOTP per configurazione | `{...EcoHubSetupPayload}` | `{success: boolean}` |
| `/quote_request` | POST | Invia richiesta preventivo compilata | `{consultant_id, ...QuoteFormPayload}` | HTTP 200 / errore |

---

## Database Server-Automation (Riferimento)

### Tabella `consulente`
| Campo | Tipo | Note |
|-------|------|------|
| `id` | INT PK | |
| `nome` | VARCHAR | |
| `cognome` | VARCHAR | |
| `id_one_zone` | VARCHAR | ID consulente da OneZone |
| `username_eh` | VARCHAR | Username EcoHub |
| `password_eh` | VARCHAR ENCRYPTED | Password EcoHub |
| `totp_eh` | VARCHAR | Secret TOTP per 2FA |
| `login_check_eh` | BOOLEAN | `true` se configurazione validata |

### Tabella `offerta`
| Campo | Tipo | Note |
|-------|------|------|
| `id` | INT PK | |
| `consulente_id` | FK → consulente | |
| `created_at` | DATETIME | |
| `form_data` | JSON | Tutti i campi del form preventivo |
| `status` | ENUM | pending/processing/sent/error |

---

## Checklist Implementazione

- [x] Aggiornare environment.ts/prod.ts
- [x] Creare `AutomationService` con mock
- [x] Testare mock API
- [x] Aggiungere bottone nella Home (visibile solo a consulenti via `isSharer`)
- [x] Aggiungere rotte in app.routes.ts
- [x] Creare componente `AutomationSetupComponent` (wizard)
- [x] Creare componente `AutomationFormComponent` (form reattivo 5 sezioni)
- [x] Creare interfacce TypeScript (`automation.interface.ts`)
- [x] Aggiungere traduzioni it.json e de.json
- [x] Aggiungere bottoni [DEV] per accesso diretto in mock mode
- [ ] Testare wizard con mock (step 1, 2, 3)
- [ ] Testare form con mock submit
- [ ] Testare flusso completo: login consulente → check_login false → wizard → form → submit
- [ ] Testare flusso: check_login true → form direttamente
- [ ] Aggiungere traduzioni en.json e fr.json
- [ ] Configurare URL e token reali per produzione
