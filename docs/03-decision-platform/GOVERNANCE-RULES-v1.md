# Governance Rules v1

## Status
Canonical

## Purpose
Este documento registra as regras de governanca arquitetural do EDP.

## Rules for New ADRs

- Novos ADRs devem tratar decisoes relevantes, duradouras e de risco arquitetural.
- ADRs devem ser criados antes de implementacao quando houver impacto estrutural.
- ADRs devem registrar contexto, decisao, consequencias, alternativas e roadmap impactado.
- Qualquer decisao que mude fronteira de dominio exige ADR.

## When ARB Is Mandatory

- quando houver risco de God Service;
- quando houver mudanca de bounded context;
- quando policy, strategy ou ranking forem alterados conceitualmente;
- quando provider governance for alterada;
- quando proposals ou events quebrarem compatibilidade;
- quando houver conflito entre documentos oficiais.

## When RR Is Mandatory

- quando a arquitetura estiver pronta para entrar em contracts before runtime;
- quando houver necessidade de validar prontidao de implementacao;
- quando um dominio estiver pronto para skeleton backend ou frontend migration.

## When a DCA Must Be Updated

- quando o dominio ganhar nova fronteira;
- quando houver novo subdominio estrategico;
- quando roadmap de dominio mudar;
- quando principios de governanca forem refinados;
- quando a estrategia documental exigir consolidacao.

## When a Contract May Be Born

- somente apos a arquitetura estar documentada;
- somente apos ADRs relevantes estarem publicados;
- somente apos boundaries estarem claros;
- somente apos security e observability estarem explicitadas;
- somente apos policy/strategy separation estar formalizada.

## When Runtime May Begin

- somente apos contracts before runtime;
- somente apos a fase de prontidao aprovada;
- somente apos o backlog de riscos arquiteturais criticos ser tratado;
- somente com SSOT, audit trail, tenant isolation e idempotency definidos.

## When Breaking Changes Require Review

- qualquer quebra de compatibilidade conceitual;
- qualquer mudanca em event catalog;
- qualquer alteracao em vocabulary canonico;
- qualquer redefinicao de policy/strategy;
- qualquer alteracao em Audit Center, Audit Timeline ou audit.event.recorded;
- qualquer mudanca de ownership entre dominios.

## When Policy May Change

- apenas por versao aprovada;
- com effective dating;
- com rollback possivel;
- com audit trail;
- com tenant scope.

## When Strategy May Change

- apenas por aprovacao formal;
- com vigencia definida;
- com auditoria;
- com consumo controlado por Decision Core, Ranking e Proposal Center.

## Versioning

- Versoes devem ser numeradas e preservadas.
- Mudancas relevantes nao substituem o historico.
- Estado anterior permanece auditavel.

## Blocking Principle

- Decisoes conflitantes com DCA, ADRs ou governance rules ficam bloqueadas ate nova Architecture Review.
