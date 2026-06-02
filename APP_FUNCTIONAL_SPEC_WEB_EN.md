# OneZone Web — Application Functional Specification

> This document describes **what the application does** and **what each page does** from the user's point of view. It does not contain implementation choices: framework, UI library, state management, code structure and naming are entirely left to the development team that will handle the rewrite.

---

## 1. Application overview

OneZone Web is a digital portal for **insurance management** aimed at the Swiss market. The application connects two main types of users:

- **End customers** (individuals or companies): they consult their own policies, download documents, receive and manage insurance offers, communicate with their trusted advisor, and submit management mandates.
- **Insurance advisors**: they manage a customer portfolio, register new customers, generate automatic quotes for car insurance policies by querying several insurance companies in a single operation, collect and manage signed mandates, and monitor the status of the offers produced.

In addition to these two categories there is a **restricted administrative role**, assigned to very few specific accounts, with access to a supervision panel for the entire advisor network.

### Value delivered

- **For the customer:** a single point of access to all policies, documents, claim history and personal offers, with the ability to respond to the advisor's proposals without exchanging emails or paper.
- **For the advisor:** automation of the car quoting process (data collected only once, simultaneous querying of multiple companies), structured mandate management, centralized customer master data.
- **For the network:** administrative control over which advisors are active and which companies each one can query.

### Supported languages

The application is available in **German, Italian, French and English**. German is the default language. The language can be changed at any time, both before login and as an authenticated user, and the preference is remembered across sessions.

### Visual identity

The portal has its own brand identity (OneZone logo, coordinated color palette). The rewrite can propose a new graphical interface: in this document we describe only *what* must be shown and *how* it must behave, not its aesthetic appearance.

---

## 2. Cross-cutting features

These capabilities are present throughout the application and every page relies on them. They should be designed as shared services/elements regardless of the framework chosen.

### 2.1 Authentication and session

- Access via **email + password**.
- The session remains valid for **24 hours**, after which a new login is required.
- It is possible to log out of the application at any time (explicit logout).
- The app clearly distinguishes between the **public area** (login, registration, password recovery, language selection) and the **authenticated area** (everything else): a non-logged-in user cannot access the authenticated area; a logged-in user who opens a public page is redirected to the home.
- A **password recovery** flow via email is provided, as well as a **registration** flow that distinguishes between an individual and a company.
- An **advisor invitation** mechanism exists: the advisor can generate a link that, when opened by a new customer, pre-associates the customer with the advisor from registration onward.

### 2.2 Roles and permissions

- **End customer**: sees their own policies, their own offers, and can send a mandate to the advisor.
- **Advisor**: additionally sees their customer master data, the mandates area, and the automatic quote generation area.
- **Administrative account**: only a few specific accounts have this privilege; they additionally see an advisor management panel.
- Some advisors can be **Wefox partners**: for them a dedicated form is available to submit a Wefox mandate.

### 2.3 Multilanguage

- All UI texts are translatable.
- Language switching is available at two points: a language selection page **before login** and an equivalent page **after login**.
- The change is immediate (the UI updates to the new language) and the preference is stored.

### 2.4 Notifications, loading and feedback

- Non-blocking **toasts** to confirm a successful action, signal an error, or display a warning.
- Global **loading overlay** during operations that require waiting (e.g. login, form submission, quote generation).
- **Form validation** in real time, with inline error messages next to the problematic field.
- **Confirmation modals** for critical actions or to communicate blocks (e.g. unable to proceed because some conditions are not met).

### 2.5 Layout

The app provides three differentiated layouts:

1. **Authenticated area layout**: header with logo (links back to home), access to the user profile, access to the main menu; bottom navigation bar with shortcuts to support, FAQ and home; dynamic central content.
2. **Public area layout** (login, registration, etc.): centered logo, central content, bottom bar with support, OneZone institutional website, language selection.
3. **Full-screen document layout**: used to display PDFs (contracts, reports, attachments). No header or bars, just the document.

### 2.6 Integrations with external services (functional capabilities)

