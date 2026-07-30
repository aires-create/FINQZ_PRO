# ARCH-061 — Commercial Tables UX & Navigation Architecture

Status: APPROVED

Fase: H-14C

Data: Junho/2026

Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Definir a arquitetura oficial de navegação, experiência operacional e consumo das Commercial Tables.

Este documento estabelece:

* Navegação oficial
* Ownership de UX
* Fluxos operacionais
* Integração com Coverage
* Integração com Provider Engine
* Integração com Simulator
* Regras de Versionamento UX
* Regras Anti-Legado

---

# 2. Princípio Fundamental

Commercial Tables respondem:

> "Em quais condições vendo?"

A UX não deve permitir que o usuário interprete Commercial Tables como:

* Catálogo
* Elegibilidade
* Cobertura
* Comissão Final
* Simulador

---

# 3. Modelo de Navegação Oficial

Menu:

Estrutura Comercial
└── Tabelas Comerciais

---

# 4. Estratégia de Navegação

Decisão arquitetural:

Provider First + Product Context

Motivo:

A origem operacional das tabelas é o Provider.

O usuário normalmente procura:

"Qual tabela do PAN?"

"Qual tabela do C6?"

"Qual tabela da Facta?"

e não:

"Qual tabela do produto?"

---

# 5. Hierarquia de Visualização

Commercial Table

Representa:

Provider
+
Produto
+
Subproduto
+
Modalidade
+
Vigência

Exemplo:

PAN
└── Consignado
└── Empréstimo Consignado
└── Portabilidade

---

# 6. Tela Principal

Lista de Tabelas Comerciais

Colunas obrigatórias:

* Provider
* Produto
* Subproduto
* Modalidade
* Código
* Nome
* Vigência
* Status
* Quantidade de Condições

Ações:

* Visualizar
* Editar
* Duplicar
* Arquivar

---

# 7. Filtros Oficiais

Filtros obrigatórios:

* Provider
* Produto
* Subproduto
* Modalidade
* Status
* Vigência

Busca:

* Nome
* Código

---

# 8. Status UX

Lifecycle oficial:

DRAFT

ACTIVE

SUSPENDED

EXPIRED

ARCHIVED

Estados técnicos não devem ser exibidos.

DELETED não aparece na UX.

---

# 9. Criação de Tabela

Fluxo:

Selecionar Provider
↓
Selecionar Produto
↓
Selecionar Subproduto
↓
Selecionar Modalidade
↓
Definir Vigência
↓
Adicionar Condições
↓
Salvar

---

# 10. Edição

Edição nunca deve reescrever histórico.

Se tabela estiver ACTIVE:

Editar
↓
Criar Nova Versão

Não alterar versão vigente.

---

# 11. Duplicação

Ação obrigatória.

Fluxo:

Tabela Existente
↓
Duplicar
↓
Nova Versão Draft

---

# 12. Versionamento UX

Modelo oficial:

Versão Atual

Versões Anteriores

Campos:

* Versão
* Data Inicial
* Data Final
* Status

Histórico somente leitura.

---

# 13. Integração com Coverage

Coverage permanece domínio separado.

Regra:

Tabela ativa sem cobertura válida não pode ser utilizada operacionalmente.

UX deve exibir:

"Cobertura indisponível"

sem permitir uso operacional.

---

# 14. Integração com Provider Engine

Provider é obrigatório.

Commercial Table deve exibir:

* Provider
* Tipo de Provider
* Status

Não exibir regras internas do provider.

---

# 15. Integração com Simulator

Simulator consome Commercial Tables.

Commercial Tables não executam simulação.

UX pode oferecer:

"Simular"

como atalho de navegação.

A lógica permanece no Simulator.

---

# 16. Integração com Comissão

Commercial Table exibe:

* Comissão Base
* Comissão Comercial

Não exibe:

* Split Hierárquico
* Repasse
* Liquidação

Essas informações pertencem ao Commission Engine.

---

# 17. Fonte de Verdade

Fonte oficial:

Backend
↓
/api/v1/commercial
↓
PostgreSQL

Frontend apenas consome.

---

# 18. Legado Identificado

Achados H-14C:

* commercialRepository.ts
* localStorage fallback
* usingFallback
* loadLocalCommercialData

Classificação:

LEGADO TRANSICIONAL

---

# 19. Anti-Patterns Proibidos

É proibido:

* localStorage como fonte oficial
* commercialRepository como owner do domínio
* fallback silencioso
* provider como catálogo
* frontend calculando regras comerciais
* edição retroativa de versões

---

# 20. Evolução Permitida

Próximas fases poderão implementar:

* Versionamento real
* Histórico
* Campanhas
* Simulação contextual
* Integração Coverage
* Integração Provider Engine

Sem alterar ownership definido em ARCH-060.

---

# 21. Veredito Arquitetural

Commercial Tables UX adota navegação Provider First, consumo exclusivo da API oficial, histórico versionável, lifecycle explícito e integração controlada com Coverage, Provider Engine e Simulator.

A tela de Commercial Tables deve consumir exclusivamente o backend como fonte de verdade.

ARCH-061 aprovado como arquitetura oficial de UX e navegação do domínio Commercial Tables.
