#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

policy_path="${repo_root}/release/policies/release-gate-policy.json"
stage_results_path=""
execution_metadata_path=""
output_dir="${repo_root}/release/gate"
environment=""
correlation_id=""
validate_only="false"
strict="false"
explain="false"
skip_http="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [gate-policy] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  gate-policy.sh --policy <path> --environment <name> [--stage-results <path>] [--execution-metadata <path>] [--output <dir>] [--correlation-id <id>] [--strict] [--explain] [--skip-http] [--validate-only]
EOF
}

main() {
  while (($#)); do
    case "$1" in
      --policy)
        [[ $# -ge 2 ]] || { log_line ERROR "--policy requires a value"; exit 10; }
        policy_path="$2"
        shift 2
        ;;
      --stage-results)
        [[ $# -ge 2 ]] || { log_line ERROR "--stage-results requires a value"; exit 10; }
        stage_results_path="$2"
        shift 2
        ;;
      --execution-metadata)
        [[ $# -ge 2 ]] || { log_line ERROR "--execution-metadata requires a value"; exit 10; }
        execution_metadata_path="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || { log_line ERROR "--output requires a value"; exit 10; }
        output_dir="$2"
        shift 2
        ;;
      --environment)
        [[ $# -ge 2 ]] || { log_line ERROR "--environment requires a value"; exit 10; }
        environment="$2"
        shift 2
        ;;
      --correlation-id)
        [[ $# -ge 2 ]] || { log_line ERROR "--correlation-id requires a value"; exit 10; }
        correlation_id="$2"
        shift 2
        ;;
      --validate-only)
        validate_only="true"
        shift
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
        exit 10
        ;;
    esac
  done

  [[ -f "${policy_path}" ]] || { log_line ERROR "policy file not found: ${policy_path}"; exit 12; }
  [[ -n "${environment}" ]] || { log_line ERROR "--environment is required"; exit 10; }

  mkdir -p "${output_dir}"

  POLICY_PATH="${policy_path}" \
  STAGE_RESULTS_PATH="${stage_results_path}" \
  EXECUTION_METADATA_PATH="${execution_metadata_path}" \
  OUTPUT_DIR="${output_dir}" \
  ENVIRONMENT="${environment}" \
  CORRELATION_ID="${correlation_id}" \
  VALIDATE_ONLY="${validate_only}" \
  STRICT_MODE="${strict}" \
  EXPLAIN_MODE="${explain}" \
  SKIP_HTTP="${skip_http}" \
  node <<'NODE'
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const readJson = (filePath, label) => {
  if (!filePath) {
    return null;
  }
  if (!fs.existsSync(filePath)) {
    throw new GateError(17, `${label} not found: ${filePath}`);
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new GateError(12, `${label} is not valid JSON: ${filePath}`);
  }
};

class GateError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const policyPath = process.env.POLICY_PATH;
const stageResultsPath = process.env.STAGE_RESULTS_PATH;
const executionMetadataPath = process.env.EXECUTION_METADATA_PATH;
const outputDir = process.env.OUTPUT_DIR;
const environment = process.env.ENVIRONMENT;
const correlationId = process.env.CORRELATION_ID;
const validateOnly = process.env.VALIDATE_ONLY === 'true';
const strict = process.env.STRICT_MODE === 'true';
const explain = process.env.EXPLAIN_MODE === 'true';
const skipHttp = process.env.SKIP_HTTP === 'true';

const policyRaw = fs.readFileSync(policyPath, 'utf8');
let policy;
try {
  policy = JSON.parse(policyRaw);
} catch (error) {
  throw new GateError(12, `policy file is not valid JSON: ${policyPath}`);
}

if (!policy || typeof policy !== 'object') {
  throw new GateError(12, 'policy payload is invalid');
}

if (typeof policy.version !== 'string' || !policy.version) {
  throw new GateError(12, 'policy.version is invalid');
}

if (!policy.environments || typeof policy.environments !== 'object') {
  throw new GateError(12, 'policy.environments is invalid');
}

if (!Array.isArray(policy.blockingStatuses) || policy.blockingStatuses.length === 0) {
  throw new GateError(12, 'policy.blockingStatuses is invalid');
}

if (!Array.isArray(policy.blockingSecuritySeverities) || policy.blockingSecuritySeverities.length === 0) {
  throw new GateError(12, 'policy.blockingSecuritySeverities is invalid');
}

const envPolicy = policy.environments[environment];
if (!envPolicy || typeof envPolicy !== 'object') {
  throw new GateError(20, `environment is not supported by policy: ${environment}`);
}

for (const key of ['allowWarnings', 'allowHttpSkipped', 'requireCleanGitTree']) {
  if (typeof envPolicy[key] !== 'boolean') {
    throw new GateError(12, `policy.${environment}.${key} is invalid`);
  }
}

if (!Array.isArray(envPolicy.requiredStages) || envPolicy.requiredStages.length === 0) {
  throw new GateError(12, `policy.${environment}.requiredStages is invalid`);
}

const policyHash = crypto.createHash('sha256').update(policyRaw).digest('hex');

if (validateOnly) {
  process.exit(0);
}

const stageResults = readJson(stageResultsPath, 'stage results');
const executionMetadata = readJson(executionMetadataPath, 'execution metadata');

const stageNames = envPolicy.requiredStages.slice();
const stages = stageResults?.stages || {};
const stageStatuses = {};
const missingStages = [];
for (const stageName of stageNames) {
  const stage = stages[stageName];
  if (!stage || typeof stage !== 'object') {
    missingStages.push(stageName);
    continue;
  }
  stageStatuses[stageName] = stage.status;
}

const warnings = Array.isArray(stageResults?.warnings) ? [...stageResults.warnings] : [];
const errors = Array.isArray(stageResults?.errors) ? [...stageResults.errors] : [];
const decisionReasons = [];
const blockedStages = [];
const blockedWarnings = [];
const allowedWarnings = [];
const skippedStages = [];

const evidenceIntegrity = stageResults?.evidenceIntegrity || {};
if (evidenceIntegrity.status === 'BLOCKED') {
  missingStages.push(...(Array.isArray(evidenceIntegrity.missingStages) ? evidenceIntegrity.missingStages : []));
  errors.push(...(Array.isArray(evidenceIntegrity.errors) ? evidenceIntegrity.errors : []));
}

if (!executionMetadata || typeof executionMetadata !== 'object') {
  throw new GateError(17, 'execution metadata is invalid');
}

const gitTreeDirty = Boolean(executionMetadata?.git?.treeDirty);
const runtimeHttpStatus = stages.runtimeValidation?.evidence?.httpStatus;
const runtimeStageStatus = stages.runtimeValidation?.status;

for (const stageName of stageNames) {
  const status = stageStatuses[stageName];
  if (status === 'SKIPPED') {
    skippedStages.push(stageName);
    continue;
  }
  if (status === 'BLOCKED') {
    blockedStages.push(stageName);
  }
}

if (missingStages.length > 0) {
  decisionReasons.push(`missing required stages: ${missingStages.join(', ')}`);
}

if (runtimeHttpStatus === 'SKIPPED') {
  decisionReasons.push('runtime HTTP validation was skipped explicitly');
}

if (strict) {
  if (warnings.length > 0) {
    blockedWarnings.push(...warnings);
    decisionReasons.push('strict mode treats warnings as blocking');
  }
  if (skippedStages.length > 0) {
    decisionReasons.push(`strict mode forbids skipped stages: ${skippedStages.join(', ')}`);
  }
  if (gitTreeDirty) {
    decisionReasons.push('strict mode requires a clean Git tree');
  }
}

if (envPolicy.requireCleanGitTree && gitTreeDirty) {
  decisionReasons.push('policy requires a clean Git tree');
}

if (!envPolicy.allowHttpSkipped && runtimeHttpStatus === 'SKIPPED') {
  decisionReasons.push('policy does not allow skipping HTTP validation');
}

if (!envPolicy.allowWarnings && warnings.length > 0) {
  blockedWarnings.push(...warnings);
  decisionReasons.push('policy does not allow warnings');
}

if (blockedStages.length > 0) {
  decisionReasons.push(`blocking stage failure detected: ${blockedStages.join(', ')}`);
}

const hasEvidenceFailure = evidenceIntegrity.status === 'BLOCKED';
const hasMissingStages = missingStages.length > 0;
const hasBlockingStageFailure = stageNames.some((stageName) => {
  const status = stageStatuses[stageName];
  return policy.blockingStatuses.includes(status);
});
const hasPolicyViolation = (
  (!envPolicy.allowHttpSkipped && runtimeHttpStatus === 'SKIPPED') ||
  (envPolicy.requireCleanGitTree && gitTreeDirty) ||
  (!envPolicy.allowWarnings && warnings.length > 0)
);

let status = 'PASS';
let exitCode = 0;

if (hasEvidenceFailure || hasMissingStages) {
  status = 'BLOCKED';
  exitCode = 17;
} else if (strict && (warnings.length > 0 || skippedStages.length > 0 || gitTreeDirty)) {
  status = 'FAIL';
  exitCode = 19;
} else if (hasBlockingStageFailure) {
  status = 'FAIL';
  exitCode = 16;
} else if (hasPolicyViolation) {
  status = 'FAIL';
  exitCode = 16;
} else if (warnings.length > 0) {
  status = 'PASS_WITH_WARNINGS';
  exitCode = 2;
  allowedWarnings.push(...warnings);
} else {
  status = 'PASS';
  exitCode = 0;
}

if (status === 'BLOCKED' && decisionReasons.length === 0) {
  decisionReasons.push('evidence or dependency integrity could not be confirmed');
}

const evaluation = {
  releaseGateVersion: '1.0.0',
  correlationId: correlationId || stageResults?.correlationId || `gate-${new Date().toISOString().replace(/[-:]/g, '').slice(0, 15)}-${executionMetadata?.git?.commit || 'unknown'}`,
  status,
  environment,
  strict,
  explain,
  dryRun: true,
  skipHttp,
  policy: {
    path: policyPath,
    version: policy.version,
    hash: policyHash,
    allowWarnings: envPolicy.allowWarnings,
    allowHttpSkipped: envPolicy.allowHttpSkipped,
    requireCleanGitTree: envPolicy.requireCleanGitTree,
    requiredStages: envPolicy.requiredStages,
  },
  requiredStages: envPolicy.requiredStages,
  stageStatuses,
  warnings,
  errors,
  blockedStages,
  blockedWarnings,
  allowedWarnings,
  skippedStages,
  decisionReasons,
  rules: [
    {
      rule: 'requiredStages',
      status: hasMissingStages ? 'BLOCKED' : 'PASS',
      details: envPolicy.requiredStages,
    },
    {
      rule: 'cleanGitTree',
      status: envPolicy.requireCleanGitTree && gitTreeDirty ? 'FAIL' : 'PASS',
      details: { required: envPolicy.requireCleanGitTree, treeDirty: gitTreeDirty },
    },
    {
      rule: 'warnings',
      status: !envPolicy.allowWarnings && warnings.length > 0 ? 'FAIL' : 'PASS',
      details: { allowWarnings: envPolicy.allowWarnings, warningCount: warnings.length },
    },
    {
      rule: 'httpSkip',
      status: runtimeHttpStatus === 'SKIPPED'
        ? (envPolicy.allowHttpSkipped ? 'PASS' : 'FAIL')
        : 'PASS',
      details: { skipHttp, runtimeHttpStatus, allowHttpSkipped: envPolicy.allowHttpSkipped },
    },
    {
      rule: 'strictMode',
      status: strict && (warnings.length > 0 || skippedStages.length > 0 || gitTreeDirty) ? 'FAIL' : 'PASS',
      details: { strict, warningCount: warnings.length, skippedStages, treeDirty: gitTreeDirty },
    },
  ],
  git: {
    branch: executionMetadata?.git?.branch || stageResults?.git?.branch || 'unknown',
    commit: executionMetadata?.git?.commit || stageResults?.git?.commit || 'unknown',
    treeDirty: gitTreeDirty,
  },
  evidence: {
    stageResultsPath,
    executionMetadataPath,
  },
  exitCode,
};

fs.mkdirSync(outputDir, { recursive: true });
const targetPath = path.join(outputDir, 'policy-evaluation.json');
fs.writeFileSync(targetPath, `${JSON.stringify(evaluation, null, 2)}\n`);

if (explain) {
  const explanation = [
    `correlationId=${evaluation.correlationId}`,
    `status=${evaluation.status}`,
    `requiredStages=${envPolicy.requiredStages.join(',')}`,
    `warnings=${warnings.length}`,
    `skippedStages=${skippedStages.join(',') || 'none'}`,
    `treeDirty=${gitTreeDirty}`,
  ];
  process.stderr.write(`${explanation.join(' | ')}\n`);
}

process.exit(exitCode);
NODE
}

main "$@"
