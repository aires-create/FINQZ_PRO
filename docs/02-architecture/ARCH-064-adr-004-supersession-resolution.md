# ARCH-064 — ADR-004 Supersession Resolution

Status: APPROVED

Fase: H-14G.1B

Data: Junho/2026

Owner: FINQZ PRO Enterprise Architecture

---

# 1. Objetivo

Registrar oficialmente a resolução de lineage arquitetural entre ADR-004 e a linha arquitetural consolidada posterior.

Este documento não cria novos domínios, contratos ou implementações.

Seu único objetivo é encerrar ambiguidades de ownership.

---

# 2. Contexto

Durante as auditorias:

* ARCH-062
* ARCH-063
* H-14G Documentary Consistency Audit

foi identificado que ADR-004 continha afirmações de ownership que não representam mais a arquitetura consolidada atual.

---

# 3. Resultado da Auditoria

Veredito:

PARTIALLY SUPERSEDED

ADR-004 permanece válido apenas como contexto histórico da transição do catálogo.

Suas afirmações normativas de ownership não devem mais ser utilizadas como fonte de decisão arquitetural.

---

# 4. Ownership Atual Consolidado

## Master Catalog

Owner:

Backend

Documentos de referência:

* ARCH-038
* ARCH-055

Responsável por:

* Segment
* Product
* Subproduct
* Modality

Responde:

"O que existe?"

---

## Commercial Structure Coverage

Documentos de referência:

* ARCH-057
* ARCH-058
* ARCH-059

Responsável por:

* cobertura operacional
* elegibilidade
* disponibilidade

Responde:

"Posso vender?"

---

## Commercial Tables

Documentos de referência:

* ARCH-060
* ARCH-061

Responsável por:

* tabelas
* campanhas
* condições
* taxas
* coeficientes

Responde:

"Em quais condições vendo?"

---

## Provider Engine

Responsável por:

* bancos
* promotoras
* originadores
* integrações

Responde:

"Quem executa?"

---

# 5. Resolução Oficial

ADR-004 deve permanecer apenas como contexto histórico da migração do catálogo comercial.

Suas afirmações de ownership da Estrutura Comercial foram supersedidas por ARCH-038 e ARCH-055.

A semântica operacional da Estrutura Comercial foi consolidada por:

* ARCH-057
* ARCH-058
* ARCH-059
* ARCH-060
* ARCH-061
* ARCH-062
* ARCH-063

---

# 6. Efeito desta Resolução

A partir deste documento:

* ADR-004 não deve ser utilizado para definir ownership atual.
* ADR-004 não deve ser utilizado para definir contratos futuros.
* ADR-004 pode ser utilizado apenas como contexto histórico.

---

# 7. Próximo Passo

Esta resolução remove o bloqueador documental identificado na H-14G.

Próxima fase autorizada:

Commercial Structure Canonical Contracts.

---

# 8. Veredito Final

ADR-004

Status Arquitetural:

PARTIALLY SUPERSEDED

Status Operacional:

HISTORICAL REFERENCE ONLY

ARCH-064 aprovado como resolução oficial de lineage arquitetural.