These integrations are part of the app's behavior; the technical connection methods are at the development team's discretion.

- **Car quote generation system**: the app sends the data collected by the advisor to an external service (currently "EcoHub") that queries several insurance companies in parallel and returns offers. The advisor must perform their own access to this service only once, during the initial setup, also providing a two-factor authentication code.
- **Swiss vehicle catalog**: while filling in the car quote form, brand and model are searched in an official catalog of vehicles registered in Switzerland, which also returns the type-approval code and other automatically pre-filled technical data.
- **Wefox mandates**: for Wefox partner advisors a dedicated form is available that replicates that company's mandate submission form.
- **Information banners**: on the home page an informational/promotional banner managed by an external editorial team (currently the OneZone institutional website) may appear.

### 2.7 Perceived performance

The user must not have to wait every time a page is opened for the reloading of data that rarely changes. For some information (advisor data, home banner, outcome of the access check to the quoting service) the app must immediately display what it has already seen previously and update in the background.

---

## 3. Main user flows

### 3.1 Access and initial orientation

The user opens the application and sees the login page. They can choose the language, enter credentials, or go to registration or password recovery. Once logged in, they are taken to the **home**, where they find:

- a personalized greeting,
- a slider with images and promotional actions,
- a menu of shortcuts to the main areas (the items vary depending on whether the user is a customer or an advisor),
- if they are an advisor, a button to start car quote generation and a button to submit a mandate on behalf of a customer.

From here they can reach any other area through the main menu (always accessible from the menu icon at the top) or through the home shortcuts.

### 3.2 Customer: consulting policies and documents

From the menu, the customer opens the list of their own policies, visually grouped by insured customer (useful for families and companies with multiple persons/vehicles). By selecting a policy, they access the details: general data, insured assets, coverages, premiums, downloadable documents, possible claims history. From here they can open the documents in full-screen PDF mode and download them.

### 3.3 Customer: managing received offers

From the menu the customer opens the offers page, divided into three tabs: **pending, accepted, rejected**. The offers are grouped by insurance branch. From each offer they can see the details, compare the premium, **accept** or **reject**. Acceptance triggers, on the system side, the start of the process for the new policy.

### 3.4 Advisor: generating car quotes

From the home, the advisor starts quote generation. The very first time, they must perform an **initial setup**: they enter their credentials for the external quoting service, provide the two-factor authentication code, and wait for verification (which can take up to a minute and a half, with an explicit waiting message).

Once the setup is configured, the ordinary flow is the following:

1. Opening of the **car quote form**, organized into several sections: customer personal data, data for one or two vehicles, usage details and required coverages, claims history for the last 5 years, some qualifying questions.
2. While filling in the vehicle data, the advisor opens a search modal for brand/model that queries the Swiss vehicle catalog. By selecting a result, data such as type-approval code, fuel type, power and approval date are auto-filled.
3. The advisor chooses which insurance companies to query through a series of **company checkboxes**, already filtered based on the companies allowed for that advisor.
4. If at least one of the final "qualifying questions" blocks the offer (for example, previous policy canceled by the company, refusal of coverage, license suspension), a **blocking modal** explains that it is not possible to generate a quote and prevents submission.
5. Upon form submission, the advisor sees a confirmation message. The request is processed in the background, and the outcomes (the received offers) appear progressively in the **advisor's quote history** and, in turn, in the customer's offers area.

### 3.5 Advisor: registering a customer and submitting a mandate

From the home, the advisor starts the mandate submission flow. They see the list of their customers (with an indication of who already has a signed mandate). They can:

- select an existing customer to view their policies and continue working on that customer, or
- add a new customer by filling in a master data form (individual or company); upon completion of registration, the advisor immediately continues by adding policies and submitting the mandate for that customer.

The app handles uploading and archiving the signed mandate document.

### 3.6 Administrator: advisor supervision

The administrative account finds in the menu a dedicated item "Advisor management". From there they can search for an advisor, see their activation status and which insurance companies are available for quote generation, and modify both (activate/deactivate the advisor, enable/disable individual companies for that advisor).

