# SDC FASE 2.6 - Product / Subproduct Taxonomy Audit

Status: Draft de auditoria
Date: 2026-07-09
Owner: Architecture / Enterprise Engineering
Scope: FINQZ PRO - Product Taxonomy, Simulation, Commercial Structure, Proposal, PDF

---

## 1. Objetivo

Auditar a taxonomia de produtos e subprodutos do FINQZ PRO para identificar:

- quais arquivos hoje definem a taxonomia oficial ou de compatibilidade;
- onde nascem as listas de produto e subproduto;
- onde a taxonomia e consumida pelo Workspace, Simulador, Proposal e PDF;
- onde existem divergencias entre frontend, backend, catologo mestre e camadas de compatibilidade;
- qual e a taxonomia canonica recomendada para a Fase 3 de consolidacao.

Esta auditoria nao altera runtime. Ela apenas documenta o estado atual e a direcao recomendada.

---

## 2. Escopo analisado

### Frontend

- `src/pages/Oportunidades.tsx`
- `src/pages/Simulador.tsx`
- `src/data/creditPfCatalog.ts`
- `src/data/commercialRepository.ts`
- `src/config/pipelines.ts`
- `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts`
- `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts`
- `src/features/proposals/proposalPdf.ts`
- `src/components/pipeline/*`
- `src/api/modules/master-catalog.api.ts`

### Backend

- `backend/src/modules/master-catalog/domain/master-catalog.contract.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.seed.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.read-model.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.mapper.ts`
- `backend/src/modules/commercial/validators/commercial.validator.ts`
- `backend/src/modules/integrations/application/provider-catalog.ts`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts`
- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts`
- `backend/src/modules/operation/contracts/operation.contracts.ts`
- `backend/src/modules/proposals/routes.ts`

### Documentacao oficial de referencia

- `docs/02-architecture/ARCH-016-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`
- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/09-product/EPC-PRODUCT-01-PRODUCT-READINESS-AUDIT.md`

---

## 3. Principios SDC aplicados

1. Proposal nunca calcula.
2. PDF nunca calcula.
3. Workspace orquestra, nao implementa regra financeira.
4. Uma unica fonte de verdade por responsabilidade.
5. Um unico motor de catalogo por dominio taxonomico.
6. Nenhum legado deve ser removido antes de substituto validado.
7. Contratos primeiro, runtime depois.
8. No duplicate sources.
9. No parallel APIs.
10. Backend first para contratos oficiais.

---

## 4. Inventario dos arquivos encontrados

### 4.1 Arquivos ativos do dominio

- `src/data/creditPfCatalog.ts`
- `src/pages/Simulador.tsx`
- `src/pages/Oportunidades.tsx`
- `src/features/proposals/proposalPdf.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.contract.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.seed.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.read-model.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.mapper.ts`
- `backend/src/modules/commercial/validators/commercial.validator.ts`
- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts`
- `backend/src/modules/operation/contracts/operation.contracts.ts`

### 4.2 Arquivos de compatibilidade

- `src/data/commercialRepository.ts`
- `src/config/pipelines.ts`
- `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts`
- `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts`
- `src/components/pipeline/PipelineSelect.tsx`
- `src/components/pipeline/pipelineUtils.ts`
- `src/components/pipeline/KanbanColumn.tsx`
- `src/components/pipeline/index.ts`

### 4.3 Arquivos obsoletos ou de apoio historico

- `src/pages/admin/pipelines.adapter.ts`
- `src/test/pipelines.adapter.test.ts`
- `src/test/pipelines.api.test.ts`
- `src/test/pipeline.test.ts`

### 4.4 Arquivos que nao foram classificados como mortos

Nao foi identificado arquivo morto com prova suficiente nesta auditoria.

---

## 5. Mapa atual do dominio

### 5.1 Fonte operacional de produtos no frontend

O catalogo de produtos PF do frontend nasce em `src/data/creditPfCatalog.ts`.

Evidencias:

- `Consignado`
- `Crédito Pessoal CDC`
- `Empréstimo com Garantia`
- `Financiamento`
- `Cartão`
- `Antecipação`
- `Energia`
- `Seguros`
- `Consórcio`

Referencia: `src/data/creditPfCatalog.ts:54-220`

### 5.2 Fonte oficial de catalogo mestre no backend

O backend master catalog define a arvore oficial de catalogo para:

- `Consignado`
- `Antecipação FGTS`
- `Energia por Assinatura`
- `Seguro`
- `Consórcio`

