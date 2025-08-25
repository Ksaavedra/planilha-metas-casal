# Planilha Metas Casal

## Deploy automático

### Git Flow: Feature → Develop → Master

Este projeto segue o fluxo Git Flow para desenvolvimento colaborativo.

#### Fluxo de Desenvolvimento:

1. **Feature Branch**: Desenvolvimento de novas funcionalidades
2. **Develop**: Integração de features
3. **Master**: Produção (deploy automático)

#### Como usar:

```bash
# 1. Criar feature branch
git checkout -b feature/nova-funcionalidade

# 2. Desenvolver e commitar
git add .
git commit -m "feat: descrição da funcionalidade"

# 3. Push e criar Pull Request
git push origin feature/nova-funcionalidade

# 4. Merge via GitHub: feature → develop

# 5. Deploy: develop → master
```

#### URLs:

-  **Produção**: https://ksaavedra.github.io/planilha-metas-casal/
-  **Docker**: ghcr.io/ksaavedra/planilha-metas-casal
