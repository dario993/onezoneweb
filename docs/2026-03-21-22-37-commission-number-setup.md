# Aggiunta campo commission_number nel wizard Setup Automazione

## Obiettivo
Aggiungere il campo `commission_number` nello step 3 del wizard di setup (`automation-setup`) e passarlo nella chiamata `registerConsultant`.

## File da modificare

1. **`src/app/pages/automation-setup/automation-setup.component.html`** — Aggiungere un campo input `commission_number` nello step 3 (prima del campo OTP)
2. **`src/app/pages/automation-setup/automation-setup.component.ts`** — Aggiungere `commission_number` al model `form` e passarlo nel payload di `registerConsultant()`

## Dettagli implementazione

### HTML (step 3)
- Campo input di testo con label "Numero di commissione"
- Posizionato prima del campo OTP nello step 3

### TypeScript
- Aggiungere `commission_number: ''` all'oggetto `form`
- Passare `commission_number: this.form.commission_number` nella chiamata `registerConsultant()` a riga ~145

### Nessuna modifica necessaria a:
- `automation.interface.ts` — `ConsultantRegistrationPayload` ha già il campo `commission_number` opzionale
- `automation.service.ts` — `registerConsultant()` accetta già il payload con `commission_number`
