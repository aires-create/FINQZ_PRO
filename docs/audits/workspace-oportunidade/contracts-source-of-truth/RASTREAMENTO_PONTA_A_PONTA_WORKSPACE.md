# Rastreamento Ponta a Ponta da Workspace

## Fluxo do card

1. O card é renderizado em `src/pages/Oportunidades.tsx`.
2. O clique chama `handleOpenLead(lead)` em `src/pages/Oportunidades.tsx:388`.
3. O objeto é normalizado com campos como `displayId`, `etapa_id`, `etapa`, `produto`, `cliente_nome`, `valor`, `responsavel_nome`.
4. `selectedLead` é atualizado e `showFullscreenModal` é aberto.
5. O modal fullscreen exibe resumo, etapa, valor, ações rápidas, histórico, anexos e simulador.
6. A edição pode ocorrer via `handleEditClick(card)` em `src/pages/Oportunidades.tsx:2163`.
7. O salvamento no drawer usa `handleSaveEditFromDrawer()` em `src/pages/Oportunidades.tsx:2340`.
8. O drag and drop usa `handleDrop(e, etapaId)` em `src/pages/Oportunidades.tsx:1664`.
9. O estado local e persistido do Kanban é mantido em `src/store/index.ts`.
10. O reload pode repovoar parte da interface a partir do store persistido e de adapters locais.

## IDs e campos

| Campo | Origem | Tipo | Mapper | Persistência | Exibição | Risco |
|---|---|---|---|---|---|---|
| `id` | backend, store ou seed, dependendo da origem do card | string/number | variado | banco ou localStorage | sim | inconsistência entre ambientes |
| `displayId` | frontend/adapter | string | transformador local | não comprovada | sim | pode mascarar ID real |
| `leadId` | CRM/backend | uuid/string | compatível em alguns fluxos | banco | indireta | baixa |
| `opportunityId` | banco ou simulador | uuid/string | varia por runtime | banco ou localStorage | indireta | média |
| `clienteId` / `customerId` | CRM / banco | uuid/string | adaptador | banco | indireta | média |
| `pipelineId` | Prisma `Opportunity` ou store | uuid/string | store/adapter | banco + store | sim | divergência de pipeline |
| `stageId` / `etapa_id` / `etapa` | banco, adapter ou catálogo local | uuid/string | mapper local | banco ou store | sim | maior risco de label incorreto |
| `status` | backend alternativo ou UI | string | adapter | banco ou local | sim | divergência semântica |
| `produto` / `subproduto` | API, catálogo ou UI | string | mapper local | banco ou local | sim | inconsistência entre rotas |
| `valor` | backend ou cálculo local | number | formatter local | banco ou local | sim | desvio de cálculo |
| `responsavel` | backend enterprise ou derivado | string/object | projection | banco + UI | sim | exibição sem vínculo claro |
| `origem` | backend, seed ou UI | string | adapter | banco ou local | opcional | baixa |

## Render, edição e persistência

- O render principal do card usa dados já preparados no array de oportunidades da tela.
- A edição abre um drawer com `editingOportunidade` ou `leadToEdit`.
- O salvamento aciona atualização local e, quando disponível, a camada de API consumida pela tela.
- O reload preserva `pipelines` e `oportunidadesKanban` via Zustand persist.
- O simulador e parte do histórico/anexos permanecem altamente dependentes do estado local.

## Conclusão do rastreamento

O card não representa sempre uma entidade única e pura. Ele se comporta como um agregado frontend que pode ser montado a partir de lead, opportunity, DTO compatível, seed ou estrutura local. A tela funciona, mas a rastreabilidade total até um único contrato backend ainda não está consolidada.
