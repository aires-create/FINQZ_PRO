# IWP-W0-03 - Go-Live Validation

## 1. Objetivo

Definir a validação final de Go-Live para confirmar que o fluxo Kanban -> Opportunity -> Simulador -> Proposta está estável, compreensível e pronto para produção com restrições.

## 2. Escopo permitido

- Validação documental.
- Validação de build.
- Validação de testes.
- Smoke test do fluxo comercial.
- Conferência de retorno do simulador.
- Conferência da geração de proposta.
- Revisão dos critérios mínimos de Go-Live.

## 3. Escopo proibido

- Backend.
- Frontend fora da validação.
- Banco.
- Prisma.
- APIs.
- Contratos.
- RBAC.
- Nova feature.
- Nova arquitetura.

## 4. Arquivos candidatos

- [docs/03-audits/AUD-W0-PRODUCTION-READINESS-PIPELINE-OPPORTUNITY-SIMULATOR.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-W0-PRODUCTION-READINESS-PIPELINE-OPPORTUNITY-SIMULATOR.md)
- [docs/01-architecture/EUX-ENTERPRISE-DESIGN-PRINCIPLES.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/EUX-ENTERPRISE-DESIGN-PRINCIPLES.md)
- [docs/01-architecture/OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md](/C:/Projects/FINQZ_PRO/docs/01-architecture/OWB-OPPORTUNITY-WORKSPACE-BLUEPRINT.md)
- [docs/05-prp/PRP-EWT-ENTERPRISE-WORKSPACE-TRANSFORMATION.md](/C:/Projects/FINQZ_PRO/docs/05-prp/PRP-EWT-ENTERPRISE-WORKSPACE-TRANSFORMATION.md)
- [src/pages/Oportunidades.tsx](/C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/pages/Simulador.tsx](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)

## 5. Ordem de execução

1. Confirmar o escopo final liberado para Release 1.0.
2. Validar build e testes.
3. Executar smoke test do Kanban -> Opportunity.
4. Executar smoke test da Opportunity -> Simulador.
5. Executar smoke test da Proposta.
6. Consolidar riscos residuais.

## 6. Checklist de implementação

- [ ] Kanban atual segue funcional.
- [ ] Opportunity abre corretamente após clique no card.
- [ ] Simulador calcula e retorna resultado.
- [ ] Aceite/recusa do Simulador está compreensível.
- [ ] Geração de proposta ocorre no fluxo esperado.
- [ ] A experiência não exige arquitetura nova.
- [ ] A Release 1.0 permanece sem escopo expandido.

## 7. Checklist de validação

- [ ] Build passa.
- [ ] Testes passam.
- [ ] Smoke test do fluxo principal passa.
- [ ] Não há regressão na abertura do card.
- [ ] Não há regressão no simulador.
- [ ] Não há regressão na geração de proposta.
- [ ] Os critérios mínimos de Go-Live são atendidos.

## 8. Critérios de rollback

- Reverter apenas a validação documental se houver divergência de escopo.
- Bloquear Go-Live se algum critério mínimo falhar.
- Manter a Release 1.0 restrita se o fluxo não estiver claro o suficiente.

## 9. Riscos

- Validar sem cobertura suficiente de fluxo real.
- Aprovar Go-Live com ambiguidade residual no Simulador.
- Confundir estabilidade técnica com clareza operacional.

## 10. Veredito

**READY**
