# AUD-G2-C - Partner Adapter Boundary Audit

## 1. Objetivo

Auditar onde devem existir adapters entre o contrato canonico `Partner vNext` e os contratos legados atuais, sem implementar codigo, sem criar adapter e sem alterar qualquer runtime, schema, frontend ou backend.

## 2. Escopo

Arquivos auditados:

- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma)
- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts)
- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx)
- [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx)
- [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx)
- [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx)
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts)
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts)
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts)

Contexto obrigatorio considerado:

- `AUD-G1-B Partner Runtime Gap`
- `AUD-G1-C CRM Canonical Ownership`
- `AUD-G1-D Partner Contract Reconciliation`
- `AUD-G1-E Partner Canonical Contract Definition`
- `AUD-G2-A Partner Runtime Modernization Readiness`
- `AUD-G2-B Partner Consumer Dependency Map`

Mapeamentos auditados:

- `id number -> id UUID`
- `codigo -> code`
- `nome -> name`
- `tipo -> type`
- `parent_id -> parentId`
- `company/franquia/franqueado -> COMPANY/FRANQUIA/FRANQUEADO`
- `active/inactive -> ativo/inativo`
- `envelope { parceiros } -> Partner[]`
- `parceiro -> Partner`
- `children -> derived tree`
- `senha/login -> credential flow separado`
- `cpf_cnpj/cnpj/document -> document`
- `telefone/celular -> phone`

## 3. Contrato canonico de referencia

Referencia canonica consolidada em `AUD-G1-E`:

- `id: UUID`
- `tenantId: UUID`
- `code: string`
- `name: string`
- `type: PartnerType`
- `status: PartnerStatus`
- `parentId?: UUID | null`
- `document?: string | null`
- `email?: string | null`
- `phone?: string | null`
- `createdAt`, `updatedAt`, `deletedAt`

Hierarquia canonica:

- `PartnerType = COMPANY | FRANQUIA | FRANQUEADO`
- `PartnerStatus = prospect | contato | negociacao | ativo | inativo`

## 4. Contratos legados observados

### 4.1 Prisma

- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L129) define `Partner` com `id` UUID, `code`, `name`, `type`, `status`, `tenantId`, `parentId` e relacoes.

### 4.2 Runtime legado

- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1771) atende `/api/parceiros`.
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1824) retorna envelope com `parceiros`, `companies`, `franquias` e `franqueados`.
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1882) escreve em `tables.parceiros` com campos legados.

### 4.3 Client legado

- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts#L43) espera `Partner` numerico, `parent_id?: number` e payload legado.

### 4.4 UI legado

- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L45) usa `useAppStore`.
- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L70) e [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L83) usam `localStorage`.
- [src/pages/LoginParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/LoginParceiro.tsx#L12) autentica em cima do store.
- [src/pages/DashboardParceiro.tsx](C:/Projects/FINQZ_PRO/src/pages/DashboardParceiro.tsx#L17) usa `user.parceiroId`, `parceiros` e `oportunidades`.
- [src/pages/Usuarios.tsx](C:/Projects/FINQZ_PRO/src/pages/Usuarios.tsx#L82) usa `parceiros` para filtros e vinculos.
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L590) e [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2246) tratam `parceiros` e `partnerId` como contexto legado.

### 4.5 Tipos legados

- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts#L14) define `Partner` com `id: number`.
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts#L965) define `Parceiro` legado duplicado.
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts#L192) define `ParceiroResponse`.

### 4.6 Backend modular

- [backend/src/core/http/middleware.ts](C:/Projects/FINQZ_PRO/backend/src/core/http/middleware.ts#L106) usa `partnerId` como contexto de ownership/escopo.
- [backend/src/modules/crm](C:/Projects/FINQZ_PRO/backend/src/modules/crm) propaga `partnerId` em leads e customers.
- [backend/src/modules/opportunities](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities) propaga `partnerId` em oportunidades.

## 5. Matriz de conversoes

| Conversao | Necessaria? | Segura em adapter? | Perigosa? | Deve existir? | Observacao |
|---|---|---|---|---|---|
| `id number -> id UUID` | Sim | Nao na borda do cliente legado; sim em mapping explicitado | Sim | Sim, mas so em uma direcao controlada | Converter cedo demais quebra toda referencia numerica existente. |
| `codigo -> code` | Sim | Sim | Baixo risco | Sim | Conversao de nomenclatura padronizavel. |
| `nome -> name` | Sim | Sim | Baixo risco | Sim | Conversao sem ambiguidade. |
| `tipo -> type` | Sim | Sim | Medio | Sim | Exige normalizacao de casing e enum. |
| `parent_id -> parentId` | Sim | Sim | Medio | Sim | Necessita preservacao da hierarquia. |
| `company/franquia/franqueado -> COMPANY/FRANQUIA/FRANQUEADO` | Sim | Sim | Medio | Sim | Conversao de enum/casing. |
| `active/inactive -> ativo/inativo` | Sim | Sim | Medio | Sim | Deve ficar no boundary, nao no dominio. |
| `envelope { parceiros } -> Partner[]` | Sim | Sim | Medio | Sim | Adapter de forma de resposta. |
| `parceiro -> Partner` | Sim | Sim | Medio | Sim | Conversao de singular/plural e shape. |
| `children -> derived tree` | Sim | Sim | Medio/alto | Sim, como derivado | Deve ser calculado fora do dominio canonico. |
| `senha/login -> credential flow separado` | Sim | Nao para dominio canônico | Alto | Sim, mas separado | Nao deve contaminar `Partner` canonico. |
| `cpf_cnpj/cnpj/document -> document` | Sim | Sim | Medio | Sim | Normalizacao de documento na borda. |
| `telefone/celular -> phone` | Sim | Sim | Baixo/medio | Sim | `celular` e detalhe legada, `phone` e canonico. |

## 6. Fronteira permitida de adapter

### 6.1 Camadas que podem adaptar

1. **API client**
   - Pode transformar resposta HTTP legada em `Partner vNext` para consumo do frontend.
   - Pode transformar payload canônico em formato esperado pelo backend legado, quando ainda estiver em convivência transitória.

2. **Backend service**
   - Pode normalizar entrada legada para o modelo de dominio antes de persistencia ou retorno.
   - Pode projetar saidas canônicas para consumidores internos e externos.

3. **Repository**
   - Pode ser responsavel por mapear persistencia legada para shape de dominio, desde que nao exponha DTOs de UI.
   - E a camada mais adequada para traduzir `tables.parceiros` em contrato persistido/consultavel.

### 6.2 Camadas que podem ler legado sem propagar

- `backend/server/src/index.ts` enquanto runtime legado, desde que o legado nao atravesse a interface publica sem adaptacao.
- `src/api/modules/parceiros.api.ts` como client transitorio.

## 7. Fronteira proibida de adapter

### 7.1 Fronteiras proibidas

1. **Dominios canônicos nao devem conhecer legados**
   - `Partner vNext` nao deve carregar `codigo`, `nome`, `tipo`, `parent_id`, `login`, `senha`, `cpf_cnpj`, `celular` ou `ParceiroResponse`.

2. **UI canônica nao deve depender de contratos legados**
   - Telas novas ou migradas nao devem depender de `id: number` ou de envelope legado.

3. **Backend modular nao deve aceitar legados como contrato principal**
   - `backend/src/modules/crm/**` e `backend/src/modules/opportunities/**` devem permanecer em `partnerId` e UUID.

4. **Tipos compartilhados nao devem misturar dois contratos como equivalentes**
   - `src/types/index.ts` e `src/types/api.ts` nao devem continuar expondo formas concorrentes como se fossem o mesmo modelo.

## 8. Campos que nao podem vazar para dominio canonico

Os seguintes campos devem morrer na borda e nao entrar no dominio `Partner vNext`:

- `codigo`
- `nome`
- `tipo` legado em minuscule/case inconsistente
- `parent_id`
- `senha`
- `login`
- `cpf_cnpj`
- `celular`
- `ParceiroResponse`
- `Partner` numerico de `src/types/index.ts`
- `envelope { parceiros }` como shape interno de dominio

Campos que podem existir apenas como adapter/legacy payload:

- `children`
- `companies`
- `franquias`
- `franqueados`
- `active`
- `inactive`

## 9. Riscos

| Risco | Impacto | Onde ocorre |
|---|---|---|
| Converter `id number` para UUID cedo demais | Quebra de lookup, referencias locais e fluxo de login do parceiro | `Parceiros.tsx`, `LoginParceiro.tsx`, `DashboardParceiro.tsx`, `Usuarios.tsx`, `backend/server/src/index.ts` |
| Deixar `senha/login` entrarem no dominio canônico | Contamina o modelo com credencial e UI | `Parceiros.tsx`, `LoginParceiro.tsx`, `backend/server/src/index.ts` |
| Permitir `children` como campo primario | Gera ambiguidade entre arvore derivada e persistencia | `backend/server/src/index.ts`, `src/api/modules/parceiros.api.ts` |
| Manter `Partner` e `Parceiro` como sinônimos | Duplica contratos e prolonga regressao | `src/types/index.ts`, `src/types/api.ts` |
| Adaptar no lugar errado | Propaga legado para mais camadas | `src/types`, `src/store`, `backend/src/modules/*` |

## 10. Sequencia segura

Antes de implementar qualquer adapter:

1. Congelar o contrato canonico `Partner vNext` como referencia unica.
2. Catalogar todos os campos legados usados por cada consumidor.
3. Definir uma direcao de conversao por camada:
   - input legado -> dominio canônico
   - dominio canônico -> output legado apenas onde necessario
4. Priorizar o boundary no API client e no backend service/repository, nao na UI e nao no dominio.
5. Separar o fluxo de credenciais (`senha/login`) do fluxo de identidade (`Partner`).
6. Tratar `children` como derivado de leitura, nao como verdade persistida do contrato principal.
7. Somente depois, permitir migração gradual dos consumidores.

## 11. Respostas obrigatorias

1. Quais conversoes sao necessarias?
   - Todas as listadas na matriz: id, naming, enums, parent key, envelope, children derivado, credenciais separadas, documento e telefone.

2. Quais conversoes sao seguras em adapter?
   - `codigo -> code`, `nome -> name`, `tipo -> type`, `parent_id -> parentId`, `company/franquia/franqueado -> enum canônico`, `active/inactive -> ativo/inativo`, `envelope { parceiros } -> Partner[]`, `cpf_cnpj/cnpj/document -> document`, `telefone/celular -> phone`.

3. Quais conversoes sao perigosas?
   - `id number -> UUID` se feita sem estrategia de transicao, `children -> tree` se exposta como fonte primária, e qualquer conversao que traga `senha/login` para o dominio canônico.

4. Quais conversoes nao devem existir?
   - Nao deve existir ponte permanente que mantenha `ParceiroResponse` e `Parceiro` numerico como equivalentes canonicos.
   - Nao deve existir adaptacao que exponha `senha` ou `login` no dominio `Partner`.
   - Nao deve existir `children` como atributo principal de escrita do dominio.

5. Qual camada deve ser responsavel pelo adapter?
   - A camada de adaptacao deve existir nas bordas, com responsabilidade principal no **API client** e no **backend service/repository**.

6. O adapter deve ficar no frontend, API client, backend service ou repository?
   - O melhor lugar e a borda de transporte e persistencia: **API client** e **backend service/repository**.
   - O frontend deve consumir o resultado adaptado, nao carregar a complexidade de reconciliacao.

7. Quais consumers nao devem conhecer campos legados?
   - `backend/src/modules/crm/**`
   - `backend/src/modules/opportunities/**`
   - qualquer consumer futuro de `Partner vNext`
   - telas migradas que deixarem de depender do contrato antigo

8. Quais campos legados devem morrer na borda?
   - `codigo`, `nome`, `tipo` legado, `parent_id`, `senha`, `login`, `cpf_cnpj`, `celular`, `ParceiroResponse`, `Partner` numerico e o envelope legado como forma de dominio.

9. Qual deve ser a fronteira oficial entre legado e canônico?
   - A fronteira oficial e: transporte/persistencia podem falar legado; dominio canônico e consumidores migrados só falam `Partner vNext`.
   - O contrato canônico nao deve atravessar a fronteira carregando nomes de UI ou shapes de runtime legado.

10. Qual e a sequencia segura antes de implementar adapter?
    - Primeiro congelar o contrato canônico.
    - Depois mapear legados por consumidor.
    - Em seguida escolher a borda (`API client` / `backend service` / `repository`).
    - Por fim criar adapters apenas nessas bordas, nunca no dominio e nunca em toda a UI de uma vez.

## 12. Veredito

**NO-GO**

Motivos:

- a fronteira de adapter precisa existir, mas ainda nao deve ser implementada agora;
- o contrato canônico e o legado continuam amplamente divergentes em id, naming, envelopes, tipos e credenciais;
- implementar adapters sem antes fechar a fronteira oficial apenas aumentaria o acoplamento transitorio.

## 13. Proxima fase recomendada

1. Formalizar a fronteira de transporte/persistencia para `Partner vNext`.
2. Isolar o fluxo de credenciais como subfluxo separado.
3. Revalidar consumidores migrarem por ordem de risco definida em `AUD-G2-B`.
4. Somente depois abrir tarefa de implementacao dos adapters, com escopo por camada.
