# Lieferdienst

Food-Delivery-Plattform (Lieferando-Klon). Stack: **Next.js 14 (TypeScript)** + **Python/FastAPI** + **PostgreSQL**, containerisiert mit **Docker Compose**.

Team: Tom & Soner (Backend) · Gerhard & Thomas (Frontend)

## Tech-Stack

| Bereich   | Technologie                          |
| --------- | ------------------------------------- |
| Frontend  | Next.js 14 (App Router), TypeScript    |
| Backend   | Python, FastAPI, SQLAlchemy            |
| Datenbank | PostgreSQL 16                          |
| Auth      | JWT, bcrypt (via passlib)              |
| Infra     | Docker, Docker Compose                 |

## Schnellstart (mit Docker)

Voraussetzung: Docker Desktop ist installiert und läuft.

```
docker compose up --build
```

Das startet:

- **PostgreSQL** (nur intern erreichbar, für Backend/Frontend nicht direkt von außen)
- **Backend (FastAPI)** auf Port `8000`
- **Frontend (Next.js)** auf Port `3000`

Beim ersten Start werden Datenbank-Tabellen automatisch angelegt und mit Testdaten befüllt (siehe `backend/seed.py`).

### Wichtige URLs, sobald die Container laufen

| Was                            | URL                             |
| ------------------------------- | -------------------------------- |
| Website                         | http://localhost:3000            |
| API-Basis                       | http://localhost:8000            |
| Interaktive API-Doku (Swagger)  | http://localhost:8000/docs       |
| Health-Check                    | http://localhost:8000/health     |

### Login-Daten (aus dem Seed)

| E-Mail                  | Passwort     |
| ------------------------ | ------------ |
| tom@lieferdienst.de       | passwort123  |
| soner@lieferdienst.de     | passwort123  |

### Container stoppen

```
docker compose down
```

**Achtung:** `docker compose down -v` löscht zusätzlich die Datenbank- und Bilder-Volumes unwiderruflich (z. B. für einen kompletten Neustart mit frischem Seed).

## Projektstruktur

```
Lieferdienst/
├── backend/
│   ├── app/
│   │   ├── main.py              # App-Setup, Router-Registrierung
│   │   ├── core/                 # Config, DB-Engine, Security, Dependencies
│   │   ├── models/                # SQLAlchemy-Modelle
│   │   ├── schemas/                # Pydantic-Schemas
│   │   ├── routers/                 # API-Endpunkte (auth, cart, orders, products, vendors)
│   │   └── static/product_images/    # Hochgeladene Produktbilder
│   ├── seed.py
│   ├── requirements.txt
│   ├── Dockerfile
│   └── .env.example
├── frontend/
│   ├── app/                      # Next.js App Router (Seiten, Layout, globals.css)
│   ├── components/                # auth/, cart/, layout/, products/
│   ├── lib/                        # api.ts, auth-context.tsx, cart-context.tsx, use-theme.ts
│   ├── Dockerfile
│   └── .env.example
└── docker-compose.yml
```

## Umgebungsvariablen

**Backend** (`backend/.env.example` -> für lokale Entwicklung nach `.env` kopieren):

```
DATABASE_URL=postgresql://lieferdienst:lieferdienst@db:5432/lieferdienst
SECRET_KEY=change-me-in-production
```

**Frontend** (`frontend/.env.example`):

```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Wichtig:** `NEXT_PUBLIC_*`-Variablen werden bei Next.js **zur Build-Zeit** in den JavaScript-Bundle eingebacken, nicht zur Laufzeit gelesen. Im Docker-Setup passiert das über den `args`-Block beim `frontend`-Service in `docker-compose.yml`. Wird der Wert geändert, muss das Frontend-Image neu gebaut werden (`docker compose up --build`), ein reiner Container-Neustart reicht nicht.

## API-Endpunkte (Übersicht)

| Methode | Pfad                    | Beschreibung                                          | Auth nötig |
| ------- | ------------------------ | ------------------------------------------------------ | ---------- |
| POST    | `/auth/register`         | Registrierung                                           | nein       |
| POST    | `/auth/login`            | Login, liefert JWT                                      | nein       |
| GET     | `/auth/me`               | Eigene Userdaten                                        | ja         |
| GET     | `/vendors`               | Anbieter auflisten                                      | nein       |
| GET     | `/products`              | Produkte auflisten (Filter: `vendor_id`, `category`)     | nein       |
| GET     | `/products/{id}`         | Einzelnes Produkt                                       | nein       |
| GET     | `/cart`                  | Eigenen Warenkorb abrufen                               | ja         |
| POST    | `/cart/items`            | Produkt zum Warenkorb hinzufügen                        | ja         |
| PUT     | `/cart/items/{id}`       | Menge ändern                                            | ja         |
| DELETE  | `/cart/items/{id}`       | Position entfernen                                      | ja         |
| POST    | `/orders/checkout`       | Checkout-Simulation                                     | ja         |
| GET     | `/orders`                | Eigene Bestellungen                                     | ja         |

Vollständige, interaktive Doku inkl. Request-/Response-Beispielen: **http://localhost:8000/docs**

### Authentifizierung in der Praxis

1. `POST /auth/register` mit `{ "email", "password", "full_name" }`
2. `POST /auth/login` (als Form-Daten, nicht JSON: `username`, `password`) -> liefert `access_token`
3. Bei geschützten Routen Header setzen: `Authorization: Bearer <access_token>`

Im Frontend wird der Token nach Login in `localStorage` gespeichert (`lib/auth-context.tsx`).

## Entwicklung

**Backend:** Per Bind-Mount mit `backend/app` verbunden, läuft mit `--reload`. Code ändern, speichern, Server lädt automatisch neu — kein `--build` nötig, außer `requirements.txt` ändert sich.

**Frontend:** Läuft im Container als Production-Build (`npm run build` + `npm start`), **kein** Hot-Reload. Nach jeder Code-Änderung ist ein Rebuild nötig:

```
docker compose up --build frontend
```

## Datenbank zurücksetzen

```
docker compose down -v
docker compose up --build
```

**Achtung:** Löscht alle Datenbank- und Bild-Inhalte unwiderruflich, danach läuft der Seed erneut.

## Bekannte Stolpersteine

- **Build-Fehler nach lokalen Änderungen:** Immer mit `git status` prüfen, ob eine Datei tatsächlich als "modified" erkannt wird, bevor man einen Rebuild startet — Änderungen, die nur im Editor offen, aber nicht gespeichert sind, werden sonst stillschweigend ignoriert.
- **Sonderzeichen in Code-Dateien** (Emojis, Sonderzeichen wie Häkchen) können bei falscher Editor-Kodierung zu kaputten Bytes führen. Editor auf UTF-8 (ohne BOM) einstellen.
- **`NEXT_PUBLIC_*`-Variablen ändern** wirkt erst nach `docker compose up --build`, da sie zur Build-Zeit eingebacken werden (siehe oben).
- **Lokale Fixes ohne `git push`** bleiben nur auf einem Rechner — vor jedem `git pull` mit `git status` prüfen, ob eigene Änderungen offen sind, sonst gehen sie beim Pull verloren oder verursachen Merge-Konflikte.
