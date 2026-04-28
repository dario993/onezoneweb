# Autenticazione e Autorizzazione

## Flusso di Login

```
┌──────────────┐
│  LoginPage   │
└──────┬───────┘
       │ 1. Submit (email, password)
       ▼
┌────────────────────┐
│ BrokerstarService  │
│   .login()         │
└──────┬─────────────┘
       │ 2. POST /api/v3/login
       │    Riceve: { token: "...", ... }
       ▼
┌────────────────┐
│  AuthService   │
│ .startSession()│
└──────┬─────────┘
       │ 3. Salva token (validità 24h)
       ▼
┌────────────────────┐
│ BrokerstarService  │
│    .userMe()       │
└──────┬─────────────┘
       │ 4. GET /api/v3/user/me
       ▼
┌────────────────┐
│ StorageService │  Salva: token, tokenValidUntil, userData
└──────┬─────────┘
       ▼
┌──────────────────┐
│ NavigatorService │  → /home
└──────────────────┘
```

## Validazione Token

```typescript
isLogged(): boolean {
  return (
    this.isAuth &&
    this.userData.contact &&
    this.token &&
    this.tokenValidUntil > new Date()
  );
}
```

Token JWT, durata 24 ore. Nessun refresh automatico (richiede re-login).

**Header API**: `Authorization: Bearer {token}`

## Flusso di Logout

```
authService.logout()
  → brokerstarService.logout()
  → authService.endSession()
  → rimuove token, tokenValidUntil, userData da StorageService
  → redirect a /login
```
