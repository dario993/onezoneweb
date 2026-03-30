# Paginazione con Infinite Scroll - Pagina Customers

**Data**: 2026-03-19 16:47
**Componente**: `src/app/pages/customers/`

## Problema

`contactContactList` caricava tutte le pagine API in parallelo (107 chiamate per 10.620 contatti), poi faceva una chiamata `contact(id)` per ogni singolo contatto. La pagina restava bloccata per molti secondi.

## Soluzione

Paginazione server-side con infinite scroll. Si usa direttamente `loadContactPage()` per caricare **una pagina API alla volta**.

### Logica

1. Al primo caricamento, viene richiesta solo **pagina 1** dell'API `/contact`
2. La risposta contiene già tutti i dati necessari (nome, indirizzo, telefono, policyCount, ecc.) → nessuna seconda chiamata
3. Quando l'utente scrolla vicino al fondo (< 200px), viene caricata la pagina successiva
4. Uno spinner in fondo alla lista indica il caricamento della pagina successiva
5. La ricerca resetta la lista e riparte da pagina 1

### Fix CSS layout per abilitare lo scroll

Il layout autenticato (`layouts/authed/authed.component.html`) usava `min-h-screen` sul container esterno. Questo permetteva al container di crescere oltre il viewport, quindi `<main class="flex-1 overflow-y-auto">` non diventava mai scrollabile e l'evento `scroll` non si attivava.

**Fix**: cambiato `min-h-screen` → `h-screen` sul div esterno. Con `h-screen` il container è vincolato a `100vh`, `<main>` ha un'altezza fissa reale e `overflow-y-auto` funziona correttamente.

### File modificati

| File | Modifiche |
|------|-----------|
| `layouts/authed/authed.component.html` | `min-h-screen` → `h-screen` sul container esterno |
| `brokerstar.service.ts` | `loadContactPage` reso pubblico |
| `customers.component.ts` | Riscrittura: paginazione a scroll con una pagina API alla volta, dati mappati direttamente dalla risposta, scroll listener su `<main>` via `ngAfterViewInit` |
| `customers.component.html` | Dati letti direttamente da `customer.*` (non più `customer.data.*`), spinner di caricamento, rimosso skeleton |

### Proprietà chiave nel componente

- `currentPage`: pagina corrente caricata
- `totalPages`: totale pagine (dalla risposta API)
- `isLoadingPage`: flag per evitare chiamate duplicate
- `allPagesLoaded`: true quando tutte le pagine sono state caricate
- `mainElement` + `scrollHandler`: listener scroll su `<main>`, rimosso in `ngOnDestroy`
