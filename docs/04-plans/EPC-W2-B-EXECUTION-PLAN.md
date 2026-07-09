# EPC-W2-B Execution Plan

Baseado em: [docs/03-audits/EPC-W2-AUDIT.md](../03-audits/EPC-W2-AUDIT.md)

## Objetivo

Transformar a auditoria EPC-W2 em uma sequencia tecnica objetiva para eliminar, de forma segura e controlada:

- runtime legacy;
- APIs duplicadas;
- repositories em memoria como fonte operacional;
- dominio indevido no store;
- duplicidade de simulacao e ranking entre frontend e backend.

Este plano preserva:
- Backend First;
- Tenant Scoped;
- RBAC Driven;
- Contract First;
- Auditavel;
- No Legacy;
- No Duplicate Source.

Nao altera codigo, nao remove legado e nao cria novas APIs enquanto houver contrato oficial existente.

---

## Diretrizes de Execucao

1. Nenhuma remocao sem mapeamento de consumidores.
2. Nenhuma migracao sem contrato oficial confirmado.
3. Nenhuma troca de fonte sem validacao equivalente no backend.
4. Nenhuma dependencia nova sobre modulos legacy.
5. Toda fase deve manter build e testes verdes.
6. Toda migracao deve preservar comportamento funcional.

---

## Priorizacao Geral

- **P0**: risco arquitetural imediato, fonte paralela de verdade, drift funcional, runtime legacy.
- **P1**: consolidação de ownership e reducao de dominio no frontend.
- **P2**: limpeza de compatibilidade, isolamento do legado e acabamento arquitetural.

---

## P0 - Critico

### A1. Quarentenar runtime legacy `backend/server`

**Objetivo**
- Impedir que a runtime EdgeSpark continue sendo tratada como superficie operacional ativa.
- Manter apenas em modo de quarentena documental e de compatibilidade, ate decisão de desligamento.

