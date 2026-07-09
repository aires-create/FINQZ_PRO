# PRP-FIX-01 - Persistence Boundary Sanitation Plan

**Base obrigatoria:** [PRP-AUD-01 Cross Architecture Runtime Audit](./PRP-AUD-01-CROSS-ARCHITECTURE-RUNTIME-AUDIT.md)  
**Status:** Plano tecnico - nao implementado  
**Objetivo:** sanear acessos diretos ao Prisma fora das fronteiras canonicas, com correcao incremental e sem quebra de comportamento

## 1. Resumo executivo

A auditoria confirmou que o repositório esta funcional e com baseline tecnico valido, mas a fronteira de persistencia ainda nao esta totalmente disciplinada.

O principal problema nao e de build, testes ou runtime boot. O problema e de **ownership de persistencia**:

- varios modulos de dominio ainda acessam `prisma` diretamente em services, controllers e routes;
- a camada de persistencia nao esta uniformemente absorvida por repositories canonicos;
- a separacao entre Identity, Tenant, RBAC, Pipeline, Opportunity e Commercial ainda mistura consulta, regra e escrita;
- alguns modulos ja possuem repositories, mas continuam com bypass parcial;
- a correção precisa ser incremental para nao quebrar o comportamento atual.

**Veredito tecnico do plano:** `GO WITH RESTRICTIONS`

Pode iniciar o saneamento, desde que siga a ordem recomendada abaixo e mantenha os testes de caracterizacao antes de remover qualquer acesso direto.

---

## 2. Modulos com acesso direto ao Prisma

### P1 - Acao prioritária

1. `backend/src/modules/auth/service.ts`
2. `backend/src/modules/auth/controller.ts`
3. `backend/src/modules/auth/services/auth.service.ts`
4. `backend/src/modules/users/users.routes.ts`
5. `backend/src/modules/roles/service.ts`
6. `backend/src/modules/organizations/service.ts`
7. `backend/src/modules/memberships/service.ts`
8. `backend/src/modules/pipelines/service.ts`
9. `backend/src/modules/opportunities/services/opportunities.service.ts`
10. `backend/src/modules/commercial/services/commercial.service.ts`

### P2 - Monitoramento e normalizacao

11. `backend/src/modules/audit/repositories/audit.repository.ts`
12. `backend/src/modules/security-events/repository.ts`

Observacao: os itens 11 e 12 ja estao em camada de repository e, por isso, nao sao o mesmo tipo de violacao que os services/routes acima. Ainda assim, devem seguir o padrao canonico de ownership, contrato e isolamento.

---

## 3. Severidade

### P0

Nenhum P0 confirmado.

Motivo:

- build esta verde;
- suite backend canonica esta verde;
- nao ha evidência de corrupcao estrutural imediata.

### P1

Violacoes de fronteira com maior risco operacional:

- `auth/service.ts`
- `auth/controller.ts`
- `auth/services/auth.service.ts`
- `users/users.routes.ts`
- `roles/service.ts`
- `organizations/service.ts`
- `memberships/service.ts`
- `pipelines/service.ts`
- `opportunities/services/opportunities.service.ts`
- `commercial/services/commercial.service.ts`

Risco principal:

- persistencia sendo executada fora de repositories canonicos ou usando repositories parciais;
- tenant scope e RBAC podem ser aplicados de forma inconsistente;
- audit/correlation/idempotency podem ser omitidos em pontos de escrita.

### P2

Modulos em camada de repository que ainda exigem padronizacao fina:

- `audit/repositories/audit.repository.ts`
- `security-events/repository.ts`

### P3

Cleanup estrutural e governanca:

- duplicidade de entrypoints de Prisma;
- consolidação de repositorios parciais;
- remocao de bypass remanescentes apos o saneamento principal.

---

## 4. Ownership correto por Runtime Domain

### Identity Runtime

Responsavel por:

- `auth/service.ts`
- `auth/controller.ts`
- `auth/services/auth.service.ts`
- `users/users.routes.ts`
- `roles/service.ts`

### Tenant Runtime

Responsavel por:

- `organizations/service.ts`
- `memberships/service.ts`

### RBAC Runtime

Responsavel por:

- `roles/service.ts`
- parte de `auth/service.ts`
- parte de `users/users.routes.ts`

### Pipeline Runtime

Responsavel por:

- `pipelines/service.ts`

### Opportunity Runtime

Responsavel por:

- `opportunities/services/opportunities.service.ts`

### Commercial Runtime

Responsavel por:

- `commercial/services/commercial.service.ts`

### Audit Runtime / Security Runtime

Responsavel por:

- `audit/repositories/audit.repository.ts`
- `security-events/repository.ts`

---

## 5. Repositories existentes que devem ser usados

### Ja existentes e canonicos para reaproveitar

- `backend/src/modules/auth/repositories/auth.repository.ts`
- `backend/src/modules/pipelines/repository.ts`
- `backend/src/modules/pipelines/domain/pipeline-repository.contract.ts`
- `backend/src/modules/opportunities/repositories/opportunities.repository.ts`
- `backend/src/modules/crm/repositories/customers.repository.ts`
- `backend/src/modules/crm/repositories/leads.repository.ts`
- `backend/src/modules/commercial/repositories/commercial-table.repository.ts`
- `backend/src/modules/commercial/repositories/commercial-condition.repository.ts`
- `backend/src/modules/audit/repositories/audit.repository.ts`
- `backend/src/modules/security-events/repository.ts`

### Leitura arquitetural

- `auth.repository.ts` existe, mas cobre apenas lookup pontual; nao absorve o ciclo completo de autenticacao.
- `pipelines.repository.ts` ja e a fronteira canônica do dominio.
- `opportunities.repository.ts` ja e a fronteira canônica principal, mas o service ainda faz consultas diretas adicionais.
- `commercial-*` ja tem repositorios, mas o service ainda executa transacoes via `prisma`.
- `audit` e `security-events` ja estao em repositories, mas precisam permanecer estritamente isolados e consistentes com a governance EOS.

---

## 6. Repositories ausentes que devem ser criados

Os seguintes repositorios nao estao presentes hoje de forma suficiente para absorver os acessos diretos ao Prisma:

- `UserRepository`
- `RoleRepository`
- `OrganizationRepository`
- `MembershipRepository`
- `TenantRepository`
- `RefreshTokenRepository`
- `PermissionRepository` ou um contrato equivalente para permissao de role

Observacao:

- nao e necessario criar todos de uma vez;
- a criacao deve acompanhar o lote de correcao do respectivo runtime;
- se um repository existente puder ser expandido sem quebrar o contrato publico, isso e preferivel a criar um novo.

---

## 7. Services e use cases que precisam ser ajustados

### Identity Runtime

- `AuthService.register`
- `AuthService.login`
- `AuthService.refreshToken`
- `AuthService.changePassword`
- `AuthService.logout`
- `AuthService.logoutAll`
- `AuthController.register`
- `AuthController.login`
- `AuthController.refreshToken`
- `AuthController.changePassword`
- `AuthController.getProfile`
- `AuthController.getSession`
- `AuthController.logout`
- `AuthController.logoutAll`
- `AuthRepository.findUserByEmail` deve deixar de ser apenas utilitario e ganhar papel de fronteira real, ou ser substituido por repositorios mais especificos

### Tenant Runtime

- `OrganizationsService.listOrganizations`
- `OrganizationsService.getOrganizationTree`
- `OrganizationsService.getOrganization`
- `OrganizationsService.createOrganization`
- `OrganizationsService.updateOrganization`
- `OrganizationsService.deleteOrganization`
- `MembershipsService.listMemberships`
- `MembershipsService.listUserMemberships`
- `MembershipsService.getMembership`
- `MembershipsService.createMembership`
- `MembershipsService.updateMembership`
- `MembershipsService.deleteMembership`
- `MembershipsService.acceptMembership`

### RBAC Runtime

- `RolesService.createRole`
- `RolesService.getRole`
- `RolesService.getRoles`
- `RolesService.updateRole`
- `RolesService.deleteRole`
- `RolesService.updateRolePermissions`

### Pipeline Runtime

- `PipelinesService.listActiveByTenant`
- `PipelinesService.listActivePipelines`
- `PipelinesService.createPipeline`
- `PipelinesService.updatePipeline`
- `PipelinesService.deactivatePipeline`
- `PipelinesService.createStage`
- `PipelinesService.updateStage`
- `PipelinesService.deactivateStage`
- `PipelinesService.reorderStages`

