# SDC FASE 3.4A - Simulation Product Adapter Blueprint

## 1. Objetivo
Definir a arquitetura oficial dos Simulation Product Adapters para o domínio de simulação do FINQZ PRO Enterprise, preparando a migração controlada dos produtos financeiros para o Simulation Engine canônico sem alterar regras financeiras, comportamento atual, Proposal, PDF, Master Catalog Runtime ou contratos legados.

## 2. Escopo
### 2.1 Modulos analisados
- `backend/src/modules/simulation`
- `backend/src/modules/master-catalog`
- `backend/src/modules/opportunities`
- `backend/src/modules/edp`
- `backend/src/modules/commercial`
- `backend/src/modules/integrations`
- `backend/src/modules/proposals`

### 2.2 Documentacao SDC considerada
- `docs/01-architecture/SDC-FASE-1-SDA-01-SIMULATION-DOMAIN-AUDIT.md`
- `docs/01-architecture/SDC-FASE-2-SSOT-01-SINGLE-SOURCE-OF-TRUTH.md`
- `docs/01-architecture/SDC-FASE-2.6-PRODUCT-SUBPRODUCT-TAXONOMY-AUDIT.md`
- `docs/01-architecture/SDC-FASE-2.7-MASTER-CATALOG-CANONICALIZATION-BLUEPRINT.md`
- `docs/01-architecture/SDC-FASE-3.1-MASTER-CATALOG-RUNTIME.md`
- `docs/01-architecture/SDC-FASE-3.2-SIMULATION-ENGINE-CONTRACTS.md`
- `docs/01-architecture/SDC-FASE-3.2A-SIMULATION-CONTRACT-ADOPTION-AUDIT.md`
- `docs/01-architecture/SDC-FASE-3.3-SIMULATION-CONTRACT-BRIDGE-ACL.md`
- `docs/02-architecture/ARCH-016-OPPORTUNITY-WORKSPACE-BLUEPRINT.md`

### 2.3 Fora de escopo
- Migrar Auto Equity.
- Migrar Home Equity.
- Alterar Workspace.
- Alterar Proposal.
- Alterar PDF.
- Alterar Master Catalog.
- Alterar banco.
- Alterar APIs.
- Alterar comportamento.
- Remover legado.
- Mover regras financeiras.

## 3. Problema Resolvido
O FINQZ PRO passou a ter contratos canônicos, snapshot, execution envelope e ACL de compatibilidade. O que ainda falta é a camada de adaptação por produto, capaz de ligar cada produto financeiro ao engine canônico sem acoplar diretamente regra, UI, Proposal ou PDF ao runtime financeiro.

Este blueprint resolve:
- como registrar adaptadores por produto e subproduto;
- como resolver capacidades sem `switch/case`;
- como validar entradas antes de simular, ranquear ou propor;
- como isolar políticas comerciais, de elegibilidade e de provider;
- como preservar compatibilidade com o legado durante a migração.

## 4. Arquitetura Geral
### 4.1 Visao macro
```mermaid
flowchart LR
  A[Master Catalog] --> B[Product Registry]
  B --> C[Product Resolver]
  C --> D[Product Adapter]
  D --> E[Simulation Engine]
  E --> F[SimulationResult]
```

### 4.2 Fluxo complementar
```mermaid
flowchart LR
  P[Produto] --> SP[Subproduto]
  SP --> CAP[Capabilities]
  CAP --> POL[Policies]
  POL --> PRV[Provider]
  PRV --> RANK[Ranking]
  RANK --> PROP[Proposal]
```

### 4.3 Principio central
O adapter nao calcula regra financeira. Ele:
- identifica o produto;
- normaliza o contexto;
- valida se o produto e suportado;
- monta o request canônico;
- seleciona capabilities e policies;
- prepara saida para o Simulation Engine;
- produz metadados, auditoria e snapshot por contrato.

## 5. Product Adapter
### 5.1 Contrato base
Todo adapter deve expor os seguintes metodos:
- `identify()`
- `supports()`
- `validate()`
- `normalize()`
- `simulate()`
- `buildProposal()`
- `buildRanking()`
- `buildMetadata()`
- `buildAudit()`
- `buildSnapshot()`

### 5.2 Responsabilidade
O adapter e a unidade de adaptacao de produto. Ele sabe:
- qual produto/subproduto esta em jogo;
- como ler o contexto de entrada;
- quais capabilities estao habilitadas;
- quais validators devem rodar;
- quais policies aplicar;
- como montar a estrutura de request e envelope.

