# customers-mandate: refactor cache in `Map<page, records>` + rebuild

## Contesto

La revalidate stale-while-revalidate attualmente fa merge in-place per id (`customers-mandate.component.ts:266-274`):
```ts
const byId = new Map<any, any>(newCustomers.map((c: any) => [c.id, c]));
this.customers = this.customers.map((c) => {
  const fresh = byId.get(c.id);
  return fresh ? { ...c, ...fresh } : c;
});
```

Aggiorna solo i record già presenti in cache locale. Non gestisce:
- record aggiunti sul backend che non sono in cache
- record rimossi sul backend che restano visibili in UI
- riordino della pagina lato backend

## Obiettivo

Adottare l'approccio "pagine come Map, lista derivata": conservare le pagine caricate in una struttura `Map<number, any[]>` e ricalcolare `this.customers` come concatenazione ordinata a ogni update. Il rimpiazzo dell'intera pagina X gestisce in modo dichiarativo insert/delete/reorder senza logiche di diff esplicite.

## Modifiche

**File: `src/app/pages/customers-mandate/customers-mandate.component.ts`**

1. Aggiungere campo privato:
   ```ts
   private pagesData: Map<number, any[]> = new Map();
   ```

2. Nuovo metodo `rebuildCustomers()` che ricostruisce `this.customers` come concatenazione di `pagesData.get(1)...pagesData.get(currentPage)`.

3. In `fetchPage`, ramo `showLoader=true` (prima load / scroll):
   - `pagesData.set(page, newCustomers)` invece di `this.customers = [...this.customers, ...newCustomers]`
   - chiamare `rebuildCustomers()`

4. In `fetchPage`, ramo `showLoader=false` (revalidate):
   - `pagesData.set(page, newCustomers)` (sostituzione intera della pagina)
   - chiamare `rebuildCustomers()`
   - rimosso il merge `byId`

5. In `loadNextPage`, ramo cache hit:
   - `pagesData.set(nextPage, cachedPage)` invece di push su `this.customers`
   - `rebuildCustomers()`

6. In `resetAndLoad`:
   - `this.pagesData.clear()` insieme al reset di `this.customers = []`

7. `writeCachePage` invariata (già salva la pagina intera).

8. Semplificare `saveToCache` in fetchPage: passare direttamente `newCustomers` a `writeCachePage` (non serve più il filter O(N²) su `this.customers`).

## Impatti

- Rimozione del limite: insert/delete/reorder backend vengono riflessi al primo revalidate della pagina interessata.
- Nessuna modifica al backend.
- Nessuna modifica al template HTML.
- Chiavi cache invariate: `customers-mandate-cache`. La struttura persistente non cambia (era già `pages: Record<number, any[]>`).
- Comportamento auth-user reorder in cima al `page===1`: preservato (agisce su `newCustomers` prima di scriverlo in `pagesData`).

## Verifica

1. Cold load: appare pagina 1 con 30 record, `pagesData.size === 1`.
2. Scroll → pagina 2: `pagesData.size === 2`, `this.customers.length === 60`.
3. Warm load da cache: `pagesData` popolata dalla cache, poi revalidate sostituisce le entry.
4. Aggiunta contatto da `customers-mandate-add` → cache invalidata → cold load mostra il nuovo record.
5. Simulazione: modifica manuale del backend (o mock) di un record in pagina 1 → dopo revalidate il record aggiornato è visibile senza reload.