---

## 4. Page inventory

For each page, the following is described: **purpose**, **what the user sees**, **possible actions**, **visible states**, **navigation** (where it is reached from and where it leads), **access restrictions**.

---

### Access area (public)

#### 4.1 Login

- **Purpose:** allow the user to enter the authenticated area by providing email and password.
- **What they see:** OneZone logo, email field, password field with show/hide text option, login button, "Forgot password?" link, "Register" link, link to language selection.
- **Actions:** enter credentials, submit the form (also with Enter), show/hide password, go to registration, go to password recovery, change language.
- **States:** loading during credential verification; clear error message in case of wrong credentials or network issues.
- **Navigation:** this is the landing page for those who are not logged in; on success it leads to the home; it links to registration, password recovery, language selection.
- **Restrictions:** only non-authenticated users.

#### 4.2 Registration

- **Purpose:** register a new customer in the app, possibly associating them with an advisor via an invitation link.
- **What they see:** "Individual" / "Company" selector that changes form fields; master data fields (first name, last name or company name, address, postal code, city, email, phone, date of birth); terms acceptance checkbox; registration button.
- **Actions:** choose the type, fill in the form, accept the terms, submit.
- **States:** field-by-field validation with inline messages; loading during account creation; confirmation or error message.
- **Navigation:** reachable from the login or from a personalized advisor invitation link; on success the user is authenticated and taken to the home.
- **Restrictions:** only non-authenticated users.

#### 4.3 Password recovery

- **Purpose:** send the customer an email to reset the password.
- **What they see:** email field, send button, informational message.
- **Actions:** enter the email, request the reset link to be sent.
- **States:** loading during sending; confirmation message of the sending or error message.
- **Navigation:** reachable from the login; on success it invites the user to check their email inbox.
- **Restrictions:** only non-authenticated users.

#### 4.4 Language selection (pre-login)

- **Purpose:** allow the non-logged-in user to choose the interface language.
- **What they see:** list of available languages (German, Italian, French, English).
- **Actions:** select a language; the interface is updated and the preference saved.
- **States:** indication of the currently active language.
- **Navigation:** reachable from the bottom bar of the public layout; at the end it returns to login.
- **Restrictions:** only non-authenticated users.

---

### Dashboard and Profile area (authenticated)

#### 4.5 Home

- **Purpose:** welcome page and starting point for every activity of the logged-in user.
- **What they see:** personalized greeting with the user's name; promotional/informational slider (images, titles, texts, action button); menu of shortcuts to the main areas (the items differ between customer and advisor); if the user is an advisor, **two dedicated buttons**: "Generate quotes" and "Submit mandate"; at the bottom an inspirational quote.
- **Actions:** scroll through the slider, click its calls to action, open a menu item, start quote generation or the mandate flow (advisor only).
- **States:** banner loading; loading of the initial setup verification for advisors (with a waiting message that can last up to a minute and a half); "fresh" information shown immediately when already known, then updated in the background.
- **Navigation:** it is the first page after login; from here all other areas are reachable.
- **Restrictions:** only authenticated users; the "Generate quotes" button is visible only to advisors.

#### 4.6 Main menu

- **Purpose:** offer the complete list of the app's areas in a single view.
- **What they see:** dynamic list of items (varies for customer/advisor/admin); at the bottom, shortcuts to support, institutional website and language change.
- **Actions:** choose an item to navigate to the corresponding area; open the language change page; log out of the app.
- **States:** indication of the active item.
- **Navigation:** openable from any authenticated page via the menu icon in the header.
- **Restrictions:** only authenticated users; some items are visible only to advisors, some only to administrators.

#### 4.7 User profile

- **Purpose:** view and modify one's own personal data, avatar and password.
- **What they see:** personal data section (name, email, phone, address), avatar, password change section, logout button.
- **Actions:** modify the fields and save; upload a new avatar; change password (old + new, confirmed); log out.
- **States:** data loading, validation, save confirmation, error messages.
- **Navigation:** reachable from the profile icon in the header or from the menu.
- **Restrictions:** only authenticated users.

