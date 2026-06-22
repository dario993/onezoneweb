# Email al backend BrokerStar — errore `Invalid contact_login_id`

## Versione italiana

**Oggetto:** `POST /mandate/inform-insurances` — errore "Invalid contact_login_id"

---

Ciao,

abbiamo implementato lato OneZone Web la modifica richiesta sulla chiamata `POST /api/v3/mandate/inform-insurances`, aggiungendo il campo `contact_login_id` al payload.

Durante i test la risposta è sempre la stessa:

```json
{"error":"Invalid contact_login_id","code":400}
```

Abbiamo provato due valori distinti per `contact_login_id`, entrambi rifiutati:

1. **`contact.id`** — l'id del contatto a cui si riferisce il mandato (es. `43296`)
2. **`contact.nr`** — il campo `nr` ricevuto nella risposta di `GET /api/v3/contact/{id}` (es. `41112` per lo stesso contatto `id=43296`)

Esempio di payload inviato (caso 2):

```json
{
  "_sendMail": true,
  "isNew": true,
  "insurances": {
    "412": true,
    "1866": false,
    "3427": false,
    "3929": true
  },
  "contact_login_id": 41112
}
```

Potete confermare:

- quale entità rappresenta `contact_login_id`?
- da quale endpoint/campo dobbiamo prenderne il valore?
- se possibile, un esempio di payload valido per un contatto di test

Grazie,
Dario

---

## Versione tedesca

**Betreff:** `POST /mandate/inform-insurances` — Fehler "Invalid contact_login_id"

---

Hallo,

wir haben auf der Seite OneZone Web die angeforderte Änderung am Aufruf `POST /api/v3/mandate/inform-insurances` umgesetzt und das Feld `contact_login_id` zum Payload hinzugefügt.

Bei unseren Tests erhalten wir jedoch immer dieselbe Antwort:

```json
{"error":"Invalid contact_login_id","code":400}
```

Wir haben zwei verschiedene Werte für `contact_login_id` ausprobiert, beide wurden abgelehnt:

1. **`contact.id`** — die ID des Kontakts, auf den sich das Mandat bezieht (z. B. `43296`)
2. **`contact.nr`** — das Feld `nr` aus der Antwort von `GET /api/v3/contact/{id}` (z. B. `41112` für denselben Kontakt mit `id=43296`)

Beispiel des gesendeten Payloads (Fall 2):

```json
{
  "_sendMail": true,
  "isNew": true,
  "insurances": {
    "412": true,
    "1866": false,
    "3427": false,
    "3929": true
  },
  "contact_login_id": 41112
}
```

Könnt ihr uns bitte bestätigen:

- welche Entität `contact_login_id` repräsentiert?
- aus welchem Endpoint/Feld der Wert entnommen werden soll?
- wenn möglich, ein Beispiel eines gültigen Payloads für einen Testkontakt?

Vielen Dank,
Dario
