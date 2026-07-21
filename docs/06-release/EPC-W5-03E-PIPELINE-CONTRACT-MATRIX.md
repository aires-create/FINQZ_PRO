# EPC-W5-03E - Pipeline Contract Matrix

## 1. Resumo

Este documento mapeia os estagios canonicos da consolidacao do pipeline e os artefatos que cada etapa produz ou consome.

## 2. Matriz

| Stage | Source | Output principal | Contract |
| --- | --- | --- | --- |
| artifactBuild | `scripts/build/build-frontend.sh` | `dist/` | SKIPPED na consolidacao, mantido para compatibilidade |
| releasePackage | `scripts/release/package-release.sh` | `release/artifact/` | SKIPPED na consolidacao, mantido para compatibilidade |
| releaseVerification | `scripts/release/verify-release.sh` | `release-verification.log` | Validacao do pacote entregue |
| deployDryRun | `scripts/deploy/deploy-engine.sh` | `dry-run.json` | Simulacao sem deploy real |
| runtimeValidation | `scripts/runtime/runtime-validator.sh` | `runtime-summary.json` | Validacao operacional local |
| releaseGate | `scripts/gate/release-gate.sh` | `release-gate-summary.json` | Gate de decisao da release |
| evidenceValidation | `scripts/consolidation/evidence-validator.sh` | `evidence-validation.json` | Confirma a completude das evidencias |
| portabilityValidation | `scripts/consolidation/portability-validator.sh` | `portability-validation.json` | Confirma portabilidade dos metadados |
| contractValidation | `scripts/consolidation/contract-validator.sh` | `stage-contract-results.json` | Normaliza o contrato final do pipeline |

## 3. Regras de Integridade

- `releaseVerification`, `deployDryRun`, `runtimeValidation` e `releaseGate` devem existir antes da consolidacao final.
- `evidenceValidation` e `portabilityValidation` podem registrar warnings sem bloquear a trilha, dependendo da politica.
- `contractValidation` nao pode depender de si mesmo, apenas dos estagios anteriores.
- Todos os registros precisam permanecer compativeis com o schema em `release/schemas/pipeline-stage-contract.schema.json`.

## 4. Observacoes

- Os stages `artifactBuild` e `releasePackage` sao registrados como skipped para preservar a compatibilidade da trilha sem refazer a origem do artefato.
- O summary final e gerado em `pipeline-consolidation-summary.json` para consumo automatizado.
- A decisao de promocao continua fora do escopo desta fase.
