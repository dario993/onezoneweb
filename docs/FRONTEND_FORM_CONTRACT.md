# Frontend Form Contract — Quote Request

**Canonical field reference** for the quote-request payload. Every field, type,
default and enum lives here; `SCHEMA_GUIDE.md` (backend) and
`CLIENT_GUIDE_GENERATE_QUOTES.md` (API client) link here instead of re-listing
fields. Mirrors the backend `UserSchema` (`modules/schemas.py`) + static metadata
(`modules/schema_options.py`).

> Enum values are English since June 2026 (Italian still accepted via a deprecated
> shim, removed after 2026-12-31). Full map: [ENUM_ANGLICIZATION_MIGRATION.md](ENUM_ANGLICIZATION_MIGRATION.md). Emit English.

**Rule:** every enum value below must match the backend string EXACTLY (case, accents,
spaces). The backend rejects unknown values (`extra='forbid'`). Submit via
`POST /generate-quotes`. Live machine-readable schema: `GET /openapi.json` (or `/docs`).

Sections follow the form layout order (drives both the form and the result email):
**Personal Info → Vehicle 1 → Vehicle 2 → Insurance Options → Claims History**.

---

## Conventions

- **Req** = required (must be sent, non-empty).
- **Opt** = optional (omit or send empty; backend applies the listed default).
- Empty string / `null` for an optional field → backend uses the default (it strips
  empty/null keys before validation). Exception: `serial_number_1` empty → backend
  fills placeholder `"123456786"`.
- **Dummy-serial normalization:** an obvious dummy sequence typed into **either**
  `serial_number_1` or `serial_number_2` (e.g. `111111111`, `123456789`, `987654321`)
  is also coerced to `123456786`. So "no placeholder fallback" for `serial_number_2`
  only means *empty* input — a dummy-looking value is still normalized. Registration
  rejects the placeholder (real Stammnummer required).
- Numbers may be sent as number or numeric string; backend coerces to string.
- Dates: **`DD.MM.YYYY`** (registration/birth/license). Purchase dates: **`MM.YYYY`**.

---

## 1. Personal Info

| Field | Label | Req? | Type / Values | Notes |
|---|---|---|---|---|
| `gender` | Gender | Req | enum: `Male`, `Female`, `Company` | |
| `company_name` | Company Name | Cond | string | **Required if `gender=Company`** |
| `first_name` | First Name | Req | string | auto Title-cased |
| `last_name` | Last Name | Req | string | auto Title-cased |
| `birth_date` | Birth Date | Req | date `DD.MM.YYYY` | user must be ≥18 |
| `first_driving_license_date` | First Driving License Date | Req | date `DD.MM.YYYY` | age at license ≥18 |
| `zip_code` | ZIP Code | Req | string, exactly 4 digits | |
| `canton` | Canton | Req | enum Canton (see below) | |
| `area` | Area | Req | string | city/locality |
| `address` | Address | Req | string | |
| `address_number` | Address Number | Req | string | |
| `email` | Email | Req | string | **no `+` allowed** |
| `phone` | Phone | Req | string, digits only | |
| `nationality` | Nationality | Req | ISO2 code, 2 uppercase letters | e.g. `CH`, `IT` |
| `foreigners_id_type` | Foreigner ID Type | Cond | enum: `B`,`C`,`S`,`Ci`,`F`,`G`,`N` | **Required if `nationality != CH`** |
| `language` | Language | Req | enum: `it`, `en`, `de`, `fr` | |
| `main_driver` | Main Driver | Opt | object (see below) | who drives the vehicle |

**Canton** enum (26): `AG AI AR BE BL BS FR GE GL GR JU LU NE NW OW SG SH SO SZ TG TI UR VD VS ZG ZH`

**`main_driver`** object (optional):
```jsonc
{
  "driver_type": "user" | "other" | "multiple",   // default "user"
  "driver": { ...PersonData }  // REQUIRED only when driver_type = "other"
}
```
`PersonData` = same Personal Info fields, all optional:
`gender, company_name, first_name, last_name, birth_date, first_driving_license_date,
zip_code, canton, area, address, address_number, email, phone, nationality,
foreigners_id_type, language`.

