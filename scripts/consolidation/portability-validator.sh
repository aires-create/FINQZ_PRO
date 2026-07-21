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
  portability-validator.sh --state-dir <dir> --output <dir> --artifact <path> --artifact-dir <dir> --manifest <path> --policy <path> --environment <name> --correlation-id <id> [--strict] [--skip-http] [--explain] [--verbose]
EOF
}

fail() {
  local code="$1"
  shift
  printf '%s ERROR [portability-validator] %s\n' "$(timestamp_utc)" "$*" >&2
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

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));
const unique = (values) => [...new Set(values.filter(Boolean))];
const walkValues = (value, visitor) => {
  if (Array.isArray(value)) {
    for (const item of value) walkValues(item, visitor);
    return;
  }
  if (value && typeof value === 'object') {
    for (const entry of Object.values(value)) walkValues(entry, visitor);
    return;
  }
  visitor(value);
};

const warnings = [];
const errors = [];
const checks = [];

const executionMetadataPath = path.join(outputDir, 'execution-metadata.json');
if (!fs.existsSync(executionMetadataPath)) {
  errors.push('execution metadata is missing');
} else {
  const executionMetadata = readJson(executionMetadataPath);
  walkValues(executionMetadata, (value) => {
    if (typeof value !== 'string') return;
    if (/^[A-Za-z]:\\/.test(value) || /^\/(?!TEMP_FIXTURE|SANITIZED)/.test(value)) {
      warnings.push(`portable path review required: ${value}`);
    }
  });
  checks.push({ target: 'execution-metadata', status: 'READ' });
}

const stageDir = path.join(stateDir, 'stage-records');
for (const fileName of fs.existsSync(stageDir) ? fs.readdirSync(stageDir) : []) {
  if (!fileName.endsWith('.json')) continue;
  const filePath = path.join(stageDir, fileName);
  try {
    const record = readJson(filePath);
    walkValues(record, (value) => {
      if (typeof value !== 'string') return;
      if (/^[A-Za-z]:\\/.test(value)) {
        warnings.push(`absolute path recorded in ${fileName}`);
      }
    });
  } catch {
    errors.push(`invalid stage record: ${fileName}`);
  }
}

const evidenceValidationPath = path.join(outputDir, 'evidence-validation.json');
if (fs.existsSync(evidenceValidationPath)) {
  try {
    const evidenceValidation = readJson(evidenceValidationPath);
    if (evidenceValidation.status === 'PASS_WITH_WARNINGS') {
      warnings.push('evidence validation reported warnings');
    }
  } catch {
    errors.push('evidence-validation.json is invalid JSON');
  }
} else {
  errors.push('evidence-validation.json is missing');
}

let status = 'PASS';
if (errors.length > 0) {
  status = 'BLOCKED';
} else if (warnings.length > 0) {
  status = strict ? 'FAIL' : 'PASS_WITH_WARNINGS';
}

const summary = {
  contractVersion: '1.0.0',
  correlationId,
  parentCorrelationId: correlationId,
  sourceCorrelationId: null,
  stage: 'portabilityValidation',
  component: 'scripts/consolidation/portability-validator.sh',
  status,
  exitCode: status === 'PASS' ? 0 : status === 'PASS_WITH_WARNINGS' ? 2 : status === 'BLOCKED' ? 17 : 16,
  startedAt: new Date().toISOString(),
  finishedAt: new Date().toISOString(),
  durationMs: 0,
  required: true,
  skipped: false,
  justification: null,
  warnings: unique(warnings),
  errors: unique(errors),
  evidence: [
    path.join(outputDir, 'portability-validation.json'),
  ],
  outputDir,
  logFile: path.join(outputDir, 'portability-validation.log'),
  notes: [],
  stdout: '',
  stderr: '',
  command: ['bash', path.join('scripts', 'consolidation', 'portability-validator.sh')].join(' '),
  checks,
  summary: {
    environment,
    strict,
    skipHttp,
    artifact: artifactPath,
    artifactDir,
    manifest: manifestPath,
    policy: policyPath,
  },
};

fs.writeFileSync(path.join(outputDir, 'portability-validation.json'), `${JSON.stringify(summary, null, 2)}\n`);

if (explain || verbose) {
  process.stderr.write([
    `status=${summary.status}`,
    `warnings=${summary.warnings.length}`,
    `errors=${summary.errors.length}`,
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
