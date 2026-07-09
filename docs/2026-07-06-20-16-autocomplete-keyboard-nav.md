# Navigazione da tastiera nei dropdown di autocomplete indirizzo

**Data**: 2026-07-06 20:16
**Scope**: `automation-form` + `customers-mandate-add` (persona/azienda)

## Obiettivo

Aggiungere navigazione da tastiera (ArrowDown/ArrowUp/Home/End/Enter/Escape) ai dropdown di autocomplete di CAP, Località e Indirizzo, con attributi ARIA (`role="combobox"/"listbox"/"option"`, `aria-activedescendant`, `aria-expanded`, `aria-autocomplete="list"`, `aria-selected`). Nessuna dipendenza aggiuntiva.

## Modifiche

### `automation-form.component.ts`
- Aggiunti `plzActiveIndex`, `areaActiveIndex`, `addressActiveIndex` (inizializzati a `-1`).
- Nuovo metodo pubblico `onDropdownKeydown<T>(event, items, isOpen, activeIndex, setActive, onSelect, onClose)`.
- Reset degli indici in tutti i metodi che aggiornano/chiudono i dropdown (`onPlzInput`, `selectPlz`, `hidePlzDropdown`, `onAreaFocus`, `selectArea`, `hideAreaDropdown`, subscription `addressInput$`, `onAddressInput`, `selectStreet`, `hideAddressDropdown`).

### `automation-form.component.html`
- Input zip/area/address: `role="combobox"`, `aria-autocomplete="list"`, `[attr.aria-expanded]`, `[attr.aria-controls]`, `[attr.aria-activedescendant]`, `(keydown)="onDropdownKeydown(...)"`.
- `<ul>`: `id="plz-listbox|area-listbox|address-listbox"`, `role="listbox"`.
- `<li>`: `[id]="'plz-opt-'+$index"`, `role="option"`, `[attr.aria-selected]`, `[class.bg-blue-100]`, `(mouseenter)`. `@for` con `let i = $index`.

### `customers-mandate-add.component.ts`
- Stesse aggiunte di sopra (indici + `onDropdownKeydown` + reset).

### `customers-mandate-add.component.html`
- Stesse modifiche template applicate ai 6 blocchi (3 persona + 3 azienda). I due set non coesistono mai nel DOM (guardati da `*ngIf` su `registerType`), quindi gli id ARIA non collidono.

## Comportamento

- Focus sull'input → si apre il dropdown (per CAP/via al digitare, per località al focus) → ArrowDown evidenzia la prima voce.
- ArrowDown/Up con wrap circolare; Home/End vanno a inizio/fine.
- Enter conferma la voce evidenziata; Esc chiude senza selezionare.
- Con dropdown chiuso il tasto Enter non è intercettato (guard `!isOpen`), il submit del form resta normale.
- `mouseenter` sulle voci sincronizza `activeIndex` con l'hover del mouse.
- Il click continua a funzionare (`mousedown` invariato).

## File modificati

- `src/app/pages/automation-form/automation-form.component.ts`
- `src/app/pages/automation-form/automation-form.component.html`
- `src/app/pages/customers-mandate-add/customers-mandate-add.component.ts`
- `src/app/pages/customers-mandate-add/customers-mandate-add.component.html`

Nessuna modifica a servizi, interfacce, i18n o `package.json`.