#### 4.8 Language selection (post-login)

- **Purpose:** allow the already authenticated user to change the language.
- **What they see:** list of available languages.
- **Actions:** select a language; the interface updates immediately and the preference is saved.
- **States:** indication of the currently active language.
- **Navigation:** reachable from the main menu.
- **Restrictions:** only authenticated users.

---

### Policies area

#### 4.9 Policies list

- **Purpose:** show the policies associated with the user (their own, or those of a specific customer if it is an advisor).
- **What they see:** header with the page title; possible "Add policy" button; the policies are displayed as two-column cards, with an image of the company or the vehicle license plate, and grouped by insured customer.
- **Actions:** open a card to see the details; start the addition of a new policy.
- **States:** initial loading; empty state if no policies exist.
- **Navigation:** reachable from the menu or from the home shortcuts; clicking a card opens the policy details; it can also be viewed filtered by a specific customer.
- **Restrictions:** only authenticated users.

#### 4.10 Policy detail

- **Purpose:** show all the information of a single policy.
- **What they see:** general information (number, type, company, validity period), insured assets (e.g. vehicles), coverages and deductibles, premiums, downloadable documents, timeline of events/claims.
- **Actions:** open/download a document, possibly start related actions (e.g. report, sharing, edit if allowed).
- **States:** loading, possible messages if data is missing.
- **Navigation:** reachable from the policies list; allows opening the document viewer and other sub-flows.
- **Restrictions:** only authenticated users and only for policies that the user is entitled to access.

#### 4.11 Add policy

- **Purpose:** register a new policy in the archive.
- **What they see:** multi-section form with policyholder master data, insured assets, coverages, document upload.
- **Actions:** fill in the form, upload attachments (PDF, images), submit.
- **States:** validation, loading during submission, outcome message.
- **Navigation:** reachable from the policies list; at the end it returns to the updated list.
- **Restrictions:** only authenticated users with permission to add policies.

#### 4.12 Policy multi-selection

- **Purpose:** allow selecting multiple policies at the same time to perform a cumulative action (for example, to compare them).
- **What they see:** policy list with selection checkbox, "select all" button, button that starts the cumulative action.
- **Actions:** select/deselect policies, start comparison or the next action.
- **States:** indication of the number of selected items.
- **Navigation:** from the policies list; leads to comparison.
- **Restrictions:** only authenticated users.

#### 4.13 Policy comparison

- **Purpose:** visually compare multiple policies side by side.
- **What they see:** comparative table with one column per policy and one row for each feature/premium; possible summary charts.
- **Actions:** review the comparison, export/download the result.
- **States:** loading, premium calculation.
- **Navigation:** reachable from multi-selection; allows returning to the list.
- **Restrictions:** only authenticated users.

#### 4.14 Policy report

- **Purpose:** generate a summary document of a policy in PDF format.
- **What they see:** document preview, download and print options.
- **Actions:** download, print, possibly share.
- **States:** document generation (loading), ready.
- **Navigation:** reachable from the policy detail; opened in **full-screen document layout**.
- **Restrictions:** only authenticated users.

---

### Offers area

#### 4.15 Offers list

- **Purpose:** show the customer all the offers received from the advisor, organized by status.
- **What they see:** three tabs at the top: **Pending**, **Accepted**, **Rejected**, each with an icon and the count; within each tab the offers are grouped by insurance branch, presented as expandable lists; each offer shows dates, premium, status and actions (accept, reject, see details).
- **Actions:** change tab; expand/collapse a branch; open the details of a single offer; accept or reject an offer.
- **States:** initial loading; empty state for tabs without offers; confirmation/error after acceptance or rejection.
- **Navigation:** reachable from the menu or from the home; the accept/reject actions produce a confirmation toast and update the status in the list.
- **Restrictions:** only authenticated users.

---

### Customers and Mandates area (advisor)

