# Enum Value Anglicization — Migration Handoff (June 2026)

> ⏳ **Time-boxed doc.** Delete this file **and** `modules/legacy_value_aliases.py`
> (+ the 3 shim banners) when the Italian-value alias shim sunsets **2026-12-31**.
> Until then it documents live behavior.

Backend `UserSchema` enum **values** are now English. The old Italian values are
**still accepted** (normalized via `modules/legacy_value_aliases.py`) but are
**deprecated and will be rejected after 2026-12-31**.

The shim runs in a `mode="before"` model validator. Because nested models validate
independently, the normalizer is wired on **both** `UserSchema` and the nested
`PersonData` (`main_driver.driver`) — otherwise a legacy value in the nested driver
(e.g. `gender="Maschio"`) would skip the shim and fail enum validation.

This doc's load-bearing part is the old→new value map below — it mirrors
`modules/legacy_value_aliases.py` while the shim lives. The one-time migration
artifacts (client changelog/email, frontend Zod diff) were removed; they're in git
history if needed.

**Cleanup at sunset (2026-12-31):** when the alias shim is removed, delete this doc,
`modules/legacy_value_aliases.py`, and the deprecation banners in SCHEMA_GUIDE.md,
FRONTEND_FORM_CONTRACT.md, and CLIENT_GUIDE_GENERATE_QUOTES.md in one pass.

---

## 1. Value mapping (old Italian → new English)

| Field(s) | Old value | New value |
|---|---|---|
| `gender` | `Maschio` / `Femmina` / `Azienda` | `Male` / `Female` / `Company` |
| `comprehensive_insurance` | `Totale` / `Parziale` / `Nessuna` | `Full` / `Partial` / `None` |
| `payment_mode` | `Annuale` / `Semestrale` | `Annual` / `Semiannual` |
| `garage_free_choice` | `fissa` / `scelta` | `fixed` / `free_choice` |
| `parking_damage_coverage` | `Illimitato` (others numeric/`No`) | `Unlimited` |
| `deductible_under_26` | `Si` (others numeric) | `Yes` |
| `civil_insurance` | `Si esclusi alla mia proprieta` / `Si inclusi alla mia proprieta` / `No` | `Yes excluding my property` / `Yes including my property` / `No` |
| `vehicle_usage` | `nessun uso specifico` | `no_specific_use` |
| | `trasporto merci` | `freight_transport` |
| | `corriere` | `courier` |
| | `trasporto passeggeri` | `passenger_transport` |
| | `taxi` | `taxi` (unchanged) |
| | `scuola guida` | `driving_school` |
| | `noleggio` | `rental` |
| **Yes/No fields** — `leasing_1`, `leasing_2`, `garage_parking_1`, `garage_parking_2`, `interchangeable_plate`, `tires_damage`, `bonus_protection`, `roadside_assistance`, `passenger_injury`, `headlights_mirrors` | `Si` / `No` | `Yes` / `No` |
| `electric_vehicle` (comma-separated options) | `stazione di ricarica e accessori` | `charging_station_and_accessories` |
| | `batterie alta tensione` | `high_voltage_batteries` |
| | `protezione informatica` | `cyber_protection` |
| | `protezione carte ricarica e app` | `charging_cards_and_app_protection` |

**Unchanged** (do not touch): `current_insurance` (German EcoHub values, e.g. `Zürich`,
`Allianz Suisse`, `smile.direct`), `drive` (`Benzin`/`Diesel`/`Electric`/…), `canton`,
`language`, `nationality` (ISO2), and all numeric deductible/claims values.

