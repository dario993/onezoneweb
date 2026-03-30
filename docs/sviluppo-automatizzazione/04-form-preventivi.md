# 04 — Form Preventivi Auto

**Stato**: ✅ Completato (aggiornato 2026-03-04 — allineamento con form WordPress)
**File modificati**:
- `src/app/pages/automation-form/automation-form.component.ts`
- `src/app/pages/automation-form/automation-form.component.html`

**Dipendenze**: `02-automation-service.md`, `01-architettura-e-routing.md`
**Schema di riferimento**: `docs/sviluppo-automatizzazione/schemas.py`
**Riferimento visivo**: `docs/sviluppo-automatizzazione/FireShot Capture 003 - test auto...png`

---

## Aggiornamento 2026-03-04 — Allineamento con form WordPress

### Modifiche effettuate

#### 1. Campi convertiti da text input a SELECT con opzioni complete

| Campo | Prima | Dopo |
|-------|-------|------|
| **Nazionalità** | `<input type="text">` | `<select>` con ~190 paesi (CH, DE, IT, FR in cima) |
| **Marca veicolo 1** | `<input type="text">` | `<select>` con ~80 marche auto |
| **Marca veicolo 2** | `<input type="text">` | `<select>` con ~80 marche auto |
| **Assicurazione attuale** | `<input type="text">` | `<select>` con 20+ compagnie assicurative svizzere |
| **Cantone** | `<select>` semplice (solo sigla) | `<select>` con `value`/`label` (es. "ZH Zurigo") |
| **Tipo permesso stranieri** | `<select>` solo codice | `<select>` con `value`/`label` (es. "B - Permesso di soggiorno") |
| **Franchigia under 26** | `<select>` valori nudi | `<select>` con label descrittive |
| **RC, Casco, Parcheggio, ecc.** | Opzioni stringa semplice | `<select>` con `value`/`label` descrittivo |

#### 2. Campo aggiunto: Situazioni ultimi 5 anni

3 checkbox nella sezione Storico Sinistri:
- `situation_contract_cancelled` — Rescissione contratto da parte della compagnia
- `situation_application_rejected` — Rifiuto domanda o condizioni più severe
- `situation_license_suspended` — Sospensione patente > 1 mese

#### 3. Campo rimosso

- `other_questions` (textarea "Altre domande / note") — non presente nel form WordPress

#### 4. Campo spostato: Cantone

- **Prima**: nella sezione "Informazioni Personali"
- **Dopo**: nella sezione "Veicolo" come "Cantone per targhe" (coerente con WordPress "Kanton für Schilder")

#### 5. Valori default aggiornati (allineati al form WordPress)

| Campo | Prima | Dopo |
|-------|-------|------|
| `language` | `'it'` | `'de'` |
| `deductible_under_26` | `''` | `'0'` |
| `garage_parking_1` | `'No'` | `'Si'` |
| `garage_parking_2` | `'No'` | `'Si'` |
| `canton` | `''` | `'ZH'` |
| `civil_insurance` | `'No'` | `'Si inclusi alla mia proprieta'` |
| `comprehensive_insurance` | `'Nessuna'` | `'Totale'` |
| `deductible_total_insurance` | `''` | `'1000'` |
| `deductible_partial_insurance` | `''` | `'0'` |
| `headlights_mirrors` | `'No'` | `'Si'` |
| `personal_belongings_coverage` | `'No'` | `'2000'` |
| `bonus_protection` | `'No'` | `'Si'` |
| `roadside_assistance` | `'No'` | `'Si'` |
| `garage_free_choice` | `'scelta'` | `'fissa'` |
| `current_insurance` | `''` | `'Baloise'` |

#### 6. Genere: da select a radio button

Coerente con WordPress. Mostra "Uomo", "Donna", "Azienda" con nota "Dal punto di vista assicurativo non esistono altre forme."

#### 7. Label e descrizioni allineate

Tutte le etichette e le descrizioni helper (`<p class="text-xs text-gray-400">`) ora corrispondono al form WordPress originale in italiano.

#### 8. Molti campi Si/No convertiti da radio a select

Campi come `headlights_mirrors`, `tires_damage`, `bonus_protection`, `roadside_assistance`, `passenger_injury` ora usano `<select>` con opzioni SÌ/NO, come nel form WordPress.

---

## Struttura Form

Il form è diviso in **5 sezioni** con campi condizionali. Usa `ReactiveFormsModule` di Angular per validazione e logica condizionale.

### Sezioni

1. **Informazioni Personali** — genere, nome, cognome, nascita, patente, indirizzo, email, telefono, nazionalità, permesso stranieri, lingua offerta
2. **Veicolo** — franchigia under 26, omologazione, marca (select), modello, stammnummer, accessori CHF, cantone targhe, numero targa, prima immatricolazione, leasing, garage, targa intercambiabile
3. **Veicolo 2** (condizionale: targa intercambiabile = Si) — stessi campi del veicolo 1
4. **Utilizzo e Coperture** — utilizzo, RC, casco, franchigie, parcheggio, fari/specchietti, effetti personali, pneumatici, bonus, assistenza, garage, infortuni passeggeri, EV options, pagamento
5. **Storico Sinistri** — assicurazione attuale (select), 5 tipi sinistri, 3 checkbox situazioni

---

## Validazioni Chiave

| Regola | Implementazione Angular |
|--------|------------------------|
| `company_name` obbligatorio se `gender = Azienda` | `valueChanges` su gender |
| `foreigners_id_type` obbligatorio se `nationality != CH` | `valueChanges` su nationality |
| Campi veicolo 2 obbligatori se `interchangeable_plate = Si` | `valueChanges` su interchangeable_plate |
| Se `leasing_1 = Si` o `leasing_2 = Si` → imposta `comprehensive_insurance = Totale` | `valueChanges` su leasing |
| `deductible_total_insurance` obbligatorio se `comprehensive = Totale` | `valueChanges` su comprehensive |
| `deductible_partial_insurance` obbligatorio se `comprehensive = Totale o Parziale` | idem |
| `deductible_parking_damage` obbligatorio se `parking_damage_coverage != No` | `valueChanges` su parking |

---

## Note di Implementazione

- Template usa `@if`/`@for` (Angular 20 control flow)
- I campi data usano `<input type="text">` con placeholder "GG.MM.AAAA"
- Grid responsive a 2 colonne (`md:grid-cols-2`), 1 colonna su mobile
- Schermata di successo rimpiazza il form dopo invio
- Errori con `toasterService.warn()`
- Payload inviato flat, senza trasformazioni
