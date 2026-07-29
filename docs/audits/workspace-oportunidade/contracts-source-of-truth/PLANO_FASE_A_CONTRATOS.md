# Plano Fase A - Contratos

## Escopo mínimo

- preservar a entidade oficial `Opportunity`;
- preservar os contratos oficiais Fastify de CRM;
- preservar os adaptadores de compatibilidade enquanto a migração não estiver comprovada;
- reduzir dependência de estado local apenas depois de confirmar a trilha oficial de dados;
- evitar tocar em Pipeline e Kanban além do necessário para manter a estabilidade da tela.

## Sequência segura

1. Confirmar qual entidade o frontend deve renderizar como fonte principal: `Lead` projetado, `Opportunity` projetada ou DTO híbrido.
2. Definir o contrato de leitura principal da Workspace.
3. Definir o contrato de escrita principal da Workspace.
4. Criar ou consolidar mappers para `stageId`/`etapa_id` e `displayId`.
5. Reconciliar persistência local apenas onde houver necessidade real de fallback.
6. Cobrir com testes os fluxos de leitura, edição e drag and drop.

## Arquivos que provavelmente precisam de atenção futura

- `src/pages/Oportunidades.tsx`
- `src/api/client.ts`
- `src/api/dataService.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/store/index.ts`
- `backend/src/modules/crm/routes.ts`
- `backend/prisma/schema.prisma`

## Arquivos que não devem ser abertos sem necessidade

- seeds e migrations sem objetivo de contrato;
- Docker/Nginx/HML;
- runtime alternativo, salvo para manter compatibilidade documentada;
- qualquer arquivo fora do escopo da Workspace.

## Testes obrigatórios

- teste unitário do mapper de etapa;
- teste de integração do fluxo de leitura principal;
- teste do fluxo de edição;
- teste do drag and drop;
- teste de rehydrate do store, se houver persistência local mantida.

## Aceite

- o workspace lê do contrato definido como primário;
- o fallback local continua funcionando sem sobrescrever o backend;
- a exibição de etapa e identificador fica determinística;
- o Pipeline não sofre regressão.

## Rollback

- manter os adaptadores existentes até a consolidação;
- reverter apenas a camada de consumo da tela, nunca o modelo de banco nesta fase;
- evitar mudanças amplas em rotas ou persistência enquanto o fluxo não estiver fechado.
