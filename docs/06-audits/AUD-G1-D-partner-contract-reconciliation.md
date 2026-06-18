# AUD-G1-D — Partner Contract Reconciliation Audit

## 1. Objetivo

Reconciliar o contrato canônico esperado de `Partner` com o contrato real atualmente observado no Prisma, no client `parceirosApi`, no runtime EdgeSpark `/api/parceiros`, nos tipos compartilhados e na tela `Parceiros.tsx`.

## 2. Escopo

Esta auditoria foi limitada aos seguintes artefatos:

- `backend/prisma/schema.prisma`
- `src/api/modules/parceiros.api.ts`
- `backend/server/src/index.ts` nas rotas `/api/parceiros`
- `src/types/index.ts`
- `src/types/api.ts`
- `src/pages/Parceiros.tsx`

## 3. Contrato canônico esperado

Com base nas decisões documentadas em `ARCH-004`, `ARCH-005` e `ARCH-015`, o contrato canônico esperado para o domínio Partner é:

- entidade de domínio `Partner`
- hierarquia multi-tenant com `parentId`
- identificação canônica consistente entre frontend e backend
- `Partner` como identidade comercial/parceiro dentro do CRM
- relação com `Customer`, `Opportunity` e `Operation`

Neste audit, o contrato canônico esperado é tratado como o contrato de referência arquitetural já aprovado, não como proposta nova.

## 4. Contrato Prisma Partner

O modelo `Partner` encontrado em `backend/prisma/schema.prisma` possui os seguintes campos:

- `id: String @db.Uuid`
- `code: String`
- `name: String`
- `type: String`
- `document: String?`
- `email: String?`
- `phone: String?`
- `status: String @default("active")`
- `deletedAt: DateTime?`
- `createdAt: DateTime`
- `updatedAt: DateTime`
- `tenantId: String @db.Uuid`
- `parentId: String? @db.Uuid`
- relações:
  - `tenant`
  - `parent`
  - `children`
  - `users`
  - `customers`
  - `leads`
  - `opportunities`
  - `bankProposals`
  - `commissions`

Evidência:

- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L129)

## 5. Contrato parceirosApi

O módulo `src/api/modules/parceiros.api.ts` espera o seguinte formato de entrada e saída:

### Payload de criação

- `nome: string`
- `tipo: PartnerType`
- `cnpj?: string`
- `responsavel?: string`
- `telefone?: string`
- `email?: string`
- `cep?: string`
- `rua?: string`
- `numero?: string`
- `complemento?: string`
- `bairro?: string`
- `cidade?: string`
- `estado?: string`
- `status?: PartnerStatus`
- `parent_id?: number`
- `codigo?: string`

### Respostas esperadas

- `Partner[]` em listagens
- `Partner` em `getById`, `create` e `update`
- `void` em `delete`

### Convenções de contrato do client

- `id: number`
- `nome`
- `tipo: 'COMPANY' | 'FRANQUIA' | 'FRANQUEADO'`
- `status: 'prospect' | 'contato' | 'negociacao' | 'ativo' | 'inativo'`
- `parent_id?: number`
- `codigo?: string`

Evidência:

- [src/api/modules/parceiros.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/parceiros.api.ts#L1)

## 6. Contrato EdgeSpark /api/parceiros

O runtime ativo em `backend/server/src/index.ts` expõe `/api/parceiros` com este comportamento observado:

### GET `/api/parceiros`

- lê `tipo`
- lê `status`
- aplica filtro de tenant por `user.parceiroId`
- retorna envelope com:
  - `parceiros`
  - `companies`
  - `franquias`
  - `franqueados`

### GET `/api/parceiros/:id`

- retorna envelope com:
  - `parceiro`
  - `children`

### POST `/api/parceiros`

- recebe `body.nome`
- recebe `body.tipo`
- recebe `body.cnpj`
- recebe `body.responsavel`
- recebe `body.telefone`
- recebe `body.email`
- recebe `body.cep`
- recebe `body.rua`
- recebe `body.numero`
- recebe `body.complemento`
- recebe `body.bairro`
- recebe `body.cidade`
- recebe `body.estado`
- recebe `body.status`
- recebe `body.parent_id`
- recebe `body.gestor_id`
- recebe `body.comissao_company`
- recebe `body.comissao_franquia`
- recebe `body.comissao_franqueado`
- gera `codigo`
- gera `senha`
- persiste em `tables.parceiros`

### Observações de contrato do runtime

- usa `tipo` em minúsculo para comparação: `company`, `franquia`, `franqueado`
- usa `parentId` internamente na leitura e `parent_id` no input
- retorna `parceiros` em envelope, não lista pura
- o endpoint é legado/monolítico e não o módulo moderno `backend/src/modules/partners`

Evidência:

- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1771)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1817)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1828)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1882)

## 7. Contrato Parceiros.tsx

A tela `src/pages/Parceiros.tsx` usa o contrato legado do store e manipula os seguintes campos observados:

- `id: number`
- `codigo: number`
- `nome`
- `tipo: 'company' | 'franquia' | 'franqueado'`
- `cpf_cnpj`
- `responsavel`
- `telefone`
- `celular`
- `email`
- `cep`
- `rua`
- `numero`
- `complemento`
- `bairro`
- `cidade`
- `estado`
- `status: 'prospect' | 'contato' | 'negociacao' | 'ativo' | 'inativo' | 'nao_perturbe'`
- campos de perfil/cliente herdados:
  - `profissao`
  - `estado_civil`
  - `responsavel_legal`
  - `cpf_responsavel`
  - `sexo`
  - `data_nascimento`
- campos bancários:
  - `bankData`
- `parent_id`
- `comissao_company`
- `comissao_franquia`
- `comissao_franqueado`
- `observacao`
- `documentos`
- `login`
- `senha`
- `created_at`
- `updated_at`

Além disso:

- usa `useAppStore`
- persiste em `localStorage`
- faz CRUD via store
- faz reset de senha via `fetch` direto em `/api/parceiros/:id/reset-senha`

Evidência:

