# Mapa de Entidades da Oportunidade

| Entidade | Localização | Camada | Status | Relação com Workspace | Fonte de verdade |
|---|---|---|---|---|---|
| Lead | `backend/src/modules/crm/routes.ts`, `backend/prisma/schema.prisma` | backend enterprise | oficial | alimenta a Workspace e o CRM | backend / banco |
| Customer | `backend/src/modules/crm/routes.ts`, Prisma | backend enterprise | oficial | aparece em detalhe, cliente e timeline | backend / banco |
| Opportunity | `backend/prisma/schema.prisma:474-521` | domínio backend | oficial | base conceitual da Workspace | banco / backend |
| Deal | docs e linguagem de negócio | conceitual | desconhecido | sinônimo funcional em alguns trechos | derivado/documentação |
| Pipeline | Prisma e store local | híbrida | oficial + ativa | organiza a coluna e o contexto da tela | banco + store |
| Stage | Prisma e labels locais | híbrida | oficial + ativa | define a etapa exibida e a movimentação | banco + catalog/mapper |
| Activity | Prisma | backend enterprise | oficial | sustenta timeline, notas e ações | banco / backend |
| Simulation | `src/pages/Simulador.tsx`, `src/data/simulatorRepository.ts` | frontend | parcial | ferramenta adjacente ao workspace | localStorage + UI |
| Proposal | runtime alternativo e módulos de proposta | híbrida | parcial | apoia a conversão/simulação | banco + runtime alternativo |
| BankProposal | Prisma | backend enterprise | oficial | proposta bancária relacionada à oportunidade | banco / backend |
| AuditLog | docs, audit routes, eventos | backend enterprise | oficial | histórico e rastreabilidade | banco / backend |
| PartnerAcquisitionLead | `backend/src/modules/partner-acquisition/*` | backend enterprise | ativo | adjacência comercial, não eixo principal da tela | backend / banco |
| PartnerAcquisitionProspect | `backend/src/modules/partner-acquisition/*` | backend enterprise | ativo | adjacência comercial e de aquisição | backend / banco |

## Leituras importantes

- `Lead` e `Customer` são as entidades mais claramente expostas no Fastify oficial.
- `Opportunity` é uma entidade oficial de domínio e autorização, ainda que a tela use contratos compatíveis e runtime alternativo.
- `Deal` não apareceu como entidade de banco comprovada nesta auditoria; por ora permanece como termo de negócio, não como contrato confirmado.
- `Pipeline` e `Stage` aparecem tanto em banco quanto em estado local da UI, o que exige cuidado ao usar o label amigável.
