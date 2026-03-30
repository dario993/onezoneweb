# Salvataggio api_key consulente al login

## Obiettivo
Quando un consulente effettua il login e accede alla home, recuperare automaticamente la sua `api_key` dal backend automation e salvarla nella sessione.

## Logica
1. Nel constructor di `HomeComponent`, se `isConsultant` è `true`:
   - Chiamare `automationService.getConsultant(userData.login.id)`
   - Se la risposta è OK, salvare `res.api_key` tramite `storageService.setItem('consultantApiKey', res.api_key)`
   - Se errore (404 = consulente non registrato), ignorare silenziosamente

## File modificati
- `src/app/pages/home/home.component.ts` — aggiunta chiamata getConsultant al login consulente
- `src/app/services/automation.service.ts` — aggiunta `api_key` alla mock response di getConsultant

## Impatto
- La `consultantApiKey` sarà disponibile in sessione per le chiamate successive (es. `submitQuoteRequest`) senza richiedere setup manuale se il consulente è già registrato
- Nessun impatto su utenti non-consulenti
