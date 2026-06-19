# AUD-G2-B — Partner Consumer Dependency Map

## 1. Objetivo

Mapear os consumidores reais de `Partner`/`Parceiros` no frontend e no backend, classificando risco e ordem segura de migração, com base nas decisoes ja consolidadas em:

- `AUD-G1-B Partner Runtime Gap`
- `AUD-G1-C CRM Canonical Ownership`
- `AUD-G1-D Partner Contract Reconciliation`
- `AUD-G1-E Partner Canonical Contract Definition`
- `AUD-G2-A Partner Runtime Modernization Readiness`

## 2. Escopo

Arquivos auditados:

- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx)
- [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx)
- [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx)
- [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx)
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts)
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts)
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts)
- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts)
- [backend/src/modules/crm](C:/Projects/FINQZ_PRO/backend/src/modules/crm)
- [backend/src/modules/opportunities](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities)
- [backend/src/core/http/middleware.ts](C:/Projects/FINQZ_PRO/backend/src/core/http/middleware.ts)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts)
- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma)

Termos buscados:

- `Partner`
- `Parceiro`
- `Parceiros`
- `partnerId`
- `parceiroId`
- `parentId`
- `parent_id`
- `PartnerType`
- `ParceiroResponse`
- `useAppStore`
- `localStorage`

## 3. Consumidores frontend

### 3.1 Consumidores diretos

