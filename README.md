# Repairhub

Eine Webapplikation zur Verwaltung von gebrauchten Smartphones mit IMEI-Abfrage und Verwaltung von Reparaturdaten.

## Funktionen

- IMEI-Abfrage über externe API (imeicheck.com)
- Speicherung der Gerätedaten in einer Datenbank
- Ersatzteilkatalog mit Preisen
- Berechnung von Verkaufspreisen basierend auf Einkaufspreis, Ersatzteilen und gewünschtem Gewinn
- Statusverwaltung der Geräte (gekauft, in Reparatur, zum Verkauf, verkauft)
- Dashboard mit Statistiken und Übersicht
- Umfassende Geräteliste mit Filterfunktionen

## Technologien

### Backend
- Node.js mit Express
- MongoDB als Datenbank
- Mongoose für Datenbankschema und -operationen
- Axios für HTTP-Anfragen an die IMEI-API

### Frontend
- React 
- React Router für Navigation
- Context API für State Management
- Tailwind CSS für Styling

## Installation

### Voraussetzungen
- Node.js (v14 oder höher)
- MongoDB (lokale Installation oder MongoDB Atlas)
- API-Key für imeicheck.com

### Backend einrichten

1. Repository klonen (oder Dateien herunterladen)
```bash
git clone <repository-url>
cd repairhub-react/backend
```

2. Abhängigkeiten installieren
```bash
npm install
```

3. Umgebungsvariablen konfigurieren
Erstellen Sie eine `.env` Datei im Backend-Ordner mit folgenden Inhalten:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/smartphone-manager
IMEI_API_KEY=Ihr_API_Key_hier
```

4. Server starten
```bash
npm start
```

Der Server läuft nun unter http://localhost:5000

### Frontend einrichten

1. In den Frontend-Ordner wechseln
```bash
cd ../frontend
```

2. Abhängigkeiten installieren
```bash
npm install
```

3. Umgebungsvariablen konfigurieren
Erstellen Sie eine `.env` Datei im Frontend-Ordner:
```
REACT_APP_API_URL=http://localhost:5000/api
```

4. Frontend-Entwicklungsserver starten
```bash
npm start
```

Das Frontend ist nun unter http://localhost:3000 erreichbar

## Projektstruktur

```
repairhub-react/
├── backend/
│   ├── server.js          # Hauptserver-Datei
│   ├── package.json       # Backend-Abhängigkeiten
│   └── .env               # Backend-Umgebungsvariablen
│
└── frontend/
    ├── public/            # Statische Dateien
    ├── src/
    │   ├── App.js         # Hauptkomponente
    │   ├── index.js       # Einstiegspunkt
    │   ├── components/    # React-Komponenten
    │   │   ├── devices/   # Geräte-Komponenten
    │   │   ├── parts/     # Ersatzteil-Komponenten
    │   │   ├── layout/    # Layout-Komponenten
    │   │   └── pages/     # Seitenkomponenten
    │   └── context/       # Context-Provider
    ├── package.json       # Frontend-Abhängigkeiten
    └── .env               # Frontend-Umgebungsvariablen
```

## API-Endpunkte

### Geräte

- `POST /api/devices/check-imei` - IMEI überprüfen und neues Gerät anlegen
- `GET /api/devices` - Alle Geräte abrufen
- `GET /api/devices/:id` - Ein bestimmtes Gerät abrufen
- `PUT /api/devices/:id` - Ein Gerät aktualisieren
- `DELETE /api/devices/:id` - Ein Gerät löschen

### Ersatzteile

- `POST /api/parts` - Neues Ersatzteil anlegen
- `GET /api/parts` - Alle Ersatzteile abrufen (optional mit Modellfilter)
- `GET /api/parts/:id` - Ein bestimmtes Ersatzteil abrufen

### Statistiken

- `GET /api/stats` - Statistiken abrufen

## Zukünftige Erweiterungen

- Integration mit eBay Kleinanzeigen für automatische Statusaktualisierung
- Barcode-Scanner für schnellere IMEI-Erfassung
- Erweiterte Reporting-Funktionen
- Benutzerauthentifizierung und Rollenmanagement

## Unterstützung

Bei Fragen oder Problemen können Sie ein Issue im GitHub-Repository erstellen oder den Projektverantwortlichen kontaktieren.

## Lizenz

[MIT](LICENSE)