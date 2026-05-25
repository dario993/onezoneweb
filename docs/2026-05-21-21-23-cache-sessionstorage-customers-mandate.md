# Cache SessionStorage con Stale-While-Revalidate — customers e customers-mandate

## Obiettivo

Aggiungere two-phase loading e cache in `sessionStorage` alle pagine `customers` e `customers-mandate` per rendere istantanea la visualizzazione della lista su visite successive, mantenendo i dati sempre aggiornati in background.

## Contesto

Entrambe le pagine chiamano `/api/v3/contact` con parametri `add[]` costosi che causano ~15 secondi di attesa:
- `add[has_mandate_file]=true`
- `add[policy_count]=true`
- `add[sub_contact_count]=true`

## Soluzione: Two-Phase Loading + Stale-While-Revalidate

### Fase 1 — Chiamata base (veloce)
Carica i contatti senza `add[]` → lista appare subito. Badge e conteggi nascosti nel template finché `enriched` è false.

### Fase 2 — Enrich in background
Chiamata con `add[]` in parallelo → quando arriva, aggiorna badge (`hasMandateFile`), conteggi (`policyCount`, `subContactCount`) e salva in cache.

### Cache sessionStorage
1. Se cache valida (< 5 min) → mostra dati cached immediatamente, lancia enrich in background per aggiornare
2. Se cache assente o scaduta → two-phase loading normale, poi scrivi cache al termine dell'enrich
3. Con ricerca attiva (`q` non vuoto) → cache ignorata in lettura e scrittura

## Struttura Cache

| Pagina | Chiave sessionStorage |
|--------|-----------------------|
| customers | `customers-cache` |
| customers-mandate | `customers-mandate-cache` |

```json
{
  "timestamp": 1716323021000,
  "totalPages": 5,
  "pages": {
    "1": [{ "id": 123, "enriched": true, "hasMandateFile": true, ... }]
  }
}
```

## TTL

**5 minuti** (300.000 ms).

## Limit per pagina

**15 record** per chiamata (paginazione con infinite scroll).

## Invalidazione Cache

La cache viene svuotata al **logout** tramite `endSession()` → `this.storageService?.clear()`.  
`StorageService.clear()` è stato aggiornato per pulire sia `localStorage` che `sessionStorage`.

## File Modificati

- `src/app/pages/customers/customers.component.ts` — two-phase loading + cache
- `src/app/pages/customers/customers.component.html` — badge e conteggi condizionali su `enriched`
- `src/app/pages/customers-mandate/customers-mandate.component.ts` — two-phase loading + cache
- `src/app/pages/customers-mandate/customers-mandate.component.html` — badge e conteggi condizionali su `enriched`
- `src/app/services/storage.service.ts` — `clear()` ora pulisce anche `sessionStorage`

## Impatto

- Prima visita: two-phase loading (lista veloce, badge/conteggi in ritardo)
- Visite successive nella stessa sessione (< 5 min): lista **istantanea**, badge/conteggi già presenti
- Logout: cache invalidata
- Ricerca attiva: comportamento normale, nessuna cache
