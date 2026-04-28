# Form Mandate Wefox - Nuova Pagina

## Obiettivo

Creare una nuova pagina `form-mandate-wefox` che replica il form "Mandate einreichen" di Wefox, utilizzando la stessa grafica e struttura del componente `automation-form`.

## Campi del Form

Il form replica fedelmente i campi del form Wefox originale:

### Sezione 1: Dati Personali
| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| Anrede | Select (Firma/Mann/Frau) | Si | Se "Firma" selezionato, mostra campo Firmenname |
| Firmenname (gemäss HR-Auszug) | Text | Si (condizionale) | Visibile solo se Anrede = "Firma" |
| Vorname | Text | Si | |
| Nachname | Text | Si | |

### Sezione 2: Indirizzo
| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| Strasse | Text | Si | Layout 50/50 con Hausnummer |
| Hausnummer | Text | Si | Layout 50/50 con Strasse |
| PLZ | Text | Si | Layout 50/50 con Ort |
| Ort | Text | Si | Layout 50/50 con PLZ |

### Sezione 3: Contatti
| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| Email | Email | Si* | Layout 50/50 con Mobile |
| Mobile | Tel | Si* | Layout 50/50 con Email |

### Sezione 4: Upload Documenti
| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| Upload Mandat | File (PDF) | No | Max 67MB, drag & drop, descrizione: "Hier das unterschriebene Mandat hochladen" |
| Upload Ausweiskopie | File (immagine) | No | Max 67MB, drag & drop, accetta JPG/PNG/GIF |

### Sezione 5: Versicherungsgesellschaften (Compagnie Assicurative)
| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| Versicherungsgesellschaften | Checkbox multipli | No | 36 compagnie, layout a 4 colonne. Descrizione: "Bei welchen Gesellschaften soll das Mandat eingereicht werden?" |

Lista compagnie: Allianz, ASGA, Automate, AXA, Baloise, Belsura, Coop RSV, Dextra, Elips, Emilia, Emmental, Generali, Groupe Mutuel, GVB Gebäude, Helsana, Helvetia, Innova, Liberty, Mobiliar, ÖKK, Orion, PAX, PK Pro - Tellco, Profond, Protekta, Simpego, Smile, Solida, Swica, Swiss Life, Sympany, TSM, Vaudoise, Valitas, Visana, Zürich

### Sezione 6: Berater (Consulente)
| Campo | Tipo | Obbligatorio | Note |
|-------|------|-------------|------|
| Berater | Select | No | Lista consulenti con codice (es. "Arfaoui Hamdi - F01493007") |

Lista consulenti: 56 consulenti predefiniti (lista hardcoded nel componente).

### Pulsante Submit
- Testo: "Mandat einreichen"

## File da Creare

1. **`src/app/pages/form-mandate-wefox/form-mandate-wefox.component.ts`** - Componente standalone Angular
2. **`src/app/pages/form-mandate-wefox/form-mandate-wefox.component.html`** - Template HTML con stile identico a `automation-form`

## File da Modificare

1. **`src/app/app.routes.ts`** - Aggiungere la rotta `/form-mandate-wefox` (rotta pubblica, accessibile senza autenticazione, dentro layout `unauthed`)

## Grafica e Stile

La grafica replica esattamente lo stile di `automation-form`:
- Container: `max-w-3xl mx-auto p-4 pb-12`
- Sezioni: `bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6`
- Titoli sezione: `text-lg font-semibold text-gray-700 mb-4 border-b pb-2`
- Label: `block text-sm font-medium text-gray-600 mb-1`
- Input: `w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500`
- Errori: `text-xs text-red-500 mt-1`
- Hint: `text-xs text-gray-400 mt-1`
- Grid layout: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Pulsante submit: stile consistente con automation-form
- Messaggio successo post-invio con check verde

## Logica del Componente

- **Reactive Form** con `FormGroup` e validatori
- **Logica condizionale**: campo Firmenname visibile solo se Anrede = "Firma"
- **Validazione**: campi obbligatori con messaggi di errore inline
- **File upload**: gestione file con drag & drop (stile area upload con icona SVG)
- **Submit**: al submit, i dati vengono raccolti e inviati (endpoint da definire, per ora solo log in console + messaggio di successo)
- **Nessuna internazionalizzazione**: il form è solo in tedesco (DE) come l'originale Wefox

## Impatto su Componenti Esistenti

- Nessun impatto su componenti esistenti
- La rotta è pubblica e indipendente
- Nessuna dipendenza da servizi di autenticazione
