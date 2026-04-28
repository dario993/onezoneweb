# Integrazione API e Gestione dello Stato

## Integrazione API

**Endpoint base**: `https://onezone.brokerstar.biz/api/v3`
Configurato in `src/environments/environment.ts`.

**Autenticazione**: Bearer Token JWT, durata 24 ore, nessun refresh automatico.

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Gestione Errori**:
```typescript
.pipe(
  map((data: any): any => data),
  catchError((error: HttpErrorResponse): any => {
    console.log(error);
    return of([]);
  })
)
```

**Operatori RxJS usati**:

| Operatore | Utilizzo |
|-----------|----------|
| `map` | Trasformazione dati |
| `catchError` | Gestione errori |
| `distinctUntilChanged` | Evita duplicati consecutivi |
| `switchMap` | Flatten observable annidati |
| `forkJoin` | Parallellizzazione richieste |
| `firstValueFrom` | Conversione Observable → Promise |

---

## Gestione dello Stato

**Approccio**: Service-Based State Management — nessuna libreria esterna (no Redux/NgRx).

**Stato Globale** (servizi singleton):

| Servizio | Stato |
|----------|-------|
| `AuthService` | Autenticazione, dati utente, token |
| `I18nService` | Lingua corrente, traduzioni |
| `LoaderService` | Stato caricamento globale |
| `StorageService` | Persistenza localStorage |

**Stato Locale**: proprietà del componente, Observable/Subject RxJS, Angular Signals.

**Strategia Cache**:
- Cache-first per dati statici (menu)
- Network-first per dati dinamici (polizze, messaggi)
