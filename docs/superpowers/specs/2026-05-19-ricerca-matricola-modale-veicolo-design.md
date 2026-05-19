# Design: Ricerca per Matricola nel Modale Veicolo

**Data:** 2026-05-19  
**Feature:** Aggiunta campo matricola (Stammnummer) nel modale di ricerca veicolo dell'automation-form  
**Tipo:** Estensione feature esistente

---

## Obiettivo

Aggiungere nel modale di ricerca veicolo un campo **matricola (Stammnummer)** posizionato sopra i campi marca/modello già esistenti. Se la matricola è compilata, la ricerca usa l'endpoint `type=matricule` della SwissCarInfo API, che restituisce un singolo veicolo in auto-selezione. Altrimenti si usa il flusso brand/model esistente.

---

## Layout modale (barra di ricerca)

```
┌─────────────────────────────────────────────────────────┐
│  Matricola (Stammnummer)                                │
│  [_________________________________]  (keydown.enter)   │
│  ─────────────── oppure ───────────────                 │
│  [  Marca...        ] [  Modello...  ] [  Cerca  ]      │
└─────────────────────────────────────────────────────────┘
```

- Un **solo pulsante "Cerca"** in fondo alla riga brand/model
- Il campo matricola usa `keydown.enter` per triggherare la ricerca
- Esclusione automatica: digitare nella matricola svuota brand/model; digitare in brand/model svuota la matricola

---

## Logica di esclusione

- `onModalSerialInput(value)` → se `value.length > 0` → `modal.brandQuery = ''`, `modal.modelQuery = ''`
- `onModalBrandInput(value)` (già esistente) → se `value.length > 0` → `modal.serialQuery = ''`
- `modal.modelQuery` input → se valore digitato → `modal.serialQuery = ''`

---

## Flusso ricerca per matricola

1. Utente compila matricola + preme Enter (o pulsante Cerca con serialQuery attivo)
2. `onSearchVehicles()` → controlla `modal.serialQuery.trim()`
3. Se presente → chiama `SwissCarInfoService.searchBySerial(serial, lang)`
4. Service: `GET /search?q=<serial>&type=matricule&lang=<lang>`
5. Risposta API: `{ success: true, data: { identification: {...}, engine: {...}, fuel: {...} } }`
6. Se trovato → mappa a `VehicleResult` → chiama `selectVehicleResult()` → auto-selezione + chiude modale
7. Se non trovato (`success: false` o `data` nullo) → `modal.results = []`, `modal.searched = true` → mostra "nessun risultato"

---

## Pre-compilazione campi nel form principale

| Campo form | Fonte risposta matricola |
|---|---|
| `car_brand_X` | `data.identification.make` |
| `car_model_X` | `data.identification.commercial_name` |
| `n_certificate_X` | `data.identification.type_approval` |
| `serial_number_X` | valore digitato dall'utente nella matricola |

---

## API

- **Endpoint:** `GET https://api.swisscarinfo.ch/v3/search?q=<serial>&type=matricule&lang=<lang>`
- **Auth:** header `X-API-Key`
- **Risposta `data`:** oggetto singolo (non array) con sezioni `identification`, `engine`, `fuel`, `_meta`
- **Quota:** separata dalla brand_model, 250 req/mese

---

## File da modificare

| File | Modifica |
|---|---|
| `swiss-car-info.service.ts` | Aggiunto metodo `searchBySerial(serial, lang)` + interfaccia `SwissCarInfoMatriculeResponse` |
| `automation-form.component.ts` | `modal.serialQuery`, `onModalSerialInput()`, logica esclusione, branch matricola in `onSearchVehicles()` |
| `automation-form.component.html` | Campo matricola + divisore "oppure" sopra la riga brand/model nel modale |
| `src/assets/i18n/de.json` | Chiave `automation.vehicle_search_serial_placeholder` + `automation.vehicle_search_serial_label` + `automation.vehicle_search_or_divider` |
| `src/assets/i18n/en.json` | Stesse chiavi |
| `src/assets/i18n/it.json` | Stesse chiavi |
| `src/assets/i18n/fr.json` | Stesse chiavi |

---

## Edge case

- Matricola < 9 cifre → non blocca la ricerca (l'API gestisce match parziali tramite USTRA/ASTRA)
- API non risponde / errore → `modal.results = []`, `modal.searched = true`, log console
- Veicolo non trovato per matricola → messaggio "nessun risultato" standard
- `selectVehicleResult()` già gestisce il `patchValue` sul form → si estende per includere `serial_number_X`