#### 4.16 Customers list

- **Purpose:** show the advisor the master data of their own customers.
- **What they see:** search bar with real-time filter; "Add customer" button; cards per customer showing name, count of associated persons and policies, address, possible "Mandate present" badge, shortcuts to call or send an email.
- **Actions:** search for a customer, open their details, call/email directly, add a new customer.
- **States:** loading, empty state, empty search result.
- **Navigation:** reachable from the menu (visible to advisors); opens the customer detail or the list of their policies.
- **Restrictions:** advisors only.

#### 4.17 Customers list with mandate focus

- **Purpose:** version of the customers list designed for the "Submit mandate" flow: highlights the mandate status.
- **What they see:** same structure as the customers list, with greater emphasis on the "Mandate present/absent" badge and quick actions to upload/view the mandate.
- **Actions:** search for a customer, open their policies, upload a mandate, add a new customer.
- **States:** loading, empty state.
- **Navigation:** reachable from the "Submit mandate" button on the home or from the menu; leads to customer addition or to the policy list of the selected customer.
- **Restrictions:** advisors only.

#### 4.18 Customer addition for mandate

- **Purpose:** register a new customer as part of the mandate submission flow, without leaving the advisor session.
- **What they see:** "Individual / Company" selector that changes the fields; master data fields (first name, last name or company name, email, date of birth, address, postal code, city, phone, initial password); creation button.
- **Actions:** fill in the form, save.
- **States:** local validation + server-side validation with field-specific messages; loading during creation.
- **Navigation:** reachable from the customers list with mandate focus; at the end it leads directly to the policies list of the newly created customer.
- **Restrictions:** advisors only.

#### 4.19 Policies of the customer under mandate

- **Purpose:** show the advisor the list of policies of a specific customer for whom they are managing a mandate.
- **What they see:** header with the customer's name; list of the customer's policies; ability to add new ones.
- **Actions:** open a policy for the details, add a policy.
- **States:** loading, empty state if the customer does not yet have policies.
- **Navigation:** reachable by selecting a customer in the mandates list; opens the policy detail.
- **Restrictions:** advisors only.

#### 4.20 Wefox mandate form

- **Purpose:** fill in and submit the specific mandate form for the Wefox company.
- **What they see:** form that replicates the Wefox form with the essential fields for the mandate.
- **Actions:** fill in and submit.
- **States:** validation, loading, submission confirmation.
- **Navigation:** reachable from the menu, but only for Wefox partner advisors.
- **Restrictions:** only Wefox partner advisors.

---

### Quote Automation area (advisor)

#### 4.21 Initial automation setup

- **Purpose:** connect the advisor to the external car quote service. To be performed only once, at the first generation.
- **What they see:** step-by-step wizard with instructions; fields for the external service credentials; a step dedicated to two-factor authentication; informational message about the duration of the verification (up to about a minute and a half).
- **Actions:** enter credentials, provide the two-factor code, confirm.
- **States:** prolonged loading during verification; outcome message (success or error with possibility to retry).
- **Navigation:** reachable from the home when the advisor starts "Generate quotes" and the system detects that it has not yet been configured; at the end it leads directly to the quote form.
- **Restrictions:** advisors only.

#### 4.22 Car quote generation form

- **Purpose:** collect in a single form all the information necessary to request car quotes from several companies simultaneously.
- **What they see:** long form, divided into clearly separated **numbered sections**:

  1. **Customer personal data**: gender (man/woman/company), first and last name or company name, date of birth, driver's license data, address with postal code and city, email, phone, nationality and possible document for foreigners, preferred language for the offer.
  2. **Data of the first vehicle**: brand/model search via a **dedicated modal** that queries the Swiss vehicle catalog; technical data (fuel type, power, type approval) pre-filled and not modifiable after selection; certificate number, chassis number, accessories, canton of registration, license plate, date of first registration, leasing, usual garage, possible interchangeable plate.
  3. **Data of a possible second vehicle**: same structure as the first, optional.
  4. **Usage and coverages**: vehicle use, third-party liability level, additional coverages (full or partial collision, parking damage, glass, personal belongings, tires, bonus protection, assistance, free choice of garage, passenger accident); for electric vehicles four specific checkboxes (battery, charging, cyber, other); payment method.
  5. **Claims history**: current insurance company, number of claims in the last 5 years divided by type (third-party liability, collision, parking, glass, partial collision); under the section title there is a brief informational description explaining what to indicate.
  6. **Other questions**: three qualifying checkboxes (previous policy canceled, refusal of coverage, license suspension).

  Above the submit button, a series of **checkboxes to select the companies** to be queried; the list is already filtered, excluding those not available for the advisor.

