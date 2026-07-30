# PRP-EPC-W2-CRM-CONSOLIDATION

## 1. Objetivo

Transformar os achados da auditoria [AUD-EPC-W2-CRM-CONSOLIDATION.md](/C:/Projects/FINQZ_PRO/docs/03-audits/AUD-EPC-W2-CRM-CONSOLIDATION.md) em um plano executivo de implementação para consolidar o dominio CRM do FINQZ PRO no EPC-W2.

O foco do ciclo e reduzir residuos de compatibilidade, conter o runtime local residual do Simulador, simplificar o fluxo de Opportunity/Pipeline e manter a aderencia ao DCA Mestre sem criar arquitetura paralela.

## 2. Escopo

O escopo deste PRP e estritamente derivado da auditoria:

- CRM Clientes e Leads.
- Pipeline e Opportunity.
- CRM Parceiros e Partner Acquisition.
- Simulador Enterprise.
- Reducao de superficies de compatibilidade e fallback local onde nao houver ownership canonico.
- Harmonizacao visual e operacional das fronteiras CRM.

## 3. Escopo Proibido

Nao entra neste PRP:

- Alteracao de backend fora do que for necessario para consolidacao do escopo auditado.
- Alteracao de frontend fora do fluxo CRM auditado.
- Alteracao de banco ou Prisma.
- Alteracao de APIs publicas sem necessidade de consolidacao evidenciada.
- Criacao de nova arquitetura, novo dominio ou nova fonte canonica.
- Introducao de runtime paralelo.
- Reclassificacao de endpoints legados como source of truth.

## 4. Premissas Arquiteturais

Este PRP herda integralmente as premissas do DCA Mestre e da auditoria:

- Backend First.
- Tenant Scoped.
- RBAC Driven.
- Auditavel.
- Single Source of Truth.
- No Legacy como ownership.
- No Duplicate Sources.
- No Parallel APIs.
- Contracts Before Runtime.
- No Frontend Ownership of Business Rules.

Premissas operacionais adicionais:

- O CRM core permanece canonico no backend oficial.
- O frontend atua como consumidor de contratos oficiais.
- Compatibilidade pode existir apenas como transicao controlada.
- O Simulador deve ser tratado como fronteira de consolidacao, nao como source of truth.

## 5. Dependencias

Dependencias confirmadas pela auditoria:

