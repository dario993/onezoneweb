# Flusso "Invia Mandato" — Nuovo bottone Home + pagine cliente/mandato

**Data creazione**: 2026-04-28 15:24
**Stato**: In attesa di conferma

---

## Obiettivo

Aggiungere un nuovo flusso "Invia mandato" partendo dalla Home page. Il flusso permette al consulente di:
1. Cliccare un bottone in Home per accedere a una lista clienti dedicata.
2. Aggiungere un nuovo cliente tramite un form di registrazione.
3. Visualizzare/aggiungere polizze del cliente appena creato.

Il flusso ricalca pagine già esistenti (`customers`, `register`, `policies`) ma su rotte e componenti separati per non interferire con la navigazione attuale.

---

## Architettura del flusso

```
Home (bottone "Invia mandato")
  └─> /customers-mandate                    (lista clienti — clone di /customers)
        └─> click "aggiungi cliente"
              └─> /customers-mandate-add    (form — clone di /register)
                    └─> submit con successo
                          └─> /customers-mandate-policies/:id  (clone di /policies)
```

L'`:id` finale è l'ID del contatto restituito dalla API `registerUser`.

---

## File da creare

### 1. Nuova pagina: `customers-mandate`
- `src/app/pages/customers-mandate/customers-mandate.component.ts`
- `src/app/pages/customers-mandate/customers-mandate.component.html`
- `src/app/pages/customers-mandate/customers-mandate.component.scss`

**Base**: clone di `src/app/pages/customers/`.
**Differenze**:
- Selettore: `page-customers-mandate`.
- Titolo header: nuova chiave i18n (es. `customersMandate.title` → "Invia mandato").
- `addCustomer()` → `this.router.navigate(['/customers-mandate-add'])` (invece di `/customer/add`).
- `openCustomer(customer)` → `this.router.navigate(['/customers-mandate-policies/' + customer.id])` (invece di `/policies/:id`).
- Mantiene: lazy-loading scroll, ricerca debounced, `loadContactPage`, ordinamento utente in cima, badge mandato.

### 2. Nuova pagina: `customers-mandate-add`
- `src/app/pages/customers-mandate-add/customers-mandate-add.component.ts`
- `src/app/pages/customers-mandate-add/customers-mandate-add.component.html`
- `src/app/pages/customers-mandate-add/customers-mandate-add.component.scss`

