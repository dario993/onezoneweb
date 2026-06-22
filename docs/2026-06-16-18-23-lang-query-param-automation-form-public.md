# Lang query param sulla rotta pubblica `automation-form-generic-client`

## Obiettivo

Consentire di forzare la lingua del form pubblico via query string:

```
/automation-form-generic-client?lang=it|de|fr|en
```

Codici non validi o assenti → comportamento attuale invariato (lingua da `localStorage` / browser).

## Modifiche

### `src/app/pages/automation-form/automation-form.component.ts`

- Import e injection di `I18nFileService`.
- In `ngOnInit()`, subito dopo `this.publicMode = !!this.route.snapshot.data['publicMode']`:
  - Se `publicMode` e il queryParam `lang` è in `['de','en','fr','it']` e diverso dal valore corrente in storage:
    - `storageService.setItem('selectedLanguage', langParam)`
    - `i18nService.loadLanguage(i18nFileService.getLanguageFile(langParam))`
    - `window.location.reload()`; `return` per non eseguire il resto di `ngOnInit`.

## Logica

Riusa il pattern di `LanguageComponent.selectLanguage()` (persist storage + load file + reload).
Il check di disuguaglianza con la lingua attuale evita loop di reload.

## Impatti

Nessuno su altre pagine: il blocco si attiva solo quando `publicMode === true` e il queryParam è valido.
