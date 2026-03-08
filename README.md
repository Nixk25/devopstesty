# Room Reservation System

Systém pro správu rezervací místností. REST API postavené na Node.js, TypeScript a Fastify s databází přes Prisma ORM.

## Architektura

```
┌─────────────────────────────────────────────────┐
│                    Klient                       │
│              (HTTP requesty)                    │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Controller vrstva                  │
│     roomController, reservationController       │
│         (validace vstupu, HTTP kódy)            │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Servisní vrstva                    │
│    RoomService, ReservationService,             │
│    NotificationService                          │
│   (business logika, kontrola kolizí, oprávnění) │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Doménová vrstva                    │
│         Room, User, Reservation                 │
│     (entity, validátory, stavové přechody)       │
└──────────────────┬──────────────────────────────┘
                   │
┌──────────────────▼──────────────────────────────┐
│              Datová vrstva                      │
│           Prisma ORM + SQLite/PostgreSQL        │
└─────────────────────────────────────────────────┘
```

## Doménový model

### Entity
- **Room** - místnost s názvem, kapacitou, vybavením a stavem (aktivní/neaktivní)
- **User** - uživatel s jménem, emailem a rolí (USER/ADMIN)
- **Reservation** - rezervace s vazbou na místnost a uživatele, časovým rozsahem a stavem (confirmed/cancelled)

### Business pravidla
1. Kapacita místnosti musí být kladné celé číslo
2. Nelze vytvořit rezervaci v minulosti
3. Nelze rezervovat neaktivní místnost
4. Nelze vytvořit překrývající se rezervaci pro stejnou místnost
5. Rezervaci může zrušit pouze vlastník nebo admin
6. Nelze vytvořit dvě místnosti se stejným názvem
7. Email uživatele musí být unikátní

## Spuštění lokálně

### Požadavky
- Node.js 20+
- npm

### Instalace a spuštění
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

Aplikace poběží na `http://localhost:3000`.

### Spuštění s Dockerem
```bash
docker compose up -d
```

Spustí aplikaci s PostgreSQL databází. Dostupné na `http://localhost:3000`.

## Testy

### Spuštění testů
```bash
npm test                 # všechny testy
npm run test:coverage    # testy s coverage reportem
npm run test:watch       # testy v watch módu
```

### Testovací strategie

#### Unit testy (`tests/unit/`)
Pokrývají doménovou logiku a servisní vrstvu:
- **Entity testy** - validace vlastností, stavové přechody, hraniční případy
- **Service testy** - business pravidla, kontrola kolizí, oprávnění
- **Validator testy** - sdílená validační logika

Testy jsou psány podle struktury AAA (Arrange-Act-Assert) a principů FIRST (Fast, Independent, Repeatable, Self-validating, Timely).

#### Integrační testy (`tests/integration/`)
Testují REST API endpointy přes Fastify inject (HTTP requesty bez startu serveru):
- CRUD operace pro místnosti a uživatele
- Vytvoření a zrušení rezervací
- Validace vstupů a chybové odpovědi
- Kontrola kolizí a business pravidel přes API

#### Mocking
- **NotificationService** - emailové notifikace mockované pomocí `vi.fn()` (Vitest spy)
- Testuje se že notifikace jsou volány se správnými parametry
- Ověřuje se že při chybě se notifikace neposílají

#### Code coverage
- Měření přes v8 provider (Vitest)
- Cíl: >= 80% statements, >= 70% branches
- Výjimky: `src/index.ts` (entry point) není zahrnut v coverage

### TDD přístup
Klíčová doménová logika vznikala cyklem red-green-refactor:
1. Nejprve napsán test (RED - test selže)
2. Minimální implementace aby test prošel (GREEN)
3. Refaktoring kódu (REFACTOR - např. extrakce validátorů)

## API endpointy

| Metoda | URL | Popis |
|--------|-----|-------|
| GET | /health | Health check |
| POST | /api/rooms | Vytvoření místnosti |
| GET | /api/rooms | Seznam místností |
| GET | /api/rooms/:id | Detail místnosti |
| PATCH | /api/rooms/:id/deactivate | Deaktivace místnosti |
| PATCH | /api/rooms/:id/activate | Aktivace místnosti |
| POST | /api/users | Vytvoření uživatele |
| GET | /api/users | Seznam uživatelů |
| POST | /api/reservations | Vytvoření rezervace |
| GET | /api/reservations | Seznam rezervací |
| GET | /api/reservations/room/:roomId | Rezervace podle místnosti |
| GET | /api/reservations/user/:userId | Rezervace podle uživatele |
| PATCH | /api/reservations/:id/cancel | Zrušení rezervace |

## Prostředí

### Lokální vývoj
- SQLite databáze (`file:./dev.db`)
- Hot-reload přes `tsx watch`

### Docker (staging/production)
- PostgreSQL 16 databáze
- Multi-stage Docker build
- Non-root uživatel v kontejneru
- Health check endpoint

### Kubernetes
Manifesty v `k8s/` s Kustomize:
- **staging** (`k8s/staging/`) - 1 replika, `staging.reservations.local`
- **production** (`k8s/production/`) - 2 repliky, vyšší resource limity, `reservations.local`

Rozdíly staging vs production:
| | Staging | Production |
|--|---------|------------|
| Repliky | 1 | 2 |
| Paměť limit | 256Mi | 512Mi |
| Host | staging.reservations.local | reservations.local |

### CI/CD
GitHub Actions pipeline:
1. Lint (TypeScript + ESLint)
2. Unit a integrační testy + coverage report
3. Build
4. Docker build a push do GitHub Container Registry
5. Deploy na staging (automaticky při push na main)

## Struktura projektu

```
├── src/
│   ├── domain/           # entity a validátory
│   ├── service/          # business logika
│   ├── controller/       # REST API endpointy
│   ├── config/           # konfigurace (databáze)
│   ├── app.ts            # Fastify aplikace
│   └── index.ts          # entry point
├── tests/
│   ├── unit/             # unit testy
│   └── integration/      # integrační testy
├── prisma/
│   ├── schema.prisma     # databázové schéma (SQLite)
│   ├── schema.postgresql.prisma  # schéma pro Docker
│   └── migrations/       # databázové migrace
├── k8s/                  # Kubernetes manifesty
│   ├── base/
│   ├── staging/
│   └── production/
├── .github/workflows/    # CI/CD pipeline
├── Dockerfile
├── docker-compose.yml    # produkční compose
├── docker-compose.dev.yml # vývojový compose
└── vitest.config.ts      # konfigurace testů
```
