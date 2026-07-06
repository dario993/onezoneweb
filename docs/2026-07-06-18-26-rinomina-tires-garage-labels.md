# Rinomina etichette form: pneumatici/cerchi e scelta garage

Aggiornamento di due etichette i18n usate nel form auto (Garanzie complementari) di `customers-mandate` / `automation-form`.

## Chiavi modificate

- `form_tires_damage`: allineamento al concetto tedesco "Reifen - und Felgenschäden" (include cerchi).
- `form_garage_free_choice`: rimozione dell'aggettivo "libera/free/libre/freie" → semplice "Scelta del garage".

## File

- `src/assets/i18n/de.json`
  - `form_tires_damage`: `"Reifenschäden"` → `"Reifen - und Felgenschäden"`
  - `form_garage_free_choice`: `"Freie Garagenwahl"` → `"Garagenwahl"`
- `src/assets/i18n/it.json`
  - `form_tires_damage`: `"Danni agli pneumatici"` → `"Danni a pneumatici e cerchi"`
  - `form_garage_free_choice`: `"Libera scelta del garage"` → `"Scelta del garage"`
- `src/assets/i18n/en.json`
  - `form_tires_damage`: `"Tire damage"` → `"Tire and rim damage"`
  - `form_garage_free_choice`: `"Free choice of garage"` → `"Garage choice"`
- `src/assets/i18n/fr.json`
  - `form_tires_damage`: `"Dommages aux pneus"` → `"Dommages aux pneus et jantes"`
  - `form_garage_free_choice`: `"Libre choix du garage"` → `"Choix du garage"`

Gli `_hint` restano invariati.
