# BLOCO C - CONSISTÊNCIA E SINCRONIZAÇÃO ENTRE WORKSPACE E PIPELINE

## 1. Contexto

Bloco proposto após conclusão do Bloco B (Regressão funcional do card). Objetivo primário: garantir consistência entre os campos canônicos exibidos no Workspace (`src/pages/Oportunidades.tsx`) e a fonte oficial da Pipeline/backend, evitando divergência de estado, perda de atualização ou discrepância de valores exibidos no card.

## 2. Problema

- Campos derivados (stageLabel, valor, cliente) podem divergir entre origem oficial e estado local/híbrido.
- Atualizações realizadas no Workspace podem não refletir corretamente na Pipeline após refresh.

## 3. Evidências

- Auditoria e testes do Bloco B: commit `3710a21...` (normalização de `stageLabel`).
- Cobertura: testes funcionais e hardening novos implementados.

## 4. SSOT aplicável

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/audits/workspace-oportunidade/contracts-source-of-truth/MATRIZ_FONTE_VERDADE_WORKSPACE.md`

## 5. Escopo

Inclui:
- Canonização dos campos canônicos exibidos no card (`stageLabel`, `amount/valor`, `customer`)
- Fluxo de atualização: Workspace -> backend (API) -> Pipeline -> reconciliação no frontend
- Mecanismo de sincronização incremental e refetch após mutações

Fora do escopo:
- Mudanças de backend, migrations ou Prisma (serão avaliadas, não implementadas)

## 6. Arquivos prováveis a analisar

- `src/pages/Oportunidades.tsx`
- `src/components/pipeline/*`
- `src/api/modules/opportunities.api.ts`
- `src/store` (Zustand) e híbrid adapters

## 7. Dependências

- API de `opportunities` (contrato oficial)
- RBAC e tenant (validação de escopo)
- Normalizador oficial (`normalizeOpportunityWorkspace`)

## 8. Riscos

- Regressão da UX se sincronização for mal aplicada
- Inconsistência temporária entre card e lista após refetch

## 9. Critérios de aceite

- Testes de integração que simulam atualização de oportunidade resultam em valor atualizado no card e persistência no backend
- Zero regressões nos testes de Bloco B

## 10. Estratégia de testes

- Unitários para normalizador e helpers de merge
- Testes de integração para fluxo de atualização (mock API)
- Testes E2E/UI para validação de refresh e reabertura de card

## 11. Estratégia de rollback

- Reverter alterações no frontend para a versão anterior do normalizador e flow; não tocar banco.

## 12. Ordem de execução (sugerida)

1. Auditoria e inventário de campos canônicos
2. Implementar adaptador de reconciliação (apenas design/documentação nessa fase)
3. Testes unitários e de integração (mock)
4. Plano de rollout incremental

## 13. Condição de interrupção

- Divergências de SSOT não resolvidas
- Dependências de backend não aprovadas
