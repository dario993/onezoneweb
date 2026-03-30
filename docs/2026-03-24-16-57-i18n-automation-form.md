# Internazionalizzazione del Form Preventivi Auto (automation-form)

**Data**: 2026-03-24 16:57
**Tipo**: Manutenzione / i18n

---

## Obiettivo

Integrare il sistema di traduzione i18n esistente nell'app nel componente `automation-form`, che attualmente ha quasi tutti i testi hardcoded in italiano. Aggiornare i 4 file di lingua (de, en, fr, it) con tutte le nuove chiavi.

---

## Stato attuale

- Il template `automation-form.component.html` ha ~90+ testi hardcoded in italiano
- Solo 2 testi usano già `{{ ... | i18n }}`: il titolo (`automation.form_title`) e il bottone submit (`automation.submit_form`)
- Il file `.ts` ha messaggi di errore e toast hardcoded in italiano (`getError()`, `onSubmit()`, `fillTestData()`)
- `en.json` e `fr.json` non hanno la sezione `automation`
- `de.json` e `it.json` hanno la sezione `automation` ma solo con le chiavi base (setup wizard + poche del form)

---

## File da modificare

| File | Tipo modifica |
|------|--------------|
| `src/app/pages/automation-form/automation-form.component.html` | Sostituire testi hardcoded con `{{ 'chiave' \| i18n }}` |
| `src/app/pages/automation-form/automation-form.component.ts` | Sostituire messaggi errore/toast con traduzioni tramite `I18nService` |
| `src/assets/i18n/it.json` | Aggiungere ~80 nuove chiavi sotto `automation` |
| `src/assets/i18n/de.json` | Aggiungere le stesse chiavi in tedesco |
| `src/assets/i18n/en.json` | Aggiungere sezione `automation` completa in inglese |
| `src/assets/i18n/fr.json` | Aggiungere sezione `automation` completa in francese |

---

## Categorie di testi da tradurre

### 1. Titoli sezioni
- "Informazioni Personali", "Veicolo", "Veicolo 2 (Targa Intercambiabile)", "Utilizzo e Coperture", "Storico Sinistri (ultimi 5 anni)"

### 2. Labels campi (~40)
- Dati personali: Genere, Nome, Cognome, Data di nascita, Patente, CAP, Località, Strada, Numero civico, Email, Cellulare, Nazionalità, Carta d'identità stranieri, Lingua offerta
- Veicolo: Franchigia under 26, Nr. omologazione, Marca, Modello, Nr. registrazione, Accessori, Cantone targhe, Nr. targa, Immatricolazione, Leasing, Garage notte, Targa intercambiabile
- Coperture: Utilizzo veicoli, RC, Casco, Franchigie, Danni parcheggio, Fari/specchietti, Effetti personali, Pneumatici, Protezione bonus, Assistenza, Libera scelta garage, Infortuni passeggeri, Veicolo elettrico, Pagamento
- Sinistri: Assicurazione attuale, Sinistri RC/collisione/parcheggio/vetri/casco parziale

### 3. Hint/descrizioni sotto i campi (~25)
- Testi esplicativi come "Dal punto di vista assicurativo non esistono altre forme", "Posizione 24 nel documento di immatricolazione", ecc.

### 4. Opzioni statiche nel template
- "SÌ" / "NO", "Uomo" / "Donna" / "Azienda", "Seleziona...", "Nessuno", "3 o più"

### 5. Messaggi di errore (nel .ts)
- "Campo obbligatorio", "Codice postale non trovato", "Località non trovata", "Email non valida", "Formato richiesto: GG.MM.AAAA", "Formato non valido", "Valore non valido"

### 6. Messaggi toast (nel .ts)
- "Compila tutti i campi obbligatori", "Dati di test caricati", "Il pool di sessioni è pieno...", "Si è verificato un errore..."

### 7. Messaggio successo post-invio
- Titolo e corpo del messaggio di conferma

---

## Struttura chiavi di traduzione

Tutte le nuove chiavi saranno aggiunte sotto il namespace `automation` esistente, con prefisso `form_` per le chiavi specifiche del form:

```
automation.form_success_title
automation.form_success_message
automation.form_section_personal
automation.form_section_vehicle
automation.form_section_vehicle2
automation.form_section_usage
automation.form_section_claims
automation.form_gender
automation.form_gender_male
automation.form_gender_female
automation.form_gender_company
automation.form_gender_hint
automation.form_first_name
...
automation.form_err_required
automation.form_err_email
automation.form_err_date_format
...
```

---

## Impatti

- **Nessun impatto funzionale**: il comportamento del form resta identico
- **Nessuna nuova dipendenza**: usa il sistema i18n già presente (I18nPipe, I18nService)
- **Nel .ts**: verrà iniettato `I18nService` per tradurre i messaggi di errore e toast
