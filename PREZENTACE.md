# Prezentace projektu - Room Reservation System

## 1. Git historie (ukazat postupny vyvoj a branching)

```bash
# zobrazit vsechny commity - ukazat ze je jich 20+ a jsou postupne
git log --oneline

# ukazat ze byla pouzita feature branch
git log --oneline --graph --all
```

## 2. Spusteni testu (TDD predmet)

```bash
# spustit vsechny testy - ukazat ze vsechny prochazi
npm test

# spustit testy s coverage reportem - ukazat pokryti kodu
npm run test:coverage

# spustit lint - ukazat ze kod je bez chyb
npm run lint
```

## 3. Spusteni aplikace lokalne

```bash
# spustit v dev modu (SQLite databaze)
npm run dev

# v NOVEM TERMINALU otestovat ze funguje:
curl http://localhost:3000/
curl http://localhost:3000/health
curl http://localhost:3000/metrics

# vytvorit mistnost
curl -X POST http://localhost:3000/api/rooms \
  -H "Content-Type: application/json" \
  -d '{"name":"Zasedacka A","capacity":10,"equipment":["projektor"]}'

# vytvorit uzivatele
curl -X POST http://localhost:3000/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"Jan Novak","email":"jan@example.com"}'

# zobrazit mistnosti a uzivatele
curl http://localhost:3000/api/rooms
curl http://localhost:3000/api/users

# zastavit server: Ctrl+C
```

## 4. Spusteni v Dockeru (DevOps predmet)

```bash
# spustit aplikaci + PostgreSQL v kontejnerech
npm run docker:up

# pockat 5 sekund a pak otestovat
sleep 5

# health check
curl http://localhost:3000/health

# spustit smoke testy - automaticky overi vsechny endpointy
./scripts/smoke-test.sh

# ukazat bezici kontejnery
docker ps

# ukazat logy aplikace
docker compose logs app

# zastavit
npm run docker:down
```

## 5. Co ukazat v kodu (otevrit v editoru)

### TDD pristup - testy pred implementaci
- tests/unit/room.test.ts        → unit testy entity
- src/domain/Room.ts             → implementace entity
- src/domain/validators.ts       → refaktorovane validatory (refactor krok TDD)

### Mocking
- tests/unit/notification-mock.test.ts  → vi.fn() mock notifikaci
- src/service/NotificationService.ts    → interface + implementace

### Integracni testy
- tests/integration/api.test.ts  → testy pres HTTP requesty

### Business logika
- src/service/ReservationService.ts → kontrola kolizi, opravneni

### Docker
- Dockerfile                     → multi-stage build, non-root, healthcheck
- docker-compose.yml             → app + PostgreSQL

### Kubernetes
- k8s/base/app-deployment.yml    → Deployment + Service + health probes
- k8s/base/secret.yml            → Secrets (base64, ne plaintext)
- k8s/staging/kustomization.yml  → staging overlay (1 replika)
- k8s/production/kustomization.yml → production overlay (2 repliky)

### CI/CD
- .github/workflows/ci.yml       → 6 jobu: lint, test, build, smoke, docker, deploy

### Bezpecnost
- src/app.ts                     → helmet + rate limit + CORS

## 6. Na GitHubu ukazat

- Actions tab → ukazat posledni pipeline run a jeho joby
- Artifacts → coverage report
- Code tab → ukazat strukturu repozitare

## 7. Kubernetes manifesty (bez clusteru, jen ukazat)

```bash
# vygenerovat staging manifesty - ukazat co by se nasadilo
kubectl kustomize k8s/staging/

# vygenerovat production manifesty - ukazat rozdily (2 repliky, vic pameti)
kubectl kustomize k8s/production/
```

## Tahak - co rict ke kazdemu bodu

### K TDD:
"Pouzival jsem cyklus red-green-refactor. Nejdriv jsem napsal test ktery selhal,
pak minimalni implementaci aby prosel, a nakonec refaktoroval - napriklad
extrakce validacni logiky do sdileneho modulu."

### K testum:
"Mam unit testy pro domenovou logiku, integracni testy ktere testuj REST API
pres HTTP requesty, a mockuji externi sluzby jako notifikace pomoci vi.fn()."

### K Dockeru:
"Pouzivam multi-stage build - prvni stage kompiluje TypeScript, druhy obsahuje
jen produkci kod. Kontejner bezi pod neprivilegovanym uzivatelem a ma healthcheck."

### Ke Kubernetes:
"Mam dva prostredi - staging s jednou replikou a production se dvema.
Pouzivam Kustomize pro spravu rozdilu mezi prostredimi. Secrets jsou
base64 enkodovane, v produkci by se pouzily Sealed Secrets."

### K CI/CD:
"Pipeline ma 6 kroku - lint, testy s coverage, build, smoke test v Dockeru,
push image do GitHub Container Registry a deploy na staging. Vse se spousti
automaticky pri push na main."

### K bezpecnosti:
"Helmet pridava bezpecnostni HTTP hlavicky, rate limiting chrani proti pretizeni,
hesla jsou v .env lokalne a Kubernetes Secrets v clusteru, nikdy v plaintextu."
