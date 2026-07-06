# customers-mandate-add: gender, civico, mobile obbligatorio, label DE

## Obiettivi

1. Aggiungere selettore genere (Mann/Frau) nel form persona.
2. Rinominare in tedesco le label del toggle: "Kunde" → "Privat Kunde", "Unternehmen" → "Firma".
3. Aggiungere campo "Hausnummer" sotto indirizzo, concatenato in `payload['address']`.
4. Rendere il campo mobile obbligatorio.
5. Rimuovere il campo "Gründungstag" (birthday) dal form Firma; la validazione required su `birthday` resta attiva solo per il form Privat Kunde.

## File modificati

- `src/app/pages/customers-mandate-add/customers-mandate-add.component.html`
- `src/app/pages/customers-mandate-add/customers-mandate-add.component.ts`
- `src/assets/i18n/de.json`

## Logica

- **Gender**: bind su `registerData['gender']` (`'m'|'f'`), required solo se `registerType === 'person'`, non inviato nel payload (solo UI).
- **Label DE**: aggiornate solo in `de.json`, le altre lingue restano.
- **Hausnummer**: bind su `registerData['address_number']`, required. In `submit()` la composizione diventa `payload['address'] = "${address} ${address_number}"`.
- **Mobile**: rimossa dicitura "(optional)", aggiunta validazione required e stile errore.
- **Birthday/Firma**: rimosso il blocco "Gründungstag" dal form Firma; in `checkData()` il required su `birthday` scatta solo se `registerType === 'person'`.

Chiavi i18n riusate dal namespace `automation`: `form_gender`, `form_gender_male`, `form_gender_female`, `form_gender_hint`, `form_address_number`.