| Arquivo | Papel | Evidencia |
|---|---|---|
| [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L45) | Consome `useAppStore`, faz CRUD local, persiste em `localStorage` e chama `reset-senha` no backend. | `useAppStore`, `localStorage`, `addParceiro`, `updateParceiro`, `deleteParceiro`, `toggleParceiroStatus` |
| [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx#L12) | Autentica parceiro lendo `parceiros` do store e escrevendo `setAuth`. | `parceiros`, `updateParceiro`, `setAuth` |
| [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx#L17) | Lê `parceiros` e `oportunidades` para montar a area do parceiro. | `user.parceiroId`, `parceiros`, `oportunidades` |
| [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx#L82) | Usa `parceiros` para filtro e vinculacao de usuario parceiro. | `parceiros`, `partner_id`, `partner_type` |
| [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L590) | Usa `parceiros` e `partnerId` como contexto indireto de CRM e filtro de acesso. | `parceiros`, `partnerId`, `parceiroId`, compatibilidade legada |
| [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts#L43) | Client HTTP para o dominio `Parceiros`. | `getAll`, `getById`, `create`, `update`, `delete` |

### 3.2 Dependencias de store e tipos

| Arquivo | Dependencia principal | Risco |
|---|---|---|
| [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L249) | `initialParceiros`, CRUD local e persistencia de estado. | Alto |
| [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts#L14) | `Partner` legado numerico e `Parceiro` duplicado. | Alto |
| [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts#L192) | `ParceiroResponse` legado e `AuthUserData.parceiroId`. | Alto |

## 4. Consumidores backend

### 4.1 Runtime legado

| Arquivo | Papel | Evidencia |
|---|---|---|
| [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1771) | Runtime ativo de `/api/parceiros`. | `GET`, `POST`, `PUT`, `DELETE` |
| [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1785) | Aplica filtro por `user.parceiroId` quando nao e admin. | `tenantFilter`, `user.parceiroId` |
| [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1824) | Retorna `companies`, `franquias` e `franqueados` em envelope. | `parceiros`, `companies`, `franquias`, `franqueados` |
| [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1882) | Persiste parceiro em `tables.parceiros`. | `body.nome`, `body.tipo`, `body.parent_id` |
| [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L979) | `reset-senha` ligado diretamente ao fluxo da tela. | `POST /api/parceiros/:id/reset-senha` |

### 4.2 Backend modular

| Arquivo | Papel | Evidencia |
|---|---|---|
| [backend/src/core/http/middleware.ts](C:/Projects/FINQZ_PRO/backend/src/core/http/middleware.ts#L106) | Usa `partnerId` para classificar escopo do usuario. | `resolveScopeRole`, `partner_user` |
| [backend/src/modules/crm](C:/Projects/FINQZ_PRO/backend/src/modules/crm) | Propaga `partnerId` em leads, customers e filtros de consulta. | `partnerId` em DTOs, validators, services e repositories |
| [backend/src/modules/opportunities](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities) | Usa `partnerId` para escopo, acesso e persistencia de oportunidades. | `partnerId` em services e repositories |

### 4.3 Prisma

| Arquivo | Papel | Evidencia |
|---|---|---|
| [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L129) | Fonte persistida do contrato canônico `Partner`. | `id` UUID, `code`, `name`, `type`, `status`, `tenantId`, `parentId` |

## 5. Dependencias por arquivo

### 5.1 `src/pages/Parceiros.tsx`

- depende de `useAppStore`
- depende de `localStorage`
- depende de `addParceiro`, `updateParceiro`, `deleteParceiro`, `toggleParceiroStatus`
- depende de `fetch` direto em `/api/parceiros/:id/reset-senha`
- depende de `Parceiro` legado de [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts)

### 5.2 `src/pages/LoginParceiro.tsx`

- depende de `useAppStore`
- lê `parceiros` do store
- autentica com `codigo` e `senha` locais
- usa `updateParceiro` para redefinição de senha
- escreve `setAuth` com `parceiroId`

### 5.3 `src/pages/DashboardParceiro.tsx`

- depende de `useAppStore`
- lê `user.parceiroId`
- lê `parceiros`
- lê `oportunidades`
- depende de `parceiro_id` em oportunidade legada

### 5.4 `src/pages/Usuarios.tsx`

- depende de `useAppStore`
- lê `parceiros`
- filtra por `partner_type`
- resolve `partner_id`
- usa `PartnerType` e `partner_id` legados de UI

### 5.5 `src/pages/Oportunidades.tsx`

- depende de `useAppStore`
- lê `parceiros`
- filtra por `partnerId` e `parceiroId`
- usa compatibilidade transitoria de pipeline e oportunidade
- trata `Partner` de forma indireta, como contexto CRM

### 5.6 `src/store/index.ts`

- inicializa `initialParceiros`
- expõe `setParceiros`, `addParceiro`, `updateParceiro`, `deleteParceiro`, `toggleParceiroStatus`
- persiste o store em `finqz-pro-storage`
- ainda usa `localStorage` para avatar e compatibilidade da UI

### 5.7 `src/types/index.ts`

- declara `PartnerType`
- declara `PartnerStatus`
- declara `Partner` numerico
- declara `PartnerFilter`
- declara `Parceiro` legado separado mais abaixo no arquivo

### 5.8 `src/types/api.ts`

- declara `ParceiroResponse`
- declara `AuthUserData.parceiroId`
- consolida contrato legado de API e autenticacao

### 5.9 `src/api/modules/parceiros.api.ts`

- expõe endpoints de listagem, detalhe, arvore, filhos, criacao, atualizacao e exclusao
- depende de `PartnerType`, `PartnerStatus`, `Partner` e `PartnerFilter`
- usa `parent_id?: number`
- usa `id: number`

### 5.10 `backend/src/modules/crm/**`

- usa `partnerId` em `customers`, `leads`, DTOs, services, validators e repositories
- trata `partnerId` como campo de ownership/visibilidade, nao como entidade `Partner`

### 5.11 `backend/src/modules/opportunities/**`

- usa `partnerId` em `OpportunityAccessScope`
- filtra acesso e persistencia por `partnerId`
- usa `partnerId` como chave de escopo operacional

### 5.12 `backend/src/core/http/middleware.ts`

- lê `partnerId` do contexto do usuario
- resolve `partner_user`
- injeta `partnerId` no `TenantContext`

### 5.13 `backend/server/src/index.ts`

- filtra `GET /api/parceiros` por `user.parceiroId`
- retorna envelope com `parceiros`, `companies`, `franquias`, `franqueados`
- cria, atualiza e exclui em `tables.parceiros`
- faz `reset-senha` por id numerico

### 5.14 `backend/prisma/schema.prisma`

- define `Partner` com `UUID`
- define `tenantId` e `parentId`
- define relacoes com `customers`, `opportunities`, `leads`, `users`, `bankProposals` e `commissions`

## 6. Respostas obrigatorias

1. Quem lê `Partner`?
   - `Parceiros.tsx`, `LoginParceiro.tsx`, `DashboardParceiro.tsx`, `Usuarios.tsx`, `Oportunidades.tsx`, `parceirosApi`, `backend/server/src/index.ts`, `backend/src/core/http/middleware.ts`, `backend/src/modules/crm/**`, `backend/src/modules/opportunities/**`, `src/types/index.ts`, `src/types/api.ts`, `src/store/index.ts`.

2. Quem escreve `Partner`?
   - `backend/server/src/index.ts` escreve parceiro em `tables.parceiros`.
   - `src/pages/Parceiros.tsx` escreve via store e `localStorage`.
   - `src/pages/LoginParceiro.tsx` escreve senha no store ao recuperar acesso.
   - `src/store/index.ts` escreve o estado inicial e mutacoes locais.

3. Quem autentica `Partner`?
   - `src/pages/LoginParceiro.tsx` faz a autenticacao do parceiro no frontend.
   - `backend/server/src/index.ts` suporta o ciclo de credenciais via `reset-senha`.
   - `backend/src/core/http/middleware.ts` nao autentica o parceiro, mas usa `partnerId` para classificar escopo.

4. Quem filtra por `Partner`?
   - `src/pages/Parceiros.tsx`
   - `src/pages/Usuarios.tsx`
   - `src/pages/Oportunidades.tsx`
   - `backend/server/src/index.ts`
   - `backend/src/modules/crm/**`
   - `backend/src/modules/opportunities/**`

5. Quem referencia `partnerId`?
   - `src/pages/DashboardParceiro.tsx`
   - `src/pages/Oportunidades.tsx`
   - `src/pages/Usuarios.tsx`
   - `src/types/api.ts`
   - `backend/src/core/http/middleware.ts`
   - `backend/src/modules/crm/**`
   - `backend/src/modules/opportunities/**`

6. Quem referencia `parceiroId`?
   - `src/pages/LoginParceiro.tsx`
   - `src/pages/DashboardParceiro.tsx`
   - `src/types/api.ts`
   - `backend/server/src/index.ts`

7. Quem depende de `useAppStore`?
   - `Parceiros.tsx`, `LoginParceiro.tsx`, `DashboardParceiro.tsx`, `Usuarios.tsx`, `Oportunidades.tsx`.
   - `src/store/index.ts` usa `useAppStore.getState()` internamente para alguns helpers.

8. Quem depende de `localStorage`?
   - `src/pages/Parceiros.tsx` e `src/store/index.ts`.

9. Quem depende de EdgeSpark `/api/parceiros`?
   - `src/api/modules/parceiros.api.ts`
   - `src/pages/Parceiros.tsx` via `fetch` de `reset-senha`
   - `backend/server/src/index.ts` como runtime ativo da rota

10. Quem depende de tipos legados?
   - `src/types/index.ts` com `Partner` numerico e `Parceiro`
   - `src/types/api.ts` com `ParceiroResponse`
   - `src/api/modules/parceiros.api.ts` com contrato numerico
   - `src/pages/Parceiros.tsx` e `src/pages/Usuarios.tsx` que consomem `Partner`/`Parceiro`

11. Qual consumidor tem menor risco para migrar?
   - `src/api/modules/parceiros.api.ts`, porque e um client isolado e sem estado de UI.
   - Entre os consumidores de backend, `backend/src/core/http/middleware.ts` tambem e de baixo risco relativo por ser interno e focado em contexto.

12. Qual consumidor tem maior risco para migrar?
   - `src/pages/Parceiros.tsx`, por combinar CRUD, autenticacao auxiliar, `localStorage`, import/export e `reset-senha`.
   - `backend/server/src/index.ts` tambem e alto risco porque e o runtime ativo de producao para `/api/parceiros`.

13. Qual sequencia segura de desacoplamento?
   - Primeiro: `backend/src/core/http/middleware.ts`, `backend/src/modules/crm/**` e `backend/src/modules/opportunities/**`, porque ja usam `partnerId` UUID e sao server-side.
   - Segundo: `src/api/modules/parceiros.api.ts`, para estabilizar o contrato HTTP.
   - Terceiro: `src/pages/Usuarios.tsx` e `src/pages/Oportunidades.tsx`, que dependem de `partnerId` e `parceiros` de forma indireta.
   - Quarto: `src/pages/LoginParceiro.tsx` e `src/pages/DashboardParceiro.tsx`, que dependem do estado do parceiro autenticado.
   - Por ultimo: `src/pages/Parceiros.tsx`, `src/store/index.ts`, `src/types/index.ts`, `src/types/api.ts` e `backend/server/src/index.ts`, que concentram o legado mais pesado.

14. Quais consumidores sao KEEP, MIGRATE, QUARANTINE, REMOVE LATER?

| Arquivo | Classificacao | Motivo factual |
|---|---|---|
| [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma) | KEEP | Contrato persistido canônico de `Partner`. |
| [backend/src/core/http/middleware.ts](C:/Projects/FINQZ_PRO/backend/src/core/http/middleware.ts) | KEEP | Usa `partnerId` como contexto de ownership e escopo. |
| [backend/src/modules/crm/**](C:/Projects/FINQZ_PRO/backend/src/modules/crm) | KEEP | Consumo backend canônico de `partnerId` em CRM. |
| [backend/src/modules/opportunities/**](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities) | KEEP | Consumo backend canônico de `partnerId` em oportunidades. |
| [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts) | MIGRATE | Client isolado, mas ainda preso ao contrato legado. |
| [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx) | MIGRATE | Fluxo de autenticacao do parceiro depende do store legado. |
| [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx) | MIGRATE | Exibe dados do parceiro autenticado e oportunidades. |
| [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx) | MIGRATE | Usa `partner_id` e `partner_type`, mas pode ser estabilizada depois do contrato. |
| [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx) | MIGRATE | Dependencia indireta e extensa, mas ja esta parcialmente preparada para contratos novos. |
| [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx) | QUARANTINE | CRUD central ainda preso a `localStorage`, store e contrato legado. |
| [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts) | QUARANTINE | Mantem parceiros como fonte operacional local. |
| [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts) | QUARANTINE | Duplica `Partner` e `Parceiro` em formas concorrentes. |
| [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts) | REMOVE LATER | Consolida `ParceiroResponse` legado e contrato paralelo. |
| [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts) | QUARANTINE | Runtime ativo legado de `/api/parceiros`, com envelope e id numerico. |

15. Veredito:
   - **NO-GO**

## 7. Matriz de risco

| Area | Risco | Severidade | Observacao |
|---|---|---:|---|
| Contrato de id | UUID no Prisma vs number no frontend/runtime | Alta | Quebra imediata de leitura e escrita. |
| Contrato de nomes | `code/name/type/parentId` vs `codigo/nome/tipo/parent_id` | Alta | Requer reconciliação em cliente, runtime e tipos. |
| Status | `active` e valores legados vs status canonico operacional | Alta | Impacta UI, login e filtros. |
| Auth do parceiro | login local via store vs contrato canônico | Alta | Faz a área do parceiro depender de estado volátil. |
| Runtime ativo | `backend/server/src/index.ts` permanece legado | Alta | Qualquer mudança sem isolamento quebra o client atual. |
| Store | `useAppStore` e `localStorage` como fonte operacional | Alta | Mantém dados stale e lógica distribuída. |
| Tipos legados | `Partner`, `Parceiro`, `ParceiroResponse` coexistem | Alta | Amplia o custo de migração e o risco de regressão. |
| Backend modular | `partnerId` disseminado em CRM e oportunidades | Media | Já está no caminho certo, mas precisa de harmonização. |

## 8. Ordem segura de migracao

1. Congelar o contrato de leitura atual e mapear todas as dependencias de `id: number`, `codigo`, `nome`, `tipo`, `parent_id`, `partnerId` e `parceiroId`.
2. Estabilizar o backend interno de `partnerId` em [backend/src/core/http/middleware.ts](C:/Projects/FINQZ_PRO/backend/src/core/http/middleware.ts), [backend/src/modules/crm](C:/Projects/FINQZ_PRO/backend/src/modules/crm) e [backend/src/modules/opportunities](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities).
3. Reconciliar o client [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts) com o runtime existente.
4. Migrar [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx) e [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx), que são dependencias indiretas.
5. Migrar [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx) e [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx).
6. Por ultimo, remover o acoplamento pesado de [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx), [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts), [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts), [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts) e [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts).

## 9. Blockers

1. `UUID` no Prisma nao bate com `number` no frontend e no runtime legado.
2. `Partner` canonico nao bate com o contrato legível por `Parceiros.tsx` e `parceirosApi`.
3. `Parceiros.tsx` depende de `localStorage`, o que cria fonte paralela de verdade.
4. `LoginParceiro.tsx` usa credenciais e usuario do store, nao um runtime canônico.
5. `DashboardParceiro.tsx` depende de `user.parceiroId` e de oportunidades do store.
6. `Usuarios.tsx` e `Oportunidades.tsx` ainda carregam ligações a `partner_id`/`parceiros` em formato legível legado.
7. `backend/server/src/index.ts` continua sendo o runtime ativo de parceiros.
8. `src/types/index.ts` e `src/types/api.ts` mantem contratos concorrentes.

## 10. Veredito

**NO-GO**

Motivos:

- ha varios consumidores reais e eles nao estao uniformemente alinhados ao contrato canonico;
- o backend modular de `partnerId` ja existe e e relativamente alinhado, mas o runtime ativo ainda e legado;
- o frontend principal continua preso a store e `localStorage`;
- os tipos duplicados e o contrato HTTP divergente ainda impedem uma migracao segura do runtime.

## 11. Proxima fase recomendada

1. Tratar [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts) como primeiro alvo de estabilizacao.
2. Em seguida, estabilizar os consumidores indiretos em CRM, oportunidades e middleware de tenancy.
3. Depois, migrar `Usuarios`, `LoginParceiro` e `DashboardParceiro`.
4. Somente no fim, desmontar `Parceiros.tsx`, `store` e os tipos legados.

