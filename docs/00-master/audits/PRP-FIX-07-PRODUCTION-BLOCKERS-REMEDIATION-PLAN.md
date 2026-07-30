# PRP-FIX-07 - Production Blockers Remediation Plan

**Status:** Plano oficial de remediacao derivado da PRP-AUD-02
**Base oficial:**
- [PRP-AUD-02 Production Readiness Final Audit](./PRP-AUD-02-PRODUCTION-READINESS-FINAL-AUDIT.md)
- [PRP-Sanitization Program](./PRP-SANITATION-PROGRAM.md)
- [PRP-FIX-01 Persistence Boundary Sanitation Plan](./PRP-FIX-01-PERSISTENCE-BOUNDARY-SANITATION-PLAN.md)
- [PRP-FIX-06 Frontend Runtime Ownership Audit](./PRP-FIX-06-FRONTEND-RUNTIME-OWNERSHIP-AUDIT.md)
- [PRP-FIX-06 Frontend Runtime Ownership Sanitation Plan](./PRP-FIX-06-FRONTEND-RUNTIME-OWNERSHIP-SANITATION-PLAN.md)

## 1. Executive Summary

A PRP-AUD-02 concluiu que o FINQZ EOS ainda nao esta pronto para producao. O problema central nao e falta de build ou de testes. O problema e de fronteira arquitetural: persistencia fora de ownership canonico, identidade com estado operacional no frontend, runtime legado ainda ativo e superficies paralelas de comunicacao e mocks.

Este plano transforma os achados da auditoria final em um programa oficial de remediacao incremental. A estrategia e sequencial:

1. fechar os bloqueadores P0 de backend que afetam tenant, RBAC e permissions;
2. remover o ownership operacional do frontend em identidade e tenant;
3. colapsar superficies legadas do frontend, incluindo EdgeSpark e facade HTTP antiga;
4. desativar runtime mocks e seeds operacionais em producao;
5. tratar a divida residual P2/P3 em um lote separado para nao misturar saneamento critico com limpeza secundaria.

O criterio executivo e simples: a plataforma so pode sair de NO GO quando os lotes 1 a 4 estiverem concluindo os gates de build, testes, isolamento e reauditoria. O lote 5 nao e opcional, mas nao deve atrasar a correcoes de bloqueio principal.

## 2. Backlog Executivo

### Backlog priorizado

| Prioridade | Lote | Tema | Objetivo resumido | Bloqueia producao |
| --- | --- | --- | --- | --- |
| P0 | Lote 1 | Backend Runtime Boundaries | Remover Prisma direto de tenant, RBAC e permissions, preservando tenant scope e audit. | Sim |
| P0 | Lote 2 | Frontend Identity Ownership | Remover `localStorage` operacional de identity/tenant/session e transferir ownership ao backend canonico. | Sim |
| P1 | Lote 3 | Frontend Legacy Runtime | Remover EdgeSpark fallback, facade HTTP legada e fetch direto remanescente. | Sim |
| P1 | Lote 4 | Mocks Runtime | Remover `USE_MOCKS`, mocks vivos, seeds operacionais e fallback runtime. | Sim |
| P2/P3 | Lote 5 | Residual Technical Debt | Tratar debt remanescente, dead code, aliases, duplicidades e observacoes nao bloqueantes. | Nao isoladamente |

### Itens executivos que precisam de fechamento

- Prisma fora de repositories em backend de seguranca e tenant.
- `localStorage` operacional para autenticacao, sessao e ownership de estado.
- Facade HTTP antiga ainda ativa em paginas legadas.
- EdgeSpark como runtime paralelo.
- `USE_MOCKS` em rotas de producao.
- Fetch direto em superficies que devem usar client canonico.

## 3. Tabela de Prioridades

