# IWP-EPC-W2-02 - Pipeline / Opportunity

## 1. Objetivo

Simplificar o fluxo de Pipeline e Opportunity, reduzindo heuristicas de apoio e aproximando a interface do contrato oficial definido no backend.

## 2. Escopo permitido

- `Oportunidades.tsx`.
- `pipelines.api.ts`.
- `opportunities.api.ts`.
- Organizacao visual do kanban e do seletor de pipeline.
- Ajustes de normalizacao de identidade estritamente visuais/composicionais.

## 3. Escopo proibido

- Backend.
- APIs.
- Contratos.
- RBAC.
- Banco.
- Prisma.
- Servicos.
- Regras de negocio.
- Testes.
- Heuristica nova de ownership.

## 4. Arquivos candidatos

- [src/pages/Oportunidades.tsx](/C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/api/modules/pipelines.api.ts](/C:/Projects/FINQZ_PRO/src/api/modules/pipelines.api.ts)
- [src/api/modules/opportunities.api.ts](/C:/Projects/FINQZ_PRO/src/api/modules/opportunities.api.ts)
- [src/components/pipeline/KanbanColumn.tsx](/C:/Projects/FINQZ_PRO/src/components/pipeline/KanbanColumn.tsx)
- [backend/src/modules/pipelines/routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/routes.ts)
- [backend/src/modules/pipelines/service.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/pipelines/service.ts)
- [backend/src/modules/opportunities/routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/routes.ts)
- [backend/src/modules/opportunities/services/opportunities.service.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/opportunities/services/opportunities.service.ts)

## 5. Ordem de execucao

1. Consolidar o contrato visual do kanban.
2. Simplificar reconciliacao de pipeline/stage apenas onde houver apoio legitimo.
3. Reduzir dependencia de labels legadas na tela.
4. Validar que o backend segue como owner canonico.

## 6. Checklist de implementacao

- [ ] O kanban reflete o pipeline oficial.
- [ ] Opportunity usa API oficial como fonte primaria.
- [ ] Heuristicas de apoio nao viram source of truth.
- [ ] Fluxo de stage permanece coerente com o backend.
- [ ] Nenhum contrato foi alterado.

## 7. Checklist de validacao

- [ ] Build passa.
- [ ] Testes passam.
- [ ] Kanban carrega pipeline oficial.
- [ ] Movimentacao continua funcional.
- [ ] Nao ha regressao em tenant scope ou RBAC.

## 8. Critérios de rollback

- Reverter apenas a tela de Opportunity e ajustes associados.
- Preservar rotas e contratos.
- Restaurar a reconciliacao anterior se houver quebra operacional.

## 9. Riscos

- Regressao na experiencia de kanban.
- Divergencia entre identidade visual e backend canonico.
- Excesso de simplificacao remover apoio ainda necessario.

## 10. Veredito

**READY**
