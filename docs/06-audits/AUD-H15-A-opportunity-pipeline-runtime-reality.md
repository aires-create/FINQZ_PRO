# AUD-H15-A — Opportunity & Pipeline Runtime Reality Audit

## 1. Objetivo
Auditar o estado real atual de `Opportunity` e `Pipeline` no frontend e backend, distinguindo:
- owner arquitetural oficial.
- runtime de fato em uso hoje.
- dependências diretas e indiretas.
- legados que ainda sustentam a operação.

## 2. Escopo
Arquivos e documentos considerados:
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx)
- [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts)
- [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts)
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts)
- [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts)
- [src/api/modules/oportunidades.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts)
- [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts)
- [src/api/modules/master-catalog.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/master-catalog.api.ts)
- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma)
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts)
- [backend/src/modules/opportunities/**](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities)
- [backend/src/modules/pipelines/**](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines)
- [backend/src/modules/operation/**](C:/Projects/FINQZ_PRO/backend/src/modules/operation)
- [docs/02-architecture/ARCH-036-PIPELINE-OWNERSHIP-SETTINGS-BLUEPRINT.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-036-PIPELINE-OWNERSHIP-SETTINGS-BLUEPRINT.md)
- [docs/02-architecture/ARCH-037-COMMERCIAL-STRUCTURE-OWNERSHIP-BLUEPRINT.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-037-COMMERCIAL-STRUCTURE-OWNERSHIP-BLUEPRINT.md)
- [docs/02-architecture/ARCH-038-COMMERCIAL-CATALOG-BACKEND-BLUEPRINT.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-038-COMMERCIAL-CATALOG-BACKEND-BLUEPRINT.md)
- [docs/02-architecture/ARCH-039-COMMERCIAL-CATALOG-CONTRACT.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-039-COMMERCIAL-CATALOG-CONTRACT.md)
- [docs/02-architecture/ARCH-040-MASTER-CATALOG-BACKEND-DESIGN.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-040-MASTER-CATALOG-BACKEND-DESIGN.md)
- [docs/02-architecture/ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-041-MASTER-CATALOG-CONSUMER-MAPPING.md)
- [docs/02-architecture/ARCH-056-pipeline-domain-architecture.md](C:/Projects/FINQZ_PRO/docs/02-architecture/ARCH-056-pipeline-domain-architecture.md)

## 3. Evidências documentais
- ARCH-036 confirma que `Pipeline` é backend-owned, enquanto o frontend ainda usa `src/config/pipelines.ts`, `src/data/catalogRepository.ts` e `localStorage` como suporte transitório.
- ARCH-037, ARCH-038, ARCH-039, ARCH-040 e ARCH-041 consolidam a separação entre catálogo mestre e pipeline, além de mostrar que `Product -> Pipeline` é contexto legado, não contrato canônico.
- ARCH-056 é a restrição mais importante: o `Pipeline` é domínio separado, `Opportunity` deve referenciar `pipelineId` e `stageId`, e heurísticas implícitas de `Product -> Pipeline` não podem virar regra canônica.
- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463-L555) contém os models oficiais `Pipeline`, `Stage` e `Opportunity`.
- [backend/src/modules/pipelines/routes.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L40-L60) expõe o runtime moderno de pipeline.
- [backend/src/modules/opportunities/validators/opportunities.validator.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/validators/opportunities.validator.ts#L10-L58) exige UUID em `pipelineId` e `stageId`.
- [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts#L306-L315) e [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts#L556-L590) validam consistência entre pipeline e stage no backend.
- [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982-L2236) mantém runtime legado para `/api/oportunidades` e `/api/oportunidades/pipeline`.
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L4-L18) e [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L88-L111) mostram consumo híbrido e heurísticas legadas de pipeline.
- [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L19-L49) e [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300-L437) mostram persistência local de pipeline em `localStorage`.
- [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L10-L25) e [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L833-L949) mantêm `pipelines`, `currentPipelineId` e `oportunidadesKanban` no store.
- [src/types/index.ts](C:/Projects/FINQZ_PRO/src/types/index.ts#L255-L309) e [src/types/api.ts](C:/Projects/FINQZ_PRO/src/types/api.ts#L168-L187) ainda carregam contratos legados com `pipeline_id`, `coluna_id`, `id` numérico e snake_case.
- [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L3-L25) é o client moderno de Opportunity em `/api/v1/opportunities`.
- [src/api/modules/oportunidades.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts#L1-L75) é o client legado em `/api/oportunidades`.
- [src/api/modules/master-catalog.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/master-catalog.api.ts#L1-L98) confirma que o catálogo mestre moderno existe, mas não substitui o runtime de pipeline.

## 4. Respostas obrigatórias
| # | Pergunta | Resposta factual |
|---|---|---|
| 1 | Quem é owner real de Opportunity hoje? | Oficialmente, o backend moderno em [backend/src/modules/opportunities/**](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities) e o model `Opportunity` de [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L509-L555). Em runtime, ainda existe uma trilha legado/EdgeSpark em [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982-L2236). |
| 2 | Quem é owner real de Pipeline hoje? | Oficialmente, o backend moderno em [backend/src/modules/pipelines/**](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines) e os models `Pipeline`/`Stage` de [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463-L507). De fato, o frontend ainda governa configurações e etapas via [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L19-L49) e [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300-L437). |
| 3 | Existe API real de Opportunity? | Sim. Há client moderno em [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148-L194) apontando para `/api/v1/opportunities`, e há a rota legada em [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982-L2236). |
| 4 | Existe API real de Pipeline? | Sim. O backend moderno expõe rota em [backend/src/modules/pipelines/routes.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L40-L60). Não existe client frontend dedicado `pipelinesApi`; o admin ainda usa repo/localStorage. |
| 5 | Oportunidades.tsx consome backend ou store/local/repository? | Consome ambos. Usa [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148-L194), mas também depende de [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L833-L949), [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L425-L473) e [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L103-L125). |
| 6 | Pipelines.tsx consome backend ou repository/localStorage? | Repository/localStorage. [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L19-L49) usa `loadPipelineSettings` e `savePipelineSettings` de [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L350-L384), sem API backend. |
| 7 | Existe acoplamento Product -> Pipeline? | Sim, forte e explícito. Ele aparece em [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L103-L125) e em heurísticas de [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L88-L111). ARCH-056 trata isso como legado transitório, não regra canônica. |
| 8 | Existe dependência de catalogRepository? | Sim. O frontend de oportunidade e a tela admin de pipeline usam `getPipelineStages`, `getPipelineOptions` e persistência de settings local. |
| 9 | Existe dependência de config/pipelines.ts? | Sim. [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18-L18) e a lógica de compatibilidade legada usam esse catálogo como fallback e como fonte de tipos/labels. |
| 10 | Existe dependência de useAppStore? | Sim. [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L590-L590) depende diretamente do store, e [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L833-L949) ainda guarda pipeline e kanban legado. |
| 11 | Existe runtime EdgeSpark para oportunidades/pipelines? | Para `Opportunity`, sim: [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982-L2236) mantém as rotas legadas. Para `Pipeline`, não há runtime EdgeSpark dedicado encontrado; o estado ainda é híbrido entre backend moderno e settings locais no frontend. |
| 12 | Existe runtime moderno backend/src para opportunities/pipeline? | Sim. `backend/src/modules/opportunities/**` e `backend/src/modules/pipelines/**` existem e operam com UUID e validação de consistência. |
| 13 | Prisma possui models oficiais relacionados? | Sim. [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463-L555) define `Pipeline`, `Stage` e `Opportunity` como models oficiais. |
| 14 | O que está KEEP, MIGRATE, QUARANTINE, REMOVE LATER? | KEEP: `backend/prisma/schema.prisma`, `backend/src/modules/opportunities/**`, `backend/src/modules/pipelines/**`, `src/api/modules/opportunities.api.ts`. MIGRATE: `src/pages/Oportunidades.tsx`, `src/pages/admin/Pipelines.tsx`, client legado `src/api/modules/oportunidades.api.ts`. QUARANTINE: `src/config/pipelines.ts`, `src/data/catalogRepository.ts`, `src/store/index.ts`, `src/types/index.ts`, `src/types/api.ts`, `backend/server/src/index.ts`. REMOVE LATER: heurísticas `Product -> Pipeline`, `localStorage` de pipeline, `oportunidadesKanban` do store, `/api/oportunidades` legado e contratos snake_case numéricos. |
| 15 | Veredito GO / GO WITH RESTRICTIONS / NO-GO? | GO WITH RESTRICTIONS. O backend moderno já existe, mas o frontend e o runtime legado ainda sustentam regras que não podem ser removidas sem migração controlada. |

## 5. Estado real frontend Opportunity
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L4-L18) importa `useAppStore`, `opportunitiesApi` e `catalogRepository`, então o consumo é híbrido.
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L88-L111) contém mapeamento `Product -> Pipeline` e compatibilidade explícita com IDs legados.
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2246-L2257) e [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2476-L2516) ainda aceitam `pipeline_id` como fallback semântico.
- [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L2744-L3030) mostra que criação e update continuam conciliando `pipeline_id`, `pipelineId`, `stageId` e compatibilidade legada.
- O frontend de Opportunity já fala com a API moderna, mas ainda não é mono-contrato.

## 6. Estado real frontend Pipeline
- [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L19-L49) carrega settings do `localStorage` via `catalogRepository`.
- [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L300-L437) é a fonte efetiva de persistência local para etapas, cores e status do pipeline.
- Não foi encontrado client `pipelinesApi` no frontend.
- A tela admin de pipeline é uma UI de configuração local, não um consumidor direto do backend moderno.

## 7. Estado real backend Opportunity
- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L509-L555) define `Opportunity` com `pipelineId`, `stageId`, `partnerId`, `leadId`, `customerId` e `ownerId`.
- [backend/src/modules/opportunities/validators/opportunities.validator.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/validators/opportunities.validator.ts#L10-L58) exige UUIDs para `pipelineId` e `stageId`.
- [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts#L306-L315) valida consistência de pipeline/stage na criação.
- [backend/src/modules/opportunities/services/opportunities.service.ts](C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts#L423-L590) repete a validação em update e move stage.
- O backend moderno é o único lugar onde existe validação canônica de `Opportunity` com `pipelineId` e `stageId` UUID.

## 8. Estado real backend Pipeline
- [backend/prisma/schema.prisma](C:/Projects/FINQZ_PRO/backend/prisma/schema.prisma#L463-L507) define `Pipeline` e `Stage` como models oficiais.
- [backend/src/modules/pipelines/repository.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/repository.ts#L25-L39) lê pipelines ativos por tenant com stages ordenadas.
- [backend/src/modules/pipelines/routes.ts](C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts#L40-L60) expõe rota real de leitura com auth e permissões.
- Não há evidência de que o frontend admin pipeline esteja consumindo essa rota hoje.
- O backend é owner oficial, mas o frontend ainda mantém o ciclo operacional local.

## 9. Matriz de ownership
| Artefato | Owner oficial | Owner de fato hoje | Situação |
|---|---|---|---|
| `Opportunity` | `backend/src/modules/opportunities/**` + Prisma | Backend moderno e EdgeSpark legado em paralelo | Híbrido |
| `Pipeline` | `backend/src/modules/pipelines/**` + Prisma | Frontend admin + `localStorage` para settings | Híbrido |
| `Stage` | Backend moderno + Prisma | Backend moderno | Saudável |
| `Oportunidades.tsx` | Frontend consumidor | Consumidor híbrido com heurísticas legadas | Quarentena |
| `Pipelines.tsx` | Frontend consumidor | Owner local de settings | Quarentena |

## 10. Matriz de dependências
| Dependência | Onde aparece | Risco |
|---|---|---|
| `useAppStore` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L590-L590), [src/store/index.ts](C:/Projects/FINQZ_PRO/src/store/index.ts#L833-L949) | Alto |
| `localStorage` | [src/data/catalogRepository.ts](C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts#L350-L384), [src/pages/admin/Pipelines.tsx](C:/Projects/FINQZ_PRO/src/pages/admin/Pipelines.tsx#L19-L49) | Alto |
| `catalogRepository` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L18-L18) e admin pipeline | Alto |
| `config/pipelines.ts` | [src/pages/Oportunidades.tsx](C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx#L88-L111), [src/config/pipelines.ts](C:/Projects/FINQZ_PRO/src/config/pipelines.ts#L103-L125) | Alto |
| `opportunitiesApi` moderno | [src/api/modules/opportunities.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts#L148-L194) | Médio |
| `oportunidadesApi` legado | [src/api/modules/oportunidades.api.ts](C:/Projects/FINQZ_PRO/src/api/modules/oportunidades.api.ts#L1-L75) | Alto |
| EdgeSpark legado | [backend/server/src/index.ts](C:/Projects/FINQZ_PRO/backend/server/src/index.ts#L1982-L2236) | Alto |

## 11. Legados encontrados
- `src/config/pipelines.ts` ainda define pipeline legada, mapeia produto legando para pipeline e traz pipelines compatíveis com o modelo antigo.
- `src/data/catalogRepository.ts` persiste settings de pipeline em `localStorage` com chave fixa `finqz_pipeline_settings`.
- `src/store/index.ts` ainda guarda `pipelines`, `currentPipelineId` e `oportunidadesKanban`.
- `src/types/index.ts` carrega tipos legados com `pipeline_id`, `coluna_id`, `produto` e IDs numéricos.
- `src/types/api.ts` mantém `OportunidadeResponse` com `id: number` e snake_case.
- `src/api/modules/oportunidades.api.ts` ainda fala `/api/oportunidades`.
- `backend/server/src/index.ts` ainda responde por `/api/oportunidades` e `/api/oportunidades/pipeline`.
- Não existe `src/api/modules/pipelines.api.ts` neste repositório.
- Não existe `backend/src/modules/pipeline/**`; o runtime moderno está em `backend/src/modules/pipelines/**`.

## 12. Blockers
- Persistência local de pipeline em `localStorage` impede que o backend seja a única fonte de verdade.
- `Product -> Pipeline` continua presente em frontend e config legada, o que conflita com a arquitetura canônica.
- `useAppStore` ainda persiste estado operacional de pipeline e kanban.
- Há contratos paralelos para oportunidade: UUID moderno e numeric/snake_case legado.
- O runtime EdgeSpark legado continua disponível para oportunidades, então cortar o legado agora quebraria consumidores ainda não migrados.
- O módulo `backend/src/modules/operation/**` ainda tem métodos não implementados em serviço/repositório, então não deve ser tratado como pronto para dependências adicionais de go-live.

## 13. Veredito
**GO WITH RESTRICTIONS**

Motivo:
- o backend moderno já possui models, validação e rota oficial para `Opportunity` e `Pipeline`.
- porém o frontend ainda depende de store, `localStorage`, config legado e heurísticas de compatibilidade.
- portanto, a base é suficiente para modernização progressiva, mas não para remoção imediata do legado.

## 14. Próxima fase recomendada
- Migrar o frontend consumidor de oportunidade para contrato único canônico, eliminando fallback `pipeline_id` e heurísticas `Product -> Pipeline`.
- Trocar a tela admin de pipeline para leitura/gravação do backend moderno.
- Quarentenar o store e `catalogRepository` como legado transitório.
- Encerrar `src/api/modules/oportunidades.api.ts` e o runtime `/api/oportunidades` apenas depois que os consumidores estiverem confirmados no contrato moderno.
