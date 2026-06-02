# Validator età minima 18 anni su `first_driving_license_date`

## Obiettivo

Aggiungere al campo `first_driving_license_date` del form in `automation-form.component.ts` un validator custom che verifichi che la data inserita corrisponda ad un'età calcolata (oggi − data) **maggiore o uguale a 18 anni**. Se l'età è inferiore a 18 il controllo deve risultare invalido.

## File coinvolti

- `src/app/pages/automation-form/automation-form.component.ts`
- `src/app/pages/automation-form/automation-form.component.html` (solo per eventuale messaggio di errore, se già presente uno schema di error message)

## Modifiche

### 1. Nuovo validator privato `minAgeValidator(minAge: number)`

- Riceve l'età minima (18) come parametro.
- Parsea la stringa in formato `GG.MM.AAAA`.
- Se la stringa è vuota → ritorna `null` (lascia gestire a `Validators.required`).
- Se il formato non è una data valida → ritorna `null` (lascia gestire al `Validators.pattern` già presente).
- Calcola l'età alla data odierna tenendo conto di mese e giorno (non solo differenza di anni).
- Se età < `minAge` → ritorna `{ minAge: { requiredAge: minAge, actualAge } }`.
- Altrimenti `null`.

### 2. Applicazione al control

Nel `this.fb.group({ ... })` (riga 665) sostituire:

```ts
first_driving_license_date: ['', [
  Validators.required,
  Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/)
]],
```

con:

```ts
first_driving_license_date: ['', [
  Validators.required,
  Validators.pattern(/^(0[1-9]|[12][0-9]|3[01])\.(0[1-9]|1[0-2])\.(19\d{2}|20[0-2]\d)$/),
  this.minAgeValidator(18),
]],
```

### 3. Template (opzionale)

Se nel template esiste già un blocco di error message per il campo, aggiungere un `*ngIf="form.get('first_driving_license_date')?.hasError('minAge')"` con testo "L'età calcolata deve essere di almeno 18 anni." (da valutare se già presente — verrà controllato in fase di implementazione).

## Logica calcolo età

```ts
const [dd, mm, yyyy] = value.split('.').map(Number);
const dob = new Date(yyyy, mm - 1, dd);
const today = new Date();
let age = today.getFullYear() - dob.getFullYear();
const monthDiff = today.getMonth() - dob.getMonth();
if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) age--;
```

## Impatti

- Nessun impatto su altri form/componenti.
- Il submit verrà bloccato (form invalido) se la data inserita corrisponde a un'età < 18.
- Compatibile con il `Validators.pattern` già esistente: in caso di formato sbagliato vince il pattern, in caso di formato valido ma età insufficiente vince `minAge`.

## Criteri di successo

1. Inserendo una data che dà età ≥ 18 → control valido (solo se anche pattern ok).
2. Inserendo una data che dà età < 18 → control invalido con errore `minAge`.
3. Campo vuoto → errore `required` (invariato).
4. Formato non valido → errore `pattern` (invariato).
