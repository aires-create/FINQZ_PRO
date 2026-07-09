# IWP-EPC-W2-06 - Validation

## 1. Objetivo

Definir a validacao final do EPC-W2 para confirmar que a consolidacao do CRM ficou coerente com o DCA, com o PRP e com os limites operacionais da auditoria.

## 2. Escopo permitido

- Validacao documental.
- Conferencia de dependencias entre IWPs.
- Revisao de riscos e rollback.
- Validacao de build, testes e estabilidade geral.

## 3. Escopo proibido

- Backend.
- Frontend.
- Banco.
- Prisma.
- APIs.
- Contratos.
- RBAC.
- Nova feature.
- Nova arquitetura.

## 4. Arquivos candidatos

- [docs/05-prp/PRP-EPC-W2-CRM-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/05-prp/PRP-EPC-W2-CRM-CONSOLIDATION.md)
- [docs/03-audits/AUD-EPC-W2-CRM-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-EPC-W2-CRM-CONSOLIDATION.md)
- [docs/02-implementation/IWP-EPC-W2-01-CRM-Core-Hardening.md](/C:/Projects/FINQZ_PRO/docs/02-implementation/IWP-EPC-W2-01-CRM-Core-Hardening.md)
- [docs/02-implementation/IWP-EPC-W2-02-Pipeline-Opportunity.md](/C:/Projects/FINQZ_PRO/docs/02-implementation/IWP-EPC-W2-02-Pipeline-Opportunity.md)
- [docs/02-implementation/IWP-EPC-W2-03-Partner-Acquisition.md](/C:/Projects/FINQZ_PRO/docs/02-implementation/IWP-EPC-W2-03-Partner-Acquisition.md)
- [docs/02-implementation/IWP-EPC-W2-04-Simulator-Containment.md](/C:/Projects/FINQZ_PRO/docs/02-implementation/IWP-EPC-W2-04-Simulator-Containment.md)
- [docs/02-implementation/IWP-EPC-W2-05-Compatibility-Reduction.md](/C:/Projects/FINQZ_PRO/docs/02-implementation/IWP-EPC-W2-05-Compatibility-Reduction.md)

## 5. Ordem de execucao

1. Confirmar que as frentes foram decompostas corretamente.
2. Confirmar dependencias entre frentes.
3. Confirmar que o escopo proibido permanece intacto.
4. Confirmar criterios de aceite, rollback e risco.

## 6. Checklist de implementacao

- [ ] Cada IWP possui objetivo claro.
- [ ] Cada IWP possui escopo permitido e proibido.
- [ ] Cada IWP possui arquivos candidatos.
- [ ] Cada IWP possui ordem de execucao.
- [ ] Cada IWP possui rollback, riscos e veredito.

## 7. Checklist de validacao

- [ ] O PRP permaneceu subordinado ao DCA e a auditoria.
- [ ] Nao ha overlap de escopo entre IWPs.
- [ ] A ordem de execucao e linear e reversivel.
- [ ] As restricoes obrigatorias estao consistentes em todos os pacotes.

## 8. Critérios de rollback

- Reverter apenas a documentacao de execucao se houver divergencia.
- Recalibrar os IWPs se o PRP mudar.
- Nao alterar codigo em nenhum cenário desta etapa.

## 9. Riscos

- Uma decomposicao ruim pode induzir implementacao fora de ordem.
- Dependencias escondidas podem aparecer durante a execucao.
- Consolidacao do Simulador exige disciplina para nao ampliar escopo.

## 10. Veredito

**READY**

