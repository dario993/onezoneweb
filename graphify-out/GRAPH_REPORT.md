# Graph Report - .  (2026-06-01)

## Corpus Check
- 128 files · ~144,499 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 669 nodes · 1420 edges · 52 communities (19 shown, 33 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 67 edges (avg confidence: 0.84)
- Token cost: 192,413 input · 48,101 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Agreement Page & App Shell|Agreement Page & App Shell]]
- [[_COMMUNITY_Backend Schemas (Pydantic Mock)|Backend Schemas (Pydantic Mock)]]
- [[_COMMUNITY_Automation Form Logic|Automation Form Logic]]
- [[_COMMUNITY_Automation Feature Module|Automation Feature Module]]
- [[_COMMUNITY_BrokerStar API Service|BrokerStar API Service]]
- [[_COMMUNITY_Helper Utilities|Helper Utilities]]
- [[_COMMUNITY_Automation Interfaces  Types|Automation Interfaces / Types]]
- [[_COMMUNITY_Policy Domain Model|Policy Domain Model]]
- [[_COMMUNITY_Automation Component Templates|Automation Component Templates]]
- [[_COMMUNITY_Automation Docs  Specs|Automation Docs / Specs]]
- [[_COMMUNITY_Swiss Car Info Vehicle Lookup|Swiss Car Info Vehicle Lookup]]
- [[_COMMUNITY_Customers List Page|Customers List Page]]
- [[_COMMUNITY_Customers Mandate List|Customers Mandate List]]
- [[_COMMUNITY_App Bootstrap & Routing|App Bootstrap & Routing]]
- [[_COMMUNITY_Consultant Automation Panel|Consultant Automation Panel]]
- [[_COMMUNITY_Agreement Signature Canvas|Agreement Signature Canvas]]
- [[_COMMUNITY_Offers  Tender Page|Offers / Tender Page]]
- [[_COMMUNITY_Policy Add Form|Policy Add Form]]
- [[_COMMUNITY_Automation Setup Wizard|Automation Setup Wizard]]
- [[_COMMUNITY_Form Mandate Wefox|Form Mandate Wefox]]
- [[_COMMUNITY_Locality  PLZ Lookup|Locality / PLZ Lookup]]
- [[_COMMUNITY_Profile Page|Profile Page]]
- [[_COMMUNITY_Mandate Submission Flow|Mandate Submission Flow]]
- [[_COMMUNITY_Mandate Policies Page|Mandate Policies Page]]
- [[_COMMUNITY_Authed Layout|Authed Layout]]
- [[_COMMUNITY_Customers Mandate Add|Customers Mandate Add]]
- [[_COMMUNITY_Policies List|Policies List]]
- [[_COMMUNITY_Register Page|Register Page]]
- [[_COMMUNITY_File Viewer  Jasper|File Viewer / Jasper]]
- [[_COMMUNITY_Unauthed Layout|Unauthed Layout]]
- [[_COMMUNITY_Login Page|Login Page]]
- [[_COMMUNITY_Password Recovery|Password Recovery]]
- [[_COMMUNITY_Layout Rotation Animation|Layout Rotation Animation]]
- [[_COMMUNITY_Language Switcher|Language Switcher]]
- [[_COMMUNITY_Policy Calculate  Compare|Policy Calculate / Compare]]
- [[_COMMUNITY_i18n Service & Reload Fix|i18n Service & Reload Fix]]
- [[_COMMUNITY_Polling & JWT Auth Docs|Polling & JWT Auth Docs]]
- [[_COMMUNITY_Two-Level Auth Setup|Two-Level Auth Setup]]
- [[_COMMUNITY_Auth & Menu Consultant Gate|Auth & Menu Consultant Gate]]
- [[_COMMUNITY_HTTP Enums|HTTP Enums]]
- [[_COMMUNITY_Route Guards|Route Guards]]
- [[_COMMUNITY_Menu Component|Menu Component]]
- [[_COMMUNITY_Policy Select|Policy Select]]
- [[_COMMUNITY_App Component|App Component]]
- [[_COMMUNITY_CORS Preflight Fix|CORS Preflight Fix]]
- [[_COMMUNITY_FileComponent Loading Fix|FileComponent Loading Fix]]
- [[_COMMUNITY_Matricola Vehicle Search Spec|Matricola Vehicle Search Spec]]
- [[_COMMUNITY_Screenshot Reference|Screenshot Reference]]
- [[_COMMUNITY_Agreement WIP Note|Agreement WIP Note]]
- [[_COMMUNITY_Policy Add WIP Note|Policy Add WIP Note]]
- [[_COMMUNITY_HTTP Status Enum|HTTP Status Enum]]

## God Nodes (most connected - your core abstractions)
1. `BrokerstarService` - 84 edges
2. `I18nService` - 54 edges
3. `LoaderService` - 53 edges
4. `AutomationFormComponent` - 51 edges
5. `NavigatorService` - 51 edges
6. `AuthService` - 45 edges
7. `ToasterService` - 33 edges
8. `isset()` - 30 edges
9. `I18nPipe` - 29 edges
10. `AutomationService` - 27 edges

