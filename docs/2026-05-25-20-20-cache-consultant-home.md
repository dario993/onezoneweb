# Cache risposta GET /consultants/{id} in Home (cache-first)

## Obiettivo

Evitare di chiamare `GET https://stage-api-car-scraping.onezone.ch/consultants/{id}` ad ogni ingresso in Home quando i dati del consulente sono già stati recuperati e salvati in localStorage.

## Strategia

**Cache-first** su `localStorage` (chiave `consultantData`):

- Se `consultantData` è presente e parseabile → ripopola `consultantApiKey` e `consultantDisabledScrapers` dai dati cached e **salta la chiamata API**.
- Altrimenti → esegui `automationService.getConsultant(onezoneId)`, salva la risposta completa come `consultantData` (JSON) oltre a `consultantApiKey` e `consultantDisabledScrapers`.

La cache viene già ripulita al logout da `StorageService.clear()`.

## Modifiche

- `src/app/pages/home/home.component.ts` (blocco `if (this.isConsultant)`, righe 92-108).

Nessuna modifica a `AutomationService.getConsultant` né ai consumer esistenti (`automation.service.ts`, `automation-form.component.ts`).

## Verifica

1. Primo accesso da consultant: GET `/consultants/{id}` parte, `consultantData` salvato in localStorage.
2. Secondo accesso: nessuna GET, cache utilizzata.
3. Logout: `consultantData` rimosso (via `clear()`).
4. Consultant non registrato (404): nessun `consultantData` salvato.
