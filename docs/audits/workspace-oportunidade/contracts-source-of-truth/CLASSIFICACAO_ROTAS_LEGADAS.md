# Classificação de Rotas e Adaptadores da Workspace

| Rota | Localização | Chamada | Registro | Proxy/Fallback | Teste | Status | Recomendação |
|---|---|---|---|---|---|---|---|
| `/api/v1/crm/leads` | Fastify CRM | frontend CRM | registrada | n/a | deve ser coberta por CRM | ativa oficial | preservar |
| `/api/v1/crm/clientes` | Fastify CRM | frontend CRM | registrada | n/a | deve ser coberta por CRM | ativa oficial | preservar |
| `/api/v1/crm/leads/:id/timeline` | Fastify CRM | timeline do workspace/CRM | registrada | n/a | deve ser coberta por CRM | ativa oficial | preservar |
| `/api/oportunidades` | `src/api/client.ts`, `src/api/modules/oportunidades.api.ts` | dataService, compat wrapper | não registrada no Fastify oficial | runtime alternativo responde | parcial | compatibilidade ativa | consolidar |
| `/api/oportunidades/pipeline` | wrappers de oportunidade | workspace e adapters | não registrada no Fastify oficial | runtime alternativo responde | parcial | compatibilidade ativa | consolidar |
| `/api/oportunidades/:id` | wrappers de oportunidade | workspace e adapters | não registrada no Fastify oficial | runtime alternativo responde | parcial | compatibilidade ativa | consolidar |
| `/api/opportunidades/:id/mover` | wrapper de movimento | módulo legado/compat | não comprovada no bootstrap oficial | possível alias | não comprovado | não comprovado | investigar |
| `/api/sdr/opportunity` | runtime alternativo | SDR panel e automação | registrada em runtime alternativo | n/a | não comprovado no Fastify oficial | ativa em runtime alternativo | preservar com cautela |
| `/api/v1/audit/*` | Fastify oficial | audit UI e rastreio | registrada | n/a | deve ser coberta por audit | ativa oficial | preservar |
| `finqz-pro-storage` | Zustand persist | workspace | n/a | persist local | testes de UI | ativa local | conter |

## Observações

- Não há evidência, nesta auditoria, de um módulo Fastify oficial dedicado a `/api/oportunidades`.
- As rotas de oportunidade aparecem fortemente no runtime alternativo e em adaptadores frontend.
- A ausência de registro no bootstrap oficial não é suficiente para declarar uma rota inexistente; por isso a classificação usa “compatibilidade ativa” em vez de remover o contrato do mapa.
