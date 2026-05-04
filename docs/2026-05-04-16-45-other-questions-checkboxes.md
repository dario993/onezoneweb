# 2026-05-04 — Aggiunta Checkbox "Other Questions" nel Form Preventivi Auto

## Obiettivo

Aggiungere al fondo del form `automation-form` una sezione con 3 checkbox relative a situazioni degli ultimi 5 anni, e popolare il campo `other_questions` nel payload API con i valori selezionati separati da `;`.

## Domanda da aggiungere

**Label:** "Sind Sie in den letzten 5 Jahren in eine der folgenden Situationen geraten?"

**Opzioni checkbox:**
1. `Autoversicherung hat Vertrag gekündigt oder besondere Auflagen gemacht`
2. `Autoversicherung hat Antrag abgelehnt oder die Annahme an erschwerte Bedinungen geknüpft`
3. `Führerausweisentzug von mehr als 1 Monat`

## File da modificare

### 1. `automation-form.component.ts`
- Aggiungere 3 controlli boolean nel form group: `other_q_1`, `other_q_2`, `other_q_3`
- In `onSubmit()`: calcolare `other_questions` come join con `;` dei label delle checkbox selezionate
- Escludere i 3 campi dal payload diretto (come già fatto per `ev_*`) e iniettarli in `other_questions`

### 2. `automation-form.component.html`
- Aggiungere una nuova sezione prima del pulsante Submit con le 3 checkbox

## Logica API

Nel payload inviato all'API, il campo `other_questions` conterrà:
- Stringa vuota `''` se nessuna checkbox è selezionata
- Il valore della singola checkbox se solo una è selezionata
- I valori concatenati con `;` se più di una è selezionata

Esempio: `"Autoversicherung hat Vertrag gekündigt oder besondere Auflagen gemacht;Führerausweisentzug von mehr als 1 Monat"`

## Impatti

- Nessun impatto sulle validazioni esistenti (campi opzionali)
- Nessuna modifica al servizio API o alle interfacce
- Il campo `other_questions` era già presente nel form group con valore `''`
