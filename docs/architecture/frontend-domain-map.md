# FINQZ PRO — Frontend Domain Map

## Objetivo

Documento oficial para mapear o store monolítico do frontend e preparar a futura separação por domínios.

---

## Diagnóstico atual

O frontend possui um store global principal:

```txt

src/store/index.ts

```

---

Esse arquivo concentra estado de UI, autenticação, CRM, parceiros, financeiro, pipeline, permissões e dados mockados.

---

## Domínios identificados

| Domínio | Estado atual | Risco | Direção futura |
|---|---|---|---|
| Auth | híbrido | alto | migrar para auth/session dedicada |
| UI | Zustand OK | baixo | manter como store UI |
| CRM | monolítico/local | alto | migrar para API/server state |
| Partner | monolítico/local | crítico | migrar para /api/v1/partners |
| Commercial | híbrido | médio | manter integração /api/v1/commercial |
| Financial | local-first | alto | migrar para backend financeiro |
| Pipeline | local-first | alto | migrar para API de pipeline |
| Permissions | duplicado frontend/backend | alto | consolidar backend-first |

---

## Regra oficial

O store não deve ser refatorado de uma vez.

A extração será gradual, por domínio, mantendo compatibilidade operacional.

---

## Estratégia futura

A arquitetura alvo será:

```txt
src/store/ui
src/store/auth
src/store/crm
src/store/partner
src/store/commercial
src/store/financial
src/store/pipeline

```

---

## Prioridade recomendada

1. Auth/session
2. Partner
3. Users/RBAC
4. CRM/Oportunidades
5. Clientes
6. Financial
7. Pipeline
8. UI polish

---

## Status

Fase atual:
Mapeamento arquitetural.

Nenhuma refatoração do store foi iniciada.