| Severidade | Tema | Risco principal | Decisao |
| --- | --- | --- | --- |
| P0 | Tenant / RBAC / Permissions | Quebra de tenant isolation e autorizacao com acesso direto a persistencia. | Corrigir primeiro |
| P0 | Identity / Session | Browser como fonte de verdade para autenticacao. | Corrigir primeiro |
| P1 | Legacy HTTP / EdgeSpark | Runtime paralelo e superficie contratual duplicada. | Corrigir em seguida |
| P1 | Mocks Runtime | Comportamento de producao divergente do backend real. | Corrigir em seguida |
| P2 | Provider / Integrations debt | Acoplamento a runtime externo e debt de evolucao. | Corrigir em lote separado |
| P3 | Cleanup legado | Aliases, wrappers, docs, dead code e observacoes. | Corrigir ao final |

## 4. Cronograma

### Ordem recomendada

1. **PRP-FIX-07-W1** - Backend Runtime Boundaries
2. **PRP-FIX-07-W2** - Frontend Identity Ownership
3. **PRP-FIX-07-W3** - Frontend Legacy Runtime
4. **PRP-FIX-07-W4** - Mocks Runtime e Cleanup Operacional
5. **PRP-AUD-02.1** - Reauditoria final de producao

### Sequenciamento tecnico

- W1 e W2 tratam os maiores riscos de seguranca e ownership.
- W3 remove o runtime paralelo e a superficie HTTP duplicada.
- W4 elimina a divergencia operacional causada por mocks e seeds.
- PRP-AUD-02.1 valida o estado consolidado e decide a passagem para `GO WITH RESTRICTIONS` ou `GO`.

## 5. Plano por Lote

### Lote 1 - P0 Backend Runtime Boundaries

**Objetivo**
Confinar decisao de tenant, RBAC e permissions a repositorios canonicos, removendo Prisma direto de middleware e services sensiveis.

**Escopo**
`backend/src/middlewares/enterprise.ts`
`backend/src/middlewares/rbac.ts`
`backend/src/modules/permissions/service.ts`
`backend/src/core/http/middleware.ts` como dependencia de ajuste, se necessario para fechar bootstrap de autenticacao.

**Arquivos envolvidos**
- `backend/src/middlewares/enterprise.ts`
- `backend/src/middlewares/rbac.ts`
- `backend/src/modules/permissions/service.ts`
- `backend/src/core/http/middleware.ts`
- repositories canonicos relacionados a tenant, memberships, roles, permissions e audit

**Runtime afetado**
Identity, Tenant, RBAC, Audit, Security

**Risco**
Altissimo. Qualquer regressao aqui pode invalidar tenant isolation, autorizacao e auditabilidade.

**Dependencias**
- repositories existentes ou a serem criados para tenant, membership, role, permission e audit;
- testes de middleware e service;
- verificacao de consistencia com ownership canonicamente definido.

**Criterio de aceite**
- nenhum acesso direto ao Prisma no escopo;
- middleware e services operam apenas como orquestradores;
- tenant scope preservado;
- RBAC preservado;
- audit preservado;
- build e testes verdes.

**Testes obrigatorios**
- testes unitarios de middleware e service;
- testes de integracao para autenticao e autorizacao;
- cobertura de tenant scope e RBAC;
- testes de regressao de permissao/role/membership.

**Criterio de reauditoria**
- scan sem Prisma direto no escopo;
- nenhum bypass de tenant ou RBAC;
- nenhum comportamento funcional alterado em login, autorizacao ou resolucao de tenant.

**Build esperado**
Sem impacto estrutural fora dos arquivos saneados.

**Testes esperados**
Suite backend critica de auth/tenant/RBAC verde.

**Score esperado apos conclusao**
Backend Readiness Score acima de 60 no eixo de seguranca, com reduc ao menos material do debt P0.

**Bloqueia producao?**
SIM

---

### Lote 2 - Frontend Identity Ownership

**Objetivo**
Remover `localStorage` como fonte de verdade de identidade, sessao e ownership de tenant no frontend.

