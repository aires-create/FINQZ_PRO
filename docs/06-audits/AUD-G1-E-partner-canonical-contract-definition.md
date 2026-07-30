# AUD-G1-E — Partner Canonical Contract Definition

## 1. Objetivo

Definir exclusivamente o contrato canônico oficial do domínio `Partner` para o FINQZ PRO, com base nas decisões já consolidadas em `AUD-G1-B`, `AUD-G1-C`, `AUD-G1-D` e nos documentos `ARCH` vigentes.

## 2. Escopo

Esta auditoria define apenas a forma canônica do contrato `Partner`, sem propor runtime, migration, implementação ou alteração de schema, frontend ou backend.

## 3. Evidências utilizadas

As evidências utilizadas para esta definição foram:

- `ARCH-004` - Entity Model
- `ARCH-005` - Relationships
- `ARCH-015` - Frontend Domain Map
- `AUD-G1-B` - Partner Runtime Gap
- `AUD-G1-C` - CRM Canonical Ownership
- `AUD-G1-D` - Partner Contract Reconciliation
- `backend/prisma/schema.prisma`
- `src/types/index.ts`
- `src/types/api.ts`
- `src/api/modules/parceiros.api.ts`
- `backend/server/src/index.ts`
- `src/pages/Parceiros.tsx`

## 4. Definições canônicas

### 4.1 Identificador canônico

O identificador canônico deve ser **UUID**.

Justificativa factual:

- o modelo `Partner` do Prisma usa `id: String @db.Uuid`;
- o domínio é multi-tenant e já depende de `tenantId` UUID no backend;
- o `number` aparece apenas como legado no frontend e no runtime antigo.

### 4.2 Nomenclatura canônica

As nomenclaturas canônicas devem ser:

- `code`
- `name`
- `type`
- `parentId`

As variantes `codigo`, `nome`, `tipo` e `parent_id` são tratadas como legado/transição.

### 4.3 PartnerType canônico

O enum canônico de `PartnerType` deve ser:

- `COMPANY`
- `FRANQUIA`
- `FRANQUEADO`

Essa é a forma já refletida no tipo `PartnerType` do frontend compartilhado e compatível com a hierarquia oficial `Companhia / Parceiro Master -> Franquia -> Franqueado`.

### 4.4 PartnerStatus canônico

O enum canônico de `PartnerStatus` deve ser:

- `prospect`
- `contato`
- `negociacao`
- `ativo`
- `inativo`

Campos e valores adicionais, como `nao_perturbe` ou `active`, devem ser tratados como legado/transição, não como contrato canônico.

## 5. Tabela de campos

| Campo | Classificação | Observação |
|---|---|---|
| `id` | KEEP | Identificador canônico UUID. |
| `tenantId` | KEEP | Obrigatório para escopo multi-tenant. |
| `code` | KEEP | Código canônico do parceiro. |
| `name` | KEEP | Nome canônico do parceiro. |
| `type` | KEEP | Tipo canônico do parceiro. |
| `status` | KEEP | Status canônico do parceiro. |
| `parentId` | KEEP | Relação hierárquica canônica. |
| `document` | ADAPTER | Campo persistido no Prisma, sem padronização semântica total no legado. |
| `email` | KEEP | Campo operacional útil e já suportado. |
| `phone` | KEEP | Campo operacional útil e já suportado. |
| `deletedAt` | ADAPTER | Campo de lifecycle/soft delete do Prisma, não exposto como contrato principal de UI. |
| `createdAt` | KEEP | Campo de auditoria. |
| `updatedAt` | KEEP | Campo de auditoria. |
| `children` | ADAPTER | Estrutura derivada de árvore. |
| `users` | ADAPTER | Relação de domínio, não payload principal. |
| `customers` | ADAPTER | Relação de domínio, não payload principal. |
| `leads` | ADAPTER | Relação de domínio, não payload principal. |
| `opportunities` | ADAPTER | Relação de domínio, não payload principal. |
| `bankProposals` | ADAPTER | Relação de domínio, não payload principal. |
| `commissions` | ADAPTER | Relação de domínio, não payload principal. |
| `codigo` | MIGRATE | Legado de frontend/runtime atual. |
| `nome` | MIGRATE | Legado de frontend/runtime atual. |
| `tipo` | MIGRATE | Legado de frontend/runtime atual. |
| `parent_id` | MIGRATE | Legado de frontend/runtime atual. |
| `cpf_cnpj` | REMOVE LATER | Campo legado da tela atual, fora do contrato canônico definido aqui. |
| `celular` | REMOVE LATER | Campo legado da tela atual, fora do contrato canônico definido aqui. |
| `login` | REMOVE LATER | Campo legado de UI/store, não parte do contrato canônico. |
| `senha` | REMOVE LATER | Campo de credencial/transição, não parte do contrato canônico. |

