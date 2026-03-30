# 02 — AutomationService

**Stato**: ✅ Completato
**File creati**: `src/app/services/automation.service.ts`, `src/app/interfaces/automation.interface.ts`
**Dipendenze**: `06-environment-e-token.md`
**Ultimo aggiornamento**: 2026-03-09 — Riallineamento endpoint ai veri URL del backend

> **Nota implementazione**: L'interfaccia `ElectricVehiclePayload` è stata rimossa. I campi electric vehicle sono flat direttamente in `QuoteRequestPayload` (`electric_vehicle_charging_station`, `electric_vehicle_high_voltage_battery`, `electric_vehicle_cyber_protection`, `electric_vehicle_charging_cards_apps`).

---

## Interfacce TypeScript

```typescript
// Payload e risposta check_login
export interface CheckLoginResponse {
  logged_in: boolean;
}

// Payload setup EcoHub (credenziali + TOTP)
export interface EcoHubSetupPayload {
  consultant_id: string;        // usato per costruire l'URL, non inviato nel body
  ecohub_username: string;
  ecohub_password: string;
  ecohub_totp_secret: string;
}

// Risposta setup
export interface SetupResponse {
  success: boolean;
  message?: string;
}

// Payload extract TOTP dal QR code
export interface ExtractTotpPayload {
  qr_image_base64: string;
}

// Risposta extract TOTP
export interface ExtractTotpResponse {
  totp: string; // secret TOTP estratto
}

// Payload richiesta preventivo (consulente + tutti i campi del form)
export interface QuoteRequestPayload {
  consultant_id: string;
  // ... (vedi file sorgente per la lista completa dei campi)
}
```

---

## Endpoint Backend (Reali)

| Metodo Service | Endpoint Backend | HTTP | Note |
|---|---|---|---|
| `checkLogin(id)` | `/consultants/{id}/verify-login` | POST | `id` nel path, body vuoto |
| `extractTotp(payload)` | `/extract-totp-secret` | POST | Body JSON (da convertire a multipart in futuro) |
| `setupEcoHub(payload)` | `/consultants/{id}/credentials` | POST | `id` estratto dal payload e messo nel path |
| `submitQuoteRequest(payload)` | `/generate-quotes` | POST | Body JSON completo |

---

## Implementazione `AutomationService`

**File**: `src/app/services/automation.service.ts`

```typescript
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { delay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  CheckLoginResponse,
  EcoHubSetupPayload,
  SetupResponse,
  ExtractTotpPayload,
  ExtractTotpResponse,
  QuoteRequestPayload
} from '../interfaces/automation.interface';

@Injectable({ providedIn: 'root' })
export class AutomationService {

  private baseUrl = environment.automationApiEndpoint;
  private token   = environment.automationApiToken;

  constructor(private http: HttpClient) {}

  private get headers(): HttpHeaders {
    return new HttpHeaders({
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    });
  }

  // --- CHECK LOGIN ---
  checkLogin(consultantId: string): Observable<CheckLoginResponse> {
    if (environment.useMockApi) {
      return of({ logged_in: false }).pipe(delay(1500));
    }
    return this.http.post<CheckLoginResponse>(
      `${this.baseUrl}/consultants/${consultantId}/verify-login`,
      {},
      { headers: this.headers }
    );
  }

  // --- EXTRACT TOTP ---
  extractTotp(payload: ExtractTotpPayload): Observable<ExtractTotpResponse> {
    if (environment.useMockApi) {
      return of({ totp: 'MOCK_TOTP_SECRET_BASE32' }).pipe(delay(1500));
    }
    return this.http.post<ExtractTotpResponse>(
      `${this.baseUrl}/extract-totp-secret`,
      payload,
      { headers: this.headers }
    );
  }

  // --- SETUP ECOHUB ---
  setupEcoHub(payload: EcoHubSetupPayload): Observable<SetupResponse> {
    if (environment.useMockApi) {
      return of({ success: true, message: 'Setup completato con successo.' }).pipe(delay(1500));
    }
    const { consultant_id, ...credentials } = payload;
    return this.http.post<SetupResponse>(
      `${this.baseUrl}/consultants/${consultant_id}/credentials`,
      credentials,
      { headers: this.headers }
    );
  }

  // --- SUBMIT QUOTE REQUEST ---
  submitQuoteRequest(payload: QuoteRequestPayload): Observable<any> {
    if (environment.useMockApi) {
      return of({ status: 'ok', message: 'Richiesta inviata.' }).pipe(delay(1500));
    }
    return this.http.post<any>(
      `${this.baseUrl}/generate-quotes`,
      payload,
      { headers: this.headers }
    );
  }
}
```

---

## Note

- Il servizio è `providedIn: 'root'` — singleton, nessun bisogno di registrarlo in un modulo
- Gli header `Authorization` usano il token definito in `environment.automationApiToken`
- Con `useMockApi: true` non viene effettuata nessuna chiamata HTTP reale
- Per `setupEcoHub`, il `consultant_id` viene estratto dal payload e usato nell'URL; il body inviato contiene solo `ecohub_username`, `ecohub_password`, `ecohub_totp_secret`
- Per `checkLogin`, il `consultantId` è nel path URL e il body è vuoto `{}`
