# CRM-CLOSURE-A - Clientes Runtime Closure Plan

Status: GO WITH RESTRICTIONS
Type: Architecture Decision / Runtime Closure Plan
Scope: Clientes / CRM / API Surface / Legacy Boundary
Date: 2026-06-23

---

## 1. Executive Verdict

`GO WITH RESTRICTIONS`

O modulo de `Clientes` ja possui backend oficial, API oficial e frontend oficial consumindo a superficie moderna. O risco residual nao esta no caminho principal da pagina, e sim em tres pontos de compatibilidade:

- rota legada paralela em `backend/server/src/index.ts`;
- uso residual de `store` em `src/pages/Clientes.tsx`;
- mocks globais em `dataService/adapters`, fora do fluxo oficial da pagina.

Conclusao:

- a pagina `Clientes.tsx` pode ser tratada como majoritariamente oficial;
- o backend legado de clientes ainda nao pode ser removido;
- a limpeza deve ser feita por ondas, sem quebrar compatibilidade.

Nao ha alteracao de runtime neste documento.

---

## 2. Classificacao

| Componente | Classificacao | Motivo |
|---|---|---|
| [`backend/src/modules/crm/**`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/routes.ts#L100) | `KEEP` | Backend oficial com `authenticate`, `tenantContextMiddleware` e RBAC |
| [`src/api/modules/clientes.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/clientes.api.ts#L41) | `KEEP` | API oficial consumida pela pagina |
| [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L34) | `KEEP` | Frontend oficial, usando `clientesApi` diretamente |
| [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L35) | `MIGRATE` | Ainda sincroniza com `store` |
| [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L57) | `QUARANTINE` | Mantem fallback mock/global para clientes |
| [`src/api/adapters.ts`](/C:/Projects/FINQZ_PRO/src/api/adapters.ts#L85) | `QUARANTINE` | Fonte mock/localStorage para ambiente de compatibilidade |
| [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1528) | `REMOVE LATER` | Rota legada paralela `/api/clientes` |
| [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L77) | `QUARANTINE` | Mantem endpoint legado `/crm/clientes` |
| [`src/api/modules/index.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8) | `KEEP` | Barrel atual, sem evidência de problema específico para clientes |

---

## 3. Fontes Oficiais

### Frontend oficial

- [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L122)
- [`src/api/modules/clientes.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/clientes.api.ts#L41)

### Backend oficial

- [`backend/src/modules/crm/routes.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/routes.ts#L100)
- [`backend/src/modules/crm/validators/customers.validator.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/validators/customers.validator.ts#L3)
- [`backend/src/modules/crm/dto/customers.dto.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/dto/customers.dto.ts#L3)
- [`backend/src/modules/crm/services/customers.service.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/services/customers.service.ts#L158)
- [`backend/src/modules/crm/repositories/customers.repository.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/repositories/customers.repository.ts#L42)
- [`backend/prisma/schema.prisma`](/C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L381)

### Infra oficial de roteamento

- [`backend/src/core/http/fastify.ts`](/C:/Projects/FINQZ_PRO/backend/src/core/http/fastify.ts#L586)

---

## 4. Fontes Legadas

### Rotas / clients legados

- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1528)
- [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L77)

### Compatibilidade / mocks

- [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L57)
- [`src/api/adapters.ts`](/C:/Projects/FINQZ_PRO/src/api/adapters.ts#L85)

### Estado residual

- [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L35)

---

## 5. Observacoes de Contrato

### Frontend

A pagina `Clientes.tsx` consome a API oficial diretamente:

- leitura em [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L122)
- create/update/delete em [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L675)

### API oficial

O cliente oficial usa:

- `GET /api/v1/crm/clientes`
- `GET /api/v1/crm/clientes/:id`
- `POST /api/v1/crm/clientes`
- `PUT /api/v1/crm/clientes/:id`
- `DELETE /api/v1/crm/clientes/:id`

Evidencia:

- [`src/api/modules/clientes.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/clientes.api.ts#L41)
- [`backend/src/modules/crm/routes.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/routes.ts#L177)
- [`backend/src/modules/crm/routes.ts`](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/routes.ts#L211)

### Rota legada paralela

Ainda existe:

- `GET /api/clientes`
- `GET /api/clientes/:id`
- `POST /api/clientes`
- `PUT /api/clientes/:id`
- `DELETE /api/clientes/:id`

Evidencia:

- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1528)

---

## 6. Plano de Limpeza em Ondas

### Wave 1 - Congelar o caminho oficial

Objetivo:

- manter `Clientes.tsx` apenas no cliente oficial;
- impedir que novos fluxos voltem para a rota legada.

Pode ser alterado futuramente:

- [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L122)
- [`src/api/modules/clientes.api.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/clientes.api.ts#L41)

Proibido nesta onda:

- alterar backend legado;
- alterar `dataService` para sustentar novos usos;
- reintroduzir fallback de clientes na pagina.

### Wave 2 - Reduzir residuos de store

Objetivo:

- eliminar sincronizacoes desnecessarias com `store`;
- manter o store apenas se houver consumer real fora da pagina.

Pode ser alterado futuramente:

- [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L35)

Proibido nesta onda:

- alterar backend;
- alterar contrato oficial;
- usar `store` como source of truth.

### Wave 3 - Quarentenar mocks globais

Objetivo:

- manter `dataService/adapters` apenas como compatibilidade geral do sistema;
- impedir que `Clientes.tsx` dependa de mock em runtime oficial.

Pode ser alterado futuramente:

- [`src/api/dataService.ts`](/C:/Projects/FINQZ_PRO/src/api/dataService.ts#L57)
- [`src/api/adapters.ts`](/C:/Projects/FINQZ_PRO/src/api/adapters.ts#L85)

Proibido nesta onda:

- remover suporte global para outros modulos ainda dependentes;
- misturar mock com fluxo oficial de clientes.

### Wave 4 - Desativar a rota legada de clientes

Objetivo:

- remover `/api/clientes` do backend legado quando nao houver consumer remanescente.

Pode ser alterado futuramente:

- [`backend/server/src/index.ts`](/C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1528)

Proibido nesta onda:

- cortar antes de validar migração completa da pagina e de eventuais consumers indiretos.

### Wave 5 - Remocao de compatibilidade obsoleta

Objetivo:

- remover aliases e caminhos antigos residuais, se ainda existirem;
- consolidar apenas o caminho `/api/v1/crm/clientes`.

Pode ser alterado futuramente:

- [`src/api/client.ts`](/C:/Projects/FINQZ_PRO/src/api/client.ts#L77)
- [`src/api/modules/index.ts`](/C:/Projects/FINQZ_PRO/src/api/modules/index.ts#L8) apenas se houver evidencia de impacto

---

## 7. Critérios de GO para Go-Live

O CRM de Clientes pode ser considerado pronto para Go-Live quando:

- [`src/pages/Clientes.tsx`](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx#L122) continuar usando somente API oficial;
- nao houver fallback funcional para `/api/clientes`;
- o uso residual de `store` tiver sido revisado e justificado;
- mocks globais estiverem confinados a contextos nao produtivos;
- `authenticate`, `tenantContextMiddleware` e RBAC estiverem ativos no backend oficial;
- `npx tsc --noEmit` passar sem erros;
- os fluxos de listar, criar, editar e excluir continuarem operando no backend oficial;
- a remocao futura do backend legado puder ser feita sem impacto funcional.

### NO-GO

Nao e GO se:

- a pagina voltar a depender da rota legada;
- aparecer flicker/fallback de store ou mocks no fluxo oficial;
- o contrato oficial nao for mantido;
- a retirada do backend legado quebrar consumers ainda nao mapeados.

---

## 8. Conclusao

Clientes nao esta na mesma situacao de Parceiros.

Parceiros ainda exigia correcao de flicker/fallback do legado na tela.
Clientes ja esta majoritariamente fechado no caminho oficial, com estes residuos:

- `store` residual;
- mocks globais em `dataService/adapters`;
- rota legada paralela em `backend/server/src/index.ts`;
- client legado compatível em `src/api/client.ts`.

O modulo deve permanecer em `GO WITH RESTRICTIONS` ate a limpeza final das ondas.