Referencia: `backend/src/modules/master-catalog/domain/master-catalog.contract.ts:33-45`
Referencia: `backend/src/modules/master-catalog/domain/master-catalog.seed.ts:158-207`

### 5.3 Camada de compatibilidade comercial no frontend

`src/data/commercialRepository.ts` consome `creditPfCatalog` como catalogo de apoio para UI e simulador.

Referencia: `src/data/commercialRepository.ts:7-8`, `src/data/commercialRepository.ts:181-185`, `src/data/commercialRepository.ts:582-613`

### 5.4 Camada de transicao para estrutura comercial

`src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts` e `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts` traduzem o tree oficial do master catalog para `EstruturaComercial`.

Referencia: `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts:1-5`
Referencia: `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts:1-117`

### 5.5 Simulador e Workspace

- `src/pages/Simulador.tsx` usa `getProductsForSelect`, `getSubproductsForProduct` e `getModalitiesForSubproduct`.
- `src/pages/Oportunidades.tsx` concentra o Workspace e ainda preserva blocos legados para algumas jornadas de simulação.

Referencia: `src/pages/Simulador.tsx:1-40`
Referencia: `src/pages/Oportunidades.tsx:1721-2007`, `src/pages/Oportunidades.tsx:5543-5955`

### 5.6 Proposal e PDF

`src/features/proposals/proposalPdf.ts` e o backend de proposals recebem payload montado anteriormente; nao sao origem da taxonomia.

Referencia: `src/features/proposals/proposalPdf.ts:1-18`, `src/features/proposals/proposalPdf.ts:718-741`
Referencia: `backend/src/modules/proposals/routes.ts:12-68`

---

## 6. Fluxo atual identificado

### 6.1 Fluxo principal do frontend

1. `creditPfCatalog.ts` define a taxonomia PF do frontend.
2. `commercialRepository.ts` expõe listas de produtos, subprodutos e modalidades para UI.
3. `Simulador.tsx` consome essas listas para a experiencia dedicada de simulacao.
4. `Oportunidades.tsx` consome a mesma base em partes da tela do Workspace.
5. Proposal e PDF recebem o resultado e os dados compilados.

### 6.2 Fluxo do backend

1. `master-catalog.seed.ts` define a arvore oficial de catalogo mestre.
2. `master-catalog.read-model.ts` e `master-catalog.mapper.ts` sustentam o contrato de leitura.
3. `loadEstruturaComercialFromMasterCatalog.ts` converte o catalogo mestre em estrutura comercial.
4. `commercial.validator.ts` valida a estrutura comercial persistida.
5. `simulation.contract.ts`, `financial-proposal.contract.ts` e `operation.contracts.ts` usam contratos distintos do catalogo PF.

---

## 7. Inventario canonico de produtos e subprodutos

### 7.1 Catalogo PF do frontend

#### Produtos

| Produto | ID | Codigo | Observacao |
| --- | --- | --- | --- |
| Consignado | `consignado` | `CONSIGNADO` | Produto ativo com maior arvore de subprodutos |
| Crédito Pessoal CDC | `credito-pessoal-cdc` | `CREDITO_PESSOAL_CDC` | Produto ativo com subprodutos proprios |
| Empréstimo com Garantia | `emprestimo-com-garantia` | `EMPRESTIMO_COM_GARANTIA` | Produto ativo e relevante para Auto Equity |
| Financiamento | `financiamento` | `FINANCIAMENTO` | Produto ativo com subprodutos de veiculo e imobiliario |
| Cartão | `cartao` | `CARTAO` | Produto ativo para rotativo/fatura/loja |
| Antecipação | `antecipacao` | `ANTECIPACAO` | Produto ativo com fluxo de FGTS/salario/beneficios |
| Energia | `energia` | `ENERGIA` | Produto ativo com subprodutos de GD e mercado livre |
| Seguros | `seguro` | `SEGURO` | Produto ativo |
| Consórcio | `consorcio` | `CONSORCIO` | Produto ativo |

Referencia: `src/data/creditPfCatalog.ts:54-220`

#### Subprodutos

| Produto pai | Subprodutos observados |
| --- | --- |
| Consignado | INSS, Federal, Estadual, Municipal, CLT Privado, Forças Armadas, LOAS / BPC, Cartão Consignado RMC, Cartão Benefício |
| Crédito Pessoal CDC | Clean sem garantia, Com Avalista, CDC Digital |
| Empréstimo com Garantia | Home Equity, Auto Equity |
| Financiamento | Veículo Novo, Veículo Usado, Imobiliário SFH, Imobiliário SFI, Construção |
| Cartão | Crédito Rotativo, Parcelamento de Fatura, Parcelado Loja |
| Antecipação | Saque-Aniversário FGTS, Antecipação de Salário, Antecipação de Benefícios |
| Energia | Geração Distribuída, Mercado Livre de Energia |
| Seguros | Prestamista, Vida, Proteção Financeira |
| Consórcio | Imobiliário, Veículos Leves, Veículos Pesados, Serviços |

