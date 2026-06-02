# Blocco submit + modal "Non possibile calcolare l'offerta" se selezionate domande in Sezione 6

## Obiettivo

Se l'utente seleziona almeno una delle 3 checkbox della sezione "Altre domande" (`other_q_terminated`, `other_q_refused`, `other_q_license_suspension`), il form **non deve essere inviato**. Invece deve essere mostrato un modal con:

- Titolo: **"NON POSSIBILE CALCOLARE L'OFFERTA"** (tradotto)
- Elenco dei testi delle checkbox selezionate, nella lingua attualmente visualizzata

## Modifiche

### 1. `automation-form.component.ts`

- Aggiungere stato modal: `blockOfferModal = { open: false, items: [] as string[] }`
- Aggiungere metodo `closeBlockOfferModal()` che chiude il modal
- In `onSubmit()`, **dopo** il check `form.invalid`, prima del destructuring, verificare i 3 boolean:
  - Se almeno uno è `true`, popolare `blockOfferModal.items` con le traduzioni delle voci selezionate, aprire il modal e fare `return` (no submit, no loader)
- Reset `submitted = false` quando si chiude il modal? No, lasciare submitted true non causa problemi visivi qui dato che i 3 checkbox non hanno validators required.

### 2. `automation-form.component.html`

Aggiungere alla fine del file (dopo il modal esistente `modal.open`) un nuovo blocco:

```html
@if (blockOfferModal.open) {
<div class="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4"
     (click)="closeBlockOfferModal()">
  <div class="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
       (click)="$event.stopPropagation()">
    <h2 class="text-lg font-bold text-red-600 mb-4 text-center uppercase">
      {{ 'automation.block_offer_title' | i18n }}
    </h2>
    <ul class="list-disc pl-5 space-y-2 text-sm text-gray-700 mb-6">
      @for (item of blockOfferModal.items; track item) {
      <li>{{ item }}</li>
      }
    </ul>
    <button type="button"
            (click)="closeBlockOfferModal()"
            class="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg">
      {{ 'automation.block_offer_close' | i18n }}
    </button>
  </div>
</div>
}
```

### 3. i18n: 2 nuove chiavi in it/en/de/fr

- `block_offer_title`:
  - IT: "Non possibile calcolare l'offerta"
  - DE: "Angebot kann nicht berechnet werden"
  - EN: "Unable to calculate the offer"
  - FR: "Impossible de calculer l'offre"
- `block_offer_close`:
  - IT: "Chiudi"
  - DE: "Schliessen"
  - EN: "Close"
  - FR: "Fermer"

## Verifica

1. `npm start` → aprire form, compilare campi obbligatori
2. Selezionare una o più checkbox della sezione "Altre domande"
3. Cliccare "Invia": il form NON viene inviato (nessuna call di rete), si apre il modal con il titolo rosso e l'elenco delle voci selezionate (in lingua corrente)
4. Cliccare "Chiudi" o fuori dal modal → il modal si chiude
5. Deselezionare le checkbox e ri-inviare → submit normale verso API
6. Cambiare lingua → titolo e voci si traducono