### 5.3 Limite arquitetural
O adapter nao deve:
- implementar formula financeira;
- conhecer detalhe de PDF;
- conhecer layout de Workspace;
- persistir estado de negocio;
- alterar Proposal;
- alterar catalogo mestre;
- acoplar produtos entre si.

## 6. Product Registry
### 6.1 Papel
O Product Registry registra adaptadores disponiveis e os torna resolviveis por produto, subproduto e capabilities.

### 6.2 Regras
- Evitar `switch/case`.
- Permitir registro automatico.
- Permitir coexistencia de varios adapters.
- Resolver primeiro por produto/subproduto e depois por capabilities.

### 6.3 Estrutura prevista
- `simulation-product.registry.ts`
- fonte de registro por modulo/pasta
- catalogo de adaptadores ativos
- metadados de capacidade para resolucao segura

### 6.4 Resultado esperado
O registry deve permitir que um novo produto seja adicionado sem editar um bloco central gigante de decisao.

## 7. Product Resolver
### 7.1 Papel
O resolver seleciona o adapter correto com base em:
- produto;
- subproduto;
- capabilities;
- policies disponiveis;
- compatibilidade com o contexto.

### 7.2 Regras de resolucao
1. Tentar correspondencia exata de produto + subproduto.
2. Tentar correspondencia por capability dominante.
3. Tentar fallback compatibilidade.
4. Nunca inventar produto.
5. Nunca trocar regra financeira por heuristica de UI.

### 7.3 Saida
O resolver retorna:
- adapter selecionado;
- metadados do adapter;
- razao da selecao;
- eventuais warnings de compatibilidade.

## 8. Product Context
### 8.1 Estrutura
O Product Context deve conter:
- Tenant
- Opportunity
- Master Catalog
- Commercial Context
- Execution Context
- Provider Context
- SimulationRequest
- SimulationMetadata

### 8.2 Papel
O contexto representa a unidade de execucao de um produto especifico dentro da simulacao. Ele nao e o request puro e nao e a resposta pura; e a moldura operacional do adapter.

### 8.3 Regra
O contexto deve ser montado antes da adaptacao e nao deve incluir calculo de negocio.

## 9. Product Metadata
### 9.1 Campos oficiais
- `productId`
- `subproductId`
- `version`
- `engineVersion`
- `catalogVersion`
- `capabilities`
- `supportedProviders`
- `supportedChannels`
- `supportedCollateral`
- `featureFlags`

### 9.2 Papel
Metadados documentam o comportamento do adapter e seus limites operacionais.

### 9.3 Uso
Servem para:
- resolucao;
- auditoria;
- versionamento;
- compatibilidade;
- feature gating;
- reporte tecnico.

## 10. Capabilities
### 10.1 Capabilities exemplo
- `supportsVehicle()`
- `supportsProperty()`
- `supportsFGTS()`
- `supportsPayroll()`
- `supportsEnergy()`
- `supportsInsurance()`
- `supportsGuarantor()`
- `supportsProvider()`

### 10.2 Papel
Capabilities descrevem o que o adapter consegue operar, nao o que ele calcula.

### 10.3 Regra
Capabilities devem ser booleanas, deterministicas e orientadas ao contrato, nao a tela.

## 11. Validators
### 11.1 Niveis de validacao
- pre-simulacao
- pre-provider
- pre-ranking
- pre-proposal

### 11.2 Objetivo
Separar validacoes de:
- integridade de entrada;
- capacidade de produto;
- elegibilidade;
- adequacao de provider;
- prontidao para proposta.

### 11.3 Regras
- Validator nao calcula.
- Validator nao persiste.
- Validator nao monta PDF.
- Validator nao altera contrato.

## 12. Policies
### 12.1 Tipos oficiais
- `CommercialPolicy`
- `ProviderPolicy`
- `EligibilityPolicy`
- `RankingPolicy`

### 12.2 Papel
Policies definem regras de decisao e admissibilidade. Elas podem bloquear, orientar ou restringir o uso de um adapter, mas nao substituem o engine de calculo.

### 12.3 Limite
Policies devem ser plugaveis por produto e subproduto, e nao por tela.

## 13. Fluxo de Execucao
### 13.1 Sequencia oficial
```mermaid
flowchart LR
  A[Master Catalog] --> B[Product Registry]
  B --> C[Product Resolver]
  C --> D[Product Adapter]
  D --> E[Simulation Engine]
  E --> F[SimulationResult]
```