**Escopo**
`src/auth/session.ts`
`src/hooks/useApiErrorHandler.tsx`
`src/layouts/MainLayout.tsx`
`src/main.tsx`
`src/utils/idGenerator.ts`
`src/data/catalogRepository.ts`
`src/pages/Campanhas.tsx`

**Arquivos envolvidos**
- `src/auth/session.ts`
- `src/hooks/useApiErrorHandler.tsx`
- `src/layouts/MainLayout.tsx`
- `src/main.tsx`
- `src/utils/idGenerator.ts`
- `src/data/catalogRepository.ts`
- `src/pages/Campanhas.tsx`

**Runtime afetado**
Identity, Tenant, Frontend Shell, UX bootstrap

**Risco**
Alto. O browser deixa de ser fonte de verdade para token, sessao, tenant e estado operacional.

**Dependencias**
- backend canonico para bootstrap de sessao;
- clients HTTP oficiais;
- possivel ajuste de store oficial para identidade/tenant.

**Criterio de aceite**
- `localStorage` operacional removido do ownership de identidade/tenant;
- apenas uso tecnico minimo, se explicitamente necessario, permanece justificado;
- logout, refresh e tenant switch preservados;
- usuario, tenant, roles e permissions vem do backend/client oficial.

**Testes obrigatorios**
- testes de auth/session;
- testes de bootstrap de identidade;
- testes de logout/refresh;
- testes de integracao de tenant switch.

**Criterio de reauditoria**
- inventario de `localStorage` mostra apenas usos tecnicos justificaveis;
- nao ha fallback operacional de identity/tenant;
- nao ha mocks para sessao em runtime.

**Build esperado**
Sem quebra de empacotamento ou bootstrap.

**Testes esperados**
Suite frontend de auth e shell verde.

**Score esperado apos conclusao**
Frontend Readiness Score com reducao forte de debt operacional de identidade.

**Bloqueia producao?**
SIM

---

### Lote 3 - Frontend Legacy Runtime

**Objetivo**
Colapsar a superficie HTTP legada, remover EdgeSpark fallback e eliminar fetch direto indevido.

**Escopo**
`src/api/client.ts`
`src/api/finqzClient.ts`
`src/pages/Audiencias.tsx`
`src/pages/Campanhas.tsx`
`src/pages/Conversas.tsx`
`src/pages/Eventos.tsx`
`src/data/cepService.ts`
`src/pages/Oportunidades.tsx`

**Arquivos envolvidos**
- `src/api/client.ts`
- `src/api/finqzClient.ts`
- `src/pages/Audiencias.tsx`
- `src/pages/Campanhas.tsx`
- `src/pages/Conversas.tsx`
- `src/pages/Eventos.tsx`
- `src/data/cepService.ts`
- `src/pages/Oportunidades.tsx`

**Runtime afetado**
Frontend HTTP Surface, Identity bootstrap, Opportunity, CRM, legacy compatibility

**Risco**
Alto. Enquanto houver facade e fallback, existe runtime paralelo e superficie contratual ambigua.

**Dependencias**
- conclusao do Lote 2;
- clients HTTP oficiais ja consolidados;
- eventuais ajustes em pages consumidoras.

**Criterio de aceite**
- `api` legada deixa de ser rota operacional;
- EdgeSpark fallback e retirado do caminho de producao;
- fetch direto indevido removido ou encapsulado em client oficial;
- pages migram para client canonico.

**Testes obrigatorios**
- testes de pages migradas;
- testes de client HTTP canonico;
- testes de regressao de oportunidades, campanhas, audiencias, eventos e conversas.

**Criterio de reauditoria**
- inventario HTTP mostra unificacao efetiva;
- nenhum fallback paralelo ativo em runtime;
- nenhuma pagina de producao depende da facade antiga.

**Build esperado**
Sem regressao de import/export.

**Testes esperados**
Suite frontend de paginas e HTTP verde.

