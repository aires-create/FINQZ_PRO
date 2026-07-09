# IWP-EPC-W1-06 - Validation

## 1. Objetivo

Definir a validação final da consolidação de navegação para garantir que o EPC-W1 entrou em estado estável, reversível e coerente com o DCA.

## 2. Escopo permitido

- Validação manual e documental.
- Revisão de menu, breadcrumbs, rotas e consistência visual.
- Conferência de compatibilidade com o PRP.
- Conferência de risco residual.

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

## 4. Arquivos candidatos

- [docs/05-prp/PRP-EPC-W1-ENTERPRISE-NAVIGATION-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/05-prp/PRP-EPC-W1-ENTERPRISE-NAVIGATION-CONSOLIDATION.md)
- [docs/04-crm/AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-CRM-NAVIGATION-BLUEPRINT-GOLIVE.md)
- [docs/04-crm/AUD-CRM-ENTERPRISE-GOLIVE-READINESS.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-CRM-ENTERPRISE-GOLIVE-READINESS.md)
- [docs/04-crm/AUD-DOCS-NAVIGATION-CAPABILITY-READINESS.md](/C:/Projects/FINQZ_PRO/docs/04-crm/AUD-DOCS-NAVIGATION-CAPABILITY-READINESS.md)

## 5. Ordem de execução

1. Validar o mapa final de menu.
2. Validar breadcrumbs e títulos.
3. Validar rotas canônicas e redirects.
4. Validar que LEGACY e FUTURE estão corretamente sinalizados.
5. Fechar o parecer de pronto para implementação.

## 6. Checklist de implementação

- [ ] O PRP está completamente decomposto em IWPs.
- [ ] Cada IWP possui escopo permitido e proibido.
- [ ] Cada IWP possui arquivos candidatos.
- [ ] Cada IWP possui rollback e risco.
- [ ] Cada IWP possui veredito.

## 7. Checklist de validação

- [ ] O PRP EPC-W1 continua subordinado ao DCA.
- [ ] Não existe proposta de arquitetura paralela.
- [ ] Não existe alteração de backend, API, contrato ou RBAC.
- [ ] As dependências entre IWPs estão claras.
- [ ] O pacote pode ser executado em sequência sem ambiguidade.

## 8. Critérios de rollback

- Reverter apenas a documentação de execução caso haja inconsistência.
- Reabrir decomposição se o PRP mudar.
- Não alterar código em nenhum cenário desta etapa.

## 9. Riscos

- Se a validação for fraca, o time pode implementar menu antes de entender as dependências.
- Se um IWP estiver mal classificado, a execução pode ficar desalinhada.
- Se o PRP mudar, os IWPs precisam ser recalibrados.

## 10. Veredito final

**READY**

