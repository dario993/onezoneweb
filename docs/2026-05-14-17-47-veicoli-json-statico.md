# Veicoli: JSON Statico da CSV per Marca e Modello

## Contesto

Il form `automation-form` ha attualmente:
- `car_brand_1` / `car_brand_2`: `<select>` con ~70 marche hardcoded nel componente
- `car_model_1` / `car_model_2`: `<input type="text">` libero

Il CSV delle omologazioni svizzere (300MB, 3M righe) contiene 54.998 coppie uniche `(makeName, commercialName)`. Questo numero è gestibile come asset statico Angular.

## Obiettivo

Sostituire la lista hardcoded e i campi liberi con dati reali dal CSV, senza aggiungere alcun server o API.

## Approccio: JSON statico in `src/assets/`

Struttura del JSON generato:

```json
{
  "ALFA ROMEO": ["145 1.9 TD", "146 1.9 TD", "147 1.6 TS", ...],
  "BMW": ["116i", "118d", "320d", ...],
  ...
}
```

Peso stimato: ~3-4MB non compresso, ~500-800KB con gzip (servito automaticamente da Angular/HTTP).

## File da creare/modificare

### 1. Script Python di conversione (una tantum, locale)
`scripts/extract_vehicles.py`
- Legge il CSV (separatore `;`, encoding latin-1 o utf-8)
- Estrae colonne `makeName` (col 9) e `commercialName` (col 10)
- Deduplica, ordina marche e modelli alfabeticamente
- Scrive `src/assets/vehicles.json`

### 2. `src/assets/vehicles.json` (generato dallo script)
Asset statico caricato una volta e cachato dal browser.

### 3. `src/app/pages/automation-form/automation-form.component.ts`
- Aggiungere `HttpClient` agli imports
- Aggiungere proprietà `vehiclesMap: Record<string, string[]> = {}`
- Aggiungere `makes: string[] = []` (lista marche per i select)
- Metodo `getModels(brand: string): string[]` che restituisce i modelli della marca
- In `ngOnInit`: carica il JSON via `HttpClient.get('/assets/vehicles.json')`, popola `vehiclesMap` e `makes`
- Rimuovere l'array hardcoded `carBrandOptions`

### 4. `src/app/pages/automation-form/automation-form.component.html`
- Brand: i `<select>` già esistenti vengono popolati con `makes` invece di `carBrandOptions`
- Model: cambiare da `<input type="text">` a `<select>` i cui options dipendono dalla marca selezionata
  - Se la marca cambia (via `valueChanges`), resettare il campo modello
  - Se nessuna marca è selezionata, il select modello è disabilitato

## Logica UX

```
Utente seleziona marca → modelli filtrati nel select sottostante
Utente cambia marca → campo modello resettato
Nessuna marca → select modello disabilitato con placeholder
```

## Impatto su componenti esistenti

- Nessun impatto su altri componenti
- Il form value (`car_brand_1`, `car_model_1`) rimane identico: solo le marche avranno il formato del CSV (es. "ALFA ROMEO" invece di "Alfa Romeo") — da valutare se normalizzare nel JSON

## Note

- Il CSV usa separatore `;` e potrebbe avere encoding non-UTF8
- Il campo `makeName` è in colonna 9 (indice 8), `commercialName` in colonna 10 (indice 9)
- Alcune righe potrebbero avere `commercialName` vuoto: da escludere
- Lo script va eseguito una volta sola in locale, il JSON risultante va committato nel repo