### 13.2 Execucao detalhada
1. Master Catalog informa produto, subproduto e taxonomia.
2. Product Registry encontra adapters registrados.
3. Product Resolver escolhe o adapter correto.
4. Adapter normaliza contexto e valida capacidades.
5. Adapter aplica validators e policies.
6. Adapter monta `SimulationRequest` e envelope.
7. Simulation Engine calcula o resultado.
8. Adapter monta `SimulationSnapshot`, metadata, audit e proposal references.
9. Consumos posteriores leem somente o contrato pronto.

## 14. Registro de Produtos
### 14.1 Estrutura recomendada
`backend/src/modules/simulation/products/`

### 14.2 Base
- `base/simulation-product.adapter.ts`
- `base/simulation-product.context.ts`
- `base/simulation-product.registry.ts`
- `base/simulation-product.resolver.ts`
- `base/simulation-product.types.ts`
- `base/simulation-product.metadata.ts`
- `base/simulation-product.capability.ts`
- `base/simulation-product.policy.ts`

### 14.3 Familias de produto
- `loan-with-collateral/`
- `consignado/`
- `energia/`
- `fgts/`
- `cdc/`
- `financiamento/`
- `seguros/`
- `consorcio/`

### 14.4 Ordem de registro
Os adapters devem ser registrados por produto e subproduto, com fallback de compatibilidade para familias adjacentes.

## 15. Estrategia de Extensao
### 15.1 Regra
Novos produtos entram por novo adapter, nao por alteracao invasiva no core do engine.

### 15.2 Processo
1. Definir product metadata.
2. Definir capabilities.
3. Definir validators.
4. Definir policies.
5. Registrar adapter.
6. Validar compatibilidade.
7. Ativar em runtime.

### 15.3 Beneficio
Cada produto passa a ter fronteira explicita, reduzindo drift entre catalogo, UI, engine e provider.

## 16. Compatibilidade
### 16.1 O que permanece funcionando
- `backend/src/modules/simulation/acl/*`
- `backend/src/modules/simulation/contracts/*`
- `backend/src/modules/simulation/execution/*`
- `backend/src/modules/simulation/snapshots/*`
- `backend/src/modules/simulation/domain/*`
- `src/data/catalogRepository.ts`
- `src/data/creditPfCatalog.ts`
- `src/data/commercialRepository.ts`

### 16.2 Regra
O blueprint nao substitui os contratos existentes. Ele adiciona a camada de adaptacao oficial para a proxima migração.

### 16.3 Compatibilidade esperada
- caminhos legados continuam operando;
- o adapter novo pode coexistir com o legado;
- a migracao acontece por produto, nao por big bang.

## 17. Limites da Arquitetura
- Nao implementar regras financeiras aqui.
- Nao persistir resultado de negocio nesta fase.
- Nao alterar Proposal/PDF.
- Nao remover contrato legado.
- Nao misturar responsabilidade de UI com responsabilidade de adapter.
- Nao criar dependencia entre produtos.

## 18. Roadmap de Migração
### 18.1 Ordem oficial
1. Loan With Collateral
2. Auto Equity
3. Home Equity
4. Consignado
5. FGTS
6. Energia
7. CDC
8. Financiamento
9. Consorcio
10. Seguros

### 18.2 Lado a lado
Cada produto deve migrar com:
- adapter;
- registry entry;
- resolver rule;
- validator set;
- policy set;
- testes de contrato;
- compatibilidade preservada.

### 18.3 Critério de troca
Somente apos substituto validado e snapshot/contract bridge estavel e que um produto pode passar a usar a nova superficie como preferencial.

## 19. Critério de Encerramento
A Fase 3.4A encerra quando:
1. o blueprint estiver documentado;
2. a estrutura de pastas e contratos basicos estiver definida;
3. o registry e resolver estiverem modelados;
4. os validators e policies estiverem especificados;
5. a ordem de migração estiver aprovada;
6. a compatibilidade com o legado estiver preservada;
7. frontend e backend seguirem compilando e testando com sucesso.

## 20. Status Final
**GO WITH RESTRICTIONS**

### Justificativa
- A arquitetura dos adapters foi definida sem mexer em calculo financeiro.
- O contrato canônico, o bridge e o snapshot ja existem como base.
- A migracao de produto passa a ter uma fronteira oficial e segura.
- A implementacao funcional deve comecar apenas na Fase 3.4B, com `Empréstimo com Garantia` como primeiro caso.

