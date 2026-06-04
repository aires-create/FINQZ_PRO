# FINQZ PRO — Migration Matrix

## Objetivo

Documento oficial de compatibilidade entre:

- frontend atual
- endpoints legados
- backend moderno Fastify
- módulos ainda pendentes de migração

---

## Status arquitetural atual

### Backend moderno oficial registrado

Rotas oficialmente registradas no Fastify:

| Prefixo | Módulo |
|---|---|
| /api/v1/crm | crm |
| /api/v1/audit | audit |
| /api/v1/commercial | commercial |
| /api/v1/integrations | integrations |
| /api/v1/organizations | organization |

---

## Diagnóstico atual

O frontend ainda utiliza endpoints legados/híbridos:

```txt
/api/clientes
/api/parceiros
/api/oportunidades
/api/produtos
/api/automações
```