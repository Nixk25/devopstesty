# Správa secrets

## Přístup k tajným údajům

Projekt používá vícevrstvý přístup k práci se secrets:

### Lokální vývoj
- Soubor `.env` (v `.gitignore`, nikdy se necommituje)
- Obsahuje `DATABASE_URL` pro připojení k lokální databázi

### CI/CD (GitHub Actions)
- `GITHUB_TOKEN` - automaticky poskytovaný GitHub Actions pro push do GHCR
- `DATABASE_URL` - nastavený jako env proměnná v pipeline (SQLite pro testy)
- Další secrets se přidávají přes Settings > Secrets and variables > Actions

### Kubernetes
- Kubernetes Secrets s base64 enkódovanými hodnotami
- Secrets jsou referencované v Deployment přes `secretKeyRef`
- V produkčním prostředí se doporučuje použít:
  - **Sealed Secrets** - šifrované secrets přímo v repozitáři
  - **External Secrets Operator** - napojení na HashiCorp Vault, AWS Secrets Manager apod.

## Co nikdy necommitovat

- `.env` soubory s reálnými credentials
- Privátní klíče a certifikáty
- API tokeny a hesla v plaintextu
- Kubeconfig soubory s přístupy ke clusteru

## Rotace secrets

1. Změnit hodnotu v Kubernetes Secret
2. Restartovat affected pods: `kubectl rollout restart deployment/<name>`
3. Ověřit funkčnost přes health check
