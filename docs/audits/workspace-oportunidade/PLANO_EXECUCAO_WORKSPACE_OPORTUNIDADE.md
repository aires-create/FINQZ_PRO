# Plano de Execucao da Workspace da Oportunidade

## Premissas
- Nao alterar o Pipeline homologado.
- Nao tocar em Kanban, Drag and Drop ou rotas existentes ate fechar contratos.
- Priorizar pequena migracao, com rollback simples.

## Fase A - Correcao critica de dados e contratos
- Objetivo: corrigir mapeamento de identificadores, principalmente etapa e oportunidade.
- Arquivos envolvidos: `src/pages/Oportunidades.tsx`, `src/api/client.ts`, `src/api/dataService.ts`, `src/api/adapters.ts`, `src/store/index.ts`.
- Dependencias: definicao do contrato oficial da oportunidade.
- Riscos: regressao visual do cabeçalho e do Kanban.
- Testes: clique no card, abertura da workspace, label da etapa, persistencia de edicao.
- Criterio de aceite: nenhuma etapa tecnica visivel ao usuario.
- Rollback: manter fallback de label local.
- Impacto no Pipeline: nenhum no comportamento do quadro.
- Esforco: medio.

## Fase B - Layout e design
- Objetivo: melhorar hierarquia, densidade e uso da sidebar sem redesenhar o Pipeline.
- Arquivos envolvidos: `src/pages/Oportunidades.tsx`, componentes UI compartilhados.
- Dependencias: aprovacao do design system existente.
- Riscos: mexer em componentes compartilhados do Kanban.
- Testes: responsividade desktop/mobile, foco, contraste, scroll.
- Criterio de aceite: cabecalho e sidebar mais claros, sem perda de informacao.
- Rollback: reverter apenas os estilos da workspace.
- Impacto no Pipeline: baixo, desde que nao reutilize o card do Kanban.
- Esforco: medio.

## Fase C - Simulador
- Objetivo: ligar o simulador ao produto/subproduto corretos da oportunidade.
- Arquivos envolvidos: `src/pages/Oportunidades.tsx`, `src/pages/Simulador.tsx`, `src/data/catalogRepository.ts`, `src/config/pipelines.ts`.
- Dependencias: catalogo comercial oficial e regras de simulacao.
- Riscos: divergencia entre tipos de simulacao e produto comercial.
- Testes: Consignado, Garantia, FGTS, CLT, Pessoal.
- Criterio de aceite: o simulador so oferece tipos permitidos pelo SSOT.
- Rollback: manter modo leitura se o contrato ainda nao existir.
- Impacto no Pipeline: medio, somente se usar o mesmo catalogo.
- Esforco: alto.

## Fase D - Tags
- Objetivo: substituir tags fixas por catalogo persistido por tenant.
- Arquivos envolvidos: `src/pages/Oportunidades.tsx`, `src/config/tags.ts`, possivel novo service.
- Dependencias: endpoint oficial e modelo de persistencia.
- Riscos: quebra de dados locais existentes.
- Testes: aplicar, limpar, persistir apos F5.
- Criterio de aceite: tags vivem fora do array estatico.
- Rollback: fallback para catalogo local em leitura.
- Impacto no Pipeline: baixo.
- Esforco: medio.

## Fase E - Anexos
- Objetivo: criar fluxo real de upload, armazenamento, download e auditoria.
- Arquivos envolvidos: `src/pages/Oportunidades.tsx`, backend de documentos/storage, audit log.
- Dependencias: estrategia de storage e permissao.
- Riscos: seguranca de upload e LGPD.
- Testes: tipo permitido, tamanho, exclusao, recuperacao.
- Criterio de aceite: arquivo deixa de ser mock local.
- Rollback: desabilitar upload e manter somente visualizacao.
- Impacto no Pipeline: baixo.
- Esforco: alto.

## Fase F - Proposta PDF
- Objetivo: integrar geracao de proposta com simulado e oportunidade.
- Arquivos envolvidos: frontend de simulacao, backend de propostas/documentos, storage.
- Dependencias: template aprovado e contrato de PDF.
- Riscos: duplicacao com modulo de proposals existente.
- Testes: geracao, versionamento, armazenamento, reabertura.
- Criterio de aceite: PDF persistido e rastreavel.
- Rollback: manter geracao apenas local ate o contrato oficial.
- Impacto no Pipeline: medio.
- Esforco: alto.

## Fase G - Historico e auditoria
- Objetivo: substituir timeline estatica por eventos reais.
- Arquivos envolvidos: `src/pages/Oportunidades.tsx`, `backend/src/modules/audit/*`, possivel reutilizacao de activities.
- Dependencias: definicao de quais eventos a workspace deve registrar.
- Riscos: duplicar audit log com activity.
- Testes: criacao, edicao, movimento de etapa, simulacao, anexo.
- Criterio de aceite: historico vem de fonte de verdade.
- Rollback: mostrar fallback derivado dos campos atuais.
- Impacto no Pipeline: baixo.
- Esforco: alto.

## Fase H - Testes e homologacao
- Objetivo: cobrir os fluxos criticos da workspace com testes unitarios e integracao.
- Arquivos envolvidos: suites existentes em `src/test` e `backend/src/tests`.
- Dependencias: fases A-G.
- Riscos: custo de manutencao se o contrato continuar instavel.
- Testes: clique, edicao, simulador, tags, anexos, historico, RBAC.
- Criterio de aceite: matriz de testes executada sem regressao no Pipeline.
- Rollback: congelar a workspace e manter pipeline intacto.
- Impacto no Pipeline: nenhum.
- Esforco: medio/alto.
