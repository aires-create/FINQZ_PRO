#!/usr/bin/env bash
set -Eeuo pipefail
IFS=$'\n\t'

script_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
repo_root="$(cd "${script_dir}/../.." && pwd)"

fixture_file=""
run_root=""

timestamp_utc() {
  date -u +"%Y-%m-%dT%H:%M:%SZ"
}

fail() {
  local code="$1"
  shift
  printf '%s ERROR [fixture-builder] %s\n' "$(timestamp_utc)" "$*" >&2
  exit "${code}"
}

usage() {
  cat <<'EOF'
Usage:
  fixture-builder.sh --fixture <fixture.json> --run-root <dir>
EOF
}

while (($#)); do
  case "$1" in
    --fixture)
      [[ $# -ge 2 ]] || fail 12 "--fixture requires a value"
      fixture_file="$2"
      shift 2
      ;;
    --run-root)
      [[ $# -ge 2 ]] || fail 12 "--run-root requires a value"
      run_root="$2"
      shift 2
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      fail 12 "unknown argument: $1"
      ;;
  esac
done

[[ -f "${fixture_file}" ]] || fail 11 "fixture not found: ${fixture_file}"
[[ -n "${run_root}" ]] || fail 12 "--run-root is required"

mkdir -p "${run_root}"

FIXTURE_FILE="${fixture_file}" \
RUN_ROOT="${run_root}" \
REPO_ROOT="${repo_root}" \
node <<'NODE'
const fs = require('fs');
const os = require('os');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');

const fixture = JSON.parse(fs.readFileSync(process.env.FIXTURE_FILE, 'utf8'));
const repoRoot = process.env.REPO_ROOT;
const runRoot = process.env.RUN_ROOT;
const fixtureId = fixture.id;
const fixtureRunDir = path.join(runRoot, fixtureId);

const ensureDir = (dirPath) => fs.mkdirSync(dirPath, { recursive: true });
const writeJson = (filePath, payload) => {
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, `${JSON.stringify(payload, null, 2)}\n`);
};
const sha256 = (filePath) => crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
const relativeFixturePath = (suffix) => path.posix.join(fixtureId, suffix.replace(/\\/g, '/'));
const placeholder = (suffix) => `<TEMP_FIXTURE>/${suffix.replace(/\\/g, '/')}`;
const fixedInstant = '2026-01-01T00:00:00.000Z';
const commit = (spawnSync('git', ['-C', repoRoot, 'rev-parse', '--short=7', 'HEAD'], { encoding: 'utf8' }).stdout || '').trim() || '2fd378b';
const branch = (spawnSync('git', ['-C', repoRoot, 'branch', '--show-current'], { encoding: 'utf8' }).stdout || '').trim() || 'homologation/bootstrap-vps';

if (fs.existsSync(fixtureRunDir)) {
  throw new Error(`fixture run directory already exists: ${fixtureRunDir}`);
}

const dirs = {
  root: fixtureRunDir,
  artifact: path.join(fixtureRunDir, 'artifact'),
  evidence: path.join(fixtureRunDir, 'evidence'),
  state: path.join(fixtureRunDir, 'state'),
  output: path.join(fixtureRunDir, 'output'),
  logs: path.join(fixtureRunDir, 'logs'),
};

Object.values(dirs).forEach(ensureDir);
ensureDir(path.join(dirs.state, 'stage-records'));

fs.writeFileSync(path.join(dirs.root, '.fixture-owner'), `${fixtureId}\n`);

const plan = {
  fixtureVersion: fixture.fixtureVersion || '1.0.0',
  id: fixtureId,
  description: fixture.description || '',
  environment: fixture.environment || 'local',
  strict: Boolean(fixture.strict),
  skipHttp: Boolean(fixture.skipHttp),
  expected: fixture.expected || {},
  summaryRequired: fixture.summaryRequired !== false,
  stageStatuses: {
    artifactBuild: 'PASS',
    releasePackage: 'PASS',
    releaseVerification: 'PASS',
    deployDryRun: 'PASS',
    runtimeValidation: 'PASS',
    releaseGate: 'PASS',
    evidenceValidation: 'PASS',
    portabilityValidation: 'PASS',
  },
  stageExitCodes: {
    artifactBuild: 0,
    releasePackage: 0,
    releaseVerification: 0,
    deployDryRun: 0,
    runtimeValidation: 0,
    releaseGate: 0,
    evidenceValidation: 0,
    portabilityValidation: 0,
  },
  stageJustifications: {
    artifactBuild: null,
    releasePackage: null,
  },
  stageCorrelations: {
    correlationId: `consolidation-20260101T000000Z-${commit}`,
    parentCorrelationId: `consolidation-20260101T000000Z-${commit}`,
    sourceCorrelationId: null,
  },
  runtimeSummaryStatus: 'PASS',
  runtimeWarnings: [],
  runtimeErrors: [],
  runtimeHttpStatus: 'PASS',
  runtimeHttpResult: 'HTTP_OK',
  releaseGateStatus: 'PASS',
  releaseGateWarnings: [],
  releaseGateErrors: [],
  evidenceValidationStatus: 'PASS',
  portabilityStatus: 'PASS',
  portabilityWarnings: [],
  missingEvidenceFiles: [],
  corruptFile: null,
  summaryCorruption: null,
  artifactVersion: `fixture-${fixtureId}`,
  artifactSha256: null,
  artifactPath: null,
  manifestPath: null,
  outputDir: dirs.output,
  stateDir: dirs.state,
  artifactDir: dirs.artifact,
  evidenceDir: dirs.evidence,
  runDir: dirs.root,
};

switch (fixtureId) {
  case 'pass':
    break;
  case 'pass-with-warnings':
    plan.skipHttp = true;
    plan.stageStatuses.runtimeValidation = 'PASS_WITH_WARNINGS';
    plan.stageStatuses.evidenceValidation = 'PASS_WITH_WARNINGS';
    plan.runtimeSummaryStatus = 'PASS_WITH_WARNINGS';
    plan.runtimeWarnings = ['HTTP validation was intentionally skipped'];
    plan.runtimeHttpStatus = 'SKIPPED';
    plan.runtimeHttpResult = 'HTTP_SKIPPED';
    plan.releaseGateWarnings = ['HTTP validation was intentionally skipped'];
    break;
  case 'fail-checksum':
    plan.stageStatuses.releaseVerification = 'FAIL';
    plan.stageExitCodes.releaseVerification = 1;
    plan.releaseGateErrors = ['checksum mismatch'];
    break;
  case 'fail-runtime':
    plan.stageStatuses.runtimeValidation = 'FAIL';
    plan.stageExitCodes.runtimeValidation = 17;
    plan.runtimeSummaryStatus = 'FAIL';
    plan.runtimeErrors = ['runtime validation failed'];
    break;
  case 'fail-gate':
    plan.stageStatuses.releaseGate = 'FAIL';
    plan.stageExitCodes.releaseGate = 16;
    plan.releaseGateStatus = 'FAIL';
    plan.releaseGateErrors = ['policy rejected promotion'];
    break;
  case 'blocked-missing-evidence':
    plan.stageStatuses.evidenceValidation = 'BLOCKED';
    plan.stageExitCodes.evidenceValidation = 17;
    plan.missingEvidenceFiles = ['runtime-summary.json'];
    break;
  case 'blocked-invalid-contract':
    plan.stageStatuses.releaseVerification = 'PASS';
    plan.stageExitCodes.releaseVerification = 19;
    plan.releaseGateErrors = ['release verification contract mismatch'];
    break;
  case 'blocked-unknown-status':
    plan.stageStatuses.releaseVerification = 'SUCCESS';
    plan.stageExitCodes.releaseVerification = 0;
    break;
  case 'blocked-invalid-json':
    plan.stageStatuses.evidenceValidation = 'BLOCKED';
    plan.stageExitCodes.evidenceValidation = 17;
    plan.corruptFile = 'evidence-validation.json';
    break;
  case 'blocked-correlation-mismatch':
    plan.stageCorrelations.parentCorrelationId = `consolidation-20260101T000000Z-${commit}-mismatch`;
    plan.stageCorrelations.sourceCorrelationId = `consolidation-20260101T000000Z-${commit}-upstream`;
    break;
  case 'skipped-without-reason':
    plan.stageStatuses.artifactBuild = 'PASS';
    plan.stageStatuses.releasePackage = 'SKIPPED';
    plan.stageExitCodes.releasePackage = 0;
    plan.stageJustifications.releasePackage = null;
    break;
  case 'strict-warning':
    plan.strict = true;
    plan.skipHttp = true;
    plan.stageStatuses.runtimeValidation = 'PASS_WITH_WARNINGS';
    plan.stageStatuses.evidenceValidation = 'PASS_WITH_WARNINGS';
    plan.runtimeSummaryStatus = 'PASS_WITH_WARNINGS';
    plan.runtimeWarnings = ['HTTP validation was intentionally skipped'];
    plan.runtimeHttpStatus = 'SKIPPED';
    plan.runtimeHttpResult = 'HTTP_SKIPPED';
    plan.releaseGateWarnings = ['HTTP validation was intentionally skipped'];
    break;
  default:
    throw new Error(`unknown fixture id: ${fixtureId}`);
}

const artifactDir = dirs.artifact;
const distDir = path.join(artifactDir, 'dist');
ensureDir(distDir);
fs.writeFileSync(path.join(distDir, 'index.html'), '<!doctype html><html><body>FINQZ fixture</body></html>\n');
fs.writeFileSync(path.join(artifactDir, 'VERSION'), `${plan.artifactVersion}\n`);
writeJson(path.join(artifactDir, 'build-info.json'), {
  os: os.platform(),
  node: process.version,
  npm: (spawnSync('npm', ['--version'], { encoding: 'utf8' }).stdout || '').trim() || 'unknown',
  branch,
  commit,
  createdAt: fixedInstant,
  builder: 'tests/pipeline-consolidation/fixture-builder.sh',
  vite: 'fixture',
});

const manifest = {
  application: 'FINQZ PRO Enterprise',
  artifactVersion: plan.artifactVersion,
  environment: plan.environment,
  branch,
  commit,
  release: plan.artifactVersion,
  createdAt: fixedInstant,
  frontend: {
    framework: 'react',
    bundler: 'vite',
  },
  backend: {
    image: 'finqz-pro/backend:fixture',
  },
};
writeJson(path.join(artifactDir, 'manifest.json'), manifest);
fs.writeFileSync(path.join(artifactDir, 'release-notes.md'), `# Fixture ${fixtureId}\n`);

const tarballPath = path.join(artifactDir, `frontend-${commit}.tar.gz`);
fs.writeFileSync(
  tarballPath,
  [
    'FINQZ fixture artifact',
    `fixture=${fixtureId}`,
    `commit=${commit}`,
    `branch=${branch}`,
    `createdAt=${fixedInstant}`,
    '',
  ].join('\n'),
);

const checksumFiles = fs.readdirSync(artifactDir)
  .filter((name) => name !== 'checksums.sha256')
  .filter((name) => fs.statSync(path.join(artifactDir, name)).isFile())
  .sort();
const checksumLines = checksumFiles.map((name) => `${sha256(path.join(artifactDir, name))}  ${name}`);
fs.writeFileSync(path.join(artifactDir, 'checksums.sha256'), `${checksumLines.join('\n')}\n`);

plan.artifactPath = placeholder(`artifact/frontend-${commit}.tar.gz`);
plan.manifestPath = placeholder('artifact/manifest.json');
plan.artifactSha256 = sha256(tarballPath);

const stageTemplates = [
  ['artifactBuild', 'scripts/build/build-frontend.sh'],
  ['releasePackage', 'scripts/release/package-release.sh'],
  ['releaseVerification', 'scripts/release/verify-release.sh'],
  ['deployDryRun', 'scripts/deploy/deploy-engine.sh'],
  ['runtimeValidation', 'scripts/runtime/runtime-validator.sh'],
  ['releaseGate', 'scripts/gate/release-gate.sh'],
  ['evidenceValidation', 'scripts/consolidation/evidence-validator.sh'],
  ['portabilityValidation', 'scripts/consolidation/portability-validator.sh'],
];

for (const [stage, component] of stageTemplates) {
  const status = plan.stageStatuses[stage];
  const exitCode = plan.stageExitCodes[stage] ?? (status === 'FAIL' || status === 'BLOCKED' ? 17 : 0);
  const record = {
    contractVersion: '1.0.0',
    correlationId: plan.stageCorrelations.correlationId,
    parentCorrelationId: plan.stageCorrelations.parentCorrelationId,
    sourceCorrelationId: plan.stageCorrelations.sourceCorrelationId,
    stage,
    component,
    status,
    exitCode,
    startedAt: fixedInstant,
    finishedAt: fixedInstant,
    durationMs: 0,
    required: true,
    skipped: status === 'SKIPPED',
    justification: plan.stageJustifications[stage] ?? null,
    warnings: [],
    errors: [],
    evidence: [],
    outputDir: placeholder('output'),
    logFile: placeholder(`${stage}.log`),
    notes: status === 'SKIPPED' && plan.stageJustifications[stage] ? [plan.stageJustifications[stage]] : [],
    stdout: '',
    stderr: '',
    command: `bash ${component}`,
  };

  if (stage === 'releaseVerification') {
    record.evidence = [
      relativeFixturePath('artifact/manifest.json'),
      relativeFixturePath('artifact/build-info.json'),
      relativeFixturePath('artifact/release-notes.md'),
      relativeFixturePath('artifact/VERSION'),
      relativeFixturePath('artifact/checksums.sha256'),
    ];
  } else if (stage === 'artifactBuild') {
    record.evidence = [
      relativeFixturePath('artifact/dist/index.html'),
      relativeFixturePath('artifact/build-info.json'),
      relativeFixturePath('artifact/VERSION'),
    ];
  } else if (stage === 'releasePackage') {
    record.evidence = [
      relativeFixturePath(`artifact/frontend-${commit}.tar.gz`),
      relativeFixturePath('artifact/checksums.sha256'),
      relativeFixturePath('artifact/manifest.json'),
    ];
  } else if (stage === 'deployDryRun') {
    record.evidence = [
      relativeFixturePath('output/runtime-check.json'),
      relativeFixturePath('output/artifact-validation.json'),
      relativeFixturePath('output/dry-run.json'),
      relativeFixturePath('output/deploy-engine-report.md'),
    ];
  } else if (stage === 'runtimeValidation') {
    record.evidence = [
      relativeFixturePath('output/runtime-summary.json'),
      relativeFixturePath('output/runtime-report.md'),
      relativeFixturePath('output/frontend-validation.json'),
      relativeFixturePath('output/bundle-validation.json'),
      relativeFixturePath('output/http-validation.json'),
      relativeFixturePath('output/security-validation.json'),
      relativeFixturePath('output/compatibility-validation.json'),
    ];
  } else if (stage === 'releaseGate') {
    record.evidence = [
      relativeFixturePath('output/stage-results.json'),
      relativeFixturePath('output/policy-evaluation.json'),
      relativeFixturePath('output/execution-metadata.json'),
      relativeFixturePath('output/release-gate-summary.json'),
      relativeFixturePath('output/release-gate-report.md'),
    ];
  }

  writeJson(path.join(dirs.state, 'stage-records', `${stage}.json`), record);
}

const runtimeSummary = {
  status: plan.runtimeSummaryStatus,
  timestamp: fixedInstant,
  commit,
  branch,
  artefato: plan.artifactPath,
  resultado: plan.runtimeSummaryStatus === 'FAIL' ? 'RUNTIME_FAILED' : plan.runtimeSummaryStatus === 'PASS_WITH_WARNINGS' ? 'RUNTIME_OK' : 'RUNTIME_OK',
  erros: plan.runtimeErrors,
  avisos: plan.runtimeWarnings,
  frontend: plan.runtimeSummaryStatus,
  bundle: plan.runtimeSummaryStatus,
  http: {
    status: plan.runtimeHttpStatus,
    resultado: plan.runtimeHttpResult,
  },
  security: 'PASS',
  compatibility: 'PASS',
};
writeJson(path.join(dirs.output, 'runtime-summary.json'), runtimeSummary);
fs.writeFileSync(path.join(dirs.output, 'runtime-report.md'), `# Runtime report for ${fixtureId}\n`);
writeJson(path.join(dirs.output, 'frontend-validation.json'), {
  status: plan.runtimeSummaryStatus === 'FAIL' ? 'FAIL' : 'PASS',
  resultado: 'FRONTEND_OK',
  erros: [],
  avisos: [],
});
writeJson(path.join(dirs.output, 'bundle-validation.json'), {
  status: plan.runtimeSummaryStatus === 'FAIL' ? 'FAIL' : 'PASS',
  resultado: 'BUNDLE_OK',
  erros: [],
  avisos: [],
});
writeJson(path.join(dirs.output, 'http-validation.json'), {
  status: plan.runtimeHttpStatus,
  resultado: plan.runtimeHttpResult,
  erros: [],
  avisos: plan.runtimeWarnings.slice(),
});
writeJson(path.join(dirs.output, 'security-validation.json'), {
  status: 'PASS',
  resultado: 'SECURITY_OK',
  erros: [],
  avisos: [],
});
writeJson(path.join(dirs.output, 'compatibility-validation.json'), {
  status: 'PASS',
  resultado: 'COMPATIBILITY_OK',
  erros: [],
  avisos: [],
});

writeJson(path.join(dirs.output, 'runtime-check.json'), {
  status: 'PASS',
  resultado: 'RUNTIME_OK',
  artefato: plan.artifactPath,
  avisos: [],
  erros: [],
});
writeJson(path.join(dirs.output, 'artifact-validation.json'), {
  status: 'PASS',
  resultado: 'SMOKE_OK',
  artefato: plan.artifactPath,
  avisos: [],
  erros: [],
});
writeJson(path.join(dirs.output, 'dry-run.json'), {
  status: 'SUCCESS',
  resultado: plan.releaseGateStatus === 'FAIL' ? 'VALIDATION_FAILED' : 'DRY_RUN_COMPLETED',
  artefato: plan.artifactPath,
  erros: plan.releaseGateErrors,
  avisos: plan.releaseGateWarnings,
});
fs.writeFileSync(path.join(dirs.output, 'deploy-engine-report.md'), `# Deploy report for ${fixtureId}\n`);

writeJson(path.join(dirs.output, 'stage-results.json'), {
  releaseGateVersion: '1.0.0',
  correlationId: `gate-20260101T000000Z-${commit}`,
  environment: plan.environment,
  dryRun: true,
  strict: plan.strict,
  explain: false,
  skipHttp: plan.skipHttp,
  startedAt: fixedInstant,
  finishedAt: fixedInstant,
  durationMs: 0,
  git: {
    branch,
    commit,
    treeDirty: false,
  },
  artifact: {
    path: plan.artifactPath,
    sha256: plan.artifactSha256,
    version: plan.artifactVersion,
  },
  policy: {
    path: placeholder('release/policies/release-gate-policy.json'),
    version: '1.0.0',
    hash: 'fixture',
    allowWarnings: true,
    allowHttpSkipped: true,
    requireCleanGitTree: false,
    requiredStages: ['releaseVerification', 'deployDryRun', 'runtimeValidation'],
  },
  stages: {
    releaseVerification: {
      stage: 'releaseVerification',
      status: plan.stageStatuses.releaseVerification,
      exitCode: plan.stageExitCodes.releaseVerification,
      startedAt: fixedInstant,
      finishedAt: fixedInstant,
      durationMs: 0,
      warnings: [],
      errors: plan.releaseGateErrors,
    },
    deployDryRun: {
      stage: 'deployDryRun',
      status: plan.stageStatuses.deployDryRun,
      exitCode: plan.stageExitCodes.deployDryRun,
      startedAt: fixedInstant,
      finishedAt: fixedInstant,
      durationMs: 0,
      warnings: [],
      errors: [],
    },
    runtimeValidation: {
      stage: 'runtimeValidation',
      status: plan.stageStatuses.runtimeValidation,
      exitCode: plan.stageExitCodes.runtimeValidation,
      startedAt: fixedInstant,
      finishedAt: fixedInstant,
      durationMs: 0,
      warnings: plan.runtimeWarnings,
      errors: plan.runtimeErrors,
    },
  },
  warnings: plan.releaseGateWarnings.slice(),
  errors: plan.releaseGateErrors.slice(),
  evidenceIntegrity: {
    status: 'PASS',
    missingStages: [],
    invalidFiles: [],
    errors: [],
  },
});

writeJson(path.join(dirs.output, 'policy-evaluation.json'), {
  releaseGateVersion: '1.0.0',
  correlationId: `gate-20260101T000000Z-${commit}`,
  status: plan.releaseGateStatus,
  environment: plan.environment,
  dryRun: true,
  strict: plan.strict,
  explain: false,
  skipHttp: plan.skipHttp,
  warnings: plan.releaseGateWarnings.slice(),
  errors: plan.releaseGateErrors.slice(),
  decisionReasons: plan.releaseGateErrors.length > 0 ? plan.releaseGateErrors : ['all checks passed'],
  policy: {
    version: '1.0.0',
    hash: 'fixture',
    allowWarnings: true,
    allowHttpSkipped: true,
    requireCleanGitTree: false,
    requiredStages: ['releaseVerification', 'deployDryRun', 'runtimeValidation'],
  },
});

writeJson(path.join(dirs.output, 'release-gate-summary.json'), {
  releaseGateVersion: '1.0.0',
  correlationId: `gate-20260101T000000Z-${commit}`,
  status: plan.releaseGateStatus,
  environment: plan.environment,
  dryRun: true,
  strict: plan.strict,
  explain: false,
  skipHttp: plan.skipHttp,
  startedAt: fixedInstant,
  finishedAt: fixedInstant,
  durationMs: 0,
  git: {
    branch,
    commit,
    treeDirty: false,
  },
  artifact: {
    path: plan.artifactPath,
    sha256: plan.artifactSha256,
    version: plan.artifactVersion,
  },
  stages: {
    releaseVerification: plan.stageStatuses.releaseVerification,
    deployDryRun: plan.stageStatuses.deployDryRun,
    runtimeValidation: plan.stageStatuses.runtimeValidation,
  },
  warnings: plan.releaseGateWarnings.slice(),
  errors: plan.releaseGateErrors.slice(),
  decisionReasons: plan.releaseGateErrors.length > 0 ? plan.releaseGateErrors : ['all checks passed'],
  policy: {
    path: placeholder('release/policies/release-gate-policy.json'),
    version: '1.0.0',
    hash: 'fixture',
    allowWarnings: true,
    allowHttpSkipped: true,
    requireCleanGitTree: false,
    requiredStages: ['releaseVerification', 'deployDryRun', 'runtimeValidation'],
  },
  evidence: {
    directory: placeholder('output'),
    stageResultsPath: placeholder('output/stage-results.json'),
    policyEvaluationPath: placeholder('output/policy-evaluation.json'),
    executionMetadataPath: placeholder('output/execution-metadata.json'),
    logs: {
      releaseVerification: placeholder('release-verification.log'),
      deployDryRun: placeholder('deploy-dry-run.log'),
      runtimeValidation: placeholder('runtime-validation.log'),
    },
  },
  nextAction: plan.releaseGateStatus === 'PASS'
    ? 'Pipeline ready.'
    : plan.releaseGateStatus === 'PASS_WITH_WARNINGS'
      ? 'Review warnings.'
      : 'Fix blocking issues.',
});
fs.writeFileSync(path.join(dirs.output, 'release-gate-report.md'), `# Release gate report for ${fixtureId}\n`);

const executionMetadata = {
  consolidationVersion: '1.0.0',
  correlationId: plan.stageCorrelations.correlationId,
  parentCorrelationId: null,
  startedAt: fixedInstant,
  finishedAt: fixedInstant,
  durationMs: 0,
  environment: plan.environment,
  dryRun: true,
  strict: plan.strict,
  skipHttp: plan.skipHttp,
  explain: false,
  system: {
    os: '<SANITIZED>/os',
    arch: 'x64',
    timezone: 'UTC',
    shell: '<SANITIZED>/shell',
  },
  git: {
    branch,
    commit,
    treeDirty: false,
  },
  artifact: {
    path: plan.artifactPath,
    sha256: plan.artifactSha256,
    version: plan.artifactVersion,
    manifest: plan.manifestPath,
  },
  policy: {
    path: placeholder('release/policies/release-gate-policy.json'),
  },
  sourceCorrelationIds: {
    releaseGate: `gate-20260101T000000Z-${commit}`,
  },
  stageLogs: {
    pipeline: placeholder('pipeline.log'),
    releaseVerification: placeholder('release-verification.log'),
    deployDryRun: placeholder('deploy-dry-run.log'),
    runtimeValidation: placeholder('runtime-validation.log'),
    releaseGate: placeholder('release-gate.log'),
  },
  stageDirectories: {
    state: placeholder('state'),
    deploy: placeholder('output'),
    runtime: placeholder('output'),
    gate: placeholder('output'),
  },
  toolVersions: {
    bash: 'fixture',
    git: 'fixture',
    node: process.version,
    npm: 'fixture',
    sha256sum: 'fixture',
  },
};
writeJson(path.join(dirs.output, 'execution-metadata.json'), executionMetadata);

// Keep the portability scan clean by storing placeholders only in stage records and execution metadata.
writeJson(path.join(fixtureRunDir, 'fixture-build.json'), {
  fixtureVersion: plan.fixtureVersion,
  id: fixtureId,
  description: plan.description,
  environment: plan.environment,
  strict: plan.strict,
  skipHttp: plan.skipHttp,
  expected: plan.expected,
  summaryRequired: plan.summaryRequired,
  runDir: fixtureRunDir,
  stateDir: dirs.state,
  outputDir: dirs.output,
  artifactDir: artifactDir,
  artifactPath: path.join(artifactDir, `frontend-${commit}.tar.gz`),
  artifactSha256: plan.artifactSha256,
  manifestPath: path.join(artifactDir, 'manifest.json'),
  correlationId: plan.stageCorrelations.correlationId,
  stageStatuses: plan.stageStatuses,
  stageExitCodes: plan.stageExitCodes,
  stageCorrelations: plan.stageCorrelations,
  corruptFile: plan.corruptFile,
  missingEvidenceFiles: plan.missingEvidenceFiles,
});

for (const relativeFile of plan.missingEvidenceFiles) {
  const absoluteFile = path.join(dirs.output, relativeFile);
  if (fs.existsSync(absoluteFile)) {
    fs.rmSync(absoluteFile, { force: true });
  }
}

if (plan.corruptFile) {
  const corruptTarget = path.join(dirs.output, plan.corruptFile);
  ensureDir(path.dirname(corruptTarget));
  fs.writeFileSync(corruptTarget, '{');
}

process.stdout.write(`${JSON.stringify({
  fixtureId,
  runDir: fixtureRunDir,
  stateDir: dirs.state,
  outputDir: dirs.output,
  artifactDir,
  artifactPath: path.join(artifactDir, `frontend-${commit}.tar.gz`),
  manifestPath: path.join(artifactDir, 'manifest.json'),
  artifactSha256: plan.artifactSha256,
  artifactVersion: plan.artifactVersion,
  correlationId: plan.stageCorrelations.correlationId,
  buildPlanPath: path.join(fixtureRunDir, 'fixture-build.json'),
})}\n`);
NODE
