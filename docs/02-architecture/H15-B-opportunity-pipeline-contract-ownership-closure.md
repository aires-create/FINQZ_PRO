# H15-B - Opportunity & Pipeline Contract / Ownership Closure

Status: APPROVED WITH RESTRICTIONS
Type: Architecture Decision / Ownership Closure
Scope: Opportunity / Pipeline / Stage / CRM Runtime Boundaries
Date: 2026-06-23

---

## 1. Contexto

O audit `AUD-H15-A - Opportunity & Pipeline Runtime Reality Audit` concluiu que o dominio de `Opportunity` e `Pipeline` nao esta em estado puramente legado nem em estado puramente moderno.

O estado real confirmado e:

- backend moderno existe e e o owner canonico de leitura e escrita para `Opportunity` e `Pipeline`;
- frontend ainda carrega comportamentos transitrios e legados;
- existem fontes paralelas de consumo e persistencia em `store`, `catalogRepository`, `dataService` e runtime legado de servidor;
- o projeto exige transicao controlada, nao corte abrupto.

Conclusao anterior oficial:

- `AUD-H15-A` resultou em `GO WITH RESTRICTIONS`.

Este documento formaliza a decisao arquitetural de ownership e delimita o que pode e o que nao pode ser tratado como source of truth daqui em diante.

---

## 2. Decisao

### Decisao oficial

`Opportunity`, `Pipeline` e `Stage` sao dominios backend-owned.

### Decisao operacional

O frontend atual e transitivo e deve ser tratado como consumidor em migracao.

### Decisao de fonte de verdade

- backend moderno e a fonte oficial para `Opportunity`, `Pipeline` e `Stage`;
- frontend nao pode ser source of truth para esses dominios;
- `store`, `catalogRepository`, `localStorage` e clientes legados nao podem ser tratados como runtime canonico;
- APIs modernas sao preferenciais e mantidas;
- APIs legadas permanecem em quarentena ate encerramento seguro.

### Veredito arquitetural

`GO WITH RESTRICTIONS`

Nao ha autorizacao para implementar runtime novo neste documento.

---

## 3. Ownership Oficial

### 3.1 Opportunity

Owner oficial:

- `backend/src/modules/opportunities/**`
- `backend/prisma/schema.prisma`

Responsabilidades do owner:

- leitura canonica por tenant;
- criacao, atualizacao, movimentacao de etapa e exclusao logica;
- validacao de `pipelineId` e `stageId`;
- aplicacao de RBAC;
- registro de audit log;
- consistencia entre pipeline, stage, customer e lead.

### 3.2 Pipeline

Owner oficial:

- `backend/src/modules/pipelines/**`
- `backend/prisma/schema.prisma`

Responsabilidades do owner:

- leitura de pipelines ativos por tenant;
- criacao, atualizacao e desativacao de pipeline;
- criacao, atualizacao, desativacao e reorder de stage;
- aplicacao de RBAC;
- validação de tenant scope;
- garantia de consistencia entre pipeline e stage.

### 3.3 Stage

Owner oficial:

- `backend/src/modules/pipelines/**`
- `backend/prisma/schema.prisma`

Responsabilidades do owner:

- pertence ao Pipeline;
- herda tenant scope;
- nao pode ser tratado como entidade independente de frontend;
- nao pode ser inferido por labels de UI.

### 3.4 Frontend

Owner de consumo:

- `src/pages/Oportunidades.tsx`
- `src/pages/admin/Pipelines.tsx`
- `src/pages/SdrIaHub.tsx`

Responsabilidade:

- consumir contratos oficiais;
- nunca definir fonte operacional de verdade;
- nunca persistir estado operacional como ownership definitivo.

---

## 4. Fontes Oficiais

### Backend

- `backend/src/modules/opportunities/routes.ts`
- `backend/src/modules/opportunities/services/opportunities.service.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/opportunities/validators/opportunities.validator.ts`
- `backend/src/modules/pipelines/routes.ts`
- `backend/src/modules/pipelines/service.ts`
- `backend/src/modules/pipelines/repository.ts`
- `backend/src/modules/pipelines/validators/pipeline.http.schema.ts`
- `backend/src/modules/pipelines/validators/pipeline.validator.ts`
- `backend/prisma/schema.prisma`

### Frontend

- `src/api/modules/opportunities.api.ts`
- `src/api/modules/pipelines.api.ts`

### Suporte canônico

- `backend/prisma/seed.ts` para foundation inicial de pipeline/stage e permissões

---

## 5. Fontes Transitórias

