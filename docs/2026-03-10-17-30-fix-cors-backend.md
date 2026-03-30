# Fix CORS - Richiesta OPTIONS bloccata con 401 Unauthorized

## Problema

Il frontend Angular (su `http://localhost:4200`) effettua una chiamata `GET /consultants/{onezone_id}` con header `Authorization: Bearer <api_key>`.

Il browser, prima della GET, invia automaticamente una richiesta **preflight OPTIONS** per verificare i permessi CORS. Questa richiesta OPTIONS **non contiene** l'header Authorization e il server risponde con **401 Unauthorized**, bloccando la chiamata effettiva.

### Log server

```
OPTIONS /consultants/33291 HTTP/1.1 → 401 Unauthorized
```

### Perché da Postman funziona?

Postman non è un browser e non applica la policy CORS, quindi invia direttamente la GET senza preflight OPTIONS.

## Soluzione richiesta

Aggiungere un middleware CORS al backend che:

1. Risponda con **200 OK** alle richieste `OPTIONS` senza richiedere autenticazione
2. Includa questi header nella risposta:
   - `Access-Control-Allow-Origin: *` (o l'origin specifico del frontend)
   - `Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS`
   - `Access-Control-Allow-Headers: Authorization, Content-Type, Accept`

## Esempi di implementazione

### FastAPI

```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Flask

```python
from flask_cors import CORS
CORS(app)
```

### Express (Node.js)

```javascript
const cors = require('cors');
app.use(cors());
```

### Django

```python
# pip install django-cors-headers

INSTALLED_APPS = [
    ...
    'corsheaders',
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # deve essere in cima
    ...
]

CORS_ALLOW_ALL_ORIGINS = True
```

## Endpoint interessati

Tutti gli endpoint chiamati dal frontend, in particolare:

- `GET /consultants/{onezone_id}`
- `POST /consultants`
- `POST /consultants/{id}/verify-login`
- `POST /consultants/{id}/credentials`
- `POST /extract-totp-secret`
- `POST /generate-quotes`
- `GET /quote-requests/{id}`

## Note

- Il middleware CORS deve essere applicato **prima** di qualsiasi middleware di autenticazione, in modo che le richieste OPTIONS vengano gestite senza passare dal controllo del token.
- In produzione, sostituire `allow_origins=["*"]` con gli origin specifici consentiti (es. `https://webapp.onezone.ch`).
