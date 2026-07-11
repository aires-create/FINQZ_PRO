# FINQZ PRO Enterprise
## EPC-W4-01B - Catalog Freeze

**Title:** EPC-W4-01B - Catalog Freeze
**Document ID:** EPC-W4-01B-CATALOG-FREEZE
**Program:** EPC-W4 - SSOT Consolidation Program
**Wave:** EPC-W4-01B - Catalog Freeze
**Version:** 1.0
**Status:** ACTIVE
**Owner:** Enterprise Architect
**Classification:** Operational Architecture Freeze
**Approval Status:** PENDING
**Approved By:** PENDING
**Created Date:** 2026-07-11
**Last Updated Date:** 2026-07-11
**Supersedes:** None
**Authority Level:** Subordinate Operational Architecture Artifact
**Baseline Branch:** homologation/bootstrap-vps
**Baseline Commit:** bbd9646ac3402a4cc5ec38da52782d52632f4683

---

> Este documento e um artefato operacional subordinado.
>
> Ele nao substitui o DCA, o PCCD, as ADRs, o inventario EPC-W4-01A, o Runtime Governance nem as politicas de governanca documental.
> Em caso de conflito, prevalece sempre o documento de maior autoridade.
>
> `Approval Status: PENDING` significa que a validacao humana formal ainda nao foi concluida.
> `ACTIVE` significa que o documento ja esta em uso corrente para orientar o freeze operacional.
> O freeze documental nao autoriza mudanca de codigo, promocao de produto, dual read, switch ou remocao de legado.

## 1. Objetivo do Freeze

Estabelecer o congelamento formal da expansao das fontes historicas de catalogo durante a consolidacao EPC-W4.

Este freeze nao remove componentes, nao altera arquitetura e nao antecipa a Wave 02.

Ele existe para impedir:

- adicao de novos produtos ao legado;
- criacao de novas taxonomias locais;
- criacao de novos aliases locais;
- criacao de novos consumers legados;
- expansao do legado de catalogo fora do inventario oficial.

## 2. Escopo

### Incluido no Freeze

- creditPfCatalog
- catalogRepository
- commercialRepository, somente na camada de catalogo e compatibilidade
- stores legadas de catalogo
- arrays locais de produtos
- enums locais de produtos
- aliases locais
- taxonomias locais
- listas hardcoded de subprodutos

### Abrangencia operacional

O freeze vale para qualquer superficie que consuma ou amplie taxonomia historica de catalogo, incluindo:

- frontend
- runtime
- repositories
- stores
- mappers legados
- adapters legados
- documentos de apoio que descrevam consumo historico

## 3. Fora do Escopo

Ficam fora deste freeze:

- implementacao funcional;
- refactor;
- promocao de produto;
- dual read;
- switch;
- shadow expansion;
- remocao de legado;
- deploy;
- VPS;
- Docker;
- Nginx;
- CI;
- migrations;
- criacao de feature flags;
- criacao de Catalog Resolver;
- criacao de novos adapters ou mappers;
- criacao de novos produtos.

## 4. Fontes Congeladas

As fontes abaixo ficam congeladas para expansao:

| Fonte | Status de Freeze | Regra aplicada |
| --- | --- | --- |
| `src/data/creditPfCatalog.ts` | Congelada para expansao | Proibido adicionar novos produtos, subprodutos, aliases ou taxonomias locais |
| `src/data/catalogRepository.ts` | Congelada para expansao | Proibido ampliar o legado ou criar nova fonte paralela |
| `src/data/commercialRepository.ts` | Congelada somente na camada de catalogo | Proibido expandir taxonomia local, listas hardcoded e aliases de catalogo |
| stores legadas de catalogo | Congeladas para expansao | Proibido adicionar novos estados ou taxonomias de catalogo |
| arrays locais de produtos | Congelados para expansao | Proibido adicionar novos itens canônicos fora do inventario |
| enums locais de produtos | Congelados para expansao | Proibido criar novos valores sem autoridade formal |
| aliases locais | Congelados para expansao | Proibido criar novos aliases sem decisao arquitetural |
| taxonomias locais | Congeladas para expansao | Proibido ampliar taxonomia historica por conveniencia de UI |
| listas hardcoded de subprodutos | Congeladas para expansao | Proibido adicionar novos subprodutos sem origem oficial |

O freeze nao significa remocao.

Significa apenas que a expansao do legado esta proibida ate nova decisao formal.

## 5. Fontes Oficiais

As fontes abaixo permanecem permitidas:

- Master Catalog
- Prisma
- seed oficial
- Runtime oficial
- Shadow Runtime
- documentacao oficial
- inventario EPC-W4-01A

## 6. Operacoes Proibidas

Enquanto o freeze estiver vigente, fica proibido:

1. adicionar novos produtos em fontes historicas;
2. adicionar novas taxonomias locais;
3. adicionar novos aliases locais;
4. adicionar novos consumers legados;
5. expandir `creditPfCatalog`;
6. expandir `catalogRepository` como nova verdade;
7. expandir `commercialRepository` na camada de catalogo;
8. criar novos arrays hardcoded para catalogo;
9. promover fonte historica a fonte oficial sem aprovacao formal;
10. usar congelamento como justificativa para remover legado antes de tempo;
11. tratar o freeze como autorizacao para refactor estrutural;
12. tratar o freeze como autorizacao para dual read ou switch;
13. tratar o freeze como autorizacao para remover componentes legados.

## 7. Operacoes Permitidas

As operacoes abaixo permanecem permitidas:

1. ler fontes congeladas para rastreabilidade;
2. consultar o inventario EPC-W4-01A;
3. manter compatibilidade operacional sem expandir legado;
4. registrar evidencias de consumo;
5. ajustar documentacao subordinada;
6. preparar criterios para a Wave 02;
7. manter runtime oficial e Shadow Runtime sem criar novas taxonomias;
8. atualizar mapeamento documental e matriz de leitura.

## 8. Processo de Excecao

Qualquer excecao ao freeze exige:

- justificativa tecnica;
- ADR, quando aplicavel;
- atualizacao do inventario EPC-W4-01A;
- aprovacao arquitetural formal.

Sem esses elementos, a excecao deve ser considerada nao autorizada.

## 9. Responsabilidades

### Architecture / Enterprise Architect

- validar o congelamento documental;
- decidir excecoes arquiteturais;
- manter a subordinação ao DCA e ao PCCD.

### Governance

- manter a indexacao documental;
- preservar a rastreabilidade do freeze;
- evitar duplicidade de autoridade.

### Runtime / Engineering

- obedecer ao freeze;
- nao criar expansao de legado;
- registrar evidencias quando houver consumo historico.

### Owners de dominio

- revisar impactos;
- reportar consumidores criticos;
- sinalizar lacunas para a Wave 02.

## 10. Critérios para Início da Wave 02

A promocao ao Master Catalog somente pode iniciar quando todos os itens abaixo forem verdadeiros:

- Freeze aprovado;
- inventario EPC-W4-01A aprovado;
- consumidores criticos classificados;
- rollback definido;
- criterios de aceite da W4-01A atendidos.

Se qualquer item faltar, a Wave 02 permanece bloqueada.

## 11. Critérios para Saida do Freeze

O freeze somente pode ser encerrado quando houver decisao formal que permita uma das alternativas abaixo:

- promover componente historico para fonte oficial;
- substituir fonte historica por fonte oficial;
- retirar componente historico com rollback e evidencias;
- reclassificar o escopo do freeze por ADR.

Sem decisao formal, o freeze continua ativo.

## 12. Critérios de Rollback

Todo rollback associado ao freeze deve preservar:

- o estado historico anterior;
- o inventario EPC-W4-01A;
- a rastreabilidade entre fonte historica e fonte oficial;
- a possibilidade de retorno sem perda de taxonomia.

Rollback sem evidência e sem owner nao e considerado valido.

## 13. Relação com as Waves Seguintes

### W4-02 - Master Catalog Promotion

A Wave 02 depende da aprovacao do freeze e da aprovacao do inventario.

### W4-03 - Consumer Normalization

Somente pode iniciar com fontes congeladas e consumers criticos classificados.

### W4-04 - Dual Read

Somente pode ocorrer depois de freeze formal, inventario aprovado e rollback definido.

### W4-05 - Shadow Validation

Permanece subordinada ao runtime oficial e nao autoriza expansao do legado congelado.

### W4-06 - Controlled Switch

Nao pode ocorrer enquanto o freeze nao tiver criterios formais de liberacao.

### W4-07 - Legacy Removal

Nao pode ser antecipada por este documento.
Remocao exige decisao posterior, aprovacao formal e evidencias proprias.

## 14. Referencias Normativas

- [DCA-FINQZ-PRO-ENTERPRISE-v2.md](../00-master/DCA-FINQZ-PRO-ENTERPRISE-v2.md)
- [PCCD-FINQZ-PRO-ENTERPRISE.md](../00-master/PCCD-FINQZ-PRO-ENTERPRISE.md)
- [RUN-001-RUNTIME_GOVERNANCE.md](../03-runtime/RUN-001-RUNTIME_GOVERNANCE.md)
- [DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA.md](../08-governance/DOC-GOV-01-COMANDO-MESTRE-CONTINUIDADE-TECNICA.md)
- [EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md](../01-architecture/EPC-W4-01-CONSUMER-CANONICAL-INVENTORY.md)
- [DOCUMENT-LIFECYCLE.md](../08-governance/DOCUMENT-LIFECYCLE.md)
- [DOCUMENT-CHANGE-POLICY.md](../08-governance/DOCUMENT-CHANGE-POLICY.md)
- [DOCUMENT-NAMING-STANDARD.md](../08-governance/DOCUMENT-NAMING-STANDARD.md)
- [DOCUMENT-OWNERSHIP.md](../08-governance/DOCUMENT-OWNERSHIP.md)
