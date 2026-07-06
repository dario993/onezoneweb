# Visibilità opzione "Mehrere Fahrer" condizionata al gender "Firma"

## Obiettivo

Nel form `automation-form`, l'opzione **"Mehrere Fahrer" (`multiple`)** della domanda **"Hauptfahrer" (`main_driver_type`)** deve essere visibile solo quando il contraente è un'azienda (gender `Azienda` → label "Firma"). Per persone fisiche (Mann/Frau) restano disponibili solo `user` e `other`.

## Modifiche

### `src/app/pages/automation-form/automation-form.component.html`
- Sostituire il `@for (d of driverTypeOptions; ...)` con `@for (d of visibleDriverTypeOptions; ...)` nella sezione "Main Driver" (~ righe 320-332).

### `src/app/pages/automation-form/automation-form.component.ts`
- Nuovo getter `visibleDriverTypeOptions`: ritorna `driverTypeOptions` se gender = `Azienda`, altrimenti filtra fuori `multiple`.
- Subscription su `gender.valueChanges`: se gender diventa diverso da `Azienda` e `main_driver_type` è `multiple`, reset a `user`. Lo `setValue('user')` triggera la subscription esistente che riallinea i validator del sub-form `main_driver`.

## Impatti

- Payload `POST /generate-quotes` invariato.
- Nessun cambio i18n.
- Comportamento identico anche sulla rotta pubblica `/automation-form-generic-client`.
