# Gap Analysis: Frontend vs Backend Reale

> I requisiti del backend reale sono documentati in: [`FRONTEND_INTEGRATION.md`](./FRONTEND_INTEGRATION.md)

## 1. Endpoint e URL completamente diversi

Il frontend usa endpoint "inventati" che non corrispondono al backend reale:

| Frontend (attuale) | Backend (reale) | Note |
|---|---|---|
| POST /check_login | POST /consultants/{consultant_id}/verify-login | Endpoint e risposta diversi |
| POST /extract_totp con {qr_image_base64} | POST /extract-totp-secret con multipart/form-data (file binario) | Formato invio completamente diverso (base64 vs multipart) |
| POST /setup | POST /consultants + POST /consultants/{id}/credentials | Sono 2 endpoint separati nel backend, non uno solo |
| POST /quote_request | POST /generate-quotes | URL diverso + autenticazione diversa |

## 2. Modello di autenticazione diverso

- Frontend attuale: usa un singolo automationApiToken globale per tutte le chiamate
- Backend reale: usa un sistema a 2 livelli:
  - ADMIN_API_KEY per gestione consulenti (/consultants, /sessions, /verify-login)
  - consultant api_key (generata alla registrazione) per POST /generate-quotes
- Il consulente deve prima essere registrato con POST /consultants per ottenere la sua api_key, che poi va salvata e usata per le quote

## 3. POST /extract-totp-secret — formato file diverso

- Frontend: invia { qr_image_base64: "..." } come JSON
- Backend: richiede multipart/form-data con campo qr_image come file binario
- La risposta cambia: backend restituisce { secret, issuer, name } invece di { totp }

## 4. Il setup non è un singolo endpoint

- Frontend: chiama POST /setup con tutte le credenziali + TOTP + OTP in una volta
- Backend: richiede 2 passaggi:
  a. POST /consultants — registra il consulente (restituisce api_key)
  b. POST /consultants/{onezone_id}/credentials — aggiorna le credenziali EcoHub
  c. (Opzionale) POST /consultants/{id}/verify-login — verifica che le credenziali funzionino

## 5. checkLogin — risposta diversa

- Frontend: aspetta { logged_in: boolean }
- Backend (POST /consultants/{id}/verify-login): restituisce { status: "verified"|"failed"|"already_verified"|"error", login_check: boolean }

## 6. Quote request — manca la gestione asincrona

Questa è la mancanza più importante:
- Backend: POST /generate-quotes restituisce { status: "accepted", request_id: 42 } — il processo è asincrono
- Frontend: tratta la risposta come sincrona (submitSuccess = true al completamento)
- Manca: polling dello stato della richiesta (il backend suggerisce di interrogare il DB ogni 5 secondi per vedere se status === 'completed' o 'error')
- Manca: UI per mostrare lo stato di elaborazione (pending → processing → completed/error)

## 7. Interfacce TypeScript da aggiornare

- CheckLoginResponse → deve mappare { status, login_check, error? }
- ExtractTotpResponse → deve mappare { secret, issuer, name }
- SetupResponse non esiste come concetto unitario → split in ConsultantRegistrationResponse e CredentialsUpdateResponse
- QuoteRequestPayload → rimuovere consultant_id (l'autenticazione avviene via Bearer token del consulente)
- Aggiungere interfaccia GenerateQuotesResponse con { status, request_id, message }
- Aggiungere campo opzionale scrapers: string[] al payload quote

## 8. Campi form vs schema backend

Alcuni campi nel form che mancano rispetto a quello che il backend accetta:
- marital_status — stato civile (presente nel backend, assente nel form)

Campi nel form che il backend non ha nel suo esempio:
- situation_contract_cancelled, situation_application_rejected, situation_license_suspended — presenti nel form ma non documentati nel backend (potrebbero passare come campi extra via [key: string]: any)
- other_questions — stesso caso

## 9. Feature mancanti nel frontend

- Nessuna UI per la registrazione consulente (POST /consultants) — il backend richiede questo step
- Nessun salvataggio della api_key del consulente — va salvata dopo la registrazione
- Nessun endpoint /sessions — potrebbe essere utile mostrare lo stato del pool sessioni (429 = pool pieno)
- Nessuna gestione errore 429 — "Session pool full" → il frontend non mostra un messaggio specifico
- Traduzioni mancanti per en.json e fr.json

---

## Riepilogo priorità

1. Riallineare gli endpoint nell'AutomationService ai veri URL del backend
2. Cambiare il modello di autenticazione (admin key + consultant key)
3. Implementare il flusso di registrazione consulente (POST /consultants)
4. Convertire extract-totp-secret da JSON/base64 a multipart/form-data
5. Implementare il polling asincrono dopo generate-quotes (request_id → status tracking)
6. Aggiornare le interfacce TypeScript per riflettere le risposte reali
7. Gestire l'errore 429 (session pool full) con messaggio user-friendly
