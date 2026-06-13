# ARCH-044 - Master Catalog Rollout & Migration Strategy

## 1. Contexto
O FINQZ PRO consolidou a arquitetura do Master Catalog em uma sequência de decisões complementares:

- `ARCH-036` separou `Pipeline` como domínio backend independente.
- `ARCH-037` definiu `Product`, `Subproduct` e `Modality` como responsabilidade do backend.
- `ARCH-038` formalizou o backend blueprint do catálogo comercial.
- `ARCH-039` fechou o contrato oficial do catálogo mestre.
- `ARCH-040` desenhou o backend do Master Catalog.
- `ARCH-041` mapeou os consumidores reais do catálogo.
- `ARCH-042` definiu o contrato oficial da API do Master Catalog.
- `ARCH-043` definiu a estratégia arquitetural de persistência.

Este documento consolida a estratégia oficial de rollout e migração para levar o Master Catalog do estado híbrido atual para o estado backend-first.

## 2. Objetivos
A estratégia de rollout e migração deve garantir:

- `Backend First`;
- `Single Source of Truth`;
- `Backward Compatibility`;
- `Controlled Rollout`;
- `Rollback Friendly`.

### Intenção arquitetural
Migrar consumidores e dependências em etapas seguras, preservando operação enquanto o catálogo mestre backend se consolida.

## 3. Estado Atual
### creditPfCatalog
Ainda é a base funcional direta de Product, Subproduct e Modality em partes do frontend.

### catalogRepository
Atua como adapter e reexport de helpers, além de carregar pipeline settings transitórios.

### commercialRepository
Atua como fallback operacional e storage local transitório.

### EstruturaComercial
Consome o catálogo local e monta a hierarquia comercial a partir dele.

### TabelasComerciais
Consome backend operacional, mas ainda depende de fallback local e helpers do catálogo.

### Simulador
Depende de `commercialRepository` e de seletores derivados do catálogo.

### Oportunidades
É o consumidor mais acoplado ao catálogo e também ao pipeline.

## 4. Estado Futuro
O estado futuro esperado é:

- backend como master catalog oficial;
- `Product`, `Subproduct` e `Modality` como contratos canônicos do backend;
- read models oficiais para navegação e leitura;
- frontend apenas como consumidor;
- adapters transitórios eliminados gradualmente.

### Componentes futuros
- Backend Master Catalog;
- `Product`;
- `Subproduct`;
- `Modality`;
- Read Models.

## 5. Migration Principles
### Backend First
O backend deve ser o ponto de partida da verdade do catálogo.

### Single Source of Truth
Não deve haver duas fontes oficiais concorrentes para o mesmo conceito.

### Backward Compatibility
Os consumidores antigos precisam continuar funcionando durante a transição.

### Controlled Rollout
A migração deve acontecer em fases pequenas e verificáveis.

### Rollback Friendly
Cada fase deve permitir retorno controlado caso haja regressão.

## 6. Consumer Migration Order
### 1. EstruturaComercial
É o primeiro candidato porque:

- é o mais próximo de leitura de catálogo puro;
- tem menor dependência de regras operacionais complexas;
- permite validar o contrato backend de forma isolada.

### 2. TabelasComerciais
Deve vir em seguida porque:

- já opera próximo ao backend;
- ainda usa fallback local e helpers;
- precisa de transição para reduzir duplicidade.

### 3. Simulador
Deve migrar depois porque:

- depende de dados operacionais e catálogo;
- usa repositórios locais como apoio;
- exige mais estabilidade contratual.

### 4. Oportunidades
Deve ser o último consumidor porque:

- é o mais acoplado;
- depende de catálogo e pipeline;
- concentra maior risco de regressão funcional.

## 7. Compatibility Layer Strategy
### creditPfCatalog
Deve existir apenas como compatibilidade transitória enquanto o backend ainda não cobre todos os consumidores.

### catalogRepository
Deve continuar funcionando como adapter até que todos os consumidores estejam no contrato oficial.

### commercialRepository
Deve continuar servindo como fallback operacional até que o backend substitua o papel de leitura e apoio.

### Coexistência
Durante a transição:

- o backend publica o contrato oficial;
- os adapters continuam respondendo para consumidores legados;
- o frontend migra gradualmente para o read model backend;
- a compatibilidade é mantida por camada, não por novo acoplamento.

## 8. Rollout Phases
### Fase 1
Publicar e estabilizar o contrato backend do Master Catalog em modo read only.

### Fase 2
Migrar `EstruturaComercial` para consumir o contrato oficial.

### Fase 3
Migrar `TabelasComerciais` e reduzir dependência de fallback local.

### Fase 4
Migrar `Simulador` para consumir o catálogo oficial e consolidar os caminhos de seleção.

### Fase 5
Migrar `Oportunidades`, removendo a dependência do catálogo local e reduzindo o acoplamento transitório com pipeline.

## 9. Rollback Strategy
O rollback deve ser simples e controlado:

- reativar a leitura via compatibilidade transitória;
- manter o backend do catálogo sem exigir mutação;
- preservar o contrato anterior enquanto a migração é revertida;
- evitar rollback estrutural que force novo acoplamento.

## 10. Risk Analysis
### Risco de compatibilidade
Consumidores podem depender de campos legados que não fazem parte do contrato final.

### Risco de cache
Leitura stale pode esconder divergência entre frontend e backend.

### Risco de migração parcial
Parte dos consumidores pode migrar enquanto outros permanecem no legado, gerando ambiguidade.

### Risco de duplicidade
Coexistência prolongada de fontes locais e backend pode manter drift.

### Risco de pipeline acoplado
`Oportunidades` pode continuar preso a pipeline se a migração não separar bem os domínios.

## 11. Success Criteria
A estratégia é bem-sucedida quando:

- `EstruturaComercial` consome o catálogo backend;
- `TabelasComerciais` usa o catálogo backend com mínimo fallback;
- `Simulador` deixa de depender de catálogo local como verdade funcional;
- `Oportunidades` consome o catálogo backend sem acoplamento indevido ao legado;
- `creditPfCatalog`, `catalogRepository` e `commercialRepository` deixam de ser fonte funcional primária.

## 12. Decisão Arquitetural Final
A ordem oficial de rollout e migração é:

1. `EstruturaComercial`
2. `TabelasComerciais`
3. `Simulador`
4. `Oportunidades`

Essa ordem equilibra risco, dependência e valor de validação do contrato.

## 13. Non-Goals
Este documento não:

- cria Prisma;
- cria migration;
- cria CRUD;
- cria Pipeline;
- cria Commission;
- cria Settlement;
- cria RBAC;
- cria Provider Engine.

