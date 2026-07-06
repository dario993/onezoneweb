# Sostituzione checkbox "Ritiro patente" con select a 4 opzioni

**Data**: 2026-06-22 18:43
**File**: `automation-form` (sezione 6 "Altre domande")

## Obiettivo

La domanda **"Ritiro della patente per più di 1 mese" / "Führerausweisentzug von mehr als 1 Monat"** passa da checkbox booleana a `<select>` con 4 opzioni (durata del ritiro).

## Opzioni

| value (DE)              | IT             | DE                    | FR              | EN                |
|-------------------------|----------------|-----------------------|-----------------|-------------------|
| `keine`                 | NO             | NEIN                  | NON             | NO                |
| `1 Monat`               | 1 mese         | 1 Monat               | 1 mois          | 1 month           |
| `2 Monate`              | 2 mesi         | 2 Monate              | 2 mois          | 2 months          |
| `3 Monate oder mehr`    | 3 mesi o più   | 3 Monate oder mehr    | 3 mois ou plus  | 3 months or more  |

## Modifiche

- **`automation-form.component.ts`**
  - Nuova lista `licenseSuspensionOptions`
  - `buildForm()`: `other_q_license_suspension` default `'keine'` (da `false`)
  - Mock/reset: stesso default
  - `onSubmit()`: se `≠ 'keine'`, aggiunge a `other_questions` la stringa `"<label base>: <durata>"` (es. `"Ritiro della patente per più di 1 mese: 1 mese"`)

- **`automation-form.component.html`**
  - Sezione 6: il `<label><input type="checkbox" ...></label>` per `other_q_license_suspension` diventa una `<select>` con le 4 opzioni i18n

- **`src/assets/i18n/{it,de,fr,en}.json`**
  - 4 nuove chiavi: `automation.opt_license_susp_none`, `_1m`, `_2m`, `_3m_plus`

## Payload `/generate-quotes`

Stessa struttura precedente: `other_questions` è una stringa free-text con i valori concatenati da `, `.

Esempio con `1 Monat`:
```json
{ "other_questions": "Ritiro della patente per più di 1 mese: 1 mese" }
```
Con `keine`: la voce non viene aggiunta.
