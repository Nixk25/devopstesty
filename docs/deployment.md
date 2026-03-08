# Nasazení

## Lokální vývoj

### Bez Dockeru (SQLite)
```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run dev
```

### S Dockerem (PostgreSQL)
```bash
docker compose up -d
```

Aplikace: http://localhost:3000
Health check: http://localhost:3000/health

## Kubernetes nasazení

### Požadavky
- kubectl
- Kubernetes cluster (minikube/kind/k3d)
- nginx ingress controller

### Staging
```bash
kubectl apply -k k8s/staging/
```
- Namespace: `reservations-staging`
- 1 replika aplikace
- Host: `staging.reservations.local`

### Production
```bash
kubectl apply -k k8s/production/
```
- Namespace: `reservations-production`
- 2 repliky aplikace
- Host: `reservations.local`

### Přístup přes port-forward
```bash
kubectl port-forward -n reservations-staging svc/staging-reservation-service 3000:80
```

### Ověření nasazení
```bash
kubectl get pods -n reservations-staging
kubectl logs -n reservations-staging deployment/staging-reservation-app
curl http://localhost:3000/health
```

## Rozdíly prostředí

| Konfigurace | Lokální dev | Staging | Production |
|-------------|------------|---------|------------|
| Databáze | SQLite | PostgreSQL | PostgreSQL |
| Repliky | 1 | 1 | 2 |
| Paměť limit | - | 256Mi | 512Mi |
| CPU limit | - | 250m | 250m |
| Secrets | .env soubor | K8s Secrets | K8s Secrets |
| Ingress | localhost:3000 | staging.reservations.local | reservations.local |

## Rollback

### Docker Compose
```bash
docker compose down
docker compose up -d --build
```

### Kubernetes
```bash
kubectl rollout undo deployment/staging-reservation-app -n reservations-staging
kubectl rollout status deployment/staging-reservation-app -n reservations-staging
```