**Score esperado apos conclusao**
Frontend Readiness Score sobe com reducao de debt legada e de duplicidade de surface.

**Bloqueia producao?**
SIM

---

### Lote 4 - Mocks Runtime

**Objetivo**
Eliminar `USE_MOCKS`, mocks vivos, seeds operacionais e fallback data em runtime de producao.

**Escopo**
Frontend runtime com mocks vivos, inclusive paginas e componentes ainda condicionados por `USE_MOCKS`, mock data e seeds ativas.

**Arquivos envolvidos**
- paginas, hooks, providers e componentes que ainda consumam `USE_MOCKS`
- qualquer seed ou fallback operacional ainda presente em runtime

**Runtime afetado**
UI runtime, CRM, Pipeline, Opportunity, Commercial e surfaces de simulacao visual

**Risco**
Medio a alto. Mock runtime mascara falhas de backend e cria divergencia de comportamento.

**Dependencias**
- Lotes 2 e 3 concluidos;
- inventories de mocks e fallbacks validados;
- clients oficiais plenamente operacionais.

**Criterio de aceite**
- nenhum `USE_MOCKS` em runtime de producao;
- nenhum mock vivo ou fallback operacional;
- seeds apenas em contexto de teste ou migracao formal;
- comportamento real passa a vir do backend/canonico.

**Testes obrigatorios**
- testes de build com runtime sem mocks;
- testes de pages removidas de fallback;
- testes de integracao que garantam ausencia de branch mock em producao.

**Criterio de reauditoria**
- scan de runtime nao encontra `USE_MOCKS` fora de testes;
- nenhum mock de producao permanece ativo;
- no runtime, a UI depende apenas de contratos oficiais.

**Build esperado**
Sem impacto estrutural, apenas limpeza de caminho.

**Testes esperados**
Suite frontend sem branches de mock.

**Score esperado apos conclusao**
Frontend Readiness e Platform Readiness ganham consistencia de execucao real.

**Bloqueia producao?**
SIM

---

### Lote 5 - Residual Technical Debt

**Objetivo**
Tratar o debt residual P2/P3 sem atrasar o fechamento dos bloqueadores criticos.

**Escopo**
- provider/runtime debt;
- fetch externo direto nao bloqueador;
- aliases legados;
- wrappers obsoletos;
- dead code;
- observacoes em pipeline/opportunity/commercial fora do escopo imediato.

**Arquivos envolvidos**
- `backend/src/index.ts`
- `backend/server/src/index.ts`
- `src/config/*`
- outros artefatos identificados como P2/P3 na auditoria

**Runtime afetado**
Provider Runtime, Integrations, Legacy Cleanup, docs e observabilidade auxiliar

**Risco**
Baixo a medio. Nao e o blocker principal, mas reduz a qualidade de manutencao e a clareza arquitetural.

**Dependencias**
- lotes 1 a 4 estabilizados;
- inventario de debt atualizado;
- reauditoria parcial por dominio.

**Criterio de aceite**
- debt P2/P3 inventariado e reduzido;
- nenhum impacto em tenant, RBAC, identity ou HTTP canonico;
- observacoes de fora de escopo registradas, nao corrigidas fora do lote.

**Testes obrigatorios**
- testes direcionados de regressao onde houver remocao real;
- build e suite verde;
- verificacoes de import/execucao para garantir ausencia de quebra lateral.

**Criterio de reauditoria**
- backlog residual documentado;
- nenhuma pendencia P0/P1 sem cobertura;
- pontos P2/P3 classificados e aceitos como debt controlado.

**Build esperado**
Estavel.

**Testes esperados**
Sem aumento relevante de falhas.

**Score esperado apos conclusao**
Melhoria marginal, com ganho importante em manutenibilidade e governanca.

**Bloqueia producao?**
NAO isoladamente, mas deve ser acompanhado.

## 6. Checklist de Aceite