### Opportunity Runtime

- `OpportunitiesService.list`
- `OpportunitiesService.getById`
- `OpportunitiesService.create`
- `OpportunitiesService.createOpportunityIntake`
- `OpportunitiesService.update`
- `OpportunitiesService.moveStage`
- `OpportunitiesService.archive`
- helpers de validacao e resolucao que ainda chamam Prisma diretamente

### Commercial Runtime

- `CommercialService.listTables`
- `CommercialService.getTableDetails`
- `CommercialService.createTable`
- `CommercialService.updateTable`
- `CommercialService.replaceConditions`
- `CommercialService.deleteTable`

### Audit / Security Runtime

- manter como repositories, mas validar se as rotas de chamada estao corretas e se nao ha duplicidade de ownership

---

## 8. Riscos de tenant scope

### Riscos gerais

- queries sem `tenantId` em todos os caminhos de leitura e escrita;
- writes com `where` por `id` sem validacao adicional de tenant;
- checks de unicidade executados fora do escopo do tenant;
- bootstrap de tenant em autenticacao com regras implicitas.

### Modulos mais expostos

- `auth/service.ts`
- `users/users.routes.ts`
- `roles/service.ts`
- `organizations/service.ts`
- `memberships/service.ts`
- `opportunities/services/opportunities.service.ts`
- `commercial/services/commercial.service.ts`

### Efeito esperado se nao corrigir

- vazamento entre tenants;
- leituras inconsistentes;
- escrita em entidade errada;
- dificuldade para auditar o ownership real do dado.

---

## 9. Riscos de RBAC

- `users.routes.ts` usa permissao apenas em parte do fluxo;
- `roles/service.ts` gerencia permissao e papel diretamente com Prisma, o que pode contornar policy centralizada;
- `auth/service.ts` monta claims e role assignment sem fronteira unica de autorizacao;
- `memberships/service.ts` pode alterar ownership de usuario e organizacao sem validar a politica de acesso em uma fronteira canonica.

Se o saneamento nao for feito com testes, o resultado pode ser:

- permissão aplicada tarde demais;
- permissao aplicada em local errado;
- endpoints com diferencas entre leitura e escrita.

---

## 10. Riscos de audit, correlation e idempotency

- `auth/service.ts` gera eventos de seguranca, mas ainda mistura persistencia, autenticacao e observabilidade;
- `opportunities/services/opportunities.service.ts` e `commercial/services/commercial.service.ts` fazem operacoes transacionais sem uniformizar a trilha de auditoria;
- chamadas diretas ao Prisma podem ignorar o fluxo padrao de correlation/idempotency ja previsto no runtime base.

Risco arquitetural:

- o dado persiste corretamente, mas perde a trilha governavel.

---

## 11. Ordem recomendada de correcao

### Lote 1 - Identity Runtime

1. `auth/service.ts`
2. `auth/controller.ts`
3. `auth/services/auth.service.ts`
4. `users/users.routes.ts`
5. `roles/service.ts`

Motivo:

- este lote define identidade, sessao, role e claims;
- qualquer inconsistencia aqui se espalha para todos os outros runtimes.

### Lote 2 - Tenant Runtime

1. `organizations/service.ts`
2. `memberships/service.ts`

Motivo:

- o tenant scope deve ser estabilizado logo apos a identidade.

### Lote 3 - Pipeline Runtime

1. `pipelines/service.ts`

Motivo:

- dependencias relativamente confinadas;
- bom candidato para primeiro refactor com repository completo.

### Lote 4 - Opportunity Runtime

1. `opportunities/services/opportunities.service.ts`

Motivo:

- maior densidade de consultas cruzadas e validacoes de escopo.

### Lote 5 - Commercial Runtime

1. `commercial/services/commercial.service.ts`

Motivo:

- uso transacional forte e dependencia de tabelas de negocio.

### Lote 6 - Audit / Security final

1. `audit/repositories/audit.repository.ts`
2. `security-events/repository.ts`

Motivo:

- nao sao o principal problema, mas precisam permanecer canonicos e consistentes.

