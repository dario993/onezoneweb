# Bottone "Invia mandato" in Home

**Data**: 2026-06-02 15:27

## Obiettivo

Aggiungere un bottone "Invia mandato" nella home page, **visibile solo ai consulenti** (`isConsultant === true`), posizionato **sopra** al bottone "Genera Preventivi" già esistente.

Il click sul bottone naviga verso la rotta `/customers-mandate` (pagina `CustomersMandateComponent`, già registrata in `app.routes.ts:82`).

## File modificati

- `src/app/pages/home/home.component.html` — aggiunta del nuovo bottone

Nessuna modifica al `.ts`: si riusa il `navigator` già iniettato nel componente e la flag `isConsultant` già esistente.

## i18n

Chiave riutilizzata (già presente in tutti e 4 i file `it/en/de/fr.json`):

- `home.invia_mandato`
  - IT: "Invia mandato"
  - EN: "Submit mandate"
  - DE: "Mandat einreichen"
  - FR: "Soumettre mandat"

Nessuna nuova chiave da creare.

## Dettagli implementativi

Il nuovo bottone segue lo stesso markup/stile del bottone "Genera Preventivi" (stesso wrapper `bg-white rounded-lg shadow-sm overflow-hidden mb-6`, stesso layout interno con chevron). Viene inserito nello stesso blocco `@if (isConsultant) { ... }` per garantire la visibilità ristretta ai consulenti.

```html
@if (isConsultant) {
<div class="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
  <button
    (click)="navigator.navigateTo('/customers-mandate')"
    class="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
    <span class="text-gray-800 font-medium">{{ 'home.invia_mandato' | i18n }}</span>
    <img src="assets/icons/ozo/chevron-right-solid.png" alt="Go to" class="h-3 opacity-60" />
  </button>
</div>
<!-- bottone Genera Preventivi esistente -->
}
```

## Impatti

Nessun impatto su altri componenti o servizi. Modifica puramente additiva al template della home.
