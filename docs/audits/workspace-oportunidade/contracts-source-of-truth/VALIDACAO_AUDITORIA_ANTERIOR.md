# Validação da Auditoria Anterior

| Conclusão anterior | Nova evidência | Classificação | Observação |
|---|---|---|---|
| A Workspace usa `src/pages/Oportunidades.tsx` | confirmado por roteamento e por chamadas internas | confirmada | a tela continua sendo o hub central |
| O clique no card abre modal fullscreen | `handleOpenLead` e `showFullscreenModal` em `src/pages/Oportunidades.tsx` | confirmada | o fluxo ainda é o principal ponto de detalhe |
| A etapa pode ser exibida por `etapa_id` | `selectedLead?.etapa_id ?? selectedLead?.etapa` no header | confirmada | a UI trata `etapa_id` e `etapa` como equivalentes de apresentação |
| Existem referências a `/api/oportunidades` | `src/api/client.ts`, `src/api/modules/oportunidades.api.ts`, `src/api/dataService.ts` | confirmada | o contrato continua consumido |
| O backend Fastify registra `/api/v1/crm/*` | `backend/src/core/http/fastify.ts` e `backend/src/modules/crm/routes.ts` | confirmada | esse é o contrato oficial de CRM exposto no bootstrap |
| Parte dos dados pode estar no Zustand persistido | `finqz-pro-storage` com `oportunidadesKanban` | confirmada | não é apenas estado efêmero |
| Tags podem estar em catálogo local | presença de catálogo/labels locais no frontend | parcialmente confirmada | a origem exata precisa de validação específica por arquivo de catálogo |
| Anexos e histórico podem estar em estado local | a UI mantém seções sem prova completa de backend enterprise | parcialmente confirmada | há UI, mas a persistência oficial não foi comprovada por esta auditoria |
| O simulador pode estar parcialmente desconectado | `src/data/simulatorRepository.ts` persiste em localStorage | confirmada | o simulador standalone é local-first |
| Não foi confirmado contrato oficial de Opportunity com outro nome | Prisma, seed e middleware enterprise agora comprovam a entidade | refutada | o contrato oficial existe, ainda que o consumer final use camadas compatíveis |
