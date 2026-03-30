# CheckLogin dopo Setup Automazione

## Obiettivo
Dopo il completamento con successo del terzo step (onSubmit) in automation-setup, chiamare `checkLogin(consultantId)` per verificare che il login su EcoHub funzioni. Durante l'attesa (~60s) mostrare un messaggio informativo. Se OK → naviga a automation-form. Se KO → messaggio di errore.

## File modificati
- `src/app/pages/automation-setup/automation-setup.component.ts` — aggiunta chiamata checkLogin dopo onSubmit
- `src/app/pages/automation-setup/automation-setup.component.html` — messaggio di attesa durante verifica

## Logica
1. onSubmit va a buon fine (registrazione + update credenziali)
2. Viene settato un flag `isVerifying = true` per mostrare il messaggio di attesa
3. Si chiama `checkLogin(consultantId)`
4. Se `login_check === true` → navigazione a `automation-form`
5. Se errore o `login_check === false` → toaster errore con messaggio specifico
