# ARCH-037 - Commercial Structure Ownership Blueprint

## 1. Contexto
A FINQZ PRO consolidou uma diretriz arquitetural clara:

- Estrutura Comercial é o Catálogo Mestre.
- Produto não é Pipeline.
- Opportunity conecta:
  - Customer
  - Produto/Subproduto/Modalidade
  - Pipeline
- Backend First.
- Single Source of Truth.
- Sem duplicidade.
- Sem legado novo.

A auditoria H-03A mostrou que o backend já é owner real de `CommercialTable` e `CommercialCondition`, mas o frontend ainda mantém ownership parcial e legado operacional para Produto, Subproduto, Modalidade e parte do fluxo do Simulador e da Estrutura Comercial.

Este blueprint formaliza o ownership oficial e o caminho de consolidação para que a Estrutura Comercial deixe de ser híbrida.

## 2. Problema Atual
Hoje existem múltiplas fontes concorrentes para o mesmo domínio:

- `creditPfCatalog` ainda é usado como base funcional para Produto/Subproduto/Modalidade.
- `catalogRepository` ainda funciona como adapter e também como persistência transitória de pipeline settings.
- `commercialRepository` ainda mantém providers, commercial tables e commercial conditions em `localStorage` para compatibilidade com UI legada e Simulador.
- `TabelasComerciais` consome backend oficial para tables/conditions, mas ainda depende de fallback local.
- `Simulador` depende fortemente de `commercialRepository`.
- `Oportunidades` ainda usa catálogo local para relacionamentos de produto e alguns caminhos legados.

Resultado:
- Há duplicidade de verdade.
- Há modelagem semântica compartilhada entre domínio comercial e pipeline.
- A UI ainda depende de adaptadores locais para funcionar.
- O backend ainda não assume plenamente o catálogo mestre.

## 3. Estado Atual (AS-IS)
### Backend
O backend já possui:
- `CommercialTable`
- `CommercialCondition`
- endpoints oficiais em `/api/v1/commercial/tables` e `/api/v1/commercial/tables/:id`
- criação, atualização, exclusão e replace de conditions
- Prisma persistindo `commercial_tables` e `commercial_conditions`

Por outro lado:
- não existe contrato backend oficial para Produto, Subproduto e Modalidade como catálogo mestre
- não existe API oficial de catálogo comercial unificado para substituir `creditPfCatalog`
- `commercialRepository` ainda é necessário para cenários legados e Simulador

### Frontend
O frontend ainda mantém:
- `creditPfCatalog` como base funcional de catálogo
- `catalogRepository` como camada adaptadora e fallback de pipeline settings
- `commercialRepository` como storage local operacional
- `EstruturaComercial` montada a partir de catálogo local
- `Simulador` operando sobre catálogo e storage local
- `Oportunidades` ainda combinando backend oficial com catálogo legado

## 4. Estado Futuro (TO-BE)
O estado futuro deve ser backend-first e unificado:

- Produto, Subproduto e Modalidade passam a ser governados por backend oficial.
- `CommercialTable` e `CommercialCondition` continuam backend-owned e passam a ser o núcleo operacional da Estrutura Comercial.
- O frontend deixa de ser owner de catálogo comercial.
- `Simulador` passa a consumir o catálogo oficial e as tabelas oficiais.
- `Oportunidades` passa a usar catálogo mestre oficial para seleção e validação sem fallback operacional.
- `creditPfCatalog`, `catalogRepository` e `commercialRepository` deixam de ser fonte de verdade e viram, no máximo, compatibilidade temporária durante migração.

## 5. Ownership Matrix
| Domínio | Owner Atual | Owner Futuro | Observação |
|---|---|---|---|
| Produto | `creditPfCatalog` / frontend | Backend | Catálogo mestre oficial |
| Subproduto | `creditPfCatalog` / frontend | Backend | Parte do catálogo mestre |
| Modalidade | `creditPfCatalog` / frontend | Backend | Parte do catálogo mestre |
| CommercialTable | Backend + fallback local | Backend | Já existe persistência oficial |
| CommercialCondition | Backend + fallback local | Backend | Já existe persistência oficial |
| Simulador | Frontend + `commercialRepository` | Backend para dados, frontend para UX | Simulador é consumidor, não owner |
| Oportunidades | Híbrido backend + legado local | Backend para dados, frontend para apresentação | Deve consumir catálogo oficial |