Referencia: `src/data/creditPfCatalog.ts:54-220`

### 7.2 Catalogo mestre do backend

#### Produtos

| Produto | ID | Codigo | Observacao |
| --- | --- | --- | --- |
| Consignado | `product-consignado` | `CONSIGNADO` | Produto oficial do seed backend |
| Antecipação FGTS | `product-antecipacao-fgts` | `ANTECIPACAO_FGTS` | Sem subprodutos no seed |
| Energia por Assinatura | `product-energia-assinatura` | `ENERGIA_POR_ASSINATURA` | Produto oficial backend |
| Seguro | `product-seguro` | `SEGURO` | Sem subprodutos no seed |
| Consórcio | `product-consorcio` | `CONSORCIO` | Sem subprodutos no seed |

Referencia: `backend/src/modules/master-catalog/domain/master-catalog.seed.ts:158-207`

#### Subprodutos do backend

| Produto pai | Subprodutos observados |
| --- | --- |
| Consignado | Empréstimo Consignado, Cartão RMC, Cartão Benefício |
| Energia por Assinatura | Geração Distribuída, Mercado Livre |

Referencia: `backend/src/modules/master-catalog/domain/master-catalog.seed.ts:50-126`, `backend/src/modules/master-catalog/domain/master-catalog.seed.ts:174-190`

---

## 8. Matriz produto x subproduto

| Produto canônico recomendado | Situação frontend | Situação backend | Subprodutos canonicos recomendados | Divergencia principal | Status |
| --- | --- | --- | --- | --- | --- |
| Consignado | Presente em `creditPfCatalog` | Presente no master catalog | INSS, Federal, Estadual, Municipal, CLT Privado, Forças Armadas, LOAS / BPC, Cartão Consignado RMC, Cartão Benefício | Backend tem arvore reduzida | Parcialmente alinhado |
| Crédito Pessoal CDC | Presente no frontend | Ausente no master catalog | Clean sem garantia, Com Avalista, CDC Digital | Sem representacao oficial no master catalog | Divergente |
| Empréstimo com Garantia | Presente no frontend | Ausente no master catalog | Home Equity, Auto Equity | Falta no backend; componente chave para Auto Equity | Divergente critico |
| Financiamento | Presente no frontend | Ausente no master catalog | Veículo Novo, Veículo Usado, Imobiliário SFH, Imobiliário SFI, Construção | Falta no backend master catalog | Divergente |
| Cartão | Presente no frontend | Ausente no master catalog | Crédito Rotativo, Parcelamento de Fatura, Parcelado Loja | Falta no backend master catalog | Divergente |
| Antecipação | Presente no frontend | Backend usa Antecipação FGTS | Saque-Aniversário FGTS, Antecipação de Salário, Antecipação de Benefícios | Nome e escopo divergem | Divergente |
| Energia | Presente no frontend | Backend usa Energia por Assinatura | Geração Distribuída, Mercado Livre de Energia | Nome e granularidade divergem | Divergente |
| Seguros | Presente no frontend como `Seguros` | Backend usa `Seguro` | Prestamista, Vida, Proteção Financeira | Singular/plural e estrutura divergem | Divergente |
| Consórcio | Presente no frontend | Presente no backend | Imobiliário, Veículos Leves, Veículos Pesados, Serviços | Backend ainda nao expõe subprodutos no seed | Parcialmente alinhado |

### Leitura da matriz

- O frontend possui a taxonomia PF mais rica e detalhada.
- O backend master catalog ainda cobre apenas um subconjunto do dominio.
- `Empréstimo com Garantia / Auto Equity / Home Equity` existe no frontend e nao existe no master catalog backend.
- `Antecipação` e `Energia` estao nomeados de forma diferente entre as camadas.
- O Workspace e o Simulador consomem o frontend catalog hoje, enquanto o backend master catalog opera como referencia parcial e camada de transicao.

---

## 9. Dependencias entre modulos

### Frontend

- `src/pages/Simulador.tsx` -> `src/data/commercialRepository.ts`
- `src/pages/Oportunidades.tsx` -> `src/data/commercialRepository.ts`, estados locais e blocos legados
- `src/data/commercialRepository.ts` -> `src/data/creditPfCatalog.ts`
- `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts` -> `src/api/modules/master-catalog.api.ts`
- `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts` -> tipos da API master catalog
- `src/features/proposals/proposalPdf.ts` -> payload montado por proposta, sem regra de catalogo