## Surprising Connections (you probably didn't know these)
- `SwissCarInfo v3 API` --semantically_similar_to--> `vehicles.json (asset statico)`  [INFERRED] [semantically similar]
  docs/2026-05-18-17-00-marca-modello-api-swisscarinfo.md → src/assets/vehicles.json
- `Salvataggio api_key consulente al login` --references--> `HomeComponent`  [EXTRACTED]
  docs/2026-03-10-17-07-consultant-api-key-login.md → src/app/pages/home/home.component.ts
- `Struttura App e Inventario UI per Redesign` --references--> `HomeComponent`  [EXTRACTED]
  docs/2026-05-22-15-17-struttura-app-per-redesign.md → src/app/pages/home/home.component.ts
- `Cache-first GET /consultants/{id} in Home` --references--> `HomeComponent`  [EXTRACTED]
  docs/2026-05-25-20-20-cache-consultant-home.md → src/app/pages/home/home.component.ts
- `Cache-first banner Home` --references--> `HomeComponent`  [EXTRACTED]
  docs/2026-05-25-20-25-cache-banner-home.md → src/app/pages/home/home.component.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Cache-first localStorage pattern in Home** — home_component, docs_2026_05_25_20_20_cache_consultant_home, docs_2026_05_25_20_25_cache_banner_home, docs_2026_05_25_20_30_cache_verify_login_home [EXTRACTED 1.00]
- **Flusso Invia Mandato end-to-end** — home_component, customers_mandate_component, customers_mandate_add_component, customers_mandate_policies_component, brokerstar_service [EXTRACTED 1.00]
- **Pipeline preventivi automation (setup + form + service)** — automation_setup_component, automation_form_component, automation_service, consultant_automation_component [EXTRACTED 1.00]
- **Automation feature stack** — concept_automation_form_component, concept_automation_service, concept_ecohub_wizard [INFERRED 0.85]
- **Two-level authentication flow** — concept_admin_api_key, concept_consultant_api_key, concept_totp_secret [INFERRED 0.85]
- **Other questions block-offer flow** — docs_2026_05_26_18_31_other_questions_checkbox, docs_2026_05_26_18_57_block_offer_other_questions, concept_other_questions [EXTRACTED 1.00]
- **Angular app bootstrap composition** — app_app_root, app_app_config, app_app_routes [INFERRED 0.85]
- **Three-layout routing structure** — authed_authed_layoutauthedcomponent, unauthed_unauthed_layoutunauthedcomponent, pdf_pdf_layoutpdfcomponent, app_app_routes [INFERRED 0.85]
- **Mandate submission multi-step flow** — customers-mandate_customers-mandate_component, customers-mandate-add_customers-mandate-add_component, customers-mandate-policies_customers-mandate-policies_component [INFERRED 0.85]
- **Consultant automation pipeline** — consultant-automation_consultant-automation_component, automation-setup_automation-setup_component, automation-form_automation-form_component [INFERRED 0.85]
- **Policy lifecycle pages** — policies_policies_component, policy_policy_component, policyadd_policyadd_component [INFERRED 0.85]
- **Quote calculation flow** — policycalculate_policycalculate_component, policyselect_policyselect_component, home_home_component [INFERRED 0.75]
- **Auth/session flow** — login_login_component, profile_profile_component, menu_menu_component [INFERRED 0.85]
- **Authentication & session flow** — services_auth_service, services_brokerstar_service, services_storage_service [INFERRED 0.95]
- **i18n stack (pipe + service + files)** — pipes_i18n_pipe, services_i18n_service, services_i18nfile_service [INFERRED 0.95]
- **Register-then-login flow** — register_register_component, services_brokerstar_service, services_auth_service [INFERRED 0.85]

## Communities (52 total, 33 thin omitted)

### Community 0 - "Agreement Page & App Shell"
Cohesion: 0.08
Nodes (25): clone(), convertStringToJSON(), getDayFormatted(), getMonthFormatted(), isset(), isString(), isTrue(), Auto Quote Automation Entry (+17 more)

### Community 1 - "Backend Schemas (Pydantic Mock)"
Cohesion: 0.08
Nodes (36): Any, BaseModel, bool, Enum, int, str, Gap analysis frontend-backend, calculate_vehicle_age() (+28 more)

### Community 3 - "Automation Feature Module"
Cohesion: 0.06
Nodes (39): LayoutAuthed, AutomationFormComponent, AutomationService, AutomationSetupComponent, BrokerstarService, Stale-While-Revalidate caching pattern, ConsultantAutomationComponent, CustomersComponent (+31 more)

### Community 5 - "Helper Utilities"
Cohesion: 0.10
Nodes (14): cleanupArray(), cleanupObject(), convertJSONToString(), deepMergeObject(), getDatetimeFromTimestamp(), isArray(), isObject(), normalizeTimestamp() (+6 more)