As seguintes fontes ainda existem e podem continuar ativas durante a migracao, mas nao sao ownership oficial:

- `src/pages/Oportunidades.tsx`
- `src/pages/admin/Pipelines.tsx`
- `src/pages/SdrIaHub.tsx`
- `src/store/index.ts`
- `src/data/catalogRepository.ts`
- `src/config/pipelines.ts`
- `src/api/dataService.ts`
- `src/api/client.ts`

Esses arquivos existem para compatibilidade e transicao. Nenhum deles pode ser reclassificado como source of truth de dominio.

---

## 6. Fontes Legadas / Proibidas

### Legadas ou em quarentena

- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/index.ts` quando promove surface legado acima do moderno
- `backend/server/src/index.ts` nas rotas `/api/oportunidades` e `/api/oportunidades/pipeline`
- `src/store/index.ts` para pipeline operacional e kanban legado
- `src/data/catalogRepository.ts` para persistencia de pipeline em `localStorage`
- `src/config/pipelines.ts` para heuristicas `Product -> Pipeline`
- `src/api/client.ts` quando expoe `/api/oportunidades`

### Proibidas como source of truth

- `localStorage` como runtime operacional
- `store` como ownership canonico de `Opportunity` ou `Pipeline`
- heuristica de produto para inferir pipeline
- labels de frontend como identificador canonico de stage
- rotas legadas como base definitiva de dados

---

## 7. Escopo Permitido da Proxima Onda

A proxima onda permitida e a `Wave 1 - Contract Consolidation`.

Escopo permitido:

- consolidar contratos oficiais;
- manter clients modernos como preferenciais;
- documentar e isolar a superficie legada;
- preparar frontend para consumir backend como verdade unica;
- preservar compatibilidade enquanto houver consumidores ativos.

Escopo ainda permitido em modo transitorio:

- leitura do backend moderno;
- compatibilidade temporaria com dados legados;
- coexistencia controlada apenas enquanto existirem consumidores nao migrados.

---

## 8. Escopo Proibido

Nao e permitido nesta fase:

- implementar runtime novo;
- refatorar frontend para novo fluxo operacional;
- alterar `store`;
- alterar `localStorage`;
- alterar APIs legadas;
- remover arquivos;
- criar migration;
- criar endpoint novo;
- mover ownership de escrita para frontend;
- tratar `catalogRepository` como source of truth;
- tratar `dataService` como runtime oficial;
- tratar `backend/server/src/index.ts` como owner canonico de novo fluxo.

---

## 9. Plano de Ondas

### Wave 1 - Contract Consolidation

Objetivo:

- fechar o contrato arquitetural entre backend moderno, frontend consumidor e superficies legadas.

Entregas esperadas:

- documentos de ownership final;
- contratos oficiais claramente descritos;
- superficie legada classificada;
- consumers inventariados.

### Wave 2 - Backend Foundation

Objetivo:

- garantir que backend moderno e o unico owner operacional do dominio.

Entregas esperadas:

- validator forte;
- repository/service completos;
- regras de tenant e RBAC aplicadas;
- audit consistente.

### Wave 3 - API Surface

Objetivo:

- alinhar rotas e clients ao backend moderno.

Entregas esperadas:

- clients modernos como caminho principal;
- clients legados em quarentena;
- barrels sem promover legados como primarios.

### Wave 4 - Frontend Consumption

Objetivo:

- remover fallback operacional do frontend.

Entregas esperadas:

- `Oportunidades.tsx` consumindo backend como fonte primaria;
- `admin/Pipelines.tsx` sem ownership local;
- `SdrIaHub.tsx` sem dependencia em fluxo mock/legado;
- UI apenas consumidora.

### Wave 5 - Legacy Cleanup

Objetivo:

- remover o que sobrar da surface antiga apos zero consumidores.

Entregas esperadas:

- `oportunidades.api.ts` removido;
- `backend/server/src/index.ts` sem rotas antigas de oportunidade;
- `store` limpo de estado operacional de dominio;
- `catalogRepository` sem ownership de pipeline;
- `config/pipelines.ts` sem heuristicas canônicas.

---

## 10. Critérios de GO / NO-GO

### GO

Somente quando todas as condicoes abaixo estiverem verdadeiras:

- backend moderno possui ownership completo de leitura e escrita;
- frontend nao depende mais de `store` ou `localStorage` para verdade operacional;
- contratos oficiais estao claros e consistentes;
- consumers legados foram inventariados e enquadrados;
- nao existem duplicidades que alterem o resultado de negocio sem controle.

### GO WITH RESTRICTIONS

Estado atual aprovado:

- backend moderno existe e e valido;
- frontend ainda e transitorio;
- coexistencia legada ainda precisa ser controlada;
- qualquer migracao futura deve seguir ondas.

### NO-GO

- qualquer tentativa de remover superficies legadas sem consumidora confirmada;
- qualquer tentativa de reclassificar `store`, `dataService` ou `catalogRepository` como source of truth;
- qualquer implementacao runtime fora do backend moderno aprovado.

---

## 11. Impacto por Arquivo

### 11.1 `src/pages/Oportunidades.tsx`

Impacto:

- deve ser tratado como consumer em migracao;
- ainda carrega fallback e heuristicas legadas;
- nao pode ser usado como prova de ownership canonico.

### 11.2 `src/pages/admin/Pipelines.tsx`

Impacto:

- ainda opera como owner local de configuracao;
- precisa migrar para backend;
- nao e fonte oficial.

### 11.3 `src/pages/SdrIaHub.tsx`

Impacto:

- ainda usa `dataService` para criar oportunidade;
- deve ser tratado como consumer transitivo;
- precisa ser monitorado como superficie de transicao.

### 11.4 `src/store/index.ts`

Impacto:

- contem estado operacional legado de pipeline e oportunidades;
- pode continuar existindo apenas como compatibilidade transitiva;
- nao e ownership canonico.

### 11.5 `src/api/dataService.ts`

Impacto:

- continua sendo camada unificada, mas nao source of truth;
- `USE_MOCKS` em dev explicito pode mascarar comportamento real;
- deve permanecer em quarentena ate completa migracao.

### 11.6 `src/data/catalogRepository.ts`

Impacto:

- persiste settings de pipeline em `localStorage`;
- representa ownership legado de configuracao;
- deve sair do caminho de runtime canonico.

### 11.7 `backend/server/src/index.ts`

Impacto:

- ainda expoe rotas legadas de oportunidade;
- e surface de compatibilidade;
- nao deve ser base para novo contrato.

---

## 12. Regras Obrigatorias para Futura Migracao Frontend

- Frontend nunca pode definir o contrato canonico sozinho.
- Frontend nunca pode inferir `Pipeline` por heuristica de `Product`.
- Frontend nunca pode usar `localStorage` como verdade operacional de dominio.
- Frontend nunca pode voltar a consultar `store` como fallback canonico para `Opportunity` ou `Pipeline`.
- Frontend deve consumir `opportunities.api.ts` e `pipelines.api.ts` como caminho oficial.
- Qualquer nova tela de administracao de pipeline deve consumir backend moderno.
- Qualquer dependencia legada precisa ser explicitamente classificada como transitoria ou proibida.
- Mudancas de runtime devem ser feitas somente apos aprovacao de contrato e ownership.

---

## 13. Matriz de Classificacao

| Recurso | Classificacao | Motivo |
|---|---|---|
| `backend/src/modules/opportunities/**` | KEEP | owner canonico de Opportunity |
| `backend/src/modules/pipelines/**` | KEEP | owner canonico de Pipeline e Stage |
| `backend/prisma/schema.prisma` | KEEP | schema canonico |
| `src/api/modules/opportunities.api.ts` | KEEP | client moderno oficial |
| `src/api/modules/pipelines.api.ts` | KEEP | client moderno oficial |
| `src/pages/Oportunidades.tsx` | MIGRATE | consumer hibrido com fallback legada |
| `src/pages/admin/Pipelines.tsx` | QUARANTINE | configuracao local ainda operando |
| `src/pages/SdrIaHub.tsx` | QUARANTINE | cria oportunidade via camada transitiva |
| `src/store/index.ts` | QUARANTINE | estado operacional legado persistido |
| `src/data/catalogRepository.ts` | QUARANTINE | settings de pipeline em localStorage |
| `src/config/pipelines.ts` | QUARANTINE | heuristicas e catalogo legados |
| `src/api/dataService.ts` | QUARANTINE | unificacao transitiva com mock dev |
| `src/api/modules/oportunidades.api.ts` | REMOVE LATER | client legado sem ownership canonico |
| `backend/server/src/index.ts` | QUARANTINE | rotas legadas paralelas |

---

## 14. Resumo Final

Este documento fecha o ownership arquitetural de `Opportunity` e `Pipeline`.

Decisao final:

- backend moderno: KEEP;
- frontend: MIGRATE / QUARANTINE;
- APIs modernas: KEEP;
- APIs legadas, store, catalogRepository, dataService e backend server legado: QUARANTINE / REMOVE LATER.

Nenhuma alteracao runtime e autorizada por este documento.