---

## 2. Vehicle 1 (required vehicle)

| Field | Label | Req? | Type / Values | Notes |
|---|---|---|---|---|
| `deductible_under_26` | Deductible Under 26 | Opt | enum: `Yes`,`0`,`1000`,`2000`,`3000`,`5000` | `Yes`=min deductible, else the amount |
| `n_certificate_1` | Certificate Number | Opt | string, alphanumeric, max 7 | |
| `car_brand_1` | Car Brand | Req | string | `Volkswagen`→`VW` auto |
| `car_model_1` | Car Model | Req | string | brand prefix auto-stripped |
| `vehicle_type_1` | Vehicle Type | Opt | enum: `passenger_car`, `van` | |
| `drive_1` | Drive / Fuel | Opt | enum: `Benzin`,`Diesel`,`Hybrid-Benzin`,`Hybrid-Diesel`,`Electric` | |
| `accessories_1` | Accessories Value (CHF) | Opt | integer | |
| `serial_number_1` | Serial Number | Req | string, exactly 9 digits | empty → placeholder `123456786` |
| `first_registration_date_1` | First Registration Date | Req | date `DD.MM.YYYY` | |
| `purchase_date_1` | Purchase Date | Opt | `MM.YYYY` | |
| `kilometers_per_year_1` | Kilometers Per Year | Opt | enum: `5000`,`7000`,`10000`,`15000`,`20000`,`25000`,`30000`,`+30000` | |
| `current_mileage_1` | Current Mileage (km) | Opt | integer | |
| `reasons_for_redemption_1` | Reason for Redemption | Opt | enum ReasonForRedemption (below) | |
| `leasing_1` | Leasing | Req | enum: `Yes`, `No` | `Yes` forces comprehensive=`Full` |
| `leasing_company_1` | Leasing Company | Opt | enum LeasingCompany (long list, below) | |
| `garage_parking_1` | Garage Parking | Req | enum: `Yes`, `No` | |
| `submit_vehicle_proof_1` | Submit Vehicle Proof | Opt | enum: `Yes`, `No` | (English Yes/No) |
| `license_plate` | License Plate | Opt | string | non-digits stripped |
| `interchangeable_plate` | Interchangeable Plate | Req | enum: `Yes`, `No` | `Yes` → Vehicle 2 fields required |

**ReasonForRedemption** enum:
`New redemption`, `Vehicle change`, `Vehicle change in the interchangeable sign`,
`Open interchangeable sign`, `Change of ownership`,
`Changing insurers without changing vehicles`, `other cases`

---

## 3. Vehicle 2 (conditional)

All optional UNLESS `interchangeable_plate=Yes` — then `car_brand_2`, `car_model_2`,
`serial_number_2`, `first_registration_date_2`, `leasing_2`, `garage_parking_2` become required.

| Field | Label | Req? | Type / Values |
|---|---|---|---|
| `n_certificate_2` | Certificate Number | Opt | alphanumeric, max 7 |
| `car_brand_2` | Car Brand | Cond | string |
| `car_model_2` | Car Model | Cond | string |
| `vehicle_type_2` | Vehicle Type | Opt | `passenger_car`, `van` |
| `drive_2` | Drive / Fuel | Opt | same as `drive_1` |
| `accessories_2` | Accessories Value (CHF) | Opt | integer |
| `serial_number_2` | Serial Number | Cond | exactly 9 digits (no placeholder fallback) |
| `first_registration_date_2` | First Registration Date | Cond | date `DD.MM.YYYY` |
| `purchase_date_2` | Purchase Date | Opt | `MM.YYYY` |
| `kilometers_per_year_2` | Kilometers Per Year | Opt | same enum as v1 |
| `current_mileage_2` | Current Mileage (km) | Opt | integer |
| `reasons_for_redemption_2` | Reason for Redemption | Opt | ReasonForRedemption |
| `leasing_2` | Leasing | Cond | `Yes`,`No` (default `No`) |
| `leasing_company_2` | Leasing Company | Opt | LeasingCompany |
| `garage_parking_2` | Garage Parking | Cond | `Yes`,`No` (default `No`) |
| `submit_vehicle_proof_2` | Submit Vehicle Proof | Opt | `Yes`,`No` |