### Community 6 - "Automation Interfaces / Types"
Cohesion: 0.17
Nodes (12): CheckLoginResponse, ConsultantRegistrationPayload, ConsultantRegistrationResponse, CredentialsUpdateResponse, EcoHubSetupPayload, ExtractTotpPayload, ExtractTotpResponse, GenerateQuotesResponse (+4 more)

### Community 7 - "Policy Domain Model"
Cohesion: 0.11
Nodes (5): policy-by-client.interface, PolicyInterface, PolicyPremiumInterface, PolicyComponent, ReportComponent

### Community 8 - "Automation Component Templates"
Cohesion: 0.12
Nodes (7): AutomationFormComponent, AutomationSetupComponent, Automation Quote Generation, Consultant Management, ConsultantAutomationComponent, ConsultantComponent, IContact

### Community 9 - "Automation Docs / Specs"
Cohesion: 0.14
Nodes (17): AutomationFormComponent, AutomationService, EcoHub Wizard, other_questions field, TOTP secret extraction, Validator eta patente, Descrizione storico sinistri, Other questions checkbox (+9 more)

### Community 10 - "Swiss Car Info Vehicle Lookup"
Cohesion: 0.16
Nodes (7): VehicleResult, SwissCarInfoItem, SwissCarInfoMatriculeData, SwissCarInfoMatriculeResponse, SwissCarInfoResponse, SwissCarInfoService, VehicleSearchResult

### Community 13 - "App Bootstrap & Routing"
Cohesion: 0.19
Nodes (7): appConfig, App Component, routes, isAuthenticatedRoute(), isNonAuthenticatedRoute(), LayoutPDFComponent, LayoutPDFComponent

### Community 14 - "Consultant Automation Panel"
Cohesion: 0.19
Nodes (3): ConsultantAutomationComponent, ConsultantItem, PatchConsultantPayload

### Community 22 - "Mandate Submission Flow"
Cohesion: 0.28
Nodes (5): Mandate Submission Flow, CustomersMandateAddComponent, CustomersMandatePoliciesComponent, CustomersMandateComponent, FormMandateWefoxComponent

### Community 32 - "Layout Rotation Animation"
Cohesion: 0.50
Nodes (3): LayoutAuthedComponent, Loading rotation animation, LayoutUnauthedComponent

### Community 35 - "i18n Service & Reload Fix"
Cohesion: 0.50
Nodes (4): I18nService, LanguageComponent, Fix cambio lingua reload, Conversazione fix cambio lingua

### Community 36 - "Polling & JWT Auth Docs"
Cohesion: 0.50
Nodes (4): Asynchronous polling pattern, Bearer JWT Authentication, Polling Asincrono dopo generate-quotes, Frontend Integration Guide

### Community 37 - "Two-Level Auth Setup"
Cohesion: 0.67
Nodes (4): ADMIN_API_KEY auth, Consultant api_key, Autenticazione due livelli, Flusso registrazione consulente

### Community 38 - "Auth & Menu Consultant Gate"
Cohesion: 0.67
Nodes (3): AuthService, Pannello Gestione Consulenti in Menu, MenuComponent

### Community 40 - "Route Guards"
Cohesion: 1.00
Nodes (3): Angular route guard, isAuthenticatedRoute, isNonAuthenticatedRoute

## Knowledge Gaps
- **57 isolated node(s):** `appConfig`, `EHttpMethods`, `EHttpStatusCodes`, `CacheEntry`, `CacheEntry` (+52 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **33 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `AutomationFormComponent` connect `Automation Form Logic` to `Swiss Car Info Vehicle Lookup`, `Locality / PLZ Lookup`, `App Bootstrap & Routing`?**
  _High betweenness centrality (0.109) - this node is a cross-community bridge._
- **Why does `BrokerstarService` connect `BrokerStar API Service` to `Agreement Page & App Shell`, `Helper Utilities`, `Customers List Page`, `Customers Mandate List`, `Contact List Pagination`, `Policy Add Form`, `Profile Page`, `Customers Mandate Add`, `File Viewer / Jasper`, `Password Recovery`?**
  _High betweenness centrality (0.102) - this node is a cross-community bridge._
- **Why does `AutomationService` connect `Locality / PLZ Lookup` to `Agreement Page & App Shell`, `Helper Utilities`, `Automation Interfaces / Types`, `Swiss Car Info Vehicle Lookup`, `Consultant Automation Panel`, `Automation Setup Wizard`?**
  _High betweenness centrality (0.037) - this node is a cross-community bridge._
- **What connects `appConfig`, `EHttpMethods`, `EHttpStatusCodes` to the rest of the system?**
  _65 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Agreement Page & App Shell` be split into smaller, more focused modules?**
  _Cohesion score 0.0777085496711665 - nodes in this community are weakly interconnected._
- **Should `Backend Schemas (Pydantic Mock)` be split into smaller, more focused modules?**
  _Cohesion score 0.08067375886524823 - nodes in this community are weakly interconnected._
- **Should `Automation Form Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.05217391304347826 - nodes in this community are weakly interconnected._