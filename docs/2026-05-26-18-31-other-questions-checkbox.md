# Sezione "Altre domande" con 3 checkbox e payload `other_questions` (array di stringhe)

## Obiettivo

Aggiungere, **subito dopo** la sezione "Storico Sinistri (ultimi 5 anni)" del form automation, una nuova card con la domanda:

> "Sind Sie in den letzten 5 Jahren in eine der folgenden Situationen geraten?"
> (IT: "Negli ultimi 5 anni si è trovato in una delle seguenti situazioni?")

con 3 checkbox (multi-selezione):

1. "Autoversicherung hat Vertrag gekündigt oder besondere Auflagen gemacht"
2. "Autoversicherung hat Antrag abgelehnt oder die Annahme an erschwerte Bedinungen geknüpft"
3. "Führerausweisentzug von mehr als 1 Monat"

I valori delle checkbox selezionate vanno inviati all'API nel campo **`other_questions`** come **array di stringhe**.

## Decisioni tecniche

- **Form controls**: 3 boolean controls separati (`other_q_terminated`, `other_q_refused`, `other_q_license_suspension`), coerente con il pattern già usato per `ev_*` (4 boolean → oggetto `electric_vehicle`). Più semplice e tipato rispetto a FormArray.
- **Valori inviati nell'array**: le **stringhe tradotte nella lingua corrente** dell'utente, lette via `i18nService.getTranslation('automation', '<chiave>')` al momento del submit. Stesse chiavi i18n usate per le label visibili.
- **Interfaccia**: in `automation.interface.ts` cambiare `other_questions?: string;` → `other_questions: string[];` (sempre presente, anche se array vuoto).
- **Payload submit**: nel destructuring di `onSubmit()` estrarre i 3 boolean e mapparli in `other_questions: string[]`.

## File da modificare

1. `src/app/interfaces/automation.interface.ts` → `other_questions: string[];`
2. `src/app/pages/automation-form/automation-form.component.ts`:
   - `buildForm()` (riga ~725): sostituire `other_questions: ['']` con 3 control boolean
   - `onSubmit()` (riga ~866): estrarre i 3 boolean, costruire `other_questions: string[]`
   - `populateTestData()` (riga ~965): aggiornare reset (`false` per i 3 nuovi control, rimuovere `other_questions: ''`)
3. `src/app/pages/automation-form/automation-form.component.html`: nuova card subito dopo la sezione "Storico Sinistri" (dopo `</div>` di chiusura della card, prima della sezione successiva)
4. `src/assets/i18n/{it,en,de,fr}.json`: 4 nuove chiavi sotto `automation`:
   - `form_section_other_questions` — titolo card / label domanda
   - `form_other_q_terminated` — label checkbox 1
   - `form_other_q_refused` — label checkbox 2
   - `form_other_q_license_suspension` — label checkbox 3

## Stringhe fisse inviate all'API (per `other_questions`)

```ts
const OTHER_QUESTIONS_VALUES = {
  terminated: 'Autoversicherung hat Vertrag gekündigt oder besondere Auflagen gemacht',
  refused: 'Autoversicherung hat Antrag abgelehnt oder die Annahme an erschwerte Bedinungen geknüpft',
  licenseSuspension: 'Führerausweisentzug von mehr als 1 Monat',
};
```

## Mockup template (semplificato)

```html
<div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-8">
  <h2 class="text-lg font-semibold text-gray-700 mb-4 border-b pb-2">
    {{ 'automation.form_section_other_questions' | i18n }}
  </h2>
  <div class="space-y-2">
    <label class="flex items-start gap-2 text-sm text-gray-700">
      <input type="checkbox" formControlName="other_q_terminated" class="mt-1" />
      <span>{{ 'automation.form_other_q_terminated' | i18n }}</span>
    </label>
    <label class="flex items-start gap-2 text-sm text-gray-700">
      <input type="checkbox" formControlName="other_q_refused" class="mt-1" />
      <span>{{ 'automation.form_other_q_refused' | i18n }}</span>
    </label>
    <label class="flex items-start gap-2 text-sm text-gray-700">
      <input type="checkbox" formControlName="other_q_license_suspension" class="mt-1" />
      <span>{{ 'automation.form_other_q_license_suspension' | i18n }}</span>
    </label>
  </div>
</div>
```

## Traduzioni proposte

| Chiave | DE | IT | EN | FR |
|--------|----|----|----|----|
| `form_section_other_questions` | Sind Sie in den letzten 5 Jahren in eine der folgenden Situationen geraten? | Negli ultimi 5 anni si è trovato in una delle seguenti situazioni? | In the last 5 years, have you been in any of the following situations? | Au cours des 5 dernières années, vous êtes-vous trouvé dans l'une des situations suivantes ? |
| `form_other_q_terminated` | Autoversicherung hat Vertrag gekündigt oder besondere Auflagen gemacht | L'assicurazione auto ha disdetto il contratto o imposto condizioni particolari | The car insurer terminated the contract or imposed special conditions | L'assurance auto a résilié le contrat ou imposé des conditions particulières |
| `form_other_q_refused` | Autoversicherung hat Antrag abgelehnt oder die Annahme an erschwerte Bedinungen geknüpft | L'assicurazione auto ha rifiutato la richiesta o ha subordinato l'accettazione a condizioni aggravate | The car insurer refused the application or accepted it under aggravated conditions | L'assurance auto a refusé la demande ou l'a acceptée sous conditions aggravées |
| `form_other_q_license_suspension` | Führerausweisentzug von mehr als 1 Monat | Ritiro della patente per più di 1 mese | Driving licence withdrawal of more than 1 month | Retrait du permis de conduire de plus d'1 mois |

## Verifica

1. `npm start` → aprire form automation
2. Scorrere fino alla nuova sezione (subito dopo Storico Sinistri) → 3 checkbox visibili, deselezionate di default
3. Selezionarne 2 e inviare il form → verificare in DevTools Network che il payload contenga `other_questions: ["Autoversicherung hat Vertrag gekündigt...", "Führerausweisentzug von mehr als 1 Monat"]` (solo le selezionate, in stringhe tedesche fisse)
4. Cambiare lingua → le label visibili si traducono ma i valori inviati restano in tedesco
5. Nessun errore in console
