# Sistema di Routing e Guard

## Configurazione delle Rotte

**File**: [app.routes.ts](../src/app/app.routes.ts)

Struttura gerarchica con tre gruppi di layout:

```typescript
routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },

  // Rotte non autenticate
  {
    path: '',
    component: LayoutUnauthedComponent,
    canActivate: [isNonAuthenticatedRoute],
    children: [
      { path: 'login', component: LoginComponent },
      { path: 'recover', component: RecoverComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'register/:consultantCode', component: RegisterComponent },
      { path: 'language_unauthed', component: LanguageComponent }
    ]
  },

  // Rotte autenticate
  {
    path: '',
    component: LayoutAuthedComponent,
    canActivate: [isAuthenticatedRoute],
    children: [
      { path: 'home', component: HomeComponent },
      { path: 'menu', component: MenuComponent },
      { path: 'policies', component: PoliciesComponent },
      { path: 'policy/:policyid', component: PolicyComponent },
      // ... altre rotte autenticate
    ]
  },

  // Rotte PDF
  {
    path: '',
    component: LayoutPDFComponent,
    canActivate: [isAuthenticatedRoute],
    children: [
      { path: 'file/:fileid', component: FileComponent },
      { path: 'jasper/:reportName/:contactId', component: FileComponent }
    ]
  },

  { path: '**', redirectTo: '/login', pathMatch: 'full' }
]
```

---

## Guard di Routing

**File**: [group.guard.ts](../src/app/guards/group.guard.ts)

### `isAuthenticatedRoute`
- Verifica `authService.isLogged()`
- Se non loggato → redirect a `/login`
- Restituisce `true` se autenticato

### `isNonAuthenticatedRoute`
- Verifica che l'utente NON sia loggato
- Se già loggato → redirect a `/home`
- Restituisce `true` se non autenticato