---

## 4. Insurance Options

| Field | Label | Req? | Type / Values | Default |
|---|---|---|---|---|
| `vehicle_usage` | Vehicle Usage | Req | enum VehicleUsage (below) | |
| `civil_insurance` | Civil Insurance | Req | enum: `Yes excluding my property`, `Yes including my property`, `No` | |
| `comprehensive_insurance` | Comprehensive Insurance (casco) | Req | enum: `Full`, `Partial`, `None` | |
| `deductible_partial_insurance` | Deductible Partial (CHF) | Opt | enum: `0`,`200`,`500`,`1000` | `0` |
| `deductible_total_insurance` | Deductible Total (CHF) | Opt | enum: `500`,`1000`,`2000` | `500` |
| `parking_damage_coverage` | Parking Damage Coverage | Opt | enum: `Unlimited`,`2000`,`1000`,`No` | `No` |
| `deductible_parking_damage` | Deductible Parking (CHF) | Opt | enum: `0`,`200`,`500` | `0` |
| `headlights_mirrors` | Headlights & Mirrors | Opt | `Yes`,`No` | `No` |
| `personal_belongings_coverage` | Personal Belongings | Req | enum: `No`,`2000`,`3000`,`5000` | |
| `tires_damage` | Tires Damage | Req | `Yes`,`No` | |
| `bonus_protection` | Bonus Protection | Req | `Yes`,`No` | |
| `roadside_assistance` | Roadside Assistance | Req | `Yes`,`No` | |
| `garage_free_choice` | Garage Free Choice | Req | enum: `fixed`, `free_choice` | |
| `passenger_injury` | Passenger Injury | Req | `Yes`,`No` | |
| `electric_vehicle` | Electric Vehicle Options | Opt | object (below) | all false |
| `payment_mode` | Payment Mode | Req | enum: `Annual`, `Semiannual` | |

**VehicleUsage** enum:
`no_specific_use`, `freight_transport`, `courier`, `passenger_transport`,
`taxi`, `driving_school`, `rental`

**`electric_vehicle`** object — send EITHER an object of booleans OR a comma-separated
string of the labels. Keys/labels (default all `false`):
```jsonc
{
  "charging_station_and_accessories": false,
  "high_voltage_batteries": false,
  "cyber_protection": false,
  "charging_cards_and_app_protection": false
}
```

---

## 5. Claims History

| Field | Label | Req? | Type / Values | Default |
|---|---|---|---|---|
| `current_insurance` | Current Insurance | Opt | enum CurrentInsurer (below) | `""` |
| `n_rc_claims_5_years` | RC Claims (5 Years) | Req | enum: `0`,`1`,`2`,`3` (`3`=3+) | |
| `n_collisions_claims_5_years` | Collision Claims (5 Years) | Req | ClaimsCount | |
| `n_parking_claims_5_years` | Parking Claims (5 Years) | Req | ClaimsCount | |
| `n_glass_claims_5_years` | Glass Claims (5 Years) | Req | ClaimsCount | |
| `n_partial_comprehensive_claims_5_years` | Partial Comp. Claims (5 Years) | Req | ClaimsCount | |
| `n_rc_claims_3_years` | RC Claims (3 Years) | Opt | ClaimsCount | `0` |
| `n_collisions_claims_3_years` | Collision Claims (3 Years) | Opt | ClaimsCount | `0` |
| `n_parking_claims_3_years` | Parking Claims (3 Years) | Opt | ClaimsCount | `0` |
| `n_glass_claims_3_years` | Glass Claims (3 Years) | Opt | ClaimsCount | `0` |
| `n_partial_comprehensive_claims_3_years` | Partial Comp. Claims (3 Years) | Opt | ClaimsCount | `0` |
| `license_withdrawal_5_years` | License Withdrawal (5 Years) | Opt | enum: `none`,`1 month`,`2 months`,`3 months or more` | `none` |
| `other_questions` | Other Questions | Opt | string (free text) | `""` |
| `source_user` | Source User | Opt | string | `""` |

