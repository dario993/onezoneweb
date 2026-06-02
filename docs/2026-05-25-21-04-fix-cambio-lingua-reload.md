# Fix Cambio Lingua: Reload Forzato dopo Selezione

## Problema

Quando l'utente cambia lingua da `language.component.ts`, la UI delle altre pagine (in particolare Home) non si aggiorna finché non si ricarica manualmente l'app.

### Cause

1. `I18nPipe` è **pura** → Angular non rivaluta `{{ 'index.welcome' | i18n }}` dopo il cambio lingua perché l'input stringa non cambia.
2. `I18nService.currentLanguage` **non viene aggiornato** quando si chiama `loadLanguage()` (viene impostato solo in `init()`). I binding come `entry['name'][i18n.currentLanguage]` restano sulla vecchia lingua.
3. **Bug latente** in `I18nService.getSelectedLanguage()`: lo switch accetta solo `'english'/'french'/'italian'`, ma `language.component.ts` salva i **codici corti** (`'en'/'fr'/'it'`). Al reload la lingua salvata non viene riconosciuta e si ricade su `'de'`.

## Approccio scelto: minimo invasivo

Invece di rifattorizzare la pipe e introdurre reattività nel service, si forza un **reload della pagina** subito dopo che la nuova lingua è stata salvata. L'app riparte da `App.ngOnInit` → `i18n.init` → legge la nuova lingua dallo storage → tutta la UI si rivaluta naturalmente.

Per funzionare correttamente, occorre prima sistemare il bug dello switch in `getSelectedLanguage()`.

## Modifiche

### File 1 — `src/app/services/i18n.service.ts`

Nello switch di `getSelectedLanguage()` (righe ~60-73), aggiungere il riconoscimento dei codici corti che effettivamente vengono salvati in storage:

```ts
switch (storageLanguage) {
  case 'en':
  case 'english':
    sLanguage = 'en';
    break;
  case 'fr':
  case 'french':
    sLanguage = 'fr';
    break;
  case 'it':
  case 'italian':
    sLanguage = 'it';
    break;
  case 'de':
    sLanguage = 'de';
    break;
}
```

### File 2 — `src/app/pages/language/language.component.ts`

In `selectLanguage()`, dopo aver salvato la lingua e (se loggati) dopo che la PATCH al backend è andata a buon fine, sostituire `navigator.back()` con `window.location.reload()`:

- Caso utente NON loggato (else branch): `window.location.reload()` invece di `navigator.back()`.
- Caso utente loggato (callback `next` di `saveLanguageToUser`): `window.location.reload()` invece di `navigator.back()`.
- In caso di errore della PATCH si lascia `navigator.back()` (no reload) per non perdere il messaggio di errore.

## Logica di funzionamento

1. Utente clicca su una lingua in `LanguageComponent`.
2. `storage.setItem('selectedLanguage', code)` con codice corto (es. `'fr'`).
3. `i18n.loadLanguage(file)` (rimane invariato; serve perché la callback successiva può usare `getTranslation` per toaster).
4. Se loggato: PATCH al backend; on success → `window.location.reload()`.
5. Se non loggato: `window.location.reload()` immediato.
6. Al reload: `App.ngOnInit` → `i18n.init()` → `getSelectedLanguage()` ora riconosce `'fr'` → `currentLanguage = 'fr'` → `loadLanguage(localeFR)`. Tutte le pagine renderizzano nella nuova lingua.

## Impatti

- **Nessuna modifica architetturale**: pipe rimane pura, nessun BehaviorSubject/Signal introdotto.
- **Nessuna modifica ai componenti** che usano `| i18n` o `i18n.currentLanguage`.
- Lo stato in memoria non persistito viene perso al reload (accettabile: l'utente sta esplicitamente cambiando lingua).
- Breve flash di reload visibile.
- Cache localStorage (`bannerData`, `consultantData`, ecc.) viene letta di nuovo: `bannerData` contiene testi nella lingua del fetch precedente; per ora si accetta questo limite (può essere migliorato dopo invalidando la chiave al cambio lingua).

## Cosa NON viene fatto in questo intervento

- Allineamento automatico alla `contact.language.locale` ricevuta in `/user/me` dopo il login (problema separato).
- Invalidazione cache lingua-dipendenti (`bannerData`).
- Refactor verso pipe impura o sistema reattivo.

## Verifica end-to-end

1. `npm start`.
2. Login con utente di default → Home in tedesco.
3. Apri pagina Language, seleziona Italiano.
4. **Atteso**: l'app fa reload; al ricaricamento la Home è in italiano (label `| i18n`, voci di menu, citazioni).
5. Reload manuale (F5) → lingua resta italiano.
6. Ripeti con francese e inglese.
7. Logout → login con altro utente → la lingua resta quella scelta (non si auto-allinea al backend — comportamento atteso per questo intervento).

## File modificati

- `src/app/services/i18n.service.ts` — switch in `getSelectedLanguage()`.
- `src/app/pages/language/language.component.ts` — reload al posto di `navigator.back()` nei rami di successo.
