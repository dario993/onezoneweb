# Pannello Gestione Consulenti — Tasto nel Menu

**Data:** 2026-05-12 16:24  
**Branch:** feature/wip-mandato

---

## Obiettivo

Aggiungere nel menu (`/menu`) un tasto "Gestione consulenti" visibile **solo** agli account con `contact.id` pari a `58` o `25755`. Gli altri utenti non devono vederlo.

---

## Modifiche ai File

### `src/app/pages/menu/menu.component.ts`

- `authService` rimane `private readonly` (identico a `home.component.ts`).
- Aggiungere una property `public isAdminUser: boolean = false` calcolata nel costruttore leggendo `authService.userData?.contact?.id` e verificando se è `58` o `25755`.

### `src/app/pages/menu/menu.component.html`

- Aggiungere un bottone "Gestione consulenti" nella sezione "Bottom Actions" (sopra o sotto il logout), visibile solo se `isAdminUser === true` tramite `@if`.
- Il bottone naviga verso la rotta `gestione-consulenti` (da definire in futuro; per ora può essere un placeholder).

---

## Logica di Visibilità

```typescript
const contactId = this.authService.userData?.contact?.id;
this.isAdminUser = contactId === 58 || contactId === 25755;
```

Stessa logica usata in `home.component.ts` per leggere `authService.userData?.contact?.id`.

---

## Impatti su Componenti Esistenti

- Nessun impatto su altre pagine o servizi.
- Non viene creata alcuna nuova rotta per ora; il bottone può navigare verso un percorso da definire.

---

## Note

- Il tasto deve seguire lo stile visivo degli altri bottoni presenti nel blocco "Bottom Actions" del menu.
- Il testo del bottone: `Gestione consulenti` (non i18n per ora, visto che è funzionalità admin interna).

---

## Pagina `consultant-automation`

### Rotta

`/consultant-automation` (autenticata, layout authed)

### File da creare/modificare

- `src/app/pages/consultant-automation/consultant-automation.component.ts`
- `src/app/pages/consultant-automation/consultant-automation.component.html`
- `src/app/pages/consultant-automation/consultant-automation.component.scss`
- `src/app/interfaces/automation.interface.ts` — aggiungere `ConsultantItem`
- `src/app/services/automation.service.ts` — aggiungere `getConsultants()`
- `src/app/app.routes.ts` — aggiungere rotta `consultant-automation`

### API

`GET /consultants` autorizzata con `adminHeaders` (Bearer `automationAdminApiKey`).

Risposta:
```json
[
  {
    "id": 0,
    "onezone_id": "string",
    "name": "",
    "surname": "",
    "ecohub_username": "",
    "ecohub_password": "",
    "commission_number": "",
    "login_check": false,
    "disabled_scrapers": [],
    "is_active": true
  }
]
```

### Interfaccia TypeScript

```typescript
export interface ConsultantItem {
  id: number;
  onezone_id: string;
  name: string;
  surname: string;
  ecohub_username: string;
  ecohub_password: string;
  commission_number: string;
  login_check: boolean;
  disabled_scrapers: string[];
  is_active: boolean;
}
```

### Layout Card

```
┌──────────────────────────────────┐
│ Mario Rossi              [Disabled] (solo se is_active=false)
│ ecohub_username: mario@eco.ch
│ commission: 123456         ● (verde login_check=true / rosso false)
└──────────────────────────────────┘
```

- Header pagina: gradient blu come `customers`
- Barra di ricerca: filtra per `name`, `surname`, `ecohub_username`
- Badge `Disabled` in alto a destra (rosso), visibile solo se `is_active === false`
- Indicatore `login_check`: pallino verde se `true`, rosso se `false`, in basso a destra della card
- Click disabilitato per ora (funzione futura)

---

## Modal dettaglio consulente (click su card)

### Layout modal

```
┌─────────────────────────────────────────┐
│ Mario Rossi                  [toggle is_active]
│─────────────────────────────────────────│
│ axa              [toggle ON/OFF]         │
│ Allianz          [toggle ON/OFF]         │
│ Helvetia         [toggle ON/OFF]         │
│ Generali         [toggle ON/OFF]         │
│ Simpego          [toggle ON/OFF]         │
│ Zurich           [toggle ON/OFF]         │
│ Vaudoise         [toggle ON/OFF]         │
│ Automate         [toggle ON/OFF]         │
│ Mobiliar         [toggle ON/OFF]         │
└─────────────────────────────────────────┘
```

### Logica scraper

Lista completa (valori display): `["axa", "Allianz", "Helvetia", "Generali", "Simpego", "Zurich", "Vaudoise", "Automate", "Mobiliar"]`

- Toggle **ON** = assicurazione assente da `disabled_scrapers` (abilitata)
- Toggle **OFF** = assicurazione presente in `disabled_scrapers` (disabilitata)
- Ogni toggle chiama immediatamente `PATCH /consultants/{id}` con il campo `disabled_scrapers` aggiornato
- **Ottimistic update**: il toggle si aggiorna visivamente al click, prima della risposta API; in caso di errore viene ripristinato lo stato precedente

> **IMPORTANTE — Normalizzazione case**: il backend restituisce i valori in `disabled_scrapers` in **lowercase** (es. `"allianz"`, `"helvetia"`). Il confronto deve essere case-insensitive. Al momento del PATCH, i valori vengono normalizzati in lowercase e deduplicati tramite `Set` per evitare duplicati.

### API PATCH

`PATCH /consultants/{consultant_id}` con `adminHeaders`.  
Body: `{ "disabled_scrapers": [...] }` oppure `{ "is_active": bool }` (solo il campo modificato).

### File da modificare

- `automation.interface.ts` — aggiungere `PatchConsultantPayload`
- `automation.service.ts` — aggiungere `patchConsultant(id, payload)`
- `consultant-automation.component.ts` — logica modal, toggle scraper, toggle is_active
- `consultant-automation.component.html` — modal overlay con toggle UI