**ClaimsCount** enum: `0`, `1`, `2`, `3` (where `3` means "3 or more").

**`license_withdrawal_5_years`** — driving-license withdrawal in the last 5 years.
Schema values are English (`none`, `1 month`, `2 months`, `3 months or more`); backend
maps to the EcoHub portal's German dropdown. From `3 months or more` insurers require
documentation upfront — FE may show a hint.

**CurrentInsurer** enum (the client's CURRENT insurer — EcoHub portal values VERBATIM,
keep accents/casing exactly):
`keine`, `neu in der Schweiz`, `Automate`, `Allianz Suisse`, `AXA`, `Baloise`,
`Belsura`, `Elvia`, `Generali`, `Helvetia`, `Migros`, `Mobiliar`, `Postfinance`,
`smile.direct`, `Simpego`, `TCS`, `TSM`, `Vaudoise`, `Visana`, `Zürich`,
`Andere Versicherung`, `Versicherung im Ausland`

> Backend coerces unknown current-insurer values to `Andere Versicherung`. The FE
> dropdown should still offer exactly this list.

---

## Cross-field rules (JSON Schema can't express — implement in the form)

> **Canonical here.** Backend enforces these in `check_complex_constraints`
> (`modules/schemas.py`); SCHEMA_GUIDE points here rather than re-listing. Keep this
> list in step with that function.

1. `gender = Company` → `company_name` required.
2. `nationality != CH` → `foreigners_id_type` required.
3. `interchangeable_plate = Yes` → Vehicle 2 required: `car_brand_2`, `car_model_2`,
   `serial_number_2`, `first_registration_date_2`, `leasing_2`, `garage_parking_2`.
4. `leasing_1 = Yes` OR `leasing_2 = Yes` → force `comprehensive_insurance = Full`.
5. `comprehensive_insurance = Full` → `deductible_total_insurance` required.
6. `comprehensive_insurance ∈ {Full, Partial}` → `deductible_partial_insurance` required.
7. `parking_damage_coverage != No` → `deductible_parking_damage` required.
8. `comprehensive_insurance = None` → backend resets `headlights_mirrors`,
   `parking_damage_coverage`, `tires_damage`, `personal_belongings_coverage` to No.
   (FE should hide/disable these when None.)
9. Age: user ≥18 at birth_date; age at `first_driving_license_date` ≥18.

---

## Format validators (regex)

| Field(s) | Rule |
|---|---|
| `birth_date`, `first_driving_license_date`, `first_registration_date_1/2` | `DD.MM.YYYY`, valid date |
| `purchase_date_1/2` | `MM.YYYY`, valid month |
| `serial_number_1/2` | exactly 9 digits |
| `n_certificate_1/2` | alphanumeric, 1–7 chars |
| `zip_code` | exactly 4 digits |
| `phone` | digits only |
| `email` | no `+` character |
| `nationality` | ISO 3166-1 alpha-2 (2 uppercase letters, valid code) |
| `license_plate` | non-digits stripped automatically |

---

## LeasingCompany enum

~120 values. Don't transcribe by hand — pull live from `GET /openapi.json`
(`components.schemas.LeasingCompany.enum`) or from
`modules/schema_options.py → LEASING_COMPANIES`. Match value exactly.

---

## Submit

`POST /generate-quotes` with `Authorization: Bearer <consultant_api_key>`.
Body = flat object of the fields above. See `docs/api/CLIENT_GUIDE_GENERATE_QUOTES.md`
for the request/response contract and Swagger examples (`modules/openapi_examples.py`).