## Matrizes
### Produto x Adapter
| Produto | Adapter oficial | Estado |
| --- | --- | --- |
| Loan With Collateral | `loan-with-collateral` | Blueprint |
| Auto Equity | `loan-with-collateral/auto-equity` | Blueprint |
| Home Equity | `loan-with-collateral/home-equity` | Blueprint |
| Consignado | `consignado` | Compatibilidade |
| FGTS | `fgts` | Compatibilidade |
| Energia | `energia` | Compatibilidade |
| CDC | `cdc` | Compatibilidade |
| Financiamento | `financiamento` | Compatibilidade |
| Consorcio | `consorcio` | Compatibilidade |
| Seguros | `seguros` | Compatibilidade |

### Produto x Capabilities
| Produto | Vehicle | Property | FGTS | Payroll | Energy | Insurance | Guarantor | Provider |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Loan With Collateral | Sim | Sim | Nao | Nao | Nao | Nao | Opcional | Sim |
| Auto Equity | Sim | Nao | Nao | Nao | Nao | Nao | Opcional | Sim |
| Home Equity | Nao | Sim | Nao | Nao | Nao | Nao | Opcional | Sim |
| Consignado | Nao | Nao | Nao | Sim | Nao | Nao | Sim | Sim |
| FGTS | Nao | Nao | Sim | Nao | Nao | Nao | Opcional | Sim |
| Energia | Nao | Nao | Nao | Nao | Sim | Nao | Nao | Sim |
| CDC | Sim | Opcional | Nao | Nao | Nao | Nao | Nao | Sim |
| Financiamento | Sim | Sim | Nao | Nao | Nao | Nao | Opcional | Sim |
| Consorcio | Opcional | Opcional | Nao | Nao | Nao | Nao | Nao | Sim |
| Seguros | Nao | Nao | Nao | Nao | Nao | Sim | Nao | Sim |

### Produto x Providers
| Produto | Providers suportados | Observacao |
| --- | --- | --- |
| Loan With Collateral | Bancos, correspondentes, canal digital | Depende de catalogo e policy |
| Auto Equity | Bancos e canais com garantia veicular | Canal e provider podem variar por catalogo |
| Home Equity | Bancos e correspondentes imobiliarios | Depende de colateral e elegibilidade |
| Consignado | Bancos, corbans e canais conveniados | Forte dependencia de convenio |
| FGTS | Providers com suporte ao fluxo FGTS | Exige policy especifica |
| Energia | Comercializadoras / parceiros de energia | Pode depender de provider especializado |
| CDC | Bancos e financeiras | Forte dependencia de risk policy |
| Financiamento | Bancos e financeiras | Pode variar por ativo e canal |
| Consorcio | Administradoras | Regras de grupo/lance |
| Seguros | Seguradoras / parceiros | Regras de cobertura e produto |

### Produto x Policies
| Produto | CommercialPolicy | ProviderPolicy | EligibilityPolicy | RankingPolicy | Validator |
| --- | --- | --- | --- | --- | --- |
| Loan With Collateral | Sim | Sim | Sim | Sim | Sim |
| Auto Equity | Sim | Sim | Sim | Sim | Sim |
| Home Equity | Sim | Sim | Sim | Sim | Sim |
| Consignado | Sim | Sim | Sim | Sim | Sim |
| FGTS | Sim | Sim | Sim | Sim | Sim |
| Energia | Sim | Sim | Sim | Sim | Sim |
| CDC | Sim | Sim | Sim | Sim | Sim |
| Financiamento | Sim | Sim | Sim | Sim | Sim |
| Consorcio | Sim | Sim | Sim | Sim | Sim |
| Seguros | Sim | Sim | Sim | Sim | Sim |

### Produto x Validator
| Produto | Pre-simulacao | Pre-provider | Pre-ranking | Pre-proposal |
| --- | --- | --- | --- | --- |
| Loan With Collateral | Sim | Sim | Sim | Sim |
| Auto Equity | Sim | Sim | Sim | Sim |
| Home Equity | Sim | Sim | Sim | Sim |
| Consignado | Sim | Sim | Sim | Sim |
| FGTS | Sim | Sim | Sim | Sim |
| Energia | Sim | Sim | Sim | Sim |
| CDC | Sim | Sim | Sim | Sim |
| Financiamento | Sim | Sim | Sim | Sim |
| Consorcio | Sim | Sim | Sim | Sim |
| Seguros | Sim | Sim | Sim | Sim |
