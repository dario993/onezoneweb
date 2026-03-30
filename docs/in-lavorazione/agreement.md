# Pagina Agreement (Mandato Broker)

## Scopo

Questa pagina permette all'utente di **firmare un mandato broker** (Brokermandat) e notificare le compagnie assicurative selezionate. In pratica, l'utente autorizza OneZone come proprio broker assicurativo.

## File coinvolti

- `src/app/pages/agreement/agreement.component.ts`
- `src/app/pages/agreement/agreement.component.html`
- `src/app/pages/agreement/agreement.component.scss`

## Flusso della pagina

### 1. Inizializzazione (`ngOnInit`)

- Legge dal `localStorage` la chiave `selectedPolicies` (salvata da una pagina precedente)
- Converte le polizze in una lista di assicurazioni con `id`, `name` e `selected: false`

### 2. Interfaccia utente

La pagina mostra, dall'alto verso il basso:

- **Titolo e testo introduttivo** — Spiega cos'è il mandato broker
- **Punti chiave** (con icone check) — Vantaggi del mandato
- **Checkbox "Mantieni consulente"** (`keepConsultant`) — Se spuntata, mostra la lista delle assicurazioni da cui l'utente può selezionare quali notificare
- **Lista assicurazioni** (visibile solo se `keepConsultant = true`) — Bottoni toggle per selezionare/deselezionare le singole compagnie
- **Download documento** — Genera un PDF Jasper del mandato nella lingua corrente (es. `BrokermandatIT`, `BrokermandatEN`, etc.) tramite la rotta `/jasper/:reportName/:contactId`
- **Area firma** — Un canvas HTML5 dove l'utente disegna la propria firma con il mouse
- **Link ai termini e condizioni** — Apre le AGB di OneZone nella lingua corrente
- **Bottone "Invia"**

### 3. Firma su canvas

- Il canvas cattura eventi `mousedown`, `mousemove`, `mouseup` per disegnare linee
- `clearSignature()` cancella la firma
- `isCanvasEmpty()` controlla pixel per pixel se il canvas è vuoto (verifica il canale alpha)

### 4. Submit (`submit()`)

Quando l'utente clicca "Invia":

1. Verifica che la firma non sia vuota
2. Converte il canvas in **base64 PNG** (`toDataURL`)
3. Chiama `brokerstarService.createSignetJasperreport()` — genera il report Jasper **con la firma** incorporata
4. In caso di successo, chiama `brokerstarService.mandateInformInsurances()` passando:
   - `newMandate = !keepConsultant` (se NON vuole mantenere il consulente attuale, è un nuovo mandato)
   - Un oggetto `{id: selected}` con le assicurazioni selezionate
5. Mostra un toast di successo e reindirizza a `/home`

### 5. Localizzazione

Il nome del report Jasper cambia in base alla lingua:

| Lingua | Nome report |
|--------|-------------|
| DE (default) | `Brokermandat` |
| EN | `BrokermandatEN` |
| FR | `BrokermandatFR` |
| IT | `BrokermandatIT` |