- [src/pages/Parceiros.tsx](C:/Projects/FINQZ_PRO/src/pages/Parceiros.tsx#L1)

## 8. Matriz campo a campo

| Campo / aspecto | Prisma Partner | parceirosApi | EdgeSpark `/api/parceiros` | Parceiros.tsx | Status |
|---|---|---|---|---|---|
| Identificador | `id: UUID string` | `id: number` | `id` numérico via `tables.parceiros` | `id: number` | Divergente |
| Código | `code: String` | `codigo?: string` | `codigo` gerado no runtime | `codigo: number` | Divergente |
| Nome | `name: String` | `nome: string` | `nome` | `nome` | Parcial |
| Tipo | `type: String` | `tipo: 'COMPANY' \| ...` | `tipo: 'company' \| ...` | `tipo: 'company' \| ...` | Divergente |
| Documento | `document?: String` | `cnpj?: string` | `cnpj` | `cpf_cnpj` | Divergente |
| Email | `email?: String` | `email?: string` | `email` | `email` | Parcial |
| Telefone | `phone?: String` | `telefone?: string` | `telefone` | `telefone` / `celular` | Parcial |
| Status | `status: String = "active"` | `prospect|contato|negociacao|ativo|inativo` | string livre filtrada por query | `prospect|contato|negociacao|ativo|inativo|nao_perturbe` | Divergente |
| Tenant | `tenantId: UUID string` | não explicitado no payload | filtragem por `user.parceiroId` | indireto via store/tenant filter | Parcial |
| Parent | `parentId: UUID string?` | `parent_id?: number` | `parent_id` no input, `parentId` no DB read | `parent_id` | Divergente |
| Hierarquia | `parent` / `children` | `getTree`, `getChildren` | `companies`, `franquias`, `franqueados`, `children` | hierarquia implícita | Parcial |
| Criação | campos canônicos do Prisma | payload próprio do client | cria em `tables.parceiros` com `body.*` | cria via store | Divergente |
| Atualização | campos canônicos do Prisma | payload próprio do client | update em `tables.parceiros` | update via store | Divergente |
| Exclusão | soft-delete `deletedAt` no modelo | `DELETE /api/parceiros/:id` | delete físico em `tables.parceiros` | delete via store | Divergente |
| Resposta listagem | n/a | espera `Partner[]` | envelope `{ parceiros, companies, franquias, franqueados }` | consome store array | Divergente |

## 9. Divergências críticas

As divergências críticas identificadas são:

1. **UUID vs number**
   - Prisma usa `id: String @db.Uuid`.
   - `parceirosApi` e `Parceiros.tsx` usam `id: number`.

2. **Casing dos tipos**
   - Prisma usa `type: String` sem enum oficial no trecho observado.
   - `parceirosApi` usa `COMPANY / FRANQUIA / FRANQUEADO`.
   - backend EdgeSpark filtra com `company / franquia / franqueado`.
   - `src/types/index.ts` contém ambos `PartnerType` e `Parceiro`.

3. **parentId vs parent_id**
   - Prisma usa `parentId`.
   - `parceirosApi` e `Parceiros.tsx` usam `parent_id`.
   - backend converte entre os dois formatos.

4. **code/name/type vs codigo/nome/tipo**
   - Prisma usa `code`, `name`, `type`.
   - frontend legado e runtime usam `codigo`, `nome`, `tipo`.

5. **status**
   - Prisma usa string genérica com default `active`.
   - client usa estados de funil comercial em português.
   - tela usa estados legados adicionais como `nao_perturbe`.

6. **Shape da resposta**
   - `parceirosApi` espera lista ou item.
   - backend retorna envelopes com `parceiros` e agregações.
   - tela usa store, não o contrato HTTP.

## 10. KEEP / MIGRATE / QUARANTINE / REMOVE LATER

| Artefato | Classificação | Motivo factual |
|---|---|---|
| `backend/prisma/schema.prisma` | KEEP | Contém o modelo persistido canônico `Partner`. |
| `src/api/modules/parceiros.api.ts` | MIGRATE | É o client-alvo, mas ainda não bate com o runtime. |
| `backend/server/src/index.ts` | QUARANTINE | Runtime ativo, porém ainda legado e com envelope. |
| `src/types/index.ts` | QUARANTINE | Duplica `Partner` e `Parceiro`. |
| `src/types/api.ts` | QUARANTINE | Mantém `ParceiroResponse` legado. |
| `src/pages/Parceiros.tsx` | QUARANTINE | Depende de store/localStorage e contrato legado. |
| `backend/src/modules/partners/**` | REMOVE LATER | Existe como stub/esqueleto não ativo. |

## 11. Veredito

**NO-GO**

Motivos factuais:

- o Prisma já tem `Partner`;
- o frontend já tenta modelar `Partner`;
- porém os contratos não estão unificados;
- há divergência de identificador, casing, parent key, nome de campo e shape da resposta;
- a tela `Parceiros.tsx` continua operando com legado de store/localStorage;
- o runtime ativo segue em EdgeSpark monolítico, não no módulo moderno.

## 12. Próxima fase recomendada

O menor caminho seguro antes de implementar runtime Partner moderno é:

- manter o modelo canônico do Prisma como referência persistida;
- tratar o runtime EdgeSpark atual como legado/quarentena;
- alinhar o client `parceirosApi` ao contrato real antes de qualquer troca de tela;
- eliminar a dependência da tela `Parceiros.tsx` em store/localStorage apenas depois de o contrato HTTP estar consistente;
- preservar a decisão arquitetural já aprovada e não criar nova solução paralela.
