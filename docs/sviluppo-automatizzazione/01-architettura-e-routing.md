# 01 — Architettura e Routing

**Stato**: ✅ Completato
**Dipendenze**: nessuna
**File modificati**: `app.routes.ts`, `home.component.ts/html`

> **Nota implementazione**: Il bottone "Genera Preventivi" è stato posizionato nella **Home** (non nella vista consulente come originariamente pianificato). Il bottone è visibile solo se `authService.userData.login.isSharer` è `true`. Sono stati aggiunti anche bottoni `[DEV]` per accesso diretto a setup/form in modalità mock.

---

## Nuove Rotte Angular

Aggiungere in `src/app/app.routes.ts` all'interno del blocco rotte autenticate (`canActivate: [isAuthenticatedRoute]`):

```typescript
{ path: 'automation-setup', component: AutomationSetupComponent },
{ path: 'automation-form',  component: AutomationFormComponent  },
```

Import da aggiungere:
```typescript
import { AutomationSetupComponent } from './pages/automation-setup/automation-setup.component';
import { AutomationFormComponent }  from './pages/automation-form/automation-form.component';
```

---

## Bottone "Genera Preventivi" nella Vista Consulente

### File: `src/app/pages/consultant/consultant.component.html`

Aggiungere il bottone nella sezione azioni del consulente (posizione da verificare leggendo il componente esistente):

```html
<button
  (click)="onGeneraPreventivi()"
  class="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200">
  <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
  {{ 'automation.genera_preventivi' | i18n }}
</button>
```

> Aggiungere la chiave `automation.genera_preventivi` nei file i18n (it/de/en/fr) con valore "Genera Preventivi" / "Offerten erstellen" / "Generate Quotes" / "Générer des devis"

---

### File: `src/app/pages/consultant/consultant.component.ts`

Aggiungere la logica del bottone:

```typescript
// Import
import { AutomationService } from '../../services/automation.service';
import { NavigatorService } from '../../services/navigator.service';
import { LoaderService } from '../../services/loader.service';
import { AuthService } from '../../services/auth.service';

// Nel costruttore
constructor(
  // ... dipendenze esistenti ...
  private automationService: AutomationService,
  private navigatorService: NavigatorService,
  private loaderService: LoaderService,
  private authService: AuthService
) {}

// Metodo
async onGeneraPreventivi(): Promise<void> {
  const consultantId = this.authService.userData?.contact?.id;
  if (!consultantId) return;

  this.loaderService.show();
  try {
    const result = await firstValueFrom(
      this.automationService.checkLogin(String(consultantId))
    );
    if (result.logged_in) {
      this.navigatorService.navigateTo('/automation-form');
    } else {
      this.navigatorService.navigateTo('/automation-setup');
    }
  } catch {
    // In caso di errore API, vai al setup
    this.navigatorService.navigateTo('/automation-setup');
  } finally {
    this.loaderService.hide();
  }
}
```

Import aggiuntivo in cima al file:
```typescript
import { firstValueFrom } from 'rxjs';
```

---

## Struttura Cartelle da Creare

```
src/app/pages/
├── automation-setup/
│   ├── automation-setup.component.ts
│   └── automation-setup.component.html
└── automation-form/
    ├── automation-form.component.ts
    └── automation-form.component.html
```

---

## Traduzioni i18n da Aggiungere

In tutti i file `src/assets/i18n/*.json` aggiungere la sezione `automation`:

```json
{
  "automation": {
    "genera_preventivi": "Genera Preventivi",
    "setup_title": "Procedura Guidata",
    "setup_subtitle": "Ciao {nome}, per poter generare preventivi devi completare la seguente procedura guidata",
    "step_credenziali": "Credenziali EcoHub",
    "step_qrcode": "Configurazione 2FA",
    "step_authenticator": "Verifica Authenticator",
    "avanti": "Avanti",
    "indietro": "Indietro",
    "invia": "Invia",
    "success": "Operazione completata con successo!",
    "form_title": "Richiesta Preventivo Auto",
    "submit_form": "Richiedi Preventivi",
    "success_quote": "Tra qualche minuto riceverai per email i preventivi.",
    "error_generic": "Si è verificato un errore. Riprova più tardi."
  }
}
```
