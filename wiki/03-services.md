# Servizi Principali

## AuthService
**File**: [auth.service.ts](../src/app/services/auth.service.ts)

Gestione completa dell'autenticazione e sessione utente.

**Proprietà**:
- `isAuth: boolean` — stato autenticazione
- `isConsultant: boolean` — ruolo consulente
- `token: string` — Token JWT
- `userData: any` — dati utente corrente
- `tokenValidUntil: Date` — scadenza token

**Metodi principali**:

| Metodo | Descrizione | Ritorno |
|--------|-------------|---------|
| `isLogged()` | Verifica autenticazione | `boolean` |
| `startSession(oUserAuthData)` | Inizia nuova sessione | `Promise<boolean>` |
| `loadSession()` | Carica sessione da storage | `void` |
| `endSession()` | Termina sessione | `void` |
| `fetchUserData()` | Recupera dati utente | `Promise<boolean>` |
| `logout()` | Effettua logout | `Promise<boolean>` |
| `getUserName(type, name1, name2)` | Formatta nome utente | `string` |

---

## BrokerstarService
**File**: [brokerstar.service.ts](../src/app/services/brokerstar.service.ts)

Interfaccia con le API del backend BrokerStar.
**Base URL**: `https://onezone.brokerstar.biz/api/v3`

**Headers standard**: `Authorization: Bearer {token}`, `Accept: application/json`

**Gestione Errori**: `catchError` su ogni chiamata, fallback a `[]`.

**Cache**: endpoint menu e quotations cachati via StorageService.

**Paginazione automatica**: `contactContactList` carica tutte le pagine in parallelo con `forkJoin`.

### API per categoria

**Autenticazione**: `login()`, `logout()`

**Contatti**: `registerUser()`, `addSubcontact()`, `contactRelation()`, `contactContactList()`, `contact()`, `changeContact()`, `changeContactPassword()`, `contactGetAvatar()`

**Utente**: `userMe()`, `userMeUpdate()`

**Menu**: `customerportalmenu(level)` (con cache)

**Chat**: `chatConversationMessages()`, `chatFloodedChat()`, `chatPostMessage()`, `chatMuteConversation()`

**File**: `getDocumentCategoryItemInfo()`, `fileInfo()`, `file()`, `contactFiles()`, `uploadFile()`, `uploadProfileFile()`

**Polizze**: `policyList()`, `policy()`, `premiumInvoice()`

**Sinistri**: `createClaim()`, `claimInformInsurances()`

**Mandati**: `mandateInformInsurances()`

**Offerte**: `quotation()`, `tender()`, `tenderOffer()`, `tenderOfferAccept()`, `tenderOfferReject()`

**Report**: `createJasperreport()`, `createSignetJasperreport()`

**Assicurazioni**: `insurance()`

**Password**: `resetPassword()`, `confirmResetPassword()`

---

## I18nService
**File**: [i18n.service.ts](../src/app/services/i18n.service.ts)

Gestione internazionalizzazione. Lingue: `de` (default), `en`, `fr`, `it`.

Mappatura lingua → codice numerico: `de→1`, `fr→2`, `it→3`, `en→4`

**Metodi**: `init()`, `checkLanguage()`, `getSelectedLanguage()`, `loadLanguage()`, `getTranslation(...aGroups)`, `getTypeAsNummeric()`

Fallback se traduzione mancante: `'MISSINGTRANSLATION'`

---

## StorageService
**File**: [storage.service.ts](../src/app/services/storage.service.ts)

Wrapper per `localStorage`. Metodi: `setItem()`, `getItem()`, `removeItem()`, `clear()`, `clearOldVersions()`

**Chiavi usate**: `token`, `tokenValidUntil`, `userData`, `selectedLanguage`, `customerportalmenu{level}`, `quotations`

---

## NavigatorService
**File**: [navigator.service.ts](../src/app/services/navigator.service.ts)

Navigazione programmatica. Metodi: `navigateTo(route, params?)`, `back()`, `getLanguage()`

---

## ToasterService
**File**: [toaster.service.ts](../src/app/services/toaster.service.ts)

Notifiche toast (ngx-toastr). Metodi: `success()`, `error()`, `warning()`, `info()`

Config: `timeOut: 3000`, `positionClass: 'toast-top-right'`, `preventDuplicates: true`

---

## OneZoneService
**File**: [onezone.service.ts](../src/app/services/onezone.service.ts)

Integrazione WordPress. Metodo: `banner()` → `https://onezone.ch/wp-json/wp/v2/banner`

---

## LoaderService
**File**: [loader.service.ts](../src/app/services/loader.service.ts)

Gestione spinner/loader globale durante operazioni asincrone.