## 6. Backend Responsibilities
O backend deve ser o owner oficial da Estrutura Comercial.

### Responsabilidades mínimas
- Persistir e servir:
  - Produto
  - Subproduto
  - Modalidade
  - CommercialTable
  - CommercialCondition
- Garantir:
  - isolamento por tenant
  - consistência transacional
  - validação de integridade
  - ordenação e filtros estáveis
  - contratos de API claros e versionáveis
- Ser a fonte única para o que é comercialmente operacional.

### Responsabilidades futuras desejáveis
- CRUD oficial de catálogo mestre
- endpoints de consulta de Produto/Subproduto/Modalidade
- associação oficial entre catálogo mestre e tabelas comerciais
- validação server-side de integridade entre tabela, condição e catálogo

## 7. Frontend Responsibilities
O frontend deve ser consumidor e renderizador, não owner do domínio.

### Responsabilidades mínimas
- Exibir dados do catálogo mestre vindo do backend
- Renderizar tabelas comerciais e conditions vindas da API oficial
- Manter apenas estado de interface:
  - filtros
  - modais
  - seleção
  - paginação
  - drag state
- Não persistir dados operacionais de catálogo em `localStorage`
- Não manter regra de negócio paralela para Produto, Subproduto, Modalidade

### O que deve desaparecer do frontend
- catálogos operacionais locais
- resoluções Produto -> Pipeline via heurística
- fallback localStorage para tabela/condição comercial
- helpers locais que simulam fonte oficial
- store paralelo para entidade comercial mestre

## 8. Master Catalog Strategy

### `creditPfCatalog`
Hoje:
- é a base funcional para Produto/Subproduto/Modalidade
- é usado como fonte prática de dropdowns, mapeamentos e select helpers
- não é arquitetura final

Classificação:
- **catálogo legado**
- **compatibilidade transitória**
- nunca deve ser tratado como source of truth final

### `catalogRepository`
Hoje:
- funciona como camada adaptadora local
- reexporta helpers de `creditPfCatalog`
- também mantém pipeline settings em `localStorage`
- mistura funções de catálogo com funções de configuração visual

Classificação:
- **adapter transitório**
- **compatibilidade legada**
- não é owner do catálogo mestre

### `commercialRepository`
Hoje:
- mantém providers, commercial tables e conditions em `localStorage`
- atende fallback de UI legada
- sustenta o Simulador e partes de Tabelas Comerciais
- usa `creditPfCatalog` como fonte transitória para inicialização

Classificação:
- **fallback/localStorage**
- **adapter legada**
- não é source of truth

### Diretriz
O catálogo mestre deve sair do frontend e passar a ser backend-owned.
Enquanto isso não existir, os arquivos acima permanecem apenas como transição controlada.

## 9. Simulador Strategy
O Simulador é consumidor direto da Estrutura Comercial e não deve ser owner de dados comerciais.

### Situação desejada
- Simulador lê:
  - Produto
  - Subproduto
  - Modalidade
  - provider/commercial tables
  - conditions oficiais
- Simulador não cria verdade paralela.
- Simulador não depende de `localStorage` como fonte operacional.

### Estratégia
1. Centralizar o catálogo mestre no backend.
2. Fazer o Simulador consumir o catálogo oficial.
3. Usar tabelas comerciais oficiais para cálculo e recomendação.
4. Remover gradualmente o uso de repository local.
5. Manter apenas estado de UI e cache transitório, se necessário.

## 10. Opportunity Integration Strategy
A integração com Opportunity deve seguir o modelo oficial:

- Opportunity conecta:
  - Customer
  - Produto/Subproduto/Modalidade
  - Pipeline
- Product selection não pode resolver pipeline por heurística local.
- Oportunidades deve usar o catálogo mestre oficial para:
  - seleção
  - validação
  - resolução de domínio
