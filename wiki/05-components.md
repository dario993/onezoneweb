# Componenti e Pagine

## Layouts

| Componente | Path | Descrizione |
|-----------|------|-------------|
| `LayoutAuthedComponent` | `layouts/authed/` | Header, nav, sidebar, footer — per utenti autenticati |
| `LayoutUnauthedComponent` | `layouts/unauthed/` | Logo + contenuto centrale — login, register, recover |
| `LayoutPDFComponent` | `layouts/pdf/` | Schermo intero per visualizzazione PDF |

---

## Pagine

### LoginComponent
**Rotta**: `/login`
Form login (email, password), gestione errori (credenziali errate, 2FA), link a register e recover.

---

### RegisterComponent
**Rotta**: `/register`, `/register/:consultantCode`, `/link/:contactid`

Registrazione cliente (persona fisica o azienda). Campi: nome, cognome, email, data nascita, telefono, password.

**Assegnazione consulente**: il parametro `:consultantCode` viene inviato come `invitationCode` all'API `POST /api/v3/user/register`, che assegna automaticamente l'intermediario. Il link "Registrati" in login punta a `/register/0852221850d5638e4c80b9da870f942b`.

**Errori API**: campi `violations` evidenziano i singoli input; errori generici mostrati via `toasterService.alert()`.

---

### HomeComponent
**Rotta**: `/home`
Dashboard: widget polizze attive, messaggi, offerte. Benvenuto personalizzato.

---

### PoliciesComponent
**Rotta**: `/policies`, `/policies/:clientid`
Lista polizze con filtro per cliente, ricerca e ordinamento. Click → `/policy/:policyid`.

---

### PolicyComponent
**Rotta**: `/policy/:policyid`
Dettagli polizza, documenti allegati, fatture premi. Azioni: sinistro, download, modifica.

---

### PolicyAddComponent
**Rotta**: `/policyadd`
Form per aggiungere nuova polizza, selezione compagnia, caricamento documenti.

---

### PolicySelectComponent
**Rotta**: `/policy-select`
Selezione polizza per operazioni specifiche.

---

### PolicyCalculateComponent
**Rotta**: `/compare`
Confronto polizze, calcolo premi, comparazione offerte.

---

### CustomersComponent
**Rotta**: `/customers`
Lista clienti (per consulenti), ricerca, filtri, aggiunta nuovi clienti.

---

### ConsultantComponent
**Rotta**: `/consultant`, `/consultant/:policyid`
Chat con consulente, messaggi, allegati e documenti.

---

### OffersComponent
**Rotta**: `/offer`, `/offer/:offerid`
Visualizzazione offerte (tender), confronto, accetta/rifiuta (`tenderOfferAccept`, `tenderOfferReject`).

---

### ReportComponent
**Rotta**: `/report/:policyid`
Generazione report PDF via `createJasperreport()`.

---

### AgreementComponent
**Rotta**: `/agreement`
Gestione mandati, notifica assicurazioni, firma elettronica.

---

### FileComponent
**Rotta**: `/file/:fileid`, `/jasper/:reportName/:contactId`
Visualizzazione e download file/documenti PDF in-app.

---

### ProfileComponent
**Rotta**: `/profile`
Dati profilo, modifica informazioni, cambio password, upload avatar.

---

### MenuComponent
**Rotta**: `/menu`
Menu di navigazione, link a tutte le sezioni, logout.

---

### LanguageComponent
**Rotta**: `/language`, `/language_unauthed`
Selezione lingua (DE, EN, FR, IT), salva in localStorage.

---

### RecoverComponent
**Rotta**: `/recover`
Recupero password: `resetPassword()` per richiesta, `confirmResetPassword()` per conferma con token.
