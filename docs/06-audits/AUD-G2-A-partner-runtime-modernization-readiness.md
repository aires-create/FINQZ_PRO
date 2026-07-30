# AUD-G2-A — Partner Runtime Modernization Readiness

## 1. Objetivo

Avaliar se o dominio `Partner`/`Parceiros` esta pronto para uma futura modernizacao de runtime, considerando apenas o estado real do codigo e as decisoes arquiteturais ja consolidadas em `AUD-G1-B`, `AUD-G1-C`, `AUD-G1-D` e `AUD-G1-E`.

## 2. Escopo

Foram auditados exclusivamente os artefatos solicitados:

- `backend/prisma/schema.prisma` (modelo `Partner`)
- `backend/server/src/index.ts` nas rotas `/api/parceiros`
- `src/api/modules/parceiros.api.ts`
- `src/pages/Parceiros.tsx`
- `src/pages/LoginParceiro.tsx`
- `src/pages/DashboardParceiro.tsx`
- `src/pages/Usuarios.tsx`
- `src/pages/Oportunidades.tsx`
- `src/store/index.ts`
- `src/types/index.ts`
- `src/types/api.ts`

Contexto obrigatorio considerado:

- `docs/06-audits/AUD-G1-B-partner-runtime-gap.md`
- `docs/06-audits/AUD-G1-C-crm-canonical-ownership.md`
- `docs/06-audits/AUD-G1-D-partner-contract-reconciliation.md`
- `docs/06-audits/AUD-G1-E-partner-canonical-contract-definition.md`

## 3. Evidencias utilizadas

Evidencias de referencia direta:

- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L129) mostra `model Partner` com `id` UUID, `code`, `name`, `type`, `status`, `tenantId`, `parentId` e relacoes hierarquicas.
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1771) mostra o runtime ativo de `/api/parceiros`.
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1828) mostra resposta em envelope com `parceiros`, `companies`, `franquias` e `franqueados`.
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1882) mostra `POST /api/parceiros` ainda escrevendo em `tables.parceiros`.
- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts#L43) mostra o client HTTP atual.
- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L45) mostra dependencia do store.
- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L70) e [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L83) mostram uso direto de `localStorage`.
- [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx#L12) mostra login e recuperacao baseados no store.
- [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx#L17) mostra dashboard lendo `parceiros` e `oportunidades` do store.
- [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx#L82) e [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx#L233) mostram dependencia de `parceiros` para filtro e vinculacao.
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L590) e [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2246) mostram dependencia indireta de `parceiros`, `pipeline_id` legado e compatibilidade transitoria.
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L249) mostra `initialParceiros`.
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L811) mostra CRUD local como fonte operacional.
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L928) mostra persistencia do store em `finqz-pro-storage`.
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts#L14) mostra `Partner` legacy com `id: number`.
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts#L965) mostra `Parceiro` legado duplicado.
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts#L192) mostra `ParceiroResponse` legado.

Contexto arquitetural consolidado:

- `Partner` ja foi definido como entidade de dominio oficial.
- O contrato canonico aprovado usa `UUID`, `code / name / type / parentId` e `PartnerType` em maiusculas.
- `PartnerStatus` canonico permanece em portugues operacional.
- Formatos `codigo / nome / tipo / parent_id`, `ParceiroResponse` e `Parceiro` legado sao transicionais, nao canonicos.

## 4. Consumidores de Partner

### 4.1 Quem consome Partner hoje?

1. `src/pages/Parceiros.tsx`
2. `src/pages/LoginParceiro.tsx`
3. `src/pages/DashboardParceiro.tsx`
4. `src/pages/Usuarios.tsx`
5. `src/pages/Oportunidades.tsx`
6. `src/api/modules/parceiros.api.ts`
7. `backend/server/src/index.ts` nas rotas `/api/parceiros`
8. `src/store/index.ts`
9. `src/types/index.ts`
10. `src/types/api.ts`

### 4.2 Dependencias diretas

Dependencias diretas sao as que leem, escrevem ou autenticam diretamente sobre o dominio `Partner`:

- `src/pages/Parceiros.tsx` usa `useAppStore`, faz CRUD local, persiste em `localStorage` e faz `reset-senha` via `fetch`.
- `src/pages/LoginParceiro.tsx` autentica parceiro a partir do store, validando `codigo` e `senha` locais.
- `src/pages/DashboardParceiro.tsx` monta a area do parceiro a partir de `parceiros` e `oportunidades` do store.
- `src/pages/Usuarios.tsx` usa `parceiros` para filtro de `partner_type`, vinculacao por `partner_id` e selecao do parceiro do usuario.
- `src/api/modules/parceiros.api.ts` expõe o client HTTP para `/api/parceiros`.
- `backend/server/src/index.ts` e o runtime ativo que atende o dominio.
- `src/store/index.ts` mantem `initialParceiros`, mutacoes locais e persistencia.
- `src/types/index.ts` e `src/types/api.ts` definem os shapes de consumo legado.

### 4.3 Dependencias indiretas

Dependencias indiretas sao as que nao são o consumidor primario, mas quebram quando o contrato de `Partner` muda:

- `src/pages/Oportunidades.tsx` usa `parceiros` e `partner` como parte do contexto de oportunidade, principalmente em filtros, exibicao e relacao com usuario/responsavel.
- `src/types/index.ts` tem varios modelos que referenciam `partner_id` e `parceiro_id`, como usuarios, financeiro e conta corrente.
- `src/store/index.ts` tambem alimenta outros modulos com `parceiros`, o que amplia o raio de quebra.
- O backend ativo em `backend/server/src/index.ts` afeta qualquer tela que espere `/api/parceiros` com envelope legado.

## 5. Dependencias diretas

### 5.1 Frontend

- `Parceiros.tsx` depende de `useAppStore`, `localStorage`, `addParceiro`, `updateParceiro`, `deleteParceiro` e `toggleParceiroStatus`.
- `LoginParceiro.tsx` depende de `parceiros`, `usuarios`, `updateParceiro` e `setAuth`.
- `DashboardParceiro.tsx` depende de `user`, `parceiros` e `oportunidades`.
- `Usuarios.tsx` depende de `parceiros` para montar filtros e associacoes.

### 5.2 API e runtime

- `parceirosApi` depende de `GET /api/parceiros`, `GET /api/parceiros/:id`, `POST /api/parceiros`, `PUT /api/parceiros/:id` e `DELETE /api/parceiros/:id`.
- O runtime ativo depende do contrato numerico e do datasource `tables.parceiros`.
- `POST /api/parceiros/:id/reset-senha` e dependencia adicional critica porque a tela de parceiros dispara esse fluxo diretamente.

### 5.3 Tipos e estado

- `Partner` em `src/types/index.ts` ainda e numerico e legado.
- `Parceiro` em `src/types/index.ts` duplica o dominio com shape concorrente.
- `ParceiroResponse` em `src/types/api.ts` perpetua outro contrato legado.
- O store persiste o estado com a chave `finqz-pro-storage` e tambem grava parceiros via `localStorage` especifico da tela.

## 6. Dependencias indiretas

- `src/pages/Oportunidades.tsx` usa `parceiros` para contexto de CRM e relacoes de `partner_id`/`parceiro_id`.
- `src/pages/Usuarios.tsx` usa `parceiros` para resolver escopo e vinculo de usuarios parceiros.
- `src/store/index.ts` depende do estado legado para inicializar autenticao, UI e listas locais.
- `src/types/index.ts` espalha o modelo legacy por varias features adjacentes.
- `backend/server/src/index.ts` impacta relatorios e fluxos auxiliares que consultam `tables.parceiros`.

## 7. Matriz de risco

| Area | Risco | Severidade | Evidencia |
|---|---|---:|---|
| Identificador | `UUID` no Prisma vs `number` no frontend/runtime | Alta | `backend/prisma/schema.prisma`, `src/types/index.ts`, `backend/server/src/index.ts` |
| Nomenclatura | `code/name/type/parentId` vs `codigo/nome/tipo/parent_id` | Alta | `backend/prisma/schema.prisma`, `src/types/index.ts`, `src/api/modules/parceiros.api.ts`, `backend/server/src/index.ts` |
| Status | `active` e estados legados vs `prospect/contato/negociacao/ativo/inativo` | Alta | `backend/prisma/schema.prisma`, `src/types/index.ts`, `src/pages/Parceiros.tsx` |
| Shape de resposta | lista canônica vs envelope `parceiros/companies/franquias/franqueados` | Alta | `backend/server/src/index.ts`, `src/api/modules/parceiros.api.ts` |
| Fonte de verdade | store e `localStorage` ainda dominam a tela de parceiros | Alta | `src/pages/Parceiros.tsx`, `src/store/index.ts` |
| Login do parceiro | autenticacao baseada em store local, nao em runtime canônico | Alta | `src/pages/LoginParceiro.tsx`, `src/store/index.ts` |
| Usuarios | vinculacao de usuario por `partner_id` numerico e `partner_type` legado | Media/Alta | `src/pages/Usuarios.tsx` |
| Oportunidades | dependencias indiretas de `parceiros` e compatibilidade legada de pipeline | Media/Alta | `src/pages/Oportunidades.tsx` |
| Tipos legados | `Partner`, `Parceiro`, `ParceiroResponse` coexistem | Alta | `src/types/index.ts`, `src/types/api.ts` |

## 8. Blockers

1. Incompatibilidade de identificador: Prisma usa UUID, mas frontend e runtime ainda operam com `number`.
2. Incompatibilidade de nomenclatura: o contrato canonico `code/name/type/parentId` nao e o contrato atual de consumo.
3. Incompatibilidade de status: o runtime e a UI ainda aceitam variantes legadas e `active`.
4. Runtime ativo ainda é o monolito legado em `backend/server/src/index.ts`, nao um runtime moderno consolidado.
5. `src/pages/Parceiros.tsx` continua dependente de `localStorage` como camada operacional.
6. `src/store/index.ts` continua sendo fonte de verdade para cadastro, login e persistencia local.
7. `src/types/index.ts` e `src/types/api.ts` mantem tipos duplicados e concorrentes.
8. `src/api/modules/parceiros.api.ts` nao esta reconciliado com o shape real retornado pelo runtime ativo.

