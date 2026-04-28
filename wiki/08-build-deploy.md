# Build, Deployment e Configurazioni

## Comandi

```bash
npm start          # sviluppo su http://localhost:4200
npm run build      # produzione → dist/onezoneweb/
```

**Build produzione**: minificazione JS/CSS, tree-shaking, AOT, output hashing.
**Budget**: warning 500kB, error 1MB.

---

## Configurazioni

### TypeScript (`tsconfig.json`)
```json
{ "target": "ES2022", "module": "ES2022", "strict": true, "skipLibCheck": true }
```

### Tailwind (`tailwind.config.js`)
```javascript
content: ["./src/**/*.{html,ts}"]
```

### Prettier (`package.json`)
```json
{ "overrides": [{ "files": "*.html", "options": { "parser": "angular" } }] }
```

---

## Deployment

Requisiti: web server statico con supporto SPA (redirect tutto a `index.html`).

**Nginx**:
```nginx
location / { try_files $uri $uri/ /index.html; }
```

**Apache**:
```apache
RewriteCond %{REQUEST_FILENAME} !-f
RewriteCond %{REQUEST_FILENAME} !-d
RewriteRule . /index.html [L]
```

**Processo**: `npm run build` → upload `dist/onezoneweb/*` sul server.
