# IWP-W0-02 - Simulator Release 1 Stabilization

## 1. Objetivo

Estabilizar o Simulador para Release 1.0, garantindo que calcular, aceitar/recusar e gerar proposta sejam fluxos claros, rápidos e confiáveis dentro da Opportunity.

## 2. Escopo permitido

- Fluxo do Simulador dentro da Opportunity.
- Clareza de entrada, calculo e resultado.
- Fluxo de aceite e recusa da simulacao.
- Geração de proposta.
- Reducao de ambiguidade comercial.
- Ajustes de UX e leitura de status.
- Refinamento de mensagens e ordem de acao.

## 3. Escopo proibido

- Commercial Recommendation Engine.
- Decision Engine.
- IA.
- Novo ranking comercial avançado.
- Backend.
- APIs.
- Contratos.
- Banco.
- Prisma.
- RBAC.
- Nova arquitetura.

## 4. Arquivos candidatos

- [src/pages/Simulador.tsx](/C:/Projects/FINQZ_PRO/src/pages/Simulador.tsx)
- [src/pages/Oportunidades.tsx](/C:/Projects/FINQZ_PRO/src/pages/Oportunidades.tsx)
- [src/data/simulatorRepository.ts](/C:/Projects/FINQZ_PRO/src/data/simulatorRepository.ts)
- [src/data/commercialRepository.ts](/C:/Projects/FINQZ_PRO/src/data/commercialRepository.ts)
- [src/data/catalogRepository.ts](/C:/Projects/FINQZ_PRO/src/data/catalogRepository.ts)

## 5. Ordem de execução

1. Confirmar o fluxo atual de calcular.
2. Simplificar a leitura do resultado.
3. Tornar o aceite e a recusa inequívocos.
4. Tornar a geração de proposta o próximo passo natural.
5. Garantir que a experiência continue estável e previsível.

## 6. Checklist de implementação

- [ ] O usuário entende como iniciar a simulação.
- [ ] O usuário entende o que foi calculado.
- [ ] O aceite e a recusa da simulação estão claros.
- [ ] A geração de proposta é direta e compreensível.
- [ ] O resultado comercial é legível sem interpretação excessiva.
- [ ] O Simulador não parece uma tela concorrente da Opportunity.
- [ ] O fluxo não exige repetição desnecessária de dados.

## 7. Checklist de validação

- [ ] Simulador abre e calcula corretamente.
- [ ] Aceitar simulação funciona de forma compreensível.
- [ ] Recusar simulação funciona de forma compreensível.
- [ ] Gerar proposta não quebra o fluxo.
- [ ] O usuário não se perde entre resultado e ação final.
- [ ] Não há regressão funcional de estabilidade.
- [ ] Não há regressão na navegação Opportunity -> Simulador -> Proposta.

## 8. Critérios de rollback

- Reverter ajustes de leitura e fluxo se houver confusão operacional.
- Preservar a capacidade de cálculo já existente.
- Preservar a Opportunity como centro do fluxo.

## 9. Riscos

- Simplificar demais e perder informação comercial útil.
- Manter excesso de campos e continuar pesado para produção.
- Gerar proposta sem clareza de status ou próxima ação.

## 10. Veredito

**PARTIAL**
