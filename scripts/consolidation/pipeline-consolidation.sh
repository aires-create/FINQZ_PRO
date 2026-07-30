#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

artifact_path=""
artifact_dir=""
manifest_path=""
policy_path="${repo_root}/release/policies/release-gate-policy.json"
environment=""
output_base="${repo_root}/release/consolidation"
dry_run="false"
strict="false"
skip_http="false"
explain="false"
verbose="false"

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

log_line() {
  local level="$1"
  shift
  printf '%s %s [pipeline-consolidation] %s\n' "$(timestamp_utc)" "${level}" "$*"
}

usage() {
  cat <<'EOF'
Usage:
  pipeline-consolidation.sh --artifact <arquivo.tar.gz> [--artifact-dir <diretorio>] [--manifest <arquivo>] [--policy <arquivo>] --environment <local|hml|production> [--output <dir>] --dry-run [--strict] [--skip-http] [--explain] [--verbose]
EOF
}

fail() {
  local code="$1"
  shift
  log_line ERROR "$*"
  exit "${code}"
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || fail 20 "required command not found: $1"
}

main() {
  while (($#)); do
    case "$1" in
      --artifact)
        [[ $# -ge 2 ]] || fail 10 "--artifact requires a value"
        artifact_path="$2"
        shift 2
        ;;
      --artifact-dir)
        [[ $# -ge 2 ]] || fail 10 "--artifact-dir requires a value"
        artifact_dir="$2"
        shift 2
        ;;
      --manifest)
        [[ $# -ge 2 ]] || fail 10 "--manifest requires a value"
        manifest_path="$2"
        shift 2
        ;;
      --policy)
        [[ $# -ge 2 ]] || fail 10 "--policy requires a value"
        policy_path="$2"
        shift 2
        ;;
      --environment)
        [[ $# -ge 2 ]] || fail 10 "--environment requires a value"
        environment="$2"
        shift 2
        ;;
      --output)
        [[ $# -ge 2 ]] || fail 10 "--output requires a value"
        output_base="$2"
        shift 2
        ;;
      --dry-run)
        dry_run="true"
        shift
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
        fail 10 "unknown argument: $1"
        ;;
    esac
  done

  require_cmd git
  require_cmd node
  require_cmd tar
  require_cmd sha256sum

  [[ "${dry_run}" == "true" ]] || fail 20 "--dry-run is required"
  [[ -n "${environment}" ]] || fail 10 "--environment is required"
  case "${environment}" in
    local|hml|production) ;;
    *) fail 20 "invalid environment: ${environment}" ;;
  esac

  if [[ -z "${artifact_path}" && -z "${artifact_dir}" ]]; then
    fail 10 "either --artifact or --artifact-dir is required"
  fi

  if [[ -n "${artifact_dir}" ]]; then
    [[ -d "${artifact_dir}" ]] || fail 11 "artifact directory not found: ${artifact_dir}"
  fi

  if [[ -n "${artifact_path}" ]]; then
    [[ -f "${artifact_path}" ]] || fail 11 "artifact file not found: ${artifact_path}"
  fi

  if [[ -n "${artifact_dir}" && -z "${artifact_path}" ]]; then
    mapfile -t found_tarballs < <(find "${artifact_dir}" -maxdepth 1 -type f \( -name '*.tar.gz' -o -name '*.tgz' \) | sort)
    if [[ "${#found_tarballs[@]}" -eq 0 ]]; then
      fail 11 "no tar.gz artifact found in directory: ${artifact_dir}"
    fi
    if [[ "${#found_tarballs[@]}" -gt 1 ]]; then
      fail 11 "multiple tar.gz artifacts found in directory: ${artifact_dir}"
    fi
    artifact_path="${found_tarballs[0]}"
  fi

  if [[ -z "${artifact_dir}" ]]; then
    artifact_dir="$(cd "$(dirname "${artifact_path}")" && pwd)"
  fi

  if [[ -z "${manifest_path}" ]]; then
    manifest_path="${artifact_dir}/manifest.json"
  fi

  artifact_path="$(cd "$(dirname "${artifact_path}")" && pwd)/$(basename "${artifact_path}")"
  manifest_path="$(cd "$(dirname "${manifest_path}")" && pwd)/$(basename "${manifest_path}")"
  policy_path="$(cd "$(dirname "${policy_path}")" && pwd)/$(basename "${policy_path}")"
  output_base="$(cd "$(dirname "${output_base}")" && pwd)/$(basename "${output_base}")"

  [[ -f "${policy_path}" ]] || fail 12 "policy file not found: ${policy_path}"

  case "${output_base}" in
    "${repo_root}"|"${repo_root}"/*) ;;
    *) fail 20 "unsafe output directory: ${output_base}" ;;
  esac

  if [[ ! -d "${output_base}" ]]; then
    mkdir -p "${output_base}"
  fi

  commit="$(git -C "${repo_root}" rev-parse --short=7 HEAD)"
  correlation_id="consolidation-$(date -u +"%Y%m%dT%H%M%SZ")-${commit}"
  output_dir="${output_base}/${correlation_id}"
  [[ ! -e "${output_dir}" ]] || fail 17 "output directory already exists for this correlation id: ${output_dir}"
  mkdir -p "${output_dir}"

  pipeline_log="${output_dir}/pipeline.log"
  : > "${pipeline_log}"
  exec > >(tee -a "${pipeline_log}") 2>&1

  PIPELINE_ROOT="${repo_root}" \
  PIPELINE_OUTPUT_DIR="${output_dir}" \
  PIPELINE_STATE_DIR="${output_dir}/.state" \
  PIPELINE_ARTIFACT_PATH="${artifact_path}" \
  PIPELINE_ARTIFACT_DIR="${artifact_dir}" \
  PIPELINE_MANIFEST_PATH="${manifest_path}" \
  PIPELINE_POLICY_PATH="${policy_path}" \
  PIPELINE_ENVIRONMENT="${environment}" \
  PIPELINE_CORRELATION_ID="${correlation_id}" \
  PIPELINE_DRY_RUN="${dry_run}" \
  PIPELINE_STRICT="${strict}" \
  PIPELINE_SKIP_HTTP="${skip_http}" \
  PIPELINE_EXPLAIN="${explain}" \
  PIPELINE_VERBOSE="${verbose}" \
  PIPELINE_LOG_PATH="${pipeline_log}" \
  node <<'NODE'
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

class ConsolidationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

const repoRoot = process.env.PIPELINE_ROOT;
const outputDir = process.env.PIPELINE_OUTPUT_DIR;
const stateDir = process.env.PIPELINE_STATE_DIR;
const artifactPath = process.env.PIPELINE_ARTIFACT_PATH;
const artifactDir = process.env.PIPELINE_ARTIFACT_DIR;
const manifestPath = process.env.PIPELINE_MANIFEST_PATH;
const policyPath = process.env.PIPELINE_POLICY_PATH;
const environment = process.env.PIPELINE_ENVIRONMENT;
const correlationId = process.env.PIPELINE_CORRELATION_ID;
const dryRun = process.env.PIPELINE_DRY_RUN === 'true';
const strict = process.env.PIPELINE_STRICT === 'true';
const skipHttp = process.env.PIPELINE_SKIP_HTTP === 'true';
const explain = process.env.PIPELINE_EXPLAIN === 'true';
const verbose = process.env.PIPELINE_VERBOSE === 'true';

const bashExe = process.platform === 'win32'
  ? (fs.existsSync('C:/Program Files/Git/bin/bash.exe') ? 'C:/Program Files/Git/bin/bash.exe' : 'bash')
  : 'bash';

const toPosix = (filePath) => {
  if (process.platform !== 'win32') {
    return filePath;
  }
  return filePath.replace(/\\/g, '/').replace(/^([A-Za-z]):/, (_, drive) => `/${drive.toLowerCase()}`);
};

const bashArgs = (scriptPath, args = []) => [toPosix(scriptPath), ...args.map((arg) => String(arg))];

const timestamp = () => new Date().toISOString();
const nowMs = () => Date.now();

const log = (level, message) => {
  process.stdout.write(`${timestamp()} ${level} [pipeline-consolidation] ${message}\n`);
};

const writeJson = (filePath, payload) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
};

const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8'));

const readJsonIfExists = (filePath) => {
  if (!fs.existsSync(filePath)) return null;
  return readJson(filePath);
};

const sha256 = (filePath) => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');

const sanitizePath = (filePath) => {
  const normalized = path.resolve(filePath);
  const repoRootNormalized = path.resolve(repoRoot);
  if (normalized.startsWith(repoRootNormalized)) {
    return path.relative(repoRootNormalized, normalized).replace(/\\/g, '/');
  }
  const tempRoot = path.resolve(os.tmpdir());
  if (normalized.startsWith(tempRoot)) {
    return `<TEMP_FIXTURE>/${path.basename(normalized)}`;
  }
  return `<SANITIZED>/${path.basename(normalized)}`;
};

const ensureDir = (dirPath) => {
  fs.mkdirSync(dirPath, { recursive: true });
};

const bashRun = (scriptPath, args = [], options = {}) => {
  const result = spawnSync(bashExe, bashArgs(scriptPath, args), {
    encoding: 'utf8',
    cwd: repoRoot,
    env: { ...process.env, ...options.env },
    maxBuffer: 50 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? (result.error.message || String(result.error)) : null,
  };
};

const nodeRun = (scriptPath, args = [], options = {}) => {
  const result = spawnSync(process.execPath, [scriptPath, ...args], {
    encoding: 'utf8',
    cwd: repoRoot,
    env: { ...process.env, ...options.env },
    maxBuffer: 50 * 1024 * 1024,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout || '',
    stderr: result.stderr || '',
    error: result.error ? (result.error.message || String(result.error)) : null,
  };
};

const stageRecordsDir = path.join(stateDir, 'stage-records');
ensureDir(stageRecordsDir);

const gitBranch = (() => {
  const result = spawnSync('git', ['-C', repoRoot, 'branch', '--show-current'], { encoding: 'utf8' });
  const branch = (result.stdout || '').trim();
  return branch || 'HEAD';
})();
const gitCommit = spawnSync('git', ['-C', repoRoot, 'rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).stdout.trim();
const gitTreeDirty = (() => {
  const result = spawnSync('git', ['-C', repoRoot, 'status', '--porcelain', '--untracked-files=all'], { encoding: 'utf8' });
  return Boolean((result.stdout || '').trim());
})();

const artifactVersion = (() => {
  const manifest = readJson(manifestPath);
  return manifest.artifactVersion || manifest.release || 'unknown';
})();
const artifactSha256 = sha256(artifactPath);

const pipelineStartedAt = timestamp();
const pipelineStartMs = nowMs();

const stageState = new Map();

  const canonicalStages = [
    {
      stage: 'artifactBuild',
      component: 'scripts/build/build-frontend.sh',
      required: false,
      skipped: true,
      justification: 'build-first is not enabled in this consolidation phase',
      command: null,
      logFile: null,
      evidence: [],
    },
    {
      stage: 'releasePackage',
      component: 'scripts/release/package-release.sh',
      required: false,
      skipped: true,
      justification: 'external artifact already provided and validated',
      command: null,
      logFile: null,
      evidence: [],
    },
  ];

const writeStageRecord = (payload) => {
  const filePath = path.join(stageRecordsDir, `${payload.stage}.json`);
  writeJson(filePath, payload);
  stageState.set(payload.stage, payload);
  return filePath;
};

const summarizeLines = (text, token) => text.split(/\r?\n/).filter((line) => line.includes(token)).filter(Boolean);

const runStage = ({
  stage,
  component,
  command,
  args,
  required,
  skipped = false,
  justification = null,
  logFile,
  evidence = [],
  sourceCorrelationId = null,
  determineStatus,
}) => {
  const startedAt = timestamp();
  const startedMs = nowMs();
  let stdout = '';
  let stderr = '';
  let exitCode = 0;
  let status = skipped ? 'SKIPPED' : 'PASS';
  const commandString = command ? [command, ...args].join(' ') : null;

  if (!skipped) {
    const result = command.startsWith('node:')
      ? nodeRun(command.slice(5), args)
      : bashRun(command, args);
    stdout = result.stdout;
    stderr = result.stderr;
    exitCode = result.status;
    if (logFile) {
      fs.mkdirSync(path.dirname(logFile), { recursive: true });
      fs.writeFileSync(logFile, `>>> STDOUT\n${stdout}\n>>> STDERR\n${stderr}\n`);
    }
    if (typeof determineStatus === 'function') {
      status = determineStatus({ exitCode, stdout, stderr, evidence });
    } else {
      status = exitCode === 0 ? 'PASS' : 'FAIL';
    }
  }

  const warnings = summarizeLines(stderr, 'WARNING');
  const errors = summarizeLines(stderr, 'ERROR');
  const finishedAt = timestamp();
  const durationMs = Math.max(0, nowMs() - startedMs);
  const record = {
    contractVersion: '1.0.0',
    correlationId,
    parentCorrelationId: correlationId,
    sourceCorrelationId,
    stage,
    component,
    status,
    exitCode: skipped ? 0 : exitCode,
    startedAt,
    finishedAt,
    durationMs,
    required,
    skipped,
    justification,
    warnings,
    errors,
    evidence,
    outputDir: logFile ? path.dirname(logFile) : null,
    logFile,
    notes: skipped ? [justification].filter(Boolean) : [],
    stdout,
    stderr,
    command: commandString,
  };
  writeStageRecord(record);
  return record;
};

const recordSkipped = (stage, component, required, justification) => {
  return writeStageRecord({
    contractVersion: '1.0.0',
    correlationId,
    parentCorrelationId: correlationId,
    sourceCorrelationId: null,
    stage,
    component,
    status: 'SKIPPED',
    exitCode: 0,
    startedAt: pipelineStartedAt,
    finishedAt: pipelineStartedAt,
    durationMs: 0,
    required,
    skipped: true,
    justification,
    warnings: [],
    errors: [],
    evidence: [],
    outputDir: null,
    logFile: null,
    notes: [justification],
    stdout: '',
    stderr: '',
    command: null,
  });
};

  canonicalStages.forEach((stage) => recordSkipped(stage.stage, stage.component, stage.required, stage.justification));

const recordValidatorStage = ({
  stage,
  component,
  commandLabel,
  result,
  resultPath = null,
  logFile,
  evidence,
  startedAt,
  finishedAt,
  startedMs,
  required = true,
  sourceCorrelationId = null,
}) => {
  const outputStatus = resultPath && fs.existsSync(resultPath)
    ? (() => {
        try {
          return readJson(resultPath).status || null;
        } catch {
          return null;
        }
      })()
    : null;
  const status = outputStatus || (result.status === 0 ? 'PASS' : 'FAIL');
  const record = {
    contractVersion: '1.0.0',
    correlationId,
    parentCorrelationId: correlationId,
    sourceCorrelationId,
    stage,
    component,
    status,
    exitCode: result.status,
    startedAt,
    finishedAt,
    durationMs: Math.max(0, nowMs() - startedMs),
    required,
    skipped: false,
    justification: null,
    warnings: summarizeLines(result.stderr, 'WARNING'),
    errors: summarizeLines(result.stderr, 'ERROR'),
    evidence,
    outputDir,
    logFile,
    notes: [],
    stdout: result.stdout,
    stderr: result.stderr,
    command: commandLabel,
  };
  writeStageRecord(record);
  return record;
};

  const releaseVerification = runStage({
  stage: 'releaseVerification',
  component: 'scripts/release/verify-release.sh',
  command: 'bash',
  args: [path.join(repoRoot, 'scripts/release/verify-release.sh'), artifactDir],
  required: true,
  logFile: path.join(outputDir, 'release-verification.log'),
  evidence: [
    path.join(artifactDir, 'manifest.json'),
    path.join(artifactDir, 'build-info.json'),
    path.join(artifactDir, 'release-notes.md'),
    path.join(artifactDir, 'VERSION'),
    path.join(artifactDir, 'checksums.sha256'),
  ],
  determineStatus: ({ exitCode }) => (exitCode === 0 ? 'PASS' : 'FAIL'),
});

const deployOutputDir = path.join(outputDir, 'deploy');
const deployDryRun = runStage({
  stage: 'deployDryRun',
  component: 'scripts/deploy/deploy-engine.sh',
  command: 'bash',
  args: [path.join(repoRoot, 'scripts/deploy/deploy-engine.sh'), '--artifact', artifactPath, '--manifest', manifestPath, '--dry-run', '--output', deployOutputDir, ...(verbose ? ['--verbose'] : [])],
  required: true,
  logFile: path.join(outputDir, 'deploy-dry-run.log'),
  evidence: [
    path.join(deployOutputDir, 'runtime-check.json'),
    path.join(deployOutputDir, 'artifact-validation.json'),
    path.join(deployOutputDir, 'dry-run.json'),
    path.join(deployOutputDir, 'deploy-engine-report.md'),
  ],
  determineStatus: ({ exitCode }) => (exitCode === 0 ? 'PASS' : 'FAIL'),
});

const runtimeOutputDir = path.join(outputDir, 'runtime');
const runtimeValidation = runStage({
  stage: 'runtimeValidation',
  component: 'scripts/runtime/runtime-validator.sh',
  command: 'bash',
  args: [path.join(repoRoot, 'scripts/runtime/runtime-validator.sh'), '--artifact', artifactDir, '--manifest', manifestPath, '--output', runtimeOutputDir, ...(skipHttp ? ['--skip-http'] : []), ...(verbose ? ['--verbose'] : [])],
  required: true,
  logFile: path.join(outputDir, 'runtime-validation.log'),
  evidence: [
    path.join(runtimeOutputDir, 'runtime-summary.json'),
    path.join(runtimeOutputDir, 'runtime-report.md'),
    path.join(runtimeOutputDir, 'frontend-validation.json'),
    path.join(runtimeOutputDir, 'bundle-validation.json'),
    path.join(runtimeOutputDir, 'http-validation.json'),
    path.join(runtimeOutputDir, 'security-validation.json'),
    path.join(runtimeOutputDir, 'compatibility-validation.json'),
  ],
  determineStatus: ({ exitCode, evidence }) => {
    if (exitCode !== 0) return 'FAIL';
    const summary = readJsonIfExists(path.join(runtimeOutputDir, 'runtime-summary.json'));
    if (summary?.status === 'PASS_WITH_WARNINGS') return 'PASS_WITH_WARNINGS';
    if (summary?.status === 'PASS') return 'PASS';
    if (summary?.status === 'FAIL') return 'FAIL';
    if (summary?.status === 'BLOCKED') return 'BLOCKED';
    return evidence.some((entry) => /http-validation\.json$/.test(entry)) ? 'PASS_WITH_WARNINGS' : 'PASS';
  },
});

const gateOutputBase = path.join(outputDir, 'gate');
const releaseGate = runStage({
  stage: 'releaseGate',
  component: 'scripts/gate/release-gate.sh',
  command: 'bash',
  args: [path.join(repoRoot, 'scripts/gate/release-gate.sh'), '--artifact', artifactPath, '--environment', environment, '--dry-run', '--output', gateOutputBase, ...(strict ? ['--strict'] : []), ...(skipHttp ? ['--skip-http'] : []), ...(explain ? ['--explain'] : []), ...(verbose ? ['--verbose'] : [])],
  required: true,
  logFile: path.join(outputDir, 'release-gate.log'),
  evidence: [
    path.join(gateOutputBase, 'stage-results.json'),
    path.join(gateOutputBase, 'policy-evaluation.json'),
    path.join(gateOutputBase, 'execution-metadata.json'),
    path.join(gateOutputBase, 'release-gate-summary.json'),
    path.join(gateOutputBase, 'release-gate-report.md'),
  ],
  determineStatus: ({ exitCode, evidence }) => {
    if (exitCode === 2) return 'PASS_WITH_WARNINGS';
    if (exitCode === 0) return 'PASS';
    if (exitCode === 17) return 'BLOCKED';
    if (exitCode === 19) return 'FAIL';
    if (exitCode === 16) return 'FAIL';
    if (exitCode !== 0) return 'FAIL';
    const summary = readJsonIfExists(path.join(gateOutputBase, 'release-gate-summary.json'));
    if (summary?.status) return summary.status;
    return evidence.length > 0 ? 'PASS' : 'BLOCKED';
  },
});

const stageContractsBeforeValidators = [
  ...canonicalStages,
  releaseVerification,
  deployDryRun,
  runtimeValidation,
  releaseGate,
];

const writeExecutionMetadata = () => {
  const metadata = {
    consolidationVersion: '1.0.0',
    correlationId,
    parentCorrelationId: null,
    startedAt: pipelineStartedAt,
    finishedAt: timestamp(),
    durationMs: Math.max(0, nowMs() - pipelineStartMs),
    environment,
    dryRun,
    strict,
    skipHttp,
    explain,
    system: {
      os: os.platform(),
      arch: os.arch(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'unknown',
      shell: process.env.SHELL || process.env.ComSpec || 'unknown',
    },
    git: {
      branch: gitBranch,
      commit: gitCommit,
      treeDirty: gitTreeDirty,
    },
    artifact: {
      path: sanitizePath(artifactPath),
      sha256: artifactSha256,
      version: artifactVersion,
      manifest: sanitizePath(manifestPath),
    },
    policy: {
      path: sanitizePath(policyPath),
    },
    sourceCorrelationIds: {
      releaseGate: readJsonIfExists(path.join(gateOutputBase, 'release-gate-summary.json'))?.correlationId || null,
    },
    stageLogs: {
      pipeline: sanitizePath(path.join(outputDir, 'pipeline.log')),
      releaseVerification: sanitizePath(path.join(outputDir, 'release-verification.log')),
      deployDryRun: sanitizePath(path.join(outputDir, 'deploy-dry-run.log')),
      runtimeValidation: sanitizePath(path.join(outputDir, 'runtime-validation.log')),
      releaseGate: sanitizePath(path.join(outputDir, 'release-gate.log')),
    },
    stageDirectories: {
      state: sanitizePath(stateDir),
      deploy: sanitizePath(deployOutputDir),
      runtime: sanitizePath(runtimeOutputDir),
      gate: sanitizePath(gateOutputBase),
    },
    toolVersions: {
      bash: (() => {
        const result = spawnSync(bashExe, ['--version'], { encoding: 'utf8' });
        return (result.stdout || result.stderr || '').split(/\r?\n/)[0] || 'unknown';
      })(),
      git: (() => {
        const result = spawnSync('git', ['--version'], { encoding: 'utf8' });
        return (result.stdout || result.stderr || '').trim() || 'unknown';
      })(),
      node: process.version,
      npm: (() => {
        const result = spawnSync('npm', ['--version'], { encoding: 'utf8' });
        return (result.stdout || result.stderr || '').trim() || 'unknown';
      })(),
      sha256sum: (() => {
        const result = spawnSync('sha256sum', ['--version'], { encoding: 'utf8' });
        return (result.stdout || result.stderr || '').split(/\r?\n/)[0] || 'unknown';
      })(),
    },
  };
  writeJson(path.join(outputDir, 'execution-metadata.json'), metadata);
  return metadata;
};

const releaseGateSummary = readJsonIfExists(path.join(gateOutputBase, 'release-gate-summary.json'));

writeExecutionMetadata();

const evidenceValidatorStartedAt = timestamp();
const evidenceValidatorStartedMs = nowMs();
const evidenceValidator = bashRun(path.join(repoRoot, 'scripts/consolidation/evidence-validator.sh'), [
  '--state-dir', stateDir,
  '--output', outputDir,
  '--artifact', artifactPath,
  '--artifact-dir', artifactDir,
  '--manifest', manifestPath,
  '--policy', policyPath,
  '--environment', environment,
  '--correlation-id', correlationId,
  ...(strict ? ['--strict'] : []),
  ...(skipHttp ? ['--skip-http'] : []),
  ...(explain ? ['--explain'] : []),
  ...(verbose ? ['--verbose'] : []),
]);
fs.writeFileSync(path.join(outputDir, 'evidence-validation.log'), `>>> STDOUT\n${evidenceValidator.stdout}\n>>> STDERR\n${evidenceValidator.stderr}\n`);
recordValidatorStage({
  stage: 'evidenceValidation',
  component: 'scripts/consolidation/evidence-validator.sh',
  commandLabel: ['bash', toPosix(path.join(repoRoot, 'scripts/consolidation/evidence-validator.sh'))].join(' '),
  result: evidenceValidator,
  resultPath: path.join(outputDir, 'evidence-validation.json'),
  logFile: path.join(outputDir, 'evidence-validation.log'),
  evidence: [path.join(outputDir, 'evidence-validation.json')],
  startedAt: evidenceValidatorStartedAt,
  finishedAt: timestamp(),
  startedMs: evidenceValidatorStartedMs,
});

const portabilityValidatorStartedAt = timestamp();
const portabilityValidatorStartedMs = nowMs();
const portabilityValidator = bashRun(path.join(repoRoot, 'scripts/consolidation/portability-validator.sh'), [
  '--state-dir', stateDir,
  '--output', outputDir,
  '--artifact', artifactPath,
  '--artifact-dir', artifactDir,
  '--manifest', manifestPath,
  '--policy', policyPath,
  '--environment', environment,
  '--correlation-id', correlationId,
  ...(strict ? ['--strict'] : []),
  ...(skipHttp ? ['--skip-http'] : []),
  ...(explain ? ['--explain'] : []),
  ...(verbose ? ['--verbose'] : []),
]);
fs.writeFileSync(path.join(outputDir, 'portability-validation.log'), `>>> STDOUT\n${portabilityValidator.stdout}\n>>> STDERR\n${portabilityValidator.stderr}\n`);
recordValidatorStage({
  stage: 'portabilityValidation',
  component: 'scripts/consolidation/portability-validator.sh',
  commandLabel: ['bash', toPosix(path.join(repoRoot, 'scripts/consolidation/portability-validator.sh'))].join(' '),
  result: portabilityValidator,
  resultPath: path.join(outputDir, 'portability-validation.json'),
  logFile: path.join(outputDir, 'portability-validation.log'),
  evidence: [path.join(outputDir, 'portability-validation.json')],
  startedAt: portabilityValidatorStartedAt,
  finishedAt: timestamp(),
  startedMs: portabilityValidatorStartedMs,
});

const contractValidatorStartedAt = timestamp();
const contractValidatorStartedMs = nowMs();
const contractValidator = bashRun(path.join(repoRoot, 'scripts/consolidation/contract-validator.sh'), [
  '--state-dir', stateDir,
  '--output', outputDir,
  '--artifact', artifactPath,
  '--artifact-dir', artifactDir,
  '--manifest', manifestPath,
  '--policy', policyPath,
  '--environment', environment,
  '--correlation-id', correlationId,
  ...(strict ? ['--strict'] : []),
  ...(skipHttp ? ['--skip-http'] : []),
  ...(explain ? ['--explain'] : []),
  ...(verbose ? ['--verbose'] : []),
]);
fs.writeFileSync(path.join(outputDir, 'contract-validation.log'), `>>> STDOUT\n${contractValidator.stdout}\n>>> STDERR\n${contractValidator.stderr}\n`);
recordValidatorStage({
  stage: 'contractValidation',
  component: 'scripts/consolidation/contract-validator.sh',
  commandLabel: ['bash', toPosix(path.join(repoRoot, 'scripts/consolidation/contract-validator.sh'))].join(' '),
  result: contractValidator,
  resultPath: path.join(outputDir, 'stage-contract-results.json'),
  logFile: path.join(outputDir, 'contract-validation.log'),
  evidence: [path.join(outputDir, 'stage-contract-results.json')],
  startedAt: contractValidatorStartedAt,
  finishedAt: timestamp(),
  startedMs: contractValidatorStartedMs,
});

const contractResults = readJsonIfExists(path.join(outputDir, 'stage-contract-results.json'));
const evidenceResults = readJsonIfExists(path.join(outputDir, 'evidence-validation.json'));
const portabilityResults = readJsonIfExists(path.join(outputDir, 'portability-validation.json'));

const finalStart = timestamp();

const report = bashRun(path.join(repoRoot, 'scripts/consolidation/consolidation-report.sh'), [
  '--stage-contract-results', path.join(outputDir, 'stage-contract-results.json'),
  '--evidence-validation', path.join(outputDir, 'evidence-validation.json'),
  '--portability-validation', path.join(outputDir, 'portability-validation.json'),
  '--execution-metadata', path.join(outputDir, 'execution-metadata.json'),
  '--summary-schema', path.join(repoRoot, 'release/schemas/pipeline-consolidation-summary.schema.json'),
  '--output', outputDir,
  '--correlation-id', correlationId,
  '--artifact', artifactPath,
  '--policy', policyPath,
  '--environment', environment,
  ...(strict ? ['--strict'] : []),
  ...(skipHttp ? ['--skip-http'] : []),
  ...(explain ? ['--explain'] : []),
  ...(verbose ? ['--verbose'] : []),
]);
fs.writeFileSync(path.join(outputDir, 'consolidation-report.log'), `>>> STDOUT\n${report.stdout}\n>>> STDERR\n${report.stderr}\n`);

const summaryPath = path.join(outputDir, 'pipeline-consolidation-summary.json');
const summary = readJson(summaryPath);

const finalMessages = [
  `correlationId=${correlationId}`,
  `releaseVerification=${releaseVerification.status}`,
  `deployDryRun=${deployDryRun.status}`,
  `runtimeValidation=${runtimeValidation.status}`,
  `releaseGate=${releaseGate.status}`,
  `contracts=${contractResults?.status || 'unknown'}`,
  `evidence=${evidenceResults?.status || 'unknown'}`,
  `portability=${portabilityResults?.status || 'unknown'}`,
  `status=${summary.status}`,
];
if (releaseGateSummary?.correlationId) {
  finalMessages.push(`releaseGateCorrelationId=${releaseGateSummary.correlationId}`);
}
process.stdout.write(`${finalMessages.join(' | ')}\n`);

if (explain) {
  process.stdout.write(`nextAction=${summary.nextAction}\n`);
}

if (summary.status === 'PASS') process.exit(0);
if (summary.status === 'PASS_WITH_WARNINGS') process.exit(2);
if (summary.status === 'FAIL') process.exit(16);
if (summary.status === 'BLOCKED') process.exit(17);
process.exit(99);
NODE
}

main "$@"
