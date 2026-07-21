#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

state_dir=""
output_dir=""
artifact_path=""
artifact_dir=""
manifest_path=""
policy_path=""
environment=""
correlation_id=""
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
  contract-validator.sh --state-dir <dir> --output <dir> --artifact <path> --artifact-dir <dir> --manifest <path> --policy <path> --environment <name> --correlation-id <id> [--strict] [--skip-http] [--explain] [--verbose]
EOF
}

fail() {
  local code="$1"
  shift
  printf '%s ERROR [contract-validator] %s\n' "$(timestamp_utc)" "$*" >&2
  exit "${code}"
}

while (($#)); do
  case "$1" in
    --state-dir)
      [[ $# -ge 2 ]] || fail 17 "--state-dir requires a value"
      state_dir="$2"
      shift 2
      ;;
    --output)
      [[ $# -ge 2 ]] || fail 17 "--output requires a value"
      output_dir="$2"
      shift 2
      ;;
    --artifact)
      [[ $# -ge 2 ]] || fail 17 "--artifact requires a value"
      artifact_path="$2"
      shift 2
      ;;
    --artifact-dir)
      [[ $# -ge 2 ]] || fail 17 "--artifact-dir requires a value"
      artifact_dir="$2"
      shift 2
      ;;
    --manifest)
      [[ $# -ge 2 ]] || fail 17 "--manifest requires a value"
      manifest_path="$2"
      shift 2
      ;;
    --policy)
      [[ $# -ge 2 ]] || fail 17 "--policy requires a value"
      policy_path="$2"
      shift 2
      ;;
    --environment)
      [[ $# -ge 2 ]] || fail 17 "--environment requires a value"
      environment="$2"
      shift 2
      ;;
    --correlation-id)
      [[ $# -ge 2 ]] || fail 17 "--correlation-id requires a value"
      correlation_id="$2"
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
      fail 17 "unknown argument: $1"
      ;;
  esac
done

[[ -d "${state_dir}" ]] || fail 17 "state directory not found: ${state_dir}"
[[ -n "${output_dir}" ]] || fail 17 "--output is required"
[[ -f "${artifact_path}" ]] || fail 17 "artifact not found: ${artifact_path}"
[[ -d "${artifact_dir}" ]] || fail 17 "artifact directory not found: ${artifact_dir}"
[[ -f "${manifest_path}" ]] || fail 17 "manifest not found: ${manifest_path}"
[[ -f "${policy_path}" ]] || fail 17 "policy not found: ${policy_path}"
[[ -n "${environment}" ]] || fail 17 "--environment is required"
[[ -n "${correlation_id}" ]] || fail 17 "--correlation-id is required"

mkdir -p "${output_dir}"

STATE_DIR="${state_dir}" \
OUTPUT_DIR="${output_dir}" \
ARTIFACT_PATH="${artifact_path}" \
ARTIFACT_DIR="${artifact_dir}" \
MANIFEST_PATH="${manifest_path}" \
POLICY_PATH="${policy_path}" \
ENVIRONMENT="${environment}" \
CORRELATION_ID="${correlation_id}" \
STRICT_MODE="${strict}" \
SKIP_HTTP="${skip_http}" \
EXPLAIN_MODE="${explain}" \
VERBOSE_MODE="${verbose}" \
node <<'NODE'
const fs = require('fs');
const path = require('path');

const stateDir = process.env.STATE_DIR;
const outputDir = process.env.OUTPUT_DIR;
const artifactPath = process.env.ARTIFACT_PATH;
const artifactDir = process.env.ARTIFACT_DIR;
const manifestPath = process.env.MANIFEST_PATH;
const policyPath = process.env.POLICY_PATH;
const environment = process.env.ENVIRONMENT;
const correlationId = process.env.CORRELATION_ID;
const strict = process.env.STRICT_MODE === 'true';
const skipHttp = process.env.SKIP_HTTP === 'true';
const explain = process.env.EXPLAIN_MODE === 'true';
const verbose = process.env.VERBOSE_MODE === 'true';

const stageOrder = [
  'artifactBuild',
  'releasePackage',
  'releaseVerification',
  'deployDryRun',
  'runtimeValidation',
  'releaseGate',
  'evidenceValidation',
  'portabilityValidation',
];

const stageDir = path.join(stateDir, 'stage-records');
const stageRecords = new Map();
for (const fileName of fs.existsSync(stageDir) ? fs.readdirSync(stageDir) : []) {
  if (!fileName.endsWith('.json')) continue;
  const filePath = path.join(stageDir, fileName);
  try {
    const record = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (record?.stage) {
      stageRecords.set(record.stage, { filePath, record });
    }
  } catch {
    stageRecords.set(fileName.replace(/\.json$/, ''), { filePath, record: null, invalid: true });
  }
}

const unique = (values) => [...new Set(values.filter(Boolean))];
const violations = [];
const warnings = [];
const errors = [];
const stageCorrelationIds = [];

const requireRecord = (stage) => {
  const entry = stageRecords.get(stage);
  if (!entry || !entry.record) {
    violations.push(`missing stage record: ${stage}`);
    return null;
  }
  return entry.record;
};

const validateRecord = (record) => {
  const requiredKeys = [
    'contractVersion',
    'correlationId',
    'parentCorrelationId',
    'sourceCorrelationId',
    'stage',
    'component',
    'status',
    'exitCode',
    'startedAt',
    'finishedAt',
    'durationMs',
    'required',
    'skipped',
    'justification',
    'warnings',
    'errors',
    'evidence',
    'outputDir',
    'logFile',
    'notes',
    'stdout',
    'stderr',
    'command',
  ];
  for (const key of requiredKeys) {
    if (!(key in record)) {
      violations.push(`stage ${record.stage || 'unknown'} is missing field: ${key}`);
    }
  }
  if (record.contractVersion !== '1.0.0') {
    violations.push(`stage ${record.stage || 'unknown'} has unsupported contractVersion`);
  }
  if (!stageOrder.includes(record.stage)) {
    violations.push(`stage ${record.stage || 'unknown'} is not part of the consolidation contract`);
  }
  if (!['PASS', 'PASS_WITH_WARNINGS', 'FAIL', 'BLOCKED', 'SKIPPED'].includes(record.status)) {
    violations.push(`stage ${record.stage || 'unknown'} has invalid status`);
  }
  if (typeof record.exitCode !== 'number') {
    violations.push(`stage ${record.stage || 'unknown'} has invalid exitCode`);
  }
  if (!Array.isArray(record.warnings) || !Array.isArray(record.errors) || !Array.isArray(record.evidence)) {
    violations.push(`stage ${record.stage || 'unknown'} has invalid array fields`);
  }
  return record;
};

const stageStatus = {};
for (const stage of stageOrder) {
  const record = requireRecord(stage);
  if (!record) {
    continue;
  }
  stageCorrelationIds.push(record.correlationId, record.parentCorrelationId, record.sourceCorrelationId);
  stageStatus[stage] = record.status;
  validateRecord(record);
  if (record.status === 'SKIPPED') {
    if (typeof record.justification !== 'string' || !record.justification.trim()) {
      violations.push(`stage ${stage} requires a skip justification`);
    } else {
      warnings.push(`${stage} skipped: ${record.justification}`);
    }
  }
}

const expectedCorrelationId = stageCorrelationIds.find((value) => typeof value === 'string' && value.length > 0) || null;
for (const stage of stageOrder) {
  const record = stageRecords.get(stage)?.record;
  if (!record) continue;
  if (record.correlationId !== expectedCorrelationId) {
    violations.push(`stage ${stage} correlationId mismatch`);
  }
  if (record.parentCorrelationId !== expectedCorrelationId) {
    violations.push(`stage ${stage} parentCorrelationId mismatch`);
  }
  if (record.sourceCorrelationId !== null && record.sourceCorrelationId !== expectedCorrelationId) {
    violations.push(`stage ${stage} sourceCorrelationId mismatch`);
  }
  const allowedExitCodes = record.status === 'PASS'
    ? [0]
    : record.status === 'PASS_WITH_WARNINGS'
      ? [0, 2]
      : record.status === 'SKIPPED'
        ? [0]
        : null;
  if (allowedExitCodes && !allowedExitCodes.includes(Number(record.exitCode))) {
    violations.push(`stage ${stage} exitCode incompatible with status ${record.status}`);
  }
  if ((record.status === 'FAIL' || record.status === 'BLOCKED') && Number(record.exitCode) === 0) {
    violations.push(`stage ${stage} must use a non-zero exitCode when status is ${record.status}`);
  }
}

const missingRequired = stageOrder.filter((stage) => !stageRecords.has(stage));
const invalidRequired = [];
for (const stage of stageOrder) {
  const entry = stageRecords.get(stage);
  if (entry && entry.invalid) {
    invalidRequired.push(stage);
  }
}

if (missingRequired.length > 0) {
  violations.push(`missing required stages: ${missingRequired.join(', ')}`);
}
if (invalidRequired.length > 0) {
  violations.push(`invalid stage records: ${invalidRequired.join(', ')}`);
}

const hasBlocking = violations.length > 0 || invalidRequired.length > 0 || missingRequired.length > 0;
const hasWarnings = warnings.length > 0 || stageOrder.some((stage) => stageStatus[stage] === 'PASS_WITH_WARNINGS');

let status = 'PASS';
if (hasBlocking) {
  status = 'BLOCKED';
} else if (strict && (hasWarnings || stageOrder.some((stage) => stageStatus[stage] === 'SKIPPED'))) {
  status = 'FAIL';
} else if (hasWarnings) {
  status = 'PASS_WITH_WARNINGS';
}

const startedAt = new Date().toISOString();
const summary = {
  contractVersion: '1.0.0',
  correlationId,
  parentCorrelationId: correlationId,
  sourceCorrelationId: null,
  stage: 'contractValidation',
  component: 'scripts/consolidation/contract-validator.sh',
  status,
  exitCode: status === 'PASS' ? 0 : status === 'PASS_WITH_WARNINGS' ? 2 : status === 'BLOCKED' ? 17 : 16,
  startedAt,
  finishedAt: new Date().toISOString(),
  durationMs: 0,
  required: true,
  skipped: false,
  justification: null,
  warnings: unique(warnings),
  errors: unique(errors),
  evidence: [
    path.join(outputDir, 'evidence-validation.json'),
    path.join(outputDir, 'portability-validation.json'),
  ],
  outputDir,
  logFile: path.join(outputDir, 'contract-validation.log'),
  notes: [],
  stdout: '',
  stderr: '',
  command: ['bash', path.join('scripts', 'consolidation', 'contract-validator.sh')].join(' '),
  summary: {
    environment,
    strict,
    skipHttp,
    artifact: artifactPath,
    artifactDir,
    manifest: manifestPath,
    policy: policyPath,
    stageStatuses: {
      ...stageStatus,
      contractValidation: status,
    },
    missingRequired,
    invalidRequired,
    violations: unique(violations),
  },
};

fs.writeFileSync(path.join(outputDir, 'stage-contract-results.json'), `${JSON.stringify(summary, null, 2)}\n`);

if (explain || verbose) {
  process.stderr.write([
    `status=${summary.status}`,
    `missing=${missingRequired.join(',') || 'none'}`,
    `warnings=${summary.warnings.length}`,
    `violations=${summary.summary.violations.length}`,
  ].join(' | '));
  process.stderr.write('\n');
}

if (status === 'PASS') {
  process.exit(0);
}
if (status === 'PASS_WITH_WARNINGS') {
  process.exit(2);
}
if (status === 'BLOCKED') {
  process.exit(17);
}
process.exit(16);
NODE
