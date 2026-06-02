# Conversazione: Fix cambio lingua nella Home

Data: 2026-05-25
Branch: `feature/wip-mandato`

---

## Richiesta iniziale

**Utente:** analizza la home page `src/app/pages/home/home.component.ts`, dimmi come gestisce il caricamento della lingua, perché quando cambio lingua da `src/app/pages/language/language.component.ts` la lingua del testo visualizzato non cambia.

---

## Analisi del problema

### File esaminati

- `src/app/pages/home/home.component.ts` + `.html`
- `src/app/pages/language/language.component.ts`
- `src/app/services/i18n.service.ts`
- `src/app/services/i18nfile.service.ts`
- `src/app/services/navigator.service.ts`
- `src/app/services/auth.service.ts`
- `src/app/pages/login/login.component.ts`
- `src/app/app.ts`

### Diagnosi

Come la Home gestisce la lingua:
1. Template usa `{{ 'index.welcome' | i18n }}` (pipe `I18nPipe`) e `entry['name'][i18n.currentLanguage]`.
2. Dati `slider`, `menu`, `quote` caricati una sola volta nel constructor (alcuni cache-first da localStorage).
3. `getLocalizedText()` legge `this.i18n.currentLanguage`.

Cosa succede al cambio lingua in `language.component.ts`:
1. `selectLanguage()` → `storage.setItem('selectedLanguage', code)` ✓
2. `i18n.loadLanguage(file)` → aggiorna solo `oLanguage`
3. `navigator.back()` → torna alla Home senza ricrearla

Perché il testo NON cambia (tre bug concorrenti):

1. **`I18nPipe` è pura** (`pure: true` default). Angular la ricalcola solo se l'input cambia. Stringhe `'index.welcome'` sono costanti → la pipe non viene mai rivalutata.
2. **`I18nService.currentLanguage` non viene mai aggiornato** dopo l'init: `loadLanguage()` cambia `oLanguage` ma non `currentLanguage`. Quindi anche i binding come `entry['name'][i18n.currentLanguage]` continuano a usare la vecchia lingua.
3. **Nessun evento reattivo**: il servizio non espone Observable/Signal su cui i componenti possano risubscrivere o ricaricare dati lingua-dipendenti.

Bug latente aggiuntivo individuato in `I18nService.getSelectedLanguage()`: lo switch accetta solo `'english'/'french'/'italian'`, ma `language.component.ts` salva i **codici corti** (`'fr'`, `'it'`, `'en'`). Al reload dell'app la lingua salvata non viene riconosciuta e si ricade su `'de'`.

---

## Flusso login (sequenza definita)

1. **POST `/api/v3/login`** → ritorna `{ token: "..." }`.
2. **GET `/api/v3/user/me`** (chiamata da `AuthService.fetchUserData()`) → ritorna il JSON completo con `contact.language.locale` (es. `"it"`), `permissions.isSharer`, ecc.
3. `AuthService.startSession()` salva token + `userData` in localStorage.
4. `navigator.navigateTo('home')` → render `HomeComponent`.

**Lacuna individuata (problema B, non risolto in questo intervento)**: nessuno legge `contact.language.locale` per impostare la lingua dell'app dopo il login. L'app resta nella lingua del browser/precedente, ignorando la preferenza salvata sul server.

---

## Approccio scelto: minimale

L'utente ha richiesto la modifica più piccola possibile, attiva solo al momento del cambio lingua. Soluzione: forzare un reload della pagina subito dopo che la nuova lingua è stata salvata. L'app riparte da `App.ngOnInit` → `i18n.init` → legge la nuova lingua dallo storage → tutta la UI si rivaluta naturalmente.

Per funzionare correttamente, occorre prima sistemare il bug dello switch in `getSelectedLanguage()`.

---

## Modifiche applicate

### File 1 — `src/app/services/i18n.service.ts`

Switch in `getSelectedLanguage()` esteso ai codici corti:

```ts
switch (storageLanguage) {
  case 'en':
  case 'english': {
    sLanguage = 'en';
    break;
  }
  case 'fr':
  case 'french': {
    sLanguage = 'fr';
    break;
  }
  case 'it':
  case 'italian': {
    sLanguage = 'it';
    break;
  }
  case 'de': {
    sLanguage = 'de';
    break;
  }
}
```

### File 2 — `src/app/pages/language/language.component.ts`

`selectLanguage()` ora fa `window.location.reload()` invece di `navigator.back()` nei due rami di successo:

- Ramo utente NON loggato (else branch).
- Ramo utente loggato (callback `next` della PATCH backend).

Il ramo di errore PATCH resta invariato (`navigator.back()`) per non perdere il messaggio di errore.

---

## Logica del nuovo flusso

1. Utente clicca su una lingua in `LanguageComponent`.
2. `storage.setItem('selectedLanguage', code)` con codice corto (es. `'fr'`).
3. `i18n.loadLanguage(file)` (serve perché la callback successiva usa `getTranslation` per toaster).
4. Se loggato: PATCH al backend; on success → `window.location.reload()`.
5. Se non loggato: `window.location.reload()` immediato.
6. Al reload: `App.ngOnInit` → `i18n.init()` → `getSelectedLanguage()` riconosce `'fr'` → `currentLanguage = 'fr'` → `loadLanguage(localeFR)`. Tutte le pagine renderizzano nella nuova lingua.

---

## Risultato

**Funzionante.** Il cambio lingua dalla pagina Language ora si propaga correttamente a tutta la UI (Home inclusa) dopo il reload automatico.

---

## Documenti collegati

- `docs/2026-05-25-21-04-fix-cambio-lingua-reload.md` — documento di progetto dell'intervento.

---

## Cosa NON è stato fatto (problema B aperto)

Allineamento automatico della lingua app a `userData.contact.language.locale` ricevuta in `/user/me` dopo il login. Da affrontare separatamente quando richiesto.
