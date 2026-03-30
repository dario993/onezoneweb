# Conversione extract-totp-secret da JSON/base64 a multipart/form-data

**Data creazione**: 2026-03-09 17:59
**Stato**: Implementato

---

## Obiettivo

Il backend `POST /extract-totp-secret` richiede `multipart/form-data` con il campo `qr_image` come file binario. Attualmente il frontend invia JSON con `qr_image_base64` (stringa base64). Bisogna convertire il flusso per inviare il file originale come binario.

---

## Stato Attuale

1. **`AutomationSetupComponent`**: l'utente incolla/seleziona un'immagine QR → `readQrFile()` la converte in base64 → salva in `form.qr_image_base64`
2. **`extractTotp()`** in `AutomationService`: invia `{ qr_image_base64: "..." }` come JSON con header `Content-Type: application/json`
3. **`ExtractTotpPayload`**: ha `qr_image_base64: string`

## Cosa richiede il backend

```
POST /extract-totp-secret
Content-Type: multipart/form-data

qr_image: <file binario (PNG, JPG, etc.)>
```

---

## Modifiche Previste

### 1. `src/app/interfaces/automation.interface.ts`

Cambiare `ExtractTotpPayload`:

```typescript
// PRIMA:
export interface ExtractTotpPayload {
  qr_image_base64: string;
}

// DOPO:
export interface ExtractTotpPayload {
  qr_image: File;
}
```

### 2. `src/app/services/automation.service.ts`

Cambiare `extractTotp()` per inviare `FormData` invece di JSON:

```typescript
public extractTotp(payload: ExtractTotpPayload): Observable<ExtractTotpResponse> {
  if (environment.useMockApi) { ... }
  const formData = new FormData();
  formData.append('qr_image', payload.qr_image);
  // NON impostare Content-Type — il browser lo imposta automaticamente con il boundary
  return this.http.post<ExtractTotpResponse>(
    `${this.baseUrl}/extract-totp-secret`,
    formData,
    { headers: new HttpHeaders({ Accept: 'application/json' }) }
  );
}
```

### 3. `src/app/pages/automation-setup/automation-setup.component.ts`

- Aggiungere proprietà `qrFile: File | null = null` per conservare il File originale
- `readQrFile()`: salvare il `File` originale in `this.qrFile` (oltre alla preview base64 per la UI)
- Rimuovere `form.qr_image_base64` dal form
- `extractTotp()`: passare `{ qr_image: this.qrFile }` al service
- `canProceed()` step 2: controllare `this.qrFile` invece di `this.form.qr_image_base64`

---

## File da Modificare (riepilogo)

| File | Tipo modifica |
|------|--------------|
| `src/app/interfaces/automation.interface.ts` | `ExtractTotpPayload.qr_image_base64` → `qr_image: File` |
| `src/app/services/automation.service.ts` | Invio FormData invece di JSON |
| `src/app/pages/automation-setup/automation-setup.component.ts` | Conserva File originale, adatta chiamata |

---

## Cosa NON cambia

- L'HTML del componente (paste/file select funzionano già con File)
- La preview base64 per la UI (resta, serve per mostrare l'anteprima)
- Il mock (non cambia, restituisce la stessa risposta)
- Le traduzioni
