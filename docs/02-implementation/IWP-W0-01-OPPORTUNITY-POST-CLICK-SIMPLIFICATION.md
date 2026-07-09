# IWP-W0-01 - Opportunity Post-Click Simplification

## 1. Objetivo

Simplificar a experiencia apos o clique no card da oportunidade, reduzindo friccao visual, excesso de abas e excesso de leitura para que a Opportunity funcione como workspace operacional simples e confiavel na Release 1.0.

## 2. Escopo permitido

- Opportunity Workspace apos abertura do card.
- Hierarquia visual da tela de Opportunity.
- Reducao e reorganizacao de abas visiveis no fluxo principal.
- Quick actions.
- Informacoes essenciais visiveis imediatamente.
- Recolhimento de blocos secundarios que competem com a acao principal.
- Ajustes de microcopy e ordenacao visual.

## 3. Escopo proibido

- Redesho do Kanban.
- Alteracao do card do Kanban.
- Backend.
- APIs.
- Contratos.
- Banco.
- Prisma.
- RBAC.
- Nova arquitetura.
- Commercial Recommendation Engine.
- Decision Engine.
- IA.

## 4. Arquivos candidatos

- [src/pages/Oportunidades.tsx](/C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/components/pipeline/KanbanColumn.tsx](/C:/Projects/FINQZ_PRO/src/components/pipeline/KanbanColumn.tsx)
- [src/components/pipeline/pipelineUtils.ts](/C:/Projects/FINQZ_PRO/src/components/pipeline/pipelineUtils.ts)
- [src/layouts/MainLayout.tsx](/C:/Projects/FINQZ_PRO/src/layouts/MainLayout.tsx)
- [src/components/layout/PageHeader.tsx](/C:/Projects/FINQZ_PRO/src/components/layout/PageHeader.tsx)

## 5. Ordem de execução

1. Mapear o estado atual do pós-clique.
2. Reduzir o que compete com a acao principal.
3. Reordenar o que deve aparecer primeiro.
4. Recolher o que e secundario.
5. Manter quick actions visiveis e diretas.
6. Validar a leitura do workspace como ambiente unico.

## 6. Checklist de implementação

- [ ] O cabeçalho da Opportunity mostra contexto essencial primeiro.
- [ ] A tela nao expõe excesso de blocos concorrentes.
- [ ] As abas visiveis sao apenas as necessarias para producao.
- [ ] Quick actions ficam acessiveis sem troca de contexto.
- [ ] Informacoes do cliente e da oportunidade estao hierarquizadas corretamente.
- [ ] O pós-clique parece um workspace, não uma tela de inventário.

## 7. Checklist de validação

- [ ] O usuario entende a oportunidade logo ao abrir.
- [ ] O usuario localiza a acao principal sem hesitacao.
- [ ] O numero de cliques para agir nao aumenta.
- [ ] O layout nao perde informacao critica.
- [ ] Nao ha regressao visivel em desktop.
- [ ] Nao ha regressao visivel no fluxo de abertura do card.

## 8. Critérios de rollback

- Restaurar o layout anterior se houver perda de leitura operacional.
- Reverter apenas a camada de ordenacao/visibilidade se a simplificacao remover contexto essencial.
- Preservar o Kanban e o fluxo de abertura do card.

## 9. Riscos

- Simplificar demais e esconder informacao que o vendedor ainda usa.
- Reduzir abas sem consolidar bem a navegação interna.
- Melhorar a estética mas piorar a leitura operacional.

## 10. Veredito

**READY**

