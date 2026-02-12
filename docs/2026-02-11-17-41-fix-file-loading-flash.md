# Fix Flash "Not Supported" nel FileComponent

## Data: 2026-02-11 17:41

## Problema
Quando si accede a `/file/:fileid`, il messaggio "This file type is not supported for preview." appare per alcuni istanti prima che il file venga effettivamente caricato e identificato. Questo accade perché `filetype` è inizializzato a `'other'` e viene aggiornato solo al termine delle chiamate API asincrone.

## Soluzione
Aggiungere uno stato `'loading'` al tipo di `filetype` per evitare che venga mostrato qualsiasi blocco di contenuto prima che il tipo del file sia determinato.

## File Modificati

### `src/app/pages/file/file.component.ts`
- Cambiare il tipo di `filetype` da `'pdf' | 'image' | 'other'` a `'pdf' | 'image' | 'other' | 'loading'`
- Inizializzare `filetype` a `'loading'`
- Nel metodo `loadFile`, impostare esplicitamente `filetype = 'other'` nel callback `onloadend` se il file non è né PDF né immagine

### `src/app/pages/file/file.component.html`
- Aggiungere un blocco `@if (filetype === 'loading')` con un indicatore di caricamento

## Impatti
- Nessun impatto su altri componenti
- Il comportamento per Jasper Report non cambia (imposta già `filetype = 'pdf'` prima del caricamento)
