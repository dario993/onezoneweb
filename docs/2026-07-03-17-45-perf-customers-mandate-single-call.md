# Perf customers-mandate: unica chiamata API con enrich integrato (limit=30)

## Contesto

Test live con tracer Chrome DevTools (03/07/2026, utente `bio@casamici.ch`, cache pulita):

| # | Chiamata | Durata |
|---|----------|--------|
| 1 | `GET /contact?page=1&filters[show_contacts]=2&limit=15` (base) | 46,2 s |
| 2 | `GET /contact?page=1&filters[show_contacts]=2&limit=50&add[has_mandate_file]=true&add[policy_count]=true&add[sub_contact_count]=true` (enrich) | 14,0 s |
| 3 | `GET /contact?page=2 limit=15` (base) | 18,7 s |
| 4 | `GET /contact?page=2 limit=50 add[…]` (enrich) | 12,6 s |

Il pattern attuale "mostra prima la base rapida, poi arricchisci" **non porta alcun beneficio percepito** perché la chiamata base è più lenta dell'enrich in tutti i casi osservati. Inoltre `enrich` è chiamato con `limit=50` mentre `base` con `limit=15` → il backend serializza 35 record inutili per ogni pagina.

## Obiettivo

Eliminare la doppia chiamata per pagina: una sola `GET /contact` con `add[has_mandate_file]`, `add[policy_count]`, `add[sub_contact_count]` e `limit=30`. Guadagno atteso: **~50 % dei roundtrip in meno**, coerenza dei dati, codice più semplice, meno lavoro backend (una sola query enrichita per pagina anziché due).

Scelta di `limit=30`: raddoppia i record per pagina (paginazione più lunga, meno "scroll-fetch" ravvicinati) mantenendo il payload gestibile.

## Modifiche

**File: `src/app/pages/customers-mandate/customers-mandate.component.ts`**

1. Rimuovere `baseParams` e `enrichParams` separati, sostituirli con un unico `pageParams`:
   ```ts
   private readonly pageParams: Record<string, any> = {
     'filters[show_contacts]': 2,
     limit: 30,
     'add[has_mandate_file]': true,
     'add[policy_count]': true,
     'add[sub_contact_count]': true,
   };
   ```
2. Eliminare il metodo `enrichPage(...)` e la chiamata in coda a `loadNextPage`.
3. In `loadNextPage`, mappare direttamente `hasMandateFile`, `policyCount`, `subContactCount` dalla response (già presenti nella singola chiamata unificata) e rimuovere i flag `enriched: false` / `enriched: true` dal modello locale.
4. Scrittura in `sessionStorage` dei dati completi già nella prima subscribe (dato che ora una sola call è tutto).
5. Cache stale-while-revalidate: quando si legge cache, non fare più il secondo fetch di "revalidate" con parametri enrich (già inclusi), ma un semplice re-fetch della stessa `pageParams` in background (comportamento identico a oggi ma con una sola call).

**File: `src/app/pages/customers-mandate/customers-mandate.component.html`**

- Rimuovere eventuali branch condizionali su `customer.enriched` (se presenti nel template si mostrano scheletri/placeholder in attesa). Da verificare.

## Impatti

- Nessuna modifica al backend.
- La lista appare in ~14–20 s invece che dopo ~60 s (base + enrich sequenziali) nel caso cold, e in ~1 s dalla cache.
- `totalPages` viene calcolato dal backend su `limit=30`, quindi il numero di pagine si dimezza.
- La struttura della cache resta compatibile: `CACHE_KEY = 'customers-mandate-cache'` (invariato). Il campo `enriched` non è più presente nei record; le vecchie entry con `enriched:false` vengono comunque sovrascritte al primo revalidate.

## Follow-up (stessa sessione)

**Autoload pagina 2 bloccato al primo scroll utente**
`customers-mandate.component.ts`: aggiunto flag `userHasScrolled = false`. `onMainScroll` imposta il flag a `true`, e il trigger di `loadNextPage` avviene solo se `userHasScrolled === true`. Su `resetAndLoad` il flag viene resettato. Evita che la pagina 2 parta subito solo perché la prima lista è corta e la viewport è già "in fondo".

**Rimosso `distinctUntilChanged` inutile in `loadContactPage`**
`brokerstar.service.ts`: rimosso `distinctUntilChanged((prev, curr) => prev.length === curr.length)` da `loadContactPage`. L'Observable è un HTTP GET che emette una singola volta e la response è un oggetto (non un array), quindi il confronto `prev.length === curr.length` confronta `undefined === undefined` senza effetto.

## Verifica

1. Cold load (cache pulita) → una sola chiamata `limit=30 add[…]` per pagina, durata ≤ tempo dell'attuale enrich.
2. Warm load (cache presente) → lista appare istantanea, revalidate silenziosa una sola call.
3. Ricerca (`q` non vuoto) → una sola call, nessuna cache.
4. Scroll → carica pagina successiva con una sola call.
5. Colonne `hasMandateFile`, `policyCount`, `subContactCount` sono popolate al primo render (non c'è più il "flash" a zero).