- `src/pages/Clientes.tsx`
- `src/pages/Oportunidades.tsx`
- `src/pages/Parceiros.tsx`
- `src/pages/PartnerAcquisitionLeads.tsx`
- `src/pages/PartnerAcquisitionProspects.tsx`
- `src/pages/Simulador.tsx`
- `src/api/modules/clientes.api.ts`
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/pipelines.api.ts`
- `src/api/modules/partner-acquisition.api.ts`
- `src/data/simulatorRepository.ts`
- `src/data/catalogRepository.ts`
- `src/data/commercialRepository.ts`
- `src/api/client.ts`
- `backend/src/modules/crm/**`
- `backend/src/modules/opportunities/**`
- `backend/src/modules/pipelines/**`
- `backend/src/modules/partner-acquisition/**`
- `backend/src/modules/permissions/**`
- `backend/src/modules/audit/**`

Dependencias de governanca:

- DCA Mestre como autoridade maxima.
- PCCD como referencia de continuidade.
- Audit W2 como base exclusiva de escopo.

## 6. Ordem de Implementacao

### W2-01 - CRM Core Hardening

Objetivo:

- Consolidar clientes, leads e fluxos essenciais do CRM como runtime canônico de referencia.

Foco:

- clientes;
- leads;
- rotas e telas de base do CRM;
- consistencia de tenant e audit trail.

### W2-02 - Pipeline / Opportunity Simplification

Objetivo:

- Reduzir heuristicas de apoio e reconciliacao desnecessaria no fluxo de oportunidade.

Foco:

- `Oportunidades.tsx`;
- `pipelines.api.ts`;
- `opportunities.api.ts`;
- normalizacao de identidade e stage/pipeline.

### W2-03 - Partner Acquisition Consolidation

Objetivo:

- Fortalecer a fronteira funcional de Partner Acquisition sem misturar com outras areas de operacao.

Foco:

- listagem e detalhe de leads/prospects;
- consistencia de RBAC;
- clareza visual e operacional de ownership.

### W2-04 - Simulator Containment

Objetivo:

- Conter o estado local do simulador e reduzir o uso de fallback como mecanismo operacional.

Foco:

- `Simulador.tsx`;
- `simulatorRepository.ts`;
- `commercialRepository.ts`;
- `catalogRepository.ts`.

### W2-05 - Compatibility Surface Reduction

Objetivo:

- Diminuir o peso de superfices de compatibilidade que nao representam ownership canonico.

Foco:

- `api/client.ts`;
- aliases e facades restantes com consumidor ativo;
- ajustese graduais em surfaces legadas ainda visiveis.

### W2-06 - Validation and Release Hardening

Objetivo:

- Garantir que a consolidacao nao quebre build, testes, RBAC, tenant scope ou auditoria.

Foco:

- build frontend;
- tests frontend;
- build backend;
- tests backend;
- validação final de navegação e fluxos CRM.

## 7. Estrategia de Rollback

Rollback deve ser sempre incremental e reversivel:

1. Reverter a frente mais recente sem tocar nas anteriores.
2. Preservar aliases e compat layers enquanto houver consumidores.
3. Manter o backend canonico intocado em caso de regressao de UX.
4. Reativar o estado anterior do simulador caso qualquer consolidacao cause perda de funcionalidade operacional.

Critérios de rollback:

- quebra de build;
- falha de teste;
- regressao em tenant scope;
- regressao em RBAC;
- perda de acesso a listas ou detalhes canonicos;
- comportamento inesperado no Simulador;
- quebra de bookmarks ou fluxo visual essencial.

## 8. Critérios de Aceite

O EPC-W2 sera aceito quando:

- CRM Clientes e Leads permanecerem prontos e estaveis.
- Pipeline e Opportunity forem consumidos sem heuristicas desnecessarias.
- Partner Acquisition estiver claramente separado como fronteira funcional.
- O Simulador reduzir dependencia de runtime local para apenas suporte transitorio ou remocao planejada.
- Nenhum P0/P1 novo for introduzido.
- Build e testes permanecerem verdes no frontend e backend.
- RBAC e tenant scope continuarem coerentes.

## 9. Riscos

| Risco | Severidade | Impacto |
| --- | --- | --- |
| Simulador continua com estado em memoria | P2 | Divergencia operacional e dificuldade de auditabilidade. |
| Ajustes no fluxo de Opportunity introduzirem regressao visual | P2 | Impacto em vendas e kanban. |
| Remocao prematura de compat layers | P2 | Quebra de bookmarks ou consumidores residuais. |
| Consolidacao de Partner Acquisition sem preservacao de RBAC | P1 | Quebra de seguranca e acesso. |
| Regressao de tenant scope em rotas oficiais | P1 | Risco real de Go-Live. |

## 10. Plano de Validacao

Validar a cada frente:

- Build do frontend.
- Testes do frontend.
- Build do backend.
- Testes do backend.
- Acesso a CRM Clientes.
- Acesso a Pipeline e Opportunity.
- Acesso a Partner Acquisition.
- Fluxo do Simulador.
- RBAC e tenant scope nos pontos alterados.
- Ausencia de regressao funcional em navegacao e breadcrumbs.

Validacao final do ciclo:

- todos os testes verdes;
- nenhuma regressao P0/P1;
- nenhuma quebra de contrato;
- nenhuma perda de ownership canonico.

## 11. Decomposicao em Frentes

### W2-01

**Nome:** CRM Core Hardening
**Prioridade:** P0 de consolidacao
**Resultado esperado:** fluxo canonico de clientes/leads sem ruido.

### W2-02

**Nome:** Pipeline / Opportunity Simplification
**Prioridade:** P0 de consolidacao
**Resultado esperado:** kanban e pipeline mais diretos, com menos heuristicas de apoio.

### W2-03

**Nome:** Partner Acquisition Consolidation
**Prioridade:** P1 de consolidacao
**Resultado esperado:** fronteira de aquisicao de parceiros clara e consistente.

### W2-04

**Nome:** Simulator Containment
**Prioridade:** P1 de consolidacao
**Resultado esperado:** simulador menos dependente de runtime local e fallback.

### W2-05

**Nome:** Compatibility Surface Reduction
**Prioridade:** P2 de consolidacao
**Resultado esperado:** menos compat layers e menos ruido de legado.

### W2-06

**Nome:** Validation and Release Hardening
**Prioridade:** P0 de fechamento
**Resultado esperado:** release segura, auditavel e pronta para decisao executiva.

## 12. Veredito Final

O EPC-W2 de CRM tem base suficiente para execucao controlada, desde que a consolidacao do Simulador e a reducao de compatibilidade sejam tratadas como restricoes obrigatorias, nao como otimizacoes opcionais.

**Veredito: GO WITH RESTRICTIONS**