### Backend

- `backend/src/modules/master-catalog/domain/*` -> contrato e seed do catalogo mestre
- `backend/src/modules/commercial/validators/commercial.validator.ts` -> estrutura comercial persistida
- `backend/src/modules/integrations/application/provider-catalog.ts` -> catalogo de providers, nao de produtos PF
- `backend/src/modules/simulation/domain/contracts/simulation.contract.ts` -> tipos de simulacao legados/estruturais
- `backend/src/modules/integrations/domain/contracts/financial-proposal/*` -> proposta financeira
- `backend/src/modules/operation/contracts/operation.contracts.ts` -> operacao financeira

---

## 10. Pontos de calculo financeiro

### Nao sao pontos de taxonomia, mas consomem a taxonomia

- `src/pages/Simulador.tsx`
- `src/pages/Oportunidades.tsx`
- `backend/src/modules/simulation/domain/services/*`
- `backend/src/modules/integrations/application/financial-execution-runtime.ts`

### Observacao

O calculo financeiro nao deve viver em `proposalPdf.ts` nem em `routes.ts` de proposals.
Esses modulos apenas recebem dados ja calculados.

---

## 11. Pontos de montagem de Proposal

- `src/features/proposals/proposalPdf.ts`
- `backend/src/modules/proposals/routes.ts`
- `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts`
- `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts`

### Observacao

Proposal e um consumidor do resultado do dominio. Nao e dono da taxonomia.

---

## 12. Pontos de geracao de PDF / documentos

- `src/features/proposals/proposalPdf.ts`
- rotas e contratos de proposal no backend

### Observacao

PDF e renderer final. Ele nao deve inferir produto/subproduto nem recalcular taxonomia.

---

## 13. Pontos de persistencia

- `backend/src/modules/master-catalog/domain/master-catalog.*`
- `backend/src/modules/commercial/validators/commercial.validator.ts`
- `backend/src/modules/operation/contracts/operation.contracts.ts`

### Observacao

Persistencia oficial deve ser fechada no backend. Frontend e camada de consumo e compatibilidade.

---

## 14. Pontos de auditoria

- `docs/00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md`
- `docs/02-architecture/ARCH-016-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`
- `docs/09-product/EPC-PRODUCT-01-PRODUCT-READINESS-AUDIT.md`
- `backend/src/modules/operation/contracts/operation-audit.contract.ts`
- `backend/src/modules/master-catalog/domain/master-catalog.read-model.ts`

### Observacao

A auditoria deve registrar:

- produto e subproduto selecionados;
- origem do catalogo;
- compatibilidade aplicada;
- eventuais traducoes entre frontend e backend.

---

## 15. Classificacao dos arquivos

| Arquivo | Classificacao | Motivo |
| --- | --- | --- |
| `src/data/creditPfCatalog.ts` | Ativo | Fonte atual da taxonomia PF usada pela UI |
| `src/data/commercialRepository.ts` | Compatibilidade | Reaproveita o catalogo PF e expõe selects e helpers |
| `src/config/pipelines.ts` | Compatibilidade | Mantem mapeamento legado para pipelines e produtos |
| `src/pages/Simulador.tsx` | Ativo | Surface de simulacao que consome catalogo e monta jornada |
| `src/pages/Oportunidades.tsx` | Ativo | Workspace oficial, mas ainda com blocos legados e compativeis |
| `src/features/master-catalog/loadEstruturaComercialFromMasterCatalog.ts` | Compatibilidade | Traduz catalogo mestre para estrutura comercial da UI |
| `src/features/master-catalog/masterCatalogToEstruturaComercial.mapper.ts` | Compatibilidade | Mapper de transicao entre contrato master e estrutura comercial |
| `src/features/proposals/proposalPdf.ts` | Ativo | Renderer de PDF; nao calcula taxonomia |
| `backend/src/modules/master-catalog/domain/master-catalog.contract.ts` | Ativo | Contrato oficial do catalogo mestre |
| `backend/src/modules/master-catalog/domain/master-catalog.seed.ts` | Ativo | Seed oficial do estado atual do catalogo mestre |
| `backend/src/modules/master-catalog/domain/master-catalog.read-model.ts` | Ativo | Leitura oficial do catalogo mestre |
| `backend/src/modules/master-catalog/domain/master-catalog.mapper.ts` | Ativo | Mapeamento interno do master catalog |
| `backend/src/modules/commercial/validators/commercial.validator.ts` | Ativo | Valida estrutura comercial persistida |
| `backend/src/modules/simulation/domain/contracts/simulation.contract.ts` | Compatibilidade | Usa tipagem de simulacao com taxonomia parcial/legada |
| `backend/src/modules/integrations/domain/contracts/integration-proposal.contract.ts` | Ativo | Contrato de proposta de integracao |
| `backend/src/modules/integrations/domain/contracts/financial-proposal/financial-proposal.contract.ts` | Ativo | Contrato financeiro de proposta |
| `backend/src/modules/operation/contracts/operation.contracts.ts` | Ativo | Contrato operacional downstream |
| `backend/src/modules/integrations/application/provider-catalog.ts` | Ativo | Catalogo de providers; nao e taxonomia de produto |

