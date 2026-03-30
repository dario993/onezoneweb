# 06 — Environment e Token API

**Stato**: ✅ Completato
**File modificati**:
- `src/environments/environment.ts`
- `src/environments/environment.prod.ts`

---

## `src/environments/environment.ts` (sviluppo)

```typescript
export const environment = {
  production: false,
  apiEndpoint: "https://onezone.brokerstar.biz/api/v3",

  // --- Automation Server ---
  automationApiEndpoint: "https://server-automation.example.com/api",
  automationApiToken: "MOCK_TOKEN_DEV_12345",
  useMockApi: true   // Mock attivo in sviluppo: nessuna chiamata reale
};
```

---

## `src/environments/environment.prod.ts` (produzione)

```typescript
export const environment = {
  production: true,
  apiEndpoint: "https://onezone.brokerstar.biz/api/v3",

  // --- Automation Server ---
  automationApiEndpoint: "https://server-automation.example.com/api",  // ← sostituire con URL reale
  automationApiToken: "PROD_TOKEN_DA_CONFIGURARE",                      // ← sostituire con token reale
  useMockApi: false  // Mai mock in produzione
};
```

> **IMPORTANTE**: I valori `automationApiEndpoint` e `automationApiToken` in produzione devono essere forniti dal team backend prima del deploy.

---

## Aggiornamento TypeScript Interface dell'Environment

Se il progetto usa un'interfaccia per l'environment (es. `src/environments/environment.interface.ts`), aggiungerla:

```typescript
export interface Environment {
  production: boolean;
  apiEndpoint: string;
  automationApiEndpoint: string;
  automationApiToken: string;
  useMockApi: boolean;
}
```

---

## Uso nel Servizio

In `automation.service.ts`:

```typescript
import { environment } from '../../environments/environment';

// Nel corpo del servizio:
private baseUrl = environment.automationApiEndpoint;
private token   = environment.automationApiToken;

// Guard mock:
if (environment.useMockApi) {
  return of(mockResponse).pipe(delay(1500));
}
```

---

## Sicurezza del Token

- Il token `automationApiToken` deve essere **segreto** — non committarlo mai in chiaro nel repository se è un token di produzione
- Per sviluppo, il token mock `MOCK_TOKEN_DEV_12345` non ha importanza (il server non viene interrogato)
- In produzione, considerare l'uso di variabili d'ambiente CI/CD per iniettare il token al momento del build:
  ```bash
  # Esempio sostituzione durante CI
  sed -i "s/PROD_TOKEN_DA_CONFIGURARE/${AUTOMATION_API_TOKEN}/g" src/environments/environment.prod.ts
  ```

---

## Checklist Prima del Deploy in Produzione

- [ ] `useMockApi: false` in `environment.prod.ts`
- [ ] `automationApiEndpoint` aggiornato con URL reale
- [ ] `automationApiToken` aggiornato con token reale
- [ ] CORS configurato sul server automation per accettare richieste dal dominio OneZone
- [ ] Il token di produzione NON è stato committato nel repository
