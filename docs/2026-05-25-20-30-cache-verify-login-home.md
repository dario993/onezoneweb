# Cache-first verify-login

Stessa logica delle altre cache: la risposta di `POST /consultants/{id}/verify-login` (`AutomationService.checkLogin`) viene salvata in localStorage con chiave `consultantLoginCheck`. Quando l'utente preme "Genera Preventivi" in Home, se la cache esiste si naviga direttamente a `automation-form` (se `login_check=true`) o `automation-setup` (se `false`), saltando la chiamata API. Pulita al logout da `StorageService.clear()`.

Modifica: `src/app/pages/home/home.component.ts` (`onGeneraPreventivi`).

**Nota**: questa cache è "sticky" per sessione di login. Se il login EcoHub scade lato backend prima del logout, l'utente vedrà comunque il comportamento cached fino al prossimo logout/login.
