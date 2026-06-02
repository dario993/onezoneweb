# Descrizione informativa sotto titolo "Storico Sinistri" nel form automation

## Obiettivo

Aggiungere una breve nota informativa sotto il titolo della Sezione 5 "Storico Sinistri (ultimi 5 anni)" del form preventivi auto (`automation-form`), per informare l'utente che con più di 3 sinistri il confronto automatico non è possibile e occorre un rendimento sinistri (Schadenrendement).

## Testo (fornito dall'utente in tedesco)

> "kein Vergleich möglich bei mehr als 3 Schadenfälle - hier wird ein Schadenrendement benötigt"

## Modifiche

### 1. Template `automation-form.component.html`

Dopo l'`<h2>` di Sezione 5 (riga 737) aggiungere un paragrafo descrittivo:

```html
<p class="text-sm text-gray-500 mb-4 -mt-2">{{ 'automation.form_section_claims_description' | i18n }}</p>
```

### 2. Chiavi i18n (it/en/de/fr)

Nuova chiave `automation.form_section_claims_description`:

- **DE**: "kein Vergleich möglich bei mehr als 3 Schadenfälle - hier wird ein Schadenrendement benötigt"
- **IT**: "Nessun confronto possibile con più di 3 sinistri — in tal caso è necessario un rendimento sinistri."
- **EN**: "No comparison possible with more than 3 claims — a claims performance report is required."
- **FR**: "Aucune comparaison possible avec plus de 3 sinistres — un rendement de sinistres est requis."

## Impatti

Solo presentazione: nessuna logica di form/validazione toccata. Solo template + file i18n.

## Verifica

1. Avviare `npm start`
2. Aprire il form automation, scorrere a Sezione 5
3. Verificare che la frase appaia sotto il titolo, in stile sottile/grigio
4. Cambiare lingua e verificare le 4 traduzioni