- O frontend deve apenas apresentar e transmitir o contrato oficial.

### Estratégia
- Remover a dependência de mapeamentos legados.
- Consolidar a seleção comercial em contrato backend.
- Impedir duplicidade entre Estrutura Comercial e fluxo de criação de Opportunity.
- Garantir que a criação de Opportunity use dados canônicos do backend.

## 11. Migration Phases
### Fase 1 - Ownership oficial
- Formalizar backend como owner de Produto, Subproduto, Modalidade, CommercialTable e CommercialCondition.
- Congelar novas extensões de `creditPfCatalog` e `commercialRepository`.
- Interromper qualquer expansão de domínio no frontend.

### Fase 2 - Contrato backend catálogo
- Definir API oficial para catálogo mestre.
- Expor endpoints de leitura para Produto/Subproduto/Modalidade.
- Integrar com tabelas comerciais oficiais.

### Fase 3 - Migração consumidores
- Migrar `Simulador`.
- Migrar `EstruturaComercial`.
- Migrar `TabelasComerciais`.
- Migrar `Oportunidades` para depender somente do catálogo oficial.

### Fase 4 - Remoção compatibilidade
- Retirar usos operacionais de `creditPfCatalog`.
- Retirar uso operacional de `commercialRepository`.
- Retirar fallback de `localStorage`.
- Retirar heurísticas de catálogo e pipeline legadas.

### Fase 5 - Cleanup final
- Remover código legado e adapters obsoletos.
- Consolidar testes.
- Garantir que o backend seja a única verdade do domínio comercial.

## 12. Riscos
- Quebra de Simulador se o fallback local for removido antes da API oficial estar completa.
- Perda de compatibilidade em `Oportunidades` se o catálogo mestre ainda estiver só no frontend.
- Divergência entre tabelas comerciais oficiais e dados locais.
- Manutenção de dois owners simultâneos aumenta custo e fragilidade.
- Remoção prematura de `creditPfCatalog` pode quebrar seleção, navegação e imports legados.
- Remoção prematura de `commercialRepository` pode quebrar condições e simulações.
- Persistência local pode continuar sendo fonte de inconsistência operacional.

Classificação resumida:
- `creditPfCatalog` como legado operacional: **crítico**
- `commercialRepository`: **alto**
- Simulador sem backend substituto completo: **alto**
- Oportunidades ainda com catálogo legado: **alto**
- ausência de catálogo mestre backend: **crítico**

## 13. Decisão de Ownership
Produto -> Backend
Subproduto -> Backend
Modalidade -> Backend

CommercialTable -> Backend
CommercialCondition -> Backend

Simulador -> Frontend Consumer
Oportunidades -> Frontend Consumer

Ownership Transitório Atual:
Híbrido Controlado

Ownership Final:
Backend First

## 14. Decisão Arquitetural Final
**Backend é o owner oficial da Estrutura Comercial.**

### Decisão
- Produto, Subproduto e Modalidade pertencem ao backend.
- CommercialTable e CommercialCondition pertencem ao backend.
- Frontend é consumidor e renderizador.
- `creditPfCatalog` não é fonte oficial final.
- `catalogRepository` não é owner de domínio, apenas compatibilidade transitória.
- `commercialRepository` não é source of truth, apenas fallback legada temporária.
- O Simulador e Oportunidades devem consumir o catálogo oficial do backend.

### Conclusão
- Owner oficial do domínio comercial: **Backend**
- Owner de apresentação e interação: **Frontend**
- Owner transitório durante migração: **Híbrido controlado**
- Arquitetura final: **backend-first, sem duplicidade, sem fonte paralela de verdade**

## 15. Non-Goals
Este blueprint **NÃO**:

- cria novas tabelas Prisma;
- autoriza migrations;
- define implementação de CRUD;
- remove `creditPfCatalog` imediatamente;
- remove `commercialRepository` imediatamente;
- altera `Opportunity Intake`;
- altera `Commission V2`;
- altera `Settlement`;
- altera `RBAC`;
- altera `Provider Engine`.

Qualquer implementação decorrente deste blueprint deverá passar por auditoria específica e aprovação arquitetural posterior.