## 9. Sequencia segura de modernizacao

1. Congelar o contrato atual de consumo e mapear tudo que ainda depende de `id: number`, `codigo`, `nome`, `tipo` e `parent_id`.
2. Reconciliar o client `src/api/modules/parceiros.api.ts` com o runtime real antes de trocar telas.
3. Introduzir adaptacao explicita entre contrato legado e contrato canonico sem mover a fonte de verdade ainda.
4. Remover a dependencia funcional da tela `Parceiros.tsx` em `localStorage` e store como origem operacional, mantendo apenas cache transitório se necessario.
5. Migrar `LoginParceiro.tsx` para o fluxo canônico de autenticacao de parceiro, eliminando a leitura direta do store.
6. Migrar `DashboardParceiro.tsx` e `Usuarios.tsx` para consumir o contrato canônico ja reconciliado.
7. Ajustar `Oportunidades.tsx` para depender de Partner canonico apenas por interface estabilizada, sem aliases legados.
8. Somente depois disso, cortar os tipos legados `Parceiro`/`ParceiroResponse` e reduzir o store ao que for realmente UI-only.
9. Por ultimo, substituir o runtime legado por um runtime moderno quando todos os consumidores ja estiverem estabilizados.

## 10. Respostas obrigatorias

1. Quem consome Partner hoje?
   - `Parceiros.tsx`, `LoginParceiro.tsx`, `DashboardParceiro.tsx`, `Usuarios.tsx`, `Oportunidades.tsx`, `parceirosApi`, `store`, `types` e o runtime de `backend/server/src/index.ts`.

2. Quais dependencias sao diretas?
   - UI de parceiros, login do parceiro, dashboard do parceiro, usuarios, client HTTP de parceiros, runtime ativo, store local e tipos compartilhados.

3. Quais dependencias sao indiretas?
   - `Oportunidades.tsx`, fluxos de usuario vinculados a parceiro, relatorios do backend, e qualquer modulo que leia `parceiro_id`, `partner_id` ou `parceiros` do store.

4. Quais telas quebrariam primeiro?
   - `src/pages/Parceiros.tsx` primeiro, depois `src/pages/LoginParceiro.tsx` e `src/pages/DashboardParceiro.tsx`.
   - Em seguida, `src/pages/Usuarios.tsx`.
   - `src/pages/Oportunidades.tsx` sofreria regressao secundaria por dependencia indireta.

5. Quais contratos quebrariam primeiro?
   - `id: number`, `codigo`, `nome`, `tipo`, `parent_id`, `ParceiroResponse`, o envelope `parceiros/companies/franquias/franqueados` e o contrato de `reset-senha` consumido pela tela.

6. Quais blockers existem?
   - Divergencia de identificador, naming, status, shape de resposta, store como fonte de verdade, localStorage, runtime legado e tipos duplicados.

7. Existe dependencia critica do store?
   - Sim. A tela de parceiros, o login do parceiro, o dashboard do parceiro e parte de usuarios dependem do store de forma funcional, nao apenas cosmetica.

8. Existe dependencia critica do localStorage?
   - Sim. `Parceiros.tsx` le e escreve parceiros em `localStorage`, o que torna o estado local uma dependencia operacional real.

9. Existe dependencia critica do runtime EdgeSpark?
   - Sim. `backend/server/src/index.ts` e o runtime ativo de `/api/parceiros`; qualquer mudanca ali sem adapter quebra o client atual.

10. Existe dependencia critica de tipos legados?
   - Sim. `Partner` numerico, `Parceiro` e `ParceiroResponse` ainda participam do caminho de execucao e da tipagem do frontend.

11. Qual sequencia segura de migracao?
   - Contrato -> adapter -> client -> telas -> store -> runtime. Nao o inverso.

12. E GO, GO WITH RESTRICTIONS ou NO-GO?
   - **NO-GO**.

## 11. Veredito

**NO-GO**

Motivos objetivos:

- o dominio possui definicao canonica, mas ela ainda nao esta refletida no runtime ativo nem nos consumidores principais;
- o frontend principal segue legacy-first, com store e `localStorage` como dependencia funcional;
- o backend ativo continua expondo contrato numerico e envelope legado;
- os tipos compartilhados ainda duplicam o dominio em formas concorrentes;
- existe risco alto de regressao se a modernizacao de runtime for iniciada agora sem reconciliacao previa de contrato.

## 12. Proxima fase recomendada

Antes de qualquer modernizacao de runtime, a fase seguinte deve ser exclusivamente de reconciliacao:

1. Fechar um adapter unico para `Partner` canonico.
2. Reclassificar `Parceiros.tsx`, `LoginParceiro.tsx`, `DashboardParceiro.tsx`, `Usuarios.tsx` e `Oportunidades.tsx` conforme o novo contrato estabilizado.
3. Reduzir o store a responsabilidades de UI/transicao.
4. Eliminar `Parceiro` e `ParceiroResponse` quando todos os consumidores ja estiverem lendo o contrato canonico.
5. So entao considerar a troca do runtime.