**Base**: clone di `src/app/pages/register/`.
**Differenze**:
- Selettore: `page-customers-mandate-add`.
- Toggle persona/azienda mantenuto identico.
- Tutti i campi mantenuti (name1, name2, address, postCode, city, birthday, mail, mobile, password).
- **Submit**: usa `brokerstarService.registerUser(payload)` come `RegisterComponent`, con la stessa logica di validazione e gestione errori (`violations`).
- **Differenza chiave nel post-submit**: invece di chiamare `login()` + `navigateTo('policyadd')`, naviga a `/customers-mandate-policies/{id}` dove `id` è l'`id` del contatto restituito da `registerUser` (campo `response.contact.id` o `response.id` a seconda della shape — da verificare durante implementazione).
- `_sendMail = false` (nessuna email di benvenuto all'utente creato).
- Branch `link` non necessario in questo contesto (rimosso o ignorato).

### 3. Nuova pagina: `customers-mandate-policies`
- `src/app/pages/customers-mandate-policies/customers-mandate-policies.component.ts`
- `src/app/pages/customers-mandate-policies/customers-mandate-policies.component.html`
- `src/app/pages/customers-mandate-policies/customers-mandate-policies.component.scss`

**Base**: clone di `src/app/pages/policies/`.
**Differenze**:
- Selettore: `page-customers-mandate-policies`.
- Legge il parametro `:id` dalla rotta e lo usa come `clientid` per `loadPolicies(clientid)` e `loadContact(clientid)`.
- `addPolicy()` e `openPolicy(id)` rimangono (per ora) invariati (navigano a `policyadd` / `policy/:id`). Da confermare con utente se serve un comportamento diverso.

---

## File da modificare

### 1. `src/app/app.routes.ts`
Aggiungere nel blocco `LayoutAuthedComponent`:
```ts
{ path: 'customers-mandate', component: CustomersMandateComponent },
{ path: 'customers-mandate-add', component: CustomersMandateAddComponent },
{ path: 'customers-mandate-policies/:id', component: CustomersMandatePoliciesComponent },
```
Più i 3 import in cima.

### 2. `src/app/pages/home/home.component.html`
Aggiungere un bottone "Invia mandato" (visibile a tutti gli utenti, salvo diversa indicazione) sopra o sotto il bottone "Genera Preventivi". Stile coerente con il bottone esistente:
```html
<button
  (click)="navigator.navigateTo('customers-mandate')"
  class="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200 mb-6 shadow-sm">
  <!-- icona -->
  {{ 'home.invia_mandato' | i18n }}
</button>
```

### 3. `src/app/pages/home/home.component.ts`
Nessuna logica aggiuntiva richiesta: `navigator` è già disponibile pubblicamente.

### 4. File i18n
Aggiungere chiavi i18n per:
- `home.invia_mandato` ("Invia mandato")
- `customersMandate.title` ("Invia mandato")
- (opzionale) chiavi specifiche per il nuovo form se si differenziano da `register.*`. **Decisione di default**: riutilizzare le chiavi esistenti `register.*` per evitare duplicazione.

### 5. `CLAUDE.md`
Aggiungere alla sezione "Documenti di Progetto (docs/)":
```
- `docs/2026-04-28-15-24-flusso-invia-mandato.md` — Flusso "Invia Mandato": bottone Home + pagine customers-mandate, customers-mandate-add, customers-mandate-policies/:id
```

---

## Note tecniche

- **Riuso vs duplicazione**: l'utente ha esplicitamente richiesto pagine separate (non parametrizzazione delle pagine esistenti). Si procede con clone fisico dei componenti.
- **Visibilità del bottone Home**: di default visibile a tutti gli utenti autenticati. Se deve essere limitato ai consulenti (`isConsultant`), va specificato.
- **Shape della response di `registerUser`**: da verificare in fase di implementazione per estrarre correttamente l'`id` del contatto creato. Probabilmente `response.id` o `response.contact.id`.
- **Auto-login dopo creazione**: nella `RegisterComponent` originale, dopo la registrazione viene effettuato il login automatico col nuovo utente. **In questo flusso non vogliamo cambiare la sessione del consulente**, quindi il login automatico va RIMOSSO. Si naviga direttamente a `customers-mandate-policies/:id` con la sessione attuale del consulente.
- **Nessuna modifica a `BrokerstarService`**: si riutilizzano `registerUser`, `loadContactPage`, `policyList`, `contact`, `contactGetAvatar`.

---

## Domande aperte (da chiarire prima dell'implementazione)

1. Il bottone "Invia mandato" in Home deve essere visibile a tutti o solo ai consulenti (`isConsultant`)?
2. Quale icona usare per il bottone "Invia mandato"?
3. Le pagine `customers-mandate-add` e `customers-mandate-policies/:id` devono mostrare lo stesso titolo "Invia mandato" oppure titoli specifici?
4. In `customers-mandate-policies/:id`, il bottone "Aggiungi polizza" deve restare attivo o va nascosto?
5. Confermare la rimozione del login automatico post-registrazione (la sessione del consulente non deve essere persa).

---

## Impatti

- **Nessun impatto** su pagine esistenti (`customers`, `register`, `policies`, `home` salvo aggiunta bottone).
- **Nessun impatto** su servizi (`BrokerstarService`, `AuthService`, `NavigatorService`).
- **Nuove rotte** registrate in `app.routes.ts`.
- **Nuove chiavi i18n** (minime: solo `home.invia_mandato` e `customersMandate.title`).
