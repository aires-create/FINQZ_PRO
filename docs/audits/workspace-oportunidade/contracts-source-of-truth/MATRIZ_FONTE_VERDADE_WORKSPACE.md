# Matriz de Fonte de Verdade da Workspace

| Domínio | Campo | Frontend | Store | API | Backend | Banco | Fonte de verdade | Confiança |
|---|---|---|---|---|---|---|---|---|
| Oportunidade | `id`, `displayId` | `src/pages/Oportunidades.tsx` | `oportunidadesKanban` | compat `/api/oportunidades` | Prisma `Opportunity` | `opportunities` | híbrido com prevalência do banco para domínio e da UI para visualização | média |
| Lead | `cliente_nome`, `nome`, `telefone`, `email` | `src/pages/Oportunidades.tsx`, `src/modules/crm/routes.tsx` | store/adapter local | `/api/v1/crm/leads` | `backend/src/modules/crm/routes.ts` | `leads` | backend enterprise/CRM | alta |
| Customer | `cliente_nome`, `cliente_id` | workspace e CRM | store local parcial | `/api/v1/crm/clientes` | CRM service | `customers` | backend enterprise/CRM | alta |
| Pipeline | `pipelineId`, `currentPipelineId` | Kanban e store | `pipelines` | wrappers de oportunidade | Prisma `Pipeline` | `pipelines` | híbrido; banco para definição, store para estado atual da UI | média |
| Stage | `etapa_id`, `etapa` | header, cards, editor | store local e catálogo | wrappers de oportunidade | Prisma `Stage` | `stages` | banco para definição, frontend para label/render | média |
| Responsável | `responsavel_nome`, `ownerId` | workspace | não comprovado como fonte única | CRM/compat | backend enterprise | usuários/memberships | backend enterprise com projeção na UI | média |
| Produto | `produto`, `produto_id`, `subproduto` | workspace, simulador | catálogo local parcial | `/api/oportunidades` e compat | runtime alternativo / catálogo | `produtos` | híbrido | baixa |
| Valor | `valor`, `amount` | workspace, cards, simulador | store local | compat e formulário | backend + Prisma Opportunity | banco quando persistido; UI para cálculo e exibição | média |
| Simulador | parâmetros de crédito/energia | `src/pages/Oportunidades.tsx`, `src/pages/Simulador.tsx` | estado local | não comprovada persistência oficial completa | engine parcialmente local | localStorage | local-first com fallback | alta |
| Tags | `tags` | workspace | estado local/catalog | não comprovado | sem prova conclusiva neste recorte | sem prova conclusiva | catálogo local / híbrido | baixa |
| Anexos | `anexos` | workspace | estado local | não comprovado | não comprovado | não comprovado | UI/local | baixa |
| Histórico | eventos, timeline | workspace | local + leitura indireta | `/api/v1/crm/leads/:id/timeline` | CRM timeline | audit/activity | híbrido | média |
| Tarefas | task list | workspace | local | não comprovado | não comprovado | não comprovado | local/UI | baixa |
| Anotações | `observacoes` | workspace | local | compat e CRM | backend alternativo/CRM | banco dependendo do fluxo | híbrido | média |
| Proposta | `proposalId`, `BankProposal` | simulador e módulos de proposta | local parcial | runtime alternativo | Prisma `BankProposal` | `bank_proposals` | banco para entidade, UI para composição | média |
| Ações rápidas | WhatsApp, telefone, e-mail | workspace | n/a | n/a | n/a | n/a | UI pura | alta |

## Observações

- O frontend apresenta uma composição de DTOs e campos agregados. Em vários pontos, o objeto selecionado na Workspace não é uma entidade pura do banco, mas um agregado de resposta, persistência local e campos derivados.
- `etapa_id` aparece como campo de exibição e movimentação, enquanto `stageId` é a forma de modelagem oficial no Prisma.
- A confiança sobe quando há convergência entre frontend, serviço e modelo Prisma; cai quando há apenas estado local ou adapter sem backend comprovado.