## 6. Enum PartnerType

| Valor | Classificação | Observação |
|---|---|---|
| `COMPANY` | KEEP | Nível raiz canônico do parceiro. |
| `FRANQUIA` | KEEP | Nível intermediário canônico. |
| `FRANQUEADO` | KEEP | Nível folha canônico. |

## 7. Enum PartnerStatus

| Valor | Classificação | Observação |
|---|---|---|
| `prospect` | KEEP | Estado inicial canônico. |
| `contato` | KEEP | Estado intermediário canônico. |
| `negociacao` | KEEP | Estado intermediário canônico. |
| `ativo` | KEEP | Estado operacional canônico. |
| `inativo` | KEEP | Estado operacional canônico. |
| `nao_perturbe` | REMOVE LATER | Estado legado observado na tela atual. |
| `active` | ADAPTER | Forma legada em inglês observada no Prisma/legado de persistência. |
| `inactive` | ADAPTER | Forma legada em inglês, se aplicada no runtime/transição. |

## 8. KEEP / ADAPTER / MIGRATE / REMOVE LATER

| Elemento | Classificação | Motivo factual |
|---|---|---|
| `id: UUID` | KEEP | É o identificador canônico do Prisma. |
| `tenantId` | KEEP | É obrigatório no escopo oficial. |
| `code` | KEEP | É a forma canônica de código. |
| `name` | KEEP | É a forma canônica de nome. |
| `type` | KEEP | É a forma canônica de tipo. |
| `parentId` | KEEP | É a forma canônica de hierarquia. |
| `PartnerType` (`COMPANY/FRANQUIA/FRANQUEADO`) | KEEP | Já está alinhado à hierarquia oficial. |
| `PartnerStatus` (`prospect/contato/negociacao/ativo/inativo`) | KEEP | É o enum canônico definido nesta auditoria. |
| `document`, `email`, `phone` | ADAPTER | Atributos suportados, mas não centrais para o contrato estrutural. |
| `createdAt`, `updatedAt`, `deletedAt` | ADAPTER | Campos de lifecycle/auditoria. |
| `children`, `users`, `customers`, `leads`, `opportunities`, `bankProposals`, `commissions` | ADAPTER | Relações derivadas, não payload principal. |
| `codigo`, `nome`, `tipo`, `parent_id` | MIGRATE | Campos do contrato legado atual. |
| `cpf_cnpj`, `celular`, `login`, `senha` | REMOVE LATER | Campos de UI/legado que não compõem o contrato canônico definido. |
| `ParceiroResponse` | REMOVE LATER | Contrato legado paralelo em `src/types/api.ts`. |
| `Parceiro` legado em `src/types/index.ts` | REMOVE LATER | Contrato duplicado e concorrente. |

## 9. Contrato Partner vNext

O contrato canônico `Partner vNext` deve ser entendido como:

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
- `createdAt: datetime`
- `updatedAt: datetime`
- `deletedAt?: datetime | null`

Relações como `children`, `users`, `customers`, `leads`, `opportunities`, `bankProposals` e `commissions` permanecem no domínio, mas como associações e não como payload básico de criação/listagem.

## 10. Incompatibilidades tratadas por adapter

As seguintes incompatibilidades devem ser tratadas por adapter e não por redefinição de contrato:

- `codigo` -> `code`
- `nome` -> `name`
- `tipo` -> `type`
- `parent_id` -> `parentId`
- `company` -> `COMPANY`
- `active` -> `ativo`
- `inactive` -> `inativo`
- shapes de resposta em envelope `parceiros` -> lista canônica de `Partner`

Essas conversões são compatibilidade transitória; não alteram o contrato canônico definido acima.

## 11. Veredito

O contrato canônico oficial de `Partner` para o FINQZ PRO deve ser considerado:

- identificador UUID;
- nomenclatura `code / name / type / parentId`;
- enum `PartnerType` em maiúsculas para o nível hierárquico;
- enum `PartnerStatus` em português operacional;
- campos de legado tratados como transição ou adaptadores.

## 12. Próxima fase recomendada

Próxima fase recomendada, sem implementação:

- usar esta definição como referência oficial para reconciliação contratual futura;
- tratar os formatos legados apenas como compatibilidade transitória;
- evitar nova tese de domínio antes da convergência do runtime e dos consumidores já identificados.
