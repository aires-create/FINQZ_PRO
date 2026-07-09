# IWP-EPC-W2-01 - CRM Core Hardening

## 1. Objetivo

Consolidar o nucleo de CRM Clientes e Leads como base canonica do EPC-W2, reduzindo ruido de compatibilidade e mantendo o tenant scope, o RBAC e a auditoria como pilares inalterados.

## 2. Escopo permitido

- CRM Clientes.
- CRM Leads.
- Rotas, telas e apresentacao do nucleo CRM.
- Ajustes de UX estritamente ligados a consistencia do dominio.
- Harmonizacao visual sem alterar contratos.

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
- Nova arquitetura.

## 4. Arquivos candidatos

- [src/pages/Clientes.tsx](/C:/Projects/FINQZ_PRO/src/pages/Clientes.tsx)
- [src/routes/crm.routes.tsx](/C:/Projects/FINQZ_PRO/src/routes/crm.routes.tsx)
- [src/api/modules/clientes.api.ts](/C:/Projects/FINQZ_PRO/src/api/modules/clientes.api.ts)
- [backend/src/modules/crm/routes.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/routes.ts)
- [backend/src/modules/crm/services/customers.service.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/services/customers.service.ts)
- [backend/src/modules/crm/services/leads.service.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/services/leads.service.ts)
- [backend/src/modules/crm/repositories/customers.repository.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/repositories/customers.repository.ts)
- [backend/src/modules/crm/repositories/leads.repository.ts](/C:/Projects/FINQZ_PRO/backend/src/modules/crm/repositories/leads.repository.ts)

## 5. Ordem de execucao

1. Revisar o fluxo de clientes e leads como base de domínio.
2. Confirmar que as rotas de CRM permanecem canônicas.
3. Garantir que a experiencia de tela nao introduz ruido de legado.
4. Validar consistencia visual de contexto e navegacao.

## 6. Checklist de implementacao

- [ ] Clientes permanece como entrada principal do CRM.
- [ ] Leads permanece sob o mesmo bloco canonico.
- [ ] Rotas canonicas nao sao alteradas.
- [ ] Nao ha duplicidade visual de criacao/listagem.
- [ ] Tenant scope e RBAC continuam implícitos no backend oficial.

## 7. Checklist de validacao

- [ ] Build nao quebra.
- [ ] Testes nao quebram.
- [ ] Acesso a Clientes continua funcional.
- [ ] Acesso a Leads continua funcional.
- [ ] Nenhum alias necessario foi removido por engano.

## 8. Critérios de rollback

- Reverter alteracoes apenas no frontend deste bloco.
- Preservar rotas e contratos oficiais.
- Manter backend e permissões intactos.

## 9. Riscos

- Regressao visual na entrada principal do CRM.
- Confusao entre listas canonicas e superficies de apoio.
- Ruido de navegacao se labels ficarem inconsistentes.

## 10. Veredito

**READY**