- [ ] Lote 1 removeu Prisma direto das fronteiras de tenant, RBAC e permissions.
- [ ] Lote 1 preservou tenant scope, audit, correlation e autorizacao.
- [ ] Lote 2 removeu `localStorage` operacional de identidade e tenant.
- [ ] Lote 2 preservou login, logout, refresh e switch de tenant.
- [ ] Lote 3 removeu EdgeSpark fallback e facade HTTP legada do caminho de producao.
- [ ] Lote 3 eliminou fetch direto indevido.
- [ ] Lote 4 removeu `USE_MOCKS` e mocks vivos de runtime.
- [ ] Lote 5 inventariou e reduziu debt residual P2/P3.
- [ ] Build e suite permanecem verdes em cada lote.
- [ ] Cada lote passou por reauditoria antes do fechamento.
- [ ] Nenhum lote alterou arquitetura, contratos ou Runtime Foundation.

## 7. Criterios de Reauditoria

Uma reauditoria so pode ser aberta quando:

1. o lote em questao estiver concluido;
2. os testes obrigatorios estiverem verdes;
3. o scan do escopo mostrar ausencia do problema alvo;
4. o comportamento funcional anterior estiver preservado;
5. os riscos residuais estiverem explicitados.

Uma reauditoria pode converter o estado da plataforma apenas se:

- nao existir nenhum P0 aberto;
- os P1 restantes estiverem justificados, inventariados e sem runtime paralelo;
- o backend critico estiver sem Prisma fora de fronteira;
- o frontend critico nao usar `localStorage` como ownership operacional;
- nao houver mocks ou fallbacks de producao ativos.

## 8. Criterios para Converter Estado

### De `NO GO` para `GO WITH RESTRICTIONS`

Requisitos minimos:

- Lote 1 concluido e auditado;
- Lote 2 concluido e auditado;
- nenhum P0 remanescente;
- nenhum risco de tenant isolation ou RBAC bypass;
- frontend de identidade e tenant sem ownership paralelo;
- build e testes verdes.

### De `GO WITH RESTRICTIONS` para `GO`

Requisitos minimos:

- Lotes 3 e 4 concluidos;
- superficies legadas e mocks de runtime removidos;
- nenhum runtime paralelo ativo;
- debt residual P2/P3 classificado e nao bloqueante;
- reauditoria final sem achados P0/P1 que ameacem producao.

## 9. Roadmap Oficial

| Marco | Conteudo | Resultado esperado |
| --- | --- | --- |
| PRP-FIX-07-W1 | Backend Runtime Boundaries | Tenant, RBAC e permissions saneados |
| PRP-FIX-07-W2 | Frontend Identity Ownership | Sessao e identidade deixem de depender de `localStorage` operacional |
| PRP-FIX-07-W3 | Frontend Legacy Runtime | Facade HTTP legada e EdgeSpark retirados do runtime |
| PRP-FIX-07-W4 | Mocks Runtime | `USE_MOCKS` e mocks de producao removidos |
| PRP-AUD-02.1 | Reauditoria final | Decisao formal sobre `GO WITH RESTRICTIONS` ou `GO` |

## 10. Observacoes de Governanca

- Este plano nao autoriza correcoes fora do escopo de cada lote.
- Problemas encontrados em runtimes adjacentes devem ser registrados como observacao, nao corrigidos fora do lote.
- Nao deve haver regressao de build ou teste em nenhum lote.
- O programa de remediacao e incremental: cada fechamento deve reduzir risco real e nao apenas reorganizar codigo.

## 11. Veredito Tecnico

**NO GO ate a conclusao dos lotes 1 a 4 e da reauditoria PRP-AUD-02.1.**

Justificativa:
- os bloqueadores de producao sao de fronteira, nao de sintaxe;
- ainda ha ownership indevido em backend e frontend;
- runtime legado e mocks continuam podendo mascarar falhas;
- o estado atual e bom o suficiente para remediacao incremental, mas nao para producao.