---

## 12. Critérios de aceite por modulo

### Identity Runtime

- nenhum `prisma` importado em service/controller;
- toda persistencia de usuario, role, tenant e token via repository;
- login, refresh, logout e changePassword continuam com comportamento idêntico;
- testes cobrem sucesso, erro e tenant scope.

### Tenant Runtime

- organizacao e membership persistem apenas por repository;
- as regras de unicidade e hierarquia continuam funcionando;
- tenant scope sempre presente.

### RBAC Runtime

- role e permission deixam de depender de acesso direto ao Prisma;
- relacoes de permissao continuam estáveis;
- usuarios sem papel/permissão continuam bloqueados da mesma forma.

### Pipeline Runtime

- nenhuma regressao no ciclo de pipeline e stage;
- repository unico como fonte de persistencia;
- validacoes de integridade continuam.

### Opportunity Runtime

- create/update/move/archive preservam contratos;
- consultas de pipeline/stage/customer/lead/produto deixam de acessar Prisma diretamente;
- nenhum comportamento funcional muda.

### Commercial Runtime

- crud de tabela e condicao continua identico;
- transacoes seguem repository boundary;
- nenhum efeito colateral extra.

### Audit / Security Runtime

- camadas permanecem canonicas;
- nenhuma regressao em logs e trilhas.

---

## 13. Testes obrigatorios por correcao

### Para cada lote

1. testes de caracterizacao do comportamento atual;
2. testes unitarios do novo repository ou adapter;
3. testes de service/use case garantindo que a assinatura publica nao mudou;
4. testes de tenant isolation;
5. testes de RBAC quando houver autorizacao;
6. testes de audit/correlation/idempotency quando a escrita for sensivel;
7. teste estrutural verificando ausencia de import direto de Prisma no service/refatorado.

### Critério minimo por modulo

- `build` verde;
- suite alvo verde;
- nenhum teste de regressao removido;
- nenhum contrato publico quebrado.

---

## 14. Estrategia de migracao sem quebrar comportamento

1. Criar testes de caracterizacao antes de mexer na implementacao.
2. Introduzir repositories ou adapters novos sem alterar a assinatura publica do service.
3. Mover a query Prisma para baixo da fronteira, mantendo o fluxo e os DTOs.
4. Rodar testes do modulo em isolamento.
5. Remover o acesso direto ao Prisma somente depois da equivalencia.
6. Consolidar o import path para o repository canonico.
7. Repetir o processo por lote.

### Regras de migracao

- nao fazer refactor transversal em uma unica PR;
- nao misturar Identity com Opportunity no mesmo lote;
- nao remover um acesso direto sem cobertura de caracterizacao equivalente;
- nao alterar comportamento visivel de HTTP neste plano.

---

## 15. Commits recomendados por lote

### Lote 1

- `fix(prp-fix-01): isolate identity persistence boundary`

### Lote 2

- `fix(prp-fix-01): isolate tenant and rbac persistence boundary`

### Lote 3

- `fix(prp-fix-01): isolate pipeline persistence boundary`

### Lote 4

- `fix(prp-fix-01): isolate opportunity persistence boundary`

### Lote 5

- `fix(prp-fix-01): isolate commercial persistence boundary`

### Lote 6

- `fix(prp-fix-01): normalize audit and security persistence boundary`

---

## 16. Veredito tecnico

**GO WITH RESTRICTIONS**

Motivos:

- o baseline tecnico atual esta saudavel;
- o problema e de governanca de persistencia, nao de estabilidade da plataforma;
- o saneamento pode iniciar agora, mas precisa seguir ordem e cobertura de testes;
- Identity e Tenant devem ser tratados antes de qualquer expansao de refactor.

### Recomendacao oficial para iniciar o primeiro lote de saneamento

Iniciar pelo **Lote 1 - Identity Runtime**:

- `backend/src/modules/auth/service.ts`
- `backend/src/modules/auth/controller.ts`
- `backend/src/modules/auth/services/auth.service.ts`
- `backend/src/modules/users/users.routes.ts`
- `backend/src/modules/roles/service.ts`

Esse lote reduz o maior risco sistêmico primeiro: credencial, tenant bootstrap, role assignment e session lifecycle.
