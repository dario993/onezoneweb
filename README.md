# OneZoneWeb

OneZoneWeb ist eine moderne Webanwendung, entwickelt mit Angular und Tailwind CSS. Sie dient als Plattform für das Hosting und die Verwaltung von HR-bezogenen Daten und Prozessen.

## Features

- Benutzer-Authentifizierung und -Registrierung
- Verwaltung von Kunden, Angeboten und Policen
- Mehrsprachigkeit (i18n)
- Responsive Layouts für verschiedene Endgeräte
- PDF-Generierung und Berichte
- Integration mit externen Services

## Projektstruktur

- `src/app/` – Hauptanwendung und Module
- `src/assets/` – Bilder, Icons, Fonts, statische Dateien
- `src/environments/` – Umgebungsvariablen
- `public/` – Öffentliche Dateien (z.B. Favicon)

## Installation

1. Repository klonen:
   ```bash
   git clone <REPO_URL>
   cd onezoneweb
   ```
2. Abhängigkeiten installieren:
   ```bash
   npm install
   ```

## Entwicklung starten

```bash
npm start
```

Die Anwendung ist dann unter `http://localhost:4200` erreichbar.

## Tests ausführen

```bash
npm test
```

## Deployment

Für den Produktivbetrieb die Produktionsumgebung bauen:

```bash
npm run build -- --configuration=production
```

Nach erfolgreichem Build werden die fertigen Dateien im Ordner `dist/onezoneweb` (bzw. im im Build-Output angegebenen Ordner) abgelegt.

**Folgende Schritte sind für das Deployment notwendig:**

1. **Build-Ordner hochladen:**

   - Übertrage den gesamten Inhalt des Ordners `dist/onezoneweb` auf deinen Webserver (z.B. in das Verzeichnis `/var/www/html/onezoneweb` oder einen anderen Zielordner deines Webservers).
   - Achte darauf, dass alle Unterordner und Dateien (HTML, CSS, JS, Assets) mitkopiert werden.

2. **Assets prüfen:**

   - Stelle sicher, dass alle benötigten Assets (Bilder, Fonts, etc.) im Build-Ordner enthalten sind und korrekt ausgeliefert werden.

3. **Seite aufrufen:**
   - Nach dem Hochladen kannst du die Seite über die Domain bzw. URL deines Webservers aufrufen.

**Hinweis:**
Es müssen nur die Dateien aus dem Build-Ordner (`dist/onezoneweb`) auf den Server übertragen werden. Quellcode, Konfigurationsdateien und Entwicklungsabhängigkeiten sind für den Betrieb nicht notwendig.