**Arquivos impactados**
- `backend/server/package.json`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/*` relacionados a routes oficiais

**Risco**
- Alto. Ha risco de quebrar fluxos legados que ainda dependem dessa runtime.

**Pre-condicoes**
- Mapa completo de consumidores da runtime legacy.
- Confirmacao de quais rotas ja existem no backend oficial Fastify.
- Validacao de que nenhuma feature critica depende exclusivamente de `backend/server`.

**Passos tecnicos**
1. Catalogar todos os pontos que ainda chamam a runtime legacy.
2. Marcar a runtime como quarentenada em documentacao e guia de operacao.
3. Garantir que a superficie oficial Fastify seja a primeira opcao em qualquer consumo novo.
4. Registrar a runtime legacy como dependencia a remover em fase posterior.

**Validacoes obrigatorias**
- `npm run build` no frontend.
- `npm run test` no frontend.
- `npm run build` no backend.
- `npm run test` no backend.
- validacao de rotas oficiais equivalentes.

**Criterio de pronto**
- runtime legacy documentada como quarentenada;
- nenhum consumo novo aponta para `backend/server`;
- superficie oficial esta claramente definida.

---

### A2. Padronizar `opportunities` em contrato oficial

**Objetivo**
- Consolidar oportunidades no contrato oficial `/api/v1/opportunities`.
- Reduzir a dependencia do modulo legacy `oportunidades.api.ts`.

**Arquivos impactados**
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/index.ts`
- `src/api/client.ts`
- `src/pages/SdrIaHub.tsx`
- `src/pages/Oportunidades.tsx`

**Risco**
- Alto. Consumidores ainda podem depender do contrato antigo e de payloads legados.

**Pre-condicoes**
- Confirmar existencia e cobertura do contrato oficial.
- Listar todos os consumers do modulo legado.
- Garantir equivalencia funcional dos endpoints oficiais.

**Passos tecnicos**
1. Mapear todos os imports de `oportunidades.api.ts`.
2. Classificar consumidores por criticidade.
3. Atualizar consumidores para `opportunities.api.ts` quando o contrato oficial cobrir o caso.
4. Manter o legacy apenas como compatibilidade transitória ate a migracao final.
5. Documentar qualquer payload que ainda nao tenha equivalente oficial.

**Validacoes obrigatorias**
- build/test frontend.
- validacao manual dos fluxos que usam oportunidades.
- verificacao de que `src/api/client.ts` nao introduz novo consumo do legacy.

**Criterio de pronto**
- consumidores principais migrados para o contrato oficial;
- legacy identificado e sem novos usos;
- comportamento preservado.

---

### A3. Padronizar `partners` em contrato oficial

**Objetivo**
- Consolidar parceiros em `/api/v1/partners`.
- Reduzir a dependencia de `parceiros.api.ts`.

**Arquivos impactados**
- `src/api/modules/partners.api.ts`
- `src/api/modules/parceiros.api.ts`
- `src/api/modules/index.ts`
- `src/api/client.ts`
- telas que consomem parceiros

**Risco**
- Alto. Ha formatacao e naming legacy em portugues com possivel dependencia de telas antigas.

**Pre-condicoes**
- Confirmar contrato oficial equivalente.
- Mapear consumidores reais do legacy.

**Passos tecnicos**
1. Listar os consumidores do modulo legacy.
2. Migrar para `partners.api.ts` quando o contrato oficial suprir o caso.
3. Evitar criar novo contrato enquanto o oficial existir.
4. Registrar pontos sem equivalencia para fase posterior.

**Validacoes obrigatorias**
- build/test frontend.
- smoke funcional das telas de parceiros.

**Criterio de pronto**
- uso principal migrado para API oficial;
- legacy mantido apenas como compatibilidade ate o corte.

---

### A4. Definir owner unico para simulacao/ranking/proposta

**Objetivo**
- Eliminar duplicidade de regra comercial entre frontend e backend.
- Tornar o backend a fonte oficial de ranking, recomendacao e proposta.

**Arquivos impactados**
- `src/pages/Simulador.tsx`
- `src/data/simulatorRepository.ts`
- `src/data/commercialRepository.ts`
- `backend/src/modules/simulation/*`
- `backend/src/modules/edp/*`
- `backend/src/modules/proposals/*`

**Risco**
- Critico. E a area com maior chance de divergir em regra comercial e gerar proposta inconsistente.

**Pre-condicoes**
- Confirmacao de que o dominio de simulation/recommendation esta modelado no backend oficial.
- Mapear se o frontend so consome ou ainda calcula.
- Confirmar contrato oficial para exposicao da simulacao, se existir.

**Passos tecnicos**
1. Mapear todas as funcoes de calculo/ranqueamento no frontend.
2. Definir qual parte permanece como adaptacao de UI e qual parte vai para backend.
3. Consolidar a regra de ranking no backend oficial.
4. Manter o frontend apenas como consumidor do resultado oficial.
5. Registrar a dependencia de propostas e aceites em um unico fluxo.

**Validacoes obrigatorias**
- comparacao de resultados entre o fluxo atual e o fluxo oficial;
- build/test frontend e backend;
- smoke da geracao de proposta.

**Criterio de pronto**
- uma unica fonte de verdade para ranking/proposta;
- frontend sem regra comercial paralela critica.

---

## P1 - Alto

### B1. Reduzir `src/store/index.ts` para UI/session state

**Objetivo**
- Separar estado de interface/autenticacao de dominio operacional.
- Remover ownership indevido de clientes, produtos, pipelines e oportunidades do store.

**Arquivos impactados**
- `src/store/index.ts`
- `src/auth/AuthProvider.tsx`
- `src/layouts/MainLayout.tsx`
- `src/pages/*` que usam o store para dominio

**Risco**
- Alto, pois o store e usado amplamente por telas legadas.

**Pre-condicoes**
- Inventario de quais campos do store sao realmente UI/session.
- Mapa de uso por pagina.

**Passos tecnicos**
1. Classificar campos do store em:
   - UI/session;
   - preferencia visual;
   - dominio indevido.
2. Congelar o que e dominio indevido para migracao posterior.
3. Planejar a retirada gradual por consumers.
4. Evitar quebrar telas durante a transicao.

**Validacoes obrigatorias**
- build/test frontend.
- validação das telas que dependem de `useAppStore`.

**Criterio de pronto**
- store reduzido a papéis de interface/sessao;
- dominio operacional sai do cliente.

---

### B2. Remover uso operacional de `commercialRepository` e `simulatorRepository`

**Objetivo**
- Eliminar repositorios em memoria como fonte operacional.
- Preservar apenas como adaptadores transitórios, se indispensavel.

**Arquivos impactados**
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`

**Risco**
- Alto, pois o simulador e tabelas comerciais dependem diretamente dessas estruturas.

**Pre-condicoes**
- Confirmação do contrato oficial a usar como substituto.
- Lista dos consumidores por tela e por funcao.

**Passos tecnicos**
1. Mapear o que cada repository fornece hoje.
2. Separar leitura temporaria de ownership funcional.
3. Substituir gradualmente pela superficie oficial do backend.
4. Manter fallback apenas enquanto houver necessidade documentada.

**Validacoes obrigatorias**
- consistencia de dados entre fonte antiga e nova;
- build/test frontend;
- smoke dos fluxos comerciais.

**Criterio de pronto**
- repository em memoria sem papel operacional principal;
- fonte oficial claramente definida.

---

### B3. Migrar consumidores legacy de `oportunidades.api.ts` e `parceiros.api.ts`

**Objetivo**
- Encerrar dependencia dos wrappers antigos apos a migracao dos fluxos suportados.

**Arquivos impactados**
- `src/api/client.ts`
- `src/pages/SdrIaHub.tsx`
- demais telas que ainda importam os modulos legados

**Risco**
- Medio/alto.

**Pre-condicoes**
- A2 e A3 concluida ou em estado estavel.
- monitoramento de imports residuais.

**Passos tecnicos**
1. Migrar consumidores remanescentes.
2. Revisar `src/api/client.ts` para nao reintroduzir legado.
3. Deixar os módulos antigos sem novos consumidores.

**Validacoes obrigatorias**
- build/test frontend;
- verificacao de imports residuais.

**Criterio de pronto**
- todos os consumidores conhecidos migrados;
- legado sem uso funcional ativo.

---

## P2 - Medio

### C1. Quarentenar e documentar `backend/server` como legado congelado

**Objetivo**
- Formalizar a runtime antiga como compatibilidade restrita.

**Arquivos impactados**
- `backend/server/package.json`
- `backend/server/src/index.ts`
- `backend/server/src/defs/index.ts`
- documentação de arquitetura e depreciação

**Risco**
- Medio.

**Pre-condicoes**
- P0 validado.

**Passos tecnicos**
1. Registrar a runtime como legado congelado.
2. Evitar novos consumos.
3. Preparar plano futuro de remoção.

**Validacoes obrigatorias**
- ausencia de novos imports;
- ausencia de rotas novas no legado.

**Criterio de pronto**
- runtime legacy isolada e sem evolucao.

---

### C2. Formalizar o HUB como preview ate virar produto completo

**Objetivo**
- Evitar que placeholders sejam confundidos com produto final.

**Arquivos impactados**
- `src/routes/hub.routes.tsx`
- `src/pages/Placeholders.tsx`

**Risco**
- Medio.

**Pre-condicoes**
- alinhamento com produto sobre o status das paginas.

**Passos tecnicos**
1. Classificar cada rota do HUB.
2. Manter placeholders explicitamente como preview.
3. Planejar implementacao real apenas quando houver contrato.

**Validacoes obrigatorias**
- verificacao visual das rotas do HUB;
- confirmacao de labels/estado.

**Criterio de pronto**
- nenhum placeholder tratado como funcionalidade pronta.

---

### C3. Reduzir compatibilidade excessiva em `src/api/client.ts`

**Objetivo**
- Fazer o client favorecer contratos oficiais.

**Arquivos impactados**
- `src/api/client.ts`
- `src/api/modules/index.ts`

**Risco**
- Medio.

**Pre-condicoes**
- A2, A3 e B3 em progresso.

**Passos tecnicos**
1. Priorizar wrappers oficiais.
2. Evitar imports de legacy no caminho principal.
3. Manter compatibilidade apenas onde o contrato oficial ainda nao cobrir.

**Validacoes obrigatorias**
- build/test frontend.
- verificacao dos consumidores principais.

**Criterio de pronto**
- client orientado ao contrato oficial e nao ao legacy.

---

## Mapa de Arquivos Impactados

### Frontend
- `src/api/client.ts`
- `src/api/modules/index.ts`
- `src/api/modules/opportunities.api.ts`
- `src/api/modules/oportunidades.api.ts`
- `src/api/modules/partners.api.ts`
- `src/api/modules/parceiros.api.ts`
- `src/data/commercialRepository.ts`
- `src/data/simulatorRepository.ts`
- `src/pages/Simulador.tsx`
- `src/pages/TabelasComerciais.tsx`
- `src/pages/SdrIaHub.tsx`
- `src/store/index.ts`
- `src/routes/hub.routes.tsx`
- `src/pages/Placeholders.tsx`

### Backend
- `backend/src/core/http/fastify.ts`
- `backend/src/modules/simulation/*`
- `backend/src/modules/edp/*`
- `backend/src/modules/proposals/*`
- `backend/src/modules/commercial/*`
- `backend/server/*`

### Dados e contratos
- `backend/prisma/schema.prisma`
- contratos de API oficiais existentes em `backend/src/modules/*`

---

## Lista de Imports Legacy

Consumidores e pontos de entrada legados mapeados no codigo:

- `src/api/client.ts`
  - importa `oportunidadesApi` de `./modules/oportunidades.api`
  - importa `partnersApi` de `./modules/partners.api`

- `src/pages/SdrIaHub.tsx`
  - importa `oportunidadesApi` de `../api/modules/oportunidades.api`

- `src/pages/Simulador.tsx`
  - importa `simulatorRepository`
  - importa `commercialRepository`

- `src/pages/TabelasComerciais.tsx`
  - importa `commercialRepository`

- `src/store/index.ts`
  - concentra estado de dominio que continua sendo consumido por diversas paginas

---

## Plano de Depreciacao

### Etapa 1
- Quarentenar runtime legacy.
- Congelar novos consumers dos wrappers legados.

### Etapa 2
- Migrar consumidores do client para APIs oficiais.
- Reduzir dominio do store.

### Etapa 3
- Remover papel operacional de repositories em memoria.
- Consolidar simulacao/ranking/proposta no backend oficial.

### Etapa 4
- Desligar `backend/server` somente apos validacao completa de ausencia de consumidores.

---

## Riscos

- remover cedo demais quebra rotas legadas;
- manter por muito tempo aumenta drift e custo de manutencao;
- simulacao/ranking duplicados podem gerar proposta diferente dependendo da tela;
- store com dominio pode mascarar bugs de integracao.

---

## Checklist de Validacao

Antes de qualquer item virar implementação:
- confirmar contrato oficial equivalente;
- mapear consumidores;
- validar build/testes frontend;
- validar build/testes backend;
- smoke dos fluxos comerciais;
- comparar resultados de simulação/proposta entre estados antigo e novo;
- confirmar tenant e RBAC em qualquer superficie oficial usada.

---

## Criterio de Pronto para EPC-W2-C

O EPC-W2-C pode iniciar implementacao quando:
- o escopo P0 estiver aprovado por arquitetura;
- os consumidores legacy estiverem mapeados;
- houver contrato oficial confirmado para cada migracao;
- a estratégia de rollback estiver descrita;
- build e testes seguirem verdes.

---

## Veredito

**GO WITH RESTRICTIONS**

Motivo:
- ha caminho seguro de migracao;
- nao e recomendavel remover legacy sem quarentena e sem migracao por consumo;
- a implementacao deve entrar por fases P0 -> P1 -> P2.
