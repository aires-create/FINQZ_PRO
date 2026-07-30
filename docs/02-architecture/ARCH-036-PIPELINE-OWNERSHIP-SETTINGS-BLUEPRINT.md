# ARCH-036 - Pipeline Ownership & Settings Blueprint

## 1. Contexto
O FINQZ PRO está na transição de um modelo híbrido de Pipeline para um modelo oficialmente centralizado no backend.

As auditorias H-02B, H-02C e H-02D mostram que:
- o backend já possui um domínio real de `Pipeline` e `Stage`;
- o frontend ainda mantém múltiplas fontes locais de verdade;
- parte da UX de Oportunidades e a tela de Administração de Pipelines continuam dependentes de catálogo local, store paralelo e `localStorage`;
- o movimento arquitetural oficial é:
  - `Customer` como fonte única de verdade;
  - `Opportunity Intake` como canal oficial de entrada;
  - `Pipeline` como domínio operacional do backend, não como catálogo local de UI.

Este blueprint define a propriedade oficial do domínio de Pipeline e o caminho de migração para eliminar duplicidade sem quebrar o fluxo atual.

## 2. Problema Atual
Hoje existem múltiplas definições concorrentes de Pipeline:

- backend oficial expõe `GET /api/v1/pipelines` com `Pipeline` e `Stage` persistidos;
- frontend mantém:
  - catálogo de pipeline em `src/config/pipelines.ts`;
  - catálogo/repository local em `src/data/catalogRepository.ts`;
  - settings de pipeline em `localStorage`;
  - store paralelo em `src/store/index.ts`;
- a tela `src/pages/Oportunidades.tsx` combina:
  - pipeline oficial do backend;
  - fallback local de etapas;
  - cor de etapa calculada localmente;
  - mapeamento legado Produto -> Pipeline;
- a tela `src/pages/admin/Pipelines.tsx` ainda administra pipeline settings localmente, sem backend oficial para persistência de configuração visual.

Resultado:
- há duplicidade de verdade;
- a regra operacional está parcialmente no backend;
- a UI ainda carrega comportamento legado e configurações locais críticas;
- não existe uma estratégia única para ownership de etapas, cores e settings.

## 3. Estado Atual (AS-IS)
### Backend
- Existe `GET /api/v1/pipelines`.
- O endpoint retorna `Pipeline[]` por tenant e somente ativos.
- `Pipeline` é persistido em Prisma.
- `Stage` é persistido em Prisma com `order`, `isWon` e `isLost`.
- Não existe persistência backend para:
  - `stageColors`;
  - pipeline settings de UI;
  - tipo do pipeline.
- Não há DTO/controller separado; o contrato está no route/service/repository + Prisma.

### Frontend
- `src/pages/Oportunidades.tsx`
  - lê pipelines oficiais;
  - ainda usa `catalogRepository` para etapas e cores;
  - ainda usa fallback legado para mapeamento Produto -> Pipeline;
  - ainda depende de store local para `currentPipelineId` e `pipelines`.
- `src/pages/admin/Pipelines.tsx`
  - lê e grava settings em `localStorage`;
  - usa catálogo local para gerar defaults;
  - administra ordem e cores localmente.
- `src/config/pipelines.ts`
  - mantém catálogo legado de pipelines;
  - mantém heurísticas e mapeamentos transitórios.
- `src/data/catalogRepository.ts`
  - mantém `loadPipelineSettings()` e `savePipelineSettings()`;
  - persiste settings no browser;
  - expõe helpers de etapas e cores.
- `src/store/index.ts`
  - contém estado paralelo e mocks iniciais;
  - persiste parcialmente `pipelines` e `currentPipelineId`.

## 4. Estado Futuro (TO-BE)
O estado futuro desejado é backend-first, com o backend como owner oficial de Pipeline.

### Princípios do TO-BE
- backend é a fonte única de verdade para:
  - Pipeline;
  - Stage;
  - ordem de etapas;
  - status ativo/inativo;