- **Actions:** fill in the form (with input assistance, for example postal code/city auto-completion); open the vehicle search modal and select the result to populate the vehicle block; select the companies; submit the form.

- **Vehicle search modal:** search fields for chassis number, type approval, brand, model; search button; results table with brand, model, type approval, fuel type, power (in kW and hp), approval date; pagination; clicking a row selects the vehicle and populates the vehicle block.

- **Offer blocking modal:** if at least one of the checkboxes of the last section is selected, on submit a modal appears that explains that it is not possible to calculate the offer and lists the blocking conditions; submission is prevented.

- **States:** real-time validation with asterisks on required fields and inline error messages; loading during vehicle search in the modal; loading during submission; success screen with visual confirmation that remains visible for a few seconds.

- **Test mode:** in the development environment a button is available that automatically fills the form with sample data (must be removable in production).

- **Navigation:** reachable from the home (if setup is already done) or automatically after the initial setup; at the end it returns to the home.

- **Restrictions:** only advisors who have completed the setup.

#### 4.23 Advisor quote history and management

- **Purpose:** show the advisor the outcome of their own quote requests, with progress status and collected offers.
- **What they see:** list of requests with date, reference customer, number of offers collected, status (in progress, completed, error), button to see the details of the received offers. If the current account is administrative, an **advisor management panel** is shown instead, with:
  - search bar by advisor name/last name/username,
  - advisor card with active/inactive status and status indicator of the connection to the external service,
  - detail modal in which it is possible to activate/deactivate the advisor and individually enable/disable each insurance company.
- **Actions:** open the details of a request to consult the offers; (admin) search for an advisor, open their details, modify activation and available companies.
- **States:** loading, empty state, clear status indicators (pending / completed / error).
- **Navigation:** reachable from the menu; for advisors it leads to the offer details; for administrators it contains the management panel.
- **Restrictions:** advisors only; the advisor management panel is reserved for administrative accounts.

---

### Documents area

#### 4.24 Document viewer

- **Purpose:** display a PDF document (contract, report, policy attachment, mandate) in full screen.
- **What they see:** full-screen PDF document with toolbar for zoom, page scrolling, download and print. No app header or navigation bars are present.
- **Actions:** scroll, zoom, download, print.
- **States:** document loading, error if the document is not available.
- **Navigation:** reachable from a policy detail, from a report or from a mandate; returning happens via the browser/app "back" command.
- **Restrictions:** only authenticated users and only for documents that the user is entitled to access.

---

## 5. API documentation

The documentation for the main backend's APIs is available at the following address:

**https://onezone.brokerstar.biz/api/docs**

The documentation for the APIs related to automation (car quote generation, integration with the external quoting service) is available at the following address:

**https://api-car-scraping.onezone.ch/docs**

---

## 6. Final notes for the development team

- The choices of framework, UI library, state management, folder structure, naming, graphic style and component library are **entirely at the development team's discretion**.
- The document describes expected behaviors and minimum content: the team is free to propose improvements to the user experience, to revise the grouping of pages, or to merge/separate screens, provided that every functional capability listed here remains supported.
- The following remain binding: the roles (customer, advisor, administrative, Wefox partner advisor), the four languages, the presence of the external integrations as functional capabilities, the form blocks described in the car quote form, the distinction between public area, authenticated area and full-screen document view.
