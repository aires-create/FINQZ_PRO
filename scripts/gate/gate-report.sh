#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

stage_results_path=""
policy_evaluation_path=""
execution_metadata_path=""
summary_schema_path="${repo_root}/release/schemas/release-gate-summary.schema.json"
output_dir="${repo_root}/release/gate"
correlation_id=""
artifact_path=""
policy_path=""
environment=""
strict="false"
explain="false"
skip_http="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [gate-report] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  gate-report.sh --stage-results <path> --policy-evaluation <path> --execution-metadata <path> --summary-schema <path> --output <dir> --correlation-id <id> --artifact <path> --policy <path> --environment <name> [--strict] [--explain] [--skip-http]
EOF
}

main() {
  while (($#)); do
    case "$1" in
      --stage-results)
        [[ $# -ge 2 ]] || { log_line ERROR "--stage-results requires a value"; exit 18; }
        stage_results_path="$2"
        shift 2
        ;;
      --policy-evaluation)
        [[ $# -ge 2 ]] || { log_line ERROR "--policy-evaluation requires a value"; exit 18; }
        policy_evaluation_path="$2"
        shift 2
        ;;
      --execution-metadata)
        [[ $# -ge 2 ]] || { log_line ERROR "--execution-metadata requires a value"; exit 18; }
        execution_metadata_path="$2"
        shift 2
        ;;
      --summary-schema)
        [[ $# -ge 2 ]] || { log_line ERROR "--summary-schema requires a value"; exit 18; }
        summary_schema_path="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || { log_line ERROR "--output requires a value"; exit 18; }
        output_dir="$2"
        shift 2
        ;;
      --correlation-id)
        [[ $# -ge 2 ]] || { log_line ERROR "--correlation-id requires a value"; exit 18; }
        correlation_id="$2"
        shift 2
        ;;
      --artifact)
        [[ $# -ge 2 ]] || { log_line ERROR "--artifact requires a value"; exit 18; }
        artifact_path="$2"
        shift 2
        ;;
      --policy)
        [[ $# -ge 2 ]] || { log_line ERROR "--policy requires a value"; exit 18; }
        policy_path="$2"
        shift 2
        ;;
      --environment)
        [[ $# -ge 2 ]] || { log_line ERROR "--environment requires a value"; exit 18; }
        environment="$2"
        shift 2
        ;;
      --strict)
        strict="true"
        shift
        ;;
      --explain)
        explain="true"
        shift
        ;;
      --skip-http)
        skip_http="true"
        shift
        ;;
      --help|-h)
        usage
        exit 0
        ;;
      *)
        log_line ERROR "unknown argument: $1"
        exit 18
        ;;
    esac
  done

  [[ -f "${stage_results_path}" ]] || { log_line ERROR "stage results not found: ${stage_results_path}"; exit 18; }
  [[ -f "${policy_evaluation_path}" ]] || { log_line ERROR "policy evaluation not found: ${policy_evaluation_path}"; exit 18; }
  [[ -f "${execution_metadata_path}" ]] || { log_line ERROR "execution metadata not found: ${execution_metadata_path}"; exit 18; }
  [[ -f "${summary_schema_path}" ]] || { log_line ERROR "summary schema not found: ${summary_schema_path}"; exit 18; }
  [[ -n "${correlation_id}" ]] || { log_line ERROR "--correlation-id is required"; exit 18; }
  [[ -n "${artifact_path}" ]] || { log_line ERROR "--artifact is required"; exit 18; }
  [[ -n "${policy_path}" ]] || { log_line ERROR "--policy is required"; exit 18; }
  [[ -n "${environment}" ]] || { log_line ERROR "--environment is required"; exit 18; }

  mkdir -p "${output_dir}"

  STAGE_RESULTS_PATH="${stage_results_path}" \
  POLICY_EVALUATION_PATH="${policy_evaluation_path}" \
  EXECUTION_METADATA_PATH="${execution_metadata_path}" \
  SUMMARY_SCHEMA_PATH="${summary_schema_path}" \
  OUTPUT_DIR="${output_dir}" \
  CORRELATION_ID="${correlation_id}" \
  ARTIFACT_PATH="${artifact_path}" \
  POLICY_PATH="${policy_path}" \
  ENVIRONMENT="${environment}" \
  STRICT_MODE="${strict}" \
  EXPLAIN_MODE="${explain}" \
  SKIP_HTTP="${skip_http}" \
  node <<'NODE'
const fs = require('fs');
const path = require('path');

class GateError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const readJson = (filePath, label) => {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new GateError(18, `${label} is not valid JSON: ${filePath}`);
  }
};

const validateSummary = (summary, schemaPath) => {
  const schema = JSON.parse(fs.readFileSync(schemaPath, 'utf8'));
  if (schema['$schema'] !== 'https://json-schema.org/draft/2020-12/schema') {
    throw new GateError(18, 'summary schema draft mismatch');
  }

  const required = schema.required || [];
  for (const key of required) {
    if (!(key in summary)) {
      throw new GateError(18, `missing summary key: ${key}`);
    }
  }

  if (summary.releaseGateVersion !== '1.0.0') {
    throw new GateError(18, 'releaseGateVersion mismatch');
  }

  if (typeof summary.correlationId !== 'string' || !/^gate-[0-9]{8}T[0-9]{6}Z-[0-9a-f]{7,12}$/.test(summary.correlationId)) {
    throw new GateError(18, 'correlationId is invalid');
  }

  if (!['PASS', 'PASS_WITH_WARNINGS', 'FAIL', 'BLOCKED'].includes(summary.status)) {
    throw new GateError(18, 'status is invalid');
  }

  if (!['local', 'hml', 'production'].includes(summary.environment)) {
    throw new GateError(18, 'environment is invalid');
  }

  for (const key of ['dryRun', 'strict', 'explain', 'skipHttp']) {
    if (typeof summary[key] !== 'boolean') {
      throw new GateError(18, `${key} is invalid`);
    }
  }

  if (typeof summary.startedAt !== 'string' || typeof summary.finishedAt !== 'string') {
    throw new GateError(18, 'timestamps are invalid');
  }

  if (!summary.git || typeof summary.git !== 'object') {
    throw new GateError(18, 'git object is invalid');
  }

  if (!summary.artifact || typeof summary.artifact !== 'object') {
    throw new GateError(18, 'artifact object is invalid');
  }

  if (!summary.stages || typeof summary.stages !== 'object') {
    throw new GateError(18, 'stages object is invalid');
  }

  if (!summary.policy || typeof summary.policy !== 'object') {
    throw new GateError(18, 'policy object is invalid');
  }

  if (!summary.evidence || typeof summary.evidence !== 'object') {
    throw new GateError(18, 'evidence object is invalid');
  }
};

const stageResultsPath = process.env.STAGE_RESULTS_PATH;
const policyEvaluationPath = process.env.POLICY_EVALUATION_PATH;
const executionMetadataPath = process.env.EXECUTION_METADATA_PATH;
const schemaPath = process.env.SUMMARY_SCHEMA_PATH;
const outputDir = process.env.OUTPUT_DIR;
const correlationId = process.env.CORRELATION_ID;
const artifactPath = process.env.ARTIFACT_PATH;
const policyPath = process.env.POLICY_PATH;
const environment = process.env.ENVIRONMENT;
const strict = process.env.STRICT_MODE === 'true';
const explain = process.env.EXPLAIN_MODE === 'true';
const skipHttp = process.env.SKIP_HTTP === 'true';

const stageResults = readJson(stageResultsPath, 'stage results');
const policyEvaluation = readJson(policyEvaluationPath, 'policy evaluation');
const executionMetadata = readJson(executionMetadataPath, 'execution metadata');

const unique = (values) => [...new Set(values.filter(Boolean))];

const warnings = unique([
  ...(stageResults.warnings || []),
  ...(policyEvaluation.warnings || []),
]);

const errors = unique([
  ...(stageResults.errors || []),
  ...(policyEvaluation.errors || []),
]);

const summary = {
  releaseGateVersion: '1.0.0',
  correlationId,
  status: policyEvaluation.status,
  environment,
  dryRun: true,
  strict,
  explain,
  skipHttp,
  startedAt: stageResults.startedAt || executionMetadata.startedAt,
  finishedAt: stageResults.finishedAt || executionMetadata.finishedAt,
  durationMs: Number.isFinite(stageResults.durationMs) ? stageResults.durationMs : executionMetadata.durationMs,
  git: {
    branch: executionMetadata?.git?.branch || stageResults?.git?.branch || 'unknown',
    commit: executionMetadata?.git?.commit || stageResults?.git?.commit || 'unknown',
    treeDirty: Boolean(executionMetadata?.git?.treeDirty ?? stageResults?.git?.treeDirty ?? false),
  },
  artifact: {
    path: artifactPath,
    sha256: executionMetadata?.artifact?.sha256 || stageResults?.artifact?.sha256 || 'unknown',
    version: executionMetadata?.artifact?.version || stageResults?.artifact?.version || 'unknown',
  },
  stages: {
    releaseVerification: stageResults?.stages?.releaseVerification?.status || 'BLOCKED',
    deployDryRun: stageResults?.stages?.deployDryRun?.status || 'BLOCKED',
    runtimeValidation: stageResults?.stages?.runtimeValidation?.status || 'BLOCKED',
  },
  warnings,
  errors,
  decisionReasons: unique(policyEvaluation.decisionReasons || []),
  policy: {
    path: policyPath,
    version: policyEvaluation?.policy?.version || 'unknown',
    hash: policyEvaluation?.policy?.hash || 'unknown',
    allowWarnings: Boolean(policyEvaluation?.policy?.allowWarnings),
    allowHttpSkipped: Boolean(policyEvaluation?.policy?.allowHttpSkipped),
    requireCleanGitTree: Boolean(policyEvaluation?.policy?.requireCleanGitTree),
    requiredStages: Array.isArray(policyEvaluation?.policy?.requiredStages) ? policyEvaluation.policy.requiredStages : [],
  },
  evidence: {
    directory: outputDir,
    stageResultsPath,
    policyEvaluationPath,
    executionMetadataPath,
    logs: {
      releaseVerification: path.join(outputDir, 'release-verification.log'),
      deployDryRun: path.join(outputDir, 'deploy-dry-run.log'),
      runtimeValidation: path.join(outputDir, 'runtime-validation.log'),
    },
  },
};

validateSummary(summary, schemaPath);

const renderList = (items) => {
  if (!items || items.length === 0) {
    return '- Nenhum.';
  }
  return items.map((item) => `- ${item}`).join('\n');
};

const stageTable = [
  '| Stage | Status | Exit Code | Duration (ms) |',
  '| --- | --- | --- | --- |',
  `| releaseVerification | ${stageResults?.stages?.releaseVerification?.status || 'BLOCKED'} | ${stageResults?.stages?.releaseVerification?.exitCode ?? 'n/a'} | ${stageResults?.stages?.releaseVerification?.durationMs ?? 'n/a'} |`,
  `| deployDryRun | ${stageResults?.stages?.deployDryRun?.status || 'BLOCKED'} | ${stageResults?.stages?.deployDryRun?.exitCode ?? 'n/a'} | ${stageResults?.stages?.deployDryRun?.durationMs ?? 'n/a'} |`,
  `| runtimeValidation | ${stageResults?.stages?.runtimeValidation?.status || 'BLOCKED'} | ${stageResults?.stages?.runtimeValidation?.exitCode ?? 'n/a'} | ${stageResults?.stages?.runtimeValidation?.durationMs ?? 'n/a'} |`,
];

const md = [
  '# FINQZ PRO Enterprise Release Gate Report',
  '',
  '## 1. Resumo Executivo',
  '',
  `- decisão: ${summary.status}`,
  `- correlationId: ${summary.correlationId}`,
  `- environment: ${summary.environment}`,
  `- dryRun: ${summary.dryRun}`,
  `- strict: ${summary.strict}`,
  `- explain: ${summary.explain}`,
  `- skipHttp: ${summary.skipHttp}`,
  `- startedAt: ${summary.startedAt}`,
  `- finishedAt: ${summary.finishedAt}`,
  `- durationMs: ${summary.durationMs}`,
  '',
  '## 2. Decisão Final',
  '',
  `- status: ${summary.status}`,
  `- motivo principal: ${(policyEvaluation.decisionReasons || [])[0] || 'nenhum'}`,
  '',
  '## 3. Correlation ID',
  '',
  `- ${summary.correlationId}`,
  '',
  '## 4. Ambiente',
  '',
  `- ${summary.environment}`,
  '',
  '## 5. Artefato',
  '',
  `- path: ${summary.artifact.path}`,
  `- sha256: ${summary.artifact.sha256}`,
  `- version: ${summary.artifact.version}`,
  '',
  '## 6. Git Context',
  '',
  `- branch: ${summary.git.branch}`,
  `- commit: ${summary.git.commit}`,
  `- treeDirty: ${summary.git.treeDirty}`,
  '',
  '## 7. Estágios Executados',
  '',
  ...stageTable,
  '',
  '## 8. Resultado da Verificação da Release',
  '',
  `- status: ${stageResults?.stages?.releaseVerification?.status || 'BLOCKED'}`,
  `- exitCode: ${stageResults?.stages?.releaseVerification?.exitCode ?? 'n/a'}`,
  `- log: ${summary.evidence.logs.releaseVerification}`,
  '',
  '## 9. Resultado do Deploy Dry-Run',
  '',
  `- status: ${stageResults?.stages?.deployDryRun?.status || 'BLOCKED'}`,
  `- exitCode: ${stageResults?.stages?.deployDryRun?.exitCode ?? 'n/a'}`,
  `- warnings: ${(stageResults?.stages?.deployDryRun?.warnings || []).length}`,
  `- log: ${summary.evidence.logs.deployDryRun}`,
  '',
  '## 10. Resultado do Runtime Validation',
  '',
  `- status: ${stageResults?.stages?.runtimeValidation?.status || 'BLOCKED'}`,
  `- exitCode: ${stageResults?.stages?.runtimeValidation?.exitCode ?? 'n/a'}`,
  `- httpStatus: ${stageResults?.stages?.runtimeValidation?.evidence?.httpStatus || 'n/a'}`,
  `- log: ${summary.evidence.logs.runtimeValidation}`,
  '',
  '## 11. Avaliação da Política',
  '',
  `- policyVersion: ${summary.policy.version}`,
  `- policyHash: ${summary.policy.hash}`,
  `- allowWarnings: ${summary.policy.allowWarnings}`,
  `- allowHttpSkipped: ${summary.policy.allowHttpSkipped}`,
  `- requireCleanGitTree: ${summary.policy.requireCleanGitTree}`,
  `- requiredStages: ${summary.policy.requiredStages.join(', ')}`,
  '',
  '## 12. Warnings',
  '',
  renderList(summary.warnings),
  '',
  '## 13. Erros',
  '',
  renderList(summary.errors),
  '',
  '## 14. Regras Bloqueantes',
  '',
  renderList(summary.decisionReasons),
  '',
  '## 15. Evidências',
  '',
  `- stage-results.json: ${summary.evidence.stageResultsPath}`,
  `- policy-evaluation.json: ${summary.evidence.policyEvaluationPath}`,
  `- execution-metadata.json: ${summary.evidence.executionMetadataPath}`,
  `- release-verification.log: ${summary.evidence.logs.releaseVerification}`,
  `- deploy-dry-run.log: ${summary.evidence.logs.deployDryRun}`,
  `- runtime-validation.log: ${summary.evidence.logs.runtimeValidation}`,
  '',
  '## 16. Riscos',
  '',
  '- Artefato ausente, checksum inválido ou schema inválido derrubam a trilha em fail-closed.',
  '- Ambientes que não permitirem warnings ou skip HTTP podem bloquear a promoção.',
  '- Tree dirty pode ser aceita apenas nos ambientes definidos pela política.',
  '',
  '## 17. Recomendação Operacional',
  '',
  summary.status === 'PASS'
    ? '- Gate apto para avançar para a próxima etapa contratual.'
    : summary.status === 'PASS_WITH_WARNINGS'
      ? '- Gate apto com warnings permitidos; revisar os avisos antes da promoção.'
      : '- Gate não apto para promoção; tratar os bloqueios antes de repetir a execução.',
  '',
  '## 18. Limitações',
  '',
  '- Esta fase não executa deploy real nem rollback real.',
  '- Não há aprovação humana remota nesta etapa.',
  '- O gate apenas consolida evidências já produzidas por R2, R3 e R4.',
  '',
  '## 19. Próxima fase',
  '',
  '- habilitar o gate como etapa contratual da trilha de release;',
  '- conectar o gate a um pipeline controlado;',
  '- manter o deploy real fora do escopo até nova autorização.',
  '',
  '## 20. Fluxograma Mermaid',
  '',
  '```mermaid',
  'flowchart TD',
  '    A[Receive Artifact] --> B[Validate Arguments]',
  '    B --> C[Load Policy]',
  '    C --> D[Verify Release]',
  '    D -->|FAIL| X[Gate FAIL]',
  '    D -->|PASS| E[Deploy Engine Dry-Run]',
  '    E -->|FAIL| X',
  '    E -->|PASS| F[Runtime Validation]',
  '    F -->|FAIL| X',
  '    F -->|PASS| G[Aggregate Evidence]',
  '    G --> H[Evaluate Policy]',
  '    H -->|PASS| I[Gate PASS]',
  '    H -->|WARNINGS ALLOWED| J[PASS WITH WARNINGS]',
  '    H -->|POLICY VIOLATION| X',
  '    H -->|INCOMPLETE| K[Gate BLOCKED]',
  '```',
];

fs.mkdirSync(outputDir, { recursive: true });
const summaryPath = path.join(outputDir, 'release-gate-summary.json');
const reportPath = path.join(outputDir, 'release-gate-report.md');
fs.writeFileSync(summaryPath, `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(reportPath, `${md.join('\n')}\n`);

if (explain) {
  process.stderr.write([
    `decision=${summary.status}`,
    `requiredStages=${summary.policy.requiredStages.join(',')}`,
    `warnings=${summary.warnings.length}`,
    `errors=${summary.errors.length}`,
  ].join(' | '));
  process.stderr.write('\n');
}

process.exit(0);
NODE
}

main "$@"