- frontend apenas consome e renderiza;
- não existem stores paralelos para o mesmo domínio;
- não existe `localStorage` como fonte operacional de Pipeline;
- catálogos locais só sobrevivem durante a transição, como compatibilidade temporária;
- `Customer` permanece como fonte única de verdade para dados cadastrais;
- `Opportunity Intake` continua sendo o canal oficial de criação comercial.

### Resultado esperado
- `Oportunidades` usa apenas contrato oficial do backend para pipeline;
- `Admin/Pipelines` passa a operar sobre API oficial;
- configurações de pipeline deixam de ser browser-local;
- remoção gradual dos fallbacks legados sem regressão de runtime.

## 5. Ownership Matrix
| Domínio | Owner Atual | Owner Futuro | Observação |
|---|---|---|---|
| Pipeline master data | Parcial backend + frontend | Backend | Backend já possui entidade real |
| Stage order | Backend + frontend | Backend | Backend já persiste `Stage.order` |
| Stage colors | Frontend | Backend ou configuração oficial dedicada | Hoje não existe persistência backend |
| Pipeline active/inactive | Backend + frontend | Backend | Frontend hoje duplica em settings local |
| Pipeline settings UI | Frontend/localStorage | Backend | Falta contrato oficial |
| Produto -> Pipeline mapping | Frontend legado | Remover ou substituir por regras oficiais | Não é ownership arquitetural final |
| Customer | Backend | Backend | Fonte única de verdade |
| Opportunity Intake | Backend | Backend | Canal oficial de entrada |
| UI cache / view state | Frontend | Frontend | Apenas estado efêmero, não operacional |

## 6. Backend Responsibilities
O backend deve ser o owner oficial do domínio de Pipeline.

### Responsabilidades mínimas
- expor `GET /api/v1/pipelines` como fonte canônica;
- persistir e servir:
  - `Pipeline.id`;
  - `Pipeline.name`;
  - `Pipeline.isActive`;
  - `Pipeline.isDefault`;
  - `Stage.id`;
  - `Stage.name`;
  - `Stage.order`;
  - `Stage.isWon`;
  - `Stage.isLost`;
- garantir:
  - isolamento por tenant;
  - ordenação estável;
  - consistência de dados;
  - compatibilidade com Opportunity Intake;
- fornecer contratos claros para UI e Admin.

### Responsabilidades futuras desejáveis
- CRUD oficial de Pipeline;
- CRUD oficial de Stage;
- persistência de settings de Pipeline;
- persistência de stage colors, se esse atributo continuar existindo como requisito funcional;
- validação server-side de reorder e edição.

## 7. Frontend Responsibilities
O frontend deve deixar de ser owner do domínio e virar consumidor.

### Responsabilidades mínimas
- consumir `/api/v1/pipelines`;
- renderizar pipeline, etapas e estados vindos do backend;
- manter apenas estado de interface:
  - seleção atual;
  - filtros;
  - drag state;
  - modal state;
- não persistir dados operacionais de pipeline no browser;
- não manter regra de negócio paralela para etapa, ordem, status ou defaults.

### O que deve desaparecer do frontend
- `localStorage` como fonte de settings;
- `config/pipelines.ts` como contrato operacional;
- `catalogRepository.ts` como owner de pipeline settings;
- `store` local como verdade de pipeline;
- mapeamento Produto -> Pipeline como regra de domínio.

## 8. Pipeline Settings Strategy
Hoje settings de pipeline vivem em `localStorage`. Isso é transitório e não deve ser considerado arquitetura final.

### Estratégia recomendada
1. Definir `Pipeline Settings` como conceito oficialmente backend-owned.
2. Criar persistência backend para settings operacionais.
3. Separar claramente:
   - domínio operacional de pipeline;
   - preferências visuais da UI;
   - estado efêmero de tela.
4. Migrar o admin para ler/gravar na API oficial.
5. Desativar `localStorage` como fallback operacional após migração.

### Regras de transição
- Enquanto a API de settings não existir, `localStorage` pode ser tolerado apenas como compatibilidade temporária.
- Não deve receber novas extensões de comportamento.
- Nenhuma feature nova deve depender dele.