---

## 16. Violacoes arquiteturais identificadas

1. Duas taxonomias coexistem para o dominio PF:
   - catalogo rico no frontend;
   - catalogo mestre reduzido no backend.
2. `Empréstimo com Garantia` existe na UI, mas nao no master catalog backend.
3. `Auto Equity` e `Home Equity` existem no frontend, mas nao como oferta canonica do backend master catalog.
4. `Antecipação` vs `Antecipação FGTS` mostra divergencia de nome e granularidade.
5. `Energia` vs `Energia por Assinatura` mostra divergencia de naming.
6. `Seguros` vs `Seguro` mostra divergencia de naming.
7. `src/pages/Oportunidades.tsx` ainda carrega blocos legados, o que aumenta risco de leitura incorreta de origem.
8. `src/data/commercialRepository.ts` funciona como ponte de compatibilidade, nao como fonte oficial consolidada.

---

## 17. Riscos tecnicos

1. Risco de mismatch entre UI e backend quando o produto e subproduto existem em uma camada e nao na outra.
2. Risco de proposal e PDF exibirem produto/subproduto coerentes visualmente, mas sem equivalencia contratual no backend.
3. Risco de duplicidade de regras quando `commercialRepository`, `creditPfCatalog` e `master-catalog` forem mantidos em paralelo por muito tempo.
4. Risco de regressao em Auto Equity por depender de catalogo local para selecao, enquanto o backend nao formaliza o mesmo recorte.
5. Risco de tradutor de estrutura comercial mascarar a ausencia de taxonomia canonica no backend.

---

## 18. Recomendacoes para a Fase 3 - Fonte Unica de Verdade

1. Eleger o backend master catalog como owner canonico de produto/subproduto/modalidade.
2. Expandir o master catalog para cobrir:
   - Empréstimo com Garantia
   - Home Equity
   - Auto Equity
   - o detalhamento completo de consignado e demais linhas PF.
3. Tratar `creditPfCatalog.ts` e `commercialRepository.ts` como compatibilidade temporaria ate a migracao completa.
4. Garantir que `Oportunidades.tsx` e `Simulador.tsx` leiam um contrato unico de catalogo.
5. Fazer `proposalPdf.ts` e proposal routes consumirem somente payload final, sem qualquer inferencia de taxonomia.
6. Remover divergencias de naming entre frontend e backend por meio de uma tabela canonica unica.
7. Validar a consolidacao com contract tests antes de remover qualquer compatibilidade.

---

## 19. Ponto em aberto

- A camada de master catalog backend ainda nao expõe a mesma profundidade de produtos PF que o frontend.
- Nao foi encontrado, nesta auditoria, um contrato backend oficial que represente `Auto Equity` e `Home Equity` como subprodutos canonicos.
- O caminho mais seguro e consolidar primeiro o catalogo mestre e depois desativar gradualmente os fallbacks de frontend.

---

## 20. Critério de saída da Fase 2.6

A Fase 2.6 so pode ser considerada concluida quando:

1. existir uma taxonomia canonica unica para produtos, subprodutos e modalidades;
2. o backend master catalog representar essa taxonomia completa;
3. a UI consumir essa taxonomia sem depender de fontes concorrentes;
4. proposal e PDF apenas exibirem o resultado ja calculado;
5. nao existirem ambiguidades de naming entre frontend e backend para os principais produtos PF;
6. Auto Equity estiver representado de ponta a ponta na fonte canonica oficial.

---

## 21. Status final da auditoria

Status: `AUDIT COMPLETED - GO WITH RESTRICTIONS`

### Justificativa

- a auditoria foi concluida;
- a superficie atual e funcional e rastreavel;
- porem a taxonomia ainda nao e unificada entre frontend e backend;
- existe risco arquitetural relevante para consolidacao sem harmonizacao do master catalog.

