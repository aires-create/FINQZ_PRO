# AUD-G1-B — Partner Runtime Gap

## 1. Objetivo

Auditar, com base exclusivamente nas evidências coletadas, se o domínio Partner/Parceiros já possui runtime moderno alinhado ao contrato arquitetural oficial ou se ainda depende de legado.

## 2. Escopo

Foram observados os seguintes pontos:

- documentos de arquitetura em `docs/02-architecture/**`
- Prisma `Partner`
- runtime ativo em `backend/server/src/index.ts`
- ausência de runtime moderno em `backend/src/modules/**`
- dependências frontend em `src/pages/Parceiros.tsx`, `src/api/modules/parceiros.api.ts`, `src/store/index.ts`, `src/types/index.ts` e `src/types/api.ts`

## 3. Evidências encontradas

### Evidências documentais

- `ARCH-001` e `ARCH-002` definem a hierarquia oficial `Companhia / Parceiro Master -> Franquia -> Franqueado`.
- `ARCH-004` e `ARCH-005` formalizam `Partner` como entidade de domínio, com escopo tenant-aware e relacionamento com `Opportunity`.
- `ARCH-015` define que o frontend de Parceiros deve evoluir para `API + store/partners`, e não permanecer dependente de store monolítico.

### Evidências de frontend

- `src/pages/Parceiros.tsx` usa `useAppStore`.
- `src/pages/Parceiros.tsx` persiste dados em `localStorage`.
- `src/pages/LoginParceiro.tsx`, `src/pages/DashboardParceiro.tsx` e `src/pages/Usuarios.tsx` também dependem do store legado.
- `src/api/modules/parceiros.api.ts` existe, mas ainda não é o caminho consumido pela tela principal.

### Evidências de backend

- `backend/server/src/index.ts` contém o runtime ativo de `/api/parceiros`.
- `backend/src/modules/partners/routes.ts` existe, mas foi identificado como esqueleto/stub e não como runtime ativo.

## 4. Prisma Partner encontrado

Foi localizado o modelo `Partner` em `backend/prisma/schema.prisma`, com relação hierárquica e map para a tabela `partners`.

Evidência:

- `backend/prisma/schema.prisma`
- `model Partner`
- relações com `parentId` e `children`

## 5. Runtime EdgeSpark encontrado

O runtime ativo de parceiros foi encontrado em `backend/server/src/index.ts`, sob as rotas:

- `GET /api/parceiros`
- `GET /api/parceiros/:id`
- `POST /api/parceiros`
- `PUT /api/parceiros/:id`
- `DELETE /api/parceiros/:id`
- `POST /api/parceiros/:id/reset-senha`

Esse runtime ainda opera com resposta em envelope e com campos legados/legacy-friendly, não com o contrato limpo esperado pelo client `parceirosApi`.

## 6. Ausência de runtime moderno em backend/src

Não foi encontrada implementação moderna efetiva em `backend/src/modules/partners/**` que esteja ligada ao runtime ativo.

O que existe em `backend/src/modules/partners/routes.ts` é um conjunto de rotas stub/placeholder, sem evidência de wiring como fonte de verdade do backend.

## 7. Dependências frontend identificadas

### Dependências diretas

- `src/pages/Parceiros.tsx` depende de `useAppStore`.
- `src/pages/Parceiros.tsx` depende de `localStorage`.
- `src/pages/Parceiros.tsx` depende de ações do store como `addParceiro`, `updateParceiro`, `deleteParceiro` e `toggleParceiroStatus`.
- `src/pages/LoginParceiro.tsx` usa `parceiros` do store para autenticação.
- `src/pages/DashboardParceiro.tsx` usa `parceiros` do store para montar a visão do parceiro.
- `src/pages/Usuarios.tsx` usa parceiros do store para relacionamento com usuários.
- `src/pages/Oportunidades.tsx` mantém dependências de escopo/relacionamento com parceiro.

### Dependências de contrato

- `src/api/modules/parceiros.api.ts` pressupõe contrato `Partner`.
- `src/types/index.ts` contém `Partner` e também `Parceiro`, com duplicidade de domínio.
- `src/types/api.ts` mantém `ParceiroResponse` legado.

## 8. Tabela KEEP / MIGRATE / QUARANTINE / REMOVE LATER

| Artefato | Classificação | Evidência factual |
|---|---|---|
| `docs/02-architecture/ARCH-001*` | KEEP | Define a hierarquia oficial. |
| `docs/02-architecture/ARCH-002*` | KEEP | Consolida a especialização comercial. |
| `docs/02-architecture/ARCH-004*` | KEEP | Formaliza `Partner` como entidade. |
| `docs/02-architecture/ARCH-005*` | KEEP | Define relações e escopo de `Partner`. |
| `docs/02-architecture/ARCH-015*` | KEEP | Define direção frontend `API + store/partners`. |
| `backend/prisma/schema.prisma` | KEEP | Contém `model Partner`. |
| `backend/server/src/index.ts` | QUARANTINE | É o runtime ativo, mas ainda com contrato legado/envelope. |
| `backend/src/modules/partners/**` | REMOVE LATER | Implementação esqueleto, sem evidência de uso ativo. |
| `src/api/modules/parceiros.api.ts` | MIGRATE | Existe como client-alvo, mas ainda não está reconciliado com o runtime. |
| `src/pages/Parceiros.tsx` | QUARANTINE | Continua dependente de store/localStorage. |
| `src/pages/LoginParceiro.tsx` | QUARANTINE | Continua dependente de store legado. |
| `src/pages/DashboardParceiro.tsx` | QUARANTINE | Continua dependente de store legado. |
| `src/pages/Usuarios.tsx` | QUARANTINE | Continua dependente de store legado para vínculo. |
| `src/pages/Oportunidades.tsx` | QUARANTINE | Mantém dependências de escopo/parceiro no modelo atual. |
| `src/store/index.ts` | QUARANTINE | Mantém `initialParceiros` e CRUD local como verdade operacional. |
| `src/types/index.ts` | QUARANTINE | Contém `Partner` e `Parceiro` em paralelo. |
| `src/types/api.ts` | MIGRATE | Contém contrato legado `ParceiroResponse`. |

## 9. Gap arquitetural identificado

O gap factual identificado é este:

- o contrato arquitetural oficial de `Partner` existe;
- o Prisma já possui `Partner`;
- porém o runtime real ainda está no backend monolítico `backend/server/src/index.ts`;
- o frontend principal ainda depende de store/localStorage;
- e o client `parceirosApi` ainda não está alinhado ao formato real exposto pelo backend.

Em outras palavras, existe **gap entre decisão arquitetural, runtime backend e consumo frontend**.

## 10. Veredito final

**NO-GO**

Justificativa factual:

- existe domínio arquitetural oficial;
- existe modelo Prisma;
- mas não existe ainda runtime moderno consolidado em `backend/src`;
- a tela `Parceiros.tsx` ainda é legacy-first;
- e há divergência de contrato entre API client e backend ativo.

## 11. Próxima fase recomendada

Próxima fase documental e arquitetural recomendada:

- reconciliação de contrato entre `parceirosApi`, runtime ativo e modelo `Partner`
- eliminação gradual da dependência do store/localStorage como fonte de verdade do domínio
- formalização do caminho canônico antes de qualquer migração de tela
