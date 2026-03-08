# Git Workflow

## Branching strategie

Projekt používá zjednodušený Git Flow:

```
main (production-ready)
 ├── feature/nazev-funkce    (nová funkcionalita)
 ├── fix/nazev-opravy        (oprava chyby)
 └── hotfix/nazev-hotfixu    (urgentní oprava v produkci)
```

### Pravidla

1. **main** - stabilní větev, vždy nasaditelná
2. **feature/** - nová funkcionalita, vytváří se z main
3. **fix/** - oprava chyby, vytváří se z main
4. **hotfix/** - urgentní oprava, vytváří se z main

### Postup práce

1. Vytvořit novou větev z main:
   ```bash
   git checkout main
   git pull
   git checkout -b feature/nazev-funkce
   ```

2. Průběžně commitovat s popisnými zprávami

3. Před mergem:
   - Spustit testy: `npm test`
   - Spustit lint: `npm run lint`
   - Vytvořit Pull Request

4. Po schválení PR merge do main

### Konvence commit zpráv

Používáme konvenční commity:

- `feat:` - nová funkcionalita
- `fix:` - oprava chyby
- `refactor:` - refaktoring bez změny funkcionality
- `test:` - přidání nebo úprava testů
- `docs:` - dokumentace
- `ci:` - změny v CI/CD pipeline

### CI/CD integrace

- Při push/PR na main se automaticky spustí CI pipeline
- Pipeline ověří lint, testy, build a Docker build
- Při push na main se automaticky nasadí na staging