## 9. Stage Colors Strategy
As cores de etapa são o maior ponto de divergência arquitetural.

### Situação atual
- o frontend gera e persiste cores localmente;
- o backend não possui campo de cor de etapa;
- a UI usa `getPipelineStageColor()` como fallback visual.

### Estratégia recomendada
Há duas opções arquiteturalmente corretas:

#### Opção A: Backend persiste `stageColor`
- adicionar persistência oficial para cor de etapa;
- backend passa a ser owner de visual settings relevantes;
- frontend apenas exibe a cor recebida.

#### Opção B: Cores ficam fora do domínio operacional
- backend só governa pipeline e etapas;
- frontend ou design system trata cor como apresentação;
- não há edição operacional de cores por usuário.

### Recomendação documental
Para eliminar `localStorage` sem ambiguidade, a arquitetura deve escolher uma destas abordagens e formalizar isso no backend.
Hoje a ausência de definição mantém a duplicidade.

## 10. Migration Phases
### Fase 1 - Ownership oficial de leitura
- centralizar leitura de pipeline no backend;
- `Oportunidades` passa a consumir primeiro o contrato oficial;
- manter fallback transitório apenas para evitar regressão.

### Fase 2 - Eliminação de dependência duplicada
- remover uso operacional de:
  - `config/pipelines.ts`;
  - `catalogRepository` para etapas e cores;
  - store paralelo de pipelines;
- UI passa a depender apenas de backend para pipeline master data.

### Fase 3 - Pipeline Settings oficial
- introduzir API oficial para settings;
- migrar `admin/Pipelines.tsx` para API;
- remover `localStorage` como fonte de verdade.

### Fase 4 - Stage colors oficiais ou retiradas
- se cores forem requisito funcional, persistir oficialmente no backend;
- se forem somente apresentação, mover para tema/UI e eliminar edição operacional.

### Fase 5 - Cleanup final
- remover código legado:
  - helpers transitórios;
  - mapeamentos Produto -> Pipeline;
  - fallback stores;
  - fallbacks de `localStorage`;
- consolidar contrato e testes.

## 11. Riscos
- regressões em `Oportunidades` ao remover fallback cedo demais;
- quebra de visualização se `stageColors` sumirem sem contrato substituto;
- perda de compatibilidade em pipelines legados codificados no frontend;
- divergência entre pipeline oficial e settings locais durante a transição;
- persistência parcial de estado no store pode gerar comportamento não determinístico;
- remoção prematura de `localStorage` pode apagar customizações do admin antes de existir persistência backend;
- manutenção de dois owners simultâneos aumenta custo e fragilidade operacional.

## 12. Decisão Arquitetural Final
**Backend é o owner oficial de Pipeline.**

### Decisão
- Pipeline, etapas, ordem, ativação e identidade operacional pertencem ao backend.
- Frontend não deve manter verdade paralela.
- `localStorage` é compatibilidade transitória, não arquitetura alvo.
- `catalogRepository.ts`, `config/pipelines.ts` e store paralelo devem ser tratados como legado de migração.
- `stageColors` precisam de decisão formal:
  - ou persistem no backend,
  - ou saem do domínio operacional.

### Conclusão
- Owner oficial do domínio: Backend
- Owner de apresentação: Frontend
- Owner transitório durante migração: Híbrido, com prazo de descarte definido
- Arquitetura final recomendada: backend-first, sem fonte paralela de verdade

## 13. Non-Goals
Este blueprint **NÃO**:

- cria novas tabelas Prisma;
- autoriza migrations;
- define implementação de CRUD;
- define modelo final de `Stage Colors`;
- remove `localStorage` imediatamente;
- remove `catalogRepository.ts` nesta fase;
- altera `Opportunity Intake`;
- altera `Commission V2`;
- altera `Settlement`;
- altera `RBAC`.

Qualquer implementação decorrente deste blueprint deverá passar por auditoria específica e aprovação arquitetural posterior.
