# ARCH-003 — Domains Overview

Status: DRAFT
Owner: Architecture
Version: 0.1
Last Updated: 2026-06-03
Document Type: Architecture

---

## Objetivo

Definir os domínios oficiais do FINQZ PRO como plataforma SaaS Enterprise para correspondentes bancários, promotoras, financeiras, redes de parceiros e operações comerciais multiempresa.

Este documento substitui a visão anterior baseada em CRM genérico, Lead/Customer e BankProposal como centro do sistema.

---

## Domínios Core A — Estratégicos

### 1. Governança, Tenant e Segurança

Responsável por isolamento, usuários, organizações, RBAC, auditoria e contexto multi-tenant.

Elementos:

* Tenant
* Organization
* User
* Role
* Permission
* Membership
* AuditLog

---

### 2. Clientes

Fonte oficial de verdade para pessoas atendidas pela operação.

Elementos:

* Cliente
* Documento
* Dados cadastrais
* Contato
* Status cadastral
* Histórico

---

### 3. Parceiros

Responsável por parceiros comerciais, hierarquia, franquias, franqueados e escopo de visibilidade.

Elementos:

* Parceiro Master
* Franquia
* Franqueado
* Usuários vinculados
* Escopo comercial
* Hierarquia

---

### 4. Estrutura Comercial

Catálogo mestre oficial do FINQZ PRO.

Responsável por organizar produtos, subprodutos, modalidades e estrutura comercial base.

Hierarquia oficial:

Vertical
→ Produto
→ Subproduto
→ Modalidade

---

### 5. Tabelas Comerciais

Responsável pelas condições comerciais disponíveis para operação.

Depende da Estrutura Comercial e dos Providers.

Elementos:

* Tabela
* Plano
* Campanha
* Convênio
* Prazo
* Coeficiente
* Taxa
* Comissão
* Vigência

---

### 6. Providers

Responsável por fornecedores, originadores, bancos, fintechs, promotoras e integrações externas.

Provider não é produto.

Provider fornece condições, tabelas, simulações, propostas, esteiras ou pagamentos.

---

### 7. Oportunidades

Entidade central do FINQZ PRO.

Conecta:

* Cliente
* Parceiro
* Estrutura Comercial
* Tabela Comercial
* Provider
* Pipeline
* Simulação
* Operação
* Comissão

---

### 8. Pipeline

Fluxo operacional e comercial das oportunidades.

Pipeline não substitui Opportunity.

Pipeline organiza estágio, status, avanço e gestão do processo.

---

### 9. Simulador

Motor de cálculo, comparação, elegibilidade e viabilidade comercial.

Depende de:

* Cliente
* Estrutura Comercial
* Tabelas Comerciais
* Providers
* Regras comerciais

---

### 10. Comissões

Responsável por regras de comissão, previsão, cálculo, liberação, pagamento e rastreabilidade.

---

## Domínios Core B — Gestão

### Operações

Execução operacional pós-venda e acompanhamento de esteira.

### Dashboard

Indicadores executivos, comerciais e operacionais.

### Relatórios

Relatórios gerenciais, financeiros, comerciais e de auditoria.

---

## Domínios Core C — Congelados

Estes domínios existem no legado/frontend, mas não fazem parte da prioridade atual.

* Conversas
* Campanhas
* Audiências
* Eventos
* SDR IA

Status: congelado até decisão arquitetural explícita.

---

## Princípios de Segmentação

1. Um domínio deve ter uma única Source of Truth.
2. Frontend não define regra de negócio.
3. Backend é a camada de verdade operacional.
4. Tabelas Comerciais não são Catálogo Mestre.
5. Providers não são produtos.
6. Pipeline não substitui Opportunity.
7. Simulador não substitui Opportunity.
8. Estrutura Comercial é o Catálogo Mestre.
9. Opportunity é a entidade central do processo comercial.
10. Domínios congelados não devem receber evolução sem ADR.

---

## Critérios de Fronteira

* Cliente pertence ao domínio Clientes.
* Produto, Subproduto e Modalidade pertencem à Estrutura Comercial.
* Condições comerciais pertencem a Tabelas Comerciais.
* Integrações externas pertencem a Providers.
* Jornada comercial pertence a Oportunidades.
* Estágios pertencem ao Pipeline.
* Cálculo pertence ao Simulador.
* Pagamento e repasse pertencem a Comissões.
* Conversas, Campanhas, Audiências, Eventos e SDR IA permanecem congelados.

---

## Status

Este documento está em DRAFT até validação contra:

* ADR-004 Commercial Master Catalog
* ADR-005 Legacy YouWare Backend Classification
* ADR-006 Products Domain Decommission
* Runtime Governance
* Project Control Center
