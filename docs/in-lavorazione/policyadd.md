# Pagina PolicyAdd (Aggiunta Polizza / Selezione Assicurazioni)

## Scopo

Questa pagina permette all'utente di **selezionare compagnie assicurative** da notificare per l'aggiunta di nuove polizze. In base alla presenza o meno di un mandato broker già firmato, l'utente viene reindirizzato alla pagina di firma (Agreement) oppure la notifica viene inviata direttamente.

## File coinvolti

- `src/app/pages/policyadd/policyadd.component.ts`
- `src/app/pages/policyadd/policyadd.component.html`
- `src/app/pages/policyadd/policyadd.component.scss`

## Flusso della pagina

### 1. Inizializzazione (costruttore)

- Chiama `brokerstarService.insurance()` per caricare la lista di tutte le compagnie assicurative disponibili
- Mappa la risposta in un array di oggetti `{ id, name, selected: false }`
- Mostra un loader durante il caricamento

### 2. Interfaccia utente

La pagina mostra:

- **Titolo e testo descrittivo** — Spiega all'utente cosa fare
- **Lista assicurazioni** — Bottoni toggle per selezionare/deselezionare le compagnie assicurative. Ogni bottone mostra:
  - Nome della compagnia
  - Icona check (cerchio blu con spunta) se selezionata
  - Cerchio vuoto se non selezionata
- **Bottone "Invia"** — Procede con il submit

### 3. Submit (`submit()`)

Quando l'utente clicca il bottone:

1. Mostra il loader
2. Chiama `brokerstarService.getDocumentCategoryItemInfo()` con l'ID del contatto corrente per verificare se esiste già un mandato broker firmato
3. **Due percorsi possibili**:

#### Percorso A — Mandato già esistente (`hasFileResponseValidID` = true)

- Chiama direttamente `brokerstarService.mandateInformInsurances()` passando:
  - `newMandate = false` (non è un nuovo mandato)
  - Un oggetto con gli ID delle assicurazioni selezionate, tutti con valore `false`
- Mostra un toast di successo
- Reindirizza a `/home`

#### Percorso B — Nessun mandato esistente (`hasFileResponseValidID` = false)

- Salva le polizze selezionate nel `localStorage` con chiave `selectedPolicies`
- Reindirizza a `/agreement` dove l'utente dovrà firmare il mandato broker

### 4. Verifica mandato esistente (`hasFileResponseValidID()`)

- Riceve la risposta di `getDocumentCategoryItemInfo`
- Scorre tutti gli elementi in `responseData.data`
- Restituisce `true` se almeno un elemento ha un `file.id` valido (cioè esiste un documento di mandato già firmato)

## Relazione con Agreement

Questa pagina è il **predecessore** della pagina Agreement:

```
PolicyAdd → (se mandato non esiste) → Agreement (firma mandato)
PolicyAdd → (se mandato esiste) → notifica diretta + redirect a Home
```

Le polizze selezionate vengono passate ad Agreement tramite `localStorage` (`selectedPolicies`).

## Note

- La variabile `alwaysToAgreement` (default `false`) è una flag di debug: se impostata a `true`, forza sempre il redirect alla pagina Agreement indipendentemente dall'esistenza del mandato.
