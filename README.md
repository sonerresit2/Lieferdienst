# Lieferdienst — Backend

Backend für die Food-Delivery-Plattform. Stack: **Python (FastAPI)** + **PostgreSQL**, containerisiert mit **Docker Compose**.

Team: Tom & Soner (Backend) · Gerhard & Thomas (Frontend)

## Schnellstart (mit Docker)

Voraussetzung: Docker Desktop ist installiert und läuft.

```bash
docker compose up --build
```

Das startet:
- **PostgreSQL** auf Port `5432`
- **Backend (FastAPI)** auf Port `8000`

Beim ersten Start werden alle Tabellen automatisch angelegt (siehe `app/main.py`).

### Wichtige URLs, sobald die Container laufen

| Was | URL |
|---|---|
| API-Basis | http://localhost:8000 |
| Interaktive API-Doku (Swagger) | http://localhost:8000/docs |
| Health-Check | http://localhost:8000/health |

### Container stoppen

```bash
docker compose down
```

Mit `docker compose down -v` werden zusätzlich die Datenbank- und Bilder-Volumes gelöscht (z. B. für einen kompletten Neustart).

## Entwicklung

Der Backend-Container ist per Bind-Mount mit `backend/app` verbunden und läuft mit `--reload`. Das heißt: Code ändern, speichern, der Server lädt automatisch neu — kein erneutes `docker compose up --build` nötig, solange sich nur `requirements.txt` nicht ändert.

Wurde `requirements.txt` geändert (neues Package hinzugefügt), muss neu gebaut werden:

```bash
docker compose up --build
```

## Projektstruktur

```
backend/
├── app/
│   ├── main.py              # App-Setup, Router-Registrierung
│   ├── core/
│   │   ├── config.py        # Einstellungen (liest Umgebungsvariablen)
│   │   ├── database.py      # SQLAlchemy Engine/Session
│   │   ├── security.py      # Passwort-Hashing, JWT
│   │   ├── deps.py          # FastAPI-Dependencies (z. B. aktueller User)
│   │   └── error_handlers.py
│   ├── models/               # SQLAlchemy-Modelle (siehe Datenbankschema)
│   ├── schemas/               # Pydantic-Schemas (Request-/Response-Validierung)
│   ├── routers/                # API-Endpunkte, gruppiert nach Thema
│   └── static/product_images/  # Hochgeladene Produktbilder
├── requirements.txt
├── Dockerfile
└── .env.example
docker-compose.yml
```

## API-Endpunkte (Übersicht)

| Methode | Pfad | Beschreibung | Auth nötig |
|---|---|---|---|
| POST | `/auth/register` | Registrierung | nein |
| POST | `/auth/login` | Login, liefert JWT | nein |
| GET | `/auth/me` | Eigene Userdaten | ja |
| GET | `/vendors` | Anbieter auflisten | nein |
| POST | `/vendors` | Anbieter anlegen | nein |
| GET | `/products` | Produkte auflisten (Filter: `vendor_id`, `category`) | nein |
| GET | `/products/{id}` | Einzelnes Produkt | nein |
| POST | `/products` | Produkt anlegen | nein |
| PUT | `/products/{id}` | Produkt bearbeiten | nein |
| DELETE | `/products/{id}` | Produkt löschen | nein |
| POST | `/products/{id}/images` | Produktbild hochladen | nein |
| GET | `/cart` | Eigenen Warenkorb abrufen | ja |
| POST | `/cart/items` | Produkt zum Warenkorb hinzufügen | ja |
| PUT | `/cart/items/{id}` | Menge ändern | ja |
| DELETE | `/cart/items/{id}` | Position entfernen | ja |
| DELETE | `/cart` | Warenkorb leeren | ja |
| POST | `/orders/checkout` | Checkout-Simulation | ja |
| GET | `/orders` | Eigene Bestellungen | ja |

Vollständige, interaktive Doku inkl. Request-/Response-Beispielen: **http://localhost:8000/docs**

### Authentifizierung in der Praxis

1. `POST /auth/register` mit `{ "email", "password", "full_name" }`
2. `POST /auth/login` (als Form-Daten, nicht JSON: `username`, `password`) → liefert `access_token`
3. Bei geschützten Routen Header setzen: `Authorization: Bearer <access_token>`

## Für das Frontend-Team

Die API ist per CORS für alle Origins freigegeben (`allow_origins=["*"]`), damit ihr ohne zusätzliche Konfiguration von `http://localhost:5173` (o. ä.) aus Requests stellen könnt. Datenformat durchgehend JSON, mit Ausnahme von `/auth/login` (Form-Daten, OAuth2-Standard) und `/products/{id}/images` (multipart/form-data für den Datei-Upload).

Im `docker-compose.yml` ist ein auskommentierter Platzhalter-Service `frontend` vorbereitet — sobald euer Dockerfile steht, könnt ihr den Block einkommentieren und anpassen.

## Datenbank zurücksetzen

```bash
docker compose down -v
docker compose up --build
```
