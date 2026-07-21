#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

state_dir=""
output_dir="${repo_root}/release/gate"
policy_path="${repo_root}/release/policies/release-gate-policy.json"
artifact_path=""
environment=""
correlation_id=""
strict="false"
explain="false"
skip_http="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [evidence-aggregator] %s\n' "$(timestamp_utc)" "${level}" "$*" >&2
}

usage() {
  cat <<'EOF'
Usage:
  evidence-aggregator.sh --state-dir <dir> --output <dir> --policy <path> --artifact <path> --environment <name> --correlation-id <id> [--strict] [--explain] [--skip-http]
EOF
}

main() {
  while (($#)); do
    case "$1" in
      --state-dir)
        [[ $# -ge 2 ]] || { log_line ERROR "--state-dir requires a value"; exit 17; }
        state_dir="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || { log_line ERROR "--output requires a value"; exit 17; }
        output_dir="$2"
        shift 2
        ;;
      --policy)
        [[ $# -ge 2 ]] || { log_line ERROR "--policy requires a value"; exit 17; }
        policy_path="$2"
        shift 2
        ;;
      --artifact)
        [[ $# -ge 2 ]] || { log_line ERROR "--artifact requires a value"; exit 17; }
        artifact_path="$2"
        shift 2
        ;;
      --environment)
        [[ $# -ge 2 ]] || { log_line ERROR "--environment requires a value"; exit 17; }
        environment="$2"
        shift 2
        ;;
      --correlation-id)
        [[ $# -ge 2 ]] || { log_line ERROR "--correlation-id requires a value"; exit 17; }
        correlation_id="$2"
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
        exit 17
        ;;
    esac
  done

  [[ -n "${state_dir}" ]] || { log_line ERROR "--state-dir is required"; exit 17; }
  [[ -d "${state_dir}" ]] || { log_line ERROR "state directory not found: ${state_dir}"; exit 17; }
  [[ -f "${policy_path}" ]] || { log_line ERROR "policy file not found: ${policy_path}"; exit 17; }
  [[ -n "${environment}" ]] || { log_line ERROR "--environment is required"; exit 17; }
  [[ -n "${correlation_id}" ]] || { log_line ERROR "--correlation-id is required"; exit 17; }
  [[ -n "${artifact_path}" ]] || { log_line ERROR "--artifact is required"; exit 17; }

  mkdir -p "${output_dir}"

  STATE_DIR="${state_dir}" \
  OUTPUT_DIR="${output_dir}" \
  POLICY_PATH="${policy_path}" \
  ARTIFACT_PATH="${artifact_path}" \
  ENVIRONMENT="${environment}" \
  CORRELATION_ID="${correlation_id}" \
  STRICT_MODE="${strict}" \
  EXPLAIN_MODE="${explain}" \
  SKIP_HTTP="${skip_http}" \
  node <<'NODE'
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

class GateError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const stateDir = process.env.STATE_DIR;
const outputDir = process.env.OUTPUT_DIR;
const policyPath = process.env.POLICY_PATH;
const artifactPath = process.env.ARTIFACT_PATH;
const environment = process.env.ENVIRONMENT;
const correlationId = process.env.CORRELATION_ID;
const strict = process.env.STRICT_MODE === 'true';
const explain = process.env.EXPLAIN_MODE === 'true';
const skipHttp = process.env.SKIP_HTTP === 'true';

const releaseVerificationPath = path.join(stateDir, 'release-verification.json');
const deployDryRunPath = path.join(stateDir, 'deploy-dry-run.json');
const runtimeValidationPath = path.join(stateDir, 'runtime-validation.json');

const requiredOutputs = {
  deploy: [
    'runtime-check.json',
    'artifact-validation.json',
    'dry-run.json',
    'deploy-engine-report.md',
  ],
  runtime: [
    'runtime-summary.json',
    'runtime-report.md',
    'frontend-validation.json',
    'bundle-validation.json',
    'http-validation.json',
    'security-validation.json',
    'compatibility-validation.json',
  ],
};

const readJson = (filePath, label, code = 17) => {
  if (!fs.existsSync(filePath)) {
    throw new GateError(code, `${label} not found: ${filePath}`);
  }

  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch (error) {
    throw new GateError(code, `${label} is not valid JSON: ${filePath}`);
  }
};

const readText = (filePath, label) => {
  if (!fs.existsSync(filePath)) {
    throw new GateError(17, `${label} not found: ${filePath}`);
  }
  return fs.readFileSync(filePath, 'utf8');
};

const summarizeStream = (text) => text.split(/\r?\n/).filter(Boolean);

const commandVersion = (command, args) => {
  const result = spawnSync(command, args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) {
    return {
      available: false,
      version: null,
    };
  }
  const value = (result.stdout || result.stderr || '').trim().split(/\r?\n/)[0] || null;
  return {
    available: true,
    version: value,
  };
};

const loadStage = (filePath, label) => {
  const record = readJson(filePath, label);
  const required = ['stage', 'command', 'startedAt', 'finishedAt', 'durationMs', 'exitCode', 'stdout', 'stderr', 'logFile'];
  for (const key of required) {
    if (!(key in record)) {
      throw new GateError(17, `${label} is missing required field: ${key}`);
    }
  }
  return record;
};

const collectWarningsAndErrors = (record) => ({
  warnings: Array.isArray(record.warnings) ? record.warnings.slice() : [],
  errors: Array.isArray(record.errors) ? record.errors.slice() : [],
});

const releaseRecord = loadStage(releaseVerificationPath, 'release verification record');
const deployRecord = loadStage(deployDryRunPath, 'deploy dry-run record');
const runtimeRecord = loadStage(runtimeValidationPath, 'runtime validation record');

if (releaseRecord.stage !== 'releaseVerification') {
  throw new GateError(17, 'release verification record has an unexpected stage name');
}
if (deployRecord.stage !== 'deployDryRun') {
  throw new GateError(17, 'deploy dry-run record has an unexpected stage name');
}
if (runtimeRecord.stage !== 'runtimeValidation') {
  throw new GateError(17, 'runtime validation record has an unexpected stage name');
}

const policy = readJson(policyPath, 'policy', 12);
const policyHash = crypto.createHash('sha256').update(fs.readFileSync(policyPath, 'utf8')).digest('hex');

const artifactDir = path.dirname(artifactPath);
const artifactManifestPath = path.join(artifactDir, 'manifest.json');
const artifactVersion = fs.existsSync(artifactManifestPath)
  ? (() => {
      try {
        const manifest = JSON.parse(fs.readFileSync(artifactManifestPath, 'utf8'));
        return manifest.artifactVersion || manifest.release || '';
      } catch {
        return '';
      }
    })()
  : '';

const requiredMissing = [];
const invalidEvidence = [];

const deployEvidence = {};
for (const fileName of requiredOutputs.deploy) {
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) {
    requiredMissing.push(fileName);
    continue;
  }
  deployEvidence[fileName] = filePath;
  if (fileName.endsWith('.json')) {
    try {
      deployEvidence[fileName] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      invalidEvidence.push(fileName);
    }
  }
}

const runtimeEvidence = {};
for (const fileName of requiredOutputs.runtime) {
  const filePath = path.join(outputDir, fileName);
  if (!fs.existsSync(filePath)) {
    requiredMissing.push(fileName);
    continue;
  }
  runtimeEvidence[fileName] = filePath;
  if (fileName.endsWith('.json')) {
    try {
      runtimeEvidence[fileName] = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch {
      invalidEvidence.push(fileName);
    }
  }
}

let releaseWarnings = collectWarningsAndErrors(releaseRecord).warnings;
let releaseErrors = collectWarningsAndErrors(releaseRecord).errors;

const deployJson = deployEvidence['dry-run.json'];
const deployJsonWarnings = Array.isArray(deployJson?.avisos) ? deployJson.avisos.slice() : [];
const deployJsonErrors = Array.isArray(deployJson?.erros) ? deployJson.erros.slice() : [];
const runtimeCheck = deployEvidence['runtime-check.json'] && typeof deployEvidence['runtime-check.json'] === 'object'
  ? deployEvidence['runtime-check.json']
  : null;
const artifactValidation = deployEvidence['artifact-validation.json'] && typeof deployEvidence['artifact-validation.json'] === 'object'
  ? deployEvidence['artifact-validation.json']
  : null;
const runtimeSummary = runtimeEvidence['runtime-summary.json'];
const runtimeWarnings = Array.isArray(runtimeSummary?.warnings) ? runtimeSummary.warnings.slice() : [];
const runtimeErrors = Array.isArray(runtimeSummary?.errors) ? runtimeSummary.errors.slice() : [];
const runtimeCheckWarnings = Array.isArray(runtimeCheck?.warnings) ? runtimeCheck.warnings.slice() : Array.isArray(runtimeCheck?.avisos) ? runtimeCheck.avisos.slice() : [];
const runtimeCheckErrors = Array.isArray(runtimeCheck?.errors) ? runtimeCheck.errors.slice() : Array.isArray(runtimeCheck?.erros) ? runtimeCheck.erros.slice() : [];
const artifactValidationWarnings = Array.isArray(artifactValidation?.warnings) ? artifactValidation.warnings.slice() : Array.isArray(artifactValidation?.avisos) ? artifactValidation.avisos.slice() : [];
const artifactValidationErrors = Array.isArray(artifactValidation?.errors) ? artifactValidation.errors.slice() : Array.isArray(artifactValidation?.erros) ? artifactValidation.erros.slice() : [];

const aggregateWarnings = [
  ...releaseWarnings,
  ...runtimeCheckWarnings,
  ...artifactValidationWarnings,
  ...deployJsonWarnings,
  ...runtimeWarnings,
];
const aggregateErrors = [
  ...releaseErrors,
  ...runtimeCheckErrors,
  ...artifactValidationErrors,
  ...deployJsonErrors,
  ...runtimeErrors,
];

const hasSignalItems = (value, key) => Array.isArray(value?.[key]) && value[key].length > 0;

const determineStageStatus = (record, evidence, extras = []) => {
  if (record.exitCode !== 0) {
    return 'FAIL';
  }

  const evidenceList = [evidence, ...extras].filter(Boolean);

  if (evidenceList.some((item) => item.status === 'SKIPPED')) {
    return 'SKIPPED';
  }

  if (evidenceList.some((item) => item.status === 'PASS_WITH_WARNINGS')) {
    return 'PASS_WITH_WARNINGS';
  }

  if (evidenceList.some((item) => hasSignalItems(item, 'warnings') || hasSignalItems(item, 'avisos'))) {
    return 'PASS_WITH_WARNINGS';
  }

  if (evidenceList.some((item) => hasSignalItems(item, 'errors') || hasSignalItems(item, 'erros'))) {
    return 'FAIL';
  }

  if (evidenceList.some((item) => item.status === 'SUCCESS' || item.status === 'PASS' || item.status === 'DRY_RUN_COMPLETED' || item.status === 'COMPATIBILITY_OK' || item.status === 'HTTP_OK' || item.status === 'FRONTEND_OK' || item.status === 'BUNDLE_OK' || item.status === 'SECURITY_OK')) {
    return 'PASS';
  }

  return 'PASS';
};

const releaseVerification = {
  stage: 'releaseVerification',
  status: releaseRecord.exitCode === 0 ? 'PASS' : 'FAIL',
  exitCode: releaseRecord.exitCode,
  command: releaseRecord.command,
  startedAt: releaseRecord.startedAt,
  finishedAt: releaseRecord.finishedAt,
  durationMs: releaseRecord.durationMs,
  logFile: releaseRecord.logFile,
  stdout: releaseRecord.stdout,
  stderr: releaseRecord.stderr,
  warnings: releaseWarnings,
  errors: releaseErrors,
  evidenceFiles: [releaseRecord.logFile],
};

const deployDryRun = {
  stage: 'deployDryRun',
  status: determineStageStatus(deployRecord, deployJson, [runtimeCheck, artifactValidation]),
  exitCode: deployRecord.exitCode,
  command: deployRecord.command,
  startedAt: deployRecord.startedAt,
  finishedAt: deployRecord.finishedAt,
  durationMs: deployRecord.durationMs,
  logFile: deployRecord.logFile,
  stdout: deployRecord.stdout,
  stderr: deployRecord.stderr,
  warnings: deployJsonWarnings,
  errors: deployJsonErrors,
  evidenceFiles: requiredOutputs.deploy.map((fileName) => path.join(outputDir, fileName)),
  evidence: {
    runtimeCheck: deployEvidence['runtime-check.json'] || null,
    artifactValidation: deployEvidence['artifact-validation.json'] || null,
    dryRun: deployJson || null,
    reportPath: path.join(outputDir, 'deploy-engine-report.md'),
  },
};

const runtimeValidation = {
  stage: 'runtimeValidation',
  status: determineStageStatus(runtimeRecord, runtimeSummary),
  exitCode: runtimeRecord.exitCode,
  command: runtimeRecord.command,
  startedAt: runtimeRecord.startedAt,
  finishedAt: runtimeRecord.finishedAt,
  durationMs: runtimeRecord.durationMs,
  logFile: runtimeRecord.logFile,
  stdout: runtimeRecord.stdout,
  stderr: runtimeRecord.stderr,
  warnings: runtimeWarnings,
  errors: runtimeErrors,
  evidenceFiles: requiredOutputs.runtime.map((fileName) => path.join(outputDir, fileName)),
  evidence: {
    summary: runtimeSummary || null,
    reportPath: path.join(outputDir, 'runtime-report.md'),
    httpStatus: runtimeSummary?.http || null,
  },
};

const evidenceIntegrity = {
  status: requiredMissing.length > 0 || invalidEvidence.length > 0 ? 'BLOCKED' : 'PASS',
  missingStages: requiredMissing,
  invalidFiles: invalidEvidence,
  errors: [
    ...requiredMissing.map((fileName) => `missing evidence file: ${fileName}`),
    ...invalidEvidence.map((fileName) => `invalid JSON evidence file: ${fileName}`),
  ],
};

const stageResults = {
  releaseGateVersion: '1.0.0',
  correlationId,
  environment,
  dryRun: true,
  strict,
  explain,
  skipHttp,
  startedAt: releaseRecord.startedAt,
  finishedAt: runtimeRecord.finishedAt,
  durationMs: Math.max(0, Date.parse(runtimeRecord.finishedAt) - Date.parse(releaseRecord.startedAt)),
  git: {
    branch: releaseRecord.git?.branch || runtimeRecord.git?.branch || 'unknown',
    commit: releaseRecord.git?.commit || runtimeRecord.git?.commit || 'unknown',
    treeDirty: Boolean(releaseRecord.git?.treeDirty ?? runtimeRecord.git?.treeDirty ?? false),
  },
  artifact: {
    path: artifactPath,
    sha256: crypto.createHash('sha256').update(fs.readFileSync(artifactPath)).digest('hex'),
    version: artifactVersion || 'unknown',
  },
  policy: {
    path: policyPath,
    version: policy.version,
    hash: policyHash,
    allowWarnings: policy.environments?.[environment]?.allowWarnings ?? false,
    allowHttpSkipped: policy.environments?.[environment]?.allowHttpSkipped ?? false,
    requireCleanGitTree: policy.environments?.[environment]?.requireCleanGitTree ?? false,
    requiredStages: policy.environments?.[environment]?.requiredStages ?? [],
  },
  stages: {
    releaseVerification,
    deployDryRun,
    runtimeValidation,
  },
  warnings: aggregateWarnings,
  errors: aggregateErrors,
  evidenceIntegrity,
};

const stageStatusValues = [
  releaseVerification.status,
  deployDryRun.status,
  runtimeValidation.status,
];

if (evidenceIntegrity.status === 'BLOCKED') {
  stageResults.status = 'BLOCKED';
} else if (stageStatusValues.includes('FAIL')) {
  stageResults.status = 'FAIL';
} else if (stageStatusValues.includes('PASS_WITH_WARNINGS')) {
  stageResults.status = 'PASS_WITH_WARNINGS';
} else {
  stageResults.status = 'PASS';
}

const versionLabel = {
  bash: commandVersion('bash', ['--version']),
  git: commandVersion('git', ['--version']),
  node: { available: true, version: process.version },
  npm: commandVersion('npm', ['--version']),
  tar: commandVersion('tar', ['--version']),
  sha256sum: commandVersion('sha256sum', ['--version']),
  shellcheck: commandVersion('shellcheck', ['--version']),
};

const executionMetadata = {
  releaseGateVersion: '1.0.0',
  correlationId,
  startedAt: releaseRecord.startedAt,
  finishedAt: runtimeRecord.finishedAt,
  durationMs: Math.max(0, Date.parse(runtimeRecord.finishedAt) - Date.parse(releaseRecord.startedAt)),
  environment,
  dryRun: true,
  strict,
  explain,
  skipHttp,
  system: {
    os: os.platform(),
    arch: os.arch(),
    shell: process.env.SHELL || process.env.ComSpec || 'unknown',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
    utcDate: new Date().toISOString(),
    hostname: os.hostname(),
  },
  git: {
    branch: releaseRecord.git?.branch || runtimeRecord.git?.branch || 'unknown',
    commit: releaseRecord.git?.commit || runtimeRecord.git?.commit || 'unknown',
    treeDirty: Boolean(releaseRecord.git?.treeDirty ?? runtimeRecord.git?.treeDirty ?? false),
  },
  artifact: {
    path: artifactPath,
    sha256: stageResults.artifact.sha256,
    version: stageResults.artifact.version,
  },
  policy: {
    path: policyPath,
    version: policy.version,
    hash: policyHash,
  },
  toolVersions: versionLabel,
  stageDurationsMs: {
    releaseVerification: releaseRecord.durationMs,
    deployDryRun: deployRecord.durationMs,
    runtimeValidation: runtimeRecord.durationMs,
  },
};

const hasBlockingEvidence = evidenceIntegrity.status === 'BLOCKED';
if (hasBlockingEvidence) {
  stageResults.status = 'BLOCKED';
}

fs.mkdirSync(outputDir, { recursive: true });
const stageResultsPath = path.join(outputDir, 'stage-results.json');
const executionMetadataPath = path.join(outputDir, 'execution-metadata.json');
fs.writeFileSync(stageResultsPath, `${JSON.stringify(stageResults, null, 2)}\n`);
fs.writeFileSync(executionMetadataPath, `${JSON.stringify(executionMetadata, null, 2)}\n`);

if (explain) {
  process.stderr.write([
    `correlationId=${correlationId}`,
    `releaseVerification=${releaseVerification.status}`,
    `deployDryRun=${deployDryRun.status}`,
    `runtimeValidation=${runtimeValidation.status}`,
    `evidence=${evidenceIntegrity.status}`,
  ].join(' | '));
  process.stderr.write('\n');
}

if (hasBlockingEvidence) {
  throw new GateError(17, 'evidence is incomplete');
}

process.exit(0);
NODE
}

main "$@"
