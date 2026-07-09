# IWP-EPC-W2-03 - Partner Acquisition

## 1. Objetivo

Consolidar a fronteira de Partner Acquisition como dominio funcional claro, preservando sua separacao de CRM core e de Operacoes sem alterar o runtime canonico.

## 2. Escopo permitido

- Listagem e detalhe de leads.
- Listagem e detalhe de prospects.
- Labels e navegacao do fluxo de aquisicao.
- Clareza visual de ownership e status.
- Ajustes estritamente de UX.

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
- Reclassificacao de dominio.

## 4. Arquivos candidatos

- [src/pages/PartnerAcquisitionLeads.tsx](/C:/Projects/FINQZ_PRO/src/pages/PartnerAcquisitionLeads.tsx)
- [src/pages/PartnerAcquisitionLeadDetails.tsx](/C:/Projects/FINQZ_PRO/src/pages/PartnerAcquisitionLeadDetails.tsx)
- [src/pages/PartnerAcquisitionProspects.tsx](/C:/Projects/FINQZ_PRO/src/pages/PartnerAcquisitionProspects.tsx)
- [src/pages/PartnerAcquisitionProspectDetails.tsx](/C:/Projects/FINQZ_PRO/src/pages/PartnerAcquisitionProspectDetails.tsx)
- [src/api/modules/partner-acquisition.api.ts](/C:/Projects/FINQZ_PRO/src/api/modules/partner-acquisition.api.ts)
- [src/routes/operacoes.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/operacoes.routes.tsx)
- [backend/src/modules/partner-acquisition/http/partner-acquisition.routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/partner-acquisition/http/partner-acquisition.routes.ts)
- [backend/src/modules/partner-acquisition/services/partner-acquisition.service.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/partner-acquisition/services/partner-acquisition.service.ts)

## 5. Ordem de execucao

1. Consolidar a leitura funcional de leads e prospects.
2. Clarificar a posicao visual do dominio.
3. Manter RBAC e tenant scope inalterados.
4. Garantir que Operacoes nao parece ser owner canonico do dominio.

## 6. Checklist de implementacao

- [ ] Leads e prospects estao claros para o usuario.
- [ ] O dominio nao se confunde com Opportunity.
- [ ] A jornada de aquisicao permanece auditavel.
- [ ] Labels e status estao coerentes.
- [ ] Nao ha alteracao de contrato ou rota canônica.

## 7. Checklist de validacao

- [ ] Build passa.
- [ ] Testes passam.
- [ ] Listagem e detalhe continuam acessiveis.
- [ ] RBAC continua efetivo.
- [ ] Tenant scope continua preservado.

## 8. Critérios de rollback

- Reverter apenas a camada de UX e agrupamento visual.
- Preservar endpoints oficiais e permissões.
- Manter redirecionamentos tecnicos existentes.

## 9. Riscos

- Ambiguidade entre Operacoes e CRM persistir visualmente.
- Perda de contexto em detalhes de lead/prospect.
- Mudanca de label afetar leitura de ownership.

## 10. Veredito

**PARTIAL**

