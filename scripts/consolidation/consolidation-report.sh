#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

stage_contract_results_path=""
evidence_validation_path=""
portability_validation_path=""
execution_metadata_path=""
summary_schema_path="${repo_root}/release/schemas/pipeline-consolidation-summary.schema.json"
output_dir="${repo_root}/release/consolidation"
correlation_id=""
artifact_path=""
policy_path=""
environment=""
strict="false"
skip_http="false"
explain="false"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

usage() {
  cat <<'EOF'
Usage:
  consolidation-report.sh --stage-contract-results <path> --evidence-validation <path> --portability-validation <path> --execution-metadata <path> --summary-schema <path> --output <dir> --correlation-id <id> --artifact <path> --policy <path> --environment <name> [--strict] [--skip-http] [--explain] [--verbose]
EOF
}

fail() {
  local code="$1"
  shift
  printf '%s ERROR [consolidation-report] %s\n' "$(timestamp_utc)" "$*" >&2
  exit "${code}"
}

while (($#)); do
  case "$1" in
    --stage-contract-results)
      [[ $# -ge 2 ]] || fail 18 "--stage-contract-results requires a value"
      stage_contract_results_path="$2"
      shift 2
      ;;
    --evidence-validation)
      [[ $# -ge 2 ]] || fail 18 "--evidence-validation requires a value"
      evidence_validation_path="$2"
      shift 2
      ;;
    --portability-validation)
      [[ $# -ge 2 ]] || fail 18 "--portability-validation requires a value"
      portability_validation_path="$2"
      shift 2
      ;;
    --execution-metadata)
      [[ $# -ge 2 ]] || fail 18 "--execution-metadata requires a value"
      execution_metadata_path="$2"
      shift 2
      ;;
    --summary-schema)
      [[ $# -ge 2 ]] || fail 18 "--summary-schema requires a value"
      summary_schema_path="$2"
      shift 2
      ;;
    --output)
      [[ $# -ge 2 ]] || fail 18 "--output requires a value"
      output_dir="$2"
      shift 2
      ;;
    --correlation-id)
      [[ $# -ge 2 ]] || fail 18 "--correlation-id requires a value"
      correlation_id="$2"
      shift 2
      ;;
    --artifact)
      [[ $# -ge 2 ]] || fail 18 "--artifact requires a value"
      artifact_path="$2"
      shift 2
      ;;
    --policy)
      [[ $# -ge 2 ]] || fail 18 "--policy requires a value"
      policy_path="$2"
      shift 2
      ;;
    --environment)
      [[ $# -ge 2 ]] || fail 18 "--environment requires a value"
      environment="$2"
      shift 2
      ;;
    --strict)
      strict="true"
      shift
      ;;
    --skip-http)
      skip_http="true"
      shift
      ;;
    --explain)
      explain="true"
      shift
      ;;
    --verbose)
      verbose="true"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail 18 "unknown argument: $1"
      ;;
  esac
done

[[ -f "${stage_contract_results_path}" ]] || fail 18 "stage contract results not found: ${stage_contract_results_path}"
[[ -f "${evidence_validation_path}" ]] || fail 18 "evidence validation not found: ${evidence_validation_path}"
[[ -f "${portability_validation_path}" ]] || fail 18 "portability validation not found: ${portability_validation_path}"
[[ -f "${execution_metadata_path}" ]] || fail 18 "execution metadata not found: ${execution_metadata_path}"
[[ -f "${summary_schema_path}" ]] || fail 18 "summary schema not found: ${summary_schema_path}"
[[ -n "${correlation_id}" ]] || fail 18 "--correlation-id is required"
[[ -n "${artifact_path}" ]] || fail 18 "--artifact is required"
[[ -n "${policy_path}" ]] || fail 18 "--policy is required"
[[ -n "${environment}" ]] || fail 18 "--environment is required"

mkdir -p "${output_dir}"

STAGE_CONTRACT_RESULTS_PATH="${stage_contract_results_path}" \
EVIDENCE_VALIDATION_PATH="${evidence_validation_path}" \
PORTABILITY_VALIDATION_PATH="${portability_validation_path}" \
EXECUTION_METADATA_PATH="${execution_metadata_path}" \
SUMMARY_SCHEMA_PATH="${summary_schema_path}" \
OUTPUT_DIR="${output_dir}" \
CORRELATION_ID="${correlation_id}" \
ARTIFACT_PATH="${artifact_path}" \
POLICY_PATH="${policy_path}" \
ENVIRONMENT="${environment}" \
STRICT_MODE="${strict}" \
SKIP_HTTP="${skip_http}" \
EXPLAIN_MODE="${explain}" \
VERBOSE_MODE="${verbose}" \
node <<'NODE'
const fs = require('fs');
const path = require('path');

const stageContractResultsPath = process.env.STAGE_CONTRACT_RESULTS_PATH;
const evidenceValidationPath = process.env.EVIDENCE_VALIDATION_PATH;
const portabilityValidationPath = process.env.PORTABILITY_VALIDATION_PATH;
const executionMetadataPath = process.env.EXECUTION_METADATA_PATH;
const schemaPath = process.env.SUMMARY_SCHEMA_PATH;
const outputDir = process.env.OUTPUT_DIR;
const correlationId = process.env.CORRELATION_ID;
const artifactPath = process.env.ARTIFACT_PATH;
const policyPath = process.env.POLICY_PATH;
const environment = process.env.ENVIRONMENT;
const strict = process.env.STRICT_MODE === 'true';
const skipHttp = process.env.SKIP_HTTP === 'true';
const explain = process.env.EXPLAIN_MODE === 'true';
const verbose = process.env.VERBOSE_MODE === 'true';

const readJson = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    throw new Error(`${label} not found: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
};

const unique = (values) => [...new Set(values.filter(Boolean))];

const stageContractResults = readJson(stageContractResultsPath, 'stage contract results');
const evidenceValidation = readJson(evidenceValidationPath, 'evidence validation');
const portabilityValidation = readJson(portabilityValidationPath, 'portability validation');
const executionMetadata = readJson(executionMetadataPath, 'execution metadata');
const schema = readJson(schemaPath, 'summary schema');

const stageStatuses = stageContractResults?.summary?.stageStatuses || {};
const stages = {
  artifactBuild: stageStatuses.artifactBuild || 'SKIPPED',
  releasePackage: stageStatuses.releasePackage || 'SKIPPED',
  releaseVerification: stageStatuses.releaseVerification || 'BLOCKED',
  deployDryRun: stageStatuses.deployDryRun || 'BLOCKED',
  runtimeValidation: stageStatuses.runtimeValidation || 'BLOCKED',
  releaseGate: stageStatuses.releaseGate || 'BLOCKED',
  contractValidation: stageContractResults.status || 'BLOCKED',
  evidenceValidation: evidenceValidation.status || 'BLOCKED',
  portabilityValidation: portabilityValidation.status || 'BLOCKED',
};

const warnings = unique([
  ...(stageContractResults.warnings || []),
  ...(evidenceValidation.warnings || []),
  ...(portabilityValidation.warnings || []),
]);
const errors = unique([
  ...(stageContractResults.errors || []),
  ...(evidenceValidation.errors || []),
  ...(portabilityValidation.errors || []),
]);

const missingEvidence = unique([...(evidenceValidation.missing || [])]);
const invalidEvidence = unique([...(evidenceValidation.invalid || [])]);
const contractViolations = unique([...(stageContractResults.summary?.violations || [])]);

let status = 'PASS';
if (contractViolations.length > 0 || missingEvidence.length > 0 || invalidEvidence.length > 0 || errors.length > 0) {
  status = 'BLOCKED';
} else if (Object.values(stages).includes('FAIL')) {
  status = 'FAIL';
} else if (Object.values(stages).includes('PASS_WITH_WARNINGS') || warnings.length > 0) {
  status = strict ? 'FAIL' : 'PASS_WITH_WARNINGS';
}

const decisionReasons = [];
if (contractViolations.length > 0) {
  decisionReasons.push(`contract violations: ${contractViolations.join('; ')}`);
}
if (missingEvidence.length > 0) {
  decisionReasons.push(`missing evidence: ${missingEvidence.join(', ')}`);
}
if (invalidEvidence.length > 0) {
  decisionReasons.push(`invalid evidence: ${invalidEvidence.join(', ')}`);
}
if (warnings.length > 0 && strict) {
  decisionReasons.push('strict mode treats warnings as blocking');
}
if (Object.values(stages).includes('PASS_WITH_WARNINGS') && !strict) {
  decisionReasons.push('warnings were preserved for manual review');
}
if (decisionReasons.length === 0) {
  decisionReasons.push('all consolidation stages satisfied the contract');
}

const summary = {
  consolidationVersion: '1.0.0',
  correlationId,
  status,
  environment,
  dryRun: true,
  strict,
  skipHttp,
  startedAt: executionMetadata.startedAt || stageContractResults.startedAt || new Date().toISOString(),
  finishedAt: executionMetadata.finishedAt || stageContractResults.finishedAt || new Date().toISOString(),
  durationMs: Number.isFinite(executionMetadata.durationMs) ? executionMetadata.durationMs : stageContractResults.durationMs || 0,
  git: executionMetadata.git || { branch: 'unknown', commit: 'unknown', treeDirty: true },
  artifact: executionMetadata.artifact || {
    path: artifactPath,
    sha256: stageContractResults.summary?.artifactSha256 || 'unknown',
    version: stageContractResults.summary?.artifactVersion || 'unknown',
  },
  stages,
  contracts: {
    status: contractViolations.length > 0 ? 'FAIL' : stageContractResults.status || 'BLOCKED',
    violations: contractViolations,
  },
  evidence: {
    status: missingEvidence.length > 0 || invalidEvidence.length > 0 ? 'BLOCKED' : evidenceValidation.status || 'BLOCKED',
    missing: missingEvidence,
    invalid: invalidEvidence,
  },
  portability: {
    status: portabilityValidation.status || 'BLOCKED',
    warnings: portabilityValidation.warnings || [],
  },
  warnings,
  errors,
  decisionReasons,
  nextAction:
    status === 'PASS'
      ? 'Pipeline consolidado. Prosseguir para a etapa operacional seguinte.'
      : status === 'PASS_WITH_WARNINGS'
        ? 'Revisar os warnings e seguir apenas se a política do ambiente aceitar avisos.'
        : 'Corrigir as violações de contrato/evidência antes de repetir a consolidação.',
};

const validateSummary = () => {
  const required = schema.required || [];
  for (const key of required) {
    if (!(key in summary)) {
      throw new Error(`summary missing key: ${key}`);
    }
  }
  if (!['PASS', 'PASS_WITH_WARNINGS', 'FAIL', 'BLOCKED'].includes(summary.status)) {
    throw new Error('summary status invalid');
  }
  if (!['local', 'hml', 'production'].includes(summary.environment)) {
    throw new Error('summary environment invalid');
  }
};

validateSummary();

const reportLines = [
  '# FINQZ PRO Enterprise Pipeline Consolidation Report',
  '',
  '## Resumo',
  '',
  `- correlationId: ${summary.correlationId}`,
  `- status: ${summary.status}`,
  `- environment: ${summary.environment}`,
  `- dryRun: ${summary.dryRun}`,
  `- strict: ${summary.strict}`,
  `- skipHttp: ${summary.skipHttp}`,
  `- startedAt: ${summary.startedAt}`,
  `- finishedAt: ${summary.finishedAt}`,
  `- durationMs: ${summary.durationMs}`,
  '',
  '## Estagios',
  '',
  '| Stage | Status |',
  '| --- | --- |',
  ...Object.entries(summary.stages).map(([stage, stageStatus]) => `| ${stage} | ${stageStatus} |`),
  '',
  '## Contratos',
  '',
  `- status: ${summary.contracts.status}`,
  `- violations: ${summary.contracts.violations.length ? summary.contracts.violations.join('; ') : 'nenhuma'}`,
  '',
  '## Evidencias',
  '',
  `- status: ${summary.evidence.status}`,
  `- missing: ${summary.evidence.missing.length ? summary.evidence.missing.join(', ') : 'nenhuma'}`,
  `- invalid: ${summary.evidence.invalid.length ? summary.evidence.invalid.join(', ') : 'nenhuma'}`,
  '',
  '## Portabilidade',
  '',
  `- status: ${summary.portability.status}`,
  `- warnings: ${summary.portability.warnings.length ? summary.portability.warnings.join('; ') : 'nenhum'}`,
  '',
  '## Decisao',
  '',
  `- ${summary.decisionReasons[0] || 'nenhuma'}`,
  '',
  '## Proxima Acao',
  '',
  `- ${summary.nextAction}`,
];

fs.writeFileSync(path.join(outputDir, 'pipeline-consolidation-summary.json'), `${JSON.stringify(summary, null, 2)}\n`);
fs.writeFileSync(path.join(outputDir, 'pipeline-consolidation-report.md'), `${reportLines.join('\n')}\n`);

if (explain || verbose) {
  process.stderr.write([
    `status=${summary.status}`,
    `warnings=${summary.warnings.length}`,
    `errors=${summary.errors.length}`,
    `decisionReasons=${summary.decisionReasons.length}`,
  ].join(' | '));
  process.stderr.write('\n');
}

process.exit(summary.status === 'PASS' ? 0 : summary.status === 'PASS_WITH_WARNINGS' ? 2 : summary.status === 'BLOCKED' ? 17 : 16);
NODE
